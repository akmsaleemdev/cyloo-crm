import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowUp,
  Plus,
  Hand,
  Clock,
  Bug,
  Monitor,
  Moon,
  ChevronDown,
  Sparkles,
  Layers,
} from "lucide-react";
import { useCurrentWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

interface AIComposerHeroProps {
  className?: string;
  onCommandSubmit?: (prompt: string) => void;
}

export function AIComposerHero({ className, onCommandSubmit }: AIComposerHeroProps) {
  const navigate = useNavigate();
  const { active: activeWorkspace } = useCurrentWorkspace();
  const [prompt, setPrompt] = useState("");
  const [greeting, setGreeting] = useState("Morning, how can I help?");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Morning, how can I help?");
    else if (hour < 17) setGreeting("Afternoon, how can I help?");
    else setGreeting("Evening, how can I help?");
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    if (onCommandSubmit) {
      onCommandSubmit(prompt);
    } else {
      // Navigate to AI Studio with the prompt
      navigate({
        to: "/ai-studio",
        search: { q: prompt } as any,
      });
    }
    setPrompt("");
  };

  const handleChipClick = (text: string) => {
    setPrompt(text);
    navigate({
      to: "/ai-studio",
      search: { q: text } as any,
    });
  };

  return (
    <div className={cn("relative flex flex-col items-center justify-center py-8 lg:py-12 select-none", className)}>
      {/* Subtle watermark background outline matching Screenshot 1 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none"
      >
        <span className="font-display font-black text-[220px] tracking-tighter text-white">
          CYLOO
        </span>
      </div>

      {/* Main Greeting Headline matching Screenshot 1 & 2 */}
      <h1 className="relative z-10 text-2xl lg:text-3xl font-medium tracking-tight text-[#ededed] mb-6 text-center">
        {greeting}
      </h1>

      {/* Floating Composer Box */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-[#1e1e1e] border border-[#2d2d2d] shadow-2xl p-3.5 transition-all focus-within:border-[#404040] focus-within:ring-1 focus-within:ring-[#404040]/50">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          {/* Top Row: Project Picker */}
          <div className="flex items-center gap-1.5 text-xs text-[#a3a3a3]">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-[#282828] text-[#a3a3a3] hover:text-[#ededed] transition-colors"
            >
              <Layers className="h-3 w-3 text-muted-foreground" />
              <span>{activeWorkspace?.name ?? "Select project"}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>

          {/* Text Area */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={2}
            placeholder="Ask CYLOO anything, @ to add context, / for commands or capabilities"
            className="w-full bg-transparent resize-none border-none outline-none text-sm text-[#ededed] placeholder-[#737373] focus:ring-0 px-1 py-0.5 leading-relaxed"
          />

          {/* Bottom Toolbar matching Screenshot 1 */}
          <div className="flex items-center justify-between pt-1 border-t border-[#262626]/60">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="h-7 w-7 rounded-lg grid place-items-center text-[#888888] hover:text-[#ededed] hover:bg-[#282828] transition-colors"
                title="Add context or file"
              >
                <Plus className="h-4 w-4" />
              </button>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#252525] hover:bg-[#2d2d2d] text-xs text-[#b5b5b5] hover:text-[#ededed] transition-colors cursor-pointer border border-[#303030]">
                <Hand className="h-3.5 w-3.5 text-accent" />
                <span>Ask before changes</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate({ to: "/ai-studio" })}
                className="text-xs text-[#888888] hover:text-[#ededed] transition-colors font-medium"
              >
                Manage models
              </button>

              <button
                type="submit"
                disabled={!prompt.trim()}
                className={cn(
                  "h-7 w-7 rounded-full grid place-items-center transition-all shadow-sm",
                  prompt.trim()
                    ? "bg-[#ededed] text-black hover:bg-white cursor-pointer"
                    : "bg-[#333333] text-[#737373] cursor-not-allowed",
                )}
                title="Send query"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Quick Prompt Chips matching Screenshot 1 & 2 */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mt-4 max-w-2xl">
        <button
          type="button"
          onClick={() => handleChipClick("Generate this week's CRM performance and pipeline summary")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#383838] hover:bg-[#242424] text-xs text-[#b5b5b5] hover:text-[#ededed] transition-all shadow-sm"
        >
          <Clock className="h-3.5 w-3.5 text-accent" />
          <span>Weekly Summary</span>
        </button>

        <button
          type="button"
          onClick={() => handleChipClick("Audit open deals and flagged customer support tickets")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#383838] hover:bg-[#242424] text-xs text-[#b5b5b5] hover:text-[#ededed] transition-all shadow-sm"
        >
          <Bug className="h-3.5 w-3.5 text-rose-400" />
          <span>Error Fix</span>
        </button>

        <button
          type="button"
          onClick={() => handleChipClick("Create an executive presentation outline from CRM metrics")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#383838] hover:bg-[#242424] text-xs text-[#b5b5b5] hover:text-[#ededed] transition-all shadow-sm"
        >
          <Monitor className="h-3.5 w-3.5 text-sky-400" />
          <span>PPT Creation</span>
        </button>

        <button
          type="button"
          onClick={() => handleChipClick("Run background data enrichment and schedule follow-ups")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#383838] hover:bg-[#242424] text-xs text-[#b5b5b5] hover:text-[#ededed] transition-all shadow-sm"
        >
          <Moon className="h-3.5 w-3.5 text-amber-400" />
          <span>Idle-time task</span>
        </button>
      </div>
    </div>
  );
}
