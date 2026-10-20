'use strict';
// Correção sem IA: exercícios fechados (exata) e produção livre (rubrica de elementos + detectores de erros comuns).
// A correção de produção sem IA é limitada e o app diz isso ao aluno. Com IA, o tutor complementa (ver ia.js).
const { comparar, compararFala, normalizar, palavras } = require('./util');
const { detectar, POR_TAG } = require('../conteudo/dificuldades');
const { MISSOES } = require('../conteudo/missoes');

// frase em inglês -> tradução, tirada dos exemplos das missões (usada para explicar exercícios de escuta e ditado)
const TRADUCAO = new Map(MISSOES.flatMap(m => m.exemplos.map(e => [normalizar(e.en), e.pt])));

// Explicação padrão quando o exercício não traz a própria: mostra a frase completa, a tradução e as formas aceitas.
function explicacaoPadrao(ex) {
  const pt = en => { const t = TRADUCAO.get(normalizar(en)); return t ? ` (${t})` : ''; };
  switch (ex.tipo) {
    case 'escuta': case 'ditado': return ex.audio ? `Você ouviu: "${ex.audio}"${pt(ex.audio)}.` : null;
    case 'lacuna': return ex.frase && ex.frase.includes('___') ? `A frase completa é: "${ex.frase.replace('___', ex.resposta[0])}".` : null;
    case 'ordenar': return `A frase na ordem certa: "${ex.resposta}${ex.sufixo || ''}".`;
    case 'traduzir': { const outras = ex.aceitas.slice(1, 3); return outras.length ? `Também vale: ${outras.map(o => `"${o}"`).join(' ou ')}.` : null; }
    case 'fala': return `Para treinar: "${ex.frase}"${pt(ex.frase)}. Ouça o Tuiuiú e fale de novo.`;
    case 'detetive': return `A palavra errada era "${ex.tokens[ex.erro].replace(/[.,!?;:]+$/, '')}". O certo: ${ex.correcao}.`;
    case 'leitura': return ex.texto && ex.opcoes ? `A resposta está no texto: "${ex.opcoes[ex.resposta]}".` : null;
    default: return null;
  }
}

function respostaCerta(ex) {
  switch (ex.tipo) {
    case 'escolha': case 'escuta': case 'leitura': return ex.opcoes[ex.resposta];
    case 'ordenar': return ex.resposta + (ex.sufixo || '');
    case 'lacuna': case 'ditado': return ex.resposta[0];
    case 'traduzir': return ex.aceitas[0] + (ex.sufixo || '');
    case 'corrigir': return ex.aceitas[0];
    case 'fala': return ex.frase;
    case 'pares': return 'todos os pares';
    case 'detetive': return `${ex.tokens[ex.erro].replace(/[.,!?;:]+$/, '')} → ${ex.correcao}`;
    default: return '';
  }
}

// Corrige um exercício fechado. `resposta` é o texto escolhido/digitado (nunca o índice: as opções são embaralhadas).
function corrigirExercicio(ex, resposta) {
  let r;
  if (['escolha', 'escuta', 'leitura'].includes(ex.tipo)) {
    r = { correto: normalizar(resposta) === normalizar(ex.opcoes[ex.resposta]), quase: false };
  } else if (ex.tipo === 'ordenar') {
    r = comparar(resposta, [ex.resposta, ...(ex.aceitas || [])]);   // algumas frases têm outra ordem natural (ex.: "please" no meio ou no fim)
    if (r.quase) r = { correto: false, quase: false };          // ordem errada não é erro de digitação
  } else if (ex.tipo === 'lacuna' || ex.tipo === 'ditado') {
    r = comparar(resposta, ex.resposta);
  } else if (ex.tipo === 'fala') {
    r = compararFala(resposta, ex.frase);                      // flexível: o reconhecimento de voz erra palavras parecidas, some com artigos e troca homófonos
  } else if (ex.tipo === 'detetive') {
    r = { correto: /^\d{1,2}$/.test(String(resposta)) && Number(resposta) === ex.erro, quase: false };
  } else if (ex.tipo === 'pares') {
    const m = /^erros:(\d{1,2})$/.exec(String(resposta || ''));
    r = { correto: !!m && Number(m[1]) === 0, quase: !!m && Number(m[1]) === 1 };
    if (r.quase) r.correto = true;          // um tropeço em 5 pares ainda conta como acerto
  } else if (ex.tipo === 'traduzir' || ex.tipo === 'corrigir') {
    r = comparar(resposta, ex.aceitas);
  } else {
    r = { correto: false, quase: false };
  }
  const out = { correto: r.correto, quase: r.quase, esperado: respostaCerta(ex), explica: ex.explica || explicacaoPadrao(ex), achados: [] };
  // Em respostas digitadas erradas, procurar o erro típico para explicar o "porquê"
  if (!r.correto && ['lacuna', 'traduzir', 'ditado', 'corrigir'].includes(ex.tipo) && typeof resposta === 'string') {
    out.achados = detectar(resposta).filter(a => a.confianca !== 'baixa');
  }
  if (!r.correto && ex.tag && POR_TAG[ex.tag] && !ex.explica) out.explica = POR_TAG[ex.tag].regra;
  return out;
}

// Avalia uma produção livre (tarefa de missão ou reteste) com a rubrica da missão.
// demonstrado = cumpriu os elementos, tamanho mínimo, sem ajuda e sem erro de alta confiança nas dificuldades-chave.
function avaliarProducao(tarefa, texto, { usouAjuda = false } = {}) {
  const n = palavras(texto);
  const t = String(texto || '');
  const elementos = (tarefa.elementos || []).map(el => ({
    nome: el.nome,
    ok: el.padroes.some(p => new RegExp(p, 'im').test(t)),
  }));
  const achados = detectar(t);
  const errosChave = achados.filter(a => a.confianca === 'alta' && (tarefa.tagsChave || []).includes(a.tag));
  const cumpridos = elementos.filter(e => e.ok).length;
  const tamanhoOk = n >= (tarefa.minPalavras || 15);
  const pctElementos = elementos.length ? cumpridos / elementos.length : 1;
  const nota = Math.round(100 * (0.6 * pctElementos + 0.25 * Math.min(1, n / (tarefa.minPalavras || 15)) + 0.15 * (errosChave.length ? 0 : 1)));
  const demonstrado = !usouAjuda && tamanhoOk && pctElementos === 1 && errosChave.length === 0;
  const faltam = elementos.filter(e => !e.ok).map(e => e.nome);
  let comentario;
  if (demonstrado) comentario = 'Você cumpriu tudo o que a tarefa pedia, sem ajuda. Isso conta como aprendizado demonstrado.';
  else if (usouAjuda) comentario = 'Bom treino! Como você usou ajuda, isto conta como prática. Na próxima, tente sem as dicas para registrar como demonstrado.';
  else if (!tamanhoOk) comentario = `Está no caminho. Tente escrever um pouco mais (pelo menos ${tarefa.minPalavras} palavras; você escreveu ${n}).`;
  else if (faltam.length) comentario = `Faltou: ${faltam.join(', ')}.`;
  else comentario = 'A estrutura está boa. Revise os pontos marcados abaixo e tente de novo.';
  return { nota, palavras: n, elementos, achados, demonstrado, comentario, modo: 'regras' };
}

module.exports = { corrigirExercicio, avaliarProducao, respostaCerta };
