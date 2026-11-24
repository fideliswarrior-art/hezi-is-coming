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
import { useRealtimeSync, useSyncStatus } from "@/lib/hezi/sync";
import { CourtMasterOrganizer, useTick } from "./pelada";
import { RadarHabilidades } from "@/components/hezi/RadarHabilidades";
import { AssinantePage } from "@/components/hezi/AssinantePage";
import type { AppContextProps, AppTab, StaffSubTabKey } from "@/components/hezi/types";

export const Route = createFileRoute("/")({
  component: HeziSuperApp,
});

const HEZI_LOGO_WHITE = "/assets/hezi-logo.png";
export const SHIRT_FRONT_IMG = "/assets/hezi-shirt-001-front.jpg";
export const SHIRT_BACK_IMG = "/assets/hezi-shirt-001-back.jpg";

const C = "bg-white border border-[#EAEBEF] rounded-2xl shadow-sm";
const OB = "bg-[#FF5400] text-white";
export const GRN = "bg-[#ECFDF5] text-[#10B981]";
export const RED = "bg-[#FEF2F2] text-[#EF4444]";
const btBase =
  "flex items-center justify-center gap-2 w-full text-center rounded-xl py-3.5 px-4 font-extrabold text-sm transition active:scale-95 ";

export type AppTab = "home" | "pelada" | "painel" | "login" | "assinante" | "rankings";

import { Cadastro, EmailVerificationModal, LoginPage, generateSixDigitCode, sanitizeUsername } from "@/components/hezi/AuthComponents";
import { Home, Pelada } from "@/components/hezi/HomeAndEvents";
import { Painel, RankingsPage, NotificacoesPlayerModal } from "@/components/hezi/PlayerProfile";
import { Staff } from "@/components/hezi/AdminPanels";


export async function compressImageFileToDataUrl(
  file: File,
  maxSize = 256,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          }
        } else if (h > maxSize) {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result || ""));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export async function triggerAuthEmailApi(payload: {
  action: "send_verification" | "send_password_reset";
  email: string;
  nome: string;
  code: string;
}): Promise<{ ok: boolean; deliveredVia?: string }> {
  try {
    const res = await fetch("/api/hezi-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return (await res.json()) as { ok: boolean; deliveredVia?: string };
    }
  } catch {
    /* fallback local */
  }
  return { ok: true, deliveredVia: "instant_preview" };
}

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

export const AVATAR_ICONS = ["🏀", "⚡", "🔥", "👑", "🎯", "🦁", "🦅", "🛡️", "🚀", "💎"];

export function Av({
  u,
  s = "w-14 h-14 text-lg",
}: {
  u: HeziUser;
  s?: string;
}) {
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    setImgErr(false);
  }, [u.foto]);

  const initials = (u.nome || "HZ")
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

export interface RegisterFormPayload {
  nome: string;
  username: string;
  apelido: string;
  dataNascimento: string;
  wpp: string;
  instagram: string;
  email: string;
  senha: string;
  foto?: string;
  autorizacaoImagem?: boolean;
  autorizacaoImagemData?: string;
}


