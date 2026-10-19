'use strict';
// O app do aluno é um conjunto de módulos ES carregados pelo navegador: um erro de sintaxe em UM arquivo deixa a tela
// presa em "Abrindo seu álbum...". Este teste lê todos eles e confere a sintaxe (e se cada import aponta para um arquivo que existe).
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..', 'public', 'assets', 'js');
const arquivos = pasta => fs.readdirSync(pasta, { withFileTypes: true }).flatMap(d => d.isDirectory() ? arquivos(path.join(pasta, d.name)) : d.name.endsWith('.js') ? [path.join(pasta, d.name)] : []);

test('todos os módulos do app têm sintaxe válida', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-'));
  for (const f of arquivos(RAIZ)) {
    const copia = path.join(tmp, 'm.mjs');
    fs.copyFileSync(f, copia);
    const r = spawnSync(process.execPath, ['--check', copia], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${path.relative(RAIZ, f)}: ${r.stderr.split('\n').slice(0, 4).join(' ')}`);
  }
});

test('todo import relativo do app aponta para um arquivo que existe', () => {
  for (const f of arquivos(RAIZ)) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/from\s+'(\.[^']+)'|import\s+'(\.[^']+)'/g)) {
      const alvo = path.resolve(path.dirname(f), (m[1] || m[2]).split('?')[0]);
      assert.ok(fs.existsSync(alvo), `${path.relative(RAIZ, f)} importa ${m[1] || m[2]}, que não existe`);
    }
  }
});

test('Álbum Brasil: o app tem o componente da figurinha e nomeia qualquer conquista fig-*', () => {
  const lerJs = rel => fs.readFileSync(path.join(RAIZ, rel), 'utf8');
  assert.ok(fs.existsSync(path.join(RAIZ, 'figurinha.js')), 'falta public/assets/js/figurinha.js');
  assert.match(lerJs('telas/hoje.js'), /startsWith\('fig-'\)/, 'nomeConquista não trata o prefixo fig-');
  assert.match(lerJs('telas/progresso.js'), /figurinhaBrasil/, 'o Progresso não mostra as figurinhas do Brasil');
});

test('Palavras tocáveis: módulo existe, exercício o usa, peças e opções ficam de fora e as teclas ignoram o balão', () => {
  const lerJs = rel => fs.readFileSync(path.join(RAIZ, rel), 'utf8');
  assert.ok(fs.existsSync(path.join(RAIZ, 'palavras.js')), 'falta public/assets/js/palavras.js');
  const pal = lerJs('palavras.js');
  for (const alvo of ['.peca', '.par', '.opcao', '.balao-palavra']) assert.ok(pal.includes(alvo), `palavras.js deve ignorar ${alvo}`);
  assert.match(pal, /\/palavras\/traduzir/);
  assert.match(pal, /\/palavras\/duvida/);
  const ex = lerJs('telas/exercicio.js');
  assert.match(ex, /import \{[^}]*palavrasTocaveis[^}]*\} from '\.\.\/palavras\.js\?v=__V__'/);
  assert.match(ex, /e\.target\.closest\?\.\('\.palavra, \.balao-palavra'\)/, 'o atalho de teclado do exercício precisa ignorar palavra e balão');
  assert.match(lerJs('telas/revisar.js'), /duvida: 'Dúvida'/);
});

test('Palavras tocáveis (revisão): balão aberto bloqueia as teclas do exercício, foco entra no balão, uma parada de Tab por texto, sem exemplo errado', () => {
  const lerJs = rel => fs.readFileSync(path.join(RAIZ, rel), 'utf8');
  const pal = lerJs('palavras.js'), ex = lerJs('telas/exercicio.js');
  assert.match(pal, /export function balaoAberto/);
  assert.match(ex, /import \{[^}]*balaoAberto[^}]*\} from '\.\.\/palavras\.js\?v=__V__'/);
  assert.match(ex, /balaoAberto\(\)\) return/, 'teclas do exercício ignoradas com o balão aberto');
  assert.match(pal, /balao\.focus\(/, 'o foco vai para o balão ao abrir');
  assert.match(pal, /aria-disabled/, 'o botão marcado não pode usar disabled (o foco cairia no body)');
  assert.doesNotMatch(pal, /btnDuvida\.disabled = true/);
  assert.match(pal, /ArrowRight/, 'setas movem entre as palavras (uma parada de Tab por texto)');
  assert.match(pal, /isConnected/, 'balão órfão não engole o próximo Escape');
  assert.doesNotMatch(ex, /exemplo: ex\.errado/, 'a frase errada não pode virar exemplo do cartão');
});
