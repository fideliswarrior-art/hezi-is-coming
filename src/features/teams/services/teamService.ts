import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  TEAM_MAX_ROSTER,
  TEAM_MAX_SWAPS_PER_SEASON,
  type OfficialTeam,
  type TeamModality,
  type TeamRequest,
  type TeamRosterMember,
} from "../types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface TeamStoreState {
  teams: OfficialTeam[];
  rosterMembers: TeamRosterMember[];
  teamRequests: TeamRequest[];
  submitTeamRequest: (input: {
    name: string;
    modality: TeamModality;
    captain_user_id: number;
    logo_url?: string;
    initialMemberIds: number[];
  }) => { ok: boolean; request?: TeamRequest; error?: string };
  approveTeamRequest: (
    requestId: string,
    adminUserId: number,
  ) => { ok: boolean; team?: OfficialTeam; error?: string };
  rejectTeamRequest: (
    requestId: string,
    adminUserId: number,
    reason?: string,
  ) => { ok: boolean; error?: string };
  createTeam: (input: {
    name: string;
    modality: TeamModality;
    captain_user_id: number;
    logo_url?: string;
    initialMemberIds: number[];
  }) => { ok: boolean; team?: OfficialTeam; error?: string };
  addMemberToTeam: (
    teamId: string,
    userId: number,
  ) => { ok: boolean; error?: string };
  removeMemberFromTeam: (
    teamId: string,
    userId: number,
  ) => { ok: boolean; error?: string };
}

