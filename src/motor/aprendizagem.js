'use strict';
// Perfil de aprendizagem e treino focado nas dificuldades de cada aluno.
// Princípio: NÃO rotular a pessoa ("visual", "auditivo"). Medir, por modo (ler, escrever, ouvir), o que ela realmente acerta,
// quão rápido e com quanta dica, e treinar o que está mais fraco. A preferência que a pessoa declara pesa pouco no treino
// (gostar ajuda a continuar), mas quem decide o que treinar é o desempenho. Tudo é calculado das tentativas já registradas.
const { POR_TAG } = require('../conteudo/dificuldades');
const { exerciciosDaTag } = require('./licao');
const { dominioPorTag } = require('./modelo');
const { embaralhar } = require('./util');

const DIA = 864e5;
const MODOS = ['ler', 'escrever', 'ouvir'];
const NOME_MODO = { ler: 'ler', escrever: 'escrever', ouvir: 'ouvir', falar: 'falar' };
const MIN_PREFERENCIA = 0.15;      // bônus de peso para o modo que a pessoa diz preferir

// ouvir = tudo que usa áudio; escrever = produzir sozinho (lacuna, frase, texto); ler = reconhecer entre opções
const modoDe = t => (t.modalidade === 'audio' ? 'ouvir' : t.formato === 'producao' ? 'escrever' : 'ler');
const conf = n => (n >= 20 ? 'alta' : n >= 8 ? 'media' : 'baixa');

function retrato(tentativas, nivelamento, agora = Date.now()) {
  const validas = tentativas.filter(t => !t.contestada && agora - Date.parse(t.em) <= 60 * DIA);
  const modos = {};
  for (const m of MODOS) {
    const l = validas.filter(t => modoDe(t) === m).slice(-40);
    const certos = l.filter(t => t.correto).length;
    const tempos = l.filter(t => t.correto && t.tempo_ms > 0).map(t => t.tempo_ms).sort((a, b) => a - b);
    modos[m] = {
      n: l.length, certos, pct: l.length ? Math.round(100 * certos / l.length) : null,
      suave: (certos + 2) / (l.length + 4),                        // com poucos dados, puxa para 50%
      tempo: tempos.length >= 3 ? Math.round(tempos[Math.floor(tempos.length / 2)] / 1000) : null,
      comDica: l.length ? Math.round(100 * l.filter(t => t.dica).length / l.length) : 0,
      confianca: conf(l.length),
    };
  }
  const base = nivelamento?.porHabilidade || {};
  const nivel = { ler: base.leitura?.nivel || null, escrever: base.escrita?.nivel || null, ouvir: base.escuta?.nivel || null, falar: base.fala?.nivel || null };
  return { modos, nivel, total: validas.length };
}

