import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAuthenticatedProfile } from "@/lib/profile";
import ProfileForm from "./ProfileForm";
import { Settings, ArrowLeft } from "lucide-react";
import "../login/login.css";

export const metadata = {
  title: "Student Profile · Unjargon",
  description: "Personalize your reading levels and accessibility preferences.",
};

async function ProfilePageContent() {
  await connection();
  const profile = await getAuthenticatedProfile();

  // Route Guard: If unauthenticated, redirect to Sign In and return here after login
  if (!profile) {
    redirect("/login?redirect=/profile");
  }

  return (
    <main className="login-page">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <section className="login-card max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <Link
            href="/workspace"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            Open Workspace &rarr;
          </Link>
        </div>

        <div className="login-glass-box">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full liquid-glass mb-3 text-white border border-white/10 shadow-lg">
              <Settings size={22} className="text-indigo-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif-instrument text-white tracking-tight">
              Student <em className="italic">Profile</em>
            </h1>
            <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
              Personalize your reading levels and accessibility preferences
            </p>
          </div>

          <ProfileForm initialProfile={profile} />
        </div>
      </section>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  );
}
