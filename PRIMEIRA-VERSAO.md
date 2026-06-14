# FAMILY HUB - PRIMEIRA VERSÃO

> Documento consolidado de contexto da primeira versao funcional.
> Atualizado em 14/06/2026.
> Registro historico preservado. Para continuar o projeto, leia primeiro `AGENTS.md` e `README.md`.

## 1. Objetivo do produto

O Family Hub e um sistema privado para centralizar a rotina da familia Julio, Carol, Tomas e Flora. A pagina inicial apresenta os modulos do sistema e cada modulo deve compartilhar a mesma identidade visual, autenticacao e familia no banco.

O primeiro modulo implementado e aprovado e **Lista de Compras**. Os demais modulos permanecem visualmente bloqueados ate serem desenvolvidos.

## 2. Referencias e ordem de prioridade

Quando houver conflito entre documentos, use esta ordem:

1. Codigo funcional atual e decisoes deste arquivo.
2. `family-hub-v3.html`, como referencia visual e comportamental.
3. `DESIGN.md`, para tokens e componentes.
4. `BRAIN.md`, para visao de produto, seguranca e modelo de dados.
5. `TASKS.md`, como backlog historico, conferindo o que ja foi concluido.

Os arquivos antigos podem citar Next.js 14 ou funcionalidades ainda nao implementadas. O projeto real utiliza as versoes registradas abaixo.

## 3. Stack real

- Next.js 16.2.9 com App Router.
- React 19.2.4.
- TypeScript em modo estrito.
- Tailwind CSS 4, embora boa parte do visual atual use CSS global.
- Supabase para autenticacao, PostgreSQL e RLS.
- Google OAuth como unica forma de login.
- Fontes locais por `@fontsource`: Bebas Neue, Inter e JetBrains Mono.
- ESLint 9 com configuracao do Next.js.

## 4. Repositorio e execucao local

Repositorio remoto:

`https://github.com/juliooojr/family-hub.co.git`

Diretorio local do aplicativo:

`C:\Users\Julio Jr\Desktop\family-hub - codex\family-hub`

Comandos:

```powershell
npm.cmd install
npm.cmd run dev
```

Para acessar de outro dispositivo na mesma rede:

```powershell
npm.cmd run dev:network
```

Enderecos usuais:

- Local: `http://localhost:3000`
- Rede usada no desenvolvimento: `http://192.168.0.101:3000`

O script de desenvolvimento usa Webpack porque o Turbopack apresentou erro de runtime durante os primeiros testes. Existe `npm run dev:turbopack` apenas para testes futuros.

Validacao obrigatoria antes de concluir mudancas:

```powershell
npm.cmd run lint
npm.cmd exec tsc -- --noEmit
npm.cmd run build
```

## 5. Variaveis de ambiente

O arquivo `.env.local` contem:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Regras:

- Nunca inserir chaves no codigo, em commits ou neste documento.
- A service role nunca pode ser enviada ao navegador.
- No cliente, usar somente a chave anonima e confiar nas policies RLS.

## 6. Autenticacao e autorizacao

Fluxo atual:

1. Usuario acessa `/login`.
2. Clica em **Entrar com Google**.
3. Supabase processa o OAuth.
4. `/auth/callback` troca o codigo por sessao.
5. `proxy.ts` valida sessao e e-mail autorizado.

E-mails com acesso completo:

- `juliojr0410@gmail.com`
- `carolinneagro@gmail.com`

Ambos possuem papel `admin` na mesma familia. Os logins de Julio e Carol foram validados em producao, incluindo logout, compartilhamento da mesma familia e das mesmas listas. Uma conta nao autorizada tambem foi testada e teve o acesso recusado.

Rotas publicas:

- `/`
- `/login`
- `/auth/callback`

Todos os modulos, incluindo `/compras`, exigem login. Nao deve existir acesso de demonstracao que contorne autenticacao.

Configuracao de URLs no Supabase:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`
- Redirect URL de rede: `http://192.168.0.101:3000/auth/callback`
- Site URL de producao: `https://family-hub-co.vercel.app`
- Redirect URL de producao: `https://family-hub-co.vercel.app/auth/callback`

Nunca usar `0.0.0.0` como URL de retorno no navegador.

## 7. Banco de dados

Migracao principal:

`supabase/migrations/202606110001_shopping_foundation.sql`

Migração complementar de responsáveis:

`supabase/migrations/202606110002_shopping_responsibles.sql`

Tabelas implementadas:

- `families`
- `family_members`
- `shopping_lists`
- `shopping_items`
- `audit_log`

