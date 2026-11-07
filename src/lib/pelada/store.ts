import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type ID = string;

export interface Player {
  id: ID;
  name: string;
  justPlayed: boolean; // 🚫 cooldown — set on match end for losers, cleared next match
  createdAt: number;
  role?: "aluno" | "convencional";
  userId?: string;
  position?: string;
}

export interface Team {
  id: ID;
  number: number; // sequential display number (Time 1, 2, 3, …), never reused
  memberIds: ID[];
  wins: number; // consecutive wins in the current stint on court
  createdAt: number;
}

/** An entry in the waiting queue: either a lone player or a formed team. */
export type QueueEntry = { kind: "player"; id: ID } | { kind: "team"; id: ID };

export interface CourtState {
  teamAId: ID | null;
  teamBId: ID | null;
  /** ms elapsed since timer start (persisted while paused) */
  elapsedMs: number;
  /** timestamp of the last resume; null if paused */
  runningSince: number | null;
  suddenDeathUsed: boolean;
  /** if true, we are in sudden-death (1 min) mode */
  inSuddenDeath: boolean;
}

export interface TeamStat {
  teamId: ID;
  number: number;
  customName?: string;
  memberSnapshot: string[]; // names captured at match time
  wins: number;
  losses: number;
  draws: number;
}

export interface ActionLogEntry {
  ts: number;
  msg: string;
}

export interface PeladaState {
  players: Record<ID, Player>;
  teams: Record<ID, Team>;
  queue: QueueEntry[];
  waitingChampion: ID | null; // teamId of the 👑 waiting
  court: CourtState;
  nextTeamNumber: number;
  adminPin: string; // "" = no pin set
  screenLocked: boolean;
  lastModified: number;

  // Settings
  matchMs: number;
  suddenDeathMs: number;
  /** When false, a team never leaves the court for winning twice (👑 rule off). */
  championRuleEnabled: boolean;
  /** How many consecutive wins send a team off court as champion. */
  winsToRotate: number;
  /** Passive rule: shorten matches when many players are around. */
  autoReduceEnabled: boolean;
  autoReduceThreshold: number;
  autoReduceMs: number;

  // Stats & history
  teamNames: Record<ID, string>; // optional custom names, keyed by team id
  teamStats: Record<ID, TeamStat>;
  actionLog: ActionLogEntry[];

  // ephemeral (not persisted meaningfully but fine)
  selection: ID[]; // selected player ids for team-forming / substitution

  // ---- actions ----
  addPlayer: (
    name: string,
    meta?: { role?: "aluno" | "convencional"; userId?: string; position?: string },
  ) => void;
  renamePlayer: (id: ID, name: string) => void;
  removePlayer: (id: ID) => void;
  reorderQueue: (fromIdx: number, toIdx: number) => void;
  /** Move a queue entry one slot up (-1) or down (+1). */
  moveQueueEntry: (entry: QueueEntry, dir: -1 | 1) => void;
  /** Move whatever entry holds the current selection up/down in the queue. */
  moveSelectionInQueue: (dir: -1 | 1) => void;
  movePlayerToTeam: (playerId: ID, teamId: ID) => void;
  /** Put a lone player directly on an empty court side (creates a team). */
  sendPlayerToCourtSide: (playerId: ID, side: "A" | "B") => void;
  detachPlayerToQueue: (playerId: ID, toIndex?: number) => void;

  lockScreen: () => void;
  unlockScreen: (pin: string) => boolean;
  toggleSelect: (id: ID) => void;
  clearSelection: () => void;
  formTeamFromSelection: () => void;
  /** Move currently-selected players into a target team (queue team or court team). */
  pasteSelectionIntoTeam: (teamId: ID) => void;
  /** Send a queue entry to court in the first empty slot. */
  sendToCourt: (entry: QueueEntry, opts?: { forceCooldown?: boolean }) => void;
  /** Send a queue entry to a specific court side. */
  sendToCourtSide: (
    entry: QueueEntry,
    side: "A" | "B",
    opts?: { forceCooldown?: boolean },
  ) => void;
  /** Remove any queue entry (player or team) */
  removeFromQueue: (entry: QueueEntry) => void;
  /** Remove the entire team on a court side (team + its player records). */
  removeCourtTeam: (side: "A" | "B", opts?: { deletePlayers?: boolean }) => void;
  /** Swap the positions of two players (works across teams, court, and queue). */
  swapPlayers: (playerAId: ID, playerBId: ID) => void;
  /** Set a custom display name for a team (kept alongside sequential number). */
  renameTeam: (teamId: ID, name: string) => void;

