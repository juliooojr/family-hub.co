# Migrations do Supabase

Este documento define o procedimento obrigatorio para qualquer alteracao no banco do Family Hub.

## Contexto atual

- O projeto Supabase de Production e `family-hub`.
- O reference ID e `ysjvhapbrvepotnovpmp`.
- Enquanto nao existir um ambiente separado, desenvolvimento, Preview e Production podem compartilhar o mesmo banco.
- Em 06/08/2026, o historico remoto foi reconciliado com as migrations versionadas do repositorio.
- A migration `202608050001_activity_audit_transitions.sql` foi aplicada pelo CLI e validada no banco.

O Supabase CLI compara os arquivos de `supabase/migrations` com a tabela remota `supabase_migrations.schema_migrations`. Executar SQL manualmente pelo SQL Editor altera o banco, mas nao registra automaticamente a migration nessa tabela.

## Regras obrigatorias

1. Toda alteracao de schema ou dados estruturais deve nascer em um arquivo versionado dentro de `supabase/migrations`.
2. Nao executar primeiro pelo SQL Editor e criar a migration depois.
3. Antes de aplicar, revisar o arquivo completo e identificar qualquer operacao destrutiva ou bloqueante.
4. Confirmar que o CLI esta conectado ao projeto correto.
5. Executar sempre `db push --dry-run` antes de `db push`.
6. O dry-run deve listar somente as migrations esperadas.
7. Confirmar backup/PITR antes de migrations com risco para dados.
8. Depois da aplicacao, conferir o historico e validar o comportamento afetado.
9. Nunca usar `db reset --linked` em Production.
10. Nunca incluir senha do banco, access token, service role key ou secrets no Git, terminal compartilhado ou documentacao.

## Fluxo padrao para uma nova migration

Na raiz do projeto, atualizar a `master` e criar uma branch de trabalho:

```powershell
git switch master
git pull origin master
git switch -c codex/nome-da-alteracao
```

Criar o arquivo de migration pelo CLI:

```powershell
npx.cmd supabase migration new nome_da_alteracao
```

Editar o arquivo criado em `supabase/migrations` e revisar:

- tabelas, colunas, indices, constraints, triggers e funcoes afetadas;
- compatibilidade com o codigo que ainda esta em Production;
- preservacao dos dados existentes;
- RLS e policies das tabelas publicas;
- possibilidade de rollback ou correcao aditiva;
- tempo de bloqueio em tabelas que ja possuem dados.

## Conectar e conferir o projeto

```powershell
npx.cmd supabase projects list
npx.cmd supabase link --project-ref ysjvhapbrvepotnovpmp
npx.cmd supabase migration list --linked
```

O projeto `family-hub` deve aparecer como `LINKED`. Antes de continuar, as migrations antigas precisam aparecer com a mesma versao nas colunas `Local` e `Remote`.

O diretorio `supabase/.temp` guarda o vinculo local, e ignorado pelo Git e pode ser recriado com `supabase link`.

## Simulacao obrigatoria

```powershell
npx.cmd supabase db push --dry-run
```

Conferir o nome de cada migration listada. Se aparecer uma migration antiga, inesperada ou ja aplicada manualmente, parar. Nao executar o push ate reconciliar o historico.

## Aplicacao

Com o dry-run correto e o impacto aprovado:

```powershell
npx.cmd supabase db push
```

Nao fechar o terminal antes de confirmar que a aplicacao terminou sem erros.

## Validacao posterior

```powershell
npx.cmd supabase migration list --linked
npx.cmd supabase db push --dry-run
```

Resultado esperado:

- todas as migrations aparecem dos dois lados, `Local` e `Remote`;
- o novo dry-run nao apresenta migration pendente;
- as consultas funcionais da mudanca retornam o resultado esperado;
- o aplicativo continua compativel em Preview e Production.

## Publicacao de codigo que depende da migration

Quando frontend e migration fazem parte da mesma entrega:

1. Preparar e revisar codigo e migration na mesma branch.
2. Verificar se a migration e compativel com a versao ainda publicada.
3. Aplicar a migration somente no momento aprovado para a entrega.
4. Validar o banco.
5. Publicar o codigo pelo fluxo de Pull Request.

Preferir migrations aditivas e retrocompativeis. Mudancas que removem ou renomeiam estruturas devem ser divididas em etapas para que a versao antiga e a nova do aplicativo possam coexistir durante o deploy.

## Uso excepcional do SQL Editor

O SQL Editor deve ser usado normalmente para consultas de leitura, auditorias e validacoes. Para alterar o banco, use-o apenas quando houver uma necessidade operacional explicita.

Se uma migration precisar ser executada manualmente:

1. Criar e versionar primeiro o arquivo em `supabase/migrations`.
2. Confirmar o projeto e o backup.
3. Executar exatamente o conteudo revisado no SQL Editor.
4. Validar que a alteracao foi realmente aplicada.
5. Registrar apenas essa versao no historico:

```powershell
npx.cmd supabase migration repair NUMERO_DA_MIGRATION --status applied --linked
```

6. Conferir:

```powershell
npx.cmd supabase migration list --linked
npx.cmd supabase db push --dry-run
```

`migration repair` altera somente o historico. Ele nao executa o SQL da migration. Nunca marcar como aplicada uma migration cujo efeito nao tenha sido comprovado no banco.

## Comandos proibidos em Production

Nao executar:

```powershell
npx.cmd supabase db reset --linked
```

Tambem nao executar migrations destrutivas, `DROP`, `TRUNCATE`, limpezas amplas ou alteracoes irreversiveis sem backup confirmado, plano de recuperacao e aprovacao explicita.

## Diagnostico de historico divergente

Se `migration list --linked` mostrar uma versao apenas em `Local`:

- ela pode estar realmente pendente; ou
- pode ter sido aplicada manualmente sem registro.

Antes de qualquer reparo:

1. Ler o SQL da migration.
2. Consultar tabelas, colunas, funcoes, constraints e dados que comprovem seu efeito.
3. Se estiver aplicada, usar `migration repair ... --status applied`.
4. Se nao estiver aplicada, deixar como pendente e usar `db push --dry-run` antes de aplicá-la.

Se uma versao aparecer apenas em `Remote`, nao apagar o registro automaticamente. Investigar se o arquivo local foi perdido, renomeado ou ficou fora do Git.

## Checklist para assistentes e mantenedores

Sempre que o trabalho envolver Supabase, informar explicitamente:

- qual projeto esta conectado;
- qual migration sera criada ou aplicada;
- quais objetos e dados ela afeta;
- se existe operacao destrutiva;
- qual consulta ou teste comprova o resultado;
- comandos exatos de dry-run, aplicacao e validacao;
- ordem entre migration, Preview, PR e Production.

