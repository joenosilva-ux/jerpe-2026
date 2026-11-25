# ADR 003 — Editor estático no GitHub Pages

**Status** · Aceito. Substitui o [ADR 002](002-painel-e-editor-separados.md).

## Contexto

O responsável precisa preparar resultados pelo computador ou celular. O painel do JERPE já é servido pelo GitHub Pages a partir de `main:/docs`.

## Alternativas

Manter o editor apenas na cópia local exigiria iniciar um servidor em cada ambiente de operação. A gravação direta no repositório pelo editor exigiria uma integração autenticada para alterar arquivos.

## Decisão

Mover o editor para `docs/editor/`. O navegador carrega o CSS, os módulos compartilhados e `docs/dados/campeonato.json` com caminhos relativos. O editor consulta a mesma base do painel, permite substituir a sessão por um JSON importado e exporta o resultado para download. A publicação permanece no GitHub, mediante commit autorizado na branch que alimenta o Pages.

## Consequências

O editor funciona no endereço público `/jerpe-2026/editor/` e pode ser aberto por quem tiver o link. A navegação do painel permanece voltada à consulta. O frontend prepara arquivos e não possui credenciais ou capacidade de escrita no repositório. O responsável continua revisando o JSON e enviando o commit pelo GitHub.
