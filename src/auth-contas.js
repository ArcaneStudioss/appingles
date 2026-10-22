'use strict';
// Integração gradual: o identificador local e todos os vínculos de estudo são preservados.
const auth = require('./auth');
const { ErroHttp, lerCookies, limparSessao } = require('./http');
const { transacao } = require('./db');

function registrarAuth({ db, provedor, rota, V, abrirSessao, criarUsuario, limparVozes }) {
  const q = sql => db.prepare(sql), renovacoes = new Map();
  const limpeza = setInterval(() => { try { q('DELETE FROM auth_fluxos WHERE expira_em <= ?').run(Date.now()); } catch {} }, 60000);
  limpeza.unref();
  const fechar = () => clearInterval(limpeza);
  const limiteIp = auth.limitadorBanco(db, 'auth-externo-ip', { janelaMs: 15 * 60e3, max: 30 });
  const limiteCredenciais = auth.limitadorBanco(db, 'auth-credenciais', { janelaMs: 15 * 60e3, max: 8 });
  const limiteEmail = auth.limitadorBanco(db, 'auth-email', { janelaMs: 60 * 60e3, max: 5 });
  const nomeCookie = req => req.headers['x-forwarded-proto'] === 'https' || process.env.COOKIE_SEGURO === '1' ? '__Secure-inglou_auth' : 'inglou_auth';
  function cookie(ctx, token, idade = 900) {
    const seguro = nomeCookie(ctx.req).startsWith('__Secure-');
    ctx.res.appendHeader('Set-Cookie', `${nomeCookie(ctx.req)}=${token}; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=${idade}${seguro ? '; Secure' : ''}`);
  }
  function limparFluxo(ctx) {
    const t = lerCookies(ctx.req)[nomeCookie(ctx.req)];
    if (t && t.length <= 100) q('DELETE FROM auth_fluxos WHERE id_hash = ?').run(auth.hashToken(t));
    cookie(ctx, '', 0);
  }
  function novoFluxo(ctx, finalidade, email, dados) {
    provedor.conferir(); limparFluxo(ctx);
    q('DELETE FROM auth_fluxos WHERE expira_em <= ?').run(Date.now());
    const token = auth.novoToken(), hash = auth.hashToken(token);
    q('INSERT INTO auth_fluxos (id_hash,finalidade,email,dados,expira_em) VALUES (?,?,?,?,?)')
      .run(hash, finalidade, email, provedor.selar(dados, 'fluxo:' + hash), Date.now() + 15 * 60e3);
    cookie(ctx, token); return { etapa: 'codigo', finalidade, email };
  }
  function fluxoDe(ctx, bloquear = false) {
    provedor.conferir();
    const token = lerCookies(ctx.req)[nomeCookie(ctx.req)];
    const f = token && token.length <= 100 ? q('SELECT * FROM auth_fluxos WHERE id_hash = ?').get(auth.hashToken(token)) : null;
    if (!f || f.expira_em <= Date.now()) throw new ErroHttp(401, 'Essa etapa expirou. Comece novamente.');
    if (bloquear && !q('UPDATE auth_fluxos SET ocupado_ate = ? WHERE id_hash = ? AND ocupado_ate < ? RETURNING id_hash').get(Date.now() + 60000, f.id_hash, Date.now())) throw new ErroHttp(409, 'Já estamos conferindo. Aguarde um instante.');
    return { ...f, conteudo: provedor.abrir(f.dados, 'fluxo:' + f.id_hash) };
  }
  const destravar = f => q('UPDATE auth_fluxos SET ocupado_ate = 0 WHERE id_hash = ?').run(f.id_hash);
  function limitar(ctx, email, enviar = false) {
    if (!limiteIp.tentar(ctx.ip) || (enviar && !limiteEmail.tentar(email))) throw new ErroHttp(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
  }
  function validarPerfil(b) {
    const nome = V.str(b.nome, 80, { min: 2, campo: 'Nome' }), idade = V.int(b.idade, 1, 120, 'Idade');
    const papel = V.um(b.papel || 'aluno', ['aluno', 'professor'], 'Perfil');
    const regiao = b.regiao == null || b.regiao === '' ? null : V.um(b.regiao, ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul', 'fora'], 'Região');
    if (b.consentimento !== true) throw new ErroHttp(422, 'Leia e aceite a política de privacidade para criar a conta.');
    if (idade < 18 && b.responsavel !== true) throw new ErroHttp(422, 'Confirme a autorização do responsável.');
    return { nome, idade, papel, regiao, responsavel: b.responsavel === true };
  }
  function validarSenha(senha, pessoa) {
    if (typeof senha !== 'string') throw new ErroHttp(422, 'Informe a senha.');
    const fraca = auth.senhaFraca(senha, pessoa); if (fraca) throw new ErroHttp(422, fraca);
  }
  function vincular(uid, remoto) {
    const u = q('SELECT * FROM usuarios WHERE id = ?').get(uid);
    if (!u || u.email.toLowerCase() !== remoto.email) throw new ErroHttp(409, 'Não foi possível vincular essa conta.');
    if (u.auth_provider === 'supabase' && u.auth_subject !== remoto.id) throw new ErroHttp(409, 'Essa conta já tem outro vínculo de acesso.');
    const outra = q("SELECT id FROM usuarios WHERE auth_provider = 'supabase' AND auth_subject = ?").get(remoto.id);
    if (outra && outra.id !== uid) throw new ErroHttp(409, 'Essa identidade já está vinculada a outra conta.');
    q("UPDATE usuarios SET auth_provider = 'supabase', auth_subject = ?, senha_hash = 'supabase' WHERE id = ?").run(remoto.id, uid);
  }
  function salvarTokens(hash, tokens) { q('INSERT INTO auth_sessoes (id_hash,tokens) VALUES (?,?) ON CONFLICT(id_hash) DO UPDATE SET tokens=excluded.tokens').run(hash, provedor.selar(tokens, 'sessao:' + hash)); }
  function entrarCom(ctx, uid, resultado, migrar = false) {
    transacao(db, () => {
      if (typeof uid === 'function') uid = uid();
      vincular(uid, resultado.usuario);
      if (migrar) q('DELETE FROM sessoes WHERE user_id = ?').run(uid);
      const hash = abrirSessao(ctx.req, ctx.res, uid); salvarTokens(hash, resultado.tokens);
    });
    limparFluxo(ctx); return { ok: true, etapa: 'concluido' };
  }
  async function validarSessao(ctx, u) {
    if (!u || u.auth_provider !== 'supabase') return u;
    provedor.conferir();
    const ler = () => q('SELECT tokens FROM auth_sessoes WHERE id_hash = ?').get(u.tokenHash)?.tokens;
    let cifrado = ler(); if (!cifrado) return null;
    try {
      let tokens = provedor.abrir(cifrado, 'sessao:' + u.tokenHash);
      if (tokens.expires_at * 1000 <= Date.now() + 60000) {
        if (!renovacoes.has(u.tokenHash)) {
          const atualizar = (async () => {
            try {
              const novo = await provedor.renovar(tokens);
              q('UPDATE auth_sessoes SET tokens = ? WHERE id_hash = ? AND tokens = ?').run(provedor.selar(novo, 'sessao:' + u.tokenHash), u.tokenHash, cifrado);
            } catch (e) { if (ler() === cifrado) throw e; }
          })().finally(() => renovacoes.delete(u.tokenHash));
          renovacoes.set(u.tokenHash, atualizar);
        }
        await renovacoes.get(u.tokenHash);
        cifrado = ler(); if (!cifrado) return null;
        tokens = provedor.abrir(cifrado, 'sessao:' + u.tokenHash);
      }
      const remoto = await provedor.validar(tokens);
      if (remoto.id !== u.auth_subject) throw new ErroHttp(401, 'Entre novamente.');
      return u;
    } catch (e) {
      if (e.status !== 401) throw e;
      q('DELETE FROM sessoes WHERE id_hash = ?').run(u.tokenHash); limparSessao(ctx.req, ctx.res); return null;
    }
  }
  if (!provedor.ativo) return { validarSessao, fechar };

  rota('GET', '/auth/fluxo', ctx => {
    try {
      const f = fluxoDe(ctx);
      return { etapa: f.conteudo.tokens ? f.finalidade === 'recuperar' ? 'nova-senha' : 'completar' : 'codigo', finalidade: f.finalidade, email: f.email };
    } catch (e) { if (e.status === 401) return { etapa: null }; throw e; }
  }, { publica: true });
  rota('POST', '/auth/cancelar', ctx => { limparFluxo(ctx); return { ok: true }; }, { publica: true });

  rota('POST', '/auth/cadastro', async ctx => {
    provedor.conferir(); const b = ctx.corpo, email = V.email(b.email), perfil = validarPerfil(b);
    validarSenha(b.senha, { nome: perfil.nome, email }); limitar(ctx, email, true);
    if (q('SELECT id FROM usuarios WHERE email = ?').get(email)) throw new ErroHttp(409, 'Já existe uma conta com esse e-mail. Entre ou recupere sua senha.');
    const resultado = await provedor.cadastrar(email, b.senha);
    if (resultado) {
      // Mesmo se a confirmação estiver desligada no projeto, exigimos prova de posse do e-mail no app.
      if (resultado.usuario.email !== email) throw new ErroHttp(401, 'Não foi possível confirmar o e-mail.');
      await provedor.sair(resultado.tokens).catch(() => {});
      await provedor.enviarCodigo(email, false);
      return novoFluxo(ctx, 'cadastro', email, { perfil, tipo: 'email' });
    }
    return novoFluxo(ctx, 'cadastro', email, { perfil });
  }, { publica: true });

  rota('POST', '/auth/entrar', async ctx => {
    provedor.conferir(); const b = ctx.corpo, email = V.email(b.email);
    if (typeof b.senha !== 'string' || b.senha.length > 200) throw new ErroHttp(401, 'E-mail ou senha incorretos.');
    limitar(ctx, email);
    if (!limiteCredenciais.tentar(email)) throw new ErroHttp(429, 'Muitas tentativas. Aguarde alguns minutos.');
    const u = q('SELECT * FROM usuarios WHERE email = ?').get(email);
    // Uma conta antiga só é migrada depois de provar a senha antiga E receber o código no e-mail.
    if (u?.auth_provider === 'local') {
      if (!auth.conferirSenha(b.senha, u.senha_hash)) throw new ErroHttp(401, 'E-mail ou senha incorretos.');
      limiteCredenciais.limpar(email); limitar(ctx, email, true); await provedor.enviarCodigo(email, true);
      return novoFluxo(ctx, 'migrar', email, { uid: u.id });
    }
    const resultado = await provedor.entrar(email, b.senha);
    limiteCredenciais.limpar(email);
    const vinculo = q("SELECT * FROM usuarios WHERE auth_provider = 'supabase' AND auth_subject = ?").get(resultado.usuario.id);
    if (vinculo) return entrarCom(ctx, vinculo.id, resultado);
    if (u) throw new ErroHttp(409, 'Não foi possível vincular esse acesso. Recupere sua senha para continuar.');
    limitar(ctx, resultado.usuario.email, true);
    await provedor.sair(resultado.tokens).catch(() => {});
    await provedor.enviarCodigo(resultado.usuario.email, false);
    return novoFluxo(ctx, 'externo', resultado.usuario.email, {});
  }, { publica: true });

  rota('POST', '/auth/recuperar', async ctx => {
    provedor.conferir(); const email = V.email(ctx.corpo.email); limitar(ctx, email, true);
    // Cria a identidade externa somente para uma conta local já existente; nunca cria um aluno aqui.
    const existe = !!q('SELECT id FROM usuarios WHERE email = ?').get(email);
    await provedor.enviarCodigo(email, existe);
    return { ...novoFluxo(ctx, 'recuperar', email, {}), mensagem: 'Se houver uma conta com esse e-mail, enviaremos um código para redefinir a senha.' };
  }, { publica: true });

  rota('POST', '/auth/reenviar', async ctx => {
    const f = fluxoDe(ctx, true);
    try {
      if (f.conteudo.tokens) throw new ErroHttp(409, 'O código já foi confirmado. Continue a próxima etapa.');
      limitar(ctx, f.email, true);
      if (f.finalidade === 'cadastro' && f.conteudo.tipo !== 'email') await provedor.reenviarCadastro(f.email);
      else await provedor.enviarCodigo(f.email, f.finalidade === 'migrar' || !!q('SELECT id FROM usuarios WHERE email = ?').get(f.email));
      return { ok: true, mensagem: 'Confira seu e-mail e a pasta de spam.' };
    } finally { destravar(f); }
  }, { publica: true });

  rota('POST', '/auth/verificar', async ctx => {
    const f = fluxoDe(ctx, true);
    try {
      limitar(ctx, f.email);
      if (f.conteudo.tokens) throw new ErroHttp(409, 'O código já foi confirmado. Continue a próxima etapa.');
      if (typeof ctx.corpo.codigo !== 'string' || !/^\d{6,10}$/.test(ctx.corpo.codigo)) throw new ErroHttp(422, 'Digite o código numérico recebido no e-mail.');
      if (f.tentativas >= 5) throw new ErroHttp(429, 'Muitos códigos incorretos. Comece novamente para pedir outro.');
      let antigo;
      if (f.finalidade === 'migrar') {
        antigo = q('SELECT * FROM usuarios WHERE id = ?').get(f.conteudo.uid);
        if (!antigo || typeof ctx.corpo.senha !== 'string' || !auth.conferirSenha(ctx.corpo.senha, antigo.senha_hash)) throw new ErroHttp(401, 'Confirme a senha que você já usa no Inglou.');
      }
      q('UPDATE auth_fluxos SET tentativas = tentativas + 1 WHERE id_hash = ?').run(f.id_hash);
      let resultado = await provedor.confirmar(f.email, ctx.corpo.codigo, f.finalidade === 'cadastro' ? f.conteudo.tipo || 'signup' : 'email');
      if (resultado.usuario.email !== f.email) throw new ErroHttp(401, 'O código não corresponde a esse e-mail.');
      if (['recuperar', 'externo'].includes(f.finalidade)) {
        q('UPDATE auth_fluxos SET dados = ? WHERE id_hash = ?').run(provedor.selar(resultado, 'fluxo:' + f.id_hash), f.id_hash);
        return { etapa: f.finalidade === 'recuperar' ? 'nova-senha' : 'completar', email: f.email };
      }
      if (f.finalidade === 'migrar') {
        resultado.tokens = await provedor.alterarSenha(resultado.tokens, ctx.corpo.senha, { permitirAtual: true });
        return entrarCom(ctx, antigo.id, resultado, true);
      }
      if (f.finalidade !== 'cadastro') throw new ErroHttp(401, 'Comece novamente.');
      const existente = q('SELECT id FROM usuarios WHERE email = ?').get(f.email);
      if (existente) throw new ErroHttp(409, 'Essa conta já existe. Entre para continuar.');
      return entrarCom(ctx, () => criarUsuario({ ...f.conteudo.perfil, email: f.email, senha_hash: 'supabase' }), resultado);
    } finally { destravar(f); }
  }, { publica: true });

  rota('POST', '/auth/redefinir', async ctx => {
    const f = fluxoDe(ctx, true);
    try {
      if (f.finalidade !== 'recuperar' || !f.conteudo.tokens) throw new ErroHttp(401, 'Confirme o código do e-mail antes de alterar a senha.');
      validarSenha(ctx.corpo.nova, { email: f.email });
      const remoto = await provedor.identidade(f.conteudo.tokens);
      if (remoto.email !== f.email) throw new ErroHttp(401, 'Confirme seu e-mail novamente.');
      const u = q('SELECT * FROM usuarios WHERE email = ?').get(f.email);
      if (!u) throw new ErroHttp(401, 'Não foi possível concluir. Crie uma conta para começar.');
      if (u.auth_provider === 'supabase' && u.auth_subject !== remoto.id) throw new ErroHttp(409, 'Esse acesso não corresponde à conta.');
      const tokens = await provedor.alterarSenha(f.conteudo.tokens, ctx.corpo.nova);
      return entrarCom(ctx, u.id, { tokens, usuario: remoto }, true);
    } finally { destravar(f); }
  }, { publica: true });

  rota('POST', '/auth/completar', async ctx => {
    const f = fluxoDe(ctx, true);
    try {
      if (!['completar', 'externo'].includes(f.finalidade) || !f.conteudo.tokens) throw new ErroHttp(401, 'Entre novamente.');
      const perfil = validarPerfil(ctx.corpo), remoto = await provedor.identidade(f.conteudo.tokens);
      if (remoto.email !== f.email || q('SELECT id FROM usuarios WHERE email = ?').get(f.email)) throw new ErroHttp(409, 'Entre novamente para acessar essa conta.');
      return entrarCom(ctx, () => criarUsuario({ ...perfil, email: f.email, senha_hash: 'supabase' }), { tokens: f.conteudo.tokens, usuario: remoto });
    } finally { destravar(f); }
  }, { publica: true });

  rota('POST', '/auth/sair', async ctx => {
    let tokens;
    if (ctx.u) {
      const r = q('SELECT tokens FROM auth_sessoes WHERE id_hash = ?').get(ctx.u.tokenHash);
      if (r) { try { tokens = provedor.abrir(r.tokens, 'sessao:' + ctx.u.tokenHash); } catch {} }
      q('DELETE FROM sessoes WHERE id_hash = ?').run(ctx.u.tokenHash);
    }
    limparFluxo(ctx); limparSessao(ctx.req, ctx.res);
    if (tokens) await provedor.sair(tokens).catch(() => {});
    return { ok: true };
  }, { publica: true });

  rota('POST', '/auth/senha', async ctx => {
    const u = q('SELECT * FROM usuarios WHERE id = ?').get(ctx.u.id);
    if (u.auth_provider !== 'supabase') throw new ErroHttp(409, 'Saia e entre novamente para confirmar seu e-mail antes de alterar a senha.');
    validarSenha(ctx.corpo.nova, u); limitar(ctx, u.email);
    if (!limiteCredenciais.tentar(u.email)) throw new ErroHttp(429, 'Muitas tentativas. Aguarde alguns minutos.');
    if (typeof ctx.corpo.atual !== 'string' || ctx.corpo.atual.length > 200) throw new ErroHttp(401, 'Informe sua senha atual.');
    const resultado = await provedor.entrar(u.email, ctx.corpo.atual);
    if (resultado.usuario.id !== u.auth_subject) throw new ErroHttp(401, 'Senha atual incorreta.');
    limiteCredenciais.limpar(u.email);
    const tokens = await provedor.alterarSenha(resultado.tokens, ctx.corpo.nova);
    transacao(db, () => { salvarTokens(ctx.u.tokenHash, tokens); q('DELETE FROM sessoes WHERE user_id = ? AND id_hash <> ?').run(u.id, ctx.u.tokenHash); });
    return { ok: true };
  });

  rota('POST', '/conta/excluir', async ctx => {
    const u = q('SELECT * FROM usuarios WHERE id = ?').get(ctx.u.id);
    if (typeof ctx.corpo.senha !== 'string' || ctx.corpo.senha.length > 200) throw new ErroHttp(401, 'Senha incorreta.');
    if (u.auth_provider === 'supabase') {
      limitar(ctx, u.email);
      if (!limiteCredenciais.tentar(u.email)) throw new ErroHttp(429, 'Muitas tentativas. Aguarde alguns minutos.');
      const resultado = await provedor.entrar(u.email, ctx.corpo.senha);
      if (resultado.usuario.id !== u.auth_subject) throw new ErroHttp(401, 'Senha incorreta.');
    } else if (!auth.conferirSenha(ctx.corpo.senha, u.senha_hash)) throw new ErroHttp(401, 'Senha incorreta.');
    await limparVozes(u.id);
    if (u.auth_provider === 'supabase') await provedor.excluir(u.auth_subject);
    transacao(db, () => { q('DELETE FROM auth_fluxos WHERE email = ?').run(u.email); q('DELETE FROM usuarios WHERE id = ?').run(u.id); });
    limparSessao(ctx.req, ctx.res); return { ok: true };
  });
  return { validarSessao, fechar };
}
module.exports = { registrarAuth };
