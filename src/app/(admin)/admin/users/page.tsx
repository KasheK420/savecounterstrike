import { db } from "@/lib/db";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserBadges } from "@/components/shared/UserBadges";
import { StatCard } from "@/components/admin/StatCard";
import { Users, Shield } from "lucide-react";

export default async function AdminUsersPage() {
  const [totalCount, users] = await Promise.all([
    db.user.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Users
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalCount} registered users
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Users"
          value={totalCount}
          subtitle="Registered via Steam"
          icon={Users}
          color="text-cs-blue"
        />
        <StatCard
          title="Admins"
          value={users.filter((u) => u.role === "ADMIN").length}
          subtitle="Admin role users"
          icon={Shield}
          color="text-cs-orange"
        />
      </div>

      <div className="cs-card rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border/30">
          <h3 className="font-heading text-sm font-semibold text-foreground uppercase tracking-wider">
            All Users (last 100)
          </h3>
        </div>
        <div className="divide-y divide-border/20">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-4">
              <Avatar className="h-9 w-9 border border-border/50 shrink-0">
                <AvatarImage
                  src={user.avatarUrl || undefined}
                  alt={user.displayName}
                />
                <AvatarFallback className="bg-cs-navy text-cs-orange text-xs">
                  {user.displayName?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {user.displayName}
                  </span>
                  <UserBadges
                    ownsCs2={user.ownsCs2}
                    cs2PlaytimeHours={user.cs2PlaytimeHours}
                    cs2Wins={user.cs2Wins}
                    faceitLevel={user.faceitLevel}
                    profileVisibility={user.profileVisibility}
                  />
                  {user.role !== "USER" && (
                    <Badge
                      variant="outline"
                      className={
                        user.role === "ADMIN"
                          ? "border-cs-orange/30 text-cs-orange text-[10px]"
                          : "border-cs-blue/30 text-cs-blue text-[10px]"
                      }
                    >
                      {user.role}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono">{user.steamId}</span>
                  <span>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
