'use strict';
// Interface real em Chromium/WebKit. Não representa teste em um iPhone físico.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const PORT=27500+Math.floor(Math.random()*400),BASE=`http://localhost:${PORT}`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-browser-'));
const srv=spawn(process.execPath,['--disable-warning=ExperimentalWarning','server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),DATA_DIR:dir,NODE_ENV:'test',AUTH_PROVEDOR:'local',INGLOU_ADMIN_IDS:'1,2,3,4',ANTHROPIC_API_KEY:'',ELEVENLABS_API_KEY:'',BACKUP_DESLIGADO:'1'},stdio:'pipe'});
const H={'X-Inglou':'1','Content-Type':'application/json'};
const artefatos=process.env.BROWSER_ARTIFACTS||path.join(os.tmpdir(),'inglou-browser-artifacts');
async function main(){
 fs.mkdirSync(artefatos,{recursive:true});
 for(let i=0;i<100;i++){try{await fetch(BASE+'/saude');break;}catch{await new Promise(r=>setTimeout(r,75));}}
 for(const [nome,motor]of Object.entries({chromium,webkit})){
  const browser=await motor.launch({headless:true});
  try{for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},reducedMotion:'reduce',...(mobile?{isMobile:true,hasTouch:true}:{}),baseURL:BASE});
   const post=async(url,data)=>{const r=await context.request.post('/api/v1'+url,{headers:H,data});assert.equal(r.status(),200,await r.text());return r.json();};
   const r=await post('/auth/cadastro',{nome:'Aprendiz de teste',email:`${nome}-${mobile}@browser.test`,senha:'frase longa para testar 2026',idade:30,papel:'ambos',consentimento:true});
   assert.ok(r);const perfil=await context.request.put('/api/v1/perfil',{headers:H,data:{objetivo:'zero',minutos_dia:15,dias_semana:5,interesses:[]}});assert.equal(perfil.status(),200);await post('/nivelamento',{nunca:true});
   const page=await context.newPage(),erros=[];page.on('pageerror',e=>erros.push(e.message));
   await page.goto('/app/#/hoje');await page.getByRole('button',{name:'5 minutos',exact:true}).click();
   await page.getByRole('button',{name:'Praticar',exact:true}).click();
   await page.getByRole('button',{name:'Não entendi: mostrar outro apoio',exact:true}).click();
   await page.getByText('Este apoio fica registrado como prática com ajuda.').waitFor();
   let respostas=0;
   while(await page.getByRole('button',{name:'Conferir',exact:true}).count()){
    await page.locator('.opcao').first().click();await page.getByRole('button',{name:'Conferir',exact:true}).click();
    await page.getByRole('button',{name:'Continuar',exact:true}).click();respostas++;
    if(respostas===1){await page.reload();await page.locator('.sessao-palco').waitFor();}
    if(respostas>10)throw Error('A sessão não chegou ao fim.');
   }
   await page.getByRole('button',{name:'Salvar conclusão',exact:true}).click();await page.getByRole('link',{name:'Ver meu progresso',exact:true}).waitFor();
   const sessao=await (await context.request.get('/api/v1/sessao')).json();assert.ok(sessao.sessao.concluida);assert.equal(Object.keys(sessao.sessao.respondidos).length,3);
   const turma=(await post('/turmas',{nome:'Turma de teste da interface'})).turma;
   await page.goto(`/app/#/turma/${turma.id}/nova`);await page.getByRole('heading',{name:'Montar aula',exact:true}).waitFor();
   await page.locator('#at-titulo').fill('Aula criada pela interface');
   await page.locator('.banco-missao > summary').first().click();await page.locator('.banco-item input').first().check();
   await page.getByRole('button',{name:'Salvar rascunho',exact:true}).click();await page.getByRole('link',{name:'Editar rascunho',exact:true}).click();
   await page.locator('#at-titulo').fill('Aula revisada pela interface');
   const [publicacao]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/publicar')&&r.request().method()==='POST'),page.getByRole('button',{name:'Publicar aula',exact:true}).click()]);assert.equal(publicacao.status(),200,await publicacao.text());
   const painel=await (await context.request.get(`/api/v1/turmas/${turma.id}`)).json();
   assert.equal(painel.atividades[0].estado,'publicada');assert.equal(painel.atividades[0].titulo,'Aula revisada pela interface');
   await page.goto(`/app/#/turma/${turma.id}/a${painel.atividades[0].id}`);await page.getByRole('button',{name:'Criar nova versão',exact:true}).click();await page.locator('#at-titulo').waitFor();
   const fala=await page.evaluate(async()=>{
    const {destacarReconhecidas}=await import('/assets/js/fala-acompanhada.js');const el=document.createElement('p');
    for(const t of ["I'm",'happy','happy']){const sp=document.createElement('span');sp.className='palavra-toque';sp.textContent=t;el.append(sp);}
    document.body.append(el);const valores=['I am happy','I am',''].map(t=>{destacarReconhecidas(el,t);return el.querySelectorAll('.fala-reconhecida').length;});el.remove();return valores;
   });assert.deepEqual(fala,[2,1,0]);
   await page.goto('/app/#/passaporte');await page.getByRole('heading',{name:'Passaporte Do Brasil pro mundo'}).waitFor();assert.equal(await page.getByRole('link',{name:'Começar missão',exact:true}).count(),4);
   await page.goto('/app/#/brasil/catch-22');await page.getByRole('heading',{name:'Catch-22: um impasse circular',exact:true}).waitFor();
   await page.getByLabel('Tipo de expressão',{exact:true}).selectOption('ingles-real');assert.equal(await page.locator('.cultura-ficha').count(),5);
   await page.getByLabel('Buscar expressão do Brasil ou do inglês').fill('catch-22');assert.equal(await page.locator('.cultura-ficha').count(),1);
   await page.getByRole('link',{name:'Praticar este tema',exact:true}).click();await page.getByRole('heading',{name:'Catch-22 ou estaca zero?',exact:true}).waitFor();
   await page.goto('/app/#/biblioteca?colecao=ingles-real');await page.getByLabel('Coleção da biblioteca',{exact:true}).waitFor();
   assert.equal(await page.locator('.capitulo-card').count(),3);
   await page.goto('/app/#/desafios');await page.getByRole('heading',{name:'Aprender fica melhor junto'}).waitFor();
   await page.goto('/app/#/loja');await page.getByRole('heading',{name:'Praça brasileira'}).waitFor();
   await page.goto('/app/#/admin');await page.getByRole('heading',{name:'Revisão de conteúdo e qualidade'}).waitFor();
   await page.goto('/');await page.locator('#planos [data-plano="turma"]').waitFor();assert.equal(await page.locator('#planos [data-plano]').count(),5);
   await page.screenshot({path:path.join(artefatos,`${nome}-${mobile?'celular':'desktop'}-planos.png`),fullPage:true});
   const landingWidth=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth}));assert.ok(landingWidth.s<=landingWidth.w+2);
   await page.route('**/api/v1/assinatura',async route=>{const r=await route.fetch();const data=await r.json();delete data.catalogo;delete data.grupo;await route.fulfill({response:r,json:data});});
   await page.goto('/app/#/conta');await page.getByRole('button',{name:'Atualizar planos',exact:true}).waitFor();await page.unroute('**/api/v1/assinatura');
   await page.getByRole('button',{name:'Atualizar planos',exact:true}).click();await page.getByRole('button',{name:'Ver planos e uso',exact:true}).click();
   assert.equal(await page.locator('dialog [data-plano]').count(),5);assert.equal(await page.getByRole('button',{name:'Contratação em breve',exact:true}).count(),4);
   await page.getByRole('button',{name:'Fechar',exact:true}).click();
   await page.goto('/app/#/hoje');await page.locator('.sessao-convite').waitFor();
   const medidas=await page.evaluate(()=>({largura:innerWidth,conteudo:document.documentElement.scrollWidth,viewport:document.querySelector('meta[name=viewport]').content,fontes:[...document.querySelectorAll('input,select,textarea')].map(e=>parseFloat(getComputedStyle(e).fontSize))}));
   assert.ok(medidas.conteudo<=medidas.largura+2,JSON.stringify(medidas));assert.ok(!medidas.viewport.includes('user-scalable=no'));assert.ok(medidas.fontes.every(n=>n>=16));assert.deepEqual(erros,[]);
   await page.screenshot({path:path.join(artefatos,`${nome}-${mobile?'celular':'desktop'}.png`),fullPage:true});
   console.log(`${nome} ${mobile?'celular':'desktop'}: sessão, ajuda, retomada, turma/versões, palavras azuis, cultura, social, loja, admin e acessibilidade OK`);
   await context.close();
  }}finally{await browser.close();}
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{srv.kill();setTimeout(()=>fs.rmSync(dir,{recursive:true,force:true}),300).unref();});
