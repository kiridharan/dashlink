"use client";

import { type ReactNode, useEffect, useState } from "react";

/**
 * Wraps the app to handle Zustand `persist` hydration.
 * Renders a blank page until localStorage has been read so that
 * server-rendered HTML never shows stale "logged-out" state.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    // Prevent flash of unauthenticated content
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      </div>
    );
  }

  return <>{children}</>;
}
