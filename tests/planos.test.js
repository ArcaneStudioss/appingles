'use strict';
// Planos: Básico (limite diário, sem IA), Família (até 5 contas, cota dividida), Turma (professor + até 20 alunos),
// teste grátis do Completo e a regra de quem herda o plano de quem paga.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const assin = require('../src/assinatura');

test('modelo de planos: preços abaixo do Duolingo, teste é do Completo, Básico sem IA e com limite por dia', () => {
  assert.deepEqual(Object.keys(assin.PLANOS), ['basico', 'completo', 'familia', 'turma']);
  assert.equal(assin.PLANOS.basico.precos.mensal.centavos, 990);
  assert.equal(assin.PLANOS.completo.precos.mensal.centavos, 1990);
  assert.ok(assin.PLANOS.completo.precos.anual.centavos < 17990, 'anual individual abaixo dos R$ 179,90 do Duolingo');
  assert.ok(assin.PLANOS.familia.precos.anual.centavos < 26990, 'família anual abaixo dos R$ 269,90 do Duolingo');
  const teste = assin.estado(assin.novaAssinatura('2026-10-19'), '2026-10-20');
  assert.equal(teste.nivel, 'completo'); assert.equal(teste.status, 'teste');
  const b = assin.estado(assin.assinar(assin.novaAssinatura('2026-10-19'), 'basico', '2026-12-01', 'anual'), '2026-12-02');
  assert.equal(b.nivel, 'basico'); assert.equal(b.periodo, 'anual');
  assert.ok(Object.values(assin.limitesDe(b)).every(v => v === 0), 'Básico não usa IA');
  assert.equal(assin.limitesDiaDe(b).revisao, 20);
  assert.equal(assin.limitesDiaDe(teste), null, 'Completo não tem limite diário');
  assert.equal(assin.estado({ status: 'ativa', plano: 'mensal', periodo_ate: '2027-01-01' }, '2026-12-01').nivel, 'completo', 'assinatura antiga (mensal/anual) vira Completo');
  assert.equal(assin.limitesDe({ acesso: 'completo', nivel: 'familia' }).conversa, assin.LIMITES.pago.conversa * 3);
});

