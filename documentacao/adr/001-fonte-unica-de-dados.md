# ADR 001 — Um JSON como fonte única

**Status** · Aceito

## Contexto

Uma pessoa precisa manter os resultados do JERPE e publicar o painel durante os jogos. Guardar pódios, totais e classificação separadamente exigiria sincronizar os três a cada correção.

## Alternativas

Um banco de dados com um serviço de atualização permitiria gravações parciais e concorrentes, com infraestrutura e permissões adicionais. Arquivos separados por modalidade reduziriam o tamanho de cada edição, mas exigiriam combinar versões e validar referências entre arquivos.

## Decisão

Usar `docs/dados/campeonato.json` como a base versionada. Registrar cada pódio uma vez e calcular quadro, progresso e estimativas a partir dele. Validar o arquivo ao carregar e ao exportar.

## Consequências

O painel pode ser servido como site estático. O Git preserva a revisão anterior. Cada exportação substitui a base inteira, por isso o operador precisa partir da última versão publicada e coordenar edições simultâneas.
