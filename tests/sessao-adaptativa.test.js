'use strict';
// Sessão curta que acompanha o aluno: ritmo, modo mais fraco, erros a firmar, apoios e segunda chance.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { POR_ID, TODOS_EXERCICIOS } = require('../src/conteudo/missoes');
const { montarItens, adaptacao, segundaChance, comBancoDePalavras, modoDoTipo } = require('../src/motor/sessao-adaptativa');
const { montarSessao } = require('../src/sessoes');

const AGORA = Date.parse('2026-11-10T12:00:00Z');
const em = (dias, k = 0) => new Date(AGORA - dias * 864e5 + k * 1000).toISOString();
const missao = POR_ID.trajetoria;
const formato = e => (['escolha', 'leitura', 'escuta'].includes(e.tipo) ? 'reconhecimento' : 'producao');
const modalidade = e => (['escuta', 'ditado'].includes(e.tipo) ? 'audio' : 'texto');
// tentativas sobre exercícios reais de outras missões (para não esbarrar nas questões novas desta)
const outras = Object.values(TODOS_EXERCICIOS).filter(e => !missao.exercicios.some(x => x.id === e.id));
const tentativa = (e, correto, k, extra = {}) => ({ item_id: e.id, tag: e.tag || null, formato: formato(e), modalidade: modalidade(e), correto, dica: false, origem: 'licao', em: em(1, k), ...extra });

test('aluno com acerto baixo: começa pelo mais fácil, tira as questões mais puxadas e liga os apoios', () => {
  const ts = outras.slice(0, 15).map((e, k) => tentativa(e, k % 4 === 0, k));
  const ad = adaptacao({ tentativas: ts, nivel: 'A2', agora: AGORA });
  assert.equal(ad.ritmo, 'apoio');
  assert.equal(ad.bancoEscrita, true);
  const { itens, porque } = montarItens({ missao, banco: TODOS_EXERCICIOS, tentativas: ts, minutos: 10, nivel: 'A2', agora: AGORA });
  assert.ok(itens.length >= 4);
  assert.ok(!itens.some(e => ['traduzir', 'ditado'].includes(e.tipo)), 'sem tradução e ditado enquanto o acerto está baixo');
  const difs = itens.filter(e => e.etapa === 'Praticar').map(e => e.dif || 1);
  assert.equal(difs[0], Math.min(...difs), 'a primeira questão é a mais leve');
  assert.ok(porque.some(p => /mais fáceis/.test(p)));
  for (const e of itens.filter(x => x.tipo === 'lacuna' && x.apoioBanco)) assert.ok(e.bancoPalavras.includes(e.resposta[0]));
});

test('aluno acertando quase tudo sem dica: entram questões mais puxadas no A1', () => {
  const ts = outras.slice(0, 20).map((e, k) => tentativa(e, true, k));
  const ad = adaptacao({ tentativas: ts, nivel: 'A1', agora: AGORA });
  assert.equal(ad.ritmo, 'desafio');
  const { itens, porque } = montarItens({ missao, banco: TODOS_EXERCICIOS, tentativas: ts, minutos: 20, nivel: 'A1', agora: AGORA });
  assert.ok(itens.some(e => ['traduzir', 'escuta'].includes(e.tipo)), 'A1 em bom ritmo também traduz e ouve');
  assert.ok(porque.some(p => /mais puxadas/.test(p)));
});

test('erro ainda não corrigido volta para relembrar; erro já corrigido depois não volta', () => {
  const errada = outras.find(e => e.tipo === 'escolha'), corrigida = outras.find(e => e.tipo === 'escolha' && e.id !== errada.id && e.tag !== errada.tag);
  const ts = [tentativa(errada, false, 1), tentativa(corrigida, false, 2), tentativa(corrigida, true, 3)];
  const { itens, porque } = montarItens({ missao, banco: TODOS_EXERCICIOS, tentativas: ts, minutos: 10, nivel: 'A2', agora: AGORA });
  const relembrar = itens.filter(e => e.etapa === 'Relembrar').map(e => e.id);
  assert.ok(relembrar.includes(errada.id));
  assert.ok(!relembrar.includes(corrigida.id));
  assert.ok(porque.some(p => /errou antes/.test(p)));
  assert.notEqual(itens[0].etapa, 'Relembrar', 'a sessão não abre com a questão que deu erro');
});

test('questão que a pessoa já acerta sozinha perde a vez para as que ainda não domina', () => {
  const ja = missao.exercicios.filter(e => ['escolha', 'lacuna', 'ordenar', 'leitura'].includes(e.tipo)).slice(0, 2);
  const ts = ja.flatMap((e, i) => [tentativa(e, true, 10 * i), tentativa(e, true, 10 * i + 1)]);
  const { itens } = montarItens({ missao, banco: TODOS_EXERCICIOS, tentativas: ts, minutos: 10, nivel: 'A1', agora: AGORA });
  const praticar = itens.filter(e => e.etapa === 'Praticar').map(e => e.id);
  const posDominadas = praticar.map((id, i) => (ja.some(x => x.id === id) ? i : -1)).filter(i => i >= 0);
  const posOutras = praticar.map((id, i) => (ja.some(x => x.id === id) ? -1 : i)).filter(i => i >= 0);
  assert.ok(posOutras.length, 'há questões ainda não dominadas');
  assert.ok(posDominadas.every(i => i > Math.max(...posOutras)), 'dominadas ficam para o fim');
});

