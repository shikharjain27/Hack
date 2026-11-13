"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Wand2 } from "lucide-react";

export default function FeaturedVideoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-black pt-6 md:pt-10 pb-20 md:pb-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9 }}
          className="rounded-3xl overflow-hidden aspect-video relative group border border-white/10 shadow-2xl"
        >
          <video
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4"
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Bottom overlay content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
            {/* Left liquid glass card */}
            <div className="liquid-glass rounded-2xl p-6 md:p-8 max-w-lg">
              <p className="text-white/50 text-xs tracking-widest uppercase mb-3 font-semibold">
                Our Pedagogical Methodology
              </p>
              <p className="text-white text-sm md:text-base leading-relaxed">
                We believe in curiosity-driven learning without barrier. Unjargon extracts core conceptual propositions, 
                re-engineers syntactic complexity according to Flesch-Kincaid benchmarks, and highlights exact word substitutions 
                so students understand the bridge between casual speech and academic rigor.
              </p>
            </div>

            {/* Right button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/workspace"
                className="liquid-glass rounded-full px-8 py-3.5 text-white text-sm font-semibold hover:bg-white/10 transition-colors self-start md:self-auto cursor-pointer inline-flex items-center gap-2"
              >
                <Wand2 size={16} />
                Try Interactive Demo
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
