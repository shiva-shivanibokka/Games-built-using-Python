"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GAMES, gradientOf } from "../games";

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur-xl">
      <nav className="max-w-5xl mx-auto px-4 flex items-center gap-1.5 h-16 overflow-x-auto">
        <Link href="/" className="font-display font-extrabold text-lg mr-3 shrink-0">
          🎲 Playbox
        </Link>
        {GAMES.map((g) => {
          const active = pathname === `/${g.slug}`;
          return (
            <Link
              key={g.slug}
              href={`/${g.slug}`}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-transform hover:scale-105 ${
                active ? "text-white shadow-lg" : "text-muted hover:text-foreground"
              }`}
              style={active ? { backgroundImage: gradientOf(g) } : undefined}
            >
              <span className="mr-1">{g.emoji}</span>
              {g.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
