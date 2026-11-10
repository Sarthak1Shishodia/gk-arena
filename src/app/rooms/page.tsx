"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Shield, Users, Video } from "lucide-react";
import SoloStudio from "@/features/lecturette/SoloStudio";

export default function RoomsLobbyPage() {
  const router = useRouter();
  const [choice, setChoice] = useState<"choose" | "peer" | "solo">("choose");

  useEffect(() => {
    document.querySelectorAll("video, audio").forEach((node) => {
      const element = node as HTMLMediaElement;
      const stream = element.srcObject;
      if (!(stream instanceof MediaStream)) return;
      stream.getTracks().forEach((track) => track.stop());
      element.srcObject = null;
    });
  }, []);
  const [roomName, setRoomName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (event: React.FormEvent) => {
    event.preventDefault();
    const room = roomName.trim();
    const name = displayName.trim();
    if (!room || !name) {
      setError("Enter both a room name and a display name.");
      return;
    }
    if (room.includes("/") || room.includes("?")) {
      setError("Room names cannot include / or ?.");
      return;
    }
    router.push(`/rooms/${encodeURIComponent(room)}?name=${encodeURIComponent(name)}`);
  };

  if (choice === "solo") {
    return (
      <main className="relative min-h-full overflow-hidden bg-slate-950 px-4 py-10 text-white sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(120,83,9,0.2),_transparent_60%)]" />
        <div className="relative">
          <SoloStudio onBack={() => setChoice("choose")} />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-full overflow-hidden bg-slate-950 px-4 py-10 text-white sm:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.18),_transparent_60%)]" />

      {choice === "choose" ? (
        <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
          <header>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              <Video className="h-3.5 w-3.5" />
              Mock Interview
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Choose your board</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Sit a peer interview, or take a solo lecturette with the camera off until you speak.
            </p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setChoice("peer")}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-left shadow-2xl shadow-black/40 transition hover:border-cyan-400/50"
            >
              <Users className="mb-4 h-8 w-8 text-cyan-300" />
              <h2 className="text-xl font-extrabold">Join Peer Room</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">Share a room name and interview with another candidate on camera.</p>
            </button>
            <button
              type="button"
              onClick={() => setChoice("solo")}
              className="rounded-3xl border border-amber-500/20 bg-slate-900/80 p-6 text-left shadow-2xl shadow-black/40 transition hover:border-amber-400/60"
            >
              <Shield className="mb-4 h-8 w-8 text-amber-300" />
              <h2 className="text-xl font-extrabold">Practice Solo (AI GTO Assessor)</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">Draw an SSB topic, prepare for 3 minutes, then record your lecturette.</p>
            </button>
          </div>
        </div>
      ) : (
      <form onSubmit={handleJoin} className="relative mx-auto flex w-full max-w-lg flex-col gap-6">
        <header>
          <button
            type="button"
            onClick={() => setChoice("choose")}
            className="mb-4 text-sm font-semibold text-slate-400 transition hover:text-white"
          >
            ← All boards
          </button>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            <Video className="h-3.5 w-3.5" />
            Mock Interview
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Join a{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
              live room
            </span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
            Share a room name with your partner, then join with camera and microphone ready.
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-black/40 sm:p-6">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
            Room name
            <input
              value={roomName}
              onChange={(event) => {
                setRoomName(event.target.value);
                setError(null);
              }}
              placeholder="upsc-panel-1"
              autoComplete="off"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base font-medium text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
            Display name
            <input
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setError(null);
              }}
              placeholder="Sarthak"
              autoComplete="nickname"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base font-medium text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>

          {error && (
            <p role="status" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-violet-400 px-6 py-4 text-base font-extrabold text-slate-950 shadow-lg shadow-indigo-500/20 transition hover:brightness-110 active:scale-[0.99]"
          >
            <Mic className="h-5 w-5" />
            Join Room
          </button>
        </section>
      </form>
      )}
    </main>
  );
}
