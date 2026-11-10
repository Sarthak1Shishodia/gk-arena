"use client";

import Link from "next/link";
import DailyBoard from "@/features/daily-challenge/DailyBoard";
import TimelineBoard from "@/features/timeline-game/TimelineBoard";
import BlitzBoard from "@/features/blitz-game/BlitzBoard";
import MapBoard from "@/features/map-game/MapBoard";
import LeaderboardBoard from "@/features/leaderboard/LeaderboardBoard";
import ContestBoard from "@/features/contest/ContestBoard";
import VaultBoard from "@/features/vault/VaultBoard";
import { NAV_ITEMS, type ArenaMode } from "@/components/nav-items";

export default function ArenaPage({ mode }: { mode: ArenaMode }) {
  const boards = NAV_ITEMS.filter((item) => item.mode);

  return (
    <main className="min-h-full bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h1 className="bg-gradient-to-r from-amber-400 via-indigo-400 to-emerald-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          GK Arena
        </h1>
        <p className="mt-1 text-sm text-slate-400">Master History, Geography & Science through daily rapid-fire challenges.</p>

        <div className="mt-6 inline-flex flex-wrap justify-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1.5">
          {boards.map((item) => {
            const Icon = item.icon;
            const active = item.mode === mode;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active ? item.activeClass : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {mode === "daily" && <DailyBoard />}
      {mode === "timeline" && <TimelineBoard />}
      {mode === "map" && <MapBoard />}
      {mode === "blitz" && <BlitzBoard />}
      {mode === "leaderboard" && <LeaderboardBoard />}
      {mode === "contest" && <ContestBoard />}
      {mode === "vault" && <VaultBoard />}
    </main>
  );
}
