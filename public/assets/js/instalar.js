// Instalar o Inglou no celular.
import { toast, h, janela } from './ui.js?v=__V__';
// o Chrome avisa quando dá (beforeinstallprompt); no iPhone só o Safari instala, pelo menu Compartilhar
let convite = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); convite = e; dispatchEvent(new CustomEvent('inglou:instalavel')); });
addEventListener('appinstalled', () => { convite = null; toast('Inglou instalado! Procure o Tuiuiú na sua tela inicial.', { tipo: 'ok' }); });
export const jaInstalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const instalarApp = async () => { if (!convite) return false; convite.prompt(); const r = await convite.userChoice.catch(() => null); convite = null; return r?.outcome === 'accepted'; };
export const podeInstalarDireto = () => !!convite;

export const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Um botão para tudo: Chrome/Android instala direto; no iPhone o sistema não deixa, então abre o passo a passo.
export async function instalarOuGuiar() {
  if (podeInstalarDireto()) { await instalarApp(); return; }
  const passos = (titulo, lista) => h('div', {}, h('h3', {}, titulo), h('ol', { class: 'passos-instalar' }, lista.map(t => h('li', {}, t))));
  janela({ titulo: 'Instalar no celular', corpo: h('div', {},
    h('p', {}, 'O Inglou instala direto do navegador, sem loja. Fica com o ícone do Tuiuiú na tela inicial e abre em tela cheia.'),
    ehIphone() ? null : passos('Android (Chrome)', ['Abra o Inglou no Chrome.', 'Toque nos 3 pontinhos, no canto de cima.', 'Toque em "Instalar app" (ou "Adicionar à tela inicial").']),
    ehIphone() || !/android/i.test(navigator.userAgent) ? passos('iPhone (Safari)', ['Abra o Inglou no Safari.', 'Toque no botão Compartilhar, o quadrado com a setinha para cima.', 'Role a lista e toque em "Adicionar à Tela de Início".', 'Toque em "Adicionar", no canto de cima.']) : null) });
}
