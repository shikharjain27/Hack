"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Save, Loader2, Check, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { StudentProfile, ReadingLevel } from "@/lib/types";

export default function ProfileForm({
  initialProfile,
}: {
  initialProfile: StudentProfile;
}) {
  const { updateUser, refreshAuth } = useAuth();
  const toast = useToast();

  const [initialData, setInitialData] = useState<StudentProfile>(initialProfile);

  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [school, setSchool] = useState(initialProfile.school || "");
  const [grade, setGrade] = useState<number>(initialProfile.grade ?? 10);
  const [preferredLevel, setPreferredLevel] = useState<ReadingLevel>(
    initialProfile.preferred_level || "grade10"
  );
  const [dyslexiaFont, setDyslexiaFont] = useState(initialProfile.dyslexia_font || false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(initialProfile.tts_speed || 1.0);
  const [isSaving, setIsSaving] = useState(false);

  // Smart isDirty state check
  const isDirty =
    fullName.trim() !== (initialData.full_name || "").trim() ||
    school.trim() !== (initialData.school || "").trim() ||
    grade !== (initialData.grade ?? 10) ||
    preferredLevel !== (initialData.preferred_level || "grade10") ||
    dyslexiaFont !== (initialData.dyslexia_font || false) ||
    ttsSpeed !== (initialData.tts_speed || 1.0);

  const userEmail = initialProfile.email || "demo@unjargon.edu";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || isSaving) return;

    setIsSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim() || "Student",
          school: school.trim(),
          grade,
          preferred_level: preferredLevel,
          dyslexia_font: dyslexiaFont,
          tts_speed: ttsSpeed,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile changes.");
      }

      const data = await res.json();
      const updated: StudentProfile = data.profile || {
        ...initialData,
        full_name: fullName.trim(),
        school: school.trim(),
        grade,
        preferred_level: preferredLevel,
        dyslexia_font: dyslexiaFont,
        tts_speed: ttsSpeed,
      };

      // Reset dirty state baseline to newly saved values
      setInitialData(updated);

      // Immediately sync with global auth context (updates avatar / name in navbar right away)
      updateUser(updated);
      await refreshAuth();

      // Clean non-intrusive toast notification (replacing browser alert)
      toast.success("Profile preferences saved successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Read-Only Account Email with Clear Indicator */}
      <div>
        <div className="flex items-center justify-between mb-1.5 pl-3">
          <label className="text-[11px] text-white/50 uppercase tracking-wider">
            Account Email
          </label>
          <span className="flex items-center gap-1 text-[11px] text-white/40">
            <Lock size={11} className="text-indigo-400" />
            Read-only
          </span>
        </div>
        <div className="relative">
          <input
            type="email"
            value={userEmail}
            readOnly
            disabled
            aria-label="Registered account email (read-only)"
            className="login-input opacity-70 cursor-not-allowed bg-white/[0.03] border-white/10 text-white/70 select-none pr-10"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            <Lock size={15} />
          </div>
        </div>
        <p className="text-[11px] text-white/40 mt-1 pl-3">
          To change your registered email, contact your institution administrator.
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
          Full Name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          required
          aria-label="Full name"
          className="login-input"
        />
      </div>

      {/* School / Institution */}
      <div>
        <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
          School / Institution
        </label>
        <input
          type="text"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="School / Organization"
          aria-label="School"
          className="login-input"
        />
      </div>

      {/* Grade & Reading Level */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
            Grade (1–12)
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value) || 10)}
            aria-label="Grade level"
            className="login-input"
          />
        </div>

        <div>
          <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
            Default Level
          </label>
          <select
            value={preferredLevel}
            onChange={(e) => setPreferredLevel(e.target.value as ReadingLevel)}
            aria-label="Default reading level"
            className="login-input bg-zinc-900 text-white"
          >
            <option value="expert">Expert</option>
            <option value="grade10">Grade 10</option>
            <option value="grade6">Grade 6</option>
          </select>
        </div>
      </div>

      {/* Narration Speed */}
      <div>
        <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
          Narration Speed
        </label>
        <select
          value={String(ttsSpeed)}
          onChange={(e) => setTtsSpeed(Number(e.target.value))}
          aria-label="Default narration speed"
          className="login-input bg-zinc-900 text-white"
        >
          <option value="0.75">Audio 0.75x (Slower)</option>
          <option value="1">Audio 1.0x (Normal)</option>
          <option value="1.25">Audio 1.25x (Fast)</option>
          <option value="1.5">Audio 1.5x (Super fast)</option>
        </select>
      </div>

      {/* Dyslexia-Friendly Font Toggle */}
      <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass border border-white/10">
        <input
          id="profile_dyslexia_font"
          type="checkbox"
          checked={dyslexiaFont}
          onChange={(e) => setDyslexiaFont(e.target.checked)}
          className="w-4 h-4 rounded text-indigo-600 bg-white/10 border-white/20 focus:ring-0 cursor-pointer"
        />
        <label htmlFor="profile_dyslexia_font" className="text-xs text-white/80 cursor-pointer">
          Enable Dyslexia-friendly font (Lexend) by default
        </label>
      </div>

      {/* Quiz Mastery Card if present */}
      {initialProfile.quiz_total && initialProfile.quiz_total > 0 ? (
        <div className="p-3.5 rounded-2xl liquid-glass border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">
              Overall Quiz Mastery
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {Math.round(((initialProfile.quiz_score || 0) / initialProfile.quiz_total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(((initialProfile.quiz_score || 0) / initialProfile.quiz_total) * 100)
                )}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-white/50">
            {initialProfile.quiz_score || 0} correct out of {initialProfile.quiz_total} questions attempted
          </p>
        </div>
      ) : null}

      {/* Action Buttons: Smart Save Changes Button (Disabled when not dirty) */}
      <div className="pt-2 space-y-2.5">
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className={`w-full py-3 px-6 rounded-full font-medium text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
            !isDirty || isSaving
              ? "opacity-35 cursor-not-allowed bg-white/15 text-white/40 border border-white/5"
              : "bg-white text-black hover:bg-white/90 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving Preferences…</span>
            </>
          ) : !isDirty ? (
            <>
              <Check size={16} className="opacity-50" />
              <span>No Changes to Save</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>

        <Link
          href="/workspace"
          className="w-full py-2.5 px-4 rounded-full liquid-glass text-white/70 hover:text-white text-xs font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-center"
        >
          <span>Go to Workspace</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </form>
  );
}
