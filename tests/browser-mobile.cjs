'use strict';
// Auditoria visual com páginas e exercícios reais. Não equivale a um teste em iPhone físico.
// Inclui cortes internos de cartões e diálogos, não apenas a largura total do documento.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const PORT=33700+Math.floor(Math.random()*300),BASE='http://localhost:'+PORT,dir=fs.mkdtempSync(path.join(os.tmpdir(),'inglou-mobile-')),out=process.env.AUDIT_OUT||path.join(os.tmpdir(),'inglou-mobile-artifacts');fs.mkdirSync(out,{recursive:true});
const srv=spawn(process.execPath,['--disable-warning=ExperimentalWarning','server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,NODE_ENV:'test',PORT:String(PORT),DATA_DIR:dir,AUTH_PROVIDER:'local',BACKUP_DESLIGADO:'1',ANTHROPIC_API_KEY:'',ELEVENLABS_API_KEY:'',STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:'',PAGAMENTO_MODO:'desligado',INGLOU_ADMIN_IDS:'1,2,3'},stdio:'ignore'});
async function medir(page){return page.evaluate(()=>{
 const root=document.querySelector('dialog[open]')||document.querySelector('#conteudo')||document.querySelector('main')||document.body,visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return r.width>0&&r.height>0&&s.visibility!=='hidden'&&!e.closest('[hidden],.oculto,.pular');},tag=e=>e.tagName.toLowerCase()+'.'+(typeof e.className==='string'?e.className.trim().replaceAll(' ','.'):''),wordBreaks=[],squeezed=[],overflow=[];
 for(const e of root.querySelectorAll('*')){if(!visible(e)||e instanceof SVGElement)continue;const r=e.getBoundingClientRect();let clipped=false;for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){if(/auto|scroll|hidden|clip/.test(getComputedStyle(a).overflowX)){clipped=true;break;}}
 if(!clipped&&(r.right>innerWidth+2||r.left< -2))overflow.push({el:tag(e),text:e.textContent.trim().slice(0,65),right:Math.round(r.right),left:Math.round(r.left)});
 if(e.matches('button,.btn,input,select,textarea,h1,h2,h3,.janela__corpo,.folha,.exercicio,.radio-capa,.radio-controles,.vocab>li,.msg__balao')&&e.clientWidth&&e.scrollWidth>e.clientWidth+3)squeezed.push({el:tag(e),text:e.textContent.trim().slice(0,90),w:e.clientWidth,scroll:e.scrollWidth});
 }
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){const p=n.parentElement;if(!visible(p)||p.closest('svg,script,style,input,textarea'))continue;for(const match of n.textContent.matchAll(/[\p{L}]{4,}/gu)){const range=document.createRange();range.setStart(n,match.index);range.setEnd(n,match.index+match[0].length);const rects=[...range.getClientRects()].filter(r=>r.width>0);if(new Set(rects.map(r=>Math.round(r.top))).size>1)wordBreaks.push({word:match[0],el:tag(p),text:p.textContent.trim().slice(0,100)});}}
 return{width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,overflow:overflow.slice(0,16),squeezed:squeezed.slice(0,16),wordBreaks:wordBreaks.slice(0,16)};
});}
async function main(){for(let i=0;i<100;i++){try{await fetch(BASE+'/saude');break;}catch{await new Promise(r=>setTimeout(r,50));}}
 const resultados=[],engines=process.env.AUDIT_ENGINES?.split(',')||['chromium','webkit'];
 for(const motor of engines){const browser=await({chromium,webkit}[motor]).launch({headless:true});try{
 const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',baseURL:BASE});
 const R=async(method,url,data)=>{const r=await c.request.fetch('/api/v1'+url,{method,headers:{'X-Inglou':'1','Content-Type':'application/json'},data});if(r.status()!==200)throw Error(url+' '+r.status()+' '+await r.text());return r.json();};
 await R('POST','/auth/cadastro',{nome:'Ana Carolina dos Santos',email:motor+'@mobile.test',idade:32,papel:'ambos',senha:'frase de cadastro para o celular 2026',consentimento:true});await R('PUT','/perfil',{objetivo:'zero',minutos_dia:15,dias_semana:5,interesses:[]});await R('POST','/nivelamento',{nunca:true});
 const turma=(await R('POST','/turmas',{nome:'Inglês para viagens e situações do cotidiano'})).turma;
 const bib=await R('GET','/biblioteca'),unidade=bib.unidades[0]?.id;
 await R('POST','/sessao',{minutos:5});
 const material=await R('POST','/materiais',{titulo:'Getting around a new city',texto:'I am visiting a new city with my family. We would like to find a restaurant near the train station. Could you tell me how to get there? Thank you for your help.'});
 const estudo=await R('POST','/sobmedida',{tipo:'viagem',titulo:'Preparação para viajar com a família',descricao:'aeroporto\nhotel\nrestaurante'});
 const ed=(await R('GET','/sobmedida/'+estudo.id)).estudo;
 const cenarios=(await R('GET','/conversas/cenarios')).cenarios;const conversa=await R('POST','/conversas',{cenario:cenarios[0].id});
 const page=await c.newPage(),errors=[];page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));
 const visitar=async(route,label,acao)=>{try{await page.goto(route.startsWith('/')?route:'/app/?auditoria='+encodeURIComponent(label||route)+'&largura='+page.viewportSize().width+'#/'+route,{waitUntil:'networkidle',timeout:20000});await page.evaluate(()=>document.fonts.ready);if(acao)await acao();for(const b of await page.locator('dialog[open] .janela__x,dialog[open] .janela__acoes .btn').all()){const r=await b.boundingBox();assert.ok(r&&r.y>=0&&r.y+r.height<=page.viewportSize().height+2,'Controle do diálogo fora da altura da tela');}assert.equal(await page.getByRole('heading',{name:'Algo não carregou',exact:true}).count(),0,'A tela falhou ao carregar');const metrics=await medir(page),entry={motor,label:label||route,...metrics};resultados.push(entry);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(resultados,null,2));console.log(motor+' '+page.viewportSize().width+' '+(label||route)+' '+JSON.stringify({overflow:metrics.overflow.length,squeezed:metrics.squeezed.length,words:metrics.wordBreaks.length}));if(metrics.overflow.length||metrics.squeezed.length||metrics.wordBreaks.length||['sessao','conversa/'+conversa.id,'podcast','conta-preferencias'].includes(label||route)||process.env.AUDIT_ALL_SHOTS==='1')await page.screenshot({path:path.join(out,motor+'-'+page.viewportSize().width+'-'+(label||route).replace(/[^\w-]+/g,'_')+'.png'),fullPage:true});}catch(e){resultados.push({motor,label:label||route,error:e.message});console.log('ERROR '+(label||route)+' '+e.message.slice(0,180));await page.screenshot({path:path.join(out,motor+'-'+page.viewportSize().width+'-erro-'+(label||route).replace(/[^\w-]+/g,'_')+'.png'),fullPage:false}).catch(()=>{});}};
 const widths=process.env.AUDIT_COMPLEMENTO==='1'?[]:(process.env.AUDIT_WIDTHS||'320,360,390,430').split(',').map(Number);
 const banco={...require('../src/conteudo/missoes').TODOS_EXERCICIOS,...require('../src/conteudo/biblioteca').BANCO_BIBLIOTECA},porTipo=Object.groupBy(Object.values(banco),e=>e.tipo);
 const fontes=Object.values(porTipo).map(es=>es[0]);
 fontes.push(require('../src/motor/licao-guiada').montarGuiada({perfil:{idade:8,objetivo:'zero'},nivel:'A1',hojeISO:'2026-10-22'},{id:'zero-oi-tchau'}).blocos.flatMap(b=>b.exercicios||[]).find(e=>e.tipo==='pares'));
 const amostras=fontes.filter(Boolean).map(e=>({ex:require('../src/motor/licao').paraCliente({blocos:[{exercicios:[e]}]},'mobile').blocos[0].exercicios[0],retorno:e.tipo==='pares'?{correto:false,pares:e.pares,explica:'Compare as duas colunas e observe o significado de cada expressão.'}:{...require('../src/motor/correcao').corrigirExercicio(e,'resposta de teste'),resposta:'resposta de teste'}}));
 for(const width of widths){await page.setViewportSize({width,height:844});
 for(const route of ['/','/termos/','/politica-de-privacidade/'])await visitar(route);
 for(const route of ['hoje','plano','biblioteca','passaporte','brasil','revisar','conversar','progresso','material','duvidas','conta','podcast','sobmedida','aprender','treino','turmas','professor','publico','perfil','nivelamento','licao','sessao','desafios','colecao','loja','admin','turma/'+turma.id,'turma/'+turma.id+'/nova','material/'+material.id,'conversa/'+conversa.id,'sobmedida/'+estudo.id,...(ed.assuntos?.[0]?['sobmedida/'+estudo.id+'/'+ed.assuntos[0].id]:[]),...(unidade?['biblioteca/'+unidade]:[])])await visitar(route);
 for(const [label,name] of [['conta-planos','Ver planos e uso'],['conta-preferencias','Configurar'],['conta-grupo','Entrar com código'],['conta-lembrete','Configurar']])await visitar('conta',label,async()=>{const b=page.getByRole('button',{name,exact:true});await (label==='conta-lembrete'?b.first():b.last()).click();await page.locator('dialog[open]').waitFor();});
 if(width===320||width===390){
 for(const amostra of amostras)for(const feedback of [false,true])await visitar('hoje','exercicio-'+amostra.ex.tipo+(feedback?'-retorno':''),async()=>{await page.evaluate(async({ex,retorno,feedback})=>{const{exercicio}=await import('/assets/js/telas/exercicio.js');const tela=document.querySelector('#conteudo .tela');tela.replaceChildren(exercicio(ex,{ja:feedback?retorno:null,responder:async()=>retorno,aoProximo:()=>{},permitirTreino:true}));}, {...amostra,feedback});await page.waitForTimeout(80);});
 await visitar('conta','conta-texto-ampliado',async()=>{await page.evaluate(()=>document.documentElement.style.fontSize='20px');await page.getByRole('button',{name:'Ver planos e uso',exact:true}).click();await page.locator('dialog[open]').waitFor();});
 }
 await visitar('hoje','menu-mais',async()=>{await page.locator('.nav__mais').click();await page.locator('dialog[open]').waitFor();});
 }
 await visitar('hoje','pontuacao-traduzida',async()=>{
  const texto='Hello! I am fine, thank you. “Really?” Yes; let’s go (together).';
  await page.evaluate(t=>{const p=document.createElement('p');p.lang='en';p.dataset.auditoriaTraducao='1';p.textContent=t;document.querySelector('#conteudo .tela').replaceChildren(p);},texto);
  const p=page.locator('[data-auditoria-traducao]');await p.locator('.palavra-pontuada').first().waitFor();assert.equal(await p.textContent(),texto,'A tradução deve preservar texto e pontuação');
 });
 for(const viewport of [{width:320,height:568},{width:568,height:320}]){
  await page.setViewportSize(viewport);
  await visitar('conta','janela-baixa-'+viewport.height,async()=>{await page.getByRole('button',{name:'Ver planos e uso',exact:true}).click();await page.locator('dialog[open]').waitFor();});
  await visitar('conta','formulario-baixo-'+viewport.height,async()=>{await page.getByRole('button',{name:'Entrar com código',exact:true}).click();await page.locator('dialog[open]').waitFor();});
  await visitar('conversa/'+conversa.id,'traducao-'+viewport.height,async()=>{await page.locator('.palavra-traduzivel').first().click();const balao=page.locator('.traducao-balao');await balao.waitFor();const r=await balao.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=viewport.width+2&&r.y>=0&&r.y+r.height<=viewport.height+2,'Tradução fora da tela');});
 }
 const visitante=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce',baseURL:BASE});
 // Configuração de autenticação simulada; nenhum e-mail, login externo ou pagamento é enviado.
 await visitante.route('**/api/v1/auth/fluxo',r=>r.fulfill({json:{etapa:null}}));
 await visitante.route('**/api/v1/auth/estado',r=>r.fulfill({json:{logado:false,autenticacao:{provedor:'supabase',disponivel:true,recuperacao:true,google:true}}}));
 const entrada=await visitante.newPage();entrada.setDefaultTimeout(7000);
 for(const width of [320,390])for(const modo of ['entrar','cadastro','recuperar']){
  await entrada.setViewportSize({width,height:568});await entrada.goto('/app/?auth-audit='+modo+'-'+width+'#/entrar'+(modo==='cadastro'?'?modo=cadastro':''),{waitUntil:'networkidle'});
  if(modo==='recuperar')await entrada.getByRole('button',{name:'Esqueci minha senha',exact:true}).click();
  await entrada.getByRole('heading',{name:modo==='entrar'?'Entre na sua conta':modo==='cadastro'?'Crie sua conta':'Esqueceu a senha?',exact:true}).waitFor();
  const m=await medir(entrada);resultados.push({motor,label:'auth-'+modo,...m});
 }
 await visitante.close();
 await visitar('treino','treino-inicial',async()=>{await page.getByRole('heading',{name:'Vamos preparar seu treino',exact:true}).waitFor();});
 assert.deepEqual(errors,[],'Erros de JavaScript');
 // A idade muda a apresentação. Verificar as variantes com conteúdo real.
 for(const [idade,faixa] of [[8,'crianca'],[16,'adolescente'],[70,'idoso']]){
  await R('PUT','/perfil/publico',{idade,papel:'aluno',responsavel:true,regiao:'sudeste'});
  for(const width of [320,390]){await page.setViewportSize({width,height:844});for(const route of ['hoje','biblioteca','licao','conta','conversa/'+conversa.id])await visitar(route,'idade-'+faixa+'-'+route);}
 }
 await R('PUT','/perfil/publico',{idade:35,papel:'professor',responsavel:false,regiao:'sudeste'});
 for(const width of [320,390]){await page.setViewportSize({width,height:844});for(const route of ['professor','turma/'+turma.id,'conta'])await visitar(route,'professor-'+route);
  await visitar('turma/'+turma.id+'/nova','editor-banco-aberto',async()=>{await page.locator('.banco-missao>summary').first().click();});
 }
 await c.close();}finally{await browser.close();}}
 const problemas=resultados.filter(r=>r.error||r.scroll>r.width+2||r.overflow?.length||r.squeezed?.length||r.wordBreaks?.length);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(resultados,null,2));console.log(JSON.stringify({pages:resultados.length,issues:problemas},null,2));assert.equal(problemas.length,0,'Há conteúdo cortado, palavras partidas ou falha de renderização; veja report.json');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>{srv.kill();setTimeout(()=>fs.rmSync(dir,{recursive:true,force:true}),500).unref();});
