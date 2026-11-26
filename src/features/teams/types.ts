export type TeamModality = "3x3" | "5x5";

export interface OfficialTeam {
  id: string;
  name: string;
  slug: string;
  modality: TeamModality;
  captain_user_id: number;
  logo_url: string;
  season_year: number;
  swaps_used: number;
  created_at: string;
}

export interface TeamRosterMember {
  id: string;
  team_id: string;
  user_id: number;
  season_year: number;
  modality: TeamModality;
  is_active: boolean;
  joined_at: string;
}

export const TEAM_MAX_ROSTER: Record<TeamModality, number> = {
  "3x3": 5,
  "5x5": 8,
};

export const TEAM_MAX_SWAPS_PER_SEASON = 2;

export interface TeamRequest {
  id: string;
  name: string;
  modality: TeamModality;
  captain_user_id: number;
  logo_url: string;
  initial_member_ids: number[];
  status: "pendente" | "aprovado" | "recusado";
  created_at: string;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  reject_reason?: string | null;
}
