'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {spawn}=require('node:child_process');
const {abrir}=require('../src/db');
const {criarSocial}=require('../src/social');
const DIA=864e5;
function mundo(t,sortear) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-social-')),db=abrir(dir);t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 let agora=new Date('2026-01-01T12:00:00.000Z');
 const s=criarSocial(db,{agora:()=>agora,sortear});
 for(let uid=1;uid<=4;uid++)db.prepare('INSERT INTO usuarios(id,email,nome,senha_hash,criado_em,consentiu_em) VALUES(?,?,?,?,?,?)').run(uid,uid+'@social.test','Aprendiz '+uid,'fixture',agora.toISOString(),agora.toISOString());
 // Os testes de transferência usam adultos com duas cópias; conquistas e últimas cópias não são elegíveis.
 for(let uid=1;uid<=4;uid++) {
  db.prepare('INSERT INTO perfis(user_id,idade) VALUES(?,28)').run(uid);s.perfil(uid);
  for(let i=0;i<2;i++)db.prepare("INSERT INTO colecao_figurinhas(user_id,modelo,raridade,origem_chave,criada_em) VALUES(?,'pratica-1','comum',?,?)").run(uid,'duplicata-fixture:'+uid+':'+i,agora.toISOString());
 }
 const ponto=(uid,item,op={})=>db.prepare('INSERT INTO tentativas(user_id,em,item_id,correto,dica,origem) VALUES(?,?,?,?,?,?)').run(uid,op.em||agora.toISOString(),item,op.errado?0:1,op.dica?1:0,op.origem||'biblioteca');
 const avanca=ms=>{agora=new Date(+agora+ms);};
 const amigo=(a,b)=>{const p=s.perfil(b);s.pedir(a,p.codigo);s.responderAmizade(b,a,true);};
 const iniciar=(a=1,b=2,dias=2)=>{amigo(a,b);const fA=s.colecao(a)[0].id,fB=s.colecao(b)[0].id,d=s.novoDuelo(a,b,dias,fB);s.escolher(b,d.id,fA);s.confirmar(a,d.id);return {id:d.id,fA,fB};};
 return {db,s,ponto,avanca,amigo,iniciar,dir,agora:()=>agora};
}
test('moedas e XP vêm de correções elegíveis, sem duplicar a questão no dia nem premiar dica ou nota própria',t=>{
 const {s,ponto,avanca}=mundo(t);
 ponto(1,'um');ponto(1,'um');ponto(1,'dois',{errado:true});ponto(1,'tres',{dica:true});ponto(1,'quatro',{origem:'revisao'});ponto(1,'cinco',{origem:'nivelamento'});ponto(1,null);
 assert.equal(s.saldo(1),1);assert.equal(s.xp(1),10);
 avanca(DIA);ponto(1,'um');assert.equal(s.saldo(1),2);assert.equal(s.xp(1),20);
 for(let i=0;i<23;i++)ponto(1,'novo-'+i);
 assert.ok(s.colecao(1).some(c=>c.raridade==='rara'));
});
test('poção é consumida uma vez, dobra só XP futuro por 30 minutos e não acumula outra ativação',t=>{
 const {s,ponto,avanca}=mundo(t);for(let i=0;i<40;i++)ponto(1,'base'+i);
 s.compra(1,'pocao','compra-pocao-0001');s.compra(1,'pocao','compra-pocao-0002');
 const antes=s.xp(1),r=s.consumir(1,'pocao','ativar-pocao-0001');assert.equal(s.consumir(1,'pocao','ativar-pocao-0001').ate,r.ate);
 assert.throws(()=>s.consumir(1,'pocao','ativar-pocao-0002'),/Já há uma/);
 ponto(1,'duplo');assert.equal(s.xp(1),antes+20);assert.equal(s.saldo(1),1);
 avanca(30*60e3);ponto(1,'normal');assert.equal(s.xp(1),antes+30);
 s.consumir(1,'pocao','ativar-pocao-0002');assert.equal(s.painel(1).inventario.pocao,0);
});
test('duelo exige escolhas recíprocas e confirmação, reserva as duas e transfere só a figurinha perdida após o prazo',t=>{
 const {s,ponto,avanca,amigo,db}=mundo(t);amigo(1,2);s.perfil(1);const fA=s.colecao(1)[0].id,fB=s.colecao(2)[0].id;
 const d=s.novoDuelo(1,2,2,fB);assert.throws(()=>s.confirmar(1,d.id),/confirmação/);assert.throws(()=>s.escolher(3,d.id,fA),/não encontrado/);
 s.escolher(2,d.id,fA);assert.ok(s.colecao(1)[0].reservada);assert.throws(()=>s.novoDuelo(1,2,2,fB),/não está disponível/);
 ponto(2,'antes');s.confirmar(1,d.id);assert.throws(()=>s.confirmar(1,d.id),/confirmação/);assert.throws(()=>s.cancelarDuelo(2,d.id),/já começou/);
 avanca(1);ponto(1,'a');ponto(1,'b');ponto(2,'c');avanca(2*DIA);
 ponto(2,'depois');const fim=s.painel(1).duelos[0];assert.equal(fim.vencedor,1);assert.equal(fim.placarCriador,2);assert.equal(fim.placarConvidado,1);
 assert.equal(db.prepare('SELECT user_id FROM colecao_figurinhas WHERE id=?').get(fB).user_id,1);
 assert.equal(db.prepare('SELECT user_id FROM colecao_figurinhas WHERE id=?').get(fA).user_id,1);
 s.painel(2);assert.equal(db.prepare('SELECT COUNT(*) n FROM figurinhas_reservas').get().n,0);
});
test('empate preserva ambas as figurinhas e convites expirados liberam reservas',t=>{
 const {s,avanca,iniciar,db}=mundo(t),d=iniciar();avanca(2*DIA);assert.equal(s.painel(1).duelos[0].vencedor,null);
 assert.equal(db.prepare('SELECT user_id FROM colecao_figurinhas WHERE id=?').get(d.fB).user_id,2);
 const novo=s.novoDuelo(1,2,7,d.fB);s.escolher(2,novo.id,d.fA);avanca(3*DIA);assert.equal(s.painel(1).duelos[0].estado,'expirado');assert.ok(s.colecao(2).every(c=>!c.reservada));
});
test('meta em grupo congela quem aceitou e premia todos uma única vez por pontos após o início',t=>{
 const {s,ponto,avanca,amigo}=mundo(t);amigo(1,2);amigo(1,3);ponto(1,'antes');avanca(1);
 const g=s.novoGrupo(1,{nome:'Time',tipo:'exercicios',dias:7,meta:3,diaria:1,amigos:[2,3]});s.grupoAcao(2,g.id,'aceitar');s.grupoAcao(1,g.id,'iniciar');
 assert.throws(()=>s.grupoAcao(3,g.id,'aceitar'),/não encontrado|não está disponível/);
 avanca(1);ponto(1,'a');ponto(2,'b');ponto(2,'c');assert.equal(s.painel(1).grupos[0].estado,'concluido');
 for(const uid of [1,2]) {assert.equal(s.colecao(uid).filter(c=>c.modelo==='grupo-exercicios').length,1);assert.ok(s.colecao(uid).some(c=>c.modelo==='grupo-exercicios'&&c.raridade==='epica'));}
 s.painel(1);assert.equal(s.colecao(1).filter(c=>c.modelo==='grupo-exercicios').length,1);
});
test('sequência de grupo usa blocos de 24 horas, exige cada participante e recomeça após dia perdido',t=>{
 const {s,ponto,avanca,amigo}=mundo(t);amigo(1,2);const g=s.novoGrupo(1,{nome:'Constância',tipo:'sequencia',dias:7,meta:2,diaria:1,amigos:[2]});s.grupoAcao(2,g.id,'aceitar');s.grupoAcao(1,g.id,'iniciar');
 ponto(1,'a');ponto(2,'b');avanca(DIA);ponto(1,'c');avanca(DIA);assert.equal(s.painel(1).grupos[0].sequencia,0);
 ponto(1,'d');ponto(2,'e');avanca(DIA);ponto(1,'f');ponto(2,'g');assert.equal(s.painel(2).grupos[0].estado,'concluido');
});
test('caixas cobram e consomem uma vez por pedido, sorteiam no servidor e nunca deixam saldo negativo',t=>{
 const sorteios=[0,0,65,1,90,2,99,3],{s,ponto}=mundo(t,()=>sorteios.shift());for(let i=0;i<60;i++)ponto(1,'a'+i);
 for(let i=0;i<4;i++) {
  const chave='comprar-caixa-00'+i;s.compra(1,'caixa',chave);s.compra(1,'caixa',chave);
  const r=s.consumir(1,'caixa','abrir-caixa-000'+i);assert.equal(r.figurinha.raridade,['comum','rara','epica','lendaria'][i]);
  assert.equal(s.consumir(1,'caixa','abrir-caixa-000'+i).figurinha.id,r.figurinha.id);
 }
 assert.equal(s.saldo(1),0);assert.throws(()=>s.compra(1,'caixa','sem-saldo-0000001'),/suficientes/);assert.throws(()=>s.consumir(1,'caixa','sem-caixa-0000001'),/não tem/);
 assert.throws(()=>s.compra(1,'pocao','comprar-caixa-000'),/já foi usado/);
});
test('XP de conclusão é único, contempla capítulos e lições, e uma poção não altera conquistas pessoais',t=>{
 const {db,s}=mundo(t),em='2026-01-01T12:00:00.000Z';
 db.prepare("INSERT INTO licoes(user_id,data,dados,respondidos) VALUES(1,'2026-01-01','{}','{\"x\":{}}')").run();
 db.prepare("UPDATE licoes SET concluida_em=?,status='concluida' WHERE user_id=1").run(em);
 db.prepare("UPDATE licoes SET concluida_em=? WHERE user_id=1").run(em);
 db.prepare("INSERT INTO biblioteca_progressos(user_id,unidade_id,concluido_em) VALUES(1,'capitulo',?)").run(em);
 assert.equal(s.xp(1),50);
 db.prepare('INSERT INTO conquistas(user_id,codigo,em) VALUES(1,?,?)').run('seq-100',em);
 assert.ok(s.colecao(1).some(c=>c.raridade==='lendaria'));
});
test('bloqueio impede novos pedidos e apagar conta ou todos os dados libera as figurinhas dos demais',t=>{
 const {s,iniciar,db}=mundo(t),d=iniciar();s.apagar(1);assert.ok(s.colecao(2).every(c=>!c.reservada));assert.equal(s.saldo(1),0);
 s.pedir(1,s.perfil(2).codigo);s.responderAmizade(2,1,true);s.remover(2,1,true);assert.throws(()=>s.pedir(1,s.perfil(2).codigo),/indisponível/);
 db.prepare('DELETE FROM usuarios WHERE id=1').run();assert.equal(db.prepare('SELECT COUNT(*) n FROM duelos WHERE id=?').get(d.id).n,0);
});
test('migração preserva conquistas antigas, cria cópias e XP histórico uma vez e tolera reabertura',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-migracao-social-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const src=fs.readFileSync(path.join(__dirname,'../src/db.js'),'utf8'),corte=src.indexOf('  // 11:');
 const antigo=src.slice(0,corte)+'];\n\n'+src.slice(src.indexOf('function abrir(dir)'));
 const contexto={require,module:{exports:{}},__dirname:path.join(__dirname,'../src')};vm.runInNewContext(antigo,contexto);
 let db=contexto.module.exports.abrir(dir);db.prepare("INSERT INTO usuarios(id,email,nome,senha_hash,criado_em,consentiu_em) VALUES(1,'a@test.test','A','fixture','2026-01-01','2026-01-01')").run();
 db.prepare("INSERT INTO conquistas VALUES(1,'primeira-licao','2026-01-01')").run();db.prepare("INSERT INTO licoes(user_id,data,dados,respondidos,concluida_em) VALUES(1,'2026-01-01','{}','{\"x\":{}}','2026-01-01')").run();db.close();
 db=abrir(dir);assert.equal(db.prepare('SELECT COUNT(*) n FROM conquistas').get().n,1);assert.equal(db.prepare('SELECT COUNT(*) n FROM colecao_figurinhas').get().n,1);assert.equal(criarSocial(db).xp(1),25);db.close();
 db=abrir(dir);assert.equal(criarSocial(db).xp(1),25);db.close();
});
test('duas réplicas podem aplicar migrações ao mesmo arquivo sem duplicar nem falhar',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-migracao-concorrente-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const run=()=>new Promise((resolve,reject)=>{let erro='';const p=spawn(process.execPath,['--disable-warning=ExperimentalWarning','-e',`const db=require('./src/db').abrir(process.argv[1]);db.close()`,dir],{cwd:path.join(__dirname,'..')});p.stderr.on('data',b=>erro+=b);p.on('error',reject);p.on('exit',code=>code?reject(Error(erro)):resolve());});
 await Promise.all([run(),run()]);const db=abrir(dir);assert.equal(db.prepare('SELECT v FROM _versao').get().v,14);db.close();
});

