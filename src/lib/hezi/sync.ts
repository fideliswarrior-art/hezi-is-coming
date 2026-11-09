import { useEffect, useRef } from "react";
import { usePelada, type PeladaState } from "@/lib/pelada/store";
import { useHeziPlatform, type HeziPlatformState } from "@/lib/hezi/store";

function extractPeladaData(s: PeladaState) {
  return {
    players: s.players,
    teams: s.teams,
    queue: s.queue,
    waitingChampion: s.waitingChampion,
    court: s.court,
    nextTeamNumber: s.nextTeamNumber,
    adminPin: s.adminPin,
    screenLocked: s.screenLocked,
    lastModified: s.lastModified,
    gameFormat: s.gameFormat,
    matchMs: s.matchMs,
    suddenDeathMs: s.suddenDeathMs,
    championRuleEnabled: s.championRuleEnabled,
    winsToRotate: s.winsToRotate,
    autoReduceEnabled: s.autoReduceEnabled,
    autoReduceThreshold: s.autoReduceThreshold,
    autoReduceMs: s.autoReduceMs,
    teamNames: s.teamNames,
    teamStats: s.teamStats,
    actionLog: s.actionLog,
  };
}

function extractHeziData(s: HeziPlatformState) {
  return {
    lastModified: s.lastModified,
    users: s.users,
    evs: s.evs,
    notifications: s.notifications,
  };
}

export function useRealtimeSync() {
  const applyingRemoteRef = useRef(false);
  const lastPushedPeladaRef = useRef(0);
  const lastPushedHeziRef = useRef(0);

  useEffect(() => {
    async function pushToServer() {
      if (applyingRemoteRef.current) return;
      const peladaState = usePelada.getState();
      const heziState = useHeziPlatform.getState();

      const needPeladaPush = peladaState.lastModified > lastPushedPeladaRef.current;
      const needHeziPush = heziState.lastModified > lastPushedHeziRef.current;
      if (!needPeladaPush && !needHeziPush) return;

      try {
        lastPushedPeladaRef.current = peladaState.lastModified;
        lastPushedHeziRef.current = heziState.lastModified;
        await fetch("/api/hezi-sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pelada: extractPeladaData(peladaState),
            peladaUpdatedAt: peladaState.lastModified,
            hezi: extractHeziData(heziState),
            heziUpdatedAt: heziState.lastModified,
          }),
        });
      } catch {
        /* ignore network errors */
      }
    }

    async function pullFromServer() {
      try {
        const res = await fetch("/api/hezi-sync", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          pelada: Partial<PeladaState> | null;
          peladaUpdatedAt: number;
          hezi: Partial<HeziPlatformState> | null;
          heziUpdatedAt: number;
        };

        const localPelada = usePelada.getState();
        const localHezi = useHeziPlatform.getState();

        if (data.peladaUpdatedAt === 0 && Object.keys(localPelada.players).length > 0) {
          const ts = localPelada.lastModified || Date.now();
          lastPushedPeladaRef.current = ts;
          await fetch("/api/hezi-sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              pelada: { ...extractPeladaData(localPelada), lastModified: ts },
              peladaUpdatedAt: ts,
            }),
          });
        } else if (
          data.pelada &&
          data.peladaUpdatedAt > localPelada.lastModified
        ) {
          applyingRemoteRef.current = true;
          lastPushedPeladaRef.current = data.peladaUpdatedAt;
          usePelada.getState().hydrateFromRemote(data.pelada);
          applyingRemoteRef.current = false;
        }

        if (data.heziUpdatedAt === 0 && localHezi.lastModified > 0) {
          lastPushedHeziRef.current = localHezi.lastModified;
          await fetch("/api/hezi-sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              hezi: extractHeziData(localHezi),
              heziUpdatedAt: localHezi.lastModified,
            }),
          });
        } else if (data.hezi && data.heziUpdatedAt > localHezi.lastModified) {
          applyingRemoteRef.current = true;
          lastPushedHeziRef.current = data.heziUpdatedAt;
          useHeziPlatform.getState().hydrateFromRemote(data.hezi);
          applyingRemoteRef.current = false;
        }
      } catch {
        /* ignore network errors */
      }
    }

    const unsubPelada = usePelada.subscribe((state, prev) => {
      if (!applyingRemoteRef.current && state.lastModified !== prev.lastModified) {
        void pushToServer();
      }
    });

    const unsubHezi = useHeziPlatform.subscribe((state, prev) => {
      if (!applyingRemoteRef.current && state.lastModified !== prev.lastModified) {
        void pushToServer();
      }
    });

    function onStorage(e: StorageEvent) {
      if (e.key === "pelada-store-v1") {
        void usePelada.persist.rehydrate();
      } else if (e.key === "hezi-platform-store-v2") {
        void useHeziPlatform.persist.rehydrate();
      }
    }
    window.addEventListener("storage", onStorage);

    void pullFromServer();
    const interval = window.setInterval(() => {
      void pullFromServer();
    }, 1500);

    return () => {
      unsubPelada();
      unsubHezi();
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, []);
}
