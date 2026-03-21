import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ signed: false, authenticated: false });
  }

  const existing = await db.petitionSignature.findUnique({
    where: { userId: session.user.userId },
  });

  return NextResponse.json({
    signed: !!existing,
    authenticated: true,
  });
}
