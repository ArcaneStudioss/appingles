'use strict';
// Plano de estudos: transforma objetivo + prazo + tempo disponível numa trilha de missões semana a semana.
// Regra: metas são de comunicação ("conseguir fazer X"), nunca "fluência em N meses".
const { OBJETIVOS } = require('../conteudo/objetivos');
const { POR_ID } = require('../conteudo/missoes');
const { MISSOES_BRASIL } = require('../conteudo/missoes-brasil');
const { NIVEIS } = require('../conteudo/nivelamento');
const { somarDias, diasEntre } = require('./util');
const { publicoDe } = require('./publico');
const { UNIDADES } = require('../conteudo/biblioteca');

function licoesPorMissao(missao, nivelAluno) {
  // Vocabulário em grupos de até três (uma aula por grupo), duas oficinas de frases e duas aulas de aplicação.
  // Antes eram pares, quatro oficinas e três aplicações: 9 a 10 aulas para cada missão, com a mesma frase repetida em dias seguidos.
  if (nivelAluno === 'A1') return Math.ceil(missao.vocab.length / 3) + 4;
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

  const baseInicial = nivel === 'A1' && perfil.objetivo !== 'zero' ? ['zero-sons', 'zero-oi-tchau', 'zero-nome-origem'] : [];
  const publico = publicoDe(perfil);
  const contextoDaIdade = UNIDADES.filter(u => u.faixa === publico.id).map(u => u.id);
  const caminho = publico.id === 'adulto' ? obj.missoes : perfil.objetivo === 'zero' ? [...obj.missoes, ...contextoDaIdade] : contextoDaIdade;
  // Álbum Brasil: nenhuma é essencial (cortam-se antes das essenciais), mas sempre fica uma; as trilhas "começar do zero" e "debate" (B1 a C1) são curadas e não recebem
  const brasil = MISSOES_BRASIL.filter(m => !['zero', 'debate'].includes(perfil.objetivo)).map(m => m.id);
  const regulares = [...new Set([...baseInicial, ...caminho])].filter(id => POR_ID[id]);
  let ids = [...baseInicial.filter(id => POR_ID[id]), ...intercalar(regulares.filter(id => !baseInicial.includes(id)), brasil)];
  let brasilForcada = false;
  const minutos = Math.max(5, Math.min(20, perfil.minutos_dia || 15));
  const custo = id => Math.ceil(licoesPorMissao(POR_ID[id], nivel) * (id.startsWith('zero-') ? 5 : 15) / minutos) + 1;       // +1 = reteste em outra situação
  let total = ids.reduce((s, id) => s + custo(id), 0);
  let cortadas = [];
  if (total > sessoesDisponiveis && (nivel !== 'A1' || perfil.prazo)) {
    // primeiro mantém as essenciais (na ordem da trilha), depois completa com o que couber
    const essenciais = ids.filter(id => baseInicial.includes(id) || obj.essenciais.includes(id));
    const resto = ids.filter(id => !essenciais.includes(id));
    const escolhidas = []; let usado = 0;
    for (const id of [...essenciais, ...resto]) {
      if (!perfil.prazo && brasil.includes(id)) escolhidas.push(id);     // sem prazo as do Brasil não entram no orçamento: o plano só fica mais longo
      else if (baseInicial.includes(id) || usado + custo(id) <= sessoesDisponiveis || escolhidas.length < 2) { escolhidas.push(id); usado += custo(id); }
      else cortadas.push(id);
    }
    if (brasil.length && !escolhidas.some(id => brasil.includes(id))) {
      escolhidas.push(brasil[0]); cortadas = cortadas.filter(id => id !== brasil[0]); brasilForcada = true;
    }
    ids = ids.filter(id => escolhidas.includes(id));
    total = ids.reduce((s, id) => s + custo(id), 0);     // tempo real do que ficou no plano
  }

  // distribui nas semanas
  const porSemana = Math.max(1, dias);
  let sessao = 0, fimDaUltimaEssencial = 0;
  const missoes = ids.map(id => {
    const m = POR_ID[id];
    const n = licoesPorMissao(m, nivel);
    const semana = Math.floor(sessao / porSemana) + 1;
    sessao += custo(id);
    if (obj.essenciais.includes(id)) fimDaUltimaEssencial = sessao;
    return { id, titulo: m.titulo, podeFazer: m.podeFazer, licoes: n, semana, essencial: obj.essenciais.includes(id), brasil: brasil.includes(id) };
  });

  const semanasUsadas = Math.max(1, Math.ceil(total / porSemana));
  // sem prazo, a meta (as essenciais) vem antes das missões extras do Brasil: não prometa a meta só no fim delas
  const semanasDaMeta = Math.max(1, Math.ceil((fimDaUltimaEssencial || total) / porSemana));
  const metas = missoes.filter(m => m.essencial).slice(0, 4).map(m => m.podeFazer);
  const avisos = [];
  if (baseInicial.length) avisos.push('Começamos com palavras e frases curtas antes de entrar no seu objetivo. A base vem primeiro, com áudio, tradução e ajuda.');
  if (publico.informado) avisos.push(`Temas e linguagem para ${publico.nome.toLowerCase()}. A idade muda o contexto; o nível de inglês define a dificuldade.`);
  if (cortadas.length) avisos.push(`Com o prazo e o tempo que você tem, priorizamos ${ids.filter(id => !brasil.includes(id)).length} missões essenciais. ${cortadas.length} ficaram para depois do prazo, e continuam disponíveis para uma próxima etapa.`);
  if (brasilForcada) avisos.push('Deixamos uma missão do Álbum Brasil no plano para você conhecer as figurinhas.');
  if (perfil.prazo && semanas <= 3) avisos.push('O prazo é curto. O plano foca no essencial para você chegar mais seguro; não é para "aprender tudo" até lá.');
  if (obj.aviso) avisos.push(obj.aviso);
  if ((perfil.minutos_dia | 0) <= 10) avisos.push('Com 10 minutos por dia o progresso é real, só que mais gradual. Se em alguns dias sobrar tempo, faça uma revisão extra.');

  return {
    objetivo: perfil.objetivo, objetivoNome: obj.nome, frase: obj.frase, publico: publico.id,
    nivelInicial: nivel, criadoEm: hojeISO, prazo: perfil.prazo || null,
    semanas: perfil.prazo ? semanas : semanasUsadas, semanasPrevistas: semanasUsadas,
    sessoesPorSemana: dias, minutosDia: perfil.minutos_dia | 0 || 15,
    missoes, metas, depoisDoPrazo: cortadas.map(id => ({ id, titulo: POR_ID[id].titulo })),
    metaRealista: `${perfil.prazo ? 'Até ' + perfil.prazo.split('-').reverse().join('/') : 'Em cerca de ' + semanasDaMeta + ' semanas'}, a meta é você poder dizer com segurança:`,
    compromisso: 'É uma meta de comunicação, não uma promessa de fluência. O ritmo de cada pessoa é diferente, e o plano se ajusta conforme você pratica.',
    avisos,
    fimPrevisto: somarDias(hojeISO, semanasUsadas * 7),
  };
}

module.exports = { montarPlano, licoesPorMissao, intercalar };
