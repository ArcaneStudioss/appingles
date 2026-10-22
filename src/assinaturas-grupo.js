'use strict';
const {randomBytes}=require('node:crypto');
const {transacao,json}=require('./db');
const {ErroHttp}=require('./http');
const assin=require('./assinatura');
const {POR_PLANO,TESTE}=require('./catalogo-planos');
function criarGrupos({db,hojeDe,agoraISO=()=>new Date().toISOString()}){
 const q=s=>db.prepare(s),ler=uid=>json(q('SELECT dados FROM assinaturas WHERE user_id=?').get(uid)?.dados,null);
 function contaDe(uid){
  const pessoal=assin.estado(ler(uid),hojeDe(uid));
  const owner=q('SELECT owner_id FROM assinatura_membros WHERE user_id=?').get(uid)?.owner_id;
  if(owner){const est=assin.estado(ler(owner),hojeDe(owner));if(est.acesso==='completo'&&['familia','turma'].includes(est.categoria))return{owner,est,plano:POR_PLANO[est.categoria]};}
  return{owner:uid,est:pessoal,plano:pessoal.status==='teste'?TESTE:pessoal.acesso==='completo'?POR_PLANO[pessoal.categoria||'completo']:POR_PLANO.gratis};
 }
 function painel(uid){const c=contaDe(uid),dono=c.owner===uid;return{categoria:c.plano.id,pessoas:c.plano.pessoas,compartilhado:c.owner!==uid||c.plano.pessoas>1,responsavel:dono,ocupadas:c.plano.pessoas>1?1+q('SELECT COUNT(*) n FROM assinatura_membros WHERE owner_id=?').get(c.owner).n:1,membros:dono&&c.plano.pessoas>1?q('SELECT m.user_id id,u.nome FROM assinatura_membros m JOIN usuarios u ON u.id=m.user_id WHERE m.owner_id=? ORDER BY m.entrou_em').all(uid):[],codigo:dono&&c.plano.pessoas>1?q('SELECT codigo FROM assinatura_convites WHERE owner_id=?').get(uid)?.codigo||null:null};}
 function convite(uid){return transacao(db,()=>{const c=contaDe(uid);if(c.owner!==uid||c.plano.pessoas<2)throw new ErroHttp(403,'É necessário ser responsável por um plano Família ou Turma ativo.');const codigo=randomBytes(12).toString('hex');q('INSERT INTO assinatura_convites(owner_id,codigo,criado_em) VALUES(?,?,?) ON CONFLICT(owner_id) DO UPDATE SET codigo=excluded.codigo,criado_em=excluded.criado_em').run(uid,codigo,agoraISO());return{codigo,pessoas:c.plano.pessoas};});}
 function entrar(uid,codigo){return transacao(db,()=>{if(typeof codigo!=='string'||!/^[a-f0-9]{24}$/.test(codigo))throw new ErroHttp(422,'Confira o código do plano.');const owner=q('SELECT owner_id FROM assinatura_convites WHERE codigo=?').get(codigo)?.owner_id;if(!owner||owner===uid)throw new ErroHttp(404,'Convite não encontrado.');const c=contaDe(owner);if(c.owner!==owner||c.plano.pessoas<2)throw new ErroHttp(409,'Este plano não está disponível.');const atual=q('SELECT owner_id FROM assinatura_membros WHERE user_id=?').get(uid)?.owner_id;if(atual===owner)return{ok:true,repetida:true};if(atual)throw new ErroHttp(409,'Saia do seu grupo atual antes de entrar em outro.');const cobranca=q('SELECT estado FROM stripe_contas WHERE user_id=?').get(uid);if(cobranca&&['trialing','active','past_due','unpaid','incomplete','paused'].includes(cobranca.estado))throw new ErroHttp(409,'Finalize sua assinatura atual antes de aceitar o convite.');if(q('SELECT 1 FROM stripe_checkouts WHERE user_id=? AND expira_em>?').get(uid,Math.floor(Date.now()/1000)))throw new ErroHttp(409,'Aguarde a expiração do checkout antes de usar o convite.');const propria=assin.estado(ler(uid),hojeDe(uid));if(propria.status==='ativa'||propria.status==='cancelada')throw new ErroHttp(409,'Encerre sua assinatura individual antes de usar um convite.');if(q('SELECT 1 FROM assinatura_membros WHERE owner_id=?').get(uid))throw new ErroHttp(409,'Uma conta responsável por participantes não pode entrar em outro grupo.');const usadas=1+q('SELECT COUNT(*) n FROM assinatura_membros WHERE owner_id=?').get(owner).n;if(usadas>=c.plano.pessoas)throw new ErroHttp(409,'Todas as vagas deste plano estão ocupadas.');q('INSERT INTO assinatura_membros(user_id,owner_id,entrou_em) VALUES(?,?,?)').run(uid,owner,agoraISO());return{ok:true};});}
 function sair(uid){q('DELETE FROM assinatura_membros WHERE user_id=?').run(uid);return{ok:true};}
 function remover(uid,membro){if(!Number.isSafeInteger(membro)||membro===uid)throw new ErroHttp(422,'Participante inválido.');const c=contaDe(uid);if(c.owner!==uid||c.plano.pessoas<2)throw new ErroHttp(403,'Apenas o responsável pode remover participantes.');q('DELETE FROM assinatura_membros WHERE owner_id=? AND user_id=?').run(uid,membro);return{ok:true};}
 return{contaDe,painel,convite,entrar,sair,remover};
}
module.exports={criarGrupos};
