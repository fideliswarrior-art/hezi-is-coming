import { useEffect, useRef } from "react";
import { create } from "zustand";
import { usePelada, type PeladaState } from "@/lib/pelada/store";
import { useHeziPlatform, type HeziPlatformState } from "@/lib/hezi/store";
import { usePartnerStore } from "@/features/partners/services/partnerService";
import { useTeamStore } from "@/features/teams/services/teamService";

export const useSyncStatus = create<{
  isOnline: boolean;
  syncError: boolean;
  setOnline: (v: boolean) => void;
  setSyncError: (v: boolean) => void;
}>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  syncError: false,
  setOnline: (isOnline) => set({ isOnline }),
  setSyncError: (syncError) => set({ syncError }),
}));

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
  const p = usePartnerStore.getState();
  const t = useTeamStore.getState();
  return {
    lastModified: s.lastModified,
    users: s.users,
    evs: s.evs,
    notifications: s.notifications,
    eventHistory: s.eventHistory,
    partnersModule: {
      partners: p.partners,
      circuits: p.circuits,
      subEvents: p.subEvents,
      registrations: p.registrations,
      matches: p.matches,
      playerStats: p.playerStats,
      hpLedger: p.hpLedger,
      badges: p.badges,
      trainingSlots: p.trainingSlots || [],
      trainingCheckins: p.trainingCheckins || [],
      ovrEvaluations: p.ovrEvaluations || [],
    },
    teamsModule: {
      teams: t.teams,
      rosterMembers: t.rosterMembers,
      teamRequests: t.teamRequests,
    },
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
        const res = await fetch("/api/hezi-sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pelada: extractPeladaData(peladaState),
            peladaUpdatedAt: peladaState.lastModified,
            hezi: extractHeziData(heziState),
            heziUpdatedAt: heziState.lastModified,
          }),
        });
        useSyncStatus.getState().setSyncError(!res.ok);
      } catch {
        useSyncStatus.getState().setSyncError(true);
      }
    }

    async function pullFromServer() {
      try {
        const res = await fetch("/api/hezi-sync", { cache: "no-store" });
        if (!res.ok) {
          useSyncStatus.getState().setSyncError(true);
          return;
        }
        useSyncStatus.getState().setSyncError(false);
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
          const remoteAny = data.hezi as Record<string, unknown>;
          if (remoteAny.partnersModule && typeof remoteAny.partnersModule === "object") {
            usePartnerStore.setState(remoteAny.partnersModule as Partial<ReturnType<typeof usePartnerStore.getState>>);
          }
          if (remoteAny.teamsModule && typeof remoteAny.teamsModule === "object") {
            useTeamStore.setState(remoteAny.teamsModule as Partial<ReturnType<typeof useTeamStore.getState>>);
          }
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

    const unsubPartners = usePartnerStore.subscribe(() => {
      if (!applyingRemoteRef.current) {
        useHeziPlatform.setState({ lastModified: Date.now() });
      }
    });

    const unsubTeams = useTeamStore.subscribe(() => {
      if (!applyingRemoteRef.current) {
        useHeziPlatform.setState({ lastModified: Date.now() });
      }
    });

    function onStorage(e: StorageEvent) {
      if (e.key === "pelada-store-v1") {
        void usePelada.persist.rehydrate();
      } else if (e.key === "hezi-platform-store-v6") {
        void useHeziPlatform.persist.rehydrate();
      } else if (e.key === "hezi-partners-v1") {
        void usePartnerStore.persist.rehydrate();
      } else if (e.key === "hezi-teams-v1") {
        void useTeamStore.persist.rehydrate();
      }
    }
    window.addEventListener("storage", onStorage);
    const onOnline = () => {
      useSyncStatus.getState().setOnline(true);
      void pullFromServer();
    };
    const onOffline = () => useSyncStatus.getState().setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    void pullFromServer();
    const interval = window.setInterval(() => {
      void pullFromServer();
    }, 1500);

    return () => {
      unsubPelada();
      unsubHezi();
      unsubPartners();
      unsubTeams();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(interval);
    };
  }, []);
}
