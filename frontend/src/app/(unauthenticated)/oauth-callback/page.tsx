"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthHeader } from "@/services/BackendService";

// The backend redirects here after a successful Google sign-in with the JWT in the URL
// fragment (never a query param) - fragments are never sent to any server, including this
// Next.js one, so the token only ever exists in the browser until we hand it to the same
// setAuthHeader server action the password-login flow already uses.
export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");

    if (!token) {
      setError(true);
      return;
    }

    (async () => {
      await setAuthHeader(token);
      router.replace("/home");
    })();
  }, [router]);

  if (error) {
    return (
      <div className="container mx-auto mt-10 max-w-md text-center space-y-2">
        <p className="text-destructive">Something went wrong signing you in with Google.</p>
        <a href="/login" className="underline text-sm text-muted-foreground">Back to login</a>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10 max-w-md text-center">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
