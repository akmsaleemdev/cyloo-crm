-- Cache statement-invariant auth helpers without changing policy roles or commands.
-- Enterprise tables use live membership, not an optional/stale workspace JWT claim.
SET lock_timeout = '3s';
SET statement_timeout = '90s';

ALTER POLICY "workspace members manage push subs" ON "public"."booking_push_subscriptions"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws members manage ticket_categories" ON "public"."ticket_categories"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_categories.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_categories.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ws members manage ticket_macros" ON "public"."ticket_macros"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_macros.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_macros.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ws members manage ticket_watchers" ON "public"."ticket_watchers"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_watchers.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_watchers.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ws members manage ticket_escalations" ON "public"."ticket_escalations"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_escalations.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_escalations.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ws members manage ticket_sla_tracking" ON "public"."ticket_sla_tracking"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_sla_tracking.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_sla_tracking.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ws members manage ticket_assets" ON "public"."ticket_assets"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_assets.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_assets.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Avatars are readable by owner or co-members" ON "storage"."objects"
  USING (((bucket_id = 'avatars'::text) AND (((storage.foldername(name))[1] = ((SELECT auth.uid()))::text) OR (EXISTS ( SELECT 1
   FROM (workspace_members me
     JOIN workspace_members them ON ((them.workspace_id = me.workspace_id)))
  WHERE ((me.user_id = (SELECT auth.uid())) AND (me.status = 'active'::member_status) AND (them.status = 'active'::member_status) AND ((them.user_id)::text = (storage.foldername(objects.name))[1])))))));
ALTER POLICY "Members read own exports files" ON "storage"."objects"
  USING (((bucket_id = 'exports'::text) AND (EXISTS ( SELECT 1
   FROM export_jobs j
  WHERE ((j.file_path = objects.name) AND is_workspace_member(j.workspace_id, (SELECT auth.uid())) AND ((j.created_by = (SELECT auth.uid())) OR (j.visibility = 'workspace'::text) OR has_workspace_role(j.workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role])))))));
ALTER POLICY "Users delete own avatar" ON "storage"."objects"
  USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "Users update own avatar" ON "storage"."objects"
  USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "Users upload own avatar" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "attachments_delete_workspace_member" ON "storage"."objects"
  USING (((bucket_id = 'attachments'::text) AND ((owner = (SELECT auth.uid())) OR is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid())))));
ALTER POLICY "attachments_insert_workspace_member" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'attachments'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "attachments_select_workspace_member" ON "storage"."objects"
  USING (((bucket_id = 'attachments'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "attachments_update_workspace_member" ON "storage"."objects"
  USING (((bucket_id = 'attachments'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))))
  WITH CHECK (((bucket_id = 'attachments'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "branding_delete" ON "storage"."objects"
  USING (((bucket_id = 'branding'::text) AND (((split_part(name, '/'::text, 1) = 'platform'::text) AND is_super_admin((SELECT auth.uid()))) OR ((split_part(name, '/'::text, 1) = 'org'::text) AND is_org_member((NULLIF(split_part(name, '/'::text, 2), ''::text))::uuid, (SELECT auth.uid()))))));
ALTER POLICY "branding_insert" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'branding'::text) AND (((split_part(name, '/'::text, 1) = 'platform'::text) AND is_super_admin((SELECT auth.uid()))) OR ((split_part(name, '/'::text, 1) = 'org'::text) AND is_org_member((NULLIF(split_part(name, '/'::text, 2), ''::text))::uuid, (SELECT auth.uid()))))));
ALTER POLICY "branding_update" ON "storage"."objects"
  USING (((bucket_id = 'branding'::text) AND (((split_part(name, '/'::text, 1) = 'platform'::text) AND is_super_admin((SELECT auth.uid()))) OR ((split_part(name, '/'::text, 1) = 'org'::text) AND is_org_member((NULLIF(split_part(name, '/'::text, 2), ''::text))::uuid, (SELECT auth.uid()))))))
  WITH CHECK (((bucket_id = 'branding'::text) AND (((split_part(name, '/'::text, 1) = 'platform'::text) AND is_super_admin((SELECT auth.uid()))) OR ((split_part(name, '/'::text, 1) = 'org'::text) AND is_org_member((NULLIF(split_part(name, '/'::text, 2), ''::text))::uuid, (SELECT auth.uid()))))));
ALTER POLICY "branding_workspace_delete" ON "storage"."objects"
  USING (((bucket_id = 'branding'::text) AND (split_part(name, '/'::text, 1) = 'workspace'::text) AND has_workspace_role((NULLIF(split_part(name, '/'::text, 2), ''::text))::uuid, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "branding_workspace_insert" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'branding'::text) AND (split_part(name, '/'::text, 1) = 'workspace'::text) AND has_workspace_role((NULLIF(split_part(name, '/'::text, 2), ''::text))::uuid, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "branding_workspace_update" ON "storage"."objects"
  USING (((bucket_id = 'branding'::text) AND (split_part(name, '/'::text, 1) = 'workspace'::text) AND has_workspace_role((NULLIF(split_part(name, '/'::text, 2), ''::text))::uuid, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))
  WITH CHECK (((bucket_id = 'branding'::text) AND (split_part(name, '/'::text, 1) = 'workspace'::text) AND has_workspace_role((NULLIF(split_part(name, '/'::text, 2), ''::text))::uuid, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "campaign_media_delete_workspace_member" ON "storage"."objects"
  USING (((bucket_id = 'campaign-media'::text) AND ((owner = (SELECT auth.uid())) OR is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid())))));
ALTER POLICY "campaign_media_insert_workspace_member" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'campaign-media'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "campaign_media_select_workspace_member" ON "storage"."objects"
  USING (((bucket_id = 'campaign-media'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "campaign_media_update_workspace_member" ON "storage"."objects"
  USING (((bucket_id = 'campaign-media'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))))
  WITH CHECK (((bucket_id = 'campaign-media'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "custom_fields_delete_own_workspace" ON "storage"."objects"
  USING (((bucket_id = 'custom-fields'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "custom_fields_read_own_workspace" ON "storage"."objects"
  USING (((bucket_id = 'custom-fields'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "custom_fields_update_own_workspace" ON "storage"."objects"
  USING (((bucket_id = 'custom-fields'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "custom_fields_upload_own_workspace" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'custom-fields'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "kb-sources editors delete" ON "storage"."objects"
  USING (((bucket_id = 'kb-sources'::text) AND (EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.user_id = (SELECT auth.uid())) AND ((m.workspace_id)::text = (storage.foldername(objects.name))[1]) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role])))))));
ALTER POLICY "kb-sources editors update" ON "storage"."objects"
  USING (((bucket_id = 'kb-sources'::text) AND (EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.user_id = (SELECT auth.uid())) AND ((m.workspace_id)::text = (storage.foldername(objects.name))[1]) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role])))))));
ALTER POLICY "kb-sources editors write" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'kb-sources'::text) AND (EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.user_id = (SELECT auth.uid())) AND ((m.workspace_id)::text = (storage.foldername(objects.name))[1]) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role])))))));
ALTER POLICY "kb-sources members read" ON "storage"."objects"
  USING (((bucket_id = 'kb-sources'::text) AND (EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.user_id = (SELECT auth.uid())) AND ((m.workspace_id)::text = (storage.foldername(objects.name))[1]))))));
ALTER POLICY "social_media_delete" ON "storage"."objects"
  USING (((bucket_id = 'social-media'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "social_media_insert" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'social-media'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "social_media_read" ON "storage"."objects"
  USING (((bucket_id = 'social-media'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "widget_uploads_delete_workspace_member" ON "storage"."objects"
  USING (((bucket_id = 'widget-uploads'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "widget_uploads_select_workspace_member" ON "storage"."objects"
  USING (((bucket_id = 'widget-uploads'::text) AND is_workspace_member(((storage.foldername(name))[1])::uuid, (SELECT auth.uid()))));
ALTER POLICY "ws members manage ticket_asset_links" ON "public"."ticket_asset_links"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_asset_links.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_asset_links.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ws members read counters" ON "public"."ticket_counters"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_counters.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ws members insert ticket_activity" ON "public"."ticket_activity"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_activity.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ws members view ticket_activity" ON "public"."ticket_activity"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ticket_activity.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "queues_workspace_read" ON "public"."support_queues"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "queues_workspace_write" ON "public"."support_queues"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Super admins read platform audit log" ON "public"."platform_audit_logs"
  USING (is_super_admin((SELECT auth.uid())));
ALTER POLICY "queue_tickets_workspace" ON "public"."queue_tickets"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "profiles insert own" ON "public"."profiles"
  WITH CHECK ((id = (SELECT auth.uid())));
ALTER POLICY "profiles select own" ON "public"."profiles"
  USING ((id = (SELECT auth.uid())));
ALTER POLICY "profiles update own" ON "public"."profiles"
  USING ((id = (SELECT auth.uid())))
  WITH CHECK ((id = (SELECT auth.uid())));
ALTER POLICY "agent_skills_workspace" ON "public"."agent_skills"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "mentions_insert_workspace" ON "public"."ticket_mentions"
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "mentions_read_own_or_workspace" ON "public"."ticket_mentions"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "mentions_update_own" ON "public"."ticket_mentions"
  USING ((mentioned_user_id = (SELECT auth.uid())))
  WITH CHECK (((mentioned_user_id = (SELECT auth.uid())) AND (workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspaces delete if owner" ON "public"."workspaces"
  USING (has_workspace_role(id, (SELECT auth.uid()), ARRAY['owner'::workspace_role]));
ALTER POLICY "workspaces insert owner" ON "public"."workspaces"
  WITH CHECK ((owner_id = (SELECT auth.uid())));
ALTER POLICY "workspaces select if member" ON "public"."workspaces"
  USING (is_workspace_member(id, (SELECT auth.uid())));
ALTER POLICY "workspaces update if owner/admin" ON "public"."workspaces"
  USING (has_workspace_role(id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "sla_esc_rules_workspace" ON "public"."sla_escalation_rules"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "members delete by admin" ON "public"."workspace_members"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "members insert by admin or invite" ON "public"."workspace_members"
  WITH CHECK ((has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]) OR ((user_id = (SELECT auth.uid())) AND can_self_join_workspace(workspace_id, (SELECT auth.uid()), role))));
ALTER POLICY "members select same workspace" ON "public"."workspace_members"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "members update by admin" ON "public"."workspace_members"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "contacts by workspace member" ON "public"."contacts"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "conversations admin delete" ON "public"."conversations"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "conversations member insert" ON "public"."conversations"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "conversations member select" ON "public"."conversations"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "conversations member update" ON "public"."conversations"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "conversations workspace read" ON "public"."conversations"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (deleted_at IS NULL)));
ALTER POLICY "conversations workspace update" ON "public"."conversations"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "conversations workspace write" ON "public"."conversations"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "sla_events_insert" ON "public"."sla_events"
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "sla_events_read" ON "public"."sla_events"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "sla_holidays_workspace" ON "public"."sla_holidays"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "ticket_links workspace access" ON "public"."ticket_links"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Admins can add members" ON "public"."organization_members"
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]));
ALTER POLICY "Admins can remove members" ON "public"."organization_members"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]));
ALTER POLICY "Admins can update members" ON "public"."organization_members"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]));
ALTER POLICY "Members can view organization membership" ON "public"."organization_members"
  USING (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "Owners can bootstrap their own membership" ON "public"."organization_members"
  WITH CHECK (((user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM organizations o
  WHERE ((o.id = organization_members.organization_id) AND (o.owner_id = (SELECT auth.uid())))))));
ALTER POLICY "ticket_crm_links workspace access" ON "public"."ticket_crm_links"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "automations by workspace member" ON "public"."automations"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Admins manage org roles" ON "public"."roles"
  USING (((organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])))
  WITH CHECK (((organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])));
