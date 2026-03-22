"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Save, Loader2, X } from "lucide-react";

interface ProfileBioProps {
  userId: string;
  bio: string | null;
  isOwner: boolean;
}

export function ProfileBio({ userId, bio, isOwner }: ProfileBioProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(bio || "");
  const [saving, setSaving] = useState(false);
  const [currentBio, setCurrentBio] = useState(bio);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: value }),
      });
      if (res.ok) {
        setCurrentBio(value || null);
        setEditing(false);
      }
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write something about yourself..."
          maxLength={500}
          rows={3}
          className="bg-muted/30 border-border resize-none text-sm"
        />
        <div className="flex gap-2">
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
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setValue(currentBio || "");
            }}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {value.length}/500 characters
        </p>
      </div>
    );
  }

  return (
    <div>
      {currentBio ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {currentBio}
        </p>
      ) : isOwner ? (
        <p className="text-sm text-muted-foreground/50 italic">
          No bio yet. Click edit to add one.
        </p>
      ) : null}
      {isOwner && (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cs-orange transition-colors mt-2"
        >
          <Edit3 className="h-3 w-3" />
          {currentBio ? "Edit bio" : "Add bio"}
        </button>
      )}
    </div>
  );
}
