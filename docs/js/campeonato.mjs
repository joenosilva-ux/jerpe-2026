export const medalhas = ["ouro", "prata", "bronze"];
const camposPodio = [...medalhas, "medalhasAdicionais"];
export const estados = {
  "a-confirmar": "Disputa a confirmar",
  aguardando: "Pódio ainda não divulgado",
  divulgado: "Pódio divulgado",
  cancelado: "Disputa cancelada",
};

const categorias = { unica: "Categoria única", infantil: "Infantil", juvenil: "Juvenil" };
const naipes = { feminino: "Feminino", masculino: "Masculino", misto: "Misto" };
const compararTexto = new Intl.Collator("pt-BR").compare;
const registro = (valor) => valor !== null && typeof valor === "object" && !Array.isArray(valor);
const texto = (valor) => typeof valor === "string" && valor.trim().length > 0;
const idValido = (valor) => texto(valor) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(valor);
const dataValida = (valor) => texto(valor) &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(valor) &&
  Number.isFinite(Date.parse(valor));
const dataCalendarioValida = (valor) => typeof valor === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(valor) && Number.isFinite(Date.parse(valor)) &&
  new Date(valor).toISOString().slice(0, 10) === valor;
const placarValido = (valor) => Number.isSafeInteger(valor) && valor >= 0;

export function detalhes(disputa) {
  return [
    categorias[disputa.categoria] ?? disputa.categoria,
    naipes[disputa.naipe] ?? disputa.naipe,
  ].filter(Boolean).join(" · ");
}

export function tituloDisputa(disputa, modalidades) {
  const modalidade = modalidades.get(disputa.modalidadeId);
  const titulo = modalidade.nome === disputa.nome ? disputa.nome : `${modalidade.nome} · ${disputa.nome}`;
  return [titulo, detalhes(disputa)].filter(Boolean).join(" · ");
}

export function medalhasDoPodio(podio) {
  const adicionais = podio.medalhasAdicionais ?? [];
  return medalhas.flatMap((tipo) => {
    const escolaId = podio[tipo];
    const principais = escolaId === null ? [] : [{ tipo, escolaId }];
    return [...principais, ...adicionais.filter((medalha) => medalha.tipo === tipo)];
  });
}

export function validar(dados) {
  if (!registro(dados) || dados.versao !== 1) return ["Formato ou versão do campeonato inválida."];
  const erros = [];
  if (!registro(dados.edicao) || !texto(dados.edicao.nome) || !texto(dados.edicao.local) ||
      !Number.isInteger(dados.edicao.ano) || !texto(dados.edicao.fuso)) {
    erros.push("Dados da edição incompletos.");
  } else {
    try {
      new Intl.DateTimeFormat("pt-BR", { timeZone: dados.edicao.fuso });
    } catch {
      erros.push("Fuso horário da edição inválido.");
    }
    if (dados.edicao.atualizadoEm !== null && !dataValida(dados.edicao.atualizadoEm)) {
      erros.push("Data de atualização inválida.");
    }
  }
  if (dados.regras?.classificacao !== "olimpica" || typeof dados.regras.provisoria !== "boolean") {
    erros.push("Critério de classificação inválido.");
  }

  const indices = {};
  for (const chave of ["escolas", "modalidades", "competicoes"]) {
    const itens = dados[chave];
    const indice = new Map();
    indices[chave] = indice;
    if (!Array.isArray(itens)) {
      erros.push(`Lista de ${chave} inválida.`);
      continue;
    }
    for (const item of itens) {
      if (!registro(item) || !idValido(item.id) || !texto(item.nome)) {
        erros.push(`Registro em ${chave} com ID ou nome inválido.`);
        continue;
      }
      if (indice.has(item.id)) erros.push(`ID duplicado em ${chave} (${item.id}).`);
      indice.set(item.id, item);
    }
  }
  for (const modalidade of indices.modalidades.values()) {
    if (!["individual", "coletiva"].includes(modalidade.tipo)) {
      erros.push(`Tipo de modalidade inválido (${modalidade.id}).`);
    }
  }
  for (const disputa of indices.competicoes.values()) {
    const prefixo = `${disputa.id}: `;
    const modalidade = indices.modalidades.get(disputa.modalidadeId);
    if (!modalidade) erros.push(prefixo + "modalidade inexistente.");
    if (!Object.hasOwn(estados, disputa.status)) erros.push(prefixo + "situação inválida.");
    for (const chave of ["categoria", "naipe", "observacao"]) {
      if (disputa[chave] != null && !texto(disputa[chave])) erros.push(prefixo + `${chave} inválido.`);
    }
    if (!texto(disputa.fonte)) erros.push(prefixo + "fonte ausente.");
    if (disputa.status !== "divulgado") {
      if (disputa.podio !== null || disputa.divulgadoEm != null) {
        erros.push(prefixo + "a situação selecionada não aceita pódio ou data de divulgação.");
      }
      continue;
    }
    const podio = disputa.podio;
    if (!registro(podio) || !podio.ouro || !Object.hasOwn(podio, "prata") ||
        !Object.hasOwn(podio, "bronze") ||
        Object.keys(podio).some((chave) => !camposPodio.includes(chave))) {
      erros.push(prefixo + "informe o 1º lugar. A prata e o bronze podem ficar vazios.");
      continue;
    }
    const adicionais = podio.medalhasAdicionais;
    if (Object.hasOwn(podio, "medalhasAdicionais") &&
        (!Array.isArray(adicionais) || adicionais.some((medalha) =>
          !registro(medalha) || !medalhas.includes(medalha.tipo) || !idValido(medalha.escolaId)))) {
      erros.push(prefixo + "cada medalha excepcional deve ter um tipo válido e uma escola.");
      continue;
    }
    const concedidas = medalhasDoPodio(podio);
    const premiadas = concedidas.map(({ escolaId }) => escolaId);
    if (premiadas.some((escola) => !indices.escolas.has(escola))) {
      erros.push(prefixo + "o pódio contém uma escola inexistente.");
    }
    if (new Set(concedidas.map(({ tipo, escolaId }) => `${tipo}:${escolaId}`)).size !== concedidas.length) {
      erros.push(prefixo + "a mesma medalha está repetida para uma escola.");
    }
    if (modalidade?.tipo === "coletiva" && new Set(premiadas).size !== premiadas.length) {
      erros.push(prefixo + "uma escola só pode ocupar uma posição no pódio coletivo.");
    }
    if (!dataValida(disputa.divulgadoEm)) erros.push(prefixo + "data de divulgação inválida.");
  }
  if (dados.destaques !== undefined) {
    if (!Array.isArray(dados.destaques)) erros.push("Lista de jogos em destaque inválida.");
    else validarDestaques(dados.destaques, indices, erros);
  }
  return erros;
}