// o que o app entendeu, em frases simples; cada uma diz em que se baseia
function percepcoes(r, estilos = []) {
  const out = [];
  const com = MODOS.filter(m => r.modos[m].n >= 6);
  if (r.total < 12) {
    out.push({ id: 'poucos-dados', titulo: 'Ainda estou te conhecendo', texto: `Tenho só ${r.total} respostas suas. O retrato fica fiel depois de umas 30.`, acao: 'Faça as aulas e o treino de hoje: cada resposta, certa ou errada, me ensina sobre você.', confianca: 'baixa' });
  }
  if (com.length >= 2) {
    const ord = com.slice().sort((a, b) => r.modos[b].suave - r.modos[a].suave);
    const melhor = ord[0], pior = ord[ord.length - 1];
    const gap = r.modos[melhor].pct - r.modos[pior].pct;
    if (gap >= 12) out.push({ id: 'melhor-pior', titulo: `Você vai melhor ${melhor === 'ler' ? 'lendo' : melhor === 'escrever' ? 'escrevendo' : 'ouvindo'} do que ${pior === 'ler' ? 'lendo' : pior === 'escrever' ? 'escrevendo' : 'ouvindo'}`,
      texto: `Você acertou ${r.modos[melhor].pct}% ${melhor === 'ler' ? 'lendo' : melhor === 'escrever' ? 'escrevendo' : 'ouvindo'} e ${r.modos[pior].pct}% ${pior === 'ler' ? 'lendo' : pior === 'escrever' ? 'escrevendo' : 'ouvindo'}, nos últimos 60 dias.`,
      acao: `O treino coloca mais ${NOME_MODO[pior]}, sempre com apoio no começo. Isso não é um rótulo seu: é o que seus acertos mostram hoje e muda conforme você evolui.`, confianca: conf(Math.min(r.modos[melhor].n, r.modos[pior].n) * 2) });
  }
  for (const m of com) {
    const x = r.modos[m];
    if (x.comDica >= 40) out.push({ id: 'dica-' + m, titulo: `Você usa bastante dica ao ${NOME_MODO[m]}`, texto: `Em ${x.comDica}% das respostas de ${NOME_MODO[m]} você pediu dica.`, acao: 'Nada de errado: a dica ajuda a começar. O treino vai tirando o apoio aos poucos.', confianca: conf(x.n) });
  }
  if (r.modos.escrever.tempo != null && r.modos.escrever.tempo > 25) out.push({ id: 'devagar', titulo: 'Você sabe, mas leva um tempo para escrever', texto: `Nas respostas certas escrevendo, o tempo típico foi de ${r.modos.escrever.tempo} segundos.`, acao: 'Entram rodadas de frases curtas que você já domina, para a resposta sair mais rápida.', confianca: conf(r.modos.escrever.n) });
  for (const p of estilos.filter(e => MODOS.includes(e))) {
    const x = r.modos[p];
    if (x.n < 6) continue;
    const outros = MODOS.filter(m => m !== p && r.modos[m].n >= 6);
    if (!outros.length) continue;
    const mediaOutros = outros.reduce((s, m) => s + r.modos[m].pct, 0) / outros.length;
    if (x.pct + 12 <= mediaOutros) out.push({ id: 'prefere-fraco-' + p, titulo: `Você gosta de ${NOME_MODO[p]}, mas hoje acerta menos nisso`, texto: `Acertos ${NOME_MODO[p]}: ${x.pct}%. Nos outros modos: ${Math.round(mediaOutros)}%.`, acao: `Isso é comum. Mantenho ${NOME_MODO[p]} no treino (gostar ajuda a continuar) e dou apoio extra.`, confianca: conf(x.n) });
    else if (x.pct >= mediaOutros + 12) out.push({ id: 'prefere-forte-' + p, titulo: `Seu gosto por ${NOME_MODO[p]} combina com seus acertos`, texto: `Acertos ${NOME_MODO[p]}: ${x.pct}%. Nos outros modos: ${Math.round(mediaOutros)}%.`, acao: `Vou usar ${NOME_MODO[p]} para te dar confiança, e puxar os outros modos aos poucos.`, confianca: conf(x.n) });
  }
  return out.slice(0, 5);
}

// quanto de cada modo entra no treino: precisa (1 - acerto) + um piso + um bônus pequeno pelo que a pessoa gosta
function pesosDeModos(r, estilos = []) {
  const w = {}; let soma = 0;
  for (const m of MODOS) { w[m] = 0.25 + (1 - r.modos[m].suave) + (estilos.includes(m) ? MIN_PREFERENCIA : 0); soma += w[m]; }
  for (const m of MODOS) w[m] = Math.round(100 * w[m] / soma) / 100;
  return w;
}

// dificuldades de verdade, por tag do catálogo: erro recente pesa mais (meia-vida de 14 dias), acerto alivia
function dificuldades(tentativas, focos = [], agora = Date.now()) {
  const validas = tentativas.filter(t => !t.contestada && t.tag && POR_TAG[t.tag] && agora - Date.parse(t.em) <= 60 * DIA);
  const dom = dominioPorTag(validas);
  const score = {};
  for (const t of validas) score[t.tag] = (score[t.tag] || 0) + (t.correto ? -0.5 : 1) * Math.pow(0.5, (agora - Date.parse(t.em)) / (14 * DIA));
  const abertos = new Map(focos.filter(f => POR_TAG[f.tag]).map(f => [f.tag, f]));
  const tags = new Set([...Object.keys(score), ...abertos.keys()]);
  const lista = [];
  for (const tag of tags) {
    const d = dom[tag] || { total: 0, acertos: 0, erros: 0, dominio: 0.5 };
    const seq = validas.filter(t => t.tag === tag).map(t => t.correto);
    const ult3 = seq.slice(-3), antes = seq.slice(-8, -4), agoraS = seq.slice(-4);
    const taxa = l => (l.length ? l.filter(Boolean).length / l.length : null);
    const superada = d.total >= 5 && d.dominio >= 0.8 && ult3.length === 3 && ult3.every(Boolean);
    const melhorando = !superada && antes.length >= 3 && agoraS.length >= 3 && taxa(agoraS) - taxa(antes) >= 0.25;
    const pontos = Math.max(0, score[tag] || 0) + (abertos.has(tag) ? 0.5 : 0);
    if (pontos < 0.4 && !superada) continue;
    lista.push({
      tag, nome: POR_TAG[tag].nome, regra: POR_TAG[tag].regra, erros: d.erros, total: d.total, dominio: Math.round(d.dominio * 100),
      status: superada ? 'superada' : melhorando ? 'melhorando' : 'atencao', pontos: Math.round(pontos * 100) / 100,
      ultimoErro: d.ultimoErro || null, seu: abertos.get(tag)?.trecho || null, correcao: abertos.get(tag)?.correcao || null,
    });
  }
  return lista.sort((a, b) => (a.status === 'superada') - (b.status === 'superada') || b.pontos - a.pontos);
}

