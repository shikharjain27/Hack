import Link from "next/link";
import { connection } from "next/server";
import { getStudentProfile } from "@/lib/profile";
import { Sparkles, ArrowLeft } from "lucide-react";
import NavbarAuthSlot from "@/components/NavbarAuthSlot";

export default async function UserBar() {
  await connection();
  const profile = await getStudentProfile();

  return (
    <header className="no-print sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#09090b]/80 px-6 py-3 backdrop-blur-xl text-sm shadow-md">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
          title="Return to Landing Page"
        >
          <ArrowLeft size={13} />
          Landing
        </Link>

        <div className="h-4 w-px bg-white/10" />

        <Link href="/workspace" className="flex items-center gap-2 font-bold text-white text-base tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black font-black text-sm">
            U
          </span>
          <span>Unjargon</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="rounded-full liquid-glass border border-white/10 px-2.5 py-0.5 text-indigo-300 font-medium">
            Tier: {profile.preferred_level.toUpperCase()}
          </span>
          {profile.dyslexia_font && (
            <span className="rounded-full liquid-glass border border-emerald-500/30 px-2.5 py-0.5 text-emerald-300 font-medium flex items-center gap-1">
              <Sparkles size={11} /> Dyslexia Font (Lexend)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NavbarAuthSlot />
      </div>
    </header>
  );
}
