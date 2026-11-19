import React from "react";

/**
 * Formats chemical formulas, subscripts, superscripts, and math notation
 * into clean, beautifully styled React typography.
 */
export function formatMathAndFormulas(rawText: string): React.ReactNode {
  if (!rawText) return "";

  // Common chemical / scientific substitutions to Unicode subscript/superscript
  const cleanString = rawText
    .replace(/\bCO_?2\b/g, "CO₂")
    .replace(/\bNAD\s*\+\b/g, "NAD⁺")
    .replace(/\bNAD\^\+/g, "NAD⁺")
    .replace(/\bNADH\b/g, "NADH")
    .replace(/\bH\^\+/g, "H⁺")
    .replace(/\bATP\b/g, "ATP")
    .replace(/\bO_?2\b/g, "O₂")
    .replace(/\bH_?2O\b/g, "H₂O");

  // Check if text has LaTeX-like inline math delimiters $...$
  if (!cleanString.includes("$")) {
    return cleanString;
  }

  const parts = cleanString.split(/(\$[^$]+\$)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const math = part.slice(1, -1);
      // Basic formatting for inline math
      const formatted = math
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
        .replace(/\\cdot/g, " · ")
        .replace(/\\times/g, " × ")
        .replace(/_\{([^}]+)\}/g, "_{$1}")
        .replace(/\^\{([^}]+)\}/g, "^{$1}");

      return (
        <span
          key={idx}
          className="inline-block font-serif italic text-indigo-300 px-1 font-medium select-text tracking-wide"
        >
          {formatted}
        </span>
      );
    }
    return part;
  });
}
