import { BookOpen, BookText, Brain, Clock, Compass, Flame, Headphones, MessageCircle, Swords, Trophy, Video, WandSparkles, Zap, type LucideIcon } from "lucide-react";

export type ArenaMode = "daily" | "timeline" | "map" | "blitz" | "leaderboard" | "contest" | "vault";

export type NavItem = {
  href: string;
  label: string;
  mode: ArenaMode | null;
  icon: LucideIcon;
  activeClass: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Daily", mode: "daily", icon: Flame, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/timeline", label: "Timeline", mode: "timeline", icon: Clock, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/map", label: "Map", mode: "map", icon: Compass, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/blitz", label: "Blitz", mode: "blitz", icon: Zap, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/contest", label: "Compete", mode: "contest", icon: Swords, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/vault", label: "Vault", mode: "vault", icon: Brain, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/ranks", label: "Ranks", mode: "leaderboard", icon: Trophy, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/theory", label: "Learn", mode: null, icon: BookText, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/reading", label: "Reading", mode: null, icon: BookOpen, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/listening", label: "Listen", mode: null, icon: Headphones, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/forum", label: "Discuss", mode: null, icon: MessageCircle, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/rooms", label: "Rooms", mode: null, icon: Video, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
  { href: "/admin", label: "Admin", mode: null, icon: WandSparkles, activeClass: "bg-premium-charcoal text-premium-beige dark:bg-zinc-100 dark:text-premium-charcoal" },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/rooms") return pathname === "/rooms" || pathname.startsWith("/rooms/");
  return pathname === href;
}
