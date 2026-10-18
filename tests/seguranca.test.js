'use strict';
// Testes de segurança (adaptados de templates/seguranca/seguranca.test.js da Arcane, 19 verificações).
// Roda com: npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');

const PORTA = 19000 + Math.floor(Math.random() * 900), BASE = `http://localhost:${PORTA}`;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-seg-'));
let srv, A = {}, B = {};
const R = (m, u, corpo, h = {}, raw) => fetch(BASE + u, { method: m, headers: { ...(!['GET', 'HEAD', 'OPTIONS'].includes(m) ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}), ...h }, body: raw ?? (corpo ? JSON.stringify(corpo) : undefined) });
const ck = r => (r.headers.get('set-cookie') || '').split(';')[0];
let ipN = 0; const ipNovo = () => ({ 'X-Forwarded-For': `10.9.${Math.floor(ipN / 250)}.${ipN++ % 250}` });

async function aluno(email, nome) {
  const r = await R('POST', '/api/v1/auth/cadastro', { nome, email, senha: 'frase longa de teste 2026', consentimento: true }, ipNovo());
  assert.equal(r.status, 200, await r.text());
  const H = { Cookie: ck(r) };
  await R('PUT', '/api/v1/perfil', { objetivo: 'entrevista', minutos_dia: 15, dias_semana: 5, area: 'vendas', interesses: [] }, H);
  const { itens } = await (await R('GET', '/api/v1/nivelamento', null, H)).json();
  const respostas = Object.fromEntries(itens.map(i => [i.id, { resposta: i.opcoes[0], tempoMs: 3000 }]));
  assert.equal((await R('POST', '/api/v1/nivelamento', { respostas, escrita: '', fala: '' }, H)).status, 200);
  return H;
}

