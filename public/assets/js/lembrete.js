// Lembrete diário de estudo. Três jeitos, todos opcionais e sem castigo:
// 1) evento repetido no calendário do celular (.ics), que avisa mesmo com o app fechado;
// 2) cartão "Hora do exercício" na tela Hoje quando o horário passou e a pessoa ainda não estudou;
// 3) notificação do aparelho no horário, enquanto o app estiver aberto (ou instalado e em segundo plano).
import { api } from './api.js?v=__V__';
import { h, janela, toast, ocupado, localStorageGet, localStorageSet } from './ui.js?v=__V__';

export const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const temNotificacao = () => 'Notification' in window;

export const lembreteDeHoje = lem => !!lem?.ativo && (lem.dias || []).includes(new Date().getDay());
export const jaPassouDaHora = lem => { const [hh, mm] = (lem.hora || '19:00').split(':').map(Number); const n = new Date(); return n.getHours() * 60 + n.getMinutes() >= hh * 60 + mm; };

// janela de configuração; `aoSalvar(lembrete)` recebe o que foi salvo (para a tela atualizar)
export function configurarLembrete(lem = {}, { aoSalvar } = {}) {
  const ativo = h('input', { type: 'checkbox', id: 'l-ativo', checked: !!lem.ativo });
  const hora = h('input', { type: 'time', id: 'l-hora', value: lem.hora || '19:00' });
  const dias = new Set(lem.dias || [0, 1, 2, 3, 4, 5, 6]);
  const chips = h('div', { class: 'escolhas' }, DIAS.map((d, i) => h('label', { class: 'escolha' }, h('input', { type: 'checkbox', checked: dias.has(i), on: { change: ev => { if (ev.target.checked) dias.add(i); else dias.delete(i); } } }), h('span', {}, d))));
  const notif = temNotificacao() ? h('input', { type: 'checkbox', id: 'l-notif', checked: localStorageGet('notif') === 'sim' && Notification.permission === 'granted' }) : null;
  const salvar = h('button', { type: 'button', class: 'btn' }, 'Salvar');
  const j = janela({ titulo: 'Lembrete diário', corpo: h('div', {},
    h('div', { class: 'consentimento' }, ativo, h('label', { for: 'l-ativo' }, 'Quero um lembrete para fazer o exercício do dia')),
    h('div', { class: 'campo' }, h('label', { for: 'l-hora' }, 'Horário'), hora),
    h('div', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Dias'), chips),
    notif ? h('div', { class: 'consentimento' }, notif, h('label', { for: 'l-notif' }, 'Também avisar com uma notificação neste aparelho')) : null,
    h('p', { class: 'ajuda' }, 'Ao salvar, baixamos um evento repetido para o calendário do celular: é ele que avisa mesmo com o app fechado. A notificação do aparelho só aparece com o app aberto ou instalado. Perdeu um dia? Nada acontece, é só um convite.')),
    acoes: [salvar] });
  salvar.addEventListener('click', async () => {
    ocupado(salvar, true);
    try {
      const novo = { ativo: ativo.checked, hora: hora.value || '19:00', dias: [...dias] };
      await api('/perfil/lembrete', { metodo: 'PUT', corpo: novo });
      let avisoNotif = '';
      if (notif) {
        if (ativo.checked && notif.checked) {
          const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission().catch(() => 'denied');
          localStorageSet('notif', perm === 'granted' ? 'sim' : 'nao');
          if (perm !== 'granted') avisoNotif = ' As notificações estão bloqueadas neste aparelho.';
        } else localStorageSet('notif', 'nao');
      }
      j.fechar(true);
      aoSalvar?.(novo);
      dispatchEvent(new CustomEvent('inglou:lembrete', { detail: novo }));
      if (novo.ativo) { toast('Salvo. Abra o arquivo baixado para adicionar ao calendário.' + avisoNotif, { tipo: 'ok' }); location.href = '/api/v1/lembrete.ics'; }
      else toast('Lembrete desligado.');
    } catch (err) { toast(err.message, { tipo: 'erro' }); ocupado(salvar, false); }
  });
  return j;
}

// notificação no horário (só com o app aberto). Reagenda ao salvar o lembrete e quando a aba volta a ficar visível.
let timer = null;
export function agendarAviso(lem) {
  clearTimeout(timer); timer = null;
  if (!temNotificacao() || localStorageGet('notif') !== 'sim' || Notification.permission !== 'granted' || !lem?.ativo) return;
  const [hh, mm] = (lem.hora || '19:00').split(':').map(Number);
  const alvo = new Date(); alvo.setHours(hh, mm, 0, 0);
  if (alvo <= new Date()) alvo.setDate(alvo.getDate() + 1);
  timer = setTimeout(async function disparar() {
    timer = null;
    try {
      if ((lem.dias || []).includes(new Date().getDay())) {
        const d = await api('/hoje').catch(() => null);
        if (d && !d.sequencia?.estudouHoje) {
          const n = new Notification('Hora do exercício de inglês', { body: 'Sua aula de hoje está pronta. Uns minutinhos já contam!', icon: '/assets/img/icone.svg', tag: 'inglou-lembrete' });
          n.onclick = () => { focus(); location.hash = '#/hoje'; n.close(); };
        }
      }
    } finally { agendarAviso(lem); }
  }, Math.min(alvo - Date.now(), 2 ** 31 - 1));
}
