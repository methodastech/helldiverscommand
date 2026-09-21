/* ============================================================
   HELLDIVE COMMAND — shared runtime
   Boot sequence · chrome · reveals · decode type · live war API
   ============================================================ */
(function(){
'use strict';

/* ---------- tiny helpers ---------- */
const $  = (s,r)=> (r||document).querySelector(s);
const $$ = (s,r)=> Array.from((r||document).querySelectorAll(s));
const el = (t,c,h)=>{const n=document.createElement(t); if(c)n.className=c; if(h!=null)n.innerHTML=h; return n;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt = n => (n==null||isNaN(n))?'--':n.toLocaleString('en-US');
const short= n => n>=1e9?(n/1e9).toFixed(2)+'B' : n>=1e6?(n/1e6).toFixed(1)+'M' : n>=1e3?(n/1e3).toFixed(1)+'K' : String(n);
window.HD={$,$$,el,clamp,fmt,short};
const VER=((document.currentScript&&document.currentScript.src.match(/[?&]v=(\d+)/))||[])[1]||'1';
const SEARCH_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
/* stratagem icon: real in-game icon when we have it, community SVG otherwise */
window.stratIcon=function(ic){
  const R=window.HD_IMG&&window.HD_IMG.strat;
  return (R&&R[ic]) ? 'assets/img/strat/'+ic+'.webp' : 'assets/icons/'+ic+'.svg';
};

/* ---------- shared sound: real game samples, synthesised fallback ----------
   dir_*.mp3 and gameover_*.mp3 are the actual in-game stratagem input beeps and
   Stratagem Hero jingles (via the Stratagem Hero Online project). ready / deny /
   menu_* / throw are cut from that project's raw SFX dump and assigned by ear-
   by-analysis, so they are close but not guaranteed to be the exact game cue. */
window.HDSFX=(function(){
  let ctx=null, on=(()=>{try{const v=localStorage.getItem('hd_sfx');return v==null?true:JSON.parse(v);}catch(e){return true;}})();
  const BASE=(document.currentScript&&document.currentScript.src?document.currentScript.src.replace(/assets\/core\.js.*$/,''):'')+'assets/sfx/';
  const FILES={U:'dir_u.mp3',D:'dir_d.mp3',L:'dir_l.mp3',R:'dir_r.mp3',ready:'ready.wav',deny:'deny.wav',
               menu_open:'menu_open.wav',menu_close:'menu_close.wav',throw:'throw.wav',over1:'gameover_1.mp3',over2:'gameover_2.mp3'};
  const buf={}, loading={};
  const ensure=()=>{ if(!ctx){ try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} }
                     if(ctx&&ctx.state==='suspended')ctx.resume(); return ctx; };
  function load(k){
    if(buf[k]||loading[k]) return; loading[k]=true;
    const c=ensure(); if(!c) return;
    fetch(BASE+FILES[k]).then(r=>r.arrayBuffer()).then(ab=>c.decodeAudioData(ab)).then(b=>{buf[k]=b;}).catch(()=>{});
  }
  function preload(){ Object.keys(FILES).forEach(load); }
  function sample(k,vol,rate){
    if(!on) return false; const c=ensure(); if(!c) return false;
    const b=buf[k]; if(!b){ load(k); return false; }
    const src=c.createBufferSource(), g=c.createGain();
    src.buffer=b; src.playbackRate.value=rate||1; g.gain.value=vol==null?0.55:vol;
    src.connect(g); g.connect(c.destination); src.start(); return true;
  }
  function tone(f,dur,type,vol){
    if(!on)return; const c=ensure(); if(!c)return;
    const o=c.createOscillator(), g=c.createGain();
    o.type=type||'square'; o.frequency.value=f;
    g.gain.setValueAtTime(0,c.currentTime);
    g.gain.linearRampToValueAtTime(vol||0.06,c.currentTime+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+(dur||0.09));
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+(dur||0.09)+0.02);
  }
  const DIR={U:880,R:740,D:620,L:520};
  const api={
    dir:d=>{ if(!sample(d,0.6)) tone(DIR[d]||700,0.07,'square',0.05); },
    ok:()=>{ if(!sample('ready',0.55)) {tone(1046,0.08,'square',0.05);setTimeout(()=>tone(1568,0.13,'square',0.05),70);} },
    perfect:()=>{ if(!sample('ready',0.7,1.06)) [880,1174,1568,2093].forEach((f,i)=>setTimeout(()=>tone(f,0.1,'triangle',0.05),i*55)); },
    bad:()=>{ if(!sample('deny',0.5)) tone(150,0.20,'sawtooth',0.05); },
    over:()=>{ if(!sample(Math.random()<.5?'over1':'over2',0.55)) [440,330,247,165].forEach((f,i)=>setTimeout(()=>tone(f,0.22,'sawtooth',0.05),i*130)); },
    open:()=>{ if(!sample('menu_open',0.4)) tone(1200,0.05,'sine',0.03); },
    close:()=>{ if(!sample('menu_close',0.35)) tone(900,0.05,'sine',0.03); },
    throw:()=>{ if(!sample('throw',0.5)) tone(300,0.12,'triangle',0.05); },
    tick:()=>tone(1400,0.03,'sine',0.03),
    ui:()=>tone(1800,0.025,'sine',0.02),
    /* field cues, synthesised: the beacon's rising ping, a hellpod impact, an Eagle pass */
    beacon:(k)=>tone(900+k*260,0.05,'square',0.035),
    thud:()=>{ if(!on)return; const c=ensure(); if(!c)return; const o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(140,c.currentTime); o.frequency.exponentialRampToValueAtTime(38,c.currentTime+0.35); g.gain.setValueAtTime(0.5,c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.5); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+0.55); },
    flyby:()=>{ if(!on)return; const c=ensure(); if(!c)return; const n=c.sampleRate*1.2, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++){ d[i]=(Math.random()*2-1)*Math.pow(Math.sin(Math.PI*i/n),2); } const src=c.createBufferSource(); src.buffer=b; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.setValueAtTime(600,c.currentTime); f.frequency.exponentialRampToValueAtTime(2400,c.currentTime+0.5); f.frequency.exponentialRampToValueAtTime(300,c.currentTime+1.2); f.Q.value=1.2; const g=c.createGain(); g.gain.value=0.35; src.connect(f); f.connect(g); g.connect(c.destination); src.start(); },
    boom:()=>{ if(!on)return; const c=ensure(); if(!c)return; const n=c.sampleRate*0.9, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2); } const src=c.createBufferSource(); src.buffer=b; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420; const g=c.createGain(); g.gain.value=0.7; src.connect(f); f.connect(g); g.connect(c.destination); src.start(); },
    klaxon:()=>{ tone(520,0.18,'square',0.04); setTimeout(()=>tone(390,0.18,'square',0.04),200); },
    beep:(f,d)=>tone(f||1000,d||0.06,'square',0.04),
    set(v){on=!!v;try{localStorage.setItem('hd_sfx',JSON.stringify(on));}catch(e){} if(on){ensure();preload();} document.dispatchEvent(new CustomEvent('hd:sfx',{detail:on})); return on;},
    toggle(){return api.set(!on);},
    get on(){return on;},
    wake(){ ensure(); preload(); return ctx; },
    preload
  };
  /* audio contexts need a gesture: preload on the first interaction */
  ['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{ if(on){ensure();preload();} },{once:true,passive:true}));
  return api;
})();

/* ---------- grain texture ---------- */
(function grain(){
  const c=document.createElement('canvas');c.width=c.height=128;
  const x=c.getContext('2d'),d=x.createImageData(128,128),p=d.data;
  for(let i=0;i<p.length;i+=4){const v=Math.random()*255|0;p[i]=p[i+1]=p[i+2]=v;p[i+3]=26;}
  x.putImageData(d,0,0);
  document.documentElement.style.setProperty('--noise',`url(${c.toDataURL()})`);
})();

/* ---------- fixed chrome ---------- */
function chrome(){
  if($('.fx'))return;
  const f=el('div','fx');
  f.innerHTML='<div class="fx-scan"></div><div class="fx-grain"></div><div class="fx-vig"></div>';
  document.body.appendChild(f);
}

/* ---------- arrow glyph ---------- */
const ARROW_PATH='M50 6 L94 50 L70 50 L70 94 L30 94 L30 50 L6 50 Z';
const ROT={U:0,R:90,D:180,L:270};
window.arrowSVG=function(dir,cls){
  return `<span class="arw ${cls||''}" data-d="${dir}"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="${ARROW_PATH}" transform="rotate(${ROT[dir]} 50 50)"/></svg></span>`;
};
window.arrowRow=function(code,cls){
  return '<span class="arrows">'+code.split('').map(d=>window.arrowSVG(d,cls)).join('')+'</span>';
};

/* ---------- reveal on scroll ---------- */
function reveals(){
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{rootMargin:'0px 0px -8% 0px',threshold:.05});
  $$('.rv').forEach(n=>io.observe(n));
  window.HD.observeReveals=()=>$$('.rv:not(.in)').forEach(n=>io.observe(n));
  /* nothing stays invisible. Near-viewport blocks get a nudge early; after a
     few seconds every remaining reveal is forced on, observer or not. */
  setTimeout(()=>$$('.rv:not(.in)').forEach(n=>{
    if(n.getBoundingClientRect().top < innerHeight*1.25) n.classList.add('in');
  }),2200);
  setTimeout(()=>$$('.rv:not(.in)').forEach(n=>n.classList.add('in')),6000);
  window.HD.revealAll=()=>$$('.rv').forEach(n=>n.classList.add('in'));
}

