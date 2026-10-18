'use strict';
// Material do aluno (descrição de vaga, texto da faculdade, artigo...) sem IA:
// extrai vocabulário provável, monta exercícios de lacuna com frases do próprio texto e perguntas de simulação.
const { embaralhar } = require('./util');

// palavras muito frequentes que não valem cartão
const COMUNS = new Set(('the a an and or but if of to in on at for with from by as is are was were be been being have has had do does did will would can could should may might must ' +
  'i you he she it we they me him her us them my your his its our their this that these those there here what which who whom whose when where why how all any both each few more most other some such no not only own same so than too very ' +
  'just also about into over after before again further then once up down out off under above between through during without within along across around against among ' +
  'new good great work working job team company people time year years day days make made get got use used using need needs want like well one two three first last next ' +
  'strong ability able help including include includes based years experience role position candidate candidates looking join us our you will we are must have plus').split(/\s+/));

function frases(texto) {
  return String(texto).replace(/\s+/g, ' ').split(/(?<=[.!?;•])\s+|\s+[•·▪-]\s+/).map(s => s.trim()).filter(s => s.split(' ').length >= 5 && s.length <= 260);
}

function processarOffline(titulo, texto, { nivel = 'A2' } = {}) {
  const limpo = String(texto).slice(0, 8000);
  const contagem = {};
  for (const w of limpo.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []) {
    if (COMUNS.has(w)) continue;
    contagem[w] = (contagem[w] || 0) + 1;
  }
  // frequência no texto + tamanho (palavras mais longas tendem a ser mais específicas)
  const candidatas = Object.entries(contagem).map(([w, n]) => [w, n * 2 + Math.min(4, w.length / 3)]).sort((a, b) => b[1] - a[1]).map(([w]) => w);
  const fs = frases(limpo);
  const vocab = [];
  for (const w of candidatas) {
    const ex = fs.find(f => new RegExp(`\\b${w}\\b`, 'i').test(f));
    if (!ex) continue;
    vocab.push({ en: w, pt: null, ex });
    if (vocab.length >= (nivel === 'A1' || nivel === 'A2' ? 8 : 12)) break;
  }
  const exercicios = vocab.slice(0, 6).map((v, i) => ({
    id: `mat:${i}`, tipo: 'lacuna', habilidade: 'vocabulario', dif: 2,
    frase: v.ex.replace(new RegExp(`\\b${v.en}\\b`, 'i'), '___'), resposta: [v.en],
    dica: `${v.en.length} letras, começa com "${v.en[0]}"`,
  }));
  const pareceVaga = /\b(requirements?|responsibilities|qualifications|we are looking for|you will|apply|candidate|role)\b/i.test(limpo);
  const simulacao = pareceVaga
    ? ['Tell me about your experience with ' + (vocab[0]?.en || 'this area') + '.', 'Why are you interested in this role?', 'Which of these responsibilities have you done before?', 'Tell me about a challenge related to ' + (vocab[1]?.en || 'your work') + '.']
    : ['Can you summarize this text in two or three sentences?', 'What is the main idea?', 'Do you agree with the author? Why?', 'How does this connect to your life or work?'];
  return {
    titulo, tipo: pareceVaga ? 'vaga' : 'texto', vocab, exercicios,
    audio: fs.slice(0, 3),
    simulacao,
    resumo: null,
    modo: 'regras',
    aviso: 'Sem o tutor de IA, a tradução das palavras e o resumo não são gerados. As palavras foram escolhidas pela frequência no texto.',
  };
}

module.exports = { processarOffline, frases, embaralhar };
