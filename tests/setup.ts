/**
 * ============================================================================
 * CYLOO CRM — Vitest Global Test Setup
 * ============================================================================
 *
 * Shared bootstrap for every Vitest test (unit, integration, API).
 * Loaded via vitest.config.ts → setupFiles.
 */

import "@testing-library/jest-dom/vitest";

// ---------------------------------------------------------------------------
// Globally mock Supabase client for unit/integration tests.
// Live DB tests use the `SUPABASE_TEST_URL` env variable and skip this mock.
// ---------------------------------------------------------------------------
if (!process.env.SUPABASE_TEST_URL) {
  vi.mock("@supabase/supabase-js", () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));

    const mockAuth = {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    };

    const mockStorage = {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: "test.png" }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/test.png" } })),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };

    return {
      createClient: vi.fn(() => ({
        from: mockFrom,
        auth: mockAuth,
        storage: mockStorage,
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnValue("SUBSCRIBED"),
          unsubscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
      })),
    };
  });
}

// ---------------------------------------------------------------------------
// Suppress noisy console.warn / console.error in test output for known
// benign React / TanStack warnings.
// ---------------------------------------------------------------------------
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: Parameters<typeof console.warn>) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (msg.includes("React Router") || msg.includes("ReactDOM.render")) return;
  originalWarn(...args);
};

console.error = (...args: Parameters<typeof console.error>) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (
    msg.includes("Not implemented") ||
    msg.includes("Error: Uncaught") ||
    msg.includes("act()")
  )
    return;
  originalError(...args);
};

// ---------------------------------------------------------------------------
// Global test helpers
// ---------------------------------------------------------------------------
export function createMockWorkspaceId(): string {
  return `ws_test_${crypto.randomUUID().slice(0, 8)}`;
}

export function createMockUserId(): string {
  return crypto.randomUUID();
}

