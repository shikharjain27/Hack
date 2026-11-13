"use client";

import type { GlossaryItem } from "@/lib/types";

export default function GlossaryCards({
  items,
  selected,
}: {
  items: GlossaryItem[];
  selected: string | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((g) => {
        const isSelected = selected && g.term.toLowerCase() === selected.toLowerCase();

        return (
          <div
            key={g.term}
            className={`rounded-2xl p-4 transition-all liquid-glass border ${
              isSelected
                ? "border-indigo-400 bg-indigo-500/15 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/50"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="font-semibold text-white text-sm flex items-center gap-2 mb-1">
              <span className="text-xl">{g.emoji}</span>
              <span>{g.term}</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed pl-7">{g.plain}</p>
          </div>
        );
      })}
    </div>
  );
}
