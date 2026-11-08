// Gera as ilustrações próprias (SVG) que substituem as imagens do mangá/anime.
// Uso:  node ferramentas/gerar-ilustracoes.js
// Saída: ferramentas/ilustracoes-svg/<doc>-imageN.svg  (mesmo nome da imagem original que substitui)
// Depois rode  node ferramentas/pixelar-ilustracoes.js  para gerar os PNGs usados pelo site.

const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "ilustracoes-svg");
fs.mkdirSync(OUT, { recursive: true });

/* ---------- Símbolos (desenhados em ferramentas/simbolos.js) ---------- */
const { P, kit, mix, hashStr, rng } = require("./simbolos.js");

/* ---------- Utilidades ---------- */
const pol = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [(cx + r * Math.cos(a)).toFixed(1), (cy + r * Math.sin(a)).toFixed(1)];
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/* Definições comuns (gradientes, filtros) */
function defs(id, { accent, bg1, bg2 }) {
  return `
  <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
  <radialGradient id="${id}glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${mix(accent, "#ffffff", 0.25)}" stop-opacity=".75"/><stop offset=".45" stop-color="${accent}" stop-opacity=".28"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${id}vig" cx="50%" cy="50%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
  <linearGradient id="${id}gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d0"/><stop offset=".3" stop-color="#f1cf6a"/><stop offset=".52" stop-color="#a8740f"/><stop offset=".7" stop-color="#e9c25a"/><stop offset="1" stop-color="#8a5c0a"/></linearGradient>
  <linearGradient id="${id}goldh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2b33c" stop-opacity="0"/><stop offset=".2" stop-color="#e2b33c"/><stop offset=".8" stop-color="#e2b33c"/><stop offset="1" stop-color="#e2b33c" stop-opacity="0"/></linearGradient>
  <radialGradient id="${id}parch" cx="42%" cy="36%" r="70%"><stop offset="0" stop-color="#fffbef"/><stop offset=".6" stop-color="#f1e4c0"/><stop offset="1" stop-color="#cdb27a"/></radialGradient>
  <radialGradient id="${id}inner" cx="50%" cy="50%" r="50%"><stop offset=".72" stop-color="#5a3c10" stop-opacity="0"/><stop offset="1" stop-color="#5a3c10" stop-opacity=".45"/></radialGradient>
  <linearGradient id="${id}gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="${id}ray" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <filter id="${id}blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="${id}blur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="${id}shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#2a1a04" flood-opacity=".45"/></filter>
  <filter id="${id}deep" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".6"/></filter>
  <filter id="${id}grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/></filter>
  <filter id="${id}paper"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .3  0 0 0 0 .1  0 0 0 .35 0"/></filter>`;
}

/* Aura em chamas ao redor do medalhão */
function flames(cx, cy, R, len, accent, rnd, n) {
  const one = (r0, extra, wMul) => Array.from({ length: n }, (_, i) => {
    const a = (i * 360) / n + (rnd() - 0.5) * 10;
    const w = (5 + rnd() * 4) * wMul, bend = (rnd() - 0.5) * 14;
    const r1 = r0 + len * (0.55 + rnd() * 0.6) + extra;
    const L = pol(cx, cy, r0, a - w), T = pol(cx, cy, r1, a + bend), Rr = pol(cx, cy, r0, a + w);
    const C1 = pol(cx, cy, r0 + (r1 - r0) * 0.55, a - w * 0.5 + bend * 0.3);
    const C2 = pol(cx, cy, r0 + (r1 - r0) * 0.55, a + w * 0.5 + bend * 0.3);
    return `M${L}Q${C1} ${T}Q${C2} ${Rr}Z`;
  }).join("");
  return { outer: one(R - 6, 0, 1.3), inner: one(R - 6, -len * 0.35, 0.8) };
}

