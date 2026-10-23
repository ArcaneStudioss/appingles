'use strict';
// Preload exclusivo de testes: nenhuma chamada sai para um serviço externo.
if(process.env.NODE_ENV!=='test')throw Error('Fixture exclusiva de testes');
const id=require.resolve('@anthropic-ai/sdk');require(id);
require.cache[id].exports=class Anthropic {constructor(){this.messages={create:async()=>{throw Object.assign(new Error('Provedor simulado recusou a requisição'),{status:429});}};}};
