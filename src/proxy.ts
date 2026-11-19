import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session cookie and guards protected routes (/profile, /onboarding).
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/profile") || pathname.startsWith("/onboarding");
  const isLogin = pathname.startsWith("/login");

  // If Supabase is not configured, guard via local session cookie
  if (!url || !key || !url.startsWith("http")) {
    const hasProfileCookie = Boolean(request.cookies.get("unjargon_student_profile")?.value);

    if (isProtected && !hasProfileCookie) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Guard protected routes: redirect unauthenticated users to login with redirect param
    if (!user && isProtected) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect already authenticated users away from /login back to home
    if (user && isLogin) {
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const target = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/";
      return NextResponse.redirect(new URL(target, request.url));
    }
  } catch {
    // If Supabase request fails, allow pass-through
    return response;
  }

  return response;
}

export const config = {
  // Skip static assets and API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|sample/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
