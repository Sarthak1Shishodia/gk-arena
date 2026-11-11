"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { isNavActive } from "@/components/nav-items";
import { displayName, initials, useAcademy } from "@/components/shell/AcademyContext";
import { SHELL_LINKS, SHELL_SECTIONS } from "@/components/shell/nav";

export default function Sidebar({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAcademy();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = displayName(profile, user?.email);
  const mark = initials(name);

  return (
    <div className="flex h-full flex-col bg-premium-beige text-premium-charcoal dark:bg-premium-gray dark:text-zinc-200">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-premium-border text-[11px] font-semibold tracking-wide dark:border-premium-borderDark">
            gk
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">GK Arena</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Officer Academy</span>
          </span>
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-md p-1 text-zinc-500 hover:text-premium-charcoal dark:hover:text-zinc-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav aria-label="Academy" className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {SHELL_SECTIONS.map((section) => (
          <div key={section}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">{section}</p>
            <div className="space-y-1">
              {SHELL_LINKS.filter((item) => item.section === section).map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? "bg-premium-border/70 font-medium text-premium-charcoal dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-premium-border p-3 dark:border-premium-borderDark">
        {user ? (
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex w-full items-center gap-3 rounded-2xl border border-premium-border bg-white px-3 py-2.5 text-left dark:border-premium-borderDark dark:bg-zinc-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-premium-beige text-xs font-semibold dark:bg-zinc-800">{mark}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">Cadet</span>
            </span>
            <span className="text-zinc-400">›</span>
          </button>
        ) : (
          <p className="px-2 py-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">Sign in from the top bar to keep your rating and streak.</p>
        )}
        {menuOpen && user && (
          <button
            type="button"
            onClick={() => void signOut()}
            className="absolute bottom-16 left-3 right-3 rounded-xl border border-premium-border bg-white px-3 py-2 text-left text-sm dark:border-premium-borderDark dark:bg-zinc-900"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
