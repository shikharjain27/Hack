"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Wand2, FileText } from "lucide-react";
import NavbarAuthSlot from "@/components/NavbarAuthSlot";

function GithubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fadeRafRef = useRef<number | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Vanilla JS RAF fade helper
  const animateOpacity = (
    from: number,
    to: number,
    durationMs: number,
    onComplete?: () => void,
  ) => {
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const val = from + (to - from) * progress;
      if (videoRef.current) {
        videoRef.current.style.opacity = String(val);
      }
      if (progress < 1) {
        fadeRafRef.current = requestAnimationFrame(step);
      } else {
        fadeRafRef.current = null;
        if (onComplete) onComplete();
      }
    };
    fadeRafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let fadingOut = false;

    const handleCanPlay = () => {
      video.play().catch(() => { });
      const currentOpacity = parseFloat(video.style.opacity || "0");
      animateOpacity(currentOpacity, 1, 500);
    };

    const handleTimeUpdate = () => {
      if (!video.duration || fadingOut) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= 0.55 && remaining > 0) {
        fadingOut = true;
        const currentOpacity = parseFloat(video.style.opacity || "1");
        animateOpacity(currentOpacity, 0, 500);
      }
    };

    const handleEnded = () => {
      fadingOut = false;
      if (videoRef.current) {
        videoRef.current.style.opacity = "0";
      }
      setTimeout(() => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => { });
        animateOpacity(0, 1, 500);
      }, 100);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative flex flex-col bg-black">
      {/* Background Video */}
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4"
        muted
        autoPlay
        playsInline
        preload="auto"
        style={{ opacity: 0.85 }}
        className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none transition-opacity duration-700"
      />

      {/* Ambient background glow & radial gradient fallback */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Top Header (No panel container) */}
      <header className="relative z-20 w-full px-6 md:px-12 py-6 md:py-8 flex items-center justify-between">
        {/* Top Left: Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white font-semibold text-lg md:text-xl hover:opacity-85 transition-opacity"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black font-black text-sm shadow-md">
            U
          </span>
          <span className="tracking-tight">Unjargon</span>
        </Link>

        {/* Top Right: Dynamic Auth Slot */}
        <NavbarAuthSlot />
      </header>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center md:-translate-y-[15%]">
        {/* Project Tagline Pill */}
        <div className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/80 mb-6 flex items-center gap-2 border border-white/10 shadow-lg">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI Accessible Learning Assistant · Live Readability Scaffolding
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-tight font-serif-instrument mb-6 max-w-5xl leading-[1.05]">
          Unjargon then <em className="italic">everything</em>.
        </h1>

        {/* Subtitle with Project Context */}
        <p className="text-white/90 text-sm md:text-base leading-relaxed px-4 max-w-2xl mb-8">
          Dense textbooks shouldn&apos;t gatekeep student potential. Turn opaque academic passages and research papers into
          accessible reading levels (Expert &rarr; Grade 10 &rarr; Grade 6) with live word diffs, readability gauges,
          karaoke audio narration, and interactive concept graphs.
        </p>

        {/* Email input */}
        <form onSubmit={handleSubscribe} className="max-w-xl w-full">
          <div className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your student or school email…"
              required
              className="bg-transparent text-white placeholder:text-white/40 flex-1 outline-none text-sm md:text-base"
            />
            <button
              type="submit"
              aria-label="Get student early access"
              className="bg-white rounded-full p-3 text-black hover:bg-white/90 transition-transform hover:scale-105 cursor-pointer shrink-0"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </form>

        {submitted && (
          <p className="text-emerald-400 text-xs mt-2">✓ Early access request received! Welcome to Unjargon.</p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Link
            href="/workspace"
            className="rounded-full px-8 py-3 bg-white text-black font-semibold text-sm hover:bg-white/90 transition-transform hover:scale-105 flex items-center gap-2 shadow-xl"
          >
            <Wand2 size={16} />
            Launch Studio
          </Link>
          <Link
            href="/document"
            className="liquid-glass rounded-full px-7 py-3 text-white text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/10"
          >
            <FileText size={16} />
            PDF Transformer
          </Link>
        </div>
      </div>

      {/* Social / GitHub Link Footer */}
      <footer className="relative z-10 flex justify-center pb-12">
        <a
          href="https://github.com/shikharjain27/Hack/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub Repository"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/10 transition-all border border-white/10"
        >
          <GithubIcon size={20} />
        </a>
      </footer>
    </div>
  );
}
