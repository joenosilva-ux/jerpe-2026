# ADR 002 — Painel público e editor local separados

**Status** · Substituído pelo [ADR 003](003-editor-no-github-pages.md)

## Contexto

O público precisa consultar o campeonato pelo celular. O operador precisa editar e revisar os resultados antes que cheguem aos visitantes.

## Alternativas

Publicar o formulário no mesmo site permitiria abri-lo em qualquer aparelho. A gravação direta no repositório exigiria autenticação e autorização, além de cuidado com o acesso às credenciais.

## Decisão

Manter o painel em `docs/` e o editor em `ferramentas/`. Publicar apenas `docs/` pelo GitHub Pages. O editor trabalha com o JSON no navegador e a publicação ocorre por commit no GitHub.

## Consequências

O editor pode ser usado sem um backend e o painel público tem acesso apenas de leitura aos dados. A publicação é uma etapa separada depois da exportação. O código do editor permanece disponível para consulta no repositório, fora do site do Pages.
