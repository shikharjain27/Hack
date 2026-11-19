import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearProfileCookie } from "@/lib/profile";

export async function POST() {
  try {
    const supabase = await createClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore supabase signout errors
      }
    }

    await clearProfileCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Logout failed" },
      { status: 500 }
    );
  }
}