  // Timer
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  useSuddenDeath: () => void;
  adminResetSuddenDeath: () => void;

  // Match resolution
  declareWinner: (teamSide: "A" | "B") => void;
  declareDraw: () => void;

  // Admin
  setAdminPin: (pin: string) => void;
  setMatchDuration: (ms: number) => void;
  setSuddenDeathDuration: (ms: number) => void;
  setChampionRule: (enabled: boolean) => void;
  setWinsToRotate: (wins: number) => void;

  setAutoReduce: (cfg: { enabled?: boolean; threshold?: number; ms?: number }) => void;

  clearActionLog: () => void;
  clearStats: () => void;
  resetNight: () => void;
  clearQueueOnly: () => void;
  hydrateFromRemote: (remote: Partial<PeladaState>) => void;
}

// ============================================================================
// Constants
// ============================================================================

export const MATCH_MS = 7 * 60 * 1000;
export const SUDDEN_DEATH_MS = 1 * 60 * 1000;
export const TEAM_SIZE = 3;
export const WINS_TO_ROTATE = 2;

// ============================================================================
// Helpers
// ============================================================================

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Deep-clone ONLY the data slices of state (never the action functions). */
function cloneState(s: PeladaState): PeladaState {
  const teams: Record<ID, Team> = {};
  for (const [k, v] of Object.entries(s.teams)) {
    teams[k] = { ...v, memberIds: [...v.memberIds] };
  }
  const players: Record<ID, Player> = {};
  for (const [k, v] of Object.entries(s.players)) {
    players[k] = { ...v };
  }
  return {
    ...s,
    players,
    teams,
    queue: s.queue.map((e) => ({ ...e })),
    court: { ...s.court },
    selection: [...s.selection],
    lastModified: Date.now(),
  };
}

function entryMembers(state: PeladaState, e: QueueEntry): ID[] {
  return e.kind === "player" ? [e.id] : state.teams[e.id]?.memberIds ?? [];
}

function removePlayerFromAll(state: PeladaState, playerId: ID) {
  // Queue
  const newQueue: QueueEntry[] = [];
  for (const e of state.queue) {
    if (e.kind === "player") {
      if (e.id !== playerId) newQueue.push(e);
    } else {
      const t = state.teams[e.id];
      if (!t) continue;
      if (!t.memberIds.includes(playerId)) {
        newQueue.push(e);
        continue;
      }
      const remaining = t.memberIds.filter((m) => m !== playerId);
      if (remaining.length >= 2) {
        state.teams[e.id] = { ...t, memberIds: remaining };
        newQueue.push(e);
      } else if (remaining.length === 1) {
        delete state.teams[e.id];
        newQueue.push({ kind: "player", id: remaining[0] });
      } else {
        delete state.teams[e.id];
      }
    }
  }
  state.queue = newQueue;

  // Court teams
  for (const side of ["teamAId", "teamBId"] as const) {
    const tid = state.court[side];
    if (!tid) continue;
    const t = state.teams[tid];
    if (!t || !t.memberIds.includes(playerId)) continue;
    const remaining = t.memberIds.filter((m) => m !== playerId);
    state.teams[tid] = { ...t, memberIds: remaining };
  }

  // Champion waiting
  if (state.waitingChampion) {
    const t = state.teams[state.waitingChampion];
    if (t?.memberIds.includes(playerId)) {
      const remaining = t.memberIds.filter((m) => m !== playerId);
      if (remaining.length >= 2) {
        state.teams[t.id] = { ...t, memberIds: remaining };
      } else if (remaining.length === 1) {
        delete state.teams[t.id];
        state.waitingChampion = null;
        state.queue.unshift({ kind: "player", id: remaining[0] });
      } else {
        delete state.teams[t.id];
        state.waitingChampion = null;
      }
    }
  }
}

function updateCooldown(state: PeladaState, loserIds: ID[]) {
  for (const p of Object.values(state.players)) {
    if (loserIds.includes(p.id)) {
      state.players[p.id] = { ...p, justPlayed: true };
    } else if (p.justPlayed) {
      state.players[p.id] = { ...p, justPlayed: false };
    }
  }
}

function pushEntry(state: PeladaState, e: QueueEntry) {
  state.queue.push(e);
}

const MAX_LOG = 200;
function logAction(state: PeladaState, msg: string) {
  state.actionLog = [{ ts: Date.now(), msg }, ...state.actionLog].slice(0, MAX_LOG);
}

