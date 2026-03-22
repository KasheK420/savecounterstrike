import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

export interface NotableSigner {
  steamId: string;
  label: string;
  role: string; // "Pro Player" | "Organization" | "Streamer" | "Youtuber" | "Community Figure"
  avatarOverride?: string | null;
}

interface NotableConfig {
  signers: NotableSigner[];
}

export async function GET() {
  const config = await db.siteConfig.findUnique({
    where: { key: "notable_signers" },
  });

  const data = (config?.value as unknown as NotableConfig) || { signers: [] };

  // Enrich with actual signature status + user data
  const enriched = await Promise.all(
    data.signers.map(async (signer) => {
      const user = await db.user.findUnique({
        where: { steamId: signer.steamId },
        select: {
          displayName: true,
          avatarUrl: true,
          petitionSignature: { select: { createdAt: true } },
        },
      });

      return {
        label: signer.label,
        role: signer.role,
        avatarUrl: signer.avatarOverride || user?.avatarUrl || null,
        hasSigned: !!user?.petitionSignature,
        signedAt: user?.petitionSignature?.createdAt || null,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

  const body = await request.json();
  const signers: NotableSigner[] = body.signers || [];

  await db.siteConfig.upsert({
    where: { key: "notable_signers" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: { value: { signers } as any },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { key: "notable_signers", value: { signers } as any },
  });

  return NextResponse.json({ ok: true });
}
