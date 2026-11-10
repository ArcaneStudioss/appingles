'use strict';
const { PRIMEIRAS_FRASES } = require('../conteudo/primeiras-frases');

function montarOficina(def, rodada, missao, ctx) {
  const indice = Math.min(rodada - 1, 1);
  const modelos = PRIMEIRAS_FRASES[def.id]?.map(p => ({
    en: p.map(x => x[0]).join(' '), pt: p.map(x => x[1]).join(' ').replace(' (para idade)', '').replace(' (mais de um)', '').replace(/\bde Brasil\b/, 'do Brasil'),
    pedacos: p.map(([en, pt]) => ({ en, pt })),
  })) || def.exemplos.slice().sort((a, b) => a.en.split(/\s+/).length - b.en.split(/\s+/).length).slice(0, 2);
  const modelo = modelos[indice];
  const outro = modelos[1 - indice] || modelos[0];
  const ensino = { ...modelo, nota: def.guia?.nota || def.explicacao.texto };
  // Quem vem acertando tudo vê o modelo só no primeiro exercício; nos outros, a dica continua a um toque.
  const recentes = (ctx.tentativas || []).filter(t => t.origem === 'licao').slice(-6);
  const embalado = recentes.length >= 6 && recentes.every(t => t.correto);
  const criar = (n, extra, comApoio = true) => ({
    id: `oficina:${def.id}:${indice}:aprender:${n}`,
    missao: def.id, habilidade: 'vocabulario', dif: 1, guiado: true,
    explica: `${modelo.en} = ${modelo.pt}`, ...(comApoio && !(embalado && n > 1) ? { ensino } : {}), ...extra,
  });
  const palavras = modelo.en.split(/\s+/);
  // Lacuna: some a última palavra "de conteúdo" da frase; o banco traz a certa e duas palavras da outra frase da missão.
  const limpa = w => w.replace(/[^\p{L}'’-]/gu, '');
  const alvoIdx = palavras.map((w, i) => [limpa(w), i]).filter(([w]) => w.length > 1).pop()?.[1] ?? palavras.length - 1;
  const alvoPalavra = limpa(palavras[alvoIdx]);
  const fraseLacuna = palavras.map((w, i) => (i === alvoIdx ? w.replace(alvoPalavra, '___') : w)).join(' ');
  const distratores = [...new Set((outro?.en || '').split(/\s+/).map(limpa).filter(w => w.length > 1 && w.toLowerCase() !== alvoPalavra.toLowerCase()))].slice(0, 2);
  const exercicios = [
    criar(1, { tipo: 'escolha', enunciado: 'Veja o exemplo. Qual é o significado da frase?', opcoes: [modelo.pt, outro.pt], resposta: 0 }),
    criar(2, { tipo: 'ordenar', enunciado: 'Use o modelo para juntar os pedaços da frase.', palavras: modelo.pedacos?.map(p => p.en) || palavras, resposta: modelo.en }),
    // na escuta o modelo escrito entregaria a resposta: aqui o treino é o ouvido
    criar(3, { tipo: 'escuta', audio: modelo.en, pergunta: 'Ouça a frase que acabou de aprender. O que ela significa?', opcoes: [modelo.pt, outro.pt], resposta: 0 }, false),
    ...(distratores.length ? [criar(4, { tipo: 'lacuna', frase: fraseLacuna, resposta: [alvoPalavra], bancoPalavras: [alvoPalavra, ...distratores], pt: modelo.pt, enunciado: `Complete: ${modelo.pt}`, explica: `A frase completa é ${modelo.en}` }, false)] : []),
    criar(5, { tipo: 'ordenar', enunciado: `Sem o modelo desta vez: monte “${modelo.pt}”.`, palavras, resposta: modelo.en }, false),
  ];
  // Na segunda oficina, a frase da aula anterior volta de memória (repetição espaçada em vez de repetir a aula inteira).
  if (rodada > 1 && modelos[0] && modelos[0] !== modelo) {
    const antes = modelos[0];
    exercicios.push({ id: `oficina:${def.id}:0:rever:6`, missao: def.id, habilidade: 'vocabulario', dif: 1, guiado: true, explica: `${antes.en} = ${antes.pt}`,
      tipo: 'ordenar', enunciado: `Lembra da frase da aula anterior? Monte “${antes.pt}”.`, palavras: antes.en.split(/\s+/), resposta: antes.en });
  }
  return {
    data: ctx.hojeISO, guiada: true, inicianteGuiado: true, oficina: true, minutos: 5, missao, ...(embalado ? { embalado: true } : {}),
    revisoesPendentes: ctx.cartoesPendentes || 0,
    porque: [indice ? 'Uma frase nova e, no fim, a da aula anterior de memória.' : 'Hoje vamos aprender uma frase, entender cada pedaço e praticar antes de escrever sozinho.'],
    blocos: [
      { tipo: 'explicacao', guiada: true, titulo: indice ? 'Mais uma frase para montar' : 'Vamos aprender a montar uma frase', texto: 'Veja o significado, ouça e siga o modelo. Você pode consultar a explicação durante os primeiros exercícios.', estrutura: [modelo.en], exemplos: [modelo], vocab: (modelo.pedacos || [modelo]).map(p => ({ ...p, ex: p.en })), missao: def.id },
      { tipo: 'exercicios', titulo: 'Aprenda fazendo, com apoio', devagar: true, exercicios },
    ],
  };
}
module.exports = { montarOficina };
