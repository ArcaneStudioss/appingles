'use strict';
// Ponta a ponta: errar na sessão traz a mesma questão no fim; acertar nela conta como recuperada, e a tentativa fica como prática com apoio.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const { respostaCerta } = require('../src/motor/correcao');

const PORT = 27000 + Math.floor(Math.random() * 900), BASE = `http://localhost:${PORT}/api/v1`, DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-segunda-'));
let srv, db, cookie;
async function R(m, u, body) { const r = await fetch(BASE + u, { method: m, headers: { Cookie: cookie, ...(m !== 'GET' ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, ...await r.json() }; }
before(async () => {
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '../server.js')], { env: { ...process.env, PORT: String(PORT), DATA_DIR: DIR, NODE_ENV: 'test', AUTH_PROVIDER: 'local', ANTHROPIC_API_KEY: '', ELEVENLABS_API_KEY: '', BACKUP_DESLIGADO: '1' }, stdio: 'ignore' });
  for (let n = 0; n < 80; n++) { try { await fetch(`http://localhost:${PORT}/saude`); break; } catch { await new Promise(r => setTimeout(r, 75)); } }
  const r = await fetch(BASE + '/auth/cadastro', { method: 'POST', headers: { 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Aprendiz', email: 'segunda@chance.test', senha: 'frase longa para estudar 2026', idade: 30, papel: 'aluno', consentimento: true }) });
  assert.equal(r.status, 200, await r.clone().text());
  cookie = r.headers.get('set-cookie').split(';')[0];
  await R('PUT', '/perfil', { objetivo: 'zero', minutos_dia: 15, dias_semana: 5, interesses: [] });
  await R('POST', '/nivelamento', { nunca: true });
  db = new DatabaseSync(path.join(DIR, 'inglou.db'));
});
after(() => { db?.close(); srv?.kill(); fs.rmSync(DIR, { recursive: true, force: true }); });

test('errou: a questão volta no fim; acertar nela conta como recuperada e não como acerto independente', async () => {
  const s = (await R('POST', '/sessao', { minutos: 10 })).sessao;
  assert.ok(Array.isArray(s.porque) && s.porque.length, 'a sessão explica como foi ajustada');
  assert.ok(s.adaptacao && s.itens.every(e => e.etapa));
  const completo = () => JSON.parse(db.prepare('SELECT dados FROM sessoes_guiadas').get().dados).itens;
  const alvo = s.itens.find(e => !e.ensino) || s.itens[0];
  const errada = await R('POST', '/sessao/responder', { itemId: alvo.id, resposta: 'zzz resposta errada' });
  assert.equal(errada.correto, false);
  assert.equal(errada.novaChance, true);
  assert.equal(errada.itens.length, s.itens.length + 1);
  const volta = errada.itens.at(-1);
  assert.equal(volta.origemId, alvo.id);
  assert.equal(volta.etapa, 'Tente de novo');
  assert.doesNotMatch(JSON.stringify(errada.itens), /"resposta":|"aceitas":/, 'a cópia não leva o gabarito para o navegador');
  for (const e of completo()) if (e.id !== alvo.id) assert.equal((await R('POST', '/sessao/responder', { itemId: e.id, resposta: respostaCerta(e) })).status, 200);
  const tent = db.prepare("SELECT item_id, correto, dica FROM tentativas WHERE origem='sessao' AND item_id=? ORDER BY id").all(alvo.id);
  assert.equal(tent.length, 2, 'a segunda chance registra no mesmo item');
  assert.equal(tent[1].correto, 1);
  assert.equal(tent[1].dica, 1, 'segunda chance conta como prática com apoio');
  const fim = await R('POST', '/sessao/concluir');
  assert.equal(fim.recuperadas, 1);
  assert.equal(fim.total, s.itens.length);
  assert.equal(fim.certas, s.itens.length);
});
