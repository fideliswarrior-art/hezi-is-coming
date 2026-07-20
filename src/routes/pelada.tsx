import { createFileRoute } from "@tanstack/react-router";
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
  type QueueEntry,
  type ID,
  MATCH_MS,
} from "@/lib/pelada/store";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import heziLogo from "@/assets/hezi-logo.png.asset.json";

export const Route = createFileRoute("/pelada")({
  head: () => ({
    meta: [
      { title: "Pelada — Totem 3x3 | Hezi Fam" },
      {
        name: "description",
        content:
          "Totem oficial da Hezi Fam para gerenciar pelada 3x3: fila, times, cronômetro e Rei da Quadra.",
      },
      { property: "og:title", content: "Pelada — Totem Hezi Fam" },
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
function useTick(intervalMs = 250) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}

function playBeep() {
  try {
    const Ctx = (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
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
// Root page — DnD context wraps everything
// ---------------------------------------------------------------------------
function PeladaPage() {
  const reorderQueue = usePelada((s) => s.reorderQueue);
  const movePlayerToTeam = usePelada((s) => s.movePlayerToTeam);
  const detachPlayerToQueue = usePelada((s) => s.detachPlayerToQueue);
  const swapPlayers = usePelada((s) => s.swapPlayers);
  const queue = usePelada((s) => s.queue);
  const screenLocked = usePelada((s) => s.screenLocked);

  // Force dark theme on this route (persists across component tree incl. portals)
  useEffect(() => {
    const root = document.documentElement;
    const had = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      if (!had) root.classList.remove("dark");
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const aId = String(active.id);
    const oId = String(over.id);
    // Player dropped onto another player → swap
    if (aId.startsWith("player:") && oId.startsWith("player:")) {
      const pa = aId.slice("player:".length);
      const pb = oId.slice("player:".length);
      if (pa !== pb) swapPlayers(pa, pb);
      return;
    }
    // Queue entry sortable
    if (aId.startsWith("qentry:") && oId.startsWith("qentry:")) {
      const from = queue.findIndex((q) => `qentry:${q.kind}:${q.id}` === aId);
      const to = queue.findIndex((q) => `qentry:${q.kind}:${q.id}` === oId);
      if (from >= 0 && to >= 0) reorderQueue(from, to);
      return;
    }
    // Player dropped on a team
    if (aId.startsWith("player:") && oId.startsWith("team:")) {
      const pid = aId.slice("player:".length);
      const tid = oId.slice("team:".length);
      movePlayerToTeam(pid, tid);
      return;
    }
    // Player dropped on queue background → detach as lone entry at end
    if (aId.startsWith("player:") && oId === "queue-drop") {
      detachPlayerToQueue(aId.slice("player:".length));
    }
  }

  return (
    <div className="dark min-h-dvh bg-background text-foreground select-none">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="mx-auto max-w-[900px] px-3 py-3 sm:px-4 sm:py-4 space-y-4 pb-24">
          <Header />
          <CourtBlock />
          <QueueBlock />
        </div>
      </DndContext>
      {screenLocked && <LockOverlay />}
      <RenameDialogController />
      <TeamRenameDialogController />
      <HistoryDialogController />
    </div>
  );
}

// ---------------------------------------------------------------------------
// HEADER
// ---------------------------------------------------------------------------
function Header() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [lockPrompt, setLockPrompt] = useState(false);
  const adminPin = usePelada((s) => s.adminPin);
  const lockScreen = usePelada((s) => s.lockScreen);

  function onLock() {
    if (!adminPin) {
      setLockPrompt(true);
      return;
    }
    lockScreen();
  }

  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <img src={heziLogo.url} alt="Hezi Fam" className="h-10 w-10 shrink-0 object-contain invert-0 dark:invert" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-none tracking-wide truncate">
            PELADA <span className="text-primary">3x3</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Hezi Fam · Totem
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="outline" onClick={() => setAdminOpen(true)} title="Admin">
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onLock}
          title="Bloquear tela"
        >
          <Lock className="h-5 w-5" />
        </Button>
      </div>
      <AdminDialog open={adminOpen} onOpenChange={setAdminOpen} />
      <Dialog open={lockPrompt} onOpenChange={setLockPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Defina um PIN primeiro</DialogTitle>
            <DialogDescription>
              Para bloquear a tela é preciso configurar um PIN de 4 dígitos no menu Admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockPrompt(false)}>Fechar</Button>
            <Button
              onClick={() => {
                setLockPrompt(false);
                setAdminOpen(true);
              }}
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
  const teams = usePelada((s) => s.teams);
  const teamNames = usePelada((s) => s.teamNames);
  const players = usePelada((s) => s.players);
  const startTimer = usePelada((s) => s.startTimer);
  const pauseTimer = usePelada((s) => s.pauseTimer);
  const resetTimer = usePelada((s) => s.resetTimer);
  const useSuddenDeath = usePelada((s) => s.useSuddenDeath);
  const declareWinner = usePelada((s) => s.declareWinner);
  const declareDraw = usePelada((s) => s.declareDraw);

  const total = currentDurationMs({ court, matchMs, suddenDeathMs });
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
    <section className="rounded-2xl border-2 border-primary/40 bg-court text-court-foreground p-3 sm:p-4 shadow-lg space-y-3">
      <div className="text-center">
        {court.inSuddenDeath && (
          <Badge className="bg-cooldown text-cooldown-foreground font-display tracking-widest mb-1">
            MORTE SÚBITA
          </Badge>
        )}
        <div
          className={cn(
            "font-display text-6xl sm:text-7xl leading-none tabular-nums transition-colors",
            remaining < 30000 && "text-cooldown",
          )}
        >
          {timeStr}
        </div>
        <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden mt-2">
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${100 - pct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {court.runningSince ? (
            <Button size="lg" variant="secondary" onClick={pauseTimer}>
              <Pause /> Pausar
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-victory text-victory-foreground hover:bg-victory/90"
              onClick={startTimer}
              disabled={!canDeclare}
            >
              <Play /> Iniciar
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={useSuddenDeath}
            disabled={court.suddenDeathUsed || !canDeclare}
          >
            <TimerIcon /> +1 min
          </Button>
          <Button size="sm" variant="secondary" onClick={declareDraw} disabled={!canDeclare}>
            <Shuffle /> Empate
          </Button>
          <Button size="sm" variant="ghost" className="text-court-foreground/70" onClick={resetTimer}>
            Zerar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  const sideColor = side === "A" ? "bg-team-a" : "bg-team-b";
  const dropId = team ? `team:${team.id}` : `court-slot:${side}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl bg-background/95 text-foreground p-3 flex flex-col gap-2 min-h-[180px] transition-all",
        isOver && "ring-2 ring-primary scale-[1.01]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-white font-display text-lg shrink-0",
              sideColor,
            )}
          >
            {side}
          </span>
          <span className="font-display text-xl tracking-wide truncate">
            {team ? `TIME ${team.number}` : "Vazio"}
          </span>
          {team && team.wins > 0 && (
            <Badge variant="secondary" className="font-display text-xs">
              {team.wins}ª vit.
            </Badge>
          )}
        </div>
        {team && (
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 h-8 w-8"
            onClick={() => {
              if (confirm(`Remover TIME ${team.number} da quadra?`)) removeCourtTeam(side);
            }}
            title="Remover time"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 flex flex-wrap gap-1.5 content-start">
        {team?.memberIds.map((pid) => {
          const p = players[pid];
          if (!p) return null;
          return <PlayerPill key={pid} playerId={pid} name={p.name} justPlayed={p.justPlayed} />;
        })}
        {!team && (
          <p className="text-xs text-muted-foreground italic self-center mx-auto">
            Envie um time da fila →
          </p>
        )}
      </div>

      <Button
        size="lg"
        className="bg-victory text-victory-foreground hover:bg-victory/90 h-12 font-display tracking-wider"
        disabled={!canDeclare}
        onClick={onWin}
      >
        <Trophy /> TIME {side} VENCEU
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
}: {
  playerId: ID;
  name: string;
  justPlayed: boolean;
}) {
  const selection = usePelada((s) => s.selection);
  const toggleSelect = usePelada((s) => s.toggleSelect);
  const removePlayer = usePelada((s) => s.removePlayer);
  const detachPlayerToQueue = usePelada((s) => s.detachPlayerToQueue);
  const selected = selection.includes(playerId);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `player:${playerId}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), touchAction: "manipulation" }}
      className={cn(
        "group relative rounded-lg border-2 flex items-stretch min-h-[44px] transition-all",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : justPlayed
            ? "border-cooldown/50 bg-cooldown/10"
            : "border-border bg-secondary",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        onClick={() => toggleSelect(playerId)}
        className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-left"
      >
        {justPlayed && <Ban className="h-3.5 w-3.5 text-cooldown shrink-0" />}
        <span className="truncate max-w-[110px]">{name}</span>
      </button>
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="px-1 flex items-center border-l border-current/20 opacity-40 hover:opacity-100 cursor-grab touch-none"
        title="Arrastar"
        aria-label="Arrastar jogador"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="px-1.5 flex items-center border-l border-current/20 opacity-60 hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
            aria-label="Ações"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              renameBus.emit(playerId);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" /> Renomear
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => detachPlayerToQueue(playerId)}>
            <Users className="h-4 w-4 mr-2" /> Desagrupar (para fila)
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
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
  const players = usePelada((s) => s.players);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear jogador</DialogTitle>
          <DialogDescription>Altere o nome exibido no totem.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-12 text-base"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setId(null)}>Cancelar</Button>
          <Button
            onClick={() => {
              if (id && value.trim()) {
                renamePlayer(id, value);
                setId(null);
              }
            }}
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
  const removeFromQueue = usePelada((s) => s.removeFromQueue);
  const pasteInto = usePelada((s) => s.pasteSelectionIntoTeam);
  const court = usePelada((s) => s.court);

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
    <section className="rounded-2xl border-2 border-border bg-card p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl tracking-wide">
          FILA <span className="text-primary">·</span>{" "}
          <span className="text-muted-foreground text-lg">{queue.length}</span>
        </h2>
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
          placeholder="Nome do jogador"
          className="h-12 text-base"
        />
        <Button size="lg" type="submit" className="shrink-0">
          <Plus /> Add
        </Button>
      </form>

      {selection.length > 0 && (
        <div className="sticky top-2 z-10 rounded-xl border-2 border-primary bg-primary/10 backdrop-blur px-3 py-2 space-y-2">
          <div className="text-xs text-muted-foreground truncate">
            <span className="font-semibold text-primary">{selection.length} selecionado(s):</span>{" "}
            {selectedNames}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={formTeam} disabled={selection.length < 2}>
              <Users /> Formar Time
            </Button>
            {selection.length === 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => renameBus.emit(selection[0])}
              >
                <Pencil /> Renomear
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={clearSelection}>
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

      <div ref={setQueueDropRef} className="space-y-2 min-h-[40px]">
        <SortableContext items={queueIds} strategy={verticalListSortingStrategy}>
          {queue.length === 0 && !waitingChampion && (
            <p className="text-sm text-muted-foreground italic py-6 text-center">
              Ninguém na fila. Adicione jogadores acima.
            </p>
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
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

  const dropId = team ? `team:${team.id}` : `qentry-drop:${entry.kind}:${entry.id}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropId });

  return (
    <div
      ref={setDropRef}
      className={cn(
        "rounded-xl border-2 p-2 sm:p-3 space-y-2 transition-colors",
        isChampion
          ? "border-champion bg-champion/10"
          : "border-border bg-secondary/40",
        isOver && "ring-2 ring-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          {...dragHandleProps}
          className="p-1 text-muted-foreground hover:text-primary cursor-grab touch-none"
          title="Arrastar posição"
          aria-label="Arrastar"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {isChampion ? (
          <Crown className="h-6 w-6 text-champion shrink-0" />
        ) : (
          <span className="font-display text-xl text-muted-foreground w-6 text-center">
            {position}
          </span>
        )}
        {team && (
          <Badge variant="outline" className="font-display tracking-wide border-primary/60 text-primary">
            TIME {team.number}
          </Badge>
        )}
        <div className="flex-1" />
        {!isChampion && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
          return <PlayerPill key={pid} playerId={pid} name={p.name} justPlayed={p.justPlayed} />;
        })}
        {team && selectionCount > 0 && (
          <button
            className="rounded-lg border-2 border-dashed border-primary/60 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
            onClick={() => onPasteInto(team.id)}
          >
            <Plus className="inline h-3 w-3" /> colar {selectionCount} aqui
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="lg"
          className={cn(
            "flex-1 h-11",
            isChampion && slotAOpen
              ? "bg-champion text-champion-foreground hover:bg-champion/90"
              : "bg-team-a text-white hover:bg-team-a/90",
          )}
          disabled={!slotAOpen}
          onClick={() => onSendSide("A")}
        >
          → A
        </Button>
        <Button
          size="lg"
          className={cn(
            "flex-1 h-11",
            isChampion && slotBOpen
              ? "bg-champion text-champion-foreground hover:bg-champion/90"
              : "bg-team-b text-white hover:bg-team-b/90",
          )}
          disabled={!slotBOpen}
          onClick={() => onSendSide("B")}
        >
          → B
        </Button>
        {!hasAny && (
          <span className="text-xs text-muted-foreground italic px-1">quadra cheia</span>
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
    <div className="fixed inset-0 z-50 bg-court/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-court-foreground text-center">
        <img src={heziLogo.url} alt="Hezi Fam" className="h-24 w-24 mx-auto object-contain" />
        <Lock className="h-10 w-10 mx-auto text-primary" />
        <h2 className="font-display text-3xl tracking-wide">TELA BLOQUEADA</h2>
        <p className="text-sm text-court-foreground/70">
          {adminPin ? "Digite o PIN para desbloquear." : "Nenhum PIN definido — toque em desbloquear."}
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
          className="text-center text-3xl tracking-[0.6em] h-16 bg-background text-foreground"
        />
        {error && <p className="text-cooldown text-sm">PIN incorreto</p>}
        <Button
          size="lg"
          className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={trySubmit}
        >
          <Unlock /> Desbloquear
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-cooldown" /> Acabou de jogar
          </DialogTitle>
          <DialogDescription>
            {blocked.join(", ")} acabou de jogar. A regra é aguardar uma partida. Confirmar mesmo assim?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="bg-cooldown text-cooldown-foreground hover:bg-cooldown/90" onClick={onConfirm}>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modo administrador</DialogTitle>
          <DialogDescription>
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
              className="text-center text-2xl tracking-[0.5em] h-14"
            />
            <Button className="w-full" onClick={() => setAuthed(pin === adminPin)} disabled={pin.length !== 4}>
              Entrar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">PIN de administrador / bloqueio</p>
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder={adminPin ? "•".repeat(adminPin.length) : "Ex: 1234"}
                />
                <Button
                  onClick={() => {
                    setAdminPin(pin);
                    setPin("");
                  }}
                  disabled={pin.length !== 4}
                >
                  Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O mesmo PIN é usado para entrar no Admin e para desbloquear a tela.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Ações rápidas</p>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={!court.suddenDeathUsed}
                onClick={adminResetSuddenDeath}
              >
                <TimerIcon /> Reabrir botão +1 min (morte súbita)
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => {
                  if (confirm("Zerar toda a pelada? Isso apaga jogadores, times e fila.")) {
                    resetNight();
                    onOpenChange(false);
                  }
                }}
              >
                <X /> Resetar a noite inteira
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear time</DialogTitle>
          <DialogDescription>
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
          className="h-12 text-base"
        />
        <DialogFooter className="gap-2">
          {id && teamNames[id] && (
            <Button
              variant="outline"
              onClick={() => {
                if (id) renameTeam(id, "");
                setId(null);
              }}
            >
              Remover apelido
            </Button>
          )}
          <Button variant="outline" onClick={() => setId(null)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (id) renameTeam(id, value);
              setId(null);
            }}
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico da noite</DialogTitle>
          <DialogDescription>
            Estatísticas dos times e registro de ações.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-1 border-b border-border">
          {(["stats", "log"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px",
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground",
              )}
            >
              {t === "stats" ? "Estatísticas" : "Registro"}
            </button>
          ))}
        </div>
        {tab === "stats" ? (
          <div className="max-h-[50vh] overflow-auto space-y-1">
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-6 text-center">
                Nenhum jogo registrado ainda.
              </p>
            )}
            {rows.map((r) => (
              <div
                key={r.teamId}
                className="flex items-center gap-2 rounded-lg border border-border p-2"
              >
                <span className="font-display text-lg w-14 shrink-0">
                  T{r.number}
                </span>
                <div className="flex-1 min-w-0">
                  {r.customName && (
                    <div className="text-sm font-semibold truncate">
                      {r.customName}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground truncate">
                    {r.memberSnapshot.join(" · ")}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <span className="rounded bg-victory/20 text-victory px-1.5 py-0.5">
                    {r.wins}V
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5">
                    {r.draws}E
                  </span>
                  <span className="rounded bg-cooldown/20 text-cooldown px-1.5 py-0.5">
                    {r.losses}D
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-auto space-y-1">
            {actionLog.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-6 text-center">
                Nenhuma ação registrada ainda.
              </p>
            )}
            {actionLog.map((e) => (
              <div
                key={e.ts}
                className="text-xs flex gap-2 py-1 border-b border-border/50"
              >
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {new Date(e.ts).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="truncate">{e.msg}</span>
              </div>
            ))}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              tab === "stats" ? clearStats() : clearActionLog()
            }
          >
            Limpar {tab === "stats" ? "estatísticas" : "registro"}
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