ALTER POLICY "Read system and own org roles" ON "public"."roles"
  USING (((organization_id IS NULL) OR is_org_member(organization_id, (SELECT auth.uid()))));
ALTER POLICY "ticket_ai_suggestions workspace access" ON "public"."ticket_ai_suggestions"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Authenticated can read permission catalog" ON "public"."permissions"
  USING (((SELECT auth.uid()) IS NOT NULL));
ALTER POLICY "Admins manage role_permissions" ON "public"."role_permissions"
  USING ((EXISTS ( SELECT 1
   FROM roles r
  WHERE ((r.id = role_permissions.role_id) AND (r.organization_id IS NOT NULL) AND has_org_role(r.organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM roles r
  WHERE ((r.id = role_permissions.role_id) AND (r.organization_id IS NOT NULL) AND has_org_role(r.organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])))));
ALTER POLICY "Read role_permissions for accessible roles" ON "public"."role_permissions"
  USING ((EXISTS ( SELECT 1
   FROM roles r
  WHERE ((r.id = role_permissions.role_id) AND ((r.organization_id IS NULL) OR is_org_member(r.organization_id, (SELECT auth.uid())))))));
ALTER POLICY "Admins manage org role assignments" ON "public"."user_role_assignments"
  USING (((organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])))
  WITH CHECK (((organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])));
ALTER POLICY "View own or org role assignments" ON "public"."user_role_assignments"
  USING (((user_id = (SELECT auth.uid())) OR ((organization_id IS NOT NULL) AND is_org_member(organization_id, (SELECT auth.uid())))));
ALTER POLICY "ws members manage csat_surveys" ON "public"."csat_surveys"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = csat_surveys.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = csat_surveys.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Admins view org audit logs" ON "public"."audit_logs"
  USING (((organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])));
ALTER POLICY "Admins view workspace audit logs" ON "public"."audit_logs"
  USING (((workspace_id IS NOT NULL) AND has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "Super admins manage plans" ON "public"."plans"
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['superadmin'::app_role, 'support'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'superadmin'::app_role)))));
ALTER POLICY "Billing/admin manage subscription" ON "public"."subscriptions"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]))
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "Members view org subscription" ON "public"."subscriptions"
  USING (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "ws members manage csat_responses" ON "public"."csat_responses"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = csat_responses.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = csat_responses.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Users delete own notifications" ON "public"."notifications"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users insert own notifications" ON "public"."notifications"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users read own notifications" ON "public"."notifications"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users update own notifications" ON "public"."notifications"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Members upload files to their org" ON "public"."files"
  WITH CHECK (((uploader_id = (SELECT auth.uid())) AND ((organization_id IS NULL) OR is_org_member(organization_id, (SELECT auth.uid())))));
ALTER POLICY "Read files in own org or public" ON "public"."files"
  USING ((is_public OR ((organization_id IS NOT NULL) AND is_org_member(organization_id, (SELECT auth.uid())))));
ALTER POLICY "Uploader or admins delete files" ON "public"."files"
  USING (((uploader_id = (SELECT auth.uid())) OR ((organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]))));
ALTER POLICY "Uploader or admins update files" ON "public"."files"
  USING (((uploader_id = (SELECT auth.uid())) OR ((organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]))));
ALTER POLICY "Users delete own sessions" ON "public"."sessions"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users insert own sessions" ON "public"."sessions"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users read own sessions" ON "public"."sessions"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users revoke own sessions" ON "public"."sessions"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "workspace members read templates" ON "public"."survey_templates"
  USING ((is_system OR (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = survey_templates.workspace_id) AND (wm.user_id = (SELECT auth.uid())))))));
ALTER POLICY "workspace members write templates" ON "public"."survey_templates"
  USING (((workspace_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = survey_templates.workspace_id) AND (wm.user_id = (SELECT auth.uid())))))))
  WITH CHECK (((workspace_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = survey_templates.workspace_id) AND (wm.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Super admins manage platform roles" ON "public"."user_roles"
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));
ALTER POLICY "Users view own platform roles" ON "public"."user_roles"
  USING (((user_id = (SELECT auth.uid())) OR is_super_admin((SELECT auth.uid()))));
ALTER POLICY "Admins manage org settings" ON "public"."settings"
  USING (((scope = 'organization'::settings_scope) AND (organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])))
  WITH CHECK (((scope = 'organization'::settings_scope) AND (organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])));
ALTER POLICY "Read settings in scope" ON "public"."settings"
  USING ((((scope = 'user'::settings_scope) AND (user_id = (SELECT auth.uid()))) OR ((scope = 'organization'::settings_scope) AND (organization_id IS NOT NULL) AND is_org_member(organization_id, (SELECT auth.uid()))) OR ((scope = 'workspace'::settings_scope) AND (workspace_id IS NOT NULL) AND is_workspace_member(workspace_id, (SELECT auth.uid()))) OR ((scope = 'platform'::settings_scope) AND is_super_admin((SELECT auth.uid())))));
ALTER POLICY "Workspace admins manage workspace settings" ON "public"."settings"
  USING (((scope = 'workspace'::settings_scope) AND (workspace_id IS NOT NULL) AND has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))
  WITH CHECK (((scope = 'workspace'::settings_scope) AND (workspace_id IS NOT NULL) AND has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "Write own user settings" ON "public"."settings"
  USING (((scope = 'user'::settings_scope) AND (user_id = (SELECT auth.uid()))))
  WITH CHECK (((scope = 'user'::settings_scope) AND (user_id = (SELECT auth.uid()))));
ALTER POLICY "Members insert activities as self" ON "public"."activities"
  WITH CHECK (((actor_id = (SELECT auth.uid())) AND ((organization_id IS NULL) OR is_org_member(organization_id, (SELECT auth.uid())))));
ALTER POLICY "Members read org activities" ON "public"."activities"
  USING (
CASE
    WHEN (organization_id IS NOT NULL) THEN is_org_member(organization_id, (SELECT auth.uid()))
    WHEN (workspace_id IS NOT NULL) THEN is_workspace_member(workspace_id, (SELECT auth.uid()))
    ELSE is_super_admin((SELECT auth.uid()))
END);
ALTER POLICY "Admins can update their organization" ON "public"."organizations"
  USING (has_org_role(id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]))
  WITH CHECK (has_org_role(id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]));
ALTER POLICY "Members can view their organizations" ON "public"."organizations"
  USING ((is_org_member(id, (SELECT auth.uid())) OR (owner_id = (SELECT auth.uid()))));
ALTER POLICY "Owners can delete their organization" ON "public"."organizations"
  USING ((owner_id = (SELECT auth.uid())));
ALTER POLICY "Users can create organizations" ON "public"."organizations"
  WITH CHECK ((owner_id = (SELECT auth.uid())));
ALTER POLICY "wsinv delete admins" ON "public"."workspace_invitations"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "wsinv insert admins" ON "public"."workspace_invitations"
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "wsinv select admins or invitee" ON "public"."workspace_invitations"
  USING ((has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]) OR (lower(email) = lower(COALESCE(((SELECT auth.jwt()) ->> 'email'::text), ''::text)))));
