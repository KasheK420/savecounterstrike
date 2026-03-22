"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, ExternalLink } from "lucide-react";

interface TweetData {
  id: string;
  text: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
  media: {
    type: "video" | "photo" | null;
    photos: string[];
    video: { src: string; poster: string } | null;
  };
  stats: {
    likes: number;
    replies: number;
  };
  createdAt: string;
  url: string;
}

interface TwitterEmbedProps {
  tweetUrl: string;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function linkifyText(text: string): string {
  return text
    .replace(/https?:\/\/t\.co\/\w+/g, "")
    .replace(/@(\w+)/g, '<a href="https://x.com/$1" target="_blank" rel="noopener noreferrer" class="text-cs-blue hover:underline">@$1</a>')
    .replace(/#(\w+)/g, '<a href="https://x.com/hashtag/$1" target="_blank" rel="noopener noreferrer" class="text-cs-blue hover:underline">#$1</a>')
    .trim();
}

export function TwitterEmbed({ tweetUrl }: TwitterEmbedProps) {
  const [tweet, setTweet] = useState<TweetData | null>(null);
  const [error, setError] = useState(false);
  const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];

  useEffect(() => {
    if (!tweetId) { setError(true); return; }

    fetch(`/api/tweet/${tweetId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { if (data.error) throw new Error(); setTweet(data); })
      .catch(() => setError(true));
  }, [tweetId]);

  if (error) {
    return (
      <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors max-w-[550px] mx-auto">
        <ExternalLink className="h-5 w-5 text-cs-blue shrink-0" />
        <span className="text-sm text-cs-blue">View post on X</span>
      </a>
    );
  }

  if (!tweet) {
    return (
      <div className="max-w-[550px] mx-auto rounded-xl border border-border/20 bg-muted/5 p-6">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted/30" />
            <div className="space-y-1.5">
              <div className="w-24 h-3 bg-muted/30 rounded" />
              <div className="w-16 h-2.5 bg-muted/20 rounded" />
            </div>
          </div>
          <div className="w-full h-3 bg-muted/20 rounded" />
          <div className="w-3/4 h-3 bg-muted/20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[550px] mx-auto rounded-xl border border-border/20 bg-[#16181c] overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-0">
        <a href={`https://x.com/${tweet.author.handle}`} target="_blank" rel="noopener noreferrer">
          <img
            src={tweet.author.avatar}
            alt={tweet.author.name}
            className="w-12 h-12 rounded-full"
          />
        </a>
        <div className="flex-1 min-w-0">
          <a href={`https://x.com/${tweet.author.handle}`} target="_blank" rel="noopener noreferrer"
            className="hover:underline">
            <span className="font-bold text-[15px] text-white">{tweet.author.name}</span>
            {tweet.author.verified && (
              <svg viewBox="0 0 22 22" className="inline-block w-[18px] h-[18px] ml-0.5 align-text-bottom fill-[#1d9bf0]">
                <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.855-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.14.272.587.706 1.086 1.246 1.44.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.222 1.258.272 1.89.142.63-.13 1.211-.434 1.678-.878.468-.444.773-1.024.906-1.656.132-.63.087-1.285-.132-1.887.588-.275 1.09-.706 1.445-1.245.355-.54.554-1.17.573-1.818z" />
                <path d="M9.585 14.929l-3.28-3.28 1.168-1.168 2.112 2.112 4.716-4.716 1.168 1.168-5.884 5.884z" fill="white" />
              </svg>
            )}
          </a>
          <div className="text-[15px] text-[#71767b]">@{tweet.author.handle}</div>
        </div>
        <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="shrink-0 mt-1">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#71767b] hover:fill-white transition-colors">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </div>

      {/* Text */}
      <div className="px-4 pt-3">
        <p className="text-[15px] text-white leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: linkifyText(tweet.text) }} />
      </div>

      {/* Media */}
      {tweet.media.type === "video" && tweet.media.video && (
        <div className="mt-3 mx-4 rounded-xl overflow-hidden border border-[#2f3336]">
          <video
            controls
            playsInline
            preload="metadata"
            poster={tweet.media.video.poster}
            className="w-full"
          >
            <source src={tweet.media.video.src} type="video/mp4" />
          </video>
        </div>
      )}

      {tweet.media.type === "photo" && tweet.media.photos.length > 0 && (
        <div className="mt-3 mx-4 rounded-xl overflow-hidden border border-[#2f3336]">
          {tweet.media.photos.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full" />
          ))}
        </div>
      )}

      {/* Stats + Date */}
      <div className="px-4 py-3 mt-2 border-t border-[#2f3336] flex items-center gap-4 text-[13px] text-[#71767b]">
        <span>{formatDate(tweet.createdAt)}</span>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span>{formatNumber(tweet.stats.replies)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          <span>{formatNumber(tweet.stats.likes)}</span>
        </div>
        <a href={tweet.url} target="_blank" rel="noopener noreferrer"
          className="ml-auto text-cs-blue hover:underline text-xs">
          View on X
        </a>
      </div>
    </div>
  );
}
