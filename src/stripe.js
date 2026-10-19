'use strict';
// Stripe sem dependência: Checkout (assinatura), portal do cliente, cancelamento no fim do período e verificação de webhook.
// Variáveis: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_<PLANO>_<PERIODO> (BASICO, COMPLETO, FAMILIA, TURMA x MENSAL, ANUAL), SITE_URL. PAGAMENTO_MODO=stripe liga tudo.
// Nenhum dado de cartão passa pelo nosso servidor: o pagamento acontece na página da Stripe.
const crypto = require('node:crypto');

const API = 'https://api.stripe.com/v1';
const TOLERANCIA_S = 300;

const ativo = () => process.env.PAGAMENTO_MODO === 'stripe' && !!process.env.STRIPE_SECRET_KEY;
const precoDe = (plano, periodo) => process.env['STRIPE_PRICE_' + String(plano).toUpperCase() + '_' + String(periodo).toUpperCase()] || null;
const siteUrl = () => (process.env.SITE_URL || '').replace(/\/+$/, '');

// Stripe espera formulário aninhado: a[b][c]=x
function formulario(obj, prefixo = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const chave = prefixo ? `${prefixo}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === 'object' ? formulario(x, `${chave}[${i}]`, out) : out.append(`${chave}[${i}]`, String(x))));
    else if (typeof v === 'object') formulario(v, chave, out);
    else out.append(chave, String(v));
  }
  return out;
}

async function chamar(metodo, caminho, corpo, { chaveIdem } = {}) {
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(corpo ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...(chaveIdem ? { 'Idempotency-Key': chaveIdem } : {}) },
    body: corpo ? formulario(corpo).toString() : undefined,
    signal: AbortSignal.timeout(15e3),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Stripe ${r.status}: ${j?.error?.message || 'erro'}`);
  return j;
}

// Sessão do Checkout em modo assinatura. Se a pessoa ainda está no teste grátis, a primeira cobrança só acontece quando o teste acaba.
async function criarCheckout({ uid, email, plano, periodo, clienteId, testeAteEpoch }) {
  const price = precoDe(plano, periodo);
  if (!price) throw new Error('Preço da Stripe não configurado para ' + plano + ' ' + periodo);
  const base = siteUrl();
  return chamar('POST', '/checkout/sessions', {
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    client_reference_id: String(uid),
    ...(clienteId ? { customer: clienteId } : { customer_email: email }),
    subscription_data: { metadata: { uid: String(uid), plano, periodo }, ...(testeAteEpoch ? { trial_end: testeAteEpoch } : {}) },
    metadata: { uid: String(uid), plano, periodo },
    allow_promotion_codes: 'true',
    success_url: `${base}/app/#/conta?pagamento=ok`,
    cancel_url: `${base}/app/#/conta?pagamento=cancelado`,
  });
}
const criarPortal = clienteId => chamar('POST', '/billing_portal/sessions', { customer: clienteId, return_url: `${siteUrl()}/app/#/conta` });
const buscarAssinatura = id => chamar('GET', '/subscriptions/' + encodeURIComponent(id));
const cancelarNoFimDoPeriodo = id => chamar('POST', '/subscriptions/' + encodeURIComponent(id), { cancel_at_period_end: 'true' });

// Confere a assinatura do webhook (cabeçalho Stripe-Signature: t=...,v1=...) sobre o corpo BRUTO. Devolve o evento ou lança.
function verificarWebhook(corpoBruto, cabecalho, segredo, agoraS = Math.floor(Date.now() / 1000)) {
  if (!segredo) throw new Error('segredo do webhook ausente');
  const partes = String(cabecalho || '').split(',').map(p => p.trim().split('='));
  const t = partes.find(p => p[0] === 't')?.[1];
  const v1 = partes.filter(p => p[0] === 'v1').map(p => p[1]);
  if (!t || !v1.length || !/^\d+$/.test(t)) throw new Error('assinatura ausente');
  if (Math.abs(agoraS - Number(t)) > TOLERANCIA_S) throw new Error('assinatura fora do prazo');
  const esperado = crypto.createHmac('sha256', segredo).update(`${t}.${corpoBruto}`).digest();
  const ok = v1.some(h => { const b = Buffer.from(h, 'hex'); return b.length === esperado.length && crypto.timingSafeEqual(b, esperado); });
  if (!ok) throw new Error('assinatura inválida');
  return JSON.parse(corpoBruto);
}

module.exports = { ativo, precoDe, criarCheckout, criarPortal, buscarAssinatura, cancelarNoFimDoPeriodo, verificarWebhook, formulario };
