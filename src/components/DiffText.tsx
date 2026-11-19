"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { diffWords } from "diff";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  GitCompare,
  Play,
  Pause,
  Volume2,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LevelSentence, Verdict, GlossaryItem, PreservedTerm } from "@/lib/types";
import type { LevelKey } from "./LevelSlider";
import { formatMathAndFormulas } from "@/lib/formatMath";

type Part = { value: string; added?: boolean; removed?: boolean };

const VOICES: [string, string][] = [
  ["Kore", "Kore (warm)"],
  ["Puck", "Puck (upbeat)"],
  ["Charon", "Charon (calm)"],
  ["Aoede", "Aoede (bright)"],
  ["Fenrir", "Fenrir (steady)"],
];

function Badge({ verdict, pending }: { verdict?: Verdict; pending: boolean }) {
  if (!verdict) {
    return pending ? <Loader2 size={13} className="ml-1.5 inline animate-spin text-white/40" /> : null;
  }
  if (verdict.faithful) {
    return (
      <span className="inline-flex items-center ml-1.5 align-middle" title="Factually verified against source (100% faithful)">
        <CheckCircle2 size={13} className="text-emerald-400" />
      </span>
    );
  }
  const tip = verdict.dropped_facts.length
    ? `Omitted/altered: ${verdict.dropped_facts.join("; ")}`
    : verdict.note;
  return (
    <span className="group relative ml-1.5 inline-block align-middle cursor-help">
      <AlertTriangle size={13} className="text-amber-400" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-64 -translate-x-1/2 rounded-xl border border-white/20 bg-zinc-950 p-2.5 text-[11px] text-white shadow-xl group-hover:block leading-snug">
        <span className="block font-semibold text-amber-300 mb-0.5">Verification Note:</span>
        {tip}
      </span>
    </span>
  );
}

