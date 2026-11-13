"use client";

import { useState } from "react";
import { SAMPLE_TEXT } from "@/lib/sample";
import type { TransformResult } from "@/lib/types";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransformResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
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
    <main className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 p-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">Unjargon</h1>
        <textarea
          className="h-80 w-full rounded-lg border p-3"
          placeholder="Paste a dense textbook paragraph…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="rounded border px-3 py-2" onClick={() => setText(SAMPLE_TEXT.trim())}>
            Load Sample Input
          </button>
          <button
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            disabled={loading || !text.trim()}
            onClick={run}
          >
            Unjargon it
          </button>
        </div>
      </section>
      <section>
        {loading && <div className="h-80 animate-pulse rounded-lg bg-gray-200" />}
        {error && <p className="text-red-600">{error}</p>}
        {result && <pre className="max-h-[80vh] overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>}
      </section>
    </main>
  );
}
