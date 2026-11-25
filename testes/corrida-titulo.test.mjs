import assert from "node:assert/strict";
import test from "node:test";
import { atualizarDisputa } from "../docs/js/campeonato.mjs";
import { calcularCorrida } from "../ferramentas/corrida-titulo.mjs";

const nomes = ["Luís Alberto", "Menino Jesus", "Ivanilde Braga", "Alegria de Saber", "Gilberto Mestrinho", "Luiz Fernando"];
const escolas = nomes.map((nome, i) => ({ id: `escola-${i + 1}`, nome }));
const data = "2026-11-26T19:30:00.000Z";

function campeonato(distribuicao, restantes, pendentes = 0, canceladas = 0) {
  const competicoes = [];
  const disputa = (status, escola) => ({
    id: `disputa-${competicoes.length + 1}`, modalidadeId: "futsal", nome: "Futsal",
    fonte: "Teste em memória", status, podio: escola ?
      { ouro: escola, prata: escola === "escola-1" ? "escola-2" : "escola-1", bronze: null } : null,
    ...(escola ? { divulgadoEm: data } : {}),
  });
  distribuicao.forEach((total, i) => {
    for (let j = 0; j < total; j++) competicoes.push(disputa("divulgado", escolas[i].id));
  });
  for (const [status, total] of [["aguardando", restantes], ["a-confirmar", pendentes], ["cancelado", canceladas]]) {
    for (let j = 0; j < total; j++) competicoes.push(disputa(status));
  }
  return {
    versao: 1,
    edicao: { nome: "JERPE", local: "Rio Preto da Eva", ano: 2026, fuso: "America/Manaus", atualizadoEm: null },
    regras: { classificacao: "olimpica", provisoria: true },
    escolas: escolas.slice(0, distribuicao.length),
    modalidades: [{ id: "futsal", nome: "Futsal", tipo: "coletiva" }],
    competicoes,
  };
}

test("28 ouros distribuídos e 12 em aberto dão as metas do exemplo", () => {
  const dados = campeonato([12, 7, 5, 3, 1, 0], 12, 1, 2);
  const resultado = calcularCorrida(dados);
  assert.deepEqual([resultado.confirmados, resultado.distribuidos, resultado.emDisputa, resultado.aConfirmar], [40, 28, 12, 1]);
  assert.deepEqual(resultado.escolas.map((e) => [e.ultrapassar, e.garantir, e.maximo]),
    [[0, 4, 24], [6, 9, 19], [8, 10, 17], [10, 11, 15], [12, 12, 13], [null, null, 12]]);
  assert.equal(resultado.escolas.find((e) => e.id === "escola-6").situacao, "podeEmpatar");
});

test("distingue liderança garantida, eliminação e empate com todos os ouros definidos", () => {
  const corrida = calcularCorrida(campeonato([5, 3, 1], 1));
  assert.equal(corrida.escolas[0].garantir, 0);
  assert.equal(corrida.escolas[0].situacao, "garantida");
  assert.equal(corrida.escolas[2].situacao, "semChance");
  const final = calcularCorrida(campeonato([4, 4, 2], 0));
  assert.deepEqual(final.escolas.map((e) => e.situacao), ["empate", "empate", "semChance"]);
});

test("campeonato sem pódios calcula metas somente quando há disputas confirmadas", () => {
  const semConfirmadas = calcularCorrida(campeonato([0, 0], 0, 4));
  assert.equal(semConfirmadas.confirmados, 0);
  assert.ok(semConfirmadas.escolas.every((e) => e.situacao === "aguardando" && e.garantir === null));
  const aberto = calcularCorrida(campeonato([0, 0], 3));
  assert.ok(aberto.escolas.every((e) => e.situacao === "possivel" && e.garantir === 2));
});

test("confirmar, lançar, corrigir e cancelar uma disputa muda os totais em memória", () => {
  const base = campeonato([0, 0, 0, 0, 0, 0], 0, 1);
  const id = "disputa-1";
  const gravar = (dados, ouro) => atualizarDisputa(dados, id, {
    status: "divulgado", podio: { ouro, prata: "escola-6", bronze: null }, divulgadoEm: data,
  }, data);
  const confirmada = atualizarDisputa(base, id, { status: "aguardando" }, data);
  assert.equal(calcularCorrida(confirmada).emDisputa, 1);
  const publicada = gravar(confirmada, "escola-1");
  assert.equal(calcularCorrida(publicada).distribuidos, 1);
  assert.equal(calcularCorrida(publicada).escolas[0].id, "escola-1");
  const corrigida = gravar(publicada, "escola-2");
  assert.equal(calcularCorrida(corrigida).escolas[0].id, "escola-2");
  const cancelada = atualizarDisputa(corrigida, id, { status: "cancelado" }, data);
  assert.equal(calcularCorrida(cancelada).confirmados, 0);
  assert.equal(calcularCorrida(base).aConfirmar, 1);
  assert.equal(Object.hasOwn(corrigida, "corrida"), false);
});
