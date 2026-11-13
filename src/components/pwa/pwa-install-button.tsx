import { useEffect, useState } from "react";
import { Download, Share2, PlusSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  isStandalone,
  detectPlatform,
  INSTALL_PROMPT_EVENT,
  INSTALLED_EVENT,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/install";
import { cn } from "@/lib/utils";

interface PwaInstallButtonProps {
  className?: string;
  variant?: "topbar" | "landing";
}

export function PwaInstallButton({ className, variant = "topbar" }: PwaInstallButtonProps) {
  const [canInstall, setCanInstall] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [hasPulsed, setHasPulsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const platform = detectPlatform();
    if (platform === "ios") {
      setIsIos(true);
      setCanInstall(true);
      return;
    }

    // Check if prompt was already captured
    if (window.__cylooInstallPrompt) {
      setPromptEvent(window.__cylooInstallPrompt);
      setCanInstall(true);
    }

    const handlePrompt = () => {
      if (window.__cylooInstallPrompt) {
        setPromptEvent(window.__cylooInstallPrompt);
        setCanInstall(true);
      }
    };

    const handleInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      setPromptEvent(null);
    };

    window.addEventListener(INSTALL_PROMPT_EVENT, handlePrompt);
    window.addEventListener(INSTALLED_EVENT, handleInstalled);

    return () => {
      window.removeEventListener(INSTALL_PROMPT_EVENT, handlePrompt);
      window.removeEventListener(INSTALLED_EVENT, handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (canInstall && !hasPulsed) {
      const timer = setTimeout(() => setHasPulsed(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, hasPulsed]);

  if (installed || !canInstall) {
    return null;
  }

  // iOS Safari requires manual "Share -> Add to Home Screen" instructions
  if (isIos) {
    return (
      <Popover>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Install app"
                  className={cn(
                    "relative grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-all duration-200",
                    "hover:bg-surface-elevated hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    !hasPulsed && "animate-pulse",
                    className,
                  )}
                >
                  <Download className="h-4 w-4" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Install app
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <PopoverContent
          side="bottom"
          align="end"
          className="w-72 p-4 text-sm glass-dropdown border-border/60 bg-popover/90 backdrop-blur-xl"
        >
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-foreground">Install CYLOO App</h4>
            <p className="text-xs text-muted-foreground">
              To install on your iOS device, tap the Safari share icon and select &ldquo;Add to Home
              Screen&rdquo;.
            </p>
            <div className="flex flex-col gap-2 rounded-lg bg-surface/60 p-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                <span>1. Tap Share in Safari toolbar</span>
              </div>
              <div className="flex items-center gap-2">
                <PlusSquare className="h-4 w-4 text-primary" />
                <span>2. Select &ldquo;Add to Home Screen&rdquo;</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Standard PWA install prompt handler
  const handleInstallClick = async () => {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setCanInstall(false);
      }
    } catch {
      // Prompt dismissed or failed
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleInstallClick}
            aria-label="Install app"
            className={cn(
              "relative grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-all duration-200",
              "hover:bg-surface-elevated hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring active:scale-95",
              !hasPulsed && "animate-pulse",
              className,
            )}
          >
            <Download className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Install app
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
