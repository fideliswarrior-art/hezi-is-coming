import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Crown, Ban, Play, Pause, Timer as TimerIcon, Shuffle, Trophy, Plus, X, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  usePelada,
  computeElapsed,
  currentDurationMs,
  type QueueEntry,
  type ID,
  MATCH_MS,
} from "@/lib/pelada/store";

export const Route = createFileRoute("/pelada")({
  head: () => ({
    meta: [
      { title: "Pelada — Totem 3x3 | Hezi" },
      {
        name: "description",
        content:
          "Gerencie a fila, os times e o cronômetro da pelada 3x3 direto do totem: quem joga, quem espera e o Rei da Quadra.",
      },
      { property: "og:title", content: "Pelada — Totem 3x3" },
      {
        property: "og:description",
        content: "Totem para organizar a pelada 3x3: fila, times, cronômetro e Rei da Quadra.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PeladaPage,
});

// ---------------------------------------------------------------------------
// Timer hook — ticks every 250ms while running, fires alarm at end.
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
// Root page
// ---------------------------------------------------------------------------
function PeladaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground select-none">
      <div className="mx-auto max-w-[1600px] px-4 py-4 lg:px-8 lg:py-6 space-y-6">
        <Header />
        <CourtBlock />
        <QueueBlock />
      </div>
    </div>
  );
}

function Header() {
  const [adminOpen, setAdminOpen] = useState(false);
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-court text-court-foreground font-display text-2xl">
          H
        </div>
        <div>
          <h1 className="font-display text-3xl leading-none tracking-wide">PELADA · 3x3</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            hezi.com.br / totem
          </p>
        </div>
      </div>
      <Button variant="outline" size="lg" onClick={() => setAdminOpen(true)}>
        <Settings /> Admin
      </Button>
      <AdminDialog open={adminOpen} onOpenChange={setAdminOpen} />
    </header>
  );
}

// ---------------------------------------------------------------------------
// COURT BLOCK
// ---------------------------------------------------------------------------
function CourtBlock() {
  useTick(250);
  const court = usePelada((s) => s.court);
  const teams = usePelada((s) => s.teams);
  const players = usePelada((s) => s.players);
  const startTimer = usePelada((s) => s.startTimer);
  const pauseTimer = usePelada((s) => s.pauseTimer);
  const resetTimer = usePelada((s) => s.resetTimer);
  const useSuddenDeath = usePelada((s) => s.useSuddenDeath);
  const declareWinner = usePelada((s) => s.declareWinner);
  const declareDraw = usePelada((s) => s.declareDraw);

  const total = currentDurationMs(court);
  const elapsed = Math.min(computeElapsed(court, Date.now()), total);
  const remaining = Math.max(0, total - elapsed);
  const finished = remaining === 0 && !!court.runningSince;

  // Alarm on finish
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
    <section className="rounded-3xl border-2 border-border bg-court text-court-foreground p-4 lg:p-6 shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        <CourtTeamCard side="A" team={teamA} players={players} onWin={() => declareWinner("A")} canDeclare={canDeclare} />

        {/* Center: timer + controls */}
        <div className="flex flex-col items-center justify-center gap-3 min-w-[260px] px-4">
          {court.inSuddenDeath && (
            <Badge className="bg-cooldown text-cooldown-foreground font-display tracking-widest">
              MORTE SÚBITA
            </Badge>
          )}
          <div
            className={cn(
              "font-display text-[7rem] leading-none tabular-nums transition-colors",
              remaining < 30000 && "text-cooldown",
            )}
          >
            {timeStr}
          </div>
          <div className="h-2 w-full rounded-full bg-black/30 overflow-hidden">
            <div
              className="h-full bg-champion transition-[width] duration-200"
              style={{ width: `${100 - pct}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {court.runningSince ? (
              <Button size="lg" variant="secondary" onClick={pauseTimer}>
                <Pause /> Pausar
              </Button>
            ) : (
              <Button size="lg" className="bg-victory text-victory-foreground hover:bg-victory/90" onClick={startTimer} disabled={!canDeclare}>
                <Play /> Iniciar
              </Button>
            )}
            <Button
              size="lg"
              variant="secondary"
              onClick={useSuddenDeath}
              disabled={court.suddenDeathUsed || !canDeclare}
              title={court.suddenDeathUsed ? "Já usado nesta partida (só admin libera)" : "1º empate — 1min extra"}
            >
              <TimerIcon /> +1 min
            </Button>
            <Button size="lg" variant="secondary" onClick={declareDraw} disabled={!canDeclare}>
              <Shuffle /> Empate
            </Button>
            <Button size="sm" variant="ghost" className="text-court-foreground/70" onClick={resetTimer}>
              Zerar tempo
            </Button>
          </div>
        </div>

        <CourtTeamCard side="B" team={teamB} players={players} onWin={() => declareWinner("B")} canDeclare={canDeclare} />
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
  const pasteInto = usePelada((s) => s.pasteSelectionIntoTeam);
  const selection = usePelada((s) => s.selection);
  const toggleSelect = usePelada((s) => s.toggleSelect);
  const removePlayer = usePelada((s) => s.removePlayer);
  const removeCourtTeam = usePelada((s) => s.removeCourtTeam);
  const sideColor = side === "A" ? "bg-team-a" : "bg-team-b";
  return (
    <div className="rounded-2xl bg-background/95 text-foreground p-4 flex flex-col gap-3 min-h-[240px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white font-display text-lg", sideColor)}>
            {side}
          </span>
          <span className="font-display text-2xl tracking-wide">
            {team ? `TIME ${team.number}` : "Aguardando"}
          </span>
          {team && team.wins > 0 && (
            <Badge variant="secondary" className="font-display">
              {team.wins}ª vitória
            </Badge>
          )}
        </div>
        {team && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm(`Remover TIME ${team.number} da quadra? Os jogadores serão apagados.`)) {
                removeCourtTeam(side);
              }
            }}
            title="Remover time inteiro"
          >
            <X className="h-4 w-4" /> Remover time
          </Button>
        )}
      </div>

      <div className="flex-1 flex flex-wrap gap-2 content-start">
        {team?.memberIds.map((pid) => {
          const p = players[pid];
          if (!p) return null;
          const selected = selection.includes(pid);
          return (
            <button
              key={pid}
              onClick={() => toggleSelect(pid)}
              className={cn(
                "group relative rounded-lg border px-3 py-2 text-sm font-medium min-h-[44px] flex items-center gap-2 transition-all",
                selected
                  ? "border-primary bg-primary text-primary-foreground scale-105 shadow-md"
                  : "border-border bg-secondary hover:border-primary/50",
              )}
            >
              {p.justPlayed && <Ban className="h-3.5 w-3.5 text-cooldown" />}
              <span>{p.name}</span>
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remover ${p.name}?`)) removePlayer(pid);
                }}
                className="opacity-60 hover:opacity-100 hover:text-destructive transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
        {team && selection.length > 0 && (
          <button
            className="rounded-lg border-2 border-dashed border-primary/50 px-3 py-2 text-xs text-primary hover:bg-primary/5"
            onClick={() => pasteInto(team.id)}
          >
            <Plus className="inline h-3 w-3" /> colar {selection.length}
          </button>
        )}
      </div>

      <Button
        size="lg"
        className="bg-victory text-victory-foreground hover:bg-victory/90 h-14 text-base font-display tracking-wider"
        disabled={!canDeclare}
        onClick={onWin}
      >
        <Trophy /> TIME {side} VENCEU
      </Button>
    </div>
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
  const toggleSelect = usePelada((s) => s.toggleSelect);
  const formTeam = usePelada((s) => s.formTeamFromSelection);
  const clearSelection = usePelada((s) => s.clearSelection);
  const addPlayer = usePelada((s) => s.addPlayer);
  const sendToCourtSide = usePelada((s) => s.sendToCourtSide);
  const removePlayer = usePelada((s) => s.removePlayer);
  const removeFromQueue = usePelada((s) => s.removeFromQueue);
  const pasteInto = usePelada((s) => s.pasteSelectionIntoTeam);
  const court = usePelada((s) => s.court);

  const [name, setName] = useState("");
  const [cooldownConfirm, setCooldownConfirm] = useState<
    { entry: QueueEntry; side: "A" | "B" } | null
  >(null);

  const slotAOpen = !court.teamAId;
  const slotBOpen = !court.teamBId;

  function trySend(entry: QueueEntry, side: "A" | "B") {
    const memberIds = entry.kind === "player" ? [entry.id] : teams[entry.id]?.memberIds ?? [];
    const blocked = memberIds.some((m) => players[m]?.justPlayed);
    if (blocked) {
      setCooldownConfirm({ entry, side });
      return;
    }
    sendToCourtSide(entry, side);
  }

  return (
    <section className="rounded-3xl border-2 border-border bg-card p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl tracking-wide">FILA</h2>
        <div className="flex items-center gap-2">
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
              className="h-12 w-56 text-base"
            />
            <Button size="lg" type="submit">
              <Plus /> Adicionar
            </Button>
          </form>
        </div>
      </div>

      {/* Selection bar */}
      {selection.length > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-primary bg-primary/10 px-3 py-2">
          <span className="text-sm font-medium">
            {selection.length} selecionado{selection.length > 1 ? "s" : ""}
          </span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={clearSelection}>
            Limpar
          </Button>
          <Button size="sm" onClick={formTeam} disabled={selection.length < 2}>
            <Users /> Formar Time
          </Button>
        </div>
      )}

      {/* Champion slot */}
      {waitingChampion && teams[waitingChampion] && (
        <QueueRow
          kind="champion"
          entry={{ kind: "team", id: waitingChampion }}
          team={teams[waitingChampion]}
          players={players}
          selection={selection}
          onToggle={toggleSelect}
          onSendSide={(side) => trySend({ kind: "team", id: waitingChampion }, side)}
          slotAOpen={slotAOpen}
          slotBOpen={slotBOpen}
          onRemovePlayer={removePlayer}
          onRemoveEntry={removeFromQueue}
          onPasteInto={pasteInto}
        />
      )}

      {/* Queue list */}
      <div className="space-y-2">
        {queue.length === 0 && !waitingChampion && (
          <p className="text-sm text-muted-foreground italic py-6 text-center">
            Ninguém na fila. Adicione jogadores acima.
          </p>
        )}
        {queue.map((entry, i) =>
          entry.kind === "team" ? (
            <QueueRow
              key={`t-${entry.id}`}
              kind="team"
              position={i + 1}
              entry={entry}
              team={teams[entry.id]}
              players={players}
              selection={selection}
              onToggle={toggleSelect}
              onSendSide={(side) => trySend(entry, side)}
              slotAOpen={slotAOpen}
              slotBOpen={slotBOpen}
              onRemovePlayer={removePlayer}
              onRemoveEntry={removeFromQueue}
              onPasteInto={pasteInto}
            />
          ) : (
            <QueueRow
              key={`p-${entry.id}`}
              kind="player"
              position={i + 1}
              entry={entry}
              player={players[entry.id]}
              players={players}
              selection={selection}
              onToggle={toggleSelect}
              onSendSide={(side) => trySend(entry, side)}
              slotAOpen={slotAOpen}
              slotBOpen={slotBOpen}
              onRemovePlayer={removePlayer}
              onRemoveEntry={removeFromQueue}
              onPasteInto={pasteInto}
            />
          ),
        )}
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

