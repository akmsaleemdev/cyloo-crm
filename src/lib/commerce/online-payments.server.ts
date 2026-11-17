import { z } from "zod";
import { supabaseAdmin } from "@/lib/demo/admin-write-guard.server";
import { isServerDemoMode } from "@/lib/demo/mode.server";
import { sbAny } from "@/lib/supabase/untyped";
import {
  ONLINE_PAYMENT_PROVIDERS,
  GCC_MARKETS,
  onlinePaymentMarket,
  type OnlinePaymentProvider,
} from "./online-payment-methods";
import {
  CheckoutRejectedError,
  confirmProviderPayment,
  createProviderCheckout,
  minorUnits,
  providerConfig,
  requestProviderFullRefund,
  verifyProviderNotification,
  type Market,
  type PaymentMode,
  type PaymentOrder,
  type PaymentState,
  type ProviderConfig,
} from "./online-payment-providers.server";

import { verifiedPayPalNotification } from "./online-paypal.server";

import { checkoutComPaymentDetails, confirmCheckoutComPage } from "./online-checkout-com.server";

import { amazonNotificationOrder } from "./online-amazon-payment-services.server";

type Profile = {
  contactId: string;
  workspaceId: string;
  email: string;
  name: string | null;
  phone: string | null;
};
type Session = {
  order_id: string;
  workspace_id: string;
  provider: OnlinePaymentProvider;
  market: Market;
  mode: PaymentMode;
  amount: number;
  currency: string;
  status: PaymentState | "creating" | "uncertain";
  provider_reference: string | null;
  checkout_url: string | null;
  refund_requested_at: string | null;
};

const sessionFields =
  "order_id,workspace_id,provider,market,mode,amount,currency,status,provider_reference,checkout_url,refund_requested_at";
const orderSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string(),
  workspace_id: z.string().uuid(),
  currency: z.string(),
  payment_status: z.string(),
  status: z.string(),
  total: z.number(),
  tax: z.number(),
  shipping: z.number(),
  discount: z.number(),
  metadata: z.object({ payment_method: z.string().optional() }).nullable(),
  shipping_address: z.object({
    street1: z.string().min(1),
    street2: z.string().nullish(),
    city: z.string().min(1),
    postal_code: z.string(),
    country: z.string(),
    region: z.string().nullish(),
    name: z.string().nullish(),
  }),
});
const orderItemsSchema = z
  .array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      sku: z.string().nullable(),
      quantity: z.number().int().positive(),
      unit_price: z.number(),
      total: z.number(),
      metadata: z.object({ discount_cents: z.number().optional() }).nullable(),
    }),
  )
  .min(1);

