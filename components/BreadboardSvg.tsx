"use client";

import { COLS, KINDS, parseHole, ROWS_BOTTOM, ROWS_TOP } from "@/lib/breadboard";
import { allSlots } from "@/lib/data";
import { formatSpec } from "@/lib/units";
import type { LayoutComponent, Recipe, Spec } from "@/lib/schemas";

/**
 * Draws a recipe's breadboard layout. For build mode, `step` shows everything placed up to that step:
 * earlier parts dimmed, this step's parts bright, later parts hidden.
 */

const P = 20; // hole pitch
const X0 = 50;
const OFF = 120; // height of the off-board strip (battery, Arduino, servo…)
const RAIL_Y: Record<string, number> = { "t-": OFF + 18, "t+": OFF + 36, "b+": OFF + 330, "b-": OFF + 348 };
const rowY = (r: string) => {
  const ti = (ROWS_TOP as readonly string[]).indexOf(r);
  if (ti >= 0) return OFF + 76 + ti * P;
  return OFF + 196 + (ROWS_BOTTOM as readonly string[]).indexOf(r) * P;
};
const colX = (c: number) => X0 + (c - 1) * P;
const W = X0 + (COLS - 1) * P + 40;
const H = OFF + 372;

const WIRE: Record<string, string> = { red: "#dc2626", black: "#111827", yellow: "#eab308", green: "#16a34a", blue: "#2563eb", orange: "#f97316", white: "#e5e7eb" };
const BAND = ["#111", "#7a4a1e", "#d22", "#f80", "#fd0", "#1a3", "#22c", "#83c", "#888", "#fff"];
const LED_FILL: Record<string, string> = { red: "#ef4444", yellow: "#facc15", green: "#22c55e", blue: "#3b82f6", white: "#f8fafc", orange: "#fb923c" };

function bandsFor(ohms?: number): string[] {
  if (!ohms) return ["#bbb", "#bbb", "#bbb"];
  const exp = Math.floor(Math.log10(ohms)) - 1;
  const two = Math.round(ohms / 10 ** exp);
  const d1 = Math.floor(two / 10);
  const d2 = two % 10;
  return [BAND[d1], BAND[d2], exp >= 0 && exp <= 9 ? BAND[exp] : "#c9a227", "#c9a227"];
}

type Pt = { x: number; y: number };

/** Horizontal window: only the columns the recipe uses (zoomed in on phones), at least 14 columns wide. */
function viewWindow(recipe: Recipe) {
  const cols: number[] = [];
  for (const c of recipe.layout.components) for (const h of Object.values(c.pins)) { const p = parseHole(h); if (p) cols.push(p.col); }
  for (const w of recipe.layout.wires) for (const h of [w.from, w.to]) { const p = parseHole(h); if (p) cols.push(p.col); }
  let lo = Math.max(1, Math.min(...cols) - 1);
  let hi = Math.min(COLS, Math.max(...cols) + 1);
  while (hi - lo < 13) { if (lo > 1) lo--; if (hi < COLS) hi++; if (lo === 1 && hi === COLS) break; }
  return { x0: colX(lo) - 40, x1: colX(hi) + 30 };
}

function offboardLayout(recipe: Recipe, startX: number) {
  const pos = new Map<string, Pt>();
  const boxes: { ref: string; kind: string; x: number; w: number; terms: string[] }[] = [];
  let x = startX + 10;
  for (const c of recipe.layout.components.filter((c) => KINDS[c.kind].offboard)) {
    const used = new Set<string>();
    for (const w of recipe.layout.wires) for (const ep of [w.from, w.to]) if (ep.startsWith(`${c.ref}.`)) used.add(ep.slice(c.ref.length + 1));
    const terms = KINDS[c.kind].terminals!.filter((t) => used.has(t));
    const w = Math.max(90, terms.length * 44 + 20);
    boxes.push({ ref: c.ref, kind: c.kind, x, w, terms });
    terms.forEach((t, i) => pos.set(`${c.ref}.${t}`, { x: x + 20 + i * 44 + 12, y: 92 }));
    x += w + 14;
  }
  return { pos, boxes };
}

