# FAMILY HUB - ESTADO ATUAL E PROXIMOS PASSOS

Atualizado em 15/06/2026. Este arquivo acompanha o estado real do projeto. O planejamento original permanece em `PRIMEIRA-VERSAO.md` apenas como registro historico.

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

## Publicacao do Financeiro

- [x] Migration versionada com tabelas financeiras vazias.
- [x] `family_id`, indices, RLS e policies em todas as tabelas publicas novas.
- [x] Auditoria de alteracoes financeiras criticas.
- [x] Interface ligada ao Supabase sem dados ficticios.
- [x] Aplicar a migration no projeto Supabase compartilhado.
- [x] Validar no Preview com Julio.
- [ ] Revisar e integrar o Pull Request na `master`.
- [ ] Confirmar o deploy de Production na Vercel.

## Validacao obrigatoria

- [x] `npm.cmd run lint`
- [x] `npm.cmd exec tsc -- --noEmit`
- [x] `npm.cmd run build`
- [ ] Testar desktop e mobile nos breakpoints relevantes.
- [ ] Confirmar isolamento por familia e ausencia de secrets no navegador.

## Proximas entregas

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