test('escuta fraca deixa o áudio devagar e puxa mais escuta; o motivo aparece para o aluno', () => {
  const audio = outras.filter(e => ['escuta', 'ditado'].includes(e.tipo)).slice(0, 8), leitura = outras.filter(e => e.tipo === 'escolha').slice(0, 8);
  const ts = [...audio.map((e, k) => tentativa(e, k < 2, k)), ...leitura.map((e, k) => tentativa(e, true, 20 + k))];
  const ad = adaptacao({ tentativas: ts, nivel: 'A2', agora: AGORA });
  assert.equal(ad.fraco, 'ouvir');
  assert.equal(ad.ouvirDevagar, true);
  const { itens, porque, adaptacao: a } = montarItens({ missao, banco: TODOS_EXERCICIOS, tentativas: ts, minutos: 10, nivel: 'A2', agora: AGORA });
  assert.equal(a.ouvirDevagar, true);
  assert.ok(itens.some(e => modoDoTipo(e.tipo) === 'ouvir'));
  assert.ok(porque.some(p => /escuta/.test(p)) && porque.some(p => /devagar/.test(p)));
});

test('segunda chance: a questão errada volta uma vez, até o limite da sessão', () => {
  const d = { itens: missao.exercicios.slice(0, 3).map(e => ({ ...e })), adaptacao: { segundasChances: 1 } };
  const copia = segundaChance(d, d.itens[0], { correto: false });
  assert.equal(copia.id, d.itens[0].id + '~2');
  assert.equal(copia.origemId, d.itens[0].id);
  assert.equal(segundaChance(d, d.itens[0], { correto: true }), null, 'acerto não volta');
  d.itens.push(copia);
  assert.equal(segundaChance(d, copia, { correto: false }), null, 'a segunda chance não gera uma terceira');
  assert.equal(segundaChance(d, d.itens[1], { correto: false }), null, 'limite de segundas chances da sessão');
});

test('banco de palavras só em lacuna de um espaço e sempre com a resposta certa', () => {
  const lacuna = missao.exercicios.find(e => e.tipo === 'lacuna' && e.frase.split('___').length === 2 && !/\s/.test(e.resposta[0]));
  const comBanco = comBancoDePalavras(lacuna, missao);
  if (comBanco.apoioBanco) { assert.ok(comBanco.bancoPalavras.includes(lacuna.resposta[0])); assert.ok(comBanco.bancoPalavras.length >= 2); }
  const escolha = missao.exercicios.find(e => e.tipo === 'escolha');
  assert.equal(comBancoDePalavras(escolha, missao), escolha);
});

test('sessão nova (sem histórico) explica que ainda está conhecendo e mantém a ordem das missões do zero', () => {
  const plano = { missoes: [{ id: 'trajetoria' }] };
  const s = montarSessao({ perfil: { idade: 30 }, plano, competencias: {}, tentativas: [], minutos: 10, nivel: 'A2', agora: AGORA });
  assert.equal(s.adaptacao.ritmo, 'conhecendo');
  assert.ok(s.porque.some(p => /conhecendo/.test(p)));
  assert.ok(s.itens.length > 0 && s.itens.length <= 6);
});

test('evolução mostrada ao aluno compara as duas últimas semanas e lista os ajustes ligados', () => {
  const { resumoEvolucao } = require('../src/motor/sessao-adaptativa');
  const antes = outras.slice(0, 12).map((e, k) => ({ ...tentativa(e, k % 2 === 0, k), em: em(20, k) }));
  const agora = outras.slice(12, 24).map((e, k) => ({ ...tentativa(e, k !== 0, k), em: em(3, k) }));
  const ev = resumoEvolucao([...antes, ...agora], { agora: AGORA });
  assert.equal(ev.anterior.pct, 50);
  assert.equal(ev.recente.pct, 92);
  assert.equal(ev.tendencia, 'subindo');
  assert.equal(resumoEvolucao(agora.slice(0, 3), { agora: AGORA }).tendencia, null, 'com poucas respostas não arrisca tendência');
});

test('pista de estrutura ajuda sem entregar a resposta', () => {
  const { pistaDeEstrutura, apoioDoExercicio } = require('../src/motor/apoio');
  for (const e of Object.values(TODOS_EXERCICIOS).filter(x => ['lacuna', 'ordenar', 'ditado', 'traduzir'].includes(x.tipo) && !x.dica)) {
    const pista = pistaDeEstrutura(e);
    if (!pista) continue;
    const certa = e.tipo === 'lacuna' ? e.resposta[0] : e.tipo === 'ordenar' ? e.resposta : e.tipo === 'ditado' ? e.audio : e.aceitas[0];
    if (String(certa).length > 3) assert.ok(!pista.toLowerCase().includes(String(certa).toLowerCase()), `${e.id}: a pista não traz a resposta`);
    assert.ok(apoioDoExercicio(e).dica.includes(pista));
  }
});
