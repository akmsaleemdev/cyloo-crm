import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app/app-topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  ExternalLink,
  Download,
  Eye,
  History,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contracts")({
  component: ContractsPage,
  staticData: { breadcrumb: "Contracts & CLM" },
  head: () => ({
    meta: [
      { title: "Contract Lifecycle Management (CLM) | CYLOO CRM" },
      {
        name: "description",
        content:
          "Enterprise contract lifecycle management, digital legal agreements, master clause library, and e-signatures.",
      },
    ],
  }),
});

interface ContractRecord {
  id: string;
  title: string;
  type: "NDA" | "MSA" | "SLA" | "SOW" | "Custom";
  counterparty: string;
  value: string;
  status: "draft" | "in_review" | "pending_signature" | "signed" | "expiring";
  renewalDate: string;
  daysToRenewal: number;
  signedBy?: string;
  signedAt?: string;
}

const INITIAL_CONTRACTS: ContractRecord[] = [
  {
    id: "CTR-2026-0891",
    title: "Enterprise Master Services Agreement (MSA)",
    type: "MSA",
    counterparty: "Emaar Properties PJSC",
    value: "AED 340,000 / yr",
    status: "signed",
    renewalDate: "2027-10-15",
    daysToRenewal: 341,
    signedBy: "Rashid Al-Maktoum (CFO)",
    signedAt: "2026-10-15 14:22 UTC",
  },
  {
    id: "CTR-2026-0892",
    title: "Non-Disclosure & Confidentiality Agreement",
    type: "NDA",
    counterparty: "Saudi Aramco Digital",
    value: "N/A",
    status: "signed",
    renewalDate: "2028-11-01",
    daysToRenewal: 723,
    signedBy: "Tariq Mansoor (General Counsel)",
    signedAt: "2026-11-01 09:10 UTC",
  },
  {
    id: "CTR-2026-0893",
    title: "Software License & 24/7 SLA Addendum",
    type: "SLA",
    counterparty: "Al-Futtaim Group",
    value: "AED 180,000 / yr",
    status: "pending_signature",
    renewalDate: "2027-11-30",
    daysToRenewal: 387,
  },
  {
    id: "CTR-2026-0894",
    title: "Omnichannel AI Implementation Statement of Work",
    type: "SOW",
    counterparty: "Qatar National Bank (QNB)",
    value: "USD 95,000",
    status: "in_review",
    renewalDate: "2027-02-28",
    daysToRenewal: 112,
  },
  {
    id: "CTR-2026-0895",
    title: "Annual Cloud Support & Voice Gateway SLA",
    type: "SLA",
    counterparty: "Bapco Energies BSC",
    value: "BHD 18,500 / yr",
    status: "expiring",
    renewalDate: "2026-12-05",
    daysToRenewal: 27,
    signedBy: "Hassan Al-Zayani (IT VP)",
    signedAt: "2025-12-05 11:30 UTC",
  },
];

const PRE_APPROVED_CLAUSES = [
  {
    id: "CLS-01",
    title: "Data Sovereignty & GCC Residency Clause",
    category: "Compliance",
    text: "All customer records, conversation transcripts, and encrypted CRM backups shall reside strictly within certified data centers in the Kingdom of Saudi Arabia / United Arab Emirates conforming to national cybersecurity authority (NCA/TDRA) directives.",
  },
  {
    id: "CLS-02",
    title: "Limitation of Liability & Indemnity",
    category: "Legal Liability",
    text: "Neither party shall be liable for indirect, incidental, or consequential damages. Aggregate liability under this Agreement shall not exceed total fees paid by Customer during the twelve (12) month period immediately preceding the event.",
  },
  {
    id: "CLS-03",
    title: "Evergreen Auto-Renewal & 60-Day Notice",
    category: "Term & Renewal",
    text: "This Agreement automatically renews for successive one-year terms unless either party gives written notice of termination at least sixty (60) calendar days prior to the expiration of the then-current term.",
  },
  {
    id: "CLS-04",
    title: "Service Level Agreement (SLA) & Uptime Guarantee",
    category: "SLA",
    text: "CYLOO CRM guarantees 99.9% monthly platform availability. For any calendar month in which availability falls below this threshold, Customer shall receive a prorated service credit against future recurring billing cycles.",
  },
];

