// Gera content.js a partir dos arquivos baixados em docs/*.md (exportação Markdown do Google Docs).
// Uso (precisa do Node.js):  node ferramentas/gerar-content.js
// As imagens embutidas no Markdown (base64) são extraídas para assets/img/.
// ATENÇÃO: isto sobrescreve content.js. Se você editou content.js à mão, faça backup antes.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const DOCS = [
  { id: "nen", titulo: "Aprenda sobre Nen", arquivo: "Aprenda sobre Nen.doc", icone: "nen",
    url: "https://docs.google.com/document/d/1qtAnopp-aCpna2BlbGotd-2Po6Q7sluaRWfFMxV_hzA" },
  { id: "manual", titulo: "Manual dos Caçadores", arquivo: "Manual dos Caçadores.doc", icone: "licenca",
    url: "https://docs.google.com/document/d/1ZRzKP62OHWgdJchhi1QRH1AkPxQUaWlvPOhC9DcggE4" },
  { id: "atributos", titulo: "Atributos pelo Mundo", arquivo: "Atributos pelo Mundo.doc", icone: "atributos",
    url: "https://docs.google.com/document/d/1UeN0Ki8QIgCWzLPp5BBqEqKnIQLuTTVX9hIbQhalsQw" },
  { id: "familias", titulo: "Famílias Importantes", arquivo: "Famílias Importantes.doc", icone: "brasao",
    url: "https://docs.google.com/document/d/1-EDU0GO15ncHkv9QKazmLGgRPQ7uC7c_oyqvev1_Lbw" },
  { id: "aquisicoes", titulo: "Aquisições Hunter", arquivo: "Aquisições Hunter.doc", icone: "tesouro",
    url: "https://docs.google.com/document/d/1v3YCnio5sBBX4-cPtY71VtnvBeMIRdpDpd7zeyr3DjM" },
  { id: "cronologia", titulo: "Cronologia e Ambientação", arquivo: "Cronologia e Ambientação.doc", icone: "calendario",
    url: "https://docs.google.com/document/d/1hieQWD-AY-2KKQDscqaqo5NFOGr2ccDbfX9q-Lbysdc" },
];

fs.mkdirSync(path.join(ROOT, "assets", "img"), { recursive: true });

let out = `/* =====================================================================
   HunterOS — CONTEÚDO DOS DOCUMENTOS
   ---------------------------------------------------------------------
   Este é o único arquivo que você precisa editar para atualizar os textos.
   Cada documento tem:
     id       → identificador interno (não mude)
     titulo   → nome que aparece no ícone, na janela e no menu Iniciar
     icone    → desenho do ícone: nen, licenca, atributos, brasao, tesouro, calendario
     texto    → o conteúdo em Markdown, entre crases:  String.raw\` ... \`

   Markdown aceito no campo "texto":
     # Título de seção          (entra no índice lateral)
     ## Subtítulo               (entra no índice, recuado)
     **negrito**   *itálico*
     1. lista numerada          - lista com marcadores
     ---                        (linha divisória)
     ![](assets/img/arquivo.png)   (imagem)
     Linha terminada com dois espaços = quebra de linha.

   Cuidado: não use o caractere crase (\`) dentro do texto.
   ===================================================================== */

window.HUNTER_DOCS = [
`;

for (const d of DOCS) {
  const raw = fs.readFileSync(path.join(ROOT, "docs", d.id + ".md"), "utf8").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");
  const body = [];
  for (const line of lines) {
    const m = line.match(/^\[(image\d+)\]: <data:image\/(\w+);base64,(.*)>\s*$/);
    if (m) {
      // Imagens que têm ilustração própria em assets/ilustracoes/ não são extraídas
      if (fs.existsSync(path.join(ROOT, "assets", "ilustracoes", `${d.id}-${m[1]}.svg`))) continue;
      fs.writeFileSync(path.join(ROOT, "assets", "img", `${d.id}-${m[1]}.${m[2]}`), Buffer.from(m[3], "base64"));
      continue;
    }
    body.push(line);
  }
  let text = body.join("\n").replace(/\s+$/, "") + "\n";
  // ![][imageN] -> ![](assets/img/<doc>-imageN.png)
  text = text.replace(/!\[\]\[(image\d+)\]/g, (_, id) => {
    if (fs.existsSync(path.join(ROOT, "assets", "ilustracoes", `${d.id}-${id}.svg`))) return `![](assets/ilustracoes/${d.id}-${id}.svg)`;
    const file = fs.readdirSync(path.join(ROOT, "assets", "img")).find((f) => f.startsWith(`${d.id}-${id}.`));
    return `![](assets/img/${file})`;
  });
  if (text.includes("`")) throw new Error(`Crase encontrada em ${d.id}; ajuste o texto.`);
  out += `  {
    id: ${JSON.stringify(d.id)},
    titulo: ${JSON.stringify(d.titulo)},
    arquivo: ${JSON.stringify(d.arquivo)},
    icone: ${JSON.stringify(d.icone)},
    fonte: ${JSON.stringify(d.url)},
    texto: String.raw\`
${text}\`
  },

`;
}
out += "];\n";
fs.writeFileSync(path.join(ROOT, "content.js"), out, "utf8");
console.log("content.js gerado.");
