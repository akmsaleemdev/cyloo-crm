-- GCC gateway catalog: add provider settings disabled pending verified adapters and merchant approval.
-- Retain legacy settings and all transaction/history records; never delete financial history.
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

-- Legacy providers must not initiate new transactions. Preserve existing rows for reconciliation.
UPDATE public.payment_gateway_settings
SET enabled = false, is_default = false
WHERE provider_id IN ('mercadopago', 'paystack', 'midtrans');
