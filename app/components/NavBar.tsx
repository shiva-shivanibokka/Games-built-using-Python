"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAMES } from "../games";

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
      <nav className="max-w-5xl mx-auto px-4 flex items-center gap-1 h-14 overflow-x-auto">
        <Link href="/" className="font-semibold mr-3 shrink-0">
          🎮 Games
        </Link>
        {GAMES.map((g) => {
          const active = pathname === `/${g.slug}`;
          return (
            <Link
              key={g.slug}
              href={`/${g.slug}`}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                active
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:text-foreground hover:bg-border/50"
              }`}
            >
              {g.name}
              {g.status === "soon" && <span className="ml-1 text-xs opacity-60">soon</span>}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
