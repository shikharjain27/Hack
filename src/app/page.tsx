"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Network, HelpCircle, Layers, MessageCircle, Languages, Download, Printer, History,
  Wand2, Loader2, Trash2, Sparkles,
} from "lucide-react";
import InputPanel, { type ImageInput } from "@/components/InputPanel";
import LevelSlider, { LEVEL_LABELS, type LevelKey } from "@/components/LevelSlider";
import DiffText from "@/components/DiffText";
import Gauges from "@/components/Gauges";
import KaraokePlayer from "@/components/KaraokePlayer";
import ConceptMap from "@/components/ConceptMap";
import GlossaryCards from "@/components/GlossaryCards";
import QuizCards from "@/components/QuizCards";
import Flashcards from "@/components/Flashcards";
import AskPanel from "@/components/AskPanel";
import SourcePanel from "@/components/SourcePanel";
import { computeMetrics } from "@/lib/readability";
import { toMarkdown, downloadText } from "@/lib/export";
import { loadHistory, saveHistory, type HistoryEntry } from "@/lib/history";
import type { TransformResult, Verdict, VerifyResult } from "@/lib/types";

type Tab = "read" | "map" | "cards" | "quiz" | "ask";
const TABS: [Tab, string, typeof BookOpen][] = [
  ["read", "Read", BookOpen], ["map", "Map", Network], ["cards", "Flashcards", Layers],
  ["quiz", "Quiz", HelpCircle], ["ask", "Ask", MessageCircle],
];
const LANGUAGES: [string, string][] = [
  ["Spanish", "es-ES"], ["French", "fr-FR"], ["German", "de-DE"], ["Hindi", "hi-IN"],
  ["Portuguese", "pt-PT"], ["Chinese (Simplified)", "zh-CN"], ["Arabic", "ar-SA"], ["Japanese", "ja-JP"],
];

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
  const [tab, setTab] = useState<Tab>("read");
  const [selTerm, setSelTerm] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selection, setSelection] = useState("");
  const [pendingQ, setPendingQ] = useState<string | null>(null);
  const [lang, setLang] = useState(LANGUAGES[0][0]);
  const [translated, setTranslated] = useState<{ level: LevelKey; lang: string; text: string } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [transError, setTransError] = useState(false);

  // localStorage is only readable after hydration, so history is loaded in an effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setHistory(loadHistory()); }, []);
  useEffect(() => {
    const onSel = () => setSelection(window.getSelection()?.toString().trim().slice(0, 400) ?? "");
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const metrics = useMemo(() => {
    if (!result) return null;
    const m = (k: LevelKey) => computeMetrics(result.levels[k], result.glossary);
    return { expert: m("expert"), grade10: m("grade10"), grade6: m("grade6") };
  }, [result]);

  function flashSource(ids: string[] | string) {
    const list = Array.isArray(ids) ? ids : [ids];
    if (!list.length) return;
    setFlashId(list[0]);
    setHoverIds(list);
    setTimeout(() => document.getElementById(`src-${list[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    setTimeout(() => { setFlashId(null); setHoverIds([]); }, 3000);
  }
  const wrongAnswer = (id: string) => { setTab("read"); setTimeout(() => flashSource(id), 80); };

  async function verify(data: TransformResult, mock: boolean, onDone: (v: Record<string, Verdict>) => void) {
    setVerifying(true);
    try {
      const res = await fetch(`/api/verify${mock ? "?mock=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_sentences: data.source_sentences, levels: data.levels }),
      });
      const v: VerifyResult = await res.json();
      if (!res.ok) throw new Error("verify failed");
      const map = Object.fromEntries(v.verdicts.map((x) => [x.id, x]));
      setVerdicts(map);
      onDone(map);
    } catch {
      onDone({});
    } finally {
      setVerifying(false);
    }
  }

  function remember(data: TransformResult, v: Record<string, Verdict>, isCached: boolean) {
    if (isCached) return;
    const entry: HistoryEntry = { id: String(Date.now()), at: Date.now(), title: data.title, result: data, verdicts: v };
    setHistory((h) => {
      const next = [entry, ...h.filter((x) => x.title !== data.title)].slice(0, 10);
      saveHistory(next);
      return next;
    });
  }

  function show(data: TransformResult) {
    setResult(data);
    setLevel("expert");
    setTab("read");
    setVerdicts({});
    setTranslated(null);
  }

  async function run() {
    setLoading(true);
    setCached(false);
    const mock = new URLSearchParams(window.location.search).get("mock") === "1";
    let data: TransformResult | null = null;
    let useMock = mock;
    let fell = false;
    try {
      const res = await fetch(`/api/transform${mock ? "?mock=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, imageBase64: image?.base64, mimeType: image?.mimeType }),
      });
      if (!res.ok) throw new Error("transform failed");
      data = await res.json();
    } catch {
      try {
        const res = await fetch("/api/transform?mock=1", { method: "POST" });
        data = await res.json();
        useMock = true;
        fell = true;
        setCached(true);
      } catch { /* nothing more we can do */ }
    }
    if (data) {
      show(data);
      const d = data;
      verify(d, useMock, (v) => remember(d, v, fell || mock));
    }
    setLoading(false);
  }

  function openHistory(h: HistoryEntry) {
    setCached(false);
    show(h.result);
    setVerdicts(h.verdicts);
    setShowHistory(false);
  }

  async function translate() {
    if (!result) return;
    setTranslating(true);
    setTransError(false);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentences: result.levels[level].map(({ id, text }) => ({ id, text })), language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("failed");
      setTranslated({ level, lang, text: data.sentences.map((s: { text: string }) => s.text).join(" ") });
    } catch {
      setTransError(true);
    } finally {
      setTranslating(false);
    }
  }

  const trans = translated && translated.level === level ? translated : null;
  const langCode = trans ? LANGUAGES.find(([n]) => n === trans.lang)?.[1] : undefined;

  return (
    <div className="mx-auto max-w-[1360px] px-4 pb-16 sm:px-6">
      <header className="no-print flex items-center justify-between py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-300/50">
            <Wand2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Unjargon</h1>
            <p className="text-xs text-zinc-500">Any textbook page, at the reading level you need</p>
          </div>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm">
          <History size={16} /> History {history.length > 0 && <span className="rounded-full bg-indigo-100 px-1.5 text-xs text-indigo-700">{history.length}</span>}
        </button>
      </header>

      {showHistory && (
        <div className="card no-print fade-in mb-5 p-4">
          <div className="mb-2 text-sm font-semibold">Recent pages <span className="font-normal text-zinc-400">· saved in this browser only</span></div>
          {history.length === 0 ? <p className="text-sm text-zinc-500">Nothing yet. Pages you unjargon will appear here.</p> : (
            <ul className="divide-y divide-zinc-100">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2">
                  <button onClick={() => openHistory(h)} className="text-left text-sm hover:text-indigo-700">
                    <span className="font-medium">{h.title}</span>
                    <span className="ml-2 text-xs text-zinc-400">{new Date(h.at).toLocaleString()}</span>
                  </button>
                  <button
                    aria-label="Delete" className="text-zinc-400 hover:text-red-600"
                    onClick={() => { const n = history.filter((x) => x.id !== h.id); setHistory(n); saveHistory(n); }}
                  ><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="no-print lg:sticky lg:top-4 lg:self-start">
          <div className="card p-4">
            <InputPanel text={text} setText={setText} image={image} setImage={setImage} onSubmit={run} loading={loading} />
          </div>
        </section>

        <section className="min-w-0">
          {loading && (
            <div className="card space-y-3 p-6">
              <div className="flex items-center gap-2 text-sm text-indigo-700"><Loader2 className="animate-spin" size={16} /> Reading the page and building your study kit…</div>
              {[100, 92, 96, 70].map((w, i) => <div key={i} className="h-5 animate-pulse rounded bg-indigo-50" style={{ width: `${w}%` }} />)}
            </div>
          )}
          {!loading && !result && (
            <div className="card flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
              <Sparkles className="text-violet-500" size={32} />
              <h2 className="text-2xl font-bold">Turn dense text into something you can actually learn from</h2>
              <p className="max-w-lg text-zinc-500">Paste a paragraph or drop a photo of a textbook page. You get three reading levels with a live diff, a fact-check, audio, a concept map, flashcards, a quiz, translation and a tutor to ask.</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-indigo-700">
                {["Reading levels", "Fact-check", "Karaoke audio", "Concept map", "Flashcards", "Quiz", "Translate", "Ask the page", "Export"].map((f) => (
                  <span key={f} className="rounded-full bg-indigo-50 px-3 py-1">{f}</span>
                ))}
              </div>
            </div>
          )}

          {!loading && result && metrics && (
            <div className="fade-in space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-bold">
                    {result.title}
                    {cached && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800" title="Live AI was unavailable, so a saved example is shown">cached</span>}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Reading grade <b>{metrics.expert.fkGrade}</b> → <b className="text-indigo-700">{metrics[level].fkGrade}</b>
                    <span className="text-zinc-400"> ({LEVEL_LABELS[level]})</span>
                  </p>
                </div>
                <div className="no-print flex gap-2">
                  <button onClick={() => downloadText(`${result.title.replace(/[^\w]+/g, "-")}.md`, toMarkdown(result))} className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm">
                    <Download size={15} /> Study sheet
                  </button>
                  <button onClick={() => window.print()} className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm">
                    <Printer size={15} /> Print
                  </button>
                </div>
              </div>

              <nav className="no-print flex gap-1 overflow-x-auto border-b border-indigo-100">
                {TABS.map(([k, label, Icon]) => (
                  <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${tab === k ? "border-indigo-600 font-semibold text-indigo-700" : "border-transparent text-zinc-500 hover:text-indigo-600"}`}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </nav>

              {tab === "read" && (
                <div className="space-y-4">
                  <LevelSlider level={level} onChange={setLevel} />
                  <DiffText expert={result.levels.expert} current={result.levels[level]} level={level} verdicts={verdicts} verifying={verifying} onHover={setHoverIds} />
                  {selection && (
                    <div className="no-print fade-in flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm">
                      <span className="line-clamp-1 flex-1 text-violet-900">“{selection}”</span>
                      <button
                        onClick={() => { setPendingQ(`Explain this simply: "${selection}"`); setTab("ask"); }}
                        className="btn-primary px-3 py-1.5 text-xs"
                      >Explain this</button>
                    </div>
                  )}
                  <KaraokePlayer key={`${level}-${trans?.lang ?? "en"}`} text={trans ? trans.text : result.levels[level].map((s) => s.text).join(" ")} lang={langCode} />
                  <div className="card no-print flex flex-wrap items-center gap-3 p-3 text-sm">
                    <Languages size={16} className="text-indigo-600" />
                    <span className="font-medium">Translate this level</span>
                    <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-lg border border-zinc-200 px-2 py-1.5">
                      {LANGUAGES.map(([n]) => <option key={n}>{n}</option>)}
                    </select>
                    <button onClick={translate} disabled={translating} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
                      {translating && <Loader2 size={13} className="animate-spin" />} {translating ? "Translating…" : "Translate"}
                    </button>
                    {trans && <button onClick={() => setTranslated(null)} className="text-xs text-zinc-500 underline">Show English</button>}
                    {transError && <span className="text-xs text-red-600">Translation failed. Try again.</span>}
                  </div>
                  {result.diagram_alt_text && (
                    <div className="card p-4 text-sm"><b>Diagram, described:</b> <span className="text-zinc-600">{result.diagram_alt_text}</span></div>
                  )}
                  <Gauges current={metrics[level]} expert={metrics.expert} />
                  <SourcePanel sentences={result.source_sentences} highlighted={hoverIds} flashId={flashId} />
                </div>
              )}
              {tab === "map" && (
                <div className="space-y-4">
                  <ConceptMap nodes={result.concept_map.nodes} edges={result.concept_map.edges} onSelect={setSelTerm} selectedLabel={selTerm} />
                  <GlossaryCards items={result.glossary} selected={selTerm} />
                </div>
              )}
              {tab === "cards" && <Flashcards result={result} />}
              {tab === "quiz" && <QuizCards items={result.quiz} onWrong={wrongAnswer} />}
              {tab === "ask" && (
                <div className="space-y-4">
                  <AskPanel
                    sentences={result.source_sentences} levelLabel={LEVEL_LABELS[level]}
                    onCite={(ids) => setHoverIds(ids)} pending={pendingQ} clearPending={() => setPendingQ(null)}
                  />
                  <SourcePanel sentences={result.source_sentences} highlighted={hoverIds} flashId={flashId} />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
