'use strict';
// Clerk confirma quem é a pessoa, no navegador. O servidor troca o token do Clerk (uma vez) pela sessão
// do próprio app: cookie HttpOnly e hash no SQLite, como no login local. IDs e progresso dos alunos não mudam.
const { ErroHttp, limparSessao } = require('./http');
const { transacao } = require('./db');
const auth = require('./auth');

const CONFERENCIA_MS = 5 * 60e3;

// O SDK do Clerk é pesado: só é carregado quando AUTH_PROVIDER=clerk.
const sdk = () => require('@clerk/backend');

function criarClerk({ env = process.env, clienteDe, verificarToken } = {}) {
  const modo = env.AUTH_PROVIDER || 'local';
  const ativo = modo === 'clerk';
  const publica = /^pk_(?:live|test)_[A-Za-z0-9+/=_-]{8,200}$/.test(env.CLERK_PUBLISHABLE_KEY || '') ? env.CLERK_PUBLISHABLE_KEY : null;
  const segredo = /^sk_(?:live|test)_[A-Za-z0-9]{8,200}$/.test(env.CLERK_SECRET_KEY || '') ? env.CLERK_SECRET_KEY : null;
  let site;
  try { const u = new URL(env.SITE_URL); if ((u.protocol === 'https:' || u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)) && !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash) site = u.origin; } catch {}
  // A chave publicável carrega o domínio da Frontend API (ex.: clerk.exemplo.com), terminado em "$".
  let frontendApi = null;
  if (publica) {
    try { const d = Buffer.from(publica.split('_').slice(2).join('_'), 'base64').toString('utf8'); if (/^[a-z0-9.-]+\$$/.test(d)) frontendApi = d.slice(0, -1); } catch {}
  }
  const disponivel = ativo && !!(publica && segredo && site && frontendApi);
  const conferir = () => { if (!disponivel) throw new ErroHttp(503, 'O acesso à conta está temporariamente indisponível. Tente novamente mais tarde.'); };
  let cliente;
  const clerk = () => { conferir(); return cliente ||= clienteDe ? clienteDe() : sdk().createClerkClient({ secretKey: segredo, publishableKey: publica }); };
  async function executar(fn, padrao) {
    try { return await fn(); }
    catch (e) {
      if (e instanceof ErroHttp) throw e;
      const status = e?.status;
      if (status === 429) throw new ErroHttp(429, 'Aguarde alguns minutos antes de tentar novamente.');
      if (status === 404) throw new ErroHttp(401, padrao);
      throw new ErroHttp(503, 'Não conseguimos acessar sua conta agora. Tente novamente em instantes.');
    }
  }
  // O token de sessão só vale para a origem do app (azp) e nunca é aceito se vencido ou de outra instância.
  async function verificar(token) {
    conferir();
    if (typeof token !== 'string' || token.length < 20 || token.length > 4096) throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.');
    let r;
    try { r = await (verificarToken || sdk().verifyToken)(token, { secretKey: segredo, authorizedParties: [site] }); }
    catch { throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.'); }
    const c = r?.data ?? (r?.errors ? null : r);
    if (!c || r?.errors?.length || typeof c.sub !== 'string' || !/^user_[A-Za-z0-9]{10,64}$/.test(c.sub) || typeof c.sid !== 'string' || !/^sess_[A-Za-z0-9]{10,64}$/.test(c.sid)) throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.');
    return { id: c.sub, sid: c.sid };
  }
  // E-mail só vale se for o principal e estiver verificado; contas bloqueadas não entram.
  async function usuario(id) {
    const u = await executar(() => clerk().users.getUser(id), 'Sua sessão expirou. Entre novamente.');
    const principal = (u.emailAddresses || []).find(e => e.id === u.primaryEmailAddressId);
    if (!u || u.id !== id || u.banned || u.locked || !principal?.emailAddress || principal.verification?.status !== 'verified') throw new ErroHttp(401, 'Confirme seu e-mail para continuar.');
    const email = principal.emailAddress.trim().toLowerCase();
    if (email.length > 160) throw new ErroHttp(401, 'Confirme seu e-mail para continuar.');
    return { id: u.id, email, google: (u.externalAccounts || []).some(c => /google/.test(c.provider) && c.verification?.status === 'verified') };
  }
  async function sessaoAtiva(sid) {
    try { const s = await clerk().sessions.getSession(sid); return s?.id === sid && s.status === 'active'; }
    catch (e) { if (e instanceof ErroHttp) throw e; if (e?.status === 404) return false; throw new ErroHttp(503, 'Não conseguimos acessar sua conta agora. Tente novamente em instantes.'); }
  }
  const revogar = sid => executar(() => clerk().sessions.revokeSession(sid), 'Não foi possível encerrar a sessão.');
  const excluir = id => executar(async () => { try { await clerk().users.deleteUser(id); } catch (e) { if (e?.status !== 404) throw e; } }, 'Não foi possível excluir a conta agora.');
  return { ativo, disponivel, conferir, frontendApi: disponivel ? frontendApi : null, chavePublica: disponivel ? publica : null, verificar, usuario, sessaoAtiva, revogar, excluir };
}

