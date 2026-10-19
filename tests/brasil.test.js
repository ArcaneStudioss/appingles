'use strict';
// Álbum Brasil: figurinhas, missões temáticas, mistura nos planos e tradução por palavra.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { FIGURINHAS, POR_MISSAO, codigoConquista } = require('../src/conteudo/figurinhas');

const PUBLICO = path.join(__dirname, '..', 'public', 'assets', 'figurinhas');
const TRACO_LONGO = /[—–]/;

test('figurinhas: 10 no catálogo, ids únicos, ligadas a uma missão e com o código de conquista fig-<id>', () => {
  assert.equal(FIGURINHAS.length, 10);
  assert.equal(new Set(FIGURINHAS.map(f => f.id)).size, 10);
  assert.equal(POR_MISSAO['brasil-arara'].id, 'arara');
  assert.equal(codigoConquista(POR_MISSAO['brasil-mico']), 'fig-mico');
  assert.deepEqual(FIGURINHAS.map(f => f.id), ['arara', 'mico', 'onca', 'peixeboi', 'tartaruga', 'lobo', 'catadora', 'pescador', 'quilombola', 'indigena']);
});

test('figurinhas: cada uma tem imagem leve, textos e tom válido, sem travessão longo', () => {
  for (const f of FIGURINHAS) {
    const arq = path.join(PUBLICO, f.arquivo);
    assert.ok(fs.existsSync(arq), `${f.id}: falta ${f.arquivo}`);
    assert.ok(fs.statSync(arq).size < 150 * 1024, `${f.id}: imagem acima de 150 KB`);
    for (const campo of ['nome', 'estado', 'alt', 'legendaEn', 'legendaPt']) assert.ok(f[campo] && f[campo].trim(), `${f.id}.${campo} vazio`);
    assert.ok(['aviso', 'perigo', 'orgulho'].includes(f.tom), `${f.id}: tom ${f.tom}`);
    assert.ok(['animal', 'gente'].includes(f.grupo), `${f.id}: grupo ${f.grupo}`);
    assert.equal(f.missao, 'brasil-' + f.id);
    assert.equal(f.conferido, false, `${f.id}: conferido só vira true depois da checagem das fontes`);
    assert.ok(!TRACO_LONGO.test(JSON.stringify(f)), `${f.id}: travessão longo`);
  }
});

const { MISSOES_BRASIL } = require('../src/conteudo/missoes-brasil');
const { POR_ID } = require('../src/conteudo/missoes');

test('missões do Brasil: as 10, na ordem da spec, cada uma ligada à sua figurinha e carregada em POR_ID', () => {
  assert.deepEqual(MISSOES_BRASIL.map(m => m.id), FIGURINHAS.map(f => f.missao));
  assert.equal(MISSOES_BRASIL.length, FIGURINHAS.length);
  assert.equal(new Set(MISSOES_BRASIL.map(m => m.id)).size, 10);
  for (const m of MISSOES_BRASIL) {
    assert.strictEqual(POR_ID[m.id], m, `${m.id} não foi carregada em missoes.js`);
    assert.equal(POR_MISSAO[m.id].id, m.figurinha, `${m.id}: figurinha ${m.figurinha}`);
  }
});

test('missões do Brasil: forma exigida (6 palavras, 4 exemplos, 8+ exercícios variados, escuta, ids com prefixo)', () => {
  for (const m of MISSOES_BRASIL) {
    assert.ok(['A1', 'A2'].includes(m.nivel), `${m.id}: nível ${m.nivel}`);
    assert.equal(m.vocab.length, 6, `${m.id}: vocab`);
    assert.ok(m.exemplos.length >= 4, `${m.id}: exemplos`);
    assert.ok(m.exercicios.length >= 8, `${m.id}: exercícios`);
    assert.ok(new Set(m.exercicios.map(e => e.tipo)).size >= 4, `${m.id}: pouca variedade de tipos`);
    assert.ok(m.exercicios.some(e => ['escuta', 'ditado'].includes(e.tipo)), `${m.id}: sem exercício de áudio`);
    for (const e of m.exercicios.filter(e => e.tipo !== 'fala')) assert.ok(e.id.startsWith(m.id + '-') && e.explica, `${e.id}: id sem prefixo ou sem explica`);
    assert.ok(m.tarefa.modelo && m.tarefa.elementos.length >= 3, `${m.id}: tarefa`);
  }
});

