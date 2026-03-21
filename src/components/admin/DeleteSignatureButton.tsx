"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteSignatureButton({
  signatureId,
  userName,
}: {
  signatureId: string;
  userName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove signature from "${userName}"? They will be able to sign again.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/petition?id=${signatureId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleted(true);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete signature");
      }
    } catch {
      alert("Failed to delete signature");
    } finally {
      setLoading(false);
    }
  }

  if (deleted) {
    return (
      <span className="text-xs text-muted-foreground italic">Removed</span>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      title="Remove signature"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
