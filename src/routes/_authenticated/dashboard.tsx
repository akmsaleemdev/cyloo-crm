import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DISTANCE, DURATION, TRANSITION, useReducedMotionSafe, variants } from "@/shared/motion";
import { AppTopbar } from "@/components/app/app-topbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Target,
  Building2,
  Heart,
  DollarSign,
  Activity,
  Clock,
  Handshake,
  MessagesSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
  Flame,
  SlidersHorizontal,
} from "lucide-react";
import { contactDisplayName, contactInitials } from "@/hooks/use-contacts";
import { companyInitials } from "@/hooks/use-companies";
import { useDashboardData } from "@/hooks/use-dashboard";
import { useDashboardTasks } from "@/hooks/use-dashboard-tasks";
import { useDashboardPipeline, type DashboardPipelineData } from "@/hooks/use-dashboard-pipeline";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { useZonedDateFormatter } from "@/hooks/use-timezone";
import { useTenantCurrency } from "@/hooks/use-currency";
import { formatMoney } from "@/lib/currency/format";
import {
  loadDashboardPreferences,
  saveDashboardPreferences,
  resetDashboardPreferences,
  type DashboardWidgetConfig,
} from "@/components/dashboard/dashboard-preferences";
import { DashboardCustomizeModal } from "@/components/dashboard/dashboard-customize-modal";
import { MotionCard } from "@/components/ui/motion";
let hasEnteredDashboard = false;

