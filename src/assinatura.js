'use strict';
// Planos, teste grátis e limites de uso de IA. Regras de transparência:
// - teste de 30 dias SEM cartão; ao fim, nada é cobrado sozinho: a conta passa para o acesso livre e os dados ficam;
// - cancelamento em 1 clique, sem multa; o acesso pago vai até o fim do período já pago;
// - limites de IA visíveis; ao atingir, o app segue no modo sem IA (não bloqueia o estudo).
const { somarDias } = require('./motor/util');

const PLANOS = {
  mensal: { nome: 'Mensal', precoCentavos: 2990, periodoDias: 30, rotulo: 'R$ 29,90 por mês' },
  anual: { nome: 'Anual', precoCentavos: 23880, periodoDias: 365, rotulo: 'R$ 238,80 por ano', equivalente: 'equivale a R$ 19,90 por mês', desconto: '33% de desconto' },
};

const LIMITES = {
  teste: { conversa: 150, avaliacao: 30, tutor: 60, material: 5, licao: 30, podcast: 30, estudo: 40, treino: 30 },
  pago: { conversa: 400, avaliacao: 60, tutor: 150, material: 10, licao: 31, podcast: 31, estudo: 80, treino: 62 },
  livre: { conversa: 0, avaliacao: 0, tutor: 0, material: 0, licao: 0, podcast: 0, estudo: 0, treino: 0 },
};
const NOMES_USO = { conversa: 'mensagens de conversa com IA', avaliacao: 'correções detalhadas com IA', tutor: 'perguntas ao tutor', material: 'materiais seus processados com IA', licao: 'lições com exercícios feitos para a sua situação', podcast: 'episódios da Rádio Tuiuiú escritos pela IA', estudo: 'assuntos do estudo sob medida escritos pela IA', treino: 'treinos com frases novas escritas pela IA' };

const INCLUI = {
  completo: ['Plano personalizado pelo seu objetivo e prazo', 'Lição diária de 10 a 20 minutos', 'Flashcards com repetição espaçada e áudio', 'Conversas que viram a aula do dia seguinte', 'Correção de escrita', 'Estudo com seus próprios materiais', 'Painel de progresso com o que você já demonstrou'],
  livre: ['Revisão dos seus flashcards', 'Painel de progresso e histórico', 'Exportar e apagar seus dados', 'Voltar ao plano completo quando quiser, de onde parou'],
};

function novaAssinatura(hojeISO) {
  return { status: 'teste', plano: null, teste_ate: somarDias(hojeISO, 30), periodo_ate: null, cancelada_em: null, historico: [{ em: hojeISO, evento: 'teste iniciado (30 dias, sem cartão)' }] };
}

// Estado efetivo hoje (sem gravar): resolve vencimentos.
function estado(a, hojeISO) {
  if (!a) return { status: 'livre', acesso: 'livre', diasRestantes: 0 };
  if (a.status === 'teste') {
    const restam = Math.round((new Date(a.teste_ate) - new Date(hojeISO)) / 864e5);
    if (restam >= 0) return { status: 'teste', acesso: 'completo', diasRestantes: restam, ate: a.teste_ate };
    return { status: 'livre', acesso: 'livre', motivo: 'teste_terminou', diasRestantes: 0 };
  }
  if (a.status === 'ativa' || a.status === 'cancelada') {
    if (a.periodo_ate && a.periodo_ate >= hojeISO) return { status: a.status, acesso: 'completo', plano: a.plano, ate: a.periodo_ate, renovaAuto: a.status === 'ativa' };
    return { status: 'livre', acesso: 'livre', motivo: a.status === 'cancelada' ? 'cancelada' : 'periodo_terminou', diasRestantes: 0 };
  }
  return { status: 'livre', acesso: 'livre', diasRestantes: 0 };
}

function limitesDe(est) { return est.status === 'teste' ? LIMITES.teste : est.acesso === 'completo' ? LIMITES.pago : LIMITES.livre; }

function assinar(a, plano, hojeISO) {
  const p = PLANOS[plano];
  if (!p) throw new Error('plano inválido');
  const base = a.periodo_ate && a.periodo_ate >= hojeISO ? a.periodo_ate : hojeISO;
  // se ainda está no teste, o período pago só começa quando o teste acaba (ninguém perde dias grátis)
  const inicio = a.status === 'teste' && a.teste_ate >= hojeISO ? a.teste_ate : base;
  return { ...a, status: 'ativa', plano, periodo_ate: somarDias(inicio, p.periodoDias), cancelada_em: null, historico: [...(a.historico || []), { em: hojeISO, evento: `assinou ${p.nome} (${p.rotulo})` }] };
}

function cancelar(a, hojeISO) {
  if (a.status !== 'ativa') return a;
  return { ...a, status: 'cancelada', cancelada_em: hojeISO, historico: [...(a.historico || []), { em: hojeISO, evento: `cancelou; acesso continua até ${a.periodo_ate}` }] };
}

module.exports = { PLANOS, LIMITES, NOMES_USO, INCLUI, novaAssinatura, estado, limitesDe, assinar, cancelar };
