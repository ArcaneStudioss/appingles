'use strict';
const { ErroHttp } = require('./http');
const auth = require('./auth');
const { EXPRESSOES, POR_EXPRESSAO } = require('./conteudo/brasil-mundo');
const { TODOS_EXERCICIOS } = require('./conteudo/missoes');
const { UNIDADES, BANCO_BIBLIOTECA } = require('./conteudo/biblioteca');
const { publicoDe } = require('./motor/publico');
const ehAdmin = (uid, env = process.env) => (env.INGLOU_ADMIN_IDS || '').split(',').map(x => x.trim()).includes(String(uid));

function culturaRevisada(db, expressao) {
  const r = db.prepare('SELECT dados,revisado_em FROM edicoes_cultura WHERE referencia=? ORDER BY id DESC LIMIT 1').get(expressao.id);
  return r ? { ...expressao, ...JSON.parse(r.dados), revisadoEm: r.revisado_em.slice(0,10) } : expressao;
}
// Percentual do teto global de IA já reservado no mês; 80% ou mais pede ação (subir o teto ou rever planos).
function orcamentoUsadoPct(q, mes, env = process.env) {
  const limite = Number(env.IA_ORCAMENTO_GLOBAL_USD ?? 10) * 1e6;
  const usado = q("SELECT qtd FROM consumo_global WHERE mes=? AND tipo='ia'").get(mes)?.qtd || 0;
  return limite > 0 ? Math.round(usado / limite * 100) : 100;
}
function registrar({ db, rota, q, V, agoraISO, lerJson, perfilDe, conquistar, transacao }) {
  const limite = auth.limitadorBanco(db, 'relatos-conteudo', { janelaMs: 3600e3, max: 15 });
  const exigir = ctx => { if (!ehAdmin(ctx.u.id)) throw new ErroHttp(403, 'Área restrita à equipe autorizada.'); };
  rota('POST', '/conteudo/relatar', ctx => {
    const tipo = V.um(ctx.corpo.tipo, ['cultura','questao'], 'Tipo');
    const referencia = V.str(ctx.corpo.referencia, 100, { min: 1, campo: 'Conteúdo' });
    if (tipo === 'cultura' ? !POR_EXPRESSAO[referencia] : !TODOS_EXERCICIOS[referencia] && !BANCO_BIBLIOTECA[referencia] && !q('SELECT 1 FROM tentativas WHERE user_id=? AND item_id=?').get(ctx.u.id,referencia)) throw new ErroHttp(404,'Conteúdo não encontrado.');
    if (!limite.tentar('u'+ctx.u.id)) throw new ErroHttp(429,'Você já enviou vários relatos. Tente novamente mais tarde.');
    const motivo = V.str(ctx.corpo.motivo, 600, { min: 5, campo: 'O que precisa de revisão' });
    q('INSERT INTO relatos_conteudo(user_id,tipo,referencia,motivo,criado_em) VALUES(?,?,?,?,?)').run(ctx.u.id,tipo,referencia,motivo,agoraISO());
    return { ok:true, mensagem:'Relato enviado para revisão. Isso não altera automaticamente o conteúdo.' };
  });
  rota('GET', '/admin', ctx => {
    exigir(ctx);
    return { relatos:q('SELECT id,tipo,referencia,motivo,estado,criado_em,parecer FROM relatos_conteudo ORDER BY id DESC LIMIT 200').all(),
      cultura: EXPRESSOES.map(e => culturaRevisada(db,e)),
      metricas: {
        contas:q('SELECT COUNT(*) n FROM usuarios').get().n,
        sessoesConcluidas:q('SELECT COUNT(*) n FROM sessoes_guiadas WHERE concluida_em IS NOT NULL').get().n,
        alunosAtivos7dias:q("SELECT COUNT(DISTINCT user_id) n FROM dias_estudo WHERE data>=date('now','-7 days')").get().n,
        tarefasIndependentes:q('SELECT COUNT(*) n FROM amostras WHERE demonstrado=1').get().n,
        manutencoes:q("SELECT COUNT(*) n FROM competencias WHERE status='retido'").get().n,
        orcamentoIAUsadoPct:orcamentoUsadoPct(q,agoraISO().slice(0,7)),
        ia:q('SELECT mes,tipo,SUM(qtd) chamadas,SUM(tokens_entrada) entrada,SUM(tokens_saida) saida FROM uso_ia GROUP BY mes,tipo ORDER BY mes DESC LIMIT 40').all(),
        voz:q('SELECT dia,SUM(caracteres) caracteres FROM uso_voz GROUP BY dia ORDER BY dia DESC LIMIT 30').all(),
        diagnosticos:q('SELECT tipo,codigo,COUNT(*) total,ROUND(AVG(duracao_ms)) media_ms FROM diagnosticos GROUP BY tipo,codigo').all(),
      } };
  });
  rota('POST', '/admin/relatos/:id', ctx => {
    exigir(ctx);
    const estado=V.um(ctx.corpo.estado,['resolvido','descartado'],'Decisão'),parecer=V.str(ctx.corpo.parecer,600,{min:5,campo:'Parecer'});
    const r=q('UPDATE relatos_conteudo SET estado=?,parecer=?,revisado_em=?,revisor_id=? WHERE id=?').run(estado,parecer,agoraISO(),ctx.u.id,V.id(ctx.params.id));
    if(!r.changes)throw new ErroHttp(404,'Relato não encontrado.');return {ok:true};
  });
  rota('PUT', '/admin/cultura/:id', ctx => {
    exigir(ctx);
    if(!POR_EXPRESSAO[ctx.params.id])throw new ErroHttp(404,'Expressão não encontrada.');
    const b=ctx.corpo,edicao={};
    for(const campo of ['resumo','brasil','cuidado'])edicao[campo]=V.str(b[campo],2000,{min:5,campo});
    if(!Array.isArray(b.fontes)||!b.fontes.length||b.fontes.length>10)throw new ErroHttp(422,'Informe de uma a dez fontes.');
    edicao.fontes=b.fontes.map(f=>{const url=V.str(f.url,500,{min:8,campo:'URL da fonte'});let u;try{u=new URL(url);}catch{}if(!u||u.protocol!=='https:'||u.username||u.password)throw new ErroHttp(422,'Use uma fonte HTTPS válida.');return {url,titulo:V.str(f.titulo,150,{min:3,campo:'Título da fonte'})};});
    q('INSERT INTO edicoes_cultura(referencia,dados,revisor_id,revisado_em) VALUES(?,?,?,?)').run(ctx.params.id,JSON.stringify(edicao),ctx.u.id,agoraISO());
    return {ok:true};
  });
  rota('GET', '/passaporte', ctx => {
    const uid=ctx.u.id,faixa=publicoDe(perfilDe(uid)).id;
    return transacao(db,()=>({ missoes:UNIDADES.filter(u=>u.colecao==='brasil-mundo'&&u.faixa===faixa).map(u=>{
      const p=q('SELECT * FROM biblioteca_progressos WHERE user_id=? AND unidade_id=?').get(uid,u.id),r=lerJson(p?.respondidos,{});
      if(p?.concluido_em)conquistar(uid,'passaporte:'+u.id);
      return {id:u.id,titulo:u.titulo,nivel:u.nivel,imagem:u.imagem,tarefa:u.podeFazer||'Escolher como comunicar esta situação brasileira em inglês.',concluida:!!p?.concluido_em,feitas:Object.keys(r).length,total:u.exercicios.length,carimbo:p?.concluido_em||null,expressoes:u.cultura.map(id=>({id,titulo:POR_EXPRESSAO[id].titulo})),fontes:u.cultura.flatMap(id=>culturaRevisada(db,POR_EXPRESSAO[id]).fontes)};
    }) }));
  });
}
module.exports={registrar,ehAdmin,culturaRevisada};
