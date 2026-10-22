'use strict';
const { randomBytes, randomInt } = require('node:crypto');
const { ErroHttp } = require('./http');
const { transacao } = require('./db');
const auth = require('./auth');
const DIA = 864e5, PRAZO = 3 * DIA;
const CARTAS = {
 'bem-vindo': ['Passaporte para o mundo', '🌎'],
 'pratica-1': ['Tuiuiú explorador', '🦜'], 'pratica-2': ['Mia em viagem', '🧳'],
 'pratica-3': ['Conversa na praça', '💬'], 'pratica-4': ['Sabores do Brasil', '🍊'],
 'pratica-5': ['Ponte de palavras', '🌉'], 'pratica-6': ['Música sem fronteiras', '🎵'],
 'grupo-exercicios': ['Time que aprende junto', '🤝'], 'grupo-sequencia': ['Constância em equipe', '🔥'],
};
const LIMITE_PLACAR = 20;
const REGRAS = 'Cada exercício correto na primeira tentativa, sem dica ou resposta revelada, rende 1 moeda e 1 ponto. A mesma questão conta uma vez por dia, em UTC. Repetições, cartões com nota própria e nivelamento não pontuam. A cada 5 pontos você ganha uma figurinha. Só conta o que for feito depois do início e antes do fim do desafio. Nos desafios contam no máximo 20 exercícios por dia UTC, ou um dia de constância. Desafios amistosos não retiram itens. Só adultos podem combinar troca de cópias repetidas; conquistas pessoais não são transferidas. Empate conserva as cópias.';
const RARIDADES = { comum: {nome:'Comum',chance:65,valor:1}, rara: {nome:'Rara',chance:25,valor:3}, epica: {nome:'Épica',chance:9,valor:8}, lendaria: {nome:'Lendária',chance:1,valor:25} };
const PRODUTOS = [{id:'cenario-praca',nome:'Praça brasileira',preco:25,descricao:'Personalização permanente do fundo. Não muda XP, moedas ou aprendizagem.'},{id:'cenario-sol',nome:'Pôr do sol',preco:25,descricao:'Personalização permanente do fundo. Pode trocar quando quiser.'},{id:'caixa',nome:'Caixa de figurinhas',preco:15,descricao:'Uma figurinha surpresa. Confira as chances antes de abrir.'},{id:'pocao',nome:'Poção de XP em dobro',preco:20,descricao:'Dobra o XP ganho durante 30 minutos após ativar. Não altera moedas nem placares por exercícios.'}];
function criarSocial(db, { agora = () => new Date(), sortear = randomInt } = {}) {
 const q = sql => db.prepare(sql), iso = () => agora().toISOString(), mais = (d, ms) => new Date(Date.parse(d) + ms).toISOString();
 const xp = uid => q('SELECT COALESCE(SUM(quantidade),0) n FROM xp_extrato WHERE user_id=?').get(uid).n;
 const saldo = uid => q('SELECT COALESCE(SUM(quantidade),0) n FROM moedas_extrato WHERE user_id = ?').get(uid).n;
 const bloqueado = (a,b) => !!q('SELECT 1 FROM social_bloqueios WHERE (user_id=? AND bloqueado_id=?) OR (user_id=? AND bloqueado_id=?)').get(a,b,b,a);
 const amigo = (a,b) => !bloqueado(a,b) && !!q("SELECT 1 FROM amizades WHERE estado='aceita' AND ((de=? AND para=?) OR (de=? AND para=?))").get(a,b,b,a);
 function exigirAmigo(a,b) { if(!amigo(a,b)) throw new ErroHttp(403,'Aceitem a amizade antes de criar um desafio.'); }
 function perfil(uid) {
  let p=q('SELECT * FROM social_perfis WHERE user_id=?').get(uid);
  if(!p) {
   const nome=q('SELECT nome FROM usuarios WHERE id=?').get(uid)?.nome;
   if(!nome) throw new ErroHttp(404,'Pessoa não encontrada.');
   q('INSERT OR IGNORE INTO social_perfis(user_id,codigo,apelido) VALUES(?,?,?)').run(uid,'ING-'+randomBytes(6).toString('hex').toUpperCase(),nome.trim().split(/\s+/)[0].slice(0,24)||'Aprendiz');
   p=q('SELECT * FROM social_perfis WHERE user_id=?').get(uid);
  }
  q('INSERT OR IGNORE INTO colecao_figurinhas(user_id,modelo,origem_chave,criada_em) VALUES(?,?,?,?)').run(uid,'bem-vindo','boas-vindas:'+q('SELECT identidade FROM social_identidades WHERE user_id=?').get(uid).identidade,iso());
  return {id:uid,codigo:p.codigo,apelido:p.apelido};
 }
 const pessoa = uid => {const p=q('SELECT apelido FROM social_perfis WHERE user_id=?').get(uid);return {id:uid,apelido:p?.apelido||'Aprendiz'};};
 const adulto = uid => { const idade=q('SELECT idade FROM perfis WHERE user_id=?').get(uid)?.idade;return Number.isInteger(idade)&&idade>=18; };
 function repetidas(c) { return q('SELECT COUNT(*) n FROM colecao_figurinhas WHERE user_id=? AND modelo=? AND raridade=?').get(c.user_id,c.modelo,c.raridade).n; }
 function trocaPermitida(a,b) { if(!adulto(a)||!adulto(b)) throw new ErroHttp(403,'Trocas em desafios são opcionais e exclusivas para adultos. Escolha um desafio amistoso, sem perder figurinhas.'); }
 function copiaRepetida(c) { if(c.modelo.startsWith('conquista:') || repetidas(c)<2)throw new ErroHttp(409,'Escolha uma cópia repetida. Sua última cópia e suas conquistas ficam protegidas.'); }
 const conquistasNomes={'primeira-licao':'Minha primeira aula','primeira-conversa':'Minha primeira conversa','primeira-demonstracao':'Consegui fazer sozinho','primeira-sessao':'Minha primeira sessão guiada',retido:'Lembrei em outra situação'};
 function nomeDaCarta(c){const codigo=c.modelo.replace(/^conquista:/,'');if(codigo.startsWith('passaporte:'))return 'Passaporte: '+(require('./conteudo/biblioteca').POR_UNIDADE[codigo.slice(11)]?.titulo||'Missão cultural');return CARTAS[c.modelo]?.[0]||conquistasNomes[codigo]||'Figurinha de conquista';}
 function carta(c) {
  if(!c) return null;
  return {id:c.id,repetidas:repetidas(c),transferivel:adulto(c.user_id)&&!c.modelo.startsWith('conquista:')&&repetidas(c)>1,modelo:c.modelo,nome:nomeDaCarta(c),imagem:CARTAS[c.modelo]?.[1]||'🏅',raridade:c.raridade,valor:RARIDADES[c.raridade].valor,reservada:!!q('SELECT 1 FROM figurinhas_reservas WHERE figurinha_id=?').get(c.id),criadaEm:c.criada_em};
 }
 const colecao = uid => q('SELECT * FROM colecao_figurinhas WHERE user_id=? ORDER BY id DESC LIMIT 500').all(uid).map(carta);
 function disponivel(id,uid) { const c=q('SELECT * FROM colecao_figurinhas WHERE id=? AND user_id=?').get(id,uid);if(!c||q('SELECT 1 FROM figurinhas_reservas WHERE figurinha_id=?').get(id)) throw new ErroHttp(409,'Essa figurinha não está disponível. Escolha outra.');copiaRepetida(c); if(q('SELECT COUNT(*) n FROM colecao_figurinhas f WHERE user_id=? AND modelo=? AND raridade=? AND NOT EXISTS(SELECT 1 FROM figurinhas_reservas r WHERE r.figurinha_id=f.id)').get(uid,c.modelo,c.raridade).n<2)throw new ErroHttp(409,'Uma cópia deve continuar livre na sua coleção.');return c; }
 const contar = (uid,inicio,fim,marco=0,criterio='exercicios') => q('SELECT COALESCE(SUM('+(criterio==='constancia'?'1':'MIN(n,'+LIMITE_PLACAR+')')+'),0) n FROM (SELECT COUNT(*) n FROM pontos_estudo WHERE user_id=? AND em>=? AND em<? AND id>? GROUP BY substr(em,1,10))').get(uid,inicio,fim,marco).n;
 function meuDuelo(id,uid) { const d=q('SELECT * FROM duelos WHERE id=? AND (criador=? OR convidado=?)').get(id,uid,uid);if(!d)throw new ErroHttp(404,'Desafio não encontrado.');return d; }
 const liberar = id => q('DELETE FROM figurinhas_reservas WHERE duelo_id=?').run(id);
 function membros(gid) {return q("SELECT user_id FROM grupos_membros WHERE grupo_id=? AND estado='aceito' ORDER BY user_id").all(gid).map(x=>x.user_id);}
 function meuGrupo(id,uid) {const g=q('SELECT g.* FROM grupos_desafio g JOIN grupos_membros m ON m.grupo_id=g.id WHERE g.id=? AND m.user_id=? AND m.estado<>\'recusado\'').get(id,uid);if(!g)throw new ErroHttp(404,'Grupo não encontrado.');return g;}
 function placarGrupo(g) {
  const ids=membros(g.id), limite=g.fim||iso();
  const participantes=ids.map(uid=>({...pessoa(uid),pontos:g.inicio?contar(uid,g.inicio,limite,g.marco_ponto):0}));
  let atual=0,recorde=0;
  if(g.inicio) for(let dia=0;dia<g.dias;dia++) {
   const ini=mais(g.inicio,dia*DIA);if(ini>iso()||ini>=g.fim)break;
   const janelaFim=mais(ini,DIA),fim=janelaFim<g.fim?janelaFim:g.fim, cumprido=ids.length>=2&&ids.every(uid=>contar(uid,ini,fim,g.marco_ponto)>=g.diaria);
   if(cumprido){atual++;recorde=Math.max(recorde,atual);}else if(fim<=iso())atual=0;
  }
  return {participantes,total:participantes.reduce((s,p)=>s+p.pontos,0),sequencia:atual,recorde};
 }
 function atualizar(uid=null) {
  const em=iso();
  // Chamado dentro de transação: duas réplicas não conseguem entregar a mesma figurinha duas vezes.
  for(const d of q("SELECT * FROM duelos WHERE estado IN ('escolha','confirmacao','ativo')"+(uid===null?'':' AND (criador=? OR convidado=?)')).all(...(uid===null?[]:[uid,uid]))) {
   if(d.modalidade==='troca' && (!adulto(d.criador)||!adulto(d.convidado)||[d.figurinha_a,d.figurinha_b].filter(Boolean).some(id=>{const c=q('SELECT * FROM colecao_figurinhas WHERE id=?').get(id);return !c||c.modelo.startsWith('conquista:')||repetidas(c)<2;}))) {q("UPDATE duelos SET estado='cancelado' WHERE id=?").run(d.id);liberar(d.id);continue;}
   if(d.estado!=='ativo') {if(d.expira_em<=em){q("UPDATE duelos SET estado='expirado' WHERE id=?").run(d.id);liberar(d.id);}continue;}
   if(d.fim>em)continue;
   const a=contar(d.criador,d.inicio,d.fim,d.marco_ponto,d.criterio),b=contar(d.convidado,d.inicio,d.fim,d.marco_ponto,d.criterio);
   const vencedor=a===b?null:a>b?d.criador:d.convidado;
   const validas=d.modalidade==='amistoso'||q('SELECT COUNT(*) n FROM figurinhas_reservas r JOIN colecao_figurinhas f ON f.id=r.figurinha_id WHERE r.duelo_id=? AND ((f.id=? AND f.user_id=?) OR (f.id=? AND f.user_id=?))').get(d.id,d.figurinha_a,d.convidado,d.figurinha_b,d.criador).n===2;
   if(!validas){q("UPDATE duelos SET estado='cancelado' WHERE id=?").run(d.id);liberar(d.id);continue;}
   if(vencedor && d.modalidade==='troca') q('UPDATE colecao_figurinhas SET user_id=? WHERE id=?').run(vencedor,vencedor===d.criador?d.figurinha_a:d.figurinha_b);
   q("UPDATE duelos SET estado='concluido',placar_a=?,placar_b=?,vencedor=? WHERE id=?").run(a,b,vencedor,d.id);liberar(d.id);
  }
  for(const g of q("SELECT * FROM grupos_desafio WHERE estado IN ('convite','ativo')"+(uid===null?'':' AND id IN (SELECT grupo_id FROM grupos_membros WHERE user_id=?)')).all(...(uid===null?[]:[uid]))) {
   if(g.estado==='convite'){if(g.expira_em<=em)q("UPDATE grupos_desafio SET estado='cancelado' WHERE id=?").run(g.id);continue;}
   const p=placarGrupo(g), ganhou=(g.tipo==='exercicios'?p.total:p.recorde)>=g.meta;
   if(p.participantes.length<2){q("UPDATE grupos_desafio SET estado='cancelado' WHERE id=?").run(g.id);continue;}
   if(!ganhou&&g.fim>em)continue;
   q('UPDATE grupos_desafio SET estado=?,resultado=?,fim=? WHERE id=?').run(ganhou?'concluido':'encerrado',g.tipo==='exercicios'?p.total:p.recorde,ganhou?mais(em,1):g.fim,g.id);
   if(ganhou) for(const participante of p.participantes) q('INSERT OR IGNORE INTO colecao_figurinhas(user_id,modelo,raridade,origem_chave,criada_em) VALUES(?,?,?,?,?)').run(participante.id,'grupo-'+g.tipo,'epica','grupo:'+g.id+':'+participante.id,em);
  }
 }
 function dueloPublico(d,uid) {
  const a=carta(q('SELECT * FROM colecao_figurinhas WHERE id=?').get(d.figurinha_a)), b=carta(q('SELECT * FROM colecao_figurinhas WHERE id=?').get(d.figurinha_b));
  return {id:d.id,modalidade:d.modalidade,criterio:d.criterio,limiteDiario:LIMITE_PLACAR,criador:pessoa(d.criador),convidado:pessoa(d.convidado),dias:d.dias,estado:d.estado,inicio:d.inicio,fim:d.fim,expiraEm:d.expira_em,figurinhaDoConvidado:a,figurinhaDoCriador:b,placarCriador:d.estado==='ativo'?contar(d.criador,d.inicio,d.fim,d.marco_ponto,d.criterio):d.placar_a,placarConvidado:d.estado==='ativo'?contar(d.convidado,d.inicio,d.fim,d.marco_ponto,d.criterio):d.placar_b,vencedor:d.vencedor,euSouCriador:d.criador===uid};
 }
 function grupoPublico(g,uid) {return {id:g.id,nome:g.nome,tipo:g.tipo,dias:g.dias,meta:g.meta,diaria:g.diaria,estado:g.estado,inicio:g.inicio,fim:g.fim,expiraEm:g.expira_em,criador:g.criador,minhaResposta:q('SELECT estado FROM grupos_membros WHERE grupo_id=? AND user_id=?').get(g.id,uid)?.estado,...placarGrupo(g),convites:q("SELECT user_id,estado FROM grupos_membros WHERE grupo_id=? AND estado<>'aceito'").all(g.id).map(m=>({...pessoa(m.user_id),estado:m.estado}))};}
 function painel(uid) {return transacao(db,()=>{
  atualizar(uid);const eu=perfil(uid);
  const ligacoes=q('SELECT * FROM amizades WHERE de=? OR para=? ORDER BY em DESC').all(uid,uid);
  return {eu:{...eu,podeTrocar:adulto(uid),cenario:q('SELECT cenario FROM social_perfis WHERE user_id=?').get(uid)?.cenario||'padrao'},saldo:saldo(uid),xp:xp(uid),nivel:1+Math.floor(xp(uid)/100),pocaoAte:q('SELECT ate FROM xp_efeitos WHERE user_id=? AND ate>?').get(uid,iso())?.ate||null,inventario:Object.fromEntries(q('SELECT produto,quantidade FROM loja_inventario WHERE user_id=?').all(uid).map(i=>[i.produto,i.quantidade])),raridades:RARIDADES,regras:REGRAS,colecao:colecao(uid),amigos:ligacoes.filter(a=>a.estado==='aceita').map(a=>pessoa(a.de===uid?a.para:a.de)),pedidos:ligacoes.filter(a=>a.estado==='pendente').map(a=>({...pessoa(a.de===uid?a.para:a.de),recebido:a.para===uid})),duelos:q('SELECT * FROM duelos WHERE criador=? OR convidado=? ORDER BY id DESC LIMIT 100').all(uid,uid).map(d=>dueloPublico(d,uid)),grupos:q("SELECT g.* FROM grupos_desafio g JOIN grupos_membros m ON m.grupo_id=g.id WHERE m.user_id=? AND m.estado<>'recusado' ORDER BY g.id DESC LIMIT 100").all(uid).map(g=>grupoPublico(g,uid)),extrato:q('SELECT id,quantidade,motivo,em FROM moedas_extrato WHERE user_id=? ORDER BY id DESC LIMIT 50').all(uid),loja:{disponivel:true,produtos:PRODUTOS}};
 });}
 function executar(uid,fn) {return transacao(db,()=>{atualizar(uid);return fn();});}
 function pedir(uid,codigo) {return executar(uid,()=>{
  perfil(uid);const p=q('SELECT * FROM social_perfis WHERE codigo=?').get(codigo);
  if(!p||p.user_id===uid||bloqueado(uid,p.user_id))throw new ErroHttp(404,'Código não encontrado ou indisponível.');
  if(q('SELECT COUNT(*) n FROM amizades WHERE de=? OR para=?').get(uid,uid).n>=50||q('SELECT COUNT(*) n FROM amizades WHERE de=? OR para=?').get(p.user_id,p.user_id).n>=50)throw new ErroHttp(409,'Você já tem muitos contatos ou pedidos pendentes.');
  if(q('SELECT 1 FROM amizades WHERE (de=? AND para=?) OR (de=? AND para=?)').get(uid,p.user_id,p.user_id,uid))throw new ErroHttp(409,'Essa amizade já existe ou aguarda resposta.');
  q("INSERT INTO amizades(de,para,estado,em) VALUES(?,?,'pendente',?)").run(uid,p.user_id,iso());return {ok:true};
 });}
 function responderAmizade(uid,outro,aceitar) {return executar(uid,()=>{
  if(bloqueado(uid,outro))throw new ErroHttp(404,'Pedido não encontrado.');
  const r=aceitar?q("UPDATE amizades SET estado='aceita' WHERE de=? AND para=? AND estado='pendente'").run(outro,uid):q("DELETE FROM amizades WHERE de=? AND para=? AND estado='pendente'").run(outro,uid);
  if(!r.changes)throw new ErroHttp(404,'Pedido não encontrado.');return {ok:true};
 });}
 function remover(uid,outro,bloquear=false) {return executar(uid,()=>{
  if(uid===outro||!q('SELECT 1 FROM usuarios WHERE id=?').get(outro))throw new ErroHttp(404,'Contato não encontrado.');
  q('DELETE FROM amizades WHERE (de=? AND para=?) OR (de=? AND para=?)').run(uid,outro,outro,uid);
  if(bloquear)q('INSERT OR IGNORE INTO social_bloqueios(user_id,bloqueado_id) VALUES(?,?)').run(uid,outro);
  for(const d of q("SELECT id FROM duelos WHERE estado IN ('escolha','confirmacao') AND ((criador=? AND convidado=?) OR (criador=? AND convidado=?))").all(uid,outro,outro,uid)){q("UPDATE duelos SET estado='cancelado' WHERE id=?").run(d.id);liberar(d.id);}
  return {ok:true};
 });}
 function novoDuelo(uid,outro,dias,figurinha=null,criterio='exercicios') {return executar(uid,()=>{
  exigirAmigo(uid,outro);const modalidade=figurinha===null?'amistoso':'troca';if(modalidade==='troca'){trocaPermitida(uid,outro);disponivel(figurinha,outro);}
  if(q("SELECT COUNT(*) n FROM duelos WHERE (criador=? OR convidado=?) AND estado IN ('escolha','confirmacao','ativo')").get(uid,uid).n>=10)throw new ErroHttp(409,'Conclua ou cancele um desafio antes de criar outro.');
  const em=iso(),r=q("INSERT INTO duelos(criador,convidado,dias,estado,figurinha_a,criado_em,expira_em,modalidade,criterio) VALUES(?,?,?,'escolha',?,?,?,?,?)").run(uid,outro,dias,figurinha,em,mais(em,PRAZO),modalidade,criterio);return {ok:true,id:Number(r.lastInsertRowid)};
 });}
 function escolher(uid,id,figurinha) {return executar(uid,()=>{
  const d=meuDuelo(id,uid);if(d.estado!=='escolha'||d.convidado!==uid)throw new ErroHttp(409,'Esta escolha não está disponível.');
  exigirAmigo(d.criador,d.convidado);if(d.modalidade==='troca'){trocaPermitida(uid,d.criador);disponivel(d.figurinha_a,uid);disponivel(figurinha,d.criador);
  q('INSERT INTO figurinhas_reservas(figurinha_id,duelo_id) VALUES(?,?),(?,?)').run(d.figurinha_a,id,figurinha,id);}
  q("UPDATE duelos SET estado='confirmacao',figurinha_b=?,expira_em=? WHERE id=?").run(d.modalidade==='troca'?figurinha:null,mais(iso(),PRAZO),id);return {ok:true};
 });}
 function confirmar(uid,id) {return executar(uid,()=>{
  const d=meuDuelo(id,uid);if(d.estado!=='confirmacao'||d.criador!==uid)throw new ErroHttp(409,'A confirmação não está disponível.');
  exigirAmigo(d.criador,d.convidado);
  if(d.modalidade==='troca')trocaPermitida(uid,d.convidado);
  if(d.modalidade==='troca'&&q('SELECT COUNT(*) n FROM figurinhas_reservas WHERE duelo_id=?').get(id).n!==2)throw new ErroHttp(409,'As figurinhas não estão reservadas.');
  const inicio=iso();q("UPDATE duelos SET estado='ativo',inicio=?,fim=?,marco_ponto=(SELECT COALESCE(MAX(id),0) FROM pontos_estudo) WHERE id=?").run(inicio,mais(inicio,d.dias*DIA),id);return {ok:true};
 });}
 function cancelarDuelo(uid,id) {return executar(uid,()=>{const d=meuDuelo(id,uid);if(!['escolha','confirmacao'].includes(d.estado))throw new ErroHttp(409,'O duelo já começou ou foi encerrado.');q("UPDATE duelos SET estado='cancelado' WHERE id=?").run(id);liberar(id);return {ok:true};});}
 function novoGrupo(uid,b) {return executar(uid,()=>{
  perfil(uid);for(const amigoId of b.amigos)exigirAmigo(uid,amigoId);
  if(q("SELECT COUNT(*) n FROM grupos_desafio WHERE criador=? AND estado IN ('convite','ativo')").get(uid).n>=5)throw new ErroHttp(409,'Conclua ou encerre um grupo antes de criar outro.');
  const em=iso(),r=q("INSERT INTO grupos_desafio(criador,nome,tipo,dias,meta,diaria,estado,criado_em,expira_em) VALUES(?,?,?,?,?,?,'convite',?,?)").run(uid,b.nome,b.tipo,b.dias,b.meta,b.diaria,em,mais(em,PRAZO)),id=Number(r.lastInsertRowid);
  q("INSERT INTO grupos_membros(grupo_id,user_id,estado) VALUES(?,?,'aceito')").run(id,uid);
  for(const outro of b.amigos)q("INSERT INTO grupos_membros(grupo_id,user_id,estado) VALUES(?,?,'pendente')").run(id,outro);
  return {ok:true,id};
 });}
 function grupoAcao(uid,id,acao) {return executar(uid,()=>{
  const g=meuGrupo(id,uid),me=q('SELECT estado FROM grupos_membros WHERE grupo_id=? AND user_id=?').get(id,uid);
  if(acao==='aceitar'||acao==='recusar') {
   if(g.estado!=='convite'||me.estado!=='pendente')throw new ErroHttp(409,'Este convite não está disponível.');
   exigirAmigo(uid,g.criador);q('UPDATE grupos_membros SET estado=? WHERE grupo_id=? AND user_id=?').run(acao==='aceitar'?'aceito':'recusado',id,uid);
  } else if(acao==='iniciar') {
   if(g.criador!==uid||g.estado!=='convite'||membros(id).length<2)throw new ErroHttp(409,'O criador pode começar quando pelo menos um amigo aceitar.');
   const inicio=iso();q("UPDATE grupos_desafio SET estado='ativo',inicio=?,fim=?,marco_ponto=(SELECT COALESCE(MAX(id),0) FROM pontos_estudo) WHERE id=?").run(inicio,mais(inicio,g.dias*DIA),id);
   q("UPDATE grupos_membros SET estado='recusado' WHERE grupo_id=? AND estado='pendente'").run(id);
  } else {
   if(!['convite','ativo'].includes(g.estado)||me.estado!=='aceito')throw new ErroHttp(409,'Este grupo já foi encerrado.');
   q("UPDATE grupos_desafio SET estado='cancelado' WHERE id=?").run(id);
  }
  return {ok:true};
 });}
 function apagar(uid) {
  // A saída encerra grupos em andamento, sem retirar prêmios já entregues aos demais.
  q("UPDATE grupos_desafio SET estado='cancelado' WHERE estado IN ('convite','ativo') AND id IN (SELECT grupo_id FROM grupos_membros WHERE user_id=?)").run(uid);
  q('DELETE FROM grupos_desafio WHERE criador=?').run(uid);q('DELETE FROM grupos_membros WHERE user_id=?').run(uid);
  q('DELETE FROM duelos WHERE criador=? OR convidado=?').run(uid,uid);
  q('DELETE FROM amizades WHERE de=? OR para=?').run(uid,uid);q('DELETE FROM social_bloqueios WHERE user_id=? OR bloqueado_id=?').run(uid,uid);
  for(const t of ['exercicios_recebidos','social_perfis','colecao_figurinhas','loja_compras','loja_inventario','xp_efeitos','xp_extrato','moedas_extrato','pontos_estudo'])q(`DELETE FROM ${t} WHERE user_id=?`).run(uid);
 }
 function exportar(uid) {return {exerciciosRecebidos:q('SELECT item,dia FROM exercicios_recebidos WHERE user_id=?').all(uid),perfil:q('SELECT * FROM social_perfis WHERE user_id=?').get(uid)||null,colecao:colecao(uid),xp:q('SELECT quantidade,base,multiplicador,motivo,em FROM xp_extrato WHERE user_id=? ORDER BY id').all(uid),inventario:q('SELECT produto,quantidade FROM loja_inventario WHERE user_id=?').all(uid),efeitos:q('SELECT ate FROM xp_efeitos WHERE user_id=?').get(uid)||null,compras:q('SELECT produto,resultado,em FROM loja_compras WHERE user_id=?').all(uid),moedas:q('SELECT quantidade,motivo,em FROM moedas_extrato WHERE user_id=? ORDER BY id').all(uid),pontos:q('SELECT item,dia,em,origem FROM pontos_estudo WHERE user_id=?').all(uid),amizades:q('SELECT de,para,estado,em FROM amizades WHERE de=? OR para=?').all(uid,uid),duelos:q('SELECT * FROM duelos WHERE criador=? OR convidado=?').all(uid,uid),grupos:q('SELECT grupo_id,estado FROM grupos_membros WHERE user_id=?').all(uid)};}
 function creditoXp(uid,base,chave,motivo) {
  const em=iso(),mult=q('SELECT 1 FROM xp_efeitos WHERE user_id=? AND ate>?').get(uid,em)?2:1;
  return q('INSERT OR IGNORE INTO xp_extrato(user_id,quantidade,base,multiplicador,motivo,chave,em) VALUES(?,?,?,?,?,?,?)').run(uid,base*mult,base,mult,motivo,chave,em).changes?base*mult:0;
 }
 function compra(uid,produto,chave) {return executar(uid,()=>{
  const ja=q('SELECT produto,resultado FROM loja_compras WHERE user_id=? AND chave=?').get(uid,chave);
  if(ja){if(ja.produto!==produto)throw new ErroHttp(409,'Este pedido já foi usado.');return {...JSON.parse(ja.resultado),repetida:true};}
  const p=PRODUTOS.find(p=>p.id===produto);if(!p)throw new ErroHttp(422,'Produto inválido.');
  if(produto.startsWith('cenario-')&&q('SELECT 1 FROM loja_inventario WHERE user_id=? AND produto=? AND quantidade>0').get(uid,produto))throw new ErroHttp(409,'Este cenário já é seu. Use-o em Seus itens.');
  if(saldo(uid)<p.preco)throw new ErroHttp(409,'Você ainda não tem moedas suficientes. Continue estudando para juntar mais.');
  q('INSERT INTO moedas_extrato(user_id,quantidade,motivo,chave,em) VALUES(?,?,?,?,?)').run(uid,-p.preco,p.nome,'compra:'+uid+':'+chave,iso());
  q('INSERT INTO loja_inventario(user_id,produto,quantidade) VALUES(?,?,1) ON CONFLICT(user_id,produto) DO UPDATE SET quantidade=quantidade+1').run(uid,produto);
  const resultado={ok:true,produto,saldo:saldo(uid)};q('INSERT INTO loja_compras(user_id,chave,produto,resultado,em) VALUES(?,?,?,?,?)').run(uid,chave,produto,JSON.stringify(resultado),iso());return resultado;
 });}
 function consumir(uid,produto,chave) {return executar(uid,()=>{
  const operacao=produto==='caixa'?'abrir-caixa':produto==='pocao'?'ativar-pocao':'equipar:'+produto;
  const ja=q('SELECT produto,resultado FROM loja_compras WHERE user_id=? AND chave=?').get(uid,chave);
  if(ja){if(ja.produto!==operacao)throw new ErroHttp(409,'Este pedido já foi usado.');return {...JSON.parse(ja.resultado),repetida:true};}
  if(produto==='pocao'&&q('SELECT 1 FROM xp_efeitos WHERE user_id=? AND ate>?').get(uid,iso()))throw new ErroHttp(409,'Já há uma poção ativa. Use a próxima quando esta terminar.');
  const r=q('UPDATE loja_inventario SET quantidade=quantidade-1 WHERE user_id=? AND produto=? AND quantidade>0').run(uid,produto);if(!r.changes)throw new ErroHttp(409,'Você não tem este item.');
  let resultado;
  if(produto==='pocao') {
   const ate=mais(iso(),30*60e3);q('INSERT INTO xp_efeitos(user_id,ate) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET ate=excluded.ate').run(uid,ate);resultado={ok:true,ate};
  } else if(produto.startsWith('cenario-')) {
   q('UPDATE loja_inventario SET quantidade=quantidade+1 WHERE user_id=? AND produto=?').run(uid,produto);perfil(uid);const cenario=q('SELECT cenario FROM social_perfis WHERE user_id=?').get(uid).cenario===produto?'padrao':produto;q('UPDATE social_perfis SET cenario=? WHERE user_id=?').run(cenario,uid);resultado={ok:true,cenario};
  } else {
   const n=sortear(100),raridade=n<65?'comum':n<90?'rara':n<99?'epica':'lendaria';
   const todos=Array.from({length:6},(_,i)=>'pratica-'+(i+1)),faltantes=todos.filter(m=>!q('SELECT 1 FROM colecao_figurinhas WHERE user_id=? AND modelo=? AND raridade=?').get(uid,m,raridade));
   const opcoes=faltantes.length?faltantes:todos,modelo=opcoes[sortear(opcoes.length)];
   const f=q('INSERT INTO colecao_figurinhas(user_id,modelo,raridade,origem_chave,criada_em) VALUES(?,?,?,?,?)').run(uid,modelo,raridade,'caixa:'+uid+':'+chave,iso());
   resultado={ok:true,figurinha:carta(q('SELECT * FROM colecao_figurinhas WHERE id=?').get(Number(f.lastInsertRowid)))};
  }
  q('INSERT INTO loja_compras(user_id,chave,produto,resultado,em) VALUES(?,?,?,?,?)').run(uid,chave,operacao,JSON.stringify(resultado),iso());return resultado;
 });}
 return {saldo,xp,creditoXp,compra,consumir,perfil,painel,pedir,responderAmizade,remover,colecao,exigirAmigo,novoDuelo,escolher,confirmar,cancelarDuelo,novoGrupo,grupoAcao,apagar,exportar,atualizar,contar};
}
function registrar({db,rota,V,social}) {
 const limite=auth.limitadorBanco(db,'social-convites',{janelaMs:15*60e3,max:30});
 const limitar=ctx=>{if(!limite.tentar('u'+ctx.u.id))throw new ErroHttp(429,'Muitos convites. Tente novamente mais tarde.');};
 const chave=ctx=>V.str(ctx.corpo.chave,80,{min:16,campo:'Identificador do pedido'});
 rota('POST','/social/loja/comprar',ctx=>social.compra(ctx.u.id,V.um(ctx.corpo.produto,PRODUTOS.map(p=>p.id),'Produto'),chave(ctx)));
 rota('POST','/social/loja/usar',ctx=>social.consumir(ctx.u.id,V.um(ctx.corpo.produto,PRODUTOS.map(p=>p.id),'Produto'),chave(ctx)));
 rota('GET','/social',ctx=>social.painel(ctx.u.id));
 rota('PUT','/social/perfil',ctx=>{const apelido=V.str(ctx.corpo.apelido,24,{min:2,campo:'Apelido'});social.perfil(ctx.u.id);db.prepare('UPDATE social_perfis SET apelido=? WHERE user_id=?').run(apelido,ctx.u.id);return {ok:true};});
 rota('POST','/social/amigos',ctx=>{limitar(ctx);return social.pedir(ctx.u.id,V.str(ctx.corpo.codigo,30,{min:1,campo:'Código'}).toUpperCase());});
 rota('POST','/social/amigos/:id/responder',ctx=>social.responderAmizade(ctx.u.id,V.id(ctx.params.id),V.um(ctx.corpo.acao,['aceitar','recusar'],'Resposta')==='aceitar'));
 rota('DELETE','/social/amigos/:id',ctx=>social.remover(ctx.u.id,V.id(ctx.params.id),ctx.corpo.bloquear===true));
 rota('GET','/social/amigos/:id/colecao',ctx=>{const id=V.id(ctx.params.id);social.exigirAmigo(ctx.u.id,id);social.painel(ctx.u.id);return {colecao:social.colecao(id)};});
 rota('POST','/social/duelos',ctx=>{limitar(ctx);return social.novoDuelo(ctx.u.id,V.id(ctx.corpo.amigoId),V.um(ctx.corpo.dias,[2,7,30],'Duração'),ctx.corpo.figurinhaId==null?null:V.id(ctx.corpo.figurinhaId),V.um(ctx.corpo.criterio||'exercicios',['exercicios','constancia'],'Critério'));});
 rota('POST','/social/duelos/:id/escolher',ctx=>social.escolher(ctx.u.id,V.id(ctx.params.id),ctx.corpo.figurinhaId==null?null:V.id(ctx.corpo.figurinhaId)));
 rota('POST','/social/duelos/:id/confirmar',ctx=>social.confirmar(ctx.u.id,V.id(ctx.params.id)));
 rota('POST','/social/duelos/:id/cancelar',ctx=>social.cancelarDuelo(ctx.u.id,V.id(ctx.params.id)));
 rota('POST','/social/grupos',ctx=>{
  limitar(ctx);const b=ctx.corpo,tipo=V.um(b.tipo,['exercicios','sequencia'],'Tipo'),dias=V.um(b.dias,[2,7,30],'Duração');
  if(!Array.isArray(b.amigos)||b.amigos.length<1||b.amigos.length>9)throw new ErroHttp(422,'Convide de 1 a 9 amigos.');
  const amigos=[...new Set(b.amigos.map(V.id))];if(amigos.includes(ctx.u.id))throw new ErroHttp(422,'Selecione seus amigos.');
  return social.novoGrupo(ctx.u.id,{nome:V.str(b.nome,50,{min:2,campo:'Nome do grupo'}),tipo,dias,meta:V.int(b.meta,1,tipo==='sequencia'?dias:10000,'Meta'),diaria:V.int(b.diaria??3,1,20,'Meta diária por pessoa'),amigos});
 });
 rota('POST','/social/grupos/:id/acao',ctx=>social.grupoAcao(ctx.u.id,V.id(ctx.params.id),V.um(ctx.corpo.acao,['aceitar','recusar','iniciar','encerrar'],'Ação')));
}
module.exports={criarSocial,registrar,REGRAS,CARTAS,RARIDADES,PRODUTOS};
