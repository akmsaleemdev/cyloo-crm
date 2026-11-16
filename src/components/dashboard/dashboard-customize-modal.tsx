import React from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Columns,
  Maximize2,
} from "lucide-react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type DashboardWidgetConfig, type WidgetSize } from "./dashboard-preferences";
import { toast } from "sonner";

interface DashboardCustomizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: DashboardWidgetConfig[];
  onSaveWidgets: (updated: DashboardWidgetConfig[]) => void;
  onResetDefaults: () => void;
}

export function DashboardCustomizeModal({
  open,
  onOpenChange,
  widgets,
  onSaveWidgets,
  onResetDefaults,
}: DashboardCustomizeModalProps) {
  const [localWidgets, setLocalWidgets] = React.useState<DashboardWidgetConfig[]>(widgets);

  // Sync with prop when opened
  React.useEffect(() => {
    if (open) {
      setLocalWidgets(widgets);
    }
  }, [open, widgets]);

  const toggleVisibility = (id: string) => {
    setLocalWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const cycleSize = (id: string) => {
    const nextSizeMap: Record<WidgetSize, WidgetSize> = {
      compact: "medium",
      medium: "full",
      full: "compact",
    };
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size: nextSizeMap[w.size] } : w)),
    );
  };

  const moveWidget = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localWidgets.length) return;

    const copy = [...localWidgets];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setLocalWidgets(copy);
  };

  const handleApply = () => {
    onSaveWidgets(localWidgets);
    toast.success("Dashboard layout updated successfully!");
    onOpenChange(false);
  };

  const handleReset = () => {
    onResetDefaults();
    toast.info("Dashboard restored to default layout.");
    onOpenChange(false);
  };

  return (
    <DialogContent className="flex max-h-[min(85dvh,48rem)] w-[calc(100%-1rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-surface p-0 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none">
      <DialogHeader className="border-b border-border px-3 pb-3 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden size-9 shrink-0 rounded-lg bg-primary/10 text-primary sm:flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-left text-base font-semibold sm:text-lg">
                Customize Dashboard Layout
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-left text-xs text-muted-foreground">
                Drag items to reorder, adjust card widths, or hide widgets you don't use.
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </Button>
        </div>
      </DialogHeader>

      {/* Scrollable drag & drop list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6">
        <Reorder.Group
          axis="y"
          values={localWidgets}
          onReorder={setLocalWidgets}
          className="space-y-2.5"
        >
          {localWidgets.map((widget, index) => (
            <ReorderWidget key={widget.id} widget={widget}>
              <div
                className={`grid min-w-0 items-center gap-2 rounded-control border p-2.5 transition-colors sm:flex sm:justify-between sm:p-3 ${
                  widget.visible
                    ? "bg-card border-border shadow-xs hover:border-primary/40"
                    : "bg-muted/40 border-border/50 opacity-60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {/* Accessible Keyboard Reorder Buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveWidget(index, "up")}
                      className="grid size-7 place-items-center rounded-control text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-30"
                      aria-label={`Move ${widget.title} up`}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === localWidgets.length - 1}
                      onClick={() => moveWidget(index, "down")}
                      className="grid size-7 place-items-center rounded-control text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-30"
                      aria-label={`Move ${widget.title} down`}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium leading-snug text-foreground">
                        {widget.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="hidden px-1.5 py-0 text-[10px] font-normal uppercase sm:inline-flex"
                      >
                        {widget.category}
                      </Badge>
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground">
                      {widget.description}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2">
                  {/* Sizing toggle */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cycleSize(widget.id)}
                    className="h-8 px-2.5 text-xs font-normal capitalize gap-1.5"
                    title={`Current size: ${widget.size}. Click to cycle.`}
                  >
                    {widget.size === "compact" && (
                      <Columns className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    {widget.size === "medium" && (
                      <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    {widget.size === "full" && (
                      <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span>{widget.size}</span>
                  </Button>

                  {/* Visibility Toggle */}
                  <Button
                    type="button"
                    variant={widget.visible ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => toggleVisibility(widget.id)}
                    className="h-8 w-8 p-0"
                    aria-label={`${widget.visible ? "Hide" : "Show"} ${widget.title}`}
                  >
                    {widget.visible ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </ReorderWidget>
          ))}
        </Reorder.Group>
      </div>

      <DialogFooter className="flex flex-col gap-2 border-t border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="text-xs text-muted-foreground">
          Changes are saved to your current workspace preferences.
        </span>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} className="gap-1.5">
            <Check className="w-4 h-4" />
            Save Layout
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

function ReorderWidget({
  widget,
  children,
}: {
  widget: DashboardWidgetConfig;
  children: React.ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={widget}
      dragListener={false}
      dragControls={controls}
      className="flex min-w-0 items-center gap-1 [&>div:last-child]:flex-1"
    >
      <div
        onPointerDown={(event) => controls.start(event)}
        className="touch-none cursor-grab rounded-control p-1 text-muted-foreground active:cursor-grabbing"
        aria-hidden="true"
      >
        <GripVertical className="size-4" />
      </div>
      {children}
    </Reorder.Item>
  );
}
