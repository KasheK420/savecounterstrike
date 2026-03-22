"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { MessageSquare, Reply, Trash2 } from "lucide-react";
import { VoteButtons } from "./VoteButtons";
import { CommentForm } from "./CommentForm";
import { UserBadges } from "@/components/shared/UserBadges";

interface Author {
  id: string | null;
  displayName: string;
  avatarUrl: string | null;
  cs2PlaytimeHours?: number;
  faceitLevel?: number;
}

interface CommentData {
  id: string;
  content: string;
  author: Author;
  isAnonymous: boolean;
  score: number;
  userVote: number;
  createdAt: string;
  replies: CommentData[];
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function CommentThread({
  comment,
  mediaId,
  depth = 0,
}: {
  comment: CommentData;
  mediaId: string;
  depth?: number;
}) {
  const { user } = useSession();
  const [showReply, setShowReply] = useState(false);
  const [replies, setReplies] = useState(comment.replies);
  const [deleted, setDeleted] = useState(false);
  const maxDepth = 2;

  function handleReply(newComment: CommentData) {
    setReplies((prev) => [...prev, newComment]);
    setShowReply(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    if (res.ok) setDeleted(true);
  }

  if (deleted) {
    return (
      <div className={`${depth > 0 ? "ml-6 border-l border-border/20 pl-4" : ""}`}>
        <p className="text-xs text-muted-foreground italic py-3">Comment deleted</p>
      </div>
    );
  }

  return (
    <div className={`${depth > 0 ? "ml-6 border-l border-border/20 pl-4" : ""}`}>
      <div className="flex gap-3 py-3">
        <VoteButtons
          entityType="comment"
          entityId={comment.id}
          initialScore={comment.score}
          initialUserVote={comment.userVote}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {comment.author.avatarUrl && (
              <img
                src={comment.author.avatarUrl}
                alt=""
                className="h-5 w-5 rounded-full"
              />
            )}
            <span className={`font-medium ${comment.isAnonymous ? "italic" : "text-foreground"}`}>
              {comment.author.displayName}
            </span>
            <UserBadges
              cs2PlaytimeHours={comment.author.cs2PlaytimeHours}
              faceitLevel={comment.author.faceitLevel}
              compact
            />
            <span>{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {depth < maxDepth && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cs-orange transition-colors"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
            {user?.role === "ADMIN" && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
          {showReply && (
            <div className="mt-2">
              <CommentForm
                mediaId={mediaId}
                parentId={comment.id}
                onSubmit={handleReply}
                onCancel={() => setShowReply(false)}
                placeholder={`Reply to ${comment.author.displayName}...`}
              />
            </div>
          )}
        </div>
      </div>
      {replies.length > 0 && (
        <div>
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              mediaId={mediaId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ mediaId }: { mediaId: string }) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/media/${mediaId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [mediaId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  function handleNewComment(comment: CommentData) {
    setComments((prev) => [comment, ...prev]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-cs-blue" />
        <h2 className="font-heading text-lg font-bold">
          Comments{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({comments.length})
          </span>
        </h2>
      </div>

      <CommentForm mediaId={mediaId} onSubmit={handleNewComment} />

      {loading ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          No comments yet. Be the first!
        </div>
      ) : (
        <div className="divide-y divide-border/10">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              mediaId={mediaId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
