import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { sbAny } from "@/lib/supabase/untyped";
import {
  canFinishOnboarding,
  isOnboardingAdmin,
  type OnboardingProgress,
} from "./workspace-onboarding";

const workspaceInput = z.object({ workspaceId: z.string().uuid() });
const profileInput = workspaceInput.extend({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500),
});
const profileKey = "crm_onboarding_profile";
const finishedKey = "crm_onboarding_finished";
type Client = SupabaseClient<Database>;

export type WorkspaceOnboarding = {
  progress: OnboardingProgress;
  finishedAt: string | null;
};

async function workspaceAdmin(client: Client, workspaceId: string, userId: string) {
  const db = sbAny(client);
  const { data, error } = await db
    .from("workspace_members")
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Could not check workspace access.");
  if (!isOnboardingAdmin(data)) return false;
  const workspace = await db
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .is("archived_at", null)
    .maybeSingle();
  if (workspace.error) throw new Error("Could not check workspace status.");
  return Boolean(workspace.data);
}

async function requireWorkspaceAdmin(client: Client, workspaceId: string, userId: string) {
  if (!(await workspaceAdmin(client, workspaceId, userId))) {
    throw new Error("Workspace setup is available to active workspace owners and admins.");
  }
}

function onboardingSettings(client: Client, workspaceId: string) {
  return sbAny(client)
    .from("settings")
    .select("key,value")
    .eq("scope", "workspace")
    .eq("workspace_id", workspaceId)
    .is("organization_id", null)
    .is("user_id", null);
}

async function writeOnboardingSetting(
  client: Client,
  workspaceId: string,
  key: string,
  value: string | boolean,
) {
  const { error } = await sbAny(client).from("settings").upsert(
    {
      scope: "workspace",
      workspace_id: workspaceId,
      organization_id: null,
      user_id: null,
      key,
      value,
    },
    { onConflict: "scope,organization_id,workspace_id,user_id,key", ignoreDuplicates: true },
  );
  if (error) throw new Error("Could not save onboarding progress. Try again.");
}

function pipelineStep(client: Client, workspaceId: string) {
  return sbAny(client)
    .from("deal_pipelines")
    .select("id,deal_stages!inner(id)")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .eq("deal_stages.workspace_id", workspaceId)
    .eq("deal_stages.is_active", true)
    .limit(1);
}

export const getWorkspaceOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((value: unknown) => workspaceInput.parse(value))
  .handler(async ({ data: { workspaceId }, context }): Promise<WorkspaceOnboarding | null> => {
    const { supabase, userId } = context;
    if (!(await workspaceAdmin(supabase, workspaceId, userId))) return null;
    const db = sbAny(supabase);
    const [settings, pipeline, teammate, invite, contact, lead, email, messaging] =
      await Promise.all([
        onboardingSettings(supabase, workspaceId).in("key", [profileKey, finishedKey]),
        pipelineStep(supabase, workspaceId),
        db
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", workspaceId)
          .eq("status", "active")
          .neq("user_id", userId)
          .limit(1),
        db
          .from("workspace_invitations")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .limit(1),
        db
          .from("contacts")
          .select("id")
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .limit(1),
        db
          .from("leads")
          .select("id")
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .limit(1),
        db
          .from("email_accounts")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("status", "connected")
          .limit(1),
        db
          .from("channel_accounts")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("status", "connected")
          .limit(1),
      ]);
    if (
      [settings, pipeline, teammate, invite, contact, lead, email, messaging].some(
        (result) => result.error,
      )
    ) {
      throw new Error("Could not load workspace setup progress. Try again.");
    }
    const rows = (settings.data ?? []) as { key: string; value: unknown }[];
    const finished = rows.find(({ key }) => key === finishedKey)?.value;
    return {
      progress: {
        profile: rows.some(({ key, value }) => key === profileKey && value === true),
        pipeline: Boolean(pipeline.data?.length),
        team: Boolean(teammate.data?.length || invite.data?.length),
        records: Boolean(contact.data?.length || lead.data?.length),
        channels: Boolean(email.data?.length || messaging.data?.length),
      },
      finishedAt: typeof finished === "string" ? finished : null,
    };
  });

export const saveOnboardingProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value: unknown) => profileInput.parse(value))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await requireWorkspaceAdmin(supabase, data.workspaceId, userId);
    const { data: updated, error } = await sbAny(supabase)
      .from("workspaces")
      .update({ name: data.name, description: data.description || null })
      .eq("id", data.workspaceId)
      .is("archived_at", null)
      .select("id")
      .maybeSingle();
    if (error || !updated) throw new Error("Could not update the workspace profile.");
    await writeOnboardingSetting(supabase, data.workspaceId, profileKey, true);
  });

export const finishWorkspaceOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value: unknown) => workspaceInput.parse(value))
  .handler(async ({ context, data: { workspaceId } }) => {
    const { supabase, userId } = context;
    await requireWorkspaceAdmin(supabase, workspaceId, userId);
    const [settings, pipeline] = await Promise.all([
      onboardingSettings(supabase, workspaceId).in("key", [profileKey, finishedKey]),
      pipelineStep(supabase, workspaceId),
    ]);
    if (settings.error || pipeline.error) throw new Error("Could not verify required steps.");
    const rows = (settings.data ?? []) as { key: string; value: unknown }[];
    if (rows.some(({ key, value }) => key === finishedKey && typeof value === "string")) return;
    if (
      !canFinishOnboarding({
        profile: rows.some(({ key, value }) => key === profileKey && value === true),
        pipeline: Boolean(pipeline.data?.length),
        team: false,
        records: false,
        channels: false,
      })
    ) {
      throw new Error(
        "Save the workspace profile and configure a sales pipeline before finishing.",
      );
    }
    await writeOnboardingSetting(supabase, workspaceId, finishedKey, new Date().toISOString());
  });
