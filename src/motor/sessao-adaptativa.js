'use strict';
// Sessão curta que acompanha o aluno: o que ela mostra muda conforme o histórico de respostas.
// - Ritmo: acerto recente baixo = começa pelo mais fácil e dá mais apoio; acerto alto sem dica = puxa um pouco mais.
// - Modo mais fraco (ler, escrever, ouvir): ganha mais espaço, sem virar rótulo da pessoa.
// - "Relembrar": volta o que a pessoa errou e ainda não acertou depois, e as dificuldades do catálogo que seguem abertas.
// - Apoios de acessibilidade: áudio mais devagar para quem acerta pouco ouvindo; banco de palavras para quem trava escrevendo.
// - Segunda chance: errou durante a sessão? A mesma questão volta no fim, depois da explicação (conta como prática com apoio).
// Toda decisão vira uma frase em "porque", para o aluno entender por que a sessão é assim.
const { retrato, dificuldades, modoDe } = require('./aprendizagem');
const { dificuldadeAlvo } = require('./modelo');
const { exerciciosDaTag } = require('./licao');
const { embaralhar } = require('./util');

const NOME_MODO = { ler: 'leitura', escrever: 'escrita', ouvir: 'escuta' };
const QUANTIDADE = { 5: 3, 10: 6, 20: 9 };
const RELEMBRAR = { 5: 1, 10: 2, 20: 3 };
const SEGUNDAS_CHANCES = { 5: 1, 10: 2, 20: 3 };

// tipo de exercício -> modo medido no retrato (mesma regra de aprendizagem.modoDe)
const modoDoTipo = tipo => (['escuta', 'ditado'].includes(tipo) ? 'ouvir' : ['escolha', 'leitura', 'pares', 'detetive'].includes(tipo) ? 'ler' : 'escrever');

// Como a pessoa está indo agora: olha as últimas respostas fora do teste de nível.
function lerRitmo(tentativas) {
  const recentes = tentativas.filter(t => t.origem !== 'nivelamento' && !t.contestada).slice(-15);
  if (recentes.length < 6) return { ritmo: 'conhecendo', taxa: null, dicas: null, n: recentes.length };
  const taxa = recentes.reduce((s, t) => s + (t.correto ? (t.dica ? 0.7 : 1) : 0), 0) / recentes.length;
  const dicas = recentes.filter(t => t.dica).length / recentes.length;
  const ritmo = taxa < 0.55 ? 'apoio' : taxa >= 0.88 && dicas <= 0.25 ? 'desafio' : 'normal';
  return { ritmo, taxa: Math.round(taxa * 100) / 100, dicas: Math.round(dicas * 100) / 100, n: recentes.length };
}

function adaptacao({ tentativas = [], nivel = 'A1', agora = Date.now() }) {
  const r = lerRitmo(tentativas);
  const ret = retrato(tentativas, null, agora);
  const medidos = ['ler', 'escrever', 'ouvir'].filter(m => ret.modos[m].n >= 6);
  let fraco = null;
  if (medidos.length >= 2) {
    const ord = medidos.slice().sort((a, b) => ret.modos[a].suave - ret.modos[b].suave);
    const pior = ord[0], melhor = ord[ord.length - 1];
    if (ret.modos[pior].pct < 60 || ret.modos[melhor].pct - ret.modos[pior].pct >= 12) fraco = pior;
  } else if (medidos.length === 1 && ret.modos[medidos[0]].pct < 60) fraco = medidos[0];
  const ouvir = ret.modos.ouvir, escrever = ret.modos.escrever;
  return {
    ...r,
    alvo: dificuldadeAlvo(nivel, tentativas),
    fraco, pctFraco: fraco ? ret.modos[fraco].pct : null,
    ouvirDevagar: ouvir.n >= 6 && ouvir.pct < 60,
    bancoEscrita: r.ritmo === 'apoio' || (escrever.n >= 6 && escrever.pct < 50),
  };
}

