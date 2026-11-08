// Símbolos desenhados à mão (SVG) que ficam dentro dos medalhões das ilustrações.
// Cada símbolo é uma função (cor de destaque, kit) que devolve SVG numa caixa 100x100.
// O "kit" cria degradês/recortes com ids únicos para cada arquivo.

/* ---------- Utilidades ---------- */
const hashStr = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const mix = (hex, to, k) => {
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const ch = (x, s) => (x >> s) & 255;
  const c = [16, 8, 0].map((s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * k));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
};
const f1 = (v) => +v.toFixed(1);
const RAD = Math.PI / 180;
const pt = (cx, cy, r, deg) => [f1(cx + r * Math.cos(deg * RAD)), f1(cy + r * Math.sin(deg * RAD))];
const P2 = (pts) => pts.map((p) => p.join(",")).join(" ");

/* ---------- Traço e acabamento ---------- */
const INK = "#1a100a";
const GOLD = "#e2b33c";
const O = (w = 2) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const ln = (d, c = INK, w = 1.2, op = 1) =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"${op < 1 ? ` stroke-opacity="${op}"` : ""} stroke-linecap="round" stroke-linejoin="round"/>`;
const hi = (d, w = 2, op = 0.6) => ln(d, "#ffffff", w, op);
// traço grosso com contorno (ink por baixo, cor por cima)
const tube = (d, fill, w = 5, ow = 1.3) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + ow * 2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const spark = (x, y, s, c = "#fffbe6", op = 1) =>
  `<path d="M${x} ${f1(y - s)}Q${f1(x + s * 0.16)} ${f1(y - s * 0.16)} ${f1(x + s)} ${y}Q${f1(x + s * 0.16)} ${f1(y + s * 0.16)} ${x} ${f1(y + s)}Q${f1(x - s * 0.16)} ${f1(y + s * 0.16)} ${f1(x - s)} ${y}Q${f1(x - s * 0.16)} ${f1(y - s * 0.16)} ${x} ${f1(y - s)}Z" fill="${c}"${op < 1 ? ` opacity="${op}"` : ""}/>`;
const shadow = (cx = 50, cy = 92, rx = 28, ry = 4) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#3a2606" opacity=".22"/>`;
const leaf = (x, y, len, ang, fill, w = 0.32) =>
  `<g transform="translate(${x} ${y}) rotate(${ang})"><path d="M0 0C${f1(len * 0.25)} ${f1(-len * w)} ${f1(len * 0.7)} ${f1(-len * w)} ${len} 0C${f1(len * 0.7)} ${f1(len * w)} ${f1(len * 0.25)} ${f1(len * w)} 0 0Z" fill="${fill}" ${O(1.1)}/><path d="M${f1(len * 0.12)} 0Q${f1(len * 0.5)} ${f1(-len * 0.04)} ${f1(len * 0.85)} 0" fill="none" stroke="#0a2a10" stroke-opacity=".45" stroke-width=".8"/></g>`;

/* ---------- Kit de degradês por arquivo ---------- */
function kit(id) {
  const defs = [];
  const memo = {};
  let n = 0;
  const st = (s) => s.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ""}/>`).join("");
  const lin = (s, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => {
    const g = `${id}s${n++}`;
    defs.push(`<linearGradient id="${g}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${st(s)}</linearGradient>`);
    return `url(#${g})`;
  };
  const rad = (s, cx = 0.5, cy = 0.5, r = 0.5, fx = cx, fy = cy) => {
    const g = `${id}s${n++}`;
    defs.push(`<radialGradient id="${g}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${st(s)}</radialGradient>`);
    return `url(#${g})`;
  };
  const once = (key, fn) => memo[key] || (memo[key] = fn());
  const k = {
    defs, lin, rad,
    clip(shape) { const g = `${id}c${n++}`; defs.push(`<clipPath id="${g}">${shape}</clipPath>`); return `url(#${g})`; },
    // volume: claro em cima/esquerda, escuro embaixo/direita
    tone: (c, v = 0.42) => once("t" + c + v, () => lin([[0, mix(c, "#ffffff", v)], [0.55, c], [1, mix(c, "#000000", v * 0.85)]], 0.15, 0, 0.85, 1)),
    // metal polido (faixas de reflexo verticais)
    metal: (c) => once("m" + c, () => lin([[0, mix(c, "#ffffff", 0.8)], [0.28, mix(c, "#ffffff", 0.22)], [0.5, mix(c, "#000000", 0.32)], [0.72, c], [1, mix(c, "#000000", 0.5)]])),
    // cromado (reflexos horizontais, para cilindros e lâminas)
    chrome: (c) => once("c" + c, () => lin([[0, mix(c, "#000000", 0.45)], [0.2, mix(c, "#ffffff", 0.85)], [0.42, mix(c, "#ffffff", 0.2)], [0.62, mix(c, "#000000", 0.28)], [0.85, mix(c, "#ffffff", 0.45)], [1, mix(c, "#000000", 0.4)]], 0, 0, 1, 0)),
    // esfera brilhante
    sphere: (c) => once("r" + c, () => rad([[0, mix(c, "#ffffff", 0.88)], [0.22, mix(c, "#ffffff", 0.35)], [0.7, c], [1, mix(c, "#000000", 0.55)]], 0.5, 0.5, 0.56, 0.36, 0.3)),
    glow: (cx, cy, r, c, o = 0.7) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${once("g" + c + o, () => rad([[0, c, o], [0.45, c, o * 0.35], [1, c, 0]]))}"/>`,
  };
  return k;
}

/* ---------- Componentes ---------- */
// estrela facetada (cada ponta com um lado claro e outro escuro)
function facetStar(n, cx, cy, r1, r2, c, rot = -90, ow = 1.8) {
  const pts = Array.from({ length: n * 2 }, (_, i) => pt(cx, cy, i % 2 ? r2 : r1, rot + (i * 180) / n));
  let s = "";
  for (let i = 0; i < n * 2; i++) {
    const p = pts[i], q = pts[(i + 1) % (n * 2)];
    s += `<path d="M${cx} ${cy}L${p[0]} ${p[1]}L${q[0]} ${q[1]}Z" fill="${i % 2 ? mix(c, "#000000", 0.25) : mix(c, "#ffffff", 0.45)}"/>`;
  }
  return s + `<polygon points="${P2(pts)}" fill="none" ${O(ow)}/>`;
}
// línguas de chama ao redor de uma elipse
function tongues(cx, cy, rx, ry, n, len, a0, a1, seed = 1) {
  const r = rng(seed);
  let d = "";
  const e = (ang, ex, ey) => [f1(cx + ex * Math.cos(ang * RAD)), f1(cy + ey * Math.sin(ang * RAD))];
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * (i + 0.5)) / n, w = ((a1 - a0) / n) * 0.62;
    const l = len * (0.65 + r() * 0.7), sway = (r() - 0.5) * w * 1.4;
    const L = e(a - w, rx * 0.94, ry * 0.94), R = e(a + w, rx * 0.94, ry * 0.94);
    const T = e(a + sway, rx + l, ry + l);
    const C1 = e(a - w * 0.45 + sway * 0.3, rx + l * 0.5, ry + l * 0.5), C2 = e(a + w * 0.45 + sway * 0.3, rx + l * 0.5, ry + l * 0.5);
    d += `M${L}Q${C1} ${T}Q${C2} ${R}Z`;
  }
  return d;
}
// engrenagem (com furos opcionais, fill-rule evenodd)
function gearPath(cx, cy, teeth, ro, rr, rot = 0, holes = []) {
  const step = 360 / teeth, pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = rot + i * step;
    pts.push(pt(cx, cy, rr, a - step * 0.5), pt(cx, cy, rr, a - step * 0.27), pt(cx, cy, ro, a - step * 0.15), pt(cx, cy, ro, a + step * 0.15), pt(cx, cy, rr, a + step * 0.27));
  }
  let d = "M" + pts.map((p) => p.join(" ")).join("L") + "Z";
  for (const [hx, hy, hr] of holes) d += `M${f1(hx + hr)} ${hy}A${hr} ${hr} 0 1 0 ${f1(hx - hr)} ${hy}A${hr} ${hr} 0 1 0 ${f1(hx + hr)} ${hy}Z`;
  return d;
}
// figura sentada em meditação
const seated = (fill, rim) => `
  <path d="M50 43C44 43 40 46 39 51C37 57 37 63 38 68C33 70 24 74 22 79C20 84 26 87 34 86L66 86C74 87 80 84 78 79C76 74 67 70 62 68C63 63 63 57 61 51C60 46 56 43 50 43Z" fill="${fill}" ${O(2)}/>
  <circle cx="50" cy="33" r="8.5" fill="${fill}" ${O(2)}/>
  ${ln("M39.5 57C41 64 44 68.5 48 70.5M60.5 57C59 64 56 68.5 52 70.5", "#000000", 1.3, 0.55)}
  <path d="M42.5 71C46 68.6 54 68.6 57.5 71C54 73.4 46 73.4 42.5 71Z" fill="${rim}" opacity=".85"/>
  ${ln("M27 80.5C36 77.5 44 77.5 50 79.5C56 77.5 64 77.5 73 80.5", "#000000", 1.2, 0.5)}
  ${ln("M43.4 29C44.4 26.4 46.6 25 49 24.8M40.8 52.5C39.3 58 39.1 63 39.8 67.5M24.5 79C27.5 74.6 32.5 72.2 37 70.8", rim, 1.6, 0.9)}`;
// mão aberta (palma para frente, dedos para cima)
const openHand = (skin) => `
  <path d="M34 60L30 33C29.5 28 36.5 27 37.5 32L42 58Z" fill="${skin}" ${O(1.8)}/>
  <path d="M42 57L42 26C42 21 50 21 50 26L50 57Z" fill="${skin}" ${O(1.8)}/>
  <path d="M50 57L54 29C55 24 62 25 61 30L57 58Z" fill="${skin}" ${O(1.8)}/>
  <path d="M57 60L63 38C64.5 34 70.5 35.5 69.5 40L63 63Z" fill="${skin}" ${O(1.8)}/>
  <path d="M33 58C32 66 34 76 40 82L40 100L60 100L60 82C66 76 68 68 66 60C60 56 40 55 33 58Z" fill="${skin}" ${O(1.8)}/>
  <path d="M37 71C30 67 25 61 22 55C20 51 25 47 29 51C33 56 37 60 42 62Z" fill="${skin}" ${O(1.8)}/>
  ${ln("M39 70C45 66 53 66 60 68M41 77C46 74 52 73 58 74", "#7a4a2a", 1.1, 0.6)}`;

const P = {};

/* =====================================================================
   NEN
   ===================================================================== */
P.ten = (a, k) => {
  const L = mix(a, "#ffffff", 0.55);
  return `${k.glow(50, 58, 48, a, 0.55)}
  <path d="M50 12C57 19 61 22 60 28C67 32 67 40 69 46C73 54 71 62 74 67C83 71 89 78 87 86C86 91 80 93 74 93L26 93C20 93 14 91 13 86C11 78 17 71 26 67C29 62 27 54 31 46C33 40 33 32 40 28C39 22 43 19 50 12Z" fill="${k.lin([[0, mix(a, "#ffffff", 0.25), 0.75], [1, a, 0.6]])}" stroke="${mix(a, "#000000", 0.2)}" stroke-width="1.8"/>
  <path d="M50 21C55 26 57 28 56.5 31.5C61.5 35 61.5 41 63.5 47C66.5 55 65.5 62 67.5 67.5C75.5 71 81 77 80 84C79 88 74 89.5 70 89.5L30 89.5C26 89.5 21 88 20 84C19 77 24.5 71 32.5 67.5C34.5 62 33.5 55 36.5 47C38.5 41 38.5 35 43.5 31.5C43 28 45 26 50 21Z" fill="${k.lin([[0, "#ffffff", 0.95], [1, L, 0.85]])}"/>
  ${ln("M50 12C48 7 50 4 53 1M60 28C64.5 24 63 19 66.5 15.5M40 28C35.5 24 37 19 33.5 15.5", mix(a, "#000000", 0.1), 2.2, 0.95)}
  ${seated(k.lin([[0, "#2f5d4c"], [1, "#0c1f18"]]), L)}
  ${spark(17, 30, 4)}${spark(84, 22, 3.2)}${spark(85, 56, 2.4)}${spark(14, 60, 2)}`;
};

P.zetsu = (a, k) => `
  <path d="M84.5 10.7A13 13 0 1 0 88 30.4A10.5 10.5 0 0 1 84.5 10.7Z" fill="${k.lin([[0, "#fffbe8"], [1, "#c7bfa4"]])}" ${O(1.5)}/>
  ${spark(16, 18, 2.6, "#8fa2ae")}${spark(27, 8, 1.8, "#8fa2ae")}${spark(66, 8, 1.5, "#8fa2ae")}
  <ellipse cx="50" cy="60" rx="36" ry="37" fill="none" stroke="${a}" stroke-width="1.5" stroke-dasharray="1.5 5" opacity=".8"/>
  <ellipse cx="50" cy="89" rx="40" ry="6" fill="${k.lin([[0, "#7d8f99", 0.55], [1, "#7d8f99", 0]])}"/>
  <g opacity=".93">${seated(k.lin([[0, "#7d8c95"], [1, "#363f46"]]), "#d2dbe0")}</g>
  ${ln("M45 33.8q2 1.6 4 0M51 33.8q2 1.6 4 0", "#eef3f5", 1.2)}
  <g fill="#566770">
    <rect x="66" y="47" width="4" height="4" transform="rotate(20 68 49)" opacity=".85"/>
    <rect x="72.5" y="42" width="3.2" height="3.2" transform="rotate(35 74 43.5)" opacity=".65"/>
    <rect x="78" y="38" width="2.6" height="2.6" transform="rotate(10 79 39)" opacity=".45"/>
    <rect x="83" y="34" width="2" height="2" opacity=".3"/>
    <rect x="70" y="56" width="3" height="3" transform="rotate(45 71.5 57.5)" opacity=".6"/>
    <rect x="77" y="53" width="2.2" height="2.2" opacity=".38"/>
    <rect x="82" y="50" width="1.6" height="1.6" opacity=".25"/>
  </g>
  ${ln("M8 76C16 72 22 76 30 72M70 74C78 70 84 74 93 70", "#8a9aa4", 1.6, 0.65)}`;

P.ren = (a, k) => {
  const p1 = [], p2 = [];
  for (let i = 0; i < 36; i++) p1.push(pt(50, 58, i % 2 ? 27 + (i % 4) * 1.4 : 43 + ((i * 7) % 5) * 1.7, -90 + i * 10));
  for (let i = 0; i < 28; i++) p2.push(pt(50, 58, i % 2 ? 22 : 33 + ((i * 3) % 4) * 1.6, -84 + i * (360 / 28)));
  const rock = k.lin([[0, "#c9b9a0"], [1, "#5e5242"]], 0, 0, 1, 1);
  return `${k.glow(50, 58, 50, a, 0.6)}
  <polygon points="${P2(p1)}" fill="${k.rad([[0, "#fff6c8"], [0.35, mix(a, "#ffd060", 0.5)], [0.75, a], [1, mix(a, "#000000", 0.35)]])}" stroke="${mix(a, "#000000", 0.45)}" stroke-width="1.4" stroke-linejoin="round"/>
  <polygon points="${P2(p2)}" fill="${k.rad([[0, "#ffffff"], [0.5, "#fff1a8"], [1, mix(a, "#ffd060", 0.6), 0.85]])}"/>
  ${seated(k.lin([[0, "#3d2620"], [1, "#120806"]]), "#ffd59a")}
  ${ln("M28 89l-7 6M38 90l-3 7M62 90l3 7M72 89l7 6M50 90v8", INK, 1.6)}
  <path d="M10 66l6-3.5 2.5 5-6 2.5Z" fill="${rock}" ${O(1.1)}/>
  <path d="M84 61l5.5 1-1 5.5-5.5-1Z" fill="${rock}" ${O(1.1)}/>
  <path d="M17 36l4-1.2 1.2 4-4 1.2Z" fill="${rock}" ${O(1)}/>
  <path d="M82 34l3 .4-.4 3-3-.4Z" fill="${rock}" ${O(.9)}/>
  ${spark(80, 20, 3.6)}${spark(20, 20, 2.4)}`;
};

P.hatsu = (a, k) => {
  const skin = k.lin([[0, "#f8dcc0"], [1, "#c48a5e"]], 0, 0, 1, 1);
  const L = mix(a, "#ffffff", 0.6);
  const rays = Array.from({ length: 16 }, (_, i) => { const d = i * 22.5; const [x1, y1] = pt(50, 32, 21, d), [x2, y2] = pt(50, 32, i % 2 ? 28 : 35, d); return `M${x1} ${y1}L${x2} ${y2}`; }).join("");
  return `${k.glow(50, 34, 42, a, 0.75)}
  ${ln(rays, GOLD, 2.2, 0.95)}
  ${openHand(skin)}
  <path d="M36 88H64V100H36Z" fill="${k.tone(mix(a, "#1a1a2a", 0.55))}" ${O(1.8)}/>
  ${ln("M36 91.5H64", mix(a, "#ffffff", 0.3), 1.2, 0.7)}
  <circle cx="50" cy="32" r="15.5" fill="${k.sphere(a)}" ${O(1.6)}/>
  <path d="M42 32a8 8 0 1 1 8 8a5 5 0 1 1 -5 -5a2.4 2.4 0 1 1 2.4 2.4" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-opacity=".85" stroke-linecap="round"/>
  <ellipse cx="50" cy="32" rx="25" ry="7" fill="none" stroke="${L}" stroke-width="1.5" transform="rotate(-20 50 32)" opacity=".9"/>
  <ellipse cx="44" cy="24.5" rx="4.5" ry="2.8" fill="#ffffff" opacity=".85" transform="rotate(-25 44 24.5)"/>
  ${spark(18, 18, 3.6)}${spark(83, 46, 3)}${spark(78, 9, 2.2)}`;
};

