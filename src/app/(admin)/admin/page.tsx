import { db } from "@/lib/db";
import { StatCard } from "@/components/admin/StatCard";
import { Users, ScrollText, FileText, Video } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [userCount, signatureCount, articleCount, mediaCount] = await Promise.all([
    db.user.count(),
    db.petitionSignature.count(),
    db.article.count(),
    db.media.count(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          SaveCounterStrike.com admin overview
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Users"
          value={userCount}
          subtitle="Registered via Steam"
          icon={Users}
          color="text-cs-blue"
        />
        <StatCard
          title="Signatures"
          value={signatureCount}
          subtitle="Petition signed"
          icon={ScrollText}
          color="text-cs-orange"
        />
        <StatCard
          title="Articles"
          value={articleCount}
          subtitle="Total articles"
          icon={FileText}
          color="text-cs-gold"
        />
        <StatCard
          title="Media"
          value={mediaCount}
          subtitle="Submitted media"
          icon={Video}
          color="text-cs-blue"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/admin/articles/new"
          className="cs-card rounded-lg p-6 hover:border-cs-orange/30 transition-all group"
        >
          <FileText className="h-8 w-8 text-cs-orange mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-heading font-semibold text-foreground">
            Write Article
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new article about the CS2 situation
          </p>
        </Link>

        <Link
          href="/admin/petitions"
          className="cs-card rounded-lg p-6 hover:border-cs-orange/30 transition-all group"
        >
          <ScrollText className="h-8 w-8 text-cs-blue mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-heading font-semibold text-foreground">
            View Signatures
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Browse all petition signatures and messages
          </p>
        </Link>
      </div>
    </div>
  );
}
