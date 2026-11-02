'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {abrir}=require('../src/db');
const {criarSocial}=require('../src/social');
const {apelidoPermitido}=require('../src/motor/apelido');

function mundo(t) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-mod-')),db=abrir(dir);t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const s=criarSocial(db),agora=new Date().toISOString();
 const idades={1:30,2:30,3:15,4:40};
 for(const uid of [1,2,3,4]){
  db.prepare('INSERT INTO usuarios(id,email,nome,senha_hash,criado_em,consentiu_em) VALUES(?,?,?,?,?,?)').run(uid,uid+'@mod.test','Pessoa'+uid,'fixture',agora,agora);
  db.prepare('INSERT INTO perfis(user_id,idade) VALUES(?,?)').run(uid,idades[uid]);s.perfil(uid);
 }
 return {db,s};
}
const codigoDe=(db,uid)=>db.prepare('SELECT codigo FROM social_perfis WHERE user_id=?').get(uid).codigo;

test('apelido recusa contato, palavrão disfarçado e lixo, mas aceita nomes comuns',()=>{
 for(const ruim of ['me chama 11999998888','joao@gmail.com','www.site.com','P0rr4','f u c k','c4r4lh0','a','x'.repeat(25)])assert.equal(apelidoPermitido(ruim).ok,false,ruim);
 for(const bom of ['Ana','João Pedro','Mia_Fã','Cassandra','Paulo','Computador'])assert.equal(apelidoPermitido(bom).ok,true,bom);
});

test('trocar apelido valida o texto e respeita a trava aplicada pela equipe',t=>{
 const {s,db}=mundo(t);
 assert.throws(()=>s.trocarApelido(1,'p0rr4'),/gentil/);
 s.trocarApelido(1,'Ana Lima');assert.equal(s.painel(1).eu.apelido,'Ana Lima');
 db.prepare('UPDATE social_perfis SET apelido_travado=1 WHERE user_id=1').run();
 assert.throws(()=>s.trocarApelido(1,'Outro'),/equipe/);
});

test('denúncia: só de quem se relaciona, uma aberta por par, e bloqueio opcional',t=>{
 const {s,db}=mundo(t);
 assert.throws(()=>s.denunciar(1,2,'apelido',null,false),/não encontrada/);
 s.pedir(1,codigoDe(db,2));
 s.denunciar(1,2,'apelido','nome ofensivo',false);s.denunciar(1,2,'apelido','de novo',false);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM denuncias_social').get().n,1);
 s.responderAmizade(2,1,true);s.denunciar(1,2,'comportamento',null,true);
 assert.equal(s.painel(1).amigos.length,0);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM social_bloqueios WHERE user_id=1 AND bloqueado_id=2').get().n,1);
 assert.throws(()=>s.denunciar(1,1,'apelido',null,false),/não encontrada/);
});

test('busca por nome: só adultos buscam, só quem ativou aparece, sem bloqueados nem amigos, mínimo 3 letras',t=>{
 const {s,db}=mundo(t);
 s.trocarApelido(2,'Marina');s.trocarApelido(3,'Marcos');s.trocarApelido(4,'Marta');
 assert.throws(()=>s.definirBusca(3,true),/maiores/);
 assert.deepEqual(s.buscar(1,'mar').resultados,[]);
 s.definirBusca(2,true);s.definirBusca(4,true);
 assert.deepEqual(s.buscar(1,'MAR').resultados.map(r=>r.apelido),['Marina','Marta']);
 assert.throws(()=>s.buscar(1,'ma'),/3 letras/);
 assert.throws(()=>s.buscar(3,'mar'),/maiores/);
 assert.equal(s.buscar(1,'%%%').resultados.length,0);
 db.prepare('UPDATE social_perfis SET busca_nome=1 WHERE user_id=3').run();
 assert.deepEqual(s.buscar(1,'mar').resultados.map(r=>r.apelido),['Marina','Marta'],'menor nunca aparece, mesmo se o campo for forçado');
 s.remover(1,4,true);assert.deepEqual(s.buscar(1,'mar').resultados.map(r=>r.apelido),['Marina']);
 s.pedir(1,s.buscar(1,'marina').resultados[0].codigo);assert.equal(s.buscar(1,'marina').resultados.length,0);
 assert.equal(JSON.stringify(s.buscar(1,'mar')).includes('user_id'),false);
});

test('24 modelos de prática: o gatilho percorre todos e o catálogo tem nome e imagem para cada um',t=>{
 const {db,s}=mundo(t);const {CARTAS}=require('../src/social');
 for(let i=1;i<=24;i++)assert.ok(CARTAS['pratica-'+i],'pratica-'+i);
 db.prepare("DELETE FROM colecao_figurinhas WHERE user_id=1").run();
 for(let i=0;i<24*5;i++)db.prepare('INSERT INTO tentativas(user_id,em,item_id,correto,dica,origem) VALUES(1,?,?,1,0,?)').run(new Date().toISOString(),'item-'+i,'biblioteca');
 const modelos=new Set(db.prepare("SELECT modelo FROM colecao_figurinhas WHERE user_id=1 AND modelo LIKE 'pratica-%'").all().map(r=>r.modelo));
 assert.equal(modelos.size,24);
 assert.ok(s.colecao(1).every(c=>c.nome&&c.imagem));
});
