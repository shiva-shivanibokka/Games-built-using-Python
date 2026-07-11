"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A simple stopwatch. Pages call restart() when a fresh board loads and
 *  stop() when it's solved; read `ms` to display elapsed time. */
export function useTimer() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const anchor = useRef(0); // Date.now() when the current running segment began
  const base = useRef(0); // accumulated ms from earlier segments
  const runningRef = useRef(false); // mirror of `running` for pure reads in callbacks

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setMs(base.current + (Date.now() - anchor.current)), 250);
    return () => clearInterval(id);
  }, [running]);

  // Side effects live in the callback body (runs once), NOT inside a state
  // updater — React double-invokes updaters under StrictMode, which would
  // otherwise double-count the elapsed time.
  const stop = useCallback(() => {
    if (!runningRef.current) return;
    base.current += Date.now() - anchor.current;
    runningRef.current = false;
    setMs(base.current);
    setRunning(false);
  }, []);

  const restart = useCallback(() => {
    base.current = 0;
    anchor.current = Date.now();
    runningRef.current = true;
    setMs(0);
    setRunning(true);
  }, []);

  return { ms, running, stop, restart };
}

export function formatMs(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const bestKey = (slug: string, difficulty?: string) =>
  `best-${slug}${difficulty ? `-${difficulty}` : ""}`;

export function readBest(slug: string, difficulty?: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(bestKey(slug, difficulty));
    if (v == null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null; // storage blocked (privacy mode) or malformed — degrade gracefully
  }
}

/** Save `ms` if it beats the stored best; returns the current best. */
export function saveBest(slug: string, ms: number, difficulty?: string): number {
  const cur = readBest(slug, difficulty);
  const best = cur == null || ms < cur ? ms : cur;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(bestKey(slug, difficulty), String(best));
    } catch {
      // storage blocked — best just isn't persisted this session
    }
  }
  return best;
}
