"use client";

import React, { useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, Mic, MicOff, Square, Video, VideoOff, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { evaluateReading, type ReadingScorecard } from "@/app/teleprompter/actions";

const READ_MS = 120_000;

type Phase = "ready" | "reading" | "processing" | "complete";

type ReadingTask = {
  id: string;
  title: string;
  content: string;
};

type StoredVerdict = {
  id: string;
  title: string;
  scorecard: ReadingScorecard;
  videoUrl: string | null;
};

function VerdictStats({ scorecard }: { scorecard: ReadingScorecard }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-2xl border border-premium-border px-4 py-4 dark:border-premium-borderDark">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Words per minute</p>
        <p className="mt-2 text-3xl font-extrabold text-premium-accent">{scorecard.wpm_score}</p>
      </article>
      <article className="rounded-2xl border border-premium-border px-4 py-4 dark:border-premium-borderDark">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Pronunciation</p>
        <p className="mt-2 text-3xl font-extrabold text-premium-accent">
          {scorecard.pronunciation_score}
          <span className="text-lg">/10</span>
        </p>
      </article>
      <article className="rounded-2xl border border-premium-border px-4 py-4 dark:border-premium-borderDark">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Stutters</p>
        <p className="mt-2 text-3xl font-extrabold text-premium-accent">{scorecard.stutter_count}</p>
      </article>
    </div>
  );
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function pickMimeType() {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function TeleprompterBoard() {
  const [task, setTask] = useState<ReadingTask | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [phase, setPhase] = useState<Phase>("ready");
  const [secondsLeft, setSecondsLeft] = useState(READ_MS / 1000);
  const [verdicts, setVerdicts] = useState<StoredVerdict[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLElement>(null);
  const closeVerdictRef = useRef<HTMLButtonElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("ready");
  const taskRef = useRef<ReadingTask | null>(null);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);
  const deviceRequestRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
    taskRef.current = task;
  }, [phase, task]);

  const releaseCamera = () => {
    deviceRequestRef.current += 1;
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (mountedRef.current) {
      setCameraOn(false);
      setMicOn(false);
    }
  };

  const stopScroll = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const release = () => {
      stopScroll();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      releaseCamera();
    };
    window.addEventListener("pagehide", release);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("pagehide", release);
      release();
    };
  }, []);

  useEffect(() => {
    if (!popupOpen) return;
    closeVerdictRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopupOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [popupOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) {
        if (!cancelled) {
          setError("Supabase is not configured.");
          setLoadingTask(false);
        }
        return;
      }
      const { data, error: queryError } = await supabase.from("reading_tasks").select("id, title, content").limit(50);
      if (cancelled) return;
      if (queryError) {
        setError(queryError.message);
        setLoadingTask(false);
        return;
      }
      const rows = (data ?? []).filter((row) => typeof row.content === "string" && row.content.trim());
      if (rows.length === 0) {
        setTask(null);
        setLoadingTask(false);
        return;
      }
      const picked = rows[Math.floor(Math.random() * rows.length)];
      setTask({ id: String(picked.id), title: picked.title || "Reading passage", content: picked.content });
      setLoadingTask(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setDevices = async (nextCamera: boolean, nextMic: boolean) => {
    if (phaseRef.current === "reading" || phaseRef.current === "processing") return;
    const requestId = deviceRequestRef.current + 1;
    deviceRequestRef.current = requestId;
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(nextCamera);
    setMicOn(nextMic);
    if (!nextCamera && !nextMic) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: nextCamera, audio: nextMic });
      if (!mountedRef.current || requestId !== deviceRequestRef.current) {
        stopStream(stream);
        return;
      }
      streamRef.current = stream;
      if (nextCamera && videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (reason) {
      if (requestId !== deviceRequestRef.current) return;
      stopStream(streamRef.current);
      streamRef.current = null;
      setCameraOn(false);
      setMicOn(false);
      const message = reason instanceof Error ? reason.message : "Camera and microphone access was blocked.";
      setError(message);
    }
  };

  const publishRecording = async (blob: Blob) => {
    const passage = taskRef.current?.content ?? "";
    if (!supabase) {
      setPhase("ready");
      setError("Supabase is not configured.");
      return;
    }
    try {
      const fileName = `reading-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from("videos").upload(fileName, blob, {
        contentType: "video/webm",
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from("videos").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      const result = await evaluateReading(publicUrl, passage);
      if (!mountedRef.current) return;
      setVerdicts((current) => [
        {
          id: String(Date.now()),
          title: taskRef.current?.title || "Reading passage",
          scorecard: result,
          videoUrl: publicUrl,
        },
        ...current,
      ]);
      setPopupOpen(true);
      setPhase("complete");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The reading assessment failed.";
      if (mountedRef.current) {
        setError(message);
        setPhase("ready");
      }
    }
  };

  const finishReading = () => {
    if (phaseRef.current !== "reading") return;
    phaseRef.current = "processing";
    setPhase("processing");
    stopScroll();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    releaseCamera();
    if (mountedRef.current) setPhase("ready");
  };

  const startReading = () => {
    const stream = streamRef.current;
    const cameraLive = stream?.getVideoTracks().some((track) => track.readyState === "live") ?? false;
    const micLive = stream?.getAudioTracks().some((track) => track.readyState === "live") ?? false;
    if (startingRef.current || phaseRef.current !== "ready" || !taskRef.current || !stream || !cameraLive || !micLive) return;
    startingRef.current = true;
    setError(null);
    setPopupOpen(false);
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      recorderRef.current = null;
      releaseCamera();
      void publishRecording(blob);
    };
    recorderRef.current = recorder;
    recorder.start();
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    phaseRef.current = "reading";
    setPhase("reading");
    setSecondsLeft(READ_MS / 1000);
    const startedAt = performance.now();
    let lastSecond = READ_MS / 1000;
    const tick = (now: number) => {
      if (phaseRef.current !== "reading") return;
      const progress = Math.min(1, (now - startedAt) / READ_MS);
      const scroller = scrollerRef.current;
      if (scroller) {
        scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * progress;
      }
      const remaining = Math.max(0, Math.ceil((READ_MS - (now - startedAt)) / 1000));
      if (remaining !== lastSecond) {
        lastSecond = remaining;
        setSecondsLeft(remaining);
      }
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      finishReading();
    };
    rafRef.current = requestAnimationFrame(tick);
    startingRef.current = false;
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 text-premium-charcoal dark:text-zinc-100">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">Reading assessment</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Read the passage aloud</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          The camera and microphone stay off until you turn them on. Start Reading is available only after both are on.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-3xl border border-premium-border bg-white dark:border-premium-borderDark dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-premium-border px-5 py-4 dark:border-premium-borderDark">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Video className="h-4 w-4 text-premium-accent" />
              Live camera
            </p>
            {phase === "reading" && <span className="font-mono text-sm tabular-nums text-premium-accent">{formatClock(secondsLeft)}</span>}
          </div>
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full object-cover ${cameraOn ? "" : "invisible"}`} />
            {!cameraOn && phase !== "processing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-zinc-300">
                <VideoOff className="h-8 w-8" />
                <p className="text-sm font-semibold">Camera is off</p>
              </div>
            )}
            {phase === "processing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 px-6 text-center dark:bg-zinc-900/90">
                <Loader2 className="h-8 w-8 animate-spin text-premium-accent" />
                <p className="text-lg font-bold">Processing...</p>
                <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">The camera and microphone are off while the reading is scored.</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 px-5 py-4">
            <button
              type="button"
              aria-pressed={cameraOn}
              disabled={phase === "reading" || phase === "processing"}
              onClick={() => void setDevices(!cameraOn, micOn)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                cameraOn
                  ? "border-premium-accent bg-premium-accent/15 text-premium-charcoal dark:text-zinc-100"
                  : "border-premium-border text-zinc-500 dark:border-premium-borderDark dark:text-zinc-400"
              }`}
            >
              {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              Camera {cameraOn ? "on" : "off"}
            </button>
            <button
              type="button"
              aria-pressed={micOn}
              disabled={phase === "reading" || phase === "processing"}
              onClick={() => void setDevices(cameraOn, !micOn)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                micOn
                  ? "border-premium-accent bg-premium-accent/15 text-premium-charcoal dark:text-zinc-100"
                  : "border-premium-border text-zinc-500 dark:border-premium-borderDark dark:text-zinc-400"
              }`}
            >
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              Mic {micOn ? "on" : "off"}
            </button>
            <button
              type="button"
              onClick={startReading}
              disabled={phase !== "ready" || !task || !cameraOn || !micOn}
              className="rounded-xl bg-premium-charcoal px-4 py-2.5 text-sm font-bold text-premium-beige transition hover:bg-premium-accent disabled:opacity-50 dark:bg-zinc-100 dark:text-premium-charcoal"
            >
              Start Reading
            </button>
            <button
              type="button"
              onClick={finishReading}
              disabled={phase !== "reading"}
              className="inline-flex items-center gap-2 rounded-xl border border-premium-border px-4 py-2.5 text-sm font-bold transition hover:border-premium-accent disabled:opacity-50 dark:border-premium-borderDark"
            >
              <Square className="h-4 w-4" />
              Finish
            </button>
          </div>
        </section>

        <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-3xl border border-premium-border bg-white dark:border-premium-borderDark dark:bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-premium-border px-5 py-4 dark:border-premium-borderDark">
            <BookOpen className="h-4 w-4 text-premium-accent" />
            <h2 className="text-sm font-semibold">{task?.title || "Passage"}</h2>
          </div>
          <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loadingTask ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading a passage...</p>
            ) : task ? (
              <p className="text-2xl leading-relaxed tracking-tight sm:text-3xl sm:leading-relaxed">{task.content}</p>
            ) : (
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                No reading passages are visible yet. Add a title and content row, then allow public read access with the policy in scripts/reading_tasks.sql.
              </p>
            )}
          </div>
        </section>
      </div>

      {verdicts.length > 0 && (
        <section ref={historyRef} className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Verdicts</h2>
          {verdicts.map((verdict) => (
            <article key={verdict.id} className="rounded-3xl border border-premium-border bg-white p-6 dark:border-premium-borderDark dark:bg-zinc-900">
              <h3 className="text-base font-bold">{verdict.title}</h3>
              <div className="mt-4">
                <VerdictStats scorecard={verdict.scorecard} />
              </div>
              {verdict.scorecard.feedback && <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{verdict.scorecard.feedback}</p>}
              {verdict.videoUrl && <video src={verdict.videoUrl} controls className="mt-5 aspect-video w-full rounded-2xl bg-black" />}
            </article>
          ))}
        </section>
      )}

      {popupOpen && verdicts[0] && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" aria-label="Dismiss verdict" className="absolute inset-0 bg-premium-charcoal/55 backdrop-blur-sm" onClick={() => setPopupOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reading-verdict-title"
            className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-premium-border bg-white p-6 shadow-2xl dark:border-premium-borderDark dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">Verdict</p>
                <h2 id="reading-verdict-title" className="mt-2 text-2xl font-extrabold tracking-tight">
                  {verdicts[0].title}
                </h2>
              </div>
              <button
                ref={closeVerdictRef}
                type="button"
                onClick={() => setPopupOpen(false)}
                className="rounded-full border border-premium-border p-2 text-zinc-500 transition hover:text-premium-charcoal dark:border-premium-borderDark dark:hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="mt-5">
              <VerdictStats scorecard={verdicts[0].scorecard} />
            </div>
            {verdicts[0].scorecard.feedback && <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{verdicts[0].scorecard.feedback}</p>}
            <button
              type="button"
              onClick={() => {
                setPopupOpen(false);
                historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mt-6 w-full rounded-xl bg-premium-charcoal px-4 py-2.5 text-sm font-bold text-premium-beige transition hover:bg-premium-accent dark:bg-zinc-100 dark:text-premium-charcoal"
            >
              View saved verdicts
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="status" className="rounded-2xl border border-rose-700/30 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}
