import { Award, Dribbble, MessageCircle, Shirt, Star, Zap } from "lucide-react";
import { wa } from "@/lib/hezi/store";
import { Btn, C, OB } from "./shared";
import type { AppContextProps } from "./types";

export function AssinantePage({ S }: { S: AppContextProps }) {
  const userName = S.me ? S.me.nome : "";
  const wppUrl = wa(
    userName
      ? `Olá! Sou ${userName}, já tenho conta na plataforma HEZI FAM e quero ser assinante da Hezi Skills!`
      : "Olá! Vim pela plataforma HEZI FAM e quero ser assinante da Hezi Skills!",
  );

  const vantagens = [
    {
      icon: <Dribbble className="w-5 h-5 text-[#FF5400]" />,
      title: "Treinos de Elite com a Hezi Skills",
      desc: "Aulas práticas em quadra, turma fechada apenas com assinantes selecionados, treino fechado, focados em fundamentos reais de jogo, evolução expressiva, e leitura.",
    },
    {
      icon: <Award className="w-5 h-5 text-[#FF5400]" />,
      title: "Avaliação de evolução Mensal com progresso digital",
      desc: "Avaliação técnica periódica com nossos professores analíse de fundamento, detecção de assimetria, e  nota técnica. Overall (65 → 99)",
    },
    {
      icon: <Zap className="w-5 h-5 text-[#FF5400]" />,
      title: "Multiplicador de Grind Points (GP)",
      desc: "Assinantes ganham o dobro de Grind Points (GP) nos treinos, ao entrar na pelada e eventos, desbloqueando meias, adesivos, cupons e camisetas no Hezi Pass na metade do tempo.",
    },
    {
      icon: <Shirt className="w-5 h-5 text-[#FF5400]" />,
      title: "Desconto Exclusivo nos Drops",
      desc: "Desconto especial garantido em todas as coleções lançadas e prioridade de reserva nos próximos lançamentos",
    },
    {
      icon: <Star className="w-5 h-5 text-[#FF5400]" />,
      title: "Prioridade em Eventos",
      desc: "Acesso a treinos fechados, jogos e torneios.",
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="bg-[#111317] text-white rounded-2xl p-6 space-y-3 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-[#FF5400] text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full">
          Assinatura Oficial Hezi Skills
        </div>
        <h1 className="font-extrabold text-3xl leading-tight">
          Evolua seu jogo, torne-se um atleta de elite.
        </h1>
        <p className="text-xs text-[#9CA3AF] leading-relaxed">
          Confira todas as vantagens exclusivas para assinantes da comunidade HEZI:
        </p>
      </div>

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

      <div className="bg-[#FFF4EE] border-2 border-[#FF5400] rounded-2xl p-5 text-center space-y-3">
        <p className="font-extrabold text-lg text-[#111317]">
          Pronto para evoluir?
        </p>
        <p className="text-xs text-[#6E7381]">
          Clique no botão abaixo para falar diretamente com a equipe da Hezi no WhatsApp e ativar sua assinatura.
        </p>
        <Btn href={wppUrl} c={OB}>
          <MessageCircle className="w-4 h-4" />
          Quero ser assinante
        </Btn>

        {S.role === "visitante" && !S.me && (
          <div className="pt-2 border-t border-[#FF5400]/20 flex items-center justify-center gap-3 text-xs text-[#6E7381]">
            <span>Já tem conta?</span>
            <button
              type="button"
              onClick={S.openLoginForAssinante}
              className="font-extrabold text-[#FF5400] hover:underline"
            >
              Fazer Login
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={S.openRegisterForAssinante}
              className="font-extrabold text-[#111317] hover:underline"
            >
              Criar Conta Grátis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