/* ---------- decode / scramble type ---------- */
const GLYPH='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%*/\\<>[]';
function decode(node,dur){
  const target=node.dataset.txt||node.textContent.trim();
  node.dataset.txt=target;
  /* a scramble nobody can watch is just broken text: skip it when hidden */
  if(document.hidden || matchMedia('(prefers-reduced-motion:reduce)').matches){
    node.textContent=target; return;
  }
  const start=performance.now(), D=dur||760;
  let done=false;
  const finish=()=>{ if(done)return; done=true; node.textContent=target; };
  (function step(t){
    if(done)return;
    const p=clamp((t-start)/D,0,1);
    const shown=Math.floor(target.length*p);
    let out='';
    for(let i=0;i<target.length;i++){
      const ch=target[i];
      if(ch===' '){out+=' ';continue;}
      out+= i<shown ? ch : GLYPH[(Math.random()*GLYPH.length)|0];
    }
    node.textContent=out;
    if(p<1)requestAnimationFrame(step); else finish();
  })(start);
  /* rAF is paused in background tabs: guarantee the readable text lands */
  setTimeout(finish,D+400);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) finish(); },{once:true});
}
function decoders(){
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ decode(e.target); io.unobserve(e.target);} });
  },{threshold:.4});
  $$('[data-decode]').forEach(n=>io.observe(n));
}

/* ---------- count up ---------- */
function counters(){
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(!e.isIntersecting)return; io.unobserve(e.target);
      const n=e.target, to=parseFloat(n.dataset.to||'0'), dec=parseInt(n.dataset.dec||'0',10),
            suf=n.dataset.suf||'', ab=n.dataset.abbr==='1', D=1500, s=performance.now();
      (function tick(t){
        const p=clamp((t-s)/D,0,1), e2=1-Math.pow(1-p,3), v=to*e2;
        n.textContent=(ab?short(Math.round(v)):v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}))+suf;
        if(p<1)requestAnimationFrame(tick);
      })(s);
    });
  },{threshold:.5});
  $$('[data-to]').forEach(n=>io.observe(n));
}

/* ---------- magnetic buttons + crosshair cursor ---------- */
function pointer(){
  if(matchMedia('(hover:none)').matches)return;
  const c=el('div','xh');
  c.innerHTML='<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="1"/><path d="M20 2v8M20 30v8M2 20h8M30 20h8" stroke="currentColor" stroke-width="1"/></svg>';
  document.body.appendChild(c);
  let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y;
  addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;},{passive:true});
  addEventListener('pointerdown',()=>c.classList.add('dn'));
  addEventListener('pointerup',()=>c.classList.remove('dn'));
  (function loop(){cx+=(x-cx)*.22;cy+=(y-cy)*.22;c.style.transform=`translate(${cx-20}px,${cy-20}px)`;requestAnimationFrame(loop);})();
  document.addEventListener('pointerover',e=>{
    c.classList.toggle('hot', !!e.target.closest('a,button,.chip,.card,input,select'));
  });
}

/* ---------- boot sequence ---------- */
const BOOT=[
 'SUPER EARTH ARMED FORCES // TACTICAL NETWORK',
 'ESTABLISHING UPLINK TO SUPER DESTROYER .......... OK',
 'AUTHENTICATING CITIZEN CLEARANCE ................ OK',
 'SYNCING GALACTIC WAR TELEMETRY .................. OK',
 'LOADING ARSENAL / STRATAGEM / BESTIARY CODEX .... OK',
 'DEMOCRACY LEVEL ................................. MAXIMUM',
 '',
 '> WELCOME BACK, HELLDIVER.'
];
function boot(){
  const done=()=>{sessionStorage.setItem('hd_boot','1');document.body.classList.add('ready');};
  if(sessionStorage.getItem('hd_boot')==='1' || document.hidden){done();return;}
  const o=el('div','boot');
  o.innerHTML='<div class="boot-in"><div class="boot-mark"><img src="assets/img/brand/crest.webp" alt="" decoding="async"><i></i><b>Helldive Command</b><span>Longevity Program &middot; Classified</span></div><pre id="bootLog"></pre><div class="boot-bar"><i></i></div></div>';
  document.body.appendChild(o);
  const log=$('#bootLog',o), bar=$('.boot-bar i',o);
  const full=BOOT.join('\n'), CH=full.length, DUR=2600;
  let finished=false;
  function finish(){
    if(finished)return; finished=true;
    log.textContent=full; bar.style.width='100%'; done();
    o.classList.add('out'); setTimeout(()=>o.remove(),700);
  }
  const t0=performance.now();
  (function step(t){
    if(finished)return;
    const p=clamp((t-t0)/DUR,0,1);
    const n=Math.floor(CH*p);
    log.textContent=full.slice(0,n);
    bar.style.width=(p*100).toFixed(1)+'%';
    if(p<1) requestAnimationFrame(step); else setTimeout(finish,320);
  })(t0);
  /* hidden tabs throttle rAF: never leave the visitor staring at a splash */
  setTimeout(finish,DUR+1400);
  addEventListener('keydown',e=>{if(e.key==='Escape')finish();},{once:true});
  o.addEventListener('click',finish);
}

/* ============================================================
   LIVE GALACTIC WAR CLIENT
   Primary : api.helldivers2.dev  (needs 2 identifying headers)
   Fallback: helldiverstrainingmanual.com (no headers)
   ============================================================ */
const API='https://api.helldivers2.dev/api/v1/';
const ALT='https://helldiverstrainingmanual.com/api/v1/';
const H={'X-Super-Client':'helldive-command-fansite','X-Super-Contact':'helldive-command'};
const CACHE={};
const LS='hd_war_cache_';
function lsGet(k,ttl){ try{const v=JSON.parse(localStorage.getItem(LS+k)); if(v&&Date.now()-v.t<ttl) return v.v;}catch(e){} return null; }
function lsSet(k,v){ try{localStorage.setItem(LS+k,JSON.stringify({t:Date.now(),v}));}catch(e){} }
/* the fallback API speaks a different dialect; translate to the primary shape */
const OWN={1:'Humans',2:'Terminids',3:'Automaton',4:'Illuminate'};
async function alt(path){
  if(path==='assignments'){
    const a=await (await fetch(ALT+'war/major-orders')).json();
    return (a||[]).map(m=>({id:m.id32,title:(m.setting&&m.setting.overrideTitle)||'MAJOR ORDER',
      briefing:(m.setting&&m.setting.overrideBrief)||'',description:(m.setting&&m.setting.taskDescription)||'',
      progress:m.progress,reward:m.setting&&m.setting.reward?{type:m.setting.reward.type,amount:m.setting.reward.amount}:null,
      expiration:new Date(Date.now()+(m.expiresIn||0)*1000).toISOString()}));
  }
  if(path==='dispatches'){
    const n=await (await fetch(ALT+'war/news')).json();
    return (n||[]).slice().reverse().map(x=>({id:x.id,published:null,message:x.message}));
  }
  if(path==='war'){
    const st=await (await fetch(ALT+'war/status')).json();
    const players=(st.planetStatus||[]).reduce((a,p)=>a+(p.players||0),0);
    return {factions:['Humans','Terminids','Automaton','Illuminate'],statistics:{playerCount:players}};
  }
  if(path==='planets'){
    const [inf,st,names]=await Promise.all([fetch(ALT+'war/info').then(r=>r.json()),fetch(ALT+'war/status').then(r=>r.json()),fetch(ALT+'planets').then(r=>r.json()).catch(()=>({}))]);
    const byIdx={}; (st.planetStatus||[]).forEach(p=>byIdx[p.index]=p);
    return (inf.planetInfos||[]).map(p=>{const s=byIdx[p.index]||{}; const nm=names[p.index]||{};
      return {index:p.index,name:nm.name||('PLANET '+p.index),sector:nm.sector||'',biome:nm.biome?{name:nm.biome.slug,description:nm.biome.description}:null,
        hazards:(nm.environmentals||[]).map(h=>({name:h.name,description:h.description})),position:p.position,waypoints:p.waypoints||[],
        currentOwner:OWN[s.owner]||'Humans',health:s.health||0,maxHealth:p.maxHealth||1000000,regenPerSecond:s.regenPerSecond||0,
        statistics:{playerCount:s.players||0}};});
  }
  throw new Error('no fallback for '+path);
}
async function api(path,ttl){
  ttl=ttl||120000;
  const c=CACHE[path]; if(c && Date.now()-c.t<ttl) return c.v;
  const cached=lsGet(path,ttl); if(cached){ CACHE[path]={t:Date.now(),v:cached}; return cached; }
  let v=null;
  try{
    /* four seconds, then the mirror: a slow primary must never hold the page's numbers hostage */
    const ac=('AbortController' in window)?new AbortController():null; const tm=ac?setTimeout(()=>ac.abort(),4000):0;
    const r=await fetch(API+path,Object.assign({headers:H},ac?{signal:ac.signal}:{})); clearTimeout(tm);
    if(!r.ok) throw new Error(path+' '+r.status);
    v=await r.json();
  }catch(e){
    v=await alt(path);      /* primary rate-limited or blocked: community mirror */
  }
  CACHE[path]={t:Date.now(),v}; lsSet(path,v);
  return v;
}
window.HDWar={
  api,
  war:      ()=>api('war',300000),
  planets:  ()=>api('planets',900000),
  orders:   ()=>api('assignments',300000),
  dispatch: ()=>api('dispatches',300000),
  campaigns:()=>api('campaigns',60000),
  clean(s){ return String(s||'').replace(/<i=\d>/g,'').replace(/<\/i>/g,'').replace(/<[^>]*>/g,'').trim(); }
};

