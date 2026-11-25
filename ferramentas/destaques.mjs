import { removerDestaque, salvarDestaque, tituloDisputa } from "../docs/js/campeonato.mjs";

export function prepararEditorDestaques(aoSalvar, aoAlterar) {
  const porId = (id) => document.getElementById(id);
  const secao = porId("edicao-destaques");
  const lista = porId("selecionar-destaque");
  const form = porId("form-destaque");
  const salvar = porId("salvar-destaque");
  const remover = porId("remover-destaque");
  const status = porId("status-destaque");
  const comparar = new Intl.Collator("pt-BR", { numeric: true }).compare;
  let dados;
  let idAtual = "";
  let original = "";

  function mensagem(texto, tipo) {
    status.textContent = texto;
    status.className = `aviso ${tipo}`;
    status.hidden = false;
  }

  function campos() {
    return new FormData(form);
  }

  function serializar() {
    return JSON.stringify([...campos()]);
  }

  function temRascunho() {
    return !form.hidden && serializar() !== original;
  }

  function atualizar() {
    salvar.disabled = !temRascunho();
    aoAlterar();
  }

  function confirmarTroca() {
    return !temRascunho() || window.confirm("Descartar as alterações deste destaque?");
  }

  function selecionar(id, novo = false) {
    lista.value = id;
    idAtual = id;
    const jogo = (dados.destaques ?? []).find((item) => item.id === id);
    for (const input of form.elements) {
      if (input.name) input.value = jogo?.[input.name] ?? "";
    }
    form.elements.placarA.value = jogo?.placar?.a ?? "";
    form.elements.placarB.value = jogo?.placar?.b ?? "";
    form.hidden = !jogo && !novo;
    remover.hidden = !jogo;
    status.hidden = true;
    original = serializar();
    atualizar();
  }

  function carregar(dadosNovos, id = "") {
    dados = dadosNovos;
    const modalidades = new Map(dados.modalidades.map((item) => [item.id, item]));
    const titulos = new Map(dados.competicoes.map((item) => [item.id, tituloDisputa(item, modalidades)]));
    const opcoes = (itens, inicial) => [
      new Option(inicial, ""),
      ...[...itens].sort((a, b) => comparar(a[1], b[1])).map(([chave, titulo]) => new Option(titulo, chave)),
    ];
    form.elements.competicaoId.replaceChildren(...opcoes(titulos, "Selecione uma disputa"));
    for (const lado of ["escolaA", "escolaB"]) {
      form.elements[lado].replaceChildren(...opcoes(dados.escolas.map((e) => [e.id, e.nome]), "A confirmar"));
    }
    lista.replaceChildren(...opcoes((dados.destaques ?? []).map((jogo) =>
      [jogo.id, `${jogo.etapa} · ${titulos.get(jogo.competicaoId)}`]), "Selecione um confronto"));
    secao.hidden = false;
    selecionar(id);
  }

  lista.addEventListener("change", () => {
    if (confirmarTroca()) selecionar(lista.value);
    else lista.value = idAtual;
  });
  porId("adicionar-destaque").addEventListener("click", () => {
    if (!confirmarTroca()) return;
    selecionar("", true);
    form.elements.competicaoId.focus();
  });
  porId("fechar-destaque").addEventListener("click", () => {
    if (!confirmarTroca()) return;
    selecionar("");
    lista.focus();
  });
  form.addEventListener("input", atualizar);
  form.addEventListener("change", atualizar);
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (!temRascunho()) return;
    const formulario = campos();
    const jogo = Object.fromEntries(["competicaoId", "etapa", "escolaA", "escolaB", "data", "hora", "local"]
      .map((campo) => [campo, formulario.get(campo).trim() || null]));
    jogo.id = idAtual || `jogo-${crypto.randomUUID()}`;
    const a = formulario.get("placarA");
    const b = formulario.get("placarB");
    jogo.placar = a === "" && b === "" ? null : {
      a: a === "" ? null : Number(a), b: b === "" ? null : Number(b),
    };
    try {
      const atualizados = salvarDestaque(dados, jogo, new Date().toISOString());
      aoSalvar(atualizados);
      carregar(atualizados, jogo.id);
      mensagem("Destaque salvo nesta sessão. Exporte o arquivo para publicar.", "ok");
    } catch (erro) {
      mensagem(erro.message, "erro");
    }
  });
  remover.addEventListener("click", () => {
    if (!window.confirm("Remover este jogo da lista de destaques?")) return;
    const atualizados = removerDestaque(dados, idAtual, new Date().toISOString());
    aoSalvar(atualizados);
    carregar(atualizados);
    mensagem("Destaque removido nesta sessão. Exporte o arquivo para publicar.", "ok");
    lista.focus();
  });
  return { carregar, temRascunho, receberDados: (dadosNovos) => { dados = dadosNovos; } };
}
