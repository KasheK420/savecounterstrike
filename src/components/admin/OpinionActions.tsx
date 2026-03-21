"use client";

import { useState } from "react";
import { Trash2, EyeOff, Eye } from "lucide-react";

export function OpinionActions({
  opinionId,
  status,
  title,
}: {
  opinionId: string;
  status: string;
  title: string;
}) {
  const [loading, setLoading] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  async function handleToggleVisibility(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = currentStatus === "HIDDEN" ? "APPROVED" : "HIDDEN";
    setLoading(true);
    try {
      const res = await fetch(`/api/opinions/${opinionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setCurrentStatus(newStatus);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/opinions/${opinionId}`, {
        method: "DELETE",
      });
      if (res.ok) setRemoved(true);
    } finally {
      setLoading(false);
    }
  }

  if (removed) {
    return (
      <span className="text-xs text-muted-foreground italic">Deleted</span>
    );
  }

  return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
      <button
        onClick={handleToggleVisibility}
        disabled={loading}
        className="p-1.5 rounded-md text-muted-foreground hover:text-cs-orange hover:bg-cs-orange/10 transition-colors disabled:opacity-50"
        title={currentStatus === "HIDDEN" ? "Approve" : "Hide"}
      >
        {currentStatus === "HIDDEN" ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
