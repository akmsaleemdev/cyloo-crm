import { forwardRef, type AnchorHTMLAttributes } from "react";

// Preserve link destinations without needing the authenticated application router.
export const Link = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string;
    search?: Record<string, string>;
    activeProps?: unknown;
  }
>(({ to, search, activeProps: _activeProps, ...props }, ref) => (
  <a {...props} ref={ref} href={to + (search ? `?${new URLSearchParams(search)}` : "")} />
));
Link.displayName = "FixtureLink";
// eslint-disable-next-line react-refresh/only-export-components -- Test-only router adapter.
export const createFileRoute = () => (options: unknown) => ({ options });
// eslint-disable-next-line react-refresh/only-export-components -- Test-only router adapter.
export const redirect = (options: unknown) => options;
