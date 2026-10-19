'use strict';
// Stripe: assinatura do webhook, tradução do estado e o fluxo ponta a ponta com eventos assinados (sem chamar a Stripe de verdade).
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const { verificarWebhook, formulario } = require('../src/stripe');
const { aplicarStripe, novaAssinatura, estado } = require('../src/assinatura');

const SEGREDO = 'whsec_teste';
const assinar = (corpo, t = Math.floor(Date.now() / 1000), seg = SEGREDO) => `t=${t},v1=${crypto.createHmac('sha256', seg).update(`${t}.${corpo}`).digest('hex')}`;

test('webhook: assinatura válida passa; corpo alterado, segredo errado e carimbo velho são recusados', () => {
  const corpo = JSON.stringify({ id: 'evt_1', type: 'x' });
  assert.equal(verificarWebhook(corpo, assinar(corpo), SEGREDO).id, 'evt_1');
  assert.throws(() => verificarWebhook(corpo + ' ', assinar(corpo), SEGREDO));
  assert.throws(() => verificarWebhook(corpo, assinar(corpo, undefined, 'outro'), SEGREDO));
  assert.throws(() => verificarWebhook(corpo, assinar(corpo, Math.floor(Date.now() / 1000) - 3600), SEGREDO));
  assert.throws(() => verificarWebhook(corpo, '', SEGREDO));
  assert.throws(() => verificarWebhook(corpo, assinar(corpo), ''));
});

test('formulário da Stripe: objetos e listas aninhados', () => {
  assert.equal(formulario({ mode: 'subscription', line_items: [{ price: 'p', quantity: 1 }], subscription_data: { metadata: { uid: '3' } } }).toString(),
    'mode=subscription&line_items%5B0%5D%5Bprice%5D=p&line_items%5B0%5D%5Bquantity%5D=1&subscription_data%5Bmetadata%5D%5Buid%5D=3');
});

test('estado: ativa até o fim do período (+1 dia), cancelando vira "cancelada" sem perder dias, pagamento falho mantém o período', () => {
  const fim = Math.floor(Date.parse('2026-11-30T12:00:00Z') / 1000);
  const base = novaAssinatura('2026-10-19');
  const ativa = aplicarStripe(base, { id: 'sub_1', customer: 'cus_1', status: 'active', current_period_end: fim, metadata: { plano: 'completo', periodo: 'mensal' } }, '2026-10-19');
  assert.equal(ativa.status, 'ativa'); assert.equal(ativa.periodo_ate, '2026-12-01'); assert.equal(ativa.stripe.cliente, 'cus_1');
  assert.equal(estado(ativa, '2026-12-01').acesso, 'completo'); assert.equal(estado(ativa, '2026-12-02').acesso, 'livre');
  const canc = aplicarStripe(ativa, { id: 'sub_1', customer: 'cus_1', status: 'active', cancel_at_period_end: true, current_period_end: fim, metadata: { plano: 'mensal' } }, '2026-10-20');
  assert.equal(canc.status, 'cancelada'); assert.equal(estado(canc, '2026-11-30').acesso, 'completo');
  assert.equal(aplicarStripe(ativa, { id: 'sub_1', customer: 'cus_1', status: 'past_due', current_period_end: fim, metadata: {} }, '2026-11-02').status, 'ativa');
  assert.equal(aplicarStripe(ativa, { id: 'sub_1', customer: 'cus_1', status: 'canceled', current_period_end: fim, metadata: {} }, '2026-11-02').status, 'cancelada');
});

const PORTA = 22000 + Math.floor(Math.random() * 900), BASE = `http://localhost:${PORTA}`;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'inglou-stripe-'));
let srv, cookie, uid;
before(async () => {
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT: PORTA, DATA_DIR: DIR, NODE_ENV: 'test', ANTHROPIC_API_KEY: '', BACKUP_DESLIGADO: '1', PAGAMENTO_MODO: 'stripe', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SEGREDO, STRIPE_PRICE_COMPLETO_MENSAL: 'price_cm', STRIPE_PRICE_COMPLETO_ANUAL: 'price_ca' }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await fetch(BASE + '/saude'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  const r = await fetch(BASE + '/api/v1/auth/cadastro', { method: 'POST', headers: { 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Pagante Teste', email: 'pg@stripe.com', senha: 'cafe-com-leite-9876', consentimento: true }) });
  cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  uid = (await (await fetch(BASE + '/api/v1/dados/exportar', { headers: { Cookie: cookie } })).json()).conta && 1;
});
after(() => { srv.kill(); try { fs.rmSync(DIR, { recursive: true, force: true }); } catch {} });

const hook = (obj, cab) => { const corpo = JSON.stringify(obj); return fetch(BASE + '/api/v1/stripe/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': cab ?? assinar(corpo) }, body: corpo }); };

test('webhook ponta a ponta: sem assinatura 400; evento assinado ativa a conta; portal passa a existir', async () => {
  assert.equal((await hook({ id: 'e0', type: 'customer.subscription.updated' }, 't=1,v1=00')).status, 400);
  assert.equal((await fetch(BASE + '/api/v1/stripe/webhook')).status, 405);
  let a = await (await fetch(BASE + '/api/v1/assinatura', { headers: { Cookie: cookie } })).json();
  assert.equal(a.estado.status, 'teste'); assert.equal(a.temPortal, false);
  const fim = Math.floor(Date.now() / 1000) + 20 * 86400;
  const r = await hook({ id: 'e1', type: 'customer.subscription.updated', data: { object: { id: 'sub_9', customer: 'cus_9', status: 'active', current_period_end: fim, metadata: { uid: String(uid), plano: 'completo', periodo: 'anual' } } } });
  assert.equal(r.status, 200);
  a = await (await fetch(BASE + '/api/v1/assinatura', { headers: { Cookie: cookie } })).json();
  assert.equal(a.estado.status, 'ativa'); assert.equal(a.estado.plano, 'completo'); assert.equal(a.estado.periodo, 'anual'); assert.equal(a.temPortal, true);
  // quem já assina não abre outro checkout
  const dup = await fetch(BASE + '/api/v1/assinatura/assinar', { method: 'POST', headers: { Cookie: cookie, 'X-Inglou': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ plano: 'mensal' }) });
  assert.equal(dup.status, 409);
});