/* ---------- nav + footer injection ---------- */
const PAGES=[
 ['index.html','Command'],
 ['stratagems.html','Stratagems'],
 ['arsenal.html','Arsenal'],
 ['enemies.html','Bestiary'],
 ['arcade.html','Arcade'],
 ['terminals.html','Field Ops'],
 ['meta.html','Meta'],
 ['warbonds.html','Warbonds'],
 ['armory.html','Armory'],
 ['manual.html','Manual'],
 ['blueberries.html','Blueberries'],
 ['hellpod.html','Hellpod'],
 ['intel.html','Intel']
];
/* grouped navigation: four top-level items, everything else in dropdowns */
const NAVICON={"arcade.html?go=hero": "<rect x=\"2.5\" y=\"6.5\" width=\"19\" height=\"12\" rx=\"2.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M8 10v5M5.5 12.5h5\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/><circle cx=\"16\" cy=\"11.4\" r=\"1.2\" fill=\"currentColor\"/><circle cx=\"18.4\" cy=\"13.8\" r=\"1.2\" fill=\"currentColor\"/>", "arcade.html?go=range": "<circle cx=\"12\" cy=\"12\" r=\"7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4\" stroke=\"currentColor\" stroke-width=\"1.7\"/><circle cx=\"12\" cy=\"12\" r=\"2\" fill=\"currentColor\"/>", "enemies.html#simSec": "<circle cx=\"12\" cy=\"12\" r=\"7.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4\" stroke=\"currentColor\" stroke-width=\"1.7\"/><circle cx=\"12\" cy=\"12\" r=\"2\" fill=\"currentColor\"/>", "stratagems.html": "<path d=\"M12 2.6 21.4 12 12 21.4 2.6 12Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/><path d=\"M12 7.4v9.2M8.2 11.2 12 7.4l3.8 3.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>","arsenal.html": "<path d=\"M2.6 13.4h10.2l1.6-3H21.4v3.1h-2.3l-1.3 4.4H9.6v-2.5H2.6Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/><path d=\"M6 13.4V17\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/>","enemies.html": "<path d=\"M12 3.2c4.3 0 7.3 3 7.3 7.3v3.2l1.9 4.5H2.8l1.9-4.5v-3.2c0-4.3 3-7.3 7.3-7.3Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/><circle cx=\"9.1\" cy=\"11.4\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"14.9\" cy=\"11.4\" r=\"1.5\" fill=\"currentColor\"/>","armory.html": "<path d=\"M12 2.8 4.6 6v6.1c0 4.3 3.2 7.4 7.4 8.8 4.2-1.4 7.4-4.5 7.4-8.8V6Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/><path d=\"M9.2 12.2 11.3 14l3.6-4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>","warbonds.html": "<path d=\"M4.4 3.4h15.2v17.2l-7.6-3.9-7.6 3.9Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/><path d=\"M8.4 8.2h7.2M8.4 11.8h4.6\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/>","meta.html": "<path d=\"M3.4 20V9.6M9.8 20V4.4M16.2 20v-7.4M22 20H2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/>","manual.html": "<path d=\"M4 4.6h6.2c1 0 1.8.8 1.8 1.8V20c0-1-.8-1.8-1.8-1.8H4Zm16 0h-6.2c-1 0-1.8.8-1.8 1.8V20c0-1 .8-1.8 1.8-1.8H20Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/>","arcade.html": "<rect x=\"2.6\" y=\"6.4\" width=\"18.8\" height=\"11.8\" rx=\"2.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M8 10v5M5.5 12.5h5\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/><circle cx=\"16\" cy=\"11.4\" r=\"1.2\" fill=\"currentColor\"/><circle cx=\"18.4\" cy=\"14\" r=\"1.2\" fill=\"currentColor\"/>","terminals.html": "<rect x=\"2.8\" y=\"4\" width=\"18.4\" height=\"13\" rx=\"1.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M6.4 8.2 9 10.6l-2.6 2.4M11.4 13.2h5.2M8.4 20h7.2\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>","blueberries.html": "<circle cx=\"12\" cy=\"8\" r=\"3.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M4.6 20.4c0-3.9 3.3-6.4 7.4-6.4s7.4 2.5 7.4 6.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/>","hellpod.html": "<path d=\"M12 2.6c3.1 2.6 4.6 6 4.6 9.6 0 3-1.5 5.9-4.6 8.8-3.1-2.9-4.6-5.8-4.6-8.8 0-3.6 1.5-7 4.6-9.6Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/><circle cx=\"12\" cy=\"10.4\" r=\"2.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/>","intel.html": "<circle cx=\"12\" cy=\"12\" r=\"9.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\"/><path d=\"M12 10.8V17M12 7.4v.1\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\"/>"};
const GROUPS=[
 {n:'Command',href:'index.html'},
 {n:'Codex',items:[['stratagems.html','Stratagems','93 input codes, drill any of them'],['arsenal.html','Arsenal','109 weapons, ranked per faction'],['enemies.html','Bestiary','57 enemies and their weak points'],['enemies.html#simSec','Simulator','Any weapon against any enemy, zone by zone'],['armory.html','Armory','41 sets and every passive'],['warbonds.html','Warbonds','25 reviewed, with a buy order'],['meta.html','Meta','Tier lists and the loadout builder'],['manual.html','Manual','Currencies, modules, controls']]},
 {n:'Train',items:[['terminals.html','Field Ops','Eleven mission terminals, phase for phase'],['arcade.html?go=hero','Stratagem Hero','Codes with the hold rule, five drills'],['arcade.html?go=range','Helldive Simulator','Throw, aim and shoot in 3D']]},
 {n:'Intel',items:[['blueberries.html','Blueberries','The file on new Helldivers'],['hellpod.html','Hellpod','Cross-section and the drop'],['intel.html','Intel','Difficulty, boosters, glossary']]}
];
/* brand mark: the Helldivers skull */
const MARK='<img class="brand-mk" src="assets/img/brand/crest.webp" alt="" width="34" height="34" decoding="async">';
function nav(){
  const here=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const n=el('header','nav');
  n.innerHTML='<div class="nav-in">'+
    `<a class="brand" href="index.html">${MARK}<span><b>Helldive Command</b><span>Longevity Program &middot; Classified</span></span></a>`+
    '<div class="nav-wrap"><nav class="nav-links" aria-label="Primary">'+
      GROUPS.map(g=>{
        if(g.href) return `<a href="${g.href}"${g.href===here?' class="on" aria-current="page"':''}>${g.n}</a>`;
        const on=g.items.some(i=>i[0]===here);
        return `<div class="nav-g${on?' on':''}"><button type="button" aria-haspopup="true" aria-expanded="false">${g.n}<i></i></button><div class="nav-dd" role="menu"><div class="nav-dd-in">${g.items.map(i=>`<a role="menuitem" href="${i[0]}"${i[0]===here?' class="on" aria-current="page"':''}><i class="dd-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${NAVICON[i[0]]||''}</svg></i><span class="dd-tx"><b>${i[1]}</b><span>${i[2]}</span></span></a>`).join('')}</div></div></div>`;
      }).join('')+
    '</nav></div>'+
    `<button type="button" class="nav-search" id="navSearch" aria-label="Search the codex">${SEARCH_ICON}<kbd>/</kbd></button>`+
    '<button class="nav-sfx" id="navSfx" aria-pressed="true" aria-label="Toggle sound" title="Sound on or off">'+
      '<svg class="sfx-spk" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.4h3.6L12 5.4v13.2l-4.4-4H4Z" fill="currentColor"/>'+
      '<path class="sfx-w1" d="M15 9.6a3.4 3.4 0 0 1 0 4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'+
      '<path class="sfx-w2" d="M17.6 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'+
      '<path class="sfx-x" d="M16.2 9.4 21 14.6M21 9.4l-4.8 5.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'+
      '<span class="sfx-lbl">Sound</span></button>'+
    '<a class="btn sm nav-cta" href="arcade.html">Train now <span class="ar">&#9654;</span></a>'+
  '</div>';
  document.body.insertBefore(n,document.body.firstChild);
  /* super admin bar: one markup, every page; only the current tab differs. Sheet: assets/bmws.css */
  const bar=el('div','bmws'); bar.setAttribute('style','--bmws-acc:#2536F5');
  const TABS=[['index.html','00','Website'],['competitors.html','01','Competitors'],['logo.html','02','Logo'],['taste.html','03','Taste']];
  const curTab=['competitors.html','logo.html','taste.html'].includes(here)?here:'index.html';
  bar.innerHTML='<div class="bmws-in"><div class="bmws-crumb"><b>Helldive Command &middot; Website 1</b><span>Brand Method &middot; Admin Navigation</span></div><nav class="bmws-tabs">'+
    TABS.map(t=>`<a href="${t[0]}"${t[0]===curTab?' class="on"':''}><i>${t[1]}</i>${t[2]}</a>`).join('')+'</nav></div>';
  document.body.insertBefore(bar,n);
  const fit=()=>document.documentElement.style.setProperty('--bmws-h',Math.round(bar.getBoundingClientRect().height)+'px');
  fit(); if(window.ResizeObserver) new ResizeObserver(fit).observe(bar); addEventListener('resize',fit); addEventListener('load',fit);
  n.querySelector('#navSearch').addEventListener('click',()=>search());
  const sfxBtn=n.querySelector('#navSfx');
  const paintSfx=()=>{sfxBtn.classList.toggle('off',!window.HDSFX.on);sfxBtn.setAttribute('aria-pressed',String(window.HDSFX.on));};
  sfxBtn.addEventListener('click',()=>{window.HDSFX.toggle();if(window.HDSFX.on)window.HDSFX.ok();});
  document.addEventListener('hd:sfx',paintSfx); paintSfx();
  /* dropdowns: click toggles (touch and keyboard), hover handled in CSS, outside click and Escape close */
  n.querySelectorAll('.nav-g > button').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); const g=b.parentNode, open=g.classList.contains('open'); n.querySelectorAll('.nav-g.open').forEach(x=>{x.classList.remove('open');x.querySelector('button').setAttribute('aria-expanded','false');}); if(!open){ g.classList.add('open'); b.setAttribute('aria-expanded','true'); } }));
  document.addEventListener('click',()=>n.querySelectorAll('.nav-g.open').forEach(x=>{x.classList.remove('open');x.querySelector('button').setAttribute('aria-expanded','false');}));
  /* hover intent: the panel stays open while the pointer travels down into it, and closes a beat after leaving */
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){ n.querySelectorAll('.nav-g').forEach(g=>{ let t=0; const b=g.querySelector('button');
    g.addEventListener('mouseenter',()=>{ clearTimeout(t); n.querySelectorAll('.nav-g.open').forEach(x=>{ if(x!==g){x.classList.remove('open');x.querySelector('button').setAttribute('aria-expanded','false');} }); g.classList.add('open'); b.setAttribute('aria-expanded','true'); });
    g.addEventListener('mouseleave',()=>{ t=setTimeout(()=>{ g.classList.remove('open'); b.setAttribute('aria-expanded','false'); },260); }); }); }
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') n.querySelectorAll('.nav-g.open').forEach(x=>{x.classList.remove('open');x.querySelector('button').setAttribute('aria-expanded','false');}); });
  /* capture harness: ?nav=codex|train|intel renders that dropdown open */
  const forced=(new URLSearchParams(location.search).get('nav')||'').toLowerCase(); if(forced){ n.querySelectorAll('.nav-g').forEach(g=>{ if(g.querySelector('button').textContent.trim().toLowerCase()===forced){ g.classList.add('open'); g.querySelector('button').setAttribute('aria-expanded','true'); } }); }
  /* fade hint when the tab strip is scrollable, and reveal the current page */
  const links=n.querySelector('.nav-links'), wrap=n.querySelector('.nav-wrap');
  const sync=()=>wrap.classList.toggle('more', links.scrollWidth-links.clientWidth-links.scrollLeft>6);
  links.addEventListener('scroll',sync,{passive:true});
  addEventListener('resize',sync,{passive:true});
  const cur=links.querySelector('a.on');
  if(cur) links.scrollLeft=Math.max(0,cur.offsetLeft-40);
  sync();
}
const FICON_=()=>({
  command:TABS[0][2], codex:TABS[1][2],
  train:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  intel:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20 12 4l9 16H3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v4M12 16.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  sources:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  link:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14 20 4M14 4h6v6M18 13v6H5V6h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
});
function footer(){
  const FICON=FICON_();   /* built at call time: TABS is declared further down the file */
  const f=el('footer','foot');
  const col=(icon,title,items)=>`<div class="foot-col"><p class="foot-h"><i class="fi">${icon}</i>${title}</p><ul>${items.map(([href,label,ext])=>`<li><a href="${href}"${ext?' target="_blank" rel="noopener noreferrer"':''}>${label}${ext?'<i class="fi ext">'+FICON.link+'</i>':''}</a></li>`).join('')}</ul></div>`;
  f.innerHTML=
  '<div class="hazard thin foot-hazard"></div>'+
  '<div class="wrap">'+
  '<div class="foot-grid">'+
    `<div class="foot-brandcol"><a class="brand" href="index.html">${MARK}<span><b>Helldive Command</b><span>Longevity Program &middot; Classified</span></span></a>`+
    '<p class="t-lead">Classified continuation training for divers who intend to finish Super Helldive on the life they already have. Live war telemetry, the full codex, the real terminal puzzles, and drills that fit the wait between deaths. Freedom never sleeps!</p>'+
    '<div class="foot-insignia"><img src="assets/img/brand/flag.webp" alt="Flag of Super Earth" width="84" height="51"><img src="assets/img/brand/seaf.webp" alt="Super Earth Armed Forces" width="66" height="47"><img src="assets/img/brand/ministry-truth.svg" alt="Ministry of Truth" width="40" height="40"><img src="assets/img/brand/ministry-defense.svg" alt="Ministry of Defense" width="40" height="40"></div>'+
    '<p class="foot-approved">Approved by the Ministry of Truth. Sweet Liberty protects the reader.</p></div>'+
    col(FICON.command,'Command',[['index.html#now','Got thirty seconds'],['index.html#d10','Super Helldive briefing'],['index.html#codex','Everything, indexed']])+
    col(FICON.codex,'Codex',GROUPS[1].items.map(p=>[p[0],p[1]]))+
    col(FICON.train,'Train',[['arcade.html?go=hero','Stratagem Hero'],['arcade.html?go=rush','Code Rush'],['arcade.html?go=intel','Enemy Intel Drill'],['arcade.html?go=reflex','Hellpod Reflex'],['arcade.html?go=field','Field Drill'],['arcade.html?go=range','Helldive Simulator'],['terminals.html','Field Ops terminals'],['terminals.html#controls','Controls'],['#','Your training record','',1]].map(x=>x[3]?['#" onclick="window.HD.record();return false','Your training record']:x))+
    col(FICON.intel,'Intel',GROUPS[3].items.map(p=>[p[0],p[1]]).concat([['intel.html#legal','Disclaimer']]))+
    col(FICON.sources,'Sources',[['https://helldivers.wiki.gg/','The Helldivers Wiki',1],['https://helldivers.fandom.com/','Helldivers Wiki (Fandom)',1],['https://github.com/helldivers-2/api','Community War API',1],['https://store.steampowered.com/news/app/553850','Arrowhead patch notes',1],['https://combustibletoast.github.io/','Stratagem Hero Online',1]])+
  '</div>'+
  '<div class="foot-word" aria-hidden="true">FOR DEMOCRACY</div>'+
  '<div class="foot-bot"><span class="mono dim">Unofficial fan site &middot; not affiliated with Arrowhead Game Studios or Sony Interactive Entertainment &middot; HELLDIVERS is a trademark of Sony Interactive Entertainment</span>'+
  '<span class="mono dim">Data current to Patch 7.x &middot; September 2026 &middot; <a href="intel.html#legal">Legal</a> &middot; <a href="#top" onclick="scrollTo({top:0,behavior:\'smooth\'});return false">Top</a></span></div>'+
  '</div>';
  document.body.appendChild(f);
  const fr=document.querySelector('footer'); if(fr&&!fr.querySelector('.foot-report')){ const a=document.createElement('a'); a.className='foot-report'; a.href='index.html#feedback'; a.textContent='Report an error'; (fr.querySelector('.foot-in, .wrap')||fr).appendChild(a); }
}

