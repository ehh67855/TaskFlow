"use client";
import { BACKEND_API_URL } from "@/config/site";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { getAuthToken, getLogin } from "@/services/BackendService";
import { onBadgeCheck } from "@/lib/badge-events";

// Self-contained (fetches its own data) so it can just be dropped into the sidebar and show
// up on every authenticated page, Duolingo-style, without every page having to know about it.
export function StreakIndicator() {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStreak = async () => {
      try {
        const authToken = await getAuthToken();
        const login = await getLogin(authToken);
        if (!login) return;

        const res = await fetch(`${BACKEND_API_URL}/getUserProgress/${login}`, { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStreak(data.currentStreak);
      } catch (error) {
        console.error("Failed to fetch streak:", error);
      }
    };

    fetchStreak();
    // Same event the badge-unlock watcher listens for - keeps the sidebar's streak number
    // live right after completing a routine, rather than only updating on the next full
    // navigation (the sidebar persists across client-side route changes, so it wouldn't
    // otherwise refetch on its own).
    const unsubscribe = onBadgeCheck(fetchStreak);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (streak === null) return null;

  return (
    <Link
      href="/achievements"
      className="flex items-center justify-center gap-1.5 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-1.5 text-sm font-medium hover:bg-sidebar-accent transition-colors"
    >
      <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground"}`} />
      <span>{streak} day{streak === 1 ? "" : "s"}</span>
    </Link>
  );
}
