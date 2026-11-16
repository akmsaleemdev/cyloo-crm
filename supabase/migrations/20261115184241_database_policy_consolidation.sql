-- Consolidate only PERMISSIVE policies with exactly the same target role array.
-- ALL expands to its four commands. Roles, restrictive policies and the
-- independent USING / WITH CHECK predicates retain PostgreSQL OR semantics.
-- NULL WITH CHECK falls back to USING; a missing predicate permits TRUE.
-- No policy is widened to PUBLIC or to a different role.
SET lock_timeout = '3s';
SET statement_timeout = '90s';
DO $merge$
DECLARE
  grp record; pol record; target_cmd text; use_expr text; check_expr text;
  role_sql text; policy_sql text; target_name text;
  source_policies jsonb;
BEGIN
  FOR grp IN
    SELECT schemaname, tablename, roles
    FROM pg_policies
    WHERE schemaname IN ('public','storage','realtime')
      AND permissive = 'PERMISSIVE'
    GROUP BY schemaname,tablename,roles
    HAVING count(*) FILTER (WHERE cmd IN ('ALL','SELECT')) > 1
        OR count(*) FILTER (WHERE cmd IN ('ALL','INSERT')) > 1
        OR count(*) FILTER (WHERE cmd IN ('ALL','UPDATE')) > 1
        OR count(*) FILTER (WHERE cmd IN ('ALL','DELETE')) > 1
    ORDER BY schemaname,tablename,roles
  LOOP
    SELECT jsonb_agg(to_jsonb(p) ORDER BY policyname) INTO source_policies
      FROM pg_policies p WHERE p.schemaname=grp.schemaname
        AND p.tablename=grp.tablename AND p.roles=grp.roles
        AND p.permissive='PERMISSIVE';
    SELECT string_agg(CASE WHEN r='public' THEN 'PUBLIC' ELSE quote_ident(r) END, ', ' ORDER BY r)
      INTO role_sql FROM unnest(grp.roles) r;
    -- Drop only this group's originals. Migration is transactional.
    FOR pol IN SELECT * FROM jsonb_to_recordset(source_policies) AS p(policyname text)
    LOOP
      EXECUTE format('DROP POLICY %I ON %I.%I',pol.policyname,grp.schemaname,grp.tablename);
    END LOOP;
    FOREACH target_cmd IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
      SELECT string_agg(DISTINCT '(' || coalesce(p.qual,'true') || ')',' OR '
                 ORDER BY '(' || coalesce(p.qual,'true') || ')'),
             string_agg(DISTINCT '(' || coalesce(p.with_check,p.qual,'true') || ')',' OR '
                 ORDER BY '(' || coalesce(p.with_check,p.qual,'true') || ')')
        INTO use_expr,check_expr
        FROM jsonb_to_recordset(source_policies) AS p(cmd text,qual text,with_check text)
        WHERE p.cmd IN ('ALL',target_cmd);
      IF use_expr IS NULL THEN CONTINUE; END IF;
      target_name := 'audit_' || lower(target_cmd) || '_' || substr(md5(grp.roles::text),1,10);
      policy_sql := format('CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR %s TO %s',
                         target_name,grp.schemaname,grp.tablename,target_cmd,role_sql);
      IF target_cmd IN ('SELECT','UPDATE','DELETE') THEN policy_sql := policy_sql || ' USING (' || use_expr || ')'; END IF;
      IF target_cmd IN ('INSERT','UPDATE') THEN policy_sql := policy_sql || ' WITH CHECK (' || check_expr || ')'; END IF;
      EXECUTE policy_sql;
    END LOOP;
  END LOOP;
END;
$merge$;
RESET lock_timeout;
RESET statement_timeout;
