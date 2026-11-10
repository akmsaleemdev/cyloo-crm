-- ============================================================================
-- CYLOO CRM Enterprise Architecture Migration
-- Modules: CLM, PRM, Field Service, ZATCA e-Invoicing, MDM & SRE Telemetry
-- Migration: 20261108120000_enterprise_core_modules.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MODULE 6 — CONTRACT LIFECYCLE MANAGEMENT (CLM) & LEGAL AGREEMENTS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('MSA', 'NDA', 'SLA', 'SOW', 'Custom')),
  counterparty_name TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  value NUMERIC(15,2),
  currency TEXT NOT NULL DEFAULT 'AED',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'pending_signature', 'signed', 'expiring', 'expired', 'terminated')),
  start_date DATE,
  end_date DATE,
  renewal_date DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  renewal_notice_days INT NOT NULL DEFAULT 60,
  signed_by TEXT,
  signed_at TIMESTAMPTZ,
  signature_hash TEXT,
  document_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (workspace_id, contract_number)
);

CREATE INDEX IF NOT EXISTS idx_contracts_ws_status ON public.contracts (workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal ON public.contracts (workspace_id, renewal_date);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contracts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;

CREATE POLICY "contracts_workspace_select" ON public.contracts
  FOR SELECT TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid AND deleted_at IS NULL);

CREATE POLICY "contracts_workspace_insert" ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "contracts_workspace_update" ON public.contracts
  FOR UPDATE TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "contracts_workspace_delete" ON public.contracts
  FOR DELETE TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

-- Master Pre-Approved Legal Clauses
CREATE TABLE IF NOT EXISTS public.contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  clause_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content_text TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, clause_code)
);

CREATE INDEX IF NOT EXISTS idx_contract_clauses_ws ON public.contract_clauses (workspace_id, category);

ALTER TABLE public.contract_clauses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contract_clauses FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_clauses TO authenticated;
GRANT ALL ON public.contract_clauses TO service_role;

CREATE POLICY "clauses_workspace_select" ON public.contract_clauses
  FOR SELECT TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "clauses_workspace_write" ON public.contract_clauses
  FOR ALL TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  WITH CHECK (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);


-- ----------------------------------------------------------------------------
-- 2. MODULE 7 — PARTNER RELATIONSHIP MANAGEMENT (PRM) & CHANNEL SALES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.channel_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Registered' CHECK (tier IN ('Registered', 'Silver', 'Gold', 'Platinum')),
  country TEXT NOT NULL,
  primary_contact_name TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  commission_margin_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_review', 'suspended')),
  mdf_budget_allocated NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  mdf_budget_used NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (workspace_id, partner_name)
);

CREATE INDEX IF NOT EXISTS idx_channel_partners_ws ON public.channel_partners (workspace_id, tier, status);

ALTER TABLE public.channel_partners ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.channel_partners FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_partners TO authenticated;
GRANT ALL ON public.channel_partners TO service_role;

CREATE POLICY "partners_workspace_select" ON public.channel_partners
  FOR SELECT TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid AND deleted_at IS NULL);

CREATE POLICY "partners_workspace_write" ON public.channel_partners
  FOR ALL TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  WITH CHECK (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

-- Deal Registrations (with Conflict Locking)
CREATE TABLE IF NOT EXISTS public.partner_deal_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.channel_partners(id) ON DELETE CASCADE,
  registration_code TEXT NOT NULL,
  opportunity_name TEXT NOT NULL,
  end_customer_name TEXT NOT NULL,
  estimated_value NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  status TEXT NOT NULL DEFAULT 'under_review' CHECK (status IN ('under_review', 'approved_locked', 'rejected', 'closed_won', 'expired')),
  lock_expires_at TIMESTAMPTZ NOT NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, registration_code)
);

CREATE INDEX IF NOT EXISTS idx_deal_regs_ws_status ON public.partner_deal_registrations (workspace_id, status);

ALTER TABLE public.partner_deal_registrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.partner_deal_registrations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_deal_registrations TO authenticated;
GRANT ALL ON public.partner_deal_registrations TO service_role;

