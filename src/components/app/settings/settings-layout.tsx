import * as React from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Settings,
  Palette,
  Sparkles,
  Globe,
  Smartphone,
  Cpu,
  Keyboard,
  User,
  Database,
  Bot,
  Blocks,
  Terminal,
  Users,
  ShieldCheck,
  CreditCard,
  FileText,
  Sliders,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

interface SettingsLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

interface NavSection {
  group: string;
  items: {
    label: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
  }[];
}

const SETTINGS_NAV: NavSection[] = [
  {
    group: "Basics",
    items: [
      { label: "General", to: "/settings/general", icon: Sliders, exact: true },
      { label: "Appearance", to: "/settings/themes", icon: Palette, exact: true },
      { label: "Model settings", to: "/ai-studio", icon: Sparkles },
      { label: "Connected Apps", to: "/settings/connected-apps", icon: Globe },
      { label: "Remote devices", to: "/whatsapp", icon: Smartphone },
      { label: "Automations", to: "/automations", icon: Cpu },
      { label: "White Label", to: "/settings/white-label", icon: ShieldCheck },
    ],
  },
  {
    group: "Agent capabilities",
    items: [
      { label: "Personalization", to: "/profile", icon: User },
      { label: "Memory & Knowledge", to: "/knowledge", icon: Database },
      { label: "Subagents", to: "/chatbots", icon: Bot },
      { label: "Plugins", to: "/settings/plugins", icon: Blocks },
      { label: "MCP & Developer API", to: "/developer", icon: Terminal },
    ],
  },
  {
    group: "Platform & Security",
    items: [
      { label: "Team Members", to: "/settings/members", icon: Users },
      { label: "Security & Auth", to: "/settings/security", icon: ShieldCheck },
      { label: "Billing & Plans", to: "/settings/billing", icon: CreditCard },
      { label: "Audit Logs", to: "/admin/audit-logs", icon: FileText },
    ],
  },
];

export function SettingsLayout({ title, description, children, actions }: SettingsLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useMyProfile();

  const userName =
    profile?.display_name ||
    profile?.full_name ||
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user?.email?.split("@")[0] ||
    "White Creates";
  const userInitial = userName.slice(0, 1).toUpperCase();

  const isCurrent = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  return (
    <div className="flex flex-1 min-h-[calc(100vh-3rem)] bg-[#121212] text-[#ededed]">
      {/* Persistent Settings Sidebar matching Screenshot 3 */}
      <aside className="w-64 shrink-0 border-r border-[#222222] bg-[#161616] flex flex-col justify-between select-none">
        <div className="p-3 overflow-y-auto">
          {/* Back to workspace button */}
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#222222] transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to workspace</span>
          </button>

          {/* Nav Categories */}
          <div className="space-y-4">
            {SETTINGS_NAV.map((section) => (
              <div key={section.group} className="space-y-1">
                <div className="px-3 text-[11px] font-semibold text-[#666666] tracking-wider">
                  {section.group}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isCurrent(item.to, item.exact);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          active
                            ? "bg-[#282828] text-[#ffffff] font-semibold"
                            : "text-[#a3a3a3] hover:text-[#ededed] hover:bg-[#222222]",
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-accent" : "text-[#737373]")} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User bar at bottom left matching Screenshot 3 */}
        <div className="p-3 border-t border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-6 rounded-full bg-[#3ece90] text-black font-bold text-[11px] grid place-items-center shrink-0">
              {userInitial}
            </div>
            <span className="text-xs font-semibold text-[#ededed] truncate">{userName}</span>
          </div>
          <Link
            to="/settings/general"
            className="h-6 w-6 rounded grid place-items-center text-[#737373] hover:text-[#ededed] hover:bg-[#222222] transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Settings Content Panel matching Screenshot 3 */}
      <main className="flex-1 p-6 lg:p-10 max-w-4xl overflow-y-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-medium tracking-tight text-[#ededed]">{title}</h1>
            {description && <p className="text-xs text-[#888888] mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}

/**
 * SettingsCard — Elevated dark rounded surface with hairline dividers matching Screenshot 3
 */
export function SettingsCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] shadow-sm overflow-hidden",
        className,
      )}
    >
      {(title || description) && (
        <div className="px-5 py-4 border-b border-[#262626]">
          {title && <h2 className="text-sm font-semibold text-[#ededed]">{title}</h2>}
          {description && <p className="text-xs text-[#888888] mt-0.5">{description}</p>}
        </div>
      )}
      <div className="divide-y divide-[#262626]">{children}</div>
    </div>
  );
}

/**
 * SettingsRow — Single settings row with title, description, and right control matching Screenshot 3
 */
export function SettingsRow({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between p-4 sm:p-5 gap-4", className)}>
      <div className="space-y-0.5 min-w-0 flex-1">
        <p className="text-sm font-medium text-[#ededed]">{label}</p>
        {description && <p className="text-xs text-[#888888] leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0 flex items-center gap-2">{children}</div>
    </div>
  );
}
