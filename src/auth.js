'use strict';
// Senhas (scrypt com sal), política de senha, sessões (token aleatório; só o hash no banco) e limitadores.
const crypto = require('node:crypto');

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SESSAO_DIAS = 30;

function hashSenha(senha) {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(senha.normalize('NFKC'), sal, 32, SCRYPT);
  return `scrypt$${SCRYPT.N}$${sal.toString('base64')}$${h.toString('base64')}`;
}
function conferirSenha(senha, guardado) {
  const [alg, n, sal, h] = String(guardado || '').split('$');
  if (alg !== 'scrypt' || !sal || !h) return false;
  const calc = crypto.scryptSync(String(senha).normalize('NFKC'), Buffer.from(sal, 'base64'), 32, { ...SCRYPT, N: Number(n) });
  const esp = Buffer.from(h, 'base64');
  return esp.length === calc.length && crypto.timingSafeEqual(calc, esp);
}
// hash falso para gastar o mesmo tempo quando o e-mail não existe (não revela quem tem conta)
const HASH_FALSO = hashSenha(crypto.randomBytes(12).toString('hex'));

const COMUNS = new Set(['1234567890', '12345678910', 'qwertyuiop', 'senha12345', 'password123', 'abc1234567', 'iloveyou12', 'brasil1234', '0987654321', 'mudar12345', 'admin12345', 'senhasenha']);
function senhaFraca(senha, { nome = '', email = '' } = {}) {
  const s = String(senha || '');
  if (s.length < 10) return 'Use pelo menos 10 caracteres.';
  if (s.length > 200) return 'Senha longa demais.';
  const b = s.toLowerCase();
  if (COMUNS.has(b)) return 'Essa senha é muito comum. Tente uma frase sua.';
  if (/^(.)\1+$/.test(b) || /^(..)\1+$/.test(b) || /^(...)\1+$/.test(b)) return 'Evite repetições.';
  const seq = '01234567890abcdefghijklmnopqrstuvwxyzqwertyuiopasdfghjklzxcvbnm';
  if (seq.includes(b) || seq.split('').reverse().join('').includes(b)) return 'Evite sequências.';
  if (new Set(b).size < 5) return 'Use caracteres mais variados.';
  const partes = [String(nome).toLowerCase().split(/\s+/)[0], String(email).toLowerCase().split('@')[0]].filter(p => p && p.length >= 3);
  if (partes.some(p => b.includes(p))) return 'A senha não pode conter seu nome ou e-mail.';
  return null;
}

const novoToken = () => crypto.randomBytes(32).toString('base64url');
const hashToken = t => crypto.createHash('sha256').update(String(t)).digest('hex');

// Limitador em memória por chave, com teto de chaves (não cresce sem limite).
function limitador({ janelaMs, max, teto = 20000 }) {
  const mapa = new Map();
  return {
    tentar(chave) {
      const agora = Date.now();
      let e = mapa.get(chave);
      if (!e || agora - e.inicio > janelaMs) { e = { inicio: agora, n: 0 }; mapa.delete(chave); mapa.set(chave, e); }
      e.n++;
      if (mapa.size > teto) mapa.delete(mapa.keys().next().value);
      return e.n <= max;
    },
    limpar(chave) { mapa.delete(chave); },
  };
}

// Limitador compartilhado entre cópias do app (tabela `limites` no mesmo SQLite): uma única instrução atômica conta a tentativa,
// então duas cópias rodando juntas não dobram o limite. A chave vai como hash (não grava e-mail nem IP em texto).
function limitadorBanco(db, nome, { janelaMs, max }) {
  const conta = db.prepare(`INSERT INTO limites (nome, chave, inicio, n) VALUES (?, ?, ?, 1)
    ON CONFLICT(nome, chave) DO UPDATE SET n = CASE WHEN inicio <= ?4 THEN 1 ELSE n + 1 END, inicio = CASE WHEN inicio <= ?4 THEN ?3 ELSE inicio END
    RETURNING n`);
  const apagar = db.prepare('DELETE FROM limites WHERE nome = ? AND chave = ?');
  const faxina = db.prepare('DELETE FROM limites WHERE inicio < ?');
  const h = chave => crypto.createHash('sha256').update(nome + '\u0000' + String(chave)).digest('hex').slice(0, 32);
  let chamadas = 0;
  return {
    tentar(chave) {
      const agora = Date.now();
      const n = conta.get(nome, h(chave), agora, agora - janelaMs).n;
      if (++chamadas % 200 === 0) faxina.run(agora - 24 * 3600e3);
      return n <= max;
    },
    limpar(chave) { apagar.run(nome, h(chave)); },
  };
}

module.exports = { limitadorBanco, hashSenha, conferirSenha, HASH_FALSO, senhaFraca, novoToken, hashToken, limitador, SESSAO_DIAS };