function holePos(id: string, off: Map<string, Pt>): Pt | null {
  const h = parseHole(id);
  if (h) return h.kind === "rail" ? { x: colX(h.col), y: RAIL_Y[h.row] } : { x: colX(h.col), y: rowY(h.row) };
  return off.get(id) ?? null;
}

type State = "past" | "current" | "future";

export function BreadboardSvg({ recipe, step, className = "" }: { recipe: Recipe; step?: number; className?: string }) {
  const win = viewWindow(recipe);
  const { pos: off, boxes } = offboardLayout(recipe, win.x0);
  const vbW = Math.max(win.x1 - win.x0, boxes.reduce((a, b) => Math.max(a, b.x + b.w + 10), 0) - win.x0);
  const placedAt = new Map<string, number>();
  recipe.steps.forEach((s, i) => s.add.forEach((a) => placedAt.set(a, i)));
  const stateOf = (id: string): State => {
    if (step === undefined) return "current";
    const at = placedAt.get(id) ?? 0;
    return at < step ? "past" : at === step ? "current" : "future";
  };
  const opacity = (s: State) => (s === "past" ? 0.35 : 1);
  const specOf = (c: LayoutComponent): Spec => allSlots(recipe).find((s) => s.id === c.slot)?.preferred ?? {};

  const holes: React.ReactNode[] = [];
  for (let c = 1; c <= COLS; c++) {
    for (const r of [...ROWS_TOP, ...ROWS_BOTTOM]) holes.push(<rect key={`${r}${c}`} x={colX(c) - 3} y={rowY(r) - 3} width={6} height={6} rx={1} fill="#9ca3af" />);
    for (const r of Object.keys(RAIL_Y)) holes.push(<rect key={`${r}${c}`} x={colX(c) - 3} y={RAIL_Y[r] - 3} width={6} height={6} rx={1} fill="#9ca3af" />);
  }

  return (
    <svg viewBox={`${win.x0} 0 ${vbW} ${H}`} className={`w-full ${className}`} role="img" aria-label="breadboard">
      {/* off-board parts */}
      {boxes.map((b) => {
        const s = stateOf(b.ref);
        if (s === "future") return null;
        const fill = b.kind === "arduino" ? "#0e7490" : b.kind === "battery" ? "#1f2937" : b.kind === "servo" ? "#1d4ed8" : "#4b5563";
        const name = b.kind === "arduino" ? "Arduino" : b.kind === "battery" ? "BATTERY" : b.kind === "servo" ? "SERVO" : "MOTOR";
        return (
          <g key={b.ref} opacity={opacity(s)}>
            <rect x={b.x} y={10} width={b.w} height={78} rx={10} fill={fill} />
            <text x={b.x + 10} y={32} fontSize={15} fontWeight={800} fill="#fff">
              {name}
            </text>
            {b.terms.map((t, i) => (
              <g key={t}>
                <circle cx={b.x + 32 + i * 44} cy={92} r={6} fill="#e5e7eb" stroke="#111" />
                <text x={b.x + 32 + i * 44} y={72} fontSize={12} fontWeight={700} fill="#fff" textAnchor="middle">
                  {t}
                </text>
              </g>
            ))}
          </g>
        );
      })}

      {/* the board */}
      <rect x={X0 - 30} y={OFF} width={W - X0 + 10} height={366} rx={10} fill="#f8f7f2" stroke="#d6d3cc" strokeWidth={2} />
      <rect x={X0 - 22} y={OFF + 172} width={W - X0 - 6} height={10} fill="#e7e5df" />
      <line x1={X0 - 10} x2={W - 30} y1={RAIL_Y["t-"] - 9} y2={RAIL_Y["t-"] - 9} stroke="#2563eb" strokeWidth={2} />
      <line x1={X0 - 10} x2={W - 30} y1={RAIL_Y["t+"] + 9} y2={RAIL_Y["t+"] + 9} stroke="#dc2626" strokeWidth={2} />
      <line x1={X0 - 10} x2={W - 30} y1={RAIL_Y["b+"] - 9} y2={RAIL_Y["b+"] - 9} stroke="#dc2626" strokeWidth={2} />
      <line x1={X0 - 10} x2={W - 30} y1={RAIL_Y["b-"] + 9} y2={RAIL_Y["b-"] + 9} stroke="#2563eb" strokeWidth={2} />
      <text x={X0 - 24} y={RAIL_Y["t-"] + 5} fontSize={14} fontWeight={800} fill="#2563eb">−</text>
      <text x={X0 - 24} y={RAIL_Y["t+"] + 5} fontSize={14} fontWeight={800} fill="#dc2626">+</text>
      <text x={X0 - 24} y={RAIL_Y["b+"] + 5} fontSize={14} fontWeight={800} fill="#dc2626">+</text>
      <text x={X0 - 24} y={RAIL_Y["b-"] + 5} fontSize={14} fontWeight={800} fill="#2563eb">−</text>
      {[...ROWS_TOP, ...ROWS_BOTTOM].map((r) => (
        <text key={r} x={X0 - 20} y={rowY(r) + 4} fontSize={11} fill="#6b7280">
          {r}
        </text>
      ))}
      {[1, 5, 10, 15, 20, 25, 30].map((c) => (
        <text key={c} x={colX(c)} y={OFF + 62} fontSize={11} fill="#6b7280" textAnchor="middle">
          {c}
        </text>
      ))}
      {holes}

      {/* components */}
      {recipe.layout.components
        .filter((c) => !KINDS[c.kind].offboard)
        .map((c) => {
          const s = stateOf(c.ref);
          if (s === "future") return null;
          const pts = Object.fromEntries(Object.entries(c.pins).map(([k, v]) => [k, holePos(v, off)!])) as Record<string, Pt>;
          return (
            <g key={c.ref} opacity={opacity(s)} filter={s === "current" && step !== undefined ? "url(#glow)" : undefined}>
              <Part c={c} pts={pts} spec={specOf(c)} />
            </g>
          );
        })}

      {/* wires */}
      {recipe.layout.wires.map((w) => {
        const s = stateOf(w.id);
        if (s === "future") return null;
        const a = holePos(w.from, off);
        const b = holePos(w.to, off);
        if (!a || !b) return null;
        const lift = Math.min(60, Math.abs(a.x - b.x) / 3 + 18);
        const d = `M${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`;
        return (
          <g key={w.id} opacity={opacity(s)}>
            <path d={d} stroke="#00000033" strokeWidth={8} fill="none" strokeLinecap="round" />
            <path d={d} stroke={WIRE[w.color]} strokeWidth={5} fill="none" strokeLinecap="round" />
            <circle cx={a.x} cy={a.y} r={4} fill={WIRE[w.color]} stroke="#111" strokeWidth={1} />
            <circle cx={b.x} cy={b.y} r={4} fill={WIRE[w.color]} stroke="#111" strokeWidth={1} />
          </g>
        );
      })}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#facc15" floodOpacity="1" />
        </filter>
      </defs>
    </svg>
  );
}

