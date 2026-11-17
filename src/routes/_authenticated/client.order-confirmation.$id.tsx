import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Package } from "lucide-react";
import {
  myBeginOnlineCheckout,
  myGetOrder,
  myOnlinePaymentStatus,
  myRefreshOnlinePayment,
} from "@/lib/commerce/client-checkout.functions";
import {
  isOnlinePaymentProvider,
  ONLINE_PAYMENT_LABELS,
} from "@/lib/commerce/online-payment-methods";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { useCurrencyFormatter } from "@/hooks/use-currency";
export const Route = createFileRoute("/_authenticated/client/order-confirmation/$id")({
  component: ConfirmationPage,
});

const PAYMENT_MESSAGES = {
  unstarted: "Continue to the payment provider to complete checkout.",
  creating: "The checkout provider is preparing your payment.",
  pending: "Payment is awaiting confirmation from the provider.",
  authorized: "The provider authorized your payment. Capture is pending.",
  paid: "Payment confirmed.",
  failed: "Payment was declined or the checkout expired.",
  uncertain:
    "The provider did not confirm checkout creation. Contact support before trying another payment.",
  refunded: "The provider confirmed a full refund.",
} as const;

function ConfirmationPage() {
  const money = useCurrencyFormatter({ locale: "en-US" });
  const { id } = useParams({ from: "/_authenticated/client/order-confirmation/$id" });
  const getOrder = useServerFn(myGetOrder);
  const getPaymentStatus = useServerFn(myOnlinePaymentStatus);
  const refreshPayment = useServerFn(myRefreshOnlinePayment);
  const beginPayment = useServerFn(myBeginOnlineCheckout);
  const q = useQuery({
    queryKey: ["client-order", id],
    queryFn: () => getOrder({ data: { orderId: id } }),
  });

  const orderMetadata = q.data?.order?.metadata as { payment_method?: unknown } | undefined;
  const provider = orderMetadata?.payment_method;
  const paymentQ = useQuery({
    queryKey: ["client-order-online-payment", id],
    queryFn: () => getPaymentStatus({ data: { orderId: id } }),
    enabled: isOnlinePaymentProvider(provider),
  });
  const refresh = useMutation({
    mutationFn: () => refreshPayment({ data: { orderId: id } }),
    onSuccess: () => Promise.all([paymentQ.refetch(), q.refetch()]),
    onError: (error: Error) => toast.error(error.message),
  });
  const resume = useMutation({
    mutationFn: () => beginPayment({ data: { orderId: id } }),
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (error: Error) => {
      toast.error(error.message);
      void paymentQ.refetch();
    },
  });

  if (q.isLoading)
    return (
      <div className="p-8">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  const order = q.data?.order as
    | {
        order_number: string;
        total: number;
        currency: string;
        status: string;
        payment_status: string;
        channel: string | null;
        notes: string | null;
        shipping_address: unknown;
      }
    | undefined;
  const items = q.data?.items ?? [];
  if (!order) return <div className="p-6">Order not found.</div>;
  const shipAddr = order.shipping_address as {
    street1?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  } | null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rounded-control border border-border bg-surface p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <h2 className="font-display text-2xl font-semibold mt-2">Thanks for your order</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Confirmation number <span className="font-mono">{order.order_number}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Placed via {order.channel ?? "portal"} · Status {order.status}
        </p>
      </div>

      {isOnlinePaymentProvider(provider) && (
        <section className="space-y-3 rounded-control border border-border bg-surface p-4">
          <h3 className="font-semibold">
            {ONLINE_PAYMENT_LABELS[provider]} payment
            {paymentQ.data?.mode === "sandbox" ? " (test mode)" : ""}
          </h3>
          <p className="text-sm text-muted-foreground" role="status">
            {paymentQ.data
              ? PAYMENT_MESSAGES[paymentQ.data.status]
              : paymentQ.isError
                ? "Payment status is temporarily unavailable."
                : "Checking payment status…"}
          </p>
          <div className="flex flex-wrap gap-2">
            {paymentQ.data?.canResume && order.payment_status === "unpaid" && (
              <Button
                disabled={resume.isPending || refresh.isPending}
                onClick={() => resume.mutate()}
              >
                Continue to {ONLINE_PAYMENT_LABELS[provider]}
              </Button>
            )}
            {paymentQ.data?.mode && (
              <Button
                variant="outline"
                disabled={refresh.isPending || resume.isPending}
                onClick={() => refresh.mutate()}
              >
                {refresh.isPending ? "Checking payment…" : "Check payment status"}
              </Button>
            )}
          </div>
        </section>
      )}

      <div className="rounded-control border border-border bg-surface p-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" /> Items
        </h3>
        <div className="mt-3 divide-y divide-border">
          {items.map((i: { id: string; name: string; quantity: number; total: number }) => (
            <div key={i.id} className="py-2 flex justify-between text-sm">
              <span>
                {i.name} × {i.quantity}
              </span>
              <span>{money(i.total, order.currency)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-border pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>{money(order.total, order.currency)}</span>
        </div>
      </div>

      {shipAddr?.street1 && (
        <div className="rounded-control border border-border bg-surface p-4 text-sm">
          <h3 className="font-semibold">Shipping to</h3>
          <p className="mt-1 text-muted-foreground">
            {shipAddr.street1}, {shipAddr.city} {shipAddr.region ?? ""} {shipAddr.postal_code},{" "}
            {shipAddr.country}
          </p>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button asChild variant="outline">
          <Link to="/client/orders">View orders</Link>
        </Button>
        <Button asChild>
          <Link to="/client">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
