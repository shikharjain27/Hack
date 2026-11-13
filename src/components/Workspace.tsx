"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Network,
  HelpCircle,
  Layers,
  MessageCircle,
  Languages,
  Download,
  Printer,
  History,
  Wand2,
  Loader2,
  Trash2,
  Sparkles,
  Type,
  User,
  Settings,
  BrainCircuit,
  FileDown,
  FileText,
} from "lucide-react";
import InputPanel, { type FileInput } from "@/components/InputPanel";
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
import GapFinder from "@/components/GapFinder";
import { SAMPLE_TEXT } from "@/lib/sample";
import { computeMetrics } from "@/lib/readability";
import { toMarkdown, downloadText, downloadUnjargonedPDF } from "@/lib/export";
import { loadHistory, saveHistory, type HistoryEntry } from "@/lib/history";
import type { TransformResult, Verdict, VerifyResult, StudentProfile } from "@/lib/types";

type Tab = "read" | "gap" | "map" | "cards" | "quiz" | "ask";
const TABS: [Tab, string, typeof BookOpen][] = [
  ["read", "Read", BookOpen],
  ["gap", "Gap Finder", BrainCircuit],
  ["map", "Concept Map", Network],
  ["cards", "Flashcards", Layers],
  ["quiz", "Quiz", HelpCircle],
  ["ask", "Ask Tutor", MessageCircle],
];

const LANGUAGES: [string, string][] = [
  ["Spanish", "es-ES"],
  ["French", "fr-FR"],
  ["German", "de-DE"],
  ["Hindi", "hi-IN"],
  ["Portuguese", "pt-PT"],
  ["Chinese (Simplified)", "zh-CN"],
  ["Arabic", "ar-SA"],
  ["Japanese", "ja-JP"],
];

