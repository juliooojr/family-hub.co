# 🎨 FAMILY HUB — DESIGN TOKENS v3
> Fonte única da verdade para cores, tipografia e componentes.

---

## PALETA DE CORES

```css
:root {
  --bg:        #111210;
  --bg2:       #1a1c19;
  --bg3:       #222420;
  --surface:   #1e201d;
  --surface2:  #252722;
  --border:    #2e302b;
  --border2:   #3a3d36;
  --text:      #e8e9e4;
  --text2:     #9a9c94;
  --text3:     #5a5c54;
  --accent:    #e8760a;
  --accent2:   #f59332;
  --accent-dim:#3d2004;
  --red:       #c0392b;
  --red-dim:   #2d0e0b;
  --green:     #4a9e6b;
  --green-dim: #0e2918;
  --blue:      #3a7fbf;
  --blue-dim:  #0a1e2d;
}
```

### Tailwind (tailwind.config.ts)
```ts
colors: {
  bg:      { DEFAULT:'#111210', 2:'#1a1c19', 3:'#222420' },
  surface: { DEFAULT:'#1e201d', 2:'#252722' },
  border:  { DEFAULT:'#2e302b', 2:'#3a3d36' },
  text:    { DEFAULT:'#e8e9e4', 2:'#9a9c94', 3:'#5a5c54' },
  accent:  { DEFAULT:'#e8760a', 2:'#f59332', dim:'#3d2004' },
  danger:  { DEFAULT:'#c0392b', dim:'#2d0e0b' },
  success: { DEFAULT:'#4a9e6b', dim:'#0e2918' },
  info:    { DEFAULT:'#3a7fbf', dim:'#0a1e2d' },
}
```

---

## TIPOGRAFIA

```css
'Bebas Neue'     /* títulos de página, módulos, valores financeiros grandes */
'Inter'          /* corpo, botões, formulários, labels de nav */
'JetBrains Mono' /* datas, categorias, valores numéricos, badges, filtros */
```

| Uso | Fonte | Tamanho | Peso |
|-----|-------|---------|------|
| Título de página (topbar) | Bebas Neue | clamp(18px, 4vw, 26px) | 400 |
| Título de seção | Bebas Neue | clamp(15px, 3vw, 18px) | 400 |
| Valor financeiro grande | Bebas Neue | clamp(20px, 5vw, 36px) | 400 |
| Logo | Bebas Neue | clamp(20px, 4vw, 28px) | 400 |
| Bubble label (hub) | Bebas Neue | clamp(8px, 1.8vw, 12px) | 400 |
| Corpo / itens | Inter | 13px | 400–500 |
| Botões | Inter | 11–12px | 500 |
| Labels de campo | JetBrains Mono | 10px | 400 |
| Datas / categorias | JetBrains Mono | 10–11px | 400 |
| Tags / badges | JetBrains Mono | 10px | 500 |

---

## BORDER RADIUS
```
14px — cards, modais, bolhas
 8px — botões, inputs, itens de lista
 6px — tags, badges, checkboxes
 4px — tags pequenas
```

## SOMBRAS
```css
--shadow:    0 2px 12px rgba(0,0,0,0.35);
--shadow-md: 0 4px 24px rgba(0,0,0,0.45);
--shadow-lg: 0 8px 40px rgba(0,0,0,0.55);
```

---

## REGRA GLOBAL DE CURSOR — CRÍTICA

```css
/* Aplicar em globals.css */
*, *::before, *::after { cursor: default; user-select: none; }
input, textarea, select { cursor: text !important; user-select: text !important; }
button, [onclick], .interactive { cursor: pointer !important; }
.locked, [data-locked] { cursor: not-allowed !important; }
```

Esta regra previne o cursor de texto (barra `|`) aparecer em elementos não-editáveis.
Aplique globalmente e adicione `cursor: pointer` apenas onde necessário.

---

## COMPONENTES

### Card
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 14px;
padding: clamp(14px, 2.5vw, 20px);
/* variante accent: border-left: 3px solid var(--accent) */
```

### Botões
```css
/* Primário */
background: var(--accent); color: #fff; border-radius: 8px; padding: 8px 18px;
hover: background: var(--accent2);

