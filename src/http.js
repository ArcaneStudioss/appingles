'use strict';
// Utilidades HTTP: cabeçalhos de segurança, leitura de corpo com limite, cookies, respostas e arquivos públicos.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PUBLICA = path.join(__dirname, '..', 'public');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };

// LISTA BRANCA de caminhos públicos. Nada fora disto é servido (nem server.js, nem banco, nem .git).
const PUBLICO = /^\/(?:index\.html|404\.html|favicon\.svg|og-image\.png|robots\.txt|sitemap\.xml|manifest\.webmanifest|app\/index\.html|obrigado\/index\.html|politica-de-privacidade\/index\.html|termos\/index\.html|assets\/(?:css|js|js\/telas|fontes|icones|img)\/[\w.-]+)$/;

// Versão dos arquivos estáticos (para ?v=): hash do conteúdo de assets/, calculado na subida.
function calcularVersao() {
  const h = crypto.createHash('sha256');
  const andar = d => { for (const f of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const p = path.join(d, f.name); if (f.isDirectory()) andar(p); else h.update(f.name).update(fs.readFileSync(p)); } };
  try { andar(path.join(PUBLICA, 'assets')); } catch {}
  return h.digest('hex').slice(0, 10);
}
const VERSAO = calcularVersao();
const cacheTexto = new Map();

function cabecalhos(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  // microfone liberado só para a própria origem (prática de fala opcional)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), payment=(), usb=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; font-src 'self'; media-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
}

function json(res, status, obj) {
  const corpo = JSON.stringify(obj);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(corpo);
}
function erro(res, status, mensagem) { json(res, status, { erro: mensagem }); }

class ErroHttp extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function lerCorpo(req, limite = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let tamanho = 0, partes = [], estourou = false;
    req.on('data', c => {
      if (estourou) return;
      tamanho += c.length;
      if (tamanho > limite) { estourou = true; partes = []; reject(new ErroHttp(413, 'Conteúdo grande demais.')); return; }
      partes.push(c);
    });
    req.on('end', () => {
      if (estourou) return;
      const txt = Buffer.concat(partes).toString('utf8');
      if (!txt) return resolve({});
      try {
        const v = JSON.parse(txt);
        if (!v || typeof v !== 'object' || Array.isArray(v)) return reject(new ErroHttp(400, 'Formato inválido.'));
        resolve(v);
      } catch { reject(new ErroHttp(400, 'Formato inválido.')); }
    });
    req.on('error', () => reject(new ErroHttp(400, 'Falha na leitura.')));
  });
}

function lerCookies(req) {
  const out = {};
  for (const p of String(req.headers.cookie || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  }
  return out;
}
const seguro = req => req.headers['x-forwarded-proto'] === 'https' || process.env.COOKIE_SEGURO === '1';
const nomeCookie = req => (seguro(req) ? '__Host-inglou' : 'inglou_sessao');
function definirSessao(req, res, token, dias) {
  const s = seguro(req);
  res.setHeader('Set-Cookie', `${nomeCookie(req)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${dias * 86400}${s ? '; Secure' : ''}`);
}
function limparSessao(req, res) {
  res.setHeader('Set-Cookie', `${nomeCookie(req)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${seguro(req) ? '; Secure' : ''}`);
}
const tokenDaSessao = req => { const c = lerCookies(req); return c['__Host-inglou'] || c.inglou_sessao || null; };

// IP real: o ÚLTIMO valor do X-Forwarded-For (o que o proxy acrescentou). O primeiro o cliente pode forjar.
function ip(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  return xff.length ? xff[xff.length - 1] : req.socket.remoteAddress || '?';
}

function naoAchou(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  enviarTexto(res, path.join(PUBLICA, '404.html'), true);
}

function enviarTexto(res, abs, jaComStatus) {
  try {
    let txt = cacheTexto.get(abs);
    if (txt === undefined) {
      txt = fs.readFileSync(abs, 'utf8').replaceAll('__V__', VERSAO);
      if (process.env.NODE_ENV === 'production') cacheTexto.set(abs, txt);
    }
    if (!jaComStatus) res.statusCode = 200;
    res.end(txt);
  } catch { if (!res.headersSent) res.statusCode = 404; res.end('404'); }
}

function servir(req, res, url) {
  let p;
  try { p = decodeURIComponent(url.pathname); } catch { res.statusCode = 400; return res.end(); }
  // byte nulo, controle, barra invertida e '..' nunca chegam ao disco (lição do CRM: um %00 derrubava o servidor)
  if (/[\u0000-\u001f\u007f\\]/.test(p) || p.split('/').includes('..') || p.includes('//')) return naoAchou(res);
  if (p === '/') p = '/index.html';
  else if (/^\/(app|obrigado|politica-de-privacidade|termos)\/?$/.test(p)) {
    if (!p.endsWith('/')) { res.statusCode = 301; res.setHeader('Location', p + '/'); return res.end(); }
    p += 'index.html';
  }
  const abs = path.normalize(path.join(PUBLICA, p));
  if (!abs.startsWith(PUBLICA + path.sep) || !PUBLICO.test(p) || p.includes('/.')) return naoAchou(res);
  fs.stat(abs, (err, st) => {
    try {
      if (err || !st.isFile()) return naoAchou(res);
      const ext = path.extname(abs).toLowerCase();
      res.setHeader('Content-Type', TIPOS[ext] || 'application/octet-stream');
      const versionado = url.searchParams.get('v') === VERSAO;
      res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : versionado ? 'public, max-age=31536000, immutable' : 'public, max-age=300');
      if (req.method === 'HEAD') return res.end();
      if (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.webmanifest') return enviarTexto(res, abs);
      // áudio: Safari do iPhone só toca mp3 se o servidor aceitar pedido por faixa de bytes (Range)
      const m = ext === '.mp3' && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (ext === '.mp3') res.setHeader('Accept-Ranges', 'bytes');
      if (m && (m[1] || m[2])) {
        let ini = m[1] === '' ? st.size - Number(m[2]) : Number(m[1]);
        let fim = m[1] === '' || m[2] === '' ? st.size - 1 : Math.min(Number(m[2]), st.size - 1);
        ini = Math.max(0, ini);
        if (ini > fim || ini >= st.size) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${st.size}`); return res.end(); }
        res.statusCode = 206; res.setHeader('Content-Range', `bytes ${ini}-${fim}/${st.size}`); res.setHeader('Content-Length', fim - ini + 1);
        return void fs.createReadStream(abs, { start: ini, end: fim }).on('error', () => res.destroy()).pipe(res);
      }
      if (ext === '.mp3') res.setHeader('Content-Length', st.size);
      fs.createReadStream(abs).on('error', () => res.destroy()).pipe(res);
    } catch { if (!res.headersSent) naoAchou(res); else res.destroy(); }
  });
}

module.exports = { cabecalhos, json, erro, ErroHttp, lerCorpo, definirSessao, limparSessao, tokenDaSessao, ip, servir, naoAchou, VERSAO, seguro };
