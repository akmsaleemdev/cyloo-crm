CREATE TABLE public.commerce_online_payment_sessions (
  order_id uuid PRIMARY KEY REFERENCES public.commerce_orders(id) ON DELETE RESTRICT,
  workspace_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('tabby', 'tamara', 'tap', 'paytabs', 'myfatoorah', 'paypal', 'checkoutcom', 'telr', 'amazonpayservices')),
  market text NOT NULL CHECK (market IN ('AE', 'SA', 'QA', 'BH', 'KW', 'OM')),
  mode text NOT NULL CHECK (mode IN ('sandbox', 'live')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (
    (provider = 'paypal' AND currency = 'USD')
    OR (provider <> 'paypal' AND ((market = 'AE' AND currency = 'AED') OR (market = 'SA' AND currency = 'SAR')))
    OR (provider IN ('tap', 'paytabs', 'myfatoorah', 'checkoutcom', 'amazonpayservices') AND market = 'QA' AND currency = 'QAR')
  ),
  status text NOT NULL DEFAULT 'creating' CHECK (status IN ('creating', 'pending', 'authorized', 'paid', 'failed', 'uncertain', 'refunded')),
  provider_reference text,
  checkout_url text,
  refund_requested_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider, market, mode, provider_reference)
);

CREATE UNIQUE INDEX commerce_one_online_order_per_cart
  ON public.commerce_orders (cart_id)
  WHERE cart_id IS NOT NULL AND (metadata ->> 'payment_method') IN ('tabby', 'tamara', 'tap', 'paytabs', 'myfatoorah', 'paypal', 'checkoutcom', 'telr', 'amazonpayservices');

ALTER TABLE public.commerce_online_payment_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.commerce_online_payment_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.commerce_online_payment_sessions TO service_role;

CREATE FUNCTION public.reconcile_commerce_online_payment(
  p_order_id uuid, p_provider_reference text, p_status text
)
RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  payment public.commerce_online_payment_sessions%ROWTYPE;
  purchase public.commerce_orders%ROWTYPE;
BEGIN
  IF p_status NOT IN ('pending', 'authorized', 'paid', 'failed', 'refunded') OR p_status IS NULL THEN
    RAISE EXCEPTION 'Invalid provider payment status';
  END IF;

  SELECT * INTO STRICT payment FROM public.commerce_online_payment_sessions
    WHERE order_id = p_order_id AND provider_reference = p_provider_reference FOR UPDATE;

  IF payment.status = 'refunded' OR (payment.status = 'paid' AND p_status <> 'refunded')
    OR (payment.status = 'authorized' AND p_status = 'pending') THEN
    RETURN payment.status;
  END IF;

  IF payment.mode = 'live' AND p_status IN ('paid', 'refunded') THEN
    SELECT * INTO STRICT purchase FROM public.commerce_orders WHERE id = p_order_id FOR UPDATE;
    IF purchase.workspace_id <> payment.workspace_id OR purchase.total <> payment.amount
      OR upper(purchase.currency) <> payment.currency THEN
      RAISE EXCEPTION 'Order details changed after checkout';
    END IF;

    IF p_status = 'paid' AND purchase.payment_status = 'unpaid' THEN
      UPDATE public.commerce_orders SET payment_status = 'paid', paid_at = now() WHERE id = p_order_id;
      INSERT INTO public.commerce_order_events (order_id, workspace_id, event_type, metadata)
      VALUES (p_order_id, payment.workspace_id, 'paid', jsonb_build_object('provider', payment.provider, 'provider_reference', p_provider_reference));
    ELSIF p_status = 'refunded' AND purchase.payment_status IN ('unpaid', 'paid') THEN
      UPDATE public.commerce_orders SET payment_status = 'refunded', refunded_at = now() WHERE id = p_order_id;
      INSERT INTO public.commerce_order_events (order_id, workspace_id, event_type, metadata)
      VALUES (p_order_id, payment.workspace_id, 'refunded', jsonb_build_object('provider', payment.provider, 'provider_reference', p_provider_reference));
    END IF;
  END IF;

  UPDATE public.commerce_online_payment_sessions SET status = p_status, updated_at = now()
    WHERE order_id = p_order_id;
  RETURN p_status;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_commerce_online_payment(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_commerce_online_payment(uuid, text, text) TO service_role;
