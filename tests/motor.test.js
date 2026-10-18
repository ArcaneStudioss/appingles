'use strict';
// Testes do motor de personalização (sem servidor).
const { test } = require('node:test');
const assert = require('node:assert');
const { detectar, DIFICULDADES } = require('../src/conteudo/dificuldades');
const { MISSOES, TODOS_EXERCICIOS } = require('../src/conteudo/missoes');
const { OBJETIVOS } = require('../src/conteudo/objetivos');
const { CENARIOS } = require('../src/conteudo/cenarios');
const { montarPlano } = require('../src/motor/plano');
const { montarLicao, paraCliente } = require('../src/motor/licao');
const { corrigirExercicio, avaliarProducao } = require('../src/motor/correcao');
const { hipoteses, dificuldadeAlvo } = require('../src/motor/modelo');
const { agendar } = require('../src/motor/srs');
const { comparar } = require('../src/motor/util');
const { estado, assinar, cancelar, novaAssinatura } = require('../src/assinatura');

test('detectores acham erros típicos de brasileiros', () => {
  const casos = { 'I have 25 years.': 'idade-have', 'I work here since 2020.': 'tempo-desde', 'I am agree.': 'concordar', 'Did you went there?': 'perguntas-do', 'Is very important.': 'sujeito-oculto', 'Can you explain me?': 'explicar-para', 'It depends of you.': 'preposicoes', 'People is nice.': 'people-plural', 'Can I make a question?': 'make-do', 'Thanks for the informations.': 'incontaveis', 'I am developer.': 'artigo-profissao', 'She don\'t like it.': 'terceira-pessoa', 'Yesterday I buyed a car.': 'passado-irregular' };
  for (const [frase, tag] of Object.entries(casos)) assert.ok(detectar(frase).some(a => a.tag === tag), `${frase} -> ${tag}`);
});

test('detectores não acusam frases corretas (falso positivo é pior que deixar passar)', () => {
  const certas = ['I have 5 years of experience in sales.', "I've been working here for three years.", 'I agree with you.', 'Where did you go last weekend? I went to the beach.', 'It is important.', 'Can you explain it to me?', 'It depends on the client.', 'People are nice.', 'Can I ask a question?', 'He can work tomorrow.', 'Does she like it? Yes, she likes it.', "I'm a nurse.", 'My company sells software.', 'There are many people here.', 'I work as an engineer.'];
  for (const f of certas) assert.deepEqual(detectar(f).filter(a => a.confianca !== 'baixa').map(a => a.tag), [], f);
});

test('conteúdo é consistente: ids únicos, gabaritos válidos, missões e cenários referenciados existem', () => {
  const ids = MISSOES.flatMap(m => m.exercicios.map(e => e.id));
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos');
  for (const e of Object.values(TODOS_EXERCICIOS)) {
    if (e.opcoes) assert.ok(e.resposta >= 0 && e.resposta < e.opcoes.length, e.id);
    if (e.tipo === 'lacuna') assert.ok(e.frase.includes('___') && e.resposta.length, e.id);
    if (e.tipo === 'ordenar') assert.equal(e.palavras.join(' '), e.resposta, e.id);
    if (e.tipo === 'traduzir') assert.ok(e.aceitas.length, e.id);
    if (e.tag) assert.ok(DIFICULDADES.some(d => d.tag === e.tag), e.id + ' tag ' + e.tag);
  }
  for (const o of Object.values(OBJETIVOS)) for (const id of [...o.missoes, ...o.essenciais]) assert.ok(MISSOES.some(m => m.id === id), id);
  for (const m of MISSOES) { assert.ok(CENARIOS[m.conversa], m.id); assert.ok(m.reteste.length >= 2, m.id); for (const t of m.tags) assert.ok(DIFICULDADES.some(d => d.tag === t), t); }
  // o modelo de resposta de cada tarefa precisa passar na própria rubrica (senão a tarefa é impossível)
  for (const m of MISSOES) assert.ok(avaliarProducao(m.tarefa, m.tarefa.modelo).demonstrado, 'modelo da tarefa reprovado: ' + m.id);
});