P.reforco = (a, k) => {
  const skin = k.lin([[0, "#f6d6b6"], [1, "#b97c52"]], 0, 0, 1, 1);
  const fist = "M24 44C24 36 30 33 36 34C38 30 44 29 48 32C51 28 58 28 61 32C65 29 72 31 73 36C78 37 80 42 79 50L78 66C77 76 70 82 60 83L42 83C32 82 25 75 24 66Z";
  const shock = [-165, -135, -105, -75, -45, -15, 15, 165].map((d) => { const [x1, y1] = pt(52, 56, 37, d), [x2, y2] = pt(52, 56, 47, d); return `M${x1} ${y1}L${x2} ${y2}`; }).join("");
  const rock = k.lin([[0, "#c9b9a0"], [1, "#5e5242"]], 0, 0, 1, 1);
  return `${k.glow(52, 56, 50, a, 0.6)}
  ${ln(shock, GOLD, 3.2)}
  <path d="${fist}" fill="none" stroke="${a}" stroke-width="10" stroke-opacity=".38" stroke-linejoin="round"/>
  <path d="M37 80L37 100L65 100L65 80Z" fill="${k.lin([[0, "#f8f3e8"], [1, "#b9ae98"]], 0, 0, 1, 0)}" ${O(1.8)}/>
  ${ln("M37 86L65 84M37 92L65 90M37 98L65 96", "#8a7f6a", 1.2)}
  <path d="${fist}" fill="${skin}" ${O(2.1)}/>
  ${ln("M36 34C37 42 37 50 36 56M48 32C49 40 49 48 48 56M61 32C61 40 61 48 60 56M25 56C40 58.5 60 58.5 78 55", "#7a4a2a", 1.3, 0.8)}
  <path d="M26 60C34 57 46 60 54 64C58 66 57 72 52 72C44 72 34 70 27 70Z" fill="${skin}" ${O(1.8)}/>
  ${ln("M30 66C38 65 46 66 51 68", "#7a4a2a", 1, 0.5)}
  ${hi("M28.5 37.5q3-2.5 6-1.5M40.5 33q3-2.5 6-1.5M53 32q3-2.5 6-1M66 34q3-2 6 .5", 1.9, 0.8)}
  <path d="M10 30l5-2 2 4.5-5 2Z" fill="${rock}" ${O(1)}/>
  <path d="M88 76l5 1-1 5-5-1Z" fill="${rock}" ${O(1)}/>
  <path d="M90 26l3 .5-.5 3-3-.5Z" fill="${rock}" ${O(.9)}/>
  ${spark(86, 50, 2.6)}${spark(14, 76, 2.4)}`;
};

P.transmutacao = (a, k) => {
  const L = mix(a, "#ffffff", 0.55);
  const shards = [[40, 34, 2.6, 20], [62, 46, 2.2, -30], [34, 46, 2, 45], [68, 34, 2, 10]];
  return `${k.glow(50, 50, 50, a, 0.6)}
  <path d="M50 93C33 93 23 83 25 70C27 60 35 56 37 47C41 55 40 61 45 63C43 53 49 45 55 39C55 49 61 53 63 61C65 55 65 51 69 49C73 59 76 67 74 76C72 87 64 93 50 93Z" fill="${k.lin([[0, L], [0.5, a], [1, mix(a, "#000000", 0.45)]])}" ${O(1.8)}/>
  <path d="M50 90C40 90 33 84 34 76C35 70 40 67 42 62C45 67 45 71 48 72C48 66 51 61 55 57C56 63 59 66 60 71C62 68 62 66 64 65C66 71 67 76 66 80C64 86 58 90 50 90Z" fill="${k.lin([[0, "#ffffff"], [1, L]])}" opacity=".9"/>
  <path d="M63 4L36 46H51L42 72L72 30H57L67 4Z" fill="${k.lin([[0, "#ffffff"], [0.45, "#fff2a0"], [1, "#e2a020"]])}" ${O(2)}/>
  ${hi("M61.5 8L42 42", 1.6, 0.9)}${hi("M55 34L47 56", 1.3, 0.7)}
  ${ln("M24 28l6-4-1.5 6 6-3M28 14l4 2-3 3 4 1M74 44l6 2-5 3 7 2M76 20l5-2-1 5 5-2", L, 1.7)}
  ${shards.map(([x, y, s, r]) => `<path d="M${x} ${y - s}L${x + s * 0.6} ${y}L${x} ${y + s}L${x - s * 0.6} ${y}Z" fill="${L}" transform="rotate(${r} ${x} ${y})"/>`).join("")}
  ${spark(18, 52, 3)}${spark(85, 60, 2.6)}`;
};

P.emissao = (a0, k) => {
  const a = mix(a0, "#e05a00", 0.42), L = mix(a0, "#ffffff", 0.2);
  return `
  <path d="M56 30C38 42 20 60 4 88C26 75 44 62 70 52Z" fill="${k.lin([[0, mix(a, "#000000", 0.15), 1], [0.6, a, 0.6], [1, a, 0]], 1, 0, 0, 1)}" stroke="${mix(a, "#000000", 0.3)}" stroke-opacity=".35" stroke-width="1"/>
  <path d="M60 36C46 46 32 60 18 80C36 69 50 60 68 50Z" fill="${k.lin([[0, "#ffffff", 0.95], [1, "#ffffff", 0]], 1, 0, 0, 1)}"/>
  ${ln("M40 39L13 57M48 59L25 77M33 50L7 70", mix(a, "#000000", 0.2), 1.6, 0.7)}
  ${k.glow(64, 40, 34, a, 0.8)}
  <ellipse cx="64" cy="40" rx="34" ry="11" fill="none" stroke="${a}" stroke-width="1.2" opacity=".55" transform="rotate(-38 64 40)"/>
  <ellipse cx="64" cy="40" rx="26" ry="8" fill="none" stroke="${a}" stroke-width="1.8" opacity=".9" transform="rotate(-38 64 40)"/>
  <circle cx="64" cy="40" r="17" fill="${k.sphere(a)}" ${O(1.8)}/>
  <circle cx="64" cy="40" r="10" fill="#ffffff" opacity=".32"/>
  <ellipse cx="58.5" cy="33.5" rx="5.6" ry="3.6" fill="#ffffff" opacity=".88" transform="rotate(-30 58.5 33.5)"/>
  ${spark(87, 15, 3.6)}${spark(30, 24, 2.5)}${spark(89, 64, 2)}`;
};

P.conjuracao = (a, k) => {
  const L = mix(a, "#ffffff", 0.55);
  const shards = [[34, 14, 4, 20], [66, 20, 3.5, -30], [30, 30, 3, 45], [70, 8, 3, 10], [40, 4, 2.5, -15], [63, 33, 2.6, 60], [24, 20, 2, 0], [77, 30, 2.2, 30]];
  return `${k.glow(50, 40, 46, a, 0.55)}
  <ellipse cx="50" cy="92" rx="32" ry="6.5" fill="${a}" opacity=".2"/>
  <ellipse cx="50" cy="92" rx="32" ry="6.5" fill="none" stroke="${a}" stroke-width="1.6"/>
  <ellipse cx="50" cy="92" rx="24" ry="4.5" fill="none" stroke="${L}" stroke-width="1" stroke-dasharray="2 3"/>
  <path d="M50 4L56.5 14V56H43.5V14Z" fill="${a}" fill-opacity=".2" stroke="${a}" stroke-width="1.3" stroke-dasharray="2.5 2"/>
  <path d="M43.5 32H56.5V56H43.5Z" fill="${k.chrome("#b8c4cc")}" ${O(1.8)}/>
  ${ln("M50 33V56", "#5a6670", 1.2, 0.8)}
  <ellipse cx="50" cy="32" rx="13" ry="2.6" fill="${L}" opacity=".55"/>
  ${ln("M40.5 32H59.5", "#ffffff", 2.2, 0.95)}
  <path d="M28 56C35 54 44 57 50 57C56 57 65 54 72 56C74 58 74 61 72 63C65 61 56 63 50 63C44 63 35 61 28 63C26 61 26 58 28 56Z" fill="${k.metal(GOLD)}" ${O(1.8)}/>
  <circle cx="50" cy="60" r="3.7" fill="${k.sphere(a)}" ${O(1.2)}/>
  <path d="M46 63H54V80H46Z" fill="${k.lin([[0, "#6a4630"], [1, "#24140c"]], 0, 0, 1, 0)}" ${O(1.6)}/>
  ${ln("M46 66L54 69M46 70L54 73M46 74L54 77", "#c9a46a", 1.2, 0.85)}
  <circle cx="50" cy="83.5" r="4.6" fill="${k.metal(GOLD)}" ${O(1.6)}/>
  ${shards.map(([x, y, s, r]) => `<path d="M${x} ${y - s}L${x + s * 0.6} ${y}L${x} ${y + s}L${x - s * 0.6} ${y}Z" fill="${L}" stroke="${a}" stroke-width=".8" transform="rotate(${r} ${x} ${y})"/>`).join("")}
  ${spark(50, 3, 3)}`;
};

