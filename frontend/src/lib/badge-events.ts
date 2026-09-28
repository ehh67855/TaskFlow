// A tiny window-level event bus so any part of the app can say "something just happened that
// might have unlocked a badge" (finishing a routine, creating/publishing/cloning a network)
// without needing to know who's listening - the notification watcher is mounted once in the
// authenticated layout, far from most of these call sites, and prop-drilling a callback that
// deep would be far messier than a single well-named event.
const BADGE_CHECK_EVENT = "taskflow:check-badges";

export function notifyBadgeCheck() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BADGE_CHECK_EVENT));
  }
}

export function onBadgeCheck(callback: () => void) {
  window.addEventListener(BADGE_CHECK_EVENT, callback);
  return () => window.removeEventListener(BADGE_CHECK_EVENT, callback);
}
