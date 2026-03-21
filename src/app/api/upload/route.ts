import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const MAX_WIDTH = 1200;
const QUALITY = 80;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// In Docker standalone, process.cwd() is /app
// Uploads go to /app/public/uploads which is mounted as a volume
function getUploadDir(): string {
  return join(process.cwd(), "public", "uploads");
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${Math.round(file.size / 1024)}KB). Maximum 500KB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let processed: Buffer;
    try {
      processed = await sharp(buffer)
        .resize(MAX_WIDTH, undefined, { withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
    } catch {
      // If sharp fails (e.g. corrupted image), save original
      processed = buffer;
    }

    const filename = `${randomUUID()}.webp`;
    const uploadDir = getUploadDir();

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), processed);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
