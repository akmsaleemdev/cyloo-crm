/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: Dashboard Customization & Motion System
 * ============================================================================
 *
 * Validates the drag-and-drop dashboard widget configuration, sizing rules,
 * preference serialization, and default layouts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_DASHBOARD_WIDGETS,
  loadDashboardPreferences,
  saveDashboardPreferences,
  resetDashboardPreferences,
  type DashboardWidgetConfig,
} from "@/components/dashboard/dashboard-preferences";
import { MOTION_TIMINGS, MOTION_EASINGS } from "@/components/ui/motion";

describe("Dashboard Preferences & Customization Engine", () => {
  const testWorkspaceId = "ws_test_enterprise_123";

  beforeEach(() => {
    localStorage.clear();
  });

  it("should have valid default dashboard widgets", () => {
    expect(DEFAULT_DASHBOARD_WIDGETS.length).toBeGreaterThanOrEqual(5);

    const ids = DEFAULT_DASHBOARD_WIDGETS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const widget of DEFAULT_DASHBOARD_WIDGETS) {
      expect(widget.title.length).toBeGreaterThan(0);
      expect(widget.visible).toBe(true);
      expect(["compact", "medium", "full"]).toContain(widget.size);
    }
  });

  it("should return default layout when no preferences are saved", () => {
    const loaded = loadDashboardPreferences(testWorkspaceId);
    expect(loaded).toEqual(DEFAULT_DASHBOARD_WIDGETS);
  });

  it("should save and restore custom widget order and visibility", () => {
    const customized: DashboardWidgetConfig[] = DEFAULT_DASHBOARD_WIDGETS.map(
      (w, idx) => ({
        ...w,
        order: DEFAULT_DASHBOARD_WIDGETS.length - idx,
        visible: idx !== 0, // Hide the first widget
        size: idx === 1 ? "full" : w.size,
      }),
    ).reverse();

    saveDashboardPreferences(testWorkspaceId, customized);

    const reloaded = loadDashboardPreferences(testWorkspaceId);
    expect(reloaded).toHaveLength(DEFAULT_DASHBOARD_WIDGETS.length);

    // Verify first widget is hidden
    const hiddenWidget = reloaded.find((w) => w.id === DEFAULT_DASHBOARD_WIDGETS[0].id);
    expect(hiddenWidget?.visible).toBe(false);
  });

  it("should reset preferences to system defaults", () => {
    const customized: DashboardWidgetConfig[] = DEFAULT_DASHBOARD_WIDGETS.map(
      (w) => ({ ...w, visible: false }),
    );
    saveDashboardPreferences(testWorkspaceId, customized);

    const reset = resetDashboardPreferences(testWorkspaceId);
    expect(reset.every((w) => w.visible)).toBe(true);

    const afterReset = loadDashboardPreferences(testWorkspaceId);
    expect(afterReset.every((w) => w.visible)).toBe(true);
  });
});

describe("Motion System Animation Standards", () => {
  it("should enforce standard enterprise animation timings", () => {
    expect(MOTION_TIMINGS.fast).toBeLessThan(0.25);
    expect(MOTION_TIMINGS.standard).toBeLessThanOrEqual(0.3);
    expect(MOTION_TIMINGS.smooth).toBeLessThanOrEqual(0.4);
  });

  it("should define accessible spring easings", () => {
    expect(MOTION_EASINGS.spring.damping).toBeGreaterThanOrEqual(20);
    expect(MOTION_EASINGS.spring.stiffness).toBeGreaterThan(100);
  });
});

