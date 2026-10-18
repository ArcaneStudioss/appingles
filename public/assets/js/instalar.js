// Instalar o Inglou no celular.
import { toast } from './ui.js?v=__V__';
// o Chrome avisa quando dá (beforeinstallprompt); no iPhone só o Safari instala, pelo menu Compartilhar
let convite = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); convite = e; dispatchEvent(new CustomEvent('inglou:instalavel')); });
addEventListener('appinstalled', () => { convite = null; toast('Inglou instalado! Procure o Tuiuiú na sua tela inicial.', { tipo: 'ok' }); });
export const jaInstalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const instalarApp = async () => { if (!convite) return false; convite.prompt(); const r = await convite.userChoice.catch(() => null); convite = null; return r?.outcome === 'accepted'; };
export const podeInstalarDireto = () => !!convite;

export const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