function QueueRow(props: {
  kind: "champion" | "team" | "player";
  position?: number;
  entry: QueueEntry;
  team?: ReturnType<typeof usePelada.getState>["teams"][string];
  player?: ReturnType<typeof usePelada.getState>["players"][string];
  players: ReturnType<typeof usePelada.getState>["players"];
  selection: ID[];
  onToggle: (id: ID) => void;
  onSend: () => void;
  hasOpenSlot: boolean;
  onRemovePlayer: (id: ID) => void;
}) {
  const { kind, position, team, player, players, selection, onToggle, onSend, hasOpenSlot, onRemovePlayer } = props;
  const isChampion = kind === "champion";

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-3 flex flex-wrap items-center gap-3 transition-colors",
        isChampion
          ? "border-champion bg-champion/10"
          : "border-border bg-secondary/40 hover:bg-secondary/70",
      )}
    >
      <div className="flex items-center gap-2 min-w-[80px]">
        {isChampion ? (
          <Crown className="h-6 w-6 text-champion" />
        ) : (
          <span className="font-display text-2xl text-muted-foreground w-8 text-center">
            {position}
          </span>
        )}
        {team && (
          <Badge variant="outline" className="font-display tracking-wide">
            TIME {team.number}
          </Badge>
        )}
      </div>

      <div className="flex-1 flex flex-wrap gap-2">
        {(team ? team.memberIds : player ? [player.id] : []).map((pid) => {
          const p = players[pid];
          if (!p) return null;
          const selected = selection.includes(pid);
          return (
            <button
              key={pid}
              onClick={() => onToggle(pid)}
              className={cn(
                "group relative rounded-lg border px-3 py-2 text-sm font-medium min-h-[44px] flex items-center gap-2 transition-all",
                selected
                  ? "border-primary bg-primary text-primary-foreground scale-105 shadow-md"
                  : "border-border bg-background hover:border-primary/50",
              )}
            >
              {p.justPlayed && <Ban className="h-3.5 w-3.5 text-cooldown" />}
              <span>{p.name}</span>
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remover ${p.name}?`)) onRemovePlayer(pid);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>

      <Button
        size="lg"
        variant={isChampion ? "default" : "outline"}
        disabled={!hasOpenSlot}
        onClick={onSend}
        className={cn(isChampion && "bg-champion text-champion-foreground hover:bg-champion/90")}
      >
        Entrar na quadra →
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialogs
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
            {blocked.join(", ")} acabou de jogar. A regra é aguardar uma partida. Confirmar mesmo assim (sem opção
            de outros jogadores)?
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
              <p className="text-sm font-medium">PIN de administrador</p>
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
                Deixe em branco para desativar. Guardado apenas neste totem.
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

// prevent unused import warning if MATCH_MS not read elsewhere
void MATCH_MS;
