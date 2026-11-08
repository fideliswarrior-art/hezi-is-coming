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
} from "lucide-react";
import {
  LOGO,
  wa,
  CATS,
  W,
  BN,
  BE,
  THR,
  PASS,
  nano,
  ovr,
  sessao,
  baseSub,
  mkR,
  B0,
  useHeziPlatform,
  useHeziSession,
  type CatKey,
  type NanoKey,
  type HeziUser,
  type HeziEventItem,
} from "@/lib/hezi/store";
import {
  usePelada,
  getPlayerPeladaStatus,
  currentDurationMs,
  computeElapsed,
} from "@/lib/pelada/store";
import { useRealtimeSync } from "@/lib/hezi/sync";
import { CourtMasterOrganizer, useTick } from "./pelada";

export const Route = createFileRoute("/")({
  component: HeziSuperApp,
});

const HEZI_LOGO_WHITE = "/assets/hezi-logo.png";
const SHIRT_FRONT_IMG = "/assets/hezi-shirt-001-front.jpg";
const SHIRT_BACK_IMG = "/assets/hezi-shirt-001-back.jpg";

const C = "bg-white border border-[#EAEBEF] rounded-2xl shadow-sm";
const OB = "bg-[#FF5400] text-white";
const GRN = "bg-[#ECFDF5] text-[#10B981]";
const RED = "bg-[#FEF2F2] text-[#EF4444]";
const btBase =
  "flex items-center justify-center gap-2 w-full text-center rounded-xl py-3.5 px-4 font-extrabold text-sm transition active:scale-95 ";

export type AppTab = "home" | "pelada" | "painel" | "login" | "assinante";

function Btn({
  href,
  onClick,
  c = "",
  dis = false,
  children,
}: {
  href?: string;
  onClick?: () => void;
  c?: string;
  dis?: boolean;
  children: React.ReactNode;
}) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={btBase + c}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      disabled={dis}
      onClick={onClick}
      className={btBase + c + (dis ? " opacity-60 cursor-not-allowed" : "")}
    >
      {children}
    </button>
  );
}

function Chip({
  c = "",
  children,
}: {
  c?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 text-xs font-extrabold rounded-full px-3 py-1 " +
        c
      }
    >
      {children}
    </span>
  );
}

