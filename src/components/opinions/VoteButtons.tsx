"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface VoteButtonsProps {
  targetId: string;
  targetType: "opinion" | "comment";
  initialScore: number;
  vertical?: boolean;
}

export function VoteButtons({
  targetId,
  targetType,
  initialScore,
  vertical = true,
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVote(value: number) {
    if (loading) return;

    const newValue = myVote === value ? 0 : value;
    setLoading(true);
    setError(null);

    try {
      const url =
        targetType === "opinion"
          ? `/api/opinions/${targetId}/vote`
          : `/api/comments/${targetId}/vote`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });

      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setMyVote(newValue);
      } else if (res.status === 429) {
        setError("Too many votes, slow down");
      } else {
        setError("Vote failed");
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  const containerClass = vertical
    ? "flex flex-col items-center gap-0.5"
    : "flex items-center gap-1";

  return (
    <div className={containerClass}>
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`p-0.5 rounded transition-colors ${
          myVote === 1
            ? "text-cs-orange"
            : "text-muted-foreground/50 hover:text-cs-orange"
        } ${loading ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        title="Upvote"
      >
        <ChevronUp className={vertical ? "h-5 w-5" : "h-4 w-4"} />
      </button>

      <span
        className={`cs-stat-number text-sm ${
          score > 0 ? "text-cs-orange" : score < 0 ? "text-cs-red" : "text-muted-foreground"
        }`}
      >
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`p-0.5 rounded transition-colors ${
          myVote === -1
            ? "text-cs-red"
            : "text-muted-foreground/50 hover:text-cs-red"
        } ${loading ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        title="Downvote"
      >
        <ChevronDown className={vertical ? "h-5 w-5" : "h-4 w-4"} />
      </button>
      {error && (
        <span className="text-xs text-cs-red/70 mt-0.5">{error}</span>
      )}
    </div>
  );
}
