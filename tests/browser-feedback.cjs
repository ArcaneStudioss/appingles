'use strict';
// Testes de regressão do fluxo móvel; Chromium/WebKit emulados, sem iPhone físico.
const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const{spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-feedback-')),PORT=34000+Math.floor(Math.random()*300),BASE='http://localhost:'+PORT,out='/tmp/inglou-feedback-artifacts';fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,['--disable-warning=ExperimentalWarning','server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,NODE_ENV:'test',PORT:String(PORT),DATA_DIR:dir,AUTH_PROVIDER:'local',BACKUP_DESLIGADO:'1',ANTHROPIC_API_KEY:'',ELEVENLABS_API_KEY:'',PAGAMENTO_MODO:'desligado'},stdio:'ignore'});
async function main(){for(let i=0;i<100;i++){try{await fetch(BASE+'/saude');break;}catch{await new Promise(r=>setTimeout(r,50));}}
for(const [motor,engine]of Object.entries({chromium,webkit})){const browser=await engine.launch();try{
const c=await browser.newContext({baseURL:BASE,isMobile:true,hasTouch:true,viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await c.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const R=async(method,url,data)=>{const r=await c.request.fetch('/api/v1'+url,{method,headers:{'X-Inglou':'1'},data});assert.equal(r.status(),200,await r.text());return r.json();};
await R('POST','/auth/cadastro',{nome:'Teste de celular',email:motor+'@feedback.test',idade:16,responsavel:true,papel:'aluno',senha:'Uma chave comprida e segura 2026',consentimento:true});await R('PUT','/perfil',{objetivo:'zero',minutos_dia:15,dias_semana:5,interesses:[]});await R('POST','/nivelamento',{nunca:true});await R('POST','/sessao',{minutos:5});
for(const width of [320,390,430]){
 await page.setViewportSize({width,height:844});await page.goto('/app/?feedback='+width+'#/sessao',{waitUntil:'networkidle'});
 // Exercício real com resposta determinística para comparar acerto, erro e barra fixa.
 for(const correto of [true,false])for(const fixa of [false,true]){
 await page.evaluate(async({correto,fixa})=>{const{exercicio}=await import('/assets/js/telas/exercicio.js');const ex={id:'teste-feedback',tipo:'escolha',enunciado:'O que significa “song”?',opcoes:['canção ou música','fim de semana','amigo ou amiga']};document.querySelector('#conteudo .tela').replaceChildren(exercicio(ex,{responder:async()=>({correto,esperado:'canção ou música',explica:'“Song” significa “canção ou música”. Releia o texto e observe como a palavra aparece.',recompensa:{xp:10,moedas:1}}),aoProximo:()=>{},barraFixa:fixa,permitirTreino:true}));scrollTo(0,document.documentElement.scrollHeight);},{correto,fixa});
 await page.locator('.opcao').first().click();await page.getByRole('button',{name:'Conferir',exact:true}).click();await page.locator('.retorno-exercicio:visible').waitFor();
 await page.waitForTimeout(100);
 const m=await page.evaluate(()=>{const panel=document.querySelector('.retorno-exercicio').getBoundingClientRect(),bar=document.querySelector('.barra-acao').getBoundingClientRect(),palco=document.querySelector('#conteudo');return{panel:panel.height,blank:Math.max(0,document.documentElement.scrollHeight-Math.max(innerHeight,document.querySelector('.barra-acao').getBoundingClientRect().bottom+scrollY)),padding:parseFloat(getComputedStyle(palco).paddingBottom),scroll:document.documentElement.scrollWidth,width:innerWidth,fixed:getComputedStyle(document.querySelector('.barra-acao')).position};});
 assert.ok(m.panel<(width===320?540:470),JSON.stringify({motor,width,correto,fixa,...m}));assert.ok(m.scroll<=m.width+2);
 if(!fixa){assert.ok(m.blank<65,JSON.stringify(m));assert.ok(m.padding<40);}else{assert.equal(m.fixed,'fixed');assert.ok(m.padding>=100);}
 await page.screenshot({path:path.join(out,`${motor}-${width}-${correto}-${fixa}.png`),fullPage:true});
 }
}
await page.setViewportSize({width:390,height:844});await page.goto('/app/?sessao-real#/sessao',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Praticar',exact:true}).click();
for(let i=0;i<2;i++){await page.getByRole('button',{name:'Ver resposta e aprender',exact:true}).click();await page.locator('.retorno-exercicio:visible').waitFor();await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>scrollY),0,'A próxima questão começa no topo');}
// Dicionário: resposta local imediata; enriquecimento explícito e uma só chamada em andamento.
let chamadas=0;await page.route('**/api/v1/palavra',async route=>{chamadas++;await new Promise(r=>setTimeout(r,800));await route.fulfill({json:{forma_base:'song',sentidos:[{classe:'substantivo',pt:'canção',ex_en:'This song is beautiful.',ex_pt:'Esta canção é bonita.',no_contexto:true}]}});});
await page.evaluate(async()=>{const{abrirPalavra}=await import('/assets/js/ui.js');const{registrarExpressoes}=await import('/assets/js/traducao.js');registrarExpressoes({song:'canção ou música'});abrirPalavra('song','This song is beautiful.');});
await page.getByText('canção ou música',{exact:true}).last().waitFor();assert.equal(chamadas,0);await page.getByRole('button',{name:'Ver outros sentidos nesta frase',exact:true}).click();await page.getByRole('button',{name:'Fechar',exact:true}).click();
await page.evaluate(async()=>{const{abrirPalavra}=await import('/assets/js/ui.js');abrirPalavra('song','This song is beautiful.');});await page.getByRole('button',{name:'Ver outros sentidos nesta frase',exact:true}).click();await page.locator('.sentido--aqui').waitFor();assert.equal(chamadas,1);
await page.getByRole('button',{name:'Fechar',exact:true}).click();await page.evaluate(async()=>{const{abrirPalavra}=await import('/assets/js/ui.js');abrirPalavra('song','This song is beautiful.');});await page.locator('.sentido--aqui').waitFor();assert.equal(chamadas,1);
await page.getByRole('button',{name:'Fechar',exact:true}).click();
// Sem síntese configurada, todos os controles precisam chegar à API e mostrar erro, nunca silêncio sem feedback.
let vozes=0;await page.route('**/api/v1/vozes/sintetizar',async route=>{vozes++;await new Promise(r=>setTimeout(r,150));await route.fulfill({status:503,json:{erro:'Áudio de teste indisponível.'}});});
await page.evaluate(async()=>{const{exercicio}=await import('/assets/js/telas/exercicio.js');document.querySelector('#conteudo .tela').replaceChildren(exercicio({id:'audio',tipo:'escolha',opcoes:['Hello','Goodbye'],enunciado:'Escolha'},{ja:{correto:true,esperado:'Hello',audioResposta:'Hello',explica:'Hello quer dizer olá.'},responder:async()=>({}),aoProximo:()=>{},permitirTreino:true}));});
for(const name of ['Ouvir Tuiuiú ler esta mensagem','Ouvir resposta','Ler explicação']){const antes=vozes;await page.getByRole('button',{name,exact:true}).click();await page.locator('.voz-preparando[aria-busy=true]').waitFor();await page.getByText('Áudio de teste indisponível.',{exact:true}).last().waitFor();await page.waitForTimeout(200);assert.equal(vozes,antes+1);assert.equal(await page.locator('.voz-preparando').count(),0);}
assert.deepEqual(errors,[]);console.log(motor+': feedback compacto, rodapé, avanço, dicionário imediato/cache e controles de áudio OK');await c.close();
}finally{await browser.close();}}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>{srv.kill();setTimeout(()=>fs.rmSync(dir,{recursive:true,force:true}),500).unref();});
