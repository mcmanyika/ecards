"use client";

import { getFirebaseApp } from "@/lib/firebase/client";
import { getAnalytics, isSupported } from "firebase/analytics";
import { useEffect } from "react";

export function FirebaseAnalytics() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (!(await isSupported())) return;
        if (cancelled) return;
        const app = getFirebaseApp();
        if (!app) return;
        getAnalytics(app);
      } catch {
        /* optional */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
