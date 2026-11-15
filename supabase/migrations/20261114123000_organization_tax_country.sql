-- Tax jurisdiction is an organization attribute, not inferred from currency,
-- language, IP, or the billing address free-text field.
-- Existing tenants remain unset until explicitly configured by an owner/admin.
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS country_code text;

ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_country_code_iso2_check;

ALTER TABLE public.organizations
ADD CONSTRAINT organizations_country_code_iso2_check
CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$');

COMMENT ON COLUMN public.organizations.country_code IS
  'Tenant-selected ISO 3166-1 alpha-2 tax home country; NULL means unconfigured. Do not infer VAT liability from this alone.';
