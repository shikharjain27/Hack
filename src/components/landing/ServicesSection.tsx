"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const CAPABILITIES = [
  {
    video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4",
    tag: "Concept Studio",
    title: "Interactive Passage Studio",
    description: "Slide seamlessly between Expert, Grade 10, and Grade 6 prose. Color-coded word morphs reveal exact syntactic changes, while automated faithfulness badges certify that not a single number, chemical ratio, or fact was lost.",
    href: "/workspace",
    cta: "Open Studio",
  },
  {
    video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4",
    tag: "Document Transformer",
    title: "PDF Book & Document Simplifier",
    description: "Upload multi-page textbooks and academic PDFs to generate section-by-section simplified chapters, concept flashcards, comprehension quizzes, and downloadable PDF exports.",
    href: "/document",
    cta: "Open PDF Transformer",
  },
];

export default function ServicesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" className="bg-black py-28 md:py-40 px-6 overflow-hidden relative">
      {/* Subtle radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_60%)] pointer-events-none" />

      <div ref={ref} className="max-w-6xl mx-auto relative z-10">
        {/* Header row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex items-baseline justify-between mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl text-white tracking-tight">What Unjargon Does</h2>
          <span className="text-white/40 text-sm hidden md:block uppercase tracking-widest font-semibold">
            Core Capabilities
          </span>
        </motion.div>

        {/* Two-card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {CAPABILITIES.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className="liquid-glass rounded-3xl overflow-hidden group flex flex-col border border-white/10"
            >
              {/* Card video area */}
              <div className="aspect-video overflow-hidden relative">
                <video
                  src={card.video}
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              </div>

              {/* Card body */}
              <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="uppercase tracking-widest text-indigo-300 text-xs font-semibold">
                      {card.tag}
                    </span>
                    <Link
                      href={card.href}
                      className="liquid-glass rounded-full px-3.5 py-1 text-xs text-white flex items-center gap-1.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 hover:bg-white/10"
                    >
                      <span>{card.cta}</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                  <h3 className="text-white text-xl md:text-2xl mb-3 tracking-tight font-medium">
                    {card.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">{card.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
