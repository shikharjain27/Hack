"use client";
import type { Sentence } from "@/lib/types";

export default function SourcePanel({
  sentences, highlighted, flashId,
}: { sentences: Sentence[]; highlighted: string[]; flashId?: string | null }) {
  return (
    <div className="card p-4">
      <h3 className="mb-2 text-sm font-semibold text-zinc-500">Source (transcribed)</h3>
      <p className="text-sm leading-relaxed">
        {sentences.map((s) => (
          <span
            key={s.id}
            id={`src-${s.id}`}
            className={`mr-1 rounded px-0.5 transition-colors ${
              flashId === s.id ? "animate-pulse bg-orange-300" : highlighted.includes(s.id) ? "bg-yellow-200" : ""
            }`}
          >
            {s.text}
          </span>
        ))}
      </p>
    </div>
  );
}
