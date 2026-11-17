export const onboardingSteps = [
  { id: "profile", label: "Workspace profile", required: true },
  { id: "pipeline", label: "Sales pipeline", required: true },
  { id: "team", label: "Invite your team", required: false },
  { id: "records", label: "Add CRM records", required: false },
  { id: "channels", label: "Connect a channel", required: false },
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number]["id"];
export type OnboardingProgress = Record<OnboardingStep, boolean>;

export function canFinishOnboarding(progress: OnboardingProgress): boolean {
  return onboardingSteps.every(({ id, required }) => !required || progress[id]);
}

export function nextOnboardingStep(progress: OnboardingProgress): OnboardingStep | "review" {
  return onboardingSteps.find(({ id }) => !progress[id])?.id ?? "review";
}

export function isOnboardingAdmin(membership: { role: string; status: string } | null): boolean {
  return membership?.status === "active" && ["owner", "admin"].includes(membership.role);
}
