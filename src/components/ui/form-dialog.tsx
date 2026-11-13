import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Opt-in layout for long CRM forms. Only the body scrolls; Radix owns focus and dismissal. */
export function FormDialogContent({
  open,
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { open: boolean }) {
  const reduceMotion = useReducedMotion();
  const opener = React.useRef<HTMLElement | null>(null);
  const transition = { duration: reduceMotion ? 0 : 0.18 };

  return (
    <DialogPortal forceMount>
      <AnimatePresence>
        {open && (
          <React.Fragment key="form-dialog">
            <DialogPrimitive.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              {...props}
              forceMount
              asChild
              onOpenAutoFocus={(event) => {
                opener.current = document.activeElement as HTMLElement | null;
                props.onOpenAutoFocus?.(event);
              }}
              onCloseAutoFocus={(event) => {
                props.onCloseAutoFocus?.(event);
                if (!event.defaultPrevented && opener.current?.isConnected) {
                  event.preventDefault();
                  opener.current.focus();
                }
              }}
            >
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 flex min-h-0 w-[min(calc(100%_-_32px),768px)] max-h-[calc(100dvh_-_32px)] min-w-0 -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded border bg-background text-foreground elevation-3",
                  className,
                )}
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.97 }}
                transition={transition}
              >
                {children}
                <DialogPrimitive.Close className="control-focus absolute right-3 top-3 flex size-8 items-center justify-center rounded-control text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              </motion.div>
            </DialogPrimitive.Content>
          </React.Fragment>
        )}
      </AnimatePresence>
    </DialogPortal>
  );
}

export function FormDialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 [scrollbar-gutter:stable] sm:px-6",
        className,
      )}
      {...props}
    />
  );
}
