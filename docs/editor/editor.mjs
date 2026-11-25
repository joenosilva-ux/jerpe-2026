import {
  atualizarDisputa, carregarCampeonato, estados, lerCampeonato, medalhas, tituloDisputa, validar,
} from "../js/campeonato.mjs";
import { prepararEditorDestaques } from "./destaques.mjs";
import { mostrarCorrida } from "./corrida-titulo.mjs";

const porId = (id) => document.getElementById(id);
const modalidade = porId("modalidade");
const disputa = porId("disputa");
const situacao = porId("situacao");
const formulario = porId("formulario");
const salvar = porId("salvar");
const exportar = porId("exportar");
const comparar = new Intl.Collator("pt-BR", { numeric: true }).compare;
const nomesEstados = { ...estados, aguardando: "Confirmada · aguardando pódio" };
let dados;
let modalidades;
let disputaAtual;
let modalidadeAnterior = "";
let alteracoesExportaveis = false;
let carregando = false;
const destaques = prepararEditorDestaques((atualizados) => {
  dados = atualizados;
  alteracoesExportaveis = true;
}, atualizarExportacao);

function atualizarExportacao() {
  exportar.disabled = carregando || temRascunho() || destaques.temRascunho();
}

function mensagem(texto, tipo = "") {
  const status = porId("status");
  status.className = ["aviso", tipo].filter(Boolean).join(" ");
  status.textContent = texto;
}

function valores() {
  return {
    status: situacao.value,
    podio: situacao.value === "divulgado" ?
      Object.fromEntries(medalhas.map((m) => [m, porId(m).value || null])) : null,
  };
}

function temRascunho() {
  if (!disputaAtual) return false;
  const { status, podio } = valores();
  return status !== disputaAtual.status ||
    (status === "divulgado" && medalhas.some((m) => podio[m] !== disputaAtual.podio?.[m]));
}

function atualizarFormulario() {
  const exibirPodio = situacao.value === "divulgado";
  porId("campos-podio").hidden = !exibirPodio;
  porId("campos-podio").disabled = !exibirPodio;
  salvar.disabled = !temRascunho();
  atualizarExportacao();
  porId("orientacao").textContent = exibirPodio ?
    "Preencha 1º e 2º lugar. Deixe o bronze vazio se ele não foi concedido." :
    disputaAtual?.status === "divulgado" ? "Ao salvar sem pódio, as medalhas serão retiradas do quadro geral." : "";
}

function selecionarDisputa(id) {
  disputaAtual = dados.competicoes.find((item) => item.id === id);
  formulario.hidden = !disputaAtual;
  porId("fonte").textContent = "";
  if (disputaAtual) {
    situacao.value = disputaAtual.status;
    for (const m of medalhas) porId(m).value = disputaAtual.podio?.[m] ?? "";
    porId("fonte").textContent = [disputaAtual.fonte, disputaAtual.observacao].filter(Boolean).join(" · ");
  }
  atualizarFormulario();
}

function preencherDisputas(id = "") {
  const itens = dados.competicoes.filter((item) => !modalidade.value || item.modalidadeId === modalidade.value);
  const listadas = itens.map((item) => [item, tituloDisputa(item, modalidades)]);
  listadas.sort((a, b) => comparar(a[1], b[1]));
  disputa.replaceChildren(new Option("Selecione uma disputa", ""), ...listadas.map(([item, titulo]) =>
    new Option(`${titulo} — ${nomesEstados[item.status]}`, item.id)));
  disputa.value = itens.some((item) => item.id === id) ? id : "";
  selecionarDisputa(disputa.value);
}