export const useTeamStore = create<TeamStoreState>()(
  persist(
    (set, get) => ({
      teams: [],
      rosterMembers: [],
      teamRequests: [],

      submitTeamRequest: ({
        name,
        modality,
        captain_user_id,
        logo_url,
        initialMemberIds,
      }) => {
        const cleanName = name.trim();
        if (!cleanName) {
          return { ok: false, error: "Informe o nome do time." };
        }
        const seasonYear = new Date().getFullYear();
        const duplicateTeam = get().teams.some(
          (t) => t.name.trim().toLowerCase() === cleanName.toLowerCase(),
        );
        const duplicatePending = get().teamRequests.some(
          (r) =>
            r.status === "pendente" &&
            r.name.trim().toLowerCase() === cleanName.toLowerCase(),
        );
        if (duplicateTeam || duplicatePending) {
          return {
            ok: false,
            error: "Já existe um Time Oficial ou solicitação pendente com este nome.",
          };
        }

        const uniqueIds = Array.from(
          new Set([captain_user_id, ...initialMemberIds]),
        );
        const maxRoster = TEAM_MAX_ROSTER[modality];
        if (uniqueIds.length > maxRoster) {
          return {
            ok: false,
            error: `Máximo de ${maxRoster} jogadores ativos no ${modality}.`,
          };
        }

        const activeInModality = get().rosterMembers.filter(
          (m) =>
            m.is_active &&
            m.modality === modality &&
            m.season_year === seasonYear,
        );
        for (const uid of uniqueIds) {
          if (activeInModality.some((m) => m.user_id === uid)) {
            return {
              ok: false,
              error: `Um dos atletas já está ativo em outro Time Oficial de ${modality} nesta temporada.`,
            };
          }
        }

        const request: TeamRequest = {
          id: `treq-${Date.now()}`,
          name: cleanName,
          modality,
          captain_user_id,
          logo_url: logo_url || "",
          initial_member_ids: uniqueIds,
          status: "pendente",
          created_at: new Date().toISOString(),
        };

        set((s) => ({
          teamRequests: [request, ...s.teamRequests],
        }));

        return { ok: true, request };
      },

      approveTeamRequest: (requestId, adminUserId) => {
        const req = get().teamRequests.find((r) => r.id === requestId);
        if (!req) return { ok: false, error: "Solicitação não encontrada." };
        if (req.status !== "pendente") {
          return { ok: false, error: "Esta solicitação já foi analisada." };
        }

        const res = get().createTeam({
          name: req.name,
          modality: req.modality,
          captain_user_id: req.captain_user_id,
          logo_url: req.logo_url,
          initialMemberIds: req.initial_member_ids,
        });
        if (!res.ok) return res;

        set((s) => ({
          teamRequests: s.teamRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "aprovado",
                  reviewed_by: adminUserId,
                  reviewed_at: new Date().toISOString(),
                }
              : r,
          ),
        }));

        return res;
      },

      rejectTeamRequest: (requestId, adminUserId, reason) => {
        const req = get().teamRequests.find((r) => r.id === requestId);
        if (!req) return { ok: false, error: "Solicitação não encontrada." };
        set((s) => ({
          teamRequests: s.teamRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "recusado",
                  reviewed_by: adminUserId,
                  reviewed_at: new Date().toISOString(),
                  reject_reason: reason?.trim() || "Recusado pelo administrador",
                }
              : r,
          ),
        }));
        return { ok: true };
      },

      createTeam: ({ name, modality, captain_user_id, logo_url, initialMemberIds }) => {
        const cleanName = name.trim();
        if (!cleanName) {
          return { ok: false, error: "Informe o nome do time." };
        }
        const seasonYear = new Date().getFullYear();
        const duplicateName = get().teams.some(
          (t) => t.name.trim().toLowerCase() === cleanName.toLowerCase(),
        );
        if (duplicateName) {
          return {
            ok: false,
            error: "Já existe um Time Oficial com este nome.",
          };
        }

        const uniqueIds = Array.from(
          new Set([captain_user_id, ...initialMemberIds]),
        );
        const maxRoster = TEAM_MAX_ROSTER[modality];
        if (uniqueIds.length > maxRoster) {
          return {
            ok: false,
            error: `Máximo de ${maxRoster} jogadores ativos no ${modality}.`,
          };
        }

        const activeInModality = get().rosterMembers.filter(
          (m) =>
            m.is_active &&
            m.modality === modality &&
            m.season_year === seasonYear,
        );
        for (const uid of uniqueIds) {
          if (activeInModality.some((m) => m.user_id === uid)) {
            return {
              ok: false,
              error: `Um dos atletas já está ativo em outro Time Oficial de ${modality} nesta temporada.`,
            };
          }
        }

        const nowIso = new Date().toISOString();
        const team: OfficialTeam = {
          id: `team-${Date.now()}`,
          name: cleanName,
          slug: `${slugify(cleanName)}-${Date.now().toString().slice(-4)}`,
          modality,
          captain_user_id,
          logo_url: logo_url || "",
          season_year: seasonYear,
          swaps_used: 0,
          created_at: nowIso,
        };

        const members: TeamRosterMember[] = uniqueIds.map((uid) => ({
          id: `rm-${team.id}-${uid}`,
          team_id: team.id,
          user_id: uid,
          season_year: seasonYear,
          modality,
          is_active: true,
          joined_at: nowIso,
        }));

        set((s) => ({
          teams: [team, ...s.teams],
          rosterMembers: [...s.rosterMembers, ...members],
        }));

        return { ok: true, team };
      },

      addMemberToTeam: (teamId, userId) => {
        const state = get();
        const team = state.teams.find((t) => t.id === teamId);
        if (!team) return { ok: false, error: "Time não encontrado." };
        if (team.swaps_used >= TEAM_MAX_SWAPS_PER_SEASON) {
          return {
            ok: false,
            error: `Limite de ${TEAM_MAX_SWAPS_PER_SEASON} alterações na temporada atingido.`,
          };
        }

        const activeRoster = state.rosterMembers.filter(
          (m) => m.team_id === teamId && m.is_active,
        );
        if (activeRoster.length >= TEAM_MAX_ROSTER[team.modality]) {
          return {
            ok: false,
            error: `Elenco completo (máximo ${TEAM_MAX_ROSTER[team.modality]} ativos no ${team.modality}).`,
          };
        }

        const alreadyInOtherTeam = state.rosterMembers.some(
          (m) =>
            m.user_id === userId &&
            m.is_active &&
            m.modality === team.modality &&
            m.season_year === team.season_year,
        );
        if (alreadyInOtherTeam) {
          return {
            ok: false,
            error: `Este atleta já está ativo em um Time Oficial de ${team.modality} nesta temporada.`,
          };
        }

        const newMember: TeamRosterMember = {
          id: `rm-${teamId}-${userId}-${Date.now()}`,
          team_id: teamId,
          user_id: userId,
          season_year: team.season_year,
          modality: team.modality,
          is_active: true,
          joined_at: new Date().toISOString(),
        };

        set((s) => ({
          teams: s.teams.map((t) =>
            t.id === teamId ? { ...t, swaps_used: t.swaps_used + 1 } : t,
          ),
          rosterMembers: [...s.rosterMembers, newMember],
        }));

        return { ok: true };
      },

      removeMemberFromTeam: (teamId, userId) => {
        const state = get();
        const team = state.teams.find((t) => t.id === teamId);
        if (!team) return { ok: false, error: "Time não encontrado." };
        if (team.captain_user_id === userId) {
          return { ok: false, error: "O capitão não pode sair do próprio time." };
        }
        set((s) => ({
          rosterMembers: s.rosterMembers.map((m) =>
            m.team_id === teamId && m.user_id === userId
              ? { ...m, is_active: false }
              : m,
          ),
        }));
        return { ok: true };
      },
    }),
    { name: "hezi-teams-v1" },
  ),
);
