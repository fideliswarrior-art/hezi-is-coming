import { Link } from "@tanstack/react-router";
import { ArrowRight, Radio, Trophy } from "lucide-react";
import { TIER_LABELS, MODALITY_LABELS } from "../constants/hpTable";
import { usePartnerStore } from "../services/partnerService";

export function HomePartnerBanner() {
  const partners = usePartnerStore((s) => s.partners);
  const circuits = usePartnerStore((s) => s.circuits);
  const subEvents = usePartnerStore((s) => s.subEvents);

  const nowMs = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const visibleCircuits = circuits.filter((c) => {
    if (c.status !== "ativo" || !c.pin_on_home) return false;
    const stages = subEvents.filter((se) => se.circuit_id === c.id);
    if (stages.length === 0) {
      return nowMs - new Date(c.created_at).getTime() <= thirtyDaysMs;
    }

    // Regra Anti-Abandono: etapa travada em 'em_andamento' > 7 dias após end_date
    const hasStuckStage = stages.some(
      (se) =>
        se.status === "em_andamento" &&
        nowMs - new Date(se.end_date).getTime() > sevenDaysMs,
    );
    if (hasStuckStage) return false;

    // Regra Anti-Abandono: > 30 dias sem nenhuma etapa ativa/futura
    const hasActiveOrRecent = stages.some((se) => {
      const isOpenOrActive =
        se.status === "inscricoes_abertas" ||
        se.status === "em_andamento" ||
        se.status === "aguardando_homologacao";
      if (isOpenOrActive) return true;
      return nowMs - new Date(se.end_date).getTime() <= thirtyDaysMs;
    });
    return hasActiveOrRecent;
  });

  if (visibleCircuits.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleCircuits.map((circuit) => {
        const partner = partners.find((p) => p.id === circuit.partner_id);
        const stages = subEvents
          .filter((se) => se.circuit_id === circuit.id)
          .sort((a, b) => a.stage_order - b.stage_order);
        const activeStage =
          stages.find(
            (s) =>
              s.status === "inscricoes_abertas" ||
              s.status === "em_andamento" ||
              s.status === "aguardando_homologacao",
          ) || stages[stages.length - 1];

        const stageBadgeText = activeStage
          ? activeStage.status === "inscricoes_abertas"
            ? `${activeStage.title} · Inscrições Abertas`
            : activeStage.status === "em_andamento"
              ? `${activeStage.title} · Em Andamento`
              : activeStage.status === "aguardando_homologacao"
                ? `${activeStage.title} · Aguardando Homologação`
                : `${activeStage.title} · Homologada`
          : "Em breve";

        return (
          <div
            key={circuit.id}
            className="relative overflow-hidden rounded-2xl border-2 border-[#FF5400] bg-gradient-to-br from-[#111317] via-[#1C2026] to-[#2A1810] text-white p-5 shadow-sm space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#FF5400] text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                EVENTO LICENCIADO HEZI · VALE HP
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-white">
                  {TIER_LABELS[circuit.sanction_tier]}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#FF8800]">
                  {MODALITY_LABELS[circuit.modality]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {partner?.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt={partner.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-white/20 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#FF5400]/20 border border-[#FF5400]/40 text-[#FF5400] flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#9CA3AF] truncate">
                  {partner?.name || "Parceiro Oficial"} {partner?.instagram ? `· ${partner.instagram}` : ""}
                </p>
                <h3 className="font-extrabold text-lg sm:text-xl leading-tight text-white">
                  {circuit.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#E5E7EB] bg-white/5 rounded-xl px-3 py-2">
              <Radio className="w-3.5 h-3.5 text-[#FF5400] shrink-0" />
              <span className="truncate font-semibold">{stageBadgeText}</span>
            </div>

            <Link
              to="/circuito/$slug"
              params={{ slug: circuit.slug }}
              className="w-full min-h-[46px] rounded-xl bg-[#FF5400] hover:bg-[#E04800] text-white font-extrabold text-xs sm:text-sm px-4 py-3 flex items-center justify-center gap-2 transition active:scale-95"
            >
              ACESSAR CIRCUITO & RANKING
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
