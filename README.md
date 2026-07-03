# Family Hub

Sistema privado da familia Julio e Carol para centralizar compras, financas, agenda, documentos, cuidados com a Flora e outras rotinas familiares.

Producao: https://family-hub-co.vercel.app

## Situacao atual

- Modulo Compras publicado e em uso.
- Modulo Financeiro publicado em producao e em teste de uso real.
- Google OAuth e a unica forma de login.
- Apenas Julio e Carol estao autorizados.
- Ambos acessam a mesma familia e os mesmos dados.
- RLS esta habilitado nas tabelas publicas do Supabase.
- Nova home publica e novo Hub interno responsivo estao funcionando.
- Navegacao interna unificada com menu lateral no desktop e barra inferior no mobile.
- Tema claro e escuro disponivel na home publica e nas areas autenticadas.
- App instalavel como PWA publicado em producao, com manifest, service worker, icone proprio e splash screen no iOS.
- Experiencia mobile revisada para uso pelo atalho da tela inicial, incluindo status bar, safe area, navegacao inferior e modais de Compras.
- Lista de Compras esta funcional e persistida no Supabase.
- Financeiro possui Visao Geral, Transacoes, Contas, Orcamento e Reserva persistidos no Supabase.
- Investimentos permanece bloqueado para uma etapa futura.
- `master` e a branch oficial do GitHub e da producao na Vercel.
- O novo layout geral foi implementado; os proximos ajustes devem partir desta identidade.

## Modulo Financeiro

- Os dados sao compartilhados por Julio e Carol por meio de `family_id` e RLS.
- Transacoes registram receitas, despesas, depositos e retiradas da reserva.
- Contas podem ser recorrentes e possuem pagamentos mensais independentes.
- Marcar uma conta como paga nao cria outra transacao; a propria conta e a fonte do valor.
- Contas da categoria Reserva aumentam a reserva somente quando pagas.
- Orcamentos somam despesas de Contas e Transacoes por categoria.
- A Visao Geral compara os ultimos seis meses e permite exportar PNG, CSV e JSON.
- Categorias exibidas em Transacoes e Contas seguem as categorias criadas no Orcamento; categorias padrao aparecem apenas quando ainda nao ha categorias cadastradas.
- A reserva de emergencia possui configuracao completa no padrao visual do `family-hub-v3.html`, com custo mensal, meses de cobertura, meta calculada e aporte mensal planejado.
- As tabelas financeiras iniciaram vazias; a migration nao inseriu dados ficticios.

## Documentos de referencia

Leia nesta ordem antes de iniciar qualquer tarefa:

1. `AGENTS.md`: regras obrigatorias do ambiente e do Next.js.
2. `README.md`: contexto atual, operacao e fluxo oficial do projeto.
3. `family-hub-v3.html`: referencia visual e comportamental aprovada.
4. `DESIGN.md`: tokens, componentes e identidade visual.
5. `BRAIN.md`: visao do produto, seguranca e especificacoes dos modulos.
6. `PRIMEIRA-VERSAO.md`: registro historico da primeira entrega.
7. `TASKS.md`: backlog historico, sempre conferindo o que ja foi concluido.

O codigo funcional atual e este README prevalecem quando documentos antigos estiverem desatualizados.

## Stack

- Next.js 16.2.9 com App Router.
- React 19.2.4.
- TypeScript strict.
- Tailwind CSS 4 e CSS global.
- Supabase Auth, PostgreSQL e RLS.
- Vercel para Preview e Production.
- Fontes locais Bebas Neue, Inter e JetBrains Mono.
- PWA com `manifest.webmanifest`, service worker, offline fallback, icones em `public/icons` e splash screens em `public/splash`.

## Execucao local

```powershell
npm.cmd install
npm.cmd run dev
```

Para acesso na rede local:

```powershell
npm.cmd run dev:network
```

Validacao obrigatoria antes de concluir qualquer mudanca:

```powershell
npm.cmd run lint
npm.cmd exec tsc -- --noEmit
npm.cmd run build
```

## Seguranca

- Nunca colocar chaves, tokens ou senhas no codigo, Git ou documentacao.
- `SUPABASE_SERVICE_ROLE_KEY` nao deve ser enviada a Vercel nem ao navegador.
- O cliente usa somente as variaveis publicas do Supabase.
- Toda nova tabela publica precisa de RLS e isolamento por `family_id`.
- Acoes criticas devem ser registradas em `audit_log` quando aplicavel.
- Nenhuma rota ou dado privado pode ficar acessivel sem autenticacao.
- Contas nao autorizadas devem continuar bloqueadas.

## Banco de dados durante o desenvolvimento

Por enquanto, desenvolvimento, Preview e producao podem apontar para o mesmo projeto Supabase. As branches do GitHub isolam o codigo, mas nao isolam os dados.

Consequencias praticas:

- Alteracoes visuais e de codigo podem ser testadas na branch normalmente.
- Criar, editar ou excluir dados pode afetar o banco real.
- Nao inserir dados ficticios ou destrutivos no banco de producao.
- Mudancas de schema devem ser criadas como migrations versionadas.
- Toda migration precisa ser revisada antes de ser aplicada.
- Novas tabelas, colunas, indices, triggers e policies devem preservar os dados existentes.
- Fazer mudancas aditivas e compativeis sempre que possivel.
- Um Supabase separado para desenvolvimento continua recomendado para o futuro.

## O papel da master

`master` representa a versao oficial, aprovada e pronta para uso da familia. A Vercel acompanha essa branch e publica seus commits no ambiente Production.

Novas funcionalidades nao devem ser construidas diretamente nela. Cada trabalho deve acontecer em uma branch separada, para que o sistema em uso continue estavel enquanto a novidade e desenvolvida e testada.

