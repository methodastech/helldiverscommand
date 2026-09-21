/* ============ ENEMY SIMULATOR ============
   Pick a weapon, pick an enemy, see the hits per zone. The same model as the pipeline
   (tools/pipeline/build_stats.py): AP above AV full damage, AP equal 65 percent, AP below
   nothing; effective = damage × (1 − durable) + durable damage × durable; fatal parts kill
   when broken, others pass a percentage to the main pool, capped when the wiki says so. */
(function(){
'use strict';
const $=(q,r=document)=>r.querySelector(q);
const W=window.HD_WSTATS||{}, E=window.HD_ESTATS||{};
const root=$('#sim'); if(!root||!Object.keys(W).length) return;
const FLAME=150, DOT=100, SECS=3;
const n0=n=>Number(n||0).toLocaleString('en-GB');
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function eff(dmg,dur2,durPct,ap,av){ if(ap<av) return 0; return (dmg*(1-durPct/100)+dur2*(durPct/100))*(ap>av?1:.65); }
function simulate(w,en){
  const hp=en.hp||0, fire=w.el==='fire'||w.kind==='spray';
  const rows=[]; let best=null;
  if(w.kind==='spray'){
    const dps=FLAME+DOT*(en.fire||1);
    en.parts.forEach(p=>{ if(p.prep||w.ap<p.av||!(p.hp||p.hpm)) { rows.push({p,none:true}); return; }
      const php=p.hpm?hp:p.hp; const pool=p.fatal?php:(hp/Math.max(.01,(p.main||0)/100)); const s=pool/dps;
      const r={p,secs:Math.ceil(s),per:Math.round(dps),route:p.fatal?'break':'main'}; rows.push(r); if(!best||r.secs<best.secs) best=r; });
    return {rows,best,flame:true};
  }
  const kinds=[['direct',w.dmg,w.dur,w.ap,w.pel>1?w.pel:1]]; if(w.x) kinds.push(['blast',w.x.dmg,w.x.dur2,w.x.ap,1]);
  en.parts.forEach(p=>{
    const php=p.hpm?hp:p.hp; let r={p,none:true};
    kinds.forEach(([kind,dmg,dur2,ap,pel])=>{ if(!dmg) return;
      const e=eff(dmg*pel,(dur2||0)*pel,p.dur||0,ap,p.av); if(e<=0) return;
      const burn=(fire&&kind==='direct'&&p.av<=4)?DOT*SECS*(en.fire||1):0;
      let br=null, mn=null;
      if(p.fatal&&php) br=Math.max(1,Math.ceil(Math.max(0,php-burn)/e));
      const pct=(p.main||0)/100; if(pct>0&&hp){ const per=((p.cap&&php)?Math.min(e,php):e)*pct; if(per>0) mn=Math.max(1,Math.ceil(Math.max(0,hp-burn*pct)/per)); }
      const hits=Math.min(br||1e9,mn||1e9); if(hits>=1e9) return;
      if(r.none||hits<r.hits) r={p,hits,br,mn,per:Math.round(e),kind,route:(br&&br<=(mn||1e9))?'break':'main'}; });
    rows.push(r); if(!r.none&&!r.p.prep&&(!best||r.hits<best.hits)) best=r; });
  return {rows,best,flame:false};
}
function ttk(w,n){ const rate=w.rate||0, mag=Math.max(1,w.mag||1), rl=w.reload||2, chg=w.chg||0; let t=w.kind==='beam'&&rate?n/(rate/60):rate?(n-1)/(rate/60)+n*chg:(n-1)*1.1+chg; t+=Math.max(0,Math.ceil(n/mag)-1)*rl; return t; }
/* ---- ui ---- */
const wk=Object.keys(W).filter(k=>W[k].dmg).sort((a,b)=>(W[a].slot||'').localeCompare(W[b].slot||'')||W[a].n.localeCompare(W[b].n));
const ek=Object.keys(E).sort();
const facOf=n=>{ const e=(window.HD_ENEMIES||[]).find(x=>x.n===n); return e?e.f:''; };
root.innerHTML=`<div class="sim-bar">
  <label><i>Weapon</i><select id="simW">${['PRIMARY','SECONDARY','SUPPORT','GRENADE'].map(sl=>`<optgroup label="${sl}">${wk.filter(k=>W[k].slot===sl).map(k=>`<option value="${esc(k)}">${esc(W[k].full||W[k].n)}</option>`).join('')}</optgroup>`).join('')}</select></label>
  <label><i>Enemy</i><select id="simE">${['TERMINID','AUTOMATON','ILLUMINATE'].map(f=>`<optgroup label="${f}">${ek.filter(k=>facOf(k)===f).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('')}</optgroup>`).join('')}</select></label>
  <button type="button" class="btn sm ghost" id="simRand">Random pair</button>
</div>
<div class="sim-out" id="simOut"></div>`;
const sw=$('#simW'), se=$('#simE'), out=$('#simOut');
const q=new URLSearchParams(location.search); if(q.get('w')&&W[q.get('w').toUpperCase()]) sw.value=q.get('w').toUpperCase(); else sw.value='AR-23 LIBERATOR'; if(q.get('q')&&E[q.get('q')]) se.value=q.get('q'); else se.value='Charger';
function paint(){
  const w=W[sw.value], en=E[se.value]; if(!w||!en) return;
  const r=simulate(w,en); const st=window.HD_STATS||{};
  const head=r.best?(r.flame?`<b>${r.best.secs} s</b><span>of flame on the ${esc(r.best.p.p)}</span>`:`<b>${r.best.hits}</b><span>${r.best.hits===1?'hit':'hits'} to the ${esc(r.best.p.p)}${r.best.kind==='blast'?', blast':''} · ${ttk(w,r.best.hits).toFixed(2)} s · ${Math.ceil(r.best.hits/Math.max(1,w.mag||1))} ${w.mag>1?'magazine'+(Math.ceil(r.best.hits/w.mag)>1?'s':''):'round'+(r.best.hits>1?'s':'')}</span>`):`<b>0</b><span>nothing on this enemy gets through AP ${w.ap}</span>`;
  const rows=r.rows.map(x=>{ const p=x.p; const cls=x.none?'no':(r.best&&x.p===r.best.p?'best':'')+(p.prep?' prep':'');
    const hm=st.hitMark?st.hitMark(x.none?'none':(w.ap>p.av?'full':'part')):''; const val=x.none?`<td class="num hit" colspan="3">${hm}no penetration</td>`:r.flame?`<td class="num hit">${hm}${x.per}/s</td><td class="num">${x.secs} s</td><td>${x.route==='break'?'breaks':'to main'}</td>`:`<td class="num hit">${hm}${n0(x.per)}</td><td class="num">${x.hits}</td><td>${x.route==='break'?'breaks it':`${p.main}% to main`}${x.kind==='blast'?' · blast':''}</td>`;
    return `<tr class="${cls}"><td>${esc(p.p)}${p.prep?' <i title="only reachable once the armour over it is gone">exposed</i>':''}</td><td class="num">${p.hpm?'main':n0(p.hp||0)}</td><td class="num av">${st.avBadge?st.avBadge(p.av):p.av}</td><td class="num">${p.dur||0}%</td>${val}</tr>`; }).join('');
  out.innerHTML=`<div class="sim-head">
      <div class="sim-w">${st.wicon?`<img src="${st.wicon(w.n)||''}" alt="" onerror="this.remove()">`:''}<div><i>${esc(w.slot||'')} · ${st.apBadge?st.apBadge(w.ap):''} AP ${w.ap}${st.apName?' · '+st.apName(w.ap):''}${w.pel>1?` · ${w.pel} pellets`:''}${w.x?` · blast ${w.x.dmg}`:''}</i><b>${esc(w.full||w.n)}</b><span>${st.dmgIcon?st.dmgIcon(w.el):''}${r.flame?FLAME+' fire damage a second':n0(w.dmg)+' '+(st.elName&&st.elName(w.el)?st.elName(w.el).toLowerCase()+' ':'')+'damage'}${w.dur?` · ${n0(w.dur)} durable`:''}${w.rate?` · ${n0(w.rate)} ${w.kind==='beam'?'ticks':'rpm'}`:''}${w.mag>1?` · ${w.mag} per mag`:''}</span></div></div>
      <div class="sim-res">${head}</div>
      <div class="sim-e"><div><i>${esc(facOf(se.value))} · ${n0(en.hp)} hp${en.fire&&en.fire!==1?` · fire ×${en.fire}`:''}</i><b>${esc(se.value)}</b><span>${en.parts.length} hit zones</span></div>${st.eicon?`<img src="${st.eicon(se.value)||''}" alt="" onerror="this.remove()">`:''}</div>
    </div>
    ${st.zoneMap?st.zoneMap(se.value,st.eicon?st.eicon(se.value):''):''}
    <div class="tscroll"><table class="tbl sim-tbl"><thead><tr><th>Zone</th><th class="num">HP</th><th class="num">AV</th><th class="num">Durable</th><th class="num">${r.flame?'Damage/s':'Per hit'}</th><th class="num">${r.flame?'Seconds':'Hits'}</th><th>Kill route</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="sim-note">${st.hitLegend?st.hitLegend():''}<br>Model: AP above AV full damage, equal 65 percent, below ricochet. Effective damage = damage × (1 − durable) + durable damage × durable. Fatal zones kill when broken; other zones pass their percentage to the main pool. ${w.kind==='spray'?'Flame is 150 per second plus 100 per second burn × the fire multiplier of the enemy. ':''}${w.el==='fire'?'Each hit adds a 3 s burn. ':''}Shotgun pellets are assumed to all land. Explosions use the AP of the blast. Numbers from the game files via the wiki; the model is ours.</p>`;
  history.replaceState(null,'',location.pathname+'?w='+encodeURIComponent(sw.value)+'&q='+encodeURIComponent(se.value)+'#sim');
}
sw.addEventListener('change',paint); se.addEventListener('change',paint);
$('#simRand').addEventListener('click',()=>{ sw.value=wk[(Math.random()*wk.length)|0]; se.value=ek[(Math.random()*ek.length)|0]; paint(); });
paint();
})();
