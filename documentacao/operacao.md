# Operação do JERPE

## Endereços e base de dados

- [Painel público](https://joenosilva-ux.github.io/jerpe-2026/)
- [Editor do campeonato](https://joenosilva-ux.github.io/jerpe-2026/editor/)

O editor abre automaticamente a base publicada. Use **Recarregar base do site** para consultar de novo o JSON do Pages ou **Abrir arquivo JSON** para retomar um arquivo do seu dispositivo. As alterações salvas no editor ficam na sessão do navegador até a exportação.

Para trabalhar com a cópia local, inicie o servidor na raiz do projeto:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory docs
```

Abra o [editor local](http://127.0.0.1:8080/editor/). Ele lê a cópia local de `docs/dados/campeonato.json`. Se a última atualização foi publicada no GitHub, sincronize a cópia com `git pull --ff-only` ou importe o arquivo mais recente. Antes de publicar a exportação, confira se alguém atualizou o repositório desde o início da edição. A exportação contém a base inteira e uma cópia antiga pode sobrescrever lançamentos.

## Registrar ou corrigir resultados

1. Selecione modalidade e disputa. Marque **Pódio divulgado** e informe as escolas do 1º e 2º lugar. Informe o 3º lugar quando houver bronze.
2. Clique em **Salvar alteração**. Para corrigir, ajuste as colocações e salve novamente. Ao cancelar uma disputa, as medalhas daquele pódio saem do quadro geral.
3. Para registrar um jogo selecionado, clique em **Adicionar jogo em destaque**. Preencha data, local e escolas à medida que forem confirmados. Use **Ordem no bloco** para jogos da mesma disputa, data e local. Informe o horário apenas quando estiver marcado. Se o jogo 1 tem hora marcada, o painel mostra o início do bloco e indica **Em sequência** nos jogos seguintes sem hora. Para publicar um placar, informe as duas escolas e os dois números. O placar de 0 a 0 é válido.
4. Clique em **Exportar campeonato.json**. O JSON baixado é a base revisada para publicar no GitHub.

Quando o resultado oficial concede mais de uma medalha da mesma cor, preencha o pódio normalmente e use **Adicionar medalha excepcional** para selecionar o tipo e a escola de cada medalha extra. Para corrigir ou retirar uma medalha excepcional, altere os campos da linha ou clique em **Remover medalha** e salve o pódio.

O quadro geral soma as medalhas de cada pódio, inclusive as excepcionais. Cada pódio encerra uma única disputa. Um placar de jogo em destaque não concede medalhas. Em provas individuais, atletas diferentes de uma mesma escola podem ocupar mais de uma posição. A Corrida pelo título considera um ouro por disputa futura confirmada e recalcula no editor ao salvar alterações. Suas estimativas ficam fora da exportação. A data registrada é exibida no fuso de Manaus.

## Publicar pelo GitHub

O GitHub Pages publica a branch `main` pela pasta `/docs`. As duas páginas usam os mesmos recursos e dados. O editor não usa credenciais nem envia alterações ao GitHub. A autorização para alterar a base é a permissão de escrita no repositório ou de mesclagem na branch publicada. [Configuração do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

No computador, substitua `docs/dados/campeonato.json` pelo arquivo exportado. Confira a mudança e envie:

```powershell
git diff -- docs/dados/campeonato.json
git add docs/dados/campeonato.json
git commit -m "Atualiza resultados do JERPE"
git push
```

No celular, exporte o JSON pelo editor e abra o arquivo baixado em um aplicativo que permita copiar seu conteúdo. Entre na sua conta autorizada no GitHub pelo navegador e abra `docs/dados/campeonato.json` no repositório. Toque no lápis, substitua o conteúdo inteiro e use **Commit changes**. Se a branch exigir um pull request, faça a mesclagem depois de revisar. [Edição de arquivos no GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files).

Depois da implantação do commit pelo Pages, recarregue o painel e confira o pódio, o destaque ou a data de atualização.

## Recuperar uma versão anterior

No GitHub, abra o histórico de `docs/dados/campeonato.json`, escolha a revisão correta e publique o conteúdo correspondente em um novo commit. Confirme se houve lançamentos válidos depois da revisão escolhida para evitar perdê-los. Se o problema foi apenas um pódio, corrija o registro no editor e publique o JSON atualizado.

## Critérios do cadastro inicial

A revisão inicial reuniu 40 disputas confirmadas para acompanhamento e 1 a confirmar. O Boletim 01 documentou 9 disputas coletivas. As fichas identificaram 22 provas de atletismo, 4 disputas de xadrez e o futsal feminino. As 4 disputas de tênis de mesa foram confirmadas pelo responsável pelo painel. As inscrições efetivas, a programação e os resultados dependem da organização.

Os nomes dos arquivos de corridas infantil e juvenil estavam trocados. Foram usados os cabeçalhos e as distâncias internas. O boletim confirmou o handebol masculino, cuja ficha repetia o cabeçalho feminino. O revezamento 4×80 m infantil misto ficou em espera por divergência entre nome de arquivo e cabeçalho.

O cadastro começou sem pódios e com três destaques de vôlei de praia infantil do boletim. As fichas originais, documentos de atletas, assinaturas e cópias locais de conferência ficam fora do repositório público. Para ampliar o cadastro, use IDs únicos no JSON e confira as referências de escola e modalidade.
