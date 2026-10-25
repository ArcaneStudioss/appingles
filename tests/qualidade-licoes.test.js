'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MISSOES, POR_ID } = require('../src/conteudo/missoes');
const { GUIAS } = require('../src/conteudo/guias');
const { montarLicao, paraCliente, escolherExercicios, validarExerciciosIa, limiteDaLicao, limitarQuestoes } = require('../src/motor/licao');
const { licoesPorMissao } = require('../src/motor/plano');
const { corrigirExercicio, respostaCerta, avaliarProducao } = require('../src/motor/correcao');

const ctx = (m, nivel, parte) => ({ perfil: { minutos_dia: 20 }, nivel, hojeISO: '2026-10-24',
  plano: { objetivoNome: 'Praticar', missoes: [{ id: m.id }] },
  competencias: { [m.id]: { status: 'praticando', partes: parte - 1 } } });

test('todas as missões têm orientação, exemplos e correções utilizáveis', () => {
  assert.ok(Object.keys(GUIAS).every(id => POR_ID[id]));
  for (const m of MISSOES) {
    assert.ok(m.guia.foco && m.guia.nota && m.guia.exemplo.en && m.guia.exemplo.pt, m.id);
    assert.ok(avaliarProducao(m.tarefa, m.tarefa.modelo).demonstrado, m.id);
    for (const e of m.exercicios) {
      assert.ok(corrigirExercicio(e, e.tipo === 'detetive' ? String(e.erro) : respostaCerta(e)).correto, e.id);
      const erro = corrigirExercicio(e, 'zzz');
      assert.ok(erro.explica && !erro.explica.includes('undefined'), e.id);
      if (e.tipo === 'lacuna' && !e.explica) assert.ok(!erro.explica.includes('___'), e.id);
    }
  }
});

test('todas as partes e níveis respeitam o limite e não repetem IDs dentro da aula', () => {
  for (const m of MISSOES) for (const nivel of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    const total = licoesPorMissao(m, nivel);
    for (let parte = 1; parte <= total; parte++) {
      const l = montarLicao(ctx(m, nivel, parte));
      const itens = l.blocos.flatMap(b => b.exercicios || []);
      assert.ok(itens.length > 0 && itens.length <= limiteDaLicao(l.blocos), `${m.id}/${nivel}/${parte}`);
      assert.equal(new Set(itens.map(e => e.id)).size, itens.length, `${m.id}/${nivel}/${parte}`);
      if (!l.guiada && !l.inicianteGuiado) assert.ok(l.blocos.some(b => b.guia === m.guia));
      const cliente = paraCliente(l, 'qa');
      for (const e of cliente.blocos.flatMap(b => b.exercicios || [])) {
        assert.equal(e.resposta, undefined);
        assert.equal(e.aceitas, undefined);
        assert.equal(e.explica, undefined);
      }
    }
  }
});

test('seleção retoma erros antes de novidades e nunca preenche vagas com dificuldade excessiva', () => {
  const itens = [{ id: 'novo', dif: 1 }, { id: 'errado', dif: 1 }, { id: 'dificil', dif: 3 }, { id: 'feito', dif: 1 }];
  const r = escolherExercicios(itens, { quantos: 10, alvo: 1, vistos: { errado: { acertou: false }, feito: { acertou: true } } });
  assert.deepEqual(r.map(e => e.id), ['errado', 'novo', 'feito']);
});

test('limite preserva prática, escuta e revisão mesmo com exercícios da IA', () => {
  const bloco = (tipo, n, extra = {}) => ({ tipo, ...extra, exercicios: Array.from({ length: n }, (_, i) => ({ id: tipo + i, tipo: tipo === 'escuta' ? 'escuta' : 'escolha' })) });
  const blocos = [bloco('exercicios', 5), bloco('escuta', 2), bloco('retomada', 2), bloco('exercicios', 3, { personalizado: true })];
  limitarQuestoes(blocos);
  assert.equal(blocos.flatMap(b => b.exercicios).length, 7);
  for (const tipo of ['exercicios', 'escuta', 'retomada']) assert.ok(blocos.some(b => b.tipo === tipo && b.exercicios.length));
});

test('IA descarta opções equivalentes, itens duplicados, nulos e sem explicação', () => {
  const valido = { tipo: 'escolha', enunciado: 'Qual frase diz que você está feliz?', opcoes: ['I am happy.', 'I am tired.'], correta: 0, explicacao: 'Happy significa feliz; tired significa cansado.' };
  const lista = [null, { ...valido, explicacao: '' }, { ...valido, opcoes: ['I am happy.', "I'm happy."] }, valido, { ...valido }];
  assert.equal(validarExerciciosIa(lista, 'teste').length, 1);
});

test('o modelo ajuda na prática e fica oculto nos retestes', () => {
  const m = POR_ID.apresentar;
  const l = montarLicao(ctx(m, 'A2', licoesPorMissao(m, 'A2')));
  const tarefa = paraCliente(l, 'qa').blocos.find(b => b.tipo === 'producao').tarefa;
  assert.equal(tarefa.modelo, m.tarefa.modelo);
  assert.deepEqual(tarefa.roteiro, m.tarefa.elementos.map(e => e.nome));
  const reteste = montarLicao({ ...ctx(m, 'A2', 2), competencias: { apresentar: { status: 'demonstrado', demonstrado_em: '2026-10-01', retestes: 0 } } });
  const t = paraCliente(reteste, 'qa').blocos.find(b => b.reteste).tarefa;
  assert.equal(t.modelo, null);
  assert.deepEqual(t.roteiro, []);
  assert.deepEqual(t.dicas, []);
});

test('a primeira missão cobra apenas as instruções ensinadas', () => {
  const t = POR_ID['zero-sons'].tarefa;
  assert.ok(avaliarProducao(t, 'Hello! Thank you! Bye!').demonstrado);
  assert.ok(!avaliarProducao(t, 'Listen and repeat. Please repeat.').demonstrado);
  assert.ok(avaliarProducao(POR_ID['zero-oi-tchau'].tarefa, 'Hello! Thank you. Bye!').demonstrado);
});
