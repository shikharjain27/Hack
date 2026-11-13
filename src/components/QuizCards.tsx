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
  // whether quiz has been submitted
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // sentence lookup
  const sentenceMap = new Map((sourceSentences || []).map((s) => [s.id, s.text]));

  const totalQuestions = items.length;
  const answeredCount = Object.keys(selected).length;
  const isComplete = answeredCount === totalQuestions;

  // Calculate final score
  const correctCount = items.reduce((acc, q, idx) => {
    return acc + (selected[idx] === q.answer ? 1 : 0);
  }, 0);
  const scorePercent = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);

  async function handleSubmit() {
    if (!isComplete && !window.confirm(`You answered ${answeredCount} of ${totalQuestions} questions. Submit anyway?`)) {
      return;
    }
    setSubmitted(true);
    setSaving(true);

    try {
      const res = await fetch("/api/profile/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: correctCount,
          total: totalQuestions,
          title: title || "Lesson Quiz",
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        if (onQuizSubmitted) onQuizSubmitted(correctCount, totalQuestions);
      }
    } catch {
      // offline/fallback
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSelected({});
    setShowHint({});
    setSubmitted(false);
    setSavedSuccess(false);
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header Bar */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <HelpCircle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Self-Assessment
              </span>
              <span className="text-xs text-white/40">• {totalQuestions} Questions</span>
            </div>
            <h3 className="text-lg md:text-xl font-serif text-white tracking-tight mt-1">
              Active Recall Knowledge Check
            </h3>
          </div>
        </div>

        {submitted ? (
          <div className="flex items-center gap-4 bg-white/[0.04] p-3 rounded-2xl border border-white/10">
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-white">
                {correctCount} / {totalQuestions}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-indigo-300">
                Score: {scorePercent}%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Trophy size={22} />
            </div>
          </div>
        ) : (
          <div className="text-xs text-white/60 bg-white/[0.04] px-4 py-2 rounded-2xl border border-white/10">
            Answered: <b className="text-white">{answeredCount}</b> of <b className="text-white">{totalQuestions}</b>
          </div>
        )}
      </div>

      {/* Submitted Result Callout */}
      {submitted && (
        <div className="liquid-glass rounded-3xl p-6 border border-white/10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-lg font-serif text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              <span>
                {scorePercent >= 80
                  ? "Outstanding Performance!"
                  : scorePercent >= 50
                  ? "Good Effort — Review the Gaps Below"
                  : "Needs Review — Take a Look at the Proof References"}
              </span>
            </h4>
            {savedSuccess && (
              <span className="text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full font-medium">
                ✓ Recorded to student profile
              </span>
            )}
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Your answers are evaluated below. Any questions you missed include the exact ground-truth textbook
            reference, explanation, and an option to view the highlighted passage in the source view.
          </p>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        {items.map((q, qi) => {
          const chosen = selected[qi];
          const isAnswered = chosen !== undefined;
          const isCorrect = isAnswered && chosen === q.answer;
          const isWrong = submitted && chosen !== q.answer;
          const refSentence = sentenceMap.get(q.source_id);

          return (
            <div
              key={qi}
              className={`liquid-glass rounded-3xl p-6 border transition-all ${
                submitted
                  ? isCorrect
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-rose-500/30 bg-rose-950/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Question Header & Hint Toggle */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="font-medium text-white text-base leading-snug">
                  <span className="text-indigo-400 font-mono mr-2.5 font-bold">Q{qi + 1}.</span>
                  {q.q}
                </div>

                {q.hint && !submitted && (
                  <button
                    type="button"
                    onClick={() => setShowHint({ ...showHint, [qi]: !showHint[qi] })}
                    className="shrink-0 text-[11px] font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Lightbulb size={12} />
                    <span>{showHint[qi] ? "Hide hint" : "Get hint"}</span>
                  </button>
                )}
              </div>

              {/* Hint Box (if toggled) */}
              {showHint[qi] && !submitted && q.hint && (
                <div className="mb-4 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2">
                  <Lightbulb size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300">Hint: </span>
                    {q.hint}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="grid gap-2.5">
                {q.options.map((optionText, optIdx) => {
                  const isThisSelected = chosen === optIdx;
                  const isThisCorrect = optIdx === q.answer;

                  let style = "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/[0.06] hover:border-white/20";
                  if (!submitted) {
                    if (isThisSelected) {
                      style = "border-indigo-500/60 bg-indigo-500/20 text-white font-medium ring-1 ring-indigo-500/40";
                    }
                  } else {
                    if (isThisCorrect) {
                      style = "border-emerald-500/60 bg-emerald-500/20 text-emerald-200 font-medium";
                    } else if (isThisSelected && !isThisCorrect) {
                      style = "border-rose-500/60 bg-rose-500/20 text-rose-200 font-medium";
                    } else {
                      style = "border-white/5 bg-white/[0.01] text-white/30 opacity-40";
                    }
                  }

                  const optLetter = "ABCD"[optIdx];

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => setSelected({ ...selected, [qi]: optIdx })}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-all cursor-pointer ${style}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full border border-white/20 text-[11px] font-mono flex items-center justify-center shrink-0">
                          {optLetter}
                        </span>
                        <span>{optionText}</span>
                      </div>

                      {submitted && isThisCorrect && (
                        <CheckCircle2 size={17} className="text-emerald-400 shrink-0 ml-2" />
                      )}
                      {submitted && isThisSelected && !isThisCorrect && (
                        <XCircle size={17} className="text-rose-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Post-submission Review & Ground Truth Reference Box */}
              {submitted && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2.5">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isCorrect ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isCorrect ? "✓ Correct Answer" : "✗ Incorrect"}
                    </span>

                    {onViewSourceInRead && (
                      <button
                        type="button"
                        onClick={() => onViewSourceInRead(q.source_id)}
                        className="text-xs text-indigo-300 hover:text-indigo-200 underline flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen size={12} />
                        <span>View proof in Read tab</span>
                        <ArrowRight size={10} />
                      </button>
                    )}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <p className="text-xs text-white/70 bg-white/[0.03] p-3 rounded-xl border border-white/5 leading-relaxed">
                      <b className="text-white">Explanation: </b>
                      {q.explanation}
                    </p>
                  )}

                  {/* Ground Truth Reference Text Provided Directly Here */}
                  {refSentence && (
                    <div className="text-xs rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 text-amber-200/90 leading-relaxed">
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
                        <Sparkles size={13} />
                        <span>Ground Truth Textbook Reference [{q.source_id}]:</span>
                      </div>
                      <p className="italic font-serif text-white/90">&ldquo;{refSentence}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Submit / Retry Bar */}
      <div className="flex items-center justify-between gap-4 pt-4">
        {submitted ? (
          <button
            type="button"
            onClick={handleReset}
            className="liquid-glass rounded-xl px-5 py-2.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer border border-white/10 flex items-center gap-2"
          >
            <RotateCcw size={14} />
            <span>Retake Quiz</span>
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-white/50">
              {answeredCount < totalQuestions
                ? `${totalQuestions - answeredCount} questions remaining`
                : "All questions answered — ready to grade"}
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={answeredCount === 0 || saving}
              className="rounded-xl px-6 py-2.5 bg-white text-black font-semibold text-xs hover:bg-white/90 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-white/10"
            >
              <Sparkles size={14} />
              <span>{saving ? "Grading & Saving…" : "Submit Quiz & See Score"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
