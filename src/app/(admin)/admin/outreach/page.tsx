import { db } from "@/lib/db";
import { StatCard } from "@/components/admin/StatCard";
import { OutreachTable } from "@/components/admin/OutreachTable";
import { Mail, CheckCircle, MessageSquare, Star } from "lucide-react";

export default async function AdminOutreachPage() {
  const [total, sent, replied, engaged] = await Promise.all([
    db.outreachContact.count(),
    db.outreachContact.count({ where: { emailSent: true } }),
    db.outreachContact.count({ where: { replied: true } }),
    db.outreachContact.count({ where: { engaged: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Outreach Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track emails to influencers, orgs, and media
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={total}
          icon={Mail}
          color="text-cs-blue"
        />
        <StatCard
          title="Emails Sent"
          value={sent}
          subtitle={total > 0 ? `${Math.round((sent / total) * 100)}%` : "0%"}
          icon={CheckCircle}
          color="text-cs-orange"
        />
        <StatCard
          title="Replied"
          value={replied}
          icon={MessageSquare}
          color="text-cs-green"
        />
        <StatCard
          title="Engaged"
          value={engaged}
          subtitle="Shared / signed / participated"
          icon={Star}
          color="text-cs-gold"
        />
      </div>

      <OutreachTable />
    </div>
  );
}
