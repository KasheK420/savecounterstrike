import { NextRequest, NextResponse } from "next/server";
import { getTweet } from "react-tweet/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const tweet = await getTweet(id);

    if (!tweet) {
      return NextResponse.json({ data: null }, { status: 404 });
    }

    return NextResponse.json(
      { data: tweet },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
