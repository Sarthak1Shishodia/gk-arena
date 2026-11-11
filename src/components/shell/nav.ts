import {
  AudioLines,
  BookOpen,
  Compass,
  Crosshair,
  Headphones,
  House,
  Map,
  Shield,
  Swords,
  Trophy,
  Users,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export type ShellLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "Command" | "Train" | "Explore" | "More";
};

export const SHELL_LINKS: ShellLink[] = [
  { href: "/", label: "Overview", icon: House, section: "Command" },
  { href: "/blitz", label: "Practice", icon: Crosshair, section: "Train" },
  { href: "/rooms", label: "Communication", icon: AudioLines, section: "Train" },
  { href: "/theory", label: "Theory", icon: BookOpen, section: "Train" },
  { href: "/map", label: "Map Room", icon: Map, section: "Explore" },
  { href: "/forum", label: "Community", icon: Users, section: "Explore" },
  { href: "/timeline", label: "Timeline", icon: Compass, section: "More" },
  { href: "/reading", label: "Reading", icon: BookOpen, section: "More" },
  { href: "/listening", label: "Listening", icon: Headphones, section: "More" },
  { href: "/contest", label: "Contest", icon: Swords, section: "More" },
  { href: "/vault", label: "Vault", icon: Shield, section: "More" },
  { href: "/ranks", label: "Ranks", icon: Trophy, section: "More" },
  { href: "/admin", label: "Admin", icon: WandSparkles, section: "More" },
];

export const SHELL_SECTIONS = ["Command", "Train", "Explore", "More"] as const;
