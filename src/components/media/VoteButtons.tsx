"use client";

import { useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface VoteButtonsProps {
  entityType: "media" | "comment";
  entityId: string;
  initialScore: number;
  initialUserVote: number;
  size?: "sm" | "md";
}

export function VoteButtons({
  entityType,
  entityId,
  initialScore,
  initialUserVote,
  size = "md",
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  const vote = useCallback(
    async (value: 1 | -1) => {
      if (loading) return;

      const newValue = userVote === value ? 0 : value;
      const prevScore = score;
      const prevVote = userVote;

      // Optimistic update
      setUserVote(newValue);
      setScore(prevScore - prevVote + newValue);
      setLoading(true);

      try {
        const endpoint =
          entityType === "media"
            ? `/api/media/${entityId}/vote`
            : `/api/comments/${entityId}/vote`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: newValue === 0 ? prevVote : newValue }),
        });

        if (res.ok) {
          const data = await res.json();
          setScore(data.score);
        } else {
          // Rollback
          setScore(prevScore);
          setUserVote(prevVote);
        }
      } catch {
        setScore(prevScore);
        setUserVote(prevVote);
      } finally {
        setLoading(false);
      }
    },
    [loading, userVote, score, entityType, entityId]
  );

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => vote(1)}
        disabled={loading}
        className={`p-1 rounded transition-colors ${
          userVote === 1
            ? "text-cs-orange bg-cs-orange/10"
            : "text-muted-foreground hover:text-cs-orange hover:bg-muted/50"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Upvote"
      >
        <ChevronUp className={iconSize} />
      </button>
      <span
        className={`${textSize} font-bold cs-stat-number ${
          score > 0
            ? "text-cs-orange"
            : score < 0
              ? "text-cs-red"
              : "text-muted-foreground"
        }`}
      >
        {score}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={loading}
        className={`p-1 rounded transition-colors ${
          userVote === -1
            ? "text-cs-blue bg-cs-blue/10"
            : "text-muted-foreground hover:text-cs-blue hover:bg-muted/50"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Downvote"
      >
        <ChevronDown className={iconSize} />
      </button>
    </div>
  );
}
