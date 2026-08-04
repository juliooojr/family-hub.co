# Safety scripts da migration multi-familia

Use estes arquivos apenas pelo Supabase SQL Editor, com revisao manual.

## Antes de aplicar a migration

1. Confirme que o codigo local esta na branch `codex/multi-familia-convites`.
2. Rode `202607080001_pre_multi_family_backup.sql`.
3. Confira o resultado com contagens de tabelas.
4. Depois rode `supabase/migrations/202607080001_multi_family_invites.sql`.

## Se precisar voltar

1. Volte o codigo para uma versao anterior a multi-familia.
2. Rode `202607080001_multi_family_safe_rollback.sql`.
3. Teste login de Julio e Carol.
4. Nao apague familias novas automaticamente. Se houver dados criados em teste, revise ids e impactos antes de limpar.

## Observacao

O melhor backup continua sendo backup/PITR do Supabase antes da migration. Estes scripts sao uma camada adicional de seguranca logica dentro do banco.

## Migrations de Compras de 13/07/2026

- `202607130001_shopping_finish_and_product_urls.sql`: aditiva; cria `product_url` e a funcao atomica `finish_shopping_list`.
- `202607130002_shopping_realtime.sql`: aditiva; inclui `shopping_lists` e `shopping_items` na publicacao `supabase_realtime` somente quando ainda nao estiverem presentes.
- Aplicar na ordem acima e confirmar no Network do navegador que `finish_shopping_list` nao retorna `PGRST202`.
- Depois, testar sincronizacao com dois membros reais da mesma familia, sem criar dados ficticios.