CREATE POLICY "deal_regs_workspace_select" ON public.partner_deal_registrations
  FOR SELECT TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "deal_regs_workspace_write" ON public.partner_deal_registrations
  FOR ALL TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  WITH CHECK (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);


-- ----------------------------------------------------------------------------
-- 3. MODULE 24 — FIELD SERVICE & MOBILE WORKFORCE MANAGEMENT
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.field_technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_transit', 'on_site', 'off_shift')),
  current_latitude NUMERIC(10,7),
  current_longitude NUMERIC(10,7),
  last_location_at TIMESTAMPTZ,
  skills TEXT[] NOT NULL DEFAULT '{}',
  truck_identifier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_technicians_ws ON public.field_technicians (workspace_id, status);

ALTER TABLE public.field_technicians ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.field_technicians FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_technicians TO authenticated;
GRANT ALL ON public.field_technicians TO service_role;

CREATE POLICY "technicians_workspace_select" ON public.field_technicians
  FOR SELECT TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "technicians_workspace_write" ON public.field_technicians
  FOR ALL TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  WITH CHECK (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

-- Work Orders
CREATE TABLE IF NOT EXISTS public.field_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  work_order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES public.field_technicians(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('Installation', 'Preventive Maintenance', 'Emergency Repair', 'Site Inspection')),
  priority TEXT NOT NULL DEFAULT 'Standard' CHECK (priority IN ('Standard', 'High', 'Emergency')),
  status TEXT NOT NULL DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'in_transit', 'on_site', 'completed', 'cancelled')),
  site_address TEXT NOT NULL,
  site_latitude NUMERIC(10,7),
  site_longitude NUMERIC(10,7),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  customer_signature_url TEXT,
  customer_signed_name TEXT,
  customer_signed_at TIMESTAMPTZ,
  signature_gps_latitude NUMERIC(10,7),
  signature_gps_longitude NUMERIC(10,7),
  parts_consumed JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, work_order_number)
);

CREATE INDEX IF NOT EXISTS idx_work_orders_ws_status ON public.field_work_orders (workspace_id, status, scheduled_start);

ALTER TABLE public.field_work_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.field_work_orders FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_work_orders TO authenticated;
GRANT ALL ON public.field_work_orders TO service_role;

CREATE POLICY "work_orders_workspace_select" ON public.field_work_orders
  FOR SELECT TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "work_orders_workspace_write" ON public.field_work_orders
  FOR ALL TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  WITH CHECK (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);


-- ----------------------------------------------------------------------------
-- 4. MODULE 27 — ZATCA E-INVOICING & GCC FISCAL COMPLIANCE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.zatca_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('B2B_Standard', 'B2C_Simplified')),
  buyer_name TEXT NOT NULL,
  buyer_vat_number TEXT,
  seller_name TEXT NOT NULL,
  seller_vat_number TEXT NOT NULL,
  net_amount NUMERIC(15,2) NOT NULL,
  vat_amount NUMERIC(15,2) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  previous_invoice_hash TEXT NOT NULL,
  invoice_hash TEXT NOT NULL,
  cryptographic_stamp TEXT,
  qr_tlv_base64 TEXT NOT NULL,
  ubl_xml_content TEXT,
  zatca_status TEXT NOT NULL DEFAULT 'pending' CHECK (zatca_status IN ('pending', 'cleared', 'reported', 'rejected')),
  zatca_cleared_at TIMESTAMPTZ,
  zatca_response_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_zatca_invoices_ws ON public.zatca_invoices (workspace_id, zatca_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zatca_invoices_hash ON public.zatca_invoices (invoice_hash);

ALTER TABLE public.zatca_invoices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.zatca_invoices FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zatca_invoices TO authenticated;
GRANT ALL ON public.zatca_invoices TO service_role;

CREATE POLICY "zatca_invoices_workspace_select" ON public.zatca_invoices
  FOR SELECT TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "zatca_invoices_workspace_write" ON public.zatca_invoices
  FOR ALL TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  WITH CHECK (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);


-- ----------------------------------------------------------------------------
-- 5. MODULE 33 — ENTERPRISE DATA HYGIENE, GOVERNANCE & MDM
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.identity_resolution_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  primary_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel_source TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('phone', 'email', 'whatsapp_jid', 'instagram_handle', 'tiktok_uid', 'external_crm_id')),
  identifier_value TEXT NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  verified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, identifier_type, identifier_value)
);

