/* =====================================================================
   HunterOS 98 — lógica da área de trabalho
   O conteúdo dos documentos fica em content.js (window.HUNTER_DOCS).
   ===================================================================== */
(function () {
  "use strict";

  const DOCS = window.HUNTER_DOCS || [];
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, html) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    }
    if (html != null) n.innerHTML = html;
    return n;
  };
  const isMobile = () => window.matchMedia("(max-width: 700px)").matches;

  /* ------------------------------------------------------------------
     Ícones SVG (desenhos próprios)
     ------------------------------------------------------------------ */
  const OUT = 'stroke="#14100c" stroke-width="1.5" stroke-linejoin="round"';
  // Ícones dos documentos: pixel art em assets/icones/ (o <svg> em volta mantém os tamanhos definidos no CSS)
  const iconePng = (nome) => `<svg viewBox="0 0 256 256" aria-hidden="true"><image href="assets/icones/${nome}.png" width="256" height="256"/></svg>`;
  const ICONS = {
    nen: iconePng("nen"),
    licenca: iconePng("licenca"),
    atributos: iconePng("atributos"),
    brasao: iconePng("brasao"),
    tesouro: iconePng("tesouro"),
    calendario: iconePng("calendario"),
    logo: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .5l7.5 7.5L8 15.5.5 8z" fill="url(#ig-red)" stroke="#3a0a0e" stroke-width=".8"/><path d="M8 3.6l4.4 4.4L8 12.4 3.6 8z" fill="url(#ig-gold)"/><path d="M8 6.2L9.8 8 8 9.8 6.2 8z" fill="#0f4d36"/></svg>`,
    rede: `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="2" width="9" height="7" fill="url(#ig-green)" stroke="#000" stroke-width=".8"/><rect x="6" y="7" width="9" height="7" fill="url(#ig-blue)" stroke="#000" stroke-width=".8"/><path d="M3 11v3h3" fill="none" stroke="#000" stroke-width=".8"/></svg>`,
    desligar: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="8" width="36" height="26" rx="2" fill="url(#ig-steel)" stroke="#14100c" stroke-width="1.5"/><rect x="10" y="12" width="28" height="18" fill="#0d3b2e"/><path d="M16 40h16M24 34v6" stroke="#14100c" stroke-width="2"/><circle cx="24" cy="21" r="5" fill="none" stroke="#f39a2b" stroke-width="2"/><path d="M24 14.5v6" stroke="#f39a2b" stroke-width="2"/></svg>`,
    sobre: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="url(#ig-paper)" stroke="#14100c" stroke-width="1.5"/><circle cx="24" cy="24" r="16" fill="none" stroke="url(#ig-gold)" stroke-width="2"/><circle cx="24" cy="15" r="2.6" fill="#0f4d36"/><path d="M20 21h6v13h3v3h-9v-3h3V24h-3z" fill="#0f4d36"/></svg>`,
    cacador: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="1" y="1" width="46" height="46" rx="4" fill="url(#ig-green)" stroke="#14100c" stroke-width="1.5"/><circle cx="24" cy="19" r="8" fill="url(#ig-paper)"/><path d="M9 44c0-10 7-16 15-16s15 6 15 16z" fill="url(#ig-paper)"/><path d="M14 13l10-7 10 7-3 1-7-4.5L17 14z" fill="url(#ig-red)"/><path d="M2 2h44v14C30 10 18 10 2 16z" fill="url(#ig-shine)" opacity=".3"/></svg>`,
    indice: `<svg viewBox="0 0 16 16" aria-hidden="true" width="14" height="14"><path d="M2 3h2v2H2zM6 3h8v2H6zM2 7h2v2H2zM6 7h8v2H6zM2 11h2v2H2zM6 11h8v2H6z" fill="#0f4d36"/></svg>`,
    topo: `<svg viewBox="0 0 16 16" aria-hidden="true" width="12" height="12"><path d="M8 3l5 6H9v4H7V9H3z" fill="#14100c"/></svg>`,
  };
  const BTN = {
    min: `<svg viewBox="0 0 10 9"><rect x="1" y="6" width="6" height="2" fill="#000"/></svg>`,
    max: `<svg viewBox="0 0 10 9"><path d="M0 0h9v9H0zM1 2v6h7V2z" fill="#000" fill-rule="evenodd"/></svg>`,
    restore: `<svg viewBox="0 0 10 9"><path d="M2 0h8v6H8V2H2zM0 3h7v6H0zM1 5v3h5V5z" fill="#000" fill-rule="evenodd"/></svg>`,
    close: `<svg viewBox="0 0 10 9"><path d="M1 0h2l2 2.5L7 0h2L6 4.5 9 9H7L5 6.5 3 9H1l3-4.5z" fill="#000"/></svg>`,
  };

  // Emblema da Associação (desenho próprio): estrela-bússola com anéis e texto circular
  function emblemSvg(id, { text = true, glow = true } = {}) {
    const ticks = Array.from({ length: 120 }, (_, i) => {
      const a = (i * 3 * Math.PI) / 180, r1 = 172, r2 = i % 10 === 0 ? 186 : 178;
      return `M${(200 + r1 * Math.cos(a)).toFixed(1)} ${(200 + r1 * Math.sin(a)).toFixed(1)}L${(200 + r2 * Math.cos(a)).toFixed(1)} ${(200 + r2 * Math.sin(a)).toFixed(1)}`;
    }).join("");
    const star = (r, w, rot) => `<path transform="rotate(${rot} 200 200)" d="M200 ${200 - r}L${200 + w} ${200 - w}L${200 + r} 200L${200 + w} ${200 + w}L200 ${200 + r}L${200 - w} ${200 + w}L${200 - r} 200L${200 - w} ${200 - w}Z"/>`;
    const t = "ASSOCIAÇÃO DOS CAÇADORES ✦ HUNTER OS 98 ✦ ARQUIVO OFICIAL ✦ ";
    return `<svg viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".5" stop-color="#e2b33c"/><stop offset="1" stop-color="#8a5c0a"/></linearGradient>
        <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a74"/><stop offset="1" stop-color="#7a1018"/></linearGradient>
        <radialGradient id="${id}h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7fffb4" stop-opacity=".5"/><stop offset="1" stop-color="#7fffb4" stop-opacity="0"/></radialGradient>
        <path id="${id}p" d="M200 48a152 152 0 1 1 0 304a152 152 0 1 1 0-304"/>
      </defs>
      ${glow ? `<circle cx="200" cy="200" r="200" fill="url(#${id}h)"/>` : ""}
      <g class="em-ring">
        <circle cx="200" cy="200" r="190" fill="none" stroke="url(#${id}g)" stroke-width="2"/>
        <path d="${ticks}" stroke="url(#${id}g)" stroke-width="1.5"/>
        <circle cx="200" cy="200" r="166" fill="none" stroke="url(#${id}g)" stroke-width="1"/>
        ${text ? `<text font-family="Georgia, serif" font-size="15" letter-spacing="4" fill="url(#${id}g)"><textPath href="#${id}p" textLength="950" lengthAdjust="spacing">${t}</textPath></text>` : ""}
      </g>
      <circle cx="200" cy="200" r="136" fill="none" stroke="url(#${id}g)" stroke-width="1.5" stroke-dasharray="2 6"/>
      <g fill="url(#${id}g)" opacity=".55">${star(150, 26, 45)}</g>
      <g fill="url(#${id}r)" stroke="#3a0a0e" stroke-width="1.5">${star(178, 30, 0)}</g>
      <g fill="url(#${id}g)" stroke="#5a3c06" stroke-width="1">${star(110, 22, 0)}</g>
      <circle cx="200" cy="200" r="30" fill="#0d3b2e" stroke="url(#${id}g)" stroke-width="4"/>
      <path d="M200 180l20 20-20 20-20-20z" fill="url(#${id}r)" stroke="#e2b33c" stroke-width="1.5"/>
    </svg>`;
  }
  const BOOT_LOGO = emblemSvg("bl", { text: true, glow: false });

  /* ------------------------------------------------------------------
     Markdown → HTML (subconjunto usado pelos documentos)
     ------------------------------------------------------------------ */
  const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function inline(src) {
    const keep = [];
    let s = escapeHtml(src);
    s = s.replace(/\\([\\`*_{}\[\]()#+\-.!|~>])/g, (_, c) => { keep.push(c); return `\u0000${keep.length - 1}\u0000`; });
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src2) => `<img src="${src2}" alt="${alt}" decoding="async">`);
    s = s.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => escapeHtml(keep[+i]));
    return s;
  }

  const RE = {
    blank: /^\s*$/,
    hr: /^\s{0,3}-{3,}\s*$/,
    heading: /^(#{1,6})\s*(.*?)\s*$/,
    table: /^\s*\|/,
    ol: /^(\s{0,3})(\d+)\.\s+(.*)$/,
    ul: /^(\s{0,3})[-*+]\s+(.*)$/,
    indented: /^\s{2,}\S/,
    imageOnly: /^\s*\*?\s*(!\[[^\]]*\]\([^)\s]+\))\s*\*?\s*$/,
  };
  const isBlockStart = (l) => RE.hr.test(l) || RE.heading.test(l) || RE.table.test(l) || RE.ol.test(l) || RE.ul.test(l);

  function renderParagraph(lines) {
    // Linhas que são só uma imagem viram <figure>; o resto vira parágrafo.
    let html = "", buf = [];
    const flush = () => {
      if (!buf.length) return;
      const parts = buf.map((l, i) => inline(l.trim()) + (i < buf.length - 1 ? (/ {2,}$/.test(l) ? "<br>" : " ") : ""));
      html += `<p>${parts.join("")}</p>`;
      buf = [];
    };
    for (const l of lines) {
      const m = l.match(RE.imageOnly);
      if (m) { flush(); html += `<figure>${inline(m[1])}</figure>`; }
      else buf.push(l);
    }
    flush();
    return html;
  }

  function renderTable(rows) {
    let html = '<div class="card-grid">';
    for (const row of rows) {
      const cells = row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c) || c === "")) continue; // linha separadora
      for (const c of cells) {
        if (!c) continue;
        const m = c.match(/^(.*?)\s*(!\[[^\]]*\]\([^)\s]+\))\s*(.*)$/);
        if (m) html += `<div class="card">${inline(m[2])}<h4>${inline(m[1])}</h4><p>${inline(m[3])}</p></div>`;
        else html += `<div class="card"><p>${inline(c)}</p></div>`;
      }
    }
    return html + "</div>";
  }

  function parseList(lines, i) {
    const ordered = RE.ol.test(lines[i]);
    const itemRe = ordered ? RE.ol : RE.ul;
    const otherRe = ordered ? RE.ul : RE.ol;
    const items = [];
    let nested = false; // sub-lista numerada que recomeça em 1 (exportação do Google Docs)
    let cur = null;
    while (i < lines.length) {
      const line = lines[i];
      if (RE.blank.test(line)) {
        let j = i + 1;
        while (j < lines.length && RE.blank.test(lines[j])) j++;
        if (j < lines.length && (itemRe.test(lines[j]) || RE.indented.test(lines[j]))) {
          if (cur) cur.lines.push("");
          i++; continue;
        }
        break;
      }
      const m = line.match(itemRe);
      if (m) {
        const num = ordered ? parseInt(m[2], 10) : null;
        const text = ordered ? m[3] : m[2];
        const top = items[items.length - 1];
        if (ordered && top && !nested && num === 1 && top.num > 1) nested = true;
        else if (ordered && nested && num === top.num + 1) nested = false;
        if (nested) {
          cur = { num, lines: [text] };
          top.sub.push(cur);
        } else {
          cur = { num, lines: [text], sub: [], after: [] };
          items.push(cur);
        }
        i++; continue;
      }
      if (otherRe.test(line) && !RE.indented.test(line)) break;
      if (RE.hr.test(line) || RE.heading.test(line) || RE.table.test(line)) break;
      // continuação (recuada ou "preguiçosa")
      const stripped = line.replace(/^ {1,4}/, "");
      if (nested && RE.indented.test(line)) items[items.length - 1].after.push(stripped);
      else if (cur) cur.lines.push(stripped);
      i++;
    }
    const tag = ordered ? "ol" : "ul";
    let html = `<${tag}${ordered && items[0] && items[0].num !== 1 ? ` start="${items[0].num}"` : ""}>`;
    for (const it of items) {
      html += `<li${ordered ? ` value="${it.num}"` : ""}>${parseBlocks(it.lines)}`;
      if (it.sub.length) {
        html += "<ol>" + it.sub.map((s) => `<li value="${s.num}">${parseBlocks(s.lines)}</li>`).join("") + "</ol>";
      }
      if (it.after.length) html += parseBlocks(it.after);
      html += "</li>";
    }
    return { html: html + `</${tag}>`, next: i };
  }

  function parseBlocks(lines) {
    let html = "", i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (RE.blank.test(line)) { i++; continue; }
      if (RE.hr.test(line)) { html += "<hr>"; i++; continue; }
      const h = line.match(RE.heading);
      if (h) {
        const text = h[2].trim();
        if (text) html += `<h${h[1].length}>${inline(text)}</h${h[1].length}>`;
        i++; continue;
      }
      if (RE.table.test(line)) {
        const rows = [];
        while (i < lines.length && (RE.table.test(lines[i]) || (RE.blank.test(lines[i]) && i + 1 < lines.length && RE.table.test(lines[i + 1])))) {
          if (!RE.blank.test(lines[i])) rows.push(lines[i]);
          i++;
        }
        html += renderTable(rows);
        continue;
      }
      if (RE.ol.test(line) || RE.ul.test(line)) {
        const r = parseList(lines, i);
        html += r.html; i = r.next; continue;
      }
      const para = [line];
      i++;
      while (i < lines.length && !RE.blank.test(lines[i]) && !isBlockStart(lines[i])) { para.push(lines[i]); i++; }
      html += renderParagraph(para);
    }
    return html;
  }

  function renderDoc(doc) {
    const root = el("div", { class: "doc-inner" }, parseBlocks(doc.texto.replace(/\r\n/g, "\n").split("\n")));
    // Capa: imagens iniciais (logo + faixa de título) num cabeçalho escuro
    const cover = el("div", { class: "doc-cover" });
    while (root.firstElementChild && root.firstElementChild.tagName === "FIGURE") cover.appendChild(root.firstElementChild);
    if (cover.children.length) root.prepend(cover);
    // IDs para o índice
    let n = 0;
    const headings = [...root.querySelectorAll("h1, h2")];
    headings.forEach((hd) => { hd.id = `${doc.id}-s${n++}`; });
    return { root, headings };
  }

  /* ------------------------------------------------------------------
     Índice de busca (por seção)
     ------------------------------------------------------------------ */
  const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function foldWithMap(s) {
    let out = "";
    const map = [];
    for (let i = 0; i < s.length; i++) {
      const f = fold(s[i]);
      for (let k = 0; k < f.length; k++) { out += f[k]; map.push(i); }
    }
    return { text: out, map };
  }

  const RENDERED = {};
  const SECTIONS = [];
  function buildIndex() {
    for (const doc of DOCS) {
      const r = renderDoc(doc);
      RENDERED[doc.id] = r;
      let current = { docId: doc.id, headingId: null, title: "Introdução", parts: [] };
      const push = () => {
        const text = current.parts.join("").replace(/\s+/g, " ").trim();
        if (text || current.headingId) SECTIONS.push({ ...current, text, folded: foldWithMap(text) });
      };
      const walk = (node) => {
        for (const child of node.childNodes) {
          if (child.nodeType === 1 && /^H[12]$/.test(child.tagName)) {
            push();
            current = { docId: doc.id, headingId: child.id, title: child.textContent.trim(), parts: [child.textContent, " "] };
          } else if (child.nodeType === 1) {
            walk(child);
            if (/^(P|LI|H4|FIGURE|DIV|BR)$/.test(child.tagName)) current.parts.push(" ");
          } else if (child.nodeType === 3) {
            current.parts.push(child.textContent);
          }
        }
      };
      walk(r.root);
      push();
    }
  }

  function search(query) {
    const q = fold(query.trim()).replace(/\s+/g, " ");
    if (q.length < 2) return [];
    const results = [];
    for (const s of SECTIONS) {
      const idx = s.folded.text.indexOf(q);
      if (idx === -1) continue;
      let count = 0, p = idx;
      while (p !== -1) { count++; p = s.folded.text.indexOf(q, p + q.length); }
      const start = s.folded.map[idx];
      const end = s.folded.map[idx + q.length - 1] + 1;
      const inTitle = fold(s.title).includes(q);
      results.push({ s, start, end, count, score: (inTitle ? 100 : 0) + count });
    }
    // mantém a ordem dos documentos, mas seções com o termo no título primeiro dentro do doc
    return results.sort((a, b) =>
      DOCS.findIndex((d) => d.id === a.s.docId) - DOCS.findIndex((d) => d.id === b.s.docId) || b.score - a.score);
  }

  function snippet(text, start, end) {
    const from = Math.max(0, start - 60), to = Math.min(text.length, end + 80);
    return (from > 0 ? "…" : "") + escapeHtml(text.slice(from, start)) + "<mark>" + escapeHtml(text.slice(start, end)) + "</mark>" +
      escapeHtml(text.slice(end, to)) + (to < text.length ? "…" : "");
  }

  /* ------------------------------------------------------------------
     Gerenciador de janelas
     ------------------------------------------------------------------ */
  const winLayer = $("#windows");
  const taskButtons = $("#task-buttons");
  const WINS = new Map(); // docId -> {win, btn, ...}
  let zTop = 10, openCount = 0;

  function deskSize() {
    const d = $("#desktop");
    return { w: d.clientWidth, h: d.clientHeight };
  }

  function focusWin(id) {
    const entry = WINS.get(id);
    for (const [k, v] of WINS) {
      v.win.classList.toggle("active", k === id);
      v.btn.classList.toggle("active", k === id && !v.win.classList.contains("minimized"));
    }
    if (entry) {
      entry.win.style.zIndex = ++zTop;
      entry.btn.classList.add("active");
    }
  }
  function focusTopVisible() {
    let best = null, bz = -1;
    for (const [k, v] of WINS) {
      if (v.win.classList.contains("minimized")) continue;
      const z = +v.win.style.zIndex || 0;
      if (z > bz) { bz = z; best = k; }
    }
    if (best) focusWin(best);
    else for (const v of WINS.values()) { v.win.classList.remove("active"); v.btn.classList.remove("active"); }
  }

  // Animação "retângulo de zoom" do Windows 98 (abrir / minimizar / restaurar)
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function zoomRect(from, to, done) {
    if (!from || !to || reduceMotion() || isMobile() || !from.width || !to.width) { done && done(); return; }
    const z = el("div", { class: "zoom-rect" });
    document.body.appendChild(z);
    const frame = (r) => ({ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    const anim = z.animate([frame(from), frame(to)], { duration: 230, easing: "steps(7, end)" });
    let fin = false;
    const finish = () => { if (fin) return; fin = true; z.remove(); done && done(); };
    anim.onfinish = finish;
    setTimeout(finish, 400); // garantia caso a animação não termine (aba em segundo plano)
  }

  function minimize(id) {
    const e = WINS.get(id);
    zoomRect(e.win.getBoundingClientRect(), e.btn.getBoundingClientRect());
    e.win.classList.add("minimized");
    e.btn.classList.add("is-min");
    e.btn.classList.remove("active");
    focusTopVisible();
  }
  function restore(id) {
    const e = WINS.get(id);
    if (e.win.classList.contains("minimized")) {
      const from = e.btn.getBoundingClientRect();
      e.win.classList.remove("minimized");
      e.win.style.visibility = "hidden";
      zoomRect(from, e.win.getBoundingClientRect(), () => { e.win.style.visibility = ""; });
    }
    e.win.classList.remove("minimized");
    e.btn.classList.remove("is-min");
    focusWin(id);
  }
  // Tela cheia (maximizar). A escolha fica salva: se você maximizou, os próximos documentos já abrem maximizados.
  let preferMax = false;
  try { preferMax = localStorage.getItem("hos-max") === "1"; } catch (_) { /* file:// ou armazenamento bloqueado */ }

  // Guarda o trecho que está no topo da leitura para não perder o lugar quando a largura muda
  function readingAnchor(e) {
    const a = e.article;
    if (a.scrollTop < 4) return null;
    const top = a.getBoundingClientRect().top;
    for (const b of e.site.querySelectorAll(".doc-inner h1, .doc-inner h2, .doc-inner p, .doc-inner li, .doc-inner figure")) {
      const r = b.getBoundingClientRect();
      if (r.bottom > top + 4) return { el: b, off: r.top - top };
    }
    return null;
  }
  function restoreAnchor(e, anc) {
    if (!anc) return;
    const a = e.article;
    const now = anc.el.getBoundingClientRect().top - a.getBoundingClientRect().top;
    a.scrollTo({ top: a.scrollTop + now - anc.off, behavior: "instant" });
  }

  function setMax(e, on, remember) {
    const anc = readingAnchor(e);
    e.win.classList.toggle("maximized", on);
    const b = $(".tb-btn.max", e.win);
    b.innerHTML = on ? BTN.restore : BTN.max;
    b.setAttribute("aria-label", on ? "Restaurar" : "Maximizar");
    b.title = on ? "Restaurar" : "Maximizar";
    if (!on) fitWin(e);
    e.setH && e.setH();
    restoreAnchor(e, anc);
    if (remember) {
      preferMax = on;
      try { localStorage.setItem("hos-max", on ? "1" : "0"); } catch (_) { /* ignora */ }
    }
  }
  function toggleMax(id) {
    const e = WINS.get(id);
    if (e) setMax(e, !e.win.classList.contains("maximized"), true);
  }

  // Mantém a janela inteira dentro da área de trabalho (ex.: depois de diminuir o navegador)
  function fitWin(e) {
    if (e.win.classList.contains("maximized")) return;
    const { w, h } = deskSize();
    if (e.win.offsetWidth > w) { e.win.style.width = w + "px"; e.win.style.left = "0px"; }
    if (e.win.offsetHeight > h) { e.win.style.height = h + "px"; e.win.style.top = "0px"; }
    if (e.win.offsetLeft > w - 80) e.win.style.left = Math.max(0, w - e.win.offsetWidth) + "px";
    if (e.win.offsetLeft < 80 - e.win.offsetWidth) e.win.style.left = "0px";
    if (e.win.offsetTop > h - 24) e.win.style.top = Math.max(0, h - e.win.offsetHeight) + "px";
    if (e.win.offsetTop < 0) e.win.style.top = "0px";
  }
  function closeWin(id) {
    const e = WINS.get(id);
    e.ro && e.ro.disconnect();
    e.win.remove();
    e.btn.remove();
    WINS.delete(id);
    focusTopVisible();
  }

  /* ------------------------------------------------------------------
     Sites: cada documento é exibido como um site diferente
     ------------------------------------------------------------------ */
  const SMALL_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os"]);
  const cap = (s) => s.toLocaleLowerCase("pt-BR").split(" ").map((w, i, arr) => (i && i < arr.length - 1 && SMALL_WORDS.has(w) ? w : w.charAt(0).toLocaleUpperCase("pt-BR") + w.slice(1))).join(" ");
  const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const hoje = () => { const t = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); return t.charAt(0).toUpperCase() + t.slice(1); };
  const mesAno = () => new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const docLinks = (id) => DOCS.filter((d) => d.id !== id).map((d) => `<a href="#" data-doc="${d.id}">${escapeHtml(d.titulo)}</a>`).join("");
  const GLOBE = `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="url(#ig-blue)" stroke="#14100c" stroke-width=".9"/><path d="M1.5 8h13M8 1.5c-2.6 2-2.6 11 0 13M8 1.5c2.6 2 2.6 11 0 13M3 4.4h10M3 11.6h10" fill="none" stroke="#14100c" stroke-width=".6"/></svg>`;

  const SITES = {
    nen: {
      name: "Academia de Nen", url: "http://www.academia-de-nen.hx/aprenda", navTitle: "Lições",
      header: (c) => `<header class="sh">
          <div class="sh-top"><span class="sh-brand">${ICONS.nen}<b>Academia de Nen</b></span><span class="sh-motto">Ten · Zetsu · Ren · Hatsu</span></div>
          <span class="sh-kanji" aria-hidden="true">念</span>
          <div class="sh-hero"><div data-cover></div><h1 class="sh-title">${escapeHtml(c.doc.titulo)}</h1></div>
        </header>`,
      footer: (c) => `<footer class="sf"><div class="sf-mark" aria-hidden="true">念</div><p>Academia de Nen</p><nav class="sf-links">${docLinks(c.doc.id)}</nav></footer>`,
    },
    manual: {
      name: "Associação dos Caçadores — Portal Oficial", url: "http://www.associacao-hunter.hx/manual-do-cacador", navTitle: "Seções",
      header: (c) => `<header class="sh">
          <div class="sh-util"><span>Portal Oficial da Associação dos Caçadores</span><span class="sh-date">${hoje()}</span></div>
          <div class="sh-main">${c.logo ? `<img class="sh-logo" src="${c.logo}" alt="">` : ""}<div><b class="sh-org">Associação dos Caçadores</b><span class="sh-dept">Portal Oficial</span></div></div>
        </header>`,
      pre: (c) => `<div class="sm-crumbs">Início › Documentos › <b>${escapeHtml(c.doc.titulo)}</b></div>
        <div class="sm-pagehead"><h1>${escapeHtml(c.doc.titulo)}</h1><div data-cover></div></div>`,
      footer: (c) => `<footer class="sf"><div><b>Associação dos Caçadores</b>Portal Oficial</div><div><b>Outros documentos</b>${docLinks(c.doc.id)}</div><div class="sf-copy">© Associação dos Caçadores</div></footer>`,
    },
    atributos: {
      name: "HunterPédia", url: "http://pt.hunterpedia.hx/wiki/Atributos_pelo_Mundo", navTitle: "Conteúdo", levels: [1, 2], numbered: true,
      header: (c) => `<header class="sh">
          <div class="sh-logo">${emblemSvg(c.uid + "w", { text: false, glow: false })}<div><b>HunterPédia</b><small>A enciclopédia dos caçadores</small></div></div>
          <form class="wk-search" role="search"><input type="search" placeholder="Pesquisar na HunterPédia" aria-label="Pesquisar"><button type="submit">Pesquisar</button></form>
        </header>`,
      pre: (c) => `<div class="wk-tabs"><span class="on">Artigo</span><span>Discussão</span><i></i><span class="on">Ler</span><span>Ver histórico</span></div>
        <h1 class="wk-title">${escapeHtml(c.doc.titulo)}</h1>
        <div class="wk-from">Origem: HunterPédia, a enciclopédia dos caçadores.</div>
        <aside class="wk-infobox"><div class="wk-ib-title">${escapeHtml(c.doc.titulo)}</div><div data-cover></div>
          <div class="wk-ib-row"><b>Arquivo</b><span>${escapeHtml(c.doc.arquivo || "")}</span></div>
          <div class="wk-ib-row"><b>Seções</b><span>${c.nSec}</span></div></aside>`,
      footer: (c) => `<footer class="sf"><b>Ver também</b><nav>${docLinks(c.doc.id)}</nav><p>Conteúdo do arquivo ${escapeHtml(c.doc.arquivo || c.doc.titulo)}.</p></footer>`,
    },
    familias: {
      name: "Linhagens — Revista", url: "http://www.revista-linhagens.hx/especial/familias", navTitle: "Nesta edição",
      header: () => `<header class="sh">
          <div class="sh-line"><span>Edição Especial</span><span>${mesAno()}</span></div>
          <div class="sh-mast">LINHAGENS</div>
          <div class="sh-tag">Poder · Fortuna · Tradição</div>
        </header>`,
      pre: (c) => `<div class="sm-hero"><div data-cover></div><p class="sm-hero-k">Especial</p><h1>${escapeHtml(c.doc.titulo)}</h1></div>`,
      footer: (c) => `<footer class="sf"><div class="sf-mast">LINHAGENS</div><nav class="sf-links">${docLinks(c.doc.id)}</nav></footer>`,
    },
    aquisicoes: {
      name: "Galeria Hunter — Catálogo", url: "http://www.galeria-hunter.hx/catalogo/aquisicoes", navTitle: "Lotes", lots: true,
      header: (c) => `<header class="sh">
          <div class="sh-brand">${ICONS.tesouro}<div><b>Galeria Hunter</b><small>Catálogo de Aquisições</small></div></div>
          <div data-cover></div>
        </header>`,
      pre: (c) => `<div class="sm-title"><span>Catálogo</span><h1>${escapeHtml(c.doc.titulo)}</h1></div>`,
      footer: (c) => `<footer class="sf"><b>Galeria Hunter</b><nav class="sf-links">${docLinks(c.doc.id)}</nav></footer>`,
    },
    cronologia: {
      name: "Gazeta do Mundo Conhecido", url: "http://www.gazeta-mundo.hx/arquivo/cronologia", navTitle: "Seções", levels: [1, 2],
      header: () => `<header class="sh">
          <div class="sh-line"><span>Arquivo Histórico</span><span class="sh-date">${hoje()}</span><span>Edição Especial</span></div>
          <div class="sh-mast">Gazeta do Mundo Conhecido</div>
        </header>`,
      pre: (c) => `<div class="sm-front"><div class="sm-kicker">${escapeHtml(c.doc.titulo)}</div><div data-cover></div></div>`,
      footer: (c) => `<footer class="sf"><div class="sf-mast">Gazeta do Mundo Conhecido</div><nav class="sf-links">${docLinks(c.doc.id)}</nav></footer>`,
    },
  };
  const DEFAULT_SITE = {
    name: "Arquivo", url: "http://www.associacao-hunter.hx/arquivo", navTitle: "Seções",
    header: (c) => `<header class="sh"><div data-cover></div><h1 class="sh-title">${escapeHtml(c.doc.titulo)}</h1></header>`,
    footer: (c) => `<footer class="sf"><nav class="sf-links">${docLinks(c.doc.id)}</nav></footer>`,
  };
  const siteOf = (doc) => SITES[doc.id] || DEFAULT_SITE;

  let siteUid = 0;
  function buildSite(doc) {
    const S = siteOf(doc);
    const inner = RENDERED[doc.id].root.cloneNode(true);
    const cover = inner.querySelector(".doc-cover");
    if (cover) cover.remove();
    // agrupa o conteúdo de cada título principal numa <section>
    let sec = null;
    for (const node of [...inner.childNodes]) {
      if (node.nodeType === 1 && node.tagName === "H1") {
        sec = el("section", { class: "site-sec" });
        inner.insertBefore(sec, node);
        sec.appendChild(node);
      } else if (sec) sec.appendChild(node);
    }
    let n = 0;
    for (const s of inner.querySelectorAll(".site-sec")) {
      if (!s.querySelector("img[src*='ilustracoes/']")) continue;
      const h = s.querySelector("h1");
      h.dataset.n = s.dataset.n = String(++n).padStart(2, "0");
    }
    // menu do site
    const levels = S.levels || [1];
    let i1 = 0, i2 = 0, nav = "";
    for (const h of inner.querySelectorAll("h1, h2")) {
      const lvl = +h.tagName[1];
      if (lvl === 1) { i1++; i2 = 0; } else i2++;
      if (!levels.includes(lvl)) continue;
      const num = S.numbered ? (lvl === 1 ? `${i1}` : `${i1}.${i2}`) : S.lots ? h.dataset.n || "" : "";
      nav += `<a href="#${h.id}" data-target="${h.id}" class="l${lvl}">${num ? `<span class="num">${num}</span>` : ""}<span class="lbl">${escapeHtml(cap(h.textContent.trim()))}</span></a>`;
    }
    const c = { doc, uid: "s" + siteUid++, logo: cover && cover.querySelector("img") ? cover.querySelector("img").getAttribute("src") : "", nSec: RENDERED[doc.id].headings.length };
    const site = el("div", { class: `site site-${SITES[doc.id] ? doc.id : "default"}` });
    site.innerHTML = S.header(c) +
      `<div class="site-body"><nav class="site-nav" aria-label="Seções do site"><div class="sn-title">${S.navTitle}</div><div class="sn-in">${nav}</div></nav>` +
      `<main class="site-main">${S.pre ? S.pre(c) : ""}</main></div>` + S.footer(c);
    $(".site-main", site).appendChild(inner);
    const slot = $("[data-cover]", site);
    if (slot && cover) slot.appendChild(cover);
    return site;
  }

  function openDoc(id, opts = {}) {
    const doc = DOCS.find((d) => d.id === id);
    if (!doc) return;
    const fromRect = opts.from ? opts.from.getBoundingClientRect() : null;
    closeStart();
    let e = WINS.get(id);
    if (!e) {
      e = createWindow(doc);
      e.win.style.visibility = "hidden";
      zoomRect(fromRect, e.win.getBoundingClientRect(), () => { e.win.style.visibility = ""; e.win.classList.add("opened"); });
    } else restore(id);
    focusWin(id);
    if (opts.headingId) goToSection(e, opts.headingId, opts.term);
  }

  function createWindow(doc) {
    const { headings } = RENDERED[doc.id];
    const S = siteOf(doc);
    const win = el("section", { class: "window", role: "dialog", "aria-label": doc.titulo });
    win.innerHTML = `
      <div class="titlebar">
        ${ICONS[doc.icone] || ICONS.licenca}
        <span class="title">${escapeHtml(S.name)} - Navegador Hunter</span>
        <button class="tb-btn min" type="button" aria-label="Minimizar" title="Minimizar">${BTN.min}</button>
        <button class="tb-btn max" type="button" aria-label="Maximizar" title="Maximizar">${BTN.max}</button>
        <button class="tb-btn close" type="button" aria-label="Fechar" title="Fechar">${BTN.close}</button>
      </div>
      <div class="toolbar">
        <button class="btn98 nav-btn act-back" type="button" title="Voltar" disabled><b>◀</b><span>Voltar</span></button>
        <button class="btn98 nav-btn act-fwd" type="button" title="Avançar" disabled><b>▶</b><span>Avançar</span></button>
        <button class="btn98 act-top" type="button" title="Página inicial">${ICONS.topo}<span>Início</span></button>
        <span class="tool-sep" aria-hidden="true"></span>
        <button class="btn98 act-smaller" type="button" title="Diminuir texto" aria-label="Diminuir texto">A−</button>
        <button class="btn98 act-bigger" type="button" title="Aumentar texto" aria-label="Aumentar texto">A+</button>
        <span class="spacer"></span>
        <span class="throbber" aria-hidden="true">${ICONS.logo}</span>
      </div>
      <div class="addressbar">
        <span class="addr-label">Endereço</span>
        <div class="addr sunken">${GLOBE}<span class="addr-url">${escapeHtml(S.url)}</span></div>
        <button class="btn98 act-go" type="button" title="Ir para o início da página">Ir</button>
      </div>
      <div class="read-progress" aria-hidden="true"><i></i></div>
      <div class="win-body">
        <article class="doc sunken" tabindex="0"></article>
      </div>
      <div class="statusbar"><span class="st-section">Concluído</span><span class="st-count"></span><span class="st-zone">${ICONS.rede} Rede dos Caçadores</span></div>
      <div class="grip" aria-hidden="true"></div>`;

    const article = $(".doc", win);
    const site = buildSite(doc);
    article.appendChild(site);
    const words = doc.texto.split(/\s+/).length;
    $(".st-count", win).textContent = `${headings.length} seções · ~${Math.max(1, Math.round(words / 200))} min de leitura`;

    // Posição inicial em cascata
    const { w, h } = deskSize();
    const step = (openCount++ % 6) * 28;
    const baseLeft = w > 760 ? 112 : 8; // não cobre a coluna de ícones quando há espaço
    const ww = Math.max(320, Math.min(1280, w - baseLeft - 4 * 28 - 8));
    const wh = Math.max(240, Math.min(900, h - 4 * 28 - 12));
    win.style.width = ww + "px";
    win.style.height = wh + "px";
    win.style.left = Math.max(0, Math.min(w - ww, baseLeft + step)) + "px";
    win.style.top = Math.max(0, Math.min(h - wh, 12 + step)) + "px";
    winLayer.appendChild(win);

    // Botão da barra de tarefas
    const btn = el("button", { class: "task-btn", type: "button", title: doc.titulo });
    btn.innerHTML = `${ICONS[doc.icone] || ""}<span>${escapeHtml(doc.titulo)}</span>`;
    taskButtons.appendChild(btn);

    const e = { win, btn, article, site, doc, S, size: 0, hist: [], fwd: [] };
    WINS.set(doc.id, e);
    const setH = () => article.style.setProperty("--doc-h", article.clientHeight + "px");
    e.setH = setH;
    // Abre maximizada se você preferiu tela cheia, ou se a tela é pequena demais para uma janela confortável
    if (!isMobile() && (preferMax || ww < 640 || wh < 440)) setMax(e, true, false);
    setH();
    if ("ResizeObserver" in window) { e.ro = new ResizeObserver(setH); e.ro.observe(article); }

    // Eventos
    btn.addEventListener("click", () => {
      if (win.classList.contains("minimized")) restore(doc.id);
      else if (win.classList.contains("active")) minimize(doc.id);
      else focusWin(doc.id);
    });
    win.addEventListener("pointerdown", () => focusWin(doc.id), true);
    $(".tb-btn.min", win).addEventListener("click", (ev) => { ev.stopPropagation(); minimize(doc.id); });
    $(".tb-btn.max", win).addEventListener("click", (ev) => { ev.stopPropagation(); toggleMax(doc.id); });
    $(".tb-btn.close", win).addEventListener("click", (ev) => { ev.stopPropagation(); closeWin(doc.id); });
    $(".titlebar", win).addEventListener("dblclick", (ev) => { if (!ev.target.closest(".tb-btn") && !isMobile()) toggleMax(doc.id); });
    const home = () => { pushHist(e); article.scrollTo({ top: 0 }); busy(e); };
    $(".act-top", win).addEventListener("click", home);
    $(".act-go", win).addEventListener("click", home);
    $(".act-back", win).addEventListener("click", () => histMove(e, e.hist, e.fwd));
    $(".act-fwd", win).addEventListener("click", () => histMove(e, e.fwd, e.hist));
    const setSize = (d) => {
      e.size = Math.max(-3, Math.min(5, e.size + d));
      site.style.setProperty("--zoom", String(1 + e.size * 0.08));
    };
    $(".act-smaller", win).addEventListener("click", () => setSize(-1));
    $(".act-bigger", win).addEventListener("click", () => setSize(1));
    article.addEventListener("click", (ev) => {
      const dl = ev.target.closest("[data-doc]");
      if (dl) { ev.preventDefault(); openDoc(dl.dataset.doc, { from: dl }); return; }
      const a = ev.target.closest("a[data-target]");
      if (a) { ev.preventDefault(); goToSection(e, a.dataset.target); return; }
      if (ev.target.closest("a[href^='#']")) ev.preventDefault();
    });
    const wk = $(".wk-search", site);
    if (wk) wk.addEventListener("submit", (ev) => {
      ev.preventDefault();
      searchInput.value = $("input", wk).value;
      openStart();
      renderResults();
    });
    let spyTimer = 0;
    const bar = $(".read-progress i", win);
    article.addEventListener("scroll", () => {
      const max = article.scrollHeight - article.clientHeight;
      bar.style.transform = `scaleX(${max > 0 ? article.scrollTop / max : 0})`;
      clearTimeout(spyTimer); spyTimer = setTimeout(() => scrollSpy(e), 60);
    }, { passive: true });

    makeDraggable(e);
    makeResizable(e);
    return e;
  }

  // Histórico de navegação (Voltar / Avançar) dentro do site
  function pushHist(e) {
    e.hist.push(e.article.scrollTop);
    if (e.hist.length > 50) e.hist.shift();
    e.fwd.length = 0;
    updateNavBtns(e);
  }
  function histMove(e, from, to) {
    if (!from.length) return;
    to.push(e.article.scrollTop);
    e.article.scrollTo({ top: from.pop(), behavior: "instant" });
    updateNavBtns(e);
    busy(e);
  }
  function updateNavBtns(e) {
    $(".act-back", e.win).disabled = !e.hist.length;
    $(".act-fwd", e.win).disabled = !e.fwd.length;
  }
  function busy(e) {
    const t = $(".throbber", e.win);
    t.classList.remove("busy"); void t.offsetWidth; t.classList.add("busy");
  }

  // Altura do menu fixo no topo do site (0 quando o menu é lateral)
  function navOffset(e) {
    const nav = $(".site-nav", e.article);
    if (!nav) return 0;
    const r = nav.getBoundingClientRect();
    return r.width > e.article.clientWidth * 0.5 ? r.height : 0;
  }

  function scrollSpy(e) {
    const hs = e.article.querySelectorAll(".doc-inner h1[id], .doc-inner h2[id]");
    const top0 = e.article.getBoundingClientRect().top + navOffset(e) + 70;
    let cur = null;
    for (const hd of hs) { if (hd.getBoundingClientRect().top <= top0) cur = hd; else break; }
    const nav = $(".site-nav", e.article);
    for (const a of e.article.querySelectorAll(".site-nav a.current")) a.classList.remove("current");
    $(".st-section", e.win).textContent = cur ? cap(cur.textContent.trim()) : "Concluído";
    $(".addr-url", e.win).textContent = e.S.url + (cur ? "#" + slug(cur.textContent) : "");
    if (!cur || !nav) return;
    let a = nav.querySelector(`a[data-target="${cur.id}"]`);
    if (!a && cur.tagName === "H2") {
      // título de 2º nível fora do menu: marca o título principal anterior
      const all = [...hs];
      for (let i = all.indexOf(cur); i >= 0 && !a; i--) if (all[i].tagName === "H1") a = nav.querySelector(`a[data-target="${all[i].id}"]`);
    }
    if (!a) return;
    a.classList.add("current");
    const box = a.closest(".sn-in");
    if (box.scrollWidth > box.clientWidth + 2) box.scrollLeft = a.offsetLeft - box.clientWidth / 3;
    if (nav.scrollHeight > nav.clientHeight + 2) {
      const nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
      if (r.top < nr.top + 30 || r.bottom > nr.bottom - 10) nav.scrollTop += r.top - nr.top - nr.height / 3;
    }
  }

  function goToSection(e, headingId, term) {
    const target = headingId ? e.article.querySelector("#" + CSS.escape(headingId)) : null;
    // remove destaques antigos
    for (const m of e.article.querySelectorAll("mark.hit")) m.replaceWith(document.createTextNode(m.textContent));
    e.article.normalize && e.article.normalize();
    let scrollEl = target;
    if (term) {
      const hit = highlightFrom($(".doc-inner", e.article), target, term);
      if (hit) scrollEl = hit;
    }
    if (!scrollEl) return;
    pushHist(e);
    busy(e);
    // posição relativa ao artigo
    const top = scrollEl.getBoundingClientRect().top - e.article.getBoundingClientRect().top + e.article.scrollTop;
    const offset = scrollEl === target ? navOffset(e) + 12 : e.article.clientHeight / 3;
    e.article.scrollTo({ top: Math.max(0, top - offset), behavior: term ? "instant" : "smooth" });
    scrollSpy(e);
  }

  // Destaca a primeira ocorrência do termo a partir do título da seção
  function highlightFrom(container, startEl, term) {
    const q = fold(term.trim()).replace(/\s+/g, " ");
    if (!q) return null;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let started = !startEl, node;
    while ((node = walker.nextNode())) {
      if (!started) {
        if (startEl.contains(node) || (startEl.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)) started = true;
        else continue;
      }
      const f = foldWithMap(node.textContent.replace(/\s+/g, " "));
      const idx = f.text.indexOf(q);
      if (idx === -1) continue;
      const s = f.map[idx], en = f.map[idx + q.length - 1] + 1;
      const range = document.createRange();
      range.setStart(node, s);
      range.setEnd(node, en);
      const mark = el("mark", { class: "hit" });
      range.surroundContents(mark);
      return mark;
    }
    return null;
  }

  function makeDraggable(e) {
    const bar = $(".titlebar", e.win);
    let sx, sy, ox, oy, dragging = false;
    bar.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0 || ev.target.closest(".tb-btn") || isMobile() || e.win.classList.contains("maximized")) return;
      dragging = true;
      sx = ev.clientX; sy = ev.clientY;
      ox = e.win.offsetLeft; oy = e.win.offsetTop;
      bar.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    bar.addEventListener("pointermove", (ev) => {
      if (!dragging) return;
      const { w, h } = deskSize();
      const nx = Math.min(w - 80, Math.max(80 - e.win.offsetWidth, ox + ev.clientX - sx));
      const ny = Math.min(h - 24, Math.max(0, oy + ev.clientY - sy));
      e.win.style.left = nx + "px";
      e.win.style.top = ny + "px";
    });
    const end = () => { dragging = false; };
    bar.addEventListener("pointerup", end);
    bar.addEventListener("pointercancel", end);
  }

  function makeResizable(e) {
    const grip = $(".grip", e.win);
    let sx, sy, ow, oh, on = false;
    grip.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      on = true; sx = ev.clientX; sy = ev.clientY; ow = e.win.offsetWidth; oh = e.win.offsetHeight;
      grip.setPointerCapture(ev.pointerId); ev.preventDefault();
    });
    grip.addEventListener("pointermove", (ev) => {
      if (!on) return;
      const { w, h } = deskSize();
      e.win.style.width = Math.max(320, Math.min(w - e.win.offsetLeft, ow + ev.clientX - sx)) + "px";
      e.win.style.height = Math.max(220, Math.min(h - e.win.offsetTop, oh + ev.clientY - sy)) + "px";
    });
    grip.addEventListener("pointerup", () => { on = false; });
    grip.addEventListener("pointercancel", () => { on = false; });
  }

  /* ------------------------------------------------------------------
     Ícones da área de trabalho
     ------------------------------------------------------------------ */
  function buildIcons() {
    const box = $("#icons");
    let lastPointer = "mouse";
    for (const doc of DOCS) {
      const b = el("button", { class: "icon", type: "button", role: "listitem", "data-id": doc.id, title: `Abrir ${doc.titulo}` });
      b.innerHTML = `${ICONS[doc.icone] || ICONS.licenca}<span>${escapeHtml(doc.titulo)}</span>`;
      b.addEventListener("pointerdown", (ev) => { lastPointer = ev.pointerType; });
      b.addEventListener("click", () => {
        selectIcon(b);
        if (lastPointer === "touch" || lastPointer === "pen" || isMobile()) openDoc(doc.id, { from: b });
      });
      b.addEventListener("dblclick", () => openDoc(doc.id, { from: b }));
      b.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); openDoc(doc.id, { from: b }); } });
      box.appendChild(b);
    }
    $("#desktop").addEventListener("pointerdown", (ev) => {
      if (!ev.target.closest(".icon") && !ev.target.closest(".window")) selectIcon(null);
    });
  }
  function selectIcon(b) {
    for (const i of document.querySelectorAll(".icon.selected")) i.classList.remove("selected");
    if (b) b.classList.add("selected");
  }

  /* ------------------------------------------------------------------
     Menu Iniciar + busca
     ------------------------------------------------------------------ */
  const startMenu = $("#start-menu");
  const startBtn = $("#start-btn");
  const searchInput = $("#search");
  const startList = $("#start-list");
  const resultsBox = $("#search-results");

  function buildStartMenu() {
    startList.appendChild(el("div", { class: "menu-label", text: "Documentos" }));
    for (const doc of DOCS) {
      const b = el("button", { class: "menu-item", type: "button", role: "menuitem" });
      const nSec = RENDERED[doc.id].headings.length;
      b.innerHTML = `${ICONS[doc.icone] || ""}<span><b>${escapeHtml(doc.titulo)}</b><small>${nSec} seç${nSec === 1 ? "ão" : "ões"} no índice</small></span>`;
      b.addEventListener("click", () => openDoc(doc.id, { from: b }));
      startList.appendChild(b);
    }
    startList.appendChild(el("div", { class: "menu-sep" }));
    const about = el("button", { class: "menu-item small", type: "button", role: "menuitem" });
    about.innerHTML = `${ICONS.sobre}<span>Sobre o HunterOS...</span>`;
    about.addEventListener("click", () => { closeStart(); showAbout(); });
    startList.appendChild(about);
    const off = el("button", { class: "menu-item small", type: "button", role: "menuitem" });
    off.innerHTML = `${ICONS.desligar}<span>Desligar...</span>`;
    off.addEventListener("click", shutdown);
    startList.appendChild(off);
  }

  function openStart() {
    startMenu.hidden = false;
    startBtn.setAttribute("aria-expanded", "true");
    if (!isMobile()) setTimeout(() => searchInput.focus(), 0);
  }
  function closeStart() {
    startMenu.hidden = true;
    startBtn.setAttribute("aria-expanded", "false");
  }
  startBtn.addEventListener("click", () => (startMenu.hidden ? openStart() : closeStart()));
  document.addEventListener("pointerdown", (ev) => {
    if (!startMenu.hidden && !ev.target.closest("#start-menu") && !ev.target.closest("#start-btn")) closeStart();
  });

  let kbdIndex = -1;
  function renderResults() {
    const q = searchInput.value;
    kbdIndex = -1;
    if (q.trim().length < 2) {
      resultsBox.hidden = true; startList.hidden = false; resultsBox.innerHTML = "";
      return;
    }
    const res = search(q);
    startList.hidden = true; resultsBox.hidden = false;
    resultsBox.innerHTML = "";
    if (!res.length) {
      resultsBox.appendChild(el("div", { class: "no-results", text: `Nenhum resultado para “${q.trim()}”.` }));
      return;
    }
    const total = res.reduce((n, r) => n + r.count, 0);
    resultsBox.appendChild(el("div", { class: "results-count", text: `${total} ocorrência${total > 1 ? "s" : ""} em ${res.length} seç${res.length > 1 ? "ões" : "ão"}` }));
    for (const r of res.slice(0, 60)) {
      const doc = DOCS.find((d) => d.id === r.s.docId);
      const b = el("button", { class: "result", type: "button" });
      b.innerHTML = `<div class="result-head">${ICONS[doc.icone] || ""}<span>${escapeHtml(doc.titulo)}</span><small>› ${escapeHtml(r.s.title)}${r.count > 1 ? ` (${r.count}×)` : ""}</small></div>
        <div class="result-snip">${snippet(r.s.text, r.start, r.end)}</div>`;
      b.addEventListener("click", () => openDoc(doc.id, { headingId: r.s.headingId, term: q, from: startBtn }));
      resultsBox.appendChild(b);
    }
  }
  searchInput.addEventListener("input", renderResults);
  searchInput.addEventListener("keydown", (ev) => {
    const items = [...resultsBox.querySelectorAll(".result")];
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      if (!items.length) return;
      ev.preventDefault();
      kbdIndex = (kbdIndex + (ev.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((it, i) => it.classList.toggle("kbd", i === kbdIndex));
      items[kbdIndex].scrollIntoView({ block: "nearest" });
    } else if (ev.key === "Enter") {
      const it = items[Math.max(0, kbdIndex)];
      if (it) it.click();
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !startMenu.hidden) { closeStart(); startBtn.focus(); }
  });

  /* ------------------------------------------------------------------
     Janela "Sobre"
     ------------------------------------------------------------------ */
  function showAbout() {
    const existing = $("#about-win");
    if (existing) { existing.style.zIndex = ++zTop; return; }
    const { w, h } = deskSize();
    const win = el("section", { class: "window active", id: "about-win", role: "dialog", "aria-label": "Sobre o HunterOS" });
    win.style.cssText = `width:${Math.min(380, w - 20)}px;height:auto;left:${Math.max(10, (w - 380) / 2)}px;top:${Math.max(10, h / 2 - 150)}px;z-index:${++zTop}`;
    win.innerHTML = `
      <div class="titlebar">${ICONS.sobre}<span class="title">Sobre o HunterOS</span>
        <button class="tb-btn close" type="button" aria-label="Fechar">${BTN.close}</button></div>
      <div style="display:flex;gap:14px;padding:16px 12px 8px;align-items:flex-start">
        <div style="width:64px;flex:none">${emblemSvg("ab", { text: false, glow: false })}</div>
        <div style="line-height:1.5"><b style="font-size:14px">HunterOS 98</b><br>
        Terminal de consulta da Associação dos Caçadores.<br><br>
        ${DOCS.length} documentos instalados.<br>
        Dica: use a busca do menu Iniciar para encontrar qualquer termo.</div>
      </div>
      <div style="text-align:right;padding:6px 8px 8px"><button class="btn98 ok" type="button" style="min-width:75px">OK</button></div>`;
    const close = () => win.remove();
    $(".tb-btn.close", win).addEventListener("click", close);
    $(".ok", win).addEventListener("click", close);
    if (!isMobile()) {
      win.style.minHeight = "0";
      const tmp = { win };
      makeDraggable(Object.assign(tmp, {}));
    } else {
      win.style.height = "auto";
    }
    winLayer.appendChild(win);
    $(".ok", win).focus();
  }

  /* ------------------------------------------------------------------
     Relógio
     ------------------------------------------------------------------ */
  function tick() {
    const now = new Date();
    const c = $("#clock");
    const hora = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const data = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    c.innerHTML = `<b>${hora}</b><span>${data}</span>`;
    c.setAttribute("datetime", now.toISOString());
    c.title = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  /* ------------------------------------------------------------------
     Boot e desligar
     ------------------------------------------------------------------ */
  const BIOS = [
    "HunterBIOS v3.15  (C) 1998 Associação dos Caçadores",
    "",
    "Processador : Núcleo de Aura  @ 315 MHz",
    "Memória de Nen : 640K ................ OK",
    "Nós de aura : 184 abertos ............ OK",
    "Licença Hunter : verificada .......... OK",
    "",
    "Iniciando HunterOS 98...",
  ];
  const BOOT_LINES = [
    "Verificando licença Hunter...",
    "Abrindo nós de aura... OK",
    "Carregando Ten, Zetsu, Ren, Hatsu...",
    "Conectando à Taverna dos Caçadores...",
    "Montando arquivos da Associação...",
    "Bem-vindo, Caçador.",
  ];
  let bootTimers = [];
  function boot() {
    const b = $("#boot");
    b.hidden = false;
    b.classList.remove("fade", "splash");
    const bios = $("#boot-bios"), log = $("#boot-log");
    bios.textContent = ""; log.textContent = "";
    bootTimers.forEach(clearTimeout);
    bootTimers = [];
    const at = (ms, fn) => bootTimers.push(setTimeout(fn, ms));
    BIOS.forEach((t, i) => at(60 + i * 95, () => { bios.textContent += t + "\n"; }));
    at(950, () => b.classList.add("splash"));
    BOOT_LINES.forEach((t, i) => at(1050 + i * 300, () => { log.textContent = t; }));
    at(2900, endBoot);
    setTimeout(() => {
      document.addEventListener("keydown", endBoot, { once: true });
      b.addEventListener("pointerdown", endBoot, { once: true });
    }, 50);
  }
  function endBoot() {
    const b = $("#boot");
    if (b.hidden || b.classList.contains("fade")) return;
    bootTimers.forEach(clearTimeout);
    b.classList.add("fade");
    setTimeout(() => { b.hidden = true; }, 600);
    document.removeEventListener("keydown", endBoot);
    document.body.classList.add("booted");
    setTimeout(() => balloon("Bem-vindo, Caçador!", "Dê dois cliques num arquivo para abrir, ou use a busca do menu Iniciar."), 900);
  }

  /* ------------------------------------------------------------------
     Balão de aviso da bandeja
     ------------------------------------------------------------------ */
  let balloonTimer = 0;
  function balloon(title, text) {
    const bl = $("#balloon");
    if (sessionStorage.getItem("hos-balloon")) return;
    sessionStorage.setItem("hos-balloon", "1");
    bl.innerHTML = `<b>${ICONS.logo}${escapeHtml(title)}</b><span>${escapeHtml(text)}</span><button type="button" aria-label="Fechar aviso">${BTN.close}</button>`;
    bl.hidden = false;
    const hide = () => { bl.classList.add("out"); setTimeout(() => { bl.hidden = true; bl.classList.remove("out"); }, 300); };
    bl.onclick = hide;
    clearTimeout(balloonTimer);
    balloonTimer = setTimeout(hide, 8000);
  }

  /* ------------------------------------------------------------------
     Papel de parede vivo: partículas de aura (canvas)
     ------------------------------------------------------------------ */
  function startAura() {
    const cv = $("#aura");
    const ctx = cv.getContext && cv.getContext("2d");
    if (!ctx) return;
    let W = 0, H = 0, parts = [], dpr = 1, last = 0;
    const COLORS = ["127,255,180", "127,255,180", "226,179,60", "160,255,210", "230,80,90"];
    const spawn = (y) => ({
      x: Math.random() * W, y: y ?? Math.random() * H,
      r: 0.6 + Math.random() * 2.2, v: 0.15 + Math.random() * 0.45,
      ph: Math.random() * Math.PI * 2, sw: 0.3 + Math.random() * 0.8,
      c: COLORS[(Math.random() * COLORS.length) | 0], a: 0.25 + Math.random() * 0.6,
    });
    const resize = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(110, Math.round((W * H) / 14000));
      parts = Array.from({ length: n }, () => spawn());
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        const x = p.x + Math.sin(t / 1600 + p.ph) * 14 * p.sw;
        const tw = 0.6 + 0.4 * Math.sin(t / 700 + p.ph * 3);
        const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 5);
        g.addColorStop(0, `rgba(${p.c},${(p.a * tw).toFixed(3)})`);
        g.addColorStop(1, `rgba(${p.c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, p.y, p.r * 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };
    const step = (t) => {
      requestAnimationFrame(step);
      if (document.hidden || t - last < 33) return; // ~30 fps
      const dt = Math.min(3, (t - last) / 16.7); last = t;
      for (const p of parts) { p.y -= p.v * dt; if (p.y < -12) Object.assign(p, spawn(H + 10)); }
      draw(t);
    };
    resize();
    window.addEventListener("resize", resize);
    if (reduceMotion()) draw(0); else requestAnimationFrame(step);
  }

  function shutdown() {
    closeStart();
    for (const id of [...WINS.keys()]) closeWin(id);
    const about = $("#about-win"); about && about.remove();
    const s = $("#shutdown");
    s.hidden = false;
    const restart = () => {
      s.hidden = true;
      document.removeEventListener("keydown", restart);
      boot();
    };
    setTimeout(() => {
      s.addEventListener("pointerdown", restart, { once: true });
      document.addEventListener("keydown", restart, { once: true });
    }, 300);
  }

  /* ------------------------------------------------------------------
     Inicialização
     ------------------------------------------------------------------ */
  $("#boot-logo").innerHTML = BOOT_LOGO;
  $("#emblem").innerHTML = emblemSvg("em");
  $("#start-avatar").innerHTML = ICONS.cacador;
  startAura();
  $("#start-logo").innerHTML = ICONS.logo;
  $("#tray-icon").innerHTML = ICONS.rede;
  buildIndex();
  buildIcons();
  buildStartMenu();
  tick();
  setInterval(tick, 1000);
  boot();

  // Permite abrir um documento direto pela URL: index.html#nen
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash && DOCS.some((d) => d.id === hash)) setTimeout(() => openDoc(hash), 100);

  // Ajusta janelas que saíram da tela quando o navegador é redimensionado
  window.addEventListener("resize", () => {
    for (const e of WINS.values()) fitWin(e);
  });

  // Exposto para testes no console
  window.HunterOS = { openDoc, search, closeWin, minimize, restore, toggleMax };
})();
