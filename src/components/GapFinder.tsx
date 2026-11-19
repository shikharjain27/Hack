"use client";

import { useState, useMemo } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import type { Sentence, Verdict } from "@/lib/types";

interface MisconceptionReport {
  score: number;
  summary: string;
  strengths: string[];
  misconceptions: {
    claim: string;
    gap: string;
    correction: string;
    relatedSentenceId?: string;
  }[];
  bridgingExplanation: string;
  encouragement: string;
}

export default function GapFinder({
  sourceSentences,
  levelLabel,
  verdicts = {},
  verifying = false,
  onCite,
}: {
  sourceSentences: Sentence[];
  levelLabel: string;
  verdicts?: Record<string, Verdict>;
  verifying?: boolean;
  onCite?: (sentenceIds: string[]) => void;
}) {
  const [understanding, setUnderstanding] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<MisconceptionReport | null>(null);

  // Group verification verdicts into dropped-fact omissions vs faithful
  const verdictList = Object.values(verdicts);
  const droppedGaps = verdictList.filter((v) => !v.faithful);

  // Context-aware starter prompts for the student
  const starterPrompts = useMemo(() => {
    const combined = sourceSentences.map((s) => s.text).join(" ").toLowerCase();
    if (combined.includes("red-black") || combined.includes("tree")) {
      return [
        "Explain why the root is black and how rotations restore balance.",
        "What is black-height and why can't two red nodes be adjacent?",
        "What happens when an insertion violates the structural invariants?",
      ];
    }
    if (combined.includes("bgp") || combined.includes("autonomous system")) {
      return [
        "Explain how the AS_PATH attribute prevents routing loops in BGP.",
        "How does BGP differ from internal link-state protocols like OSPF?",
        "What hierarchy of attributes does BGP use to pick the best path?",
      ];
    }
    if (combined.includes("virtual memory") || combined.includes("page table") || combined.includes("tlb")) {
      return [
        "Explain step-by-step what happens when a CPU experiences a TLB miss.",
        "What causes a page fault exception (Vector 14) and how does demand paging resolve it?",
        "Why do operating systems give each process its own virtual address space?",
      ];
    }
    return [
      "Summarize the main mechanism described in this passage in your own words.",
      "Explain the cause-and-effect relationship between the key components.",
    ];
  }, [sourceSentences]);

  async function handleDiagnose(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!understanding.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userUnderstanding: understanding,
          sourceSentences,
          level: levelLabel,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to analyze your understanding.");
      }

      const data: MisconceptionReport = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setReport(null);
    setUnderstanding("");
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* 1. Primary Feature: Interactive Feynman Concept Gap Diagnostic */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/10 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
            <BrainCircuit size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Feynman Diagnostic
              </span>
              <span className="text-xs text-white/40">• Test Your Mental Model</span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif text-white tracking-tight">
              Concept Gap Finder
            </h3>
            <p className="text-xs text-white/60 mt-1 leading-relaxed max-w-2xl">
              Explain this concept in your own words. The AI diagnostic evaluates your explanation against the source textbook to pinpoint what you nailed and uncover missing concepts or misconceptions.
            </p>
          </div>
        </div>

        {/* Input Form & Starter Prompts */}
        {!report ? (
          <form onSubmit={handleDiagnose} className="space-y-4 mt-5">
            {/* Quick-Start Prompt Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-white/50 block font-medium">
                Not sure where to begin? Click a starter prompt:
              </span>
              <div className="flex flex-wrap gap-2">
                {starterPrompts.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setUnderstanding(prompt)}
                    className="text-left text-[11px] text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Student Explanation Textarea */}
            <textarea
              value={understanding}
              onChange={(e) => setUnderstanding(e.target.value)}
              placeholder="Type your explanation here in your own words... (e.g. As far as I understand, the data structure stays balanced by...)"
              className="w-full h-36 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs sm:text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-indigo-500/20 transition-all leading-relaxed resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                <HelpCircle size={12} className="text-indigo-400" />
                <span>Explaining simply without jargon reveals true mastery.</span>
              </div>
              <button
                type="submit"
                disabled={loading || !understanding.trim()}
                className="rounded-xl px-5 py-2.5 bg-white text-black font-semibold text-xs hover:bg-white/90 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-white/10"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-indigo-600" />
                    <span>Analyzing your explanation…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Diagnose Conceptual Gaps</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="text-xs text-rose-400 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                {error}
              </div>
            )}
          </form>
        ) : (
          /* Report View: Displayed ONLY after the student submits an explanation */
          <div className="space-y-5 mt-5">
            {/* Top Score Banner */}
            <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="space-y-1.5 text-center md:text-left flex-1">
                <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">
                  Diagnostic Result
                </span>
                <h4 className="text-lg md:text-xl font-serif text-white tracking-tight">
                  {report.score >= 80
                    ? "Superb Conceptual Grasp! 🎉"
                    : report.score >= 55
                    ? "Solid Foundation with Minor Gaps 💡"
                    : "Foundational Gaps Identified 🧭"}
                </h4>
                <p className="text-xs text-white/70 leading-relaxed max-w-xl">
                  {report.summary}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 min-w-[120px]">
                <span className="text-3xl font-mono font-bold text-white tracking-tight">
                  {report.score}%
                </span>
                <span className="text-[10px] text-indigo-300 uppercase tracking-widest mt-0.5">
                  Alignment Score
                </span>
              </div>
            </div>

            {/* Strengths vs Misconceptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="rounded-2xl p-4 bg-emerald-500/[0.06] border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
                  <CheckCircle2 size={15} />
                  <span>What You Nailed</span>
                </div>
                <ul className="space-y-2">
                  {report.strengths.map((st, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-white/80 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl leading-relaxed"
                    >
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Misconceptions */}
              <div className="rounded-2xl p-4 bg-amber-500/[0.06] border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                  <AlertTriangle size={15} />
                  <span>Gaps & Misconceptions in Your Explanation</span>
                </div>

                {report.misconceptions.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    No gaps detected! Your explanation accurately matches the source text.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {report.misconceptions.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 text-xs"
                      >
                        <div className="text-amber-200/90 leading-relaxed text-[11px]">
                          <b className="text-amber-300 font-semibold">Gap in your model: </b>
                          {m.gap}
                        </div>
                        <div className="text-emerald-300 bg-black/40 p-2 rounded-lg border border-emerald-500/30 leading-relaxed text-[11px]">
                          <b className="text-emerald-400 font-semibold">Accurate Concept: </b>
                          {m.correction}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bridging Explanation */}
            {report.bridgingExplanation && (
              <div className="rounded-2xl p-4 bg-indigo-500/[0.08] border border-indigo-500/20 text-xs text-white/80 space-y-1">
                <b className="text-indigo-300 block font-semibold uppercase tracking-wider text-[10px]">
                  Bridging Explanation:
                </b>
                <p className="leading-relaxed text-white/90">{report.bridgingExplanation}</p>
                {report.encouragement && (
                  <p className="text-[11px] text-white/60 italic pt-1">{report.encouragement}</p>
                )}
              </div>
            )}

            {/* Reset Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleReset}
                className="liquid-glass rounded-xl flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Test Another Explanation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Secondary Audit (Collapsed by default): AI Simplification Fidelity vs Source Textbook */}
      <details className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl group transition-all">
        <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none list-none">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 group-hover:text-white transition-colors">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <span>AI Simplification Fidelity Audit</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-mono">
                  {levelLabel} vs Source
                </span>
              </h4>
              <p className="text-[11px] text-white/50">
                Check whether simplifying textbook syntax dropped any original numbers or definitions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {verifying ? (
              <span className="flex items-center gap-1.5 text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                <Loader2 size={12} className="animate-spin" /> Verifying facts…
              </span>
            ) : droppedGaps.length === 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                <CheckCircle2 size={13} /> 100% Faithful
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-medium">
                <span>{droppedGaps.length} Simplified Details Omitted</span>
              </span>
            )}
            <ChevronDown
              size={14}
              className="text-white/40 group-open:rotate-180 transition-transform ml-1"
            />
          </div>
        </summary>

        {/* Priority Cards for Dropped Facts */}
        <div className="pt-4 mt-3 border-t border-white/10 space-y-3">
          <p className="text-[11px] text-white/50 leading-relaxed">
            Note: This automated audit checks the AI&apos;s simplified reading level against the original source sentences to verify that no core facts were lost during simplification. It is independent of your personal diagnostic above.
          </p>

          {droppedGaps.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {droppedGaps.map((gap, i) => (
                <div
                  key={gap.id || i}
                  className="rounded-2xl p-4 bg-amber-500/[0.05] border border-amber-500/20 space-y-2 hover:border-amber-400/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Sentence {gap.id.toUpperCase()} Simplification Note</span>
                    </div>
                    {onCite && (
                      <button
                        onClick={() => onCite([gap.id])}
                        className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Jump to Reading &rarr;</span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-white/90 leading-relaxed font-sans pl-4 border-l-2 border-amber-400/40">
                    {gap.note}
                  </div>

                  {gap.dropped_facts.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-semibold text-amber-400/80 mr-1">
                        Omitted in simplified tier:
                      </span>
                      {gap.dropped_facts.map((df, dfIdx) => (
                        <span
                          key={dfIdx}
                          className="rounded-lg bg-amber-400/15 border border-amber-400/25 px-2 py-0.5 text-[11px] font-medium text-amber-200"
                        >
                          {df}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-200">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white block font-medium">All facts verified faithful</strong>
                <span>
                  Every quantitative number, terminology, and core mechanism in the source text was preserved without distortion.
                </span>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
