/* ============ ARSENAL DATABASE ============ */
(function(){
'use strict';
const {$,$$}=window.HD;
const W=window.HD_WEAPONS||[];
const grid=$('#grid'), none=$('#none'), qEl=$('#q'), res=$('#resCount'), sortEl=$('#sort');
let slot='all', tier=null, q='', sort='tier';
const TORD={S:0,A:1,B:2,C:3};

/* five-point faction bars computed from the matchups (data/stats.js), each point its own mark */
const PIP=['<path d="M4 12h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  '<path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  '<path d="M12 4l8 8-8 8-8-8Z" fill="none" stroke="currentColor" stroke-width="2"/>',
  '<path d="M12 3l3 6 6 1-4.5 4.2 1 6.3L12 17.6 6.5 20.5l1-6.3L3 10l6-1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  '<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/>'];
function bar(cls,label,v){
  return `<div class="bar ${cls}" title="${label} ${v}/5"><i>${label}</i><u>${[1,2,3,4,5].map(i=>
    `<b class="${i<=v?'f':''}"><svg viewBox="0 0 24 24" aria-hidden="true">${PIP[i-1]}</svg></b>`).join('')}</u><em>${v}</em></div>`;
}
function statOf(w){
  const W=window.HD_WSTATS||{}; const full=w.full||w.n;
  const k=Object.keys(W).find(k=>W[k].full===full||W[k].n===w.n||k===String(full).toUpperCase());
  return k?Object.assign({key:k},W[k]):null;
}
function tags(w){
  const S=window.HD_STATS||{}; const st=statOf(w);
  const ap=(st&&st.ap!=null)?st.ap:(w.pen!=null&&w.pen!==''?+w.pen:null);
  const t=[[w.slot,'hot']];
  /* the penetration pill carries the game's AP glyph; anti-tank and heavy read hot */
  if(ap!=null&&S.apBadge) t.push([`${S.apBadge(ap)}${S.apName(ap)} pen`,ap>=4?'hot':'']);
  else { const tr=(w.traits||'').toLowerCase(); if(tr.includes('heavy')) t.push(['Heavy pen','hot']); else if(tr.includes('medium')) t.push(['Medium pen']); else if(tr.includes('light')) t.push(['Light pen']); }
  if(st&&st.el&&st.el!=='none'&&S.dmgIcon&&S.dmgIcon(st.el)) t.push([`${S.dmgIcon(st.el)}${S.elName(st.el)}`,'','dmg']);
  const best=[['Bugs',w.b],['Bots',w.a],['Squids',w.i]].filter(x=>x[1]>=5).map(x=>['Best vs '+x[0],'hot']);
  /* lean: the slot, the penetration, the damage type, best-vs; class, source and trait words live in the numbers block */
  return t.concat(best).slice(0,5);
}
function card(w){
  const IMG=(window.HD_IMG&&window.HD_IMG.weapons&&window.HD_IMG.weapons[w.n])?'assets/img/weapons/'+window.HD_IMG.weapons[w.n]:'';
  const st=statOf(w);
  const tier=st&&st.ptier?st.ptier:w.tier;
  const fac=st&&st.fac?st.fac:{b:w.b,a:w.a,i:w.i};
  return `<article class="card wc" data-tier="${tier}">
    ${IMG?`<div class="wc-img"><span class="tier tier-${tier}">${tier}</span><img src="${IMG}" alt="${w.n}" loading="lazy" decoding="async"></div>`:''}
    <div class="wc-h">
      ${IMG?'':`<span class="tier tier-${tier}">${tier}</span>`}
      <div style="flex:1"><h3>${w.n}</h3><span class="sub">${w.slot} &middot; ${w.cls}</span></div>
      ${st&&st.pts!=null?`<div class="wc-pts"><b>${st.pts}</b><span>/ 1000</span></div>`:''}
    </div>
    <div class="bars">${bar('bug','BUGS',fac.b)}${bar('bot','BOTS',fac.a)}${bar('sq','SQUIDS',fac.i)}</div>
    <p class="wc-v">${w.verdict}</p>
    <button type="button" class="det-t" aria-expanded="false">Full stats <i>&#9660;</i></button>
    <div class="card-det">
    ${st&&st.why?`<p class="wc-why"><i>${st.pts!=null?st.pts+' / 1000, why':'Not ranked'}</i>${st.why}${st.ver?` <em>Verified against ${st.ver}</em>`:''}</p>`:''}
    <dl style="margin:0">
      ${w.full&&w.full!==w.n?`<div class="srow"><dt>Designation</dt><dd>${w.full}</dd></div>`:''}
      ${w.dmg?`<div class="srow"><dt>Damage</dt><dd>${st&&st.el&&window.HD_STATS&&window.HD_STATS.dmgIcon?window.HD_STATS.dmgIcon(st.el):''}${w.dmg}${st&&st.el&&st.el!=='none'&&window.HD_STATS&&window.HD_STATS.elName?' · '+window.HD_STATS.elName(st.el):''}</dd></div>`:''}
      ${w.pen?`<div class="srow"><dt>Penetration</dt><dd>${(window.HD_STATS&&window.HD_STATS.apBadge)?window.HD_STATS.apBadge(w.pen):''}AP ${w.pen}${(window.HD_STATS&&window.HD_STATS.apName)?' · '+window.HD_STATS.apName(w.pen):''}</dd></div>`:''}
      ${w.modes?`<div class="srow"><dt>Fire modes</dt><dd>${w.modes}</dd></div>`:''}
      ${w.traits?`<div class="srow"><dt>Traits</dt><dd>${w.traits}</dd></div>`:''}
      ${w.cap?`<div class="srow"><dt>Capacity</dt><dd>${w.cap}</dd></div>`:''}
      ${w.rate?`<div class="srow"><dt>Fire rate</dt><dd>${w.rate}</dd></div>`:''}
      ${w.src?`<div class="srow"><dt>Source</dt><dd>${w.src}${w.price?' &middot; '+w.price:''}</dd></div>`:''}
    </dl>
    ${window.HD_STATS&&window.HD_STATS.srcBadge?window.HD_STATS.srcBadge(w.src,w.full||w.n):''}
    ${w.desc?`<p class="wc-d">${w.desc}</p>`:''}
    ${window.HD_STATS?window.HD_STATS.weaponBlock(w.full||w.n):''}
    </div>
    <div class="card-meta">${tags(w).map(t=>`<span class="pill ${t[1]||''}">${t[0]}</span>`).join('')}</div>
    <div class="card-acts"><a class="btn sm" href="enemies.html?w=${encodeURIComponent(((st&&st.key)||(w.full||w.n)).toUpperCase())}#simSec">Simulate <span class="ar">&#9654;</span></a>${w.src&&/warbond/i.test(w.src)?`<a class="btn sm ghost" href="warbonds.html#wb-${w.src.replace(/^Warbond:\s*/i,'').replace(/\(.*?\)/,'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-')}">Warbond</a>`:''}</div>
  </article>`;
}
/* roster: every weapon on one board, a row per tier, ranked by points inside the row */
function roster(list){
  const T=['S','A','B','C','D'];
  const rows=T.map(t=>{
    const items=list.map(w=>({w,st:statOf(w)})).filter(x=>(x.st&&x.st.ptier?x.st.ptier:x.w.tier)===t)
      .sort((a,b)=>((b.st&&b.st.pts)||0)-((a.st&&a.st.pts)||0));
    if(!items.length) return '';
    return `<div class="ros-row tier-${t}"><div class="ros-t"><b>${t}</b><span>${items.length}</span></div><div class="ros-items">${items.map(({w,st})=>{
      const IMG=(window.HD_IMG&&window.HD_IMG.weapons&&window.HD_IMG.weapons[w.n])?'assets/img/weapons/'+window.HD_IMG.weapons[w.n]:'';
      return `<button type="button" class="ros-it" data-n="${w.n}" title="${w.n}${st&&st.pts!=null?' · '+st.pts+' / 1000':' · not ranked'}"><i${IMG?` style="background-image:url(${IMG})"`:''}></i>${st&&st.ap!=null&&window.HD_STATS&&window.HD_STATS.apBadge?`<span class="ros-ap">${window.HD_STATS.apBadge(st.ap)}</span>`:''}<b>${w.n}</b>${st&&st.pts!=null?`<span>${st.pts}</span>`:`<span class="unr">&mdash;</span>`}</button>`;
    }).join('')}</div></div>`;
  }).join('');
  return `<div class="roster">${rows}</div>`;
}
let view='roster';
function render(){
  const t=q.trim().toUpperCase();
  let list=W.filter(w=>{
    if(slot!=='all' && w.slot!==slot) return false;
    if(tier && w.tier!==tier) return false;
    if(!t) return true;
    return (w.n+' '+w.full+' '+w.cls+' '+w.traits+' '+w.src+' '+w.verdict).toUpperCase().includes(t);
  });
  const key={bug:'b',bot:'a',squid:'i'}[sort];
  list.sort((x,y)=>{
    if(sort==='name') return x.n.localeCompare(y.n);
    if(key) return (y[key]-x[key]) || TORD[x.tier]-TORD[y.tier] || x.n.localeCompare(y.n);
    return TORD[x.tier]-TORD[y.tier] || (y.b+y.a+y.i)-(x.b+x.a+x.i) || x.n.localeCompare(y.n);
  });
  grid.classList.toggle('ros-mode',view==='roster');
  grid.innerHTML=view==='roster'?roster(list):list.map(card).join('');
  none.classList.toggle('hide',!!list.length);
  res.textContent=list.length+' of '+W.length+' shown';
}
$$('.chip[data-s]').forEach(b=>b.addEventListener('click',()=>{
  $$('.chip[data-s]').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); slot=b.dataset.s; render();
}));
$$('.chip[data-t]').forEach(b=>b.addEventListener('click',()=>{
  const was=b.classList.contains('on');
  $$('.chip[data-t]').forEach(x=>x.classList.remove('on'));
  if(was){tier=null;} else {b.classList.add('on'); tier=b.dataset.t;}
  render();
}));
qEl.addEventListener('input',()=>{q=qEl.value;render();});
sortEl.addEventListener('change',()=>{sort=sortEl.value;render();});
const pre=new URLSearchParams(location.search).get('q');
if(pre){qEl.value=pre;q=pre;}
render();
/* roster toggle sits with the Cards / List switch that core.js draws */
(function rosterToggle(){
  const t=document.querySelector('.view-toggle');
  if(!t){ setTimeout(rosterToggle,120); return; }   /* core.js draws the toggle after this script runs */
  const b=document.createElement('button'); b.type='button'; b.dataset.view='roster'; b.textContent='Roster';
  t.insertBefore(b,t.firstChild);                       /* Roster, then Cards, then List */
  /* roster is the default unless the visitor already picked something else */
  let stored=null; try{ stored=localStorage.getItem('hd_view_arsenal.html'); }catch(e){}
  if(!stored){
    view='roster';
    t.querySelectorAll('button').forEach(k=>k.classList.toggle('on',k===b));
    const g=document.querySelector('#wgrid,.wgrid'); if(g) g.classList.remove('grid-compact');
    render();
  } else {
    view='cards';
    t.querySelectorAll('button').forEach(k=>k.classList.toggle('on',k.dataset.view===stored));
  }
  t.addEventListener('click',e=>{ const x=e.target.closest('button'); if(!x)return;
    view=x.dataset.view==='roster'?'roster':'cards';
    try{ localStorage.setItem('hd_view_arsenal.html',x.dataset.view); }catch(e){}
    t.querySelectorAll('button').forEach(k=>k.classList.toggle('on',k===x));
    if(view==='roster') document.querySelector('#wgrid,.wgrid').classList.remove('grid-compact');
    render(); });
  document.addEventListener('click',e=>{ const it=e.target.closest('.ros-it'); if(!it)return;
    view='cards'; t.querySelectorAll('button').forEach(k=>k.classList.toggle('on',k.dataset.view==='cards'));
    const q=document.querySelector('#q'); if(q){ q.value=it.dataset.n; q.dispatchEvent(new Event('input')); }
    render(); });
})();
})();
