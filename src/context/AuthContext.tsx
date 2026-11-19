"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { StudentProfile } from "@/lib/types";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: StudentProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<StudentProfile>) => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.isAuthenticated && data.user) {
          setUser(data.user);
          setProfile(data.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();

    // If Supabase is available, listen to real-time auth changes
    const supabase = createClient();
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        refreshAuth();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [refreshAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const updateUser = useCallback((updates: Partial<StudentProfile>) => {
    setProfile((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        full_name: updates.full_name !== undefined ? updates.full_name : prev.full_name,
        email: updates.email !== undefined ? updates.email : prev.email,
      };
    });
  }, []);

  const value = {
    user,
    profile,
    isLoading,
    isAuthenticated: Boolean(user),
    isOnboarded: Boolean(profile?.onboarding_completed),
    logout,
    updateUser,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
