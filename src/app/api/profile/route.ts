import { NextResponse } from "next/server";
import { getAuthenticatedProfile, saveProfileCookie } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { ReadingLevel } from "@/lib/types";

const LEVELS: ReadingLevel[] = ["expert", "grade10", "grade6"];

export async function PUT(req: Request) {
  try {
    const authProfile = await getAuthenticatedProfile();
    if (!authProfile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const full_name = typeof body.full_name === "string" ? body.full_name.trim() : authProfile.full_name;
    const school = typeof body.school === "string" ? body.school.trim() : authProfile.school;
    const gradeRaw = Number(body.grade);
    const grade = Number.isInteger(gradeRaw) && gradeRaw >= 1 && gradeRaw <= 12 ? gradeRaw : (authProfile.grade ?? 10);
    const levelRaw = body.preferred_level as ReadingLevel;
    const preferred_level = LEVELS.includes(levelRaw) ? levelRaw : authProfile.preferred_level;
    const speedRaw = Number(body.tts_speed);
    const tts_speed = speedRaw >= 0.75 && speedRaw <= 1.5 ? speedRaw : authProfile.tts_speed;
    const dyslexia_font = typeof body.dyslexia_font === "boolean" ? body.dyslexia_font : authProfile.dyslexia_font;
    const onboarding_completed = body.onboarding_completed !== undefined ? Boolean(body.onboarding_completed) : true;

    // Save to cookie
    const updated = await saveProfileCookie({
      full_name,
      school,
      grade,
      preferred_level,
      dyslexia_font,
      tts_speed,
      onboarding_completed,
    });

    // Also update Supabase database if available
    const supabase = await createClient();
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            full_name,
            school,
            grade,
            preferred_level,
            dyslexia_font,
            tts_speed,
            updated_at: new Date().toISOString(),
          });
        }
      } catch {
        // Fall back to cookie save
      }
    }

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Profile update failed" },
      { status: 500 }
    );
  }
}
