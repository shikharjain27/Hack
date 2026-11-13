"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
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

  const [order, setOrder] = useState<number[]>(() => base.map((_, i) => i));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const card = base[order[i]];
  if (!card) return null;

  const go = (d: number) => {
    setFlipped(false);
    setI((x) => (x + d + order.length) % order.length);
  };

  const shuffle = () => {
    setOrder([...order].sort(() => Math.random() - 0.5));
    setI(0);
    setFlipped(false);
  };

  return (
    <div className="liquid-glass rounded-2xl p-6 border border-white/10 shadow-xl">
      <div className="mb-4 flex items-center justify-between text-xs text-white/50">
        <span>
          Card {i + 1} of {order.length} ·{" "}
          <span className="text-emerald-400 font-semibold">{known.size} mastered</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={shuffle}
            className="liquid-glass rounded-lg flex items-center gap-1 px-2.5 py-1 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <Shuffle size={12} /> Shuffle
          </button>
          <button
            onClick={() => {
              setKnown(new Set());
              setI(0);
              setFlipped(false);
            }}
            className="liquid-glass rounded-lg flex items-center gap-1 px-2.5 py-1 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      <div
        className="flip mx-auto h-60 max-w-xl cursor-pointer"
        onClick={() => setFlipped(!flipped)}
      >
        <div className={`flip-inner h-full w-full ${flipped ? "flipped" : ""}`}>
          <div className="flip-face flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border border-white/20 p-6 text-center text-white backdrop-blur-md shadow-2xl">
            <div className="text-4xl mb-2">{card.emoji}</div>
            <div className="text-xl font-semibold tracking-tight">{card.front}</div>
            <div className="mt-4 text-xs text-white/40 tracking-wider uppercase font-medium">
              Click or tap to flip card
            </div>
          </div>
          <div className="flip-face flip-back flex items-center justify-center rounded-2xl border border-emerald-500/30 bg-zinc-950 p-6 text-center text-base md:text-lg text-emerald-200 shadow-2xl">
            {card.back}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          onClick={() => go(-1)}
          aria-label="Previous"
          className="liquid-glass rounded-xl p-2.5 text-white/70 hover:text-white cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => {
            setKnown(new Set(known).add(order[i]));
            go(1);
          }}
          className="rounded-xl px-5 py-2.5 text-xs font-semibold bg-white text-black hover:bg-white/90 transition-all cursor-pointer shadow-md"
        >
          I know this ✓
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next"
          className="liquid-glass rounded-xl p-2.5 text-white/70 hover:text-white cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
