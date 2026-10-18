#!/usr/bin/env node
'use strict';
// Backup manual (antes de todo deploy). Uso: DATA_DIR=/dados node scripts/backup.js [--mostrar-chave]
// Gera DATA_DIR/backup/arquivos/arcane-backup-AAAAMMDD-HHMMSS.arcanebak (cifrado) e envia para fora do servidor
// se BACKUP_S3_* estiver configurado. A chave fica em DATA_DIR/backup/backup.key: guarde uma cópia FORA do servidor.
const path = require('node:path');
const { abrir } = require('../src/db');
const { criarBackup } = require('../src/backup-lib');
(async () => {
  const dir = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'dados'));
  process.env.BACKUP_S3_PREFIXO ??= 'inglou/';
  const db = abrir(dir);
  const b = criarBackup({ dir, bancos: { contas: db } });
  try {
    const r = await b.executar({ motivo: 'manual' });
    console.log(JSON.stringify({ arquivo: r.arquivo, bytes: r.bytes, foraDoServidor: r.offsite ? r.offsite.ok : 'não configurado' }));
    if (process.argv.includes('--mostrar-chave')) console.log('CHAVE (guarde num gerenciador de senhas, fora do servidor):', b.chaveTexto());
  } catch (e) { console.error('backup falhou:', e.message); process.exitCode = 1; }
  finally { db.close(); }
})();
