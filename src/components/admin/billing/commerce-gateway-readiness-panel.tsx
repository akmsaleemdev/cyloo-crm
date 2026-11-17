import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { listCommerceGatewayReadiness } from "@/lib/billing/gateways.functions";
import {
  ONLINE_PAYMENT_LABELS,
  ONLINE_PAYMENT_PROVIDERS,
} from "@/lib/commerce/online-payment-methods";

export function CommerceGatewayReadinessPanel() {
  const headingId = useId();
  const getReadiness = useServerFn(listCommerceGatewayReadiness);
  const readiness = useQuery({
    queryKey: ["billing", "commerce-gateway-readiness"],
    queryFn: () => getReadiness(),
  });

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div>
        <h3 id={headingId} className="text-sm font-medium">
          Customer checkout gateways
        </h3>
        <p className="text-xs text-muted-foreground">
          Merchant configuration by country. Setup and webhook settings are managed on the server.
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
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {ONLINE_PAYMENT_PROVIDERS.map((provider) => {
          const markets = readiness.data?.find((item) => item.provider === provider)?.markets;
          return (
            <li key={provider} className="space-y-2 rounded-control border p-3">
              <span className="text-sm font-medium">{ONLINE_PAYMENT_LABELS[provider]}</span>
              <div className="flex flex-wrap gap-1">
                {markets?.length === 0 && <Badge variant="outline">Setup required</Badge>}
                {markets?.map(({ country, mode }) => (
                  <Badge key={country} variant="secondary">
                    {country} · {mode} configured
                  </Badge>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
