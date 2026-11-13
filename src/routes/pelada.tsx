import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crown,
  Ban,
  Play,
  Pause,
  Timer as TimerIcon,
  Shuffle,
  Trophy,
  Plus,
  X,
  Users,
  Settings,
  Lock,
  Unlock,
  Pencil,
  GripVertical,
  MoreVertical,
  ClipboardList,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  usePelada,
  computeElapsed,
  currentDurationMs,
  getMaxTeamSize,
  type QueueEntry,
  type ID,
  MATCH_MS,
} from "@/lib/pelada/store";
import { useRealtimeSync } from "@/lib/hezi/sync";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  DragOverlay,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/pelada")({
  head: () => ({
    meta: [
      { title: "HEZI FAM® - Moving the Game | Pelada & Totem 3x3" },
      {
        name: "description",
        content:
          "Totem oficial da Hezi Fam para gerenciar pelada 3x3: fila, times, cronômetro e Rei da Quadra.",
      },
      { property: "og:title", content: "HEZI FAM® - Pelada Totem 3x3" },
      {
        property: "og:description",
        content: "Gerencie a pelada 3x3 direto do celular ou tablet.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PeladaPage,
});

// ---------------------------------------------------------------------------
// Ticks, alarm
// ---------------------------------------------------------------------------
export function useTick(intervalMs = 250) {
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
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.start(t0);
      o.stop(t0 + 0.32);
    }
    setTimeout(() => ctx.close(), 2000);
  } catch {
    /* noop */
  }
}

// ---------------------------------------------------------------------------
// Embeddable Court Master Organizer (used in Admin panel AND standalone /pelada)
// ---------------------------------------------------------------------------
export function CourtMasterOrganizer({ embedded = false }: { embedded?: boolean }) {
  const reorderQueue = usePelada((s) => s.reorderQueue);
  const movePlayerToTeam = usePelada((s) => s.movePlayerToTeam);
  const detachPlayerToQueue = usePelada((s) => s.detachPlayerToQueue);
  const swapPlayers = usePelada((s) => s.swapPlayers);
  const sendPlayerToCourtSide = usePelada((s) => s.sendPlayerToCourtSide);
  const queue = usePelada((s) => s.queue);
  const players = usePelada((s) => s.players);
  const screenLocked = usePelada((s) => s.screenLocked);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const aId = String(active.id);
    const oId = String(over.id);
    if (aId === oId) return;

    const isPlayer = (v: string) => v.startsWith("player:");
    const pid = (v: string) => v.slice("player:".length);

    if (isPlayer(aId)) {
      const dragged = pid(aId);
      if (isPlayer(oId)) {
        swapPlayers(dragged, pid(oId));
        return;
      }
      if (oId.startsWith("team:")) {
        movePlayerToTeam(dragged, oId.slice("team:".length));
        return;
      }
      if (oId.startsWith("court-slot:")) {
        sendPlayerToCourtSide(dragged, oId.slice("court-slot:".length) as "A" | "B");
        return;
      }
      if (oId.startsWith("qentry:") || oId.startsWith("qentry-drop:")) {
        const suffix = oId.slice(oId.indexOf(":") + 1);
        const idx = queue.findIndex((q) => `${q.kind}:${q.id}` === suffix);
        detachPlayerToQueue(dragged, idx < 0 ? undefined : idx);
        return;
      }
      if (oId === "queue-drop") {
        detachPlayerToQueue(dragged);
      }
      return;
    }

    if (aId.startsWith("qentry:") && oId.startsWith("qentry:")) {
      const from = queue.findIndex((q) => `qentry:${q.kind}:${q.id}` === aId);
      const to = queue.findIndex((q) => `qentry:${q.kind}:${q.id}` === oId);
      if (from >= 0 && to >= 0) reorderQueue(from, to);
    }
  }

  const activeLabel =
    activeId && activeId.startsWith("player:")
      ? players[activeId.slice("player:".length)]?.name
      : null;

  return (
    <div className="select-none space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={onDragEnd}
      >
        {embedded && <EmbeddedToolbar />}
        <CourtBlock />
        <QueueBlock />
        <DragOverlay dropAnimation={null}>
          {activeLabel ? (
            <div className="border-2 border-brand-orange bg-brand-orange px-3 py-2 font-condensed text-sm font-black uppercase tracking-wider text-white shadow-xl">
              {activeLabel}
            </div>
          ) : activeId?.startsWith("qentry:") ? (
            <div className="border-2 border-brand-orange bg-white px-4 py-3 font-condensed text-sm font-black uppercase tracking-wider text-brand-dark shadow-xl">
              Movendo…
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {screenLocked && <LockOverlay />}
      <RenameDialogController />
      <TeamRenameDialogController />
      <HistoryDialogController />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root page for standalone /pelada route
// ---------------------------------------------------------------------------
export function PeladaPage() {
  useRealtimeSync();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-dark font-sans select-none pb-24 selection:bg-brand-orange selection:text-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 mt-6">
        <CourtMasterOrganizer embedded={false} />
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Embedded Toolbar when rendered inside the unified Admin Panel
// ---------------------------------------------------------------------------
function EmbeddedToolbar() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [lockPrompt, setLockPrompt] = useState(false);
  const adminPin = usePelada((s) => s.adminPin);
  const lockScreen = usePelada((s) => s.lockScreen);
  const playersCount = usePelada((s) => Object.keys(s.players).length);
  const gameFormat = usePelada((s) => s.gameFormat ?? "3x3");
  const setGameFormat = usePelada((s) => s.setGameFormat);
  const maxTeamSize = getMaxTeamSize(gameFormat);

  function onLock() {
    if (!adminPin) {
      setLockPrompt(true);
      return;
    }
    lockScreen();
  }

  return (
    <div className="border border-brand-border bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 shrink-0 bg-brand-orange flex items-center justify-center font-black text-white font-condensed text-lg">
          {gameFormat.toUpperCase()}
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-condensed font-black text-brand-orange uppercase tracking-widest block truncate">
            MODALIDADE {gameFormat.toUpperCase()} · MÁX {maxTeamSize} JOGADORES POR TIME
          </span>
          <h3 className="font-bebas text-xl sm:text-2xl text-brand-dark leading-none truncate">
            COURT MASTER ({playersCount} ATLETAS)
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
        <div className="col-span-2 sm:col-span-1 inline-flex border border-brand-border-strong bg-brand-subtle w-full sm:w-auto">
          {(["3x3", "5x5"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setGameFormat(fmt)}
              className={cn(
                "flex-1 sm:flex-initial px-3 py-2 font-condensed font-black uppercase text-xs tracking-wider transition-colors",
                gameFormat === fmt
                  ? "bg-brand-orange text-white"
                  : "text-brand-dark hover:bg-brand-border",
              )}
              title={`Limitar times a ${fmt === "5x5" ? 5 : 3} jogadores`}
            >
              {fmt} (MÁX {fmt === "5x5" ? 5 : 3})
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => historyBus.open()}
          className="bg-brand-subtle hover:bg-brand-border text-brand-dark border border-brand-border-strong font-condensed font-black uppercase text-xs tracking-wider px-2.5 sm:px-3 py-2 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <ClipboardList className="h-4 w-4 text-brand-orange shrink-0" />
          <span className="truncate">HISTÓRICO</span>
        </button>
        <button
          type="button"
          onClick={() => setAdminOpen(true)}
          className="bg-brand-subtle hover:bg-brand-border text-brand-dark border border-brand-border-strong font-condensed font-black uppercase text-xs tracking-wider px-2.5 sm:px-3 py-2 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Settings className="h-4 w-4 text-brand-dark shrink-0" />
          <span className="truncate">REGRAS</span>
        </button>
        <button
          type="button"
          onClick={onLock}
          className="col-span-2 sm:col-span-1 bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs tracking-wider px-3.5 py-2 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"
        >
          <Lock className="h-4 w-4 shrink-0" />
          MODO TOTEM (BLOQUEAR)
        </button>
      </div>

      <AdminDialog open={adminOpen} onOpenChange={setAdminOpen} />
      <Dialog open={lockPrompt} onOpenChange={setLockPrompt}>
        <DialogContent className="rounded-none border border-brand-border bg-white">
          <DialogHeader>
            <DialogTitle className="font-bebas text-3xl tracking-wide text-brand-dark uppercase">
              Defina um PIN primeiro
            </DialogTitle>
            <DialogDescription className="font-condensed text-xs uppercase text-brand-muted">
              Para bloquear a tela é preciso configurar um PIN de 4 dígitos em Regras & Tempos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setLockPrompt(false)}
              className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setLockPrompt(false);
                setAdminOpen(true);
              }}
              className="rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs"
            >
              Configurar PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HEADER — Standalone /pelada route
// ---------------------------------------------------------------------------
function Header() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [lockPrompt, setLockPrompt] = useState(false);
  const adminPin = usePelada((s) => s.adminPin);
  const lockScreen = usePelada((s) => s.lockScreen);
  const playersCount = usePelada((s) => Object.keys(s.players).length);

  function onLock() {
    if (!adminPin) {
      setLockPrompt(true);
      return;
    }
    lockScreen();
  }

  return (
    <header className="bg-white border-b border-brand-border sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between py-2 px-4 border-b border-brand-border/60 text-xs font-condensed">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-brand-orange" />
          <span className="font-extrabold uppercase tracking-wider text-brand-dark text-[11px]">
            PLATAFORMA OFICIAL HEZI FAM®
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-brand-subtle px-2.5 py-1 border border-brand-border rounded-none">
            <span className="w-2 h-2 rounded-full bg-brand-orange" />
            <span className="font-condensed font-black text-[11px] text-brand-dark uppercase">
              COURT MASTER // {playersCount} ATLETAS
            </span>
          </div>
          <Link
            to="/"
            className="text-[11px] font-condensed font-black uppercase text-brand-orange hover:text-brand-orange-hover transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> PLATAFORMA COMPLETA
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 bg-brand-orange flex items-center justify-center font-black text-white font-condensed text-xl shadow-sm shrink-0">
            HF
          </div>
          <div className="min-w-0">
            <span className="font-bebas text-2xl tracking-wider text-brand-dark flex items-center gap-1 leading-none">
              HEZI FAM<span className="text-brand-orange text-lg">®</span>
            </span>
            <span className="text-[9px] text-brand-muted font-condensed tracking-widest block uppercase font-bold truncate">
              STREETWEAR & BASKETBALL
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => historyBus.open()}
            title="Histórico"
            className="bg-white hover:bg-brand-subtle text-brand-dark border border-brand-border-strong font-condensed font-black uppercase text-xs tracking-wider px-3 py-2 transition-colors inline-flex items-center gap-1.5"
          >
            <ClipboardList className="h-4 w-4 text-brand-orange" />
            <span className="hidden sm:inline">HISTÓRICO</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            title="Admin"
            className="bg-white hover:bg-brand-subtle text-brand-dark border border-brand-border-strong font-condensed font-black uppercase text-xs tracking-wider px-3 py-2 transition-colors inline-flex items-center gap-1.5"
          >
            <Settings className="h-4 w-4 text-brand-dark" />
            <span className="hidden sm:inline">CONFIG / ADMIN</span>
          </button>
          <button
            type="button"
            onClick={onLock}
            title="Bloquear tela"
            className="bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs tracking-wider px-3.5 py-2 transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">BLOQUEAR</span>
          </button>
        </div>
      </div>

      <AdminDialog open={adminOpen} onOpenChange={setAdminOpen} />
      <Dialog open={lockPrompt} onOpenChange={setLockPrompt}>
        <DialogContent className="rounded-none border border-brand-border bg-white">
          <DialogHeader>
            <DialogTitle className="font-bebas text-3xl tracking-wide text-brand-dark uppercase">
              Defina um PIN primeiro
            </DialogTitle>
            <DialogDescription className="font-condensed text-xs uppercase text-brand-muted">
              Para bloquear a tela é preciso configurar um PIN de 4 dígitos no menu Admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setLockPrompt(false)}
              className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setLockPrompt(false);
                setAdminOpen(true);
              }}
              className="rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs"
            >
              Abrir Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

