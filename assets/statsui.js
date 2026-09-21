/* ============ COMBAT DATA ============
   Renders the anatomy, the aim point and the ranked answers that tools/pipeline/build_stats.py
   computes from the game's own damage rules. Shared by the bestiary and the arsenal. */
(function(){
'use strict';
const E=()=>window.HD_ESTATS||{}, W=()=>window.HD_WSTATS||{};
const IMG=()=>window.HD_IMG||{};
const n0=v=>v==null?'':Math.round(v).toLocaleString('en-US');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function wicon(name,slot){
  const I=IMG();
  if(slot==='GRENADE'&&I.grenades&&I.grenades[name]) return 'assets/img/grenades/'+I.grenades[name];
  if(I.weapons&&I.weapons[name]) return 'assets/img/weapons/'+I.weapons[name];
  if(I.grenades&&I.grenades[name]) return 'assets/img/grenades/'+I.grenades[name];
  return '';
}
function eicon(name){
  const I=IMG();
  return (I.enemies&&I.enemies[name])?'assets/img/enemies/'+I.enemies[name]:'';
}
const SLOT={PRIMARY:'Primary',SECONDARY:'Sidearm',SUPPORT:'Support',GRENADE:'Grenade'};
/* Armour tiers as the game and the wiki draw them: AV0 squishy (blue shield), AV1 to 2 light (grey),
   AV3 medium and AV4 heavy (gold), AV5 and up tank (red). The icons are the wiki's renders of the
   in-game shield glyphs, assets/img/av/av{n}.webp and ap{n}.webp. */
function avClass(av){ return av>=5?'av-t':av>=4?'av-h':av>=3?'av-m':av>=1?'av-l':'av-0'; }
/* the number alone means nothing to a reader; name the tier it falls in */
function avName(av){ return av>=5?'Tank':av>=4?'Heavy':av>=3?'Medium':av>=1?'Light':'Unarmoured'; }
function apName(ap){ return ap>=5?'Anti-tank':ap>=4?'Heavy':ap>=3?'Medium':ap>=2?'Light':'Unarmoured only'; }
const AVN=n=>Math.max(-1,Math.min(11,Math.round(Number(n)||0)));
function avBadge(av,cls){ return `<img class="avi ${avClass(av)}${cls?' '+cls:''}" src="assets/img/av/av${AVN(av)}.webp" alt="Armour value ${AVN(av)}, ${avName(av).toLowerCase()}" title="Armour value ${AVN(av)}: ${avName(av)}" width="22" height="26">`; }
function apBadge(ap,cls){ return `<img class="avi ap ${avClass(ap)}${cls?' '+cls:''}" src="assets/img/av/ap${AVN(ap)}.webp" alt="Armour penetration ${AVN(ap)}, ${apName(ap).toLowerCase()}" title="Armour penetration ${AVN(ap)}: ${apName(ap)}" width="22" height="26">`; }
/* the three hit markers the HUD draws: red X full damage, white X 65 percent, ricochet nothing */
const HM={
  full:'<svg class="hm hm-full" viewBox="0 0 24 24" role="img" aria-label="red hit marker, full damage"><path d="M3 3l5 5M21 3l-5 5M3 21l5-5M21 21l-5-5" stroke="currentColor" stroke-width="3.2" stroke-linecap="square" fill="none"/></svg>',
  part:'<svg class="hm hm-part" viewBox="0 0 24 24" role="img" aria-label="white hit marker, 65 percent damage"><path d="M3 3l5 5M21 3l-5 5M3 21l5-5M21 21l-5-5" stroke="currentColor" stroke-width="3.2" stroke-linecap="square" fill="none"/></svg>',
  none:'<svg class="hm hm-none" viewBox="0 0 24 24" role="img" aria-label="ricochet, no damage"><path d="M12 1.8l8.6 3.1v7c0 4.9-3.6 9.1-8.6 11.3C7 21 3.4 16.8 3.4 11.9v-7z" fill="currentColor"/><path d="M16.2 6.6l-7.4 7.4M8.8 9.2v4.8h4.8" stroke="#0b0c10" stroke-width="2.3" stroke-linecap="square" fill="none"/></svg>'
};
function hitMark(kind){ return HM[kind]||''; }
/* damage types as the game names them; icons come from data/dmgicons.js (wiki.gg glyphs) */
const EL_NAME={ballistic:'Ballistic',beam:'Laser',laser:'Laser',arc:'Arc',fire:'Fire',gas:'Gas',explosion:'Explosive',acid:'Acid',melee:'Melee',impact:'Impact',energy:'Energy',stagger:'Stagger',stun:'Stun',bleed:'Bleed',slow:'Slow',confusion:'Confusion',fall:'Fall'};
function elKey(el){ el=String(el||'').toLowerCase(); return el==='beam'?'laser':el; }
function elName(el){ return EL_NAME[String(el||'').toLowerCase()]||''; }
function dmgIcon(el,cls){ const k=elKey(el); const I=window.HD_DMG_ICONS||{}; if(!I[k]) return ''; return `<span class="dmg dmg-${k}${cls?' '+cls:''}" title="${EL_NAME[k]||k} damage">${I[k]}</span>`; }
function hitLegend(){ return `<span class="hm-legend">${HM.full} AP above AV, full damage &middot; ${HM.part} AP equal, 65 percent &middot; ${HM.none} AP below, ricochet</span>`; }

/* the sentence that explains the aim point, straight from its numbers */
function why(st,p){
  if(!p) return '';
  const bits=[];
  bits.push(p.hp? `${n0(p.hp)} HP behind armour value ${p.av}`
                : `runs on the ${n0(st.hp)} HP main pool at armour value ${p.av}`);
  if(p.av===0) bits.push('no armour at all, so anything you carry hurts it');
  else bits.push(`your weapon needs AP ${p.av+1} for full damage, AP ${p.av} for 65 percent`);
  if(p.fatal) bits.push('breaking it kills outright');
  else if(p.main) bits.push(`${Math.round(p.main)} percent of what lands here carries into the ${n0(st.hp)} HP main pool`);
  if(p.dur>=60) bits.push(`${Math.round(p.dur)} percent durable, so rate of fire bleeds off and durable damage (rockets, autocannon, AMR) is what counts`);
  if(p.exdr>=100) bits.push('immune to explosion damage, put rounds in it');
  else if(p.exdr<=25&&p.exdr>0) bits.push('explosions land nearly in full here');
  return bits.map(b=>b.charAt(0).toUpperCase()+b.slice(1)).join('. ')+'.';
}

function partRow(st,p){
  const hp=p.hpm?`<span class="dim">main</span>`:n0(p.hp);
  return `<tr${p.p===st.aim?' class="cur"':''}>
    <td>${esc(p.p)}${p.prep?' <span class="dim">(after armour)</span>':''}</td>
    <td class="num">${hp}</td>
    <td class="num av"><span class="avw">${avBadge(p.av)}<i class="avn ${avClass(p.av)}">${avName(p.av)}</i></span></td>
    <td class="num">${Math.round(p.dur)}%</td>
    <td class="num">${p.main?Math.round(p.main)+'%':'·'}</td>
    <td class="num">${p.fatal?'<b class="yes">Yes</b>':'<span class="dim">No</span>'}</td>
  </tr>`;
}

function topRow(r,i){
  const ic=wicon(r.n,r.slot);
  const t=r.ttk>0?` &middot; ${r.ttk}s`:'';
  return `<li>
    <span class="rk">${i+1}</span>
    <i class="ic"${ic?` style="background-image:url(${ic})"`:''}></i>
    <span class="tx"><b>${esc(r.n)}</b>
      <span>${r.hits} hit${r.hits>1?'s':''} to the ${esc(r.part)}${t}${r.kind==='blast'?' &middot; blast':''}</span></span>
    <span class="sl">${SLOT[r.slot]||r.slot}<i>AP ${r.ap}</i></span>
  </li>`;
}

/* zone map: the render with one pin per hit zone. Pins are placed by the part's name (head high,
   legs low, rear behind), which is a reading of the name, not a measured coordinate; the card says so. */
const ZONE=[[/head|skull|face|eye|brain|mouth|mandible|jaw|antenna|visor|optic|sensor|cockpit|canopy|pilot/i,[50,14]],
  [/jet ?pack|thruster|engine|exhaust|vent|backpack|spore sac|\bsac\b/i,[74,24]],[/wing|fin\b/i,[20,28]],
  [/rear leg|hind leg|back leg/i,[26,84]],[/front leg|fore ?leg|forelimb/i,[62,84]],[/\bleg|foot|feet|knee|hip|tread|wheel|stilt|hoof/i,[44,86]],
  [/abdomen|belly|underside|inner|flesh|glow|weak|soft|rear|\bback\b|butt|tail|hatch|heat ?sink|radiator/i,[70,64]],
  [/arm\b|arms\b|claw|scythe|cannon|gun|launcher|weapon|turret|saw|blade|pincer|shoulder/i,[82,46]],
  [/torso|chest|body|carapace|plate|armor|armour|shell|hull|main|core|shield|front/i,[50,44]]];
function zoneAt(name,i,n){
  for(const [re,xy] of ZONE){ if(re.test(name)) return xy; }
  return [22+((i*37)%56),22+((i*53)%56)];
}
function zoneMap(name,imgSrc){
  const st=E()[name]; if(!st||!imgSrc) return '';
  const parts=st.parts.filter(p=>!/^main$/i.test(p.p)).slice(0,10);
  const used={};
  const Z=(window.HD_ZONES||{})[name]||{}; let mapped=0;
  const REAR=((window.HD_ZONES_REAR||{})[name]||[]);
  const pins=parts.map((p,i)=>{ const zk=Object.keys(Z).find(k=>k===p.p)||Object.keys(Z).find(k=>p.p.startsWith(k.replace(/\s*\(\d+\)$/,''))); let [x,y]=zk?Z[zk]:zoneAt(p.p,i,parts.length); if(zk) mapped++; const k=x+','+y; used[k]=(used[k]||0)+1; if(used[k]>1){ x+=((used[k]%2)?10:-10)*Math.ceil(used[k]/2); y+=6*used[k]; }
    x=Math.max(8,Math.min(92,x)); y=Math.max(8,Math.min(92,y));
    const hot=st.aim===p.p, soft=st.soft===p.p, rear=REAR.indexOf(p.p)>=0;
    return `<button type="button" class="zm-pin ${avClass(p.av)}${hot?' hot':''}${soft?' soft':''}${rear?' rear':''}" style="left:${x}%;top:${y}%" data-i="${i}" aria-label="${esc(p.p)}${rear?', on the far side of the model':''}"><i>${p.av}</i>${rear?'<u>rear</u>':''}</button>`; }).join('');
  const rows=parts.map((p,i)=>`<li class="${st.aim===p.p?'hot':''}" data-i="${i}">${avBadge(p.av)}<span>${esc(p.p)}${REAR.indexOf(p.p)>=0?' <u class="rear-tag">rear</u>':''}</span><em><i class="avn ${avClass(p.av)}">${avName(p.av)}${p.av>0?' armour':''}</i> &middot; ${p.hpm?'main':n0(p.hp||0)} hp${p.dur?` · ${p.dur}% durable`:''}${p.main?` · ${p.main}% to main`:''}${p.fatal?' <u class="ztag fatal">fatal</u>':''}${(!p.av&&(p.dur||0)>=80)?' <u class="ztag squishy">squishy</u>':((p.dur||0)>=60?' <u class="ztag durable">durable</u>':'')}</em></li>`).join('');
  return `<div class="zm" data-zm="${esc(name)}">
    <div class="zm-fig"><img src="${imgSrc}" alt="${esc(name)}" loading="lazy">${pins}${st.aim?`<span class="zm-tag">Put it here: ${esc(st.aim)}</span>`:''}</div>
    <ol class="zm-list">${rows}</ol>
    <p class="zm-note">${mapped>=parts.length?'Pins placed on the render by hand from the wiki anatomy; the numbers are the game\'s.':mapped?'Most pins placed by hand; the rest by name.':'Pins placed by part name, positions indicative.'} The shield is the armour value: blue squishy, grey light, gold medium and heavy, red tank.</p>
  </div>`;
}
document.addEventListener('pointerover',e=>{ const t=e.target.closest('.zm-pin,.zm-list li'); if(!t) return; const zm=t.closest('.zm'); zm.querySelectorAll('.on').forEach(x=>x.classList.remove('on')); zm.querySelectorAll(`[data-i="${t.dataset.i}"]`).forEach(x=>x.classList.add('on')); });
document.addEventListener('click',e=>{ const t=e.target.closest('.zm-pin'); if(!t) return; const zm=t.closest('.zm'); const on=t.classList.contains('lock'); zm.querySelectorAll('.lock,.on').forEach(x=>x.classList.remove('lock','on')); if(!on) zm.querySelectorAll(`[data-i="${t.dataset.i}"]`).forEach(x=>x.classList.add('on','lock')); });

/* the data carries a best-stratagem answer for every enemy; show it beside the
   weapon answers so the card covers both halves of a loadout */
function stratRow(sr){
  if(!sr) return '';
  /* core.js already owns this: real in-game icon when we have it, community SVG otherwise */
  const ic=(typeof window.stratIcon==='function') ? window.stratIcon(sr.ic) : '';
  const where=sr.part&&!/^main$/i.test(sr.part)?` to the ${esc(sr.part)}`:'';
  return `<div class="es-h"><i>Best stratagem</i><span>when a gun is not enough</span></div>
    <div class="es-strat">
      ${ic?`<img src="${ic}" alt="" onerror="this.remove()">`:''}
      <div><b>${esc(sr.n)}</b><span>${sr.hits} ${sr.hits===1?'hit':'hits'}${where}${sr.cd?` &middot; ${sr.cd} s cooldown`:''}</span></div>
      <a class="btn sm ghost" href="stratagems.html?q=${encodeURIComponent(sr.n)}">Code</a>
    </div>`;
}
function enemyBlock(name){
  const st=E()[name];
  if(!st) return `<p class="es-none">No anatomy published for this one yet. Everything else on this card is sourced; the numbers are not, so they are left out rather than guessed.</p>`;
  const aim=st.parts.find(p=>p.p===st.aim);
  const soft=(st.soft&&st.soft!==st.aim)?st.parts.find(p=>p.p===st.soft):null;
  const heaviest=Math.max.apply(null,st.parts.map(p=>p.av));
  const top=st.top.slice(0,5);
  const gren=st.top.find(r=>r.slot==='GRENADE');
  const extra=(gren&&top.indexOf(gren)<0)?gren:null;
  return `<div class="es">
    <div class="es-strip">
      <div><b>${n0(st.hp)}</b><span>Main health</span></div>
      <div><b class="avb">${avBadge(heaviest,'big')}</b><span>Heaviest armour &middot; ${avName(heaviest)}</span></div>
      ${st.fire?`<div><b>${dmgIcon('fire')}${st.fire}&times;</b><span>Fire damage</span></div>`:''}
      ${st.stag?`<div><b>${n0(st.stag)}</b><span>Stagger to flinch</span></div>`:''}
      <div><b>${st.parts.length}</b><span>Hit zones</span></div>
    </div>
    ${aim?`<div class="es-aim"><i>Put it here</i><b>${esc(aim.p)}</b><p>${why(st,aim)}</p>
      ${soft?`<p class="es-soft"><i>Softer option</i> ${esc(soft.p)}: ${why(st,soft)}</p>`:''}</div>`:''}
    <div class="es-h"><i>Top five answers</i><span>fewest hits, then time and ammo</span></div>
    <ol class="es-top">${top.map(topRow).join('')}</ol>
    ${extra?`<div class="es-h"><i>Best throwable</i><span>ranked ${st.top.indexOf(extra)+1} overall once ammo is counted</span></div><ol class="es-top one">${topRow(extra,st.top.indexOf(extra))}</ol>`:''}
    ${stratRow(st.strat)}
    ${zoneMap(name,eicon(name))}
    <details class="es-an">
      <summary>Every hit zone: ${st.parts.length} parts, armour value and health</summary>
      <div class="es-tw"><table class="es-tbl">
        <thead><tr><th>Part</th><th class="num">HP</th><th class="num">AV</th><th class="num">Durable</th><th class="num">To main</th><th class="num">Fatal</th></tr></thead>
        <tbody>${st.parts.map(p=>partRow(st,p)).join('')}</tbody>
      </table></div>
      <p class="es-note">Armour value is the floor your armour penetration must beat: AP above AV deals full damage, AP equal to AV deals 65 percent, AP below AV ricochets. Durable is the share of a part that only takes a weapon's durable damage number. To main is how much of what you land there bleeds into the main pool.</p>
    </details>
  </div>`;
}

function weaponBlock(full){
  const key=Object.keys(W()).find(k=>{
    const w=W()[k];
    return w.full===full||w.n===full||k===String(full).toUpperCase();
  });
  const w=key?W()[key]:null;
  if(!w) return `<p class="es-none">No damage numbers published for this one. The wiki's extracted attack data has no record for it, so nothing is shown rather than guessed.</p>`;
  const rate=w.rate?(w.kind==='beam'?`${w.rate} ticks/min`:`${n0(w.rate)} rpm`):'·';
  const vs=w.vs.slice(0,5);
  return `<div class="es ws">
    <div class="es-strip six">
      <div><b>${dmgIcon(w.el)}${n0(w.dmg)}</b><span>${elName(w.el)?elName(w.el)+' damage':'Damage'}</span></div>
      <div><b>${n0(w.dur)}</b><span>Durable</span></div>
      <div><b class="avb">${apBadge(w.ap,'big')}</b><span>Penetration &middot; ${apName(w.ap)}</span></div>
      <div><b>${rate}</b><span>Rate</span></div>
      <div><b>${n0(w.mag)}</b><span>Per mag</span></div>
      <div><b>${n0(w.carry)}</b><span>Carried</span></div>
    </div>
    <div class="es-strip six sub">
      ${w.demo?`<div><b>${n0(w.demo)}</b><span>Demolition</span></div>`:''}
      ${w.stun?`<div><b>${n0(w.stun)}</b><span>Stun</span></div>`:''}
      ${w.push?`<div><b>${n0(w.push)}</b><span>Push</span></div>`:''}
      ${w.pel>1?`<div><b>${w.pel}</b><span>Pellets</span></div>`:''}
      ${w.chg?`<div><b>${w.chg}s</b><span>Charge</span></div>`:''}
      ${w.reload?`<div><b>${w.reload}s</b><span>Reload</span></div>`:''}
      ${w.x?`<div><b>${n0(w.x.dmg)}</b><span>Blast &middot; AP ${w.x.ap}</span></div>`:''}
      ${w.x&&w.x.r2?`<div><b>${w.x.r2} m</b><span>Blast radius</span></div>`:''}
    </div>
    <div class="es-h"><i>Best used against</i><span>fewest hits for the ammo</span></div>
    <ol class="es-top vs">${vs.map((v,i)=>{
      const ic=eicon(v.e);
      const th=v.thr?`<span class="thr">${[1,2,3,4,5].map(k=>`<b class="${k<=v.thr?'f':''}"></b>`).join('')}</span>`:'';
      return `<li><span class="rk">${i+1}</span><i class="ic"${ic?` style="background-image:url(${ic})"`:''}></i>
        <span class="tx"><b>${esc(v.e)}</b><span>${v.hits} hit${v.hits>1?'s':''} to the ${esc(v.part)}${v.ttk>0?` &middot; ${v.ttk}s`:''}</span></span>${th}</li>`;
    }).join('')}</ol>
    <p class="es-note">Hits are computed from the game's damage rules against every published hit zone: AP above AV full damage, AP equal 65 percent, below ricochets, durable share applied, damage carried to the main pool where the part allows it.</p>
  </div>`;
}


function stratBlock(name){
  const S=window.HD_SSTATS||{};
  const nm=String(name), bare=nm.replace(/^[A-Z0-9\/.-]+\s+/,'');   /* "A/G-16 Gatling Sentry" -> "Gatling Sentry" */
  const key=Object.keys(S).find(k=>k===nm.toUpperCase()||S[k].n===nm||S[k].full===nm||S[k].n===bare||k===bare.toUpperCase());
  let w=key?S[key]:null;
  if(!w){
    /* support-weapon stratagems (Autocannon, Recoilless, sentries' guns) carry their numbers
       on the weapon side, so fall back to that record rather than showing nothing */
    const W=window.HD_WSTATS||{};
    const wk=Object.keys(W).find(k=>k===String(name).toUpperCase()||W[k].n===name||W[k].full===name);
    if(wk){ const x=W[wk]; w={dmg:x.dmg,ap:x.ap,cd:null,x:x.x,vs:x.vs}; }
  }
  if(!w) return '';
  const x=w.x||{};
  const vs=(w.vs||[]).slice(0,3);
  return `<div class="sgx">
    <div class="sgx-row">
      <span><b>${dmgIcon(w.el)}${n0(w.dmg)}</b><i>${elName(w.el)||'Damage'}</i></span>
      <span>${apBadge(w.ap)}<i>Pen ${w.ap}</i></span>
      ${x.r2?`<span><b>${Math.round(x.r2*10)/10} m</b><i>Blast</i></span>`:''}
      ${w.rate?`<span><b>${n0(w.rate)}</b><i>${w.kind==='beam'?'Ticks/min':'RPM'}</i></span>`:''}
      ${w.mag>1?`<span><b>${n0(w.mag)}</b><i>Rounds</i></span>`:''}
      ${w.cd?`<span><b>${w.cd}s</b><i>Cooldown</i></span>`:''}
    </div>
    ${vs.length?`<div class="sgx-vs">${vs.map(v=>`<em>${esc(v.e)}<u>${v.hits}${v.k==='flame'?' s':'&times;'}</u></em>`).join('')}</div>`:''}
  </div>`;
}

/* where an item comes from, as a badge: the warbond's cover, the Super Store, the Patriotic Administration Center */
const SRC_ICON={store:['assets/img/ui/super-credits.svg','Super Store'],pac:['assets/img/ui/requisition.svg','Patriotic Administration Center'],bay:['assets/img/strat/resupply.webp','Engineering Bay'],reward:['assets/img/ui/medal.svg','Major Order reward'],poi:['assets/img/obj/radar.svg','Point of interest'],deft:['assets/img/brand/skull.webp','Standard issue'],edition:['assets/img/brand/super-earth-emblem.svg','Super Citizen and pre-order'],collab:['assets/img/brand/seaf.webp','Killzone collaboration'],event:['assets/img/ui/medal.svg','Liberty Day 2184 event']};
function srcBadge(text,itemName){
  const WB=window.HD_WARBONDS_FULL||[]; const covers=(window.HD_IMG&&window.HD_IMG.warbonds)||{};
  const t=String(text||'').toLowerCase(); let wb=null;
  if(itemName&&!t){ const n=String(itemName).toLowerCase(); wb=WB.find(b=>(b.pages||[]).some(p=>(p.items||[]).some(i=>String(i.n||'').toLowerCase()===n||n.endsWith(String(i.n||'').toLowerCase())))); }
  if(!wb&&t) wb=WB.find(b=>t.includes(b.n.toLowerCase()));
  if(wb){ const slug=wb.n.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/ /g,'-'); const cover=wb.cover||(covers[wb.n]?'assets/img/warbonds/'+covers[wb.n]:'');
    return `<a class="src-badge" href="warbonds.html#wb-${slug}" title="${esc(wb.n)}">${cover?`<img src="${cover}" alt="">`:''}<span><i>Warbond</i><b>${esc(wb.n)}</b></span></a>`; }
  let k=/killzone|collaboration/.test(t)?'collab':/liberty day/.test(t)?'event':/superstore|super store/.test(t)?'store':/patriotic|administration/.test(t)?'pac':/engineering bay/.test(t)?'bay':/reward|operation|major order/.test(t)?'reward':/point of interest|points of interest/.test(t)?'poi':/default|standard issue|super citizen/.test(t)?'deft':null;
  if(!k&&itemName&&!t){ const n=String(itemName).toUpperCase(); k=/^B-0[01#]? TACTICAL/.test(n)?'deft':/^(TR-7|TR-9|TR-62|DP-53|SA-12)\b/.test(n)?'edition':'store'; }   /* armour outside every warbond: standard issue, the Super Citizen and pre-order sets, else the Super Store rotation */
  if(!k) return '';
  return `<span class="src-badge plain"><img src="${SRC_ICON[k][0]}" alt=""><span><i>Source</i><b>${SRC_ICON[k][1]}</b></span></span>`;
}
window.HD_STATS={enemyBlock,weaponBlock,stratBlock,wicon,eicon,why,zoneMap,srcBadge,avClass,avName,apName,avBadge,apBadge,hitMark,hitLegend,dmgIcon,elName};
})();
