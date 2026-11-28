import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Pin,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
} from "lucide-react";
import { isActiveSubscriber, useHeziPlatform } from "../../../lib/hezi/store";
import { useTeamStore } from "../../teams/services/teamService";
import { TIER_LABELS } from "../constants/hpTable";
import { usePartnerStore } from "../services/partnerService";
import type { CircuitStatus, PartnerTier, SanctionTier } from "../types";
import { computeHomologationPreview } from "../utils/hpCalculator";

interface AdminPartnersTabProps {
  adminUserId: number;
}

export function AdminPartnersTab({ adminUserId }: AdminPartnersTabProps) {
  const users = useHeziPlatform((s) => s.users);
  const updUser = useHeziPlatform((s) => s.updUser);
  const { teamRequests = [], approveTeamRequest, rejectTeamRequest } = useTeamStore();

  const {
    partners,
    circuits,
    subEvents,
    registrations,
    matches,
    hpLedger,
    partnerApplications = [],
    createOrPromotePartner,
    updatePartner,
    updateCircuit,
    updateCircuitAdmin,
    updateSubEvent,
    homologateSubEvent,
    revokeLedgerEntry,
    updatePartnerApplicationStatus,
  } = usePartnerStore();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerInsta, setPartnerInsta] = useState("");
  const [partnerBio, setPartnerBio] = useState("");
  const [partnerTier, setPartnerTier] = useState<PartnerTier>("event_only");
  const [partnerCoachId, setPartnerCoachId] = useState<string>("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [revokeReasonById, setRevokeReasonById] = useState<Record<string, string>>({});
  const [editingCircuitId, setEditingCircuitId] = useState<string | null>(null);
  const [editCircuitTitle, setEditCircuitTitle] = useState("");
  const [editCircuitDesc, setEditCircuitDesc] = useState("");
  const [editCircuitRules, setEditCircuitRules] = useState("");

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const queueStages = useMemo(
    () =>
      subEvents.filter(
        (s) =>
          s.status === "aguardando_homologacao" ||
          s.status === "em_andamento" ||
          s.status === "aguardando_aprovacao",
      ),
    [subEvents],
  );

  const handlePromotePartner = (e: React.FormEvent) => {
    e.preventDefault();
    const uid = Number(selectedUserId);
    if (!uid) {
      setFeedback({ ok: false, msg: "Selecione um usuário da base HEZI." });
      return;
    }
    const coachUid = partnerTier === "qualified" && partnerCoachId ? Number(partnerCoachId) : null;
    const coachUser = coachUid ? userById.get(coachUid) : null;
    const res = createOrPromotePartner({
      user_id: uid,
      name: partnerName,
      bio: partnerBio,
      instagram: partnerInsta,
      partner_tier: partnerTier,
      coach_user_id: coachUid,
      coach_display_name: coachUser ? coachUser.apelido || coachUser.nome : "",
    });
    if (!res.ok) {
      setFeedback({ ok: false, msg: res.error || "Erro ao cadastrar parceiro." });
      return;
    }
    updUser(uid, { tipo: "partner" });
    setFeedback({
      ok: true,
      msg: `Parceiro "${res.partner?.name}" ativado e conta promovida para role = 'partner'!`,
    });
    setSelectedUserId("");
    setPartnerName("");
    setPartnerInsta("");
    setPartnerBio("");
  };

  const handleHomologate = (subEventId: string) => {
    const res = homologateSubEvent(subEventId, adminUserId);
    setFeedback({ ok: res.ok, msg: res.message });
  };

  const handleRevoke = (ledgerId: string) => {
    const reason = (revokeReasonById[ledgerId] || "").trim() || "Desclassificação administrativa HEZI";
    revokeLedgerEntry(ledgerId, reason);
    setFeedback({ ok: true, msg: "Lançamento revogado no Extrato Imutável (hp_ledger)." });
  };

  return (
    <div className="space-y-6 text-[#111317]">
      {feedback && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold ${
            feedback.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* 0A. INTERESSADOS EM SER PARCEIRO */}
      {partnerApplications.filter((a) => a.status === "pendente").length > 0 && (
        <section className="bg-white border-2 border-[#111317]/20 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black uppercase tracking-wide">
              Solicitações de Novos Parceiros (Quero ser Parceiro)
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-[#111317] text-white text-[11px] font-black">
              {partnerApplications.filter((a) => a.status === "pendente").length} novo(s)
            </span>
          </div>
          <div className="space-y-2">
            {partnerApplications
              .filter((a) => a.status === "pendente")
              .map((app) => (
                <div
                  key={app.id}
                  className="p-3 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <p className="font-black">
                      {app.project_name} ·{" "}
                      <span className="text-[#FF5500]">
                        {app.desired_tier === "qualified" ? "Projeto Completo" : "Eventos"}
                      </span>
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      {app.contact_name} · {app.whatsapp} {app.instagram ? `· ${app.instagram}` : ""}{" "}
                      {app.city_neighborhood ? `· ${app.city_neighborhood}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updatePartnerApplicationStatus(app.id, "contatado")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black uppercase"
                    >
                      Marcar Contatado
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePartnerApplicationStatus(app.id, "recusado")}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-black uppercase"
                    >
                      Arquivar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* 0. SOLICITAÇÕES DE NOVOS TIMES OFICIAIS */}
      {teamRequests.filter((r) => r.status === "pendente").length > 0 && (
        <section className="bg-white border-2 border-[#FF5500]/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF5500]" />
              <h3 className="text-sm font-black uppercase tracking-wide">
                Solicitações de Novos Times Oficiais
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#FF5500] text-white text-[11px] font-black">
              {teamRequests.filter((r) => r.status === "pendente").length} pendente(s)
            </span>
          </div>

          <div className="space-y-2.5">
            {teamRequests
              .filter((r) => r.status === "pendente")
              .map((req) => {
                const cap = userById.get(req.captain_user_id);
                return (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black">{req.name}</span>
                        <span className="px-2 py-0.5 rounded bg-[#111317] text-white text-[10px] font-black uppercase">
                          {req.modality}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        Capitão: <strong>{cap ? cap.apelido || cap.nome : `#${req.captain_user_id}`}</strong> ·{" "}
                        {req.initial_member_ids.length} atleta(s) no elenco inicial
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const res = approveTeamRequest(req.id, adminUserId);
                          setFeedback({
                            ok: res.ok,
                            msg: res.ok
                              ? `Time Oficial "${req.name}" aprovado e criado!`
                              : res.error || "Erro ao aprovar time.",
                          });
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase hover:bg-emerald-700 transition"
                      >
                        Aprovar & Criar Time
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          rejectTeamRequest(req.id, adminUserId);
                          setFeedback({ ok: true, msg: `Solicitação "${req.name}" recusada.` });
                        }}
                        className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-black uppercase hover:bg-red-700 transition"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* 1. FILA DE HOMOLOGAÇÃO EM 1 CLIQUE */}
      <section className="bg-white border border-[#EAEBEF] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF5500]" />
            <h3 className="text-sm font-black uppercase tracking-wide">
              Fila de Homologação (1 Clique) · Motor HP v1.1
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-orange-50 text-[#FF5500] text-[11px] font-black">
            {queueStages.filter((s) => s.status === "aguardando_homologacao").length} aguardando
          </span>
        </div>

        {queueStages.length === 0 ? (
          <p className="text-xs text-[#6B7280]">Nenhuma etapa pendente de homologação no momento.</p>
        ) : (
          <div className="space-y-4">
            {queueStages.map((stage) => {
              const circuit = circuits.find((c) => c.id === stage.circuit_id);
              if (!circuit) return null;
              const partner = partners.find((p) => p.id === stage.partner_id);
              const stageRegs = registrations.filter((r) => r.sub_event_id === stage.id);
              const stageMatches = matches.filter((m) => m.sub_event_id === stage.id);

              const preview = computeHomologationPreview({
                circuit,
                subEvent: stage,
                registrations: stageRegs,
                matches: stageMatches,
                isUserSubscriber: (uid) => {
                  const u = userById.get(uid);
                  return u ? isActiveSubscriber(u) : false;
                },
              });

              return (
                <div
                  key={stage.id}
                  className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#EAEBEF] space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black">{stage.title}</span>
                        <span className="px-2 py-0.5 rounded bg-[#111317] text-white text-[10px] font-black uppercase">
                          {circuit.modality}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-orange-100 text-[#FF5500] text-[10px] font-black">
                          Tier Efetivo: {preview.effective_tier ? TIER_LABELS[preview.effective_tier] : "Sem HP (0 HP)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {partner?.name} · {circuit.title} · {preview.checked_in_count} presentes · Status:{" "}
                        <strong>{stage.status}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={stage.sanction_tier_override || ""}
                        onChange={(e) =>
                          updateSubEvent(stage.id, {
                            sanction_tier_override: (e.target.value || null) as SanctionTier | null,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-[#EAEBEF] bg-white text-[11px] font-bold"
                        title="Override de Tier nesta etapa"
                      >
                        <option value="">Tier do Circuito ({TIER_LABELS[circuit.sanction_tier]})</option>
                        {Object.entries(TIER_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            Override: {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Warnings (downgrade / blocks) */}
                  {preview.downgrade_reasons.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                      {preview.downgrade_reasons.map((w, i) => (
                        <p key={i} className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{w}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Preview Table */}
                  {preview.rows.length > 0 && (
                    <div className="overflow-x-auto bg-white border border-[#EAEBEF] rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8F9FA] border-b border-[#EAEBEF] text-[10px] uppercase text-[#6B7280]">
                          <tr>
                            <th className="px-3 py-2">Atleta / Time</th>
                            <th className="px-3 py-2">Colocação</th>
                            <th className="px-3 py-2">Base + Bônus</th>
                            <th className="px-3 py-2">Total HP</th>
                            <th className="px-3 py-2">GP Hezi Pass</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAEBEF]">
                          {preview.rows.map((row, idx) => (
                            <tr key={`${row.registration_id}-${idx}`}>
                              <td className="px-3 py-2 font-bold">
                                {row.participant_name}
                                {row.note && (
                                  <span className="block text-[10px] font-normal text-[#6B7280]">
                                    {row.note}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {row.final_placement ? `${row.final_placement}º lugar` : "—"}
                              </td>
                              <td className="px-3 py-2 text-[#6B7280]">
                                {row.placement_hp} + {row.win_bonus_hp} ({row.real_wins_main}V)
                              </td>
                              <td className="px-3 py-2 font-black text-[#FF5500]">{row.total_hp} HP</td>
                              <td className="px-3 py-2 font-bold text-emerald-700">
                                +{row.gp_to_credit} GP
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button
                    onClick={() => handleHomologate(stage.id)}
                    disabled={preview.checked_in_count === 0 || stage.status === "homologada"}
                    className="w-full py-3 rounded-xl bg-[#FF5500] text-white text-xs font-black uppercase tracking-wider hover:bg-[#e04b00] disabled:opacity-40 transition"
                  >
                    HOMOLOGAR ETAPA & LIBERAR HP/GP
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. CIRCUITOS PARCEIROS: TIER & FIXAR NA HOME */}
      <section className="bg-white border border-[#EAEBEF] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#FF5500]" />
          <h3 className="text-sm font-black uppercase tracking-wide">
            Circuitos Licenciados (Tier & Fixar na Home)
          </h3>
        </div>

        <div className="space-y-2.5">
          {circuits.map((c) => {
            const partner = partners.find((p) => p.id === c.partner_id);
            return (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-black">{c.title}</p>
                  <p className="text-[11px] text-[#6B7280]">
                    Parceiro: <strong>{partner?.name || "—"}</strong> · Modalidade: <strong>{c.modality}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={c.sanction_tier}
                    onChange={(e) =>
                      updateCircuitAdmin(c.id, { sanction_tier: e.target.value as SanctionTier })
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-[#EAEBEF] bg-white text-xs font-bold"
                  >
                    {Object.entries(TIER_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={c.status}
                    onChange={(e) =>
                      updateCircuitAdmin(c.id, { status: e.target.value as CircuitStatus })
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-[#EAEBEF] bg-white text-xs font-bold"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="em_breve">Em Breve</option>
                    <option value="encerrado">Encerrado</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (editingCircuitId === c.id) {
                        setEditingCircuitId(null);
                      } else {
                        setEditingCircuitId(c.id);
                        setEditCircuitTitle(c.title);
                        setEditCircuitDesc(c.description);
                        setEditCircuitRules(c.rules_summary);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-black border bg-white text-[#111317] border-[#EAEBEF] hover:border-[#FF5500]"
                  >
                    {editingCircuitId === c.id ? "Fechar" : "Editar"}
                  </button>

                  <button
                    onClick={() => updateCircuitAdmin(c.id, { pin_on_home: !c.pin_on_home })}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black border transition ${
                      c.pin_on_home
                        ? "bg-[#FF5500] text-white border-[#FF5500]"
                        : "bg-white text-[#111317] border-[#EAEBEF]"
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {c.pin_on_home ? "Fixado na Home" : "Fixar na Home"}
                  </button>
                </div>

                {editingCircuitId === c.id && (
                  <div className="w-full pt-3 mt-1 border-t border-[#EAEBEF] space-y-2">
                    <input
                      type="text"
                      value={editCircuitTitle}
                      onChange={(e) => setEditCircuitTitle(e.target.value)}
                      placeholder="Título do Circuito"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-white text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={editCircuitDesc}
                      onChange={(e) => setEditCircuitDesc(e.target.value)}
                      placeholder="Descrição..."
                      className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-white text-xs"
                    />
                    <input
                      type="text"
                      value={editCircuitRules}
                      onChange={(e) => setEditCircuitRules(e.target.value)}
                      placeholder="Regras..."
                      className="w-full px-3 py-2 rounded-xl border border-[#EAEBEF] bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!editCircuitTitle.trim()) return;
                        updateCircuit(c.id, {
                          title: editCircuitTitle.trim(),
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
            );
          })}
        </div>
      </section>

      {/* 3. PROMOVER USUÁRIO PARA PARCEIRO LICENCIADO */}
      <section className="bg-white border border-[#EAEBEF] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#FF5500]" />
          <h3 className="text-sm font-black uppercase tracking-wide">
            Cadastrar / Promover Parceiro Licenciado
          </h3>
        </div>

        <form onSubmit={handlePromotePartner} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
          >
            <option value="">Selecionar usuário responsável...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.apelido || u.nome} (@{u.username}) · [{u.tipo}]
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="Nome do Projeto Parceiro (ex: Streetball RJ)"
            className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-semibold"
          />
          <input
            type="text"
            value={partnerInsta}
            onChange={(e) => setPartnerInsta(e.target.value)}
            placeholder="Instagram (ex: @streetballrj)"
            className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
          />
          <input
            type="text"
            value={partnerBio}
            onChange={(e) => setPartnerBio(e.target.value)}
            placeholder="Bio curta do projeto..."
            className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs"
          />
          <select
            value={partnerTier}
            onChange={(e) => setPartnerTier(e.target.value as PartnerTier)}
            className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
          >
            <option value="event_only">Nível 1 — Parceiro Evento (Sem Mapa/OVR)</option>
            <option value="qualified">Nível 2 — Parceiro Completo (Qualificado)</option>
          </select>
          {partnerTier === "qualified" && (
            <select
              value={partnerCoachId}
              onChange={(e) => setPartnerCoachId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
            >
              <option value="">Vincular Professor Responsável...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  Prof. {u.apelido || u.nome} (@{u.username})
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            className="sm:col-span-2 py-2.5 rounded-xl bg-[#111317] text-white text-xs font-black uppercase"
          >
            Ativar Parceiro & Liberar Painel
          </button>
        </form>

        <div className="space-y-2 pt-2 border-t border-[#EAEBEF]">
          {partners.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#EAEBEF] text-xs"
            >
              <div>
                <strong>{p.name}</strong> <span className="text-[#6B7280]">{p.instagram}</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-white border border-[#EAEBEF] text-[10px] font-black">
                  {p.partner_tier === "qualified" ? "Qualificado (Nível 2)" : "Evento (Nível 1)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={p.partner_tier || "event_only"}
                  onChange={(e) =>
                    updatePartner(p.id, { partner_tier: e.target.value as PartnerTier })
                  }
                  className="px-2 py-1 rounded-lg border border-[#EAEBEF] bg-white text-[11px] font-bold"
                >
                  <option value="event_only">Nível 1 (Evento)</option>
                  <option value="qualified">Nível 2 (Qualificado)</option>
                </select>
                <button
                  onClick={() => updatePartner(p.id, { is_active: !p.is_active })}
                  className={`px-2.5 py-1 rounded-lg font-black text-[11px] ${
                    p.is_active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.is_active ? "Ativo" : "Suspenso"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. EXTRATO IMUTÁVEL (HP LEDGER) & REVOGAÇÃO RETROATIVA */}
      <section className="bg-white border border-[#EAEBEF] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#FF5500]" />
          <h3 className="text-sm font-black uppercase tracking-wide">
            Extrato Imutável (hp_ledger) & Revogação
          </h3>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-[#EAEBEF] border border-[#EAEBEF] rounded-xl">
          {hpLedger.map((entry) => {
            const u = entry.user_id !== null ? userById.get(entry.user_id) : undefined;
            const stage = subEvents.find((s) => s.id === entry.sub_event_id);
            return (
              <div
                key={entry.id}
                className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <p className="font-bold">
                    {u ? u.apelido || u.nome : entry.participant_name || `Atleta #${entry.user_id ?? ""}`} ·{" "}
                    <span className={entry.status === "revoked" ? "line-through text-red-500" : "text-[#FF5500]"}>
                      +{entry.total_hp} HP
                    </span>{" "}
                    ({entry.final_placement}º lugar · {entry.modality})
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    {stage?.title || entry.sub_event_id} · {TIER_LABELS[entry.effective_tier]} ·{" "}
                    {entry.status === "revoked" ? `REVOGADO: ${entry.revoke_reason}` : "Ativo"}
                  </p>
                </div>

                {entry.status === "active" && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={revokeReasonById[entry.id] || ""}
                      onChange={(e) =>
                        setRevokeReasonById((prev) => ({ ...prev, [entry.id]: e.target.value }))
                      }
                      placeholder="Motivo da revogação..."
                      className="px-2 py-1 rounded-lg border border-[#EAEBEF] bg-[#F8F9FA] text-[11px]"
                    />
                    <button
                      onClick={() => handleRevoke(entry.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-black"
                    >
                      <Ban className="w-3 h-3" /> Revogar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