// ---------------------------------------------------------------------------
// COURT BLOCK
// ---------------------------------------------------------------------------
function CourtBlock() {
  useTick(250);
  const court = usePelada((s) => s.court);
  const matchMs = usePelada((s) => s.matchMs);
  const suddenDeathMs = usePelada((s) => s.suddenDeathMs);
  const autoReduceEnabled = usePelada((s) => s.autoReduceEnabled);
  const autoReduceThreshold = usePelada((s) => s.autoReduceThreshold);
  const autoReduceMs = usePelada((s) => s.autoReduceMs);
  const teams = usePelada((s) => s.teams);
  const players = usePelada((s) => s.players);
  const startTimer = usePelada((s) => s.startTimer);
  const pauseTimer = usePelada((s) => s.pauseTimer);
  const resetTimer = usePelada((s) => s.resetTimer);
  const useSuddenDeath = usePelada((s) => s.useSuddenDeath);
  const declareWinner = usePelada((s) => s.declareWinner);
  const declareDraw = usePelada((s) => s.declareDraw);

  const durationState = {
    court,
    matchMs,
    suddenDeathMs,
    players,
    autoReduceEnabled,
    autoReduceThreshold,
    autoReduceMs,
  };
  const autoReduceActive =
    autoReduceEnabled && Object.keys(players).length >= autoReduceThreshold;
  const total = currentDurationMs(durationState);
  const elapsed = Math.min(computeElapsed(court, Date.now()), total);
  const remaining = Math.max(0, total - elapsed);
  const finished = remaining === 0 && !!court.runningSince;

  const firedRef = useRef(false);
  useEffect(() => {
    if (finished && !firedRef.current) {
      firedRef.current = true;
      playBeep();
      pauseTimer();
    }
    if (!finished) firedRef.current = false;
  }, [finished, pauseTimer]);

  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  const timeStr = `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  const pct = total > 0 ? (elapsed / total) * 100 : 0;

  const teamA = court.teamAId ? teams[court.teamAId] : null;
  const teamB = court.teamBId ? teams[court.teamBId] : null;
  const canDeclare = !!teamA && !!teamB;

  return (
    <section className="border border-brand-border bg-white p-3.5 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border pb-3 sm:pb-4">
        <div>
          <div className="inline-block bg-brand-orange/10 text-brand-orange border border-brand-orange/30 font-condensed font-black text-[10px] sm:text-[11px] uppercase px-2.5 py-0.5 tracking-wider mb-1">
            STREET BASKETBALL MOVEMENT // QUADRA ATUAL
          </div>
          <h1 className="font-bebas text-2xl sm:text-4xl text-brand-dark tracking-wide uppercase leading-none">
            PAINEL DE QUADRA & CRONÔMETRO
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {court.inSuddenDeath && (
            <Badge className="rounded-none bg-red-600 text-white font-condensed font-black uppercase tracking-widest text-xs px-2.5 py-1">
              ⚡ MORTE SÚBITA
            </Badge>
          )}
          {!court.inSuddenDeath && autoReduceActive && (
            <Badge className="rounded-none bg-brand-orange text-white font-condensed font-black uppercase tracking-widest text-xs px-2.5 py-1">
              TEMPO REDUZIDO · {Object.keys(players).length} JOGADORES
            </Badge>
          )}
        </div>
      </div>

      <div className="border border-brand-border bg-brand-subtle/60 p-3.5 sm:p-5 text-center space-y-3">
        <div
          className={cn(
            "font-bebas text-6xl sm:text-8xl leading-none tabular-nums tracking-wider transition-colors text-brand-dark",
            remaining < 30000 && "text-red-600",
          )}
        >
          {timeStr}
        </div>

        <div className="w-full bg-white border border-brand-border h-3.5 sm:h-4 overflow-hidden p-0.5">
          <div
            className="h-full bg-brand-orange transition-[width] duration-200"
            style={{ width: `${100 - pct}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2 pt-1 sm:pt-2">
          {court.runningSince ? (
            <Button
              size="lg"
              variant="secondary"
              onClick={pauseTimer}
              className="w-full sm:w-auto rounded-none border border-brand-border-strong bg-white hover:bg-brand-subtle text-brand-dark font-condensed font-black uppercase tracking-wider text-sm px-6"
            >
              <Pause className="h-4 w-4" /> Pausar
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={startTimer}
              disabled={!canDeclare}
              className="w-full sm:w-auto rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase tracking-widest text-sm px-6 shadow-sm"
            >
              <Play className="h-4 w-4" /> Iniciar Partida
            </Button>
          )}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="secondary"
              onClick={useSuddenDeath}
              disabled={court.suddenDeathUsed || !canDeclare}
              className="rounded-none border border-brand-border-strong bg-white hover:bg-brand-subtle text-brand-dark font-condensed font-black uppercase tracking-wider text-xs px-2 sm:px-4 h-10"
            >
              <TimerIcon className="h-4 w-4 text-brand-orange shrink-0" /> +1 min
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={declareDraw}
              disabled={!canDeclare}
              className="rounded-none border border-brand-border-strong bg-white hover:bg-brand-subtle text-brand-dark font-condensed font-black uppercase tracking-wider text-xs px-2 sm:px-4 h-10"
            >
              <Shuffle className="h-4 w-4 shrink-0" /> Empate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetTimer}
              className="rounded-none text-brand-muted hover:text-brand-dark hover:bg-brand-subtle font-condensed font-bold uppercase tracking-wider text-xs px-2 sm:px-3 h-10 border border-transparent hover:border-brand-border"
            >
              Zerar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CourtTeamCard
          side="A"
          team={teamA}
          players={players}
          onWin={() => declareWinner("A")}
          canDeclare={canDeclare}
        />
        <CourtTeamCard
          side="B"
          team={teamB}
          players={players}
          onWin={() => declareWinner("B")}
          canDeclare={canDeclare}
        />
      </div>
    </section>
  );
}

