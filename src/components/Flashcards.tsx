"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import type { TransformResult } from "@/lib/types";

interface Card { front: string; back: string; emoji: string }

export default function Flashcards({ result }: { result: TransformResult }) {
  const base = useMemo<Card[]>(() => {
    const terms = result.glossary.map((g) => ({ front: g.term, back: g.plain, emoji: g.emoji }));
    const edges = result.concept_map.edges.slice(0, 4).map((e) => {
      const label = new Map(result.concept_map.nodes.map((n) => [n.id, n.label]));
      return { front: `${label.get(e.from)} → ${label.get(e.to)}: how are they related?`, back: `${label.get(e.from)} ${e.label} ${label.get(e.to)}.`, emoji: "🔗" };
    });
    return [...terms, ...edges];
  }, [result]);
  const [order, setOrder] = useState<number[]>(() => base.map((_, i) => i));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const card = base[order[i]];
  if (!card) return null;

  const go = (d: number) => { setFlipped(false); setI((x) => (x + d + order.length) % order.length); };
  const shuffle = () => {
    setOrder([...order].sort(() => Math.random() - 0.5));
    setI(0); setFlipped(false);
  };

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between text-sm text-zinc-500">
        <span>Card {i + 1} of {order.length} · <span className="text-green-600">{known.size} known</span></span>
        <div className="flex gap-2">
          <button onClick={shuffle} className="btn-ghost flex items-center gap-1 px-2.5 py-1 text-xs"><Shuffle size={13} /> Shuffle</button>
          <button onClick={() => { setKnown(new Set()); setI(0); setFlipped(false); }} className="btn-ghost flex items-center gap-1 px-2.5 py-1 text-xs"><RotateCcw size={13} /> Reset</button>
        </div>
      </div>
      <div className="flip mx-auto h-56 max-w-xl cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <div className={`flip-inner h-full w-full ${flipped ? "flipped" : ""}`}>
          <div className="flip-face flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-center text-white">
            <div className="text-4xl">{card.emoji}</div>
            <div className="mt-2 text-xl font-semibold">{card.front}</div>
            <div className="mt-3 text-xs text-indigo-100">Click to flip</div>
          </div>
          <div className="flip-face flip-back flex items-center justify-center rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6 text-center text-lg text-indigo-950">
            {card.back}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button onClick={() => go(-1)} aria-label="Previous" className="btn-ghost p-2"><ChevronLeft size={18} /></button>
        <button
          onClick={() => { setKnown(new Set(known).add(order[i])); go(1); }}
          className="btn-primary px-4 py-2 text-sm"
        >I know this ✓</button>
        <button onClick={() => go(1)} aria-label="Next" className="btn-ghost p-2"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
