import jsPDF from "jspdf";
import type { TransformResult, QuizItem } from "./types";
import { computeMetrics } from "./readability";

const LABELS = { expert: "Expert", grade10: "Grade 10", grade6: "Grade 6" } as const;
type LevelKey = keyof typeof LABELS;

export function toMarkdown(r: TransformResult): string {
  const lines: string[] = [`# ${r.title}`, ""];
  (["grade6", "grade10", "expert"] as const).forEach((k) => {
    lines.push(`## ${LABELS[k]} version`, "", r.levels[k].map((s) => s.text).join(" "), "");
  });
  lines.push("## Key terms", "");
  r.glossary.forEach((g) => lines.push(`- ${g.emoji} **${g.term}** — ${g.plain}`));
  lines.push("", "## Concept map", "");
  const label = new Map(r.concept_map.nodes.map((n) => [n.id, n.label]));
  r.concept_map.edges.forEach((e) => lines.push(`- ${label.get(e.from)} —(${e.label})→ ${label.get(e.to)}`));
  lines.push("", "## Quiz & Question Bank", "");
  r.quiz.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.q}`);
    if (q.hint) lines.push(`   *Hint: ${q.hint}*`);
    q.options.forEach((o, oi) => lines.push(`   - ${"abcd"[oi]}) ${o}${oi === q.answer ? "  ✅" : ""}`));
    if (q.explanation) lines.push(`   *Explanation: ${q.explanation}*`);
  });
  if (r.diagram_alt_text) lines.push("", "## Diagram description", "", r.diagram_alt_text);
  return lines.join("\n");
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a clean, beautifully formatted Unjargoned study sheet PDF.
 * Options include:
 * - includeQuestionBank: generates a full question bank with hints & answer keys.
 */
export function downloadUnjargonedPDF(
  result: TransformResult,
  level: LevelKey,
  options: { includeQuestionBank?: boolean } = { includeQuestionBank: true }
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPage = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("UNJARGON | AI Accessible Learning", margin + 6, y + 9);

  const currentMetric = computeMetrics(result.levels[level], result.glossary);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text(
    `Reading Tier: ${LABELS[level]}  •  FK Readability: Grade ${currentMetric.fkGrade}  •  Avg Sentence: ${currentMetric.avgSentenceLen} words`,
    margin + 6,
    y + 16
  );
  y += 28;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(result.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 4;

  // Unjargoned Body Prose
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(`Unjargoned Text (${LABELS[level]})`, margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const bodyText = result.levels[level].map((s) => s.text).join(" ");
  const bodyLines = doc.splitTextToSize(bodyText, contentWidth);

  for (const line of bodyLines) {
    checkPage(6);
    doc.text(line, margin, y);
    y += 5.2;
  }
  y += 6;

  // Diagram description if present
  if (result.diagram_alt_text) {
    checkPage(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.text("Extracted Diagram / Visual Key", margin, y);
    y += 5.5;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const diagLines = doc.splitTextToSize(result.diagram_alt_text, contentWidth);
    for (const line of diagLines) {
      checkPage(5.5);
      doc.text(line, margin, y);
      y += 4.8;
    }
    y += 6;
  }

  // Key Vocabulary / Glossary
  checkPage(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text("Essential Glossary & Key Concepts", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const item of result.glossary) {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${item.term}:`, margin + 2, y);

    const termWidth = doc.getTextWidth(`• ${item.term}: `);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    const explLines = doc.splitTextToSize(item.plain, contentWidth - termWidth - 4);
    doc.text(explLines[0], margin + 2 + termWidth, y);
    y += 4.8;
    for (let i = 1; i < explLines.length; i++) {
      checkPage(5);
      doc.text(explLines[i], margin + 6, y);
      y += 4.8;
    }
    y += 1.5;
  }
  y += 6;

  // Comprehensive Question Bank & Hints
  if (options.includeQuestionBank && result.quiz && result.quiz.length > 0) {
    checkPage(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text("Comprehensive Question Bank & Active Recall", margin, y);
    y += 6;

    result.quiz.forEach((q, idx) => {
      checkPage(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const qLines = doc.splitTextToSize(`Q${idx + 1}. ${q.q}`, contentWidth);
      doc.text(qLines, margin + 2, y);
      y += qLines.length * 4.8;

      // Question Hint
      if (q.hint) {
        checkPage(6);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(180, 83, 9); // amber-700
        const hintLines = doc.splitTextToSize(`Hint: ${q.hint}`, contentWidth - 4);
        doc.text(hintLines, margin + 4, y);
        y += hintLines.length * 4.2;
      }

      // Options
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      q.options.forEach((opt, oIdx) => {
        checkPage(5);
        const isCorrect = oIdx === q.answer;
        if (isCorrect) {
          doc.setTextColor(22, 101, 52); // green-800
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(71, 85, 105);
          doc.setFont("helvetica", "normal");
        }
        const optLetter = "ABCD"[oIdx];
        const optLines = doc.splitTextToSize(
          `    [${optLetter}] ${opt} ${isCorrect ? " (Correct Answer)" : ""}`,
          contentWidth
        );
        doc.text(optLines, margin + 2, y);
        y += optLines.length * 4.2;
      });

      // Explanation / Proof Reference
      if (q.explanation) {
        checkPage(6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const expLines = doc.splitTextToSize(`Explanation: ${q.explanation}`, contentWidth - 6);
        doc.text(expLines, margin + 4, y);
        y += expLines.length * 4;
      }

      y += 3;
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by Unjargon AI • Accessible Study Material & Question Bank • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  const safeFilename = result.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "unjargoned_study_sheet";
  doc.save(`${safeFilename}_${level}_study_guide.pdf`);
}
