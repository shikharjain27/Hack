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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LevelSentence, Verdict } from "@/lib/types";
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
      <span className="inline-flex items-center ml-1.5 align-middle" title="Factually verified against source">
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

  // Compute Diff
  const a = expert.map((s) => s.text).join(" ");
  const diff =
    level === "expert" ? [] : (diffWords(a, fullText) as Part[]);

  // Walk the diff once, handing out added/unchanged text to sentences in order
  let sIdx = 0;
  let consumed = 0;
  const sentenceNodes: React.ReactNode[][] = current.map(() => []);

  if (level === "expert" || viewMode === "clean") {
    current.forEach((s, sIndex) => {
      // If audio is playing in clean mode, highlight active words
      if (ttsStatus === "playing" && activeWordIdx >= 0) {
        // Calculate sentence start offset in fullText
        let sentenceOffset = 0;
        for (let j = 0; j < sIndex; j++) {
          sentenceOffset += current[j].text.length + 1; // +1 space
        }
        const sEnd = sentenceOffset + s.text.length;
        const currentActiveWord = words[activeWordIdx];

        if (currentActiveWord && currentActiveWord.start >= sentenceOffset && currentActiveWord.end <= sEnd) {
          // Break sentence into words to highlight the exact word
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
      sentenceNodes[sIndex].push(<span key="t">{formatMathAndFormulas(s.text)}</span>);
    });
  } else {
    diff.forEach((p, pi) => {
      if (p.removed) {
        const i = Math.min(sIdx, current.length - 1);
        sentenceNodes[i].push(
          <span
            key={pi}
            className="bg-rose-500/20 text-rose-300 line-through rounded px-1 decoration-rose-400/60 mx-0.5"
            title="Original word (simplified away)"
          >
            {formatMathAndFormulas(p.value)}
          </span>,
        );
        return;
      }
      let rest = p.value;
      while (rest.length && sIdx < current.length) {
        if (consumed === 0) rest = rest.replace(/^\s+/, "");
        if (!rest.length) break;
        const room = current[sIdx].text.length - consumed;
        const take = rest.slice(0, Math.max(room, 0) || rest.length);
        const cls = p.added
          ? "rounded bg-emerald-500/25 text-emerald-200 border-b border-emerald-400/40 px-1 font-medium mx-0.5"
          : "";
        sentenceNodes[sIdx].push(
          <span key={`${pi}-${sIdx}-${consumed}`} className={cls}>
            {formatMathAndFormulas(take)}
          </span>,
        );
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                  viewMode === "clean"
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                  viewMode === "diff"
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

      {/* Main Prose Text (Rendered Once, Synchronized with Audio and Diffs) */}
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
