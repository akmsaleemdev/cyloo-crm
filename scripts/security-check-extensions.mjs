import { createClient } from "@supabase/supabase-js";
import { validateExtensionAuditResult } from "./lib/extension-audit.mjs";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublicExtensions() {
  // Use an existing privileged catalog audit RPC. Never add a public arbitrary-SQL
  // endpoint to satisfy this check. A missing RPC requires approved DB inspection.

  const { data, error } = await supabase.rpc("read_query", {
    sql: `
      SELECT n.nspname as schema_name, p.proname as function_name
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND (
        p.proname LIKE 'vector_%' OR 
        p.proname LIKE 'l2_distance%' OR 
        p.proname LIKE 'inner_product%' OR 
        p.proname LIKE 'cosine_distance%' OR
        p.proname LIKE 'similarity%' OR
        p.proname LIKE 'show_trgm%' OR
        p.proname LIKE 'word_similarity%' OR
        p.proname LIKE 'strict_word_similarity%' OR
        p.proname LIKE 'gbt_%'
      );
    `,
  });

  validateExtensionAuditResult({ data, error });
  console.log("Security check passed: No forbidden extension helpers in public schema.");
}

checkPublicExtensions().catch((error) => {
  console.error(error instanceof Error ? error.message : "Extension catalog audit unavailable.");
  process.exitCode = 1;
});