export default function Workspace({ initialProfile }: { initialProfile?: StudentProfile }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<FileInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connected to student profile preferences
  const [level, setLevel] = useState<LevelKey>(initialProfile?.preferred_level || "grade10");
  const [dyslexiaFont, setDyslexiaFont] = useState<boolean>(initialProfile?.dyslexia_font || false);
  const ttsSpeed = initialProfile?.tts_speed || 1;
  const [userScore, setUserScore] = useState<{ score: number; total: number } | null>(
    initialProfile?.quiz_score !== undefined && initialProfile?.quiz_total
      ? { score: initialProfile.quiz_score, total: initialProfile.quiz_total }
      : null
  );

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

  // Sync if initialProfile changes
  useEffect(() => {
    if (initialProfile?.preferred_level) {
      setLevel(initialProfile.preferred_level);
    }
    if (initialProfile?.dyslexia_font !== undefined) {
      setDyslexiaFont(initialProfile.dyslexia_font);
    }
    if (initialProfile?.quiz_score !== undefined && initialProfile?.quiz_total) {
      setUserScore({ score: initialProfile.quiz_score, total: initialProfile.quiz_total });
    }
  }, [initialProfile]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

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
    setTimeout(
      () => document.getElementById(`src-${list[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50,
    );
    setTimeout(() => {
      setFlashId(null);
      setHoverIds([]);
    }, 3000);
  }

  const wrongAnswer = (id: string) => {
    setTab("read");
    setTimeout(() => flashSource(id), 80);
  };

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
    const entry: HistoryEntry = {
      id: String(Date.now()),
      at: Date.now(),
      title: data.title,
      result: data,
      verdicts: v,
    };
    setHistory((h) => {
      const next = [entry, ...h.filter((x) => x.id !== entry.id)].slice(0, 10);
      saveHistory(next);
      return next;
    });
  }

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    setVerdicts({});
    setTranslated(null);
    try {
      const mock = new URLSearchParams(window.location.search).get("mock") === "1";
      const payload = image
        ? { fileBase64: image.base64, imageBase64: image.base64, mimeType: image.mimeType }
        : { text };
      const res = await fetch(`/api/transform${mock ? "?mock=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transform failed");
      setResult(data);
      const isCached = Boolean(res.headers.get("X-Unjargon-Cached"));
      setCached(isCached);
      verify(data, mock, (v) => remember(data, v, isCached));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function restore(entry: HistoryEntry) {
    setResult(entry.result);
    setVerdicts(entry.verdicts);
    setCached(false);
    setText(entry.result.source_sentences.map((s) => s.text).join(" "));
    setShowHistory(false);
  }

  async function translate() {
    if (!result) return;
    setTranslating(true);
    setTransError(false);
    try {
      const currentText = result.levels[level].map((s) => s.text).join(" ");
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText, targetLanguage: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translate failed");
      setTranslated({ level, lang, text: data.translatedText });
    } catch {
      setTransError(true);
    } finally {
      setTranslating(false);
    }
  }

  const trans = translated && translated.level === level ? translated : null;
  const langCode = trans ? LANGUAGES.find(([n]) => n === trans.lang)?.[1] : undefined;

  return (
    <div className={`min-h-screen relative bg-black text-white ${dyslexiaFont ? "font-dyslexia" : ""}`}>
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.06),transparent_50%)] pointer-events-none" />

      {/* Student Profile Quick-Control Banner */}
      <div className="no-print border-b border-white/10 bg-white/[0.02] px-6 py-2.5 text-xs backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-white/80">
            <User size={13} className="text-indigo-400" />
            <span className="font-semibold text-white">{initialProfile?.full_name || "Student"}</span>
            {initialProfile?.school && <span className="text-white/40">· {initialProfile.school}</span>}
            <span className="rounded-full liquid-glass border border-white/10 px-2.5 py-0.5 text-indigo-300 font-medium">
              Profile: {LEVEL_LABELS[initialProfile?.preferred_level || "grade10"]}
            </span>
            {userScore && userScore.total > 0 && (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-emerald-300 font-medium">
                Quiz Avg: {Math.round((userScore.score / userScore.total) * 100)}% ({userScore.score}/{userScore.total})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/document"
              className="flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold text-xs text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 transition-all shadow-sm"
              title="Transform an entire textbook PDF chapter"
            >
              <FileText size={12} className="text-indigo-400" />
              <span>Full PDF Book Unjargoner</span>
            </Link>

            <button
              onClick={() => setDyslexiaFont(!dyslexiaFont)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-xs transition-all cursor-pointer ${
                dyslexiaFont
                  ? "bg-white text-black font-semibold shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                  : "liquid-glass text-white/70 hover:text-white border border-white/10"
              }`}
            >
              <Type size={12} />
              {dyslexiaFont ? "Dyslexia Font: ON (Lexend)" : "Dyslexia Font: OFF"}
            </button>

            <Link
              href="/profile"
              className="flex items-center gap-1 text-white/60 hover:text-white transition-colors"
            >
              <Settings size={12} />
              Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        {/* Left Column: Input Panel */}
        <section className="no-print space-y-4 lg:col-span-5">
          <div className="liquid-glass rounded-3xl p-5 border border-white/10 shadow-2xl">
            <InputPanel
              text={text}
              setText={setText}
              image={image}
              setImage={setImage}
              onSubmit={run}
              loading={loading}
            />
          </div>

          {/* History Panel */}
          <div className="liquid-glass rounded-2xl p-4 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <History size={13} className="text-indigo-400" />
                Session History ({history.length})
              </button>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem("unjargon-history-v1");
                    setHistory([]);
                  }}
                  className="text-xs text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Clear history"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            {showHistory && (
              <ul className="mt-3 space-y-1.5 text-xs border-t border-white/10 pt-2.5">
                {history.length === 0 ? (
                  <li className="text-white/40 text-[11px] py-1 text-center">No past runs saved yet.</li>
                ) : (
                  history.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between rounded-xl p-2 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <button
                        onClick={() => restore(h)}
                        className="truncate text-left font-medium text-white/80 hover:text-white mr-2"
                      >
                        {h.title}
                      </button>
                      <span className="text-[10px] text-white/40 shrink-0 font-mono">
                        {new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </section>

        {/* Right Column: Dashboard Workspace */}
        <section className="space-y-4 lg:col-span-7">
          {loading && (
            <div className="liquid-glass rounded-3xl flex h-96 flex-col items-center justify-center gap-3 p-6 text-center text-white/60 border border-white/10 shadow-2xl">
              <Loader2 className="animate-spin text-indigo-400" size={34} />
              <p className="font-semibold text-white text-base">Unjargoning Textbook Content…</p>
              <p className="max-w-md text-xs text-white/50 leading-relaxed">
                Deconstructing syntactic complexity across Expert, Grade 10, and Grade 6 prose, calculating Flesch-Kincaid gauges, and generating concept maps.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300 shadow-xl">
              <p className="font-semibold mb-1">Analysis encountered an issue</p>
              <p className="text-xs text-rose-300/80">{error}</p>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="liquid-glass rounded-3xl flex h-96 flex-col items-center justify-center gap-3.5 p-6 text-center border border-white/10 shadow-2xl">
              <div className="rounded-full liquid-glass p-3.5 text-indigo-300 border border-white/10">
                <Sparkles size={24} />
              </div>
              <h3 className="font-semibold text-white text-base">No textbook content loaded yet</h3>
              <p className="max-w-md text-xs text-white/50 leading-relaxed">
                Paste textbook notes, upload a page photograph, or click the button below to load the built-in Krebs Cycle biochemistry sample.
              </p>
              <button
                onClick={() => {
                  setText(SAMPLE_TEXT.trim());
                  setImage(null);
                }}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all cursor-pointer shadow-lg"
              >
                <Wand2 size={14} /> Load Krebs Cycle Sample
              </button>
            </div>
          )}

          {result && metrics && (
            <div className="space-y-4">
              {/* Header with Title, Metrics Pill, and Export Actions */}
              <div className="liquid-glass rounded-3xl flex flex-wrap items-center justify-between gap-4 p-5 border border-white/10 shadow-2xl">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h2 className="text-2xl font-serif-instrument text-white tracking-tight">
                      {result.title}
                    </h2>
                    {cached && (
                      <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        Cached sample
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 flex items-center gap-2">
                    <span>Flesch-Kincaid Readability:</span>
                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono font-semibold text-indigo-300">
                      Grade {metrics[level].fkGrade}
                    </span>
                    <span className="text-white/40">({LEVEL_LABELS[level]})</span>
                  </p>
                </div>

                <div className="no-print flex items-center gap-2">
                  <button
                    onClick={() => downloadUnjargonedPDF(result, level)}
                    className="liquid-glass rounded-full flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-500/20 hover:bg-indigo-500/30 hover:text-white transition-all cursor-pointer border border-indigo-500/30 shadow-sm"
                    title="Generate and download unjargoned PDF study sheet"
                  >
                    <FileDown size={14} className="text-indigo-400" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={() =>
                      downloadText(`${result.title.replace(/[^\w]+/g, "-")}.md`, toMarkdown(result))
                    }
                    className="liquid-glass rounded-full flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer border border-white/10"
                  >
                    <Download size={13} /> Study sheet
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="liquid-glass rounded-full flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer border border-white/10"
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>
              </div>

              {/* Navigation Tabs with Liquid Glass Pill Design */}
              <nav className="no-print liquid-glass rounded-2xl p-1.5 border border-white/10 flex gap-1.5 overflow-x-auto shadow-md">
                {TABS.map(([k, label, Icon]) => {
                  const isActive = tab === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setTab(k)}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-black font-semibold shadow-md"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Tab 1: Read */}
              {tab === "read" && (
                <div className="space-y-4">
                  <LevelSlider level={level} onChange={setLevel} />

                  <DiffText
                    expert={result.levels.expert}
                    current={result.levels[level]}
                    level={level}
                    verdicts={verdicts}
                    verifying={verifying}
                    onHover={setHoverIds}
                  />

                  {selection && (
                    <div className="no-print fade-in flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-xs text-white">
                      <span className="line-clamp-1 flex-1 text-indigo-200">“{selection}”</span>
                      <button
                        onClick={() => {
                          setPendingQ(`Explain this simply: "${selection}"`);
                          setTab("ask");
                        }}
                        className="rounded-xl px-3 py-1.5 bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all cursor-pointer"
                      >
                        Explain selection
                      </button>
                    </div>
                  )}

                  <KaraokePlayer
                    key={`${level}-${trans?.lang ?? "en"}`}
                    text={trans ? trans.text : result.levels[level].map((s) => s.text).join(" ")}
                    lang={langCode}
                    initialRate={ttsSpeed}
                    initialLexend={dyslexiaFont}
                  />

                  {/* Multi-language Translation Bar */}
                  <div className="liquid-glass rounded-2xl no-print flex flex-wrap items-center gap-3 p-3.5 border border-white/10 text-xs shadow-md">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                      <Languages size={15} />
                      <span>Translate prose:</span>
                    </div>
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value)}
                      className="rounded-xl border border-white/10 bg-zinc-900/90 text-white px-2.5 py-1.5 text-xs outline-none"
                    >
                      {LANGUAGES.map(([n]) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                    <button
                      onClick={translate}
                      disabled={translating}
                      className="rounded-xl px-3.5 py-1.5 text-xs font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {translating && <Loader2 size={12} className="animate-spin" />}
                      <span>{translating ? "Translating…" : "Translate"}</span>
                    </button>
                    {trans && (
                      <button
                        onClick={() => setTranslated(null)}
                        className="text-xs text-white/50 hover:text-white underline cursor-pointer"
                      >
                        Show English
                      </button>
                    )}
                    {transError && <span className="text-xs text-rose-400">Translation failed. Try again.</span>}
                  </div>

                  {result.diagram_alt_text && (
                    <div className="liquid-glass rounded-2xl p-4 border border-white/10 text-xs text-white/80 shadow-md">
                      <b className="text-white block mb-1">Textbook Diagram Described:</b>
                      <span className="text-white/60 leading-relaxed">{result.diagram_alt_text}</span>
                    </div>
                  )}

                  <Gauges current={metrics[level]} expert={metrics.expert} />
                  <SourcePanel sentences={result.source_sentences} highlighted={hoverIds} flashId={flashId} />
                </div>
              )}

              {/* Tab 2: Gap Finder (Personalized Misconception Detector) */}
              {tab === "gap" && (
                <div className="space-y-4">
                  <GapFinder
                    sourceSentences={result.source_sentences}
                    levelLabel={LEVEL_LABELS[level]}
                    onCite={(ids) => {
                      setHoverIds(ids);
                      setTab("read");
                    }}
                  />
                </div>
              )}

              {/* Tab 3: Concept Map */}
              {tab === "map" && (
                <div className="space-y-4">
                  <ConceptMap
                    nodes={result.concept_map.nodes}
                    edges={result.concept_map.edges}
                    onSelect={setSelTerm}
                    selectedLabel={selTerm}
                  />
                  <GlossaryCards items={result.glossary} selected={selTerm} />
                </div>
              )}

              {/* Tab 3: Flashcards */}
              {tab === "cards" && <Flashcards result={result} />}

              {/* Tab 4: Quiz Cards */}
              {tab === "quiz" && (
                <QuizCards
                  items={result.quiz}
                  sourceSentences={result.source_sentences}
                  title={result.title}
                  onViewSourceInRead={(sourceId) => {
                    setHoverIds([sourceId]);
                    setTab("read");
                  }}
                  onQuizSubmitted={(score, total) => {
                    setUserScore((prev) => ({
                      score: (prev?.score || 0) + score,
                      total: (prev?.total || 0) + total,
                    }));
                  }}
                />
              )}

              {/* Tab 5: Ask AI Tutor */}
              {tab === "ask" && (
                <div className="space-y-4">
                  <AskPanel
                    sentences={result.source_sentences}
                    levelLabel={LEVEL_LABELS[level]}
                    onCite={(ids) => setHoverIds(ids)}
                    pending={pendingQ}
                    clearPending={() => setPendingQ(null)}
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