test('nenhum tracinho longo em textos visíveis', () => {
  const txt = JSON.stringify([MISSOES, DIFICULDADES, OBJETIVOS, CENARIOS]);
  assert.ok(!/[—–]/.test(txt));
});

test('plano: prazo curto prioriza essenciais e avisa; nunca promete fluência', () => {
  const longo = montarPlano({ objetivo: 'entrevista', prazo: '2027-04-18', minutos_dia: 15, dias_semana: 5 }, 'A2', '2026-10-18');
  assert.equal(longo.missoes.length, OBJETIVOS.entrevista.missoes.length);
  const curto = montarPlano({ objetivo: 'entrevista', prazo: '2026-11-01', minutos_dia: 10, dias_semana: 3 }, 'A2', '2026-10-18');
  assert.ok(curto.missoes.length < longo.missoes.length);
  assert.ok(curto.missoes.every(m => OBJETIVOS.entrevista.essenciais.includes(m.id)));
  assert.ok(curto.avisos.length >= 2);
  assert.doesNotMatch(JSON.stringify(longo), /fluente em|fluência em \d|garant/i);
  assert.match(longo.compromisso, /não uma promessa de fluência/);
});

test('lição: começa pelo que travou na conversa, explica o porquê e não manda gabarito', () => {
  const plano = montarPlano({ objetivo: 'trabalho', minutos_dia: 15, dias_semana: 5 }, 'A2', '2026-10-18');
  const l = montarLicao({ perfil: { minutos_dia: 15 }, plano, nivel: 'A2', competencias: {}, focos: [{ id: 7, tag: 'concordar', status: 'novo', origem: 'conversa', trecho: 'I am agree', criado_em: '2026-10-17T12:00:00Z', abordagens: ['regra'] }], hipoteses: [], hojeISO: '2026-10-18' });
  assert.equal(l.blocos[0].tipo, 'foco');
  assert.equal(l.blocos[0].tag, 'concordar');
  assert.notEqual(l.blocos[0].explicacao.abordagem, 'regra', 'abordagem nova quando a anterior não funcionou');
  assert.match(l.porque[0], /conversa de ontem/);
  assert.ok(l.minutos >= 8 && l.minutos <= 20);
  assert.doesNotMatch(JSON.stringify(paraCliente(l, 's')), /"resposta":|"aceitas":/);
});

test('lição: missão demonstrada há 3+ dias vira teste em situação nova, sem dicas', () => {
  const plano = montarPlano({ objetivo: 'entrevista', minutos_dia: 20, dias_semana: 5 }, 'A2', '2026-10-18');
  const l = montarLicao({ perfil: { minutos_dia: 20 }, plano, nivel: 'A2', competencias: { apresentar: { status: 'demonstrado', partes: 2, demonstrado_em: '2026-10-14T10:00:00Z', retestes: 0 } }, focos: [], hipoteses: [], hojeISO: '2026-10-18' });
  const r = l.blocos.find(b => b.tipo === 'producao' && b.reteste);
  assert.ok(r && r.semDicas);
  assert.equal(paraCliente(l, 's').blocos.find(b => b.reteste).tarefa.dicas.length, 0);
});

test('hipóteses: escuta x leitura, reconhece x produz, erro recorrente; descartadas somem', () => {
  const agora = Date.now(); const t = (h, extra) => ({ em: new Date(agora - h * 3600e3).toISOString(), ...extra });
  const tent = [];
  for (let i = 0; i < 8; i++) tent.push(t(i, { habilidade: 'escuta', modalidade: 'audio', formato: 'reconhecimento', correto: i < 3 }));
  for (let i = 0; i < 8; i++) tent.push(t(i, { habilidade: 'leitura', modalidade: 'texto', formato: 'reconhecimento', correto: true }));
  for (let i = 0; i < 8; i++) tent.push(t(i, { habilidade: 'escrita', modalidade: 'texto', formato: 'producao', correto: i >= 6, tag: 'tempo-desde', contexto: i % 2 ? 'conversa' : 'trajetoria' }));
  const h = hipoteses(tent, []);
  const ids = h.map(x => x.id);
  assert.ok(ids.includes('escuta-x-leitura'));
  assert.ok(ids.includes('reconhece-x-produz'));
  assert.ok(ids.includes('erro-recorrente:tempo-desde'));
  for (const x of h) assert.ok(x.evidencia > 0 && x.confianca && x.texto);
  assert.ok(!hipoteses(tent, [], { descartadas: ['escuta-x-leitura'] }).some(x => x.id === 'escuta-x-leitura'));
  assert.equal(dificuldadeAlvo('A1', []), 1);
});