export default function DiffText({
  expert,
  current,
  level,
  verdicts,
  verifying,
  onHover,
  initialRate = 1,
  dyslexiaFont = false,
  langCode,
  glossary = [],
  preservedTerms = [],
}: {
  expert: LevelSentence[];
  current: LevelSentence[];
  level: LevelKey;
  verdicts: Record<string, Verdict>;
  verifying: boolean;
  onHover: (sourceIds: string[]) => void;
  initialRate?: number;
  dyslexiaFont?: boolean;
  langCode?: string;
  glossary?: GlossaryItem[];
  preservedTerms?: (string | PreservedTerm)[];
}) {
  const [viewMode, setViewMode] = useState<"clean" | "diff">("clean");

  // Audio / TTS state docked directly into this unified reading card
  const [ttsStatus, setTtsStatus] = useState<"idle" | "loading" | "playing">("idle");
  const [voice, setVoice] = useState("Kore");
  const [rate, setRate] = useState(initialRate);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [engine, setEngine] = useState<"gemini" | "browser" | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCache = useRef(new Map<string, string>());

  const fullText = useMemo(() => current.map((s) => s.text).join(" "), [current]);

  const words = useMemo(() => {
    const list: { w: string; start: number; end: number }[] = [];
    for (const m of fullText.matchAll(/\S+/g)) {
      list.push({ w: m[0], start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
    }
    return list;
  }, [fullText]);

  // Build unified term dictionary for hover tooltips & entity locking
  const termLookup = useMemo(() => {
    const map = new Map<string, { term: string; definition: string; emoji?: string; category?: string }>();
    for (const g of glossary) {
      map.set(g.term.toLowerCase(), {
        term: g.term,
        definition: g.plain,
        emoji: g.emoji,
        category: "Concept Definition",
      });
    }
    for (const pt of preservedTerms) {
      if (typeof pt === "string") {
        if (!map.has(pt.toLowerCase())) {
          map.set(pt.toLowerCase(), {
            term: pt,
            definition: "Technical keyword locked & preserved verbatim from source text.",
            emoji: "🛡️",
            category: "Preserved Keyword",
          });
        }
      } else if (pt?.term) {
        map.set(pt.term.toLowerCase(), {
          term: pt.term,
          definition: pt.definition || "Technical keyword locked & preserved verbatim from source text.",
          emoji: "🛡️",
          category: pt.category || "Preserved Keyword",
        });
      }
    }
    return map;
  }, [glossary, preservedTerms]);

  function stopAudio() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
    setTtsStatus("idle");
    setActiveWordIdx(-1);
  }

  // Stop audio whenever level changes
  useEffect(() => {
    stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const cacheMap = audioCache.current;
    return () => {
      stopAudio();
      cacheMap.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  function speakWithBrowser() {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth) {
      setTtsStatus("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(fullText);
    u.rate = rate;
    if (langCode) u.lang = langCode;
    u.onboundary = (e) => {
      if (e.name !== "word") return;
      let i = 0;
      while (i + 1 < words.length && words[i + 1].start <= e.charIndex) i++;
      setActiveWordIdx(i);
    };
    u.onend = () => {
      setTtsStatus("idle");
      setActiveWordIdx(-1);
    };
    u.onerror = () => {
      setTtsStatus("idle");
      setActiveWordIdx(-1);
    };
    setEngine("browser");
    setTtsStatus("playing");
    synth.cancel();
    synth.speak(u);
  }

  async function togglePlay() {
    if (ttsStatus === "playing") {
      stopAudio();
      return;
    }
    stopAudio();
    setTtsStatus("loading");

    const key = `${voice}:${fullText}`;
    let url = audioCache.current.get(key);

    try {
      if (!url) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fullText, voice }),
        });
        if (!res.ok) throw new Error("TTS failed");
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        audioCache.current.set(key, url);
      }

      const audio = new Audio(url);
      audio.playbackRate = rate;
      audioRef.current = audio;
      audio.onended = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setTtsStatus("idle");
        setActiveWordIdx(-1);
      };

      const tick = () => {
        if (audio.duration > 0) {
          const pos = (audio.currentTime / audio.duration) * fullText.length;
          let i = 0;
          while (i + 1 < words.length && words[i + 1].start <= pos) i++;
          setActiveWordIdx(i);
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      await audio.play();
      setEngine("gemini");
      setTtsStatus("playing");
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      speakWithBrowser();
    }
  }

  // Helper to test if a string contains any preserved technical term
  function findPreservedTerm(str: string) {
    const lower = str.toLowerCase();
    for (const [key, info] of termLookup.entries()) {
      if (lower.includes(key) || (key.length > 4 && key.includes(lower.trim()))) {
        return info;
      }
    }
    return null;
  }

  // Render text with interactive hover tooltips for Clean Read
  function renderScaffoldedSentence(text: string, keyPrefix: string) {
    if (termLookup.size === 0) {
      return <span key={keyPrefix}>{formatMathAndFormulas(text)}</span>;
    }

    const sortedTerms = Array.from(termLookup.keys()).sort((a, b) => b.length - a.length);
    const escaped = sortedTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    if (!escaped) {
      return <span key={keyPrefix}>{formatMathAndFormulas(text)}</span>;
    }

    const regex = new RegExp(`(\\b(?:${escaped})\\b)`, "gi");
    const segments = text.split(regex);

    return (
      <span key={keyPrefix}>
        {segments.map((seg, segIdx) => {
          const lower = seg.toLowerCase();
          const info = termLookup.get(lower);
          if (info) {
            return (
              <span
                key={`${keyPrefix}-${segIdx}`}
                className="group/term relative inline cursor-help border-b-2 border-indigo-400/50 hover:border-indigo-400 text-white font-medium px-1 py-0.5 rounded bg-indigo-500/[0.08] hover:bg-indigo-500/20 transition-all select-text"
              >
                <span>{formatMathAndFormulas(seg)}</span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 rounded-2xl border border-indigo-400/30 bg-zinc-950/95 p-3 text-xs text-white shadow-2xl backdrop-blur-xl group-hover/term:block min-w-[220px] max-w-[320px] text-left leading-relaxed">
                  <span className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <span>{info.emoji || "🛡️"}</span>
                      <span>{info.term}</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 uppercase font-mono font-bold tracking-wider">
                      Preserved
                    </span>
                  </span>
                  <span className="text-[11px] text-white/80 block leading-snug">
                    {info.definition}
                  </span>
                </span>
              </span>
            );
          }
          return <span key={`${keyPrefix}-${segIdx}`}>{formatMathAndFormulas(seg)}</span>;
        })}
      </span>
    );
  }

  // Compute Diff between Expert and simplified Current level
  const a = expert.map((s) => s.text).join(" ");
  const diff = level === "expert" ? [] : (diffWords(a, fullText) as Part[]);

  // Walk the diff, distributing parts across sentences
  let sIdx = 0;
  let consumed = 0;
  const sentenceNodes: React.ReactNode[][] = current.map(() => []);

  if (level === "expert" || viewMode === "clean") {
    current.forEach((s, sIndex) => {
      // If audio is playing in clean mode, highlight active words
      if (ttsStatus === "playing" && activeWordIdx >= 0) {
        let sentenceOffset = 0;
        for (let j = 0; j < sIndex; j++) {
          sentenceOffset += current[j].text.length + 1;
        }
        const sEnd = sentenceOffset + s.text.length;
        const currentActiveWord = words[activeWordIdx];

        if (currentActiveWord && currentActiveWord.start >= sentenceOffset && currentActiveWord.end <= sEnd) {
          const sWords = s.text.split(/(\s+)/);
          let charCursor = sentenceOffset;
          sentenceNodes[sIndex].push(
            <span key="playing-span">
              {sWords.map((sw, swIdx) => {
                const isWord = /\S/.test(sw);
                const isHighlighted = isWord && charCursor >= currentActiveWord.start && charCursor < currentActiveWord.end;
                charCursor += sw.length;
                return isHighlighted ? (
                  <span
                    key={swIdx}
                    className="rounded bg-amber-300 text-black px-1 py-0.5 font-bold shadow-md transition-all inline-block"
                  >
                    {formatMathAndFormulas(sw)}
                  </span>
                ) : (
                  <span key={swIdx}>{formatMathAndFormulas(sw)}</span>
                );
              })}
            </span>
          );
          return;
        }
      }
      sentenceNodes[sIndex].push(renderScaffoldedSentence(s.text, `clean-${sIndex}`));
    });
  } else {
    // Vocabulary Diff Mode: Never strike through preserved technical keywords!
    diff.forEach((p, pi) => {
      if (p.removed) {
        const i = Math.min(sIdx, current.length - 1);
        const preserved = findPreservedTerm(p.value);

        if (preserved) {
          // Technical keyword locked & retained: Highlight in cyan locked accent instead of strikethrough!
          sentenceNodes[i].push(
            <span
              key={pi}
              className="rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 px-1.5 py-0.5 font-semibold mx-0.5 inline-flex items-center gap-1 shadow-sm"
              title={`Technical keyword locked & preserved: ${preserved.term}`}
            >
              <ShieldCheck size={11} className="text-cyan-400 shrink-0" />
              <span>{formatMathAndFormulas(p.value)}</span>
            </span>
          );
        } else {
          // Dense academic phrasing simplified away
          sentenceNodes[i].push(
            <span
              key={pi}
              className="bg-rose-500/20 text-rose-300 line-through rounded px-1 decoration-rose-400/60 mx-0.5"
              title="Academic phrasing simplified into plain English"
            >
              {formatMathAndFormulas(p.value)}
            </span>
          );
        }
        return;
      }

      let rest = p.value;
      while (rest.length && sIdx < current.length) {
        if (consumed === 0) rest = rest.replace(/^\s+/, "");
        if (!rest.length) break;
        const room = current[sIdx].text.length - consumed;
        const take = rest.slice(0, Math.max(room, 0) || rest.length);

        const preserved = findPreservedTerm(take);

        if (preserved && p.added) {
          sentenceNodes[sIdx].push(
            <span
              key={`${pi}-${sIdx}-${consumed}`}
              className="rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 px-1.5 py-0.5 font-semibold mx-0.5 inline-flex items-center gap-1 shadow-sm"
              title={`Technical keyword preserved verbatim: ${preserved.term}`}
            >
              <ShieldCheck size={11} className="text-cyan-400 shrink-0" />
              <span>{formatMathAndFormulas(take)}</span>
            </span>
          );
        } else if (p.added) {
          sentenceNodes[sIdx].push(
            <span
              key={`${pi}-${sIdx}-${consumed}`}
              className="rounded bg-emerald-500/25 text-emerald-200 border-b border-emerald-400/40 px-1 font-medium mx-0.5"
              title="Plain-English scaffolding added for clarity"
            >
              {formatMathAndFormulas(take)}
            </span>
          );
        } else {
          sentenceNodes[sIdx].push(
            <span key={`${pi}-${sIdx}-${consumed}`}>
              {formatMathAndFormulas(take)}
            </span>
          );
        }

        rest = rest.slice(take.length);
        consumed += take.length;
        if (consumed >= current[sIdx].text.length) {
          sIdx++;
          consumed = 0;
          rest = rest.replace(/^\s+/, "");
        }
      }
    });
  }

  const tierLabel =
    level === "expert"
      ? "Expert Original"
      : level === "grade10"
        ? "Grade 10 Clarity"
        : "Grade 6 Plain Language";

  return (
    <div
      className="liquid-glass rounded-3xl p-5 sm:p-6 md:p-7 border border-white/10 shadow-2xl transition-all space-y-4"
      style={
        dyslexiaFont
          ? {
            fontFamily: "var(--font-lexend), sans-serif",
            letterSpacing: "0.025em",
          }
          : undefined
      }
    >
      {/* Top Unified Reading & Audio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 text-xs">
        {/* Left: Active Tier & Mode Switch */}
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            {tierLabel}
          </span>

          {level !== "expert" && (
            <div className="flex items-center gap-1 liquid-glass p-0.5 rounded-full border border-white/10">
              <button
                onClick={() => setViewMode("clean")}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${viewMode === "clean"
                    ? "bg-white text-black shadow-md font-semibold"
                    : "text-white/60 hover:text-white"
                  }`}
              >
                <Eye size={12} />
                <span>Clean Read</span>
              </button>
              <button
                onClick={() => setViewMode("diff")}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${viewMode === "diff"
                    ? "bg-white text-black shadow-md font-semibold"
                    : "text-white/60 hover:text-white"
                  }`}
              >
                <GitCompare size={12} />
                <span>Vocabulary Diff</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Docked Audio Player Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="rounded-xl bg-white text-black font-semibold flex items-center gap-1.5 px-3.5 py-1.5 text-xs hover:bg-white/90 transition-all cursor-pointer shadow-md"
            title="Listen to this passage read aloud with synchronized text highlighting"
          >
            {ttsStatus === "loading" ? (
              <Loader2 size={13} className="animate-spin text-indigo-600" />
            ) : ttsStatus === "playing" ? (
              <Pause size={13} />
            ) : (
              <Play size={13} />
            )}
            <span>
              {ttsStatus === "loading"
                ? "Preparing…"
                : ttsStatus === "playing"
                  ? "Pause"
                  : "Listen (TTS)"}
            </span>
          </button>

          <select
            value={voice}
            onChange={(e) => {
              stopAudio();
              setVoice(e.target.value);
            }}
            className="rounded-xl border border-white/10 bg-zinc-900/90 text-white px-2 py-1 text-xs outline-none"
            aria-label="Voice"
          >
            {VOICES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-zinc-900/90 text-white px-2 py-1 text-xs outline-none"
            aria-label="Speech Speed"
          >
            {[0.75, 1, 1.25, 1.5].map((r) => (
              <option key={r} value={r}>
                {r}x
              </option>
            ))}
          </select>

          {engine && ttsStatus !== "idle" && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-md">
              <Volume2 size={11} className="text-emerald-400" />
              <span>{engine === "gemini" ? "Neural AI" : "Browser"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Vocabulary Diff Legend: Displayed exclusively in diff mode */}
      {viewMode === "diff" && level !== "expert" && (
        <div className="flex flex-wrap items-center gap-3 py-1 px-1 text-[11px] text-white/60 border-b border-white/5">
          <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Preserved Technical Keywords (100% Locked)</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Plain-English Scaffolding</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-400 line-through" />
            <span>Academic Filler Simplified</span>
          </span>
        </div>
      )}

      {/* Main Prose Text (Rendered Once, Synchronized with Audio, Scaffolding, and Diffs) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${level}-${viewMode}`}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.15 }}
          className="text-white/95 text-base md:text-[17px] leading-relaxed md:leading-loose select-text"
        >
          {current.map((s, i) => (
            <span
              key={s.id}
              onMouseEnter={() => onHover(s.source_ids)}
              onMouseLeave={() => onHover([])}
              className="mr-1.5 rounded-md px-1 py-0.5 transition-colors hover:bg-white/10 cursor-pointer"
            >
              {sentenceNodes[i]}
              {level !== "expert" && <Badge verdict={verdicts[s.id]} pending={verifying} />}{" "}
            </span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
