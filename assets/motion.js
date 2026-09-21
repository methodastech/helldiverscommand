/* ============ MOTION: the in-game feel, everywhere ============
   Tilt and glare on cards, HUD corner brackets, parallax art bands, staggered
   reveals, a scan sweep on headings, magnetic buttons. Pointer devices only for
   the hover effects, nothing when the visitor asks for reduced motion. */
(function(){
'use strict';
const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const hover=matchMedia('(hover:hover) and (pointer:fine)').matches;

/* HUD corner brackets on the surfaces that read as panels */
const HUD='.now-c,.doc-view,.term-bezel';
function hud(root=document){
  $$(HUD,root).forEach(el=>{ if(el.querySelector(':scope > .hud-c')) return; const i=document.createElement('i'); i.className='hud-c'; i.setAttribute('aria-hidden','true'); el.appendChild(i); });
}

/* tilt with a glare that follows the pointer */
function tilt(root=document){
  return; /* tilt retired 13 Sep: read as cheap; cards lift on hover via CSS instead */
  if(!hover||reduce) return;
  $$('.now-c,.cx,.dfact,.panel.ld,.panel.fac,.cmp-prof,.lg-cand,.card.sg,.card.wc,.card.ec,.nw',root).forEach(el=>{
    if(el.dataset.tilt) return; el.dataset.tilt='1'; el.classList.add('tilt');
    let raf=0;
    el.addEventListener('pointermove',e=>{
      const r=el.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>{
        el.style.setProperty('--rx',((.5-y)*5).toFixed(2)+'deg'); el.style.setProperty('--ry',((x-.5)*7).toFixed(2)+'deg');
        el.style.setProperty('--gx',(x*100).toFixed(1)+'%'); el.style.setProperty('--gy',(y*100).toFixed(1)+'%'); });
    });
    el.addEventListener('pointerleave',()=>{ el.style.setProperty('--rx','0deg'); el.style.setProperty('--ry','0deg'); });
  });
}

/* staggered reveal: grid children come in one after another */
function stagger(){
  $$('.now-grid,.codex,.dfacts,.rules,.lds,.facs,.nt-grid,.grid,.cmp-shots,.lg-hero,.lg-ref,.fac-units').forEach(g=>{
    Array.from(g.children).forEach((c,i)=>{ c.style.setProperty('--i',i); c.classList.add('sg-in'); });
  });
  if(reduce){ $$('.sg-in').forEach(c=>c.classList.add('on')); return; }
  const io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); } }); },{rootMargin:'0px 0px -6% 0px',threshold:.05});
  $$('.sg-in').forEach(c=>io.observe(c));
  setTimeout(()=>$$('.sg-in:not(.on)').forEach(c=>{ if(c.getBoundingClientRect().top<innerHeight*1.2) c.classList.add('on'); }),2500);
  setTimeout(()=>$$('.sg-in:not(.on)').forEach(c=>c.classList.add('on')),7000);
}

/* scan sweep across a section heading when it arrives */
function scan(){
  if(reduce) return;
  const io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('scan'); io.unobserve(e.target); } }); },{threshold:.4});
  $$('.sec-head h2, .phead h1').forEach(h=>io.observe(h));
}

/* parallax: art bands drift a little slower than the page */
function parallax(){
  if(reduce) return;
  const els=$$('.phead-bg img,.nc-bg,.df-bg,.cx-bg img,.fb-bg,.doc-art');
  if(!els.length) return;
  let t=0;
  const run=()=>{ t=0; const vh=innerHeight; els.forEach(el=>{ const r=el.parentElement.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return; const p=(r.top+r.height/2-vh/2)/vh; el.style.setProperty('--py',(p*-18).toFixed(1)+'px'); }); };
  addEventListener('scroll',()=>{ if(!t) t=requestAnimationFrame(run); },{passive:true}); run();
}

/* magnetic buttons: a few pixels toward the pointer */
function magnet(){
  if(!hover||reduce) return;
  $$('.btn').forEach(b=>{
    b.addEventListener('pointermove',e=>{ const r=b.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; b.style.transform=`translate(${(x*6).toFixed(1)}px,${(y*4).toFixed(1)}px)`; });
    b.addEventListener('pointerleave',()=>{ b.style.transform=''; });
  });
}

/* the ticking grain over everything, one element, CSS animated */
function grain(){
  if(reduce||document.querySelector('.grain')) return;
  const g=document.createElement('div'); g.className='grain'; g.setAttribute('aria-hidden','true'); document.body.appendChild(g);
}

function boot(){ hud(); tilt(); stagger(); scan(); parallax(); magnet(); grain();
  /* pages that render cards later */
  const mo=new MutationObserver(ms=>{ let need=false; ms.forEach(m=>{ if(m.addedNodes.length) need=true; }); if(need){ clearTimeout(boot.t); boot.t=setTimeout(()=>{ hud(); tilt(); },120); } });
  mo.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
window.HD=window.HD||{}; window.HD.motion={hud,tilt};
})();
