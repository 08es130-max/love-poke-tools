const CACHE_PREFIX = 'lovepoke-';
const CACHE_NAME = `${CACHE_PREFIX}v20260909-9`;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './pokemon-data.js',
  './pokemon-ui.js',
  './loveca-card-browser.js',
  './loveca-filter-selector.js',
  './loveca-card-browser.css',
  './loveca-cards.json',
  './firebase-config.js',
  './firebase-client.js',
  './tournament.js',
  './mahjong.js',
  './manifest.webmanifest',
  './icons/icon-192.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      if(response.ok){
        const cache=await caches.open(CACHE_NAME);
        await cache.put(event.request,response.clone());
      }
      return response;
    }catch{
      const cached=await caches.match(event.request);
      if(cached)return cached;
      if(event.request.mode==='navigate'){
        return (await caches.match('./index.html')) || Response.error();
      }
      return Response.error();
    }
  })());
});
