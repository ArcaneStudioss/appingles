'use strict';
// Identificadores não secretos recebidos do proprietário. Overrides somente no servidor.
// Família: uma cobrança por grupo (quantity=1), incluindo até cinco contas.
const RECEBIDOS={
 basic_mensal:'price_1USGVS69VNlVH0GlVBH5mmXw',basic_anual:'price_1USGVn69VNlVH0GlHdulvjHB',
 completo_mensal:'price_1USGWz69VNlVH0GlZXifG6nZ',completo_anual:'price_1USGXT69VNlVH0GlFfLh29U8',
 familia_mensal:'price_1USGYB69VNlVH0Glitzg7DOc',familia_anual:'price_1USGYV69VNlVH0GlCuru5Ouo',
 turma_mensal:'price_1USGZ769VNlVH0Glt24KywtS',turma_anual:'price_1USGZU69VNlVH0Gl02xnYzxr',
};
function precos(env=process.env){return Object.fromEntries(Object.entries(RECEBIDOS).map(([sku,id])=>[sku,env['STRIPE_PRICE_'+sku.toUpperCase()]||id]));}
module.exports={RECEBIDOS,precos};
