import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { useHeziPlatform, useHeziSession } from "@/lib/hezi/store";
import { useTeamStore } from "@/features/teams/services/teamService";
import { CATEGORY_LABELS, MODALITY_LABELS, TIER_LABELS } from "../constants/hpTable";
import { usePartnerStore } from "../services/partnerService";
import type { PartnerMatch, PartnerRegistration } from "../types";

export function PartnerHubPage({ slug }: { slug: string }) {
  const sid = useHeziSession((s) => s.sid);
  const users = useHeziPlatform((s) => s.users);
  const me = typeof sid === "number" ? users.find((u) => u.id === sid) || null : null;
  const partners = usePartnerStore((s) => s.partners);
  const circuits = usePartnerStore((s) => s.circuits);
  const subEvents = usePartnerStore((s) => s.subEvents);
  const registrations = usePartnerStore((s) => s.registrations);
  const matches = usePartnerStore((s) => s.matches);
  const playerStats = usePartnerStore((s) => s.playerStats);
  const hpLedger = usePartnerStore((s) => s.hpLedger);
  const registerParticipant = usePartnerStore((s) => s.registerParticipant);

  const officialTeams = useTeamStore((s) => s.teams);
  const rosterMembers = useTeamStore((s) => s.rosterMembers);
  const allUsers = useHeziPlatform((s) => s.users);

  const circuit = circuits.find((c) => c.slug === slug);
  const partner = circuit
    ? partners.find((p) => p.id === circuit.partner_id)
    : undefined;

  const [tab, setTab] = useState<"etapas" | "jogos" | "etapa_rank" | "geral">("etapas");
  const stages = useMemo(
    () =>
      circuit
        ? subEvents
            .filter((se) => se.circuit_id === circuit.id)
            .sort((a, b) => a.stage_order - b.stage_order)
        : [],
    [circuit, subEvents],
  );

  const [selectedStageId, setSelectedStageId] = useState<string>(
    stages[0]?.id || "",
  );
  const currentStageId =
    stages.some((s) => s.id === selectedStageId) ? selectedStageId : stages[0]?.id || "";
  const currentStage = stages.find((s) => s.id === currentStageId);

  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [regModalStageId, setRegModalStageId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestWpp, setGuestWpp] = useState("");
  const [guestInsta, setGuestInsta] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  if (!circuit || !partner) {
    return (
      <div className="min-h-dvh bg-[#F8F9FA] p-6 flex flex-col items-center justify-center text-center space-y-3">
        <p className="font-extrabold text-lg text-[#111317]">
          Circuito não encontrado
        </p>
        <Link
          to="/"
          className="rounded-xl bg-[#FF5400] text-white font-extrabold text-sm px-4 py-2.5"
        >
          Voltar para a Home
        </Link>
      </div>
    );
  }

  const isTeamModality = circuit.modality === "3x3" || circuit.modality === "5x5";

  // Ranking da Etapa: 1. H2H -> 2. Saldo de Pontos (SP) -> 3. Pontos Pró (PP)
  const stageRanking = useMemo(() => {
    if (!currentStage) return [];
    const stageRegs = registrations.filter(
      (r) =>
        r.sub_event_id === currentStage.id &&
        r.approval_status === "confirmado",
    );
    const stageMatches = matches.filter(
      (m) =>
        m.sub_event_id === currentStage.id &&
        m.status === "finalizado" &&
        m.result_type === "played",
    );

    const calcMap = new Map<
      string,
      {
        reg: PartnerRegistration;
        wins: number;
        losses: number;
        pf: number;
        pa: number;
        hp: number;
      }
    >();
    for (const r of stageRegs) {
      const ledgerRow = hpLedger.find(
        (l) =>
          l.sub_event_id === currentStage.id &&
          l.status === "active" &&
          ((isTeamModality && l.entry_scope === "team" && l.team_id === r.team_id) ||
            (!isTeamModality && l.entry_scope === "individual" && l.user_id === r.user_id)),
      );
      calcMap.set(r.id, {
        reg: r,
        wins: 0,
        losses: 0,
        pf: 0,
        pa: 0,
        hp: ledgerRow?.total_hp ?? 0,
      });
    }

    for (const m of stageMatches) {
      const a = calcMap.get(m.player_a_id);
      const b = m.player_b_id ? calcMap.get(m.player_b_id) : undefined;
      if (a && b) {
        a.pf += m.score_a;
        a.pa += m.score_b;
        b.pf += m.score_b;
        b.pa += m.score_a;
        if (m.winner_id === m.player_a_id) {
          a.wins += 1;
          b.losses += 1;
        } else if (m.winner_id === m.player_b_id) {
          b.wins += 1;
          a.losses += 1;
        }
      }
    }

    const items = Array.from(calcMap.values());
    items.sort((x, y) => {
      const px = x.reg.final_placement ?? 999;
      const py = y.reg.final_placement ?? 999;
      if (px !== py) return px - py;
      if (y.wins !== x.wins) return y.wins - x.wins;
      // 1. H2H
      const h2h = stageMatches.find(
        (m: PartnerMatch) =>
          (m.player_a_id === x.reg.id && m.player_b_id === y.reg.id) ||
          (m.player_a_id === y.reg.id && m.player_b_id === x.reg.id),
      );
      if (h2h && h2h.winner_id) {
        if (h2h.winner_id === x.reg.id) return -1;
        if (h2h.winner_id === y.reg.id) return 1;
      }
      // 2. Saldo de Pontos (SP)
      const spX = x.pf - x.pa;
      const spY = y.pf - y.pa;
      if (spY !== spX) return spY - spX;
      // 3. Pontos Pró (PP)
      return y.pf - x.pf;
    });
    return items;
  }, [currentStage, registrations, matches, hpLedger, isTeamModality]);

  // Ranking Geral do Circuito via hp_ledger
  const circuitRanking = useMemo(() => {
    const scope = isTeamModality ? "team" : "individual";
    const rows = hpLedger.filter(
      (l) =>
        l.circuit_id === circuit.id &&
        l.status === "active" &&
        l.entry_scope === scope,
    );
    const map = new Map<
      string,
      { name: string; total_hp: number; wins: number; stages: number }
    >();
    for (const l of rows) {
      const key = isTeamModality ? `t:${l.team_id}` : `u:${l.user_id}`;
      const prev = map.get(key) || {
        name: l.participant_name || "Atleta",
        total_hp: 0,
        wins: 0,
        stages: 0,
      };
      prev.total_hp += l.total_hp;
      prev.wins += l.real_wins_count;
      prev.stages += 1;
      map.set(key, prev);
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.total_hp - a.total_hp || b.wins - a.wins);
  }, [hpLedger, circuit.id, isTeamModality]);

  // Líderes Estatísticos do Circuito
  const statLeaders = useMemo(() => {
    const cStats = playerStats.filter((s) => s.circuit_id === circuit.id);
    const agg = new Map<
      string,
      { name: string; pts: number; threes: number; def: number; mvps: number }
    >();
    for (const s of cStats) {
      const key = s.user_id ? `u:${s.user_id}` : s.player_name;
      const prev = agg.get(key) || {
        name: s.player_name,
        pts: 0,
        threes: 0,
        def: 0,
        mvps: 0,
      };
      prev.pts += s.points;
      prev.threes += s.three_pointers;
      prev.def += s.blocks_steals;
      if (s.is_mvp) prev.mvps += 1;
      agg.set(key, prev);
    }
    const list = Array.from(agg.values());
    return {
      topScorer: [...list].sort((a, b) => b.pts - a.pts)[0],
      topThree: [...list].sort((a, b) => b.threes - a.threes)[0],
      topDef: [...list].sort((a, b) => b.def - a.def)[0],
      topMvp: [...list].sort((a, b) => b.mvps - a.mvps)[0],
    };
  }, [playerStats, circuit.id]);

  const handleConfirmRegistration = (stageId: string) => {
    if (isTeamModality) {
      const team = officialTeams.find((t) => t.id === selectedTeamId);
      if (!team) {
        setFeedback({ ok: false, msg: "Selecione um Time Oficial para inscrever." });
        return;
      }
      const members = rosterMembers
        .filter((m) => m.team_id === team.id && m.is_active)
        .map((m) => {
          const usr = allUsers.find((u) => u.id === m.user_id);
          return {
            user_id: m.user_id,
            name: usr?.apelido?.trim() || usr?.nome || `Atleta #${m.user_id}`,
            checked_in: false,
          };
        });
      const res = registerParticipant({
        sub_event_id: stageId,
        circuit_id: circuit.id,
        user_id: null,
        team_id: team.id,
        participant_name: team.name,
        roster_checkins: members,
        contact_whatsapp: me?.wpp || "",
        instagram: me?.instagram || "",
      });
      setFeedback(
        res.ok
          ? { ok: true, msg: "Inscrição do time enviada! Aguardando confirmação." }
          : { ok: false, msg: res.error || "Erro ao inscrever." },
      );
      if (res.ok) setRegModalStageId(null);
      return;
    }

    const name = me ? me.apelido?.trim() || me.nome : guestName.trim();
    const wpp = me?.wpp || guestWpp.trim();
    const insta = me?.instagram || guestInsta.trim();
    const res = registerParticipant({
      sub_event_id: stageId,
      circuit_id: circuit.id,
      user_id: me?.id ?? null,
      team_id: null,
      participant_name: name,
      contact_whatsapp: wpp,
      instagram: insta,
    });
    setFeedback(
      res.ok
        ? { ok: true, msg: "Inscrição enviada ao organizador!" }
        : { ok: false, msg: res.error || "Erro ao inscrever." },
    );
    if (res.ok) setRegModalStageId(null);
  };

  return (
    <div className="min-h-dvh bg-[#F8F9FA] text-[#111317] pb-12">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6E7381] hover:text-[#111317]"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a HEZI
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase bg-[#FFF4EE] text-[#FF5400] px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            CHANCELA OFICIAL HEZI FAM® · {TIER_LABELS[circuit.sanction_tier]}
          </span>
        </div>

        {/* Partner Header */}
        <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3.5">
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt={partner.name}
                className="w-14 h-14 rounded-2xl object-cover border border-[#EAEBEF]"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#111317] text-[#FF5400] flex items-center justify-center shrink-0">
                <Trophy className="w-7 h-7" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#FF5400]">
                {partner.name} {partner.instagram ? `· ${partner.instagram}` : ""}
              </p>
              <h1 className="font-extrabold text-xl sm:text-2xl text-[#111317]">
                {circuit.title}
              </h1>
              <p className="text-xs text-[#6E7381] mt-0.5">
                Modalidade: {MODALITY_LABELS[circuit.modality]} · Bônus presença:{" "}
                +{circuit.gp_participation_bonus} GP
              </p>
            </div>
          </div>
          {circuit.description && (
            <p className="text-sm text-[#6E7381]">{circuit.description}</p>
          )}
        </div>

        {feedback && (
          <div
            className={`rounded-xl p-3 text-xs font-bold ${
              feedback.ok
                ? "bg-[#ECFDF5] text-[#10B981] border border-[#10B981]"
                : "bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* 4 Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              ["etapas", "Etapas"],
              ["jogos", "Jogos & Placares"],
              ["etapa_rank", "Ranking da Etapa"],
              ["geral", "Ranking Geral"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`min-h-[44px] rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                tab === k
                  ? "bg-[#111317] text-white"
                  : "bg-white border border-[#EAEBEF] text-[#6E7381] hover:text-[#111317]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: ETAPAS */}
        {tab === "etapas" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stages.map((st) => {
              const count = registrations.filter(
                (r) =>
                  r.sub_event_id === st.id && r.approval_status !== "recusado",
              ).length;
              return (
                <div
                  key={st.id}
                  className="bg-white border border-[#EAEBEF] rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#FF5400]">
                        {CATEGORY_LABELS[st.category]} ·{" "}
                        {TIER_LABELS[st.sanction_tier_override || circuit.sanction_tier]}
                      </span>
                      <h3 className="font-extrabold text-base text-[#111317]">
                        {st.title}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        st.status === "homologada"
                          ? "bg-[#ECFDF5] text-[#10B981]"
                          : st.status === "inscricoes_abertas"
                            ? "bg-[#FFF4EE] text-[#FF5400]"
                            : "bg-[#F4F5F7] text-[#6E7381]"
                      }`}
                    >
                      {st.status === "inscricoes_abertas"
                        ? "Inscrições Abertas"
                        : st.status === "em_andamento"
                          ? "Em Andamento"
                          : st.status === "aguardando_homologacao"
                            ? "Aguardando Homologação HEZI (HP)"
                            : st.status === "homologada"
                              ? "Homologada ✓"
                              : st.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#6E7381] space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF5400]" />
                      {new Date(st.start_date).toLocaleDateString("pt-BR")}
                    </p>
                    {st.location && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5400]" />
                        {st.location}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#FF5400]" />
                      {count}/{st.max_participants} inscritos
                    </p>
                  </div>

                  {st.status === "inscricoes_abertas" && (
                    <>
                      {regModalStageId === st.id ? (
                        <div className="bg-[#F4F5F7] rounded-xl p-3 space-y-2.5">
                          {isTeamModality ? (
                            <>
                              <label className="block text-xs font-bold text-[#111317]">
                                Selecione seu Time Oficial ({circuit.modality})
                              </label>
                              <select
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                className="w-full min-h-[42px] bg-white rounded-xl px-3 text-xs font-bold border border-[#EAEBEF]"
                              >
                                <option value="">Escolha um time...</option>
                                {officialTeams
                                  .filter((t) => t.modality === circuit.modality)
                                  .map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                              </select>
                            </>
                          ) : !me ? (
                            <div className="space-y-2">
                              <input
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="Nome completo (ex: João Silva)"
                                className="w-full min-h-[40px] bg-white rounded-xl px-3 text-xs border border-[#EAEBEF]"
                              />
                              <input
                                value={guestWpp}
                                onChange={(e) => setGuestWpp(e.target.value)}
                                placeholder="WhatsApp com DDD"
                                className="w-full min-h-[40px] bg-white rounded-xl px-3 text-xs border border-[#EAEBEF]"
                              />
                              <input
                                value={guestInsta}
                                onChange={(e) => setGuestInsta(e.target.value)}
                                placeholder="@instagram"
                                className="w-full min-h-[40px] bg-white rounded-xl px-3 text-xs border border-[#EAEBEF]"
                              />
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-[#111317]">
                              Inscrever como:{" "}
                              <span className="text-[#FF5400]">
                                {me.apelido?.trim() || me.nome}
                              </span>
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleConfirmRegistration(st.id)}
                              className="flex-1 min-h-[40px] rounded-xl bg-[#FF5400] text-white text-xs font-extrabold"
                            >
                              Confirmar inscrição
                            </button>
                            <button
                              type="button"
                              onClick={() => setRegModalStageId(null)}
                              className="min-h-[40px] px-3 rounded-xl bg-white text-xs font-bold text-[#6E7381]"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRegModalStageId(st.id)}
                          className="w-full min-h-[44px] rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white text-xs font-extrabold transition"
                        >
                          INSCREVER-SE
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stage Selector for Tabs 2 & 3 */}
        {(tab === "jogos" || tab === "etapa_rank") && stages.length > 0 && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-3 flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#6E7381]">Etapa:</span>
            <select
              value={currentStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="flex-1 min-h-[40px] bg-[#F4F5F7] rounded-xl px-3 text-xs font-extrabold text-[#111317]"
            >
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* TAB 2: JOGOS & PLACARES */}
        {tab === "jogos" && currentStage && (
          <div className="space-y-2.5">
            {matches
              .filter((m) => m.sub_event_id === currentStage.id)
              .map((m) => {
                const regA = registrations.find((r) => r.id === m.player_a_id);
                const regB = m.player_b_id
                  ? registrations.find((r) => r.id === m.player_b_id)
                  : undefined;
                const isOpen = expandedMatchId === m.id;
                const mStats = playerStats.filter((st) => st.match_id === m.id);
                return (
                  <div
                    key={m.id}
                    className="bg-white border border-[#EAEBEF] rounded-2xl p-4 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-[#6E7381]">
                      <span>{m.round_name}</span>
                      <div className="flex items-center gap-1.5">
                        {m.result_type !== "played" && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] uppercase">
                            {m.result_type}
                          </span>
                        )}
                        <span className="uppercase">{m.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-sm font-extrabold">
                      <span
                        className={`flex-1 truncate ${
                          m.winner_id === m.player_a_id
                            ? "text-[#FF5400]"
                            : "text-[#111317]"
                        }`}
                      >
                        {regA?.participant_name || "Atleta A"}
                      </span>
                      <span className="n px-3 py-1 rounded-lg bg-[#F4F5F7] text-[#111317]">
                        {m.score_a} x {m.score_b}
                      </span>
                      <span
                        className={`flex-1 truncate text-right ${
                          m.player_b_id && m.winner_id === m.player_b_id
                            ? "text-[#FF5400]"
                            : "text-[#111317]"
                        }`}
                      >
                        {regB?.participant_name || (m.result_type === "bye" ? "BYE" : "—")}
                      </span>
                    </div>

                    {mStats.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedMatchId(isOpen ? null : m.id)}
                        className="text-xs font-bold text-[#FF5400] inline-flex items-center gap-1"
                      >
                        {isOpen ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            Ocultar estatísticas
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            Ver estatísticas da súmula
                          </>
                        )}
                      </button>
                    )}

                    {isOpen && mStats.length > 0 && (
                      <div className="pt-2 border-t border-[#EAEBEF] space-y-1.5">
                        {mStats.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between text-xs bg-[#F4F5F7] rounded-lg px-2.5 py-1.5"
                          >
                            <span className="font-bold text-[#111317]">
                              {st.player_name} {st.is_mvp ? "⭐ MVP" : ""}
                            </span>
                            <span className="n text-[#6E7381]">
                              {st.points} PTS · {st.three_pointers} 3PT · {st.rebounds} REB · {st.assists} AST · {st.blocks_steals} DEF
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* TAB 3: RANKING DA ETAPA */}
        {tab === "etapa_rank" && currentStage && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 shadow-xs space-y-2.5">
            <p className="text-xs text-[#6E7381]">
              Desempate oficial: 1. Confronto Direto (H2H) → 2. Saldo de Pontos (SP) → 3. Pontos Pró (PP)
            </p>
            {stageRanking.map((row, idx) => (
              <div
                key={row.reg.id}
                className="flex items-center justify-between gap-2 bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="n font-extrabold text-[#111317] w-6">
                    #{row.reg.final_placement ?? idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-[#111317] truncate">
                      {row.reg.participant_name}
                    </p>
                    <p className="text-[11px] text-[#6E7381]">
                      {row.wins}V · {row.losses}D · SP {row.pf - row.pa >= 0 ? `+${row.pf - row.pa}` : row.pf - row.pa} · PP {row.pf}
                    </p>
                  </div>
                </div>
                <span className="n font-extrabold text-sm text-[#FF5400] shrink-0">
                  {row.hp} HP
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: RANKING GERAL DO CIRCUITO + LÍDERES */}
        {tab === "geral" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white border border-[#EAEBEF] rounded-2xl p-3">
                <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                  Cestinha
                </p>
                <p className="font-extrabold text-xs text-[#111317] truncate mt-0.5">
                  {statLeaders.topScorer ? `${statLeaders.topScorer.name} (${statLeaders.topScorer.pts} pts)` : "—"}
                </p>
              </div>
              <div className="bg-white border border-[#EAEBEF] rounded-2xl p-3">
                <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                  Rei das 3PT
                </p>
                <p className="font-extrabold text-xs text-[#111317] truncate mt-0.5">
                  {statLeaders.topThree ? `${statLeaders.topThree.name} (${statLeaders.topThree.threes})` : "—"}
                </p>
              </div>
              <div className="bg-white border border-[#EAEBEF] rounded-2xl p-3">
                <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                  Líder Defesa
                </p>
                <p className="font-extrabold text-xs text-[#111317] truncate mt-0.5">
                  {statLeaders.topDef ? `${statLeaders.topDef.name} (${statLeaders.topDef.def})` : "—"}
                </p>
              </div>
              <div className="bg-white border border-[#EAEBEF] rounded-2xl p-3">
                <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                  MVPs
                </p>
                <p className="font-extrabold text-xs text-[#111317] truncate mt-0.5">
                  {statLeaders.topMvp && statLeaders.topMvp.mvps > 0 ? `${statLeaders.topMvp.name} (${statLeaders.topMvp.mvps})` : "—"}
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 shadow-xs space-y-2">
              <p className="font-extrabold text-sm text-[#111317]">
                Classificação Geral do Circuito (HP Homologados)
              </p>
              {circuitRanking.length === 0 ? (
                <p className="text-xs text-[#6E7381]">
                  Nenhuma etapa homologada neste circuito ainda.
                </p>
              ) : (
                circuitRanking.map((row, idx) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="n font-extrabold text-[#111317] w-6">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-extrabold text-[#111317] truncate">
                          {row.name}
                        </p>
                        <p className="text-[11px] text-[#6E7381]">
                          {row.stages} {row.stages === 1 ? "etapa" : "etapas"} · {row.wins} vitórias
                        </p>
                      </div>
                    </div>
                    <span className="n font-extrabold text-sm text-[#FF5400] shrink-0">
                      {row.total_hp} HP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
