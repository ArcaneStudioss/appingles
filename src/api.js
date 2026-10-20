'use strict';
// API JSON em /api/v1. Toda rota de aluno filtra por user_id da sessão (nunca por id vindo do navegador).
const { json, erro, ErroHttp, lerCorpo, definirSessao, limparSessao, tokenDaSessao, ip } = require('./http');
const auth = require('./auth');
const { json: lerJson, transacao } = require('./db');
const ia = require('./ia');
const assin = require('./assinatura');
const { OBJETIVOS, INTERESSES } = require('./conteudo/objetivos');
const { POR_ID } = require('./conteudo/missoes');
const { CENARIOS } = require('./conteudo/cenarios');
const { DIFICULDADES, POR_TAG } = require('./conteudo/dificuldades');
const nivelamentoConteudo = require('./conteudo/nivelamento');
const { corrigir: corrigirNivelamento } = require('./motor/nivelamento');
const { montarPlano, licoesPorMissao } = require('./motor/plano');
const { montarLicao, paraCliente, acharExercicio, missaoAtual, validarExerciciosIa } = require('./motor/licao');
const { corrigirExercicio, avaliarProducao } = require('./motor/correcao');
const modelo = require('./motor/modelo');
const { agendar } = require('./motor/srs');
const { turnoOffline } = require('./motor/conversa');
const { processarOffline } = require('./motor/material');
const { hoje, somarDias, diasEntre, embaralhar, palavras, normalizar } = require('./motor/util');
const { calcularSequencia, premiosAlcancados } = require('./motor/sequencia');
const radio = require('./motor/podcast');
const estudoMotor = require('./motor/estudo');
const APR = require('./motor/aprendizagem');
const { respostaCerta: respostaDe } = require('./motor/correcao');

// ---------- validação ----------
const V = {
  str(v, max, { min = 0, campo = 'campo' } = {}) {
    if (v == null) v = '';
    if (typeof v !== 'string') throw new ErroHttp(422, `${campo}: formato inválido.`);
    v = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
    if (v.length < min) throw new ErroHttp(422, `${campo}: preencha este campo.`);
    if (v.length > max) throw new ErroHttp(422, `${campo}: texto longo demais (máx. ${max}).`);
    return v;
  },
  int(v, min, max, campo = 'número') {
    const n = typeof v === 'number' ? v : typeof v === 'string' && /^-?\d+$/.test(v) ? Number(v) : NaN;
    if (!Number.isInteger(n) || n < min || n > max) throw new ErroHttp(422, `${campo}: valor inválido.`);
    return n;
  },
  um(v, lista, campo = 'opção') { if (!lista.includes(v)) throw new ErroHttp(422, `${campo}: opção inválida.`); return v; },
  email(v) {
    const e = V.str(v, 160, { min: 3, campo: 'E-mail' }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw new ErroHttp(422, 'E-mail inválido.');
    return e;
  },
  data(v, campo = 'data') {
    if (v == null || v === '') return null;
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v + 'T12:00:00Z')) || new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) !== v) throw new ErroHttp(422, `${campo}: data inválida.`);
    return v;
  },
  id(v) { return V.int(v, 1, 2 ** 31, 'id'); },
};

// ---------- limitadores ----------
const limGeral = auth.limitador({ janelaMs: 60e3, max: 600 });
const limIa = auth.limitador({ janelaMs: 60e3, max: 20 });
const emAndamento = new Set();   // trava de clique duplo por usuário+ação

