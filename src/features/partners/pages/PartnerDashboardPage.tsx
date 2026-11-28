import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Flag,
  MapPin,
  Plus,
  Send,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
  AlertCircle,
  Copy,
  Link2,
} from "lucide-react";
import { useHeziPlatform } from "../../../lib/hezi/store";
import { Avaliar } from "../../../components/hezi/AdminPanels";
import type { AppContextProps } from "../../../components/hezi/types";
import { formatCpf, isValidCpf, normalizeCpf } from "../../../lib/hezi/cpf";
import { ImageUploadField } from "../../../components/hezi/ImageUploadField";
import { useTeamStore } from "../../teams/services/teamService";
import { CATEGORY_LABELS, MODALITY_LABELS, TIER_LABELS } from "../constants/hpTable";
import { usePartnerStore } from "../services/partnerService";
import type { CategoryCode, PartnerModality } from "../types";

interface PartnerDashboardPageProps {
  currentUserId: number | null;
  isAdmin?: boolean;
  appContext?: AppContextProps;
  onBack?: () => void;
}

type PartnerTab = "identidade" | "circuitos" | "inscricoes" | "sumula" | "turmas" | "avaliar";

export function PartnerDashboardPage({
  currentUserId,
  isAdmin = false,
  appContext,
  onBack,
}: PartnerDashboardPageProps) {
  const users = useHeziPlatform((s) => s.users);
  const { teams, rosterMembers } = useTeamStore();
  const {
    partners,
    circuits,
    subEvents,
    registrations,
    matches,
    playerStats,
    trainingSlots = [],
    trainingCheckins = [],
    enrollmentRequests = [],
    updatePartner,
    createCircuit,
    updateCircuit,
    createSubEvent,
    updateSubEvent,
    registerParticipant,
    updateRegistration,
    createMatch,
    updateMatch,
    upsertPlayerStat,
    addTrainingSlot,
    toggleTrainingSlot,
    confirmTrainingCheckin,
    approveClassEnrollment,
    rejectClassEnrollment,
  } = usePartnerStore();

  const [tab, setTab] = useState<PartnerTab>("circuitos");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Select partner (for partner user, auto-match; for admin, allow switching)
  const myPartners = useMemo(() => {
    if (isAdmin) return partners;
    return partners.filter((p) => p.user_id === currentUserId);
  }, [partners, isAdmin, currentUserId]);

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const activePartner = useMemo(() => {
    if (selectedPartnerId) {
      const found = myPartners.find((p) => p.id === selectedPartnerId);
      if (found) return found;
    }
    return myPartners[0] || null;
  }, [myPartners, selectedPartnerId]);

  // Identity editor state
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editInsta, setEditInsta] = useState("");
  const [editLogo, setEditLogo] = useState("");
  const [editBanner, setEditBanner] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNeighborhood, setEditNeighborhood] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editCoachName, setEditCoachName] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [editWpp, setEditWpp] = useState("");
  const [identityLoadedFor, setIdentityLoadedFor] = useState("");

  // Turmas & Treinos
  const [slotTitle, setSlotTitle] = useState("Treino Fundamentos & Competição");
  const [slotWeekday, setSlotWeekday] = useState(2);
  const [slotStart, setSlotStart] = useState("16:30");
  const [slotEnd, setSlotEnd] = useState("18:00");

  if (activePartner && identityLoadedFor !== activePartner.id) {
    setEditName(activePartner.name);
    setEditBio(activePartner.bio);
    setEditInsta(activePartner.instagram);
    setEditLogo(activePartner.logo_url);
    setEditBanner(activePartner.banner_url);
    setEditAddress(activePartner.address || "");
    setEditNeighborhood(activePartner.neighborhood || "");
    setEditCity(activePartner.city || "");
    setEditLat(activePartner.latitude != null ? String(activePartner.latitude) : "");
    setEditLng(activePartner.longitude != null ? String(activePartner.longitude) : "");
    setEditCoachName(activePartner.coach_display_name || "");
    setEditSchedule(activePartner.training_schedule_summary || "");
    setEditWpp(activePartner.whatsapp_contact || "");
    setIdentityLoadedFor(activePartner.id);
  }

  // Circuit creation
  const [newCircuitTitle, setNewCircuitTitle] = useState("");
  const [newCircuitModality, setNewCircuitModality] = useState<PartnerModality>("1x1");
  const [newCircuitDesc, setNewCircuitDesc] = useState("");
  const [newCircuitRules, setNewCircuitRules] = useState("");

  // Circuit editing
  const [editingCircuitId, setEditingCircuitId] = useState<string | null>(null);
  const [editCircuitTitle, setEditCircuitTitle] = useState("");
  const [editCircuitModality, setEditCircuitModality] = useState<PartnerModality>("1x1");
  const [editCircuitDesc, setEditCircuitDesc] = useState("");
  const [editCircuitRules, setEditCircuitRules] = useState("");

  // Stage creation
  const [stageCircuitId, setStageCircuitId] = useState("");
  const [stageTitle, setStageTitle] = useState("");
  const [stageCategory, setStageCategory] = useState<CategoryCode>("open_masc");
  const [stageStart, setStageStart] = useState("");
  const [stageEnd, setStageEnd] = useState("");
  const [stageLocation, setStageLocation] = useState("");
  const [stageMax, setStageMax] = useState(16);
  const [stageThirdPlace, setStageThirdPlace] = useState(true);

  // Active sub-event for Inscrições & Súmula
  const partnerCircuits = useMemo(
    () => (activePartner ? circuits.filter((c) => c.partner_id === activePartner.id) : []),
    [circuits, activePartner],
  );
  const partnerStages = useMemo(
    () =>
      activePartner
        ? subEvents
            .filter((s) => s.partner_id === activePartner.id)
            .sort((a, b) => a.stage_order - b.stage_order)
        : [],
    [subEvents, activePartner],
  );

  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const activeStage = useMemo(() => {
    if (selectedStageId) {
      const found = partnerStages.find((s) => s.id === selectedStageId);
      if (found) return found;
    }
    return partnerStages[0] || null;
  }, [partnerStages, selectedStageId]);

  const activeStageCircuit = useMemo(
    () => (activeStage ? circuits.find((c) => c.id === activeStage.circuit_id) || null : null),
    [activeStage, circuits],
  );

  const stageRegs = useMemo(
    () => (activeStage ? registrations.filter((r) => r.sub_event_id === activeStage.id) : []),
    [registrations, activeStage],
  );

  const stageMatches = useMemo(
    () => (activeStage ? matches.filter((m) => m.sub_event_id === activeStage.id) : []),
    [matches, activeStage],
  );

  // Manual registration form
  const [regUserId, setRegUserId] = useState<string>("");
  const [regTeamId, setRegTeamId] = useState<string>("");
  const [regName, setRegName] = useState("");
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regCpf, setRegCpf] = useState("");

  // New Match form
  const [matchRound, setMatchRound] = useState("Quartas");
  const [matchBracket, setMatchBracket] = useState<"main_draw" | "repechage" | "consolation">("main_draw");
  const [matchIsFinal, setMatchIsFinal] = useState(false);
  const [matchIsThird, setMatchIsThird] = useState(false);
  const [matchPlayerA, setMatchPlayerA] = useState("");
  const [matchPlayerB, setMatchPlayerB] = useState("");

  // Active match for live scoreboard & stats
  const [activeMatchId, setActiveMatchId] = useState<string>("");
  const activeMatch = useMemo(
    () => stageMatches.find((m) => m.id === activeMatchId) || stageMatches[0] || null,
    [stageMatches, activeMatchId],
  );

  const [statRegId, setStatRegId] = useState("");
  const [statPts, setStatPts] = useState(0);
  const [statReb, setStatReb] = useState(0);
  const [statAst, setStatAst] = useState(0);
  const [statBlkStl, setStatBlkStl] = useState(0);
  const [statMvp, setStatMvp] = useState(false);

  if (!activePartner) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#111317] p-6">
        <div className="max-w-xl mx-auto bg-white border border-[#EAEBEF] rounded-2xl p-6 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-[#FF5500] mx-auto" />
          <h2 className="text-base font-black uppercase">Acesso Restrito ao Parceiro</h2>
          <p className="text-xs text-[#6B7280]">
            Sua conta ainda não possui um projeto parceiro licenciado vinculado. Solicite ao Admin Master HEZI.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-[#111317] text-white text-xs font-black uppercase"
            >
              Voltar
            </button>
          )}
        </div>
      </div>
    );
  }

  const regNameById = new Map(stageRegs.map((r) => [r.id, r.participant_name]));
  const isTeamModality =
    activeStageCircuit?.modality === "3x3" || activeStageCircuit?.modality === "5x5";

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    updatePartner(activePartner.id, {
      name: editName.trim() || activePartner.name,
      bio: editBio,
      instagram: editInsta,
      logo_url: editLogo,
      banner_url: editBanner,
      address: editAddress.trim(),
      neighborhood: editNeighborhood.trim(),
      city: editCity.trim(),
      latitude: editLat.trim() ? Number(editLat) : null,
      longitude: editLng.trim() ? Number(editLng) : null,
      coach_display_name: editCoachName.trim(),
      training_schedule_summary: editSchedule.trim(),
      whatsapp_contact: editWpp.trim(),
    });
    setFeedback({ ok: true, msg: "Identidade do parceiro atualizada!" });
  };

  const handleCreateCircuit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createCircuit({
      partner_id: activePartner.id,
      title: newCircuitTitle,
      modality: newCircuitModality,
      description: newCircuitDesc,
      rules_summary: newCircuitRules,
    });
    if (!res.ok) {
      setFeedback({ ok: false, msg: res.error || "Erro ao criar circuito." });
      return;
    }
    setFeedback({
      ok: true,
      msg: `Circuito "${res.circuit?.title}" criado! Aguarde definição de Tier pelo Admin HEZI.`,
    });
    setNewCircuitTitle("");
    setNewCircuitDesc("");
    setNewCircuitRules("");
  };

  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    const cid = stageCircuitId || partnerCircuits[0]?.id;
    if (!cid) {
      setFeedback({ ok: false, msg: "Crie um circuito antes de adicionar uma etapa." });
      return;
    }
    const res = createSubEvent({
      circuit_id: cid,
      partner_id: activePartner.id,
      title: stageTitle,
      category: stageCategory,
      has_third_place_match: stageThirdPlace,
      start_date: stageStart ? new Date(stageStart).toISOString() : new Date().toISOString(),
      end_date: stageEnd ? new Date(stageEnd).toISOString() : new Date().toISOString(),
      location: stageLocation,
      max_participants: stageMax,
    });
    if (!res.ok) {
      setFeedback({ ok: false, msg: res.error || "Erro ao criar etapa." });
      return;
    }
    setFeedback({ ok: true, msg: `Etapa "${res.subEvent?.title}" criada com sucesso!` });
    setStageTitle("");
    setStageLocation("");
    if (res.subEvent) setSelectedStageId(res.subEvent.id);
  };

  const handleAddRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStage || !activeStageCircuit) return;

    if (isTeamModality && regTeamId) {
      const team = teams.find((t) => t.id === regTeamId);
      if (!team) return;
      const roster = rosterMembers.filter((m) => m.team_id === team.id && m.is_active);
      const rosterCheckins = roster.map((m) => {
        const u = users.find((usr) => usr.id === m.user_id);
        return {
          user_id: m.user_id,
          name: u ? u.apelido || u.nome : `Atleta #${m.user_id}`,
          checked_in: false,
        };
      });
      const res = registerParticipant({
        sub_event_id: activeStage.id,
        circuit_id: activeStageCircuit.id,
        user_id: team.captain_user_id,
        team_id: team.id,
        participant_name: team.name,
        roster_checkins: rosterCheckins,
        contact_whatsapp: regWhatsapp,
        autoConfirm: true,
      });
      setFeedback({
        ok: res.ok,
        msg: res.ok ? `Time "${team.name}" inscrito!` : res.error || "Erro na inscrição.",
      });
      setRegTeamId("");
      return;
    }

    const chosenUser = regUserId ? users.find((u) => u.id === Number(regUserId)) : null;
    const finalName = chosenUser ? chosenUser.apelido || chosenUser.nome : regName.trim();
    if (!finalName) {
      setFeedback({ ok: false, msg: "Selecione um atleta ou informe o nome." });
      return;
    }
    if (!chosenUser && !regWhatsapp.trim()) {
      setFeedback({
        ok: false,
        msg: "Para atleta avulso sem cadastro, informe o WhatsApp para vincular os Hezi Points depois.",
      });
      return;
    }
    const cpfDigits = normalizeCpf(regCpf);
    if (cpfDigits && !isValidCpf(cpfDigits)) {
      setFeedback({ ok: false, msg: "CPF inválido na inscrição avulsa." });
      return;
    }
    const res = registerParticipant({
      sub_event_id: activeStage.id,
      circuit_id: activeStageCircuit.id,
      user_id: chosenUser ? chosenUser.id : null,
      team_id: null,
      participant_name: finalName,
      contact_whatsapp: regWhatsapp,
      instagram: chosenUser?.instagram || "",
      autoConfirm: true,
    });
    setFeedback({
      ok: res.ok,
      msg: res.ok ? `"${finalName}" inscrito na etapa!` : res.error || "Erro na inscrição.",
    });
    setRegUserId("");
    setRegName("");
    setRegWhatsapp("");
    setRegCpf("");
  };

  const toggleRosterMemberCheckin = (regId: string, uid: number) => {
    const reg = stageRegs.find((r) => r.id === regId);
    if (!reg) return;
    const updated = reg.roster_checkins.map((rc) =>
      rc.user_id === uid ? { ...rc, checked_in: !rc.checked_in } : rc,
    );
    const anyChecked = updated.some((rc) => rc.checked_in);
    updateRegistration(regId, {
      roster_checkins: updated,
      checked_in: anyChecked,
    });
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStage || !matchPlayerA) {
      setFeedback({ ok: false, msg: "Selecione ao menos o Competidor A." });
      return;
    }
    const isBye = !matchPlayerB;
    const created = createMatch({
      sub_event_id: activeStage.id,
      round_name: matchRound.trim() || "Confronto",
      bracket_type: matchBracket,
      is_final: matchIsFinal,
      is_third_place: matchIsThird,
      player_a_id: matchPlayerA,
      player_b_id: matchPlayerB || null,
      score_a: 0,
      score_b: 0,
      winner_id: isBye ? matchPlayerA : null,
      result_type: isBye ? "bye" : "played",
      status: isBye ? "finalizado" : "ao_vivo",
    });
    setActiveMatchId(created.id);
    setFeedback({ ok: true, msg: `Partida "${created.round_name}" criada!` });
  };

  const adjustScore = (side: "a" | "b", delta: number) => {
    if (!activeMatch) return;
    const nextA = side === "a" ? Math.max(0, activeMatch.score_a + delta) : activeMatch.score_a;
    const nextB = side === "b" ? Math.max(0, activeMatch.score_b + delta) : activeMatch.score_b;
    updateMatch(activeMatch.id, {
      score_a: nextA,
      score_b: nextB,
      status: "ao_vivo",
    });
  };

  const finishMatch = (resultType: "played" | "wo", explicitWinnerId?: string | null) => {
    if (!activeMatch) return;
    const winnerId =
      explicitWinnerId !== undefined
        ? explicitWinnerId
        : activeMatch.score_a >= activeMatch.score_b
          ? activeMatch.player_a_id
          : activeMatch.player_b_id;
    updateMatch(activeMatch.id, {
      result_type: resultType,
      winner_id: winnerId,
      status: "finalizado",
    });
    setFeedback({ ok: true, msg: "Placar finalizado e salvo!" });
  };

  const handleSaveStat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatch || !activeStage || !activeStageCircuit || !statRegId) return;
    const reg = stageRegs.find((r) => r.id === statRegId);
    if (!reg) return;
    upsertPlayerStat({
      match_id: activeMatch.id,
      sub_event_id: activeStage.id,
      circuit_id: activeStageCircuit.id,
      registration_id: reg.id,
      user_id: reg.user_id,
      player_name: reg.participant_name,
      points: statPts,
      two_pointers: 0,
      three_pointers: 0,
      rebounds: statReb,
      assists: statAst,
      blocks_steals: statBlkStl,
      is_mvp: statMvp,
    });
    setFeedback({ ok: true, msg: `Scout de ${reg.participant_name} salvo!` });
  };

  const handleSendToHomologation = () => {
    if (!activeStage) return;
    updateSubEvent(activeStage.id, { status: "aguardando_homologacao" });
    setFeedback({
      ok: true,
      msg: `Etapa "${activeStage.title}" enviada para Homologação Master HEZI!`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111317] pb-24">
      <div className="max-w-4xl mx-auto px-3 sm:px-5 pt-4 space-y-4">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#EAEBEF] rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] flex items-center justify-center hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#FF5500] text-white text-[10px] font-black uppercase">
                  Parceiro
                </span>
                <h1 className="text-base sm:text-lg font-black tracking-tight">{activePartner.name}</h1>
              </div>
              <p className="text-[11px] text-[#6B7280] font-medium">
                Painel Operacional · Beira de Quadra (Mobile-First)
              </p>
            </div>
          </div>

          {isAdmin && myPartners.length > 1 && (
            <select
              value={activePartner.id}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
            >
              {myPartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold ${
              feedback.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Navigation Pills (Organizado por Contexto: Minha Escola vs Torneios vs Perfil) */}
        {activePartner.partner_tier === "qualified" ? (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-2.5 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-[#F8F9FA] border border-[#EAEBEF] rounded-xl p-1.5 space-y-1">
                <p className="text-[10px] font-black uppercase text-[#FF5500] px-2">
                  Minha Escola &amp; Treinos
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: "turmas" as const, label: "Turmas & Convites", icon: Users },
                    { id: "avaliar" as const, label: "Avaliar Alunos", icon: Award },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-black uppercase transition ${
                          active ? "bg-[#111317] text-white" : "text-[#6B7280] hover:bg-white"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#F8F9FA] border border-[#EAEBEF] rounded-xl p-1.5 space-y-1">
                <p className="text-[10px] font-black uppercase text-[#6B7280] px-2">
                  Torneios &amp; Perfil
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: "circuitos" as const, label: "Etapas", icon: Trophy },
                    { id: "inscricoes" as const, label: "Check-in", icon: UserCheck },
                    { id: "sumula" as const, label: "Súmula", icon: ClipboardCheck },
                    { id: "identidade" as const, label: "Perfil", icon: Edit3 },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition ${
                          active ? "bg-[#111317] text-white" : "text-[#6B7280] hover:bg-white"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 bg-white border border-[#EAEBEF] rounded-2xl p-1.5">
            {[
              { id: "circuitos" as const, label: "Etapas", icon: Trophy },
              { id: "inscricoes" as const, label: "Check-in", icon: UserCheck },
              { id: "sumula" as const, label: "Súmula", icon: ClipboardCheck },
              { id: "identidade" as const, label: "Perfil", icon: Edit3 },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex-1 min-w-[80px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-black uppercase transition ${
                    active
                      ? "bg-[#111317] text-white"
                      : "text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#111317]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Stage Selector (for inscricoes and sumula) */}
        {(tab === "inscricoes" || tab === "sumula") && partnerStages.length > 0 && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase text-[#6B7280]">Etapa Ativa:</span>
            <select
              value={activeStage?.id || ""}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
            >
              {partnerStages.map((s) => (
                <option key={s.id} value={s.id}>
                  Etapa {s.stage_order}: {s.title} ({s.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* TAB 1: IDENTIDADE */}
        {tab === "identidade" && (
          <form onSubmit={handleSaveIdentity} className="bg-white border border-[#EAEBEF] rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-black uppercase">Identidade do Projeto Parceiro</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6B7280] mb-1">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-[#6B7280] mb-1">
                  Instagram
                </label>
                <input
                  type="text"
                  value={editInsta}
                  onChange={(e) => setEditInsta(e.target.value)}
                  placeholder="@projeto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-sm font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-[#6B7280] mb-1">Bio</label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-medium"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ImageUploadField
                label="Logo do Projeto"
                value={editLogo}
                onChange={setEditLogo}
                maxSize={384}
              />
              <ImageUploadField
                label="Banner do Circuito"
                value={editBanner}
                onChange={setEditBanner}
                maxSize={1024}
                previewClassName="w-24 h-14 rounded-xl object-cover border border-[#EAEBEF]"
              />
            </div>
            {activePartner.partner_tier === "qualified" && (
            <div className="pt-3 border-t border-[#EAEBEF] space-y-3">
              <p className="text-xs font-black uppercase text-[#FF5500]">
                Dados do Local &amp; Treinos (Mapa /treinos)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editCoachName}
                  onChange={(e) => setEditCoachName(e.target.value)}
                  placeholder="Nome do Professor Responsável"
                  className="px-3.5 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-semibold"
                />
                <input
                  type="text"
                  value={editWpp}
                  onChange={(e) => setEditWpp(e.target.value)}
                  placeholder="WhatsApp de matrícula (ex: 21999999999)"
                  className="px-3.5 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-semibold"
                />
              </div>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Endereço completo da quadra"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={editNeighborhood}
                  onChange={(e) => setEditNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                />
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Cidade"
                  className="px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                />
                <input
                  type="text"
                  value={editLat && editLng ? `${editLat}, ${editLng}` : ""}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const atMatch = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                    const plainMatch = val.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
                    const m = atMatch || plainMatch;
                    if (m) {
                      setEditLat(m[1]);
                      setEditLng(m[2]);
                    } else if (!val) {
                      setEditLat("");
                      setEditLng("");
                    }
                  }}
                  placeholder="Link do Google Maps ou lat, lng"
                  className="px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                />
              </div>
              <input
                type="text"
                value={editSchedule}
                onChange={(e) => setEditSchedule(e.target.value)}
                placeholder="Resumo dos horários (ex: Terça e Quinta • 16:30 às 18:00)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
              />
            </div>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#FF5500] text-white text-xs font-black uppercase"
            >
              Salvar Identidade
            </button>
          </form>
        )}

        {/* TAB 5: TURMAS & TREINOS (PARCEIRO QUALIFICADO) */}
        {tab === "turmas" && activePartner.partner_tier === "qualified" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTrainingSlot({
                  partner_id: activePartner.id,
                  title: slotTitle,
                  weekday: slotWeekday,
                  start_time: slotStart,
                  end_time: slotEnd,
                });
                setFeedback({ ok: true, msg: "Turma/horário cadastrado!" });
              }}
              className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-3"
            >
              <h2 className="text-sm font-black uppercase">Cadastrar Turma &amp; Horário</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  value={slotTitle}
                  onChange={(e) => setSlotTitle(e.target.value)}
                  placeholder="Nome da Turma"
                  className="sm:col-span-2 px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-semibold"
                />
                <select
                  value={slotWeekday}
                  onChange={(e) => setSlotWeekday(Number(e.target.value))}
                  className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                >
                  {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map(
                    (d, idx) => (
                      <option key={d} value={idx}>
                        {d}
                      </option>
                    ),
                  )}
                </select>
                <div className="flex gap-1.5">
                  <input
                    type="time"
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    className="flex-1 px-2 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                  />
                  <input
                    type="time"
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    className="flex-1 px-2 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#FF5500] text-white text-xs font-black uppercase"
              >
                Adicionar Turma
              </button>

              {trainingSlots.filter((sl) => sl.partner_id === activePartner.id).length > 0 && (
                <div className="pt-2 border-t border-[#EAEBEF] space-y-1.5">
                  {trainingSlots
                    .filter((sl) => sl.partner_id === activePartner.id)
                    .map((sl) => (
                      <div
                        key={sl.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] text-xs"
                      >
                        <span className="font-bold">
                          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][sl.weekday]} ·{" "}
                          {sl.start_time}–{sl.end_time} · {sl.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const link = `${window.location.origin}/?turma=${activePartner.id}:${sl.id}`;
                              void navigator.clipboard?.writeText(link);
                              setFeedback({
                                ok: true,
                                msg: `Link da turma "${sl.title}" copiado! Envie para seus alunos solicitarem entrada.`,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111317] text-white text-[10px] font-black uppercase"
                          >
                            <Link2 className="w-3 h-3" />
                            Copiar Link
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTrainingSlot(sl.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                              sl.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {sl.is_active ? "Ativa" : "Pausada"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </form>

            {/* Solicitações de Entrada via Link da Turma */}
            {enrollmentRequests.filter(
              (r) => r.partner_id === activePartner.id && r.status === "pendente",
            ).length > 0 && (
              <div className="bg-white border-2 border-[#FF5500]/40 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-black uppercase text-[#FF5500]">
                  Solicitações de Entrada nas Turmas
                </h3>
                <div className="space-y-2">
                  {enrollmentRequests
                    .filter((r) => r.partner_id === activePartner.id && r.status === "pendente")
                    .map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] text-xs"
                      >
                        <div>
                          <p className="font-black text-[#111317]">{req.student_name}</p>
                          <p className="text-[11px] text-[#6B7280]">
                            Turma: <strong>{req.slot_title}</strong> {req.student_wpp ? `· ${req.student_wpp}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const res = approveClassEnrollment(req.id);
                              setFeedback({
                                ok: res.ok,
                                msg: res.ok
                                  ? `${req.student_name} aceito na turma "${req.slot_title}"!`
                                  : res.error || "Erro ao aceitar aluno.",
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase"
                          >
                            Aceitar na Turma
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              rejectClassEnrollment(req.id);
                              setFeedback({ ok: true, msg: `Solicitação de ${req.student_name} recusada.` });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-[11px] font-black uppercase"
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-3">
              <div>
                <h3 className="text-sm font-black uppercase">Presença de Hoje (Check-in Diário)</h3>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Regra anti-farm: máx. 1 crédito de GP Global por dia e 3/semana no Hezi Pass; a Ofensiva de Treino sobe normalmente a cada dia treinado.
                </p>
              </div>
              {users.filter((u) => u.base_partner_id === activePartner.id).length === 0 ? (
                <p className="text-xs text-[#6B7280]">
                  Nenhum aluno vinculado a este projeto ainda. Peça ao Administrador para vincular em Moderador &gt; Assinantes.
                </p>
              ) : (
                <div className="space-y-2">
                  {users
                    .filter((u) => u.base_partner_id === activePartner.id)
                    .map((student) => {
                      const todayStr = new Date().toISOString().slice(0, 10);
                      const todayChk = trainingCheckins.find(
                        (c) =>
                          c.partner_id === activePartner.id &&
                          c.user_id === student.id &&
                          c.session_date === todayStr,
                      );
                      const isReg = student.enrollment_status === "regular";
                      return (
                        <div
                          key={student.id}
                          className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] text-xs"
                        >
                          <div>
                            <p className="font-black text-[#111317]">
                              {student.apelido || student.nome}
                            </p>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isReg
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isReg ? "Regular" : "Pendente"}
                            </span>
                          </div>
                          {todayChk?.status === "confirmed" ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase">
                              Presença Confirmada (+{todayChk.gp_awarded} GP)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const res = confirmTrainingCheckin({
                                  partner_id: activePartner.id,
                                  user_id: student.id,
                                  confirmed_by: currentUserId || activePartner.user_id,
                                });
                                setFeedback({
                                  ok: true,
                                  msg: res.cappedReason
                                    ? `Presença de ${student.apelido || student.nome} confirmada! ${res.cappedReason}`
                                    : `Presença de ${student.apelido || student.nome} confirmada (+${res.gpAwarded} GP e +1 Ofensiva)!`,
                                });
                              }}
                              className="px-3.5 py-2 rounded-xl bg-[#FF5500] text-white text-[11px] font-black uppercase"
                            >
                              {todayChk?.status === "pending"
                                ? "Confirmar Solicitação (+GP)"
                                : "Confirmar Presença (+GP)"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AVALIAR ALUNOS COMPLETO /20 (PARCEIRO QUALIFICADO) */}
        {tab === "avaliar" && activePartner.partner_tier === "qualified" && appContext && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-3 sm:p-4">
            <Avaliar S={appContext} filterPartnerId={activePartner.id} />
          </div>
        )}

        {/* TAB 2: CIRCUITOS & ETAPAS */}
        {tab === "circuitos" && (
          <div className="space-y-4">
            {/* Existing Circuits */}
            <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-black uppercase">Meus Circuitos Licenciados</h2>
              {partnerCircuits.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-black">{c.title}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-[#111317] text-white text-[10px] font-black">
                        {MODALITY_LABELS[c.modality]}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-[#FF5500] text-[10px] font-black">
                        {TIER_LABELS[c.sanction_tier]}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingCircuitId === c.id) {
                            setEditingCircuitId(null);
                          } else {
                            setEditingCircuitId(c.id);
                            setEditCircuitTitle(c.title);
                            setEditCircuitModality(c.modality);
                            setEditCircuitDesc(c.description);
                            setEditCircuitRules(c.rules_summary);
                          }
                        }}
                        className="px-2.5 py-0.5 rounded border border-[#EAEBEF] bg-white text-[10px] font-black uppercase hover:border-[#FF5500] hover:text-[#FF5500] transition"
                      >
                        {editingCircuitId === c.id ? "Fechar" : "Editar"}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#6B7280]">{c.description}</p>
                  {editingCircuitId === c.id && (
                    <div className="pt-2 border-t border-[#EAEBEF] space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editCircuitTitle}
                          onChange={(e) => setEditCircuitTitle(e.target.value)}
                          placeholder="Título do Circuito"
                          className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#EAEBEF] bg-white text-xs font-semibold"
                        />
                        <select
                          value={editCircuitModality}
                          onChange={(e) => setEditCircuitModality(e.target.value as PartnerModality)}
                          className="px-3 py-2 rounded-xl border border-[#EAEBEF] bg-white text-xs font-bold"
                        >
                          <option value="1x1">1x1</option>
                          <option value="3x3">3x3</option>
                          <option value="5x5">5x5</option>
                          <option value="dunk">Desafio Dunk (0 HP)</option>
                          <option value="3pt">Desafio 3 Pts (0 HP)</option>
                          <option value="skills">Desafio Skills (0 HP)</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={editCircuitDesc}
                        onChange={(e) => setEditCircuitDesc(e.target.value)}
                        placeholder="Descrição resumida..."
                        className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-white text-xs"
                      />
                      <input
                        type="text"
                        value={editCircuitRules}
                        onChange={(e) => setEditCircuitRules(e.target.value)}
                        placeholder="Regras principais..."
                        className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!editCircuitTitle.trim()) return;
                          updateCircuit(c.id, {
                            title: editCircuitTitle.trim(),
                            modality: editCircuitModality,
                            description: editCircuitDesc,
                            rules_summary: editCircuitRules,
                          });
                          setEditingCircuitId(null);
                          setFeedback({ ok: true, msg: "Circuito atualizado com sucesso!" });
                        }}
                        className="px-4 py-2 rounded-xl bg-[#FF5500] text-white text-xs font-black uppercase"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* New Circuit Form */}
              <form onSubmit={handleCreateCircuit} className="pt-3 border-t border-[#EAEBEF] space-y-3">
                <p className="text-xs font-black uppercase text-[#FF5500]">+ Novo Circuito</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    required
                    value={newCircuitTitle}
                    onChange={(e) => setNewCircuitTitle(e.target.value)}
                    placeholder="Nome do Circuito (ex: Copa Rua 2026)"
                    className="sm:col-span-2 px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-semibold"
                  />
                  <select
                    value={newCircuitModality}
                    onChange={(e) => setNewCircuitModality(e.target.value as PartnerModality)}
                    className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                  >
                    <option value="1x1">1x1</option>
                    <option value="3x3">3x3</option>
                    <option value="5x5">5x5</option>
                    <option value="dunk">Desafio Dunk (0 HP)</option>
                    <option value="3pt">Desafio 3 Pts (0 HP)</option>
                    <option value="skills">Desafio Skills (0 HP)</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={newCircuitDesc}
                  onChange={(e) => setNewCircuitDesc(e.target.value)}
                  placeholder="Descrição resumida..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                />
                <input
                  type="text"
                  value={newCircuitRules}
                  onChange={(e) => setNewCircuitRules(e.target.value)}
                  placeholder="Regras principais..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111317] text-white text-xs font-black uppercase"
                >
                  Criar Circuito
                </button>
              </form>
            </div>

            {/* Stages List & Create Stage */}
            <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase">Etapas do Circuito</h2>
                <span className="text-[11px] text-[#6B7280] font-semibold">Máx. 2 etapas/mês · Sem datas retroativas</span>
              </div>

              <div className="space-y-2">
                {partnerStages.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black">
                          #{s.stage_order} · {s.title}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#EAEBEF] text-[10px] font-bold">
                          {CATEGORY_LABELS[s.category]}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-orange-50 text-[#FF5500] text-[10px] font-black uppercase">
                          {s.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" /> {new Date(s.start_date).toLocaleDateString("pt-BR")}
                        <MapPin className="w-3 h-3 ml-1" /> {s.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {s.status === "inscricoes_abertas" && (
                        <button
                          onClick={() => updateSubEvent(s.id, { status: "em_andamento" })}
                          className="px-3 py-1.5 rounded-lg bg-[#111317] text-white text-[11px] font-black uppercase"
                        >
                          Iniciar Etapa
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedStageId(s.id);
                          setTab("sumula");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#FF5500] text-white text-[11px] font-black uppercase"
                      >
                        Abrir Súmula
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateStage} className="pt-3 border-t border-[#EAEBEF] space-y-3">
                <p className="text-xs font-black uppercase text-[#FF5500]">+ Nova Etapa</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={stageCircuitId || partnerCircuits[0]?.id || ""}
                    onChange={(e) => setStageCircuitId(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                  >
                    {partnerCircuits.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={stageTitle}
                    onChange={(e) => setStageTitle(e.target.value)}
                    placeholder="Título da Etapa (ex: Etapa 03 — Outono)"
                    className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-semibold"
                  />
                  <select
                    value={stageCategory}
                    onChange={(e) => setStageCategory(e.target.value as CategoryCode)}
                    className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={stageLocation}
                    onChange={(e) => setStageLocation(e.target.value)}
                    placeholder="Local / Quadra"
                    className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                  />
                  <div>
                    <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Início</label>
                    <input
                      type="datetime-local"
                      required
                      value={stageStart}
                      onChange={(e) => setStageStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6B7280] mb-0.5">Fim</label>
                    <input
                      type="datetime-local"
                      required
                      value={stageEnd}
                      onChange={(e) => setStageEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <span>Vagas:</span>
                    <input
                      type="number"
                      min={4}
                      max={128}
                      value={stageMax}
                      onChange={(e) => setStageMax(Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stageThirdPlace}
                      onChange={(e) => setStageThirdPlace(e.target.checked)}
                    />
                    <span>Haverá disputa de 3º lugar</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#FF5500] text-white text-xs font-black uppercase"
                >
                  Publicar Etapa
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: INSCRIÇÕES & CHECK-IN PRESENCIAL */}
        {tab === "inscricoes" && activeStage && (
          <div className="space-y-4">
            {/* Add participant / team */}
            <form onSubmit={handleAddRegistration} className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-black uppercase flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FF5500]" />
                Inscrever {isTeamModality ? "Time Oficial" : "Atleta"} na Etapa
              </h2>

              {isTeamModality ? (
                <select
                  value={regTeamId}
                  onChange={(e) => setRegTeamId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                >
                  <option value="">Selecionar Time Oficial ({activeStageCircuit?.modality})...</option>
                  {teams
                    .filter((t) => t.modality === activeStageCircuit?.modality)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.modality})
                      </option>
                    ))}
                </select>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={regUserId}
                    onChange={(e) => setRegUserId(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                  >
                    <option value="">Atleta cadastrado HEZI (opcional)...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.apelido || u.nome} (@{u.username})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ou nome avulso..."
                    disabled={Boolean(regUserId)}
                    className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs disabled:opacity-50"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  placeholder={regUserId ? "WhatsApp (opcional)" : "WhatsApp (obrigatório p/ avulso)"}
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                />
                {!regUserId && (
                  <input
                    type="text"
                    value={regCpf}
                    onChange={(e) => setRegCpf(formatCpf(e.target.value))}
                    placeholder="CPF (opcional)"
                    className="w-40 px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
                  />
                )}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF5500] text-white text-xs font-black uppercase"
                >
                  Inscrever
                </button>
              </div>
            </form>

            {/* Registrations list with Check-in Presencial */}
            <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase">
                  Lista de Inscritos ({stageRegs.length})
                </h3>
                <span className="text-xs font-bold text-emerald-700">
                  {stageRegs.filter((r) => r.checked_in).length} presentes
                </span>
              </div>

              <div className="space-y-2.5">
                {stageRegs.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-[#111317]">{reg.participant_name}</p>
                        <p className="text-[11px] text-[#6B7280]">
                          Status: <strong>{reg.approval_status}</strong>{" "}
                          {reg.instagram && `· ${reg.instagram}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {reg.approval_status === "pendente" && (
                          <button
                            onClick={() => updateRegistration(reg.id, { approval_status: "confirmado" })}
                            className="px-3 py-1.5 rounded-lg bg-[#111317] text-white text-[11px] font-black"
                          >
                            Aprovar
                          </button>
                        )}
                        <button
                          onClick={() => updateRegistration(reg.id, { checked_in: !reg.checked_in })}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition ${
                            reg.checked_in
                              ? "bg-emerald-600 text-white"
                              : "bg-white border border-[#EAEBEF] text-[#111317]"
                          }`}
                        >
                          {reg.checked_in ? "Check-in OK" : "Fazer Check-in"}
                        </button>
                      </div>
                    </div>

                    {/* Roster check-ins for 3x3 / 5x5 teams */}
                    {reg.roster_checkins && reg.roster_checkins.length > 0 && (
                      <div className="pt-2 border-t border-[#EAEBEF] space-y-1">
                        <p className="text-[10px] font-black uppercase text-[#6B7280] flex items-center gap-1">
                          <Users className="w-3 h-3" /> Check-in Individual do Elenco (recebem HP/GP):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {reg.roster_checkins.map((rc) => (
                            <button
                              type="button"
                              key={rc.user_id}
                              onClick={() => toggleRosterMemberCheckin(reg.id, rc.user_id)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                                rc.checked_in
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                  : "bg-white border-[#EAEBEF] text-[#6B7280]"
                              }`}
                            >
                              {rc.checked_in ? "✓ " : ""}
                              {rc.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SÚMULA DIGITAL MOBILE */}
        {tab === "sumula" && activeStage && (
          <div className="space-y-4">
            {/* Create Match */}
            <form onSubmit={handleCreateMatch} className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-black uppercase">Nova Partida / Confronto</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={matchRound}
                  onChange={(e) => setMatchRound(e.target.value)}
                  placeholder="Fase (ex: Oitavas, Quartas, Semifinal, Final)"
                  className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                />
                <select
                  value={matchBracket}
                  onChange={(e) => setMatchBracket(e.target.value as "main_draw" | "repechage" | "consolation")}
                  className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                >
                  <option value="main_draw">Chave Principal (Main Draw)</option>
                  <option value="repechage">Repescagem (Repechage)</option>
                  <option value="consolation">Consolação (0 HP bônus)</option>
                </select>
                <select
                  value={matchPlayerA}
                  onChange={(e) => setMatchPlayerA(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                >
                  <option value="">Competidor A...</option>
                  {stageRegs.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.participant_name}
                    </option>
                  ))}
                </select>
                <select
                  value={matchPlayerB}
                  onChange={(e) => setMatchPlayerB(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                >
                  <option value="">Competidor B (vazio = BYE)...</option>
                  {stageRegs
                    .filter((r) => r.id !== matchPlayerA)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.participant_name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchIsFinal}
                    onChange={(e) => {
                      setMatchIsFinal(e.target.checked);
                      if (e.target.checked) setMatchIsThird(false);
                    }}
                  />
                  <span>É a Final</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchIsThird}
                    onChange={(e) => {
                      setMatchIsThird(e.target.checked);
                      if (e.target.checked) setMatchIsFinal(false);
                    }}
                  />
                  <span>Disputa de 3º Lugar</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#111317] text-white text-xs font-black uppercase"
              >
                Abrir Confronto na Súmula
              </button>
            </form>

            {/* Match Switcher */}
            {stageMatches.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {stageMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMatchId(m.id)}
                    className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                      activeMatch?.id === m.id
                        ? "bg-[#FF5500] text-white border-[#FF5500]"
                        : "bg-white text-[#111317] border-[#EAEBEF]"
                    }`}
                  >
                    {m.round_name}: {regNameById.get(m.player_a_id) || "A"} vs{" "}
                    {m.player_b_id ? regNameById.get(m.player_b_id) || "B" : "BYE"} ({m.score_a}-{m.score_b})
                  </button>
                ))}
              </div>
            )}

            {/* Live Touch Scoreboard */}
            {activeMatch && (
              <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#FF5500]">
                    {activeMatch.round_name} · {activeMatch.status.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase">
                    {activeMatch.result_type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Side A */}
                  <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#EAEBEF] text-center space-y-2.5">
                    <p className="text-xs font-black truncate">
                      {regNameById.get(activeMatch.player_a_id) || "Competidor A"}
                    </p>
                    <p className="text-4xl font-black text-[#111317]">{activeMatch.score_a}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((pts) => (
                        <button
                          key={pts}
                          onClick={() => adjustScore("a", pts)}
                          className="py-3 rounded-xl bg-[#FF5500] text-white text-sm font-black active:scale-95 transition"
                        >
                          +{pts}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => adjustScore("a", -1)}
                      className="w-full py-1.5 rounded-lg border border-[#EAEBEF] bg-white text-[11px] font-bold text-[#6B7280]"
                    >
                      -1 ponto
                    </button>
                  </div>

                  {/* Side B */}
                  <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#EAEBEF] text-center space-y-2.5">
                    <p className="text-xs font-black truncate">
                      {activeMatch.player_b_id ? regNameById.get(activeMatch.player_b_id) || "Competidor B" : "BYE"}
                    </p>
                    <p className="text-4xl font-black text-[#111317]">{activeMatch.score_b}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map((pts) => (
                        <button
                          key={pts}
                          disabled={!activeMatch.player_b_id}
                          onClick={() => adjustScore("b", pts)}
                          className="py-3 rounded-xl bg-[#111317] text-white text-sm font-black active:scale-95 transition disabled:opacity-30"
                        >
                          +{pts}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={!activeMatch.player_b_id}
                      onClick={() => adjustScore("b", -1)}
                      className="w-full py-1.5 rounded-lg border border-[#EAEBEF] bg-white text-[11px] font-bold text-[#6B7280] disabled:opacity-30"
                    >
                      -1 ponto
                    </button>
                  </div>
                </div>

                {/* Finish Match Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => finishMatch("played")}
                    className="py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase"
                  >
                    Encerrar Placar Oficial
                  </button>
                  <button
                    onClick={() => finishMatch("wo", activeMatch.player_a_id)}
                    className="py-3 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-black uppercase"
                  >
                    W.O. Vitória A
                  </button>
                  <button
                    onClick={() => finishMatch("wo", activeMatch.player_b_id)}
                    disabled={!activeMatch.player_b_id}
                    className="py-3 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-black uppercase disabled:opacity-40"
                  >
                    W.O. Vitória B
                  </button>
                </div>

                {/* Quick Scout / MVP */}
                <form onSubmit={handleSaveStat} className="pt-3 border-t border-[#EAEBEF] space-y-2.5">
                  <p className="text-xs font-black uppercase flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#FF5500]" /> Scout & MVP da Partida
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <select
                      value={statRegId}
                      onChange={(e) => setStatRegId(e.target.value)}
                      className="col-span-2 px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                    >
                      <option value="">Selecionar atleta...</option>
                      {[activeMatch.player_a_id, activeMatch.player_b_id]
                        .filter(Boolean)
                        .map((rid) => (
                          <option key={rid!} value={rid!}>
                            {regNameById.get(rid!) || rid}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={statPts}
                      onChange={(e) => setStatPts(Number(e.target.value))}
                      placeholder="PTS"
                      className="px-2.5 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                    />
                    <input
                      type="number"
                      min={0}
                      value={statReb}
                      onChange={(e) => setStatReb(Number(e.target.value))}
                      placeholder="REB"
                      className="px-2.5 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                    />
                    <input
                      type="number"
                      min={0}
                      value={statAst}
                      onChange={(e) => setStatAst(Number(e.target.value))}
                      placeholder="AST"
                      className="px-2.5 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                    />
                    <input
                      type="number"
                      min={0}
                      value={statBlkStl}
                      onChange={(e) => setStatBlkStl(Number(e.target.value))}
                      placeholder="DEF"
                      className="px-2.5 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statMvp}
                        onChange={(e) => setStatMvp(e.target.checked)}
                      />
                      <span>Eleger MVP do Jogo</span>
                    </label>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#111317] text-white text-xs font-black uppercase"
                    >
                      Salvar Scout
                    </button>
                  </div>
                  {playerStats.filter((st) => st.match_id === activeMatch.id).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {playerStats
                        .filter((st) => st.match_id === activeMatch.id)
                        .map((st) => (
                          <span
                            key={st.id}
                            className="px-2.5 py-1 rounded-lg bg-[#F8F9FA] border border-[#EAEBEF] text-[11px] font-bold"
                          >
                            {st.player_name}: {st.points}pts · {st.rebounds}reb · {st.assists}ast
                            {st.is_mvp ? " · MVP" : ""}
                          </span>
                        ))}
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Finalize Placements & Send for Homologation */}
            <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-[#FF5500]" />
                <h3 className="text-sm font-black uppercase">Classificação Final & Envio para HEZI</h3>
              </div>
              <p className="text-xs text-[#6B7280]">
                Defina a colocação final dos participantes com check-in e envie a etapa para homologação do Admin Master HEZI.
              </p>

              <div className="space-y-2">
                {stageRegs
                  .filter((r) => r.checked_in && r.approval_status === "confirmado")
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] text-xs"
                    >
                      <span className="font-bold">{r.participant_name}</span>
                      <select
                        value={r.final_placement ?? ""}
                        onChange={(e) =>
                          updateRegistration(r.id, {
                            final_placement: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-[#EAEBEF] bg-white text-xs font-bold"
                      >
                        <option value="">Sem colocação</option>
                        <option value="1">1º Lugar (Campeão)</option>
                        <option value="2">2º Lugar (Vice)</option>
                        <option value="3">3º Lugar (Semifinal/3º)</option>
                        <option value="4">4º Lugar (Semifinal)</option>
                        <option value="5">5º–8º (Quartas)</option>
                        <option value="9">9º–16º (Oitavas)</option>
                        <option value="17">Participação</option>
                      </select>
                    </div>
                  ))}
              </div>

              <button
                onClick={handleSendToHomologation}
                disabled={activeStage.status === "homologada"}
                className="w-full py-3.5 rounded-xl bg-[#FF5500] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                {activeStage.status === "homologada"
                  ? "Etapa Já Homologada pela HEZI"
                  : "Finalizar Etapa & Enviar p/ Homologação HEZI"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
