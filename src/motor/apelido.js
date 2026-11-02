'use strict';
// Filtro do apelido público (visto por amigos, inclusive crianças): sem contato externo,
// sem palavrões e sem tentativas simples de disfarce (acentos, números no lugar de letras).
const TROCAS = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };
const PALAVRAS = ['porra', 'caralho', 'puta', 'puto', 'merda', 'bosta', 'cu', 'cuzao', 'buceta', 'pau', 'piroca', 'foder', 'foda', 'fodase', 'viado', 'bicha', 'arrombado', 'otario', 'idiota', 'retardado', 'macaco', 'nazista', 'hitler', 'estupro', 'estuprador', 'pedofilo', 'suicida', 'fuck', 'shit', 'bitch', 'dick', 'cock', 'pussy', 'nigger', 'nigga', 'faggot', 'rape', 'rapist', 'porn', 'porno', 'sexo', 'nude', 'nudes'];
const RADICAIS = ['caralho', 'buceta', 'estupr', 'pedofil', 'nazist', 'hitler', 'fuck', 'nigg', 'faggot', 'porra', 'merda'];
const CONTATO = /(https?:|www\.|\.com|\.br\b|@|whats|zap\b|insta|telegram|discord|tiktok|snap|facebook|fb\.|\bt\.me)/i;

const limpar = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function apelidoPermitido(texto) {
  const bruto = String(texto ?? '').trim();
  if (bruto.length < 2 || bruto.length > 24) return { ok: false, motivo: 'Use de 2 a 24 caracteres.' };
  if (/[\u0000-\u001f<>]/.test(bruto)) return { ok: false, motivo: 'Há caracteres não permitidos no apelido.' };
  const base = limpar(bruto);
  if (CONTATO.test(base) || (base.match(/\d/g) || []).length >= 5) return { ok: false, motivo: 'Não coloque contato, link ou número de telefone no apelido.' };
  const destrocado = base.replace(/[01345 7@$!]/g, c => TROCAS[c] ?? ' ');
  const palavras = destrocado.split(/[^a-z]+/).filter(Boolean);
  const colado = destrocado.replace(/[^a-z]/g, '');
  const ruim = palavras.some(p => PALAVRAS.includes(p)) || RADICAIS.some(r => colado.includes(r));
  if (ruim) return { ok: false, motivo: 'Escolha um apelido gentil, que todos possam ver.' };
  return { ok: true, apelido: bruto.replace(/\s+/g, ' ') };
}
module.exports = { apelidoPermitido };
