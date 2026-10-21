'use strict';
// Turmas: qualquer conta pode criar turmas (vira "professor" dessas turmas) e qualquer conta pode entrar em turmas pelo código.
// O professor monta atividades (perguntas do banco do app e perguntas dele) e acompanha acertos e dificuldades da turma.
// Privacidade: o professor só vê nome, acertos, tempo e conclusão NAS ATIVIDADES DA TURMA. Nunca vê conversas, textos, cartões
// nem o resto do estudo do aluno, e nunca vê o que o aluno digitou (só se acertou). O aluno pode sair a qualquer momento
// e, ao sair, as respostas dele nas atividades da turma são apagadas.
const auth = require('./auth');
const { ErroHttp } = require('./http');
const T = require('./motor/turmas');
const { MISSOES, TODOS_EXERCICIOS } = require('./conteudo/missoes');
const { POR_TAG } = require('./conteudo/dificuldades');
const { corrigirExercicio, respostaCerta } = require('./motor/correcao');
const { paraCliente } = require('./motor/licao');
const { UNIDADES, BANCO_BIBLIOTECA } = require('./conteudo/biblioteca');
const { FAIXAS } = require('./motor/publico');
const BANCO = { ...TODOS_EXERCICIOS, ...BANCO_BIBLIOTECA };

const MAX_TURMAS = 20, MAX_ALUNOS = 200, MAX_ATIVIDADES = 100;
const HABILIDADE = { gramatica: 'Gramática', vocabulario: 'Vocabulário', leitura: 'Leitura', escuta: 'Escuta', escrita: 'Escrita', fala: 'Fala', geral: 'Geral' };

