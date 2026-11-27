import {
  agruparDestaques, blocosDeDestaques, carregarCampeonato, dataLocal, detalhes, diaNoFuso, estados,
  filtrarDisputas, jogoDaEscola, medalhas, medalhasDoPodio, quadroDeMedalhas, tituloDisputa,
} from "./campeonato.mjs";

const porId = (id) => document.getElementById(id);
const comparar = new Intl.Collator("pt-BR", { numeric: true }).compare;
const dataAgenda = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" });

function elemento(tag, texto, classe) {
  const node = document.createElement(tag);
  if (texto != null) node.textContent = texto;
  if (classe) node.className = classe;
  return node;
}

function preencherQuadro(tabela, quadro) {
  tabela.replaceChildren();
  for (const linha of quadro) {
    const tr = elemento("tr");
    const escola = elemento("th", linha.nome);
    escola.scope = "row";
    tr.append(elemento("td", linha.posicao ?? "—", "posicao"), escola);
    for (const medalha of medalhas) tr.append(elemento("td", linha[medalha], medalha));
    tr.append(elemento("td", linha.total, "total"));
    tabela.append(tr);
  }
}

function exibirQuadro(dados, quadro) {
  preencherQuadro(porId("classificacao"), quadro);
  const lideres = quadro.filter((escola) => escola.posicao === 1);
  porId("criterio").textContent = `${dados.regras.provisoria ? "Critério provisório" : "Critério"} · Ouro, prata e bronze`;
  porId("nota-classificacao").textContent = lideres.length === 0 ?
    "A classificação será exibida após o primeiro pódio." :
    lideres.length > 1 ? "Há empate na liderança." : `Na liderança · ${lideres[0].nome}`;
}

function cartaoJogo(jogo, escolas, { titulo, bloco, nivel = "h4" } = {}) {
  const article = elemento("article", null, "disputa jogo");
  const etapa = jogo.ordem && jogo.etapa !== `Jogo ${jogo.ordem}` && bloco ?
    `Jogo ${jogo.ordem} · ${jogo.etapa}` : jogo.etapa;
  article.append(elemento(nivel, etapa));
  if (titulo) article.append(elemento("p", titulo, "contexto"));
  const lados = elemento("ul", null, "lados-jogo");
  if (!jogo.escolaA && !jogo.escolaB) lados.append(elemento("li", "Equipes a confirmar"));
  for (const lado of (jogo.escolaA || jogo.escolaB ? ["A", "B"] : [])) {
    const linha = elemento("li");
    linha.append(elemento("span", escolas.get(jogo[`escola${lado}`])?.nome ?? "Adversário a confirmar"));
    if (jogo.placar != null) {
      linha.append(elemento("strong", jogo.placar[lado.toLowerCase()], "placar"));
    }
    lados.append(linha);
  }
  article.append(lados);
  const infos = [];
  if (!bloco && jogo.data) infos.push(dataAgenda.format(new Date(jogo.data)));
  if (jogo.hora) {
    infos.push(`${jogo.hora} (Manaus)${jogo.placar == null ? " · Horário marcado" : ""}`);
  } else if (jogo.placar == null) {
    infos.push(bloco?.inicio && jogo.ordem > 1 ? "Em sequência" : "Horário a confirmar");
  }
  if (!bloco && jogo.local) infos.push(jogo.local);
  if (infos.length) article.append(elemento("p", infos.join(" · "), "contexto"));
  return article;
}