/* Partículas e brilhos */
function sparks(W, H, accent, rnd, count, avoid) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const x = rnd() * W, y = rnd() * H;
    if (avoid && Math.hypot(x - avoid.cx, y - avoid.cy) < avoid.r) continue;
    const r = 0.6 + rnd() * 1.8, o = (0.25 + rnd() * 0.6).toFixed(2);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${rnd() < 0.6 ? mix(accent, "#ffffff", 0.5) : "#f5d77a"}" opacity="${o}"/>`;
  }
  for (let i = 0; i < 5; i++) {
    const x = rnd() * W, y = rnd() * H, k = 3 + rnd() * 5;
    if (avoid && Math.hypot(x - avoid.cx, y - avoid.cy) < avoid.r + 10) continue;
    s += `<path d="M${x} ${y - k}Q${x} ${y} ${x + k} ${y}Q${x} ${y} ${x} ${y + k}Q${x} ${y} ${x - k} ${y}Q${x} ${y} ${x} ${y - k}Z" fill="#fff6d0" opacity=".8"/>`;
  }
  return s;
}

/* Medalhão: aro dourado, gemas, pergaminho texturizado, pictograma e brilho de vidro */
function medallion(id, cx, cy, R, accent, picSvg, picScale, bg2) {
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const [x, y] = pol(cx, cy, R - 4, i * 7.5);
    return `<circle cx="${x}" cy="${y}" r="${i % 4 ? 0.9 : 1.6}" fill="#5a3c06" opacity=".75"/>`;
  }).join("");
  const gems = [0, 90, 180, 270].map((d) => {
    const [x, y] = pol(cx, cy, R - 4, d - 90);
    const g = R * 0.075;
    return `<circle cx="${x}" cy="${y}" r="${g + 1.6}" fill="url(#${id}gold)" stroke="#5a3c06" stroke-width="1"/>
      <circle cx="${x}" cy="${y}" r="${g}" fill="${accent}"/><circle cx="${(+x - g * 0.35).toFixed(1)}" cy="${(+y - g * 0.35).toFixed(1)}" r="${(g * 0.35).toFixed(1)}" fill="#fff" opacity=".8"/>`;
  }).join("");
  const ri = R - 11, ps = 100 * picScale;
  return `
  <g filter="url(#${id}deep)"><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${id}gold)"/></g>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#fff6d0" stroke-opacity=".5" stroke-width="1"/>
  <circle cx="${cx}" cy="${cy}" r="${R - 8}" fill="${bg2}" stroke="#5a3c06" stroke-width="1"/>
  ${ticks}
  <clipPath id="${id}clip"><circle cx="${cx}" cy="${cy}" r="${ri}"/></clipPath>
  <g clip-path="url(#${id}clip)">
    <rect x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" fill="url(#${id}parch)"/>
    <rect x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" filter="url(#${id}paper)" opacity=".55"/>
    <circle cx="${cx}" cy="${cy}" r="${ri * 0.86}" fill="none" stroke="${accent}" stroke-opacity=".28" stroke-width="${R * 0.05}"/>
    <circle cx="${cx}" cy="${cy}" r="${ri * 0.93}" fill="none" stroke="#8a6a1a" stroke-opacity=".55" stroke-width="1" stroke-dasharray="2 4"/>
    <g filter="url(#${id}shadow)"><g transform="translate(${(cx - ps / 2).toFixed(1)} ${(cy - ps / 2 + R * 0.02).toFixed(1)}) scale(${picScale})">${picSvg}</g></g>
    <circle cx="${cx}" cy="${cy}" r="${ri}" fill="url(#${id}inner)"/>
    <ellipse cx="${cx}" cy="${cy - ri * 0.52}" rx="${ri * 0.78}" ry="${ri * 0.45}" fill="url(#${id}gloss)" opacity=".38"/>
  </g>
  <circle cx="${cx}" cy="${cy}" r="${ri}" fill="none" stroke="url(#${id}gold)" stroke-width="2.5"/>
  ${gems}`;
}

