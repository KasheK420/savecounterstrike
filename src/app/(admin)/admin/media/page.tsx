import { db } from "@/lib/db";
import { StatCard } from "@/components/admin/StatCard";
import { Video, TrendingUp, EyeOff } from "lucide-react";
import Link from "next/link";

const platformLabels: Record<string, string> = {
  YOUTUBE: "YT",
  TWITCH: "TW",
  TIKTOK: "TT",
  INSTAGRAM: "IG",
  TWITTER: "X",
  FACEBOOK: "FB",
  OTHER: "Link",
};

export default async function AdminMediaPage() {
  const [totalCount, media, todayCount, hiddenCount] = await Promise.all([
    db.media.count(),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: {
          select: { displayName: true, avatarUrl: true },
        },
        _count: { select: { comments: true, votes: true } },
      },
    }),
    db.media.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    db.media.count({ where: { status: "HIDDEN" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Media Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Community-submitted media posts
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Media"
          value={totalCount}
          icon={Video}
          color="text-cs-blue"
        />
        <StatCard
          title="Today"
          value={todayCount}
          subtitle="New today"
          icon={TrendingUp}
          color="text-cs-green"
        />
        <StatCard
          title="Hidden"
          value={hiddenCount}
          subtitle="Auto-moderated"
          icon={EyeOff}
          color="text-yellow-400"
        />
      </div>

      <div className="cs-card rounded-lg overflow-hidden">
        <div className="divide-y divide-border/20">
          {media.map((m: typeof media[0]) => (
            <Link
              key={m.id}
              href={`/media/${m.id}`}
              className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors block"
            >
              <div className="text-center shrink-0 w-12">
                <div className="cs-stat-number text-lg text-cs-orange">
                  {m.score}
                </div>
                <div className="text-[10px] text-muted-foreground">votes</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] px-1 py-0.5 rounded bg-muted/30 text-muted-foreground font-medium">
                    {platformLabels[m.platform] || m.platform}
                  </span>
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {m.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{m.author.displayName}</span>
                  <span>{m._count.comments} comments</span>
                  <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                  <span
                    className={
                      m.status === "APPROVED"
                        ? "text-cs-green"
                        : m.status === "REJECTED"
                          ? "text-cs-red"
                          : m.status === "HIDDEN"
                            ? "text-yellow-400"
                            : "text-cs-gold"
                    }
                  >
                    {m.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {media.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No media submissions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
