# Prompt de continuidade - Family Hub

Use o texto abaixo ao iniciar uma nova janela do Codex para continuar o projeto a partir do estado atual.

```text
Continuaremos o projeto Family Hub. O novo layout geral ja foi implementado, integrado na master e publicado em producao. Nesta nova sessao, primeiro confirme o estado real do projeto antes de propor ou alterar qualquer coisa.

Antes de qualquer alteracao:
1. Leia AGENTS.md e README.md integralmente.
2. Consulte TASKS.md para o backlog atual.
3. Consulte DESIGN.md, BRAIN.md e family-hub-v3.html como referencias historicas e visuais.
4. Use PRIMEIRA-VERSAO.md e PROMPT-HISTORICO.md apenas como registro historico.
5. Confira o estado atual do Git, confirme que esta na master e sincronize com origin/master sem apagar ou reverter alteracoes existentes.
6. Se for desenvolver algo novo, crie uma branch nova a partir da master atualizada, com nome codex/<descricao>.
7. Leia a documentacao da versao instalada do Next.js em node_modules/next/dist/docs/ antes de alterar codigo do framework.

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
- Nova home publica esta funcionando com entrada pelo Google.
- Novo Hub interno esta funcionando com resumo de Compras, Contas e Reserva.
- Navegacao autenticada esta unificada com menu lateral no desktop e barra inferior no mobile.
- Temas claro e escuro existem na home publica e nas areas autenticadas.
- Componentes antigos de login/usuario e SVGs padrao do Next foram removidos.

Atencao ao banco:
- Por enquanto, desenvolvimento, Preview e producao podem usar o mesmo projeto Supabase.
- As branches isolam o codigo, mas nao isolam os dados.
- Nao criar dados ficticios nem executar operacoes destrutivas no banco real.
- Nao criar migrations nem alterar schema sem aprovacao explicita.
- Toda nova tabela publica deve ter family_id, indices, RLS e policies adequadas.
- SUPABASE_SERVICE_ROLE_KEY nao deve ser enviada a Vercel nem ao navegador.

Prioridades atuais:
1. Acompanhar o uso real do novo layout e do modulo Financeiro.
2. Corrigir eventuais ajustes de UX, responsividade ou autenticacao encontrados em producao.
3. Ativar MFA no GitHub, Vercel, Supabase e contas Google.
4. Revisar membros e permissoes das plataformas.
5. Definir rotina de backup do Supabase.
6. Acompanhar logs da Vercel e do Supabase.
7. Futuras entregas de produto: Investimentos, Calendario com Google Calendar, Flora, Documentos e Emergencia.

Regras permanentes:
- Nao apagar nem reverter alteracoes existentes.
- Nao alterar schema ou dados reais sem aprovacao.
- Preservar autenticacao, autorizacao, RLS, responsividade e textos em portugues do Brasil.
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
- Inspecionar Git, README.md e TASKS.md.
- Confirmar se a producao e a master estao alinhadas.
- Perguntar qual prioridade seguir se o pedido inicial nao especificar claramente uma tarefa.
- Se a tarefa for tecnica, propor uma primeira etapa pequena, completa e testavel antes de implementar algo grande.
```
