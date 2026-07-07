update public.finance_transactions
set category = 'Receita',
    updated_at = now()
where type = 'income'
  and category <> 'Receita';