/* ---------- page transitions: hazard wipe ---------- */
function transitions(){
  const w=el('div','wipe');
  w.innerHTML='<div class="wipe-a"></div><div class="wipe-b"></div>';
  document.body.appendChild(w);
  if(sessionStorage.getItem('hd_wipe')==='1'){
    sessionStorage.removeItem('hd_wipe');
    w.classList.add('in');
    requestAnimationFrame(()=>requestAnimationFrame(()=>w.classList.add('out')));
    setTimeout(()=>w.classList.remove('in','out'),900);
  }
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]'); if(!a)return;
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
    if(a.target==='_blank'||a.hasAttribute('download'))return;
    const href=a.getAttribute('href');
    if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:'))return;
    const url=new URL(a.href,location.href);
    if(url.origin!==location.origin)return;
    if(url.pathname===location.pathname && url.hash)return;   // same-page anchor
    e.preventDefault();
    window.HDSFX.ui();
    sessionStorage.setItem('hd_wipe','1');
    w.classList.add('go');
    setTimeout(()=>{location.href=url.href;},430);
  });
}

/* ---------- hero parallax + glitch ---------- */
function heroMotion(){
  const hero=$('.hero-in'); if(!hero)return;
  let y=0;
  const tick=()=>{ const t=Math.min(1,scrollY/innerHeight); hero.style.transform=`translateY(${t*70}px)`; hero.style.opacity=String(1-t*0.9); };
  addEventListener('scroll',()=>{ if(!y){ y=requestAnimationFrame(()=>{tick();y=0;}); } },{passive:true});
  tick();
  const em=$('.hero h1 em');
  if(em){
    const arm=()=>{ if(!em.dataset.txt) return; em.classList.add('glitch'); em.setAttribute('data-g',em.dataset.txt); };
    setTimeout(arm,1400);
    setInterval(()=>{ em.classList.remove('glitch'); void em.offsetWidth; em.classList.add('glitch'); },7000+Math.random()*4000);
  }
}

