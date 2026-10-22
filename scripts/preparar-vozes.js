'use strict';
// Sem --gerar, só informa o tamanho do lote: não chama nem cobra a API.
const { abrir }=require('../src/db');
const { criarVozes }=require('../src/vozes');
const { MISSOES }=require('../src/conteudo/missoes');
const limite=Math.min(100,Math.max(1,Number(process.env.VOZ_PREPARAR_LIMITE)||20));
const lote=MISSOES.slice(0,3).flatMap(m=>m.vocab.flatMap(v=>[
  {texto:v.en,idioma:'en'}, {texto:v.pt,idioma:'pt'},
])).slice(0,limite).flatMap(p=>['mia','tuiuiu'].map(personagem=>({...p,personagem})));
async function main(){
  console.log('Lote de conteúdo fixo:',lote.length,'trechos;',lote.reduce((n,p)=>n+p.texto.length,0),'caracteres antes de cache.');
  if(!process.argv.includes('--gerar')){console.log('Simulação. Use --gerar com a configuração do servidor para preparar o lote.');return;}
  const uid=Number(process.env.VOZ_PREPARAR_USUARIO);
  if(!Number.isSafeInteger(uid)||uid<1)throw Error('Configure VOZ_PREPARAR_USUARIO com uma conta administrativa existente.');
  const db=abrir(process.env.DATA_DIR||'./dados');
  if(!require('../src/editorial').ehAdmin(uid)||!db.prepare('SELECT 1 FROM usuarios WHERE id=?').get(uid)){db.close();throw Error('A conta de preparação precisa de autorização administrativa.');}
  const voz=criarVozes({db,dir:process.env.DATA_DIR||'./dados'});
  try{for(const pedido of lote)await voz.sintetizar(uid,pedido);console.log('Lote preparado. Áudios já existentes foram reutilizados.');}
  finally{voz.fechar();db.close();}
}
main().catch(()=>{console.error('Não foi possível preparar o lote. Confira a configuração do servidor e a disponibilidade do provedor. Nenhum segredo foi registrado.');process.exitCode=1;});
