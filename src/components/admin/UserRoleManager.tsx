"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ban, ShieldCheck, Loader2, Undo2 } from "lucide-react";

interface UserRoleManagerProps {
  userId: string;
  userName: string;
  currentRole: string;
  isBanned: boolean;
  bannedReason?: string | null;
  isCurrentUser: boolean;
}

export function UserRoleManager({
  userId,
  userName,
  currentRole,
  isBanned,
  bannedReason,
  isCurrentUser,
}: UserRoleManagerProps) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [banning, setBanning] = useState(false);
  const [showBanInput, setShowBanInput] = useState(false);
  const [banReason, setBanReason] = useState("");

  async function handleRoleChange(newRole: string) {
    if (newRole === role) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setRole(newRole);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update role");
      }
    } catch {
      alert("Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  async function handleBan() {
    setBanning(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReason }),
      });
      if (res.ok) {
        setShowBanInput(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to ban user");
      }
    } catch {
      alert("Failed to ban user");
    } finally {
      setBanning(false);
    }
  }

  async function handleUnban() {
    setBanning(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } catch {
      alert("Failed to unban user");
    } finally {
      setBanning(false);
    }
  }

  if (isCurrentUser) {
    return (
      <span className="text-xs text-muted-foreground italic">You</span>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Role selector */}
      <select
        value={role}
        onChange={(e) => handleRoleChange(e.target.value)}
        disabled={saving || isBanned}
        className="h-7 px-2 rounded border border-border bg-muted/30 text-xs text-foreground disabled:opacity-50"
      >
        <option value="USER">User</option>
        <option value="MODERATOR">Moderator</option>
        <option value="ADMIN">Admin</option>
      </select>

      {saving && <Loader2 className="h-3 w-3 animate-spin text-cs-orange" />}

      {/* Ban/Unban */}
      {isBanned ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnban}
          disabled={banning}
          className="text-xs border-cs-green/30 text-cs-green hover:bg-cs-green/10"
        >
          {banning ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Undo2 className="h-3 w-3 mr-1" />
          )}
          Unban
        </Button>
      ) : showBanInput ? (
        <div className="flex items-center gap-1">
          <Input
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Reason (optional)"
            className="h-7 w-32 text-xs bg-muted/30 border-border"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleBan}
            disabled={banning}
            className="text-xs border-cs-red/30 text-cs-red hover:bg-cs-red/10"
          >
            {banning ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ban"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBanInput(false)}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBanInput(true)}
          className="text-xs border-cs-red/30 text-cs-red hover:bg-cs-red/10"
        >
          <Ban className="h-3 w-3 mr-1" />
          Ban
        </Button>
      )}
    </div>
  );
}