/* ---------- mobile tab bar + "more" sheet ---------- */
const TABS=[
 ['index.html','Command','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 4 6.5v6c0 4.4 3.4 7.6 8 9 4.6-1.4 8-4.6 8-9v-6l-8-4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 7v10M7.5 12h9" stroke="currentColor" stroke-width="1.8"/></svg>'],
 ['stratagems.html','Codex','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.8"/><path d="m8 7 4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'],
 ['arsenal.html','Arsenal','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 13.5h10.5l1.5-3H21v3h-2.2l-1.3 4.5H9.5v-2.5h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'],
 ['enemies.html','Enemies','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4.4 0 7.5 3.1 7.5 7.5V14l2 4.5h-19L4.5 14v-3.5C4.5 6.1 7.6 3 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="9" cy="11.5" r="1.5" fill="currentColor"/><circle cx="15" cy="11.5" r="1.5" fill="currentColor"/></svg>'],
 ['arcade.html','Arcade','<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6.5" width="19" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10v5M5.5 12.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="11.5" r="1.3" fill="currentColor"/><circle cx="18.6" cy="14" r="1.3" fill="currentColor"/></svg>']
];
function tabbar(){
  const here=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const b=el('nav','tabbar'); b.setAttribute('aria-label','Quick navigation');
  b.innerHTML=TABS.map(t=>`<a href="${t[0]}"${t[0]===here?' class="on" aria-current="page"':''}>${t[2]}<span>${t[1]}</span></a>`).join('')+
    `<button type="button" class="tab-more" id="tabMore" aria-haspopup="dialog" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2.2" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><circle cx="19" cy="12" r="2.2" fill="currentColor"/></svg><span>More</span></button>`;
  document.body.appendChild(b);
  const s=el('div','sheet'); s.id='moreSheet'; s.setAttribute('role','dialog'); s.setAttribute('aria-label','All sections');
  s.innerHTML=`<div class="sheet-bg"></div><div class="sheet-in"><div class="sheet-grab"></div>
    <button type="button" class="sheet-search" id="sheetSearch">${SEARCH_ICON}<span>Search codes, weapons, enemies</span></button>
    <button type="button" class="sheet-search" id="sheetRec">${REC_ICON}<span>Training record and certifications</span></button>
    ${GROUPS.map(g=>g.href?`<div class="sheet-grid" style="margin-top:12px"><a href="${g.href}"${g.href===here?' class="on" aria-current="page"':''}>${g.n}</a></div>`:`<div class="sheet-grp"><b>${g.n}</b><div class="sheet-grid">${g.items.map(i=>`<a href="${i[0]}"${i[0]===here?' class="on" aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${NAVICON[i[0]]||''}</svg>${i[1]}</a>`).join('')}</div></div>`).join('')}
    <button type="button" class="sheet-search" id="sheetWhat" style="margin-top:12px">?<span>What is the Longevity Program</span></button>
    <p class="sheet-tip" id="sheetTip">Add Helldive Command to your home screen for one tap between dives.</p></div>`;
  document.body.appendChild(s);
  const more=b.querySelector('#tabMore');
  const open=()=>{s.classList.add('on');document.documentElement.classList.add('sheet-open');more.setAttribute('aria-expanded','true');};
  const close=()=>{s.classList.remove('on');document.documentElement.classList.remove('sheet-open');more.setAttribute('aria-expanded','false');};
  more.addEventListener('click',()=>s.classList.contains('on')?close():open());
  s.querySelector('.sheet-bg').addEventListener('click',close);
  s.querySelector('#sheetSearch').addEventListener('click',()=>{close();search();});
  s.querySelector('#sheetRec').addEventListener('click',()=>{close();record();});
  s.querySelector('#sheetWhat').addEventListener('click',()=>{close();intro(true);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
}

/* ---------- quick search: stratagems, weapons, enemies, from any page ---------- */
const DATA_SRC={HD_STRATAGEMS:'data/stratagems.js',HD_WEAPONS:'data/weapons.js',HD_ENEMIES:'data/enemies.js',HD_IMG:'data/images.js',HD_ARMOR:'data/armory.js',HD_WARBONDS_FULL:'data/warbonds.js'};
function ensureData(){
  const need=Object.keys(DATA_SRC).filter(k=>!window[k]);
  return Promise.all(need.map(k=>new Promise(res=>{const sc=document.createElement('script');sc.src=DATA_SRC[k]+'?v='+VER;sc.onload=res;sc.onerror=res;document.head.appendChild(sc);})));
}
const HINT='<p class="qs-hint">Type to search 93 codes, 109 weapons, 57 enemies, 41 armour sets, 25 warbonds and every page. Tap a stratagem to drill it.</p>';
function search(){
  let o=$('#hdSearch');
  if(!o){
    o=el('div','qs'); o.id='hdSearch'; o.setAttribute('role','dialog'); o.setAttribute('aria-label','Search');
    o.innerHTML=`<div class="qs-bg"></div><div class="qs-in"><div class="qs-bar">${SEARCH_ICON}<input id="qsIn" type="search" placeholder="Stratagem, weapon or enemy" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search"><button type="button" class="qs-x" id="qsX">Esc</button></div><div class="qs-res" id="qsRes">${HINT}</div></div>`;
    document.body.appendChild(o);
    const inp=o.querySelector('#qsIn'), res=o.querySelector('#qsRes');
    const close=()=>{o.classList.remove('on');document.documentElement.classList.remove('qs-open');};
    o.querySelector('.qs-bg').addEventListener('click',close); o.querySelector('#qsX').addEventListener('click',close);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&o.classList.contains('on'))close();});
    let t=0; inp.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>paint(inp.value),50);});
    function paint(q){
      q=q.trim().toLowerCase(); if(!q){res.innerHTML=HINT;return;}
      const S=window.HD_STRATAGEMS||[],W=window.HD_WEAPONS||[],E=window.HD_ENEMIES||[],R=window.HD_IMG||{},A=(window.HD_ARMOR&&window.HD_ARMOR.sets)||[],B=window.HD_WARBONDS_FULL||[];
      const PG=[['index.html','Command','The home page, live war, pick your wait']].concat(...GROUPS.filter(g=>g.items).map(g=>g.items.map(i=>[i[0],i[1],i[2]])));
      const hit=v=>String(v||'').toLowerCase().includes(q), enc=encodeURIComponent;
      const st=S.filter(s=>hit(s.n)||hit(s.full)||hit(s.cat)||s.c.toLowerCase()===q).slice(0,6);
      const we=W.filter(w=>hit(w.n)||hit(w.full)||hit(w.cls)).slice(0,6);
      const en=E.filter(e=>hit(e.n)||hit(e.f)).slice(0,6);
      const g=(title,rows)=>rows.length?`<div class="qs-g"><b>${title}</b>${rows.join('')}</div>`:'';
      const html=g('Stratagems',st.map(s=>`<a href="stratagems.html?q=${enc(s.n)}&drill=1"><img src="${window.stratIcon(s.ic)}" alt=""><span><i>${s.n}</i><em>${s.cat}${s.cd?' &middot; '+s.cd:''}</em></span><span class="arrows qs-code">${s.c.split('').map(d=>window.arrowSVG(d,'hit')).join('')}</span></a>`))
       +g('Weapons',we.map(w=>{const im=R.weapons&&R.weapons[w.n];return `<a href="arsenal.html?q=${enc(w.n)}">${im?`<img src="assets/img/weapons/${im}" alt="">`:'<u></u>'}<span><i>${w.full}</i><em>${w.slot} &middot; ${w.cls}${w.tier?' &middot; tier '+w.tier:''}</em></span></a>`;}))
       +g('Enemies',en.map(e=>{const im=R.enemies&&R.enemies[e.n];return `<a href="enemies.html?q=${enc(e.n)}">${im?`<img src="assets/img/enemies/${im}" alt="">`:'<u></u>'}<span><i>${e.n}</i><em>${e.f} &middot; weak point: ${e.weak}</em></span></a>`;}))
       +g('Armour',A.filter(a=>hit(a.name)||hit(a.code)||hit(a.passive)).slice(0,5).map(a=>`<a href="armory.html?q=${enc(a.name)}">${a.img?`<img src="${a.img}" alt="">`:'<u></u>'}<span><i>${a.code} ${a.name}</i><em>${a.cls} &middot; ${a.passive||''}</em></span></a>`))
       +g('Warbonds',B.filter(b=>hit(b.n)||hit(b.kind)).slice(0,5).map(b=>`<a href="warbonds.html#wb-${b.n.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/ /g,'-')}">${b.cover?`<img src="${b.cover}" alt="">`:'<u></u>'}<span><i>${b.n}</i><em>${b.kind}${b.price?' &middot; '+b.price:''}</em></span></a>`))
       +g('Pages',PG.filter(pg=>hit(pg[1])||hit(pg[2])).slice(0,5).map(pg=>`<a href="${pg[0]}"><u></u><span><i>${pg[1]}</i><em>${pg[2]}</em></span></a>`));
      res.innerHTML=html||'<p class="qs-hint">Nothing matches. Try a shorter word.</p>';
    }
    o._paint=paint;
  }
  o.classList.add('on'); document.documentElement.classList.add('qs-open');
  const inp=o.querySelector('#qsIn'), res=o.querySelector('#qsRes');
  if(Object.keys(DATA_SRC).some(k=>!window[k])){ res.innerHTML='<p class="qs-hint">Loading the codex&hellip;</p>'; ensureData().then(()=>{ inp.value?o._paint(inp.value):(res.innerHTML=HINT); }); }
  setTimeout(()=>inp.focus(),60);
}
window.HD.search=search;
document.addEventListener('keydown',e=>{
  if(e.target&&e.target.matches&&e.target.matches('input,select,textarea,[contenteditable]'))return;
  if((e.key==='/'&&!e.metaKey&&!e.ctrlKey)||((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k')){ e.preventDefault(); search(); }
});

/* ---------- Longevity Program: training record, certifications, the Democracy Officer ---------- */
const REC_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 12h7M9 16h7M9 8h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const REC={num:k=>{try{const v=JSON.parse(localStorage.getItem(k));return typeof v==='number'?v:(+v||0);}catch(e){return 0;}},arr:k=>{try{const v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:[];}catch(e){return [];}},has:k=>{try{return localStorage.getItem(k)!=null;}catch(e){return false;}},
  ops:()=>{try{return Object.keys(localStorage).filter(k=>k.startsWith('hd_ops_')).length;}catch(e){return 0;}}};
const CERTS=[
 {id:'flash',n:'Flash card veteran',d:'Reveal 25 codes on the home flash card',v:()=>REC.num('hd_flash_n'),t:25,go:'index.html#now'},
 {id:'drill',n:'Stratagem reflexes',d:'A streak of 5 in the codex drill',v:()=>REC.num('hd_drill_best'),t:5,go:'stratagems.html?random=1'},
 {id:'cab',n:'Cabinet qualified',d:'Post a score on the Stratagem Hero table',v:()=>REC.arr('hd_cab_hs').length,t:1,go:'arcade.html?go=hero'},
 {id:'rush',n:'Code Rush survivor',d:'Reach depth 10 in Code Rush',v:()=>REC.num('hd_cr_best'),t:10,go:'arcade.html?go=rush'},
 {id:'intel',n:'Enemy intel',d:'Score 7 of 10 in the Enemy Intel Drill',v:()=>REC.num('hd_qz_best'),t:7,go:'arcade.html?go=intel'},
 {id:'reflex',n:'Hellpod reflexes',d:'Score 10 in Hellpod Reflex',v:()=>REC.num('hd_rx_best'),t:10,go:'arcade.html?go=reflex'},
 {id:'field',n:'Field Drill',d:'Complete one Field Drill mission',v:()=>REC.num('hd_fd_best')>0?1:0,t:1,go:'arcade.html?go=field'},
 {id:'range',n:'Helldive Simulator',d:'Five hits in a row in the simulator',v:()=>REC.num('hd_range_best'),t:5,go:'arcade.html?go=range'},
 {id:'extract',n:'Extraction certified',d:'Run the Extraction terminal in Field Ops',v:()=>REC.has('hd_ops_extract')?1:0,t:1,go:'terminals.html'},
 {id:'ops3',n:'Terminal operator',d:'Three Field Ops objectives on record',v:()=>REC.ops(),t:3,go:'terminals.html'},
 {id:'ops11',n:'Master operator',d:'All eleven Field Ops objectives on record',v:()=>REC.ops(),t:11,go:'terminals.html'},
 {id:'enemy',n:'Bestiary analyst',d:'Study 10 enemies of the minute',v:()=>REC.num('hd_enemy_n'),t:10,go:'index.html#now'},
 {id:'blue',n:'Blueberry counsellor',d:'Read the Blueberries personnel file',v:()=>REC.has('hd_blue')?1:0,t:1,go:'blueberries.html'},
 {id:'pod',n:'Hellpod literate',d:'Read the Hellpod engineering brief',v:()=>REC.has('hd_pod')?1:0,t:1,go:'hellpod.html'}
];
const GRADES=[[0,'Reinforcement liability'],[1,'Statistically alive'],[3,'Occasionally reinforced'],[6,'Difficult to kill'],[10,'Budget neutral'],[13,'Super Helldive ready!']];
function recordState(){
  const rows=CERTS.map(c=>{const v=c.v(); return {...c,val:v,done:v>=c.t,p:Math.min(1,v/c.t)};});
  const done=rows.filter(r=>r.done).length;
  const grade=GRADES.filter(g=>done>=g[0]).pop()[1];
  const secs=360+done*40, life=Math.floor(secs/60)+' min '+(secs%60?secs%60+' s':'');
  return {rows,done,grade,life,saved:done*3};
}
window.HD.record=record;
/* key bindings shared by the drills and the range. Values are KeyboardEvent.key names, KeyboardEvent.code for letters,
   Mouse4 / Mouse5 for side buttons (pointer buttons 3 and 4), or Toggle:<key> for a press-to-open stratagem menu. */
window.HD.binds={
  get:()=>{ let b={}; try{ b=JSON.parse(localStorage.getItem('hd_binds')||'{}'); }catch(e){}
    return {strat:b.strat||localStorage.getItem('hd_holdkey')||'Control', dive:b.dive||'Space'}; },
  set:(k,v)=>{ const b=window.HD.binds.get(); b[k]=v; try{ localStorage.setItem('hd_binds',JSON.stringify(b)); if(k==='strat') localStorage.setItem('hd_holdkey',v); }catch(e){} document.dispatchEvent(new CustomEvent('hd:binds',{detail:b})); },
  /* does this keyboard or pointer event match the binding? */
  is:(bind,e)=>{ if(!bind) return false; const b=bind.replace(/^Toggle:/,'');
    if(b==='Mouse4') return e.type.startsWith('pointer')&&e.button===3;
    if(b==='Mouse5') return e.type.startsWith('pointer')&&e.button===4;
    if(!e.key) return false;
    return e.key===b||e.code===b||(b.length===4&&b.startsWith('Key')&&e.code===b); },
  label:b=>({Control:'Ctrl',CapsLock:'Caps Lock',Shift:'Shift',Alt:'Alt',Mouse4:'Mouse 4',Mouse5:'Mouse 5',Space:'Space',KeyC:'C',KeyX:'X'}[String(b).replace(/^Toggle:/,'')]||b)
};
/* the field rule for every stratagem activity: the code only goes in while the stratagem key is held
   (Ctrl by default, L1 / LB on a controller). One helper so the codex drill, the home drill and the
   range all read the same binding. `when()` gates the listeners; `on(down)` is the callback. */
window.HD.hold=function(o){
  const B=()=>window.HD.binds.get().strat, tog=()=>String(B()).startsWith('Toggle:');
  const st={down:false,touch:false};
  const set=v=>{ if(st.down===v)return; st.down=v; o.on(v); };
  const gate=()=>!o.when||o.when();
  addEventListener('keydown',e=>{ if(!gate()||!window.HD.binds.is(B(),e))return; e.preventDefault(); if(e.repeat)return; if(tog()) set(!st.down); else set(true); });
  addEventListener('keyup',e=>{ if(!gate()||tog()||st.touch)return; if(window.HD.binds.is(B(),e)) set(false); });
  addEventListener('pointerdown',e=>{ if(!gate()||!window.HD.binds.is(B(),e))return; e.preventDefault(); if(tog()) set(!st.down); else set(true); });
  addEventListener('pointerup',e=>{ if(!gate()||tog()||st.touch)return; if(window.HD.binds.is(B(),e)) set(false); });
  addEventListener('contextmenu',e=>{ if(st.down) e.preventDefault(); });
  addEventListener('blur',()=>{ if(!st.touch) set(false); });
  /* touch: a "Take out stratagem" button holds it open until you put it away */
  if(o.btn) o.btn.addEventListener('click',()=>{ st.touch=!st.touch; set(st.touch); });
  st.label=()=>window.HD.binds.label(B());
  st.release=()=>{ st.touch=false; set(false); };
  return st;
};
/* page header meta, in the game's menu language: counters on the right, a hatched level chip */
const PMETA={
 'stratagems.html':()=>[['93','Codes'],[String((window.HD_STRATAGEMS||[]).filter(s=>s.cat==='ORBITAL').length),'Orbital'],[String((window.HD_STRATAGEMS||[]).filter(s=>s.cat==='EAGLE').length),'Eagle']],
 'arsenal.html':()=>[['109','Weapons'],['3','Factions'],['S to C','Tiers']],
 'enemies.html':()=>[['57','Enemies'],['3','Factions']],
 'armory.html':()=>[['41','Sets'],['12','Passives']],
 'warbonds.html':()=>[['25','Warbonds'],['Medals','Ranked']],
 'meta.html':()=>[['Tier list','By faction'],['9','Loadouts']],
 'arcade.html':()=>[['6','Drills'],['Local','Scores']],
 'terminals.html':()=>[['11','Objectives'],['Wiki','Step lists']],
 'blueberries.html':()=>[['Field','Notes']],
 'hellpod.html':()=>[['Mk. IV','Personnel pod']],
 'intel.html':()=>[['10','Difficulties'],[String((window.HD_TECH||[]).length),'Techniques']],
 'manual.html':()=>[['Field','Manual']]
};
function pheadMeta(){
  const head=$('.phead .wrap'); if(!head||$('.phead-meta'))return;
  const here=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const f=PMETA[here]; if(!f)return;
  let items=[]; try{ items=f()||[]; }catch(e){ items=[]; }
  const st=recordState();
  const el=document.createElement('div'); el.className='phead-meta';
  el.innerHTML=items.map(i=>`<div class="pm-stat"><b>${i[0]}</b><span>${i[1]}</span></div>`).join('')
    +`<button type="button" class="pm-level" title="Your training record">${st.done} / ${CERTS.length}<span>${st.grade}</span></button>`;
  head.appendChild(el);
  el.querySelector('.pm-level').addEventListener('click',()=>record());
}
function record(){
  let o=$('#hdRecord');
  if(!o){
    o=el('div','qs rec'); o.id='hdRecord'; o.setAttribute('role','dialog'); o.setAttribute('aria-label','Training record');
    o.innerHTML='<div class="qs-bg"></div><div class="qs-in"><div class="qs-bar"><span class="tag">Longevity Program &middot; Service record</span><button type="button" class="qs-x" id="recX">Esc</button></div><div class="qs-res" id="recBody"></div></div>';
    document.body.appendChild(o);
    const close=()=>{o.classList.remove('on');document.documentElement.classList.remove('qs-open');};
    o.querySelector('.qs-bg').addEventListener('click',close); o.querySelector('#recX').addEventListener('click',close);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&o.classList.contains('on'))close();});
    o.addEventListener('click',e=>{ if(e.target.id==='recReset'&&confirm('Wipe every score and certification on this device?')){ try{Object.keys(localStorage).filter(k=>k.startsWith('hd_')&&!/hd_sfx|hd_hold|hd_intro/.test(k)).forEach(k=>localStorage.removeItem(k));}catch(err){} paint(); } if(e.target.id==='recIntro'){ close(); intro(true); } });
  }
  function paint(){
    const st=recordState(); const pf=window.HD.profile.get();
    const head = pf.callsign
      ? `<div class="pf"><div class="pf-id"><b>${esc(pf.callsign)}</b><span>${esc(pf.ship||'SES Unnamed')} &middot; Level ${pf.level||1} &middot; ${esc(pf.title||'Cadet')}</span></div>
           <div class="pf-acts"><button type="button" class="rec-link" id="pfEdit">Edit profile</button> &middot; <button type="button" class="rec-link" id="pfExport">Export record</button> &middot; <label class="rec-link" for="pfImport">Import</label><input type="file" id="pfImport" accept="application/json" hidden></div></div>`
      : `<form class="pf pf-reg" id="pfForm"><div class="pf-id"><b>Register, Helldiver</b><span>A callsign, your Super Destroyer and your level. Kept on this device; export it to carry it elsewhere.</span></div>
           <div class="pf-fields"><input name="callsign" placeholder="Callsign" maxlength="24" required><input name="ship" placeholder="SES Ship name" maxlength="40"><input name="level" type="number" min="1" max="150" placeholder="Level"><select name="title"><option>Cadet</option><option>Space Cadet</option><option>Sergeant</option><option>Master Sergeant</option><option>Chief</option><option>Space Chief Prime</option><option>Death Captain</option><option>Marshal</option><option>Star Marshal</option><option>Chief Warrant Officer</option><option>Space Warrant Officer</option><option>Super Sheriff</option><option>Free of Thought</option><option>Super Citizen</option><option>Viper Commando</option><option>Fleet Admiral</option><option>Admirable Admiral</option><option>Commander</option><option>Galactic Commander</option><option>Hell Commander</option><option>General</option><option>5-Star General</option><option>10-Star General</option><option>Private</option><option>Super Private</option><option>Servant of Freedom</option><option>Super Pedestrian</option></select></div>
           <button type="submit" class="btn sm">Enlist</button></form>`;
    $('#recBody').innerHTML=head+`<div class="rec-top"><div><span class="rec-grade">${st.grade}</span><span class="rec-sub">Longevity grade &middot; ${st.done} of ${CERTS.length} certifications</span></div>
      <div class="rec-stats"><div><b>${st.life}</b><span>Estimated life expectancy</span></div><div><b>${st.saved}</b><span>Reinforcements saved</span></div></div></div>
      <div class="rec-bar"><i style="width:${st.done/CERTS.length*100}%"></i></div>
      <div class="rec-list">${st.rows.map(r=>`<a class="rec-c ${r.done?'done':''}" href="${r.go}"><span class="rec-chk">${r.done?'&#10003;':''}</span><span class="rec-in"><b>${r.n}</b><em>${r.d}</em><i style="width:${r.p*100}%"></i></span><span class="rec-val">${r.done?'Certified':Math.min(r.val,r.t)+' / '+r.t}</span></a>`).join('')}</div>
      <p class="rec-foot">Scores live in this browser only. <button type="button" class="rec-link" id="recIntro">Replay the Democracy Officer's briefing</button> &middot; <button type="button" class="rec-link" id="recReset">Reset record</button></p>`;
  }
  paint(); o.classList.add('on'); document.documentElement.classList.add('qs-open');
  o.addEventListener('submit',e=>{ const f=e.target.closest('#pfForm'); if(!f)return; e.preventDefault(); const d=Object.fromEntries(new FormData(f).entries()); window.HD.profile.set(d); paint(); toast('Enlisted, '+d.callsign+'. Super Earth thanks you.'); });
  o.addEventListener('click',e=>{
    if(e.target.id==='pfEdit'){ const pf=window.HD.profile.get(); window.HD.profile.set({...pf,callsign:''}); paint(); const f=o.querySelector('#pfForm'); if(f){ f.callsign.value=pf.callsign; f.ship.value=pf.ship||''; f.level.value=pf.level||''; f.title.value=pf.title||'Cadet'; } }
    if(e.target.id==='pfExport'){ window.HD.profile.export(); }
  });
  o.addEventListener('change',e=>{ if(e.target.id==='pfImport'&&e.target.files[0]){ window.HD.profile.import(e.target.files[0]).then(()=>{ paint(); toast('Record imported.'); }).catch(()=>toast('That file is not a Helldive Command record.')); } });
}
const esc=v=>String(v==null?'':v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* profile: a local account. Everything under hd_* travels with the export, so a record can move devices. */
window.HD.profile={
  get:()=>{ try{ return JSON.parse(localStorage.getItem('hd_profile')||'{}'); }catch(e){ return {}; } },
  set:d=>{ try{ localStorage.setItem('hd_profile',JSON.stringify({callsign:(d.callsign||'').trim().slice(0,24),ship:(d.ship||'').trim().slice(0,40),level:+d.level||1,title:d.title||'Cadet',since:(window.HD.profile.get().since||new Date().toISOString().slice(0,10))})); }catch(e){} },
  export:()=>{ const all={}; try{ Object.keys(localStorage).filter(k=>k.startsWith('hd_')).forEach(k=>all[k]=localStorage.getItem(k)); }catch(e){}
    const blob=new Blob([JSON.stringify({app:'helldive-command',v:1,data:all},null,1)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='helldive-record-'+(window.HD.profile.get().callsign||'helldiver')+'.json'; document.body.appendChild(a); a.click(); a.remove(); },
  import:file=>file.text().then(t=>{ const j=JSON.parse(t); if(j.app!=='helldive-command'||!j.data) throw 0; Object.entries(j.data).forEach(([k,v])=>{ if(k.startsWith('hd_')) localStorage.setItem(k,v); }); })
};
/* first visit: the Democracy Officer explains the program */
function intro(force){
  const here=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(!force&&(here!=='index.html'||REC.has('hd_intro')||/nointro=1/.test(location.search)))return;
  const o=el('div','do'); o.setAttribute('role','dialog'); o.setAttribute('aria-label','Democracy Officer briefing');
  o.innerHTML=`<div class="do-bg"></div><div class="do-in brk"><div class="do-pic"><img src="assets/img/misc/democracy-officer.webp" alt="The Democracy Officer"></div><div class="do-txt">
    <div class="do-head"><img class="do-flag" src="assets/img/brand/flag.webp" alt="Flag of Super Earth"><span class="tag red">Democracy Officer &middot; Classified briefing</span></div>
    <h2>This is the only life you get, Helldiver!</h2>
    <p>Your basic training lasted four minutes. Statistically, so did the diver who wore that number before you. Their cape is being laundered. Yours is not, yet.</p>
    <p>Be clear on what a reinforcement is, citizen. It is not you getting up. It is the next volunteer, thawed, dropped, and issued your designation. The Helldiver who falls does not come back. Somebody else arrives and finishes the objective.</p>
    <p>So the Ministry of Defense has authorised the <b>Helldiver Longevity Program</b>: classified continuation training so that the diver holding this cape stays the one holding it. Every stratagem code! Every weak point! The live war, the real terminals, and drills that fit the wait on the pad.</p>
    <p>Nobody is asking you to live forever. Forever is a dissident fantasy. You are asked to live through this operation, then the next one, and to spend fewer of Super Earth's volunteers doing it. Do your part!</p>
    <p class="do-sign">Freedom never sleeps. Neither, unfortunately, do the bugs.</p>
    <div class="hero-cta" style="margin-top:18px"><button type="button" class="btn" id="doGo">Report for training! <span class="ar">&#9654;</span></button><button type="button" class="btn ghost" id="doNo">I will die on my own, thank you</button></div>
  </div></div>`;
  document.body.appendChild(o); document.documentElement.classList.add('qs-open');
  setTimeout(()=>o.classList.add('on'),30);   /* timeout, not rAF: rAF freezes in hidden tabs */
  const done=(msg)=>{ try{localStorage.setItem('hd_intro','1');}catch(e){} o.classList.remove('on'); document.documentElement.classList.remove('qs-open'); setTimeout(()=>o.remove(),400); if(msg) toast(msg); };
  o.querySelector('#doGo').addEventListener('click',()=>{ done(); if(window.HDSFX)window.HDSFX.ok(); const n=$('#now'); if(n) n.scrollIntoView({behavior:'smooth',block:'start'}); });
  o.querySelector('#doNo').addEventListener('click',()=>done('Noted. Your Democracy Officer has been informed.'));
}
window.HD.intro=intro;
function toast(msg){ const t=el('div','toast',msg); document.body.appendChild(t); setTimeout(()=>t.classList.add('on'),30); setTimeout(()=>{t.classList.remove('on'); setTimeout(()=>t.remove(),400);},3600); }
window.HD.toast=toast;

/* ---------- audit fixes: skip link, compact lists, back to top, collapsible panels ---------- */
function skipLink(){
  const a=el('a','skip','Skip to content'); a.href='#main'; document.body.insertBefore(a,document.body.firstChild);
  const target=$('main')||$('section.sec')||$('section'); if(target){ if(!target.id) target.id='main'; a.href='#'+target.id; }
}
function compactLists(){
  const grid=$('.sgrid,.wgrid,.agrid'), bar=$('.fbar'); if(!grid||!bar) return;
  const key='hd_view_'+(location.pathname.split('/').pop()||'index');
  let view=null; try{ view=localStorage.getItem(key); }catch(e){}
  if(!view) view=innerWidth<=760?'list':'cards';
  const t=el('div','view-toggle'); t.setAttribute('role','group'); t.setAttribute('aria-label','View');
  t.innerHTML='<button type="button" data-view="cards">Cards</button><button type="button" data-view="list">List</button>';
  bar.appendChild(t);
  const apply=()=>{ grid.classList.toggle('grid-compact',view==='list'); t.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.view===view)); };
  t.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b)return; view=b.dataset.view; try{localStorage.setItem(key,view);}catch(err){} apply(); });
  grid.addEventListener('click',e=>{ if(!grid.classList.contains('grid-compact'))return; const c=e.target.closest('.card.wc,.card.ac'); if(!c||e.target.closest('a,button'))return; c.classList.toggle('open'); });
  apply();
}
/* card details: one delegated handler covers every grid, including re-renders */
function cardDetails(){
  document.addEventListener('click',e=>{
    const b=e.target.closest('.det-t'); if(!b) return;
    const d=b.nextElementSibling; if(!d||!d.classList.contains('card-det')) return;
    const open=d.classList.toggle('on');
    b.setAttribute('aria-expanded',String(open));
    b.firstChild.nodeValue=open?'Hide stats ':'Full stats ';
  });
}
/* nav behaviour: clear over a banner at the top, solid on scroll, and out of the
   way when you are reading downward. Comes back the moment you scroll up. */