P.manipulacao = (a, k) => {
  const wood = k.lin([[0, "#e0a86e"], [0.5, "#a0632e"], [1, "#5e3414"]]);
  const L = mix(a, "#ffffff", 0.5);
  const ivory = k.lin([[0, "#fffaf0"], [1, "#d8c8a8"]], 0, 0, 1, 1);
  const limb = (d) => tube(d, "#efe4cc", 4.2, 1.2);
  const strings = "M22 16L30 56M78 16L71 50M50 30L50 40M36 16L43 81M64 16L57 80";
  return `${k.glow(50, 60, 42, a, 0.45)}
  ${ln(strings, a, 3.2, 0.3)}${ln(strings, L, 0.9)}
  <path d="M16 11H84A3.5 3.5 0 0 1 84 18H16A3.5 3.5 0 0 1 16 11Z" fill="${wood}" ${O(1.6)}/>
  <path d="M46.5 3H53.5V32A3.5 3.5 0 0 1 46.5 32Z" fill="${wood}" ${O(1.6)}/>
  ${ln("M22 13.4H40M58 14.4H76M49 8V26", "#ffffff", 0.8, 0.4)}
  ${[[22, 16], [78, 16], [36, 16], [64, 16], [50, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${k.metal(GOLD)}" ${O(0.8)}/>`).join("")}
  ${limb("M45 58L37 57L30 56")}${limb("M55 58L63 54L71 50")}
  ${limb("M46.5 72L43 81L42 90")}${limb("M53.5 72L57 80L60 88")}
  <path d="M44 55H56L58 72H42Z" fill="${k.tone(a)}" ${O(1.6)}/>
  ${ln("M43.5 63H56.6", "#ffffff", 1, 0.5)}
  <circle cx="50" cy="47" r="7" fill="${ivory}" ${O(1.6)}/>
  <circle cx="47.6" cy="46.5" r=".95" fill="${INK}"/><circle cx="52.4" cy="46.5" r=".95" fill="${INK}"/>
  <circle cx="46" cy="49.6" r="1.4" fill="#e88a8a" opacity=".65"/><circle cx="54" cy="49.6" r="1.4" fill="#e88a8a" opacity=".65"/>
  ${[[37, 57], [63, 54], [43, 81], [57, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${wood}" ${O(0.9)}/>`).join("")}`;
};

P.especializacao = (a, k) => {
  const up = [[50, 6], [88, 72], [12, 72]], dn = [[50, 94], [12, 28], [88, 28]];
  const L = mix(a, "#ffffff", 0.5);
  const rays = Array.from({ length: 24 }, (_, i) => { const [x1, y1] = pt(50, 50, 40, i * 15 + 7.5), [x2, y2] = pt(50, 50, i % 2 ? 46 : 50, i * 15 + 7.5); return `M${x1} ${y1}L${x2} ${y2}`; }).join("");
  return `${k.glow(50, 50, 50, a, 0.55)}
  ${ln(rays, a, 1.3, 0.75)}
  <polygon points="${P2(up)}" fill="${k.lin([[0, L, 0.92], [1, a, 0.85]])}" ${O(1.8)}/>
  <polygon points="${P2(dn)}" fill="${k.lin([[0, a, 0.8], [1, mix(a, "#000000", 0.35), 0.9]])}" ${O(1.8)}/>
  ${ln("M50 6L50 26M88 72L71 62M12 72L29 62", "#ffffff", 1, 0.45)}
  <circle cx="50" cy="50" r="23" fill="${k.rad([[0, "#22325a"], [1, "#080e1c"]])}" stroke="${GOLD}" stroke-width="2.6"/>
  <circle cx="50" cy="50" r="24.4" fill="none" ${O(1)}/>
  ${ln("M31 44l-3.6-3.6M36.5 40.5l-2-4.6M43 38.8l-.8-5M57 38.8l.8-5M63.5 40.5l2-4.6M69 44l3.6-3.6", "#e8eef5", 1.4)}
  <path d="M27 50C35 38 65 38 73 50C65 62 35 62 27 50Z" fill="${k.lin([[0, "#ffffff"], [1, "#d2deec"]])}" ${O(1.6)}/>
  <circle cx="50" cy="50" r="10" fill="${k.rad([[0, mix(a, "#ffffff", 0.7)], [0.55, a], [1, mix(a, "#000000", 0.5)]])}" ${O(1.2)}/>
  ${ln(Array.from({ length: 16 }, (_, i) => { const [x1, y1] = pt(50, 50, 4, i * 22.5), [x2, y2] = pt(50, 50, 9, i * 22.5); return `M${x1} ${y1}L${x2} ${y2}`; }).join(""), mix(a, "#000000", 0.4), 0.6, 0.6)}
  <ellipse cx="50" cy="50" rx="2.6" ry="7" fill="${INK}"/>
  <circle cx="46.5" cy="46.5" r="2.3" fill="#ffffff"/>
  ${[...up, ...dn].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${k.metal(GOLD)}" ${O(1)}/>`).join("")}`;
};

/* =====================================================================
   TIPOS DE CAÇADOR
   ===================================================================== */
P.beast = (a, k) => {
  const pad = k.lin([[0, "#7a5646"], [1, "#24140c"]], 0, 0, 1, 1);
  const claw = k.lin([[0, "#fffaf0"], [1, "#b2a284"]]);
  const slash = (dx) => `<path d="M${46 + dx} 6C${56 + dx} 24 ${62 + dx} 46 ${62 + dx} 70C${57 + dx} 48 ${52 + dx} 26 ${46 + dx} 6Z" fill="${a}" opacity=".8"/>`;
  const toe = (cx, cy, rot) => `<g transform="rotate(${rot} ${cx} ${cy})">
    <path d="M${cx - 2.6} ${cy - 7.5}C${cx - 1.6} ${cy - 14} ${cx + 0.6} ${cy - 17.5} ${cx + 2.2} ${cy - 20}C${cx + 3} ${cy - 15} ${cx + 3.4} ${cy - 11} ${cx + 2.8} ${cy - 7.5}Z" fill="${claw}" ${O(1.2)}/>
    <ellipse cx="${cx}" cy="${cy}" rx="7.2" ry="9.2" fill="${pad}" ${O(1.8)}/>
    <ellipse cx="${cx - 2}" cy="${cy - 3}" rx="2.4" ry="3.4" fill="#ffffff" opacity=".3"/></g>`;
  return `${slash(14)}${slash(25)}${slash(36)}
  ${shadow(50, 90, 26, 3.5)}
  ${toe(27, 47, -28)}${toe(40.5, 33, -9)}${toe(59.5, 33, 9)}${toe(73, 47, 28)}
  <path d="M50 52C38 52 28 62 28 72C28 82 36 87 42 85C46 84 48 82 50 82C52 82 54 84 58 85C64 87 72 82 72 72C72 62 62 52 50 52Z" fill="${pad}" ${O(2)}/>
  ${hi("M35.5 66C38 59 43 56 48 55.5", 2.4, 0.35)}`;
};

P.blacklist = (a, k) => `
  <g transform="rotate(-4 50 50)">
  <path d="M20 8L80 8L82 90L76 88L70 92L62 89L54 92L46 89L38 92L30 89L22 92L18 90Z" fill="${k.lin([[0, "#fbf1d6"], [1, "#d2b984"]], 0, 0, 1, 1)}" ${O(1.8)}/>
  <rect x="24.5" y="12.5" width="52" height="74" fill="none" stroke="#8a6a3a" stroke-width=".8" opacity=".7"/>
  <text x="50.5" y="23.4" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="8.2" fill="#3a2410">PROCURADO</text>
  <path d="M33 27H68V61H33Z" fill="${k.lin([[0, "#c2b292"], [1, "#7a6a50"]])}" ${O(1.4)}/>
  <circle cx="50.5" cy="40" r="7" fill="#3a2e24"/>
  <path d="M37 61C37 51 43 47 50.5 47C58 47 64 51 64 61Z" fill="#3a2e24"/>
  <text x="50.5" y="70.5" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="6.4" font-weight="bold" fill="#3a2410">VIVO OU MORTO</text>
  ${ln("M30 75H71", "#8a6a3a", 0.8)}
  <text x="50.5" y="83" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="8.4" font-weight="bold" fill="#8a1a1a">J 50.000.000</text>
  </g>
  <circle cx="50.5" cy="44" r="15" fill="none" stroke="${a}" stroke-width="2.4"/>
  <circle cx="50.5" cy="44" r="10" fill="none" stroke="${a}" stroke-width="1" opacity=".7"/>
  ${ln("M50.5 24V36M50.5 52V64M30.5 44H42.5M58.5 44H70.5", a, 2.4)}
  <circle cx="50.5" cy="44" r="2" fill="${a}"/>
  <circle cx="50" cy="9.5" r="4" fill="${k.sphere("#d23a45")}" ${O(1.2)}/>`;

P.botanical = (a, k) => {
  const pet = k.lin([[0, "#ffe0ec"], [1, "#cf2f69"]]);
  const pet2 = k.lin([[0, "#fff4f8"], [1, "#f06595"]]);
  const lg = k.lin([[0, mix(a, "#ffffff", 0.35)], [1, mix(a, "#000000", 0.42)]], 0, 0, 1, 1);
  const P5 = (r0, len, w, rot, fill) => [0, 72, 144, 216, 288].map((d) => `<path transform="rotate(${d + rot} 50 42)" d="M50 ${42 - r0}C${50 - w} ${f1(42 - r0 - len * 0.3)} ${f1(50 - w * 0.8)} ${f1(42 - r0 - len * 0.85)} 50 ${42 - r0 - len}C${f1(50 + w * 0.8)} ${f1(42 - r0 - len * 0.85)} ${50 + w} ${f1(42 - r0 - len * 0.3)} 50 ${42 - r0}Z" fill="${fill}" ${O(1.5)}/>`).join("");
  const stamens = Array.from({ length: 8 }, (_, i) => { const [x, y] = pt(50, 42, 9.5, i * 45 + 20); return `<circle cx="${x}" cy="${y}" r="1.3" fill="#ffd34a" ${O(0.6)}/>`; }).join("");
  const wing = "M80 22C74 12 65 14 67 22C69 27 76 26 80 22ZM80 22C78 30 72 33 70 29C68.6 25.6 74 23.4 80 22Z";
  return `
  ${tube("M50 93C50 80 51 70 50 50", "#3a8a48", 3, 1.1)}
  <path d="M50 77C38 81 22 75 14 61C30 57 44 63 50 77Z" fill="${lg}" ${O(1.6)}/>
  <path d="M51 67C62 69 78 63 86 49C72 45 56 51 51 67Z" fill="${lg}" ${O(1.6)}/>
  ${ln("M49 76C40 70 28 66 18 61.5M52 66C62 60 72 55 82 50M32 66.5l-2 4M40 70l-1.5 4M62 59l1 4.4M71 54.5l1.4 4", "#0a2a10", 0.9, 0.5)}
  ${P5(4, 26, 12, 0, pet)}
  ${P5(2, 18, 8, 36, pet2)}
  ${stamens}
  <circle cx="50" cy="42" r="6.5" fill="${k.sphere("#f2c12e")}" ${O(1.4)}/>
  <path d="M30 63.5c1.6 2.6 3.1 4 3.1 5.6a3.1 3.1 0 0 1 -6.2 0c0-1.6 1.5-3 3.1-5.6Z" fill="${k.lin([[0, "#ffffff"], [1, "#8fd3f0"]])}" ${O(0.8)}/>
  <g>
    <path d="${wing}" fill="${k.tone("#f08a2c")}" ${O(1.1)}/>
    <path d="${wing}" transform="translate(160 0) scale(-1 1)" fill="${k.tone("#f08a2c")}" ${O(1.1)}/>
    ${ln("M80 17V31", INK, 1.6)}${ln("M80 17C78 13 76 12 75 12M80 17C82 13 84 12 85 12", INK, 0.8)}
  </g>
  ${spark(18, 30, 3)}${spark(86, 74, 2.4)}`;
};

P.card = (a, k) => {
  const face = k.lin([[0, "#ffffff"], [1, "#ece2c8"]], 0, 0, 1, 1);
  const C = (rot, inner) => `<g transform="rotate(${rot} 50 94)">
    <rect x="31" y="20" width="38" height="54" rx="4" fill="${face}" ${O(1.6)}/>
    <rect x="34.5" y="23.5" width="31" height="47" rx="2" fill="none" stroke="${GOLD}" stroke-width="1"/>
    ${inner}</g>`;
  const heart = "M0 6C-8 0 -10 -4 -7 -7C-4 -10 -1 -8 0 -5C1 -8 4 -10 7 -7C10 -4 8 0 0 6Z";
  const spade = "M0 -8C4 -3 9 0 9 4C9 7 5 8 2 6L3 10H-3L-2 6C-5 8 -9 7 -9 4C-9 0 -4 -3 0 -8Z";
  const diamond = "M0 -9L7 0L0 9L-7 0Z";
  const sym = (d, x, y, s, fill) => `<path d="${d}" transform="translate(${x} ${y}) scale(${s})" fill="${fill}" stroke="${INK}" stroke-width="${f1(0.9 / s)}"/>`;
  const idx = (t, c) => `<text x="36.5" y="31.5" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="7.6" fill="${c}">${t}</text>`;
  const red = k.lin([[0, "#ff7a86"], [1, "#a0101e"]]);
  return `${k.glow(50, 50, 48, a, 0.4)}
  ${C(-22, idx("K", "#1a1a1a") + sym(spade, 50, 48, 1.4, k.lin([[0, "#5a5a5a"], [1, "#0e0e0e"]])))}
  ${C(22, idx("Q", "#a0101e") + sym(diamond, 50, 48, 1.4, k.tone(a)))}
  ${C(0, idx("A", "#a0101e") + sym(heart, 38.6, 36, 0.42, red) + sym(heart, 50, 48, 2.1, red)
    + `<ellipse cx="44" cy="40.5" rx="3.6" ry="2.2" fill="#ffffff" opacity=".7" transform="rotate(-35 44 40.5)"/>`
    + `<g transform="rotate(180 50 47)">${idx("A", "#a0101e")}</g>`
    + ln("M38 62C44 66 56 66 62 62", GOLD, 1, 0.9))}
  ${spark(84, 16, 4)}${spark(16, 24, 3)}${spark(86, 60, 2.2)}`;
};

P.crime = (a, k) => {
  const ridges = (cx, cy) => Array.from({ length: 7 }, (_, j) => {
    const i = j + 1, r = i * 2.5;
    return `<path d="M${f1(cx - r)} ${f1(cy + r * 0.35)}A${r} ${f1(r * 1.25)} 0 1 1 ${f1(cx + r)} ${f1(cy + r * 0.35)}" fill="none" stroke="#2f3f52" stroke-width="1.15" stroke-dasharray="${6 + i * 3} 1.8" stroke-linecap="round"/>`;
  }).join("") + `<path d="M${cx - 2} ${cy + 3}C${cx - 2} ${cy + 10} ${cx - 6} ${cy + 16} ${cx - 10} ${cy + 20}M${cx + 2} ${cy + 3}C${cx + 3} ${cy + 10} ${cx + 1} ${cy + 17} ${cx - 2} ${cy + 21}" fill="none" stroke="#2f3f52" stroke-width="1.15"/>`;
  const lens = k.clip(`<circle cx="58" cy="50" r="17"/>`);
  return `
  <path d="M13 20L64 13L71 80L20 87Z" fill="${k.lin([[0, "#fffdf4"], [1, "#ddd0ae"]], 0, 0, 1, 1)}" ${O(1.6)}/>
  ${ln("M23 76L61 71.5M23 81L47 78", "#a89878", 1.2)}
  <g opacity=".72">${ridges(38, 44)}</g>
  ${tube("M71.5 64.5L88 82", k.lin([[0, "#b0703a"], [1, "#4e2a10"]], 0, 0, 1, 1), 7.6, 1.6)}
  ${hi("M73.5 64.5L85 77", 1.4, 0.4)}
  <circle cx="58" cy="50" r="21.5" fill="${k.metal(GOLD)}" ${O(1.8)}/>
  <circle cx="58" cy="50" r="17" fill="${k.rad([[0, "#ffffff"], [1, "#d8ecf2"]])}" ${O(1.2)}/>
  <g clip-path="${lens}"><g transform="translate(58 50) scale(1.7) translate(-58 -50)" opacity=".9">${ridges(38, 44)}</g>
    <circle cx="58" cy="50" r="17" fill="${k.lin([[0, "#bfe6ff", 0.4], [1, "#bfe6ff", 0]])}"/></g>
  <path d="M45.5 41C47.5 36 51.5 33.5 56.5 33" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" opacity=".95"/>
  <circle cx="58" cy="50" r="17" fill="none" stroke="${mix(GOLD, "#000000", 0.4)}" stroke-width="1"/>
  ${spark(84, 22, 3)}`;
};

P.cute = (a, k) => {
  const H = "M50 88C24 70 12 56 12 40C12 28 21 19 32 19C40 19 46 24 50 30C54 24 60 19 68 19C79 19 88 28 88 40C88 56 76 70 50 88Z";
  const T = "translate(50 52) scale(.8) translate(-50 -52)";
  const mc = k.clip(`<path d="${H}" transform="${T}"/>`);
  return `${k.glow(50, 52, 48, a, 0.45)}
  <path d="${H}" fill="${k.metal("#e8a08e")}" ${O(2)}/>
  <path d="${H}" transform="${T}" fill="${k.lin([[0, "#ffffff"], [0.5, "#f4e8ff"], [1, "#c4b0de"]], 0, 0, 1, 1)}" ${O(1.2)}/>
  <g clip-path="${mc}"><path d="M14 62L58 18L68 18L24 62Z" fill="#ffffff" opacity=".75"/><path d="M30 74L74 30L79 30L35 74Z" fill="#ffffff" opacity=".55"/></g>
  ${hi("M18 36C19 29 24 24 30 23", 2, 0.85)}
  <path d="M48 30L41 45L45.5 44L47.5 48.5Z" fill="${k.tone(a)}" ${O(1.1)}/>
  <path d="M52 30L59 45L54.5 44L52.5 48.5Z" fill="${k.tone(a)}" ${O(1.1)}/>
  <path d="M50 28C42 18 31 19 33 27C35 33 44 31 50 28Z" fill="${k.tone(a)}" ${O(1.4)}/>
  <path d="M50 28C58 18 69 19 67 27C65 33 56 31 50 28Z" fill="${k.tone(a)}" ${O(1.4)}/>
  ${ln("M37 25C40 25 44 26.5 47 28M63 25C60 25 56 26.5 53 28", "#ffffff", 0.9, 0.5)}
  <circle cx="50" cy="28.5" r="3.4" fill="${k.sphere(a)}" ${O(1.2)}/>
  ${spark(82, 14, 5)}${spark(18, 76, 3.6)}${spark(64, 46, 3, "#ffffff")}${spark(86, 66, 2.4)}`;
};

P.disease = (a, k) => {
  const spikes = Array.from({ length: 10 }, (_, i) => { const d = i * 36 + 8; return [pt(34, 64, 14, d), pt(34, 64, 21, d)]; });
  const syr = `<g transform="translate(66 34) rotate(225) translate(-60 -40)">
    <path d="M60 4V24" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M60 5V24" stroke="#dfe6ea" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M57 22H63V26H57Z" fill="${k.metal("#9aa8b0")}" ${O(1)}/>
    <rect x="53.5" y="26" width="13" height="32" rx="2" fill="${k.lin([[0, "#ffffff", 0.95], [1, "#cfe6ee", 0.75]], 0, 0, 1, 0)}" ${O(1.6)}/>
    <rect x="54.5" y="34" width="11" height="23" fill="${k.lin([[0, "#8affde"], [1, "#16a084"]], 0, 0, 1, 0)}"/>
    ${ln("M53.5 32h3M53.5 38h4.5M53.5 44h3M53.5 50h4.5", INK, 0.9, 0.7)}
    <path d="M50 57H70V60.5H50Z" fill="${k.metal("#9aa8b0")}" ${O(1.2)}/>
    <path d="M58 60.5H62V68H58Z" fill="${k.metal("#c9d2d8")}" ${O(1)}/>
    <path d="M54 68H66V71H54Z" fill="${k.metal("#9aa8b0")}" ${O(1.2)}/>
    ${hi("M56 29V55", 1.4, 0.85)}
  </g>`;
  return `${k.glow(34, 64, 32, a, 0.45)}${syr}
  ${spikes.map(([[x1, y1], [x2, y2]]) => `${tube(`M${x1} ${y1}L${x2} ${y2}`, mix(a, "#ffffff", 0.25), 1.8, 0.9)}<circle cx="${x2}" cy="${y2}" r="2.9" fill="${k.sphere(mix(a, "#ffb000", 0.35))}" ${O(1)}/>`).join("")}
  <circle cx="34" cy="64" r="15" fill="${k.sphere(a)}" ${O(1.8)}/>
  <g fill="${mix(a, "#000000", 0.35)}" opacity=".55"><circle cx="31" cy="61" r="2.2"/><circle cx="39.5" cy="68" r="2.6"/><circle cx="32" cy="71" r="1.6"/><circle cx="40" cy="58.5" r="1.4"/><circle cx="26" cy="67" r="1.5"/></g>
  <ellipse cx="29" cy="57" rx="4" ry="2.5" fill="#ffffff" opacity=".65" transform="rotate(-30 29 57)"/>
  <path d="M17 14h6v6h6v6h-6v6h-6v-6h-6v-6h6Z" fill="${k.tone("#2fa84f")}" ${O(1.3)}/>
  ${spark(84, 74, 3)}${spark(78, 86, 1.8)}`;
};

P.gourmet = (a, k) => {
  const ch = k.chrome("#b8c4cc");
  return `
  <g transform="rotate(-32 30 62)">
    <path d="M25 17h1.9v13h-1.9zM27.7 17h1.9v13h-1.9zM30.4 17h1.9v13h-1.9zM33.1 17h1.9v13h-1.9z" fill="${ch}" ${O(0.8)}/>
    <path d="M25 29H35C35 35 33 38.5 31.6 39.5V44H28.4V39.5C27 38.5 25 35 25 29Z" fill="${ch}" ${O(1.2)}/>
    <rect x="27.8" y="43" width="4.4" height="40" rx="2.2" fill="${ch}" ${O(1.2)}/>
  </g>
  <g transform="rotate(32 70 62)">
    <path d="M67.5 14C74 20 74.5 34 72.5 46H67.5Z" fill="${ch}" ${O(1.2)}/>
    <rect x="67" y="46" width="6" height="36" rx="2.4" fill="${k.lin([[0, "#6a4024"], [1, "#2a160a"]], 0, 0, 1, 0)}" ${O(1.2)}/>
    <circle cx="70" cy="56" r="1" fill="#e2b33c"/><circle cx="70" cy="70" r="1" fill="#e2b33c"/>
  </g>
  ${ln("M38 27C34 21 42 17 38 10M50 23C46 16 54 12 50 4M62 27C58 21 66 17 62 10", "#a89c88", 2.4, 0.85)}
  <ellipse cx="50" cy="80" rx="40" ry="9" fill="${k.lin([[0, "#ffffff"], [1, "#c4bcac"]])}" ${O(1.8)}/>
  <ellipse cx="50" cy="78.6" rx="30" ry="5.5" fill="none" stroke="#b0a898" stroke-width="1"/>
  <path d="M18 77C18 52 32 36 50 36C68 36 82 52 82 77Z" fill="${ch}" ${O(2)}/>
  ${hi("M27 67C27 53 35 44.5 45.5 41.5", 3.2, 0.75)}${hi("M70 52C73 57 74.5 62 75 67", 1.6, 0.4)}
  <path d="M15 75.5H85V79.5H15Z" fill="${k.metal("#c9d2d8")}" ${O(1.4)}/>
  <path d="M45 36.6C45 33 47 31 50 31C53 31 55 33 55 36.6Z" fill="${k.metal("#c9d2d8")}" ${O(1.4)}/>
  <circle cx="50" cy="28.4" r="3.7" fill="${k.sphere("#c9d2d8")}" ${O(1.2)}/>
  ${leaf(20, 85, 11, -24, k.tone("#3faa50"))}${leaf(22, 86, 9, -66, k.tone("#3faa50"))}
  <circle cx="30.5" cy="85.5" r="3.2" fill="${k.sphere("#e0353a")}" ${O(1)}/>
  ${spark(84, 30, 3)}${spark(14, 44, 2.2)}`;
};

P.hacker = (a, k) => {
  const scr = k.clip(`<rect x="18" y="20" width="64" height="44" rx="6"/>`);
  const mono = "Consolas, 'Courier New', monospace";
  return `
  <text font-family="${mono}" font-size="6.5" fill="${a}" opacity=".75"><tspan x="3" y="12">1011</tspan><tspan x="82" y="9">01</tspan><tspan x="1" y="96">110</tspan><tspan x="80" y="97">0101</tspan></text>
  <path d="M40 72H60L64 82H36Z" fill="${k.lin([[0, "#ddd4bc"], [1, "#a39880"]])}" ${O(1.6)}/>
  <path d="M26 82H74A2 2 0 0 1 76 84V88H24V84A2 2 0 0 1 26 82Z" fill="${k.lin([[0, "#e6dec8"], [1, "#a89c84"]])}" ${O(1.6)}/>
  <rect x="10" y="12" width="80" height="62" rx="5" fill="${k.lin([[0, "#f2ead4"], [1, "#b0a48a"]], 0, 0, 1, 1)}" ${O(2)}/>
  ${hi("M14 15H86", 1.2, 0.8)}
  <rect x="16" y="18" width="68" height="48" rx="7" fill="#5a5444"/>
  <rect x="18" y="20" width="64" height="44" rx="6" fill="${k.rad([[0, "#125a34"], [1, "#020e08"]])}" ${O(1.2)}/>
  <g clip-path="${scr}">
    <text font-family="${mono}" font-size="6.3" fill="#7dffb2">
      <tspan x="22" y="29.5">C:\\&gt; hunt.exe</tspan>
      <tspan x="22" y="37.5">01001000 0101</tspan>
      <tspan x="22" y="45.5">rastreando...</tspan>
      <tspan x="22" y="53.5" fill="#ffffff">ACESSO OK</tspan><tspan fill="#7dffb2">_</tspan>
    </text>
    ${ln(Array.from({ length: 11 }, (_, i) => `M18 ${21 + i * 4}H82`).join(""), "#000000", 1.3, 0.25)}
    <path d="M18 20L56 20L32 64H18Z" fill="#ffffff" opacity=".07"/>
  </g>
  <circle cx="79" cy="70" r="1.7" fill="#5dff9b" stroke="#0a3a1a" stroke-width=".6"/>
  ${ln("M20 69.5H32M20 71.5H32", "#8a7f68", 0.9)}`;
};

P.head = (a, k) => {
  const lf = k.lin([[0, "#9fe0a0"], [1, "#1f6a34"]]);
  let leaves = "";
  for (let i = 0; i < 7; i++) {
    const dl = 102 + i * 16, dr = 78 - i * 16;
    const [xl, yl] = pt(50, 50, 34, dl), [xr, yr] = pt(50, 50, 34, dr);
    const gl = dl + 90, gr = dr - 90;
    const s = 11 - i * 0.5;
    leaves += leaf(xl, yl, s, gl + 32, lf) + leaf(xl, yl, s, gl - 28, lf) + leaf(xr, yr, s, gr - 32, lf) + leaf(xr, yr, s, gr + 28, lf);
  }
  const [l0, l1] = [pt(50, 50, 34, 96), pt(50, 50, 34, 212)], [r0, r1] = [pt(50, 50, 34, 84), pt(50, 50, 34, -32)];
  const rays = Array.from({ length: 20 }, (_, i) => { const [x1, y1] = pt(50, 48, 24, i * 18), [x2, y2] = pt(50, 48, i % 2 ? 28 : 31, i * 18); return `M${x1} ${y1}L${x2} ${y2}`; }).join("");
  return `${k.glow(50, 48, 40, a, 0.6)}
  ${ln(`M${l0}A34 34 0 0 1 ${l1}M${r0}A34 34 0 0 0 ${r1}`, "#2f5a2a", 2.2)}
  ${leaves}
  <path d="M50 84L40 96L44 97L50 90L56 97L60 96Z" fill="${k.tone("#c0202c")}" ${O(1.2)}/>
  <path d="M50 84C44 80 38 82 39 86C40 90 46 88 50 84ZM50 84C56 80 62 82 61 86C60 90 54 88 50 84Z" fill="${k.tone("#c0202c")}" ${O(1.2)}/>
  <circle cx="50" cy="84.5" r="2.4" fill="${k.tone("#c0202c")}" ${O(1)}/>
  ${ln(rays, GOLD, 1.4, 0.9)}
  ${facetStar(5, 50, 48, 21, 8.8, "#f1c34a")}
  ${spark(50, 12, 3)}${spark(20, 28, 2.4)}${spark(80, 28, 2.4)}`;
};

P.jackpot = (a, k) => {
  const g = k.metal(GOLD), side = k.lin([[0, "#d49a24"], [1, "#6e4806"]]);
  const coin = (x, y) => `<path d="M${x - 13} ${y}A13 4.6 0 0 0 ${x + 13} ${y}V${y + 4}A13 4.6 0 0 1 ${x - 13} ${y + 4}Z" fill="${side}" ${O(1.2)}/>
    ${ln(`M${x - 9} ${y + 3.6}v3M${x - 4} ${y + 4.4}v3.2M${x + 1} ${y + 4.6}v3.2M${x + 6} ${y + 4.2}v3.2M${x + 10} ${y + 3.2}v3`, "#3a2604", 0.6, 0.5)}
    <ellipse cx="${x}" cy="${y}" rx="13" ry="4.6" fill="${g}" ${O(1.2)}/><ellipse cx="${x}" cy="${y}" rx="9" ry="3" fill="none" stroke="#8a5c0a" stroke-width=".8"/>`;
  const burl = k.lin([[0, "#ecd09a"], [1, "#8a6434"]], 0, 0, 1, 1);
  return `${k.glow(55, 60, 42, a, 0.5)}
  ${shadow(52, 92, 40, 4)}
  ${[86, 80, 74, 68, 62, 56].map((y) => coin(26, y)).join("")}
  <path d="M59 30L54 18L60.5 23.5L63.5 14L66.5 23.5L73 17L69 30Z" fill="${burl}" ${O(1.5)}/>
  <path d="M60 38C48 42 40 54 40 68C40 84 50 92 64 92C78 92 88 84 88 68C88 54 80 42 68 38Z" fill="${burl}" ${O(2)}/>
  ${ln("M46 56C44 64 44 74 48 82M84 60C86 68 85 76 82 82", "#6a4a20", 1, 0.5)}
  ${hi("M47 58C49 50 54 44 59 41", 2.2, 0.45)}
  ${tube("M56.5 36.5C60 40 68 40 71.5 36.5", "#d8b46a", 2.4, 1)}
  ${tube("M58 38.5L54 46M70 38.5L73 45", "#d8b46a", 1.6, 0.8)}
  <text x="64" y="77" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="24" fill="${g}" stroke="${INK}" stroke-width="1.2" paint-order="stroke">J</text>
  ${tube("M57 64H71M57 68.5H71", GOLD, 1.5, 0.8)}
  <g transform="rotate(-25 82 24)"><ellipse cx="82" cy="24" rx="8" ry="8" fill="${g}" ${O(1.2)}/><ellipse cx="82" cy="24" rx="5.4" ry="5.4" fill="none" stroke="#8a5c0a" stroke-width=".8"/></g>
  <path d="M16 30l6-6 6 6-6 9Z" fill="${k.tone("#3fd0e0")}" ${O(1.2)}/>${ln("M16 30h12M22 24l-2 6 2 9M22 24l2 6-2 9", INK, 0.6, 0.6)}
  ${spark(40, 20, 3.4)}${spark(90, 44, 2.6)}${spark(10, 52, 2)}`;
};

P.lost = (a, k) => {
  const ticks = Array.from({ length: 32 }, (_, i) => { const [x1, y1] = pt(50, 52, 31.6, i * 11.25), [x2, y2] = pt(50, 52, i % 4 ? 33 : 34.2, i * 11.25); return `M${x1} ${y1}L${x2} ${y2}`; }).join("");
  const point = (d, r, w, l, dk) => { const T = pt(50, 52, r, d), A = pt(50, 52, w, d - 90), B = pt(50, 52, w, d + 90); return `<path d="M50 52L${T}L${A}Z" fill="${l}"/><path d="M50 52L${T}L${B}Z" fill="${dk}"/><path d="M${A}L${T}L${B}" fill="none" ${O(1)}/>`; };
  const L = ["N", "L", "S", "O"];
  return `
  ${tube("M50 4.5a4.6 4.6 0 1 1 -0.1 0", k.metal(GOLD), 2.4, 1)}
  <rect x="45.5" y="10.5" width="9" height="6" rx="1.6" fill="${k.metal(GOLD)}" ${O(1.2)}/>
  <circle cx="50" cy="52" r="40.5" fill="${k.metal(GOLD)}" ${O(2)}/>
  <circle cx="50" cy="52" r="36.5" fill="none" stroke="#8a5c0a" stroke-width="1"/>
  <circle cx="50" cy="52" r="35" fill="${k.rad([[0, "#fffdf2"], [1, "#e0cea0"]])}" ${O(1.4)}/>
  ${ln(ticks, "#5a3c10", 0.9)}
  ${L.map((t, i) => { const [x, y] = pt(50, 52, 27.6, -90 + i * 90); return `<text x="${x}" y="${f1(y + 2.4)}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="7" fill="${i === 0 ? "#a0101e" : "#3a2810"}">${t}</text>`; }).join("")}
  ${[-45, 45, 135, 225].map((d) => point(d, 17, 4, "#ffffff", "#9a8a68")).join("")}
  ${[0, 90, 180].map((d) => point(d, 23, 5.2, "#f6e6b8", "#5a4220")).join("")}
  ${point(-90, 23, 5.2, mix(a, "#ffffff", 0.35), mix(a, "#000000", 0.3))}
  <circle cx="50" cy="52" r="3.4" fill="${k.sphere(GOLD)}" ${O(1)}/>
  <path d="M22 40C26 28 36 20 50 19" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
  ${spark(86, 18, 3)}`;
};

P.music = (a, k) => {
  const g = k.metal(GOLD);
  const note = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="4.4" ry="3.2" transform="rotate(-22 ${x} ${y})" fill="${k.tone(a)}" ${O(1.1)}/>`;
  return `${k.glow(50, 50, 46, a, 0.4)}
  ${[40, 45, 50, 55, 60].map((x) => ln(`M${x} 29V80`, "#e8eef2", 1.1)).join("")}
  ${tube("M36 82C26 74 20 56 24 40C26 32 32 28 30 18C29 14 25 13 23 16", g, 5.6, 1.3)}
  ${tube("M64 82C74 74 80 56 76 40C74 32 68 28 70 18C71 14 75 13 77 16", g, 5.6, 1.3)}
  ${tube("M25 30C40 26 60 26 75 30", g, 4.4, 1.3)}
  ${[40, 45, 50, 55, 60].map((x) => `<circle cx="${x}" cy="28.4" r="1.3" fill="#5a3c06"/>`).join("")}
  <path d="M28 78C28 93 72 93 72 78Z" fill="${k.lin([[0, "#c98a4a"], [1, "#4e2a10"]])}" ${O(1.8)}/>
  <ellipse cx="50" cy="83" rx="9" ry="3.2" fill="#2a1408" stroke="${GOLD}" stroke-width="1.2"/>
  <path d="M34 78.5H66" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>
  ${hi("M26 44C25 36 28 31 30 28M24 18.5C24 16.5 25.5 15.5 26.5 16", 1.4, 0.7)}
  ${note(81, 58)}${note(91, 53)}
  ${ln("M85 57V37M95 52V32", INK, 1.4)}<path d="M85 37L95 32V35.5L85 40.5Z" fill="${INK}"/>
  ${note(12, 46)}${ln("M16 45V26C19 28 22 31 21 36", INK, 1.4)}
  ${spark(18, 16, 2.6)}${spark(84, 18, 2.6)}`;
};

P.paleograph = (a, k) => {
  const G = ["M0 0V7", "M0 0L3 7L6 0", "M0 3.5H6M3 0V7", "M0 0H5V7", "M0 7L3 0L6 7M1.5 4H4.5", "M0 0C6 0 6 7 0 7", "M3 0V7M0 2L6 5", "M0 0L6 7M6 0L0 7", "M0 7V0H6V3H0", "M0 3.5A3 3 0 1 0 6 3.5A3 3 0 1 0 0 3.5", "M0 0H6L0 7H6", "M3 0L6 3.5L3 7L0 3.5Z"];
  let glyphs = "";
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) glyphs += `<path d="${G[(r * 5 + c * 7 + 3) % G.length]}" transform="translate(${24 + c * 9} ${30 + r * 9.5})"/>`;
  const roll = k.lin([[0, "#9a7a48"], [0.45, "#f6e8c4"], [1, "#7a5a2a"]]);
  return `
  <path d="M20 22C38 20 56 24 74 22V80C56 82 38 78 20 80Z" fill="${k.lin([[0, "#fbf0d2"], [1, "#d8c08a"]], 0, 0, 1, 1)}" ${O(1.6)}/>
  <g fill="none" stroke="${mix(a, "#000000", 0.25)}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${glyphs}</g>
  <path d="M15 15.5H79A4.5 4.5 0 0 1 79 24.5H15A4.5 4.5 0 0 1 15 15.5Z" fill="${roll}" ${O(1.5)}/>
  <path d="M15 76.5H79A4.5 4.5 0 0 1 79 85.5H15A4.5 4.5 0 0 1 15 76.5Z" fill="${roll}" ${O(1.5)}/>
  ${[[11.5, 20], [82.5, 20], [11.5, 81], [82.5, 81]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${k.sphere("#8a5a2b")}" ${O(1)}/>`).join("")}
  <path d="M60 74L57 84L61 82L63 86ZM66 74L69 84L65 82L63 86Z" fill="${k.tone("#c0202c")}" ${O(0.9)}/>
  <circle cx="63" cy="70" r="7" fill="${k.sphere("#c0202c")}" ${O(1.3)}/>
  ${facetStar(5, 63, 70, 4, 1.8, "#e86a6a", -90, 0.6)}
  ${tube("M92 4L57 63", "#f4ecd8", 1.4, 0.8)}
  <path d="M90 6C80 14 71 26 64 44C62 49 60 54 59 59C66 50 75 42 87 33C91 23 92 14 90 6Z" fill="${k.lin([[0, "#ffffff"], [1, mix(a, "#ffffff", 0.3)]], 1, 0, 0, 1)}" ${O(1.3)}/>
  ${ln("M86 12L80 13M83 19L76 20M80 25L72 27M76 32L69 35M72 39L66 42M88 15L89 22M85 22L86 29M81 29L82 35M77 36L77 41", mix(a, "#000000", 0.2), 0.8, 0.55)}
  <path d="M57 63L55 68L59 65Z" fill="${INK}"/>
  <path d="M53 72c1 1.6 2 2.6 2 3.6a2 2 0 0 1 -4 0c0-1 1-2 2-3.6Z" fill="${INK}"/>`;
};

P.poacher = (a, k) => {
  const Sh = "M50 6L84 16V46C84 70 68 86 50 94C32 86 16 70 16 46V16Z";
  const cream = k.lin([[0, "#fffbf0"], [1, "#d6c39c"]]);
  const ant = "M46 52C43 44 38 38 30 34M40 41C37 37 36 33 37 28M34.5 36.5C30.5 35 27.5 31 26.5 27";
  return `${k.glow(50, 50, 46, a, 0.35)}
  <path d="${Sh}" fill="${k.metal(GOLD)}" ${O(2)}/>
  <path d="${Sh}" transform="translate(50 50) scale(.84) translate(-50 -50)" fill="${k.lin([[0, mix(a, "#ffffff", 0.28)], [1, mix(a, "#000000", 0.5)]], 0, 0, 1, 1)}" ${O(1.2)}/>
  <path d="M50 13.5L77.5 21.5V46C77.5 52 76 57 74 62C64 52 56 30 50 13.5Z" fill="#000000" opacity=".14"/>
  ${[[50, 10], [80, 19.5], [20, 19.5], [81, 46], [19, 46], [50, 89]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${k.sphere(GOLD)}" stroke="#5a3c06" stroke-width=".6"/>`).join("")}
  ${tube(ant, "#efe2c4", 3, 1.1)}
  <g transform="translate(100 0) scale(-1 1)">${tube(ant, "#efe2c4", 3, 1.1)}</g>
  <path d="M50 80C46.5 77 44.5 71 44 64C42.5 61 38.5 59 35.5 55.5C38.5 55.5 41.5 57 43.5 57C44.5 53 46.5 51 50 51C53.5 51 55.5 53 56.5 57C58.5 57 61.5 55.5 64.5 55.5C61.5 59 57.5 61 56 64C55.5 71 53.5 77 50 80Z" fill="${cream}" ${O(1.6)}/>
  <ellipse cx="47" cy="63" rx="1.2" ry="1.6" fill="${INK}"/><ellipse cx="53" cy="63" rx="1.2" ry="1.6" fill="${INK}"/>
  <path d="M48 76.5C49 75.5 51 75.5 52 76.5C51.5 78 48.5 78 48 76.5Z" fill="${INK}"/>
  ${ln("M50 66V74", "#a89070", 0.9, 0.7)}
  ${leaf(50, 85, 10, 200, k.tone("#7fd3a0"))}${leaf(50, 85, 10, -20, k.tone("#7fd3a0"))}`;
};

P.poison = (a, k) => {
  const F = "M43 10H57V32C70 36 80 48 80 62C80 80 66 92 50 92C34 92 20 80 20 62C20 48 30 36 43 32Z";
  const fc = k.clip(`<path d="${F}"/>`);
  const snake = "M21 33C30 42 66 42 70 31C72 25 64 22 58 25";
  return `${k.glow(50, 66, 42, a, 0.55)}
  ${ln("M58 6C64 2 66 8 72 4M62 12C68 9 70 14 76 11", mix(a, "#ffffff", 0.3), 1.8, 0.8)}
  <path d="${F}" fill="${k.lin([[0, "#f4fbff", 0.9], [1, "#cfe2ea", 0.65]], 0, 0, 1, 0)}"/>
  <g clip-path="${fc}">
    <path d="M18 58C30 53 40 62 50 57C60 52 70 60 82 56V96H18Z" fill="${k.lin([[0, mix(a, "#ffffff", 0.35)], [1, mix(a, "#000000", 0.45)]])}"/>
    ${ln("M18 58C30 53 40 62 50 57C60 52 70 60 82 56", mix(a, "#ffffff", 0.65), 1.6)}
    <g fill="#ffffff" opacity=".6"><circle cx="31" cy="70" r="2"/><circle cx="66" cy="82" r="1.6"/><circle cx="38" cy="85" r="1.2"/><circle cx="68" cy="66" r="2.4"/><circle cx="60" cy="72" r="1"/></g>
    <g opacity=".92"><circle cx="50" cy="71" r="7.2" fill="#f4fff0"/><path d="M45.6 74H54.4V79.5C54.4 80.5 53.5 81 52.6 81H47.4C46.5 81 45.6 80.5 45.6 79.5Z" fill="#f4fff0"/>
    <circle cx="47.3" cy="71" r="1.9" fill="${INK}"/><circle cx="52.7" cy="71" r="1.9" fill="${INK}"/><path d="M50 73.4L48.8 75.6H51.2Z" fill="${INK}"/>${ln("M48 77.5V80.5M50 77.5V80.5M52 77.5V80.5", INK, 0.7)}</g>
  </g>
  <path d="${F}" fill="none" ${O(2)}/>
  ${hi("M27 52C29 46 33 42 38.5 39", 2.6, 0.85)}${hi("M46.5 14V30", 1.6, 0.6)}
  <path d="M40 9.5H60V13H40Z" fill="${k.lin([[0, "#ffffff"], [1, "#b8ccd4"]])}" ${O(1.2)}/>
  <path d="M42 1.5H58L57 10H43Z" fill="${k.lin([[0, "#dcae72"], [1, "#8a5a2b"]], 0, 0, 1, 0)}" ${O(1.3)}/>
  <g fill="#6a4020" opacity=".6"><circle cx="46" cy="5" r=".7"/><circle cx="52" cy="4" r=".6"/><circle cx="55" cy="7" r=".7"/></g>
  ${tube(snake, k.lin([[0, "#9be86a"], [1, "#2a6a1a"]]), 5, 1.2)}
  ${ln(snake, "#1a4a10", 5, 0.25).replace('stroke-linecap="round"', 'stroke-dasharray="1.5 3" stroke-linecap="butt"')}
  <path d="M58 25C55 21 50 21 48.5 24C47.5 27 51 29.5 55 28.5Z" fill="${k.tone("#5aa83a")}" ${O(1.2)}/>
  <circle cx="51.5" cy="24.3" r=".9" fill="#ffe14a" stroke="${INK}" stroke-width=".4"/>
  ${ln("M48.6 25.6L44.5 26.5M44.5 26.5L42.5 25.4M44.5 26.5L42.8 28", "#d0202c", 0.8)}`;
};

P.ruins = (a, k) => {
  const stone = k.lin([[0, "#7e6e52"], [0.3, "#f4e8d0"], [0.7, "#c4b290"], [1, "#6a5a40"]], 0, 0, 1, 0);
  const col = (x, top, cap = true) => `${cap ? `<path d="M${x - 2.5} ${top - 4}H${x + 14.5}V${top}H${x - 2.5}Z" fill="${stone}" ${O(1.3)}/>` : ""}
    <path d="M${x} ${top}H${x + 12}V84H${x}Z" fill="${stone}" ${O(1.4)}/>
    ${ln(`M${x + 3} ${top + 2}V83M${x + 6} ${top + 2}V83M${x + 9} ${top + 2}V83`, "#8a7a5c", 0.8, 0.6)}
    <path d="M${x - 2.5} 84H${x + 14.5}V88H${x - 2.5}Z" fill="${stone}" ${O(1.3)}/>`;
  return `
  ${k.glow(66, 32, 32, "#f08a2c", 0.5)}
  <circle cx="66" cy="32" r="18" fill="${k.sphere("#f0962c")}" ${O(1.2)}/>
  ${ln("M16 16q3-3 6 0q3-3 6 0M28 8q2-2 4 0q2-2 4 0", INK, 1.2, 0.7)}
  ${col(16, 34)}
  <path d="M44 56L47 52L50 55.5L53 50L56 54V84H44Z" fill="${stone}" ${O(1.4)}/>
  ${ln("M47 56V83M50 57V83M53 54V83", "#8a7a5c", 0.8, 0.6)}
  <path d="M41.5 84H58.5V88H41.5Z" fill="${stone}" ${O(1.3)}/>
  ${col(72, 42)}
  <path d="M10 26H56L53 29L56 32H10Z" fill="${stone}" ${O(1.4)}/>
  ${ln("M14 32V30M20 32V30M26 32V30M32 32V30M38 32V30M44 32V30M50 32V30", "#6a5c44", 0.9)}
  <path d="M4 88C20 85 80 85 96 88V99H4Z" fill="${k.lin([[0, "#c4ae84"], [1, "#6e5a3a"]])}" ${O(1.6)}/>
  <g transform="rotate(-8 82 84)"><path d="M74 80h12a4.5 4.5 0 0 1 0 9H74Z" fill="${stone}" ${O(1.3)}/><ellipse cx="74" cy="84.5" rx="2.6" ry="4.5" fill="#cbbd9e" ${O(1.2)}/></g>
  ${ln("M18 84C25 76 15 68 22 60C29 52 18 46 24 38", "#2f7a3a", 1.6)}
  ${[[21, 78, 200], [19, 70, -20], [24, 62, 190], [21, 54, -30], [21, 46, 200], [24, 40, -10]].map(([x, y, r]) => leaf(x, y, 6, r, k.tone("#4fbf6a"))).join("")}
  ${ln("M8 88l1.5-4 1 4M34 88l1-3.5 1.2 3.5M64 88l1.4-4 1 4M90 88l1-3 1 3", "#3a7a2a", 1)}`;
};

P.sea = (a, k) => {
  const iron = k.lin([[0, "#c4d0d8"], [0.5, "#6a7a86"], [1, "#2e3a44"]], 0, 0, 1, 1);
  const wave = (y, c1, c2, op) => `<path d="M0 ${y}C10 ${y - 5} 18 ${y - 5} 26 ${y}S42 ${y + 5} 50 ${y}S66 ${y - 5} 74 ${y}S90 ${y + 5} 100 ${y}V102H0Z" fill="${k.lin([[0, c1], [1, c2]])}" opacity="${op}" ${O(1.3)}/>`;
  return `${k.glow(50, 50, 46, a, 0.35)}
  ${tube("M50 22V80", iron, 6, 1.3)}
  ${tube("M24 58C26 76 38 84 50 84C62 84 74 76 76 58", iron, 6, 1.3)}
  <path d="M24 48L16 64L31 61Z" fill="${iron}" ${O(1.4)}/>
  <path d="M76 48L84 64L69 61Z" fill="${iron}" ${O(1.4)}/>
  ${tube("M31 30H69", iron, 5, 1.3)}
  <circle cx="29.5" cy="30" r="3.6" fill="${k.sphere("#8a9aa6")}" ${O(1.2)}/><circle cx="70.5" cy="30" r="3.6" fill="${k.sphere("#8a9aa6")}" ${O(1.2)}/>
  ${tube("M50 8.5a5.6 5.6 0 1 1 -0.1 0", iron, 3.2, 1.1)}
  ${tube("M50 20C40 22 34 30 40 38C46 46 60 44 60 54C60 64 44 66 42 74C40 80 46 86 53 86", "#d8b47a", 3, 1)}
  ${ln("M50 20C40 22 34 30 40 38C46 46 60 44 60 54C60 64 44 66 42 74C40 80 46 86 53 86", "#7a5a2a", 3, 0.6).replace('stroke-linecap="round"', 'stroke-dasharray="1.6 2.2" stroke-linecap="butt"')}
  ${hi("M48 26V76", 1.2, 0.5)}
  ${wave(84, "#7fd0f0", "#1a5a8a", 0.88)}
  ${wave(91, "#4aa8d8", "#0e3a64", 0.95)}
  ${ln("M6 82C12 79 18 79 24 82M54 82C60 79 66 79 72 82", "#ffffff", 1.4, 0.85)}
  <g fill="none" stroke="#8fd8f6" stroke-width="1"><circle cx="20" cy="40" r="2.4"/><circle cx="16" cy="30" r="1.6"/><circle cx="82" cy="36" r="2"/><circle cx="86" cy="26" r="1.3"/></g>`;
};

P.terrorist = (a, k) => {
  const burst = Array.from({ length: 16 }, (_, i) => pt(80, 12, i % 2 ? 3.4 : 9, i * 22.5));
  return `
  ${k.glow(80, 12, 16, "#ffb000", 0.85)}
  <circle cx="46" cy="60" r="27" fill="${k.rad([[0, "#8a98a2"], [0.35, "#3a454e"], [1, "#080b0e"]], 0.5, 0.5, 0.56, 0.35, 0.3)}" ${O(2)}/>
  <ellipse cx="35" cy="47" rx="8" ry="4.6" fill="#ffffff" opacity=".28" transform="rotate(-38 35 47)"/>
  ${hi("M28 70C30 76 35 80 41 82", 1.4, 0.18)}
  <path d="M58.5 31.5L70 43L64 49L52.5 37.5Z" fill="${k.metal("#9aa8b0")}" ${O(1.6)}/>
  ${ln("M56 36L65.5 45.5", "#5a6670", 1, 0.6)}
  ${tube("M65.5 36C71 30 70 24 75.5 20C78.5 18 80 16 79.5 13", "#d4b07a", 2.2, 1)}
  ${ln("M65.5 36C71 30 70 24 75.5 20C78.5 18 80 16 79.5 13", "#7a5a2a", 2.2, 0.7).replace('stroke-linecap="round"', 'stroke-dasharray="1.4 1.4" stroke-linecap="butt"')}
  <polygon points="${P2(burst)}" fill="${k.rad([[0, "#ffffff"], [0.4, "#ffe066"], [1, "#ff7a00"]])}"/>
  <g fill="#ffcf3a"><circle cx="90" cy="6" r="1.1"/><circle cx="72" cy="4" r=".9"/><circle cx="92" cy="18" r=".8"/></g>
  <circle cx="46" cy="60" r="36" fill="none" stroke="${a}" stroke-width="1.9" stroke-dasharray="7 4"/>
  ${ln("M46 18V30M46 90V102M4 60H16M76 60H88", a, 2.4)}
  <circle cx="46" cy="60" r="2.2" fill="${a}"/>
  ${ln("M40 60H52M46 54V66", a, 1.2, 0.85)}`;
};

P.treasure = (a, k) => {
  const A = [16, 40], B = [34, 20], C = [66, 20], D = [84, 40], G1 = [30, 40], G2 = [50, 40], G3 = [70, 40], E = [50, 88];
  const F = [[A, B, G1, 0.45], [B, G2, G1, 0.7], [B, C, G2, 0.85], [C, G3, G2, 0.55], [C, D, G3, 0.25], [A, G1, E, -0.05], [G1, G2, E, 0.3], [G2, G3, E, -0.25], [G3, D, E, -0.45]];
  const coin = (x, y, rx = 9) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${f1(rx * 0.36)}" fill="${k.metal(GOLD)}" ${O(1.1)}/>`;
  return `${k.glow(50, 50, 48, a, 0.6)}
  ${coin(24, 88)}${coin(76, 88)}${coin(36, 92)}${coin(64, 92)}${coin(14, 92, 7)}${coin(86, 92, 7)}
  ${F.map(([p, q, r, v]) => `<path d="M${p}L${q}L${r}Z" fill="${v >= 0 ? mix(a, "#ffffff", v) : mix(a, "#000000", -v)}" stroke="${INK}" stroke-opacity=".35" stroke-width=".7" stroke-linejoin="round"/>`).join("")}
  <polygon points="${P2([A, B, C, D, E])}" fill="none" ${O(2)}/>
  ${ln(`M${A}L${D}`, INK, 1.2, 0.7)}
  ${hi("M36 22.6H64", 1.6, 0.95)}${hi("M33 42L47 80", 1.2, 0.5)}
  ${spark(66, 26, 4.6, "#ffffff")}${spark(84, 14, 3.4)}${spark(16, 22, 2.8)}${spark(36, 60, 2.2, "#ffffff")}`;
};

P.rookie = (a, k) => {
  const lg = k.lin([[0, mix(a, "#ffffff", 0.35)], [1, mix(a, "#000000", 0.42)]], 0, 0, 1, 1);
  const pot = k.lin([[0, "#8a3e1c"], [0.35, "#f0a070"], [0.7, "#c66a3a"], [1, "#6e3016"]], 0, 0, 1, 0);
  return `${k.glow(50, 38, 42, a, 0.45)}
  ${shadow(50, 93, 22, 3)}
  <path d="M30 66H70L65 92H35Z" fill="${pot}" ${O(1.8)}/>
  ${ln("M33 76H67", "#ffffff", 1.2, 0.4)}${ln("M34.5 80H65.5", "#5a2410", 1, 0.5)}
  <path d="M27 60H73V68H27Z" fill="${pot}" ${O(1.8)}/>
  <ellipse cx="50" cy="61" rx="21" ry="2.8" fill="#4a2e1a"/>
  ${tube("M50 61C50 54 49 48 50 40", "#3a9a52", 2.6, 1.1)}
  <path d="M50 51C40 53 26 47 22 33C36 29 48 37 50 51Z" fill="${lg}" ${O(1.6)}/>
  <path d="M50 43C58 43 72 35 76 21C62 17 52 27 50 43Z" fill="${lg}" ${O(1.6)}/>
  ${ln("M49 50C42 45 33 40 25 35M51 42C58 36 66 29 73 23M33 42l-.5 3.6M40 46l-.4 3.4M60 34l3.4.8M66 29l3.4.6", "#0a2a10", 0.9, 0.5)}
  <path d="M50 40C47 35 48 31 51 28C53 32 53 36 50 40Z" fill="${k.tone(mix(a, "#ffffff", 0.2))}" ${O(1.2)}/>
  <path d="M66 28c1.4 2.2 2.6 3.4 2.6 4.8a2.6 2.6 0 0 1 -5.2 0c0-1.4 1.2-2.6 2.6-4.8Z" fill="${k.lin([[0, "#ffffff"], [1, "#8fd3f0"]])}" ${O(0.8)}/>
  ${spark(50, 16, 3.6)}${spark(24, 18, 2.4)}${spark(80, 48, 2.2)}`;
};

/* =====================================================================
   FAMÍLIAS
   ===================================================================== */
// Geil — farmacêutica: caduceu com dupla hélice de DNA
P.geil = (a, k) => {
  const N = 60, pts1 = [], pts2 = [];
  for (let i = 0; i <= N; i++) {
    const y = 30 + (i * 58) / N, ph = (i / N) * Math.PI * 4.4;
    pts1.push([f1(50 + 15 * Math.sin(ph)), f1(y), Math.cos(ph)]);
    pts2.push([f1(50 - 15 * Math.sin(ph)), f1(y), -Math.cos(ph)]);
  }
  const runs = (pts, front) => {
    let d = "", open = false;
    for (let i = 0; i < pts.length; i++) {
      const on = front ? pts[i][2] >= 0 : pts[i][2] < 0;
      if (on) { d += (open ? "L" : "M") + pts[i][0] + " " + pts[i][1]; open = true; }
      else if (open) { d += "L" + pts[i][0] + " " + pts[i][1]; open = false; }
    }
    return d;
  };
  let rungs = "";
  for (let i = 2; i < N; i += 4) {
    const [x1, y] = pts1[i], [x2] = pts2[i], m = f1((x1 + x2) / 2);
    rungs += `<path d="M${x1} ${y}H${m}" stroke="${mix(a, "#ffffff", 0.2)}" stroke-width="2.2"/><path d="M${m} ${y}H${x2}" stroke="#5ab0e0" stroke-width="2.2"/>`;
  }
  const c1 = k.lin([[0, mix(a, "#ffffff", 0.4)], [1, mix(a, "#000000", 0.3)]]), c2 = k.lin([[0, "#a8dcff"], [1, "#1a5a9a"]]);
  const wing = "M47 22C38 12 22 10 9 16C17 18 23 20 27 23C19 23 13 27 9 31C19 32 29 29 36 27C29 30 24 34 21 38C31 37 40 32 47 28Z";
  return `${k.glow(50, 50, 48, a, 0.5)}
  <g opacity=".9">${rungs}</g>
  ${tube(runs(pts1, false), c1, 3, 1)}${tube(runs(pts2, false), c2, 3, 1)}
  <path d="M47.5 15H52.5V94H47.5Z" fill="${k.chrome("#e2b33c")}" ${O(1.4)}/>
  <path d="${wing}" fill="${k.lin([[0, "#ffffff"], [1, mix(a, "#ffffff", 0.35)]], 1, 0, 0, 1)}" ${O(1.4)}/>
  <path d="${wing}" transform="translate(100 0) scale(-1 1)" fill="${k.lin([[0, "#ffffff"], [1, mix(a, "#ffffff", 0.35)]], 0, 0, 1, 1)}" ${O(1.4)}/>
  ${ln("M44 22C36 17 26 15 16 17M42 27C34 26 26 27 17 30M43 29C36 31 30 34 26 36", mix(a, "#000000", 0.2), 0.8, 0.6)}
  ${ln("M56 22C64 17 74 15 84 17M58 27C66 26 74 27 83 30M57 29C64 31 70 34 74 36", mix(a, "#000000", 0.2), 0.8, 0.6)}
  ${tube(runs(pts1, true), c1, 3, 1)}${tube(runs(pts2, true), c2, 3, 1)}
  <circle cx="50" cy="12" r="5.6" fill="${k.sphere(GOLD)}" ${O(1.4)}/>
  <circle cx="50" cy="95" r="3.4" fill="${k.sphere(GOLD)}" ${O(1.2)}/>
  ${spark(18, 52, 3)}${spark(84, 70, 2.6)}${spark(82, 46, 2)}`;
};

