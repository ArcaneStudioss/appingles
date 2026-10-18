// Interface: construtor de elementos SEGURO (só textContent, nunca HTML com dado do usuário),
// ícones, janela (modal), confirmação e aviso no lugar de alert/confirm/prompt, áudio e microfone.

// append/replaceChildren nativos escrevem null como texto "null": aqui eles ignoram vazios (null, undefined, false)
for (const nome of ['append', 'replaceChildren', 'prepend']) {
  const orig = Element.prototype[nome];
  Element.prototype[nome] = function (...itens) { return orig.apply(this, itens.flat(Infinity).filter(x => x != null && x !== false)); };
}

export function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === 'dados') for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv;
    // CSP sem 'unsafe-inline': estilo só pelo CSSOM (setProperty), nunca pelo atributo style
    else if (k === 'style') for (const par of String(v).split(';')) { const i = par.indexOf(':'); if (i > 0) el.style.setProperty(par.slice(0, i).trim(), par.slice(i + 1).trim()); }
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  // campos de texto livre: sem caixinha de sugestão do navegador
  if ((tag === 'textarea' || (tag === 'input' && ['text', 'search', undefined, null, ''].includes(attrs.type))) && !attrs.autocomplete) el.setAttribute('autocomplete', 'off');
  anexar(el, filhos);
  return el;
}
function anexar(el, filhos) {
  for (const f of filhos.flat(Infinity)) {
    if (f == null || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
}
export const limpar = el => { while (el.firstChild) el.firstChild.remove(); return el; };

const NS = 'http://www.w3.org/2000/svg';
export function icone(nome, rotulo) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', 'ico');
  if (rotulo) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', rotulo); } else s.setAttribute('aria-hidden', 'true');
  const u = document.createElementNS(NS, 'use');
  u.setAttribute('href', `/assets/icones/sprite.svg?v=__V__#i-${nome}`);
  s.append(u);
  return s;
}

export const reduzirMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- aviso rápido ----------
export function toast(msg, { tipo = 'info', ms = 4200 } = {}) {
  let box = document.querySelector('.ui-toasts');
  if (!box) { box = h('div', { class: 'ui-toasts', role: 'status', 'aria-live': 'polite' }); document.body.append(box); }
  const t = h('div', { class: `ui-toast ui-toast--${tipo}` }, msg);
  box.append(t);
  setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 230); }, ms);
}
window.alert = m => toast(String(m));   // rede de segurança

// ---------- janela (modal) genérica ----------
export function janela({ titulo, corpo, acoes = [], aoFechar, larga = false }) {
  const retorno = document.activeElement;
  const dlg = h('dialog', { class: 'janela' + (larga ? ' janela--larga' : ''), 'aria-labelledby': 'jan-t' });
  const btnFechar = h('button', { type: 'button', class: 'btn btn-texto btn-peq janela__x', 'aria-label': 'Fechar' }, icone('x'));
  const area = h('div', { class: 'janela__in' },
    h('div', { class: 'janela__topo' }, h('h2', { id: 'jan-t' }, titulo), btnFechar),
    h('div', { class: 'janela__corpo' }, corpo),
    acoes.length ? h('div', { class: 'janela__acoes' }, acoes) : null);
  dlg.append(area);
  document.body.append(dlg);
  let fechado = false;
  const fechar = (valor) => {
    if (fechado) return; fechado = true;
    const fim = () => { if (dlg.open) dlg.close(); dlg.remove(); document.documentElement.classList.remove('ui-lock'); retorno?.focus?.(); aoFechar?.(valor); };
    if (reduzirMovimento()) fim(); else { dlg.classList.add('is-closing'); setTimeout(fim, 170); }
  };
  btnFechar.addEventListener('click', () => fechar(false));
  dlg.addEventListener('cancel', e => { e.preventDefault(); fechar(false); });
  dlg.addEventListener('click', e => { if (e.target === dlg) fechar(false); });
  document.documentElement.classList.add('ui-lock');
  dlg.showModal();
  const primeiro = dlg.querySelector('input:not([type=hidden]),textarea,select');
  (primeiro || btnFechar).focus();
  return { dlg, fechar };
}

// formulário em janela: campos = [{nome, rotulo, tipo, valor, opcoes, ajuda, max, obrigatorio}]
export function formulario({ titulo, campos, enviar = 'Salvar', aoEnviar, texto }) {
  return new Promise(resolve => {
    const form = h('form', { class: 'form-janela', novalidate: true });
    if (texto) form.append(h('p', { class: 'ajuda' }, texto));
    const els = {};
    for (const c of campos) {
      const id = 'f-' + c.nome;
      let entrada;
      if (c.tipo === 'textarea') entrada = h('textarea', { id, name: c.nome, maxlength: c.max || 2000, rows: c.linhas || 5, placeholder: c.placeholder || '' });
      else if (c.tipo === 'select') entrada = h('select', { id, name: c.nome }, c.opcoes.map(o => h('option', { value: o.valor, selected: String(o.valor) === String(c.valor ?? '') }, o.rotulo)));
      else entrada = h('input', { id, name: c.nome, type: c.tipo || 'text', maxlength: c.max || 200, placeholder: c.placeholder || '', autocomplete: c.autocomplete || null, inputmode: c.inputmode || null });
      if (c.tipo !== 'select' && c.valor != null) entrada.value = c.valor;
      if (c.obrigatorio) entrada.required = true;
      els[c.nome] = entrada;
      form.append(h('div', { class: 'campo' }, h('label', { for: id }, c.rotulo), entrada, c.ajuda ? h('small', {}, c.ajuda) : null, h('span', { class: 'erro-campo', id: id + '-erro', 'aria-live': 'polite' })));
    }
    const msg = h('p', { class: 'erro-campo', 'aria-live': 'polite' });
    const btn = h('button', { type: 'submit', class: 'btn' }, enviar);
    form.append(msg);
    let j;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      msg.textContent = '';
      const valores = Object.fromEntries(Object.entries(els).map(([k, el]) => [k, el.value]));
      for (const c of campos) if (c.obrigatorio && !String(valores[c.nome]).trim()) { msg.textContent = `Preencha: ${c.rotulo}.`; els[c.nome].focus(); return; }
      ocupado(btn, true);
      try { const r = await aoEnviar(valores); j.fechar(true); resolve(r ?? true); }
      catch (err) { msg.textContent = err.message || 'Não deu certo. Tente de novo.'; }
      finally { ocupado(btn, false); }
    });
    const cancelar = h('button', { type: 'button', class: 'btn btn-sec', on: { click: () => j.fechar(false) } }, 'Cancelar');
    btn.setAttribute('form', 'form-janela-atual'); form.id = 'form-janela-atual';
    j = janela({ titulo, corpo: form, acoes: [cancelar, btn], aoFechar: v => { if (!v) resolve(null); } });
  });
}

