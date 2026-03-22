import { db } from "@/lib/db";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/admin/StatCard";
import { DeleteSignatureButton } from "@/components/admin/DeleteSignatureButton";
import { NotableSignersAdmin } from "@/components/admin/NotableSignersAdmin";
import { ScrollText, TrendingUp, Star } from "lucide-react";

export default async function AdminPetitionsPage() {
  const [totalCount, signatures, todayCount, notableConfig] = await Promise.all(
    [
      db.petitionSignature.count(),
      db.petitionSignature.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: {
            select: {
              displayName: true,
              avatarUrl: true,
              steamId: true,
            },
          },
        },
      }),
      db.petitionSignature.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.siteConfig.findUnique({ where: { key: "notable_signers" } }),
    ]
  );

  const notableSigners =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (notableConfig?.value as any)?.signers || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Petition Signatures
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          All petition signatures &mdash; removing a signature lets the user
          sign again
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Signatures"
          value={totalCount}
          icon={ScrollText}
          color="text-cs-orange"
        />
        <StatCard
          title="Today"
          value={todayCount}
          subtitle="New signatures today"
          icon={TrendingUp}
          color="text-cs-green"
        />
      </div>

      {/* Notable Signers Management */}
      <div className="cs-card rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-cs-gold" />
          <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
            Notable Signers Configuration
          </h3>
        </div>
        <NotableSignersAdmin initialSigners={notableSigners} />
      </div>

      <div className="cs-card rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border/30">
          <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
            Recent Signatures (last 50)
          </h3>
        </div>
        <div className="divide-y divide-border/20">
          {signatures.map((sig) => (
            <div key={sig.id} className="flex items-start gap-3 p-4">
              <Avatar className="h-8 w-8 border border-border/50 shrink-0">
                <AvatarImage
                  src={sig.user.avatarUrl || undefined}
                  alt={sig.user.displayName}
                />
                <AvatarFallback className="bg-cs-navy text-cs-orange text-xs">
                  {sig.user.displayName?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {sig.user.displayName}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {sig.user.steamId}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {new Date(sig.createdAt).toLocaleString()}
                  </span>
                </div>
                {sig.message && (
                  <p className="text-sm text-muted-foreground mt-1">
                    &ldquo;{sig.message}&rdquo;
                  </p>
                )}
              </div>
              <DeleteSignatureButton
                signatureId={sig.id}
                userName={sig.user.displayName}
              />
            </div>
          ))}
          {signatures.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No signatures yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
