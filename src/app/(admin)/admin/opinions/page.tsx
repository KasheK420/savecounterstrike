import { db } from "@/lib/db";
import { StatCard } from "@/components/admin/StatCard";
import { MessageSquare, TrendingUp } from "lucide-react";
import { stripHtml } from "@/lib/sanitize";
import Link from "next/link";
import { OpinionActions } from "@/components/admin/OpinionActions";

export default async function AdminOpinionsPage() {
  const [totalCount, opinions, todayCount] = await Promise.all([
    db.opinion.count(),
    db.opinion.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: {
          select: { displayName: true, avatarUrl: true },
        },
        _count: { select: { comments: true, votes: true } },
      },
    }),
    db.opinion.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Opinions & Suggestions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Community submissions
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Opinions"
          value={totalCount}
          icon={MessageSquare}
          color="text-cs-gold"
        />
        <StatCard
          title="Today"
          value={todayCount}
          subtitle="New today"
          icon={TrendingUp}
          color="text-cs-green"
        />
      </div>

      <div className="cs-card rounded-lg overflow-hidden">
        <div className="divide-y divide-border/20">
          {opinions.map((op) => (
            <Link
              key={op.id}
              href={`/opinions/${op.id}`}
              className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors block"
            >
              <div className="text-center shrink-0 w-12">
                <div className="cs-stat-number text-lg text-cs-orange">
                  {op.score}
                </div>
                <div className="text-[10px] text-muted-foreground">votes</div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {op.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {stripHtml(op.content).slice(0, 120)}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{op.author.displayName}</span>
                  <span>{op._count.comments} comments</span>
                  <span>{new Date(op.createdAt).toLocaleDateString()}</span>
                  <span
                    className={
                      op.status === "APPROVED"
                        ? "text-cs-green"
                        : op.status === "REJECTED"
                          ? "text-cs-red"
                          : op.status === "HIDDEN"
                            ? "text-muted-foreground"
                            : "text-cs-gold"
                    }
                  >
                    {op.status}
                  </span>
                </div>
              </div>
              <OpinionActions
                opinionId={op.id}
                status={op.status}
                title={op.title}
              />
            </Link>
          ))}
          {opinions.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No opinions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
