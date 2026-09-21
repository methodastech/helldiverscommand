/* ============ ARMORY ============ */
(function(){
'use strict';
const {$,$$}=window.HD;
const A=window.HD_ARMOR||{sets:[],traits:{}};
const sets=A.sets, T=A.traits;
const grid=$('#grid'), res=$('#resCount'), qEl=$('#q'), sel=$('#passiveSel');
let cls='all', pas='', q='';
const MAX={rating:Math.max(...sets.map(s=>+s.rating||0),150),speed:Math.max(...sets.map(s=>+s.speed||0),550),stam:Math.max(...sets.map(s=>+s.stam||0),125)};
[...new Set(sets.map(s=>s.passive).filter(Boolean))].sort().forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p;sel.appendChild(o);});
const CLSCOL={Light:'var(--green)',Medium:'var(--blue)',Heavy:'var(--bug)'};
function bar(label,v,max){ return `<div class="abar"><i>${label}</i><u><b style="width:${Math.min(100,(v||0)/max*100)}%"></b></u><em>${v||'—'}</em></div>`; }
/* ---- tiers from the numbers and the passive, drip from the eye ----
   Armour maths (wiki, Armor page): damage taken = attack x (1.5 - rating/200) up to 150;
   speed = 600 - rating. So every point of rating buys 0.5 percent damage reduction and
   costs one point of speed. The passive is what actually decides a fight, so it carries
   the most weight. Drip is editorial: how good it looks, nothing else. */
const PASS_W={'Democracy Protects':10,'Fortified':9,'Engineering Kit':8,'Med-Kit':8,'Servo-Assisted':8,'Peak Physique':7,'Siege-Ready':7,'Extra Padding':6,
  'Scout':7,'Inflammable':6,'Electrical Conduit':5,'Advanced Filtration':5,'Acclimated':6,'Unflinching':6,'Gunslinger':6,'Feet First':4,'Integrated Explosives':4,
  'Reinforced Epaulettes':5,'Reduced Signature':6,'Supplementary Adrenaline':5,'Adreno-Defibrillator':5,'Ballistic Padding':6,'Concussive Padding':4,'Kinetic Displacement Mitigation':5,
  'Rock Solid':5,'True Grit':6,'Oxygenator':4,'Desert Stormer':4,'Standard Issue':2};
const DRIP={};   /* editorial, by code: 5 is the set people build a whole look around */
'SC-34:4|CE-74:3|CM-21:4|FS-38:3|B-01:3|B-08:4|SA-25:5|DP-40:5|SA-04:4|SC-30:4|PH-9:5|CW-36:4|CE-35:3|DP-11:4|CE-07:3|CM-14:4|SA-32:3|FS-05:5|EX-03:4|EX-16:4|DP-53:5|TR-7:3|TR-9:3|TR-40:3|TR-62:3|TR-117:3|SC-37:4|CM-09:4|CM-17:5|FS-61:5|FS-55:4|CE-27:3|CE-101:4|CE-81:3|AF-50:4|AF-02:4|SA-12:4|I-92:5|I-102:5|I-09:4|UF-16:4|UF-50:5|UF-84:4|RE-2310:5|RE-1861:4|RE-824:4|GS-11:4|GS-17:5|GS-66:4|PH-56:4|PH-202:4|B-24:4|B-27:3|TR-4:3|CE-64:3|SR-24:3|SR-18:3|SR-11:3|CM-10:3|CM-11:3|DP-00:4|SA-42:3|CM-92:4|SC-15:4|FS-23:4|FS-37:4|FS-34:4|CE-67:4|CE-133:4|DP-77:4|I-44:4|I-15:4'.split('|').forEach(x=>{const [c,v]=x.split(':'); DRIP[c]=+v;});
/* rank-based tiers: the best 15 percent of sets are S, the next 25 A, the next 35 B, then C, the bottom 10 D */
let CUTS=null;
function tierByRank(pts){
  if(!CUTS){ const all=sets.map(x=>{ const r=+x.rating||0, sp=+x.speed||0, st=+x.stam||0; const dr=Math.round(r/2); const pw=PASS_W[x.passive]||3; const bal=(dr/75)*40+(sp/550)*30+(st/125)*30; return Math.round(bal*5+pw*50); }).sort((a,b)=>b-a);
    const at=f=>all[Math.min(all.length-1,Math.floor(all.length*f))]; CUTS={S:at(.15),A:at(.40),B:at(.75),C:at(.90)}; }
  return pts>=CUTS.S?'S':pts>=CUTS.A?'A':pts>=CUTS.B?'B':pts>=CUTS.C?'C':'D';
}
function grade(s){
  const r=+s.rating||0, sp=+s.speed||0, st=+s.stam||0;
  const dr=Math.round(r/2);                        // percent damage reduction, up to 150 rating
  const pw=PASS_W[s.passive]||3;
  const bal=(dr/75)*40+(sp/550)*30+(st/125)*30;    // 0..100 across the three stats
  const pts=Math.round(bal*5+pw*50);                // /1000: stats 500, passive 500
  const tier=tierByRank(pts);
  const why=`${r} rating takes ${dr} percent off incoming damage and leaves ${sp} speed with ${st} stamina regen. ${s.passive||'No passive'} scores ${pw}/10 for what it wins in a fight.`;
  return {pts,tier,why,drip:DRIP[s.code]||3};
}
const CLSIC={
  /* three distinct silhouettes, legible at 14px: bolt = fast, ring = balanced,
     solid block = heavy. Medium and Heavy used to share one shield path. */
  Light:'<path d="M13 3 5 14h6l-1 7 8-11h-6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  Medium:'<circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" stroke-width="2"/>',
  Heavy:'<path d="M12 2.6 20 7v10l-8 4.4L4 17V7Z" fill="currentColor"/>'};
