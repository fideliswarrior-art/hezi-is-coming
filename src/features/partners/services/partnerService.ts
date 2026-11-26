import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isActiveSubscriber, useHeziPlatform } from "@/lib/hezi/store";
import { computeHomologationPreview } from "../utils/hpCalculator";
import type {
  CategoryCode,
  HpLedgerEntry,
  Partner,
  PartnerBadge,
  PartnerCircuit,
  PartnerMatch,
  PartnerModality,
  PartnerPlayerStat,
  PartnerRegistration,
  PartnerSubEvent,
  RosterCheckinItem,
  SanctionTier,
} from "../types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================================
// SEED DE DEMONSTRAÇÃO INICIAL ("Rei do Asfalto 1x1")
// ============================================================================
const SEED_PARTNER_ID = "partner-rei-do-asfalto";
const SEED_CIRCUIT_ID = "circuit-rei-asfalto-2026";
const SEED_STAGE_1_ID = "stage-rei-asfalto-01";
const SEED_STAGE_2_ID = "stage-rei-asfalto-02";

const SEED_PARTNERS: Partner[] = [
  {
    id: SEED_PARTNER_ID,
    user_id: 901,
    name: "Rei do Asfalto 1x1",
    slug: "rei-do-asfalto-1x1",
    bio: "O maior circuito independente de basquete 1x1 de rua da região, licenciado pela HEZI FAM.",
    instagram: "@reidoasfalto1x1",
    logo_url: "",
    banner_url: "",
    is_active: true,
    created_at: "2026-01-10T10:00:00Z",
  },
];

const SEED_CIRCUITS: PartnerCircuit[] = [
  {
    id: SEED_CIRCUIT_ID,
    partner_id: SEED_PARTNER_ID,
    title: "Circuito Anual 1x1 — Temporada 2026",
    slug: "circuito-anual-1x1-2026",
    modality: "1x1",
    sanction_tier: "HEZI_100",
    description:
      "Etapas mensais no formato mata-mata 1x1 até 11 pontos (ou 7 minutos). Pontuação oficial válida para o Ranking HEZI.",
    rules_summary:
      "Jogos até 11 pts (cesta vale 1 e 2). Check-in obrigatório 20 min antes.",
    status: "ativo",
    pin_on_home: true,
    gp_participation_bonus: 15,
    created_at: "2026-01-15T10:00:00Z",
  },
];

const SEED_SUB_EVENTS: PartnerSubEvent[] = [
  {
    id: SEED_STAGE_1_ID,
    circuit_id: SEED_CIRCUIT_ID,
    partner_id: SEED_PARTNER_ID,
    title: "Etapa 01 — Abertura",
    stage_order: 1,
    category: "open_masc",
    sanction_tier_override: null,
    has_third_place_match: true,
    start_date: "2026-02-15T14:00:00Z",
    end_date: "2026-02-15T19:00:00Z",
    location: "Quadra Central HEZI · Praça da Matriz",
    max_participants: 16,
    status: "homologada",
    homologated_at: "2026-02-15T20:00:00Z",
    homologated_by: 1,
    created_at: "2026-01-20T10:00:00Z",
  },
  {
    id: SEED_STAGE_2_ID,
    circuit_id: SEED_CIRCUIT_ID,
    partner_id: SEED_PARTNER_ID,
    title: "Etapa 02 — Verão",
    stage_order: 2,
    category: "open_masc",
    sanction_tier_override: null,
    has_third_place_match: true,
    start_date: "2026-12-12T14:00:00Z",
    end_date: "2026-12-12T19:00:00Z",
    location: "Quadra Central HEZI · Praça da Matriz",
    max_participants: 16,
    status: "inscricoes_abertas",
    homologated_at: null,
    homologated_by: null,
    created_at: "2026-11-20T10:00:00Z",
  },
];

