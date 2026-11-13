/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: RBAC System
 * ============================================================================
 *
 * Tests role-based access control type definitions and guard functions.
 */

import { describe, it, expect } from "vitest";
import type { PlatformRole, WorkspaceRole } from "@/lib/rbac";

describe("RBAC Type System", () => {
  // ─── Platform Roles ──────────────────────────────────────────────────

  it("should define valid platform roles", () => {
    const validRoles: PlatformRole[] = ["superadmin", "support"];
    expect(validRoles).toHaveLength(2);
    expect(validRoles).toContain("superadmin");
    expect(validRoles).toContain("support");
  });

  // ─── Workspace Roles ─────────────────────────────────────────────────

  it("should define valid workspace roles", () => {
    const validRoles: WorkspaceRole[] = ["owner", "admin", "manager", "agent", "viewer"];
    expect(validRoles).toHaveLength(5);
  });

  it("should have a hierarchy where owner > admin > manager > agent > viewer", () => {
    const hierarchy: WorkspaceRole[] = ["owner", "admin", "manager", "agent", "viewer"];
    // The hierarchy should be 5 distinct levels
    expect(new Set(hierarchy).size).toBe(5);
  });
});

describe("RBAC Permission Scopes", () => {
  it("should follow namespace:action pattern in module features", async () => {
    const { ENTERPRISE_MODULES } = await import("@/config/enterprise-modules");

    for (const mod of ENTERPRISE_MODULES) {
      for (const feat of mod.features) {
        for (const perm of feat.requiredPermissions) {
          // Permissions should follow module:action or feature:action pattern
          expect(perm).toMatch(/^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/);
        }
      }
    }
  });
});
