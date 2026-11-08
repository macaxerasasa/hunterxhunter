// Transforma as ilustrações em SVG (ferramentas/ilustracoes-svg/) em pixel art (assets/ilustracoes/*.png).
// Uso:  npm i sharp   (só na primeira vez)
//       node ferramentas/pixelar-ilustracoes.js [nomes...]
// O desenho é reduzido a uma grade baixa, com poucas cores e pontilhado, como os ícones da área de trabalho.
// O texto dos banners usa grades mais finas para continuar legível.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC = process.env.PIX_SRC || path.join(__dirname, "ilustracoes-svg");
const OUT = process.env.PIX_OUT || path.join(__dirname, "..", "assets", "ilustracoes");

const ARTE_BANNER = 4;   // cada pixel do desenho vale 4 px do SVG (760x320)
const ARTE_CARTA = 3;    // idem para as cartas (260x260)
const TITULO = 2;        // grade do título dos banners
const LETRAS = 1;        // grade das letras pequenas (legíveis, como o texto serrilhado do Windows 98)
const ZOOM = 2;          // ampliação final em px inteiros, para o navegador reduzir sem deformar
const CORES = 30;        // cores do desenho
const PONTILHADO = 26;   // força do pontilhado (0 = sem)

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

const RE_TEXTO = /<text x="384"[\s\S]*?<\/text>/g;
const RE_RODAPE = /<text [^>]*text-anchor="end"[^>]*>HUNTER OS[^<]*<\/text>/;
const RE_GRAO = /<rect width="\d+" height="\d+" filter="url\(#\w+grain\)"\/>/;

const rgb = (buf, c) => { const a = []; for (let i = 0; i < buf.length; i += c) a.push([buf[i], buf[i + 1], buf[i + 2]]); return a; };

async function paleta(raw, w, h, n) {
  const png = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png({ palette: true, colours: n, dither: 0, effort: 10 }).toBuffer();
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return [...new Map(rgb(data, info.channels).map((p) => [p.join(), p])).values()];
}

// Reduz o desenho para a grade, limita as cores e aplica pontilhado ordenado
async function arte(svg, w, h) {
  const { data } = await sharp(Buffer.from(svg), { density: 72 })
    .removeAlpha()
    .resize(w, h, { fit: "fill", kernel: "lanczos3" })
    .modulate({ saturation: 1.18 })
    .linear(1.08, -8)
    .raw().toBuffer({ resolveWithObject: true });
  const pal = await paleta(data, w, h, CORES);
  const out = Buffer.alloc(data.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 3;
    const d = (BAYER[y % 4][x % 4] / 16 - 0.47) * PONTILHADO;
    const r = data[o] + d, g = data[o + 1] + d, b = data[o + 2] + d;
    let melhor = pal[0], dist = Infinity;
    for (const p of pal) {
      const e = 0.3 * (r - p[0]) ** 2 + 0.59 * (g - p[1]) ** 2 + 0.11 * (b - p[2]) ** 2;
      if (e < dist) { dist = e; melhor = p; }
    }
    out[o] = melhor[0]; out[o + 1] = melhor[1]; out[o + 2] = melhor[2];
  }
  return out;
}

// Texto em grade fina: sem meios-tons na borda, cada pixel é cheio ou vazio
async function texto(svgTexto, w, h) {
  const { data } = await sharp(Buffer.from(svgTexto), { density: 72 })
    .ensureAlpha()
    .resize(w, h, { fit: "fill", kernel: "lanczos3" })
    .raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = data[i] >= 118 ? 255 : 0;
  return data;
}

const grava = (buf, w, h, c, nome) => sharp(buf, { raw: { width: w, height: h, channels: c } })
  .resize(w * ZOOM, h * ZOOM, { kernel: "nearest" })
  .png({ palette: true, colours: 96, dither: 0, compressionLevel: 9, effort: 10 })
  .toFile(path.join(OUT, nome + ".png"));

async function banner(nome, svg) {
  const W = 760, H = 320;
  const textos = svg.match(RE_TEXTO) || [];
  const base = svg.replace(RE_TEXTO, "").replace(RE_RODAPE, "").replace(RE_GRAO, "");
  const cab = svg.slice(0, svg.indexOf("</defs>") + 7);

  // Desenho na grade baixa, ampliado sem suavizar até o tamanho do banner
  const aw = Math.round(W / ARTE_BANNER), ah = Math.round(H / ARTE_BANNER);
  const a = await arte(base, aw, ah);
  const tela = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (Math.floor(y / ARTE_BANNER) * aw + Math.floor(x / ARTE_BANNER)) * 3, d = (y * W + x) * 3;
    tela[d] = a[o]; tela[d + 1] = a[o + 1]; tela[d + 2] = a[o + 2];
  }

  // Texto por cima: título com pixels visíveis, letras pequenas na grade fina para continuar legíveis
  const camada = async (lista, g) => {
    if (!lista.length) return;
    const tw = Math.round(W / g), th = Math.round(H / g);
    const t = await texto(`${cab}${lista.join("")}</svg>`, tw, th);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (Math.floor(y / g) * tw + Math.floor(x / g)) * 4;
      if (!t[o + 3]) continue;
      const d = (y * W + x) * 3;
      tela[d] = t[o]; tela[d + 1] = t[o + 1]; tela[d + 2] = t[o + 2];
    }
  };
  const ehTitulo = (t) => t.includes('fill="url(');
  await camada(textos.filter(ehTitulo), TITULO);
  await camada(textos.filter((t) => !ehTitulo(t)), LETRAS);
  await grava(tela, W, H, 3, nome);
}

async function carta(nome, svg) {
  const lado = Math.round(260 / ARTE_CARTA);
  await sharp(await arte(svg.replace(RE_GRAO, ""), lado, lado), { raw: { width: lado, height: lado, channels: 3 } })
    .resize(lado * 8, lado * 8, { kernel: "nearest" })
    .png({ palette: true, colours: 64, dither: 0, compressionLevel: 9, effort: 10 })
    .toFile(path.join(OUT, nome + ".png"));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const pedidos = process.argv.slice(2);
  const nomes = pedidos.length ? pedidos : fs.readdirSync(SRC).filter((f) => f.endsWith(".svg")).map((f) => f.slice(0, -4));
  for (const nome of nomes) {
    const svg = fs.readFileSync(path.join(SRC, nome + ".svg"), "utf8");
    await (/viewBox="0 0 260 260"/.test(svg) ? carta : banner)(nome, svg);
  }
  console.log(nomes.length + " ilustrações em pixel art geradas em " + OUT);
})().catch((e) => { console.error(e); process.exit(1); });
