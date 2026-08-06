# Family Hub — sistema visual

O código publicado e `src/app/globals.css` são a fonte final de verdade. Este documento registra as decisões que devem permanecer consistentes em novas telas.

## Cores

### Tema escuro

| Token | Valor |
| --- | --- |
| Fundo | `#10110f` |
| Fundo secundário | `#181a17` |
| Superfície | `#20221f` |
| Borda | `#343830` |
| Texto | `#f1f2ec` |
| Texto secundário | `#a2a69a` |
| Laranja | `#e8760a` |
| Verde | `#4fa56f` |
| Azul | `#4b8fd2` |
| Vermelho | `#d85a4c` |

### Tema claro

| Token | Valor |
| --- | --- |
| Fundo | `#f5f1e9` |
| Fundo secundário | `#fffaf2` |
| Superfície | `#fffdf8` |
| Borda | `#e2d7c9` |
| Texto | `#22231f` |
| Texto secundário | `#696d62` |
| Laranja | `#d86f09` |
| Verde | `#438c5e` |
| Azul | `#3f7ebd` |
| Vermelho | `#c94f42` |

## Tipografia

- `Bebas Neue`: títulos de módulos, seções e valores de destaque.
- `Inter`: conteúdo, navegação, botões e formulários.
- `JetBrains Mono`: datas, categorias, indicadores e metadados.

## Componentes

- Cards usam a superfície do tema, borda discreta e raio entre 14 e 22 px.
- Botões primários usam laranja; ações destrutivas usam vermelho.
- Inputs usam fundo secundário, borda visível e foco laranja.
- Estados vazios usam ícone oficial, título, texto de apoio e borda tracejada quando ocupam um card.
- Ícones são da biblioteca `lucide-react`; não introduzir outra biblioteca.
- Avatares aparecem somente onde a identidade do membro é necessária.
- Elementos interativos precisam de estado hover/focus e alvo de toque adequado.

## Navegação e responsividade

- Desktop usa menu lateral; mobile usa barra inferior.
- A Home distribui os atalhos ativos sem deixar colunas vazias.
- Grids devem reduzir colunas progressivamente e nunca criar rolagem horizontal.
- Em até 620 px, modais usam formato de painel inferior e inputs com pelo menos 16 px.
- PWA deve respeitar `safe-area-inset-*` e manter conteúdo acima da navegação inferior.

## Movimento e carregamento

- O loader oficial é a casa em movimento `breath`, com duração de 1,4 s.
- Tema escuro: círculo `#c45f08` e casa `#f1f2ec`.
- Tema claro: círculo `#f5f1e9` e casa `#393b35`.
- `prefers-reduced-motion` desativa animações não essenciais.
- Operações rápidas só exibem o overlay após 180 ms para evitar piscadas.
- O loader anterior permanece arquivado em `src/components/brand/legacy`.

## Acessibilidade

- Manter contraste suficiente nos dois temas.
- Não comunicar estado apenas por cor.
- Controles precisam de nome acessível e foco perceptível.
- Elementos puramente decorativos devem usar `aria-hidden`.
- Áreas bloqueadas devem indicar indisponibilidade sem parecer clicáveis.
