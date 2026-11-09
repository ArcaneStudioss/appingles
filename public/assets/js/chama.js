// Celebração da sequência de dias: foguinho que pipoca e explode em faíscas, número que sobe e a semana que acende.
// Só CSS e SVG; sem movimento quando a pessoa pede menos animação.
import { h, icone, reduzirMovimento } from './ui.js?v=__V__';
import { som, vibrar } from './diversao.js?v=__V__';

const PREMIOS = [3, 7, 14, 30, 60, 100, 200, 365];

const FOGO = `<svg class="chama__svg" viewBox="0 0 200 240" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="chama-int" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF4B4B"/><stop offset=".55" stop-color="#FF7A2F"/><stop offset="1" stop-color="#FFB400"/></linearGradient>
    <linearGradient id="chama-ext" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE23D"/><stop offset="1" stop-color="#FFC400"/></linearGradient>
  </defs>
  <g class="chama__camada chama__camada--ext"><path fill="url(#chama-ext)" d="M100 6C120 38 176 80 179 142C181 196 146 234 100 234C54 234 19 196 21 142C23 106 40 86 50 70C52 90 62 98 72 100C70 70 85 30 100 6Z"/></g>
  <g class="chama__camada chama__camada--int"><path fill="url(#chama-int)" d="M100 68C116 94 152 114 153 151C154 186 131 210 100 210C69 210 46 186 47 151C48 126 62 112 70 108C72 118 80 122 86 122C85 100 92 82 100 68Z"/>
    <path fill="#FFFFFF" opacity=".28" d="M62 128C66 118 76 110 88 104C84 114 80 124 70 134C66 136 61 134 62 128Z"/></g>
  <g class="chama__camada chama__camada--nucleo"><path fill="#FFFFFF" d="M100 128C113 147 129 159 129 178C129 194 117 205 100 205C83 205 71 194 71 178C71 159 87 147 100 128Z"/></g>
</svg>`;

const dia3 = d => { const t = new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''); return t[0].toUpperCase() + t.slice(1); };

function faiscas(palco, qtd) {
  for (let i = 0; i < qtd; i++) {
    const ang = (Math.PI * 2 * i) / qtd + (Math.random() - 0.5) * 0.5, dist = 110 + Math.random() * 130;
    const f = h('i', { class: `faisca faisca--${i % 4}` });
    f.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    f.style.setProperty('--dy', `${Math.sin(ang) * dist - 20}px`);
    f.style.setProperty('--t', `${6 + Math.random() * 10}px`);
    f.style.setProperty('--d', `${0.7 + Math.random() * 0.6}s`);
    f.style.setProperty('--r', `${Math.random() * 360}deg`);
    palco.append(f);
  }
}

