import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import type { StudentProfile, ReadingLevel } from "./types";

export const DEFAULT_PROFILE: StudentProfile = {
  id: "demo-student",
  email: "demo@unjargon.edu",
  full_name: "Demo Student",
  school: "Lincoln High",
  grade: 10,
  preferred_level: "grade10",
  dyslexia_font: false,
  tts_speed: 1.0,
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const PROFILE_COOKIE = "unjargon_student_profile";

/**
 * Returns the currently authenticated user profile, or null if logged out.
 */
export async function getAuthenticatedProfile(): Promise<StudentProfile | null> {
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
          const isComplete = Boolean(
            data.onboarding_completed ?? (data.school && data.grade)
          );
          return {
            id: user.id,
            email: user.email || "",
            full_name: data.full_name || user.email?.split("@")[0] || "Student",
            school: data.school || "",
            grade: data.grade ?? 10,
            preferred_level: (data.preferred_level as ReadingLevel) || "grade10",
            dyslexia_font: Boolean(data.dyslexia_font),
            tts_speed: Number(data.tts_speed) || 1.0,
            onboarding_completed: isComplete,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          };
        }

        // User authenticated in auth, but profile row missing or incomplete
        return {
          ...DEFAULT_PROFILE,
          id: user.id,
          email: user.email || "",
          full_name: user.email?.split("@")[0] || "Student",
          school: "",
          grade: null,
          onboarding_completed: false,
        };
      }
    } catch {
      // Supabase error; fall through to cookie
    }
  }

  // Fallback to cookie profile if user is logged in via demo mode
  const stored = cookieStore.get(PROFILE_COOKIE)?.value;
  if (stored) {
    try {
      const parsed = JSON.parse(decodeURIComponent(stored));
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        email: parsed.email || DEFAULT_PROFILE.email,
        onboarding_completed: parsed.onboarding_completed ?? Boolean(parsed.school && parsed.grade),
      };
    } catch {
      // Invalid JSON
    }
  }

  return null;
}

export async function getStudentProfile(): Promise<StudentProfile> {
  const authProfile = await getAuthenticatedProfile();
  return authProfile || DEFAULT_PROFILE;
}

export async function saveProfileCookie(profile: Partial<StudentProfile>) {
  const cookieStore = await cookies();
  const current = (await getAuthenticatedProfile()) || DEFAULT_PROFILE;
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

export async function clearProfileCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PROFILE_COOKIE);
}
