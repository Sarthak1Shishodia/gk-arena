import { Brain, Clock, Compass, Flame, Swords, Trophy, Video, WandSparkles, Zap, type LucideIcon } from "lucide-react";

export type ArenaMode = "daily" | "timeline" | "map" | "blitz" | "leaderboard" | "contest" | "vault";

export type NavItem = {
  href: string;
  label: string;
  mode: ArenaMode | null;
  icon: LucideIcon;
  activeClass: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Daily", mode: "daily", icon: Flame, activeClass: "bg-amber-500 text-slate-950" },
  { href: "/timeline", label: "Timeline", mode: "timeline", icon: Clock, activeClass: "bg-indigo-600 text-white" },
  { href: "/map", label: "Map", mode: "map", icon: Compass, activeClass: "bg-emerald-600 text-white" },
  { href: "/blitz", label: "Blitz", mode: "blitz", icon: Zap, activeClass: "bg-cyan-600 text-white" },
  { href: "/contest", label: "Compete", mode: "contest", icon: Swords, activeClass: "bg-rose-600 text-white" },
  { href: "/vault", label: "Vault", mode: "vault", icon: Brain, activeClass: "bg-violet-600 text-white" },
  { href: "/ranks", label: "Ranks", mode: "leaderboard", icon: Trophy, activeClass: "bg-slate-700 text-white" },
  { href: "/rooms", label: "Rooms", mode: null, icon: Video, activeClass: "bg-indigo-600 text-white" },
  { href: "/admin", label: "Admin", mode: null, icon: WandSparkles, activeClass: "bg-amber-400 text-slate-950" },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/rooms") return pathname === "/rooms" || pathname.startsWith("/rooms/");
  return pathname === href;
}
