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
