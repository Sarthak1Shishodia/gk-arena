"use client";

import React, { useEffect, useState } from "react";
import { BlitzMcqPayload } from "@/types/game";
import { fetchMistakes, removeMistake } from "@/lib/supabase/queries";
import { Brain, CheckCircle2, XCircle } from "lucide-react";

type MistakeCard = {
  id: string;
  payload: BlitzMcqPayload;
};

export default function VaultBoard() {
  const [cards, setCards] = useState<MistakeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [clearingId, setClearingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMistakes().then((rows) => {
      if (cancelled) return;
      setCards(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = async (card: MistakeCard, optionIndex: number) => {
    if (clearingId || attempts[card.id] !== undefined) return;

    if (optionIndex !== card.payload.correctIndex) {
      setAttempts((current) => ({ ...current, [card.id]: optionIndex }));
      return;
    }

    setClearingId(card.id);
    setCards((current) => current.filter((item) => item.id !== card.id));
    setAttempts((current) => {
      const next = { ...current };
      delete next[card.id];
      return next;
    });
    await removeMistake(card.id);
    setClearingId(null);
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-2xl border border-premium-border dark:border-premium-borderDark text-center">
        Opening your mistake vault…
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white dark:bg-zinc-900 text-premium-charcoal dark:text-zinc-100 rounded-2xl border border-premium-border dark:border-premium-borderDark text-center">
        <Brain className="w-10 h-10 text-violet-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-2">Vault is clear</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Wrong Blitz and Contest answers are saved here when you are signed in. Answer one correctly to retire it.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-zinc-900 text-premium-charcoal dark:text-zinc-100 rounded-2xl border border-premium-border dark:border-premium-borderDark shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5" /> Mistake Vault
        </span>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{cards.length} to review</span>
      </div>

      <div className="space-y-4">
        {cards.map((card, cardIndex) => {
          const selected = attempts[card.id];
          const revealed = selected !== undefined;
          return (
            <article key={card.id} className="rounded-2xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 p-4">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Card {cardIndex + 1}</p>
              <h2 className="text-base font-semibold mb-4">{card.payload.question}</h2>
              <div className="space-y-2">
                {card.payload.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;
                  const isCorrect = optionIndex === card.payload.correctIndex;
                  let style = "bg-premium-beige dark:bg-zinc-800 border-premium-border dark:border-premium-borderDark hover:border-violet-400";
                  if (revealed) {
                    if (isCorrect) style = "border-emerald-700 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200";
                    else if (isSelected) style = "border-rose-700 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-200";
                    else style = "bg-white dark:bg-zinc-900 border-premium-border dark:border-premium-borderDark opacity-60";
                  }

                  return (
                    <button
                      key={`${card.id}-${optionIndex}`}
                      onClick={() => handleSelect(card, optionIndex)}
                      disabled={revealed || clearingId === card.id}
                      className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${style}`}
                    >
                      <span className="text-sm font-medium">{option}</span>
                      {revealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {revealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {revealed && (
                <div className="mt-3 flex flex-col gap-3">
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                    <span className="font-bold text-violet-300">Still in the vault. </span>
                    {card.payload.explanation}
                  </p>
                  <button
                    onClick={() =>
                      setAttempts((current) => {
                        const next = { ...current };
                        delete next[card.id];
                        return next;
                      })
                    }
                    className="self-end px-4 py-2 rounded-lg bg-premium-beige dark:bg-zinc-800 hover:bg-premium-beige text-premium-charcoal dark:bg-zinc-800 dark:text-zinc-100 text-sm font-semibold transition"
                  >
                    Try again
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
