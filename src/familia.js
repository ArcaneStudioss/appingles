'use strict';
// Plano Família: quem paga (dono) convida até 4 pessoas por código. Cada pessoa mantém a própria conta e o próprio progresso;
// o dono só vê quem entrou (nome), nunca o estudo de ninguém. A pessoa pode sair quando quiser.
const auth = require('./auth');
const { ErroHttp } = require('./http');
const T = require('./motor/turmas');
const assin = require('./assinatura');

function registrar({ db, rota, q, V, transacao, agoraISO, hojeDe, assinaturaDe, salvarAssinatura }) {
  const limEntrar = auth.limitadorBanco(db, 'familia-entrar', { janelaMs: 15 * 60e3, max: 15 });
  const estadoDe = (uid, h) => assin.estado(assinaturaDe(uid), h);
  const donoAtivo = (uid, h) => { const e = estadoDe(uid, h); return e.acesso === 'completo' && e.nivel === 'familia'; };
  const membrosDe = dono => q('SELECT u.id, u.nome, fm.entrou_em FROM familia_membros fm JOIN usuarios u ON u.id = fm.user_id WHERE fm.dono_id = ? ORDER BY fm.entrou_em').all(dono);

  rota('GET', '/familia', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const meu = q('SELECT dono_id, u.nome AS dono_nome FROM familia_membros fm JOIN usuarios u ON u.id = fm.dono_id WHERE fm.user_id = ?').get(uid);
    if (meu) return { papel: 'membro', dono: meu.dono_nome };
    if (!donoAtivo(uid, h)) return { papel: null };
    return { papel: 'dono', codigo: assinaturaDe(uid)?.familia_codigo || null, membros: membrosDe(uid), vagas: assin.MAX_FAMILIA - 1 - membrosDe(uid).length };
  });

  rota('POST', '/familia/codigo', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    if (!donoAtivo(uid, h)) throw new ErroHttp(409, 'Só quem assina o plano Família pode convidar pessoas.');
    const codigo = T.novoCodigo(c => !!q("SELECT 1 FROM assinaturas WHERE json_extract(dados, '$.familia_codigo') = ?").get(c));
    salvarAssinatura(uid, { ...assinaturaDe(uid), familia_codigo: codigo });
    return { ok: true, codigo };
  });

  rota('POST', '/familia/entrar', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    if (!limEntrar.tentar('u' + uid) || !limEntrar.tentar('ip' + ctx.ip)) throw new ErroHttp(429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.');
    const codigo = T.normalizarCodigo(ctx.corpo.codigo);
    const dono = T.codigoValido(codigo) ? q("SELECT user_id FROM assinaturas WHERE json_extract(dados, '$.familia_codigo') = ?").get(codigo) : null;
    if (!dono || !donoAtivo(dono.user_id, h)) throw new ErroHttp(404, 'Não achei uma família com esse código. Confira com quem assina.');
    if (dono.user_id === uid) throw new ErroHttp(409, 'Este plano é seu: você é quem paga.');
    if (q('SELECT 1 FROM familia_membros WHERE user_id = ?').get(uid)) throw new ErroHttp(409, 'Você já está em uma família. Saia dela antes de entrar em outra.');
    if (donoAtivo(uid, h)) throw new ErroHttp(409, 'Você já assina o plano Família.');
    transacao(db, () => {
      if (q('SELECT COUNT(*) n FROM familia_membros WHERE dono_id = ?').get(dono.user_id).n >= assin.MAX_FAMILIA - 1) throw new ErroHttp(409, 'Esta família já tem 5 pessoas.');
      q('INSERT INTO familia_membros (dono_id, user_id, entrou_em) VALUES (?, ?, ?)').run(dono.user_id, uid, agoraISO());
    });
    return { ok: true };
  });

  rota('POST', '/familia/sair', (ctx) => {
    const r = q('DELETE FROM familia_membros WHERE user_id = ?').run(ctx.u.id);
    if (!r.changes) throw new ErroHttp(404, 'Você não está em uma família.');
    return { ok: true };
  });

  rota('DELETE', '/familia/membros/:uid', (ctx) => {
    const r = q('DELETE FROM familia_membros WHERE dono_id = ? AND user_id = ?').run(ctx.u.id, V.id(ctx.params.uid));
    if (!r.changes) throw new ErroHttp(404, 'Pessoa não encontrada na sua família.');
    return { ok: true };
  });
}

module.exports = { registrar };