function registrar({ db, rota, q, V, lerJson, transacao, agoraISO, hojeDe, registrarTentativa, somarMinutos }) {
  const limEntrar = auth.limitadorBanco(db, 'turma-entrar', { janelaMs: 15 * 60e3, max: 15 });
  const emItens = (itens, semente) => paraCliente({ blocos: [{ exercicios: itens }] }, semente).blocos[0].exercicios;
  const itensDe = a => lerJson(a.itens, []);

  function turmaDoProfessor(id, uid) {
    const t = q('SELECT * FROM turmas WHERE id = ? AND professor_id = ? AND ativa = 1').get(id, uid);
    if (!t) throw new ErroHttp(404, 'Turma não encontrada.');
    return t;
  }
  function turmaDoAluno(id, uid) {
    const t = q('SELECT t.*, u.nome AS professor_nome FROM turmas t JOIN turma_alunos ta ON ta.turma_id = t.id JOIN usuarios u ON u.id = t.professor_id WHERE t.id = ? AND ta.user_id = ? AND t.ativa = 1').get(id, uid);
    if (!t) throw new ErroHttp(404, 'Turma não encontrada.');
    return t;
  }
  const alunosDa = tid => q('SELECT u.id, u.nome, ta.entrou_em FROM turma_alunos ta JOIN usuarios u ON u.id = ta.user_id WHERE ta.turma_id = ? ORDER BY u.nome').all(tid);
  const atividadesDa = tid => q('SELECT * FROM atividades WHERE turma_id = ? AND ativa = 1 ORDER BY criado_em DESC, id DESC').all(tid);
  const linkDe = codigo => `/app/#/turmas?codigo=${codigo}`;
  const turmaParaProfessor = t => ({ id: t.id, nome: t.nome, codigo: t.codigo, faixa: t.faixa, nivel: t.nivel, link: linkDe(t.codigo), criada_em: t.criado_em });
  const atividadeNova = (a, extra = {}) => ({ id: a.id, titulo: a.titulo, descricao: a.descricao, prazo: a.prazo, tema: a.tema, faixa: a.faixa, nivel: a.nivel, material: lerJson(a.material, {}), total: itensDe(a).length, ...extra });
  const exigirProfessor = uid => {
    if (q('SELECT papel FROM perfis WHERE user_id = ?').get(uid)?.papel !== 'professor' && !q('SELECT 1 FROM turmas WHERE professor_id = ?').get(uid)) throw new ErroHttp(403, 'Abra a área do professor no seu perfil para montar aulas.');
  };

  // ---------- professor ----------
  // banco de perguntas do app, para o professor escolher (ele vê o gabarito: é a turma dele)
  rota('GET', '/professor/banco', ctx => {
    exigirProfessor(ctx.u.id);
    return { missoes: [...MISSOES.filter(m => !m.faixa), ...UNIDADES].map(m => ({
      id: m.id, titulo: m.titulo, nivel: m.nivel, faixa: m.faixa || (m.id.startsWith('zero-') ? 'todas' : 'adulto'), tema: m.tema || m.titulo,
      material: { explicacao: m.explicacao?.texto || m.explicacao || '', texto: m.texto || '', traducao: m.traducao || '', vocab: m.vocab },
      exercicios: m.exercicios.filter(e => e.tipo !== 'pares').map(e => ({ id: e.id, tipo: e.tipo, habilidade: e.habilidade, resumo: resumoDe(e), tag: e.tag || null })),
    })).filter(m => m.exercicios.length) };
  });
  rota('POST', '/professor/previa', ctx => {
    exigirProfessor(ctx.u.id);
    try {
      const itens = T.montarItens(ctx.corpo, BANCO), material = T.validarMaterial(ctx.corpo.material);
      return { itens: emItens(itens, 'previa'), material, correcoes: Object.fromEntries(itens.map(e => [e.id, corrigirExercicio(e, V.str(ctx.corpo.respostas?.[e.id], 500, { campo: 'Resposta de prévia' }))])) };
    } catch (e) { if (e instanceof T.ErroItem) throw new ErroHttp(422, e.message); throw e; }
  });
  const resumoDe = e => String(e.enunciado || e.pergunta || e.frase || e.pt || e.errado || e.audio || '').slice(0, 110);

  rota('GET', '/turmas', (ctx) => {
    const uid = ctx.u.id;
    const professor = q('SELECT * FROM turmas WHERE professor_id = ? AND ativa = 1 ORDER BY id DESC').all(uid).map(t => ({
      ...turmaParaProfessor(t),
      alunos: q('SELECT COUNT(*) n FROM turma_alunos WHERE turma_id = ?').get(t.id).n,
      atividades: q('SELECT COUNT(*) n FROM atividades WHERE turma_id = ? AND ativa = 1').get(t.id).n,
    }));
    const aluno = q('SELECT t.id, t.nome, u.nome AS professor_nome FROM turma_alunos ta JOIN turmas t ON t.id = ta.turma_id JOIN usuarios u ON u.id = t.professor_id WHERE ta.user_id = ? AND t.ativa = 1 ORDER BY ta.entrou_em DESC').all(uid)
      .map(t => ({ id: t.id, nome: t.nome, professor: t.professor_nome, ...pendenciasDe(t.id, uid) }));
    return { professor, aluno };
  });

  rota('POST', '/turmas', (ctx) => {
    const uid = ctx.u.id;
    const nome = V.str(ctx.corpo.nome, 80, { min: 2, campo: 'Nome da turma' });
    const faixa = V.um(ctx.corpo.faixa || 'todas', ['todas', ...Object.keys(FAIXAS)], 'Público da turma');
    const nivel = V.um(ctx.corpo.nivel || 'A1', ['A1', 'A2', 'B1', 'B2', 'C1'], 'Nível da turma');
    if (q('SELECT COUNT(*) n FROM turmas WHERE professor_id = ? AND ativa = 1').get(uid).n >= MAX_TURMAS) throw new ErroHttp(409, `Você já tem ${MAX_TURMAS} turmas.`);
    const id = transacao(db, () => {
      const codigo = T.novoCodigo(c => !!q('SELECT 1 FROM turmas WHERE codigo = ?').get(c));
      q("UPDATE perfis SET papel = 'professor' WHERE user_id = ?").run(uid);
      return Number(q('INSERT INTO turmas (professor_id, nome, codigo, faixa, nivel, criado_em) VALUES (?, ?, ?, ?, ?, ?)').run(uid, nome, codigo, faixa, nivel, agoraISO()).lastInsertRowid);
    });
    return { ok: true, turma: turmaParaProfessor(q('SELECT * FROM turmas WHERE id = ?').get(id)) };
  });

  rota('GET', '/turmas/:id', (ctx) => {
    const t = turmaDoProfessor(V.id(ctx.params.id), ctx.u.id);
    const alunos = alunosDa(t.id);
    const ativs = atividadesDa(t.id);
    const todas = ativs.length ? q(`SELECT * FROM atividade_respostas WHERE atividade_id IN (${ativs.map(() => '?').join(',')})`).all(...ativs.map(a => a.id)) : [];
    const itensPorId = new Map();
    const atividades = ativs.map(a => {
      const itens = itensDe(a);
      for (const it of itens) itensPorId.set(a.id + ':' + it.id, it);
      const m = T.metricasDaAtividade({ itens, alunos, respostas: todas.filter(r => r.atividade_id === a.id) });
      return atividadeNova(a, { concluiram: m.resumo.concluiram, pctMedio: m.resumo.pctMedio, naoComecaram: m.resumo.naoComecaram });
    });
    // desempenho por aluno em todas as atividades juntas
    const porAluno = alunos.map(al => {
      const r = todas.filter(x => x.user_id === al.id);
      return { id: al.id, nome: al.nome, entrou_em: al.entrou_em, feitas: r.length, certas: r.filter(x => x.correto).length, pct: r.length ? Math.round(100 * r.filter(x => x.correto).length / r.length) : null,
        ultima: r.reduce((m, x) => (!m || x.em > m ? x.em : m), null), atividadesFeitas: ativs.filter(a => itensDe(a).length && r.filter(x => x.atividade_id === a.id).length === itensDe(a).length).length };
    });
    return {
      turma: turmaParaProfessor(t), alunos: porAluno, atividades,
      dificuldades: T.dificuldadesDaTurma(todas, itensPorId, tag => POR_TAG[tag]?.nome, h => HABILIDADE[h] || h),
      resumo: { alunos: alunos.length, atividades: ativs.length, respostas: todas.length, pct: todas.length ? Math.round(100 * todas.filter(x => x.correto).length / todas.length) : null },
    };
  });

  rota('POST', '/turmas/:id/codigo', (ctx) => {
    const t = turmaDoProfessor(V.id(ctx.params.id), ctx.u.id);
    const codigo = T.novoCodigo(c => !!q('SELECT 1 FROM turmas WHERE codigo = ?').get(c));
    q('UPDATE turmas SET codigo = ? WHERE id = ?').run(codigo, t.id);
    return { ok: true, codigo, link: linkDe(codigo) };
  });

  rota('DELETE', '/turmas/:id', (ctx) => {
    const t = turmaDoProfessor(V.id(ctx.params.id), ctx.u.id);
    q('DELETE FROM turmas WHERE id = ?').run(t.id);    // ON DELETE CASCADE apaga alunos, atividades e respostas
    return { ok: true };
  });

  rota('DELETE', '/turmas/:id/alunos/:uid', (ctx) => {
    const t = turmaDoProfessor(V.id(ctx.params.id), ctx.u.id);
    removerAluno(t.id, V.id(ctx.params.uid));
    return { ok: true };
  });

  rota('POST', '/turmas/:id/atividades', (ctx) => {
    const t = turmaDoProfessor(V.id(ctx.params.id), ctx.u.id);
    const b = ctx.corpo;
    const titulo = V.str(b.titulo, 100, { min: 2, campo: 'Título' });
    const descricao = V.str(b.descricao, 600, { campo: 'Descrição' }) || null;
    const prazo = V.data(b.prazo, 'Prazo');
    const tema = V.str(b.tema, 100, { campo: 'Conteúdo da aula' });
    const faixa = V.um(b.faixa || t.faixa, ['todas', ...Object.keys(FAIXAS)], 'Público da aula');
    const nivel = V.um(b.nivel || t.nivel, ['A1', 'A2', 'B1', 'B2', 'C1'], 'Nível da aula');
    if (q('SELECT COUNT(*) n FROM atividades WHERE turma_id = ? AND ativa = 1').get(t.id).n >= MAX_ATIVIDADES) throw new ErroHttp(409, 'Esta turma já tem atividades demais. Apague as antigas.');
    let itens, material;
    try { itens = T.montarItens({ banco: Array.isArray(b.banco) ? b.banco.slice(0, 60) : [], proprias: Array.isArray(b.proprias) ? b.proprias.slice(0, 30) : [] }, BANCO); material = T.validarMaterial(b.material); }
    catch (e) { if (e instanceof T.ErroItem) throw new ErroHttp(422, e.message); throw e; }
    const r = q('INSERT INTO atividades (turma_id, titulo, descricao, prazo, tema, nivel, faixa, material, criado_em, itens) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(t.id, titulo, descricao, prazo, tema, nivel, faixa, JSON.stringify(material), agoraISO(), JSON.stringify(itens));
    return { ok: true, id: Number(r.lastInsertRowid) };
  });

  rota('GET', '/turmas/:id/atividades/:aid', (ctx) => {
    const t = turmaDoProfessor(V.id(ctx.params.id), ctx.u.id);
    const a = q('SELECT * FROM atividades WHERE id = ? AND turma_id = ? AND ativa = 1').get(V.id(ctx.params.aid), t.id);
    if (!a) throw new ErroHttp(404, 'Atividade não encontrada.');
    const itens = itensDe(a);
    const m = T.metricasDaAtividade({ itens, alunos: alunosDa(t.id), respostas: q('SELECT * FROM atividade_respostas WHERE atividade_id = ?').all(a.id) });
    const porItem = new Map(m.itens.map(i => [i.id, i]));
    return {
      turma: { id: t.id, nome: t.nome }, atividade: atividadeNova(a, { criada_em: a.criado_em }),
      itens: itens.map(it => ({ id: it.id, tipo: it.tipo, resumo: resumoDe(it), esperado: respostaCerta(it), explica: corrigirExercicio(it, '').explica, tag: it.tag || null, origem: it.origem, ...porItem.get(it.id) })),
      alunos: m.alunos, resumo: m.resumo,
    };
  });

  rota('DELETE', '/turmas/:id/atividades/:aid', (ctx) => {
    const t = turmaDoProfessor(V.id(ctx.params.id), ctx.u.id);
    const r = q('DELETE FROM atividades WHERE id = ? AND turma_id = ?').run(V.id(ctx.params.aid), t.id);
    if (!r.changes) throw new ErroHttp(404, 'Atividade não encontrada.');
    return { ok: true };
  });
  rota('POST', '/turmas/:id/atividades/:aid/duplicar', ctx => {
    const origem = turmaDoProfessor(V.id(ctx.params.id), ctx.u.id), destino = turmaDoProfessor(V.id(ctx.corpo.turmaId), ctx.u.id);
    const a = q('SELECT * FROM atividades WHERE id = ? AND turma_id = ? AND ativa = 1').get(V.id(ctx.params.aid), origem.id);
    if (!a) throw new ErroHttp(404, 'Aula não encontrada.');
    if (q('SELECT COUNT(*) n FROM atividades WHERE turma_id = ?').get(destino.id).n >= MAX_ATIVIDADES) throw new ErroHttp(409, 'A turma de destino já tem atividades demais.');
    const r = q('INSERT INTO atividades (turma_id, titulo, descricao, prazo, tema, nivel, faixa, material, criado_em, itens) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)').run(destino.id, a.titulo + ' (cópia)', a.descricao, a.tema, a.nivel, a.faixa, a.material, agoraISO(), a.itens);
    return { ok: true, id: Number(r.lastInsertRowid), turmaId: destino.id };
  });

  // ---------- aluno ----------
  function pendenciasDe(tid, uid) {
    let pendentes = 0, proxima = null;
    for (const a of atividadesDa(tid)) {
      const total = itensDe(a).length;
      const feitas = q('SELECT COUNT(*) n FROM atividade_respostas WHERE atividade_id = ? AND user_id = ?').get(a.id, uid).n;
      if (feitas < total) { pendentes++; if (!proxima || (a.prazo && (!proxima.prazo || a.prazo < proxima.prazo))) proxima = { id: a.id, titulo: a.titulo, prazo: a.prazo }; }
    }
    return { pendentes, proxima };
  }
  function removerAluno(tid, uid) {
    transacao(db, () => {
      q('DELETE FROM atividade_respostas WHERE user_id = ? AND atividade_id IN (SELECT id FROM atividades WHERE turma_id = ?)').run(uid, tid);
      q('DELETE FROM turma_alunos WHERE turma_id = ? AND user_id = ?').run(tid, uid);
    });
  }

  rota('POST', '/turmas/entrar', (ctx) => {
    const uid = ctx.u.id;
    if (!limEntrar.tentar('u' + uid) || !limEntrar.tentar('ip' + ctx.ip)) throw new ErroHttp(429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.');
    if (ctx.corpo.ciente !== true) throw new ErroHttp(422, 'Para entrar na turma, é preciso estar ciente do que o professor vê.');
    const codigo = T.normalizarCodigo(ctx.corpo.codigo);
    const t = T.codigoValido(codigo) ? q('SELECT t.*, u.nome AS professor_nome FROM turmas t JOIN usuarios u ON u.id = t.professor_id WHERE t.codigo = ? AND t.ativa = 1').get(codigo) : null;
    if (!t) throw new ErroHttp(404, 'Não achei uma turma com esse código. Confira com o seu professor.');
    if (t.professor_id === uid) throw new ErroHttp(409, 'Esta turma é sua: você é o professor.');
    if (q('SELECT COUNT(*) n FROM turma_alunos WHERE turma_id = ?').get(t.id).n >= MAX_ALUNOS) throw new ErroHttp(409, 'Esta turma está cheia.');
    q('INSERT OR IGNORE INTO turma_alunos (turma_id, user_id, entrou_em) VALUES (?, ?, ?)').run(t.id, uid, agoraISO());
    return { ok: true, turma: { id: t.id, nome: t.nome, professor: t.professor_nome } };
  });

  rota('GET', '/turmas/:id/aluno', (ctx) => {
    const t = turmaDoAluno(V.id(ctx.params.id), ctx.u.id);
    const atividades = atividadesDa(t.id).map(a => {
      const total = itensDe(a).length;
      const r = q('SELECT correto FROM atividade_respostas WHERE atividade_id = ? AND user_id = ?').all(a.id, ctx.u.id);
      return atividadeNova(a, { feitas: r.length, certas: r.filter(x => x.correto).length, concluida: total > 0 && r.length === total });
    });
    return { turma: { id: t.id, nome: t.nome, professor: t.professor_nome }, atividades };
  });

  rota('POST', '/turmas/:id/sair', (ctx) => {
    const t = turmaDoAluno(V.id(ctx.params.id), ctx.u.id);
    removerAluno(t.id, ctx.u.id);
    return { ok: true };
  });

  function atividadeDoAluno(aid, uid) {
    const a = q('SELECT a.*, t.nome AS turma_nome FROM atividades a JOIN turmas t ON t.id = a.turma_id JOIN turma_alunos ta ON ta.turma_id = t.id WHERE a.id = ? AND ta.user_id = ? AND a.ativa = 1 AND t.ativa = 1').get(aid, uid);
    if (!a) throw new ErroHttp(404, 'Atividade não encontrada.');
    return a;
  }
  const respondidoDe = (it, r) => {
    const c = corrigirExercicio(it, r.resposta || '');
    return { ...c, correto: !!r.correto, quase: !!r.quase, ajuda: r.resposta === '' && !!r.dica, resposta: r.resposta, textoAudio: ['escuta', 'ditado'].includes(it.tipo) ? it.audio : null };
  };

  rota('GET', '/atividades/:aid', (ctx) => {
    const uid = ctx.u.id;
    const a = atividadeDoAluno(V.id(ctx.params.aid), uid);
    const itens = itensDe(a);
    const rows = q('SELECT * FROM atividade_respostas WHERE atividade_id = ? AND user_id = ?').all(a.id, uid);
    const respondidos = Object.fromEntries(rows.map(r => [r.item_id, respondidoDe(itens.find(i => i.id === r.item_id) || {}, r)]));
    return { atividade: { ...atividadeNova(a), turma: a.turma_nome, turmaId: a.turma_id }, itens: emItens(itens, `ativ:${uid}:${a.id}`), respondidos };
  });

  rota('POST', '/atividades/:aid/responder', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), b = ctx.corpo;
    const a = atividadeDoAluno(V.id(ctx.params.aid), uid);
    const itemId = V.str(b.itemId, 20, { min: 1, campo: 'Item' });
    const resposta = b.revelar === true ? '' : V.str(b.resposta, 500, { campo: 'Resposta' });
    const it = itensDe(a).find(i => i.id === itemId);
    if (!it) throw new ErroHttp(404, 'Pergunta não encontrada.');
    const ja = q('SELECT * FROM atividade_respostas WHERE atividade_id = ? AND user_id = ? AND item_id = ?').get(a.id, uid, itemId);
    if (ja) { if (b.treinar === true) return { ...corrigirExercicio(it, resposta), pratica: true }; return { ...respondidoDe(it, ja), repetida: true }; }
    const r = corrigirExercicio(it, resposta);
    if (b.revelar === true) r.ajuda = true;
    transacao(db, () => {
      const ins = q('INSERT OR IGNORE INTO atividade_respostas (atividade_id, user_id, item_id, correto, quase, tag, tempo_ms, dica, em, resposta) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(a.id, uid, itemId, r.correto ? 1 : 0, r.quase ? 1 : 0, it.tag || null, Math.max(0, Math.min(600000, Number(b.tempoMs) | 0)), b.dica === true || b.revelar === true ? 1 : 0, agoraISO(), resposta);
      if (!ins.changes) return;   // clique duplo
      // também alimenta o plano pessoal do aluno (o professor não vê essas tentativas)
      registrarTentativa(uid, { item_id: `turma:${a.id}:${itemId}`, missao: it.missao || null, habilidade: it.habilidade, tag: it.tag, formato: ['escolha', 'escuta', 'leitura'].includes(it.tipo) ? 'reconhecimento' : 'producao',
        modalidade: ['escuta', 'ditado', 'fala'].includes(it.tipo) ? 'audio' : 'texto', correto: r.correto, tempo_ms: b.tempoMs, dica: b.dica === true, origem: 'turma', contexto: 'turma', resposta });
      if (q('SELECT COUNT(*) n FROM atividade_respostas WHERE user_id = ? AND em >= ?').get(uid, h).n % 5 === 0) somarMinutos(uid, h, 1);
    });
    return { ...r, textoAudio: ['escuta', 'ditado'].includes(it.tipo) ? it.audio : null };
  });

  // cartão da tela Hoje: atividades pendentes nas turmas do aluno
  return {
    resumoParaHoje(uid) {
      const turmas = q('SELECT t.id, t.nome FROM turma_alunos ta JOIN turmas t ON t.id = ta.turma_id WHERE ta.user_id = ? AND t.ativa = 1').all(uid);
      let pendentes = 0, proxima = null;
      for (const t of turmas) { const p = pendenciasDe(t.id, uid); pendentes += p.pendentes; if (p.proxima && (!proxima || (p.proxima.prazo && (!proxima.prazo || p.proxima.prazo < proxima.prazo)))) proxima = { ...p.proxima, turma: t.nome }; }
      return turmas.length ? { turmas: turmas.length, pendentes, proxima } : null;
    },
  };
}

module.exports = { registrar };
