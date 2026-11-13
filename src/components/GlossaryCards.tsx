"use client";
import type { GlossaryItem } from "@/lib/types";

export default function GlossaryCards({ items, selected }: { items: GlossaryItem[]; selected: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((g) => (
        <div
          key={g.term}
          className={`rounded-lg border bg-white p-3 transition-shadow ${
            selected && g.term.toLowerCase() === selected.toLowerCase() ? "border-indigo-500 shadow-md ring-2 ring-indigo-200" : "border-zinc-200"
          }`}
        >
          <div className="font-semibold">{g.emoji} {g.term}</div>
          <p className="text-sm text-zinc-600">{g.plain}</p>
        </div>
      ))}
    </div>
  );
}
