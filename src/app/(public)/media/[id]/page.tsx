import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ArrowLeft, ExternalLink, Clock, Shield } from "lucide-react";
import { MediaEmbed } from "@/components/media/MediaEmbed";
import { TwitterEmbed } from "@/components/media/TwitterEmbed";
import { VoteButtons } from "@/components/media/VoteButtons";
import { CommentSection } from "@/components/media/CommentSection";
import { AdminMediaControls } from "./AdminMediaControls";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const media = await db.media.findUnique({
    where: { id },
    select: { title: true, description: true, thumbnailUrl: true },
  });

  if (!media) return { title: "Not Found" };

  return {
    title: media.title,
    description: media.description || `Media post on Save Counter-Strike`,
    openGraph: media.thumbnailUrl
      ? { images: [{ url: media.thumbnailUrl }] }
      : undefined,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const platformLabels: Record<string, string> = {
  YOUTUBE: "YouTube",
  TWITCH: "Twitch",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  TWITTER: "X / Twitter",
  OTHER: "Link",
};

export default async function MediaDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.userId;
  const isAdmin = session?.user?.role === "ADMIN";

  const media = await db.media.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          steamId: true,
          ownsCs2: true,
          cs2PlaytimeHours: true,
          cs2Kills: true,
          cs2Deaths: true,
          cs2Wins: true,
          cs2HeadshotPct: true,
          faceitLevel: true,
          faceitElo: true,
          profileVisibility: true,
        },
      },
      _count: { select: { comments: true } },
      ...(userId
        ? {
            votes: {
              where: { userId },
              select: { value: true },
            },
          }
        : {}),
    },
  });

  if (!media) notFound();
  if (!isAdmin && media.status !== "APPROVED") notFound();

  // Check if Twitter platform for client-side rendering
  const isTwitter = media.platform === "TWITTER";

  const userVote = (media as Record<string, unknown>).votes
    ? ((media as Record<string, unknown>).votes as { value: number }[])?.[0]?.value ?? 0
    : 0;
  const author = media.author;

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/media"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cs-orange transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Media Wall
        </Link>

        <div className="flex gap-4">
          {/* Vote column */}
          <div className="shrink-0 pt-2">
            <VoteButtons
              entityType="media"
              entityId={media.id}
              initialScore={media.score}
              initialUserVote={userVote}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-muted/30 text-muted-foreground font-medium">
                  {platformLabels[media.platform] || media.platform}
                </span>
                {media.status !== "APPROVED" && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">
                    {media.status}
                  </span>
                )}
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                {media.title}
              </h1>
              {media.description && (
                <p className="text-muted-foreground mt-2">{media.description}</p>
              )}
            </div>

            {/* Embed */}
            {media.platform === "TWITTER" ? (
              <div className="flex justify-center">
                <TwitterEmbed tweetUrl={media.url} />
              </div>
            ) : (
              <MediaEmbed
                url={media.url}
                platform={media.platform}
                embedUrl={media.embedUrl}
                title={media.title}
              />
            )}

            {/* Source link */}
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-cs-blue hover:text-cs-blue-light transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open original
            </a>

            {/* Author info */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border/20 bg-muted/5">
              {author.avatarUrl && (
                <img
                  src={author.avatarUrl}
                  alt={author.displayName}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {author.displayName}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {author.cs2PlaytimeHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {author.cs2PlaytimeHours.toLocaleString()}h
                    </span>
                  )}
                  {author.faceitLevel && (
                    <span className="text-cs-orange flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      FACEIT {author.faceitLevel}
                    </span>
                  )}
                </div>
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDate(media.createdAt)}
              </span>
            </div>

            {/* Admin controls */}
            {isAdmin && (
              <AdminMediaControls mediaId={media.id} currentStatus={media.status} />
            )}

            {/* Comments */}
            <CommentSection mediaId={media.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
