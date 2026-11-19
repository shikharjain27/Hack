import { NextResponse } from "next/server";
import { getAuthenticatedProfile } from "@/lib/profile";

export async function GET() {
  try {
    const profile = await getAuthenticatedProfile();

    if (!profile) {
      return NextResponse.json({
        user: null,
        profile: null,
        isAuthenticated: false,
        isOnboarded: false,
      });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email || "demo@unjargon.edu",
        full_name: profile.full_name,
      },
      profile,
      isAuthenticated: true,
      isOnboarded: Boolean(profile.onboarding_completed),
    });
  } catch (error) {
    return NextResponse.json(
      {
        user: null,
        profile: null,
        isAuthenticated: false,
        isOnboarded: false,
        error: error instanceof Error ? error.message : "Auth check failed",
      },
      { status: 500 }
    );
  }
}
