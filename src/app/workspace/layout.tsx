import { Suspense } from "react";
import UserBar from "@/components/UserBar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30 selection:text-white relative">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-indigo-500/[0.04] blur-[140px] rounded-full" />
        <div className="absolute top-1/3 left-10 w-[500px] h-[350px] bg-purple-500/[0.03] blur-[130px] rounded-full" />
      </div>

      <Suspense fallback={null}>
        <UserBar />
      </Suspense>

      <main className="relative z-10 flex-1">
        {children}
      </main>
    </div>
  );
}