before(async () => {
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT: PORTA, DATA_DIR: DIR, ANTHROPIC_API_KEY: '', PAGAMENTO_MODO: 'simulado' }, stdio: 'pipe' });
  for (let i = 0; i < 60; i++) { try { await fetch(BASE + '/saude'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  A = await aluno('ana@teste.com', 'Ana');
  B = await aluno('bia@teste.com', 'Bia');
});
after(() => { srv.kill(); fs.rmSync(DIR, { recursive: true, force: true }); });

test('1/16. código, banco e arquivos sensíveis não são servidos (inclui byte nulo e traversal)', async () => {
  for (const p of ['/server.js', '/src/api.js', '/src/db.js', '/dados/inglou.db', '/package.json', '/.env', '/.git/config', '/%2e%2e/server.js', '/assets/..%2fserver.js', '/app/../server.js', '/app/%00', '/assets/js/%00.js', '/assets/fontes/../../server.js', '/%5c..%5cserver.js', '//etc/passwd', '/node_modules/@anthropic-ai/sdk/package.json', '/public/index.html', '/tests/seguranca.test.js'])
    assert.equal((await fetch(BASE + p)).status, 404, p);
  assert.equal((await fetch(BASE + '/')).status, 200, 'o servidor continua vivo depois dos ataques');
  assert.equal((await fetch(BASE + '/app/')).status, 200);
});

test('3/4. lixo no corpo nunca vira erro 500 e SQL injection não passa', async () => {
  const lixos = [{}, { texto: ['a'] }, { texto: { $ne: 1 } }, { nota: 1e999 }, { objetivo: "'; DROP TABLE usuarios;--" }, { __proto__: { admin: true }, titulo: 'p' }, { prazo: '2020-13-45', objetivo: 'viagem', minutos_dia: 15 }, { itemId: "' OR 1=1 --", resposta: 'x' }, { escopo: 'usuarios' }, { cenario: '../../etc' }, { bloco: -1, texto: 'x' }, { indices: ['a'] }];
  for (const u of ['/perfil', '/licao/responder', '/licao/producao', '/licao/contestar', '/cartoes', '/conversas', '/tutor', '/materiais', '/dados/apagar', '/hipoteses/descartar', '/assinatura/assinar', '/perfil/lembrete', '/nivelamento', '/auth/entrar', '/auth/senha'])
    for (const l of lixos) {
      const m = ['/perfil', '/perfil/lembrete'].includes(u) ? 'PUT' : 'POST';
      const r = await R(m, '/api/v1' + u, l, A);
      assert.ok(r.status < 500, u + JSON.stringify(l) + ' -> ' + r.status);
    }
  for (const raw of ['{', '[1,2]', 'null', '"str"', '{"a":'.repeat(3000)]) assert.ok((await R('POST', '/api/v1/cartoes', null, A, raw)).status < 500);
  assert.equal((await R('GET', "/api/v1/conversas/' OR 1=1--", null, A)).status, 422);
  assert.ok((await (await R('GET', '/api/v1/dados', null, A)).json()).contagem, 'banco intacto');
});

test('3. corpo gigante recebe 413 e o servidor segue de pé', async () => {
  const r = await R('POST', '/api/v1/materiais', null, A, JSON.stringify({ titulo: 'x', texto: 'x'.repeat(400000) }));
  assert.equal(r.status, 413);
  assert.equal((await fetch(BASE + '/')).status, 200);
});

test('5/7. senha fraca é recusada e só existe hash no banco', async () => {
  for (const nova of ['aaaaaaaaaa', '1234567890', 'qwertyuiop', 'ana12345678!', 'abababababab', 'curta'])
    assert.equal((await R('POST', '/api/v1/auth/senha', { atual: 'frase longa de teste 2026', nova }, A)).status, 422, nova);
  const db = path.join(DIR, 'inglou.db');
  const bruto = fs.readFileSync(db).toString('latin1') + (fs.existsSync(db + '-wal') ? fs.readFileSync(db + '-wal').toString('latin1') : '');
  assert.ok(!bruto.includes('frase longa de teste 2026') && bruto.includes('scrypt$'));
});

test('6. IDOR: outro aluno não lê, edita nem apaga por id', async () => {
  await R('POST', '/api/v1/cartoes', { frente: 'secret word', verso: 'palavra secreta' }, A);
  const meus = (await (await R('GET', '/api/v1/cartoes', null, A)).json()).cartoes;
  const id = meus.find(c => c.frente === 'secret word').id;
  assert.equal((await R('PATCH', `/api/v1/cartoes/${id}`, { frente: 'hack', verso: 'x' }, B)).status, 404);
  assert.equal((await R('DELETE', `/api/v1/cartoes/${id}`, null, B)).status, 404);
  assert.equal((await R('POST', `/api/v1/cartoes/${id}/revisar`, { nota: 4 }, B)).status, 404);
  const conv = await (await R('POST', '/api/v1/conversas', { cenario: 'apresentacao' }, A)).json();
  assert.equal((await R('GET', `/api/v1/conversas/${conv.id}`, null, B)).status, 404);
  assert.equal((await R('POST', `/api/v1/conversas/${conv.id}/mensagem`, { texto: 'hi' }, B)).status, 404);
  assert.equal((await R('DELETE', `/api/v1/conversas/${conv.id}`, null, B)).status, 404);
  const bia = await (await R('GET', '/api/v1/cartoes', null, B)).json();
  assert.ok(!JSON.stringify(bia).includes('secret word'));
  const exp = await (await R('GET', '/api/v1/dados/exportar', null, B)).text();
  assert.ok(!exp.includes('secret word') && !exp.includes('ana@teste.com'));
});

test('8/15. força bruta: IP forjado não burla o bloqueio; há limite geral da API', async () => {
  let bloq = 0;
  for (let i = 0; i < 14; i++) if ((await R('POST', '/api/v1/auth/entrar', { email: 'ana@teste.com', senha: 'errada' + i }, { 'X-Forwarded-For': `10.0.0.${i}, 7.7.7.7` })).status === 429) bloq++;
  assert.ok(bloq > 0, 'precisa bloquear mesmo com o início do X-Forwarded-For trocado');
  let g = 0; for (let i = 0; i < 800; i++) { if ((await R('GET', '/api/v1/auth/estado', null, { 'X-Forwarded-For': '8.8.8.8' })).status === 429) { g++; break; } }
  assert.ok(g > 0, 'limite geral');
});

test('10/18/19. CSRF, cookie e CORS', async () => {
  assert.equal((await R('POST', '/api/v1/cartoes', { frente: 'c', verso: 'c' }, { ...A, 'X-Inglou': '' })).status, 403);
  assert.equal((await R('POST', '/api/v1/cartoes', { frente: 'c', verso: 'c' }, { ...A, Origin: 'https://evil.com' })).status, 403);
  assert.equal((await fetch(BASE + '/api/v1/cartoes', { method: 'POST', headers: { ...A, 'Content-Type': 'text/plain' }, body: '{"frente":"c","verso":"c"}' })).status, 403);
  const sc = (await R('POST', '/api/v1/auth/cadastro', { nome: 'Caio', email: 'caio@teste.com', senha: 'outra frase segura 99', consentimento: true }, { 'X-Forwarded-Proto': 'https', 'X-Forwarded-For': '3.3.3.3' })).headers.get('set-cookie') || '';
  assert.match(sc, /^__Host-inglou=/); assert.match(sc, /HttpOnly/); assert.match(sc, /Secure/); assert.match(sc, /SameSite=Lax/); assert.match(sc, /Path=\//); assert.doesNotMatch(sc, /Domain=/i);
  const o = await R('OPTIONS', '/api/v1/cartoes', null, { Origin: 'https://evil.com', 'Access-Control-Request-Method': 'POST' });
  assert.equal(o.headers.get('access-control-allow-origin'), null);
});

test('12. cabeçalhos de segurança e mensagens sem vazamento', async () => {
  const h = (await fetch(BASE + '/app/')).headers;
  for (const k of ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'strict-transport-security', 'referrer-policy', 'cross-origin-opener-policy', 'cross-origin-resource-policy', 'permissions-policy']) assert.ok(h.get(k), k);
  assert.doesNotMatch(h.get('content-security-policy'), /unsafe-inline|unsafe-eval/);
  assert.ok(!h.get('x-powered-by') && !h.get('server'));
  const t = await (await R('GET', '/api/v1/conversas/999999', null, A)).text();
  assert.doesNotMatch(t, /at .*\.js|\/home\/|SQLITE|node:|constraint/i);
  const a = await (await R('POST', '/api/v1/auth/entrar', { email: 'nao@existe.com', senha: 'x' }, { 'X-Forwarded-For': '6.6.6.6' })).json();
  const b = await (await R('POST', '/api/v1/auth/entrar', { email: 'bia@teste.com', senha: 'x' }, { 'X-Forwarded-For': '6.6.6.7' })).json();
  assert.equal(a.erro, b.erro, 'não revela se o e-mail existe');
  assert.equal((await R('GET', '/api/v1/hoje')).status, 401, 'sem sessão não entra');
});

test('9. clique duplo: 8 envios simultâneos contam uma resposta só', async () => {
  const { licao } = await (await R('GET', '/api/v1/licao', null, B)).json();
  const ex = licao.blocos.flatMap(b => b.exercicios || [])[0];
  const resp = ex.opcoes ? ex.opcoes[0] : 'x';
  await Promise.all(Array.from({ length: 8 }, () => R('POST', '/api/v1/licao/responder', { itemId: ex.id, resposta: resp }, B)));
  const exp = await (await R('GET', '/api/v1/dados/exportar', null, B)).json();
  assert.equal(exp.tentativas.filter(t => t.item_id === ex.id && t.origem === 'licao').length, 1);
});

test('gabarito não vaza para o navegador', async () => {
  const txt = await (await R('GET', '/api/v1/licao', null, A)).text();
  assert.doesNotMatch(txt, /"resposta":|"aceitas":/);
  const niv = await (await R('GET', '/api/v1/nivelamento', null, A)).text();
  assert.doesNotMatch(niv, /"resposta":/);
});

test('14/16. respostas sem hash/token, logout invalida a sessão e excluir conta apaga tudo', async () => {
  for (const u of ['/eu', '/hoje', '/plano', '/progresso', '/cartoes', '/conversas', '/dados', '/dados/exportar', '/assinatura'])
    assert.doesNotMatch(await (await R('GET', '/api/v1' + u, null, A)).text(), /senha_hash|scrypt\$|id_hash/i, u);
  await R('POST', '/api/v1/auth/sair', null, A);
  assert.equal((await R('GET', '/api/v1/eu', null, A)).status, 401);
  assert.equal((await R('POST', '/api/v1/conta/excluir', { senha: 'errada' }, B)).status, 401);
  assert.equal((await R('POST', '/api/v1/conta/excluir', { senha: 'frase longa de teste 2026' }, B)).status, 200);
  assert.equal((await R('GET', '/api/v1/eu', null, B)).status, 401);
  assert.equal((await R('POST', '/api/v1/auth/entrar', { email: 'bia@teste.com', senha: 'frase longa de teste 2026' }, ipNovo())).status, 401);
});
