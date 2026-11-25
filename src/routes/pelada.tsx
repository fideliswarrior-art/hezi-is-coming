import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ListOrdered,
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

type StepView =
  | "step1_mode"
  | "step2_players"
  | "step3_live"
  | "queue_view"
  | "pick_winner"
  | "done_feedback";

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
  const matchMs = usePelada((s) => s.matchMs);
  const suddenDeathMs = usePelada((s) => s.suddenDeathMs);
  const autoReduceEnabled = usePelada((s) => s.autoReduceEnabled);
  const autoReduceThreshold = usePelada((s) => s.autoReduceThreshold);
  const autoReduceMs = usePelada((s) => s.autoReduceMs);

  const addPlayer = usePelada((s) => s.addPlayer);
  const removePlayer = usePelada((s) => s.removePlayer);
  const moveQueueEntry = usePelada((s) => s.moveQueueEntry);
  const sendToCourtSide = usePelada((s) => s.sendToCourtSide);
  const sendPlayerToCourtSide = usePelada((s) => s.sendPlayerToCourtSide);
  const startTimer = usePelada((s) => s.startTimer);
  const pauseTimer = usePelada((s) => s.pauseTimer);
  const useSuddenDeath = usePelada((s) => s.useSuddenDeath);
  const declareWinner = usePelada((s) => s.declareWinner);
  const resetNight = usePelada((s) => s.resetNight);

  const hasLiveTeams = Boolean(court.teamAId || court.teamBId);

  const [step, setStep] = useState<StepView>(() =>
    hasLiveTeams ? "step3_live" : "step1_mode",
  );
  const [newName, setNewName] = useState("");
  const [inputError, setInputError] = useState("");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Explicit two-step confirmations
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<{
    id: ID;
    name: string;
  } | null>(null);
  const [doneSummary, setDoneSummary] = useState("");

  const maxTeamSize = getMaxTeamSize(gameFormat);
  const modeLabel = gameFormat === "5x5" ? "5 contra 5" : "3 contra 3";
  const playerList = useMemo(
    () =>
      Object.values(players).sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      ),
    [players],
  );

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
      setInputError("Esse jogador já está na lista.");
      return;
    }
    addPlayer(clean);
    setNewName("");
    setInputError("");
  };

  const handleStartLiveTeams = () => {
    // Fill Time A and Time B automatically from queue if empty
    const stateNow = usePelada.getState();
    let sideACount = stateNow.court.teamAId
      ? stateNow.teams[stateNow.court.teamAId]?.memberIds.length ?? 0
      : 0;
    let sideBCount = stateNow.court.teamBId
      ? stateNow.teams[stateNow.court.teamBId]?.memberIds.length ?? 0
      : 0;

    for (const entry of stateNow.queue) {
      if (sideACount >= maxTeamSize && sideBCount >= maxTeamSize) break;
      if (entry.kind === "team") {
        if (sideACount === 0) {
          sendToCourtSide(entry, "A", { forceCooldown: true });
          sideACount = stateNow.teams[entry.id]?.memberIds.length ?? maxTeamSize;
        } else if (sideBCount === 0) {
          sendToCourtSide(entry, "B", { forceCooldown: true });
          sideBCount = stateNow.teams[entry.id]?.memberIds.length ?? maxTeamSize;
        }
      } else {
        if (sideACount < maxTeamSize) {
          sendPlayerToCourtSide(entry.id, "A");
          sideACount += 1;
        } else if (sideBCount < maxTeamSize) {
          sendPlayerToCourtSide(entry.id, "B");
          sideBCount += 1;
        }
      }
    }

    setScoreA(0);
    setScoreB(0);
    setStep("step3_live");
  };

  const handleConfirmWinner = (side: "A" | "B") => {
    const winnerLabel = side === "A" ? teamALabel : teamBLabel;
    declareWinner(side);
    setScoreA(0);
    setScoreB(0);
    setDoneSummary(
      `${winnerLabel} venceu! Ele continua na quadra e os próximos da fila entram para jogar.`,
    );
    setStep("done_feedback");
  };

  const handleSuddenDeath = () => {
    useSuddenDeath();
    setStep("step3_live");
  };

  const progressNumber =
    step === "step1_mode"
      ? 1
      : step === "step2_players"
        ? 2
        : 3;
  const progressPct =
    progressNumber === 1 ? 33 : progressNumber === 2 ? 66 : 100;
  const progressTitle =
    progressNumber === 1
      ? "Passo 1 de 3 — Preparar"
      : progressNumber === 2
        ? "Passo 2 de 3 — Jogadores"
        : "Passo 3 de 3 — Jogo ao Vivo";

  return (
    <div
      className={
        embedded
          ? "w-full space-y-4"
          : "min-h-dvh bg-[#F4F5F7] text-[#111317] pb-12"
      }
    >
      <div className={embedded ? "space-y-4" : "max-w-[540px] mx-auto p-4 space-y-4"}>
        {/* Top Header + Progress Bar */}
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

        {step !== "done_feedback" && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-[#111317]">{progressTitle}</span>
              <span className="n text-[#FF5400]">{progressPct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#F4F5F7] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF5400] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Confirmation Modal: Reset Night */}
        {confirmResetOpen && (
          <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-base text-[#111317]">
              Tem certeza que deseja zerar a pelada?
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
                  setConfirmResetOpen(false);
                  setStep("step1_mode");
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

        {/* Confirmation Modal: Remove Player */}
        {playerToDelete && (
          <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-base text-[#111317]">
              Remover {playerToDelete.name}?
            </p>
            <p className="text-sm text-[#6E7381]">
              O jogador sairá da fila e do time atual.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  removePlayer(playerToDelete.id);
                  setPlayerToDelete(null);
                }}
                className="min-h-[48px] rounded-xl bg-[#EF4444] text-white font-extrabold text-sm px-4 py-3 transition active:scale-95"
              >
                Sim, remover jogador
              </button>
              <button
                type="button"
                onClick={() => setPlayerToDelete(null)}
                className="min-h-[48px] rounded-xl bg-white border border-[#EAEBEF] text-[#111317] font-bold text-sm px-4 py-3 transition active:scale-95"
              >
                Não, voltar
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: CHOOSE MODE */}
        {step === "step1_mode" && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <h2 className="font-extrabold text-xl text-[#111317]">
                Quantos jogadores por time hoje?
              </h2>
              <p className="text-sm text-[#6E7381]">
                Toque em uma opção abaixo para começar.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setGameFormat("3x3")}
                className={`w-full min-h-[64px] rounded-2xl border-2 p-4 text-left transition flex items-center justify-between ${
                  gameFormat === "3x3"
                    ? "border-[#FF5400] bg-[#FFF4EE]"
                    : "border-[#EAEBEF] bg-white hover:border-[#D1D5DB]"
                }`}
              >
                <div>
                  <p className="font-extrabold text-base text-[#111317]">
                    3 contra 3
                  </p>
                  <p className="text-xs text-[#6E7381]">
                    Times com 3 jogadores cada
                  </p>
                </div>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    gameFormat === "3x3"
                      ? "bg-[#FF5400] text-white"
                      : "bg-[#F4F5F7] text-[#6E7381]"
                  }`}
                >
                  {gameFormat === "3x3" ? "Selecionado" : "Escolher"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGameFormat("5x5")}
                className={`w-full min-h-[64px] rounded-2xl border-2 p-4 text-left transition flex items-center justify-between ${
                  gameFormat === "5x5"
                    ? "border-[#FF5400] bg-[#FFF4EE]"
                    : "border-[#EAEBEF] bg-white hover:border-[#D1D5DB]"
                }`}
              >
                <div>
                  <p className="font-extrabold text-base text-[#111317]">
                    5 contra 5
                  </p>
                  <p className="text-xs text-[#6E7381]">
                    Times com 5 jogadores cada
                  </p>
                </div>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    gameFormat === "5x5"
                      ? "bg-[#FF5400] text-white"
                      : "bg-[#F4F5F7] text-[#6E7381]"
                  }`}
                >
                  {gameFormat === "5x5" ? "Selecionado" : "Escolher"}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep("step2_players")}
              className="w-full min-h-[52px] rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white font-extrabold text-base px-4 py-3.5 transition active:scale-95"
            >
              Avançar para a lista de jogadores
            </button>

            {playerList.length > 0 && !confirmResetOpen && (
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="w-full min-h-[44px] rounded-xl text-[#6E7381] hover:text-[#EF4444] font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Zerar pelada anterior
              </button>
            )}
          </div>
        )}

        {/* STEP 2: PLAYERS */}
        {step === "step2_players" && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="bg-[#F4F5F7] rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-[#111317] flex items-center justify-between">
              <span>Modo escolhido: {modeLabel}</span>
              <span>{playerList.length} jogadores</span>
            </div>

            <div className="space-y-1">
              <h2 className="font-extrabold text-xl text-[#111317]">
                Quem está na quadra?
              </h2>
              <p className="text-sm text-[#6E7381]">
                Adicione os nomes abaixo. Quem foi aceito no evento já entra aqui.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-[#111317]">
                Nome do jogador
              </label>
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
                  Adicionar jogador
                </button>
              </div>
              {inputError && (
                <p className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2] rounded-lg px-3 py-2">
                  {inputError}
                </p>
              )}
            </div>

            {playerList.length === 0 ? (
              <div className="bg-[#F4F5F7] rounded-xl p-4 text-center text-sm text-[#6E7381]">
                Nenhum jogador adicionado ainda. Digite o primeiro nome acima.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {playerList.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 bg-[#F4F5F7] rounded-xl px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="n text-xs font-extrabold text-[#6E7381] w-5">
                        {idx + 1}.
                      </span>
                      <span className="font-bold text-sm text-[#111317] truncate">
                        {p.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPlayerToDelete({ id: p.id, name: p.name })
                      }
                      className="min-h-[36px] px-3 rounded-lg bg-white border border-[#EAEBEF] text-xs font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition shrink-0 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            {playerList.length < 2 && (
              <p className="text-xs font-bold text-[#B45309] bg-[#FFFBEB] rounded-xl px-3.5 py-2.5">
                Adicione pelo menos 2 jogadores para iniciar a partida na quadra.
              </p>
            )}

            <button
              type="button"
              disabled={playerList.length < 2}
              onClick={handleStartLiveTeams}
              className="w-full min-h-[52px] rounded-xl bg-[#FF5400] hover:bg-[#E04800] disabled:opacity-45 text-white font-extrabold text-base px-4 py-3.5 transition active:scale-95"
            >
              {hasLiveTeams
                ? "Ir para a partida na quadra"
                : "Montar os dois primeiros times"}
            </button>

            <button
              type="button"
              onClick={() => setStep("step1_mode")}
              className="w-full min-h-[44px] rounded-xl text-[#6E7381] hover:text-[#111317] font-bold text-sm transition"
            >
              ← Voltar para escolher o modo
            </button>
          </div>
        )}

        {/* STEP 3: LIVE MATCH */}
        {step === "step3_live" && (
          <div className="space-y-4">
            {/* Memory-zero summary */}
            <div className="bg-white border border-[#EAEBEF] rounded-2xl px-4 py-3 text-xs font-extrabold text-[#111317] flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <span>
                {teamALabel} contra {teamBLabel}
              </span>
              <span className="text-[#FF5400]">
                Na fila: {waitingPeopleCount}{" "}
                {waitingPeopleCount === 1 ? "pessoa" : "pessoas"}
              </span>
            </div>

            {waitingChampion && teams[waitingChampion] && (
              <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-2xl px-4 py-2.5 text-xs font-extrabold text-[#B45309] flex items-center gap-2">
                <Trophy className="w-4 h-4 shrink-0" />
                <span>
                  Time campeão aguardando: Time{" "}
                  {teams[waitingChampion].number}
                </span>
              </div>
            )}

            {/* Clock Card */}
            <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs text-center space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#6E7381]">
                {court.inSuddenDeath
                  ? "Desempate (1 minuto)"
                  : `Tempo de jogo (${modeLabel})`}
              </p>
              <div>
                <MatchClockDisplay durationMs={durationMs} />
              </div>
              <button
                type="button"
                onClick={court.runningSince ? pauseTimer : startTimer}
                className={`w-full min-h-[50px] rounded-xl font-extrabold text-sm px-4 py-3 flex items-center justify-center gap-2 transition active:scale-95 ${
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

            {/* Scoreboard */}
            <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
              <h2 className="font-extrabold text-lg text-[#111317]">
                Placar do Jogo
              </h2>

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
                      : "Nenhum jogador no Time A"}
                  </p>
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
                      className="w-full min-h-[36px] text-xs font-bold text-[#6E7381] hover:text-[#111317]"
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
                      : "Nenhum jogador no Time B"}
                  </p>
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
                      className="w-full min-h-[36px] text-xs font-bold text-[#6E7381] hover:text-[#111317]"
                    >
                      Tirar 1 ponto do Time B
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep("pick_winner")}
                className="w-full min-h-[54px] rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white font-extrabold text-base px-4 py-3.5 transition active:scale-95"
              >
                Encerrar esta partida
              </button>
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStep("queue_view")}
                className="min-h-[48px] rounded-xl bg-white border border-[#EAEBEF] text-[#111317] font-bold text-sm px-4 py-3 flex items-center justify-center gap-2 hover:border-[#FF5400] transition"
              >
                <ListOrdered className="w-4 h-4 text-[#FF5400]" />
                Ver fila de espera ({waitingPeopleCount})
              </button>
              <button
                type="button"
                onClick={() => setStep("step2_players")}
                className="min-h-[48px] rounded-xl bg-white border border-[#EAEBEF] text-[#6E7381] font-bold text-sm px-4 py-3 flex items-center justify-center gap-2 hover:text-[#111317] transition"
              >
                <Users className="w-4 h-4" />
                Editar jogadores ({playerList.length})
              </button>
            </div>
          </div>
        )}

        {/* QUEUE VIEW (1-TAP REORDER, NO DRAG-AND-DROP) */}
        {step === "queue_view" && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <h2 className="font-extrabold text-xl text-[#111317]">
                Fila de Espera ({waitingPeopleCount})
              </h2>
              <p className="text-sm text-[#6E7381]">
                Toque nos botões para subir ou descer alguém na fila.
              </p>
            </div>

            {queue.length === 0 ? (
              <div className="bg-[#F4F5F7] rounded-xl p-4 text-center text-sm text-[#6E7381]">
                Ninguém aguardando na fila neste momento.
              </div>
            ) : (
              <div className="space-y-2.5">
                {queue.map((entry: QueueEntry, idx: number) => {
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
                      className="bg-[#F4F5F7] rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-[#111317]">
                          {idx + 1}. {label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveQueueEntry(entry, -1)}
                          className="min-h-[40px] px-3 rounded-lg bg-white border border-[#EAEBEF] text-xs font-bold text-[#111317] disabled:opacity-40 flex items-center gap-1"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          Subir posição
                        </button>
                        <button
                          type="button"
                          disabled={idx === queue.length - 1}
                          onClick={() => moveQueueEntry(entry, 1)}
                          className="min-h-[40px] px-3 rounded-lg bg-white border border-[#EAEBEF] text-xs font-bold text-[#111317] disabled:opacity-40 flex items-center gap-1"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          Descer posição
                        </button>
                        {entry.kind === "player" && (
                          <button
                            type="button"
                            onClick={() =>
                              setPlayerToDelete({
                                id: entry.id,
                                name: players[entry.id]?.name || "Jogador",
                              })
                            }
                            className="min-h-[40px] px-3 rounded-lg bg-white border border-[#EAEBEF] text-xs font-bold text-[#EF4444] flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover da fila
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep("step3_live")}
              className="w-full min-h-[52px] rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white font-extrabold text-base px-4 py-3.5 transition active:scale-95"
            >
              Voltar para a partida ao vivo
            </button>
          </div>
        )}

        {/* PICK WINNER */}
        {step === "pick_winner" && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <h2 className="font-extrabold text-xl text-[#111317]">
                Quem venceu esta partida?
              </h2>
              <p className="text-sm text-[#6E7381]">
                Toque no time vencedor. Ele fica na quadra e o próximo time da fila entra.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleConfirmWinner("A")}
                className="w-full min-h-[64px] rounded-2xl bg-[#FF5400] hover:bg-[#E04800] text-white p-4 text-left transition active:scale-95 space-y-1"
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
                className="w-full min-h-[64px] rounded-2xl bg-[#111317] hover:bg-[#272B33] text-white p-4 text-left transition active:scale-95 space-y-1"
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
              onClick={() => setStep("step3_live")}
              className="w-full min-h-[44px] rounded-xl text-[#6E7381] hover:text-[#111317] font-bold text-sm transition"
            >
              Cancelar e voltar para o jogo
            </button>
          </div>
        )}

        {/* DONE FEEDBACK */}
        {step === "done_feedback" && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-6 shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="font-extrabold text-xl text-[#111317]">
                Tudo certo! Partida encerrada.
              </h2>
              <p className="text-sm text-[#6E7381]">{doneSummary}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep("step3_live")}
              className="w-full min-h-[54px] rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white font-extrabold text-base px-4 py-3.5 transition active:scale-95"
            >
              Ir para a próxima partida
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PeladaPage() {
  return <CourtMasterOrganizer embedded={false} />;
}