// erros que não estão no catálogo (a IA pegou na conversa ou no texto): viram cartão e entram no treino como "corrija a frase"
function errosPessoais(cartoes) {
  const out = [];
  for (const c of cartoes) {
    const m = /^Como dizer melhor: "(.+)"$/s.exec(c.frente || '');
    const trecho = m ? m[1].trim() : null, sugestao = (c.verso || '').trim();
    if (!trecho || !sugestao || trecho.length > 160 || sugestao.length > 160 || /\.\.\.|\[|\]/.test(sugestao) || trecho === sugestao) continue;
    out.push({ id: c.id, trecho, sugestao, explicacao: c.nota_origem || null, origem: c.origem || null, em: c.criado_em });
  }
  return out;
}

// ditado derivado de qualquer exercício que tenha a frase completa: o mesmo ponto, agora ouvindo
function dictadoDe(e) {
  let frase = null;
  if (e.tipo === 'lacuna' && e.frase && e.frase.split('___').length === 2 && !e.multi && Array.isArray(e.resposta)) frase = e.frase.replace('___', e.resposta[0]);
  else if (e.tipo === 'traduzir' && Array.isArray(e.aceitas)) frase = e.aceitas[0] + (e.sufixo || '');
  else if (e.tipo === 'ordenar' && typeof e.resposta === 'string') frase = e.resposta + (e.sufixo || '');
  if (!frase || frase.length > 160 || /\.\.\.|\[|\]/.test(frase)) return null;
  return { tipo: 'ditado', habilidade: 'escuta', tag: e.tag, dif: e.dif || 2, audio: frase, resposta: [frase], explica: e.explica || null, derivado: e.id };
}

const TIPOS_MODO = { ler: ['escolha'], escrever: ['lacuna', 'traduzir', 'ordenar'], ouvir: ['lacuna', 'traduzir', 'ordenar'] };

function distribuir(total, pesos) {
  const bruto = MODOS.map(m => [m, pesos[m] * total]);
  const cont = Object.fromEntries(bruto.map(([m, v]) => [m, Math.floor(v)]));
  let falta = total - Object.values(cont).reduce((s, v) => s + v, 0);
  for (const [m] of bruto.slice().sort((a, b) => (b[1] - Math.floor(b[1])) - (a[1] - Math.floor(a[1])))) { if (falta <= 0) break; cont[m]++; falta--; }
  // nenhum modo importante fica sem nada (com 4 ou mais itens)
  if (total >= 4) for (const m of MODOS) if (cont[m] === 0 && pesos[m] >= 0.2) { const maior = MODOS.reduce((a, b) => (cont[a] >= cont[b] ? a : b)); if (cont[maior] > 1) { cont[maior]--; cont[m]++; } }
  return cont;
}

