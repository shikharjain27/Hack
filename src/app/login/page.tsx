import { Suspense } from "react";
import Link from "next/link";
import { Globe, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { signIn, signUp, continueAsDemo } from "./actions";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import "./login.css";

export const metadata = { title: "Sign in · Asme" };

async function LoginPageContent({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; notice?: string }>;
}) {
  const { mode, error, notice } = await searchParams;
  const isSignUp = mode === "signup";
  const hasSupabase = isSupabaseConfigured();

  return (
    <main className="login-page">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <section className="login-card">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>

        <div className="login-glass-box">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full liquid-glass mb-4 text-white">
              <Globe size={24} />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif-instrument text-white tracking-tight">
              {isSignUp ? (
                <>
                  Create an <em className="italic">account</em>
                </>
              ) : (
                <>
                  Welcome <em className="italic">back</em>
                </>
              )}
            </h1>
            <p className="text-xs text-white/50 mt-2">
              {isSignUp
                ? "Join Asme & Unjargon to customize your learning space"
                : "Enter your credentials to access your workspace"}
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 text-center">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 text-center">
              {notice}
            </div>
          )}

          {!hasSupabase && (
            <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-white/60 text-center">
              ⚡ Local Demo Mode Active. Sign in with any email or click instant guest access below.
            </div>
          )}

          {/* Form */}
          <form action={isSignUp ? signUp : signIn} className="space-y-4">
            {isSignUp && (
              <div>
                <input
                  name="full_name"
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  required
                  className="login-input"
                />
              </div>
            )}

            <div>
              <input
                name="email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                required
                className="login-input"
              />
            </div>

            <div>
              <input
                name="password"
                type="password"
                placeholder="Password (min 6 characters)"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={6}
                required
                className="login-input"
              />
            </div>

            <button type="submit" className="login-btn-primary mt-2 flex items-center justify-center gap-2">
              <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
              <ArrowRight size={16} />
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-white/50">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <Link
                  className="text-white hover:underline font-medium"
                  href={isSignUp ? "/login" : "/login?mode=signup"}
                >
                  {isSignUp ? "Sign in" : "Sign up here"}
                </Link>
              </p>
            </div>
          </form>

          {/* Guest One-Click Access */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <form action={continueAsDemo}>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-full liquid-glass text-white/80 hover:text-white text-xs font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={14} className="text-indigo-400" />
                Continue as Guest (Instant Workspace Access)
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Suspense fallback={null}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}
