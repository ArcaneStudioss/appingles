'use strict';
const Stripe=require('stripe');
const {randomUUID}=require('node:crypto');
const {transacao,json:lerJson}=require('./db');
const {ErroHttp}=require('./http');
const {PLANOS,novaAssinatura}=require('./assinatura');
const {POR_PLANO}=require('./catalogo-planos');
const {precos}=require('./stripe-precos');
const EVENTOS=['checkout.session.completed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','invoice.paid','invoice.payment_failed','charge.refunded','charge.dispute.created','charge.dispute.closed'];
const id=o=>typeof o==='string'?o:o?.id;
const COBRAVEIS=['trialing','active','past_due','unpaid','incomplete','paused'];
function criarPagamento({db,grupos,hojeDe,env=process.env,cliente,agora=()=>Date.now()}){
 const q=s=>db.prepare(s),ids=precos(env),chave=env.STRIPE_SECRET_KEY||'';
 const stripe=cliente||(/^(?:sk|rk)_(?:test|live)_/.test(chave)?new Stripe(chave,{apiVersion:'2026-09-30.endive',maxNetworkRetries:1,timeout:20000}):null);
 const live=/(?:sk|rk)_live_/.test(chave),configurado=()=>!!(stripe&&env.STRIPE_WEBHOOK_SECRET),ativo=()=>env.PAGAMENTO_MODO==='stripe'&&configurado();
 const conta=uid=>q('SELECT * FROM stripe_contas WHERE user_id=?').get(uid);
 const assinatura=uid=>lerJson(q('SELECT dados FROM assinaturas WHERE user_id=?').get(uid)?.dados,null);
 function painel(uid){return{disponivel:ativo(),ambiente:live?'producao':'teste',planos:ativo()?Object.keys(ids).filter(s=>ids[s]):[],portal:!!(conta(uid)&&env.STRIPE_PORTAL_CONFIGURATION&&stripe),vinculada:!!conta(uid)?.subscription_id,cobranca:conta(uid)?.estado||null};}
 function exigir(){if(!ativo())throw new ErroHttp(503,'O pagamento on-line ainda não está disponível. Nenhuma cobrança foi feita.');}
 async function trava(uid,fn){
  const token=randomUUID();
  const entrou=transacao(db,()=>{q('DELETE FROM stripe_travas WHERE user_id=? AND ate<=?').run(uid,agora());return q('INSERT OR IGNORE INTO stripe_travas(user_id,token,ate) VALUES(?,?,?)').run(uid,token,agora()+600000).changes;});
  if(!entrou)throw new ErroHttp(503,'A cobrança está sendo atualizada. Aguarde alguns instantes e tente novamente.');
  try{return await fn();}finally{q('DELETE FROM stripe_travas WHERE user_id=? AND token=?').run(uid,token);}
 }
 function baseUrl(){let u;try{u=new URL(env.SITE_URL);}catch{throw new ErroHttp(503,'O endereço de retorno do pagamento não está configurado.');}if((u.protocol!=='https:'&&!(env.NODE_ENV==='test'&&u.hostname==='localhost'))||u.username||u.password)throw new ErroHttp(503,'Endereço de pagamento inválido.');return u.origin;}
 function skuDe(p){return Object.keys(ids).find(s=>ids[s]===id(p));}
 function validarPreco(p,sku,{novo=false}={}){
  const esperado=PLANOS[sku],intervalo=sku?.endsWith('_mensal')?'month':'year';
  if(!esperado||!p||p.livemode!==live||p.currency!=='brl'||p.type!=='recurring'||p.billing_scheme!=='per_unit'||p.unit_amount!==esperado.precoCentavos||p.recurring?.interval!==intervalo||p.recurring?.interval_count!==1||p.recurring?.usage_type!=='licensed'||p.transform_quantity||p.custom_unit_amount||(novo&&!p.active))throw new ErroHttp(503,'O preço deste plano aguarda conferência. Nenhuma cobrança foi feita.');
 }
 function vagas(uid,sku){
  if(grupos.contaDe(uid).owner!==uid)throw new ErroHttp(409,'Saia do plano compartilhado antes de contratar uma assinatura.');
  const n=1+q('SELECT COUNT(*) n FROM assinatura_membros WHERE owner_id=?').get(uid).n;
  if(n>(POR_PLANO[PLANOS[sku]?.categoria]?.pessoas||0))throw new ErroHttp(409,'Remova os participantes excedentes antes de mudar de plano.');
 }
 async function checkout(uid,sku){
  exigir();if(!Object.hasOwn(ids,sku)||!ids[sku])throw new ErroHttp(422,'Este plano ainda não está disponível para contratação.');
  return trava(uid,async()=>{
   if(q('SELECT excluindo_em FROM usuarios WHERE id=?').get(uid)?.excluindo_em)throw new ErroHttp(409,'A exclusão desta conta está em andamento.');
   vagas(uid,sku);
   const idade=q('SELECT idade FROM perfis WHERE user_id=?').get(uid)?.idade;
   if(!Number.isInteger(idade)||idade<18)throw new ErroHttp(403,'A contratação precisa ser feita por uma pessoa maior de idade, na conta dela. Ela pode convidar você para o Família.');
   const p=await stripe.prices.retrieve(ids[sku],{expand:['product']});validarPreco(p,sku,{novo:true});
   if(!p.product||typeof p.product==='string'||p.product.deleted||!p.product.active)throw new ErroHttp(503,'Este produto aguarda conferência. Nenhuma cobrança foi feita.');
   let c=conta(uid);
   if(!c){const customer=await stripe.customers.create({metadata:{app:'inglou',user_id:String(uid)}},{idempotencyKey:'inglou-customer-v1:'+uid});q('INSERT INTO stripe_contas(user_id,customer_id) VALUES(?,?)').run(uid,customer.id);c=conta(uid);}
   const existentes=await stripe.subscriptions.list({customer:c.customer_id,status:'all',limit:100});
   if(existentes.has_more||existentes.data.some(s=>COBRAVEIS.includes(s.status)))throw new ErroHttp(409,'Você já tem uma assinatura em andamento. Gerencie a cobrança antes de contratar outra.');
   grupos.prepararContratacao(uid);
   let r=q('SELECT * FROM stripe_checkouts WHERE user_id=?').get(uid);
   if(r?.session_id){const s=await stripe.checkout.sessions.retrieve(r.session_id);if(s.status==='complete')throw new ErroHttp(409,'Seu pagamento está sendo confirmado. Atualize sua conta em instantes.');if(s.status==='open'){if(r.plano!==sku)throw new ErroHttp(409,'Você tem um checkout aberto para outro plano. Aguarde a expiração antes de trocar.');return{url:s.url};}q('DELETE FROM stripe_checkouts WHERE user_id=?').run(uid);r=null;}
   if(r&&r.expira_em*1000<=agora()){q('DELETE FROM stripe_checkouts WHERE user_id=?').run(uid);r=null;}
   if(r&&r.plano!==sku)throw new ErroHttp(409,'Uma contratação está sendo preparada. Tente o mesmo plano novamente.');
   if(!r){
    const inicio=Math.floor(agora()/1000),retorno=baseUrl()+'/app/#/conta',a=assinatura(uid);
    const sub={metadata:{app:'inglou',user_id:String(uid)}};
    if(a?.status==='teste'&&a.teste_ate>=hojeDe(uid))sub.trial_end=Math.max(inicio+49*3600,Math.floor(Date.parse(a.teste_ate+'T23:59:59-03:00')/1000));
    const params={mode:'subscription',customer:c.customer_id,client_reference_id:String(uid),line_items:[{price:ids[sku],quantity:1}],payment_method_types:['card'],payment_method_collection:'always',locale:'pt-BR',success_url:retorno,cancel_url:retorno,subscription_data:sub,metadata:{app:'inglou',user_id:String(uid)},expires_at:inicio+3600};
    q('INSERT INTO stripe_checkouts(user_id,tentativa,plano,parametros,criado_em,expira_em) VALUES(?,?,?,?,?,?)').run(uid,randomUUID(),sku,JSON.stringify(params),inicio,inicio+3600);r=q('SELECT * FROM stripe_checkouts WHERE user_id=?').get(uid);
   }
   const s=await stripe.checkout.sessions.create(JSON.parse(r.parametros),{idempotencyKey:'inglou-checkout-v1:'+r.tentativa});
   if(!s.url||new URL(s.url).origin!=='https://checkout.stripe.com')throw new ErroHttp(503,'Não foi possível abrir o pagamento. Tente novamente.');
   q('UPDATE stripe_checkouts SET session_id=? WHERE user_id=?').run(s.id,uid);return{url:s.url};
  });
 }
 // Consulta atual, e não o snapshot do evento: notificações antigas nunca renovam um estado antigo.
 async function pagamentoSeguro(invoice){
  if(invoice.status!=='paid')return false;
  if(invoice.amount_paid===0)return true;
  const ps=await stripe.invoicePayments.list({invoice:invoice.id,status:'paid',limit:100});
  if(ps.has_more||!ps.data.length)return false;
  for(const p of ps.data){
   let charge;
   if(p.payment.type==='payment_intent'){const intent=await stripe.paymentIntents.retrieve(id(p.payment.payment_intent),{expand:['latest_charge']});charge=intent.latest_charge;}
   else if(p.payment.type==='charge')charge=p.payment.charge;
   else return false;
   if(typeof charge==='string')charge=await stripe.charges.retrieve(charge);
   if(!charge||charge.refunded||charge.amount_refunded>=charge.amount)return false;
   if(charge.disputed){const ds=await stripe.disputes.list({charge:charge.id,limit:100});if(ds.has_more||!ds.data.length||ds.data.some(d=>d.status!=='won'))return false;}
  }
  return true;
 }
 async function sincronizar(uid,subId){
  const c=conta(uid);if(!c)return;
  const sub=await stripe.subscriptions.retrieve(subId);
  if(id(sub.customer)!==c.customer_id||sub.livemode!==live||sub.metadata?.app!=='inglou'||sub.metadata?.user_id!==String(uid))throw new ErroHttp(409,'Vínculo de cobrança inválido.');
  if(c.subscription_id&&c.subscription_id!==sub.id){const atual=await stripe.subscriptions.retrieve(c.subscription_id);if(COBRAVEIS.includes(atual.status))return;}
  const itens=sub.items?.data||[],item=itens[0],sku=skuDe(item?.price);
  if(itens.length!==1||sub.items.has_more||item.quantity!==1||!sku)throw new ErroHttp(409,'A assinatura aguarda conferência do plano.');
  validarPreco(item.price,sku);
  let ate=c.subscription_id===sub.id?c.pago_ate:0,seguro=true;
  if(sub.status==='trialing')ate=sub.trial_end||0;
  else if(sub.status==='active'){
   const invoice=await stripe.invoices.retrieve(id(sub.latest_invoice));
   if(id(invoice.customer)!==c.customer_id||id(invoice.parent?.subscription_details?.subscription||invoice.subscription)!==sub.id)throw new ErroHttp(409,'Fatura não pertence à assinatura.');
   seguro=await pagamentoSeguro(invoice);
   if(seguro)ate=item.current_period_end||0;else ate=0;
  }else if(!['past_due','incomplete'].includes(sub.status))ate=0;
  // Reembolso total ou disputa afeta somente a fatura atual, nunca uma renovação posterior paga.
  if(['past_due','incomplete'].includes(sub.status)&&c.subscription_id!==sub.id)ate=0;
  const habilitada=ate>Math.floor(agora()/1000),anterior=assinatura(uid)||novaAssinatura(hojeDe(uid));
  const status=habilitada?(sub.cancel_at_period_end?'cancelada':'ativa'):'livre';
  const periodo=habilitada?new Date(ate*1000-1).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}):null;
  const mudanca=anterior.status!==status||anterior.plano!==sku||anterior.periodo_ate!==periodo;
  const historico=[...(anterior.historico||[])];if(mudanca)historico.push({em:hojeDe(uid),evento:habilitada?`Stripe: ${PLANOS[sku].nome}; acesso até ${periodo}`:'Stripe: acesso pago encerrado; seus dados foram preservados'});
  transacao(db,()=>{
   q('UPDATE stripe_contas SET subscription_id=?,estado=?,plano=?,pago_ate=?,atualizado_em=? WHERE user_id=?').run(sub.id,seguro?sub.status:'pagamento_em_revisao',sku,ate,new Date(agora()).toISOString(),uid);
   q('INSERT INTO assinaturas(user_id,dados) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET dados=excluded.dados').run(uid,JSON.stringify({...anterior,status,plano:sku,periodo_ate:periodo,cancelada_em:sub.cancel_at_period_end?hojeDe(uid):null,historico}));
  });
 }
 async function webhook(corpo,assinaturaHeader){
  if(!configurado())throw new ErroHttp(503,'Webhook de pagamento ainda não configurado.');
  let e;try{e=stripe.webhooks.constructEvent(corpo,assinaturaHeader,env.STRIPE_WEBHOOK_SECRET);}catch{throw new ErroHttp(400,'Assinatura do webhook inválida.');}
  if(e.livemode!==live)throw new ErroHttp(400,'Ambiente do webhook inválido.');
  if(!EVENTOS.includes(e.type))return{recebido:true,ignorado:true};
  if(q('SELECT 1 FROM stripe_eventos WHERE id=?').get(e.id))return{recebido:true,repetido:true};
  let o=e.data.object,customer=id(o.customer),subId;
  if(e.type.startsWith('charge.dispute.')){const ch=await stripe.charges.retrieve(id(o.charge));customer=id(ch.customer);}
  const c=customer?q('SELECT * FROM stripe_contas WHERE customer_id=?').get(customer):null;
  if(!c)return{recebido:true,ignorado:true};
  if(e.type.startsWith('customer.subscription.'))subId=o.id;
  else if(e.type.startsWith('checkout.session.'))subId=id(o.subscription);
  else if(e.type.startsWith('invoice.'))subId=id(o.parent?.subscription_details?.subscription||o.subscription);
  else subId=c.subscription_id;
  if(!subId)return{recebido:true,ignorado:true};
  return trava(c.user_id,async()=>{
   if(q('SELECT 1 FROM stripe_eventos WHERE id=?').get(e.id))return{recebido:true,repetido:true};
   await sincronizar(c.user_id,subId);
   q('INSERT OR IGNORE INTO stripe_eventos(id,tipo,processado_em) VALUES(?,?,?)').run(e.id,e.type,new Date(agora()).toISOString());return{recebido:true};
  });
 }
 async function cancelar(uid){
  const c=conta(uid);if(!c?.subscription_id)return false;if(!stripe)throw new ErroHttp(503,'O serviço de cobrança está indisponível.');
  // Definir o mesmo booleano é idempotente. Uma chave fixa reaproveitaria o cancelamento
  // anterior caso a pessoa reativasse a assinatura pelo portal e cancelasse novamente.
  return trava(uid,async()=>{await stripe.subscriptions.update(c.subscription_id,{cancel_at_period_end:true});await sincronizar(uid,c.subscription_id);return true;});
 }
 async function portal(uid){const c=conta(uid);if(!stripe||!c||!env.STRIPE_PORTAL_CONFIGURATION)throw new ErroHttp(503,'O portal de cobrança ainda não está disponível.');const s=await stripe.billingPortal.sessions.create({customer:c.customer_id,configuration:env.STRIPE_PORTAL_CONFIGURATION,return_url:baseUrl()+'/app/#/conta'});if(new URL(s.url).origin!=='https://billing.stripe.com')throw new ErroHttp(503,'Não foi possível abrir o portal.');return{url:s.url};}
 async function conferirExclusao(uid){
  const c=conta(uid);if(!c)return;if(!stripe)throw new ErroHttp(503,'Confirme o encerramento da cobrança antes de excluir sua conta.');
  return trava(uid,async()=>{
   const r=q('SELECT * FROM stripe_checkouts WHERE user_id=?').get(uid);
   if(r?.session_id){const s=await stripe.checkout.sessions.retrieve(r.session_id);if(s.status==='open')await stripe.checkout.sessions.expire(s.id);if(s.status==='complete'&&!c.subscription_id)throw new ErroHttp(409,'Aguarde a confirmação da cobrança antes de excluir a conta.');}
   if(r&&!r.session_id&&r.expira_em*1000>agora())throw new ErroHttp(409,'Aguarde a expiração do checkout antes de excluir a conta.');
   const subs=await stripe.subscriptions.list({customer:c.customer_id,status:'all',limit:100});
   if(subs.has_more||subs.data.some(s=>COBRAVEIS.includes(s.status)))throw new ErroHttp(409,'Antes de excluir a conta, finalize a assinatura no portal de cobrança e aguarde o fim do período. Seus dados podem ser exportados enquanto isso.');
  });
 }
 // Nunca propagar mensagens do SDK: erros de autenticação podem conter a chave.
 const seguro=fn=>async(...args)=>{try{return await fn(...args);}catch(e){if(e instanceof ErroHttp)throw e;throw new ErroHttp(503,'Não foi possível atualizar a cobrança agora. Tente novamente em instantes.');}};
 return{checkout:seguro(checkout),webhook:seguro(webhook),cancelar:seguro(cancelar),portal:seguro(portal),painel,ativo,conferirExclusao:seguro(conferirExclusao)};
}
async function lerWebhook(req){const partes=[];let tamanho=0;for await(const p of req){tamanho+=p.length;if(tamanho>256*1024)throw new ErroHttp(413,'Evento grande demais.');partes.push(p);}return Buffer.concat(partes);}
module.exports={criarPagamento,lerWebhook,EVENTOS};
