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
  // 3: limites de tentativas (login e cadastro) compartilhados entre as cópias do app
  `CREATE TABLE limites (
     nome TEXT NOT NULL, chave TEXT NOT NULL, inicio INTEGER NOT NULL, n INTEGER NOT NULL, PRIMARY KEY(nome, chave)
   );`,
  // 4: estudo sob medida (prova, entrevista, viagem...): assuntos em JSON, simulado em JSON
  `CREATE TABLE estudos (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     titulo TEXT NOT NULL, tipo TEXT NOT NULL, data_alvo TEXT, criado_em TEXT NOT NULL, ativo INTEGER NOT NULL DEFAULT 1,
     descricao TEXT, material TEXT, assuntos TEXT NOT NULL DEFAULT '[]', simulado TEXT, modo TEXT
   );
   CREATE INDEX estudos_user ON estudos(user_id, ativo);`,
  // 5: preferência de modo (ler, escrever, ouvir) e treino diário focado nas dificuldades
  `ALTER TABLE perfis ADD COLUMN estilos TEXT NOT NULL DEFAULT '[]';
   CREATE TABLE treinos (
     id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     data TEXT NOT NULL, criado_em TEXT NOT NULL, dados TEXT NOT NULL, respondidos TEXT NOT NULL DEFAULT '{}',
     concluido_em TEXT, UNIQUE(user_id, data)
   );`,
  // 6: turmas do professor: código de convite, atividades (perguntas em JSON) e respostas dos alunos (só acerto, tempo e o que foi digitado)
  `CREATE TABLE turmas (
     id INTEGER PRIMARY KEY, professor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     nome TEXT NOT NULL, codigo TEXT NOT NULL UNIQUE, criado_em TEXT NOT NULL, ativa INTEGER NOT NULL DEFAULT 1
   );
   CREATE INDEX turmas_prof ON turmas(professor_id);
   CREATE TABLE turma_alunos (
     turma_id INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     entrou_em TEXT NOT NULL, PRIMARY KEY (turma_id, user_id)
   );
   CREATE INDEX turma_alunos_user ON turma_alunos(user_id);
   CREATE TABLE atividades (
     id INTEGER PRIMARY KEY, turma_id INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
     titulo TEXT NOT NULL, descricao TEXT, prazo TEXT, criado_em TEXT NOT NULL, itens TEXT NOT NULL DEFAULT '[]', ativa INTEGER NOT NULL DEFAULT 1
   );
   CREATE INDEX atividades_turma ON atividades(turma_id);
   CREATE TABLE atividade_respostas (
     atividade_id INTEGER NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     item_id TEXT NOT NULL, correto INTEGER NOT NULL, quase INTEGER NOT NULL DEFAULT 0, tag TEXT,
     tempo_ms INTEGER NOT NULL DEFAULT 0, dica INTEGER NOT NULL DEFAULT 0, em TEXT NOT NULL, resposta TEXT,
     PRIMARY KEY (atividade_id, user_id, item_id)
   );
   CREATE INDEX atividade_respostas_user ON atividade_respostas(user_id);`,
  // 7: contexto de idade, papel de entrada e aulas que funcionam como capítulos de um livro.
  `ALTER TABLE perfis ADD COLUMN idade INTEGER;
   ALTER TABLE perfis ADD COLUMN responsavel_em TEXT;
   ALTER TABLE perfis ADD COLUMN papel TEXT NOT NULL DEFAULT 'aluno';
   ALTER TABLE turmas ADD COLUMN faixa TEXT NOT NULL DEFAULT 'todas';
   ALTER TABLE turmas ADD COLUMN nivel TEXT NOT NULL DEFAULT 'A1';
   ALTER TABLE atividades ADD COLUMN material TEXT NOT NULL DEFAULT '{}';
   ALTER TABLE atividades ADD COLUMN tema TEXT;
   ALTER TABLE atividades ADD COLUMN nivel TEXT NOT NULL DEFAULT 'A1';
   ALTER TABLE atividades ADD COLUMN faixa TEXT NOT NULL DEFAULT 'todas';
   CREATE TABLE biblioteca_progressos (
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     unidade_id TEXT NOT NULL, respondidos TEXT NOT NULL DEFAULT '{}', concluido_em TEXT,
     PRIMARY KEY(user_id, unidade_id)
   );`,
  // 8: região declarada opcional; não usa geolocalização e preserva perfis existentes.
  `ALTER TABLE perfis ADD COLUMN regiao TEXT CHECK (regiao IS NULL OR regiao IN ('norte','nordeste','centro-oeste','sudeste','sul','fora'));`,
  // 9: consumo de síntese, sem armazenar texto.
  `CREATE TABLE uso_voz (
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     dia TEXT NOT NULL, caracteres INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY(user_id, dia)
   );
   CREATE INDEX uso_voz_dia ON uso_voz(dia);`,
  // 10: vínculo externo e tokens cifrados no servidor; IDs e progresso existentes não mudam.
  `ALTER TABLE usuarios ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'local';
   ALTER TABLE usuarios ADD COLUMN auth_subject TEXT;
   CREATE UNIQUE INDEX usuarios_auth_subject ON usuarios(auth_provider, auth_subject) WHERE auth_subject IS NOT NULL;
   CREATE TABLE auth_sessoes (
     id_hash TEXT PRIMARY KEY REFERENCES sessoes(id_hash) ON DELETE CASCADE,
     tokens TEXT NOT NULL
   );
   CREATE TABLE auth_fluxos (
     id_hash TEXT PRIMARY KEY, finalidade TEXT NOT NULL, email TEXT NOT NULL,
     dados TEXT NOT NULL, expira_em INTEGER NOT NULL,
     tentativas INTEGER NOT NULL DEFAULT 0, ocupado_ate INTEGER NOT NULL DEFAULT 0
   );
   CREATE INDEX auth_fluxos_expira ON auth_fluxos(expira_em);`,
  // 11: coleção transferível, carteira e desafios; conquistas pessoais são preservadas.
  `CREATE TABLE social_identidades (
 user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
 identidade TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16))))
);
INSERT INTO social_identidades(user_id) SELECT id FROM usuarios;
CREATE TRIGGER social_identidade_usuario AFTER INSERT ON usuarios BEGIN
 INSERT OR IGNORE INTO social_identidades(user_id) VALUES(NEW.id);
END;
CREATE TABLE social_perfis (
 user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
 codigo TEXT NOT NULL UNIQUE, apelido TEXT NOT NULL
);
CREATE TABLE amizades (
 de INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 para INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 estado TEXT NOT NULL CHECK(estado IN ('pendente','aceita')), em TEXT NOT NULL,
 PRIMARY KEY(de,para), CHECK(de <> para)
);
CREATE TABLE social_bloqueios (
 user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 bloqueado_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,bloqueado_id), CHECK(user_id <> bloqueado_id)
);
CREATE TABLE pontos_estudo (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 item TEXT NOT NULL, dia TEXT NOT NULL, em TEXT NOT NULL, origem TEXT NOT NULL,
 tentativa_id INTEGER UNIQUE REFERENCES tentativas(id) ON DELETE SET NULL,
 UNIQUE(user_id,item,dia)
);
CREATE INDEX pontos_periodo ON pontos_estudo(user_id,em);
CREATE TABLE moedas_extrato (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 quantidade INTEGER NOT NULL CHECK(quantidade <> 0), motivo TEXT NOT NULL,
 chave TEXT NOT NULL UNIQUE, em TEXT NOT NULL
);
CREATE INDEX moedas_user ON moedas_extrato(user_id,id);
CREATE TABLE colecao_figurinhas (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 modelo TEXT NOT NULL, raridade TEXT NOT NULL DEFAULT 'comum' CHECK(raridade IN ('comum','rara','epica','lendaria')), origem_chave TEXT NOT NULL UNIQUE, criada_em TEXT NOT NULL
);
CREATE INDEX colecao_user ON colecao_figurinhas(user_id);
CREATE TABLE duelos (
 id INTEGER PRIMARY KEY AUTOINCREMENT, criador INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 convidado INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, dias INTEGER NOT NULL CHECK(dias IN (2,7,30)),
 estado TEXT NOT NULL CHECK(estado IN ('escolha','confirmacao','ativo','concluido','cancelado','expirado')),
 figurinha_a INTEGER REFERENCES colecao_figurinhas(id) ON DELETE SET NULL,
 figurinha_b INTEGER REFERENCES colecao_figurinhas(id) ON DELETE SET NULL,
 criado_em TEXT NOT NULL, expira_em TEXT NOT NULL, inicio TEXT, fim TEXT, marco_ponto INTEGER NOT NULL DEFAULT 0,
 placar_a INTEGER NOT NULL DEFAULT 0, placar_b INTEGER NOT NULL DEFAULT 0,
 vencedor INTEGER REFERENCES usuarios(id) ON DELETE SET NULL, CHECK(criador <> convidado)
);
CREATE INDEX duelos_criador ON duelos(criador,estado);
CREATE INDEX duelos_convidado ON duelos(convidado,estado);
CREATE TABLE figurinhas_reservas (
 figurinha_id INTEGER PRIMARY KEY REFERENCES colecao_figurinhas(id) ON DELETE CASCADE,
 duelo_id INTEGER NOT NULL REFERENCES duelos(id) ON DELETE CASCADE
);
CREATE TABLE grupos_desafio (
 id INTEGER PRIMARY KEY AUTOINCREMENT, criador INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 nome TEXT NOT NULL, tipo TEXT NOT NULL CHECK(tipo IN ('exercicios','sequencia')),
 dias INTEGER NOT NULL CHECK(dias IN (2,7,30)), meta INTEGER NOT NULL, diaria INTEGER NOT NULL,
 estado TEXT NOT NULL CHECK(estado IN ('convite','ativo','concluido','encerrado','cancelado')),
 criado_em TEXT NOT NULL, expira_em TEXT NOT NULL, inicio TEXT, fim TEXT, marco_ponto INTEGER NOT NULL DEFAULT 0, resultado INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE grupos_membros (
 grupo_id INTEGER NOT NULL REFERENCES grupos_desafio(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 estado TEXT NOT NULL CHECK(estado IN ('pendente','aceito','recusado')),
 PRIMARY KEY(grupo_id,user_id)
);
CREATE INDEX grupos_user ON grupos_membros(user_id,grupo_id);
CREATE TABLE xp_extrato (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 quantidade INTEGER NOT NULL CHECK(quantidade>0), base INTEGER NOT NULL, multiplicador INTEGER NOT NULL,
 motivo TEXT NOT NULL, chave TEXT NOT NULL UNIQUE, em TEXT NOT NULL
);
CREATE INDEX xp_user ON xp_extrato(user_id,id);
CREATE TABLE xp_efeitos (user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE, ate TEXT NOT NULL);
CREATE TABLE loja_inventario (
 user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, produto TEXT NOT NULL,
 quantidade INTEGER NOT NULL DEFAULT 0 CHECK(quantidade>=0), PRIMARY KEY(user_id,produto)
);
CREATE TABLE loja_compras (
 user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, chave TEXT NOT NULL, produto TEXT NOT NULL,
 resultado TEXT NOT NULL, em TEXT NOT NULL, PRIMARY KEY(user_id,chave)
);
CREATE TRIGGER xp_exercicio AFTER INSERT ON pontos_estudo BEGIN
 INSERT OR IGNORE INTO xp_extrato(user_id,quantidade,base,multiplicador,motivo,chave,em)
 VALUES(NEW.user_id,10 * CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.em) THEN 2 ELSE 1 END,
 10,CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.em) THEN 2 ELSE 1 END,'Exercício correto','ponto:' || NEW.id,NEW.em);
END;
CREATE TRIGGER xp_licao AFTER UPDATE OF concluida_em ON licoes WHEN OLD.concluida_em IS NULL AND NEW.concluida_em IS NOT NULL AND NEW.respondidos<>'{}' BEGIN
 INSERT OR IGNORE INTO xp_extrato(user_id,quantidade,base,multiplicador,motivo,chave,em)
 VALUES(NEW.user_id,25 * CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.concluida_em) THEN 2 ELSE 1 END,
 25,CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.concluida_em) THEN 2 ELSE 1 END,'Lição concluída','licao:' || NEW.id,NEW.concluida_em);
END;
CREATE TRIGGER xp_biblioteca_insert AFTER INSERT ON biblioteca_progressos WHEN NEW.concluido_em IS NOT NULL BEGIN
 INSERT OR IGNORE INTO xp_extrato(user_id,quantidade,base,multiplicador,motivo,chave,em)
 VALUES(NEW.user_id,25 * CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.concluido_em) THEN 2 ELSE 1 END,
 25,CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.concluido_em) THEN 2 ELSE 1 END,'Capítulo concluído','biblioteca:' || NEW.user_id || ':' || NEW.unidade_id,NEW.concluido_em);
END;
CREATE TRIGGER xp_biblioteca_update AFTER UPDATE OF concluido_em ON biblioteca_progressos WHEN OLD.concluido_em IS NULL AND NEW.concluido_em IS NOT NULL BEGIN
 INSERT OR IGNORE INTO xp_extrato(user_id,quantidade,base,multiplicador,motivo,chave,em)
 VALUES(NEW.user_id,25 * CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.concluido_em) THEN 2 ELSE 1 END,
 25,CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.concluido_em) THEN 2 ELSE 1 END,'Capítulo concluído','biblioteca:' || NEW.user_id || ':' || NEW.unidade_id,NEW.concluido_em);
END;
CREATE TRIGGER xp_treino AFTER UPDATE OF concluido_em ON treinos WHEN OLD.concluido_em IS NULL AND NEW.concluido_em IS NOT NULL AND NEW.respondidos<>'{}' BEGIN
 INSERT OR IGNORE INTO xp_extrato(user_id,quantidade,base,multiplicador,motivo,chave,em)
 VALUES(NEW.user_id,25 * CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.concluido_em) THEN 2 ELSE 1 END,
 25,CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.concluido_em) THEN 2 ELSE 1 END,'Treino concluído','treino:' || NEW.id,NEW.concluido_em);
END;
CREATE TRIGGER xp_turma AFTER INSERT ON atividade_respostas WHEN
 (SELECT COUNT(*) FROM atividade_respostas WHERE atividade_id=NEW.atividade_id AND user_id=NEW.user_id) =
 (SELECT json_array_length(itens) FROM atividades WHERE id=NEW.atividade_id) BEGIN
 INSERT OR IGNORE INTO xp_extrato(user_id,quantidade,base,multiplicador,motivo,chave,em)
 VALUES(NEW.user_id,25 * CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.em) THEN 2 ELSE 1 END,
 25,CASE WHEN EXISTS(SELECT 1 FROM xp_efeitos WHERE user_id=NEW.user_id AND ate>NEW.em) THEN 2 ELSE 1 END,'Aula da turma concluída','turma:' || NEW.atividade_id || ':' || NEW.user_id,NEW.em);
END;
INSERT OR IGNORE INTO xp_extrato(user_id,quantidade,base,multiplicador,motivo,chave,em)
 SELECT user_id,25,25,1,'Lição concluída','licao:' || id,concluida_em FROM licoes WHERE concluida_em IS NOT NULL AND respondidos<>'{}';
INSERT OR IGNORE INTO xp_extrato(user_id,quantidade,base,multiplicador,motivo,chave,em)
 SELECT user_id,25,25,1,'Capítulo concluído','biblioteca:' || user_id || ':' || unidade_id,concluido_em FROM biblioteca_progressos WHERE concluido_em IS NOT NULL;
INSERT INTO colecao_figurinhas(user_id,modelo,raridade,origem_chave,criada_em)
 SELECT user_id,'conquista:' || codigo,CASE WHEN codigo IN ('seq-100','seq-200','seq-365') THEN 'lendaria' WHEN codigo IN ('seq-30','seq-60','retido') THEN 'epica' ELSE 'rara' END,'conquista:' || (SELECT identidade FROM social_identidades WHERE user_id=conquistas.user_id) || ':' || codigo,em FROM conquistas;
CREATE TRIGGER conquista_colecao AFTER INSERT ON conquistas BEGIN
 INSERT OR IGNORE INTO colecao_figurinhas(user_id,modelo,raridade,origem_chave,criada_em)
 VALUES(NEW.user_id,'conquista:' || NEW.codigo,CASE WHEN NEW.codigo IN ('seq-100','seq-200','seq-365') THEN 'lendaria' WHEN NEW.codigo IN ('seq-30','seq-60','retido') THEN 'epica' ELSE 'rara' END,'conquista:' || (SELECT identidade FROM social_identidades WHERE user_id=NEW.user_id) || ':' || NEW.codigo,NEW.em);
END;
CREATE TRIGGER exercicio_pontos AFTER INSERT ON tentativas
 WHEN NEW.correto = 1 AND NEW.dica = 0 AND NEW.item_id IS NOT NULL
 AND NEW.origem IN ('licao','biblioteca','treino','turma','estudo','simulado','material','podcast')
 BEGIN
 INSERT OR IGNORE INTO pontos_estudo(user_id,item,dia,em,origem,tentativa_id)
 VALUES(NEW.user_id,NEW.item_id,substr(NEW.em,1,10),NEW.em,NEW.origem,NEW.id);
END;
CREATE TRIGGER pontos_recompensa AFTER INSERT ON pontos_estudo BEGIN
 INSERT OR IGNORE INTO moedas_extrato(user_id,quantidade,motivo,chave,em)
 VALUES(NEW.user_id,1,'Exercício correto','exercicio:' || NEW.id,NEW.em);
 INSERT OR IGNORE INTO colecao_figurinhas(user_id,modelo,raridade,origem_chave,criada_em)
 SELECT NEW.user_id,'pratica-' || (((COUNT(*) / 5 - 1) % 6) + 1),CASE WHEN COUNT(*) % 100 = 0 THEN 'epica' WHEN COUNT(*) % 25 = 0 THEN 'rara' ELSE 'comum' END,'pratica:' || (SELECT identidade FROM social_identidades WHERE user_id=NEW.user_id) || ':' || COUNT(*),NEW.em
 FROM pontos_estudo WHERE user_id = NEW.user_id HAVING COUNT(*) % 5 = 0;
END;
`,
  // 12: evolução aditiva; os registros existentes continuam publicados e conservam seus IDs.
  `ALTER TABLE conversas ADD COLUMN material_id INTEGER REFERENCES materiais(id) ON DELETE SET NULL;
   ALTER TABLE atividades ADD COLUMN estado TEXT NOT NULL DEFAULT 'publicada';
   ALTER TABLE atividades ADD COLUMN versao INTEGER NOT NULL DEFAULT 1;
   ALTER TABLE atividades ADD COLUMN origem_id INTEGER REFERENCES atividades(id) ON DELETE SET NULL;
   ALTER TABLE duelos ADD COLUMN modalidade TEXT NOT NULL DEFAULT 'troca';
   ALTER TABLE duelos ADD COLUMN criterio TEXT NOT NULL DEFAULT 'exercicios';
   ALTER TABLE social_perfis ADD COLUMN cenario TEXT NOT NULL DEFAULT 'padrao';
   CREATE TABLE sessoes_guiadas (
     id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     data TEXT NOT NULL, minutos INTEGER NOT NULL, dados TEXT NOT NULL, respondidos TEXT NOT NULL DEFAULT '{}',
     apoios TEXT NOT NULL DEFAULT '{}', criada_em TEXT NOT NULL, concluida_em TEXT, UNIQUE(user_id,data)
   );
   CREATE TABLE relatos_conteudo (
     id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
     tipo TEXT NOT NULL, referencia TEXT NOT NULL, motivo TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'pendente',
     criado_em TEXT NOT NULL, revisado_em TEXT, parecer TEXT, revisor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
   );
   CREATE TABLE edicoes_cultura (
     id INTEGER PRIMARY KEY AUTOINCREMENT, referencia TEXT NOT NULL, dados TEXT NOT NULL,
     revisor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL, revisado_em TEXT NOT NULL
   );
   CREATE TABLE diagnosticos (
     id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, codigo TEXT NOT NULL,
     duracao_ms INTEGER NOT NULL DEFAULT 0, em TEXT NOT NULL
   );
   CREATE INDEX diagnosticos_em ON diagnosticos(em);
   CREATE TABLE exercicios_recebidos (
     user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     item TEXT NOT NULL, dia TEXT NOT NULL, PRIMARY KEY(user_id,item,dia)
   );
   INSERT OR IGNORE INTO exercicios_recebidos(user_id,item,dia)
     SELECT user_id,item_id,substr(em,1,10) FROM tentativas WHERE item_id IS NOT NULL
     AND origem IN ('licao','biblioteca','treino','turma','estudo','simulado','material','podcast');
   DROP TRIGGER exercicio_pontos;
   CREATE TRIGGER exercicio_pontos AFTER INSERT ON tentativas
   WHEN NEW.item_id IS NOT NULL AND NEW.origem IN ('licao','biblioteca','treino','turma','estudo','simulado','material','podcast','sessao') BEGIN
     INSERT OR IGNORE INTO exercicios_recebidos(user_id,item,dia) VALUES(NEW.user_id,NEW.item_id,substr(NEW.em,1,10));
     INSERT OR IGNORE INTO pontos_estudo(user_id,item,dia,em,origem,tentativa_id)
     SELECT NEW.user_id,NEW.item_id,substr(NEW.em,1,10),NEW.em,NEW.origem,NEW.id
     WHERE changes()=1 AND NEW.correto=1 AND NEW.dica=0;
   END;`,
  // 13: associação de assinaturas e cotas atômicas, sem textos pessoais.
  `CREATE TABLE assinatura_membros (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    entrou_em TEXT NOT NULL, CHECK(user_id<>owner_id)
  );
  CREATE INDEX assinatura_membros_owner ON assinatura_membros(owner_id);
  CREATE TABLE assinatura_convites (
    owner_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL UNIQUE, criado_em TEXT NOT NULL
  );
  CREATE TABLE consumo_planos (
    owner_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mes TEXT NOT NULL, tipo TEXT NOT NULL, qtd INTEGER NOT NULL DEFAULT 0 CHECK(qtd>=0),
    PRIMARY KEY(owner_id,mes,tipo)
  );
  CREATE TABLE consumo_global (mes TEXT NOT NULL,tipo TEXT NOT NULL,qtd INTEGER NOT NULL DEFAULT 0 CHECK(qtd>=0),PRIMARY KEY(mes,tipo));`,
];

function abrir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path.join(dir, 'inglou.db'));
  db.exec('PRAGMA busy_timeout = 4000;');
  // Na primeira subida, duas réplicas podem tentar ativar WAL ao mesmo tempo.
  for (let tentativa = 0; ; tentativa++) {
    try { db.exec('PRAGMA journal_mode = WAL;'); break; }
    catch (e) {
      if (e.errcode !== 5 || tentativa >= 9) { db.close(); throw e; }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  db.exec('PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;');
  db.exec('CREATE TABLE IF NOT EXISTS _versao (v INTEGER NOT NULL)');
  const atual = db.prepare('SELECT v FROM _versao').get()?.v ?? 0;
  for (let i = atual; i < MIGRACOES.length; i++) {
    db.exec('BEGIN IMMEDIATE');
    try {
      // Outra réplica pode ter aplicado esta migração enquanto aguardávamos o bloqueio.
      const aplicada = db.prepare('SELECT v FROM _versao').get()?.v ?? 0;
      if (aplicada >= i + 1) { db.exec('COMMIT'); continue; }
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