ALTER POLICY "wsinv update admins" ON "public"."workspace_invitations"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ws members manage survey_automations" ON "public"."survey_automations"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = survey_automations.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = survey_automations.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "own login history insert" ON "public"."login_history"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "own login history read" ON "public"."login_history"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "Admins manage api keys" ON "public"."api_keys"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]))
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]));
ALTER POLICY "own lockout read" ON "public"."account_lockouts"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "own 2fa" ON "public"."user_2fa"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "policy read by members" ON "public"."password_policy"
  USING (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "policy write by admins" ON "public"."password_policy"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]))
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]));
ALTER POLICY "own pat" ON "public"."personal_access_tokens"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "cart workspace access" ON "public"."commerce_carts"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "cart items via cart" ON "public"."commerce_cart_items"
  USING ((cart_id IN ( SELECT commerce_carts.id
   FROM commerce_carts
  WHERE (commerce_carts.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((cart_id IN ( SELECT commerce_carts.id
   FROM commerce_carts
  WHERE (commerce_carts.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))));
ALTER POLICY "deal_pipelines_select" ON "public"."deal_pipelines"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "deal_pipelines_write" ON "public"."deal_pipelines"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "deal_stages_select" ON "public"."deal_stages"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "deal_stages_write" ON "public"."deal_stages"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "orders workspace access" ON "public"."commerce_orders"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "order items via order" ON "public"."commerce_order_items"
  USING ((order_id IN ( SELECT commerce_orders.id
   FROM commerce_orders
  WHERE (commerce_orders.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((order_id IN ( SELECT commerce_orders.id
   FROM commerce_orders
  WHERE (commerce_orders.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))));
ALTER POLICY "order events workspace" ON "public"."commerce_order_events"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "tag_assignments_select" ON "public"."crm_tag_assignments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "tag_assignments_write" ON "public"."crm_tag_assignments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "crm_tags_select" ON "public"."crm_tags"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "crm_tags_write" ON "public"."crm_tags"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws members create movements" ON "public"."commerce_inventory_movements"
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "ws members view movements" ON "public"."commerce_inventory_movements"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "ws members manage inventory" ON "public"."commerce_inventory"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "addresses_select" ON "public"."addresses"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "addresses_write" ON "public"."addresses"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "social_profiles_select" ON "public"."social_profiles"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "social_profiles_write" ON "public"."social_profiles"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "custom_fields_select" ON "public"."custom_field_definitions"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "custom_fields_write" ON "public"."custom_field_definitions"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "companies_delete" ON "public"."companies"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "companies_insert" ON "public"."companies"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "companies_select" ON "public"."companies"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "companies_update" ON "public"."companies"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "deals_delete" ON "public"."deals"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "deals_insert" ON "public"."deals"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "deals_select" ON "public"."deals"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "deals_update" ON "public"."deals"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "communications_delete" ON "public"."communications"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "communications_insert" ON "public"."communications"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "communications_select" ON "public"."communications"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "communications_update" ON "public"."communications"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "attachments_select" ON "public"."attachments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "attachments_write" ON "public"."attachments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "leads_delete" ON "public"."leads"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "leads_insert" ON "public"."leads"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "leads_select" ON "public"."leads"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "leads_update" ON "public"."leads"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "tasks_delete" ON "public"."tasks"
  USING ((((SELECT auth.uid()) = created_by) OR ((SELECT auth.uid()) = assigned_to) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "tasks_insert" ON "public"."tasks"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND ((created_by IS NULL) OR (created_by = (SELECT auth.uid())))));
ALTER POLICY "tasks_select" ON "public"."tasks"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "tasks_update" ON "public"."tasks"
  USING ((((SELECT auth.uid()) = created_by) OR ((SELECT auth.uid()) = assigned_to) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "notes_delete" ON "public"."notes"
  USING (((author_id = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "notes_insert" ON "public"."notes"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (author_id = (SELECT auth.uid()))));
ALTER POLICY "notes_select" ON "public"."notes"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "notes_update" ON "public"."notes"
  USING (((author_id = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "segments_delete" ON "public"."crm_segments"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (is_shared OR (created_by = (SELECT auth.uid())))));
ALTER POLICY "segments_insert" ON "public"."crm_segments"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "segments_select" ON "public"."crm_segments"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (is_shared OR (created_by = (SELECT auth.uid())))));
ALTER POLICY "segments_update" ON "public"."crm_segments"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (is_shared OR (created_by = (SELECT auth.uid())))))
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (is_shared OR (created_by = (SELECT auth.uid())))));
ALTER POLICY "ws members manage zones" ON "public"."commerce_shipping_zones"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "inbox admins write" ON "public"."inboxes"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "inbox members read" ON "public"."inboxes"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "inbox admins manage members" ON "public"."inbox_members"
  USING ((EXISTS ( SELECT 1
   FROM inboxes i
  WHERE ((i.id = inbox_members.inbox_id) AND has_workspace_role(i.workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM inboxes i
  WHERE ((i.id = inbox_members.inbox_id) AND has_workspace_role(i.workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))));
ALTER POLICY "inbox members visible in workspace" ON "public"."inbox_members"
  USING ((EXISTS ( SELECT 1
   FROM inboxes i
  WHERE ((i.id = inbox_members.inbox_id) AND is_workspace_member(i.workspace_id, (SELECT auth.uid()))))));
ALTER POLICY "ws members manage rates" ON "public"."commerce_shipping_rates"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "ws members manage brands" ON "public"."commerce_brands"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "ws members manage variants" ON "public"."product_variants"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "message attachments follow workspace" ON "public"."message_attachments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_catalog_config: admins manage" ON "public"."wa_catalog_config"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "wa_catalog_config: admins view" ON "public"."wa_catalog_config"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ws read wa_catalog_sync_log" ON "public"."wa_catalog_sync_log"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "participants workspace" ON "public"."conversation_participants"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Authors or admins delete scheduled messages" ON "public"."scheduled_messages"
  USING (((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "Authors or admins update scheduled messages" ON "public"."scheduled_messages"
  USING (((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))
  WITH CHECK (((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "Members create their own scheduled messages" ON "public"."scheduled_messages"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "Workspace members view scheduled messages" ON "public"."scheduled_messages"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "assignments workspace" ON "public"."conversation_assignments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "conv notes admin delete" ON "public"."conversation_notes"
  USING (((author_id = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "conv notes author update" ON "public"."conversation_notes"
  USING (((author_id = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "conv notes author write" ON "public"."conversation_notes"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (author_id = (SELECT auth.uid()))));
ALTER POLICY "conv notes workspace read" ON "public"."conversation_notes"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "sla_policies admin write" ON "public"."sla_policies"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "sla_policies read" ON "public"."sla_policies"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "labels workspace read" ON "public"."conversation_labels"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "labels workspace write" ON "public"."conversation_labels"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_catalog_collections: admins manage" ON "public"."wa_catalog_collections"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "wa_catalog_collections: members view" ON "public"."wa_catalog_collections"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws read wa_analytics" ON "public"."wa_catalog_analytics_daily"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "ws manage wa_collection_items" ON "public"."wa_catalog_collection_items"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "conv activity insert" ON "public"."conversation_activity"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "conv activity workspace" ON "public"."conversation_activity"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wishlist workspace access" ON "public"."commerce_wishlists"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Users manage their own drafts" ON "public"."message_drafts"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "payment links workspace" ON "public"."commerce_payment_links"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "label assignments workspace" ON "public"."conversation_label_assignments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "typing workspace" ON "public"."conversation_typing"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "read receipts own" ON "public"."message_read_receipts"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "messages admin delete" ON "public"."messages"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "messages update by sender or admin" ON "public"."messages"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND ((sent_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "messages workspace insert" ON "public"."messages"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "messages workspace read" ON "public"."messages"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "saved carts workspace access" ON "public"."commerce_saved_carts"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Authors or admins can delete templates" ON "public"."message_templates"
  USING (((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "Authors or admins can update templates" ON "public"."message_templates"
  USING (((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))
  WITH CHECK (((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "Members can create templates" ON "public"."message_templates"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "Members can view shared or own templates" ON "public"."message_templates"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (is_shared OR (created_by = (SELECT auth.uid())))));
ALTER POLICY "pl events workspace insert" ON "public"."commerce_payment_link_events"
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "pl events workspace read" ON "public"."commerce_payment_link_events"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "conversation_sla ws" ON "public"."conversation_sla"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "saved_filters personal write" ON "public"."saved_filters"
  USING (((owner_id = (SELECT auth.uid())) AND (scope = 'personal'::text)))
  WITH CHECK (((owner_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "saved_filters read" ON "public"."saved_filters"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND ((scope = 'shared'::text) OR (owner_id = (SELECT auth.uid())))));
ALTER POLICY "saved_filters shared admin" ON "public"."saved_filters"
  USING (((scope = 'shared'::text) AND has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))
  WITH CHECK (((scope = 'shared'::text) AND has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "channel_accounts: admins manage" ON "public"."channel_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "channel_accounts: admins read" ON "public"."channel_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "assignment_rules admin write" ON "public"."assignment_rules"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "assignment_rules read" ON "public"."assignment_rules"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "outbox: workspace members insert" ON "public"."message_outbox"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "outbox: workspace members read" ON "public"."message_outbox"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "promotions workspace access" ON "public"."commerce_promotions"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "webhook_events: workspace admins read" ON "public"."webhook_events"
  USING (((workspace_id IS NOT NULL) AND has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "media_cache: workspace members read" ON "public"."provider_media_cache"
  USING (((channel_account_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM channel_accounts ca
  WHERE ((ca.id = provider_media_cache.channel_account_id) AND is_workspace_member(ca.workspace_id, (SELECT auth.uid())))))));
ALTER POLICY "promo redemptions workspace access" ON "public"."commerce_promotion_redemptions"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "media_access_log: members insert own" ON "public"."media_access_log"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND ((actor_id IS NULL) OR (actor_id = (SELECT auth.uid())))));
ALTER POLICY "media_access_log: members read" ON "public"."media_access_log"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_templates: admins manage" ON "public"."wa_templates"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "wa_templates: workspace members read" ON "public"."wa_templates"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Users manage own trusted devices" ON "public"."trusted_devices"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "provider_logs: workspace admins read" ON "public"."provider_logs"
  USING (((workspace_id IS NOT NULL) AND has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "kb_ver admins delete" ON "public"."kb_article_versions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_article_versions.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));
ALTER POLICY "kb_ver editors write" ON "public"."kb_article_versions"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_article_versions.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))));
ALTER POLICY "kb_ver members read" ON "public"."kb_article_versions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_article_versions.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "sync_jobs: workspace admins read" ON "public"."sync_jobs"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "sync_cursors: workspace members read" ON "public"."sync_cursors"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws admins manage ip allowlist" ON "public"."ip_allowlists"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ws members read ip allowlist" ON "public"."ip_allowlists"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "own push tokens" ON "public"."push_tokens"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "ws admins manage retention" ON "public"."data_retention_policies"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ws members read retention" ON "public"."data_retention_policies"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "own notification prefs" ON "public"."notification_preferences"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "ws admins manage gdpr" ON "public"."gdpr_requests"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ws admins manage signing secrets" ON "public"."webhook_signing_secrets"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "plugin_installations ws members" ON "public"."plugin_installations"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = plugin_installations.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = plugin_installations.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "plugins publisher delete" ON "public"."plugins"
  USING ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "plugins publisher read" ON "public"."plugins"
  USING ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "plugins publisher update" ON "public"."plugins"
  USING ((publisher_id = (SELECT auth.uid())))
  WITH CHECK ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "plugins publisher write" ON "public"."plugins"
  WITH CHECK ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "plugin_versions publisher all" ON "public"."plugin_versions"
  USING ((EXISTS ( SELECT 1
   FROM plugins p
  WHERE ((p.id = plugin_versions.plugin_id) AND (p.publisher_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM plugins p
  WHERE ((p.id = plugin_versions.plugin_id) AND (p.publisher_id = (SELECT auth.uid()))))));
ALTER POLICY "plugin_reviews licensed buyer insert" ON "public"."plugin_reviews"
  WITH CHECK (((reviewer_id = (SELECT auth.uid())) AND (workspace_id IS NOT NULL) AND can_review_plugin(plugin_id, workspace_id)));
ALTER POLICY "plugin_reviews licensed buyer update" ON "public"."plugin_reviews"
  USING ((reviewer_id = (SELECT auth.uid())))
  WITH CHECK (((reviewer_id = (SELECT auth.uid())) AND (workspace_id IS NOT NULL) AND can_review_plugin(plugin_id, workspace_id)));
ALTER POLICY "plugin_reviews self delete" ON "public"."plugin_reviews"
  USING ((reviewer_id = (SELECT auth.uid())));
ALTER POLICY "ai_providers admins manage" ON "public"."ai_providers"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ai_providers members read" ON "public"."ai_providers"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ai_models admins manage" ON "public"."ai_models"
  USING ((EXISTS ( SELECT 1
   FROM ai_providers p
  WHERE ((p.id = ai_models.provider_id) AND has_workspace_role(p.workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ai_providers p
  WHERE ((p.id = ai_models.provider_id) AND has_workspace_role(p.workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))));
ALTER POLICY "ai_models members read" ON "public"."ai_models"
  USING ((EXISTS ( SELECT 1
   FROM ai_providers p
  WHERE ((p.id = ai_models.provider_id) AND is_workspace_member(p.workspace_id, (SELECT auth.uid()))))));
ALTER POLICY "ai_feature_config admins manage" ON "public"."ai_feature_config"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ai_feature_config members read" ON "public"."ai_feature_config"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ai_prompts admins manage" ON "public"."ai_prompts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ai_prompts members read" ON "public"."ai_prompts"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "themes publisher all" ON "public"."themes"
  USING ((publisher_id = (SELECT auth.uid())))
  WITH CHECK ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "ai_logs members read" ON "public"."ai_request_logs"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "theme_installations ws members" ON "public"."theme_installations"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = theme_installations.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = theme_installations.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ai_health members read" ON "public"."ai_provider_health"
  USING ((EXISTS ( SELECT 1
   FROM ai_providers p
  WHERE ((p.id = ai_provider_health.provider_id) AND is_workspace_member(p.workspace_id, (SELECT auth.uid()))))));
ALTER POLICY "Workspace members manage intel" ON "public"."conversation_intelligence"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Workspace members read intel" ON "public"."conversation_intelligence"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Workspace members manage summaries" ON "public"."workspace_ai_summaries"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Workspace members read summaries" ON "public"."workspace_ai_summaries"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members delete lead_qualification" ON "public"."lead_qualification"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members read lead_qualification" ON "public"."lead_qualification"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members update lead_qualification" ON "public"."lead_qualification"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members write lead_qualification" ON "public"."lead_qualification"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ai_usage_daily members read" ON "public"."ai_usage_daily"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "kb_art editors manage" ON "public"."kb_articles"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_articles.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_articles.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))));
ALTER POLICY "kb_art members read" ON "public"."kb_articles"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_articles.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "admins manage automation config" ON "public"."ai_automation_config"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = ai_automation_config.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = ai_automation_config.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));
ALTER POLICY "members read automation config" ON "public"."ai_automation_config"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = ai_automation_config.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "admins delete suggestions" ON "public"."ai_automation_suggestions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = ai_automation_suggestions.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));
ALTER POLICY "members read suggestions" ON "public"."ai_automation_suggestions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = ai_automation_suggestions.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "members update suggestions" ON "public"."ai_automation_suggestions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = ai_automation_suggestions.workspace_id) AND (m.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = ai_automation_suggestions.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "members write suggestions" ON "public"."ai_automation_suggestions"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = ai_automation_suggestions.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "kb_cat editors manage" ON "public"."kb_categories"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_categories.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_categories.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))));
ALTER POLICY "kb_cat members read" ON "public"."kb_categories"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_categories.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "plugin_logs ws members insert" ON "public"."plugin_logs"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = plugin_logs.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "plugin_logs ws members read" ON "public"."plugin_logs"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = plugin_logs.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "kb_chunks editors write" ON "public"."kb_chunks"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_chunks.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_chunks.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))));
ALTER POLICY "kb_chunks members read" ON "public"."kb_chunks"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_chunks.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "kb_evt members insert" ON "public"."kb_article_events"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_article_events.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "kb_evt members read" ON "public"."kb_article_events"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_article_events.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "search_history own delete" ON "public"."search_history"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "search_history own read" ON "public"."search_history"
  USING (((user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = search_history.workspace_id) AND (m.user_id = (SELECT auth.uid())))))));
ALTER POLICY "search_history own write" ON "public"."search_history"
  WITH CHECK (((user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = search_history.workspace_id) AND (m.user_id = (SELECT auth.uid())))))));
ALTER POLICY "ai_settings admins write" ON "public"."ai_settings"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ai_settings members read" ON "public"."ai_settings"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "saved_searches own manage" ON "public"."saved_searches"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = saved_searches.workspace_id) AND (m.user_id = (SELECT auth.uid())))))));
ALTER POLICY "saved_searches visible" ON "public"."saved_searches"
  USING ((((user_id = (SELECT auth.uid())) OR (is_shared = true)) AND (EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = saved_searches.workspace_id) AND (m.user_id = (SELECT auth.uid())))))));
ALTER POLICY "wf_runs by workspace member" ON "public"."workflow_runs"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "products_delete" ON "public"."products"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "products_insert" ON "public"."products"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "products_select" ON "public"."products"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "products_update" ON "public"."products"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ai_audit_logs admins insert" ON "public"."ai_audit_logs"
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ai_audit_logs admins read" ON "public"."ai_audit_logs"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "plugin_health ws members" ON "public"."plugin_health_checks"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = plugin_health_checks.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = plugin_health_checks.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "dli_select" ON "public"."deal_line_items"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "dli_write" ON "public"."deal_line_items"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "plugin_backups ws members" ON "public"."plugin_backups"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = plugin_backups.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = plugin_backups.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "quotes_delete" ON "public"."quotes"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "quotes_insert" ON "public"."quotes"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "quotes_select" ON "public"."quotes"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "quotes_update" ON "public"."quotes"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "qli_select" ON "public"."quote_line_items"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "qli_write" ON "public"."quote_line_items"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "invoices_delete" ON "public"."invoices"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "invoices_insert" ON "public"."invoices"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "invoices_select" ON "public"."invoices"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "invoices_update" ON "public"."invoices"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ili_select" ON "public"."invoice_line_items"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ili_write" ON "public"."invoice_line_items"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "payments_delete" ON "public"."payments"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "payments_insert" ON "public"."payments"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "payments_select" ON "public"."payments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "payments_update" ON "public"."payments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "goals_select" ON "public"."sales_goals"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "goals_write" ON "public"."sales_goals"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "forecasts_select" ON "public"."revenue_forecasts"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "forecasts_write" ON "public"."revenue_forecasts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "pipeline_templates_select" ON "public"."pipeline_templates"
  USING ((is_builtin OR ((workspace_id IS NOT NULL) AND is_workspace_member(workspace_id, (SELECT auth.uid())))));
ALTER POLICY "pipeline_templates_write" ON "public"."pipeline_templates"
  USING (((workspace_id IS NOT NULL) AND has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role])))
  WITH CHECK (((workspace_id IS NOT NULL) AND has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role])));
ALTER POLICY "docseq_select" ON "public"."document_sequences"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "docseq_write" ON "public"."document_sequences"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]));
ALTER POLICY "prodcat_ws_members" ON "public"."product_categories"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "deal_stage_history_select" ON "public"."deal_stage_history"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "bundle_items_ws" ON "public"."product_bundle_items"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "prodfav_own" ON "public"."product_favorites"
  USING (((user_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "Owners/admins delete activities" ON "public"."sales_activities"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND ((owner_id = (SELECT auth.uid())) OR (created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))));
ALTER POLICY "Owners/assignees/admins update activities" ON "public"."sales_activities"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND ((owner_id = (SELECT auth.uid())) OR (assigned_to = (SELECT auth.uid())) OR (created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))));
ALTER POLICY "Workspace members create activities" ON "public"."sales_activities"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "Workspace members view activities" ON "public"."sales_activities"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "prodatt_ws" ON "public"."product_attachments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "org_members_read_payments" ON "public"."billing_payment_attempts"
  USING (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "org_admins_read_revenue" ON "public"."billing_revenue_snapshots"
  USING (
CASE
    WHEN (organization_id IS NOT NULL) THEN has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role])
    ELSE is_super_admin((SELECT auth.uid()))
