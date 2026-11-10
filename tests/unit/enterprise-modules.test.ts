/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: Enterprise Module Registry
 * ============================================================================
 *
 * Validates the module manifest at src/config/enterprise-modules.ts:
 * - 36 modules across 8 hubs with no gaps or collisions
 * - Every module has valid route, icon, permissions, and features
 * - Helper functions return correct results
 */

import { describe, it, expect } from "vitest";
import {
  ENTERPRISE_MODULES,
  BUSINESS_HUBS,
  ARCHITECTURE_METRICS,
  getModuleByNumber,
  getModulesByHub,
  type BusinessHubId,
} from "@/config/enterprise-modules";

describe("Enterprise Module Registry", () => {
  const hubsList = Object.values(BUSINESS_HUBS);

  // ─── Architecture Invariants ───────────────────────────────────────────

  it("should define exactly 8 business hubs", () => {
    expect(hubsList).toHaveLength(8);
  });

  it("should define exactly 36 enterprise modules", () => {
    expect(ENTERPRISE_MODULES).toHaveLength(36);
  });

  it("should have unique module IDs", () => {
    const ids = ENTERPRISE_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique module numbers from 1 to 36", () => {
    const numbers = ENTERPRISE_MODULES.map((m) => m.moduleNumber).sort(
      (a, b) => a - b,
    );
    const expected = Array.from({ length: 36 }, (_, i) => i + 1);
    expect(numbers).toEqual(expected);
  });

  it("should assign every module to a valid hub", () => {
    const hubIds = Object.keys(BUSINESS_HUBS);
    for (const mod of ENTERPRISE_MODULES) {
      expect(hubIds).toContain(mod.hub);
    }
  });

  // ─── Module Schema Validation ─────────────────────────────────────────

  it("should have a non-empty name for every module", () => {
    for (const mod of ENTERPRISE_MODULES) {
      expect(mod.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("should have a non-empty routePrefix starting with /", () => {
    for (const mod of ENTERPRISE_MODULES) {
      expect(mod.routePrefix).toMatch(/^\//);
    }
  });

  it("should have at least 1 feature per module", () => {
    for (const mod of ENTERPRISE_MODULES) {
      expect(mod.features.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should have unique feature IDs within each module", () => {
    for (const mod of ENTERPRISE_MODULES) {
      const featureIds = mod.features.map((f) => f.id);
      expect(new Set(featureIds).size).toBe(featureIds.length);
    }
  });

  it("should have unique feature IDs across all modules", () => {
    const allFeatureIds = ENTERPRISE_MODULES.flatMap((m) =>
      m.features.map((f) => f.id),
    );
    expect(new Set(allFeatureIds).size).toBe(allFeatureIds.length);
  });

  it("should define requiredPermissions as a non-empty array for every feature", () => {
    for (const mod of ENTERPRISE_MODULES) {
      for (const feat of mod.features) {
        expect(Array.isArray(feat.requiredPermissions)).toBe(true);
        expect(feat.requiredPermissions.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  // ─── Total Feature Count ──────────────────────────────────────────────

  it("should export accurate architecture metrics", () => {
    expect(ARCHITECTURE_METRICS.totalModules).toBe(36);
    expect(ARCHITECTURE_METRICS.totalHubs).toBe(8);
    expect(ARCHITECTURE_METRICS.totalFeatures).toBeGreaterThanOrEqual(130);
  });

  // ─── Helper Functions ─────────────────────────────────────────────────

  it("getModuleByNumber should return the correct module", () => {
    const mod1 = getModuleByNumber(1);
    expect(mod1).toBeDefined();
    expect(mod1!.moduleNumber).toBe(1);

    const mod36 = getModuleByNumber(36);
    expect(mod36).toBeDefined();
    expect(mod36!.moduleNumber).toBe(36);
  });

  it("getModuleByNumber should return undefined for invalid numbers", () => {
    expect(getModuleByNumber(0)).toBeUndefined();
    expect(getModuleByNumber(37)).toBeUndefined();
    expect(getModuleByNumber(-1)).toBeUndefined();
  });

  it("getModulesByHub should return modules for every hub", () => {
    for (const hub of hubsList) {
      const modules = getModulesByHub(hub.id);
      expect(modules.length).toBeGreaterThanOrEqual(1);
      for (const m of modules) {
        expect(m.hub).toBe(hub.id);
      }
    }
  });

  it("getModulesByHub should return empty array for unknown hub", () => {
    const result = getModulesByHub("hub_nonexistent" as BusinessHubId);
    expect(result).toEqual([]);
  });

  // ─── Hub Coverage ─────────────────────────────────────────────────────

  it("should cover all 8 hubs with modules", () => {
    for (const hub of hubsList) {
      const count = ENTERPRISE_MODULES.filter((m) => m.hub === hub.id).length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  // ─── Dependency Validation ────────────────────────────────────────────

  it("should only reference existing module IDs in dependencies", () => {
    const allIds = new Set(ENTERPRISE_MODULES.map((m) => m.id));
    for (const mod of ENTERPRISE_MODULES) {
      for (const dep of mod.dependencies) {
        expect(allIds.has(dep)).toBe(true);
      }
    }
  });

  it("should not have circular self-dependencies", () => {
    for (const mod of ENTERPRISE_MODULES) {
      expect(mod.dependencies).not.toContain(mod.id);
    }
  });
});
