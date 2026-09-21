/* ============ BESTIARY ============ */
(function(){
'use strict';
const {$,$$}=window.HD;
const E=window.HD_ENEMIES||[];
const grid=$('#grid'), none=$('#none'), qEl=$('#q'), res=$('#resCount'), sortEl=$('#sort');
let fac='all', q='', sort='threat';
const COL={TERMINID:'var(--bug)',AUTOMATON:'var(--bot)',ILLUMINATE:'var(--squid)'};

function card(e){
  const c=COL[e.f]||'var(--gold)';
  const IMG=(window.HD_IMG&&window.HD_IMG.enemies&&window.HD_IMG.enemies[e.n])?'assets/img/enemies/'+window.HD_IMG.enemies[e.n]:'';
  const MARK={TERMINID:'faction_terminids',AUTOMATON:'faction_automaton',ILLUMINATE:'faction_illuminate'}[e.f];
  const mk=(window.HD_IMG&&window.HD_IMG.misc&&MARK&&window.HD_IMG.misc[MARK])?'assets/img/misc/'+window.HD_IMG.misc[MARK]:'';
  /* the two numbers a diver needs before the drop: what the weak point takes, and the heaviest plate on the body */
  const es=(window.HD_ESTATS||{})[e.n], S=window.HD_STATS||{};
  const aim=es&&es.parts.find(p=>p.p===es.aim), heavy=es?Math.max.apply(null,es.parts.map(p=>p.av)):null;
  const avRow=(es&&S.avBadge)?`<div class="wk-av">${aim?`<span>${S.avBadge(aim.av)}<em>Weak point ${S.avName(aim.av).toLowerCase()}${aim.av>0?`, AP ${aim.av} or better`:', any weapon'}</em></span>`:''}<span>${S.avBadge(heavy)}<em>Heaviest plate ${S.avName(heavy).toLowerCase()}</em></span>${es.fire&&es.fire>1?`<span class="burn">${S.dmgIcon?S.dmgIcon('fire'):''}<em>Fire &times;${es.fire}</em></span>`:''}</div>`:'';
  return `<article class="card wc" style="--acc:${c}">
    <span class="stripe"></span>
    ${IMG?`<div class="wc-img" style="height:190px"><img src="${IMG}" alt="${e.n}" loading="lazy" decoding="async">${mk?`<span class="faction-mark"><img src="${mk}" alt="" loading="lazy"></span>`:''}</div>`:''}
    <div class="wc-h">
      <div style="flex:1"><h3 style="color:${c}">${e.n}</h3>
        <span class="sub">${e.f}${e.size?' &middot; '+e.size:''}${e.diff?' &middot; from difficulty '+e.diff:''}</span></div>
      <div style="text-align:right">
        <div class="threat">${[1,2,3,4,5].map(i=>`<b class="${i<=e.threat?'f':''}"></b>`).join('')}</div>
        <span class="sub" style="margin-top:6px">Threat ${e.threat}/5</span>
      </div>
    </div>
    <div class="wk"><i>Weak point</i><b style="color:${c}">${e.weak}</b></div>${avRow}
    <p class="wc-v">${e.kill}</p>
    <button type="button" class="det-t" aria-expanded="false">Hit zones and lore <i>&#9660;</i></button>
    <div class="card-det">
    ${e.intro?`<p class="wc-d">${e.intro}</p>`:''}
    ${e.tips?`<details class="es-an fn"><summary>Field notes from the wiki</summary><p class="wc-d">${e.tips.replace(/\s*·\s*\*/g,'</p><p class="wc-d">')}</p></details>`:''}
    ${window.HD_STATS?window.HD_STATS.enemyBlock(e.n):''}
    </div>
    <div class="card-acts"><a class="btn sm" href="enemies.html?q=${encodeURIComponent(e.n)}#simSec">Simulate <span class="ar">&#9654;</span></a><a class="btn sm ghost" href="arcade.html#intel">Drill this</a></div>
    <div class="card-meta"><span class="pill hot">${e.f}</span>${e.size?`<span class="pill">${e.size}</span>`:''}<span class="pill ${e.threat>=4?'hot':''}">Threat ${e.threat}/5</span>${false?`<span class="pill">From difficulty ${e.diff}</span>`:''}${/flying|fly|wing|engine/i.test(e.weak+e.kill)?'<span class="pill">Airborne</span>':''}${/anti-tank|recoilless|railcannon|500kg|eat/i.test(e.kill)?'<span class="pill hot">Needs anti-tank</span>':''}</div>
  </article>`;
}
function render(){
  const t=q.trim().toUpperCase();
  let list=E.filter(e=>{
    if(fac!=='all' && e.f!==fac) return false;
    if(!t) return true;
    return (e.n+' '+e.weak+' '+e.kill+' '+e.intro+' '+e.f).toUpperCase().includes(t);
  });
  list.sort((a,b)=> sort==='name' ? a.n.localeCompare(b.n) : (b.threat-a.threat)||a.n.localeCompare(b.n));
  grid.innerHTML=list.map(card).join('');
  none.classList.toggle('hide',!!list.length);
  res.textContent=list.length+' of '+E.length+' shown';
}
$$('.chip[data-f]').forEach(b=>b.addEventListener('click',()=>{
  $$('.chip[data-f]').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); fac=b.dataset.f; render();
}));
qEl.addEventListener('input',()=>{q=qEl.value;render();});
sortEl.addEventListener('change',()=>{sort=sortEl.value;render();});
const pq=new URLSearchParams(location.search).get('q');
if(pq&&qEl){ qEl.value=pq; q=pq; }
const pf=new URLSearchParams(location.search).get('f');
if(pf){ const b=document.querySelector(`.chip[data-f="${pf.toUpperCase()}"]`); if(b){ $$('.chip[data-f]').forEach(x=>x.classList.remove('on')); b.classList.add('on'); fac=pf.toUpperCase(); } }
render();
/* deep link: ?random=1 lands on one enemy card */
if(new URLSearchParams(location.search).get('random')==='1'){
  const cards=$$('.wc',grid); const c=cards[(Math.random()*cards.length)|0];
  if(c){ c.classList.add('hl'); setTimeout(()=>c.scrollIntoView({block:'center'}),250); }
}

const dw=$('#doctrine');
if(dw) dw.innerHTML=(window.HD_FACTIONS||[]).map(f=>
  `<article class="panel fac rv" style="--acc:${f.colour}">
     <span class="tag" style="color:${f.colour};border-color:${f.colour}55;background:${f.colour}12">${f.tag}</span>
     <h3>${f.name}</h3><p class="lede">${f.line}</p><p>${f.brief}</p>
     <ul>${f.win.map(w=>`<li><span>${w}</span></li>`).join('')}</ul>
     <div class="card-meta" style="margin-top:18px">
       ${f.bring.map(b=>`<span class="pill hot">${b}</span>`).join('')}
     </div>
     <div class="card-meta" style="margin-top:8px">
       ${f.avoid.map(b=>`<span class="pill">Avoid: ${b}</span>`).join('')}
     </div>
   </article>`).join('');
if(window.HD.observeReveals) window.HD.observeReveals();
})();
