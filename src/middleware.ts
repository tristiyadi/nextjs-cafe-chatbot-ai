import { NextRequest, NextResponse } from "next/server";

// Public paths that don't require authentication
const publicPaths = ["/", "/login", "/register", "/api/auth", "/api/menu", "/api/search"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Always allow static assets and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // For protected routes, check for session cookie
  // Better Auth uses a cookie named "better-auth.session_token" (or similar)
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // Allow order pages for guests too (they can browse/order without auth)
  if (pathname.startsWith("/order")) {
    return NextResponse.next();
  }

  // Kitchen routes require authentication
  if (pathname.startsWith("/kitchen") && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin routes require authentication
  if (pathname.startsWith("/admin") && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
