/**
 * @fileoverview Public petition signatures listing.
 *
 * Returns paginated signature list with privacy-masked user data.
 * Used for the public signatures page.
 *
 * @route GET /api/signatures?page={number}
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { maskDisplayName, maskSteamId } from "@/lib/mask";

/** Number of signatures per page */
const PAGE_SIZE = 50;

/**
 * GET /api/signatures
 * Returns paginated signatures with masked user data for privacy.
 */
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
            // No avatarUrl — privacy protection
          },
        },
      },
    }),
  ]);

  // Mask all sensitive data server-side before sending to client
  const masked = signatures.map((sig: typeof signatures[0]) => ({
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
