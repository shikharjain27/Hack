import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAuthenticatedProfile } from "@/lib/profile";
import OnboardingForm from "./OnboardingForm";
import { Sparkles } from "lucide-react";
import "../login/login.css";

export const metadata = {
  title: "Complete Your Profile · Unjargon",
  description: "Set up your reading level, typography, and learning preferences.",
};

async function OnboardingContent({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  await connection();
  const profile = await getAuthenticatedProfile();
  const { redirect: redirectTarget } = await searchParams;

  // Route protection: If not signed in at all, redirect to login
  if (!profile) {
    redirect(
      `/login${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`
    );
  }

  // If already onboarded and no pending onboarding needed, redirect to destination
  if (profile.onboarding_completed) {
    redirect(redirectTarget || "/");
  }

  return (
    <main className="login-page">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-indigo-500/[0.05] blur-[130px] rounded-full pointer-events-none" />

      <section className="login-card max-w-lg">
        <div className="login-glass-box">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full liquid-glass mb-3 text-white border border-white/10 shadow-lg">
              <Sparkles size={22} className="text-indigo-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif-instrument text-white tracking-tight">
              Personalize Your <em className="italic">Workspace</em>
            </h1>
            <p className="text-xs text-white/50 mt-1.5 max-w-xs mx-auto">
              Welcome to Unjargon! Customize your reading accessibility settings to tailor every textbook transformation.
            </p>
          </div>

          <OnboardingForm initialProfile={profile} redirectTarget={redirectTarget} />
        </div>
      </section>
    </main>
  );
}

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <OnboardingContent searchParams={searchParams} />
    </Suspense>
  );
}
