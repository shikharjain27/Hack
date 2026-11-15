"use client";

import * as React from "react";
import type { Metrics } from "@/lib/types";
import { Gauge as GaugeIcon, BookOpen, BrainCircuit, Sparkles } from "lucide-react";

interface SemicircleGaugeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  expertValue: number;
  color: string;
  description: string;
  targetText: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SemicircleGauge({
  label,
  value,
  min,
  max,
  unit = "",
  expertValue,
  color,
  description,
  targetText,
  icon: Icon,
}: SemicircleGaugeProps) {
  const clampedVal = Math.min(Math.max(value, min), max);
  const ratio = (clampedVal - min) / (max - min);
  const angle = -90 + ratio * 180;

  const expertRatio = Math.min(Math.max(expertValue, min), max);
  const expertAngle = -90 + ((expertRatio - min) / (max - min)) * 180;

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded-md bg-slate-100 text-slate-500 shrink-0">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 leading-tight">
            {label}
          </span>
        </div>
        <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded shrink-0">
          Target: {targetText}
        </span>
      </div>

      {/* SVG Semicircle with Needle strictly inside the upper arc */}
      <div className="relative w-full h-24 my-1 flex items-center justify-center">
        <svg viewBox="0 0 120 70" className="w-40 h-full overflow-visible">
          {/* Background track */}
          <path
            d="M 15 62 A 45 45 0 0 1 105 62"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Colored active arc */}
          <path
            d="M 15 62 A 45 45 0 0 1 105 62"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="141"
            strokeDashoffset={141 - 141 * ratio}
            className="transition-all duration-700 ease-out"
          />

          {/* Expert Baseline Ghost Tick */}
          <g
            transform={`rotate(${expertAngle} 60 62)`}
            className="transition-transform duration-500"
          >
            <line
              x1="60"
              y1="12"
              x2="60"
              y2="20"
              stroke="#94a3b8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          {/* Needle Indicator */}
          <g
            transform={`rotate(${angle} 60 62)`}
            className="transition-transform duration-700 ease-out"
          >
            <line
              x1="60"
              y1="62"
              x2="60"
              y2="24"
              stroke="#0f172a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="60" cy="62" r="5" fill="#0f172a" />
            <circle cx="60" cy="62" r="2.5" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Prominent numeric display below the needle pivot */}
      <div className="text-center mt-1">
        <div className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
          {value}
          {unit && <span className="text-sm font-medium text-slate-500 ml-0.5">{unit}</span>}
        </div>
      </div>

      {/* Footer info */}
      <div className="w-full flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
        <span className="font-medium text-slate-700">{description}</span>
        <span className="font-mono text-slate-400" title="Expert baseline">
          Exp: {expertValue}{unit}
        </span>
      </div>
    </div>
  );
}

export default function Gauges({ current, expert }: { current: Metrics; expert: Metrics }) {
  const gradeReduction = Math.max(
    0,
    Math.round((expert.fkGrade - current.fkGrade) * 10) / 10
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GaugeIcon className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Readability & Complexity Gauges
          </h3>
        </div>
        {gradeReduction > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="h-3 w-3" />
            Complexity lowered by {gradeReduction} grades
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SemicircleGauge
          label="Flesch-Kincaid Grade"
          value={current.fkGrade}
          min={1}
          max={18}
          targetText="Gr 6-10"
          expertValue={expert.fkGrade}
          color="#6366f1"
          description={current.fkGrade <= 6 ? "Elementary" : current.fkGrade <= 10 ? "High School" : "Collegiate"}
          icon={BookOpen}
        />
        <SemicircleGauge
          label="Avg Sentence Length"
          value={current.avgSentenceLen}
          min={5}
          max={45}
          unit=" w"
          targetText="10-18w"
          expertValue={expert.avgSentenceLen}
          color="#06b6d4"
          description={current.avgSentenceLen <= 14 ? "Bite-sized" : "Compound"}
          icon={BrainCircuit}
        />
        <SemicircleGauge
          label="Jargon Density"
          value={current.jargonDensity}
          min={0}
          max={60}
          unit="%"
          targetText="<15%"
          expertValue={expert.jargonDensity}
          color={current.jargonDensity <= 10 ? "#10b981" : "#f59e0b"}
          description={current.jargonDensity <= 10 ? "Accessible words" : "Heavy terminology"}
          icon={GaugeIcon}
        />
      </div>
    </div>
  );
}
