import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { sanitizeSearchTerm } from "@/lib/api/postgrest-filters";
import { sbAny } from "@/lib/supabase/untyped";
import { formatMoney } from "@/lib/currency/format";
import type { SupabaseClient } from "@supabase/supabase-js";

export const LINKABLE_ENTITIES = [
  "contact",
  "company",
  "deal",
  "order",
  "invoice",
  "quote",
  "appointment",
  "product",
  "subscription",
  "conversation",
  "kb_article",
  "workflow",
  "asset",
] as const;
export type LinkableEntity = (typeof LINKABLE_ENTITIES)[number];

const EntityEnum = z.enum(LINKABLE_ENTITIES);

type RelationshipRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  domain?: string | null;
  amount?: number | null;
  currency?: string | null;
  invoice_number?: string | null;
  quote_number?: string | null;
  total?: number | null;
  status?: string | null;
  title?: string | null;
  start_at?: string | null;
  sku?: string | null;
  plan_id?: string | null;
  current_period_end?: string | null;
  subject?: string | null;
  channel?: string | null;
  slug?: string | null;
  is_active?: boolean | null;
  asset_type?: string | null;
  identifier?: string | null;
  vendor?: string | null;
  model?: string | null;
};

type HydratedRelationship = {
  id: string;
  kind: LinkableEntity;
  label: string;
  sub: string | null;
  raw: RelationshipRow;
};

function isRelationshipRow(value: unknown): value is RelationshipRow {
  return (
    typeof value === "object" && value !== null && "id" in value && typeof value.id === "string"
  );
}

