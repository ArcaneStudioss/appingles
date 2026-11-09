'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { abrir } = require('../src/db');
const { criar } = require('../src/api');
const { criarClerk } = require('../src/auth-clerk');
const { cabecalhos, erro, ErroHttp } = require('../src/http');
const auth = require('../src/auth');

const SITE = 'http://localhost:3000';
const SEGREDO = 'sk_test_segredoFixture12345';
const ENV = {
  AUTH_PROVIDER: 'clerk', SITE_URL: SITE, CLERK_SECRET_KEY: SEGREDO,
  CLERK_PUBLISHABLE_KEY: 'pk_test_' + Buffer.from('clerk.exemplo.test$').toString('base64').replace(/=+$/, ''),
};

// Clerk simulado: o token de teste é "tk|<usuario>|<sessão>|<azp>" e só vale se o usuário existir.
function criarFake() {
  const usuarios = new Map(), sessoes = new Map(), estado = { excluidos: [], revogadas: [] };
  const novo = (n, email, extra = {}) => {
    const id = 'user_' + String(n).padStart(12, 'a');
    usuarios.set(id, { id, primaryEmailAddressId: 'idn_' + n, emailAddresses: [{ id: 'idn_' + n, emailAddress: email, verification: { status: 'verified', strategy: 'email_code' } }], externalAccounts: [], banned: false, locked: false, ...extra });
    return id;
  };
  const sessao = (n, status = 'active') => { const id = 'sess_' + String(n).padStart(12, 'b'); sessoes.set(id, { id, status }); return id; };
  const token = (usuario, sess, azp = SITE) => `tk|${usuario}|${sess}|${azp}|` + 'x'.repeat(24);
  const verificarToken = async (t, opcoes) => {
    const [, sub, sid, azp] = String(t).split('|');
    if (!opcoes.authorizedParties.includes(azp)) throw new Error('azp');
    if (opcoes.secretKey !== SEGREDO) throw new Error('segredo');
    return { data: { sub, sid, azp } };
  };
  const cliente = () => ({
    users: {
      async getUser(id) { const u = usuarios.get(id); if (!u) throw Object.assign(new Error('x'), { status: 404 }); return u; },
      async deleteUser(id) { estado.excluidos.push(id); usuarios.delete(id); },
    },
    sessions: {
      async getSession(sid) { const s = sessoes.get(sid); if (!s) throw Object.assign(new Error('x'), { status: 404 }); return s; },
      async revokeSession(sid) { estado.revogadas.push(sid); sessoes.get(sid).status = 'revoked'; },
    },
  });
  return { usuarios, sessoes, estado, novo, sessao, token, verificarToken, cliente };
}

