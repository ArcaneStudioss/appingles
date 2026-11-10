'use strict';
const { POR_ID, MISSOES } = require('../conteudo/missoes');
const { licoesPorMissao } = require('./plano');
const { montarOficina } = require('./oficina-frases');

// Antes de exigir frases livres, apresentar até três expressões por aula e revisitá-las
// na aula seguinte. IDs estáveis entre aulas preservam o histórico de prática.
// O vocabulário é dividido em grupos de tamanho parecido (6 = 3+3, 4 = 2+2, 5 = 3+2), sem aula com uma palavra só.
const POR_AULA = 3;
const gruposDe = n => { const k = Math.max(1, Math.ceil(n / POR_AULA)); return Array.from({ length: k }, (_, i) => [Math.round(i * n / k), Math.round((i + 1) * n / k)]); };
function montarBaseIniciante(ctx, atual, adaptada) {
  if (ctx.nivel !== 'A1' || !atual) return null;
  const def = adaptada || POR_ID[atual.id];
  const total = licoesPorMissao(def, ctx.nivel);
  const parte = Math.min(total, (ctx.competencias?.[def.id]?.partes || 0) + 1);
  if (parte > total - 2) return null;
  const grupos = gruposDe(def.vocab.length), aulasVocab = grupos.length;
  if (parte > aulasVocab) return montarOficina(def, parte - aulasVocab, { id: def.id, titulo: def.titulo, podeFazer: def.podeFazer, parte, total }, ctx);
  const grupo = parte - 1, [ini, fim] = grupos[grupo];
  const vocab = def.vocab.slice(ini, fim);
  // Ritmo: quem acertou as seis últimas atividades de aula segue sem o modelo na tela (a dica continua a um toque).
  // Assim a aula não fica parada para quem aprende rápido, e o acerto passa a contar como acerto sem ajuda.
  const recentes = (ctx.tentativas || []).filter(t => t.origem === 'licao').slice(-6);
  const embalado = recentes.length >= 6 && recentes.every(t => t.correto);
  // O modelo escrito aparece só no primeiro contato (ler) e ao montar. Na escuta ele entregaria a resposta: ali o treino é o ouvido.
  // Na leitura, só a primeira expressão da aula vem com o modelo: as outras acabaram de aparecer nos cartões,
  // e lembrar sem copiar (prática de recuperação) fixa mais do que responder olhando a resposta.
  const comModelo = (modo, i) => !embalado && ((modo === 'ler' && i === 0) || modo === 'montar');
  const base = (v, i, modo) => ({
    id: `base:${def.id}:${ini + i}:${modo}`, missao: def.id,
    habilidade: modo === 'ouvir' ? 'escuta' : 'vocabulario', dif: 1,
    ...(comModelo(modo, i) ? { ensino: { en: v.en, pt: v.pt, nota: 'Olhe o significado e use o modelo. Esta é uma atividade para aprender.' } } : {}),
    explica: `${v.en} = ${v.pt}. Ouça e repita quantas vezes precisar.`,
  });
  const cap = t => (t ? t[0].toUpperCase() + t.slice(1) : t);
  // Distratores: outras expressões da missão e, depois, de missões anteriores da trilha do zero.
  const zeros = MISSOES.filter(m => m.id.startsWith('zero-'));
  const anteriores = zeros.slice(0, Math.max(0, zeros.findIndex(m => m.id === def.id))).flatMap(m => m.vocab);
  // Só entram como distratores expressões que o aluno já viu: as desta missão até esta aula e as das missões anteriores.
  const pool = [...def.vocab.slice(0, fim), ...anteriores.reverse()];
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
    { tipo: 'explicacao', guiada: true, missao: def.id, titulo: vocab.length === 3 ? 'Três expressões de cada vez' : 'Duas expressões de cada vez',
      texto: 'Leia a tradução, ouça e repita em voz alta. Pode ouvir de novo antes de responder. Não precisa decorar tudo de uma vez.',
      estrutura: vocab.map(v => v.en), exemplos: vocab.map(v => ({ en: v.en, pt: v.pt })),
      vocab: vocab.map(v => ({ ...v, ex: v.en })) },
    { tipo: 'exercicios', titulo: 'Reconheça o significado', exercicios: vocab.map((v, i) => escolha(v, i, 'ler')) },
    // Com três expressões, cada uma tem duas ou três práticas e a aula fica em até 7 atividades (o teto das aulas com áudio):
    // a escuta pula a primeira (já ouvida no cartão) e, quando há retomada, fica só na do meio; o sentido contrário pula a do meio.
    { tipo: 'escuta', titulo: 'Agora só ouvindo', devagar: true, mostrarTextoDepois: true,
      exercicios: vocab.map((v, i) => [v, i]).filter(([, i]) => vocab.length < 3 || (grupo > 0 ? i === 1 : i > 0)).map(([v, i]) => escolha(v, i, 'ouvir')) },
    // Na primeira aula de cada missão, só alternativas (montar frase entra a partir da segunda).
    { tipo: 'exercicios', titulo: 'Agora no sentido contrário',
      exercicios: vocab.map((v, i) => [v, i]).filter(([, i]) => vocab.length < 3 || i !== 1).map(([v, i]) => /\s/.test(v.en) && grupo > 0
        ? { ...base(v, i, 'montar'), tipo: 'ordenar', enunciado: `Monte em inglês: ${cap(v.pt)}`, palavras: v.en.split(/\s+/), resposta: v.en }
        : inverso(v, i)) },
  ];
  if (grupo > 0) {
    const anterior = def.vocab[ini - 1];
    blocos.push({ tipo: 'retomada', titulo: 'Lembra da aula anterior?', exercicios: [{
      id: `base:${def.id}:${ini - 1}:revisar`, missao: def.id, tipo: 'escolha', habilidade: 'vocabulario', dif: 1,
      enunciado: `O que significa “${anterior.en}”?`, opcoes: [cap(anterior.pt), ...distratores(anterior).map(x => cap(x.pt))], resposta: 0,
      explica: `${anterior.en} = ${anterior.pt}.`,
    }] });
  }
  // Fala opcional no fim da aula: não é exercício (não conta para concluir nem vale nota).
  const f = vocab[vocab.length - 1];
  blocos.push({ tipo: 'fala-opcional', titulo: 'Experimente falar', frase: f.en, pt: f.pt });
  return { data: ctx.hojeISO, minutos: 5, guiada: true, inicianteGuiado: true, ...(embalado ? { embalado: true } : {}),
    missao: { id: def.id, titulo: def.titulo, podeFazer: def.podeFazer, parte, total },
    porque: [embalado ? 'Você acertou tudo nas últimas atividades: hoje o modelo sai da tela. A dica continua a um toque.' : `Vamos aprender ${vocab.length === 3 ? 'três' : 'duas'} expressões: primeiro reconhecer, depois ouvir e por fim dizer em inglês.`,
      'Depois de repetir o vocabulário, vamos montar frases e só então escrever.'],
    revisoesPendentes: ctx.cartoesPendentes || 0, blocos };
}

module.exports = { montarBaseIniciante };