/* Círculo rúnico (anéis, marcações e texto circular) */
function runeCircle(id, cx, cy, rText, rTicks, accent, withText, fontSize) {
  const light = mix(accent, "#ffffff", 0.55);
  const ticks = Array.from({ length: 96 }, (_, i) => {
    const long = i % 8 === 0;
    const [x1, y1] = pol(cx, cy, rTicks, i * 3.75), [x2, y2] = pol(cx, cy, rTicks + (long ? 9 : 4), i * 3.75);
    return `M${x1} ${y1}L${x2} ${y2}`;
  }).join("");
  const circ = 2 * Math.PI * rText;
  const txt = "ASSOCIAÇÃO DOS CAÇADORES ✦ ARQUIVO CLASSIFICADO ✦ ";
  return `
  <circle cx="${cx}" cy="${cy}" r="${rTicks}" fill="none" stroke="${light}" stroke-opacity=".45" stroke-width="1"/>
  <path d="${ticks}" stroke="${light}" stroke-opacity=".45" stroke-width="1.2"/>
  <circle cx="${cx}" cy="${cy}" r="${rTicks + 14}" fill="none" stroke="${light}" stroke-opacity=".25" stroke-width="1" stroke-dasharray="1 5"/>
  ${withText ? `<path id="${id}tp" d="M${cx - rText} ${cy}a${rText} ${rText} 0 1 1 ${2 * rText} 0a${rText} ${rText} 0 1 1 ${-2 * rText} 0" fill="none"/>
  <circle cx="${cx}" cy="${cy}" r="${rText - fontSize * 0.9}" fill="none" stroke="${light}" stroke-opacity=".3" stroke-width=".8"/>
  <text font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" letter-spacing="2" fill="${light}" fill-opacity=".6"><textPath href="#${id}tp" xlink:href="#${id}tp" textLength="${circ.toFixed(1)}" lengthAdjust="spacing">${txt + txt}</textPath></text>` : ""}`;
}

