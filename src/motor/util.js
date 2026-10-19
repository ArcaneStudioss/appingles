'use strict';
const crypto = require('node:crypto');

const CONTRACOES = [
  // contração digitada sem apóstrofo (comum no celular); só formas que não são outra palavra
  [/\bim\b/g, 'i am'], [/\bive\b/g, 'i have'], [/\b(dont|doesnt|didnt|isnt|arent|wasnt|werent|havent|hasnt|couldnt|wouldnt|shouldnt)\b/g, m => m.slice(0, -2) + ' not'],
  [/\bcant\b/g, 'cannot'], [/\bwont\b/g, 'will not'], [/\b(you|they)re\b/g, '$1 are'], [/\bthats\b/g, 'that is'],
  [/\bcan't\b/g, 'cannot'], [/\bwon't\b/g, 'will not'], [/\bshan't\b/g, 'shall not'],
  [/\b(\w+)n't\b/g, '$1 not'], [/\bi'm\b/g, 'i am'], [/\b(\w+)'re\b/g, '$1 are'],
  [/\b(\w+)'ve\b/g, '$1 have'], [/\b(\w+)'ll\b/g, '$1 will'], [/\b(\w+)'d\b/g, '$1 would'],
  [/\b(it|that|there|what|he|she|who|where|here|how)'s\b/g, '$1 is'],
];

// Normaliza para comparar respostas: minúsculas, aspas retas, contrações expandidas, sem pontuação.
function normalizar(s) {
  let t = String(s ?? '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"').normalize('NFC');
  for (const [re, sub] of CONTRACOES) t = t.replace(re, sub);
  return t.replace(/[^a-z0-9à-ú' ]+/gi, ' ').replace(/\s+/g, ' ').trim();
}

function distancia(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  let ant = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const at = [i];
    for (let j = 1; j <= n; j++) at[j] = Math.min(ant[j] + 1, at[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    ant = at;
  }
  return ant[n];
}

// Compara com a lista de respostas aceitas. Tolera 1 letra trocada (2 em frases longas) como "erro de digitação".
function comparar(resposta, aceitas) {
  const r = normalizar(resposta);
  if (!r) return { correto: false, quase: false };
  let melhor = 99;
  for (const a of aceitas) {
    const n = normalizar(a);
    if (n === r) return { correto: true, quase: false };
    melhor = Math.min(melhor, distancia(n, r));
  }
  const limite = r.length > 24 ? 2 : r.length > 6 ? 1 : 0;
  if (melhor <= limite) return { correto: true, quase: true };
  return { correto: false, quase: false };
}

// ---- fala: o reconhecimento de voz erra palavras parecidas, some com artigos e troca homófonos. Medimos a cobertura da frase,
// palavra por palavra (com tolerância de letras e homófonos), em vez de exigir o texto igual. Sotaque não é erro.
const HOMOFONOS = [['to', 'too', 'two'], ['for', 'four', 'fore'], ['there', 'their', 'theyre'], ['no', 'know'], ['write', 'right'], ['by', 'buy', 'bye'], ['one', 'won'], ['hear', 'here'], ['see', 'sea'], ['be', 'bee'], ['are', 'r'], ['you', 'u'], ['our', 'hour'], ['whether', 'weather'], ['wear', 'where', 'ware'], ['its', 'it is'], ['your', 'youre']];
const GRUPO = new Map(); HOMOFONOS.forEach((g, i) => g.forEach(w => GRUPO.set(w, i)));
const FUNCAO = new Set(['a', 'an', 'the', 'to', 'of', 'and', 'is', 'am', 'are', 'in', 'on', 'at', 'it', 'i', 'my', 'do', 'does']);
function mesmaPalavra(a, b) {
  if (a === b) return true;
  if (GRUPO.has(a) && GRUPO.get(a) === GRUPO.get(b)) return true;
  if (a.replace(/s$/, '') === b.replace(/s$/, '') && Math.min(a.length, b.length) >= 3) return true;   // plural/3ª pessoa que o microfone não pegou
  const lim = Math.max(a.length, b.length) >= 8 ? 2 : Math.max(a.length, b.length) >= 4 ? 1 : 0;
  return lim > 0 && distancia(a, b) <= lim;
}
// quanto da frase esperada foi dita (0 a 1); palavras de função (the, a, to...) valem metade
function coberturaFala(dito, frase) {
  const alvo = normalizar(frase).split(' ').filter(Boolean);
  const falado = normalizar(dito).split(' ').filter(Boolean);
  if (!alvo.length || !falado.length) return 0;
  const usado = new Array(falado.length).fill(false);
  let ganho = 0, total = 0;
  for (const p of alvo) {
    const peso = FUNCAO.has(p) ? 0.5 : 1;
    total += peso;
    let k = falado.findIndex((f, i) => !usado[i] && f === p);
    if (k < 0) k = falado.findIndex((f, i) => !usado[i] && mesmaPalavra(f, p));
    if (k >= 0) { usado[k] = true; ganho += peso; }
  }
  return ganho / total;
}
function compararFala(dito, frase) {
  const c = coberturaFala(dito, frase);
  return { correto: c >= 0.8, quase: c >= 0.8 && c < 1, cobertura: c };
}

function palavras(texto) { return (String(texto || '').match(/[A-Za-zÀ-ú']+/g) || []).length; }

// Data local do Brasil (YYYY-MM-DD), para "lição de hoje" não virar à meia-noite UTC.
function hoje(fuso = 'America/Sao_Paulo', d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
function somarDias(dataISO, dias) {
  const d = new Date(dataISO + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
function diasEntre(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5); }

// Embaralha de forma determinística (mesma ordem para o mesmo aluno e item: recarregar não muda as opções).
function embaralhar(lista, semente) {
  const out = lista.slice();
  let h = crypto.createHash('sha256').update(String(semente)).digest();
  for (let i = out.length - 1; i > 0; i--) {
    if (i % 30 === 0) h = crypto.createHash('sha256').update(h).digest();
    const j = h[i % 32] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

module.exports = { normalizar, comparar, coberturaFala, compararFala, distancia, palavras, hoje, somarDias, diasEntre, embaralhar, clamp };
