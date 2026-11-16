-- Cover the new composite tenant constraints and remove non-API privileges.
SET lock_timeout = '3s';
SET statement_timeout = '60s';
CREATE INDEX audit_contracts_workspace_organization_idx ON public.contracts(workspace_id, organization_id);
CREATE INDEX audit_channel_partners_workspace_organization_idx ON public.channel_partners(workspace_id, organization_id);
CREATE INDEX audit_field_work_orders_workspace_organization_idx ON public.field_work_orders(workspace_id, organization_id);
CREATE INDEX audit_zatca_invoices_workspace_organization_idx ON public.zatca_invoices(workspace_id, organization_id);

-- RLS does not protect TRUNCATE. Browser API roles never need these privileges.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM PUBLIC, anon, authenticated;