END);
ALTER POLICY "campaigns by workspace member" ON "public"."campaigns"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "segments workspace access" ON "public"."customer_segments"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "org_admins_read_notifications" ON "public"."billing_notifications"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]));
ALTER POLICY "segment members workspace access" ON "public"."segment_members"
  USING ((segment_id IN ( SELECT customer_segments.id
   FROM customer_segments
  WHERE (customer_segments.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((segment_id IN ( SELECT customer_segments.id
   FROM customer_segments
  WHERE (customer_segments.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Customers read their licenses" ON "public"."plugin_licenses"
  USING ((customer_user_id = (SELECT auth.uid())));
ALTER POLICY "Publishers manage their licenses" ON "public"."plugin_licenses"
  USING ((publisher_id = (SELECT auth.uid())))
  WITH CHECK ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "Publishers read their licenses" ON "public"."plugin_licenses"
  USING ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "Billing roles insert documents" ON "public"."billing_documents"
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "Billing roles read documents" ON "public"."billing_documents"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "billing_documents_delete_privileged" ON "public"."billing_documents"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "billing_documents_update_privileged" ON "public"."billing_documents"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]))
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "campaign recipients workspace access" ON "public"."campaign_recipients"
  USING ((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))));
ALTER POLICY "campaign events workspace access" ON "public"."campaign_events"
  USING ((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((campaign_id IN ( SELECT campaigns.id
   FROM campaigns
  WHERE (campaigns.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Members read activations for their workspace" ON "public"."plugin_license_activations"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = plugin_license_activations.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "consent records workspace access" ON "public"."consent_records"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Buyer reads purchases" ON "public"."plugin_purchases"
  USING ((buyer_user_id = (SELECT auth.uid())));
ALTER POLICY "Publisher reads sales" ON "public"."plugin_purchases"
  USING ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "drip sequences workspace access" ON "public"."drip_sequences"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "drip steps workspace access" ON "public"."drip_steps"
  USING ((sequence_id IN ( SELECT drip_sequences.id
   FROM drip_sequences
  WHERE (drip_sequences.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((sequence_id IN ( SELECT drip_sequences.id
   FROM drip_sequences
  WHERE (drip_sequences.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))));
ALTER POLICY "drip enrollments workspace access" ON "public"."drip_enrollments"
  USING ((sequence_id IN ( SELECT drip_sequences.id
   FROM drip_sequences
  WHERE (drip_sequences.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))))
  WITH CHECK ((sequence_id IN ( SELECT drip_sequences.id
   FROM drip_sequences
  WHERE (drip_sequences.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Read subscription via license" ON "public"."plugin_subscriptions"
  USING ((EXISTS ( SELECT 1
   FROM plugin_licenses l
  WHERE ((l.id = plugin_subscriptions.license_id) AND ((l.customer_user_id = (SELECT auth.uid())) OR (l.publisher_id = (SELECT auth.uid())))))));
ALTER POLICY "contact_lists delete" ON "public"."contact_lists"
  USING (is_active_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "contact_lists insert" ON "public"."contact_lists"
  WITH CHECK ((is_active_workspace_member(workspace_id, (SELECT auth.uid())) AND ((created_by IS NULL) OR (created_by = (SELECT auth.uid()))) AND ((segment_id IS NULL) OR (EXISTS ( SELECT 1
   FROM crm_segments s
  WHERE ((s.id = contact_lists.segment_id) AND (s.workspace_id = contact_lists.workspace_id)))))));
ALTER POLICY "contact_lists select" ON "public"."contact_lists"
  USING (is_active_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "contact_lists update" ON "public"."contact_lists"
  USING (is_active_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK ((is_active_workspace_member(workspace_id, (SELECT auth.uid())) AND ((segment_id IS NULL) OR (EXISTS ( SELECT 1
   FROM crm_segments s
  WHERE ((s.id = contact_lists.segment_id) AND (s.workspace_id = contact_lists.workspace_id)))))));
ALTER POLICY "contact_list_members delete" ON "public"."contact_list_members"
  USING ((EXISTS ( SELECT 1
   FROM contact_lists cl
  WHERE ((cl.id = contact_list_members.list_id) AND is_active_workspace_member(cl.workspace_id, (SELECT auth.uid()))))));
ALTER POLICY "contact_list_members insert" ON "public"."contact_list_members"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM (contact_lists cl
     JOIN contacts c ON ((c.id = contact_list_members.contact_id)))
  WHERE ((cl.id = contact_list_members.list_id) AND (c.workspace_id = cl.workspace_id) AND is_active_workspace_member(cl.workspace_id, (SELECT auth.uid()))))) AND ((added_by IS NULL) OR (added_by = (SELECT auth.uid())))));
ALTER POLICY "contact_list_members select" ON "public"."contact_list_members"
  USING ((EXISTS ( SELECT 1
   FROM contact_lists cl
  WHERE ((cl.id = contact_list_members.list_id) AND is_active_workspace_member(cl.workspace_id, (SELECT auth.uid()))))));
ALTER POLICY "contact_list_members update" ON "public"."contact_list_members"
  USING ((EXISTS ( SELECT 1
   FROM contact_lists cl
  WHERE ((cl.id = contact_list_members.list_id) AND is_active_workspace_member(cl.workspace_id, (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (contact_lists cl
     JOIN contacts c ON ((c.id = contact_list_members.contact_id)))
  WHERE ((cl.id = contact_list_members.list_id) AND (c.workspace_id = cl.workspace_id) AND is_active_workspace_member(cl.workspace_id, (SELECT auth.uid()))))));
ALTER POLICY "ab_variants ws access" ON "public"."campaign_ab_variants"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "workspace members delete saved audiences" ON "public"."saved_audiences"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members read saved audiences" ON "public"."saved_audiences"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members update saved audiences" ON "public"."saved_audiences"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members write saved audiences" ON "public"."saved_audiences"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "campaign_templates ws access" ON "public"."campaign_templates"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "dispatch_queue ws access" ON "public"."campaign_dispatch_queue"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "wf_versions by workspace member" ON "public"."workflow_versions"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Members read workspace trials" ON "public"."plugin_trials"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = plugin_trials.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "partners_workspace_select" ON "public"."channel_partners"
  USING (((public.is_workspace_member(workspace_id, (SELECT auth.uid()))) AND (deleted_at IS NULL)));
ALTER POLICY "partners_workspace_write" ON "public"."channel_partners"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "wf_queue by workspace member" ON "public"."workflow_queue"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "wf_tpl delete" ON "public"."workflow_templates"
  USING (((owner_user_id = (SELECT auth.uid())) OR (workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE ((workspace_members.user_id = (SELECT auth.uid())) AND (workspace_members.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role])))))));
ALTER POLICY "wf_tpl insert" ON "public"."workflow_templates"
  WITH CHECK (((owner_user_id = (SELECT auth.uid())) AND (workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid()))))));
ALTER POLICY "wf_tpl read" ON "public"."workflow_templates"
  USING (((workspace_id IS NULL) OR (owner_user_id = (SELECT auth.uid())) OR ((is_public_in_workspace = true) AND (workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))));
ALTER POLICY "wf_tpl update" ON "public"."workflow_templates"
  USING (((owner_user_id = (SELECT auth.uid())) OR (workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE ((workspace_members.user_id = (SELECT auth.uid())) AND (workspace_members.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role])))))))
  WITH CHECK (((owner_user_id = (SELECT auth.uid())) OR (workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE ((workspace_members.user_id = (SELECT auth.uid())) AND (workspace_members.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role])))))));
ALTER POLICY "workflow_variables select if member" ON "public"."workflow_variables"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workflow_variables write if member" ON "public"."workflow_variables"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wf_tpl_fav own" ON "public"."workflow_template_favorites"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Members insert usage for workspace" ON "public"."plugin_usage_events"
  WITH CHECK (((workspace_id IS NULL) OR (EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = plugin_usage_events.workspace_id) AND (m.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Publishers read usage for their plugin" ON "public"."plugin_usage_events"
  USING ((EXISTS ( SELECT 1
   FROM plugins p
  WHERE ((p.id = plugin_usage_events.plugin_id) AND (p.publisher_id = (SELECT auth.uid()))))));
ALTER POLICY "wf_run_steps by workspace member" ON "public"."workflow_run_steps"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "wf_tpl_usage insert own" ON "public"."workflow_template_usage"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "wf_tpl_usage own" ON "public"."workflow_template_usage"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Publishers read downloads" ON "public"."plugin_downloads"
  USING ((EXISTS ( SELECT 1
   FROM plugins p
  WHERE ((p.id = plugin_downloads.plugin_id) AND (p.publisher_id = (SELECT auth.uid()))))));
ALTER POLICY "Users log their own downloads" ON "public"."plugin_downloads"
  WITH CHECK (((user_id = (SELECT auth.uid())) AND ((workspace_id IS NULL) OR (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = plugin_downloads.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))));
ALTER POLICY "bi_dashboards_member_all" ON "public"."bi_dashboards"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "bi_widgets_member_all" ON "public"."bi_widgets"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Publisher reads own shares" ON "public"."plugin_revenue_shares"
  USING ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "bi_reports_member_all" ON "public"."bi_reports"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "bi_sched_member_all" ON "public"."bi_scheduled_reports"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "bi_report_runs_member_insert" ON "public"."bi_report_runs"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "bi_report_runs_member_read" ON "public"."bi_report_runs"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Admins manage oauth clients" ON "public"."oauth_clients"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]))
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]));
ALTER POLICY "user reads own tokens" ON "public"."oauth_access_tokens"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Publisher reads own payouts" ON "public"."plugin_payouts"
  USING ((publisher_id = (SELECT auth.uid())));
ALTER POLICY "bi_kpis_member_all" ON "public"."bi_kpis"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "bi_kpi_snap_member_insert" ON "public"."bi_kpi_snapshots"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "bi_kpi_snap_member_read" ON "public"."bi_kpi_snapshots"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "org members manage installations" ON "public"."marketplace_installations"
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "org members read installations" ON "public"."marketplace_installations"
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "bi_metric_cache_member_read" ON "public"."bi_metric_cache"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Publishers view their scans" ON "public"."plugin_security_scans"
  USING ((EXISTS ( SELECT 1
   FROM plugins p
  WHERE ((p.id = plugin_security_scans.plugin_id) AND (p.publisher_id = (SELECT auth.uid()))))));
ALTER POLICY "Superadmins manage security scans" ON "public"."plugin_security_scans"
  USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
  WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));
ALTER POLICY "Workspace admins manage backups" ON "public"."backup_jobs"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Workspace members read backups" ON "public"."backup_jobs"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "bi_calc_queue_member_read" ON "public"."bi_calc_queue"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "bi_forecasts_member_read" ON "public"."bi_forecasts"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Billing admins manage billing customers" ON "public"."billing_customers"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]))
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "Billing roles view billing customers" ON "public"."billing_customers"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "Members create their own exports" ON "public"."export_jobs"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "Members read own or workspace-visible exports" ON "public"."export_jobs"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND ((created_by = (SELECT auth.uid())) OR (visibility = 'workspace'::text) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))));
ALTER POLICY "Owners/admins delete; users delete own" ON "public"."export_jobs"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND ((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))));
ALTER POLICY "Owners/admins update; users update own" ON "public"."export_jobs"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND ((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))));
ALTER POLICY "Publishers view their compat" ON "public"."plugin_compatibility_checks"
  USING ((EXISTS ( SELECT 1
   FROM plugins p
  WHERE ((p.id = plugin_compatibility_checks.plugin_id) AND (p.publisher_id = (SELECT auth.uid()))))));
