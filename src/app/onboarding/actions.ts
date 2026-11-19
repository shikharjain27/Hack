"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProfileCookie, getAuthenticatedProfile } from "@/lib/profile";
import type { ReadingLevel } from "@/lib/types";

const LEVELS: ReadingLevel[] = ["expert", "grade10", "grade6"];

export async function completeOnboarding(formData: FormData) {
  const current = await getAuthenticatedProfile();

  const full_name = String(formData.get("full_name") ?? "").trim() || current?.full_name || "Student";
  const school = String(formData.get("school") ?? "").trim();
  const gradeRaw = Number(formData.get("grade"));
  const grade = Number.isInteger(gradeRaw) && gradeRaw >= 1 && gradeRaw <= 12 ? gradeRaw : 10;
  const levelRaw = String(formData.get("preferred_level")) as ReadingLevel;
  const preferred_level = LEVELS.includes(levelRaw) ? levelRaw : "grade10";
  const speed = Number(formData.get("tts_speed"));
  const tts_speed = speed >= 0.75 && speed <= 1.5 ? speed : 1.0;
  const dyslexia_font = formData.get("dyslexia_font") === "on";
  const redirectTarget = String(formData.get("redirect") ?? "").trim();
  const finalDestination = redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : "/";

  // Persist to cookie
  await saveProfileCookie({
    full_name,
    school,
    grade,
    preferred_level,
    dyslexia_font,
    tts_speed,
    onboarding_completed: true,
  });

  // Also sync to Supabase database if active
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
      // Local profile saved
    }
  }

  redirect(finalDestination);
}
