/* ============ WARBOND REVIEWS ============ */
(function(){
'use strict';
const {$,$$}=window.HD;
const WB=window.HD_WARBONDS_FULL||[], W=window.HD_WEAPONS||[], META=window.HD_WARBONDS||[];
const TORD={S:4,A:3,B:1.5,C:0.5};
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function weaponFor(name){ const n=norm(name); return W.find(w=>norm(w.full)===n)||W.find(w=>n.endsWith(norm(w.n))||norm(w.full).includes(n)); }
const ST=()=>window.HD_WSTATS||{};
function statFor(name){ const n=norm(name); const W_=ST(); const k=Object.keys(W_).find(k=>norm(W_[k].full||'')===n||norm(W_[k].n)===n||n.endsWith(norm(W_[k].n))); return k?W_[k]:null; }
/* an item's grade: weapons from their points out of 1000; the rest from what it is */
function itemGrade(it){
  const kind=(it.type||'')+' '+it.n;
  if(/Super Credits/i.test(it.n)) return {g:'S',why:'Super Credits pay for the next warbond. Always worth the medals.'};
  if(/Booster/i.test(kind)) return {g:'A',why:'Boosters apply to the whole squad every drop.'};
  const st=statFor(it.n);
  if(st&&st.pts!=null) return {g:st.ptier,pts:st.pts,why:st.why};
  if(/Armor|Armour/i.test(kind)) return {g:'B',why:'Armour: the passive decides it, see the Armory grade.'};
  if(/Grenade/i.test(kind)){ const g=statFor(it.n); return g?{g:g.ptier||'B',why:g.why||''}:{g:'B',why:'Grenade slot item.'}; }
  if(/Helmet|Cape|Player Card|Emote|Victory|Title|Pattern|Banner/i.test(kind)) return {g:'C',why:'Cosmetic. Drip only, no effect in the field.'};
  return {g:'C',why:'No published numbers for this item.'};
}
const GV={S:4,A:3,B:1.5,C:0.5,D:0.2};
function grade(wb){
  const items=wb.pages.flatMap(p=>p.items);
  let pts=0, hits=[], why=[];
  items.forEach(it=>{ const ig=itemGrade(it); it._g=ig;
    if(/Helmet|Cape|Player Card|Emote|Victory|Title|Pattern|Banner/i.test((it.type||'')+' '+it.n)) return;
    if(/Super Credits/i.test(it.n)){ pts+=0.3; return; }
    if(/Booster/i.test(it.type||'')){ pts+=1; why.push(it.n+' booster'); return; }
    pts+=GV[ig.g]||0; if(ig.pts!=null) hits.push({n:it.n,tier:ig.g,pts:ig.pts}); });
  hits.sort((a,b)=>b.pts-a.pts);
  const sc=items.filter(i=>/Super Credits/i.test(i.n)).length;
  const score=Math.min(10,Math.round(pts*1.2*10)/10);
  const top=hits.slice(0,3).map(h=>`${h.n} (${h.tier}, ${h.pts})`).join(', ');
  const reason=(hits.length?`${hits.filter(h=>h.tier==='S'||h.tier==='A').length} of its ${hits.length} weapons grade A or better: ${top}.`:'No weapon in it carries published numbers.')+
    (why.length?` Plus ${why.join(' and ')}.`:'')+(sc?` ${sc} Super Credit drops pay part of the next one back.`:'');
  return {score, hits:hits.slice(0,4), sc, reason};
}
const pick=n=>{ const m=META.find(x=>norm(x.n)===norm(n)); return m?m.pick:''; };
/* grades by rank, not by a saturating score: top 4 are S, the next 8 A, the next 8 B, the rest C */
const RANK=new Map(WB.map(w=>[w.n,grade(w).score]).sort((a,b)=>b[1]-a[1]).map((x,i)=>[x[0],i]));
const badgeFor=n=>{const r=RANK.get(n)??99; return r<4?'S':r<12?'A':r<20?'B':'C';};
const badge=s=>s>=7?'S':s>=4.5?'A':s>=2.5?'B':'C';
function card(wb){
  const g=grade(wb); const t=badgeFor(wb.n);
  const pages=wb.pages.map((p,i)=>`<details class="wb-page" ${i===0?'open':''}><summary>${p.note?'Contents':'Page '+(i+1)}${p.unlock?` &middot; unlock ${p.unlock} medals`:''}${p.total?` &middot; ${p.total} medals to complete`:''}</summary>
    ${p.note?`<p class="wb-note">${p.note}</p>`:''}<div class="wb-items">${p.items.map(it=>`<div class="wb-item g-${(it._g||itemGrade(it)).g}" title="${it.n} · ${(it._g||itemGrade(it)).g}: ${((it._g||itemGrade(it)).why||'').replace(/"/g,'')}"><span class="wb-g">${(it._g||itemGrade(it)).g}</span>${it.img?`<img src="${it.img}" alt="" loading="lazy">`:'<span class="wb-noimg" title="No image on the wiki yet">&#9670;</span>'}<b>${it.n}</b><span>${it.type}${it.cost?' · '+it.cost+' medals':''}</span></div>`).join('')}</div></details>`).join('');
  return `<article class="card wb" data-k="${wb.kind}" id="wb-${norm(wb.n).replace(/ /g,'-')}">
    <div class="wb-cover">${wb.cover?`<img src="${wb.cover}" alt="${wb.n} cover" loading="lazy">`:''}<span class="tier tier-${t}" style="position:absolute;top:12px;left:12px;width:34px;height:34px;font-size:18px">${t}</span></div>
    <div class="wb-body">
      <div class="card-meta" style="margin:0 0 10px"><span class="pill hot">${wb.kind}</span>${wb.price?`<span class="pill">${wb.price}</span>`:''}${wb.date?`<span class="pill">${wb.date}</span>`:''}${wb.total?`<span class="pill">${wb.total} medals total</span>`:''}${g.sc?`<span class="pill">${g.sc}× Super Credit drops</span>`:''}</div>
      <h3 class="t-h3" style="font-size:24px">${wb.n}</h3>
      <p class="wc-d" style="margin-top:8px">${wb.intro.slice(0,260)}</p>
      <div class="wb-verdict"><b>Verdict &middot; ${g.score}/10</b><p>${pick(wb.n)||''}</p><p class="wb-reason">${g.reason}</p>
        ${g.hits.length?`<div class="card-meta">${g.hits.map(h=>`<span class="pill ${h.tier==='S'||h.tier==='A'?'hot':''}">${h.n} &middot; ${h.tier}</span>`).join('')}</div>`:''}</div>
      ${pages?`<button type="button" class="det-t" aria-expanded="false">Page by page <i>&#9660;</i></button><div class="card-det">${pages}</div>`:'<p class="empty" style="padding:14px 0">Contents not yet documented on the wiki.</p>'}
    </div>
  </article>`;
}
const list=$('#wbs'); list.innerHTML=WB.map(card).join(''); $('#wbCount').textContent=WB.length+' warbonds';
/* buy order: standard first, then by our rating */
const ranked=WB.map(w=>({w,g:grade(w)})).sort((a,b)=>(a.w.kind==='Standard'?-1:0)-(b.w.kind==='Standard'?-1:0)||b.g.score-a.g.score);
const bo=$('#buyorder');
function paintOrder(k){ /* rows open in place: the card content is cloned under the row */
  bo.innerHTML=ranked.filter(r=>k==='all'||r.w.kind===k).map((r,i)=>`<li><a href="#wb-${norm(r.w.n).replace(/ /g,'-')}"><span class="bo-n">${i+1}</span>${r.w.cover?`<img loading="lazy" src="${r.w.cover}" alt="">`:''}<span class="bo-t"><b>${r.w.n}</b><span>${r.w.kind}${r.w.price?' · '+r.w.price:''} · ${pick(r.w.n).split('.')[0]||'See review'}</span></span><span class="tier tier-${badgeFor(r.w.n)}">${badgeFor(r.w.n)}</span></a></li>`).join('');
}
paintOrder('all');
$$('.chip[data-k]').forEach(b=>b.addEventListener('click',()=>{$$('.chip[data-k]').forEach(x=>x.classList.remove('on'));b.classList.add('on');paintOrder(b.dataset.k);
  $$('.wb').forEach(c=>c.classList.toggle('hide',b.dataset.k!=='all'&&c.dataset.k!==b.dataset.k));}));
bo.addEventListener('click',e=>{
  const a=e.target.closest('a'); if(!a||!bo.contains(a)) return; e.preventDefault(); e.stopPropagation();
  const li=a.closest('li'); const id=(a.getAttribute('href')||'').replace(/^#/,'');
  const wasOpen=li.classList.contains('open');
  bo.querySelectorAll('li.open').forEach(x=>{ x.classList.remove('open'); const d=x.querySelector('.bo-detail'); if(d) d.remove(); });
  if(wasOpen) return;
  const src=document.getElementById(id); const body=src&&src.querySelector('.wb-body'); if(!body) return;
  const d=document.createElement('div'); d.className='bo-detail'; d.innerHTML=body.innerHTML;
  li.classList.add('open'); li.appendChild(d);
},true);
})();
