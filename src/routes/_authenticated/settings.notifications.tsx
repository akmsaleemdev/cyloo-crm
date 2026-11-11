import { createFileRoute } from "@tanstack/react-router";
import { SettingsLayout, SettingsCard, SettingsRow } from "@/components/app/settings/settings-layout";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  component: NotificationSettings,
  head: () => ({
    meta: [
      { title: "Notifications — Account Settings" },
      {
        name: "description",
        content: "Choose which product and workspace events send you a notification.",
      },
      { property: "og:title", content: "Notifications — Account Settings" },
      {
        property: "og:description",
        content: "Choose which product and workspace events send you a notification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function NotificationSettings() {
  return (
    <SettingsLayout
      title="Notifications"
      description="Choose which product and workspace events send you notifications."
    >
      <SettingsCard title="Alert Channels & Triggers">
        <SettingsRow
          label="New inbound message"
          description="Receive immediate alerts when new leads or customers reach out across any channel."
        >
          <Checkbox defaultChecked />
        </SettingsRow>
        <SettingsRow
          label="Automation errors"
          description="Alert me if an automation workflow, webhook trigger, or sync job fails."
        >
          <Checkbox defaultChecked />
        </SettingsRow>
        <SettingsRow
          label="Weekly performance digest"
          description="Receive a weekly recap of pipeline health, deal progression, and team activity."
        >
          <Checkbox defaultChecked />
        </SettingsRow>
      </SettingsCard>
    </SettingsLayout>
  );
}
