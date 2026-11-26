import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUp,
  CheckCircle2,
  ClipboardList,
  Lock,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  Trophy,
  Unlock,
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
          "Court Master da Hezi Fam: gerencie times, placar, tempo, regras e fila com um toque.",
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

function playBeep() {
  try {
    const Ctx = (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 880;
      g.gain.value = 0.001;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = now + i * 0.35;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      o.start(t0);
      o.stop(t0 + 0.26);
    }
  } catch {
    /* ignore audio errors */
  }
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
  const beepedRef = useRef(false);

  useEffect(() => {
    if (remaining === 0 && court.runningSince && !beepedRef.current) {
      beepedRef.current = true;
      playBeep();
    } else if (remaining > 0) {
      beepedRef.current = false;
    }
  }, [remaining, court.runningSince]);

  return (
    <span
      className={`n font-extrabold text-4xl sm:text-5xl tracking-tight ${
        remaining === 0 ? "text-[#EF4444]" : "text-[#111317]"
      }`}
    >
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
  const screenLocked = usePelada((s) => s.screenLocked);
  const adminPin = usePelada((s) => s.adminPin);
  const matchMs = usePelada((s) => s.matchMs);
  const suddenDeathMs = usePelada((s) => s.suddenDeathMs);
  const championRuleEnabled = usePelada((s) => s.championRuleEnabled);
  const winsToRotate = usePelada((s) => s.winsToRotate);
  const autoReduceEnabled = usePelada((s) => s.autoReduceEnabled);
  const teamStats = usePelada((s) => s.teamStats);
  const actionLog = usePelada((s) => s.actionLog);

  const addPlayer = usePelada((s) => s.addPlayer);
  const renamePlayer = usePelada((s) => s.renamePlayer);
  const removePlayer = usePelada((s) => s.removePlayer);
  const removeFromQueue = usePelada((s) => s.removeFromQueue);
  const moveQueueEntry = usePelada((s) => s.moveQueueEntry);
  const toggleSelect = usePelada((s) => s.toggleSelect);
  const clearSelection = usePelada((s) => s.clearSelection);
  const formTeamFromSelection = usePelada((s) => s.formTeamFromSelection);
  const pasteSelectionIntoTeam = usePelada((s) => s.pasteSelectionIntoTeam);
  const sendToCourtSide = usePelada((s) => s.sendToCourtSide);
  const sendPlayerToCourtSide = usePelada((s) => s.sendPlayerToCourtSide);
  const detachPlayerToQueue = usePelada((s) => s.detachPlayerToQueue);
  const removeCourtTeam = usePelada((s) => s.removeCourtTeam);
  const swapPlayers = usePelada((s) => s.swapPlayers);
  const renameTeam = usePelada((s) => s.renameTeam);
  const startTimer = usePelada((s) => s.startTimer);
  const pauseTimer = usePelada((s) => s.pauseTimer);
  const resetTimer = usePelada((s) => s.resetTimer);
  const useSuddenDeath = usePelada((s) => s.useSuddenDeath);
  const declareWinner = usePelada((s) => s.declareWinner);
  const lockScreen = usePelada((s) => s.lockScreen);
  const unlockScreen = usePelada((s) => s.unlockScreen);
  const setAdminPin = usePelada((s) => s.setAdminPin);
  const setMatchDuration = usePelada((s) => s.setMatchDuration);
  const setSuddenDeathDuration = usePelada((s) => s.setSuddenDeathDuration);
  const setChampionRule = usePelada((s) => s.setChampionRule);
  const setWinsToRotate = usePelada((s) => s.setWinsToRotate);
  const setAutoReduce = usePelada((s) => s.setAutoReduce);
  const resetNight = usePelada((s) => s.resetNight);
  const clearQueueOnly = usePelada((s) => s.clearQueueOnly);

  const [newName, setNewName] = useState("");
  const [inputError, setInputError] = useState("");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Explicit UI states
  const [swapSource, setSwapSource] = useState<{ id: ID; name: string } | null>(
    null,
  );
  const [pickingWinner, setPickingWinner] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmClearQueueOpen, setConfirmClearQueueOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [renameTarget, setRenameTarget] = useState<
    | { kind: "player"; id: ID; current: string }
    | { kind: "team"; id: ID; current: string }
    | null
  >(null);
  const [renameValue, setRenameValue] = useState("");

  const [itemToDelete, setItemToDelete] = useState<
    | { kind: "player"; id: ID; name: string }
    | { kind: "entry"; entry: QueueEntry; name: string }
    | { kind: "courtTeam"; side: "A" | "B"; name: string }
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

  const teamAMembers = (teamA?.memberIds || [])
    .map((id) => players[id])
    .filter(Boolean);
  const teamBMembers = (teamB?.memberIds || [])
    .map((id) => players[id])
    .filter(Boolean);

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

  const handleSwapTap = (targetId: ID, targetName: string) => {
    if (!swapSource) {
      setSwapSource({ id: targetId, name: targetName });
      return;
    }
    if (swapSource.id === targetId) {
      setSwapSource(null);
      return;
    }
    swapPlayers(swapSource.id, targetId);
    setDoneMessage(`${swapSource.name} trocou de lugar com ${targetName}.`);
    setSwapSource(null);
  };

  const handleCallNextToSide = (side: "A" | "B") => {
    const first = queue[0];
    if (!first) return;
    if (first.kind === "team") {
      sendToCourtSide(first, side, { forceCooldown: true });
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
      `${winnerLabel} venceu! Ele continua na quadra e os próximos da fila entram.`,
    );
  };

  const handleSuddenDeath = () => {
    useSuddenDeath();
    setPickingWinner(false);
  };

  const handleLockClick = () => {
    if (!adminPin) {
      setRulesOpen(true);
      setDoneMessage("Defina uma senha de 4 dígitos em Regras e Tempos para bloquear a tela.");
      return;
    }
    lockScreen();
  };

  // LOCKED (TOTEM) VIEW
  if (screenLocked) {
    return (
      <div className="min-h-dvh bg-[#111317] text-white p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-[480px] bg-white text-[#111317] rounded-3xl p-6 space-y-5 shadow-xl text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFF4EE] text-[#FF5400] px-3 py-1.5 rounded-full text-xs font-extrabold">
            <Lock className="w-3.5 h-3.5" />
            Tela Bloqueada (Modo Quadra)
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase text-[#6E7381] mb-1">
              Tempo de jogo
            </p>
            <MatchClockDisplay durationMs={durationMs} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-[#F4F5F7] rounded-2xl p-3">
              <p className="font-extrabold text-xs text-[#6E7381] truncate">
                {teamALabel}
              </p>
              <p className="n font-extrabold text-3xl text-[#FF5400]">
                {scoreA}
              </p>
            </div>
            <div className="bg-[#F4F5F7] rounded-2xl p-3">
              <p className="font-extrabold text-xs text-[#6E7381] truncate">
                {teamBLabel}
              </p>
              <p className="n font-extrabold text-3xl text-[#FF5400]">
                {scoreB}
              </p>
            </div>
          </div>

          <p className="text-xs font-bold text-[#6E7381]">
            Pessoas na fila: {waitingPeopleCount}
          </p>

          {!pinPromptOpen ? (
            <button
              type="button"
              onClick={() => {
                setPinPromptOpen(true);
                setPinInput("");
                setPinError("");
              }}
              className="w-full min-h-[48px] rounded-xl bg-[#111317] text-white font-extrabold text-sm px-4 py-3 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Desbloquear tela
            </button>
          ) : (
            <div className="space-y-2.5 text-left">
              <label className="block text-xs font-extrabold text-[#111317]">
                Digite a senha de 4 dígitos
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setPinError("");
                }}
                placeholder="Exemplo: 1234"
                className="w-full min-h-[48px] bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-base font-bold text-center tracking-widest outline-none focus:ring-2 ring-[#FF5400]"
              />
              {pinError && (
                <p className="text-xs font-bold text-[#EF4444]">{pinError}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (unlockScreen(pinInput)) {
                      setPinPromptOpen(false);
                    } else {
                      setPinError("Senha incorreta. Tente novamente.");
                    }
                  }}
                  className="min-h-[46px] rounded-xl bg-[#FF5400] text-white font-extrabold text-sm"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setPinPromptOpen(false)}
                  className="min-h-[46px] rounded-xl bg-[#F4F5F7] text-[#111317] font-bold text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          embedded ? "space-y-4" : "max-w-6xl mx-auto p-4 md:p-6 space-y-4"
        }
      >
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

        {/* TOP TOOLBAR (ICON + TEXT ON EVERY ACTION) */}
        <div className="bg-white border border-[#EAEBEF] rounded-2xl p-3.5 shadow-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRulesOpen((v) => !v)}
              className="min-h-[40px] px-3 rounded-xl bg-[#F4F5F7] hover:bg-[#EAEBEF] text-[#111317] text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Settings className="w-3.5 h-3.5 text-[#FF5400]" />
              Regras e tempos
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="min-h-[40px] px-3 rounded-xl bg-[#F4F5F7] hover:bg-[#EAEBEF] text-[#111317] text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <ClipboardList className="w-3.5 h-3.5 text-[#FF5400]" />
              Resumo da noite
            </button>
            <button
              type="button"
              onClick={handleLockClick}
              className="min-h-[40px] px-3 rounded-xl bg-[#F4F5F7] hover:bg-[#EAEBEF] text-[#111317] text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Lock className="w-3.5 h-3.5 text-[#FF5400]" />
              Bloquear tela
            </button>
          </div>
        </div>

        {/* SWAP MODE BANNER */}
        {swapSource && (
          <div className="bg-[#FFF4EE] border-2 border-[#FF5400] rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-sm text-[#111317]">
                Modo troca ativo: {swapSource.name}
              </p>
              <p className="text-xs text-[#6E7381]">
                Toque em &ldquo;Trocar lugar&rdquo; em outro jogador para fazer a troca.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSwapSource(null)}
              className="min-h-[38px] px-3 rounded-xl bg-white border border-[#EAEBEF] text-xs font-bold text-[#111317] shrink-0"
            >
              Cancelar troca
            </button>
          </div>
        )}

        {/* IMMEDIATE FEEDBACK BANNER */}
        {doneMessage && (
          <div className="bg-[#ECFDF5] border-2 border-[#10B981] rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-extrabold text-sm text-[#111317]">
                Tudo certo!
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

        {/* RULES & TIMES PANEL */}
        {rulesOpen && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#111317]">
                Regras e Tempos
              </h3>
              <button
                type="button"
                onClick={() => setRulesOpen(false)}
                className="text-xs font-extrabold text-[#FF5400] hover:underline"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111317] mb-1">
                  Tempo do jogo (minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={Math.round(matchMs / 60000)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v > 0) setMatchDuration(v * 60000);
                  }}
                  className="w-full min-h-[44px] bg-[#F4F5F7] rounded-xl px-3 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111317] mb-1">
                  Tempo de desempate (minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={Math.round(suddenDeathMs / 60000)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v > 0)
                      setSuddenDeathDuration(v * 60000);
                  }}
                  className="w-full min-h-[44px] bg-[#F4F5F7] rounded-xl px-3 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111317] mb-1">
                  Vitórias seguidas para rodar
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={winsToRotate}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v > 0) setWinsToRotate(v);
                  }}
                  className="w-full min-h-[44px] bg-[#F4F5F7] rounded-xl px-3 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111317] mb-1">
                  Senha de bloqueio (4 dígitos)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={adminPin}
                  placeholder="Exemplo: 1234"
                  onChange={(e) =>
                    setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  className="w-full min-h-[44px] bg-[#F4F5F7] rounded-xl px-3 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 text-xs font-bold text-[#111317] cursor-pointer">
                <input
                  type="checkbox"
                  checked={championRuleEnabled}
                  onChange={(e) => setChampionRule(e.target.checked)}
                  className="w-4 h-4 accent-[#FF5400]"
                />
                Ativar regra de Rei da Quadra (campeão aguarda após limite de vitórias)
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-[#111317] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReduceEnabled}
                  onChange={(e) =>
                    setAutoReduce({ enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#FF5400]"
                />
                Reduzir tempo automaticamente quando a fila estiver cheia
              </label>
            </div>
          </div>
        )}

        {/* NIGHT SUMMARY & ACTION LOG */}
        {historyOpen && (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#111317]">
                Resumo da Noite
              </h3>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="text-xs font-extrabold text-[#FF5400] hover:underline"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase text-[#6E7381]">
                Desempenho dos Times
              </p>
              {Object.values(teamStats).length === 0 ? (
                <p className="text-xs text-[#6E7381]">
                  Nenhuma partida encerrada ainda hoje.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {Object.values(teamStats).map((st) => (
                    <div
                      key={st.teamId}
                      className="flex items-center justify-between bg-[#F4F5F7] rounded-xl px-3 py-2 text-xs"
                    >
                      <span className="font-bold text-[#111317] truncate pr-2">
                        {teamNames[st.teamId] || `Time ${st.number}`}
                      </span>
                      <span className="n font-extrabold text-[#111317] shrink-0">
                        {st.wins}V · {st.losses}D · {st.draws}E
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#EAEBEF]">
              <p className="text-xs font-extrabold uppercase text-[#6E7381]">
                Últimas ações ({actionLog.length})
              </p>
              {actionLog.length === 0 ? (
                <p className="text-xs text-[#6E7381]">Sem registros ainda.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {actionLog.slice(0, 15).map((entry) => (
                    <p
                      key={entry.ts + entry.msg}
                      className="text-[11px] text-[#6E7381] bg-[#F4F5F7] rounded-lg px-2.5 py-1.5"
                    >
                      {entry.msg}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RENAME DIALOG */}
        {renameTarget && (
          <div className="bg-white border-2 border-[#FF5400] rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-sm text-[#111317]">
              {renameTarget.kind === "player"
                ? "Alterar nome do jogador"
                : "Alterar nome do time"}
            </p>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Exemplo: Time do João"
              className="w-full min-h-[44px] bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-3.5 text-sm font-semibold outline-none focus:ring-2 ring-[#FF5400]"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const clean = renameValue.trim();
                  if (!clean) return;
                  if (renameTarget.kind === "player") {
                    renamePlayer(renameTarget.id, clean);
                  } else {
                    renameTeam(renameTarget.id, clean);
                  }
                  setRenameTarget(null);
                }}
                className="min-h-[44px] rounded-xl bg-[#FF5400] text-white font-extrabold text-sm"
              >
                Salvar nome
              </button>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="min-h-[44px] rounded-xl bg-[#F4F5F7] text-[#111317] font-bold text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION: RESET NIGHT */}
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
                className="min-h-[48px] rounded-xl bg-[#EF4444] text-white font-extrabold text-sm px-4 py-3"
              >
                Sim, quero zerar tudo
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="min-h-[48px] rounded-xl bg-white border border-[#EAEBEF] text-[#111317] font-bold text-sm px-4 py-3"
              >
                Não, voltar
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION: CLEAR QUEUE ONLY */}
        {confirmClearQueueOpen && (
          <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-base text-[#111317]">
              Limpar apenas a fila de espera?
            </p>
            <p className="text-sm text-[#6E7381]">
              Quem já está jogando na quadra continua no jogo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  clearQueueOnly();
                  setConfirmClearQueueOpen(false);
                }}
                className="min-h-[48px] rounded-xl bg-[#EF4444] text-white font-extrabold text-sm px-4 py-3"
              >
                Sim, limpar fila
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearQueueOpen(false)}
                className="min-h-[48px] rounded-xl bg-white border border-[#EAEBEF] text-[#111317] font-bold text-sm px-4 py-3"
              >
                Não, voltar
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION: REMOVE PLAYER / TEAM / COURT TEAM */}
        {itemToDelete && (
          <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 space-y-3">
            <p className="font-extrabold text-base text-[#111317]">
              Remover {itemToDelete.name}?
            </p>
            <p className="text-sm text-[#6E7381]">
              Esta ação tira o registro da partida ou fila atual.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (itemToDelete.kind === "player") {
                    removePlayer(itemToDelete.id);
                  } else if (itemToDelete.kind === "entry") {
                    removeFromQueue(itemToDelete.entry);
                  } else {
                    removeCourtTeam(itemToDelete.side, { deletePlayers: false });
                  }
                  setItemToDelete(null);
                }}
                className="min-h-[48px] rounded-xl bg-[#EF4444] text-white font-extrabold text-sm px-4 py-3"
              >
                Sim, quero remover
              </button>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="min-h-[48px] rounded-xl bg-white border border-[#EAEBEF] text-[#111317] font-bold text-sm px-4 py-3"
              >
                Não, voltar
              </button>
            </div>
          </div>
        )}

        {/* PICK WINNER */}
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
                  {teamAMembers.length > 0
                    ? teamAMembers.map((m) => m.name).join(", ")
                    : "Sem jogadores"}
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
                  {teamBMembers.length > 0
                    ? teamBMembers.map((m) => m.name).join(", ")
                    : "Sem jogadores"}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* BLOCO 1: EM QUADRA AGORA */}
        <div className="lg:col-span-7 bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-extrabold text-lg text-[#111317]">
              Em Quadra Agora ({modeLabel})
            </h2>
            {waitingChampion && teams[waitingChampion] && (
              <span className="inline-flex items-center gap-1 bg-[#FFFBEB] border border-[#F59E0B] text-[#B45309] text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                <Trophy className="w-3.5 h-3.5" />
                Campeão aguardando: Time {teams[waitingChampion].number}
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
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={court.runningSince ? pauseTimer : startTimer}
                className={`flex-1 min-h-[48px] rounded-xl font-extrabold text-sm px-4 py-3 flex items-center justify-center gap-2 transition active:scale-95 ${
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
              <button
                type="button"
                onClick={resetTimer}
                className="min-h-[48px] px-4 rounded-xl bg-white border border-[#EAEBEF] text-[#111317] font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Zerar relógio
              </button>
            </div>
          </div>

          {/* Teams A & B */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["A", "B"] as const).map((side) => {
              const team = side === "A" ? teamA : teamB;
              const label = side === "A" ? teamALabel : teamBLabel;
              const members = side === "A" ? teamAMembers : teamBMembers;
              const score = side === "A" ? scoreA : scoreB;
              const setScore = side === "A" ? setScoreA : setScoreB;

              return (
                <div
                  key={side}
                  className="bg-[#F4F5F7] rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-extrabold text-sm text-[#111317] block truncate">
                        {label}
                      </span>
                      {team && (
                        <span className="text-[11px] font-bold text-[#6E7381]">
                          {team.wins} {team.wins === 1 ? "vitória" : "vitórias"}
                        </span>
                      )}
                    </div>
                    <span className="n font-extrabold text-3xl text-[#FF5400] shrink-0">
                      {score}
                    </span>
                  </div>

                  {team && (
                    <button
                      type="button"
                      onClick={() => {
                        setRenameTarget({
                          kind: "team",
                          id: team.id,
                          current: label,
                        });
                        setRenameValue(teamNames[team.id] || "");
                      }}
                      className="text-[11px] font-bold text-[#6E7381] hover:text-[#111317] inline-flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Renomear time
                    </button>
                  )}

                  {/* Members */}
                  <div className="space-y-1.5">
                    {members.length === 0 ? (
                      <p className="text-xs text-[#6E7381]">
                        Vaga aberta no Time {side}
                      </p>
                    ) : (
                      members.map((m) => (
                        <div
                          key={m.id}
                          className={`bg-white rounded-xl p-2 space-y-1.5 border ${
                            swapSource?.id === m.id
                              ? "border-[#FF5400] bg-[#FFF4EE]"
                              : "border-[#EAEBEF]"
                          }`}
                        >
                          <p className="font-bold text-xs text-[#111317] truncate">
                            {m.name}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => handleSwapTap(m.id, m.name)}
                              className="px-2 py-1 rounded-lg bg-[#F4F5F7] text-[10px] font-bold text-[#111317] inline-flex items-center gap-1"
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                              {swapSource ? "Trocar aqui" : "Trocar lugar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => detachPlayerToQueue(m.id)}
                              className="px-2 py-1 rounded-lg bg-[#F4F5F7] text-[10px] font-bold text-[#6E7381] hover:text-[#EF4444]"
                            >
                              Voltar p/ fila
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {team && selection.length > 0 && (
                    <button
                      type="button"
                      onClick={() => pasteSelectionIntoTeam(team.id)}
                      className="w-full min-h-[38px] rounded-xl bg-[#ECFDF5] border border-[#10B981] text-[#059669] font-extrabold text-xs px-3 py-2"
                    >
                      Colocar {selection.length} selecionados aqui
                    </button>
                  )}

                  {members.length < maxTeamSize && queue.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCallNextToSide(side)}
                      className="w-full min-h-[40px] rounded-xl bg-white border border-[#EAEBEF] hover:border-[#FF5400] text-[#111317] font-bold text-xs px-3 py-2 transition"
                    >
                      Chamar próximo da fila
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setScore((v) => v + 1)}
                    className="w-full min-h-[48px] rounded-xl bg-[#111317] hover:bg-[#FF5400] text-white font-extrabold text-sm px-3 py-3 transition active:scale-95"
                  >
                    +1 Ponto para Time {side}
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    {score > 0 ? (
                      <button
                        type="button"
                        onClick={() => setScore((v) => Math.max(0, v - 1))}
                        className="text-xs font-bold text-[#6E7381] hover:text-[#111317]"
                      >
                        Tirar 1 ponto
                      </button>
                    ) : (
                      <span />
                    )}
                    {team && (
                      <button
                        type="button"
                        onClick={() =>
                          setItemToDelete({
                            kind: "courtTeam",
                            side,
                            name: label,
                          })
                        }
                        className="text-xs font-bold text-[#EF4444] hover:underline"
                      >
                        Tirar time da quadra
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPickingWinner(true)}
            className="w-full min-h-[52px] rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white font-extrabold text-base px-4 py-3.5 transition active:scale-95"
          >
            Encerrar partida e escolher vencedor
          </button>
        </div>

        {/* COLUNA DIREITA NO DESKTOP: ADICIONAR + FILA */}
        <div className="lg:col-span-5 space-y-4">
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
                Suba, desça, forme times ou mande direto para o Time A ou Time B.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selection.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-bold text-[#6E7381] hover:text-[#111317]"
                >
                  Limpar seleção ({selection.length})
                </button>
              )}
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearQueueOpen(true)}
                  className="text-xs font-bold text-[#EF4444] hover:underline"
                >
                  Limpar fila
                </button>
              )}
            </div>
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
                const isPlayer = entry.kind === "player";
                const playerObj = isPlayer ? players[entry.id] : undefined;
                const teamObj = !isPlayer ? teams[entry.id] : undefined;
                const isSelected = isPlayer && selection.includes(entry.id);
                const label = isPlayer
                  ? playerObj?.name || "Jogador"
                  : `${teamNames[entry.id] || `Time ${teamObj?.number ?? ""}`}: ${(
                      teamObj?.memberIds || []
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
                        : swapSource && isPlayer && swapSource.id === entry.id
                          ? "bg-[#FFF4EE] border-[#FF5400]"
                          : "bg-[#F4F5F7] border-transparent"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-sm text-[#111317]">
                        {idx + 1}. {label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {playerObj?.justPlayed && (
                          <span className="text-[10px] font-extrabold bg-[#FFFBEB] text-[#B45309] border border-[#F59E0B] px-2 py-0.5 rounded-full">
                            Acabou de jogar
                          </span>
                        )}
                        {!isPlayer && (
                          <span className="text-[10px] font-extrabold uppercase bg-white text-[#FF5400] px-2 py-0.5 rounded-full">
                            Time formado
                          </span>
                        )}
                      </div>
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

                      {isPlayer && (
                        <>
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
                          <button
                            type="button"
                            onClick={() => handleSwapTap(entry.id, label)}
                            className="min-h-[38px] px-3 rounded-lg bg-white border border-[#EAEBEF] text-xs font-bold text-[#111317] flex items-center gap-1"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            {swapSource ? "Trocar aqui" : "Trocar lugar"}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          isPlayer
                            ? sendPlayerToCourtSide(entry.id, "A")
                            : sendToCourtSide(entry, "A", {
                                forceCooldown: true,
                              })
                        }
                        className="min-h-[38px] px-3 rounded-lg bg-[#111317] text-white text-xs font-bold hover:bg-[#FF5400] transition"
                      >
                        Time A
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          isPlayer
                            ? sendPlayerToCourtSide(entry.id, "B")
                            : sendToCourtSide(entry, "B", {
                                forceCooldown: true,
                              })
                        }
                        className="min-h-[38px] px-3 rounded-lg bg-[#111317] text-white text-xs font-bold hover:bg-[#FF5400] transition"
                      >
                        Time B
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRenameTarget(
                            isPlayer
                              ? { kind: "player", id: entry.id, current: label }
                              : {
                                  kind: "team",
                                  id: entry.id,
                                  current: label,
                                },
                          );
                          setRenameValue(
                            isPlayer ? label : teamNames[entry.id] || "",
                          );
                        }}
                        className="min-h-[38px] px-3 rounded-lg bg-white border border-[#EAEBEF] text-xs font-bold text-[#111317] flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Renomear
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setItemToDelete(
                            isPlayer
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
      </div>
    </div>
  );
}

export function PeladaPage() {
  return <CourtMasterOrganizer embedded={false} />;
}
