"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Trash2 } from "lucide-react";

interface AdminMediaControlsProps {
  mediaId: string;
  currentStatus: string;
}

export function AdminMediaControls({ mediaId, currentStatus }: AdminMediaControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function changeStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this media post?")) return;
    setLoading(true);
    try {
      await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
      router.push("/media");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-cs-orange/20 bg-cs-orange/5">
      <Shield className="h-4 w-4 text-cs-orange shrink-0" />
      <span className="text-xs text-cs-orange font-medium mr-2">Admin</span>

      {currentStatus !== "APPROVED" && (
        <button
          onClick={() => changeStatus("APPROVED")}
          disabled={loading}
          className="px-2.5 py-1 text-xs rounded bg-cs-green/20 text-cs-green hover:bg-cs-green/30 transition-colors disabled:opacity-40"
        >
          Approve
        </button>
      )}
      {currentStatus !== "REJECTED" && (
        <button
          onClick={() => changeStatus("REJECTED")}
          disabled={loading}
          className="px-2.5 py-1 text-xs rounded bg-cs-red/20 text-cs-red hover:bg-cs-red/30 transition-colors disabled:opacity-40"
        >
          Reject
        </button>
      )}
      {currentStatus !== "HIDDEN" && (
        <button
          onClick={() => changeStatus("HIDDEN")}
          disabled={loading}
          className="px-2.5 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-40"
        >
          Hide
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="ml-auto p-1.5 rounded text-cs-red hover:bg-cs-red/10 transition-colors disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
