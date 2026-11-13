"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizItem } from "@/lib/types";

export default function QuizCards({ items, onWrong }: { items: QuizItem[]; onWrong: (sourceId: string) => void }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  return (
    <div className="space-y-3">
      {items.map((q, qi) => {
        const p = picked[qi];
        const done = p !== undefined;
        return (
          <div key={qi} className="card p-4">
            <div className="mb-2 font-semibold">{qi + 1}. {q.q}</div>
            <div className="grid gap-2">
              {q.options.map((o, oi) => {
                const correct = oi === q.answer;
                const style = !done
                  ? "border-zinc-300 hover:bg-indigo-50"
                  : correct ? "border-green-500 bg-green-50" : oi === p ? "border-red-500 bg-red-50" : "border-zinc-200 opacity-60";
                return (
                  <button
                    key={oi}
                    disabled={done}
                    onClick={() => { setPicked({ ...picked, [qi]: oi }); if (!correct) onWrong(q.source_id); }}
                    className={`flex items-center justify-between rounded border px-3 py-2 text-left text-sm ${style}`}
                  >
                    {o}
                    {done && correct && <CheckCircle2 size={16} className="text-green-600" />}
                    {done && !correct && oi === p && <XCircle size={16} className="text-red-600" />}
                  </button>
                );
              })}
            </div>
            {done && p !== q.answer && <p className="mt-2 text-xs text-zinc-500">Not quite — see the highlighted source sentence on the Read tab.</p>}
          </div>
        );
      })}
    </div>
  );
}
