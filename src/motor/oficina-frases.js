'use strict';
const { PRIMEIRAS_FRASES } = require('../conteudo/primeiras-frases');

function montarOficina(def, rodada, missao, ctx) {
  const indice = Math.floor((rodada - 1) / 2), repetir = rodada % 2 === 0;
  const modelos = PRIMEIRAS_FRASES[def.id]?.map(p => ({
    en: p.map(x => x[0]).join(' '), pt: p.map(x => x[1]).join(' ').replace(' (para idade)', '').replace(' (mais de um)', ''),
    pedacos: p.map(([en, pt]) => ({ en, pt })),
  })) || def.exemplos.slice().sort((a, b) => a.en.split(/\s+/).length - b.en.split(/\s+/).length).slice(0, 2);
  const modelo = modelos[indice];
  const outro = modelos[1 - indice];
  const ensino = { ...modelo, nota: def.guia?.nota || def.explicacao.texto };
  const criar = (n, extra, comApoio = true) => ({
    id: `oficina:${def.id}:${indice}:${repetir ? 'rever' : 'aprender'}:${n}`,
    missao: def.id, habilidade: 'vocabulario', dif: 1, guiado: true,
    explica: `${modelo.en} = ${modelo.pt}`, ...(comApoio ? { ensino } : {}), ...extra,
  });
  const exercicios = [
    criar(1, { tipo: 'escolha', enunciado: 'Veja o exemplo. Qual é o significado da frase?', opcoes: [modelo.pt, outro.pt], resposta: 0 }),
    criar(2, { tipo: 'ordenar', enunciado: 'Use o modelo para juntar os pedaços da frase.', palavras: modelo.pedacos?.map(p => p.en) || modelo.en.split(/\s+/), resposta: modelo.en }),
    criar(3, { tipo: 'escuta', audio: modelo.en, pergunta: 'Ouça a frase que acabou de aprender. O que ela significa?', opcoes: [modelo.pt, outro.pt], resposta: 0 }),
    criar(4, { tipo: 'ordenar', enunciado: repetir ? `Agora tente lembrar: ${modelo.pt}` : 'Monte mais uma vez, olhando o exemplo se precisar.', palavras: modelo.en.split(/\s+/), resposta: modelo.en }, !repetir),
    criar(5, { tipo: 'ordenar', enunciado: `Sem o modelo desta vez: monte “${modelo.pt}”.`, palavras: modelo.en.split(/\s+/), resposta: modelo.en }, false),
  ];
  return {
    data: ctx.hojeISO, guiada: true, inicianteGuiado: true, oficina: true, minutos: 5, missao,
    revisoesPendentes: ctx.cartoesPendentes || 0,
    porque: [repetir ? 'Vamos repetir a mesma frase e retirar o modelo aos poucos.' : 'Hoje vamos aprender uma frase, entender cada pedaço e praticar antes de escrever sozinho.'],
    blocos: [
      { tipo: 'explicacao', guiada: true, titulo: repetir ? 'A mesma frase, mais uma vez' : 'Vamos aprender a montar uma frase', texto: 'Veja o significado, ouça e siga o modelo. Você pode consultar a explicação durante os primeiros exercícios.', estrutura: [modelo.en], exemplos: [modelo], vocab: (modelo.pedacos || [modelo]).map(p => ({ ...p, ex: p.en })), missao: def.id },
      { tipo: 'exercicios', titulo: 'Aprenda fazendo, com apoio', devagar: true, exercicios },
    ],
  };
}
module.exports = { montarOficina };
