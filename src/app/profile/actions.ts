"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const LEVELS = ["expert", "grade10", "grade6"] as const;

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const gradeRaw = Number(formData.get("grade"));
  const grade = Number.isInteger(gradeRaw) && gradeRaw >= 1 && gradeRaw <= 12 ? gradeRaw : null;
  const level = String(formData.get("preferred_level"));
  const speed = Number(formData.get("tts_speed"));

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: String(formData.get("full_name") ?? "").trim(),
    school: String(formData.get("school") ?? "").trim(),
    grade,
    preferred_level: (LEVELS as readonly string[]).includes(level) ? level : "grade10",
    dyslexia_font: formData.get("dyslexia_font") === "on",
    tts_speed: speed >= 0.75 && speed <= 1.5 ? speed : 1,
    updated_at: new Date().toISOString(),
  });

  if (error) redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  redirect("/profile?saved=1");
}
