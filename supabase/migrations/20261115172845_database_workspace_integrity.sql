-- Close direct Data API paths in addition to RPC authorization.
SET lock_timeout = '3s';
SET statement_timeout = '60s';

ALTER POLICY "workspaces insert owner" ON public.workspaces
  WITH CHECK (owner_id = (SELECT auth.uid()) AND
    (organization_id IS NULL OR public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner','admin']::public.org_role[])));

CREATE OR REPLACE FUNCTION public.guard_workspace_organization_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $fn$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'Workspace organization changes require a trusted server operation' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.guard_workspace_organization_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER workspaces_guard_organization
  BEFORE UPDATE OF organization_id ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.guard_workspace_organization_change();

CREATE UNIQUE INDEX conversation_labels_workspace_id_id_unique
  ON public.conversation_labels(workspace_id, id);
ALTER TABLE public.conversation_label_assignments
  ADD CONSTRAINT label_assignment_conversation_workspace_fkey
  FOREIGN KEY (workspace_id, conversation_id)
  REFERENCES public.conversations(workspace_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.conversation_label_assignments
  ADD CONSTRAINT label_assignment_label_workspace_fkey
  FOREIGN KEY (workspace_id, label_id)
  REFERENCES public.conversation_labels(workspace_id, id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.conversation_label_assignments VALIDATE CONSTRAINT label_assignment_conversation_workspace_fkey;
ALTER TABLE public.conversation_label_assignments VALIDATE CONSTRAINT label_assignment_label_workspace_fkey;
CREATE INDEX audit_label_assignment_workspace_conversation_idx
  ON public.conversation_label_assignments(workspace_id, conversation_id);
CREATE INDEX audit_label_assignment_workspace_label_idx
  ON public.conversation_label_assignments(workspace_id, label_id);

CREATE UNIQUE INDEX workspaces_id_organization_id_unique ON public.workspaces(id, organization_id);
ALTER TABLE public.contracts ADD CONSTRAINT contracts_workspace_organization_fkey
  FOREIGN KEY (workspace_id, organization_id) REFERENCES public.workspaces(id, organization_id) NOT VALID;
ALTER TABLE public.channel_partners ADD CONSTRAINT channel_partners_workspace_organization_fkey
  FOREIGN KEY (workspace_id, organization_id) REFERENCES public.workspaces(id, organization_id) NOT VALID;
ALTER TABLE public.field_work_orders ADD CONSTRAINT field_work_orders_workspace_organization_fkey
  FOREIGN KEY (workspace_id, organization_id) REFERENCES public.workspaces(id, organization_id) NOT VALID;
ALTER TABLE public.zatca_invoices ADD CONSTRAINT zatca_invoices_workspace_organization_fkey
  FOREIGN KEY (workspace_id, organization_id) REFERENCES public.workspaces(id, organization_id) NOT VALID;
ALTER TABLE public.contracts VALIDATE CONSTRAINT contracts_workspace_organization_fkey;
ALTER TABLE public.channel_partners VALIDATE CONSTRAINT channel_partners_workspace_organization_fkey;
ALTER TABLE public.field_work_orders VALIDATE CONSTRAINT field_work_orders_workspace_organization_fkey;
ALTER TABLE public.zatca_invoices VALIDATE CONSTRAINT zatca_invoices_workspace_organization_fkey;
NOTIFY pgrst, 'reload schema';
