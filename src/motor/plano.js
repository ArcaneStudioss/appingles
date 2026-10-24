'use strict';
// Plano de estudos: transforma objetivo + prazo + tempo disponível numa trilha de missões semana a semana.
// Regra: metas são de comunicação ("conseguir fazer X"), nunca "fluência em N meses".
const { OBJETIVOS } = require('../conteudo/objetivos');
const { POR_ID } = require('../conteudo/missoes');
const { NIVEIS } = require('../conteudo/nivelamento');
const { somarDias, diasEntre } = require('./util');
const { publicoDe } = require('./publico');
const { UNIDADES } = require('../conteudo/biblioteca');

function licoesPorMissao(missao, nivelAluno) {
  const diff = NIVEIS.indexOf(nivelAluno) - NIVEIS.indexOf(missao.nivel);
  if (diff >= 2) return 1;      // bem abaixo do nível do aluno: revisão rápida
  if (diff >= 1) return 2;
  return 3;                     // entender, praticar, usar
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
  let ids = [...new Set([...baseInicial, ...caminho])].filter(id => POR_ID[id]);
  const minutos = Math.max(5, Math.min(20, perfil.minutos_dia || 15));
  const custo = id => Math.ceil(licoesPorMissao(POR_ID[id], nivel) * (id.startsWith('zero-') ? 5 : 15) / minutos) + 1;       // +1 = reteste em outra situação
  let total = ids.reduce((s, id) => s + custo(id), 0);
  let cortadas = [];
  if (total > sessoesDisponiveis) {
    // primeiro mantém as essenciais (na ordem da trilha), depois completa com o que couber
    const essenciais = ids.filter(id => baseInicial.includes(id) || obj.essenciais.includes(id));
    const resto = ids.filter(id => !essenciais.includes(id));
    const escolhidas = []; let usado = 0;
    for (const id of [...essenciais, ...resto]) {
      if (baseInicial.includes(id) || usado + custo(id) <= sessoesDisponiveis || escolhidas.length < 2) { escolhidas.push(id); usado += custo(id); }
      else cortadas.push(id);
    }
    ids = ids.filter(id => escolhidas.includes(id));
    total = usado;
  }

  // distribui nas semanas
  const porSemana = Math.max(1, dias);
  let sessao = 0;
  const missoes = ids.map(id => {
    const m = POR_ID[id];
    const n = licoesPorMissao(m, nivel);
    const semana = Math.floor(sessao / porSemana) + 1;
    sessao += custo(id);
    return { id, titulo: m.titulo, podeFazer: m.podeFazer, licoes: n, semana, essencial: obj.essenciais.includes(id) };
  });

  const semanasUsadas = Math.max(1, Math.ceil(total / porSemana));
  const metas = missoes.filter(m => m.essencial).slice(0, 4).map(m => m.podeFazer);
  const avisos = [];
  if (baseInicial.length) avisos.push('Começamos com palavras e frases curtas antes de entrar no seu objetivo. A base vem primeiro, com áudio, tradução e ajuda.');
  if (publico.informado) avisos.push(`Temas e linguagem para ${publico.nome.toLowerCase()}. A idade muda o contexto; o nível de inglês define a dificuldade.`);
  if (cortadas.length) avisos.push(`Com o prazo e o tempo que você tem, priorizamos ${ids.length} missões essenciais. ${cortadas.length} ficaram para depois do prazo, e continuam disponíveis para uma próxima etapa.`);
  if (perfil.prazo && semanas <= 3) avisos.push('O prazo é curto. O plano foca no essencial para você chegar mais seguro; não é para "aprender tudo" até lá.');
  if (obj.aviso) avisos.push(obj.aviso);
  if ((perfil.minutos_dia | 0) <= 10) avisos.push('Com 10 minutos por dia o progresso é real, só que mais gradual. Se em alguns dias sobrar tempo, faça uma revisão extra.');

  return {
    objetivo: perfil.objetivo, objetivoNome: obj.nome, frase: obj.frase, publico: publico.id,
    nivelInicial: nivel, criadoEm: hojeISO, prazo: perfil.prazo || null,
    semanas: perfil.prazo ? semanas : semanasUsadas, semanasPrevistas: semanasUsadas,
    sessoesPorSemana: dias, minutosDia: perfil.minutos_dia | 0 || 15,
    missoes, metas, depoisDoPrazo: cortadas.map(id => ({ id, titulo: POR_ID[id].titulo })),
    metaRealista: `${perfil.prazo ? 'Até ' + perfil.prazo.split('-').reverse().join('/') : 'Em cerca de ' + semanasUsadas + ' semanas'}, a meta é você poder dizer com segurança:`,
    compromisso: 'É uma meta de comunicação, não uma promessa de fluência. O ritmo de cada pessoa é diferente, e o plano se ajusta conforme você pratica.',
    avisos,
    fimPrevisto: somarDias(hojeISO, semanasUsadas * 7),
  };
}

module.exports = { montarPlano, licoesPorMissao };
