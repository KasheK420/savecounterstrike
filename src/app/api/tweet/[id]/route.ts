import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const tweetUrl = `https://x.com/i/status/${id}`;
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true&theme=dark&dnt=true`;

    const res = await fetch(oembedUrl);
    if (!res.ok) {
      return NextResponse.json({ html: null }, { status: 404 });
    }

    const data = await res.json();

    return NextResponse.json(
      { html: data.html, author_name: data.author_name },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch {
    return NextResponse.json({ html: null }, { status: 500 });
  }
}