function legs(pts: Pt[], to: Pt) {
  return pts.map((p, i) => <line key={i} x1={p.x} y1={p.y} x2={to.x} y2={to.y} stroke="#6b7280" strokeWidth={2.5} />);
}
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const lift = (p: Pt, dy = 18): Pt => ({ x: p.x, y: p.y - dy });

function Part({ c, pts, spec }: { c: LayoutComponent; pts: Record<string, Pt>; spec: Spec }) {
  switch (c.kind) {
    case "resistor": {
      const a = pts["1"], b = pts["2"];
      const m = mid(a, b);
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      const bands = bandsFor(spec.ohms);
      return (
        <g>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#6b7280" strokeWidth={2.5} />
          <g transform={`translate(${m.x} ${m.y}) rotate(${ang})`}>
            <rect x={-20} y={-7} width={40} height={14} rx={6} fill="#e9cfa2" stroke="#a8875a" />
            {bands.map((col, i) => (
              <rect key={i} x={-14 + i * 7 + (i === 3 ? 4 : 0)} y={-7} width={4} height={14} fill={col} />
            ))}
          </g>
          <text x={m.x} y={m.y - 11} fontSize={10} fontWeight={700} textAnchor="middle" fill="#111">
            {spec.ohms ? formatSpec({ ohms: spec.ohms }) : c.ref}
          </text>
        </g>
      );
    }
    case "led": {
      const a = pts.A, k = pts.K;
      const top = lift(mid(a, k), 26);
      return (
        <g>
          {legs([a, k], { x: top.x, y: top.y + 8 })}
          <circle cx={top.x} cy={top.y} r={11} fill={LED_FILL[spec.color ?? "red"] ?? "#ef4444"} stroke="#374151" strokeWidth={1.5} />
          <text x={a.x - 6} y={a.y - 8} fontSize={11} fontWeight={800} fill="#dc2626">+</text>
        </g>
      );
    }
    case "diode": {
      const a = pts.A, k = pts.K;
      const m = mid(a, k);
      const ang = (Math.atan2(k.y - a.y, k.x - a.x) * 180) / Math.PI;
      return (
        <g>
          <line x1={a.x} y1={a.y} x2={k.x} y2={k.y} stroke="#6b7280" strokeWidth={2.5} />
          <g transform={`translate(${m.x} ${m.y}) rotate(${ang})`}>
            <rect x={-16} y={-6} width={32} height={12} rx={3} fill="#1f2937" />
            <rect x={9} y={-6} width={4} height={12} fill="#d1d5db" />
          </g>
        </g>
      );
    }
    case "cap_electrolytic": {
      const p = pts["+"], n = pts["-"];
      const top = lift(mid(p, n), 24);
      return (
        <g>
          {legs([p, n], top)}
          <circle cx={top.x} cy={top.y} r={13} fill="#1e40af" stroke="#111" />
          <path d={`M${top.x + 5} ${top.y - 12} A13 13 0 0 1 ${top.x + 5} ${top.y + 12}`} stroke="#cbd5e1" strokeWidth={4} fill="none" />
          <text x={p.x - 7} y={p.y - 8} fontSize={11} fontWeight={800} fill="#dc2626">+</text>
        </g>
      );
    }
    case "cap_ceramic": {
      const top = lift(mid(pts["1"], pts["2"]), 18);
      return (
        <g>
          {legs([pts["1"], pts["2"]], top)}
          <ellipse cx={top.x} cy={top.y} rx={9} ry={7} fill="#f59e0b" stroke="#92400e" />
        </g>
      );
    }
    case "npn": {
      const C = pts.C, B = pts.B, E = pts.E;
      const top = lift(B, 24);
      return (
        <g>
          {legs([C, B, E], { x: top.x, y: top.y + 6 })}
          <path d={`M${top.x - 16} ${top.y + 8} L${top.x - 16} ${top.y - 4} A16 16 0 0 1 ${top.x + 16} ${top.y - 4} L${top.x + 16} ${top.y + 8} Z`} fill="#111827" />
          {(["C", "B", "E"] as const).map((k) => (
            <text key={k} x={pts[k].x} y={pts[k].y + 16} fontSize={10} fontWeight={800} textAnchor="middle" fill="#111">
              {k}
            </text>
          ))}
        </g>
      );
    }
    case "ic_dip8": {
      const p1 = pts["1"], p4 = pts["4"], p8 = pts["8"];
      return (
        <g>
          <rect x={p1.x - 10} y={p8.y - 8} width={p4.x - p1.x + 20} height={p1.y - p8.y + 16} rx={4} fill="#111827" />
          <circle cx={p1.x} cy={p1.y - 4} r={3} fill="#9ca3af" />
          <path d={`M${p1.x - 10} ${(p1.y + p8.y) / 2 - 6} a6 6 0 0 1 0 12`} fill="#374151" />
          <text x={(p1.x + p4.x) / 2} y={(p1.y + p8.y) / 2 + 4} fontSize={11} fill="#e5e7eb" textAnchor="middle" fontWeight={700}>
            {spec.part_number ?? "555"}
          </text>
        </g>
      );
    }
    case "button": {
      const xs = Object.values(pts).map((p) => p.x);
      const ys = Object.values(pts).map((p) => p.y);
      const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
      return (
        <g>
          <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={4} fill="#374151" />
          <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 2.4} fill="#111" stroke="#6b7280" strokeWidth={2} />
        </g>
      );
    }
    case "buzzer": {
      const top = lift(mid(pts["+"], pts["-"]), 22);
      return (
        <g>
          {legs([pts["+"], pts["-"]], top)}
          <circle cx={top.x} cy={top.y} r={22} fill="#111827" />
          <circle cx={top.x} cy={top.y} r={4} fill="#4b5563" />
          <text x={pts["+"].x - 6} y={pts["+"].y + 14} fontSize={11} fontWeight={800} fill="#dc2626">+</text>
        </g>
      );
    }
    case "potentiometer": {
      const W1 = pts.W;
      const top = lift(W1, 26);
      return (
        <g>
          {legs([pts["1"], W1, pts["3"]], top)}
          <rect x={top.x - 24} y={top.y - 16} width={48} height={30} rx={4} fill="#1d4ed8" />
          <circle cx={top.x} cy={top.y - 1} r={10} fill="#e5e7eb" />
          <line x1={top.x} y1={top.y - 1} x2={top.x} y2={top.y - 10} stroke="#111" strokeWidth={2.5} />
        </g>
      );
    }
    case "ldr": {
      const top = lift(mid(pts["1"], pts["2"]), 22);
      return (
        <g>
          {legs([pts["1"], pts["2"]], top)}
          <circle cx={top.x} cy={top.y} r={11} fill="#f5f5f4" stroke="#78716c" strokeWidth={1.5} />
          <path d={`M${top.x - 6} ${top.y - 4} h12 M${top.x - 6} ${top.y} h12 M${top.x - 6} ${top.y + 4} h12`} stroke="#c2410c" strokeWidth={1.6} />
        </g>
      );
    }
    case "ultrasonic": {
      const ps = ["VCC", "TRIG", "ECHO", "GND"].map((k) => pts[k]);
      const cx = (ps[0].x + ps[3].x) / 2;
      const y = ps[0].y - 50;
      return (
        <g>
          {ps.map((p, i) => (
            <line key={i} x1={p.x} y1={p.y} x2={p.x} y2={y + 26} stroke="#6b7280" strokeWidth={2.5} />
          ))}
          <rect x={cx - 60} y={y - 10} width={120} height={36} rx={4} fill="#1e3a8a" />
          <circle cx={cx - 30} cy={y + 8} r={14} fill="#d1d5db" stroke="#6b7280" />
          <circle cx={cx + 30} cy={y + 8} r={14} fill="#d1d5db" stroke="#6b7280" />
        </g>
      );
    }
    case "touch_plate": {
      return (
        <g>
          {(["A", "B"] as const).map((k) => (
            <g key={k}>
              <line x1={pts[k].x} y1={pts[k].y} x2={pts[k].x} y2={pts[k].y - 28} stroke="#b45309" strokeWidth={3} />
              <circle cx={pts[k].x} cy={pts[k].y - 30} r={4} fill="#d97706" />
            </g>
          ))}
          <text x={(pts.A.x + pts.B.x) / 2} y={pts.A.y - 40} fontSize={11} fontWeight={800} textAnchor="middle" fill="#b45309">
            👆
          </text>
        </g>
      );
    }
    default:
      return null;
  }
}
