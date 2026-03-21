import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserBadges } from "@/components/shared/UserBadges";
import { VoteButtons } from "./VoteButtons";
import { MessageSquare, Calendar } from "lucide-react";
import { stripHtml } from "@/lib/sanitize";

interface OpinionCardProps {
  opinion: {
    id: string;
    title: string;
    content: string;
    imageUrl?: string | null;
    score: number;
    createdAt: string;
    author: {
      id: string;
      displayName: string;
      avatarUrl?: string | null;
      ownsCs2?: boolean | null;
      cs2PlaytimeHours?: number | null;
      cs2Wins?: number | null;
      faceitLevel?: number | null;
      profileVisibility?: number | null;
    };
    _count: { comments: number };
  };
}

export function OpinionCard({ opinion }: OpinionCardProps) {
  const preview = stripHtml(opinion.content).slice(0, 200);

  return (
    <div className="cs-card rounded-lg p-4 flex gap-3">
      {/* Vote */}
      <div className="shrink-0 pt-1">
        <VoteButtons
          targetId={opinion.id}
          targetType="opinion"
          initialScore={opinion.score}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <Link href={`/opinions/${opinion.id}`}>
          <h3 className="font-heading font-semibold text-foreground hover:text-cs-orange transition-colors line-clamp-2">
            {opinion.title}
          </h3>
        </Link>

        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {preview}
        </p>

        {/* Author + meta */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Avatar className="h-5 w-5 border border-border/50">
            <AvatarImage
              src={opinion.author.avatarUrl || undefined}
              alt={opinion.author.displayName}
            />
            <AvatarFallback className="bg-cs-navy text-cs-orange text-[8px]">
              {opinion.author.displayName?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {opinion.author.displayName}
          </span>
          <UserBadges
            cs2PlaytimeHours={opinion.author.cs2PlaytimeHours}
            faceitLevel={opinion.author.faceitLevel}
          />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {opinion._count.comments}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(opinion.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Image preview */}
      {opinion.imageUrl && (
        <Link
          href={`/opinions/${opinion.id}`}
          className="shrink-0 hidden sm:block"
        >
          <img
            src={opinion.imageUrl}
            alt=""
            className="w-20 h-20 rounded object-cover border border-border/30"
          />
        </Link>
      )}
    </div>
  );
}