export function confirmar({ titulo = 'Confirmar?', texto = '', ok = 'Confirmar', cancelar = 'Cancelar', perigo = false } = {}) {
  return new Promise(resolve => {
    let res = false;
    const bOk = h('button', { type: 'button', class: perigo ? 'btn btn-perigo-cheio' : 'btn' }, ok);
    const bCancel = h('button', { type: 'button', class: 'btn btn-sec' }, cancelar);
    const j = janela({ titulo, corpo: texto ? h('p', {}, texto) : h('span'), acoes: [bCancel, bOk], aoFechar: () => resolve(res) });
    bOk.addEventListener('click', () => { res = true; j.fechar(true); });
    bCancel.addEventListener('click', () => j.fechar(false));
    (perigo ? bCancel : bOk).focus();     // ação destrutiva nunca recebe o foco inicial
  });
}

export function ocupado(btn, sim) {
  if (!btn) return;
  if (sim) { btn.dataset.rotulo = btn.textContent; btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.prepend(h('span', { class: 'carregando', 'aria-hidden': 'true' })); }
  else { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.querySelector('.carregando')?.remove(); }
}

// ---------- áudio (voz do próprio navegador) ----------
let vozes = [];
function carregarVozes() { vozes = (window.speechSynthesis?.getVoices() || []).filter(v => /^en(-|_|$)/i.test(v.lang)); }
if ('speechSynthesis' in window) { carregarVozes(); speechSynthesis.addEventListener?.('voiceschanged', carregarVozes); }
export const temVoz = () => 'speechSynthesis' in window && (vozes.length > 0 || speechSynthesis.getVoices().length > 0);
export function falar(texto, { velocidade = 1 } = {}) {
  if (!('speechSynthesis' in window)) { toast('Seu navegador não tem leitura de voz. Use "Ver o texto".'); return false; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  const pref = localStorageGet('voz') || '';
  const voz = vozes.find(v => v.name === pref) || vozes.find(v => /en-US/i.test(v.lang) && /natural|google|samantha|aria|jenny/i.test(v.name)) || vozes.find(v => /en-US/i.test(v.lang)) || vozes[0];
  if (voz) u.voice = voz;
  u.lang = voz?.lang || 'en-US';
  u.rate = Math.max(0.6, Math.min(1.2, velocidade * (Number(localStorageGet('velocidade')) || 1)));
  speechSynthesis.speak(u);
  return true;
}
// "Ler pra mim": o Lou lê em voz alta, em português, o que está no balão (ajuda quem lê pouco ou está começando)
export function falarPt(texto, aoFim) {
  if (!('speechSynthesis' in window)) { toast('Seu navegador não tem leitura de voz.'); return false; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  const todas = speechSynthesis.getVoices();
  const voz = todas.find(v => /^pt[-_]BR/i.test(v.lang) && /natural|google|luciana|francisca/i.test(v.name)) || todas.find(v => /^pt[-_]BR/i.test(v.lang)) || todas.find(v => /^pt/i.test(v.lang));
  if (voz) u.voice = voz;
  u.lang = voz?.lang || 'pt-BR'; u.rate = 1;
  u.onend = u.onerror = () => aoFim?.();
  speechSynthesis.speak(u);
  return true;
}
export function botaoOuvir(texto, { velocidade = 1, rotulo = 'Ouvir' } = {}) {
  return h('button', { type: 'button', class: 'btn btn-sec btn-ouvir', on: { click: () => falar(texto, { velocidade }) } }, icone('speaker-high'), rotulo);
}

// ---------- microfone (reconhecimento de voz do navegador, opcional) ----------
export const temMicrofone = () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
export function ouvirMicrofone({ aoTexto, aoFim }) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return null;
  const r = new R();
  r.lang = 'en-US'; r.interimResults = true; r.continuous = false;
  r.onresult = e => { const t = [...e.results].map(x => x[0].transcript).join(' '); aoTexto(t, e.results[e.results.length - 1].isFinal); };
  r.onerror = e => { if (e.error === 'not-allowed') toast('Sem permissão para o microfone. Você pode digitar.'); };
  r.onend = () => aoFim?.();
  r.start();
  return r;
}

// preferências deste aparelho (não são dados de estudo)
export function localStorageGet(k) { try { return localStorage.getItem('inglou:' + k); } catch { return null; } }
export function localStorageSet(k, v) { try { localStorage.setItem('inglou:' + k, v); } catch {} }

export function dataBR(iso) { if (!iso) return ''; const [a, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${a}`; }
export function plural(n, um, varios) { return `${n} ${n === 1 ? um : varios}`; }
