'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { abrir } = require('../src/db');
const { criar } = require('../src/api');
const { criarSupabase } = require('../src/auth-supabase');
const { criarFake } = require('./fixtures/supabase-fake');
const { cabecalhos, erro, ErroHttp } = require('../src/http');
const auth = require('../src/auth');
const SENHA = 'janela girassol frase segura 2026';
const NOVA = 'outra frase com estrelas e rios 2026';
async function ambiente(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-auth-')), db = abrir(dir), fake = criarFake();
  const provedor = criarSupabase({ env: fake.env, clienteDe: fake.cliente });
  const api = criar(db, { supabase: provedor });
  const server = http.createServer(async (req, res) => { cabecalhos(res); try { await api.tratar(req, res, new URL(req.url, 'http://localhost')); } catch (e) { if (!(e instanceof ErroHttp)) process.stderr.write(e.stack + '\n'); erro(res, e instanceof ErroHttp ? e.status : 500, e instanceof ErroHttp ? e.message : 'Erro interno'); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); api.fechar(); db.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  let n = 0;
  function navegador() {
    const cookies = new Map(), ip = '10.0.0.' + ++n;
    return { cookies, async r(metodo, rota, corpo, headers = {}) {
      const r = await fetch(base + rota, { method: metodo, redirect: 'manual', headers: { Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '), 'X-Forwarded-For': ip, ...(metodo !== 'GET' ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}), ...headers }, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
      for (const c of r.headers.getSetCookie()) { const [par] = c.split(';'), i = par.indexOf('='); if (/Max-Age=0(?:;|$)/.test(c)) cookies.delete(par.slice(0, i)); else cookies.set(par.slice(0, i), par.slice(i + 1)); }
      const texto = await r.text(), dados = texto ? JSON.parse(texto) : {}; assert.doesNotMatch(texto, /access_token|refresh_token|secret-fixture|sb_secret_fixture/);
      return { status: r.status, dados, headers: r.headers };
    } };
  }
  const registro = (extra = {}) => ({ nome: 'Pessoa Teste', email: 'pessoa@example.com', senha: SENHA, idade: 16, papel: 'aluno', regiao: 'nordeste', responsavel: true, consentimento: true, ...extra });
  async function cadastrar(n = navegador(), extra = {}) {
    const b = registro(extra); assert.equal((await n.r('POST', '/auth/cadastro', b)).status, 200);
    assert.equal((await n.r('POST', '/auth/verificar', { codigo: '123456' })).status, 200); return n;
  }
  return { db, dir, fake, provedor, navegador, registro, cadastrar };
}

test('cadastro exige consentimento e código, mantém idade/região e não aceita papel dos metadados externos', async t => {
  const a = await ambiente(t), n = a.navegador();
  assert.equal((await n.r('POST', '/auth/cadastro', a.registro({ responsavel: false }))).status, 422);
  assert.equal(a.fake.estado.cadastros, 0);
  const inicio = await n.r('POST', '/auth/cadastro', a.registro());
  assert.equal(inicio.dados.etapa, 'codigo'); assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
  assert.match(inicio.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
  assert.equal((await n.r('GET', '/eu')).status, 401);
  assert.equal((await n.r('POST', '/auth/verificar', { codigo: '000000' })).status, 401);
  assert.equal((await n.r('POST', '/auth/verificar', { codigo: '123456' })).status, 200);
  const eu = await n.r('GET', '/eu'); assert.equal(eu.status, 200); assert.equal(eu.dados.perfil.idade, 16); assert.equal(eu.dados.perfil.regiao, 'nordeste'); assert.equal(eu.dados.perfil.papel, 'aluno');
  const u = a.db.prepare('SELECT * FROM usuarios').get(); assert.equal(u.auth_provider, 'supabase'); assert.equal(u.senha_hash, 'supabase');
  const registro = a.db.prepare('SELECT tokens FROM auth_sessoes').get().tokens;
  const token = [...a.fake.sessoes.keys()][0]; assert.ok(!registro.includes(token));
  assert.equal((await n.r('POST', '/auth/verificar', { codigo: '123456' })).status, 401);
});

test('código é vinculado ao navegador e tem limite de tentativas', async t => {
  const a = await ambiente(t), n = a.navegador(), outro = a.navegador();
  await n.r('POST', '/auth/cadastro', a.registro());
  assert.equal((await outro.r('POST', '/auth/verificar', { codigo: '123456' })).status, 401);
  assert.equal((await outro.r('GET', '/auth/fluxo')).dados.etapa, null);
  for (let i = 0; i < 5; i++) assert.equal((await n.r('POST', '/auth/verificar', { codigo: '999999' })).status, 401);
  assert.equal((await n.r('POST', '/auth/verificar', { codigo: '123456' })).status, 429);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
});

test('migração prova senha antiga e e-mail, preserva o mesmo ID/histórico e revoga sessões locais anteriores', async t => {
  const a = await ambiente(t), n = a.navegador(), antigo = a.navegador();
  a.db.prepare('INSERT INTO usuarios (id,email,nome,senha_hash,criado_em,consentiu_em) VALUES (1,?,?,?,?,?)').run('pessoa@example.com', 'Pessoa antiga', auth.hashSenha(SENHA), '2026-01-01', '2026-01-01');
  a.db.prepare("INSERT INTO perfis (user_id,idade,papel,regiao) VALUES (1,35,'professor','sul')").run();
  a.db.prepare("INSERT INTO tentativas (user_id,em,item_id,correto) VALUES (1,'2026-10-01','meu-progresso',1)").run();
  a.fake.criar('pessoa@example.com', SENHA); // mesmo e-mail já tinha identidade no provedor
  const velho = auth.novoToken(); antigo.cookies.set('inglou_sessao', velho);
  a.db.prepare('INSERT INTO sessoes (id_hash,user_id,criado_em,expira_em) VALUES (?,1,?,?)').run(auth.hashToken(velho), Date.now(), Date.now() + 864e5);
  assert.equal((await n.r('POST', '/auth/entrar', { email: 'pessoa@example.com', senha: 'incorreta' })).status, 401); assert.equal(a.fake.enviados.length, 0);
  assert.equal((await n.r('POST', '/auth/entrar', { email: 'pessoa@example.com', senha: SENHA })).dados.finalidade, 'migrar');
  assert.equal((await n.r('GET', '/eu')).status, 401);
  assert.equal((await n.r('POST', '/auth/verificar', { codigo: '123456', senha: SENHA })).status, 200);
  const u = a.db.prepare('SELECT * FROM usuarios').get(); assert.equal(u.id, 1); assert.equal(u.nome, 'Pessoa antiga'); assert.equal(u.auth_provider, 'supabase');
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM tentativas WHERE user_id=1').get().n, 1);
  assert.equal((await n.r('GET', '/eu')).dados.perfil.papel, 'professor');
  assert.equal((await antigo.r('GET', '/eu')).status, 401);
});

test('recuperação não revela existência, não cria sessão antes da nova senha e encerra os outros acessos', async t => {
  const a = await ambiente(t), original = await a.cadastrar(), recuperar = a.navegador(), desconhecido = a.navegador();
  const r = await recuperar.r('POST', '/auth/recuperar', { email: 'pessoa@example.com' });
  const outro = await desconhecido.r('POST', '/auth/recuperar', { email: 'ninguem@example.com' });
  assert.equal(r.status, outro.status); assert.equal(r.dados.mensagem, outro.dados.mensagem);
  assert.ok(!a.fake.usuarios.has('ninguem@example.com'));
  assert.equal((await recuperar.r('POST', '/auth/redefinir', { nova: NOVA })).status, 401);
  assert.equal((await recuperar.r('POST', '/auth/verificar', { codigo: '123456' })).dados.etapa, 'nova-senha');
  assert.equal((await recuperar.r('GET', '/eu')).status, 401);
  assert.equal((await recuperar.r('POST', '/auth/redefinir', { nova: 'curta' })).status, 422);
  assert.equal((await recuperar.r('POST', '/auth/redefinir', { nova: NOVA })).status, 200);
  assert.equal((await recuperar.r('GET', '/eu')).status, 200); assert.equal((await original.r('GET', '/eu')).status, 401);
  assert.equal((await a.navegador().r('POST', '/auth/entrar', { email: 'pessoa@example.com', senha: SENHA })).status, 401);
  assert.equal((await a.navegador().r('POST', '/auth/entrar', { email: 'pessoa@example.com', senha: NOVA })).status, 200);
});

test('usuário externo precisa completar consentimento, idade e papel antes de acessar o app', async t => {
  const a = await ambiente(t), n = a.navegador(); a.fake.criar('pessoa@example.com', SENHA);
  assert.equal((await n.r('POST', '/auth/entrar', { email: 'pessoa@example.com', senha: SENHA })).dados.etapa, 'codigo');
  assert.equal((await n.r('POST', '/auth/completar', a.registro())).status, 401);
  assert.equal((await n.r('POST', '/auth/verificar', { codigo: '123456' })).dados.etapa, 'completar');
  assert.equal((await n.r('GET', '/eu')).status, 401);
  assert.equal((await n.r('POST', '/auth/completar', a.registro({ consentimento: false }))).status, 422);
  assert.equal((await n.r('POST', '/auth/completar', a.registro())).status, 200);
  assert.equal((await n.r('GET', '/eu')).dados.perfil.idade, 16);
});

test('renova tokens sem expor ao navegador, indisponibilidade não vira login local e logout invalida sessão', async t => {
  const a = await ambiente(t), n = await a.cadastrar();
  const linha = a.db.prepare('SELECT * FROM auth_sessoes').get(), tokens = a.provedor.abrir(linha.tokens, 'sessao:' + linha.id_hash);
  tokens.expires_at = 1; a.db.prepare('UPDATE auth_sessoes SET tokens=? WHERE id_hash=?').run(a.provedor.selar(tokens, 'sessao:' + linha.id_hash), linha.id_hash);
  const resultados = await Promise.all([n.r('GET', '/eu'), n.r('GET', '/eu')]); assert.ok(resultados.every(r => r.status === 200)); assert.equal(a.fake.estado.renovacoes, 1);
  a.fake.estado.offline = true; assert.equal((await n.r('GET', '/eu')).status, 503);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM sessoes').get().n, 1);
  a.fake.estado.offline = false; assert.equal((await n.r('GET', '/eu')).status, 200);
  assert.equal((await n.r('POST', '/auth/sair')).status, 200); assert.equal((await n.r('GET', '/eu')).status, 401);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM auth_sessoes').get().n, 0);
});

test('trocar senha mantém só a sessão atual e excluir conta exige reautenticação e exclusão no provedor', async t => {
  const a = await ambiente(t), n = await a.cadastrar(), outro = a.navegador();
  await outro.r('POST', '/auth/entrar', { email: 'pessoa@example.com', senha: SENHA });
  assert.equal((await n.r('POST', '/auth/senha', { atual: SENHA, nova: NOVA })).status, 200);
  assert.equal((await n.r('GET', '/eu')).status, 200); assert.equal((await outro.r('GET', '/eu')).status, 401);
  assert.equal((await n.r('POST', '/conta/excluir', { senha: SENHA })).status, 401);
  a.fake.estado.falharExclusao = true; assert.equal((await n.r('POST', '/conta/excluir', { senha: NOVA })).status, 503);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 1);
  a.fake.estado.falharExclusao = false; assert.equal((await n.r('POST', '/conta/excluir', { senha: NOVA })).status, 200);
  assert.equal(a.fake.usuarios.size, 0); assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
});

test('segredos de sessão exigem configuração completa e a cifra rejeita troca de contexto', () => {
  const fake = criarFake(), s = criarSupabase({ env: fake.env, clienteDe: fake.cliente });
  const cifrado = s.selar({ segredo: 'refresh-privado' }, 'sessao:um'); assert.ok(!cifrado.includes('refresh-privado'));
  assert.deepEqual(s.abrir(cifrado, 'sessao:um'), { segredo: 'refresh-privado' });
  assert.throws(() => s.abrir(cifrado, 'sessao:outro'), e => e.status === 401);
  const incompleto = criarSupabase({ env: { AUTH_PROVIDER: 'supabase' } }); assert.equal(incompleto.ativo, true); assert.equal(incompleto.disponivel, false); assert.throws(incompleto.conferir, e => e.status === 503);
});

test('rotas de confirmação e recuperação mantêm CSRF e não aceitam tokens enviados pelo navegador', async t => {
  const a = await ambiente(t), n = a.navegador();
  for (const rota of ['/auth/cadastro', '/auth/recuperar', '/auth/verificar', '/auth/redefinir', '/auth/reenviar', '/auth/completar']) {
    assert.equal((await n.r('POST', rota, a.registro(), { Origin: 'https://outro-site.test' })).status, 403);
  }
  assert.equal(a.fake.enviados.length, 0);
  const falso = await n.r('POST', '/auth/entrar', { email: 'pessoa@example.com', senha: 'incorreta', access_token: 'qualquer-token', user_id: 1 });
  assert.equal(falso.status, 401); assert.equal((await n.r('GET', '/eu')).status, 401);
});

test('adaptador usa o SDK oficial para senha, validação e envio de código sem criar usuário desconhecido', async () => {
  const crypto = require('node:crypto'), fake = criarFake(), u = fake.criar('sdk@example.com', SENHA);
  const b64 = x => Buffer.from(JSON.stringify(x)).toString('base64url');
  const base = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: u.id, email: u.email, aud: 'authenticated', role: 'authenticated', iss: fake.env.SUPABASE_URL + '/auth/v1', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000), is_anonymous: false });
  const jwt = base + '.' + crypto.createHmac('sha256', 'segredo-fixture-apenas-teste').update(base).digest('base64url');
  const usuario = { id: u.id, email: u.email, aud: 'authenticated', role: 'authenticated', email_confirmed_at: '2026-10-22T00:00:00Z', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [] };
  const chamadas = [];
  const s = criarSupabase({ env: fake.env, fetchImpl: async (input, opts) => {
    const url = new URL(input), headers = new Headers(opts.headers), corpo = opts.body ? JSON.parse(opts.body) : null;
    chamadas.push({ url, headers, corpo });
    const ok = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    if (url.pathname === '/auth/v1/token') return ok({ access_token: jwt, refresh_token: 'refresh-fixture-real-sdk', token_type: 'bearer', expires_in: 3600, user: usuario });
    if (url.pathname === '/auth/v1/user') { assert.equal(headers.get('authorization'), 'Bearer ' + jwt); return ok(usuario); }
    if (url.pathname === '/auth/v1/otp') return new Response(JSON.stringify({ code: 400, error_code: 'signup_disabled', msg: 'Signups not allowed for otp' }), { status: 400, headers: { 'Content-Type': 'application/json', 'x-supabase-api-version': '2024-01-01' } });
    throw new Error('Requisição inesperada: ' + url.pathname);
  } });
  const resultado = await s.entrar(u.email, SENHA); assert.equal(resultado.usuario.id, u.id);
  assert.equal((await s.validar(resultado.tokens)).id, u.id);
  await s.enviarCodigo('desconhecido@example.com', false);
  assert.equal(chamadas.at(-1).corpo.create_user, false);
  assert.ok(chamadas.every(c => c.headers.get('apikey') === fake.env.SUPABASE_PUBLISHABLE_KEY));
});


test('cadastro ainda exige código se o projeto estiver com confirmação automática ligada', async t => {
  const a = await ambiente(t), n = a.navegador(); a.fake.estado.autoConfirmar = true;
  assert.equal((await n.r('POST', '/auth/cadastro', a.registro())).dados.etapa, 'codigo');
  assert.equal((await n.r('GET', '/eu')).status, 401);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
  assert.equal((await n.r('POST', '/auth/verificar', { codigo: '123456' })).status, 200);
  assert.equal(a.fake.estado.tiposConfirmados.at(-1), 'email');
});

test('recuperação migra conta local com senha esquecida somente após prova do e-mail', async t => {
  const a = await ambiente(t), n = a.navegador();
  a.db.prepare('INSERT INTO usuarios (id,email,nome,senha_hash,criado_em,consentiu_em) VALUES (7,?,?,?,?,?)').run('antigo@example.com', 'Pessoa antiga', auth.hashSenha(SENHA), '2026-01-01', '2026-01-01');
  a.db.prepare("INSERT INTO perfis (user_id,idade,papel,regiao) VALUES (7,35,'professor','sul')").run();
  await n.r('POST', '/auth/recuperar', { email: 'antigo@example.com' });
  assert.equal((await n.r('GET', '/eu')).status, 401);
  assert.equal((await n.r('POST', '/auth/verificar', { codigo: '123456' })).dados.etapa, 'nova-senha');
  assert.equal((await n.r('POST', '/auth/redefinir', { nova: NOVA })).status, 200);
  const u = a.db.prepare('SELECT * FROM usuarios').get(); assert.equal(u.id, 7); assert.equal(u.auth_provider, 'supabase');
  assert.equal((await n.r('GET', '/eu')).dados.perfil.regiao, 'sul');
});

async function iniciarGoogle(a, n, email = 'google@example.com', verificado = true) {
  const r = await n.r('POST', '/auth/google'); assert.equal(r.status, 200);
  const url = new URL(r.dados.url); assert.equal(url.searchParams.get('code_challenge_method'), 's256');
  assert.equal(url.searchParams.get('redirect_to'), a.fake.env.SITE_URL + '/api/v1/auth/google/retorno');
  const codigo = a.fake.autorizarGoogle(email, r.dados.url, verificado);
  return { codigo, voltar: () => n.r('GET', '/auth/google/retorno?code=' + codigo) };
}

test('Google usa PKCE e exige perfil, idade e consentimento antes de liberar a nova conta', async t => {
  const a = await ambiente(t), n = a.navegador();
  assert.equal((await n.r('GET', '/auth/estado')).dados.autenticacao.google, true);
  const g = await iniciarGoogle(a, n);
  const selado = a.db.prepare('SELECT dados FROM auth_fluxos').get().dados;
  assert.doesNotMatch(selado, /code-verifier|memoria/);
  const r = await g.voltar(); assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/app/#/entrar');
  assert.equal((await n.r('GET', '/eu')).status, 401);
  assert.equal((await n.r('GET', '/auth/fluxo')).dados.etapa, 'completar');
  assert.equal((await n.r('POST', '/auth/completar', a.registro({ responsavel: false }))).status, 422);
  assert.equal((await n.r('POST', '/auth/completar', a.registro({ papel: 'professor' }))).status, 200);
  const eu = await n.r('GET', '/eu'); assert.equal(eu.dados.perfil.papel, 'professor'); assert.equal(eu.dados.perfil.idade, 16); assert.equal(eu.dados.usuario.email, 'google@example.com');
  await n.r('POST', '/auth/sair');
  const novamente = await iniciarGoogle(a, n); await novamente.voltar(); assert.equal((await n.r('GET', '/eu')).status, 200);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 1);
});

test('Google rejeita retorno sem cookie, outro PKCE, reuso, código duplicado e e-mail não verificado', async t => {
  const a = await ambiente(t), n = a.navegador(), outro = a.navegador();
  const g = await iniciarGoogle(a, n), g2 = await iniciarGoogle(a, outro, 'outra@example.com');
  const semCookie = await a.navegador().r('GET', '/auth/google/retorno?code=' + g.codigo);
  assert.match(semCookie.headers.get('location'), /google=erro/);
  assert.match((await outro.r('GET', '/auth/google/retorno?code=' + g.codigo)).headers.get('location'), /google=erro/);
  assert.equal((await outro.r('GET', '/eu')).status, 401);
  assert.equal((await g.voltar()).headers.get('location'), '/app/#/entrar');
  assert.match((await g.voltar()).headers.get('location'), /google=erro/);
  const pendente = await n.r('GET', '/auth/fluxo'); assert.equal(pendente.dados.etapa, 'completar');
  const inseguro = await iniciarGoogle(a, outro, 'sem-prova@example.com', false); await inseguro.voltar();
  assert.equal((await outro.r('GET', '/auth/fluxo')).dados.etapa, null);
  const duplicado = await iniciarGoogle(a, outro); const r = await outro.r('GET', '/auth/google/retorno?code=' + duplicado.codigo + '&code=' + g2.codigo);
  assert.match(r.headers.get('location'), /google=erro/);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
});

test('Google preserva conta antiga e turmas somente após confirmar sua senha, sem aceitar vínculo conflitante', async t => {
  const a = await ambiente(t), n = a.navegador();
  a.db.prepare('INSERT INTO usuarios (id,email,nome,senha_hash,criado_em,consentiu_em) VALUES (1,?,?,?,?,?)').run('antigo-google@example.com', 'Professor original', auth.hashSenha(SENHA), '2026-01-01', '2026-01-01');
  a.db.prepare("INSERT INTO perfis (user_id,idade,papel,regiao) VALUES (1,40,'professor','sul')").run();
  a.db.prepare("INSERT INTO turmas (professor_id,nome,codigo,criado_em) VALUES (1,'Turma preservada','GOO123','2026-01-01')").run();
  const g = await iniciarGoogle(a, n, 'antigo-google@example.com'); await g.voltar();
  assert.equal((await n.r('GET', '/auth/fluxo')).dados.etapa, 'vincular');
  assert.equal((await n.r('GET', '/eu')).status, 401);
  assert.equal((await n.r('POST', '/auth/google/vincular', { senha: 'incorreta' })).status, 401);
  assert.equal((await n.r('POST', '/auth/completar', a.registro())).status, 401);
  assert.equal((await n.r('POST', '/auth/google/vincular', { senha: SENHA })).status, 200);
  assert.equal((await n.r('GET', '/eu')).dados.perfil.papel, 'professor');
  assert.equal(a.db.prepare('SELECT professor_id FROM turmas').get().professor_id, 1);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 1);
  await n.r('POST', '/auth/sair');
  a.fake.usuarios.delete('antigo-google@example.com'); // outra identidade tentando tomar o mesmo e-mail
  const conflito = await iniciarGoogle(a, n, 'antigo-google@example.com');
  assert.match((await conflito.voltar()).headers.get('location'), /google=erro/);
  assert.equal((await n.r('GET', '/eu')).status, 401);
});

