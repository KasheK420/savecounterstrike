import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const commandSchema = z.object({
  command: z.enum(["sync_signers", "import_players", "set_config"]),
  payload: z.any().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = commandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const cmd = await db.botCommand.create({
    data: {
      command: parsed.data.command,
      payload: parsed.data.payload ?? undefined,
    },
  });

  return NextResponse.json(cmd, { status: 201 });
}
