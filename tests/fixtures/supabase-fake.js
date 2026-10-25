'use strict';
const crypto = require('node:crypto');
const URL_BASE = 'https://projeto-fixture.supabase.co';
function criarFake() {
  const usuarios = new Map(), sessoes = new Map(), refreshes = new Map(), enviados = [], codigosGoogle = new Map();
  const estado = { offline: false, falharExclusao: false, renovacoes: 0, cadastros: 0, autoConfirmar: false, tiposConfirmados: [] };
  const erro = (code, status = 400) => ({ error: { code, status, message: 'Detalhe privado do provedor: secret-fixture' } });
  const usuario = u => ({ id: u.id, email: u.email, email_confirmed_at: u.confirmado ? '2026-10-22T00:00:00Z' : null, is_anonymous: false, identities: u.google ? [{ provider: 'google', identity_data: { email: u.email, email_verified: u.googleVerificado !== false } }] : [], user_metadata: { papel: 'admin', idade: 99 } });
  function criar(email, senha, confirmado = true) { const u = { id: crypto.randomUUID(), email, senha, confirmado, codigo: null }; usuarios.set(email, u); return u; }
  function sessao(u) {
    const s = { access_token: crypto.randomBytes(24).toString('hex'), refresh_token: crypto.randomBytes(24).toString('hex'), expires_at: Math.floor(Date.now() / 1000) + 3600, user: usuario(u), revogada: false };
    sessoes.set(s.access_token, s); refreshes.set(s.refresh_token, s); return s;
  }
  function autorizarGoogle(email, url, verificado = true) {
    const u = usuarios.get(email) || criar(email, null); u.google = true; u.googleVerificado = verificado;
    const codigo = crypto.randomBytes(24).toString('hex');
    codigosGoogle.set(codigo, { u, desafio: new URL(url).searchParams.get('code_challenge') }); return codigo;
  }
  function cliente(admin = false, opcoes) {
    let atual;
    const indisponivel = () => estado.offline ? erro('unexpected_failure', 503) : null;
    return { auth: {
      signInWithOAuth: async ({ provider, options }) => {
        const verificador = crypto.randomBytes(32).toString('base64url');
        opcoes.auth.storage.setItem('inglou-google-code-verifier', JSON.stringify(verificador));
        const params = new URLSearchParams({ provider, redirect_to: options.redirectTo, code_challenge: crypto.createHash('sha256').update(verificador).digest('base64url'), code_challenge_method: 's256', skip_http_redirect: 'true' });
        return { data: { url: URL_BASE + '/auth/v1/authorize?' + params } };
      },
      exchangeCodeForSession: async codigo => {
        if (indisponivel()) return indisponivel();
        const fluxo = codigosGoogle.get(codigo), v = JSON.parse(opcoes.auth.storage.getItem('inglou-google-code-verifier') || 'null');
        if (!fluxo || !v || crypto.createHash('sha256').update(v).digest('base64url') !== fluxo.desafio) return erro('bad_code_verifier', 401);
        codigosGoogle.delete(codigo); return { data: { session: sessao(fluxo.u) } };
      },
      signUp: async ({ email, password }) => { if (indisponivel()) return indisponivel(); estado.cadastros++; const u = usuarios.get(email) || criar(email, password, false); if (estado.autoConfirmar) { u.confirmado = true; return { data: { session: sessao(u) } }; } u.codigo = '123456'; enviados.push(email); return { data: { user: usuario(u), session: null } }; },
      signInWithPassword: async ({ email, password }) => { if (indisponivel()) return indisponivel(); const u = usuarios.get(email); if (!u || u.senha !== password) return erro('invalid_credentials'); if (!u.confirmado) return erro('email_not_confirmed'); return { data: { session: sessao(u) } }; },
      signInWithOtp: async ({ email, options }) => { if (indisponivel()) return indisponivel(); let u = usuarios.get(email); if (!u && !options.shouldCreateUser) return erro('signup_disabled'); if (!u) u = criar(email, null, false); u.codigo = '123456'; enviados.push(email); return { data: {} }; },
      resend: async ({ email }) => { if (indisponivel()) return indisponivel(); const u = usuarios.get(email); if (u) { u.codigo = '123456'; enviados.push(email); } return { data: {} }; },
      verifyOtp: async ({ email, token, type }) => { estado.tiposConfirmados.push(type); if (indisponivel()) return indisponivel(); const u = usuarios.get(email); if (!u?.codigo || token !== u.codigo) return erro('otp_expired', 403); u.codigo = null; u.confirmado = true; return { data: { session: sessao(u) } }; },
      getUser: async token => { if (indisponivel()) return indisponivel(); const s = sessoes.get(token), u = s && [...usuarios.values()].find(u => u.id === s.user.id); return !s || s.revogada || !u ? erro('bad_jwt', 401) : { data: { user: usuario(u) } }; },
      getClaims: async token => { if (indisponivel()) return indisponivel(); const s = sessoes.get(token); return !s || s.revogada ? erro('bad_jwt', 401) : { data: { claims: { sub: s.user.id, email: s.user.email, iss: URL_BASE + '/auth/v1', aud: 'authenticated', is_anonymous: false } } }; },
      refreshSession: async ({ refresh_token }) => { if (indisponivel()) return indisponivel(); const s = refreshes.get(refresh_token); if (!s || s.revogada) return erro('refresh_token_not_found', 401); estado.renovacoes++; const u = usuarios.get(s.user.email); return { data: { session: sessao(u) } }; },
      setSession: async tokens => { if (indisponivel()) return indisponivel(); atual = sessoes.get(tokens.access_token); return !atual || atual.revogada ? erro('bad_jwt', 401) : { data: { session: atual } }; },
      updateUser: async ({ password }) => { if (indisponivel()) return indisponivel(); const u = usuarios.get(atual?.user.email); if (!u) return erro('bad_jwt', 401); if (u.senha === password) return erro('same_password', 422); u.senha = password; return { data: { user: usuario(u) } }; },
      signOut: async ({ scope }) => { if (indisponivel()) return indisponivel(); for (const s of sessoes.values()) if (s.user.id === atual?.user.id && (scope === 'others' ? s !== atual : s === atual)) s.revogada = true; return { error: null }; },
      getSession: async () => ({ data: { session: atual } }),
      admin: { deleteUser: async id => { if (!admin || estado.falharExclusao) return erro('unexpected_failure', 503); for (const [email, u] of usuarios) if (u.id === id) usuarios.delete(email); for (const s of sessoes.values()) if (s.user.id === id) s.revogada = true; return { data: {} }; } },
    } };
  }
  return { cliente, usuarios, sessoes, estado, enviados, criar, sessao, autorizarGoogle, env: { AUTH_PROVIDER: 'supabase', SUPABASE_URL: URL_BASE, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture', SUPABASE_SECRET_KEY: 'sb_secret_fixture', AUTH_SESSION_KEY: 'a1'.repeat(32), SITE_URL: 'https://inglou.example.test', AUTH_GOOGLE_ENABLED: '1' } };
}
module.exports = { criarFake };
