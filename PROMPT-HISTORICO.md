# Prompt base - Modulo Financeiro

Use o texto abaixo ao iniciar uma nova janela do Codex:

```text
Continuaremos o projeto Family Hub e iniciaremos a construcao do modulo Financeiro.

Antes de qualquer alteracao:
1. Leia AGENTS.md e README.md integralmente.
2. Consulte BRAIN.md, DESIGN.md e family-hub-v3.html como referencias.
3. Use PRIMEIRA-VERSAO.md apenas como registro historico.
4. Confira o estado atual do Git e sincronize a master sem apagar ou reverter alteracoes existentes.
5. Crie uma branch nova a partir da master atualizada. Nome sugerido: codex/modulo-financeiro.
6. Leia a documentacao da versao instalada do Next.js em node_modules/next/dist/docs/ antes de alterar codigo do framework.

Contexto atual:
- Aplicacao Next.js 16.2.9, React 19.2.4 e TypeScript strict.
- Supabase fornece autenticacao, PostgreSQL e RLS.
- Google OAuth e a unica forma de login.
- Usuarios autorizados: Julio e Carol, ambos admins da mesma familia.
- RLS esta habilitado nas tabelas publicas.
- Lista de Compras esta funcional e em uso real.
- Hub desktop e mobile estao funcionando.
- Producao: https://family-hub-co.vercel.app
- master e a branch oficial do GitHub e da producao na Vercel.
- SUPABASE_SERVICE_ROLE_KEY nao deve ser enviada a Vercel nem ao navegador.

Atencao ao banco:
- Por enquanto, desenvolvimento, Preview e producao podem usar o mesmo projeto Supabase.
- As branches isolam o codigo, mas nao isolam os dados.
- Nao criar dados ficticios nem executar operacoes destrutivas no banco real.
- Toda mudanca de schema deve ser feita por migration versionada, revisavel e compativel com os dados existentes.
- Toda nova tabela publica precisa de family_id, indices adequados, RLS e policies que limitem o acesso a familia do usuario.
- Acoes financeiras criticas devem gerar auditoria quando aplicavel.

Objetivo do modulo Financeiro:
- Construir o modulo de forma incremental, segura e responsiva.
- Preservar a identidade visual aprovada no mockup family-hub-v3.html.
- Ativar o modulo Financeiro no Hub desktop e mobile somente quando existir uma primeira etapa realmente utilizavel.

Escopo funcional previsto em BRAIN.md:
- Visao Geral: cards de resumo, fluxo de caixa, categorias e reserva de emergencia.
- Transacoes: receitas, despesas e reserva, com filtros e CRUD.
- Contas: compromissos recorrentes, status e geracao de transacao ao pagar.
- Orcamento: teto mensal por categoria com semaforo.
- Investimentos: aportes e rentabilidade registrados manualmente.

Nao tente implementar todo o modulo de uma vez.

Primeira tarefa da nova sessao:
1. Inspecionar o codigo atual, o mockup financeiro e as especificacoes.
2. Propor uma divisao incremental do modulo, incluindo schema, RLS, telas e ordem de entrega.
3. Identificar decisoes que precisam ser confirmadas antes de criar tabelas financeiras.
4. Recomendar uma primeira etapa pequena, completa e testavel.
5. Apos apresentar a proposta, aguardar minha aprovacao antes de aplicar migrations ou criar estruturas definitivas no banco.

Regras permanentes:
- Nao apagar nem reverter alteracoes existentes.
- Preservar seguranca, RLS, responsividade e identidade visual.
- Durante a construcao incremental, trabalhar e testar localmente sem fazer push ou gerar Preview a cada pequena alteracao.
- Acumular alteracoes coerentes na branch e publicar uma Preview somente quando existir uma versao candidata completa e estavel nos testes locais.
- Configurar a URL OAuth do Preview no Supabase somente no momento da revisao integrada dessa versao candidata.
- Textos da interface em portugues do Brasil.
- Datas em pt-BR e fuso America/Sao_Paulo quando aplicavel.
- Evitar any e manter TypeScript strict.
- Nao adicionar abstracoes sem necessidade real.
- Testar desktop e mobile nos breakpoints relevantes.
- Antes de concluir qualquer mudanca, executar:
  npm.cmd run lint
  npm.cmd exec tsc -- --noEmit
  npm.cmd run build
- Quando a versao candidata estiver estavel, seguir o fluxo: branch -> push -> Preview -> configuracao OAuth do Preview -> Pull Request -> revisao -> merge na master -> Production.
```
