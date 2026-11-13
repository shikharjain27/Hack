"use client";

import { useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  RotateCcw,
} from "lucide-react";
import type { Sentence } from "@/lib/types";

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
  onCite,
}: {
  sourceSentences: Sentence[];
  levelLabel: string;
  onCite?: (sentenceIds: string[]) => void;
}) {
  const [understanding, setUnderstanding] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<MisconceptionReport | null>(null);

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
      setError(err instanceof Error ? err.message : "Error analyzing concepts.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setReport(null);
    setUnderstanding("");
  }

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <BrainCircuit size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Feynman Diagnostic
              </span>
              <span className="text-xs text-white/40">• Personalized Misconception Detector</span>
            </div>
            <h3 className="text-xl md:text-2xl font-serif text-white tracking-tight">
              Test Your Conceptual Understanding
            </h3>
            <p className="text-xs md:text-sm text-white/60 mt-1.5 leading-relaxed max-w-2xl">
              Type what you feel you have understood about this topic in your own words. The AI will cross-reference
              your explanation against the source material, identify what you nailed, expose hidden misconceptions, and
              give you bridging guidance to close the gap.
            </p>
          </div>
        </div>
      </div>

      {/* Input area if no report or editing */}
      {!report ? (
        <form onSubmit={handleDiagnose} className="space-y-4">
          <div className="liquid-glass rounded-3xl p-5 border border-white/10 space-y-3">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb size={14} className="text-amber-400" />
              What is your current understanding of this concept?
            </label>
            <textarea
              value={understanding}
              onChange={(e) => setUnderstanding(e.target.value)}
              placeholder="e.g. As far as I understand, the Krebs cycle takes acetyl-CoA and turns it into citric acid to make ATP directly for the cell..."
              className="w-full h-44 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-indigo-500/20 transition-all leading-relaxed resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-white/40">
                Tip: Don&apos;t worry about sounding scientific — explaining it simply helps expose true mental models!
              </div>
              <button
                type="submit"
                disabled={loading || !understanding.trim()}
                className="rounded-xl px-5 py-2.5 bg-white text-black font-semibold text-xs hover:bg-white/90 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-white/10"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Analyzing your mental model…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Diagnose Conceptual Gaps</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {error && <div className="text-xs text-rose-400 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">{error}</div>}
        </form>
      ) : (
        /* Diagnostic Report Results */
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="liquid-glass rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left flex-1">
              <span className="text-[11px] uppercase tracking-wider text-white/50 font-medium">
                Diagnostic Assessment Result
              </span>
              <h4 className="text-xl md:text-2xl font-serif text-white tracking-tight">
                {report.score >= 80 ? "Superb Conceptual Grasp! 🎉" : report.score >= 55 ? "Solid Foundation with Minor Gaps 💡" : "Foundational Gaps Identified 🧭"}
              </h4>
              <p className="text-xs md:text-sm text-white/70 leading-relaxed max-w-xl">
                {report.summary}
              </p>
            </div>

            {/* Score Ring / Bar */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.04] border border-white/10 min-w-[130px]">
              <span className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tight">
                {report.score}%
              </span>
              <span className="text-[10px] text-indigo-300 uppercase tracking-widest mt-1">
                Conceptual Alignment
              </span>
            </div>
          </div>

          {/* Side-by-side Strengths vs Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths Card */}
            <div className="liquid-glass rounded-3xl p-5 border border-white/10 space-y-3.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
                <CheckCircle2 size={16} />
                <span>What You Nailed</span>
              </div>
              <ul className="space-y-2.5">
                {report.strengths.map((st, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-white/80 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl leading-relaxed"
                  >
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Misconceptions & Gaps */}
            <div className="liquid-glass rounded-3xl p-5 border border-white/10 space-y-3.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                <AlertTriangle size={16} />
                <span>Conceptual Gaps & Misconceptions</span>
              </div>

              {report.misconceptions.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  No misconceptions detected! Your mental model aligns seamlessly with the textbook facts.
                </div>
              ) : (
                <div className="space-y-3">
                  {report.misconceptions.map((m, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs"
                    >
                      <div>
                        <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider block">
                          What you wrote / implied:
                        </span>
                        <p className="text-white/90 italic font-mono text-[11px] mt-0.5">
                          &ldquo;{m.claim}&rdquo;
                        </p>
                      </div>

                      <div className="text-amber-200/80 leading-relaxed text-[11px]">
                        <b className="text-amber-300 font-semibold">The misconception: </b>
                        {m.gap}
                      </div>

                      <div className="text-emerald-300 bg-black/40 p-2.5 rounded-lg border border-emerald-500/30 leading-relaxed">
                        <b className="text-emerald-400 font-semibold">Accurate mental model: </b>
                        {m.correction}
                      </div>

                      {m.relatedSentenceId && onCite && (
                        <button
                          type="button"
                          onClick={() => onCite([m.relatedSentenceId!])}
                          className="text-[10px] text-indigo-300 hover:text-indigo-200 underline flex items-center gap-1 cursor-pointer pt-1"
                        >
                          <span>Highlight textbook proof sentence [{m.relatedSentenceId}]</span>
                          <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bridging Explanation Card */}
          <div className="liquid-glass rounded-3xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs tracking-wider uppercase">
              <Sparkles size={15} />
              <span>Bridging Explanation: Closing Your Learning Gap</span>
            </div>
            <p className="text-xs md:text-sm text-white/80 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              {report.bridgingExplanation}
            </p>
            <p className="text-xs text-indigo-300 italic pt-1">
              &ldquo;{report.encouragement}&rdquo;
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleReset}
              className="liquid-glass rounded-xl px-4 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer border border-white/10 flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Try Explaining Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
