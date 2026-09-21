/* Helldive Command service worker: pages network-first, versioned assets cache-first.
   Cross-origin requests (war API, fonts, CDN) are never touched. */
const VERSION='hdc-1789681734';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin) return;
  if(u.pathname.endsWith('.html')||u.pathname.endsWith('/')){
    e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(VERSION).then(k=>k.put(e.request,c)); return r; })
      .catch(()=>caches.match(e.request).then(r=>r||caches.match(new URL('index.html',self.registration.scope).href))));
    return;
  }
  if(/\/(assets|data)\//.test(u.pathname)||u.pathname.endsWith('manifest.webmanifest')){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{ if(res.ok){ const c=res.clone(); caches.open(VERSION).then(k=>k.put(e.request,c)); } return res; })));
  }
});
