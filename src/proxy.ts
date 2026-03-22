import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/tracking";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Track page views (non-blocking)
  trackPageView(request).catch(() => {});

  // Redirect old /videos to /media
  if (pathname === "/videos" || pathname.startsWith("/videos/")) {
    const newPath = pathname.replace("/videos", "/media");
    return NextResponse.redirect(new URL(newPath, request.url), 301);
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    // Admin protection is handled in the admin layout via server-side session check
    // Proxy only handles basic request-level concerns here
  }

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
