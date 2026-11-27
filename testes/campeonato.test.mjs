import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  agruparDestaques, atualizarDisputa, diaNoFuso, filtrarDisputas, lerCampeonato,
  quadroDeMedalhas, removerDestaque, salvarDestaque, validar,
} from "../docs/js/campeonato.mjs";

const json = readFileSync(new URL("../docs/dados/campeonato.json", import.meta.url), "utf8");
const inicial = lerCampeonato(json);
// Os cenários começam sem pódios, mesmo depois de a base do site receber resultados.
for (const disputa of inicial.competicoes) {
  if (disputa.status !== "divulgado") continue;
  disputa.status = "aguardando";
  disputa.podio = null;
  delete disputa.divulgadoEm;
}
const data = "2026-11-26T19:30:00.000Z";
const futsal = "futsal-unica-masculino";
const volei = "volei-unica-feminino";
const atletismo = "atletismo-80m-infantil-feminino";
const primeiro = "luis-alberto";
const segundo = "menino-jesus";
const terceiro = "ivanilde-braga";

function registrar(dados, id, ouro, prata, bronze = null) {
  return atualizarDisputa(dados, id, {
    status: "divulgado", podio: { ouro, prata, bronze }, divulgadoEm: data,
  }, data);
}

test("base inicial sem liderança ou resultados inventados", () => {
  assert.deepEqual(validar(inicial), []);
  assert.ok(inicial.escolas.length > 0);
  assert.equal(filtrarDisputas(inicial.competicoes, { status: "divulgado" }).length, 0);
  assert.ok(quadroDeMedalhas(inicial).every((linha) => linha.posicao === null && linha.total === 0));
});

test("registra, filtra, corrige e cancela um pódio", () => {
  const publicado = registrar(inicial, futsal, primeiro, segundo);
  assert.equal(publicado.edicao.atualizadoEm, data);
  assert.equal(quadroDeMedalhas(publicado)[0].id, primeiro);
  const filtro = { modalidade: "futsal", escola: segundo, status: "divulgado" };
  assert.deepEqual(filtrarDisputas(publicado.competicoes, filtro).map((d) => d.id), [futsal]);
  const corrigido = registrar(publicado, futsal, segundo, primeiro, terceiro);
  assert.equal(quadroDeMedalhas(corrigido)[0].id, segundo);
  const cancelado = atualizarDisputa(corrigido, futsal, { status: "cancelado" }, data);
  assert.equal(filtrarDisputas(cancelado.competicoes, filtro).length, 0);
  assert.equal(filtrarDisputas(cancelado.competicoes, { status: "cancelado" })[0].podio, null);
  assert.ok(quadroDeMedalhas(cancelado).every((linha) => linha.posicao === null && linha.total === 0));
  assert.deepEqual(lerCampeonato(JSON.stringify(cancelado)), cancelado);
});

test("empate mantém a mesma posição após a ordenação", () => {
  const publicado = registrar(registrar(inicial, futsal, primeiro, segundo), volei, segundo, primeiro);
  assert.deepEqual(quadroDeMedalhas(publicado).slice(0, 3).map((e) => e.posicao), [1, 1, 3]);
});

test("valida escolas, IDs, pódio coletivo e entrada JSON", () => {
  assert.throws(() => lerCampeonato("{"), /JSON válido/);
  assert.throws(() => registrar(inicial, futsal, "desconhecida", segundo), /escola inexistente/);
  assert.throws(() => registrar(inicial, futsal, primeiro, primeiro), /pódio coletivo/);
  assert.throws(() => registrar(inicial, futsal, null, segundo), /informe o 1º lugar/);
  const semPrata = registrar(inicial, futsal, primeiro, null);
  assert.deepEqual(quadroDeMedalhas(semPrata)[0], {
    ...inicial.escolas.find((escola) => escola.id === primeiro),
    ouro: 1, prata: 0, bronze: 0, total: 1, posicao: 1,
  });
  assert.ok(validar({ ...inicial, escolas: [...inicial.escolas, inicial.escolas[0]] })
    .some((erro) => erro.includes("duplicado")));
});

test("uma prova individual pode premiar duas vezes a mesma escola", () => {
  const publicado = registrar(inicial, atletismo, primeiro, primeiro);
  assert.equal(quadroDeMedalhas(publicado)[0].total, 2);
});

test("escolas e modalidades novas entram pelo JSON", () => {
  const dados = structuredClone(inicial);
  dados.escolas.push({ id: "escola-exemplo", nome: "Escola de exemplo" });
  dados.modalidades.push({ id: "queimada", nome: "Queimada", tipo: "coletiva" });
  const id = "queimada-infantil-feminino";
  dados.competicoes.push({
    id, modalidadeId: "queimada", nome: "Queimada", categoria: "infantil", naipe: "feminino",
    fonte: "Teste", status: "aguardando", podio: null,
  });
  const publicado = registrar(dados, id, "escola-exemplo", primeiro);
  assert.equal(quadroDeMedalhas(publicado)[0].id, "escola-exemplo");
  assert.equal(filtrarDisputas(publicado.competicoes, { modalidade: "queimada" }).length, 1);
});

test("cria destaque sem data, confirma agenda e publica placar sem alterar medalhas", () => {
  const anterior = structuredClone(inicial);
  delete anterior.destaques;
  const jogo = { id: "final-teste", competicaoId: futsal, etapa: "Final", escolaA: primeiro };
  const anunciado = salvarDestaque(lerCampeonato(JSON.stringify(anterior)), jogo, data);
  assert.equal(agruparDestaques(anunciado.destaques, "2026-11-24").proximos.length, 1);
  const agendado = salvarDestaque(anunciado, { ...jogo, data: "2026-11-26", hora: "16:00" }, data);
  assert.equal(agendado.destaques.length, 1);
  assert.equal(agruparDestaques(agendado.destaques, "2026-11-27").pendentes.length, 1);
  const encerrado = salvarDestaque(agendado, {
    ...agendado.destaques[0], escolaB: segundo, placar: { a: 0, b: 0 },
  }, data);
  assert.deepEqual(agruparDestaques(encerrado.destaques, "2026-11-26").resultados[0].placar, { a: 0, b: 0 });
  assert.deepEqual(quadroDeMedalhas(encerrado), quadroDeMedalhas(inicial));
  assert.deepEqual(removerDestaque(encerrado, jogo.id, data).destaques, []);
});

test("valida placar incompleto, escolas repetidas e data de jogo", () => {
  const jogo = { id: "final-teste", competicaoId: futsal, etapa: "Final", escolaA: primeiro, escolaB: segundo };
  assert.throws(() => salvarDestaque(inicial, { ...jogo, placar: { a: 0, b: null } }, data), /placar/);
  assert.throws(() => salvarDestaque(inicial, { ...jogo, escolaB: primeiro }, data), /diferentes/);
  assert.throws(() => salvarDestaque(inicial, { ...jogo, data: "2026-02-30" }, data), /data inválida/);
  assert.equal(diaNoFuso("America/Manaus", new Date("2026-11-26T03:59:00Z")), "2026-11-25");
});
