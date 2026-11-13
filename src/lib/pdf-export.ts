import jsPDF from "jspdf";
import type { UnjargonedDocumentResult } from "@/app/api/pdf/unjargon/route";

const LEVEL_NAMES = {
  grade6: "Grade 6 (Middle School)",
  grade10: "Grade 10 (High School)",
  expert: "Expert (Advanced Academic)",
};

export function exportFullDocumentPDF(docData: UnjargonedDocumentResult) {
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

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // COVER / HEADER BANNER
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("UNJARGON | Complete Document Edition", margin + 6, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  const lvlName = LEVEL_NAMES[docData.targetLevel as keyof typeof LEVEL_NAMES] || docData.targetLevel;
  doc.text(
    `Full Document Transformation  •  Target Tier: ${lvlName}  •  ${docData.totalSections} Total Sections`,
    margin + 6,
    y + 19
  );
  y += 33;

  // DOCUMENT TITLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(docData.docTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 4;

  // EXECUTIVE SUMMARY BOX
  checkPage(30);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  const summaryLines = doc.splitTextToSize(docData.executiveSummary, contentWidth - 8);
  const boxHeight = summaryLines.length * 5 + 14;

  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text("Executive Summary & Core Thesis", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(summaryLines, margin + 4, y + 12);
  y += boxHeight + 8;

  // OVERALL MIND MAP OVERVIEW
  if (docData.overallMindMap && docData.overallMindMap.edges.length > 0) {
    checkPage(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text("Master Conceptual Mind Map Flow", margin, y);
    y += 6;

    const nodeMap = new Map(docData.overallMindMap.nodes.map((n) => [n.id, n.label]));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    for (const edge of docData.overallMindMap.edges.slice(0, 8)) {
      checkPage(5.5);
      const fromLabel = nodeMap.get(edge.from) || edge.from;
      const toLabel = nodeMap.get(edge.to) || edge.to;
      const line = `  [${fromLabel}]  --> (${edge.label}) -->  [${toLabel}]`;
      const splitLine = doc.splitTextToSize(line, contentWidth);
      doc.text(splitLine, margin, y);
      y += splitLine.length * 4.8;
    }
    y += 6;
  }

  // PROCESS EACH SECTION IN SEQUENTIAL ORDER
  docData.sections.forEach((sec, idx) => {
    checkPage(40);

    // Section separator bar
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 0.5, "F");
    y += 6;

    // Section header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    const secTitleLines = doc.splitTextToSize(`Section ${idx + 1}: ${sec.sectionTitle}`, contentWidth);
    doc.text(secTitleLines, margin, y);
    y += secTitleLines.length * 6.5 + 2;

    // Readability Badge
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Reading Level: Grade ${sec.readingGrade}  •  Source: ${sec.originalSummary}`, margin, y);
    y += 6;

    // Unjargoned full prose text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    const proseLines = doc.splitTextToSize(sec.unjargonedText, contentWidth);
    for (const pLine of proseLines) {
      checkPage(5.2);
      doc.text(pLine, margin, y);
      y += 5;
    }
    y += 5;

    // EMBEDDED DIAGRAM / WALKTHROUGH AT THE REQUIRED SITE
    if (sec.diagramWalkthrough) {
      checkPage(24);
      doc.setFillColor(238, 242, 255); // indigo-50
      doc.setDrawColor(199, 210, 254);
      const diagLines = doc.splitTextToSize(sec.diagramWalkthrough, contentWidth - 8);
      const dHeight = diagLines.length * 4.6 + 12;

      doc.roundedRect(margin, y, contentWidth, dHeight, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(67, 56, 202); // indigo-700
      doc.text("Visual Diagram & Mechanism Breakdown (Embedded at this Site)", margin + 4, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(diagLines, margin + 4, y + 10.5);
      y += dHeight + 6;
    }

    // SECTION MIND MAP
    if (sec.conceptMindMap && sec.conceptMindMap.edges.length > 0) {
      checkPage(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229);
      doc.text("Section Mind Map Links:", margin + 2, y);
      y += 5;

      const sNodeMap = new Map(sec.conceptMindMap.nodes.map((n) => [n.id, n.label]));
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      for (const e of sec.conceptMindMap.edges.slice(0, 5)) {
        checkPage(5);
        const fl = sNodeMap.get(e.from) || e.from;
        const tl = sNodeMap.get(e.to) || e.to;
        const eStr = `  • ${fl} --(${e.label})--> ${tl}`;
        doc.text(doc.splitTextToSize(eStr, contentWidth - 4), margin + 2, y);
        y += 4.5;
      }
      y += 4;
    }

    // KEY CONCEPTS GLOSSARY FOR THIS SECTION
    if (sec.keyConcepts && sec.keyConcepts.length > 0) {
      checkPage(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229);
      doc.text("Section Terminology & Definitions:", margin + 2, y);
      y += 5;

      for (const term of sec.keyConcepts) {
        checkPage(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`• ${term.term}: `, margin + 4, y);

        const tWidth = doc.getTextWidth(`• ${term.term}: `);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        const expLines = doc.splitTextToSize(term.explanation, contentWidth - tWidth - 6);
        doc.text(expLines[0], margin + 4 + tWidth, y);
        y += 4.5;
        for (let k = 1; k < expLines.length; k++) {
          checkPage(4.5);
          doc.text(expLines[k], margin + 8, y);
          y += 4.5;
        }
      }
      y += 3;
    }

    // CHECKPOINT QUIZ & HINTS
    if (sec.checkpointQuiz && sec.checkpointQuiz.length > 0) {
      checkPage(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text("Active Recall Checkpoint & Questions:", margin + 2, y);
      y += 5;

      sec.checkpointQuiz.forEach((q, qIndex) => {
        checkPage(18);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const qLines = doc.splitTextToSize(`Q${idx + 1}.${qIndex + 1} ${q.question}`, contentWidth - 4);
        doc.text(qLines, margin + 4, y);
        y += qLines.length * 4.2;

        if (q.hint) {
          checkPage(5);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(180, 83, 9);
          doc.text(`Hint: ${q.hint}`, margin + 6, y);
          y += 4;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        q.options.forEach((opt, oIdx) => {
          checkPage(4.5);
          const isCorrect = oIdx === q.answer;
          doc.setTextColor(isCorrect ? 22 : 71, isCorrect ? 101 : 85, isCorrect ? 52 : 105);
          doc.text(`   [${"ABCD"[oIdx]}] ${opt} ${isCorrect ? " (Answer)" : ""}`, margin + 6, y);
          y += 3.8;
        });

        y += 2;
      });
    }

    y += 8;
  });

  // FINAL PAGINATION FOOTER
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Unjargon Full Document Edition • "${docData.docTitle}" • Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  const safeName =
    docData.docTitle.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "unjargoned_full_document";
  doc.save(`${safeName}_full_edition.pdf`);
}
