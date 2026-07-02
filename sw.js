/* Service worker do Controle de Expedição
   Atualização automática + funcionamento offline (reserva).
   O número da VERSAO é trocado a cada atualização do app — é isso
   que faz os aparelhos perceberem que saiu versão nova. */
const VERSAO = 'v27';
const CACHE = 'expedicao-' + VERSAO;
const ESSENCIAIS = ['./', 'index.html', 'manifest.json', 'icone.png'];

// instala e guarda os arquivos essenciais para uso offline
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ESSENCIAIS)).catch(() => {})
  );
});

// ao ativar, limpa caches de versões antigas e assume o controle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// o app manda esta mensagem quando há versão nova -> ativa na hora
self.addEventListener('message', e => {
  if (e.data === 'ATIVAR_AGORA') self.skipWaiting();
});

// estratégia: rede primeiro (sempre o mais novo), cache como reserva offline.
// NÃO interfere na API (outra origem) nem em envios (POST).
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // deixa POST (sincronização) passar
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;       // deixa a API/externos passarem direto
  e.respondWith(
    fetch(req).then(resp => {
      const copia = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
      return resp;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