const SEED_REGISTRATIONS: PartnerRegistration[] = [
  { id: "reg-s1-1", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, user_id: 1, team_id: null, participant_name: "Fidelis", roster_checkins: [], checked_in: true, contact_whatsapp: "(21) 99999-0001", instagram: "@hezifidelis", approval_status: "confirmado", final_placement: 1 },
  { id: "reg-s1-2", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, user_id: 2, team_id: null, participant_name: "Bezerra", roster_checkins: [], checked_in: true, contact_whatsapp: "(21) 99999-0002", instagram: "@bezerra", approval_status: "confirmado", final_placement: 2 },
  { id: "reg-s1-3", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, user_id: 3, team_id: null, participant_name: "Ambi", roster_checkins: [], checked_in: true, contact_whatsapp: "(21) 99999-0003", instagram: "@arth12x", approval_status: "confirmado", final_placement: 3 },
  { id: "reg-s1-4", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, user_id: 4, team_id: null, participant_name: "4 e meia", roster_checkins: [], checked_in: true, contact_whatsapp: "(21) 99999-0004", instagram: "@dnj77_7", approval_status: "confirmado", final_placement: 4 },
  { id: "reg-s1-5", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, user_id: 5, team_id: null, participant_name: "Jotape", roster_checkins: [], checked_in: true, contact_whatsapp: "(21) 99999-0005", instagram: "@fika2k", approval_status: "confirmado", final_placement: 5 },
  { id: "reg-s1-6", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, user_id: 6, team_id: null, participant_name: "Miquéias", roster_checkins: [], checked_in: true, contact_whatsapp: "(21) 99999-0006", instagram: "@miqueias", approval_status: "confirmado", final_placement: 6 },
  { id: "reg-s1-7", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, user_id: 7, team_id: null, participant_name: "Hezikenny", roster_checkins: [], checked_in: true, contact_whatsapp: "(21) 99999-0007", instagram: "@hezikenny", approval_status: "confirmado", final_placement: 7 },
  { id: "reg-s1-8", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, user_id: 8, team_id: null, participant_name: "Chefe do Vocaro", roster_checkins: [], checked_in: true, contact_whatsapp: "(21) 99999-0008", instagram: "@hernzndz", approval_status: "confirmado", final_placement: 8 },
];

const SEED_MATCHES: PartnerMatch[] = [
  { id: "m-s1-qf1", sub_event_id: SEED_STAGE_1_ID, round_name: "Quartas", bracket_type: "main_draw", is_final: false, is_third_place: false, player_a_id: "reg-s1-1", player_b_id: "reg-s1-8", score_a: 11, score_b: 5, winner_id: "reg-s1-1", result_type: "played", status: "finalizado" },
  { id: "m-s1-qf2", sub_event_id: SEED_STAGE_1_ID, round_name: "Quartas", bracket_type: "main_draw", is_final: false, is_third_place: false, player_a_id: "reg-s1-4", player_b_id: "reg-s1-5", score_a: 11, score_b: 8, winner_id: "reg-s1-4", result_type: "played", status: "finalizado" },
  { id: "m-s1-qf3", sub_event_id: SEED_STAGE_1_ID, round_name: "Quartas", bracket_type: "main_draw", is_final: false, is_third_place: false, player_a_id: "reg-s1-2", player_b_id: "reg-s1-7", score_a: 11, score_b: 6, winner_id: "reg-s1-2", result_type: "played", status: "finalizado" },
  { id: "m-s1-qf4", sub_event_id: SEED_STAGE_1_ID, round_name: "Quartas", bracket_type: "main_draw", is_final: false, is_third_place: false, player_a_id: "reg-s1-3", player_b_id: "reg-s1-6", score_a: 11, score_b: 7, winner_id: "reg-s1-3", result_type: "played", status: "finalizado" },
  { id: "m-s1-sf1", sub_event_id: SEED_STAGE_1_ID, round_name: "Semifinal", bracket_type: "main_draw", is_final: false, is_third_place: false, player_a_id: "reg-s1-1", player_b_id: "reg-s1-4", score_a: 11, score_b: 7, winner_id: "reg-s1-1", result_type: "played", status: "finalizado" },
  { id: "m-s1-sf2", sub_event_id: SEED_STAGE_1_ID, round_name: "Semifinal", bracket_type: "main_draw", is_final: false, is_third_place: false, player_a_id: "reg-s1-2", player_b_id: "reg-s1-3", score_a: 11, score_b: 9, winner_id: "reg-s1-2", result_type: "played", status: "finalizado" },
  { id: "m-s1-3rd", sub_event_id: SEED_STAGE_1_ID, round_name: "Disputa 3º Lugar", bracket_type: "main_draw", is_final: false, is_third_place: true, player_a_id: "reg-s1-3", player_b_id: "reg-s1-4", score_a: 11, score_b: 6, winner_id: "reg-s1-3", result_type: "played", status: "finalizado" },
  { id: "m-s1-fin", sub_event_id: SEED_STAGE_1_ID, round_name: "Final", bracket_type: "main_draw", is_final: true, is_third_place: false, player_a_id: "reg-s1-1", player_b_id: "reg-s1-2", score_a: 11, score_b: 8, winner_id: "reg-s1-1", result_type: "played", status: "finalizado" },
];