// Zecche — linhagem de caçadores: arco recurvo retesado
P.zecche = (a, k) => {
  const wood = k.lin([[0, "#d89a5a"], [1, "#5e3414"]], 0, 0, 1, 0);
  const ticks = [0, 90, 180, 270].map((d) => { const [x, y] = pt(50, 50, 44, d - 90), [x2, y2] = pt(50, 50, 38, d - 90); return `M${x} ${y}L${x2} ${y2}`; }).join("");
  return `${k.glow(56, 46, 46, a, 0.45)}
  <circle cx="50" cy="50" r="44" fill="none" stroke="${a}" stroke-width="1.2" opacity=".55"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="${a}" stroke-width=".8" stroke-dasharray="1.5 3" opacity=".55"/>
  ${ln(ticks, a, 2, 0.8)}
  <g transform="rotate(-25 50 50)">
    ${ln("M34 10L19 50L34 90", "#3a2a1a", 2.2)}${ln("M34 10L19 50L34 90", "#f4ecd8", 1)}
    ${tube("M34 10C52 20 58 40 56 50C58 60 52 80 34 90", wood, 5, 1.3)}
    ${tube("M34 10C31 7.6 28.6 8.4 28.6 11.4M34 90C31 92.4 28.6 91.6 28.6 88.6", wood, 2, 0.9)}
    <rect x="53.4" y="43" width="6.4" height="14" rx="2" fill="${k.lin([[0, "#5a3020"], [1, "#1e0e08"]], 0, 0, 1, 0)}" ${O(1.3)}/>
    ${ln("M53.4 46L59.8 48M53.4 50L59.8 52M53.4 54L59.8 56", GOLD, 1, 0.9)}
    ${tube("M19 50H88", "#ecd8ac", 2, 1)}
    <path d="M86 44.5L99 50L86 55.5L89.5 50Z" fill="${k.metal("#b8c4cc")}" ${O(1.3)}/>
    <path d="M19.5 50L31 50L27 42.5L15.5 42.5Z" fill="${k.tone(a)}" ${O(1.2)}/>
    <path d="M19.5 50L31 50L27 57.5L15.5 57.5Z" fill="${k.tone(mix(a, "#ffffff", 0.35))}" ${O(1.2)}/>
    ${ln("M22 49L19 44M25 49L22 44M28 49L25 44M22 51L19 56M25 51L22 56M28 51L25 56", INK, 0.6, 0.5)}
    ${ln("M70 46H80M64 54H76", mix(a, "#ffffff", 0.4), 1.2, 0.8)}
  </g>
  ${spark(94, 28, 3.4)}${spark(14, 18, 2.4)}`;
};

