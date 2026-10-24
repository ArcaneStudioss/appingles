'use strict';
const { test, before, after }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');
const {respostaCerta}=require('../src/motor/correcao');
const {retesteVencido}=require('../src/motor/licao');
const {montarPlano}=require('../src/motor/plano');
const {criarSocial}=require('../src/social');
const PORT=26000+Math.floor(Math.random()*900),BASE=`http://localhost:${PORT}/api/v1`,DIR=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-evolucao-'));
const users={};let srv,db;
async function R(w,m,u,body){const r=await fetch(BASE+u,{method:m,headers:{...(users[w]?{Cookie:users[w].cookie}:{}),...(m!=='GET'?{'X-Inglou':'1','Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,...await r.json()};}
before(async()=>{
 srv=spawn(process.execPath,['--disable-warning=ExperimentalWarning',path.join(__dirname,'../server.js')],{env:{...process.env,PORT:String(PORT),DATA_DIR:DIR,NODE_ENV:'test',AUTH_PROVEDOR:'local',INGLOU_ADMIN_IDS:'1',ANTHROPIC_API_KEY:'',ELEVENLABS_API_KEY:'',BACKUP_DESLIGADO:'1'},stdio:'pipe'});
 for(let n=0;n<80;n++){try{await fetch(`http://localhost:${PORT}/saude`);break;}catch{await new Promise(r=>setTimeout(r,75));}}
 for(const [w,idade,papel]of [['adulto',30,'ambos'],['menor',12,'aluno'],['outro',28,'aluno']]){
  const r=await fetch(BASE+'/auth/cadastro',{method:'POST',headers:{'X-Inglou':'1','Content-Type':'application/json'},body:JSON.stringify({nome:'Aprendiz '+w,email:w+'@evolucao.test',senha:'frase longa para estudar 2026',idade,papel,consentimento:true,responsavel:true})});
  assert.equal(r.status,200,await r.clone().text());users[w]={cookie:r.headers.get('set-cookie').split(';')[0]};
  await R(w,'PUT','/perfil',{objetivo:'zero',minutos_dia:15,dias_semana:5,interesses:[]});await R(w,'POST','/nivelamento',{nunca:true});
 }
 db=new DatabaseSync(path.join(DIR,'inglou.db'));
 for(const w of Object.keys(users))users[w].id=db.prepare('SELECT id FROM usuarios WHERE email=?').get(w+'@evolucao.test').id;
});
after(()=>{db?.close();srv?.kill();fs.rmSync(DIR,{recursive:true,force:true});});
test('sessão curta retoma, persiste ajuda no servidor e premia uma única conclusão em envios concorrentes',async()=>{
 const r=await R('adulto','POST','/sessao',{minutos:5});assert.equal(r.status,200);assert.equal(r.sessao.minutos,5);assert.ok(r.sessao.itens.length<=3);assert.doesNotMatch(JSON.stringify(r),/"resposta":|"aceitas":/);
 const row=db.prepare('SELECT * FROM sessoes_guiadas WHERE user_id=?').get(users.adulto.id),d=JSON.parse(row.dados);
 const ex=d.itens[0];await R('adulto','POST','/sessao/ajuda',{itemId:ex.id});
 const primeiro=await R('adulto','POST','/sessao/responder',{itemId:ex.id,resposta:respostaCerta(ex),dica:false,xp:9999});assert.equal(primeiro.dica,true);assert.equal(primeiro.recompensa,undefined);
 assert.equal((await R('adulto','POST','/sessao',{minutos:20})).sessao.minutos,5,'sessão iniciada não troca de questões');
 assert.equal((await R('adulto','POST','/sessao/concluir')).status,409);
 for(const e of d.itens.slice(1))assert.equal((await R('adulto','POST','/sessao/responder',{itemId:e.id,resposta:respostaCerta(e)})).status,200);
 const fins=await Promise.all(Array.from({length:8},()=>R('adulto','POST','/sessao/concluir')));
 assert.equal(fins.filter(r=>!r.repetida).length,1);assert.equal(fins.filter(r=>r.recompensa?.xp===25).length,1);
 assert.ok((await R('adulto','GET','/sessao')).sessao.concluida);
 assert.equal(db.prepare("SELECT COUNT(*) n FROM xp_extrato WHERE user_id=? AND motivo='Sessão guiada concluída'").get(users.adulto.id).n,1);
 assert.equal((await R('outro','POST','/sessao/responder',{itemId:ex.id,resposta:respostaCerta(ex),user_id:users.adulto.id})).status,404);
});
test('professor também estuda; rascunhos são privados e uma nova versão preserva a publicação e suas respostas',async()=>{
 assert.equal((await R('adulto','GET','/eu')).perfil.papel,'ambos');
 const t=(await R('adulto','POST','/turmas',{nome:'Turma da evolução'})).turma;
 await R('menor','POST','/turmas/entrar',{codigo:t.codigo,ciente:true});
 const payload={titulo:'Minha aula',estado:'rascunho',banco:['z1-1'],proprias:[],material:{explicacao:'Aprenda a cumprimentar.',vocab:[]}};
 // O banco é selecionado do catálogo real, evitando amarrar a aula a um ID de fixture.
 payload.banco=[require('../src/conteudo/missoes').MISSOES.flatMap(m=>m.exercicios).find(e=>e.tipo==='escolha').id];
 const a=await R('adulto','POST',`/turmas/${t.id}/atividades`,payload);assert.equal(a.status,200);
 assert.equal((await R('menor','GET',`/atividades/${a.id}`)).status,404);
 assert.equal((await R('menor','GET',`/turmas/${t.id}/atividades/${a.id}/editar`)).status,404);
 assert.equal((await R('adulto','POST',`/turmas/${t.id}/atividades/${a.id}/publicar`)).status,200);
 const publica=await R('menor','GET',`/atividades/${a.id}`);assert.equal(publica.status,200);
 await R('menor','POST',`/atividades/${a.id}/responder`,{itemId:publica.itens[0].id,resposta:publica.itens[0].opcoes[0]});
 assert.equal((await R('adulto','PUT',`/turmas/${t.id}/atividades/${a.id}`,payload)).status,409);
 const nova=await R('adulto','POST',`/turmas/${t.id}/atividades/${a.id}/revisar`);assert.notEqual(nova.id,a.id);
 assert.equal((await R('adulto','PUT',`/turmas/${t.id}/atividades/${nova.id}`,{...payload,titulo:'Aula revisada'})).status,200);
 assert.equal((await R('menor','GET',`/atividades/${nova.id}`)).status,404);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM atividade_respostas WHERE atividade_id=?').get(a.id).n,1);
 assert.equal((await R('adulto','POST',`/turmas/${t.id}/atividades/${a.id}/encerrar`)).status,200);
 assert.equal((await R('menor','GET',`/atividades/${a.id}`)).status,200,'aluno conserva a consulta');
});
test('passaporte usa práticas reais da idade e guarda carimbo pessoal sem confundir com domínio',async()=>{
 const p=await R('menor','GET','/passaporte');assert.equal(p.status,200);assert.ok(p.missoes.length>=4);assert.ok(p.missoes.every(m=>m.id.startsWith('crianca-')&&m.fontes.length));
 const id=p.missoes[0].id;db.prepare("INSERT INTO biblioteca_progressos(user_id,unidade_id,concluido_em) VALUES(?,?,?)").run(users.menor.id,id,new Date().toISOString());
 const feito=await R('menor','GET','/passaporte');assert.ok(feito.missoes.find(m=>m.id===id).carimbo);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM conquistas WHERE user_id=? AND codigo=?').get(users.menor.id,'passaporte:'+id).n,1);
 await R('menor','GET','/passaporte');assert.equal(db.prepare('SELECT COUNT(*) n FROM conquistas WHERE user_id=? AND codigo=?').get(users.menor.id,'passaporte:'+id).n,1);
});
test('admin é autorizado por configuração do servidor; revisão publica fontes e não expõe conversas privadas',async()=>{
 assert.equal((await R('menor','GET','/admin')).status,403);assert.equal((await R('menor','PUT','/perfil/publico',{idade:12,papel:'ambos',responsavel:true,admin:true})).status,200);
 assert.equal((await R('menor','GET','/admin')).status,403);
 const relato=await R('menor','POST','/conteudo/relatar',{tipo:'cultura',referencia:'bergamota',motivo:'Conferir a descrição das variedades de fruta.'});assert.equal(relato.status,200);
 const painel=await R('adulto','GET','/admin');assert.equal(painel.status,200);assert.ok(painel.relatos.length);assert.doesNotMatch(JSON.stringify(painel.metricas),/email|resposta|conversa|senha_hash/);
 assert.equal((await R('adulto','PUT','/admin/cultura/bergamota',{resumo:'Revisão de teste.',brasil:'Contexto de teste.',cuidado:'Cuidado de teste.',fontes:[{titulo:'Fonte',url:'javascript:alert(1)'}]})).status,422);
 const ficha=painel.cultura.find(e=>e.id==='bergamota');assert.equal((await R('adulto','PUT','/admin/cultura/bergamota',{...ficha,resumo:'Descrição editorial revisada para o teste.'})).status,200);
 const catalogo=await R('menor','GET','/brasil-mundo');assert.equal(catalogo.expressoes.find(e=>e.id==='bergamota').resumo,'Descrição editorial revisada para o teste.');
 const id=painel.relatos[0].id;assert.equal((await R('adulto','POST','/admin/relatos/'+id,{estado:'resolvido',parecer:'Fonte e explicação conferidas.'})).status,200);
});
test('menores têm desafio amistoso e adultos só transferem duplicatas, com teto diário e constância',()=>{
 const s=criarSocial(db);for(const w of ['adulto','outro','menor'])s.perfil(users[w].id);
 const a=users.adulto.id,b=users.outro.id,c=users.menor.id;
 s.pedir(a,s.perfil(b).codigo);s.responderAmizade(b,a,true);s.pedir(a,s.perfil(c).codigo);s.responderAmizade(c,a,true);
 const unico=s.colecao(b).find(f=>f.modelo==='bem-vindo');assert.throws(()=>s.novoDuelo(a,b,2,unico.id),/repetida|protegida/);
 assert.throws(()=>s.novoDuelo(a,c,2,s.colecao(c)[0].id),e=>e.status===403);
 const amigavel=s.novoDuelo(a,c,2);s.escolher(c,amigavel.id,null);s.confirmar(a,amigavel.id);assert.equal(db.prepare('SELECT COUNT(*) n FROM figurinhas_reservas WHERE duelo_id=?').get(amigavel.id).n,0);
 const em=new Date().toISOString();for(let i=0;i<30;i++)db.prepare("INSERT INTO tentativas(user_id,em,item_id,correto,dica,origem) VALUES(?,?,?,1,0,'biblioteca')").run(b,em,'teto-evolucao-'+i);
 assert.equal(s.contar(b,em.slice(0,10),new Date(Date.now()+864e5).toISOString()),20);assert.equal(s.contar(b,em.slice(0,10),new Date(Date.now()+864e5).toISOString(),0,'constancia'),1);
});
test('novos retestes verificam manutenção após 7, 14 e 30 dias e tempo disponível muda previsão',()=>{
 assert.equal(retesteVencido({status:'retido',retido_em:'2026-10-01',retestes:1},'2026-10-07'),false);
 assert.equal(retesteVencido({status:'retido',retido_em:'2026-10-01',retestes:1},'2026-10-08'),true);
 assert.equal(retesteVencido({status:'retido',retido_em:'2026-10-01',retestes:2},'2026-10-14'),false);
 assert.equal(retesteVencido({status:'retido',retido_em:'2026-10-01',retestes:3},'2026-10-31'),true);
 const perfil={objetivo:'entrevista',dias_semana:5};assert.ok(montarPlano({...perfil,minutos_dia:10},'B1','2026-10-22').semanasPrevistas>montarPlano({...perfil,minutos_dia:20},'B1','2026-10-22').semanasPrevistas);
});
test('material pessoal acompanha a conversa e outra conta não consegue anexá-lo',async()=>{
 const m=await R('adulto','POST','/materiais',{titulo:'Minha situação real',texto:'We are looking for a software developer with experience in testing, clear communication and working with international teams. The candidate will explain projects and discuss requirements.'});
 assert.equal(m.status,200);
 const c=(await R('adulto','GET','/conversas/cenarios')).cenarios[0].id;
 assert.equal((await R('outro','POST','/conversas',{cenario:c,materialId:m.id})).status,404);
 const conversa=await R('adulto','POST','/conversas',{cenario:c,materialId:m.id});assert.equal(conversa.status,200);
 assert.equal(db.prepare('SELECT material_id FROM conversas WHERE id=?').get(conversa.id).material_id,m.id);
 assert.equal((await R('adulto','POST',`/conversas/${conversa.id}/mensagem`,{texto:'I would like to explain my project.'})).status,200);
});
test('apagar respostas e refazer a sessão no mesmo dia não repete XP nem avanço',async()=>{
 const uid=users.adulto.id,antes=db.prepare('SELECT SUM(quantidade) n FROM xp_extrato WHERE user_id=?').get(uid).n;
 assert.equal((await R('adulto','POST','/dados/apagar',{escopo:'respostas'})).status,200);
 const s=await R('adulto','POST','/sessao',{minutos:5});assert.equal(s.status,200);
 const d=JSON.parse(db.prepare('SELECT dados FROM sessoes_guiadas WHERE user_id=?').get(uid).dados);
 for(const e of d.itens)await R('adulto','POST','/sessao/responder',{itemId:e.id,resposta:respostaCerta(e)});
 const fim=await R('adulto','POST','/sessao/concluir');assert.equal(fim.repetida,true);
 assert.equal(db.prepare('SELECT SUM(quantidade) n FROM xp_extrato WHERE user_id=?').get(uid).n,antes);
});
