import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { petitionSignSchema } from "@/lib/validations";

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

  const signature = await db.petitionSignature.create({
    data: {
      userId: session.user.userId,
      message: parsed.data.message,
    },
  });

  return NextResponse.json(signature, { status: 201 });
}
