"use client";

import React, { useState, useEffect } from "react";
import { TimelinePayload } from "@/types/game";
import { fetchTimelineRounds } from "@/lib/supabase/queries";
import { ArrowUp, ArrowDown, CheckCircle2, XCircle, Flame, RotateCcw, Database } from "lucide-react";
import confetti from "canvas-confetti";

const FALLBACK_ROUNDS: TimelinePayload[] = [
  {
    prompt: "Arrange these Ancient & Modern Indian History milestones from earliest to latest:",
    events: [
      { id: "1", title: "Kalinga War (Mauryan Empire)", year: -261, detail: "Ashoka embraced Buddhism after witnessing the war's devastation." },
      { id: "2", title: "First Battle of Panipat", year: 1526, detail: "Babur defeated Ibrahim Lodi, establishing the Mughal Empire." },
      { id: "3", title: "Revolt of 1857 (First War of Independence)", year: 1857, detail: "Began in Meerut and ended East India Company rule." },
      { id: "4", title: "Dandi March (Salt Satyagraha)", year: 1930, detail: "Mahatma Gandhi led a 240-mile march to produce salt at Dandi." },
    ],
  },
];

export default function TimelineBoard() {
  const [rounds, setRounds] = useState<TimelinePayload[]>(FALLBACK_ROUNDS);
  const [roundIdx, setRoundIdx] = useState(0);
  const [isCloud, setIsCloud] = useState(false);
  const [items, setItems] = useState(() => [...FALLBACK_ROUNDS[0].events].reverse());
  const [submitted, setSubmitted] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setItems([...FALLBACK_ROUNDS[0].events].sort(() => Math.random() - 0.5));
    fetchTimelineRounds().then((cloudRounds) => {
      if (cloudRounds.length > 0) {
        setRounds(cloudRounds);
        setItems([...cloudRounds[0].events].sort(() => Math.random() - 0.5));
        setIsCloud(true);
      }
    });
  }, []);

  const currentRound = rounds[roundIdx];

  const moveItem = (index: number, direction: "up" | "down") => {
    if (submitted) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setItems(updated);
  };

  const checkOrder = () => {
    const correct = items.every((item, idx) => (idx === 0 ? true : item.year >= items[idx - 1].year));
    setSubmitted(true);
    setIsWin(correct);
    if (correct) {
      setStreak((s) => s + 1);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } else setStreak(0);
  };

  const nextRound = () => {
    const nextIdx = (roundIdx + 1) % rounds.length;
    setRoundIdx(nextIdx);
    setItems([...rounds[nextIdx].events].sort(() => Math.random() - 0.5));
    setSubmitted(false);
    setIsWin(false);
  };

  const formatYear = (y: number) => (y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`);

  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
            History • Round {roundIdx + 1}/{rounds.length}
          </span>
          {isCloud && (
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center gap-1">
              <Database className="w-3 h-3" /> Cloud Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
          <Flame className="w-4 h-4 fill-amber-400" /> Streak: {streak}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-6 text-slate-200">{currentRound.prompt}</h2>

      <div className="space-y-3 mb-6">
        {items.map((event, index) => (
          <div
            key={event.id}
            className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
              submitted
                ? isWin
                  ? "bg-emerald-950/40 border-emerald-500/50"
                  : "bg-rose-950/40 border-rose-500/50"
                : "bg-slate-800/80 border-slate-700 hover:border-slate-600"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-slate-100">{event.title}</p>
                {submitted && (
                  <p className="text-xs text-slate-400 mt-1">
                    <span className="font-bold text-amber-300">{formatYear(event.year)}:</span> {event.detail}
                  </p>
                )}
              </div>
            </div>

            {!submitted && (
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => moveItem(index, "up")} disabled={index === 0} className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveItem(index, "down")} disabled={index === items.length - 1} className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30">
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted ? (
        <button onClick={checkOrder} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl transition">
          Lock In Timeline
        </button>
      ) : (
        <div className="flex items-center justify-between bg-slate-800/90 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            {isWin ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
            <span className="font-semibold text-sm">
              {isWin ? "Spot on! Perfect chronological order." : "Not quite! Check the revealed years above."}
            </span>
          </div>
          <button onClick={nextRound} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium">
            <RotateCcw className="w-4 h-4" /> Next Round →
          </button>
        </div>
      )}
    </div>
  );
}
