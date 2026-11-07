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
import { usePelada, getPlayerPeladaStatus } from "@/lib/pelada/store";
import { useRealtimeSync } from "@/lib/hezi/sync";
import { CourtMasterOrganizer, useTick } from "./pelada";

export const Route = createFileRoute("/")({
  component: HeziSuperApp,
});

const C = "bg-white border border-[#EAEBEF] rounded-2xl shadow-sm";
const OB = "bg-[#FF5400] text-white";
const GRN = "bg-[#ECFDF5] text-[#10B981]";
const RED = "bg-[#FEF2F2] text-[#EF4444]";
const btBase =
  "flex items-center justify-center gap-2 w-full text-center rounded-xl py-3.5 px-4 font-extrabold text-sm transition active:scale-95 ";

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
        "inline-flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1 " +
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
  return <h2 className="font-extrabold text-lg mb-3 text-[#111317]">{children}</h2>;
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
  setTab: (tab: "home" | "pelada" | "painel") => void;
  setCad: (open: boolean) => void;
  openCourtMaster: () => void;
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end justify-center">
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
          Leva 15 segundos. Depois você entra na fila sozinho pelo celular.
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
          Criar conta e entrar na fila
        </Btn>
      </div>
    </div>
  );
}

function Home({ S }: { S: AppContextProps }) {
  const P: [string, string, string, string][] = [
    [
      "Camiseta Oversized Heavyweight",
      "R$ 120,00",
      "👕",
      "Algodão 280g · Modelagem Boxy Streetwear",
    ],
    [
      "Mesh Shorts Basketball",
      "R$ 90,00",
      "🩳",
      "Dupla camada respirável · Bolsos com zíper",
    ],
  ];

  const mainPelada = S.evs.find((e) => e.tp === "Pelada") || S.evs[0];

  return (
    <div className="p-4 space-y-6">
      {/* Hero */}
      <div className={C + " p-6"}>
        <img src={LOGO} className="h-14 invert mb-2" alt="HEZI FAM®" />
        <h1 className="font-extrabold text-4xl leading-tight tracking-tight text-[#111317]">
          Moving the game.
        </h1>
        <p className="text-[#6E7381] text-sm mt-2 mb-5">
          Cadastre-se e participe do Hezi Pass para ganhar prêmios, entrar na
          fila da pelada pelo celular e acompanhar sua evolução.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Btn onClick={() => S.setTab("pelada")} c={OB}>
            <span>🏀</span> Quero Jogar
          </Btn>
          <Btn
            onClick={() => S.setTab("painel")}
            c="bg-[#111317] text-white"
          >
            <span>⚡</span> Sou Aluno
          </Btn>
        </div>
      </div>

      {/* Card Aviso Rápido da Próxima Pelada Oficial */}
      {mainPelada && (
        <div className={C + " p-4 border-l-4 border-l-[#FF5400]"}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF5400]">
              ● Evento Ativo na Quadra
            </span>
            <Chip c="bg-[#F4F5F7] text-[#6E7381]">
              {mainPelada.f.length} na fila
            </Chip>
          </div>
          <p className="font-extrabold text-base text-[#111317]">
            {mainPelada.t}
          </p>
          <p className="text-xs text-[#6E7381] mb-3">
            {mainPelada.q} · {mainPelada.l}
          </p>
          <Btn
            onClick={() => {
              S.setTab("pelada");
              S.join(mainPelada.id);
            }}
            c="bg-[#FFF4EE] text-[#FF5400] py-2.5 text-xs"
          >
            Entrar na Fila pelo Celular →
          </Btn>
        </div>
      )}

      {/* Comparativo Jogador Grátis vs Aluno Hezi Skills */}
      <div className="grid grid-cols-2 gap-3">
        <div className={C + " p-4"}>
          <p className="text-2xl">🏀</p>
          <p className="font-extrabold text-sm mt-1 text-[#111317]">
            Jogador da Pelada
          </p>
          <p className="text-xs text-[#6E7381] mb-2">Conta grátis</p>
          <p className="text-xs leading-relaxed text-[#111317]">
            • Fila pelo celular
            <br />• Cadastro rápido em eventos
            <br />• Hezi Pass grátis
          </p>
        </div>
        <div className={C + " p-4 border-[#FF5400]"}>
          <p className="text-2xl">⚡</p>
          <p className="font-extrabold text-sm mt-1 text-[#111317]">
            Aluno Hezi Skills
          </p>
          <p className="text-xs text-[#FF5400] font-bold mb-2">Assinante</p>
          <p className="text-xs leading-relaxed text-[#111317]">
            • Treinos com a Hezi Skills
            <br />• Boletim de evolução
            <br />• Desconto + pontos 2x
          </p>
        </div>
      </div>

      {/* Drop 1: Basic Collection */}
      <div>
        <Hd>Basic Collection · Drop 1: Resistência</Hd>
        <div className="space-y-3">
          {P.map(([n, p, e, desc]) => (
            <div key={n} className={C + " p-3 flex gap-3 items-center"}>
              <div className="w-20 h-20 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-4xl shrink-0">
                {e}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight text-[#111317]">
                  {n}
                </p>
                <p className="text-[11px] text-[#6E7381] mt-0.5">{desc}</p>
                <p className="n font-bold text-[#FF5400] text-lg my-1">{p}</p>
                <Btn
                  href={wa("Quero reservar: " + n + " (" + p + ")")}
                  c="bg-[#FFF4EE] text-[#FF5400] py-2 text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Reservar via WhatsApp
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pelada({ S }: { S: AppContextProps }) {
  const peladaStore = usePelada();
  useTick();

  const myCourtStatus = S.me
    ? getPlayerPeladaStatus(peladaStore, {
        userId: String(S.me.id),
        name: S.me.nome,
      })
    : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Hd>Peladas e eventos</Hd>
        {S.role === "admin" && (
          <button
            type="button"
            onClick={S.openCourtMaster}
            className="text-xs font-extrabold bg-[#111317] text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5"
          >
            <Timer className="w-3.5 h-3.5 text-[#FF5400]" />
            Abrir Court Master
          </button>
        )}
      </div>

      {/* Status ao vivo no Court Master se a partida estiver rolando */}
      {myCourtStatus && myCourtStatus.status !== "not-in-pelada" && (
        <div className="bg-[#FFF4EE] border border-[#FF5400]/30 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF5400]">
              Status Court Master 3x3
            </p>
            <p className="text-sm font-extrabold text-[#111317]">
              {myCourtStatus.status === "on-court"
                ? `🏀 Você está EM QUADRA (${myCourtStatus.teamLabel} · Lado ${myCourtStatus.side})`
                : myCourtStatus.status === "champion-waiting"
                  ? `👑 Campeão aguardando desafiante (${myCourtStatus.teamLabel})`
                  : myCourtStatus.entryKind === "team"
                    ? `⏱️ Seu time (${myCourtStatus.teamLabel}) é o #${myCourtStatus.position} da fila`
                    : `📋 Posição no organizador Court Master: #${myCourtStatus.position}`}
            </p>
          </div>
          <Dribbble className="w-6 h-6 text-[#FF5400] shrink-0" />
        </div>
      )}

      {S.evs.length === 0 && (
        <p className="text-sm text-[#6E7381]">
          Nenhum evento ativo agora. O administrador abrirá a próxima pelada em
          breve.
        </p>
      )}

      {S.evs.map((e) => {
        const pos = S.me ? e.f.indexOf(S.me.id) + 1 : 0;
        const onlyVip = e.tp === "Treino";
        return (
          <div key={e.id} className={C + " p-4"}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-extrabold text-base text-[#111317]">{e.t}</p>
                <p className="text-xs text-[#6E7381]">
                  {e.q} · {e.l}
                </p>
              </div>
              <Chip
                c={
                  onlyVip
                    ? "bg-[#FFF4EE] text-[#FF5400]"
                    : "bg-[#F4F5F7] text-[#6E7381]"
                }
              >
                {e.tp}
              </Chip>
            </div>

            <p className="text-xs bg-[#F4F5F7] rounded-lg p-2.5 my-3 text-[#111317] font-medium">
              📋 {e.r}
            </p>

            {pos ? (
              <Btn dis={true} c="bg-[#10B981] text-white">
                <CheckCircle2 className="w-4 h-4" />✓ Você está na fila -
                Posição #{pos}
              </Btn>
            ) : (
              <Btn onClick={() => S.join(e.id)} c={OB}>
                Entrar na Fila pelo Celular
              </Btn>
            )}

            <p className="text-xs font-bold text-[#6E7381] mt-4 mb-2 uppercase tracking-wider">
              FILA DE ESPERA · {e.f.length}
            </p>

            {e.f.length === 0 ? (
              <p className="text-xs text-[#6E7381]">
                Fila vazia. Seja o primeiro a entrar pelo celular!
              </p>
            ) : (
              e.f.map((id, i) => {
                const u = S.users.find((x) => x.id === id);
                if (!u) return null;
                const isMe = S.me?.id === u.id;
                return (
                  <div
                    key={id}
                    className={
                      "flex items-center gap-2 py-2 border-t border-[#EAEBEF] text-sm " +
                      (isMe ? "bg-[#FFF4EE]/60 -mx-2 px-2 rounded-lg" : "")
                    }
                  >
                    <span className="n font-bold text-[#FF5400] w-8">
                      #{i + 1}
                    </span>
                    <span className="flex-1 font-semibold text-[#111317] truncate">
                      {u.nome}{" "}
                      <span className="text-xs font-normal text-[#6E7381]">
                        ({u.pos})
                      </span>
                    </span>
                    {u.tipo === "aluno" && u.st === "ativo" && (
                      <Chip c="bg-[#FFF4EE] text-[#FF5400]">ALUNO VIP</Chip>
                    )}
                    {S.role === "admin" && (
                      <button
                        type="button"
                        onClick={() =>
                          S.setEvs(
                            S.evs.map((x) =>
                              x.id === e.id
                                ? { ...x, f: x.f.filter((y) => y !== id) }
                                : x,
                            ),
                          )
                        }
                        className="text-[#EF4444] text-xs font-bold px-2 py-1 hover:bg-[#FEF2F2] rounded-md"
                      >
                        remover
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        );
      })}
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
                    "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full " +
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
          const asym = c.k === "ban" && Math.abs((r.dir ?? 0) - (r.esq ?? 0)) > 4;
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
                  <p className="text-[11px] text-[#6E7381]">
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
      <p className="text-center text-[11px] text-[#6E7381] mt-3">
        🔒 Ficha individual privada · Próxima avaliação técnica de quadra em 15
        dias.
      </p>
    </div>
  );
}

function Painel({ S }: { S: AppContextProps }) {
  const u = S.me;
  const wppBtn = (
    <Btn
      href={wa("Olá treinador! Quero saber mais sobre a assinatura Hezi Skills.")}
      c={OB}
    >
      <MessageCircle className="w-4 h-4" />
      Chamar o treinador no WhatsApp
    </Btn>
  );

  if (!u) {
    return (
      <div className="p-4 space-y-4">
        <div className={C + " p-6 text-center"}>
          <p className="text-4xl">🔐</p>
          <h2 className="font-extrabold text-xl my-2 text-[#111317]">
            Entre para ver seu painel
          </h2>
          <p className="text-sm text-[#6E7381] mb-4">
            Crie sua conta grátis para entrar na fila da pelada e acumular
            pontos no Hezi Pass, ou selecione seu login no topo.
          </p>
          <Btn onClick={() => S.setCad(true)} c={OB}>
            Criar conta grátis
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
            Assinando a{" "}
            <strong className="text-[#111317]">Hezi Skills</strong> você tem
            treino com o professor, ficha de avaliação técnica (Overall 65→99),
            desconto nas roupas, prioridade em eventos e multiplicador de pontos
            2x no Hezi Pass.
          </p>
          {wppBtn}
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
            <p className="text-xs text-[#6E7381] mb-1.5">{u.pos} · Turma Terça 16:30</p>
            <Chip c={GRN}>🟢 Matrícula Regular</Chip>
          </div>
          <div className="text-center bg-[#FFF4EE] px-3.5 py-2 rounded-2xl border border-[#FF5400]/20">
            <p className="n font-bold text-4xl text-[#FF5400] leading-none">
              {ovr(sub)}
            </p>
            <p className="text-[10px] font-extrabold text-[#6E7381] mt-0.5">
              OVERALL
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

  // Cálculo de prévia em tempo real (Inércia 70% histórico + 30% sessão)
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
            <p className="text-[11px] font-extrabold uppercase text-[#FF5400]">
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
                  <p className="n text-[11px] text-[#6E7381]">
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
          Ações Rápidas de Check-in: <span className="text-[#FF5400]">{u.nome}</span>
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
            S.say("Evento criado e publicado na Home!");
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
                // Sync called players to Court Master as well
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

function Staff({
  S,
  initialSubTab,
  onSubTabChange,
}: {
  S: AppContextProps;
  initialSubTab?: "av" | "al" | "ev" | "cm";
  onSubTabChange?: (st: "av" | "al" | "ev" | "cm") => void;
}) {
  const adm = S.role === "admin";
  const T: ["av" | "al" | "ev" | "cm", string][] = [
    ["av", "Avaliar"],
    ["al", "Alunos"],
    ...(adm
      ? ([
          ["ev", "Eventos"],
          ["cm", "Court Master"],
        ] as ["ev" | "cm", string][])
      : []),
  ];
  const [t, setT] = useState<"av" | "al" | "ev" | "cm">(initialSubTab || "av");

  useEffect(() => {
    if (initialSubTab) setT(initialSubTab);
  }, [initialSubTab]);

  const handleSelect = (k: "av" | "al" | "ev" | "cm") => {
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

  const [tab, setTab] = useState<"home" | "pelada" | "painel">("home");
  const [staffSubTab, setStaffSubTab] = useState<"av" | "al" | "ev" | "cm">(
    "av",
  );
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
      say("Conta criada! Você já está na fila da pelada! 🏀");
    } else {
      say("Conta grátis criada com sucesso!");
    }
  };

  const openCourtMaster = () => {
    // Sync current Pelada event queue players into Court Master
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
  };

  const staff = role === "admin" || role === "professor";
  const isWideCourtMaster =
    staff && tab === "painel" && staffSubTab === "cm" && role === "admin";

  const T: ["home" | "pelada" | "painel", React.ReactNode, string][] = [
    ["home", <HomeIcon key="h" className="w-5 h-5" />, "Início"],
    ["pelada", <Dribbble key="p" className="w-5 h-5" />, "Pelada"],
    [
      "painel",
      staff ? (
        <ClipboardList key="q" className="w-5 h-5" />
      ) : (
        <UserCheck key="m" className="w-5 h-5" />
      ),
      staff ? "Quadra" : "Meu Painel",
    ],
  ];

  return (
    <div className="h-dvh w-full flex justify-center bg-[#F4F5F7] text-[#111317] overflow-hidden">
      <div
        className={
          "relative w-full h-full bg-[#FBFBFC] flex flex-col overflow-hidden sm:border-x border-[#EAEBEF] transition-all duration-300 " +
          (isWideCourtMaster ? "max-w-6xl" : "max-w-[480px]")
        }
      >
        {/* Top Header */}
        <header className="shrink-0 bg-white border-b border-[#EAEBEF]">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setTab("home")}
              className="flex items-center gap-2 text-left"
            >
              <span className="font-extrabold text-lg tracking-tight text-[#111317]">
                HEZI FAM<sup className="text-[9px] text-[#FF5400]">®</sup>
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#6E7381] hidden xs:inline">
                Login:
              </span>
              <select
                value={String(sid)}
                onChange={(e) => {
                  const v = e.target.value;
                  const nextSid =
                    v === "visitante" || v === "prof" || v === "admin"
                      ? v
                      : Number(v);
                  setSid(nextSid);
                  if (nextSid === "prof" || nextSid === "admin") {
                    setStaffSubTab("av");
                  }
                }}
                className="bg-[#F4F5F7] border border-[#EAEBEF] text-xs font-bold rounded-xl px-2.5 py-2 max-w-[190px] text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
                aria-label="Trocar Perfil / Login"
              >
                <option value="visitante">👤 Visitante (Sem Conta)</option>
                <optgroup label="🏀 Jogador Grátis (Convencional)">
                  {users
                    .filter((x) => x.tipo === "jogador")
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        🏀 {x.nome}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="⚡ Alunos Hezi Skills (Assinantes)">
                  {users
                    .filter((x) => x.tipo === "aluno")
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.st === "ativo" ? "🟢" : "🔴"} {x.nome}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Staff / Gestão">
                  <option value="prof">🧑‍🏫 Professor (Quadra)</option>
                  <option value="admin">🔑 Administrador (Geral)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {staff && (
            <div
              className={
                "text-center text-[11px] font-extrabold py-1.5 tracking-wide " +
                (role === "admin" ? "bg-[#111317] text-white" : OB)
              }
            >
              {role === "admin"
                ? "🔑 MODO ADMINISTRADOR (EDIÇÃO GERAL + COURT MASTER)"
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
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#111317] text-white text-xs font-bold rounded-full px-4 py-2.5 z-40 w-max max-w-[90%] text-center shadow-lg">
            {toast}
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <nav className="shrink-0 grid grid-cols-3 bg-white border-t border-[#EAEBEF]">
          {T.map(([k, icon, n]) => (
            <button
              type="button"
              key={k}
              onClick={() => setTab(k)}
              className={
                "py-2.5 flex flex-col items-center gap-0.5 transition active:scale-90 " +
                (tab === k ? "text-[#FF5400]" : "text-[#6E7381]")
              }
            >
              {icon}
              <span className="text-[11px] font-extrabold">{n}</span>
            </button>
          ))}
        </nav>

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
