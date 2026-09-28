"use client";

import { useEffect, useState } from "react";
import { getAuthToken, getLogin } from "@/services/BackendService";
import { formatApiUrl } from "@/lib/utils";
import { onFriendsChanged } from "@/lib/friend-events";

// Self-contained (fetches its own data) so it can sit next to the "Friends" sidebar link and
// show the incoming-request count without the sidebar itself knowing anything about friends -
// same pattern as StreakIndicator.
export function FriendRequestBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const authToken = await getAuthToken();
        const login = await getLogin(authToken);
        if (!login) return;

        const res = await fetch(formatApiUrl(`/friend-requests/incoming/${encodeURIComponent(login)}`), {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCount(Array.isArray(data) ? data.length : 0);
      } catch (error) {
        console.error("Failed to fetch pending friend requests:", error);
      }
    };

    fetchCount();
    const unsubscribe = onFriendsChanged(fetchCount);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!count) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
      {count}
    </span>
  );
}
