"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  UploadCloud,
  Sparkles,
  Download,
  FileCheck,
  CheckCircle2,
  Network,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Loader2,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { UnjargonedDocumentResult, PDFSection } from "@/app/api/pdf/unjargon/route";
import { exportFullDocumentPDF } from "@/lib/pdf-export";
import type { StudentProfile } from "@/lib/types";

export default function DocumentUnjargoner({ initialProfile }: { initialProfile?: StudentProfile }) {
  const [file, setFile] = useState<{ base64: string; name: string } | null>(null);
  const [level, setLevel] = useState<"grade6" | "grade10" | "expert">(
    initialProfile?.preferred_level || "grade10"
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnjargonedDocumentResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(selectedFile?: File) {
    if (!selectedFile) return;
    if (!selectedFile.type.includes("pdf") && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF document.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const base64 = url.includes(",") ? url.split(",")[1] : url;
      setFile({ base64, name: selectedFile.name });
    };
    reader.readAsDataURL(selectedFile);
  }

  async function handleTransform() {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/pdf/unjargon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64: file.base64,
          fileName: file.name,
          targetLevel: level,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to transform full PDF document.");
      }

      const data: UnjargonedDocumentResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing PDF");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen relative bg-black text-white p-6 md:p-10">
      {/* Background radial atmosphere */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.06),transparent_50%)] pointer-events-none" />

      <main className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Navigation / Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/workspace"
              className="liquid-glass rounded-xl px-3 py-1.5 text-xs text-white/70 hover:text-white flex items-center gap-1.5 transition-colors border border-white/10"
            >
              <ArrowLeft size={13} />
              <span>Back to Concept Studio</span>
            </Link>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Full Document Unjargoner
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Target Reading Level:</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as "grade6" | "grade10" | "expert")}
              className="rounded-xl border border-white/10 bg-zinc-900/90 text-white px-3 py-1.5 text-xs outline-none"
            >
              <option value="grade6">Grade 6 (Accessible & Plain)</option>
              <option value="grade10">Grade 10 (High School Standard)</option>
              <option value="expert">Expert (Academic Precision)</option>
            </select>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="liquid-glass rounded-3xl p-8 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl space-y-3 relative z-10">
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              Complete Textbook & Paper Transformer
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-white tracking-tight">
              Transform Entire PDF Documents with Embedded Mind Maps & Diagrams
            </h1>
            <p className="text-xs md:text-sm text-white/70 leading-relaxed">
              Unlike single-concept analysis, this tool reads your entire PDF textbook, research article, or syllabus
              from start to finish. It rewrites every section into your chosen reading level, generates section-by-section
              mind maps, describes visual diagrams at the required sites, and produces a complete, downloadable Unjargoned PDF edition.
            </p>
          </div>
        </div>

        {/* Upload Dropzone */}
        {!result && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="liquid-glass rounded-3xl border-2 border-dashed border-white/15 hover:border-indigo-500/50 p-12 text-center cursor-pointer transition-all space-y-4 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
                <UploadCloud size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Upload complete textbook chapter or paper</h3>
                <p className="text-xs text-white/50">Drop your .pdf file here, or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
            </div>

            {file && (
              <div className="liquid-glass rounded-2xl p-4 border border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-white/40">Ready for full-document transformation</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTransform}
                  disabled={processing}
                  className="rounded-xl px-6 py-2.5 bg-white text-black font-semibold text-xs hover:bg-white/90 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-white/10"
                >
                  {processing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Unjargoning Entire PDF…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Start Full PDF Transformation</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Transformation Results View */}
        {result && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Results Action Bar */}
            <div className="liquid-glass rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">
                  Full Transformation Completed
                </span>
                <h2 className="text-2xl font-serif text-white tracking-tight mt-0.5">{result.docTitle}</h2>
                <p className="text-xs text-white/50 mt-1">
                  {result.totalSections} chronological sections unjargoned • Reading tier: {result.targetLevel}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="liquid-glass rounded-full px-4 py-2 text-xs font-medium text-white/70 hover:text-white border border-white/10 transition-colors"
                >
                  Upload Another Document
                </button>

                <button
                  type="button"
                  onClick={() => exportFullDocumentPDF(result)}
                  className="rounded-full px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Full Unjargoned PDF</span>
                </button>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="liquid-glass rounded-3xl p-6 border border-white/10 space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-white/50 font-semibold flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-400" />
                <span>Executive Summary & Master Conceptual Model</span>
              </h4>
              <p className="text-xs md:text-sm text-white/80 leading-relaxed">{result.executiveSummary}</p>
            </div>

            {/* Master Concept Mind Map of Document */}
            {result.overallMindMap && result.overallMindMap.edges.length > 0 && (
              <div className="liquid-glass rounded-3xl p-6 border border-white/10 space-y-4">
                <h4 className="text-xs uppercase tracking-wider text-white/50 font-semibold flex items-center gap-2">
                  <Network size={14} className="text-indigo-400" />
                  <span>Master Document Mind Map Overview</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {result.overallMindMap.edges.map((edge, i) => {
                    const fromNode =
                      result.overallMindMap.nodes.find((n) => n.id === edge.from)?.label || edge.from;
                    const toNode =
                      result.overallMindMap.nodes.find((n) => n.id === edge.to)?.label || edge.to;
                    return (
                      <div
                        key={i}
                        className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex flex-col justify-between text-xs"
                      >
                        <div className="font-semibold text-white truncate">{fromNode}</div>
                        <div className="text-[10px] text-indigo-300 font-mono my-1">
                          ↳ {edge.label} →
                        </div>
                        <div className="font-semibold text-white/80 truncate">{toNode}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chronological Section Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-serif text-white tracking-tight flex items-center gap-2">
                <span>Unjargoned Sections & Inline Visual Diagrams</span>
                <span className="text-xs font-mono text-white/40">({result.sections.length} Sections)</span>
              </h3>

              {result.sections.map((sec, idx) => {
                const isExpanded = expandedSection === idx;
                return (
                  <div
                    key={idx}
                    className="liquid-glass rounded-3xl border border-white/10 overflow-hidden transition-all"
                  >
                    {/* Section Header Accordion Trigger */}
                    <button
                      type="button"
                      onClick={() => setExpandedSection(isExpanded ? null : idx)}
                      className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold">
                            SECTION {idx + 1}
                          </span>
                          <span className="text-xs text-white/40">• Grade {sec.readingGrade}</span>
                        </div>
                        <h4 className="text-lg font-medium text-white">{sec.sectionTitle}</h4>
                      </div>
                      <div className="p-2 rounded-xl liquid-glass text-white/60">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Section Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-6">
                        {/* Unjargoned Text Body */}
                        <div className="space-y-2">
                          <span className="text-[11px] uppercase tracking-wider text-white/40 font-semibold block">
                            Unjargoned Content:
                          </span>
                          <p className="text-xs md:text-sm text-white/90 leading-relaxed whitespace-pre-line bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            {sec.unjargonedText}
                          </p>
                        </div>

                        {/* Inline Diagram / Mechanism Site */}
                        {sec.diagramWalkthrough && (
                          <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={14} />
                              <span>Embedded Diagram & Mechanism (At this Site):</span>
                            </span>
                            <p className="text-xs text-white/80 leading-relaxed font-serif italic">
                              {sec.diagramWalkthrough}
                            </p>
                          </div>
                        )}

                        {/* Section Mind Map & Key Terminology */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Mind Map for Section */}
                          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-2">
                            <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold flex items-center gap-1.5">
                              <Network size={13} className="text-indigo-400" />
                              <span>Section Mind Map Links</span>
                            </span>
                            <div className="space-y-1.5">
                              {sec.conceptMindMap.edges.map((e, ei) => {
                                const fromLabel =
                                  sec.conceptMindMap.nodes.find((n) => n.id === e.from)?.label || e.from;
                                const toLabel =
                                  sec.conceptMindMap.nodes.find((n) => n.id === e.to)?.label || e.to;
                                return (
                                  <div
                                    key={ei}
                                    className="text-xs text-white/70 flex items-center gap-1.5 font-mono"
                                  >
                                    <span className="text-white">{fromLabel}</span>
                                    <span className="text-indigo-300 text-[10px]">--({e.label})--&gt;</span>
                                    <span className="text-white/80">{toLabel}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Key Terminology */}
                          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-2">
                            <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold flex items-center gap-1.5">
                              <BookOpen size={13} className="text-indigo-400" />
                              <span>Key Concepts & Glossary</span>
                            </span>
                            <div className="space-y-1.5">
                              {sec.keyConcepts.map((item, ki) => (
                                <div key={ki} className="text-xs">
                                  <span className="font-semibold text-white">
                                    {item.emoji} {item.term}:{" "}
                                  </span>
                                  <span className="text-white/70">{item.explanation}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Section Checkpoint Questions */}
                        {sec.checkpointQuiz && sec.checkpointQuiz.length > 0 && (
                          <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-3">
                            <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                              <HelpCircle size={14} />
                              <span>Section Checkpoint Questions</span>
                            </span>
                            <div className="space-y-3">
                              {sec.checkpointQuiz.map((q, qi) => (
                                <div key={qi} className="text-xs space-y-1.5">
                                  <div className="font-semibold text-white">
                                    {qi + 1}. {q.question}
                                  </div>
                                  {q.hint && (
                                    <div className="text-[11px] text-amber-300 italic flex items-center gap-1">
                                      <Lightbulb size={11} />
                                      <span>Hint: {q.hint}</span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                    {q.options.map((opt, oi) => (
                                      <div
                                        key={oi}
                                        className={`p-2 rounded-xl text-xs border ${
                                          oi === q.answer
                                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                            : "border-white/5 bg-white/[0.01] text-white/60"
                                        }`}
                                      >
                                        <span className="font-mono mr-1.5">{"ABCD"[oi]}.</span>
                                        {opt}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
