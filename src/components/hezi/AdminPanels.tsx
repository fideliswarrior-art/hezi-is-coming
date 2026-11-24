import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home as HomeIcon,
  Dribbble,
  ClipboardList,
  ShieldAlert,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Lock,
  Plus,
  Minus,
  Trash2,
  X,
  MessageCircle,
  Trophy,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp,
  Timer,
  Users,
  Database,
  RefreshCw,
  Download,
  LogIn,
  UserPlus,
  Star,
  Award,
  Shirt,
  LogOut,
  Bell,
  Settings,
  UserCog,
  UsersRound,
  Radio,
  Mail,
  KeyRound,
  Camera,
  DoorOpen,
  Calendar,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  LOGO,
  wa,
  HEZI_WHATSAPP_DISPLAY,
  CATS,
  W,
  BN,
  BE,
  THR,
  PASS,
  nano,
  ovr,
  sessao,
  calcMiniOvr,
  baseSub,
  mkR,
  B0,
  useHeziPlatform,
  useHeziSession,
  isEventRollingNow,
  formatTimeHHMM,
  isActiveSubscriber,
  getEventEntryPoints,
  type CatKey,
  type NanoKey,
  type HeziUser,
  type HeziEventItem,
  type HeziNotification,
} from "@/lib/hezi/store";
import {
  usePelada,
  getPlayerPeladaStatus,
  currentDurationMs,
  computeElapsed,
  getMaxTeamSize,
} from "@/lib/pelada/store";
import { useRealtimeSync } from "@/lib/hezi/sync";
import { CourtMasterOrganizer, useTick } from "@/routes/pelada";
import { RadarHabilidades } from "@/components/hezi/RadarHabilidades";
import { AssinantePage } from "@/components/hezi/AssinantePage";
import type { AppContextProps, AppTab, StaffSubTabKey } from "@/components/hezi/types";
import { C, OB, btBase, Btn, Chip, Hd } from "@/components/hezi/shared";
import { Av, GRN, RED } from "@/routes/index";

interface DbStatusSummaryClient {
  [key: string]: any;
}
import { sanitizeUsername } from "./AuthComponents";
import { Painel } from "./PlayerProfile";

export function Step({ v, set }: { v: number; set: (val: number) => void }) {
  const [misses, setMisses] = useState(0);
  const total = v + misses;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {(v > 0 || misses > 0) && (
          <button
            type="button"
            onClick={() => {
              set(0);
              setMisses(0);
            }}
            className="text-[10px] font-bold text-[#6E7381] hover:text-[#111317] px-1.5 py-0.5 rounded bg-[#F4F5F7] transition"
            title="Zerar contador"
          >
            Zerar
          </button>
        )}
        <span className="n font-extrabold text-sm text-[#111317]">
          {v}
          <span className="text-xs text-[#6E7381]">/20</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (total < 20) set(Math.min(20, v + 1));
          }}
          disabled={total >= 20}
          className="min-w-[48px] h-11 px-3 rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-extrabold text-base flex items-center justify-center active:scale-90 transition shadow-xs"
          aria-label="Acertou"
        >
          {v}
        </button>
        <button
          type="button"
          onClick={() => {
            if (total < 20) setMisses((m) => m + 1);
          }}
          disabled={total >= 20}
          className="min-w-[48px] h-11 px-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-50 text-white font-extrabold text-base flex items-center justify-center active:scale-90 transition shadow-xs"
          aria-label="Errou"
        >
          {misses}
        </button>
      </div>
    </div>
  );
}

