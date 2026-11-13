import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  MessagesSquare,
  Bot,
  Megaphone,
  Check,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Send,
  CheckCheck,
  Clock,
  ShieldCheck,
  Zap,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import {
  SiWhatsapp,
  SiMessenger,
  SiInstagram,
  SiTelegram,
} from "react-icons/si";

interface TabItem {
  id: "crm" | "inbox" | "bot" | "broadcast";
  label: string;
  badge: string;
  color: string;
  accentBg: string;
  icon: typeof BarChart3;
}

const TABS: TabItem[] = [
  {
    id: "crm",
    label: "CRM & Pipelines",
    badge: "Monday.com Board",
    color: "#2F40CF",
    accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: BarChart3,
  },
  {
    id: "inbox",
    label: "Omnichannel Inbox",
    badge: "5 Channels in 1",
    color: "#25D366",
    accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: MessagesSquare,
  },
  {
    id: "bot",
    label: "AI Bots & Workflows",
    badge: "Auto-Qualified",
    color: "#8B5CF6",
    accentBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: Bot,
  },
  {
    id: "broadcast",
    label: "Broadcast Campaigns",
    badge: "99% Delivery",
    color: "#F97316",
    accentBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    icon: Megaphone,
  },
];

export function HeroInteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<"crm" | "inbox" | "bot" | "broadcast">("crm");
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle tabs every 7 seconds when user is not actively interacting
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const idx = TABS.findIndex((t) => t.id === prev);
        const nextIdx = (idx + 1) % TABS.length;
        return TABS[nextIdx].id;
      });
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="mt-12 w-full max-w-6xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Monday.com-Inspired Pill Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-surface/80 backdrop-blur-md border border-border shadow-sm max-w-2xl mx-auto mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsPaused(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-background text-foreground shadow-md border border-border scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              type="button"
            >
              <span
                className="size-2 rounded-full transition-transform"
                style={{
                  backgroundColor: tab.color,
                  boxShadow: isActive ? `0 0 10px ${tab.color}` : "none",
                }}
              />
              <Icon className="size-4" style={{ color: isActive ? tab.color : undefined }} />
              <span>{tab.label}</span>
              {isActive && (
                <span className={`hidden sm:inline-block text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${tab.accentBg}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Showcase Surface */}
      <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-500">
        {/* Top Window Chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-[#E2445C]/80 inline-block" />
              <span className="size-3 rounded-full bg-[#FDAB3D]/80 inline-block" />
              <span className="size-3 rounded-full bg-[#00C875]/80 inline-block" />
            </div>
            <span className="ml-3 font-medium text-muted-foreground hidden sm:inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              CYLOO Workspace · Real-Time Multi-Channel Hub
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-background border border-border text-[11px]">
              <Search className="size-3 text-muted-foreground" />
              <span>Search leads, messages, deals... (⌘K)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
              Live Production
            </span>
          </div>
        </div>

        {/* Tab 0: CRM & Sales Pipeline (Monday.com Colorful Visual Board) */}
        {activeTab === "crm" && (
          <div className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center gap-1.5">
                  <BarChart3 className="size-3.5" /> High-Value Enterprise Pipeline
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  4 active deals · $193,300 total value
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground flex items-center gap-1"
                >
                  <Filter className="size-3" /> Filter
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-md bg-primary text-white font-medium flex items-center gap-1 shadow-sm hover:bg-primary/90"
                >
                  <Plus className="size-3" /> Add Deal
                </button>
              </div>
            </div>

            {/* Board Table with Monday.com Vibrant Colored Status Blocks */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Deal / Account</th>
                    <th className="py-2.5 px-3">Channel Source</th>
                    <th className="py-2.5 px-3 text-center">Stage & Status</th>
                    <th className="py-2.5 px-3">Value</th>
                    <th className="py-2.5 px-3">AI Copilot Action</th>
                    <th className="py-2.5 px-3">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {/* Row 1: Won (Emerald) */}
                  <tr className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-foreground">Omnichannel Retail Suite</div>
                      <div className="text-[11px] text-muted-foreground">Al-Futtaim Group · Enterprise</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#25D366]/10 text-[#25D366] font-semibold text-[11px]">
                        <SiWhatsapp className="size-3" /> WhatsApp VIP
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block w-32 py-1.5 px-2 rounded-md bg-[#00C875] text-white font-bold text-xs tracking-wide shadow-sm">
                        Closed Won
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-foreground tabular-nums">
                      $84,000
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3 text-emerald-500" /> Contract auto-signed
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                          SK
                        </span>
                        <span className="text-muted-foreground text-[11px]">Sarah K.</span>
                      </div>
                    </td>
                  </tr>

                  {/* Row 2: In Negotiation (Royal Blue) */}
                  <tr className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-foreground">MENA WhatsApp Commerce</div>
                      <div className="text-[11px] text-muted-foreground">TechFlow Global · 12 Outlets</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E1306C]/10 text-[#E1306C] font-semibold text-[11px]">
                        <SiInstagram className="size-3" /> Instagram DM
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block w-32 py-1.5 px-2 rounded-md bg-[#0073EA] text-white font-bold text-xs tracking-wide shadow-sm">
                        In Negotiation
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-foreground tabular-nums">
                      $45,500
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
                        <Zap className="size-3 text-blue-500" /> Proposal draft generated
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          AM
                        </span>
                        <span className="text-muted-foreground text-[11px]">Alex M.</span>
                      </div>
                    </td>
                  </tr>

                  {/* Row 3: Proposal Review (Vibrant Amber) */}
                  <tr className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-foreground">Support Automation Tier 3</div>
                      <div className="text-[11px] text-muted-foreground">Vertex Media Hub · 48 Agents</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0084FF]/10 text-[#0084FF] font-semibold text-[11px]">
                        <SiMessenger className="size-3" /> Messenger
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block w-32 py-1.5 px-2 rounded-md bg-[#FDAB3D] text-slate-900 font-bold text-xs tracking-wide shadow-sm">
                        Proposal Sent
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-foreground tabular-nums">
                      $27,800
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                        <Clock className="size-3 text-amber-500" /> Viewed 3 times today
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="size-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                          FR
                        </span>
                        <span className="text-muted-foreground text-[11px]">Fatima R.</span>
                      </div>
                    </td>
                  </tr>

                  {/* Row 4: Hot Qualified Lead (Vivid Coral) */}
                  <tr className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-foreground">Real Estate Gateway Solution</div>
                      <div className="text-[11px] text-muted-foreground">Prime Properties Dubai</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#25D366]/10 text-[#25D366] font-semibold text-[11px]">
                        <SiWhatsapp className="size-3" /> WhatsApp Web
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block w-32 py-1.5 px-2 rounded-md bg-[#E2445C] text-white font-bold text-xs tracking-wide shadow-sm">
                        Hot Lead (AI)
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-foreground tabular-nums">
                      $36,000
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400">
                        <Sparkles className="size-3 text-rose-500" /> AI Meeting Booked (2:00 PM)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="size-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                          OD
                        </span>
                        <span className="text-muted-foreground text-[11px]">Omar D.</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 1: Omnichannel Inbox */}
        {activeTab === "inbox" && (
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in duration-300">
            {/* Queues List */}
            <div className="md:col-span-4 border border-border/60 rounded-xl bg-surface p-3 space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase px-2 mb-2 flex items-center justify-between">
                <span>Active Channels</span>
                <span className="text-[10px] text-emerald-600 font-mono">18 new</span>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <SiWhatsapp className="text-[#25D366] size-3.5" /> Tariq Al-Mansoor
                  </span>
                  <span className="text-[10px] text-muted-foreground">1m ago</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  "Can we connect our 14 retail branches to this same WhatsApp..."
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">
                    Enterprise Lead
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">$48,000 deal</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg hover:bg-muted/50 border border-transparent text-xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <SiInstagram className="text-[#E1306C] size-3.5" /> Elena Rostova
                  </span>
                  <span className="text-[10px] text-muted-foreground">6m ago</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  "Sent the order payment receipt. When will dispatch start?"
                </p>
              </div>

              <div className="p-2.5 rounded-lg hover:bg-muted/50 border border-transparent text-xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <SiMessenger className="text-[#0084FF] size-3.5" /> Marcus Vance
                  </span>
                  <span className="text-[10px] text-muted-foreground">14m ago</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  "Looking to upgrade to the Unlimited Self-Hosted tier."
                </p>
              </div>
            </div>

            {/* Conversation Window */}
            <div className="md:col-span-8 border border-border/60 rounded-xl bg-surface p-4 flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      TM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        Tariq Al-Mansoor
                        <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <SiWhatsapp className="text-[#25D366] size-3" /> +971 50 824 1928 · Dubai, UAE
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded bg-[#00C875] text-white font-bold">
                    Active VIP Session
                  </span>
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  <div className="max-w-md p-3 rounded-2xl rounded-tl-sm bg-muted/60 text-xs text-foreground">
                    "Hi team, we have 14 retail branches across UAE and want to connect our WhatsApp Cloud API to one central CRM. Does CYLOO charge per agent?"
                  </div>

                  <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 text-xs space-y-2">
                    <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="size-3 text-purple-500" /> CYLOO AI Copilot (Contextual Answer Generated)
                      </span>
                      <span className="text-[10px] text-muted-foreground">0.4s response</span>
                    </div>
                    <p className="text-foreground text-[12px] leading-relaxed">
                      "Hello Tariq! No, CYLOO never charges per-seat or per-agent taxes. You can connect all 14 branch numbers, deploy round-robin team routing, and have unlimited human agents collaborate on a single self-hosted license."
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded bg-primary text-white text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Send className="size-3" /> Insert &amp; Send
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded border border-border text-muted-foreground text-[11px] font-medium hover:text-foreground"
                      >
                        Attach Custom Pricing PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCheck className="size-3.5 text-primary" /> End-to-end encrypted · Meta Cloud API Verified
                </span>
                <span className="font-mono text-[11px]">SLA: 100% On Time</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Bots & Workflows */}
        {activeTab === "bot" && (
          <div className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center mb-2">
                  <Zap className="size-4" />
                </div>
                <div className="text-xs font-bold text-foreground">1. Inbound Trigger</div>
                <div className="text-[11px] text-muted-foreground mt-1">Customer texts on WhatsApp, IG or Telegram</div>
              </div>

              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                <div className="size-7 rounded-lg bg-blue-500/20 text-blue-600 flex items-center justify-center mb-2">
                  <Bot className="size-4" />
                </div>
                <div className="text-xs font-bold text-foreground">2. AI Semantic Intent</div>
                <div className="text-[11px] text-muted-foreground mt-1">Vector search over catalog, inventory &amp; CRM</div>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                <div className="size-7 rounded-lg bg-purple-500/20 text-purple-600 flex items-center justify-center mb-2">
                  <Sparkles className="size-4" />
                </div>
                <div className="text-xs font-bold text-foreground">3. Lead Qualification</div>
                <div className="text-[11px] text-muted-foreground mt-1">Estimates deal value &amp; creates pipeline record</div>
              </div>

              <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
                <div className="size-7 rounded-lg bg-orange-500/20 text-orange-600 flex items-center justify-center mb-2">
                  <UserCheck className="size-4" />
                </div>
                <div className="text-xs font-bold text-foreground">4. Smart Escalation</div>
                <div className="text-[11px] text-muted-foreground mt-1">Hands off seamlessly to on-duty sales rep</div>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-surface border border-border">
                <div className="text-lg font-black font-mono text-foreground tabular-nums">91.4%</div>
                <div className="text-[11px] text-muted-foreground">Autonomous Resolution</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border">
                <div className="text-lg font-black font-mono text-foreground tabular-nums">0.6s</div>
                <div className="text-[11px] text-muted-foreground">Avg Response Latency</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border">
                <div className="text-lg font-black font-mono text-foreground tabular-nums">14,280+</div>
                <div className="text-[11px] text-muted-foreground">AI Inquiries / Week</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border">
                <div className="text-lg font-black font-mono text-foreground tabular-nums">$0 / rep</div>
                <div className="text-[11px] text-muted-foreground">Zero Per-Agent Tax</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Broadcast Campaigns */}
        {activeTab === "broadcast" && (
          <div className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Q4 Exclusive VIP Product Launch</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                    99.4% Completed
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Targeted segment: 18,400 Verified Enterprise Buyers · WhatsApp Cloud API
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-muted-foreground">Attributed Pipeline</div>
                <div className="text-base font-black font-mono text-foreground tabular-nums">$142,800</div>
              </div>
            </div>

            {/* Campaign Progress Gauge */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Delivery Performance</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">18,290 / 18,400 Messages</span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full w-[99.4%]" />
              </div>
            </div>

            {/* Key KPI Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-surface border border-border">
                <div className="text-xs text-muted-foreground">Sent &amp; Verified</div>
                <div className="text-xl font-bold font-mono text-foreground tabular-nums mt-1">18,290</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">99.4% delivery rate</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border">
                <div className="text-xs text-muted-foreground">Read Rate</div>
                <div className="text-xl font-bold font-mono text-foreground tabular-nums mt-1">87.2%</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">15,950 opens</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border">
                <div className="text-xs text-muted-foreground">Direct Reply Rate</div>
                <div className="text-xl font-bold font-mono text-foreground tabular-nums mt-1">34.6%</div>
                <div className="text-[10px] text-purple-600 font-semibold mt-0.5">6,330 hot conversations</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border">
                <div className="text-xs text-muted-foreground">Unsubscribe / Block</div>
                <div className="text-xl font-bold font-mono text-foreground tabular-nums mt-1">&lt;0.05%</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">High sender reputation</div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Status Bar */}
        <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex flex-wrap items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="size-3.5" /> 100% Self-Hosted &amp; Private
            </span>
            <span className="hidden sm:inline">No Meta Message Markup Fees</span>
          </div>
          <Link
            to="/auth"
            search={{ mode: "sign-up" }}
            className="font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Explore live sandbox <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Floating Trust Pills around the Showcase */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-accent" /> 14-day free trial
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-accent" /> No credit card required
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-accent" /> 100% Data sovereignty (Self-hosted)
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-accent" /> 2-minute instant setup
        </span>
      </div>
    </div>
  );
}

