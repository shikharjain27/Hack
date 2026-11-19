"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { saveProfileCookie, clearProfileCookie, getAuthenticatedProfile } from "@/lib/profile";

function fail(mode: string, message: string, redirectTarget?: string): never {
  const url = `/login?mode=${mode}&error=${encodeURIComponent(message)}${
    redirectTarget ? `&redirect=${encodeURIComponent(redirectTarget)}` : ""
  }`;
  redirect(url);
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTarget = String(formData.get("redirect") ?? "").trim();
  const finalDestination = redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : "/";

  if (!isSupabaseConfigured()) {
    // Demo / Local mode login
    const current = await getAuthenticatedProfile();
    const isExistingOnboarded = Boolean(
      current &&
      current.onboarding_completed &&
      (current.email === email || current.school)
    );

    await saveProfileCookie({
      email,
      full_name: current?.full_name || email.split("@")[0] || "Student",
      onboarding_completed: isExistingOnboarded,
    });

    if (isExistingOnboarded) {
      redirect(finalDestination);
    } else {
      redirect(
        `/onboarding${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`
      );
    }
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect(finalDestination);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) fail("signin", error.message, redirectTarget);

  // Check if profile setup is complete
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const isComplete = Boolean(
      profile && (profile.onboarding_completed || (profile.school && profile.grade))
    );

    if (!isComplete) {
      redirect(
        `/onboarding${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`
      );
    }
  }

  redirect(finalDestination);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const redirectTarget = String(formData.get("redirect") ?? "").trim();

  if (password.length < 6) {
    fail("signup", "Password must be at least 6 characters.", redirectTarget);
  }

  if (!isSupabaseConfigured()) {
    // Demo mode signup -> route to onboarding
    await saveProfileCookie({
      email,
      full_name: fullName || email.split("@")[0] || "Student",
      school: "",
      grade: null,
      onboarding_completed: false,
    });
    redirect(
      `/onboarding${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect("/onboarding");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) fail("signup", error.message, redirectTarget);

  // If email confirmation is required
  if (!data.session) {
    redirect(
      `/login?mode=signin&notice=${encodeURIComponent(
        "Check your email to confirm your account, then sign in."
      )}${redirectTarget ? `&redirect=${encodeURIComponent(redirectTarget)}` : ""}`
    );
  }

  redirect(
    `/onboarding${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`
  );
}

export async function continueAsDemo(formData: FormData) {
  const redirectTarget = String(formData.get("redirect") ?? "").trim();
  const finalDestination = redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : "/";

  await saveProfileCookie({
    email: "demo@unjargon.edu",
    full_name: "Demo Student",
    school: "Lincoln High",
    grade: 10,
    preferred_level: "grade10",
    dyslexia_font: false,
    tts_speed: 1.0,
    onboarding_completed: true,
  });

  redirect(finalDestination);
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
  await clearProfileCookie();
  redirect("/");
}