test('Google cancela com segurança, expira, aceita apenas destino fixo e respeita CSRF e configuração', async t => {
  const a = await ambiente(t), n = a.navegador();
  assert.equal((await n.r('POST', '/auth/google', {}, { Origin: 'https://invasor.test' })).status, 403);
  const inicio = await n.r('POST', '/auth/google', { redirectTo: 'https://invasor.test', user_id: 1 });
  assert.equal(new URL(inicio.dados.url).searchParams.get('redirect_to'), a.fake.env.SITE_URL + '/api/v1/auth/google/retorno');
  assert.match((await n.r('GET', '/auth/google/retorno?error=access_denied&error_description=segredo')).headers.get('location'), /^\/app\/#\/entrar\?google=erro$/);
  await iniciarGoogle(a, n); a.db.prepare('UPDATE auth_fluxos SET expira_em=0').run();
  assert.match((await n.r('GET', '/auth/google/retorno?code=qualquer')).headers.get('location'), /google=erro/);
  const s = criarSupabase({ env: { ...a.fake.env, AUTH_GOOGLE_ENABLED: '0' }, clienteDe: a.fake.cliente });
  assert.equal(s.google, false); await assert.rejects(s.iniciarGoogle(), e => e.status === 503);
  const invalido = criarSupabase({ env: { ...a.fake.env, SITE_URL: 'https://invasor.test/app/?next=algo' }, clienteDe: a.fake.cliente });
  assert.equal(invalido.google, false);
});

test('conta Google sem senha pode criar senha e excluir conta com código ligado à sessão e à ação', async t => {
  const a = await ambiente(t), n = a.navegador(), outro = a.navegador();
  const g = await iniciarGoogle(a, n); await g.voltar(); await n.r('POST', '/auth/completar', a.registro());
  const g2 = await iniciarGoogle(a, outro); await g2.voltar();
  assert.equal((await n.r('POST', '/auth/senha', { codigo: '123456', nova: NOVA })).status, 401);
  assert.equal((await n.r('POST', '/auth/seguranca/codigo', { acao: 'senha' })).status, 200);
  assert.equal((await outro.r('POST', '/auth/senha', { codigo: '123456', nova: NOVA })).status, 401);
  assert.equal((await n.r('POST', '/conta/excluir', { codigo: '123456' })).status, 401);
  assert.equal((await n.r('POST', '/auth/senha', { codigo: '000000', nova: NOVA })).status, 401);
  assert.equal((await n.r('POST', '/auth/senha', { codigo: '123456', nova: NOVA })).status, 200);
  assert.equal((await outro.r('GET', '/eu')).status, 401);
  assert.equal((await n.r('POST', '/auth/senha', { codigo: '123456', nova: SENHA })).status, 401);
  assert.equal((await n.r('POST', '/auth/seguranca/codigo', { acao: 'excluir' })).status, 200);
  assert.equal((await n.r('POST', '/conta/excluir', { codigo: '123456' })).status, 200);
  assert.equal(a.db.prepare('SELECT COUNT(*) n FROM usuarios').get().n, 0);
});

test('código de ação sensível expira e bloqueia após cinco erros', async t => {
  const a = await ambiente(t), n = await a.cadastrar();
  await n.r('POST', '/auth/seguranca/codigo', { acao: 'excluir' });
  for (let i = 0; i < 5; i++) assert.equal((await n.r('POST', '/conta/excluir', { codigo: '999999' })).status, 401);
  assert.equal((await n.r('POST', '/conta/excluir', { codigo: '123456' })).status, 429);
  await n.r('POST', '/auth/seguranca/codigo', { acao: 'excluir' });
  a.db.prepare("UPDATE auth_fluxos SET expira_em=0 WHERE finalidade='seguranca'").run();
  assert.equal((await n.r('POST', '/conta/excluir', { codigo: '123456' })).status, 401);
});

test('SDK oficial mantém o verificador PKCE no servidor e troca somente o código autorizado', async () => {
  const fake = criarFake(), u = fake.criar('sdk-google@example.com', null);
  let verificador;
  const s = criarSupabase({ env: fake.env, fetchImpl: async (input, opts) => {
    const url = new URL(input), corpo = opts.body ? JSON.parse(opts.body) : null;
    const usuario = { id: u.id, email: u.email, email_confirmed_at: '2026-10-22T00:00:00Z', identities: [{ provider: 'google', identity_data: { email: u.email, email_verified: true } }] };
    const ok = d => new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } });
    if (url.pathname === '/auth/v1/token') {
      assert.equal(url.searchParams.get('grant_type'), 'pkce'); assert.equal(corpo.auth_code, 'codigo-fixture'); verificador = corpo.code_verifier;
      return ok({ access_token: 'token-sdk-fixture', refresh_token: 'refresh-sdk-fixture', token_type: 'bearer', expires_in: 3600, user: usuario });
    }
    if (url.pathname === '/auth/v1/user') return ok(usuario);
    throw new Error('Requisição OAuth inesperada');
  } });
  const inicio = await s.iniciarGoogle(), destino = new URL(inicio.url);
  assert.equal(destino.searchParams.get('provider'), 'google'); assert.equal(destino.searchParams.get('code_challenge_method'), 's256');
  assert.equal(destino.searchParams.has('skip_http_redirect'), false);
  const resultado = await s.concluirGoogle('codigo-fixture', inicio.memoria);
  assert.equal(resultado.usuario.google, true);
  assert.equal(require('node:crypto').createHash('sha256').update(verificador).digest('base64url'), destino.searchParams.get('code_challenge'));
  assert.ok(!destino.href.includes(verificador));
});

test('cookies de confirmação em HTTPS impedem injeção por subdomínio com prefixo Host', async t => {
  const a = await ambiente(t), n = a.navegador();
  const r = await n.r('POST', '/auth/google', {}, { 'X-Forwarded-Proto': 'https' });
  assert.equal(r.status, 200);
  const cookie = r.headers.getSetCookie().findLast(c => c.startsWith('__Host-inglou_auth='));
  assert.ok(cookie); assert.match(cookie, /; Path=\/; HttpOnly; SameSite=Lax; Max-Age=900; Secure$/); assert.doesNotMatch(cookie, /Domain=/i);
});
