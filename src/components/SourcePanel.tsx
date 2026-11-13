"use client";

import type { Sentence } from "@/lib/types";
import { FileText } from "lucide-react";

export default function SourcePanel({
  sentences,
  highlighted,
  flashId,
}: {
  sentences: Sentence[];
  highlighted: string[];
  flashId?: string | null;
}) {
  return (
    <div className="liquid-glass rounded-2xl p-5 border border-white/10 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={14} className="text-indigo-400" />
        <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Verbatim Source Reference
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-white/80">
        {sentences.map((s) => (
          <span
            key={s.id}
            id={`src-${s.id}`}
            className={`mr-1 rounded-md px-1 py-0.5 transition-all ${
              flashId === s.id
                ? "animate-pulse bg-amber-400 text-black font-semibold shadow-lg"
                : highlighted.includes(s.id)
                ? "bg-amber-400/25 text-amber-200 border border-amber-400/40"
                : ""
            }`}
          >
            {s.text}
          </span>
        ))}
      </p>
    </div>
  );
}
