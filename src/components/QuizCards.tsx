"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Trophy,
  Lightbulb,
  Check,
} from "lucide-react";
import type { QuizItem, Sentence } from "@/lib/types";

export default function QuizCards({
  items,
  sourceSentences,
  title,
  onViewSourceInRead,
  onQuizSubmitted,
}: {
  items: QuizItem[];
  sourceSentences?: Sentence[];
  title?: string;
  onViewSourceInRead?: (sourceId: string) => void;
  onQuizSubmitted?: (score: number, total: number) => void;
}) {
  // picked answers map: question index -> chosen option index
  const [selected, setSelected] = useState<Record<number, number>>({});
  // shown hints map: question index -> boolean
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});

  const totalQuestions = items.length;
  const answeredCount = Object.keys(selected).length;

  // Running live score
  const correctCount = items.reduce((acc, q, idx) => {
    return acc + (selected[idx] === q.answer ? 1 : 0);
  }, 0);
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  function handleSelectOption(qIdx: number, optIdx: number) {
    // Only allow selecting once per question for authentic quiz experience
    if (selected[qIdx] !== undefined) return;

    const nextSelected = { ...selected, [qIdx]: optIdx };
    setSelected(nextSelected);

    // If quiz is now complete, record quiz score
    if (Object.keys(nextSelected).length === totalQuestions) {
      const finalCorrect = items.reduce((acc, q, idx) => {
        return acc + (nextSelected[idx] === q.answer ? 1 : 0);
      }, 0);
      fetch("/api/profile/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: finalCorrect,
          total: totalQuestions,
          title: title || "Lesson Quiz",
        }),
      }).catch(() => {});
      if (onQuizSubmitted) onQuizSubmitted(finalCorrect, totalQuestions);
    }
  }

  function handleReset() {
    setSelected({});
    setShowHint({});
  }

  return (
    <div className="space-y-5">
      {/* Quiz Header Bar with Live Real-Time Feedback */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <HelpCircle size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Interactive Quiz
              </span>
              <span className="text-xs text-white/40">• Instant Feedback Mode</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
              Knowledge Check
            </h3>
          </div>
        </div>

        {/* Live Score Counter */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-white/50 block">Live Score</span>
            <span className="font-mono text-base font-bold text-white">
              <span className="text-emerald-400">{correctCount}</span> / {totalQuestions}
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-indigo-300">
            {answeredCount === 0 ? "0%" : `${scorePercent}%`}
          </div>

          {answeredCount > 0 && (
            <button
              onClick={handleReset}
              className="p-2 rounded-xl liquid-glass text-white/60 hover:text-white transition-colors cursor-pointer border border-white/10"
              title="Reset quiz"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Quiz Items List with Instant Feedback */}
      <div className="space-y-4">
        {items.map((item, qIdx) => {
          const userChoice = selected[qIdx];
          const isAnswered = userChoice !== undefined;
          const isCorrect = isAnswered && userChoice === item.answer;

          return (
            <div
              key={qIdx}
              className={`liquid-glass rounded-3xl p-5 sm:p-6 border transition-all duration-200 space-y-4 ${
                isAnswered
                  ? isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                    : "border-rose-500/40 bg-rose-500/[0.03]"
                  : "border-white/10"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                    Question {qIdx + 1} of {totalQuestions}
                  </span>
                  <h4 className="text-sm sm:text-base font-semibold text-white leading-snug">
                    {item.q}
                  </h4>
                </div>

                {isAnswered && (
                  <span
                    className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                      isCorrect
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 size={13} /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle size={13} /> Incorrect
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {item.options.map((opt, optIdx) => {
                  const isSelectedOption = userChoice === optIdx;
                  const isTargetCorrect = optIdx === item.answer;

                  let btnStyle =
                    "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/[0.06] hover:border-white/20";
                  if (isAnswered) {
                    if (isTargetCorrect) {
                      btnStyle =
                        "border-emerald-500/60 bg-emerald-500/20 text-emerald-200 font-medium shadow-md shadow-emerald-500/10";
                    } else if (isSelectedOption && !isCorrect) {
                      btnStyle =
                        "border-rose-500/60 bg-rose-500/20 text-rose-200 font-medium line-through";
                    } else {
                      btnStyle = "border-white/5 bg-transparent text-white/30 cursor-not-allowed";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`text-left rounded-2xl p-3 sm:p-3.5 border text-xs sm:text-[13px] leading-relaxed transition-all flex items-start gap-2.5 cursor-pointer ${btnStyle}`}
                    >
                      <span className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-mono font-semibold shrink-0 mt-0.5">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isAnswered && isTargetCorrect && (
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Explanation / Feedback Card */}
              {isAnswered && (
                <div className="pt-2 border-t border-white/10 space-y-2.5 text-xs">
                  {item.explanation && (
                    <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 leading-relaxed text-white/90">
                      <strong className="text-white block font-medium mb-0.5">
                        {isCorrect ? "Why that's right:" : "Explanation:"}
                      </strong>
                      <span className="text-white/70">{item.explanation}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/50">
                    {item.source_id && onViewSourceInRead && (
                      <button
                        onClick={() => onViewSourceInRead(item.source_id)}
                        className="text-indigo-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <BookOpen size={12} />
                        <span>View Source Evidence [{item.source_id.toUpperCase()}] &rarr;</span>
                      </button>
                    )}

                    {item.hint && (
                      <button
                        onClick={() =>
                          setShowHint((h) => ({ ...h, [qIdx]: !h[qIdx] }))
                        }
                        className="text-amber-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Lightbulb size={12} />
                        <span>{showHint[qIdx] ? "Hide Hint" : "Show Hint"}</span>
                      </button>
                    )}
                  </div>

                  {showHint[qIdx] && item.hint && (
                    <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-200 text-xs">
                      <strong className="font-semibold text-amber-300">Hint: </strong>
                      {item.hint}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
