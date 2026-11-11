"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Headphones, RotateCcw, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Phase = "LOBBY" | "PLAYING" | "TESTING" | "RESULTS";

type AudioQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type AudioTask = {
  id: string;
  title: string;
  scenario_description: string;
  audio_url: string;
  questions: AudioQuestion[];
};

type Row = Record<string, unknown>;

function textField(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function asOptions(row: Row) {
  const raw = row.options ?? row.choices;
  if (Array.isArray(raw)) return raw.map((option) => String(option)).filter((option) => option.trim());
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.map((option) => String(option)).filter((option) => option.trim());
    } catch {
      // A plain string is not a choice list.
    }
  }
  return ["option_a", "option_b", "option_c", "option_d"]
    .map((key) => row[key])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function correctIndex(row: Row, options: string[]) {
  const raw = row.correct_index ?? row.correctIndex ?? row.correct_option ?? row.answer ?? row.correct_answer;
  if (typeof raw === "number" && raw >= 0 && raw < options.length) return raw;
  if (typeof raw === "string") {
    const asNumber = Number(raw);
    if (Number.isInteger(asNumber) && asNumber >= 0 && asNumber < options.length) return asNumber;
    const match = options.findIndex((option) => option === raw);
    if (match >= 0) return match;
    const letter = raw.trim().toUpperCase();
    if (letter.length === 1 && letter >= "A" && letter < String.fromCharCode(65 + options.length)) return letter.charCodeAt(0) - 65;
  }
  return 0;
}

function linkedTaskId(row: Row) {
  for (const [key, value] of Object.entries(row)) {
    if (value == null || value === "") continue;
    if (key === "audio_task_id" || key === "task_id" || key.endsWith("_task_id")) return String(value);
  }
  return null;
}

function toQuestion(row: Row, index: number): AudioQuestion | null {
  const question = textField(row, ["question", "question_text", "prompt", "text"]);
  const options = asOptions(row);
  if (!question || options.length < 2) return null;
  const order = Number(row.order_index ?? row.position ?? index);
  return {
    id: String(row.id ?? `${index}-${question}`),
    question,
    options,
    correctIndex: correctIndex(row, options),
    explanation: textField(row, ["explanation", "rationale", "feedback"]),
    ...(Number.isFinite(order) ? { order } : {}),
  } as AudioQuestion & { order?: number };
}

function toTask(row: Row, questions: AudioQuestion[]): AudioTask | null {
  const audioUrl = textField(row, ["audio_url", "audioUrl", "url"]);
  if (!audioUrl) return null;
  return {
    id: String(row.id ?? audioUrl),
    title: textField(row, ["title"]) || "Listening briefing",
    scenario_description: textField(row, ["scenario_description", "scenario", "description"]),
    audio_url: audioUrl,
    questions,
  };
}

