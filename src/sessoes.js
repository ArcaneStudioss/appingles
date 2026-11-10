'use strict';
const { MISSOES, POR_ID, TODOS_EXERCICIOS } = require('./conteudo/missoes');
const { UNIDADES, BANCO_BIBLIOTECA } = require('./conteudo/biblioteca');
const { publicoDe } = require('./motor/publico');
const { missaoAtual, paraCliente } = require('./motor/licao');
const { corrigirExercicio } = require('./motor/correcao');
const { licoesPorMissao } = require('./motor/plano');
const { ErroHttp } = require('./http');
const { montarItens, segundaChance } = require('./motor/sessao-adaptativa');
const BANCO = { ...TODOS_EXERCICIOS, ...BANCO_BIBLIOTECA };

function montarSessao({ perfil, plano, competencias, tentativas, minutos, nivel, agora = Date.now() }) {
  const publico = publicoDe(perfil).id, atual = plano && missaoAtual(plano, competencias);
  let missao = POR_ID[atual?.id] || UNIDADES.find(u => u.faixa === publico && u.nivel === (nivel || 'A1')) || MISSOES[0];
  const totalPartes = licoesPorMissao(missao, nivel);
  if(missao.id.startsWith('zero-')) {
    const guiada=require('./motor/licao-guiada').montarGuiada({perfil,nivel,competencias,tentativas,hojeISO:new Date().toISOString().slice(0,10)},{id:missao.id});
    missao={...missao,exemplos:guiada.blocos[0].exemplos,vocab:guiada.blocos[0].vocab,explicacao:guiada.blocos[0].texto,exercicios:guiada.blocos.flatMap(b=>b.exercicios||[]).filter(e=>e.tipo!=='pares')};
  }
  // a escolha das questões acompanha o aluno: ritmo recente, modo mais fraco, erros a firmar e apoios (ver sessao-adaptativa)
  const { itens, adaptacao, porque } = montarItens({ missao, banco: BANCO, tentativas, minutos, nivel: nivel || 'A1', agora });
  return { minutos, missao: missao.id, titulo: missao.titulo, podeFazer: missao.podeFazer, publico, adaptacao, porque,
    vocab: (missao.vocab || []).slice(0, minutos === 5 ? 2 : 3),
    explicacao: typeof missao.explicacao === 'string' ? missao.explicacao : missao.explicacao?.texto || '',
    itens, nivel, totalPartes,
    exemplo: missao.exemplos?.[0] || null };
}

function registrar({ sequenciaDe, db, rota, q, V, lerJson, perfilDe, planoDe, nivelamentoDe, competenciasDe, tentativasDe, hojeDe, agoraISO, exigirAcessoCompleto, registrarTentativa, somarMinutos, social, transacao, conquistar }) {
  const ler = uid => q('SELECT * FROM sessoes_guiadas WHERE user_id=? AND data=?').get(uid, hojeDe(uid));
  const dados = r => lerJson(r.dados, {});
  const cliente = r => {
    if (!r) return { sessao: null };
    const d = dados(r), publico = paraCliente({ blocos: [{ exercicios: d.itens }] }, 'sessao:' + r.id).blocos[0].exercicios
      .map((e, i) => ({ ...e, etapa: d.itens[i].etapa || 'Praticar', ...(d.itens[i].segundaChance ? { segundaChance: true, origemId: d.itens[i].origemId } : {}), ...(d.itens[i].apoioBanco ? { apoioBanco: true } : {}) }));
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
      // a segunda chance vem depois de ver a explicação: é prática com apoio, não acerto independente
      const dica = !!ex.ensino || !!ex.segundaChance || !!lerJson(r.apoios, {})[itemId] || ctx.corpo.dica === true || ctx.corpo.revelar === true;
      const av = corrigirExercicio(ex, resposta);
      respostas[itemId] = { ...av, resposta, dica, ajuda:ctx.corpo.revelar===true, textoAudio: ex.audio || null, tempoMs: Math.max(0,Math.min(600000,Number(ctx.corpo.tempoMs)||0)) };
      // escolher no banco de palavras é reconhecer, não escrever sozinho: o retrato por modo não infla a escrita
      registrarTentativa(uid, { item_id: ex.origemId || ex.id, missao: d.missao, habilidade: ex.habilidade, tag: ex.tag, formato: ['escolha', 'leitura', 'escuta'].includes(ex.tipo) || ex.apoioBanco ? 'reconhecimento' : 'producao', modalidade: ['escuta', 'ditado'].includes(ex.tipo) ? 'audio' : 'texto', correto: av.correto, dica, origem: 'sessao', contexto: d.missao, resposta, tempo_ms: ctx.corpo.tempoMs });
      const outra = segundaChance(d, ex, av);
      if (outra) { d.itens.push(outra); q('UPDATE sessoes_guiadas SET dados=? WHERE id=?').run(JSON.stringify(d), r.id); respostas[itemId].novaChance = true; }
      q('UPDATE sessoes_guiadas SET respondidos=? WHERE id=?').run(JSON.stringify(respostas), r.id);
      return outra ? { ...respostas[itemId], itens: cliente(ler(uid)).sessao.itens } : respostas[itemId];
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
      // conta por questão original: acertar na segunda chance também vale como questão firmada na prática
      const originais = d.itens.filter(e => !e.segundaChance);
      const recuperadas = originais.filter(e => !respostas[e.id].correto && d.itens.some(x => x.origemId === e.id && respostas[x.id]?.correto)).length;
      const certas = originais.filter(e => respostas[e.id].correto).length + recuperadas;
      // Praticar avança a preparação; demonstrar domínio continua exigindo a tarefa independente da missão.
      if (certas >= Math.ceil(originais.length * .6) && POR_ID[d.missao]) q("INSERT INTO competencias(user_id,missao,status,partes) VALUES(?,?,'praticando',1) ON CONFLICT(user_id,missao) DO UPDATE SET partes=MIN(?,partes+1) WHERE status NOT IN ('demonstrado','retido')").run(uid, d.missao, d.totalPartes);
      return { ok: true, certas, recuperadas, total: originais.length, proximo: '#/licao', sequencia: sequenciaDe(uid, hojeDe(uid)), mensagem: 'Seu treino ficou salvo. A tarefa da missão verifica o que você consegue fazer sem ajuda.' };
    });
  });
}
module.exports = { registrar, montarSessao };
