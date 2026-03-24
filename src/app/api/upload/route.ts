/**
 * @fileoverview Image upload and processing endpoint.
 *
 * Handles secure image uploads with validation, processing, and storage.
 * Resizes images to max 1200px width, converts to WebP, limits to 500KB.
 *
 * @route POST /api/upload
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// ── Configuration ───────────────────────────────────────────

const MAX_FILE_SIZE = 500 * 1024; // 500KB max
const MAX_WIDTH = 1200; // Resize if wider
const QUALITY = 80; // WebP quality
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Magic number signatures for file type validation.
 * Prevents MIME type spoofing attacks.
 */
const MAGIC_NUMBERS: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]], // GIF87a or GIF89a
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

/**
 * Validate file content matches declared MIME type using magic numbers.
 * Security measure against MIME type spoofing.
 */
function validateMagicNumber(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_NUMBERS[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
  );
}

/**
 * Get the upload directory path (project-root/public/uploads).
 */
function getUploadDir(): string {
  return join(process.cwd(), "public", "uploads");
}

/**
 * POST /api/upload
 * Upload and process an image.
 * Rate limit: 10 uploads per 5 minutes per IP.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 uploads per 5 minutes per IP
  const rl = rateLimitByIp(request, "upload", 10, 300_000);
  if (rl.limited) return rateLimitResponse(rl);

  const { requireActiveUserApi } = await import("@/lib/admin");
  const userCheck = await requireActiveUserApi();
  if (userCheck.error) return userCheck.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${Math.round(file.size / 1024)}KB). Maximum 500KB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file magic number (prevents MIME type spoofing)
    if (!validateMagicNumber(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content doesn't match declared type. Upload rejected." },
        { status: 400 }
      );
    }

    // Process with sharp — reject if it fails (don't save invalid files)
    let processed: Buffer;
    try {
      processed = await sharp(buffer)
        .resize(MAX_WIDTH, undefined, { withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { error: "Invalid or corrupted image file." },
        { status: 400 }
      );
    }

    // Save processed file
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
