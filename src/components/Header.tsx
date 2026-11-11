"use client";

import React, { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Trophy, LogOut, User as UserIcon, Zap, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import SiteNav from "@/components/SiteNav";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [elo, setElo] = useState(1200);
  const [xp, setXp] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from("profiles").select("contest_elo, practice_xp").eq("id", userId).single();
    if (data) {
      setElo(data.contest_elo);
      setXp(data.practice_xp);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) alert(error.message);
    else alert("Magic link sent!");
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-premium-border bg-premium-beige/80 backdrop-blur-md dark:border-premium-borderDark dark:bg-premium-gray/80">
      <div className="mx-auto max-w-6xl px-4">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-premium-accent/40 font-bold text-premium-accent">GK</div>
          <span className="hidden text-lg font-extrabold tracking-tight text-premium-accent sm:block">Arena</span>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 rounded-lg border border-premium-border bg-white px-3 py-1.5 sm:flex dark:border-premium-borderDark dark:bg-zinc-900">
              <div className="flex items-center gap-1.5 text-sm font-bold text-premium-accent">
                <Trophy className="w-4 h-4" /> {elo}
              </div>
              <div className="h-4 w-px bg-premium-border dark:bg-premium-borderDark"></div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-premium-charcoal dark:text-zinc-200">
                <Zap className="w-4 h-4" /> {xp} XP
              </div>
            </div>
            <button onClick={handleLogout} className="rounded-lg p-2 text-premium-charcoal transition hover:text-premium-accent dark:text-zinc-200" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="rounded-lg border border-premium-border p-2 text-premium-charcoal transition hover:border-premium-accent dark:border-premium-borderDark dark:text-zinc-200"
              aria-label="Toggle color theme"
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={handleGoogleLogin} className="flex items-center gap-2 rounded-lg border border-premium-border bg-white px-4 py-1.5 text-sm font-bold text-premium-charcoal transition hover:border-premium-accent dark:border-premium-borderDark dark:bg-zinc-900 dark:text-zinc-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <div className="hidden h-6 w-px bg-premium-border sm:block dark:bg-premium-borderDark"></div>
            <form onSubmit={handleMagicLink} className="hidden items-center gap-2 sm:flex">
              <input type="email" placeholder="Or use email..." value={email} onChange={(e) => setEmail(e.target.value)} required className="w-40 rounded-lg border border-premium-border bg-white px-3 py-1.5 text-sm text-premium-charcoal placeholder:text-zinc-400 focus:border-premium-accent focus:outline-none dark:border-premium-borderDark dark:bg-zinc-900 dark:text-zinc-100" />
              <button type="submit" disabled={loading} className="rounded-lg border border-premium-accent px-3 py-1.5 text-sm font-semibold text-premium-accent transition hover:bg-premium-accent hover:text-premium-charcoal disabled:opacity-50">
                {loading ? "..." : <UserIcon className="w-4 h-4" />}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="rounded-lg border border-premium-border p-2 text-premium-charcoal transition hover:border-premium-accent dark:border-premium-borderDark dark:text-zinc-200"
              aria-label="Toggle color theme"
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
      <Suspense fallback={<div className="h-10" />}>
        <SiteNav />
      </Suspense>
      </div>
    </header>
  );
}