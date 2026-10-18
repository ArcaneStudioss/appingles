/* Arcane · Google Analytics 4 com consentimento (Consent Mode v2) e eventos de conversão.
   Liga com <meta name="ga4-id" content="G-XXXXXXXXXX"> no <head>. Sem ID válido: não carrega nada e não mostra aviso.
   Nada de cookie de análise antes do "Aceitar". Precisa liberar na CSP (ver playbooks/checklist-20-itens.md). */
(() => {
  'use strict';
  const d = document;
  const id = (d.querySelector('meta[name="ga4-id"]')?.content || '').trim();
  if (!/^G-[A-Z0-9]{6,}$/.test(id)) return;

  const CHAVE = 'arcane-cookies';
  const ler = () => { try { return localStorage.getItem(CHAVE); } catch { return null; } };
  const gravar = v => { try { localStorage.setItem(CHAVE, v); } catch { /* navegador sem armazenamento: pergunta de novo na próxima */ } };

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
  gtag('js', new Date());
  gtag('config', id);
  const s = d.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  d.head.appendChild(s);

  const aplicar = ok => gtag('consent', 'update', { analytics_storage: ok ? 'granted' : 'denied' });
  const antes = ler();
  if (antes === 'sim') aplicar(true);

  if (antes === null) {
    const caixa = d.createElement('div');
    caixa.className = 'aviso-cookies';
    caixa.setAttribute('role', 'region');
    caixa.setAttribute('aria-label', 'Aviso de cookies');
    const p = d.createElement('p');
    p.append('Usamos cookies de estatística para entender como o site é usado. Você escolhe. ');
    const a = d.createElement('a');
    a.href = '/politica-de-privacidade/';
    a.textContent = 'Política de privacidade';
    p.append(a, '.');
    const acoes = d.createElement('div');
    acoes.className = 'aviso-cookies__acoes';
    const sim = d.createElement('button');
    sim.type = 'button'; sim.dataset.sim = ''; sim.textContent = 'Aceitar';
    const nao = d.createElement('button');
    nao.type = 'button'; nao.textContent = 'Recusar';
    const fechar = ok => { gravar(ok ? 'sim' : 'nao'); aplicar(ok); caixa.remove(); };
    sim.addEventListener('click', () => fechar(true));
    nao.addEventListener('click', () => fechar(false));
    acoes.append(sim, nao);
    caixa.append(p, acoes);
    d.body.appendChild(caixa);
  }

  // Eventos: toque em WhatsApp, telefone, e-mail e rota viram "generate_lead" (conversão)
  d.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href');
    const metodo = /^https:\/\/wa\.me\//.test(h) ? 'whatsapp' : /^tel:/.test(h) ? 'telefone' : /^mailto:/.test(h) ? 'email' : /google\.com\/maps\/dir|waze\.com/.test(h) ? 'rota' : null;
    if (metodo) gtag('event', metodo === 'rota' ? 'como_chegar' : 'generate_lead', { method: metodo });
  });
  // Página de obrigado: <main data-conversao="formulario"> conta o lead uma vez por carregamento
  const alvo = d.querySelector('[data-conversao]');
  if (alvo) gtag('event', 'generate_lead', { method: alvo.dataset.conversao });
})();
