"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "@/components/nav-items";

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Pages" className="flex gap-1 overflow-x-auto pb-3">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              active ? item.activeClass : "text-zinc-500 hover:text-premium-charcoal dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
