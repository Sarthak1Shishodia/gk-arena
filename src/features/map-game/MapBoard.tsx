"use client";

import React, { useState } from "react";
import { MapPinPayload } from "@/types/game";
import { Compass, Navigation, RotateCcw, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

const MOCK_MAP_TARGETS: MapPinPayload[] = [
  {
    prompt: "Drop a pin on the ancient Harappan port city of Lothal:",
    targetName: "Lothal (Gujarat)",
    lat: 22.52,
    lng: 72.25,
    region: "india",
    fact: "Located along the Bhogava river near the Gulf of Khambhat, Lothal had the world's earliest known artificial dockyard.",
  },
  {
    prompt: "Locate the Nathu La Himalayan mountain pass:",
    targetName: "Nathu La (Sikkim)",
    lat: 27.38,
    lng: 88.83,
    region: "india",
    fact: "Situated at 4,310 m on the Dongkya Range, Nathu La connects Sikkim with China's Tibet Autonomous Region.",
  },
  {
    prompt: "Pinpoint the site of the Battle of Plassey (1757):",
    targetName: "Palashi / Plassey (West Bengal)",
    lat: 23.8,
    lng: 88.25,
    region: "india",
    fact: "Fought on the banks of the Bhagirathi-Hooghly River, where Robert Clive defeated Siraj-ud-Daulah.",
  },
  {
    prompt: "Locate Satish Dhawan Space Centre (ISRO's primary launchport):",
    targetName: "Sriharikota (Andhra Pradesh)",
    lat: 13.72,
    lng: 80.23,
    region: "india",
    fact: "A barrier island off the Bay of Bengal coast, chosen for its proximity to the equator for geostationary launches.",
  },
];

// Geographic bounds calibrated for the India SVG viewport (400x460)
const BOUNDS = { minLat: 6.5, maxLat: 37.5, minLng: 68.0, maxLng: 97.5 };

function latLngToXY(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 400;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 460;
  return { x, y };
}

function xyToLatLng(x: number, y: number) {
  const lng = BOUNDS.minLng + (x / 400) * (BOUNDS.maxLng - BOUNDS.minLng);
  const lat = BOUNDS.maxLat - (y / 460) * (BOUNDS.maxLat - BOUNDS.minLat);
  return { lat, lng };
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function MapBoard() {
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const target = MOCK_MAP_TARGETS[idx];

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (guess) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400;
    const y = ((e.clientY - rect.top) / rect.height) * 460;
    const clicked = xyToLatLng(x, y);
    const dist = getDistanceKm(clicked.lat, clicked.lng, target.lat, target.lng);
    const pts = Math.max(0, Math.round(1000 - dist * 0.75));

    setGuess(clicked);
    setDistanceKm(dist);
    setTotalScore((s) => s + pts);
    if (dist <= 250) confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
  };

  const nextTarget = () => {
    if (idx + 1 >= MOCK_MAP_TARGETS.length) setFinished(true);
    else {
      setIdx((i) => i + 1);
      setGuess(null);
      setDistanceKm(null);
    }
  };

  if (finished) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 text-center shadow-2xl">
        <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-1">Expedition Complete!</h2>
        <p className="text-slate-400 text-sm mb-6">Total Geo-Accuracy Score</p>
        <div className="text-4xl font-extrabold text-emerald-400 mb-6">{totalScore} / 4000</div>
        <button
          onClick={() => { setIdx(0); setGuess(null); setDistanceKm(null); setTotalScore(0); setFinished(false); }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" /> New Expedition
        </button>
      </div>
    );
  }

  const guessXY = guess ? latLngToXY(guess.lat, guess.lng) : null;
  const targetXY = latLngToXY(target.lat, target.lng);

  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" /> Map Pin-Drop ({idx + 1}/{MOCK_MAP_TARGETS.length})
        </span>
        <span className="text-sm font-bold text-amber-400">Score: {totalScore}</span>
      </div>

      <h2 className="text-lg font-semibold mb-4 text-slate-100">{target.prompt}</h2>

      <div className="relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden mb-4">
        <svg
          viewBox="0 0 400 460"
          onClick={handleMapClick}
          className={`w-full h-80 select-none ${guess ? "cursor-default" : "cursor-crosshair"}`}
        >
          {/* Coordinate Radar Grid */}
          {[80, 160, 240, 320, 400].map((v) => (
            <React.Fragment key={v}>
              <line x1={v} y1={0} x2={v} y2={460} stroke="#1e293b" strokeDasharray="3 3" />
              <line x1={0} y1={v} x2={400} y2={v} stroke="#1e293b" strokeDasharray="3 3" />
            </React.Fragment>
          ))}
          {/* Stylized India Subcontinent Polygon */}
          <polygon
            points="145,18 192,24 205,58 188,88 215,128 265,138 292,120 358,118 380,145 348,185 318,195 282,175 268,215 228,265 198,325 162,415 142,415 112,330 85,250 75,212 32,202 25,172 68,155 82,118 122,78"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="2.5"
          />

          {guessXY && (
            <>
              <line
                x1={guessXY.x} y1={guessXY.y} x2={targetXY.x} y2={targetXY.y}
                stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 4"
              />
              <circle cx={guessXY.x} cy={guessXY.y} r="6" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
              <circle cx={targetXY.x} cy={targetXY.y} r="7" fill="#10b981" stroke="#fff" strokeWidth="2" />
            </>
          )}
        </svg>
        {!guess && (
          <div className="absolute bottom-3 right-3 text-[11px] bg-slate-900/90 px-2.5 py-1 rounded border border-slate-700 text-slate-400">
            Click anywhere on the map to drop your pin
          </div>
        )}
      </div>

      {guess && distanceKm !== null && (
        <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <Navigation className="w-4 h-4" /> {target.targetName}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 text-amber-300">
              Off by {distanceKm} km
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{target.fact}</p>
          <button
            onClick={nextTarget}
            className="self-end mt-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition"
          >
            {idx + 1 === MOCK_MAP_TARGETS.length ? "See Final Score" : "Next Location →"}
          </button>
        </div>
      )}
    </div>
  );
}
