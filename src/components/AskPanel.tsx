"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Sparkles, GraduationCap } from "lucide-react";
import type { Sentence } from "@/lib/types";

interface Msg {
  role: "user" | "tutor";
  text: string;
  source_ids?: string[];
  error?: boolean;
}

export default function AskPanel({
  sentences,
  levelLabel,
  onCite,
  pending,
  clearPending,
}: {
  sentences: Sentence[];
  levelLabel: string;
  onCite: (ids: string[]) => void;
  pending: string | null;
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
      setMsgs((m) => [
        ...m,
        {
          role: "tutor",
          text: "I couldn't reach the AI tutor just now. Please try again in a moment.",
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (pending) {
      ask(pending);
      clearPending();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, busy]);

  const suggestions = [
    "What is the main idea?",
    "Explain it like I'm 10",
    "Why does this matter?",
    "Give me an everyday analogy",
  ];

  return (
    <div className="liquid-glass rounded-2xl flex h-[540px] flex-col p-5 border border-white/10 shadow-xl">
      <div className="mb-3.5 flex items-center justify-between border-b border-white/10 pb-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-white">
          <GraduationCap size={16} className="text-indigo-400" />
          <span>Ask the Textbook Assistant</span>
        </div>
        <span className="text-white/40">Grounded in verbatim source</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-xs text-white/50 px-4">
            <Sparkles className="text-indigo-400" size={24} />
            <p>Ask anything about this textbook passage. Responses are tuned to {levelLabel}.</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="liquid-glass rounded-xl px-3 py-1.5 text-xs text-indigo-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`fade-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs md:text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-white text-black font-medium"
                  : m.error
                  ? "border border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : "liquid-glass border border-white/15 bg-white/[0.04] text-white/95"
              }`}
            >
              {m.text}
              {m.source_ids && m.source_ids.length > 0 && (
                <button
                  onClick={() => onCite(m.source_ids!)}
                  className="mt-2 block text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 underline cursor-pointer"
                >
                  Jump to source citation ({m.source_ids.join(", ")})
                </button>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-white/50 pl-2">
            <Loader2 size={13} className="animate-spin text-indigo-400" /> Synthesizing response…
          </div>
        )}
        <div ref={bottom} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="mt-3.5 flex gap-2 pt-2 border-t border-white/10"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a question about this text…"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs md:text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-400 focus:bg-white/[0.06] transition-all"
        />
        <button
          disabled={busy || !q.trim()}
          type="submit"
          className="rounded-xl flex items-center gap-1.5 px-4 text-xs font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
        >
          <Send size={13} /> Ask
        </button>
      </form>
    </div>
  );
}
