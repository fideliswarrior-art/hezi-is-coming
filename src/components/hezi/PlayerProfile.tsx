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
import { CourtMasterOrganizer, useTick } from "@/routes/pelada";
import { RadarHabilidades } from "@/components/hezi/RadarHabilidades";
import { AssinantePage } from "@/components/hezi/AssinantePage";
import type { AppContextProps, AppTab, StaffSubTabKey } from "@/components/hezi/types";
import { C, OB, btBase, Btn, Chip, Hd } from "@/components/hezi/shared";
import { Av, GRN, RED, AVATAR_ICONS, compressImageFileToDataUrl } from "@/routes/index";
import { sanitizeUsername, validatePasswordRules, formatDateInput } from "./AuthComponents";

export function Pass({ u }: { u: HeziUser }) {
  const gpVal = u.gp ?? 0;
  const nx = PASS.find((p) => gpVal < p[0]);
  const pct = nx ? Math.min(100, Math.round((gpVal / nx[0]) * 100)) : 100;
  const subActive = isActiveSubscriber(u);

  return (
    <div className={C + " p-4"}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-extrabold text-[#111317] flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#FF5400]" />
          Hezi Pass · Temporada 1
          {subActive && (
            <span className="text-[10px] font-black uppercase bg-[#FFF4EE] text-[#FF5400] px-2 py-0.5 rounded-full">
              ⚡ 2x Pontos
            </span>
          )}
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
        <span className="n font-bold text-[#111317]">{gpVal}</span> GP (Grind Points)
        acumulados ·{" "}
        {nx
          ? `faltam ${nx[0] - gpVal} GP para desbloquear o Nível ${PASS.indexOf(nx) + 1}`
          : "Passe completo! 🏆"}
      </p>
      {PASS.map(([h, r], i) => {
        const ok = gpVal >= h;
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

export function Boletim({ u }: { u: HeziUser }) {
  const [o, setO] = useState<string>("ban");
  const sub = u.sub || baseSub;
  const r = u.r || mkR(sub);
  const bd = u.bd || B0();

  const handleRadarSelect = (k: CatKey) => {
    setO(k);
    window.setTimeout(() => {
      document
        .getElementById(`boletim-cat-${k}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  return (
    <div>
      <RadarHabilidades u={u} selectedKey={o} onSelectCat={handleRadarSelect} />
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
            <div key={c.k} id={`boletim-cat-${c.k}`} className={C}>
              <button
                type="button"
                onClick={() => setO(open ? "" : c.k)}
                className="w-full flex items-center gap-3 p-3.5 text-left"
              >
                <img
                  src={`/badges/${c.k}.png`}
                  alt={c.t}
                  className={`w-12 h-12 object-contain shrink-0 transition ${
                    b === 0 ? "opacity-45 grayscale" : ""
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] leading-tight text-[#111317]">
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

export function ProfileEditModal({
  u,
  existingUsernames,
  close,
  save,
}: {
  u: HeziUser;
  existingUsernames: string[];
  close: () => void;
  save: (patch: Partial<HeziUser>) => void;
}) {
  const [f, setF] = useState({
    nome: u.nome || "",
    username: u.username || "",
    apelido: u.apelido || "",
    dataNascimento: u.dataNascimento || "",
    wpp: u.wpp || "",
    instagram: u.instagram || "",
    email: u.email || "",
    foto: u.foto || "",
    avatarIcon: u.avatarIcon || "",
    novaSenha: "",
  });
  const [uploading, setUploading] = useState(false);

  const canUploadCustomPhoto =
    (u.tipo === "aluno" && u.st !== "ex_aluno") ||
    u.tipo === "professor" ||
    Boolean(u.isModerator);

  const cleanUsername = sanitizeUsername(f.username);
  const usernameTaken =
    cleanUsername.length > 0 &&
    cleanUsername !== sanitizeUsername(u.username || "") &&
    (existingUsernames.includes(cleanUsername) ||
      cleanUsername === "admin" ||
      cleanUsername === "professor" ||
      cleanUsername === "prof");

  const pwdValid =
    f.novaSenha.length === 0 || validatePasswordRules(f.novaSenha).valid;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 256);
      setF((prev) => ({
        ...prev,
        foto: dataUrl,
        avatarIcon: "",
      }));
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

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

        {/* Upload de Imagem de Perfil + Seleção de Ícone */}
        <div className="bg-[#F4F5F7] rounded-2xl p-3.5 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#6E7381]">
            Foto ou Ícone de Perfil
          </p>

          <div className="flex items-center gap-3 bg-white border border-[#EAEBEF] rounded-xl p-2.5">
            <Av
              u={{
                ...u,
                nome: f.nome || u.nome,
                foto: f.foto || undefined,
                avatarIcon: f.avatarIcon || undefined,
              }}
              s="w-12 h-12 text-base"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-[#111317]">
                Imagem de Perfil
              </p>
              <p className="text-[11px] text-[#6E7381] truncate">
                {f.avatarIcon
                  ? `Ícone selecionado: ${f.avatarIcon}`
                  : f.foto
                    ? "Foto anexada ativa"
                    : "Iniciais automáticas"}
              </p>
            </div>
            {canUploadCustomPhoto && (
              <label className="cursor-pointer shrink-0 rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white text-xs font-extrabold px-3 py-2 flex items-center gap-1.5 transition">
                <Camera className="w-3.5 h-3.5" />
                <span>{uploading ? "..." : "Anexar Imagem"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

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
              Usar Foto / Iniciais
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
            <div className="flex gap-2">
              <input
                value={f.foto.startsWith("data:") ? "" : f.foto}
                placeholder="Ou cole a URL de uma imagem (opcional)"
                onChange={(e) => setF({ ...f, foto: e.target.value })}
                className="flex-1 bg-white border border-[#EAEBEF] rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:ring-2 ring-[#FF5400]"
              />
              {f.foto && (
                <button
                  type="button"
                  onClick={() => setF({ ...f, foto: "" })}
                  className="shrink-0 rounded-xl bg-white border border-[#EAEBEF] text-[#EF4444] text-xs font-bold px-2.5 py-2"
                >
                  Remover foto
                </button>
              )}
            </div>
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
          <div>
            <label className="block text-xs font-bold text-[#6E7381] mb-1">
              Nome de usuário (para login)
            </label>
            <input
              value={f.username}
              placeholder="ex: lucas_silva"
              onChange={(e) =>
                setF({ ...f, username: sanitizeUsername(e.target.value) })
              }
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
            {usernameTaken && (
              <p className="text-xs font-bold text-[#EF4444] mt-1">
                Este nome de usuário já está em uso.
              </p>
            )}
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
                Data de nascimento (DD/MM/AAAA)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={f.dataNascimento}
                  placeholder="DD/MM/AAAA"
                  onChange={(e) =>
                    setF({
                      ...f,
                      dataNascimento: formatDateInput(e.target.value),
                    })
                  }
                  className="w-full bg-[#F4F5F7] rounded-xl px-3.5 py-2.5 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400] pr-8"
                />
                <label
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#6E7381] hover:text-[#FF5400] p-1"
                  title="Escolher no calendário"
                >
                  <Calendar className="w-4 h-4" />
                  <input
                    type="date"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m, d] = e.target.value.split("-");
                        setF({ ...f, dataNascimento: `${d}/${m}/${y}` });
                      }
                    }}
                  />
                </label>
              </div>
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
          dis={!f.nome.trim() || !pwdValid || usernameTaken}
          onClick={() => {
            const patch: Partial<HeziUser> = {
              nome: f.nome.trim(),
              username: cleanUsername || undefined,
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

export function RankingsPage({ S }: { S: AppContextProps }) {
  const u = S.me;
  const [viewingUser, setViewingUser] = useState<HeziUser | null>(null);
  const [rankMode, setRankMode] = useState<"hp" | "gp">("hp");

  const rankedUsers = [...S.users].sort((a, b) => {
    const valA = rankMode === "hp" ? (a.hp ?? 0) : (a.gp ?? 0);
    const valB = rankMode === "hp" ? (b.hp ?? 0) : (b.gp ?? 0);
    const diff = valB - valA;
    if (diff !== 0) return diff;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
  const myRank = rankedUsers.findIndex((x) => x.id === u?.id) + 1;

  if (viewingUser) {
    const targetSub = viewingUser.sub || baseSub;
    const targetOvr = ovr(targetSub);
    const targetRank = rankedUsers.findIndex((x) => x.id === viewingUser.id) + 1;
    const displayNick =
      viewingUser.apelido?.trim() || viewingUser.nome.split(" ")[0];

    return (
      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewingUser(null)}
            className="text-xs font-extrabold text-[#FF5400] hover:underline"
          >
            ← Voltar ao Ranking
          </button>
          <span className="text-[11px] font-extrabold text-[#6E7381]">
            Posição #{targetRank}
          </span>
        </div>

        <div className={C + " p-4 space-y-3"}>
          <div className="flex items-center gap-3">
            <Av u={viewingUser} s="w-16 h-16 text-xl" />
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-base text-[#111317] truncate">
                {displayNick}
              </p>
              {viewingUser.instagram && (
                <p className="text-xs font-bold text-[#6E7381] truncate mt-0.5">
                  📷 {viewingUser.instagram}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#EAEBEF]">
            <div className="bg-[#F4F5F7] rounded-xl p-2.5 text-center">
              <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                Grind Points
              </p>
              <p className="n font-extrabold text-lg text-[#10B981]">
                {viewingUser.gp ?? 0}
              </p>
            </div>
            <div className="bg-[#F4F5F7] rounded-xl p-2.5 text-center">
              <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                Hezi Points
              </p>
              <p className="n font-extrabold text-lg text-[#FF5400]">
                {viewingUser.hp ?? 0}
              </p>
            </div>
            <div className="bg-[#F4F5F7] rounded-xl p-2.5 text-center">
              <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                Overall
              </p>
              <p className="n font-extrabold text-lg text-[#111317]">
                {targetOvr}
              </p>
            </div>
            <div className="bg-[#F4F5F7] rounded-xl p-2.5 text-center">
              <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                Ofensiva
              </p>
              <p className="n font-extrabold text-lg text-[#111317]">
                🔥 {viewingUser.st === "ex_aluno" ? 0 : (viewingUser.streak ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <div>
        <h2 className="font-extrabold text-base text-[#111317]">
          {rankMode === "hp" ? "🏆 Ranking Hezi Points (HP)" : "🔥 Ranking de Grind (GP)"}
        </h2>
        <p className="text-[11px] text-[#6E7381]">
          {rankedUsers.length} usuários ·{" "}
          {rankMode === "hp"
            ? "Competitivo (Torneios)"
            : "Constância & Hezi Pass"}
          {myRank > 0 ? ` · Sua posição: #${myRank}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRankMode("hp")}
          className={`rounded-xl py-2 px-3 text-xs font-extrabold transition ${
            rankMode === "hp"
              ? "bg-[#111317] text-white"
              : "bg-white border border-[#EAEBEF] text-[#6E7381]"
          }`}
        >
          🏆 Hezi Points (HP)
        </button>
        <button
          type="button"
          onClick={() => setRankMode("gp")}
          className={`rounded-xl py-2 px-3 text-xs font-extrabold transition ${
            rankMode === "gp"
              ? "bg-[#111317] text-white"
              : "bg-white border border-[#EAEBEF] text-[#6E7381]"
          }`}
        >
          🔥 Grind Points (GP)
        </button>
      </div>

      <div className="space-y-2">
        {rankedUsers.map((item, idx) => {
          const pos = idx + 1;
          const isMe = item.id === u?.id;
          const medal =
            pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `#${pos}`;
          const nick = item.apelido?.trim() || item.nome.split(" ")[0];
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setViewingUser(item)}
              className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-2xl border transition hover:border-[#FF5400] ${
                isMe
                  ? "bg-[#FFF4EE] border-[#FF5400] shadow-xs"
                  : "bg-white border-[#EAEBEF]"
              }`}
            >
              <div className="w-8 text-center font-extrabold text-sm shrink-0 text-[#111317]">
                {medal}
              </div>
              <Av u={item} s="w-9 h-9 text-xs" />
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-xs text-[#111317] truncate">
                  {nick}
                  {isMe && (
                    <span className="ml-1.5 text-[10px] text-[#FF5400]">
                      (Você)
                    </span>
                  )}
                </p>
                {item.instagram && (
                  <p className="text-[11px] text-[#6E7381] truncate">
                    📷 {item.instagram}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`n font-extrabold text-sm ${
                    rankMode === "hp" ? "text-[#FF5400]" : "text-[#10B981]"
                  }`}
                >
                  {rankMode === "hp" ? (item.hp ?? 0) : (item.gp ?? 0)}
                </span>
                <span className="block text-[10px] font-bold text-[#6E7381]">
                  {rankMode === "hp" ? "HP" : "GP"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Painel({
  S,
  initialSubTab = "perfil",
}: {
  S: AppContextProps;
  initialSubTab?: "perfil" | "pass";
}) {
  const u = S.me;
  const [editOpen, setEditOpen] = useState(false);
  const [subTab, setSubTab] = useState<"perfil" | "pass">(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

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

  if (subTab === "pass") {
    if (viewingUser) {
      const targetSub = viewingUser.sub || baseSub;
      const targetOvr = ovr(targetSub);
      const targetRank = rankedUsers.findIndex((x) => x.id === viewingUser.id) + 1;
      const displayNick =
        viewingUser.apelido?.trim() || viewingUser.nome.split(" ")[0];

      return (
        <div className="p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewingUser(null)}
              className="text-xs font-extrabold text-[#FF5400] hover:underline"
            >
              ← Voltar ao Ranking
            </button>
            <span className="text-[11px] font-extrabold text-[#6E7381]">
              Posição #{targetRank}
            </span>
          </div>

          <div className={C + " p-4 space-y-3"}>
            <div className="flex items-center gap-3">
              <Av u={viewingUser} s="w-16 h-16 text-xl" />
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-base text-[#111317] truncate">
                  {displayNick}
                </p>
                {viewingUser.instagram && (
                  <p className="text-xs font-bold text-[#6E7381] truncate mt-0.5">
                    📷 {viewingUser.instagram}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EAEBEF]">
              <div className="bg-[#F4F5F7] rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                  Hezi Points
                </p>
                <p className="n font-extrabold text-lg text-[#FF5400]">
                  {viewingUser.hp ?? 0}
                </p>
              </div>
              <div className="bg-[#F4F5F7] rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                  Overall
                </p>
                <p className="n font-extrabold text-lg text-[#111317]">
                  {targetOvr}
                </p>
              </div>
              <div className="bg-[#F4F5F7] rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-extrabold uppercase text-[#6E7381]">
                  Ofensiva
                </p>
                <p className="n font-extrabold text-lg text-[#111317]">
                  🔥 {viewingUser.st === "ex_aluno" ? 0 : (viewingUser.streak ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base text-[#111317]">
            🏆 Hezi Pass · Progresso
          </h2>
          <button
            type="button"
            onClick={() => setSubTab("perfil")}
            className="text-xs font-extrabold text-[#FF5400] hover:underline"
          >
            ← Voltar ao Perfil
          </button>
        </div>
        <Pass u={u} />
        {u.hpHistory && u.hpHistory.length > 0 && (
          <div className={C + " p-3.5 space-y-2"}>
            <p className="text-xs font-extrabold text-[#111317] uppercase">
              Histórico de Hezi Points ({u.hpHistory.length})
            </p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {u.hpHistory.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs bg-[#F4F5F7] rounded-lg px-2.5 py-1.5"
                >
                  <div>
                    <span className="font-bold text-[#111317]">{h.reason}</span>
                    {h.doubled && (
                      <span className="ml-1 text-[10px] font-extrabold text-[#FF5400]">
                        (2x Assinante)
                      </span>
                    )}
                    <span className="block text-[10px] text-[#6E7381]">
                      {new Date(h.date).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <span className="font-extrabold text-[#10B981]">+{h.amount} HP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const existingUsernames = S.users
    .filter((x) => x.id !== u.id)
    .map((x) => sanitizeUsername(x.username || ""))
    .filter(Boolean);

  // Área do Usuário Comum OU Ex-Assinante (cujos dados de assinante continuam salvos no banco, mas exibe perfil comum)
  if (u.tipo === "jogador" || (u.tipo === "aluno" && u.st === "ex_aluno")) {
    return (
      <div className="p-4 space-y-4">
        {u.emailVerified === false && (
          <div className="bg-[#FFF4EE] border border-[#FF5400]/40 rounded-2xl p-3.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-[#FF5400]">
                📩 Confirmação de E-mail Pendente
              </p>
              <p className="text-xs text-[#6E7381]">
                Confirme o código enviado para {u.email} para ativar totalmente sua conta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => S.openEmailVerifyForUser(u)}
              className="shrink-0 rounded-xl bg-[#FF5400] text-white text-xs font-extrabold px-3 py-2"
            >
              Ativar Conta
            </button>
          </div>
        )}

        <div className={C + " p-4 flex gap-3 items-center"}>
          <Av u={u} />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base text-[#111317] truncate">
              {u.nome}
            </p>
            <p className="text-xs text-[#6E7381] truncate">
              {[
                u.username ? `@${u.username}` : null,
                u.apelido,
                u.instagram,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#F4F5F7] hover:bg-[#EAEBEF] text-[#111317] flex items-center justify-center shrink-0 transition"
            title="Configurações do Perfil (Alterar dados e foto)"
            aria-label="Editar Perfil"
          >
            <Settings className="w-5 h-5 text-[#111317]" />
          </button>
        </div>

        {editOpen && (
          <ProfileEditModal
            u={u}
            existingUsernames={existingUsernames}
            close={() => setEditOpen(false)}
            save={(patch) => {
              S.upd(u.id, patch);
              setEditOpen(false);
              S.say("Dados e foto de perfil atualizados!");
            }}
          />
        )}
      </div>
    );
  }

  // Assinante Hezi Skills (Assinante Regular ou com Mensalidade Pendente — sem bloqueio de acesso!)
  const sub = u.sub || baseSub;
  const isPaymentPending = u.st === "pendente" || u.st === "inativo";

  return (
    <div className="p-4 space-y-4">
      {u.emailVerified === false && (
        <div className="bg-[#FFF4EE] border border-[#FF5400]/40 rounded-2xl p-3.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold text-[#FF5400]">
              📩 Confirmação de E-mail Pendente
            </p>
            <p className="text-xs text-[#6E7381]">
              Confirme o código enviado para {u.email} para ativar totalmente sua conta.
            </p>
          </div>
          <button
            type="button"
            onClick={() => S.openEmailVerifyForUser(u)}
            className="shrink-0 rounded-xl bg-[#FF5400] text-white text-xs font-extrabold px-3 py-2"
          >
            Ativar Conta
          </button>
        </div>
      )}

      <div className={C + " p-4"}>
        <div className="flex gap-3 items-center">
          <Av u={u} />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base text-[#111317] truncate">
              {u.nome}
            </p>
            <p className="text-xs text-[#6E7381] mb-1.5 truncate">
              {u.username ? `@${u.username} · ` : ""}Turma Terça 16:30
            </p>
            <div className="flex flex-wrap gap-1.5">
              {isPaymentPending ? (
                <Chip c={RED}>🔴 Mensalidade Pendente</Chip>
              ) : (
                <Chip c={GRN}>🟢 Matrícula Regular</Chip>
              )}
              <Chip c="bg-[#FFF4EE] text-[#FF5400]">⚡ 2x HP Ativo</Chip>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#F4F5F7] hover:bg-[#EAEBEF] text-[#111317] flex items-center justify-center shrink-0 transition"
            title="Configurações do Perfil (Alterar dados e foto)"
            aria-label="Editar Perfil"
          >
            <Settings className="w-5 h-5 text-[#111317]" />
          </button>
        </div>
      </div>

      {/* HUD de Estatísticas */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className={C + " p-3.5"}>
          <p className="text-[11px] font-semibold text-[#6E7381] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#FF5400]" />
            Ofensiva Semanal
          </p>
          <p className="n font-bold text-2xl sm:text-3xl text-[#111317] mt-1">
            {u.of ?? 0}{" "}
            <span className="text-xs sm:text-sm font-medium text-[#6E7381]">semanas</span>
          </p>
        </div>
        <div className={C + " p-3.5"}>
          <p className="text-[11px] font-semibold text-[#6E7381] flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-[#FF5400]" />
            Overall (OVR)
          </p>
          <p className="n font-bold text-2xl sm:text-3xl text-[#FF5400] mt-1">
            {ovr(u.sub || baseSub)} <span className="text-xs sm:text-sm font-medium">OVR</span>
          </p>
        </div>
      </div>

      <Boletim u={u} />

      {editOpen && (
        <ProfileEditModal
          u={u}
          existingUsernames={existingUsernames}
          close={() => setEditOpen(false)}
          save={(patch) => {
            S.upd(u.id, patch);
            setEditOpen(false);
            S.say("Dados e foto de perfil atualizados!");
          }}
        />
      )}
    </div>
  );
}


export function NotificacoesPlayerModal({
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
                  <div className="flex items-center gap-2">
                    <span className="n text-[11px] font-bold text-[#6E7381]">
                      🕒{" "}
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString("pt-BR")
                        : n.timeLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        useHeziPlatform
                          .getState()
                          .setNotifications(
                            S.notifications.filter((x) => x.id !== n.id),
                          );
                        S.say("Notificação excluída.");
                      }}
                      className="p-1 rounded-lg text-[#EF4444] hover:bg-[#FEF2F2] transition"
                      title="Excluir notificação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-semibold text-[#111317]">
                  {n.message ||
                    (n.type === "group_invite"
                      ? `${n.fromUserName} convidou você para formar um time na fila (${n.eventTitle || "Pelada"}).`
                      : `Solicitação para entrar em ${n.eventTitle || "Evento"}: ${
                          n.status === "pending"
                            ? "Aguardando aceitação do organizador"
                            : n.status === "accepted"
                              ? "Confirmada! Você entrou na fila!"
                              : "Cancelada / Não aprovada"
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
    assinantes: number;
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