async function ambiente(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-clerk-')), db = abrir(dir), fake = criarFake();
  const clerk = criarClerk({ env: ENV, clienteDe: fake.cliente, verificarToken: fake.verificarToken });
  const api = criar(db, { clerk });
  const server = http.createServer(async (req, res) => { cabecalhos(res); try { await api.tratar(req, res, new URL(req.url, 'http://localhost')); } catch (e) { if (!(e instanceof ErroHttp)) process.stderr.write(e.stack + '\n'); erro(res, e instanceof ErroHttp ? e.status : 500, e instanceof ErroHttp ? e.message : 'erro'); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); api.fechar(); db.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  let n = 0;
  function navegador() {
    const cookies = new Map(), ip = '10.1.0.' + ++n;
    return { async r(metodo, rota, corpo) {
      const r = await fetch(base + rota, { method: metodo, headers: { Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '), 'X-Forwarded-For': ip, ...(metodo !== 'GET' ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
      for (const c of r.headers.getSetCookie()) { const [par] = c.split(';'), i = par.indexOf('='); if (/Max-Age=0(?:;|$)/.test(c)) cookies.delete(par.slice(0, i)); else cookies.set(par.slice(0, i), par.slice(i + 1)); }
      const texto = await r.text(); assert.doesNotMatch(texto, /sk_test_|sk_live_|segredoFixture/);
      return { status: r.status, dados: texto ? JSON.parse(texto) : {}, headers: r.headers };
    } };
  }
  const perfil = (extra = {}) => ({ nome: 'Pessoa Teste', idade: 16, papel: 'aluno', regiao: 'nordeste', responsavel: true, consentimento: true, ...extra });
  return { db, fake, clerk, navegador, perfil, porta: server.address().port };
}

test('provedor só fica disponível com as duas chaves e a origem do site; chave publicável revela o domínio do Clerk', () => {
  assert.equal(criarClerk({ env: ENV }).disponivel, true);
  assert.equal(criarClerk({ env: ENV }).frontendApi, 'clerk.exemplo.test');
  assert.equal(criarClerk({ env: { ...ENV, CLERK_SECRET_KEY: '' } }).disponivel, false);
  assert.equal(criarClerk({ env: { ...ENV, SITE_URL: 'http://exemplo.com' } }).disponivel, false);
  assert.equal(criarClerk({ env: { AUTH_PROVIDER: 'local' } }).ativo, false);
});

test('novo usuário confirma o Clerk, completa idade e consentimento e recebe a sessão do app', async t => {
  const a = await ambiente(t), n = a.navegador();
  const estado = (await n.r('GET', '/auth/estado')).dados.autenticacao;
  assert.equal(estado.provedor, 'clerk'); assert.equal(estado.clerk.frontendApi, 'clerk.exemplo.test'); assert.ok(estado.clerk.chavePublica.startsWith('pk_test_'));
  const u = a.fake.novo(1, 'Pessoa@Example.com'), s = a.fake.sessao(1), tk = a.fake.token(u, s);
  assert.equal((await n.r('GET', '/eu')).status, 401);
  const inicio = await n.r('POST', '/auth/clerk', { token: tk });
  assert.equal(inicio.dados.etapa, 'completar'); assert.equal(inicio.dados.email, 'pessoa@example.com');
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
  assert.equal((await n.r('POST', '/auth/clerk', { token: tk, ...a.perfil({ consentimento: false }) })).status, 422);
  assert.equal((await n.r('POST', '/auth/clerk', { token: tk, ...a.perfil({ responsavel: false }) })).status, 422);
  const fim = await n.r('POST', '/auth/clerk', { token: tk, ...a.perfil() });
  assert.equal(fim.status, 200); assert.equal(fim.dados.etapa, 'concluido');
  assert.match(fim.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
  const eu = await n.r('GET', '/eu');
  assert.equal(eu.status, 200); assert.equal(eu.dados.autenticacao.provedor, 'clerk'); assert.equal(eu.dados.perfil.idade, 16); assert.equal(eu.dados.perfil.papel, 'aluno');
  const reg = a.db.prepare('SELECT * FROM usuarios').get();
  assert.equal(reg.auth_provider, 'clerk'); assert.equal(reg.auth_subject, u); assert.equal(reg.senha_hash, 'clerk'); assert.equal(reg.email, 'pessoa@example.com');
  assert.equal(a.db.prepare('SELECT clerk_sid FROM sessoes').get().clerk_sid, s);
  // Voltando: o mesmo vínculo entra direto, sem refazer o perfil.
  const outro = a.navegador(); assert.equal((await outro.r('POST', '/auth/clerk', { token: tk })).dados.etapa, 'concluido');
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 1);
});

test('e-mail não verificado, origem errada, token inválido e conta bloqueada são recusados', async t => {
  const a = await ambiente(t), n = a.navegador();
  const sem = a.fake.novo(2, 'sem@example.com'); a.fake.usuarios.get(sem).emailAddresses[0].verification.status = 'unverified';
  const s = a.fake.sessao(2);
  assert.equal((await n.r('POST', '/auth/clerk', { token: a.fake.token(sem, s) })).status, 401);
  const ok = a.fake.novo(3, 'ok@example.com');
  assert.equal((await n.r('POST', '/auth/clerk', { token: a.fake.token(ok, s, 'https://outro-site.example') })).status, 401);
  assert.equal((await n.r('POST', '/auth/clerk', { token: 'curto' })).status, 401);
  assert.equal((await n.r('POST', '/auth/clerk', {})).status, 401);
  assert.equal((await n.r('POST', '/auth/clerk', { token: a.fake.token('user_inexistente01', s) })).status, 401);
  a.fake.usuarios.get(ok).banned = true;
  assert.equal((await n.r('POST', '/auth/clerk', { token: a.fake.token(ok, s) })).status, 401);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
});

test('outra identidade do Clerk não assume uma conta já vinculada', async t => {
  const a = await ambiente(t), n = a.navegador();
  const u1 = a.fake.novo(5, 'dono@example.com'); await n.r('POST', '/auth/clerk', { token: a.fake.token(u1, a.fake.sessao(5)), ...a.perfil() });
  const u2 = a.fake.novo(6, 'dono@example.com');
  assert.equal((await a.navegador().r('POST', '/auth/clerk', { token: a.fake.token(u2, a.fake.sessao(6)), ...a.perfil() })).status, 409);
});

test('o app confere a sessão do Clerk a cada poucos minutos e encerra o acesso quando ela é revogada', async t => {
  const a = await ambiente(t), n = a.navegador();
  const u = a.fake.novo(7, 'rev@example.com'), s = a.fake.sessao(7);
  await n.r('POST', '/auth/clerk', { token: a.fake.token(u, s), ...a.perfil() });
  a.fake.sessoes.get(s).status = 'revoked';
  assert.equal((await n.r('GET', '/eu')).status, 200, 'dentro da janela de conferência o acesso segue');
  a.db.prepare('UPDATE sessoes SET clerk_conferida_em = 1').run();
  assert.equal((await n.r('GET', '/eu')).status, 401);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM sessoes').get().n, 0);
});

test('sair revoga a sessão no Clerk; excluir apaga a conta e o usuário no Clerk', async t => {
  const a = await ambiente(t), n = a.navegador();
  const u = a.fake.novo(8, 'sair@example.com'), s = a.fake.sessao(8);
  await n.r('POST', '/auth/clerk', { token: a.fake.token(u, s), ...a.perfil() });
  assert.equal((await n.r('POST', '/auth/sair', {})).status, 200);
  assert.deepEqual(a.fake.estado.revogadas, [s]); assert.equal((await n.r('GET', '/eu')).status, 401);

  const m = a.navegador(), u2 = a.fake.novo(9, 'excluir@example.com'), s2 = a.fake.sessao(9), tk2 = a.fake.token(u2, s2);
  await m.r('POST', '/auth/clerk', { token: tk2, ...a.perfil() });
  assert.equal((await m.r('POST', '/conta/excluir', {})).status, 401);
  assert.equal((await m.r('POST', '/conta/excluir', { token: tk2 })).status, 401, 'exige a confirmação explícita');
  assert.equal((await m.r('POST', '/conta/excluir', { token: a.fake.token(u, s), confirmar: true })).status, 401, 'token de outra pessoa não vale');
  assert.equal((await m.r('POST', '/conta/excluir', { token: a.fake.token(u2, a.fake.sessao(99)), confirmar: true })).status, 401, 'token de outra sessão da mesma pessoa não vale');
  assert.equal((await m.r('POST', '/conta/excluir', { token: tk2, confirmar: true })).status, 200);
  assert.deepEqual(a.fake.estado.excluidos, [u2]);
  assert.equal(a.db.prepare("SELECT COUNT(*) n FROM usuarios WHERE email='excluir@example.com'").get().n, 0);
});

test('com o Clerk ativo, cadastro e login por senha locais ficam fechados e a troca de senha aponta para o Clerk', async t => {
  const a = await ambiente(t), n = a.navegador();
  assert.equal((await n.r('POST', '/auth/cadastro', { nome: 'X Y', email: 'x@example.com', senha: 'frase longa de cadastro 2026', consentimento: true })).status, 410);
  assert.equal((await n.r('POST', '/auth/entrar', { email: 'x@example.com', senha: 'frase longa de cadastro 2026' })).status, 410);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
  const u = a.fake.novo(10, 'senha@example.com'); await n.r('POST', '/auth/clerk', { token: a.fake.token(u, a.fake.sessao(10)), ...a.perfil() });
  const r = await n.r('POST', '/auth/senha', { atual: 'a', nova: 'b' }); assert.equal(r.status, 409); assert.match(r.dados.erro, /Clerk/);
});

test('rota do Clerk exige o cabeçalho anti-CSRF e o provedor sem configuração recusa tudo com 503', async t => {
  const a = await ambiente(t), n = a.navegador();
  const u = a.fake.novo(11, 'csrf@example.com'), corpo = JSON.stringify({ token: a.fake.token(u, a.fake.sessao(11)), ...a.perfil() });
  const r = await fetch(`http://127.0.0.1:${a.porta}/api/v1/auth/clerk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo });
  assert.equal(r.status, 403); assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
  const desligado = criarClerk({ env: { AUTH_PROVIDER: 'clerk', SITE_URL: SITE } });
  await assert.rejects(() => desligado.verificar('x'.repeat(30)), e => e.status === 503);
});

test('conta antiga é vinculada pelo e-mail verificado no Clerk, sem senha: mantém o ID, invalida a senha antiga e derruba as sessões antigas', async t => {
  const a = await ambiente(t), n = a.navegador();
  const uid = Number(a.db.prepare('INSERT INTO usuarios (email,nome,senha_hash,criado_em,consentiu_em) VALUES (?,?,?,?,?)').run('antiga@example.com', 'Antiga', auth.hashSenha('janela girassol frase segura 2026'), 'x', 'x').lastInsertRowid);
  a.db.prepare('INSERT INTO perfis (user_id,idade,papel,regiao,atualizado_em) VALUES (?,?,?,?,?)').run(uid, 30, 'aluno', null, 'x');
  a.db.prepare('INSERT INTO sessoes (id_hash,user_id,criado_em,expira_em) VALUES (?,?,?,?)').run('antiga-hash', uid, 1, Date.now() + 1e6);
  const u = a.fake.novo(4, 'antiga@example.com');
  assert.equal((await n.r('POST', '/auth/clerk', { token: a.fake.token(u, a.fake.sessao(4)) })).dados.etapa, 'concluido');
  const reg = a.db.prepare('SELECT * FROM usuarios WHERE id=?').get(uid);
  assert.equal(reg.auth_provider, 'clerk'); assert.equal(reg.auth_subject, u); assert.equal(reg.senha_hash, 'clerk');
  assert.equal(a.db.prepare("SELECT COUNT(*) n FROM sessoes WHERE id_hash='antiga-hash'").get().n, 0);
  assert.equal((await n.r('GET', '/eu')).dados.usuario.email, 'antiga@example.com');
});

test('conta antiga: Google só liga sozinho com @gmail.com; outro domínio vindo do Google é recusado', async t => {
  const a = await ambiente(t), n = a.navegador();
  for (const [i, email] of [[9, 'social@gmail.com'], [10, 'social@empresa.example']]) {
    a.db.prepare('INSERT INTO usuarios (email,nome,senha_hash,criado_em,consentiu_em) VALUES (?,?,?,?,?)').run(email, 'S', auth.hashSenha('janela girassol frase segura 2026'), 'x', 'x');
    const u = a.fake.novo(i, email); a.fake.usuarios.get(u).emailAddresses[0].verification.strategy = 'from_oauth_google';
    const r = await n.r('POST', '/auth/clerk', { token: a.fake.token(u, a.fake.sessao(i)) });
    if (i === 9) assert.equal(r.dados.etapa, 'concluido');
    else { assert.equal(r.status, 403); assert.equal(a.db.prepare('SELECT auth_provider p FROM usuarios WHERE email=?').get(email).p, 'local'); }
  }
});

test('conta antiga não é vinculada com e-mail não verificado no Clerk', async t => {
  const a = await ambiente(t), n = a.navegador();
  a.db.prepare('INSERT INTO usuarios (email,nome,senha_hash,criado_em,consentiu_em) VALUES (?,?,?,?,?)').run('naover@example.com', 'N', auth.hashSenha('janela girassol frase segura 2026'), 'x', 'x');
  const u = a.fake.novo(8, 'naover@example.com'); a.fake.usuarios.get(u).emailAddresses[0].verification.status = 'unverified';
  assert.equal((await n.r('POST', '/auth/clerk', { token: a.fake.token(u, a.fake.sessao(8)) })).status, 401);
  assert.equal(a.db.prepare("SELECT auth_provider p FROM usuarios WHERE email='naover@example.com'").get().p, 'local');
});
