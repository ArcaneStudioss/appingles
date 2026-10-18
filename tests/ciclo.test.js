'use strict';
// O ciclo que diferencia o Inglou, de ponta a ponta pela API (com IA simulada: IA_FAKE=1, sem custo):
// objetivo -> exercícios da situação do aluno -> conversa -> foco na lição seguinte -> teste em situação nova -> superado;
// tarefa sem ajuda -> demonstrado -> dias depois, nova situação -> mantido.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORTA = 20000 + Math.floor(Math.random() * 900), BASE = `http://localhost:${PORTA}`;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-ciclo-'));
let srv, H = {}, db, uid;
const R = async (m, u, corpo) => { const r = await fetch(BASE + '/api/v1' + u, { method: m, headers: { ...H, ...(m !== 'GET' ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined }); const j = await r.json().catch(() => null); if (!r.ok) throw new Error(`${m} ${u} -> ${r.status} ${j?.erro}`); return j; };
const novoDia = () => db.prepare('DELETE FROM licoes WHERE user_id = ?').run(uid);   // simula a virada do dia

async function responderTudo(licao) {
  for (const b of licao.blocos) for (const ex of b.exercicios || []) {
    const resp = ex.tipo === 'pares' ? 'erros:0' : ex.opcoes ? ex.opcoes[0] : ex.palavras ? ex.palavras.join(' ') : 'x';
    await R('POST', '/licao/responder', { itemId: ex.id, resposta: resp, tempoMs: 4000 });
  }
}

before(async () => {
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT: PORTA, DATA_DIR: DIR, IA_FAKE: '1', NODE_ENV: 'test', ANTHROPIC_API_KEY: '' }, stdio: 'pipe' });
  for (let i = 0; i < 60; i++) { try { await fetch(BASE + '/saude'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  const r = await fetch(BASE + '/api/v1/auth/cadastro', { method: 'POST', headers: { 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Bruno', email: 'bruno@ciclo.com', senha: 'enfermeiro no canada 2027', consentimento: true }) });
  H = { Cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  db = new DatabaseSync(path.join(DIR, 'inglou.db'));
  uid = db.prepare("SELECT id FROM usuarios WHERE email = 'bruno@ciclo.com'").get().id;
});
after(() => { db?.close(); srv.kill(); fs.rmSync(DIR, { recursive: true, force: true }); });

test('objetivo de entrevista monta a trilha de entrevista e a lição traz exercícios da situação do aluno', async () => {
  await R('PUT', '/perfil', { objetivo: 'entrevista', objetivo_detalhe: 'Entrevista para enfermeiro num hospital no Canadá', prazo: null, minutos_dia: 15, dias_semana: 5, area: 'enfermagem', interesses: ['saúde'] });
  const { itens } = await R('GET', '/nivelamento');
  const { plano } = await R('POST', '/nivelamento', { respostas: Object.fromEntries(itens.map(i => [i.id, { resposta: i.opcoes[0], tempoMs: 3000 }])), escrita: '', fala: '' });
  assert.equal(plano.objetivo, 'entrevista');
  assert.ok(plano.missoes.some(m => m.id === 'perguntas-entrevista'));
  const { licao } = await R('GET', '/licao');
  const pers = licao.blocos.find(b => b.personalizado);
  assert.ok(pers, 'bloco feito para a situação do aluno');
  assert.equal(pers.exercicios.length, 3, 'o item inválido da IA foi descartado');
  assert.ok(licao.porque.some(t => /enfermagem/.test(t) && /Canadá/.test(t)));
  assert.ok(!JSON.stringify(licao).includes('respostas_aceitas'));
  const r = await R('POST', '/licao/responder', { itemId: pers.exercicios[2].id, resposta: 'I work in the ER' });
  assert.ok(r.correto, 'gabarito da IA corrige no servidor');
});

test('o que trava na conversa vira o começo da próxima lição, com outra abordagem depois', async () => {
  const c = await R('POST', '/conversas', { cenario: 'entrevista-trajetoria' });
  const t = await R('POST', `/conversas/${c.id}/mensagem`, { texto: 'I have 31 years and I work in this hospital since 2015.' });
  const tags = t.correcoes.map(x => x.tag);
  assert.ok(tags.includes('idade-have') && tags.includes('tempo-desde'), tags.join());
  const fim = await R('POST', `/conversas/${c.id}/encerrar`);
  assert.match(fim.proximo, /próxima lição começa por/);
  novoDia();
  const { licao } = await R('GET', '/licao');
  assert.equal(licao.blocos[0].tipo, 'foco');
  assert.ok(['idade-have', 'tempo-desde'].includes(licao.blocos[0].tag));
  assert.match(licao.porque[0], /conversa/);
  assert.ok((await R('GET', '/cartoes')).cartoes.some(x => x.tipo === 'erro'), 'o erro virou cartão de revisão');
  await responderTudo(licao);
  await R('POST', '/licao/concluir');
  const foco = db.prepare("SELECT * FROM focos WHERE user_id = ? AND tag = ?").get(uid, licao.blocos[0].tag);
  assert.equal(foco.status, 'praticando');
  assert.ok(foco.retestar_em > new Date().toISOString().slice(0, 10), 'teste marcado para dias depois');
});

test('dias depois: teste numa situação nova, sem dicas; sem o erro, a dificuldade fica superada', async () => {
  const foco = db.prepare("SELECT * FROM focos WHERE user_id = ? AND status = 'praticando' ORDER BY id LIMIT 1").get(uid);
  db.prepare("UPDATE focos SET retestar_em = '2000-01-01' WHERE id = ?").run(foco.id);
  db.prepare("UPDATE focos SET status = 'superado' WHERE user_id = ? AND id <> ?").run(uid, foco.id);   // isola este foco
  novoDia();
  const { licao } = await R('GET', '/licao');
  const bi = licao.blocos.findIndex(b => b.tipo === 'producao' && b.reteste && b.focoId === foco.id);
  assert.ok(bi >= 0, 'bloco de reteste do foco');
  assert.equal(licao.blocos[bi].tarefa.dicas.length, 0);
  const r = await R('POST', '/licao/producao', { bloco: bi, texto: "I'm 31 years old. I've worked at this hospital since 2015, and I've been a nurse for ten years. Last year I moved to the emergency room.", usouAjuda: false });
  assert.equal(r.evento, 'foco_superado');
  assert.equal(db.prepare('SELECT status FROM focos WHERE id = ?').get(foco.id).status, 'superado');
});

test('tarefa feita sem ajuda vira "demonstrado" e, dias depois, numa situação nova, "mantido"', async () => {
  db.prepare("UPDATE focos SET status = 'superado' WHERE user_id = ?").run(uid);
  db.prepare("INSERT INTO competencias (user_id, missao, status, partes) VALUES (?, 'apresentar', 'praticando', 2) ON CONFLICT(user_id, missao) DO UPDATE SET status = 'praticando', partes = 2").run(uid);
  novoDia();
  let { licao } = await R('GET', '/licao');
  let bi = licao.blocos.findIndex(b => b.tipo === 'producao' && !b.reteste && b.missao === 'apresentar');
  assert.ok(bi >= 0, 'última parte traz a tarefa real');
  const comAjuda = await R('POST', '/licao/producao', { bloco: bi, texto: "Hi, I'm Bruno. I'm a nurse and I work at a public hospital in Recife. I'm responsible for the night team. Currently, I'm learning English because I want to work in Canada.", usouAjuda: true });
  assert.notEqual(comAjuda.evento, 'demonstrado', 'com dica é prática, não demonstração');
  const r = await R('POST', '/licao/producao', { bloco: bi, texto: "Hi, I'm Bruno. I'm a nurse and I work at a public hospital in Recife. I'm responsible for the night team. Currently, I'm learning English because I want to work in Canada.", usouAjuda: false });
  assert.equal(r.evento, 'demonstrado');
  db.prepare("UPDATE competencias SET demonstrado_em = '2026-01-01T10:00:00.000Z' WHERE user_id = ? AND missao = 'apresentar'").run(uid);
  novoDia();
  ({ licao } = await R('GET', '/licao'));
  bi = licao.blocos.findIndex(b => b.tipo === 'producao' && b.reteste && b.missao === 'apresentar');
  assert.ok(bi >= 0, 'reteste da missão');
  const r2 = await R('POST', '/licao/producao', { bloco: bi, texto: "Hello everyone, I'm Bruno. I'm a nurse, and I work in the emergency room of a hospital in Recife. Currently, I'm preparing for an interview in Canada, so I study English every day.", usouAjuda: false });
  assert.equal(r2.evento, 'retido');
  const p = await R('GET', '/progresso');
  assert.ok(p.demonstrado.retidas.some(m => m.id === 'apresentar'));
  assert.ok(p.demonstrado.superados.length >= 1);
  assert.ok(p.conquistas.some(c => c.codigo === 'primeira-licao'));
});

test('material da vida do aluno vira vocabulário, exercícios e cartões', async () => {
  const { id } = await R('POST', '/materiais', { titulo: 'Vaga Toronto', texto: 'We are looking for a Registered Nurse to join our emergency department. Candidates must have experience in triage and strong communication skills.' });
  const { material } = await R('GET', '/materiais/' + id);
  assert.equal(material.vocab[0].en, 'triage');
  assert.ok(!JSON.stringify(material).includes('"resposta"'));
  assert.ok((await R('POST', `/materiais/${id}/responder`, { itemId: 'mat:0', resposta: 'triage' })).correto);
  assert.equal((await R('POST', `/materiais/${id}/cartoes`, { indices: [0] })).criados, 1);
});
