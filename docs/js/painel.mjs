import {
  agruparDestaques, carregarCampeonato, dataLocal, detalhes, diaNoFuso, estados, filtrarDisputas,
  medalhas, medalhasDoPodio, quadroDeMedalhas, tituloDisputa,
} from "./campeonato.mjs";

const porId = (id) => document.getElementById(id);
const comparar = new Intl.Collator("pt-BR", { numeric: true }).compare;

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

function cartaoJogo(jogo, escolas, disputas, modalidades) {
  const article = elemento("article", null, "disputa jogo");
  const disputa = disputas.get(jogo.competicaoId);
  article.append(elemento("h4", jogo.etapa), elemento("p", tituloDisputa(disputa, modalidades), "contexto"));
  const lados = elemento("ul", null, "lados-jogo");
  for (const lado of ["A", "B"]) {
    const linha = elemento("li");
    linha.append(elemento("span", escolas.get(jogo[`escola${lado}`])?.nome ?? "Adversário a confirmar"));
    if (jogo.placar != null) {
      linha.append(elemento("strong", jogo.placar[lado.toLowerCase()], "placar"));
    }
    lados.append(linha);
  }
  article.append(lados);
  const infos = [];
  if (jogo.data) {
    const formatador = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" });
    infos.push(formatador.format(new Date(jogo.data)));
  }
  if (jogo.hora) {
    if (!jogo.data && jogo.placar == null) infos.push("Data a confirmar");
    infos.push(`${jogo.hora} (Manaus)`);
  } else if (jogo.placar == null) {
    infos.push(jogo.data ? "Horário a confirmar" : "Data e horário a confirmar");
  }
  if (jogo.local) infos.push(jogo.local);
  if (infos.length) article.append(elemento("p", infos.join(" · "), "contexto"));
  return article;
}

function exibirDestaques(dados, escolas, modalidades) {
  const disputas = new Map(dados.competicoes.map((item) => [item.id, item]));
  const grupos = agruparDestaques(dados.destaques ?? [], diaNoFuso(dados.edicao.fuso));
  const vazios = { proximos: "Nenhum jogo em destaque na programação.", resultados: "Nenhum placar divulgado." };
  for (const [nome, jogos] of Object.entries(grupos)) {
    const lista = porId(`jogos-${nome}`);
    for (const jogo of jogos) lista.append(cartaoJogo(jogo, escolas, disputas, modalidades));
    if (!jogos.length && vazios[nome]) lista.append(elemento("p", vazios[nome], "vazio"));
  }
  porId("jogos-sem-resultado").hidden = !grupos.pendentes.length;
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
