// Generates the demo-mode assets: illustrated photos (public/demo/*.svg), their known detections
// (data/demo/fixtures.json) and canned Claude answers for the scripted demo path (data/demo/claude-cache.json).
// Replace the SVGs with real photos before the final, then re-record fixtures from the debug panel.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fixtures = {};
const canned = {};

// ---------------- drawing helpers ----------------
const BAND = { black: "#111", brown: "#7a4a1e", red: "#d22", orange: "#f80", yellow: "#fd0", green: "#1a3", blue: "#22c", violet: "#83c", grey: "#888", white: "#fff", gold: "#c9a227", silver: "#c0c0c0" };

function resistor(x, y, bands, angle = 0) {
  const b = bands
    .map((c, i) => `<rect x="${-34 + i * 15 + (i === bands.length - 1 ? 8 : 0)}" y="-13" width="8" height="26" fill="${BAND[c]}"/>`)
    .join("");
  return `<g transform="translate(${x},${y}) rotate(${angle})">
    <line x1="-110" y1="0" x2="110" y2="0" stroke="#9a9a9a" stroke-width="4"/>
    <rect x="-48" y="-15" width="96" height="30" rx="13" fill="#e9cfa2" stroke="#b79b6b" stroke-width="2"/>${b}</g>`;
}
function led(x, y, color, clear = false) {
  const fill = clear ? "#f4f4f4" : color;
  return `<g transform="translate(${x},${y})">
    <line x1="-8" y1="20" x2="-8" y2="110" stroke="#9a9a9a" stroke-width="4"/>
    <line x1="8" y1="20" x2="8" y2="90" stroke="#9a9a9a" stroke-width="4"/>
    <path d="M-22 22 L-22 -10 A22 22 0 0 1 22 -10 L22 22 Z" fill="${fill}" stroke="#555" stroke-width="2" opacity="0.92"/>
    <rect x="-26" y="18" width="52" height="8" fill="${fill}" stroke="#555" stroke-width="2"/></g>`;
}
function ldr(x, y) {
  return `<g transform="translate(${x},${y})">
    <line x1="-10" y1="30" x2="-10" y2="120" stroke="#9a9a9a" stroke-width="4"/>
    <line x1="10" y1="30" x2="10" y2="120" stroke="#9a9a9a" stroke-width="4"/>
    <circle r="34" fill="#f2f2f2" stroke="#888" stroke-width="3"/>
    <path d="M-22 -12 h44 M-22 0 h44 M-22 12 h44" stroke="#c04020" stroke-width="5" fill="none"/>
    <path d="M-22 -12 v12 M22 0 v12" stroke="#c04020" stroke-width="5"/></g>`;
}
function battery9v(x, y) {
  return `<g transform="translate(${x},${y})">
    <rect width="220" height="330" rx="14" fill="#1d1d1d"/>
    <rect y="80" width="220" height="170" fill="#e8a317"/>
    <text x="110" y="190" font-family="Arial" font-weight="bold" font-size="72" text-anchor="middle" fill="#1d1d1d">9V</text>
    <rect x="40" y="-30" width="50" height="34" rx="6" fill="#bbb"/><polygon points="140,-30 190,-30 180,4 150,4" fill="#bbb"/></g>`;
}
function breadboard(x, y, w, h) {
  let holes = "";
  for (let c = 0; c < 30; c++)
    for (let r = 0; r < 10; r++)
      holes += `<rect x="${x + 30 + c * ((w - 60) / 30)}" y="${y + 60 + r * 24 + (r >= 5 ? 30 : 0)}" width="7" height="7" fill="#555"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#f7f7f2" stroke="#ccc" stroke-width="3"/>
    <rect x="${x + 10}" y="${y + 180}" width="${w - 20}" height="14" fill="#e2e2dc"/>
    <line x1="${x + 20}" y1="${y + 22}" x2="${x + w - 20}" y2="${y + 22}" stroke="#d33" stroke-width="3"/>
    <line x1="${x + 20}" y1="${y + h - 22}" x2="${x + w - 20}" y2="${y + h - 22}" stroke="#33d" stroke-width="3"/>${holes}`;
}
function button(x, y) {
  return `<g transform="translate(${x},${y})"><rect x="-40" y="-40" width="80" height="80" rx="6" fill="#333"/>
    <circle r="22" fill="#111" stroke="#555" stroke-width="3"/>
    <path d="M-40 -28 h-20 M-40 28 h-20 M40 -28 h20 M40 28 h20" stroke="#9a9a9a" stroke-width="5"/></g>`;
}
function buzzer(x, y) {
  return `<g transform="translate(${x},${y})"><circle r="62" fill="#151515"/><circle r="9" fill="#444"/>
    <text x="0" y="-30" font-family="Arial" font-size="20" fill="#bbb" text-anchor="middle">+</text>
    <line x1="-14" y1="60" x2="-14" y2="130" stroke="#9a9a9a" stroke-width="4"/><line x1="14" y1="60" x2="14" y2="110" stroke="#9a9a9a" stroke-width="4"/></g>`;
}
function elcap(x, y, text) {
  return `<g transform="translate(${x},${y})"><rect x="-34" y="-70" width="68" height="140" rx="10" fill="#1f3d8a"/>
    <rect x="16" y="-70" width="14" height="140" fill="#b9c6e8"/>
    <text x="-8" y="0" transform="rotate(-90 -8 0)" font-family="Arial" font-size="18" fill="#fff" text-anchor="middle">${text}</text>
    <line x1="-12" y1="70" x2="-12" y2="150" stroke="#9a9a9a" stroke-width="4"/><line x1="12" y1="70" x2="12" y2="130" stroke="#9a9a9a" stroke-width="4"/></g>`;
}
function jumpers(x, y) {
  const cols = ["#d33", "#222", "#2a2", "#fb0", "#36c"];
  return cols
    .map((c, i) => `<path d="M${x} ${y + i * 26} C ${x + 120} ${y - 60 + i * 30}, ${x + 220} ${y + 120 + i * 10}, ${x + 330} ${y + 40 + i * 22}" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round"/>`)
    .join("");
}
const svgDoc = (w, h, bg, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>\n`;

// ---------------- 1. Starter-kit parts pile ----------------
{
  const W = 1600, H = 1200;
  const parts = [];
  const det = (id, part_type, box, extra = {}) => parts.push({ id, part_type, score: 0.9, box, spec: {}, uncertain: false, refined: false, ...extra });
  let body = "";
  body += breadboard(90, 760, 640, 400);
  det("bb", "breadboard", { x: 90, y: 760, w: 640, h: 400 }, { refined: true });
  body += battery9v(820, 820);
  det("bat", "battery", { x: 815, y: 785, w: 230, h: 370 });
  body += resistor(330, 190, ["brown", "black", "yellow", "gold"], -8);
  det("r100k", "resistor", { x: 215, y: 155, w: 230, h: 70 });
  body += resistor(640, 360, ["yellow", "violet", "brown", "gold"], 6);
  det("r470", "resistor", { x: 525, y: 325, w: 230, h: 70 });
  body += resistor(1000, 170, ["brown", "black", "orange", "gold"], -3);
  det("r10k", "resistor", { x: 885, y: 140, w: 230, h: 60 });
  body += ldr(1330, 260);
  det("ldr", "ldr", { x: 1290, y: 220, w: 80, h: 160 }, { refined: true });
  body += led(1180, 560, "#fff", true);
  det("ledw", "led", { x: 1150, y: 530, w: 60, h: 140 });
  body += led(1420, 600, "#e01818");
  det("ledr", "led", { x: 1390, y: 570, w: 60, h: 140 });
  body += button(1210, 980);
  det("btn", "button", { x: 1140, y: 930, w: 140, h: 100 }, { refined: true });
  body += buzzer(1440, 920);
  det("buz", "buzzer", { x: 1375, y: 855, w: 130, h: 200 }, { refined: true, spec: { variant: "active" } });
  body += elcap(560, 600, "100µF 16V");
  det("cap", "capacitor", { x: 520, y: 525, w: 80, h: 230 });
  body += jumpers(120, 470);
  det("jw", "jumper_wire", { x: 110, y: 400, w: 350, h: 220 }, { refined: true, spec: {} });
  fs.writeFileSync(path.join(root, "public/demo/parts-pile.svg"), svgDoc(W, H, "#e9e4da", body));
  fixtures["parts-pile"] = { width: W, height: H, detections: parts };
  // Canned answers if Claude is unreachable during the demo.
  canned["parts-pile:r100k"] = { bands: ["brown", "black", "yellow", "gold"], tolerance_band_visible: true, confident: true, note: "" };
  canned["parts-pile:r470"] = { bands: ["yellow", "violet", "brown", "gold"], tolerance_band_visible: true, confident: true, note: "" };
  canned["parts-pile:r10k"] = { bands: ["brown", "black", "orange", "gold"], tolerance_band_visible: true, confident: true, note: "" };
  canned["parts-pile:cap"] = { lines: ["100µF", "16V"], part_number: null, capacitor_kind: "electrolytic", confident: true, note: "" };
  canned["parts-pile:bat"] = { lines: ["9V"], part_number: null, capacitor_kind: "unknown", confident: true, note: "" };
}

// ---------------- 2. TV remote boards ----------------
function remoteBoard({ corroded = false, crackedJoint = false, burnt = false, throughHoleTransistor = false }) {
  const W = 1600, H = 900;
  let b = `<rect x="60" y="120" width="1480" height="660" rx="40" fill="#1f6b3a" stroke="#14502b" stroke-width="6"/>`;
  // button combs
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 6; c++) {
      const x = 420 + c * 150, y = 230 + r * 170;
      b += `<circle cx="${x}" cy="${y}" r="48" fill="#c9a640"/><path d="M${x - 30} ${y - 12} h60 M${x - 30} ${y} h60 M${x - 30} ${y + 12} h60" stroke="#1f6b3a" stroke-width="5"/>`;
    }
  // chip (epoxy blob) + crystal
  b += `<ellipse cx="300" cy="460" rx="90" ry="80" fill="#0d0d0d"/>`;
  b += `<rect x="200" y="600" width="110" height="44" rx="20" fill="#d7d7d7" stroke="#999" stroke-width="3"/><text x="255" y="630" font-family="monospace" font-size="18" text-anchor="middle">455E</text>`;
  // IR LED at the left edge, legs to pads
  b += `<path d="M30 420 h70 v80 h-70 a40 40 0 0 1 0 -80 z" fill="#3b3b5a" opacity="0.95"/>`;
  b += `<circle cx="140" cy="440" r="16" fill="#c0c0c0"/><circle cx="140" cy="480" r="16" fill="#c0c0c0"/>`;
  if (crackedJoint) b += `<circle cx="140" cy="480" r="13" fill="none" stroke="#3a3a3a" stroke-width="3" stroke-dasharray="7 4"/><circle cx="140" cy="480" r="16" fill="#9a9a9a" opacity="0.5"/>`;
  // driver transistor + resistors + capacitor
  if (throughHoleTransistor) b += `<g transform="translate(560,700)"><path d="M-26 22 L-26 -16 A26 26 0 0 1 26 -16 L26 22 Z" fill="#222"/><text x="0" y="6" font-family="monospace" font-size="13" fill="#ddd" text-anchor="middle">S8050</text></g>`;
  else b += `<rect x="540" y="685" width="44" height="30" fill="#222"/>`;
  b += `<g transform="translate(760,700)"><rect x="-40" y="-12" width="80" height="24" rx="10" fill="#e9cfa2"/><rect x="-26" y="-12" width="7" height="24" fill="#d22"/><rect x="-12" y="-12" width="7" height="24" fill="#d22"/><rect x="2" y="-12" width="7" height="24" fill="#111"/><rect x="24" y="-12" width="7" height="24" fill="#c9a227"/></g>`;
  b += `<g transform="translate(900,700)"><rect x="-40" y="-12" width="80" height="24" rx="10" fill="#e9cfa2"/><rect x="-26" y="-12" width="7" height="24" fill="#7a4a1e"/><rect x="-12" y="-12" width="7" height="24" fill="#111"/><rect x="2" y="-12" width="7" height="24" fill="#d22"/><rect x="24" y="-12" width="7" height="24" fill="#c9a227"/></g>`;
  b += `<g transform="translate(1060,690)"><circle r="40" fill="#1f3d8a"/><path d="M20 -34 A40 40 0 0 1 20 34" stroke="#b9c6e8" stroke-width="10" fill="none"/><text x="-8" y="6" font-family="Arial" font-size="14" fill="#fff" text-anchor="middle">47µF</text></g>`;
  // battery contacts on the right
  for (const y of [300, 560]) {
    b += `<rect x="1350" y="${y - 60}" width="40" height="120" fill="#cfcfcf"/>`;
    b += `<path d="M1390 ${y - 40} q 40 10 0 20 q 40 10 0 20 q 40 10 0 20 q 40 10 0 20" stroke="#bdbdbd" stroke-width="8" fill="none"/>`;
  }
  if (corroded) {
    b += `<g opacity="0.95"><ellipse cx="1380" cy="560" rx="70" ry="55" fill="#4cbf7a"/><ellipse cx="1405" cy="585" rx="40" ry="30" fill="#e6f2e6"/><ellipse cx="1360" cy="535" rx="30" ry="22" fill="#2f9a5b"/>`;
    b += `<ellipse cx="1370" cy="300" rx="38" ry="26" fill="#6fd39a"/></g>`;
  }
  if (burnt) b += `<ellipse cx="320" cy="455" rx="140" ry="110" fill="#3a2410" opacity="0.75"/><ellipse cx="330" cy="440" rx="70" ry="50" fill="#140b04" opacity="0.8"/>`;
  return { W, H, svg: svgDoc(W, H, "#d9d4cc", b) };
}

{
  const broken = remoteBoard({ corroded: true, crackedJoint: true });
  fs.writeFileSync(path.join(root, "public/demo/tv-board.svg"), broken.svg);
  const healthy = remoteBoard({});
  fs.writeFileSync(path.join(root, "public/demo/golden-tv-remote.svg"), healthy.svg);
  const dead = remoteBoard({ burnt: true, throughHoleTransistor: true });
  fs.writeFileSync(path.join(root, "public/demo/tv-board-dead.svg"), dead.svg);

  const boardParts = (prefix, transistorPn) => [
    { id: `${prefix}-ir`, part_type: "led", score: 0.88, box: { x: 10, y: 410, w: 160, h: 100 }, spec: { color: "infrared" }, uncertain: false, refined: true },
    { id: `${prefix}-r1`, part_type: "resistor", score: 0.8, box: { x: 710, y: 680, w: 100, h: 40 }, spec: {}, uncertain: false, refined: false },
    { id: `${prefix}-r2`, part_type: "resistor", score: 0.8, box: { x: 850, y: 680, w: 100, h: 40 }, spec: {}, uncertain: false, refined: false },
    { id: `${prefix}-c1`, part_type: "capacitor", score: 0.85, box: { x: 1015, y: 645, w: 90, h: 90 }, spec: {}, uncertain: false, refined: false },
    { id: `${prefix}-ic`, part_type: "ic", score: 0.7, box: { x: 205, y: 375, w: 190, h: 170 }, spec: {}, uncertain: true, refined: true },
    ...(transistorPn ? [{ id: `${prefix}-q1`, part_type: "transistor", score: 0.82, box: { x: 525, y: 670, w: 70, h: 60 }, spec: {}, uncertain: false, refined: false }] : []),
  ];
  fixtures["tv-board"] = { width: broken.W, height: broken.H, detections: boardParts("tvb", null) };
  fixtures["tv-board-dead"] = { width: dead.W, height: dead.H, detections: boardParts("tvd", "S8050") };

  canned["tv-board:defects"] = {
    image_quality: "good",
    findings: [
      { defect: "corrosion", box: { x: 0.82, y: 0.54, w: 0.11, h: 0.16 }, confidence: 0.9, label: "Батарейн пүрш исэлдсэн (ногоон өнгөр)" },
      { defect: "cracked_joint", box: { x: 0.07, y: 0.5, w: 0.05, h: 0.08 }, confidence: 0.6, label: "IR LED-ийн хөлийн гагнуур хагарсан байж магадгүй" },
    ],
    summary: "Батарейн контакт исэлдсэн нь хамгийн тод харагдаж байна. IR LED-ийн нэг хөлийн гагнуур хагарсан байж болзошгүй.",
  };
  canned["tv-board:golden"] = {
    same_layout: "yes",
    differences: [
      { description: "Доод батарейн пүрш дээр ногоон/цагаан исэл бий, эрүүл самбарт байхгүй.", defect: "corrosion", box: { x: 0.82, y: 0.54, w: 0.11, h: 0.16 }, confidence: 0.92 },
      { description: "IR LED-ийн доод хөлийн гагнуур бүдэг, цагираг хэлбэрийн хагаралтай.", defect: "cracked_joint", box: { x: 0.07, y: 0.5, w: 0.05, h: 0.08 }, confidence: 0.65 },
    ],
    summary: "Хоёр ялгаа: исэлдсэн батарейн контакт, IR LED-ийн хагарсан гагнуур.",
  };
  canned["tv-board-dead:defects"] = {
    image_quality: "good",
    findings: [{ defect: "burn_mark", box: { x: 0.11, y: 0.38, w: 0.18, h: 0.25 }, confidence: 0.85, label: "Чипийн орчим түлэгдсэн толбо" }],
    summary: "Чипийн эргэн тойронд түлэгдсэн ул мөр харагдаж байна.",
  };
  canned["tv-board-dead:golden"] = {
    same_layout: "yes",
    differences: [{ description: "Чипийн эргэн тойронд хар хүрэн түлэгдсэн толбо.", defect: "burn_mark", box: { x: 0.11, y: 0.38, w: 0.18, h: 0.25 }, confidence: 0.88 }],
    summary: "Чип түлэгдсэн — засах үнэ цэнэгүй.",
  };
  canned["tv-board:multimeter"] = { display_text: "2.94", value: 2.94, unit: "V", is_dc_volts_mode: "yes", confident: true };
  for (const p of ["tvb", "tvd"]) {
    canned[`${p === "tvb" ? "tv-board" : "tv-board-dead"}:${p}-r1`] = { bands: ["red", "red", "black", "gold"], tolerance_band_visible: true, confident: true, note: "" };
    canned[`${p === "tvb" ? "tv-board" : "tv-board-dead"}:${p}-r2`] = { bands: ["brown", "black", "red", "gold"], tolerance_band_visible: true, confident: true, note: "" };
    canned[`${p === "tvb" ? "tv-board" : "tv-board-dead"}:${p}-c1`] = { lines: ["47µF"], part_number: null, capacitor_kind: "electrolytic", confident: false, note: "Хүчдэлийн бичиг харагдахгүй байна." };
  }
  canned["tv-board-dead:tvd-q1"] = { lines: ["S8050", "D331"], part_number: "S8050", capacitor_kind: "unknown", confident: true, note: "" };
}

// ---------------- 3. Device icons ----------------
const icon = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">${body}</svg>\n`;
fs.writeFileSync(
  path.join(root, "public/icons/tv-remote.svg"),
  icon(`<rect x="30" y="6" width="36" height="84" rx="12" fill="#1f2937"/><circle cx="48" cy="20" r="6" fill="#ef4444"/>${[0, 1, 2, 3].map((r) => [0, 1].map((c) => `<rect x="${37 + c * 14}" y="${34 + r * 12}" width="9" height="7" rx="2" fill="#9ca3af"/>`).join("")).join("")}<path d="M44 2 q4 -3 8 0" stroke="#a855f7" stroke-width="3" fill="none"/>`),
);
fs.writeFileSync(
  path.join(root, "public/icons/garage-remote.svg"),
  icon(`<rect x="22" y="20" width="52" height="66" rx="16" fill="#1f2937"/><circle cx="48" cy="44" r="10" fill="#9ca3af"/><circle cx="48" cy="68" r="10" fill="#9ca3af"/><circle cx="62" cy="28" r="3" fill="#ef4444"/><rect x="40" y="4" width="16" height="18" rx="4" fill="#6b7280"/><path d="M70 10 q8 6 0 14 M76 6 q12 10 0 22" stroke="#f59e0b" stroke-width="3" fill="none"/>`),
);
fs.writeFileSync(
  path.join(root, "public/icons/controller.svg"),
  icon(`<path d="M18 34 Q20 26 30 26 H66 Q76 26 78 34 L86 66 Q88 76 78 76 Q72 76 66 66 H30 Q24 76 18 76 Q8 76 10 66 Z" fill="#1f2937"/><circle cx="34" cy="52" r="8" fill="#6b7280"/><circle cx="62" cy="52" r="8" fill="#6b7280"/><circle cx="70" cy="38" r="3" fill="#22c55e"/><circle cx="76" cy="44" r="3" fill="#ef4444"/><rect x="22" y="38" width="10" height="3" fill="#9ca3af"/><rect x="25.5" y="34.5" width="3" height="10" fill="#9ca3af"/>`),
);

fs.writeFileSync(path.join(root, "data/demo/fixtures.json"), JSON.stringify(fixtures, null, 2) + "\n");
// Keep answers already recorded from real Claude runs; only fill in missing keys.
const cachePath = path.join(root, "data/demo/claude-cache.json");
const existing = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : {};
fs.writeFileSync(cachePath, JSON.stringify({ ...canned, ...existing }, null, 2) + "\n");
console.log("demo assets written:", Object.keys(fixtures).join(", "), "|", Object.keys(canned).length, "canned answers");
