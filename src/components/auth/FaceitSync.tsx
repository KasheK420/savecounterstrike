"use client";

import { useEffect, useRef } from "react";
import { useSession } from "./SessionProvider";

const FACEIT_API = "https://open.faceit.com/data/v4";
// Client-side key — safe to expose, designed for browser use
const FACEIT_CLIENT_KEY = "cad428c2-dae3-415a-b9a0-296b79a79edd";

/**
 * Client-side component that fetches FACEIT stats from the user's browser
 * (bypasses Cloudflare bot protection that blocks server-side requests)
 * and sends them to our API.
 */
export function FaceitSync() {
  const { user } = useSession();
  const synced = useRef(false);

  useEffect(() => {
    if (!user?.steamId || !FACEIT_CLIENT_KEY || synced.current) return;
    synced.current = true;

    async function syncFaceit() {
      try {
        const res = await fetch(
          `${FACEIT_API}/players?game=cs2&game_player_id=${user!.steamId}`,
          {
            headers: {
              Authorization: `Bearer ${FACEIT_CLIENT_KEY}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        const cs2 = data?.games?.cs2;
        if (!cs2?.skill_level || !cs2?.faceit_elo) return;

        // Send to our API to persist
        await fetch("/api/user/faceit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            faceitLevel: cs2.skill_level,
            faceitElo: cs2.faceit_elo,
          }),
        });
      } catch {
        // Silent — FACEIT is best-effort
      }
    }

    syncFaceit();
  }, [user]);

  return null; // Invisible component
}
