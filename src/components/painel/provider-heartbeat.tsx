"use client";

import { useEffect } from "react";

const INTERVAL_MS = 2 * 60 * 1000; // ping every 2 minutes

export function ProviderHeartbeat() {
  useEffect(() => {
    function ping() {
      fetch("/api/provider/heartbeat", { method: "POST" }).catch(() => {});
    }
    ping(); // immediate on mount
    const id = setInterval(ping, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
