"use client";

import { useState } from "react";
import { Trash2, Eye, EyeOff } from "lucide-react";

export function ArticleActions({
  articleId,
  published,
  title,
}: {
  articleId: string;
  published: boolean;
  title: string;
}) {
  const [loading, setLoading] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [pub, setPub] = useState(published);

  async function handleTogglePublish(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !pub }),
      });
      if (res.ok) setPub(!pub);
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
      const res = await fetch(`/api/articles/${articleId}`, {
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
        onClick={handleTogglePublish}
        disabled={loading}
        className="p-1.5 rounded-md text-muted-foreground hover:text-cs-orange hover:bg-cs-orange/10 transition-colors disabled:opacity-50"
        title={pub ? "Unpublish" : "Publish"}
      >
        {pub ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
