/**
 * @fileoverview CS2 revenue estimation endpoint.
 *
 * Returns calculated revenue data based on market analysis and benchmarks.
 * Response is cached for 15 minutes to reduce API load.
 *
 * @route GET /api/revenue
 */

import { NextResponse } from "next/server";
import { getRevenueData } from "@/lib/revenue";

// Cache response for 15 minutes
export const revalidate = 900;

/**
 * GET /api/revenue
 * Return cached revenue estimation data.
 */
export async function GET() {
  const data = await getRevenueData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
