SET lock_timeout = '3s';
SET statement_timeout = '30s';
CREATE OR REPLACE FUNCTION public.set_workspace_member_permission_role(
  _workspace_id uuid, _user_id uuid, _role_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _org_id uuid;
  _role_key text;
  _caller_role public.workspace_role;
  _workspace_role public.workspace_role;
BEGIN
  SELECT organization_id INTO _org_id
  FROM public.workspaces WHERE id = _workspace_id;
  SELECT role INTO _caller_role
  FROM public.workspace_members
  WHERE workspace_id = _workspace_id
    AND user_id = auth.uid() AND status = 'active';

  -- SQL NULL must deny. Without this explicit check, a caller with no
  -- membership bypasses NOT IN via three-valued logic.
  IF _caller_role IS NULL OR _caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only workspace owners and admins can assign roles'
      USING ERRCODE = '42501';
  END IF;

  SELECT key INTO _role_key FROM public.roles
  WHERE id = _role_id AND key <> 'owner'
    AND (organization_id IS NULL OR organization_id = _org_id);
  IF _role_key IS NULL THEN
    RAISE EXCEPTION 'Role is not available in this organization';
  END IF;
  IF _role_key = 'admin' AND _caller_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'Only the workspace owner can assign Admin'
      USING ERRCODE = '42501';
  END IF;
  _workspace_role := public._workspace_role_for_permission_role(_role_key);

  UPDATE public.workspace_members SET role = _workspace_role
  WHERE workspace_id = _workspace_id AND user_id = _user_id AND role <> 'owner';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace member not found or owner role cannot be changed';
  END IF;

  DELETE FROM public.user_role_assignments
  WHERE user_id = _user_id AND workspace_id = _workspace_id;
  INSERT INTO public.user_role_assignments
    (user_id, role_id, organization_id, workspace_id, granted_by)
  VALUES (_user_id, _role_id, _org_id, _workspace_id, auth.uid());
END;
$function$;
RESET lock_timeout;
RESET statement_timeout;
