"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Crosshair, Play, Target } from "lucide-react";
import DailyBoard from "@/features/daily-challenge/DailyBoard";
import { fetchMistakes } from "@/lib/supabase/queries";
import { displayName, useAcademy } from "@/components/shell/AcademyContext";

type DueItem = { id: string; title: string };

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
}

function greeting(date: Date | null) {
  if (!date) return "Good day";
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function OverviewDashboard() {
  const { user, profile } = useAcademy();
  const [now, setNow] = useState<Date | null>(null);
  const [practicing, setPracticing] = useState(false);
  const [due, setDue] = useState<DueItem[]>([]);
  const name = displayName(profile, user?.email).split(/[\s._-]+/)[0] || "Officer";

  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    if (!user) {
      setDue([]);
      return;
    }
    void fetchMistakes().then((rows) => {
      setDue(rows.slice(0, 3).map((row) => ({ id: row.id, title: row.payload.question })));
    });
  }, [user]);

  if (practicing) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
        <button type="button" onClick={() => setPracticing(false)} className="mb-4 text-sm text-zinc-500 hover:text-premium-charcoal dark:hover:text-zinc-100">
          ← Overview
        </button>
        <DailyBoard />
      </div>
    );
  }

  const elo = profile?.elo ?? 0;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{now ? formatDate(now) : "Today"}</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-premium-charcoal sm:text-5xl dark:text-zinc-100">
            {greeting(now)}, {name}.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">Small, deliberate actions. Your next recommendation is ready.</p>
        </div>
        <button
          type="button"
          onClick={() => setPracticing(true)}
          className="inline-flex items-center gap-2 self-start rounded-full bg-premium-charcoal px-4 py-2.5 text-sm font-medium text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal"
        >
          Resume session
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-premium-border bg-white p-6 dark:border-premium-borderDark dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Arena standing</p>
              <p className="mt-3 font-serif text-5xl tracking-tight">{user ? elo.toLocaleString("en-US") : "—"}</p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{user ? "Contest rating" : "Sign in to track your rating"}</p>
              <Link href="/ranks" className="mt-6 inline-flex items-center gap-1 text-sm font-medium">
                View leaderboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full">
                <circle cx="40" cy="40" r="30" fill="none" className="stroke-premium-border dark:stroke-premium-borderDark" strokeWidth="5" />
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  fill="none"
                  className="stroke-premium-accent"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(188, Math.max(18, streak * 12))} 188`}
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-2xl">{user ? streak : "—"}</span>
                <span className="text-[9px] uppercase tracking-[0.14em] text-zinc-400">Streak</span>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-premium-border bg-white p-6 dark:border-premium-borderDark dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Today&apos;s brief</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-premium-beige text-premium-accent dark:bg-zinc-800">
              <Target className="h-4 w-4" />
            </span>
          </div>
          <h2 className="mt-4 font-serif text-3xl tracking-tight">Stay in formation.</h2>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <Stat value={user ? String(xp) : "—"} label="XP" />
            <Stat value={user ? String(due.length) : "—"} label="Due" />
            <Stat value={user ? String(streak) : "—"} label="Day streak" />
          </div>
        </article>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Your daily formation</p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">One clear path forward.</h2>
          </div>
          <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">A balanced sequence designed around your current progress and upcoming exam.</p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <FormationCard index="01" kicker="Learn" title="Indian Ocean Region" detail="Strategic chokepoints & naval commands" meta="Open theory" href="/theory" icon="book" />
          <FormationCard index="02" kicker="Practice" title="Daily Intelligence Drill" detail="Questions curated for your weak areas" meta="Open drill" onOpen={() => setPracticing(true)} icon="target" />
          <FormationCard index="03" kicker="Communicate" title="Lecturette: Blue Economy" detail="Deliver a structured 3-minute response" meta="AI assessed" href="/rooms" icon="play" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="relative overflow-hidden rounded-3xl bg-premium-charcoal p-6 text-premium-beige dark:bg-zinc-950">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-premium-accent">Contest arena</p>
          <h2 className="mt-6 font-serif text-4xl tracking-tight">Sunday Grand Drill</h2>
          <p className="mt-3 max-w-sm text-sm text-zinc-300">Five questions. No feedback until the clock ends. Your rating moves with the result.</p>
          <Link href="/contest" className="mt-8 inline-flex rounded-full bg-premium-accent px-4 py-2 text-sm font-semibold text-premium-charcoal">
            Reserve seat
          </Link>
        </article>

        <article className="rounded-3xl border border-premium-border bg-white p-6 dark:border-premium-borderDark dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Knowledge vault</p>
              <h2 className="mt-1 text-lg font-semibold">Due for revision</h2>
            </div>
            <Link href="/vault" className="text-sm text-premium-accent">
              View vault
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-premium-border dark:divide-premium-borderDark">
            {due.length === 0 && <li className="py-4 text-sm text-zinc-500 dark:text-zinc-400">Nothing is waiting in the vault.</li>}
            {due.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <BookOpen className="h-4 w-4 shrink-0 text-zinc-400" />
                <p className="min-w-0 flex-1 truncate text-sm">{item.title}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-3xl tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{label}</p>
    </div>
  );
}

function FormationCard({
  index,
  kicker,
  title,
  detail,
  meta,
  href,
  onOpen,
  icon,
}: {
  index: string;
  kicker: string;
  title: string;
  detail: string;
  meta: string;
  href?: string;
  onOpen?: () => void;
  icon: "book" | "target" | "play";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-xs">{index}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-premium-border dark:border-premium-borderDark">
          {icon === "book" && <BookOpen className="h-3.5 w-3.5" />}
          {icon === "target" && <Crosshair className="h-3.5 w-3.5" />}
          {icon === "play" && <Play className="h-3.5 w-3.5" />}
        </span>
      </div>
      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{kicker}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{detail}</p>
      <div className="mt-8 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{meta}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-premium-accent text-premium-charcoal">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </>
  );
  const className = "block rounded-3xl border border-premium-border bg-white p-5 text-left transition hover:border-premium-accent dark:border-premium-borderDark dark:bg-zinc-900";
  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onOpen} className={className}>
      {body}
    </button>
  );
}
