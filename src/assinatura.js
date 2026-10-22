'use strict';
// Planos, teste grátis e limites de uso de IA. Regras de transparência:
// - teste de 30 dias SEM cartão; ao fim, nada é cobrado sozinho: a conta passa para o acesso livre e os dados ficam;
// - cancelamento em 1 clique, sem multa; o acesso pago vai até o fim do período já pago;
// - limites de IA visíveis; ao atingir, o app segue no modo sem IA (não bloqueia o estudo).
const { somarDias } = require('./motor/util');
const { CATALOGO, POR_PLANO } = require('./catalogo-planos');

const PLANOS = {
  mensal: { nome: 'Mensal', precoCentavos: 2990, periodoDias: 30, rotulo: 'R$ 29,90 por mês' },
  anual: { nome: 'Anual', precoCentavos: 23880, periodoDias: 365, rotulo: 'R$ 238,80 por ano', equivalente: 'equivale a R$ 19,90 por mês', desconto: '33% de desconto' },
};

for(const p of CATALOGO.filter(p=>p.mensal)) for(const periodo of ['mensal','anual']){
 const preco=p[periodo]; PLANOS[p.id+'_'+periodo]={nome:p.nome+' '+(periodo==='mensal'?'mensal':'anual'),categoria:p.id,precoCentavos:preco,periodoDias:periodo==='mensal'?30:365,rotulo:(preco/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+(periodo==='mensal'?' por mês':' por ano')};
}
const LIMITES = {
  teste: { conversa: 15, avaliacao: 4, tutor: 10, material: 1, licao: 4, podcast: 1, estudo: 2, treino: 4 },
  pago: { conversa: 60, avaliacao: 10, tutor: 30, material: 2, licao: 15, podcast: 2, estudo: 8, treino: 15 },
  livre: { conversa: 0, avaliacao: 0, tutor: 0, material: 0, licao: 0, podcast: 0, estudo: 0, treino: 0 },
};
const NOMES_USO = { conversa: 'mensagens de conversa com IA', avaliacao: 'correções detalhadas com IA', tutor: 'perguntas ao tutor', material: 'materiais seus processados com IA', licao: 'lições com exercícios feitos para a sua situação', podcast: 'episódios da Rádio Tuiuiú escritos pela IA', estudo: 'assuntos do estudo sob medida escritos pela IA', treino: 'treinos com frases novas escritas pela IA' };

const INCLUI = {
  completo: ['Plano personalizado pelo seu objetivo, idade e nível', 'Lições guiadas de 5 minutos e aulas de 10 a 20 minutos', 'Biblioteca de vocabulário e leitura por público e nível', 'Flashcards com repetição espaçada e áudio', 'Conversas que viram a aula do dia seguinte', 'Correção de escrita', 'Estudo com seus próprios materiais', 'Painel de progresso com o que você já demonstrou'],
  livre: ['Revisão dos seus flashcards', 'Painel de progresso e histórico', 'Exportar e apagar seus dados', 'Voltar ao plano completo quando quiser, de onde parou'],
};

function novaAssinatura(hojeISO) {
  return { status: 'teste', plano: null, teste_ate: somarDias(hojeISO, 30), periodo_ate: null, cancelada_em: null, historico: [{ em: hojeISO, evento: 'teste iniciado (30 dias, sem cartão)' }] };
}

// Estado efetivo hoje (sem gravar): resolve vencimentos.
function estado(a, hojeISO) {
  if (!a) return { status: 'livre', acesso: 'livre', diasRestantes: 0 };
  // Concessão administrativa registrada no servidor; nunca representa uma cobrança.
  if (a.cortesia?.categoria === 'completo') return { status: 'cortesia', acesso: 'completo', categoria: 'completo', renovaAuto: false };
  if (a.status === 'teste') {
    const restam = Math.round((new Date(a.teste_ate) - new Date(hojeISO)) / 864e5);
    if (restam >= 0) return { status: 'teste', acesso: 'completo', diasRestantes: restam, ate: a.teste_ate };
    return { status: 'livre', acesso: 'livre', motivo: 'teste_terminou', diasRestantes: 0 };
  }
  if (a.status === 'ativa' || a.status === 'cancelada') {
    if (a.periodo_ate && a.periodo_ate >= hojeISO) return { status: a.status, acesso: 'completo', categoria: PLANOS[a.plano]?.categoria || 'completo', plano: a.plano, ate: a.periodo_ate, renovaAuto: a.status === 'ativa' };
    return { status: 'livre', acesso: 'livre', motivo: a.status === 'cancelada' ? 'cancelada' : 'periodo_terminou', diasRestantes: 0 };
  }
  return { status: 'livre', acesso: 'livre', diasRestantes: 0 };
}

function limitesDe(est) {
 if(est.status==='teste')return LIMITES.teste;
 if(est.acesso!=='completo'||est.categoria==='basic')return LIMITES.livre;
 const fator=est.categoria==='familia'?2:est.categoria==='turma'?6:1;
 return Object.fromEntries(Object.entries(LIMITES.pago).map(([k,v])=>[k,k==='material'?(est.categoria==='turma'?12:v*fator):v*fator]));
}

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
