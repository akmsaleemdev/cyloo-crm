import React from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Check,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Columns,
  Maximize2,
} from "lucide-react";
import {
  Dialog,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Customize Dashboard Layout
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
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
        <div className="flex-1 overflow-y-auto p-6 py-4 space-y-2.5">
          <Reorder.Group
            axis="y"
            values={localWidgets}
            onReorder={setLocalWidgets}
            className="space-y-2.5"
          >
            {localWidgets.map((widget, index) => (
              <Reorder.Item key={widget.id} value={widget} className="select-none touch-none">
                <div
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    widget.visible
                      ? "bg-card border-border shadow-xs hover:border-primary/40"
                      : "bg-muted/40 border-border/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-1 rounded-md hover:bg-muted"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Accessible Keyboard Reorder Buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveWidget(index, "up")}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                        aria-label={`Move ${widget.title} up`}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === localWidgets.length - 1}
                        onClick={() => moveWidget(index, "down")}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                        aria-label={`Move ${widget.title} down`}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {widget.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase py-0 px-1.5 font-normal"
                        >
                          {widget.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {widget.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
                      aria-label={widget.visible ? "Hide widget" : "Show widget"}
                    >
                      {widget.visible ? (
                        <Eye className="w-4 h-4 text-primary" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        <DialogFooter className="p-4 px-6 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Changes are saved to your current workspace preferences.
          </span>
          <div className="flex items-center gap-2">
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
    </Dialog>
  );
}
