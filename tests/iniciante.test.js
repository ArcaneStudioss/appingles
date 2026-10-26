'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MISSOES } = require('../src/conteudo/missoes');
const { montarLicao, paraCliente, acharExercicio } = require('../src/motor/licao');
const { licoesPorMissao } = require('../src/motor/plano');
const { corrigirExercicio } = require('../src/motor/correcao');

function aula(m, feitas = 0, nivel = 'A1') {
  return montarLicao({ perfil: { minutos_dia: 20 }, nivel,
    plano: { missoes: [{ id: m.id }], objetivoNome: 'Começar do zero' },
    competencias: { [m.id]: { status: 'praticando', partes: feitas } },
    hojeISO: '2026-10-24', cartoesPendentes: 2 });
}

test('A1: duas expressões, três práticas por expressão, repetição no dia seguinte e retomada', () => {
  for (const m of MISSOES) {
    const total = licoesPorMissao(m, 'A1');
    for (let feitas = 0; feitas < total - 7; feitas++) {
      const l = aula(m, feitas);
      const vocab = l.blocos[0].vocab;
      const itens = l.blocos.flatMap(b => b.exercicios || []);
      assert.ok(vocab.length <= 2 && vocab.length > 0, m.id);
      assert.ok(itens.length <= 7, m.id);
      assert.equal(new Set(itens.map(e => e.id)).size, itens.length);
      assert.equal(l.revisoesPendentes, 2);
      assert.ok(!l.blocos.some(b => ['producao', 'foco', 'rapidas'].includes(b.tipo)));
      for (const v of vocab) {
        assert.equal(itens.filter(e => e.explica === `${v.en} = ${v.pt}. Ouça e repita quantas vezes precisar.`).length, 3);
      }
      for (const e of itens) {
        const resposta = e.opcoes ? e.opcoes[e.resposta] : e.resposta;
        assert.ok(corrigirExercicio(e, resposta).correto, e.id);
        assert.equal(acharExercicio(l, e.id), e);
        if (e.opcoes) assert.equal(new Set(e.opcoes).size, 2, e.id);
      }
      const cliente = paraCliente(l, 'teste');
      for (const e of cliente.blocos.flatMap(b => b.exercicios || [])) assert.equal(e.resposta, undefined);
      if (feitas % 2) assert.deepEqual(vocab, aula(m, feitas - 1).blocos[0].vocab);
      if (feitas >= 2) assert.ok(l.blocos.some(b => b.tipo === 'retomada'));
    }
    const transicao = aula(m, total - 3);
    assert.ok(transicao.blocos.some(b => b.tipo === 'explicacao'));
    assert.ok(!transicao.blocos.some(b => b.titulo === 'Treino extra'));
    assert.ok(!transicao.blocos.flatMap(b => b.exercicios || []).some(e => ['traduzir', 'ditado'].includes(e.tipo)));
    assert.ok(aula(m, total - 1).blocos.some(b => b.tipo === 'producao' && b.tarefa === m.tarefa));
  }
});

test('níveis acima do A1 mantêm a duração e o fluxo anteriores', () => {
  const m = MISSOES.find(m => m.nivel === 'A1');
  assert.equal(licoesPorMissao(m, 'A2'), 2);
  assert.equal(licoesPorMissao(m, 'B1'), 1);
  assert.equal(aula(m, 0, 'A2').inicianteGuiado, undefined);
});

test('A1 sem prazo mantém a trilha inteira mesmo com mais repetições', () => {
  const { montarPlano } = require('../src/motor/plano');
  const { OBJETIVOS } = require('../src/conteudo/objetivos');
  const plano = montarPlano({ idade: 30, objetivo: 'zero', dias_semana: 3, minutos_dia: 10 }, 'A1', '2026-10-24');
  assert.deepEqual(plano.missoes.map(m => m.id), OBJETIVOS.zero.missoes);
  assert.ok(plano.semanasPrevistas > 12);
});
