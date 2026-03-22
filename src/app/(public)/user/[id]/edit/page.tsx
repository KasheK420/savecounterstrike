"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Save, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function EditProfilePage() {
  const { user } = useSession();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [bio, setBio] = useState("");
  const [customName, setCustomName] = useState("");
  const [hidePlaytime, setHidePlaytime] = useState(false);
  const [hideFaceit, setHideFaceit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwner = user?.userId === id;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBio(data.bio || "");
          setCustomName(data.customName || "");
          setHidePlaytime(data.hidePlaytime || false);
          setHideFaceit(data.hideFaceit || false);
        }
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          customName: customName || null,
          hidePlaytime,
          hideFaceit,
        }),
      });
      if (res.ok) {
        router.push(`/user/${id}`);
      }
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  }

  if (!user || !isOwner) {
    return (
      <div className="min-h-screen py-16 text-center">
        <p className="text-muted-foreground">
          You can only edit your own profile.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cs-orange mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link
          href={`/user/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cs-orange transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-8">
          EDIT <span className="text-cs-orange">PROFILE</span>
        </h1>

        <div className="space-y-6">
          {/* Avatar + Name (from Steam) */}
          <div className="cs-card rounded-xl p-6 flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-cs-orange/30">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="bg-cs-navy text-cs-orange text-xl">
                {user.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-heading text-lg font-bold text-foreground">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Name and avatar synced from Steam
              </p>
            </div>
          </div>

          {/* Custom Display Name */}
          <div className="cs-card rounded-xl p-6 space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Custom Display Name{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={user.name || "Leave empty to use Steam name"}
              maxLength={32}
              className="bg-muted/30 border-border"
            />
            <p className="text-[10px] text-muted-foreground">
              Overrides your Steam name on this site. Max 32 characters.
            </p>
          </div>

          {/* Bio */}
          <div className="cs-card rounded-xl p-6 space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Bio
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself, your CS2 experience..."
              maxLength={500}
              rows={4}
              className="bg-muted/30 border-border resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          {/* Privacy Settings */}
          <div className="cs-card rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-medium text-foreground">
              Privacy Settings
            </h2>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm text-foreground">CS2 Playtime</p>
                <p className="text-xs text-muted-foreground">
                  Show your CS2 hours publicly
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHidePlaytime(!hidePlaytime)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition-all ${
                  hidePlaytime
                    ? "border-cs-red/30 text-cs-red bg-cs-red/5"
                    : "border-cs-green/30 text-cs-green bg-cs-green/5"
                }`}
              >
                {hidePlaytime ? (
                  <>
                    <EyeOff className="h-3 w-3" /> Hidden
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> Visible
                  </>
                )}
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm text-foreground">FACEIT Stats</p>
                <p className="text-xs text-muted-foreground">
                  Show your FACEIT level and ELO publicly
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHideFaceit(!hideFaceit)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border transition-all ${
                  hideFaceit
                    ? "border-cs-red/30 text-cs-red bg-cs-red/5"
                    : "border-cs-green/30 text-cs-green bg-cs-green/5"
                }`}
              >
                {hideFaceit ? (
                  <>
                    <EyeOff className="h-3 w-3" /> Hidden
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> Visible
                  </>
                )}
              </button>
            </label>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-cs-orange hover:bg-cs-orange-light text-background font-heading"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
