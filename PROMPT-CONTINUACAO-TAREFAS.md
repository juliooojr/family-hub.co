# Prompt para continuar Family Hub

Vamos continuar o Family Hub a partir da `master` atualizada apos o PR #9.

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
- Compras agora possui finalizacao confirmada, reaproveitamento de pendencias em +7 dias, URL opcional por item e sincronizacao em tempo real entre membros.
- O Modo Mercado mobile possui rolagem interna, folga inferior, saida fixa e esconde a navegacao global.
- As migrations `202607130001_shopping_finish_and_product_urls.sql` e `202607130002_shopping_realtime.sql` precisam estar aplicadas no Supabase.
- Local, Preview, Production e PWA sao ambientes diferentes. O PWA instalado sempre abre Production; OAuth mobile deve ser validado em Preview HTTPS.

Objetivo:

Confirmar migrations e deploy do PR #9, validar Compras simultaneamente com dois usuarios no PWA instalado e revisar Financeiro/Tarefas sem ampliar o escopo nem mexer em dados reais de forma destrutiva.

Validacao obrigatoria ao final de subir para produção, não precisa ser depois de qualquer coisa:

```powershell
npm.cmd run lint
npm.cmd exec tsc -- --noEmit
npm.cmd run build
```

## Estado para a proxima sessao

- Tarefas possui Web Push individual por usuario e aparelho; fuso vem do aparelho e frequencia/dias especificos sao respeitados.
- Tarefa concluida na data local nao recebe lembrete. Deduplicacao considera tarefa, aparelho, data e horario, permitindo reagendar para mais tarde no mesmo dia.
- Tocar na notificacao abre `/tarefas`. O rotulo externo `From` pertence ao navegador/sistema e nao pode ser customizado.
- Push usa `NEXT_PUBLIC_VAPID_PUBLIC_KEY` na Vercel, secrets VAPID/CRON no Supabase, Edge Function `task-reminders` e Cron por minuto.
- `202607140001_task_push_subscriptions.sql` e `202607140002_task_reminder_reschedule.sql` devem estar aplicadas; a Edge Function deve estar publicada na versao atual.
- Compras e navegacao usam Lucide; Familia fica no menu mobile; logout exige confirmacao; controles de tema usam lua/sol vetoriais.
- O PR #11 foi integrado em `master`; proximas mudancas devem partir da `master` atualizada.
