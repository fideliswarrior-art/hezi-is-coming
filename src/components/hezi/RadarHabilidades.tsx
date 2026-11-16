import { baseSub, type CatKey, type HeziUser } from "@/lib/hezi/store";
import { C } from "./shared";

export const RADAR_AXES: { k: CatKey; label: string }[] = [
  { k: "ban", label: "Finalização" },
  { k: "arr", label: "Arremesso" },
  { k: "cb", label: "Drible" },
  { k: "pla", label: "Passe" },
  { k: "def", label: "Defesa" },
  { k: "fis", label: "Físico" },
  { k: "qi", label: "QI & Reação" },
];

export function RadarHabilidades({
  u,
  selectedKey,
  onSelectCat,
}: {
  u: HeziUser;
  selectedKey: string;
  onSelectCat: (k: CatKey) => void;
}) {
  const sub = u.sub || baseSub;
  const prevSub = u.evalHistory?.[1]?.sub || baseSub;
  const cx = 170;
  const cy = 155;
  const maxR = 102;

  const valToRadius = (val: number) => {
    const clamped = Math.max(50, Math.min(99, val));
    return ((clamped - 50) / 49) * maxR;
  };

  const getPoint = (idx: number, radius: number) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 7;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const makePolyPoints = (sourceSub: Record<CatKey, number>) =>
    RADAR_AXES.map((ax, i) => {
      const p = getPoint(i, valToRadius(sourceSub[ax.k] ?? 65));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const gridLevels = [60, 70, 80, 90, 99];

  return (
    <div className={C + " p-4 mb-4 space-y-2"}>
      <div className="flex items-center justify-between">
        <p className="font-extrabold text-sm text-[#111317]">
          Radar de Habilidades
        </p>
        <div className="flex items-center gap-3 text-[11px] font-bold text-[#6E7381]">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 border-t-2 border-dashed border-[#9CA3AF]" />
            Ciclo Anterior
          </span>
          <span className="inline-flex items-center gap-1 text-[#111317]">
            <span className="w-2 h-2 rounded-full bg-[#FF5400]" />
            Atual
          </span>
        </div>
      </div>

      <svg
        viewBox="0 0 340 310"
        className="w-full max-w-[340px] mx-auto select-none touch-manipulation"
      >
        {gridLevels.map((lvl) => {
          const pts = RADAR_AXES.map((_, i) => {
            const p = getPoint(i, valToRadius(lvl));
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(" ");
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#EAEBEF"
              strokeWidth="1.2"
            />
          );
        })}

        {RADAR_AXES.map((ax, i) => {
          const p = getPoint(i, maxR);
          return (
            <line
              key={ax.k}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#EAEBEF"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={makePolyPoints(prevSub)}
          fill="rgba(156, 163, 175, 0.10)"
          stroke="#9CA3AF"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        <polygon
          points={makePolyPoints(sub)}
          fill="rgba(255, 84, 0, 0.22)"
          stroke="#FF5400"
          strokeWidth="2.5"
        />

        {RADAR_AXES.map((ax, i) => {
          const val = sub[ax.k] ?? 65;
          const pt = getPoint(i, valToRadius(val));
          const lblPt = getPoint(i, maxR + 22);
          const isSel = selectedKey === ax.k;
          const anchor =
            Math.abs(lblPt.x - cx) < 10
              ? "middle"
              : lblPt.x > cx
                ? "start"
                : "end";

          return (
            <g
              key={ax.k}
              onClick={() => onSelectCat(ax.k)}
              className="cursor-pointer"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSel ? 6 : 4.5}
                fill={isSel ? "#111317" : "#FF5400"}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
              <text
                x={lblPt.x}
                y={lblPt.y - 2}
                textAnchor={anchor}
                className="text-[10.5px] font-extrabold fill-[#111317]"
              >
                {ax.label}
              </text>
              <text
                x={lblPt.x}
                y={lblPt.y + 10}
                textAnchor={anchor}
                className="text-[10.5px] font-black fill-[#FF5400]"
              >
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