CREATE INDEX IF NOT EXISTS idx_identity_resolution_lookup ON public.identity_resolution_records (workspace_id, identifier_value);
CREATE INDEX IF NOT EXISTS idx_identity_resolution_contact ON public.identity_resolution_records (primary_contact_id);

ALTER TABLE public.identity_resolution_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.identity_resolution_records FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_resolution_records TO authenticated;
GRANT ALL ON public.identity_resolution_records TO service_role;

CREATE POLICY "id_res_workspace_select" ON public.identity_resolution_records
  FOR SELECT TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "id_res_workspace_write" ON public.identity_resolution_records
  FOR ALL TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  WITH CHECK (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

-- Data Privacy & Right-to-Erasure Requests (PDPL / GDPR)
CREATE TABLE IF NOT EXISTS public.data_privacy_erasure_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  requested_by_email TEXT NOT NULL,
  regulation TEXT NOT NULL CHECK (regulation IN ('Saudi_PDPL', 'UAE_DPL', 'GDPR')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  records_purged_count INT NOT NULL DEFAULT 0,
  audit_hash TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_erasure_requests_ws ON public.data_privacy_erasure_requests (workspace_id, executed_at DESC);

ALTER TABLE public.data_privacy_erasure_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.data_privacy_erasure_requests FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_privacy_erasure_requests TO authenticated;
GRANT ALL ON public.data_privacy_erasure_requests TO service_role;

CREATE POLICY "erasure_requests_workspace_select" ON public.data_privacy_erasure_requests
  FOR SELECT TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "erasure_requests_workspace_write" ON public.data_privacy_erasure_requests
  FOR ALL TO authenticated
  USING (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  WITH CHECK (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);


-- ----------------------------------------------------------------------------
-- 6. MODULE 34 — SRE OBSERVABILITY, SYSTEM HEALTH & AUDIT TELEMETRY
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sre_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  queue_name TEXT NOT NULL,
  target_endpoint TEXT NOT NULL,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'stalled' CHECK (status IN ('stalled', 'replayed', 'discarded')),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dlq_status ON public.sre_dead_letter_queue (status, created_at DESC);

ALTER TABLE public.sre_dead_letter_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sre_dead_letter_queue FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sre_dead_letter_queue TO authenticated;
GRANT ALL ON public.sre_dead_letter_queue TO service_role;

CREATE POLICY "dlq_workspace_select" ON public.sre_dead_letter_queue
  FOR SELECT TO authenticated
  USING (workspace_id IS NULL OR workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

CREATE POLICY "dlq_workspace_write" ON public.sre_dead_letter_queue
  FOR ALL TO authenticated
  USING (workspace_id IS NULL OR workspace_id = (auth.jwt() ->> 'workspace_id')::uuid)
  WITH CHECK (workspace_id IS NULL OR workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

-- Webhook Delivery Health Probes
CREATE TABLE IF NOT EXISTS public.sre_webhook_health_probes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  probe_url TEXT NOT NULL,
  latency_ms INT NOT NULL,
  http_status INT NOT NULL,
  is_healthy BOOLEAN NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_probes_service ON public.sre_webhook_health_probes (service_name, checked_at DESC);

ALTER TABLE public.sre_webhook_health_probes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sre_webhook_health_probes FROM anon;
GRANT SELECT ON public.sre_webhook_health_probes TO authenticated;
GRANT ALL ON public.sre_webhook_health_probes TO service_role;

CREATE POLICY "health_probes_read" ON public.sre_webhook_health_probes
  FOR SELECT TO authenticated
  USING (true);

-- Inform PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