Conceitos principais:

- `master`: versao oficial e estavel.
- Branch de trabalho: copia separada usada para construir uma mudanca.
- Preview: site temporario criado pela Vercel para testar uma branch.
- Pull Request: pedido de revisao e integracao da branch na `master`.
- Merge: incorporacao aprovada na versao oficial.
- Production: site real acessado pela familia.

## Fluxo oficial de novas funcionalidades

### 1. Criar uma branch

Comecar sempre a partir da `master` atualizada e criar uma branch com nome descritivo, por exemplo:

```text
codex/modulo-financeiro
```

### 2. Desenvolver

Fazer as alteracoes somente nessa branch. O site oficial permanece inalterado durante o desenvolvimento.

Durante a construcao incremental do modulo, o ciclo padrao e local:

- implementar e revisar no computador de desenvolvimento;
- testar em `localhost`, incluindo desktop e mobile;
- acumular alteracoes coerentes na branch sem publicar um novo Preview a cada ajuste;
- nao fazer push apenas para validar pequenas mudancas ainda em andamento;
- manter commits locais organizados para preservar o historico do trabalho.

Essa regra evita gerar deployments temporarios e reconfigurar URLs OAuth a cada pequena alteracao. Ela nao reduz os cuidados com o Supabase compartilhado: migrations e operacoes que possam afetar dados reais continuam dependendo de revisao e aprovacao previa.

### 3. Verificar

Antes de publicar a branch:

- revisar o comportamento da funcionalidade;
- preservar autenticacao, autorizacao e RLS;
- verificar desktop e mobile;
- testar pelo menos 360 px, 390 px, 768 px e desktop quando houver interface;
- evitar scroll horizontal e manter alvos de toque adequados;
- executar lint, TypeScript e build;
- revisar migrations e impacto sobre dados reais.

### 4. Publicar uma Preview

Publicar a branch somente quando houver uma versao candidata completa, estavel nos testes locais e pronta para revisao integrada. Nao criar um novo Preview para cada alteracao intermediaria.

Nesse marco, enviar a branch ao GitHub. A Vercel cria um deploy temporario marcado como Preview. Essa URL permite revisar a novidade antes de alterar o site oficial.

Quando o fluxo depender de Google OAuth, cadastrar a URL de callback do Preview no Supabase apenas nessa etapa. Confirmar que o login permanece no dominio Preview antes de iniciar os testes finais.

Como o banco ainda e compartilhado, testes na Preview devem evitar dados ficticios ou operacoes destrutivas.

### 5. Abrir um Pull Request

Criar um PR da branch de trabalho para `master`. O PR deve explicar o que mudou, quais riscos existem e como a mudanca foi validada.

### 6. Revisar e aprovar

Confirmar antes do merge:

- funcionalidade correta;
- Preview funcionando;
- verificacoes automaticas aprovadas;
- desktop e mobile preservados;
- seguranca e dados protegidos;
- migrations revisadas e aplicadas na ordem correta, quando existirem;
- documentacao atualizada.

### 7. Integrar na master

Fazer o merge somente depois da aprovacao. A `master` deve permanecer utilizavel e sem trabalho incompleto.

### 8. Publicar em producao

A Vercel detecta a atualizacao da `master` e cria um deploy Production. Confirmar que o deploy esta `Ready`, que o dominio oficial aponta para ele e que o fluxo principal continua funcionando.

## Resumo do fluxo

```text
master estavel
-> nova branch
-> desenvolvimento e commits locais
-> testes locais continuos
-> versao candidata estavel
-> Preview da Vercel
-> Pull Request
-> revisao
-> merge na master
-> Production
```

## Identidade e responsividade

- Tema escuro industrial com fundo carvao e acento laranja.
- Bebas Neue para titulos, Inter para interface e JetBrains Mono para dados.
- Home publica separada da area autenticada.
- Hub interno com cards de resumo e atalhos dos modulos.
- Navegacao autenticada com menu lateral no desktop e barra inferior no mobile.
- No app instalado, respeitar safe areas do iOS, evitar faixas pretas artificiais e manter modais utilizaveis com teclado aberto.
- Alteracoes em PWA, icones, splash screen, status bar ou manifest exigem teste removendo e adicionando novamente o atalho no iPhone.
- Novos modulos devem funcionar dentro do shell interno responsivo.
- Elementos bloqueados permanecem em cinza, sem clique.
- Verde representa conclusao; vermelho representa perigo ou SOS.
- Nunca corrigir mobile quebrando desktop, nem o inverso.

## Estado da primeira versao

Concluido:

- autenticacao Google e bloqueio de contas nao autorizadas;
- vinculo de Julio e Carol a mesma familia;
- schema inicial, RLS e auditoria;
- Hub desktop e mobile;
- modulo Lista de Compras;
- deploy na Vercel;
- URLs OAuth de producao;
- PR da primeira versao integrado a `master`;
- `master` definida como branch padrao do GitHub e branch Production da Vercel;
- deploy de producao da `master` confirmado.
- PWA mobile integrado a `master` e publicado em producao.
- Icone principal, splash screen e instalacao pela tela inicial do iPhone confirmados.
- Ajustes de Compras, Modo Mercado, modais mobile e navegacao inferior revisados apos uso real.

## Proximas prioridades

1. Acompanhar o uso real do app instalado, novo layout, Compras e Financeiro.
2. Corrigir melhorias de UX observadas apos publicacao do PWA mobile.
3. Ativar MFA no GitHub, Vercel, Supabase e contas Google.
4. Revisar membros e permissoes das plataformas.
5. Definir rotina de backup do Supabase.
6. Acompanhar logs da Vercel e do Supabase.
7. Considerar um Supabase separado para desenvolvimento no futuro.