function appOrigin(): string | null {
  const configured = process.env.APP_ORIGIN;
  if (!configured || isServerDemoMode()) return null;
  try {
    const url = new URL(configured);
    return url.protocol === "https:" && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}

export function configuredOnlineMethods(profile: Profile, country: string, currency: string) {
  if (!appOrigin() || !profile.email) return [];
  return ONLINE_PAYMENT_PROVIDERS.flatMap((provider) => {
    const market = onlinePaymentMarket(country, currency, provider);
    if (!market || (provider !== "paypal" && !profile.phone)) return [];
    const config = providerConfig(provider, profile.workspaceId, market);
    return config ? [{ provider, mode: config.mode }] : [];
  });
}

async function getSession(orderId: string, workspaceId: string): Promise<Session | null> {
  const { data, error } = await sbAny(supabaseAdmin)
    .from("commerce_online_payment_sessions")
    .select(sessionFields)
    .eq("order_id", orderId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  return data as Session | null;
}

export async function startOnlineCheckout(profile: Profile, orderId: string) {
  const db = sbAny(supabaseAdmin);
  const { data: snapshot, error: orderError } = await db
    .from("commerce_orders")
    .select(
      "id,order_number,workspace_id,status,payment_status,currency,total,tax,shipping,discount,metadata,shipping_address",
    )
    .eq("id", orderId)
    .eq("contact_id", profile.contactId)
    .eq("workspace_id", profile.workspaceId)
    .maybeSingle();
  if (orderError || !snapshot) throw new Error("Order not found.");
  const order = orderSchema.parse(snapshot);
  const currency = order.currency.toUpperCase();
  const origin = appOrigin();
  const method = ONLINE_PAYMENT_PROVIDERS.find(
    (provider) => provider === order.metadata?.payment_method,
  );
  const market = onlinePaymentMarket(order.shipping_address.country, currency, method);
  const config = method && market && providerConfig(method, profile.workspaceId, market);
  if (
    !method ||
    !market ||
    !config ||
    !origin ||
    (method !== "paypal" && !profile.phone) ||
    !profile.email ||
    (currency !== "AED" && currency !== "SAR" && currency !== "QAR" && currency !== "USD")
  )
    throw new Error("Online checkout is unavailable for this order.");
  if (
    order.status !== "pending" ||
    order.payment_status !== "unpaid" ||
    minorUnits(order.total) === 0
  )
    throw new Error("This order cannot be paid online.");
  const name = order.shipping_address.name?.trim() || profile.name?.trim();
  if (!name || (method === "tamara" && !/\S\s+\S/.test(name)))
    throw new Error("Add a first and last name to continue.");

  const { data: orderItems, error: itemError } = await db
    .from("commerce_order_items")
    .select("id,name,sku,quantity,unit_price,total,metadata")
    .eq("order_id", orderId);
  if (itemError) throw itemError;
  const items = orderItemsSchema.parse(orderItems).map((item) => ({
    id: item.id,
    sku: item.sku ?? item.id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    total: item.total,
    discount: (item.metadata?.discount_cents ?? 0) / 100,
  }));
  const subtotal = items.reduce((sum, item) => sum + minorUnits(item.total), 0);
  if (
    subtotal + minorUnits(order.tax) + minorUnits(order.shipping) - minorUnits(order.discount) !==
    minorUnits(order.total)
  )
    throw new Error("Order totals could not be verified.");

  const previous = await getSession(orderId, profile.workspaceId);
  if (
    previous &&
    (previous.provider !== method ||
      previous.mode !== config.mode ||
      previous.market !== market ||
      minorUnits(Number(previous.amount)) !== minorUnits(order.total))
  )
    throw new Error("This order has checkout details that require a review.");
  if (previous?.status === "pending" && previous.checkout_url)
    return { url: previous.checkout_url };
  if (previous && !(previous.status === "failed" && !previous.provider_reference))
    throw new Error("This payment already exists. Check its status from the order page.");

  const reservation = previous
    ? await db
        .from("commerce_online_payment_sessions")
        .update({ status: "creating", updated_at: new Date().toISOString() })
        .eq("order_id", orderId)
        .eq("status", "failed")
        .is("provider_reference", null)
        .select("order_id")
        .maybeSingle()
    : await db
        .from("commerce_online_payment_sessions")
        .insert({
          order_id: orderId,
          workspace_id: order.workspace_id,
          provider: method,
          market,
          mode: config.mode,
          amount: order.total,
          currency,
        })
        .select("order_id")
        .single();
  if (reservation.error || !reservation.data)
    throw new Error("A payment attempt already exists or could not be reserved.");

  const webhook = new URL(`/api/public/webhooks/billing/${method}`, origin);
  webhook.search = new URLSearchParams({ account: order.workspace_id, market }).toString();
  const input: PaymentOrder = {
    id: orderId,
    number: order.order_number,
    market,
    currency,
    total: order.total,
    tax: order.tax,
    shipping: order.shipping,
    discount: order.discount,
    buyer: { name, email: profile.email, phone: profile.phone ?? "" },
    address: {
      line1: order.shipping_address.street1,
      line2: order.shipping_address.street2 ?? undefined,
      city: order.shipping_address.city,
      postalCode: order.shipping_address.postal_code,
      region: order.shipping_address.region ?? undefined,
    },
    items,
    returnUrl: new URL(`/client/order-confirmation/${orderId}`, origin).href,
    webhookUrl: webhook.href,
  };

  try {
    const checkout = await createProviderCheckout(config, input);
    const saved = await db
      .from("commerce_online_payment_sessions")
      .update({
        provider_reference: checkout.reference,
        checkout_url: checkout.url,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("status", "creating")
      .select("order_id")
      .single();
    if (saved.error || !saved.data) throw new Error("Could not save the provider session.");
    return { url: checkout.url };
  } catch (error) {
    const rejected = error instanceof CheckoutRejectedError;
    await db
      .from("commerce_online_payment_sessions")
      .update({ status: rejected ? "failed" : "uncertain", updated_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .eq("status", "creating");
    throw new Error(
      rejected
        ? "The payment provider declined checkout for this order. Check your customer details or contact support."
        : "The checkout provider could not confirm the request. Check the order status before attempting another payment.",
    );
  }
}

async function reconcileSession(session: Session, config: ProviderConfig) {
  if (!session.provider_reference || session.mode !== config.mode) return session.status;
  const db = sbAny(supabaseAdmin);
  const { data: order, error: orderError } = await db
    .from("commerce_orders")
    .select("tax,shipping,discount")
    .eq("id", session.order_id)
    .eq("workspace_id", session.workspace_id)
    .single();
  if (orderError || !order) throw new Error("Order could not be verified.");
  const totals = z
    .object({ tax: z.number(), shipping: z.number(), discount: z.number() })
    .parse(order);
  const state = await confirmProviderPayment(config, {
    ...totals,
    reference: session.provider_reference,
    orderId: session.order_id,
    amount: Number(session.amount),
    currency: session.currency,
  });
  const { data, error } = await db.rpc("reconcile_commerce_online_payment", {
    p_order_id: session.order_id,
    p_provider_reference: session.provider_reference,
    p_status: state,
  });
  if (error) throw error;
  return data as PaymentState;
}

export async function orderOnlinePayment(profile: Profile, orderId: string, refresh: boolean) {
  const session = await getSession(orderId, profile.workspaceId);
  if (!session) return null;
  const config = refresh && providerConfig(session.provider, session.workspace_id, session.market);
  const status = config ? await reconcileSession(session, config) : session.status;
  return {
    provider: session.provider,
    mode: session.mode,
    status,
    canResume: status === "pending" || (status === "failed" && !session.provider_reference),
  };
}

export async function staffOnlinePayment(orderId: string, workspaceId: string) {
  const session = await getSession(orderId, workspaceId);
  if (!session) return null;
  return {
    provider: session.provider,
    status: session.status,
    mode: session.mode,
    refundRequested: Boolean(session.refund_requested_at),
    canRefund:
      (session.provider === "tabby" || session.provider === "tamara") &&
      session.status === "paid" &&
      !session.refund_requested_at &&
      Boolean(providerConfig(session.provider, workspaceId, session.market)),
  };
}

export async function refundOnlinePayment(orderId: string, workspaceId: string) {
  if (isServerDemoMode()) throw new Error("Refunds are unavailable in demo mode.");
  const session = await getSession(orderId, workspaceId);
  if (
    !session?.provider_reference ||
    session.status !== "paid" ||
    !["tabby", "tamara"].includes(session.provider)
  )
    throw new Error("This order has no captured installment payment eligible for a refund.");
  const config = providerConfig(session.provider, workspaceId, session.market);
  if (!config || config.mode !== session.mode)
    throw new Error("The original merchant credentials are required to refund this order.");
  const db = sbAny(supabaseAdmin);
  const { data: reserved, error } = await db
    .from("commerce_online_payment_sessions")
    .update({ refund_requested_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("workspace_id", workspaceId)
    .eq("status", "paid")
    .is("refund_requested_at", null)
    .select("order_id")
    .maybeSingle();
  if (error || !reserved)
    throw new Error("A refund has already been requested or could not be reserved.");
  try {
    await requestProviderFullRefund(config, {
      reference: session.provider_reference,
      orderId,
      amount: Number(session.amount),
      currency: session.currency,
    });
    return { confirmed: (await reconcileSession(session, config)) === "refunded" };
  } catch {
    throw new Error(
      "Cyloo could not confirm the refund. Check the merchant dashboard before taking another refund action.",
    );
  }
}

const webhookAccountSchema = z.object({ account: z.string().uuid(), market: z.enum(GCC_MARKETS) });

export async function handleOnlinePaymentWebhook(
  provider: OnlinePaymentProvider,
  request: Request,
) {
  const query = new URL(request.url).searchParams;
  const account = webhookAccountSchema.safeParse({
    account: query.get("account"),
    market: query.get("market"),
  });
  if (!account.success || isServerDemoMode()) return new Response("Not found", { status: 404 });
  const { account: workspaceId, market } = account.data;
  if ((provider === "paytabs" || provider === "amazonpayservices") && query.has("returnOrder")) {
    const returned = z.string().uuid().safeParse(query.get("returnOrder"));
    const origin = appOrigin();
    if (!returned.success || !origin) return new Response("Not found", { status: 404 });
    return Response.redirect(new URL(`/client/order-confirmation/${returned.data}`, origin), 303);
  }
  const config = providerConfig(provider, workspaceId, market);
  if (!config) return new Response("Unauthorized", { status: 401 });
  if (Number(request.headers.get("content-length")) > 65_536)
    return new Response("Notification is too large", { status: 413 });
  const raw = await request.text();
  if (raw.length > 65_536) return new Response("Notification is too large", { status: 413 });
  if (
    !["paypal", "amazonpayservices"].includes(provider) &&
    !verifyProviderNotification(config, request, raw)
  )
    return new Response("Unauthorized", { status: 401 });
  if (provider === "telr" || provider === "amazonpayservices") {
    const orderId = z
      .string()
      .uuid()
      .safeParse(
        provider === "telr"
          ? new URLSearchParams(raw).get("tran_cartid")
          : amazonNotificationOrder(config, request, raw),
      );
    if (!orderId.success) return new Response("Invalid notification", { status: 400 });
    try {
      const session = await getSession(orderId.data, workspaceId);
      if (
        !session ||
        session.provider !== provider ||
        session.market !== market ||
        session.mode !== config.mode
      )
        return Response.json({ ok: true });
      if (!session.provider_reference)
        return new Response("Checkout is still being saved", { status: 503 });
      await reconcileSession(session, config);
      return Response.json({ ok: true });
    } catch {
      return new Response("Payment verification unavailable", { status: 503 });
    }
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Invalid notification", { status: 400 });
  }
  const parsed = z
    .object({
      id: z.string().max(128).optional(),
      order_id: z.string().uuid().optional(),
      tran_ref: z.string().max(128).optional(),
      Data: z.object({ Invoice: z.object({ Id: z.union([z.string(), z.number()]) }) }).optional(),
    })
    .safeParse(payload);
  try {
    if (provider === "checkoutcom") {
      const payment = await checkoutComPaymentDetails(config, payload);
      if (!payment) return Response.json({ ok: true });
      const session = await getSession(payment.orderId, workspaceId);
      if (
        !session ||
        session.provider !== provider ||
        session.mode !== config.mode ||
        session.market !== market
      )
        return Response.json({ ok: true });
      if (!session.provider_reference)
        return new Response("Checkout is still being saved", { status: 503 });
      if (
        payment.amount !== minorUnits(Number(session.amount)) ||
        payment.currency !== session.currency
      )
        throw new Error("Checkout.com amount or currency does not match the order.");
      await confirmCheckoutComPage(
        config,
        session.provider_reference,
        session.order_id,
        payment.amount,
        payment.currency,
      );
      const { error } = await sbAny(supabaseAdmin).rpc("reconcile_commerce_online_payment", {
        p_order_id: session.order_id,
        p_provider_reference: session.provider_reference,
        p_status: payment.state,
      });
      if (error) throw error;
      return Response.json({ ok: true });
    }
    const reference =
      provider === "paypal"
        ? await verifiedPayPalNotification(config, request, payload)
        : parsed.success &&
          {
            tabby: parsed.data.id,
            tamara: parsed.data.order_id,
            tap: parsed.data.id,
            paytabs: parsed.data.tran_ref,
            myfatoorah: parsed.data.Data ? String(parsed.data.Data.Invoice.Id) : undefined,
          }[provider];
    if (!reference) return new Response("Invalid notification", { status: 400 });
    const db = sbAny(supabaseAdmin);
    const { data, error } = await db
      .from("commerce_online_payment_sessions")
      .select(sessionFields)
      .eq("workspace_id", workspaceId)
      .eq("market", market)
      .eq("mode", config.mode)
      .eq("provider", provider)
      .eq("provider_reference", reference)
      .maybeSingle();
    if (error) throw error;
    if (data) await reconcileSession(data as Session, config);
    return Response.json({ ok: true });
  } catch {
    return new Response("Payment verification unavailable", { status: 503 });
  }
}