ALTER POLICY "Superadmins manage compat checks" ON "public"."plugin_compatibility_checks"
  USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
  WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));
ALTER POLICY "Billing admins manage payment methods" ON "public"."payment_methods"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]))
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "Billing roles view payment methods" ON "public"."payment_methods"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "Superadmins insert moderation log" ON "public"."marketplace_moderation_log"
  WITH CHECK ((has_role((SELECT auth.uid()), 'superadmin'::app_role) AND (moderator_id = (SELECT auth.uid()))));
ALTER POLICY "Superadmins view moderation log" ON "public"."marketplace_moderation_log"
  USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));
ALTER POLICY "Members insert usage events" ON "public"."usage_events"
  WITH CHECK (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "Members view usage events" ON "public"."usage_events"
  USING (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "Members view quotas" ON "public"."tenant_quotas"
  USING (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "Admins create workspace QR sessions" ON "public"."whatsapp_qr_sessions"
  WITH CHECK (((created_by = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_qr_sessions.workspace_id) AND (wm.user_id = (SELECT auth.uid())) AND (wm.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role])))))));
ALTER POLICY "Admins delete workspace QR sessions" ON "public"."whatsapp_qr_sessions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_qr_sessions.workspace_id) AND (wm.user_id = (SELECT auth.uid())) AND (wm.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));
ALTER POLICY "Admins update workspace QR sessions" ON "public"."whatsapp_qr_sessions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_qr_sessions.workspace_id) AND (wm.user_id = (SELECT auth.uid())) AND (wm.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));
ALTER POLICY "Admins view workspace QR sessions" ON "public"."whatsapp_qr_sessions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_qr_sessions.workspace_id) AND (wm.user_id = (SELECT auth.uid())) AND (wm.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));
ALTER POLICY "Platform staff read coupons" ON "public"."coupons"
  USING ((has_role((SELECT auth.uid()), 'superadmin'::app_role) OR has_role((SELECT auth.uid()), 'support'::app_role)));
