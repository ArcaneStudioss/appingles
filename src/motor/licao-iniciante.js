'use strict';
const { POR_ID, MISSOES } = require('../conteudo/missoes');
const { licoesPorMissao } = require('./plano');
const { montarOficina } = require('./oficina-frases');

// Antes de exigir frases livres, apresentar só duas expressões e revisitá-las
// na aula seguinte. IDs estáveis entre aulas preservam o histórico de prática.
function montarBaseIniciante(ctx, atual, adaptada) {
  if (ctx.nivel !== 'A1' || !atual) return null;
  const def = adaptada || POR_ID[atual.id];
  const total = licoesPorMissao(def, ctx.nivel);
  const parte = Math.min(total, (ctx.competencias?.[def.id]?.partes || 0) + 1);
  if (parte > total - 3) return null;
  const aulasVocab = Math.ceil(def.vocab.length / 2);
  if (parte > aulasVocab) return montarOficina(def, parte - aulasVocab, { id: def.id, titulo: def.titulo, podeFazer: def.podeFazer, parte, total }, ctx);
  const grupo = parte - 1;
  const vocab = def.vocab.slice(grupo * 2, grupo * 2 + 2);
  const base = (v, i, modo) => ({
    id: `base:${def.id}:${grupo * 2 + i}:${modo}`, missao: def.id,
    habilidade: modo === 'ouvir' ? 'escuta' : 'vocabulario', dif: 1,
    ...(modo === 'ler' || modo === 'ouvir' || modo === 'montar' ? { ensino: { en: v.en, pt: v.pt, nota: 'Olhe o significado e use o modelo. Esta é uma atividade para aprender.' } } : {}),
    explica: `${v.en} = ${v.pt}. Ouça e repita quantas vezes precisar.`,
  });
  const cap = t => (t ? t[0].toUpperCase() + t.slice(1) : t);
  // Distratores: outras expressões da missão e, depois, de missões anteriores da trilha do zero.
  const zeros = MISSOES.filter(m => m.id.startsWith('zero-'));
  const anteriores = zeros.slice(0, Math.max(0, zeros.findIndex(m => m.id === def.id))).flatMap(m => m.vocab);
  // Só entram como distratores expressões que o aluno já viu: as desta missão até esta aula e as das missões anteriores.
  const pool = [...def.vocab.slice(0, grupo * 2 + 2), ...anteriores.reverse()];
  const distratores = (v, n = 2) => {
    const vistos = new Set([v.pt.toLowerCase(), v.en.toLowerCase()]);
    const out = [];
    const ini = Math.max(0, pool.findIndex(x => x.en === v.en) + 1);
    for (const x of [...pool.slice(ini), ...pool.slice(0, ini)]) {
      if (vistos.has(x.pt.toLowerCase()) || vistos.has(x.en.toLowerCase())) continue;
      vistos.add(x.pt.toLowerCase()); vistos.add(x.en.toLowerCase());
      out.push(x);
      if (out.length >= n) break;
    }
    return out;
  };
  const escolha = (v, i, modo) => {
    const outros = distratores(v);
    return { ...base(v, i, modo), tipo: modo === 'ouvir' ? 'escuta' : 'escolha',
      ...(modo === 'ouvir' ? { audio: v.en, pergunta: 'O que você ouviu?' } : { enunciado: `O que significa “${v.en}”?` }),
      opcoes: [cap(v.pt), ...outros.map(x => cap(x.pt))], resposta: 0 };
  };
  const inverso = (v, i) => {
    const outros = distratores(v);
    return { ...base(v, i, 'inverso'), tipo: 'escolha', enunciado: `Como se diz “${cap(v.pt)}” em inglês?`,
      opcoes: [v.en, ...outros.map(x => x.en)], resposta: 0 };
  };
  const blocos = [
    { tipo: 'explicacao', guiada: true, missao: def.id, titulo: 'Só duas expressões por vez',
      texto: 'Leia a tradução, ouça e repita em voz alta. Pode ouvir de novo antes de responder. Não precisa decorar tudo de uma vez.',
      estrutura: vocab.map(v => v.en), exemplos: vocab.map(v => ({ en: v.en, pt: v.pt })),
      vocab: vocab.map(v => ({ ...v, ex: v.en })) },
    { tipo: 'exercicios', titulo: 'Reconheça o significado', exercicios: vocab.map((v, i) => escolha(v, i, 'ler')) },
    { tipo: 'escuta', titulo: 'Ouça as mesmas expressões', devagar: true, mostrarTextoDepois: true,
      exercicios: vocab.map((v, i) => escolha(v, i, 'ouvir')) },
    { tipo: 'exercicios', titulo: 'Agora no sentido contrário',
      exercicios: vocab.map((v, i) => /\s/.test(v.en)
        ? { ...base(v, i, 'montar'), tipo: 'ordenar', enunciado: `Monte em inglês: ${cap(v.pt)}`, palavras: v.en.split(/\s+/), resposta: v.en }
        : inverso(v, i)) },
  ];
  if (grupo > 0) {
    const anterior = def.vocab[grupo * 2 - 1];
    blocos.push({ tipo: 'retomada', titulo: 'Lembra da aula anterior?', exercicios: [{
      id: `base:${def.id}:${grupo * 2 - 1}:revisar`, missao: def.id, tipo: 'escolha', habilidade: 'vocabulario', dif: 1,
      enunciado: `O que significa “${anterior.en}”?`, opcoes: [cap(anterior.pt), ...distratores(anterior).map(x => cap(x.pt))], resposta: 0,
      explica: `${anterior.en} = ${anterior.pt}.`,
    }] });
  }
  return { data: ctx.hojeISO, minutos: 5, guiada: true, inicianteGuiado: true,
    missao: { id: def.id, titulo: def.titulo, podeFazer: def.podeFazer, parte, total },
    porque: ['Vamos aprender só duas expressões e praticar cada uma três vezes.',
      'Depois de repetir o vocabulário, vamos montar frases e só então escrever.'],
    revisoesPendentes: ctx.cartoesPendentes || 0, blocos };
}

module.exports = { montarBaseIniciante };