function tiposDaSessao(minutos, nivel, ritmo) {
  let tipos = minutos === 5 ? ['escolha', 'leitura'] : nivel === 'A1' ? ['escolha', 'leitura', 'lacuna', 'ordenar'] : ['escolha', 'leitura', 'lacuna', 'ordenar', 'traduzir', 'escuta', 'ditado'];
  if (ritmo === 'desafio') tipos = minutos === 5 ? [...tipos, 'lacuna'] : nivel === 'A1' ? [...tipos, 'traduzir', 'escuta'] : tipos;
  if (ritmo === 'apoio' && minutos > 5) tipos = tipos.filter(t => !['traduzir', 'ditado'].includes(t));
  return tipos;
}

// histórico por questão: a última resposta e se já acertou sem nenhuma ajuda
function historicoPorItem(tentativas) {
  const h = {};
  for (const t of tentativas) {
    if (!t.item_id || t.contestada) continue;
    const x = h[t.item_id] ||= { n: 0, semAjuda: 0, ultima: null, tag: t.tag || null };
    x.n++; x.ultima = { correto: !!t.correto, em: t.em };
    if (t.correto && !t.dica) x.semAjuda++;
  }
  return h;
}

// Ordena as questões novas da missão para ESTA pessoa. Em missões do zero a ordem pedagógica (aprender e depois praticar) é mantida.
function ordenarNovos(validos, { hist, ad, guiada }) {
  const pontua = e => {
    const x = hist[e.id];
    let p = !x ? 3 : !x.ultima.correto ? 4 : x.semAjuda ? -4 : 1;
    const d = e.dif || 1;
    if (d === ad.alvo) p += 1; else if (d > ad.alvo) p -= ad.ritmo === 'apoio' ? 3 : 1;
    if (ad.fraco && modoDoTipo(e.tipo) === ad.fraco) p += 1.5;
    if (ad.ritmo === 'desafio' && ['traduzir', 'ditado', 'escuta', 'lacuna'].includes(e.tipo)) p += 0.5;
    return p;
  };
  if (guiada) return validos.filter(e => !(hist[e.id]?.semAjuda >= 2));
  return validos.map((e, i) => [e, pontua(e), i]).sort((a, b) => b[1] - a[1] || (ad.ritmo === 'apoio' ? (a[0].dif || 1) - (b[0].dif || 1) : 0) || a[2] - b[2]).map(([e]) => e);
}

// O que voltar para firmar: erros recentes ainda não corrigidos (um por dificuldade) e, se faltar, as dificuldades abertas.
function escolherRelembrar({ tentativas, banco, tipos, excluir, quantos, hist, agora }) {
  if (!quantos) return { itens: [], tagsNovas: [] };
  const itens = [], tagsUsadas = new Set(), ids = new Set(excluir);
  for (const t of [...tentativas].reverse()) {
    if (itens.length >= quantos) break;
    const e = banco[t.item_id];
    if (t.correto || t.contestada || !e || !tipos.includes(e.tipo) || ids.has(e.id) || hist[e.id]?.ultima?.correto) continue;
    if (e.tag && tagsUsadas.has(e.tag)) continue;
    ids.add(e.id); if (e.tag) tagsUsadas.add(e.tag);
    itens.push({ ...e, etapa: 'Relembrar', motivo: 'erro' });
  }
  const tagsNovas = [];
  for (const d of dificuldades(tentativas, [], agora).filter(x => x.status !== 'superada')) {
    if (itens.length >= quantos) break;
    if (tagsUsadas.has(d.tag)) continue;
    const cand = embaralhar(exerciciosDaTag(d.tag).filter(e => tipos.includes(e.tipo) && !ids.has(e.id)), 'relembrar:' + d.tag)
      .sort((a, b) => Number(!!hist[a.id]?.ultima?.correto) - Number(!!hist[b.id]?.ultima?.correto))[0];
    if (!cand) continue;
    ids.add(cand.id); tagsUsadas.add(d.tag); tagsNovas.push(d.nome);
    itens.push({ ...cand, etapa: 'Relembrar', motivo: 'dificuldade' });
  }
  return { itens, tagsNovas };
}

