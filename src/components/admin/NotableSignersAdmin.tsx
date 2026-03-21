"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

interface NotableSigner {
  steamId: string;
  label: string;
  role: string;
  avatarOverride?: string | null;
}

const ROLE_OPTIONS = [
  "Pro Player",
  "Organization",
  "Streamer",
  "Youtuber",
  "Community Figure",
];

export function NotableSignersAdmin({
  initialSigners,
}: {
  initialSigners: NotableSigner[];
}) {
  const [signers, setSigners] = useState<NotableSigner[]>(initialSigners);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addSigner() {
    setSigners((prev) => [
      ...prev,
      { steamId: "", label: "", role: "Pro Player", avatarOverride: null },
    ]);
  }

  function removeSigner(index: number) {
    setSigners((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSigner(index: number, field: keyof NotableSigner, value: string) {
    setSigners((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: value || null } : s
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const filtered = signers.filter((s) => s.steamId && s.label);
      await fetch("/api/notable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signers: filtered }),
      });
      setSigners(filtered);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add Steam64 IDs of notable players, orgs, or influencers. They&apos;ll
        be displayed on the petition page with their role badge.
      </p>

      {signers.map((signer, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <Input
            value={signer.steamId}
            onChange={(e) => updateSigner(i, "steamId", e.target.value)}
            placeholder="Steam64 ID"
            className="bg-muted/30 border-border w-48 font-mono text-xs"
          />
          <Input
            value={signer.label}
            onChange={(e) => updateSigner(i, "label", e.target.value)}
            placeholder="Display name"
            className="bg-muted/30 border-border w-36 text-sm"
          />
          <select
            value={signer.role}
            onChange={(e) => updateSigner(i, "role", e.target.value)}
            className="h-8 px-2 rounded-md border border-border bg-muted/30 text-xs text-foreground"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="flex-1 min-w-[120px]">
            <ImageUpload
              value={signer.avatarOverride || ""}
              onChange={(url) => updateSigner(i, "avatarOverride", url)}
              compact
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeSigner(i)}
            className="text-cs-red hover:bg-cs-red/10 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={addSigner}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Notable Signer
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-cs-orange hover:bg-cs-orange-light text-background text-xs"
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>
    </div>
  );
}
