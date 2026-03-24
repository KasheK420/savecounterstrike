import { NextRequest, NextResponse } from "next/server";
import { getTweet } from "react-tweet/api";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 tweet fetches per minute per IP
  const rl = rateLimitByIp(request, "tweet:fetch", 30, 60_000);
  if (rl.limited) return rateLimitResponse(rl);

  const { id } = await params;

  try {
    const tweet = await getTweet(id);
    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Extract only what we need for custom rendering
    const bestVideo = tweet.video?.variants
      ?.filter((v: { type: string }) => v.type === "video/mp4")
      ?.sort((a: { src: string }, b: { src: string }) => {
        // Prefer 720p
        const aRes = a.src.includes("1280x720") ? 2 : a.src.includes("640x360") ? 1 : 0;
        const bRes = b.src.includes("1280x720") ? 2 : b.src.includes("640x360") ? 1 : 0;
        return bRes - aRes;
      })?.[0];

    return NextResponse.json({
      id: tweet.id_str,
      text: tweet.text,
      author: {
        name: tweet.user?.name,
        handle: tweet.user?.screen_name,
        avatar: tweet.user?.profile_image_url_https?.replace("_normal", "_bigger"),
        verified: tweet.user?.is_blue_verified,
      },
      media: {
        type: tweet.video ? "video" : tweet.photos?.length ? "photo" : null,
        photos: tweet.photos?.map((p: { url: string }) => p.url) || [],
        video: bestVideo ? { src: bestVideo.src, poster: tweet.video?.poster } : null,
      },
      stats: {
        likes: tweet.favorite_count || 0,
        replies: tweet.conversation_count || 0,
      },
      createdAt: tweet.created_at,
      url: `https://x.com/${tweet.user?.screen_name}/status/${tweet.id_str}`,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tweet" }, { status: 500 });
  }
}
