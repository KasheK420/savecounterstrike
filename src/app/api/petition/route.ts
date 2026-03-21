import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { petitionSignSchema } from "@/lib/validations";
import { filterProfanity } from "@/lib/profanity";

export async function GET() {
  const [count, recentSigners] = await Promise.all([
    db.petitionSignature.count(),
    db.petitionSignature.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
            steamId: true,
            ownsCs2: true,
            cs2PlaytimeHours: true,
            profileVisibility: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ count, recentSigners });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = petitionSignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await db.petitionSignature.findUnique({
    where: { userId: session.user.userId },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already signed the petition" },
      { status: 409 }
    );
  }

  const cleanMessage = parsed.data.message
    ? filterProfanity(parsed.data.message)
    : undefined;

  const signature = await db.petitionSignature.create({
    data: {
      userId: session.user.userId,
      message: cleanMessage,
    },
  });

  return NextResponse.json(signature, { status: 201 });
}
