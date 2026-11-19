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
  Settings,
  BrainCircuit,
  FileDown,
  FileText,
  ArrowLeft,
  ChevronDown,
  ShieldCheck,
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
import NavbarAuthSlot from "@/components/NavbarAuthSlot";
import { SAMPLE_CHIPS } from "@/lib/sample";
import { computeMetrics } from "@/lib/readability";
import { toMarkdown, downloadText, downloadUnjargonedPDF } from "@/lib/export";
import { loadHistory, saveHistory, type HistoryEntry } from "@/lib/history";
import type { TransformResult, Verdict, VerifyResult, StudentProfile } from "@/lib/types";

type Tab = "read" | "gap" | "map" | "cards" | "quiz" | "ask";

const TABS: [Tab, string, typeof BookOpen][] = [
  ["read", "Unjargon", BookOpen],
  ["gap", "Gap Finder", BrainCircuit],
  ["map", "Mind Map", Network],
  ["quiz", "Quiz", HelpCircle],
  ["cards", "Flashcards", Layers],
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

  const keywordStats = useMemo(() => {
    if (!result) return { retained: 0, total: 0, pct: 100 };
    const terms: string[] = [];
    if (result.preserved_terms?.length) {
      for (const pt of result.preserved_terms) {
        terms.push(typeof pt === "string" ? pt : pt.term);
      }
    } else {
      for (const g of result.glossary) terms.push(g.term);
    }
    const currentText = result.levels[level].map((s) => s.text).join(" ").toLowerCase();
    let retained = 0;
    for (const t of terms) {
      const clean = t.toLowerCase().replace(/[()]/g, "").trim();
      if (currentText.includes(clean)) {
        retained++;
      } else if (clean.includes(" ")) {
        const parts = clean.split(" ").filter((p) => p.length > 3);
        if (parts.length > 0 && parts.some((p) => currentText.includes(p))) {
          retained++;
        }
      }
    }
    const total = Math.max(terms.length, 1);
    const pct = Math.min(100, Math.round((retained / total) * 100));
    return { retained, total, pct };
  }, [result, level]);

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

  function detectSampleType(t: string): "dsa" | "networking" | "os" | "krebs" | "quantum" | "law" | null {
    const lower = t.toLowerCase();
    if (
      lower.includes("red-black") ||
      lower.includes("black-height") ||
      lower.includes("tree rotation") ||
      lower.includes("structural invariants") ||
      lower.includes("pyruvate") ||
      lower.includes("krebs")
    )
      return "dsa";
    if (
      lower.includes("border gateway protocol") ||
      lower.includes("bgp") ||
      lower.includes("autonomous system") ||
      lower.includes("as_path") ||
      lower.includes("local_pref") ||
      lower.includes("quantum")
    )
      return "networking";
    if (
      lower.includes("virtual memory") ||
      lower.includes("page table") ||
      lower.includes("tlb") ||
      lower.includes("translation lookaside") ||
      lower.includes("page fault") ||
      lower.includes("commerce")
    )
      return "os";
    return null;
  }

  async function verify(data: TransformResult, mockSample?: string, onDone?: (v: Record<string, Verdict>) => void) {
    setVerifying(true);
    try {
      const query = mockSample ? `?mock=${mockSample}` : "";
      const res = await fetch(`/api/verify${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_sentences: data.source_sentences, levels: data.levels }),
      });
      const v: VerifyResult = await res.json();
      if (!res.ok) throw new Error("verify failed");
      const map = Object.fromEntries(v.verdicts.map((x) => [x.id, x]));
      setVerdicts(map);
      onDone?.(map);
    } catch {
      onDone?.({});
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

  async function run(overrideText?: string, forcedSampleId?: string) {
    const textToRun = overrideText ?? text;
    setLoading(true);
    setError(null);
    setResult(null);
    setVerdicts({});
    setTranslated(null);
    setTab("read");

    const sampleType = forcedSampleId || detectSampleType(textToRun);

    try {
      const mock = new URLSearchParams(window.location.search).get("mock") === "1";
      const payload = image && !overrideText
        ? { fileBase64: image.base64, imageBase64: image.base64, mimeType: image.mimeType }
        : { text: textToRun };

      const mockQuery = mock ? "?mock=1" : "";
      const res = await fetch(`/api/transform${mockQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || "Transform failed";
        if (typeof msg === "string" && (msg.includes("401") || msg.includes("UNAUTHENTICATED") || msg.includes("API key not valid") || msg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED"))) {
          msg = "Invalid Gemini API Key: Please check your GOOGLE_API_KEY in .env. You can obtain or refresh your key from Google AI Studio (https://aistudio.google.com/app/apikey).";
        }
        throw new Error(msg);
      }
      setResult(data);
      const isCached = Boolean(res.headers.get("X-Unjargon-Cached"));
      setCached(isCached);
      verify(data, mock ? "1" : sampleType || undefined, (v) => remember(data, v, isCached));
    } catch (e) {
      // If this is one of the built-in samples and live LLM failed, load the pre-computed sample fixture
      if (sampleType) {
        try {
          const res = await fetch(`/api/transform?mock=${sampleType}`, { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            setResult(data);
            setCached(true);
            setError(null);
            verify(data, sampleType, (v) => remember(data, v, true));
            return;
          }
        } catch {
          // ignore
        }
      }
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
    setTab("read");
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
    <div className={`h-screen w-screen flex flex-col overflow-hidden bg-black text-white ${dyslexiaFont ? "font-dyslexia" : ""}`}>
      {/* 1. Single Unified Workspace Header (56px / h-14) */}
      <header className="h-14 px-4 sm:px-6 border-b border-white/10 bg-[#09090b]/90 backdrop-blur-xl flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3.5">
          <Link
            href="/"
            className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
            title="Return to Landing Page"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Landing</span>
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <Link href="/workspace" className="flex items-center gap-2 font-bold text-white text-base tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black font-black text-xs shadow-md">
              U
            </span>
            <span className="tracking-tight">Unjargon</span>
          </Link>

          <span className="rounded-full liquid-glass border border-white/10 px-2.5 py-0.5 text-indigo-300 font-medium text-[11px] sm:text-xs">
            Tier: {level.toUpperCase()}
          </span>

          <div className="hidden md:block h-4 w-px bg-white/10" />

          <Link
            href="/document"
            className="hidden md:flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-xs text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all shadow-sm"
            title="Transform an entire multi-page PDF book chapter"
          >
            <FileText size={12} className="text-indigo-400" />
            <span>Full PDF Book Unjargoner</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Dyslexia Font Toggle */}
          <button
            onClick={() => setDyslexiaFont(!dyslexiaFont)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-xs transition-all cursor-pointer ${
              dyslexiaFont
                ? "bg-white text-black font-semibold shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                : "liquid-glass text-white/70 hover:text-white border border-white/10"
            }`}
            title="Toggle dyslexia-friendly Lexend typography"
          >
            <Type size={12} />
            <span className="hidden sm:inline">
              {dyslexiaFont ? "Dyslexia Font: ON" : "Dyslexia Font: OFF"}
            </span>
            <span className="sm:hidden">{dyslexiaFont ? "Lexend" : "Font"}</span>
          </button>

          {/* Profile Settings Link */}
          <Link
            href="/profile"
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors px-2 py-1"
            title="Open Student Profile Settings"
          >
            <Settings size={13} />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          {/* Dynamic Navbar Auth Slot (Avatar + Initials + Dropdown) */}
          <NavbarAuthSlot />
        </div>
      </header>

      {/* 2. Full-Viewport Split-Pane Workspace (h-[calc(100vh-56px)]) */}
      <div className="flex-1 h-[calc(100vh-56px)] flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT PANE: Source Anchor & Collapsible History (38%) */}
        <section className="lg:w-[38%] h-full flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 bg-[#09090b]/40 p-4 gap-3 shrink-0 z-10">
          {/* Textbook Input Card flexing to fill vertical space */}
          <div className="liquid-glass rounded-2xl p-4 border border-white/10 shadow-xl flex-1 flex flex-col overflow-hidden min-h-0">
            <InputPanel
              text={text}
              setText={setText}
              image={image}
              setImage={setImage}
              onSubmit={() => run()}
              loading={loading}
            />
          </div>

          {/* Docked Session History Drawer */}
          <div className="shrink-0 rounded-2xl liquid-glass border border-white/10 overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-expanded={showHistory}
              >
                <History size={13} className="text-indigo-400" />
                <span>Session History ({history.length})</span>
                <ChevronDown
                  size={13}
                  className={`text-white/40 transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`}
                />
              </button>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem("unjargon-history-v1");
                    setHistory([]);
                  }}
                  className="text-xs text-white/40 hover:text-rose-400 transition-colors cursor-pointer p-1"
                  title="Clear session history"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {showHistory && (
              <div className="border-t border-white/10 max-h-40 overflow-y-auto p-2 space-y-1">
                {history.length === 0 ? (
                  <p className="text-white/40 text-[11px] py-2 text-center">No past runs saved yet.</p>
                ) : (
                  history.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => restore(h)}
                      className="flex items-center justify-between rounded-xl px-2.5 py-1.5 hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <span className="truncate text-xs font-medium text-white/80 group-hover:text-white mr-2">
                        {h.title}
                      </span>
                      <span className="text-[10px] text-white/40 shrink-0 font-mono">
                        {new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANE: Tabbed Study Studio (62%) */}
        <section className="lg:w-[62%] h-full flex flex-col overflow-hidden bg-[#09090b]/60 flex-1 min-w-0">
          {/* Persistent Tool Tab Bar Pinned at Top */}
          <div className="shrink-0 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 z-20">
            <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
              {TABS.map(([k, label, Icon]) => {
                const isActive = tab === k;
                return (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 sm:px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-black font-semibold shadow-md"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Export Toolbar (visible when result is loaded) */}
            {result && (
              <div className="no-print flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => downloadUnjargonedPDF(result, level)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold border border-indigo-500/30 transition-all cursor-pointer shadow-sm"
                  title="Generate and download unjargoned PDF study sheet"
                >
                  <FileDown size={13} />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
                <button
                  onClick={() =>
                    downloadText(`${result.title.replace(/[^\w]+/g, "-")}.md`, toMarkdown(result))
                  }
                  className="p-1.5 rounded-xl liquid-glass text-white/70 hover:text-white text-xs border border-white/10 transition-all cursor-pointer"
                  title="Download Markdown study sheet"
                >
                  <Download size={13} />
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-xl liquid-glass text-white/70 hover:text-white text-xs border border-white/10 transition-all cursor-pointer"
                  title="Print study guide"
                >
                  <Printer size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Studio Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 space-y-4">
            {/* Loading State */}
            {loading && (
              <div className="liquid-glass rounded-3xl flex h-96 flex-col items-center justify-center gap-3.5 p-6 text-center text-white/60 border border-white/10 shadow-2xl my-auto">
                <Loader2 className="animate-spin text-indigo-400" size={36} />
                <p className="font-semibold text-white text-base">Unjargoning Textbook Content…</p>
                <p className="max-w-md text-xs text-white/50 leading-relaxed">
                  Deconstructing syntactic complexity across Expert, Grade 10, and Grade 6 prose, computing Flesch-Kincaid gauges, and generating concept maps.
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300 shadow-xl">
                <p className="font-semibold mb-1">Analysis encountered an issue</p>
                <p className="text-xs text-rose-300/80">{error}</p>
              </div>
            )}

            {/* Polished Empty State with Quick-Start Sample Chips */}
            {!loading && !result && !error && (
              <div className="liquid-glass rounded-3xl flex flex-col items-center justify-center gap-5 p-8 sm:p-12 text-center border border-white/10 shadow-2xl my-auto">
                <div className="rounded-full liquid-glass p-4 text-indigo-300 border border-white/10 shadow-lg">
                  <Sparkles size={28} />
                </div>

                <div className="space-y-1.5 max-w-lg">
                  <h3 className="font-serif-instrument text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                    Study Studio
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Paste textbook notes or lecture material on the left to deconstruct syntax, generate adaptive reading levels, and build knowledge maps. Or select a quick sample to begin:
                  </p>
                </div>

                {/* Quick-Start Sample Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mt-2">
                  {SAMPLE_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => {
                        setText(chip.text);
                        setImage(null);
                        run(chip.text, chip.id);
                      }}
                      className="liquid-glass rounded-2xl p-3.5 border border-white/10 text-left hover:border-indigo-500/40 hover:bg-white/5 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 block mb-1">
                          {chip.category}
                        </span>
                        <h4 className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors">
                          {chip.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-white/40 group-hover:text-white/70">
                        <Wand2 size={11} className="text-amber-400" />
                        <span>Load Sample &rarr;</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Tool Views (Single-View Progressive Disclosure) */}
            {result && metrics && (
              <>
                {/* Tab 1: Unjargon (Simplified Text & Diffs) */}
                {tab === "read" && (
                  <div className="space-y-4">
                    {/* Header with Title & Readability Pill */}
                    <div className="liquid-glass rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl sm:text-2xl font-serif-instrument text-white tracking-tight">
                            {result.title}
                          </h2>
                          {cached && (
                            <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              Cached sample
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/50">
                          <p className="flex items-center gap-1.5">
                            <span>Flesch-Kincaid:</span>
                            <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono font-semibold text-indigo-300">
                              Grade {metrics[level].fkGrade}
                            </span>
                            <span className="text-white/40">({LEVEL_LABELS[level]})</span>
                          </p>

                          {/* Pitch-Ready 100% Key Terms Retained Metric Indicator */}
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold shadow-sm">
                            <ShieldCheck size={12} className="text-emerald-400" />
                            <span>{keywordStats.retained} / {keywordStats.total} Key Terms Preserved ({keywordStats.pct}%)</span>
                          </div>
                        </div>
                      </div>

                      <LevelSlider level={level} onChange={setLevel} />
                    </div>

                    {/* Readability & Cognitive Load Metrics Row (Pulled Above the Fold) */}
                    <Gauges current={metrics[level]} expert={metrics.expert} />

                    {/* Single Unified Reading Card with Docked TTS Controls */}
                    <DiffText
                      expert={result.levels.expert}
                      current={result.levels[level]}
                      level={level}
                      verdicts={verdicts}
                      verifying={verifying}
                      onHover={setHoverIds}
                      initialRate={ttsSpeed}
                      dyslexiaFont={dyslexiaFont}
                      langCode={langCode}
                      glossary={result.glossary}
                      preservedTerms={result.preserved_terms}
                    />

                    {selection && (
                      <div className="no-print flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-xs text-white">
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
                  </div>
                )}

                {/* Tab 2: Gap Finder */}
                {tab === "gap" && (
                  <div className="space-y-4">
                    <GapFinder
                      sourceSentences={result.source_sentences}
                      levelLabel={LEVEL_LABELS[level]}
                      verdicts={verdicts}
                      verifying={verifying}
                      onCite={(ids) => {
                        setHoverIds(ids);
                        setTab("read");
                      }}
                    />
                  </div>
                )}

                {/* Tab 3: Mind Map */}
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

                {/* Tab 4: Quiz */}
                {tab === "quiz" && (
                  <div className="space-y-4">
                    <QuizCards
                      items={result.quiz}
                      sourceSentences={result.source_sentences}
                      title={result.title}
                      onViewSourceInRead={(sourceId) => {
                        setHoverIds([sourceId]);
                        setTab("read");
                      }}
                    />
                  </div>
                )}

                {/* Tab 5: Flashcards */}
                {tab === "cards" && (
                  <div className="space-y-4">
                    <Flashcards result={result} />
                  </div>
                )}

                {/* Tab 6: Ask AI Tutor */}
                {tab === "ask" && (
                  <div className="space-y-4">
                    <AskPanel
                      sentences={result.source_sentences}
                      levelLabel={LEVEL_LABELS[level]}
                      onCite={(ids) => setHoverIds(ids)}
                      pending={pendingQ}
                      clearPending={() => setPendingQ(null)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
