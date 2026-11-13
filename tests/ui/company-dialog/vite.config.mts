import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const data = fileURLToPath(new URL("./data.ts", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [
      ...["use-companies", "use-workspace", "use-currency", "use-custom-fields"].map((name) => ({
        find: `@/hooks/${name}`,
        replacement: data,
      })),
      { find: "@/integrations/supabase/client", replacement: data },
      { find: "@", replacement: fileURLToPath(new URL("../../../src", import.meta.url)) },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 8091,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL("../../..", import.meta.url))] },
  },
});
