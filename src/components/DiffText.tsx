"use client";

import { useState } from "react";
import { diffWords } from "diff";
import { CheckCircle2, AlertTriangle, Loader2, Eye, GitCompare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LevelSentence, Verdict } from "@/lib/types";
import type { LevelKey } from "./LevelSlider";

type Part = { value: string; added?: boolean; removed?: boolean };

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
}: {
  expert: LevelSentence[];
  current: LevelSentence[];
  level: LevelKey;
  verdicts: Record<string, Verdict>;
  verifying: boolean;
  onHover: (sourceIds: string[]) => void;
}) {
  const [viewMode, setViewMode] = useState<"clean" | "diff">("clean");

  const a = expert.map((s) => s.text).join(" ");
  const diff =
    level === "expert" ? [] : (diffWords(a, current.map((s) => s.text).join(" ")) as Part[]);

  // Walk the diff once, handing out added/unchanged text to sentences in order
  let sIdx = 0;
  let consumed = 0;
  const sentenceNodes: React.ReactNode[][] = current.map(() => []);

  if (level === "expert" || viewMode === "clean") {
    current.forEach((s, i) => sentenceNodes[i].push(<span key="t">{s.text}</span>));
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
            {p.value}
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
            {take}
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

  return (
    <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl transition-all space-y-4">
      {/* Top Reading Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 text-white/60 font-medium">
          <span>Active tier: <strong className="text-white">{level === "expert" ? "Expert Original" : level === "grade10" ? "Grade 10 Clarity" : "Grade 6 Plain Language"}</strong></span>
        </div>

        {level !== "expert" && (
          <div className="flex items-center gap-1 liquid-glass p-1 rounded-full border border-white/10">
            <button
              onClick={() => setViewMode("clean")}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
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

      {/* Main Prose Text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${level}-${viewMode}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-white/95 text-base md:text-lg leading-relaxed select-text"
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