function validarDestaques(destaques, indices, erros) {
  const ids = new Set();
  for (const jogo of destaques) {
    if (!registro(jogo) || !idValido(jogo.id)) {
      erros.push("Jogo em destaque com ID inválido.");
      continue;
    }
    const prefixo = `Destaque ${jogo.id}: `;
    if (ids.has(jogo.id)) erros.push(prefixo + "ID duplicado.");
    ids.add(jogo.id);
    if (!indices.competicoes.has(jogo.competicaoId)) erros.push(prefixo + "selecione uma disputa.");
    if (!texto(jogo.etapa) || jogo.etapa.length > 80) erros.push(prefixo + "informe o nome do confronto (até 80 caracteres).");
    if (jogo.local != null && (!texto(jogo.local) || jogo.local.length > 100)) erros.push(prefixo + "local inválido.");
    if (jogo.data != null && !dataCalendarioValida(jogo.data)) erros.push(prefixo + "data inválida.");
    if (jogo.hora != null && (typeof jogo.hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(jogo.hora))) {
      erros.push(prefixo + "horário inválido.");
    }
    const lados = [jogo.escolaA, jogo.escolaB].filter((escola) => escola != null);
    if (lados.some((escola) => !indices.escolas.has(escola)) || new Set(lados).size !== lados.length) {
      erros.push(prefixo + "selecione escolas participantes válidas e diferentes.");
    }
    if (jogo.placar != null &&
        (lados.length !== 2 || !registro(jogo.placar) || !placarValido(jogo.placar.a) || !placarValido(jogo.placar.b))) {
      erros.push(prefixo + "para registrar o placar, informe as duas escolas e dois números inteiros a partir de zero.");
    }
    if (jogo.atualizadoEm != null && !dataValida(jogo.atualizadoEm)) erros.push(prefixo + "data de atualização inválida.");
  }
}

