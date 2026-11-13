import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import type { StudentProfile, ReadingLevel } from "./types";

export const DEFAULT_PROFILE: StudentProfile = {
  id: "demo-student",
  full_name: "Demo Student",
  school: "Lincoln High",
  grade: 10,
  preferred_level: "grade10",
  dyslexia_font: false,
  tts_speed: 1.0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const PROFILE_COOKIE = "unjargon_student_profile";

export async function getStudentProfile(): Promise<StudentProfile> {
  const cookieStore = await cookies();

  // Try Supabase if available
  const supabase = await createClient();
  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (data) {
          return {
            id: user.id,
            full_name: data.full_name || user.email?.split("@")[0] || "Student",
            school: data.school || "",
            grade: data.grade ?? 10,
            preferred_level: (data.preferred_level as ReadingLevel) || "grade10",
            dyslexia_font: Boolean(data.dyslexia_font),
            tts_speed: Number(data.tts_speed) || 1.0,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          };
        }

        // User authenticated but no profile row yet
        return {
          ...DEFAULT_PROFILE,
          id: user.id,
          full_name: user.email?.split("@")[0] || "Student",
        };
      }
    } catch {
      // Supabase error; fall through to cookie
    }
  }

  // Fallback to cookie profile
  const stored = cookieStore.get(PROFILE_COOKIE)?.value;
  if (stored) {
    try {
      return { ...DEFAULT_PROFILE, ...JSON.parse(decodeURIComponent(stored)) };
    } catch {
      // Invalid JSON; return default
    }
  }

  return DEFAULT_PROFILE;
}

export async function saveProfileCookie(profile: Partial<StudentProfile>) {
  const cookieStore = await cookies();
  const current = await getStudentProfile();
  const updated: StudentProfile = {
    ...current,
    ...profile,
    updated_at: new Date().toISOString(),
  };

  cookieStore.set(PROFILE_COOKIE, encodeURIComponent(JSON.stringify(updated)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "lax",
  });

  return updated;
}