export default function ListeningBoard() {
  const [tasks, setTasks] = useState<AudioTask[]>([]);
  const [task, setTask] = useState<AudioTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("LOBBY");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const phaseRef = useRef<Phase>("LOBBY");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) {
        if (!cancelled) {
          setError("Supabase is not configured.");
          setLoading(false);
        }
        return;
      }
      const [taskResult, questionResult] = await Promise.all([
        supabase.from("audio_tasks").select("id, title, scenario_description, audio_url").limit(50),
        supabase.from("audio_questions").select("*").limit(200),
      ]);
      if (cancelled) return;
      if (taskResult.error) {
        setError(taskResult.error.message);
        setLoading(false);
        return;
      }
      if (questionResult.error) {
        setError(questionResult.error.message);
        setLoading(false);
        return;
      }
      const questionRows = (questionResult.data ?? []) as Row[];
      const parsed = ((taskResult.data ?? []) as Row[])
        .map((row) => {
          const taskId = String(row.id ?? "");
          const related = questionRows
            .filter((question) => linkedTaskId(question) === taskId)
            .map((question, index) => toQuestion(question, index))
            .filter((question): question is AudioQuestion & { order?: number } => question !== null)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          return toTask(row, related);
        })
        .filter((item): item is AudioTask => item !== null);
      setTasks(parsed);
      setTask(parsed.length > 0 ? parsed[Math.floor(Math.random() * parsed.length)] : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentQuestion = task?.questions[questionIndex];

  const startBriefing = async () => {
    const audio = audioRef.current;
    if (!audio || !task || phaseRef.current !== "LOBBY") return;
    setError(null);
    phaseRef.current = "PLAYING";
    setPhase("PLAYING");
    try {
      audio.currentTime = 0;
      await audio.play();
    } catch (reason) {
      phaseRef.current = "LOBBY";
      setPhase("LOBBY");
      const message = reason instanceof Error ? reason.message : "The briefing audio could not be played.";
      setError(message);
    }
  };

  const chooseOption = (index: number) => {
    if (selected !== null || !currentQuestion) return;
    setSelected(index);
    if (index === currentQuestion.correctIndex) setScore((current) => current + 1);
  };

  const advance = () => {
    if (!task || selected === null) return;
    if (questionIndex + 1 >= task.questions.length) {
      phaseRef.current = "RESULTS";
      setPhase("RESULTS");
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelected(null);
  };

  const anotherBriefing = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    const pool = tasks.filter((item) => item.id !== task?.id);
    const nextPool = pool.length > 0 ? pool : tasks;
    setTask(nextPool.length > 0 ? nextPool[Math.floor(Math.random() * nextPool.length)] : null);
    setQuestionIndex(0);
    setSelected(null);
    setScore(0);
    setError(null);
    phaseRef.current = "LOBBY";
    setPhase("LOBBY");
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 text-premium-charcoal dark:text-zinc-200">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">Listening assessment</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Hear the briefing once</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          The audio plays straight through. Answer the questions only after it ends.
        </p>
      </header>

      {task && (
        <audio
          ref={audioRef}
          src={task.audio_url}
          preload="auto"
          className="hidden"
          onEnded={() => {
            if (phaseRef.current !== "PLAYING") return;
            phaseRef.current = task.questions.length > 0 ? "TESTING" : "RESULTS";
            setPhase(phaseRef.current);
          }}
          onPlay={(event) => {
            if (phaseRef.current !== "PLAYING") event.currentTarget.pause();
          }}
        />
      )}

      {loading && (
        <section className="rounded-3xl border border-premium-border bg-white p-6 dark:border-premium-borderDark dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading a briefing...</p>
        </section>
      )}

      {!loading && !task && (
        <section className="rounded-3xl border border-premium-border bg-white p-6 dark:border-premium-borderDark dark:bg-zinc-900">
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            No listening briefings are visible yet. Add an audio_tasks row with a title, scenario_description, and audio_url, plus related audio_questions. Allow public read access with the policy in scripts/audio_tasks.sql.
          </p>
        </section>
      )}

      {task && phase === "LOBBY" && (
        <section className="rounded-3xl border border-premium-border bg-white p-6 dark:border-premium-borderDark dark:bg-zinc-900">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Headphones className="h-4 w-4 text-premium-accent" />
            {task.title}
          </p>
          <p className="mt-4 text-base leading-relaxed">{task.scenario_description || "Listen carefully. The questions come after the briefing."}</p>
          <p className="mt-4 rounded-2xl border border-premium-border bg-premium-beige px-4 py-3 text-sm text-premium-charcoal dark:border-premium-borderDark dark:bg-zinc-800 dark:text-zinc-200">
            This briefing plays only once. You cannot pause, seek, or replay it.
          </p>
          <button
            type="button"
            onClick={() => void startBriefing()}
            className="mt-5 rounded-xl bg-premium-charcoal px-4 py-2.5 text-sm font-bold text-premium-beige transition hover:bg-premium-accent dark:bg-zinc-100 dark:text-premium-charcoal"
          >
            Start Briefing
          </button>
        </section>
      )}

      {task && phase === "PLAYING" && (
        <section className="rounded-3xl border border-premium-border bg-white p-8 text-center dark:border-premium-borderDark dark:bg-zinc-900">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <span className="absolute h-16 w-16 animate-ping rounded-full bg-premium-accent/30" />
            <Headphones className="relative h-8 w-8 text-premium-accent" />
          </div>
          <p className="mt-6 text-lg font-bold" role="status">
            Audio Playing...
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{task.title}</p>
        </section>
      )}

      {task && phase === "TESTING" && currentQuestion && (
        <section className="rounded-3xl border border-premium-border bg-white p-6 dark:border-premium-borderDark dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Question {questionIndex + 1} of {task.questions.length}
          </p>
          <h2 className="mt-3 text-lg font-semibold">{currentQuestion.question}</h2>
          <div className="mt-5 space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selected === index;
              const isCorrect = index === currentQuestion.correctIndex;
              let style = "border-premium-border bg-premium-beige hover:border-premium-accent dark:border-premium-borderDark dark:bg-zinc-800";
              if (selected !== null) {
                if (isCorrect) style = "border-emerald-700 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200";
                else if (isSelected) style = "border-rose-700 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-200";
                else style = "border-premium-border bg-white opacity-50 dark:border-premium-borderDark dark:bg-zinc-900";
              }
              return (
                <button
                  key={`${currentQuestion.id}-${index}`}
                  type="button"
                  onClick={() => chooseOption(index)}
                  disabled={selected !== null}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition ${style}`}
                >
                  <span>{option}</span>
                  {selected !== null && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />}
                  {selected !== null && isSelected && !isCorrect && <XCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <div className="mt-4 rounded-xl border border-premium-border bg-premium-beige p-4 dark:border-premium-borderDark dark:bg-zinc-800">
              {currentQuestion.explanation && <p className="text-sm leading-relaxed">{currentQuestion.explanation}</p>}
              <button
                type="button"
                onClick={advance}
                className="mt-3 rounded-xl bg-premium-charcoal px-4 py-2.5 text-sm font-bold text-premium-beige transition hover:bg-premium-accent dark:bg-zinc-100 dark:text-premium-charcoal"
              >
                {questionIndex + 1 === task.questions.length ? "See score" : "Next question"}
              </button>
            </div>
          )}
        </section>
      )}

      {task && phase === "RESULTS" && (
        <section className="rounded-3xl border border-premium-border bg-white p-8 text-center dark:border-premium-borderDark dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">Final score</p>
          <p className="mt-3 text-5xl font-extrabold text-premium-accent">
            {score}
            <span className="text-2xl text-premium-charcoal dark:text-zinc-200">/{task.questions.length}</span>
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {task.questions.length === 0 ? "This briefing had no questions." : `${Math.round((score / task.questions.length) * 100)}% accuracy`}
          </p>
          <button
            type="button"
            onClick={anotherBriefing}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-premium-charcoal px-4 py-2.5 text-sm font-bold text-premium-beige transition hover:bg-premium-accent dark:bg-zinc-100 dark:text-premium-charcoal"
          >
            <RotateCcw className="h-4 w-4" />
            New briefing
          </button>
        </section>
      )}

      {error && (
        <p role="status" className="rounded-2xl border border-rose-700/30 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}
