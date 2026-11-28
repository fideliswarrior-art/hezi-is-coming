import { Calendar, CheckCircle2, Clock, MapPin } from "lucide-react";
import type { HeziUser } from "@/lib/hezi/store";
import { usePartnerStore } from "../services/partnerService";

export function TodayTrainingCard({ me }: { me: HeziUser | null }) {
  const { partners, trainingSlots = [], trainingCheckins = [], requestTrainingCheckin } =
    usePartnerStore();

  if (!me || !me.base_partner_id) return null;

  const partner = partners.find((p) => p.id === me.base_partner_id);
  if (!partner) return null;

  const todayWeekday = new Date().getDay();
  const todaySlot = trainingSlots.find(
    (sl) => sl.partner_id === partner.id && sl.is_active && sl.weekday === todayWeekday,
  );
  if (!todaySlot) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const checkin = trainingCheckins.find(
    (c) => c.partner_id === partner.id && c.user_id === me.id && c.session_date === todayStr,
  );

  return (
    <div className="rounded-2xl border-2 border-[#FF5500] bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 bg-[#FF5500] text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full">
          <Calendar className="w-3 h-3" />
          TREINO HOJE · {partner.name}
        </span>
        <span className="text-xs font-extrabold text-[#111317]">
          {todaySlot.start_time.slice(0, 5)} – {todaySlot.end_time.slice(0, 5)}
        </span>
      </div>

      <div className="space-y-1 text-xs text-[#6E7381]">
        <p className="font-extrabold text-sm text-[#111317]">{todaySlot.title}</p>
        <p className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
          <span>
            {partner.address || "Quadra do Projeto"}
            {partner.coach_display_name ? ` · Prof. ${partner.coach_display_name}` : ""}
          </span>
        </p>
      </div>

      {!checkin ? (
        <button
          type="button"
          onClick={() =>
            requestTrainingCheckin({
              partner_id: partner.id,
              slot_id: todaySlot.id,
              user_id: me.id,
              session_date: todayStr,
            })
          }
          className="w-full min-h-[44px] rounded-xl bg-[#FF5500] hover:bg-[#e04b00] text-white font-extrabold text-xs uppercase tracking-wider transition active:scale-95"
        >
          FAZER CHECK-IN NO TREINO
        </button>
      ) : checkin.status === "pending" ? (
        <div className="w-full rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-extrabold text-xs px-3 py-2.5 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          CHECK-IN ENVIADO · AGUARDANDO PROFESSOR
        </div>
      ) : checkin.status === "confirmed" ? (
        <div className="w-full rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs px-3 py-2.5 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          PRESENÇA CONFIRMADA (+{checkin.gp_awarded} GP)
        </div>
      ) : null}
    </div>
  );
}
