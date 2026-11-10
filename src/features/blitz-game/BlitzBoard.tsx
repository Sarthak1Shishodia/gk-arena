"use client";

import React, { useState, useEffect } from "react";
import { BlitzMcqPayload } from "@/types/game";
import { fetchBlitzQuestions, logMistake } from "@/lib/supabase/queries";
import { Timer, Zap, CheckCircle2, XCircle, RotateCcw, Trophy, Database } from "lucide-react";
import confetti from "canvas-confetti";

const FALLBACK_BLITZ: BlitzMcqPayload[] = [
  {
    question: "Which phenomenon explains why optical fibers transmit light over long distances with minimal loss?",
    options: ["Refraction", "Total Internal Reflection", "Diffraction", "Dispersion"],
    correctIndex: 1,
    explanation: "Light rays strike the core-cladding boundary at an angle greater than the critical angle, reflecting completely inside.",
  },
  {
    question: "Which river originates from the Rakshastal lake near Mount Kailash and enters India through Shipki La pass?",
    options: ["Indus", "Brahmaputra", "Sutlej", "Chenab"],
    correctIndex: 2,
    explanation: "The Sutlej (ancient Shatadru) originates in Rakshastal and cuts through the Himalayas at Shipki La in Himachal Pradesh.",
  },
];

export default function BlitzBoard() {
  const [questions, setQuestions] = useState<BlitzMcqPayload[]>(FALLBACK_BLITZ);
  const [isCloud, setIsCloud] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    fetchBlitzQuestions().then((cloudData) => {
      if (cloudData.length > 0) {
        const shuffled = [...cloudData].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
        setIsCloud(true);
      }
    });
  }, []);

  const currentQ = questions[currentIdx];

  useEffect(() => {
    if (gameOver || selectedOpt !== null) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameOver, selectedOpt]);

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null || gameOver) return;
    setSelectedOpt(idx);
    if (idx === currentQ.correctIndex) {
      setScore((s) => s + 100 + timeLeft * 2);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.75 } });
    } else {
      void logMistake(currentQ);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) setGameOver(true);
    else {
      setCurrentIdx((i) => i + 1);
      setSelectedOpt(null);
    }
  };

  const restartBlitz = () => {
    setQuestions((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 text-center shadow-2xl">
        <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-1">Blitz Complete!</h2>
        <p className="text-slate-400 text-sm mb-6">Speed + Accuracy Bonus included</p>
        <div className="text-4xl font-extrabold text-cyan-400 mb-6">{score} PTS</div>
        <button
          onClick={restartBlitz}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" /> Play New Cloud Set
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-cyan-300" /> Blitz ({currentIdx + 1}/{questions.length})
          </span>
          {isCloud && (
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center gap-1">
              <Database className="w-3 h-3" /> Cloud Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm font-bold">
          <span className="text-emerald-400">Score: {score}</span>
          <span className={`flex items-center gap-1 ${timeLeft <= 10 ? "text-rose-400 animate-pulse" : "text-amber-400"}`}>
            <Timer className="w-4 h-4" /> {timeLeft}s
          </span>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-6 text-slate-100">{currentQ.question}</h2>

      <div className="space-y-3 mb-6">
        {currentQ.options.map((opt, idx) => {
          const isSelected = selectedOpt === idx;
          const isCorrect = idx === currentQ.correctIndex;
          let style = "bg-slate-800/80 border-slate-700 hover:border-slate-500";

          if (selectedOpt !== null) {
            if (isCorrect) style = "bg-emerald-950/60 border-emerald-500 text-emerald-200";
            else if (isSelected) style = "bg-rose-950/60 border-rose-500 text-rose-200";
            else style = "bg-slate-900 border-slate-800 opacity-50";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selectedOpt !== null}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${style}`}
            >
              <span className="font-medium text-sm">{opt}</span>
              {selectedOpt !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {selectedOpt !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {selectedOpt !== null && (
        <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col gap-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-cyan-400">Concept Check: </span>
            {currentQ.explanation}
          </p>
          <button
            onClick={nextQuestion}
            className="self-end px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition"
          >
            {currentIdx + 1 === questions.length ? "Finish Round" : "Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
}
