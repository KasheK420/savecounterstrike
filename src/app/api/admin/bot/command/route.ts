import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const commandSchema = z.object({
  command: z.enum(["sync_signers", "import_players", "set_config"]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const result = await requireAdminApi();
  if (result.error) return result.response;

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field typing limitation
      payload: (parsed.data.payload ?? undefined) as any,
    },
  });

  return NextResponse.json(cmd, { status: 201 });
}
