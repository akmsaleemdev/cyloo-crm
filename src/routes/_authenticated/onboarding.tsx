import { lazy, Suspense, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Circle } from "lucide-react";
import { AppTopbar } from "@/components/app/app-topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentWorkspace, type WorkspaceRow } from "@/hooks/use-workspace";
import {
  finishWorkspaceOnboarding,
  getWorkspaceOnboarding,
  saveOnboardingProfile,
} from "@/lib/tenant/workspace-onboarding.functions";
import {
  canFinishOnboarding,
  nextOnboardingStep,
  onboardingSteps,
  type OnboardingStep,
} from "@/lib/tenant/workspace-onboarding";

const PipelineManager = lazy(() =>
  import("@/components/app/deals/pipeline-manager").then((module) => ({
    default: module.PipelineManager,
  })),
);

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Workspace Setup — CYLOO" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const workspace = useCurrentWorkspace();
  return (
    <>
      <AppTopbar title="Workspace setup" />
      <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        {workspace.isPending && <Skeleton className="h-40 w-full" />}
        {workspace.isError && <p role="alert">Unable to load your workspace.</p>}
        {workspace.isSuccess && !workspace.active && (
          <p role="status">Select a workspace to start setup.</p>
        )}
        {workspace.active && <Setup key={workspace.active.id} workspace={workspace.active} />}
      </main>
    </>
  );
}

