"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown, Sparkles, BookOpen, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export default function NavbarAuthSlot() {
  const { user, profile, isLoading, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // 1. Loading State: Subtle pulsing skeleton placeholder
  if (isLoading) {
    return (
      <div
        className="h-9 w-24 rounded-full bg-white/10 animate-pulse border border-white/10"
        aria-label="Loading authentication status"
      />
    );
  }

  // 2. Logged-Out State: Only "Sign In" button, profile trigger completely hidden
  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        className="text-white/80 hover:text-white text-sm font-medium px-5 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-sm shadow-sm"
      >
        Sign In
      </Link>
    );
  }

  const initials = getInitials(user.full_name, user.email);

  // 3. Logged-In State: User Avatar + Chevron with accessible Dropdown Menu
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile menu"
        className="flex items-center gap-2 rounded-full p-1.5 pr-3 text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all backdrop-blur-sm cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
      >
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.full_name || "User Avatar"}
            className="w-7 h-7 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            {initials}
          </div>
        )}
        <span className="text-xs font-medium max-w-[120px] truncate hidden sm:inline-block">
          {user.full_name || "Profile"}
        </span>
        <ChevronDown
          size={14}
          className={`text-white/60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Accessible Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Details Header (Non-clickable) */}
          <div className="px-3.5 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white truncate">
              {user.full_name || "Student"}
            </p>
            <p className="text-xs text-white/50 truncate mt-0.5">
              {user.email || "demo@unjargon.edu"}
            </p>
            {profile?.grade && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                  Grade {profile.grade}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-medium">
                  {profile.preferred_level.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <User size={15} className="text-indigo-400" />
              <span>My Profile</span>
            </Link>

            <Link
              href="/workspace"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Sparkles size={15} className="text-emerald-400" />
              <span>Concept Studio</span>
            </Link>

            <Link
              href="/document"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <FileText size={15} className="text-purple-400" />
              <span>PDF Transformer</span>
            </Link>
          </div>

          {/* Log Out */}
          <div className="pt-1 border-t border-white/10">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer text-left"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
