"use client";

import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import PhilosophySection from "./PhilosophySection";
import ServicesSection from "./ServicesSection";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="bg-black text-white min-h-screen selection:bg-white/20 selection:text-white">
      {/* Section 1: Hero with streamlined navbar (Logo on left, Sign In & User Profile on right) */}
      <HeroSection />

      {/* Section 2: About & Methodology */}
      <AboutSection />

      {/* Section 3: Philosophy / Comprehension x Accessibility */}
      <PhilosophySection />

      {/* Section 4: Core Capabilities (Concept Studio & PDF Document Transformer) */}
      <ServicesSection />

      {/* Site Footer */}
      <footer className="border-t border-white/10 py-16 px-6 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black font-black text-sm">
              U
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">Unjargon</span>
            <span className="text-white/40 text-xs">· AI Accessible Learning Assistant</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/60">
            <Link
              href="/workspace"
              className="hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              Concept Studio <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/document"
              className="hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              PDF Transformer <ArrowUpRight size={14} />
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/profile" className="hover:text-white transition-colors">
              User Profile
            </Link>
          </div>

          <p className="text-white/30 text-xs">
            © 2026 Unjargon. Designed for learning equity and neurodiversity.
          </p>
        </div>
      </footer>
    </main>
  );
}
