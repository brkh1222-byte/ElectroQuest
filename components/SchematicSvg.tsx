"use client";

import type { Recipe } from "@/lib/schemas";

/**
 * Connection map rendered from the recipe's schematic netlist: one vertical bus per net,
 * one row per component pin, a dot where a pin joins a net.
 */
const NET_COLORS = ["#dc2626", "#111827", "#2563eb", "#16a34a", "#9333ea", "#ea580c", "#0891b2", "#ca8a04", "#db2777", "#4b5563"];

export function SchematicSvg({ recipe }: { recipe: Recipe }) {
  const nets = recipe.schematic.nets;
  const rows: { ref: string; pin: string; net: number }[] = [];
  const order = recipe.layout.components.map((c) => c.ref);
  const byRef = new Map<string, { pin: string; net: number }[]>();
  nets.forEach((n, ni) => {
    for (const p of n.pins) {
      const [ref, pin] = [p.slice(0, p.indexOf(".")), p.slice(p.indexOf(".") + 1)];
      byRef.set(ref, [...(byRef.get(ref) ?? []), { pin, net: ni }]);
    }
  });
  for (const ref of order) for (const p of byRef.get(ref) ?? []) rows.push({ ref, ...p });

  const colorOf = (i: number) => {
    const name = nets[i].name.toUpperCase();
    if (/^(VCC|5V|\+)/.test(name)) return "#dc2626";
    if (/^GND/.test(name)) return "#111827";
    return NET_COLORS[(i + 2) % NET_COLORS.length];
  };

  const RH = 22;
  const LW = 120;
  const NW = 46;
  const top = 46;
  const W = LW + nets.length * NW + 20;
  const H = top + rows.length * RH + 10;
  let lastRef = "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="schematic">
      {nets.map((n, i) => (
        <g key={n.name}>
          <text x={LW + i * NW + NW / 2} y={18} fontSize={10} fontWeight={700} textAnchor="middle" fill={colorOf(i)} transform={`rotate(-20 ${LW + i * NW + NW / 2} 18)`}>
            {n.name}
          </text>
          <line x1={LW + i * NW + NW / 2} x2={LW + i * NW + NW / 2} y1={top - 12} y2={H - 6} stroke={colorOf(i)} strokeWidth={3} opacity={0.85} />
        </g>
      ))}
      {rows.map((r, i) => {
        const y = top + i * RH;
        const x = LW + r.net * NW + NW / 2;
        const showRef = r.ref !== lastRef;
        lastRef = r.ref;
        return (
          <g key={`${r.ref}.${r.pin}`}>
            {showRef && i > 0 && <line x1={4} x2={W - 4} y1={y - RH / 2} y2={y - RH / 2} stroke="#e5e7eb" />}
            {showRef && (
              <text x={6} y={y + 4} fontSize={13} fontWeight={800} fill="#111">
                {r.ref}
              </text>
            )}
            <text x={LW - 34} y={y + 4} fontSize={11} fill="#4b5563" textAnchor="end">
              {r.pin}
            </text>
            <line x1={LW - 28} x2={x} y1={y} y2={y} stroke={colorOf(r.net)} strokeWidth={2} />
            <circle cx={x} cy={y} r={5} fill={colorOf(r.net)} />
          </g>
        );
      })}
    </svg>
  );
}
