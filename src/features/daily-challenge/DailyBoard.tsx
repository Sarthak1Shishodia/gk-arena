"use client";

import React, { useState, useEffect } from "react";
import { Flame, Share2, Check, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface DailyItem {
  category: "History" | "Geography" | "Science" | "Polity" | "Defense & GK";
  question: string;
  options: string[];
  correctIndex: number;
  fact: string;
}

const DAILY_GAUNTLET: DailyItem[] = [
  {
    category: "History",
    question: "Which Harappan city was uniquely divided into three parts (Citadel, Middle Town, and Lower Town) and had a giant water reservoir?",
    options: ["Mohenjo-daro", "Kalibangan", "Dholavira", "Rakhigarhi"],
    correctIndex: 2,
    fact: "Dholavira (in Rann of Kutch, Gujarat) is a UNESCO World Heritage site famous for its sophisticated stone water-harvesting reservoirs.",
  },
  {
    category: "Geography",
    question: "The 'Nine Degree Channel' separates which of the following island territories?",
    options: ["Andaman and Nicobar", "Minicoy and Lakshadweep (Kavaratti)", "Minicoy and Maldives", "Little Andaman and South Andaman"],
    correctIndex: 1,
    fact: "The 9° Channel separates Minicoy from the main Lakshadweep archipelago, while the 8° Channel separates Minicoy from the Maldives.",
  },
  {
    category: "Science",
    question: "When a sound wave travels from air into water, which of its physical properties remains completely unchanged?",
    options: ["Velocity", "Wavelength", "Frequency", "Amplitude"],
    correctIndex: 2,
    fact: "Frequency depends solely on the source of the wave; speed and wavelength increase in water while frequency stays constant.",
  },
  {
    category: "Polity",
    question: "Which Schedule of the Indian Constitution contains provisions regarding disqualification of MPs/MLAs on the ground of defection?",
    options: ["8th Schedule", "9th Schedule", "10th Schedule", "11th Schedule"],
    correctIndex: 2,
    fact: "Added by the 52nd Amendment Act of 1985, the 10th Schedule is known as the Anti-Defection Law.",
  },
  {
    category: "Defense & GK",
    question: "Where is the headquarters of the Indian Air Force's Western Air Command located?",
    options: ["Gandhinagar", "New Delhi (Subroto Park)", "Prayagraj", "Shillong"],
    correctIndex: 1,
    fact: "Western Air Command is headquartered at Subroto Park, New Delhi, and is the largest operational command of the IAF.",
  },
];

export default function DailyBoard() {
  const [todayKey, setTodayKey] = useState<string>("");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [completed, setCompleted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Next.js Hydration Fix: Generate date only on the client
    const dateStr = new Date().toISOString().split("T")[0];
    setTodayKey(dateStr);

    const saved = localStorage.getItem(`gk_daily_${dateStr}`);
    if (saved) {
      setResults(JSON.parse(saved));
      setCompleted(true);
    }
  }, []);

  if (!todayKey) return null; // Prevent rendering until date is ready

  const currentItem = DAILY_GAUNTLET[step];

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === currentItem.correctIndex;
    const updated = [...results, isCorrect];
    setResults(updated);

    if (step + 1 === DAILY_GAUNTLET.length) {
      localStorage.setItem(`gk_daily_${todayKey}`, JSON.stringify(updated));
      if (updated.filter(Boolean).length >= 3) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const nextStep = () => {
    if (step + 1 >= DAILY_GAUNTLET.length) setCompleted(true);
    else {
      setStep((s) => s + 1);
      setSelected(null);
    }
  };

  const copyScorecard = () => {
    const score = results.filter(Boolean).length;
    const grid = results.map((r, i) => `${r ? "🟩" : "🟥"} ${DAILY_GAUNTLET[i].category}`).join("\n");
    const text = `⚡ GK Arena Daily 5 (${todayKey})\nScore: ${score}/5\n\n${grid}\n\nCan you beat my score? Play at: gk-arena.vercel.app`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (completed) {
    const score = results.filter(Boolean).length;
    return (
      <div className="max-w-xl mx-auto p-8 bg-white dark:bg-zinc-900 text-premium-charcoal dark:text-zinc-100 rounded-2xl border border-premium-border dark:border-premium-borderDark text-center shadow-sm">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 bg-amber-500/20 text-premium-accent rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Daily Gauntlet Completed
        </span>
        <h2 className="text-3xl font-extrabold mb-2">{score} / 5 Correct</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6">Challenge Date: {todayKey}</p>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-premium-border dark:border-premium-borderDark max-w-xs mx-auto mb-6 text-left space-y-2">
          {results.map((res, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm font-medium">
              <span className="text-zinc-600 dark:text-zinc-300">{DAILY_GAUNTLET[idx].category}</span>
              <span>{res ? "🟩 Correct" : "🟥 Missed"}</span>
            </div>
          ))}
        </div>

        <button
          onClick={copyScorecard}
          className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-premium-charcoal px-6 py-3 font-bold text-premium-beige transition hover:bg-premium-accent dark:bg-zinc-100 dark:text-premium-charcoal"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied ? "Copied for WhatsApp / Telegram!" : "Share My Scorecard"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-zinc-900 text-premium-charcoal dark:text-zinc-100 rounded-2xl border border-premium-border dark:border-premium-borderDark shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-amber-500/20 text-premium-accent rounded-full flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 fill-amber-400" /> Daily 5 • {currentItem.category}
        </span>
        <div className="flex gap-1.5">
          {DAILY_GAUNTLET.map((_, i) => (
            <span
              key={i}
              className={`w-6 h-2 rounded-full ${
                i < results.length
                  ? results[i]
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                  : i === step
                  ? "bg-amber-400"
                  : "bg-premium-beige dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-6 text-premium-charcoal dark:text-zinc-100">{currentItem.question}</h2>

      <div className="space-y-3 mb-6">
        {currentItem.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === currentItem.correctIndex;
          let style = "bg-premium-beige dark:bg-zinc-800 border-premium-border dark:border-premium-borderDark hover:border-premium-accent";
          if (selected !== null) {
            if (isCorrect) style = "border-emerald-700 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200";
            else if (isSelected) style = "border-rose-700 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-200";
            else style = "bg-white dark:bg-zinc-900 border-premium-border dark:border-premium-borderDark opacity-50";
          }
          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${style}`}
            >
              <span className="font-medium text-sm">{opt}</span>
              {selected !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {selected !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="p-4 rounded-xl bg-premium-beige dark:bg-zinc-800 border border-premium-border dark:border-premium-borderDark flex flex-col gap-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <span className="font-bold text-amber-400">Exam Insight: </span>
            {currentItem.fact}
          </p>
          <button
            onClick={nextStep}
            className="self-end px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition"
          >
            {step + 1 === DAILY_GAUNTLET.length ? "See Daily Scorecard →" : "Next Stage →"}
          </button>
        </div>
      )}
    </div>
  );
}