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
  Handshake,
  Plus,
  Search,
  Building,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Award,
  TrendingUp,
  Percent,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/partners")({
  component: PartnersPage,
  staticData: { breadcrumb: "Channel & Partners" },
  head: () => ({
    meta: [
      { title: "Partner Relationship Management (PRM) | CYLOO CRM" },
      {
        name: "description",
        content:
          "Enterprise channel sales, partner tiering, deal registration with conflict locking, and market development funds (MDF).",
      },
    ],
  }),
});

interface PartnerAccount {
  id: string;
  name: string;
  tier: "Platinum" | "Gold" | "Silver" | "Registered";
  country: string;
  marginPercent: number;
  activeDeals: number;
  pipelineValue: string;
  status: "active" | "pending_review" | "suspended";
}

interface DealRegistration {
  id: string;
  opportunityName: string;
  partnerName: string;
  estimatedValue: string;
  status: "approved_locked" | "under_review" | "rejected";
  expiresAt: string;
  lockProtectionDays: number;
}

const INITIAL_PARTNERS: PartnerAccount[] = [
  {
    id: "PTR-001",
    name: "Gulf Cloud Solutions FZ-LLC",
    tier: "Platinum",
    country: "United Arab Emirates",
    marginPercent: 28,
    activeDeals: 14,
    pipelineValue: "AED 1,240,000",
    status: "active",
  },
  {
    id: "PTR-002",
    name: "Al-Riyadh Digital Systems",
    tier: "Gold",
    country: "Kingdom of Saudi Arabia",
    marginPercent: 22,
    activeDeals: 9,
    pipelineValue: "SAR 980,000",
    status: "active",
  },
  {
    id: "PTR-003",
    name: "Doha IT Consulting WLL",
    tier: "Silver",
    country: "Qatar",
    marginPercent: 18,
    activeDeals: 4,
    pipelineValue: "QAR 340,000",
    status: "active",
  },
  {
    id: "PTR-004",
    name: "Kuwait Enterprise Cloud Co",
    tier: "Registered",
    country: "Kuwait",
    marginPercent: 15,
    activeDeals: 2,
    pipelineValue: "KWD 45,000",
    status: "pending_review",
  },
];

const INITIAL_DEAL_REGS: DealRegistration[] = [
  {
    id: "DREG-841",
    opportunityName: "Dubai Municipality Cloud Modernization",
    partnerName: "Gulf Cloud Solutions FZ-LLC",
    estimatedValue: "AED 450,000",
    status: "approved_locked",
    expiresAt: "2027-02-15",
    lockProtectionDays: 98,
  },
  {
    id: "DREG-842",
    opportunityName: "Ministry of Commerce CRM Rollout",
    partnerName: "Al-Riyadh Digital Systems",
    estimatedValue: "SAR 680,000",
    status: "approved_locked",
    expiresAt: "2027-03-01",
    lockProtectionDays: 112,
  },
  {
    id: "DREG-843",
    opportunityName: "Al-Ahli Bank Omnichannel AI Support",
    partnerName: "Doha IT Consulting WLL",
    estimatedValue: "USD 120,000",
    status: "under_review",
    expiresAt: "2026-12-30",
    lockProtectionDays: 52,
  },
];

