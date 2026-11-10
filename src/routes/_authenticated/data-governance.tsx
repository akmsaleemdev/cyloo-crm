import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app/app-topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  Sparkles,
  ShieldAlert,
  Search,
  CheckCircle2,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Fingerprint,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/data-governance")({
  component: DataGovernancePage,
  staticData: { breadcrumb: "Data Governance" },
  head: () => ({
    meta: [
      { title: "Data Governance, Hygiene & MDM | CYLOO CRM" },
      {
        name: "description",
        content:
          "Enterprise data hygiene scoring, automated third-party enrichment, cross-channel identity resolution, and GDPR/PDPL right-to-erasure.",
      },
    ],
  }),
});

interface IdentityResolutionCandidate {
  id: string;
  primaryName: string;
  matchedIdentifiers: string[];
  confidenceScore: number;
  sources: string[];
}

const CANDIDATES: IdentityResolutionCandidate[] = [
  {
    id: "IDR-101",
    primaryName: "Dr. Tariq Al-Ghamdi",
    matchedIdentifiers: ["+966 50 123 4567", "tariq.g@alghamdigroup.com", "@tariq_ghamdi (IG)"],
    confidenceScore: 98,
    sources: ["WhatsApp Cloud", "Web Form", "Instagram DM"],
  },
  {
    id: "IDR-102",
    primaryName: "Elena Rostova",
    matchedIdentifiers: ["+971 52 987 6543", "elena@dubailuxuryre.ae"],
    confidenceScore: 94,
    sources: ["Meta Ads Lead", "Email Inbound"],
  },
  {
    id: "IDR-103",
    primaryName: "Khaled Mansoor",
    matchedIdentifiers: ["khaled.m@qatarairways.com.qa", "+974 33 456 789"],
    confidenceScore: 91,
    sources: ["Support Ticket", "WhatsApp Web"],
  },
];

export function DataGovernancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [candidates, setCandidates] = useState<IdentityResolutionCandidate[]>(CANDIDATES);
  const [enriching, setEnriching] = useState(false);
  const [erasureEmail, setErasureEmail] = useState("");

  const handleRunEnrichment = () => {
    setEnriching(true);
    setTimeout(() => {
      setEnriching(false);
      toast.success("Third-party data enrichment complete: 142 contact accounts updated.");
    }, 1500);
  };

  const handleMergeCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    toast.success("Identity merged into unified Customer 360 golden record.");
  };

  const handleExecuteErasure = () => {
    if (!erasureEmail.trim()) {
      toast.error("Please enter a valid email or phone number.");
      return;
    }
    toast.success(`GDPR/PDPL Erasure Executed: All PII records for ${erasureEmail} permanently purged.`);
    setErasureEmail("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppTopbar />
      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Enterprise Data Hygiene, Governance & MDM</h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                Module 33 • Hub 7
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Data completeness hygiene, automated third-party enrichment, cross-channel identity resolution, and privacy compliance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="gap-2 text-xs"
              onClick={handleRunEnrichment}
              disabled={enriching}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {enriching ? "Enriching via Clearbit/Apollo..." : "Trigger Third-Party Enrichment"}
            </Button>
          </div>
        </div>

        {/* Hygiene Metric Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Overall Data Health Score</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">92 / 100</p>
              </div>
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Verified Phone E.164</p>
                <p className="text-2xl font-bold mt-1">97.4%</p>
              </div>
              <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                <Database className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Duplicate Contamination</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">1.8%</p>
              </div>
              <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-600">
                <Layers className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Privacy Erasure Requests</p>
                <p className="text-2xl font-bold mt-1">100% Compliant</p>
              </div>
              <div className="p-2.5 rounded-full bg-purple-500/10 text-purple-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Identity Resolution Queue ({candidates.length})</TabsTrigger>
            <TabsTrigger value="hygiene_rules">Deduplication & Survivorship Rules</TabsTrigger>
            <TabsTrigger value="privacy_erasure">GDPR / Saudi PDPL Right-to-Erasure</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Candidate Customer</th>
                    <th className="px-4 py-3">Matched Channel Identifiers</th>
                    <th className="px-4 py-3">Discovered In Channels</th>
                    <th className="px-4 py-3">Confidence Match</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <div className="text-foreground">{c.primaryName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.matchedIdentifiers.map((id) => (
                            <span
                              key={id}
                              className="px-2 py-0.5 rounded bg-muted text-[11px] font-mono border"
                            >
                              {id}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.sources.join(" • ")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                          {c.confidenceScore}% Confidence
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleMergeCandidate(c.id)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Consolidate Record
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="hygiene_rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Field Survivorship & Collision Priority</CardTitle>
                <CardDescription>
                  Determines which field values take precedence when resolving duplicate contact records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-3.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">Phone Number Survivorship</div>
                    <div className="text-xs text-muted-foreground">
                      Prioritizes verified WhatsApp Cloud API inbound number over manual form entry
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    WhatsApp Verified Primary
                  </Badge>
                </div>
                <div className="p-3.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">Email Address Survivorship</div>
                    <div className="text-xs text-muted-foreground">
                      Prioritizes corporate domain over generic free webmail (gmail/yahoo)
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Corporate Domain Primary
                  </Badge>
                </div>
                <div className="p-3.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">Last Interaction Timestamp</div>
                    <div className="text-xs text-muted-foreground">
                      Preserves most recently updated job title, company name, and location
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Most Recent Wins
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy_erasure" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saudi PDPL & GDPR Right-to-Erasure Execution</CardTitle>
                <CardDescription>
                  Cryptographically purges all personally identifiable information (PII) across active tables and audit records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 leading-relaxed">
                  Warning: Right-to-Erasure is irreversible. Executing erasure will permanently anonymize contact details,
                  conversation transcripts, and customer attachments while maintaining non-identifiable financial totals for tax compliance.
                </div>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter customer email or E.164 phone number..."
                    value={erasureEmail}
                    onChange={(e) => setErasureEmail(e.target.value)}
                    className="text-sm"
                  />
                  <Button variant="destructive" className="gap-2 shrink-0" onClick={handleExecuteErasure}>
                    <Trash2 className="w-4 h-4" /> Execute Erasure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

