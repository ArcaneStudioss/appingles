'use strict';
const { UNIDADES, POR_UNIDADE } = require('./conteudo/biblioteca');
const { MISSOES } = require('./conteudo/missoes');
const { publicoDe } = require('./motor/publico');
const { paraCliente } = require('./motor/licao');
const { corrigirExercicio } = require('./motor/correcao');
const { ErroHttp } = require('./http');
const cultura = require('./conteudo/brasil-mundo');
const termosDe = u => (u.cultura || []).flatMap(id => cultura.POR_EXPRESSAO[id].aliases);

function registrar({ rota, q, V, lerJson, perfilDe, exigirAcessoCompleto, hojeDe, agoraISO, registrarTentativa, criarCartao, somarMinutos, transacao, db }) {
  const acessar = (id, uid) => {
    const u = POR_UNIDADE[id], p = perfilDe(uid);
    if (!u || (p.papel !== 'professor' && u.faixa !== publicoDe(p).id)) throw new ErroHttp(404, 'Aula não encontrada para o seu perfil.');
    exigirAcessoCompleto(uid, hojeDe(uid));
    return u;
  };
  rota('GET', '/dicionario', () => ({ palavras: Object.fromEntries([...MISSOES, ...UNIDADES].flatMap(u => u.vocab).filter(v => /^[A-Za-z]+$/.test(v.en)).map(v => [v.en.toLowerCase(), v.pt])), expressoes: cultura.dicionarioCultural() }), { publica: true });
  rota('GET', '/brasil-mundo', ctx => {
    const p = perfilDe(ctx.u.id), publico = publicoDe(p), professor = p.papel === 'professor';
    return { publico, regioes: cultura.REGIOES, categorias: cultura.CATEGORIAS, contextos: cultura.CONTEXTOS, revisadoEm: cultura.revisadoEm,
      expressoes: cultura.EXPRESSOES.filter(e => professor || e.faixas.includes(publico.id)),
      capitulos: UNIDADES.filter(u => u.colecao === 'brasil-mundo' && (professor || u.faixa === publico.id)).map(u => ({ id: u.id, titulo: u.titulo, faixa: u.faixa, nivel: u.nivel, cultura: u.cultura })) };
  });
  rota('GET', '/biblioteca', ctx => {
    const uid = ctx.u.id, p = perfilDe(uid), publico = publicoDe(p);
    const progresso = new Map(q('SELECT * FROM biblioteca_progressos WHERE user_id = ?').all(uid).map(r => [r.unidade_id, r]));
    return { publico, unidades: UNIDADES.filter(u => p.papel === 'professor' || u.faixa === publico.id).map(u => {
      const r = progresso.get(u.id), feitas = Object.keys(lerJson(r?.respondidos, {})).length;
      return { id: u.id, titulo: u.titulo, tema: u.tema, faixa: u.faixa, nivel: u.nivel, imagem: u.imagem, colecao: u.colecao || null, termos: termosDe(u), palavras: u.vocab.length, total: u.exercicios.length, feitas, concluida: !!r?.concluido_em };
    }) };
  });
  rota('GET', '/biblioteca/:id', ctx => {
    const uid = ctx.u.id, u = acessar(ctx.params.id, uid);
    const r = q('SELECT * FROM biblioteca_progressos WHERE user_id = ? AND unidade_id = ?').get(uid, u.id);
    const itens = paraCliente({ blocos: [{ exercicios: u.exercicios }] }, `biblioteca:${uid}:${u.id}`).blocos[0].exercicios;
    return { unidade: { id: u.id, titulo: u.titulo, tema: u.tema, faixa: u.faixa, nivel: u.nivel, imagem: u.imagem, colecao: u.colecao || null, cultura: (u.cultura || []).map(id => ({ id, titulo: cultura.POR_EXPRESSAO[id].titulo })), explicacao: u.explicacao, texto: u.texto, traducao: u.traducao, vocab: u.vocab }, itens, respondidos: lerJson(r?.respondidos, {}), concluida: !!r?.concluido_em };
  });
  rota('POST', '/biblioteca/:id/responder', ctx => {
    const uid = ctx.u.id, h = hojeDe(uid), u = acessar(ctx.params.id, uid), b = ctx.corpo;
    const itemId = V.str(b.itemId, 100, { min: 1, campo: 'Questão' });
    const ex = u.exercicios.find(e => e.id === itemId);
    if (!ex) throw new ErroHttp(404, 'Questão não encontrada.');
    const resposta = b.revelar === true ? '' : V.str(b.resposta, 500, { campo: 'Resposta' });
    const row = q('SELECT * FROM biblioteca_progressos WHERE user_id = ? AND unidade_id = ?').get(uid, u.id);
    const respondidos = lerJson(row?.respondidos, {});
    if (respondidos[itemId] && b.treinar !== true) return { ...respondidos[itemId], repetida: true };
    const r = corrigirExercicio(ex, resposta);
    if (respondidos[itemId]) return { ...r, pratica: true };
    if (b.revelar === true) r.ajuda = true;
    transacao(db, () => {
      respondidos[itemId] = { ...r, resposta };
      const concluiu = u.exercicios.every(e => respondidos[e.id]);
      q('INSERT INTO biblioteca_progressos (user_id, unidade_id, respondidos, concluido_em) VALUES (?,?,?,?) ON CONFLICT(user_id, unidade_id) DO UPDATE SET respondidos = excluded.respondidos, concluido_em = COALESCE(biblioteca_progressos.concluido_em, excluded.concluido_em)').run(uid, u.id, JSON.stringify(respondidos), concluiu ? agoraISO() : null);
      registrarTentativa(uid, { item_id: itemId, habilidade: ex.habilidade, formato: ex.tipo === 'lacuna' ? 'producao' : 'reconhecimento', modalidade: 'texto', correto: r.correto, dica: b.dica === true || b.revelar === true, tempo_ms: b.tempoMs, origem: 'biblioteca', contexto: u.id, resposta });
      if (concluiu && !row?.concluido_em) {
        for (const v of u.vocab) criarCartao(uid, { frente: v.en, verso: v.pt, tipo: 'expressao', origem: 'biblioteca:' + u.id }, h);
        somarMinutos(uid, h, 5);
      }
    });
    return r;
  });
}
module.exports = { registrar };