// Agrippa — um dos Dez Dons: chapéu, rosa e punhal
P.agrippa = (a, k) => {
  const rose = k.rad([[0, "#ff7a86"], [0.6, a], [1, mix(a, "#000000", 0.5)]], 0.45, 0.4, 0.6);
  return `${k.glow(50, 54, 46, a, 0.4)}
  <g transform="rotate(38 50 50)">
    <path d="M50 2L55 11V50H45V11Z" fill="${k.chrome("#c9d2d8")}" ${O(1.5)}/>
    ${ln("M50 9V48", "#6a7680", 0.9, 0.8)}
    <path d="M37 50H63A2.5 2.5 0 0 1 63 55H37A2.5 2.5 0 0 1 37 50Z" fill="${k.metal(GOLD)}" ${O(1.4)}/>
    <path d="M46.5 55H53.5V77H46.5Z" fill="${k.lin([[0, "#3a3a3a"], [1, "#0a0a0a"]], 0, 0, 1, 0)}" ${O(1.3)}/>
    ${ln("M46.5 59L53.5 61.5M46.5 64L53.5 66.5M46.5 69L53.5 71.5", "#7a7a7a", 0.9)}
  </g>
  <path d="M8 66C20 57 80 57 92 66C84 77.5 16 77.5 8 66Z" fill="${k.lin([[0, "#56565e"], [1, "#121216"]])}" ${O(2)}/>
  ${hi("M14 65C26 60 74 60 86 65", 1.2, 0.3)}
  <path d="M26 63C24 45 28 31 36 27C42 25 46 31 50 31C54 31 58 25 64 27C72 31 76 45 74 63Z" fill="${k.lin([[0, "#3a3a42"], [0.35, "#6a6a74"], [0.7, "#2a2a30"], [1, "#141418"]], 0, 0, 1, 0)}" ${O(2)}/>
  ${ln("M50 31C49 38 50 44 50.5 49M38 30C37 38 37 46 38 54M62 30C63 38 63 46 62 54", "#000000", 1.2, 0.45)}
  <path d="M25.2 54C40 58.5 60 58.5 74.8 54L75.4 62C60 66.5 40 66.5 24.6 62Z" fill="${k.lin([[0, mix(a, "#ffffff", 0.2)], [1, mix(a, "#000000", 0.45)]])}" ${O(1.5)}/>
  ${hi("M27 56C40 59.6 60 59.6 73 56", 1, 0.4)}
  ${hi("M31 50C30 42 32 34 36.5 30", 1.8, 0.25)}
  ${leaf(66, 64, 10, 150, k.tone("#3f8a4a"))}${leaf(75, 64.5, 10, 28, k.tone("#3f8a4a"))}
  <path d="M70 49C76.5 49 80 54 79 59.5C78 65 73 68 68.5 66.5C63.5 65 62 59.5 63.5 55C64.5 51.5 67 49 70 49Z" fill="${rose}" ${O(1.5)}/>
  ${ln("M70.5 53C74 53 75.5 56 74.5 59C73.5 62 69.5 62.5 68 60C67 58 68.5 56 70.5 56.6M66 54.5C64.6 58 65.6 62.4 69 64M73 51C76.5 52.5 77.5 56 77 59", mix(a, "#000000", 0.55), 1.1)}
  ${hi("M67 52.5C68.5 51 70 50.6 71.5 50.8", 1, 0.6)}
  ${spark(18, 30, 2.6)}${spark(86, 40, 2.2)}`;
};

