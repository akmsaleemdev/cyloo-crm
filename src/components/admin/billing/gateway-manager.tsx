import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GatewaySettingsPanel } from "@/components/admin/billing/gateway-settings-panel";
import { PaymentsLedger } from "@/components/admin/billing/payments-ledger";
import { listCommerceGatewayReadiness } from "@/lib/billing/gateways.functions";
import { ONLINE_PAYMENT_LABELS } from "@/lib/commerce/online-payment-methods";

export function GatewayManager() {
  const getReadiness = useServerFn(listCommerceGatewayReadiness);
  const readiness = useQuery({
    queryKey: ["billing", "commerce-gateway-readiness"],
    queryFn: () => getReadiness(),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-control bg-primary/10 text-primary grid place-items-center">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">Payment Gateways</h2>
          <p className="text-sm text-muted-foreground">
            Manage provider capabilities, payment history, refunds and retries.
          </p>
        </div>
      </header>

      <section aria-labelledby="commerce-gateways-heading" className="space-y-3">
        <div>
          <h3 id="commerce-gateways-heading" className="text-sm font-medium">
            Customer checkout gateways
          </h3>
          <p className="text-xs text-muted-foreground">
            Runtime configuration by country. Verify connectivity and payments in each merchant
            sandbox.
          </p>
        </div>
        {readiness.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            Checking checkout configuration…
          </p>
        )}
        {readiness.isError && (
          <p role="alert" className="text-sm text-destructive">
            Unable to read checkout configuration.
          </p>
        )}
        {readiness.data && (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {readiness.data.map(({ provider, markets }) => (
              <li key={provider} className="space-y-2 rounded-control border p-3">
                <span className="text-sm font-medium">{ONLINE_PAYMENT_LABELS[provider]}</span>
                <div className="flex flex-wrap gap-1">
                  {!markets.length && <Badge variant="outline">Setup required</Badge>}
                  {markets.map(({ country, mode }) => (
                    <Badge key={country} variant="secondary">
                      {country} · {mode} configured
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <GatewaySettingsPanel />

      {/* Payments history — shared with the Billing admin page */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Payment history</h3>
        <PaymentsLedger />
      </section>
    </div>
  );
}
