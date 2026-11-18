import { compressImageFileToDataUrl, triggerAuthEmailApi, type RegisterFormPayload } from "@/routes/index";
import { hashPassword, isPasswordHashed, verifyPassword } from "@/lib/hezi/security";
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

export function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sanitizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._]/g, "");
}

export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export function isValidBirthDate(val: string): boolean {
  if (!val) return false;
  const digits = val.replace(/\D/g, "");
  if (digits.length < 8) return false;
  let d = 0;
  let m = 0;
  let y = 0;
  if (val.includes("/")) {
    const parts = val.split("/");
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    y = parseInt(parts[2], 10);
  } else if (val.includes("-")) {
    const parts = val.split("-");
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else {
    d = parseInt(digits.slice(0, 2), 10);
    m = parseInt(digits.slice(2, 4), 10);
    y = parseInt(digits.slice(4, 8), 10);
  }
  const currYear = new Date().getFullYear();
  return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1920 && y <= currYear;
}

export function validatePasswordRules(pwd: string) {
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

interface RegisterStateForm {
  nome: string;
  username: string;
  apelido: string;
  dataNascimento: string;
  wpp: string;
  instagram: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  foto: string;
}

export function Cadastro({
  close,
  done,
  existingEmails,
  existingUsernames,
}: {
  close: () => void;
  done: (f: RegisterFormPayload) => void;
  existingEmails: string[];
  existingUsernames: string[];
}) {
  const [f, setF] = useState<RegisterStateForm>(() => {
    try {
      const saved = sessionStorage.getItem("hezi_cad_form");
      if (saved) return JSON.parse(saved) as RegisterStateForm;
    } catch {
      /* ignore */
    }
    return {
      nome: "",
      username: "",
      apelido: "",
      dataNascimento: "",
      wpp: "",
      instagram: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      foto: "",
    };
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [aceiteImagem, setAceiteImagem] = useState(false);
  const [modalTermoOpen, setModalTermoOpen] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem("hezi_cad_form", JSON.stringify(f));
    } catch {
      /* ignore */
    }
  }, [f]);

  const pwdCheck = validatePasswordRules(f.senha);
  const passwordsMatch =
    f.senha.length > 0 && f.senha === f.confirmarSenha;
  const emailTrim = f.email.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
  const emailTaken = existingEmails.includes(emailTrim);

  const cleanUsername = sanitizeUsername(f.username);
  const isUsernameValid = cleanUsername.length >= 3;
  const usernameTaken =
    cleanUsername.length > 0 &&
    (existingUsernames.includes(cleanUsername) ||
      cleanUsername === "admin" ||
      cleanUsername === "professor" ||
      cleanUsername === "prof");

  const isBirthDateValid = isValidBirthDate(f.dataNascimento);

  const ok =
    f.nome.trim().length > 1 &&
    isUsernameValid &&
    !usernameTaken &&
    f.apelido.trim().length > 1 &&
    isBirthDateValid &&
    f.wpp.replace(/\D/g, "").length >= 10 &&
    f.instagram.trim().length > 1 &&
    isEmailValid &&
    !emailTaken &&
    pwdCheck.valid &&
    passwordsMatch &&
    aceiteImagem;

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
          Preencha seus dados para acessar seu perfil (com seu Nome de Usuário ou
          E-mail), entrar na fila dos eventos e participar do Hezi Pass.
        </p>

        <div className="space-y-2.5">
          <input
            value={f.nome}
            placeholder="Nome completo"
            onChange={(e) => setF({ ...f, nome: e.target.value })}
            className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
          />

          <div>
            <input
              value={f.username}
              placeholder="Nome de usuário (ex: lucas_silva)"
              onChange={(e) =>
                setF({ ...f, username: sanitizeUsername(e.target.value) })
              }
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
            {f.username.length > 0 && !isUsernameValid && (
              <p className="text-xs font-bold text-[#EF4444] mt-1">
                O nome de usuário deve ter pelo menos 3 caracteres.
              </p>
            )}
            {usernameTaken && (
              <p className="text-xs font-bold text-[#EF4444] mt-1">
                Este nome de usuário já está em uso. Escolha outro.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <input
              value={f.apelido}
              placeholder="Apelido (Vulgo)"
              onChange={(e) => setF({ ...f, apelido: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
            />
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={f.dataNascimento}
                placeholder="Nascimento (DD/MM/AAAA)"
                onChange={(e) =>
                  setF({
                    ...f,
                    dataNascimento: formatDateInput(e.target.value),
                  })
                }
                className={
                  "w-full bg-[#F4F5F7] rounded-xl px-3.5 py-3 text-sm font-medium outline-none focus:ring-2 pr-9 " +
                  (f.dataNascimento.length >= 8 && !isBirthDateValid
                    ? "ring-2 ring-[#EF4444]"
                    : "ring-[#FF5400]")
                }
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
            placeholder="E-mail (para ativação e recuperação)"
            onChange={(e) => setF({ ...f, email: e.target.value })}
            className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400]"
          />
          {emailTaken && (
            <p className="text-xs font-bold text-[#EF4444]">
              Este e-mail já está cadastrado.
            </p>
          )}
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={f.senha}
              placeholder="Senha"
              onChange={(e) => setF({ ...f, senha: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400] pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7381] hover:text-[#111317] p-1 transition"
              title={showPwd ? "Ocultar senha" : "Ver senha"}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

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

          <div className="relative">
            <input
              type={showConfirmPwd ? "text" : "password"}
              value={f.confirmarSenha}
              placeholder="Confirmar senha"
              onChange={(e) => setF({ ...f, confirmarSenha: e.target.value })}
              className="w-full bg-[#F4F5F7] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-[#FF5400] pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7381] hover:text-[#111317] p-1 transition"
              title={showConfirmPwd ? "Ocultar senha" : "Ver senha"}
            >
              {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {f.confirmarSenha.length > 0 && !passwordsMatch && (
            <p className="text-xs font-bold text-[#EF4444]">
              As senhas não coincidem.
            </p>
          )}
        </div>

        {/* Bloco de Autorização de Uso de Imagem e Voz */}
        <div className="bg-[#F8F9FA] border border-[#EAEBEF] rounded-2xl p-3.5 space-y-2">
          <h4 className="font-extrabold text-xs text-[#111317]">
            Autorização de uso de imagem e voz
          </h4>
          <p className="text-[11px] leading-relaxed text-[#6E7381]">
            Durante nossos torneios e treinos presenciais, poderão ser
            realizadas fotografias, filmagens e gravações para divulgação dos
            eventos em nossas redes sociais, site e canais oficiais.
          </p>
          <button
            type="button"
            onClick={() => setModalTermoOpen(true)}
            className="text-[11px] font-extrabold text-[#1769e0] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ler termo completo →
          </button>
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={aceiteImagem}
              onChange={(e) => setAceiteImagem(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#FF5400] focus:ring-[#FF5400] cursor-pointer shrink-0"
              required
            />
            <span className="text-[11px] font-semibold text-[#111317] leading-tight">
              Li e concordo com o Termo de Autorização de Uso de Imagem, Voz e Gravação Audiovisual.
            </span>
          </label>
        </div>

        <Btn
          dis={!ok}
          onClick={() =>
            done({
              nome: f.nome,
              username: cleanUsername,
              apelido: f.apelido,
              dataNascimento: f.dataNascimento,
              wpp: f.wpp,
              instagram: f.instagram,
              email: emailTrim,
              senha: f.senha,
              foto: f.foto || undefined,
              autorizacaoImagem: true,
              autorizacaoImagemData: new Date().toISOString(),
            })
          }
          c={OB}
        >
          <CheckCircle2 className="w-4 h-4" />
          Concluir Cadastro e Receber Código no E-mail
        </Btn>

        {/* Modal do Termo Completo */}
        {modalTermoOpen && (
          <div
            className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-3 sm:p-5"
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalTermoOpen(false);
            }}
          >
            <div className="bg-white w-full max-w-[640px] max-h-[85vh] overflow-y-auto rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-2xl text-[#222]">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAEBEF]">
                <h2 className="font-extrabold text-base sm:text-lg text-[#111317]">
                  TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM, VOZ E GRAVAÇÃO AUDIOVISUAL
                </h2>
                <button
                  type="button"
                  onClick={() => setModalTermoOpen(false)}
                  className="text-[#6E7381] hover:text-[#111317] p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-[#444]">
                <div>
                  <h4 className="font-bold text-[#111317] uppercase tracking-wider text-[11px] mb-1">
                    1. IDENTIFICAÇÃO E FINALIDADE
                  </h4>
                  <p>
                    Ao realizar meu cadastro na plataforma HEZI FAM e participar de seus torneios, eventos e atividades esportivas presenciais, declaro estar ciente de que poderão ser realizadas fotografias, filmagens, transmissões e gravações de áudio durante as atividades.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#111317] uppercase tracking-wider text-[11px] mb-1">
                    2. AUTORIZAÇÃO DE USO DE IMAGEM E VOZ
                  </h4>
                  <p>
                    Autorizo, de forma livre, informada e gratuita, a organização HEZI FAM, responsável pela plataforma, a captar, armazenar, editar, reproduzir e divulgar minha imagem, voz e participação nos eventos, exclusivamente para:
                  </p>
                  <p className="mt-1 pl-2 space-y-0.5">
                    • Divulgação dos torneios e competições;<br />
                    • Publicação de fotografias e vídeos nas redes sociais;<br />
                    • Produção de vídeos de melhores momentos e entrevistas;<br />
                    • Divulgação de resultados e premiações;<br />
                    • Materiais institucionais e promocionais da plataforma.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#111317] uppercase tracking-wider text-[11px] mb-1">
                    3. ABRANGÊNCIA DA AUTORIZAÇÃO
                  </h4>
                  <p>
                    A autorização contempla a utilização dos registros em meios digitais, incluindo Instagram, Facebook, YouTube, TikTok, sites e outras plataformas oficiais de divulgação.
                  </p>
                  <p className="mt-1">
                    A autorização é gratuita, não gerando obrigação de pagamento ou remuneração pela utilização da imagem e voz nos contextos e finalidades descritos neste documento.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#111317] uppercase tracking-wider text-[11px] mb-1">
                    4. LIMITAÇÕES E RESPEITO À IMAGEM
                  </h4>
                  <p>
                    A organização compromete-se a utilizar os registros de maneira ética e respeitosa, não realizando edições ou divulgações destinadas a prejudicar minha honra, reputação, dignidade ou imagem pessoal.
                  </p>
                  <p className="mt-1">
                    Esta autorização não permite a utilização da imagem em contextos diferentes daqueles aqui especificados, especialmente em campanhas de terceiros sem autorização específica.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#111317] uppercase tracking-wider text-[11px] mb-1">
                    5. PROTEÇÃO DE DADOS PESSOAIS
                  </h4>
                  <p>
                    Estou ciente de que meus dados pessoais e registros audiovisuais poderão ser tratados conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), respeitando as finalidades informadas, a segurança e os direitos dos titulares.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#111317] uppercase tracking-wider text-[11px] mb-1">
                    6. PRAZO E REVOGAÇÃO
                  </h4>
                  <p>
                    Esta autorização permanecerá válida enquanto não houver solicitação de revogação.
                  </p>
                  <p className="mt-1">
                    Posso solicitar a revogação da autorização a qualquer momento, por meio dos canais oficiais de atendimento da organização. Após o recebimento da solicitação, a organização interromperá novas utilizações dos registros abrangidos pela autorização e avaliará as medidas cabíveis em relação aos materiais já publicados, observadas as obrigações legais e os direitos de terceiros.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#111317] uppercase tracking-wider text-[11px] mb-1">
                    7. DECLARAÇÃO FINAL
                  </h4>
                  <p>
                    Declaro que li, compreendi e concordo com as condições estabelecidas neste termo, autorizando a utilização da minha imagem e voz nos limites aqui descritos.
                  </p>
                  <p className="mt-1">
                    Ao marcar a opção de aceite no cadastro da plataforma, manifesto minha concordância expressa com esta autorização.
                  </p>
                </div>
              </div>

              <div className="pt-2 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setAceiteImagem(true);
                    setModalTermoOpen(false);
                  }}
                  className="w-full py-3 bg-[#111317] hover:bg-[#FF5400] text-white text-xs font-extrabold rounded-xl transition"
                >
                  Entendi e Aceito o Termo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MODAL DE CONFIRMAÇÃO DE E-MAIL PARA ATIVAR A CONTA
// ---------------------------------------------------------------------------
export function EmailVerificationModal({
  u,
  close,
  onVerified,
  onResendCode,
  previewCode,
}: {
  u: HeziUser;
  close: () => void;
  onVerified: () => void;
  onResendCode: () => void;
  previewCode?: string;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  const expectedCode = u.verificationCode || previewCode || "";

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === expectedCode && expectedCode.length > 0) {
      setErr("");
      onVerified();
    } else {
      setErr("Código inválido. Verifique o código de 6 dígitos enviado para o seu e-mail.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-[460px] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl border border-[#EAEBEF]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] text-[#FF5400] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#111317]">
                Confirme seu E-mail
              </h3>
              <p className="text-xs text-[#6E7381]">
                Ative sua conta HEZI FAM®
              </p>
            </div>
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

        <p className="text-xs text-[#6E7381] leading-relaxed">
          Enviamos um código de ativação de 6 dígitos para{" "}
          <strong className="text-[#111317]">{u.email}</strong>. Digite o código
          abaixo para confirmar seu e-mail e ativar sua conta:
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="Código de 6 dígitos (ex: 123456)"
            className="n w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3.5 text-center text-lg font-extrabold tracking-widest text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
          />

          {err && (
            <p className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2] rounded-xl p-2.5">
              ⚠️ {err}
            </p>
          )}

          <button type="submit" className={btBase + OB}>
            <CheckCircle2 className="w-4 h-4" />
            Confirmar E-mail e Ativar Conta
          </button>
        </form>

        <div className="flex items-center justify-between pt-1 text-xs">
          <button
            type="button"
            onClick={onResendCode}
            className="font-extrabold text-[#FF5400] hover:underline"
          >
            Reenviar código para o e-mail
          </button>
          <button
            type="button"
            onClick={close}
            className="font-bold text-[#6E7381] hover:text-[#111317]"
          >
            Confirmar depois
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PÁGINA DE LOGIN (E-MAIL OU NOME DE USUÁRIO + SENHA + ESQUECI A SENHA + RATE LIMIT)
// ---------------------------------------------------------------------------
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000;

export function LoginPage({
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
  const [identifier, setIdentifier] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Estados do fluxo "Esqueci a senha"
  const [forgotMode, setForgotMode] = useState<"off" | "request" | "verify">(
    "off",
  );
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotTargetUserId, setForgotTargetUserId] = useState<number | null>(
    null,
  );
  const [forgotCodeInput, setForgotCodeInput] = useState("");
  const [forgotGeneratedCode, setForgotGeneratedCode] = useState("");
  const [forgotNewPwd, setForgotNewPwd] = useState("");
  const [forgotConfirmPwd, setForgotConfirmPwd] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotErr, setForgotErr] = useState("");

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    const rawInput = identifier.trim().toLowerCase();
    const cleanId = rawInput.replace(/^@+/, "");
    const cleanUsername = sanitizeUsername(rawInput);
    if (!cleanId || !senha) {
      setErrorMsg("Informe seu e-mail (ou nome de usuário) e sua senha.");
      return;
    }

    // Check staff credentials (aceita tanto e-mail quanto nome de usuário)
    if (
      (cleanId === "admin@hezi.com" || cleanId === "admin") &&
      senha === "Admin@2026"
    ) {
      setFailedAttempts(0);
      setErrorMsg("");
      onLoginSuccess("admin");
      return;
    }
    if (
      (cleanId === "professor@hezi.com" ||
        cleanId === "prof@hezi.com" ||
        cleanId === "professor" ||
        cleanId === "prof") &&
      senha === "Prof@2026"
    ) {
      setFailedAttempts(0);
      setErrorMsg("");
      onLoginSuccess("prof");
      return;
    }

    // 1. Autenticação segura no servidor (sem expor senha no cliente)
    try {
      const authRes = await fetch("/api/hezi/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: rawInput, senha }),
      });
      if (authRes.ok) {
        const authData = (await authRes.json()) as { ok?: boolean; userId?: number };
        if (authData.ok && typeof authData.userId === "number") {
          setFailedAttempts(0);
          setErrorMsg("");
          onLoginSuccess(authData.userId);
          return;
        }
      }
    } catch {
      /* fallback local caso offline */
    }

    // 2. Fallback local (caso usuário recém-criado em cache antes do sync)
    const candidateUser = S.users.find((u) => {
      const uEmail = (u.email || "").trim().toLowerCase();
      const uUserRaw = (u.username || "").trim().toLowerCase().replace(/^@+/, "");
      const uSanitized = sanitizeUsername(u.username || "");
      const uApelido = (u.apelido || "").trim().toLowerCase();

      const emailMatches =
        uEmail.length > 0 && (uEmail === rawInput || uEmail === cleanId);
      const usernameMatches =
        (uUserRaw.length > 0 &&
          (uUserRaw === cleanId || uUserRaw === cleanUsername)) ||
        (uSanitized.length > 0 &&
          (uSanitized === cleanUsername || uSanitized === cleanId));
      const apelidoMatches =
        uApelido.length > 0 &&
        (uApelido === cleanId || uApelido === cleanUsername);

      return emailMatches || usernameMatches || apelidoMatches;
    });

    if (candidateUser && (await verifyPassword(senha, candidateUser.senha ?? "Hezi@2026"))) {
      if (!isPasswordHashed(candidateUser.senha)) {
        const hashed = await hashPassword(senha);
        S.upd(candidateUser.id, { senha: hashed });
      }
      void fetch("/api/hezi/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sid: candidateUser.id,
          role: candidateUser.isModerator ? "admin" : candidateUser.tipo,
        }),
      }).catch(() => {});
      setFailedAttempts(0);
      setErrorMsg("");
      onLoginSuccess(candidateUser.id);
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
        `Credenciais inválidas. Restam ${MAX_LOGIN_ATTEMPTS - nextAttempts} tentativa(s) antes do bloqueio temporário.`,
      );
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr("");
    setForgotMsg("");

    const rawClean = forgotIdentifier.trim().toLowerCase();
    const cleanNoAt = rawClean.replace(/^@+/, "");
    const cleanUser = sanitizeUsername(rawClean);
    if (!cleanNoAt) {
      setForgotErr("Informe seu e-mail ou nome de usuário cadastrado.");
      return;
    }

    const target = S.users.find((u) => {
      const uEmail = (u.email || "").trim().toLowerCase();
      const uUserRaw = (u.username || "").trim().toLowerCase().replace(/^@+/, "");
      const uSanitized = sanitizeUsername(u.username || "");
      return (
        uEmail === rawClean ||
        uEmail === cleanNoAt ||
        (uUserRaw.length > 0 &&
          (uUserRaw === cleanNoAt || uUserRaw === cleanUser)) ||
        (uSanitized.length > 0 &&
          (uSanitized === cleanUser || uSanitized === cleanNoAt))
      );
    });

    if (!target || !target.email) {
      setForgotErr(
        "Nenhuma conta encontrada com este e-mail ou nome de usuário.",
      );
      return;
    }

    const code = generateSixDigitCode();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    S.upd(target.id, {
      resetCode: code,
      resetCodeExpiresAt: expiresAt,
    });
    setForgotTargetUserId(target.id);
    setForgotGeneratedCode(code);

    await triggerAuthEmailApi({
      action: "send_password_reset",
      email: target.email,
      nome: target.nome,
      code,
    });

    setForgotMsg(
      `Enviamos um código de recuperação de 6 dígitos para o e-mail ${target.email}.`,
    );
    setForgotMode("verify");
  };

  const handleConfirmPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr("");

    const target = S.users.find((u) => u.id === forgotTargetUserId);
    if (!target) {
      setForgotErr("Sessão de recuperação expirada. Tente novamente.");
      return;
    }

    const expected = target.resetCode || forgotGeneratedCode;
    if (!expected || forgotCodeInput.trim() !== expected) {
      setForgotErr("O código de 6 dígitos informado está incorreto.");
      return;
    }

    const pwdCheck = validatePasswordRules(forgotNewPwd);
    if (!pwdCheck.valid) {
      setForgotErr(
        "A nova senha deve ter no mínimo 8 caracteres, 1 número e 1 caractere especial.",
      );
      return;
    }
    if (forgotNewPwd !== forgotConfirmPwd) {
      setForgotErr("A confirmação de senha não coincide.");
      return;
    }

    S.upd(target.id, {
      senha: forgotNewPwd,
      resetCode: undefined,
      resetCodeExpiresAt: undefined,
      emailVerified: true,
    });

    S.say("Senha redefinida com sucesso! Você já está conectado.");
    setForgotMode("off");
    onLoginSuccess(target.id);
  };

  if (forgotMode !== "off") {
    const targetUser = S.users.find((u) => u.id === forgotTargetUserId);
    const pwdCheck = validatePasswordRules(forgotNewPwd);

    return (
      <div className="p-4 space-y-4">
        <div className={C + " p-6 space-y-4"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF4EE] text-[#FF5400] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-xl text-[#111317]">
                  Esqueci a senha
                </h2>
                <p className="text-xs text-[#6E7381]">
                  Recupere o acesso à sua conta por e-mail
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setForgotMode("off");
                setForgotErr("");
                setForgotMsg("");
              }}
              className="text-xs font-extrabold text-[#6E7381] hover:text-[#111317]"
            >
              ← Voltar ao Login
            </button>
          </div>

          {forgotMode === "request" ? (
            <form onSubmit={handleRequestPasswordReset} className="space-y-3">
              <p className="text-xs text-[#6E7381] leading-relaxed">
                Informe seu <strong>E-mail</strong> ou{" "}
                <strong>Nome de usuário</strong> cadastrado. Enviaremos um
                código de 6 dígitos para o seu e-mail para criar uma nova senha.
              </p>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381] mb-1">
                  E-mail ou Nome de usuário
                </label>
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="seuemail@exemplo.com ou seu_usuario"
                  className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-sm font-medium text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
                />
              </div>

              {forgotErr && (
                <p className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2] rounded-xl p-3">
                  ⚠️ {forgotErr}
                </p>
              )}

              <button type="submit" className={btBase + OB}>
                <Mail className="w-4 h-4" />
                Enviar Código de Recuperação por E-mail
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmPasswordReset} className="space-y-3">
              {forgotMsg && (
                <div className="bg-[#ECFDF5] border border-[#10B981]/30 text-[#10B981] text-xs font-bold rounded-xl p-3">
                  ✓ {forgotMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381] mb-1">
                  Código de 6 dígitos recebido no e-mail
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={forgotCodeInput}
                  onChange={(e) =>
                    setForgotCodeInput(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  className="n w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-center text-base font-extrabold tracking-widest text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381] mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={forgotNewPwd}
                  onChange={(e) => setForgotNewPwd(e.target.value)}
                  placeholder="Mín. 8 caracteres, 1 número e 1 especial"
                  className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-sm font-medium text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
                />
              </div>

              <div className="bg-[#F4F5F7] rounded-xl p-2.5 text-xs space-y-0.5">
                <p
                  className={
                    pwdCheck.minLen
                      ? "text-[#10B981] font-bold"
                      : "text-[#6E7381]"
                  }
                >
                  {pwdCheck.minLen ? "✓" : "•"} Mínimo 8 caracteres
                </p>
                <p
                  className={
                    pwdCheck.hasNumber
                      ? "text-[#10B981] font-bold"
                      : "text-[#6E7381]"
                  }
                >
                  {pwdCheck.hasNumber ? "✓" : "•"} Pelo menos 1 número
                </p>
                <p
                  className={
                    pwdCheck.hasSpecial
                      ? "text-[#10B981] font-bold"
                      : "text-[#6E7381]"
                  }
                >
                  {pwdCheck.hasSpecial ? "✓" : "•"} Pelo menos 1 caractere
                  especial
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381] mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={forgotConfirmPwd}
                  onChange={(e) => setForgotConfirmPwd(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-sm font-medium text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
                />
              </div>

              {forgotErr && (
                <p className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2] rounded-xl p-3">
                  ⚠️ {forgotErr}
                </p>
              )}

              <button type="submit" className={btBase + OB}>
                <CheckCircle2 className="w-4 h-4" />
                Salvar Nova Senha e Entrar
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

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
                : "Entre com seu Nome de usuário ou E-mail para acessar seu Perfil"}
            </p>
          </div>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381] mb-1">
              E-mail ou Nome de usuário
            </label>
            <input
              type="text"
              value={identifier}
              disabled={isLockedOut}
              placeholder="seuemail@exemplo.com ou seu_usuario"
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-sm font-medium text-[#111317] outline-none focus:ring-2 ring-[#FF5400]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#6E7381]">
                Senha
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifier(identifier);
                  setForgotErr("");
                  setForgotMsg("");
                  setForgotMode("request");
                }}
                className="text-xs font-extrabold text-[#FF5400] hover:underline"
              >
                Esqueci a senha?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={senha}
                disabled={isLockedOut}
                placeholder="Digite sua senha"
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-[#F4F5F7] border border-[#EAEBEF] rounded-xl px-4 py-3 text-sm font-medium text-[#111317] outline-none focus:ring-2 ring-[#FF5400] pr-11"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7381] hover:text-[#111317] p-1 transition"
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
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
// PÁGINA INICIAL (HOME)
// ---------------------------------------------------------------------------
