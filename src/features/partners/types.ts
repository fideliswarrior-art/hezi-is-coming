export type PartnerModality = "1x1" | "3x3" | "5x5" | "dunk" | "3pt" | "skills";
export type HpModality = "1x1" | "3x3" | "5x5";
export type SanctionTier = "HEZI_50" | "HEZI_100" | "HEZI_250" | "HEZI_500" | "HEZI_1000";
export type CategoryCode = "open_masc" | "open_fem" | "u18_masc" | "u18_fem" | "u16";
export type CircuitStatus = "ativo" | "em_breve" | "encerrado";
export type SubEventStatus =
  | "aguardando_aprovacao"
  | "inscricoes_abertas"
  | "em_andamento"
  | "aguardando_homologacao"
  | "homologada"
  | "cancelada";

export type PartnerTier = "event_only" | "qualified";

export interface Partner {
  id: string;
  user_id: number;
  name: string;
  slug: string;
  bio: string;
  instagram: string;
  logo_url: string;
  banner_url: string;
  is_active: boolean;
  created_at: string;
  partner_tier?: PartnerTier;
  coach_user_id?: number | null;
  coach_display_name?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  training_schedule_summary?: string;
  whatsapp_contact?: string;
}

export interface PartnerTrainingSlot {
  id: string;
  partner_id: string;
  title: string;
  weekday: number; // 0=Dom .. 6=Sab
  start_time: string;
  end_time: string;
  max_capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface TrainingCheckin {
  id: string;
  partner_id: string;
  slot_id: string | null;
  user_id: number;
  session_date: string; // YYYY-MM-DD
  status: "pending" | "confirmed" | "rejected";
  gp_awarded: number;
  confirmed_by: number | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface OvrEvaluation {
  id: string;
  student_id: number;
  partner_id: string | null;
  evaluator_id: number;
  previous_ovr: number;
  calculated_ovr: number;
  final_ovr: number;
  coach_notes: string;
  created_at: string;
}

export interface PartnerApplication {
  id: string;
  project_name: string;
  contact_name: string;
  whatsapp: string;
  instagram: string;
  city_neighborhood: string;
  desired_tier: PartnerTier;
  message: string;
  status: "pendente" | "contatado" | "aprovado" | "recusado";
  created_at: string;
}

export interface EnrollmentRequest {
  id: string;
  partner_id: string;
  slot_id: string;
  slot_title: string;
  user_id: number;
  student_name: string;
  student_wpp: string;
  status: "pendente" | "aprovado" | "recusado";
  created_at: string;
}

export interface PartnerCircuit {
  id: string;
  partner_id: string;
  title: string;
  slug: string;
  modality: PartnerModality;
  sanction_tier: SanctionTier;
  description: string;
  rules_summary: string;
  status: CircuitStatus;
  pin_on_home: boolean;
  gp_participation_bonus: number;
  created_at: string;
}

export interface PartnerSubEvent {
  id: string;
  circuit_id: string;
  partner_id: string;
  title: string;
  stage_order: number;
  category: CategoryCode;
  sanction_tier_override: SanctionTier | null;
  has_third_place_match: boolean;
  start_date: string;
  end_date: string;
  location: string;
  max_participants: number;
  status: SubEventStatus;
  homologated_at: string | null;
  homologated_by: number | null;
  created_at: string;
}

export interface RosterCheckinItem {
  user_id: number;
  name: string;
  checked_in: boolean;
}

export interface PartnerRegistration {
  id: string;
  sub_event_id: string;
  circuit_id: string;
  user_id: number | null;
  team_id: string | null;
  participant_name: string;
  roster_checkins: RosterCheckinItem[];
  checked_in: boolean;
  contact_whatsapp: string;
  instagram: string;
  cpf?: string;
  approval_status: "pendente" | "confirmado" | "recusado" | "desclassificado";
  final_placement: number | null;
}

export interface PartnerMatch {
  id: string;
  sub_event_id: string;
  round_name: string;
  bracket_type: "main_draw" | "repechage" | "consolation";
  is_final: boolean;
  is_third_place: boolean;
  player_a_id: string;
  player_b_id: string | null;
  score_a: number;
  score_b: number;
  winner_id: string | null;
  result_type: "played" | "wo" | "bye";
  status: "agendado" | "ao_vivo" | "finalizado";
}

export interface PartnerPlayerStat {
  id: string;
  match_id: string;
  sub_event_id: string;
  circuit_id: string;
  registration_id: string;
  user_id: number | null;
  player_name: string;
  points: number;
  two_pointers: number;
  three_pointers: number;
  rebounds: number;
  assists: number;
  blocks_steals: number;
  is_mvp: boolean;
}

export interface HpLedgerEntry {
  id: string;
  user_id: number | null;
  team_id: string | null;
  entry_scope: "individual" | "team";
  circuit_id: string;
  sub_event_id: string;
  modality: HpModality;
  category: CategoryCode;
  season_year: number;
  effective_tier: SanctionTier;
  final_placement: number;
  real_wins_count: number;
  real_losses_count: number;
  point_diff_sum: number;
  placement_hp: number;
  win_bonus_hp: number;
  total_hp: number;
  status: "active" | "revoked";
  revoke_reason: string | null;
  created_at: string;
  // Optional display snapshot
  participant_name?: string;
  circuit_title?: string;
  sub_event_title?: string;
}

export interface PartnerBadge {
  id: string;
  user_id: number;
  sub_event_id: string;
  badge_title: string;
  badge_type: string;
  created_at: string;
}

export interface HomologationPreviewRow {
  registration_id: string;
  participant_name: string;
  user_id: number | null;
  team_id: string | null;
  checked_in: boolean;
  final_placement: number | null;
  real_wins_main: number;
  real_losses_main: number;
  point_diff_sum: number;
  placement_hp: number;
  win_bonus_hp: number;
  total_hp: number;
  gp_to_credit: number;
  roster_checked_in_users: RosterCheckinItem[];
  note: string;
}

export interface HomologationPreviewResult {
  can_homologate_hp: boolean;
  checked_in_count: number;
  requested_tier: SanctionTier;
  effective_tier: SanctionTier | null;
  downgrade_reasons: string[];
  stage_win_cap: number;
  rows: HomologationPreviewRow[];
}
