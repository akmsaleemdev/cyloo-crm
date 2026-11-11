import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppTopbar } from "@/components/app/app-topbar";
import { SettingsLayout, SettingsCard, SettingsRow } from "@/components/app/settings/settings-layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getIdleMinutes, setIdleMinutes } from "@/hooks/use-idle-logout";
import { sbAny } from "@/lib/supabase/untyped";
import { useZonedDateFormatter } from "@/hooks/use-timezone";

export const Route = createFileRoute("/_authenticated/settings/security")({
  component: SecuritySettings,
  head: () => ({
    meta: [
      { title: "Security — Account Settings" },
      {
        name: "description",
        content: "Change your password, manage two-factor authentication, and active sessions.",
      },
    ],
  }),
});

const pwSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyFrom = (t: string) => sbAny(supabase).from(t as any) as any;

function useMy2FA() {
  return useQuery({
    queryKey: ["user_2fa", "me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await anyFrom("user_2fa")
        .select("enabled, method, verified_at")
        .eq("user_id", u.user.id)
        .maybeSingle();
      return (data ?? { enabled: false, method: "totp", verified_at: null }) as {
        enabled: boolean;
        method: string;
        verified_at: string | null;
      };
    },
  });
}

function useMySessions() {
  return useQuery({
    queryKey: ["sessions", "me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await anyFrom("sessions")
        .select(
          "id, device, user_agent, ip_address, location, last_seen_at, created_at, revoked_at",
        )
        .eq("user_id", u.user.id)
        .order("last_seen_at", { ascending: false });
      return (data ?? []) as Array<{
        id: string;
        device: string | null;
        user_agent: string | null;
        ip_address: string | null;
        location: string | null;
        last_seen_at: string;
        created_at: string;
        revoked_at: string | null;
      }>;
    },
  });
}

function SecuritySettings() {
  const qc = useQueryClient();
  const twofa = useMy2FA();
  const sessions = useMySessions();
  const formatZoned = useZonedDateFormatter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [idle, setIdle] = useState<number>(getIdleMinutes());
  const [signOutAll, setSignOutAll] = useState(false);

  useEffect(() => {
    setIdleMinutes(idle);
  }, [idle]);

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const parsed = pwSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      setPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggle2FA(next: boolean) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    try {
      const { error } = await anyFrom("user_2fa").upsert({
        user_id: u.user.id,
        enabled: next,
        method: "totp",
        verified_at: next ? new Date().toISOString() : null,
      });
      if (error) throw error;
      toast.success(next ? "Two-factor enabled" : "Two-factor disabled");
      qc.invalidateQueries({ queryKey: ["user_2fa", "me"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    }
  }

  async function revokeSession(id: string) {
    try {
      const { error } = await anyFrom("sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Session revoked");
      qc.invalidateQueries({ queryKey: ["sessions", "me"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Revoke failed");
    }
  }

  async function signOutEverywhere() {
    setSignOutAll(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      toast.success("Signed out on all devices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-out failed");
    } finally {
      setSignOutAll(false);
    }
  }

  return (
    <SettingsLayout
      title="Security & Authentication"
      description="Manage account credentials, two-factor authentication, session timeouts, and active devices."
    >
      <SettingsCard title="Password Credentials" description="Use at least 8 characters with a mix of letters and numbers.">
        <form onSubmit={onChangePassword} className="p-5 grid gap-3 max-w-md">
          <div className="grid gap-2">
            <Label htmlFor="pw" className="text-xs font-semibold text-[#ededed]">New password</Label>
            <Input
              id="pw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="bg-[#141414] border-[#2c2c2c] text-[#ededed]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pw2" className="text-xs font-semibold text-[#ededed]">Confirm password</Label>
            <Input
              id="pw2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
              className="bg-[#141414] border-[#2c2c2c] text-[#ededed]"
            />
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="w-fit bg-[#3ece90] text-black font-semibold hover:bg-[#35b57d] h-8 text-xs px-4 rounded-lg mt-2 shadow-sm"
          >
            {saving ? "Updating…" : "Update password"}
          </Button>
        </form>
      </SettingsCard>

      <SettingsCard title="Two-Factor Authentication & Inactivity" description="Enhanced protection matching enterprise security compliance standards.">
        <SettingsRow
          label="Require authenticator app (TOTP)"
          description="Prompt for a verification code from Google Authenticator, 1Password, or Authy on each login."
        >
          <Switch checked={twofa.data?.enabled ?? false} onCheckedChange={toggle2FA} />
        </SettingsRow>

        <SettingsRow
          label="Inactivity auto-signout (minutes)"
          description="Automatically terminate inactive sessions to protect confidential customer data."
        >
          <div className="flex items-center gap-2">
            <Input
              id="idle"
              type="number"
              min={5}
              max={480}
              value={idle}
              onChange={(e) => setIdle(Number(e.target.value) || 30)}
              className="w-24 bg-[#141414] border-[#2c2c2c] text-[#ededed] h-8 text-xs text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={signOutEverywhere}
              disabled={signOutAll}
              className="border-[#333333] hover:bg-[#222222] text-xs h-8 text-rose-400"
            >
              {signOutAll ? "Signing out…" : "Sign out all devices"}
            </Button>
          </div>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard
        title="Active Sessions"
        description="Devices and locations currently signed in to your account."
      >
        <div className="p-5">
          {sessions.isLoading ? (
            <p className="text-xs text-muted-foreground animate-pulse">Loading sessions…</p>
          ) : (sessions.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No sessions tracked.</p>
          ) : (
            <ul className="divide-y divide-[#262626]">
              {sessions.data!.map((s: any) => (
                <li key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-[#ededed]">{s.device ?? s.user_agent ?? "Browser Session"}</span>
                    <p className="text-[11px] text-[#737373]">
                      {s.location ?? s.ip_address ?? "Local Network"} · Last seen{" "}
                      {formatZoned(new Date(s.last_seen_at), {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                      {s.revoked_at && <span className="ml-2 text-rose-400">(Revoked)</span>}
                    </p>
                  </div>
                  {!s.revoked_at && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-400 hover:text-rose-300 hover:bg-[#252525] h-7 text-xs"
                      onClick={() => revokeSession(s.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
