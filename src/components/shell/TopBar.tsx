"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase/client";
import { displayName, initials, useAcademy } from "@/components/shell/AcademyContext";
import { SHELL_LINKS } from "@/components/shell/nav";

export default function TopBar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const { user, profile } = useAcademy();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const name = displayName(profile, user?.email);
  const mark = initials(name);
  const results = query.trim()
    ? SHELL_LINKS.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !email) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setNotice(error ? error.message : "Magic link sent.");
    setSending(false);
  };

  const google = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  return (
    <header className="relative flex items-center gap-3 border-b border-premium-border bg-premium-beige/90 px-4 py-3 backdrop-blur dark:border-premium-borderDark dark:bg-premium-gray/90 sm:px-6">
      <button type="button" onClick={onMenu} aria-label="Open navigation" className="rounded-lg p-2 text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800">
        <Menu className="h-4 w-4" />
      </button>

      <div className="relative min-w-0 flex-1">
        <label className="flex items-center gap-2 rounded-full border border-premium-border bg-white px-3 py-2 text-sm dark:border-premium-borderDark dark:bg-zinc-900">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search academy"
            className="min-w-0 flex-1 bg-transparent text-premium-charcoal outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
          <kbd className="hidden rounded-md border border-premium-border px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline dark:border-premium-borderDark">⌘K</kbd>
        </label>
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-premium-border bg-white shadow-sm dark:border-premium-borderDark dark:bg-zinc-900">
            {results.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  setQuery("");
                  router.push(item.href);
                }}
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-premium-beige dark:hover:bg-zinc-800"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Toggle color theme"
        className="rounded-lg p-2 text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="relative">
        <button type="button" aria-label="Notices" onClick={() => setBellOpen((open) => !open)} className="rounded-lg p-2 text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800">
          <Bell className="h-4 w-4" />
        </button>
        {bellOpen && (
          <p className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-premium-border bg-white px-3 py-2 text-xs text-zinc-500 dark:border-premium-borderDark dark:bg-zinc-900 dark:text-zinc-400">
            No new notices.
          </p>
        )}
      </div>

      {user ? (
        <div className="hidden items-center gap-3 border-l border-premium-border pl-3 sm:flex dark:border-premium-borderDark">
          <span className="text-right leading-tight">
            <span className="block text-xs font-semibold">{profile?.elo ?? "Cadet"}</span>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Cadet</span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-premium-border bg-white text-xs font-semibold dark:border-premium-borderDark dark:bg-zinc-900">{mark}</span>
        </div>
      ) : (
        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" onClick={() => void google()} className="rounded-full border border-premium-border bg-white px-3 py-1.5 text-xs font-semibold dark:border-premium-borderDark dark:bg-zinc-900">
            Google
          </button>
          <form onSubmit={(event) => void sendMagicLink(event)} className="flex items-center gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-36 rounded-full border border-premium-border bg-white px-3 py-1.5 text-xs outline-none dark:border-premium-borderDark dark:bg-zinc-900"
            />
            <button type="submit" disabled={sending} className="rounded-full bg-premium-charcoal px-3 py-1.5 text-xs font-semibold text-premium-beige disabled:opacity-50 dark:bg-zinc-100 dark:text-premium-charcoal">
              {sending ? "..." : "Link"}
            </button>
          </form>
        </div>
      )}
      {!user && (
        <button type="button" onClick={() => void google()} className="rounded-full border border-premium-border bg-white px-3 py-1.5 text-xs font-semibold lg:hidden dark:border-premium-borderDark dark:bg-zinc-900">
          Sign in
        </button>
      )}
      {notice && <p className="absolute right-4 top-16 z-30 rounded-xl border border-premium-border bg-white px-3 py-2 text-xs dark:border-premium-borderDark dark:bg-zinc-900">{notice}</p>}
    </header>
  );
}
