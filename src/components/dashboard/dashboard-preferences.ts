/**
 * CYLOO CRM — Dashboard Preferences & Widget Configuration
 *
 * Manages layout ordering, visibility, and sizing preferences for dashboard widgets
 * with local persistence scoped by workspace ID.
 */

export type WidgetSize = "compact" | "medium" | "full";

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  description: string;
  category: "analytics" | "sales" | "communication" | "tasks";
  defaultSize: WidgetSize;
  size: WidgetSize;
  visible: boolean;
  order: number;
}

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: "widget-kpi-summary",
    title: "Key Performance Indicators",
    description: "Real-time summary of leads, won revenue, active deals and SLA rate.",
    category: "analytics",
    defaultSize: "full",
    size: "full",
    visible: true,
    order: 0,
  },
  {
    id: "widget-quick-actions",
    title: "Quick Action Launchpad",
    description: "One-click shortcuts to capture leads, send WhatsApp broadcasts, and draft quotes.",
    category: "sales",
    defaultSize: "full",
    size: "full",
    visible: true,
    order: 1,
  },
  {
    id: "widget-pipeline-funnel",
    title: "Deal Pipeline Funnel",
    description: "Visual deal stage progression, value distribution and conversion rates.",
    category: "sales",
    defaultSize: "medium",
    size: "medium",
    visible: true,
    order: 2,
  },
  {
    id: "widget-recent-conversations",
    title: "Live Omnichannel Inbox",
    description: "Latest WhatsApp, Instagram, and web chat conversations requiring response.",
    category: "communication",
    defaultSize: "medium",
    size: "medium",
    visible: true,
    order: 3,
  },
  {
    id: "widget-recent-leads",
    title: "Recent Inbound Leads",
    description: "Newly captured leads with AI scoring, contact details and assigned reps.",
    category: "sales",
    defaultSize: "medium",
    size: "medium",
    visible: true,
    order: 4,
  },
  {
    id: "widget-upcoming-tasks",
    title: "Priority Tasks & Reminders",
    description: "Pending follow-ups, scheduled calls, and SLA-bound action items.",
    category: "tasks",
    defaultSize: "medium",
    size: "medium",
    visible: true,
    order: 5,
  },
];

const PREFS_KEY_PREFIX = "cyloo_dashboard_layout_";

export function loadDashboardPreferences(workspaceId: string): DashboardWidgetConfig[] {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_WIDGETS;

  try {
    const raw = localStorage.getItem(`${PREFS_KEY_PREFIX}${workspaceId}`);
    if (!raw) return DEFAULT_DASHBOARD_WIDGETS;

    const saved = JSON.parse(raw) as Partial<DashboardWidgetConfig>[];
    if (!Array.isArray(saved) || saved.length === 0) return DEFAULT_DASHBOARD_WIDGETS;

    // Merge saved config with defaults to ensure newly added widgets appear
    const merged = DEFAULT_DASHBOARD_WIDGETS.map((defaultWidget) => {
      const match = saved.find((s) => s.id === defaultWidget.id);
      if (!match) return defaultWidget;
      return {
        ...defaultWidget,
        size: match.size ?? defaultWidget.defaultSize,
        visible: match.visible ?? true,
        order: typeof match.order === "number" ? match.order : defaultWidget.order,
      };
    });

    return merged.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_DASHBOARD_WIDGETS;
  }
}

export function saveDashboardPreferences(
  workspaceId: string,
  widgets: DashboardWidgetConfig[],
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      `${PREFS_KEY_PREFIX}${workspaceId}`,
      JSON.stringify(
        widgets.map((w, idx) => ({
          id: w.id,
          size: w.size,
          visible: w.visible,
          order: idx,
        })),
      ),
    );
  } catch {
    // LocalStorage quota or access error
  }
}

export function resetDashboardPreferences(workspaceId: string): DashboardWidgetConfig[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(`${PREFS_KEY_PREFIX}${workspaceId}`);
    } catch {}
  }
  return DEFAULT_DASHBOARD_WIDGETS;
}

