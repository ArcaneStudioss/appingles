'use strict';
// Planos, teste grátis e limites de uso. Regras de transparência:
// - teste de 30 dias do plano COMPLETO, SEM cartão; ao fim, nada é cobrado sozinho: a conta passa para o acesso livre e os dados ficam;
// - cancelamento em 1 clique, sem multa; o acesso pago vai até o fim do período já pago;
// - limites de IA visíveis; ao atingir, o app segue no modo sem IA (não bloqueia o estudo).
// Planos: Básico (sem IA, com limite diário), Completo (tudo com IA), Família (até 5 contas, cota de IA compartilhada),
// Turma (professor + até 20 alunos) e "sob consulta" (21+ alunos, escolas e empresas: falar com a gente).
const { somarDias } = require('./motor/util');

const PERIODOS = { mensal: { dias: 30, nome: 'mês' }, anual: { dias: 365, nome: 'ano' } };
const brl = c => 'R$ ' + (c / 100).toFixed(2).replace('.', ',');
const plano = (nome, mensal, anual, extra = {}) => ({
  nome, ...extra,
  precos: {
    mensal: { centavos: mensal, rotulo: `${brl(mensal)} por mês` },
    anual: { centavos: anual, rotulo: `${brl(anual)} por ano`, equivalente: `equivale a ${brl(Math.round(anual / 12))} por mês`, desconto: `${Math.round(100 * (1 - anual / (mensal * 12)))}% de desconto` },
  },
});
const PLANOS = {
  basico: plano('Básico', 990, 7990, { resumo: 'Para começar: 2 lições por dia, revisão e conversa por roteiro, sem IA, com limite diário.', pessoas: 1 }),
  completo: plano('Completo', 1990, 14990, { resumo: 'Tudo do app, com tutor de IA, conversas e correções.', pessoas: 1 }),
  familia: plano('Família', 2790, 24990, { resumo: 'O Completo para até 5 pessoas da casa, cada uma com a sua conta e o seu progresso. A cota de IA é dividida entre todos.', pessoas: 5 }),
  turma: plano('Turma', 9990, 89990, { resumo: 'Para professores: você e até 20 alunos com o app completo, atividades e painel da turma.', pessoas: 21, alunos: 20 }),
};
const MAX_FAMILIA = 5, MAX_ALUNOS_TURMA = 20;

// Compatibilidade: assinaturas antigas guardavam plano = 'mensal' | 'anual' (era o Completo).
function normalizar(plano, periodo) {
  if (plano === 'mensal' || plano === 'anual') return { plano: 'completo', periodo: plano };
  return { plano, periodo: periodo === 'anual' ? 'anual' : 'mensal' };
}

const LIMITES_COMPLETO = { conversa: 400, avaliacao: 60, tutor: 150, material: 10, licao: 31, podcast: 31, estudo: 80, treino: 62 };
const vezes = (l, n) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, Math.round(v * n)]));
const ZERO = { conversa: 0, avaliacao: 0, tutor: 0, material: 0, licao: 0, podcast: 0, estudo: 0, treino: 0 };
const LIMITES = {
  teste: { conversa: 150, avaliacao: 30, tutor: 60, material: 5, licao: 30, podcast: 30, estudo: 40, treino: 30 },
  pago: LIMITES_COMPLETO,
  familia: vezes(LIMITES_COMPLETO, 3),   // cota única, dividida entre as 5 contas (o custo de IA da casa fica em ~3 alunos intensos)
  turma: { conversa: 60, avaliacao: 10, tutor: 30, material: 2, licao: 15, podcast: 15, estudo: 20, treino: 15 },   // por aluno
  basico: ZERO,
  livre: ZERO,
};
// Limite por dia do Básico (o dia é o do fuso do aluno). Recurso ausente aqui = sem limite diário.
const LIMITES_DIA = { basico: { revisao: 20, conversa: 1, tutor: 3 }, livre: { revisao: 10 } };
// Lições por dia (a próxima só abre depois de concluir a anterior): Básico 2, Completo e os planos de grupo 3, Gratuito 0
const LICOES_DIA = { basico: 2, completo: 3, familia: 3, turma: 3 };
const licoesPorDia = est => (est.acesso === 'completo' && LICOES_DIA[est.nivel]) || 0;
const GRATUITO = { nome: 'Gratuito', resumo: 'Para continuar estudando sem pagar: revisão dos seus cartões (até 10 por dia), progresso e seus dados. Lições e IA ficam nos planos pagos.' };
const NOMES_DIA = { revisao: 'cartões de revisão', conversa: 'conversa por roteiro', tutor: 'perguntas ao tutor' };
// Recursos que o Básico não tem (o Completo, a Família e a Turma têm)
const SO_COMPLETO = ['estudo sob medida', 'respostas do treino da Rádio Tuiuiú'];

const NOMES_USO = { conversa: 'mensagens de conversa com IA', avaliacao: 'correções detalhadas com IA', tutor: 'perguntas ao tutor', material: 'materiais seus processados com IA', licao: 'lições com exercícios feitos para a sua situação', podcast: 'episódios da Rádio Tuiuiú escritos pela IA', estudo: 'assuntos do estudo sob medida escritos pela IA', treino: 'treinos com frases novas escritas pela IA' };

const INCLUI = {
  completo: ['Plano personalizado pelo seu objetivo e prazo', 'Lição diária de 10 a 20 minutos', 'Flashcards com repetição espaçada e áudio', 'Conversas que viram a aula do dia seguinte', 'Correção de escrita', 'Estudo com seus próprios materiais', 'Painel de progresso com o que você já demonstrou'],
  basico: ['Plano personalizado e 2 lições por dia', 'Até 20 cartões de revisão por dia', '1 conversa por roteiro por dia (sem IA)', '1 treino focado por dia e 3 perguntas ao tutor (catálogo)', 'Painel de progresso'],
  livre: ['Revisão dos seus flashcards (até 10 por dia)', 'Painel de progresso e histórico', 'Exportar e apagar seus dados', 'Voltar ao plano completo quando quiser, de onde parou'],
};

