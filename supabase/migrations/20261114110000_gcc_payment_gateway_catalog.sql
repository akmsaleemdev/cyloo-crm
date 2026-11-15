-- GCC gateway catalog: add provider settings disabled pending verified adapters and merchant approval.
-- Preserve payment transaction and audit history; remove only retired gateway configuration rows.
INSERT INTO public.payment_gateway_settings (provider_id, enabled, is_default, mode, notes) VALUES
  ('myfatoorah', false, false, 'sandbox', 'GCC P0: adapter and merchant onboarding pending'),
  ('paytabs', false, false, 'sandbox', 'GCC P0: adapter and merchant onboarding pending'),
  ('tap', false, false, 'sandbox', 'GCC P0: adapter and merchant onboarding pending'),
  ('tabby', false, false, 'sandbox', 'Mandatory BNPL: sandbox, eligibility and merchant approval pending'),
  ('tamara', false, false, 'sandbox', 'Mandatory BNPL: sandbox, eligibility and merchant approval pending'),
  ('hyperpay', false, false, 'sandbox', 'GCC P1: adapter and merchant onboarding pending'),
  ('moyasar', false, false, 'sandbox', 'GCC P1: adapter and merchant onboarding pending'),
  ('telr', false, false, 'sandbox', 'GCC P1: adapter and merchant onboarding pending'),
  ('thawani', false, false, 'sandbox', 'GCC P1: adapter and merchant onboarding pending'),
  ('amazon_payment_services', false, false, 'sandbox', 'GCC P1: adapter and merchant onboarding pending')
ON CONFLICT (provider_id) DO NOTHING;

-- Retired providers are removed from the gateway configuration catalog.
-- Permanently remove unsupported payment gateway configurations.
DELETE FROM public.payment_gateway_settings
WHERE provider_id IN (
  'mercadopago',
  'paystack',
  'flutterwave',
  'midtrans'
);
-- Prevent retired providers from being recreated in platform settings.
ALTER TABLE public.payment_gateway_settings
  ADD CONSTRAINT payment_gateway_settings_no_retired_providers
  CHECK (provider_id NOT IN (
    'mercadopago', 'paystack', 'flutterwave', 'midtrans'
  ));

-- Remove retired workspace configurations before enforcing the constraint.
DELETE FROM public.workspace_payment_gateway_settings
WHERE provider_id IN (
  'mercadopago',
  'paystack',
  'flutterwave',
  'midtrans'
);
-- Prevent retired providers from being configured directly by workspaces.
ALTER TABLE public.workspace_payment_gateway_settings
  ADD CONSTRAINT workspace_payment_gateway_settings_no_retired_providers
  CHECK (provider_id NOT IN (
    'mercadopago', 'paystack', 'flutterwave', 'midtrans'
  ));
