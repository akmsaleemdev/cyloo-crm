import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route as HomeRoute } from "@/routes/index";
import { Route as PricingRoute } from "@/routes/pricing";
import "../../../src/styles.css";

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const LandingPage = HomeRoute.options.component!;
const PricingPage = PricingRoute.options.component!;
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={client}>
    {location.pathname === "/pricing" ? <PricingPage /> : <LandingPage />}
  </QueryClientProvider>,
);
