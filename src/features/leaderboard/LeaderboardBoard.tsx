"use client";

import React, { useEffect, useState } from "react";
import { getTopPlayers } from "@/lib/supabase/queries";
import { Trophy, Zap, Flame, Crown } from "lucide-react";

export default function LeaderboardBoard() {
  const [metric, setMetric] = useState<"contest_elo" | "practice_xp">("contest_elo");
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTopPlayers(metric).then((data) => {
      setPlayers(data);
      setLoading(false);
    });
  }, [metric]);

  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl gap-1">
          <button
            onClick={() => setMetric("contest_elo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${metric === "contest_elo" ? "bg-amber-500/20 text-amber-400" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Trophy className="w-3.5 h-3.5" /> Contest Rank
          </button>
          <button
            onClick={() => setMetric("practice_xp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${metric === "practice_xp" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Zap className="w-3.5 h-3.5" /> Practice Grinders
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center p-6 text-slate-400 font-semibold animate-pulse">Fetching Standings...</div>
        ) : players.length === 0 ? (
          <div className="text-center p-6 text-slate-400 border border-dashed border-slate-700 rounded-xl">No players ranked yet.</div>
        ) : (
          players.map((player, idx) => {
            const isRank1 = idx === 0;
            const isRank2 = idx === 1;
            const isRank3 = idx === 2;
            const score = metric === "contest_elo" ? player.contest_elo : player.practice_xp;
            const colorClass = metric === "contest_elo" ? "text-amber-400" : "text-emerald-400";

            return (
              <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isRank1 ? "bg-slate-800/80 border-slate-500 shadow-lg" : "bg-slate-900 border-slate-800"}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isRank1 ? "bg-amber-500 text-amber-950" : isRank2 ? "bg-slate-300 text-slate-900" : isRank3 ? "bg-orange-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                    {isRank1 ? <Crown className="w-4 h-4" /> : `#${idx + 1}`}
                  </div>
                  <div>
                    <p className={`font-bold ${isRank1 ? colorClass : "text-slate-200"}`}>{player.username || "Anonymous"}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Flame className="w-3 h-3 text-rose-400" /> {player.current_streak} Streak</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-lg ${isRank1 ? colorClass : "text-slate-100"}`}>{score}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{metric === "contest_elo" ? "ELO" : "XP"}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}