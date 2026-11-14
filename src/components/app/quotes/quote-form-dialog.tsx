import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useTenantCurrency } from "@/hooks/use-currency";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPlatformTaxDefaults } from "@/lib/billing/default-vat.functions";
import { useActiveOrganization } from "@/hooks/use-organization";
import { suggestedStandardRate, taxDisplayName, taxBreakdown } from "@/lib/billing/tax-jurisdiction";
import {
  computeTotals,
  useSaveQuote,
  type QuoteFormInput,
  type QuoteWithLines,
} from "@/hooks/use-quotes";
import { toast } from "sonner";
import { DatePicker } from "@/shared/components";
import { format as fmtDate, parseISO } from "date-fns";
import { sbAny } from "@/lib/supabase/untyped";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  quote?: QuoteWithLines | null;
  onSaved?: (id: string) => void;
  defaults?: Partial<QuoteFormInput>;
};

const emptyLine = (vatRate = 0) => ({
  name: "",
  description: "",
  quantity: 1,
  unit_price: 0,
  discount_pct: 0,
  tax_rate: vatRate,
  product_id: null,
});

export function QuoteFormDialog({ open, onOpenChange, quote, onSaved, defaults }: Props) {
  const { active } = useCurrentWorkspace();
  // New quotes must open in the tenant currency: a hardcoded 'USD' here was
  // written into the quote row, so the display had no wrong value to correct.
  const tenantCurrency = useTenantCurrency();
  const { active: organization } = useActiveOrganization();
  const getTaxDefaults = useServerFn(getPlatformTaxDefaults);
  const { data: taxDefaults, isSuccess: vatLoaded } = useQuery({
    queryKey: ["platform-tax-defaults"],
    queryFn: () => getTaxDefaults(),
    enabled: open,
    staleTime: 60_000,
  });
  const tenantCountry = organization?.country_code ?? null;
  const vatRate = tenantCountry === "IN"
    ? (taxDefaults?.gstRate ?? 0)
    : tenantCountry === "AE"
      ? (taxDefaults?.vatRate ?? suggestedStandardRate(tenantCountry) ?? 0)
      : (suggestedStandardRate(tenantCountry) ?? 0);


  const wsId = active?.id;
  const save = useSaveQuote();

  const [form, setForm] = useState<QuoteFormInput>({
    tax_country_code: tenantCountry,
    tax_supply_type: null,
    title: "",
    currency: tenantCurrency,
    lines: [emptyLine(vatRate)],
    contact_id: null,
    company_id: null,
    deal_id: null,
  });

  useEffect(() => {
    if (!open) return;
    if (quote) {
      setForm({
        id: quote.id,
        tax_country_code: (quote as typeof quote & {tax_country_code?: string | null}).tax_country_code ?? null,
        tax_supply_type: (quote as typeof quote & {tax_supply_type?: "intra_state" | "inter_state" | null}).tax_supply_type ?? null,
        title: quote.title,
        currency: quote.currency,
        contact_id: quote.contact_id,
        company_id: quote.company_id,
        deal_id: quote.deal_id,
        valid_until: quote.valid_until,
        notes: quote.notes,
        terms: quote.terms,
        lines: (quote.line_items || []).map((l) => ({
          id: l.id,
          product_id: l.product_id,
          name: l.name,
          description: l.description,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          discount_pct: Number(l.discount_pct),
          tax_rate: Number(l.tax_rate),
        })),
      });
    } else {
      setForm({
        title: "",
        currency: tenantCurrency,
        tax_country_code: tenantCountry,
        tax_supply_type: null,
        lines: [emptyLine(vatRate)],
        ...defaults,
      });
    }
  }, [open, quote, defaults, tenantCurrency, tenantCountry, vatRate]);

  // A late settings fetch may initialize only an untouched draft line.
  // Never rewrite saved quote lines or explicit caller-provided defaults.
  useEffect(() => {
    if (!open || quote || !vatLoaded || defaults?.lines?.length) return;
    setForm((previous) => {
      const lines = previous.lines.map((line) =>
        !line.name && !line.product_id && line.unit_price === 0 && line.tax_rate === 0
          ? { ...line, tax_rate: vatRate }
          : line,
      );
      return lines.some((line, index) => line !== previous.lines[index])
        ? { ...previous, lines }
        : previous;
    });
  }, [open, quote, vatLoaded, vatRate, defaults?.lines]);

  const { data: contacts } = useQuery({
    queryKey: ["quotes-contacts", wsId],
    enabled: !!wsId && open,
    queryFn: async () => {
      const { data } = await sbAny(db)
        .from("contacts")
        .select("id, first_name, last_name, email")
        .eq("workspace_id", wsId)
        .limit(200);
      return data ?? [];
    },
  });
  const { data: companies } = useQuery({
    queryKey: ["quotes-companies", wsId],
    enabled: !!wsId && open,
    queryFn: async () => {
      const { data } = await sbAny(db)
        .from("companies")
        .select("id, name")
        .eq("workspace_id", wsId)
        .limit(200);
      return data ?? [];
    },
  });
  const { data: deals } = useQuery({
    queryKey: ["quotes-deals", wsId],
    enabled: !!wsId && open,
    queryFn: async () => {
      const { data } = await sbAny(db)
        .from("deals")
        .select("id, title")
        .eq("workspace_id", wsId)
        .is("deleted_at", null)
        .limit(200);
      return data ?? [];
    },
  });
  const { data: products } = useQuery({
    queryKey: ["quotes-products", wsId],
    enabled: !!wsId && open,
    queryFn: async () => {
      const { data } = await sbAny(db)
        .from("products")
        .select("id, name, price, currency, tax_rate")
        .eq("workspace_id", wsId)
        .is("deleted_at", null)
        .limit(300);
      return data ?? [];
    },
  });

  const totals = useMemo(() => computeTotals(form.lines), [form.lines]);
  const cur = form.currency;
  const money = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: cur || tenantCurrency }).format(
      n || 0,
    );

  const updateLine = (i: number, patch: Partial<QuoteFormInput["lines"][number]>) => {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    }));
  };
  const pickProduct = (i: number, productId: string) => {
    const p = (products ?? []).find((x: { id: string }) => x.id === productId);
    if (!p) return;
    updateLine(i, {
      product_id: productId,
      name: p.name,
      unit_price: Number(p.price ?? 0),
      tax_rate: Number(p.tax_rate ?? 0),
    });
  };

  const taxCountry = form.tax_country_code ?? null;
  const indianSupply = form.tax_supply_type ?? "unknown";
  const taxLines = useMemo(() => {
    const summed = new Map<string, { rate: number; amount: number }>();
    for (const line of form.lines) {
      const net = line.quantity * line.unit_price * (1 - line.discount_pct / 100);
      if (!net || !line.tax_rate || (taxCountry === "IN" && indianSupply === "unknown")) continue;
      for (const part of taxBreakdown(taxCountry, net, line.tax_rate, indianSupply)) {
        const item = summed.get(part.code) ?? { rate: part.rate, amount: 0 };
        item.amount += part.amount;
        summed.set(part.code, item);
      }
    }
    return Array.from(summed, ([name, part]) => ({ name, ...part }));
  }, [form.lines, taxCountry, indianSupply]);

  const submit = async () => {
    if (!quote && !taxCountry) return toast.error("Select your organization's tax country under Organization → Locale");
    if (taxCountry === "IN" && !form.tax_supply_type)
      return toast.error("Select intra-state or inter-state GST treatment");
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.lines.length) return toast.error("At least one line item");
    try {
      const id = await save.mutateAsync(form);
      toast.success(quote ? "Quote updated" : "Quote created");
      onOpenChange(false);
      onSaved?.(id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quote ? `Edit quote ${quote.quote_number}` : "New quote"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Website redesign — Acme Corp"
            />
          </div>
          <div>
            <Label>Customer (contact)</Label>
            <Select
              value={form.contact_id ?? "none"}
              onValueChange={(v) => setForm({ ...form, contact_id: v === "none" ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(contacts ?? []).map(
                  (c: {
                    id: string;
                    first_name: string | null;
                    last_name: string | null;
                    email: string | null;
                  }) => (
                    <SelectItem key={c.id} value={c.id}>
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                        c.email ||
                        c.id.slice(0, 8)}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Company</Label>
            <Select
              value={form.company_id ?? "none"}
              onValueChange={(v) => setForm({ ...form, company_id: v === "none" ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(companies ?? []).map((c: { id: string; name: string }) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Deal</Label>
            <Select
              value={form.deal_id ?? "none"}
              onValueChange={(v) => setForm({ ...form, deal_id: v === "none" ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Link to deal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(deals ?? []).map((d: { id: string; title: string }) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Input
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              maxLength={3}
            />
          </div>
          <div>
            <Label>Valid until</Label>
            <DatePicker
              value={form.valid_until ? parseISO(form.valid_until) : undefined}
              onChange={(d) =>
                setForm({ ...form, valid_until: d ? fmtDate(d, "yyyy-MM-dd") : null })
              }
            />
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base">Line items</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine(vatRate)] }))}
            >
              <Plus className="h-4 w-4 " /> Add line
            </Button>
          </div>
          <div className="rounded-control border divide-y">
            {form.lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 p-3 items-start">
                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Select
                    value={l.product_id ?? "custom"}
                    onValueChange={(v) =>
                      v === "custom" ? updateLine(i, { product_id: null }) : pickProduct(i, v)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Product / service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom item</SelectItem>
                      {(products ?? []).map((p: { id: string; name: string }) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Name"
                    value={l.name}
                    onChange={(e) => updateLine(i, { name: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    rows={2}
                    value={l.description ?? ""}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={l.quantity}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs">Unit price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={l.unit_price}
                    onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <Label className="text-xs">Disc %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={l.discount_pct}
                    onChange={(e) => updateLine(i, { discount_pct: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <Label className="text-xs">Tax %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={l.tax_rate}
                    onChange={(e) => updateLine(i, { tax_rate: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-8 md:col-span-2 flex items-end justify-between">
                  <div className="text-sm font-medium">
                    {money(
                      l.quantity *
                        l.unit_price *
                        (1 - l.discount_pct / 100) *
                        (1 + l.tax_rate / 100),
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-8">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="w-28 text-right">{money(totals.subtotal)}</span>
            </div>
            <div className="flex gap-8">
              <span className="text-muted-foreground">Discount</span>
              <span className="w-28 text-right">−{money(totals.discount_total)}</span>
            </div>
            <div className="flex gap-8">
              <span className="text-muted-foreground">Tax</span>
              <span className="w-28 text-right">{money(totals.tax_total)}</span>
            </div>
            <div className="flex gap-8 text-base font-semibold">
              <span>Grand total</span>
              <span className="w-28 text-right">{money(totals.total)}</span>
            </div>
          </div>
        </div>

        {taxCountry === "IN" && (
          <div className="rounded-control border p-3 space-y-2">
            <Label>India GST supply treatment</Label>
            <Select
              value={form.tax_supply_type ?? "unknown"}
              onValueChange={(v) =>
                setForm((previous) => ({
                  ...previous,
                  tax_supply_type: v === "unknown" ? null : v as "intra_state" | "inter_state",
                }))
              }
            >
              <SelectTrigger><SelectValue placeholder="Choose supply treatment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Select supply treatment</SelectItem>
                <SelectItem value="intra_state">Within the same state — CGST + SGST/UTGST</SelectItem>
                <SelectItem value="inter_state">Between states — IGST</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Determine supply treatment using supplier and place-of-supply rules. Different
              goods and services may require different GST rates.
            </p>
          </div>
        )}
        {taxLines.length > 0 && (
          <div className="text-sm space-y-1">
            {taxLines.map((part) => (
              <div className="flex justify-end gap-8" key={part.name}>
                <span>{part.name}</span>
                <span className="w-28 text-right">{money(part.amount)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2 mt-2">
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Visible to the customer"
            />
          </div>
          <div>
            <Label>Terms & conditions</Label>
            <Textarea
              rows={3}
              value={form.terms ?? ""}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              placeholder="Payment terms, delivery, warranty"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving" : quote ? "Save changes" : "Create quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
