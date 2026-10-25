'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const {abrir}=require('../src/db'),{criarGrupos}=require('../src/assinaturas-grupo'),{criarOrcamento}=require('../src/orcamento'),assin=require('../src/assinatura');
function ambiente(t,criar,env={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-ia-franquia-')),db=abrir(dir);
 db.prepare('INSERT INTO usuarios(id,email,nome,senha_hash,criado_em,consentiu_em)VALUES(?,?,?,?,?,?)').run(1,'pessoa@franquia.test','Pessoa','fixture','2026-10-22','2026-10-22');
 db.prepare('INSERT INTO assinaturas(user_id,dados)VALUES(?,?)').run(1,JSON.stringify(assin.assinar(assin.novaAssinatura('2026-10-22'),'completo_mensal','2026-10-22')));
 const g=criarGrupos({db,hojeDe:()=> '2026-10-22'}),o=criarOrcamento({db,contaDe:g.contaDe,hojeDe:()=> '2026-10-22',env});
 let chamadas=0;const modulo={exports:{}},req=createRequire(path.resolve(__dirname,'../src/ia.js'));
 class Anthropic { constructor(){this.messages={create:async()=>{chamadas++;return criar();}};} }
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../src/ia.js'),'utf8'),{require:n=>n==='@anthropic-ai/sdk'?Anthropic:req(n),module:modulo,exports:modulo.exports,process:{env:{NODE_ENV:'test',ANTHROPIC_API_KEY:'fixture_sem_valor'}}});
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 return {db,o,chamadas:()=>chamadas,consultar:()=>o.executar(1,()=>modulo.exports.palavra({palavra:'hello',frase:'Hello, friend.'})),global:()=>db.prepare("SELECT qtd FROM consumo_global WHERE tipo='ia'").get()?.qtd||0};
}
const resposta=(text,stop_reason='end_turn')=>({model:'claude-haiku-5-5',usage:{input_tokens:100,output_tokens:10},stop_reason,content:[{type:'text',text}]});
test('rejeição sem geração devolve custo e quantidade de gerações ao aluno',async t=>{const a=ambiente(t,()=>{throw Object.assign(new Error('pedido rejeitado'),{status:429});});await assert.rejects(a.consultar);assert.equal(a.chamadas(),1);assert.equal(a.o.uso(1).ia,0);assert.equal(a.o.uso(1).geracoes,0);assert.equal(a.global(),0);});
test('timeout devolve franquia ao aluno e conserva a reserva global de custo incerto',async t=>{const a=ambiente(t,()=>{throw Object.assign(new Error('timeout'),{name:'APIConnectionTimeoutError'});});await assert.rejects(a.consultar);assert.equal(a.o.uso(1).ia,0);assert.equal(a.o.uso(1).geracoes,0);assert.ok(a.global()>0);});
for(const [nome,r]of [['JSON inválido',resposta('incompleto')],['recusa',resposta('{}','refusal')],['resposta cortada',resposta('{}','max_tokens')]])test(nome+' devolve franquia, mas conserva o custo efetivo do provedor',async t=>{const a=ambiente(t,()=>r);await assert.rejects(a.consultar);assert.equal(a.o.uso(1).ia,0);assert.equal(a.o.uso(1).geracoes,0);assert.equal(a.global(),25);});
test('geração válida registra uma utilização e ajusta a reserva ao custo confirmado',async t=>{const a=ambiente(t,()=>resposta(JSON.stringify({forma_base:'hello',ipa:'',sentidos:[{pt:'olá'}]})));const r=await a.consultar();assert.equal(r.sentidos[0].pt,'olá');assert.equal(a.o.uso(1).geracoes,1);assert.equal(a.o.uso(1).ia,25);assert.equal(a.global(),25);});
test('limite global identifica indisponibilidade do app sem consumir franquia ou chamar provedor',async t=>{const a=ambiente(t,()=>{throw Error('não deveria chamar');},{IA_ORCAMENTO_GLOBAL_USD:'0'});await assert.rejects(a.consultar,e=>e.status===503&&e.motivo==='limite_global'&&/Isso não significa/.test(e.message));assert.equal(a.chamadas(),0);assert.deepEqual(a.o.uso(1),{});});
test('limite pessoal e global de voz apresentam causas diferentes',t=>{const a=ambiente(t,()=>null,{VOZ_ORCAMENTO_GLOBAL_USD:'0'});assert.throws(()=>a.o.usar(1,'voz',10),e=>e.status===503&&e.motivo==='limite_global');assert.throws(()=>a.o.usar(1,'voz',2501),e=>e.status===429&&e.motivo==='limite');assert.deepEqual(a.o.uso(1),{});});
test('liquidação de uma reserva é idempotente, sem devolver consumo de outra tentativa',t=>{const a=ambiente(t,()=>null);const primeira=a.o.usar(1,'ia',100),segunda=a.o.usar(1,'ia',200);a.o.falhar(primeira,0);a.o.falhar(primeira,0);a.o.concluir(primeira,90);assert.equal(a.o.uso(1).geracoes,1);assert.equal(a.o.uso(1).ia,200);assert.equal(a.global(),200);a.o.concluir(segunda,20);assert.equal(a.global(),20);});
