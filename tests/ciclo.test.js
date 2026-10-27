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
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'server.js')], { env: { ...process.env, AUTH_PROVIDER: 'local', PORT: PORTA, DATA_DIR: DIR, IA_FAKE: '1', NODE_ENV: 'test', ANTHROPIC_API_KEY: '' }, stdio: 'pipe' });
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
  assert.equal(itens.length, 15, 'o teste de entrada tem 15 perguntas');
  // Este ciclo exercita o curso profissional A2; o caminho A1 agora começa pela base guiada.
  const banco = require('../src/conteudo/nivelamento').ITENS;
  const { plano, resultado } = await R('POST', '/nivelamento', { respostas: Object.fromEntries(itens.map(i => { const original = banco.find(b => b.id === i.id); return [i.id, { resposta: ['A1', 'A2'].includes(original.nivel) ? original.opcoes[original.resposta] : '', naoSei: !['A1', 'A2'].includes(original.nivel), tempoMs: 3000 }]; })), escrita: '', fala: '' });
  assert.equal(resultado.nivel, 'A2');
  assert.equal(plano.objetivo, 'entrevista');
  assert.ok(plano.missoes.some(m => m.id === 'perguntas-entrevista'));
  // Este cenário cobre personalização e produção após a base iniciante.
  // Fixar A2 evita depender da ordem das alternativas do nivelamento.
  const n = db.prepare('SELECT id, resultado FROM nivelamentos WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(uid);
  db.prepare('UPDATE nivelamentos SET resultado = ? WHERE id = ?').run(JSON.stringify({ ...JSON.parse(n.resultado), nivel: 'A2' }), n.id);
  novoDia();
  const { licao } = await R('GET', '/licao');
  const pers = licao.blocos.find(b => b.personalizado);
  assert.ok(pers, 'bloco feito para a situação do aluno');
  assert.equal(pers.exercicios.length, 3, 'o item inválido da IA foi descartado');
  const { limiteDaLicao } = require('../src/motor/licao');
  assert.ok(licao.blocos.flatMap(b => b.exercicios || []).length <= limiteDaLicao(licao.blocos));
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

test('Rádio Lou: episódio do dia com os tropeços, treino corrigido no servidor e ouvir conta na sequência', async () => {
  const { episodio } = await R('GET', '/podcast');
  assert.ok(episodio.falas.length >= 6);
  assert.ok(episodio.tropecos.length >= 1, 'os erros das conversas viram assunto do episódio');
  assert.ok(!JSON.stringify(episodio.treino).match(/"(resposta|aceitas)"/), 'gabarito não vai ao navegador');
  assert.equal((await R('GET', '/podcast')).episodio.titulo, episodio.titulo, 'um episódio por dia');
  const ex = episodio.treino[0];
  const r = await R('POST', '/podcast/responder', { itemId: ex.id, resposta: ex.opcoes ? ex.opcoes[0] : 'x' });
  assert.equal(typeof r.correto, 'boolean');
  assert.ok((await R('POST', '/podcast/responder', { itemId: ex.id, resposta: 'outra' })).repetida, 'clique duplo não conta duas vezes');
  const ouvido = await R('POST', '/podcast/ouvido');
  assert.ok(ouvido.sequencia.estudouHoje);
  const hoje = await R('GET', '/hoje');
  assert.ok(hoje.radio.ouvido && hoje.sequencia.atual >= 1);
});

test('Estudo sob medida: cria, abre assunto, responde, conclui, faz o simulado; gabarito não vaza e outro aluno não enxerga', async () => {
  const { id, modo } = await R('POST', '/sobmedida', { titulo: 'Prova de inglês da faculdade', tipo: 'prova', data_alvo: null, descricao: 'present perfect, preposições, interpretação de texto', material: '' });
  assert.equal(modo, 'ia');
  const { estudo } = await R('GET', `/sobmedida/${id}`);
  assert.ok(estudo.assuntos.length >= 2 && !estudo.simulado.pode, 'simulado só depois de estudar');
  await assert.rejects(R('GET', `/sobmedida/${id}/simulado`), /422/, 'sem assunto estudado não há simulado');
  const aid = estudo.assuntos[0].id;
  const { assunto } = await R('GET', `/sobmedida/${id}/assunto/${aid}`);
  assert.ok(assunto.explicacao.texto && assunto.exercicios.length >= 3);
  assert.ok(!JSON.stringify(assunto).match(/"(resposta|aceitas)"/), 'gabarito não vai ao navegador');
  for (const ex of assunto.exercicios) {
    const r = await R('POST', `/sobmedida/${id}/assunto/${aid}/responder`, { itemId: ex.id, resposta: ex.opcoes ? ex.opcoes[0] : 'x', tempoMs: 3000 });
    assert.equal(typeof r.correto, 'boolean');
  }
  assert.ok((await R('POST', `/sobmedida/${id}/assunto/${aid}/responder`, { itemId: assunto.exercicios[0].id, resposta: 'outra' })).repetida, 'clique duplo não conta duas vezes');
  const fim = await R('POST', `/sobmedida/${id}/assunto/${aid}/concluir`);
  assert.equal(fim.progresso.concluidos, 1);
  const { simulado } = await R('GET', `/sobmedida/${id}/simulado`);
  assert.ok(simulado.itens.length >= 3 && !JSON.stringify(simulado).match(/"(resposta|aceitas|original|_assunto)"/));
  const respostas = Object.fromEntries(simulado.itens.map(i => [i.id, i.opcoes ? i.opcoes[0] : 'x']));
  const env = await R('POST', `/sobmedida/${id}/simulado/enviar`, { respostas });
  assert.equal(env.resultado.total, simulado.itens.length);
  assert.ok(env.detalhes.every(d => 'esperado' in d));
  assert.ok((await R('POST', `/sobmedida/${id}/simulado/enviar`, { respostas: {} })).repetida, 'reenvio não refaz a correção');
  // outro aluno não enxerga (IDOR)
  const r2 = await fetch(BASE + '/api/v1/auth/cadastro', { method: 'POST', headers: { 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Carla', email: 'carla@ciclo.com', senha: 'girassol azul montanha 2026', consentimento: true }) });
  const H2 = { Cookie: (r2.headers.get('set-cookie') || '').split(';')[0] };
  for (const u of [`/sobmedida/${id}`, `/sobmedida/${id}/assunto/${aid}`, `/sobmedida/${id}/simulado`]) assert.equal((await fetch(BASE + '/api/v1' + u, { headers: H2 })).status, 404, 'IDOR: ' + u);
  assert.equal((await fetch(BASE + '/api/v1/sobmedida/' + id, { method: 'DELETE', headers: { ...H2, 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: '{}' })).status, 404);
  assert.equal((await R('GET', '/hoje')).estudo.id, id, 'aparece na tela Hoje');
  await R('DELETE', `/sobmedida/${id}`);
  assert.equal((await R('GET', '/sobmedida')).estudos.length, 0);
});

test('Perfil de aprendizagem e treino focado: retrato por modo, preferência, treino sem gabarito, erro só dele vira "corrija a frase"', async () => {
  const ap = await R('GET', '/aprendizagem');
  assert.ok(ap.retrato.modos.ler && ap.retrato.modos.escrever && ap.retrato.modos.ouvir && Array.isArray(ap.percepcoes));
  assert.ok(ap.dificuldades.length >= 1, 'as conversas do ciclo geraram dificuldades');
  assert.deepEqual((await R('PUT', '/aprendizagem/preferencias', { estilos: ['ouvir', 'ouvir', 'ler'] })).estilos, ['ouvir', 'ler']);
  await assert.rejects(R('PUT', '/aprendizagem/preferencias', { estilos: ['visual'] }), /422/, 'não aceita rótulos fora de ler/escrever/ouvir/falar');
  const { treino } = await R('GET', '/treino');
  assert.ok(treino.itens.length >= 3 && treino.porque.length >= 2);
  assert.ok(!JSON.stringify(treino.itens).match(/"(resposta|aceitas|_fonte|_modo)"/), 'gabarito não vai ao navegador');
  assert.equal((await R('GET', '/treino')).treino.itens.length, treino.itens.length, 'um treino por dia');
  for (const ex of treino.itens) {
    const r = await R('POST', '/treino/responder', { itemId: ex.id, resposta: ex.opcoes ? ex.opcoes[0] : 'x', tempoMs: 2500 });
    assert.equal(typeof r.correto, 'boolean');
  }
  assert.ok((await R('POST', '/treino/responder', { itemId: treino.itens[0].id, resposta: 'outra' })).repetida);
  const fim = await R('POST', '/treino/concluir');
  assert.equal(fim.total, treino.itens.length);
  assert.ok((await R('GET', '/hoje')).treino.concluido, 'aparece na tela Hoje');
  const novo = await R('POST', '/treino/novo');
  assert.equal(novo.treino.versao, 1);
  assert.equal((await R('GET', '/aprendizagem')).treino.pronto, true);
});

test('"começar do zero": pula o teste, vai para o A1 e a primeira lição é a dos sons, com no máximo 10 questões', async () => {
  await R('PUT', '/perfil', { objetivo: 'zero', objetivo_detalhe: '', prazo: null, minutos_dia: 10, dias_semana: 5, area: '', interesses: [] });
  const { plano, resultado } = await R('POST', '/nivelamento', { nunca: true });
  assert.equal(resultado.nivel, 'A1');
  assert.equal(plano.objetivo, 'zero');
  assert.equal(plano.missoes[0].id, 'zero-sons');
  const { licao } = await R('GET', '/licao');
  assert.equal(licao.missao.id, 'zero-sons');
  const n = licao.blocos.reduce((s, b) => s + (b.exercicios ? b.exercicios.length : 0), 0);
  assert.ok(n > 0 && n <= 10, 'questões: ' + n);
});

test('toque numa palavra devolve alguns sentidos e rejeita o que não é palavra', async () => {
  const r = await R('POST', '/palavra', { palavra: 'Office', frase: 'I go to the office on Tuesdays.' });
  assert.ok(r.sentidos.length >= 1 && r.sentidos.filter(s => s.no_contexto).length === 1);
  assert.ok(!('uso' in r));
  await assert.rejects(R('POST', '/palavra', { palavra: '<img src=x>', frase: '' }));
});

test('nível: aluno sobe e desce na mão, desfaz uma vez, e o app desce sozinho quando está difícil demais', async () => {
  const nivelAtual = () => db.prepare('SELECT resultado FROM nivelamentos WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(uid);
  const base = (await R('GET', '/nivel')).atual;
  assert.equal(base, 'A1');
  await assert.rejects(R('POST', '/nivel/ajustar', { direcao: 'descer' }), /mais básico/);
  await assert.rejects(R('POST', '/nivel/ajustar', { direcao: 'lateral' }));
  const sobe = await R('POST', '/nivel/ajustar', { direcao: 'subir' });
  assert.equal(sobe.atual, 'A2'); assert.equal(sobe.ajuste.origem, 'aluno');
  assert.equal((await R('GET', '/plano')).nivelamento.nivel, 'A2', 'o plano acompanha o nível novo');
  const volta = await R('POST', '/nivel/desfazer');
  assert.equal(volta.atual, 'A1');
  await assert.rejects(R('POST', '/nivel/desfazer'), /desfazer/, 'só desfaz uma vez');
  // O aluno sobe para o A2 e erra quase tudo nos dias seguintes: o app desce sozinho.
  await R('POST', '/nivel/ajustar', { direcao: 'subir' });
  const antigo = new Date(Date.now() - 10 * 864e5).toISOString();
  const linha = db.prepare('SELECT id, resultado FROM nivelamentos WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(uid);
  const res = JSON.parse(linha.resultado); res.ajuste.em = antigo;
  db.prepare('UPDATE nivelamentos SET resultado = ? WHERE id = ?').run(JSON.stringify(res), linha.id);
  db.prepare('DELETE FROM tentativas WHERE user_id = ?').run(uid);   // só as tentativas deste cenário contam
  const ins = db.prepare("INSERT INTO tentativas (user_id, em, item_id, correto, dica, origem) VALUES (?, ?, ?, ?, 0, 'licao')");
  for (let i = 0; i < 24; i++) ins.run(uid, new Date(Date.now() - (1 + (i % 3)) * 864e5 + i * 1000).toISOString(), 'x' + i, i < 5 ? 1 : 0);
  const hoje = await R('GET', '/hoje');
  assert.equal(hoje.nivel.atual, 'A1', 'errou muito: desceu');
  assert.equal(hoje.nivel.ajuste.origem, 'auto');
  assert.equal(JSON.parse(nivelAtual().resultado).nivel, 'A1');
  assert.equal((await R('GET', '/hoje')).nivel.atual, 'A1', 'não desce de novo na hora');
});
