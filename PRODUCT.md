# Family Hub — produto e regras permanentes

## Propósito

O Family Hub centraliza rotinas importantes de uma família em um ambiente privado, responsivo e simples de consultar. A Home deve mostrar rapidamente o estado da casa e os acontecimentos relevantes, sem virar um log técnico.

## Módulos atuais

- **Finanças:** visão geral, transações, contas, orçamento e reserva de emergência compartilhados pela família.
- **Compras:** listas e itens compartilhados, modo mercado, arquivo, preços e links opcionais, finalização e sincronização em tempo real.
- **Tarefas:** rotinas pessoais por usuário, frequência, metas de quantidade ou conclusão e lembretes Web Push.
- **Família:** criação aberta, papéis `owner`, `admin` e `member`, convites com expiração e gerenciamento de membros.
- **Atividade da Família:** feed dos acontecimentos relevantes, com até oito eventos na Home e histórico dedicado.

Agenda permanece como módulo futuro. Investimentos só deve ser ativado quando houver escopo aprovado.

## Regras de produto

- Textos da interface em português do Brasil.
- Datas e horários em `America/Sao_Paulo` quando aplicável.
- Financeiro e Compras são compartilhados por `family_id`.
- Tarefas permanecem pessoais por `user_id`, sempre vinculadas a `family_id`.
- Conta paga não deve gerar uma transação duplicada.
- Movimentações da reserva não entram em receitas, despesas ou saldo comum.
- Lista concluída pode mover itens pendentes para uma nova lista.
- O feed familiar registra somente ações úteis para os demais membros.
- Funcionalidades futuras devem entrar de forma incremental, completa e testável.

## Segurança e dados

- Google OAuth é o único método de autenticação.
- Nenhuma rota privada pode funcionar sem sessão válida.
- Toda tabela pública deve ter RLS, `family_id` e índices adequados.
- Policies devem restringir dados à família autenticada e, quando necessário, ao próprio usuário.
- `SUPABASE_SERVICE_ROLE_KEY` nunca pode chegar ao navegador ou à Vercel.
- Mudanças de schema são feitas exclusivamente por migrations versionadas e revisáveis.
- Não inserir dados fictícios ou executar ações destrutivas no Supabase compartilhado.
- Ações sensíveis devem alimentar `audit_log` quando aplicável.

## Experiência

- Temas claro e escuro devem permanecer equivalentes.
- Desktop, navegador mobile e PWA instalado são superfícies suportadas.
- Layouts devem funcionar em 360 px, 390 px, 768 px e desktop.
- Não corrigir mobile quebrando desktop, nem o inverso.
- Modais devem permanecer utilizáveis com teclado aberto e safe areas do iOS.
- Elementos bloqueados ficam visivelmente inativos e sem navegação.
- Verde indica conclusão, laranja é o destaque principal e vermelho representa perigo.

## Entrega

O fluxo oficial é `branch -> testes locais -> Preview -> Pull Request -> revisão -> master -> Production`. A `master` deve conter apenas versões completas e utilizáveis. Rollbacks são feitos por redeploy estável ou `git revert`, nunca reescrevendo o histórico.