function teamLabel(state: PeladaState, t: Team) {
  const custom = state.teamNames[t.id];
  return custom ? `${custom} (T${t.number})` : `TIME ${t.number}`;
}

function bumpStat(state: PeladaState, t: Team, key: "wins" | "losses" | "draws") {
  const cur = state.teamStats[t.id] ?? {
    teamId: t.id,
    number: t.number,
    customName: state.teamNames[t.id],
    memberSnapshot: t.memberIds.map((m) => state.players[m]?.name ?? "?"),
    wins: 0,
    losses: 0,
    draws: 0,
  };
  state.teamStats[t.id] = {
    ...cur,
    customName: state.teamNames[t.id] ?? cur.customName,
    memberSnapshot: t.memberIds.map(
      (m) => state.players[m]?.name ?? cur.memberSnapshot[0] ?? "?",
    ),
    [key]: cur[key] + 1,
  };
}

function placeOnCourt(state: PeladaState, side: "A" | "B", entry: QueueEntry) {
  let teamId: ID;
  if (entry.kind === "team") {
    teamId = entry.id;
    const t = state.teams[teamId];
    if (t) state.teams[teamId] = { ...t, wins: 0 };
  } else {
    const num = state.nextTeamNumber;
    state.nextTeamNumber += 1;
    teamId = uid();
    state.teams[teamId] = {
      id: teamId,
      number: num,
      memberIds: [entry.id],
      wins: 0,
      createdAt: Date.now(),
    };
  }
  if (side === "A") state.court.teamAId = teamId;
  else state.court.teamBId = teamId;
}

// ============================================================================
// Initial default players so the queue is ready out of the box if empty
// ============================================================================

