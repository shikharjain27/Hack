"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="about"
      className="bg-black pt-32 md:pt-44 pb-16 md:pb-24 px-6 overflow-hidden relative"
    >
      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-white/40 text-sm tracking-widest uppercase mb-6 font-semibold"
        >
          Learning Equity &amp; Cognitive Accessibility
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl text-white leading-[1.1] tracking-tight mb-8"
        >
          Pioneering accessible <span className="font-serif-instrument italic text-white/60">knowledge</span> for{" "}
          <br className="hidden md:block" />
          <span className="font-serif-instrument italic text-white/60">
            neurodivergent minds that read, build, and inspire.
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10"
        >
          <div className="p-4 rounded-2xl liquid-glass">
            <h3 className="text-white font-medium text-base mb-2">Adaptive Scaffolding</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Deconstructs complex university-level passages into Grade 10 and Grade 6 reading levels without stripping core scientific facts, quantities, or key concepts.
            </p>
          </div>
          <div className="p-4 rounded-2xl liquid-glass">
            <h3 className="text-white font-medium text-base mb-2">Audited Faithfulness</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Every rewritten sentence is cross-checked against source sentences with real-time faithfulness badges to guarantee zero hallucination and strict fact preservation.
            </p>
          </div>
          <div className="p-4 rounded-2xl liquid-glass">
            <h3 className="text-white font-medium text-base mb-2">Multimodal Comprehension</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Combines dyslexia-optimized typography (Lexend), synchronized karaoke audio narration, and interactive force-directed concept graphs.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