const SEED_STATS: PartnerPlayerStat[] = [
  { id: "st-1", match_id: "m-s1-fin", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, registration_id: "reg-s1-1", user_id: 1, player_name: "Fidelis", points: 11, two_pointers: 3, three_pointers: 2, rebounds: 4, assists: 0, blocks_steals: 2, is_mvp: true },
  { id: "st-2", match_id: "m-s1-fin", sub_event_id: SEED_STAGE_1_ID, circuit_id: SEED_CIRCUIT_ID, registration_id: "reg-s1-2", user_id: 2, player_name: "Bezerra", points: 8, two_pointers: 2, three_pointers: 1, rebounds: 3, assists: 0, blocks_steals: 1, is_mvp: false },
];

function buildSeedLedger(): HpLedgerEntry[] {
  const preview = computeHomologationPreview({
    circuit: SEED_CIRCUITS[0],
    subEvent: SEED_SUB_EVENTS[0],
    registrations: SEED_REGISTRATIONS,
    matches: SEED_MATCHES,
  });
  return preview.rows
    .filter((r) => r.total_hp > 0)
    .map((r) => ({
      id: `ledger-seed-${r.registration_id}`,
      user_id: r.user_id,
      team_id: r.team_id,
      entry_scope: "individual",
      circuit_id: SEED_CIRCUIT_ID,
      sub_event_id: SEED_STAGE_1_ID,
      modality: "1x1",
      category: "open_masc",
      season_year: 2026,
      effective_tier: preview.effective_tier || "HEZI_100",
      final_placement: r.final_placement || 1,
      real_wins_count: r.real_wins_main,
      real_losses_count: r.real_losses_main,
      point_diff_sum: r.point_diff_sum,
      placement_hp: r.placement_hp,
      win_bonus_hp: r.win_bonus_hp,
      total_hp: r.total_hp,
      status: "active",
      revoke_reason: null,
      created_at: "2026-02-15T20:00:00Z",
      participant_name: r.participant_name,
      circuit_title: SEED_CIRCUITS[0].title,
      sub_event_title: SEED_SUB_EVENTS[0].title,
    }));
}

interface PartnerStoreState {
  partners: Partner[];
  circuits: PartnerCircuit[];
  subEvents: PartnerSubEvent[];
  registrations: PartnerRegistration[];
  matches: PartnerMatch[];
  playerStats: PartnerPlayerStat[];
  hpLedger: HpLedgerEntry[];
  badges: PartnerBadge[];

  // Partner Identity & Management
  createOrPromotePartner: (input: {
    user_id: number;
    name: string;
    bio?: string;
    instagram?: string;
  }) => { ok: boolean; partner?: Partner; error?: string };
  updatePartner: (id: string, patch: Partial<Partner>) => void;

  // Circuits
  createCircuit: (input: {
    partner_id: string;
    title: string;
    modality: PartnerModality;
    description?: string;
    rules_summary?: string;
  }) => { ok: boolean; circuit?: PartnerCircuit; error?: string };
  updateCircuit: (
    circuitId: string,
    patch: Partial<Pick<PartnerCircuit, "title" | "modality" | "description" | "rules_summary">>,
  ) => void;
  updateCircuitAdmin: (
    circuitId: string,
    patch: Partial<
      Pick<PartnerCircuit, "sanction_tier" | "status" | "pin_on_home" | "gp_participation_bonus">
    >,
  ) => void;

  // Sub-Events (Stages)
  createSubEvent: (input: {
    circuit_id: string;
    partner_id: string;
    title: string;
    category: CategoryCode;
    start_date: string;
    end_date: string;
    location: string;
    max_participants: number;
    has_third_place_match: boolean;
  }) => { ok: boolean; subEvent?: PartnerSubEvent; error?: string };
  updateSubEvent: (id: string, patch: Partial<PartnerSubEvent>) => void;

