"use client"
import { BACKEND_API_URL } from "@/config/site";

import React, { useEffect, useState } from 'react';
import { getAuthToken, getLogin } from "@/services/BackendService";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy } from "lucide-react";

export default function Achievements() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const authToken = await getAuthToken();
        const login = await getLogin(authToken);
        const res = await fetch(`${BACKEND_API_URL}/getUserProgress/${login}`, { method: "GET" });
        if (!res.ok) throw new Error("Failed to load your progress");
        setProgress(await res.json());
      } catch (error) {
        console.error("Failed to fetch user progress:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return <h1 className="text-2xl font-bold text-center mt-10">Loading...</h1>;
  }

  if (!progress) {
    return <p className="text-center mt-10 text-muted-foreground">Couldn&apos;t load your achievements. Please try again.</p>;
  }

  const unlockedCount = progress.badges.filter(b => b.unlocked).length;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-7 h-7" />
        <h1 className="text-3xl font-bold">Achievements</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        {unlockedCount} of {progress.badges.length} badges earned.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Flame className={`w-10 h-10 ${progress.currentStreak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">{progress.currentStreak} day{progress.currentStreak === 1 ? "" : "s"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Trophy className="w-10 h-10 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Longest Streak</p>
              <p className="text-2xl font-bold">{progress.longestStreak} day{progress.longestStreak === 1 ? "" : "s"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {progress.badges.map((badge) => (
          <Card
            key={badge.id}
            className={`transition-opacity ${badge.unlocked ? "border-amber-400/60 shadow-md" : "opacity-60"}`}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{badge.icon}</span>
                <div>
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </div>
              <Progress value={(badge.current / badge.target) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {badge.unlocked ? "Unlocked" : `${badge.current} / ${badge.target}`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
