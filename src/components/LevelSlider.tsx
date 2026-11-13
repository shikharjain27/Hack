"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, School } from "lucide-react";

export const LEVELS = ["expert", "grade10", "grade6"] as const;
export type LevelKey = (typeof LEVELS)[number];
export const LEVEL_LABELS: Record<LevelKey, string> = {
  expert: "Expert",
  grade10: "Grade 10",
  grade6: "Grade 6",
};

interface LevelSliderProps {
  level: LevelKey;
  onChange: (level: LevelKey) => void;
  className?: string;
  disabled?: boolean;
}

const LEVEL_ITEMS: Array<{
  value: LevelKey;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    value: "expert",
    label: "Expert",
    badge: "Original",
    icon: GraduationCap,
    description: "Academic & Technical",
  },
  {
    value: "grade10",
    label: "Grade 10",
    badge: "Standard",
    icon: BookOpen,
    description: "High School Clarity",
  },
  {
    value: "grade6",
    label: "Grade 6",
    badge: "Simplified",
    icon: School,
    description: "Everyday Plain Language",
  },
];

/**
 * 21st.dev WAI-ARIA Segmented Slider adapted for Unjargon
 * - 3-Stop Discrete Selector (Expert -> Grade 10 -> Grade 6)
 * - Full WAI-ARIA role="radiogroup" with arrow keys, Home & End navigation
 * - Spring layoutId indicator with reduced-motion support
 */
export default function LevelSlider({
  level,
  onChange,
  className,
  disabled = false,
}: LevelSliderProps) {
  const pillId = React.useId();
  const reduceMotion = useReducedMotion();
  const buttonsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const currentIndex = LEVELS.indexOf(level);

  function selectByIndex(index: number) {
    const clampedIndex = (index + LEVELS.length) % LEVELS.length;
    const targetLevel = LEVELS[clampedIndex];
    if (targetLevel && !disabled) {
      onChange(targetLevel);
      buttonsRef.current[clampedIndex]?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (disabled) return;
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: LEVELS.length - 1,
    };

    if (event.key in moves) {
      event.preventDefault();
      selectByIndex(moves[event.key]);
    }
  }

  return (
    <div className={cn("flex flex-col space-y-2 card p-3", className)}>
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          Reading Level Selector
        </span>
        <span className="text-slate-400">
          Step {currentIndex + 1} of 3 • {LEVEL_LABELS[level]}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Reading Level Selector"
        className={cn(
          "relative grid grid-cols-3 gap-1 rounded-2xl border border-slate-200/90 bg-slate-100/80 p-1.5 shadow-inner transition-colors",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        {LEVEL_ITEMS.map((item, index) => {
          const isSelected = item.value === level;
          const Icon = item.icon;

          return (
            <button
              key={item.value}
              ref={(node) => {
                buttonsRef.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "group relative flex flex-col items-center justify-center py-2.5 px-2 sm:px-3 rounded-xl text-center text-xs font-medium transition-all duration-200 select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
                isSelected
                  ? "text-slate-900 font-semibold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId={`reading-pill-${pillId}`}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 450, damping: 32 }
                  }
                  className="absolute inset-0 rounded-xl bg-white border border-slate-200/60 shadow-sm"
                />
              )}

              <div className="relative z-10 flex items-center gap-1.5 mb-0.5">
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    isSelected ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span className="font-semibold text-xs tracking-tight">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-colors hidden sm:inline-block",
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      : "bg-slate-200/60 text-slate-500"
                  )}
                >
                  {item.badge}
                </span>
              </div>

              <span
                className={cn(
                  "relative z-10 text-[10px] leading-tight transition-colors line-clamp-1",
                  isSelected ? "text-slate-600" : "text-slate-400"
                )}
              >
                {item.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
