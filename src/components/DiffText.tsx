"use client";
import { diffWords } from "diff";
import type { LevelSentence } from "@/lib/types";
import type { LevelKey } from "./LevelSlider";

export default function DiffText({
  expert, current, level,
}: { expert: LevelSentence[]; current: LevelSentence[]; level: LevelKey }) {
  const a = expert.map((s) => s.text).join(" ");
  const b = current.map((s) => s.text).join(" ");
  const parts = level === "expert" ? [{ value: b }] : diffWords(a, b);
  return (
    <p key={level} className="animate-[fadein_0.4s_ease] rounded-lg border border-zinc-200 bg-white p-4 leading-relaxed">
      {parts.map((p, i) => {
        const part = p as { value: string; added?: boolean; removed?: boolean };
        if (part.added) return <span key={i} className="rounded bg-green-100 text-green-800">{part.value}</span>;
        if (part.removed) return <span key={i} className="bg-red-100 text-red-700 line-through">{part.value}</span>;
        return <span key={i}>{part.value}</span>;
      })}
    </p>
  );
}
