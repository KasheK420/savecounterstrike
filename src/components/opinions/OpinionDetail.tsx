"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserBadges } from "@/components/shared/UserBadges";
import { VoteButtons } from "./VoteButtons";
import { SafeHtml } from "./SafeHtml";
import { CommentSection } from "./CommentSection";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { Calendar, MessageSquare } from "lucide-react";

interface OpinionDetailProps {
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

export function OpinionDetail({ opinion }: OpinionDetailProps) {
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
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            {opinion.title}
          </h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <Avatar className="h-6 w-6 border border-border/50">
              <AvatarImage
                src={opinion.author.avatarUrl || undefined}
                alt={opinion.author.displayName}
              />
              <AvatarFallback className="bg-cs-navy text-cs-orange text-[8px]">
                {opinion.author.displayName?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">
              {opinion.author.displayName}
            </span>
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
