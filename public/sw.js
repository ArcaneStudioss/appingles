// Service worker do Inglou: abre o app mesmo sem internet e acelera as visitas seguintes.
// Nunca guarda chamadas da API (dados da pessoa) nem áudio por faixa de bytes. __V__ vira a versão do deploy.
const VERSAO = '__V__';
const CACHE = 'inglou-' + VERSAO;
const BASE = ['/app/', '/assets/css/app.css?v=' + VERSAO, '/assets/js/app.js?v=' + VERSAO, '/favicon.svg'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(BASE.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('inglou-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const guardar = async (req, res) => {
  if (res && res.status === 200 && res.type === 'basic') { try { (await caches.open(CACHE)).put(req, res.clone()); } catch {} }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || req.headers.has('range')) return;
  if (url.pathname === '/sw.js') return;

  // Páginas: rede primeiro (sempre a versão nova); sem rede, a última cópia ou o app.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { return await guardar(req, await fetch(req)); }
      catch { return (await caches.match(req)) || (url.pathname.startsWith('/app') && (await caches.match('/app/'))) || (await caches.match('/')) || Response.error(); }
    })());
    return;
  }

  // Arquivos com ?v=: o endereço muda a cada deploy, então a cópia guardada nunca fica velha.
  if (url.searchParams.has('v')) {
    e.respondWith((async () => (await caches.match(req)) || guardar(req, await fetch(req)))());
    return;
  }

  // Demais arquivos (imagens, fontes, áudios curtos): mostra o que tiver e atualiza por baixo.
  e.respondWith((async () => {
    const guardado = await caches.match(req);
    const rede = fetch(req).then(r => guardar(req, r)).catch(() => null);
    return guardado || (await rede) || Response.error();
  })());
});
