"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserBadges } from "@/components/shared/UserBadges";
import { VoteButtons } from "./VoteButtons";
import { SafeHtml } from "./SafeHtml";
import { CommentSection } from "./CommentSection";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { useSession } from "@/components/auth/SessionProvider";
import Link from "next/link";
import { Calendar, MessageSquare, Edit3 } from "lucide-react";

interface OpinionDetailProps {
  opinion: {
    id: string;
    title: string;
    content: string;
    imageUrl?: string | null;
    score: number;
    createdAt: string;
    editedAt?: string | null;
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

export function OpinionDetail({ opinion }: OpinionDetailProps) {
  const { user } = useSession();
  const isAuthor = user?.userId === opinion.author.id;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex gap-4">
        <div className="shrink-0 pt-1">
          <VoteButtons
            targetId={opinion.id}
            targetType="opinion"
            initialScore={opinion.score}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              {opinion.title}
            </h1>
            {isAuthor && (
              <Link
                href={`/opinions/${opinion.id}/edit`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cs-orange transition-colors shrink-0 mt-2"
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </Link>
            )}
          </div>
          {opinion.editedAt && (
            <p className="text-xs text-muted-foreground/50 mt-1 italic">
              edited {new Date(opinion.editedAt).toLocaleDateString()}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <Link href={`/user/${opinion.author.id}`}>
              <Avatar className="h-6 w-6 border border-border/50">
                <AvatarImage
                  src={opinion.author.avatarUrl || undefined}
                  alt={opinion.author.displayName}
                />
                <AvatarFallback className="bg-cs-navy text-cs-orange text-[8px]">
                  {opinion.author.displayName?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link
              href={`/user/${opinion.author.id}`}
              className="text-sm text-foreground hover:text-cs-orange transition-colors"
            >
              {opinion.author.displayName}
            </Link>
            <UserBadges
              cs2PlaytimeHours={opinion.author.cs2PlaytimeHours}
              faceitLevel={opinion.author.faceitLevel}
            />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(opinion.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {opinion._count.comments} comments
            </span>
          </div>
        </div>
      </div>

      {/* Image */}
      {opinion.imageUrl && (
        <ImageLightbox src={opinion.imageUrl}>
          <img
            src={opinion.imageUrl}
            alt=""
            className="w-full rounded-lg border border-border/30 max-h-96 object-cover"
          />
        </ImageLightbox>
      )}

      {/* Content */}
      <SafeHtml
        html={opinion.content}
        className="prose prose-invert prose-orange max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-heading prose-strong:text-foreground prose-a:text-cs-orange prose-a:no-underline hover:prose-a:underline"
      />

      {/* Comments */}
      <div className="border-t border-border/30 pt-8">
        <CommentSection opinionId={opinion.id} />
      </div>
    </div>
  );
}
