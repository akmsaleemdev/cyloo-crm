import {
  Plus,
  MessagesSquare,
  Users,
  Target,
  Handshake,
  CheckSquare,
  FileText,
  Send,
  Zap,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

export function QuickActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" aria-label="Create">
          <Plus className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline font-medium text-xs">Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Quick create
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to="/leads" search={{ create: true }} className="gap-2 cursor-pointer">
            <Target className="h-4 w-4 text-primary" /> New lead
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/contacts" search={{ create: true }} className="gap-2 cursor-pointer">
            <Users className="h-4 w-4 text-primary" /> New contact
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/deals" search={{ create: true }} className="gap-2 cursor-pointer">
            <Handshake className="h-4 w-4 text-primary" /> New deal
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/tasks"
            search={{ create: true, taskId: undefined }}
            className="gap-2 cursor-pointer"
          >
            <CheckSquare className="h-4 w-4 text-primary" /> New task
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/contracts" className="gap-2 cursor-pointer">
            <FileText className="h-4 w-4 text-primary" /> New contract
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/inbox" className="gap-2 cursor-pointer">
            <MessagesSquare className="h-4 w-4 text-emerald-500" /> New conversation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/campaigns" className="gap-2 cursor-pointer">
            <Send className="h-4 w-4 text-emerald-500" /> New campaign
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/automations" className="gap-2 cursor-pointer">
            <Zap className="h-4 w-4 text-emerald-500" /> New automation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/ai-studio" className="gap-2 cursor-pointer">
            <Sparkles className="h-4 w-4 text-accent" /> Ask AI Studio
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
