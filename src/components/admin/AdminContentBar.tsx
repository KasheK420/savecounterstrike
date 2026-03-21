"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { useRouter } from "next/navigation";
import { Trash2, EyeOff, Eye, Shield } from "lucide-react";

interface AdminContentBarProps {
  type: "article" | "opinion";
  id: string;
  /** For articles: published boolean. For opinions: status string (APPROVED/HIDDEN). */
  status: boolean | string;
}

export function AdminContentBar({ type, id, status }: AdminContentBarProps) {
  const { user } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  if (!user || user.role !== "ADMIN") return null;

  const isVisible =
    type === "article" ? currentStatus === true : currentStatus === "APPROVED";

  async function handleToggle() {
    setLoading(true);
    try {
      if (type === "article") {
        await fetch(`/api/articles/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !currentStatus }),
        });
        setCurrentStatus(!currentStatus);
      } else {
        const newStatus =
          currentStatus === "HIDDEN" ? "APPROVED" : "HIDDEN";
        await fetch(`/api/opinions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        setCurrentStatus(newStatus);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this content? This cannot be undone.")) return;
    setLoading(true);
    try {
      const endpoint =
        type === "article" ? `/api/articles/${id}` : `/api/opinions/${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        router.push(type === "article" ? "/blog" : "/opinions");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-background/95 border border-border/50 backdrop-blur-sm shadow-lg">
      <Shield className="h-4 w-4 text-cs-orange" />
      <span className="text-xs text-muted-foreground font-heading uppercase tracking-wider">
        Admin
      </span>
      <div className="w-px h-4 bg-border/50 mx-1" />
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
          isVisible
            ? "text-yellow-500 hover:bg-yellow-500/10"
            : "text-cs-green hover:bg-cs-green/10"
        }`}
      >
        {isVisible ? (
          <>
            <EyeOff className="h-3.5 w-3.5" />
            {type === "article" ? "Unpublish" : "Hide"}
          </>
        ) : (
          <>
            <Eye className="h-3.5 w-3.5" />
            {type === "article" ? "Publish" : "Approve"}
          </>
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}
