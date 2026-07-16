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

export interface PeladaState {
  players: Record<ID, Player>;
  teams: Record<ID, Team>;
  queue: QueueEntry[];
  waitingChampion: ID | null; // teamId of the 👑 waiting
  court: CourtState;
  nextTeamNumber: number;
  adminPin: string; // "" = no pin set
  screenLocked: boolean;

  // ephemeral (not persisted meaningfully but fine)
  selection: ID[]; // selected player ids for team-forming / substitution

  // ---- actions ----
  addPlayer: (name: string) => void;
  renamePlayer: (id: ID, name: string) => void;
  removePlayer: (id: ID) => void;
  reorderQueue: (fromIdx: number, toIdx: number) => void;
  movePlayerToTeam: (playerId: ID, teamId: ID) => void;
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
  sendToCourtSide: (entry: QueueEntry, side: "A" | "B", opts?: { forceCooldown?: boolean }) => void;
  /** Remove any queue entry (player or team) */
  removeFromQueue: (entry: QueueEntry) => void;
  /** Remove the entire team on a court side (team + its player records). */
  removeCourtTeam: (side: "A" | "B") => void;

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
  resetNight: () => void;
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

/** Deep-clone ONLY the data slices of state (never the action functions).
 *  Using structuredClone on the whole state throws DataCloneError because
 *  zustand actions are functions on the same object. */
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
  };
}

function entryMembers(state: PeladaState, e: QueueEntry): ID[] {
  return e.kind === "player" ? [e.id] : state.teams[e.id]?.memberIds ?? [];
}

