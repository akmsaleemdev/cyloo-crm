import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app/app-topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Server,
  Radio,
  RefreshCw,
  Cpu,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/system-health")({
  component: SystemHealthPage,
  staticData: { breadcrumb: "System Health & SRE" },
  head: () => ({
    meta: [
      { title: "SRE Observability, Health & Telemetry | CYLOO CRM" },
      {
        name: "description",
        content:
          "Enterprise SRE observability, OpenTelemetry distributed tracing, dead-letter queue (DLQ) inspection, and pg_cron monitoring.",
      },
    ],
  }),
});

interface DeadLetterItem {
  id: string;
  endpoint: string;
  failedEvent: string;
  errorMessage: string;
  retryAttempts: number;
  timestamp: string;
  payload: string;
}

const INITIAL_DLQ: DeadLetterItem[] = [
  {
    id: "DLQ-5821",
    endpoint: "https://api.meta.com/v20.0/messages",
    failedEvent: "whatsapp.message_dispatch",
    errorMessage: "HTTP 429: Rate limit exceeded by carrier network",
    retryAttempts: 3,
    timestamp: "2026-11-08 05:41:10 UTC",
    payload: JSON.stringify(
      { to: "+971501234567", template: "order_confirmation_v2", language: "ar" },
      null,
      2,
    ),
  },
  {
    id: "DLQ-5822",
    endpoint: "https://business-api.tiktok.com/open_api/v1.3/message/send",
    failedEvent: "tiktok.lead_sync",
    errorMessage: "HTTP 504: Gateway timeout on TikTok webhook intake",
    retryAttempts: 2,
    timestamp: "2026-11-08 06:05:44 UTC",
    payload: JSON.stringify({ lead_id: "TT-LEAD-89211", campaign_id: "CMP-DUBAI-AI-01" }, null, 2),
  },
];

const CRON_JOBS = [
  {
    name: "Nightly Ephemeral Session Garbage Collection",
    schedule: "0 2 * * * (Daily 02:00 UTC)",
    lastRunDuration: "1.4s",
    status: "healthy",
    nextRun: "In 19h 45m",
  },
  {
    name: "Hourly Usage Quota & AI Token Aggregator",
    schedule: "0 * * * * (Every Hour)",
    lastRunDuration: "0.8s",
    status: "healthy",
    nextRun: "In 38m",
  },
  {
    name: "Automated Campaign Scheduled Trigger Queue",
    schedule: "*/5 * * * * (Every 5 mins)",
    lastRunDuration: "0.2s",
    status: "healthy",
    nextRun: "In 2m",
  },
  {
    name: "Audit Log Integrity & Hash Verification",
    schedule: "0 0 * * 0 (Weekly Sunday)",
    lastRunDuration: "4.1s",
    status: "healthy",
    nextRun: "In 6 days",
  },
];

