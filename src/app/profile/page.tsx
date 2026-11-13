import { Suspense } from "react";
import { Kanit } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile } from "@/lib/types";
import { updateProfile } from "./actions";
import "../login/login.css";

const kanit = Kanit({ subsets: ["latin"], weight: ["500", "600"] });

export const metadata = { title: "Student profile · Unjargon" };

async function ProfilePageContent({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const p = (data ?? {}) as Partial<StudentProfile>;

  return (
    <main className={`login-page ${kanit.className}`}>
      <section className="card">
        <div className="card-body">
          <form action={updateProfile}>
            <h2>Your profile</h2>
            <p style={{ marginBottom: "1rem" }}>{user.email}</p>

            {saved && <p className="notice" role="status">Saved.</p>}
            {error && <p className="error" role="alert">{error}</p>}

            <div className="input-box">
              <input name="full_name" placeholder="Full name" defaultValue={p.full_name ?? ""} />
            </div>
            <div className="input-box">
              <input name="school" placeholder="School" defaultValue={p.school ?? ""} />
            </div>
            <div className="input-box">
              <input
                name="grade"
                type="number"
                min={1}
                max={12}
                placeholder="Grade (1–12)"
                defaultValue={p.grade ?? ""}
              />
            </div>
            <div className="input-box">
              <select name="preferred_level" defaultValue={p.preferred_level ?? "grade10"} aria-label="Preferred reading level">
                <option value="expert">Expert</option>
                <option value="grade10">Grade 10</option>
                <option value="grade6">Grade 6</option>
              </select>
            </div>
            <div className="input-box">
              <select name="tts_speed" defaultValue={String(p.tts_speed ?? 1)} aria-label="Audio speed">
                <option value="0.75">Audio 0.75x</option>
                <option value="1">Audio 1x</option>
                <option value="1.25">Audio 1.25x</option>
                <option value="1.5">Audio 1.5x</option>
              </select>
            </div>
            <div className="row">
              <input
                id="dyslexia_font"
                name="dyslexia_font"
                type="checkbox"
                defaultChecked={p.dyslexia_font ?? false}
                style={{ width: "1.25rem", height: "1.25rem", flex: "none" }}
              />
              <label htmlFor="dyslexia_font">Dyslexia-friendly font</label>
            </div>

            <button type="submit" className="primary">
              <h2>Save</h2>
            </button>
            <p>
              <Link className="link" style={{ display: "inline" }} href="/">
                Back to workspace
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent searchParams={searchParams} />
    </Suspense>
  );
}
