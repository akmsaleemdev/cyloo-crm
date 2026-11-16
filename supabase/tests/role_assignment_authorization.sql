-- Regression for NULL authorization bypass in role assignment. All writes roll back.
BEGIN;
SET LOCAL statement_timeout = '30s';
DO $test$
DECLARE
  victim uuid;
  intruder uuid := gen_random_uuid();
  audit_workspace_id uuid := gen_random_uuid();
  admin_role_id uuid;
  observed_workspace_role public.workspace_role;
BEGIN
  SELECT id INTO victim FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO admin_role_id FROM public.roles
    WHERE organization_id IS NULL AND key = 'admin' LIMIT 1;
  IF victim IS NULL OR admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Regression fixtures require a real auth user and global admin role';
  END IF;
  INSERT INTO public.workspaces(id,name,slug,owner_id,notifications_enabled)
    VALUES(audit_workspace_id,'Audit role rollback',audit_workspace_id::text,victim,false);
  INSERT INTO public.workspace_members(workspace_id,user_id,role,status)
    VALUES(audit_workspace_id,victim,'agent','active');

  -- Simulate a signed-in caller who is not a workspace member. In the old
  -- function, NULL NOT IN (...) failed to deny and the admin check also fell through.
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub',intruder,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.set_workspace_member_permission_role(audit_workspace_id,victim,admin_role_id);
    RAISE EXCEPTION 'Non-member role assignment was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
  SELECT m.role INTO observed_workspace_role FROM public.workspace_members m
    WHERE m.workspace_id=audit_workspace_id AND m.user_id=victim;
  IF observed_workspace_role IS DISTINCT FROM 'agent' THEN
    RAISE EXCEPTION 'Victim role changed';
  END IF;
END;
$test$;
SELECT 'passed: non-member role assignment denied' AS result;
ROLLBACK;
