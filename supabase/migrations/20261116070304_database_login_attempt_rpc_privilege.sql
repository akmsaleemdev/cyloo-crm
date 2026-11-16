-- Login-event provenance and lockout mutation must be trusted-server-only.
-- The browser helper has no callers; authenticated clients could otherwise
-- forge a "success" event to clear their own lockout counter.
SET lock_timeout = '3s';
SET statement_timeout = '30s';
REVOKE ALL ON FUNCTION public.record_login_attempt(uuid,text,inet,text,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(uuid,text,inet,text,text,text)
  TO service_role;
RESET lock_timeout;
RESET statement_timeout;
