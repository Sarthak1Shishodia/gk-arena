"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AcademyProvider, type AcademyProfile } from "@/components/shell/AcademyContext";
import Sidebar from "@/components/shell/Sidebar";
import TopBar from "@/components/shell/TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<AcademyProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const load = async (userId: string) => {
      const { data } = await client.from("profiles").select("username, contest_elo, practice_xp, current_streak").eq("id", userId).single();
      if (!data) return;
      setProfile({
        username: typeof data.username === "string" ? data.username : "",
        elo: typeof data.contest_elo === "number" ? data.contest_elo : 1200,
        xp: typeof data.practice_xp === "number" ? data.practice_xp : 0,
        streak: typeof data.current_streak === "number" ? data.current_streak : 0,
      });
    };

    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      if (session?.user) void load(session.user.id);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      if (session?.user) void load(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const toggleMenu = () => {
    if (window.innerWidth >= 1024) setDesktopOpen((open) => !open);
    else setMobileOpen((open) => !open);
  };

  return (
    <AcademyProvider value={{ user, profile, signOut }}>
      <div className="flex h-screen overflow-hidden bg-premium-beige text-premium-charcoal dark:bg-premium-gray dark:text-zinc-200">
        <aside className={`hidden shrink-0 border-r border-premium-border dark:border-premium-borderDark lg:block ${desktopOpen ? "w-[240px]" : "w-0 overflow-hidden border-r-0"}`}>
          <Sidebar onClose={() => setDesktopOpen(false)} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-premium-charcoal/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative h-full w-[240px] border-r border-premium-border dark:border-premium-borderDark">
              <Sidebar onNavigate={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenu={toggleMenu} />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AcademyProvider>
  );
}
