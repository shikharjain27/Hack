"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Loader2, Sparkles, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { StudentProfile, ReadingLevel } from "@/lib/types";

export default function OnboardingForm({
  initialProfile,
  redirectTarget,
}: {
  initialProfile: StudentProfile;
  redirectTarget?: string;
}) {
  const router = useRouter();
  const { updateUser, refreshAuth } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [school, setSchool] = useState(initialProfile.school || "");
  const [grade, setGrade] = useState<number>(initialProfile.grade ?? 10);
  const [preferredLevel, setPreferredLevel] = useState<ReadingLevel>(
    initialProfile.preferred_level || "grade10"
  );
  const [dyslexiaFont, setDyslexiaFont] = useState(initialProfile.dyslexia_font || false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(initialProfile.tts_speed || 1.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lockedEmail = initialProfile.email || "demo@unjargon.edu";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

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
          onboarding_completed: true,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to complete onboarding setup.");
      }

      const data = await res.json();
      if (data.profile) {
        updateUser(data.profile);
      }
      await refreshAuth();

      toast.success("Welcome! Your learning profile is ready.");
      const destination = redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : "/";
      router.push(destination);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving details");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Locked Email Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5 pl-3">
          <label className="text-[11px] text-white/50 uppercase tracking-wider">
            Account Email
          </label>
          <span className="flex items-center gap-1 text-[11px] text-white/40">
            <Lock size={11} className="text-indigo-400" />
            Verified &amp; Locked
          </span>
        </div>
        <div className="relative">
          <input
            type="email"
            value={lockedEmail}
            readOnly
            disabled
            aria-label="Account email address (locked)"
            className="login-input opacity-75 cursor-not-allowed bg-white/[0.03] border-white/10 text-white/70 select-none pr-10"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            <Lock size={15} />
          </div>
        </div>
        <p className="text-[11px] text-white/40 mt-1 pl-3">
          Email is tied to your login authentication and cannot be edited.
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
          Your Full Name *
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Maya Chen"
          required
          aria-label="Full name"
          className="login-input"
        />
      </div>

      {/* School / Institution */}
      <div>
        <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
          School / College / Organization
        </label>
        <input
          type="text"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="e.g. Berkeley High or Self-directed"
          aria-label="School or institution"
          className="login-input"
        />
      </div>

      {/* Grade & Reading Level */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
            Target Grade Level
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
            Default Clarity
          </label>
          <select
            value={preferredLevel}
            onChange={(e) => setPreferredLevel(e.target.value as ReadingLevel)}
            aria-label="Preferred reading level"
            className="login-input bg-zinc-900 text-white"
          >
            <option value="grade6">Grade 6 (Plain English)</option>
            <option value="grade10">Grade 10 (High School)</option>
            <option value="expert">Expert (Academic / Raw)</option>
          </select>
        </div>
      </div>

      {/* Narration Speed */}
      <div>
        <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5 pl-3">
          Karaoke Narration Speed
        </label>
        <select
          value={String(ttsSpeed)}
          onChange={(e) => setTtsSpeed(Number(e.target.value))}
          aria-label="Default narration speed"
          className="login-input bg-zinc-900 text-white"
        >
          <option value="0.75">Audio 0.75x (Slower, accessible)</option>
          <option value="1">Audio 1.0x (Standard)</option>
          <option value="1.25">Audio 1.25x (Faster)</option>
          <option value="1.5">Audio 1.5x (Speed reader)</option>
        </select>
      </div>

      {/* Dyslexia Font Toggle */}
      <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass border border-white/10">
        <input
          id="dyslexia_font_toggle"
          type="checkbox"
          checked={dyslexiaFont}
          onChange={(e) => setDyslexiaFont(e.target.checked)}
          className="w-4 h-4 rounded text-indigo-600 bg-white/10 border-white/20 focus:ring-0 cursor-pointer"
        />
        <label htmlFor="dyslexia_font_toggle" className="text-xs text-white/80 cursor-pointer">
          Default to Dyslexia-friendly typography (Lexend)
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="login-btn-primary mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Finalizing Profile…</span>
          </>
        ) : (
          <>
            <span>Complete Setup &amp; Enter</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}
