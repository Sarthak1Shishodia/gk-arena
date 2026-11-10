"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Trophy, LogOut, User as UserIcon } from "lucide-react";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [elo, setElo] = useState(1200);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!supabase) return;
    
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from("profiles").select("elo_rating").eq("id", userId).single();
    if (data) setElo(data.elo_rating);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) alert(error.message);
    else alert("Magic link sent! Check your email to log in.");
    setLoading(false);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg">
            GK
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-100 hidden sm:block">
            Arena
          </span>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-sm">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-slate-200">{elo} ELO</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Enter email to save progress..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              {loading ? "Sending..." : <><UserIcon className="w-4 h-4" /> Save</>}
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
