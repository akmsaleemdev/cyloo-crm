/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: Utility Functions (cn)
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name merger)", () => {
  it("should merge class names with clsx + tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("should handle conditional classes", () => {
    const isHidden = false;
    expect(cn("base", isHidden && "hidden", "flex")).toBe("base flex");
  });

  it("should handle undefined and null values", () => {
    expect(cn("base", undefined, null, "flex")).toBe("base flex");
  });

  it("should return empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("should merge conflicting tailwind utilities", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("should handle array inputs", () => {
    expect(cn(["px-2", "py-2"], "px-4")).toBe("py-2 px-4");
  });

  it("should handle object inputs", () => {
    expect(cn({ hidden: true, flex: false })).toBe("hidden");
  });
});
