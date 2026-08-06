# Atividade da Família

## Objetivo

Substituir o card `Hoje em Tarefas` da Home por um feed cronológico de ações relevantes da casa, sem transformá-lo em um log técnico.

## Experiência

- A Home exibe no máximo os 8 eventos mais recentes, do mais recente para o mais antigo.
- Cada linha apresenta o ícone oficial do módulo, descrição e tempo relativo.
- Não há avatares, datas completas ou bordas de destaque.
- `Ver histórico` abre `/atividades`, com o histórico relevante disponível.
- Quando não houver eventos relevantes, o componente apresenta um estado vazio no mesmo padrão visual do `Resumo da casa`: borda tracejada, ícone oficial, título e texto de apoio centralizados.

## Dados e segurança

O feed lê `audit_log`, já protegido por RLS e `family_id`. A Home não escreve no banco e não usa chave privilegiada. Somente tabelas conhecidas e ações permitidas são convertidas em eventos; navegação, filtros, edições comuns e alterações técnicas são ignorados.

A migration `202608050001_activity_audit_transitions.sql` passa a guardar os estados anterior e novo dentro do `payload` da auditoria. Assim, o feed reconhece a transição real de pendente para concluído e não publica uma edição posterior como nova conclusão. O leitor permanece compatível com os registros antigos, cujo `payload` é plano.

## Eventos desta etapa

| Módulo | Eventos |
| --- | --- |
| Compras | Lista criada, lista concluída e item adicionado |
| Tarefas | Tarefa criada e tarefa concluída |
| Finanças | Conta cadastrada, conta paga e receita registrada |

## Evoluções previstas

Agenda registra criação, alteração e cancelamento de eventos. Ocorrências automáticas de séries recorrentes não geram novas linhas. Documentos e Emergência entram quando tiverem persistência e auditoria. Atribuição de tarefas depende da evolução do modelo atual, ainda pessoal. Alertas automáticos e marcos de reserva deverão ser persistidos ao serem gerados para aparecer uma única vez e manter ordenação confiável. Filtros por módulo, período e membro poderão ser adicionados em `/atividades`.

## Validação

- Conferir os estados com 0, 1 e 8 eventos e a ordenação.
- Confirmar que o estado vazio ocupa corretamente o card da Home e a tela de histórico, sem vazamentos ou alturas quebradas.
- Validar tempos relativos: agora, minutos, horas, ontem, dia da semana, semanas e meses.
- Testar a Home e o histórico em 360 px, 390 px, 768 px e desktop.
- Confirmar isolamento entre famílias.
- Executar lint, TypeScript e build.
