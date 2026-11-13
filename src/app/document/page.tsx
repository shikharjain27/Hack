import { Suspense } from "react";
import { connection } from "next/server";
import { getStudentProfile } from "@/lib/profile";
import DocumentUnjargoner from "@/components/DocumentUnjargoner";

export const metadata = {
  title: "Document Unjargoner · Full PDF Edition",
};

async function DocumentPageLoader() {
  await connection();
  const profile = await getStudentProfile();
  return <DocumentUnjargoner initialProfile={profile} />;
}

export default function DocumentPage() {
  return (
    <Suspense fallback={null}>
      <DocumentPageLoader />
    </Suspense>
  );
}
