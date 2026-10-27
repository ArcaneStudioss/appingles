'use strict';
// Ajuste de nível: o aluno pode subir ou descer na mão, e o app também propõe a mudança olhando os acertos recentes.
// Regra: pouco acerto = desce; acerto alto e sem muita dica = sobe; no meio = mantém e reforça o que errou.
// Só conta o que veio depois do último ajuste (ou do teste), para o nível novo ter chance de provar o seu valor.
const { NIVEIS } = require('../conteudo/nivelamento');

const JANELA = 30;            // últimas tentativas olhadas
const MINIMO = 20;            // abaixo disso ainda é cedo para opinar
const MIN_DIAS = 2;           // e precisa vir de pelo menos 2 dias de estudo
const ESPERA_DIAS = 5;        // depois de um ajuste, descanso antes do próximo automático
const DESCE_ATE = 0.5;
const SOBE_DE = 0.88;
const MAX_DICA_SOBE = 0.25;   // se sobe com muita dica, o acerto está sendo ajudado
const REFORCA_ATE = 0.75;

const indice = nivel => NIVEIS.indexOf(nivel);
const vizinho = (nivel, passo) => NIVEIS[indice(nivel) + passo] || null;

function avaliarNivel({ tentativas = [], nivel, ultimoAjusteEm = null, agora = new Date() }) {
  const desde = ultimoAjusteEm || '';
  const recentes = tentativas.filter(t => t.origem !== 'nivelamento' && !t.contestada && t.em > desde).slice(-JANELA);
  const base = { nivel, amostra: recentes.length, taxa: null, dicas: null, acao: 'manter', reforcar: false, motivo: null };
  if (recentes.length < MINIMO) return { ...base, motivo: 'poucos' };
  if (new Set(recentes.map(t => t.em.slice(0, 10))).size < MIN_DIAS) return { ...base, motivo: 'poucos-dias' };
  const taxa = recentes.reduce((s, t) => s + (t.correto ? (t.dica ? 0.7 : 1) : 0), 0) / recentes.length;
  const dicas = recentes.filter(t => t.dica).length / recentes.length;
  const r = { ...base, taxa: Math.round(taxa * 100) / 100, dicas: Math.round(dicas * 100) / 100 };
  if (ultimoAjusteEm && (agora - new Date(ultimoAjusteEm)) / 864e5 < ESPERA_DIAS) return { ...r, motivo: 'descanso' };
  if (taxa < DESCE_ATE && vizinho(nivel, -1)) return { ...r, acao: 'descer', motivo: 'dificil' };
  if (taxa >= SOBE_DE && dicas <= MAX_DICA_SOBE && vizinho(nivel, 1)) return { ...r, acao: 'subir', motivo: 'facil' };
  return { ...r, reforcar: taxa < REFORCA_ATE, motivo: 'no-ponto' };
}

module.exports = { avaliarNivel, vizinho, JANELA, MINIMO };
