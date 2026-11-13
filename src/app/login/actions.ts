"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { saveProfileCookie } from "@/lib/profile";

function fail(mode: string, message: string): never {
  redirect(`/login?mode=${mode}&error=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isSupabaseConfigured()) {
    // Demo mode login
    await saveProfileCookie({
      full_name: email.split("@")[0] || "Demo Student",
    });
    redirect("/workspace");
  }

  const supabase = await createClient();
  if (!supabase) redirect("/workspace");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) fail("signin", error.message);
  redirect("/workspace");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (password.length < 6) fail("signup", "Password must be at least 6 characters.");

  if (!isSupabaseConfigured()) {
    // Demo mode signup
    await saveProfileCookie({
      full_name: fullName || email.split("@")[0] || "Student",
    });
    redirect("/profile");
  }

  const supabase = await createClient();
  if (!supabase) redirect("/profile");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) fail("signup", error.message);

  // No session means email confirmation is still switched on in Supabase.
  if (!data.session) {
    redirect(
      `/login?mode=signin&notice=${encodeURIComponent("Check your email to confirm your account, then sign in.")}`,
    );
  }
  redirect("/profile");
}

export async function continueAsDemo() {
  await saveProfileCookie({
    full_name: "Demo Student",
    grade: 10,
    preferred_level: "grade10",
    dyslexia_font: false,
    tts_speed: 1.0,
  });
  redirect("/workspace");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  const cookieStore = await cookies();
  cookieStore.delete("unjargon_student_profile");
  redirect("/login");
}
