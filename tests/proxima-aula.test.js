'use strict';
// Adiantar a trilha: depois de concluir a aula do dia, o aluno pode fazer a próxima parte da missão (até 3 aulas por dia).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORT = 24500 + Math.floor(Math.random() * 400), BASE = `http://localhost:${PORT}/api/v1`;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-proxima-'));
let servidor, cookie;
async function R(metodo, rota, corpo) {
  const r = await fetch(BASE + rota, { method: metodo, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(metodo !== 'GET' ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  if (r.headers.get('set-cookie')) cookie = r.headers.get('set-cookie').split(';')[0];
  return { status: r.status, ...(await r.json()) };
}
async function fazerAula() {
  const { licao } = await R('GET', '/licao');
  for (const e of licao.blocos.flatMap(b => b.exercicios || []).filter(e => e.tipo !== 'pares')) {
    assert.equal((await R('POST', '/licao/responder', { itemId: e.id, revelar: true, tempoMs: 1000 })).status, 200);
  }
  return R('POST', '/licao/concluir');
}
before(async () => {
  servidor = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'server.js')], { env: { ...process.env, AUTH_PROVIDER: 'local', PORT, DATA_DIR: DIR, BACKUP_DESLIGADO: '1', NODE_ENV: 'test', ANTHROPIC_API_KEY: '' }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://localhost:${PORT}/saude`); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  assert.equal((await R('POST', '/auth/cadastro', { nome: 'Aluna Rápida', email: 'rapida@proxima.test', idade: 30, papel: 'aluno', senha: 'uma frase longa de teste 2026', consentimento: true })).status, 200);
  assert.equal((await R('PUT', '/perfil', { objetivo: 'zero', minutos_dia: 10, dias_semana: 5, interesses: [] })).status, 200);
  assert.equal((await R('POST', '/nivelamento', { nunca: true })).status, 200);
});
after(() => { servidor?.kill(); fs.rmSync(DIR, { recursive: true, force: true }); });

test('só adianta depois de concluir, segue para a próxima parte e para em 3 aulas por dia', async () => {
  assert.equal((await R('POST', '/licao/proxima')).status, 409, 'aula do dia ainda aberta');
  const primeira = (await R('GET', '/licao')).licao.missao;
  assert.equal(primeira.parte, 1);
  const c1 = await fazerAula();
  assert.equal(c1.proximaDisponivel, true);
  assert.equal((await R('GET', '/hoje')).licao.proximaDisponivel, true);
  const p1 = await R('POST', '/licao/proxima');
  assert.equal(p1.status, 200);
  assert.equal(p1.missao.parte, 2);
  const segunda = await R('GET', '/licao');
  assert.equal(segunda.status, 'aberta');
  assert.equal(segunda.licao.missao.parte, 2);
  await fazerAula();
  assert.equal((await R('POST', '/licao/proxima')).status, 200);
  const c3 = await fazerAula();
  assert.equal(c3.proximaDisponivel, false, 'terceira aula do dia fecha o adiantamento');
  const limite = await R('POST', '/licao/proxima');
  assert.equal(limite.status, 409);
  assert.match(limite.erro || limite.mensagem || JSON.stringify(limite), /3 aulas/);
  assert.equal((await R('GET', '/licao')).licao.missao.parte, 3, 'a aula do dia continua sendo a última feita');
});
