/**
 * @fileoverview Sign out endpoint.
 *
 * Clears the NextAuth session and redirects to the home page.
 *
 * @route POST /api/auth/signout
 */

import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

/**
 * Sign out handler — clears session and redirects home.
 */
export async function POST() {
  await signOut({ redirect: false });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return NextResponse.redirect(siteUrl);
}
