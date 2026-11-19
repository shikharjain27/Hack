"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Sparkles, GraduationCap, CornerDownLeft } from "lucide-react";
import type { Sentence } from "@/lib/types";

interface Msg {
  role: "user" | "tutor";
  text: string;
  source_ids?: string[];
  error?: boolean;
}

const STARTER_PROMPTS = [
  "What is the main mechanism here?",
  "Explain this in simpler terms",
  "Why is this step biologically necessary?",
  "Give me an everyday analogy",
];

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMsgs((m) => [...m, { role: "tutor", text: data.answer, source_ids: data.source_ids }]);
      if (data.source_ids?.length) {
        onCite(data.source_ids);
      }
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  return (
    <div className="liquid-glass rounded-3xl border border-white/10 shadow-2xl flex flex-col h-[560px] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Socratic AI Tutor</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-mono">
                {levelLabel}
              </span>
            </h3>
            <p className="text-[11px] text-white/40">
              Grounded exclusively in this textbook passage
            </p>
          </div>
        </div>

        {msgs.length > 0 && (
          <button
            onClick={() => setMsgs([])}
            className="text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-0">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300">
              <Sparkles size={22} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">Ask anything about this text</h4>
              <p className="text-xs text-white/50 max-w-sm mt-1 leading-relaxed">
                Need an analogy, clarification on a step, or a simplified breakdown? Ask below:
              </p>
            </div>
          </div>
        )}

        {msgs.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "bg-white text-black font-medium shadow-md"
                  : m.error
                  ? "border border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : "liquid-glass border border-white/15 bg-white/[0.04] text-white/95 shadow-md"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              {m.source_ids && m.source_ids.length > 0 && (
                <button
                  onClick={() => onCite(m.source_ids!)}
                  className="mt-2.5 block text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 underline cursor-pointer"
                >
                  Highlight source citation ({m.source_ids.map((id) => id.toUpperCase()).join(", ")}) &rarr;
                </button>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-indigo-300 pl-2">
            <Loader2 size={13} className="animate-spin text-indigo-400" />
            <span>Tutor is thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Docked Bottom Bar: Quick Chips + Input Form */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl space-y-2.5">
        {/* Quick Starter Chips */}
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {STARTER_PROMPTS.map((promptText, i) => (
              <button
                key={i}
                onClick={() => ask(promptText)}
                className="liquid-glass rounded-xl px-2.5 py-1 text-[11px] text-indigo-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
              >
                {promptText}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(q);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask a question about this passage…"
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-400 focus:bg-white/[0.06] transition-all"
          />
          <button
            disabled={busy || !q.trim()}
            type="submit"
            className="rounded-2xl flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shrink-0"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}