/* Ghost */
background: transparent; border: 1px solid var(--border2); color: var(--text2);
hover: background: var(--surface2);

/* Bloqueado */
background: var(--bg3); border: 1px solid var(--border); color: var(--text3);
cursor: not-allowed; opacity: 0.5;

/* Perigo */
background: var(--red-dim); border: 1px solid var(--red); color: #e05a4a;
```

### Inputs
```css
background: var(--bg2); border: 1px solid var(--border2); border-radius: 8px;
padding: 10px 12px; font-size: 13px; color: var(--text);
:focus { border-color: var(--accent); outline: none; }
::placeholder { color: var(--text3); }
```

### Tags / Badges
```css
/* Acento */  background: var(--accent-dim); color: var(--accent2);
/* Sucesso */ background: var(--green-dim);  color: var(--green);
/* Perigo */  background: var(--red-dim);    color: #e05a4a;
/* Info */    background: var(--blue-dim);   color: var(--blue);
padding: 2px 8px; border-radius: 4px; font-size: 10px; font-family: JetBrains Mono;
```

### Month Picker
```css
display: flex; align-items: center; gap: 4px;
background: var(--bg3); padding: 3px 6px; border-radius: 10px;
/* botões ‹ › */ width: 24px; border-radius: 6px; color: var(--text2);
/* valor */ font-family: JetBrains Mono; font-size: 11px; min-width: 76px; text-align: center;
```

### Float Nav (pill)
```css
position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
background: var(--surface2); border: 1px solid var(--border2);
border-radius: 50px; padding: 5px; overflow-x: auto;
box-shadow: 0 8px 40px rgba(0,0,0,0.5);
max-width: calc(100vw - 16px);
```

### Modal
```css
background: var(--surface); border: 1px solid var(--border2);
border-radius: 20px; padding: clamp(18px, 4vw, 28px);
max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto;
/* overlay */ background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
```

### Topbar
```css
display: flex; align-items: center; justify-content: space-between;
padding: clamp(12px, 2vw, 20px) clamp(14px, 3vw, 36px);
background: var(--bg); border-bottom: 1px solid var(--border);
/* linha de acento */ ::after { linear-gradient(90deg, transparent, var(--accent), transparent); opacity: 0.3; }
```

---

## HUB ORBITAL — ESPECIFICAÇÃO

### Bolhas ativas
```css
border: 1.5px solid var(--border2);
background: var(--surface2) + gradiente sutil único por módulo;
:hover { transform: scale(1.12); border-color: var(--accent); }
/* easing */ cubic-bezier(0.34, 1.56, 0.64, 1)
/* glow */ radial-gradient laranja opacity 0 → 1 no hover
/* dot ativo */ background: var(--accent); box-shadow: 0 0 6px var(--accent); animation: blink 2s;
```

### Bolhas bloqueadas
```css
filter: grayscale(1); opacity: 0.4;
pointer-events: none; /* SEM hover, SEM cursor, SEM click */
/* ícone 🔒 */ posição: bottom-right da bolha
```

### SOS — regras especiais
```css
/* SEM hover scale, SEM glow laranja */
border: var(--red) permanente;
/* anel pulsante */ border: 2px solid var(--red); animation: sos-ring 1.8s ease-out infinite;
cursor: pointer; /* clique imediato, sem animação de entrada */
```

### Anéis orbitais
```css
3 anéis: 38%, 67%, 92% do container
animação: rotate 40s / 70s (reverse) / 110s linear infinite
border: dashed, cor rgba(46,48,43,0.25–0.6)
pointer-events: none
```

---

## BREAKPOINTS

| Breakpoint | Comportamento |
|-----------|--------------|
| ≥ 1024px | Layout completo, grids 4 colunas |
| ≤ 1024px | g4 → 2 col, topbar wrapa |
| ≤ 768px | Grids colapsam, owner chips somem, nav compacta |
| ≤ 480px | Formulários empilham, btn-ghost some da topbar |
| ≤ 360px | Tudo 1 coluna, textos secundários somem |

### Grids responsivos
| Grid | 1440+ | 1024 | 768 | 480 | 360 |
|------|-------|------|-----|-----|-----|
| g4 | 4 | 2 | 2 | 2 | 1 |
| g3 | 3 | 3 | 2 | 2 | 1 |
| g2 | 2 | 2 | 1 | 1 | 1 |
| g21 | 2+1 | 1 | 1 | 1 | 1 |

---

## COMPRAS — PADRÕES VISUAIS ESPECÍFICOS

### Card de lista
```css
/* header clicável (nome + data + meta + progress bar) */
.lcard-header-zone { cursor: pointer; }
.lcard-header-zone:hover .lcard-name { color: var(--accent); }

