"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";

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
  const { user } = useSession();
  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  async function handleVote(value: number) {
    if (!user) return;
    if (loading) return;

    const newValue = myVote === value ? 0 : value;
    setLoading(true);

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

      const data = await res.json();
      setScore(data.score);
      setMyVote(newValue);
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
        disabled={!user}
        className={`p-0.5 rounded transition-colors ${
          myVote === 1
            ? "text-cs-orange"
            : "text-muted-foreground/50 hover:text-cs-orange"
        } ${!user ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        title={user ? "Upvote" : "Sign in to vote"}
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
        disabled={!user}
        className={`p-0.5 rounded transition-colors ${
          myVote === -1
            ? "text-cs-red"
            : "text-muted-foreground/50 hover:text-cs-red"
        } ${!user ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
        title={user ? "Downvote" : "Sign in to vote"}
      >
        <ChevronDown className={vertical ? "h-5 w-5" : "h-4 w-4"} />
      </button>
    </div>
  );
}
