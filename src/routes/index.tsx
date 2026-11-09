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
  isEventRollingNow,
  formatTimeHHMM,
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

const AVATAR_ICONS = ["🏀", "⚡", "🔥", "👑", "🎯", "🦁", "🦅", "🛡️", "🚀", "💎"];

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

  if (u.avatarIcon) {
    return (
      <div
        className={
          "rounded-full bg-[#111317] text-white font-extrabold flex items-center justify-center shrink-0 border border-[#FF5400]/40 " +
          s
        }
      >
        <span>{u.avatarIcon}</span>
      </div>
    );
  }

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

interface RegisterFormPayload {
  nome: string;
  apelido: string;
  dataNascimento: string;
  wpp: string;
  instagram: string;
  email: string;
  senha: string;
}

interface AppContextProps {
  users: HeziUser[];
  evs: HeziEventItem[];
  setEvs: (evs: HeziEventItem[]) => void;
  notifications: HeziNotification[];
  me: HeziUser | null;
  role: "visitante" | "jogador" | "aluno" | "professor" | "admin";
  upd: (id: number, patch: Partial<HeziUser>) => void;
  say: (msg: string) => void;
  join: (eid: number) => void;
  approveQueueRequest: (notifId: string) => void;
  rejectQueueRequest: (notifId: string) => void;
  sendGroupInvite: (toUserId: number, eventId: number) => void;
  acceptGroupInvite: (notifId: string) => void;
  rejectGroupInvite: (notifId: string) => void;
  selectedEventId: number | null;
  setSelectedEventId: (id: number | null) => void;
  setTab: (tab: AppTab) => void;
  setCad: (open: boolean) => void;
  openCourtMaster: () => void;
  goMeuPerfil: () => void;
  goQueroSerAssinante: () => void;
  openLoginForAssinante: () => void;
  openRegisterForAssinante: () => void;
}

function validatePasswordRules(pwd: string) {
  const minLen = pwd.length >= 8;
  const hasNumber = /\d/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return {
    minLen,
    hasNumber,
    hasSpecial,
    valid: minLen && hasNumber && hasSpecial,
  };
}

