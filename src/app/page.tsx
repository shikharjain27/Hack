"use client";
import { useState } from "react";
import InputPanel from "@/components/InputPanel";
import type { TransformResult } from "@/lib/types";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const mock = new URLSearchParams(window.location.search).get("mock") === "1";
      const res = await fetch(`/api/transform${mock ? "?mock=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-[1440px] grid-cols-[380px_1fr] gap-6 p-6">
      <section>
        <h1 className="mb-3 text-2xl font-bold">Unjargon</h1>
        <InputPanel text={text} setText={setText} onSubmit={run} loading={loading} />
      </section>
      <section>
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-6 animate-pulse rounded bg-zinc-200" />)}
          </div>
        )}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && result && (
          <pre className="overflow-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-100">{JSON.stringify(result, null, 2)}</pre>
        )}
      </section>
    </main>
  );
}
