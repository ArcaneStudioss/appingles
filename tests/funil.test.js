'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawn } = require('node:child_process');
const PORT = 27000 + Math.floor(Math.random() * 900), BASE = `http://localhost:${PORT}/api/v1`, DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-funil-'));
let srv; const cookies = [];
async function cadastrar(n) {
  const r = await fetch(BASE + '/auth/cadastro', { method: 'POST', headers: { 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Pessoa ' + n, email: `f${n}@funil.test`, senha: 'frase longa para estudar 2026', idade: 30, papel: 'aluno', consentimento: true, responsavel: true }) });
  assert.equal(r.status, 200);
  cookies.push(r.headers.get('set-cookie').split(';')[0]);
}
before(async () => {
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '../server.js')], { env: { ...process.env, PORT: String(PORT), DATA_DIR: DIR, NODE_ENV: 'test', AUTH_PROVEDOR: 'local', INGLOU_ADMIN_IDS: '1', ANTHROPIC_API_KEY: '', ELEVENLABS_API_KEY: '', BACKUP_DESLIGADO: '1' }, stdio: 'pipe' });
  for (let n = 0; n < 80; n++) { try { await fetch(`http://localhost:${PORT}/saude`); break; } catch { await new Promise(r => setTimeout(r, 75)); } }
  await cadastrar(1); await cadastrar(2);
});
after(() => { srv?.kill(); fs.rmSync(DIR, { recursive: true, force: true }); });
test('funil: só a equipe vê e os números contam as pessoas cadastradas', async () => {
  const admin = await fetch(BASE + '/admin/funil', { headers: { Cookie: cookies[0] } });
  assert.equal(admin.status, 200);
  const d = await admin.json();
  assert.equal(d.semanas.reduce((s, w) => s + w.cadastros, 0), 2);
  assert.ok(d.semanas.every(w => w.primeiraAula <= w.cadastros && w.voltou <= w.cadastros));
  assert.equal((await fetch(BASE + '/admin/funil', { headers: { Cookie: cookies[1] } })).status, 403);
});
