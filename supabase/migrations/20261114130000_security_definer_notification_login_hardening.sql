-- CYLOO CRM — forward-only security hardening.
-- Apply AFTER the existing 2026-11-14 migrations, in STAGING first.
-- This migration does not delete data or change the notification function body.
BEGIN;

-- Internal trigger helpers execute as their SECURITY DEFINER owner (postgres).
-- API users must not be able to invoke this unrestricted notification inserter.
REVOKE EXECUTE ON FUNCTION public.emit_module_notification(
  uuid, uuid, text, text, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emit_module_notification(
  uuid, uuid, text, text, text, text, text, jsonb
) TO service_role;

-- Preserve the existing client RPC signature and its best-effort logging.
-- Trust boundary: browser-submitted events are telemetry only. Only service_role
-- is permitted to change authoritative account_lockouts counters.
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  _user_id uuid,
  _event text,
  _ip inet DEFAULT NULL::inet,
  _user_agent text DEFAULT NULL::text,
  _device text DEFAULT NULL::text,
  _failure_reason text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_id uuid;
  v_caller uuid := auth.uid();
  v_role text := auth.role();
  v_target uuid;
BEGIN
  IF v_role = 'service_role' THEN
    -- Trusted backend may specify a target user.
    v_target := _user_id;
  ELSIF v_role = 'authenticated' AND v_caller IS NOT NULL THEN
    -- Ignore any user ID sent by the browser.
    v_target := v_caller;
  ELSE
    RAISE EXCEPTION 'record_login_attempt: authenticated or service role required'
      USING ERRCODE = '42501';
  END IF;

  IF v_target IS NULL THEN
    RAISE EXCEPTION 'record_login_attempt: no target user'
      USING ERRCODE = '22023';
  END IF;

  -- The login_history.event CHECK constraint continues to validate event names.
  INSERT INTO public.login_history (
    user_id, event, ip_address, user_agent, device, failure_reason
  ) VALUES (
    v_target, _event, _ip, _user_agent, _device, _failure_reason
  ) RETURNING id INTO v_id;

  -- ONLY trusted backend events can modify lockout state.
  -- Browser-supplied 'success' can no longer clear a lockout.
  IF v_role = 'service_role' THEN
    IF _event = 'failed' THEN
      INSERT INTO public.account_lockouts (
        user_id, failed_attempts, last_failed_at
      ) VALUES (
        v_target, 1, now()
      )
      ON CONFLICT (user_id) DO UPDATE
      SET failed_attempts = public.account_lockouts.failed_attempts + 1,
          last_failed_at = now();
    ELSIF _event = 'success' THEN
      UPDATE public.account_lockouts
         SET failed_attempts = 0,
             locked_until = NULL
       WHERE user_id = v_target;
    END IF;
  END IF;

  RETURN v_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.record_login_attempt(
  uuid, text, inet, text, text, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(
  uuid, text, inet, text, text, text
) TO authenticated, service_role;

COMMIT;
