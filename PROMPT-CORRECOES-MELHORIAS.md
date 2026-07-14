# Prompt para correcoes de bugs e melhorias do Family Hub

Vamos continuar o Family Hub em uma nova branch limpa para correcoes de bugs e melhorias pequenas de uso real.

Antes de mexer no codigo, leia `AGENTS.md`, `README.md`, `TASKS.md`, `DESIGN.md` e `BRAIN.md`.

Contexto:

- O PWA mobile ja esta publicado em producao.
- Compras e Financeiro estao em uso real.
- Tarefas possui uma primeira versao pequena desbloqueada na navegacao desktop e mobile para teste.
- Financeiro, Compras, Tarefas e Familia usam dados reais; nao criar dados ficticios nem executar operacoes destrutivas.
- Desenvolvimento, Preview e producao podem compartilhar o mesmo Supabase, entao qualquer mudanca de dados/schema precisa de cuidado extra.
- Transacoes financeiras sao sempre avulsas; Contas podem ser fixas ou variaveis recorrentes.
- Movimentacoes diretas de Reserva aparecem em Transacoes como reserva, mas nao somam em receitas, despesas, saldo comum ou margem planejada.
- Financeiro mobile ja recebeu cards minimizaveis, filtros recolhiveis, abas sem scrollbar aparente cortando itens, pull-to-refresh interno, feedback visual ao pagar contas e dropdown no Orcamento para ver itens por categoria.
- Compras e Tarefas receberam ajustes mobile recentes e devem continuar funcionando bem no PWA instalado.
- A branch `codex/logo-splash-animada` esta pausada. Nao misturar a finalizacao da nova logo/splash com esta rodada; esse tema fica para retomada separada.

Objetivo:

Corrigir bugs e aplicar melhorias pequenas, priorizando problemas observados em uso real. Manter o escopo curto, preservar o visual do Family Hub, validar desktop e responsivo, e evitar qualquer alteracao que possa afetar dados reais sem aprovacao explicita.

Forma de trabalho:

- Comecar a partir da `master` atualizada ou da branch base indicada pelo Julio.
- Criar uma branch nova com nome descritivo, por exemplo `codex/correcoes-mobile-financeiro`.
- Antes de alterar algo, identificar exatamente quais telas/fluxos serao afetados.
- Corrigir primeiro bugs funcionais; depois refinamentos visuais ou de usabilidade.
- Nao refatorar areas fora do escopo.
- Nao mexer em migrations, RLS ou dados reais sem confirmar o impacto.
- Garantir que ajustes mobile nao quebrem desktop, e vice-versa.
- Se mexer em PWA, splash, manifest, icones, status bar ou safe area, registrar que precisa testar no iPhone removendo e adicionando novamente o atalho.

Validacao recomendada:

```powershell
npm.cmd run lint
npm.cmd exec tsc -- --noEmit
npm.cmd run build
```

Para mudancas pequenas durante iteracao local, pode rodar primeiro apenas a verificacao mais relevante, mas antes de publicar Preview ou PR deve executar a validacao completa.
