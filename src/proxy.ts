import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session cookie and redirects signed-out users to /login when Supabase is enabled.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Gracefully allow local/demo mode if Supabase keys are not set
  if (!url || !key || !url.startsWith("http")) {
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
    const isLogin = request.nextUrl.pathname.startsWith("/login");

    if (!user && !isLogin) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user && isLogin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    // If Supabase request fails, allow pass-through
    return response;
  }

  return response;
}

export const config = {
  // Skip static assets and API routes (the Gemini routes stay open for the demo).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|sample/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