async function resolveWorkspace(supabase: SupabaseClient, userId: string, ticketId: string) {
  const { data: t } = await supabase
    .from("conversations")
    .select("id, workspace_id, contact_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!t) throw new Error("Ticket not found");
  const { data: m } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", t.workspace_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!m) throw new Error("Forbidden");
  return t as { id: string; workspace_id: string; contact_id: string | null };
}

/** Fetch a lightweight display record for an entity id. */
async function hydrate(
  supabase: SupabaseClient,
  kind: LinkableEntity,
  ids: string[],
): Promise<HydratedRelationship[]> {
  if (!ids.length) return [];
  const table: Record<
    LinkableEntity,
    {
      tbl: string;
      cols: string;
      label: (r: RelationshipRow) => string;
      sub?: (r: RelationshipRow) => string | null;
    }
  > = {
    contact: {
      tbl: "contacts",
      cols: "id, first_name, last_name, email, phone",
      label: (r) =>
        `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email || r.phone || "Contact",
      sub: (r) => r.email ?? r.phone ?? null,
    },
    company: {
      tbl: "companies",
      cols: "id, name, domain",
      label: (r) => r.name ?? "",
      sub: (r) => r.domain ?? null,
    },
    // Each of these rows stores the currency it was raised in, so it is selected
    // and rendered rather than assumed — the hardcoded "$" showed dollars to
    // every tenant regardless of what the record actually said.
    deal: {
      tbl: "deals",
      cols: "id, name, amount, currency, stage_id",
      label: (r) => r.name ?? "",
      sub: (r) => (r.amount ? formatMoney(r.amount, r.currency) : null),
    },
    order: {
      tbl: "deals",
      cols: "id, name, amount, currency",
      label: (r) => r.name ?? "",
      sub: (r) => (r.amount ? formatMoney(r.amount, r.currency) : null),
    },
    invoice: {
      tbl: "invoices",
      cols: "id, invoice_number, total, currency, status",
      label: (r) => r.invoice_number ?? "Invoice",
      sub: (r) =>
        `${r.status ?? ""} ${r.total ? `· ${formatMoney(r.total, r.currency)}` : ""}`.trim(),
    },
    quote: {
      tbl: "quotes",
      cols: "id, quote_number, total, currency, status",
      label: (r) => r.quote_number ?? "Quote",
      sub: (r) =>
        `${r.status ?? ""} ${r.total ? `· ${formatMoney(r.total, r.currency)}` : ""}`.trim(),
    },
    appointment: {
      tbl: "booking_appointments",
      cols: "id, title, start_at, status",
      label: (r) => r.title ?? "Appointment",
      sub: (r) => r.start_at ?? null,
    },
    product: {
      tbl: "products",
      cols: "id, name, sku, price",
      label: (r) => r.name ?? "",
      sub: (r) => r.sku ?? null,
    },
    subscription: {
      tbl: "subscriptions",
      cols: "id, status, plan_id, current_period_end",
      label: (r) => `Subscription ${r.status ?? ""}`,
      sub: (r) => r.current_period_end ?? null,
    },
    conversation: {
      tbl: "conversations",
      cols: "id, subject, channel, status",
      label: (r) => r.subject ?? "Conversation",
      sub: (r) => `${r.channel} · ${r.status}`,
    },
    kb_article: {
      tbl: "kb_articles",
      cols: "id, title, slug, status",
      label: (r) => r.title ?? "",
      sub: (r) => r.status ?? null,
    },
    workflow: {
      tbl: "automations",
      cols: "id, name, is_active",
      label: (r) => r.name ?? "",
      sub: (r) => (r.is_active ? "Active" : "Inactive"),
    },
    asset: {
      tbl: "ticket_assets",
      cols: "id, name, asset_type, identifier, vendor, model, status",
      label: (r) => r.name ?? "",
      sub: (r) =>
        [r.vendor, r.model, r.identifier].filter(Boolean).join(" · ") || r.asset_type || null,
    },
  };
  const cfg = table[kind];
  const { data } = await sbAny(supabase).from(cfg.tbl).select(cfg.cols).in("id", ids);
  const rows: unknown[] = data ?? [];
  return rows.filter(isRelationshipRow).map((r) => ({
    id: r.id,
    kind,
    label: cfg.label(r),
    sub: cfg.sub?.(r) ?? null,
    raw: r,
  }));
}

export const listTicketRelationships = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: { ticketId: string }) => z.object({ ticketId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await resolveWorkspace(supabase, userId, data.ticketId);

    const { data: links } = await supabase
      .from("ticket_crm_links")
      .select("id, entity_type, entity_id, created_at")
      .eq("ticket_id", data.ticketId);

    const byKind = new Map<LinkableEntity, string[]>();
    (links ?? []).forEach((l) => {
      const kind = EntityEnum.safeParse(l.entity_type);
      if (!kind.success) return;
      const arr = byKind.get(kind.data) ?? [];
      arr.push(l.entity_id);
      byKind.set(kind.data, arr);
    });

    const hydrated = (
      await Promise.all(
        Array.from(byKind.entries()).map(async ([kind, ids]) => hydrate(supabase, kind, ids)),
      )
    ).flat();

    return { links: links ?? [], entities: hydrated };
  });

export const linkTicketEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: { ticketId: string; entityType: LinkableEntity; entityId: string }) =>
    z
      .object({ ticketId: z.string().uuid(), entityType: EntityEnum, entityId: z.string().uuid() })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const t = await resolveWorkspace(supabase, userId, data.ticketId);
    const { error } = await sbAny(supabase).from("ticket_crm_links").insert({
      workspace_id: t.workspace_id,
      ticket_id: data.ticketId,
      entity_type: data.entityType,
      entity_id: data.entityId,
      created_by: userId,
    });
    if (error && !String(error.message).includes("duplicate")) throw error;
    return { ok: true };
  });

export const unlinkTicketEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: { linkId: string }) => z.object({ linkId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await sbAny(supabase).from("ticket_crm_links").delete().eq("id", data.linkId);
    if (error) throw error;
    return { ok: true };
  });

export const searchLinkableEntities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: { ticketId: string; entityType: LinkableEntity; query: string }) =>
    z
      .object({ ticketId: z.string().uuid(), entityType: EntityEnum, query: z.string().max(200) })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const t = await resolveWorkspace(supabase, userId, data.ticketId);
    const q = data.query.trim();
    const like = `%${sanitizeSearchTerm(q)}%`;
    const wf = "workspace_id";

    const cfg: Record<
      LinkableEntity,
      {
        tbl: string;
        cols: string;
        searchCols: string[];
        label: (r: RelationshipRow) => string;
        sub?: (r: RelationshipRow) => string | null;
      }
    > = {
      contact: {
        tbl: "contacts",
        cols: "id, first_name, last_name, email, phone",
        searchCols: ["first_name", "last_name", "email", "phone"],
        label: (r) => `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email || "Contact",
        sub: (r) => r.email ?? r.phone ?? null,
      },
      company: {
        tbl: "companies",
        cols: "id, name, domain",
        searchCols: ["name", "domain"],
        label: (r) => r.name ?? "",
        sub: (r) => r.domain ?? null,
      },
      deal: {
        tbl: "deals",
        cols: "id, name, amount, currency",
        searchCols: ["name"],
        label: (r) => r.name ?? "",
        sub: (r) => (r.amount ? formatMoney(r.amount, r.currency) : null),
      },
      order: {
        tbl: "deals",
        cols: "id, name, amount, currency",
        searchCols: ["name"],
        label: (r) => r.name ?? "",
        sub: (r) => (r.amount ? formatMoney(r.amount, r.currency) : null),
      },
      invoice: {
        tbl: "invoices",
        cols: "id, invoice_number, total, status",
        searchCols: ["invoice_number"],
        label: (r) => r.invoice_number ?? "Invoice",
        sub: (r) => r.status ?? null,
      },
      quote: {
        tbl: "quotes",
        cols: "id, quote_number, total, status",
        searchCols: ["quote_number"],
        label: (r) => r.quote_number ?? "Quote",
        sub: (r) => r.status ?? null,
      },
      appointment: {
        tbl: "booking_appointments",
        cols: "id, title, start_at, status",
        searchCols: ["title"],
        label: (r) => r.title ?? "Appointment",
        sub: (r) => r.start_at ?? null,
      },
      product: {
        tbl: "products",
        cols: "id, name, sku, price",
        searchCols: ["name", "sku"],
        label: (r) => r.name ?? "",
        sub: (r) => r.sku ?? null,
      },
      subscription: {
        tbl: "subscriptions",
        cols: "id, status, plan_id",
        searchCols: ["status"],
        label: (r) => `Subscription ${r.status ?? ""}`,
        sub: () => null,
      },
      conversation: {
        tbl: "conversations",
        cols: "id, subject, channel, status",
        searchCols: ["subject"],
        label: (r) => r.subject ?? "Conversation",
        sub: (r) => `${r.channel} · ${r.status}`,
      },
      kb_article: {
        tbl: "kb_articles",
        cols: "id, title, slug, status",
        searchCols: ["title", "slug"],
        label: (r) => r.title ?? "",
        sub: (r) => r.status ?? null,
      },
      workflow: {
        tbl: "automations",
        cols: "id, name, is_active",
        searchCols: ["name"],
        label: (r) => r.name ?? "",
        sub: (r) => (r.is_active ? "Active" : "Inactive"),
      },
      asset: {
        tbl: "ticket_assets",
        cols: "id, name, asset_type, identifier, vendor, model",
        searchCols: ["name", "identifier", "vendor", "model"],
        label: (r) => r.name ?? "",
        sub: (r) => [r.vendor, r.model].filter(Boolean).join(" · ") || r.asset_type || null,
      },
    };
    const c = cfg[data.entityType];
    let query = sbAny(supabase).from(c.tbl).select(c.cols).eq(wf, t.workspace_id).limit(20);
    if (q) {
      const or = c.searchCols.map((col) => `${col}.ilike.${like}`).join(",");
      query = query.or(or);
    }
    const { data: rows, error } = await query;
    if (error) throw error;
    const resultRows: unknown[] = rows ?? [];
    return resultRows.filter(isRelationshipRow).map((r) => ({
      id: r.id,
      label: c.label(r),
      sub: c.sub?.(r) ?? null,
    }));
  });

