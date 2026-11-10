'use strict';
// Regressões da revisão geral de 11/2026: ritmo das aulas iniciais, escuta sem gabarito na tela,
// caça ao erro com correção que gera frase certa e página pública sem marcadores por preencher.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { MISSOES } = require('../src/conteudo/missoes');
const { montarLicao } = require('../src/motor/licao');

const zero = id => MISSOES.find(m => m.id === id);
function aula(m, feitas, tentativas = []) {
  return montarLicao({ perfil: { minutos_dia: 20, objetivo: 'zero' }, nivel: 'A1', tentativas,
    plano: { missoes: [{ id: m.id }], objetivoNome: 'Começar do zero' },
    competencias: { [m.id]: { status: 'praticando', partes: feitas } }, hojeISO: '2026-11-09', cartoesPendentes: 0 });
}
const itens = l => l.blocos.flatMap(b => b.exercicios || []);
const acertos = (n, correto = true) => Array.from({ length: n }, (_, i) => ({ item_id: 't' + i, origem: 'licao', correto, missao: 'zero-sons', em: '2026-11-08T10:00:00Z' }));

test('escuta da aula inicial não mostra a resposta escrita; o modelo fica só no primeiro contato', () => {
  const l = aula(zero('zero-oi-tchau'), 0);
  const escutas = itens(l).filter(e => e.tipo === 'escuta');
  assert.ok(escutas.length >= 2);
  for (const e of escutas) assert.equal(e.ensino, undefined, e.id);
  const ler = itens(l).filter(e => /:ler$/.test(e.id));
  assert.ok(ler[0].ensino, 'a primeira expressão é reconhecida com o modelo');
  assert.ok(ler.slice(1).every(e => !e.ensino), 'as outras acabaram de aparecer nos cartões: o aluno lembra sem copiar');
  assert.equal(l.embalado, undefined);
});

test('quem acertou as seis últimas atividades segue sem modelo na tela (aula de palavras e oficina)', () => {
  const m = zero('zero-oi-tchau');
  const rapida = aula(m, 1, acertos(6));
  assert.equal(rapida.embalado, true);
  assert.ok(itens(rapida).every(e => !e.ensino));
  // um erro recente ou pouco histórico mantém o apoio
  assert.equal(aula(m, 1, [...acertos(5), ...acertos(1, false)]).embalado, undefined);
  assert.equal(aula(m, 1, acertos(5)).embalado, undefined);
  // oficina de frases: só o primeiro exercício mantém o modelo
  const parteOficina = Math.ceil(m.vocab.length / 3);
  const oficina = aula(m, parteOficina, acertos(6));
  assert.equal(oficina.oficina, true);
  assert.equal(itens(oficina).filter(e => e.ensino).length, 1);
  assert.ok(itens(aula(m, parteOficina)).filter(e => e.ensino).length >= 2, 'sem histórico o apoio completo continua');
});

test('caça ao erro: trocar a palavra errada pela correção deixa a frase certa (idade com years old)', () => {
  for (const id of ['apresentar', 'zero-numeros']) {
    const d = zero(id).exercicios.find(e => e.tipo === 'detetive');
    const frase = d.tokens.map((t, i) => i === d.erro ? d.correcao : t).join(' ');
    assert.match(frase, /^I am (30|twenty) years old\b/, frase);
  }
});

// ---- página pública servida sem marcadores do servidor por preencher
const PORTA = 21000 + Math.floor(Math.random() * 900), DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-rev-'));
let srv;
before(async () => {
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, NODE_ENV: 'test', PORT: String(PORTA), DATA_DIR: DIR, AUTH_PROVIDER: 'local', BACKUP_DESLIGADO: '1', ANTHROPIC_API_KEY: '', PAGAMENTO_MODO: 'desligado' }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { try { await fetch(`http://localhost:${PORTA}/saude`); return; } catch { await new Promise(r => setTimeout(r, 60)); } }
});
after(() => { srv?.kill(); fs.rmSync(DIR, { recursive: true, force: true }); });

test('página pública mostra os cinco planos e nenhum marcador "__NOME__" sobra no HTML', async () => {
  const html = await (await fetch(`http://localhost:${PORTA}/`)).text();
  assert.deepEqual(html.match(/__[A-Z][A-Z_]+__/g), null);
  assert.equal((html.match(/data-plano="/g) || []).length, 5);
  const app = await (await fetch(`http://localhost:${PORTA}/app/`)).text();
  assert.deepEqual(app.match(/__[A-Z][A-Z_]+__/g), null);
});
