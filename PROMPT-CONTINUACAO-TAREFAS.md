# Prompt para continuar Tarefas

Vamos continuar o Family Hub a partir da branch atualizada de Tarefas.

Antes de mexer no codigo, leia `AGENTS.md`, `README.md`, `TASKS.md`, `DESIGN.md` e `BRAIN.md`.

Contexto:

- O PWA mobile ja esta publicado em producao.
- Compras e Financeiro estao em uso real.
- A primeira base experimental de Tarefas ja existe nesta branch, mas os acessos pelo menu lateral, navigation mobile e tela inicial estao bloqueados ate revisao.
- O nome atual sera Tarefas por enquanto.
- Tarefas deve ser exclusiva por usuario, diferente de Compras/Financeiro que sao por familia.
- A experiencia deve seguir o padrao visual do Family Hub e funcionar bem no desktop e responsivo.
- Frequencias esperadas: diario, semanal, quinzenal, mensal e dias especificos.
- Deve permitir concluir/desfazer, editar/excluir, metas de quantidade como agua, sequencia zerando quando passar um dia previsto sem cumprir, e notificacoes preparadas porem bloqueadas.
- Transacoes financeiras agora sao sempre avulsas; contas podem ser fixas ou variaveis recorrentes.
- Existe backlog para detalhar contas variaveis como Cartao de credito sem duplicar o total nas transacoes.

Objetivo:

Revisar a primeira base de Tarefas, propor e implementar apenas os ajustes necessarios para uma primeira versao pequena e util. So desbloqueie os acessos de Tarefas se a experiencia estiver aprovada.

Validacao obrigatoria ao final:

```powershell
npm.cmd run lint
npm.cmd exec tsc -- --noEmit
npm.cmd run build
```