const PORTA = 23000 + Math.floor(Math.random() * 900), BASE = `http://localhost:${PORTA}`;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-planos-'));
let srv, db; const tok = {};
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
// cria conta direto no banco (o cadastro tem limite de 8 por hora) e devolve o cookie de sessão
function conta(quem, { assinatura } = {}) {
  const agora = new Date().toISOString();
  const id = Number(db.prepare('INSERT INTO usuarios (email, nome, senha_hash, criado_em, consentiu_em) VALUES (?,?,?,?,?)').run(`${quem}@planos.com`, `Pessoa ${quem}`, 'x', agora, agora).lastInsertRowid);
  db.prepare('INSERT INTO perfis (user_id, atualizado_em) VALUES (?,?)').run(id, agora);
  db.prepare('INSERT INTO assinaturas (user_id, dados) VALUES (?,?)').run(id, JSON.stringify(assinatura || assin.novaAssinatura(new Date().toISOString().slice(0, 10))));
  const t = crypto.randomBytes(16).toString('hex'); tok[quem] = `inglou_sessao=${t}`;
  db.prepare('INSERT INTO sessoes (id_hash, user_id, criado_em, expira_em) VALUES (?,?,?,?)').run(sha(t), id, Date.now(), Date.now() + 864e5);
  return id;
}
const R = async (quem, m, u, corpo) => {
  const r = await fetch(BASE + '/api/v1' + u, { method: m, headers: { Cookie: tok[quem], 'X-Forwarded-For': '10.1.' + (quem.length * 7 + [...quem].reduce((a, c) => a + c.charCodeAt(0), 0)) % 250 + '.' + quem.length, ...(m !== 'GET' ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch {}
  return { ...j, status: r.status };
};
const hojeSP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const teste_vencido = () => ({ status: 'teste', plano: null, teste_ate: '2020-01-01', periodo_ate: null, historico: [] });

before(async () => {
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT: PORTA, DATA_DIR: DIR, NODE_ENV: 'test', ANTHROPIC_API_KEY: '', BACKUP_DESLIGADO: '1', PAGAMENTO_MODO: 'simulado', CONTATO_URL: 'https://wa.me/5500000000000' }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(BASE + '/saude'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  db = new DatabaseSync(path.join(DIR, 'inglou.db')); db.exec('PRAGMA busy_timeout = 4000');
});
after(() => { srv.kill(); try { db.close(); } catch {} try { fs.rmSync(DIR, { recursive: true, force: true }); } catch {} });

test('Básico: 20 cartões, 1 conversa e 3 perguntas por dia; sem treino novo, sem estudo sob medida, sem IA', async () => {
  conta('basico');
  const ass = await R('basico', 'POST', '/assinatura/assinar', { plano: 'basico', periodo: 'mensal' });
  assert.equal(ass.status, 200); assert.equal(ass.estado.nivel, 'basico');
  const info = await R('basico', 'GET', '/assinatura');
  assert.equal(info.limitesDia.basico.revisao, 20); assert.match(info.contato, /wa\.me/); assert.equal(info.estado.limitesDia.conversa, 1);
  for (let i = 0; i < 22; i++) assert.equal((await R('basico', 'POST', '/cartoes', { frente: `palavra ${i}`, verso: `word ${i}` })).status, 200);
  const fila = await R('basico', 'GET', '/cartoes/revisar');
  assert.equal(fila.cartoes.length, 20, 'a fila do dia já vem cortada no limite'); assert.equal(fila.total, 22);
  for (const c of fila.cartoes) assert.equal((await R('basico', 'POST', `/cartoes/${c.id}/revisar`, { nota: 4 })).status, 200);
  const todos = (await R('basico', 'GET', '/cartoes')).cartoes.filter(c => c.vence_em <= hojeSP());
  assert.equal(todos.length, 2);
  const estouro = await R('basico', 'POST', `/cartoes/${todos[0].id}/revisar`, { nota: 4 });
  assert.equal(estouro.status, 429); assert.match(estouro.erro, /limite de hoje.*Básico/);
  assert.equal((await R('basico', 'GET', '/cartoes/revisar')).cartoes.length, 0);
  assert.equal((await R('basico', 'POST', '/conversas', { cenario: 'apresentacao' })).status, 200);
  assert.equal((await R('basico', 'POST', '/conversas', { cenario: 'apresentacao' })).status, 429);
  for (let i = 0; i < 3; i++) assert.equal((await R('basico', 'POST', '/tutor', { pergunta: 'quando usar the?' })).status, 200);
  assert.equal((await R('basico', 'POST', '/tutor', { pergunta: 'quando usar the?' })).status, 429);
  assert.equal((await R('basico', 'POST', '/sobmedida', { titulo: 'Prova', tipo: 'prova', descricao: 'present simple, past simple' })).status, 402);
  assert.equal((await R('basico', 'POST', '/treino/novo', {})).status, 402);
});

test('Completo: sem limite diário de cartões e conversas', async () => {
  conta('completo');
  assert.equal((await R('completo', 'POST', '/assinatura/assinar', { plano: 'completo', periodo: 'anual' })).status, 200);
  for (let i = 0; i < 3; i++) assert.equal((await R('completo', 'POST', '/conversas', { cenario: 'apresentacao' })).status, 200);
  assert.equal((await R('completo', 'GET', '/assinatura')).estado.limitesDia, null);
});

test('Família: dono assina, até 4 pessoas entram por código (5 no total), quem tem o teste vencido herda o plano e sai quando quiser', async () => {
  conta('dono'); await R('dono', 'POST', '/assinatura/assinar', { plano: 'familia', periodo: 'mensal' });
  assert.equal((await R('dono', 'GET', '/familia')).papel, 'dono');
  const { codigo } = await R('dono', 'POST', '/familia/codigo');
  assert.match(codigo, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal((await R('basico', 'GET', '/familia')).papel, null, 'quem não é da família não vê nada');
  const ids = [];
  for (let i = 1; i <= 5; i++) ids.push(conta('fam' + i, { assinatura: teste_vencido() }));
  assert.equal((await R('fam1', 'GET', '/assinatura')).estado.acesso, 'livre', 'sem família: acesso livre');
  for (let i = 1; i <= 4; i++) assert.equal((await R('fam' + i, 'POST', '/familia/entrar', { codigo })).status, 200, 'entra ' + i);
  assert.equal((await R('fam5', 'POST', '/familia/entrar', { codigo })).status, 409, 'a 5ª vaga é do dono: a sexta pessoa não entra');
  assert.equal((await R('fam5', 'POST', '/familia/entrar', { codigo: 'ZZZZZZ' })).status, 404);
  const est = (await R('fam1', 'GET', '/assinatura')).estado;
  assert.equal(est.nivel, 'familia'); assert.equal(est.via, 'familia'); assert.equal(est.acesso, 'completo');
  assert.equal((await R('fam1', 'GET', '/hoje')).status === 401, false);
  const d = await R('dono', 'GET', '/familia'); assert.equal(d.membros.length, 4); assert.equal(d.vagas, 0);
  assert.equal(JSON.stringify(d).includes('@'), false, 'o dono não vê e-mail nem dados de estudo de ninguém');
  assert.equal((await R('fam1', 'POST', '/familia/sair', {})).status, 200);
  assert.equal((await R('fam1', 'GET', '/assinatura')).estado.acesso, 'livre');
  assert.equal((await R('dono', 'DELETE', `/familia/membros/${ids[1]}`)).status, 200);
  assert.equal((await R('fam2', 'GET', '/assinatura')).estado.acesso, 'livre', 'dono removeu: perde o acesso herdado');
  assert.equal((await R('fam3', 'POST', '/familia/codigo', {})).status, 409, 'só o dono gera código');
});

test('Turma: professor com plano Turma tem até 20 alunos com acesso completo; o 21º recebe aviso de plano sob consulta', async () => {
  conta('prof'); await R('prof', 'POST', '/assinatura/assinar', { plano: 'turma', periodo: 'anual' });
  const t = await R('prof', 'POST', '/turmas', { nome: 'Turma grande' });
  const cod = t.turma.codigo;
  for (let i = 1; i <= 21; i++) conta('al' + i, { assinatura: teste_vencido() });
  for (let i = 1; i <= 20; i++) assert.equal((await R('al' + i, 'POST', '/turmas/entrar', { codigo: cod, ciente: true })).status, 200, 'aluno ' + i);
  const r21 = await R('al21', 'POST', '/turmas/entrar', { codigo: cod, ciente: true });
  assert.equal(r21.status, 409); assert.match(r21.erro, /20 alunos.*sob consulta/);
  assert.equal((await R('al1', 'POST', '/turmas/entrar', { codigo: cod, ciente: true })).status, 200, 'quem já está dentro não é barrado');
  const est = (await R('al1', 'GET', '/assinatura')).estado;
  assert.equal(est.nivel, 'turma'); assert.equal(est.via, 'turma'); assert.equal(est.limites.conversa, assin.LIMITES.turma.conversa);
  assert.equal((await R('al21', 'GET', '/assinatura')).estado.acesso, 'livre');
});

test('teste grátis é do plano Completo: conta nova tem tudo e não tem limite diário', async () => {
  conta('novo');
  const e = (await R('novo', 'GET', '/assinatura')).estado;
  assert.equal(e.status, 'teste'); assert.equal(e.nivel, 'completo'); assert.equal(e.limitesDia, null);
});

test('lições por dia: Básico 2, Completo 3; a próxima só abre depois de concluir a anterior e a extra é pedida (nova=1)', async () => {
  for (const [quem, plano, max] of [['licb', 'basico', 2], ['licc', 'completo', 3]]) {
    conta(quem); await R(quem, 'POST', '/assinatura/assinar', { plano, periodo: 'mensal' });
    assert.equal((await R(quem, 'PUT', '/perfil', { objetivo: 'zero', objetivo_detalhe: '', prazo: null, minutos_dia: 10, dias_semana: 5, area: '', interesses: [] })).status, 200);
    assert.equal((await R(quem, 'POST', '/nivelamento', { nunca: true })).status, 200);
    let hoje = await R(quem, 'GET', '/hoje');
    assert.equal(hoje.maisUma, false); assert.equal(hoje.licoesHoje.max, max);
    const ids = [];
    for (let n = 1; n <= max; n++) {
      const l = await R(quem, 'GET', '/licao' + (n > 1 ? '?nova=1' : ''));
      assert.equal(l.status, 200, `lição ${n}`); ids.push(JSON.stringify(l.licao.blocos.length) + l.licao.missao?.parte);
      assert.equal((await R(quem, 'GET', '/licao?nova=1')).status, 200, 'pedir a próxima sem concluir devolve a mesma, não cria outra');
      assert.equal((await R(quem, 'POST', '/licao/concluir', {})).status, 200);
      hoje = await R(quem, 'GET', '/hoje');
      assert.equal(hoje.licoesHoje.feitas, n); assert.equal(hoje.maisUma, n < max, `mais uma depois da ${n}ª`);
    }
    const linhas = db.prepare("SELECT data FROM licoes WHERE user_id = (SELECT id FROM usuarios WHERE email = ?) ORDER BY data").all(`${quem}@planos.com`);
    assert.equal(linhas.length, max, 'nunca passa do limite do plano');
    await R(quem, 'GET', '/licao?nova=1');
    assert.equal(db.prepare("SELECT COUNT(*) n FROM licoes WHERE user_id = (SELECT id FROM usuarios WHERE email = ?)").get(`${quem}@planos.com`).n, max, 'pedir além do limite não cria lição');
  }
});

test('Gratuito (acesso livre): só revisão, até 10 cartões por dia, sem lição', async () => {
  conta('gratis', { assinatura: teste_vencido() });
  const e = (await R('gratis', 'GET', '/assinatura'));
  assert.equal(e.estado.nivel, 'livre'); assert.equal(e.estado.limitesDia.revisao, 10); assert.match(e.gratuito.resumo, /10 por dia|até 10/);
  assert.equal((await R('gratis', 'GET', '/licao')).status, 402);
  for (let i = 0; i < 12; i++) await R('gratis', 'POST', '/cartoes', { frente: `g${i}`, verso: `${i}` });
  const fila = await R('gratis', 'GET', '/cartoes/revisar'); assert.equal(fila.cartoes.length, 10);
  for (const c of fila.cartoes) assert.equal((await R('gratis', 'POST', `/cartoes/${c.id}/revisar`, { nota: 4 })).status, 200);
  const resto = (await R('gratis', 'GET', '/cartoes')).cartoes.find(c => c.vence_em <= hojeSP());
  const r = await R('gratis', 'POST', `/cartoes/${resto.id}/revisar`, { nota: 4 });
  assert.equal(r.status, 429); assert.match(r.erro, /Gratuito/);
});

test('bugs corrigidos: cartão com frente repetida dá 409 (não 500); cookie malformado não derruba a API; fuso de 3 partes vale', async () => {
  conta('bug');
  await R('bug', 'POST', '/cartoes', { frente: 'a', verso: '1' }); await R('bug', 'POST', '/cartoes', { frente: 'b', verso: '2' });
  const lista = (await R('bug', 'GET', '/cartoes')).cartoes; const b = lista.find(c => c.frente === 'b');
  const dup = await R('bug', 'PATCH', `/cartoes/${b.id}`, { frente: 'a', verso: '2' });
  assert.equal(dup.status, 409); assert.match(dup.erro, /já tem um cartão/);
  assert.equal((await R('bug', 'PATCH', `/cartoes/${b.id}`, { frente: 'b2', verso: '2' })).status, 200);
  const r = await fetch(BASE + '/api/v1/auth/estado', { headers: { Cookie: 'x=%; ' + tok.bug } });
  assert.equal(r.status, 200); assert.equal((await r.json()).logado, true, 'o cookie bom continua valendo');
  assert.equal((await fetch(BASE + '/api/v1/auth/estado', { headers: { Cookie: 'inglou_sessao=%E0%A4%A' } })).status, 200);
  const p = { objetivo: 'zero', objetivo_detalhe: '', prazo: null, minutos_dia: 10, dias_semana: 5, area: '', interesses: [], fuso: 'America/Argentina/Buenos_Aires' };
  assert.equal((await R('bug', 'PUT', '/perfil', p)).status, 200);
  assert.equal(db.prepare("SELECT fuso FROM perfis WHERE user_id = (SELECT id FROM usuarios WHERE email = 'bug@planos.com')").get().fuso, 'America/Argentina/Buenos_Aires');
  await R('bug', 'PUT', '/perfil', { ...p, fuso: 'Foo/Bar' });
  assert.equal(db.prepare("SELECT fuso FROM perfis WHERE user_id = (SELECT id FROM usuarios WHERE email = 'bug@planos.com')").get().fuso, 'America/Sao_Paulo', 'fuso que não existe cai no padrão');
});
