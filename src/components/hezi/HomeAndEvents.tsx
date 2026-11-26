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
import { Av, SHIRT_FRONT_IMG, SHIRT_BACK_IMG } from "@/routes/index";

export function Home({ S }: { S: AppContextProps }) {
  useTick(15000);
  const peladaStore = usePelada();
  const totalWaitingPlayers = peladaStore.queue.reduce((acc, entry) => {
    if (entry.kind === "player") return acc + 1;
    const t = peladaStore.teams[entry.id];
    return acc + (t ? t.memberIds.length : 0);
  }, 0);

  const rollingEvents = S.evs.filter((ev) => isEventRollingNow(ev, new Date()));

  return (
    <div className="p-4 space-y-6">
      {/* Hero */}
      <div className={C + " p-6"}>
        <img src={LOGO} className="h-14 invert mb-2 object-contain" alt="HEZI FAM®" />
        <h1 className="font-extrabold text-4xl leading-tight tracking-tight text-[#111317]">
          Moving the game.
        </h1>
        <p className="text-[#6E7381] text-sm mt-2 mb-5">
          Cadastre-se e participe do Hezi Pass para ganhar prêmios, entrar na fila pelo celular
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Btn onClick={() => S.setTab("pelada")} c={OB}>
            Jogar
          </Btn>
          <Btn onClick={S.goMeuPerfil} c="bg-[#111317] text-white">
            Entrar
          </Btn>
        </div>
      </div>

      {/* Destaque "Está rolando" (exibido a partir de 30 minutos antes do horário do evento) */}
      {rollingEvents.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#EF4444] text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Está rolando
            </span>
            <span className="text-xs font-bold text-[#6E7381]">
              Evento acontecendo ou prestes a começar
            </span>
          </div>

          {rollingEvents.map((ev) => {
            const isPeladaEvent = ev.tp === "Pelada";
            const queueCount = isPeladaEvent
              ? Math.max(ev.f.length, totalWaitingPlayers)
              : ev.f.length;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => {
                  S.setSelectedEventId(ev.id);
                  S.setTab("pelada");
                }}
                className={
                  C +
                  " w-full p-4 text-left border-2 border-[#FF5400] bg-gradient-to-br from-white to-[#FFF4EE]/60 transition active:scale-[0.99] space-y-2"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5400] flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" />
                    {ev.tp}
                  </span>
                  <Chip c="bg-[#111317] text-white">{queueCount} {ev.tp === "Treino" ? "na lista" : "na fila"}</Chip>
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-[#111317]">
                    {ev.t}
                  </h3>
                  <p className="text-xs text-[#6E7381] mt-0.5">
                    📅 {ev.q} · 📍 {ev.l}
                  </p>
                </div>

                {ev.r && (
                  <p className="text-xs bg-white/90 border border-[#EAEBEF] rounded-lg px-2.5 py-1.5 text-[#111317] font-medium">
                    📋 {ev.r}
                  </p>
                )}

                <div className="pt-1 flex items-center justify-between text-xs font-extrabold text-[#FF5400]">
                  <span>Toque para abrir e entrar na fila</span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Drop 001 : Basic Collection — Apenas Hezi Shirt 001 com fotos reais anexadas */}
      <div>
        <Hd>Drop 001 : Basic Collection</Hd>
        <div className={C + " p-4 space-y-3"}>
          {/* Fotos da Blusa (Frente e Costas limpas, sem badges ou botões de alternância) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl overflow-hidden bg-[#111317] aspect-square">
              <img
                src={SHIRT_FRONT_IMG}
                alt="Hezi Shirt 001"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden bg-[#111317] aspect-square">
              <img
                src={SHIRT_BACK_IMG}
                alt="Hezi Shirt 001"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info e Botão Reservar */}
          <div className="pt-1 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-lg text-[#111317]">
                Hezi Shirt 001
              </p>
            </div>
            <p className="n font-extrabold text-[#FF5400] text-2xl">
              R$ 70,00
            </p>
          </div>

          <Btn
            href={wa("Quero reservar: Hezi Shirt 001 (R$ 70,00)")}
            c={OB}
          >
            <MessageCircle className="w-4 h-4" />
            Reservar via WhatsApp
          </Btn>
        </div>
      </div>

      {/* Contato Rápido Oficial WhatsApp */}
      <div className={C + " p-4 flex items-center justify-between gap-3"}>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-[#111317]">
            Atendimento Oficial HEZI FAM®
          </p>
          <p className="text-xs text-[#6E7381]">
            Dúvidas sobre eventos, treinos ou reservas? Fale diretamente com nossa equipe no WhatsApp oficial.
          </p>
        </div>
        <a
          href={wa("Olá! Vim pela plataforma HEZI FAM e gostaria de atendimento.")}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-extrabold px-3.5 py-2.5 flex items-center gap-1.5 transition"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}

export function formatClockMs(ms: number) {
  const clamped = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Pelada({ S }: { S: AppContextProps }) {
  const peladaStore = usePelada();
  useTick();

  const { selectedEventId, setSelectedEventId } = S;
  const [adminPreviewUserView, setAdminPreviewUserView] = useState(false);

  const isOrganizer = S.role === "admin" || S.role === "professor";
  const maxTeamSize = getMaxTeamSize(peladaStore.gameFormat);

  const selectedEvent =
    selectedEventId !== null
      ? S.evs.find((e) => e.id === selectedEventId) || null
      : null;

  if (isOrganizer && !adminPreviewUserView && !selectedEvent) {
    return (
      <div className="p-4 space-y-4">
        <div className={C + " p-3.5 flex items-center justify-between gap-2"}>
          <div>
            <p className="font-extrabold text-sm text-[#111317]">
              {S.role === "admin" ? "🔑 Área do Administrador" : "🧑‍🏫 Área do Professor"} · Court Master ({peladaStore.gameFormat.toUpperCase()} · Máx {maxTeamSize}/time)
            </p>
            <p className="text-xs text-[#6E7381]">
              Organize a pelada aqui. Os jogadores veem os eventos disponíveis e
              a fila completa no celular.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdminPreviewUserView(true)}
            className="shrink-0 rounded-xl bg-[#F4F5F7] border border-[#EAEBEF] px-3 py-2 text-xs font-extrabold text-[#111317]"
          >
            👁️ Ver Eventos
          </button>
        </div>
        <CourtMasterOrganizer embedded />
      </div>
    );
  }

  const totalWaitingPlayers = peladaStore.queue.reduce((acc, entry) => {
    if (entry.kind === "player") return acc + 1;
    const t = peladaStore.teams[entry.id];
    return acc + (t ? t.memberIds.length : 0);
  }, 0);

  // 1) LISTA DE EVENTOS DISPONÍVEIS (quando nenhum evento foi clicado ainda)
  if (!selectedEvent) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-xl text-[#111317]">
              Eventos Disponíveis
            </h2>
            <p className="text-xs text-[#6E7381]">
              Toque em um evento abaixo para ver os detalhes e entrar na fila
            </p>
          </div>
          {isOrganizer && (
            <button
              type="button"
              onClick={() => setAdminPreviewUserView(false)}
              className="text-xs font-extrabold bg-[#111317] text-white px-3 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Timer className="w-3.5 h-3.5 text-[#FF5400]" />
              Court Master
            </button>
          )}
        </div>

        {S.evs.length === 0 ? (
          <div className={C + " p-6 text-center space-y-2"}>
            <p className="font-extrabold text-base text-[#111317]">
              Nenhum evento disponível no momento
            </p>
            <p className="text-xs text-[#6E7381]">
              Novos eventos criados pelo administrador ou professor aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {S.evs.map((ev) => {
              const isPeladaEvent = ev.tp === "Pelada";
              const queueCount = isPeladaEvent
                ? Math.max(ev.f.length, totalWaitingPlayers)
                : ev.f.length;
              const rolling = isEventRollingNow(ev, new Date());
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedEventId(ev.id)}
                  className={
                    C +
                    " w-full p-4 text-left border-l-4 border-l-[#FF5400] hover:border-[#FF5400] transition active:scale-[0.99] space-y-2.5"
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5400]">
                        {ev.tp}
                      </span>
                      {rolling && (
                        <Chip c="bg-[#EF4444] text-white">🔥 Está rolando</Chip>
                      )}
                    </div>
                    <Chip c="bg-[#F4F5F7] text-[#111317]">
                      {queueCount} {ev.tp === "Treino" ? "na lista" : "na fila"}
                    </Chip>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg text-[#111317]">
                      {ev.t}
                    </h3>
                    <p className="text-xs text-[#6E7381] mt-0.5">
                      📅 {ev.q} · 📍 {ev.l}
                    </p>
                  </div>

                  {ev.r && (
                    <p className="text-xs bg-[#F4F5F7] rounded-lg px-2.5 py-1.5 text-[#111317] font-medium">
                      📋 {ev.r}
                    </p>
                  )}

                  <div className="pt-1 flex items-center justify-between text-xs font-extrabold text-[#FF5400]">
                    <span>Abrir evento e ver fila</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 2) PÁGINA INTERNA DO EVENTO SELECIONADO (ex: Pelada Oficial Hezi)
  const myCourtStatus = S.me
    ? getPlayerPeladaStatus(peladaStore, {
        userId: String(S.me.id),
        name: S.me.nome,
      })
    : null;

  const duration = currentDurationMs(peladaStore);
  const elapsed = computeElapsed(peladaStore.court, Date.now());
  const remaining = Math.max(0, duration - elapsed);
  const isRunning = Boolean(peladaStore.court.runningSince);

  const teamA = peladaStore.court.teamAId
    ? peladaStore.teams[peladaStore.court.teamAId]
    : null;
  const teamB = peladaStore.court.teamBId
    ? peladaStore.teams[peladaStore.court.teamBId]
    : null;
  const champTeam = peladaStore.waitingChampion
    ? peladaStore.teams[peladaStore.waitingChampion]
    : null;

  const isPeladaOfficial = selectedEvent.tp === "Pelada";
  const isInSimpleEventQueue = S.me
    ? selectedEvent.f.includes(S.me.id)
    : false;

  const myPendingQueueRequest = S.me
    ? S.notifications.find(
        (n) =>
          n.type === "queue_request" &&
          n.status === "pending" &&
          n.fromUserId === S.me!.id &&
          n.eventId === selectedEvent.id,
      )
    : undefined;

  const myIncomingGroupInvites = S.me
    ? S.notifications.filter(
        (n) =>
          n.type === "group_invite" &&
          n.status === "pending" &&
          n.toUserId === S.me!.id,
      )
    : [];

  const amIInQueue =
    myCourtStatus?.status === "in-queue" || isInSimpleEventQueue;
  const myQueueTeamCount =
    myCourtStatus?.status === "in-queue" && myCourtStatus.team
      ? myCourtStatus.team.memberIds.length
      : 1;
  const canInviteOthers = amIInQueue && myQueueTeamCount < maxTeamSize;

  const myRewardPoints = getEventEntryPoints(S.me, 5);
  const isSubscriber = isActiveSubscriber(S.me);
  const alreadyRewardedThisEvent = S.me
    ? (selectedEvent.rewardedUids || []).includes(S.me.id)
    : false;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setSelectedEventId(null)}
          className="text-xs font-extrabold text-[#6E7381] hover:text-[#111317] bg-white border border-[#EAEBEF] rounded-xl px-3 py-2 transition"
        >
          ← Voltar para Eventos
        </button>

        {isOrganizer && (
          <button
            type="button"
            onClick={() => {
              setSelectedEventId(null);
              setAdminPreviewUserView(false);
            }}
            className="text-xs font-extrabold bg-[#111317] text-white px-3 py-2 rounded-xl flex items-center gap-1.5"
          >
            <Timer className="w-3.5 h-3.5 text-[#FF5400]" />
            Voltar ao Court Master
          </button>
        )}
      </div>

      <div>
        <h2 className="font-extrabold text-xl text-[#111317]">
          {selectedEvent.t}
        </h2>
        <p className="text-xs text-[#6E7381]">
          📅 {selectedEvent.q} · 📍 {selectedEvent.l} · Modalidade{" "}
          {peladaStore.gameFormat.toUpperCase()} (Máx {maxTeamSize}/time)
        </p>
      </div>

      {/* Solicitações de Grupo Recebidas pelo Jogador */}
      {myIncomingGroupInvites.length > 0 && (
        <div className="space-y-2">
          {myIncomingGroupInvites.map((inv) => (
            <div
              key={inv.id}
              className="bg-[#FFF4EE] border-2 border-[#FF5400] rounded-2xl p-3.5 space-y-2.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-[#FF5400] flex items-center gap-1.5">
                  <UsersRound className="w-4 h-4" />
                  Convite para Grupo na Fila
                </span>
                <span className="n text-xs font-bold text-[#6E7381]">
                  🕒 {inv.timeLabel}
                </span>
              </div>
              <p className="text-xs text-[#111317] font-semibold">
                <strong>{inv.fromUserName}</strong> convidou você para formar um
                time na fila ({peladaStore.gameFormat.toUpperCase()} · máx{" "}
                {maxTeamSize} jogadores).
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => S.acceptGroupInvite(inv.id)}
                  className="rounded-xl bg-[#10B981] text-white text-xs font-extrabold py-2.5 px-3 transition active:scale-95"
                >
                  ✓ Aceitar e Formar Time
                </button>
                <button
                  type="button"
                  onClick={() => S.rejectGroupInvite(inv.id)}
                  className="rounded-xl bg-white border border-[#EAEBEF] text-[#6E7381] text-xs font-extrabold py-2.5 px-3 transition active:scale-95"
                >
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card Principal: Regras + Botão Entrar / Sair da fila */}
      <div className={C + " p-4 space-y-3"}>
        {selectedEvent.r && (
          <p className="text-xs bg-[#F4F5F7] rounded-lg p-2.5 text-[#111317] font-medium">
            📋 {selectedEvent.r}
          </p>
        )}

        {isPeladaOfficial ? (
          myCourtStatus && myCourtStatus.status !== "not-in-pelada" ? (
            <div className="bg-[#ECFDF5] border border-[#10B981]/40 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#10B981]">
                  ✓ Seu Status na Pelada (
                  {alreadyRewardedThisEvent
                    ? `HP deste evento creditado: +${myRewardPoints} HP`
                    : `+${myRewardPoints} HP${isSubscriber ? " · 2x Assinante" : ""}`}
                  )
                </p>
              </div>
              <p className="text-base font-extrabold text-[#111317]">
                {myCourtStatus.status === "on-court"
                  ? `🏀 Você está EM QUADRA AGORA (${myCourtStatus.teamLabel} · Lado ${myCourtStatus.side})`
                  : myCourtStatus.status === "champion-waiting"
                    ? `👑 Você está no Time Campeão aguardando desafiante (${myCourtStatus.teamLabel})`
                    : myCourtStatus.entryKind === "team"
                      ? `⏱️ Você está na fila no ${myCourtStatus.teamLabel} — Posição #${myCourtStatus.position}`
                      : `✓ Você está na fila — Posição #${myCourtStatus.position} (${myCourtStatus.playersAheadCount} na sua frente)`}
              </p>
              {canInviteOthers && (
                <p className="text-xs text-[#6E7381]">
                  💡 Quer jogar junto com alguém da fila? Toque em{" "}
                  <strong className="text-[#FF5400]">+ Grupo</strong> ao lado do
                  nome do jogador abaixo para enviar solicitação de time!
                </p>
              )}
              <button
                type="button"
                onClick={() => S.leaveQueue(selectedEvent.id)}
                className="w-full rounded-xl bg-white hover:bg-[#FEF2F2] border border-[#EF4444]/40 text-[#EF4444] text-xs font-extrabold py-2.5 px-3 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <DoorOpen className="w-4 h-4" />
                Sair da {selectedEvent.tp === "Treino" ? "lista" : "fila"}
              </button>
            </div>
          ) : myPendingQueueRequest ? (
            <div className="bg-[#FFF4EE] border border-[#FF5400]/40 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#FF5400]">
                  ⏳ Solicitação Enviada ao Organizador
                </p>
                <span className="n text-xs font-bold text-[#6E7381]">
                  🕒 {myPendingQueueRequest.timeLabel}
                </span>
              </div>
              <p className="text-xs text-[#111317] font-medium">
                {alreadyRewardedThisEvent ? (
                  <>
                    Assim que o Administrador ou Professor aceitar sua entrada,
                    você retornará à fila (os Grind Points deste evento já foram
                    creditados anteriormente).
                  </>
                ) : (
                  <>
                    Assim que o Administrador ou Professor aceitar sua entrada
                    nas notificações, você entrará na fila e ganhará{" "}
                    <strong className="text-[#FF5400]">
                      +{myRewardPoints} Grind Points (GP)
                      {isSubscriber ? " (Dobro 2x Assinante)" : ""}
                    </strong>
                    !
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => S.cancelQueueRequest(myPendingQueueRequest.id)}
                className="w-full rounded-xl bg-white hover:bg-[#FEF2F2] border border-[#EF4444]/30 text-[#EF4444] text-xs font-extrabold py-2 px-3 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar solicitação / Sair da {selectedEvent.tp === "Treino" ? "lista" : "fila"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Btn onClick={() => S.join(selectedEvent.id)} c={OB}>
                Entrar na {selectedEvent.tp === "Treino" ? "lista" : "fila"}
              </Btn>
              {S.me && (
                <p className="text-[11px] text-center text-[#6E7381]">
                  {alreadyRewardedThisEvent
                    ? "ℹ️ Você já recebeu os Grind Points (GP) deste evento (liberados 1 vez por evento)."
                    : isSubscriber
                      ? "⚡ Bônus Assinante Ativo: você ganha +10 GP (2x) ao entrar neste evento!"
                      : "🏀 Ganhe +5 GP ao ter sua entrada confirmada neste evento (1x por evento)."}
                </p>
              )}
            </div>
          )
        ) : isInSimpleEventQueue ? (
          <div className="bg-[#ECFDF5] border border-[#10B981]/40 rounded-xl p-3.5 space-y-2.5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#10B981]">
              ✓ Presença Confirmada na {selectedEvent.tp === "Treino" ? "Lista" : "Fila"} (
              {alreadyRewardedThisEvent
                ? `GP creditado: +${myRewardPoints} GP`
                : `+${myRewardPoints} GP${isSubscriber ? " · 2x Assinante" : ""}`}
              )
            </p>
            <p className="text-sm font-extrabold text-[#111317]">
              Você está na posição #{selectedEvent.f.indexOf(S.me!.id) + 1} deste evento.
            </p>
            <button
              type="button"
              onClick={() => S.leaveQueue(selectedEvent.id)}
              className="w-full rounded-xl bg-white hover:bg-[#FEF2F2] border border-[#EF4444]/40 text-[#EF4444] text-xs font-extrabold py-2.5 px-3 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <DoorOpen className="w-4 h-4" />
              Sair da {selectedEvent.tp === "Treino" ? "lista" : "fila"}
            </button>
          </div>
        ) : myPendingQueueRequest ? (
          <div className="bg-[#FFF4EE] border border-[#FF5400]/40 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#FF5400]">
                ⏳ Solicitação Enviada ao Organizador
              </p>
              <span className="n text-xs font-bold text-[#6E7381]">
                🕒 {myPendingQueueRequest.timeLabel}
              </span>
            </div>
            <p className="text-xs text-[#111317] font-medium">
              {alreadyRewardedThisEvent ? (
                <>
                  Aguardando confirmação do Administrador/Professor para
                  retornar à {selectedEvent.tp === "Treino" ? "lista" : "fila"} (GP deste evento já liberado anteriormente).
                </>
              ) : (
                <>
                  Aguardando confirmação do Administrador/Professor para entrar
                  na {selectedEvent.tp === "Treino" ? "lista" : "fila"} e receber{" "}
                  <strong className="text-[#FF5400]">
                    +{myRewardPoints} Grind Points (GP)
                    {isSubscriber ? " (2x Assinante)" : ""}
                  </strong>
                  .
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => S.cancelQueueRequest(myPendingQueueRequest.id)}
              className="w-full rounded-xl bg-white hover:bg-[#FEF2F2] border border-[#EF4444]/30 text-[#EF4444] text-xs font-extrabold py-2 px-3 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar solicitação / Sair da {selectedEvent.tp === "Treino" ? "lista" : "fila"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Btn onClick={() => S.join(selectedEvent.id)} c={OB}>
              Entrar na {selectedEvent.tp === "Treino" ? "lista" : "fila"}
            </Btn>
            {S.me && (
              <p className="text-[11px] text-center text-[#6E7381]">
                {alreadyRewardedThisEvent
                  ? "ℹ️ Você já recebeu os Grind Points (GP) deste evento (liberados 1 vez por evento)."
                  : isSubscriber
                    ? "⚡ Bônus Assinante Ativo: você ganha +10 GP (2x) ao entrar neste evento!"
                    : "🏀 Ganhe +5 HP ao ter sua entrada confirmada neste evento (1x por evento)."}
              </p>
            )}
          </div>
        )}
      </div>

      {isPeladaOfficial ? (
        <>
          {/* Resumo Somente Leitura da Quadra Agora (Time A vs Time B + Cronômetro) */}
          <div className={C + " p-4 space-y-3"}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#6E7381]">
                🏀 Em Quadra Agora
              </span>
              <span
                className={
                  "n text-sm font-extrabold px-2.5 py-0.5 rounded-lg " +
                  (isRunning
                    ? "bg-[#ECFDF5] text-[#10B981]"
                    : "bg-[#F4F5F7] text-[#111317]")
                }
              >
                ⏱️ {formatClockMs(remaining)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Lado A */}
              <div className="bg-[#F4F5F7] rounded-xl p-3">
                <p className="text-xs font-extrabold uppercase text-[#FF5400] mb-1">
                  Lado A{" "}
                  {teamA
                    ? `· ${peladaStore.teamNames[teamA.id] ?? `TIME ${teamA.number}`}`
                    : ""}
                </p>
                {!teamA ? (
                  <p className="text-xs text-[#6E7381]">Aguardando time...</p>
                ) : (
                  <div className="space-y-1">
                    {teamA.memberIds.map((pid) => {
                      const p = peladaStore.players[pid];
                      if (!p) return null;
                      const isMe =
                        S.me &&
                        (p.userId === String(S.me.id) || p.name === S.me.nome);
                      return (
                        <p
                          key={pid}
                          className={
                            "text-xs font-bold truncate " +
                            (isMe ? "text-[#FF5400]" : "text-[#111317]")
                          }
                        >
                          • {p.name} {isMe ? "(Você)" : ""}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lado B */}
              <div className="bg-[#F4F5F7] rounded-xl p-3">
                <p className="text-xs font-extrabold uppercase text-[#111317] mb-1">
                  Lado B{" "}
                  {teamB
                    ? `· ${peladaStore.teamNames[teamB.id] ?? `TIME ${teamB.number}`}`
                    : ""}
                </p>
                {!teamB ? (
                  <p className="text-xs text-[#6E7381]">Aguardando time...</p>
                ) : (
                  <div className="space-y-1">
                    {teamB.memberIds.map((pid) => {
                      const p = peladaStore.players[pid];
                      if (!p) return null;
                      const isMe =
                        S.me &&
                        (p.userId === String(S.me.id) || p.name === S.me.nome);
                      return (
                        <p
                          key={pid}
                          className={
                            "text-xs font-bold truncate " +
                            (isMe ? "text-[#FF5400]" : "text-[#111317]")
                          }
                        >
                          • {p.name} {isMe ? "(Você)" : ""}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Campeão Aguardando (se houver) */}
            {champTeam && (
              <div className="bg-[#FFF4EE] border border-[#FF5400]/30 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-[#FF5400]">
                    👑 CAMPEÃO AGUARDANDO PRÓXIMO JOGO
                  </p>
                  <p className="text-xs font-bold text-[#111317]">
                    {peladaStore.teamNames[champTeam.id] ??
                      `TIME ${champTeam.number}`}
                    :{" "}
                    {champTeam.memberIds
                      .map((pid) => peladaStore.players[pid]?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* FILA COMPLETA DA PELADA (Somente Visualização para o Usuário) */}
          <div className={C + " p-4"}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-extrabold text-[#111317] uppercase tracking-wider">
                📋 FILA COMPLETA DE ESPERA
              </p>
              <span className="n text-xs font-bold text-[#FF5400]">
                {peladaStore.queue.length} posições · {totalWaitingPlayers}{" "}
                jogadores
              </span>
            </div>

            {peladaStore.queue.length === 0 ? (
              <p className="text-xs text-[#6E7381] py-3 text-center">
                Nenhum jogador na {selectedEvent.tp === "Treino" ? "lista" : "fila de espera"} no momento. Toque em
                &ldquo;Entrar na {selectedEvent.tp === "Treino" ? "lista" : "fila"}&rdquo; acima!
              </p>
            ) : (
              <div className="divide-y divide-[#EAEBEF]">
                {peladaStore.queue.map((entry, idx) => {
                  if (entry.kind === "player") {
                    const p = peladaStore.players[entry.id];
                    if (!p) return null;
                    const isMe =
                      S.me &&
                      (p.userId === String(S.me.id) ||
                        p.name.toLowerCase() === S.me.nome.toLowerCase());
                    const heziUser = S.users.find(
                      (u) =>
                        String(u.id) === p.userId ||
                        u.nome.toLowerCase() === p.name.toLowerCase(),
                    );
                    return (
                      <div
                        key={`p-${entry.id}`}
                        className={
                          "flex items-center gap-2.5 py-2.5 text-sm " +
                          (isMe ? "bg-[#FFF4EE] -mx-2 px-2 rounded-xl" : "")
                        }
                      >
                        <span className="n font-extrabold text-[#FF5400] w-8">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#111317] truncate">
                            {p.name}{" "}
                            {isMe && (
                              <span className="text-xs font-extrabold text-[#FF5400]">
                                (Você)
                              </span>
                            )}
                          </p>
                        </div>
                        {p.justPlayed && (
                          <Chip c="bg-[#F4F5F7] text-[#6E7381]">
                            🚫 Jogou a última
                          </Chip>
                        )}
                        {!isMe && canInviteOthers && heziUser && (
                          <button
                            type="button"
                            onClick={() =>
                              S.sendGroupInvite(heziUser.id, selectedEvent.id)
                            }
                            className="shrink-0 rounded-xl bg-[#111317] hover:bg-[#FF5400] text-white text-xs font-extrabold px-2.5 py-1.5 transition active:scale-95 flex items-center gap-1"
                            title="Convidar jogador para formar time na fila"
                          >
                            <UsersRound className="w-3.5 h-3.5 text-[#FF5400]" />
                            + Grupo
                          </button>
                        )}
                      </div>
                    );
                  }

                  const t = peladaStore.teams[entry.id];
                  if (!t) return null;
                  const teamLabel =
                    peladaStore.teamNames[t.id] ?? `TIME ${t.number}`;
                  const hasMe =
                    S.me &&
                    t.memberIds.some((pid) => {
                      const pl = peladaStore.players[pid];
                      return (
                        pl &&
                        (pl.userId === String(S.me!.id) ||
                          pl.name.toLowerCase() === S.me!.nome.toLowerCase())
                      );
                    });

                  return (
                    <div
                      key={`t-${entry.id}`}
                      className={
                        "py-3 space-y-1.5 " +
                        (hasMe ? "bg-[#FFF4EE] -mx-2 px-2 rounded-xl" : "")
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="n font-extrabold text-[#FF5400] w-8">
                            #{idx + 1}
                          </span>
                          <span className="font-extrabold text-sm text-[#111317]">
                            🏀 {teamLabel}
                          </span>
                          {hasMe && (
                            <Chip c="bg-[#FF5400] text-white">SEU TIME</Chip>
                          )}
                        </div>
                        <Chip c="bg-[#F4F5F7] text-[#6E7381]">
                          {t.memberIds.length}/{maxTeamSize} jogadores
                        </Chip>
                      </div>
                      <div className="pl-10 flex flex-wrap gap-1.5">
                        {t.memberIds.map((pid) => {
                          const pl = peladaStore.players[pid];
                          if (!pl) return null;
                          const isMe =
                            S.me &&
                            (pl.userId === String(S.me.id) ||
                              pl.name.toLowerCase() ===
                                S.me.nome.toLowerCase());
                          return (
                            <span
                              key={pid}
                              className={
                                "text-xs font-semibold px-2.5 py-1 rounded-lg " +
                                (isMe
                                  ? "bg-[#FF5400] text-white"
                                  : "bg-[#F4F5F7] text-[#111317]")
                              }
                            >
                              {pl.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Fila de outros eventos criados pelo Administrador */
        <div className={C + " p-4"}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold text-[#111317] uppercase tracking-wider">
              📋 FILA DO EVENTO
            </p>
            <span className="n text-xs font-bold text-[#FF5400]">
              {selectedEvent.f.length} inscritos
            </span>
          </div>
          {selectedEvent.f.length === 0 ? (
            <p className="text-xs text-[#6E7381] py-3 text-center">
              Ninguém na fila ainda. Toque em &ldquo;Entrar na fila&rdquo; acima!
            </p>
          ) : (
            <div className="divide-y divide-[#EAEBEF]">
              {selectedEvent.f.map((uid, idx) => {
                const usr = S.users.find((u) => u.id === uid);
                if (!usr) return null;
                const isMe = S.me && S.me.id === usr.id;
                return (
                  <div
                    key={uid}
                    className={
                      "flex items-center gap-2.5 py-2.5 text-sm " +
                      (isMe ? "bg-[#FFF4EE] -mx-2 px-2 rounded-xl" : "")
                    }
                  >
                    <span className="n font-extrabold text-[#FF5400] w-8">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#111317] truncate">
                        {usr.nome}{" "}
                        {isMe && (
                          <span className="text-xs font-extrabold text-[#FF5400]">
                            (Você)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

