import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { api } from "../api";

const INTERVAL_MS = 90 * 1000;

/**
 * Hält `last_seen_at` auf dem Server aktuell, solange die App läuft und ein Token da ist.
 */
export function usePresenceHeartbeat(token, enabled) {
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (!enabled || !token) {
      return undefined;
    }

    const ping = () => {
      const t = tokenRef.current;
      if (!t) {
        return;
      }
      api("/api/users/me/presence", { token: t, method: "POST", body: {} }).catch(
        () => {}
      );
    };

    ping();
    const interval = setInterval(ping, INTERVAL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        ping();
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [enabled, token]);
}