function registrarClerk({ db, clerk, rota, abrirSessao, criarUsuario, validarPerfil, limparVozes, conferirExclusao = async () => {} }) {
  const q = sql => db.prepare(sql);
  const limiteIp = auth.limitadorBanco(db, 'clerk-ip', { janelaMs: 15 * 60e3, max: 30 });
  const limiteSenha = auth.limitadorBanco(db, 'clerk-vinculo', { janelaMs: 15 * 60e3, max: 8 });
  const limitar = ctx => { if (!limiteIp.tentar(ctx.ip)) throw new ErroHttp(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'); };
  const porSubject = sub => q("SELECT * FROM usuarios WHERE auth_provider = 'clerk' AND auth_subject = ?").get(sub);

  function abrir(ctx, uid, sid, { migrar = false } = {}) {
    if (migrar) q('DELETE FROM sessoes WHERE user_id = ?').run(uid);
    const h = abrirSessao(ctx.req, ctx.res, uid);
    q('UPDATE sessoes SET clerk_sid = ?, clerk_conferida_em = ? WHERE id_hash = ?').run(sid, Date.now(), h);
    return { ok: true, etapa: 'concluido' };
  }

  // O app só confia no Clerk enquanto a sessão de origem continuar ativa (conferida a cada poucos minutos).
  async function validarSessao(ctx, u) {
    if (!u || u.auth_provider !== 'clerk') return u;
    clerk.conferir();
    const s = q('SELECT clerk_sid, clerk_conferida_em FROM sessoes WHERE id_hash = ?').get(u.tokenHash);
    if (s?.clerk_sid && Date.now() - s.clerk_conferida_em < CONFERENCIA_MS) return u;
    if (!s?.clerk_sid || !await clerk.sessaoAtiva(s.clerk_sid)) {
      q('DELETE FROM sessoes WHERE id_hash = ?').run(u.tokenHash); limparSessao(ctx.req, ctx.res); return null;
    }
    q('UPDATE sessoes SET clerk_conferida_em = ? WHERE id_hash = ?').run(Date.now(), u.tokenHash);
    return u;
  }
  if (!clerk.ativo) return { validarSessao };

  rota('POST', '/auth/clerk', async ctx => {
    limitar(ctx);
    const b = ctx.corpo, { id, sid } = await clerk.verificar(b.token), remoto = await clerk.usuario(id);
    const vinculo = porSubject(id);
    if (vinculo) return transacao(db, () => abrir(ctx, vinculo.id, sid));
    const existente = q('SELECT * FROM usuarios WHERE email = ?').get(remoto.email);
    if (existente?.auth_provider === 'clerk') throw new ErroHttp(409, 'Essa conta já tem outro vínculo de acesso.');
    if (existente) {
      // Conta antiga com senha própria: o e-mail verificado não basta, a senha atual prova que a conta é dessa pessoa.
      if (existente.auth_provider === 'local') {
        if (typeof b.senha !== 'string') return { ok: true, etapa: 'vincular', email: remoto.email };
        if (b.senha.length > 200 || !limiteSenha.tentar(remoto.email)) throw new ErroHttp(429, 'Muitas tentativas. Aguarde alguns minutos.');
        if (!await auth.conferirSenhaAsync(b.senha, existente.senha_hash)) throw new ErroHttp(401, 'Senha atual incorreta.');
        limiteSenha.limpar(remoto.email);
      }
      return transacao(db, () => {
        // Outra identidade pode ter vinculado a conta enquanto a senha era conferida: reconfere dentro da transação.
        const atual = q('SELECT auth_provider FROM usuarios WHERE id = ?').get(existente.id);
        if (!atual || atual.auth_provider === 'clerk') throw new ErroHttp(409, 'Essa conta já tem outro vínculo de acesso.');
        const r = q("UPDATE usuarios SET auth_provider = 'clerk', auth_subject = ?, senha_hash = 'clerk' WHERE id = ? AND auth_provider <> 'clerk'").run(id, existente.id);
        if (r.changes !== 1) throw new ErroHttp(409, 'Essa conta já tem outro vínculo de acesso.');
        q('DELETE FROM auth_sessoes WHERE id_hash IN (SELECT id_hash FROM sessoes WHERE user_id = ?)').run(existente.id);
        return abrir(ctx, existente.id, sid, { migrar: true });
      });
    }
    if (b.consentimento === undefined && b.nome === undefined) return { ok: true, etapa: 'completar', email: remoto.email };
    const perfil = validarPerfil(b);
    try {
      return transacao(db, () => {
        const uid = criarUsuario({ ...perfil, email: remoto.email, senha_hash: 'clerk' });
        q("UPDATE usuarios SET auth_provider = 'clerk', auth_subject = ? WHERE id = ?").run(id, uid);
        return abrir(ctx, uid, sid);
      });
    } catch (e) {
      if (/UNIQUE/i.test(e.message)) throw new ErroHttp(409, 'Essa conta já existe. Entre para continuar.');
      throw e;
    }
  }, { publica: true });

  // Com o Clerk ativo, cadastro e senha locais ficam fechados: o único caminho de entrada é o Clerk.
  rota('POST', '/auth/cadastro', () => { throw new ErroHttp(410, 'O cadastro agora é feito pela tela de entrada.'); }, { publica: true });
  rota('POST', '/auth/entrar', () => { throw new ErroHttp(410, 'O acesso agora é feito pela tela de entrada.'); }, { publica: true });
  rota('POST', '/auth/senha', ctx => {
    if (ctx.u.auth_provider === 'clerk') throw new ErroHttp(409, 'Altere sua senha em “Gerenciar conta” (Clerk).');
    throw new ErroHttp(409, 'Saia e entre novamente para confirmar seu e-mail antes de alterar a senha.');
  });

  rota('POST', '/auth/sair', async ctx => {
    if (ctx.u) {
      const s = q('SELECT clerk_sid FROM sessoes WHERE id_hash = ?').get(ctx.u.tokenHash);
      q('DELETE FROM sessoes WHERE id_hash = ?').run(ctx.u.tokenHash);
      if (s?.clerk_sid && clerk.disponivel) await clerk.revogar(s.clerk_sid).catch(() => {});
    }
    limparSessao(ctx.req, ctx.res);
    return { ok: true };
  }, { publica: true });

  rota('POST', '/conta/excluir', async ctx => {
    const u = q('SELECT * FROM usuarios WHERE id = ?').get(ctx.u.id);
    if (u.auth_provider === 'clerk') {
      // Token recém-emitido do Clerk, da mesma pessoa e da mesma sessão de origem, e a confirmação explícita no app.
      const { id, sid } = await clerk.verificar(ctx.corpo.token);
      const origem = q('SELECT clerk_sid FROM sessoes WHERE id_hash = ?').get(ctx.u.tokenHash)?.clerk_sid;
      if (id !== u.auth_subject || !origem || sid !== origem || ctx.corpo.confirmar !== true) throw new ErroHttp(401, 'Confirme seu acesso para excluir a conta.');
    } else if (typeof ctx.corpo.senha !== 'string' || ctx.corpo.senha.length > 200 || !await auth.conferirSenhaAsync(ctx.corpo.senha, u.senha_hash)) throw new ErroHttp(401, 'Senha incorreta.');
    q('UPDATE usuarios SET excluindo_em = ? WHERE id = ?').run(new Date().toISOString(), u.id);
    try {
      await conferirExclusao(u.id);
      await limparVozes(u.id);
      if (u.auth_provider === 'clerk') await clerk.excluir(u.auth_subject);
      q('DELETE FROM usuarios WHERE id = ?').run(u.id);
    } catch (e) { q('UPDATE usuarios SET excluindo_em = NULL WHERE id = ?').run(u.id); throw e; }
    limparSessao(ctx.req, ctx.res); return { ok: true };
  });
  return { validarSessao };
}
module.exports = { criarClerk, registrarClerk };
