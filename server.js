'use strict';
// Inglou · servidor (Node 22+, sem framework). Base: templates/seguranca/server-seguro.js da Arcane.
// Variáveis: PORT, DATA_DIR, ANTHROPIC_API_KEY (opcional), IA_MODELO*, PAGAMENTO_MODO, SITE_URL, COOKIE_SEGURO.
const http = require('node:http');
const path = require('node:path');
const { cabecalhos, erro, servir, ErroHttp, VERSAO } = require('./src/http');
const { abrir } = require('./src/db');
const { criar } = require('./src/api');
const { criarBackup } = require('./src/backup-lib');

// Arquivos públicos: lista branca PUBLICO e recusa de \u0000, controle e '..' ficam em src/http.js (função servir).
const PORTA = Number(process.env.PORT) || 8080;
const DADOS = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'dados'));
const db = abrir(DADOS);
const api = criar(db);
// backup diário automático (03h em diante), cifrado, com cópia fora do servidor se BACKUP_S3_* estiver definido
process.env.BACKUP_S3_PREFIXO ??= 'inglou/';
if (process.env.BACKUP_DESLIGADO !== '1') criarBackup({ dir: DADOS, bancos: { contas: db } }).agendar();

const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    cabecalhos(res);
    if (url.pathname.startsWith('/api/v1/') || url.pathname === '/api/v1') return await api.tratar(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; return res.end(); }
    if (url.pathname === '/saude') { res.setHeader('Content-Type', 'text/plain'); return res.end('ok'); }
    servir(req, res, url);
  } catch (e) {
    if (e instanceof ErroHttp) { if (!res.headersSent) erro(res, e.status, e.message); if (e.status === 413) req.destroy(); return; }
    console.error('[inglou] erro na requisição:', e && e.stack || e);
    try { if (!res.headersSent) erro(res, 500, 'Algo deu errado do nosso lado. Tente de novo.'); else res.destroy(); } catch {}
  }
});
// nenhuma requisição isolada pode derrubar o servidor
process.on('uncaughtException', e => console.error('[inglou] erro não capturado:', e && e.stack || e));
process.on('unhandledRejection', e => console.error('[inglou] promessa rejeitada:', e && e.stack || e));
servidor.headersTimeout = 20e3; servidor.requestTimeout = 90e3; servidor.maxHeadersCount = 60; servidor.keepAliveTimeout = 5e3;
servidor.on('error', e => { console.error('[inglou] não consegui abrir a porta:', e.message); process.exit(1); });
servidor.listen(PORTA, '0.0.0.0', () => console.log(`[inglou] no ar na porta ${PORTA} (versão dos arquivos ${VERSAO})`));

const fechar = () => { servidor.close(() => { try { db.close(); } catch {} process.exit(0); }); setTimeout(() => process.exit(0), 5000).unref(); };
process.on('SIGTERM', fechar); process.on('SIGINT', fechar);