// Zoldyck — assassinos: garra retrátil com rastro (Eco do Ritmo)
P.zoldyck = (a, k) => {
  const hand = (skin, claw, o) => `
    <path d="M35 63L30 40C29 35 36 33 37.5 38L43 60Z" fill="${skin}" ${o}/>
    <path d="M43 60L43 34C43 29 51 29 51 34L51 59Z" fill="${skin}" ${o}/>
    <path d="M51 59L55 37C56 32 63 33 62 38L58 62Z" fill="${skin}" ${o}/>
    <path d="M58 63L64 46C65.5 42 71 44 70 48L65 66Z" fill="${skin}" ${o}/>
    <path d="M34 62C33 72 36 82 44 88L44 100L60 100L60 88C66 82 68 72 66 62C58 58 42 58 34 62Z" fill="${skin}" ${o}/>
    <path d="M36 73C29 70 23 63 21 57C19 53 24 50 27 53C30 58 34 62 40 65Z" fill="${skin}" ${o}/>
    <path d="M30.6 38C29 30 28 24 26.6 15C31 22.6 34 30 36.6 37Z" fill="${claw}" ${o}/>
    <path d="M43.6 33C45 25 46 18 47 8.4C48 18 49.6 25 50.6 33Z" fill="${claw}" ${o}/>
    <path d="M55.6 36C58 28 61 22 65.4 14.6C64 23 63 29 61.6 37Z" fill="${claw}" ${o}/>
    <path d="M64.6 46C67 40 71 34 77.4 28.6C74 36 72 41 70 47Z" fill="${claw}" ${o}/>
    <path d="M24 51C20 48.6 17 47.4 11.6 46.4C16 50 19 53 23 55.6Z" fill="${claw}" ${o}/>`;
  const L = mix(a, "#ffffff", 0.3);
  return `${k.glow(54, 46, 46, "#7fb0d0", 0.4)}
  <path d="M74 4C84 22 90 42 88 64C85 44 80 24 74 4Z" fill="${L}" opacity=".9"/>
  <path d="M84 10C92 26 96 42 95 58C92 42 89 26 84 10Z" fill="${L}" opacity=".7"/>
  <path d="M66 6C74 20 78 32 79 46C75 34 71 20 66 6Z" fill="${L}" opacity=".6"/>
  <g transform="translate(-18 8)" opacity=".2">${hand("#4a6a84", "#4a6a84", "")}</g>
  <g transform="translate(-9 4)" opacity=".35">${hand("#4a6a84", "#4a6a84", "")}</g>
  ${hand(k.lin([[0, "#f8f2ec"], [1, "#a8988e"]], 0, 0, 1, 1), k.lin([[0, "#ffffff"], [0.5, "#c8d4dc"], [1, "#5a6a76"]], 0, 0, 1, 0), O(1.6))}
  ${ln("M38 72C44 68 52 68 60 70M40 79C46 76 52 75 58 76M35 47h3M45 45h4M55 47l3.4.6M64 54l2.6 1", "#6a5a52", 1, 0.6)}
  ${hi("M45 31l1.2-14M57.4 34l5-14", 0.9, 0.85)}
  ${spark(80, 76, 2.6, "#e8f4ff")}${spark(18, 30, 2.2, "#e8f4ff")}`;
};

// Hui Guo Rou — família imperial de Kakin: pagode
P.huiguorou = (a, k) => {
  const roofG = k.lin([[0, "#4aa088"], [1, "#0d3a2c"]]);
  const wallG = k.lin([[0, mix(a, "#000000", 0.45)], [0.3, mix(a, "#ffffff", 0.12)], [1, mix(a, "#000000", 0.5)]], 0, 0, 1, 0);
  const gold = k.metal(GOLD);
  const roof = (y, w) => `<path d="M${50 - w - 7} ${y + 1}C${50 - w} ${y} ${f1(50 - w * 0.5)} ${y - 4} 50 ${y - 9}C${f1(50 + w * 0.5)} ${y - 4} ${50 + w} ${y} ${50 + w + 7} ${y + 1}C${50 + w + 2} ${y + 4.5} ${50 - w - 2} ${y + 4.5} ${50 - w - 7} ${y + 1}Z" fill="${roofG}" ${O(1.6)}/>
    ${ln(`M${50 - w - 5} ${y + 2.6}C${50 - w} ${y + 3.6} ${50 + w} ${y + 3.6} ${50 + w + 5} ${y + 2.6}`, GOLD, 1.5)}
    ${ln(`M${f1(50 - w * 0.6)} ${y - 2}L${f1(50 - w * 0.7)} ${y + 2}M${f1(50 - w * 0.2)} ${y - 6}L${f1(50 - w * 0.25)} ${y + 3}M${f1(50 + w * 0.2)} ${y - 6}L${f1(50 + w * 0.25)} ${y + 3}M${f1(50 + w * 0.6)} ${y - 2}L${f1(50 + w * 0.7)} ${y + 2}`, "#ffffff", 0.7, 0.25)}
    <circle cx="${50 - w - 7}" cy="${y}" r="1.6" fill="${gold}" ${O(0.7)}/><circle cx="${50 + w + 7}" cy="${y}" r="1.6" fill="${gold}" ${O(0.7)}/>`;
  const lantern = (x, y) => `${ln(`M${x} ${y - 6}V${y - 3}`, INK, 0.8)}<ellipse cx="${x}" cy="${y}" rx="2.8" ry="3.4" fill="${k.sphere("#ff4a3a")}" ${O(0.9)}/><path d="M${x - 1.8} ${y - 3.4}h3.6M${x - 1.8} ${y + 3.4}h3.6" stroke="${GOLD}" stroke-width="1.2"/>${ln(`M${x} ${y + 3.6}V${y + 7}`, "#e2b33c", 0.9)}`;
  const cloud = (x, s) => `<path transform="translate(${x} 92) scale(${s} 1)" d="M-14 0C-14 -6 -8 -8 -4 -5C-3 -10 4 -10 6 -5C10 -6 13 -2 11 1Z" fill="#fbf2dc" stroke="${GOLD}" stroke-width="1.3"/>`;
  return `
  <circle cx="50" cy="34" r="24" fill="${k.sphere(mix(a, "#ffb000", 0.55))}" opacity=".85"/>
  ${k.glow(50, 34, 40, mix(a, "#ffb000", 0.4), 0.45)}
  ${ln("M50 25V8", GOLD, 2.2)}
  ${[[22, 2.8], [18, 2.3], [14, 1.9]].map(([y, r]) => `<circle cx="50" cy="${y}" r="${r}" fill="${gold}" ${O(0.8)}/>`).join("")}
  <path d="M50 2L52 8H48Z" fill="${gold}" ${O(0.7)}/>
  <path d="M41 36H59V49H41Z" fill="${wallG}" ${O(1.4)}/>
  <circle cx="50" cy="42.5" r="3.6" fill="${gold}" ${O(1)}/>${ln("M50 39V46M46.5 42.5H53.5", "#5a3c06", 0.8)}
  ${roof(35, 12)}
  <path d="M36 53H64V69H36Z" fill="${wallG}" ${O(1.4)}/>
  <path d="M40 57H46V65H40ZM54 57H60V65H54Z" fill="${gold}" ${O(1)}/>${ln("M43 57V65M57 57V65M40 61H46M54 61H60", "#5a3c06", 0.7)}
  ${roof(52, 18)}
  <path d="M30 73H70V90H30Z" fill="${wallG}" ${O(1.4)}/>
  ${ln("M33 74V89M67 74V89", GOLD, 1.2, 0.8)}
  <path d="M44.5 90V81A5.5 5.5 0 0 1 55.5 81V90Z" fill="${gold}" ${O(1.2)}/>${ln("M50 76V90", "#5a3c06", 0.9)}
  ${roof(71, 24)}
  ${lantern(23, 78)}${lantern(77, 78)}
  <path d="M22 90H78V95H22Z" fill="${k.lin([[0, "#e8dcc4"], [1, "#9a8a6a"]])}" ${O(1.3)}/>
  ${cloud(14, 1)}${cloud(86, -1)}`;
};

// Sunny — agricultura: feixe de trigo com girassol
P.sunny = (a, k) => {
  const grain = k.lin([[0, "#fff2b8"], [1, "#c48a18"]]);
  const rays = Array.from({ length: 18 }, (_, i) => { const p1 = pt(50, 44, 46, i * 20 - 4), p2 = pt(50, 44, 46, i * 20 + 4); return `M50 44L${p1}L${p2}Z`; }).join("");
  let stalks = "", ears = "";
  [-32, -21, -10.5, 0, 10.5, 21, 32].forEach((ang) => {
    const t = pt(50, 68, 44, ang - 90), b = pt(50, 68, 24, ang + 90);
    stalks += tube(`M${b}L${t}`, "#d4b048", 1.6, 0.8);
    for (let j = 0; j < 5; j++) {
      const [gx, gy] = pt(50, 68, 30 + j * 3.2, ang - 90);
      ears += `<ellipse cx="${gx}" cy="${gy}" rx="1.9" ry="3.8" transform="rotate(${ang - 28} ${gx} ${gy}) translate(-2.2 0)" fill="${grain}" ${O(0.8)}/><ellipse cx="${gx}" cy="${gy}" rx="1.9" ry="3.8" transform="rotate(${ang + 28} ${gx} ${gy}) translate(2.2 0)" fill="${grain}" ${O(0.8)}/>`;
    }
    const [tx, ty] = pt(50, 68, 46.5, ang - 90), [ax, ay] = pt(50, 68, 54, ang - 90);
    ears += `<ellipse cx="${tx}" cy="${ty}" rx="1.8" ry="3.4" transform="rotate(${ang} ${tx} ${ty})" fill="${grain}" ${O(0.8)}/>${ln(`M${tx} ${ty}L${ax} ${ay}`, "#a07a20", 0.6, 0.8)}`;
  });
  const petals = Array.from({ length: 16 }, (_, i) => `<path transform="rotate(${i * 22.5} 50 68)" d="M50 62C47.6 58 48 54 50 51C52 54 52.4 58 50 62Z" fill="${k.lin([[0, "#ffe680"], [1, "#e89a10"]])}" ${O(0.8)}/>`).join("");
  return `
  <path d="${rays}" fill="${mix(GOLD, "#ffffff", 0.4)}" opacity=".45"/>
  ${k.glow(50, 44, 40, "#ffd34a", 0.55)}
  ${stalks}${ears}
  <path d="M36 63.5C45 66 55 66 64 63.5V72C55 74.5 45 74.5 36 72Z" fill="${k.lin([[0, mix(a, "#ffffff", 0.25)], [1, mix(a, "#000000", 0.4)]])}" ${O(1.4)}/>
  <path d="M38 72L32 84L37 82L39 87ZM62 72L68 84L63 82L61 87Z" fill="${k.tone(a)}" ${O(1.1)}/>
  ${petals}
  <circle cx="50" cy="68" r="6.4" fill="${k.rad([[0, "#8a5a2a"], [1, "#2a1606"]])}" ${O(1.2)}/>
  <g fill="#e8c070" opacity=".75">${Array.from({ length: 12 }, (_, i) => { const [x, y] = pt(50, 68, i % 2 ? 4.2 : 2.2, i * 30); return `<circle cx="${x}" cy="${y}" r=".7"/>`; }).join("")}</g>
  ${spark(16, 26, 3)}${spark(86, 22, 2.6)}`;
};

/* =====================================================================
   AQUISIÇÕES
   ===================================================================== */
P.prodigio = (a0, k) => { const a = mix(a0, "#e05a00", 0.4); return `
  <path d="M58 42C44 56 26 72 6 88C28 77 46 63 68 46Z" fill="${k.lin([[0, a, 0.9], [1, a, 0]], 1, 0, 0, 1)}"/>
  <path d="M53 33C40 41 26 49 10 55C28 52 42 46 58 39Z" fill="${k.lin([[0, "#ffffff", 0.85], [1, "#ffffff", 0]], 1, 0, 0, 1)}"/>
  <path d="M68 50C60 62 52 74 44 90C55 77 62 67 72 54Z" fill="${k.lin([[0, mix(a, "#ffffff", 0.4), 0.85], [1, a, 0]], 1, 0, 0, 1)}"/>
  ${spark(30, 66, 3)}${spark(20, 77, 2)}${spark(41, 58, 2.4)}${spark(52, 76, 1.8)}
  ${k.glow(64, 36, 32, a, 0.8)}
  ${facetStar(5, 64, 36, 25, 10.5, mix(a0, "#ffe08a", 0.3), -78)}
  ${spark(84, 14, 3.4)}${spark(90, 52, 2.4)}${spark(40, 16, 2.2)}`; };

P.genialidade = (a, k) => {
  const bulb = "M50 8C32 8 20 22 20 38C20 50 28 56 34 64C36 67 37 70 37 74H63C63 70 64 67 66 64C72 56 80 50 80 38C80 22 68 8 50 8Z";
  const rays = Array.from({ length: 11 }, (_, i) => { const d = -180 + i * 18; const [x1, y1] = pt(50, 38, 36, d), [x2, y2] = pt(50, 38, i % 2 ? 41 : 46, d); return `M${x1} ${y1}L${x2} ${y2}`; }).join("");
  const thread = k.metal("#c9d2d8");
  return `${k.glow(50, 38, 46, a, 0.55)}
  ${ln(rays, GOLD, 2.4)}
  <path d="${bulb}" fill="${k.rad([[0, "#fffef0"], [0.5, "#fff3b0"], [1, mix(a, "#ffffff", 0.45), 0.85]], 0.5, 0.42, 0.6)}" ${O(2)}/>
  ${k.glow(50, 44, 18, "#ffb000", 0.6)}
  ${ln("M43 74V58C43 53 46 50 46 46M57 74V58C57 53 54 50 54 46", "#8a6a3a", 1.3)}
  ${ln("M44 46l1.5-4 1.5 4 1.5-4 1.5 4 1.5-4 1.5 4 1.5-4", "#ff8a00", 1.8)}${ln("M44 46l1.5-4 1.5 4 1.5-4 1.5 4 1.5-4 1.5 4 1.5-4", "#fff3a0", 0.7)}
  ${hi("M29 34C30 24 37 17 45 15", 3, 0.9)}${hi("M27 42.5v1", 3, 0.9)}
  <path d="M37 74H63V79H37Z" fill="${thread}" ${O(1.4)}/>
  <path d="M38 79H62V84H38Z" fill="${thread}" ${O(1.4)}/>
  <path d="M39 84H61V88H39Z" fill="${thread}" ${O(1.4)}/>
  <path d="M43 88H57L54 93H46Z" fill="#2a2a2a" ${O(1.3)}/>
  ${spark(86, 66, 3)}${spark(14, 66, 2.6)}`;
};

