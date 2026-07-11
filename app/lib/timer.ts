"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A simple stopwatch. Pages call restart() when a fresh board loads and
 *  stop() when it's solved; read `ms` to display elapsed time. */
export function useTimer() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const anchor = useRef(0); // Date.now() when the current running segment began
  const base = useRef(0); // accumulated ms from earlier segments

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setMs(base.current + (Date.now() - anchor.current)), 250);
    return () => clearInterval(id);
  }, [running]);

  const stop = useCallback(() => {
    setRunning((prev) => {
      if (prev) {
        base.current += Date.now() - anchor.current;
        setMs(base.current);
      }
      return false;
    });
  }, []);

  const restart = useCallback(() => {
    base.current = 0;
    anchor.current = Date.now();
    setMs(0);
    setRunning(true);
  }, []);

  return { ms, running, stop, restart };
}

export function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const bestKey = (slug: string, difficulty?: string) =>
  `best-${slug}${difficulty ? `-${difficulty}` : ""}`;

export function readBest(slug: string, difficulty?: string): number | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(bestKey(slug, difficulty));
  return v ? parseInt(v, 10) : null;
}

/** Save `ms` if it beats the stored best; returns the current best. */
export function saveBest(slug: string, ms: number, difficulty?: string): number {
  const cur = readBest(slug, difficulty);
  if (cur == null || ms < cur) {
    localStorage.setItem(bestKey(slug, difficulty), String(ms));
    return ms;
  }
  return cur;
}