export function lerCampeonato(json) {
  let dados;
  try {
    dados = JSON.parse(json.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("O arquivo não contém JSON válido.");
  }
  const erros = validar(dados);
  if (erros.length) throw new Error(erros.join("\n"));
  return dados;
}

export async function carregarCampeonato() {
  const resposta = await fetch(new URL("../dados/campeonato.json", import.meta.url), { cache: "no-cache" });
  if (!resposta.ok) throw new Error("O arquivo de resultados está indisponível.");
  return lerCampeonato(await resposta.text());
}

function compararMedalhas(a, b) {
  for (const medalha of medalhas) {
    if (a[medalha] !== b[medalha]) return b[medalha] - a[medalha];
  }
  return 0;
}

export function quadroDeMedalhas(dados) {
  const linhas = new Map(dados.escolas.map((escola) => [
    escola.id, { ...escola, ouro: 0, prata: 0, bronze: 0, total: 0, posicao: null },
  ]));
  for (const disputa of dados.competicoes) {
    if (disputa.status !== "divulgado") continue;
    for (const { tipo, escolaId } of medalhasDoPodio(disputa.podio)) {
      const escola = linhas.get(escolaId);
      if (!escola) continue;
      escola[tipo]++;
      escola.total++;
    }
  }
  return classificar([...linhas.values()]);
}

function classificar(linhas) {
  const quadro = linhas.sort((a, b) =>
    compararMedalhas(a, b) || compararTexto(a.nome, b.nome));
  quadro.forEach((linha, i) => {
    if (!quadro[0].total) return;
    const anterior = quadro[i - 1];
    linha.posicao = anterior && compararMedalhas(anterior, linha) === 0 ? anterior.posicao : i + 1;
  });
  return quadro;
}

export function salvarDestaque(dados, jogo, agora) {
  const destaques = dados.destaques ?? [];
  const revista = { ...jogo, atualizadoEm: agora };
  const existentes = destaques.some((item) => item.id === jogo.id);
  return alterarDestaques(dados, existentes ?
    destaques.map((item) => item.id === jogo.id ? revista : item) : [...destaques, revista], agora);
}

export function removerDestaque(dados, id, agora) {
  const destaques = dados.destaques ?? [];
  if (!destaques.some((item) => item.id === id)) throw new Error("Selecione um destaque existente.");
  return alterarDestaques(dados, destaques.filter((item) => item.id !== id), agora);
}

function alterarDestaques(dados, destaques, atualizadoEm) {
  const atualizados = { ...dados, destaques, edicao: { ...dados.edicao, atualizadoEm } };
  const erros = validar(atualizados);
  if (erros.length) throw new Error(erros.join("\n"));
  return atualizados;
}

export function agruparDestaques(destaques, hoje) {
  const ordemAgenda = (a, b) =>
    (a.data ?? "9999").localeCompare(b.data ?? "9999") ||
    (a.hora ?? "99:99").localeCompare(b.hora ?? "99:99");
  const porAtualizacao = (a, b) => (Date.parse(b.atualizadoEm) || 0) - (Date.parse(a.atualizadoEm) || 0);
  return {
    proximos: destaques.filter((j) => j.placar == null && (!j.data || j.data >= hoje)).sort(ordemAgenda),
    pendentes: destaques.filter((j) => j.placar == null && j.data && j.data < hoje).sort((a, b) => ordemAgenda(b, a)),
    resultados: destaques.filter((j) => j.placar != null).sort(porAtualizacao),
  };
}

export function diaNoFuso(fuso, data = new Date()) {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(data);
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

export function filtrarDisputas(disputas, { modalidade = "", escola = "", status = "" } = {}) {
  return disputas.filter((disputa) =>
    (!modalidade || disputa.modalidadeId === modalidade) &&
    (!status || disputa.status === status) &&
    (!escola || (disputa.status === "divulgado" &&
      medalhasDoPodio(disputa.podio).some(({ escolaId }) => escolaId === escola))));
}

export function atualizarDisputa(dados, id, { status, podio, divulgadoEm }, atualizadoEm) {
  const existente = dados.competicoes.find((disputa) => disputa.id === id);
  if (!existente) throw new Error("Selecione uma disputa válida.");
  const revista = { ...existente, status, podio: status === "divulgado" ? podio : null };
  delete revista.divulgadoEm;
  if (status === "divulgado") revista.divulgadoEm = divulgadoEm;
  if (status !== existente.status || JSON.stringify(revista.podio) !== JSON.stringify(existente.podio) ||
      revista.divulgadoEm !== existente.divulgadoEm) {
    const atualizados = {
      ...dados,
      edicao: { ...dados.edicao, atualizadoEm },
      competicoes: dados.competicoes.map((disputa) => disputa.id === id ? revista : disputa),
    };
    const erros = validar(atualizados);
    if (erros.length) throw new Error(erros.join("\n"));
    return atualizados;
  }
  return dados;
}

export function dataLocal(valor, edicao, incluirHora = false) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: edicao.fuso,
    dateStyle: "medium",
    ...(incluirHora ? { timeStyle: "short" } : {}),
  }).format(new Date(valor));
}
