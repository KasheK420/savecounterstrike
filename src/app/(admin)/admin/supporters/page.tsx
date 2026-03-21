import { db } from "@/lib/db";
import { SupportersAdmin } from "@/components/admin/SupportersAdmin";
import { Handshake } from "lucide-react";

export default async function AdminSupportersPage() {
  const config = await db.siteConfig.findUnique({
    where: { key: "supporters" },
  });

  const items = (config?.value as any)?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Supporters
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the logo slider shown on the homepage. Add companies, streamers,
          orgs, or anyone who supports the initiative.
        </p>
      </div>

      <div className="cs-card rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Handshake className="h-5 w-5 text-cs-gold" />
          <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
            Supporter Logos
          </h3>
        </div>
        <SupportersAdmin initialItems={items} />
      </div>
    </div>
  );
}