export function Avaliar({ S }: { S: AppContextProps }) {
  const al = S.users.filter((x) => x.tipo === "aluno" && x.st !== "ex_aluno");
  const [id, setId] = useState<number>(al[0]?.id ?? 1);
  const [expandedEvalId, setExpandedEvalId] = useState<string | null>(null);
  const ci = "Mensal";
  const u = al.find((x) => x.id === id) || al[0];

  const [r, setR] = useState<Record<NanoKey, number>>(() =>
    u?.evalDraft?.r
      ? { ...(u.evalDraft.r as Record<NanoKey, number>) }
      : u?.r
        ? { ...u.r }
        : mkR(baseSub),
  );
  const [nt, setNt] = useState<string>(() => u?.evalDraft?.nota || "");

  const selectStudent = (newId: number) => {
    setId(newId);
    const target = al.find((x) => x.id === newId);
    if (target?.evalDraft?.r) {
      setR({ ...(target.evalDraft.r as Record<NanoKey, number>) });
      setNt(target.evalDraft.nota || "");
    } else {
      setR(target?.r ? { ...target.r } : mkR(target?.sub || baseSub));
      setNt("");
    }
  };

  if (!u) return null;

  const currentSub = u.sub || baseSub;
  const currentBd = u.bd || B0();

  const domHand = u.dominantHand || "destro";
  const rawPreviewSub = {} as Record<CatKey, number>;
  CATS.forEach((c) => {
    const baseVal = currentSub[c.k] ?? 65;
    rawPreviewSub[c.k] = Math.round(baseVal * 0.7 + sessao(c, r, domHand) * 0.3);
  });
  const prevOvr = ovr(currentSub);
  const rawNextOvr = ovr(rawPreviewSub);
  const rawDelta = rawNextOvr - prevOvr;
  // Teto gradual: máximo +5 OVR por avaliação com curva equilibrada
  const cappedDelta =
    rawDelta > 0
      ? Math.min(5, Math.max(1, Math.round((5 * rawDelta) / (rawDelta + 5))))
      : rawDelta;
  const scaleFactor = rawDelta > 0 ? cappedDelta / rawDelta : 1;

  const previewSub = {} as Record<CatKey, number>;
  CATS.forEach((c) => {
    const baseVal = currentSub[c.k] ?? 65;
    const diff = rawPreviewSub[c.k] - baseVal;
    previewSub[c.k] = Math.min(99, Math.max(50, Math.round(baseVal + diff * scaleFactor)));
  });
  const nextOvr = Math.min(99, prevOvr + cappedDelta);

  const go = () => {
    const nb = { ...currentBd };
    const ns = { ...previewSub };
    CATS.forEach((c) => {
      const nv = ns[c.k];
      const b = currentBd[c.k] || { l: 0, s: 0 };
      if (b.l < 3 && nv >= THR[b.l]) {
        const s = b.s + 1;
        nb[c.k] = s >= 2 ? { l: b.l + 1, s: 0 } : { l: b.l, s };
      } else {
        nb[c.k] = { l: b.l, s: 0 };
      }
    });

    const evalDate = new Date().toLocaleDateString("pt-BR");
    const newEvalEntry = {
      id: `eval-${Date.now()}`,
      date: evalDate,
      cycle: ci,
      prevOvr,
      nextOvr,
      sub: { ...ns },
      r: { ...r },
      bd: { ...nb },
      nota: nt.trim() || u.nota,
    };

    S.upd(id, {
      sub: ns,
      bd: nb,
      r: { ...r },
      ev: { d: evalDate, c: ci },
      nota: nt.trim() || u.nota,
      evalHistory: [newEvalEntry, ...(u.evalHistory || [])],
      evalDraft: undefined,
    });
    S.say(`Avaliação salva! ${u.nome}: OVR ${prevOvr} → ${nextOvr}`);
    setNt("");
  };

  const saveDraft = () => {
    const updatedAt = new Date().toLocaleDateString("pt-BR");
    S.upd(id, {
      evalDraft: {
        r: { ...r },
        nota: nt.trim(),
        updatedAt,
      },
    });
    S.say(`Avaliação salva em andamento (não concluída) para ${u.nome}.`);
  };

  return (
    <div className="space-y-4">
      <div className={C + " p-3.5 space-y-3"}>
        <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381]">
          Selecionar Atleta (Hezi Skills)
        </label>
        <select
          value={id}
          onChange={(e) => selectStudent(+e.target.value)}
          className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 font-extrabold text-sm text-[#111317] outline-none"
        >
          {al.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome} ({a.pos}) — OVR {ovr(a.sub || baseSub)}
              {a.evalDraft ? " ⏳ (Em andamento)" : ""}
            </option>
          ))}
        </select>

        {u.evalDraft && (
          <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-xl p-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-[#B45309]">
                ⏳ Avaliação em andamento (Não concluída)
              </p>
              <p className="text-[11px] text-[#92400E]">
                Progresso salvo em {u.evalDraft.updatedAt}. Continue de onde parou ou processe ao finalizar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm("Descartar o rascunho em andamento deste atleta?")) return;
                S.upd(id, { evalDraft: undefined });
                setR(u.r ? { ...u.r } : mkR(u.sub || baseSub));
                setNt("");
                S.say("Rascunho descartado.");
              }}
              className="text-[11px] font-extrabold text-[#EF4444] bg-white border border-[#FCA5A5] px-2.5 py-1 rounded-lg shrink-0 hover:bg-[#FEF2F2] transition"
            >
              Descartar
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {(["destro", "canhoto"] as const).map((hand) => (
            <button
              key={hand}
              type="button"
              onClick={() => {
                S.upd(u.id, { dominantHand: hand });
                S.say(`Mão dominante definida como ${hand === "destro" ? "Destro" : "Canhoto"}`);
              }}
              className={
                "rounded-xl py-2 px-3 text-xs font-extrabold border transition " +
                ((u.dominantHand || "destro") === hand
                  ? "bg-[#111317] text-white border-[#111317]"
                  : "bg-[#F4F5F7] text-[#6E7381] border-[#EAEBEF]")
              }
            >
              ✋ {hand === "destro" ? "Destro (Mão Dir.)" : "Canhoto (Mão Esq.)"}
            </button>
          ))}
        </div>

        <div className="rounded-xl py-2.5 px-3 text-center text-xs font-extrabold bg-[#FF5400] text-white">
          Ciclo Mensal
        </div>

        <div className="bg-[#FFF4EE] rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#FF5400]">
              Simulação em Tempo Real (EMA 70/30)
            </p>
            <p className="text-xs text-[#6E7381]">
              Base fiel para pais e olheiros (sem inflação artificial)
            </p>
          </div>
          <div className="text-right">
            <span className="n font-bold text-lg text-[#6E7381]">
              {prevOvr}
            </span>
            <span className="mx-1 text-[#6E7381]">→</span>
            <span className="n font-extrabold text-2xl text-[#FF5400]">
              {nextOvr}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#6E7381] px-1">
        Registre apenas os acertos em <strong>20 tentativas</strong> de cada
        fundamento. O sistema calcula automaticamente os Nano-Overalls,
        Sub-Overalls e Overall Geral.
      </p>

      {CATS.map((c) => {
        const domHand = u.dominantHand || "destro";
        const subSessao = sessao(c, r, domHand);
        const subNovo = previewSub[c.k] ?? subSessao;
        return (
          <div key={c.k} className={C + " p-4 space-y-2"}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-extrabold text-sm text-[#111317]">
                {c.e} {c.t}{" "}
                <span className="text-[#6E7381] font-medium text-xs">
                  · peso {Math.round(W[c.k] * 100)}%
                </span>
              </p>
              <span className="n text-xs font-bold bg-[#F4F5F7] px-2.5 py-1 rounded-lg">
                Sub-OVR: {currentSub[c.k] ?? 65} →{" "}
                <strong className="text-[#FF5400]">{subNovo}</strong>{" "}
                <span className="text-[#6E7381]">(hoje: {subSessao})</span>
              </span>
            </div>

            {c.mini.map((m) => {
              const miniScore = calcMiniOvr(m, r);
              return (
                <div key={m.k} className="bg-[#FBFBFC] border border-[#EAEBEF] rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between pb-1.5">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#111317]">
                      {m.t}
                    </p>
                    <span className="n text-[11px] font-extrabold bg-[#FFF4EE] text-[#FF5400] px-2 py-0.5 rounded-md">
                      Mini-OVR: {miniScore}
                    </span>
                  </div>
                  {m.n.map(([k, nm]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between py-2 border-t border-[#EAEBEF]"
                    >
                      <div className="pr-2">
                        <p className="text-sm font-semibold text-[#111317]">{nm}</p>
                        <p className="n text-xs text-[#6E7381]">
                          Nano-OVR: {nano(r[k] ?? 0)} pts
                        </p>
                      </div>
                      <Step
                        v={r[k] ?? 0}
                        set={(v) => setR({ ...r, [k]: v })}
                      />
                    </div>
                  ))}
                </div>
              );
            })}

            {c.k === "ban" && Math.abs(((r.bd ?? 0) + (r.brd ?? 0)) / 2 - ((r.be ?? 0) + (r.bre ?? 0)) / 2) > 4 && (
              <p className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2] rounded-lg p-2.5 mt-2">
                ⚠️ Assimetria entre mão dominante ({domHand === "destro" ? "Direita" : "Esquerda"}) e não dominante: penalidade técnica aplicada no Sub-OVR de finalização.
              </p>
            )}
          </div>
        );
      })}

      <textarea
        value={nt}
        onChange={(e) => setNt(e.target.value)}
        placeholder="Recado técnico para pais e aluno (ex: Ótima mão direita, focar na esquerda...)"
        rows={3}
        className="w-full bg-white border border-[#EAEBEF] rounded-xl p-3.5 text-sm outline-none focus:ring-2 ring-[#FF5400]"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Btn
          onClick={saveDraft}
          c="bg-[#FFFBEB] text-[#B45309] border border-[#F59E0B] hover:bg-[#FEF3C7]"
        >
          ⏳ Salvar em Andamento (Não Concluída)
        </Btn>
        <Btn onClick={go} c={OB}>
          <CheckCircle2 className="w-4 h-4" />
          Processar Avaliação & Atualizar Boletim
        </Btn>
      </div>

      {/* Histórico de Avaliações & Comparativo */}
      <div className={C + " p-4 space-y-2.5"}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-extrabold text-sm text-[#111317]">
            📊 Histórico de Avaliações ({(u.evalHistory || []).length})
          </p>
          {(u.evalHistory || []).length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (
                  !window.confirm(
                    `Apagar TODO o histórico de avaliações de ${u.nome}? O Boletim de Habilidades, Badges e Overall voltarão para a base 65.`
                  )
                )
                  return;
                S.upd(u.id, {
                  evalHistory: [],
                  sub: { ...baseSub },
                  bd: B0(),
                  r: {},
                  ev: null,
                  nota: "",
                });
                setExpandedEvalId(null);
                S.say(
                  `Histórico completo apagado! ${u.nome} voltou para a base ${ovr(baseSub)} OVR.`
                );
              }}
              className="text-[11px] font-extrabold text-[#EF4444] bg-[#FEF2F2] hover:bg-[#FEE2E2] px-2.5 py-1 rounded-lg transition"
            >
              Apagar histórico completo
            </button>
          )}
        </div>
        {!u.evalHistory || u.evalHistory.length === 0 ? (
          <p className="text-xs text-[#6E7381]">
            Nenhuma avaliação registrada no histórico ainda.
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {u.evalHistory.map((ev) => {
              const diff = ev.nextOvr - ev.prevOvr;
              const isExpanded = expandedEvalId === ev.id;
              return (
                <div
                  key={ev.id}
                  className="bg-[#F4F5F7] rounded-xl p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-[#111317]">
                      {ev.date} · {ev.cycle}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="n font-extrabold text-[#FF5400]">
                        OVR {ev.prevOvr} → {ev.nextOvr}{" "}
                        <span className={diff >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}>
                          ({diff >= 0 ? `+${diff}` : diff})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedEvalId(isExpanded ? null : ev.id)
                        }
                        className="text-[11px] font-bold text-[#111317] bg-white border border-[#EAEBEF] px-2 py-0.5 rounded-lg hover:border-[#FF5400] transition"
                      >
                        {isExpanded ? "Ocultar" : "Ver completa"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm("Excluir esta avaliação do histórico? O Overall atual será recalculado.")) return;
                          const nextHistory = (u.evalHistory || []).filter((h) => h.id !== ev.id);
                          const latest = nextHistory[0];
                          S.upd(u.id, {
                            evalHistory: nextHistory,
                            sub: latest ? { ...latest.sub } : { ...baseSub },
                            bd: latest?.bd ? { ...latest.bd } : B0(),
                            r: latest?.r ? { ...latest.r } : {},
                            ev: latest ? { d: latest.date, c: latest.cycle } : null,
                            nota: latest?.nota || "",
                          });
                          S.say(`Avaliação removida! Overall atualizado para ${ovr(latest ? latest.sub : baseSub)}.`);
                        }}
                        className="text-[11px] font-bold text-[#EF4444] hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  {ev.nota && !isExpanded && (
                    <p className="text-[#6E7381] italic">&ldquo;{ev.nota}&rdquo;</p>
                  )}
                  {isExpanded && (
                    <div className="pt-2 border-t border-[#E5E7EB] space-y-2.5">
                      <div className="bg-white rounded-lg p-2.5 border border-[#EAEBEF]">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6E7381] mb-1">
                          Nota do Professor
                        </p>
                        <p className="text-xs text-[#111317] italic">
                          {ev.nota ? `“${ev.nota}”` : "Sem observação registrada."}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {CATS.map((c) => {
                          const catScore = ev.sub?.[c.k] ?? 65;
                          const badgeLvl = ev.bd?.[c.k]?.l;
                          return (
                            <div
                              key={c.k}
                              className="bg-white rounded-lg p-2.5 border border-[#EAEBEF] space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[#111317]">
                                  {c.t}
                                </span>
                                <span className="n font-extrabold text-[#FF5400]">
                                  {catScore}
                                  {badgeLvl !== undefined ? ` · ${BE[badgeLvl]} ${BN[badgeLvl]}` : ""}
                                </span>
                              </div>
                              {ev.r ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-[#F4F5F7]">
                                  {c.n.map(([k, nm]) => {
                                    const val = ev.r?.[k] ?? 0;
                                    return (
                                      <div
                                        key={k}
                                        className="flex justify-between items-center text-[11px] bg-[#F4F5F7] rounded px-2 py-1"
                                      >
                                        <span className="text-[#6E7381] truncate pr-2">
                                          {nm}
                                        </span>
                                        <span className="n font-bold text-[#111317] shrink-0">
                                          {val}/20 → {nano(val)} pts
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[11px] text-[#94A3B8]">
                                  Detalhamento por fundamento não disponível nesta avaliação antiga.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ABA "ALUNOS" (EXCLUSIVA PARA ALUNOS ASSINANTES HEZI SKILLS)
// ---------------------------------------------------------------------------
export function Assinantes({ S }: { S: AppContextProps }) {
  const assinantesList = S.users.filter((x) => x.tipo === "aluno");
  const [sel, setSel] = useState<number>(assinantesList[0]?.id ?? 1);
  const u = assinantesList.find((x) => x.id === sel) || assinantesList[0];

  const [hpAmount, setHpAmount] = useState<number>(5);
  const [hpReason, setHpReason] = useState<string>("MVP da semana");
  const [subMode, setSubMode] = useState<"lista" | "avaliar">("lista");

  const getStatusLabel = (st?: HeziUser["st"]) => {
    if (st === "ex_aluno") return "⚪ Ex-Assinante (Comum)";
    if (st === "pendente" || st === "inativo") return "🔴 Mensalidade Pendente";
    return "🟢 Matrícula Regular";
  };

  const getStatusChipClass = (st?: HeziUser["st"]) => {
    if (st === "ex_aluno") return "bg-[#F4F5F7] text-[#6E7381]";
    if (st === "pendente" || st === "inativo") return RED;
    return GRN;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSubMode("lista")}
          className={
            "rounded-xl py-2.5 px-3 text-xs font-extrabold transition " +
            (subMode === "lista"
              ? "bg-[#111317] text-white"
              : "bg-white border border-[#EAEBEF] text-[#6E7381]")
          }
        >
          📋 Lista &amp; Pontos
        </button>
        <button
          type="button"
          onClick={() => setSubMode("avaliar")}
          className={
            "rounded-xl py-2.5 px-3 text-xs font-extrabold transition " +
            (subMode === "avaliar"
              ? "bg-[#FF5400] text-white"
              : "bg-white border border-[#EAEBEF] text-[#6E7381]")
          }
        >
          📊 Avaliar Assinante
        </button>
      </div>

      {subMode === "avaliar" ? (
        <Avaliar S={S} />
      ) : (
        <>
      <div className={C + " p-3.5 flex items-center justify-between gap-2"}>
        <div>
          <p className="font-extrabold text-sm text-[#111317]">
            ⚡ Gestão Exclusiva de Assinantes Assinantes ({assinantesList.length})
          </p>
          <p className="text-xs text-[#6E7381]">
            Apenas assinantes Hezi Skills aparecem aqui. Usuários gerais ficam no
            bloco &ldquo;Usuários&rdquo;.
          </p>
        </div>
        <Chip c="bg-[#FFF4EE] text-[#FF5400]">2x GP Automático</Chip>
      </div>

      {assinantesList.length === 0 ? (
        <div className={C + " p-5 text-center space-y-1"}>
          <p className="font-bold text-sm text-[#111317]">
            Nenhum aluno cadastrado no momento
          </p>
          <p className="text-xs text-[#6E7381]">
            Você pode converter um usuário comum em Assinante Assinante na aba
            &ldquo;Usuários&rdquo;.
          </p>
        </div>
      ) : (
        assinantesList.map((x) => (
          <div
            key={x.id}
            onClick={() => setSel(x.id)}
            className={
              C +
              " p-3 space-y-2.5 cursor-pointer transition " +
              (u && x.id === u.id ? "ring-2 ring-[#FF5400] bg-[#FFF4EE]/30" : "")
            }
          >
            <div className="flex items-center gap-3">
              <Av u={x} s="w-10 h-10 text-sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#111317] truncate">
                  {x.nome}{" "}
                  {x.username && (
                    <span className="text-xs font-normal text-[#6E7381]">
                      @{x.username}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#6E7381]">
                  {x.st === "ex_aluno"
                    ? "Ex-Assinante (Exibido como Comum)"
                    : "Assinante Hezi Skills (2x GP)"}{" "}
                  · <span className="n font-bold text-[#10B981]">{x.gp ?? 0} GP</span>
                  {x.st !== "ex_aluno" ? ` · 🔥 ${x.of ?? 0} sem.` : ""}
                </p>
              </div>

              <Chip c={getStatusChipClass(x.st)}>{getStatusLabel(x.st)}</Chip>
            </div>

            {S.role === "admin" && (
              <div
                className="pt-2 border-t border-[#EAEBEF] flex flex-wrap items-center justify-between gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] font-extrabold uppercase text-[#6E7381]">
                  Situação da Assinatura:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["ativo", "🟢 Regular"],
                      ["pendente", "🔴 Pendente"],
                      ["ex_aluno", "⚪ Ex-Assinante"],
                    ] as const
                  ).map(([stKey, label]) => {
                    const active =
                      (x.st === "inativo" ? "pendente" : x.st ?? "ativo") ===
                      stKey;
                    return (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => {
                          S.upd(x.id, { st: stKey });
                          S.say(
                            `${x.nome}: atualizado para ${
                              stKey === "ativo"
                                ? "Matrícula Regular (2x GP ativo)"
                                : stKey === "pendente"
                                  ? "Mensalidade Pendente (acesso liberado com aviso em vermelho)"
                                  : "Ex-Assinante (dados preservados, exibido como usuário comum)"
                            }`,
                          );
                        }}
                        className={
                          "text-[11px] font-extrabold rounded-lg px-2.5 py-1 transition " +
                          (active
                            ? "bg-[#111317] text-white"
                            : "bg-[#F4F5F7] text-[#6E7381] hover:text-[#111317]")
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                  {/* Botão de Remover Assinatura */}
                  <button
                    type="button"
                    onClick={() => {
                      S.upd(x.id, { tipo: "jogador", st: undefined });
                      S.say(`${x.nome} não é mais Assinante (movido para Usuários).`);
                    }}
                    className="text-[11px] font-extrabold rounded-lg px-2.5 py-1 bg-[#F4F5F7] text-[#6E7381] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition"
                    title="Remover assinatura e voltar para usuário comum"
                  >
                    Remover Assinatura
                  </button>
                  {/* Botão de Excluir Assinante */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Tem certeza que deseja excluir o assinante "${x.nome}"? Esta ação removerá a conta do banco de dados.`,
                        )
                      ) {
                        S.deleteUser(x.id);
                      }
                    }}
                    className="text-[11px] font-extrabold rounded-lg px-2.5 py-1 text-[#EF4444] hover:bg-[#FEF2F2] flex items-center gap-1 transition"
                    title="Excluir assinante do banco de dados"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {u && (
        <div className={C + " p-4 space-y-3"}>
          <p className="font-extrabold text-sm text-[#111317]">
            Lançar Grind Points (Assinante):{" "}
            <span className="text-[#FF5400]">{u.nome}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-[#6E7381] block mb-1">
                Quantidade de GP
              </label>
              <input
                type="number"
                min={1}
                value={hpAmount}
                onChange={(e) => setHpAmount(Math.max(1, Number(e.target.value) || 0))}
                className="w-full bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-sm font-bold outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#6E7381] block mb-1">
                Motivo dos ganhos
              </label>
              <select
                value={hpReason}
                onChange={(e) => setHpReason(e.target.value)}
                className="w-full bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none"
              >
                <option value="MVP da semana">MVP da semana</option>
                <option value="Grind Points por mérito">Grind Points por mérito</option>
                <option value="Presença em Evento">Presença em Evento</option>
              </select>
            </div>
          </div>
          <Btn
            onClick={() => {
              const isSub = u.tipo === "aluno" && u.st !== "ex_aluno";
              const finalPts = isSub ? hpAmount * 2 : hpAmount;
              const entry = {
                id: `gp-${Date.now()}`,
                amount: finalPts,
                baseAmount: hpAmount,
                reason: hpReason,
                date: new Date().toISOString(),
                doubled: isSub,
              };
              S.upd(u.id, {
                gp: (u.gp ?? 0) + finalPts,
                gpHistory: [entry, ...(u.gpHistory || [])],
              });
              S.say(
                `${u.nome}: +${finalPts} GP (${hpReason}${isSub ? " · 2x Assinante" : ""}) ✓`,
              );
            }}
            c={OB}
          >
            Adicionar +{u.tipo === "aluno" && u.st !== "ex_aluno" ? hpAmount * 2 : hpAmount} GP
          </Btn>

          {/* Histórico de ganhos de GP */}
          <div className="pt-2 border-t border-[#EAEBEF] space-y-1.5">
            <p className="text-[11px] font-extrabold text-[#6E7381] uppercase">
              📜 Histórico de Ganhos de Grind Points ({(u.gpHistory || []).length})
            </p>
            {(!u.gpHistory || u.gpHistory.length === 0) ? (
              <p className="text-xs text-[#9CA3AF]">Nenhum ganho registrado ainda.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {u.gpHistory.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between text-xs bg-[#F4F5F7] rounded-lg px-2.5 py-1.5"
                  >
                    <div>
                      <span className="font-bold text-[#111317]">{h.reason}</span>
                      {h.doubled && (
                        <span className="ml-1.5 text-[10px] font-extrabold text-[#FF5400]">
                          (2x Assinante)
                        </span>
                      )}
                      <span className="block text-[10px] text-[#6E7381]">
                        {new Date(h.date).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <span className="font-extrabold text-[#10B981]">+{h.amount} GP</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {S.role !== "admin" && (
            <p className="text-xs text-[#6E7381] pt-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Modo Professor: apenas o Administrador pode alterar situação de
              assinatura.
            </p>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NOVO BLOCO ADMINISTRATIVO: "USUÁRIOS" NO GERAL (SEPARADO DE ALUNOS)
// ---------------------------------------------------------------------------
export function UsuariosGeral({ S }: { S: AppContextProps }) {
  const generalUsers = S.users.filter((x) => x.tipo !== "aluno");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<number>(generalUsers[0]?.id ?? 0);
  const [creatingMock, setCreatingMock] = useState(false);
  const [mockForm, setMockForm] = useState({
    tipo: "jogador" as "jogador" | "aluno" | "professor",
    nome: "",
    username: "",
    apelido: "",
    email: "",
    pos: "Armador",
    st: "ativo" as "ativo" | "pendente" | "ex_aluno",
    hp: 20,
  });

  const filtered = generalUsers.filter((x) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      x.nome.toLowerCase().includes(q) ||
      (x.username || "").toLowerCase().includes(q) ||
      (x.email || "").toLowerCase().includes(q) ||
      (x.apelido || "").toLowerCase().includes(q)
    );
  });

  const u =
    filtered.find((x) => x.id === sel) ||
    generalUsers.find((x) => x.id === sel) ||
    filtered[0] ||
    null;

  const [hpAmount, setHpAmount] = useState<number>(5);
  const [hpReason, setHpReason] = useState<string>("MVP da semana");
  const [subMode, setSubMode] = useState<"lista" | "avaliar">("lista");

  const handleCreateMockUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = sanitizeUsername(mockForm.username || mockForm.nome);
    if (!cleanUser || !mockForm.nome.trim()) {
      S.say("Informe o nome do usuário.");
      return;
    }

    const newId = Date.now();
    const newUser: HeziUser = {
      id: newId,
      tipo: mockForm.tipo,
      nome: mockForm.nome.trim(),
      username: cleanUser,
      apelido: mockForm.apelido.trim() || mockForm.nome.split(" ")[0],
      email:
        mockForm.email.trim().toLowerCase() ||
        `${cleanUser}@simulado.hezi.com`,
      senha: "Hezi@2026",
      emailVerified: true,
      dataNascimento: "2000-01-01",
      wpp: "(21) 99999-0000",
      pos: mockForm.pos,
      st: mockForm.tipo === "aluno" ? mockForm.st : undefined,
      hp: Number(mockForm.hp) || 0,
      of: mockForm.tipo === "aluno" ? 1 : 0,
      sub: mockForm.tipo === "aluno" ? baseSub : undefined,
      r: mockForm.tipo === "aluno" ? mkR(baseSub) : undefined,
      bd: mockForm.tipo === "aluno" ? B0() : undefined,
    };

    S.addUser(newUser);
    setCreatingMock(false);
    setMockForm({
      tipo: "jogador",
      nome: "",
      username: "",
      apelido: "",
      email: "",
      pos: "Armador",
      st: "ativo",
      hp: 20,
    });
    setSel(newId);
    S.say(
      `Conta de simulação (${newUser.tipo.toUpperCase()}) "${newUser.nome}" criada com sucesso!`,
    );
  };

  return (
    <div className="space-y-3">
      <div className={C + " p-4 space-y-3"}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-extrabold text-sm text-[#111317]">
              👥 Gestão de Usuários no Geral ({generalUsers.length})
            </p>
            <p className="text-xs text-[#6E7381]">
              Usuários comuns e professores separados da aba de Assinantes. Promova
              para Professor, ative assinatura de Assinante ou crie contas de teste.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {S.role === "admin" && (
              <button
                type="button"
                onClick={() => setCreatingMock(!creatingMock)}
                className="rounded-xl bg-[#FF5400] text-white text-xs font-extrabold px-3 py-2 flex items-center gap-1 hover:bg-[#E04A00] transition active:scale-95 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {creatingMock ? "Cancelar" : "+ Simular Usuário"}
              </button>
            )}
            <Chip c="bg-[#111317] text-white">{generalUsers.length} contas</Chip>
          </div>
        </div>

        {/* Modal / Bloco de Criação de Usuário de Teste / Simulação */}
        {creatingMock && S.role === "admin" && (
          <form
            onSubmit={handleCreateMockUser}
            className="bg-[#FFF4EE] border border-[#FFD8C2] rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold text-[#111317] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF5400]" />
                Criar Usuário para Simulação / Teste
              </p>
              <button
                type="button"
                onClick={() => setCreatingMock(false)}
                className="text-[#6E7381] hover:text-[#111317] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                  Tipo de Usuário
                </label>
                <select
                  value={mockForm.tipo}
                  onChange={(e) =>
                    setMockForm({
                      ...mockForm,
                      tipo: e.target.value as "jogador" | "aluno" | "professor",
                    })
                  }
                  className="w-full bg-white rounded-xl px-3 py-2 text-xs font-bold outline-none border border-[#EAEBEF]"
                >
                  <option value="jogador">🏀 Jogador / Usuário Comum</option>
                  <option value="professor">🧑‍🏫 Professor (Staff)</option>
                  <option value="aluno">⚡ Assinante Assinante Hezi Skills</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                  Nome Completo
                </label>
                <input
                  value={mockForm.nome}
                  placeholder="ex: João Teste"
                  onChange={(e) =>
                    setMockForm({ ...mockForm, nome: e.target.value })
                  }
                  className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none border border-[#EAEBEF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                  Nome de Usuário (login)
                </label>
                <input
                  value={mockForm.username}
                  placeholder="ex: joao_teste"
                  onChange={(e) =>
                    setMockForm({ ...mockForm, username: e.target.value })
                  }
                  className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none border border-[#EAEBEF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                  Posição
                </label>
                <select
                  value={mockForm.pos}
                  onChange={(e) =>
                    setMockForm({ ...mockForm, pos: e.target.value })
                  }
                  className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none border border-[#EAEBEF]"
                >
                  <option value="Armador">Armador</option>
                  <option value="Ala">Ala</option>
                  <option value="Ala-Armador">Ala-Armador</option>
                  <option value="Ala-Pivô">Ala-Pivô</option>
                  <option value="Pivô">Pivô</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                  HP Inicial
                </label>
                <input
                  type="number"
                  value={mockForm.hp}
                  onChange={(e) =>
                    setMockForm({
                      ...mockForm,
                      hp: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none border border-[#EAEBEF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                  E-mail (opcional)
                </label>
                <input
                  value={mockForm.email}
                  placeholder="joao@teste.com"
                  onChange={(e) =>
                    setMockForm({ ...mockForm, email: e.target.value })
                  }
                  className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none border border-[#EAEBEF]"
                />
              </div>

              {mockForm.tipo === "aluno" ? (
                <div>
                  <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                    Situação Matrícula
                  </label>
                  <select
                    value={mockForm.st}
                    onChange={(e) =>
                      setMockForm({
                        ...mockForm,
                        st: e.target.value as "ativo" | "pendente" | "ex_aluno",
                      })
                    }
                    className="w-full bg-white rounded-xl px-3 py-2 text-xs font-bold outline-none border border-[#EAEBEF]"
                  >
                    <option value="ativo">🟢 Regular</option>
                    <option value="pendente">🔴 Pendente</option>
                    <option value="ex_aluno">⚪ Ex-Assinante</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                    Senha Padrão
                  </label>
                  <input
                    value="Hezi@2026"
                    disabled
                    className="w-full bg-[#EAEBEF] rounded-xl px-3 py-2 text-xs font-bold text-[#6E7381] outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCreatingMock(false)}
                className="rounded-xl bg-white border border-[#EAEBEF] text-[#6E7381] text-xs font-bold px-3 py-2 hover:bg-[#F4F5F7] transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#111317] hover:bg-[#FF5400] text-white text-xs font-extrabold px-4 py-2 transition shadow-sm"
              >
                Criar Usuário Simulado
              </button>
            </div>
          </form>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, @usuario, apelido ou e-mail..."
          className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:ring-2 ring-[#FF5400]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className={C + " p-5 text-center space-y-1"}>
          <p className="font-bold text-sm text-[#111317]">
            Nenhum usuário geral encontrado
          </p>
          <p className="text-xs text-[#6E7381]">
            Novos usuários que criarem conta na plataforma aparecerão neste
            bloco automaticamente.
          </p>
        </div>
      ) : (
        filtered.map((x) => (
          <div
            key={x.id}
            onClick={() => setSel(x.id)}
            className={
              C +
              " p-3.5 space-y-2.5 cursor-pointer transition " +
              (u && x.id === u.id ? "ring-2 ring-[#FF5400] bg-[#FFF4EE]/30" : "")
            }
          >
            <div className="flex items-center gap-3">
              <Av u={x} s="w-11 h-11 text-sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-extrabold text-sm text-[#111317] truncate">
                    {x.nome}
                  </p>
                  {x.username && (
                    <span className="text-xs font-bold text-[#FF5400]">
                      @{x.username}
                    </span>
                  )}
                  {x.emailVerified ? (
                    <span
                      className="text-[10px] font-extrabold bg-[#ECFDF5] text-[#10B981] px-2 py-0.5 rounded-full"
                      title="E-mail confirmado"
                    >
                      ✓ E-mail Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold bg-[#FFF4EE] text-[#FF5400] px-2 py-0.5 rounded-full">
                      Pendente E-mail
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6E7381] truncate">
                  {x.tipo === "professor"
                    ? "🧑‍🏫 Professor (Organizador)"
                    : "🏀 Usuário Comum"}{" "}
                  · <span className="n font-bold text-[#10B981]">{x.gp ?? 0} GP</span>
                  {x.email ? ` · ${x.email}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {x.isModerator && (
                  <Chip c="bg-[#FFF4EE] text-[#FF5400]">🛡️ Moderador</Chip>
                )}
                {x.tipo === "professor" ? (
                  <Chip c="bg-[#ECFDF5] text-[#10B981]">🧑‍🏫 Professor</Chip>
                ) : (
                  <Chip c="bg-[#F4F5F7] text-[#6E7381]">Usuário</Chip>
                )}
              </div>
            </div>

            {S.role === "admin" && (
              <div
                className="pt-2 border-t border-[#EAEBEF] flex flex-wrap items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap gap-1.5">
                  {x.isModerator ? (
                    <button
                      type="button"
                      onClick={() => {
                        S.upd(x.id, { isModerator: false });
                        S.say(`${x.nome} não é mais Moderador.`);
                      }}
                      className="text-xs font-extrabold rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] px-3 py-1.5 transition"
                    >
                      Remover Moderador
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        S.upd(x.id, { isModerator: true });
                        S.say(
                          `🛡️ ${x.nome} foi promovido a Moderador! Agora possui os mesmos poderes de Administrador.`,
                        );
                      }}
                      className="text-xs font-extrabold rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white px-3 py-1.5 transition flex items-center gap-1.5"
                    >
                      🛡️ Promover a Moderador
                    </button>
                  )}

                  {x.tipo === "jogador" ? (
                    <button
                      type="button"
                      onClick={() => {
                        S.upd(x.id, { tipo: "professor" });
                        S.say(
                          `${x.nome} foi promovido a Professor! Agora possui poderes para organizar eventos e avaliar atletas.`,
                        );
                      }}
                      className="text-xs font-extrabold rounded-xl bg-[#111317] hover:bg-[#FF5400] text-white px-3 py-1.5 transition flex items-center gap-1.5"
                    >
                      <UserCog className="w-3.5 h-3.5 text-[#FF5400]" />
                      Promover a Professor
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        S.upd(x.id, { tipo: "jogador" });
                        S.say(`${x.nome} voltou a ser Usuário Comum.`);
                      }}
                      className="text-xs font-extrabold rounded-xl bg-[#F4F5F7] hover:bg-[#FEF2F2] text-[#6E7381] hover:text-[#EF4444] px-3 py-1.5 transition"
                    >
                      Remover cargo de Professor
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      S.upd(x.id, {
                        tipo: "aluno",
                        st: "ativo",
                        sub: x.sub || baseSub,
                        bd: x.bd || B0(),
                      });
                      S.say(
                        `⚡ ${x.nome} agora é Assinante Hezi Skills (movido para a aba Assinantes com 2x GP)!`,
                      );
                    }}
                    className="text-xs font-extrabold rounded-xl bg-[#FFF4EE] hover:bg-[#FF5400] text-[#FF5400] hover:text-white border border-[#FF5400]/30 px-3 py-1.5 transition"
                  >
                    ⚡ Tornar Assinante
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!x.emailVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        S.upd(x.id, { emailVerified: true });
                        S.say(`Conta de ${x.nome} ativada manualmente!`);
                      }}
                      className="text-[11px] font-extrabold text-[#10B981] hover:underline"
                    >
                      ✓ Ativar E-mail
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Deseja realmente excluir o usuário "${x.nome}"? Esta ação removerá a conta do banco de dados.`,
                        )
                      ) {
                        S.deleteUser(x.id);
                      }
                    }}
                    className="text-[11px] font-extrabold text-[#EF4444] hover:bg-[#FEF2F2] px-2 py-1 rounded-lg flex items-center gap-1 transition"
                    title="Excluir usuário do banco de dados"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {u && (
        <>
          <div className={C + " p-4 space-y-3"}>
            <div className="flex items-center justify-between border-b border-[#EAEBEF] pb-2">
              <p className="font-extrabold text-sm text-[#111317]">
                Dados do Usuário Selecionado
              </p>
              <Chip c={u.isModerator ? "bg-[#FFF4EE] text-[#FF5400]" : "bg-[#F4F5F7] text-[#6E7381]"}>
                {u.isModerator ? "🛡️ Moderador (Admin)" : u.tipo === "professor" ? "🧑‍🏫 Professor" : "🏀 Usuário"}
              </Chip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-[#6E7381] block">Nome completo</span>
                <span className="font-bold text-[#111317]">{u.nome}</span>
              </div>
              <div>
                <span className="text-[#6E7381] block">Apelido (Vulgo)</span>
                <span className="font-bold text-[#111317]">{u.apelido || "—"}</span>
              </div>
              <div>
                <span className="text-[#6E7381] block">Nome de usuário</span>
                <span className="font-bold text-[#111317]">@{u.username || "—"}</span>
              </div>
              <div>
                <span className="text-[#6E7381] block">E-mail</span>
                <span className="font-bold text-[#111317] break-all">{u.email || "—"}</span>
              </div>
              <div>
                <span className="text-[#6E7381] block">WhatsApp</span>
                <span className="font-bold text-[#111317]">{u.wpp || "—"}</span>
              </div>
              <div>
                <span className="text-[#6E7381] block">Instagram</span>
                <span className="font-bold text-[#111317]">{u.instagram || "—"}</span>
              </div>
              <div>
                <span className="text-[#6E7381] block">Data de Nascimento</span>
                <span className="font-bold text-[#111317]">{u.dataNascimento || "—"}</span>
              </div>
              <div>
                <span className="text-[#6E7381] block">Posição em Quadra</span>
                <span className="font-bold text-[#111317]">{u.pos || "—"}</span>
              </div>
              <div>
                <span className="text-[#6E7381] block">Grind Points / Ofensiva</span>
                <span className="font-bold text-[#10B981]">{u.gp ?? 0} GP · {u.of || 0} ofensiva</span>
              </div>
              <div>
                <span className="text-[#6E7381] block">Status do E-mail</span>
                <span className="font-bold text-[#111317]">{u.emailVerified === false ? "Pendente" : "Verificado ✓"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#6E7381] block">Autorização de Imagem e Voz</span>
                <span className="font-bold text-[#111317]">
                  {u.autorizacaoImagem ? `Aceito ✓${u.autorizacaoImagemData ? ` (${new Date(u.autorizacaoImagemData).toLocaleString("pt-BR")})` : ""}` : "Não informado"}
                </span>
              </div>
            </div>
          </div>

          <div className={C + " p-4 space-y-3"}>
            <p className="font-extrabold text-sm text-[#111317]">
              Lançar Grind Points:{" "}
              <span className="text-[#FF5400]">{u.nome}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-[#6E7381] block mb-1">
                  Quantidade de GP
                </label>
                <input
                  type="number"
                  min={1}
                  value={hpAmount}
                  onChange={(e) => setHpAmount(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#6E7381] block mb-1">
                  Motivo dos ganhos
                </label>
                <select
                  value={hpReason}
                  onChange={(e) => setHpReason(e.target.value)}
                  className="w-full bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none"
                >
                  <option value="MVP da semana">MVP da semana</option>
                  <option value="Grind Points por mérito">Grind Points por mérito</option>
                  <option value="Presença em Evento">Presença em Evento</option>
                </select>
              </div>
            </div>
            <Btn
              onClick={() => {
                const isSub = u.tipo === "aluno" && u.st !== "ex_aluno";
                const finalPts = isSub ? hpAmount * 2 : hpAmount;
                const entry = {
                  id: `gp-${Date.now()}`,
                  amount: finalPts,
                  baseAmount: hpAmount,
                  reason: hpReason,
                  date: new Date().toISOString(),
                  doubled: isSub,
                };
                S.upd(u.id, {
                  gp: (u.gp ?? 0) + finalPts,
                  gpHistory: [entry, ...(u.gpHistory || [])],
                });
                S.say(
                  `${u.nome}: +${finalPts} GP (${hpReason}${isSub ? " · 2x Assinante" : ""}) ✓`,
                );
              }}
              c={OB}
            >
              Adicionar +{u.tipo === "aluno" && u.st !== "ex_aluno" ? hpAmount * 2 : hpAmount} GP
            </Btn>

            {/* Histórico de ganhos de GP */}
            <div className="pt-2 border-t border-[#EAEBEF] space-y-1.5">
              <p className="text-[11px] font-extrabold text-[#6E7381] uppercase">
                📜 Histórico de Ganhos de Grind Points ({(u.gpHistory || []).length})
              </p>
              {(!u.gpHistory || u.gpHistory.length === 0) ? (
                <p className="text-xs text-[#9CA3AF]">Nenhum ganho registrado ainda.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {u.gpHistory.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-xs bg-[#F4F5F7] rounded-lg px-2.5 py-1.5"
                    >
                      <div>
                        <span className="font-bold text-[#111317]">{h.reason}</span>
                        {h.doubled && (
                          <span className="ml-1.5 text-[10px] font-extrabold text-[#FF5400]">
                            (2x Assinante)
                          </span>
                        )}
                        <span className="block text-[10px] text-[#6E7381]">
                          {new Date(h.date).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <span className="font-extrabold text-[#10B981]">+{h.amount} GP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Eventos({ S }: { S: AppContextProps }) {
  const [f, setF] = useState({
    t: "",
    tp: "Pelada",
    dia: "",
    hora: "",
    l: "",
    r: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    t: "",
    tp: "Pelada",
    q: "",
    l: "",
    r: "",
  });

  const peladaStore = usePelada();
  const maxTeamSize = getMaxTeamSize(peladaStore.gameFormat);
  const [openCourtEventId, setOpenCourtEventId] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className={C + " p-4 space-y-2.5"}>
        <p className="font-extrabold text-sm text-[#111317]">
          Criar Novo Evento / Abrir Pelada
        </p>
        <input
          value={f.t}
          placeholder="Título (ex: Pelada Oficial Hezi)"
          onChange={(e) => setF({ ...f, t: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm outline-none"
        />
        <select
          value={f.tp}
          onChange={(e) => setF({ ...f, tp: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-semibold outline-none"
        >
          {["Pelada", "Treino", "Torneio"].map((p) => (
            <option key={p} value={p}>
              Tipo: {p}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-[#6E7381] block mb-1">
              Dia do Evento
            </label>
            <input
              type="date"
              value={f.dia}
              onChange={(e) => setF({ ...f, dia: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#6E7381] block mb-1">
              Horário
            </label>
            <input
              type="time"
              value={f.hora}
              onChange={(e) => setF({ ...f, hora: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </div>
        <p className="text-[11px] text-[#6E7381]">
          💡 Eventos aparecem automaticamente na Página Inicial com o destaque{" "}
          <strong>&ldquo;Está rolando&rdquo;</strong> a partir de{" "}
          <strong>30 minutos antes</strong> do horário programado.
        </p>
        <input
          value={f.l}
          placeholder="Quadra / local (ex: Quadra Central)"
          onChange={(e) => setF({ ...f, l: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm outline-none"
        />
        <input
          value={f.r}
          placeholder="Descrição / Regras (ex: Regras FIBA, 7 pontos ou 7 minutos)"
          onChange={(e) => setF({ ...f, r: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm outline-none"
        />
        <Btn
          dis={!f.t.trim() || !f.dia || !f.hora}
          onClick={() => {
            const [yyyy, mm, dd] = f.dia.split("-");
            const formattedQ = `${dd}/${mm}/${yyyy} · ${f.hora}`;
            if (f.tp === "Pelada" && !S.evs.some((ev: any) => ev.tp === "Pelada")) {
              peladaStore.resetNight();
            }
            S.setEvs([
              ...S.evs,
              {
                id: Date.now(),
                t: f.t,
                tp: f.tp,
                q: formattedQ,
                l: f.l,
                r: f.r,
                f: [],
                rewardedUids: [],
              },
            ]);
            setF({ t: "", tp: "Pelada", dia: "", hora: "", l: "", r: "" });
            S.say("Evento criado e publicado!");
          }}
          c={OB}
        >
          <Plus className="w-4 h-4" />
          Criar evento
        </Btn>
      </div>

      {S.evs.map((e) => {
        const rolling = isEventRollingNow(e, new Date());
        return (
          <div key={e.id} className={C + " p-4 space-y-2.5"}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-[#111317]">
                    {e.t}{" "}
                    <span className="text-[#6E7381] font-medium">
                      · {e.f.length} na fila
                    </span>
                  </p>
                  {rolling && (
                    <Chip c="bg-[#EF4444] text-white">🔥 Está rolando</Chip>
                  )}
                </div>
                <p className="text-xs text-[#6E7381]">
                  {e.q} · {e.l}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (editingId === e.id) {
                      setEditingId(null);
                    } else {
                      setEditingId(e.id);
                      setEditForm({
                        t: e.t,
                        tp: e.tp || "Pelada",
                        q: e.q,
                        l: e.l,
                        r: e.r,
                      });
                    }
                  }}
                  className={
                    "text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition " +
                    (editingId === e.id
                      ? "bg-[#FFF4EE] text-[#FF5400] ring-1 ring-[#FF5400]"
                      : "text-[#6E7381] hover:text-[#111317] hover:bg-[#F4F5F7]")
                  }
                  title="Editar dados deste evento / pelada"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {editingId === e.id ? "Fechar" : "Editar"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const nextLive = !e.aoVivoAgora;
                    const nextEvs = S.evs.map((x) =>
                      x.id === e.id ? { ...x, aoVivoAgora: nextLive } : x,
                    );
                    S.setEvs(nextEvs);
                    S.say(
                      nextLive
                        ? `"${e.t}" destacado como "Está rolando" na Home!`
                        : `Destaque manual removido de "${e.t}".`,
                    );
                    try {
                      const cur = useHeziPlatform.getState();
                      await fetch("/api/hezi-sync", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                          hezi: {
                            lastModified: cur.lastModified,
                            users: cur.users,
                            evs: nextEvs,
                            notifications: cur.notifications,
                          },
                          heziUpdatedAt: cur.lastModified,
                        }),
                      });
                    } catch {
                      /* sync em segundo plano */
                    }
                  }}
                  className={
                    "text-xs font-extrabold px-2.5 py-1 rounded-lg transition " +
                    (e.aoVivoAgora
                      ? "bg-[#EF4444] text-white"
                      : "bg-[#F4F5F7] text-[#111317] hover:bg-[#EAEBEF]")
                  }
                  title="Alternar destaque 'Está rolando' na Página Inicial"
                >
                  {e.aoVivoAgora ? "🔥 Ao Vivo" : "Destacar"}
                </button>
                <button
                  type="button"
                  onClick={() => S.setEvs(S.evs.filter((x) => x.id !== e.id))}
                  className="text-[#EF4444] text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  excluir
                </button>
              </div>
            </div>

            {/* Bloco de Edição do Evento / Pelada */}
            {editingId === e.id && (
              <div className="bg-[#FFF4EE] border border-[#FFD8C2] rounded-2xl p-3.5 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-[#111317]">
                    Editar Evento / Pelada
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-[#6E7381] hover:text-[#111317] p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                    Título
                  </label>
                  <input
                    value={editForm.t}
                    placeholder="Título do evento"
                    onChange={(ev) =>
                      setEditForm({ ...editForm, t: ev.target.value })
                    }
                    className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none border border-[#EAEBEF] focus:ring-2 ring-[#FF5400]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                      Tipo
                    </label>
                    <select
                      value={editForm.tp}
                      onChange={(ev) =>
                        setEditForm({ ...editForm, tp: ev.target.value })
                      }
                      className="w-full bg-white rounded-xl px-3 py-2 text-xs font-bold outline-none border border-[#EAEBEF] focus:ring-2 ring-[#FF5400]"
                    >
                      {["Pelada", "Treino", "Torneio"].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                      Dia e horário
                    </label>
                    <input
                      value={editForm.q}
                      placeholder="ex: Terça · 19:00"
                      onChange={(ev) =>
                        setEditForm({ ...editForm, q: ev.target.value })
                      }
                      className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none border border-[#EAEBEF] focus:ring-2 ring-[#FF5400]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                      Quadra / Local
                    </label>
                    <input
                      value={editForm.l}
                      placeholder="ex: Quadra Central"
                      onChange={(ev) =>
                        setEditForm({ ...editForm, l: ev.target.value })
                      }
                      className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none border border-[#EAEBEF] focus:ring-2 ring-[#FF5400]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6E7381] mb-1">
                      Descrição / Regras do jogo
                    </label>
                    <input
                      value={editForm.r}
                      placeholder="ex: Regras FIBA, 7 pontos ou 7 minutos"
                      onChange={(ev) =>
                        setEditForm({ ...editForm, r: ev.target.value })
                      }
                      className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium outline-none border border-[#EAEBEF] focus:ring-2 ring-[#FF5400]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editForm.t.trim() || !editForm.q.trim()) return;
                      const nextEvs = S.evs.map((x) =>
                        x.id === e.id ? { ...x, ...editForm } : x,
                      );
                      S.setEvs(nextEvs);
                      setEditingId(null);
                      S.say("Evento atualizado com sucesso!");
                      try {
                        const cur = useHeziPlatform.getState();
                        await fetch("/api/hezi-sync", {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            hezi: {
                              lastModified: cur.lastModified,
                              users: cur.users,
                              evs: nextEvs,
                              notifications: cur.notifications,
                            },
                            heziUpdatedAt: cur.lastModified,
                          }),
                        });
                      } catch {
                        /* sync em segundo plano */
                      }
                    }}
                    className="flex-1 rounded-xl bg-[#FF5400] hover:bg-[#E04A00] text-white text-xs font-extrabold py-2 px-3 transition active:scale-95 shadow-sm"
                  >
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-xl bg-white text-[#6E7381] text-xs font-bold py-2 px-3 transition active:scale-95 border border-[#EAEBEF]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const calledUsers = e.f
                    .slice(0, maxTeamSize)
                    .map((i) => S.users.find((u) => u.id === i))
                    .filter(Boolean) as HeziUser[];
                  calledUsers.forEach((u) => {
                    peladaStore.addPlayer(u.nome, {
                      role: u.tipo === "aluno" ? "aluno" : "convencional",
                      userId: String(u.id),
                      position: u.pos,
                    });
                  });
                  const names = calledUsers.map((u) => u.nome);
                  S.setEvs(
                    S.evs.map((x) =>
                      x.id === e.id
                        ? { ...x, f: x.f.slice(maxTeamSize) }
                        : x,
                    ),
                  );
                  S.say(
                    names.length
                      ? "Em quadra: " + names.join(", ")
                      : "Fila vazia",
                  );
                }}
                className="rounded-xl bg-[#111317] text-white text-xs font-bold py-3 px-2 transition active:scale-95"
              >
                Chamar próximo time ({maxTeamSize})
              </button>
              <button
                type="button"
                onClick={() => {
                  S.setEvs(
                    S.evs.map((x) => (x.id === e.id ? { ...x, f: [] } : x)),
                  );
                  if (e.tp === "Pelada") {
                    peladaStore.resetNight();
                  void fetch("/api/hezi/pelada/reset", { method: "POST" }).catch(() => {});
                  }
                  S.say("Fila limpa com sucesso!");
                }}
                className="rounded-xl bg-[#F4F5F7] text-[#111317] text-xs font-bold py-3 px-2 transition active:scale-95"
              >
                Limpar fila
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !window.confirm(
                      `Encerrar o evento "${e.t}"? Todos os dados da pelada serão salvos no histórico e a fila/quadra será zerada para o próximo evento.`,
                    )
                  ) {
                    return;
                  }
                  const peladaSnap = usePelada.getState();
                  const participantSet = new Set<string>();
                  if (e.tp === "Pelada") {
                    Object.values(peladaSnap.players).forEach((p) => {
                      if (p.name) participantSet.add(p.name);
                    });
                  }
                  [...(e.f || []), ...(e.rewardedUids || [])].forEach((uid) => {
                    const usr = S.users.find((u) => u.id === uid);
                    if (usr) {
                      participantSet.add((usr.apelido && usr.apelido.trim()) || usr.nome);
                    }
                  });
                  const teamRanking =
                    e.tp === "Pelada"
                      ? Object.values(peladaSnap.teamStats || {})
                          .map((ts) => ({
                            teamName: (ts as any).name || (ts as any).teamName || "Time",
                            wins: ts.wins,
                            games: ((ts as any).wins || 0) + ((ts as any).losses || 0),
                          }))
                          .sort((a, b) => b.wins - a.wins)
                      : [];
                  useHeziPlatform.getState().addEventHistory({
                    id: `hist-${e.id}-${Date.now()}`,
                    eventId: e.id,
                    title: e.t,
                    tp: e.tp,
                    q: e.q,
                    l: e.l,
                    endedAt: new Date().toISOString(),
                    participants: Array.from(participantSet),
                    teamRanking,
                    actionLog: e.tp === "Pelada" ? (peladaSnap.actionLog || []).map((a: any) => typeof a === "string" ? a : a.text || JSON.stringify(a)) : [],
                  });
                  if (e.tp === "Pelada") {
                    peladaStore.resetNight();
                  void fetch("/api/hezi/pelada/reset", { method: "POST" }).catch(() => {});
                  }
                  S.setEvs(S.evs.filter((x) => x.id !== e.id));
                  S.say(`Evento "${e.t}" encerrado e salvo no histórico!`);
                }}
                className="col-span-2 rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white text-xs font-extrabold py-3 px-3 transition active:scale-95"
              >
                🏁 Encerrar Evento e Salvar Histórico
              </button>
              {e.tp === "Pelada" && (
                <button
                  type="button"
                  onClick={() =>
                    setOpenCourtEventId(openCourtEventId === e.id ? null : e.id)
                  }
                  className="col-span-2 rounded-xl bg-[#111317] hover:bg-black text-white text-xs font-extrabold py-3 px-3 transition active:scale-95"
                >
                  {openCourtEventId === e.id
                    ? "▲ Fechar Court Master desta Pelada"
                    : "🏟️ Abrir Court Master desta Pelada"}
                </button>
              )}
            </div>
            {e.tp === "Pelada" && openCourtEventId === e.id && (
              <div className="pt-3 border-t border-[#EAEBEF]">
                <CourtMasterOrganizer embedded />
              </div>
            )}
          </div>
        );
      })}

      {/* Histórico de Eventos & Peladas Encerradas */}
      {(() => {
        const eventHistory = useHeziPlatform.getState().eventHistory || [];
        if (eventHistory.length === 0) return null;
        return (
          <div className="space-y-3 pt-2">
            <h3 className="font-extrabold text-sm text-[#111317] uppercase tracking-wider px-1">
              📜 Histórico de Eventos ({eventHistory.length})
            </h3>
            {eventHistory.map((h) => (
              <div key={h.id} className={C + " p-4 space-y-2.5"}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-sm text-[#111317]">{h.title}</p>
                    <p className="text-xs text-[#6E7381]">
                      {h.tp} · {h.q} · {h.l}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Encerrado em {new Date(h.endedAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Excluir "${h.title}" do histórico?`)) {
                        useHeziPlatform.getState().deleteEventHistory(h.id);
                        S.say("Registro removido do histórico.");
                      }
                    }}
                    className="text-xs font-bold text-[#EF4444] hover:bg-[#FEF2F2] px-2.5 py-1 rounded-lg transition"
                  >
                    Excluir
                  </button>
                </div>

                {h.teamRanking && h.teamRanking.length > 0 && (
                  <div className="bg-[#FFF4EE] rounded-xl p-2.5 space-y-1">
                    <p className="text-[11px] font-extrabold text-[#FF5400] uppercase">
                      🏆 Times com Mais Vitórias
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {h.teamRanking.map((tr, idx) => (
                        <span
                          key={tr.teamName + idx}
                          className="text-xs font-bold bg-white border border-[#FF5400]/20 text-[#111317] px-2 py-0.5 rounded-lg"
                        >
                          {idx + 1}º {tr.teamName}: {tr.wins}V ({tr.games}J)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-[#6E7381] mb-1">
                    👥 Participantes ({h.participants.length}):
                  </p>
                  <p className="text-xs text-[#111317]">
                    {h.participants.length > 0 ? h.participants.join(", ") : "Nenhum participante registrado."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

export function NotificacoesStaff({ S }: { S: AppContextProps }) {
  const queueRequests = S.notifications.filter(
    (n) => n.type === "queue_request",
  );
  const pendingRequests = queueRequests.filter((n) => n.status === "pending");
  const resolvedRequests = queueRequests.filter((n) => n.status !== "pending");

  return (
    <div className="space-y-4">
      <div className={C + " p-4 flex items-center justify-between"}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] text-[#FF5400] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="font-extrabold text-sm text-[#111317]">
              Central de Notificações · Entrada na Fila
            </p>
            <p className="text-xs text-[#6E7381]">
              Aceite solicitações para liberar a fila (+5 HP comuns / +10 HP
              assinantes · 1x por evento)
            </p>
          </div>
        </div>
        <Chip c={pendingRequests.length > 0 ? OB : "bg-[#F4F5F7] text-[#6E7381]"}>
          {pendingRequests.length} pendente(s)
        </Chip>
      </div>

      {/* Solicitações Pendentes */}
      <div className="space-y-2.5">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#6E7381] px-1">
          Solicitações Aguardando Confirmação ({pendingRequests.length})
        </p>
        {pendingRequests.length === 0 ? (
          <div className={C + " p-5 text-center space-y-1"}>
            <p className="font-bold text-sm text-[#111317]">
              Nenhuma solicitação pendente no momento
            </p>
            <p className="text-xs text-[#6E7381]">
              Toda vez que um usuário clicar em &ldquo;Entrar na fila&rdquo;, a
              solicitação com horário aparecerá aqui.
            </p>
          </div>
        ) : (
          pendingRequests.map((req) => {
            const reqUser = S.users.find((u) => u.id === req.fromUserId);
            const reqEv = S.evs.find((e) => e.id === req.eventId);
            const alreadyRewarded = Boolean(
              reqEv &&
                reqUser &&
                (reqEv.rewardedUids || []).includes(reqUser.id),
            );
            const pts = getEventEntryPoints(reqUser, 5);
            const isSub = isActiveSubscriber(reqUser);

            return (
              <div
                key={req.id}
                className={
                  C + " p-4 border-l-4 border-l-[#FF5400] space-y-3"
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-sm text-[#111317]">
                      🏀 {req.fromUserName} solicitou entrar na fila
                    </p>
                    <p className="text-xs text-[#6E7381] mt-0.5">
                      Evento:{" "}
                      <strong className="text-[#111317]">
                        {req.eventTitle || "Pelada Oficial Hezi"}
                      </strong>{" "}
                      ·{" "}
                      {alreadyRewarded ? (
                        <span className="font-bold text-[#6E7381]">
                          Reentrada (HP já creditado neste evento)
                        </span>
                      ) : isSub ? (
                        <span className="font-extrabold text-[#FF5400]">
                          ⚡ Assinante (+{pts} HP · 2x)
                        </span>
                      ) : (
                        <span className="font-bold text-[#10B981]">
                          +{pts} HP
                        </span>
                      )}
                    </p>
                  </div>
                  <Chip c="bg-[#F4F5F7] text-[#111317]">
                    🕒 {req.timeLabel}
                  </Chip>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => S.approveQueueRequest(req.id)}
                    className="rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-extrabold py-2.5 px-3 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {alreadyRewarded
                      ? "Aceitar Reentrada (0 HP)"
                      : `Aceitar (+${pts} HP${isSub ? " · 2x" : ""})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => S.rejectQueueRequest(req.id)}
                    className="rounded-xl bg-[#FEF2F2] text-[#EF4444] text-xs font-extrabold py-2.5 px-3 transition active:scale-95"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Histórico de Notificações Processadas */}
      {resolvedRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#6E7381] px-1">
            Histórico Recente
          </p>
          {resolvedRequests.slice(0, 15).map((req) => (
            <div
              key={req.id}
              className={
                C +
                " p-3 flex items-center justify-between gap-2 opacity-85"
              }
            >
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#111317] truncate">
                  {req.fromUserName} · {req.eventTitle || "Evento"}
                </p>
                <p className="text-[11px] text-[#6E7381]">
                  Data e hora:{" "}
                  <strong>
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleString("pt-BR")
                      : req.timeLabel}
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Chip c={req.status === "accepted" ? GRN : RED}>
                  {req.status === "accepted" ? "✓ Aceito" : "✕ Recusado / Cancelado"}
                </Chip>
                <button
                  type="button"
                  onClick={() => {
                    useHeziPlatform
                      .getState()
                      .setNotifications(
                        S.notifications.filter((x) => x.id !== req.id),
                      );
                    S.say("Notificação excluída.");
                  }}
                  className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#FEF2F2] transition"
                  title="Excluir notificação"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export function BancoDados({ S }: { S: AppContextProps }) {
  const [info, setInfo] = useState<DbStatusSummaryClient | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hezi-db", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as DbStatusSummaryClient;
        setInfo(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInfo();
  }, [S.users, S.evs]);

  const exportBackup = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            users: S.users,
            events: S.evs,
            pelada: usePelada.getState(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hezi-fam-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    S.say("Backup JSON exportado!");
  };

  const resetDb = async () => {
    if (
      !window.confirm(
        "Deseja restaurar o banco de dados SQLite para os dados originais de fábrica?",
      )
    )
      return;
    try {
      const res = await fetch("/api/hezi-db", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        const payload = (await res.json()) as {
          state: {
            hezi: {
              lastModified: number;
              users: HeziUser[];
              evs: HeziEventItem[];
            };
          };
          summary: DbStatusSummaryClient;
        };
        useHeziPlatform.getState().hydrateFromRemote(payload.state.hezi);
        setInfo(payload.summary);
        S.say("Banco SQLite restaurado para o estado inicial!");
      }
    } catch {
      S.say("Erro ao restaurar banco");
    }
  };

  return (
    <div className="space-y-3">
      <div className={C + " p-4 space-y-3"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-[#111317]">
                Banco de Dados em Nuvem · Supabase Ativo
              </p>
              <p className="text-xs text-[#6E7381]">
                PostgreSQL Cloud + Backups Diários + Criptografia SSL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadInfo()}
            className="p-2 rounded-xl bg-[#F4F5F7] text-[#111317] hover:bg-[#EAEBEF] transition"
            title="Atualizar status do banco"
          >
            <RefreshCw
              className={"w-4 h-4 " + (loading ? "animate-spin" : "")}
            />
          </button>
        </div>

        {info && (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F4F5F7] rounded-xl p-2.5">
                <p className="n font-extrabold text-xl text-[#111317]">
                  {S.users.length}
                </p>
                <p className="text-xs font-bold text-[#6E7381]">
                  USUÁRIOS ({S.users.filter((u) => u.tipo === "aluno").length}A /{" "}
                  {S.users.filter((u) => u.tipo === "jogador").length}J)
                </p>
              </div>
              <div className="bg-[#F4F5F7] rounded-xl p-2.5">
                <p className="n font-extrabold text-xl text-[#FF5400]">
                  {S.evs.length}
                </p>
                <p className="text-xs font-bold text-[#6E7381]">
                  EVENTOS
                </p>
              </div>
              <div className="bg-[#F4F5F7] rounded-xl p-2.5">
                <p className="n font-extrabold text-xl text-[#10B981]">
                  {info.counts.evaluationsHistory}
                </p>
                <p className="text-xs font-bold text-[#6E7381]">AVALIAÇÕES</p>
              </div>
            </div>

            <div className="text-xs bg-[#F4F5F7] rounded-xl p-2.5 text-[#6E7381] space-y-1 font-mono break-all">
              <div>
                <strong className="text-[#111317]">Cluster:</strong>{" "}
                qoxlbvvyjdtpwnhngkyj.supabase.co
              </div>
              <div>
                <strong className="text-[#111317]">Tabelas:</strong> hezi_users, hezi_events, court_master_state, hezi_platform_state
              </div>
              <div>
                <strong className="text-[#111317]">Status:</strong> Conectado em Nuvem com sincronização contínua
              </div>
            </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={exportBackup}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#111317] hover:bg-[#FF5400] text-white text-xs font-bold py-3 px-3 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Backup dos Dados
          </button>
        </div>
        </>
      )}
      </div>

      {/* Histórico de Avaliações gravado na tabela evaluations_history */}
      <div className={C + " p-4 space-y-2.5"}>
        <p className="font-extrabold text-sm text-[#111317]">
          📋 Histórico no Banco (`evaluations_history`)
        </p>
        {!info || info.recentEvaluations.length === 0 ? (
          <p className="text-xs text-[#6E7381]">
            Nenhuma avaliação processada nesta sessão ainda. Quando o Professor
            ou Admin salvar uma avaliação na aba &ldquo;Avaliar&rdquo;, o
            registro histórico aparecerá aqui automaticamente.
          </p>
        ) : (
          <div className="space-y-2">
            {info.recentEvaluations.map((ev) => (
              <div
                key={ev.id}
                className="bg-[#F4F5F7] rounded-xl p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#111317]">
                    {ev.userName}
                  </span>
                  <span className="n font-bold text-[#FF5400]">
                    OVR {ev.ovrBefore} → {ev.ovrAfter}
                  </span>
                </div>
                <p className="text-xs text-[#6E7381]">
                  Ciclo {ev.cycle} · Data: {ev.evalDate}
                </p>
                {ev.notaTecnica && (
                  <p className="text-xs text-[#111317] italic">
                    &ldquo;{ev.notaTecnica}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Staff({
  S,
  initialSubTab,
  onSubTabChange,
  profileSubTab = "perfil",
}: {
  S: AppContextProps;
  initialSubTab?: StaffSubTabKey;
  onSubTabChange?: (st: StaffSubTabKey) => void;
  profileSubTab?: "perfil" | "pass";
}) {
  const adm = S.role === "admin";
  const pendingStaffCount = S.notifications.filter(
    (n) => n.type === "queue_request" && n.status === "pending",
  ).length;

  const T: [StaffSubTabKey, string][] = [
    ["ev", "Eventos"],
    ["al", "Assinantes"],
    ["us", "Usuários"],
    ...(adm ? ([["db", "Banco SQL"]] as [StaffSubTabKey, string][]) : []),
  ];
  const [t, setT] = useState<StaffSubTabKey>(initialSubTab && initialSubTab !== "cm" ? initialSubTab : "ev");

  useEffect(() => {
    if (initialSubTab) setT(initialSubTab);
  }, [initialSubTab]);

  const handleSelect = (k: StaffSubTabKey) => {
    setT(k);
    onSubTabChange?.(k);
  };

  return (
    <div className="p-4 space-y-4">
      {t === "nf" ? (
        <NotificacoesStaff S={S} />
      ) : t === "av" ? (
        <Avaliar S={S} />
      ) : t === "al" ? (
        <Assinantes S={S} />
      ) : t === "us" ? (
        <UsuariosGeral S={S} />
      ) : t === "ev" ? (
        <Eventos S={S} />
      ) : t === "db" && adm ? (
        <BancoDados S={S} />
      ) : t === "perfil" && S.me ? (
        <Painel S={S} initialSubTab={profileSubTab} />
      ) : !S.evs.some((e) => e.tp === "Pelada") ? (
        <div className={C + " p-6 text-center space-y-3"}>
          <div className="w-12 h-12 rounded-full bg-[#FFF4EE] text-[#FF5400] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-[#111317]">
            Court Master Exclusivo para Pelada
          </h3>
          <p className="text-xs text-[#6E7381] max-w-sm mx-auto">
            O organizador de quadra Court Master só é liberado quando existe um evento do tipo <b>Pelada</b> criado. Crie um evento de Pelada na aba <b>Eventos</b> para liberar o acesso.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={C + " p-3 flex flex-wrap items-center justify-between gap-2"}>
            <div>
              <p className="font-extrabold text-sm text-[#111317]">
                Court Master · Organizador de Pelada (3x3 / 5x5)
              </p>
              <p className="text-xs text-[#6E7381]">
                Sincronizado com a fila de celulares da Pelada Oficial
              </p>
            </div>
            <div className="flex items-center gap-2">
              {adm && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Encerrar a pelada atual no Court Master, salvar no histórico e limpar todos os jogadores/fila?",
                      )
                    ) {
                      return;
                    }
                    const peladaSnap = usePelada.getState();
                    const activePelada = S.evs.find((ev: any) => ev.tp === "Pelada");
                    const participantSet = new Set<string>();
                    Object.values(peladaSnap.players).forEach((p) => {
                      if (p.name) participantSet.add(p.name);
                    });
                    if (activePelada) {
                      [...(activePelada.f || []), ...(activePelada.rewardedUids || [])].forEach((uid) => {
                        const usr = S.users.find((u) => u.id === uid);
                        if (usr) participantSet.add((usr.apelido && usr.apelido.trim()) || usr.nome);
                      });
                    }
                    const teamRanking = Object.values(peladaSnap.teamStats || {})
                      .map((ts) => ({ teamName: (ts as any).name || (ts as any).teamName || "Time", wins: ts.wins, games: ((ts as any).wins || 0) + ((ts as any).losses || 0) }))
                      .sort((a, b) => b.wins - a.wins);
                    if (participantSet.size > 0 || teamRanking.length > 0) {
                      useHeziPlatform.getState().addEventHistory({
                        id: `hist-cm-${Date.now()}`,
                        eventId: activePelada?.id ?? Date.now(),
                        title: activePelada?.t || "Pelada Court Master",
                        tp: "Pelada",
                        q: activePelada?.q || new Date().toLocaleDateString("pt-BR"),
                        l: activePelada?.l || "Quadra",
                        endedAt: new Date().toISOString(),
                        participants: Array.from(participantSet),
                        teamRanking,
                        actionLog: (peladaSnap.actionLog || []).map((a: any) => typeof a === "string" ? a : a.text || JSON.stringify(a)),
                      });
                    }
                    peladaSnap.resetNight();
                    if (activePelada) {
                      S.setEvs(S.evs.filter((ev) => ev.id !== activePelada.id));
                    }
                    S.say("Pelada encerrada, salva no histórico e Court Master limpo!");
                  }}
                  className="rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white text-xs font-extrabold px-3 py-2 transition active:scale-95"
                >
                  🏁 Encerrar e Limpar
                </button>
              )}
              <Users className="w-5 h-5 text-[#FF5400]" />
            </div>
          </div>
          <CourtMasterOrganizer embedded />
        </div>
      )}
    </div>
  );
}

