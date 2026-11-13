import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const local = (name: string) => fileURLToPath(new URL(name, import.meta.url));
export default defineConfig({
  root: local("."),
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [
      { find: "@tanstack/react-router", replacement: local("./router.tsx") },
      { find: "@tanstack/react-start", replacement: local("./server.ts") },
      ...[
        "@/hooks/use-brand-name",
        "@/hooks/use-platform-branding",
        "@/hooks/use-currency",
        "@/hooks/use-whatsapp-cta",
        "@/shared/providers/theme-provider",
        "@/lib/billing/plans.functions",
        "@/lib/marketing/lead-capture.functions",
        "@/lib/auth/marketing-redirect",
        "@/integrations/supabase/client",
      ].map((find) => ({ find, replacement: local("./data.ts") })),
      { find: "@", replacement: local("../../../src") },
    ],
  },
  server: { host: "127.0.0.1", port: 8092, strictPort: true, fs: { allow: [local("../../..")] } },
});