/* Cantoneiras art déco */
function corners(id, W, H, m) {
  const c = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 30}V${y}H${x + sx * 30}" fill="none" stroke="url(#${id}gold)" stroke-width="2"/>
    <path d="M${x + sx * 6} ${y + sy * 18}V${y + sy * 6}H${x + sx * 18}" fill="none" stroke="#e2b33c" stroke-opacity=".6" stroke-width="1"/>
    <path d="M${x} ${y - 4}l4 4-4 4-4-4z" fill="#f5d77a"/>`;
  return c(m, m, 1, 1) + c(W - m, m, -1, 1) + c(m, H - m, 1, -1) + c(W - m, H - m, -1, -1) +
    `<rect x="${m - 4}" y="${m - 4}" width="${W - 2 * m + 8}" height="${H - 2 * m + 8}" fill="none" stroke="#e2b33c" stroke-opacity=".35" stroke-width="1"/>`;
}

/* Raios de luz */
function rays(cx, cy, n, len, id, rnd) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i * 360) / n + rnd() * 4, w = 1.5 + rnd() * 3;
    const [x1, y1] = pol(cx, cy, len, a - w), [x2, y2] = pol(cx, cy, len, a + w);
    return `M${cx} ${cy}L${x1} ${y1}L${x2} ${y2}Z`;
  }).join("");
}

/* ---------- Faixa (banner) 760x320 ---------- */
let uid = 0;
function banner(name, { pic, accent, bg1, bg2, kicker = "", title = "", sub = "", glyph = "" }) {
  const id = "b" + uid++;
  const W = 760, H = 320, cx = 196, cy = 160, R = 100;
  const rnd = rng(hashStr(name));
  const sk = kit(id + "k"), picSvg = P[pic](accent, sk);
  const fl = flames(cx, cy, R, 46, accent, rnd, 22);
  const light = mix(accent, "#ffffff", 0.5);

  // Título: quebra em duas linhas se for longo
  let lines = [title];
  if (title.length > 12 && title.includes(" ")) {
    const sp = [...title].map((c, i) => (c === " " ? i : -1)).filter((i) => i > 0);
    const mid = sp.reduce((b, i) => (Math.abs(i - title.length / 2) < Math.abs(b - title.length / 2) ? i : b), sp[0]);
    lines = [title.slice(0, mid), title.slice(mid + 1)];
  }
  const longest = Math.max(...lines.map((l) => l.length));
  const tx = 384, maxW = 340;
  const size = Math.min(64, Math.floor(maxW / (longest * 0.86)));
  const lineH = size * 1.02;
  const blockH = 16 + 14 + lines.length * lineH + 18 + (sub ? 34 : 0);
  let y = cy - blockH / 2 + 12;
  const kick = `<text x="${tx}" y="${y}" font-family="Tahoma, Verdana, sans-serif" font-size="13" font-weight="bold" letter-spacing="5" fill="${light}">${esc(kicker)}</text>
    <path d="M${tx} ${y + 9}h46" stroke="${accent}" stroke-width="3"/>`;
  y += 14 + 8;
  let titleSvg = "";
  for (const l of lines) {
    y += lineH * 0.86;
    titleSvg += `<text x="${tx}" y="${y.toFixed(1)}" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="${size}" letter-spacing="1"
      fill="url(#${id}gold)" stroke="#2a1a04" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(l)}</text>`;
    y += lineH * 0.14;
  }
  const divW = Math.min(maxW, Math.max(180, longest * size * 0.8));
  y += 14;
  const divider = `<path d="M${tx} ${y}H${tx + divW}" stroke="url(#${id}goldh)" stroke-width="1.5"/>
    <path d="M${tx + divW / 2} ${y - 5}l5 5-5 5-5-5z" fill="#f5d77a" stroke="#5a3c06" stroke-width=".8"/>
    <circle cx="${tx + divW / 2 - 14}" cy="${y}" r="1.8" fill="#f5d77a"/><circle cx="${tx + divW / 2 + 14}" cy="${y}" r="1.8" fill="#f5d77a"/>`;
  const subSvg = sub ? `<text x="${tx}" y="${y + 30}" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="22" fill="#f3e7c8" fill-opacity=".88">${esc(sub)}</text>` : "";

  const watermark = glyph
    ? `<text x="${W - 118}" y="${H - 48}" text-anchor="middle" font-size="230" font-weight="bold" fill="${accent}" fill-opacity=".13" font-family="'Yu Mincho', 'MS Mincho', 'Noto Serif CJK JP', 'Hiragino Mincho ProN', serif">${glyph}</text>`
    : `<g transform="translate(${W - 120} ${H / 2}) rotate(12)" opacity=".1"><path d="M0 -120L16 -16 120 0 16 16 0 120-16 16-120 0-16-16Z" fill="${accent}"/><circle r="70" fill="none" stroke="${accent}" stroke-width="3"/></g>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${defs(id, { accent, bg1, bg2 })}${sk.defs.join("")}</defs>