// Monta o treino do dia. `bancoIa` = exercícios novos da IA por tag (já validados), `vistos` = { itemId: { acertou } }.
function montarTreino({ tags, pessoais = [], pesos, quantos = 8, bancoIa = {}, vistos = {}, semente = 's' }) {
  if (!tags.length && !pessoais.length) return { itens: [], modos: { ler: 0, escrever: 0, ouvir: 0 }, tags: [], pessoais: 0 };
  // Teto de 10 perguntas; se o treino tem áudio (ouvir), 7, porque ouvir e digitar pesa mais.
  quantos = Math.min(10, quantos);
  if (quantos > 7 && Math.round(pesos.ouvir * (quantos - Math.min(2, pessoais.length, Math.floor(quantos / 4)))) > 0) quantos = 7;
  const nPessoais = Math.min(2, pessoais.length, Math.floor(quantos / 4));
  const principais = quantos - nPessoais;
  const cont = distribuir(principais, pesos);
  const usados = new Set();
  const prio = e => { const v = vistos[e.id]; return !v ? 1 : !v.acertou ? 2 : 0; };
  const reserva = {};
  for (const t of tags) reserva[t.tag] = [...(bancoIa[t.tag] || []), ...exerciciosDaTag(t.tag)];
  const candidato = (tag, modo) => {
    const lista = reserva[tag].filter(e => TIPOS_MODO[modo].includes(e.tipo) && !usados.has(e.id));
    const ord = embaralhar(lista, `${semente}:${tag}:${modo}`).sort((a, b) => prio(b) - prio(a) || (b.personalizado ? 1 : 0) - (a.personalizado ? 1 : 0));
    for (const e of ord) {
      const item = modo === 'ouvir' ? dictadoDe(e) : { ...e };
      if (item) { usados.add(e.id); return { ...item, _modo: modo, _fonte: e.id }; }
    }
    return null;
  };
  // ordem dos modos: começa pelo mais leve (ler), depois intercala pelo que falta mais
  const resta = { ...cont }, ordem = [];
  if (resta.ler > 0) { ordem.push('ler'); resta.ler--; }
  while (Object.values(resta).some(v => v > 0)) for (const m of MODOS.slice().sort((a, b) => resta[b] - resta[a])) if (resta[m] > 0) { ordem.push(m); resta[m]--; }
  const itens = [];
  const sequenciaTags = tags.length ? tags : [];
  ordem.forEach((modo, i) => {
    if (!sequenciaTags.length) return;
    for (let k = 0; k < sequenciaTags.length; k++) {
      const tag = sequenciaTags[(i + k) % sequenciaTags.length].tag;
      const tentativa = [modo, ...MODOS.filter(m => m !== modo)];
      for (const m of tentativa) { const c = candidato(tag, m); if (c) { itens.push(c); return; } }
    }
  });
  // "corrija a frase": os erros só dele, espalhados no meio e no fim
  const extras = pessoais.slice(0, nPessoais).map(p => ({ tipo: 'corrigir', habilidade: 'escrita', tag: null, dif: 2, errado: p.trecho, aceitas: [p.sugestao], explica: p.explicacao, _modo: 'escrever', _fonte: 'pessoal:' + p.id }));
  extras.forEach((x, i) => itens.splice(Math.min(itens.length, Math.round(itens.length * (i + 1) / (extras.length + 1))) + i, 0, x));
  const modos = { ler: 0, escrever: 0, ouvir: 0 }; for (const e of itens) modos[e._modo]++;
  return { itens: itens.map((e, i) => ({ ...e, id: `tr${i}` })), modos, tags: tags.map(t => ({ tag: t.tag, nome: t.nome })), pessoais: extras.length };
}

// por que o treino de hoje é assim (o aluno entende o motivo, como na lição)
function explicarTreino({ difs, pesos, retr, estilos, pessoais }) {
  const out = [];
  if (difs.length) out.push(`O foco de hoje: ${difs.map(d => d.nome.toLowerCase()).join('; ')}.`);
  const top = MODOS.slice().sort((a, b) => pesos[b] - pesos[a])[0];
  if (retr.total >= 12 && retr.modos[top].n >= 6) out.push(`Entra mais ${NOME_MODO[top]} porque ${NOME_MODO[top] === 'ouvir' ? 'ouvindo' : NOME_MODO[top] === 'ler' ? 'lendo' : 'escrevendo'} você acerta ${retr.modos[top].pct}%, menos que nos outros modos.`);
  else out.push('Ainda não sei qual modo é o seu mais fraco, então misturo os três.');
  const gosta = estilos.filter(e => MODOS.includes(e));
  if (gosta.length) out.push(`Como você gosta de ${gosta.map(g => NOME_MODO[g]).join(' e ')}, deixei um pouco mais disso.`);
  if (pessoais) out.push(`Inclui ${pessoais === 1 ? 'uma frase sua' : pessoais + ' frases suas'} para você corrigir (erros que não estão na lista comum).`);
  return out;
}

module.exports = { MODOS, modoDe, retrato, percepcoes, pesosDeModos, dificuldades, errosPessoais, dictadoDe, distribuir, montarTreino, explicarTreino };
