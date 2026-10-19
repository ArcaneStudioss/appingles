'use strict';
// Plano de estudos: transforma objetivo + prazo + tempo disponível numa trilha de missões semana a semana.
// Regra: metas são de comunicação ("conseguir fazer X"), nunca "fluência em N meses".
const { OBJETIVOS } = require('../conteudo/objetivos');
const { POR_ID } = require('../conteudo/missoes');
const { MISSOES_BRASIL } = require('../conteudo/missoes-brasil');
const { NIVEIS } = require('../conteudo/nivelamento');
const { somarDias, diasEntre } = require('./util');

function licoesPorMissao(missao, nivelAluno) {
  const diff = NIVEIS.indexOf(nivelAluno) - NIVEIS.indexOf(missao.nivel);
  if (diff >= 2) return 1;      // bem abaixo do nível do aluno: revisão rápida
  if (diff >= 1) return 2;
  return 3;                     // entender, praticar, usar
}

// Álbum Brasil: uma missão temática a cada `cada` regulares; o que sobrar vai ao fim.
function intercalar(regulares, brasil, cada = 3) {
  const saida = []; let b = 0;
  regulares.forEach((id, i) => { saida.push(id); if ((i + 1) % cada === 0 && b < brasil.length) saida.push(brasil[b++]); });
  return saida.concat(brasil.slice(b));
}

function montarPlano(perfil, nivel, hojeISO) {
  const obj = OBJETIVOS[perfil.objetivo] || OBJETIVOS.conversa;
  const dias = Math.max(1, Math.min(7, perfil.dias_semana | 0 || 5));
  const prazoDias = perfil.prazo ? Math.max(7, diasEntre(hojeISO, perfil.prazo)) : 84;
  const semanas = Math.max(1, Math.ceil(prazoDias / 7));
  const sessoesDisponiveis = Math.floor(semanas * dias * 0.85);     // 15% de folga: a vida acontece

  // no "começar do zero" só entram as de nível A1; nenhuma é essencial (cortam-se antes das essenciais), mas sempre fica uma
  const brasil = MISSOES_BRASIL.filter(m => perfil.objetivo !== 'zero' || m.nivel === 'A1').map(m => m.id);
  let ids = intercalar(obj.missoes.filter(id => POR_ID[id]), brasil);
  let brasilForcada = false;
  const custo = id => licoesPorMissao(POR_ID[id], nivel) + 1;       // +1 = reteste em outra situação
  // sem prazo não há o que estourar: as do Brasil não entram no orçamento (o plano apenas fica mais longo); com prazo, contam como as outras
  const orcamento = id => (!perfil.prazo && brasil.includes(id)) ? 0 : custo(id);
  let total = ids.reduce((s, id) => s + orcamento(id), 0);
  let cortadas = [];
  if (total > sessoesDisponiveis) {
    // primeiro mantém as essenciais (na ordem da trilha), depois completa com o que couber
    const essenciais = ids.filter(id => obj.essenciais.includes(id));
    const resto = ids.filter(id => !obj.essenciais.includes(id));
    const escolhidas = []; let usado = 0;
    for (const id of [...essenciais, ...resto]) {
      if (usado + orcamento(id) <= sessoesDisponiveis || escolhidas.length < 2) { escolhidas.push(id); usado += orcamento(id); }
      else cortadas.push(id);
    }
    if (brasil.length && !escolhidas.some(id => brasil.includes(id))) {
      escolhidas.push(brasil[0]); cortadas = cortadas.filter(id => id !== brasil[0]); brasilForcada = true;
    }
    ids = ids.filter(id => escolhidas.includes(id));
  }
  total = ids.reduce((s, id) => s + custo(id), 0);     // tempo real do que ficou no plano

  // distribui nas semanas
  const porSemana = Math.max(1, dias);
  let sessao = 0, fimDaUltimaEssencial = 0;
  const missoes = ids.map(id => {
    const m = POR_ID[id];
    const n = licoesPorMissao(m, nivel);
    const semana = Math.floor(sessao / porSemana) + 1;
    sessao += n + 1;
    if (obj.essenciais.includes(id)) fimDaUltimaEssencial = sessao;
    return { id, titulo: m.titulo, podeFazer: m.podeFazer, licoes: n, semana, essencial: obj.essenciais.includes(id), brasil: brasil.includes(id) };
  });

  const semanasUsadas = Math.max(1, Math.ceil(total / porSemana));
  // sem prazo, a meta (as essenciais) vem antes das missões extras do Brasil: não prometa a meta só no fim delas
  const semanasDaMeta = Math.max(1, Math.ceil((fimDaUltimaEssencial || total) / porSemana));
  const metas = missoes.filter(m => m.essencial).slice(0, 4).map(m => m.podeFazer);
  const avisos = [];
  if (cortadas.length) avisos.push(`Com o prazo e o tempo que você tem, priorizamos ${ids.filter(id => !brasil.includes(id)).length} missões essenciais. ${cortadas.length} ficaram para depois do prazo, e o plano continua com elas.`);
  if (brasilForcada) avisos.push('Deixamos uma missão do Álbum Brasil no plano para você conhecer as figurinhas.');
  if (perfil.prazo && semanas <= 3) avisos.push('O prazo é curto. O plano foca no essencial para você chegar mais seguro; não é para "aprender tudo" até lá.');
  if (obj.aviso) avisos.push(obj.aviso);
  if ((perfil.minutos_dia | 0) <= 10) avisos.push('Com 10 minutos por dia o progresso é real, só que mais gradual. Se em alguns dias sobrar tempo, faça uma revisão extra.');

  return {
    objetivo: perfil.objetivo, objetivoNome: obj.nome, frase: obj.frase,
    nivelInicial: nivel, criadoEm: hojeISO, prazo: perfil.prazo || null,
    semanas: perfil.prazo ? semanas : semanasUsadas, semanasPrevistas: semanasUsadas,
    sessoesPorSemana: dias, minutosDia: perfil.minutos_dia | 0 || 15,
    missoes, metas,
    metaRealista: `${perfil.prazo ? 'Até ' + perfil.prazo.split('-').reverse().join('/') : 'Em cerca de ' + semanasDaMeta + ' semanas'}, a meta é você poder dizer com segurança:`,
    compromisso: 'É uma meta de comunicação, não uma promessa de fluência. O ritmo de cada pessoa é diferente, e o plano se ajusta conforme você pratica.',
    avisos,
    fimPrevisto: somarDias(hojeISO, semanasUsadas * 7),
  };
}

module.exports = { montarPlano, licoesPorMissao, intercalar };
