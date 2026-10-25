'use strict';
// Modelo do aluno: domínio por dificuldade, desempenho por habilidade e HIPÓTESES sobre onde ele trava.
// Hipótese não é rótulo: cada uma diz em que se baseia, tem confiança e pode ser descartada pelo aluno.
const { POR_TAG } = require('../conteudo/dificuldades');
const { NIVEIS } = require('../conteudo/nivelamento');

const DIA = 864e5;
const taxa = l => (l.length ? l.filter(t => t.correto).length / l.length : null);
const mediana = l => { if (!l.length) return null; const s = l.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const conf = n => (n >= 24 ? 'alta' : n >= 12 ? 'media' : 'baixa');

function dominioPorTag(tentativas) {
  const out = {};
  const ordenadas = tentativas.slice().sort((a, b) => a.em.localeCompare(b.em));
  for (const t of ordenadas) {
    if (!t.tag || t.contestada || t.dica) continue;
    const d = out[t.tag] || (out[t.tag] = { dominio: 0.5, total: 0, acertos: 0, erros: 0, contextos: new Set(), errosCtx: new Set(), ultima: null, ultimoErro: null });
    const x = t.correto ? 1 : 0;
    const peso = t.formato === 'producao' ? 0.4 : 0.25;    // produzir sozinho pesa mais que reconhecer
    d.dominio += peso * (x - d.dominio);
    d.total++; if (x) d.acertos++; else { d.erros++; d.errosCtx.add(t.contexto || t.missao || t.origem); d.ultimoErro = t.em; }
    d.contextos.add(t.contexto || t.missao || t.origem);
    d.ultima = t.em;
  }
  for (const d of Object.values(out)) { d.contextos = d.contextos.size; d.errosCtx = d.errosCtx.size; d.dominio = Math.round(d.dominio * 100) / 100; }
  return out;
}

function porHabilidade(tentativas, nivelamento) {
  const base = nivelamento?.porHabilidade || {};
  const out = {};
  for (const h of ['gramatica', 'vocabulario', 'leitura', 'escuta', 'escrita', 'fala']) {
    const l = tentativas.filter(t => t.habilidade === h && !t.contestada);
    const recentes = l.slice(-20);
    const pct = taxa(recentes);
    const antes = taxa(l.slice(-40, -20));
    out[h] = {
      nivel: base[h]?.nivel || null,
      pct: pct === null ? null : Math.round(pct * 100),
      n: l.length,
      tendencia: pct !== null && antes !== null && l.length >= 30 ? (pct - antes >= 0.1 ? 'subindo' : antes - pct >= 0.1 ? 'caindo' : 'estavel') : null,
    };
  }
  return out;
}

function hipoteses(tentativas, revisoes, { agora = Date.now(), descartadas = [] } = {}) {
  const janela = tentativas.filter(t => !t.contestada && !t.dica && agora - Date.parse(t.em) <= 30 * DIA);
  const recente = janela.filter(t => agora - Date.parse(t.em) <= 10 * DIA);
  const out = [];
  const status = (gapTotal, gapRecente) => (gapRecente === null ? 'hipotese' : gapRecente < gapTotal / 2 ? 'melhorando' : 'confirmando');

  // 1. Entende lendo, mas não ouvindo
  const compreensao = l => ({ audio: l.filter(t => t.modalidade === 'audio' && t.formato === 'reconhecimento'), texto: l.filter(t => t.modalidade === 'texto' && ['leitura', 'vocabulario', 'gramatica'].includes(t.habilidade) && t.formato === 'reconhecimento') });
  const c = compreensao(janela);
  if (c.audio.length >= 5 && c.texto.length >= 5) {
    const gap = taxa(c.texto) - taxa(c.audio);
    if (gap >= 0.2) {
      const cr = compreensao(recente);
      const gr = cr.audio.length >= 3 && cr.texto.length >= 3 ? taxa(cr.texto) - taxa(cr.audio) : null;
      out.push({ id: 'escuta-x-leitura', titulo: 'Você entende melhor lendo do que ouvindo',
        texto: `Nos últimos 30 dias você acertou ${Math.round(taxa(c.texto) * 100)}% do que leu e ${Math.round(taxa(c.audio) * 100)}% do que ouviu, em frases de nível parecido.`,
        acao: 'Vamos colocar mais escuta curta nas lições, com a opção de ver o texto depois de responder, e áudio um pouco mais devagar no começo.',
        evidencia: c.audio.length + c.texto.length, confianca: conf(c.audio.length + c.texto.length), status: status(gap, gr), foco: 'escuta' });
    }
  }
  // 2. Reconhece a resposta certa, mas não produz sozinho
  const rec = janela.filter(t => t.formato === 'reconhecimento'), prod = janela.filter(t => t.formato === 'producao');
  if (rec.length >= 6 && prod.length >= 6) {
    const gap = taxa(rec) - taxa(prod);
    if (gap >= 0.25) {
      const rr = recente.filter(t => t.formato === 'reconhecimento'), pr = recente.filter(t => t.formato === 'producao');
      const gr = rr.length >= 3 && pr.length >= 3 ? taxa(rr) - taxa(pr) : null;
      out.push({ id: 'reconhece-x-produz', titulo: 'Você reconhece a resposta, mas ainda trava para montar sozinho',
        texto: `Com alternativas você acertou ${Math.round(taxa(rec) * 100)}%; escrevendo sozinho, ${Math.round(taxa(prod) * 100)}%.`,
        acao: 'Vamos trocar parte das alternativas por frases para completar e montar, começando com apoio e tirando o apoio aos poucos.',
        evidencia: rec.length + prod.length, confianca: conf(rec.length + prod.length), status: status(gap, gr), foco: 'producao' });
    }
  }
  // 3. Sabe, mas demora para formular
  const prodCertas = prod.filter(t => t.correto && t.tempo_ms > 0);
  const md = mediana(prodCertas.map(t => t.tempo_ms));
  if (prodCertas.length >= 5 && md > 25000) {
    out.push({ id: 'demora-formular', titulo: 'Você sabe, mas leva um tempo para formular',
      texto: `Nas respostas que você acertou escrevendo, o tempo típico foi de ${Math.round(md / 1000)} segundos.`,
      acao: 'Vamos incluir rodadas de respostas rápidas com frases que você já domina, para a resposta sair mais automática na conversa.',
      evidencia: prodCertas.length, confianca: conf(prodCertas.length * 2), status: 'hipotese', foco: 'fluencia' });
  }
  // 4. Erro que se repete em situações diferentes
  const dom = dominioPorTag(janela.filter(t => agora - Date.parse(t.em) <= 21 * DIA));
  for (const [tag, d] of Object.entries(dom)) {
    if (d.erros >= 3 && d.errosCtx >= 2 && d.dominio < 0.65 && POR_TAG[tag]) {
      out.push({ id: 'erro-recorrente:' + tag, tag, titulo: `“${POR_TAG[tag].nome}” apareceu em ${d.errosCtx} situações diferentes`,
        texto: `Foram ${d.erros} tropeços nas últimas 3 semanas, em contextos diferentes (lições, conversas ou textos).`,
        acao: 'Vamos trabalhar isso com outra abordagem e depois testar numa situação nova, sem dicas.',
        evidencia: d.total, confianca: conf(d.total * 2), status: d.dominio >= 0.5 ? 'melhorando' : 'confirmando', foco: 'tag' });
    }
  }
  // 5. Aprende, mas esquece depois de alguns dias
  const longas = (revisoes || []).filter(r => r.intervalo_antes >= 6 && agora - Date.parse(r.em) <= 30 * DIA);
  if (longas.length >= 6) {
    const falhas = longas.filter(r => r.nota < 3).length / longas.length;
    if (falhas >= 0.4) out.push({ id: 'esquece', titulo: 'Algumas palavras somem depois de alguns dias',
      texto: `Nas revisões feitas depois de uma semana ou mais, você esqueceu ${Math.round(falhas * 100)}% dos cartões.`,
      acao: 'Vamos revisar em intervalos menores por um tempo e usar as palavras em frases suas, que fixam melhor que tradução solta.',
      evidencia: longas.length, confianca: conf(longas.length * 2), status: 'hipotese', foco: 'revisao' });
  }
  const descartes = new Set(descartadas);
  return out.filter(h => !descartes.has(h.id));
}

// Dificuldade-alvo dos exercícios (1 a 3), pelo nível estimado e pelos acertos recentes.
function dificuldadeAlvo(nivel, tentativas) {
  const i = Math.max(0, NIVEIS.indexOf(nivel || 'A1'));
  let alvo = i <= 0 ? 1 : i === 1 ? 2 : 3;
  const ultimas = tentativas.filter(t => !t.contestada && !t.dica).slice(-25);
  const t = taxa(ultimas);
  if (ultimas.length >= 15 && t !== null) { if (t >= 0.88) alvo++; else if (t <= 0.55) alvo--; }
  return Math.max(1, Math.min(3, alvo));
}

module.exports = { dominioPorTag, porHabilidade, hipoteses, dificuldadeAlvo };
