"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Headphones, MessageCircle } from "lucide-react";
import DailyBoard from "@/features/daily-challenge/DailyBoard";
import TimelineBoard from "@/features/timeline-game/TimelineBoard";
import BlitzBoard from "@/features/blitz-game/BlitzBoard";
import MapBoard from "@/features/map-game/MapBoard";
import LeaderboardBoard from "@/features/leaderboard/LeaderboardBoard";
import ContestBoard from "@/features/contest/ContestBoard";
import VaultBoard from "@/features/vault/VaultBoard";
import TeleprompterBoard from "@/features/teleprompter/TeleprompterBoard";
import ListeningBoard from "@/features/listening/ListeningBoard";
import ForumBoard from "@/features/forum/ForumBoard";
import { NAV_ITEMS, type ArenaMode } from "@/components/nav-items";

export default function ArenaPage({ mode }: { mode: ArenaMode }) {
  const [activeMode, setActiveMode] = useState<"daily" | "timeline" | "map" | "blitz" | "leaderboard" | "contest" | "vault" | "read" | "listen" | "forum">(mode);
  const boards = NAV_ITEMS.filter((item) => item.mode);

  return (
    <main className="min-h-full px-4 py-10">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-premium-charcoal dark:text-zinc-100">
          GK Arena
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Master History, Geography & Science through daily rapid-fire challenges.</p>

        <div className="mt-6 inline-flex flex-wrap justify-center gap-1 rounded-xl border border-premium-border bg-white p-1.5 dark:border-premium-borderDark dark:bg-zinc-900">
          {boards.map((item) => {
            const Icon = item.icon;
            const active = item.mode === activeMode;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => item.mode && setActiveMode(item.mode)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active ? item.activeClass : "text-zinc-500 hover:text-premium-charcoal dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setActiveMode("read")}
            aria-current={activeMode === "read" ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeMode === "read"
                ? "bg-white text-premium-charcoal shadow dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-premium-charcoal dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Read
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("listen")}
            aria-current={activeMode === "listen" ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeMode === "listen"
                ? "bg-white text-premium-charcoal shadow dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-premium-charcoal dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Headphones className="h-4 w-4" />
            Listen
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("forum")}
            aria-current={activeMode === "forum" ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeMode === "forum"
                ? "bg-white text-premium-charcoal shadow dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-premium-charcoal dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Discuss
          </button>
        </div>
      </div>

      {activeMode === "daily" && <DailyBoard />}
      {activeMode === "timeline" && <TimelineBoard />}
      {activeMode === "map" && <MapBoard />}
      {activeMode === "blitz" && <BlitzBoard />}
      {activeMode === "leaderboard" && <LeaderboardBoard />}
      {activeMode === "contest" && <ContestBoard />}
      {activeMode === "vault" && <VaultBoard />}
      {activeMode === "read" && <TeleprompterBoard />}
      {activeMode === "listen" && <ListeningBoard />}
      {activeMode === "forum" && <ForumBoard />}
    </main>
  );
}