function Cadastro({
  close,
  done,
  existingEmails,
}: {
  close: () => void;
  done: (f: RegisterFormPayload) => void;
  existingEmails: string[];
}) {
  const [f, setF] = useState({
    nome: "",
    apelido: "",
    dataNascimento: "",
    wpp: "",
    instagram: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const pwdCheck = validatePasswordRules(f.senha);
  const passwordsMatch =
    f.senha.length > 0 && f.senha === f.confirmarSenha;
  const emailTrim = f.email.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
  const emailTaken = existingEmails.includes(emailTrim);

  const ok =
    f.nome.trim().length > 1 &&
    f.apelido.trim().length > 1 &&
    f.dataNascimento.trim().length > 0 &&
    f.wpp.replace(/\D/g, "").length >= 10 &&
    f.instagram.trim().length > 1 &&
    isEmailValid &&
    !emailTaken &&
    pwdCheck.valid &&
    passwordsMatch;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-[480px] max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-3 shadow-2xl border border-[#EAEBEF]">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-xl text-[#111317]">
            Crie sua conta
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
        <p className="text-xs text-[#6E7381]">
          Preencha seus dados para acessar seu perfil, entrar na fila dos
          eventos e participar do Hezi Pass.
        </p>

        <div className="space-y-2.5">
          <input
            value={f.nome}
            placeholder="Nome completo"
            onChange={(e) => setF({ ...f, nome: e.target.value })}
            className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <input
              value={f.apelido}
              placeholder="Apelido"
              onChange={(e) => setF({ ...f, apelido: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
            <input
              type="date"
              value={f.dataNascimento}
              title="Data de nascimento"
              onChange={(e) => setF({ ...f, dataNascimento: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-3.5 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <input
              value={f.wpp}
              placeholder="Celular (com DDD)"
              onChange={(e) => setF({ ...f, wpp: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
            <input
              value={f.instagram}
              placeholder="Instagram (@usuario)"
              onChange={(e) => setF({ ...f, instagram: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
          </div>
          <input
            type="email"
            value={f.email}
            placeholder="E-mail"
            onChange={(e) => setF({ ...f, email: e.target.value })}
            className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
          />
          {emailTaken && (
            <p className="text-xs font-bold text-[#EF4444]">
              Este e-mail já está cadastrado.
            </p>
          )}
          <input
            type="password"
            value={f.senha}
            placeholder="Senha"
            onChange={(e) => setF({ ...f, senha: e.target.value })}
            className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
          />

          {/* Requisitos da senha */}
          <div className="bg-[#F4F5F7] rounded-xl p-3 space-y-1 text-xs">
            <p className="font-extrabold text-[#111317] mb-1">
              A senha deve ter, no mínimo:
            </p>
            <p
              className={
                pwdCheck.minLen
                  ? "text-[#10B981] font-bold"
                  : "text-[#6E7381]"
              }
            >
              {pwdCheck.minLen ? "✓" : "•"} 8 caracteres
            </p>
            <p
              className={
                pwdCheck.hasNumber
                  ? "text-[#10B981] font-bold"
                  : "text-[#6E7381]"
              }
            >
              {pwdCheck.hasNumber ? "✓" : "•"} 1 número
            </p>
            <p
              className={
                pwdCheck.hasSpecial
                  ? "text-[#10B981] font-bold"
                  : "text-[#6E7381]"
              }
            >
              {pwdCheck.hasSpecial ? "✓" : "•"} 1 caractere especial (!@#$%&*)
            </p>
          </div>

          <input
            type="password"
            value={f.confirmarSenha}
            placeholder="Confirmar senha"
            onChange={(e) => setF({ ...f, confirmarSenha: e.target.value })}
            className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
          />
          {f.confirmarSenha.length > 0 && !passwordsMatch && (
            <p className="text-xs font-bold text-[#EF4444]">
              As senhas não coincidem.
            </p>
          )}
        </div>

        <Btn
          dis={!ok}
          onClick={() =>
            done({
              nome: f.nome,
              apelido: f.apelido,
              dataNascimento: f.dataNascimento,
              wpp: f.wpp,
              instagram: f.instagram,
              email: emailTrim,
              senha: f.senha,
            })
          }
          c={OB}
        >
          <CheckCircle2 className="w-4 h-4" />
          Concluir Cadastro e Continuar
        </Btn>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PÁGINA DE LOGIN (E-MAIL + SENHA + RATE LIMIT DE SEGURANÇA)
// ---------------------------------------------------------------------------
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

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
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (lockoutUntil <= Date.now()) return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNowTick(current);
      if (current >= lockoutUntil) {
        setLockoutUntil(0);
        setFailedAttempts(0);
        setErrorMsg("");
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil > nowTick;
  const secondsRemaining = isLockedOut
    ? Math.ceil((lockoutUntil - nowTick) / 1000)
    : 0;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !senha) {
      setErrorMsg("Informe seu e-mail e sua senha.");
      return;
    }

    // Check staff credentials
    if (cleanEmail === "admin@hezi.com" && senha === "Admin@2026") {
      setFailedAttempts(0);
      setErrorMsg("");
      onLoginSuccess("admin");
      return;
    }
    if (cleanEmail === "professor@hezi.com" && senha === "Prof@2026") {
      setFailedAttempts(0);
      setErrorMsg("");
      onLoginSuccess("prof");
      return;
    }

    // Check registered users
    const matchedUser = S.users.find(
      (u) =>
        (u.email?.toLowerCase() ?? "") === cleanEmail &&
        (u.senha ?? "Hezi@2026") === senha,
    );

    if (matchedUser) {
      setFailedAttempts(0);
      setErrorMsg("");
      onLoginSuccess(matchedUser.id);
      return;
    }

    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutUntil(until);
      setNowTick(Date.now());
      setErrorMsg(
        "Limite de tentativas excedido (Rate Limit). Aguarde 60 segundos.",
      );
    } else {
      setErrorMsg(
        `E-mail ou senha inválidos. Restam ${MAX_LOGIN_ATTEMPTS - nextAttempts} tentativa(s) antes do bloqueio temporário.`,
      );
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
                : "Entre com seu e-mail e senha para acessar seu Perfil"}
            </p>
          </div>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381] mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              disabled={isLockedOut}
              placeholder="seuemail@exemplo.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-sm font-medium text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381] mb-1">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              disabled={isLockedOut}
              placeholder="Digite sua senha"
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-sm font-medium text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
            />
          </div>

          {errorMsg && (
            <div className="bg-[#FEF2F2] border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold rounded-xl p-3">
              ⚠️ {errorMsg}
              {isLockedOut && (
                <span className="n block mt-1 text-sm font-extrabold">
                  Bloqueio temporário: {secondsRemaining}s restantes
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLockedOut}
            className={
              btBase +
              OB +
              (isLockedOut ? " opacity-60 cursor-not-allowed" : "")
            }
          >
            <LogIn className="w-4 h-4" />
            {isLockedOut
              ? `Bloqueado (${secondsRemaining}s)`
              : "Entrar na Plataforma"}
          </button>
        </form>

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

        <Btn onClick={onOpenRegister} c="bg-[#111317] text-white">
          <UserPlus className="w-4 h-4 text-[#FF5400]" />
          Cadastrar-se Grátis Agora
        </Btn>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PÁGINA "QUERO SER ASSINANTE" (BLOQUEADA PARA VISITANTE SEM CONTA)
// ---------------------------------------------------------------------------
function AssinantePage({ S }: { S: AppContextProps }) {
  if (S.role === "visitante" && !S.me) {
    return (
      <div className="p-4 space-y-4">
        <div className={C + " p-6 text-center space-y-3"}>
          <div className="w-14 h-14 rounded-full bg-[#FFF4EE] text-[#FF5400] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-xl text-[#111317]">
            Área Exclusiva · Quero ser assinante
          </h2>
          <p className="text-sm text-[#6E7381]">
            Para acessar as vantagens da assinatura Hezi Skills e solicitar sua
            vaga, faça login na sua conta ou crie uma conta grátis agora.
          </p>
          <div className="space-y-2.5 pt-1">
            <Btn onClick={S.openLoginForAssinante} c={OB}>
              <LogIn className="w-4 h-4" />
              Fazer Login
            </Btn>
            <Btn onClick={S.openRegisterForAssinante} c="bg-[#111317] text-white">
              <UserPlus className="w-4 h-4 text-[#FF5400]" />
              Criar uma Conta
            </Btn>
          </div>
        </div>
      </div>
    );
  }

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
            Meu Perfil
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
                  <Chip c="bg-[#111317] text-white">{queueCount} na fila</Chip>
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
          <div className="space-y-3">
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
                      {queueCount} na fila
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

      {/* Card Principal: Regras + Botão Entrar na fila */}
      <div className={C + " p-4 space-y-3"}>
        {selectedEvent.r && (
          <p className="text-xs bg-[#F4F5F7] rounded-lg p-2.5 text-[#111317] font-medium">
            📋 {selectedEvent.r}
          </p>
        )}

        {isPeladaOfficial ? (
          myCourtStatus && myCourtStatus.status !== "not-in-pelada" ? (
            <div className="bg-[#ECFDF5] border border-[#10B981]/40 rounded-xl p-3.5 space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#10B981]">
                ✓ Seu Status na Pelada (+5 HP garantidos)
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
              {canInviteOthers && (
                <p className="text-xs text-[#6E7381] pt-1">
                  💡 Quer jogar junto com alguém da fila? Toque em{" "}
                  <strong className="text-[#FF5400]">+ Grupo</strong> ao lado do
                  nome do jogador abaixo para enviar solicitação de time!
                </p>
              )}
            </div>
          ) : myPendingQueueRequest ? (
            <div className="bg-[#FFF4EE] border border-[#FF5400]/40 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#FF5400]">
                  ⏳ Solicitação Enviada ao Organizador
                </p>
                <span className="n text-xs font-bold text-[#6E7381]">
                  🕒 {myPendingQueueRequest.timeLabel}
                </span>
              </div>
              <p className="text-xs text-[#111317] font-medium">
                Assim que o Administrador ou Professor aceitar sua entrada nas
                notificações, você entrará na fila e ganhará{" "}
                <strong className="text-[#FF5400]">+5 Hezi Points</strong>!
              </p>
            </div>
          ) : (
            <Btn onClick={() => S.join(selectedEvent.id)} c={OB}>
              Entrar na fila
            </Btn>
          )
        ) : isInSimpleEventQueue ? (
          <div className="bg-[#ECFDF5] border border-[#10B981]/40 rounded-xl p-3.5 space-y-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#10B981]">
              ✓ Presença Confirmada na Fila (+5 HP)
            </p>
            <p className="text-sm font-extrabold text-[#111317]">
              Você está na posição #{selectedEvent.f.indexOf(S.me!.id) + 1} deste evento.
            </p>
          </div>
        ) : myPendingQueueRequest ? (
          <div className="bg-[#FFF4EE] border border-[#FF5400]/40 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#FF5400]">
                ⏳ Solicitação Enviada ao Organizador
              </p>
              <span className="n text-xs font-bold text-[#6E7381]">
                🕒 {myPendingQueueRequest.timeLabel}
              </span>
            </div>
            <p className="text-xs text-[#111317] font-medium">
              Aguardando confirmação do Administrador/Professor para entrar na
              fila e receber{" "}
              <strong className="text-[#FF5400]">+5 Hezi Points</strong>.
            </p>
          </div>
        ) : (
          <Btn onClick={() => S.join(selectedEvent.id)} c={OB}>
            Entrar na fila
          </Btn>
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
                Nenhum jogador na fila de espera no momento. Toque em
                &ldquo;Entrar na fila&rdquo; acima!
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
                        {(p.role === "aluno" ||
                          (heziUser?.tipo === "aluno" &&
                            heziUser.st === "ativo")) && (
                          <Chip c="bg-[#FFF4EE] text-[#FF5400]">ALUNO VIP</Chip>
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
                    {usr.tipo === "aluno" && usr.st === "ativo" && (
                      <Chip c="bg-[#FFF4EE] text-[#FF5400]">ALUNO VIP</Chip>
                    )}
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
        🔒 Ficha individual privada · Ciclo de avaliação técnica Mensal.
      </p>
    </div>
  );
}

function ProfileEditModal({
  u,
  close,
  save,
}: {
  u: HeziUser;
  close: () => void;
  save: (patch: Partial<HeziUser>) => void;
}) {
  const [f, setF] = useState({
    nome: u.nome || "",
    apelido: u.apelido || "",
    dataNascimento: u.dataNascimento || "",
    wpp: u.wpp || "",
    instagram: u.instagram || "",
    email: u.email || "",
    foto: u.foto || "",
    avatarIcon: u.avatarIcon || "",
    novaSenha: "",
  });

  const pwdValid =
    f.novaSenha.length === 0 || validatePasswordRules(f.novaSenha).valid;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-[480px] max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl border border-[#EAEBEF]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#FF5400]" />
            <h3 className="font-extrabold text-xl text-[#111317]">
              Editar Meu Perfil
            </h3>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-[#6E7381] hover:text-[#111317] p-1.5 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção de Ícone de Perfil */}
        <div className="bg-[#F4F5F7] rounded-2xl p-3.5 space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#6E7381]">
            Escolha um Ícone de Perfil
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setF({ ...f, avatarIcon: "" })}
              className={
                "px-3 py-1.5 rounded-xl text-xs font-extrabold transition " +
                (!f.avatarIcon
                  ? "bg-[#111317] text-white"
                  : "bg-white text-[#6E7381] border border-[#EAEBEF]")
              }
            >
              Foto / Iniciais
            </button>
            {AVATAR_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setF({ ...f, avatarIcon: ic })}
                className={
                  "w-10 h-10 rounded-xl text-lg flex items-center justify-center transition " +
                  (f.avatarIcon === ic
                    ? "bg-[#FF5400] text-white ring-2 ring-[#111317]"
                    : "bg-white border border-[#EAEBEF]")
                }
              >
                {ic}
              </button>
            ))}
          </div>
          {!f.avatarIcon && (
            <input
              value={f.foto}
              placeholder="URL da foto de perfil (opcional)"
              onChange={(e) => setF({ ...f, foto: e.target.value })}
              className="w-full bg-white border border-[#EAEBEF] rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:ring-2 ring-[#FF5400] mt-1"
            />
          )}
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-bold text-[#6E7381] mb-1">
              Nome completo
            </label>
            <input
              value={f.nome}
              onChange={(e) => setF({ ...f, nome: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#6E7381] mb-1">
                Apelido
              </label>
              <input
                value={f.apelido}
                onChange={(e) => setF({ ...f, apelido: e.target.value })}
                className="w-full bg-[#F4F5F7] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6E7381] mb-1">
                Data de nascimento
              </label>
              <input
                type="date"
                value={f.dataNascimento}
                onChange={(e) =>
                  setF({ ...f, dataNascimento: e.target.value })
                }
                className="w-full bg-[#F4F5F7] rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#6E7381] mb-1">
                Celular
              </label>
              <input
                value={f.wpp}
                onChange={(e) => setF({ ...f, wpp: e.target.value })}
                className="w-full bg-[#F4F5F7] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6E7381] mb-1">
                Instagram
              </label>
              <input
                value={f.instagram}
                onChange={(e) => setF({ ...f, instagram: e.target.value })}
                className="w-full bg-[#F4F5F7] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#6E7381] mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#6E7381] mb-1">
              Nova senha (deixe em branco para manter a atual)
            </label>
            <input
              type="password"
              value={f.novaSenha}
              placeholder="Mín. 8 caracteres, 1 número e 1 especial"
              onChange={(e) => setF({ ...f, novaSenha: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
            {!pwdValid && (
              <p className="text-xs font-bold text-[#EF4444] mt-1">
                A nova senha precisa ter no mínimo 8 caracteres, 1 número e 1
                caractere especial.
              </p>
            )}
          </div>
        </div>

        <Btn
          dis={!f.nome.trim() || !pwdValid}
          onClick={() => {
            const patch: Partial<HeziUser> = {
              nome: f.nome.trim(),
              apelido: f.apelido.trim(),
              dataNascimento: f.dataNascimento,
              wpp: f.wpp.trim(),
              instagram: f.instagram.trim(),
              email: f.email.trim().toLowerCase(),
              foto: f.foto.trim() || undefined,
              avatarIcon: f.avatarIcon || undefined,
            };
            if (f.novaSenha) {
              patch.senha = f.novaSenha;
            }
            save(patch);
          }}
          c={OB}
        >
          <CheckCircle2 className="w-4 h-4" />
          Salvar Alterações
        </Btn>
      </div>
    </div>
  );
}

function Painel({ S }: { S: AppContextProps }) {
  const u = S.me;
  const [editOpen, setEditOpen] = useState(false);

  if (!u) {
    return (
      <div className="p-4 space-y-4">
        <div className={C + " p-6 text-center space-y-3"}>
          <div className="w-14 h-14 rounded-full bg-[#FFF4EE] text-[#FF5400] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-xl text-[#111317]">
            Meu Perfil Bloqueado
          </h2>
          <p className="text-sm text-[#6E7381]">
            Crie uma conta para desbloquear seu perfil, participar do Hezi Pass
            e entrar na fila dos eventos.
          </p>
          <div className="space-y-2.5 pt-1">
            <Btn onClick={() => S.setCad(true)} c={OB}>
              Criar Conta
            </Btn>
            <Btn
              onClick={() => S.setTab("login")}
              c="bg-[#111317] text-white"
            >
              Já tenho conta · Fazer Login
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  // Área do Usuário Comum OU Ex-Aluno (cujos dados de assinante continuam salvos no banco, mas exibe perfil comum)
  if (u.tipo === "jogador" || (u.tipo === "aluno" && u.st === "ex_aluno")) {
    return (
      <div className="p-4 space-y-4">
        <div className={C + " p-4 flex gap-3 items-center"}>
          <Av u={u} />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base text-[#111317] truncate">
              {u.nome}
            </p>
            {(u.apelido || u.instagram) && (
              <p className="text-xs text-[#6E7381] truncate">
                {[u.apelido, u.instagram].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#F4F5F7] hover:bg-[#EAEBEF] text-[#111317] flex items-center justify-center shrink-0 transition"
            title="Configurações do Perfil (Alterar dados e ícone)"
            aria-label="Editar Perfil"
          >
            <Settings className="w-5 h-5 text-[#111317]" />
          </button>
        </div>

        <Pass u={u} />

        {editOpen && (
          <ProfileEditModal
            u={u}
            close={() => setEditOpen(false)}
            save={(patch) => {
              S.upd(u.id, patch);
              setEditOpen(false);
              S.say("Dados e ícone de perfil atualizados!");
            }}
          />
        )}
      </div>
    );
  }

  // Aluno Hezi Skills (Assinante Regular ou com Mensalidade Pendente — sem bloqueio de acesso!)
  const sub = u.sub || baseSub;
  const isPaymentPending = u.st === "pendente" || u.st === "inativo";

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
              {u.pos ? `${u.pos} · ` : ""}Turma Terça 16:30
            </p>
            {isPaymentPending ? (
              <Chip c={RED}>🔴 Mensalidade Pendente</Chip>
            ) : (
              <Chip c={GRN}>🟢 Matrícula Regular</Chip>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center bg-[#FFF4EE] px-3.5 py-2 rounded-2xl border border-[#FF5400]/20">
              <p className="n font-bold text-4xl text-[#FF5400] leading-none">
                {ovr(sub)}
              </p>
              <p className="text-xs font-extrabold text-[#6E7381] mt-0.5">
                OVR
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="w-10 h-10 rounded-xl bg-[#F4F5F7] hover:bg-[#EAEBEF] text-[#111317] flex items-center justify-center shrink-0 transition"
              title="Configurações do Perfil (Alterar dados e ícone)"
              aria-label="Editar Perfil"
            >
              <Settings className="w-5 h-5 text-[#111317]" />
            </button>
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

      {editOpen && (
        <ProfileEditModal
          u={u}
          close={() => setEditOpen(false)}
          save={(patch) => {
            S.upd(u.id, patch);
            setEditOpen(false);
            S.say("Dados e ícone de perfil atualizados!");
          }}
        />
      )}
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
  const al = S.users.filter((x) => x.tipo === "aluno" && x.st !== "ex_aluno");
  const [id, setId] = useState<number>(al[0]?.id ?? 1);
  const ci = "Mensal";
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

  const al = u.tipo === "aluno" && u.st !== "ex_aluno";
  const A: [string, number, number][] = al
    ? [
        ["+10 HP & +1 🔥 (Treino Pago de Terça-feira)", 10, 1],
        ["+10 HP (Presença na Pelada Aberta · 2x Aluno)", 10, 0],
        ["+20 HP & +1 🔥 (Combo Treino + Pelada na Semana)", 20, 1],
        ["+100 HP (Evento Especial Aluno Hezi)", 100, 0],
      ]
    : [
        ["+5 HP (Presença na Pelada · Jogador Comum)", 5, 0],
        ["+50 HP (Evento Especial · Jogador Comum)", 50, 0],
      ];

  const getStatusLabel = (st?: HeziUser["st"]) => {
    if (st === "ex_aluno") return "⚪ Ex-Aluno (Comum)";
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
      <p className="text-xs text-[#6E7381] px-1">
        Gerencie alunos, mensalidades, promoções para Professor e check-ins de
        quadra:
      </p>

      {S.users.map((x) => (
        <div
          key={x.id}
          onClick={() => setSel(x.id)}
          className={
            C +
            " p-3 space-y-2.5 cursor-pointer transition " +
            (x.id === sel ? "ring-2 ring-[#FF5400] bg-[#FFF4EE]/30" : "")
          }
        >
          <div className="flex items-center gap-3">
            <Av u={x} s="w-10 h-10 text-sm" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#111317] truncate">
                {x.nome}
              </p>
              <p className="text-xs text-[#6E7381]">
                {x.tipo === "aluno"
                  ? x.st === "ex_aluno"
                    ? "Ex-Aluno (Exibido como Comum)"
                    : "Aluno Hezi Skills"
                  : x.tipo === "professor"
                    ? "🧑‍🏫 Professor (Organizador)"
                    : "Usuário Comum"}{" "}
                · <span className="n font-bold text-[#FF5400]">{x.hp} HP</span>
                {x.tipo === "aluno" && x.st !== "ex_aluno"
                  ? ` · 🔥 ${x.of ?? 0} sem.`
                  : ""}
              </p>
            </div>

            {x.tipo === "aluno" ? (
              <Chip c={getStatusChipClass(x.st)}>{getStatusLabel(x.st)}</Chip>
            ) : x.tipo === "professor" ? (
              <Chip c="bg-[#ECFDF5] text-[#10B981]">🧑‍🏫 Professor</Chip>
            ) : null}
          </div>

          {/* Controles exclusivos do Administrador: Status de Mensalidade/Ex-Aluno ou Promoção para Professor */}
          {S.role === "admin" && (
            <div
              className="pt-2 border-t border-[#EAEBEF] flex flex-wrap items-center justify-between gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {x.tipo === "aluno" ? (
                <>
                  <span className="text-[11px] font-extrabold uppercase text-[#6E7381]">
                    Situação:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        ["ativo", "🟢 Regular"],
                        ["pendente", "🔴 Pendente"],
                        ["ex_aluno", "⚪ Ex-Aluno"],
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
                                  ? "Matrícula Regular"
                                  : stKey === "pendente"
                                    ? "Mensalidade Pendente (acesso liberado com aviso em vermelho)"
                                    : "Ex-Aluno (dados preservados, exibido como usuário comum)"
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
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-extrabold uppercase text-[#6E7381]">
                    Cargo / Poderes:
                  </span>
                  {x.tipo === "jogador" ? (
                    <button
                      type="button"
                      onClick={() => {
                        S.upd(x.id, { tipo: "professor" });
                        S.say(
                          `${x.nome} foi promovido a Professor! Agora possui todos os poderes de organização e avaliação.`,
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
                </>
              )}
            </div>
          )}
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
            Modo Professor: apenas o Administrador pode promover usuários ou
            alterar situação de matrícula.
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
  const maxTeamSize = getMaxTeamSize(peladaStore.gameFormat);

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
          placeholder="Dia e horário (ex: Terça · 19:00 ou Sábado · 17:00)"
          onChange={(e) => setF({ ...f, q: e.target.value })}
          className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm outline-none"
        />
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
          placeholder="Regras (ex: Regras Fiba, 7 pontos ou 7 minutos)"
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
                    const nextLive = !e.aoVivoAgora;
                    S.setEvs(
                      S.evs.map((x) =>
                        x.id === e.id ? { ...x, aoVivoAgora: nextLive } : x,
                      ),
                    );
                    S.say(
                      nextLive
                        ? `"${e.t}" destacado como "Está rolando" na Home!`
                        : `Destaque manual removido de "${e.t}".`,
                    );
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
        );
      })}
    </div>
  );
}

function NotificacoesStaff({ S }: { S: AppContextProps }) {
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
              Aceite solicitações para liberar a entrada na fila e conceder +5
              Hezi Points
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
          pendingRequests.map((req) => (
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
                    </strong>
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
                  Aceitar (+5 HP)
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
          ))
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
                  Horário da notificação: <strong>{req.timeLabel}</strong>
                </p>
              </div>
              <Chip c={req.status === "accepted" ? GRN : RED}>
                {req.status === "accepted"
                  ? "✓ Aceito (+5 HP)"
                  : "✕ Recusado"}
              </Chip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificacoesPlayerModal({
  S,
  close,
}: {
  S: AppContextProps;
  close: () => void;
}) {
  const myId = S.me?.id;
  const myNotifs = S.notifications.filter(
    (n) =>
      (n.toUserId !== undefined && n.toUserId === myId) ||
      (n.type === "queue_request" && n.fromUserId === myId),
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-[480px] max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl border border-[#EAEBEF]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#FF5400]" />
            <h3 className="font-extrabold text-xl text-[#111317]">
              Minhas Notificações
            </h3>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-[#6E7381] hover:text-[#111317] p-1.5 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {myNotifs.length === 0 ? (
          <p className="text-xs text-[#6E7381] py-6 text-center">
            Você ainda não possui notificações. Convites de grupo na fila e
            confirmações de entrada aparecerão aqui com horário.
          </p>
        ) : (
          <div className="space-y-2.5">
            {myNotifs.map((n) => (
              <div
                key={n.id}
                className="bg-[#F4F5F7] border border-[#EAEBEF] rounded-2xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#FF5400]">
                    {n.type === "group_invite"
                      ? "👥 Convite para Grupo na Fila"
                      : n.type === "queue_request"
                        ? "🏀 Solicitação de Fila"
                        : "⚡ Aviso Hezi"}
                  </span>
                  <span className="n text-xs font-bold text-[#6E7381]">
                    🕒 {n.timeLabel}
                  </span>
                </div>

                <p className="text-xs font-semibold text-[#111317]">
                  {n.message ||
                    (n.type === "group_invite"
                      ? `${n.fromUserName} convidou você para formar um time na fila (${n.eventTitle || "Pelada"}).`
                      : `Solicitação para entrar em ${n.eventTitle || "Evento"}: ${
                          n.status === "pending"
                            ? "Aguardando aceitação do organizador"
                            : n.status === "accepted"
                              ? "Confirmada! Você entrou na fila e ganhou +5 HP!"
                              : "Não aprovada"
                        }`)}
                </p>

                {n.type === "group_invite" && n.status === "pending" && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        S.acceptGroupInvite(n.id);
                        close();
                      }}
                      className="rounded-xl bg-[#10B981] text-white text-xs font-extrabold py-2 px-3 transition"
                    >
                      ✓ Aceitar e Formar Time
                    </button>
                    <button
                      type="button"
                      onClick={() => S.rejectGroupInvite(n.id)}
                      className="rounded-xl bg-white border border-[#EAEBEF] text-[#6E7381] text-xs font-extrabold py-2 px-3 transition"
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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

type StaffSubTabKey = "cm" | "nf" | "ev" | "av" | "al" | "db";

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
  const pendingStaffCount = S.notifications.filter(
    (n) => n.type === "queue_request" && n.status === "pending",
  ).length;

  const T: [StaffSubTabKey, string][] = [
    ["cm", "Court Master"],
    [
      "nf",
      pendingStaffCount > 0
        ? `Notificações (${pendingStaffCount})`
        : "Notificações",
    ],
    ["ev", "Eventos"],
    ["av", "Avaliar"],
    ["al", "Alunos"],
    ...(adm ? ([["db", "Banco SQL"]] as [StaffSubTabKey, string][]) : []),
  ];
  const [t, setT] = useState<StaffSubTabKey>(initialSubTab || "cm");

  useEffect(() => {
    if (initialSubTab) setT(initialSubTab);
  }, [initialSubTab]);

  const handleSelect = (k: StaffSubTabKey) => {
    setT(k);
    onSubTabChange?.(k);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
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

      {t === "nf" ? (
        <NotificacoesStaff S={S} />
      ) : t === "av" ? (
        <Avaliar S={S} />
      ) : t === "al" ? (
        <Alunos S={S} />
      ) : t === "ev" ? (
        <Eventos S={S} />
      ) : t === "db" && adm ? (
        <BancoDados S={S} />
      ) : (
        <div className="space-y-3">
          <div className={C + " p-3 flex items-center justify-between"}>
            <div>
              <p className="font-extrabold text-sm text-[#111317]">
                Court Master · Organizador de Pelada (3x3 / 5x5)
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

  const {
    users,
    evs,
    notifications,
    updUser,
    addUser,
    setEvs,
    addQueue,
    addNotification,
    updateNotification,
  } = useHeziPlatform();
  const { sid, setSid } = useHeziSession();
  const peladaStore = usePelada();

  const [tab, setTab] = useState<AppTab>("home");
  const [loginRedirect, setLoginRedirect] = useState<"painel" | "assinante">(
    "painel",
  );
  const [staffSubTab, setStaffSubTab] = useState<StaffSubTabKey>("cm");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
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
    window.setTimeout(() => setToast(""), 2800);
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

  // Navegação inteligente para "MEU PERFIL"
  // Se for visitante sem conta, abre a tela de Meu Perfil bloqueada solicitando criar uma conta
  const goMeuPerfil = () => {
    setLoginRedirect("painel");
    setTab("painel");
  };

  // Navegação para "QUERO SER ASSINANTE"
  // Se for visitante sem conta, exibe a tela Quero Ser Assinante bloqueada solicitando login ou cadastro
  const goQueroSerAssinante = () => {
    setLoginRedirect("assinante");
    setTab("assinante");
  };

  const openLoginForAssinante = () => {
    setLoginRedirect("assinante");
    setTab("login");
  };

  const openRegisterForAssinante = () => {
    setLoginRedirect("assinante");
    setCad(true);
  };

  const sendQueueRequestForUser = (u: HeziUser, eid: number) => {
    const targetEv = evs.find((e) => e.id === eid);
    if (!targetEv) return;

    if (targetEv.f.includes(u.id)) {
      say("Você já está confirmado na fila deste evento!");
      return;
    }

    const alreadyPending = notifications.some(
      (n) =>
        n.type === "queue_request" &&
        n.fromUserId === u.id &&
        n.eventId === eid &&
        n.status === "pending",
    );
    if (alreadyPending) {
      say("Sua solicitação já foi enviada e aguarda aprovação do Admin! ⏳");
      return;
    }

    const nowTs = Date.now();
    addNotification({
      id: `notif-q-${nowTs}-${u.id}`,
      type: "queue_request",
      fromUserId: u.id,
      fromUserName: u.nome,
      eventId: targetEv.id,
      eventTitle: targetEv.t,
      status: "pending",
      createdAt: nowTs,
      timeLabel: formatTimeHHMM(nowTs),
      message: `${u.nome} solicitou entrar na fila de "${targetEv.t}". Ao aprovar, entra na fila e ganha +5 Hezi Points.`,
    });

    say(
      "Solicitação enviada ao Administrador! Assim que aceita, você entra na fila e ganha +5 HP 🏀",
    );
  };

  const join = (eid: number) => {
    if (role === "professor" || role === "admin") {
      return say(
        "Acesse Notificações ou Court Master para gerenciar a fila dos jogadores",
      );
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
    sendQueueRequestForUser(me, eid);
  };

  const approveQueueRequest = (notifId: string) => {
    const n = notifications.find((x) => x.id === notifId);
    if (!n || n.status !== "pending") return;

    updateNotification(notifId, { status: "accepted" });

    const targetUser = users.find((u) => u.id === n.fromUserId);
    const targetEv = evs.find((e) => e.id === n.eventId);

    if (targetEv && targetUser) {
      addQueue(targetEv.id, targetUser.id);
      if (targetEv.tp === "Pelada") {
        syncUserToCourtMaster(targetUser);
      }
      // Concede +5 Hezi Points por participar do evento/pelada
      updUser(targetUser.id, { hp: targetUser.hp + 5 });

      const nowTs = Date.now();
      addNotification({
        id: `notif-info-${nowTs}-${targetUser.id}`,
        type: "system",
        fromUserId: me?.id || 0,
        fromUserName: role === "admin" ? "Administrador" : "Professor",
        toUserId: targetUser.id,
        eventId: targetEv.id,
        eventTitle: targetEv.t,
        status: "accepted",
        createdAt: nowTs,
        timeLabel: formatTimeHHMM(nowTs),
        message: `Sua entrada em "${targetEv.t}" foi aprovada! Você entrou na fila e ganhou +5 Hezi Points (+5 HP)! 🏀`,
      });

      say(
        `✅ ${targetUser.nome} aprovado na fila e recebeu +5 Hezi Points!`,
      );
    }
  };

  const rejectQueueRequest = (notifId: string) => {
    const n = notifications.find((x) => x.id === notifId);
    if (!n || n.status !== "pending") return;
    updateNotification(notifId, { status: "rejected" });
    say(`Solicitação de ${n.fromUserName} recusada.`);
  };

  const sendGroupInvite = (toUserId: number, eventId: number) => {
    if (!me) {
      return say("Faça login para convidar jogadores para o seu grupo!");
    }
    if (me.id === toUserId) return;

    const toUser = users.find((u) => u.id === toUserId);
    const targetEv = evs.find((e) => e.id === eventId);
    if (!toUser || !targetEv) return;

    const alreadyInvited = notifications.some(
      (n) =>
        n.type === "group_invite" &&
        n.fromUserId === me.id &&
        n.toUserId === toUser.id &&
        n.eventId === eventId &&
        n.status === "pending",
    );
    if (alreadyInvited) {
      return say(`Você já enviou convite de grupo para ${toUser.nome}!`);
    }

    const nowTs = Date.now();
    addNotification({
      id: `notif-grp-${nowTs}-${me.id}-${toUser.id}`,
      type: "group_invite",
      fromUserId: me.id,
      fromUserName: me.nome,
      toUserId: toUser.id,
      toUserName: toUser.nome,
      eventId: targetEv.id,
      eventTitle: targetEv.t,
      status: "pending",
      createdAt: nowTs,
      timeLabel: formatTimeHHMM(nowTs),
      message: `${me.nome} convidou você para formar um grupo/time na fila de "${targetEv.t}".`,
    });

    say(`Convite de grupo enviado para ${toUser.nome}! 🤝`);
  };

  const acceptGroupInvite = (notifId: string) => {
    const n = notifications.find((x) => x.id === notifId);
    if (!n || n.status !== "pending") return;

    const fromUser = users.find((u) => u.id === n.fromUserId);
    const toUser = users.find((u) => u.id === n.toUserId);

    if (!fromUser || !toUser) return;

    // Garante que ambos estejam sincronizados no Court Master
    syncUserToCourtMaster(fromUser);
    syncUserToCourtMaster(toUser);

    const res = peladaStore.groupPlayersByUser(
      {
        userId: String(fromUser.id),
        name: fromUser.nome,
        role: fromUser.tipo === "aluno" ? "aluno" : "convencional",
      },
      {
        userId: String(toUser.id),
        name: toUser.nome,
        role: toUser.tipo === "aluno" ? "aluno" : "convencional",
      },
    );

    if (!res.ok) {
      return say(res.reason || "Não foi possível formar o grupo.");
    }

    updateNotification(notifId, { status: "accepted" });

    const nowTs = Date.now();
    addNotification({
      id: `notif-grp-ok-${nowTs}`,
      type: "system",
      fromUserId: toUser.id,
      fromUserName: toUser.nome,
      toUserId: fromUser.id,
      eventId: n.eventId,
      eventTitle: n.eventTitle,
      status: "accepted",
      createdAt: nowTs,
      timeLabel: formatTimeHHMM(nowTs),
      message: `${toUser.nome} aceitou seu convite! Vocês agora formam o ${res.teamLabel} na fila.`,
    });

    say(
      `🤝 Grupo formado! ${fromUser.nome} e ${toUser.nome} estão juntos no ${res.teamLabel}!`,
    );
  };

  const rejectGroupInvite = (notifId: string) => {
    const n = notifications.find((x) => x.id === notifId);
    if (!n || n.status !== "pending") return;
    updateNotification(notifId, { status: "rejected" });
    say("Convite de grupo recusado.");
  };

  const reg = (f: RegisterFormPayload) => {
    const u: HeziUser = {
      id: Date.now(),
      tipo: "jogador",
      nome: f.nome.trim(),
      apelido: f.apelido.trim(),
      dataNascimento: f.dataNascimento,
      wpp: f.wpp.trim(),
      instagram: f.instagram.trim(),
      email: f.email.trim().toLowerCase(),
      senha: f.senha,
      hp: 0,
    };
    addUser(u);
    setSid(u.id);
    setCad(false);
    if (pend) {
      sendQueueRequestForUser(u, pend);
      setSelectedEventId(pend);
      setPend(null);
      setTab("pelada");
    } else if (
      (tab === "login" || tab === "assinante") &&
      loginRedirect === "assinante"
    ) {
      setTab("assinante");
      say("Cadastro concluído! Veja as vantagens de ser assinante.");
    } else {
      setTab("painel");
      say("Conta criada com sucesso!");
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
    notifications,
    me,
    role,
    upd: updUser,
    say,
    join,
    approveQueueRequest,
    rejectQueueRequest,
    sendGroupInvite,
    acceptGroupInvite,
    rejectGroupInvite,
    setTab,
    setCad,
    openCourtMaster,
    goMeuPerfil,
    goQueroSerAssinante,
    openLoginForAssinante,
    openRegisterForAssinante,
    selectedEventId,
    setSelectedEventId,
  };

  const staff = role === "admin" || role === "professor";
  const isWideCourtMaster =
    staff &&
    (tab === "pelada" || (tab === "painel" && staffSubTab === "cm"));

  const pendingNotifCount = staff
    ? notifications.filter(
        (n) => n.type === "queue_request" && n.status === "pending",
      ).length
    : me
      ? notifications.filter(
          (n) =>
            n.toUserId === me.id &&
            (n.type === "group_invite" ? n.status === "pending" : true),
        ).length
      : 0;

  return (
    <div className="h-dvh w-full flex justify-center bg-[#F4F5F7] text-[#111317] overflow-hidden">
      <div
        className={
          "relative w-full h-full bg-[#FBFBFC] flex flex-col overflow-hidden sm:border-x border-[#EAEBEF] transition-all duration-300 " +
          (isWideCourtMaster ? "max-w-6xl" : "max-w-[480px]")
        }
      >
        {/* BARRA SUPERIOR ESTILO OTE (PRETA COM LOGO HEZI + EVENTOS | MEU PERFIL | QUERO SER ASSINANTE) */}
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
                onClick={() => {
                  setSelectedEventId(null);
                  setTab("pelada");
                }}
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
                onClick={goMeuPerfil}
                className={
                  "ote-nav-link transition hover:text-[#FF5400] " +
                  (tab === "painel" ||
                  (tab === "login" && loginRedirect === "painel")
                    ? "text-[#FF5400]"
                    : "text-white")
                }
              >
                MEU PERFIL
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

          {/* Barra Oficial de Sessão e Notificações (Simulador de login desativado) */}
          <div className="bg-[#111317] border-t border-white/10 px-3.5 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[#9CA3AF]">Conta:</span>
              <span className="font-extrabold text-white truncate">
                {role === "visitante"
                  ? "Visitante (Não autenticado)"
                  : role === "admin"
                    ? "🔑 Administrador"
                    : role === "professor"
                      ? `🧑‍🏫 ${me ? me.nome : "Professor"}`
                      : `${me?.tipo === "aluno" && me?.st !== "ex_aluno" ? "⚡" : "🏀"} ${me?.nome}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {role !== "visitante" && (
                <button
                  type="button"
                  onClick={() => {
                    if (staff) {
                      setStaffSubTab("nf");
                      setTab("painel");
                    } else {
                      setNotifModalOpen(true);
                    }
                  }}
                  className="relative flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 text-xs font-extrabold transition"
                  title="Abrir Notificações"
                >
                  <Bell className="w-3.5 h-3.5 text-[#FF5400]" />
                  <span className="hidden sm:inline">Notificações</span>
                  {pendingNotifCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#FF5400] text-white text-[10px] font-black">
                      {pendingNotifCount}
                    </span>
                  )}
                </button>
              )}

              {role === "visitante" ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRedirect("painel");
                      setTab("login");
                    }}
                    className="rounded-lg bg-[#FF5400] text-white px-2.5 py-1 text-xs font-extrabold hover:bg-[#E04800] transition"
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCad(true)}
                    className="rounded-lg bg-white/10 text-white px-2.5 py-1 text-xs font-extrabold hover:bg-white/20 transition"
                  >
                    Criar Conta
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSid("visitante");
                    setTab("home");
                    say("Você saiu da conta.");
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white hover:bg-[#EF4444] transition text-xs font-bold"
                  title="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          </div>

          {staff && (
            <div
              className={
                "text-center text-xs font-extrabold py-1 tracking-wide flex items-center justify-center gap-2 px-3 " +
                (role === "admin"
                  ? "bg-[#FF5400] text-white"
                  : "bg-[#10B981] text-white")
              }
            >
              <span>
                {role === "admin"
                  ? "🔑 MODO ADMINISTRADOR ATIVO"
                  : "🧑‍🏫 MODO PROFESSOR ATIVO (ORGANIZADOR DE EVENTOS & AVALIAÇÃO)"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStaffSubTab("nf");
                  setTab("painel");
                }}
                className="underline font-black text-white/95 hover:text-white"
              >
                Ver Notificações ({pendingNotifCount})
              </button>
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
                const loggedUser =
                  typeof chosenSid === "number"
                    ? users.find((u) => u.id === chosenSid)
                    : null;
                if (
                  chosenSid === "admin" ||
                  chosenSid === "prof" ||
                  loggedUser?.tipo === "professor"
                ) {
                  setStaffSubTab("cm");
                }

                if (loginRedirect === "assinante") {
                  setTab("assinante");
                  say(
                    "Login realizado! Confira as vantagens de ser assinante.",
                  );
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

        {/* Modal de Notificações do Jogador/Aluno */}
        {notifModalOpen && (
          <NotificacoesPlayerModal
            S={S}
            close={() => setNotifModalOpen(false)}
          />
        )}

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
            existingEmails={users
              .map((u) => (u.email || "").toLowerCase())
              .filter(Boolean)}
          />
        )}
      </div>
    </div>
  );
}