export function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>(INITIAL_CONTRACTS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all_contracts");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCounterparty, setNewCounterparty] = useState("");
  const [newType, setNewType] = useState<ContractRecord["type"]>("MSA");
  const [newValue, setNewValue] = useState("");

  const filteredContracts = contracts.filter((c) => {
    const matchQuery =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.counterparty.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    if (!matchQuery) return false;
    if (activeTab === "pending")
      return c.status === "pending_signature" || c.status === "in_review";
    if (activeTab === "signed") return c.status === "signed";
    if (activeTab === "expiring") return c.daysToRenewal <= 60;
    return true;
  });

  const handleCreateContract = () => {
    if (!newTitle.trim() || !newCounterparty.trim()) {
      toast.error("Please fill in contract title and counterparty name.");
      return;
    }
    const newRecord: ContractRecord = {
      id: `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      type: newType,
      counterparty: newCounterparty,
      value: newValue || "N/A",
      status: "draft",
      renewalDate: "2027-11-08",
      daysToRenewal: 365,
    };
    setContracts([newRecord, ...contracts]);
    setCreateModalOpen(false);
    setNewTitle("");
    setNewCounterparty("");
    setNewValue("");
    toast.success("New legal contract created in Draft state.");
  };

  const handleSignContract = (id: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "signed",
              signedBy: "Current Operator (Authorized Representative)",
              signedAt: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
            }
          : c,
      ),
    );
    toast.success("Contract cryptographically signed with audit stamp.");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppTopbar />
      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Contract Lifecycle Management (CLM)
              </h1>
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/20"
              >
                Module 6 • Hub 1
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Master legal clause library, NDA/MSA authoring, e-signatures, and automated renewal
              triggers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> New Agreement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Author New Legal Agreement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Agreement Title
                    </label>
                    <Input
                      placeholder="e.g. Master Services Agreement 2026"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Counterparty Organization
                    </label>
                    <Input
                      placeholder="e.g. Dubai Holding LLC"
                      value={newCounterparty}
                      onChange={(e) => setNewCounterparty(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Agreement Type
                      </label>
                      <select
                        aria-label="Agreement Type"
                        className="w-full h-9 px-3 rounded-md border bg-background text-sm mt-1"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as ContractRecord["type"])}
                      >
                        <option value="MSA">MSA (Master Agreement)</option>
                        <option value="NDA">NDA (Confidentiality)</option>
                        <option value="SLA">SLA (Service Level)</option>
                        <option value="SOW">SOW (Scope of Work)</option>
                        <option value="Custom">Custom Commercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Contract Value
                      </label>
                      <Input
                        placeholder="e.g. AED 120,000"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateContract}>Create Draft</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Signed Contracts</p>
                <p className="text-2xl font-bold mt-1">
                  {contracts.filter((c) => c.status === "signed").length}
                </p>
              </div>
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending Signatures</p>
                <p className="text-2xl font-bold mt-1">
                  {
                    contracts.filter(
                      (c) => c.status === "pending_signature" || c.status === "in_review",
                    ).length
                  }
                </p>
              </div>
              <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expiring in 60 Days</p>
                <p className="text-2xl font-bold mt-1 text-rose-600">
                  {contracts.filter((c) => c.daysToRenewal <= 60).length}
                </p>
              </div>
              <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pre-Approved Clauses</p>
                <p className="text-2xl font-bold mt-1">{PRE_APPROVED_CLAUSES.length}</p>
              </div>
              <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Search */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList>
              <TabsTrigger value="all_contracts">All Agreements ({contracts.length})</TabsTrigger>
              <TabsTrigger value="pending">Awaiting Signature</TabsTrigger>
              <TabsTrigger value="signed">Active & Signed</TabsTrigger>
              <TabsTrigger value="expiring">Renewals Due</TabsTrigger>
              <TabsTrigger value="clauses">Clause Library</TabsTrigger>
            </TabsList>
            {activeTab !== "clauses" && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search agreements..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            )}
          </div>

          <TabsContent value="all_contracts" className="space-y-3">
            <ContractTable contracts={filteredContracts} onSign={handleSignContract} />
          </TabsContent>
          <TabsContent value="pending" className="space-y-3">
            <ContractTable contracts={filteredContracts} onSign={handleSignContract} />
          </TabsContent>
          <TabsContent value="signed" className="space-y-3">
            <ContractTable contracts={filteredContracts} onSign={handleSignContract} />
          </TabsContent>
          <TabsContent value="expiring" className="space-y-3">
            <ContractTable contracts={filteredContracts} onSign={handleSignContract} />
          </TabsContent>

          <TabsContent value="clauses" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRE_APPROVED_CLAUSES.map((clause) => (
                <Card key={clause.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {clause.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{clause.id}</span>
                    </div>
                    <CardTitle className="text-base mt-2">{clause.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    {clause.text}
                    <div className="mt-4 pt-3 border-t flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(clause.text);
                          toast.success("Clause copied to clipboard.");
                        }}
                      >
                        Copy Clause
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ContractTable({
  contracts,
  onSign,
}: {
  contracts: ContractRecord[];
  onSign: (id: string) => void;
}) {
  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          No contracts found matching current filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
            <tr>
              <th className="px-4 py-3">Contract Ref & Title</th>
              <th className="px-4 py-3">Counterparty</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Renewal Alert</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contracts.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <div className="text-foreground">{c.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">{c.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.counterparty}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {c.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium">{c.value}</td>
                <td className="px-4 py-3">
                  {c.status === "signed" && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                      Signed
                    </Badge>
                  )}
                  {c.status === "pending_signature" && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                      Pending Signature
                    </Badge>
                  )}
                  {c.status === "in_review" && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                      In Legal Review
                    </Badge>
                  )}
                  {c.status === "expiring" && (
                    <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs">
                      Expiring Soon
                    </Badge>
                  )}
                  {c.status === "draft" && (
                    <Badge variant="secondary" className="text-xs">
                      Draft
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-muted-foreground">{c.renewalDate}</div>
                  <div
                    className={`text-xs font-semibold ${
                      c.daysToRenewal <= 60 ? "text-rose-600" : "text-muted-foreground"
                    }`}
                  >
                    {c.daysToRenewal} days remaining
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {c.status !== "signed" ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => onSign(c.id)}
                      >
                        <FileCheck className="w-3.5 h-3.5" /> Sign Document
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs text-emerald-600"
                        onClick={() => toast.info(`Signed by ${c.signedBy} at ${c.signedAt}`)}
                      >
                        <Lock className="w-3.5 h-3.5" /> Stamp Verified
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
