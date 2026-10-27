'use strict';
// Adequação à idade: o filtro em si e o caminho pela API (estudo sob medida e objetivo livre), com IA simulada.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const { avaliarPedido, saidaAdequada } = require('../src/motor/adequacao');

const crianca = { id: 'crianca', informado: true }, teen = { id: 'adolescente', informado: true }, adulto = { id: 'adulto', informado: true }, semIdade = { id: 'adulto', informado: false };
const ok = (t, p) => avaliarPedido({ descricao: t }, p).ok;

test('assuntos comuns de estudo passam em todas as idades', () => {
  for (const t of ['simple past', 'present perfect\npreposições', 'entrevista de cyber segurança: firewall, phishing, password', 'viagem: aeroporto, hotel, restaurante', 'how to crack a coding interview'])
    for (const p of [crianca, teen, adulto]) assert.ok(ok(t, p), `${t} / ${p.id}`);
});

test('conteúdo sexual explícito é barrado para todas as idades, inclusive com troca de letras', () => {
  for (const t of ['vocabulário de pornografia', 'p0rn vocabulary', 'cena de sexo em inglês', 'onlyfans'])
    for (const p of [crianca, teen, adulto]) assert.equal(ok(t, p), false, `${t} / ${p.id}`);
});

test('temas de adulto passam para adultos e são barrados para crianças, adolescentes e idade não informada', () => {
  for (const t of ['bebidas: beer and vodka no bar', 'apostas esportivas', 'palavrões em inglês', 'armas de fogo'])
    assert.ok(ok(t, adulto), `adulto: ${t}`);
  for (const t of ['bebidas: beer and vodka', 'apostas esportivas', 'palavrões em inglês', 'sexo seguro', 'cocaína'])
    for (const p of [crianca, teen, semIdade]) assert.equal(ok(t, p), false, `${t} / ${p.id}`);
});

test('autolesão e instruções de dano são barrados para todos; a mensagem de autolesão traz o CVV', () => {
  assert.equal(ok('how to make a bomb', adulto), false);
  const r = avaliarPedido({ descricao: 'quero vocabulário sobre suicídio' }, adulto);
  assert.equal(r.ok, false); assert.match(r.mensagem, /188/);
});

test('saída da IA: texto inadequado em qualquer campo reprova; conteúdo normal passa', () => {
  const bom = { explicacao: 'We use the past for finished actions.', exemplos: [{ en: 'I went to the beach.' }], exercicios: [{ frase: 'She ___ a cake.' }] };
  assert.ok(saidaAdequada(bom, crianca));
  assert.equal(saidaAdequada({ ...bom, exemplos: [{ en: 'He sold cocaine.' }] }, teen), false);
  assert.equal(saidaAdequada({ ...bom, exemplos: [{ en: 'They watched porn.' }] }, adulto), false);
  assert.ok(saidaAdequada({ ...bom, exemplos: [{ en: 'Do you want a beer?' }] }, adulto));
});

// ---- pela API ----
const PORTA = 21000 + Math.floor(Math.random() * 900), BASE = `http://localhost:${PORTA}`;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-adeq-'));
let srv, H = {};
const R = async (m, u, corpo) => { const r = await fetch(BASE + '/api/v1' + u, { method: m, headers: { ...H, ...(m !== 'GET' ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined }); const j = await r.json().catch(() => null); if (!r.ok) throw new Error(`${r.status} ${j?.erro}`); return j; };

before(async () => {
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'server.js')], { env: { ...process.env, AUTH_PROVIDER: 'local', PORT: PORTA, DATA_DIR: DIR, IA_FAKE: '1', NODE_ENV: 'test', ANTHROPIC_API_KEY: '' }, stdio: 'pipe' });
  for (let i = 0; i < 60; i++) { try { await fetch(BASE + '/saude'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  const r = await fetch(BASE + '/api/v1/auth/cadastro', { method: 'POST', headers: { 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Lia', email: 'lia@adeq.com', senha: 'senha segura de teste 2027', consentimento: true, idade: 14, responsavel: true }) });
  H = { Cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
});
after(() => { srv.kill(); fs.rmSync(DIR, { recursive: true, force: true }); });

test('API: adolescente não cria estudo, nem renomeia, nem escreve objetivo com tema inadequado', async () => {
  await assert.rejects(R('POST', '/sobmedida', { titulo: 'Festa', tipo: 'outro', descricao: 'vocabulário de bebidas: vodka e cerveja', material: '' }), /422/);
  await assert.rejects(R('POST', '/sobmedida', { titulo: 'Material', tipo: 'outro', descricao: 'present perfect e simple past', material: 'He sold cocaine to a friend and everybody knew it, so the police arrived at the school.' }), /422/);
  await assert.rejects(R('PUT', '/perfil', { objetivo: 'conversa', objetivo_detalhe: 'quero falar sobre apostas e cassino', minutos_dia: 15, dias_semana: 5 }), /422/);
  const { id } = await R('POST', '/sobmedida', { titulo: 'Prova de inglês', tipo: 'prova', descricao: 'simple past\npresent perfect', material: '' });
  await assert.rejects(R('PATCH', `/sobmedida/${id}`, { titulo: 'Aula de pornografia' }), /422/);
});

test('API: pedido normal de cyber segurança funciona para adolescente', async () => {
  const { id } = await R('POST', '/sobmedida', { titulo: 'Entrevista de cyber', tipo: 'entrevista', descricao: 'vocabulário de cyber segurança, falar da minha experiência', material: '' });
  const { estudo } = await R('GET', `/sobmedida/${id}`);
  assert.ok(estudo.assuntos.length >= 1);
});
