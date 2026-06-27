# Prompt base - Novo layout do Family Hub

Use o texto abaixo ao iniciar uma nova janela do Codex para continuar o projeto com foco em um novo layout geral.

```text
Continuaremos o projeto Family Hub. Nesta nova sessao, o foco sera revisar e propor um novo layout geral para o sistema, sem alterar banco de dados nem quebrar funcionalidades publicadas.

Antes de qualquer alteracao:
1. Leia AGENTS.md e README.md integralmente.
2. Consulte DESIGN.md, BRAIN.md e family-hub-v3.html como referencias historicas e visuais.
3. Use PRIMEIRA-VERSAO.md e PROMPT-HISTORICO.md apenas como registro historico.
4. Confira o estado atual do Git e sincronize a master sem apagar ou reverter alteracoes existentes.
5. Crie uma branch nova a partir da master atualizada. Nome sugerido: codex/novo-layout.
6. Leia a documentacao da versao instalada do Next.js em node_modules/next/dist/docs/ antes de alterar codigo do framework.

Contexto atual:
- Aplicacao Next.js 16.2.9, React 19.2.4 e TypeScript strict.
- Supabase fornece autenticacao, PostgreSQL e RLS.
- Google OAuth e a unica forma de login.
- Usuarios autorizados: Julio e Carol, ambos admins da mesma familia.
- Producao: https://family-hub-co.vercel.app
- master e a branch oficial do GitHub e da producao na Vercel.
- Lista de Compras esta publicada e em uso real.
- Modulo Financeiro esta publicado em producao e em teste de uso real.
- Financeiro inclui Visao Geral, Transacoes, Contas, Orcamento, Reserva e exportacao PNG/CSV/JSON.
- Aba Investimentos permanece bloqueada para etapa futura.
- Categorias financeiras exibem somente categorias cadastradas no Orcamento, exceto quando ainda nao houver nenhuma categoria.
- A modal CONFIGURAR RESERVA segue o layout completo do family-hub-v3.html.

Atencao ao banco:
- Por enquanto, desenvolvimento, Preview e producao podem usar o mesmo projeto Supabase.
- As branches isolam o codigo, mas nao isolam os dados.
- Nao criar dados ficticios nem executar operacoes destrutivas no banco real.
- Para esta sessao de layout, nao criar migrations nem alterar schema sem aprovacao explicita.
- SUPABASE_SERVICE_ROLE_KEY nao deve ser enviada a Vercel nem ao navegador.

Objetivo desta sessao:
1. Inspecionar o layout atual do Hub, Compras e Financeiro.
2. Entender quais partes do family-hub-v3.html continuam desejadas e quais podem evoluir.
3. Propor direcoes visuais para um novo layout geral, incluindo navegacao, home/hub, telas internas, mobile e desktop.
4. Preservar as funcionalidades ja publicadas e a seguranca.
5. Antes de implementar, apresentar uma proposta incremental e aguardar aprovacao.

Regras permanentes:
- Nao apagar nem reverter alteracoes existentes.
- Nao alterar schema ou dados reais sem aprovacao.
- Preservar autenticacao, RLS, responsividade e textos em portugues do Brasil.
- Datas em pt-BR e fuso America/Sao_Paulo quando aplicavel.
- Evitar any e manter TypeScript strict.
- Nao adicionar abstracoes sem necessidade real.
- Testar desktop e mobile nos breakpoints relevantes.
- Durante exploracao incremental, trabalhar e testar localmente sem fazer push ou gerar Preview a cada pequena alteracao.
- Publicar Preview somente quando houver uma versao candidata completa e estavel.
- Antes de concluir qualquer mudanca de codigo, executar:
  npm.cmd run lint
  npm.cmd exec tsc -- --noEmit
  npm.cmd run build
- Quando a versao candidata estiver estavel, seguir o fluxo: branch -> push -> Preview -> configuracao OAuth do Preview se necessario -> Pull Request -> revisao -> merge na master -> Production.

Primeira tarefa da nova sessao:
- Nao implementar ainda.
- Inspecionar o codigo e os documentos.
- Mapear o layout atual.
- Propor 2 ou 3 caminhos visuais possiveis para o novo layout, com pros/contras e impacto em desktop/mobile.
- Recomendar uma primeira etapa pequena, completa e testavel.
- Aguardar aprovacao antes de editar arquivos.
```
