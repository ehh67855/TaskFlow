"use client";

import { useEffect, useRef, useState } from "react";
import { getAuthToken, getLogin } from "@/services/BackendService";
import { onBadgeCheck } from "@/lib/badge-events";

const SEEN_BADGES_KEY = "taskflow:seenUnlockedBadgeIds";

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

type Announcement = Badge & { key: number };

// Mounted once in the authenticated layout (not per-page) so it survives client-side
// navigation and can catch a badge unlock no matter which page the triggering action happened
// on. Badges themselves aren't persisted as "earned" server-side (see UserService -
// getUserProgress computes them fresh each time), so "newly unlocked" is determined here by
// diffing against the set of badge ids this browser has already been shown, kept in
// localStorage so a page refresh doesn't replay old celebrations.
export function BadgeUnlockNotification() {
  const [queue, setQueue] = useState<Announcement[]>([]);
  const loginRef = useRef<string | null>(null);
  const keyRef = useRef(0);

  useEffect(() => {
    const checkForNewBadges = async () => {
      try {
        if (!loginRef.current) {
          const authToken = await getAuthToken();
          loginRef.current = (await getLogin(authToken)) ?? null;
        }
        if (!loginRef.current) return;

        const res = await fetch(`http://localhost:8080/getUserProgress/${loginRef.current}`, { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();

        let seen: string[] = [];
        try {
          seen = JSON.parse(localStorage.getItem(SEEN_BADGES_KEY) || "[]");
        } catch {
          seen = [];
        }

        const unlocked: Badge[] = data.badges.filter((b: Badge) => b.unlocked);
        const newlyUnlocked = unlocked.filter((b) => !seen.includes(b.id));

        if (newlyUnlocked.length > 0) {
          setQueue((prev) => [...prev, ...newlyUnlocked.map((b) => ({ ...b, key: keyRef.current++ }))]);
        }

        localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify(unlocked.map((b) => b.id)));
      } catch (error) {
        console.error("Failed to check for new badges:", error);
      }
    };

    checkForNewBadges();
    return onBadgeCheck(checkForNewBadges);
  }, []);

  // Shows one announcement at a time (a queue rather than all-at-once) so unlocking several
  // badges in the same action doesn't pile them into an unreadable stack.
  useEffect(() => {
    if (queue.length === 0) return undefined;
    const timer = setTimeout(() => setQueue((prev) => prev.slice(1)), 5000);
    return () => clearTimeout(timer);
  }, [queue]);

  if (queue.length === 0) return null;
  const current = queue[0];

  return (
    <div className="fixed top-4 right-4 z-[10000] pointer-events-none">
      <div
        key={current.key}
        className="pointer-events-auto flex items-center gap-3 rounded-lg border border-amber-400/60 bg-card shadow-xl px-4 py-3 max-w-sm animate-in slide-in-from-top-4 fade-in duration-300"
      >
        <span className="text-3xl leading-none">{current.icon}</span>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Badge Unlocked!</p>
          <p className="font-semibold leading-tight">{current.name}</p>
          <p className="text-xs text-muted-foreground">{current.description}</p>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground text-lg leading-none"
          onClick={() => setQueue((prev) => prev.slice(1))}
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
