import { NextResponse } from "next/server";
import { Type, type Schema, type Part } from "@google/genai";
import { generateJSON } from "@/lib/gemini";

export interface PDFSection {
  sectionTitle: string;
  originalSummary: string;
  unjargonedText: string;
  readingGrade: number;
  diagramWalkthrough?: string;
  diagramSvgPrompt?: string; // visual concept description
  keyConcepts: { term: string; explanation: string; emoji: string }[];
  conceptMindMap: {
    nodes: { id: string; label: string; category?: string }[];
    edges: { from: string; to: string; label: string }[];
  };
  checkpointQuiz: {
    question: string;
    options: string[];
    answer: number;
    hint: string;
    explanation: string;
  }[];
}

export interface UnjargonedDocumentResult {
  docTitle: string;
  authorOrSource?: string;
  targetLevel: string;
  executiveSummary: string;
  totalSections: number;
  sections: PDFSection[];
  overallMindMap: {
    nodes: { id: string; label: string }[];
    edges: { from: string; to: string; label: string }[];
  };
}

const sectionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sectionTitle: { type: Type.STRING, description: "Descriptive title of this section or chapter unit" },
    originalSummary: { type: Type.STRING, description: "Brief 1-2 sentence synopsis of what the source text presented" },
    unjargonedText: {
      type: Type.STRING,
      description: "Full, thorough unjargoned rewriting of this entire section at the chosen reading level. Preserve all core facts, quantitative data, and logical sequences without impenetrable jargon.",
    },
    readingGrade: { type: Type.INTEGER, description: "Target Flesch-Kincaid Grade level achieved for this section (e.g. 6, 8, 10)" },
    diagramWalkthrough: {
      type: Type.STRING,
      description: "Detailed step-by-step description and breakdown of any visual, chart, reaction, or mechanism in this section.",
    },
    keyConcepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          explanation: { type: Type.STRING },
          emoji: { type: Type.STRING },
        },
        required: ["term", "explanation", "emoji"],
      },
      description: "3-5 essential domain terms introduced in this section with plain-language definitions.",
    },
    conceptMindMap: {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { id: { type: Type.STRING }, label: { type: Type.STRING } },
            required: ["id", "label"],
          },
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { from: { type: Type.STRING }, to: { type: Type.STRING }, label: { type: Type.STRING } },
            required: ["from", "to", "label"],
          },
        },
      },
      required: ["nodes", "edges"],
      description: "Mind map showing the causal or hierarchical flow between concepts in this specific section.",
    },
    checkpointQuiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.INTEGER },
          hint: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ["question", "options", "answer", "hint", "explanation"],
      },
      description: "2-3 active-recall review questions testing understanding of this section.",
    },
  },
  required: ["sectionTitle", "originalSummary", "unjargonedText", "readingGrade", "keyConcepts", "conceptMindMap", "checkpointQuiz"],
};

const fullDocumentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    docTitle: { type: Type.STRING, description: "Overall document or textbook chapter title" },
    authorOrSource: { type: Type.STRING, description: "Author, course, or subject area if detectable" },
    targetLevel: { type: Type.STRING, description: "Reading level used for the transformation" },
    executiveSummary: { type: Type.STRING, description: "A high-level plain-language summary of the entire document" },
    totalSections: { type: Type.INTEGER, description: "Count of sections processed" },
    sections: {
      type: Type.ARRAY,
      items: sectionSchema,
      description: "Chronological sections covering the ENTIRE document from start to finish.",
    },
    overallMindMap: {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { id: { type: Type.STRING }, label: { type: Type.STRING } },
            required: ["id", "label"],
          },
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { from: { type: Type.STRING }, to: { type: Type.STRING }, label: { type: Type.STRING } },
            required: ["from", "to", "label"],
          },
        },
      },
      required: ["nodes", "edges"],
      description: "High-level mind map connecting all major sections across the entire document.",
    },
  },
  required: ["docTitle", "targetLevel", "executiveSummary", "totalSections", "sections", "overallMindMap"],
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      pdfBase64?: string;
      fileName?: string;
      targetLevel?: "grade6" | "grade10" | "expert";
    };

    if (!body.pdfBase64) {
      return NextResponse.json({ error: "Please upload a PDF document." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_API_KEY is not configured." }, { status: 500 });
    }

    const targetLevel = body.targetLevel || "grade10";
    const levelInstructions =
      targetLevel === "grade6"
        ? "Target Grade 6 readability: straightforward sentence structures, crystal-clear analogies, zero unexplained jargon, highly accessible."
        : targetLevel === "expert"
        ? "Target Expert level: preserve academic rigor, formal precision, and exact scientific designations with enhanced structural clarity."
        : "Target Grade 10 readability: high-school accessible, intuitive flow, clean prose, technical terms defined in context.";

    const systemPrompt = `You are an elite academic textbook transformer specializing in full-document accessible conversion.
You take a complete PDF document and transform the ENTIRE document (not just an excerpt) into an organized, comprehensive Unjargoned Edition.

CRITICAL RULES:
1. PROCESS THE ENTIRE DOCUMENT: Break it down sequentially into logically organized sections (e.g. 2 to 6 sections depending on length).
2. DO NOT TRUNCATE: Translate the entire explanatory flow into the target reading level: ${levelInstructions}.
3. EMBED DIAGRAMS & MIND MAPS AT REQUIRED SITES:
   - For every section that involves physical, logical, or biological steps, include a "diagramWalkthrough" explaining how the visual diagram works.
   - For every section, generate a "conceptMindMap" with nodes and connecting labeled edges.
4. QUESTION BANK & HINTS:
   - For each section, provide checkpoint quiz questions with hints and explanations.
5. GLOSSARY:
   - Include key concepts with friendly plain-language definitions and emojis for each section.
6. Provide an overall high-level mind map connecting the sections.`;

    const parts: Part[] = [
      {
        inlineData: {
          data: body.pdfBase64,
          mimeType: "application/pdf",
        },
      },
      {
        text: `Transform this entire PDF into a complete Unjargoned Book/Document with full sections, inline mind maps, diagrams walkthroughs, and active-recall checkpoints. Target reading level: ${targetLevel}. File name: ${body.fileName || "document.pdf"}.`,
      },
    ];

    const parsed = await generateJSON<UnjargonedDocumentResult>(
      parts,
      fullDocumentSchema,
      systemPrompt,
      (val) => {
        const obj = val as Record<string, unknown>;
        if (typeof obj?.docTitle !== "string" || !Array.isArray(obj?.sections)) {
          throw new Error("Invalid document structure returned from model");
        }
      }
    );

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF document transformation failed." },
      { status: 500 }
    );
  }
}
