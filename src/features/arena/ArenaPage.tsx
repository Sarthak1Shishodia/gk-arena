"use client";

import DailyBoard from "@/features/daily-challenge/DailyBoard";
import TimelineBoard from "@/features/timeline-game/TimelineBoard";
import BlitzBoard from "@/features/blitz-game/BlitzBoard";
import MapBoard from "@/features/map-game/MapBoard";
import LeaderboardBoard from "@/features/leaderboard/LeaderboardBoard";
import ContestBoard from "@/features/contest/ContestBoard";
import VaultBoard from "@/features/vault/VaultBoard";
import type { ArenaMode } from "@/components/nav-items";

export default function ArenaPage({ mode }: { mode: ArenaMode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
      {mode === "daily" && <DailyBoard />}
      {mode === "timeline" && <TimelineBoard />}
      {mode === "map" && <MapBoard />}
      {mode === "blitz" && <BlitzBoard />}
      {mode === "leaderboard" && <LeaderboardBoard />}
      {mode === "contest" && <ContestBoard />}
      {mode === "vault" && <VaultBoard />}
    </div>
  );
}