const leadDisplayName = (l: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
}) =>
  [l.first_name, l.last_name].filter(Boolean).join(" ").trim() ||
  l.email ||
  l.company_name ||
  "Unnamed lead";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "CRM Dashboard — Live Overview" },
      {
        name: "description",
        content: "Real-time overview of leads, customers, deals, tasks and conversations.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const reduceMotion = useReducedMotionSafe();
  const [animateEntrance] = useState(() => !hasEnteredDashboard);
  useEffect(() => {
    hasEnteredDashboard = true;
  }, []);
  const { active } = useCurrentWorkspace();
  const d = useDashboardData();
  const tasks = useDashboardTasks();
  const pipeline = useDashboardPipeline(active?.id);
  const fmtZoned = useZonedDateFormatter();

  const newLeadsCount = d.newLeadsCount.data ?? 0;
  const cust = d.activeCustomers.data;
  const upcoming = tasks.data?.items ?? [];
  const overdue = tasks.data?.overdueCount ?? 0;
  const taskCardTo =
    tasks.data?.crmUpcomingCount && !tasks.data.projectUpcomingCount
      ? "/tasks"
      : tasks.data?.projectUpcomingCount && !tasks.data.crmUpcomingCount
        ? "/projects/tasks"
        : undefined;
  const tenantCurrency = useTenantCurrency();
  const pipelineTotals = pipeline.data?.totals ?? [];
  const pipelineMoney = (value: number, currency: string) =>
    formatMoney(Math.round(value), currency, { maximumFractionDigits: 0 });
  const pipelineValue = pipelineTotals.length
    ? pipelineTotals.map((total) => pipelineMoney(total.amount, total.currency)).join(" · ")
    : pipelineMoney(0, tenantCurrency);
  const weighted = pipelineTotals
    .map((total) => pipelineMoney(total.weighted, total.currency))
    .join(" · ");

  // Dashboard customization state & persistence
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() =>
    loadDashboardPreferences(active?.id ?? "default"),
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const pipelineVisible = widgets.some((w) => w.id === "widget-pipeline-funnel" && w.visible);
  const tasksVisible = widgets.some((w) => w.id === "widget-upcoming-tasks" && w.visible);

  function scrollToWidget(id: string) {
    const widget = document.getElementById(id);
    widget?.focus({ preventScroll: true });
    widget?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
  }

  useEffect(() => {
    setWidgets(loadDashboardPreferences(active?.id ?? "default"));
  }, [active?.id]);

  const handleSaveWidgets = (updated: DashboardWidgetConfig[]) => {
    setWidgets(updated);
    saveDashboardPreferences(active?.id ?? "default", updated);
  };

  const handleResetWidgets = () => {
    const defaults = resetDashboardPreferences(active?.id ?? "default");
    setWidgets(defaults);
  };

  return (
    <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
      <AppTopbar
        title="Dashboard"
        subtitle="Your CRM at a glance — live"
        dashboard
        actions={
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="min-h-11 gap-2 sm:min-h-9">
              <SlidersHorizontal className="size-4 text-primary" />
              Customize Layout
            </Button>
          </DialogTrigger>
        }
      />
      <main
        className="dashboard-page @container mx-auto w-full min-w-0 max-w-[100rem] px-3 py-4 sm:px-6 sm:py-6 xl:px-8"
        style={{ backgroundColor: "var(--dashboard-background, transparent)" }}
      >
        <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-6 @4xl:gap-5">
          {widgets
            .filter((w) => w.visible)
            .map((widget, index) => {
              const panelProps = { size: widget.size, index, reduceMotion, animateEntrance };

              switch (widget.id) {
                case "widget-quick-actions":
                  return (
                    <DashboardPanel key={widget.id} {...panelProps}>
                      <section
                        aria-labelledby="dashboard-actions"
                        className="rounded-surface border border-border bg-surface p-3 shadow-sm sm:p-4"
                      >
                        <h2 id="dashboard-actions" className="mb-3 text-sm font-semibold">
                          Quick actions
                        </h2>
                        <div className="grid grid-cols-2 gap-2 @sm/panel:grid-cols-3 @xl/panel:grid-cols-4 @4xl/panel:grid-cols-7">
                          <QuickAction icon={Target} label="New Lead" to="/leads" />
                          <QuickAction icon={Users} label="New Contact" to="/contacts" />
                          <QuickAction icon={Building2} label="New Company" to="/companies" />
                          <QuickAction icon={Handshake} label="New Deal" to="/deals" />
                          <QuickAction icon={Calendar} label="New Task" to="/tasks" />
                          <QuickAction icon={MessagesSquare} label="Open Inbox" to="/inbox" />
                          <QuickAction icon={Sparkles} label="AI Studio" to="/ai-studio" />
                        </div>
                      </section>
                    </DashboardPanel>
                  );

                case "widget-kpi-summary":
                  return (
                    <DashboardPanel key={widget.id} {...panelProps}>
                      <div
                        aria-label="Key performance indicators"
                        className="grid grid-cols-1 gap-2.5 @min-[20rem]/panel:grid-cols-2 @3xl/panel:grid-cols-4 @3xl/panel:gap-4"
                      >
                        <StatCard
                          icon={Target}
                          tone="accent"
                          label="New Leads · 7d"
                          value={String(newLeadsCount)}
                          hint={
                            d.assignedLeadsCount.isError
                              ? "Assigned leads unavailable"
                              : d.assignedLeadsCount.isSuccess
                                ? `${d.assignedLeadsCount.data} assigned to you`
                                : undefined
                          }
                          loading={d.newLeadsCount.isPending}
                          error={d.newLeadsCount.isError}
                          to="/leads"
                          hash="new-7d"
                        />
                        <StatCard
                          icon={Heart}
                          tone="rose"
                          label="Active Customers"
                          value={String(cust?.active ?? 0)}
                          hint={`${cust?.total ?? 0} total · ${cust?.atRisk ?? 0} at risk`}
                          loading={d.activeCustomers.isPending}
                          error={d.activeCustomers.isError}
                          to="/customers"
                          hash="active"
                        />
                        <StatCard
                          icon={DollarSign}
                          tone="green"
                          label="Open Pipeline"
                          value={
                            pipeline.data?.state === "no_pipeline" ||
                            pipeline.data?.state === "no_stages"
                              ? "—"
                              : pipelineValue
                          }
                          hint={
                            pipeline.data?.state === "no_pipeline"
                              ? "No pipeline configured"
                              : pipeline.data?.state === "no_stages"
                                ? "No stages configured"
                                : pipeline.data?.state === "no_open_deals"
                                  ? "No open deals"
                                  : weighted
                                    ? `Weighted ${weighted}`
                                    : undefined
                          }
                          loading={pipeline.isPending}
                          error={pipeline.isError}
                          compact={pipelineTotals.length > 1}
                          to={pipelineVisible ? undefined : "/deals"}
                          onClick={
                            pipelineVisible
                              ? () => scrollToWidget("dashboard-pipeline-summary")
                              : undefined
                          }
                        />
                        <StatCard
                          icon={Calendar}
                          tone="amber"
                          label="Upcoming Tasks"
                          value={String(tasks.data?.upcomingCount ?? 0)}
                          hint={
                            tasks.data
                              ? `CRM ${tasks.data.crmUpcomingCount} · Project ${tasks.data.projectUpcomingCount}${overdue ? ` · ${overdue} overdue` : ""}`
                              : undefined
                          }
                          loading={tasks.isPending}
                          error={tasks.isError}
                          to={taskCardTo ?? (!tasksVisible ? "/tasks" : undefined)}
                          onClick={
                            tasksVisible &&
                            tasks.data?.crmUpcomingCount &&
                            tasks.data.projectUpcomingCount
                              ? () => scrollToWidget("dashboard-upcoming-tasks")
                              : undefined
                          }
                        />
                      </div>
                    </DashboardPanel>
                  );

                case "widget-pipeline-funnel":
                  return (
                    <DashboardPanel key={widget.id} {...panelProps}>
                      <div className="grid min-w-0 grid-cols-1 gap-4 @2xl/panel:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @4xl/panel:gap-5">
                        <div
                          id="dashboard-pipeline-summary"
                          tabIndex={-1}
                          className="min-w-0 scroll-mt-[calc(var(--topbar-height)+1rem)]"
                        >
                          <PipelineSummary
                            data={pipeline.data}
                            loading={pipeline.isPending}
                            error={pipeline.isError}
                            onRetry={() => void pipeline.refetch()}
                            tenantCurrency={tenantCurrency}
                          />
                        </div>
                        <AIInsights
                          newLeads={newLeadsCount}
                          atRisk={cust?.atRisk ?? 0}
                          overdue={overdue}
                          pipelineTotals={pipelineTotals}
                          loading={
                            d.newLeadsCount.isPending ||
                            d.activeCustomers.isPending ||
                            tasks.isPending ||
                            pipeline.isPending
                          }
                          error={
                            d.newLeadsCount.isError ||
                            d.activeCustomers.isError ||
                            tasks.isError ||
                            pipeline.isError
                          }
                          onRetry={() => {
                            void d.newLeadsCount.refetch();
                            void d.activeCustomers.refetch();
                            void tasks.refetch();
                            void pipeline.refetch();
                          }}
                        />
                      </div>
                    </DashboardPanel>
                  );

                case "widget-recent-leads":
                  return (
                    <DashboardPanel key={widget.id} {...panelProps}>
                      <div className="grid min-w-0 grid-cols-1 gap-4 @2xl/panel:grid-cols-2 @4xl/panel:gap-5">
                        <Widget
                          title="New Leads"
                          subtitle="Captured in the last 7 days"
                          icon={Target}
                          to="/leads"
                          hash="new-7d"
                        >
                          {d.newLeads.isPending ? (
                            <Loading />
                          ) : d.newLeads.isError ? (
                            <LoadError onRetry={() => void d.newLeads.refetch()} />
                          ) : d.newLeads.data?.length ? (
                            <ul className="divide-y divide-border/60">
                              {d.newLeads.data.slice(0, 6).map((l) => (
                                <li key={l.id}>
                                  <Link
                                    to="/leads/$leadId"
                                    params={{ leadId: l.id }}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition"
                                  >
                                    <div className="w-9 h-9 rounded-full bg-accent/10 grid place-items-center text-xs font-semibold text-accent shrink-0">
                                      {(leadDisplayName(l).match(/\b\w/g) || [])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">
                                        {leadDisplayName(l)}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {l.company_name || l.email || "—"}
                                        {l.source ? ` · ${l.source}` : ""}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {l.rating === "hot" && (
                                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                                      )}
                                      {typeof l.score === "number" && (
                                        <Badge variant="outline" className="text-[11px]">
                                          {l.score}
                                        </Badge>
                                      )}
                                      <LeadStatusBadge status={l.status} />
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Empty text="No new leads this week." />
                          )}
                        </Widget>

                        <Widget
                          title="Assigned to me"
                          subtitle="Your open leads"
                          icon={Zap}
                          to="/leads"
                        >
                          {d.assignedLeads.isPending ? (
                            <Loading />
                          ) : d.assignedLeads.isError ? (
                            <LoadError onRetry={() => void d.assignedLeads.refetch()} />
                          ) : d.assignedLeads.data?.length ? (
                            <ul className="divide-y divide-border/60">
                              {d.assignedLeads.data.slice(0, 6).map((l) => (
                                <li key={l.id}>
                                  <Link
                                    to="/leads/$leadId"
                                    params={{ leadId: l.id }}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition"
                                  >
                                    <div className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center text-xs font-semibold text-primary shrink-0">
                                      {(leadDisplayName(l).match(/\b\w/g) || [])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">
                                        {leadDisplayName(l)}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {l.company_name || l.email || "—"}
                                      </div>
                                    </div>
                                    <LeadStatusBadge status={l.status} />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Empty text="Nothing assigned to you." />
                          )}
                        </Widget>
                      </div>
                    </DashboardPanel>
                  );

                case "widget-recent-conversations":
                  return (
                    <DashboardPanel key={widget.id} {...panelProps}>
                      <div className="grid min-w-0 grid-cols-1 gap-4 @2xl/panel:grid-cols-2 @4xl/panel:gap-5">
                        <Widget
                          title="Recently Added Contacts"
                          subtitle="Fresh people in your CRM"
                          icon={Users}
                          to="/contacts"
                        >
                          {d.recentContacts.isPending ? (
                            <Loading />
                          ) : d.recentContacts.isError ? (
                            <LoadError onRetry={() => void d.recentContacts.refetch()} />
                          ) : d.recentContacts.data?.length ? (
                            <ul className="divide-y divide-border/60">
                              {d.recentContacts.data.slice(0, 6).map((c) => (
                                <li key={c.id}>
                                  <Link
                                    to="/contacts/$contactId"
                                    params={{ contactId: c.id }}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition"
                                  >
                                    <Avatar className="w-9 h-9 shrink-0">
                                      {c.avatar_url ? <AvatarImage src={c.avatar_url} /> : null}
                                      <AvatarFallback className="text-xs bg-accent/10 text-accent">
                                        {contactInitials(c)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">
                                        {contactDisplayName(c)}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {c.job_title || c.email || "—"}
                                      </div>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground shrink-0">
                                      {timeAgo(c.created_at)}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Empty text="No recent contacts." />
                          )}
                        </Widget>

                        <Widget
                          title="Recent Conversations"
                          subtitle="Latest inbound activity"
                          icon={MessagesSquare}
                          to="/inbox"
                        >
                          {d.recentConversations.isPending ? (
                            <Loading />
                          ) : d.recentConversations.isError ? (
                            <LoadError onRetry={() => void d.recentConversations.refetch()} />
                          ) : d.recentConversations.data?.length ? (
                            <ul className="divide-y divide-border/60">
                              {d.recentConversations.data.map((c) => {
                                const name =
                                  c.contact?.display_name ||
                                  [c.contact?.first_name, c.contact?.last_name]
                                    .filter(Boolean)
                                    .join(" ") ||
                                  "Unknown";
                                const initials = name
                                  .split(/\s+/)
                                  .map((w) => w[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase();
                                return (
                                  <li
                                    key={c.id}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition"
                                  >
                                    <Avatar className="w-9 h-9 shrink-0">
                                      {c.contact?.avatar_url ? (
                                        <AvatarImage src={c.contact.avatar_url} />
                                      ) : null}
                                      <AvatarFallback className="text-xs bg-emerald-500/10 text-emerald-600">
                                        {initials || "??"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">{name}</div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {c.ai_summary || `Status: ${c.status}`}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {c.unread_count > 0 && (
                                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                                          {c.unread_count}
                                        </span>
                                      )}
                                      {c.last_message_at && (
                                        <span className="text-[11px] text-muted-foreground">
                                          {timeAgo(c.last_message_at)}
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <Empty text="No conversations yet." />
                          )}
                        </Widget>
                      </div>
                    </DashboardPanel>
                  );

                case "widget-upcoming-tasks":
                  return (
                    <DashboardPanel key={widget.id} {...panelProps}>
                      <div className="grid min-w-0 grid-cols-1 gap-4 @2xl/panel:grid-cols-2 @4xl/panel:gap-5">
                        <Widget
                          title="Today's Activities"
                          subtitle="Everything that happened today"
                          icon={Activity}
                        >
                          {d.todaysActivities.isPending ? (
                            <Loading />
                          ) : d.todaysActivities.isError ? (
                            <LoadError onRetry={() => void d.todaysActivities.refetch()} />
                          ) : d.todaysActivities.data?.length ? (
                            <ol className="p-4 space-y-3 relative before:absolute before:left-[22px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                              {d.todaysActivities.data.slice(0, 10).map((a) => (
                                <li key={a.id} className="flex items-start gap-3 relative">
                                  <div className="w-3 h-3 rounded-full bg-accent mt-1.5 ring-4 ring-surface z-10 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm truncate">
                                      {a.summary || a.verb.replace(/[._]/g, " ")}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      <span className="capitalize">
                                        {a.verb.replace(/[._]/g, " ")}
                                      </span>
                                      {a.object_type ? ` · ${a.object_type}` : ""} ·{" "}
                                      {fmtZoned(new Date(a.created_at), {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <Empty text="No activity yet today." />
                          )}
                        </Widget>

                        <div
                          id="dashboard-upcoming-tasks"
                          tabIndex={-1}
                          className="min-w-0 scroll-mt-[calc(var(--topbar-height)+1rem)]"
                        >
                          <Widget
                            title="Upcoming Tasks"
                            subtitle="CRM and project work, sorted by due date"
                            icon={Calendar}
                          >
                            <div className="flex flex-wrap gap-3 border-b border-border/60 px-4 py-2 text-xs">
                              {!!tasks.data?.crmUpcomingCount && (
                                <Link
                                  to="/tasks"
                                  search={{ taskId: undefined }}
                                  className="text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                  View CRM tasks ({tasks.data.crmUpcomingCount})
                                </Link>
                              )}
                              {!!tasks.data?.projectUpcomingCount && (
                                <Link
                                  to="/projects/tasks"
                                  className="text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                                >
                                  View Project tasks ({tasks.data.projectUpcomingCount})
                                </Link>
                              )}
                              <Link
                                to="/settings/task-reminders"
                                className="text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                              >
                                Reminder settings
                              </Link>
                            </div>
                            {tasks.data && overdue > 0 && (
                              <div className="border-b border-border/60 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
                                {overdue} overdue · CRM {tasks.data.crmOverdueCount} · Project{" "}
                                {tasks.data.projectOverdueCount}
                              </div>
                            )}
                            {tasks.isPending ? (
                              <Loading />
                            ) : tasks.isError ? (
                              <LoadError onRetry={() => void tasks.refetch()} />
                            ) : upcoming.length ? (
                              <ul className="divide-y divide-border/60">
                                {upcoming.slice(0, 8).map((t) => (
                                  <li
                                    key={`${t.source}:${t.id}`}
                                    className="flex items-center gap-3 px-4 py-2.5"
                                  >
                                    <div
                                      className={`w-2 h-2 rounded-full shrink-0 ${t.priority === "high" || t.priority === "urgent" ? "bg-destructive" : t.priority === "medium" ? "bg-amber-500" : "bg-muted-foreground/60"}`}
                                    />
                                    <Link to={t.to} className="flex-1 min-w-0 hover:underline">
                                      <div className="text-sm font-medium truncate">{t.title}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {t.dueAt
                                          ? fmtZoned(new Date(t.dueAt), {
                                              month: "short",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          : t.dueDate
                                            ? formatProjectDueDate(t.dueDate)
                                            : "No date"}
                                      </div>
                                    </Link>
                                    <Badge variant="secondary" className="text-[11px] shrink-0">
                                      {t.source}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-[11px] capitalize shrink-0"
                                    >
                                      {t.status}
                                    </Badge>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <Empty text="No upcoming tasks." />
                            )}
                          </Widget>
                        </div>
                      </div>
                    </DashboardPanel>
                  );

                default:
                  return null;
              }
            })}
        </div>
        {!widgets.some((widget) => widget.visible) && (
          <Empty text="All widgets are hidden. Use Customize Layout to show widgets." />
        )}
      </main>

      {/* Dashboard Customization Modal */}
      <DashboardCustomizeModal
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        widgets={widgets}
        onSaveWidgets={handleSaveWidgets}
        onResetDefaults={handleResetWidgets}
      />
    </Dialog>
  );
}

/* ---------------- Reusable pieces ---------------- */

const dashboardPanelMotion = {
  hidden: { opacity: 0, y: DISTANCE.sm },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...TRANSITION.page, delay: Math.min(index, 4) * 0.035, staggerChildren: 0.035 },
  }),
};

const widgetWidths = {
  compact: "@4xl:col-span-2",
  medium: "@4xl:col-span-4",
  full: "@4xl:col-span-6",
};

function DashboardPanel({
  size,
  index,
  reduceMotion,
  animateEntrance,
  children,
}: {
  size: DashboardWidgetConfig["size"];
  index: number;
  reduceMotion: boolean;
  animateEntrance: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout={reduceMotion ? false : "position"}
      initial={animateEntrance && !reduceMotion ? "hidden" : false}
      animate="visible"
      variants={dashboardPanelMotion}
      transition={{ layout: TRANSITION.page }}
      className={`@container/panel min-w-0 ${widgetWidths[size]}`}
      custom={index}
    >
      {children}
    </motion.div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
}: {
  icon: typeof Users;
  label: string;
  to: "/leads" | "/contacts" | "/companies" | "/deals" | "/tasks" | "/inbox" | "/ai-studio";
}) {
  const create = to !== "/inbox" && to !== "/ai-studio";
  return (
    <motion.div className="min-w-0" variants={variants.card}>
      <Button
        variant="outline"
        asChild
        className="min-h-11 w-full min-w-0 justify-start gap-1.5 whitespace-normal px-2 text-left text-xs leading-tight motion-safe:active:scale-[0.98]"
      >
        <Link to={to} search={create ? { create: true } : undefined}>
          <Icon className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0">{label}</span>
        </Link>
      </Button>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
  to,
  hash,
  onClick,
  loading = false,
  error = false,
  compact = false,
}: {
  icon: typeof Users;
  tone: "accent" | "rose" | "green" | "amber";
  label: string;
  value: string;
  hint?: string;
  to?: string;
  hash?: string;
  onClick?: () => void;
  loading?: boolean;
  error?: boolean;
  compact?: boolean;
}) {
  const toneClass = {
    accent: "bg-accent/10 text-accent",
    rose: "bg-rose-500/10 text-rose-500",
    green: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
  }[tone];
  const content = (
    <MotionCard
      interactive={Boolean(to || onClick)}
      className="group h-full min-w-0 rounded-surface p-3 sm:p-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className={`grid size-8 shrink-0 place-items-center rounded-control ${toneClass}`}>
          <Icon className="size-4" aria-hidden />
        </div>
        <span className="text-xs font-medium leading-snug text-muted-foreground">{label}</span>
        {(to || onClick) && (
          <ArrowRight
            aria-hidden
            className="ml-auto hidden size-3.5 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 @lg/panel:block"
          />
        )}
      </div>
      <div className="mt-3">
        <div
          className={
            compact
              ? "break-words font-display text-lg font-semibold tabular-nums"
              : "break-words font-display text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl"
          }
        >
          {loading ? (
            <div role="status" className="flex min-h-12 flex-col justify-center gap-2">
              <span className="sr-only">Loading…</span>
              <Skeleton aria-hidden className="h-5 w-2/5 bg-muted motion-reduce:animate-none" />
              <Skeleton aria-hidden className="h-2.5 w-3/5 bg-muted motion-reduce:animate-none" />
            </div>
          ) : error ? (
            <span className="text-sm text-destructive">Could not load</span>
          ) : (
            value
          )}
        </div>
        {!loading && !error && hint && (
          <div className="mt-1 text-xs leading-snug text-muted-foreground">{hint}</div>
        )}
      </div>
    </MotionCard>
  );
  return (
    <motion.div className="min-w-0" variants={variants.card}>
      {to ? (
        <Link
          to={to}
          hash={hash}
          className="block h-full min-w-0 rounded-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {content}
        </Link>
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="block h-full w-full min-w-0 rounded-surface text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {content}
        </button>
      ) : (
        content
      )}
    </motion.div>
  );
}

function Widget({
  title,
  subtitle,
  icon: Icon,
  children,
  to,
  hash,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Users;
  children: React.ReactNode;
  to?: string;
  hash?: string;
}) {
  return (
    <section className="flex h-full min-w-0 flex-col rounded-surface border border-border bg-surface shadow-sm">
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid size-8 shrink-0 place-items-center rounded-control bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {to && (
          <Link
            to={to}
            hash={hash}
            aria-label={`View all: ${title}`}
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-control px-1 text-xs font-medium text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-4 py-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function Loading() {
  return (
    <div role="status" className="space-y-3 px-4 py-5">
      <span className="sr-only">Loading…</span>
      <Skeleton aria-hidden className="h-3 w-2/3 bg-muted motion-reduce:animate-none" />
      <Skeleton aria-hidden className="h-3 w-2/5 bg-muted motion-reduce:animate-none" />
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-6 text-center text-sm text-destructive">
      <p>Could not load this data.</p>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function formatProjectDueDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function LeadStatusBadge({ status }: { status: string }) {
  const cls =
    {
      new: "bg-blue-500/10 text-blue-600",
      contacted: "bg-purple-500/10 text-purple-600",
      working: "bg-amber-500/10 text-amber-600",
      qualified: "bg-emerald-500/10 text-emerald-600",
      nurturing: "bg-cyan-500/10 text-cyan-600",
      converted: "bg-primary/10 text-primary",
      disqualified: "bg-muted text-muted-foreground",
      unqualified: "bg-muted text-muted-foreground",
    }[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded capitalize ${cls}`}>
      {status}
    </span>
  );
}

function PipelineSummary({
  data,
  loading,
  error,
  onRetry,
  tenantCurrency,
}: {
  data?: DashboardPipelineData;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  tenantCurrency: string;
}) {
  const reduceMotion = useReducedMotionSafe();
  const stages = data?.stages ?? [];
  const max = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <Widget title="Pipeline Summary" subtitle="Open deals by stage" icon={Handshake} to="/deals">
      {loading ? (
        <Loading />
      ) : error ? (
        <LoadError onRetry={onRetry} />
      ) : data?.state === "no_pipeline" ? (
        <Empty text="No pipeline configured. Create a pipeline to get started." />
      ) : data?.state === "no_stages" ? (
        <Empty text="No stages configured in your pipeline." />
      ) : data ? (
        <div className="p-4 space-y-3">
          {data.state === "no_open_deals" && (
            <p className="text-sm text-muted-foreground">No open deals yet.</p>
          )}
          {stages.map((s) => (
            <div key={s.id}>
              <div className="mb-1 grid grid-cols-2 items-start gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2 break-words font-medium">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: s.color || "var(--accent)" }}
                  />
                  {data.pipelines.length > 1 ? `${s.pipelineName} · ${s.name}` : s.name}
                </span>
                <span className="min-w-0 break-words text-right tabular-nums text-muted-foreground">
                  {s.count} ·{" "}
                  {s.totals.length
                    ? s.totals
                        .map((total) =>
                          formatMoney(Math.round(total.amount), total.currency, {
                            maximumFractionDigits: 0,
                          }),
                        )
                        .join(" · ")
                    : formatMoney(0, tenantCurrency, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full origin-left bg-gradient-to-r from-accent to-primary"
                  style={{ width: `${(s.count / max) * 100}%` }}
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ ...TRANSITION.page, duration: reduceMotion ? 0 : DURATION.slow }}
                />
              </div>
            </div>
          ))}
          {data.unassignedDeals > 0 && (
            <p className="text-xs text-muted-foreground">
              {data.unassignedDeals} open deal(s) have no stage.
            </p>
          )}
        </div>
      ) : (
        <Empty text="No pipeline data available." />
      )}
    </Widget>
  );
}

function AIInsights({
  newLeads,
  atRisk,
  overdue,
  pipelineTotals,
  loading,
  error,
  onRetry,
}: {
  newLeads: number;
  atRisk: number;
  overdue: number;
  pipelineTotals: DashboardPipelineData["totals"];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const insights: Array<{ icon: typeof Sparkles; tone: string; title: string; body: string }> = [];
  if (newLeads > 0)
    insights.push({
      icon: TrendingUp,
      tone: "text-emerald-600 bg-emerald-500/10",
      title: `${newLeads} fresh lead${newLeads === 1 ? "" : "s"} this week`,
      body: "Reach out within 24h to boost conversion by up to 7×.",
    });
  if (atRisk > 0)
    insights.push({
      icon: AlertTriangle,
      tone: "text-rose-600 bg-rose-500/10",
      title: `${atRisk} customer${atRisk === 1 ? "" : "s"} at risk`,
      body: "Schedule a check-in call before health scores drop further.",
    });
  if (overdue > 0)
    insights.push({
      icon: Clock,
      tone: "text-amber-600 bg-amber-500/10",
      title: `${overdue} overdue task${overdue === 1 ? "" : "s"}`,
      body: "Clearing overdue work first keeps deals moving forward.",
    });
  if (pipelineTotals.length > 0)
    insights.push({
      icon: DollarSign,
      tone: "text-primary bg-primary/10",
      title: `Weighted pipeline: ${pipelineTotals.map((total) => formatMoney(Math.round(total.weighted), total.currency, { maximumFractionDigits: 0 })).join(" · ")}`,
      body: `Out of ${pipelineTotals.map((total) => formatMoney(Math.round(total.amount), total.currency, { maximumFractionDigits: 0 })).join(" · ")} open, probability-adjusted.`,
    });
  if (!insights.length)
    insights.push({
      icon: CheckCircle2,
      tone: "text-emerald-600 bg-emerald-500/10",
      title: "All caught up",
      body: "No urgent signals right now. Great time to prospect new accounts.",
    });

  return (
    <section className="h-full min-w-0 rounded-surface border border-border bg-surface shadow-sm">
      <header className="flex items-center gap-2 border-b border-border/70 px-4 py-3.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-control bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold">AI Insights</h2>
          <p className="text-xs text-muted-foreground">Automatic signals from your workspace</p>
        </div>
      </header>
      {loading ? (
        <Loading />
      ) : error ? (
        <LoadError onRetry={onRetry} />
      ) : (
        <ul className="p-3 space-y-2">
          {insights.map((i, idx) => (
            <li key={idx} className="flex items-start gap-3 rounded-control bg-muted/40 p-3">
              <div className={`w-8 h-8 rounded-control grid place-items-center shrink-0 ${i.tone}`}>
                <i.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{i.title}</div>
                <div className="text-xs text-muted-foreground">{i.body}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd}d`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}
