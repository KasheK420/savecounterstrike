import { NextResponse } from "next/server";
import { getRevenueData } from "@/lib/revenue";

// Cache response for 15 minutes
export const revalidate = 900;

export async function GET() {
  const data = await getRevenueData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
