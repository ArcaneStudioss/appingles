'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MISSOES, POR_ID } = require('../src/conteudo/missoes');
const { montarLicao, paraCliente, missaoAtual } = require('../src/motor/licao');
const { licoesPorMissao } = require('../src/motor/plano');
const { corrigirExercicio } = require('../src/motor/correcao');
const { dificuldadeAlvo, dominioPorTag } = require('../src/motor/modelo');
const { montarSessao } = require('../src/sessoes');
const montar = (m, partes, idade = 30) => ({ perfil: { idade, minutos_dia: 10 }, nivel: 'A1', plano: { nivelInicial: 'A1', objetivoNome: 'Aprender', missoes: [{ id: m.id, licoes: 3 }] }, competencias: { [m.id]: { status: 'praticando', partes } }, tentativas: [], hojeISO: '2026-10-25' });

test('duas oficinas com frases diferentes: modelo primeiro, lacuna e montagem sem apoio, frase anterior de memória', () => {
  for (const m of MISSOES) {
    const inicio = Math.ceil(m.vocab.length / 3);
    const modelos = [];
    for (let rodada = 0; rodada < 2; rodada++) {
      const l = montarLicao(montar(m, inicio + rodada));
      assert.equal(l.oficina, true, m.id);
      assert.ok(!l.blocos.some(b => b.tipo === 'producao'));
      const itens = l.blocos.flatMap(b => b.exercicios || []);
      assert.ok(itens.length >= 4 && itens.length <= 7, m.id);
      assert.equal(new Set(itens.map(e => e.id)).size, itens.length);
      assert.equal(itens.filter(e => e.ensino).length, 2, m.id);
      assert.ok(!itens.some(e => e.tipo === 'escuta' && e.ensino), 'escuta sem o texto na tela');
      const en = itens[0].ensino.en;
      modelos.push(en);
      for (const e of itens) {
        const resposta = e.opcoes ? e.opcoes[e.resposta] : e.resposta;
        assert.ok(corrigirExercicio(e, Array.isArray(resposta) ? resposta[0] : resposta).correto, e.id);
        if (e.opcoes) assert.equal(new Set(e.opcoes).size, e.opcoes.length, e.id);
      }
      if (rodada === 1) assert.ok(itens.some(e => e.enunciado?.startsWith('Lembra da frase')), m.id);
      const cliente = paraCliente(l, 'qa');
      assert.ok(cliente.blocos[1].exercicios[0].ensino.en);
      for (const e of cliente.blocos[1].exercicios) assert.equal(e.resposta, undefined);
    }
    if (m.id.startsWith('zero-')) assert.notEqual(modelos[0], modelos[1], m.id);
  }
});

test('vocabulário e alternativas da base ficam no que foi apresentado', () => {
  const m = POR_ID['zero-sons'];
  const l = montarLicao(montar(m, 0));
  const aprendidas = l.blocos[0].vocab.flatMap(v => [v.pt, v.en]);
  for (const e of l.blocos.flatMap(b => b.exercicios || [])) {
    if (e.opcoes) assert.ok(e.opcoes.every(o => aprendidas.includes(o)));
  }
});

test('planos antigos não pulam as novas partes; sessão curta usa a duração completa', () => {
  const m = POR_ID['zero-sons'], c = montar(m, 3);
  assert.equal(missaoAtual(c.plano, c.competencias).id, m.id);
  const sessao = montarSessao({ ...c, minutos: 5 });
  assert.equal(sessao.totalPartes, licoesPorMissao(m, 'A1'));
  assert.ok(sessao.itens.some(e => e.ensino));
  c.competencias[m.id].partes = licoesPorMissao(m, 'A1');
  assert.equal(missaoAtual(c.plano, c.competencias), null);
});

test('prática com modelo não aumenta dificuldade nem domínio independente', () => {
  const treino = Array.from({ length: 25 }, () => ({ dica: 1, correto: true, tag: 'artigo-profissao', formato: 'producao', em: '2026-10-25' }));
  assert.equal(dificuldadeAlvo('A1', treino), 1);
  assert.deepEqual(dominioPorTag(treino), {});
});
