'use strict';
// Supabase apenas no servidor: nenhum JWT, refresh token ou segredo vai para o navegador.
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { ErroHttp } = require('./http');

function criarSupabase({ env = process.env, fetchImpl = fetch, clienteDe } = {}) {
  const modo = env.AUTH_PROVIDER || 'local';
  if (!['local', 'supabase'].includes(modo)) throw new Error('AUTH_PROVIDER deve ser local ou supabase.');
  const ativo = modo === 'supabase';
  let url;
  try { const u = new URL(env.SUPABASE_URL); if (u.protocol === 'https:' && !u.username && !u.password && u.pathname === '/') url = u.origin; } catch {}
  const publica = env.SUPABASE_PUBLISHABLE_KEY, segredo = env.SUPABASE_SECRET_KEY;
  const chave = /^[a-f0-9]{64}$/i.test(env.AUTH_SESSION_KEY || '') ? Buffer.from(env.AUTH_SESSION_KEY, 'hex') : null;
  const disponivel = ativo && !!(url && publica && segredo && chave);
  let site;
  try { const u = new URL(env.SITE_URL); if ((u.protocol === 'https:' || u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)) && !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash) site = u.origin; } catch {}
  const google = disponivel && env.AUTH_GOOGLE_ENABLED === '1' && !!site;
  const conferir = () => { if (!disponivel) throw new ErroHttp(503, 'O acesso à conta está temporariamente indisponível. Tente novamente mais tarde.'); };
  const cliente = (admin = false) => {
    conferir();
    return clienteDe ? clienteDe(admin) : createClient(url, admin ? segredo : publica, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { fetch: (input, opts = {}) => fetchImpl(input, { ...opts, signal: AbortSignal.timeout(12000) }) },
    });
  };
  function selar(dados, escopo) {
    conferir(); const iv = crypto.randomBytes(12), cifrador = crypto.createCipheriv('aes-256-gcm', chave, iv);
    cifrador.setAAD(Buffer.from(escopo));
    const corpo = Buffer.concat([cifrador.update(JSON.stringify(dados), 'utf8'), cifrador.final()]);
    return ['v1', iv.toString('base64url'), cifrador.getAuthTag().toString('base64url'), corpo.toString('base64url')].join('.');
  }
  function abrir(texto, escopo) {
    conferir();
    try {
      const [v, iv, tag, corpo, sobra] = String(texto).split('.');
      if (v !== 'v1' || sobra || !iv || !tag || !corpo) throw new Error();
      const dec = crypto.createDecipheriv('aes-256-gcm', chave, Buffer.from(iv, 'base64url'));
      dec.setAAD(Buffer.from(escopo)); dec.setAuthTag(Buffer.from(tag, 'base64url'));
      return JSON.parse(Buffer.concat([dec.update(Buffer.from(corpo, 'base64url')), dec.final()]).toString('utf8'));
    } catch { throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.'); }
  }
  function tratarErro(e, padrao) {
    if (e instanceof ErroHttp) throw e;
    const codigo = e?.code;
    if (['over_email_send_rate_limit', 'over_request_rate_limit'].includes(codigo) || e?.status === 429) throw new ErroHttp(429, 'Aguarde alguns minutos antes de tentar novamente.');
    if (codigo === 'email_not_confirmed') throw new ErroHttp(403, 'Confirme seu e-mail antes de entrar.');
    if (['otp_expired', 'otp_disabled'].includes(codigo)) throw new ErroHttp(401, 'O código é inválido ou expirou. Peça outro código.');
    if (codigo === 'weak_password') throw new ErroHttp(422, 'Escolha uma senha mais forte, com pelo menos 10 caracteres.');
    if (codigo === 'same_password') throw new ErroHttp(422, 'Escolha uma senha diferente da atual.');
    if (codigo === 'invalid_credentials') throw new ErroHttp(401, 'E-mail ou senha incorretos.');
    if (e?.status >= 400 && e.status < 500) throw new ErroHttp(401, padrao);
    throw new ErroHttp(503, 'Não conseguimos acessar sua conta agora. Tente novamente em instantes.');
  }
  async function executar(fn, mensagem) {
    try { const r = await fn(); if (r.error) tratarErro(r.error, mensagem); return r.data; }
    catch (e) { tratarErro(e, mensagem); }
  }
  function tokensDe(s) {
    if (!s?.access_token || !s?.refresh_token || !Number.isFinite(s.expires_at)) throw new ErroHttp(503, 'Não foi possível concluir o acesso. Tente novamente.');
    return { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at };
  }
  async function identidade(tokens) {
    const d = await executar(() => cliente().auth.getUser(tokens.access_token), 'Sua sessão expirou. Entre novamente.');
    const u = d.user;
    if (!u || u.is_anonymous || !/^[a-f0-9-]{36}$/i.test(u.id) || !u.email || !u.email_confirmed_at) throw new ErroHttp(401, 'Confirme seu e-mail para continuar.');
    return { id: u.id, email: u.email.trim().toLowerCase(), google: !!u.identities?.some(i => i.provider === 'google' && i.identity_data?.email_verified === true && i.identity_data?.email?.toLowerCase() === u.email.toLowerCase()) };
  }
  let validador;
  async function validar(tokens) {
    validador ||= cliente();
    const d = await executar(() => validador.auth.getClaims(tokens.access_token), 'Sua sessão expirou. Entre novamente.');
    const c = d.claims;
    if (c?.iss !== url + '/auth/v1' || c.aud !== 'authenticated' || c.is_anonymous || typeof c.sub !== 'string' || typeof c.email !== 'string') throw new ErroHttp(401, 'Sua sessão expirou. Entre novamente.');
    return { id: c.sub, email: c.email.toLowerCase() };
  }
  async function entrar(email, senha) {
    const d = await executar(() => cliente().auth.signInWithPassword({ email, password: senha }), 'E-mail ou senha incorretos.');
    const tokens = tokensDe(d.session); return { tokens, usuario: await identidade(tokens) };
  }
  async function cadastrar(email, senha) {
    const d = await executar(() => cliente().auth.signUp({ email, password: senha }), 'Não foi possível criar a conta. Tente entrar ou recuperar sua senha.');
    if (!d.session) return null;
    const tokens = tokensDe(d.session); return { tokens, usuario: await identidade(tokens) };
  }
  async function enviarCodigo(email, criar = false) {
    await executar(async () => {
      const r = await cliente().auth.signInWithOtp({ email, options: { shouldCreateUser: criar } });
      if (!criar && ['signup_disabled', 'user_not_found', 'otp_disabled'].includes(r.error?.code)) return { data: {} };
      return r;
    }, 'Não foi possível enviar o código agora.');
  }
  async function reenviarCadastro(email) { await executar(() => cliente().auth.resend({ type: 'signup', email }), 'Não foi possível reenviar o código.'); }
  async function confirmar(email, codigo, tipo = 'email') {
    const d = await executar(() => cliente().auth.verifyOtp({ email, token: codigo, type: tipo }), 'O código é inválido ou expirou.');
    const tokens = tokensDe(d.session); return { tokens, usuario: await identidade(tokens) };
  }
  async function renovar(tokens) {
    const d = await executar(() => cliente().auth.refreshSession({ refresh_token: tokens.refresh_token }), 'Sua sessão expirou. Entre novamente.');
    return tokensDe(d.session);
  }
  async function comSessao(tokens) {
    const c = cliente(); await executar(() => c.auth.setSession(tokens), 'Sua sessão expirou. Entre novamente.'); return c;
  }
  async function alterarSenha(tokens, senha, { permitirAtual = false } = {}) {
    const c = await comSessao(tokens);
    await executar(async () => { const r = await c.auth.updateUser({ password: senha }); return permitirAtual && r.error?.code === 'same_password' ? { data: {} } : r; }, 'Não foi possível alterar a senha.');
    await executar(() => c.auth.signOut({ scope: 'others' }), 'Não foi possível encerrar as outras sessões.');
    return tokensDe((await executar(() => c.auth.getSession(), 'Entre novamente.')).session);
  }
  async function sair(tokens) { const c = await comSessao(tokens); await executar(() => c.auth.signOut({ scope: 'local' }), 'Não foi possível encerrar a sessão.'); }
  async function excluir(id) { await executar(() => cliente(true).auth.admin.deleteUser(id), 'Não foi possível excluir a conta agora.'); }
  // O SDK gera o PKCE. Seu armazenamento existe apenas neste fluxo, cifrado no servidor.
  // Nunca compartilhamos cliente/armazenamento OAuth entre navegadores ou réplicas.
  function clienteOAuth(memoria) {
    conferir(); if (!google) throw new ErroHttp(503, 'O login com Google ainda não está disponível.');
    const dados = new Map(Object.entries(memoria || {}));
    const storage = { getItem: k => dados.get(k) ?? null, setItem: (k, v) => { dados.set(k, v); }, removeItem: k => { dados.delete(k); } };
    const opcoes = { auth: { flowType: 'pkce', storageKey: 'inglou-google', storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: (input, opts = {}) => fetchImpl(input, { ...opts, signal: AbortSignal.timeout(12000) }) } };
    return { c: clienteDe ? clienteDe(false, opcoes) : createClient(url, publica, opcoes), dados };
  }
  async function iniciarGoogle() {
    const { c, dados } = clienteOAuth();
    const d = await executar(() => c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: site + '/api/v1/auth/google/retorno', skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } } }), 'Não foi possível iniciar o Google.');
    const destino = new URL(d.url);
    if (destino.origin !== url || destino.pathname !== '/auth/v1/authorize' || destino.searchParams.get('provider') !== 'google' || destino.searchParams.get('code_challenge_method') !== 's256') throw new ErroHttp(503, 'Não foi possível iniciar um acesso seguro.');
    destino.searchParams.delete('skip_http_redirect');
    return { url: destino.href, memoria: Object.fromEntries(dados) };
  }
  async function concluirGoogle(codigo, memoria) {
    const { c } = clienteOAuth(memoria);
    const d = await executar(() => c.auth.exchangeCodeForSession(codigo), 'O acesso com Google expirou. Comece novamente.');
    const tokens = tokensDe(d.session), usuario = await identidade(tokens);
    if (!usuario.google) { await sair(tokens).catch(() => {}); throw new ErroHttp(401, 'Confirme um e-mail verificado no Google para continuar.'); }
    return { tokens, usuario };
  }
  return { ativo, disponivel, google, conferir, selar, abrir, entrar, cadastrar, enviarCodigo, reenviarCadastro, confirmar, renovar, identidade, validar, alterarSenha, sair, excluir, iniciarGoogle, concluirGoogle };
}
module.exports = { criarSupabase };