// Banco de palavras numa lacuna de um espaço só: a resposta e até duas outras palavras da mesma missão.
function comBancoDePalavras(e, missao) {
  if (e.tipo !== 'lacuna' || e.bancoPalavras || e.multi || !Array.isArray(e.resposta) || (e.frase || '').split('___').length !== 2) return e;
  const certa = String(e.resposta[0] || '');
  if (!certa || /\s/.test(certa)) return e;
  const outras = (missao.exercicios || []).filter(x => x.tipo === 'lacuna' && x.id !== e.id && Array.isArray(x.resposta)).map(x => String(x.resposta[0] || ''))
    .filter(p => p && !/\s/.test(p) && p.toLowerCase() !== certa.toLowerCase());
  const distratores = [...new Set(embaralhar(outras, 'banco:' + e.id))].slice(0, 2);
  if (!distratores.length) return e;
  return { ...e, bancoPalavras: [certa, ...distratores], apoioBanco: true };
}

function porqueDaSessao({ ad, relembrar, tagsNovas }) {
  const out = [];
  if (ad.ritmo === 'conhecendo') out.push('Ainda estou te conhecendo: cada resposta ajuda a ajustar as próximas sessões.');
  if (ad.ritmo === 'apoio') out.push(`Nas suas últimas respostas o acerto ficou em ${Math.round(ad.taxa * 100)}%. Hoje começo pelas mais fáceis e deixo mais apoio à mão.`);
  if (ad.ritmo === 'desafio') out.push(`Você está acertando quase tudo sem dica (${Math.round(ad.taxa * 100)}%). Hoje entram questões um pouco mais puxadas.`);
  const erros = relembrar.filter(e => e.motivo === 'erro').length;
  if (erros) out.push(erros === 1 ? 'Volta uma questão que você errou antes, para firmar.' : `Voltam ${erros} questões que você errou antes, para firmar.`);
  if (tagsNovas.length) out.push(`Inclui ${tagsNovas.map(t => t.toLowerCase()).join(' e ')}, que ainda dá tropeço.`);
  if (ad.fraco) out.push(`Entra mais ${NOME_MODO[ad.fraco]} porque é onde você acerta menos agora (${ad.pctFraco}%). Isso muda conforme você melhora.`);
  if (ad.ouvirDevagar) out.push('O áudio começa mais devagar. Dá para acelerar quando quiser.');
  if (ad.bancoEscrita) out.push('Nas frases para completar, aparecem palavras para tocar. Escrever continua valendo.');
  out.push('Errou alguma? Ela volta no fim da sessão para você tentar de novo.');
  return out;
}