test('correção: tolera contração e digitação leve; ordem errada não passa', () => {
  assert.ok(comparar('I am 30 years old', ["I'm 30 years old"]).correto);
  assert.ok(comparar("Ive been working here for three years", ["I've been working here for three years"]).correto);
  const ord = { tipo: 'ordenar', resposta: 'I have been working here', palavras: [] };
  assert.ok(!corrigirExercicio(ord, 'I have working been here').correto);
  const lac = TODOS_EXERCICIOS['trajetoria-3'];
  assert.ok(corrigirExercicio(lac, 'left went').correto);
});

test('produção: com dica não conta como demonstrado; sem os elementos também não', () => {
  const m = MISSOES.find(x => x.id === 'apresentar');
  assert.ok(!avaliarProducao(m.tarefa, m.tarefa.modelo, { usouAjuda: true }).demonstrado);
  assert.ok(!avaliarProducao(m.tarefa, 'Hello. I like pizza and music very much and also movies and games and books.').demonstrado);
  const comErro = "Hi, I'm Paulo. I am developer at a bank in Curitiba and I love it. Currently, I'm studying English every day because I want a new job.";
  assert.ok(!avaliarProducao(m.tarefa, comErro).demonstrado, 'erro de alta confiança na dificuldade-chave');
});

test('repetição espaçada: errar volta amanhã, acertar espaça, sem passar de 180 dias', () => {
  let c = { facilidade: 2.5, intervalo: 0, repeticoes: 0, lapsos: 0 };
  c = { ...c, ...agendar(c, 4, '2026-10-18') }; assert.equal(c.intervalo, 1);
  c = { ...c, ...agendar(c, 4, '2026-10-19') }; assert.equal(c.intervalo, 4);
  c = { ...c, ...agendar(c, 5, '2026-10-23') }; assert.ok(c.intervalo > 4);
  const e = agendar(c, 0, '2026-11-10'); assert.equal(e.intervalo, 1); assert.equal(e.vence_em, '2026-11-11');
  let x = { facilidade: 3, intervalo: 150, repeticoes: 9 }; assert.ok(agendar(x, 5, '2026-10-18').intervalo <= 180);
});

test('assinatura: teste sem cobrança vira acesso livre; assinar no teste não perde dias; cancelar mantém até o fim', () => {
  const a = novaAssinatura('2026-10-18');
  assert.equal(estado(a, '2026-11-17').acesso, 'completo');
  assert.equal(estado(a, '2026-11-18').acesso, 'livre');
  const s = assinar(a, 'mensal', '2026-10-25');
  assert.equal(s.periodo_ate, '2026-12-17', 'período pago começa quando o teste acaba');
  const c = cancelar(s, '2026-11-01');
  assert.equal(estado(c, '2026-12-10').acesso, 'completo');
  assert.equal(estado(c, '2026-12-18').acesso, 'livre');
});

test('sequência: hoje sem estudo não quebra; escudo a cada 7 dias salva um dia; recorde fica', () => {
  const { calcularSequencia } = require('../src/motor/sequencia');
  const { somarDias } = require('../src/motor/util');
  const h = '2026-10-18', d = n => somarDias(h, -n);
  assert.equal(calcularSequencia([], h).atual, 0);
  assert.equal(calcularSequencia([d(1), d(2), d(3)], h).atual, 3);              // hoje ainda não estudou: segue valendo
  assert.equal(calcularSequencia([h, d(1), d(2)], h).estudouHoje, true);
  const comEscudo = calcularSequencia([2, 3, 4, 5, 6, 7, 8, 9].map(d), h);     // 8 seguidos, faltou ontem
  assert.equal(comEscudo.atual, 8); assert.equal(comEscudo.escudos, 0); assert.deepEqual(comEscudo.protegidos, [d(1)]);
  const semEscudo = calcularSequencia([d(1), d(2), d(4), d(5), d(6)], h);       // faltou um dia sem escudo
  assert.equal(semEscudo.atual, 2); assert.equal(semEscudo.recorde, 3);
  assert.equal(semEscudo.proximoPremio, 3);
});