window.HD_CLSIC=CLSIC;
const clsChip=c=>`<span class="tchip cls-${c}" title="${c} armour"><svg viewBox="0 0 24 24" aria-hidden="true">${CLSIC[c]||''}</svg><i>${c}</i></span>`;
const passIc=p=>p?`assets/img/passives/${p.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}.svg`:'';
const drip=n=>`<span class="drip" title="Drip ${n}/5, editorial">${[1,2,3,4,5].map(i=>`<b class="${i<=n?'f':''}">★</b>`).join('')}<i>Drip</i></span>`;
function card(s){
  const t=T[s.passive]||T[s.passive.replace('-',' ')]||null; const g=grade(s);
  return `<article class="card ac cls-${s.cls}" data-tier="${g.tier}" data-cls="${s.cls}">
    <div class="ac-img">${s.img?`<img src="${s.img}" alt="${s.code} ${s.name}" loading="lazy" decoding="async">`:'<div class="empty">No render</div>'}
      <span class="tier tier-${g.tier}" style="position:absolute;top:10px;left:10px">${g.tier}</span>${clsChip(s.cls)}</div>
    <div class="card-b" style="padding-top:12px">
      <div class="ac-top"><div><span class="sub mono dim">${s.code}</span><h3 class="t-h3" style="font-size:19px;margin:4px 0 0">${s.name}</h3></div>
        <div class="wc-pts"><b>${g.pts}</b><span>/ 1000</span></div></div>
      ${window.HD_STATS&&window.HD_STATS.srcBadge?window.HD_STATS.srcBadge('',s.code+' '+s.name):''}
      <div class="abars" style="margin-top:10px">${bar('Armor',+s.rating,MAX.rating)}${bar('Speed',+s.speed,MAX.speed)}${bar('Stamina',+s.stam,MAX.stam)}</div>
      <div class="apass"><span class="pass-ic" style="--i:url(&quot;${new URL(passIc(s.passive),location.href).href}&quot;)" aria-hidden="true"></span><div><b>${s.passive||"none"}</b><span>${t?t.effect:''}</span></div></div>
      <button type="button" class="det-t" aria-expanded="false">Why this score <i>&#9660;</i></button>
      <div class="card-det">
      <p class="wc-why"><i>${g.pts} / 1000, why</i>${g.why}</p>
      ${drip(g.drip)}
      ${s.desc?`<p class="wc-d" style="margin-top:10px">${s.desc}</p>`:''}
      </div>
    </div>
  </article>`;
}
/* every set on one board, same component as the weapons tier list on meta */
const TCOL={S:'#FFE01B',A:'#7BD16A',B:'#5A6473',C:'#3E4652',D:'#2A303A'};
/* grade() is stats 500 + passive 500. Show both halves so the number is checkable. */
function armBars(s,g){
  const r=+s.rating||0, sp=+s.speed||0, st=+s.stam||0;
  const dr=Math.round(r/2);
  const pw=PASS_W[s.passive]||3;
  const rows=[['Damage taken',Math.round((dr/75)*40*5),200],
              ['Speed',Math.round((sp/550)*30*5),150],
              ['Stamina',Math.round((st/125)*30*5),150],
              ['Passive',pw*50,500]];
  return '<div class="sbars">'+rows.map(([lab,got,max])=>{
    const pc=Math.max(0,Math.min(100,got/max*100));
    return `<div class="sbar"><i>${lab}</i><u><b style="width:${pc}%"></b></u><em>${got}<s>/${max}</s></em></div>`;
  }).join('')+'</div>';
}
function tierBoard(){
  const box=document.getElementById('armTiers'); if(!box) return;
  const groups={S:[],A:[],B:[],C:[],D:[]};
  sets.forEach(s=>{ const g=grade(s); (groups[g.tier]=groups[g.tier]||[]).push({s,g}); });
  box.innerHTML=['S','A','B','C','D'].map(t=>{
    const list=(groups[t]||[]).sort((a,b)=>b.g.pts-a.g.pts);
    if(!list.length) return '';
    return `<div class="tierrow tier-${t}">
      <div class="tierlab" style="background:${TCOL[t]};color:${t==='S'||t==='A'?'#000':'#fff'}">${t}<i>${list.length}</i></div>
      <div class="tieritems">${list.map(({s,g},ri)=>`<a class="titem atitem cls-${s.cls}" href="#sets" data-code="${s.code}">
        <span class="trank">${g.tier}${ri+1}</span>
        <u${s.img?` style="background-image:url(${s.img})"`:''}></u>
        <span><b>${s.name}</b><i>${s.cls} · ${g.pts}</i></span>
        <div class="ttip"><b>${s.name}<s class="tt-rank">${g.tier}${ri+1}</s></b><em>${s.passive||'No passive'}</em><p>${g.why}</p>
          ${armBars(s,g)}
          <span class="ttip-n">${g.pts} / 1000 &middot; ${g.tier} rank ${ri+1} of ${list.length}</span></div></a>`).join('')}</div>
    </div>`;
  }).join('');
  /* clicking a tile filters the grid above to that set */
  box.addEventListener('click',e=>{ const a=e.target.closest('.atitem'); if(!a)return;
    const code=a.dataset.code; const set=sets.find(x=>x.code===code); if(!set)return;
    const qi=document.getElementById('q'); if(qi){ qi.value=set.name; q=set.name; render(); }
  });
}
function render(){
  const t=q.trim().toLowerCase();
  const list=sets.filter(s=>(cls==='all'||s.cls===cls)&&(!pas||s.passive===pas)&&(!t||(s.name+' '+s.code+' '+s.passive+' '+s.desc).toLowerCase().includes(t)));
  grid.innerHTML=list.map(card).join('')||'<div class="empty">No armour matches</div>';
  res.textContent=list.length+' of '+sets.length+' sets';
}
$$('.chip[data-c]').forEach(b=>b.addEventListener('click',()=>{$$('.chip[data-c]').forEach(x=>x.classList.remove('on'));b.classList.add('on');cls=b.dataset.c;render();}));
sel.addEventListener('change',()=>{pas=sel.value;render();});
qEl.addEventListener('input',()=>{q=qEl.value;render();});
render();
tierBoard();
$('#traitBody').innerHTML=Object.entries(T).map(([n,t])=>`<tr><td style="font-weight:600;white-space:nowrap">${n}</td><td class="dim">${t.effect}</td>
  <td>${t.light?'<span class="gold">&#9670;</span>':'<span class="dim">&middot;</span>'}</td><td>${t.medium?'<span class="gold">&#9670;</span>':'<span class="dim">&middot;</span>'}</td><td>${t.heavy?'<span class="gold">&#9670;</span>':'<span class="dim">&middot;</span>'}</td><td class="mono" style="color:var(--blue)">${t.intro||''}</td></tr>`).join('');
})();

/* this runs outside the module IIFE above, so it reads the icons from the window, not the block scope */
(function(){ const C=window.HD_CLSIC||{}; const IC={Light:C.Light,Medium:C.Medium,Heavy:C.Heavy};
  document.querySelectorAll('.chip[data-c]').forEach(b=>{ const k=String(b.dataset.c||''); const g=IC[k]||IC[k.charAt(0).toUpperCase()+k.slice(1).toLowerCase()]; if(g&&!b.querySelector('svg')) b.insertAdjacentHTML('afterbegin',`<svg class="tab-ic" viewBox="0 0 24 24" aria-hidden="true">${g}</svg>`); b.classList.add('has-ic'); }); })();
