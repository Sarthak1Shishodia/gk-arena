"use client";

import React, { useMemo, useState } from "react";
import { Clock, Compass, FileText, Loader2, Sparkles, WandSparkles, Zap } from "lucide-react";
import { generateAndInjectQuestions } from "./actions";

const MODES = [
  {
    id: "blitz",
    label: "Blitz",
    hint: "Rapid-fire multiple choice",
    icon: Zap,
  },
  {
    id: "timeline",
    label: "Timeline",
    hint: "Order events by year",
    icon: Clock,
  },
  {
    id: "map",
    label: "Map",
    hint: "Place facts on the map",
    icon: Compass,
  },
] as const;

type GameMode = (typeof MODES)[number]["id"];
type Notice = { tone: "success" | "error"; message: string };

export default function AdminStudioPage() {
  const [material, setMaterial] = useState("");
  const [mode, setMode] = useState<GameMode>("blitz");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const wordCount = useMemo(() => {
    const trimmed = material.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [material]);

  const selected = MODES.find((item) => item.id === mode) ?? MODES[0];
  const SelectedIcon = selected.icon;

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!material.trim()) {
      setNotice({ tone: "error", message: "Paste some study material before generating." });
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const result = await generateAndInjectQuestions(material, mode);
      if (result.success) {
        const count = result.count ?? 0;
        setNotice({
          tone: "success",
          message: `Injected ${count} ${count === 1 ? "question" : "questions"} into ${selected.label}.`,
        });
      } else {
        setNotice({ tone: "error", message: result.error || "Generation failed." });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed.";
      setNotice({ tone: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-white px-4 py-8 text-premium-charcoal dark:bg-zinc-900 dark:text-zinc-100 sm:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-16 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.18),_transparent_60%)]" />

      <form onSubmit={handleGenerate} className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-premium-border dark:border-premium-borderDark px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-premium-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Admin Studio
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Turn notes into{" "}
              <span className="text-premium-accent">arena questions</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-base">
              Paste a chapter, a current-affairs dump, or a handwritten transcript. Pick a game mode, then generate a set ready to inject.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 px-4 py-3">
            <SelectedIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Target mode</p>
              <p className="text-sm font-semibold text-premium-charcoal dark:text-zinc-100">{selected.label}</p>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-premium-border dark:border-premium-borderDark px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <label htmlFor="game-mode" className="flex items-center gap-2 text-sm font-semibold text-premium-charcoal dark:text-zinc-200">
              <WandSparkles className="h-4 w-4 text-premium-accent" />
              Game mode
            </label>
            <select
              id="game-mode"
              value={mode}
              disabled={loading}
              onChange={(event) => {
                setMode(event.target.value as GameMode);
                setNotice(null);
              }}
              className="w-full appearance-none rounded-xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-semibold text-premium-charcoal dark:text-zinc-100 outline-none transition focus:border-premium-accent focus:ring-2 focus:ring-premium-accent/20 disabled:opacity-60 sm:w-72"
            >
              {MODES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} — {item.hint}
                </option>
              ))}
            </select>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label htmlFor="study-material" className="flex items-center gap-2 text-sm font-semibold text-premium-charcoal dark:text-zinc-200">
                <FileText className="h-4 w-4 text-premium-accent" />
                Study material
              </label>
              <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
              </span>
            </div>
            <textarea
              id="study-material"
              value={material}
              disabled={loading}
              onChange={(event) => {
                setMaterial(event.target.value);
                setNotice(null);
              }}
              placeholder="Paste the source text here. Dates, places, people, and cause-and-effect lines work best."
              className="min-h-[22rem] w-full resize-y rounded-2xl border border-premium-border dark:border-premium-borderDark bg-white/90 dark:bg-zinc-900/80 px-4 py-4 text-base leading-relaxed text-premium-charcoal dark:text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:border-premium-accent focus:ring-2 focus:ring-premium-accent/20 disabled:opacity-60 sm:min-h-[28rem] sm:px-5 sm:text-[15px]"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-premium-border dark:border-premium-borderDark bg-premium-beige/70 dark:bg-zinc-900/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{selected.hint}. Questions are written to the arena.</p>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-premium-charcoal px-6 py-4 text-base font-extrabold text-premium-beige transition hover:bg-premium-accent active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 dark:bg-zinc-100 dark:text-premium-charcoal sm:w-auto sm:min-w-64"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {loading ? "Generating…" : "Generate & Inject"}
            </button>
          </div>
        </section>

        {notice && (
          <p
            role="status"
            className={`rounded-2xl border px-4 py-3 text-sm ${
              notice.tone === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200"
            }`}
          >
            {notice.message}
          </p>
        )}
      </form>
    </main>
  );
}
