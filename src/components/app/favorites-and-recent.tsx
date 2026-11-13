import { Link, useLocation } from "@tanstack/react-router";
import { Star, Clock, X, GripVertical } from "lucide-react";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/shared/hooks/use-favorites";
import { useRecentPages } from "@/shared/hooks/use-recent-pages";
import { NAV_ITEMS } from "./nav-config";

/**
 * FavoritesList — pinned pages rail with drag-and-drop reordering.
 * Uses Framer Motion Reorder.Group and Reorder.Item for smooth, GPU-accelerated interaction.
 */
export function FavoritesList({ collapsed = false }: { collapsed?: boolean }) {
  const { items, remove, reorder } = useFavorites();
  const location = useLocation();

  if (collapsed) return null;
  if (items.length === 0) {
    return (
      <div className="px-3 pt-1 pb-3 text-[11px] text-sidebar-foreground/50">
        Pin pages you visit often — right-click any nav item to add.
      </div>
    );
  }

  const handleReorder = (newOrder: string[]) => {
    newOrder.forEach((path, idx) => {
      const oldIdx = items.indexOf(path);
      if (oldIdx !== -1 && oldIdx !== idx) {
        reorder(oldIdx, idx);
      }
    });
  };

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={handleReorder}
      className="space-y-0.5 px-2 pb-2"
    >
      {items.map((path) => {
        const meta = NAV_ITEMS.find((n) => n.to === path);
        const label = meta?.label ?? path.replace(/^\//, "");
        const Icon = meta?.icon ?? Star;
        const active = location.pathname === path;

        return (
          <Reorder.Item
            key={path}
            value={path}
            className="group relative select-none touch-none list-none"
          >
            <div
              className={cn(
                "flex items-center gap-2 h-9 rounded-control px-2 text-sidebar-item text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150",
                active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              )}
            >
              <div
                className="opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-opacity"
                title="Drag to reorder favorite"
              >
                <GripVertical className="h-3 w-3" />
              </div>

              <Link to={path} className="flex items-center gap-2 flex-1 min-w-0">
                <Icon className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <span className="flex-1 min-w-0 truncate text-xs">{label}</span>
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(path);
                }}
                className="opacity-0 group-hover:opacity-100 grid h-5 w-5 place-items-center rounded text-sidebar-foreground/60 hover:bg-sidebar-accent-foreground/10 hover:text-sidebar-accent-foreground transition-opacity"
                aria-label={`Unpin ${label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
  );
}

/**
 * RecentList — most-recently-visited pages rail. Auto-tracked by `useRecentPages`.
 */
export function RecentList({ collapsed = false }: { collapsed?: boolean }) {
  const { items } = useRecentPages();
  const location = useLocation();

  if (collapsed || items.length === 0) return null;

  return (
    <ul className="space-y-0.5 px-2 pb-2">
      {items.slice(0, 5).map((path) => {
        const meta = NAV_ITEMS.find((n) => n.to === path);
        const label = meta?.label ?? path.replace(/^\//, "");
        const Icon = meta?.icon ?? Clock;
        const active = location.pathname === path;

        return (
          <li key={path} className="animate-fade-in list-none">
            <Link
              to={path}
              className={cn(
                "flex items-center gap-2 h-8 rounded-control px-2 text-sidebar-item text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150",
                active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              )}
            >
              <Icon
                className="h-3.5 w-3.5 shrink-0 opacity-60 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="flex-1 min-w-0 truncate text-xs">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
