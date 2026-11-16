import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

export type CreateShortcutRoute = "/leads" | "/contacts" | "/companies" | "/deals" | "/tasks";

export function validateCreateShortcut(search: Record<string, unknown>): { create?: boolean } {
  return { create: search.create === true ? true : undefined };
}

export function useCreateShortcut(to: CreateShortcutRoute, ready: boolean, open: () => void) {
  const requested = useSearch({ strict: false, select: (search) => search.create === true });
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready || !requested) return;
    open();
    void navigate({
      to,
      search: (previous) => ({ ...previous, create: undefined }),
      replace: true,
      resetScroll: false,
    });
  }, [navigate, open, ready, requested, to]);
}
