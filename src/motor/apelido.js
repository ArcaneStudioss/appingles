'use strict';
// Filtro do apelido público (visto por amigos, inclusive crianças): sem contato externo,
// sem palavrões e sem tentativas simples de disfarce (acentos, números no lugar de letras).
const TROCAS = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };
const PALAVRAS = ['porra', 'caralho', 'puta', 'puto', 'merda', 'bosta', 'cu', 'cuzao', 'buceta', 'pau', 'piroca', 'foder', 'foda', 'fodase', 'viado', 'bicha', 'arrombado', 'otario', 'idiota', 'retardado', 'macaco', 'nazista', 'hitler', 'estupro', 'estuprador', 'pedofilo', 'suicida', 'fuck', 'shit', 'bitch', 'dick', 'cock', 'pussy', 'nigger', 'nigga', 'faggot', 'rape', 'rapist', 'porn', 'porno', 'sexo', 'nude', 'nudes'];
// Ambíguas: também são nomes e sobrenomes reais (Cu Lin, Pau Gasol). Só barram se forem o apelido inteiro.
const AMBIGUAS = ['cu', 'pau'];
const RADICAIS = ['caralho', 'buceta', 'estupr', 'pedofil', 'nazist', 'hitler', 'fuck', 'nigg', 'faggot', 'porra', 'merda'];
const CONTATO = /(https?:|www\.|\.com|\.br\b|@|whats|zap\b|insta|telegram|discord|tiktok|snap|facebook|fb\.|\bt\.me)/i;

// Sem \p{M}: o NFKC já funde letra e acento; sobra sinal combinante só em empilhamentos (zalgo) ou tentativas de disfarce.
const PERMITIDO = /^[\p{Script=Latin}\p{Nd} _.'-]+$/u;
const COMBINANTE = /\p{M}/u;
const limpar = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function apelidoPermitido(texto) {
  // NFKC primeiro: dígitos de largura total, ligaduras e formas compatíveis viram o caractere comum antes de qualquer checagem.
  const bruto = String(texto ?? '').normalize('NFKC').trim();
  if (bruto.length < 2 || bruto.length > 24) return { ok: false, motivo: 'Use de 2 a 24 caracteres.' };
  // Só letras latinas (com acento), números e poucos sinais: bloqueia invisíveis, bidi, emojis e letras de outros alfabetos que imitam o a, e, o.
  if (COMBINANTE.test(bruto) || !PERMITIDO.test(bruto)) return { ok: false, motivo: 'Use apenas letras do alfabeto latino, números, espaço, ponto, hífen ou apóstrofo.' };
  const base = limpar(bruto);
  if (CONTATO.test(base) || (base.match(/\p{Nd}/gu) || []).length >= 5) return { ok: false, motivo: 'Não coloque contato, link ou número de telefone no apelido.' };
  const destrocado = base.replace(/[01345 7@$!]/g, c => TROCAS[c] ?? ' ');
  const palavras = destrocado.split(/[^a-z]+/).filter(Boolean);
  const colado = destrocado.replace(/[^a-z]/g, '');
  // Palavra solta; palavras longas (6+ letras) também por trecho e sem separadores ("c.a.r.a.l.h.o"); curtas só se forem o apelido inteiro ("c.u"), para não barrar "Computador".
  const ruim = palavras.some(p => PALAVRAS.includes(p) && !AMBIGUAS.includes(p)) || PALAVRAS.includes(colado)
    || RADICAIS.some(r => colado.includes(r)) || PALAVRAS.some(p => p.length >= 6 && colado.includes(p));
  if (ruim) return { ok: false, motivo: 'Escolha um apelido gentil, que todos possam ver.' };
  return { ok: true, apelido: bruto.replace(/\s+/g, ' ') };
}
module.exports = { apelidoPermitido };