// Junta tudo: as novas da missão e as de relembrar intercaladas, começando por uma questão leve.
function montarItens({ missao, banco, tentativas, minutos, nivel, agora = Date.now() }) {
  const ad = adaptacao({ tentativas, nivel, agora });
  const quantidade = QUANTIDADE[minutos] || 6;
  const tipos = tiposDaSessao(minutos, nivel, ad.ritmo);
  const hist = historicoPorItem(tentativas);
  const validos = missao.exercicios.filter(e => tipos.includes(e.tipo));
  const guiada = missao.id.startsWith('zero-');
  const novosOrd = ordenarNovos(validos, { hist, ad, guiada });
  const quantosRelembrar = ad.ritmo === 'conhecendo' && minutos === 5 ? 0 : RELEMBRAR[minutos] || 2;
  const { itens: relembrar, tagsNovas } = escolherRelembrar({ tentativas, banco, tipos, excluir: validos.map(e => e.id), quantos: quantosRelembrar, hist, agora });
  let novos = novosOrd.slice(0, Math.max(quantidade - relembrar.length, 1)).map(e => ({ ...e, etapa: 'Praticar' }));
  // aquecimento: a primeira questão é a mais leve das escolhidas (fora das missões do zero, que já vêm em ordem)
  if (!guiada && novos.length > 1) {
    // entre as que a pessoa ainda não domina (se houver), a de menor dificuldade, de preferência de leitura
    const cand = novos.map((e, i) => i).filter(i => !hist[novos[i].id]?.semAjuda);
    const pool = cand.length ? cand : novos.map((e, i) => i);
    const leve = pool.reduce((m, i) => { const e = novos[i], x = novos[m]; return (e.dif || 1) < (x.dif || 1) || ((e.dif || 1) === (x.dif || 1) && modoDoTipo(e.tipo) === 'ler' && modoDoTipo(x.tipo) !== 'ler') ? i : m; }, pool[0]);
    novos = [novos[leve], ...novos.filter((_, i) => i !== leve)];
  }
  const itens = [...novos];
  relembrar.forEach((e, k) => itens.splice(Math.min(itens.length, 1 + Math.round((k + 1) * novos.length / (relembrar.length + 1))) + k, 0, e));
  const final = [...new Map(itens.map(e => [e.id, e])).values()].slice(0, quantidade).map(e => (ad.bancoEscrita ? comBancoDePalavras(e, missao) : e));
  return { itens: final, adaptacao: { ritmo: ad.ritmo, ouvirDevagar: ad.ouvirDevagar, bancoEscrita: ad.bancoEscrita, fraco: ad.fraco, alvo: ad.alvo, segundasChances: SEGUNDAS_CHANCES[minutos] || 2 },
    porque: porqueDaSessao({ ad, relembrar: final.filter(e => e.etapa === 'Relembrar'), tagsNovas }) };
}

// Depois de um erro, a mesma questão volta no fim (uma vez só por questão, com limite por sessão).
function segundaChance(d, ex, av) {
  if (av.correto || ex.segundaChance) return null;
  const limite = d.adaptacao?.segundasChances ?? 0;
  if (d.itens.filter(e => e.segundaChance).length >= limite) return null;
  const id = `${ex.id}~2`;
  if (d.itens.some(e => e.id === id)) return null;
  const copia = { ...ex, id, origemId: ex.id, segundaChance: true, etapa: 'Tente de novo' };
  return copia;
}

// Evolução para mostrar ao aluno: acerto sem ajuda nos últimos 14 dias contra os 14 anteriores.
function resumoEvolucao(tentativas = [], { agora = Date.now(), nivel = 'A1' } = {}) {
  const DIA = 864e5, validas = tentativas.filter(t => t.origem !== 'nivelamento' && !t.contestada);
  const janela = (de, ate) => { const l = validas.filter(t => { const x = Date.parse(t.em); return x > agora - de * DIA && x <= agora - ate * DIA; }); return { n: l.length, pct: l.length ? Math.round(100 * l.filter(t => t.correto && !t.dica).length / l.length) : null }; };
  const recente = janela(14, 0), anterior = janela(28, 14);
  const tendencia = recente.n < 8 || anterior.n < 8 ? null : recente.pct - anterior.pct >= 8 ? 'subindo' : anterior.pct - recente.pct >= 8 ? 'caindo' : 'estavel';
  const ad = adaptacao({ tentativas, nivel, agora });
  const apoios = [];
  if (ad.ritmo === 'apoio') apoios.push('Sessões começam pelas questões mais fáceis, com mais apoio.');
  if (ad.ritmo === 'desafio') apoios.push('Sessões com questões um pouco mais puxadas, porque você está acertando quase tudo.');
  if (ad.fraco) apoios.push(`Mais ${NOME_MODO[ad.fraco]} nas sessões: é onde você acerta menos agora (${ad.pctFraco}%).`);
  if (ad.ouvirDevagar) apoios.push('Áudio começando mais devagar em todos os exercícios.');
  if (ad.bancoEscrita) apoios.push('Palavras para tocar nas frases de completar (escrever continua valendo).');
  return { recente, anterior, tendencia, ritmo: ad.ritmo, apoios };
}

module.exports = { resumoEvolucao, adaptacao, lerRitmo, tiposDaSessao, historicoPorItem, ordenarNovos, escolherRelembrar, comBancoDePalavras, montarItens, segundaChance, modoDoTipo, modoDe };