test('missões do Brasil: níveis certos (as A1 servem ao objetivo "começar do zero")', () => {
  const nivel = Object.fromEntries(MISSOES_BRASIL.map(m => [m.id, m.nivel]));
  for (const id of ['brasil-arara', 'brasil-mico', 'brasil-catadora', 'brasil-pescador']) assert.equal(nivel[id], 'A1', id);
  for (const id of ['brasil-onca', 'brasil-peixeboi', 'brasil-tartaruga', 'brasil-lobo', 'brasil-quilombola', 'brasil-indigena']) assert.equal(nivel[id], 'A2', id);
});

const { montarPlano, intercalar } = require('../src/motor/plano');

test('plano: intercalar põe uma missão do Brasil a cada 3 regulares e o que sobrar vai ao fim', () => {
  assert.deepEqual(intercalar(['a', 'b', 'c', 'd', 'e', 'f', 'g'], ['X', 'Y']), ['a', 'b', 'c', 'X', 'd', 'e', 'f', 'Y', 'g']);
  assert.deepEqual(intercalar(['a', 'b'], ['X', 'Y', 'Z']), ['a', 'b', 'X', 'Y', 'Z']);
  assert.deepEqual(intercalar([], ['X', 'Y']), ['X', 'Y']);
});

test('plano: todo objetivo recebe as 10 missões do Brasil, nunca como essenciais', () => {
  for (const objetivo of ['trabalho', 'entrevista', 'clientes']) {
    const p = montarPlano({ objetivo, prazo: null, minutos_dia: 15, dias_semana: 5 }, 'A2', '2026-10-19');
    const br = p.missoes.filter(m => m.brasil);
    assert.equal(br.length, 10, objetivo);
    assert.ok(br.every(m => !m.essencial), objetivo + ': missão do Brasil marcada como essencial');
    assert.ok(p.missoes.filter(m => !m.brasil).every(m => !m.id.startsWith('brasil-')), objetivo);
    const posicoes = p.missoes.map((m, i) => m.brasil ? i : -1).filter(i => i >= 0);
    assert.equal(posicoes[0], 3, objetivo + ': a primeira do Brasil vem depois de 3 regulares');
  }
});

test('plano: prazo curto corta as do Brasil antes das essenciais, mas sempre fica pelo menos uma', () => {
  const p = montarPlano({ objetivo: 'trabalho', prazo: '2026-11-02', minutos_dia: 10, dias_semana: 3 }, 'A2', '2026-10-19');
  const br = p.missoes.filter(m => m.brasil);
  assert.ok(br.length >= 1 && br.length < 10, `ficaram ${br.length} do Brasil`);
  assert.ok(p.missoes.filter(m => !m.brasil).every(m => m.essencial), 'sobrou missão regular que não é essencial');
  assert.ok(p.avisos.some(av => /Álbum Brasil/.test(av)), 'sem o aviso de que uma do Brasil foi mantida');
});

test('plano: "começar do zero" só recebe missões do Brasil de nível A1, também com prazo curto', () => {
  for (const prazo of [null, '2026-11-02']) {
    const p = montarPlano({ objetivo: 'zero', prazo, minutos_dia: 10, dias_semana: 3 }, 'A1', '2026-10-19');
    const br = p.missoes.filter(m => m.brasil);
    assert.ok(br.length >= 1, 'prazo ' + prazo);
    assert.ok(br.every(m => POR_ID[m.id].nivel === 'A1'), 'prazo ' + prazo + ': veio missão A2 no plano do zero');
  }
});

const { traduzir, limpar } = require('../src/motor/dicionario');

