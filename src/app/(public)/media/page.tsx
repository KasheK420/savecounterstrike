import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Video, Plus } from "lucide-react";
import { MediaCard } from "@/components/media/MediaCard";

export const metadata: Metadata = {
  title: "Media Wall",
  description:
    "Community-submitted clips, videos, and media about Counter-Strike 2.",
};

interface Props {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function MediaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sort = sp.sort || "hot";
  const page = parseInt(sp.page || "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const where = isAdmin ? {} : { status: { in: ["APPROVED" as const] } };

  const orderBy =
    sort === "new"
      ? { createdAt: "desc" as const }
      : sort === "top"
        ? { score: "desc" as const }
        : [{ score: "desc" as const }, { createdAt: "desc" as const }];

  const [media, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            faceitLevel: true,
            cs2PlaytimeHours: true,
          },
        },
        _count: { select: { comments: true } },
      },
    }),
    db.media.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  const sortOptions = [
    { value: "hot", label: "Hot" },
    { value: "new", label: "New" },
    { value: "top", label: "Top" },
  ];

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-4xl font-bold">
              MEDIA <span className="text-cs-blue">WALL</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Share and browse CS2 clips, videos, and posts from across the web.
            </p>
          </div>
          <Link
            href="/media/submit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cs-orange text-black font-medium hover:bg-cs-orange-light transition-colors"
          >
            <Plus className="h-4 w-4" />
            Submit
          </Link>
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border/20 pb-3">
          {sortOptions.map((opt) => (
            <Link
              key={opt.value}
              href={`/media?sort=${opt.value}`}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                sort === opt.value
                  ? "bg-cs-orange/10 text-cs-orange font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {opt.label}
            </Link>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {total} post{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Media list */}
        {media.length === 0 ? (
          <div className="py-16 text-center">
            <Video className="h-16 w-16 text-cs-blue mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No media yet. Be the first to share!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {media.map((m) => (
              <MediaCard
                key={m.id}
                id={m.id}
                title={m.title}
                platform={m.platform}
                thumbnailUrl={m.thumbnailUrl}
                score={m.score}
                commentCount={m._count.comments}
                author={m.author}
                createdAt={m.createdAt.toISOString()}
                status={isAdmin ? m.status : undefined}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/media?sort=${sort}&page=${page - 1}`}
                className="px-3 py-1.5 text-sm rounded-md border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link
                href={`/media?sort=${sort}&page=${page + 1}`}
                className="px-3 py-1.5 text-sm rounded-md border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
