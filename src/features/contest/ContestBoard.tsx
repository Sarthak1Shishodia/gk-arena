"use client";

import React, { useEffect, useRef, useState } from "react";
import { BlitzMcqPayload } from "@/types/game";
import { fetchBlitzQuestions, logMistake, updateContestElo } from "@/lib/supabase/queries";
import { RotateCcw, Swords, Timer } from "lucide-react";

const ROUND_SIZE = 5;
const ROUND_SECONDS = 120;

type Answer = number | null;

export default function ContestBoard() {
  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState<BlitzMcqPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [phase, setPhase] = useState<"loading" | "play" | "results">("loading");
  const [correctCount, setCorrectCount] = useState(0);
  const [eloChange, setEloChange] = useState(0);
  const [eloSaved, setEloSaved] = useState(false);
  const [grading, setGrading] = useState(false);

  const answersRef = useRef<Answer[]>([]);
  const questionsRef = useRef<BlitzMcqPayload[]>([]);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPhase("loading");
    finishedRef.current = false;
    setIndex(0);
    setTimeLeft(ROUND_SECONDS);
    setCorrectCount(0);
    setEloChange(0);
    setEloSaved(false);
    setGrading(false);

    fetchBlitzQuestions().then((cloud) => {
      if (cancelled) return;
      const picked = [...cloud].sort(() => Math.random() - 0.5).slice(0, ROUND_SIZE);
      questionsRef.current = picked;
      const blank = picked.map(() => null as Answer);
      answersRef.current = blank;
      setQuestions(picked);
      setAnswers(blank);
      setLoading(false);
      setPhase(picked.length > 0 ? "play" : "results");
    });

    return () => {
      cancelled = true;
    };
  }, [round]);

  const finish = async (finalAnswers: Answer[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setGrading(true);

    const qs = questionsRef.current;
    const correct = qs.filter((question, i) => finalAnswers[i] === question.correctIndex).length;
    const netChange = correct * 15 + (qs.length - correct) * -5;
    const applied = qs.length > 0 ? await updateContestElo(netChange) : null;

    setCorrectCount(correct);
    setEloChange(applied ?? netChange);
    setEloSaved(applied !== null);
    setGrading(false);
    setPhase("results");
  };

  useEffect(() => {
    if (phase !== "play") return;
    if (timeLeft <= 0) {
      void finish(answersRef.current);
      return;
    }
    const timer = setInterval(() => setTimeLeft((current) => current - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const handleSelect = (optionIndex: number) => {
    if (phase !== "play" || finishedRef.current) return;
    const currentQuestion = questions[index];
    if (currentQuestion && optionIndex !== currentQuestion.correctIndex) {
      void logMistake(currentQuestion);
    }
    const next = [...answersRef.current];
    next[index] = optionIndex;
    answersRef.current = next;
    setAnswers(next);

    if (index + 1 >= questions.length) {
      void finish(next);
      return;
    }
    setIndex((current) => current + 1);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const accuracy = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100);
  const eloLabel = `${eloChange > 0 ? "+" : ""}${eloChange}`;

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-2xl border border-premium-border dark:border-premium-borderDark text-center">
        Drawing 5 contest questions…
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white dark:bg-zinc-900 text-premium-charcoal dark:text-zinc-100 rounded-2xl border border-premium-border dark:border-premium-borderDark text-center">
        <Swords className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-2">No contest questions yet</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Add Blitz questions, then start another round.</p>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white dark:bg-zinc-900 text-premium-charcoal dark:text-zinc-100 rounded-2xl border border-premium-border dark:border-premium-borderDark text-center shadow-sm">
        <Swords className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-1">Contest complete</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
          {correctCount} correct, {questions.length - correctCount} wrong or blank
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 px-4 py-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Accuracy</p>
            <p className="mt-1 text-3xl font-extrabold text-premium-charcoal dark:text-zinc-100">{accuracy}%</p>
          </div>
          <div className="rounded-xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 px-4 py-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">ELO Change</p>
            <p className={`mt-1 text-3xl font-extrabold ${eloChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {eloLabel}
            </p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          {eloSaved ? "Contest ELO updated. It cannot fall below 100." : "This ELO change was not saved. Sign in to record it."}
        </p>
        <button
          onClick={() => setRound((current) => current + 1)}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-6 py-3 font-semibold text-white transition hover:bg-rose-600"
        >
          <RotateCcw className="w-4 h-4" /> New contest
        </button>
      </div>
    );
  }

  if (grading) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-2xl border border-premium-border dark:border-premium-borderDark text-center">
        Scoring the round…
      </div>
    );
  }

  const current = questions[index];

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-zinc-900 text-premium-charcoal dark:text-zinc-100 rounded-2xl border border-premium-border dark:border-premium-borderDark shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full flex items-center gap-1.5">
          <Swords className="w-3.5 h-3.5" /> Contest ({index + 1}/{questions.length})
        </span>
        <span className={`flex items-center gap-1 text-sm font-bold ${timeLeft <= 15 ? "text-rose-400" : "text-amber-400"}`}>
          <Timer className="w-4 h-4" /> {minutes}:{seconds}
        </span>
      </div>

      <h2 className="text-lg font-semibold mb-6 text-premium-charcoal dark:text-zinc-100">{current.question}</h2>

      <div className="space-y-3">
        {current.options.map((option, optionIndex) => (
          <button
            key={`${index}-${optionIndex}`}
            onClick={() => handleSelect(optionIndex)}
            className="w-full text-left p-4 rounded-xl border border-premium-border dark:border-premium-borderDark bg-premium-beige dark:bg-zinc-800 font-medium text-sm transition hover:border-rose-400"
          >
            {option}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">Answers stay hidden until the round ends. +15 correct, −5 wrong or blank.</p>
    </div>
  );
}