function novaAssinatura(hojeISO) {
  return { status: 'teste', plano: null, teste_ate: somarDias(hojeISO, 30), periodo_ate: null, cancelada_em: null, historico: [{ em: hojeISO, evento: 'teste do plano Completo iniciado (30 dias, sem cartão)' }] };
}

// Estado efetivo hoje (sem gravar): resolve vencimentos. `nivel` diz o que a pessoa tem: completo | basico | familia | turma | livre.
function estado(a, hojeISO) {
  if (!a) return { status: 'livre', acesso: 'livre', nivel: 'livre', diasRestantes: 0 };
  if (a.status === 'teste') {
    const restam = Math.round((new Date(a.teste_ate) - new Date(hojeISO)) / 864e5);
    if (restam >= 0) return { status: 'teste', acesso: 'completo', nivel: 'completo', diasRestantes: restam, ate: a.teste_ate };
    return { status: 'livre', acesso: 'livre', nivel: 'livre', motivo: 'teste_terminou', diasRestantes: 0 };
  }
  if (a.status === 'ativa' || a.status === 'cancelada') {
    if (a.periodo_ate && a.periodo_ate >= hojeISO) {
      const n = normalizar(a.plano, a.periodo);
      return { status: a.status, acesso: 'completo', nivel: PLANOS[n.plano] ? n.plano : 'completo', plano: n.plano, periodo: n.periodo, ate: a.periodo_ate, renovaAuto: a.status === 'ativa' };
    }
    return { status: 'livre', acesso: 'livre', nivel: 'livre', motivo: a.status === 'cancelada' ? 'cancelada' : 'periodo_terminou', diasRestantes: 0 };
  }
  return { status: 'livre', acesso: 'livre', nivel: 'livre', diasRestantes: 0 };
}

function limitesDe(est) {
  if (est.status === 'teste') return LIMITES.teste;
  if (est.acesso !== 'completo') return LIMITES.livre;
  return { basico: LIMITES.basico, familia: LIMITES.familia, turma: LIMITES.turma }[est.nivel] || LIMITES.pago;
}
const limitesDiaDe = est => LIMITES_DIA[est.nivel] || null;

function assinar(a, plano, hojeISO, periodo = 'mensal') {
  const n = normalizar(plano, periodo), p = PLANOS[n.plano];
  if (!p) throw new Error('plano inválido');
  const base = a.periodo_ate && a.periodo_ate >= hojeISO ? a.periodo_ate : hojeISO;
  // se ainda está no teste, o período pago só começa quando o teste acaba (ninguém perde dias grátis)
  const inicio = a.status === 'teste' && a.teste_ate >= hojeISO ? a.teste_ate : base;
  return { ...a, status: 'ativa', plano: n.plano, periodo: n.periodo, periodo_ate: somarDias(inicio, PERIODOS[n.periodo].dias), cancelada_em: null, historico: [...(a.historico || []), { em: hojeISO, evento: `assinou ${p.nome} (${p.precos[n.periodo].rotulo})` }] };
}

function cancelar(a, hojeISO) {
  if (a.status !== 'ativa') return a;
  return { ...a, status: 'cancelada', cancelada_em: hojeISO, historico: [...(a.historico || []), { em: hojeISO, evento: `cancelou; acesso continua até ${a.periodo_ate}` }] };
}

// Traduz uma assinatura da Stripe para o nosso estado. O acesso vai até o fim do período pago (+1 dia de folga,
// para o atraso do webhook de renovação não derrubar o acesso). Pagamento falho (past_due) mantém o acesso até o fim do período.
const diaDe = epoch => new Date(epoch * 1000).toISOString().slice(0, 10);
function aplicarStripe(a, sub, hojeISO) {
  const fim = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  const m = sub.metadata || {};
  const n = PLANOS[m.plano] ? { plano: m.plano, periodo: m.periodo === 'anual' ? 'anual' : 'mensal' } : normalizar(a.plano, a.periodo);
  const vivo = ['active', 'trialing', 'past_due'].includes(sub.status);
  const cancelando = sub.cancel_at_period_end === true || !!sub.cancel_at;
  const periodo_ate = fim ? somarDias(diaDe(fim), 1) : a.periodo_ate;
  const status = vivo && !cancelando ? 'ativa' : 'cancelada';
  const mudou = a.status !== status || a.periodo_ate !== periodo_ate || a.plano !== n.plano || a.periodo !== n.periodo;
  return { ...a, status, plano: n.plano, periodo: n.periodo, periodo_ate, cancelada_em: status === 'cancelada' ? (a.cancelada_em || hojeISO) : null,
    stripe: { cliente: sub.customer || a.stripe?.cliente || null, assinatura: sub.id || a.stripe?.assinatura || null },
    historico: mudou ? [...(a.historico || []), { em: hojeISO, evento: `Stripe: ${sub.status}${cancelando ? ' (cancelamento no fim do período)' : ''}, ${n.plano} ${n.periodo}, acesso até ${periodo_ate}` }] : a.historico };
}

module.exports = { aplicarStripe, normalizar, LICOES_DIA, licoesPorDia, GRATUITO, PLANOS, PERIODOS, MAX_FAMILIA, MAX_ALUNOS_TURMA, LIMITES, LIMITES_DIA, NOMES_DIA, SO_COMPLETO, NOMES_USO, INCLUI, novaAssinatura, estado, limitesDe, limitesDiaDe, assinar, cancelar };
