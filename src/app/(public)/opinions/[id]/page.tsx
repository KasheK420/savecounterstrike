import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { stripHtml } from "@/lib/sanitize";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserBadges } from "@/components/shared/UserBadges";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OpinionDetail } from "@/components/opinions/OpinionDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const opinion = await db.opinion.findUnique({ where: { id } });
  if (!opinion) return { title: "Not Found" };
  return {
    title: opinion.title,
    description: stripHtml(opinion.content).slice(0, 160),
  };
}

export default async function OpinionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opinion = await db.opinion.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          ownsCs2: true,
          cs2PlaytimeHours: true,
          cs2Wins: true,
          faceitLevel: true,
          profileVisibility: true,
        },
      },
      _count: { select: { comments: true } },
    },
  });

  if (!opinion) notFound();

  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/opinions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cs-orange transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          All Opinions
        </Link>

        <OpinionDetail opinion={JSON.parse(JSON.stringify(opinion))} />
      </div>
    </div>
  );
}