function exibirDestaques(dados, escolas, modalidades) {
  const disputas = new Map(dados.competicoes.map((item) => [item.id, item]));
  const titulo = (id) => tituloDisputa(disputas.get(id), modalidades);
  const modalidadeDe = (id) => modalidades.get(disputas.get(id).modalidadeId);
  const categoria = (id) => {
    const disputa = disputas.get(id);
    const modalidade = modalidadeDe(id);
    const prova = disputa.nome === modalidade.nome ? null : disputa.nome;
    return [prova, detalhes(disputa)].filter(Boolean).join(" · ") || disputa.nome;
  };
  const agenda = dados.destaques ?? [];
  const grupos = agruparDestaques(agenda, diaNoFuso(dados.edicao.fuso));
  const filtro = porId("escola-jogos");
  [...escolas.values()].sort((a, b) => comparar(a.nome, b.nome))
    .forEach((escola) => filtro.add(new Option(escola.nome, escola.id)));

  function organizarJogos(itens, porModalidade, montar) {
    if (!itens.length) return [];
    if (!porModalidade) return montar(itens, false);
    const grupos = new Map();
    for (const item of itens) {
      const modalidade = modalidadeDe(item.competicaoId);
      if (!grupos.has(modalidade.id)) grupos.set(modalidade.id, []);
      grupos.get(modalidade.id).push(item);
    }
    return [...grupos].sort(([a], [b]) => comparar(modalidades.get(a).nome, modalidades.get(b).nome))
      .map(([id, grupo]) => {
        const secao = elemento("section", null, "modalidade-jogos");
        secao.append(elemento("h4", modalidades.get(id).nome), ...montar(grupo, true));
        return secao;
      });
  }

  function montarBlocos(blocos, agrupado) {
    return blocos.map((bloco) => {
      const secao = elemento("div", null, "bloco-jogos");
      secao.append(elemento(agrupado ? "h5" : "h4",
        (agrupado ? categoria : titulo)(bloco.competicaoId)));
      const infos = [bloco.data ? dataAgenda.format(new Date(bloco.data)) : "Data a confirmar", bloco.local];
      if (bloco.inicio) infos.push(`Início do bloco: ${bloco.inicio} (Manaus)`);
      secao.append(elemento("p", infos.filter(Boolean).join(" · "), "contexto"));
      const partidas = elemento("div", null, "cartoes-jogos");
      partidas.append(...bloco.jogos.map((jogo) =>
        cartaoJogo(jogo, escolas, { bloco, nivel: agrupado ? "h6" : "h5" })));
      secao.append(partidas);
      return secao;
    });
  }

  function montarResultados(jogos, agrupado) {
    const partidas = elemento("div", null, "cartoes-jogos");
    partidas.append(...jogos.map((jogo) => cartaoJogo(jogo, escolas, {
      titulo: (agrupado ? categoria : titulo)(jogo.competicaoId),
      nivel: agrupado ? "h5" : "h4",
    })));
    return [partidas];
  }

  function renderizar() {
    const escola = filtro.value;
    const proximos = blocosDeDestaques(grupos.proximos, agenda, escola);
    const pendentes = blocosDeDestaques(grupos.pendentes, agenda, escola);
    const resultados = grupos.resultados.filter((jogo) => jogoDaEscola(jogo, escola));
    const agendados = organizarJogos(proximos, !escola, montarBlocos);
    if (!agendados.length) agendados.push(elemento("p",
      escola ? "Nenhum próximo jogo desta escola." : "Nenhum jogo na programação.", "vazio"));
    porId("jogos-proximos").replaceChildren(...agendados);
    porId("jogos-pendentes").replaceChildren(...organizarJogos(pendentes, !escola, montarBlocos));
    porId("jogos-sem-resultado").hidden = !pendentes.length;
    const placares = organizarJogos(resultados, !escola, montarResultados);
    if (!placares.length) placares.push(elemento("p", "Nenhum placar divulgado para esta seleção.", "vazio"));
    porId("jogos-resultados").replaceChildren(...placares);
    const total = proximos.concat(pendentes).reduce((soma, bloco) => soma + bloco.jogos.length, resultados.length);
    porId("contagem-jogos").textContent = `${total} ${total === 1 ? "jogo encontrado" : "jogos encontrados"}`;
  }
  filtro.addEventListener("change", renderizar);
  renderizar();
}

function linhaPodio(disputa, escolas) {
  const lista = elemento("ol", null, "lista-medalhas");
  for (const { tipo, escolaId } of medalhasDoPodio(disputa.podio)) {
    const escola = escolas.get(escolaId);
    if (!escola) continue;
    const li = elemento("li");
    li.append(elemento("span", `${medalhas.indexOf(tipo) + 1}º`, `medalha ${tipo}`), elemento("span", escola.nome));
    lista.append(li);
  }
  return lista;
}

function cartaoDisputa(disputa, escolas, modalidades) {
  const article = elemento("article", null, "disputa");
  const modalidade = modalidades.get(disputa.modalidadeId);
  if (modalidade.nome !== disputa.nome) article.append(elemento("p", modalidade.nome, "modalidade"));
  article.append(elemento("h3", disputa.nome));
  const contexto = detalhes(disputa);
  if (contexto) article.append(elemento("p", contexto, "contexto"));
  article.append(elemento("p", estados[disputa.status], `estado ${disputa.status}`));
  if (disputa.status === "divulgado") article.append(linhaPodio(disputa, escolas));
  if (disputa.status === "a-confirmar" && disputa.observacao) {
    article.append(elemento("p", disputa.observacao, "observacao"));
  }
  return article;
}

