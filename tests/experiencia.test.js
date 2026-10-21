'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { faixaEtaria } = require('../src/motor/publico');
const { UNIDADES } = require('../src/conteudo/biblioteca');
const { MISSOES } = require('../src/conteudo/missoes');
const { corrigirExercicio, avaliarProducao } = require('../src/motor/correcao');

const PORT = 23000 + Math.floor(Math.random() * 500), BASE = `http://localhost:${PORT}/api/v1`;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-experiencia-'));
const usuarios = {};
let servidor, db;
async function R(quem, metodo, rota, corpo) {
  const r = await fetch(BASE + rota, { method: metodo, headers: { ...(usuarios[quem] ? { Cookie: usuarios[quem].cookie } : {}), ...(metodo !== 'GET' ? { 'X-Inglou': '1', 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  return { status: r.status, ...(await r.json()) };
}
before(async () => {
  servidor = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT, DATA_DIR: DIR, BACKUP_DESLIGADO: '1', NODE_ENV: 'test', IA_FAKE: '1' }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://localhost:${PORT}/saude`); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  for (const [quem, idade, papel] of [['crianca', 9, 'aluno'], ['adolescente', 16, 'aluno'], ['adulto', 35, 'aluno'], ['prof', 40, 'professor'], ['fora', 32, 'aluno']]) {
    const r = await fetch(BASE + '/auth/cadastro', { method: 'POST', headers: { 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Pessoa ' + quem, idade, papel, responsavel: idade < 18, email: quem + '@experiencia.test', senha: 'frase segura girassol 2026', consentimento: true }) });
    assert.equal(r.status, 200, await r.text());
    usuarios[quem] = { cookie: r.headers.get('set-cookie').split(';')[0] };
  }
  db = new DatabaseSync(path.join(DIR, 'inglou.db'));
  for (const quem of Object.keys(usuarios)) usuarios[quem].id = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(quem + '@experiencia.test').id;
});
after(() => { db?.close(); servidor?.kill(); fs.rmSync(DIR, { recursive: true, force: true }); });

test('idade e nível são independentes: limites das faixas, consentimento e validação', async () => {
  assert.deepEqual([1, 12, 13, 17, 18, 120, 0, null, 12.5].map(faixaEtaria), ['crianca', 'crianca', 'adolescente', 'adolescente', 'adulto', 'adulto', null, null, null]);
  for (const quem of ['crianca', 'adolescente', 'adulto']) assert.equal((await R(quem, 'GET', '/eu')).publico.id, quem);
  for (const idade of [0, 121, 8.5, 'abc']) assert.equal((await R('adulto', 'PUT', '/perfil/publico', { idade, papel: 'aluno' })).status, 422);
  assert.equal((await R('fora', 'PUT', '/perfil/publico', { idade: 10, papel: 'aluno' })).status, 422, 'autorização do responsável é necessária');
});

test('nivelamento usa situações da idade e permite o mesmo nível alto nos três públicos', () => {
  const { paraPublico } = require('../src/conteudo/nivelamento');
  const { corrigir } = require('../src/motor/nivelamento');
  for (const faixa of ['crianca', 'adolescente', 'adulto']) {
    const { itens, abertas } = paraPublico(faixa);
    const r = corrigir({ itens, respostas: Object.fromEntries(itens.map(e => [e.id, { resposta: e.opcoes[e.resposta] }])), fala: abertas.fala.alvo, alvoFala: abertas.fala.alvo });
    assert.equal(r.nivel, 'B2', faixa + ': idade não limita proficiência');
    assert.equal(r.porHabilidade.fala.detalhe.reconhecido, 100);
    if (faixa !== 'adulto') assert.doesNotMatch(JSON.stringify(itens), /startup|revenue|job interview/i);
  }
});

test('iniciante adulto recebe base acessível; criança tem temas próprios sem questões profissionais', async () => {
  for (const quem of ['adulto', 'crianca']) {
    assert.equal((await R(quem, 'PUT', '/perfil', { objetivo: 'conversa', minutos_dia: 10, dias_semana: 5, interesses: [] })).status, 200);
    const { plano } = await R(quem, 'POST', '/nivelamento', { nunca: true });
    assert.equal(plano.missoes[0].id, 'zero-sons');
    if (quem === 'crianca') { assert.ok(plano.missoes.some(m => m.id === 'crianca-animais')); assert.ok(!plano.missoes.some(m => m.id === 'apresentar')); }
    const { licao } = await R(quem, 'GET', '/licao');
    assert.equal(licao.guiada, true);
    assert.equal(licao.publico, quem);
    const itens = licao.blocos.flatMap(b => b.exercicios || []);
    assert.ok(itens.length > 0 && itens.length <= 5);
    assert.ok(itens.every(e => ['pares', 'escolha', 'escuta'].includes(e.tipo)), 'não começa exigindo ditado ou escrita livre');
    assert.ok(itens.every(e => e.dica && e.instrucao));
    assert.equal(licao.blocos.find(b => b.tipo === 'explicacao').vocab.length, 3);
    assert.ok(!licao.blocos.some(b => b.personalizado), 'IA não aumenta a dificuldade inicial');
    assert.doesNotMatch(JSON.stringify(licao), /"(?:resposta|aceitas)":/);
  }
});

test('erro explica; repetição corrige sem alterar o primeiro resultado nem contar duas vezes', async () => {
  const { licao } = await R('adulto', 'GET', '/licao');
  const ex = licao.blocos.flatMap(b => b.exercicios || []).find(e => e.tipo === 'escolha');
  const r = await R('adulto', 'POST', '/licao/responder', { itemId: ex.id, resposta: 'banana', tempoMs: 2000 });
  assert.equal(r.correto, false); assert.ok(r.esperado && r.explica);
  const treino = await R('adulto', 'POST', '/licao/responder', { itemId: ex.id, resposta: r.esperado, treinar: true });
  assert.equal(treino.correto, true); assert.equal(treino.pratica, true);
  const volta = await R('adulto', 'GET', '/licao');
  assert.equal(volta.respondidos[ex.id].correto, false);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM tentativas WHERE user_id = ? AND item_id = ?').get(usuarios.adulto.id, ex.id).n, 1);
  const outro = licao.blocos.flatMap(b => b.exercicios || []).find(e => e.tipo === 'escuta');
  const ajuda = await R('adulto', 'POST', '/licao/responder', { itemId: outro.id, revelar: true });
  assert.equal(ajuda.ajuda, true); assert.ok(ajuda.textoAudio && ajuda.audioResposta && ajuda.traducao);
  const reaberta = await R('adulto', 'GET', '/licao');
  assert.equal(reaberta.respondidos[outro.id].textoAudio, ajuda.textoAudio);
  assert.equal(reaberta.respondidos[outro.id].ajuda, true);
});

test('biblioteca seleciona público no servidor; leitura e vocabulário têm explicação e respeitam assinatura', async () => {
  for (const quem of ['crianca', 'adolescente', 'adulto']) {
    const d = await R(quem, 'GET', '/biblioteca');
    assert.equal(d.unidades.length, 3); assert.ok(d.unidades.every(u => u.faixa === quem));
  }
  assert.equal((await R('crianca', 'GET', '/biblioteca/adulto-viagem')).status, 404);
  const cenarios = (await R('crianca', 'GET', '/conversas/cenarios')).cenarios;
  assert.ok(cenarios.some(c => c.id === 'livro-crianca-animais'));
  assert.ok(!cenarios.some(c => c.id === 'entrevista-trajetoria'));
  assert.equal((await R('crianca', 'POST', '/conversas', { cenario: 'entrevista-trajetoria' })).status, 422);
  const d = await R('crianca', 'GET', '/biblioteca/crianca-animais');
  assert.ok(d.itens.some(e => e.habilidade === 'vocabulario') && d.itens.some(e => e.tipo === 'leitura'));
  assert.doesNotMatch(JSON.stringify(d), /"(?:resposta|aceitas)":/);
  const ex = d.itens.find(e => e.tipo === 'leitura');
  const r = await R('crianca', 'POST', '/biblioteca/crianca-animais/responder', { itemId: ex.id, resposta: 'não sei' });
  assert.ok(r.explica.includes('garden'));
  assert.equal((await R('crianca', 'POST', '/biblioteca/crianca-animais/responder', { itemId: ex.id, resposta: r.esperado, treinar: true })).correto, true);
  const original = db.prepare('SELECT dados FROM assinaturas WHERE user_id = ?').get(usuarios.adulto.id).dados;
  db.prepare('UPDATE assinaturas SET dados = ? WHERE user_id = ?').run(JSON.stringify({ status: 'teste', teste_ate: '2020-01-01' }), usuarios.adulto.id);
  assert.equal((await R('adulto', 'GET', '/biblioteca/adulto-rotina')).status, 402);
  db.prepare('UPDATE assinaturas SET dados = ? WHERE user_id = ?').run(original, usuarios.adulto.id);
});

test('professor monta capítulo com material, leitura e vocabulário; prévia não publica nem registra notas', async () => {
  const t = await R('prof', 'POST', '/turmas', { nome: 'Descobertas A1', faixa: 'crianca', nivel: 'A1' });
  usuarios.prof.turma = t.turma;
  const banco = await R('prof', 'GET', '/professor/banco');
  assert.ok(banco.missoes.some(m => m.faixa === 'crianca' && m.exercicios.some(e => e.tipo === 'leitura')));
  assert.equal((await R('crianca', 'GET', '/professor/banco')).status, 403);
  const aula = { titulo: 'Animais no jardim', tema: 'Animais e lugares', faixa: 'crianca', nivel: 'A1', banco: [], material: { explicacao: 'Observe onde o animal está.', texto: 'The dog is in the garden.', traducao: 'O cachorro está no jardim.', vocab: [{ en: 'garden', pt: 'jardim' }] }, proprias: [
    { tipo: 'leitura', texto: 'The dog is in the garden.', pergunta: 'Onde está o cachorro?', opcoes: ['No jardim', 'Na escola'], resposta: 0, explica: 'Garden é jardim. A frase diz onde o cachorro está.' },
    { tipo: 'vocabulario', enunciado: 'O que significa garden?', opcoes: ['Jardim', 'Escola'], resposta: 0, explica: 'Garden é jardim.' },
  ] };
  const previa = await R('prof', 'POST', '/professor/previa', aula);
  assert.equal(previa.status, 200); assert.equal(previa.itens.length, 2); assert.ok(previa.correcoes.i1.esperado);
  assert.equal((await R('prof', 'POST', '/professor/previa', { ...aula, respostas: { i1: previa.correcoes.i1.esperado } })).correcoes.i1.correto, true);
  assert.equal((await R('prof', 'GET', `/turmas/${t.turma.id}`)).atividades.length, 0);
  const publicada = await R('prof', 'POST', `/turmas/${t.turma.id}/atividades`, aula);
  assert.equal(publicada.status, 200); usuarios.prof.atividade = publicada.id;
  assert.equal((await R('crianca', 'POST', '/turmas/entrar', { codigo: t.turma.codigo, ciente: true })).status, 200);
  const aluno = await R('crianca', 'GET', `/atividades/${publicada.id}`);
  assert.equal(aluno.atividade.material.texto, aula.material.texto);
  assert.equal(aluno.itens[1].habilidade, 'vocabulario');
  assert.doesNotMatch(JSON.stringify(aluno), /"(?:resposta|aceitas)":/);
  assert.equal((await R('fora', 'GET', `/atividades/${publicada.id}`)).status, 404);
});

test('professor acompanha apenas atividade da turma e reutiliza material sem copiar respostas', async () => {
  const t = usuarios.prof.turma.id, a = usuarios.prof.atividade;
  const erro = 'resposta privada do aluno';
  const r = await R('crianca', 'POST', `/atividades/${a}/responder`, { itemId: 'i1', resposta: erro });
  assert.ok(!r.correto && r.explica);
  assert.ok((await R('crianca', 'POST', `/atividades/${a}/responder`, { itemId: 'i1', resposta: r.esperado, treinar: true })).correto);
  const painel = await R('prof', 'GET', `/turmas/${t}/atividades/${a}`);
  assert.equal(painel.alunos[0].feitas, 1); assert.equal(painel.alunos[0].certas, 0);
  assert.ok(!JSON.stringify(painel).includes(erro)); assert.doesNotMatch(JSON.stringify(painel), /"idade"\s*:/);
  const destino = await R('prof', 'POST', '/turmas', { nome: 'Segunda turma', faixa: 'crianca' });
  const copia = await R('prof', 'POST', `/turmas/${t}/atividades/${a}/duplicar`, { turmaId: destino.turma.id });
  assert.equal(copia.status, 200);
  const copiada = await R('prof', 'GET', `/turmas/${destino.turma.id}/atividades/${copia.id}`);
  assert.equal(copiada.atividade.material.texto, 'The dog is in the garden.');
  assert.equal(copiada.resumo.concluiram, 0); assert.ok(copiada.itens.every(i => i.respondentes === 0));
  const alheia = await R('fora', 'POST', '/turmas', { nome: 'Turma de outra pessoa' });
  assert.equal((await R('prof', 'POST', `/turmas/${t}/atividades/${a}/duplicar`, { turmaId: alheia.turma.id })).status, 404);
});

test('todas as questões do catálogo explicam acertos e erros, e os modelos novos passam na rubrica', () => {
  for (const m of MISSOES) for (const ex of m.exercicios) assert.ok(corrigirExercicio(ex, 'resposta diferente').explica, ex.id);
  for (const u of UNIDADES) {
    const m = MISSOES.find(m => m.id === u.id);
    assert.ok(avaliarProducao(m.tarefa, m.tarefa.modelo).demonstrado, u.id);
  }
});
