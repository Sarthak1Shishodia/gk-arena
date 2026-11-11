"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPinPayload } from "@/types/game";
import { fetchMapTargets } from "@/lib/supabase/queries";
import { Compass, Navigation, RotateCcw, Trophy, Database } from "lucide-react";
import confetti from "canvas-confetti";
import type { MapPoint } from "@/features/map-game/InteractiveMap";

const InteractiveMap = dynamic(() => import("@/features/map-game/InteractiveMap"), { ssr: false });

const FALLBACK_TARGETS: MapPinPayload[] = [
  {
    prompt: "Drop a pin on the ancient Harappan port city of Lothal:",
    targetName: "Lothal (Gujarat)",
    lat: 22.52,
    lng: 72.25,
    region: "india",
    fact: "Located along the Bhogava river near the Gulf of Khambhat, Lothal had the world's earliest known artificial dockyard.",
  },
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function MapBoard() {
  const [targets, setTargets] = useState<MapPinPayload[]>(FALLBACK_TARGETS);
  const [isCloud, setIsCloud] = useState(false);
  const [idx, setIdx] = useState(0);
  const [pin, setPin] = useState<MapPoint | null>(null);
  const [guess, setGuess] = useState<MapPoint | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetchMapTargets().then((cloudTargets) => {
      if (cloudTargets.length > 0) {
        setTargets(cloudTargets);
        setIsCloud(true);
      }
    });
  }, []);

  const target = targets[idx];

  const submitCoordinates = () => {
    if (!pin || guess) return;
    const dist = getDistanceKm(pin.lat, pin.lng, target.lat, target.lng);
    const pts = Math.max(0, Math.round(1000 - dist * 0.75));

    setGuess(pin);
    setDistanceKm(dist);
    setTotalScore((score) => score + pts);
    if (dist <= 250) confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
  };

  const nextTarget = () => {
    if (idx + 1 >= targets.length) setFinished(true);
    else {
      setIdx((current) => current + 1);
      setPin(null);
      setGuess(null);
      setDistanceKm(null);
    }
  };

  if (finished) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white dark:bg-zinc-900 text-premium-charcoal dark:text-zinc-100 rounded-2xl border border-premium-border dark:border-premium-borderDark text-center shadow-sm">
        <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-1">Expedition Complete!</h2>
        <div className="text-4xl font-extrabold text-emerald-400 my-6">{totalScore} PTS</div>
        <button
          onClick={() => { setIdx(0); setPin(null); setGuess(null); setDistanceKm(null); setTotalScore(0); setFinished(false); }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" /> Replay Expedition
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-zinc-900 text-premium-charcoal dark:text-zinc-100 rounded-2xl border border-premium-border dark:border-premium-borderDark shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Map ({idx + 1}/{targets.length})
          </span>
          {isCloud && (
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center gap-1">
              <Database className="w-3 h-3" /> Cloud Live
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-amber-400">Score: {totalScore}</span>
      </div>

      <h2 className="text-lg font-semibold mb-4 text-premium-charcoal dark:text-zinc-100">{target.prompt}</h2>

      <div className="isolate h-[28rem] overflow-hidden rounded-xl border border-premium-border bg-white dark:border-premium-borderDark dark:bg-zinc-900">
        <InteractiveMap
          key={idx}
          locked={guess !== null}
          answer={guess ? { lat: target.lat, lng: target.lng, name: target.targetName } : null}
          onSelect={setPin}
        />
      </div>
      <button
        type="button"
        onClick={submitCoordinates}
        disabled={!pin || guess !== null}
        className="mt-4 w-full rounded-xl bg-premium-charcoal px-4 py-2.5 text-sm font-bold text-premium-beige transition hover:bg-premium-accent disabled:opacity-50 dark:bg-zinc-100 dark:text-premium-charcoal"
      >
        Submit Coordinates
      </button>

      {guess && distanceKm !== null && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-premium-border bg-premium-beige p-4 dark:border-premium-borderDark dark:bg-zinc-800">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <Navigation className="w-4 h-4" /> {target.targetName}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white dark:bg-zinc-900 text-premium-accent">
              Off by {distanceKm} km
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{target.fact}</p>
          <button onClick={nextTarget} className="self-end mt-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">
            {idx + 1 === targets.length ? "See Final Score" : "Next Location →"}
          </button>
        </div>
      )}
    </div>
  );
}
