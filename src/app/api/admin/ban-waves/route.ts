import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const banWaveSchema = z.object({
  date: z.string().transform((s) => new Date(s)),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  estimatedBans: z.number().int().positive().optional(),
  source: z.string().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const banWaves = await db.banWave.findMany({
    orderBy: { date: "desc" },
  });

  return NextResponse.json(banWaves);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = banWaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const banWave = await db.banWave.create({
    data: parsed.data,
  });

  return NextResponse.json(banWave, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.banWave.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
