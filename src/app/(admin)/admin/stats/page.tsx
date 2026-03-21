import { db } from "@/lib/db";
import { StatCard } from "@/components/admin/StatCard";
import { Users, ScrollText, FileText, DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { getRevenueData } from "@/lib/revenue";

export default async function AdminStatsPage() {
  const [userCount, signatureCount, articleCount, publishedArticles, revenueData] =
    await Promise.all([
      db.user.count(),
      db.petitionSignature.count(),
      db.article.count(),
      db.article.count({ where: { published: true } }),
      getRevenueData(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Site Statistics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live data from database and Steam API
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Registered Users"
          value={userCount}
          subtitle="Via Steam login"
          icon={Users}
          color="text-cs-blue"
        />
        <StatCard
          title="Petition Signatures"
          value={signatureCount}
          icon={ScrollText}
          color="text-cs-orange"
        />
        <StatCard
          title="Articles"
          value={`${publishedArticles} / ${articleCount}`}
          subtitle="Published / Total"
          icon={FileText}
          color="text-cs-gold"
        />
      </div>

      <h2 className="font-heading text-lg font-bold text-foreground pt-4">
        CS2 Live Data
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Players Online"
          value={revenueData.currentPlayers}
          subtitle="Current CS2 players"
          icon={Users}
          color="text-cs-green"
        />
        <StatCard
          title="Daily Revenue (est.)"
          value={`$${(revenueData.dailyTotalRevenue / 1_000_000).toFixed(1)}M`}
          subtitle="Cases + market fees"
          icon={DollarSign}
          color="text-cs-green"
        />
        <StatCard
          title="Yearly Revenue (est.)"
          value={`$${(revenueData.yearlyRevenue / 1_000_000_000).toFixed(2)}B`}
          subtitle="Projected annual"
          icon={TrendingUp}
          color="text-cs-green"
        />
        <StatCard
          title="Cases/Day"
          value={`~${(revenueData.dailyCaseOpenings / 1000).toFixed(0)}K`}
          subtitle="Estimated daily openings"
          icon={BarChart3}
          color="text-cs-orange"
        />
        <StatCard
          title="Market Volume (24h)"
          value={revenueData.caseMarketVolume24h}
          subtitle="Cases traded on Steam Market"
          icon={BarChart3}
          color="text-cs-blue"
        />
        <StatCard
          title="$/Second"
          value={`$${revenueData.perSecondRevenue.toFixed(2)}`}
          subtitle="Revenue per second"
          icon={DollarSign}
          color="text-cs-gold"
        />
      </div>

      <p className="text-xs text-muted-foreground/50">
        Last updated: {new Date(revenueData.lastUpdated).toLocaleString()}
      </p>
    </div>
  );
}
