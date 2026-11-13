"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function fail(mode: string, message: string): never {
  redirect(`/login?mode=${mode}&error=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) fail("signin", error.message);
  redirect("/");
}

export async function signUp(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) fail("signup", "Password must be at least 6 characters.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? "").trim(),
    password,
    options: { data: { full_name: String(formData.get("full_name") ?? "").trim() } },
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
