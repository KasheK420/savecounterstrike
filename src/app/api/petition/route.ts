import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { petitionSignSchema } from "@/lib/validations";
import { filterProfanity } from "@/lib/profanity";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

const USER_SELECT_WITH_STATS = {
  id: true,
  displayName: true,
  avatarUrl: true,
  ownsCs2: true,
  cs2PlaytimeHours: true,
  faceitLevel: true,
  faceitElo: true,
  profileVisibility: true,
} as const;

const USER_SELECT_BASE = {
  id: true,
  displayName: true,
  avatarUrl: true,
} as const;

export async function GET() {
  // Try with stats fields first, fall back to base if migration not applied yet
  try {
    const [count, recentSigners] = await Promise.all([
      db.petitionSignature.count(),
      db.petitionSignature.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: USER_SELECT_WITH_STATS },
        },
      }),
    ]);
    return NextResponse.json({ count, recentSigners });
  } catch {
    // Stats columns likely don't exist yet — query without them
    const [count, recentSigners] = await Promise.all([
      db.petitionSignature.count(),
      db.petitionSignature.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: USER_SELECT_BASE },
        },
      }),
    ]);
    return NextResponse.json({ count, recentSigners });
  }
}

export async function POST(request: NextRequest) {
  // Rate limit: 3 petition attempts per 10 minutes per IP
  const rl = rateLimitByIp(request, "petition:sign", 3, 600_000);
  if (rl.limited) return rateLimitResponse(rl);

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

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const signatureId = searchParams.get("id");

  if (!signatureId) {
    return NextResponse.json(
      { error: "Missing signature id" },
      { status: 400 }
    );
  }

  const signature = await db.petitionSignature.findUnique({
    where: { id: signatureId },
  });

  if (!signature) {
    return NextResponse.json(
      { error: "Signature not found" },
      { status: 404 }
    );
  }

  await db.petitionSignature.delete({
    where: { id: signatureId },
  });

  return NextResponse.json({ success: true });
}
