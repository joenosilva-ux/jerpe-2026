# VIII JERPE 2026

Painel independente para acompanhar os Jogos Escolares de Rio Preto da Eva, no Amazonas. Reúne pódios, quadro de medalhas e jogos em destaque para consulta pelo celular. Uma pessoa consegue atualizar os resultados por meio de um editor local.

## Demonstração

[Abrir o painel do JERPE](https://joenosilva-ux.github.io/jerpe-2026/)

<img src="documentacao/imagens/painel-mobile.png" alt="Painel do JERPE em celular, com resumo das disputas e quadro de medalhas" width="390">

## O que o projeto entrega

- **Painel público.** Quadro de medalhas calculado a partir dos pódios, filtros por modalidade e escola, jogos em destaque e simulador de medalhas.
- **Editor local.** Cadastro e correção de resultados, validação do arquivo e exportação da base completa.
- **Corrida pelo título.** O editor mostra quantos ouros ainda estão disponíveis e quantos cada escola precisa para ultrapassar ou garantir a liderança em ouros.

## Arquitetura e tecnologias

O projeto usa HTML, CSS e módulos JavaScript nativos. O painel e o editor leem `docs/dados/campeonato.json` e compartilham a validação e o cálculo do quadro de medalhas. O editor carrega ou exporta arquivos no navegador. Para publicar, o responsável substitui o JSON no repositório. O GitHub Pages serve a pasta `docs/`.

- `docs/` contém a aplicação publicada e os dados.
- `ferramentas/` contém o editor local e a Corrida pelo título.
- `testes/` contém os cenários automatizados do campeonato.
- `documentacao/` contém o guia de operação e as decisões de engenharia.

## Executar e testar

Na raiz do projeto, com Python disponível:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Abra o [painel](http://127.0.0.1:8080/docs/) ou o [editor local](http://127.0.0.1:8080/ferramentas/editor.html). Com Node.js disponível, use `node --test` para executar os testes.

## Limitações

O painel registra pódios e confrontos selecionados. A classificação por ouro, prata e bronze ainda é provisória. A Corrida pelo título presume que cada escola pode disputar todos os ouros em aberto. A próxima revisão depende da confirmação do regulamento geral e das disputas pendentes pela organização.

## Documentação

- [Guia de operação e publicação](documentacao/operacao.md)
- [ADR 001 — Um JSON como fonte única](documentacao/adr/001-fonte-unica-de-dados.md)
- [ADR 002 — Painel público e editor local separados](documentacao/adr/002-painel-e-editor-separados.md)