test('dicionário: acha a palavra do conteúdo mesmo com maiúscula, pontuação, plural, -s, -ing, -ed e contração', () => {
  assert.equal(traduzir('macaw').pt, 'arara');
  assert.equal(traduzir('macaw').exemplo, 'The macaw is blue.');
  for (const forma of ['Macaws,', 'MACAW', '  macaw. ', '"macaw"']) assert.equal(traduzir(forma)?.pt, 'arara', forma);
  assert.equal(traduzir('Macaws,').palavra, 'macaw', 'devolve a forma base');
  assert.match(traduzir('lives').pt, /viver|morar/);
  assert.match(traduzir('protecting').pt, /proteger/);
  assert.match(traduzir('separated').pt, /separar/);
  assert.ok(traduzir("Don't"), "don't");
  assert.ok(traduzir('Don’t'), 'aspa curva em don’t');
  assert.equal(traduzir('lives in').pt, 'vive em', 'frase inteira do vocabulário');
  assert.match(traduzir('the').pt, /o, a/);
});

test('dicionário: palavra desconhecida ou entrada vazia devolve null, sem lançar erro', () => {
  for (const v of ['xylophonist', '', '   ', '123', '...', null, undefined, 42, {}]) assert.equal(traduzir(v), null, String(v));
  assert.equal(limpar('  Macaws,  '), 'macaws');
});

test('dicionário: toda palavra de vocabulário das missões é encontrada (o que o app ensina o app traduz)', () => {
  const { MISSOES } = require('../src/conteudo/missoes');
  for (const m of MISSOES) for (const v of m.vocab) assert.ok(traduzir(v.en), `${m.id}: "${v.en}" sem tradução`);
});

// ---- correções da revisão final ----
test('dicionário: forma flexionada não vira outra palavra por engano (maned, used, thing, bed, news)', () => {
  assert.match(traduzir('maned').pt, /lobo/, 'maned é de "maned wolf", não "man"');
  assert.equal(traduzir('used').palavra, 'use');
  assert.notEqual(traduzir('thing')?.palavra, 'the');
  assert.notEqual(traduzir('bed')?.palavra, 'be');
  assert.notEqual(traduzir('news')?.palavra, 'new');
  assert.equal(traduzir('wolves').palavra, 'wolf', 'plural em -ves');
});

test('dicionário: toda palavra dos textos das missões do Brasil tem tradução (menos nomes de pessoas)', () => {
  const NOMES = new Set(['ana', 'dona', 'jonas', 'maria']);
  const falta = new Set();
  for (const m of MISSOES_BRASIL) {
    const textos = [...m.exemplos.map(e => e.en), ...m.vocab.map(v => v.ex), ...m.exercicios.flatMap(e => [e.frase, e.texto, e.audio]).filter(Boolean), m.tarefa.modelo];
    for (const t of textos) for (const w of t.match(/[A-Za-z][A-Za-z’'-]*/g) || []) if (!NOMES.has(w.toLowerCase()) && !traduzir(w)) falta.add(w.toLowerCase());
  }
  assert.deepEqual([...falta].sort(), [], 'palavras sem tradução');
});

test('plano sem prazo: a meta ("em cerca de N semanas") conta até a última missão essencial, não até o fim das extras do Brasil', () => {
  const p = montarPlano({ objetivo: 'entrevista', prazo: null, minutos_dia: 15, dias_semana: 2 }, 'A1', '2026-10-19');
  const ultimaEssencial = Math.max(...p.missoes.filter(m => m.essencial).map(m => m.semana));
  assert.ok(p.semanasPrevistas > ultimaEssencial, 'o plano inteiro é mais longo que a meta');
  const prometidas = Number(p.metaRealista.match(/Em cerca de (\d+) semanas/)?.[1]);
  assert.ok(prometidas >= ultimaEssencial && prometidas < p.semanasPrevistas, `meta em ${prometidas} semanas; essencial começa na ${ultimaEssencial}; plano inteiro ${p.semanasPrevistas}`);
});