P.olhos = (a, k) => {
  const E = "M6 52C22 27 78 27 94 52C78 77 22 77 6 52Z";
  const ec = k.clip(`<path d="${E}"/>`);
  const stri = Array.from({ length: 36 }, (_, i) => { const [x1, y1] = pt(50, 52, 8.5, i * 10), [x2, y2] = pt(50, 52, 18.5, i * 10 + 3); return `M${x1} ${y1}L${x2} ${y2}`; }).join("");
  return `${k.glow(50, 52, 50, a, 0.6)}
  <path d="${tongues(50, 52, 44, 24, 18, 14, 0, 360, 7)}" fill="${a}" opacity=".55"/>
  <path d="${tongues(50, 52, 44, 24, 18, 8, 10, 370, 11)}" fill="${mix(a, "#ffd060", 0.4)}" opacity=".55"/>
  <path d="${E}" fill="${k.rad([[0, "#ffffff"], [0.7, "#fbeeee"], [1, "#e4bcbc"]])}" ${O(2.2)}/>
  <g clip-path="${ec}">
    <circle cx="50" cy="52" r="20" fill="${k.rad([[0, "#ffc0b8"], [0.4, "#ff3a3a"], [0.8, "#b0101a"], [1, "#4a0006"]])}"/>
    ${ln(stri, "#5a0008", 0.8, 0.5)}
    <circle cx="50" cy="52" r="19.5" fill="none" stroke="#3a0004" stroke-width="2"/>
    <circle cx="50" cy="52" r="7.5" fill="${INK}"/>
    <ellipse cx="43.5" cy="45" rx="4.6" ry="3.4" fill="#ffffff" opacity=".95"/>
    <circle cx="57" cy="59" r="1.8" fill="#ffffff" opacity=".8"/>
    <path d="M6 52C22 27 78 27 94 52C78 37 22 37 6 52Z" fill="#000000" opacity=".2"/>
  </g>
  <path d="${E}" fill="none" ${O(2.2)}/>
  ${ln("M13 43C28 24 72 24 87 43", INK, 1.4, 0.7)}
  ${ln("M19 41L14.5 34.5M29 35.4L26.5 28M40.5 32L39.5 24.5M52.5 31.4L53.5 23.6M64.5 32.8L67.5 25.6M76 37.4L80.6 31.4M86 44.5L92 40", INK, 2)}
  ${ln("M26 66.5L24 70M38 70.5L37.4 74M62 70.5L62.6 74M74 66.5L76 70", INK, 1.2)}`;
};

P.sede = (a, k) => `${k.glow(56, 58, 46, a, 0.55)}
  <path d="M14 86C16 54 40 24 88 12C62 30 42 54 28 86Z" fill="${k.chrome("#c9d2d8")}" ${O(1.8)}/>
  ${hi("M20 80C24 56 44 32 80 16", 1.2, 0.8)}
  <path d="M28 86C34 72 40 62 48 52C44 60 40 66 37 74C35 79 32 84 28 86Z" fill="${mix(a, "#000000", 0.2)}" opacity=".85"/>
  <path d="M8 82L24 88L20 98L4 92Z" fill="${k.lin([[0, "#3a2a24"], [1, "#0a0604"]])}" ${O(1.5)}/>
  ${ln("M10 85L8 90M14 86.5L12 92M18 88L16 94", "#8a6a4a", 1)}
  <path d="M40 50c1.4 2.4 2.6 3.6 2.6 5a2.6 2.6 0 0 1 -5.2 0c0-1.4 1.2-2.6 2.6-5Z" fill="${a}" ${O(0.8)}/>
  <path d="M34 62c1 1.8 2 2.8 2 3.8a2 2 0 0 1 -4 0c0-1 1-2 2-3.8Z" fill="${a}" ${O(0.7)}/>
  <path d="M60 24C68 38 80 50 80 64C80 76 71 86 60 86C49 86 40 76 40 64C40 50 52 38 60 24Z" fill="${k.rad([[0, "#ff9a9a"], [0.45, a], [1, "#3a0004"]], 0.4, 0.55, 0.6, 0.35, 0.45)}" ${O(2)}/>
  ${hi("M50 60C50 52 53 46 56.5 41.5", 3, 0.8)}<circle cx="49.6" cy="66" r="1.6" fill="#ffffff" opacity=".75"/>
  <g fill="${a}"><circle cx="86" cy="80" r="2.2"/><circle cx="90" cy="72" r="1.3"/><circle cx="80" cy="90" r="1.5"/><circle cx="34" cy="94" r="1.2"/></g>`;

P.buda = (a, k) => {
  const pet = (len, w, rot, fill) => `<path transform="translate(50 78) rotate(${rot})" d="M0 0C${-w} ${f1(-len * 0.3)} ${f1(-w * 0.7)} ${f1(-len * 0.75)} 0 ${-len}C${f1(w * 0.7)} ${f1(-len * 0.75)} ${w} ${f1(-len * 0.3)} 0 0Z" fill="${fill}" ${O(1.4)}/>`;
  const back = k.lin([[0, "#fff4f8"], [1, mix(a, "#000000", 0.15)]]), front = k.lin([[0, "#ffe0ec"], [1, mix(a, "#b0306a", 0.55)]]);
  const rays = Array.from({ length: 36 }, (_, i) => { const [x1, y1] = pt(50, 44, 30, i * 10), [x2, y2] = pt(50, 44, i % 2 ? 36 : 40, i * 10); return `M${x1} ${y1}L${x2} ${y2}`; }).join("");
  return `${k.glow(50, 44, 46, "#ffd34a", 0.5)}
  ${ln(rays, GOLD, 1.2, 0.85)}
  <circle cx="50" cy="44" r="29" fill="none" stroke="${GOLD}" stroke-width="2"/>
  <circle cx="50" cy="44" r="25" fill="none" stroke="${GOLD}" stroke-width=".8" stroke-dasharray="2 3"/>
  <ellipse cx="50" cy="86" rx="42" ry="6" fill="${k.lin([[0, "#9fdcf0", 0.6], [1, "#3a8ab0", 0.4]])}"/>
  ${ln("M14 88C24 85 34 85 42 88M58 88C66 85 76 85 86 88", "#ffffff", 1.2, 0.8)}
  <path d="M18 84C10 84 6 88 10 91C14 94 26 93 28 89L20 87Z" fill="${k.tone("#3fa060")}" ${O(1.2)}/>
  <path d="M82 84C90 84 94 88 90 91C86 94 74 93 72 89L80 87Z" fill="${k.tone("#3fa060")}" ${O(1.2)}/>
  ${[-78, 78, -52, 52, -26, 26, 0].map((r) => pet(34, 9, r, back)).join("")}
  ${k.glow(50, 38, 14, "#ffe680", 0.9)}
  <path d="M50 24C54 30 56 34 56 38C56 42 53 45 50 45C47 45 44 42 44 38C44 34 46 30 50 24Z" fill="${k.lin([[0, "#ffffff"], [1, "#ffb020"]])}" ${O(1.2)}/>
  ${[-60, 60, -30, 30, 0].map((r) => pet(26, 9.5, r, front)).join("")}
  ${hi("M47 76C46 68 47 60 49 54", 1, 0.5)}
  ${spark(20, 24, 2.8)}${spark(82, 22, 2.8)}`;
};

P.dados = (a, k) => {
  const L = mix(a, "#ffffff", 0.55);
  const disk = (y) => `<path d="M30 ${y}V${y + 7}A20 6 0 0 0 70 ${y + 7}V${y}" fill="${a}" fill-opacity=".38" stroke="${L}" stroke-width="1.2"/><ellipse cx="50" cy="${y}" rx="20" ry="6" fill="${a}" fill-opacity=".5" stroke="${L}" stroke-width="1.2"/><circle cx="63" cy="${y + 8}" r="1.2" fill="#7dffb2"/><circle cx="58" cy="${y + 9}" r="1.2" fill="${L}"/>`;
  return `${k.glow(50, 34, 42, a, 0.6)}
  <path d="M22 62L34 10H66L78 62Z" fill="${k.lin([[0, L, 0], [1, L, 0.55]])}"/>
  ${disk(36)}${disk(25)}${disk(14)}
  <text font-family="Consolas, 'Courier New', monospace" font-size="5.5" fill="${L}"><tspan x="10" y="30">01</tspan><tspan x="82" y="22">10</tspan><tspan x="84" y="44">011</tspan><tspan x="8" y="48">1</tspan></text>
  <path d="M8 66C26 63 40 65 50 71C60 65 74 63 92 66V72C74 69 60 71 50 77C40 71 26 69 8 72Z" fill="${k.tone(mix(a, "#1a2a4a", 0.45))}" ${O(1.6)}/>
  <path d="M50 70C40 63 26 61 11 63V41C26 39 40 41 50 48Z" fill="${k.lin([[0, "#fffdf4"], [1, "#e0d2ac"]], 0, 0, 1, 0)}" ${O(1.5)}/>
  <path d="M50 70C60 63 74 61 89 63V41C74 39 60 41 50 48Z" fill="${k.lin([[0, "#d8caa4"], [1, "#fffdf4"]], 0, 0, 1, 0)}" ${O(1.5)}/>
  ${ln("M16 46C26 44.5 36 45.5 45 50M16 51C26 49.5 36 50.5 45 55M16 56C26 54.5 36 55.5 45 60M84 46C74 44.5 64 45.5 55 50M84 51C74 49.5 64 50.5 55 55M84 56C74 54.5 64 55.5 55 60", "#9a8a68", 0.9)}
  ${ln("M11 64.6C26 62.6 40 64.6 50 71.6M89 64.6C74 62.6 60 64.6 50 71.6", "#a89878", 0.8)}
  ${ln("M50 48V70", "#000000", 1.2, 0.3)}
  ${spark(18, 14, 2.6)}${spark(86, 8, 2.2)}`;
};

P.vontade = (a, k) => `
  <circle cx="76" cy="40" r="14" fill="${k.sphere("#ffc44a")}" opacity=".95"/>
  ${k.glow(76, 40, 26, "#ffb000", 0.5)}
  <path d="M46 92L72 50L98 92Z" fill="${k.lin([[0, "#9aaab8"], [1, "#4a5a6a"]], 0, 0, 1, 1)}" ${O(1.6)}/>
  <path d="M72 50L77 58L73 56L69 60L66 56Z" fill="#ffffff" ${O(1)}/>
  <path d="M2 92L40 22L54 42L64 32L98 92Z" fill="${k.lin([[0, "#b8a890"], [0.5, "#7a6a58"], [1, "#3a3028"]], 0, 0, 1, 1)}" ${O(1.8)}/>
  <path d="M40 22L54 42L64 32L98 92H62L50 62Z" fill="#000000" opacity=".22"/>
  <path d="M40 22L49.5 39L44.5 35.5L39.5 41.5L33.5 35Z" fill="${k.lin([[0, "#ffffff"], [1, "#cfdde8"]])}" ${O(1.2)}/>
  <path d="M64 32L70.5 43.5L66.5 41L62 44.5L58.5 40.5Z" fill="${k.lin([[0, "#ffffff"], [1, "#cfdde8"]])}" ${O(1.1)}/>
  ${ln("M40 22L36 48L30 62M54 42L52 56M64 32L68 52L74 70M22 70L30 62L36 74", "#2a2018", 1, 0.45)}
  ${tube("M40 23V3", "#c9a46a", 1.4, 0.8)}
  <path d="M40.6 3.5C48 1.5 54 7.5 62 5.5C58 9.5 58 13.5 62 17.5C54 19.5 48 13.5 40.6 15.5Z" fill="${k.lin([[0, mix(a, "#ffffff", 0.3)], [1, mix(a, "#000000", 0.4)]], 0, 0, 1, 1)}" ${O(1.4)}/>
  <path d="M50 6.6L53 9.6L50 12.6L47 9.6Z" fill="${k.metal(GOLD)}" ${O(0.7)}/>
  <path d="M4 80C4 74 12 72 16 76C18 70 28 70 30 76C34 74 40 78 38 82H6Z" fill="${k.lin([[0, "#ffffff"], [1, "#d8e2ea"]])}" stroke="#9aa8b4" stroke-width="1.2"/>
  <path d="M64 86C64 81 70 79 74 82C76 77 84 77 86 82C90 80 95 84 93 88H66Z" fill="${k.lin([[0, "#ffffff"], [1, "#d8e2ea"]])}" stroke="#9aa8b4" stroke-width="1.2"/>
  ${spark(24, 12, 2.6)}`;

P.shinobi = (a, k) => {
  const smoke = k.rad([[0, mix(a, "#ffffff", 0.75), 0.75], [1, mix(a, "#8a8aa0", 0.5), 0.15]]);
  return `
  <g fill="${smoke}"><circle cx="28" cy="72" r="15"/><circle cx="43" cy="80" r="12"/><circle cx="17" cy="84" r="10"/><circle cx="72" cy="22" r="11"/><circle cx="84" cy="30" r="8"/></g>
  <g transform="rotate(38 56 46)">
    ${tube("M56 7.5a5 5 0 1 1 -0.1 0", k.metal("#9aa8b0"), 2.4, 1)}
    <rect x="53" y="17" width="6" height="25" rx="1.4" fill="${k.lin([[0, "#3a2a3a"], [1, "#100810"]], 0, 0, 1, 0)}" ${O(1.3)}/>
    ${ln("M53 20L59 23.5M53 25L59 28.5M53 30L59 33.5M53 35L59 38.5", mix(a, "#ffffff", 0.2), 1.4)}
    <path d="M56 42C62.5 50 64.5 64 56 92C47.5 64 49.5 50 56 42Z" fill="${k.chrome("#c9d2d8")}" ${O(1.6)}/>
    ${ln("M56 45V86", "#5a6670", 1, 0.8)}
  </g>
  ${ln("M8 50C12 40 20 34 30 32M12 62C14 56 18 52 22 50", mix(a, "#ffffff", 0.3), 1.6, 0.85)}
  ${facetStar(4, 34, 58, 24, 7, "#a8b4bc", -70)}
  <circle cx="34" cy="58" r="3.8" fill="#efe2c0" ${O(1.2)}/>
  <circle cx="34" cy="58" r="9" fill="none" stroke="#5a6670" stroke-width=".8" opacity=".6"/>
  ${spark(80, 64, 2.8)}${spark(14, 26, 2.2)}`;
};

P.sentidos = (a, k) => {
  const L = mix(a, "#ffffff", 0.45);
  const waves = [0, 1, 2].map((i) => ln(`M${15 - i * 5} ${38 - i * 5}C${9 - i * 6} 48 ${9 - i * 6} 60 ${15 - i * 5} ${70 + i * 5}`, L, 2, 0.95 - i * 0.28) + ln(`M${85 + i * 5} ${38 - i * 5}C${91 + i * 6} 48 ${91 + i * 6} 60 ${85 + i * 5} ${70 + i * 5}`, L, 2, 0.95 - i * 0.28)).join("");
  const chev = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - (r % 2); c++) { const x = 41 + c * 6 + (r % 2) * 3, y = 64 + r * 6.5; chev.push(`M${x - 2} ${y}L${x} ${y + 2}L${x + 2} ${y}`); }
  const eye = (x) => `<circle cx="${x}" cy="46" r="10" fill="${k.rad([[0, mix(a, "#ffffff", 0.6)], [0.6, a], [1, mix(a, "#000000", 0.5)]])}" ${O(1.4)}/><circle cx="${x}" cy="46" r="10" fill="none" stroke="${GOLD}" stroke-width=".9"/><circle cx="${x}" cy="46" r="4.6" fill="${INK}"/><circle cx="${x - 3}" cy="43" r="2.2" fill="#ffffff"/><circle cx="${x + 2.6}" cy="49" r=".9" fill="#ffffff" opacity=".8"/>`;
  return `${k.glow(50, 50, 46, a, 0.45)}
  ${waves}
  ${tube("M8 92C30 88 70 88 92 90", k.lin([[0, "#a0703a"], [1, "#4e2a10"]]), 4, 1.2)}
  <path d="M50 22C31 22 22 40 22 58C22 77 35 90 50 90C65 90 78 77 78 58C78 40 69 22 50 22Z" fill="${k.lin([[0, "#b08458"], [1, "#4a2e1a"]], 0, 0, 1, 1)}" ${O(2)}/>
  <path d="M30 30L22 9L41 25Z" fill="${k.tone("#6a4a2e")}" ${O(1.5)}/>
  <path d="M70 30L78 9L59 25Z" fill="${k.tone("#6a4a2e")}" ${O(1.5)}/>
  <path d="M24 52C18 62 20 78 32 86C30 74 30 62 34 54Z" fill="${k.tone("#5a3a20")}" ${O(1.3)}/>
  <path d="M76 52C82 62 80 78 68 86C70 74 70 62 66 54Z" fill="${k.tone("#5a3a20")}" ${O(1.3)}/>
  ${ln("M25 62L30 66M24 70L30 74M26 78L31 81M75 62L70 66M76 70L70 74M74 78L69 81", "#2a1608", 0.9, 0.6)}
  <path d="M50 54C40 54 34 63 34 72C34 82 42 88 50 88C58 88 66 82 66 72C66 63 60 54 50 54Z" fill="${k.lin([[0, "#fbf0d8"], [1, "#c4a678"]])}" ${O(1.3)}/>
  ${ln(chev.join(""), "#7a5230", 1, 0.85)}
  <circle cx="38" cy="46" r="14.5" fill="${k.rad([[0, "#fbf2de"], [1, "#d8bc8e"]])}" ${O(1.2)}/>
  <circle cx="62" cy="46" r="14.5" fill="${k.rad([[0, "#fbf2de"], [1, "#d8bc8e"]])}" ${O(1.2)}/>
  ${eye(38)}${eye(62)}
  ${ln("M27 33L50 41L73 33", INK, 2)}
  <path d="M46 52L54 52L50 61Z" fill="${k.metal(GOLD)}" ${O(1.2)}/>
  ${ln("M39 89.5c0-2 1-3 2-3.5M43 90c0-2 .5-3.4 1.4-4M57 90c0-2-.5-3.4-1.4-4M61 89.5c0-2-1-3-2-3.5", "#c8901e", 1.4)}`;
};