function exibirRecentes(divulgados, escolas, modalidades) {
  const recentes = porId("recentes");
  if (!divulgados.length) {
    recentes.append(elemento("p", "Pódio ainda não divulgado.", "vazio"));
    return;
  }
  for (const disputa of divulgados.slice(0, 3)) {
    const article = elemento("article", null, "recente");
    article.append(elemento("h3", tituloDisputa(disputa, modalidades)), linhaPodio(disputa, escolas));
    recentes.append(article);
  }
}

function iniciar(dados) {
  const escolas = new Map(dados.escolas.map((item) => [item.id, item]));
  const modalidades = new Map(dados.modalidades.map((item) => [item.id, item]));
  const divulgados = filtrarDisputas(dados.competicoes, { status: "divulgado" })
    .sort((a, b) => Date.parse(b.divulgadoEm) - Date.parse(a.divulgadoEm) || comparar(a.nome, b.nome));
  const confirmadas = dados.competicoes.filter((d) => ["aguardando", "divulgado"].includes(d.status)).length;
  const aConfirmar = filtrarDisputas(dados.competicoes, { status: "a-confirmar" }).length;
  porId("total-escolas").textContent = escolas.size;
  porId("total-confirmadas").textContent = confirmadas;
  porId("total-podios").textContent = divulgados.length;
  porId("nota-disputas").textContent = aConfirmar ?
    `${aConfirmar} ${aConfirmar === 1 ? "disputa aguarda" : "disputas aguardam"} confirmação da organização.` :
    "Consulte as classificações por modalidade e escola.";
  const atualizadoEm = dados.edicao.atualizadoEm;
  porId("atualizacao").textContent = atualizadoEm ?
    `Última atualização · ${dataLocal(atualizadoEm, dados.edicao, true)} (Manaus)` :
    "Base inicial · Boletim 01 e fichas de inscrição";
  const quadro = quadroDeMedalhas(dados);
  exibirQuadro(dados, quadro);
  exibirDestaques(dados, escolas, modalidades);
  exibirRecentes(divulgados, escolas, modalidades);
  for (const [id, itens] of [["modalidade", dados.modalidades], ["escola", dados.escolas]]) {
    const select = porId(id);
    [...itens].sort((a, b) => comparar(a.nome, b.nome))
      .forEach((item) => select.add(new Option(item.nome, item.id)));
  }
  for (const [status, nome] of Object.entries(estados)) porId("situacao").add(new Option(nome, status));

  const ordenadas = [...dados.competicoes].sort((a, b) => {
    const peso = { divulgado: 0, aguardando: 1, "a-confirmar": 2, cancelado: 3 };
    return peso[a.status] - peso[b.status] ||
      comparar(modalidades.get(a.modalidadeId).nome, modalidades.get(b.modalidadeId).nome) ||
      comparar(a.nome, b.nome) || comparar(detalhes(a), detalhes(b));
  });
  const formulario = porId("filtros");
  const renderizarDisputas = () => {
    const selecionadas = filtrarDisputas(ordenadas, Object.fromEntries(new FormData(formulario)));
    porId("contagem").textContent = `${selecionadas.length} ${selecionadas.length === 1 ? "disputa" : "disputas"}`;
    porId("disputas").replaceChildren(...(selecionadas.length ?
      selecionadas.map((disputa) => cartaoDisputa(disputa, escolas, modalidades)) :
      [elemento("p", "Nenhuma disputa corresponde aos filtros.", "vazio")]));
  };
  formulario.addEventListener("change", renderizarDisputas);
  formulario.addEventListener("submit", (evento) => evento.preventDefault());
  formulario.addEventListener("reset", () => requestAnimationFrame(renderizarDisputas));
  renderizarDisputas();
  porId("carregamento").hidden = true;
  porId("painel").hidden = false;
  porId("resumo").hidden = false;
  const secaoInicial = porId(location.hash.slice(1));
  if (secaoInicial && porId("painel").contains(secaoInicial)) secaoInicial.scrollIntoView();
}

carregarCampeonato().then(iniciar).catch((erro) => {
  porId("carregamento").textContent = "Não foi possível carregar o campeonato. Atualize a página para tentar novamente.";
  console.error(erro);
});