  // Registrations & Check-in
  registerParticipant: (input: {
    sub_event_id: string;
    circuit_id: string;
    user_id: number | null;
    team_id: string | null;
    participant_name: string;
    roster_checkins?: RosterCheckinItem[];
    contact_whatsapp?: string;
    instagram?: string;
    autoConfirm?: boolean;
  }) => { ok: boolean; error?: string };
  updateRegistration: (id: string, patch: Partial<PartnerRegistration>) => void;

  // Matches & Stats
  createMatch: (input: Omit<PartnerMatch, "id">) => PartnerMatch;
  updateMatch: (id: string, patch: Partial<PartnerMatch>) => void;
  upsertPlayerStat: (input: Omit<PartnerPlayerStat, "id">) => void;

  // Homologation & Revocation (Admin Master HEZI only)
  homologateSubEvent: (
    subEventId: string,
    adminUserId: number,
  ) => { ok: boolean; message: string };
  revokeLedgerEntry: (ledgerId: string, reason: string) => void;
}

export const usePartnerStore = create<PartnerStoreState>()(
  persist(
    (set, get) => ({
      partners: SEED_PARTNERS,
      circuits: SEED_CIRCUITS,
      subEvents: SEED_SUB_EVENTS,
      registrations: SEED_REGISTRATIONS,
      matches: SEED_MATCHES,
      playerStats: SEED_STATS,
      hpLedger: buildSeedLedger(),
      badges: [],

      createOrPromotePartner: ({ user_id, name, bio, instagram }) => {
        const cleanName = name.trim();
        if (!cleanName) {
          return { ok: false, error: "Informe o nome do projeto parceiro." };
        }
        const existing = get().partners.find((p) => p.user_id === user_id);
        if (existing) {
          set((s) => ({
            partners: s.partners.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    is_active: true,
                    name: cleanName,
                    bio: bio ?? p.bio,
                    instagram: instagram ?? p.instagram,
                  }
                : p,
            ),
          }));
          return { ok: true, partner: existing };
        }
        const slug = `${slugify(cleanName)}-${Date.now().toString().slice(-4)}`;
        const partner: Partner = {
          id: `partner-${Date.now()}`,
          user_id,
          name: cleanName,
          slug,
          bio: bio || "",
          instagram: instagram || "",
          logo_url: "",
          banner_url: "",
          is_active: true,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ partners: [partner, ...s.partners] }));
        return { ok: true, partner };
      },

      updatePartner: (id, patch) =>
        set((s) => ({
          partners: s.partners.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      createCircuit: ({ partner_id, title, modality, description, rules_summary }) => {
        const cleanTitle = title.trim();
        if (!cleanTitle) {
          return { ok: false, error: "Informe o título do circuito." };
        }
        const circuit: PartnerCircuit = {
          id: `circuit-${Date.now()}`,
          partner_id,
          title: cleanTitle,
          slug: `${slugify(cleanTitle)}-${Date.now().toString().slice(-4)}`,
          modality,
          sanction_tier: "HEZI_50", // Tier padrão até chancela do Admin HEZI
          description: description || "",
          rules_summary: rules_summary || "",
          status: "em_breve",
          pin_on_home: false,
          gp_participation_bonus: 15,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ circuits: [circuit, ...s.circuits] }));
        return { ok: true, circuit };
      },

      updateCircuitAdmin: (circuitId, patch) =>
        set((s) => ({
          circuits: s.circuits.map((c) =>
            c.id === circuitId ? { ...c, ...patch } : c,
          ),
        })),

      updateCircuit: (circuitId, patch) =>
        set((s) => ({
          circuits: s.circuits.map((c) =>
            c.id === circuitId ? { ...c, ...patch } : c,
          ),
        })),

      createSubEvent: (input) => {
        const cleanTitle = input.title.trim();
        if (!cleanTitle) {
          return { ok: false, error: "Informe o nome da etapa." };
        }
        const startMs = new Date(input.start_date).getTime();
        const endMs = new Date(input.end_date).getTime();
        if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
          return { ok: false, error: "Datas inválidas." };
        }
        // Trava 1: bloquear start_date retroativo (tolerância de 12h do mesmo dia)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (startMs < startOfToday.getTime()) {
          return {
            ok: false,
            error: "Não é permitido criar etapa com data retroativa.",
          };
        }
        if (endMs < startMs) {
          return {
            ok: false,
            error: "A data de término não pode ser anterior ao início.",
          };
        }
        // Trava 2: máximo 2 etapas homologáveis por mês no mesmo circuito
        const d = new Date(startMs);
        const yearMonth = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        const sameMonthStages = get().subEvents.filter((se) => {
          if (se.circuit_id !== input.circuit_id || se.status === "cancelada") {
            return false;
          }
          const sd = new Date(se.start_date);
          return `${sd.getUTCFullYear()}-${sd.getUTCMonth()}` === yearMonth;
        });
        if (sameMonthStages.length >= 2) {
          return {
            ok: false,
            error:
              "Limite atingido: máximo de 2 etapas por mês neste circuito.",
          };
        }

        const nextOrder =
          get().subEvents.filter((se) => se.circuit_id === input.circuit_id)
            .length + 1;

        const subEvent: PartnerSubEvent = {
          id: `stage-${Date.now()}`,
          circuit_id: input.circuit_id,
          partner_id: input.partner_id,
          title: cleanTitle,
          stage_order: nextOrder,
          category: input.category,
          sanction_tier_override: null,
          has_third_place_match: input.has_third_place_match,
          start_date: input.start_date,
          end_date: input.end_date,
          location: input.location.trim(),
          max_participants: Math.max(4, input.max_participants || 16),
          status: "aguardando_aprovacao",
          homologated_at: null,
          homologated_by: null,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ subEvents: [...s.subEvents, subEvent] }));
        return { ok: true, subEvent };
      },

      updateSubEvent: (id, patch) =>
        set((s) => ({
          subEvents: s.subEvents.map((se) =>
            se.id === id ? { ...se, ...patch } : se,
          ),
        })),

      registerParticipant: (input) => {
        const cleanName = input.participant_name.trim();
        if (!cleanName) {
          return { ok: false, error: "Informe o nome do participante ou time." };
        }
        const existingRegs = get().registrations.filter(
          (r) =>
            r.sub_event_id === input.sub_event_id &&
            r.approval_status !== "recusado",
        );

        // Regra: mesmo user_id não pode estar inscrito em dois times/inscrições na mesma etapa
        if (input.user_id) {
          const dupUser = existingRegs.some(
            (r) =>
              r.user_id === input.user_id ||
              r.roster_checkins.some((m) => m.user_id === input.user_id),
          );
          if (dupUser) {
            return {
              ok: false,
              error: "Este atleta já está inscrito nesta etapa.",
            };
          }
        }
        if (input.roster_checkins && input.roster_checkins.length > 0) {
          const memberIds = new Set(input.roster_checkins.map((m) => m.user_id));
          const conflict = existingRegs.some((r) =>
            r.roster_checkins.some((m) => memberIds.has(m.user_id)),
          );
          if (conflict) {
            return {
              ok: false,
              error:
                "Um dos atletas do elenco já está inscrito em outro time nesta etapa.",
            };
          }
        }

        const reg: PartnerRegistration = {
          id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sub_event_id: input.sub_event_id,
          circuit_id: input.circuit_id,
          user_id: input.user_id,
          team_id: input.team_id,
          participant_name: cleanName,
          roster_checkins: input.roster_checkins || [],
          checked_in: Boolean(input.autoConfirm),
          contact_whatsapp: input.contact_whatsapp || "",
          instagram: input.instagram || "",
          approval_status: input.autoConfirm ? "confirmado" : "pendente",
          final_placement: null,
        };
        set((s) => ({ registrations: [...s.registrations, reg] }));
        return { ok: true };
      },

      updateRegistration: (id, patch) =>
        set((s) => ({
          registrations: s.registrations.map((r) =>
            r.id === id ? { ...r, ...patch } : r,
          ),
        })),

      createMatch: (input) => {
        const match: PartnerMatch = {
          ...input,
          id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
        set((s) => ({ matches: [...s.matches, match] }));
        return match;
      },

      updateMatch: (id, patch) =>
        set((s) => ({
          matches: s.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      upsertPlayerStat: (input) =>
        set((s) => {
          const existing = s.playerStats.find(
            (st) =>
              st.match_id === input.match_id &&
              st.registration_id === input.registration_id &&
              st.player_name === input.player_name,
          );
          if (existing) {
            return {
              playerStats: s.playerStats.map((st) =>
                st.id === existing.id ? { ...st, ...input } : st,
              ),
            };
          }
          const created: PartnerPlayerStat = {
            ...input,
            id: `stat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          };
          return { playerStats: [...s.playerStats, created] };
        }),

      homologateSubEvent: (subEventId, adminUserId) => {
        const state = get();
        const subEvent = state.subEvents.find((se) => se.id === subEventId);
        if (!subEvent) return { ok: false, message: "Etapa não encontrada." };
        if (subEvent.status === "homologada") {
          return { ok: false, message: "Esta etapa já foi homologada." };
        }
        const circuit = state.circuits.find((c) => c.id === subEvent.circuit_id);
        if (!circuit) return { ok: false, message: "Circuito não encontrado." };

        const regs = state.registrations.filter(
          (r) => r.sub_event_id === subEventId,
        );
        const matches = state.matches.filter(
          (m) => m.sub_event_id === subEventId,
        );
        const heziStore = useHeziPlatform.getState();

        const preview = computeHomologationPreview({
          circuit,
          subEvent,
          registrations: regs,
          matches,
          isUserSubscriber: (uid) => {
            const u = heziStore.users.find((x) => x.id === uid);
            return u ? isActiveSubscriber(u) : false;
          },
        });

        const nowIso = new Date().toISOString();
        const seasonYear = new Date(subEvent.end_date).getFullYear() || 2026;
        const newLedgerEntries: HpLedgerEntry[] = [];
        const newBadges: PartnerBadge[] = [];

        const isChallenge =
          circuit.modality === "dunk" ||
          circuit.modality === "3pt" ||
          circuit.modality === "skills";
        const isTeamModality =
          circuit.modality === "3x3" || circuit.modality === "5x5";

        for (const row of preview.rows) {
          if (!row.checked_in) continue;

          // Creditar GP no Hezi Pass para todo atleta com check-in
          if (!isTeamModality && row.user_id) {
            const u = heziStore.users.find((x) => x.id === row.user_id);
            if (u) {
              const doubled = isActiveSubscriber(u);
              heziStore.updUser(u.id, {
                gp: (u.gp ?? 0) + row.gp_to_credit,
                gpHistory: [
                  {
                    id: `gp-partner-${subEventId}-${u.id}`,
                    amount: row.gp_to_credit,
                    baseAmount: circuit.gp_participation_bonus || 15,
                    reason: `${circuit.title} · ${subEvent.title}`,
                    date: new Date().toLocaleDateString("pt-BR"),
                    doubled,
                  },
                  ...(u.gpHistory || []),
                ],
              });
            }
          } else if (isTeamModality) {
            for (const m of row.roster_checked_in_users) {
              const u = heziStore.users.find((x) => x.id === m.user_id);
              if (u) {
                const doubled = isActiveSubscriber(u);
                const gpAmt = doubled
                  ? (circuit.gp_participation_bonus || 15) * 2
                  : circuit.gp_participation_bonus || 15;
                heziStore.updUser(u.id, {
                  gp: (u.gp ?? 0) + gpAmt,
                  gpHistory: [
                    {
                      id: `gp-partner-${subEventId}-${u.id}`,
                      amount: gpAmt,
                      baseAmount: circuit.gp_participation_bonus || 15,
                      reason: `${circuit.title} · ${subEvent.title}`,
                      date: new Date().toLocaleDateString("pt-BR"),
                      doubled,
                    },
                    ...(u.gpHistory || []),
                  ],
                });
              }
            }
          }

          if (isChallenge) {
            if (
              row.final_placement &&
              row.final_placement <= 3 &&
              row.user_id
            ) {
              newBadges.push({
                id: `badge-${subEventId}-${row.registration_id}`,
                user_id: row.user_id,
                sub_event_id: subEventId,
                badge_title: `${row.final_placement}º Lugar (${circuit.modality.toUpperCase()}) — ${subEvent.title}`,
                badge_type: circuit.modality,
                created_at: nowIso,
              });
            }
            continue;
          }

          if (
            preview.can_homologate_hp &&
            preview.effective_tier &&
            row.total_hp > 0 &&
            (circuit.modality === "1x1" ||
              circuit.modality === "3x3" ||
              circuit.modality === "5x5")
          ) {
            if (isTeamModality && row.team_id) {
              // 1) Lançamento coletivo do Time
              newLedgerEntries.push({
                id: `ledger-team-${subEventId}-${row.team_id}`,
                user_id: null,
                team_id: row.team_id,
                entry_scope: "team",
                circuit_id: circuit.id,
                sub_event_id: subEvent.id,
                modality: circuit.modality,
                category: subEvent.category,
                season_year: seasonYear,
                effective_tier: preview.effective_tier,
                final_placement: row.final_placement || 1,
                real_wins_count: row.real_wins_main,
                real_losses_count: row.real_losses_main,
                point_diff_sum: row.point_diff_sum,
                placement_hp: row.placement_hp,
                win_bonus_hp: row.win_bonus_hp,
                total_hp: row.total_hp,
                status: "active",
                revoke_reason: null,
                created_at: nowIso,
                participant_name: row.participant_name,
                circuit_title: circuit.title,
                sub_event_title: subEvent.title,
              });

              // 2) Lançamento individual para cada atleta presente no check-in do elenco
              for (const member of row.roster_checked_in_users) {
                newLedgerEntries.push({
                  id: `ledger-ind-${subEventId}-${member.user_id}`,
                  user_id: member.user_id,
                  team_id: row.team_id,
                  entry_scope: "individual",
                  circuit_id: circuit.id,
                  sub_event_id: subEvent.id,
                  modality: circuit.modality,
                  category: subEvent.category,
                  season_year: seasonYear,
                  effective_tier: preview.effective_tier,
                  final_placement: row.final_placement || 1,
                  real_wins_count: row.real_wins_main,
                  real_losses_count: row.real_losses_main,
                  point_diff_sum: row.point_diff_sum,
                  placement_hp: row.placement_hp,
                  win_bonus_hp: row.win_bonus_hp,
                  total_hp: row.total_hp,
                  status: "active",
                  revoke_reason: null,
                  created_at: nowIso,
                  participant_name: member.name,
                  circuit_title: circuit.title,
                  sub_event_title: subEvent.title,
                });
              }
            } else if (!isTeamModality && row.user_id) {
              newLedgerEntries.push({
                id: `ledger-ind-${subEventId}-${row.user_id}`,
                user_id: row.user_id,
                team_id: null,
                entry_scope: "individual",
                circuit_id: circuit.id,
                sub_event_id: subEvent.id,
                modality: circuit.modality,
                category: subEvent.category,
                season_year: seasonYear,
                effective_tier: preview.effective_tier,
                final_placement: row.final_placement || 1,
                real_wins_count: row.real_wins_main,
                real_losses_count: row.real_losses_main,
                point_diff_sum: row.point_diff_sum,
                placement_hp: row.placement_hp,
                win_bonus_hp: row.win_bonus_hp,
                total_hp: row.total_hp,
                status: "active",
                revoke_reason: null,
                created_at: nowIso,
                participant_name: row.participant_name,
                circuit_title: circuit.title,
                sub_event_title: subEvent.title,
              });
            }
          }
        }

        set((s) => ({
          subEvents: s.subEvents.map((se) =>
            se.id === subEventId
              ? {
                  ...se,
                  status: "homologada",
                  homologated_at: nowIso,
                  homologated_by: adminUserId,
                }
              : se,
          ),
          hpLedger: [...newLedgerEntries, ...s.hpLedger],
          badges: [...newBadges, ...s.badges],
        }));

        return {
          ok: true,
          message: `Etapa "${subEvent.title}" homologada! ${newLedgerEntries.length} lançamentos gravados no extrato oficial de HP.`,
        };
      },

      revokeLedgerEntry: (ledgerId, reason) =>
        set((s) => ({
          hpLedger: s.hpLedger.map((entry) =>
            entry.id === ledgerId
              ? {
                  ...entry,
                  status: "revoked",
                  revoke_reason: reason.trim() || "Desclassificação administrativa",
                }
              : entry,
          ),
        })),
    }),
    { name: "hezi-partners-v1" },
  ),
);
