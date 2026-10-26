'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-preparacao-'));
const port = 35000 + Math.floor(Math.random() * 400), baseURL = `http://localhost:${port}`;
const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(port), DATA_DIR: dir, NODE_ENV: 'test', AUTH_PROVIDER: 'local', BACKUP_DESLIGADO: '1', ANTHROPIC_API_KEY: '' }, stdio: 'ignore' });
let browser, db;
(async () => {
  for (let i = 0; i < 100; i++) { try { await fetch(baseURL + '/saude'); break; } catch { await new Promise(r => setTimeout(r, 50)); } }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
  const c = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const R = async (method, url, data) => { const r = await c.request.fetch('/api/v1' + url, { method, headers: { 'X-Inglou': '1' }, data }); assert.equal(r.status(), 200, await r.text()); return r.json(); };
  await R('POST', '/auth/cadastro', { nome: 'Aprendiz', idade: 30, papel: 'aluno', email: 'preparo@test.com', senha: 'senha de teste comprida 2026', consentimento: true });
  await R('PUT', '/perfil', { objetivo: 'zero', minutos_dia: 10, dias_semana: 5, interesses: [] });
  await R('POST', '/nivelamento', { nunca: true });
  db = new DatabaseSync(path.join(dir, 'inglou.db'));
  const uid = db.prepare('SELECT id FROM usuarios').get().id;
  // Começa na primeira oficina, depois das quatro partes de vocabulário.
  db.prepare("INSERT INTO competencias(user_id,missao,status,partes) VALUES(?, 'zero-sons','praticando',4)").run(uid);
  db.prepare('DELETE FROM licoes WHERE user_id=?').run(uid);
  const l = (await R('GET', '/licao')).licao;
  assert.equal(l.oficina, true);
  const page = await c.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/app/#/licao');
  await page.getByRole('button', { name: 'Vamos aprender', exact: true }).click();
  for (const _ of l.blocos[0].vocab) await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('heading', { name: 'Aprenda antes de responder', exact: true }).waitFor();
  assert.ok(await page.getByRole('button', { name: 'Ouvir o modelo', exact: true }).isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: '/tmp/inglou-preparacao-mobile.png', fullPage: true });
  const ex = l.blocos[1].exercicios[0];
  await page.getByRole('radio').filter({ hasText: ex.ensino.pt }).click();
  await page.getByRole('button', { name: 'Conferir', exact: true }).click();
  await page.locator('.retorno-exercicio:visible').waitFor();
  assert.equal(db.prepare('SELECT dica FROM tentativas WHERE user_id=? AND item_id=?').get(uid, ex.id).dica, 1);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  for (let i = 1; i < 4; i++) {
    await page.getByRole('button', { name: 'Ver resposta e aprender', exact: true }).click();
    await page.locator('.retorno-exercicio:visible').waitFor();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  }
  assert.equal(await page.locator('.ensino-exercicio').count(), 0, 'última questão retira o modelo');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const sessao = (await R('POST', '/sessao', { minutos: 5 })).sessao;
  assert.ok(sessao.itens.some(e => e.ensino), 'sessão curta também recebe o modelo');
  assert.deepEqual(errors, []);
  console.log('Chromium mobile: ensino por partes, áudio do modelo, prática com ajuda no servidor, retirada do apoio e sessão curta OK.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); db?.close(); srv.kill(); fs.rmSync(dir, { recursive: true, force: true }); });
