"use client";
import { useMemo, useState } from "react";
import InputPanel, { type ImageInput } from "@/components/InputPanel";
import LevelSlider, { LEVEL_LABELS, type LevelKey } from "@/components/LevelSlider";
import DiffText from "@/components/DiffText";
import Gauges from "@/components/Gauges";
import KaraokePlayer from "@/components/KaraokePlayer";
import ConceptMap from "@/components/ConceptMap";
import GlossaryCards from "@/components/GlossaryCards";
import QuizCards from "@/components/QuizCards";
import { BookOpen, Network, HelpCircle } from "lucide-react";
import SourcePanel from "@/components/SourcePanel";
import { computeMetrics } from "@/lib/readability";
import type { TransformResult, Verdict, VerifyResult } from "@/lib/types";

export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<ImageInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [cached, setCached] = useState(false);
  const [level, setLevel] = useState<LevelKey>("expert");
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [verifying, setVerifying] = useState(false);
  const [hoverIds, setHoverIds] = useState<string[]>([]);
  const [tab, setTab] = useState<"read" | "map" | "quiz">("read");
  const [selTerm, setSelTerm] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  function flashSource(id: string) {
    setTab("read");
    setFlashId(id);
    setTimeout(() => document.getElementById(`src-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    setTimeout(() => setFlashId(null), 2500);
  }
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
    setCached(false);
    const mock = new URLSearchParams(window.location.search).get("mock") === "1";
    let data: TransformResult | null = null;
    let useMock = mock;
    try {
      const res = await fetch(`/api/transform${mock ? "?mock=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, imageBase64: image?.base64, mimeType: image?.mimeType }),
      });
      if (!res.ok) throw new Error("transform failed");
      data = await res.json();
    } catch {
      // Demo safety net: fall back to the cached fixture so the screen is never blank.
      try {
        const res = await fetch("/api/transform?mock=1", { method: "POST" });
        data = await res.json();
        useMock = true;
        setCached(true);
      } catch { /* nothing more we can do */ }
    }
    if (data) {
      setResult(data);
      setLevel("expert");
      setTab("read");
      setVerdicts({});
      verify(data, useMock);
    }
    setLoading(false);
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
        {!loading && !result && (
          <div className="flex h-72 flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-zinc-500">
            <p className="font-medium">Paste a dense page or drop a photo, then press “Unjargon it”.</p>
            <p className="text-sm">Or start with “Load Sample Input”.</p>
          </div>
        )}
        {!loading && result && metrics && (
          <div className="space-y-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                {result.title}
                {cached && <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-600">cached</span>}
              </h2>
              <p className="text-sm text-zinc-600">
                Grade {metrics.expert.fkGrade} → {metrics[level].fkGrade} <span className="text-zinc-400">({LEVEL_LABELS[level]})</span>
              </p>
            </div>
            <div className="flex gap-2 border-b border-zinc-200">
              {([["read", "Read", BookOpen], ["map", "Map", Network], ["quiz", "Quiz", HelpCircle]] as const).map(([k, label, Icon]) => (
                <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-1 border-b-2 px-3 py-2 text-sm ${tab === k ? "border-indigo-600 font-semibold text-indigo-700" : "border-transparent text-zinc-500"}`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
            {tab === "read" && (
              <>
                <LevelSlider level={level} onChange={setLevel} />
                <DiffText expert={result.levels.expert} current={result.levels[level]} level={level} verdicts={verdicts} verifying={verifying} onHover={setHoverIds} />
                <KaraokePlayer key={level} text={result.levels[level].map((s) => s.text).join(" ")} />
                <Gauges current={metrics[level]} expert={metrics.expert} />
                <SourcePanel sentences={result.source_sentences} highlighted={hoverIds} flashId={flashId} />
              </>
            )}
            {tab === "map" && (
              <>
                <ConceptMap nodes={result.concept_map.nodes} edges={result.concept_map.edges} onSelect={setSelTerm} selectedLabel={selTerm} />
                <GlossaryCards items={result.glossary} selected={selTerm} />
              </>
            )}
            {tab === "quiz" && <QuizCards items={result.quiz} onWrong={flashSource} />}
          </div>
        )}
      </section>
    </main>
  );
}
