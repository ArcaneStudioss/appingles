'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-personagens-'));
const port = 35500 + Math.floor(Math.random() * 400), baseURL = `http://localhost:${port}`;
const srv = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(port), DATA_DIR: dir, NODE_ENV: 'test', AUTH_PROVIDER: 'local', BACKUP_DESLIGADO: '1', ANTHROPIC_API_KEY: '' }, stdio: 'ignore' });
let browser;
(async () => {
  for (let i = 0; i < 100; i++) { try { await fetch(baseURL + '/saude'); break; } catch { await new Promise(r => setTimeout(r, 50)); } }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
  const page = await browser.newPage({ baseURL, viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Usa os componentes reais, isolando somente a resposta do servidor.
  await page.route('**/personagens-fixture', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/css/app.css"><body data-publico="adulto"><main style="max-width:650px;margin:auto;padding:16px"></main>' }));
  await page.goto('/personagens-fixture');
  await page.evaluate(async () => {
    const fonte = await (await fetch('/assets/js/companheiros.js')).text();
    const versao = fonte.match(/diversao\.js\?v=([^']+)/)[1];
    window.diversao = await import('/assets/js/diversao.js?v=' + versao);
    window.companheiros = await import('/assets/js/companheiros.js?v=' + versao);
    const { exercicio } = await import('/assets/js/telas/exercicio.js?v=' + versao);
    window.montar = (ajuda = false) => document.querySelector('main').replaceChildren(exercicio({ id: 'teste', tipo: 'escolha', pergunta: 'Como dizer olá?', opcoes: ['Hello', 'Goodbye'] }, {
      responder: async () => ({ correto: true, ajuda, sequencia: 3, resposta: 'Hello', explica: 'Hello significa olá.' }),
      aoProximo: () => { window.continuou = true; }, relatar: false,
    }));
    window.montar();
  });
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Conferir', exact: true }).click();
  await page.locator('[data-fase="combo"]').waitFor();
  const poses = await page.evaluate(() => {
    for (const a of document.querySelector('.dupla').getAnimations({ subtree: true })) { a.pause(); a.currentTime = 1000; }
    const style = s => getComputedStyle(document.querySelector(s));
    return { asa: style('.dupla__voador').opacity, pousado: style('.dupla__pousado').opacity, perna: style('.mia__perna--esquerda').transform, braco: style('.mia__braco--direito').transform };
  });
  assert.equal(poses.asa, '1'); assert.equal(poses.pousado, '0');
  assert.notEqual(poses.perna, 'none'); assert.notEqual(poses.braco, 'none');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `sem rolagem lateral em ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/inglou-personagens-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.locator('.voo-festa__mia').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => window.continuou), true);
  assert.equal(await page.locator('.voo-festa').evaluate(e => getComputedStyle(e).pointerEvents), 'none');
  await page.evaluate(() => { window.diversao.voarComemorando({ companhia: true }); window.diversao.voarComemorando({ companhia: true }); });
  assert.equal(await page.locator('.voo-festa').count(), 1, 'comemorações não acumulam camadas');
  await page.locator('.voo-festa').waitFor({ state: 'detached', timeout: 5000 });
  await page.evaluate(() => { window.diversao.voarComemorando({ companhia: true }); location.hash = '/hoje'; });
  await page.locator('.voo-festa').waitFor({ state: 'detached' });
  await page.evaluate(() => window.diversao.voarComemorando({ companhia: true }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.voo-festa').waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => window.diversao.voarComemorando({ companhia: true })), null);
  assert.equal(await page.locator('.dupla').evaluate(e => e.getAnimations({ subtree: true }).length), 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => document.querySelector('main').replaceChildren(window.companheiros.duplaPersonagens({ acao: 'fim', silencioso: true })));
  assert.equal(await page.locator('.dupla').evaluate(e => e.getAnimations({ subtree: true }).length), 0, 'resposta antiga não repete a festa');
  await page.evaluate(() => window.montar(true));
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Conferir', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  assert.equal(await page.locator('.voo-festa').count(), 0, 'resposta com ajuda não dispara vitória');
  assert.deepEqual(errors, []);
  console.log('Chromium: voo, dança, exercício real, três larguras, navegação, limpeza e movimento reduzido OK.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); srv.kill(); fs.rmSync(dir, { recursive: true, force: true }); });
