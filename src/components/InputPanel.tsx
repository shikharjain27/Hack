"use client";
import { Sparkles, FileText } from "lucide-react";
import { SAMPLE_TEXT } from "@/lib/sample";

export default function InputPanel({
  text, setText, onSubmit, loading,
}: { text: string; setText: (t: string) => void; onSubmit: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a dense textbook paragraph…"
        className="h-72 w-full resize-none rounded-lg border border-zinc-300 bg-white p-3 text-sm"
      />
      <div className="flex gap-2">
        <button onClick={() => setText(SAMPLE_TEXT)} className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-100">
          <FileText size={16} /> Load Sample Input
        </button>
        <button onClick={onSubmit} disabled={loading || !text.trim()} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          <Sparkles size={16} /> {loading ? "Working…" : "Unjargon it"}
        </button>
      </div>
    </div>
  );
}
