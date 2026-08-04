<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Regras do Family Hub

- Leia `README.md` antes de qualquer alteracao.
- Use `PRIMEIRA-VERSAO.md` apenas como registro historico da primeira entrega.
- Siga o fluxo de branch, Preview, Pull Request, merge e Production definido no README.
- Nao altere diretamente a `master` para desenvolver funcionalidades.
- Lembre que, por enquanto, os ambientes podem compartilhar o banco Supabase de producao.
- O app mobile e um PWA publicado; mudancas em manifest, icones, splash screen, status bar ou safe area devem ser testadas no iPhone removendo e adicionando novamente o atalho.
- Diferencie sempre os ambientes: IP local serve apenas o codigo local; URL Preview serve a branch publicada; dominio oficial e PWA instalado servem Production.
- Fluxos Google OAuth no celular devem ser validados por HTTPS em Preview. Nao conclua que o codigo local esta carregado quando a barra do navegador mostra o dominio de Production.
- Quando frontend depender de migration, confirme que a migration foi aplicada antes de validar a funcionalidade. Codigo e banco devem permanecer compativeis durante a publicacao.
- Ao entregar comandos de publicacao, use o fluxo curto do README e adapte apenas branch, titulo e resumo. Inclua criacao de branch/commit somente quando as alteracoes ainda estiverem na `master` ou sem commit.
- Preserve mudancas locais fora do escopo e nunca inclua arquivos temporarios ou documentacao de outra tarefa em um commit sem necessidade.
