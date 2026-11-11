"use client";

import { createContext, useContext } from "react";

export type AcademyProfile = {
  username: string;
  elo: number;
  xp: number;
  streak: number;
};

type AcademyContextValue = {
  user: { id: string; email?: string } | null;
  profile: AcademyProfile | null;
  signOut: () => Promise<void>;
};

const AcademyContext = createContext<AcademyContextValue>({
  user: null,
  profile: null,
  signOut: async () => undefined,
});

export function AcademyProvider({
  value,
  children,
}: {
  value: AcademyContextValue;
  children: React.ReactNode;
}) {
  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy() {
  return useContext(AcademyContext);
}

export function displayName(profile: AcademyProfile | null, email?: string) {
  const source = profile?.username?.trim() || email?.split("@")[0] || "";
  return source || "Officer";
}

export function initials(name: string) {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "GK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
