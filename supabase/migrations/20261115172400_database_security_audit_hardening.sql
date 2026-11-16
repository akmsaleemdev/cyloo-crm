-- Security audit 2026-11-15: privilege and tenant-boundary repairs.
-- No business rows are deleted or rewritten. Fail promptly if DDL is blocked.
SET lock_timeout = '3s';
SET statement_timeout = '60s';

ALTER FUNCTION public.is_demo_session() SET search_path = '';
ALTER FUNCTION public._system_role_for_workspace_role(public.workspace_role) SET search_path = '';
ALTER FUNCTION public._workspace_role_for_permission_role(text) SET search_path = '';

-- PostgreSQL PUBLIC grants otherwise override role-specific revocations.
REVOKE ALL ON FUNCTION public.emit_module_notification(uuid,uuid,text,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.widget_broadcast(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_ai_provider_vault_key(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_rate_limit(text,integer,integer,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emit_module_notification(uuid,uuid,text,text,text,text,text,jsonb), public.widget_broadcast(uuid,text), public.get_ai_provider_vault_key(uuid), public.enforce_rate_limit(text,integer,integer,uuid) TO service_role;

-- Trigger invocation does not require the invoking client to have EXECUTE.
DO $audit$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
      AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.signature);
  END LOOP;
END $audit$;

REVOKE EXECUTE ON FUNCTION public.can_review_plugin(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_review_plugin(uuid,uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_workspace_member_directory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_member_directory(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_organization_member_directory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_member_directory(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.set_workspace_ai_provider_byok(uuid,ai_provider_kind,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_workspace_ai_provider_byok(uuid,ai_provider_kind,text,text,text,text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.delete_workspace_ai_provider_byok(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_workspace_ai_provider_byok(uuid,uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(_name text, _slug text, _organization_id uuid DEFAULT NULL::uuid, _description text DEFAULT NULL::text)
 RETURNS workspaces
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _ws public.workspaces;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _organization_id IS NOT NULL AND NOT public.has_org_role(
    _organization_id, _uid, ARRAY['owner','admin']::public.org_role[]
  ) THEN
    RAISE EXCEPTION 'Organization administration required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.workspaces (name, slug, owner_id, organization_id, description)
  VALUES (_name, _slug, _uid, _organization_id, _description)
  RETURNING * INTO _ws;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (_ws.id, _uid, 'owner');

  RETURN _ws;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_tag_conversations(_ids uuid[], _label_ids uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _ws uuid; _n integer := 0;
BEGIN
  IF coalesce(cardinality(_ids), 0) = 0 OR coalesce(cardinality(_label_ids), 0) = 0 THEN RETURN 0; END IF;
  IF cardinality(_ids) > 200 OR cardinality(_label_ids) > 50 THEN
    RAISE EXCEPTION 'Bulk tagging limit exceeded' USING ERRCODE = '22023';
  END IF;
  SELECT workspace_id INTO _ws FROM public.conversations WHERE id = _ids[1];
  IF _ws IS NULL THEN RETURN 0; END IF;
  IF NOT public.is_workspace_member(_ws, auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;

  IF EXISTS (SELECT 1 FROM unnest(_ids) AS requested(id)
    WHERE NOT EXISTS (SELECT 1 FROM public.conversations c
      WHERE c.id = requested.id AND c.workspace_id = _ws AND c.deleted_at IS NULL))
    OR EXISTS (SELECT 1 FROM unnest(_label_ids) AS requested(id)
    WHERE NOT EXISTS (SELECT 1 FROM public.conversation_labels l
      WHERE l.id = requested.id AND l.workspace_id = _ws)) THEN
    RAISE EXCEPTION 'Every conversation and label must belong to the workspace' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.conversation_label_assignments(conversation_id, label_id, workspace_id, assigned_by)
  SELECT c, l, _ws, auth.uid()
    FROM unnest(_ids) c CROSS JOIN unnest(_label_ids) l
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END $function$;

CREATE OR REPLACE FUNCTION public.assign_conversation(_conversation_id uuid, _assignee uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _ws uuid;
BEGIN
  SELECT workspace_id INTO _ws FROM public.conversations WHERE id = _conversation_id;
  IF _ws IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  -- Verify the caller is a member of the workspace
  IF NOT public.is_workspace_member(_ws, auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF _assignee IS NOT NULL AND NOT public.is_workspace_member(_ws, _assignee) THEN
    RAISE EXCEPTION 'Assignee must be an active workspace member' USING ERRCODE = '42501';
  END IF;
  UPDATE public.conversations
  SET
    assigned_to = _assignee,
    assigned_at = now(),
    updated_at = now(),
    handoff_state = 'human'
  WHERE id = _conversation_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_update_conversations(_ids uuid[], _patch jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _ws uuid; _n integer := 0;
BEGIN
  IF coalesce(cardinality(_ids), 0) = 0 THEN RETURN 0; END IF;
  IF cardinality(_ids) > 200 THEN
    RAISE EXCEPTION 'Bulk update limit exceeded' USING ERRCODE = '22023';
  END IF;
  SELECT workspace_id INTO _ws FROM public.conversations WHERE id = _ids[1];
  IF _ws IS NULL THEN RETURN 0; END IF;
  IF NOT public.is_workspace_member(_ws, auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;

  IF NULLIF(_patch->>'assigned_to','') IS NOT NULL AND NOT public.is_workspace_member(
    _ws, (_patch->>'assigned_to')::uuid
  ) THEN
    RAISE EXCEPTION 'Assignee must be an active workspace member' USING ERRCODE = '42501';
  END IF;
  UPDATE public.conversations c
    SET
      status = COALESCE((_patch->>'status')::conversation_status, c.status),
      priority = COALESCE((_patch->>'priority')::conversation_priority, c.priority),
      assigned_to = CASE WHEN _patch ? 'assigned_to' THEN NULLIF(_patch->>'assigned_to','')::uuid ELSE c.assigned_to END,
      is_archived = COALESCE((_patch->>'is_archived')::boolean, c.is_archived),
      deleted_at = CASE WHEN (_patch->>'delete')::boolean THEN now() ELSE c.deleted_at END,
      updated_at = now()
    WHERE c.id = ANY(_ids) AND c.workspace_id = _ws;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END $function$;

CREATE OR REPLACE FUNCTION public.search_inbox(_workspace_id uuid, _q text, _kinds text[] DEFAULT ARRAY['conversation'::text, 'message'::text, 'contact'::text, 'attachment'::text], _limit integer DEFAULT 25)
 RETURNS TABLE(kind text, id uuid, conversation_id uuid, title text, snippet text, score real, created_at timestamp with time zone, meta jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  _limit := LEAST(GREATEST(COALESCE(_limit, 25), 1), 100);
  IF length(_q) > 200 THEN
    RAISE EXCEPTION 'Search query too long' USING ERRCODE = '22023';
  END IF;
  IF NOT public.is_workspace_member(_workspace_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF _q IS NULL OR length(trim(_q)) = 0 THEN RETURN; END IF;

  RETURN QUERY
  (
    SELECT 'contact'::text, c.id, NULL::uuid,
      c.display_name, coalesce(c.email, c.phone, ''),
      GREATEST(
        extensions.similarity(coalesce(c.display_name,''), _q),
        extensions.similarity(coalesce(c.email,''), _q),
        extensions.similarity(coalesce(c.phone,''), _q)
      )::real,
      c.created_at,
      jsonb_build_object('email', c.email, 'phone', c.phone, 'avatar_url', c.avatar_url)
    FROM public.contacts c
    WHERE c.workspace_id = _workspace_id
      AND 'contact' = ANY(_kinds)
      AND (
        c.display_name ILIKE '%' || _q || '%'
        OR c.email ILIKE '%' || _q || '%'
        OR c.phone ILIKE '%' || _q || '%'
      )
    ORDER BY 6 DESC
    LIMIT _limit
  )
  UNION ALL
  (
    SELECT 'conversation'::text, conv.id, conv.id,
      coalesce(conv.subject, ct.display_name, 'Conversation'),
      coalesce(conv.last_message_preview, ''),
      extensions.similarity(coalesce(conv.subject,'') || ' ' || coalesce(conv.last_message_preview,''), _q)::real,
      conv.created_at,
      jsonb_build_object('status', conv.status, 'priority', conv.priority, 'contact_id', conv.contact_id, 'inbox_id', conv.inbox_id)
    FROM public.conversations conv
    LEFT JOIN public.contacts ct ON ct.id = conv.contact_id AND ct.workspace_id = conv.workspace_id
    WHERE conv.workspace_id = _workspace_id
      AND conv.deleted_at IS NULL
      AND 'conversation' = ANY(_kinds)
      AND (
        conv.subject ILIKE '%' || _q || '%'
        OR conv.last_message_preview ILIKE '%' || _q || '%'
      )
    ORDER BY 6 DESC
    LIMIT _limit
  )
  UNION ALL
  (
    SELECT 'message'::text, m.id, m.conversation_id,
      left(coalesce(m.body,''), 80),
      coalesce(m.body,''),
      extensions.similarity(coalesce(m.body,''), _q)::real,
      m.created_at,
      jsonb_build_object('direction', m.direction, 'message_type', m.message_type)
    FROM public.messages m
    JOIN public.conversations conv ON conv.id = m.conversation_id
    WHERE conv.workspace_id = _workspace_id
      AND m.workspace_id = _workspace_id
      AND m.deleted_at IS NULL
      AND conv.deleted_at IS NULL
      AND 'message' = ANY(_kinds)
      AND m.body ILIKE '%' || _q || '%'
    ORDER BY 6 DESC
    LIMIT _limit
  )
  UNION ALL
  (
    SELECT 'attachment'::text, ma.id, m.conversation_id,
      coalesce(ma.file_name, 'Attachment'),
      coalesce(ma.mime_type, ''),
      extensions.similarity(coalesce(ma.file_name,''), _q)::real,
      ma.created_at,
      jsonb_build_object('mime_type', ma.mime_type, 'size', ma.size_bytes, 'url', ma.url)
    FROM public.message_attachments ma
    JOIN public.messages m ON m.id = ma.message_id
    JOIN public.conversations conv ON conv.id = m.conversation_id
    WHERE conv.workspace_id = _workspace_id
      AND ma.workspace_id = _workspace_id
      AND m.workspace_id = _workspace_id
      AND conv.deleted_at IS NULL
      AND ma.is_deleted = false
      AND 'attachment' = ANY(_kinds)
      AND ma.file_name ILIKE '%' || _q || '%'
    ORDER BY 6 DESC
    LIMIT _limit
  );
END $function$;

CREATE OR REPLACE FUNCTION public.log_security_event(_workspace_id uuid, _event_type text, _severity text DEFAULT 'info'::text, _resource_type text DEFAULT NULL::text, _resource_id text DEFAULT NULL::text, _data jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _id uuid; _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL AND coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  -- Signed-in callers may only log events into workspaces they belong to.
  IF _caller IS NOT NULL AND _workspace_id IS NOT NULL
     AND NOT public.is_workspace_member(_workspace_id, _caller) THEN
    RAISE EXCEPTION 'log_security_event: not a member of workspace %', _workspace_id
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.security_events(workspace_id, actor_id, severity, event_type, resource_type, resource_id, data)
  VALUES (_workspace_id, _caller, _severity, _event_type, _resource_type, _resource_id, COALESCE(_data,'{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END $function$;

-- Platform events are not tenant-public. Client events remain self-attributed.
ALTER POLICY "ws admins read security events" ON public.security_events
  USING (public.is_super_admin((select auth.uid()))
    OR (workspace_id IS NOT NULL AND public.has_workspace_role(workspace_id, (select auth.uid()), ARRAY['owner','admin']::public.workspace_role[])));
ALTER POLICY "auth insert security events" ON public.security_events
  WITH CHECK (actor_id = (select auth.uid())
    AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id, (select auth.uid()))));
ALTER POLICY "health_probes_read" ON public.sre_webhook_health_probes
  USING (public.is_super_admin((select auth.uid())));
ALTER POLICY "dlq_workspace_select" ON public.sre_dead_letter_queue
  USING (public.is_super_admin((select auth.uid()))
    OR public.has_workspace_role(workspace_id, (select auth.uid()), ARRAY['owner','admin']::public.workspace_role[]));
ALTER POLICY "dlq_workspace_write" ON public.sre_dead_letter_queue
  USING (public.is_super_admin((select auth.uid()))
    OR public.has_workspace_role(workspace_id, (select auth.uid()), ARRAY['owner','admin']::public.workspace_role[]))
  WITH CHECK (public.is_super_admin((select auth.uid()))
    OR public.has_workspace_role(workspace_id, (select auth.uid()), ARRAY['owner','admin']::public.workspace_role[]));

-- New functions created by migrations require explicit client grants.
-- A schema-level revoke alone cannot remove PostgreSQL's global PUBLIC default.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
NOTIFY pgrst, 'reload schema';
