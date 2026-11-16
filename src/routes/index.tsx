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

export type AppTab = "home" | "pelada" | "painel" | "login" | "assinante";

import { Cadastro, EmailVerificationModal, LoginPage, generateSixDigitCode, sanitizeUsername } from "@/components/hezi/AuthComponents";
import { Home, Pelada } from "@/components/hezi/HomeAndEvents";
import { Painel, NotificacoesPlayerModal } from "@/components/hezi/PlayerProfile";
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
  const [staffSubTab, setStaffSubTab] = useState<StaffSubTabKey>("cm");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [cad, setCad] = useState(false);
  const [pend, setPend] = useState<number | null>(null);
  const [verifyModalUserId, setVerifyModalUserId] = useState<number | null>(
    null,
  );
  const [verifyPreviewCode, setVerifyPreviewCode] = useState<string>("");
  const [toast, setToast] = useState("");

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
        ? `${u.nome} solicitou retornar à fila de "${targetEv.t}" (Hezi Points deste evento já foram creditados anteriormente).`
        : `${u.nome} solicitou entrar na fila de "${targetEv.t}". Ao aprovar, entra na fila e ganha +${pts} Hezi Points${isSub ? " (2x Assinante)" : ""}.`,
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
        // Libera Hezi Points apenas na PRIMEIRA vez que o usuário entra neste evento!
        markEventRewarded(targetEv.id, targetUser.id);
        updUser(targetUser.id, { hp: targetUser.hp + pts });

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
          message: `Sua entrada em "${targetEv.t}" foi aprovada! Você entrou na fila e ganhou +${pts} Hezi Points${isSub ? " (Dobro 2x Assinante)" : ""}! 🏀`,
        });

        say(
          `✅ ${targetUser.nome} aprovado na fila e recebeu +${pts} Hezi Points${isSub ? " (2x Assinante)" : ""}!`,
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
          message: `Sua reentrada em "${targetEv.t}" foi aprovada! (Os Hezi Points deste evento já foram creditados na sua primeira entrada). 🏀`,
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
                    ? me?.isModerator
                      ? `🛡️ Moderador (${me.nome})`
                      : "🔑 Administrador"
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
                  ? me?.isModerator
                    ? "🛡️ MODO MODERADOR ATIVO"
                    : "🔑 MODO ADMINISTRADOR ATIVO"
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