test('Rádio Lou: tropeços vêm dos erros do aluno; roteiro não fala a frase errada; treino sem gabarito no cliente', () => {
  const { coletarTropecos, montarEpisodio, validarFalasIa } = require('../src/motor/podcast');
  const { paraCliente } = require('../src/motor/licao');
  const h = '2026-10-18';
  const tr = coletarTropecos({
    focos: [{ tag: 'idade-have', trecho: 'I have 25 years', correcao: "I'm 25.", origem: 'conversa', criado_em: '2026-10-17T10:00:00Z', status: 'novo' },
      { tag: 'make-do', trecho: 'I made a question', origem: 'conversa', criado_em: '2026-09-01T10:00:00Z', status: 'novo' }],   // antigo: fica de fora
    tentativas: [{ tag: 'perguntas-do', correto: 0, em: '2026-10-16T10:00:00Z', origem: 'conversa', resposta: 'You like coffee?' }, { tag: 'perguntas-do', correto: 1, em: '2026-10-16T10:00:00Z' }],
  }, h);
  assert.deepEqual(tr.map(t => t.tag), ['idade-have', 'perguntas-do']);
  const ep = montarEpisodio({ tropecos: tr, missao: { id: 'apresentar' }, nome: 'Ana' });
  assert.ok(ep.falas.some(f => f.quem === 'mia' && f.repita));
  assert.ok(ep.falas.every(f => !f.texto.includes('I have 25 years')), 'a frase errada não é falada');
  assert.ok(ep.falas.some(f => f.riscado === 'I have 25 years'), 'aparece riscada');
  assert.ok(ep.falas.filter(f => f.quem === 'mia').every(f => f.lingua === 'en'));
  assert.ok(ep.treino.length >= 3 && ep.treino.every(e => e.id.startsWith('radio:')));
  const cliente = paraCliente({ blocos: [{ exercicios: ep.treino }] }, 's').blocos[0].exercicios;
  assert.ok(cliente.every(e => e.resposta === undefined && e.aceitas === undefined));
  const semErros = montarEpisodio({ tropecos: [], missao: { id: 'apresentar' }, nome: 'Ana' });
  assert.ok(semErros.falas.length > 5 && semErros.treino.length > 0);
  assert.equal(validarFalasIa([{ quem: 'lou', texto: 'oi' }]), null);
  assert.equal(validarFalasIa(Array.from({ length: 8 }, () => ({ quem: 'hacker', texto: 'x' }))), null);
});

test('limite de login é compartilhado entre cópias do app (duas conexões ao mesmo banco não dobram o limite)', () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const { abrir } = require('../src/db');
  const { limitadorBanco } = require('../src/auth');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-lim-'));
  try {
    const dbA = abrir(dir), dbB = abrir(dir);              // duas cópias abrindo o mesmo arquivo
    const a = limitadorBanco(dbA, 'login-conta', { janelaMs: 60e3, max: 8 });
    const b = limitadorBanco(dbB, 'login-conta', { janelaMs: 60e3, max: 8 });
    let liberadas = 0;
    for (let i = 0; i < 12; i++) if ((i % 2 ? a : b).tentar('ana@teste.com')) liberadas++;
    assert.equal(liberadas, 8, 'no total só 8 tentativas passam, não 16');
    assert.ok(a.tentar('outra@teste.com'), 'outra conta tem o próprio contador');
    a.limpar('ana@teste.com');
    assert.ok(b.tentar('ana@teste.com'), 'login certo zera o contador, vale nas duas cópias');
    assert.equal(dbA.prepare('SELECT COUNT(*) n FROM limites WHERE chave LIKE ?').get('%@%').n, 0, 'e-mail nunca é gravado em texto');
    dbA.close(); dbB.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
