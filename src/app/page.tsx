"use client";
import { useMemo, useState } from "react";
import InputPanel, { type ImageInput } from "@/components/InputPanel";
import LevelSlider, { LEVEL_LABELS, type LevelKey } from "@/components/LevelSlider";
import DiffText from "@/components/DiffText";
import Gauges from "@/components/Gauges";
import SourcePanel from "@/components/SourcePanel";
import { computeMetrics } from "@/lib/readability";
import type { TransformResult, Verdict, VerifyResult } from "@/lib/types";

export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<ImageInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<LevelKey>("expert");
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [verifying, setVerifying] = useState(false);
  const [hoverIds, setHoverIds] = useState<string[]>([]);
  const metrics = useMemo(() => {
    if (!result) return null;
    const m = (k: LevelKey) => computeMetrics(result.levels[k], result.glossary);
    return { expert: m("expert"), grade10: m("grade10"), grade6: m("grade6") };
  }, [result]);

  async function verify(data: TransformResult, mock: boolean) {
    setVerifying(true);
    try {
      const res = await fetch(`/api/verify${mock ? "?mock=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_sentences: data.source_sentences, levels: data.levels }),
      });
      const v: VerifyResult = await res.json();
      if (!res.ok) throw new Error("verify failed");
      setVerdicts(Object.fromEntries(v.verdicts.map((x) => [x.id, x])));
    } catch {
      /* badges simply stay hidden if verification fails */
    } finally {
      setVerifying(false);
    }
  }

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const mock = new URLSearchParams(window.location.search).get("mock") === "1";
      const res = await fetch(`/api/transform${mock ? "?mock=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, imageBase64: image?.base64, mimeType: image?.mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
      setLevel("expert");
      setVerdicts({});
      verify(data, mock);
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
        <InputPanel text={text} setText={setText} image={image} setImage={setImage} onSubmit={run} loading={loading} />
      </section>
      <section>
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-6 animate-pulse rounded bg-zinc-200" />)}
          </div>
        )}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && result && metrics && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{result.title}</h2>
              <p className="text-sm text-zinc-600">
                Grade {metrics.expert.fkGrade} → {metrics[level].fkGrade} <span className="text-zinc-400">({LEVEL_LABELS[level]})</span>
              </p>
            </div>
            <LevelSlider level={level} onChange={setLevel} />
            <DiffText expert={result.levels.expert} current={result.levels[level]} level={level} verdicts={verdicts} verifying={verifying} onHover={setHoverIds} />
            <Gauges current={metrics[level]} expert={metrics.expert} />
            <SourcePanel sentences={result.source_sentences} highlighted={hoverIds} />
          </div>
        )}
      </section>
    </main>
  );
}
