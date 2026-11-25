import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import {
  usePelada,
  computeElapsed,
  currentDurationMs,
  getMaxTeamSize,
  type QueueEntry,
  type ID,
} from "@/lib/pelada/store";
import { useRealtimeSync } from "@/lib/hezi/sync";

export const Route = createFileRoute("/pelada")({
  head: () => ({
    meta: [
      { title: "HEZI FAM® - Moving the Game | Pelada & Court Master" },
      {
        name: "description",
        content:
          "Court Master da Hezi Fam: gerencie times, placar, tempo e fila com um toque.",
      },
      { property: "og:title", content: "HEZI FAM® - Court Master" },
      {
        property: "og:description",
        content: "Gerencie a pelada direto do celular com um fluxo simples.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PeladaPage,
});

export function useTick(intervalMs = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}

function formatClock(msRemaining: number): string {
  const totalSec = Math.max(0, Math.ceil(msRemaining / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function MatchClockDisplay({ durationMs }: { durationMs: number }) {
  const court = usePelada((s) => s.court);
  useTick(court.runningSince ? 500 : 60000);
  const elapsed = computeElapsed(court, Date.now());
  const remaining = Math.max(0, durationMs - elapsed);
  return (
    <span className="n font-extrabold text-4xl sm:text-5xl tracking-tight text-[#111317]">
      {formatClock(remaining)}
    </span>
  );
}

export function CourtMasterOrganizer({ embedded = false }: { embedded?: boolean }) {
  useRealtimeSync();

  const gameFormat = usePelada((s) => s.gameFormat);
  const setGameFormat = usePelada((s) => s.setGameFormat);
  const players = usePelada((s) => s.players);
  const teams = usePelada((s) => s.teams);
  const queue = usePelada((s) => s.queue);
  const court = usePelada((s) => s.court);
  const waitingChampion = usePelada((s) => s.waitingChampion);
  const teamNames = usePelada((s) => s.teamNames);
  const selection = usePelada((s) => s.selection);

  const addPlayer = usePelada((s) => s.addPlayer);
  const removePlayer = usePelada((s) => s.removePlayer);
  const removeFromQueue = usePelada((s) => s.removeFromQueue);
  const moveQueueEntry = usePelada((s) => s.moveQueueEntry);
  const toggleSelect = usePelada((s) => s.toggleSelect);
  const clearSelection = usePelada((s) => s.clearSelection);
  const formTeamFromSelection = usePelada((s) => s.formTeamFromSelection);
  const sendToCourt = usePelada((s) => s.sendToCourt);
  const sendPlayerToCourtSide = usePelada((s) => s.sendPlayerToCourtSide);
  const startTimer = usePelada((s) => s.startTimer);
  const pauseTimer = usePelada((s) => s.pauseTimer);
  const useSuddenDeath = usePelada((s) => s.useSuddenDeath);
  const declareWinner = usePelada((s) => s.declareWinner);
  const resetNight = usePelada((s) => s.resetNight);

  const [newName, setNewName] = useState("");
  const [inputError, setInputError] = useState("");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Explicit modal states for clear decisions & immediate feedback
  const [pickingWinner, setPickingWinner] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<
    | { kind: "player"; id: ID; name: string }
    | { kind: "entry"; entry: QueueEntry; name: string }
    | null
  >(null);

  const maxTeamSize = getMaxTeamSize(gameFormat);
  const modeLabel = gameFormat === "5x5" ? "5 contra 5" : "3 contra 3";

  const teamA = court.teamAId ? teams[court.teamAId] : undefined;
  const teamB = court.teamBId ? teams[court.teamBId] : undefined;

  const teamALabel = teamA
    ? teamNames[teamA.id] || `Time A (Time ${teamA.number})`
    : "Time A";
  const teamBLabel = teamB
    ? teamNames[teamB.id] || `Time B (Time ${teamB.number})`
    : "Time B";

  const teamANames = (teamA?.memberIds || [])
    .map((id) => players[id]?.name)
    .filter(Boolean) as string[];
  const teamBNames = (teamB?.memberIds || [])
    .map((id) => players[id]?.name)
    .filter(Boolean) as string[];

  const waitingPeopleCount = useMemo(() => {
    return queue.reduce((acc, entry) => {
      if (entry.kind === "player") return acc + 1;
      const t = teams[entry.id];
      return acc + (t ? t.memberIds.length : 0);
    }, 0);
  }, [queue, teams]);

  const durationMs = currentDurationMs(usePelada.getState());

  const handleAddPlayer = () => {
    const clean = newName.trim();
    if (!clean) {
      setInputError("Faltou digitar o nome do jogador.");
      return;
    }
    const alreadyExists = Object.values(players).some(
      (p) => p.name.trim().toLowerCase() === clean.toLowerCase(),
    );
    if (alreadyExists) {
      setInputError("Esse jogador já está na pelada.");
      return;
    }
    addPlayer(clean);
    setNewName("");
    setInputError("");
  };

  const handleCallNextToSide = (side: "A" | "B") => {
    const first = queue[0];
    if (!first) return;
    if (first.kind === "team") {
      sendToCourt(first, { forceCooldown: true });
    } else {
      sendPlayerToCourtSide(first.id, side);
    }
  };

  const handleConfirmWinner = (side: "A" | "B") => {
    const winnerLabel = side === "A" ? teamALabel : teamBLabel;
    declareWinner(side);
    setScoreA(0);
    setScoreB(0);
    setPickingWinner(false);
    setDoneMessage(
      `${winnerLabel} venceu! Ele continua na quadra e os próximos da fila entram para jogar.`,
    );
  };

  const handleSuddenDeath = () => {
    useSuddenDeath();
    setPickingWinner(false);
  };

  return (
    <div
      className={
        embedded
          ? "w-full space-y-4"
          : "min-h-dvh bg-[#F4F5F7] text-[#111317] pb-12"
      }
    >
      <div
        className={
          embedded ? "space-y-4" : "max-w-[560px] mx-auto p-4 space-y-4"
        }
      >
        {/* Top Bar: Back + Mode Toggle + Reset */}
        {!embedded && (
          <div className="flex items-center justify-between pt-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6E7381] hover:text-[#111317] py-2 px-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o início
            </Link>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5400]">
              Court Master
            </span>
          </div>
        )}

        <div className="bg-white border border-[#EAEBEF] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setGameFormat("3x3")}
              className={`min-h-[40px] px-3.5 rounded-xl text-xs font-extrabold transition ${
                gameFormat === "3x3"
                  ? "bg-[#111317] text-white"
                  : "bg-[#F4F5F7] text-[#6E7381] hover:text-[#111317]"
              }`}
            >
              3 contra 3
            </button>
            <button
              type="button"
              onClick={() => setGameFormat("5x5")}
              className={`min-h-[40px] px-3.5 rounded-xl text-xs font-extrabold transition ${
                gameFormat === "5x5"
                  ? "bg-[#111317] text-white"
                  : "bg-[#F4F5F7] text-[#6E7381] hover:text-[#111317]"
              }`}
            >
              5 contra 5
            </button>
          </div>
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="min-h-[40px] px-3 rounded-xl bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Zerar pelada
          </button>
        </div>

        {/* Immediate Feedback Banner */}
        {doneMessage && (
          <div className="bg-[#ECFDF5] border-2 border-[#10B981] rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-extrabold text-sm text-[#111317]">
                Tudo certo! Partida encerrada.
              </p>
              <p className="text-xs text-[#6E7381]">{doneMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setDoneMessage("")}
              className="text-xs font-extrabold text-[#10B981] hover:underline shrink-0"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Confirmation: Reset Night */}
        {confirmResetOpen && (
          <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-base text-[#111317]">
              Tem certeza que deseja zerar toda a pelada?
            </p>
            <p className="text-sm text-[#6E7381]">
              Todos os jogadores, times e placares atuais serão apagados.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  resetNight();
                  setScoreA(0);
                  setScoreB(0);
                  setDoneMessage("");
                  setConfirmResetOpen(false);
                }}
                className="min-h-[48px] rounded-xl bg-[#EF4444] text-white font-extrabold text-sm px-4 py-3 transition active:scale-95"
              >
                Sim, quero zerar tudo
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="min-h-[48px] rounded-xl bg-white border border-[#EAEBEF] text-[#111317] font-bold text-sm px-4 py-3 transition active:scale-95"
              >
                Não, voltar
              </button>
            </div>
          </div>
        )}

        {/* Confirmation: Remove Player / Team */}
        {itemToDelete && (
          <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-base text-[#111317]">
              Remover {itemToDelete.name}?
            </p>
            <p className="text-sm text-[#6E7381]">
              Esta ação tira o registro da fila atual.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (itemToDelete.kind === "player") {
                    removePlayer(itemToDelete.id);
                  } else {
                    removeFromQueue(itemToDelete.entry);
                  }
                  setItemToDelete(null);
                }}
                className="min-h-[48px] rounded-xl bg-[#EF4444] text-white font-extrabold text-sm px-4 py-3 transition active:scale-95"
              >
                Sim, quero remover
              </button>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="min-h-[48px] rounded-xl bg-white border border-[#EAEBEF] text-[#111317] font-bold text-sm px-4 py-3 transition active:scale-95"
              >
                Não, voltar
              </button>
            </div>
          </div>
        )}

        {/* Modal/Card: Pick Winner */}
        {pickingWinner && (
          <div className="bg-white border-2 border-[#FF5400] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="space-y-1">
              <h2 className="font-extrabold text-xl text-[#111317]">
                Quem venceu esta partida?
              </h2>
              <p className="text-sm text-[#6E7381]">
                O vencedor continua na quadra e o próximo da fila entra para jogar.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleConfirmWinner("A")}
                className="w-full min-h-[60px] rounded-2xl bg-[#FF5400] hover:bg-[#E04800] text-white p-4 text-left transition active:scale-95 space-y-1"
              >
                <p className="font-extrabold text-base">
                  {teamALabel} venceu ({scoreA} pontos)
                </p>
                <p className="text-xs text-white/90">
                  {teamANames.length > 0 ? teamANames.join(", ") : "Sem jogadores"}
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmWinner("B")}
                className="w-full min-h-[60px] rounded-2xl bg-[#111317] hover:bg-[#272B33] text-white p-4 text-left transition active:scale-95 space-y-1"
              >
                <p className="font-extrabold text-base">
                  {teamBLabel} venceu ({scoreB} pontos)
                </p>
                <p className="text-xs text-white/80">
                  {teamBNames.length > 0 ? teamBNames.join(", ") : "Sem jogadores"}
                </p>
              </button>

              <button
                type="button"
                onClick={handleSuddenDeath}
                className="w-full min-h-[48px] rounded-xl bg-[#FFFBEB] border border-[#F59E0B] text-[#B45309] font-extrabold text-sm px-4 py-3 transition active:scale-95"
              >
                Empatou — Jogar desempate de 1 minuto
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPickingWinner(false)}
              className="w-full min-h-[44px] rounded-xl text-[#6E7381] hover:text-[#111317] font-bold text-sm transition"
            >
              Cancelar e voltar para o jogo
            </button>
          </div>
        )}

        {/* BLOCO 1: EM QUADRA AGORA (RELÓGIO + PLACAR) */}
        <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-[#111317]">
              Em Quadra Agora ({modeLabel})
            </h2>
            {waitingChampion && teams[waitingChampion] && (
              <span className="inline-flex items-center gap-1 bg-[#FFFBEB] border border-[#F59E0B] text-[#B45309] text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                <Trophy className="w-3.5 h-3.5" />
                Campeão: Time {teams[waitingChampion].number}
              </span>
            )}
          </div>

          {/* Clock */}
          <div className="bg-[#F4F5F7] rounded-2xl p-4 text-center space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#6E7381]">
              {court.inSuddenDeath ? "Desempate (1 minuto)" : "Tempo de jogo"}
            </p>
            <div>
              <MatchClockDisplay durationMs={durationMs} />
            </div>
            <button
              type="button"
              onClick={court.runningSince ? pauseTimer : startTimer}
              className={`w-full min-h-[48px] rounded-xl font-extrabold text-sm px-4 py-3 flex items-center justify-center gap-2 transition active:scale-95 ${
                court.runningSince
                  ? "bg-[#111317] text-white"
                  : "bg-[#10B981] text-white"
              }`}
            >
              {court.runningSince ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pausar tempo
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Iniciar tempo
                </>
              )}
            </button>
          </div>

          {/* Teams A & B */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Team A */}
            <div className="bg-[#F4F5F7] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#111317] truncate">
                  {teamALabel}
                </span>
                <span className="n font-extrabold text-3xl text-[#FF5400]">
                  {scoreA}
                </span>
              </div>
              <p className="text-xs text-[#6E7381] min-h-[32px]">
                {teamANames.length > 0
                  ? teamANames.join(", ")
                  : "Vaga aberta no Time A"}
              </p>
              {teamANames.length < maxTeamSize && queue.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleCallNextToSide("A")}
                  className="w-full min-h-[40px] rounded-xl bg-white border border-[#EAEBEF] hover:border-[#FF5400] text-[#111317] font-bold text-xs px-3 py-2 transition"
                >
                  Chamar próximo da fila
                </button>
              )}
              <button
                type="button"
                onClick={() => setScoreA((v) => v + 1)}
                className="w-full min-h-[48px] rounded-xl bg-[#111317] hover:bg-[#FF5400] text-white font-extrabold text-sm px-3 py-3 transition active:scale-95"
              >
                +1 Ponto para Time A
              </button>
              {scoreA > 0 && (
                <button
                  type="button"
                  onClick={() => setScoreA((v) => Math.max(0, v - 1))}
                  className="w-full min-h-[34px] text-xs font-bold text-[#6E7381] hover:text-[#111317]"
                >
                  Tirar 1 ponto do Time A
                </button>
              )}
            </div>

            {/* Team B */}
            <div className="bg-[#F4F5F7] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#111317] truncate">
                  {teamBLabel}
                </span>
                <span className="n font-extrabold text-3xl text-[#FF5400]">
                  {scoreB}
                </span>
              </div>
              <p className="text-xs text-[#6E7381] min-h-[32px]">
                {teamBNames.length > 0
                  ? teamBNames.join(", ")
                  : "Vaga aberta no Time B"}
              </p>
              {teamBNames.length < maxTeamSize && queue.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleCallNextToSide("B")}
                  className="w-full min-h-[40px] rounded-xl bg-white border border-[#EAEBEF] hover:border-[#FF5400] text-[#111317] font-bold text-xs px-3 py-2 transition"
                >
                  Chamar próximo da fila
                </button>
              )}
              <button
                type="button"
                onClick={() => setScoreB((v) => v + 1)}
                className="w-full min-h-[48px] rounded-xl bg-[#111317] hover:bg-[#FF5400] text-white font-extrabold text-sm px-3 py-3 transition active:scale-95"
              >
                +1 Ponto para Time B
              </button>
              {scoreB > 0 && (
                <button
                  type="button"
                  onClick={() => setScoreB((v) => Math.max(0, v - 1))}
                  className="w-full min-h-[34px] text-xs font-bold text-[#6E7381] hover:text-[#111317]"
                >
                  Tirar 1 ponto do Time B
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPickingWinner(true)}
            className="w-full min-h-[52px] rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white font-extrabold text-base px-4 py-3.5 transition active:scale-95"
          >
            Encerrar partida e escolher vencedor
          </button>
        </div>

        {/* BLOCO 2: ADICIONAR JOGADOR RÁPIDO */}
        <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-base text-[#111317]">
              Adicionar Jogador na Fila
            </h3>
            <p className="text-xs text-[#6E7381]">
              Jogadores aceitos no evento entram aqui automaticamente.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (inputError) setInputError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPlayer();
              }}
              placeholder="Exemplo: João Silva"
              className="flex-1 min-h-[48px] bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-sm font-semibold text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
            />
            <button
              type="button"
              onClick={handleAddPlayer}
              className="min-h-[48px] rounded-xl bg-[#111317] hover:bg-[#FF5400] text-white font-extrabold text-sm px-4 py-3 flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Adicionar na fila
            </button>
          </div>
          {inputError && (
            <p className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2] rounded-lg px-3 py-2">
              {inputError}
            </p>
          )}
        </div>

        {/* BLOCO 3: FILA DE ESPERA (1 TOQUE, SEM ARRASTAR) */}
        <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-base text-[#111317]">
                Fila de Espera ({waitingPeopleCount}{" "}
                {waitingPeopleCount === 1 ? "pessoa" : "pessoas"})
              </h3>
              <p className="text-xs text-[#6E7381]">
                Toque para subir, descer, formar time ou mandar para a quadra.
              </p>
            </div>
            {selection.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-bold text-[#6E7381] hover:text-[#111317]"
              >
                Limpar seleção ({selection.length})
              </button>
            )}
          </div>

          {selection.length >= 2 && (
            <button
              type="button"
              onClick={formTeamFromSelection}
              className="w-full min-h-[48px] rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-sm px-4 py-3 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Users className="w-4 h-4" />
              Formar time com {selection.length} selecionados
            </button>
          )}

          {queue.length === 0 ? (
            <div className="bg-[#F4F5F7] rounded-xl p-4 text-center text-sm text-[#6E7381]">
              Ninguém aguardando na fila neste momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {queue.map((entry: QueueEntry, idx: number) => {
                const isSelected =
                  entry.kind === "player" && selection.includes(entry.id);
                const label =
                  entry.kind === "player"
                    ? players[entry.id]?.name || "Jogador"
                    : `${teamNames[entry.id] || `Time ${teams[entry.id]?.number ?? ""}`}: ${(
                        teams[entry.id]?.memberIds || []
                      )
                        .map((pid) => players[pid]?.name)
                        .filter(Boolean)
                        .join(", ")}`;

                return (
                  <div
                    key={`${entry.kind}-${entry.id}`}
                    className={`rounded-xl p-3 space-y-2.5 border transition ${
                      isSelected
                        ? "bg-[#FFF4EE] border-[#FF5400]"
                        : "bg-[#F4F5F7] border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-sm text-[#111317]">
                        {idx + 1}. {label}
                      </span>
                      {entry.kind === "team" && (
                        <span className="text-[10px] font-extrabold uppercase bg-white text-[#FF5400] px-2 py-0.5 rounded-full">
                          Time formado
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveQueueEntry(entry, -1)}
                        className="min-h-[38px] px-3 rounded-lg bg-white border border-[#EAEBEF] text-xs font-bold text-[#111317] disabled:opacity-40 flex items-center gap-1"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        Subir
                      </button>
                      <button
                        type="button"
                        disabled={idx === queue.length - 1}
                        onClick={() => moveQueueEntry(entry, 1)}
                        className="min-h-[38px] px-3 rounded-lg bg-white border border-[#EAEBEF] text-xs font-bold text-[#111317] disabled:opacity-40 flex items-center gap-1"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        Descer
                      </button>

                      {entry.kind === "player" && (
                        <button
                          type="button"
                          onClick={() => toggleSelect(entry.id)}
                          className={`min-h-[38px] px-3 rounded-lg border text-xs font-bold transition ${
                            isSelected
                              ? "bg-[#FF5400] border-[#FF5400] text-white"
                              : "bg-white border-[#EAEBEF] text-[#111317]"
                          }`}
                        >
                          {isSelected ? "Selecionado" : "Selecionar p/ time"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          sendToCourt(entry, { forceCooldown: true })
                        }
                        className="min-h-[38px] px-3 rounded-lg bg-[#111317] text-white text-xs font-bold hover:bg-[#FF5400] transition"
                      >
                        Mandar para quadra
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setItemToDelete(
                            entry.kind === "player"
                              ? { kind: "player", id: entry.id, name: label }
                              : { kind: "entry", entry, name: label },
                          )
                        }
                        className="min-h-[38px] px-3 rounded-lg bg-white border border-[#EAEBEF] text-xs font-bold text-[#EF4444] flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PeladaPage() {
  return <CourtMasterOrganizer embedded={false} />;
}
