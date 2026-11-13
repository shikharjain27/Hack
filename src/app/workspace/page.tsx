import { Suspense } from "react";
import { connection } from "next/server";
import { getStudentProfile } from "@/lib/profile";
import Workspace from "@/components/Workspace";

export const metadata = {
  title: "Unjargon Workspace · Accessible Learning Assistant",
};

async function WorkspaceLoader() {
  await connection();
  const profile = await getStudentProfile();
  return <Workspace initialProfile={profile} />;
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={null}>
      <WorkspaceLoader />
    </Suspense>
  );
}
