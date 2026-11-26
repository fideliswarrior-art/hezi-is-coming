import {
  HP_TABLE,
  downgradeTierOneStep,
  isChallengeModality,
  type PlacementBracketKey,
} from "../constants/hpTable";
import type {
  HomologationPreviewResult,
  HomologationPreviewRow,
  PartnerCircuit,
  PartnerMatch,
  PartnerRegistration,
  PartnerSubEvent,
  SanctionTier,
} from "../types";

function getPlacementKey(
  placement: number | null,
  hasThirdPlaceMatch: boolean,
): PlacementBracketKey {
  if (!placement || placement <= 0) return "zero";
  if (placement === 1) return "1";
  if (placement === 2) return "2";
  if (placement === 3) return hasThirdPlaceMatch ? "3_match" : "semi_no_3rd";
  if (placement === 4) return hasThirdPlaceMatch ? "4_match" : "semi_no_3rd";
  if (placement >= 5 && placement <= 8) return "5_8";
  if (placement >= 9 && placement <= 16) return "9_16";
  return "17_plus";
}

export function computeHomologationPreview(params: {
  circuit: PartnerCircuit;
  subEvent: PartnerSubEvent;
  registrations: PartnerRegistration[];
  matches: PartnerMatch[];
  isUserSubscriber?: (userId: number) => boolean;
}): HomologationPreviewResult {
  const { circuit, subEvent, registrations, matches, isUserSubscriber } = params;

  const requestedTier: SanctionTier =
    subEvent.sanction_tier_override || circuit.sanction_tier || "HEZI_50";

  const isTeamModality = circuit.modality === "3x3" || circuit.modality === "5x5";
  const isChallenge = isChallengeModality(circuit.modality);

  const isRegCheckedIn = (reg: PartnerRegistration): boolean => {
    if (reg.approval_status === "recusado" || reg.approval_status === "desclassificado") {
      return false;
    }
    if (isTeamModality) {
      return reg.checked_in || reg.roster_checkins.some((m) => m.checked_in);
    }
    return reg.checked_in;
  };

  const checkedInRegs = registrations.filter(isRegCheckedIn);
  const N = checkedInRegs.length;

  const downgradeReasons: string[] = [];
  let effectiveTier: SanctionTier | null = requestedTier;
  let canHomologateHp = !isChallenge && N >= 4;

  if (isChallenge) {
    effectiveTier = null;
    downgradeReasons.push(
      "Modalidade de desafio (Dunk / 3PT / Skills) não gera Hezi Points (apenas Badges e GP).",
    );
  } else if (N < 4) {
    effectiveTier = null;
    downgradeReasons.push(
      `Menos de 4 inscritos com check-in (N=${N}): etapa não gera HP, apenas GP de presença.`,
    );
  } else {
    // Trava 4 <= N <= 7: downgrade -1 tier com piso HEZI_50
    if (N >= 4 && N <= 7) {
      const downgraded = downgradeTierOneStep(effectiveTier);
      if (downgraded !== effectiveTier) {
        downgradeReasons.push(
          `Chave reduzida (${N} inscritos): downgrade de ${effectiveTier} para ${downgraded}.`,
        );
      } else {
        downgradeReasons.push(
          `Chave reduzida (${N} inscritos): apenas 1º e 2º${subEvent.has_third_place_match ? " (e 3º se venceu disputa)" : ""} pontuam.`,
        );
      }
      effectiveTier = downgraded;
    }

    // Trava Anti-Pelada (> 7 dias): downgrade automático para HEZI_50
    const startMs = new Date(subEvent.start_date).getTime();
    const endMs = new Date(subEvent.end_date).getTime();
    const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(diffDays) && diffDays > 7) {
      if (effectiveTier !== "HEZI_50") {
        downgradeReasons.push(
          "Duração superior a 7 dias (Trava Anti-Pelada): downgrade para HEZI_50.",
        );
      }
      effectiveTier = "HEZI_50";
    }
  }

  const finishedMainMatches = matches.filter(
    (m) => m.status === "finalizado" && m.bracket_type === "main_draw",
  );

  // Build per-registration stats from main_draw finished matches
  const statsByReg = new Map<
    string,
    {
      realWinsMain: number;
      realLossesMain: number;
      pointDiffSum: number;
      woFinalWin: boolean;
      wonThirdPlacePlayed: boolean;
    }
  >();

  for (const reg of registrations) {
    statsByReg.set(reg.id, {
      realWinsMain: 0,
      realLossesMain: 0,
      pointDiffSum: 0,
      woFinalWin: false,
      wonThirdPlacePlayed: false,
    });
  }

  for (const m of finishedMainMatches) {
    if (m.result_type === "bye") continue; // BYE nunca conta como vitória

    const statA = statsByReg.get(m.player_a_id);
    const statB = m.player_b_id ? statsByReg.get(m.player_b_id) : undefined;

    if (m.result_type === "wo") {
      if (m.is_final && m.winner_id) {
        const winStat = statsByReg.get(m.winner_id);
        if (winStat) winStat.woFinalWin = true;
      }
      continue; // W.O. nunca soma +2 HP nem saldo de pontos
    }

    // result_type === 'played'
    if (m.winner_id === m.player_a_id) {
      if (statA) {
        statA.realWinsMain += 1;
        statA.pointDiffSum += m.score_a - m.score_b;
        if (m.is_third_place) statA.wonThirdPlacePlayed = true;
      }
      if (statB) {
        statB.realLossesMain += 1;
        statB.pointDiffSum += m.score_b - m.score_a;
      }
    } else if (m.player_b_id && m.winner_id === m.player_b_id) {
      if (statB) {
        statB.realWinsMain += 1;
        statB.pointDiffSum += m.score_b - m.score_a;
        if (m.is_third_place) statB.wonThirdPlacePlayed = true;
      }
      if (statA) {
        statA.realLossesMain += 1;
        statA.pointDiffSum += m.score_a - m.score_b;
      }
    }
  }

  const championReg = checkedInRegs.find((r) => r.final_placement === 1);
  const championWins = championReg
    ? statsByReg.get(championReg.id)?.realWinsMain ?? 0
    : 0;
  const stageWinCap = Math.min(5, championWins);

  const rows: HomologationPreviewRow[] = registrations.map((reg) => {
    const st = statsByReg.get(reg.id) || {
      realWinsMain: 0,
      realLossesMain: 0,
      pointDiffSum: 0,
      woFinalWin: false,
      wonThirdPlacePlayed: false,
    };

    const checkedIn = isRegCheckedIn(reg);
    const rosterCheckedInUsers = isTeamModality
      ? reg.roster_checkins.filter((m) => m.checked_in)
      : [];

    const baseGp = circuit.gp_participation_bonus ?? 15;
    let gpToCredit = 0;
    if (checkedIn) {
      if (!isTeamModality && reg.user_id) {
        gpToCredit = isUserSubscriber?.(reg.user_id) ? baseGp * 2 : baseGp;
      } else {
        gpToCredit = baseGp;
      }
    }

    let placementHp = 0;
    let winBonusHp = 0;
    let note = "";

    if (!checkedIn) {
      note =
        reg.approval_status === "desclassificado"
          ? "Desclassificado (0 HP / 0 GP)"
          : "Sem check-in presencial (0 HP / 0 GP)";
    } else if (!canHomologateHp || !effectiveTier) {
      note = isChallenge
        ? "Desafio especial (apenas Badge + GP)"
        : "Chave < 4 inscritos (apenas GP)";
    } else if (st.realWinsMain === 0 && !st.woFinalWin) {
      note = "0 vitórias reais (regra Venceu, Pontuou)";
    } else {
      const p = reg.final_placement;
      let eligibleByDepth = true;

      if (N >= 4 && N <= 7) {
        if (p === 1 || p === 2) {
          eligibleByDepth = true;
        } else if (p === 3 && subEvent.has_third_place_match && st.wonThirdPlacePlayed) {
          eligibleByDepth = true;
        } else {
          eligibleByDepth = false;
          note = "Fora da zona de pontuação (chave 4–7)";
        }
      } else if (N >= 8 && N <= 15) {
        if (!p || p > 4) {
          eligibleByDepth = false;
          note = "Fora da zona de pontuação (chave 8–15: até 4º/Semi)";
        }
      }

      if (eligibleByDepth) {
        const key = getPlacementKey(p, subEvent.has_third_place_match);
        placementHp = HP_TABLE[key][effectiveTier];
        winBonusHp = Math.min(st.realWinsMain, stageWinCap) * 2;
        note = "Homologável";
      }
    }

    return {
      registration_id: reg.id,
      participant_name: reg.participant_name,
      user_id: reg.user_id,
      team_id: reg.team_id,
      checked_in: checkedIn,
      final_placement: reg.final_placement,
      real_wins_main: st.realWinsMain,
      real_losses_main: st.realLossesMain,
      point_diff_sum: st.pointDiffSum,
      placement_hp: placementHp,
      win_bonus_hp: winBonusHp,
      total_hp: placementHp + winBonusHp,
      gp_to_credit: gpToCredit,
      roster_checked_in_users: rosterCheckedInUsers,
      note,
    };
  });

  rows.sort((a, b) => {
    const pa = a.final_placement ?? 999;
    const pb = b.final_placement ?? 999;
    if (pa !== pb) return pa - pb;
    return b.total_hp - a.total_hp;
  });

  return {
    can_homologate_hp: canHomologateHp,
    checked_in_count: N,
    requested_tier: requestedTier,
    effective_tier: effectiveTier,
    downgrade_reasons: downgradeReasons,
    stage_win_cap: stageWinCap,
    rows,
  };
}