function carregar(dadosNovos, descricao) {
  dados = dadosNovos;
  modalidades = new Map(dados.modalidades.map((item) => [item.id, item]));
  modalidade.replaceChildren(new Option("Todas as modalidades", ""),
    ...[...modalidades.values()].sort((a, b) => comparar(a.nome, b.nome))
      .map((item) => new Option(item.nome, item.id)));
  modalidadeAnterior = "";
  situacao.replaceChildren(...Object.entries(nomesEstados).map(([id, nome]) => new Option(nome, id)));
  const escolas = [...dados.escolas].sort((a, b) => comparar(a.nome, b.nome));
  for (const m of medalhas) {
    porId(m).replaceChildren(new Option(m === "bronze" ? "Sem bronze" : "Selecione uma escola", ""),
      ...escolas.map((escola) => new Option(escola.nome, escola.id)));
  }
  alteracoesExportaveis = false;
  preencherDisputas();
  destaques.carregar(dados);
  mostrarCorrida(dados, porId("corrida"));
  porId("edicao").hidden = false;
  porId("exportacao").hidden = false;
  mensagem(`${descricao} · ${dados.competicoes.length} disputas.`, "ok");
}

function confirmarTrocaBase() {
  return (!temRascunho() && !destaques.temRascunho() && !alteracoesExportaveis) ||
    window.confirm("Descartar alterações ainda não exportadas e abrir outra base?");
}

async function abrirBase(leitura, descricao) {
  if (carregando || !confirmarTrocaBase()) return;
  carregando = true;
  porId("carregar").disabled = true;
  porId("arquivo").disabled = true;
  porId("edicao").inert = true;
  porId("edicao-destaques").inert = true;
  exportar.disabled = true;
  try {
    carregar(await leitura(), descricao);
  } catch (erro) {
    mensagem(erro.message, "erro");
  } finally {
    carregando = false;
    porId("carregar").disabled = false;
    porId("arquivo").disabled = false;
    porId("edicao").inert = false;
    porId("edicao-destaques").inert = false;
    atualizarFormulario();
  }
}

porId("carregar").addEventListener("click", () => abrirBase(carregarCampeonato, "Base do site carregada"));
porId("arquivo").addEventListener("change", async (evento) => {
  const arquivo = evento.currentTarget.files[0];
  evento.currentTarget.value = "";
  if (arquivo) await abrirBase(async () => lerCampeonato(await arquivo.text()), "Arquivo importado");
});
modalidade.addEventListener("change", () => {
  if (temRascunho() && !window.confirm("Descartar as alterações desta disputa?")) {
    modalidade.value = modalidadeAnterior;
    return;
  }
  modalidadeAnterior = modalidade.value;
  preencherDisputas(disputa.value);
});
disputa.addEventListener("change", () => {
  if (temRascunho() && !window.confirm("Descartar as alterações desta disputa?")) {
    disputa.value = disputaAtual.id;
    return;
  }
  selecionarDisputa(disputa.value);
});
formulario.addEventListener("change", atualizarFormulario);
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!temRascunho()) return;
  const alteracao = valores();
  if (disputaAtual.status === "divulgado" && alteracao.status !== "divulgado" &&
      !window.confirm("Salvar esta situação e retirar o pódio do quadro de medalhas?")) return;
  const agora = new Date().toISOString();
  alteracao.divulgadoEm = disputaAtual.divulgadoEm ?? agora;
  try {
    dados = atualizarDisputa(dados, disputaAtual.id, alteracao, agora);
    destaques.receberDados(dados);
    alteracoesExportaveis = true;
    preencherDisputas(disputaAtual.id);
    mostrarCorrida(dados, porId("corrida"));
    mensagem("Alteração salva nesta sessão. Exporte o arquivo para publicar.", "ok");
  } catch (erro) {
    mensagem(erro.message, "erro");
  }
});
exportar.addEventListener("click", () => {
  if (!dados || temRascunho() || destaques.temRascunho()) return;
  const erros = validar(dados);
  if (erros.length) {
    mensagem(erros.join("\n"), "erro");
    return;
  }
  const arquivo = new Blob([JSON.stringify(dados, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "campeonato.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  alteracoesExportaveis = false;
  mensagem("Arquivo exportado. Substitua docs/dados/campeonato.json pelo download.", "ok");
});
window.addEventListener("beforeunload", (evento) => {
  if (temRascunho() || destaques.temRascunho() || alteracoesExportaveis) {
    evento.preventDefault();
    evento.returnValue = true;
  }
});

abrirBase(carregarCampeonato, "Base do site carregada");