test('excluir a conta durante um duelo libera a reserva da outra pessoa por cascata',t=>{
 const {s,iniciar,db}=mundo(t),d=iniciar();db.prepare('DELETE FROM usuarios WHERE id=1').run();
 assert.equal(db.prepare('SELECT COUNT(*) n FROM duelos WHERE id=?').get(d.id).n,0);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM figurinhas_reservas').get().n,0);
 assert.equal(db.prepare('SELECT user_id FROM colecao_figurinhas WHERE id=?').get(d.fB).user_id,2);
});
test('uma nova conta com ID reutilizado não colide com figurinhas da conta antiga transferidas a um amigo',t=>{
 const {s,iniciar,db,ponto,avanca}=mundo(t),d=iniciar();avanca(1);ponto(1,'vitoria');avanca(2*DIA);s.painel(1);
 const antiga=db.prepare('SELECT identidade FROM social_identidades WHERE user_id=2').get().identidade;
 db.prepare('DELETE FROM usuarios WHERE id=2').run();db.prepare("INSERT INTO usuarios(id,email,nome,senha_hash,criado_em,consentiu_em) VALUES(2,'nova@social.test','Nova','fixture','2026-01-05','2026-01-05')").run();
 assert.notEqual(db.prepare('SELECT identidade FROM social_identidades WHERE user_id=2').get().identidade,antiga);
 s.perfil(2);assert.ok(s.colecao(2).some(c=>c.modelo==='bem-vindo'));assert.equal(db.prepare('SELECT user_id FROM colecao_figurinhas WHERE id=?').get(d.fB).user_id,1);
});
test('caixas priorizam modelos faltantes sem mudar raridade; cenário é permanente e não pode ser comprado duas vezes',t=>{
 const {s,ponto,db}=mundo(t,()=>0);for(let i=0;i<120;i++)ponto(1,'saldo-extra-'+i);
 s.compra(1,'cenario-praca','cenario-compra-0001');const antes=s.saldo(1);
 assert.throws(()=>s.compra(1,'cenario-praca','cenario-compra-0002'),/já é seu/);assert.equal(s.saldo(1),antes);
 assert.equal(s.consumir(1,'cenario-praca','cenario-usar-00001').cenario,'cenario-praca');
 assert.equal(s.consumir(1,'cenario-praca','cenario-usar-00002').cenario,'padrao');assert.equal(s.painel(1).inventario['cenario-praca'],1);
 // Isola a seleção do modelo com carteira já adquirida e uma coleção incompleta.
 db.prepare("DELETE FROM colecao_figurinhas WHERE user_id=1 AND modelo LIKE 'pratica-%'").run();
 for(let i=0;i<4;i++){
  const anteriores=new Set(s.colecao(1).filter(c=>c.raridade==='comum').map(c=>c.modelo));
  s.compra(1,'caixa','caixa-faltante-compra-'+i);const r=s.consumir(1,'caixa','caixa-faltante-abrir-'+i);
  assert.equal(r.figurinha.raridade,'comum');assert.ok(!anteriores.has(r.figurinha.modelo));
 }
});
