"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProfileCookie } from "@/lib/profile";
import type { ReadingLevel } from "@/lib/types";

const LEVELS: ReadingLevel[] = ["expert", "grade10", "grade6"];

export async function updateProfile(formData: FormData) {
  const gradeRaw = Number(formData.get("grade"));
  const grade = Number.isInteger(gradeRaw) && gradeRaw >= 1 && gradeRaw <= 12 ? gradeRaw : 10;
  const levelRaw = String(formData.get("preferred_level")) as ReadingLevel;
  const preferred_level = LEVELS.includes(levelRaw) ? levelRaw : "grade10";
  const speed = Number(formData.get("tts_speed"));
  const tts_speed = speed >= 0.75 && speed <= 1.5 ? speed : 1;
  const dyslexia_font = formData.get("dyslexia_font") === "on";
  const full_name = String(formData.get("full_name") ?? "").trim();
  const school = String(formData.get("school") ?? "").trim();
  const intent = String(formData.get("intent") ?? "continue");

  // Save to cookie so client/server components immediately reflect preferences
  await saveProfileCookie({
    full_name,
    school,
    grade,
    preferred_level,
    dyslexia_font,
    tts_speed,
  });

  // Also sync to Supabase DB if authenticated
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
      // Supabase write error; local state was saved
    }
  }

  if (intent === "save_only") {
    redirect("/profile?saved=1");
  }

  // Smooth transition directly to the workspace
  redirect("/workspace");
}
