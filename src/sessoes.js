'use strict';
const { MISSOES, POR_ID, TODOS_EXERCICIOS } = require('./conteudo/missoes');
const { UNIDADES, BANCO_BIBLIOTECA } = require('./conteudo/biblioteca');
const { publicoDe } = require('./motor/publico');
const { missaoAtual, paraCliente } = require('./motor/licao');
const { corrigirExercicio } = require('./motor/correcao');
const { licoesPorMissao } = require('./motor/plano');
const { ErroHttp } = require('./http');
const BANCO = { ...TODOS_EXERCICIOS, ...BANCO_BIBLIOTECA };

function montarSessao({ perfil, plano, competencias, tentativas, minutos, nivel }) {
  const publico = publicoDe(perfil).id, atual = plano && missaoAtual(plano, competencias);
  let missao = POR_ID[atual?.id] || UNIDADES.find(u => u.faixa === publico && u.nivel === (nivel || 'A1')) || MISSOES[0];
  const totalPartes = licoesPorMissao(missao, nivel);
  if(missao.id.startsWith('zero-')) {
    const guiada=require('./motor/licao-guiada').montarGuiada({perfil,nivel,competencias,tentativas,hojeISO:new Date().toISOString().slice(0,10)},{id:missao.id});
    missao={...missao,exemplos:guiada.blocos[0].exemplos,vocab:guiada.blocos[0].vocab,explicacao:guiada.blocos[0].texto,exercicios:guiada.blocos.flatMap(b=>b.exercicios||[]).filter(e=>e.tipo!=='pares')};
  }
  const vistos = new Set(tentativas.map(t => t.item_id));
  const quantidade = minutos === 5 ? 3 : minutos === 10 ? 6 : 9;
  const tipos = minutos === 5 ? ['escolha', 'leitura'] : nivel === 'A1' ? ['escolha', 'leitura', 'lacuna', 'ordenar'] : ['escolha', 'leitura', 'lacuna', 'ordenar', 'traduzir', 'escuta', 'ditado'];
  const validos = missao.exercicios.filter(e => tipos.includes(e.tipo));
  const novos = validos.slice().sort((a, b) => Number(vistos.has(a.id)) - Number(vistos.has(b.id)) || (a.dif || 1) - (b.dif || 1));
  const revisoes = minutos > 5 ? [...tentativas].reverse().filter(t => !t.correto && BANCO[t.item_id] && tipos.includes(BANCO[t.item_id].tipo) && !validos.some(e => e.id === t.item_id)).slice(0, 2).map(t => ({ ...BANCO[t.item_id], etapa: 'Relembrar' })) : [];
  const itens = [...new Map([...revisoes, ...novos.map(e => ({ ...e, etapa: 'Praticar' }))].map(e => [e.id, e])).values()].slice(0, quantidade);
  return { minutos, missao: missao.id, titulo: missao.titulo, podeFazer: missao.podeFazer, publico,
    vocab: (missao.vocab || []).slice(0, minutos === 5 ? 2 : 3),
    explicacao: typeof missao.explicacao === 'string' ? missao.explicacao : missao.explicacao?.texto || '',
    itens, nivel, totalPartes,
    exemplo: missao.exemplos?.[0] || null };
}