/** Complete customer history: everything tied to the ticket's contact/company. */
export const getCustomerHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: { ticketId: string }) => z.object({ ticketId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const t = await resolveWorkspace(supabase, userId, data.ticketId);
    if (!t.contact_id) return { contact: null, timeline: [] };

    const contactId = t.contact_id;
    const [contact, tickets, deals, invoices, quotes, appointments, subs, assets, comms] =
      await Promise.all([
        sbAny(supabase)
          .from("contacts")
          .select("id, first_name, last_name, email, phone, company_id")
          .eq("id", contactId)
          .maybeSingle(),
        sbAny(supabase)
          .from("conversations")
          .select("id, subject, status, priority, created_at")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false })
          .limit(50),
        sbAny(supabase)
          .from("deals")
          .select("id, name, amount, currency, created_at")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false })
          .limit(20),
        sbAny(supabase)
          .from("invoices")
          .select("id, invoice_number, total, currency, status, created_at")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false })
          .limit(20),
        sbAny(supabase)
          .from("quotes")
          .select("id, quote_number, total, currency, status, created_at")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false })
          .limit(20),
        sbAny(supabase)
          .from("booking_appointments")
          .select("id, title, start_at, status, created_at")
          .eq("contact_id", contactId)
          .order("start_at", { ascending: false })
          .limit(20),
        Promise.resolve({
          data: [] as Array<{
            id: string;
            status: string | null;
            current_period_end: string | null;
            created_at: string;
          }>,
        }),
        sbAny(supabase)
          .from("ticket_assets")
          .select("id, name, asset_type, status, created_at")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false })
          .limit(20),
        sbAny(supabase)
          .from("communications")
          .select("id, type, subject, created_at, entity_type, entity_id")
          .eq("entity_type", "contact")
          .eq("entity_id", contactId)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

    const timeline: Array<{
      kind: string;
      id: string;
      title: string;
      sub?: string | null;
      at: string;
    }> = [];
    (tickets.data ?? []).forEach((r) =>
      timeline.push({
        kind: "ticket",
        id: r.id,
        title: r.subject ?? "Ticket",
        sub: `${r.status} · ${r.priority ?? ""}`,
        at: r.created_at,
      }),
    );
    (deals.data ?? []).forEach((r) =>
      timeline.push({
        kind: "deal",
        id: r.id,
        title: r.name,
        sub: r.amount ? formatMoney(r.amount, r.currency) : null,
        at: r.created_at,
      }),
    );
    (invoices.data ?? []).forEach((r) =>
      timeline.push({
        kind: "invoice",
        id: r.id,
        title: r.invoice_number ?? "Invoice",
        sub: `${r.status} · ${formatMoney(r.total ?? 0, r.currency)}`,
        at: r.created_at,
      }),
    );
    (quotes.data ?? []).forEach((r) =>
      timeline.push({
        kind: "quote",
        id: r.id,
        title: r.quote_number ?? "Quote",
        sub: `${r.status} · ${formatMoney(r.total ?? 0, r.currency)}`,
        at: r.created_at,
      }),
    );
    (appointments.data ?? []).forEach((r) =>
      timeline.push({
        kind: "appointment",
        id: r.id,
        title: r.title ?? "Appointment",
        sub: `${r.status}`,
        at: r.start_at ?? r.created_at,
      }),
    );
    (subs.data ?? []).forEach((r) =>
      timeline.push({
        kind: "subscription",
        id: r.id,
        title: `Subscription ${r.status}`,
        sub: r.current_period_end,
        at: r.created_at,
      }),
    );
    (assets.data ?? []).forEach((r) =>
      timeline.push({
        kind: "asset",
        id: r.id,
        title: r.name,
        sub: r.asset_type,
        at: r.created_at,
      }),
    );
    (comms.data ?? []).forEach((r) =>
      timeline.push({
        kind: "communication",
        id: r.id,
        title: r.subject ?? r.type,
        sub: r.type,
        at: r.created_at,
      }),
    );

    timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { contact: contact.data ?? null, timeline: timeline.slice(0, 100) };
  });