function criar(db) {
  const agoraISO = () => new Date().toISOString();
  const q = (sql) => db.prepare(sql);
  // limites de segurança (login e cadastro) valem para todas as cópias do app; o geral e o da IA são por cópia (só anti-sobrecarga)
  const limLoginIp = auth.limitadorBanco(db, 'login-ip', { janelaMs: 15 * 60e3, max: 20 });
  const limLoginConta = auth.limitadorBanco(db, 'login-conta', { janelaMs: 15 * 60e3, max: 8 });
  const limCadastro = auth.limitadorBanco(db, 'cadastro', { janelaMs: 60 * 60e3, max: 8 });

  // ---------- sessão ----------
  function usuarioDaSessao(req) {
    const t = tokenDaSessao(req);
    if (!t || t.length > 100) return null;
    const s = q('SELECT s.user_id, s.expira_em, u.nome, u.email FROM sessoes s JOIN usuarios u ON u.id = s.user_id WHERE s.id_hash = ?').get(auth.hashToken(t));
    if (!s || s.expira_em < Date.now()) return null;
    return { id: s.user_id, nome: s.nome, email: s.email, tokenHash: auth.hashToken(t) };
  }
  function abrirSessao(req, res, uid) {
    const t = auth.novoToken();
    const agora = Date.now();
    q('DELETE FROM sessoes WHERE user_id = ? AND expira_em < ?').run(uid, agora);
    // no máximo 10 sessões por pessoa: apaga as mais antigas
    q('DELETE FROM sessoes WHERE user_id = ? AND id_hash NOT IN (SELECT id_hash FROM sessoes WHERE user_id = ? ORDER BY criado_em DESC LIMIT 9)').run(uid, uid);
    q('INSERT INTO sessoes (id_hash, user_id, criado_em, expira_em) VALUES (?, ?, ?, ?)').run(auth.hashToken(t), uid, agora, agora + auth.SESSAO_DIAS * 864e5);
    definirSessao(req, res, t, auth.SESSAO_DIAS);
  }

  // ---------- leitura do estado do aluno ----------
  const perfilDe = uid => {
    const p = q('SELECT * FROM perfis WHERE user_id = ?').get(uid);
    if (!p) return null;
    return { ...p, interesses: lerJson(p.interesses, []), lembrete: lerJson(p.lembrete, {}), objetivo_nome: OBJETIVOS[p.objetivo]?.nome || null };
  };
  const nivelamentoDe = uid => { const r = q('SELECT resultado, feito_em FROM nivelamentos WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(uid); return r ? { ...lerJson(r.resultado, {}), feito_em: r.feito_em } : null; };
  const planoDe = uid => { const r = q('SELECT id, dados FROM planos WHERE user_id = ? AND ativo = 1 ORDER BY id DESC LIMIT 1').get(uid); return r ? { ...lerJson(r.dados, null), _id: r.id } : null; };
  const competenciasDe = uid => Object.fromEntries(q('SELECT * FROM competencias WHERE user_id = ?').all(uid).map(c => [c.missao, { ...c, evidencia: lerJson(c.evidencia, null) }]));
  const tentativasDe = (uid, dias = 60) => q('SELECT * FROM tentativas WHERE user_id = ? AND em >= ? ORDER BY em ASC LIMIT 1500').all(uid, new Date(Date.now() - dias * 864e5).toISOString());
  const focosDe = uid => q("SELECT * FROM focos WHERE user_id = ? AND status IN ('novo','praticando') ORDER BY criado_em DESC").all(uid).map(f => ({ ...f, abordagens: lerJson(f.abordagens, []) }));
  const revisoesDe = uid => q('SELECT * FROM revisoes WHERE user_id = ? AND em >= ? ORDER BY em').all(uid, new Date(Date.now() - 45 * 864e5).toISOString());
  const descartesDe = (uid, h) => q('SELECT hipotese FROM descartes WHERE user_id = ? AND ate >= ?').all(uid, h).map(r => r.hipotese);
  const pendentesDe = (uid, h) => q('SELECT COUNT(*) n FROM cartoes WHERE user_id = ? AND vence_em <= ?').get(uid, h).n;
  const assinaturaDe = uid => { const r = q('SELECT dados FROM assinaturas WHERE user_id = ?').get(uid); return r ? lerJson(r.dados, null) : null; };
  const salvarAssinatura = (uid, a) => q('INSERT INTO assinaturas (user_id, dados) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET dados = excluded.dados').run(uid, JSON.stringify(a));
  const fusoDe = p => (p?.fuso && /^[A-Za-z_]+\/[A-Za-z_]+$/.test(p.fuso) ? p.fuso : 'America/Sao_Paulo');
  const hojeDe = uid => { const p = q('SELECT fuso FROM perfis WHERE user_id = ?').get(uid); try { return hoje(fusoDe(p)); } catch { return hoje(); } };

  function hipotesesDe(uid, h) {
    return modelo.hipoteses(tentativasDe(uid, 30), revisoesDe(uid), { descartadas: descartesDe(uid, h) });
  }

  function estadoAssinatura(uid, h) {
    const a = assinaturaDe(uid);
    const est = assin.estado(a, h);
    return { ...est, limites: assin.limitesDe(est) };
  }
  function usoMes(uid, h) {
    const mes = h.slice(0, 7);
    return Object.fromEntries(q('SELECT tipo, qtd FROM uso_ia WHERE user_id = ? AND mes = ?').all(uid, mes).map(r => [r.tipo, r.qtd]));
  }
  // pode usar IA nesta tarefa? (chave configurada + plano com cota)
  function podeIa(uid, tipo, h) {
    if (!ia.ativo()) return { pode: false, motivo: 'sem_ia' };
    const est = estadoAssinatura(uid, h);
    const usado = usoMes(uid, h)[tipo] || 0;
    if (usado >= (est.limites[tipo] || 0)) return { pode: false, motivo: est.acesso === 'livre' ? 'plano_livre' : 'limite' };
    if (!limIa.tentar('u' + uid)) return { pode: false, motivo: 'ritmo' };
    return { pode: true };
  }
  function contarIa(uid, tipo, h, uso) {
    q('INSERT INTO uso_ia (user_id, mes, tipo, qtd, tokens_entrada, tokens_saida) VALUES (?, ?, ?, 1, ?, ?) ON CONFLICT(user_id, mes, tipo) DO UPDATE SET qtd = qtd + 1, tokens_entrada = tokens_entrada + excluded.tokens_entrada, tokens_saida = tokens_saida + excluded.tokens_saida')
      .run(uid, h.slice(0, 7), tipo, uso?.entrada || 0, uso?.saida || 0);
  }
  const avisoIa = motivo => ({
    sem_ia: 'O tutor de IA não está ligado neste servidor. Você está no modo de prática com correção automática básica.',
    plano_livre: 'No acesso livre, a IA fica pausada. Seus dados estão guardados; assine quando quiser para voltar ao plano completo.',
    limite: 'Você usou a cota de IA deste mês. Até o mês virar, seguimos no modo de prática com correção básica, sem custo extra.',
    ritmo: 'Muitas mensagens em pouco tempo. Respire um pouco e tente de novo em instantes.',
    erro: 'O tutor de IA não respondeu agora. Usamos a correção básica nesta vez.',
  }[motivo] || null);

  function exigirAcessoCompleto(uid, h) {
    const est = estadoAssinatura(uid, h);
    if (est.acesso !== 'completo') throw new ErroHttp(402, 'Seu teste grátis terminou. Lições e conversas ficam pausadas no acesso livre, mas seus flashcards, progresso e dados continuam disponíveis. Assine quando quiser para continuar de onde parou.');
  }

  // ---------- registros ----------
  function registrarTentativa(uid, t) {
    q('INSERT INTO tentativas (user_id, em, item_id, missao, habilidade, tag, formato, modalidade, correto, tempo_ms, dica, origem, contexto, resposta) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(uid, agoraISO(), t.item_id || null, t.missao || null, t.habilidade || null, t.tag || null, t.formato || null, t.modalidade || 'texto', t.correto ? 1 : 0, Math.max(0, Math.min(600000, t.tempo_ms | 0)), t.dica ? 1 : 0, t.origem || null, t.contexto || null, t.resposta ? String(t.resposta).slice(0, 500) : null);
  }
  function criarCartao(uid, c, h) {
    if (!c.frente || !c.verso) return false;
    const r = q('INSERT OR IGNORE INTO cartoes (user_id, frente, verso, exemplo, tipo, origem, tag, nota_origem, vence_em, criado_em) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(uid, String(c.frente).slice(0, 300), String(c.verso).slice(0, 300), c.exemplo ? String(c.exemplo).slice(0, 300) : null, c.tipo, c.origem || null, c.tag || null, c.nota_origem ? String(c.nota_origem).slice(0, 200) : null, h, agoraISO());
    return r.changes > 0;
  }
  // achados (de conversa, produção ou material) viram foco da próxima lição + cartão de erro + tentativa no modelo
  function registrarAchados(uid, achados, { origem, cenario = null, contexto = null }, h) {
    const novos = [];
    for (const a of achados) {
      if (a.confianca === 'baixa' || !a.trecho) continue;
      if (!a.tag || a.tag === 'outro' || !POR_TAG[a.tag]) {   // erro só dele: não está no catálogo, mas entra na revisão e no "corrija a frase" do treino
        if (a.sugestao) criarCartao(uid, { frente: `Como dizer melhor: "${String(a.trecho).slice(0, 120)}"`, verso: String(a.sugestao).slice(0, 200), tipo: 'erro', origem, tag: null, nota_origem: a.explicacao }, h);
        continue;
      }
      const aberto = q("SELECT id FROM focos WHERE user_id = ? AND tag = ? AND status IN ('novo','praticando') LIMIT 1").get(uid, a.tag);
      if (aberto) q('UPDATE focos SET trecho = ?, correcao = ?, origem = ?, cenario = ? WHERE id = ? AND user_id = ?').run(String(a.trecho).slice(0, 200), String(a.sugestao || '').slice(0, 200), origem, cenario, aberto.id, uid);
      else { q('INSERT INTO focos (user_id, tag, origem, cenario, trecho, correcao, criado_em) VALUES (?,?,?,?,?,?,?)').run(uid, a.tag, origem, cenario, String(a.trecho).slice(0, 200), String(a.sugestao || '').slice(0, 200), agoraISO()); novos.push(a.tag); }
      criarCartao(uid, { frente: `Como dizer melhor: "${String(a.trecho).slice(0, 120)}"`, verso: String(a.sugestao || '').slice(0, 200), exemplo: POR_TAG[a.tag].abordagens.exemplos[0], tipo: 'erro', origem, tag: a.tag, nota_origem: a.explicacao }, h);
      registrarTentativa(uid, { tag: a.tag, habilidade: POR_TAG[a.tag].habilidade, formato: 'producao', modalidade: 'texto', correto: false, origem, contexto: contexto || cenario || origem, resposta: a.trecho });
    }
    return novos;
  }
  function conquistar(uid, codigo) {
    return q('INSERT OR IGNORE INTO conquistas (user_id, codigo, em) VALUES (?, ?, ?)').run(uid, codigo, agoraISO()).changes > 0;
  }
  function somarMinutos(uid, h, minutos) {
    const antes = q('SELECT MAX(data) d FROM dias_estudo WHERE user_id = ? AND data < ?').get(uid, h).d;
    q('INSERT INTO dias_estudo (user_id, data, minutos) VALUES (?, ?, ?) ON CONFLICT(user_id, data) DO UPDATE SET minutos = minutos + excluded.minutos').run(uid, h, Math.max(0, Math.min(180, minutos)));
    const novas = [];
    if (antes && diasEntre(antes, h) >= 7 && conquistar(uid, 'volta:' + h.slice(0, 7))) novas.push('volta');
    const dias = q('SELECT COUNT(*) n FROM dias_estudo WHERE user_id = ?').get(uid).n;
    for (const m of [3, 10, 30, 60]) if (dias >= m && conquistar(uid, 'dias-' + m)) novas.push('dias-' + m);
    // sequência: cada marco vira uma figurinha especial (e fica, mesmo se a sequência recomeçar)
    for (const m of premiosAlcancados(sequenciaDe(uid, h))) if (conquistar(uid, 'seq-' + m)) novas.push('seq-' + m);
    return novas;
  }
  const sequenciaDe = (uid, h) => calcularSequencia(q('SELECT data FROM dias_estudo WHERE user_id = ? AND data >= ? ORDER BY data').all(uid, somarDias(h, -400)).map(r => r.data), h);

  // ---------- plano e lição ----------
  function gerarPlano(uid, h) {
    const p = perfilDe(uid), n = nivelamentoDe(uid);
    if (!p?.objetivo || !n) return null;
    const plano = montarPlano(p, n.nivel, h);
    transacao(db, () => {
      q('UPDATE planos SET ativo = 0 WHERE user_id = ?').run(uid);
      q('INSERT INTO planos (user_id, criado_em, ativo, dados) VALUES (?, ?, 1, ?)').run(uid, agoraISO(), JSON.stringify(plano));
      // lição de hoje ainda não começada é refeita com o plano novo
      q("DELETE FROM licoes WHERE user_id = ? AND data = ? AND status = 'aberta' AND respondidos = '{}'").run(uid, h);
    });
    return plano;
  }

  function licaoDeHoje(uid, h, { criar = true } = {}) {
    let row = q('SELECT * FROM licoes WHERE user_id = ? AND data = ?').get(uid, h);
    if (!row && criar) {
      const plano = planoDe(uid);
      if (!plano) return null;
      const n = nivelamentoDe(uid);
      const tent = tentativasDe(uid);
      const licao = montarLicao({
        perfil: perfilDe(uid), plano, nivel: n?.nivel || 'A2', tentativas: tent, competencias: competenciasDe(uid), focos: focosDe(uid),
        hipoteses: modelo.hipoteses(tent.filter(t => Date.now() - Date.parse(t.em) <= 30 * 864e5), revisoesDe(uid), { descartadas: descartesDe(uid, h) }),
        hojeISO: h, cartoesPendentes: pendentesDe(uid, h),
      });
      q('INSERT OR IGNORE INTO licoes (user_id, data, dados) VALUES (?, ?, ?)').run(uid, h, JSON.stringify(licao));
      row = q('SELECT * FROM licoes WHERE user_id = ? AND data = ?').get(uid, h);
    }
    if (!row) return null;
    return { ...row, dados: lerJson(row.dados, null), respondidos: lerJson(row.respondidos, {}) };
  }

  // ---------- rotas ----------
  const rotas = [];
  const rota = (metodo, padrao, fn, { publica = false } = {}) => rotas.push({ metodo, re: new RegExp('^' + padrao.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn, publica });

  // Auth
  rota('GET', '/auth/estado', (ctx) => ({ logado: !!ctx.u, usuario: ctx.u ? { nome: ctx.u.nome, email: ctx.u.email } : null, ia: ia.ativo() }), { publica: true });

  rota('POST', '/auth/cadastro', async (ctx) => {
    if (!limCadastro.tentar(ctx.ip)) throw new ErroHttp(429, 'Muitas tentativas. Tente de novo mais tarde.');
    const b = ctx.corpo;
    const nome = V.str(b.nome, 80, { min: 2, campo: 'Nome' });
    const email = V.email(b.email);
    if (typeof b.senha !== 'string') throw new ErroHttp(422, 'Senha inválida.');
    const fraca = auth.senhaFraca(b.senha, { nome, email });
    if (fraca) throw new ErroHttp(422, fraca);
    if (b.consentimento !== true) throw new ErroHttp(422, 'Para criar a conta, é preciso concordar com a política de privacidade.');
    const h = hoje();
    const hash = auth.hashSenha(b.senha);
    let uid;
    try {
      uid = transacao(db, () => {
        const r = q('INSERT INTO usuarios (email, nome, senha_hash, criado_em, consentiu_em) VALUES (?, ?, ?, ?, ?)').run(email, nome, hash, agoraISO(), agoraISO());
        const id = Number(r.lastInsertRowid);
        q('INSERT INTO perfis (user_id, atualizado_em) VALUES (?, ?)').run(id, agoraISO());
        salvarAssinatura(id, assin.novaAssinatura(h));
        return id;
      });
    } catch (e) {
      if (/UNIQUE/i.test(e.message)) throw new ErroHttp(409, 'Já existe uma conta com esse e-mail. Tente entrar.');
      throw e;
    }
    abrirSessao(ctx.req, ctx.res, uid);
    return { ok: true };
  }, { publica: true });

  rota('POST', '/auth/entrar', async (ctx) => {
    const b = ctx.corpo;
    if (typeof b.email !== 'string' || typeof b.senha !== 'string' || b.email.length > 160 || b.senha.length > 200) throw new ErroHttp(400, 'E-mail ou senha incorretos.');
    const email = b.email.trim().toLowerCase();
    if (!limLoginIp.tentar(ctx.ip) || !limLoginConta.tentar(email)) throw new ErroHttp(429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.');
    const u = q('SELECT id, senha_hash FROM usuarios WHERE email = ?').get(email);
    const ok = auth.conferirSenha(b.senha, u ? u.senha_hash : auth.HASH_FALSO) && !!u;
    if (!ok) throw new ErroHttp(401, 'E-mail ou senha incorretos.');
    limLoginConta.limpar(email);
    abrirSessao(ctx.req, ctx.res, u.id);
    return { ok: true };
  }, { publica: true });

  rota('POST', '/auth/sair', (ctx) => {
    if (ctx.u) q('DELETE FROM sessoes WHERE id_hash = ?').run(ctx.u.tokenHash);
    limparSessao(ctx.req, ctx.res);
    return { ok: true };
  }, { publica: true });

  rota('POST', '/auth/senha', (ctx) => {
    const b = ctx.corpo;
    const u = q('SELECT senha_hash, nome, email FROM usuarios WHERE id = ?').get(ctx.u.id);
    if (typeof b.atual !== 'string' || !auth.conferirSenha(b.atual, u.senha_hash)) throw new ErroHttp(401, 'Senha atual incorreta.');
    if (typeof b.nova !== 'string') throw new ErroHttp(422, 'Senha inválida.');
    const fraca = auth.senhaFraca(b.nova, u);
    if (fraca) throw new ErroHttp(422, fraca);
    q('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(auth.hashSenha(b.nova), ctx.u.id);
    q('DELETE FROM sessoes WHERE user_id = ? AND id_hash <> ?').run(ctx.u.id, ctx.u.tokenHash);   // derruba as outras sessões
    return { ok: true };
  });

  // Conteúdo estático do onboarding
  rota('GET', '/objetivos', () => ({ objetivos: Object.entries(OBJETIVOS).map(([id, o]) => ({ id, nome: o.nome, frase: o.frase, aviso: o.aviso || null })), interesses: INTERESSES }), { publica: true });

  // Quem sou eu + em que passo estou
  rota('GET', '/eu', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const p = perfilDe(uid), n = nivelamentoDe(uid), plano = planoDe(uid);
    const passo = !p?.objetivo ? 'perfil' : !n ? 'nivelamento' : !plano ? 'plano' : 'app';
    return { usuario: { nome: ctx.u.nome, email: ctx.u.email }, perfil: p, nivel: n?.nivel || null, passo, assinatura: estadoAssinatura(uid, h), ia: ia.ativo(), hoje: h };
  });

  rota('PUT', '/perfil', (ctx) => {
    const uid = ctx.u.id, b = ctx.corpo, h = hojeDe(uid);
    const objetivo = V.um(b.objetivo, Object.keys(OBJETIVOS), 'Objetivo');
    const prazo = V.data(b.prazo, 'Prazo');
    if (prazo && (diasEntre(h, prazo) < 7 || diasEntre(h, prazo) > 3 * 365)) throw new ErroHttp(422, 'Escolha um prazo entre 1 semana e 3 anos (ou deixe sem prazo).');
    const minutos = V.um(Number(b.minutos_dia), [10, 15, 20], 'Tempo por dia');
    const dias = V.int(b.dias_semana ?? 5, 1, 7, 'Dias por semana');
    const area = V.str(b.area, 80, { campo: 'Área' });
    const detalhe = V.str(b.objetivo_detalhe, 300, { campo: 'Objetivo' });
    if (!Array.isArray(b.interesses ?? []) || (b.interesses || []).length > 8) throw new ErroHttp(422, 'Interesses inválidos.');
    const interesses = (b.interesses || []).map(i => V.str(i, 30, { campo: 'Interesse' })).filter(Boolean);
    const fuso = typeof b.fuso === 'string' && /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(b.fuso) && b.fuso.length < 40 ? b.fuso : 'America/Sao_Paulo';
    const antes = perfilDe(uid);
    q('UPDATE perfis SET objetivo = ?, objetivo_detalhe = ?, prazo = ?, minutos_dia = ?, dias_semana = ?, area = ?, interesses = ?, meta_diaria = ?, fuso = ?, atualizado_em = ? WHERE user_id = ?')
      .run(objetivo, detalhe, prazo, minutos, dias, area, JSON.stringify(interesses), minutos, fuso, agoraISO(), uid);
    const mudouPlano = !antes || antes.objetivo !== objetivo || antes.prazo !== prazo || antes.minutos_dia !== minutos || antes.dias_semana !== dias;
    const plano = mudouPlano && nivelamentoDe(uid) ? gerarPlano(uid, h) : null;
    return { ok: true, planoRefeito: !!plano };
  });

  rota('PUT', '/perfil/lembrete', (ctx) => {
    const b = ctx.corpo;
    const ativo = b.ativo === true;
    const hora = ativo ? V.str(b.hora, 5, { campo: 'Horário' }) : '19:00';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) throw new ErroHttp(422, 'Horário inválido.');
    if (!Array.isArray(b.dias) || b.dias.length > 7) throw new ErroHttp(422, 'Dias inválidos.');
    const dias = [...new Set(b.dias.map(d => V.int(d, 0, 6, 'Dia')))];
    q('UPDATE perfis SET lembrete = ? WHERE user_id = ?').run(JSON.stringify({ ativo, hora, dias }), ctx.u.id);
    return { ok: true };
  });

  // Nivelamento
  rota('GET', '/nivelamento', (ctx) => {
    const itens = nivelamentoConteudo.ITENS.map(i => ({
      id: i.id, habilidade: i.habilidade, nivel: i.nivel, tipo: i.tipo, enunciado: i.enunciado || null, texto: i.texto || null, pergunta: i.pergunta || null,
      audio: i.audio || null, velocidade: i.velocidade || 1, opcoes: embaralhar(i.opcoes, `${ctx.u.id}:${i.id}`),
    }));
    return { itens, abertas: nivelamentoConteudo.ABERTAS, anterior: nivelamentoDe(ctx.u.id) };
  });

  rota('POST', '/nivelamento', async (ctx) => {
    const uid = ctx.u.id, b = ctx.corpo, h = hojeDe(uid);
    const chave = 'niv' + uid;
    if (emAndamento.has(chave)) throw new ErroHttp(409, 'Já estamos corrigindo seu teste.');
    emAndamento.add(chave);
    try {
      const nunca = b.nunca === true;       // "nunca estudei inglês": começa no A1 sem fazer o teste
      if (!nunca && (!b.respostas || typeof b.respostas !== 'object' || Array.isArray(b.respostas))) throw new ErroHttp(422, 'Respostas inválidas.');
      const respostas = {};
      for (const item of nivelamentoConteudo.ITENS) {
        const r = nunca ? null : b.respostas[item.id];
        if (!r || typeof r !== 'object') continue;
        respostas[item.id] = { resposta: V.str(r.resposta ?? '', 300, { campo: 'Resposta' }), tempoMs: Math.max(0, Math.min(600000, Number(r.tempoMs) | 0)), naoSei: r.naoSei === true };
      }
      if (!nunca && Object.keys(respostas).length < 8) throw new ErroHttp(422, 'Responda pelo menos 8 perguntas (pode marcar "não sei").');
      const escrita = V.str(b.escrita, 2000, { campo: 'Escrita' });
      const fala = V.str(b.fala, 500, { campo: 'Fala' });
      const resultado = nunca
        ? { nivel: 'A1', porHabilidade: {}, fortes: [], atencao: [], pistas: [], resumo: ['Você disse que está começando do zero. Vamos do primeiro dia, bem devagar, com muito áudio.'], confianca: 'baixa', totalRespondido: 0, nuncaEstudou: true, aviso: 'Sem teste: começamos no nível mais básico. Se for fácil demais, o app ajusta conforme você responde.' }
        : corrigirNivelamento({ respostas, escrita, fala });
      transacao(db, () => {
        q('INSERT INTO nivelamentos (user_id, feito_em, resultado) VALUES (?, ?, ?)').run(uid, agoraISO(), JSON.stringify(resultado));
        for (const item of nivelamentoConteudo.ITENS) {
          const r = respostas[item.id]; if (!r) continue;
          registrarTentativa(uid, { item_id: item.id, habilidade: item.habilidade, tag: item.tag, formato: 'reconhecimento', modalidade: item.tipo === 'escuta' ? 'audio' : 'texto', correto: normalizar(r.resposta) === normalizar(item.opcoes[item.resposta]), tempo_ms: r.tempoMs, origem: 'nivelamento', contexto: 'nivelamento' });
        }
        if (escrita) {
          q('INSERT INTO amostras (user_id, em, tipo, tarefa, texto, avaliacao) VALUES (?, ?, ?, ?, ?, ?)').run(uid, agoraISO(), 'escrita', nivelamentoConteudo.ABERTAS.escrita.enunciado, escrita, JSON.stringify(resultado.porHabilidade.escrita?.detalhe || null));
          registrarAchados(uid, (resultado.porHabilidade.escrita?.detalhe?.achados || []), { origem: 'nivelamento' }, h);
        }
      });
      conquistar(uid, 'primeiro-passo');
      const plano = gerarPlano(uid, h);
      return { resultado, plano };
    } finally { emAndamento.delete(chave); }
  });

  // Plano
  rota('GET', '/plano', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    let plano = planoDe(uid);
    if (!plano) plano = gerarPlano(uid, h);
    if (!plano) throw new ErroHttp(409, 'Complete o perfil e o nivelamento primeiro.');
    const comp = competenciasDe(uid);
    const n = nivelamentoDe(uid);
    const atual = missaoAtual(plano, comp);
    return {
      plano: { ...plano, _id: undefined, missoes: plano.missoes.map(m => ({ ...m, status: comp[m.id]?.status || 'nao_iniciada', partes: comp[m.id]?.partes || 0, total: licoesPorMissao(POR_ID[m.id], n?.nivel || 'A2'), atual: atual?.id === m.id, demonstrado_em: comp[m.id]?.demonstrado_em || null, retido_em: comp[m.id]?.retido_em || null })) },
      nivelamento: n,
    };
  });

  // Tela inicial
  rota('GET', '/hoje', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const est = estadoAssinatura(uid, h);
    const plano = planoDe(uid);
    if (!plano) return { semPlano: true };
    const lic = est.acesso === 'completo' ? licaoDeHoje(uid, h) : licaoDeHoje(uid, h, { criar: false });
    const pend = pendentesDe(uid, h);
    const minutosHoje = q('SELECT minutos FROM dias_estudo WHERE user_id = ? AND data = ?').get(uid, h)?.minutos || 0;
    const p = perfilDe(uid);
    const focoNovo = q("SELECT tag, origem FROM focos WHERE user_id = ? AND status = 'novo' ORDER BY criado_em DESC LIMIT 1").get(uid);
    const conversaHoje = q('SELECT COUNT(*) n FROM conversas WHERE user_id = ? AND iniciada_em >= ?').get(uid, h).n;
    // próximo passo recomendado (um só, para não poluir)
    let proximo;
    if (est.acesso !== 'completo') proximo = pend ? { acao: 'revisar', texto: `Revisar ${pend} cartões` } : { acao: 'assinatura', texto: 'Ver planos para continuar o plano completo' };
    else if (lic && lic.status !== 'concluida') proximo = { acao: 'licao', texto: lic.iniciada_em ? 'Continuar a lição de hoje' : 'Começar a lição de hoje' };
    else if (pend) proximo = { acao: 'revisar', texto: `Revisar ${pend} cartões pendentes` };
    else if (!conversaHoje) proximo = { acao: 'conversar', texto: 'Uma conversa curta para fechar o dia', cenario: POR_ID[missaoAtual(plano, competenciasDe(uid))?.id]?.conversa || 'apresentacao' };
    else proximo = { acao: 'descansar', texto: 'Por hoje está ótimo. Volte amanhã para a próxima lição.' };
    const inicioHoje = new Date(Date.now() - 864e5).toISOString();
    const pontosHoje = 10 * q("SELECT COUNT(*) n FROM tentativas WHERE user_id = ? AND correto = 1 AND origem IN ('licao','revisao','conversa','producao','material','estudo','simulado') AND em >= ?").get(uid, inicioHoje).n
      + 20 * q("SELECT COUNT(*) n FROM licoes WHERE user_id = ? AND data = ? AND status = 'concluida'").get(uid, h).n;
    const diasNoMes = q('SELECT COUNT(*) n FROM dias_estudo WHERE user_id = ? AND data LIKE ?').get(uid, h.slice(0, 7) + '%').n;
    const novasConquistas = q('SELECT codigo FROM conquistas WHERE user_id = ? AND em >= ?').all(uid, new Date(Date.now() - 864e5).toISOString()).map(r => r.codigo);
    return {
      nome: ctx.u.nome.split(' ')[0], hoje: h,
      licao: lic ? { status: lic.status, minutos: lic.dados.minutos, missao: lic.dados.missao, porque: lic.dados.porque, iniciada: !!lic.iniciada_em } : null,
      revisoesPendentes: pend, proximo,
      meta: { minutos: p.meta_diaria || 15, feitos: Math.round(minutosHoje) },
      foco: focoNovo ? { nome: POR_TAG[focoNovo.tag]?.nome, origem: focoNovo.origem } : null,
      objetivo: { nome: plano.objetivoNome, prazo: plano.prazo, metaRealista: plano.metaRealista },
      assinatura: est, novasConquistas, pontosHoje, diasNoMes, sequencia: sequenciaDe(uid, h), estudo: estudoResumo(uid, h), treino: treinoResumo(uid, h),
      radio: radioResumo(uid, h), turmas: turmasMod.resumoParaHoje(uid),
    };
  });

  // Lição
  // Na primeira abertura da lição, com IA ligada: 3 exercícios escritos com a situação real do aluno.
  async function personalizarLicao(uid, h, lic) {
    if (lic.iniciada_em || Object.keys(lic.respondidos).length || !lic.dados.missao || lic.dados.personalizada !== undefined) return lic;
    const marcar = (dados) => { q('UPDATE licoes SET dados = ? WHERE id = ? AND user_id = ?').run(JSON.stringify(dados), lic.id, uid); return { ...lic, dados }; };
    const perm = podeIa(uid, 'licao', h);
    if (!perm.pode) return marcar({ ...lic.dados, personalizada: false });
    const chave = 'pers' + uid;
    if (emAndamento.has(chave)) return lic;
    emAndamento.add(chave);
    try {
      const def = POR_ID[lic.dados.missao.id];
      const p = perfilDe(uid);
      const r = await ia.gerarExercicios({ missao: def, perfil: p, nivel: nivelamentoDe(uid)?.nivel, tags: def.tags });
      contarIa(uid, 'licao', h, r.uso);
      const exs = validarExerciciosIa(r.exercicios, def.id, def.tags[0]);
      if (!exs.length) return marcar({ ...lic.dados, personalizada: false });
      const dados = { ...lic.dados, personalizada: true, blocos: lic.dados.blocos.slice() };
      // entra depois da primeira prática da missão (ou no fim, se não houver)
      const pos = dados.blocos.findIndex(b => b.tipo === 'exercicios' && b.exercicios?.some(e => e.missao === def.id && e.tipo !== 'pares'));
      dados.blocos.splice(pos >= 0 ? pos + 1 : dados.blocos.length, 0, { tipo: 'exercicios', titulo: 'Feitos para a sua situação', exercicios: exs, personalizado: true });
      dados.porque = [...dados.porque, `Incluímos ${exs.length} exercícios escritos com a sua situação${p.area ? ` (${p.area})` : ''}${p.objetivo_detalhe ? ': “' + p.objetivo_detalhe.slice(0, 90) + (p.objetivo_detalhe.length > 90 ? '...' : '') + '”' : ''}.`];
      return marcar(dados);
    } catch (e) { console.error('[ia] exercícios personalizados falharam:', e.message); return marcar({ ...lic.dados, personalizada: false }); }
    finally { emAndamento.delete(chave); }
  }

  rota('GET', '/licao', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    exigirAcessoCompleto(uid, h);
    let lic = licaoDeHoje(uid, h);
    if (!lic) throw new ErroHttp(409, 'Seu plano ainda não está pronto.');
    lic = await personalizarLicao(uid, h, lic);
    if (!lic.iniciada_em) q('UPDATE licoes SET iniciada_em = ? WHERE id = ? AND user_id = ?').run(agoraISO(), lic.id, uid);
    return { licao: paraCliente(lic.dados, `${uid}:${h}`), respondidos: lic.respondidos, status: lic.status, ia: ia.ativo() };
  });

  rota('POST', '/licao/responder', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), b = ctx.corpo;
    exigirAcessoCompleto(uid, h);
    const itemId = V.str(b.itemId, 80, { min: 1, campo: 'Item' });
    const resposta = V.str(b.resposta, 500, { campo: 'Resposta' });
    const lic = licaoDeHoje(uid, h, { criar: false });
    if (!lic) throw new ErroHttp(404, 'Lição não encontrada.');
    if (lic.respondidos[itemId]) return { ...lic.respondidos[itemId], repetida: true };
    const ex = acharExercicio(lic.dados, itemId);
    if (!ex) throw new ErroHttp(404, 'Exercício não encontrado.');
    const r = corrigirExercicio(ex, resposta);
    const formato = ['escolha', 'escuta', 'leitura', 'detetive'].includes(ex.tipo) ? 'reconhecimento' : 'producao';
    transacao(db, () => {
      const atual = lerJson(q('SELECT respondidos FROM licoes WHERE id = ? AND user_id = ?').get(lic.id, uid).respondidos, {});
      if (atual[itemId]) return;   // clique duplo
      atual[itemId] = { correto: r.correto, quase: r.quase, esperado: r.esperado, explica: r.explica, achados: r.achados, resposta };
      q('UPDATE licoes SET respondidos = ? WHERE id = ? AND user_id = ?').run(JSON.stringify(atual), lic.id, uid);
      registrarTentativa(uid, { item_id: itemId, missao: ex.missao || null, habilidade: ex.habilidade, tag: ex.tag, formato, modalidade: ['escuta', 'ditado', 'fala'].includes(ex.tipo) ? 'audio' : 'texto', correto: r.correto, tempo_ms: b.tempoMs, dica: b.dica === true, origem: 'licao', contexto: ex.missao || (ex.tag ? 'foco' : 'licao'), resposta });
      if (!r.correto && ex.tipo === 'traduzir') criarCartao(uid, { frente: ex.pt, verso: r.esperado, tipo: 'erro', origem: 'licao', tag: ex.tag, nota_origem: r.explica }, h);
      if (!r.correto && ex.tipo === 'lacuna' && !ex.multi) criarCartao(uid, { frente: ex.frase, verso: ex.frase.replace('___', ex.resposta[0]), tipo: 'erro', origem: 'licao', tag: ex.tag, nota_origem: r.explica }, h);
    });
    const textoAudio = ['escuta', 'ditado'].includes(ex.tipo) ? ex.audio : null;
    return { correto: r.correto, quase: r.quase, esperado: r.esperado, explica: r.explica, achados: r.achados, textoAudio };
  });

  rota('POST', '/licao/contestar', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const itemId = V.str(ctx.corpo.itemId, 80, { min: 1, campo: 'Item' });
    const r = q("UPDATE tentativas SET contestada = 1 WHERE id = (SELECT id FROM tentativas WHERE user_id = ? AND item_id = ? AND origem = 'licao' AND em >= ? ORDER BY id DESC LIMIT 1) AND user_id = ?").run(uid, itemId, h, uid);
    return { ok: r.changes > 0, mensagem: 'Anotado. Essa resposta não vai contar como erro no seu progresso. Se ela estiver certa de outro jeito, ótimo: inglês tem mais de uma forma de dizer as coisas.' };
  });

  rota('POST', '/licao/producao', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), b = ctx.corpo;
    exigirAcessoCompleto(uid, h);
    const idx = V.int(b.bloco, 0, 30, 'Bloco');
    const texto = V.str(b.texto, 3000, { min: 1, campo: 'Texto' });
    const usouAjuda = b.usouAjuda === true;
    const chave = 'prod' + uid;
    if (emAndamento.has(chave)) throw new ErroHttp(409, 'Estamos corrigindo seu texto.');
    emAndamento.add(chave);
    try {
      const lic = licaoDeHoje(uid, h, { criar: false });
      const bloco = lic?.dados?.blocos?.[idx];
      if (!bloco || bloco.tipo !== 'producao') throw new ErroHttp(404, 'Tarefa não encontrada.');
      const regras = avaliarProducao(bloco.tarefa, texto, { usouAjuda });
      let av = regras, aviso = null;
      const perm = podeIa(uid, 'avaliacao', h);
      if (perm.pode) {
        try {
          const n = nivelamentoDe(uid);
          const r = await ia.avaliarProducao({ tarefa: bloco.tarefa, texto, perfil: perfilDe(uid), nivel: n?.nivel });
          contarIa(uid, 'avaliacao', h, r.uso);
          const minimo = palavras(texto) >= (bloco.tarefa.minPalavras || 15);
          av = { nota: Math.max(0, Math.min(100, r.nota | 0)), palavras: palavras(texto), elementos: regras.elementos.map(e => ({ ...e, ok: !r.elementos_faltando.some(f => normalizar(f).includes(normalizar(e.nome).split(' ')[0])) })),
            achados: r.correcoes, demonstrado: !usouAjuda && r.cumpre_tarefa && r.erros_graves === 0 && minimo, comentario: r.comentario, versaoMelhorada: r.versao_melhorada, modo: 'ia' };
          if (usouAjuda) av.comentario += ' Como você usou as dicas, isto conta como prática.';
        } catch (e) { aviso = avisoIa('erro'); console.error('[ia] avaliação falhou:', e.message); }
      } else aviso = avisoIa(perm.motivo);

      const res = transacao(db, () => {
        const amostra = q('INSERT INTO amostras (user_id, em, tipo, missao, tarefa, texto, avaliacao, demonstrado, reteste) VALUES (?,?,?,?,?,?,?,?,?)')
          .run(uid, agoraISO(), 'escrita', bloco.missao || null, bloco.tarefa.enunciado, texto, JSON.stringify(av), av.demonstrado ? 1 : 0, bloco.reteste ? 1 : 0);
        const amostraId = Number(amostra.lastInsertRowid);
        registrarAchados(uid, av.achados || [], { origem: 'producao', contexto: bloco.missao || 'reteste' }, h);
        const tagsComErro = new Set((av.achados || []).filter(a => a.confianca !== 'baixa').map(a => a.tag));
        for (const tag of bloco.tarefa.tagsChave || []) if (!tagsComErro.has(tag)) registrarTentativa(uid, { tag, habilidade: 'escrita', formato: 'producao', correto: true, dica: usouAjuda, origem: 'producao', contexto: bloco.missao || 'reteste' });
        registrarTentativa(uid, { item_id: 'producao:' + (bloco.missao || bloco.focoTag), missao: bloco.missao, habilidade: 'escrita', formato: 'producao', correto: av.demonstrado, dica: usouAjuda, origem: 'producao', contexto: bloco.missao || 'reteste' });
        let evento = null;
        if (bloco.missao) {
          const c = q('SELECT * FROM competencias WHERE user_id = ? AND missao = ?').get(uid, bloco.missao);
          const ev = JSON.stringify({ amostraId, nota: av.nota, data: h, modo: av.modo });
          if (!bloco.reteste) {
            if (av.demonstrado && (!c || !['demonstrado', 'retido'].includes(c.status))) {
              q("INSERT INTO competencias (user_id, missao, status, partes, demonstrado_em, evidencia) VALUES (?, ?, 'demonstrado', 0, ?, ?) ON CONFLICT(user_id, missao) DO UPDATE SET status = 'demonstrado', demonstrado_em = excluded.demonstrado_em, evidencia = excluded.evidencia").run(uid, bloco.missao, agoraISO(), ev);
              evento = 'demonstrado';
            } else if (!c) q("INSERT INTO competencias (user_id, missao, status, partes) VALUES (?, ?, 'praticando', 0)").run(uid, bloco.missao);
          } else if (c) {
            if (av.demonstrado) { q("UPDATE competencias SET status = 'retido', retido_em = ?, retestes = retestes + 1, evidencia = ? WHERE user_id = ? AND missao = ?").run(agoraISO(), ev, uid, bloco.missao); evento = 'retido'; }
            else { q("UPDATE competencias SET status = 'praticando', retestes = retestes + 1, partes = MAX(0, partes - 1) WHERE user_id = ? AND missao = ?").run(uid, bloco.missao); evento = 'voltou_pratica'; }
          }
        }
        if (bloco.focoId) {
          const okFoco = !tagsComErro.has(bloco.focoTag) && palavras(texto) >= Math.min(15, bloco.tarefa.minPalavras || 15) && !usouAjuda;
          if (okFoco) { q("UPDATE focos SET status = 'superado', resolvido_em = ? WHERE id = ? AND user_id = ?").run(agoraISO(), bloco.focoId, uid); evento = evento || 'foco_superado'; }
          else q("UPDATE focos SET status = 'novo', retestar_em = NULL WHERE id = ? AND user_id = ?").run(bloco.focoId, uid);
        }
        return { amostraId, evento };
      });
      const conq = [];
      if (res.evento === 'demonstrado' && conquistar(uid, 'primeira-demonstracao')) conq.push('primeira-demonstracao');
      if (res.evento === 'retido' && conquistar(uid, 'retido')) conq.push('retido');
      if (res.evento === 'foco_superado' && conquistar(uid, 'foco-superado')) conq.push('foco-superado');
      return { avaliacao: av, evento: res.evento, aviso, conquistas: conq, exemplo: bloco.semDicas ? null : POR_ID[bloco.missao]?.tarefa?.modelo || null };
    } finally { emAndamento.delete(chave); }
  });

  rota('POST', '/licao/concluir', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    exigirAcessoCompleto(uid, h);
    const lic = licaoDeHoje(uid, h, { criar: false });
    if (!lic) throw new ErroHttp(404, 'Lição não encontrada.');
    if (lic.status === 'concluida') return { ok: true, repetida: true };
    const minutos = Math.max(1, Math.min(90, Math.round((Date.now() - Date.parse(lic.iniciada_em || agoraISO())) / 60000)));
    const conq = [];
    transacao(db, () => {
      q("UPDATE licoes SET status = 'concluida', concluida_em = ? WHERE id = ? AND user_id = ? AND status <> 'concluida'").run(agoraISO(), lic.id, uid);
      const m = lic.dados.missao;
      if (m) q("INSERT INTO competencias (user_id, missao, status, partes) VALUES (?, ?, 'praticando', 1) ON CONFLICT(user_id, missao) DO UPDATE SET partes = MIN(partes + 1, ?), status = CASE WHEN status = 'nao_iniciada' THEN 'praticando' ELSE status END").run(uid, m.id, m.total);
      for (const b of lic.dados.blocos) {
        if (b.tipo === 'foco') {
          const ab = b.explicacao.abordagem;
          if (b.focoId) {
            const f = q('SELECT abordagens FROM focos WHERE id = ? AND user_id = ?').get(b.focoId, uid);
            if (f) q("UPDATE focos SET status = 'praticando', abordagens = ?, retestar_em = ? WHERE id = ? AND user_id = ?").run(JSON.stringify([...new Set([...lerJson(f.abordagens, []), ab])]), somarDias(h, 3), b.focoId, uid);
          } else {
            q("INSERT INTO focos (user_id, tag, origem, criado_em, status, abordagens, retestar_em) VALUES (?, ?, 'padrao', ?, 'praticando', ?, ?)").run(uid, b.tag, agoraISO(), JSON.stringify([ab]), somarDias(h, 3));
          }
        }
        if (b.tipo === 'explicacao' && b.vocab) for (const v of b.vocab) criarCartao(uid, { frente: v.en, verso: v.pt, exemplo: v.ex, tipo: 'expressao', origem: 'licao:' + b.missao }, h);
      }
    });
    if (conquistar(uid, 'primeira-licao')) conq.push('primeira-licao');
    conq.push(...somarMinutos(uid, h, minutos));
    const total = q("SELECT COUNT(*) n FROM licoes WHERE user_id = ? AND status = 'concluida'").get(uid).n;
    if (total >= 10 && conquistar(uid, 'licoes-10')) conq.push('licoes-10');
    return { ok: true, minutos, conquistas: conq, revisoesPendentes: pendentesDe(uid, h) };
  });

  // Cartões
  const cartaoParaCliente = c => ({ id: c.id, frente: c.frente, verso: c.verso, exemplo: c.exemplo, tipo: c.tipo, tag: c.tag, nota: c.nota_origem, vence_em: c.vence_em, repeticoes: c.repeticoes, intervalo: c.intervalo, origem: c.origem,
    // expressões: primeiro reconhecer (inglês → português); depois de acertar, produzir (português → inglês)
    modo: c.tipo === 'expressao' && c.repeticoes >= 1 && c.repeticoes % 2 === 1 ? 'producao' : 'reconhecimento' });
  rota('GET', '/cartoes/revisar', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const lista = q('SELECT * FROM cartoes WHERE user_id = ? AND vence_em <= ? ORDER BY vence_em, id LIMIT 30').all(uid, h);
    return { cartoes: lista.map(cartaoParaCliente), total: pendentesDe(uid, h) };
  });
  rota('GET', '/cartoes', (ctx) => ({ cartoes: q('SELECT * FROM cartoes WHERE user_id = ? ORDER BY criado_em DESC LIMIT 1000').all(ctx.u.id).map(cartaoParaCliente) }));
  rota('POST', '/cartoes', (ctx) => {
    const uid = ctx.u.id, b = ctx.corpo;
    const ok = criarCartao(uid, { frente: V.str(b.frente, 200, { min: 1, campo: 'Frente' }), verso: V.str(b.verso, 200, { min: 1, campo: 'Verso' }), exemplo: V.str(b.exemplo, 300, { campo: 'Exemplo' }) || null, tipo: 'expressao', origem: 'aluno' }, hojeDe(uid));
    if (!ok) throw new ErroHttp(409, 'Você já tem um cartão com essa frente.');
    return { ok: true };
  });
  rota('PATCH', '/cartoes/:id', (ctx) => {
    const uid = ctx.u.id, id = V.id(ctx.params.id), b = ctx.corpo;
    const r = q('UPDATE cartoes SET frente = ?, verso = ?, exemplo = ? WHERE id = ? AND user_id = ?').run(V.str(b.frente, 200, { min: 1, campo: 'Frente' }), V.str(b.verso, 200, { min: 1, campo: 'Verso' }), V.str(b.exemplo, 300, { campo: 'Exemplo' }) || null, id, uid);
    if (!r.changes) throw new ErroHttp(404, 'Cartão não encontrado.');
    return { ok: true };
  });
  rota('DELETE', '/cartoes/:id', (ctx) => {
    const r = q('DELETE FROM cartoes WHERE id = ? AND user_id = ?').run(V.id(ctx.params.id), ctx.u.id);
    if (!r.changes) throw new ErroHttp(404, 'Cartão não encontrado.');
    return { ok: true };
  });
  rota('POST', '/cartoes/:id/revisar', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id);
    const nota = V.um(Number(ctx.corpo.nota), [0, 3, 4, 5], 'Nota');
    const c = q('SELECT * FROM cartoes WHERE id = ? AND user_id = ?').get(id, uid);
    if (!c) throw new ErroHttp(404, 'Cartão não encontrado.');
    if (c.vence_em > h) return { ok: true, repetida: true, vence_em: c.vence_em };
    const n = agendar(c, nota, h);
    transacao(db, () => {
      q('UPDATE cartoes SET facilidade = ?, intervalo = ?, repeticoes = ?, lapsos = ?, vence_em = ? WHERE id = ? AND user_id = ?').run(n.facilidade, n.intervalo, n.repeticoes, n.lapsos, n.vence_em, id, uid);
      q('INSERT INTO revisoes (user_id, cartao_id, em, nota, intervalo_antes, tempo_ms) VALUES (?, ?, ?, ?, ?, ?)').run(uid, id, agoraISO(), nota, c.intervalo, Math.max(0, Math.min(600000, Number(ctx.corpo.tempoMs) | 0)));
      if (c.tag) registrarTentativa(uid, { item_id: 'cartao:' + id, tag: c.tag, habilidade: POR_TAG[c.tag]?.habilidade || 'vocabulario', formato: 'producao', correto: nota >= 3, origem: 'revisao', contexto: 'revisao' });
    });
    const conq = [];
    const total = q('SELECT COUNT(*) n FROM revisoes WHERE user_id = ?').get(uid).n;
    if (total >= 50 && conquistar(uid, 'revisoes-50')) conq.push('revisoes-50');
    if (total % 10 === 0) conq.push(...somarMinutos(uid, h, 2));
    return { ok: true, vence_em: n.vence_em, intervalo: n.intervalo, conquistas: conq };
  });

  // Conversas
  rota('GET', '/conversas/cenarios', (ctx) => {
    const uid = ctx.u.id;
    const plano = planoDe(uid);
    const atual = plano ? missaoAtual(plano, competenciasDe(uid)) : null;
    const recomendado = POR_ID[atual?.id]?.conversa || 'apresentacao';
    const ordem = Object.keys(CENARIOS).sort((a, b) => (a === recomendado ? -1 : b === recomendado ? 1 : 0));
    return { cenarios: ordem.map(id => ({ id, titulo: CENARIOS[id].titulo, recomendado: id === recomendado })), ia: ia.ativo() };
  });
  rota('GET', '/conversas', (ctx) => ({ conversas: q('SELECT id, cenario, iniciada_em, terminada_em, modo FROM conversas WHERE user_id = ? ORDER BY id DESC LIMIT 100').all(ctx.u.id).map(c => ({ ...c, titulo: CENARIOS[c.cenario]?.titulo || c.cenario })) }));
  rota('GET', '/conversas/:id', (ctx) => {
    const c = q('SELECT * FROM conversas WHERE id = ? AND user_id = ?').get(V.id(ctx.params.id), ctx.u.id);
    if (!c) throw new ErroHttp(404, 'Conversa não encontrada.');
    return { conversa: { ...c, mensagens: lerJson(c.mensagens, []), titulo: CENARIOS[c.cenario]?.titulo, ajuda: CENARIOS[c.cenario]?.ajuda || [] } };
  });
  rota('POST', '/conversas', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    exigirAcessoCompleto(uid, h);
    const cen = V.um(ctx.corpo.cenario, Object.keys(CENARIOS), 'Cenário');
    const abertas = q('SELECT COUNT(*) n FROM conversas WHERE user_id = ? AND iniciada_em >= ?').get(uid, new Date(Date.now() - 864e5).toISOString()).n;
    if (abertas >= 30) throw new ErroHttp(429, 'Muitas conversas hoje. Que tal revisar o que já praticou?');
    const msgs = [{ papel: 'tutor', texto: CENARIOS[cen].abertura, em: agoraISO() }];
    const r = q('INSERT INTO conversas (user_id, cenario, iniciada_em, mensagens, modo) VALUES (?, ?, ?, ?, ?)').run(uid, cen, agoraISO(), JSON.stringify(msgs), podeIa(uid, 'conversa', h).pode ? 'ia' : 'roteiro');
    return { id: Number(r.lastInsertRowid), mensagens: msgs, titulo: CENARIOS[cen].titulo, ajuda: CENARIOS[cen].ajuda };
  });
  rota('POST', '/conversas/:id/mensagem', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id);
    exigirAcessoCompleto(uid, h);
    const texto = V.str(ctx.corpo.texto, 1500, { min: 1, campo: 'Mensagem' });
    const chave = 'conv' + uid;
    if (emAndamento.has(chave)) throw new ErroHttp(409, 'Aguarde a resposta anterior.');
    emAndamento.add(chave);
    try {
      const c = q('SELECT * FROM conversas WHERE id = ? AND user_id = ?').get(id, uid);
      if (!c) throw new ErroHttp(404, 'Conversa não encontrada.');
      if (c.terminada_em) throw new ErroHttp(409, 'Esta conversa já terminou. Comece outra quando quiser.');
      const msgs = lerJson(c.mensagens, []);
      if (msgs.length >= 60) throw new ErroHttp(409, 'Conversa longa demais. Encerre e comece outra.');
      const cen = CENARIOS[c.cenario];
      let turno, aviso = null;
      const perm = podeIa(uid, 'conversa', h);
      if (perm.pode) {
        try {
          turno = await ia.conversar({ cenario: cen, perfil: perfilDe(uid), nivel: nivelamentoDe(uid)?.nivel, historico: msgs, texto });
          contarIa(uid, 'conversa', h, turno.uso);
        } catch (e) { console.error('[ia] conversa falhou:', e.message); aviso = avisoIa('erro'); }
      } else aviso = avisoIa(perm.motivo);
      if (!turno) turno = turnoOffline(c.cenario, msgs, texto);
      const usouAjuda = ctx.corpo.ajuda === true;
      msgs.push({ papel: 'aluno', texto, em: agoraISO(), ajuda: usouAjuda });
      msgs.push({ papel: 'tutor', texto: turno.resposta, correcoes: turno.correcoes, em: agoraISO(), modo: turno.modo });
      transacao(db, () => {
        q('UPDATE conversas SET mensagens = ?, terminada_em = ?, modo = ? WHERE id = ? AND user_id = ?').run(JSON.stringify(msgs), turno.encerrar ? agoraISO() : null, turno.modo === 'ia' ? 'ia' : c.modo, id, uid);
        registrarAchados(uid, turno.correcoes, { origem: 'conversa', cenario: c.cenario }, h);
      });
      const conq = [];
      if (msgs.filter(m => m.papel === 'aluno').length >= 3 && conquistar(uid, 'primeira-conversa')) conq.push('primeira-conversa');
      return { resposta: turno.resposta, correcoes: turno.correcoes, encerrar: !!turno.encerrar, modo: turno.modo, aviso, conquistas: conq };
    } finally { emAndamento.delete(chave); }
  });
  rota('POST', '/conversas/:id/encerrar', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id);
    const c = q('SELECT * FROM conversas WHERE id = ? AND user_id = ?').get(id, uid);
    if (!c) throw new ErroHttp(404, 'Conversa não encontrada.');
    if (!c.terminada_em) q('UPDATE conversas SET terminada_em = ? WHERE id = ? AND user_id = ?').run(agoraISO(), id, uid);
    const msgs = lerJson(c.mensagens, []);
    const falas = msgs.filter(m => m.papel === 'aluno');
    const correcoes = msgs.flatMap(m => m.correcoes || []).filter(x => x.tag && x.tag !== 'outro');
    const porTag = {};
    for (const x of correcoes) if (POR_TAG[x.tag]) (porTag[x.tag] ||= { tag: x.tag, nome: POR_TAG[x.tag].nome, exemplos: [] }).exemplos.push({ trecho: x.trecho, sugestao: x.sugestao });
    const minutos = Math.max(1, Math.min(60, Math.round((Date.parse(msgs[msgs.length - 1]?.em || agoraISO()) - Date.parse(c.iniciada_em)) / 60000)));
    const conq = falas.length ? somarMinutos(uid, h, minutos) : [];
    const pontos = Object.values(porTag);
    return {
      falas: falas.length, semAjuda: falas.filter(f => !f.ajuda).length, pontos,
      proximo: pontos.length ? `Sua próxima lição começa por "${pontos[0].nome}", com exercícios feitos a partir desta conversa. Daqui a uns dias, testamos numa situação nova.` : falas.length >= 3 ? 'Nenhum dos erros mais comuns apareceu nesta conversa. Muito bom! Continue praticando outros cenários.' : 'Conversa curta. Quando quiser, tente uma mais longa: é a melhor forma de achar o que treinar.',
      conquistas: conq,
    };
  });
  rota('DELETE', '/conversas/:id', (ctx) => {
    const r = q('DELETE FROM conversas WHERE id = ? AND user_id = ?').run(V.id(ctx.params.id), ctx.u.id);
    if (!r.changes) throw new ErroHttp(404, 'Conversa não encontrada.');
    return { ok: true };
  });

  // Tutor (dúvidas)
  rota('POST', '/tutor', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const pergunta = V.str(ctx.corpo.pergunta, 1000, { min: 2, campo: 'Pergunta' });
    const hist = Array.isArray(ctx.corpo.historico) ? ctx.corpo.historico.slice(-10).filter(m => m && typeof m.texto === 'string' && ['aluno', 'tutor'].includes(m.papel)).map(m => ({ papel: m.papel, texto: m.texto.slice(0, 1500) })) : [];
    const perm = podeIa(uid, 'tutor', h);
    if (perm.pode) {
      try {
        const r = await ia.tutor({ pergunta, perfil: perfilDe(uid), nivel: nivelamentoDe(uid)?.nivel, historico: hist });
        contarIa(uid, 'tutor', h, r.uso);
        return { resposta: r.resposta, modo: 'ia' };
      } catch (e) { console.error('[ia] tutor falhou:', e.message); }
    }
    // sem IA: procura no catálogo de dificuldades
    const termos = normalizar(pergunta).split(' ').filter(t => t.length >= 3);
    const pontua = d => { const alvo = normalizar([d.nome, d.regra, d.tag.replace(/-/g, ' '), d.contraste.pt, d.contraste.en, ...d.abordagens.exemplos].join(' ')); return termos.filter(t => alvo.includes(t)).length; };
    const melhor = DIFICULDADES.map(d => [d, pontua(d)]).sort((a, b) => b[1] - a[1])[0];
    const aviso = avisoIa(perm.pode ? 'erro' : perm.motivo);
    if (melhor && melhor[1] >= 1) {
      const d = melhor[0];
      return { modo: 'catalogo', aviso, resposta: `${d.nome}\n\n${d.regra}\n\nPortuguês: ${d.contraste.pt}\nInglês: ${d.contraste.en}\n${d.contraste.nota}\n\nExemplos:\n${d.abordagens.exemplos.slice(0, 3).map(e => '• ' + e).join('\n')}\n\nNão tenho certeza de que era exatamente isso que você perguntou. Sem o tutor de IA, eu respondo só sobre os pontos mais comuns.` };
    }
    return { modo: 'catalogo', aviso, resposta: `Sem o tutor de IA ativo, consigo explicar estes pontos comuns: ${DIFICULDADES.map(d => d.nome.toLowerCase()).join('; ')}. Tente perguntar usando uma dessas palavras.` };
  });

  // ---------- Perfil de aprendizagem e treino focado nas dificuldades ----------
  const ESTILOS = ['ler', 'escrever', 'ouvir', 'falar'];
  const estilosDe = uid => { const l = lerJson(q('SELECT estilos FROM perfis WHERE user_id = ?').get(uid)?.estilos, []); return Array.isArray(l) ? l.filter(e => ESTILOS.includes(e)) : []; };
  const cartoesPessoais = uid => q("SELECT id, frente, verso, nota_origem, origem, criado_em FROM cartoes WHERE user_id = ? AND tipo = 'erro' AND tag IS NULL AND frente LIKE 'Como dizer melhor:%' ORDER BY criado_em DESC LIMIT 40").all(uid);
  function dadosDeAprendizagem(uid) {
    const n = nivelamentoDe(uid), tent = tentativasDe(uid, 60), estilos = estilosDe(uid);
    const retr = APR.retrato(tent, n), difs = APR.dificuldades(tent, focosDe(uid)), pessoais = APR.errosPessoais(cartoesPessoais(uid));
    const vistos = {}; for (const t of tent) if (t.item_id) vistos[t.item_id] = { acertou: !!t.correto };
    return { n, tent, estilos, retr, difs, pessoais, vistos, pesos: APR.pesosDeModos(retr, estilos) };
  }
  function treinoResumo(uid, h) {
    const t = q('SELECT concluido_em, dados FROM treinos WHERE user_id = ? AND data = ?').get(uid, h);
    if (t) { const d = lerJson(t.dados, {}); return { pronto: true, concluido: !!t.concluido_em, quantos: (d.itens || []).length, tags: (d.tags || []).map(x => x.nome) }; }
    const { difs } = dadosDeAprendizagem(uid);
    return { pronto: false, concluido: false, quantos: 0, tags: difs.filter(d => d.status !== 'superada').slice(0, 2).map(d => d.nome) };
  }
  rota('GET', '/aprendizagem', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const d = dadosDeAprendizagem(uid);
    return {
      retrato: { modos: d.retr.modos, nivel: d.retr.nivel, total: d.retr.total }, percepcoes: APR.percepcoes(d.retr, d.estilos), pesos: d.pesos,
      dificuldades: d.difs.slice(0, 8), pessoais: d.pessoais.slice(0, 8), preferencias: { estilos: d.estilos },
      treino: treinoResumo(uid, h), ia: ia.ativo(),
    };
  });
  rota('PUT', '/aprendizagem/preferencias', (ctx) => {
    const l = ctx.corpo.estilos;
    if (!Array.isArray(l) || l.length > 4 || !l.every(e => ESTILOS.includes(e))) throw new ErroHttp(422, 'Escolha entre ler, escrever, ouvir e falar.');
    q('UPDATE perfis SET estilos = ? WHERE user_id = ?').run(JSON.stringify([...new Set(l)]), ctx.u.id);
    return { ok: true, estilos: [...new Set(l)] };
  });

  const treinoParaCliente = (row) => {
    const d = lerJson(row.dados, {});
    return { data: row.data, porque: d.porque || [], tags: d.tags || [], modos: d.modos || {}, pessoais: d.pessoais || 0, versao: d.versao || 0, modo: d.modo || 'catalogo',
      concluido: !!row.concluido_em, itens: exercicioParaCliente(d.itens || [], `treino:${uid0(row)}:${row.data}:${d.versao || 0}`), respondidos: lerJson(row.respondidos, {}) };
  };
  const uid0 = row => row.user_id;
  async function criarTreino(uid, h, versao) {
    const chave = 'treino' + uid;
    if (emAndamento.has(chave)) throw new ErroHttp(409, 'Estamos montando o seu treino. Tente de novo em instantes.');
    emAndamento.add(chave);
    try {
      const d = dadosDeAprendizagem(uid), p = perfilDe(uid);
      let tags = d.difs.filter(x => x.status !== 'superada').slice(0, 3);
      if (!tags.length) {   // ainda sem dificuldades registradas: começa pelos pontos da missão de hoje
        const plano = planoDe(uid), m = plano ? missaoAtual(plano, competenciasDe(uid)) : null;
        tags = (POR_ID[m?.id]?.tags || []).filter(t => POR_TAG[t]).slice(0, 2).map(t => ({ tag: t, nome: POR_TAG[t].nome, erros: 0, total: 0, seu: null }));
      }
      if (!tags.length && !d.pessoais.length) throw new ErroHttp(422, 'Ainda não sei o que treinar com você. Faça a aula de hoje e uma conversa: o que travar vira treino.');
      // IA: frases novas, na área do aluno, sobre o erro real dele (só nas 2 principais, só se a cota deixar)
      const bancoIa = {};
      const perm = podeIa(uid, 'treino', h);
      if (perm.pode && tags.length) {
        await Promise.all(tags.slice(0, 2).map(async t => {
          try {
            const r = await ia.treinarTag({ nome: t.nome, regra: POR_TAG[t.tag].regra, erros: [t.seu, ...d.tent.filter(x => x.tag === t.tag && !x.correto && x.resposta && x.origem !== 'licao').slice(-3).map(x => x.resposta)].filter(Boolean), perfil: p, nivel: d.n?.nivel });
            contarIa(uid, 'treino', h, r.uso);
            const ok = validarExerciciosIa(r.exercicios, `tr-${t.tag}`, t.tag, 6);
            if (ok.length) bancoIa[t.tag] = ok;
          } catch (e) { console.error('[ia] treino falhou:', e.message); }
        }));
      }
      const quantos = (p.minutos_dia || 15) <= 10 ? 6 : (p.minutos_dia || 15) >= 20 ? 10 : 8;
      const m = APR.montarTreino({ tags, pessoais: d.pessoais, pesos: d.pesos, quantos, bancoIa, vistos: d.vistos, semente: `${uid}:${h}:${versao}` });
      if (m.itens.length < 3) throw new ErroHttp(422, 'Ainda tenho pouco material para o seu treino. Faça a aula de hoje e volte.');
      const dados = { itens: m.itens, modos: m.modos, tags: m.tags, pessoais: m.pessoais, versao, modo: Object.keys(bancoIa).length ? 'ia' : 'catalogo', porque: APR.explicarTreino({ difs: tags, pesos: d.pesos, retr: d.retr, estilos: d.estilos, pessoais: m.pessoais }) };
      q('DELETE FROM treinos WHERE user_id = ? AND data = ?').run(uid, h);
      q('INSERT INTO treinos (user_id, data, criado_em, dados) VALUES (?, ?, ?, ?)').run(uid, h, agoraISO(), JSON.stringify(dados));
      return q('SELECT * FROM treinos WHERE user_id = ? AND data = ?').get(uid, h);
    } finally { emAndamento.delete(chave); }
  }
  rota('GET', '/treino', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    exigirAcessoCompleto(uid, h);
    const row = q('SELECT * FROM treinos WHERE user_id = ? AND data = ?').get(uid, h) || await criarTreino(uid, h, 0);
    return { treino: treinoParaCliente(row), ia: ia.ativo() };
  });
  rota('POST', '/treino/novo', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    exigirAcessoCompleto(uid, h);
    const atual = q('SELECT dados FROM treinos WHERE user_id = ? AND data = ?').get(uid, h);
    const versao = (lerJson(atual?.dados, {}).versao || 0) + 1;
    if (versao > 3) throw new ErroHttp(429, 'Hoje já foram 3 treinos novos. Amanhã tem mais, com o que você errou hoje.');
    return { treino: treinoParaCliente(await criarTreino(uid, h, versao)) };
  });
  rota('POST', '/treino/responder', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), b = ctx.corpo;
    exigirAcessoCompleto(uid, h);
    const itemId = V.str(b.itemId, 20, { min: 1, campo: 'Item' });
    const resposta = V.str(b.resposta, 500, { campo: 'Resposta' });
    const row = q('SELECT * FROM treinos WHERE user_id = ? AND data = ?').get(uid, h);
    if (!row) throw new ErroHttp(404, 'Treino não encontrado.');
    const d = lerJson(row.dados, {}), ex = (d.itens || []).find(i => i.id === itemId);
    if (!ex) throw new ErroHttp(404, 'Exercício não encontrado.');
    const resp = lerJson(row.respondidos, {});
    if (resp[itemId]) return { ...resp[itemId], repetida: true };
    const r = corrigirExercicio(ex, resposta);
    transacao(db, () => {
      const atual = lerJson(q('SELECT respondidos FROM treinos WHERE id = ? AND user_id = ?').get(row.id, uid).respondidos, {});
      if (atual[itemId]) return;
      atual[itemId] = { correto: r.correto, quase: r.quase, esperado: r.esperado, explica: r.explica, achados: r.achados, resposta };
      q('UPDATE treinos SET respondidos = ? WHERE id = ? AND user_id = ?').run(JSON.stringify(atual), row.id, uid);
      registrarTentativa(uid, { item_id: String(ex._fonte || '').startsWith('pessoal:') ? null : ex._fonte, habilidade: ex.habilidade, tag: ex.tag, formato: ex.tipo === 'escolha' ? 'reconhecimento' : 'producao', modalidade: ex.tipo === 'ditado' ? 'audio' : 'texto', correto: r.correto, tempo_ms: b.tempoMs, dica: b.dica === true, origem: 'treino', contexto: 'treino', resposta });
      if (!r.correto && ex.tipo === 'traduzir') criarCartao(uid, { frente: ex.pt, verso: r.esperado, tipo: 'erro', origem: 'treino', tag: ex.tag, nota_origem: r.explica }, h);
      if (!r.correto && ex.tipo === 'lacuna' && ex.frase) criarCartao(uid, { frente: ex.frase, verso: ex.frase.replace('___', ex.resposta[0]), tipo: 'erro', origem: 'treino', tag: ex.tag, nota_origem: r.explica }, h);
    });
    return { correto: r.correto, quase: r.quase, esperado: r.esperado, explica: r.explica, achados: r.achados, textoAudio: ex.tipo === 'ditado' ? ex.audio : null };
  });
  rota('POST', '/treino/concluir', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    exigirAcessoCompleto(uid, h);
    const row = q('SELECT * FROM treinos WHERE user_id = ? AND data = ?').get(uid, h);
    if (!row) throw new ErroHttp(404, 'Treino não encontrado.');
    const d = lerJson(row.dados, {}), resp = lerJson(row.respondidos, {});
    const feitos = (d.itens || []).filter(i => resp[i.id]), certos = feitos.filter(i => resp[i.id].correto).length;
    const porTag = {};
    for (const i of feitos) { const nome = i.tag ? POR_TAG[i.tag]?.nome : 'Suas frases'; const x = (porTag[nome || 'Outros'] ||= { nome: nome || 'Outros', certos: 0, total: 0 }); x.total++; if (resp[i.id].correto) x.certos++; }
    const conq = [];
    if (!row.concluido_em) {
      q('UPDATE treinos SET concluido_em = ? WHERE id = ? AND user_id = ?').run(agoraISO(), row.id, uid);
      conq.push(...somarMinutos(uid, h, 5 + Math.min(8, feitos.length)));
      if (conquistar(uid, 'treino-1')) conq.push('treino-1');
      if (q('SELECT COUNT(*) n FROM treinos WHERE user_id = ? AND concluido_em IS NOT NULL').get(uid).n >= 7 && conquistar(uid, 'treino-7')) conq.push('treino-7');
    }
    return { ok: true, certos, total: (d.itens || []).length, feitos: feitos.length, porTag: Object.values(porTag), conquistas: conq };
  });

  // ---------- Estudo sob medida: prova, entrevista, viagem... com assuntos, mini-aulas e simulado ----------
  const estudoDe = (uid, id) => {
    const r = q('SELECT * FROM estudos WHERE id = ? AND user_id = ?').get(id, uid);
    if (!r) throw new ErroHttp(404, 'Estudo não encontrado.');
    return { ...r, assuntos: lerJson(r.assuntos, []), simulado: lerJson(r.simulado, null) };
  };
  const salvarEstudo = (uid, e) => q('UPDATE estudos SET assuntos = ?, simulado = ?, titulo = ?, data_alvo = ?, ativo = ? WHERE id = ? AND user_id = ?').run(JSON.stringify(e.assuntos), e.simulado ? JSON.stringify(e.simulado) : null, e.titulo, e.data_alvo, e.ativo, e.id, uid);
  const assuntoDe = (e, aid) => { const a = e.assuntos.find(x => x.id === aid); if (!a) throw new ErroHttp(404, 'Assunto não encontrado.'); return a; };
  const exercicioParaCliente = (lista, semente) => paraCliente({ blocos: [{ exercicios: lista }] }, semente).blocos[0].exercicios;
  const estudoResumoDe = (e, h) => ({ id: e.id, titulo: e.titulo, tipo: e.tipo, data_alvo: e.data_alvo, ativo: !!e.ativo, progresso: estudoMotor.progresso(e.assuntos), ritmo: estudoMotor.ritmo(e, h) });
  function estudoResumo(uid, h) {
    const r = q('SELECT * FROM estudos WHERE user_id = ? AND ativo = 1 ORDER BY CASE WHEN data_alvo IS NULL OR data_alvo < ? THEN 1 ELSE 0 END, data_alvo, id DESC LIMIT 1').get(uid, h);
    if (!r) return null;
    return estudoResumoDe({ ...r, assuntos: lerJson(r.assuntos, []) }, h);
  }
  const assuntoParaCliente = (e, a) => {
    const c = a.conteudo;
    return { id: a.id, nome: a.nome, porque: a.porque, visto: !!a.visto_em, concluido: !!a.concluido_em, ...estudoMotor.acertosDe(a), temConteudo: !!c };
  };

  rota('GET', '/sobmedida', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const estudos = q('SELECT * FROM estudos WHERE user_id = ? ORDER BY ativo DESC, id DESC LIMIT 50').all(uid).map(r => estudoResumoDe({ ...r, assuntos: lerJson(r.assuntos, []) }, h));
    return { estudos, ia: ia.ativo() };
  });

  rota('POST', '/sobmedida', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), b = ctx.corpo;
    exigirAcessoCompleto(uid, h);
    const titulo = V.str(b.titulo, 80, { min: 3, campo: 'Nome do estudo' });
    const tipo = V.um(b.tipo, estudoMotor.TIPOS, 'Tipo');
    const data_alvo = V.data(b.data_alvo, 'Data');
    if (data_alvo && (data_alvo < h || diasEntre(h, data_alvo) > 400)) throw new ErroHttp(422, 'Data: escolha um dia de hoje até 400 dias à frente.');
    const descricao = V.str(b.descricao, 1500, { min: 10, campo: 'O que você precisa estudar' });
    const material = V.str(b.material, 8000, { campo: 'Material' });
    if (material && material.length < 80) throw new ErroHttp(422, 'Material: cole um trecho maior (pelo menos 80 caracteres) ou deixe em branco.');
    if (q('SELECT COUNT(*) n FROM estudos WHERE user_id = ? AND ativo = 1').get(uid).n >= 5) throw new ErroHttp(422, 'Você já tem 5 estudos em andamento. Encerre um para criar outro.');
    const chave = 'estcria' + uid;
    if (emAndamento.has(chave)) throw new ErroHttp(409, 'Já estamos montando um estudo.');
    emAndamento.add(chave);
    try {
      let lista = null, modo = 'regras', aviso = null;
      const perm = podeIa(uid, 'estudo', h);
      if (perm.pode) {
        try {
          const r = await ia.planejarEstudo({ titulo, tipo, descricao, material, diasRestantes: data_alvo ? diasEntre(h, data_alvo) : null, perfil: perfilDe(uid), nivel: nivelamentoDe(uid)?.nivel });
          contarIa(uid, 'estudo', h, r.uso);
          const ok = (r.assuntos || []).filter(a => a && typeof a.nome === 'string' && a.nome.trim().length >= 2).slice(0, estudoMotor.MAX_ASSUNTOS).map(a => ({ nome: a.nome.trim(), porque: typeof a.porque === 'string' ? a.porque.trim() : null }));
          if (ok.length >= 2) { lista = ok; modo = 'ia'; }
        } catch (e) { console.error('[ia] plano de estudo falhou:', e.message); aviso = avisoIa('erro'); }
      } else aviso = avisoIa(perm.motivo);
      if (!lista) lista = estudoMotor.dividirAssuntos(descricao);
      if (!lista.length) throw new ErroHttp(422, 'Não consegui separar assuntos. Escreva o que cai, um por linha ou separado por vírgula.');
      const assuntos = estudoMotor.montarAssuntos(lista);
      const r = q('INSERT INTO estudos (user_id, titulo, tipo, data_alvo, criado_em, descricao, material, assuntos, modo) VALUES (?,?,?,?,?,?,?,?,?)').run(uid, titulo, tipo, data_alvo, agoraISO(), descricao, material || null, JSON.stringify(assuntos), modo);
      return { id: Number(r.lastInsertRowid), modo, aviso };
    } finally { emAndamento.delete(chave); }
  });

  rota('GET', '/sobmedida/:id', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const e = estudoDe(uid, V.id(ctx.params.id));
    const sim = e.simulado;
    return { estudo: { ...estudoResumoDe(e, h), descricao: e.descricao, modo: e.modo, temMaterial: !!e.material, assuntos: e.assuntos.map(a => assuntoParaCliente(e, a)),
      simulado: { pode: e.assuntos.some(a => a.conteudo?.exercicios?.length && a.visto_em), feito: !!sim?.resultado, resultado: sim?.resultado || null, emAndamento: !!sim && !sim.resultado } }, ia: ia.ativo() };
  });

  rota('PATCH', '/sobmedida/:id', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), b = ctx.corpo;
    const e = estudoDe(uid, V.id(ctx.params.id));
    if (b.titulo !== undefined) e.titulo = V.str(b.titulo, 80, { min: 3, campo: 'Nome do estudo' });
    if (b.data_alvo !== undefined) {
      const d = V.data(b.data_alvo, 'Data');
      if (d && (d < h || diasEntre(h, d) > 400)) throw new ErroHttp(422, 'Data: escolha um dia de hoje até 400 dias à frente.');
      e.data_alvo = d;
    }
    if (b.ativo !== undefined) e.ativo = b.ativo ? 1 : 0;
    if (e.ativo && q('SELECT COUNT(*) n FROM estudos WHERE user_id = ? AND ativo = 1 AND id <> ?').get(uid, e.id).n >= 5) throw new ErroHttp(422, 'Você já tem 5 estudos em andamento.');
    salvarEstudo(uid, e);
    return { ok: true, estudo: estudoResumoDe(e, h) };
  });

  rota('DELETE', '/sobmedida/:id', (ctx) => {
    const r = q('DELETE FROM estudos WHERE id = ? AND user_id = ?').run(V.id(ctx.params.id), ctx.u.id);
    if (!r.changes) throw new ErroHttp(404, 'Estudo não encontrado.');
    return { ok: true };
  });

  // abre um assunto: na primeira vez monta a mini-aula (IA se a cota deixar, senão o catálogo e o texto do aluno)
  rota('GET', '/sobmedida/:id/assunto/:aid', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id);
    exigirAcessoCompleto(uid, h);
    let e = estudoDe(uid, id);
    let a = assuntoDe(e, V.str(ctx.params.aid, 8, { min: 2, campo: 'Assunto' }));
    let aviso = null;
    if (!a.conteudo) {
      const chave = `estass${uid}:${id}:${a.id}`;
      if (emAndamento.has(chave)) throw new ErroHttp(409, 'Estamos montando este assunto. Tente de novo em instantes.');
      emAndamento.add(chave);
      try {
        const nivel = nivelamentoDe(uid)?.nivel;
        let c = null;
        const perm = podeIa(uid, 'estudo', h);
        if (perm.pode) {
          try {
            const r = await ia.estudarAssunto({ assunto: a.nome, porque: a.porque, estudo: e, material: e.material, perfil: perfilDe(uid), nivel });
            contarIa(uid, 'estudo', h, r.uso);
            c = estudoMotor.conteudoDaIa(r, a, validarExerciciosIa);
          } catch (err) { console.error('[ia] assunto falhou:', err.message); aviso = avisoIa('erro'); }
        } else aviso = avisoIa(perm.motivo);
        if (!c) c = estudoMotor.conteudoOffline(a, e.material, nivel);
        e = estudoDe(uid, id); a = assuntoDe(e, a.id);     // recarrega: outra aba pode ter mexido
        a.conteudo = c || { fonte: 'vazio', modo: 'regras', exercicios: [], exemplos: [], vocab: [], dicas: [], explicacao: null };
        a.visto_em ||= agoraISO();
        salvarEstudo(uid, e);
      } finally { emAndamento.delete(chave); }
    } else if (!a.visto_em) { a.visto_em = agoraISO(); salvarEstudo(uid, e); }
    const c = a.conteudo;
    return { assunto: { ...assuntoParaCliente(e, a), fonte: c.fonte, modo: c.modo, explicacao: c.explicacao, exemplos: c.exemplos, vocab: c.vocab, dicas: c.dicas,
      exercicios: exercicioParaCliente(c.exercicios || [], `${uid}:${id}:${a.id}`), respondidos: a.respondidos },
      estudo: { id: e.id, titulo: e.titulo }, aviso: aviso || (c.fonte === 'vazio' ? 'Sem o tutor de IA não consigo montar este assunto do zero. Cole um texto sobre ele no estudo ou pergunte ao tutor.' : null) };
  });

  rota('POST', '/sobmedida/:id/assunto/:aid/responder', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id), b = ctx.corpo;
    exigirAcessoCompleto(uid, h);
    const itemId = V.str(b.itemId, 60, { min: 1, campo: 'Item' });
    const resposta = V.str(b.resposta, 500, { campo: 'Resposta' });
    const e0 = estudoDe(uid, id), a0 = assuntoDe(e0, V.str(ctx.params.aid, 8, { min: 2, campo: 'Assunto' }));
    const ex = acharExercicio({ blocos: [{ exercicios: a0.conteudo?.exercicios || [] }] }, itemId);
    if (!ex) throw new ErroHttp(404, 'Exercício não encontrado.');
    if (a0.respondidos[itemId]) return { ...a0.respondidos[itemId], repetida: true };
    const r = corrigirExercicio(ex, resposta);
    transacao(db, () => {
      const e = estudoDe(uid, id), a = assuntoDe(e, a0.id);
      if (a.respondidos[itemId]) return;
      a.respondidos[itemId] = { correto: r.correto, quase: r.quase, esperado: r.esperado, explica: r.explica, achados: r.achados, resposta };
      salvarEstudo(uid, e);
      registrarTentativa(uid, { item_id: `estudo:${id}:${itemId}`, habilidade: ex.habilidade, tag: ex.tag, formato: ex.tipo === 'escolha' ? 'reconhecimento' : 'producao', modalidade: 'texto', correto: r.correto, tempo_ms: b.tempoMs, dica: b.dica === true, origem: 'estudo', contexto: `estudo:${id}`, resposta });
      if (!r.correto && ex.tipo === 'traduzir') criarCartao(uid, { frente: ex.pt, verso: r.esperado, tipo: 'erro', origem: 'estudo', tag: ex.tag, nota_origem: r.explica }, h);
      if (!r.correto && ex.tipo === 'lacuna' && ex.frase) criarCartao(uid, { frente: ex.frase, verso: ex.frase.replace('___', ex.resposta[0]), tipo: 'erro', origem: 'estudo', tag: ex.tag, nota_origem: r.explica }, h);
    });
    return { correto: r.correto, quase: r.quase, esperado: r.esperado, explica: r.explica, achados: r.achados };
  });

  rota('POST', '/sobmedida/:id/assunto/:aid/concluir', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id);
    exigirAcessoCompleto(uid, h);
    const e = estudoDe(uid, id), a = assuntoDe(e, V.str(ctx.params.aid, 8, { min: 2, campo: 'Assunto' }));
    const conq = [];
    if (!a.concluido_em) {
      a.concluido_em = agoraISO();
      salvarEstudo(uid, e);
      conq.push(...somarMinutos(uid, h, 6 + Math.min(10, Object.keys(a.respondidos).length)));
      if (conquistar(uid, 'estudo-1')) conq.push('estudo-1');
      if (e.assuntos.every(x => x.concluido_em) && conquistar(uid, 'estudo-completo')) conq.push('estudo-completo');
    }
    const prox = e.assuntos.find(x => !x.concluido_em);
    return { ok: true, ...estudoMotor.acertosDe(a), proximo: prox ? { id: prox.id, nome: prox.nome } : null, progresso: estudoMotor.progresso(e.assuntos), conquistas: conq };
  });

  // simulado: as perguntas saem do que a pessoa já abriu; sem consulta; o resultado só no fim
  const simuladoParaCliente = (e, sim) => ({
    feito: !!sim.resultado, resultado: sim.resultado || null,
    itens: exercicioParaCliente(sim.itens.map(i => ({ ...i })), `sim:${e.id}:${sim.criado_em}`).map(i => ({ ...i, assunto: null })),
    detalhes: sim.resultado ? sim.detalhes : null,
  });
  rota('GET', '/sobmedida/:id/simulado', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id);
    exigirAcessoCompleto(uid, h);
    const e = estudoDe(uid, id);
    if (!e.simulado) {
      const itens = estudoMotor.montarSimulado(e.assuntos, `${uid}:${id}:${agoraISO()}`);
      if (itens.length < 3) throw new ErroHttp(422, 'Estude pelo menos um assunto antes: o simulado usa o que você já viu.');
      e.simulado = { criado_em: agoraISO(), itens, resultado: null };
      salvarEstudo(uid, e);
    }
    return { simulado: simuladoParaCliente(e, e.simulado), estudo: { id: e.id, titulo: e.titulo } };
  });
  rota('POST', '/sobmedida/:id/simulado/novo', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id);
    exigirAcessoCompleto(uid, h);
    const e = estudoDe(uid, id);
    const itens = estudoMotor.montarSimulado(e.assuntos, `${uid}:${id}:${agoraISO()}`);
    if (itens.length < 3) throw new ErroHttp(422, 'Estude pelo menos um assunto antes: o simulado usa o que você já viu.');
    e.simulado = { criado_em: agoraISO(), itens, resultado: null };
    salvarEstudo(uid, e);
    return { ok: true };
  });
  rota('POST', '/sobmedida/:id/simulado/enviar', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id);
    exigirAcessoCompleto(uid, h);
    const e = estudoDe(uid, id);
    if (!e.simulado) throw new ErroHttp(404, 'Simulado não encontrado.');
    if (e.simulado.resultado) return { resultado: e.simulado.resultado, detalhes: e.simulado.detalhes, repetida: true };
    const resp = ctx.corpo.respostas;
    if (!resp || typeof resp !== 'object' || Array.isArray(resp)) throw new ErroHttp(422, 'Respostas inválidas.');
    const correcoes = {}, detalhes = [];
    for (const it of e.simulado.itens) {
      const texto = typeof resp[it.id] === 'string' ? resp[it.id].replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, 500) : '';
      const r = texto ? corrigirExercicio(it, texto) : { correto: false, quase: false, esperado: respostaDe(it), explica: it.explica || null, achados: [] };
      correcoes[it.id] = r;
      detalhes.push({ id: it.id, assunto: e.assuntos.find(a => a.id === it._assunto)?.nome || '', correto: r.correto, sua: texto, esperado: r.esperado, explica: r.explica });
    }
    const resultado = estudoMotor.resultadoSimulado(e.simulado.itens, correcoes, e.assuntos);
    transacao(db, () => {
      e.simulado.resultado = { ...resultado, em: agoraISO() }; e.simulado.detalhes = detalhes;
      salvarEstudo(uid, e);
      for (const it of e.simulado.itens) {
        const c = correcoes[it.id];
        registrarTentativa(uid, { item_id: `simulado:${id}:${it.original}`, habilidade: it.habilidade, tag: it.tag, formato: it.tipo === 'escolha' ? 'reconhecimento' : 'producao', modalidade: 'texto', correto: !!c.correto, origem: 'simulado', contexto: `estudo:${id}`, resposta: detalhes.find(d => d.id === it.id)?.sua || null });
        if (!c.correto && it.tipo === 'traduzir') criarCartao(uid, { frente: it.pt, verso: c.esperado, tipo: 'erro', origem: 'simulado', tag: it.tag, nota_origem: c.explica }, h);
        if (!c.correto && it.tipo === 'lacuna' && it.frase) criarCartao(uid, { frente: it.frase, verso: it.frase.replace('___', it.resposta[0]), tipo: 'erro', origem: 'simulado', tag: it.tag, nota_origem: c.explica }, h);
      }
    });
    const conq = somarMinutos(uid, h, 8);
    if (conquistar(uid, 'simulado-1')) conq.push('simulado-1');
    return { resultado: e.simulado.resultado, detalhes, conquistas: conq };
  });

  // ---------- Rádio Tuiuiú: um episódio por dia com os tropeços do aluno ----------
  function tropecosDe(uid, h) {
    const desde = somarDias(h, -21);
    return radio.coletarTropecos({
      focos: q('SELECT tag, trecho, correcao, origem, criado_em, status FROM focos WHERE user_id = ? AND criado_em >= ? ORDER BY criado_em DESC LIMIT 50').all(uid, desde),
      tentativas: q('SELECT tag, correto, em, origem, resposta FROM tentativas WHERE user_id = ? AND correto = 0 AND tag IS NOT NULL AND em >= ? ORDER BY em DESC LIMIT 300').all(uid, desde),
    }, h);
  }
  function radioResumo(uid, h) {
    const ep = q('SELECT dados, ouvido_em FROM podcasts WHERE user_id = ? AND data = ?').get(uid, h);
    if (ep) { const d = lerJson(ep.dados, {}); return { pronto: true, titulo: d.titulo, minutos: d.minutos, ouvido: !!ep.ouvido_em, tropecos: (d.tropecos || []).length }; }
    return { pronto: false, tropecos: tropecosDe(uid, h).length };
  }
  const episodioParaCliente = (ep) => {
    const d = lerJson(ep.dados, {});
    return { data: ep.data, titulo: d.titulo, minutos: d.minutos, modo: d.modo, tropecos: d.tropecos, falas: d.falas, ouvido: !!ep.ouvido_em,
      treino: paraCliente({ blocos: [{ exercicios: d.treino || [] }] }, `radio:${ep.data}`).blocos[0].exercicios, respondidos: lerJson(ep.respondidos, {}) };
  };
  rota('GET', '/podcast', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    exigirAcessoCompleto(uid, h);
    const existe = q('SELECT * FROM podcasts WHERE user_id = ? AND data = ?').get(uid, h);
    if (existe) return { episodio: episodioParaCliente(existe) };
    const chave = 'radio' + uid;
    if (emAndamento.has(chave)) throw new ErroHttp(409, 'O episódio está sendo preparado. Tente de novo em instantes.');
    emAndamento.add(chave);
    try {
      const tropecos = tropecosDe(uid, h);
      const plano = planoDe(uid);
      const missao = plano ? missaoAtual(plano, competenciasDe(uid)) : null;
      const nome = ctx.u.nome.split(' ')[0];
      let falasIa = null, aviso = null;
      if (tropecos.length) {
        const perm = podeIa(uid, 'podcast', h);
        if (perm.pode) {
          try {
            const r = await ia.podcast({ tropecos, perfil: perfilDe(uid), nivel: nivelamentoDe(uid)?.nivel, nome });
            contarIa(uid, 'podcast', h, r.uso);
            falasIa = radio.validarFalasIa(r.falas);
          } catch (e) { console.error('[ia] podcast falhou:', e.message); }
        } else if (perm.motivo !== 'sem_ia') aviso = avisoIa(perm.motivo);
      }
      const ep = radio.montarEpisodio({ tropecos, missao, nome, falasIa });
      q('INSERT OR IGNORE INTO podcasts (user_id, data, criado_em, dados) VALUES (?, ?, ?, ?)').run(uid, h, agoraISO(), JSON.stringify(ep));
      return { episodio: episodioParaCliente(q('SELECT * FROM podcasts WHERE user_id = ? AND data = ?').get(uid, h)), aviso };
    } finally { emAndamento.delete(chave); }
  });
  rota('POST', '/podcast/responder', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), b = ctx.corpo;
    exigirAcessoCompleto(uid, h);
    const itemId = V.str(b.itemId, 80, { min: 1, campo: 'Item' });
    const resposta = V.str(b.resposta, 500, { campo: 'Resposta' });
    const ep = q('SELECT * FROM podcasts WHERE user_id = ? AND data = ?').get(uid, h);
    if (!ep) throw new ErroHttp(404, 'Episódio não encontrado.');
    const ex = acharExercicio({ blocos: [{ exercicios: lerJson(ep.dados, {}).treino || [] }] }, itemId);
    if (!ex) throw new ErroHttp(404, 'Exercício não encontrado.');
    const resp = lerJson(ep.respondidos, {});
    if (resp[itemId]) return { ...resp[itemId], repetida: true };
    const r = corrigirExercicio(ex, resposta);
    transacao(db, () => {
      const atual = lerJson(q('SELECT respondidos FROM podcasts WHERE id = ? AND user_id = ?').get(ep.id, uid).respondidos, {});
      if (atual[itemId]) return;
      atual[itemId] = { correto: r.correto, quase: r.quase, esperado: r.esperado, explica: r.explica, achados: r.achados, resposta };
      q('UPDATE podcasts SET respondidos = ? WHERE id = ? AND user_id = ?').run(JSON.stringify(atual), ep.id, uid);
      registrarTentativa(uid, { item_id: itemId, missao: ex.missao || null, habilidade: ex.habilidade, tag: ex.tag, formato: ex.tipo === 'escolha' ? 'reconhecimento' : 'producao', modalidade: 'texto', correto: r.correto, tempo_ms: b.tempoMs, dica: b.dica === true, origem: 'podcast', contexto: 'radio', resposta });
    });
    return { correto: r.correto, quase: r.quase, esperado: r.esperado, explica: r.explica, achados: r.achados };
  });
  // ouviu o episódio até o fim: conta como dia de estudo (e pode render figurinha de sequência)
  rota('POST', '/podcast/ouvido', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const ep = q('SELECT id, dados, ouvido_em FROM podcasts WHERE user_id = ? AND data = ?').get(uid, h);
    if (!ep) throw new ErroHttp(404, 'Episódio não encontrado.');
    if (ep.ouvido_em) return { ok: true, conquistas: [] };
    const minutos = Math.min(10, lerJson(ep.dados, {}).minutos || 2);
    q('UPDATE podcasts SET ouvido_em = ? WHERE id = ? AND user_id = ?').run(agoraISO(), ep.id, uid);
    const conq = somarMinutos(uid, h, minutos);
    if (conquistar(uid, 'radio')) conq.push('radio');
    return { ok: true, conquistas: conq, sequencia: sequenciaDe(uid, h) };
  });

  // Materiais do aluno
  rota('GET', '/materiais', (ctx) => ({ materiais: q('SELECT id, titulo, criado_em FROM materiais WHERE user_id = ? ORDER BY id DESC LIMIT 100').all(ctx.u.id) }));
  const materialParaCliente = (m) => {
    const g = lerJson(m.gerado, {});
    return { id: m.id, titulo: m.titulo, criado_em: m.criado_em, texto: m.texto, ...g,
      exercicios: (g.exercicios || []).map(e => ({ id: e.id, tipo: e.tipo, frase: e.frase, dica: e.dica || null })),
      compreensao: (g.compreensao || []).map(c => ({ id: c.id, pergunta: c.pergunta, opcoes: c.opcoes })) };
  };
  rota('GET', '/materiais/:id', (ctx) => {
    const m = q('SELECT * FROM materiais WHERE id = ? AND user_id = ?').get(V.id(ctx.params.id), ctx.u.id);
    if (!m) throw new ErroHttp(404, 'Material não encontrado.');
    return { material: materialParaCliente(m) };
  });
  rota('POST', '/materiais', async (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    exigirAcessoCompleto(uid, h);
    const titulo = V.str(ctx.corpo.titulo, 120, { min: 2, campo: 'Título' });
    const texto = V.str(ctx.corpo.texto, 8000, { min: 80, campo: 'Texto' });
    const chave = 'mat' + uid;
    if (emAndamento.has(chave)) throw new ErroHttp(409, 'Já estamos preparando um material.');
    emAndamento.add(chave);
    try {
      const n = nivelamentoDe(uid);
      let gerado, aviso = null;
      const perm = podeIa(uid, 'material', h);
      if (perm.pode) {
        try {
          const r = await ia.processarMaterial({ titulo, texto, perfil: perfilDe(uid), nivel: n?.nivel });
          contarIa(uid, 'material', h, r.uso);
          gerado = {
            tipo: r.tipo, resumo: r.resumo, resumo_pt: r.resumo_pt, vocab: r.vocab.slice(0, 14), dialogo: r.dialogo.slice(0, 14), simulacao: r.simulacao.slice(0, 6), audio: [], modo: 'ia',
            exercicios: r.exercicios.slice(0, 6).filter(e => e.frase.includes('___')).map((e, i) => ({ id: 'mat:' + i, tipo: 'lacuna', frase: e.frase, resposta: [e.resposta], dica: e.dica })),
            compreensao: r.compreensao.slice(0, 4).filter(c => c.opcoes.length >= 2 && c.correta >= 0 && c.correta < c.opcoes.length).map((c, i) => ({ id: 'comp:' + i, pergunta: c.pergunta, opcoes: embaralhar(c.opcoes, `${uid}:${i}:${titulo}`), resposta: c.opcoes[c.correta] })),
          };
        } catch (e) { console.error('[ia] material falhou:', e.message); aviso = avisoIa('erro'); }
      } else aviso = avisoIa(perm.motivo);
      if (!gerado) gerado = processarOffline(titulo, texto, { nivel: n?.nivel });
      const r = q('INSERT INTO materiais (user_id, titulo, texto, gerado, criado_em) VALUES (?, ?, ?, ?, ?)').run(uid, titulo, texto, JSON.stringify(gerado), agoraISO());
      const conq = conquistar(uid, 'material') ? ['material'] : [];
      return { id: Number(r.lastInsertRowid), aviso, conquistas: conq };
    } finally { emAndamento.delete(chave); }
  });
  rota('POST', '/materiais/:id/responder', (ctx) => {
    const uid = ctx.u.id, id = V.id(ctx.params.id);
    const m = q('SELECT gerado FROM materiais WHERE id = ? AND user_id = ?').get(id, uid);
    if (!m) throw new ErroHttp(404, 'Material não encontrado.');
    const g = lerJson(m.gerado, {});
    const itemId = V.str(ctx.corpo.itemId, 20, { min: 1, campo: 'Item' });
    const resposta = V.str(ctx.corpo.resposta, 300, { campo: 'Resposta' });
    const ex = (g.exercicios || []).find(e => e.id === itemId);
    if (ex) {
      const r = corrigirExercicio({ ...ex, tipo: 'lacuna' }, resposta);
      registrarTentativa(uid, { item_id: 'material:' + id + ':' + itemId, habilidade: 'vocabulario', formato: 'producao', correto: r.correto, origem: 'material', contexto: 'material:' + id, resposta });
      return { correto: r.correto, esperado: ex.resposta[0] };
    }
    const c = (g.compreensao || []).find(e => e.id === itemId);
    if (!c) throw new ErroHttp(404, 'Exercício não encontrado.');
    const ok = normalizar(resposta) === normalizar(c.resposta);
    registrarTentativa(uid, { item_id: 'material:' + id + ':' + itemId, habilidade: 'leitura', formato: 'reconhecimento', correto: ok, origem: 'material', contexto: 'material:' + id });
    return { correto: ok, esperado: c.resposta };
  });
  rota('POST', '/materiais/:id/cartoes', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid), id = V.id(ctx.params.id);
    const m = q('SELECT gerado FROM materiais WHERE id = ? AND user_id = ?').get(id, uid);
    if (!m) throw new ErroHttp(404, 'Material não encontrado.');
    const g = lerJson(m.gerado, {});
    if (!Array.isArray(ctx.corpo.indices) || ctx.corpo.indices.length > 20) throw new ErroHttp(422, 'Seleção inválida.');
    let n = 0;
    for (const i of ctx.corpo.indices) {
      const v = g.vocab?.[V.int(i, 0, 50, 'Índice')];
      if (v && criarCartao(uid, { frente: v.en, verso: v.pt || `(do seu material) ${v.ex}`, exemplo: v.ex, tipo: 'expressao', origem: 'material:' + id }, h)) n++;
    }
    return { criados: n };
  });
  rota('DELETE', '/materiais/:id', (ctx) => {
    const r = q('DELETE FROM materiais WHERE id = ? AND user_id = ?').run(V.id(ctx.params.id), ctx.u.id);
    if (!r.changes) throw new ErroHttp(404, 'Material não encontrado.');
    return { ok: true };
  });

  // Progresso
  rota('GET', '/progresso', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const n = nivelamentoDe(uid), plano = planoDe(uid), comp = competenciasDe(uid);
    const tent = tentativasDe(uid, 120);
    const hab = modelo.porHabilidade(tent, n);
    const dom = modelo.dominioPorTag(tent);
    const hipoteses = hipotesesDe(uid, h);
    const missoes = (plano?.missoes || []).map(m => ({ id: m.id, titulo: m.titulo, podeFazer: m.podeFazer, status: comp[m.id]?.status || 'nao_iniciada', partes: comp[m.id]?.partes || 0, total: licoesPorMissao(POR_ID[m.id], n?.nivel || 'A2'), demonstrado_em: comp[m.id]?.demonstrado_em || null, retido_em: comp[m.id]?.retido_em || null }));
    const melhorar = Object.entries(dom).filter(([t, d]) => POR_TAG[t] && d.total >= 2 && d.dominio < 0.7).sort((a, b) => a[1].dominio - b[1].dominio).slice(0, 4).map(([t, d]) => ({ tag: t, nome: POR_TAG[t].nome, dominio: Math.round(d.dominio * 100), tentativas: d.total }));
    const firmes = Object.entries(dom).filter(([t, d]) => POR_TAG[t] && d.total >= 4 && d.dominio >= 0.8).map(([t]) => POR_TAG[t].nome);
    const superados = q("SELECT tag, resolvido_em FROM focos WHERE user_id = ? AND status = 'superado' ORDER BY resolvido_em DESC LIMIT 10").all(uid).map(f => ({ nome: POR_TAG[f.tag]?.nome || f.tag, em: f.resolvido_em }));
    const amostras = q("SELECT id, em, missao, tarefa, texto, avaliacao, demonstrado, reteste FROM amostras WHERE user_id = ? AND tipo = 'escrita' ORDER BY em").all(uid).map(a => ({ ...a, avaliacao: lerJson(a.avaliacao, null) }));
    const comparacao = amostras.length >= 2 ? { primeira: amostras[0], ultima: amostras[amostras.length - 1] } : null;
    const mes = h.slice(0, 7);
    const dias = q('SELECT data, minutos FROM dias_estudo WHERE user_id = ? ORDER BY data DESC LIMIT 60').all(uid);
    const revisoes = revisoesDe(uid);
    const longas = revisoes.filter(r => r.intervalo_antes >= 6);
    return {
      nivel: n?.nivel || null, nivelamentoEm: n?.feito_em || null,
      habilidades: hab,
      concluido: {
        licoes: q("SELECT COUNT(*) n FROM licoes WHERE user_id = ? AND status = 'concluida'").get(uid).n,
        minutos: Math.round(q('SELECT COALESCE(SUM(minutos),0) s FROM dias_estudo WHERE user_id = ?').get(uid).s),
        diasNoMes: dias.filter(d => d.data.startsWith(mes)).length,
        revisoes: q('SELECT COUNT(*) n FROM revisoes WHERE user_id = ?').get(uid).n,
        conversas: q('SELECT COUNT(*) n FROM conversas WHERE user_id = ?').get(uid).n,
        cartoes: q('SELECT COUNT(*) n FROM cartoes WHERE user_id = ?').get(uid).n,
      },
      demonstrado: {
        missoes: missoes.filter(m => ['demonstrado', 'retido'].includes(m.status)),
        retidas: missoes.filter(m => m.status === 'retido'),
        superados, firmes,
        retencao: longas.length >= 5 ? Math.round(100 * longas.filter(r => r.nota >= 3).length / longas.length) : null,
      },
      missoes, melhorar, hipoteses, comparacao,
      proximas: missoes.filter(m => !['demonstrado', 'retido'].includes(m.status)).slice(0, 3),
      conquistas: q('SELECT codigo, em FROM conquistas WHERE user_id = ? ORDER BY em DESC').all(uid),
      dias: dias.slice(0, 35),
      objetivo: plano ? { nome: plano.objetivoNome, prazo: plano.prazo, metaRealista: plano.metaRealista, compromisso: plano.compromisso } : null,
    };
  });
  rota('POST', '/hipoteses/descartar', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const hip = V.str(ctx.corpo.id, 60, { min: 3, campo: 'Hipótese' });
    if (!/^[a-z-]+(?::[a-z-]+)?$/.test(hip)) throw new ErroHttp(422, 'Hipótese inválida.');
    q('INSERT INTO descartes (user_id, hipotese, ate) VALUES (?, ?, ?) ON CONFLICT(user_id, hipotese) DO UPDATE SET ate = excluded.ate').run(uid, hip, somarDias(h, 21));
    return { ok: true, mensagem: 'Combinado. Vamos deixar essa hipótese de lado por 3 semanas e ela só volta se as próximas atividades mostrarem o mesmo padrão.' };
  });
  rota('GET', '/amostras', (ctx) => ({ amostras: q('SELECT id, em, tipo, missao, tarefa, texto, avaliacao, demonstrado, reteste FROM amostras WHERE user_id = ? ORDER BY em DESC LIMIT 200').all(ctx.u.id).map(a => ({ ...a, avaliacao: lerJson(a.avaliacao, null) })) }));
  rota('DELETE', '/amostras/:id', (ctx) => {
    const r = q('DELETE FROM amostras WHERE id = ? AND user_id = ?').run(V.id(ctx.params.id), ctx.u.id);
    if (!r.changes) throw new ErroHttp(404, 'Amostra não encontrada.');
    return { ok: true };
  });

  // Assinatura
  rota('GET', '/assinatura', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const a = assinaturaDe(uid);
    return { estado: estadoAssinatura(uid, h), planos: assin.PLANOS, limites: assin.LIMITES, nomesUso: assin.NOMES_USO, inclui: assin.INCLUI, uso: usoMes(uid, h), historico: a?.historico || [], pagamento: process.env.PAGAMENTO_MODO || 'desligado', teste_ate: a?.teste_ate || null };
  });
  rota('POST', '/assinatura/assinar', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const plano = V.um(ctx.corpo.plano, Object.keys(assin.PLANOS), 'Plano');
    const modo = process.env.PAGAMENTO_MODO || 'desligado';
    if (modo !== 'simulado') throw new ErroHttp(503, 'O pagamento on-line ainda não está ligado. Nenhuma cobrança foi feita.');
    const a = assinaturaDe(uid) || assin.novaAssinatura(h);
    const nova = assin.assinar(a, plano, h);
    salvarAssinatura(uid, nova);
    return { ok: true, estado: estadoAssinatura(uid, h), simulado: true };
  });
  rota('POST', '/assinatura/cancelar', (ctx) => {
    const uid = ctx.u.id, h = hojeDe(uid);
    const a = assinaturaDe(uid);
    if (!a || a.status !== 'ativa') throw new ErroHttp(409, 'Não há assinatura ativa para cancelar.');
    salvarAssinatura(uid, assin.cancelar(a, h));
    return { ok: true, estado: estadoAssinatura(uid, h) };
  });

  // Privacidade e controle dos dados
  rota('GET', '/dados', (ctx) => {
    const uid = ctx.u.id;
    const conta = t => q(`SELECT COUNT(*) n FROM ${t} WHERE user_id = ?`).get(uid).n;
    return { contagem: { tentativas: conta('tentativas'), licoes: conta('licoes'), cartoes: conta('cartoes'), revisoes: conta('revisoes'), conversas: conta('conversas'), amostras: conta('amostras'), materiais: conta('materiais'), nivelamentos: conta('nivelamentos'), focos: conta('focos'), podcasts: conta('podcasts'), estudos: conta('estudos'), treinos: conta('treinos') }, ia: ia.ativo() };
  });
  rota('GET', '/dados/exportar', (ctx) => {
    const uid = ctx.u.id;
    const tudo = t => q(`SELECT * FROM ${t} WHERE user_id = ?`).all(uid);
    const u = q('SELECT nome, email, criado_em, consentiu_em FROM usuarios WHERE id = ?').get(uid);
    ctx.res.setHeader('Content-Disposition', `attachment; filename="inglou-meus-dados-${hojeDe(uid)}.json"`);
    return { exportadoEm: agoraISO(), turmas: { comoProfessor: q('SELECT id, nome, codigo, criado_em FROM turmas WHERE professor_id = ?').all(uid), comoAluno: q('SELECT turma_id, entrou_em FROM turma_alunos WHERE user_id = ?').all(uid), minhasRespostas: q('SELECT atividade_id, item_id, correto, tempo_ms, em, resposta FROM atividade_respostas WHERE user_id = ?').all(uid) }, conta: u, perfil: perfilDe(uid), assinatura: assinaturaDe(uid), nivelamentos: tudo('nivelamentos'), planos: tudo('planos'), licoes: tudo('licoes'), tentativas: tudo('tentativas'), cartoes: tudo('cartoes'), revisoes: tudo('revisoes'), conversas: tudo('conversas'), focos: tudo('focos'), amostras: tudo('amostras'), competencias: tudo('competencias'), materiais: tudo('materiais'), conquistas: tudo('conquistas'), uso_ia: tudo('uso_ia'), dias_estudo: tudo('dias_estudo'), podcasts: tudo('podcasts'), estudos: tudo('estudos'), treinos: tudo('treinos') };
  });
  const ESCOPOS = {
    respostas: ['tentativas', 'revisoes', 'focos', 'descartes', 'podcasts', 'treinos'],
    conversas: ['conversas'],
    amostras: ['amostras'],
    cartoes: ['cartoes', 'revisoes'],
    materiais: ['materiais'],
    estudos: ['estudos'],
    tudo: ['tentativas', 'revisoes', 'focos', 'descartes', 'conversas', 'amostras', 'cartoes', 'materiais', 'licoes', 'competencias', 'conquistas', 'dias_estudo', 'nivelamentos', 'planos', 'podcasts', 'estudos', 'treinos', 'atividade_respostas'],
  };
  rota('POST', '/dados/apagar', (ctx) => {
    const uid = ctx.u.id;
    const escopo = V.um(ctx.corpo.escopo, Object.keys(ESCOPOS), 'O que apagar');
    transacao(db, () => { for (const t of ESCOPOS[escopo]) q(`DELETE FROM ${t} WHERE user_id = ?`).run(uid); });
    return { ok: true, refazerNivelamento: escopo === 'tudo' };
  });
  rota('POST', '/conta/excluir', (ctx) => {
    const uid = ctx.u.id;
    const u = q('SELECT senha_hash FROM usuarios WHERE id = ?').get(uid);
    if (typeof ctx.corpo.senha !== 'string' || !auth.conferirSenha(ctx.corpo.senha, u.senha_hash)) throw new ErroHttp(401, 'Senha incorreta.');
    q('DELETE FROM usuarios WHERE id = ?').run(uid);   // ON DELETE CASCADE apaga todo o resto
    limparSessao(ctx.req, ctx.res);
    return { ok: true };
  });

  // Lembrete: arquivo de calendário (.ics) com evento recorrente. Funciona em qualquer celular, sem push.
  rota('GET', '/lembrete.ics', (ctx) => {
    const p = perfilDe(ctx.u.id);
    const l = p?.lembrete || {};
    const hora = /^\d{2}:\d{2}$/.test(l.hora || '') ? l.hora : '19:00';
    const dias = (Array.isArray(l.dias) && l.dias.length ? l.dias : [1, 2, 3, 4, 5]).map(d => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d]).filter(Boolean).join(',');
    const inicio = hojeDe(ctx.u.id).replace(/-/g, '') + 'T' + hora.replace(':', '') + '00';
    const site = (process.env.SITE_URL || '').replace(/[^\w:/.-]/g, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Inglou//Lembrete//PT', 'BEGIN:VEVENT', `UID:lembrete-${ctx.u.id}@inglou`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART;TZID=${fusoDe(p)}:${inicio}`, 'DURATION:PT15M', `RRULE:FREQ=WEEKLY;BYDAY=${dias}`, 'SUMMARY:Inglês: sua lição de hoje', `DESCRIPTION:${(p?.meta_diaria || 15)} minutos. Sem pressão: se não der hoje, amanhã tem mais.${site ? ' ' + site + '/app/' : ''}`, 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Hora do inglês', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    ctx.res.statusCode = 200;
    ctx.res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    ctx.res.setHeader('Content-Disposition', 'attachment; filename="lembrete-ingles.ics"');
    ctx.res.setHeader('Cache-Control', 'no-store');
    ctx.res.end(ics);
    return undefined;
  });

  // ---------- turmas (professor e aluno) ----------
  const turmasMod = require('./turmas').registrar({ db, rota, q, V, lerJson, transacao, agoraISO, hojeDe, registrarTentativa, somarMinutos });

  // ---------- despachante ----------
  async function tratar(req, res, url) {
    const caminho = url.pathname.slice('/api/v1'.length) || '/';
    const ctx = { req, res, ip: ip(req), params: {}, corpo: {} };
    if (!limGeral.tentar(ctx.ip)) return erro(res, 429, 'Muitas requisições. Aguarde um instante.');
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }   // sem CORS: só mesma origem
    const metodo = req.method === 'HEAD' ? 'GET' : req.method;
    let achou = null, metodoErrado = false;
    for (const r of rotas) {
      const m = caminho.match(r.re);
      if (!m) continue;
      if (r.metodo !== metodo) { metodoErrado = true; continue; }
      achou = r; ctx.params = m.groups || {}; break;
    }
    if (!achou) return erro(res, metodoErrado ? 405 : 404, metodoErrado ? 'Método não permitido.' : 'Não encontrado.');
    if (metodo !== 'GET') {
      // CSRF: cabeçalho próprio + origem igual + JSON. Formulário de outro site não consegue mandar nada disso.
      const origem = req.headers.origin;
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      if (req.headers['x-inglou'] !== '1') return erro(res, 403, 'Requisição recusada.');
      if (origem && (() => { try { return new URL(origem).host !== host; } catch { return true; } })()) return erro(res, 403, 'Requisição recusada.');
      const tipo = String(req.headers['content-type'] || '');
      if (req.headers['content-length'] !== '0' && tipo && !tipo.startsWith('application/json')) return erro(res, 403, 'Requisição recusada.');
      ctx.corpo = await lerCorpo(req);
    }
    ctx.u = usuarioDaSessao(req);
    if (!achou.publica && !ctx.u) return erro(res, 401, 'Faça login para continuar.');
    const out = await achou.fn(ctx);
    if (out !== undefined && !res.writableEnded) json(res, 200, out);
  }

  return { tratar };
}

module.exports = { criar };
