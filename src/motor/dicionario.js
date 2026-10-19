'use strict';
// Tradução por palavra nos exercícios: dicionário próprio, montado do que o app ensina (vocab das missões) mais
// as palavras comuns de palavras-comuns.js. Sem internet e sem IA. Palavra que não está aqui devolve null.
const { MISSOES } = require('../conteudo/missoes');
const { PALAVRAS_COMUNS } = require('../conteudo/palavras-comuns');

// minúsculas, aspas curvas viram retas, sem pontuação nas pontas ("Macaws," → "macaws")
const limpar = p => typeof p !== 'string' ? '' : p.toLowerCase().replace(/[’‘]/g, "'").replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '').replace(/\s+/g, ' ').trim();

const INDICE = new Map();
const guardar = (en, pt, exemplo) => { const k = limpar(en); if (k && pt && !INDICE.has(k)) INDICE.set(k, { pt, exemplo: exemplo || null }); };
for (const m of MISSOES) for (const v of m.vocab) guardar(v.en, v.pt, v.ex);        // o vocabulário vem primeiro: é o sentido do contexto
for (const c of PALAVRAS_COMUNS) guardar(c.en, c.pt, null);
// palavras de gramática nunca viram "forma base" de outra (thing → the, bed → be, shed → she)
const GRAMATICA = new Set(['a', 'an', 'the', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'his', 'its', 'our', 'this', 'that', 'who', 'what', 'where', 'when', 'why', 'how',
  'be', 'am', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'have', 'has', 'had', 'can', 'will', 'in', 'on', 'at', 'to', 'of', 'for', 'by', 'as', 'and', 'or', 'but', 'so', 'if', 'no']);

// formas reduzidas de uma palavra flexionada, da mais provável para a menos
function candidatas(p) {
  const c = [p];
  const sem = p.replace(/'s$/, '');
  if (sem !== p) c.push(sem);
  for (const base of new Set([p, sem])) {
    if (/ies$/.test(base)) c.push(base.slice(0, -3) + 'y');
    if (/(?:ches|shes|sses|xes|zes|oes)$/.test(base)) c.push(base.slice(0, -2));
    if (/s$/.test(base) && !/ss$/.test(base)) c.push(base.slice(0, -1));
    if (/ves$/.test(base)) c.push(base.slice(0, -3) + 'f', base.slice(0, -3) + 'fe');   // wolves, knives
    if (/ed$/.test(base)) c.push(base.slice(0, -1), base.slice(0, -2), base.slice(0, -3));      // lived, walked, stopped
    if (/ing$/.test(base)) c.push(base.slice(0, -3), base.slice(0, -3) + 'e', base.slice(0, -4));  // eating, living, running
  }
  return c;
}

// → { palavra: forma base encontrada, pt, exemplo } ou null
function traduzir(entrada) {
  const p = limpar(entrada);
  if (!p) return null;
  for (const forma of candidatas(p)) {
    if (forma !== p && (forma.length < 2 || GRAMATICA.has(forma))) continue;
    const achou = INDICE.get(forma);
    if (achou) return { palavra: forma, pt: achou.pt, exemplo: achou.exemplo };
  }
  return null;
}

module.exports = { traduzir, limpar };
