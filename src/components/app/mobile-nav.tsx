import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Menu, LogOut, X, ShieldCheck, User, Settings, CreditCard, LifeBuoy } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useLayout } from "@/shared/contexts/layout-context";
import { OrganizationSwitcherConnected } from "./organization-switcher-connected";
import { useTenantBrand } from "@/hooks/use-tenant-brand";
import cylooLogo from "@/assets/cyloo-logo.svg";
import { NAV_ITEMS, NAV_GROUPS, API_CONFIG_CHILDREN, type NavItem } from "./nav-config";
import { usePlatformRuntime } from "@/hooks/use-platform-runtime";
import { isRouteEnabled } from "@/lib/admin/platform-features";
import { NestedNavItem, NestedNavGroup, type NestedNavNode } from "./nested-nav-item";
import { usePlatformRole } from "@/shared/hooks/use-platform-role";
import { usePermissions } from "@/hooks/use-permissions";
import { useConversationCounts } from "@/hooks/use-conversations";
import { useCurrentWorkspace, useWorkspaceRole } from "@/hooks/use-workspace";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { docsUrl } from "@/lib/docs/links";

export function MobileNav({ showBrand = false }: { showBrand?: boolean }) {
  const { mobileNavOpen, setMobileNavOpen, navMode } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  // Close drawer on route change.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash, setMobileNavOpen]);

  const qc = useQueryClient();
  const { role } = usePlatformRole();
  const brand = useTenantBrand();
  const { can, isSuperAdmin, loading: permsLoading } = usePermissions();
  const { active: activeWorkspace } = useCurrentWorkspace();
  const { data: workspaceRole } = useWorkspaceRole(activeWorkspace?.id);
  const { config: platform } = usePlatformRuntime();
  const { data: convCounts } = useConversationCounts();
  const liveBadge = (to: string): number | undefined =>
    to === "/inbox" ? (convCounts?.badges?.unread ?? convCounts?.unread) : undefined;

  const groups = [
    ...NAV_GROUPS,
    ...(role === "superadmin"
      ? [{ id: "admin" as const, label: "Platform", icon: ShieldCheck }]
      : []),
  ];

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    setMobileNavOpen(false);
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild>
        <button
          data-hidden={navMode !== "mobile" || undefined}
          className="data-[hidden]:hidden grid h-11 w-9 shrink-0 place-items-center rounded-control text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>

      {showBrand && navMode === "mobile" && (
        <img
          className="size-6 shrink-0 object-contain"
          src={brand.logoUrl ?? cylooLogo}
          alt={brand.name}
        />
      )}
      <SheetContent
        side="left"
        aria-describedby={undefined}
        overlayClassName="bg-black/50 duration-200 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none"
        style={{ borderColor: "var(--sidebar-border)" }}
        className="flex h-dvh w-[88vw] max-w-sm flex-col gap-0 border-sidebar-border bg-sidebar p-0 pt-[env(safe-area-inset-top)] text-sidebar-foreground sm:w-80 data-[state=open]:duration-200 data-[state=closed]:duration-150 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none"
      >
        <SheetHeader className="border-b border-sidebar-border px-3 h-header flex-row items-center space-y-0 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="grid place-items-center w-8 h-8 rounded-control overflow-hidden">
              <img src={brand.logoUrl ?? cylooLogo} alt={`${brand.name} logo`} className="size-6" />
            </div>
            <SheetTitle className="font-display text-sidebar-accent-foreground truncate">
              {brand.name}
            </SheetTitle>
          </div>
          <SheetClose
            aria-label="Close navigation"
            className="grid size-11 place-items-center rounded-control text-sidebar-foreground hover:bg-sidebar-accent/60 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-4" />
          </SheetClose>
        </SheetHeader>

        <div className="px-3 pt-4">
          <OrganizationSwitcherConnected />
        </div>

        <ScrollAreaPrimitive.Root className="relative flex-1 min-h-0 overflow-hidden">
          <ScrollAreaPrimitive.Viewport className="h-full w-full">
            <nav
              aria-label="Main navigation"
              className="space-y-1 px-3 py-3"
              onClick={(event) => {
                const link = (event.target as Element).closest("a[href]");
                if (link?.getAttribute("href") === location.href) setMobileNavOpen(false);
              }}
            >
              <NestedNavGroup>
                {groups.map((group) => {
                  const items = NAV_ITEMS.filter((n) => n.group === group.id)
                    .filter(
                      (n) =>
                        n.to !== "/settings/white-label" ||
                        workspaceRole === "owner" ||
                        workspaceRole === "admin",
                    )
                    .filter(
                      (n) => !n.permission || permsLoading || isSuperAdmin || can(n.permission),
                    )
                    .filter((n) => isRouteEnabled(platform.features, n.to));
                  if (!items.length) return null;
                  const toLeaf = (it: NavItem) => ({
                    to: it.to,
                    label: it.label,
                    icon: it.icon,
                    badge: liveBadge(it.to) ?? it.badge,
                    external: it.external,
                    exact: it.exact,
                    hash: it.hash,
                  });
                  if (group.flat)
                    return items.map((item) => (
                      <NestedNavItem key={item.to} node={toLeaf(item)} touch />
                    ));
                  const categories = Array.from(
                    new Set(items.map((it) => it.category).filter(Boolean) as string[]),
                  );
                  const node: NestedNavNode =
                    group.id === "api"
                      ? { label: group.label, icon: group.icon, children: API_CONFIG_CHILDREN }
                      : {
                          label: group.label,
                          icon: group.icon,
                          children: categories.length
                            ? categories.map((category) => ({
                                label: category,
                                children: items
                                  .filter((it) => it.category === category)
                                  .map(toLeaf),
                              }))
                            : items.map(toLeaf),
                        };
                  return <NestedNavItem key={group.id} node={node} itemKey={group.id} touch />;
                })}
              </NestedNavGroup>
            </nav>
            <div className="border-t border-sidebar-border space-y-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Link
                to="/profile"
                className="flex h-11 w-full items-center gap-3 rounded-control px-3 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <Link
                to="/settings"
                className="flex h-11 w-full items-center gap-3 rounded-control px-3 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <Link
                to="/billing"
                className="flex h-11 w-full items-center gap-3 rounded-control px-3 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              >
                <CreditCard className="h-4 w-4" />
                <span>Billing</span>
              </Link>
              <a
                href={docsUrl("support")}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-full items-center gap-3 rounded-control px-3 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              >
                <LifeBuoy className="h-4 w-4" />
                <span>Help &amp; support</span>
              </a>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 rounded-control px-3 h-11 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </ScrollAreaPrimitive.Viewport>
          <ScrollAreaPrimitive.Scrollbar
            orientation="vertical"
            className="flex touch-none select-none transition-colors h-full w-2 border-l border-l-transparent p-[1px]"
          >
            <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-sidebar-border hover:bg-sidebar-accent-foreground/40 transition-colors" />
          </ScrollAreaPrimitive.Scrollbar>
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      </SheetContent>
    </Sheet>
  );
}
