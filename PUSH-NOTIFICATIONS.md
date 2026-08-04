# Notificações push de Tarefas

Esta entrega usa Web Push nativo. Não exige conta em um serviço de notificações: navegador/PWA, Supabase e Vercel já cobrem a infraestrutura. O agendamento roda no Supabase para não expor a chave administrativa e para evitar a limitação de cron diário do plano Hobby da Vercel.

## 1. Gerar as chaves VAPID

Execute uma única vez e guarde o par em um gerenciador de senhas:

```powershell
npx.cmd web-push generate-vapid-keys
```

Nunca grave a chave privada no Git.

## 2. Configurar a Vercel

Adicione apenas a chave pública em Preview e Production:

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
```

## 3. Configurar e publicar no Supabase

1. Aplique, em ordem, `supabase/migrations/202607140001_task_push_subscriptions.sql` e `supabase/migrations/202607140002_task_reminder_reschedule.sql`.
2. Em Edge Functions > Secrets, crie:

```text
VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:<email-do-administrador>
CRON_SECRET=<texto-aleatorio-longo>
```

3. Publique a função sem verificação JWT; ela possui sua própria autenticação por `CRON_SECRET`:

```powershell
supabase functions deploy task-reminders --no-verify-jwt
```

4. Em Integrations > Cron, crie um job a cada minuto (`* * * * *`) que faça `POST` para:

```text
https://<project-ref>.supabase.co/functions/v1/task-reminders
```

Envie o cabeçalho `Authorization: Bearer <CRON_SECRET>`. O job também pode ser criado com `pg_cron`, `pg_net` e Vault conforme a documentação oficial do Supabase.

## 4. Validar no celular

- iPhone/iPad: Web Push requer iOS/iPadOS 16.4 ou superior e o site adicionado à Tela de Início. Abra o PWA instalado e ligue o switch dentro da modal da tarefa.
- Android: valide pelo PWA instalado ou navegador compatível.
- A permissão só é solicitada após o toque no switch.
- Crie uma tarefa para dois ou três minutos à frente, feche o PWA e confirme a chegada e a abertura de `/tarefas` ao tocar no aviso.
- Se a permissão tiver sido negada antes, reative Notificações nos ajustes do sistema.

## 5. Regras funcionais

- Assinaturas e tarefas são filtradas pelo mesmo `user_id`; nenhum membro recebe tarefas de outro usuário.
- Cada navegador ou PWA instalado possui assinatura própria. Ao adicionar um aparelho, desligue e ligue o switch nele para registrar a assinatura.
- O fuso IANA do aparelho define data e horário locais do lembrete. O Supabase pode exibir timestamps de auditoria em UTC (`+00`).
- Frequência, início, dias específicos e status ativo são verificados antes do envio.
- Se houver `routine_entries.completed = true` para a tarefa na data local, o aviso não é enviado.
- A chave de deduplicação é tarefa + assinatura + data + horário. O mesmo minuto não duplica; editar para mais tarde permite novo envio no dia.
- Ao tocar, abrir ou focar `/tarefas`.
- O texto `From` ou equivalente é uma identificação de segurança do navegador/sistema e não pode ser alterado pelo payload.
- `lang: pt-BR` ajuda tecnologias assistivas e metadados de idioma, mas não traduz a interface do sistema operacional.

## 6. Diagnóstico

- `401` na função: conferir `CRON_SECRET` e o header `Authorization: Bearer ...`.
- Erro `Failed to decode base64Url`: revisar o par VAPID, sem prefixos, aspas, espaços ou digest.
- Entrega ausente: conferir tarefa ativa, horário, fuso, frequência, conclusão e existência de assinatura do aparelho.
- Entrega registrada sem aviso visível: conferir permissões, modo Foco e se a assinatura pertence ao aparelho testado.
