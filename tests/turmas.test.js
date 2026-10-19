'use strict';
// Turmas: professor cria turma, aluno entra por código, professor monta atividade e acompanha acertos e dificuldades.
// Também confere o que o professor NÃO pode ver e que quem não é da turma não acessa nada.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const { TODOS_EXERCICIOS } = require('../src/conteudo/missoes');

const PORTA = 21000 + Math.floor(Math.random() * 900), BASE = `http://localhost:${PORTA}`;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-turmas-'));
let srv; const U = {};
const R = async (quem, m, u, corpo) => {
  const r = await fetch(BASE + '/api/v1' + u, { method: m, headers: { Cookie: U[quem], ...(m !== 'GET' ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
  return { status: r.status, ...(j || {}), _texto: t };
};
const cadastrar = async (quem, nome) => {
  const r = await fetch(BASE + '/api/v1/auth/cadastro', { method: 'POST', headers: { 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, email: `${quem}@turmas.com`, senha: 'cafe-com-leite-9876', consentimento: true }) });
  assert.equal(r.status, 200, 'cadastro de ' + quem);
  U[quem] = (r.headers.get('set-cookie') || '').split(';')[0];
};
before(async () => {
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT: PORTA, DATA_DIR: DIR, NODE_ENV: 'test', ANTHROPIC_API_KEY: '' }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(BASE + '/saude'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  await cadastrar('prof', 'Profa Clara'); await cadastrar('ana', 'Ana Souza'); await cadastrar('beto', 'Beto Lima'); await cadastrar('fora', 'Pessoa de Fora');
});
after(() => { srv.kill(); try { fs.rmSync(DIR, { recursive: true, force: true }); } catch {} });

let turma, ativId;
const certa = e => (e.tipo === 'escolha' ? e.opcoes[e.resposta] : e.resposta[0]);

test('professor cria turma com código legível; aluno só entra ciente do que o professor vê', async () => {
  const c = await R('prof', 'POST', '/turmas', { nome: 'Inglês do dia a dia - 2026' });
  assert.equal(c.status, 200); turma = c.turma;
  assert.match(turma.codigo, /^[A-HJ-NP-Z2-9]{6}$/, 'sem 0/O/1/I/L');
  assert.match(turma.link, new RegExp(turma.codigo));
  assert.equal((await R('ana', 'POST', '/turmas/entrar', { codigo: turma.codigo })).status, 422, 'sem "ciente" não entra');
  assert.equal((await R('ana', 'POST', '/turmas/entrar', { codigo: 'ZZZZZZ', ciente: true })).status, 404);
  assert.equal((await R('prof', 'POST', '/turmas/entrar', { codigo: turma.codigo, ciente: true })).status, 409, 'professor não entra na própria turma');
  const minusculo = turma.codigo.slice(0, 3).toLowerCase() + '-' + turma.codigo.slice(3);
  assert.equal((await R('ana', 'POST', '/turmas/entrar', { codigo: minusculo, ciente: true })).status, 200, 'código com traço e minúsculas');
  assert.equal((await R('beto', 'POST', '/turmas/entrar', { codigo: turma.codigo, ciente: true })).status, 200);
  assert.equal((await R('ana', 'POST', '/turmas/entrar', { codigo: turma.codigo, ciente: true })).status, 200, 'entrar de novo não duplica');
  const t = await R('prof', 'GET', `/turmas/${turma.id}`);
  assert.equal(t.alunos.length, 2);
});

test('professor monta atividade com perguntas do banco e perguntas próprias; pergunta inválida é recusada', async () => {
  const banco = await R('prof', 'GET', '/professor/banco');
  assert.ok(banco.missoes.some(m => m.id === 'banco') && banco.missoes.some(m => m.id === 'clinica'));
  const ruim = await R('prof', 'POST', `/turmas/${turma.id}/atividades`, { titulo: 'Teste', proprias: [{ tipo: 'lacuna', frase: 'duas ___ lacunas ___', resposta: ['x'] }] });
  assert.equal(ruim.status, 422);
  assert.equal((await R('prof', 'POST', `/turmas/${turma.id}/atividades`, { titulo: 'Vazia' })).status, 422);
  const ok = await R('prof', 'POST', `/turmas/${turma.id}/atividades`, {
    titulo: 'Banco e clínica', descricao: 'Revisão antes da prova', prazo: '2026-12-01',
    banco: ['banco-1', 'banco-2', 'clinica-2'],
    proprias: [{ tipo: 'traduzir', pt: 'Bom dia, professora.', aceitas: ['Good morning, teacher'] }],
  });
  assert.equal(ok.status, 200); ativId = ok.id;
  assert.equal((await R('fora', 'POST', `/turmas/${turma.id}/atividades`, { titulo: 'Invasão', banco: ['banco-1'] })).status, 404, 'quem não é professor da turma não cria');
});

test('aluno faz a atividade: sem gabarito no navegador, correção no servidor, resposta repetida não conta duas vezes', async () => {
  const a = await R('ana', 'GET', `/atividades/${ativId}`);
  assert.equal(a.status, 200); assert.equal(a.itens.length, 4);
  assert.doesNotMatch(a._texto, /"aceitas"/, 'o gabarito não vai ao navegador');
  assert.ok(a.itens.every(i => !('resposta' in i)));
  const ex = id => TODOS_EXERCICIOS[id];
  // Ana: acerta banco-1, erra banco-2, acerta clinica-2 e a própria
  const r1 = await R('ana', 'POST', `/atividades/${ativId}/responder`, { itemId: 'i1', resposta: certa(ex('banco-1')), tempoMs: 5000 });
  assert.equal(r1.correto, true);
  const r2 = await R('ana', 'POST', `/atividades/${ativId}/responder`, { itemId: 'i2', resposta: 'zzz', tempoMs: 4000 });
  assert.equal(r2.correto, false); assert.ok(r2.esperado && r2.explica);
  assert.equal((await R('ana', 'POST', `/atividades/${ativId}/responder`, { itemId: 'i3', resposta: 'since', tempoMs: 3000 })).correto, true);
  assert.equal((await R('ana', 'POST', `/atividades/${ativId}/responder`, { itemId: 'i4', resposta: 'Good morning, teacher', tempoMs: 6000 })).correto, true);
  assert.equal((await R('ana', 'POST', `/atividades/${ativId}/responder`, { itemId: 'i1', resposta: 'outra', tempoMs: 1 })).repetida, true);
  // Beto: erra duas
  await R('beto', 'POST', `/atividades/${ativId}/responder`, { itemId: 'i2', resposta: 'nope', tempoMs: 3000 });
  await R('beto', 'POST', `/atividades/${ativId}/responder`, { itemId: 'i3', resposta: 'for', tempoMs: 3000 });
  assert.equal((await R('fora', 'GET', `/atividades/${ativId}`)).status, 404, 'quem não é da turma não abre a atividade');
  assert.equal((await R('fora', 'POST', `/atividades/${ativId}/responder`, { itemId: 'i1', resposta: 'x' })).status, 404);
});

test('professor acompanha acertos por aluno e por pergunta e as dificuldades da turma, sem ver o que o aluno digitou', async () => {
  const d = await R('prof', 'GET', `/turmas/${turma.id}/atividades/${ativId}`);
  assert.equal(d.status, 200);
  const ana = d.alunos.find(x => x.nome === 'Ana Souza'), beto = d.alunos.find(x => x.nome === 'Beto Lima');
  assert.equal(ana.feitas, 4); assert.equal(ana.certas, 3); assert.equal(ana.pct, 75); assert.equal(ana.concluiu, true);
  assert.equal(beto.feitas, 2); assert.equal(beto.certas, 0); assert.equal(beto.concluiu, false);
  assert.equal(d.resumo.concluiram, 1);
  const i2 = d.itens.find(i => i.id === 'i2'); assert.equal(i2.respondentes, 2); assert.equal(i2.certas, 0); assert.equal(i2.pct, 0);
  assert.doesNotMatch(d._texto, /zzz|nope/, 'o que o aluno digitou nunca chega ao professor');
  const t = await R('prof', 'GET', `/turmas/${turma.id}`);
  assert.equal(t.resumo.respostas, 6);
  assert.ok(Array.isArray(t.dificuldades) && t.dificuldades.length >= 1);
  assert.ok(t.alunos.every(a => !('resposta' in a)));
  assert.doesNotMatch(t._texto, /zzz|nope/);
  assert.equal((await R('ana', 'GET', `/turmas/${turma.id}`)).status, 404, 'aluno não abre o painel do professor');
  assert.equal((await R('fora', 'GET', `/turmas/${turma.id}/atividades/${ativId}`)).status, 404);
});

test('pendências aparecem para o aluno; sair da turma apaga as respostas dele nela', async () => {
  const lista = await R('beto', 'GET', '/turmas');
  assert.equal(lista.aluno.length, 1); assert.equal(lista.aluno[0].pendentes, 1);
  assert.equal((await R('beto', 'POST', `/turmas/${turma.id}/sair`)).status, 200);
  const t = await R('prof', 'GET', `/turmas/${turma.id}`);
  assert.equal(t.alunos.length, 1); assert.equal(t.resumo.respostas, 4, 'as respostas do Beto saíram junto');
});

test('professor troca o código, remove aluno e apaga a turma (cascata)', async () => {
  const novo = await R('prof', 'POST', `/turmas/${turma.id}/codigo`);
  assert.notEqual(novo.codigo, turma.codigo);
  assert.equal((await R('beto', 'POST', '/turmas/entrar', { codigo: turma.codigo, ciente: true })).status, 404, 'código antigo deixa de valer');
  const ana = (await R('prof', 'GET', `/turmas/${turma.id}`)).alunos[0];
  assert.equal((await R('prof', 'DELETE', `/turmas/${turma.id}/alunos/${ana.id}`)).status, 200);
  assert.equal((await R('prof', 'GET', `/turmas/${turma.id}`)).alunos.length, 0);
  assert.equal((await R('fora', 'DELETE', `/turmas/${turma.id}`)).status, 404);
  assert.equal((await R('prof', 'DELETE', `/turmas/${turma.id}`)).status, 200);
  assert.equal((await R('prof', 'GET', `/turmas/${turma.id}`)).status, 404);
});

test('exportar meus dados inclui a participação em turmas (só as minhas linhas)', async () => {
  const c = await R('prof', 'POST', '/turmas', { nome: 'Outra' });
  await R('ana', 'POST', '/turmas/entrar', { codigo: c.turma.codigo, ciente: true });
  const ex = await R('ana', 'GET', '/dados/exportar');
  assert.equal(ex.turmas.comoAluno.length, 1);
  assert.doesNotMatch(ex._texto, /Profa Clara|prof@turmas/, 'sem dados do professor');
});
