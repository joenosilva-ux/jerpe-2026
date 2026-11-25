import { quadroDeMedalhas } from "../docs/js/campeonato.mjs";

const compararNomes = new Intl.Collator("pt-BR").compare;
const rotulos = {
  aguardando: "Aguardando confirmação",
  semRivais: "Sem rivais",
  garantida: "Liderança garantida",
  possivel: "Pode garantir",
  podeEmpatar: "Pode apenas empatar em ouros",
  empate: "Empate em ouros",
  semChance: "Sem chance em ouros",
};

export function calcularCorrida(dados) {
  const distribuidos = dados.competicoes.filter((disputa) => disputa.status === "divulgado").length;
  const emDisputa = dados.competicoes.filter((disputa) => disputa.status === "aguardando").length;
  const aConfirmar = dados.competicoes.filter((disputa) => disputa.status === "a-confirmar").length;
  const confirmados = distribuidos + emDisputa;
  const quadro = quadroDeMedalhas(dados).sort((a, b) => b.ouro - a.ouro || compararNomes(a.nome, b.nome));
  const escolas = quadro.map((escola, indice) => {
    const atuais = escola.ouro;
    const maximo = atuais + emDisputa;
    const melhorRival = quadro[indice === 0 ? 1 : 0]?.ouro;
    const linha = { id: escola.id, nome: escola.nome, atuais, maximo, ultrapassar: null, garantir: null };
    if (!confirmados) return { ...linha, situacao: "aguardando" };
    if (melhorRival === undefined) return { ...linha, situacao: "semRivais" };

    const ultrapassar = Math.max(0, melhorRival + 1 - atuais);
    const garantir = Math.max(0, Math.floor((melhorRival + emDisputa - atuais) / 2) + 1);
    // A garantia exige ficar à frente mesmo se a melhor rival ganhar todos os ouros que sobrarem.
    let situacao;
    if (garantir === 0) situacao = "garantida";
    else if (garantir <= emDisputa) situacao = "possivel";
    else if (maximo === melhorRival) situacao = emDisputa === 0 ? "empate" : "podeEmpatar";
    else situacao = "semChance";
    return {
      ...linha,
      ultrapassar: ultrapassar <= emDisputa ? ultrapassar : null,
      garantir: garantir <= emDisputa ? garantir : null,
      situacao,
    };
  });
  return { confirmados, distribuidos, emDisputa, aConfirmar, escolas };
}

export function mostrarCorrida(dados, secao) {
  const corrida = calcularCorrida(dados);
  for (const campo of ["confirmados", "distribuidos", "emDisputa", "aConfirmar"]) {
    secao.querySelector(`[data-corrida="${campo}"]`).textContent = corrida[campo];
  }
  const percentual = corrida.confirmados ?
    new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 })
      .format(corrida.distribuidos / corrida.confirmados) : "Aguardando confirmação";
  secao.querySelector('[data-corrida="percentual"]').textContent = percentual;

  const linhas = corrida.escolas.map((escola) => {
    const tr = document.createElement("tr");
    const nome = document.createElement("th");
    nome.scope = "row";
    nome.textContent = escola.nome;
    tr.append(nome);
    const ultrapassar = escola.ultrapassar === 0 ? "Já lidera" : escola.ultrapassar;
    const valores = [escola.atuais, escola.maximo, ultrapassar, escola.garantir, rotulos[escola.situacao]];
    for (const valor of valores) {
      const td = document.createElement("td");
      td.textContent = valor ?? "—";
      tr.append(td);
    }
    tr.lastElementChild.className = `situacao-corrida corrida-${escola.situacao}`;
    return tr;
  });
  secao.querySelector("tbody").replaceChildren(...linhas);
  secao.hidden = false;
}