ALTER POLICY "Billing admins view events" ON "public"."billing_events"
  USING (((organization_id IS NOT NULL) AND has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role])));
ALTER POLICY "org_members_read_invoices" ON "public"."billing_invoices"
  USING (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "org_members_read_invoice_items" ON "public"."billing_invoice_items"
  USING ((EXISTS ( SELECT 1
   FROM billing_invoices bi
  WHERE ((bi.id = billing_invoice_items.invoice_id) AND is_org_member(bi.organization_id, (SELECT auth.uid()))))));
ALTER POLICY "Members insert workspace QR events" ON "public"."whatsapp_qr_session_events"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_qr_session_events.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members view workspace QR events" ON "public"."whatsapp_qr_session_events"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_qr_session_events.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "bdt delete billing roles" ON "public"."billing_document_templates"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "bdt insert billing roles" ON "public"."billing_document_templates"
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "bdt select org members" ON "public"."billing_document_templates"
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "bdt update billing roles" ON "public"."billing_document_templates"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]))
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role, 'billing'::org_role]));
ALTER POLICY "Members manage usage alerts" ON "public"."usage_alerts"
  USING (is_org_member(organization_id, (SELECT auth.uid())))
  WITH CHECK (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "Members view usage alerts" ON "public"."usage_alerts"
  USING (is_org_member(organization_id, (SELECT auth.uid())));
ALTER POLICY "org members insert history" ON "public"."billing_document_history"
  WITH CHECK ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "org members read history" ON "public"."billing_document_history"
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "org members manage exemptions" ON "public"."billing_tax_exemptions"
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Everyone reads published announcements" ON "public"."platform_announcements"
  USING ((((published_at IS NOT NULL) AND ((expires_at IS NULL) OR (expires_at > now()))) OR is_super_admin((SELECT auth.uid()))));
ALTER POLICY "Super admins manage announcements" ON "public"."platform_announcements"
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));
ALTER POLICY "Members view their workspace deliveries" ON "public"."wa_qr_webhook_deliveries"
  USING (((workspace_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = wa_qr_webhook_deliveries.workspace_id) AND (wm.user_id = (SELECT auth.uid())))))));
ALTER POLICY "org_admins_read_automation_config" ON "public"."billing_automation_config"
  USING ((EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.organization_id = billing_automation_config.organization_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "org_admins_write_automation_config" ON "public"."billing_automation_config"
  USING ((EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.organization_id = billing_automation_config.organization_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM organization_members m
  WHERE ((m.organization_id = billing_automation_config.organization_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))))));
ALTER POLICY "Workspace admins manage schedules" ON "public"."backup_schedules"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Workspace members read schedules" ON "public"."backup_schedules"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Platform staff update tickets" ON "public"."platform_support_tickets"
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['superadmin'::app_role, 'support'::app_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['superadmin'::app_role, 'support'::app_role]))))));
ALTER POLICY "Requester or platform staff read tickets" ON "public"."platform_support_tickets"
  USING (((requester_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['superadmin'::app_role, 'support'::app_role])))))));
ALTER POLICY "Users open tickets" ON "public"."platform_support_tickets"
  WITH CHECK ((requester_id = (SELECT auth.uid())));
ALTER POLICY "requester reads own ticket messages" ON "public"."support_ticket_messages"
  USING (((NOT is_internal) AND (EXISTS ( SELECT 1
   FROM platform_support_tickets t
  WHERE ((t.id = support_ticket_messages.ticket_id) AND (t.requester_id = (SELECT auth.uid())))))));
ALTER POLICY "staff manage support messages" ON "public"."support_ticket_messages"
  USING ((has_role((SELECT auth.uid()), 'superadmin'::app_role) OR has_role((SELECT auth.uid()), 'support'::app_role)))
  WITH CHECK ((has_role((SELECT auth.uid()), 'superadmin'::app_role) OR has_role((SELECT auth.uid()), 'support'::app_role)));
ALTER POLICY "Org members read gateway logs" ON "public"."api_gateway_logs"
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "ig accounts delete by admin" ON "public"."instagram_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ig accounts insert by admin" ON "public"."instagram_accounts"
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ig accounts select by admins" ON "public"."instagram_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ig accounts update by admin" ON "public"."instagram_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "staff manage system templates" ON "public"."system_message_templates"
  USING ((has_role((SELECT auth.uid()), 'superadmin'::app_role) OR has_role((SELECT auth.uid()), 'support'::app_role)))
  WITH CHECK ((has_role((SELECT auth.uid()), 'superadmin'::app_role) OR has_role((SELECT auth.uid()), 'support'::app_role)));
ALTER POLICY "staff manage release notes" ON "public"."release_notes"
  USING ((has_role((SELECT auth.uid()), 'superadmin'::app_role) OR has_role((SELECT auth.uid()), 'support'::app_role)))
  WITH CHECK ((has_role((SELECT auth.uid()), 'superadmin'::app_role) OR has_role((SELECT auth.uid()), 'support'::app_role)));
