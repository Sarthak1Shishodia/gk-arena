"use client";

import React, { useState } from "react";
import TimelineBoard from "@/features/timeline-game/TimelineBoard";
import BlitzBoard from "@/features/blitz-game/BlitzBoard";
import MapBoard from "@/features/map-game/MapBoard";
import { Clock, Zap, Compass } from "lucide-react";

export default function HomePage() {
  const [activeMode, setActiveMode] = useState<"timeline" | "blitz" | "map">("timeline");

  return (
    <main className="min-h-screen bg-slate-950 text-white py-10 px-4">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          GK Arena
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Master History, Geography & Science through daily rapid-fire challenges.
        </p>

        <div className="inline-flex flex-wrap justify-center p-1 mt-6 bg-slate-900 border border-slate-800 rounded-xl gap-1">
          <button
            onClick={() => setActiveMode("timeline")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeMode === "timeline"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" /> History Timeline
          </button>
          <button
            onClick={() => setActiveMode("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeMode === "map"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-4 h-4" /> Geo/History Map
          </button>
          <button
            onClick={() => setActiveMode("blitz")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeMode === "blitz"
                ? "bg-cyan-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4" /> Science & GK Blitz
          </button>
        </div>
      </div>

      {activeMode === "timeline" && <TimelineBoard />}
      {activeMode === "map" && <MapBoard />}
      {activeMode === "blitz" && <BlitzBoard />}
    </main>
  );
}
