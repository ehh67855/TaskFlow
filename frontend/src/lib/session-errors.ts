// Thrown by server-side data fetchers (e.g. edit-profile/data.ts's getUserData) when the
// backend responds 401 - lets a caller like the authenticated layout tell "your session
// expired" apart from any other fetch failure via `instanceof`, so it can clear the stale
// cookie and redirect to log back in instead of crashing the page render.
export class SessionExpiredError extends Error {
  constructor(message = "Session expired") {
    super(message);
    this.name = "SessionExpiredError";
  }
}