function navBehaviour(){
  const r=document.documentElement;
  const hero=!!document.querySelector('.hero');
  if(hero) r.classList.add('hero-nav');
  let last=scrollY, t=0;
  const sync=()=>{
    const y=scrollY;
    if(hero) r.classList.toggle('nav-solid',y>24);
    const down=y>last+4, up=y<last-4;
    if(down&&y>240) r.classList.add('nav-hide');
    else if(up||y<=240) r.classList.remove('nav-hide');
    if(down||up) last=y;
  };
  addEventListener('scroll',()=>{ if(!t){ t=setTimeout(()=>{sync();t=0;},60); } },{passive:true});
  /* never leave it hidden when focus moves into it by keyboard */
  document.addEventListener('focusin',e=>{ if(e.target.closest('.nav')) r.classList.remove('nav-hide'); });
  sync();
}
/* section jump nav, built from the page's own sections (17 Sep).
   Only manual and arcade had one; long pages like intel (6 sections, 17,000 px)
   left you scrolling blind. Pages that already ship a nav are left alone. */
function sectionNav(){
  /* the site nav bar is <header class="nav">, so target the PAGE header only */
  const phead=document.querySelector('header.phead');
  if(!phead) return;
  const host=phead.querySelector('.wrap')||phead;
  /* any nav that already links within the page counts: manual uses .fbar,
     arcade uses .drill-tabs */
  const hasOwn=[...document.querySelectorAll('header nav a[href^="#"], nav.drill-tabs a[href^="#"]')].length>=3;
  if(hasOwn) return;
  const secs=[...document.querySelectorAll('section[id]')].filter(sec=>{
    const h=sec.querySelector('h2'); return h && h.textContent.trim();
  });
  if(secs.length<3) return;                                    /* not worth it */
  const nav=el('nav','fbar secnav'); nav.setAttribute('aria-label','On this page');
  nav.innerHTML=secs.map(sec=>{
    const t=sec.querySelector('h2').textContent.trim().replace(/[!?.]+$/,'');
    return `<a class="chip" href="#${sec.id}">${t.length>26?t.slice(0,25).trim()+'\u2026':t}</a>`;
  }).join('');
  host.appendChild(nav);
  /* mark the section you are actually in */
  const links=[...nav.querySelectorAll('a')];
  const mark=()=>{
    let cur=0;
    secs.forEach((sec,i)=>{ if(sec.getBoundingClientRect().top<=140) cur=i; });
    links.forEach((a,i)=>a.classList.toggle('on',i===cur));
  };
  let t=0;
  addEventListener('scroll',()=>{ if(!t){ t=setTimeout(()=>{mark();t=0;},130); } },{passive:true});
  mark();
}
/* Tier readout (17 Sep). The detail used to float over the board as a tooltip,
   which covered the rows above it and did nothing on touch. It now renders into
   a reserved panel above the board: no overlap, and tapping works. */
