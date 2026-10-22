'use strict';
// Microunidades de USD: reserva conservadora antes de cada chamada externa, compartilhada entre réplicas.
const {AsyncLocalStorage}=require('node:async_hooks');
const {transacao}=require('./db');
const {ErroHttp}=require('./http');
const contexto=new AsyncLocalStorage();
const PRECO_IA={'claude-haiku-5-5':[.2,.5],'claude-sonnet-5-5':[4,10],'claude-opus-5-5':[8,20]};
function custoMaximoIA(modelo,params){const preco=PRECO_IA[modelo];if(!preco)throw new ErroHttp(429,'Este modelo de IA aguarda configuração de custo. A prática sem IA continua disponível.');const bytes=Buffer.byteLength(JSON.stringify(params),'utf8');if(bytes>100000)throw new ErroHttp(429,'Este pedido é longo demais. Divida seu material em partes menores.');return Math.ceil((bytes+4096)*preco[0]+params.max_tokens*preco[1]);}
function criarOrcamento({db,contaDe,hojeDe,env=process.env}){
 const q=s=>db.prepare(s),numero=(s,d)=>s!==undefined&&String(s).trim()!==''&&Number.isFinite(Number(s))&&Number(s)>=0?Number(s):d;
 function usar(uid,tipo,quantidade){
  if(!['ia','voz'].includes(tipo)||!Number.isSafeInteger(quantidade)||quantidade<0)throw new Error('Reserva inválida');
  const c=contaDe(uid),mes=hojeDe(c.owner).slice(0,7),limites={ia:c.plano.orcamentoIA,geracoes:c.plano.ia,voz:c.plano.voz};
  return transacao(db,()=>{
   const atual=t=>q('SELECT qtd FROM consumo_planos WHERE owner_id=? AND mes=? AND tipo=?').get(c.owner,mes,t)?.qtd||0;
   const global=t=>q('SELECT qtd FROM consumo_global WHERE mes=? AND tipo=?').get(mes,t)?.qtd||0;
   const limiteGlobal=tipo==='ia'?Math.floor(numero(env.IA_ORCAMENTO_GLOBAL_USD,10)*1e6):tipo==='voz'?Math.floor(numero(env.VOZ_ORCAMENTO_GLOBAL_USD,5)/.08*1000):Infinity;
   if(atual(tipo)+quantidade>limites[tipo]||global(tipo)+quantidade>limiteGlobal||tipo==='ia'&&atual('geracoes')>=limites.geracoes)throw new ErroHttp(429,tipo==='voz'?'Sua cota de novos áudios foi atingida. Áudios já preparados e textos continuam disponíveis.':'A cota de geração com IA foi atingida. Continue com o conteúdo e a prática sem IA.');
   const gravar=(t,n)=>q('INSERT INTO consumo_planos(owner_id,mes,tipo,qtd) VALUES(?,?,?,?) ON CONFLICT(owner_id,mes,tipo) DO UPDATE SET qtd=qtd+excluded.qtd').run(c.owner,mes,t,n);
   gravar(tipo,quantidade);q('INSERT INTO consumo_global(mes,tipo,qtd) VALUES(?,?,?) ON CONFLICT(mes,tipo) DO UPDATE SET qtd=qtd+excluded.qtd').run(mes,tipo,quantidade);if(tipo==='ia')gravar('geracoes',1);
   return{owner:c.owner,mes,tipo,quantidade};
  });
 }
 function concluir(r,real){if(!Number.isSafeInteger(real)||real<0)return;const diferenca=real-r.quantidade;if(diferenca)transacao(db,()=>{q('UPDATE consumo_planos SET qtd=MAX(0,qtd+?) WHERE owner_id=? AND mes=? AND tipo=?').run(diferenca,r.owner,r.mes,r.tipo);q('UPDATE consumo_global SET qtd=MAX(0,qtd+?) WHERE mes=? AND tipo=?').run(diferenca,r.mes,r.tipo);});}
 function uso(uid){const c=contaDe(uid);return Object.fromEntries(q('SELECT tipo,qtd FROM consumo_planos WHERE owner_id=? AND mes=?').all(c.owner,hojeDe(c.owner).slice(0,7)).map(r=>[r.tipo,r.qtd]));}
 return{usar,concluir,uso,executar:(uid,fn)=>contexto.run({uid,usar,concluir},fn)};
}
function reservarIA(modelo,params){const c=contexto.getStore();if(!c){if(process.env.NODE_ENV==='production')throw new ErroHttp(429,'A IA está temporariamente indisponível.');return null;}return{contexto:c,reserva:c.usar(c.uid,'ia',custoMaximoIA(modelo,params))};}
function concluirIA(r,resp){if(!r)return;const p=PRECO_IA[resp.model];if(!p)return;const u=resp.usage;if(!u||!Number.isSafeInteger(u.input_tokens)||!Number.isSafeInteger(u.output_tokens))return;const real=Math.ceil(((u.input_tokens||0)+(u.cache_creation_input_tokens||0)+(u.cache_read_input_tokens||0))*p[0]+(u.output_tokens||0)*p[1]);r.contexto.concluir(r.reserva,real);}
module.exports={criarOrcamento,custoMaximoIA,reservarIA,concluirIA};
