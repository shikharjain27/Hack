import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getStudentProfile } from "@/lib/profile";
import { updateProfile } from "./actions";
import { Settings, ArrowRight, ArrowLeft } from "lucide-react";
import "../login/login.css";

export const metadata = { title: "Student profile · Asme" };

async function ProfilePageContent({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  await connection();
  const profile = await getStudentProfile();

  return (
    <main className="login-page">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <section className="login-card max-w-lg">
        <div className="mb-6">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to workspace
          </Link>
        </div>

        <div className="login-glass-box">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full liquid-glass mb-4 text-white">
              <Settings size={22} />
            </div>
            <h1 className="text-4xl font-serif-instrument text-white tracking-tight">
              Student <em className="italic">Profile</em>
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Personalize your reading levels and accessibility preferences
            </p>
          </div>

          {saved && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 text-center">
              ✓ Preferences successfully saved!
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 text-center">
              {error}
            </div>
          )}

          <form action={updateProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
                Full Name
              </label>
              <input
                name="full_name"
                placeholder="Full name"
                defaultValue={profile.full_name}
                aria-label="Full name"
                className="login-input"
              />
            </div>

            <div>
              <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
                School / Institution
              </label>
              <input
                name="school"
                placeholder="School / Organization"
                defaultValue={profile.school}
                aria-label="School"
                className="login-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
                  Grade (1–12)
                </label>
                <input
                  name="grade"
                  type="number"
                  min={1}
                  max={12}
                  placeholder="Grade"
                  defaultValue={profile.grade ?? 10}
                  aria-label="Grade level"
                  className="login-input"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
                  Default Level
                </label>
                <select
                  name="preferred_level"
                  defaultValue={profile.preferred_level ?? "grade10"}
                  aria-label="Default reading level"
                  className="login-input bg-zinc-900 text-white"
                >
                  <option value="expert">Expert</option>
                  <option value="grade10">Grade 10</option>
                  <option value="grade6">Grade 6</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
                Narration Speed
              </label>
              <select
                name="tts_speed"
                defaultValue={String(profile.tts_speed ?? 1)}
                aria-label="Default narration speed"
                className="login-input bg-zinc-900 text-white"
              >
                <option value="0.75">Audio 0.75x (Slower)</option>
                <option value="1">Audio 1.0x (Normal)</option>
                <option value="1.25">Audio 1.25x (Fast)</option>
                <option value="1.5">Audio 1.5x (Super fast)</option>
              </select>
            </div>

            {/* Quiz Performance Card */}
            {profile.quiz_total && profile.quiz_total > 0 ? (
              <div className="p-3.5 rounded-2xl liquid-glass border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
                    Overall Quiz Mastery
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {Math.round(((profile.quiz_score || 0) / profile.quiz_total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((profile.quiz_score || 0) / profile.quiz_total) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-white/50">
                  {profile.quiz_score || 0} correct out of {profile.quiz_total} questions attempted
                </p>

                {profile.quiz_history && profile.quiz_history.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <span className="text-[10px] uppercase text-white/40 block">Recent Sessions</span>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {profile.quiz_history.slice(0, 4).map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] bg-white/[0.02] p-1.5 rounded-lg border border-white/5"
                        >
                          <span className="truncate max-w-[170px] text-white/80">{h.title}</span>
                          <span className="font-mono text-emerald-300">
                            {h.score}/{h.total} ({h.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass">
              <input
                id="dyslexia_font"
                name="dyslexia_font"
                type="checkbox"
                defaultChecked={profile.dyslexia_font}
                className="w-4 h-4 rounded text-indigo-600 bg-white/10 border-white/20 focus:ring-0"
              />
              <label htmlFor="dyslexia_font" className="text-xs text-white/80 cursor-pointer">
                Enable Dyslexia-friendly font (Lexend) by default
              </label>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                name="intent"
                value="continue"
                className="login-btn-primary flex items-center justify-center gap-2"
              >
                <span>Save & Go to Workspace</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="submit"
                name="intent"
                value="save_only"
                className="w-full py-2.5 px-4 rounded-full liquid-glass text-white/70 hover:text-white text-xs font-medium hover:bg-white/5 transition-all cursor-pointer"
              >
                Save Preferences Only
              </button>
            </div>
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