function tierReadout(){
  document.querySelectorAll('.tierboard, #tiers').forEach(board=>{
    if(board.previousElementSibling && board.previousElementSibling.classList.contains('tread')) return;
    const pan=el('div','tread');
    pan.innerHTML='<div class="tread-empty">Hover or tap any item for its score breakdown.</div>';
    const first=board.querySelector('.tierrow');
    if(first) board.insertBefore(pan,first); else board.parentNode.insertBefore(pan,board);
    const show=tile=>{
      const tip=tile.querySelector('.ttip'); if(!tip) return;
      pan.innerHTML='<div class="tread-in">'+tip.innerHTML+'</div>';
      pan.classList.add('on');
      /* the panel belongs to the row you are reading: hovering a B tile should not
         send your eye back up past S. It stays sticky once it is there, so a tall
         row still keeps it in view. */
      const row=tile.closest('.tierrow');
      if(row && pan.nextElementSibling!==row){
        const before=tile.getBoundingClientRect().top;
        row.parentNode.insertBefore(pan,row);
        /* moving it reflows the board, so hold the tile still under the cursor */
        const after=tile.getBoundingClientRect().top;
        if(after!==before) scrollBy(0,after-before);
      }
    };
    board.addEventListener('pointerover',e=>{ const t=e.target.closest('.titem,.atitem'); if(t) show(t); });
    board.addEventListener('focusin',e=>{ const t=e.target.closest('.titem,.atitem'); if(t) show(t); });
    /* touch: a tap reads out first, a second tap follows the link */
    board.addEventListener('click',e=>{
      const t=e.target.closest('.titem,.atitem'); if(!t) return;
      if(matchMedia('(hover:none)').matches && !t.classList.contains('read')){
        e.preventDefault();
        board.querySelectorAll('.read').forEach(x=>x.classList.remove('read'));
        t.classList.add('read'); show(t);
      }
    });
  });
}
function toTop(){
  const b=el('button','totop'); b.type='button'; b.setAttribute('aria-label','Back to top');
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M5 13l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(b);
  b.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
  let t=0; const sync=()=>b.classList.toggle('on',scrollY>innerHeight*2);
  addEventListener('scroll',()=>{ if(!t){ t=setTimeout(()=>{sync();t=0;},120); } },{passive:true}); sync();
}
function toggles(){
  document.querySelectorAll('[data-toggle]').forEach(b=>{ const tgt=$(b.dataset.toggle); if(!tgt)return;
    if(innerWidth<=760) tgt.classList.add('collapsed');
    const paint=()=>{ const open=!tgt.classList.contains('collapsed'); b.setAttribute('aria-expanded',String(open)); b.textContent=(open?'Hide':'Show')+' '+(b.dataset.label||'dispatch feed'); };
    b.addEventListener('click',()=>{ tgt.classList.toggle('collapsed'); paint(); }); paint(); });
}