function Setup({ workspace }: { workspace: WorkspaceRow }) {
  const queryClient = useQueryClient();
  const getProgress = useServerFn(getWorkspaceOnboarding);
  const saveProfile = useServerFn(saveOnboardingProfile);
  const finish = useServerFn(finishWorkspaceOnboarding);
  const workspaceId = workspace.id;
  const queryKey = ["workspace", workspaceId, "onboarding"] as const;
  const status = useQuery({
    queryKey,
    queryFn: () => getProgress({ data: { workspaceId } }),
    staleTime: 0,
  });
  const [selected, setSelected] = useState<OnboardingStep | "review" | null>(null);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const save = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      saveProfile({ data: { ...data, workspaceId } }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
      ]);
      setSelected("pipeline");
    },
  });
  const complete = useMutation({
    mutationFn: () => finish({ data: { workspaceId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (status.isPending) return <Skeleton className="h-72 w-full" />;
  if (status.isError)
    return (
      <div className="space-y-3" role="alert">
        <p>Unable to load setup progress.</p>
        <Button variant="outline" onClick={() => void status.refetch()}>
          Retry
        </Button>
      </div>
    );
  if (!status.data)
    return <p role="status">Workspace setup is available to active owners and admins.</p>;

  const { progress, finishedAt } = status.data;
  const step = selected ?? (finishedAt ? "review" : nextOnboardingStep(progress));
  const index = onboardingSteps.findIndex(({ id }) => id === step);
  const next = () => setSelected(onboardingSteps[index + 1]?.id ?? "review");
  const current = onboardingSteps[index];
  const done = onboardingSteps.filter(({ id }) => progress[id]).length;

  return (
    <>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl font-semibold">Set up {workspace.name}</h2>
          {finishedAt && <Badge variant="secondary">Setup complete</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Configure your workspace and sales pipeline, then bring your team and records into Cyloo.
        </p>
        <p className="text-sm font-medium" aria-live="polite">
          {done} of {onboardingSteps.length} steps done
        </p>
      </header>

      <div className="grid items-start gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Workspace setup steps" className="rounded-control border bg-surface p-2">
          <ol className="space-y-1">
            {onboardingSteps.map(({ id, label, required }) => (
              <li key={id}>
                <Button
                  className="h-auto min-h-11 w-full justify-start text-left"
                  variant={step === id ? "secondary" : "ghost"}
                  aria-current={step === id ? "step" : undefined}
                  onClick={() => setSelected(id)}
                >
                  {progress[id] ? (
                    <Check className="size-4 text-primary" aria-label="Done" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1 whitespace-normal">{label}</span>
                  {!required && !progress[id] && (
                    <span className="text-xs text-muted-foreground">Optional</span>
                  )}
                </Button>
              </li>
            ))}
            <li>
              <Button
                className="min-h-11 w-full justify-start"
                variant={step === "review" ? "secondary" : "ghost"}
                aria-current={step === "review" ? "step" : undefined}
                onClick={() => setSelected("review")}
              >
                Review setup
              </Button>
            </li>
          </ol>
        </nav>

        <Card>
          <CardHeader>
            <CardTitle>{current?.label ?? "Review setup"}</CardTitle>
            <CardDescription>{descriptions[step]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === "profile" && (
              <ProfileForm
                workspace={workspace}
                pending={save.isPending}
                error={save.error?.message}
                onSave={(data) => save.mutate(data)}
              />
            )}
            {step === "pipeline" && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setPipelineOpen(true)}>Open pipeline manager</Button>
                <Button variant="outline" asChild>
                  <Link to="/deals">View sales pipeline</Link>
                </Button>
              </div>
            )}
            {step === "team" && (
              <Button asChild>
                <Link to="/settings/members">Invite teammates</Link>
              </Button>
            )}
            {step === "records" && (
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/contacts">Open contacts to import</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/leads">Open leads</Link>
                </Button>
              </div>
            )}
            {step === "channels" && (
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/api-config/$section" params={{ section: "email" }}>
                    Set up email
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/api-config/$section" params={{ section: "whatsapp" }}>
                    Set up WhatsApp
                  </Link>
                </Button>
              </div>
            )}
            {step === "review" && (
              <div className="space-y-3">
                {!finishedAt && !canFinishOnboarding(progress) && (
                  <p role="status" className="text-sm text-muted-foreground">
                    Save the workspace profile and configure a sales pipeline before finishing.
                  </p>
                )}
                {complete.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    {complete.error.message}
                  </p>
                )}
                {finishedAt ? (
                  <Button asChild>
                    <Link to="/dashboard">Go to dashboard</Link>
                  </Button>
                ) : (
                  <Button
                    disabled={!canFinishOnboarding(progress) || complete.isPending}
                    onClick={() => complete.mutate()}
                  >
                    Finish workspace setup
                  </Button>
                )}
              </div>
            )}
            {step !== "profile" && step !== "review" && (
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                <Button
                  variant="ghost"
                  onClick={() => void status.refetch()}
                  disabled={status.isFetching}
                >
                  Refresh progress
                </Button>
                <Button
                  variant="secondary"
                  onClick={next}
                  disabled={current?.required && !progress[step]}
                >
                  {progress[step] ? "Continue" : current?.required ? "Continue" : "Do this later"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {pipelineOpen && (
        <Suspense fallback={<p role="status">Loading pipeline manager…</p>}>
          <PipelineManager
            open
            onOpenChange={(open) => {
              setPipelineOpen(open);
              if (!open) void status.refetch();
            }}
          />
        </Suspense>
      )}
    </>
  );
}

const descriptions: Record<OnboardingStep | "review", string> = {
  profile: "Confirm the name and description your team will see.",
  pipeline:
    "Use a pipeline template or configure your own deal stages. An active stage completes this step.",
  team: "Invite teammates and assign their workspace roles. A current invitation or active teammate completes this step.",
  records: "Import contacts from a file or add your first lead using the existing CRM tools.",
  channels: "Connect email or WhatsApp to bring customer conversations into your workspace.",
  review: "Check your required steps. You can return to finish optional steps at any time.",
};

function ProfileForm({
  workspace,
  pending,
  error,
  onSave,
}: {
  workspace: WorkspaceRow;
  pending: boolean;
  error?: string;
  onSave: (data: { name: string; description: string }) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
    });
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="onboarding-workspace-name">Workspace name</Label>
        <Input
          id="onboarding-workspace-name"
          name="name"
          defaultValue={workspace.name}
          maxLength={80}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="onboarding-workspace-description">Description (optional)</Label>
        <Textarea
          id="onboarding-workspace-description"
          name="description"
          defaultValue={workspace.description ?? ""}
          maxLength={500}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}