// seq = { atual, escudos, semana: [{ data, estado }] } vindo da API. Devolve uma promessa que termina quando a pessoa toca no botão.
export function celebrarSequencia(seq, { nome = '' } = {}) {
  if (!seq || !(seq.atual > 0) || document.querySelector('.chama')) return Promise.resolve();
  const parado = reduzirMovimento();
  const dias = seq.atual, antes = Math.max(0, dias - 1);
  const marco = PREMIOS.includes(dias);
  const msg = dias === 1 ? 'Sua sequência começou! Volte amanhã para mantê-la acesa.'
    : marco ? `Marco de ${dias} dias! Isso é constância de verdade.`
    : 'Isso que é arrasar na meta de aprendizado! Não perca o ritmo!';

  const semana = seq.semana || [];
  let ini = semana.length; while (ini > 0 && ['estudou', 'escudo'].includes(semana[ini - 1].estado)) ini--;
  const corrida = semana.length - ini;
  const pilula = h('span', { class: 'chama__pilula', 'aria-hidden': 'true' });
  pilula.style.setProperty('--ini', String(ini)); pilula.style.setProperty('--n', String(corrida));
  const celulas = semana.map((d, i) => {
    const feito = d.estado === 'estudou' || d.estado === 'escudo', hoje = i === semana.length - 1;
    const c = h('li', { class: 'chama__dia' + (hoje ? ' chama__dia--hoje' : '') },
      h('small', {}, dia3(d.data)),
      h('span', { class: 'chama__marca' + (feito ? ' chama__marca--feito' : '') }, feito ? icone(d.estado === 'escudo' ? 'shield-check' : 'check') : null));
    c.style.setProperty('--i', String(i));
    return c;
  });

  const numero = h('span', { class: 'chama__numero', 'aria-hidden': 'true' }, String(parado ? dias : antes));
  const palco = h('div', { class: 'chama__palco', 'aria-hidden': 'true' });
  palco.append(h('span', { class: 'chama__brilho' }), h('span', { class: 'chama__onda' }), h('span', { class: 'chama__onda chama__onda--2' }));
  const fogo = h('div', { class: 'chama__fogo' }); fogo.innerHTML = FOGO; palco.append(fogo);
  if (!parado) { faiscas(palco, 30); for (let i = 0; i < 6; i++) { const b = h('i', { class: 'brasa' }); b.style.setProperty('--bx', `${(Math.random() - 0.5) * 120}px`); b.style.setProperty('--bd', `${2.2 + Math.random() * 1.8}s`); b.style.setProperty('--bw', `${1.2 + Math.random() * 2.4}s`); palco.append(b); } }

  return new Promise(resolver => {
    const botao = h('button', { type: 'button', class: 'chama__botao' }, nome ? `Uhul, ${nome}!` : 'Continuar');
    const raiz = h('div', { class: 'chama' + (parado ? ' chama--parado' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': `${dias} ${dias === 1 ? 'dia' : 'dias'} de sequência` },
      palco,
      h('p', { class: 'chama__total' }, numero),
      h('p', { class: 'chama__rotulo' }, dias === 1 ? 'dia de sequência' : 'dias de sequência'),
      h('div', { class: 'chama__semana' }, pilula, h('ol', {}, ...celulas)),
      h('p', { class: 'chama__msg' }, msg),
      seq.escudos > 0 ? h('p', { class: 'chama__escudo' }, icone('shield-check'), `${seq.escudos} ${seq.escudos === 1 ? 'escudo protege' : 'escudos protegem'} a sua sequência`) : null,
      h('div', { class: 'chama__acao' }, botao));
    // trocar de tela (voltar do navegador, link) também fecha: a comemoração não fica por cima da tela seguinte
    const fechar = () => { removeEventListener('keydown', tecla, true); removeEventListener('hashchange', fechar); raiz.classList.add('chama--saindo'); setTimeout(() => { raiz.remove(); resolver(); }, parado ? 0 : 220); };
    const tecla = e => { if (e.key === 'Escape') { e.stopPropagation(); fechar(); } };
    botao.addEventListener('click', fechar);
    addEventListener('keydown', tecla, true); addEventListener('hashchange', fechar);
    document.body.append(raiz);
    botao.focus({ preventScroll: true });
    if (parado) return;
    som('fim'); vibrar([20, 30, 20, 30, 80]);
    // o número sobe de um em um logo depois da explosão
    setTimeout(() => {
      if (!raiz.isConnected) return;
      numero.textContent = String(dias); numero.classList.add('chama__numero--pula');
      if (marco) setTimeout(() => raiz.querySelector('.chama__palco')?.classList.add('chama__palco--marco'), 200);
    }, 1050);
  });
}

// Foguinho pequeno para a pílula de sequência e para a semana: aceso balança, apagado fica cinza.
let seqMini = 0;
export function chamaMini({ acesa = true } = {}) {
  const n = ++seqMini;
  const el = h('span', { class: 'chama-mini' + (acesa ? '' : ' chama-mini--apagada'), 'aria-hidden': 'true' });
  el.innerHTML = FOGO.replace('class="chama__svg"', 'class="chama-mini__svg"').replaceAll('chama-int', 'cm-int-' + n).replaceAll('chama-ext', 'cm-ext-' + n);
  return el;
}
