-- Stage 1: atomic server-only vCard analytics recording.
-- Do NOT deploy this migration to production until the staged API has been
-- integration-tested in an isolated Supabase project.
--
-- The existing BEFORE INSERT rate-limit trigger remains responsible for the
-- global 120 attempts/minute per card cap. That trigger may return NULL to
-- skip the INSERT, in which case we must not increment view_count.
--
-- SECURITY DEFINER is required for the server's service_role call. EXECUTE is
-- restricted explicitly so browser anon/authenticated roles cannot call it.

CREATE OR REPLACE FUNCTION public.record_public_vcard_view(
  _vcard_id uuid,
  _referrer text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  _card_id uuid;
  _view_id uuid;
BEGIN
  -- Serialize tracking against revocation and other card updates. Prevent
  -- successful insert into a card that became private during this transaction.
  SELECT v.id INTO _card_id
  FROM public.vcards AS v
  WHERE v.id = _vcard_id
    AND v.is_public IS TRUE
    AND v.revoked_at IS NULL
  FOR UPDATE;

  IF _card_id IS NULL THEN
    RETURN 'not_found';
  END IF;

  INSERT INTO public.vcard_views (vcard_id, referrer, user_agent)
  VALUES (_card_id, left(_referrer, 2048), left(_user_agent, 300))
  RETURNING id INTO _view_id;

  -- The existing BEFORE INSERT limiter can silently drop the row.
  IF _view_id IS NULL THEN
    RETURN 'throttled';
  END IF;

  UPDATE public.vcards AS v
  SET view_count = v.view_count + 1
  WHERE v.id = _card_id;

  RETURN 'recorded';
END;
$function$;

REVOKE ALL ON FUNCTION public.record_public_vcard_view(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_public_vcard_view(uuid, text, text)
  TO service_role;
