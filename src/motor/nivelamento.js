'use strict';
// Corrige o nivelamento e devolve um diagnóstico simples, com a incerteza explícita.
const { ITENS, NIVEIS, ABERTAS } = require('../conteudo/nivelamento');
const { normalizar, palavras, coberturaFala } = require('./util');
const { detectar, POR_TAG } = require('../conteudo/dificuldades');

const NOMES = { gramatica: 'Gramática', vocabulario: 'Vocabulário', leitura: 'Leitura', escuta: 'Compreensão auditiva', escrita: 'Escrita', fala: 'Fala' };

// Nível de uma habilidade = maior nível em que acertou pelo menos metade, desde que não tenha "furado" o anterior.
function nivelDaHabilidade(itens, respostas) {
  let nivel = null, acertos = 0, total = 0;
  for (const nv of NIVEIS) {
    const doNivel = itens.filter(i => i.nivel === nv);
    if (!doNivel.length) continue;
    const ok = doNivel.filter(i => respostas[i.id]?.correto).length;
    acertos += ok; total += doNivel.length;
    if (ok / doNivel.length >= 0.5) nivel = nv; else break;
  }
  return { nivel: nivel || 'A1', comecando: !nivel, acertos, total };
}

function avaliarEscrita(texto) {
  const n = palavras(texto);
  if (n < 5) return null;
  const achados = detectar(texto).filter(a => a.confianca !== 'baixa');
  const frases = String(texto).split(/[.!?]+/).filter(f => palavras(f) >= 3);
  const media = frases.length ? n / frases.length : n;
  const conectivos = (texto.match(/\b(because|but|so|although|however|and then|when|while|since|which|that)\b/gi) || []).length;
  // heurística grosseira (sem IA): tamanho, frases completas, conectivos e erros típicos
  let pontos = 0;
  if (n >= 15) pontos++; if (n >= 35) pontos++;
  if (media >= 8) pontos++; if (conectivos >= 2) pontos++;
  if (achados.length === 0) pontos++;
  const nivel = ['A1', 'A1', 'A2', 'A2', 'B1', 'B1'][pontos];
  return { nivel, palavras: n, achados, modo: 'regras' };
}

function avaliarFala(transcricao, alvo = ABERTAS.fala.alvo) {
  if (!transcricao) return null;
  const pct = coberturaFala(transcricao, alvo);   // tolera palavras parecidas, homófonos e artigos que o microfone não pegou
  return { reconhecido: Math.round(pct * 100), nivel: pct >= 0.9 ? 'B1' : pct >= 0.7 ? 'A2' : 'A1' };
}

function corrigir(entrada) {
  const banco = entrada.itens || ITENS;
  // entrada.respostas: { [itemId]: { resposta: texto, tempoMs } }
  const respostas = {};
  for (const item of banco) {
    const r = entrada.respostas?.[item.id];
    if (!r) continue;
    respostas[item.id] = { correto: normalizar(r.resposta) === normalizar(item.opcoes[item.resposta]), tempoMs: r.tempoMs | 0, naoSei: !!r.naoSei };
  }
  const porHabilidade = {};
  for (const h of ['gramatica', 'vocabulario', 'leitura', 'escuta']) {
    const itens = banco.filter(i => i.habilidade === h);
    const respondidos = itens.filter(i => respostas[i.id]);
    if (!respondidos.length) continue;
    porHabilidade[h] = { ...nivelDaHabilidade(itens, respostas), nome: NOMES[h] };
  }
  const escrita = avaliarEscrita(entrada.escrita);
  if (escrita) porHabilidade.escrita = { nivel: escrita.nivel, nome: NOMES.escrita, estimativaFraca: true, detalhe: escrita };
  const fala = avaliarFala(entrada.fala, entrada.alvoFala);
  if (fala) porHabilidade.fala = { nivel: fala.nivel, nome: NOMES.fala, estimativaFraca: true, detalhe: fala };

  // Nível geral: mediana das habilidades fechadas (mais confiáveis); aberta só ajusta se houver
  const idx = Object.entries(porHabilidade).filter(([, v]) => !v.estimativaFraca).map(([, v]) => NIVEIS.indexOf(v.nivel)).sort((a, b) => a - b);
  const mediana = idx.length ? idx[Math.floor((idx.length - 1) / 2)] : 0;
  const nivel = NIVEIS[mediana];

  const ordenadas = Object.entries(porHabilidade).sort((a, b) => NIVEIS.indexOf(b[1].nivel) - NIVEIS.indexOf(a[1].nivel));
  const fortes = ordenadas.filter(([, v]) => NIVEIS.indexOf(v.nivel) > mediana).map(([k]) => k);
  const atencao = ordenadas.filter(([, v]) => NIVEIS.indexOf(v.nivel) < mediana).map(([k]) => k);

  // Pistas de dificuldades (hipóteses iniciais): tags dos itens errados + erros vistos na escrita
  const tagsErradas = {};
  for (const item of banco) if (item.tag && respostas[item.id] && !respostas[item.id].correto) tagsErradas[item.tag] = (tagsErradas[item.tag] || 0) + 1;
  for (const a of escrita?.achados || []) tagsErradas[a.tag] = (tagsErradas[a.tag] || 0) + 1;
  const pistas = Object.keys(tagsErradas).filter(t => POR_TAG[t]).map(t => ({ tag: t, nome: POR_TAG[t].nome }));

  const total = Object.keys(respostas).length;
  const confianca = total >= 12 ? 'media' : 'baixa';
  const audioVsTexto = porHabilidade.escuta && porHabilidade.leitura ? NIVEIS.indexOf(porHabilidade.leitura.nivel) - NIVEIS.indexOf(porHabilidade.escuta.nivel) : 0;

  const resumo = [];
  if (fortes.length) resumo.push(`Seu ponto mais forte agora: ${fortes.map(f => NOMES[f].toLowerCase()).join(' e ')}.`);
  if (atencao.length) resumo.push(`Vale dar atenção a: ${atencao.map(f => NOMES[f].toLowerCase()).join(' e ')}.`);
  if (audioVsTexto >= 1) resumo.push('Você entende melhor lendo do que ouvindo. É muito comum, e treino de escuta costuma dar resultado rápido.');
  if (!fortes.length && !atencao.length) resumo.push('Suas habilidades estão equilibradas neste nível.');

  return {
    nivel, porHabilidade, fortes, atencao, pistas, resumo, confianca, totalRespondido: total,
    aviso: 'Esta é uma estimativa feita com poucas perguntas, não um certificado. Ela vai sendo ajustada pelas suas próximas atividades.',
  };
}

module.exports = { corrigir, NOMES };
