#!/usr/bin/env node
'use strict';
// Restaura um backup do Inglou (.arcanebak) para uma pasta, verificando integridade (base: templates/backup/restaurar.js da Arcane).
// Uso:  node restaurar.js arquivo.arcanebak --chave <CHAVE> [--destino ./dados-restaurados]
//   ou: BACKUP_KEY=<CHAVE> node restaurar.js arquivo.arcanebak
// Nunca sobrescreve: o destino precisa estar vazio ou não existir. Depois de conferir, parar o app e copiar inglou.db para o DATA_DIR.
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib'), os = require('node:os');
const { decifrar, lerTar, sha256Arquivo } = require('../src/backup-lib');
(async () => {
  const a = process.argv.slice(2), arq = a.find(x => !x.startsWith('--'));
  const get = n => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : null; };
  const chaveTxt = get('--chave') || process.env.BACKUP_KEY, destino = path.resolve(get('--destino') || './dados-restaurados');
  if (!arq || !chaveTxt) { console.error('uso: node restaurar.js arquivo.arcanebak --chave <CHAVE> [--destino pasta]'); process.exit(2); }
  const chave = Buffer.from(chaveTxt.trim(), 'base64url'); if (chave.length !== 32) { console.error('chave inválida'); process.exit(2); }
  if (fs.existsSync(destino) && fs.readdirSync(destino).length) { console.error('o destino já existe e não está vazio: ' + destino); process.exit(2); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'arcbak-'));
  try {
    await decifrar(arq, path.join(tmp, 'p.tgz'), chave);
    fs.writeFileSync(path.join(tmp, 'p.tar'), zlib.gunzipSync(fs.readFileSync(path.join(tmp, 'p.tgz'))));
    const feitos = lerTar(path.join(tmp, 'p.tar'), destino);
    const man = JSON.parse(fs.readFileSync(path.join(destino, 'manifesto.json'), 'utf8'));
    const { DatabaseSync } = require('node:sqlite'); let ruim = 0;
    for (const b of man.bancos) {
      const f = path.join(destino, b.nome), hash = await sha256Arquivo(f);
      const c = new DatabaseSync(f, { readOnly: true }); const integ = Object.values(c.prepare('PRAGMA integrity_check').get())[0]; c.close();
      const ok = hash === b.sha256 && integ === 'ok'; if (!ok) ruim++;
      console.log(`${ok ? 'OK  ' : 'FALHA'} ${b.nome} (${b.bytes} bytes)`);
    }
    fs.rmSync(path.join(destino, 'manifesto.json'));
    if (fs.existsSync(path.join(destino, 'contas.db'))) fs.renameSync(path.join(destino, 'contas.db'), path.join(destino, 'inglou.db'));   // nome do banco no Inglou
    console.log(`\nBackup de ${man.criado_em}: ${man.bancos.length} banco(s) restaurado(s) em ${destino}${ruim ? ` — ${ruim} COM PROBLEMA` : ' — tudo conferido'}.`);
    process.exit(ruim ? 1 : 0);
  } catch (e) { console.error('Não foi possível restaurar:', /auth|Unsupported state/i.test(e.message) ? 'chave errada ou arquivo corrompido/adulterado' : e.message); process.exit(1); }
  finally { fs.rmSync(tmp, { recursive: true, force: true }); }
})();