<rect width="${W}" height="${H}" fill="url(#${id}bg)"/>
<path d="${rays(cx, cy, 30, 900, id, rnd)}" fill="#fff" fill-opacity=".045"/>
<ellipse cx="${cx}" cy="${cy}" rx="300" ry="230" fill="url(#${id}glow)"/>
<ellipse cx="${W - 150}" cy="${cy}" rx="260" ry="160" fill="${accent}" opacity=".07"/>
${watermark}
${sparks(W, H, accent, rnd, 70, { cx, cy, r: R + 20 })}
${runeCircle(id, cx, cy, 136, 112, accent, true, 9.5)}
<path d="${fl.outer}" fill="${accent}" opacity=".7" filter="url(#${id}blur)"/>
<path d="${fl.inner}" fill="${mix(accent, "#ffffff", 0.55)}" opacity=".8" filter="url(#${id}blur2)"/>
${medallion(id, cx, cy, R, accent, picSvg, 1.5, bg2)}
${kick}${titleSvg}${divider}${subSvg}
<rect width="${W}" height="${H}" filter="url(#${id}grain)"/>
<rect width="${W}" height="${H}" fill="url(#${id}vig)"/>
${corners(id, W, H, 14)}
<text x="${W - 26}" y="${H - 22}" text-anchor="end" font-family="Tahoma, Verdana, sans-serif" font-size="9" letter-spacing="3" fill="#fff" fill-opacity=".35">HUNTER OS · ARQUIVO Nº ${String(hashStr(name) % 900 + 100)}</text>
</svg>`;
}

/* ---------- Carta 260x260 (tipos de Caçador) ---------- */
function card(name, { pic, accent, bg1, bg2 }) {
  const id = "c" + uid++;
  const W = 260, H = 260, cx = 130, cy = 128, R = 74;
  const rnd = rng(hashStr(name));
  const sk = kit(id + "k"), picSvg = P[pic](accent, sk);
  const fl = flames(cx, cy, R, 30, accent, rnd, 18);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${defs(id, { accent, bg1, bg2 })}${sk.defs.join("")}</defs>
<rect width="${W}" height="${H}" fill="url(#${id}bg)"/>
<path d="${rays(cx, cy, 24, 400, id, rnd)}" fill="#fff" fill-opacity=".05"/>
<circle cx="${cx}" cy="${cy}" r="140" fill="url(#${id}glow)"/>
${sparks(W, H, accent, rnd, 34, { cx, cy, r: R + 14 })}
${runeCircle(id, cx, cy, 0, 96, accent, false, 0)}
<path d="${fl.outer}" fill="${accent}" opacity=".7" filter="url(#${id}blur)"/>
<path d="${fl.inner}" fill="${mix(accent, "#ffffff", 0.55)}" opacity=".8" filter="url(#${id}blur2)"/>
${medallion(id, cx, cy, R, accent, picSvg, 1.14, bg2)}
<rect width="${W}" height="${H}" filter="url(#${id}grain)"/>
<rect width="${W}" height="${H}" fill="url(#${id}vig)"/>
${corners(id, W, H, 12)}
</svg>`;
}

/* ---------- Mapeamento: imagem original → ilustração ---------- */
const NEN = (pic, accent, glyph, kicker, title, sub = "") => ({ type: "banner", pic, accent, glyph, kicker, title, sub, bg1: "#0d3528", bg2: "#04110c" });
const LIST = {
  "nen-image3": NEN("ten", "#4fcf86", "纏", "PRINCÍPIO DO NEN", "TEN", "Envelopar"),
  "nen-image4": NEN("zetsu", "#7f97a8", "絶", "PRINCÍPIO DO NEN", "ZETSU", "Suprimir"),
  "nen-image5": NEN("ren", "#e0573a", "練", "PRINCÍPIO DO NEN", "REN", "Refinar"),
  "nen-image6": NEN("hatsu", "#e2b33c", "発", "PRINCÍPIO DO NEN", "HATSU", "Liberar"),
  "nen-image8": NEN("reforco", "#2fa84f", "強", "CATEGORIA DE NEN", "REFORÇO"),
  "nen-image9": NEN("transmutacao", "#a24cc4", "変", "CATEGORIA DE NEN", "TRANSMUTAÇÃO"),
  "nen-image10": NEN("emissao", "#f2c12e", "放", "CATEGORIA DE NEN", "EMISSÃO"),
  "nen-image11": NEN("conjuracao", "#e0353a", "具", "CATEGORIA DE NEN", "CONJURAÇÃO"),
  "nen-image12": NEN("manipulacao", "#a9b0b4", "操", "CATEGORIA DE NEN", "MANIPULAÇÃO"),
  "nen-image13": NEN("especializacao", "#2f86d6", "特", "CATEGORIA DE NEN", "ESPECIALIZAÇÃO"),
};
const HUNTERS = ["beast", "blacklist", "botanical", "card", "crime", "cute", "disease", "gourmet", "hacker", "head", "jackpot",
  "lost", "music", "paleograph", "poacher", "poison", "ruins", "sea", "terrorist", "treasure", "rookie"];
