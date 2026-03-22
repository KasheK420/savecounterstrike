import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { maskDisplayName, maskSteamId } from "@/lib/mask";

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const [total, signatures] = await Promise.all([
    db.petitionSignature.count(),
    db.petitionSignature.findMany({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            displayName: true,
            steamId: true,
            // No avatarUrl — privacy
          },
        },
      },
    }),
  ]);

  // Mask all sensitive data server-side before sending to client
  const masked = signatures.map((sig) => ({
    id: sig.id,
    maskedName: maskDisplayName(sig.user.displayName),
    maskedSteamId: maskSteamId(sig.user.steamId),
    signedAt: sig.createdAt,
    message: sig.message,
  }));

  return NextResponse.json({
    signatures: masked,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    total,
  });
}