function CourtTeamCard({
  side,
  team,
  players,
  onWin,
  canDeclare,
}: {
  side: "A" | "B";
  team: ReturnType<typeof usePelada.getState>["teams"][string] | null;
  players: ReturnType<typeof usePelada.getState>["players"];
  onWin: () => void;
  canDeclare: boolean;
}) {
  const removeCourtTeam = usePelada((s) => s.removeCourtTeam);
  const customName = usePelada((s) => (team ? s.teamNames[team.id] : undefined));
  const sideColor = side === "A" ? "bg-brand-orange" : "bg-brand-dark";
  const dropId = team ? `team:${team.id}` : `court-slot:${side}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border border-brand-border bg-white p-4 flex flex-col gap-3 min-h-[200px] transition-all shadow-xs",
        side === "A" ? "border-t-4 border-t-brand-orange" : "border-t-4 border-t-brand-dark",
        isOver && "ring-2 ring-brand-orange bg-brand-orange/5",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-brand-border pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              "h-8 w-8 flex items-center justify-center text-white font-bebas text-xl shrink-0 shadow-xs",
              sideColor,
            )}
          >
            {side}
          </span>
          <button
            type="button"
            onClick={() => team && teamRenameBus.emit(team.id)}
            className="font-bebas text-2xl tracking-wide text-brand-dark truncate inline-flex items-center gap-1.5 hover:text-brand-orange transition-colors"
            disabled={!team}
            title={team ? "Renomear time" : undefined}
          >
            {team ? customName ?? `TIME ${team.number}` : "LADO VAZIO"}
            {team && <Pencil className="h-3.5 w-3.5 text-brand-muted" />}
          </button>
          {team && team.wins > 0 && (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-condensed font-black px-2 py-0.5 uppercase tracking-widest">
              {team.wins}ª VIT.
            </span>
          )}
        </div>
        {team && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-none border-brand-border-strong bg-brand-subtle hover:bg-brand-border text-brand-dark font-condensed font-black uppercase text-xs"
              onClick={() => removeCourtTeam(side)}
              title="Tirar da quadra e devolver para a fila"
            >
              ↩ Fila
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-none text-red-600 hover:bg-red-50 h-8 w-8"
              onClick={() => {
                if (confirm(`Excluir TIME ${team.number} e seus jogadores?`))
                  removeCourtTeam(side, { deletePlayers: true });
              }}
              title="Excluir time e jogadores"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-wrap gap-1.5 content-start py-1">
        {team?.memberIds.map((pid) => {
          const p = players[pid];
          if (!p) return null;
          return (
            <PlayerPill
              key={pid}
              playerId={pid}
              name={p.name}
              justPlayed={p.justPlayed}
              role={p.role}
            />
          );
        })}
        {!team && (
          <p className="text-xs font-condensed uppercase text-brand-muted self-center mx-auto tracking-wider">
            Envie um time da fila para o Lado {side} →
          </p>
        )}
      </div>

      <Button
        size="lg"
        className={cn(
          "rounded-none h-11 font-condensed font-black uppercase tracking-widest text-sm text-white transition-colors shadow-xs",
          side === "A"
            ? "bg-brand-orange hover:bg-brand-orange-hover"
            : "bg-brand-dark hover:bg-black",
        )}
        disabled={!canDeclare}
        onClick={onWin}
      >
        <Trophy className="h-4 w-4" /> TIME {side} VENCEU
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PLAYER PILL — selectable + draggable + action menu
// ---------------------------------------------------------------------------
function PlayerPill({
  playerId,
  name,
  justPlayed,
  role,
}: {
  playerId: ID;
  name: string;
  justPlayed: boolean;
  role?: "aluno" | "convencional";
}) {
  const selection = usePelada((s) => s.selection);
  const toggleSelect = usePelada((s) => s.toggleSelect);
  const removePlayer = usePelada((s) => s.removePlayer);
  const detachPlayerToQueue = usePelada((s) => s.detachPlayerToQueue);
  const selected = selection.includes(playerId);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `player:${playerId}`,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `player:${playerId}`,
  });

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        setDropRef(el);
      }}
      style={{ transform: CSS.Translate.toString(transform), touchAction: "manipulation" }}
      className={cn(
        "group relative border flex items-stretch min-h-[40px] transition-all",
        selected
          ? "border-brand-orange bg-brand-orange text-white shadow-sm"
          : justPlayed
            ? "border-red-300 bg-red-50 text-red-900"
            : "border-brand-border-strong bg-brand-subtle text-brand-dark hover:border-brand-orange",
        isOver && !isDragging && "ring-2 ring-brand-orange ring-offset-1 ring-offset-white",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        onClick={() => toggleSelect(playerId)}
        className="flex-1 flex items-center gap-1.5 px-2.5 py-1 font-condensed text-sm font-black uppercase tracking-wide text-left"
      >
        {justPlayed && <Ban className="h-3.5 w-3.5 text-red-600 shrink-0" />}
        <span className="truncate max-w-[115px]">{name}</span>
        {role === "aluno" && (
          <span
            className={cn(
              "text-[9px] px-1 font-black shrink-0",
              selected ? "bg-white text-brand-orange" : "bg-brand-orange text-white",
            )}
          >
            ALUNO
          </span>
        )}
      </button>
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="px-1 flex items-center border-l border-current/15 opacity-50 hover:opacity-100 cursor-grab touch-none"
        title="Arrastar"
        aria-label="Arrastar jogador"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="px-1.5 flex items-center border-l border-current/15 opacity-60 hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
            aria-label="Ações"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-none border border-brand-border bg-white font-condensed uppercase"
        >
          <DropdownMenuItem
            className="font-bold text-xs uppercase cursor-pointer"
            onSelect={() => {
              renameBus.emit(playerId);
            }}
          >
            <Pencil className="h-4 w-4 mr-2 text-brand-orange" /> Renomear
          </DropdownMenuItem>
          <DropdownMenuItem
            className="font-bold text-xs uppercase cursor-pointer"
            onSelect={() => detachPlayerToQueue(playerId)}
          >
            <Users className="h-4 w-4 mr-2 text-brand-dark" /> Desagrupar (para fila)
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 font-bold text-xs uppercase cursor-pointer"
            onSelect={() => {
              if (confirm(`Remover ${name}?`)) removePlayer(playerId);
            }}
          >
            <X className="h-4 w-4 mr-2" /> Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// tiny event bus for rename
const renameBus = (() => {
  const listeners = new Set<(id: ID) => void>();
  return {
    emit: (id: ID) => listeners.forEach((l) => l(id)),
    on: (l: (id: ID) => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
})();

function RenameDialogController() {
  const [id, setId] = useState<ID | null>(null);
  const [value, setValue] = useState("");
  const renamePlayer = usePelada((s) => s.renamePlayer);
  useEffect(() => {
    const off = renameBus.on((pid) => {
      setId(pid);
      setValue(usePelada.getState().players[pid]?.name ?? "");
    });
    return () => {
      off();
    };
  }, []);
  const open = !!id;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && setId(null)}>
      <DialogContent className="rounded-none border border-brand-border bg-white">
        <DialogHeader>
          <DialogTitle className="font-bebas text-3xl tracking-wide text-brand-dark uppercase">
            Renomear jogador
          </DialogTitle>
          <DialogDescription className="font-condensed text-xs uppercase text-brand-muted">
            Altere o nome exibido no totem.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-12 rounded-none bg-brand-subtle border-brand-border-strong font-condensed font-bold uppercase text-base"
        />
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setId(null)}
            className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (id && value.trim()) {
                renamePlayer(id, value);
                setId(null);
              }
            }}
            className="rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// QUEUE BLOCK
// ---------------------------------------------------------------------------
function QueueBlock() {
  const queue = usePelada((s) => s.queue);
  const waitingChampion = usePelada((s) => s.waitingChampion);
  const teams = usePelada((s) => s.teams);
  const players = usePelada((s) => s.players);
  const selection = usePelada((s) => s.selection);
  const formTeam = usePelada((s) => s.formTeamFromSelection);
  const clearSelection = usePelada((s) => s.clearSelection);
  const addPlayer = usePelada((s) => s.addPlayer);
  const sendToCourtSide = usePelada((s) => s.sendToCourtSide);
  const sendPlayerToCourtSide = usePelada((s) => s.sendPlayerToCourtSide);
  const moveSelectionInQueue = usePelada((s) => s.moveSelectionInQueue);

  const removeFromQueue = usePelada((s) => s.removeFromQueue);
  const pasteInto = usePelada((s) => s.pasteSelectionIntoTeam);
  const court = usePelada((s) => s.court);
  const gameFormat = usePelada((s) => s.gameFormat ?? "3x3");
  const maxTeamSize = getMaxTeamSize(gameFormat);

  const [name, setName] = useState("");
  const [cooldownConfirm, setCooldownConfirm] = useState<
    { entry: QueueEntry; side: "A" | "B" } | null
  >(null);

  const slotAOpen = !court.teamAId;
  const slotBOpen = !court.teamBId;

  const queueIds = useMemo(() => queue.map((e) => `qentry:${e.kind}:${e.id}`), [queue]);

  const { setNodeRef: setQueueDropRef } = useDroppable({ id: "queue-drop" });

  function trySend(entry: QueueEntry, side: "A" | "B") {
    const memberIds = entry.kind === "player" ? [entry.id] : teams[entry.id]?.memberIds ?? [];
    const blocked = memberIds.some((m) => players[m]?.justPlayed);
    if (blocked) {
      setCooldownConfirm({ entry, side });
      return;
    }
    sendToCourtSide(entry, side);
  }

  const selectedNames = selection.map((id) => players[id]?.name).filter(Boolean).join(", ");

  return (
    <section className="border border-brand-border bg-white p-3.5 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
      <div className="border-b border-brand-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[10px] sm:text-xs font-condensed font-black text-brand-orange uppercase tracking-widest block">
            QUADRA & RACHAS
          </span>
          <h2 className="font-bebas text-2xl sm:text-4xl text-brand-dark tracking-wide leading-none">
            FILA DE ESPERA DA QUADRA{" "}
            <span className="text-brand-orange">({queue.length})</span>
          </h2>
          <p className="text-[11px] sm:text-xs font-condensed text-brand-muted uppercase mt-0.5">
            Jogadores que entram pelo celular aparecem automaticamente aqui na fila
          </p>
        </div>
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            addPlayer(name);
            setName("");
          }
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="NOME DO JOGADOR PARA ENTRAR NA FILA..."
          className="h-11 sm:h-12 rounded-none bg-brand-subtle border-brand-border-strong font-condensed font-bold uppercase text-xs sm:text-sm text-brand-dark placeholder:text-brand-muted focus-visible:ring-0 focus-visible:border-brand-orange"
        />
        <Button
          size="lg"
          type="submit"
          className="shrink-0 h-11 sm:h-12 rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs tracking-wider px-3.5 sm:px-6 shadow-sm"
        >
          <Plus className="h-4 w-4" /> ADICIONAR
        </Button>
      </form>

      {selection.length > 0 && (
        <div className="sticky top-16 z-20 border-2 border-brand-orange bg-white px-4 py-3 shadow-md space-y-2">
          <div className="text-xs font-condensed uppercase text-brand-muted truncate">
            <span className="font-black text-brand-orange">
              {selection.length} SELECIONADO(S) (LIMITE {gameFormat.toUpperCase()}: MÁX {maxTeamSize}/TIME):
            </span>{" "}
            <span className="font-bold text-brand-dark">{selectedNames}</span>
          </div>
          {selection.length > maxTeamSize && (
            <p className="text-xs font-condensed font-black uppercase text-red-600">
              ⚠️ Limite da modalidade {gameFormat}: selecione no máximo {maxTeamSize} jogadores para formar um time.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={formTeam}
              disabled={selection.length < 2 || selection.length > maxTeamSize}
              className="rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs"
            >
              <Users className="h-3.5 w-3.5" /> Formar Time ({Math.min(selection.length, maxTeamSize)}/{maxTeamSize})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => moveSelectionInQueue(-1)}
              title="Subir na fila"
              className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
            >
              <ChevronUp className="h-3.5 w-3.5" /> Subir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => moveSelectionInQueue(1)}
              title="Descer na fila"
              className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
            >
              <ChevronDown className="h-3.5 w-3.5" /> Descer
            </Button>
            {selection.length === 1 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => renameBus.emit(selection[0])}
                  className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" /> Renomear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!slotAOpen}
                  onClick={() => sendPlayerToCourtSide(selection[0], "A")}
                  className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
                >
                  → A
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!slotBOpen}
                  onClick={() => sendPlayerToCourtSide(selection[0], "B")}
                  className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
                >
                  → B
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
            >
              Limpar
            </Button>
          </div>
        </div>
      )}

      {waitingChampion && teams[waitingChampion] && (
        <QueueRow
          kind="champion"
          entry={{ kind: "team", id: waitingChampion }}
          team={teams[waitingChampion]}
          players={players}
          onSendSide={(side) => trySend({ kind: "team", id: waitingChampion }, side)}
          slotAOpen={slotAOpen}
          slotBOpen={slotBOpen}
          onRemoveEntry={removeFromQueue}
          onPasteInto={pasteInto}
          selectionCount={selection.length}
        />
      )}

      <div ref={setQueueDropRef} className="space-y-3 min-h-[40px]">
        <SortableContext items={queueIds} strategy={verticalListSortingStrategy}>
          {queue.length === 0 && !waitingChampion && (
            <div className="border border-dashed border-brand-border-strong bg-brand-subtle/40 py-8 text-center">
              <p className="text-xs font-condensed font-bold text-brand-muted uppercase tracking-wider">
                Nenhum jogador na fila ainda. Adicione jogadores acima ou pelo celular.
              </p>
            </div>
          )}
          {queue.map((entry, i) =>
            entry.kind === "team" ? (
              <SortableQueueRow
                key={`t-${entry.id}`}
                kind="team"
                id={`qentry:team:${entry.id}`}
                position={i + 1}
                entry={entry}
                team={teams[entry.id]}
                players={players}
                onSendSide={(side) => trySend(entry, side)}
                slotAOpen={slotAOpen}
                slotBOpen={slotBOpen}
                onRemoveEntry={removeFromQueue}
                onPasteInto={pasteInto}
                selectionCount={selection.length}
              />
            ) : (
              <SortableQueueRow
                key={`p-${entry.id}`}
                kind="player"
                id={`qentry:player:${entry.id}`}
                position={i + 1}
                entry={entry}
                player={players[entry.id]}
                players={players}
                onSendSide={(side) => trySend(entry, side)}
                slotAOpen={slotAOpen}
                slotBOpen={slotBOpen}
                onRemoveEntry={removeFromQueue}
                onPasteInto={pasteInto}
                selectionCount={selection.length}
              />
            ),
          )}
        </SortableContext>
      </div>

      <CooldownDialog
        entry={cooldownConfirm?.entry ?? null}
        onCancel={() => setCooldownConfirm(null)}
        onConfirm={() => {
          if (cooldownConfirm)
            sendToCourtSide(cooldownConfirm.entry, cooldownConfirm.side, { forceCooldown: true });
          setCooldownConfirm(null);
        }}
        teams={teams}
        players={players}
      />
    </section>
  );
}

interface QueueRowBaseProps {
  kind: "champion" | "team" | "player";
  position?: number;
  entry: QueueEntry;
  team?: ReturnType<typeof usePelada.getState>["teams"][string];
  player?: ReturnType<typeof usePelada.getState>["players"][string];
  players: ReturnType<typeof usePelada.getState>["players"];
  onSendSide: (side: "A" | "B") => void;
  slotAOpen: boolean;
  slotBOpen: boolean;
  onRemoveEntry: (entry: QueueEntry) => void;
  onPasteInto: (teamId: ID) => void;
  selectionCount: number;
}

function SortableQueueRow(props: QueueRowBaseProps & { id: string }) {
  const { id, ...rest } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <QueueRow {...rest} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function QueueRow(
  props: QueueRowBaseProps & {
    dragHandleProps?: Record<string, unknown>;
  },
) {
  const {
    kind,
    position,
    entry,
    team,
    player,
    players,
    onSendSide,
    slotAOpen,
    slotBOpen,
    onRemoveEntry,
    onPasteInto,
    selectionCount,
    dragHandleProps,
  } = props;
  const isChampion = kind === "champion";
  const hasAny = slotAOpen || slotBOpen;
  const customName = usePelada((s) => (team ? s.teamNames[team.id] : undefined));
  const gameFormat = usePelada((s) => s.gameFormat ?? "3x3");
  const maxTeamSize = getMaxTeamSize(gameFormat);

  const moveQueueEntry = usePelada((s) => s.moveQueueEntry);
  const selection = usePelada((s) => s.selection);
  const rowMemberIds = team ? team.memberIds : player ? [player.id] : [];
  const rowSelected = rowMemberIds.some((m) => selection.includes(m));
  const dropId = team ? `team:${team.id}` : `qentry-drop:${entry.kind}:${entry.id}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropId });

  return (
    <div
      ref={setDropRef}
      className={cn(
        "border p-3.5 space-y-3 transition-colors",
        isChampion
          ? "border-2 border-brand-orange bg-brand-orange/5"
          : "border-brand-border bg-white shadow-2xs",
        isOver && "ring-2 ring-brand-orange",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          {...dragHandleProps}
          className="p-1 text-brand-muted hover:text-brand-orange cursor-grab touch-none"
          title="Arrastar posição"
          aria-label="Arrastar"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {isChampion ? (
          <span className="inline-flex items-center gap-1 bg-brand-orange text-white font-condensed font-black text-xs uppercase px-2 py-0.5">
            <Crown className="h-3.5 w-3.5" /> CAMPEÃO EM ESPERA
          </span>
        ) : (
          <span className="font-condensed font-black text-xs text-brand-muted bg-brand-subtle border border-brand-border px-2 py-0.5">
            #{position}
          </span>
        )}
        {team && (
          <button
            type="button"
            onClick={() => teamRenameBus.emit(team.id)}
            className="inline-flex items-center"
            title="Renomear time"
          >
            <span className="bg-brand-orange/10 text-brand-orange border border-brand-orange/30 font-condensed font-black text-xs uppercase px-2.5 py-0.5 tracking-wider inline-flex items-center gap-1 hover:bg-brand-orange/20 transition-colors">
              {customName ?? `TIME ${team.number}`} ({team.memberIds.length}/{maxTeamSize})
              <Pencil className="h-3 w-3 opacity-60" />
            </span>
          </button>
        )}
        <div className="flex-1" />
        {!isChampion && rowSelected && (
          <>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-none border-brand-border-strong"
              onClick={() => moveQueueEntry(entry, -1)}
              title="Subir na fila"
              aria-label="Subir na fila"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-none border-brand-border-strong"
              onClick={() => moveQueueEntry(entry, 1)}
              title="Descer na fila"
              aria-label="Descer na fila"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </>
        )}
        {!isChampion && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-none text-brand-muted hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              const label = team ? `TIME ${team.number}` : player?.name ?? "esta entrada";
              if (confirm(`Remover ${label} da fila?`)) onRemoveEntry(entry);
            }}
            title="Remover"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(team ? team.memberIds : player ? [player.id] : []).map((pid) => {
          const p = players[pid];
          if (!p) return null;
          return (
            <PlayerPill
              key={pid}
              playerId={pid}
              name={p.name}
              justPlayed={p.justPlayed}
              role={p.role}
            />
          );
        })}
        {team && selectionCount > 0 && team.memberIds.length < maxTeamSize && (
          <button
            className="border-2 border-dashed border-brand-orange px-2.5 py-1.5 font-condensed text-xs font-black uppercase text-brand-orange hover:bg-brand-orange/5"
            onClick={() => onPasteInto(team.id)}
          >
            <Plus className="inline h-3 w-3" /> colar {Math.min(selectionCount, maxTeamSize - team.memberIds.length)} aqui
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="lg"
          className="flex-1 h-10 rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase tracking-widest text-xs"
          disabled={!slotAOpen}
          onClick={() => onSendSide("A")}
        >
          → ENVIAR LADO A
        </Button>
        <Button
          size="lg"
          className="flex-1 h-10 rounded-none bg-brand-dark hover:bg-black text-white font-condensed font-black uppercase tracking-widest text-xs"
          disabled={!slotBOpen}
          onClick={() => onSendSide("B")}
        >
          → ENVIAR LADO B
        </Button>
        {!hasAny && (
          <span className="text-[11px] font-condensed font-bold uppercase text-brand-muted px-2">
            QUADRA CHEIA
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LOCK OVERLAY
// ---------------------------------------------------------------------------
function LockOverlay() {
  const unlock = usePelada((s) => s.unlockScreen);
  const adminPin = usePelada((s) => s.adminPin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function trySubmit() {
    if (unlock(pin)) {
      setPin("");
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm border-2 border-brand-orange bg-white p-6 space-y-4 text-brand-dark text-center shadow-xl">
        <div className="w-12 h-12 bg-brand-orange flex items-center justify-center font-black text-white font-condensed text-2xl mx-auto shadow-sm">
          HF
        </div>
        <Lock className="h-8 w-8 mx-auto text-brand-orange" />
        <h2 className="font-bebas text-4xl tracking-wide uppercase leading-none">
          TELA BLOQUEADA
        </h2>
        <p className="text-xs font-condensed uppercase text-brand-muted">
          {adminPin
            ? "Digite o PIN do treinador para desbloquear o totem."
            : "Nenhum PIN definido — toque em desbloquear."}
        </p>
        <Input
          autoFocus
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") trySubmit();
          }}
          placeholder="••••"
          className="text-center text-3xl tracking-[0.6em] h-16 rounded-none bg-brand-subtle border-brand-border-strong font-bebas text-brand-dark"
        />
        {error && (
          <p className="text-red-600 font-condensed font-black uppercase text-xs">
            PIN incorreto
          </p>
        )}
        <Button
          size="lg"
          className="w-full h-12 rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase tracking-widest text-sm"
          onClick={trySubmit}
        >
          <Unlock className="h-4 w-4" /> Desbloquear
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cooldown dialog
// ---------------------------------------------------------------------------
function CooldownDialog({
  entry,
  onCancel,
  onConfirm,
  teams,
  players,
}: {
  entry: QueueEntry | null;
  onCancel: () => void;
  onConfirm: () => void;
  teams: ReturnType<typeof usePelada.getState>["teams"];
  players: ReturnType<typeof usePelada.getState>["players"];
}) {
  const memberIds = !entry
    ? []
    : entry.kind === "player"
      ? [entry.id]
      : teams[entry.id]?.memberIds ?? [];
  const blocked = memberIds.filter((m) => players[m]?.justPlayed).map((m) => players[m]?.name);

  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="rounded-none border border-brand-border bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bebas text-3xl tracking-wide text-brand-dark uppercase">
            <Ban className="h-6 w-6 text-red-600" /> Acabou de jogar
          </DialogTitle>
          <DialogDescription className="font-condensed text-xs uppercase text-brand-muted">
            {blocked.join(", ")} acabou de jogar. A regra é aguardar uma partida. Confirmar mesmo
            assim?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
          >
            Cancelar
          </Button>
          <Button
            className="rounded-none bg-red-600 hover:bg-red-700 text-white font-condensed font-black uppercase text-xs"
            onClick={onConfirm}
          >
            Liberar assim mesmo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Admin dialog
// ---------------------------------------------------------------------------
function AdminDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const adminPin = usePelada((s) => s.adminPin);
  const setAdminPin = usePelada((s) => s.setAdminPin);
  const adminResetSuddenDeath = usePelada((s) => s.adminResetSuddenDeath);
  const resetNight = usePelada((s) => s.resetNight);
  const court = usePelada((s) => s.court);
  const matchMs = usePelada((s) => s.matchMs);
  const suddenDeathMs = usePelada((s) => s.suddenDeathMs);
  const setMatchDuration = usePelada((s) => s.setMatchDuration);
  const setSuddenDeathDuration = usePelada((s) => s.setSuddenDeathDuration);
  const championRuleEnabled = usePelada((s) => s.championRuleEnabled);
  const setChampionRule = usePelada((s) => s.setChampionRule);
  const winsToRotate = usePelada((s) => s.winsToRotate);
  const setWinsToRotate = usePelada((s) => s.setWinsToRotate);
  const autoReduceEnabled = usePelada((s) => s.autoReduceEnabled);
  const autoReduceThreshold = usePelada((s) => s.autoReduceThreshold);
  const autoReduceMs = usePelada((s) => s.autoReduceMs);
  const setAutoReduce = usePelada((s) => s.setAutoReduce);
  const gameFormat = usePelada((s) => s.gameFormat ?? "3x3");
  const setGameFormat = usePelada((s) => s.setGameFormat);

  const [matchMin, setMatchMin] = useState(String(matchMs / 60000));
  const [sdMin, setSdMin] = useState(String(suddenDeathMs / 60000));
  const [winsInput, setWinsInput] = useState(String(winsToRotate));
  const [thresholdInput, setThresholdInput] = useState(String(autoReduceThreshold));
  const [autoMinInput, setAutoMinInput] = useState(String(autoReduceMs / 60000));
  useEffect(() => {
    setMatchMin(String(matchMs / 60000));
    setSdMin(String(suddenDeathMs / 60000));
    setWinsInput(String(winsToRotate));
    setThresholdInput(String(autoReduceThreshold));
    setAutoMinInput(String(autoReduceMs / 60000));
  }, [matchMs, suddenDeathMs, winsToRotate, autoReduceThreshold, autoReduceMs]);

  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!open) {
      setPin("");
      setAuthed(false);
    }
  }, [open]);

  const needsPin = adminPin && !authed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border border-brand-border bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-bebas text-3xl tracking-wide text-brand-dark uppercase">
            PAINEL DO TREINADOR // CONFIGURAÇÕES
          </DialogTitle>
          <DialogDescription className="font-condensed text-xs uppercase text-brand-muted">
            {needsPin ? "Digite o PIN de 4 dígitos." : "Ações administrativas da pelada."}
          </DialogDescription>
        </DialogHeader>

        {needsPin ? (
          <div className="space-y-3">
            <Input
              autoFocus
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="PIN"
              className="text-center text-2xl tracking-[0.5em] h-14 rounded-none bg-brand-subtle border-brand-border-strong font-bebas"
            />
            <Button
              className="w-full rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs h-11"
              onClick={() => setAuthed(pin === adminPin)}
              disabled={pin.length !== 4}
            >
              Entrar
            </Button>
          </div>
        ) : (
          <div className="space-y-4 font-condensed uppercase">
            <div className="space-y-2 border border-brand-border bg-brand-subtle/50 p-3">
              <p className="text-xs font-black text-brand-dark">
                Modalidade & Limitador de Jogadores por Time
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["3x3", "5x5"] as const).map((fmt) => (
                  <Button
                    key={fmt}
                    type="button"
                    variant={gameFormat === fmt ? "default" : "outline"}
                    onClick={() => setGameFormat(fmt)}
                    className={cn(
                      "rounded-none font-condensed font-black uppercase text-xs",
                      gameFormat === fmt
                        ? "bg-brand-orange hover:bg-brand-orange-hover text-white"
                        : "border-brand-border-strong bg-white text-brand-dark",
                    )}
                  >
                    Pelada {fmt} · Máx {fmt === "5x5" ? 5 : 3}/time
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-brand-muted">
                Limita os times no Court Master e os grupos formados pelos jogadores na fila a {gameFormat === "5x5" ? 5 : 3} jogadores por time.
              </p>
            </div>

            <div className="space-y-2 border border-brand-border bg-brand-subtle/50 p-3">
              <p className="text-xs font-black text-brand-dark">PIN de administrador / bloqueio</p>
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder={adminPin ? "•".repeat(adminPin.length) : "Ex: 1234"}
                  className="rounded-none bg-white border-brand-border-strong"
                />
                <Button
                  onClick={() => {
                    setAdminPin(pin);
                    setPin("");
                  }}
                  disabled={pin.length !== 4}
                  className="rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs"
                >
                  Salvar
                </Button>
              </div>
              <p className="text-[11px] text-brand-muted">
                O mesmo PIN é usado para entrar no Admin e para desbloquear a tela.
              </p>
            </div>

            <div className="space-y-2 border border-brand-border bg-brand-subtle/50 p-3">
              <p className="text-xs font-black text-brand-dark">Tempos de partida (minutos)</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-brand-muted font-bold space-y-1 block">
                  Partida
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0.5}
                    max={30}
                    step={0.5}
                    value={matchMin}
                    onChange={(e) => setMatchMin(e.target.value)}
                    onBlur={() => {
                      const v = Number(matchMin);
                      if (Number.isFinite(v) && v > 0) setMatchDuration(v * 60000);
                    }}
                    className="h-10 rounded-none bg-white border-brand-border-strong font-black text-brand-dark"
                  />
                </label>
                <label className="text-xs text-brand-muted font-bold space-y-1 block">
                  Morte súbita
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0.25}
                    max={10}
                    step={0.25}
                    value={sdMin}
                    onChange={(e) => setSdMin(e.target.value)}
                    onBlur={() => {
                      const v = Number(sdMin);
                      if (Number.isFinite(v) && v > 0) setSuddenDeathDuration(v * 60000);
                    }}
                    className="h-10 rounded-none bg-white border-brand-border-strong font-black text-brand-dark"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2 border border-brand-border bg-brand-subtle/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-brand-dark">
                    Regra "ganhou {winsToRotate} e sai" 👑
                  </p>
                  <p className="text-[11px] text-brand-muted">
                    {championRuleEnabled
                      ? "Ativa: o time sai da quadra e vira campeão em espera."
                      : "Desativada: o time fica na quadra enquanto vencer."}
                  </p>
                </div>
                <Button
                  variant={championRuleEnabled ? "default" : "outline"}
                  onClick={() => setChampionRule(!championRuleEnabled)}
                  className={cn(
                    "rounded-none font-condensed font-black uppercase text-xs",
                    championRuleEnabled
                      ? "bg-brand-orange hover:bg-brand-orange-hover text-white"
                      : "border-brand-border-strong bg-white text-brand-dark",
                  )}
                >
                  {championRuleEnabled ? "Desativar" : "Ativar"}
                </Button>
              </div>
              <label className="text-xs text-brand-muted font-bold space-y-1 block">
                Vitórias seguidas para sair
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  step={1}
                  disabled={!championRuleEnabled}
                  value={winsInput}
                  onChange={(e) => setWinsInput(e.target.value)}
                  onBlur={() => {
                    const v = Number(winsInput);
                    if (Number.isFinite(v) && v >= 1) setWinsToRotate(v);
                  }}
                  className="h-10 rounded-none bg-white border-brand-border-strong font-black text-brand-dark"
                />
              </label>
            </div>

            <div className="space-y-2 border border-brand-border bg-brand-subtle/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-brand-dark">
                    Tempo reduzido automático ⏱️
                  </p>
                  <p className="text-[11px] text-brand-muted">
                    {autoReduceEnabled
                      ? `Com ${autoReduceThreshold}+ jogadores, a partida passa a ${autoReduceMs / 60000} min.`
                      : "Desativado: a partida usa sempre o tempo padrão."}
                  </p>
                </div>
                <Button
                  variant={autoReduceEnabled ? "default" : "outline"}
                  onClick={() => setAutoReduce({ enabled: !autoReduceEnabled })}
                  className={cn(
                    "rounded-none font-condensed font-black uppercase text-xs",
                    autoReduceEnabled
                      ? "bg-brand-orange hover:bg-brand-orange-hover text-white"
                      : "border-brand-border-strong bg-white text-brand-dark",
                  )}
                >
                  {autoReduceEnabled ? "Desativar" : "Ativar"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-brand-muted font-bold space-y-1 block">
                  A partir de (jogadores)
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={2}
                    max={200}
                    step={1}
                    disabled={!autoReduceEnabled}
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    onBlur={() => {
                      const v = Number(thresholdInput);
                      if (Number.isFinite(v) && v >= 2) setAutoReduce({ threshold: v });
                    }}
                    className="h-10 rounded-none bg-white border-brand-border-strong font-black text-brand-dark"
                  />
                </label>
                <label className="text-xs text-brand-muted font-bold space-y-1 block">
                  Tempo reduzido (min)
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0.5}
                    max={30}
                    step={0.5}
                    disabled={!autoReduceEnabled}
                    value={autoMinInput}
                    onChange={(e) => setAutoMinInput(e.target.value)}
                    onBlur={() => {
                      const v = Number(autoMinInput);
                      if (Number.isFinite(v) && v > 0) setAutoReduce({ ms: v * 60000 });
                    }}
                    className="h-10 rounded-none bg-white border-brand-border-strong font-black text-brand-dark"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-brand-dark">Ações rápidas</p>
              <Button
                variant="outline"
                className="w-full justify-start rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
                disabled={!court.suddenDeathUsed}
                onClick={adminResetSuddenDeath}
              >
                <TimerIcon className="h-4 w-4 text-brand-orange" /> Reabrir botão +1 min (morte
                súbita)
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start rounded-none bg-red-600 hover:bg-red-700 text-white font-condensed font-black uppercase text-xs"
                onClick={() => {
                  if (confirm("Zerar toda a pelada? Isso apaga jogadores, times e fila.")) {
                    resetNight();
                    onOpenChange(false);
                  }
                }}
              >
                <X className="h-4 w-4" /> Resetar a noite inteira
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

void MATCH_MS;

// ---------------------------------------------------------------------------
// Team rename event bus + dialog
// ---------------------------------------------------------------------------
const teamRenameBus = (() => {
  const listeners = new Set<(id: ID) => void>();
  return {
    emit: (id: ID) => listeners.forEach((l) => l(id)),
    on: (l: (id: ID) => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
})();

function TeamRenameDialogController() {
  const [id, setId] = useState<ID | null>(null);
  const [value, setValue] = useState("");
  const teams = usePelada((s) => s.teams);
  const teamNames = usePelada((s) => s.teamNames);
  const renameTeam = usePelada((s) => s.renameTeam);
  useEffect(() => {
    const off = teamRenameBus.on((tid) => {
      setId(tid);
      setValue(usePelada.getState().teamNames[tid] ?? "");
    });
    return () => {
      off();
    };
  }, []);
  const open = !!id;
  const team = id ? teams[id] : null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && setId(null)}>
      <DialogContent className="rounded-none border border-brand-border bg-white">
        <DialogHeader>
          <DialogTitle className="font-bebas text-3xl tracking-wide text-brand-dark uppercase">
            Renomear time
          </DialogTitle>
          <DialogDescription className="font-condensed text-xs uppercase text-brand-muted">
            {team
              ? `Time ${team.number} — apelido opcional (deixe vazio para usar só o número).`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={team ? `TIME ${team.number}` : ""}
          className="h-12 rounded-none bg-brand-subtle border-brand-border-strong font-condensed font-bold uppercase text-base"
        />
        <DialogFooter className="gap-2">
          {id && teamNames[id] && (
            <Button
              variant="outline"
              onClick={() => {
                if (id) renameTeam(id, "");
                setId(null);
              }}
              className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
            >
              Remover apelido
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setId(null)}
            className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (id) renameTeam(id, value);
              setId(null);
            }}
            className="rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// History dialog (stats + action log)
// ---------------------------------------------------------------------------
const historyBus = (() => {
  const listeners = new Set<() => void>();
  return {
    open: () => listeners.forEach((l) => l()),
    on: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
})();

function HistoryDialogController() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"stats" | "log">("stats");
  const teamStats = usePelada((s) => s.teamStats);
  const actionLog = usePelada((s) => s.actionLog);
  const clearActionLog = usePelada((s) => s.clearActionLog);
  const clearStats = usePelada((s) => s.clearStats);

  useEffect(() => {
    const off = historyBus.on(() => setOpen(true));
    return () => {
      off();
    };
  }, []);

  const rows = Object.values(teamStats).sort((a, b) => {
    const sa = a.wins * 3 + a.draws;
    const sb = b.wins * 3 + b.draws;
    if (sa !== sb) return sb - sa;
    return a.number - b.number;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg rounded-none border border-brand-border bg-white">
        <DialogHeader>
          <DialogTitle className="font-bebas text-3xl tracking-wide text-brand-dark uppercase">
            Histórico da noite
          </DialogTitle>
          <DialogDescription className="font-condensed text-xs uppercase text-brand-muted">
            Estatísticas dos times e registro de ações.
          </DialogDescription>
        </DialogHeader>
        <div className="flex border-b border-brand-border text-xs font-condensed font-black uppercase">
          {(["stats", "log"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 border-b-2 transition-colors",
                tab === t
                  ? "border-brand-orange text-brand-dark"
                  : "border-transparent text-brand-muted",
              )}
            >
              {t === "stats" ? "1. ESTATÍSTICAS" : "2. REGISTRO DE AÇÕES"}
            </button>
          ))}
        </div>
        {tab === "stats" ? (
          <div className="max-h-[50vh] overflow-auto space-y-2">
            {rows.length === 0 && (
              <p className="text-xs font-condensed uppercase text-brand-muted py-6 text-center">
                Nenhum jogo registrado ainda.
              </p>
            )}
            {rows.map((r) => (
              <div
                key={r.teamId}
                className="flex items-center gap-3 border border-brand-border bg-brand-subtle p-2.5"
              >
                <span className="font-bebas text-2xl text-brand-orange w-12 shrink-0 leading-none">
                  T{r.number}
                </span>
                <div className="flex-1 min-w-0 font-condensed uppercase">
                  {r.customName && (
                    <div className="text-sm font-black text-brand-dark truncate">
                      {r.customName}
                    </div>
                  )}
                  <div className="text-xs text-brand-muted font-bold truncate">
                    {r.memberSnapshot.join(" · ")}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-condensed font-black uppercase">
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5">
                    {r.wins}V
                  </span>
                  <span className="bg-white border border-brand-border-strong text-brand-dark px-2 py-0.5">
                    {r.draws}E
                  </span>
                  <span className="bg-red-100 text-red-700 border border-red-300 px-2 py-0.5">
                    {r.losses}D
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-auto space-y-1 font-condensed uppercase">
            {actionLog.length === 0 && (
              <p className="text-xs text-brand-muted py-6 text-center">
                Nenhuma ação registrada ainda.
              </p>
            )}
            {actionLog.map((e) => (
              <div
                key={e.ts}
                className="text-xs flex gap-2 py-1.5 border-b border-brand-border"
              >
                <span className="text-brand-muted font-bold tabular-nums shrink-0">
                  {new Date(e.ts).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-bold text-brand-dark truncate">{e.msg}</span>
              </div>
            ))}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (tab === "stats" ? clearStats() : clearActionLog())}
            className="rounded-none border-brand-border-strong font-condensed font-black uppercase text-xs"
          >
            Limpar {tab === "stats" ? "estatísticas" : "registro"}
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="rounded-none bg-brand-orange hover:bg-brand-orange-hover text-white font-condensed font-black uppercase text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