const HUNTER_COLORS = {
  beast: "#c98a3c", blacklist: "#d23a45", botanical: "#4fbf6a", card: "#d23a45", crime: "#5aa0d6", cute: "#f08ab8", disease: "#e0353a",
  gourmet: "#e2913c", hacker: "#3ddc84", head: "#9b7be0", jackpot: "#e2b33c", lost: "#d23a45", music: "#7b8cf0", paleograph: "#b07a3b",
  poacher: "#2f8a5c", poison: "#7ad04a", ruins: "#c9a46a", sea: "#3aa6d6", terrorist: "#e0353a", treasure: "#3fd0e0", rookie: "#4fcf86",
};
HUNTERS.forEach((h, i) => {
  const a = HUNTER_COLORS[h];
  LIST[`manual-image${i + 3}`] = { type: "card", pic: h, accent: a, bg1: mix(a, "#0d3528", 0.72), bg2: "#050f0b" };
});
const FAM = (pic, accent, bg1, bg2, title) => ({ type: "banner", pic, accent, bg1, bg2, kicker: "FAMÍLIA IMPORTANTE", title });
Object.assign(LIST, {
  "familias-image3": FAM("geil", "#6fd36f", "#143a30", "#04100c", "GEIL"),
  "familias-image4": FAM("zecche", "#d98a3c", "#352a14", "#0d0904", "ZECCHE"),
  "familias-image5": FAM("agrippa", "#d03a44", "#32161a", "#0c0405", "AGRIPPA"),
  "familias-image6": FAM("zoldyck", "#b8c4cc", "#222a30", "#050708", "ZOLDYCK"),
  "familias-image7": FAM("huiguorou", "#e0403a", "#401812", "#120403", "HUI GUO ROU"),
  "familias-image8": FAM("sunny", "#f08a2c", "#402e10", "#120c03", "SUNNY"),
});
const AQ = (pic, accent, title) => ({ type: "banner", pic, accent, title, kicker: "AQUISIÇÃO HUNTER", bg1: mix(accent, "#1f1630", 0.75), bg2: "#07050d" });
Object.assign(LIST, {
  "aquisicoes-image3": AQ("prodigio", "#f2c12e", "PRODÍGIO"),
  "aquisicoes-image4": AQ("genialidade", "#5aa0d6", "GENIALIDADE"),
  "aquisicoes-image5": AQ("olhos", "#e0262e", "OLHOS ESCARLATES"),
  "aquisicoes-image6": AQ("sede", "#d0202c", "SEDE DE SANGUE"),
  "aquisicoes-image7": AQ("buda", "#f2a6c0", "ILUMINADO DE BUDA"),
  "aquisicoes-image8": AQ("dados", "#3a86c8", "BANCO DE DADOS"),
  "aquisicoes-image9": AQ("vontade", "#d23a45", "VONTADE INABALÁVEL"),
  "aquisicoes-image10": AQ("shinobi", "#9b5fc0", "SHINOBI"),
  "aquisicoes-image11": AQ("sentidos", "#3fb0a0", "SENTIDOS AGUÇADOS"),
  "aquisicoes-image12": AQ("mimico", "#8e6bd6", "MÍMICO DE NEN"),
  "aquisicoes-image13": AQ("dupla", "#c070e0", "DUPLA AFINIDADE"),
  "aquisicoes-image14": AQ("regeneracao", "#e04a5a", "REGENERAÇÃO ACELERADA"),
  "aquisicoes-image15": AQ("exorcista", "#c9302c", "EXORCISTA DE NEN"),
  "aquisicoes-image16": AQ("maquinas", "#3a9a7a", "MESTRE DAS MÁQUINAS"),
  "aquisicoes-image17": AQ("animais", "#e08a3c", "AMIGO DOS ANIMAIS"),
  "aquisicoes-image18": AQ("carisma", "#c0202c", "CARISMA DIABÓLICO"),
  "aquisicoes-image19": AQ("mira", "#d23a45", "MIRA PERFEITA"),
});

for (const [name, cfg] of Object.entries(LIST)) {
  if (!P[cfg.pic]) throw new Error("Pictograma desconhecido: " + cfg.pic);
  const svg = cfg.type === "card" ? card(name, cfg) : banner(name, cfg);
  fs.writeFileSync(path.join(OUT, name + ".svg"), svg, "utf8");
}
console.log(Object.keys(LIST).length + " ilustrações geradas em ferramentas/ilustracoes-svg/");