export const usePelada = create<PeladaState>()(
  persist(
    (set, get) => ({
      players: {},
      teams: {},
      queue: [],
      waitingChampion: null,
      court: {
        teamAId: null,
        teamBId: null,
        elapsedMs: 0,
        runningSince: null,
        suddenDeathUsed: false,
        inSuddenDeath: false,
      },
      nextTeamNumber: 1,
      adminPin: "",
      screenLocked: false,
      lastModified: 0,
      matchMs: MATCH_MS,
      suddenDeathMs: SUDDEN_DEATH_MS,
      championRuleEnabled: true,
      winsToRotate: WINS_TO_ROTATE,
      autoReduceEnabled: true,
      autoReduceThreshold: 20,
      autoReduceMs: 6 * 60 * 1000,

      teamNames: {},
      teamStats: {},
      actionLog: [],
      selection: [],

      lockScreen: () =>
        set((s) => ({ ...s, screenLocked: true, selection: [], lastModified: Date.now() })),
      unlockScreen: (pin) => {
        const s = get();
        if (!s.adminPin || pin === s.adminPin) {
          set({ ...s, screenLocked: false, lastModified: Date.now() });
          return true;
        }
        return false;
      },

      renamePlayer: (id, name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed || !s.players[id]) return s;
          return {
            ...s,
            lastModified: Date.now(),
            players: { ...s.players, [id]: { ...s.players[id], name: trimmed } },
          };
        }),

      reorderQueue: (fromIdx, toIdx) =>
        set((s) => {
          if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return s;
          if (fromIdx >= s.queue.length || toIdx >= s.queue.length) return s;
          const next = [...s.queue];
          const [item] = next.splice(fromIdx, 1);
          next.splice(toIdx, 0, item);
          return { ...s, queue: next, lastModified: Date.now() };
        }),

      moveQueueEntry: (entry, dir) =>
        set((s) => {
          const from = s.queue.findIndex(
            (e) => e.kind === entry.kind && e.id === entry.id,
          );
          if (from < 0) return s;
          const to = from + dir;
          if (to < 0 || to >= s.queue.length) return s;
          const next = [...s.queue];
          [next[from], next[to]] = [next[to], next[from]];
          return { ...s, queue: next, lastModified: Date.now() };
        }),

      moveSelectionInQueue: (dir) =>
        set((s) => {
          if (s.selection.length === 0) return s;
          const idxs = new Set<number>();
          s.queue.forEach((e, i) => {
            const members =
              e.kind === "player" ? [e.id] : s.teams[e.id]?.memberIds ?? [];
            if (members.some((m) => s.selection.includes(m))) idxs.add(i);
          });
          if (idxs.size === 0) return s;
          const sorted = [...idxs].sort((a, b) => (dir === -1 ? a - b : b - a));
          const next = [...s.queue];
          for (const i of sorted) {
            const j = i + dir;
            if (j < 0 || j >= next.length || idxs.has(j)) continue;
            [next[i], next[j]] = [next[j], next[i]];
          }
          return { ...s, queue: next, lastModified: Date.now() };
        }),

      movePlayerToTeam: (playerId, teamId) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const target = draft.teams[teamId];
          if (!target) return s;
          if (target.memberIds.includes(playerId)) return s;
          removePlayerFromAll(draft, playerId);
          const fresh = draft.teams[teamId];
          if (!fresh) return s;
          draft.teams[teamId] = { ...fresh, memberIds: [...fresh.memberIds, playerId] };
          draft.selection = draft.selection.filter((x) => x !== playerId);
          return draft;
        }),

      sendPlayerToCourtSide: (playerId, side) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          if (!draft.players[playerId]) return s;
          const occupiedId = side === "A" ? draft.court.teamAId : draft.court.teamBId;
          if (occupiedId) {
            const t = draft.teams[occupiedId];
            if (!t || t.memberIds.includes(playerId)) return s;
            removePlayerFromAll(draft, playerId);
            const fresh = draft.teams[occupiedId];
            if (!fresh) return s;
            draft.teams[occupiedId] = {
              ...fresh,
              memberIds: [...fresh.memberIds, playerId],
            };
            draft.selection = draft.selection.filter((x) => x !== playerId);
            return draft;
          }
          removePlayerFromAll(draft, playerId);
          placeOnCourt(draft, side, { kind: "player", id: playerId });
          draft.selection = draft.selection.filter((x) => x !== playerId);
          return draft;
        }),

      detachPlayerToQueue: (playerId, toIndex) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          if (!draft.players[playerId]) return s;
          removePlayerFromAll(draft, playerId);
          const entry: QueueEntry = { kind: "player", id: playerId };
          const idx =
            typeof toIndex === "number"
              ? Math.min(toIndex, draft.queue.length)
              : draft.queue.length;
          draft.queue.splice(idx, 0, entry);
          return draft;
        }),

      addPlayer: (name, meta) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return s;
          // Prevent duplicate if user already in pelada
          const existing = Object.values(s.players).find(
            (p) =>
              (meta?.userId && p.userId === meta.userId) ||
              p.name.toLowerCase() === trimmed.toLowerCase(),
          );
          if (existing) {
            // Update role/userId if missing
            if (meta?.role && !existing.role) {
              return {
                ...s,
                lastModified: Date.now(),
                players: {
                  ...s.players,
                  [existing.id]: { ...existing, ...meta },
                },
              };
            }
            return s;
          }
          const id = uid();
          const player: Player = {
            id,
            name: trimmed,
            justPlayed: false,
            createdAt: Date.now(),
            role: meta?.role,
            userId: meta?.userId,
            position: meta?.position,
          };
          const draft = cloneState(s);
          draft.players[id] = player;
          draft.queue.push({ kind: "player", id });
          logAction(
            draft,
            `🏀 ${trimmed}${meta?.role === "aluno" ? " (Aluno)" : ""} entrou na fila`,
          );
          return draft;
        }),

      removePlayer: (id) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          removePlayerFromAll(draft, id);
          delete draft.players[id];
          draft.selection = draft.selection.filter((x) => x !== id);
          return draft;
        }),

      toggleSelect: (id) =>
        set((s) => ({
          ...s,
          selection: s.selection.includes(id)
            ? s.selection.filter((x) => x !== id)
            : [...s.selection, id],
        })),

      clearSelection: () => set((s) => ({ ...s, selection: [] })),

      formTeamFromSelection: () =>
        set((s) => {
          if (s.selection.length < 2) return s;
          const draft: PeladaState = cloneState(s);
          let earliestIdx = Infinity;
          for (const pid of s.selection) {
            const idx = draft.queue.findIndex(
              (e) =>
                (e.kind === "player" && e.id === pid) ||
                (e.kind === "team" && draft.teams[e.id]?.memberIds.includes(pid)),
            );
            if (idx >= 0 && idx < earliestIdx) earliestIdx = idx;
          }
          for (const pid of s.selection) removePlayerFromAll(draft, pid);
          const num = draft.nextTeamNumber;
          draft.nextTeamNumber += 1;
          const teamId = uid();
          draft.teams[teamId] = {
            id: teamId,
            number: num,
            memberIds: [...s.selection],
            wins: 0,
            createdAt: Date.now(),
          };
          const insertAt = Number.isFinite(earliestIdx)
            ? Math.min(earliestIdx, draft.queue.length)
            : draft.queue.length;
          draft.queue.splice(insertAt, 0, { kind: "team", id: teamId });
          draft.selection = [];
          return draft;
        }),

      pasteSelectionIntoTeam: (teamId) =>
        set((s) => {
          if (s.selection.length === 0) return s;
          const draft: PeladaState = cloneState(s);
          if (!draft.teams[teamId]) return s;
          for (const pid of s.selection) {
            const target = draft.teams[teamId];
            if (!target || target.memberIds.includes(pid)) continue;
            removePlayerFromAll(draft, pid);
            const fresh = draft.teams[teamId];
            if (!fresh) continue;
            draft.teams[teamId] = {
              ...fresh,
              memberIds: [...fresh.memberIds, pid],
            };
          }
          draft.selection = [];
          return draft;
        }),

      sendToCourt: (entry, opts) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const memberIds = entryMembers(draft, entry);
          const blocked = memberIds.some((m) => draft.players[m]?.justPlayed);
          if (blocked && !opts?.forceCooldown) return s;
          const openSide: "A" | "B" | null = !draft.court.teamAId
            ? "A"
            : !draft.court.teamBId
              ? "B"
              : null;
          if (!openSide) return s;
          if (entry.kind === "team" && draft.waitingChampion === entry.id) {
            draft.waitingChampion = null;
          } else {
            draft.queue = draft.queue.filter(
              (e) => !(e.kind === entry.kind && e.id === entry.id),
            );
          }
          placeOnCourt(draft, openSide, entry);
          return draft;
        }),

      sendToCourtSide: (entry, side, opts) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const memberIds = entryMembers(draft, entry);
          const blocked = memberIds.some((m) => draft.players[m]?.justPlayed);
          if (blocked && !opts?.forceCooldown) return s;
          const occupied = side === "A" ? draft.court.teamAId : draft.court.teamBId;
          if (occupied) return s;
          if (entry.kind === "team" && draft.waitingChampion === entry.id) {
            draft.waitingChampion = null;
          } else {
            draft.queue = draft.queue.filter(
              (e) => !(e.kind === entry.kind && e.id === entry.id),
            );
          }
          placeOnCourt(draft, side, entry);
          return draft;
        }),

      removeFromQueue: (entry) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const members = entryMembers(draft, entry);
          draft.queue = draft.queue.filter(
            (e) => !(e.kind === entry.kind && e.id === entry.id),
          );
          if (entry.kind === "team") delete draft.teams[entry.id];
          for (const pid of members) {
            delete draft.players[pid];
            draft.selection = draft.selection.filter((x) => x !== pid);
          }
          return draft;
        }),

      removeCourtTeam: (side, opts) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const tid = side === "A" ? draft.court.teamAId : draft.court.teamBId;
          if (!tid) return s;
          const team = draft.teams[tid];
          if (team) {
            if (opts?.deletePlayers) {
              for (const pid of team.memberIds) {
                delete draft.players[pid];
                draft.selection = draft.selection.filter((x) => x !== pid);
              }
              delete draft.teams[tid];
            } else if (team.memberIds.length >= 2) {
              draft.teams[tid] = { ...team, wins: 0 };
              draft.queue.push({ kind: "team", id: tid });
            } else if (team.memberIds.length === 1) {
              const lone = team.memberIds[0];
              delete draft.teams[tid];
              draft.queue.push({ kind: "player", id: lone });
            } else {
              delete draft.teams[tid];
            }
          }
          if (side === "A") draft.court.teamAId = null;
          else draft.court.teamBId = null;
          if (!draft.court.teamAId && !draft.court.teamBId) {
            draft.court.elapsedMs = 0;
            draft.court.runningSince = null;
            draft.court.suddenDeathUsed = false;
            draft.court.inSuddenDeath = false;
          }
          return draft;
        }),

      startTimer: () =>
        set((s) => {
          if (s.court.runningSince) return s;
          return {
            ...s,
            lastModified: Date.now(),
            court: { ...s.court, runningSince: Date.now() },
          };
        }),

      pauseTimer: () =>
        set((s) => {
          if (!s.court.runningSince) return s;
          const delta = Date.now() - s.court.runningSince;
          return {
            ...s,
            lastModified: Date.now(),
            court: {
              ...s.court,
              elapsedMs: s.court.elapsedMs + delta,
              runningSince: null,
            },
          };
        }),

      resetTimer: () =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          court: {
            ...s.court,
            elapsedMs: 0,
            runningSince: null,
            suddenDeathUsed: false,
            inSuddenDeath: false,
          },
        })),

      useSuddenDeath: () =>
        set((s) => {
          if (s.court.suddenDeathUsed) return s;
          return {
            ...s,
            lastModified: Date.now(),
            court: {
              ...s.court,
              elapsedMs: 0,
              runningSince: Date.now(),
              suddenDeathUsed: true,
              inSuddenDeath: true,
            },
          };
        }),

      adminResetSuddenDeath: () =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          court: { ...s.court, suddenDeathUsed: false },
        })),

      declareWinner: (side) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const winnerId = side === "A" ? draft.court.teamAId : draft.court.teamBId;
          const loserId = side === "A" ? draft.court.teamBId : draft.court.teamAId;
          if (!winnerId || !loserId) return s;
          const winner = draft.teams[winnerId];
          const loser = draft.teams[loserId];
          if (!winner || !loser) return s;

          bumpStat(draft, winner, "wins");
          bumpStat(draft, loser, "losses");
          logAction(
            draft,
            `✅ ${teamLabel(draft, winner)} venceu ${teamLabel(draft, loser)}`,
          );

          updateCooldown(draft, loser.memberIds);
          winner.wins += 1;

          if (loser.memberIds.length >= 2) {
            loser.wins = 0;
            pushEntry(draft, { kind: "team", id: loser.id });
          } else if (loser.memberIds.length === 1) {
            delete draft.teams[loser.id];
            pushEntry(draft, { kind: "player", id: loser.memberIds[0] });
          } else {
            delete draft.teams[loser.id];
          }

          if (side === "A") draft.court.teamBId = null;
          else draft.court.teamAId = null;

          const promoted =
            draft.championRuleEnabled && winner.wins >= draft.winsToRotate;
          if (promoted) {
            winner.wins = 0;
            const previous = draft.waitingChampion;
            if (previous && previous !== winner.id && draft.teams[previous]) {
              draft.queue.unshift({ kind: "team", id: previous });
            }
            draft.waitingChampion = winner.id;
            if (side === "A") draft.court.teamAId = null;
            else draft.court.teamBId = null;
            logAction(draft, `👑 ${teamLabel(draft, winner)} vira campeão em espera`);
          }

          draft.court.elapsedMs = 0;
          draft.court.runningSince = null;
          draft.court.suddenDeathUsed = false;
          draft.court.inSuddenDeath = false;

          return draft;
        }),

      declareDraw: () =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const a = draft.court.teamAId ? draft.teams[draft.court.teamAId] : null;
          const b = draft.court.teamBId ? draft.teams[draft.court.teamBId] : null;
          if (!a || !b) return s;

          bumpStat(draft, a, "draws");
          bumpStat(draft, b, "draws");
          logAction(draft, `🔀 Empate: ${teamLabel(draft, a)} × ${teamLabel(draft, b)}`);

          updateCooldown(draft, []);

          const oldestCreated = (t: Team) =>
            Math.min(...t.memberIds.map((m) => draft.players[m]?.createdAt ?? Infinity));

          const order: Team[] = [a, b].sort((x, y) => {
            if (y.wins !== x.wins) return y.wins - x.wins;
            return oldestCreated(x) - oldestCreated(y);
          });
          for (const t of order) {
            t.wins = 0;
            pushEntry(draft, { kind: "team", id: t.id });
          }
          draft.court.teamAId = null;
          draft.court.teamBId = null;
          draft.court.elapsedMs = 0;
          draft.court.runningSince = null;
          draft.court.suddenDeathUsed = false;
          draft.court.inSuddenDeath = false;

          return draft;
        }),

      swapPlayers: (aId, bId) =>
        set((s) => {
          if (aId === bId) return s;
          const draft: PeladaState = cloneState(s);
          if (!draft.players[aId] || !draft.players[bId]) return s;

          type Loc = { kind: "team"; teamId: ID; idx: number } | null;
          const findLoc = (pid: ID): Loc => {
            for (const t of Object.values(draft.teams)) {
              const idx = t.memberIds.indexOf(pid);
              if (idx >= 0) return { kind: "team", teamId: t.id, idx };
            }
            return null;
          };
          const la = findLoc(aId);
          const lb = findLoc(bId);
          if (la && lb) {
            draft.teams[la.teamId].memberIds[la.idx] = bId;
            draft.teams[lb.teamId].memberIds[lb.idx] = aId;
            draft.selection = [];
            return draft;
          }
          const findQueueIdx = (pid: ID) =>
            draft.queue.findIndex((e) => e.kind === "player" && e.id === pid);
          if (la && !lb) {
            const qi = findQueueIdx(bId);
            if (qi < 0) return s;
            draft.teams[la.teamId].memberIds[la.idx] = bId;
            draft.queue[qi] = { kind: "player", id: aId };
          } else if (!la && lb) {
            const qi = findQueueIdx(aId);
            if (qi < 0) return s;
            draft.teams[lb.teamId].memberIds[lb.idx] = aId;
            draft.queue[qi] = { kind: "player", id: bId };
          } else {
            const ia = findQueueIdx(aId);
            const ib = findQueueIdx(bId);
            if (ia < 0 || ib < 0) return s;
            [draft.queue[ia], draft.queue[ib]] = [draft.queue[ib], draft.queue[ia]];
          }
          draft.selection = [];
          return draft;
        }),

      renameTeam: (teamId, name) =>
        set((s) => {
          const trimmed = name.trim();
          const next = { ...s.teamNames };
          if (!trimmed) delete next[teamId];
          else next[teamId] = trimmed;
          return { ...s, teamNames: next, lastModified: Date.now() };
        }),

      setAdminPin: (pin) =>
        set((s) => ({ ...s, adminPin: pin, lastModified: Date.now() })),

      setMatchDuration: (ms) =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          matchMs: Math.max(30_000, Math.min(30 * 60_000, ms)),
        })),
      setSuddenDeathDuration: (ms) =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          suddenDeathMs: Math.max(15_000, Math.min(10 * 60_000, ms)),
        })),
      setChampionRule: (enabled) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          draft.championRuleEnabled = enabled;
          if (!enabled && draft.waitingChampion) {
            const cid = draft.waitingChampion;
            draft.waitingChampion = null;
            if (draft.teams[cid]) draft.queue.unshift({ kind: "team", id: cid });
          }
          logAction(
            draft,
            enabled
              ? "⚙️ Regra 'ganhou 2 e sai' ativada"
              : "⚙️ Regra 'ganhou 2 e sai' desativada",
          );
          return draft;
        }),

      setWinsToRotate: (wins) =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          winsToRotate: Math.max(1, Math.min(20, Math.round(wins))),
        })),

      setAutoReduce: (cfg) =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          autoReduceEnabled: cfg.enabled ?? s.autoReduceEnabled,
          autoReduceThreshold:
            cfg.threshold === undefined
              ? s.autoReduceThreshold
              : Math.max(2, Math.min(200, Math.round(cfg.threshold))),
          autoReduceMs:
            cfg.ms === undefined
              ? s.autoReduceMs
              : Math.max(30_000, Math.min(30 * 60_000, cfg.ms)),
        })),

      clearActionLog: () =>
        set((s) => ({ ...s, actionLog: [], lastModified: Date.now() })),
      clearStats: () =>
        set((s) => ({ ...s, teamStats: {}, lastModified: Date.now() })),

      clearQueueOnly: () =>
        set((s) => {
          const draft = cloneState(s);
          for (const entry of draft.queue) {
            if (entry.kind === "player") {
              delete draft.players[entry.id];
            } else {
              const t = draft.teams[entry.id];
              if (t) {
                for (const pid of t.memberIds) delete draft.players[pid];
                delete draft.teams[entry.id];
              }
            }
          }
          draft.queue = [];
          draft.selection = [];
          logAction(draft, "🧹 Fila de espera limpa pelo treinador");
          return draft;
        }),

      resetNight: () =>
        set((s) => ({
          ...s,
          lastModified: Date.now(),
          players: {},
          teams: {},
          queue: [],
          waitingChampion: null,
          court: {
            teamAId: null,
            teamBId: null,
            elapsedMs: 0,
            runningSince: null,
            suddenDeathUsed: false,
            inSuddenDeath: false,
          },
          nextTeamNumber: 1,
          teamNames: {},
          teamStats: {},
          actionLog: [{ ts: Date.now(), msg: "🔄 Noite reiniciada" }],
          selection: [],
        })),

      hydrateFromRemote: (remote) =>
        set((s) => ({
          ...s,
          ...remote,
          selection: s.selection.filter((id) => remote.players?.[id]),
        })),
    }),
    {
      name: "pelada-store-v1",
      partialize: (s) => ({
        players: s.players,
        teams: s.teams,
        queue: s.queue,
        waitingChampion: s.waitingChampion,
        court: s.court,
        nextTeamNumber: s.nextTeamNumber,
        adminPin: s.adminPin,
        screenLocked: s.screenLocked,
        lastModified: s.lastModified,
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
      }),
    },
  ),
);

