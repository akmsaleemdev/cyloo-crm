import { describe, expect, it } from "vitest";
import {
  canFinishOnboarding,
  isOnboardingAdmin,
  nextOnboardingStep,
  type OnboardingProgress,
} from "@/lib/tenant/workspace-onboarding";

const empty: OnboardingProgress = {
  profile: false,
  pipeline: false,
  team: false,
  records: false,
  channels: false,
};

describe("workspace onboarding", () => {
  it("requires a confirmed profile and usable pipeline before completion", () => {
    expect(canFinishOnboarding(empty)).toBe(false);
    expect(canFinishOnboarding({ ...empty, profile: true })).toBe(false);
    expect(canFinishOnboarding({ ...empty, pipeline: true })).toBe(false);
    expect(canFinishOnboarding({ ...empty, profile: true, pipeline: true })).toBe(true);
  });

  it("resumes at the first unfinished step and offers review after all five", () => {
    expect(nextOnboardingStep(empty)).toBe("profile");
    expect(nextOnboardingStep({ ...empty, profile: true })).toBe("pipeline");
    expect(nextOnboardingStep({ ...empty, profile: true, pipeline: true, team: true })).toBe(
      "records",
    );
    expect(
      nextOnboardingStep({
        profile: true,
        pipeline: true,
        team: true,
        records: true,
        channels: true,
      }),
    ).toBe("review");
  });

  it("limits setup to active workspace owners and admins", () => {
    expect(isOnboardingAdmin({ role: "owner", status: "active" })).toBe(true);
    expect(isOnboardingAdmin({ role: "admin", status: "active" })).toBe(true);
    expect(isOnboardingAdmin({ role: "admin", status: "suspended" })).toBe(false);
    expect(isOnboardingAdmin({ role: "manager", status: "active" })).toBe(false);
    expect(isOnboardingAdmin(null)).toBe(false);
  });
});
