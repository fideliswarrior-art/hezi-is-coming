import type {
  HeziEventItem,
  HeziNotification,
  HeziUser,
} from "@/lib/hezi/store";

export type AppTab = "home" | "pelada" | "painel" | "login" | "assinante";
export type StaffSubTabKey =
  | "cm"
  | "nf"
  | "ev"
  | "av"
  | "al"
  | "us"
  | "db"
  | "perfil";

export interface AppContextProps {
  users: HeziUser[];
  evs: HeziEventItem[];
  setEvs: (evs: HeziEventItem[]) => void;
  notifications: HeziNotification[];
  me: HeziUser | null;
  role: "visitante" | "jogador" | "aluno" | "professor" | "admin";
  upd: (id: number, patch: Partial<HeziUser>) => void;
  addUser: (u: HeziUser) => void;
  deleteUser: (id: number) => void;
  say: (msg: string) => void;
  join: (eid: number) => void;
  leaveQueue: (eid: number) => void;
  cancelQueueRequest: (notifId: string) => void;
  approveQueueRequest: (notifId: string) => void;
  rejectQueueRequest: (notifId: string) => void;
  sendGroupInvite: (toUserId: number, eventId: number) => void;
  acceptGroupInvite: (notifId: string) => void;
  rejectGroupInvite: (notifId: string) => void;
  openEmailVerifyForUser: (u: HeziUser) => void;
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
