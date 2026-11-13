"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function PhilosophySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="philosophy" className="bg-black py-28 md:py-40 px-6 overflow-hidden">
      <div ref={ref} className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl text-white tracking-tight mb-16 md:mb-24"
        >
          Comprehension{" "}
          <span className="font-serif-instrument italic text-white/40">x</span>{" "}
          Accessibility
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Column: Video */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-3xl overflow-hidden aspect-[4/3] relative bg-zinc-900 border border-white/10"
          >
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Right Column: Two Text Blocks */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <div>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-4 font-semibold">
                Scaffolding Without Simplism
              </p>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                Traditional education expects every student to grasp university-grade prose immediately. 
                Unjargon meets students where they are—whether that is a Grade 6 reading level or Grade 10 clarity—providing 
                gradual stepping stones until they can master the original academic material with ease.
              </p>
            </div>

            <div className="w-full h-px bg-white/10 my-8" />

            <div>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-4 font-semibold">
                Designing for Neurodiversity
              </p>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                Dyslexia, ADHD, and visual processing differences are superpowers when met with the right tools. 
                With instantaneous Flesch-Kincaid gauges, synchronized word tracking, and dynamic node-link knowledge graphs, 
                every student has multiple modalities to engage and excel.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
