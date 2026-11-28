import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, List, Map as MapIcon, MapPin, MessageCircle, ShieldCheck, UserCheck } from "lucide-react";
import { usePartnerStore } from "../services/partnerService";

export function TreinosPage() {
  const partners = usePartnerStore((s) => s.partners);
  const trainingSlots = usePartnerStore((s) => s.trainingSlots || []);

  const [cityFilter, setCityFilter] = useState("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMapPartnerId, setSelectedMapPartnerId] = useState<string | null>(null);

  const qualifiedPartners = useMemo(
    () =>
      partners.filter(
        (p) =>
          p.is_active &&
          p.partner_tier === "qualified" &&
          Boolean(p.address && p.address.trim().length > 0),
      ),
    [partners],
  );

  const cities = useMemo(
    () =>
      Array.from(
        new Set(qualifiedPartners.map((p) => (p.city || "").trim()).filter(Boolean)),
      ).sort(),
    [qualifiedPartners],
  );

  const neighborhoods = useMemo(
    () =>
      Array.from(
        new Set(
          qualifiedPartners
            .filter((p) => cityFilter === "all" || (p.city || "").trim() === cityFilter)
            .map((p) => (p.neighborhood || "").trim())
            .filter(Boolean),
        ),
      ).sort(),
    [qualifiedPartners, cityFilter],
  );

  const filtered = useMemo(
    () =>
      qualifiedPartners.filter((p) => {
        if (cityFilter !== "all" && (p.city || "").trim() !== cityFilter) return false;
        if (neighborhoodFilter !== "all" && (p.neighborhood || "").trim() !== neighborhoodFilter)
          return false;
        return true;
      }),
    [qualifiedPartners, cityFilter, neighborhoodFilter],
  );

  const mapPartner =
    filtered.find((p) => p.id === selectedMapPartnerId) ||
    filtered.find((p) => p.latitude && p.longitude) ||
    filtered[0] ||
    null;

  const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="min-h-dvh bg-[#F8F9FA] text-[#111317] pb-16">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6E7381] hover:text-[#111317]"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a HEZI
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase bg-[#FFF4EE] text-[#FF5500] px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Centros Oficialmente Qualificados HEZI
          </span>
        </div>

        <div className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111317]">
                Onde Treinar — Centros Qualificados HEZI
              </h1>
              <p className="text-xs text-[#6E7381] mt-0.5">
                Escolas, projetos e quadras com professor habilitado para turmas, check-in e avaliação OVR.
              </p>
            </div>

            <div className="flex rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  viewMode === "list"
                    ? "bg-[#111317] text-white"
                    : "text-[#6E7381] hover:text-[#111317]"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  viewMode === "map"
                    ? "bg-[#111317] text-white"
                    : "text-[#6E7381] hover:text-[#111317]"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Mapa
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setNeighborhoodFilter("all");
              }}
              className="px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
            >
              <option value="all">Todas as Cidades</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={neighborhoodFilter}
              onChange={(e) => setNeighborhoodFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#EAEBEF] bg-[#F8F9FA] text-xs font-bold"
            >
              <option value="all">Todos os Bairros</option>
              {neighborhoods.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-[#EAEBEF] rounded-2xl p-8 text-center space-y-2">
            <MapPin className="w-8 h-8 text-[#9CA3AF] mx-auto" />
            <p className="text-sm font-extrabold text-[#111317]">
              Nenhum centro qualificado encontrado para este filtro
            </p>
            <p className="text-xs text-[#6E7381]">
              Apenas parceiros completos com professor habilitado e endereço cadastrado aparecem aqui.
            </p>
          </div>
        ) : viewMode === "map" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-[#EAEBEF] rounded-2xl overflow-hidden shadow-xs min-h-[380px]">
              {mapPartner && mapPartner.latitude && mapPartner.longitude ? (
                <iframe
                  title={`Mapa ${mapPartner.name}`}
                  className="w-full h-[400px] border-0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapPartner.longitude - 0.015}%2C${mapPartner.latitude - 0.015}%2C${mapPartner.longitude + 0.015}%2C${mapPartner.latitude + 0.015}&layer=mapnik&marker=${mapPartner.latitude}%2C${mapPartner.longitude}`}
                />
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-2 bg-[#F8F9FA]">
                  <MapPin className="w-8 h-8 text-[#FF5500]" />
                  <p className="text-sm font-extrabold">
                    {mapPartner?.name}
                  </p>
                  <p className="text-xs text-[#6E7381]">
                    {mapPartner?.address} · {mapPartner?.neighborhood} {mapPartner?.city}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    Coordenadas (latitude/longitude) ainda não informadas para este local.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedMapPartnerId(p.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition ${
                    mapPartner?.id === p.id
                      ? "bg-[#FFF4EE] border-[#FF5500]"
                      : "bg-white border-[#EAEBEF] hover:border-[#FF5500]"
                  }`}
                >
                  <p className="font-extrabold text-sm text-[#111317]">{p.name}</p>
                  <p className="text-xs text-[#6E7381]">
                    {p.neighborhood ? `${p.neighborhood} · ` : ""}{p.city}
                  </p>
                  {p.coach_display_name && (
                    <p className="text-[11px] font-bold text-[#FF5500] mt-1">
                      Prof. {p.coach_display_name}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((p) => {
              const slots = trainingSlots.filter((sl) => sl.partner_id === p.id && sl.is_active);
              const scheduleText =
                p.training_schedule_summary ||
                slots
                  .map((sl) => `${weekdayNames[sl.weekday]} ${sl.start_time.slice(0, 5)}`)
                  .join(" · ") ||
                "Horários a confirmar";
              const cleanWpp = (p.whatsapp_contact || "").replace(/\D/g, "");
              const waHref = cleanWpp
                ? `https://wa.me/${cleanWpp.startsWith("55") ? cleanWpp : `55${cleanWpp}`}?text=${encodeURIComponent(
                    `Olá! Vim pela HEZI FAM e quero agendar uma aula experimental / matrícula em ${p.name}.`,
                  )}`
                : null;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#EAEBEF] rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center gap-3.5">
                    {p.logo_url ? (
                      <img
                        src={p.logo_url}
                        alt={p.name}
                        className="w-16 h-16 rounded-2xl object-contain bg-[#F8F9FA] p-1 border border-[#EAEBEF] shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#111317] text-[#FF5500] flex items-center justify-center font-black text-lg shrink-0">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-extrabold text-base text-[#111317] truncate">
                        {p.name}
                      </h2>
                      <p className="text-xs text-[#6E7381] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                        <span className="truncate">
                          {p.neighborhood ? `${p.neighborhood} · ` : ""}
                          {p.city || ""}
                        </span>
                      </p>
                      {p.coach_display_name && (
                        <p className="text-xs font-bold text-[#111317] flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                          Prof. {p.coach_display_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#F8F9FA] border border-[#EAEBEF] rounded-xl p-3 space-y-1 text-xs">
                    <p className="font-bold text-[#111317] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                      {scheduleText}
                    </p>
                    <p className="text-[#6E7381]">{p.address}</p>
                  </div>

                  {waHref ? (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full min-h-[44px] rounded-xl bg-[#FF5500] hover:bg-[#e04b00] text-white font-extrabold text-xs px-4 py-2.5 flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Agendar Aula Experimental / Matrícula
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full min-h-[44px] rounded-xl bg-[#F4F5F7] text-[#6E7381] font-extrabold text-xs px-4 py-2.5"
                    >
                      Contato não informado
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