Familia atual:

`Família Julio & Carol`

Regras de seguranca:

- RLS habilitado em todas as tabelas publicas.
- Usuarios autenticados so podem acessar registros da propria familia.
- `family_id` deve acompanhar listas, itens e registros futuros.
- Alteracoes em listas e itens geram entradas no `audit_log`.
- Itens so podem ser criados em uma lista da mesma familia.

Dados de teste inseridos no banco:

- Duas listas ativas: Mercado da Semana e Pet Shop - Flora.
- Tres listas arquivadas: Mercado da Semana, Farmacia e Pet Shop - Flora.
- 29 itens ao todo.
- Ha itens pendentes e concluidos para testar progresso, modo mercado, arquivamento e reabertura.

## 8. Estrutura relevante

```text
src/app/page.tsx                         Hub principal
src/app/login/page.tsx                   Pagina de login
src/app/auth/callback/route.ts           Retorno OAuth
src/app/compras/page.tsx                 Entrada protegida de compras
src/app/globals.css                      Tokens e estilos globais/responsivos
src/components/auth/HubUser.tsx          Sessao, menu e logout no Hub
src/components/auth/LoginForm.tsx        Acao de login Google
src/components/shopping/ShoppingModule.tsx Interface e estado de compras
src/lib/shopping.ts                      Queries e mapeamento do modulo
src/lib/supabase/client.ts               Cliente Supabase do navegador
src/lib/supabase/server.ts               Cliente Supabase do servidor
proxy.ts                                 Protecao de rotas e lista de e-mails
supabase/migrations/                     Schema, RLS, gatilhos e seeds
family-hub-v3.html                       Referencia visual original
```

## 9. Identidade visual

Paleta principal:

```css
--bg: #111210;
--bg2: #1a1c19;
--bg3: #222420;
--surface: #1e201d;
--surface2: #252722;
--border: #2e302b;
--border2: #3a3d36;
--text: #e8e9e4;
--text2: #9a9c94;
--text3: #5a5c54;
--accent: #e8760a;
--accent2: #f59332;
--accent-dim: #3d2004;
--red: #c0392b;
--red-dim: #2d0e0b;
--green: #4a9e6b;
```

Tipografia:

- Bebas Neue: titulos, nomes de modulos e destaques.
- Inter: corpo, botoes e formularios.
- JetBrains Mono: datas, metadados, labels e informacoes tecnicas.

Padroes:

- Cards: fundo `surface`, borda discreta e raio de 14 px.
- Botoes e inputs: raio de 8 px.
- Modais: raio de 20 px e overlay escuro.
- Laranja e a cor de acao e destaque.
- Verde representa conclusao.
- Vermelho representa perigo ou SOS.
- Elementos bloqueados ficam em escala de cinza, com baixa opacidade e sem clique.

Cursor global:

- Elementos comuns usam cursor padrao e nao selecionam texto.
- Botoes, links e controles usam pointer.
- Inputs, selects e textareas permitem cursor e selecao de texto.

## 10. Hub principal

Desktop:

- Mantem o diagrama orbital inspirado em `family-hub-v3.html`.
- Possui tres aneis animados, nucleo central e bolhas posicionadas ao redor.
- Apenas Compras esta ativo.
- O topo exibe logo, data e conta/login.

Celular, ate 720 px:

- Nao tenta comprimir o circulo orbital.
- Usa uma grade de duas colunas com cards de modulos.
- O nucleo vira um cabecalho horizontal da grade.
- SOS ocupa toda a largura.
- Em telas muito estreitas, textos e espacos sao reduzidos sem alterar o desktop.

Regra: novos modulos precisam funcionar tanto na bolha orbital de desktop quanto no card da grade movel.

## 11. Modulo de compras

Funcionalidades prontas:

- Listar listas ativas.
- Criar e editar lista.
- Escolher emoji, nome, data e responsavel.
- Adicionar, marcar e excluir itens.
- Atualizacao otimista ao marcar itens.
- Ordenacao alfabetica dos itens, com pendentes antes dos concluidos.
- Ordenacao de listas por data, com listas sem data ao final.
- Tela de detalhe e progresso.
- Arquivar somente quando todos os itens estiverem concluidos.
- Consultar arquivo e expandir itens.
- Reabrir lista, desmarcando todos os itens.
- Modo Mercado em tela cheia.
- Navegacao interna com historico proprio; nao depender de `router.back()`.

Responsaveis permitidos:

- `Família`
- `Julio`
- `Carol`

