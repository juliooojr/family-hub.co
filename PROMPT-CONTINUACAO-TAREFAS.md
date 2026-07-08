# Prompt para continuar Family Hub

Vamos continuar o Family Hub a partir da branch atualizada de Tarefas/ajustes mobile.

Antes de mexer no codigo, leia `AGENTS.md`, `README.md`, `TASKS.md`, `DESIGN.md` e `BRAIN.md`.

Contexto:

- O PWA mobile ja esta publicado em producao.
- Compras e Financeiro estao em uso real.
- Tarefas ja possui uma primeira versao pequena desbloqueada na navegacao desktop e mobile para teste.
- O nome atual sera Tarefas por enquanto.
- Tarefas deve ser exclusiva por usuario, diferente de Compras/Financeiro que sao por familia.
- A experiencia deve seguir o padrao visual do Family Hub e funcionar bem no desktop e responsivo.
- Frequencias esperadas: diario, semanal, quinzenal, mensal e dias especificos.
- Deve permitir concluir/desfazer, editar/excluir, metas de quantidade como agua, sequencia zerando quando passar um dia previsto sem cumprir, e notificacoes preparadas porem bloqueadas.
- Transacoes financeiras agora sao sempre avulsas; contas podem ser fixas ou variaveis recorrentes.
- Existe backlog para detalhar contas variaveis como Cartao de credito sem duplicar o total nas transacoes.
- Financeiro mobile recebeu: cards visiveis por padrao com opcao de minimizar, filtros de Transacoes recolhiveis, abas sem scrollbar aparente cortando itens, pull-to-refresh interno, feedback visual ao pagar contas e dropdown no Orcamento para ver itens por categoria.
- Movimentacoes diretas de Reserva aparecem em Transacoes como reserva, mas nao somam em receitas, despesas, saldo comum ou margem planejada.
- Compras e Tarefas receberam ajustes mobile recentes e devem ser revalidados no PWA instalado.

Objetivo:

Validar a versao publicada no PWA instalado, especialmente Financeiro, Compras e Tarefas. Corrigir apenas refinamentos observados em uso real, mantendo o escopo pequeno e sem mexer em dados reais de forma destrutiva.

Validacao obrigatoria ao final:

```powershell
npm.cmd run lint
npm.cmd exec tsc -- --noEmit
npm.cmd run build
```
