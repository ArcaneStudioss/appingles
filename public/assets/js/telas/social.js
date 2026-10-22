import { api } from '../api.js?v=__V__';
import { h, icone, toast, ocupado, janela, formulario, confirmar } from '../ui.js?v=__V__';
import { lou } from '../diversao.js?v=__V__';
import { nomeConquista } from './hoje.js?v=__V__';
const POST = (url, corpo = {}) => api('/social' + url, { metodo: 'POST', corpo });
const DATA = t => t ? new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
const RARIDADE = { comum: 'Comum', rara: 'Rara', epica: 'Épica', lendaria: 'Lendária' };
const ESTADO = { escolha: 'Amigo escolhendo', confirmacao: 'Aguardando confirmação final', ativo: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado', expirado: 'Convite expirado', convite: 'Reunindo o grupo', encerrado: 'Período encerrado' };
const nome = c => c.modelo.startsWith('conquista:') ? nomeConquista(c.modelo.slice(10)) : c.nome;
function figurinha(c) {
 return h('article', { class: 'colecao-carta raridade-' + c.raridade, 'data-figurinha': c.id },
  h('span', { class: 'colecao-raridade' }, RARIDADE[c.raridade]),
  h('div', { class: 'colecao-arte', 'aria-hidden': 'true' }, lou(c.raridade === 'lendaria' ? 'festa' : 'feliz', { tamanho: 76, mia: c.modelo === 'pratica-2' }), h('span', {}, c.imagem)),
  h('strong', {}, nome(c)), h('small', {}, 'Valor de coleção: ' + c.valor), c.reservada ? h('span', { class: 'chip' }, icone('lock'), 'Reservada no duelo') : null);
}
function carteira(d) {
 return h('section', { class: 'social-carteira', 'aria-label': 'XP e moedas' },
  h('a', { href: '#/loja', class: 'social-saldo' }, h('span', { 'aria-hidden': 'true' }, '🪙'), h('strong', {}, String(d.saldo)), ' moedas'),
  h('div', {}, h('strong', {}, d.xp + ' XP'), h('small', {}, 'Nível de XP ' + d.nivel), h('progress', { max: 100, value: d.xp % 100, 'aria-label': 'XP até o próximo nível' })),
  d.pocaoAte ? h('span', { class: 'chip c-lilas' }, '🧪 XP em dobro até ' + new Date(d.pocaoAte).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})) : null);
}
function links(ativo) {return h('nav', { class: 'social-links', 'aria-label': 'Desafios e coleção' }, [['desafios','Desafios'],['colecao','Figurinhas'],['loja','Loja']].map(([rota,t]) => h('a', { class: 'btn btn-sec btn-peq', href: '#/'+rota, 'aria-current': ativo===rota?'page':null },t)));}
function cabeca(el,d,ativo,titulo,texto) {el.append(links(ativo),h('header',{class:'cabeca c-lilas'},h('span',{class:'bolha'},icone('users-three')),h('div',{},h('h1',{},titulo),h('p',{class:'ajuda'},texto))),carteira(d));}
function botao(texto,fn,classe='btn btn-sec btn-peq') {
 const b=h('button',{type:'button',class:classe},texto);b.addEventListener('click',async()=>{ocupado(b,true);try{await fn();}catch(e){toast(e.message,{tipo:'erro'});}finally{ocupado(b,false);}});return b;
}
async function escolherCarta(titulo,colecao,aoEscolher,texto='Escolha a figurinha que você quer ganhar.') {
 const livres=colecao.filter(c=>!c.reservada);if(!livres.length){toast('Não há figurinhas disponíveis para este desafio.');return;}
 let escolhida=null,j;
 const b=botao('Confirmar figurinha',async()=>{if(!escolhida){toast('Selecione uma figurinha.');return;}await aoEscolher(escolhida);j.fechar(true);},'btn');
 const grade=h('div',{class:'colecao-grade selecao-figurinhas'},livres.map(c=>{
  const radio=h('input',{type:'radio',name:'figurinha',value:c.id,'aria-label':nome(c)+' · '+RARIDADE[c.raridade]});
  radio.addEventListener('change',()=>{escolhida=c.id;});return h('label',{class:'selecao-figurinha'},radio,figurinha(c));
 }));
 j=janela({titulo,corpo:h('div',{},h('p',{},texto),grade),acoes:[b],larga:true});
}
export async function telaSocial(el) {
 let d=await api('/social'),aba=new URLSearchParams(location.hash.split('?')[1]||'').get('aba')||'amigos';
 if(!['amigos','duelos','grupos'].includes(aba))aba='amigos';
 const conteudo=h('div',{}),saldo=h('div',{});
 const atualizar=async()=>{const novo=await api('/social');if(!el.isConnected)return;d=novo;desenhar();};
 const cab=h('div',{});el.append(cab,saldo,h('nav',{class:'social-abas','aria-label':'Tipo de desafio'},['amigos','duelos','grupos'].map(a=>botao(({amigos:'Amigos',duelos:'Duelos',grupos:'Metas em grupo'})[a],async()=>{aba=a;desenhar();}))),conteudo);
 function desenhar() {
  cab.replaceChildren();cabeca(cab,d,'desafios','Aprender fica melhor junto','Combine uma disputa ou alcance uma meta com seus amigos.');
  el.querySelectorAll('.social-abas button').forEach((b,i)=>b.setAttribute('aria-pressed',String(['amigos','duelos','grupos'][i]===aba)));
  conteudo.replaceChildren();
  if(aba==='amigos') amigos();else if(aba==='duelos') duelos();else grupos();
 }
 async function desafiar(amigo) {
  const f=await formulario({titulo:'Desafiar '+amigo.apelido,campos:[{nome:'dias',rotulo:'Duração',tipo:'select',opcoes:[2,7,30].map(n=>({valor:n,rotulo:n+' dias'})),valor:7}],texto:'Vocês disputam quem faz mais exercícios corretos válidos. Você escolhe uma figurinha dele; ele escolhe uma sua. Antes de começar, você confirma as duas.',enviar:'Escolher figurinha',aoEnviar:v=>v});
  if(!f)return;const c=await api('/social/amigos/'+amigo.id+'/colecao');
  await escolherCarta('Qual figurinha você quer ganhar?',c.colecao,async figurinhaId=>{await POST('/duelos',{amigoId:amigo.id,dias:Number(f.dias),figurinhaId});aba='duelos';await atualizar();});
 }
 function amigos() {
  const codigo=h('input',{type:'text',maxlength:30,placeholder:'ING-…','aria-label':'Código do amigo',autocapitalize:'characters'});
  const enviar=h('button',{type:'submit',class:'btn'},'Enviar pedido');
  const form=h('form',{class:'social-pedido'},h('label',{},'Encontrar pelo código',codigo),enviar);
  form.addEventListener('submit',async e=>{e.preventDefault();ocupado(enviar,true);try{await POST('/amigos',{codigo:codigo.value});await atualizar();toast('Pedido enviado. A amizade começa quando a pessoa aceitar.');}catch(e){toast(e.message,{tipo:'erro'});}finally{ocupado(enviar,false);}});
  conteudo.append(h('section',{class:'folha'},h('h2',{},'Seu código de amizade'),h('p',{class:'social-codigo'},d.eu.codigo),h('p',{class:'ajuda'},'Compartilhe com quem você conhece. Só seu apelido, sua coleção e o placar dos desafios aparecem para os amigos.'),
   h('div',{class:'linha-acoes'},botao('Copiar código',async()=>{try{await navigator.clipboard.writeText(d.eu.codigo);toast('Código copiado.');}catch{toast('Seu código é '+d.eu.codigo);}}),botao('Editar apelido',async()=>{await formulario({titulo:'Seu apelido',campos:[{nome:'apelido',rotulo:'Como seus amigos veem você',valor:d.eu.apelido,max:24,obrigatorio:true}],aoEnviar:async v=>{await api('/social/perfil',{metodo:'PUT',corpo:v});await atualizar();}});})),form));
  if(d.pedidos.length) {
   const pedidos=h('ul',{class:'social-lista'});
   for(const p of d.pedidos) pedidos.append(h('li',{},h('strong',{},p.apelido),p.recebido ?
    h('div',{class:'linha-acoes'},
     botao('Aceitar',async()=>{await POST('/amigos/'+p.id+'/responder',{acao:'aceitar'});await atualizar();}),
     botao('Recusar',async()=>{await POST('/amigos/'+p.id+'/responder',{acao:'recusar'});await atualizar();})) :
    h('span',{class:'ajuda'},'Aguardando resposta')));
   conteudo.append(h('section',{class:'folha'},h('h2',{},'Pedidos de amizade'),pedidos));
  }
  conteudo.append(h('section',{class:'folha'},h('h2',{},'Seus amigos'),d.amigos.length?h('ul',{class:'social-lista'},d.amigos.map(a=>h('li',{},h('strong',{},a.apelido),h('div',{class:'linha-acoes'},botao('Desafiar',()=>desafiar(a)),botao('Bloquear',async()=>{if(!await confirmar({titulo:'Bloquear '+a.apelido+'?',texto:'A amizade e os convites pendentes serão removidos. Duelos já iniciados mantêm as regras até o fim.',ok:'Bloquear'}))return;await api('/social/amigos/'+a.id,{metodo:'DELETE',corpo:{bloquear:true}});await atualizar();}))))):h('p',{class:'ajuda'},'Troque códigos e aceite a amizade para criar o primeiro desafio.')));
 }
 function duelos() {
  conteudo.append(h('section',{class:'folha'},h('h2',{},'Dois amigos, duas figurinhas'),h('p',{},'Dispute por 2, 7 ou 30 dias. O vencedor fica com a figurinha que escolheu do amigo e mantém a sua. Empate: cada um continua com a própria.'),h('p',{class:'ajuda'},'As figurinhas ficam reservadas só depois que o amigo faz a escolha. O relógio começa na confirmação final. Não dá para desistir depois do início.'),botao('Ver amigos para desafiar',async()=>{aba='amigos';desenhar();}),botao('Atualizar placares',atualizar)));
  if(!d.duelos.length)conteudo.append(h('p',{class:'folha'},'Seu primeiro duelo começa com um convite a um amigo.'));
  for(const x of d.duelos) {
   const card=h('section',{class:'folha social-desafio','data-duelo':x.id},h('div',{class:'linha-acoes'},h('span',{class:'chip c-lilas'},x.dias+' dias'),h('span',{class:'chip'},ESTADO[x.estado])),h('h2',{},x.criador.apelido+' × '+x.convidado.apelido));
   if(x.inicio)card.append(h('p',{class:'social-placar'},x.placarCriador+' × '+x.placarConvidado),h('p',{class:'ajuda'},'Término: '+DATA(x.fim)));
   card.append(h('div',{class:'social-apostas'},x.figurinhaDoConvidado?h('div',{},h('p',{class:'rotulo-pequeno'},x.criador.apelido+' escolheu'),figurinha(x.figurinhaDoConvidado)):null,x.figurinhaDoCriador?h('div',{},h('p',{class:'rotulo-pequeno'},x.convidado.apelido+' escolheu'),figurinha(x.figurinhaDoCriador)):null));
   if(x.estado==='escolha'&&!x.euSouCriador)card.append(botao('Escolher a figurinha dele',async()=>{const c=await api('/social/amigos/'+x.criador.id+'/colecao');await escolherCarta('Escolha o que quer ganhar',c.colecao,async figurinhaId=>{await POST('/duelos/'+x.id+'/escolher',{figurinhaId});await atualizar();},'Ao escolher, você aceita colocar a sua figurinha mostrada neste convite em disputa. As duas ficarão reservadas até a confirmação do amigo.');}));
   if(x.estado==='confirmacao'&&x.euSouCriador)card.append(botao('Confirmar as duas e começar',async()=>{if(!await confirmar({titulo:'Começar o duelo?',texto:'Você pode ganhar '+nome(x.figurinhaDoConvidado)+' ou perder '+nome(x.figurinhaDoCriador)+'. O duelo dura '+x.dias+' dias e não pode ser cancelado após começar.',ok:'Aceitar e começar'}))return;await POST('/duelos/'+x.id+'/confirmar');await atualizar();},'btn'));
   if(['escolha','confirmacao'].includes(x.estado))card.append(h('p',{class:'ajuda'},'Responda até '+DATA(x.expiraEm)),botao('Recusar ou cancelar convite',async()=>{await POST('/duelos/'+x.id+'/cancelar');await atualizar();}));
   if(x.estado==='concluido')card.append(h('p',{class:'aviso-suave'},x.vencedor?x.vencedor===d.eu.id?'Você ganhou! A figurinha já está na sua coleção.':'Seu amigo ganhou. Sua conquista pessoal continua registrada.':'Empatou! Cada um ficou com sua figurinha.'));
   conteudo.append(card);
  }
  regras();
 }
 async function criarGrupo() {
  if(!d.amigos.length){toast('Adicione um amigo antes de criar um grupo.');return;}
  const form=h('form',{}),n=h('input',{maxlength:50,required:true,placeholder:'Time do inglês','aria-label':'Nome do grupo'}),tipo=h('select',{'aria-label':'Tipo de meta'},h('option',{value:'exercicios'},'Somar exercícios juntos'),h('option',{value:'sequencia'},'Manter uma sequência juntos')),dias=h('select',{'aria-label':'Duração'},[2,7,30].map(i=>h('option',{value:i},i+' dias'))),meta=h('input',{type:'number',min:1,max:10000,value:20,'aria-label':'Meta do grupo'}),diaria=h('input',{type:'number',min:1,max:20,value:3,'aria-label':'Exercícios por pessoa por dia'});
  const rotulo=h('span',{},'Total de exercícios'),diariaCampo=h('label',{hidden:true},'Exercícios por pessoa a cada 24 horas',diaria);
  const check=d.amigos.map(a=>({a,c:h('input',{type:'checkbox',value:a.id})}));let j;
  const erro=h('p',{class:'erro-campo',role:'status'}),b=h('button',{type:'submit',class:'btn'},'Convidar o grupo');
  const ajustar=()=>{const seq=tipo.value==='sequencia';rotulo.textContent=seq?'Quantos dias seguidos?':'Total de exercícios';meta.max=seq?dias.value:10000;if(seq&&Number(meta.value)>Number(dias.value))meta.value=dias.value;diariaCampo.hidden=!seq;};tipo.addEventListener('change',ajustar);dias.addEventListener('change',ajustar);
  form.append(h('label',{},'Nome do grupo',n),h('label',{},'Meta',tipo),h('label',{},'Duração',dias),h('label',{},rotulo,meta),diariaCampo,h('p',{class:'ajuda'},'Na sequência, cada pessoa precisa alcançar a meta diária. Os dias são blocos de 24 horas a partir do início. O grupo ganha uma figurinha épica ao cumprir a meta.'),h('fieldset',{},h('legend',{},'Convide até 9 amigos'),check.map(({a,c})=>h('label',{class:'social-check'},c,a.apelido))),erro,b);
  form.addEventListener('submit',async e=>{e.preventDefault();ocupado(b,true);try{await POST('/grupos',{nome:n.value,tipo:tipo.value,dias:Number(dias.value),meta:Number(meta.value),diaria:Number(diaria.value),amigos:check.filter(x=>x.c.checked).map(x=>x.a.id)});j.fechar(true);await atualizar();}catch(e){erro.textContent=e.message;}finally{ocupado(b,false);}});
  j=janela({titulo:'Nova meta em grupo',corpo:form});
 }
 function grupos() {
  conteudo.append(h('section',{class:'folha'},h('h2',{},'Uma meta, o time todo'),h('p',{},'Somem exercícios ou mantenham uma sequência juntos. Sem colocar figurinhas em disputa: ao cumprir a meta, todos ganham uma figurinha épica.'),botao('Criar meta em grupo',criarGrupo,'btn'),botao('Atualizar metas',atualizar)));
  for(const g of d.grupos) {
   const valor=g.tipo==='exercicios'?g.total:g.recorde,c=h('section',{class:'folha social-desafio','data-grupo':g.id},h('span',{class:'chip'},ESTADO[g.estado]),h('h2',{},g.nome),h('p',{},g.tipo==='exercicios'?`${g.total} de ${g.meta} exercícios em ${g.dias} dias`:`Melhor sequência: ${g.recorde} de ${g.meta} dias · atual: ${g.sequencia}`),h('progress',{max:g.meta,value:Math.min(valor,g.meta),'aria-label':'Progresso da meta do grupo'}),g.tipo==='sequencia'?h('p',{class:'ajuda'},`${g.diaria} exercícios por pessoa em cada bloco de 24 horas. Todos precisam participar.`):null,
    h('ul',{class:'social-lista'},g.participantes.map(p=>h('li',{},p.apelido,h('strong',{},p.pontos+' exercícios')))),g.convites.length?h('p',{class:'ajuda'},g.convites.map(p=>p.apelido+': '+(p.estado==='pendente'?'aguardando':'não participa')).join(' · ')):null);
   if(g.fim)c.append(h('p',{class:'ajuda'},'Até '+DATA(g.fim)));
   if(g.estado==='convite'&&g.minhaResposta==='pendente')c.append(h('p',{class:'ajuda'},'Você escolhe participar. O criador só começa depois dos aceites.'),botao('Participar',async()=>{await POST('/grupos/'+g.id+'/acao',{acao:'aceitar'});await atualizar();}),botao('Não participar',async()=>{await POST('/grupos/'+g.id+'/acao',{acao:'recusar'});await atualizar();}));
   if(g.estado==='convite'&&g.criador===d.eu.id)c.append(botao('Começar com quem aceitou',async()=>{await POST('/grupos/'+g.id+'/acao',{acao:'iniciar'});await atualizar();},'btn'),h('p',{class:'ajuda'},'Mínimo de duas pessoas. Quem ainda não aceitou fica fora desta rodada.'));
   if(['convite','ativo'].includes(g.estado)&&g.minhaResposta==='aceito')c.append(botao('Encerrar grupo',async()=>{if(!await confirmar({titulo:'Encerrar esta meta?',texto:'A rodada será encerrada para todos. Nenhuma figurinha será retirada.',ok:'Encerrar'}))return;await POST('/grupos/'+g.id+'/acao',{acao:'encerrar'});await atualizar();}));
   if(g.estado==='concluido')c.append(h('p',{class:'aviso-suave'},'Meta cumprida! A figurinha épica já está na coleção de cada participante.'));
   conteudo.append(c);
  }
  if(!d.grupos.length)conteudo.append(h('p',{class:'folha'},'Crie um time para alcançar a primeira meta juntos.'));
  regras();
 }
 function regras(){conteudo.append(h('details',{class:'folha'},h('summary',{},'O que conta no placar?'),h('p',{class:'ajuda'},d.regras)));}
 desenhar();
}
export async function telaColecao(el) {
 const d=await api('/social');cabeca(el,d,'colecao','Suas figurinhas','As conquistas pessoais ficam no álbum. Estas cópias pertencem a você e podem circular nos duelos.');
 const filtro=h('select',{'aria-label':'Filtrar figurinhas por raridade'},h('option',{value:''},'Todas as raridades'),Object.entries(RARIDADE).map(([id,n])=>h('option',{value:id},n))),grade=h('div',{class:'colecao-grade'});
 const desenhar=()=>{const cartas=d.colecao.filter(c=>!filtro.value||c.raridade===filtro.value);grade.replaceChildren(cartas.length?cartas.map(figurinha):h('p',{class:'folha'},'Você ainda não tem figurinhas dessa raridade.'));};filtro.addEventListener('change',desenhar);
 el.append(h('p',{class:'ajuda'},'Ganhe uma figurinha a cada 5 exercícios válidos. A cada 25 pontos ela é rara; a cada 100, épica. Metas em grupo dão épicas; marcos de sequência e caixas também podem dar lendárias.'),h('label',{},'Sua coleção',filtro),grade);desenhar();
}
export async function telaLoja(el) {
 let d=await api('/social'),mensagem='';
 const atualizar=async()=>{const novo=await api('/social');if(!el.isConnected)return;d=novo;desenhar();};
 function desenhar() {
  el.replaceChildren();cabeca(el,d,'loja','Loja do Inglou','Troque as moedas que você ganhou estudando. XP mede atividade no app, não seu nível de inglês.');
  if(mensagem)el.append(h('p',{class:'aviso-suave',role:'status'},mensagem));
  const chances=h('p',{class:'ajuda'},Object.values(d.raridades).map(r=>r.nome+': '+r.chance+'%').join(' · '));
  const estoque=h('section',{class:'folha'},h('h2',{},'Seus itens'),h('div',{class:'loja-produtos'},['caixa','pocao'].map(produto=>{
   let chave=crypto.randomUUID();const qtd=d.inventario[produto]||0,b=botao(produto==='caixa'?'Abrir uma caixa':'Ativar XP em dobro por 30 min',async()=>{
    const r=await POST('/loja/usar',{produto,chave});chave=crypto.randomUUID();mensagem=r.figurinha?'Figurinha adicionada à coleção.':'Poção ativada! XP em dobro até '+DATA(r.ate)+'.';await atualizar();
    if(r.figurinha)janela({titulo:'Sua nova figurinha!',corpo:h('div',{class:'loja-revelacao'},figurinha(r.figurinha),h('p',{},'Já está na sua coleção.'))});
   });b.disabled=!qtd||(produto==='pocao'&&!!d.pocaoAte);
   return h('div',{},h('h3',{},produto==='caixa'?'📦 Caixas: '+qtd:'🧪 Poções: '+qtd),produto==='caixa'?h('p',{class:'ajuda'},Object.values(d.raridades).map(r=>r.nome+': '+r.chance+'%').join(' · ')):null,b);
  })));
  el.append(estoque,h('section',{class:'folha'},h('h2',{},'Escolha o que levar'),h('div',{class:'loja-produtos'},d.loja.produtos.map(p=>{
   let chave=crypto.randomUUID();const b=botao('Comprar por '+p.preco+' moedas',async()=>{const r=await POST('/loja/comprar',{produto:p.id,chave});chave=crypto.randomUUID();mensagem=r.produto==='caixa'?'Caixa guardada em Seus itens.':'Poção guardada. Ative quando quiser começar os 30 minutos.';await atualizar();},'btn');b.disabled=d.saldo<p.preco;
   return h('article',{},h('h3',{},(p.id==='caixa'?'📦 ':'🧪 ')+p.nome),h('p',{},p.descricao),p.id==='caixa'?h('p',{class:'ajuda'},Object.values(d.raridades).map(r=>r.nome+': '+r.chance+'%').join(' · ')):null,b,d.saldo<p.preco?h('p',{class:'ajuda'},'Faltam '+(p.preco-d.saldo)+' moedas.'):null);
  }))),h('details',{class:'folha'},h('summary',{},'Chances das caixas e raridades'),chances,h('p',{class:'ajuda'},'Cada caixa entrega uma figurinha. Podem vir repetidas. O valor de coleção ajuda a comparar raridades; não é saldo de moedas.')),
   h('details',{class:'folha'},h('summary',{},'Como ganhar XP e moedas'),h('p',{},'Exercício válido: 10 XP e 1 moeda. Concluir uma lição, um capítulo, treino ou aula da turma: mais 25 XP. A poção dobra o XP futuro por 30 minutos. Ela não acumula com outra e não muda moedas ou placares.'),h('p',{class:'ajuda'},d.regras)),
   h('div',{class:'linha-acoes'},botao('Atualizar saldo e itens',atualizar)),h('details',{class:'folha'},h('summary',{},'Extrato de moedas'),d.extrato.length?h('ul',{class:'social-lista'},d.extrato.map(e=>h('li',{},h('span',{},e.motivo,h('small',{},DATA(e.em))),h('strong',{},(e.quantidade>0?'+':'')+e.quantidade)))):h('p',{},'Suas primeiras moedas aparecem aqui depois dos exercícios.')));
 }
 desenhar();
}