function Av({
  u,
  s = "w-14 h-14 text-lg",
}: {
  u: HeziUser;
  s?: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  const initials = u.nome
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (u.foto && !imgErr) {
    return (
      <img
        src={u.foto}
        alt={u.nome}
        onError={() => setImgErr(true)}
        className={`rounded-full object-cover border border-[#EAEBEF] shrink-0 ${s}`}
      />
    );
  }

  return (
    <div
      className={
        "rounded-full bg-[#FFF4EE] text-[#FF5400] font-extrabold flex items-center justify-center shrink-0 " +
        s
      }
    >
      {initials}
    </div>
  );
}

function Hd({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-extrabold text-lg mb-3 text-[#111317] tracking-tight">
      {children}
    </h2>
  );
}

interface AppContextProps {
  users: HeziUser[];
  evs: HeziEventItem[];
  setEvs: (evs: HeziEventItem[]) => void;
  me: HeziUser | null;
  role: "visitante" | "jogador" | "aluno" | "professor" | "admin";
  upd: (id: number, patch: Partial<HeziUser>) => void;
  say: (msg: string) => void;
  join: (eid: number) => void;
  setTab: (tab: AppTab) => void;
  setCad: (open: boolean) => void;
  openCourtMaster: () => void;
  goSouAluno: () => void;
  goQueroSerAssinante: () => void;
}

function Cadastro({
  close,
  done,
}: {
  close: () => void;
  done: (f: { nome: string; wpp: string; pos: string }) => void;
}) {
  const [f, setF] = useState({ nome: "", wpp: "", pos: "Armador" });
  const ok =
    f.nome.trim().length > 1 && f.wpp.replace(/\D/g, "").length >= 10;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-end justify-center">
      <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-5 space-y-3 shadow-2xl border-t border-[#EAEBEF]">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-xl text-[#111317]">
            Crie sua conta grátis
          </h3>
          <button
            type="button"
            onClick={close}
            className="text-[#6E7381] hover:text-[#111317] p-1.5 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-[#6E7381]">
          Leva 15 segundos. Seus dados ficam salvos para entrar na fila da
          pelada e participar do Hezi Pass.
        </p>
        <input
          value={f.nome}
          placeholder="Seu nome completo"
          onChange={(e) => setF({ ...f, nome: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
        />
        <input
          value={f.wpp}
          placeholder="WhatsApp com DDD (ex: 21 99999-9999)"
          onChange={(e) => setF({ ...f, wpp: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
        />
        <select
          value={f.pos}
          onChange={(e) => setF({ ...f, pos: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 ring-[#FF5400]"
        >
          {["Armador", "Ala", "Pivô"].map((p) => (
            <option key={p} value={p}>
              Posição: {p}
            </option>
          ))}
        </select>
        <Btn dis={!ok} onClick={() => done(f)} c={OB}>
          <CheckCircle2 className="w-4 h-4" />
          Concluir Cadastro e Continuar
        </Btn>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PÁGINA DE LOGIN + OPÇÃO DE CADASTRO
// ---------------------------------------------------------------------------
function LoginPage({
  S,
  redirectAfter,
  onLoginSuccess,
  onOpenRegister,
}: {
  S: AppContextProps;
  redirectAfter: "painel" | "assinante";
  onLoginSuccess: (sid: number | "prof" | "admin") => void;
  onOpenRegister: () => void;
}) {
  const alunos = S.users.filter((u) => u.tipo === "aluno");
  const jogadores = S.users.filter((u) => u.tipo === "jogador");
  const [selectedUserId, setSelectedUserId] = useState<string>(
    String(alunos[0]?.id ?? 1),
  );

  const handleLoginSubmit = () => {
    if (selectedUserId === "prof" || selectedUserId === "admin") {
      onLoginSuccess(selectedUserId);
    } else {
      onLoginSuccess(Number(selectedUserId));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className={C + " p-6 space-y-4"}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#111317] text-white flex items-center justify-center shrink-0">
            <LogIn className="w-6 h-6 text-[#FF5400]" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-[#111317] leading-tight">
              Acesse sua conta
            </h1>
            <p className="text-xs text-[#6E7381]">
              {redirectAfter === "assinante"
                ? "Entre ou cadastre-se para ver os benefícios e assinar a Hezi Skills"
                : "Entre para acessar seu Perfil de Aluno, Boletim e Hezi Pass"}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381]">
            Selecione seu Perfil / Conta Cadastrada
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3.5 text-sm font-extrabold text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
          >
            <optgroup label="⚡ Alunos Hezi Skills (Assinantes)">
              {alunos.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.st === "ativo" ? "🟢" : "🔴"} {a.nome} ({a.pos})
                </option>
              ))}
            </optgroup>
            <optgroup label="🏀 Jogadores da Pelada (Conta Grátis)">
              {jogadores.map((j) => (
                <option key={j.id} value={String(j.id)}>
                  🏀 {j.nome} ({j.pos})
                </option>
              ))}
            </optgroup>
            <optgroup label="Staff / Equipe Técnica">
              <option value="prof">🧑‍🏫 Professor (Avaliador de Quadra)</option>
              <option value="admin">🔑 Administrador (Gestão + Court Master)</option>
            </optgroup>
          </select>
        </div>

        <Btn onClick={handleLoginSubmit} c={OB}>
          <LogIn className="w-4 h-4" />
          Entrar na Plataforma
        </Btn>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EAEBEF]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs font-extrabold uppercase text-[#6E7381]">
              Ainda não tem conta?
            </span>
          </div>
        </div>

        <Btn
          onClick={onOpenRegister}
          c="bg-[#111317] text-white"
        >
          <UserPlus className="w-4 h-4 text-[#FF5400]" />
          Cadastrar-se Grátis Agora
        </Btn>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PÁGINA "QUERO SER ASSINANTE" (VANTAGENS HEZI SKILLS + CTA WHATSAPP)
// ---------------------------------------------------------------------------
function AssinantePage({ S }: { S: AppContextProps }) {
  const userName = S.me ? S.me.nome : "";
  const wppUrl = wa(
    userName
      ? `Olá! Sou ${userName}, já tenho conta na plataforma HEZI FAM e quero ser assinante da Hezi Skills!`
      : "Olá! Vim pela plataforma HEZI FAM e quero ser assinante da Hezi Skills!",
  );

  const vantagens = [
    {
      icon: <Dribbble className="w-5 h-5 text-[#FF5400]" />,
      title: "Treinos Oficiais com a Hezi Skills",
      desc: "Aulas práticas em quadra (Turma Terça-feira · 16:30 às 17:30) focadas em fundamentos reais de jogo, controle de bola, finalização e leitura coletiva.",
    },
    {
      icon: <Award className="w-5 h-5 text-[#FF5400]" />,
      title: "Boletim de Evolução & Overall (65 → 99)",
      desc: "Avaliação técnica periódica no celular do professor (20 tentativas por fundamento), detecção de assimetria entre mão direita e esquerda, Badges (Bronze, Prata e Ouro) e recado técnico para os pais.",
    },
    {
      icon: <Zap className="w-5 h-5 text-[#FF5400]" />,
      title: "Multiplicador 2x de Pontos no Hezi Pass",
      desc: "Assinantes ganham o dobro de Hezi Points (HP) nos treinos e peladas, desbloqueando meias, adesivos, cupons e camisetas exclusivas na metade do tempo.",
    },
    {
      icon: <Shirt className="w-5 h-5 text-[#FF5400]" />,
      title: "Desconto Exclusivo nos Drops de Roupa",
      desc: "Desconto especial garantido no Drop 001 : Basic Collection (Hezi Shirt 001) e prioridade de reserva nos próximos lançamentos streetwear.",
    },
    {
      icon: <Star className="w-5 h-5 text-[#FF5400]" />,
      title: "Selo ALUNO VIP & Prioridade em Eventos",
      desc: "Identificação ALUNO VIP na fila da Pelada Oficial, acesso a treinos fechados e vantagens exclusivas em torneios 3x3 e 5x5 da comunidade.",
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Banner Topo */}
      <div className="bg-[#111317] text-white rounded-2xl p-6 space-y-3 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-[#FF5400] text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full">
          ⚡ Assinatura Oficial Hezi Skills
        </div>
        <h1 className="font-extrabold text-3xl leading-tight">
          Evolua seu jogo como um atleta de verdade.
        </h1>
        <p className="text-xs text-[#9CA3AF] leading-relaxed">
          {S.me
            ? `Olá, ${S.me.nome}! Veja tudo o que você desbloqueia ao ativar sua assinatura de Aluno Hezi Skills:`
            : "Confira todas as vantagens exclusivas para assinantes da comunidade HEZI FAM:"}
        </p>
      </div>

      {/* Lista de Vantagens */}
      <div className="space-y-3">
        {vantagens.map((v) => (
          <div key={v.title} className={C + " p-4 flex gap-3.5 items-start"}>
            <div className="w-11 h-11 rounded-xl bg-[#FFF4EE] flex items-center justify-center shrink-0 mt-0.5">
              {v.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-[#111317]">
                {v.title}
              </h3>
              <p className="text-xs text-[#6E7381] mt-1 leading-relaxed">
                {v.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Card Final CTA */}
      <div className="bg-[#FFF4EE] border-2 border-[#FF5400] rounded-2xl p-5 text-center space-y-3">
        <p className="font-extrabold text-lg text-[#111317]">
          Pronto para fazer parte da tropa?
        </p>
        <p className="text-xs text-[#6E7381]">
          Clique no botão abaixo para falar diretamente com a equipe da Hezi no
          WhatsApp e ativar sua assinatura.
        </p>
        <Btn href={wppUrl} c={OB}>
          <MessageCircle className="w-4 h-4" />
          Quero ser assinante
        </Btn>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PÁGINA INICIAL (HOME)
// ---------------------------------------------------------------------------
function Home({ S }: { S: AppContextProps }) {
  const [shirtView, setShirtView] = useState<"front" | "back">("front");
  const mainPelada = S.evs.find((e) => e.tp === "Pelada") || S.evs[0];

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
          <Btn onClick={S.goSouAluno} c="bg-[#111317] text-white">
            Sou Aluno
          </Btn>
        </div>
      </div>

      {/* Card Aviso Rápido da Próxima Pelada Oficial */}
      {mainPelada && (
        <div className={C + " p-4 border-l-4 border-l-[#FF5400]"}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5400]">
              ● Evento Ativo na Quadra
            </span>
            <Chip c="bg-[#F4F5F7] text-[#6E7381]">Ao Vivo</Chip>
          </div>
          <p className="font-extrabold text-base text-[#111317]">
            {mainPelada.t}
          </p>
          <p className="text-xs text-[#6E7381] mb-3">
            {mainPelada.q} · {mainPelada.l}
          </p>
          <Btn
            onClick={() => S.setTab("pelada")}
            c="bg-[#FFF4EE] text-[#FF5400] py-2.5 text-xs"
          >
            Entrar na Fila pelo Celular →
          </Btn>
        </div>
      )}

      {/* Drop 001 : Basic Collection — Apenas Hezi Shirt 001 com fotos reais anexadas */}
      <div>
        <Hd>Drop 001 : Basic Collection</Hd>
        <div className={C + " p-4 space-y-3"}>
          {/* Foto Principal da Blusa (Frente / Costas) */}
          <div className="relative rounded-2xl overflow-hidden bg-[#111317] aspect-square">
            <img
              src={shirtView === "front" ? SHIRT_FRONT_IMG : SHIRT_BACK_IMG}
              alt={
                shirtView === "front"
                  ? "Hezi Shirt 001 - Frente"
                  : "Hezi Shirt 001 - Costas"
              }
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
              <span className="bg-black/75 backdrop-blur-sm text-white text-xs font-extrabold px-3 py-1 rounded-full">
                {shirtView === "front" ? "Frente · Minimalista" : "Costas · Logo HEZI FAM"}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setShirtView("front")}
                  className={
                    "px-3 py-1 rounded-full text-xs font-extrabold transition " +
                    (shirtView === "front"
                      ? "bg-[#FF5400] text-white"
                      : "bg-black/70 text-white")
                  }
                >
                  Frente
                </button>
                <button
                  type="button"
                  onClick={() => setShirtView("back")}
                  className={
                    "px-3 py-1 rounded-full text-xs font-extrabold transition " +
                    (shirtView === "back"
                      ? "bg-[#FF5400] text-white"
                      : "bg-black/70 text-white")
                  }
                >
                  Costas
                </button>
              </div>
            </div>
          </div>

          {/* Miniaturas Frente e Costas lado a lado */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setShirtView("front")}
              className={
                "rounded-xl overflow-hidden border-2 transition flex items-center gap-2 p-1.5 text-left " +
                (shirtView === "front"
                  ? "border-[#FF5400] bg-[#FFF4EE]/40"
                  : "border-[#EAEBEF] bg-[#F4F5F7]")
              }
            >
              <img
                src={SHIRT_FRONT_IMG}
                alt="Frente"
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
              <div>
                <p className="font-extrabold text-xs text-[#111317]">Frente</p>
                <p className="text-[11px] text-[#6E7381]">Tabela Minimalista</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShirtView("back")}
              className={
                "rounded-xl overflow-hidden border-2 transition flex items-center gap-2 p-1.5 text-left " +
                (shirtView === "back"
                  ? "border-[#FF5400] bg-[#FFF4EE]/40"
                  : "border-[#EAEBEF] bg-[#F4F5F7]")
              }
            >
              <img
                src={SHIRT_BACK_IMG}
                alt="Costas"
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
              <div>
                <p className="font-extrabold text-xs text-[#111317]">Costas</p>
                <p className="text-[11px] text-[#6E7381]">Estampa HEZI FAM</p>
              </div>
            </button>
          </div>

          {/* Info e Botão Reservar */}
          <div className="pt-1 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-lg text-[#111317]">
                Hezi Shirt 001
              </p>
              <p className="text-xs text-[#6E7381]">
                Drop Único · Básico com Propósito
              </p>
            </div>
            <p className="n font-extrabold text-[#FF5400] text-2xl">
              R$ 120,00
            </p>
          </div>

          <Btn
            href={wa("Quero reservar: Hezi Shirt 001 (R$ 120,00)")}
            c={OB}
          >
            <MessageCircle className="w-4 h-4" />
            Reservar via WhatsApp
          </Btn>
        </div>
      </div>
    </div>
  );
}

function formatClockMs(ms: number) {
  const clamped = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Pelada({ S }: { S: AppContextProps }) {
  const peladaStore = usePelada();
  useTick();

  const mainPelada = S.evs.find((e) => e.tp === "Pelada") || S.evs[0];

  const [adminPreviewUserView, setAdminPreviewUserView] = useState(false);

  if (S.role === "admin" && !adminPreviewUserView) {
    return (
      <div className="p-4 space-y-4">
        <div className={C + " p-3.5 flex items-center justify-between gap-2"}>
          <div>
            <p className="font-extrabold text-sm text-[#111317]">
              🔑 Court Master Scheduler · Área do Administrador
            </p>
            <p className="text-xs text-[#6E7381]">
              Organize a pelada aqui. Os jogadores veem apenas a fila completa
              no celular.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdminPreviewUserView(true)}
            className="shrink-0 rounded-xl bg-[#F4F5F7] border border-[#EAEBEF] px-3 py-2 text-xs font-extrabold text-[#111317]"
          >
            👁️ Ver como Usuário
          </button>
        </div>
        <CourtMasterOrganizer embedded />
      </div>
    );
  }

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

  const totalWaitingPlayers = peladaStore.queue.reduce((acc, entry) => {
    if (entry.kind === "player") return acc + 1;
    const t = peladaStore.teams[entry.id];
    return acc + (t ? t.memberIds.length : 0);
  }, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-lg text-[#111317]">
            {mainPelada ? mainPelada.t : "Eventos & Fila da Pelada"}
          </h2>
          <p className="text-xs text-[#6E7381]">
            {mainPelada
              ? `${mainPelada.q} · ${mainPelada.l}`
              : "Acompanhe sua posição na fila em tempo real"}
          </p>
        </div>
        {S.role === "admin" ? (
          <button
            type="button"
            onClick={() => setAdminPreviewUserView(false)}
            className="text-xs font-extrabold bg-[#111317] text-white px-3 py-2 rounded-xl flex items-center gap-1.5"
          >
            <Timer className="w-3.5 h-3.5 text-[#FF5400]" />
            Voltar ao Court Master
          </button>
        ) : (
          <Chip c="bg-[#FFF4EE] text-[#FF5400]">Ao Vivo</Chip>
        )}
      </div>

      {/* Card Principal: Meu Lugar na Fila + Botão Entrar na Fila pelo Celular */}
      <div className={C + " p-4 space-y-3"}>
        {mainPelada && (
          <p className="text-xs bg-[#F4F5F7] rounded-lg p-2.5 text-[#111317] font-medium">
            📋 {mainPelada.r}
          </p>
        )}

        {myCourtStatus && myCourtStatus.status !== "not-in-pelada" ? (
          <div className="bg-[#ECFDF5] border border-[#10B981]/40 rounded-xl p-3.5 space-y-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#10B981]">
              ✓ Seu Status na Pelada
            </p>
            <p className="text-base font-extrabold text-[#111317]">
              {myCourtStatus.status === "on-court"
                ? `🏀 Você está EM QUADRA AGORA (${myCourtStatus.teamLabel} · Lado ${myCourtStatus.side})`
                : myCourtStatus.status === "champion-waiting"
                  ? `👑 Você está no Time Campeão aguardando desafiante (${myCourtStatus.teamLabel})`
                  : myCourtStatus.entryKind === "team"
                    ? `⏱️ Você está na fila no ${myCourtStatus.teamLabel} — Posição #${myCourtStatus.position}`
                    : `✓ Você está na fila — Posição #${myCourtStatus.position} (${myCourtStatus.playersAheadCount} na sua frente)`}
            </p>
          </div>
        ) : (
          <Btn
            onClick={() => S.join(mainPelada ? mainPelada.id : 1)}
            c={OB}
          >
            <Dribbble className="w-4 h-4" />
            Entrar na Fila pelo Celular
          </Btn>
        )}
      </div>

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
            Nenhum jogador na fila de espera no momento. Toque em &ldquo;Entrar
            na Fila pelo Celular&rdquo; acima!
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
                      {(p.position || heziUser?.pos) && (
                        <p className="text-xs text-[#6E7381]">
                          {p.position || heziUser?.pos}
                        </p>
                      )}
                    </div>
                    {p.justPlayed && (
                      <Chip c="bg-[#F4F5F7] text-[#6E7381]">
                        🚫 Jogou a última
                      </Chip>
                    )}
                    {(p.role === "aluno" ||
                      (heziUser?.tipo === "aluno" &&
                        heziUser.st === "ativo")) && (
                      <Chip c="bg-[#FFF4EE] text-[#FF5400]">ALUNO VIP</Chip>
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
                      {t.memberIds.length} jogadores
                    </Chip>
                  </div>
                  <div className="pl-10 flex flex-wrap gap-1.5">
                    {t.memberIds.map((pid) => {
                      const pl = peladaStore.players[pid];
                      if (!pl) return null;
                      const isMe =
                        S.me &&
                        (pl.userId === String(S.me.id) ||
                          pl.name.toLowerCase() === S.me.nome.toLowerCase());
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
    </div>
  );
}

function Pass({ u }: { u: HeziUser }) {
  const nx = PASS.find((p) => u.hp < p[0]);
  const pct = nx ? Math.min(100, Math.round((u.hp / nx[0]) * 100)) : 100;

  return (
    <div className={C + " p-4"}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-extrabold text-[#111317] flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#FF5400]" />
          Hezi Pass · Temporada 1
        </p>
        <span className="n text-xs font-bold text-[#FF5400]">{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-[#F4F5F7] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#FF5400] to-[#FF8800] rounded-full transition-all duration-700"
          style={{ width: pct + "%" }}
        />
      </div>
      <p className="text-xs text-[#6E7381] mt-2 mb-3">
        <span className="n font-bold text-[#111317]">{u.hp}</span> HP
        acumulados ·{" "}
        {nx
          ? `faltam ${nx[0] - u.hp} HP para desbloquear o Nível ${PASS.indexOf(nx) + 1}`
          : "Passe completo! 🏆"}
      </p>
      {PASS.map(([h, r], i) => {
        const ok = u.hp >= h;
        return (
          <div
            key={h}
            className={
              "flex items-center gap-3 py-2.5 border-t border-[#EAEBEF] " +
              (ok ? "" : "opacity-75")
            }
          >
            <span
              className={
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 " +
                (ok ? GRN : "bg-[#F4F5F7] text-[#6E7381]")
              }
            >
              {ok ? "✓" : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#111317]">
                  Nível {i + 1} · <span className="n">{h} HP</span>
                </p>
                <span
                  className={
                    "text-xs font-extrabold uppercase px-2 py-0.5 rounded-full " +
                    (ok ? GRN : "bg-[#F4F5F7] text-[#6E7381]")
                  }
                >
                  {ok ? "Desbloqueado" : "Em progresso"}
                </span>
              </div>
              <p className="text-xs text-[#6E7381]">{r}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Boletim({ u }: { u: HeziUser }) {
  const [o, setO] = useState<string>("ban");
  const sub = u.sub || baseSub;
  const r = u.r || mkR(sub);
  const bd = u.bd || B0();

  return (
    <div>
      <Hd>Boletim de Habilidades & Badges</Hd>
      <p className="text-xs text-[#6E7381] mb-3">
        {u.ev
          ? `Última avaliação: ${u.ev.d} · Ciclo ${u.ev.c}`
          : "Atleta iniciando na base 65 OVR. O professor lançará a primeira avaliação em quadra."}
      </p>
      <div className="space-y-2">
        {CATS.map((c) => {
          const open = o === c.k;
          const b = bd[c.k]?.l ?? 0;
          const sCount = bd[c.k]?.s ?? 0;
          const asym =
            c.k === "ban" && Math.abs((r.dir ?? 0) - (r.esq ?? 0)) > 4;
          return (
            <div key={c.k} className={C}>
              <button
                type="button"
                onClick={() => setO(open ? "" : c.k)}
                className="w-full flex items-center gap-3 p-3.5 text-left"
              >
                <span className="text-2xl">{c.e}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#111317] truncate">
                    {c.t}
                  </p>
                  <p className="text-xs text-[#6E7381]">
                    Badge: {BE[b]} {BN[b]} · Peso {Math.round(W[c.k] * 100)}%
                  </p>
                </div>
                <span className="text-lg">{BE[b]}</span>
                <span className="n font-bold text-xl w-9 text-right text-[#111317]">
                  {sub[c.k]}
                </span>
                {open ? (
                  <ChevronUp className="w-4 h-4 text-[#6E7381]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#6E7381]" />
                )}
              </button>
              {open && (
                <div className="px-3.5 pb-3.5 space-y-2 border-t border-[#EAEBEF] pt-2.5">
                  {c.n.map(([k, nm]) => (
                    <div
                      key={k}
                      className="flex justify-between items-center text-sm bg-[#F4F5F7] rounded-lg px-3 py-2"
                    >
                      <span className="font-medium text-[#111317]">{nm}</span>
                      <span className="n font-bold text-[#111317]">
                        {r[k] ?? 0}/20 →{" "}
                        <span className="text-[#FF5400]">
                          {nano(r[k] ?? 0)} pts
                        </span>
                      </span>
                    </div>
                  ))}
                  {asym && (
                    <div className="bg-[#FEF2F2] text-[#EF4444] text-xs font-bold rounded-lg p-3">
                      ⚠️ Assimetria detectada:{" "}
                      {Math.abs((r.dir ?? 0) - (r.esq ?? 0))} acertos de
                      diferença entre mão direita ({r.dir}/20) e esquerda (
                      {r.esq}/20).
                    </div>
                  )}
                  <p className="text-xs text-[#6E7381]">
                    Status da Badge:{" "}
                    <strong className="text-[#111317]">
                      {BE[b]} {BN[b]}
                    </strong>
                    {b < 3
                      ? ` · próxima (${BN[b + 1]}) aos ${THR[b]} pts (2 avaliações seguidas — atual: ${sCount}/2)`
                      : " · Nível máximo atingido!"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={C + " p-4 mt-3"}>
        <p className="font-extrabold text-sm mb-1 text-[#111317]">
          📝 Recado Técnico do Professor
        </p>
        <p className="text-sm text-[#6E7381]">
          {u.nota || "Sem recado técnico registrado ainda."}
        </p>
      </div>
      <p className="text-center text-xs text-[#6E7381] mt-3">
        🔒 Ficha individual privada · Próxima avaliação técnica de quadra em 15
        dias.
      </p>
    </div>
  );
}

function Painel({ S }: { S: AppContextProps }) {
  const u = S.me;

  if (!u) {
    return (
      <div className="p-4 space-y-4">
        <div className={C + " p-6 text-center space-y-3"}>
          <p className="text-4xl">🔐</p>
          <h2 className="font-extrabold text-xl text-[#111317]">
            Entre para acessar seu Perfil
          </h2>
          <p className="text-sm text-[#6E7381]">
            Faça login ou crie sua conta grátis para acessar o Hezi Pass e seu
            painel.
          </p>
          <Btn onClick={() => S.setTab("login")} c={OB}>
            Ir para Login / Cadastro
          </Btn>
        </div>
      </div>
    );
  }

  // Área do Usuário Convencional (Jogador sem assinatura)
  if (u.tipo === "jogador") {
    return (
      <div className="p-4 space-y-4">
        <div className={C + " p-4 flex gap-3 items-center"}>
          <Av u={u} />
          <div className="flex-1">
            <p className="font-extrabold text-base text-[#111317]">{u.nome}</p>
            <p className="text-xs text-[#6E7381]">
              {u.pos} · Conta convencional grátis
            </p>
          </div>
          <Chip c="bg-[#F4F5F7] text-[#6E7381]">Jogador</Chip>
        </div>

        <div className={C + " p-4 flex items-center justify-between"}>
          <div>
            <p className="text-xs text-[#6E7381] font-semibold">
              ⚡ Hezi Points Acumulados
            </p>
            <p className="n font-bold text-4xl text-[#FF5400]">
              {u.hp} <span className="text-base">HP</span>
            </p>
          </div>
          <Zap className="w-8 h-8 text-[#FF5400]" />
        </div>

        <Pass u={u} />

        <div className="bg-[#FFF4EE] border border-[#FF5400]/20 rounded-2xl p-5">
          <p className="font-extrabold text-[#111317] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FF5400]" />
            Quer evoluir de verdade?
          </p>
          <p className="text-sm text-[#6E7381] my-2">
            Torne-se assinante{" "}
            <strong className="text-[#111317]">Hezi Skills</strong> para ter
            treinos com o professor, boletim de evolução (Overall 65→99),
            desconto na Hezi Shirt 001 e pontos 2x no Hezi Pass.
          </p>
          <Btn onClick={() => S.setTab("assinante")} c={OB}>
            Ver vantagens e ser assinante
          </Btn>
        </div>
      </div>
    );
  }

  // Área do Assinante (Aluno Hezi Skills) — Lógica de Bloqueio de Mensalidade
  if (u.st === "inativo") {
    return (
      <div className="p-4">
        <div className="bg-[#FEF2F2] border-2 border-[#EF4444]/40 rounded-2xl p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-extrabold text-xl text-[#EF4444]">
            ACESSO RESTRITO · Mensalidade Pendente
          </h2>
          <p className="text-sm text-[#6E7381]">
            Olá, <strong className="text-[#111317]">{u.nome}</strong>.
            Regularize o plano para liberar seu Boletim de Evolução, continuar
            pontuando no Hezi Pass e manter sua ofensiva semanal.
          </p>
          <Btn
            href={wa(
              "Olá treinador! Sou " +
                u.nome +
                " e quero regularizar minha mensalidade da Hezi Skills.",
            )}
            c="bg-[#EF4444] text-white"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com o Treinador no WhatsApp
          </Btn>
        </div>
      </div>
    );
  }

  // Aluno Hezi Skills Ativo
  const sub = u.sub || baseSub;
  return (
    <div className="p-4 space-y-4">
      <div className={C + " p-4"}>
        <div className="flex gap-3 items-center">
          <Av u={u} />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base text-[#111317] truncate">
              {u.nome}
            </p>
            <p className="text-xs text-[#6E7381] mb-1.5">
              {u.pos} · Turma Terça 16:30
            </p>
            <Chip c={GRN}>🟢 Matrícula Regular</Chip>
          </div>
          <div className="text-center bg-[#FFF4EE] px-3.5 py-2 rounded-2xl border border-[#FF5400]/20">
            <p className="n font-bold text-4xl text-[#FF5400] leading-none">
              {ovr(sub)}
            </p>
            <p className="text-xs font-extrabold text-[#6E7381] mt-0.5">
              OVR
            </p>
          </div>
        </div>
      </div>

      {/* HUD de Estatísticas */}
      <div className="grid grid-cols-2 gap-3">
        <div className={C + " p-4"}>
          <p className="text-xs font-semibold text-[#6E7381] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#FF5400]" />
            Ofensiva Semanal
          </p>
          <p className="n font-bold text-3xl text-[#111317] mt-1">
            {u.of ?? 0}{" "}
            <span className="text-sm font-medium text-[#6E7381]">semanas</span>
          </p>
        </div>
        <div className={C + " p-4"}>
          <p className="text-xs font-semibold text-[#6E7381] flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#FF5400]" />
            Hezi Points
          </p>
          <p className="n font-bold text-3xl text-[#FF5400] mt-1">
            {u.hp} <span className="text-sm font-medium">HP</span>
          </p>
        </div>
      </div>

      <Pass u={u} />
      <Boletim u={u} />
    </div>
  );
}

function Step({ v, set }: { v: number; set: (val: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => set(Math.max(0, v - 1))}
        className="w-11 h-11 rounded-xl bg-[#F4F5F7] text-[#111317] flex items-center justify-center font-bold active:scale-90 transition"
        aria-label="Diminuir"
      >
        <Minus className="w-5 h-5" />
      </button>
      <span className="n font-bold text-xl w-14 text-center text-[#111317]">
        {v}
        <span className="text-xs text-[#6E7381]">/20</span>
      </span>
      <button
        type="button"
        onClick={() => set(Math.min(20, v + 1))}
        className="w-11 h-11 rounded-xl bg-[#FF5400] text-white flex items-center justify-center font-bold active:scale-90 transition"
        aria-label="Aumentar"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

function Avaliar({ S }: { S: AppContextProps }) {
  const al = S.users.filter((x) => x.tipo === "aluno");
  const [id, setId] = useState<number>(al[0]?.id ?? 1);
  const [ci, setCi] = useState<"Quinzenal" | "Mensal">("Quinzenal");
  const u = al.find((x) => x.id === id) || al[0];

  const [r, setR] = useState<Record<NanoKey, number>>(() =>
    u?.r ? { ...u.r } : mkR(baseSub),
  );
  const [nt, setNt] = useState<string>("");

  const selectStudent = (newId: number) => {
    setId(newId);
    const target = al.find((x) => x.id === newId);
    setR(target?.r ? { ...target.r } : mkR(target?.sub || baseSub));
    setNt("");
  };

  if (!u) return null;

  const currentSub = u.sub || baseSub;
  const currentBd = u.bd || B0();

  const previewSub = {} as Record<CatKey, number>;
  CATS.forEach((c) => {
    previewSub[c.k] = Math.round(currentSub[c.k] * 0.7 + sessao(c, r) * 0.3);
  });
  const prevOvr = ovr(currentSub);
  const nextOvr = ovr(previewSub);

  const go = () => {
    const nb = { ...currentBd };
    const ns = {} as Record<CatKey, number>;
    CATS.forEach((c) => {
      const nv = Math.round(currentSub[c.k] * 0.7 + sessao(c, r) * 0.3);
      const b = currentBd[c.k] || { l: 0, s: 0 };
      ns[c.k] = nv;
      if (b.l < 3 && nv >= THR[b.l]) {
        const s = b.s + 1;
        nb[c.k] = s >= 2 ? { l: b.l + 1, s: 0 } : { l: b.l, s };
      } else {
        nb[c.k] = { l: b.l, s: 0 };
      }
    });

    S.upd(id, {
      sub: ns,
      bd: nb,
      r: { ...r },
      ev: { d: new Date().toLocaleDateString("pt-BR"), c: ci },
      nota: nt.trim() || u.nota,
    });
    S.say(`Avaliação salva! ${u.nome}: OVR ${prevOvr} → ${ovr(ns)}`);
    setNt("");
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
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          {(["Quinzenal", "Mensal"] as const).map((x) => (
            <button
              type="button"
              key={x}
              onClick={() => setCi(x)}
              className={
                "rounded-xl py-2.5 text-xs font-extrabold transition " +
                (ci === x
                  ? OB
                  : "bg-[#F4F5F7] text-[#6E7381] border border-[#EAEBEF]")
              }
            >
              Ciclo {x}
            </button>
          ))}
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
        const subSessao = sessao(c, r);
        const subNovo = previewSub[c.k];
        return (
          <div key={c.k} className={C + " p-4"}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-extrabold text-sm text-[#111317]">
                {c.e} {c.t}{" "}
                <span className="text-[#6E7381] font-medium text-xs">
                  · peso {Math.round(W[c.k] * 100)}%
                </span>
              </p>
              <span className="n text-xs font-bold bg-[#F4F5F7] px-2.5 py-1 rounded-lg">
                {currentSub[c.k]} →{" "}
                <strong className="text-[#FF5400]">{subNovo}</strong>{" "}
                <span className="text-[#6E7381]">(hoje: {subSessao})</span>
              </span>
            </div>

            {c.n.map(([k, nm]) => (
              <div
                key={k}
                className="flex items-center justify-between py-2.5 border-t border-[#EAEBEF]"
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

            {c.k === "ban" && Math.abs((r.dir ?? 0) - (r.esq ?? 0)) > 4 && (
              <p className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2] rounded-lg p-2.5 mt-2">
                ⚠️ Assimetria ({Math.abs((r.dir ?? 0) - (r.esq ?? 0))} acertos
                de diferença): penalidade técnica aplicada no Sub-Overall de
                bandeja.
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

      <Btn onClick={go} c={OB}>
        <CheckCircle2 className="w-4 h-4" />
        Processar Avaliação & Atualizar Boletim
      </Btn>
    </div>
  );
}

function Alunos({ S }: { S: AppContextProps }) {
  const [sel, setSel] = useState<number>(1);
  const u = S.users.find((x) => x.id === sel) || S.users[0];
  if (!u) return null;

  const al = u.tipo === "aluno";
  const A: [string, number, number][] = al
    ? [
        ["+10 HP & +1 🔥 (Treino Pago de Terça-feira)", 10, 1],
        ["+10 HP (Presença na Pelada Aberta · 2x Aluno)", 10, 0],
        ["+20 HP & +1 🔥 (Combo Treino + Pelada na Semana)", 20, 1],
        ["+100 HP (Evento Especial Aluno Hezi)", 100, 0],
      ]
    : [
        ["+5 HP (Presença na Pelada · Jogador Grátis)", 5, 0],
        ["+50 HP (Evento Especial · Jogador Grátis)", 50, 0],
      ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#6E7381] px-1">
        Toque em um aluno ou jogador para lançar check-in de beira de quadra em
        tempo real:
      </p>

      {S.users.map((x) => (
        <div
          key={x.id}
          onClick={() => setSel(x.id)}
          className={
            C +
            " p-3 flex items-center gap-3 cursor-pointer transition " +
            (x.id === sel ? "ring-2 ring-[#FF5400] bg-[#FFF4EE]/30" : "")
          }
        >
          <Av u={x} s="w-10 h-10 text-sm" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-[#111317] truncate">
              {x.nome}
            </p>
            <p className="text-xs text-[#6E7381]">
              {x.tipo === "aluno" ? "Aluno Hezi Skills" : "Jogador Grátis"} ·{" "}
              <span className="n font-bold text-[#FF5400]">{x.hp} HP</span>
              {x.tipo === "aluno" ? ` · 🔥 ${x.of ?? 0} sem.` : ""}
            </p>
          </div>
          {x.tipo === "aluno" &&
            (S.role === "admin" ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextSt = x.st === "ativo" ? "inativo" : "ativo";
                  S.upd(x.id, { st: nextSt });
                  S.say(
                    `${x.nome}: mensalidade ${nextSt === "ativo" ? "Ativa" : "Pendente"}`,
                  );
                }}
                className={
                  "text-xs font-bold rounded-full px-3 py-1.5 transition " +
                  (x.st === "ativo" ? GRN : RED)
                }
              >
                {x.st === "ativo" ? "🟢 Ativo" : "🔴 Pendente"}
              </button>
            ) : (
              <Chip c={x.st === "ativo" ? GRN : RED}>
                {x.st === "ativo" ? "🟢 Ativo" : "🔴 Pendente"}
              </Chip>
            ))}
        </div>
      ))}

      <div className={C + " p-4 space-y-2.5"}>
        <p className="font-extrabold text-sm text-[#111317]">
          Ações Rápidas de Check-in:{" "}
          <span className="text-[#FF5400]">{u.nome}</span>
        </p>
        {A.map(([t, h, o]) => (
          <Btn
            key={t}
            onClick={() => {
              if (al && u.st === "inativo") {
                return S.say(
                  "Mensalidade pendente: regularize para pontuar no Hezi Pass",
                );
              }
              S.upd(u.id, { hp: u.hp + h, of: (u.of || 0) + o });
              S.say(`${u.nome}: ${t} ✓`);
            }}
            c="bg-[#FFF4EE] text-[#FF5400] text-xs py-3"
          >
            {t}
          </Btn>
        ))}
        {S.role !== "admin" && (
          <p className="text-xs text-[#6E7381] pt-1 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Modo Professor: apenas o Administrador pode alterar o status da
            mensalidade.
          </p>
        )}
      </div>
    </div>
  );
}

function Eventos({ S }: { S: AppContextProps }) {
  const [f, setF] = useState({
    t: "",
    tp: "Pelada",
    q: "",
    l: "",
    r: "",
  });

  const peladaStore = usePelada();

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
        <input
          value={f.q}
          placeholder="Dia e horário (ex: Sábado · 17:00)"
          onChange={(e) => setF({ ...f, q: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm outline-none"
        />
        <input
          value={f.l}
          placeholder="Quadra / local (ex: Quadra Central)"
          onChange={(e) => setF({ ...f, l: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm outline-none"
        />
        <input
          value={f.r}
          placeholder="Regras (ex: Jogos até 12 pontos ou 10 min)"
          onChange={(e) => setF({ ...f, r: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm outline-none"
        />
        <Btn
          dis={!f.t.trim() || !f.q.trim()}
          onClick={() => {
            S.setEvs([...S.evs, { ...f, id: Date.now(), f: [] }]);
            setF({ t: "", tp: "Pelada", q: "", l: "", r: "" });
            S.say("Evento criado e publicado!");
          }}
          c={OB}
        >
          <Plus className="w-4 h-4" />
          Criar evento
        </Btn>
      </div>

      {S.evs.map((e) => (
        <div key={e.id} className={C + " p-4"}>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-sm text-[#111317]">
                {e.t}{" "}
                <span className="text-[#6E7381] font-medium">
                  · {e.f.length} na fila
                </span>
              </p>
              <p className="text-xs text-[#6E7381]">
                {e.q} · {e.l}
              </p>
            </div>
            <button
              type="button"
              onClick={() => S.setEvs(S.evs.filter((x) => x.id !== e.id))}
              className="text-[#EF4444] text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#FEF2F2]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              excluir
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={() => {
                const calledUsers = e.f
                  .slice(0, 5)
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
                    x.id === e.id ? { ...x, f: x.f.slice(5) } : x,
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
              Chamar próximo time de 5
            </button>
            <button
              type="button"
              onClick={() =>
                S.setEvs(
                  S.evs.map((x) => (x.id === e.id ? { ...x, f: [] } : x)),
                )
              }
              className="rounded-xl bg-[#F4F5F7] text-[#111317] text-xs font-bold py-3 px-2 transition active:scale-95"
            >
              Limpar fila
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DbStatusSummaryClient {
  engine: string;
  dbPath: string;
  fileSizeBytes: number;
  counts: {
    users: number;
    alunos: number;
    jogadores: number;
    events: number;
    queueEntries: number;
    evaluationsHistory: number;
  };
  heziUpdatedAt: number;
  peladaUpdatedAt: number;
  recentEvaluations: Array<{
    id: number;
    userId: number;
    userName: string;
    evalDate: string;
    cycle: string;
    ovrBefore: number;
    ovrAfter: number;
    notaTecnica: string;
    createdAt: number;
  }>;
}

function BancoDados({ S }: { S: AppContextProps }) {
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
                Banco Relacional SQLite Ativo
              </p>
              <p className="text-xs text-[#6E7381]">
                {info?.engine || "SQLite · Persistência ACID em disco"}
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
                  {info.counts.users}
                </p>
                <p className="text-xs font-bold text-[#6E7381]">
                  USUÁRIOS ({info.counts.alunos}A / {info.counts.jogadores}J)
                </p>
              </div>
              <div className="bg-[#F4F5F7] rounded-xl p-2.5">
                <p className="n font-extrabold text-xl text-[#FF5400]">
                  {info.counts.events}
                </p>
                <p className="text-xs font-bold text-[#6E7381]">
                  EVENTOS ({info.counts.queueEntries} FILA)
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
                <strong className="text-[#111317]">Arquivo SQLite:</strong>{" "}
                data/hezi.sqlite ({Math.round(info.fileSizeBytes / 1024)} KB)
              </div>
              <div>
                <strong className="text-[#111317]">Schema Cloud:</strong>{" "}
                supabase/schema.sql (PostgreSQL + RLS pronto)
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={exportBackup}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#111317] text-white text-xs font-bold py-3 px-3 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Backup
          </button>
          <button
            type="button"
            onClick={() => void resetDb()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#FEF2F2] text-[#EF4444] text-xs font-bold py-3 px-3 active:scale-95 transition"
          >
            Restaurar Fábrica
          </button>
        </div>
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

type StaffSubTabKey = "av" | "al" | "ev" | "cm" | "db";

function Staff({
  S,
  initialSubTab,
  onSubTabChange,
}: {
  S: AppContextProps;
  initialSubTab?: StaffSubTabKey;
  onSubTabChange?: (st: StaffSubTabKey) => void;
}) {
  const adm = S.role === "admin";
  const T: [StaffSubTabKey, string][] = [
    ...(adm ? ([["cm", "Court Master"]] as [StaffSubTabKey, string][]) : []),
    ["av", "Avaliar"],
    ["al", "Alunos"],
    ...(adm
      ? ([
          ["ev", "Eventos"],
          ["db", "Banco SQL"],
        ] as [StaffSubTabKey, string][])
      : []),
  ];
  const [t, setT] = useState<StaffSubTabKey>(
    initialSubTab || (adm ? "cm" : "av"),
  );

  useEffect(() => {
    if (initialSubTab) setT(initialSubTab);
  }, [initialSubTab]);

  const handleSelect = (k: StaffSubTabKey) => {
    setT(k);
    onSubTabChange?.(k);
  };

  return (
    <div className="p-4 space-y-4">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${T.length}, minmax(0, 1fr))` }}
      >
        {T.map(([k, n]) => (
          <button
            type="button"
            key={k}
            onClick={() => handleSelect(k)}
            className={
              "rounded-xl py-2.5 px-1 text-xs font-extrabold truncate transition " +
              (t === k
                ? "bg-[#111317] text-white shadow-sm"
                : "bg-white border border-[#EAEBEF] text-[#6E7381]")
            }
          >
            {n}
          </button>
        ))}
      </div>

      {t === "av" ? (
        <Avaliar S={S} />
      ) : t === "al" ? (
        <Alunos S={S} />
      ) : t === "ev" && adm ? (
        <Eventos S={S} />
      ) : t === "db" && adm ? (
        <BancoDados S={S} />
      ) : (
        <div className="space-y-3">
          <div className={C + " p-3 flex items-center justify-between"}>
            <div>
              <p className="font-extrabold text-sm text-[#111317]">
                Court Master · Organizador de Pelada 3x3
              </p>
              <p className="text-xs text-[#6E7381]">
                Sincronizado com a fila de celulares da Pelada Oficial
              </p>
            </div>
            <Users className="w-5 h-5 text-[#FF5400]" />
          </div>
          <CourtMasterOrganizer embedded />
        </div>
      )}
    </div>
  );
}

function HeziSuperApp() {
  useRealtimeSync();

  const { users, evs, updUser, addUser, setEvs, addQueue } = useHeziPlatform();
  const { sid, setSid } = useHeziSession();
  const peladaStore = usePelada();

  const [tab, setTab] = useState<AppTab>("home");
  const [loginRedirect, setLoginRedirect] = useState<"painel" | "assinante">(
    "painel",
  );
  const [staffSubTab, setStaffSubTab] = useState<StaffSubTabKey>("cm");
  const [cad, setCad] = useState(false);
  const [pend, setPend] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const me =
    typeof sid === "number" ? users.find((x) => x.id === sid) || null : null;
  const role: AppContextProps["role"] =
    sid === "admin"
      ? "admin"
      : sid === "prof"
        ? "professor"
        : me
          ? me.tipo
          : "visitante";

  const say = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(""), 2600);
  };

  const syncUserToCourtMaster = (u: HeziUser) => {
    const status = getPlayerPeladaStatus(peladaStore, {
      userId: String(u.id),
      name: u.nome,
    });
    if (status.status === "not-in-pelada") {
      peladaStore.addPlayer(u.nome, {
        role: u.tipo === "aluno" ? "aluno" : "convencional",
        userId: String(u.id),
        position: u.pos,
      });
    }
  };

  // Seed initial Pelada queue into Court Master if empty
  useEffect(() => {
    if (Object.keys(peladaStore.players).length === 0) {
      const peladaEv = evs.find((e) => e.tp === "Pelada") || evs[0];
      if (peladaEv) {
        peladaEv.f.forEach((uid) => {
          const u = users.find((x) => x.id === uid);
          if (u) {
            peladaStore.addPlayer(u.nome, {
              role: u.tipo === "aluno" ? "aluno" : "convencional",
              userId: String(u.id),
              position: u.pos,
            });
          }
        });
      }
    }
  }, [evs, peladaStore, users]);

  // Navegação inteligente para "SOU ALUNO"
  const goSouAluno = () => {
    if (role === "visitante") {
      setLoginRedirect("painel");
      setTab("login");
    } else {
      setTab("painel");
    }
  };

  // Navegação inteligente para "QUERO SER ASSINANTE"
  const goQueroSerAssinante = () => {
    if (role === "visitante") {
      setLoginRedirect("assinante");
      setTab("login");
    } else {
      setTab("assinante");
    }
  };

  const join = (eid: number) => {
    if (role === "professor" || role === "admin") {
      return say("Troque para um perfil de Jogador ou Aluno para entrar na fila");
    }
    const targetEv = evs.find((e) => e.id === eid);
    if (!me) {
      setPend(eid);
      setCad(true);
      return;
    }
    if (targetEv?.tp === "Treino" && me.tipo !== "aluno") {
      return say("Treino exclusivo para alunos assinantes Hezi Skills!");
    }
    if (targetEv?.tp === "Treino" && me.st === "inativo") {
      return say("Regularize sua mensalidade para entrar no treino!");
    }
    addQueue(eid, me.id);
    if (targetEv?.tp === "Pelada") {
      syncUserToCourtMaster(me);
    }
    say("Você entrou na fila pelo celular! 🏀");
  };

  const reg = (f: { nome: string; wpp: string; pos: string }) => {
    const u: HeziUser = {
      id: Date.now(),
      tipo: "jogador",
      nome: f.nome.trim(),
      pos: f.pos,
      wpp: f.wpp.trim(),
      hp: 0,
    };
    addUser(u);
    setSid(u.id);
    setCad(false);
    if (pend) {
      const targetEv = evs.find((e) => e.id === pend);
      addQueue(pend, u.id);
      if (targetEv?.tp === "Pelada") {
        syncUserToCourtMaster(u);
      }
      setPend(null);
      setTab("pelada");
      say("Conta criada! Você já está na fila da pelada! 🏀");
    } else if (tab === "login" && loginRedirect === "assinante") {
      setTab("assinante");
      say("Cadastro concluído! Veja as vantagens de ser assinante.");
    } else {
      setTab("painel");
      say("Conta grátis criada com sucesso!");
    }
  };

  const openCourtMaster = () => {
    const peladaEv = evs.find((e) => e.tp === "Pelada");
    if (peladaEv) {
      peladaEv.f.forEach((uid) => {
        const u = users.find((x) => x.id === uid);
        if (u) syncUserToCourtMaster(u);
      });
    }
    setStaffSubTab("cm");
    setTab("painel");
  };

  const S: AppContextProps = {
    users,
    evs,
    setEvs,
    me,
    role,
    upd: updUser,
    say,
    join,
    setTab,
    setCad,
    openCourtMaster,
    goSouAluno,
    goQueroSerAssinante,
  };

  const staff = role === "admin" || role === "professor";
  const isWideCourtMaster =
    role === "admin" &&
    (tab === "pelada" || (tab === "painel" && staffSubTab === "cm"));

  return (
    <div className="h-dvh w-full flex justify-center bg-[#F4F5F7] text-[#111317] overflow-hidden">
      <div
        className={
          "relative w-full h-full bg-[#FBFBFC] flex flex-col overflow-hidden sm:border-x border-[#EAEBEF] transition-all duration-300 " +
          (isWideCourtMaster ? "max-w-6xl" : "max-w-[480px]")
        }
      >
        {/* BARRA SUPERIOR ESTILO OTE (PRETA COM LOGO HEZI + EVENTOS | SOU ALUNO | QUERO SER ASSINANTE) */}
        <header className="shrink-0 bg-black text-white">
          <div className="flex items-center justify-between px-3.5 py-2.5 gap-2">
            <button
              type="button"
              onClick={() => setTab("home")}
              className="shrink-0 flex items-center"
              title="Voltar ao Início"
            >
              <img
                src={LOGO}
                alt="HEZI FAM"
                className="h-10 w-auto object-contain"
              />
            </button>

            <nav className="flex items-center gap-2 sm:gap-3 text-xs font-extrabold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setTab("pelada")}
                className={
                  "ote-nav-link transition hover:text-[#FF5400] " +
                  (tab === "pelada" ? "text-[#FF5400]" : "text-white")
                }
              >
                EVENTOS
              </button>
              <span className="text-white/50 select-none">|</span>
              <button
                type="button"
                onClick={goSouAluno}
                className={
                  "ote-nav-link transition hover:text-[#FF5400] " +
                  (tab === "painel" ||
                  (tab === "login" && loginRedirect === "painel")
                    ? "text-[#FF5400]"
                    : "text-white")
                }
              >
                SOU ALUNO
              </button>
              <span className="text-white/50 select-none">|</span>
              <button
                type="button"
                onClick={goQueroSerAssinante}
                className={
                  "ote-nav-link transition hover:text-[#FF5400] text-right leading-tight " +
                  (tab === "assinante" ||
                  (tab === "login" && loginRedirect === "assinante")
                    ? "text-[#FF5400]"
                    : "text-white")
                }
              >
                QUERO SER ASSINANTE
              </button>
            </nav>
          </div>

          {/* Sub-barra rápida de sessão / simulador de login para testes */}
          <div className="bg-[#111317] border-t border-white/10 px-3.5 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[#9CA3AF]">Sessão:</span>
              <span className="font-extrabold text-white truncate">
                {role === "visitante"
                  ? "👤 Visitante (Deslogado)"
                  : role === "admin"
                    ? "🔑 Administrador"
                    : role === "professor"
                      ? "🧑‍🏫 Professor"
                      : `${me?.tipo === "aluno" ? "⚡" : "🏀"} ${me?.nome}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={String(sid)}
                onChange={(e) => {
                  const v = e.target.value;
                  const nextSid =
                    v === "visitante" || v === "prof" || v === "admin"
                      ? v
                      : Number(v);
                  setSid(nextSid);
                  if (nextSid === "admin") {
                    setStaffSubTab("cm");
                  } else if (nextSid === "prof") {
                    setStaffSubTab("av");
                  }
                }}
                className="bg-black/60 border border-white/15 text-white text-xs font-bold rounded-lg px-2 py-1 max-w-[145px] outline-none"
                aria-label="Trocar Perfil"
              >
                <option value="visitante">👤 Visitante (Deslogado)</option>
                <optgroup label="⚡ Alunos Hezi Skills">
                  {users
                    .filter((x) => x.tipo === "aluno")
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.st === "ativo" ? "🟢" : "🔴"} {x.nome}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="🏀 Jogador Grátis">
                  {users
                    .filter((x) => x.tipo === "jogador")
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        🏀 {x.nome}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Staff">
                  <option value="prof">🧑‍🏫 Professor</option>
                  <option value="admin">🔑 Administrador</option>
                </optgroup>
              </select>

              {role !== "visitante" && (
                <button
                  type="button"
                  onClick={() => {
                    setSid("visitante");
                    setTab("home");
                    say("Você saiu da conta.");
                  }}
                  className="p-1 rounded-lg bg-white/10 text-white hover:bg-[#EF4444] transition"
                  title="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {staff && (
            <div
              className={
                "text-center text-xs font-extrabold py-1 tracking-wide " +
                (role === "admin"
                  ? "bg-[#FF5400] text-white"
                  : "bg-[#10B981] text-white")
              }
            >
              {role === "admin"
                ? "🔑 MODO ADMINISTRADOR ATIVO (COURT MASTER + EDIÇÃO GERAL)"
                : "👑 MODO PROFESSOR ATIVO (AVALIAÇÃO & CHECK-IN EM QUADRA)"}
            </div>
          )}
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto pb-6">
          {tab === "home" ? (
            <Home S={S} />
          ) : tab === "pelada" ? (
            <Pelada S={S} />
          ) : tab === "login" ? (
            <LoginPage
              S={S}
              redirectAfter={loginRedirect}
              onLoginSuccess={(chosenSid) => {
                setSid(chosenSid);
                if (chosenSid === "admin") setStaffSubTab("cm");
                else if (chosenSid === "prof") setStaffSubTab("av");

                if (loginRedirect === "assinante") {
                  setTab("assinante");
                  say("Login realizado! Confira as vantagens de ser assinante.");
                } else {
                  setTab("painel");
                  say("Bem-vindo de volta!");
                }
              }}
              onOpenRegister={() => setCad(true)}
            />
          ) : tab === "assinante" ? (
            <AssinantePage S={S} />
          ) : staff ? (
            <Staff
              S={S}
              key={role}
              initialSubTab={staffSubTab}
              onSubTabChange={setStaffSubTab}
            />
          ) : (
            <Painel S={S} />
          )}
        </main>

        {/* Floating Toast Feedback */}
        {toast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#111317] text-white text-xs font-bold rounded-full px-4 py-2.5 z-40 w-max max-w-[90%] text-center shadow-lg">
            {toast}
          </div>
        )}

        {/* Modal Cadastro Rápido */}
        {cad && (
          <Cadastro
            close={() => {
              setCad(false);
              setPend(null);
            }}
            done={reg}
          />
        )}
      </div>
    </div>
  );
}