/* itens abaixo NÃO propagam click para o card */
.chk-list { /* onclick: event.stopPropagation() */ }

/* chk item — linha inteira é clicável */
.chk { cursor: pointer; }
.chk:hover { background: var(--surface2); }
.chk:hover .del-item-btn { opacity: 1; }
.chk.done span { text-decoration: line-through; color: var(--text3); }

/* botão × excluir */
.del-item-btn { opacity: 0; }  /* aparece no hover */
@media (hover: none) { .del-item-btn { opacity: 0.55; } } /* sempre visível em touch */
```

### Botão + item
```css
border: 1px dashed var(--border2); background: none; color: var(--text3);
:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
```

### Modo Mercado
```css
/* itens grandes, fácil toque */
.mercado-item { padding: 16px; gap: 14px; }
.mercado-check { width: 36px; height: 36px; border-radius: 10px; font-size: 18px; }
.mercado-item-nome { font-size: 18px; font-weight: 500; }
```

### Preco opcional de item

- O preco de item em Compras e opcional e deve aparecer como informacao secundaria.
- Usar JetBrains Mono, tamanho pequeno e cor `var(--text3)`.
- O preco nunca deve competir visualmente com o nome do item nem aumentar demais a altura da linha.
- A acao de editar item deve ser discreta no desktop e acessivel em touch.
- Modo Mercado deve manter contraste adequado no desktop e no mobile; evitar topo escuro com texto sem contraste.

---
## FINANCEIRO — PADRÕES VISUAIS ESPECÍFICOS

- Modais seguem a composicao do `family-hub-v3.html`, com valor destacado, chips de categoria e rodape de acoes.
- Verde representa receita ou conclusao; laranja/vermelho representa despesa; azul representa reserva.
- O grafico da Visao Geral compara Receita, Despesa e Reserva dos ultimos seis meses, exibe valores no hover/foco e permite clicar no mes para focar o periodo.
- Investimentos bloqueado usa baixa opacidade, escala de cinza e nao aceita clique.
- Filtros de responsavel aparecem somente em Transacoes e Contas.
- Filtros compactos em Transacoes devem priorizar leitura em mobile e desktop sem ocupar largura excessiva.

---
*DESIGN.md — Family Hub v3.0 — 10/06/2026*

---

## ATUALIZACAO DE DESIGN PUBLICADO - 02/07/2026

Este bloco prevalece sobre trechos historicos acima quando houver divergencia.

- O layout publicado possui home publica, Hub interno, menu lateral no desktop e barra inferior no mobile.
- O app tambem funciona como PWA instalavel pelo iPhone, sem publicacao em loja.
- PWA usa icone proprio em `public/icons` e splash screens iOS em `public/splash`.
- No iOS instalado, respeitar safe areas da status bar e da home indicator.
- Evitar faixas pretas artificiais no topo ou na base; a cor visivel deve acompanhar o fundo do app.
- Modais mobile devem caber na tela, evitar scroll horizontal e continuar utilizaveis com teclado aberto.
- Campos em mobile devem manter fonte minima de 16px para evitar zoom automatico do iOS.
- Navegacao inferior mobile deve permanecer acessivel, sem cobrir acoes importantes.
- Qualquer mudanca em manifest, icone, splash, status bar ou safe area deve ser testada removendo e adicionando novamente o atalho do iPhone.
- Melhorias de UX publicadas em Compras e Financeiro devem ser validadas tambem no PWA instalado apos deploy em producao.
