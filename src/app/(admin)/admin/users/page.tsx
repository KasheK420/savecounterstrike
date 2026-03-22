import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserBadges } from "@/components/shared/UserBadges";
import { UserRoleManager } from "@/components/admin/UserRoleManager";
import { StatCard } from "@/components/admin/StatCard";
import { Users, Shield, Ban } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await auth();
  const currentUserId = session?.user?.userId;

  const [totalCount, users, bannedCount] = await Promise.all([
    db.user.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.user.count({ where: { isBanned: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Users
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalCount} registered users &middot; Manage roles and bans
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={totalCount}
          subtitle="Registered via Steam"
          icon={Users}
          color="text-cs-blue"
        />
        <StatCard
          title="Staff"
          value={
            users.filter((u) => u.role === "ADMIN" || u.role === "MODERATOR")
              .length
          }
          subtitle="Admins + Moderators"
          icon={Shield}
          color="text-cs-orange"
        />
        <StatCard
          title="Banned"
          value={bannedCount}
          subtitle="Banned users"
          icon={Ban}
          color="text-cs-red"
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
            <div
              key={user.id}
              className={`flex items-center gap-3 p-4 ${
                user.isBanned ? "opacity-50 bg-cs-red/5" : ""
              }`}
            >
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
                    cs2PlaytimeHours={user.cs2PlaytimeHours}
                    faceitLevel={user.faceitLevel}
                    compact
                  />
                  {user.isBanned && (
                    <Badge
                      variant="outline"
                      className="border-cs-red/30 text-cs-red text-[10px]"
                    >
                      BANNED
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono">{user.steamId}</span>
                  <span>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  {user.bannedReason && (
                    <span className="text-cs-red">
                      Reason: {user.bannedReason}
                    </span>
                  )}
                </div>
              </div>
              <UserRoleManager
                userId={user.id}
                userName={user.displayName}
                currentRole={user.role}
                isBanned={user.isBanned}
                bannedReason={user.bannedReason}
                isCurrentUser={user.id === currentUserId}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
