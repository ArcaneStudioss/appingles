// Vida do Tuiuiú e da Mia: os olhos seguem o dedo/mouse, tocar neles faz uma reação, olham em volta sozinhos
// e cochilam quando o aluno fica parado. Só acrescenta classes e variáveis CSS nos <svg class="lou"> que já existem
// (nenhuma tela precisa mudar). Respeita "menos movimento" e o interruptor de som.
import { som, vibrar, brilho } from './diversao.js?v=__V__';
import { reduzirMovimento } from './ui.js?v=__V__';

const ALCANCE = 2.2;            // quanto o olhar anda, em unidades do desenho
const REACOES = ['pula', 'balanca', 'gira'];
let ponteiro = null, quadro = 0, ultimaAcao = Date.now(), cutucadas = [];

const lous = () => [...document.querySelectorAll('svg.lou')].filter(s => s.isConnected && !s.closest('[hidden]'));

function olhar(s, dx, dy) {
  s.style.setProperty('--ox', `${(dx * ALCANCE).toFixed(2)}px`);
  s.style.setProperty('--oy', `${(dy * ALCANCE * .7).toFixed(2)}px`);
}

function seguir() {
  quadro = 0;
  if (!ponteiro) return;
  for (const s of lous()) {
    const r = s.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    const dx = ponteiro.x - (r.left + r.width / 2), dy = ponteiro.y - (r.top + r.height * .25);
    const d = Math.hypot(dx, dy) || 1, f = Math.min(1, d / 160);
    olhar(s, (dx / d) * f, (dy / d) * f);
  }
}

function acordar() {
  ultimaAcao = Date.now();
  for (const s of document.querySelectorAll('svg.lou.lou--dorme')) s.classList.remove('lou--dorme');
}

function cutucar(s) {
  const mia = s.classList.contains('lou--mia');
  cutucadas = cutucadas.filter(t => Date.now() - t < 2500); cutucadas.push(Date.now());
  const tonto = cutucadas.length >= 5;
  const reacao = tonto ? 'tonto' : REACOES[Math.floor(Math.random() * REACOES.length)];
  s.classList.remove('lou--pula', 'lou--balanca', 'lou--gira', 'lou--tonto');
  void s.getBoundingClientRect();   // reinicia a animação se tocar de novo rápido
  s.classList.add(`lou--${reacao}`);
  s.addEventListener('animationend', e => { if (e.target.closest('svg') === s && e.animationName.startsWith('lou-t-')) s.classList.remove(`lou--${reacao}`); }, { once: true });
  som(tonto ? 'meio' : 'toque'); vibrar(10);
  if (tonto) { cutucadas = []; brilho(s, { quantidade: 12 }); }
  else if (!mia && Math.random() < .35) brilho(s, { quantidade: 5 });
}

function iniciar() {
  const sem = reduzirMovimento();
  addEventListener('pointermove', e => { ponteiro = { x: e.clientX, y: e.clientY }; acordar(); if (!quadro && !sem) quadro = requestAnimationFrame(seguir); }, { passive: true });
  addEventListener('pointerdown', e => { ponteiro = { x: e.clientX, y: e.clientY }; acordar(); if (!sem) quadro ||= requestAnimationFrame(seguir); }, { passive: true });
  addEventListener('keydown', acordar, { passive: true });
  addEventListener('scroll', acordar, { passive: true });

  // tocar no personagem (clique/toque): reação divertida; teclado não precisa, ele é decorativo
  document.addEventListener('click', e => {
    const s = e.target.closest?.('svg.lou');
    if (!s || sem || s.closest('button, a, [role="button"]')) return;
    cutucar(s);
  });

  // a cada poucos segundos um deles olha para o lado sozinho; sem ação por 40s, cochila (olhos fechados, "z")
  if (!sem) setInterval(() => {
    if (document.hidden) return;
    const ls = lous();
    if (!ls.length) return;
    if (Date.now() - ultimaAcao > 40000) { for (const s of ls) s.classList.add('lou--dorme'); return; }
    if (ponteiro && Date.now() - ultimaAcao < 3000) return;
    const s = ls[Math.floor(Math.random() * ls.length)];
    olhar(s, Math.random() * 2 - 1, Math.random() * 1.2 - .6);
    setTimeout(() => olhar(s, 0, 0), 1200 + Math.random() * 900);
  }, 4500);
}

iniciar();
