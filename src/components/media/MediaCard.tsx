import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface MediaCardProps {
  id: string;
  title: string;
  platform: string;
  thumbnailUrl: string | null;
  score: number;
  commentCount: number;
  author: {
    displayName: string;
    avatarUrl: string | null;
    faceitLevel?: number | null;
    cs2PlaytimeHours?: number | null;
  };
  createdAt: string;
  status?: string;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const platformColors: Record<string, string> = {
  YOUTUBE: "bg-red-500/20 text-red-400",
  TWITCH: "bg-purple-500/20 text-purple-400",
  TIKTOK: "bg-pink-500/20 text-pink-400",
  INSTAGRAM: "bg-orange-500/20 text-orange-400",
  TWITTER: "bg-sky-500/20 text-sky-400",
  OTHER: "bg-gray-500/20 text-gray-400",
};

export function MediaCard({
  id,
  title,
  platform,
  thumbnailUrl,
  score,
  commentCount,
  author,
  createdAt,
  status,
}: MediaCardProps) {
  return (
    <Link
      href={`/media/${id}`}
      className="group flex gap-3 p-4 rounded-lg border border-border/20 bg-muted/5 hover:bg-muted/20 hover:border-border/40 transition-all"
    >
      {/* Score */}
      <div className="flex flex-col items-center justify-center shrink-0 w-10">
        <span
          className={`text-lg font-bold cs-stat-number ${
            score > 0
              ? "text-cs-orange"
              : score < 0
                ? "text-cs-red"
                : "text-muted-foreground"
          }`}
        >
          {score}
        </span>
        <span className="text-[10px] text-muted-foreground">votes</span>
      </div>

      {/* Thumbnail */}
      {thumbnailUrl && (
        <div className="shrink-0 w-32 h-20 rounded overflow-hidden bg-muted/20">
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
              platformColors[platform] || platformColors.OTHER
            }`}
          >
            {platform}
          </span>
          {status && status !== "APPROVED" && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                status === "HIDDEN"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {status}
            </span>
          )}
        </div>
        <h3 className="text-sm font-medium text-foreground group-hover:text-cs-orange transition-colors line-clamp-2">
          {title}
        </h3>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {author.avatarUrl && (
              <img src={author.avatarUrl} alt="" className="h-4 w-4 rounded-full" />
            )}
            <span>{author.displayName}</span>
          </div>
          {author.faceitLevel && (
            <span className="text-cs-orange">LVL {author.faceitLevel}</span>
          )}
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {commentCount}
          </div>
          <span>{timeAgo(createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
