import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Upload, X } from "lucide-react";

import { AppTopbar } from "@/components/app/app-topbar";
import {
  SettingsLayout,
  SettingsCard,
  SettingsRow,
} from "@/components/app/settings/settings-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_RELEASE_CHANNEL, APP_VERSION_LABEL } from "@/lib/app-version";
import { docsUrl } from "@/lib/docs/links";
import { SHOW_RESOURCE_LINKS } from "@/lib/docs/visibility";
import { useCurrentWorkspace, useUpdateWorkspace, useWorkspaceRole } from "@/hooks/use-workspace";
import { useBrandName } from "@/hooks/use-brand-name";
import { supabase } from "@/integrations/supabase/client";
import {
  validateBrandingFile,
  uploadBrandingAsset,
  isBrandingAssetUrl,
  removeBrandingAsset,
  BRANDING_ACCEPT,
} from "@/lib/branding/upload";

export const Route = createFileRoute("/_authenticated/settings/general")({
  component: GeneralSettings,
  head: () => ({
    meta: [
      { title: "General Settings — Workspace" },
      {
        name: "description",
        content: "Manage workspace name, description, avatar, and notification preferences.",
      },
    ],
  }),
});

function GeneralSettings() {
  const brandName = useBrandName();
  const { data: ws } = useCurrentWorkspace();
  const { data: role } = useWorkspaceRole(ws?.id);
  const canEdit = role === "owner" || role === "admin";
  const update = useUpdateWorkspace(ws?.id);
  const orgId = ws?.organization_id ?? null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!ws) return;
    setName(ws.name ?? "");
    setDescription(ws.description ?? "");
    setAvatarUrl(ws.avatar_url ?? "");
    setNotifications(ws.notifications_enabled);
  }, [ws]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!ws) return;
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }
    try {
      await update.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        notifications_enabled: notifications,
      });
      toast.success("Workspace saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <SettingsLayout
      title="General Settings"
      description="Manage workspace identity, visual branding, and communication preferences."
      actions={
        <Button
          type="button"
          onClick={onSave}
          disabled={!canEdit || update.isPending}
          className="bg-[#3ece90] text-black font-semibold hover:bg-[#35b57d] h-8 text-xs px-4 rounded-lg shadow-sm"
        >
          {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
          Save changes
        </Button>
      }
    >
      <SettingsCard
        title="Workspace Identity"
        description="Core naming and visual representation of your tenant workspace."
      >
        <form onSubmit={onSave} className="p-5 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs font-semibold text-[#ededed]">
              Workspace name
            </Label>
            <Input
              id="name"
              value={name}
              disabled={!canEdit}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              className="bg-[#141414] border-[#2c2c2c] text-[#ededed]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug" className="text-xs font-semibold text-[#ededed]">
              Slug
            </Label>
            <Input
              id="slug"
              value={ws?.slug ?? ""}
              disabled
              className="bg-[#141414] border-[#2c2c2c] text-muted-foreground"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc" className="text-xs font-semibold text-[#ededed]">
              Description
            </Label>
            <Textarea
              id="desc"
              value={description}
              disabled={!canEdit}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="bg-[#141414] border-[#2c2c2c] text-[#ededed]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avatar" className="text-xs font-semibold text-[#ededed]">
              Logo
            </Label>
            <WorkspaceLogoUpload
              logoUrl={avatarUrl}
              orgId={orgId}
              disabled={!canEdit}
              onChange={setAvatarUrl}
            />
          </div>
        </form>
      </SettingsCard>

      <SettingsCard
        title="Preferences"
        description="Control notifications and alert behaviors for your team."
      >
        <SettingsRow
          label="Workspace notifications"
          description="Send activity emails and team announcements to workspace members."
        >
          <Switch
            id="notif"
            checked={notifications}
            disabled={!canEdit}
            onCheckedChange={setNotifications}
          />
        </SettingsRow>
      </SettingsCard>

      <SettingsCard
        title={`About ${brandName}`}
        description="Release and environment information for this installation."
      >
        <SettingsRow label="Version" description="Current production release channel">
          <Badge variant="secondary" className="bg-[#242424] text-[#ededed] border-[#333333]">
            {APP_VERSION_LABEL} · {APP_RELEASE_CHANNEL}
          </Badge>
        </SettingsRow>
        <SettingsRow label="Product" description="Enterprise Omnichannel CRM">
          <span className="text-xs font-semibold text-[#ededed]">{brandName}</span>
        </SettingsRow>
      </SettingsCard>
    </SettingsLayout>
  );
}

/**
 * Workspace logo upload. Workspace-level branding assets reuse the `org`
 * storage scope keyed by the workspace's parent organization — there is no
 * separate "workspace" scope in the branding bucket. Workspaces that predate
 * org linkage (organization_id === null) have nowhere to scope an upload, so
 * the control falls back to URL-only in that case.
 */
function WorkspaceLogoUpload({
  logoUrl,
  orgId,
  disabled,
  onChange,
}: {
  logoUrl: string;
  orgId: string | null;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(!orgId);
  const canUpload = !!orgId;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !orgId) return;
    const invalid = validateBrandingFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setUploading(true);
    try {
      const prevUrl = logoUrl;
      const url = await uploadBrandingAsset(file, { kind: "org", orgId }, "workspace-logo");
      onChange(url);
      if (isBrandingAssetUrl(prevUrl) && prevUrl !== url) {
        void removeBrandingAsset(prevUrl);
      }
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    const prevUrl = logoUrl;
    onChange("");
    if (isBrandingAssetUrl(prevUrl)) {
      void removeBrandingAsset(prevUrl);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-control bg-muted grid place-items-center overflow-hidden shrink-0 border">
          {logoUrl ? (
            <img src={logoUrl} alt="Workspace logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || uploading || !canUpload}
              title={
                canUpload ? undefined : "This workspace has no organization to scope the upload to"
              }
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1.5" />
              )}
              {uploading ? "Uploading" : "Upload"}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || uploading}
              >
                <X className="w-3.5 h-3.5 mr-1.5" /> Remove
              </Button>
            )}
            {canUpload && (
              <button
                type="button"
                onClick={() => setShowUrlField((v) => !v)}
                disabled={disabled}
                className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
              >
                {showUrlField ? "Hide URL field" : "Paste URL instead"}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept={BRANDING_ACCEPT} hidden onChange={handleFile} />
          {showUrlField && (
            <Input
              type="url"
              value={logoUrl}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://"
            />
          )}
        </div>
      </div>
    </div>
  );
}
