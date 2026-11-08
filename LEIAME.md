# HunterOS 98

Site estático do RPG em formato de "área de trabalho" retrô.

## Como abrir
- **No computador:** clique duas vezes em `index.html`.
- **GitHub Pages / Netlify:** envie a pasta inteira (`index.html`, `style.css`, `app.js`, `content.js` e `assets/`). Não precisa de build.
- Dica: `index.html#nen` abre direto um documento (ids: `nen`, `manual`, `atributos`, `familias`, `aquisicoes`, `cronologia`).

## Arquivos
| Arquivo | Para quê |
|---|---|
| `content.js` | **Todo o texto dos documentos.** É o único arquivo que você precisa editar. |
| `assets/img/` | Imagens extraídas dos Google Docs (logo, faixas de título, diagrama das categorias e mapa). |
| `assets/icones/` | Os 6 ícones em pixel art dos documentos (`nen`, `licenca`, `atributos`, `brasao`, `tesouro`, `calendario`). Para trocar um, substitua o PNG mantendo o mesmo nome. |
| `assets/ilustracoes/` | Ilustrações próprias em pixel art (PNG) que substituem as imagens do mangá. Para recriar: `node ferramentas/gerar-ilustracoes.js` (título, cor e kanji de cada uma ficam na lista `LIST`, no fim desse script; os desenhos dos símbolos ficam em `ferramentas/simbolos.js`) e depois `npm i sharp` e `node ferramentas/pixelar-ilustracoes.js`. Os originais em vetor ficam em `ferramentas/ilustracoes-svg/`. |
| `index.html`, `style.css`, `app.js` | Layout e funcionamento (não precisa mexer). Cada documento abre como um "site" próprio: nome, endereço, cabeçalho e rodapé ficam em `SITES` no `app.js`; o visual de cada um fica nas seções `site-<id>` do `style.css`. |
| `docs/` | Cópia original baixada do Google Docs (Markdown). Não é usada pelo site. |
| `ferramentas/gerar-content.js` | Opcional: recria `content.js` a partir de `docs/` (precisa do Node.js). |

## Como editar o conteúdo
Abra `content.js` num editor de texto (Bloco de Notas, VS Code...). Cada documento tem um campo `texto` com Markdown entre crases:

```
# Título de seção          → aparece no índice lateral
## Subtítulo               → aparece no índice, recuado
**negrito**  *itálico*
1. item numerado
- item com marcador
---                        → linha divisória
![](assets/img/foto.png)   → imagem
```

- Linha que termina com dois espaços = quebra de linha.
- Não use o caractere crase (`) dentro do texto.
- Para trocar o nome de um documento, mude `titulo`. Para trocar o ícone, mude `icone` (`nen`, `licenca`, `atributos`, `brasao`, `tesouro`, `calendario`).
- Para adicionar um documento novo, copie um bloco `{ ... },` inteiro e dê um `id` novo.

## Atualizar a partir do Google Docs (opcional)
Baixe de novo os `.md` para `docs/` (mesmos nomes) e rode `node ferramentas/gerar-content.js`. Isso **sobrescreve** `content.js`.
