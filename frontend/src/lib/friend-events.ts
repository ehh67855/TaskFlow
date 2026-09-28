// Same pattern as badge-events.ts: a tiny window-level event bus so sending/accepting/declining/
// removing a friend can tell the sidebar's pending-request badge (and any other mounted Friends
// UI) to refetch, without prop-drilling a callback between components that don't otherwise know
// about each other.
const FRIENDS_CHANGED_EVENT = "taskflow:friends-changed";

export function notifyFriendsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FRIENDS_CHANGED_EVENT));
  }
}

export function onFriendsChanged(callback: () => void) {
  window.addEventListener(FRIENDS_CHANGED_EVENT, callback);
  return () => window.removeEventListener(FRIENDS_CHANGED_EVENT, callback);
}
