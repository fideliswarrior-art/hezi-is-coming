import type {
  CategoryCode,
  HpLedgerEntry,
  HpModality,
} from "@/features/partners/types";

export type RankingModalityTab = "all_around" | "1x1" | "3x3" | "5x5" | "teams";
export type RankingPeriodFilter = "current_season" | "previous_years" | "all_time";

export interface RankedEntity {
  key: string;
  user_id: number | null;
  team_id: string | null;
  display_name: string;
  total_hp: number;
  titles_count: number;
  best_single_stage_hp: number;
  real_wins: number;
  real_losses: number;
  win_rate: number;
  avg_point_diff: number;
  stages_played: number;
  entries: HpLedgerEntry[];
}

export function computeOfficialHpRanking(params: {
  ledger: HpLedgerEntry[];
  modalityTab: RankingModalityTab;
  teamFilter?: "3x3" | "5x5";
  period: RankingPeriodFilter;
  category: CategoryCode | "all";
  currentYear?: number;
  resolveName?: (userId: number | null, teamId: string | null, fallback?: string) => string;
}): RankedEntity[] {
  const {
    ledger,
    modalityTab,
    teamFilter = "3x3",
    period,
    category,
    currentYear = new Date().getFullYear(),
    resolveName,
  } = params;

  const isTeamScope = modalityTab === "teams";

  const filtered = ledger.filter((e) => {
    if (e.status !== "active") return false;
    if (isTeamScope) {
      if (e.entry_scope !== "team") return false;
      if (e.modality !== teamFilter) return false;
    } else {
      if (e.entry_scope !== "individual") return false;
      if (modalityTab !== "all_around" && e.modality !== (modalityTab as HpModality)) {
        return false;
      }
    }

    if (period === "current_season" && e.season_year !== currentYear) {
      return false;
    }
    if (period === "previous_years" && e.season_year >= currentYear) {
      return false;
    }
    if (category !== "all" && e.category !== category) {
      return false;
    }
    return true;
  });

  const grouped = new Map<
    string,
    {
      user_id: number | null;
      team_id: string | null;
      display_name: string;
      total_hp: number;
      titles_count: number;
      best_single_stage_hp: number;
      real_wins: number;
      real_losses: number;
      point_diff_sum: number;
      stages: Set<string>;
      entries: HpLedgerEntry[];
    }
  >();

  for (const e of filtered) {
    const key = isTeamScope ? `team:${e.team_id}` : `user:${e.user_id}`;
    const existing = grouped.get(key) || {
      user_id: e.user_id,
      team_id: e.team_id,
      display_name:
        resolveName?.(e.user_id, e.team_id, e.participant_name) ||
        e.participant_name ||
        "Atleta",
      total_hp: 0,
      titles_count: 0,
      best_single_stage_hp: 0,
      real_wins: 0,
      real_losses: 0,
      point_diff_sum: 0,
      stages: new Set<string>(),
      entries: [],
    };

    existing.total_hp += e.total_hp;
    if (e.final_placement === 1) existing.titles_count += 1;
    if (e.total_hp > existing.best_single_stage_hp) {
      existing.best_single_stage_hp = e.total_hp;
    }
    existing.real_wins += e.real_wins_count;
    existing.real_losses += e.real_losses_count;
    existing.point_diff_sum += e.point_diff_sum;
    existing.stages.add(e.sub_event_id);
    existing.entries.push(e);

    grouped.set(key, existing);
  }

  const list: RankedEntity[] = Array.from(grouped.entries()).map(
    ([key, g]) => {
      const totalGames = g.real_wins + g.real_losses;
      return {
        key,
        user_id: g.user_id,
        team_id: g.team_id,
        display_name: g.display_name,
        total_hp: g.total_hp,
        titles_count: g.titles_count,
        best_single_stage_hp: g.best_single_stage_hp,
        real_wins: g.real_wins,
        real_losses: g.real_losses,
        win_rate: totalGames > 0 ? g.real_wins / totalGames : 0,
        avg_point_diff: totalGames > 0 ? g.point_diff_sum / totalGames : 0,
        stages_played: g.stages.size,
        entries: g.entries.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      };
    },
  );

  // Cadeia oficial de desempate:
  // 1. total_hp DESC
  // 2. titles_count DESC
  // 3. best_single_stage_hp DESC
  // 4. win_rate DESC
  // 5. avg_point_diff DESC
  // 6. stages_played ASC
  list.sort((a, b) => {
    if (b.total_hp !== a.total_hp) return b.total_hp - a.total_hp;
    if (b.titles_count !== a.titles_count) return b.titles_count - a.titles_count;
    if (b.best_single_stage_hp !== a.best_single_stage_hp) {
      return b.best_single_stage_hp - a.best_single_stage_hp;
    }
    if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
    if (b.avg_point_diff !== a.avg_point_diff) {
      return b.avg_point_diff - a.avg_point_diff;
    }
    if (a.stages_played !== b.stages_played) {
      return a.stages_played - b.stages_played;
    }
    return a.display_name.localeCompare(b.display_name, "pt-BR");
  });

  return list;
}