function HeziSuperApp() {
  useRealtimeSync();
  const { isOnline, syncError } = useSyncStatus();

  const {
    users,
    evs,
    notifications,
    updUser,
    addUser,
    deleteUser: delUserAction,
    setEvs,
    addQueue,
    removeQueue,
    markEventRewarded,
    addNotification,
    updateNotification,
  } = useHeziPlatform();
  const { sid, setSid } = useHeziSession();
  const peladaStore = usePelada();

  const [tab, setTab] = useState<AppTab>("home");
  const [loginRedirect, setLoginRedirect] = useState<"painel" | "assinante">(
    "painel",
  );
  const [staffSubTab, setStaffSubTab] = useState<StaffSubTabKey>("ev");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [cad, setCad] = useState(false);
  const [pend, setPend] = useState<number | null>(null);
  const [verifyModalUserId, setVerifyModalUserId] = useState<number | null>(
    null,
  );
  const [verifyPreviewCode, setVerifyPreviewCode] = useState<string>("");
  const [toast, setToast] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [modMenuOpen, setModMenuOpen] = useState(false);
  const [perfilMenuOpen, setPerfilMenuOpen] = useState(false);
  const [profileSubTab, setProfileSubTab] = useState<"perfil" | "pass">("perfil");

  const me =
    typeof sid === "number" ? users.find((x) => x.id === sid) || null : null;
  const role: AppContextProps["role"] =
    sid === "admin" || me?.isModerator
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
    const displayName = (u.apelido && u.apelido.trim()) || u.nome;
    const status = getPlayerPeladaStatus(peladaStore, {
      userId: String(u.id),
      name: displayName,
    });
    if (status.status === "not-in-pelada") {
      peladaStore.addPlayer(displayName, {
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

  const goMeuPerfil = () => {
    setLoginRedirect("painel");
    setTab("painel");
  };

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

  const openEmailVerifyForUser = (u: HeziUser) => {
    const code = u.verificationCode || generateSixDigitCode();
    if (!u.verificationCode) {
      updUser(u.id, { verificationCode: code });
    }
    setVerifyPreviewCode(code);
    setVerifyModalUserId(u.id);
    if (u.email) {
      void triggerAuthEmailApi({
        action: "send_verification",
        email: u.email,
        nome: u.nome,
        code,
      });
    }
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

    const alreadyRewarded = (targetEv.rewardedUids || []).includes(u.id);
    const pts = getEventEntryPoints(u, 5);
    const isSub = isActiveSubscriber(u);

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
      message: alreadyRewarded
        ? `${u.nome} solicitou retornar à fila de "${targetEv.t}" (Grind Points deste evento já foram creditados anteriormente).`
        : `${u.nome} solicitou entrar na fila de "${targetEv.t}". Ao aprovar, entra na fila e ganha +${pts} Grind Points (GP)${isSub ? " (2x Assinante)" : ""}.`,
    });

    say(
      alreadyRewarded
        ? "Solicitação de retorno enviada ao Administrador! 🏀"
        : `Solicitação enviada ao Administrador! Ao ser aceita, você entra na fila e ganha +${pts} HP${isSub ? " (2x Assinante)" : ""} 🏀`,
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
      return say("Treino exclusivo para assinantes assinantes Hezi Skills!");
    }
    sendQueueRequestForUser(me, eid);
  };

  const leaveQueue = (eid: number) => {
    if (!me) return;

    // 1) Remove da fila do evento na plataforma Hezi
    removeQueue(eid, me.id);

    // 2) Se for Pelada, remove também do Court Master (peladaStore)
    const targetEv = evs.find((e) => e.id === eid);
    if (!targetEv || targetEv.tp === "Pelada") {
      const matchingPlayers = Object.values(peladaStore.players).filter(
        (p) =>
          p.userId === String(me.id) ||
          p.name.trim().toLowerCase() === me.nome.trim().toLowerCase(),
      );
      matchingPlayers.forEach((p) => {
        peladaStore.removePlayer(p.id);
      });
    }

    // 3) Cancela solicitações pendentes desse usuário para este evento
    notifications
      .filter(
        (n) =>
          n.type === "queue_request" &&
          n.status === "pending" &&
          n.fromUserId === me.id &&
          n.eventId === eid,
      )
      .forEach((n) => {
        updateNotification(n.id, { status: "rejected" });
      });

    say("Você saiu da fila do evento.");
  };

  const cancelQueueRequest = (notifId: string) => {
    const n = notifications.find((x) => x.id === notifId);
    if (!n) return;
    updateNotification(notifId, { status: "rejected" });
    say("Solicitação de entrada na fila cancelada.");
  };

  const approveQueueRequest = (notifId: string) => {
    const n = notifications.find((x) => x.id === notifId);
    if (!n || n.status !== "pending") return;

    updateNotification(notifId, { status: "accepted" });

    const targetUser = users.find((u) => u.id === n.fromUserId);
    const targetEv = evs.find((e) => e.id === n.eventId);

    if (targetEv && targetUser) {
      const alreadyRewarded = (targetEv.rewardedUids || []).includes(
        targetUser.id,
      );
      const pts = getEventEntryPoints(targetUser, 5);
      const isSub = isActiveSubscriber(targetUser);

      addQueue(targetEv.id, targetUser.id);
      if (targetEv.tp === "Pelada") {
        syncUserToCourtMaster(targetUser);
      }

      const nowTs = Date.now();

      if (!alreadyRewarded) {
        // Libera Grind Points (GP) apenas na PRIMEIRA vez que o usuário entra neste evento!
        markEventRewarded(targetEv.id, targetUser.id);
        const gpEntry = {
          id: `gp-ev-${nowTs}-${targetUser.id}`,
          amount: pts,
          baseAmount: isSub ? Math.round(pts / 2) : pts,
          reason: `Check-in: ${targetEv.t}`,
          date: new Date().toLocaleDateString("pt-BR"),
          doubled: isSub,
        };
        updUser(targetUser.id, {
          gp: (targetUser.gp ?? 0) + pts,
          gpHistory: [gpEntry, ...(targetUser.gpHistory || [])],
        });

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
          message: `Sua entrada em "${targetEv.t}" foi aprovada! Você entrou na fila e ganhou +${pts} Grind Points (GP)${isSub ? " (Dobro 2x Assinante)" : ""}! 🏀`,
        });

        say(
          `✅ ${targetUser.nome} aprovado na fila e recebeu +${pts} Grind Points (GP)${isSub ? " (2x Assinante)" : ""}!`,
        );
      } else {
        // Já recebeu HP neste evento anteriormente: entra na fila sem ganhar HP repetido
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
          message: `Sua reentrada em "${targetEv.t}" foi aprovada! (Os Grind Points deste evento já foram creditados na sua primeira entrada). 🏀`,
        });

        say(
          `✅ ${targetUser.nome} entrou novamente na fila (HP deste evento já liberado anteriormente).`,
        );
      }
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
    const vCode = generateSixDigitCode();
    const u: HeziUser = {
      id: Date.now(),
      tipo: "jogador",
      nome: f.nome.trim(),
      username: sanitizeUsername(f.username),
      apelido: f.apelido.trim(),
      dataNascimento: f.dataNascimento,
      wpp: f.wpp.trim(),
      instagram: f.instagram.trim(),
      email: f.email.trim().toLowerCase(),
      senha: f.senha,
      foto: f.foto,
      emailVerified: false,
      verificationCode: vCode,
      hp: 0,
      autorizacaoImagem: f.autorizacaoImagem ?? true,
      autorizacaoImagemData: f.autorizacaoImagemData || new Date().toISOString(),
    };
    addUser(u);
    setSid(u.id);
    setCad(false);

    // Envia código de ativação por e-mail e abre modal de confirmação
    setVerifyPreviewCode(vCode);
    setVerifyModalUserId(u.id);
    void triggerAuthEmailApi({
      action: "send_verification",
      email: u.email!,
      nome: u.nome,
      code: vCode,
    });

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
      say("Cadastro criado! Confirme o código enviado para o seu e-mail.");
    } else {
      setTab("painel");
      say("Conta criada! Confirme o código de 6 dígitos enviado ao seu e-mail.");
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
    addUser,
    deleteUser: (id: number) => {
      const u = users.find((x) => x.id === id);
      delUserAction(id);
      if (u) {
        // Remove também do totem Court Master caso esteja em quadra ou fila
        const status = getPlayerPeladaStatus(peladaStore, {
          userId: String(u.id),
          name: u.nome,
        });
        if (status.player) {
          peladaStore.removePlayer(status.player.id);
        }
      }
      say(`Usuário ${u?.nome || ""} excluído com sucesso.`);
    },
    say,
    join,
    leaveQueue,
    cancelQueueRequest,
    approveQueueRequest,
    rejectQueueRequest,
    sendGroupInvite,
    acceptGroupInvite,
    rejectGroupInvite,
    openEmailVerifyForUser,
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

  const verifyModalUser =
    verifyModalUserId !== null
      ? users.find((x) => x.id === verifyModalUserId) || null
      : null;

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
          {(!isOnline || syncError) && (
            <div className="bg-[#EF4444] text-white text-[11px] font-extrabold text-center py-1 px-3">
              📡 Sem conexão com o servidor — alterações salvas localmente, tentando reconectar...
            </div>
          )}
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

            <nav className="flex items-center gap-1.5 sm:gap-2.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen(false);
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
              <span className="text-white/40 select-none">|</span>
              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen(false);
                  setSelectedEventId(null);
                  setTab("rankings");
                }}
                className={
                  "ote-nav-link transition hover:text-[#FF5400] " +
                  (tab === "rankings" ? "text-[#FF5400]" : "text-white")
                }
              >
                RANKINGS
              </button>
              {role === "visitante" && (
                <>
                  <span className="text-white/40 select-none">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setCad(true);
                    }}
                    className="ote-nav-link transition hover:text-[#FF5400] text-white"
                  >
                    CRIAR CONTA
                  </button>
                </>
              )}
              {!(me?.tipo === "aluno" && me?.st !== "ex_aluno") &&
                role !== "admin" &&
                role !== "professor" && (
                  <>
                    <span className="text-white/40 select-none">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        goQueroSerAssinante();
                      }}
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
                  </>
                )}

              {/* Ícone Circular da Conta (estilo Google) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  className="relative w-9 h-9 rounded-full bg-[#1C1F26] border-2 border-[#FF5400] flex items-center justify-center overflow-hidden hover:scale-105 transition"
                  title="Menu da Conta"
                >
                  {me?.foto ? (
                    <img
                      src={me.foto}
                      alt={me.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-black text-white">
                      {role === "visitante"
                        ? "?"
                        : role === "admin" && !me
                          ? "AD"
                          : role === "professor" && !me
                            ? "PR"
                            : (me?.nome || "U").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  {pendingNotifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FF5400] border-2 border-black" />
                  )}
                </button>

                {accountMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setAccountMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-[#1B1D22] text-white rounded-3xl shadow-2xl border border-white/10 p-3.5 z-50 space-y-3 normal-case tracking-normal">
                      <div className="flex items-center gap-3 bg-[#111317] rounded-2xl p-3">
                        <div className="w-11 h-11 rounded-full bg-[#FF5400] flex items-center justify-center font-black text-white shrink-0 overflow-hidden">
                          {me?.foto ? (
                            <img
                              src={me.foto}
                              alt={me.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {role === "visitante"
                                ? "?"
                                : (me?.nome || (role === "admin" ? "AD" : "PR"))
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-sm text-white truncate">
                            {role === "visitante"
                              ? "Visitante"
                              : me?.nome ||
                                (role === "admin" ? "Administrador" : "Professor")}
                          </p>
                          <p className="text-[11px] text-[#9CA3AF] truncate">
                            {me?.email ||
                              (role === "visitante"
                                ? "Entre ou crie sua conta"
                                : "Conta oficial HEZI FAM")}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FF5400]/20 text-[#FF5400]">
                            {role === "visitante"
                              ? "Não autenticado"
                              : me?.isModerator
                                ? "🛡️ Moderador"
                                : role === "admin"
                                  ? "🔑 Administrador"
                                  : role === "professor"
                                    ? "🧑‍🏫 Professor"
                                    : me?.tipo === "aluno" && me?.st !== "ex_aluno"
                                      ? "⚡ Assinante VIP"
                                      : "🏀 Usuário"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {role !== "visitante" ? (
                          <>
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => setPerfilMenuOpen((v) => !v)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold bg-white/5 hover:bg-white/10 transition text-left"
                              >
                                <span className="flex items-center gap-2.5">
                                  <UserCheck className="w-4 h-4 text-[#FF5400]" />
                                  Meu Perfil
                                </span>
                                {perfilMenuOpen ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                )}
                              </button>
                              {perfilMenuOpen && (
                                <div className="pl-3 space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAccountMenuOpen(false);
                                      setProfileSubTab("perfil");
                                      if (staff && me) {
                                        setStaffSubTab("perfil");
                                        setTab("painel");
                                      } else {
                                        goMeuPerfil();
                                      }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#E5E7EB] hover:bg-[#FF5400] hover:text-white transition text-left"
                                  >
                                    👤 Perfil
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAccountMenuOpen(false);
                                      setProfileSubTab("pass");
                                      if (staff && me) {
                                        setStaffSubTab("perfil");
                                        setTab("painel");
                                      } else {
                                        goMeuPerfil();
                                      }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#E5E7EB] hover:bg-[#FF5400] hover:text-white transition text-left"
                                  >
                                    🏆 Hezi Pass
                                  </button>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setAccountMenuOpen(false);
                                setSelectedEventId(null);
                                setTab("rankings");
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-extrabold bg-white/5 hover:bg-[#FF5400] transition text-left"
                            >
                              <span className="text-sm">📊</span>
                              Rankings
                            </button>

                            {staff && (
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => setModMenuOpen((v) => !v)}
                                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-extrabold bg-white/5 hover:bg-white/10 transition text-left"
                                >
                                  <span className="flex items-center gap-2.5">
                                    <ShieldAlert className="w-4 h-4 text-[#FF5400]" />
                                    {me?.isModerator ? "Moderador" : role === "admin" ? "Administrador" : "Professor"}
                                  </span>
                                  {modMenuOpen ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                  )}
                                </button>
                                {modMenuOpen && (
                                  <div className="pl-3 space-y-1">
                                    {(
                                      [
                                        ["al", "⚡ Assinantes"],
                                        ["us", "🏀 Usuários"],
                                        ["ev", "📅 Eventos"],
                                        ...(role === "admin" ? [["db", "🗄️ Banco de Dados"]] : []),
                                      ] as [StaffSubTabKey, string][]
                                    ).map(([key, label]) => (
                                      <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                          setAccountMenuOpen(false);
                                          setStaffSubTab(key);
                                          setTab("painel");
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#E5E7EB] hover:bg-[#FF5400] hover:text-white transition text-left"
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setAccountMenuOpen(false);
                                if (staff) {
                                  setStaffSubTab("nf");
                                  setTab("painel");
                                } else {
                                  setNotifModalOpen(true);
                                }
                              }}
                              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition text-left"
                            >
                              <span className="flex items-center gap-2.5">
                                <Bell className="w-4 h-4 text-[#FF5400]" />
                                Notificações
                              </span>
                              {pendingNotifCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-[#FF5400] text-white text-[10px] font-black">
                                  {pendingNotifCount}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAccountMenuOpen(false);
                                void fetch("/api/hezi/auth/logout", { method: "POST" }).catch(() => {});
                                setSid("visitante");
                                setTab("home");
                                say("Você saiu da conta.");
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/10 transition text-left"
                            >
                              <LogOut className="w-4 h-4" />
                              Sair da conta
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setAccountMenuOpen(false);
                                setLoginRedirect("painel");
                                setTab("login");
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FF5400] text-white text-xs font-extrabold hover:bg-[#E04800] transition"
                            >
                              <LogIn className="w-4 h-4" />
                              Entrar na Conta
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAccountMenuOpen(false);
                                setCad(true);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-white text-xs font-extrabold hover:bg-white/20 transition"
                            >
                              <UserPlus className="w-4 h-4 text-[#FF5400]" />
                              Criar Conta Grátis
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </nav>
          </div>
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
          ) : tab === "rankings" ? (
            <RankingsPage S={S} />
          ) : staff ? (
            <Staff
              S={S}
              key={role}
              initialSubTab={staffSubTab}
              onSubTabChange={setStaffSubTab}
              profileSubTab={profileSubTab}
            />
          ) : (
            <Painel S={S} initialSubTab={profileSubTab} />
          )}
        </main>

        {/* Modal de Notificações do Jogador/Assinante */}
        {notifModalOpen && (
          <NotificacoesPlayerModal
            S={S}
            close={() => setNotifModalOpen(false)}
          />
        )}

        {/* Modal de Confirmação de E-mail para Ativar Conta */}
        {verifyModalUser && (
          <EmailVerificationModal
            u={verifyModalUser}
            previewCode={verifyPreviewCode}
            close={() => setVerifyModalUserId(null)}
            onVerified={() => {
              updUser(verifyModalUser.id, {
                emailVerified: true,
                verificationCode: undefined,
              });
              setVerifyModalUserId(null);
              say("✅ E-mail confirmado com sucesso! Sua conta está ativa!");
            }}
            onResendCode={() => {
              const newCode = generateSixDigitCode();
              updUser(verifyModalUser.id, { verificationCode: newCode });
              setVerifyPreviewCode(newCode);
              if (verifyModalUser.email) {
                void triggerAuthEmailApi({
                  action: "send_verification",
                  email: verifyModalUser.email,
                  nome: verifyModalUser.nome,
                  code: newCode,
                });
              }
              say(`Novo código enviado para ${verifyModalUser.email}!`);
            }}
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
            existingUsernames={users
              .map((u) => sanitizeUsername(u.username || ""))
              .filter(Boolean)}
          />
        )}
      </div>
    </div>
  );
}

