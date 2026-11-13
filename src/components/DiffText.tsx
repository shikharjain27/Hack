"use client";
import { diffWords } from "diff";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import type { LevelSentence, Verdict } from "@/lib/types";
import type { LevelKey } from "./LevelSlider";

type Part = { value: string; added?: boolean; removed?: boolean };

function Badge({ verdict, pending }: { verdict?: Verdict; pending: boolean }) {
  if (!verdict) return pending ? <Loader2 size={14} className="ml-1 inline animate-spin text-zinc-400" /> : null;
  if (verdict.faithful) return <CheckCircle2 size={14} className="ml-1 inline text-green-600" />;
  const tip = verdict.dropped_facts.length ? `dropped: ${verdict.dropped_facts.join("; ")}` : verdict.note;
  return (
    <span className="group relative ml-1 inline-block align-middle">
      <AlertTriangle size={14} className="text-amber-500" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-56 -translate-x-1/2 rounded bg-zinc-900 p-2 text-xs text-white group-hover:block">
        {tip}
      </span>
    </span>
  );
}

export default function DiffText({
  expert, current, level, verdicts, verifying, onHover,
}: {
  expert: LevelSentence[];
  current: LevelSentence[];
  level: LevelKey;
  verdicts: Record<string, Verdict>;
  verifying: boolean;
  onHover: (sourceIds: string[]) => void;
}) {
  const a = expert.map((s) => s.text).join(" ");
  const diff = level === "expert" ? [] : (diffWords(a, current.map((s) => s.text).join(" ")) as Part[]);
  // Walk the diff once, handing out added/unchanged text to sentences in order; removed text is shown inline.
  let sIdx = 0;
  let consumed = 0;
  const sentenceNodes: React.ReactNode[][] = current.map(() => []);
  if (level === "expert") {
    current.forEach((s, i) => sentenceNodes[i].push(<span key="t">{s.text}</span>));
  } else {
    diff.forEach((p, pi) => {
      if (p.removed) {
        const i = Math.min(sIdx, current.length - 1);
        sentenceNodes[i].push(<span key={pi} className="bg-red-100 text-red-700 line-through">{p.value}</span>);
        return;
      }
      let rest = p.value;
      while (rest.length && sIdx < current.length) {
        if (consumed === 0) rest = rest.replace(/^\s+/, "");
        if (!rest.length) break;
        const room = current[sIdx].text.length - consumed;
        const take = rest.slice(0, Math.max(room, 0) || rest.length);
        const cls = p.added ? "rounded bg-green-100 text-green-800" : "";
        sentenceNodes[sIdx].push(<span key={`${pi}-${sIdx}-${consumed}`} className={cls}>{take}</span>);
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
    <p key={level} className="animate-[fadein_0.4s_ease] card p-4 leading-relaxed">
      {current.map((s, i) => (
        <span
          key={s.id}
          onMouseEnter={() => onHover(s.source_ids)}
          onMouseLeave={() => onHover([])}
          className="mr-1 rounded hover:bg-indigo-50"
        >
          {sentenceNodes[i]}
          {level !== "expert" && <Badge verdict={verdicts[s.id]} pending={verifying} />}{" "}
        </span>
      ))}
    </p>
  );
}
