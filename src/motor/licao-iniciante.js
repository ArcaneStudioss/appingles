'use strict';
const { POR_ID } = require('../conteudo/missoes');
const { licoesPorMissao } = require('./plano');

// Antes de exigir frases livres, apresentar só duas expressões e revisitá-las
// na aula seguinte. IDs estáveis entre aulas preservam o histórico de prática.
function montarBaseIniciante(ctx, atual) {
  if (ctx.nivel !== 'A1' || !atual) return null;
  const def = POR_ID[atual.id];
  const total = licoesPorMissao(def, ctx.nivel);
  const parte = Math.min(total, (ctx.competencias?.[def.id]?.partes || 0) + 1);
  if (parte > total - 3) return null;
  const grupo = Math.floor((parte - 1) / 2);
  const repetir = parte % 2 === 0;
  const vocab = def.vocab.slice(grupo * 2, grupo * 2 + 2);
  const base = (v, i, modo) => ({
    id: `base:${def.id}:${grupo * 2 + i}:${modo}`, missao: def.id,
    habilidade: modo === 'ouvir' ? 'escuta' : 'vocabulario', dif: 1,
    explica: `${v.en} = ${v.pt}. Ouça e repita quantas vezes precisar.`,
  });
  const escolha = (v, i, modo) => {
    const outra = def.vocab.find(x => x.pt !== v.pt);
    return { ...base(v, i, modo), tipo: modo === 'ouvir' ? 'escuta' : 'escolha',
      ...(modo === 'ouvir' ? { audio: v.en, pergunta: 'O que você ouviu?' } : { enunciado: `O que significa “${v.en}”?` }),
      opcoes: [v.pt, outra.pt], resposta: 0 };
  };
  const blocos = [
    { tipo: 'explicacao', missao: def.id, titulo: repetir ? 'Vamos repetir com calma' : 'Só duas expressões por vez',
      texto: 'Leia a tradução, ouça e repita em voz alta. Pode ouvir de novo antes de responder. Não precisa decorar tudo de uma vez.',
      estrutura: vocab.map(v => v.en), exemplos: vocab.map(v => ({ en: v.en, pt: v.pt })),
      vocab: vocab.map(v => ({ ...v, ex: v.en })) },
    { tipo: 'exercicios', titulo: 'Reconheça o significado', exercicios: vocab.map((v, i) => escolha(v, i, 'ler')) },
    { tipo: 'escuta', titulo: 'Ouça as mesmas expressões', devagar: true, mostrarTextoDepois: true,
      exercicios: vocab.map((v, i) => escolha(v, i, 'ouvir')) },
    { tipo: 'exercicios', titulo: repetir ? 'Monte o que você já praticou' : 'Mais uma vez para fixar',
      exercicios: vocab.map((v, i) => repetir
        ? { ...base(v, i, 'montar'), tipo: 'ordenar', enunciado: `Monte em inglês: ${v.pt}`, palavras: v.en.split(/\s+/), resposta: v.en }
        : escolha(v, i, 'repetir')) },
  ];
  if (grupo > 0) {
    const anterior = def.vocab[grupo * 2 - 1];
    blocos.push({ tipo: 'retomada', titulo: 'Lembra da aula anterior?', exercicios: [{
      id: `base:${def.id}:${grupo * 2 - 1}:revisar`, missao: def.id, tipo: 'escolha', habilidade: 'vocabulario', dif: 1,
      enunciado: `O que significa “${anterior.en}”?`, opcoes: [anterior.pt, vocab[0].pt], resposta: 0,
      explica: `${anterior.en} = ${anterior.pt}.`,
    }] });
  }
  return { data: ctx.hojeISO, minutos: 8, inicianteGuiado: true,
    missao: { id: def.id, titulo: def.titulo, podeFazer: def.podeFazer, parte, total },
    porque: [repetir ? 'Hoje repetimos as expressões da aula anterior para ajudar a fixar.' : 'Vamos aprender só duas expressões e praticar cada uma três vezes.',
      'Depois de repetir o vocabulário, vamos montar frases e só então escrever.'],
    revisoesPendentes: ctx.cartoesPendentes || 0, blocos };
}

module.exports = { montarBaseIniciante };