/* ---------- installable app shell ---------- */
function pwa(){
  if(!('serviceWorker' in navigator)||location.protocol==='file:')return;
  addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
  addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); window.HD.installPrompt=e; document.documentElement.classList.add('can-install'); document.dispatchEvent(new Event('hd:caninstall')); });
  window.HD.install=()=>{ const p=window.HD.installPrompt; if(!p)return Promise.resolve(false); return p.prompt().then(()=>p.userChoice).then(c=>{ if(c&&c.outcome==='accepted'){ window.HD.installPrompt=null; document.documentElement.classList.remove('can-install'); return true; } return false; }); };
}

/* ---------- init ---------- */
function init(){
  skipLink(); chrome(); nav(); tabbar(); footer(); boot(); transitions(); pwa(); compactLists(); cardDetails(); navBehaviour(); sectionNav(); tierReadout(); toTop(); toggles(); pheadMeta(); setTimeout(()=>intro(false),1800);
  reveals(); decoders(); counters(); pointer(); heroMotion();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();

/* ---------- keycaps: a key named in a prompt is drawn as a key ---------- */
(function keycaps(){
  const KEYS=['Caps Lock','Ctrl','Shift','Alt','Space','Enter','Esc','Mouse 4','Mouse 5','Tab'];
  const re=new RegExp('\\b('+KEYS.map(k=>k.replace(' ','\\s')).join('|')+')\\b','g');
  const wasd=/\bW A S D\b/g;
  const SEL='#tzMsg,#dMsg,#holdNote,.fd-key,#fdKeyName,.hold-hint,.tu-hint,.key-hint,[data-keys]';
  function paint(el){
    if(!el||el.dataset.kcBusy) return; const t=el.textContent; if(!t||!(re.test(t)||wasd.test(t))) return; re.lastIndex=0; wasd.lastIndex=0;
    el.dataset.kcBusy='1';
    el.innerHTML=t.replace(/[<>&]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[m])).replace(wasd,'<kbd class="kc">W</kbd><kbd class="kc">A</kbd><kbd class="kc">S</kbd><kbd class="kc">D</kbd>').replace(re,'<kbd class="kc">$1</kbd>');
    delete el.dataset.kcBusy;
  }
  function all(){ document.querySelectorAll(SEL).forEach(paint); }
  const mo=new MutationObserver(ms=>{ ms.forEach(m=>{ const el=m.target.nodeType===3?m.target.parentElement:m.target; const hit=el&&el.closest&&el.closest(SEL); if(hit&&!hit.dataset.kcBusy&&!hit.querySelector('kbd')) paint(hit); }); });
  const start=()=>{ all(); mo.observe(document.body,{childList:true,characterData:true,subtree:true}); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
