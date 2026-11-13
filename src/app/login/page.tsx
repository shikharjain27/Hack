import { Suspense } from "react";
import { Kanit } from "next/font/google";
import { signIn, signUp } from "./actions";
import "./login.css";

const kanit = Kanit({ subsets: ["latin"], weight: ["500", "600"] });

export const metadata = { title: "Sign in · Unjargon" };

async function LoginPageContent({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; notice?: string }>;
}) {
  const { mode, error, notice } = await searchParams;
  const isSignUp = mode === "signup";

  return (
    <main className={`login-page ${kanit.className}`}>
      <section className="card">
        <div className="card-body">
          <form action={isSignUp ? signUp : signIn}>
            <h2>{isSignUp ? "Create account" : "Welcome"}</h2>

            {error && <p className="error" role="alert">{error}</p>}
            {notice && <p className="notice" role="status">{notice}</p>}

            {isSignUp && (
              <div className="input-box">
                <input name="full_name" type="text" placeholder="Full name" autoComplete="name" required />
              </div>
            )}
            <div className="input-box">
              <input name="email" type="email" placeholder="Email" autoComplete="email" required />
            </div>
            <div className="input-box">
              <input
                name="password"
                type="password"
                placeholder="Password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="primary">
              <h2>{isSignUp ? "Sign up" : "Login"}</h2>
            </button>

            <p>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <a className="link" style={{ display: "inline" }} href={isSignUp ? "/login" : "/login?mode=signup"}>
                {isSignUp ? "Sign in" : "Sign up here"}
              </a>
            </p>
          </form>
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
