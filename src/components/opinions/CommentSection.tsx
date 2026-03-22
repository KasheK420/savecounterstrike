"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserBadges } from "@/components/shared/UserBadges";
import { VoteButtons } from "./VoteButtons";
import { CommentForm } from "./CommentForm";
import { useSession } from "@/components/auth/SessionProvider";
import { MessageSquare, Reply, Trash2 } from "lucide-react";

interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  ownsCs2?: boolean | null;
  cs2PlaytimeHours?: number | null;
  faceitLevel?: number | null;
  profileVisibility?: number | null;
}

interface CommentData {
  id: string;
  content: string;
  score: number;
  createdAt: string;
  author: CommentAuthor;
  replies?: CommentData[];
}

interface CommentSectionProps {
  opinionId: string;
}

export function CommentSection({ opinionId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/opinions/${opinionId}/comments`);
      const data = await res.json();
      setComments(data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [opinionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  function handleNewComment() {
    fetchComments();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-cs-orange" />
        <h3 className="font-heading font-semibold text-foreground">
          Comments ({comments.length})
        </h3>
      </div>

      <CommentForm opinionId={opinionId} onSubmitted={handleNewComment} />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              opinionId={opinionId}
              depth={0}
              onReply={handleNewComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentThread({
  comment,
  opinionId,
  depth,
  onReply,
}: {
  comment: CommentData;
  opinionId: string;
  depth: number;
  onReply: () => void;
}) {
  const { user } = useSession();
  const [showReply, setShowReply] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const maxDepth = 2;

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    if (res.ok) setDeleted(true);
  }

  if (deleted) {
    return (
      <div className={depth > 0 ? "ml-6 pl-4 border-l border-border/30" : ""}>
        <p className="text-xs text-muted-foreground italic py-2">Comment deleted</p>
      </div>
    );
  }

  return (
    <div className={depth > 0 ? "ml-6 pl-4 border-l border-border/30" : ""}>
      <div className="flex gap-3">
        <Avatar className="h-6 w-6 border border-border/50 shrink-0 mt-0.5">
          <AvatarImage
            src={comment.author.avatarUrl || undefined}
            alt={comment.author.displayName}
          />
          <AvatarFallback className="bg-cs-navy text-cs-orange text-[8px]">
            {comment.author.displayName?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-foreground">
              {comment.author.displayName}
            </span>
            <UserBadges
              cs2PlaytimeHours={comment.author.cs2PlaytimeHours}
              faceitLevel={comment.author.faceitLevel}
              compact
            />
            <span className="text-[10px] text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
            {comment.content}
          </p>

          <div className="flex items-center gap-3 mt-1.5">
            <VoteButtons
              targetId={comment.id}
              targetType="comment"
              initialScore={comment.score}
              vertical={false}
            />
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
                opinionId={opinionId}
                parentId={comment.id}
                placeholder={`Reply to ${comment.author.displayName}...`}
                onSubmitted={() => {
                  setShowReply(false);
                  onReply();
                }}
                onCancel={() => setShowReply(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              opinionId={opinionId}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