ALTER POLICY "Admins manage webhook endpoints" ON "public"."webhook_endpoints"
  USING (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]))
  WITH CHECK (has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner'::org_role, 'admin'::org_role]));
ALTER POLICY "user manages own consents" ON "public"."oauth_user_consents"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "org members read own deliveries" ON "public"."webhook_deliveries"
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE (organization_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Workspace admins manage restores" ON "public"."backup_restore_operations"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Workspace admins manage notifications" ON "public"."backup_notifications"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Workspace members read notifications" ON "public"."backup_notifications"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Workspace admins manage messenger accounts" ON "public"."messenger_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "messenger accounts select by admins" ON "public"."messenger_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Admins can manage auto-invite rules" ON "public"."workspace_auto_invite_rules"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Members can view auto-invite rules" ON "public"."workspace_auto_invite_rules"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "whatsapp_forms by workspace member" ON "public"."whatsapp_forms"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws members read channel_identities" ON "public"."channel_identities"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws members write channel_identities" ON "public"."channel_identities"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws admins write identity_engine_config" ON "public"."identity_engine_config"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ws members read identity_engine_config" ON "public"."identity_engine_config"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "chatbot_deploy editors write" ON "public"."chatbot_deployments"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_deployments.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_deployments.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))))));
ALTER POLICY "chatbot_deploy members read" ON "public"."chatbot_deployments"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_deployments.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "ws admins write identity_merges" ON "public"."identity_merges"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]));
ALTER POLICY "ws members read identity_merges" ON "public"."identity_merges"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "chatbots editors write" ON "public"."chatbots"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbots.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbots.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))))));
ALTER POLICY "chatbots members read" ON "public"."chatbots"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbots.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Workspace members delete flow versions" ON "public"."chatbot_flow_versions"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Workspace members read flow versions" ON "public"."chatbot_flow_versions"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Workspace members update flow versions" ON "public"."chatbot_flow_versions"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Workspace members write flow versions" ON "public"."chatbot_flow_versions"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "chatbot_msg members read" ON "public"."chatbot_messages"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_messages.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "chatbot_msg members write" ON "public"."chatbot_messages"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_messages.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "chatbot_kb editors write" ON "public"."chatbot_kb_sources"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_kb_sources.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_kb_sources.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role]))))));
ALTER POLICY "chatbot_kb members read" ON "public"."chatbot_kb_sources"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_kb_sources.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "kb_collections editors manage" ON "public"."kb_collections"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_collections.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_collections.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))));
ALTER POLICY "kb_collections members read" ON "public"."kb_collections"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_collections.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "livechat_routing_rules by workspace" ON "public"."livechat_routing_rules"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "kb_collection_articles editors manage" ON "public"."kb_collection_articles"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_collection_articles.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_collection_articles.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'agent'::workspace_role]))))));
ALTER POLICY "kb_collection_articles members read" ON "public"."kb_collection_articles"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = kb_collection_articles.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "prompt_settings_workspace_members" ON "public"."ai_prompt_settings"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ai_conversations_workspace_members" ON "public"."ai_conversations"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members manage departments" ON "public"."departments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ai_conversation_messages_workspace_members" ON "public"."ai_conversation_messages"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members manage department members" ON "public"."department_members"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_devices_delete" ON "public"."whatsapp_devices"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_devices_insert" ON "public"."whatsapp_devices"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_devices_select" ON "public"."whatsapp_devices"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_devices_update" ON "public"."whatsapp_devices"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "warmer_settings_all" ON "public"."whatsapp_warmer_settings"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "users manage own availability" ON "public"."agent_availability"
  USING (((user_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "workspace members view availability" ON "public"."agent_availability"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members manage handoff queue" ON "public"."handoff_queue"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members manage business hours" ON "public"."business_hours"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "warmer_messages_all" ON "public"."whatsapp_warmer_messages"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_auto_replies_delete" ON "public"."whatsapp_auto_replies"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_auto_replies.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "wa_auto_replies_insert" ON "public"."whatsapp_auto_replies"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_auto_replies.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "wa_auto_replies_select" ON "public"."whatsapp_auto_replies"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_auto_replies.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "wa_auto_replies_update" ON "public"."whatsapp_auto_replies"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = whatsapp_auto_replies.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members can delete phonebooks" ON "public"."phonebooks"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = phonebooks.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members can insert phonebooks" ON "public"."phonebooks"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = phonebooks.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members can update phonebooks" ON "public"."phonebooks"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = phonebooks.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members can view phonebooks" ON "public"."phonebooks"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = phonebooks.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members insert handoff events" ON "public"."handoff_events"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members read handoff events" ON "public"."handoff_events"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members delete chatbot_prompts" ON "public"."chatbot_prompts"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_prompts.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members read chatbot_prompts" ON "public"."chatbot_prompts"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_prompts.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members update chatbot_prompts" ON "public"."chatbot_prompts"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_prompts.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members write chatbot_prompts" ON "public"."chatbot_prompts"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_prompts.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members delete chatbot_prompt_tests" ON "public"."chatbot_prompt_tests"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_prompt_tests.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members read chatbot_prompt_tests" ON "public"."chatbot_prompt_tests"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_prompt_tests.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members update chatbot_prompt_tests" ON "public"."chatbot_prompt_tests"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_prompt_tests.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members write chatbot_prompt_tests" ON "public"."chatbot_prompt_tests"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_prompt_tests.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members read ai_tool_executions" ON "public"."ai_tool_executions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = ai_tool_executions.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Owners delete templates" ON "public"."chatbot_templates"
  USING ((owner_user_id = (SELECT auth.uid())));
ALTER POLICY "Owners insert templates" ON "public"."chatbot_templates"
  WITH CHECK (((owner_user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_templates.workspace_id) AND (wm.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Owners update templates" ON "public"."chatbot_templates"
  USING ((owner_user_id = (SELECT auth.uid())))
  WITH CHECK ((owner_user_id = (SELECT auth.uid())));
ALTER POLICY "View templates in workspace or community" ON "public"."chatbot_templates"
  USING (((is_community = true) OR (owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = chatbot_templates.workspace_id) AND (wm.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Manage own favorites" ON "public"."chatbot_template_favorites"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Members can delete phonebook contacts" ON "public"."phonebook_contacts"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = phonebook_contacts.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members can insert phonebook contacts" ON "public"."phonebook_contacts"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = phonebook_contacts.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members can update phonebook contacts" ON "public"."phonebook_contacts"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = phonebook_contacts.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members can view phonebook contacts" ON "public"."phonebook_contacts"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = phonebook_contacts.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Template owners manage versions" ON "public"."chatbot_template_versions"
  USING ((EXISTS ( SELECT 1
   FROM chatbot_templates t
  WHERE ((t.id = chatbot_template_versions.template_id) AND (t.owner_user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM chatbot_templates t
  WHERE ((t.id = chatbot_template_versions.template_id) AND (t.owner_user_id = (SELECT auth.uid()))))));
ALTER POLICY "View versions for owned workspace or community templates" ON "public"."chatbot_template_versions"
  USING ((EXISTS ( SELECT 1
   FROM chatbot_templates t
  WHERE ((t.id = chatbot_template_versions.template_id) AND ((t.is_community = true) OR (t.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM workspace_members wm
          WHERE ((wm.workspace_id = t.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))))));
ALTER POLICY "Users insert own usage" ON "public"."chatbot_template_usage"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users view own usage" ON "public"."chatbot_template_usage"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "ig webhook events select by members" ON "public"."instagram_webhook_events"
  USING (((workspace_id IS NOT NULL) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "livechat_events read by workspace" ON "public"."livechat_visitor_events"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "livechat_visitors by workspace" ON "public"."livechat_visitors"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "chatbot_sess members read" ON "public"."chatbot_sessions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_sessions.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "chatbot_sess members write" ON "public"."chatbot_sessions"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_sessions.workspace_id) AND (m.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_sessions.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members view logs in their workspace" ON "public"."instagram_comment_automation_logs"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = instagram_comment_automation_logs.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "whatsapp_form_submissions by workspace member" ON "public"."whatsapp_form_submissions"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members create transfers" ON "public"."conversation_transfers"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = conversation_transfers.workspace_id) AND (m.user_id = (SELECT auth.uid()))))) AND (performed_by = (SELECT auth.uid()))));
ALTER POLICY "workspace members read transfers" ON "public"."conversation_transfers"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = conversation_transfers.workspace_id) AND (m.user_id = (SELECT auth.uid()))))));
ALTER POLICY "workspace members manage schedules" ON "public"."booking_availability_schedules"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members manage overrides" ON "public"."booking_availability_overrides"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws admins write contact_matching_rules" ON "public"."contact_matching_rules"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "ws members read contact_matching_rules" ON "public"."contact_matching_rules"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members manage slots via schedule" ON "public"."booking_availability_slots"
  USING ((EXISTS ( SELECT 1
   FROM booking_availability_schedules s
  WHERE ((s.id = booking_availability_slots.schedule_id) AND is_workspace_member(s.workspace_id, (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM booking_availability_schedules s
  WHERE ((s.id = booking_availability_slots.schedule_id) AND is_workspace_member(s.workspace_id, (SELECT auth.uid()))))));
ALTER POLICY "workspace members manage event types" ON "public"."booking_event_types"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members manage event type hosts" ON "public"."booking_event_type_hosts"
  USING ((EXISTS ( SELECT 1
   FROM booking_event_types et
  WHERE ((et.id = booking_event_type_hosts.event_type_id) AND is_workspace_member(et.workspace_id, (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM booking_event_types et
  WHERE ((et.id = booking_event_type_hosts.event_type_id) AND is_workspace_member(et.workspace_id, (SELECT auth.uid()))))));
ALTER POLICY "Admins can manage birthday settings" ON "public"."birthday_reminder_settings"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = birthday_reminder_settings.workspace_id) AND (wm.user_id = (SELECT auth.uid())) AND (wm.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = birthday_reminder_settings.workspace_id) AND (wm.user_id = (SELECT auth.uid())) AND (wm.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));
ALTER POLICY "Members can view birthday settings" ON "public"."birthday_reminder_settings"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = birthday_reminder_settings.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Workspace admins manage rematch jobs" ON "public"."contact_rematch_jobs"
  USING (is_workspace_admin(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_admin(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Workspace members read rematch jobs" ON "public"."contact_rematch_jobs"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Users manage own task reminder settings" ON "public"."task_reminder_settings"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "workspace members manage reminders" ON "public"."booking_reminders"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members manage appointments" ON "public"."booking_appointments"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Members can view birthday log" ON "public"."birthday_reminder_log"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = birthday_reminder_log.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "calendar_busy_ws_read" ON "public"."calendar_busy_cache"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "calendar_busy_ws_write" ON "public"."calendar_busy_cache"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "workspace members manage waitlist" ON "public"."booking_waitlist"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "workspace members manage booking pages" ON "public"."booking_pages"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Admins manage all entries" ON "public"."calendar_entries"
  USING (is_workspace_admin(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_admin(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Members can view calendar entries" ON "public"."calendar_entries"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Owners manage personal entries" ON "public"."calendar_entries"
  USING (((scope = 'personal'::calendar_entry_scope) AND (owner_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK (((scope = 'personal'::calendar_entry_scope) AND (owner_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "Users read own reminder log" ON "public"."task_reminder_log"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "calendar_sync_log_ws_read" ON "public"."calendar_sync_log"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "calendar_sync_log_ws_write" ON "public"."calendar_sync_log"
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "workspace members manage notification templates" ON "public"."booking_notification_templates"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "meeting attendance: workspace members" ON "public"."meeting_attendance"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = meeting_attendance.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = meeting_attendance.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "meeting history: workspace members" ON "public"."meeting_history"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = meeting_history.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = meeting_history.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "meeting accounts: admins manage" ON "public"."meeting_provider_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "workspace members manage notification rules" ON "public"."booking_notification_rules"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "chatbot_webhook_deliveries_select" ON "public"."chatbot_webhook_deliveries"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_webhook_deliveries.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.status = 'active'::member_status)))));
ALTER POLICY "Users delete their own read-state" ON "public"."conversation_read_state"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "Users read their own read-state" ON "public"."conversation_read_state"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "Users update their own read-state" ON "public"."conversation_read_state"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "Users upsert their own read-state" ON "public"."conversation_read_state"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "Members read widget events in workspace" ON "public"."chat_widget_events"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "chatbot_webhooks_select" ON "public"."chatbot_webhooks"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_webhooks.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.status = 'active'::member_status) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));
ALTER POLICY "chatbot_webhooks_write" ON "public"."chatbot_webhooks"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_webhooks.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role])) AND (m.status = 'active'::member_status)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members m
  WHERE ((m.workspace_id = chatbot_webhooks.workspace_id) AND (m.user_id = (SELECT auth.uid())) AND (m.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role, 'manager'::workspace_role])) AND (m.status = 'active'::member_status)))));
ALTER POLICY "Members manage widgets in workspace" ON "public"."chat_widgets"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws members manage ecommerce connections" ON "public"."ecommerce_connections"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "ws members manage ecommerce sync logs" ON "public"."ecommerce_sync_logs"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "Staff can read reconciliation log" ON "public"."contact_list_count_reconciliation_log"
  USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));
ALTER POLICY "ws members read vcard revisions" ON "public"."vcard_revisions"
  USING ((workspace_id IN ( SELECT wm.workspace_id
   FROM workspace_members wm
  WHERE (wm.user_id = (SELECT auth.uid())))));
ALTER POLICY "ws members manage vcards" ON "public"."vcards"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "work_orders_workspace_select" ON "public"."field_work_orders"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "work_orders_workspace_write" ON "public"."field_work_orders"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "vcard views insert" ON "public"."vcard_views"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM vcards
  WHERE ((vcards.id = vcard_views.vcard_id) AND ((vcards.is_public = true) OR (((SELECT auth.uid()) IS NOT NULL) AND (vcards.created_by = (SELECT auth.uid()))))))));
ALTER POLICY "vcard views readable by ws" ON "public"."vcard_views"
  USING ((vcard_id IN ( SELECT vcards.id
   FROM vcards
  WHERE (vcards.workspace_id IN ( SELECT workspace_members.workspace_id
           FROM workspace_members
          WHERE (workspace_members.user_id = (SELECT auth.uid())))))));
ALTER POLICY "Workspace admins can delete telegram webhook events" ON "public"."telegram_webhook_events"
  USING (((workspace_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = telegram_webhook_events.workspace_id) AND (wm.user_id = (SELECT auth.uid())) AND (wm.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role])))))));
ALTER POLICY "Workspace members can view telegram webhook events" ON "public"."telegram_webhook_events"
  USING (((workspace_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = telegram_webhook_events.workspace_id) AND (wm.user_id = (SELECT auth.uid())))))));
ALTER POLICY "wvt_members_delete" ON "public"."webhook_verify_tokens"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wvt_members_insert" ON "public"."webhook_verify_tokens"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "wvt_members_read" ON "public"."webhook_verify_tokens"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Anyone can record their cookie choice" ON "public"."cookie_consents"
  WITH CHECK (((user_id IS NULL) OR (user_id = (SELECT auth.uid()))));
ALTER POLICY "Super admins can read cookie consents" ON "public"."cookie_consents"
  USING (is_super_admin((SELECT auth.uid())));
ALTER POLICY "Users can read their own cookie consents" ON "public"."cookie_consents"
  USING (((user_id IS NOT NULL) AND (user_id = (SELECT auth.uid()))));
ALTER POLICY "wa_handoff_settings_delete" ON "public"."wa_handoff_settings"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_handoff_settings_insert" ON "public"."wa_handoff_settings"
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_handoff_settings_select" ON "public"."wa_handoff_settings"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "wa_handoff_settings_update" ON "public"."wa_handoff_settings"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "telegram_accounts: admins manage" ON "public"."telegram_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "telegram_accounts: admins read" ON "public"."telegram_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Users manage their own theme preference" ON "public"."user_theme_preferences"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "workspace members read inbound webhook deliveries" ON "public"."inbound_webhook_deliveries"
  USING (((workspace_id IS NOT NULL) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "Workspace admins manage sms accounts" ON "public"."sms_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Workspace admins read sms accounts" ON "public"."sms_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Workspace admins manage email accounts" ON "public"."email_accounts"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Workspace members read email accounts" ON "public"."email_accounts"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Only platform staff can read gateway settings" ON "public"."payment_gateway_settings"
  USING (is_super_admin((SELECT auth.uid())));
ALTER POLICY "Super admins manage gateway settings" ON "public"."payment_gateway_settings"
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));
ALTER POLICY "wpgs_select_members" ON "public"."workspace_payment_gateway_settings"
  USING ((is_workspace_member(workspace_id, (SELECT auth.uid())) OR is_super_admin((SELECT auth.uid()))));
ALTER POLICY "wpgs_write_admins" ON "public"."workspace_payment_gateway_settings"
  USING ((is_workspace_admin(workspace_id, (SELECT auth.uid())) OR is_super_admin((SELECT auth.uid()))))
  WITH CHECK ((is_workspace_admin(workspace_id, (SELECT auth.uid())) OR is_super_admin((SELECT auth.uid()))));
ALTER POLICY "Super admins manage plan gateway links" ON "public"."plan_gateway_prices"
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));
ALTER POLICY "ws members manage social post targets" ON "public"."social_post_targets"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "ws members read post library" ON "public"."social_post_library"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "ws members write post library" ON "public"."social_post_library"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())))
  WITH CHECK (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Super admins can delete marketing leads" ON "public"."marketing_leads"
  USING (is_super_admin((SELECT auth.uid())));
ALTER POLICY "Super admins can read marketing leads" ON "public"."marketing_leads"
  USING (is_super_admin((SELECT auth.uid())));
ALTER POLICY "Super admins can update marketing leads" ON "public"."marketing_leads"
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));
ALTER POLICY "super admins read gateway webhook deliveries" ON "public"."payment_gateway_webhook_deliveries"
  USING (is_super_admin((SELECT auth.uid())));
