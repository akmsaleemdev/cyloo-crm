import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { useAppStore } from "@/stores/appStore";
import type { WorkspaceRole } from "@/lib/roles";

/** Resolves the caller's role in the active workspace. */
export function useRole(): { role: WorkspaceRole | null; loading: boolean } {
  const { user } = useAuth();
  const userId = user?.id;
  const workspaceId = useAppStore((s) => s.activeWorkspace);
  const enabled = Boolean(userId && workspaceId);

  const query = useQuery({
    queryKey: ["workspace-role", userId, workspaceId],
    enabled,
    queryFn: async (): Promise<WorkspaceRole | null> => {
      if (!userId || !workspaceId) return null;
      const { data, error } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as WorkspaceRole | undefined) ?? null;
    },
  });

  return {
    role: enabled ? (query.data ?? null) : null,
    loading: enabled && query.isPending,
  };
}
