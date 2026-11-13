"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Sparkles, GraduationCap } from "lucide-react";
import type { Sentence } from "@/lib/types";

interface Msg { role: "user" | "tutor"; text: string; source_ids?: string[]; error?: boolean }

export default function AskPanel({
  sentences, levelLabel, onCite, pending, clearPending,
}: {
  sentences: Sentence[];
  levelLabel: string;
  onCite: (ids: string[]) => void;
  pending: string | null; // question queued from "Explain selection"
  clearPending: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    const history = msgs.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, source_sentences: sentences, level: levelLabel, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      setMsgs((m) => [...m, { role: "tutor", text: data.answer, source_ids: data.source_ids }]);
      onCite(data.source_ids ?? []);
    } catch {
      setMsgs((m) => [...m, { role: "tutor", text: "I couldn't reach the AI just now. Please try again in a moment.", error: true }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // send a question queued by "Explain this" exactly once
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pending) { ask(pending); clearPending(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs, busy]);

  const suggestions = ["What is the main idea?", "Explain it like I'm 10", "Why does this matter?", "Give me an everyday analogy"];

  return (
    <div className="card flex h-[520px] flex-col p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-700">
        <GraduationCap size={18} /> Ask the page <span className="font-normal text-zinc-400">· answers come only from your text</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-zinc-500">
            <Sparkles className="text-violet-500" />
            Ask anything about this page.
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => ask(s)} className="btn-ghost px-3 py-1.5 text-xs text-indigo-700">{s}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`fade-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "bg-indigo-600 text-white" : m.error ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-950"
            }`}>
              {m.text}
              {m.source_ids && m.source_ids.length > 0 && (
                <button onClick={() => onCite(m.source_ids!)} className="mt-1.5 block text-xs font-medium text-violet-700 underline">
                  Show in source ({m.source_ids.join(", ")})
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 size={14} className="animate-spin" /> Thinking…</div>}
        <div ref={bottom} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="mt-3 flex gap-2">
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question about the text…"
          className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <button disabled={busy || !q.trim()} className="btn-primary flex items-center gap-1 px-4 text-sm"><Send size={15} /> Ask</button>
      </form>
    </div>
  );
}
