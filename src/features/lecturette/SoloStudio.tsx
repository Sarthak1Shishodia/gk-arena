"use client";

import React, { useEffect, useRef, useState } from "react";
import { Award, Loader2, Mic, Shield, SkipForward, Square, Target, Timer } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { evaluateLecturette, type LecturetteAssessment } from "@/app/rooms/soloActions";

const TOPICS = [
  "Indo-China Relations",
  "Women in Armed Forces",
  "Artificial Intelligence",
  "Agnipath Scheme",
  "India's Neighbourhood First Policy",
  "Climate Change and National Security",
  "Social Media and Youth",
  "Atmanirbhar Bharat in Defence",
  "United Nations and World Peace",
  "Disaster Management in India",
];

const PREP_SECONDS = 180;
const SPEAK_SECONDS = 180;

type Phase = "LOBBY" | "PREP" | "RECORDING" | "ANALYSIS_COMPLETE";

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function pickMimeType() {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export default function SoloStudio({ onBack }: { onBack?: () => void }) {
  const [phase, setPhase] = useState<Phase>("LOBBY");
  const [topic, setTopic] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(PREP_SECONDS);
  const [processing, setProcessing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<LecturetteAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const phaseRef = useRef<Phase>("LOBBY");
  const topicRef = useRef("");
  const processingRef = useRef(false);
  const startingRef = useRef(false);
  const autoStartedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    phaseRef.current = phase;
    topicRef.current = topic;
  }, [phase, topic]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      stopStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  useEffect(() => {
    if (phase !== "PREP" && phase !== "RECORDING") return;
    if (processing || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, processing, secondsLeft]);

  const releaseCamera = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const finishRecording = () => {
    if (processingRef.current || phaseRef.current !== "RECORDING") return;
    processingRef.current = true;
    setProcessing(true);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    releaseCamera();
    if (mountedRef.current) setProcessing(false);
  };

  const beginRecording = async () => {
    if (startingRef.current || phaseRef.current === "RECORDING") return;
    startingRef.current = true;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!mountedRef.current) {
        stopStream(stream);
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        releaseCamera();
        recorderRef.current = null;
        void publishRecording(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setSecondsLeft(SPEAK_SECONDS);
      setPhase("RECORDING");
    } catch (reason) {
      releaseCamera();
      const message = reason instanceof Error ? reason.message : "Camera and microphone access was blocked.";
      setError(message);
    } finally {
      startingRef.current = false;
    }
  };

  const publishRecording = async (blob: Blob) => {
    if (!supabase) {
      processingRef.current = false;
      setProcessing(false);
      setError("Supabase is not configured.");
      return;
    }
    try {
      const fileName = `lecturette-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from("videos").upload(fileName, blob, {
        contentType: "video/webm",
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from("videos").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      const result = await evaluateLecturette(topicRef.current, publicUrl);
      if (!mountedRef.current) return;
      setVideoUrl(publicUrl);
      setAssessment(result);
      setPhase("ANALYSIS_COMPLETE");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The GTO assessment failed.";
      if (mountedRef.current) setError(message);
    } finally {
      processingRef.current = false;
      if (mountedRef.current) setProcessing(false);
    }
  };

  useEffect(() => {
    if (secondsLeft !== 0 || processing) return;
    if (phase === "PREP") {
      if (autoStartedRef.current) return;
      autoStartedRef.current = true;
      void beginRecording();
    }
    if (phase === "RECORDING") finishRecording();
  }, [phase, processing, secondsLeft]);

  const generateTopic = () => {
    const next = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setTopic(next);
    setSecondsLeft(PREP_SECONDS);
    setProcessing(false);
    setVideoUrl(null);
    setAssessment(null);
    processingRef.current = false;
    setError(null);
    autoStartedRef.current = false;
    setPhase("PREP");
  };

  const clockUrgent = secondsLeft <= 30;

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-premium-border dark:border-premium-borderDark px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-premium-accent">
            <Shield className="h-3.5 w-3.5" />
            SSB Lecturette
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Solo AI{" "}
            <span className="text-premium-accent">GTO assessor</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Three minutes to prepare. Three minutes to speak. The camera stays off until you start.
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-xl border border-premium-border dark:border-premium-borderDark px-3 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 transition hover:border-premium-accent hover:text-premium-charcoal dark:hover:text-zinc-100"
          >
            Back
          </button>
        )}
      </header>

      {phase === "LOBBY" && (
        <section className="rounded-3xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 p-6 shadow-sm sm:p-8">
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Draw one lecturette card. Use the prep clock to structure your opening, arguments, and close.
          </p>
          <button
            type="button"
            onClick={generateTopic}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-premium-charcoal px-6 py-4 text-base font-extrabold text-premium-beige transition hover:bg-premium-accent dark:bg-zinc-100 dark:text-premium-charcoal sm:w-auto"
          >
            <Shield className="h-5 w-5" />
            Generate Topic
          </button>
        </section>
      )}

      {phase === "PREP" && (
        <section className="rounded-3xl border border-amber-500/20 bg-white dark:bg-zinc-900 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">Your topic</p>
          <h2 className="mt-2 text-2xl font-extrabold text-premium-charcoal dark:text-zinc-100 sm:text-3xl">{topic}</h2>
          <div className={`mt-6 flex items-center gap-3 text-5xl font-black tabular-nums ${clockUrgent ? "text-rose-400" : "text-premium-accent"}`}>
            <Timer className="h-8 w-8" />
            {formatClock(secondsLeft)}
          </div>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Camera and microphone are off. Speaking starts when this clock ends.</p>
          <button
            type="button"
            onClick={() => void beginRecording()}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-800 dark:text-emerald-200 transition hover:bg-emerald-500/20"
          >
            <SkipForward className="h-4 w-4" />
            Skip Prep & Start Speaking
          </button>
        </section>
      )}

      {phase === "RECORDING" && (
        <section className="overflow-hidden rounded-3xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-premium-border dark:border-premium-borderDark px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Speaking</p>
              <h2 className="text-lg font-bold text-premium-charcoal dark:text-zinc-100">{topic}</h2>
            </div>
            {!processing && (
              <span className={`flex items-center gap-2 text-2xl font-black tabular-nums ${clockUrgent ? "text-rose-400" : "text-emerald-700 dark:text-emerald-300"}`}>
                <Mic className="h-5 w-5" />
                {formatClock(secondsLeft)}
              </span>
            )}
          </div>

          <div className="relative aspect-video bg-black">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            {processing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 dark:bg-zinc-900/80 px-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-premium-accent" />
                <p className="text-lg font-bold">Processing Video...</p>
                <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">The camera and microphone are off while the GTO reviews the recording.</p>
              </div>
            )}
          </div>

          {!processing && (
            <div className="flex justify-end px-5 py-4">
              <button
                type="button"
                onClick={finishRecording}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600"
              >
                <Square className="h-4 w-4" />
                Finish Early
              </button>
            </div>
          )}
        </section>
      )}

      {phase === "ANALYSIS_COMPLETE" && assessment && (
        <section className="rounded-3xl border border-amber-500/20 bg-white dark:bg-zinc-900 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">GTO board</p>
              <h2 className="mt-2 text-2xl font-extrabold text-premium-charcoal dark:text-zinc-100">{topic}</h2>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">Score</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-4xl font-black text-premium-accent">
                <Award className="h-7 w-7" />
                {assessment.ai_score}
                <span className="text-lg font-bold text-premium-accent/80">/ 10</span>
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <article className="rounded-2xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 p-4">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Speaking fluency</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{assessment.fluency_feedback}</p>
            </article>
            <article className="rounded-2xl border border-premium-border dark:border-premium-borderDark bg-white dark:bg-zinc-900 p-4">
              <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Content structure</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{assessment.structure_feedback}</p>
            </article>
            <article className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-premium-accent">
                <Target className="h-4 w-4" />
                Actionable cures
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-premium-charcoal dark:text-zinc-200">{assessment.actionable_cures}</p>
            </article>
          </div>

          {videoUrl && (
            <video src={videoUrl} controls className="mt-6 aspect-video w-full rounded-2xl bg-black" />
          )}

          <button
            type="button"
            onClick={generateTopic}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-premium-charcoal px-5 py-3 text-sm font-extrabold text-premium-beige transition hover:bg-premium-accent dark:bg-zinc-100 dark:text-premium-charcoal"
          >
            <Shield className="h-4 w-4" />
            Draw another topic
          </button>
        </section>
      )}

      {error && (
        <p role="status" className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}
