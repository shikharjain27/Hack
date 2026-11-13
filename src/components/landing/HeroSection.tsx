"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Sparkles, Layers, Wand2 } from "lucide-react";

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

function DiscordIcon({ size = 20 }: { size?: number }) {
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
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <path d="M7.5 7.5c3.5-1 5.5-1 9 0" />
      <path d="M7 16.5c3.5 1 6.5 1 10 0" />
      <path d="M15.5 17c0 1 1.5 3 2 3 1.5 0 2.833-1.667 3.5-3 .5-3.5-.5-9.5-2-11-2-1-3.5-1-3.5-1l-.5 1" />
      <path d="M8.5 17c0 1-1.5 3-2 3-1.5 0-2.833-1.667-3.5-3-.5-3.5.5-9.5 2-11 2-1 3.5-1 3.5-1l.5 1" />
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
      video.play().catch(() => {});
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
        videoRef.current.play().catch(() => {});
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

      {/* Navbar */}
      <header className="relative z-20 px-6 py-6">
        <nav className="liquid-glass rounded-full max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left brand & links */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-white font-semibold text-lg">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-black font-black text-sm">
                U
              </span>
              <span>Unjargon</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 ml-8">
              <a href="#about" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                Methodology
              </a>
              <a href="#services" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                Capabilities
              </a>
              <a href="#philosophy" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                Accessibility
              </a>
              <Link
                href="/workspace"
                className="text-white/80 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
              >
                Concept Studio
              </Link>
              <Link
                href="/document"
                className="text-indigo-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Sparkles size={13} />
                PDF Book Transformer
              </Link>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/login?mode=signup"
              className="text-white text-sm font-medium hover:text-white/80 transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Login
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center md:-translate-y-[15%]">
        {/* Project Tagline Pill */}
        <div className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/80 mb-6 flex items-center gap-2 border border-white/10 shadow-lg">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI Accessible Learning Assistant · Live Readability Scaffolding
        </div>

        {/* Heading */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl text-white tracking-tight whitespace-nowrap font-serif-instrument mb-6">
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
          <a
            href="#about"
            className="liquid-glass rounded-full px-7 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
          >
            How it Works
          </a>
          <Link
            href="/workspace"
            className="rounded-full px-8 py-3 bg-white text-black font-semibold text-sm hover:bg-white/90 transition-transform hover:scale-105 flex items-center gap-2 shadow-xl"
          >
            <Wand2 size={16} />
            Launch Assistant
          </Link>
        </div>
      </div>

      {/* Social / Community Icons Footer */}
      <footer className="relative z-10 flex justify-center gap-4 pb-12">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub Repository"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
        >
          <GithubIcon size={20} />
        </a>
        <a
          href="https://discord.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Community Discord"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
        >
          <DiscordIcon size={20} />
        </a>
        <Link
          href="/workspace"
          aria-label="Open Workspace"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all"
        >
          <BookOpen size={20} />
        </Link>
      </footer>
    </div>
  );
}
