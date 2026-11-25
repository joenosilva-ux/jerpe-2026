# Operação do JERPE

## Abrir o editor

Na raiz do projeto, inicie o servidor local:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Abra o [editor](http://127.0.0.1:8080/ferramentas/editor.html). Ele lê a cópia local de `docs/dados/campeonato.json`. Se a última atualização foi publicada no GitHub, rode `git pull --ff-only` antes de abrir o editor ou baixe o JSON mais recente e selecione-o no editor. Partir de uma versão antiga pode apagar lançamentos, pois a exportação substitui a base inteira.

## Registrar ou corrigir resultados

1. Selecione modalidade e disputa. Marque **Pódio divulgado** e informe as escolas do 1º e 2º lugar. Informe o 3º lugar quando houver bronze.
2. Clique em **Salvar alteração**. Para corrigir, ajuste as colocações e salve novamente. Ao cancelar uma disputa, as medalhas daquele pódio saem do quadro geral.
3. Para registrar um jogo selecionado, clique em **Adicionar jogo em destaque**. Preencha horário, local e escolas à medida que forem confirmados. Para publicar um placar, informe as duas escolas e os dois números. O placar de 0 a 0 é válido.
4. Clique em **Exportar campeonato.json** e substitua `docs/dados/campeonato.json` pelo arquivo baixado. Recarregue o painel local para conferir.

O quadro geral soma medalhas a partir dos pódios. Um placar de jogo em destaque não concede medalhas. Em provas individuais, atletas diferentes de uma mesma escola podem ocupar mais de uma posição. A Corrida pelo título recalcula no editor ao salvar alterações e suas estimativas ficam fora da exportação. A data registrada é exibida no fuso de Manaus.

## Publicar pelo GitHub

O GitHub Pages publica a branch `main` pela pasta `/docs`. As instruções abaixo pressupõem essa configuração. [Configuração do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

No computador, com o JSON revisado no caminho correto:

```powershell
git diff -- docs/dados/campeonato.json
git add docs/dados/campeonato.json
git commit -m "Atualiza resultados do JERPE"
git push
```

No celular, com o conteúdo do JSON exportado disponível, abra o repositório pelo navegador. Entre em `docs/dados/campeonato.json`, toque no lápis de edição, substitua o conteúdo inteiro e use **Commit changes**. Se a branch exigir um pull request, faça a mesclagem depois de revisar. [Edição de arquivos no GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files).

Após a publicação, recarregue o painel e confira o pódio, o destaque ou a data de atualização. Selecionar um arquivo no editor altera a sessão local. O commit é o que publica a atualização para os visitantes.

## Recuperar uma versão anterior

No GitHub, abra o histórico de `docs/dados/campeonato.json`, escolha a revisão correta e publique o conteúdo correspondente em um novo commit. Confirme se houve lançamentos válidos depois da revisão escolhida para evitar perdê-los. Se o problema foi apenas um pódio, corrija o registro no editor e publique o JSON atualizado.

## Critérios do cadastro inicial

A revisão inicial reuniu 40 disputas confirmadas para acompanhamento e 1 a confirmar. O Boletim 01 documentou 9 disputas coletivas. As fichas identificaram 22 provas de atletismo, 4 disputas de xadrez e o futsal feminino. As 4 disputas de tênis de mesa foram confirmadas pelo responsável pelo painel. As inscrições efetivas, a programação e os resultados dependem da organização.

Os nomes dos arquivos de corridas infantil e juvenil estavam trocados. Foram usados os cabeçalhos e as distâncias internas. O boletim confirmou o handebol masculino, cuja ficha repetia o cabeçalho feminino. O revezamento 4×80 m infantil misto ficou em espera por divergência entre nome de arquivo e cabeçalho.

O cadastro começou sem pódios e com três destaques de vôlei de praia infantil do boletim. As fichas originais, documentos de atletas, assinaturas e cópias locais de conferência ficam fora do repositório público. Para ampliar o cadastro, use IDs únicos no JSON e confira as referências de escola e modalidade.