P.mimico = (a, k) => {
  const face = "M0 -24C12 -24 20 -18 20 -4C20 12 12 24 0 26C-12 24 -20 12 -20 -4C-20 -18 -12 -24 0 -24Z";
  const comedy = `<path d="${face}" fill="${k.metal(GOLD)}" ${O(1.8)}/>
    <path d="M-13 -5C-9 -11 -4 -11 -2 -5C-5 -7.5 -10 -7.5 -13 -5Z" fill="${INK}"/><path d="M13 -5C9 -11 4 -11 2 -5C5 -7.5 10 -7.5 13 -5Z" fill="${INK}"/>
    ${ln("M-14 -12C-10 -16 -5 -16 -3 -14M14 -12C10 -16 5 -16 3 -14", INK, 1.2)}
    <path d="M-11 7C-6 17 6 17 11 7C6 11 -6 11 -11 7Z" fill="${INK}"/>
    ${ln("M-15 4C-14 8 -12 10 -10 11M15 4C14 8 12 10 10 11", INK, 0.9, 0.6)}
    ${hi("M-12 -18C-8 -21.5 -3 -22.5 2 -22", 1.6, 0.8)}`;
  const tragedy = `<path d="${face}" fill="${k.lin([[0, mix(a, "#ffffff", 0.35)], [1, mix(a, "#000000", 0.45)]])}" ${O(1.8)}/>
    <path d="M-13 -6C-9 -2 -4 -2 -2 -7C-5 -5 -10 -5 -13 -6Z" fill="${INK}"/><path d="M13 -6C9 -2 4 -2 2 -7C5 -5 10 -5 13 -6Z" fill="${INK}"/>
    ${ln("M-14 -10C-10 -14 -6 -15 -3 -15M14 -10C10 -14 6 -15 3 -15", INK, 1.2)}
    <path d="M-10 15C-6 7 6 7 10 15C6 12 -6 12 -10 15Z" fill="${INK}"/>
    <path d="M-8 0c.8 1.6 1.5 2.4 1.5 3.4a1.5 1.5 0 0 1 -3 0c0-1 .7-1.8 1.5-3.4Z" fill="#cfe8ff"/>
    ${hi("M-12 -18C-8 -21.5 -3 -22.5 2 -22", 1.6, 0.5)}`;
  return `${k.glow(50, 50, 46, a, 0.5)}
  ${tube("M74 60C82 70 80 82 90 90", k.tone(a), 2.4, 0.9)}${tube("M26 64C18 74 22 84 12 92", k.tone(GOLD), 2.4, 0.9)}
  <g transform="translate(63 44) rotate(14)">${tragedy}</g>
  <g transform="translate(38 54) rotate(-14)">${comedy}</g>
  ${spark(86, 16, 3)}${spark(14, 22, 2.6)}`;
};

P.dupla = (a, k) => {
  const g = "#3fcf7a", p = a;
  const left = "M50 14A36 36 0 0 0 50 86A18 18 0 0 0 50 50A18 18 0 0 1 50 14Z";
  const right = "M50 14A36 36 0 0 1 50 86A18 18 0 0 0 50 50A18 18 0 0 1 50 14Z";
  return `${k.glow(30, 50, 40, g, 0.4)}${k.glow(70, 50, 40, p, 0.4)}
  <path d="${tongues(50, 50, 36, 36, 9, 12, 100, 260, 3)}" fill="${g}" opacity=".75"/>
  <path d="${tongues(50, 50, 36, 36, 9, 12, -80, 80, 5)}" fill="${p}" opacity=".75"/>
  <path d="${tongues(50, 50, 36, 36, 9, 6, 110, 270, 9)}" fill="${mix(g, "#ffffff", 0.5)}" opacity=".7"/>
  <path d="${tongues(50, 50, 36, 36, 9, 6, -70, 90, 13)}" fill="${mix(p, "#ffffff", 0.5)}" opacity=".7"/>
  <path d="${left}" fill="${k.rad([[0, mix(g, "#ffffff", 0.55)], [1, mix(g, "#000000", 0.45)]], 0.35, 0.6, 0.7)}"/>
  <path d="${right}" fill="${k.rad([[0, mix(p, "#ffffff", 0.55)], [1, mix(p, "#000000", 0.45)]], 0.65, 0.4, 0.7)}"/>
  <circle cx="50" cy="32" r="5.4" fill="${k.sphere(g)}" ${O(1.2)}/>
  <circle cx="50" cy="68" r="5.4" fill="${k.sphere(p)}" ${O(1.2)}/>
  <path d="M50 14A18 18 0 0 0 50 50A18 18 0 0 1 50 86" fill="none" ${O(1.4)}/>
  <circle cx="50" cy="50" r="36" fill="none" stroke="${GOLD}" stroke-width="3"/>
  <circle cx="50" cy="50" r="37.6" fill="none" ${O(1)}/><circle cx="50" cy="50" r="34.4" fill="none" ${O(0.8)}/>
  ${hi("M24 32C28 24 36 18 44 16", 2, 0.6)}`;
};

P.regeneracao = (a, k) => {
  const H = "M50 88C24 70 12 56 12 40C12 28 21 19 32 19C40 19 46 24 50 30C54 24 60 19 68 19C79 19 88 28 88 40C88 56 76 70 50 88Z";
  const seam = "M50 30L45 42L54 50L46 60L53 70L50 87";
  return `${k.glow(50, 52, 48, a, 0.5)}
  <path d="${H}" fill="${k.rad([[0, "#ffb0b8"], [0.45, a], [1, mix(a, "#000000", 0.55)]], 0.4, 0.38, 0.65, 0.32, 0.3)}" ${O(2.2)}/>
  <ellipse cx="30" cy="34" rx="8" ry="5" fill="#ffffff" opacity=".6" transform="rotate(-35 30 34)"/>
  ${ln(seam, "#ffe680", 6, 0.35)}
  ${tube(seam, k.metal(GOLD), 2.6, 0.9)}
  ${ln("M45 42L38 44M54 50L62 47M46 60L40 64M53 70L60 72", GOLD, 1.2, 0.9)}
  ${tube("M50 30C50 24 52 18 56 12", "#3a9a52", 2, 0.9)}
  ${leaf(55, 15, 11, -40, k.tone("#4fcf86"))}${leaf(53, 20, 9, 200, k.tone("#4fcf86"))}${leaf(56, 12, 7, -95, k.tone("#7fe0a0"))}
  ${["M82 70h3v-3h2v3h3v2h-3v3h-2v-3h-3Z", "M14 66h2.4v-2.4h1.6v2.4h2.4v1.6h-2.4v2.4h-1.6v-2.4h-2.4Z", "M80 14h2v-2h1.4v2h2v1.4h-2v2h-1.4v-2h-2Z"].map((d) => `<path d="${d}" fill="#7fe0a0" stroke="#1a5a2a" stroke-width=".6"/>`).join("")}
  ${spark(22, 18, 2.8)}${spark(88, 44, 2.4)}`;
};

P.exorcista = (a, k) => {
  const beads = [];
  for (let i = 0; i < 28; i++) { const d = 98 + i * (344 / 28); const [x, y] = pt(50, 50, 41, d); beads.push(`<circle cx="${x}" cy="${y}" r="3.1" fill="${k.sphere("#8a5a2b")}" ${O(0.8)}/>`); }
  return `${k.glow(50, 50, 46, "#9fdcff", 0.35)}
  ${ln("M50 50m-41 0a41 41 0 1 0 82 0a41 41 0 1 0 -82 0", "#5a3a1a", 0.8, 0.6)}
  ${beads.join("")}
  <path d="M47 93L44.5 100H55.5L53 93Z" fill="${k.tone(a)}" ${O(1)}/>${ln("M47 95.5V100M50 95V100M53 95.5V100", mix(a, "#000000", 0.4), 0.7)}
  <circle cx="50" cy="91" r="4.6" fill="${k.sphere("#8a5a2b")}" ${O(1.1)}/>
  <g transform="rotate(-6 50 50)">
    <path d="M35 10H65V90H35Z" fill="${k.lin([[0, "#fffcec"], [1, "#e4d6ae"]], 0, 0, 1, 1)}" ${O(1.6)}/>
    <rect x="38" y="13" width="24" height="74" fill="none" stroke="${a}" stroke-width="1.3"/>
    <circle cx="50" cy="24" r="7" fill="${k.tone(a)}" ${O(1.1)}/>
    ${ln("M46.5 22H53.5M50 19V29M46.5 26.5L53.5 26.5", "#ffffff", 1.3)}
    <g font-family="'Yu Mincho', 'MS Mincho', 'Hiragino Mincho ProN', 'Noto Serif CJK JP', serif" font-weight="bold" font-size="12" text-anchor="middle" fill="${INK}">
      <text x="50" y="45">悪</text><text x="50" y="58.5">霊</text><text x="50" y="72">退</text><text x="50" y="85.5">散</text>
    </g>
  </g>
  <path d="M74 64C70 56 76 50 74 42C80 48 82 56 79 64ZM80 52C80 46 84 43 83 37C87 42 87 48 84 52Z" fill="${k.lin([[0, "#ffffff", 0.9], [1, "#8fd8ff", 0.5]])}"/>
  ${spark(80, 30, 2.6, "#e8f6ff")}${spark(86, 44, 1.8, "#e8f6ff")}${spark(18, 24, 2.4)}`;
};

P.maquinas = (a, k) => {
  const big = gearPath(42, 56, 12, 28.5, 22.5, 0, Array.from({ length: 6 }, (_, i) => [...pt(42, 56, 13.5, i * 60 + 30), 3.6]));
  const small = gearPath(75, 27, 9, 16, 12, 11, Array.from({ length: 4 }, (_, i) => [...pt(75, 27, 7, i * 90 + 45), 2]));
  const L = mix(a, "#ffffff", 0.5);
  return `${k.glow(50, 50, 46, a, 0.45)}
  ${ln("M84 44V58H94M90 58V70H80M8 30H20L26 24M12 38H18", L, 1.4, 0.9)}
  ${[[94, 58], [80, 70], [26, 24], [18, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${L}" ${O(0.6)}/>`).join("")}
  ${tube("M62 76L84 95", k.chrome("#b8c4cc"), 5, 1.3)}
  <path d="M55 69.5a9 9 0 1 0 14.5 -1.5l-5.5 5.5-4.2-4.2 5.5-5.5a9 9 0 0 0 -10.3 5.7Z" fill="${k.chrome("#b8c4cc")}" ${O(1.4)}/>
  <path d="${big}" fill="${k.metal("#a8b4bc")}" fill-rule="evenodd" ${O(1.8)}/>
  <circle cx="42" cy="56" r="19" fill="none" stroke="#5a6670" stroke-width="1" opacity=".7"/>
  <circle cx="42" cy="56" r="7" fill="${k.sphere(GOLD)}" ${O(1.4)}/><circle cx="42" cy="56" r="2.4" fill="${INK}"/>
  <path d="${small}" fill="${k.metal(GOLD)}" fill-rule="evenodd" ${O(1.6)}/>
  <circle cx="75" cy="27" r="3.6" fill="${k.sphere("#9aa8b0")}" ${O(1.1)}/>
  ${hi("M22 46C25 38 32 32 40 30", 1.8, 0.6)}
  ${spark(62, 40, 3.2)}${spark(88, 12, 2.2)}${spark(14, 82, 2.2)}`;
};

P.animais = (a, k) => {
  const lf = k.tone("#4fbf6a");
  return `${k.glow(50, 50, 46, a, 0.35)}
  ${tube("M4 72C26 70 50 64 96 58", k.lin([[0, "#a0703a"], [1, "#4e2a10"]]), 4.4, 1.2)}
  ${tube("M72 61C78 54 82 50 90 48", k.lin([[0, "#a0703a"], [1, "#4e2a10"]]), 2.2, 1)}
  ${leaf(12, 72, 12, 150, lf)}${leaf(22, 71, 11, 115, lf)}${leaf(84, 50, 11, -30, lf)}${leaf(90, 48, 9, 20, lf)}${leaf(88, 58, 10, 30, lf)}
  <path d="M32 58L10 49L14 62L30 66Z" fill="${k.tone("#6a5a4e")}" ${O(1.4)}/>
  ${ln("M14 52L28 59M12 57L28 62", "#2a2018", 0.8, 0.5)}
  <path d="M30 60C34 46 50 40 62 44C72 48 74 60 66 68C58 76 40 76 30 60Z" fill="${k.lin([[0, "#a89888"], [1, "#4a3e36"]], 0, 0, 1, 1)}" ${O(1.8)}/>
  <path d="M60 47C70 52 71 63 63 70C58 63 58 54 60 47Z" fill="${k.tone(a)}" ${O(1.2)}/>
  <path d="M38 54C48 48 60 52 62 60C54 66 44 66 38 54Z" fill="${k.tone("#5a4a40")}" ${O(1.3)}/>
  ${ln("M44 56C50 55 55 57 58 60M42 59C48 59 53 61 56 63", "#1a1410", 0.8, 0.6)}
  <circle cx="66" cy="40" r="11" fill="${k.lin([[0, "#b0a090"], [1, "#5a4c42"]], 0, 0, 1, 1)}" ${O(1.8)}/>
  <path d="M60 46C64 50 70 50 74 46C72 50 66 52 60 46Z" fill="${k.tone(a)}"/>
  <path d="M76 38L87 41.5L76 45Z" fill="${k.metal(GOLD)}" ${O(1.2)}/>
  <circle cx="69" cy="38" r="2.6" fill="${INK}"/><circle cx="68" cy="37" r=".9" fill="#ffffff"/>
  ${hi("M59 33C61 30.5 64 29.4 67 29.6", 1.4, 0.6)}
  ${ln("M46 73L44 79M52 73L52 79M42 79h5M49 79h6", "#c8901e", 1.4)}
  <path d="M80 22C76 18 72 20 74 24C75 26 78 27 80 30C82 27 85 26 86 24C88 20 84 18 80 22Z" fill="${k.sphere("#e84a5a")}" ${O(1)}/>
  ${spark(30, 26, 2.6)}${spark(92, 34, 2)}`;
};

P.carisma = (a, k) => {
  const mask = "M8 44C14 34 30 32 42 40C46 42 48 44 50 44C52 44 54 42 58 40C70 32 86 34 92 44C94 58 84 70 70 70C60 70 54 62 50 58C46 62 40 70 30 70C16 70 6 58 8 44Z";
  const horn = "M30 38C25 28 25 15 34 5C32.5 17 36 27 41 35Z";
  const hornG = k.lin([[0, "#5a4a52"], [1, "#120a0e"]], 0, 0, 1, 0);
  return `${k.glow(50, 50, 48, a, 0.5)}
  <path d="${tongues(50, 52, 40, 16, 12, 10, 180, 360, 21)}" fill="${mix(a, "#5a10a0", 0.4)}" opacity=".4"/>
  <path d="${horn}" fill="${hornG}" ${O(1.6)}/><path d="${horn}" transform="translate(100 0) scale(-1 1)" fill="${hornG}" ${O(1.6)}/>
  ${ln("M29 30L36 31M28.4 24L34.6 25M29 18L33.6 19M71 30L64 31M71.6 24L65.4 25M71 18L66.4 19", "#8a7a82", 0.8, 0.7)}
  <path d="${mask}" fill="${k.lin([[0, mix(a, "#ffffff", 0.25)], [0.5, a], [1, mix(a, "#000000", 0.55)]])}" ${O(2)}/>
  <path d="${mask}" transform="translate(50 52) scale(.9) translate(-50 -52)" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
  ${ln("M14 58C18 62 22 63 26 62M86 58C82 62 78 63 74 62M46 52C48 54 52 54 54 52", GOLD, 1.1)}
  <path d="M20 50C24 44 34 44 40 50C34 56 24 56 20 50Z" fill="${INK}" ${O(1.2)}/>
  <path d="M60 50C66 44 76 44 80 50C76 56 66 56 60 50Z" fill="${INK}" ${O(1.2)}/>
  ${k.glow(30, 50, 6, "#ff3a2a", 0.95)}${k.glow(70, 50, 6, "#ff3a2a", 0.95)}
  <ellipse cx="30" cy="50" rx="2.2" ry="1.6" fill="#ffd0a0"/><ellipse cx="70" cy="50" rx="2.2" ry="1.6" fill="#ffd0a0"/>
  <path d="M50 38L53 42L50 46L47 42Z" fill="${k.tone("#9b5fc0")}" ${O(1)}/>
  ${hi("M14 42C20 37 30 36 38 40", 1.6, 0.55)}
  ${spark(86, 20, 2.6)}${spark(14, 76, 2)}`;
};

P.mira = (a, k) => {
  const rings = [[40, "#fffaf0"], [32, a], [24, "#fffaf0"], [16, a], [8, GOLD]];
  const E = [86, 14], u = [0.7071, -0.7071], v = [0.7071, 0.7071];
  const at = (s, t) => [f1(E[0] - u[0] * s + v[0] * t), f1(E[1] - u[1] * s + v[1] * t)];
  const f1a = [at(0, 0), at(-4, -7), at(10, -7), at(14, 0)], f2a = [at(0, 0), at(-4, 7), at(10, 7), at(14, 0)];
  return `${k.glow(48, 52, 46, a, 0.35)}
  ${shadow(48, 95, 30, 3)}
  ${rings.map(([r, c]) => `<circle cx="48" cy="52" r="${r}" fill="${c === GOLD ? k.sphere(GOLD) : c === a ? k.tone(a) : k.lin([[0, "#ffffff"], [1, "#e4d8bc"]])}" ${O(1.6)}/>`).join("")}
  ${ln(Array.from({ length: 24 }, (_, i) => { const [x1, y1] = pt(48, 52, 33, i * 15), [x2, y2] = pt(48, 52, 39, i * 15); return `M${x1} ${y1}L${x2} ${y2}`; }).join(""), "#b8a888", 0.7, 0.6)}
  ${ln("M44 48L38 42M53 49L58 44M46 57L41 62M52 57L57 61", INK, 1.1, 0.7)}
  ${tube(`M48 52L${E}`, k.lin([[0, "#e8d4a8"], [1, "#8a6a3a"]]), 2.6, 1)}
  <path d="M${f1a.join("L")}Z" fill="${k.tone(a)}" ${O(1.2)}/>
  <path d="M${f2a.join("L")}Z" fill="${k.lin([[0, "#ffffff"], [1, "#d8ccb0"]])}" ${O(1.2)}/>
  ${ln("M66 30L60 24M72 24L66 18M62 36L56 30", mix(a, "#ffffff", 0.3), 1.2, 0.8)}
  <circle cx="48" cy="52" r="3" fill="${INK}"/>
  ${spark(22, 20, 3)}${spark(84, 76, 2.4)}`;
};

module.exports = { P, kit, mix, hashStr, rng };