// Selectors / derived helpers

export type DurationState = Pick<
  PeladaState,
  | "court"
  | "matchMs"
  | "suddenDeathMs"
  | "players"
  | "autoReduceEnabled"
  | "autoReduceThreshold"
  | "autoReduceMs"
>;

export function effectiveMatchMs(state: DurationState) {
  const total = Object.keys(state.players).length;
  if (state.autoReduceEnabled && total >= state.autoReduceThreshold) {
    return state.autoReduceMs;
  }
  return state.matchMs;
}

export function currentDurationMs(state: DurationState) {
  return state.court.inSuddenDeath ? state.suddenDeathMs : effectiveMatchMs(state);
}

export function computeElapsed(court: CourtState, now: number) {
  return court.elapsedMs + (court.runningSince ? now - court.runningSince : 0);
}

export type PlayerPeladaLookup =
  | { status: "not-in-pelada" }
  | {
      status: "on-court";
      side: "A" | "B";
      player: Player;
      team: Team;
      teamLabel: string;
      teammates: Player[];
    }
  | {
      status: "champion-waiting";
      player: Player;
      team: Team;
      teamLabel: string;
      teammates: Player[];
    }
  | {
      status: "in-queue";
      position: number;
      entryKind: "player" | "team";
      player: Player;
      team?: Team;
      teamLabel?: string;
      teammates: Player[];
      playersAheadCount: number;
    };

