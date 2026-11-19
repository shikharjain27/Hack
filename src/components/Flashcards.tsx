"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Check,
  Sparkles,
  Command,
} from "lucide-react";
import type { TransformResult } from "@/lib/types";

interface Card {
  front: string;
  back: string;
  emoji: string;
}

export default function Flashcards({ result }: { result: TransformResult }) {
  const base = useMemo<Card[]>(() => {
    const terms = result.glossary.map((g) => ({
      front: g.term,
      back: g.plain,
      emoji: g.emoji,
    }));
    const edges = result.concept_map.edges.slice(0, 4).map((e) => {
      const label = new Map(result.concept_map.nodes.map((n) => [n.id, n.label]));
      return {
        front: `${label.get(e.from)} → ${label.get(e.to)}: how are they related?`,
        back: `${label.get(e.from)} ${e.label} ${label.get(e.to)}.`,
        emoji: "🔗",
      };
    });
    return [...terms, ...edges];
  }, [result]);

  const [order, setOrder] = useState<number[]>(() => base.map((_, idx) => idx));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const card = base[order[i]];

  const go = useCallback(
    (d: number) => {
      setFlipped(false);
      setI((x) => (x + d + order.length) % order.length);
    },
    [order.length]
  );

  const toggleMastered = useCallback(() => {
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(order[i])) {
        next.delete(order[i]);
      } else {
        next.add(order[i]);
      }
      return next;
    });
  }, [order, i]);

  const shuffle = () => {
    setOrder([...order].sort(() => Math.random() - 0.5));
    setI(0);
    setFlipped(false);
  };

  // Keyboard controls (ArrowLeft, ArrowRight, Space/Enter, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMastered();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [go, toggleMastered]);

  if (!card) return null;
  const isMastered = known.has(order[i]);

  return (
    <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-5">
      {/* Top Header & Tracker */}
      <div className="flex items-center justify-between text-xs text-white/50">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white/80">
            Card {i + 1} of {order.length}
          </span>
          <span>·</span>
          <span className="text-emerald-400 font-semibold">{known.size} Mastered</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={shuffle}
            className="liquid-glass rounded-xl flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10"
            title="Shuffle flashcards"
          >
            <Shuffle size={12} />
            <span>Shuffle</span>
          </button>
          <button
            onClick={() => {
              setKnown(new Set());
              setI(0);
              setFlipped(false);
            }}
            className="liquid-glass rounded-xl flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10"
            title="Reset progress"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="mx-auto h-64 max-w-xl cursor-pointer perspective-1000 select-none group"
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            flipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Card Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-950/70 via-zinc-900/90 to-purple-950/50 border border-white/20 p-8 text-center text-white backdrop-blur-xl shadow-2xl backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-5xl mb-3 filter drop-shadow-md">{card.emoji}</div>
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white/95 max-w-md">
              {card.front}
            </h3>
            <div className="mt-5 text-[11px] text-white/40 tracking-widest uppercase font-medium flex items-center gap-1.5">
              <span>Click or press Space to flip</span>
            </div>
          </div>

          {/* Card Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-emerald-500/30 bg-zinc-950/95 p-8 text-center shadow-2xl backface-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 mb-2">
              Explanation & Plain Definition
            </span>
            <p className="text-base sm:text-lg text-emerald-100/95 leading-relaxed max-w-md">
              {card.back}
            </p>
          </div>
        </div>
      </div>

      {/* Controls & Keyboard Shortcuts */}
      <div className="flex flex-col items-center gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => go(-1)}
            aria-label="Previous card"
            className="liquid-glass rounded-2xl p-3 text-white/70 hover:text-white transition-all cursor-pointer border border-white/10 hover:border-white/30"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={toggleMastered}
            className={`rounded-2xl flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-md ${
              isMastered
                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                : "bg-white/[0.06] text-white/80 hover:bg-white/10 border border-white/15"
            }`}
          >
            <Check size={14} className={isMastered ? "text-white" : "text-emerald-400"} />
            <span>{isMastered ? "Mastered ✓" : "Mark as Mastered"}</span>
          </button>

          <button
            onClick={() => go(1)}
            aria-label="Next card"
            className="liquid-glass rounded-2xl p-3 text-white/70 hover:text-white transition-all cursor-pointer border border-white/10 hover:border-white/30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Keyboard Hints */}
        <div className="flex items-center gap-2 text-[11px] text-white/35 font-mono">
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">← / →</span>
          <span>navigate</span>
          <span>·</span>
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">Space</span>
          <span>flip</span>
          <span>·</span>
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">M</span>
          <span>mastered</span>
        </div>
      </div>
    </div>
  );
}
