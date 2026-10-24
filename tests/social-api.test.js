'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process'),{DatabaseSync}=require('node:sqlite');
const {UNIDADES}=require('../src/conteudo/biblioteca');
const DIR=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-social-api-')),PORT=24000+Math.floor(Math.random()*700),BASE=`http://localhost:${PORT}/api/v1`;
let servidor,db;const users={};
async function R(quem,metodo,rota,corpo,semCsrf=false) {const r=await fetch(BASE+rota,{method:metodo,headers:{...(users[quem]?{Cookie:users[quem].cookie}:{}),...(metodo!=='GET'?{'Content-Type':'application/json',...(!semCsrf?{'X-Inglou':'1'}:{})}:{})},body:corpo?JSON.stringify(corpo):undefined});return {status:r.status,...await r.json()};}
before(async()=>{
 servidor=spawn(process.execPath,['--disable-warning=ExperimentalWarning','server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,NODE_ENV:'test',AUTH_PROVIDER:'local',DATA_DIR:DIR,PORT,BACKUP_DESLIGADO:'1',IA_FAKE:'1'},stdio:'ignore'});
 for(let i=0;i<60;i++){try{await fetch(BASE+'/auth/estado');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 for(const nome of ['a','b','c']){const r=await fetch(BASE+'/auth/cadastro',{method:'POST',headers:{'X-Inglou':'1','Content-Type':'application/json'},body:JSON.stringify({nome:'Pessoa '+nome,email:nome+'@social-api.test',senha:'girassol seguro na janela 2026',idade:16,papel:'aluno',responsavel:true,consentimento:true})});assert.equal(r.status,200);users[nome]={cookie:r.headers.get('set-cookie').split(';')[0]};users[nome].social=await R(nome,'GET','/social');}
 db=new DatabaseSync(path.join(DIR,'inglou.db'));for(const nome of ['a','b','c'])users[nome].id=db.prepare('SELECT id FROM usuarios WHERE email=?').get(nome+'@social-api.test').id;
});
after(()=>{db?.close();servidor?.kill();fs.rmSync(DIR,{recursive:true,force:true});});
test('social exige sessão e CSRF e não permite alterar saldo, XP, raridade ou consultar coleção de desconhecido',async()=>{
 assert.equal((await R(null,'GET','/social')).status,401);
 assert.equal((await R('a','POST','/social/amigos',{codigo:users.b.social.eu.codigo},true)).status,403);
 assert.equal((await R('a','GET',`/social/amigos/${users.b.id}/colecao`)).status,403);
 await R('a','PUT','/social/perfil',{apelido:'Novo apelido',saldo:99999,xp:99999});
 const p=await R('a','GET','/social');assert.equal(p.saldo,0);assert.equal(p.xp,0);assert.equal(p.eu.apelido,'Novo apelido');
 assert.doesNotMatch(JSON.stringify(p),/senha_hash|social-api.test|responsavel_em|auth_subject/);
 assert.equal((await R('a','POST','/social/loja/comprar',{produto:'caixa',chave:'pedido-invalido-01',preco:0,raridade:'lendaria'})).status,409);
});
test('amizade exige aceite do destinatário; desafio valida duração e escolhas pertencentes à pessoa correta',async()=>{
 assert.equal((await R('a','POST','/social/amigos',{codigo:users.b.social.eu.codigo})).status,200);
 assert.equal((await R('a','POST',`/social/amigos/${users.b.id}/responder`,{acao:'aceitar'})).status,404);
 assert.equal((await R('b','POST',`/social/amigos/${users.a.id}/responder`,{acao:'aceitar'})).status,200);
 const c=await R('a','GET',`/social/amigos/${users.b.id}/colecao`);assert.equal(c.status,200);
 assert.equal((await R('a','POST','/social/duelos',{amigoId:users.b.id,dias:999,figurinhaId:c.colecao[0].id})).status,422);
 assert.equal((await R('a','POST','/social/duelos',{amigoId:users.b.id,dias:2,figurinhaId:users.a.social.colecao[0].id})).status,403);
 assert.equal((await R('a','POST','/social/duelos',{amigoId:users.b.id,dias:2,figurinhaId:c.colecao[0].id})).status,403,'menores usam desafio sem transferência');
 const d=await R('a','POST','/social/duelos',{amigoId:users.b.id,dias:2});users.a.duelo=d.id;assert.equal(d.status,200);
 assert.equal((await R('c','POST',`/social/duelos/${d.id}/escolher`,{figurinhaId:users.a.social.colecao[0].id})).status,404);
 assert.equal((await R('b','POST',`/social/duelos/${d.id}/escolher`,{figurinhaId:users.a.social.colecao[0].id})).status,200);
 assert.equal((await R('b','POST',`/social/duelos/${d.id}/confirmar`)).status,409);
 assert.equal((await R('a','POST',`/social/duelos/${d.id}/confirmar`)).status,200);
});
test('resposta real da biblioteca ganha recompensa; envio duplicado concorrente e modo de treino não duplicam moedas nem XP',async()=>{
 const u=UNIDADES.find(u=>u.id==='adolescente-playlist'),e=u.exercicios[0];
 const respostas=await Promise.all(Array.from({length:8},()=>R('a','POST','/biblioteca/'+u.id+'/responder',{itemId:e.id,resposta:e.opcoes[e.resposta]})));
 assert.ok(respostas.every(r=>r.status===200));assert.equal(respostas.filter(r=>r.recompensa?.moedas===1).length,1);
 const carteira=await R('a','GET','/social');assert.equal(carteira.saldo,1);assert.equal(carteira.xp,10);assert.equal(carteira.duelos[0].placarCriador,1);
 const treino=await R('a','POST','/biblioteca/'+u.id+'/responder',{itemId:e.id,resposta:e.opcoes[e.resposta],treinar:true});assert.equal(treino.pratica,true);assert.equal(treino.recompensa,undefined);
 for(const ex of u.exercicios.slice(1)){const resposta=Array.isArray(ex.resposta)?ex.resposta[0]:ex.opcoes[ex.resposta];await R('a','POST','/biblioteca/'+u.id+'/responder',{itemId:ex.id,resposta});}
 const fim=await R('a','GET','/social');assert.equal(fim.saldo,5);assert.equal(fim.xp,75);assert.ok(fim.colecao.length>1);
});
test('compras simultâneas compartilham o saldo e aberturas repetidas entregam exatamente uma figurinha',async()=>{
 for(let i=0;i<20;i++)db.prepare('INSERT INTO tentativas(user_id,em,item_id,correto,dica,origem) VALUES(?,?,?,?,?,?)').run(users.b.id,new Date().toISOString(),'fixture'+i,1,0,'biblioteca');
 const compras=await Promise.all([R('b','POST','/social/loja/comprar',{produto:'caixa',chave:'comprar-caixa-unica-1'}),R('b','POST','/social/loja/comprar',{produto:'caixa',chave:'comprar-caixa-unica-2'})]);
 assert.deepEqual(compras.map(r=>r.status).sort(),[200,409]);
 const repetidas=await Promise.all(Array.from({length:8},()=>R('b','POST','/social/loja/usar',{produto:'caixa',chave:'abrir-caixa-unica-001',raridade:'lendaria',modelo:'hack'})));
 assert.ok(repetidas.every(r=>r.status===200));assert.equal(new Set(repetidas.map(r=>r.figurinha.id)).size,1);assert.ok(repetidas.every(r=>r.figurinha.modelo!=='hack'));
 const p=await R('b','GET','/social');assert.equal(p.saldo,5);assert.equal(p.inventario.caixa,0);
});
test('grupo não pode incluir desconhecidos, mudar regra pelo aceite ou consultar desafio de outra conta',async()=>{
 assert.equal((await R('a','POST','/social/grupos',{nome:'Time',tipo:'exercicios',dias:7,meta:10,amigos:[users.c.id]})).status,403);
 const g=await R('a','POST','/social/grupos',{nome:'Time',tipo:'exercicios',dias:7,meta:10,amigos:[users.b.id]});assert.equal(g.status,200);
 assert.equal((await R('c','POST',`/social/grupos/${g.id}/acao`,{acao:'aceitar'})).status,404);
 assert.equal((await R('b','POST',`/social/grupos/${g.id}/acao`,{acao:'aceitar',meta:1,dias:0})).status,200);
 assert.equal((await R('a','POST',`/social/grupos/${g.id}/acao`,{acao:'iniciar'})).status,200);
 const p=await R('b','GET','/social');assert.equal(p.grupos[0].meta,10);assert.equal(p.grupos[0].dias,7);
 assert.equal((await R('c','GET','/social')).duelos.length,0);
});
test('exportação inclui só a própria carteira; apagar tudo remove economia e encerra desafios sem prender figurinha do amigo',async()=>{
 const exp=await R('a','GET','/dados/exportar');assert.ok(exp.social.moedas.length);assert.equal(exp.social.moedas.reduce((n,m)=>n+m.quantidade,0),5);assert.equal(exp.social.xp.reduce((n,m)=>n+m.quantidade,0),75);
 assert.equal((await R('a','POST','/dados/apagar',{escopo:'tudo'})).status,200);
 const eu=await R('a','GET','/social');assert.equal(eu.saldo,0);assert.equal(eu.xp,0);assert.equal(eu.amigos.length,0);
 const amigo=await R('b','GET','/social');assert.ok(amigo.colecao.every(c=>!c.reservada));assert.equal(amigo.saldo,5);
});