function registrar({ db, rota, q, V, lerJson, perfilDe, planoDe, nivelamentoDe, competenciasDe, tentativasDe, hojeDe, agoraISO, exigirAcessoCompleto, registrarTentativa, somarMinutos, social, transacao, conquistar }) {
  const ler = uid => q('SELECT * FROM sessoes_guiadas WHERE user_id=? AND data=?').get(uid, hojeDe(uid));
  const dados = r => lerJson(r.dados, {});
  const cliente = r => {
    if (!r) return { sessao: null };
    const d = dados(r), publico = paraCliente({ blocos: [{ exercicios: d.itens }] }, 'sessao:' + r.id).blocos[0].exercicios;
    return { sessao: { ...d, itens: publico, id: r.id, concluida: !!r.concluida_em, respondidos: lerJson(r.respondidos, {}), apoios: lerJson(r.apoios, {}) } };
  };
  const exigir = uid => { const r = ler(uid); if (!r) throw new ErroHttp(404, 'Escolha o tempo da sua sessão em Hoje.'); return r; };
  rota('GET', '/sessao', ctx => cliente(ler(ctx.u.id)));
  rota('POST', '/sessao', ctx => {
    const uid = ctx.u.id, minutos = V.um(ctx.corpo.minutos, [5, 10, 20], 'Tempo disponível');
    exigirAcessoCompleto(uid, hojeDe(uid));
    return transacao(db, () => {
      let r = ler(uid);
      if (r && (r.concluida_em || r.respondidos !== '{}')) return cliente(r);
      const d = montarSessao({ perfil: perfilDe(uid), plano: planoDe(uid), competencias: competenciasDe(uid), tentativas: tentativasDe(uid), minutos, nivel: nivelamentoDe(uid)?.nivel || 'A1' });
      if (!d.itens.length) throw new ErroHttp(409, 'Continue pela aula de hoje; ainda não há uma sessão curta para esta missão.');
      q("INSERT INTO sessoes_guiadas(user_id,data,minutos,dados,criada_em) VALUES(?,?,?,?,?) ON CONFLICT(user_id,data) DO UPDATE SET minutos=excluded.minutos,dados=excluded.dados").run(uid, hojeDe(uid), minutos, JSON.stringify(d), agoraISO());
      return cliente(ler(uid));
    });
  });
  rota('POST', '/sessao/ajuda', ctx => {
    const uid = ctx.u.id, itemId = V.str(ctx.corpo.itemId, 100, { min: 1 });
    return transacao(db, () => {
      const r = exigir(uid), d = dados(r), ex = d.itens.find(e => e.id === itemId);
      if (!ex) throw new ErroHttp(404, 'Questão não encontrada.');
      const apoios = lerJson(r.apoios, {}); apoios[itemId] = true;
      q('UPDATE sessoes_guiadas SET apoios=? WHERE id=?').run(JSON.stringify(apoios), r.id);
      return { dica: ex.dica || 'Compare com o exemplo e com as palavras ensinadas nesta sessão.', vocab: d.vocab, exemplo: d.exemplo, textoAudio: ex.audio || null, ajuda: true };
    });
  });
  rota('POST', '/sessao/responder', ctx => {
    const uid = ctx.u.id; exigirAcessoCompleto(uid, hojeDe(uid));
    return transacao(db, () => {
      const r = exigir(uid), d = dados(r), respostas = lerJson(r.respondidos, {}), itemId = V.str(ctx.corpo.itemId, 100, { min: 1 });
      const ex = d.itens.find(e => e.id === itemId);
      if (!ex) throw new ErroHttp(404, 'Questão não encontrada.');
      if(respostas[itemId] && ctx.corpo.treinar === true) return {...corrigirExercicio(ex,V.str(ctx.corpo.resposta,500,{campo:'Resposta'})),pratica:true};
      if (respostas[itemId]) return { ...respostas[itemId], repetida: true };
      if (r.concluida_em) throw new ErroHttp(409, 'Esta sessão já foi concluída.');
      const resposta = ctx.corpo.revelar === true ? '' : V.str(ctx.corpo.resposta, 500, { min: 1, campo: 'Resposta' });
      const dica = !!ex.ensino || !!lerJson(r.apoios, {})[itemId] || ctx.corpo.dica === true || ctx.corpo.revelar === true;
      const av = corrigirExercicio(ex, resposta);
      respostas[itemId] = { ...av, resposta, dica, ajuda:ctx.corpo.revelar===true, textoAudio: ex.audio || null, tempoMs: Math.max(0,Math.min(600000,Number(ctx.corpo.tempoMs)||0)) };
      registrarTentativa(uid, { item_id: ex.id, missao: d.missao, habilidade: ex.habilidade, tag: ex.tag, formato: ['escolha', 'leitura', 'escuta'].includes(ex.tipo) ? 'reconhecimento' : 'producao', modalidade: ['escuta', 'ditado'].includes(ex.tipo) ? 'audio' : 'texto', correto: av.correto, dica, origem: 'sessao', contexto: d.missao, resposta, tempo_ms: ctx.corpo.tempoMs });
      q('UPDATE sessoes_guiadas SET respondidos=? WHERE id=?').run(JSON.stringify(respostas), r.id);
      return respostas[itemId];
    });
  });
  rota('POST', '/sessao/concluir', ctx => {
    const uid = ctx.u.id;
    return transacao(db, () => {
      const r = exigir(uid), d = dados(r), respostas = lerJson(r.respondidos, {});
      if (r.concluida_em) return { ok: true, repetida: true };
      if (!d.itens.every(e => respostas[e.id])) throw new ErroHttp(409, 'Responda às atividades para concluir a sessão.');
      q('UPDATE sessoes_guiadas SET concluida_em=? WHERE id=?').run(agoraISO(), r.id);
      const identidade=q('SELECT identidade FROM social_identidades WHERE user_id=?').get(uid).identidade;
      const xp=social.creditoXp(uid, 25, 'sessao:' + identidade + ':' + r.data, 'Sessão guiada concluída');
      if(!xp)return {ok:true,repetida:true};
      somarMinutos(uid, hojeDe(uid), Math.min(d.minutos,Math.max(1,Object.values(respostas).reduce((n,r)=>n+(r.tempoMs||0),0)/60000)));
      conquistar(uid, 'primeira-sessao');
      const certas = d.itens.filter(e => respostas[e.id].correto).length;
      // Praticar avança a preparação; demonstrar domínio continua exigindo a tarefa independente da missão.
      if (certas >= Math.ceil(d.itens.length * .6) && POR_ID[d.missao]) q("INSERT INTO competencias(user_id,missao,status,partes) VALUES(?,?,'praticando',1) ON CONFLICT(user_id,missao) DO UPDATE SET partes=MIN(?,partes+1) WHERE status NOT IN ('demonstrado','retido')").run(uid, d.missao, d.totalPartes);
      return { ok: true, certas, total: d.itens.length, proximo: '#/licao', mensagem: 'Seu treino ficou salvo. A tarefa da missão verifica o que você consegue fazer sem ajuda.' };
    });
  });
}
module.exports = { registrar, montarSessao };
