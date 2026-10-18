'use strict';
// Banco SQLite (módulo nativo node:sqlite, sem dependência). Um arquivo só: DATA_DIR/inglou.db.
// Toda consulta é parametrizada (?). Toda tabela de aluno tem user_id e toda leitura filtra por ele (sem IDOR).
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const MIGRACOES = [
  `CREATE TABLE usuarios (
     id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, nome TEXT NOT NULL,
     senha_hash TEXT NOT NULL, criado_em TEXT NOT NULL, consentiu_em TEXT NOT NULL
   );
   CREATE TABLE sessoes (
     id_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     criado_em INTEGER NOT NULL, expira_em INTEGER NOT NULL
   );
   CREATE INDEX sessoes_user ON sessoes(user_id);
   CREATE TABLE perfis (
     user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
     objetivo TEXT, objetivo_detalhe TEXT, prazo TEXT, minutos_dia INTEGER DEFAULT 15, dias_semana INTEGER DEFAULT 5,
     area TEXT, interesses TEXT DEFAULT '[]', meta_diaria INTEGER DEFAULT 15,
     lembrete TEXT DEFAULT '{}', fuso TEXT DEFAULT 'America/Sao_Paulo', atualizado_em TEXT
   );
   CREATE TABLE nivelamentos (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     feito_em TEXT NOT NULL, resultado TEXT NOT NULL
   );
   CREATE TABLE planos (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     criado_em TEXT NOT NULL, ativo INTEGER NOT NULL DEFAULT 1, dados TEXT NOT NULL
   );
   CREATE TABLE tentativas (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     em TEXT NOT NULL, item_id TEXT, missao TEXT, habilidade TEXT, tag TEXT, formato TEXT, modalidade TEXT,
     correto INTEGER NOT NULL, tempo_ms INTEGER DEFAULT 0, dica INTEGER DEFAULT 0, origem TEXT, contexto TEXT,
     resposta TEXT, contestada INTEGER DEFAULT 0
   );
   CREATE INDEX tentativas_user ON tentativas(user_id, em);
   CREATE TABLE licoes (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     data TEXT NOT NULL, dados TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'aberta', respondidos TEXT DEFAULT '{}',
     iniciada_em TEXT, concluida_em TEXT, UNIQUE(user_id, data)
   );
   CREATE TABLE cartoes (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     frente TEXT NOT NULL, verso TEXT NOT NULL, exemplo TEXT, tipo TEXT NOT NULL, origem TEXT, tag TEXT, nota_origem TEXT,
     facilidade REAL DEFAULT 2.5, intervalo INTEGER DEFAULT 0, repeticoes INTEGER DEFAULT 0, lapsos INTEGER DEFAULT 0,
     vence_em TEXT NOT NULL, criado_em TEXT NOT NULL, UNIQUE(user_id, frente)
   );
   CREATE TABLE revisoes (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     cartao_id INTEGER, em TEXT NOT NULL, nota INTEGER NOT NULL, intervalo_antes INTEGER, tempo_ms INTEGER
   );
   CREATE TABLE conversas (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     cenario TEXT NOT NULL, iniciada_em TEXT NOT NULL, terminada_em TEXT, mensagens TEXT NOT NULL DEFAULT '[]', modo TEXT
   );
   CREATE TABLE focos (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     tag TEXT NOT NULL, origem TEXT, cenario TEXT, trecho TEXT, correcao TEXT, criado_em TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'novo', abordagens TEXT DEFAULT '[]', retestar_em TEXT, resolvido_em TEXT
   );
   CREATE TABLE amostras (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     em TEXT NOT NULL, tipo TEXT NOT NULL, missao TEXT, tarefa TEXT, texto TEXT NOT NULL, avaliacao TEXT, demonstrado INTEGER DEFAULT 0, reteste INTEGER DEFAULT 0
   );
   CREATE TABLE competencias (
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, missao TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'nao_iniciada', partes INTEGER DEFAULT 0, retestes INTEGER DEFAULT 0,
     demonstrado_em TEXT, retido_em TEXT, evidencia TEXT, PRIMARY KEY(user_id, missao)
   );
   CREATE TABLE materiais (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     titulo TEXT NOT NULL, texto TEXT NOT NULL, gerado TEXT NOT NULL, criado_em TEXT NOT NULL
   );
   CREATE TABLE conquistas (
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, codigo TEXT NOT NULL, em TEXT NOT NULL,
     PRIMARY KEY(user_id, codigo)
   );
   CREATE TABLE assinaturas (
     user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE, dados TEXT NOT NULL
   );
   CREATE TABLE uso_ia (
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, mes TEXT NOT NULL, tipo TEXT NOT NULL,
     qtd INTEGER NOT NULL DEFAULT 0, tokens_entrada INTEGER DEFAULT 0, tokens_saida INTEGER DEFAULT 0,
     PRIMARY KEY(user_id, mes, tipo)
   );
   CREATE TABLE descartes (
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, hipotese TEXT NOT NULL, ate TEXT NOT NULL,
     PRIMARY KEY(user_id, hipotese)
   );
   CREATE TABLE dias_estudo (
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, data TEXT NOT NULL, minutos REAL DEFAULT 0,
     PRIMARY KEY(user_id, data)
   );`,
  // 2: Rádio Tuiuiú (um episódio por dia, com o treino e as respostas)
  `CREATE TABLE podcasts (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     data TEXT NOT NULL, criado_em TEXT NOT NULL, dados TEXT NOT NULL, respondidos TEXT NOT NULL DEFAULT '{}',
     ouvido_em TEXT, UNIQUE(user_id, data)
   );`,
];

function abrir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path.join(dir, 'inglou.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 4000; PRAGMA synchronous = NORMAL;');
  db.exec('CREATE TABLE IF NOT EXISTS _versao (v INTEGER NOT NULL)');
  const atual = db.prepare('SELECT v FROM _versao').get()?.v ?? 0;
  for (let i = atual; i < MIGRACOES.length; i++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRACOES[i]);
      if (i === 0 && atual === 0) db.prepare('INSERT INTO _versao (v) VALUES (?)').run(1);
      else db.prepare('UPDATE _versao SET v = ?').run(i + 1);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
  }
  return db;
}

// Ajudantes curtos
const json = (s, padrao) => { try { return s == null ? padrao : JSON.parse(s); } catch { return padrao; } };
function transacao(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; }
}

module.exports = { abrir, json, transacao };
