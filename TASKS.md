# FAMILY HUB - ESTADO ATUAL E PROXIMOS PASSOS

Atualizado em 03/07/2026. Este arquivo acompanha o estado real do projeto. O planejamento original permanece em `PRIMEIRA-VERSAO.md` apenas como registro historico.

## Concluido

- [x] Next.js 16, React 19 e TypeScript strict.
- [x] Login exclusivo por Google OAuth para Julio e Carol.
- [x] Supabase com familias, membros, RLS e auditoria.
- [x] Hub responsivo para desktop e mobile.
- [x] Lista de Compras persistida e em uso real.
- [x] Financeiro com Visao Geral, Transacoes, Contas e Orcamento.
- [x] CRUD de transacoes, contas e categorias de orcamento.
- [x] Pagamentos mensais de contas sem criar transacao duplicada.
- [x] Reserva de emergencia por movimentacao direta ou conta da categoria Reserva.
- [x] Exportacao financeira em PNG, CSV e JSON.
- [x] Aba Investimentos preservada e bloqueada para entrega futura.
- [x] Categorias financeiras exibidas conforme cadastro real do Orcamento.
- [x] Modal de configuracao da reserva alinhada ao layout completo do `family-hub-v3.html`.
- [x] Modulo Financeiro integrado na `master` e publicado em producao.
- [x] Nova home publica com entrada pelo Google.
- [x] Novo Hub interno com resumo de Compras, Contas e Reserva.
- [x] Navegacao unificada no desktop e mobile.
- [x] Temas claro e escuro no novo layout.
- [x] Remocao dos componentes e assets antigos sem uso.
- [x] PWA mobile instalavel publicado em producao.
- [x] Manifest, service worker, offline fallback, icone proprio e splash screen iOS.
- [x] Ajustes de safe area, status bar e navegacao inferior para uso pelo atalho do iPhone.
- [x] Modais de Compras revisadas para responsividade mobile e teclado aberto.
- [x] Navegacao interna com prefetch nas rotas principais.
- [x] Melhorias de UX de uso real no Financeiro: data atual em nova transacao, ordenacao cronologica por data registrada, grafico mensal clicavel com valores, filtros compactos e recorrencias/categorias preservando meses anteriores.
- [x] Ajuste do callback/logout do Google OAuth para persistir cookies de sessao no redirect e evitar falha na primeira tentativa de login.
- [x] Melhorias de UX de uso real em Compras: Modo Mercado revisado no desktop, preco opcional discreto em itens e edicao de itens.

## Publicacao do Financeiro

- [x] Migration versionada com tabelas financeiras vazias.
- [x] `family_id`, indices, RLS e policies em todas as tabelas publicas novas.
- [x] Auditoria de alteracoes financeiras criticas.
- [x] Interface ligada ao Supabase sem dados ficticios.
- [x] Aplicar a migration no projeto Supabase compartilhado.
- [x] Validar no Preview com Julio.
- [x] Revisar e integrar o Pull Request na `master`.
- [x] Confirmar o deploy de Production na Vercel.

## Validacao obrigatoria

- [x] `npm.cmd run lint`
- [x] `npm.cmd exec tsc -- --noEmit`
- [x] `npm.cmd run build`
- [x] Validacao desktop das melhorias de Financeiro, Compras e login.
- [x] Testar desktop e mobile nos breakpoints relevantes durante a validacao do Financeiro.
- [x] Confirmar isolamento por familia e ausencia de secrets no navegador.

## Proximas entregas

- [x] Novo layout geral do sistema, mantendo seguranca, responsividade e funcoes ja publicadas.
- [x] App mobile PWA sem publicacao em loja.
- [x] Melhorias de UX observadas apos uso real do app instalado.
- [ ] Validar no mobile PWA instalado as melhorias de Compras, Financeiro e login apos publicacao.
- [ ] Nova secao Tarefas, nome final e escopo a definir em breve.
- [ ] Investimentos, somente quando houver escopo aprovado.
- [ ] Calendario com Google Calendar.
- [ ] Flora.
- [ ] Documentos.
- [ ] Emergencia.

## Regras permanentes

- Nao apagar nem reverter dados ou alteracoes existentes.
- Nao usar `SUPABASE_SERVICE_ROLE_KEY` no navegador ou na Vercel.
- Toda tabela publica deve ter `family_id`, indices e RLS.
- Toda mudanca de schema deve ser uma migration versionada e revisavel.
- Desenvolvimento permanece local ate existir uma versao estavel para Preview.
- Fluxo de entrega: branch, Preview, Pull Request, revisao, merge na `master`, Production.
- Mudancas em PWA, manifest, icones, splash screen e status bar devem ser testadas no iPhone removendo e adicionando novamente o atalho.
