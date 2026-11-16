-- Live behavioral regression. Synthetic fixtures and all writes roll back.
-- Requires a database admin connection and at least one existing auth user.
BEGIN;
SET LOCAL statement_timeout = '30s';
DO $test$
DECLARE
  actor uuid;
  wa uuid := gen_random_uuid(); wb uuid := gen_random_uuid();
  ca uuid := gen_random_uuid(); cb uuid := gen_random_uuid();
  va uuid := gen_random_uuid(); vb uuid := gen_random_uuid();
  la uuid := gen_random_uuid(); lb uuid := gen_random_uuid();
  n integer; result record;
BEGIN
  SELECT id INTO actor FROM auth.users ORDER BY created_at LIMIT 1;
  IF actor IS NULL THEN RAISE EXCEPTION 'Test requires an existing auth user'; END IF;
  INSERT INTO public.workspaces(id,name,slug,owner_id,notifications_enabled)
    VALUES(wa,'Audit rollback A',wa::text,actor,false),(wb,'Audit rollback B',wb::text,actor,false);
  INSERT INTO public.workspace_members(workspace_id,user_id,role,status)
    VALUES(wa,actor,'owner','active');
  INSERT INTO public.contacts(id,workspace_id,name) VALUES(ca,wa,'Audit A'),(cb,wb,'Audit B');
  INSERT INTO public.conversations(id,workspace_id,contact_id) VALUES(va,wa,ca),(vb,wb,cb);
  INSERT INTO public.conversation_labels(id,workspace_id,name,slug)
    VALUES(la,wa,'Audit A',la::text),(lb,wb,'Audit B',lb::text);

  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n FROM public.contacts WHERE id IN(ca,cb);
  IF n <> 1 THEN RAISE EXCEPTION 'RLS must expose only the member workspace'; END IF;
  n := public.bulk_tag_conversations(ARRAY[va],ARRAY[la]);
  IF n <> 1 THEN RAISE EXCEPTION 'Same-workspace tagging must succeed'; END IF;
  BEGIN
    PERFORM public.bulk_tag_conversations(ARRAY[va,vb],ARRAY[la]);
    RAISE EXCEPTION 'Mixed-workspace conversations were accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.bulk_tag_conversations(ARRAY[va],ARRAY[lb]);
    RAISE EXCEPTION 'Cross-workspace label was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.conversation_label_assignments(workspace_id,conversation_id,label_id)
      VALUES(wa,vb,la);
    RAISE EXCEPTION 'Direct API cross-workspace assignment was accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    PERFORM public.emit_module_notification(NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}');
    RAISE EXCEPTION 'Authenticated notification injection is still executable';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF has_function_privilege('authenticated',
       'public.record_login_attempt(uuid,text,inet,text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated users can still forge login events';
  END IF;
  IF NOT has_function_privilege('service_role',
       'public.record_login_attempt(uuid,text,inet,text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Server lost login-event recording privilege';
  END IF;
  BEGIN
    PERFORM public.create_workspace_with_owner('Audit forbidden',gen_random_uuid()::text,gen_random_uuid(),NULL);
    RAISE EXCEPTION 'Foreign organization workspace creation was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.workspaces SET organization_id=gen_random_uuid() WHERE id=wa;
    RAISE EXCEPTION 'Direct workspace organization reassignment was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  -- New enterprise policies work with an ordinary Supabase JWT (no workspace_id claim).
  INSERT INTO public.contract_clauses(workspace_id,clause_code,title,category,content_text)
    VALUES(wa,wa::text,'Audit','audit','Rollback test');
  BEGIN
    INSERT INTO public.contract_clauses(workspace_id,clause_code,title,category,content_text)
      VALUES(wb,wb::text,'Audit','audit','Must be rejected');
    RAISE EXCEPTION 'Foreign enterprise write was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  -- Use a non-member identity regardless of the real fixture user's platform role.
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
  SELECT count(*) INTO n FROM public.security_events WHERE workspace_id IS NULL;
  IF n <> 0 THEN RAISE EXCEPTION 'Global security events visible to non-admin'; END IF;
  SELECT count(*) INTO n FROM public.sre_dead_letter_queue WHERE workspace_id IS NULL;
  IF n <> 0 THEN RAISE EXCEPTION 'Global dead letters visible to non-admin'; END IF;
  BEGIN
    PERFORM public.search_inbox(wa,'Audit',NULL,2147483647);
    RAISE EXCEPTION 'Non-member search was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Not allowed' THEN RAISE; END IF;
  END;

  RESET ROLE;
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM public.emit_module_notification(NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{}');
    RAISE EXCEPTION 'Anonymous notification injection is still executable';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;

  -- The server-only limiter is atomic and returns the contract consumed by the app.
  SET LOCAL ROLE service_role;
  SELECT * INTO result FROM public.enforce_rate_limit('audit:'||wa::text,1,60,wa);
  IF result.allowed IS DISTINCT FROM true THEN RAISE EXCEPTION 'First rate-limit call should pass'; END IF;
  SELECT * INTO result FROM public.enforce_rate_limit('audit:'||wa::text,1,60,wa);
  IF result.allowed IS DISTINCT FROM false THEN RAISE EXCEPTION 'Second rate-limit call should fail'; END IF;
  RESET ROLE;
END;
$test$;
SELECT 'passed: tenant reads/writes, bulk tagging, direct FK bypass, RPC grants, organization scope, enterprise JWT, platform privacy, rate limiter' AS result;
ROLLBACK;
