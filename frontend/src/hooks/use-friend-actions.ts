"use client";

import { useCallback, useState } from "react";
import { getAuthToken } from "@/services/BackendService";
import { formatApiUrl } from "@/lib/utils";
import { notifyFriendsChanged } from "@/lib/friend-events";
import { useToast } from "@/hooks/use-toast";

// Shared by the Friends page and individual profile pages - both need to send/accept/decline/
// cancel a friend request or remove a friend, hit the same endpoints, and want the same
// "disable this row's button while its request is in flight" behavior.
export function useFriendActions(viewerLogin: string | null, onChanged: () => void | Promise<void>) {
  const { toast } = useToast();
  const [busyIds, setBusyIds] = useState<Set<string | number>>(new Set());

  const authedFetch = useCallback(async (path: string, init?: RequestInit) => {
    const token = await getAuthToken();
    return fetch(formatApiUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  }, []);

  const withBusy = useCallback(async (id: string | number, action: () => Promise<boolean>) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      const succeeded = await action();
      if (succeeded) {
        await onChanged();
        notifyFriendsChanged();
      }
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [onChanged]);

  const sendRequest = (receiverLogin: string) => withBusy(receiverLogin, async () => {
    if (!viewerLogin) return false;
    const res = await authedFetch("/friend-requests", {
      method: "POST",
      body: JSON.stringify({ senderLogin: viewerLogin, receiverLogin }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast({ variant: "destructive", title: "Couldn't send request", description: err?.message ?? "Please try again." });
    }
    return res.ok;
  });

  const acceptRequest = (id: number) => withBusy(id, async () => {
    if (!viewerLogin) return false;
    const res = await authedFetch(`/friend-requests/${id}/accept`, { method: "POST", body: JSON.stringify({ login: viewerLogin }) });
    if (!res.ok) toast({ variant: "destructive", title: "Couldn't accept request" });
    return res.ok;
  });

  const declineRequest = (id: number) => withBusy(id, async () => {
    if (!viewerLogin) return false;
    const res = await authedFetch(`/friend-requests/${id}/decline`, { method: "POST", body: JSON.stringify({ login: viewerLogin }) });
    if (!res.ok) toast({ variant: "destructive", title: "Couldn't decline request" });
    return res.ok;
  });

  const cancelRequest = (id: number) => withBusy(id, async () => {
    if (!viewerLogin) return false;
    const res = await authedFetch(`/friend-requests/${id}/cancel`, { method: "POST", body: JSON.stringify({ login: viewerLogin }) });
    if (!res.ok) toast({ variant: "destructive", title: "Couldn't cancel request" });
    return res.ok;
  });

  const removeFriend = (friendLogin: string) => withBusy(friendLogin, async () => {
    if (!viewerLogin) return false;
    const res = await authedFetch("/remove-friend", { method: "POST", body: JSON.stringify({ login: viewerLogin, friendLogin }) });
    if (!res.ok) toast({ variant: "destructive", title: "Couldn't remove friend" });
    return res.ok;
  });

  return { authedFetch, busyIds, sendRequest, acceptRequest, declineRequest, cancelRequest, removeFriend };
}