export function getPlayerPeladaStatus(
  state: Pick<
    PeladaState,
    "players" | "teams" | "queue" | "waitingChampion" | "court" | "teamNames"
  >,
  query: { userId?: string; name?: string },
): PlayerPeladaLookup {
  const normName = query.name?.trim().toLowerCase();
  const player = Object.values(state.players).find(
    (p) =>
      (query.userId && p.userId === query.userId) ||
      (normName && p.name.toLowerCase() === normName),
  );
  if (!player) return { status: "not-in-pelada" };

  // Check Court Side A & B
  for (const side of ["A", "B"] as const) {
    const tid = side === "A" ? state.court.teamAId : state.court.teamBId;
    if (!tid) continue;
    const t = state.teams[tid];
    if (t && t.memberIds.includes(player.id)) {
      const custom = state.teamNames[t.id];
      return {
        status: "on-court",
        side,
        player,
        team: t,
        teamLabel: custom ?? `TIME ${t.number}`,
        teammates: t.memberIds
          .filter((id) => id !== player.id)
          .map((id) => state.players[id])
          .filter(Boolean),
      };
    }
  }

  // Check Waiting Champion
  if (state.waitingChampion) {
    const t = state.teams[state.waitingChampion];
    if (t && t.memberIds.includes(player.id)) {
      const custom = state.teamNames[t.id];
      return {
        status: "champion-waiting",
        player,
        team: t,
        teamLabel: custom ?? `TIME ${t.number}`,
        teammates: t.memberIds
          .filter((id) => id !== player.id)
          .map((id) => state.players[id])
          .filter(Boolean),
      };
    }
  }

  // Check Queue
  let playersAheadCount = 0;
  for (let i = 0; i < state.queue.length; i++) {
    const entry = state.queue[i];
    if (entry.kind === "player") {
      if (entry.id === player.id) {
        return {
          status: "in-queue",
          position: i + 1,
          entryKind: "player",
          player,
          teammates: [],
          playersAheadCount,
        };
      }
      playersAheadCount += 1;
    } else {
      const t = state.teams[entry.id];
      if (t && t.memberIds.includes(player.id)) {
        const custom = state.teamNames[t.id];
        return {
          status: "in-queue",
          position: i + 1,
          entryKind: "team",
          player,
          team: t,
          teamLabel: custom ?? `TIME ${t.number}`,
          teammates: t.memberIds
            .filter((id) => id !== player.id)
            .map((id) => state.players[id])
            .filter(Boolean),
          playersAheadCount,
        };
      }
      playersAheadCount += t ? t.memberIds.length : 0;
    }
  }

  return { status: "not-in-pelada" };
}