export function PartnersPage() {
  const [partners, setPartners] = useState<PartnerAccount[]>(INITIAL_PARTNERS);
  const [dealRegs, setDealRegs] = useState<DealRegistration[]>(INITIAL_DEAL_REGS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("partners");
  const [newPartnerOpen, setNewPartnerOpen] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerCountry, setPartnerCountry] = useState("United Arab Emirates");
  const [partnerTier, setPartnerTier] = useState<PartnerAccount["tier"]>("Silver");

  const handleCreatePartner = () => {
    if (!partnerName.trim()) {
      toast.error("Please enter partner name.");
      return;
    }
    const newPartner: PartnerAccount = {
      id: `PTR-00${partners.length + 1}`,
      name: partnerName,
      tier: partnerTier,
      country: partnerCountry,
      marginPercent: partnerTier === "Platinum" ? 28 : partnerTier === "Gold" ? 22 : 18,
      activeDeals: 0,
      pipelineValue: "0",
      status: "active",
    };
    setPartners([...partners, newPartner]);
    setNewPartnerOpen(false);
    setPartnerName("");
    toast.success("New channel partner registered.");
  };

  const handleApproveDeal = (id: string) => {
    setDealRegs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "approved_locked" } : d)));
    toast.success("Deal registration approved with exclusive conflict-lock protection.");
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
                Partner Relationship Management (PRM)
              </h1>
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/20"
              >
                Module 7 • Hub 1
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Channel distribution, broker enablement, deal registration conflict locks, and co-op
              MDF tracking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={newPartnerOpen} onOpenChange={setNewPartnerOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Onboard Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Onboard Channel Partner</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Company / Reseller Name
                    </label>
                    <Input
                      placeholder="e.g. Apex Middle East Distribution"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Country
                      </label>
                      <select
                        aria-label="Country"
                        className="w-full h-9 px-3 rounded-md border bg-background text-sm mt-1"
                        value={partnerCountry}
                        onChange={(e) => setPartnerCountry(e.target.value)}
                      >
                        <option value="United Arab Emirates">UAE</option>
                        <option value="Kingdom of Saudi Arabia">Saudi Arabia</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Oman">Oman</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Initial Tier
                      </label>
                      <select
                        aria-label="Initial Tier"
                        className="w-full h-9 px-3 rounded-md border bg-background text-sm mt-1"
                        value={partnerTier}
                        onChange={(e) => setPartnerTier(e.target.value as PartnerAccount["tier"])}
                      >
                        <option value="Registered">Registered (15%)</option>
                        <option value="Silver">Silver (18%)</option>
                        <option value="Gold">Gold (22%)</option>
                        <option value="Platinum">Platinum (28%)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewPartnerOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePartner}>Complete Onboarding</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Channel Partners</p>
                <p className="text-2xl font-bold mt-1">{partners.length}</p>
              </div>
              <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                <Handshake className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Registered Deal Pipeline
                </p>
                <p className="text-2xl font-bold mt-1">AED 2.56M</p>
              </div>
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Locked Opportunities</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {dealRegs.filter((d) => d.status === "approved_locked").length}
                </p>
              </div>
              <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-600">
                <Lock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">MDF Budget Utilized</p>
                <p className="text-2xl font-bold mt-1">64%</p>
              </div>
              <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-600">
                <Percent className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList>
              <TabsTrigger value="partners">Partner Directory ({partners.length})</TabsTrigger>
              <TabsTrigger value="deal_regs">
                Deal Registration Locks ({dealRegs.length})
              </TabsTrigger>
              <TabsTrigger value="mdf">Co-Op Marketing (MDF)</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search partners or deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          <TabsContent value="partners" className="space-y-3">
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Partner Organization</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Territory</th>
                    <th className="px-4 py-3">Commission Margin</th>
                    <th className="px-4 py-3">Active Deals</th>
                    <th className="px-4 py-3">Pipeline Volume</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {partners.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <div className="text-foreground">{p.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            p.tier === "Platinum"
                              ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                              : p.tier === "Gold"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {p.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.country}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{p.marginPercent}%</td>
                      <td className="px-4 py-3">{p.activeDeals} deals</td>
                      <td className="px-4 py-3 font-medium">{p.pipelineValue}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="deal_regs" className="space-y-3">
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Registration ID & Opportunity</th>
                    <th className="px-4 py-3">Registering Partner</th>
                    <th className="px-4 py-3">Est. Value</th>
                    <th className="px-4 py-3">Conflict Lock Status</th>
                    <th className="px-4 py-3">Protection Period</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dealRegs.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="text-foreground">{d.opportunityName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{d.id}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.partnerName}</td>
                      <td className="px-4 py-3 font-medium">{d.estimatedValue}</td>
                      <td className="px-4 py-3">
                        {d.status === "approved_locked" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 text-xs">
                            <Lock className="w-3 h-3" /> Exclusively Locked
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                            Under Review
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">Expires: {d.expiresAt}</div>
                        <div className="text-xs font-semibold text-primary">
                          {d.lockProtectionDays} days active lock
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.status === "under_review" && (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleApproveDeal(d.id)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Lock
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="mdf" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">MDF Program Overview</CardTitle>
                  <CardDescription>Annual Market Development Fund</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Budget Allocated:</span>
                    <span className="font-semibold">USD 150,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Committed & Approved:</span>
                    <span className="font-semibold text-emerald-600">USD 96,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Pool:</span>
                    <span className="font-semibold text-primary">USD 54,000</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Recent Co-Op Campaign Claims</CardTitle>
                  <CardDescription>
                    Verified expense receipts and proof of execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">GITEX Dubai 2026 Co-Branded Booth</div>
                        <div className="text-xs text-muted-foreground">
                          Gulf Cloud Solutions • AED 45,000
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                        Reimbursed
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg border flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          Riyadh B2B Executive Dinner & AI Workshop
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Al-Riyadh Digital Systems • SAR 28,000
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                        Approved
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