Não oferecer `Julio & Carol`. Uma lista antiga que contenha esse valor deve abrir a edição selecionando `Família`, permitindo sua normalização ao salvar.

Comportamento de interacao:

- O cabecalho do card abre o detalhe.
- Clicar na linha do item marca ou desmarca sem abrir o card.
- Excluir item nao propaga o clique.
- Em telas touch, o botao de excluir permanece visivel.
- Erros do banco devem ser apresentados em linguagem compreensivel.

## 12. Responsividade e usabilidade

Breakpoints praticos atuais:

- Acima de 900 px: grade de compras com tres colunas.
- Ate 900 px: duas colunas.
- Ate 620 px: uma coluna e controles otimizados para toque.
- Ate 720 px: Hub troca de orbital para grade.
- Ate 380 px: ajustes para celulares estreitos.

Regras para novas telas:

- Nunca corrigir celular quebrando desktop.
- Alvos de toque devem ter aproximadamente 40 a 44 px.
- Formularios devem empilhar quando duas colunas ficarem apertadas.
- Modais no celular funcionam como painel inferior e respeitam `svh`.
- Acoes essenciais nao podem desaparecer no mobile.
- Navegacao inferior deve mostrar somente opcoes uteis quando nao houver espaco.
- Testar pelo menos 360 px, 390 px, 768 px e desktop.
- Evitar scroll horizontal na pagina.

## 13. Padroes de implementacao

- Preferir Server Components para carregamento inicial e Client Components apenas para interacao.
- Reutilizar os clientes Supabase existentes.
- Manter tipos explicitos e evitar `any`.
- Nao criar abstracoes sem necessidade real.
- Preservar o estilo do codigo e os limites atuais dos modulos.
- Comentarios apenas quando explicarem uma decisao nao obvia.
- Textos da interface em portugues do Brasil.
- Datas formatadas em `pt-BR` e fuso `America/Sao_Paulo` quando aplicavel.
- Nao armazenar estado permanente apenas no navegador; persistir no Supabase.
- Qualquer nova tabela precisa de RLS, indices adequados e isolamento por familia.
- Mudancas importantes devem ter validacao de lint, TypeScript, build e teste visual responsivo.

## 14. Estado da primeira versao

Concluido:

- Projeto Next.js configurado.
- Layout base e identidade visual.
- Hub desktop fiel a referencia.
- Hub movel proprio.
- Google OAuth.
- Login e logout.
- Restricao por e-mail.
- Protecao estrita dos modulos.
- Schema inicial do Supabase, RLS, auditoria e vinculo automatico.
- Modulo de compras completo para a primeira publicacao.
- Dados de teste do modulo.
- Ajustes responsivos principais.
- Deploy de producao na Vercel: `https://family-hub-co.vercel.app`.
- Variaveis publicas do Supabase configuradas na Vercel, sem enviar `SUPABASE_SERVICE_ROLE_KEY`.
- URLs OAuth de producao configuradas no Supabase.
- Login e logout de Julio validados em producao.
- Primeiro login de Carol e vinculo automatico validados em producao.
- Julio e Carol acessam a mesma familia e as mesmas listas.
- Bloqueio de conta nao autorizada validado.
- Sistema em uso real, com a base de testes de Compras limpa e uma lista real iniciada.

Consolidacao da primeira versao concluida:

- `codex/primeira-versao` integrada em `master` pelo Pull Request 1.
- `master` configurada como branch padrao no GitHub.
- `master` configurada como branch de producao na Vercel.
- Novo deploy de producao confirmado apos o merge.

Fila de protecao operacional, sem urgencia nesta etapa:

- Ativar MFA no GitHub, Vercel, Supabase e contas Google.
- Revisar membros e permissoes dessas plataformas.
- Definir uma rotina de backup do Supabase.
- Evitar manipulacoes manuais frequentes no banco de producao.

Fila de monitoramento, sem urgencia nesta etapa:

- Acompanhar logs da Vercel e do Supabase.
- Verificar erros de autenticacao e banco.
- Considerar Vercel Speed Insights.

## 15. Checklist para continuar

Antes de implementar uma nova tarefa:

1. Ler `AGENTS.md` e `README.md`.
2. Conferir `family-hub-v3.html` para o comportamento esperado.
3. Verificar o estado atual do Git sem apagar alteracoes existentes.
4. Confirmar se a tarefa exige alteracao de schema ou RLS.
5. Implementar preservando desktop e mobile.
6. Rodar lint, tipos e build.
7. Testar visualmente nos breakpoints relevantes.
8. Atualizar este documento quando uma decisao estrutural mudar.