ALTER POLICY "ws members manage social posts" ON "public"."social_posts"
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))))
  WITH CHECK ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));
ALTER POLICY "white_label ws admin write" ON "public"."white_label_configs"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = white_label_configs.workspace_id) AND (wm.user_id = (SELECT auth.uid())) AND (wm.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = white_label_configs.workspace_id) AND (wm.user_id = (SELECT auth.uid())) AND (wm.role = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]))))));
ALTER POLICY "white_label ws members read" ON "public"."white_label_configs"
  USING ((EXISTS ( SELECT 1
   FROM workspace_members wm
  WHERE ((wm.workspace_id = white_label_configs.workspace_id) AND (wm.user_id = (SELECT auth.uid()))))));
ALTER POLICY "Members read workspace post metrics" ON "public"."social_post_metrics"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Workspace admins manage social channels" ON "public"."social_channels"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]))
  WITH CHECK (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Workspace admins read social channels" ON "public"."social_channels"
  USING (has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
ALTER POLICY "Authors or admins can delete quick replies" ON "public"."quick_replies"
  USING (((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "Authors or admins can update quick replies" ON "public"."quick_replies"
  USING (((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])))
  WITH CHECK (((created_by = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "Members can create quick replies" ON "public"."quick_replies"
  WITH CHECK ((is_workspace_member(workspace_id, (SELECT auth.uid())) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "Members can view quick replies" ON "public"."quick_replies"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "Calendar accounts readable by owner or workspace admins" ON "public"."calendar_accounts"
  USING (((user_id = (SELECT auth.uid())) OR has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner'::workspace_role, 'admin'::workspace_role])));
ALTER POLICY "Users manage their own calendar accounts" ON "public"."calendar_accounts"
  USING (((user_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK (((user_id = (SELECT auth.uid())) AND is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "tiktok business accounts readable by members" ON "public"."tiktok_business_accounts"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "social inbox sync state readable by members" ON "public"."social_inbox_sync_state"
  USING (is_workspace_member(workspace_id, (SELECT auth.uid())));
ALTER POLICY "contracts_workspace_delete" ON "public"."contracts"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "contracts_workspace_insert" ON "public"."contracts"
  WITH CHECK ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "contracts_workspace_select" ON "public"."contracts"
  USING (((public.is_workspace_member(workspace_id, (SELECT auth.uid()))) AND (deleted_at IS NULL)));
ALTER POLICY "contracts_workspace_update" ON "public"."contracts"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "clauses_workspace_select" ON "public"."contract_clauses"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "clauses_workspace_write" ON "public"."contract_clauses"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "deal_regs_workspace_select" ON "public"."partner_deal_registrations"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "deal_regs_workspace_write" ON "public"."partner_deal_registrations"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "technicians_workspace_select" ON "public"."field_technicians"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "technicians_workspace_write" ON "public"."field_technicians"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "zatca_invoices_workspace_select" ON "public"."zatca_invoices"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "zatca_invoices_workspace_write" ON "public"."zatca_invoices"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "id_res_workspace_select" ON "public"."identity_resolution_records"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "id_res_workspace_write" ON "public"."identity_resolution_records"
  USING ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))))
  WITH CHECK ((public.is_workspace_member(workspace_id, (SELECT auth.uid()))));
ALTER POLICY "erasure_requests_workspace_select" ON "public"."data_privacy_erasure_requests"
  USING ((public.has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner','admin']::public.workspace_role[])));
ALTER POLICY "erasure_requests_workspace_write" ON "public"."data_privacy_erasure_requests"
  USING ((public.has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner','admin']::public.workspace_role[])))
  WITH CHECK ((public.has_workspace_role(workspace_id, (SELECT auth.uid()), ARRAY['owner','admin']::public.workspace_role[])));

NOTIFY pgrst, 'reload schema';
