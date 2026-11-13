import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

// Server component: renders nothing when signed out (e.g. on /login).
export default async function UserBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <header className="flex items-center justify-end gap-4 border-b px-6 py-2 text-sm">
      <span>{profile?.full_name || user.email}</span>
      <Link className="underline" href="/profile">
        Profile
      </Link>
      <form action={signOut}>
        <button className="underline" type="submit">
          Sign out
        </button>
      </form>
    </header>
  );
}