export function SystemHealthPage() {
  const [activeTab, setActiveTab] = useState("telemetry");
  const [dlqItems, setDlqItems] = useState<DeadLetterItem[]>(INITIAL_DLQ);
  const [selectedDlq, setSelectedDlq] = useState<DeadLetterItem | null>(null);

  const handleReplayDlq = (id: string) => {
    setDlqItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedDlq(null);
    toast.success("Message replayed from DLQ into active queue consumer.");
  };

  const handleReplayAll = () => {
    setDlqItems([]);
    setSelectedDlq(null);
    toast.success("All dead-letter queue items dispatched for reprocessing.");
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
                SRE Observability, System Health & Telemetry
              </h1>
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary border-primary/20"
              >
                Module 34 • Hub 7
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Distributed latency tracing, real-time webhook health probes, dead-letter queue (DLQ)
              replay, and pg_cron telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 text-xs"
              onClick={() => toast.success("Live telemetry data refreshed from edge workers.")}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
            </Button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Platform SLA Availability
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-2xl font-bold text-emerald-600">99.98%</span>
                </div>
              </div>
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Edge Worker Latency (p95)
                </p>
                <p className="text-2xl font-bold mt-1 text-primary">34 ms</p>
              </div>
              <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                <Zap className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">PostgreSQL Query p95</p>
                <p className="text-2xl font-bold mt-1">12 ms</p>
              </div>
              <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-600">
                <Server className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Dead-Letter Queue (DLQ)</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{dlqItems.length} Stalled</p>
              </div>
              <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="telemetry">OpenTelemetry Traces</TabsTrigger>
            <TabsTrigger value="probes">Webhook Health Probes</TabsTrigger>
            <TabsTrigger value="dlq">Dead-Letter Queue ({dlqItems.length})</TabsTrigger>
            <TabsTrigger value="cron">pg_cron Schedulers</TabsTrigger>
          </TabsList>

          <TabsContent value="telemetry" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Edge SSR Execution</CardTitle>
                  <CardDescription>Cloudflare Workers Node Runtime</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">p50 Latency:</span>
                    <span className="font-mono font-semibold">18 ms</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">p95 Latency:</span>
                    <span className="font-mono font-semibold text-primary">34 ms</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">p99 Latency:</span>
                    <span className="font-mono font-semibold text-amber-600">62 ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Database Connection Pool</CardTitle>
                  <CardDescription>Supavisor Transaction Pooler (Port 6543)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Active Connections:</span>
                    <span className="font-mono font-semibold">42 / 200</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Average Wait Time:</span>
                    <span className="font-mono font-semibold text-emerald-600">0.4 ms</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">RLS Policy Overhead:</span>
                    <span className="font-mono font-semibold text-primary">&lt; 1.2 ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">AI Model Streaming API</CardTitle>
                  <CardDescription>Vercel AI SDK Token Velocity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Time to First Token:</span>
                    <span className="font-mono font-semibold">240 ms</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Generation Speed:</span>
                    <span className="font-mono font-semibold">82 tokens/sec</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">pgvector Cosine Lookup:</span>
                    <span className="font-mono font-semibold text-emerald-600">6.4 ms</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="probes" className="space-y-4">
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Integration Service</th>
                    <th className="px-4 py-3">Probe Target</th>
                    <th className="px-4 py-3">Success Rate (24h)</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Cloud API
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      graph.facebook.com
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">99.94%</td>
                    <td className="px-4 py-3 font-mono">112 ms</td>
                    <td className="px-4 py-3 text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px]">
                        Operational
                      </Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-emerald-500" /> TikTok Business Messaging
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      business-api.tiktok.com
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">99.82%</td>
                    <td className="px-4 py-3 font-mono">145 ms</td>
                    <td className="px-4 py-3 text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px]">
                        Operational
                      </Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-emerald-500" /> Supabase Realtime Socket
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      wss://project.supabase.co
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">100.0%</td>
                    <td className="px-4 py-3 font-mono">18 ms</td>
                    <td className="px-4 py-3 text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px]">
                        Operational
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="dlq" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold">Dead-Letter Queue Visual Triage</h3>
                <p className="text-xs text-muted-foreground">
                  Failed asynchronous background messages held for manual inspection and replay
                </p>
              </div>
              {dlqItems.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={handleReplayAll}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Replay All Stalled
                </Button>
              )}
            </div>

            {dlqItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  ✓ Dead-Letter Queue is empty. All background workers and webhook dispatches
                  operating normally.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {dlqItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-all ${
                        selectedDlq?.id === item.id
                          ? "ring-2 ring-primary"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedDlq(item)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.id}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {item.timestamp}
                          </span>
                        </div>
                        <CardTitle className="text-sm mt-1 text-foreground">
                          {item.failedEvent}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-2">
                        <div className="text-rose-600 font-mono bg-rose-500/10 p-2 rounded border border-rose-500/20">
                          {item.errorMessage}
                        </div>
                        <div className="flex justify-between text-muted-foreground pt-1">
                          <span>Target: {item.endpoint.slice(0, 32)}...</span>
                          <span>Retries: {item.retryAttempts}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  {selectedDlq ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">
                            Payload Inspection: {selectedDlq.id}
                          </CardTitle>
                          <Button
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => handleReplayDlq(selectedDlq.id)}
                          >
                            <RotateCcw className="w-3 h-3" /> Replay Payload
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="p-3 bg-muted rounded font-mono text-xs overflow-x-auto border text-foreground">
                          {selectedDlq.payload}
                        </pre>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center text-xs text-muted-foreground">
                        Select a dead-letter item to inspect its JSON payload and execute manual
                        replay.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cron" className="space-y-4">
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">pg_cron Job Identifier</th>
                    <th className="px-4 py-3">Cron Schedule</th>
                    <th className="px-4 py-3">Last Run Duration</th>
                    <th className="px-4 py-3">Next Scheduled Execution</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {CRON_JOBS.map((job) => (
                    <tr key={job.name} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" /> {job.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{job.schedule}</td>
                      <td className="px-4 py-3 font-mono font-medium">{job.lastRunDuration}</td>
                      <td className="px-4 py-3 text-muted-foreground">{job.nextRun}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px]">
                          Healthy
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