/** Remove a player from wherever they are (queue player entry, queue team, or a court team).
 *  If removing shrinks a team below 2, dissolve it (remaining member becomes a lone player
 *  in the same queue slot). Returns a new state fragment (mutating a draft). */
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
        // dissolve team → lone player at same position
        delete state.teams[e.id];
        newQueue.push({ kind: "player", id: remaining[0] });
      } else {
        // dissolve empty
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
    // court teams stay even if <2 (needs manual fix by admin); don't auto-dissolve mid-match
  }

  // Champion waiting
  if (state.waitingChampion) {
    const t = state.teams[state.waitingChampion];
    if (t?.memberIds.includes(playerId)) {
      const remaining = t.memberIds.filter((m) => m !== playerId);
      if (remaining.length >= 2) {
        state.teams[t.id] = { ...t, memberIds: remaining };
      } else if (remaining.length === 1) {
        // Champion dissolved → lone player keeps champion slot? Put them at front of queue.
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

/** After a match ends, clear justPlayed for anyone NOT in the just-finished match,
 *  and set it for the losers. */
function updateCooldown(state: PeladaState, loserIds: ID[]) {
  for (const p of Object.values(state.players)) {
    if (loserIds.includes(p.id)) {
      state.players[p.id] = { ...p, justPlayed: true };
    } else if (p.justPlayed) {
      // they sat this match out → cooldown clears
      state.players[p.id] = { ...p, justPlayed: false };
    }
  }
}

/** Send an entry to the queue at the end. */
function pushEntry(state: PeladaState, e: QueueEntry) {
  state.queue.push(e);
}

/** Pop the next queue entry to fill an empty court slot. Prefers waitingChampion. */
function popNext(state: PeladaState): QueueEntry | null {
  if (state.waitingChampion && state.teams[state.waitingChampion]) {
    const id = state.waitingChampion;
    state.waitingChampion = null;
    return { kind: "team", id };
  }
  const next = state.queue.shift();
  return next ?? null;
}

/** Court team on the given side. Enters with fresh wins. */
function placeOnCourt(state: PeladaState, side: "A" | "B", entry: QueueEntry) {
  let teamId: ID;
  if (entry.kind === "team") {
    teamId = entry.id;
    const t = state.teams[teamId];
    if (t) state.teams[teamId] = { ...t, wins: 0 };
  } else {
    // lone player → create a temporary team (they'll need teammates via UI)
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
// Store
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
      selection: [],

      lockScreen: () => set((s) => ({ ...s, screenLocked: true, selection: [] })),
      unlockScreen: (pin) => {
        const s = get();
        if (!s.adminPin || pin === s.adminPin) {
          set({ ...s, screenLocked: false });
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
          return { ...s, queue: next };
        }),

      movePlayerToTeam: (playerId, teamId) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const target = draft.teams[teamId];
          if (!target) return s;
          if (target.memberIds.includes(playerId)) return s;
          removePlayerFromAll(draft, playerId);
          draft.teams[teamId].memberIds.push(playerId);
          draft.selection = draft.selection.filter((x) => x !== playerId);
          return draft;
        }),

      detachPlayerToQueue: (playerId, toIndex) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          if (!draft.players[playerId]) return s;
          removePlayerFromAll(draft, playerId);
          const entry: QueueEntry = { kind: "player", id: playerId };
          const idx = typeof toIndex === "number" ? Math.min(toIndex, draft.queue.length) : draft.queue.length;
          draft.queue.splice(idx, 0, entry);
          return draft;
        }),

      addPlayer: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return s;
          const id = uid();
          const player: Player = {
            id,
            name: trimmed,
            justPlayed: false,
            createdAt: Date.now(),
          };
          return {
            ...s,
            players: { ...s.players, [id]: player },
            queue: [...s.queue, { kind: "player", id }],
          };
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
          // Find earliest queue position among the selected players; that becomes the new team slot.
          let earliestIdx = Infinity;
          for (const pid of s.selection) {
            const idx = draft.queue.findIndex(
              (e) =>
                (e.kind === "player" && e.id === pid) ||
                (e.kind === "team" && draft.teams[e.id]?.memberIds.includes(pid)),
            );
            if (idx >= 0 && idx < earliestIdx) earliestIdx = idx;
          }
          // Remove selected players from their current spots
          for (const pid of s.selection) removePlayerFromAll(draft, pid);
          // Create new team
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
          const target = draft.teams[teamId];
          if (!target) return s;
          for (const pid of s.selection) {
            if (target.memberIds.includes(pid)) continue;
            removePlayerFromAll(draft, pid);
            target.memberIds.push(pid);
          }
          draft.teams[teamId] = target;
          draft.selection = [];
          return draft;
        }),

      sendToCourt: (entry, opts) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          // cooldown check
          const memberIds = entryMembers(draft, entry);
          const blocked = memberIds.some((m) => draft.players[m]?.justPlayed);
          if (blocked && !opts?.forceCooldown) return s;
          // find open slot
          const openSide: "A" | "B" | null = !draft.court.teamAId
            ? "A"
            : !draft.court.teamBId
              ? "B"
              : null;
          if (!openSide) return s;
          // remove from queue / champion
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
        set((s) => ({
          ...s,
          queue: s.queue.filter((e) => !(e.kind === entry.kind && e.id === entry.id)),
        })),

      removeCourtTeam: (side) =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const tid = side === "A" ? draft.court.teamAId : draft.court.teamBId;
          if (!tid) return s;
          const team = draft.teams[tid];
          if (team) {
            for (const pid of team.memberIds) {
              delete draft.players[pid];
              draft.selection = draft.selection.filter((x) => x !== pid);
            }
            delete draft.teams[tid];
          }
          if (side === "A") draft.court.teamAId = null;
          else draft.court.teamBId = null;
          draft.court.elapsedMs = 0;
          draft.court.runningSince = null;
          draft.court.suddenDeathUsed = false;
          draft.court.inSuddenDeath = false;
          return draft;
        }),

      startTimer: () =>
        set((s) => {
          if (s.court.runningSince) return s;
          return {
            ...s,
            court: { ...s.court, runningSince: Date.now() },
          };
        }),

      pauseTimer: () =>
        set((s) => {
          if (!s.court.runningSince) return s;
          const delta = Date.now() - s.court.runningSince;
          return {
            ...s,
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

          // cooldown flags
          updateCooldown(draft, loser.memberIds);

          // increment wins for winner
          winner.wins += 1;

          // loser: goes to end of queue (or dissolves if <2)
          if (loser.memberIds.length >= 2) {
            loser.wins = 0;
            pushEntry(draft, { kind: "team", id: loser.id });
          } else if (loser.memberIds.length === 1) {
            delete draft.teams[loser.id];
            pushEntry(draft, { kind: "player", id: loser.memberIds[0] });
          } else {
            delete draft.teams[loser.id];
          }

          // remove loser from court
          if (side === "A") draft.court.teamBId = null;
          else draft.court.teamAId = null;

          // winner: if 2 wins, becomes champion waiting (goes off court)
          const promoted = winner.wins >= WINS_TO_ROTATE;
          if (promoted) {
            winner.wins = 0;
            draft.waitingChampion = winner.id;
            if (side === "A") draft.court.teamAId = null;
            else draft.court.teamBId = null;
          }

          // reset timer & sudden death for next match
          draft.court.elapsedMs = 0;
          draft.court.runningSince = null;
          draft.court.suddenDeathUsed = false;
          draft.court.inSuddenDeath = false;

          // Loser's slot stays open — the operator manually sends the next
          // team from the queue. No auto-fill.

          return draft;
        }),



          return draft;
        }),

      declareDraw: () =>
        set((s) => {
          const draft: PeladaState = cloneState(s);
          const a = draft.court.teamAId ? draft.teams[draft.court.teamAId] : null;
          const b = draft.court.teamBId ? draft.teams[draft.court.teamBId] : null;
          if (!a || !b) return s;

          // No cooldown on draw (nobody "lost")
          updateCooldown(draft, []);

          // Order: more wins first goes to back first (i.e., stays further from playing).
          // Tie: team whose oldest player entered the queue earlier goes back first.
          const oldestCreated = (t: Team) =>
            Math.min(...t.memberIds.map((m) => draft.players[m]?.createdAt ?? Infinity));

          const order: Team[] = [a, b].sort((x, y) => {
            if (y.wins !== x.wins) return y.wins - x.wins; // higher wins → pushed further
            return oldestCreated(x) - oldestCreated(y); // older player → pushed further
          });
          // order[0] goes to queue first (further back), order[1] next (closer to front)
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

          for (const slot of ["A", "B"] as const) {
            const next = popNext(draft);
            if (!next) break;
            placeOnCourt(draft, slot, next);
          }
          return draft;
        }),

      setAdminPin: (pin) => set((s) => ({ ...s, adminPin: pin })),

      resetNight: () =>
        set(() => ({
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
          adminPin: get().adminPin,
          selection: [],
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
      }),
    },
  ),
);

// Selectors / derived helpers
export function currentDurationMs(court: CourtState) {
  return court.inSuddenDeath ? SUDDEN_DEATH_MS : MATCH_MS;
}

export function computeElapsed(court: CourtState, now: number) {
  return court.elapsedMs + (court.runningSince ? now - court.runningSince : 0);
}
