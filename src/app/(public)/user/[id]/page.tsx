import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserBadges } from "@/components/shared/UserBadges";
import { Badge } from "@/components/ui/badge";
import { ProfileBio } from "@/components/profile/ProfileBio";
import Link from "next/link";
import {
  Calendar,
  MessageSquare,
  Star,
  Shield,
  ShieldCheck,
  ScrollText,
  Award,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { displayName: true },
  });
  return { title: user?.displayName || "User Profile" };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isOwner = session?.user?.userId === id;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      bio: true,
      karma: true,
      ownsCs2: true,
      cs2PlaytimeHours: true,
      cs2Wins: true,
      cs2HeadshotPct: true,
      faceitLevel: true,
      faceitElo: true,
      hidePlaytime: true,
      hideFaceit: true,
      profileVisibility: true,
      petitionSignature: {
        select: { createdAt: true, message: true },
      },
      opinions: {
        where: { status: "APPROVED" },
        orderBy: { score: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          score: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
      },
      _count: {
        select: { opinions: true, comments: true },
      },
    },
  });

  if (!user) notFound();

  // Enforce privacy flags server-side for non-owner viewers
  if (!isOwner) {
    if (user.hidePlaytime) {
      user.cs2PlaytimeHours = null;
      user.cs2Wins = null;
      user.cs2HeadshotPct = null;
    }
    if (user.hideFaceit) {
      user.faceitLevel = null;
      user.faceitElo = null;
    }
  }

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="cs-card rounded-xl p-8">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 border-2 border-cs-orange/30 shrink-0">
              <AvatarImage
                src={user.avatarUrl || undefined}
                alt={user.displayName}
              />
              <AvatarFallback className="bg-cs-navy text-cs-orange text-2xl font-bold">
                {user.displayName?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {user.displayName}
                </h1>
                {user.role === "ADMIN" && (
                  <Badge
                    variant="outline"
                    className="border-cs-orange/30 text-cs-orange text-[10px]"
                  >
                    <Shield className="h-3 w-3 mr-0.5" />
                    Admin
                  </Badge>
                )}
                {user.role === "MODERATOR" && (
                  <Badge
                    variant="outline"
                    className="border-cs-blue/30 text-cs-blue text-[10px]"
                  >
                    <ShieldCheck className="h-3 w-3 mr-0.5" />
                    Moderator
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <UserBadges
                  ownsCs2={user.ownsCs2}
                  cs2PlaytimeHours={user.cs2PlaytimeHours}
                  cs2Wins={user.cs2Wins}
                  faceitLevel={user.faceitLevel}
                  hidePlaytime={user.hidePlaytime}
                  hideFaceit={user.hideFaceit}
                  profileVisibility={user.profileVisibility}
                />
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-cs-gold" />
                  <strong className="text-foreground">{user.karma}</strong>{" "}
                  karma
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {user._count.opinions} opinions
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {user._count.comments} comments
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <ProfileBio
              userId={user.id}
              bio={user.bio}
              isOwner={isOwner}
            />
          </div>
        </div>

        {/* Petition */}
        {user.petitionSignature && (
          <div className="mt-6 cs-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <ScrollText className="h-5 w-5 text-cs-orange" />
              <h2 className="font-heading font-semibold text-foreground">
                Signed the Petition
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(user.petitionSignature.createdAt).toLocaleDateString()}
            </p>
            {user.petitionSignature.message && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                &ldquo;{user.petitionSignature.message}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Opinions */}
        {user.opinions.length > 0 && (
          <div className="mt-6 cs-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-cs-gold" />
              <h2 className="font-heading font-semibold text-foreground">
                Top Opinions
              </h2>
            </div>
            <div className="space-y-2">
              {user.opinions.map((op: typeof user.opinions[0]) => (
                <Link
                  key={op.id}
                  href={`/opinions/${op.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors block"
                >
                  <span className="cs-stat-number text-sm text-cs-orange w-8 text-center shrink-0">
                    {op.score}
                  </span>
                  <span className="text-sm text-foreground truncate flex-1">
                    {op.title}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {op._count.comments} comments
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
