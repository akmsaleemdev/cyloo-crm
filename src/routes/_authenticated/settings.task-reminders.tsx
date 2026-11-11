import { createFileRoute } from "@tanstack/react-router";
import { SettingsLayout } from "@/components/app/settings/settings-layout";
import { TaskRemindersPanel } from "@/components/app/settings/task-reminders-panel";

export const Route = createFileRoute("/_authenticated/settings/task-reminders")({
  component: TaskRemindersSettings,
  head: () => ({
    meta: [
      { title: "Task Reminders — Account Settings" },
      { name: "description", content: "Configure reminder schedules and notifications for your team's tasks." },
      { property: "og:title", content: "Task Reminders — Account Settings" },
      { property: "og:description", content: "Configure reminder schedules and notifications for your team's tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function TaskRemindersSettings() {
  return (
    <SettingsLayout
      title="Task Reminders"
      description="Configure reminder schedules and notifications for your team's tasks."
    >
      <TaskRemindersPanel />
    </SettingsLayout>
  );
}
