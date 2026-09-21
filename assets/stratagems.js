/* ============ STRATAGEM CODEX ============ */
(function(){
'use strict';
const {$,$$}=window.HD;
const S=window.HD_STRATAGEMS||[];
const grid=$('#grid'), none=$('#none'), qEl=$('#q'), res=$('#resCount');
let group='all', q='';

$('#cAll').textContent='('+S.length+')';

function kindTag(s){
  const n=s.n.toLowerCase(), f=s.full.toLowerCase(), out=[];
  if(/sentry|tower|emplacement|battlement|relay/.test(n)) out.push(chip(KINDG.turret,'Turret / emplacement'));
  if(/mine/.test(n)) out.push(chip(KINDG.mine,'Minefield'));
  if(/exosuit|vehicle|bastion/.test(n)) out.push(chip(KINDG.vehicle,'Vehicle'));
  if(/pack|shield|guard dog|hellbomb/.test(n)&&s.cat==='BACKPACK') out.push(chip(KINDG.pack,'Backpack slot'));
  if(/expendable|leveller|commando|napalm/.test(n)&&s.cat==='SUPPORT WEAPON') out.push(chip(KINDG.expend,'Expendable'));
  if(/anti-tank|recoilless|spear|quasar|railgun|500kg|railcannon|precision|leveller|commando|expendable/.test(n)) out.push(chip(KINDG.at,'Heavy kill'));
  if(/gatling|cluster|napalm|gas|airburst|strafing|walking|120mm|380mm|flame|arc|stalwart|machine gun|mortar/.test(n)) out.push(chip(KINDG.horde,'Horde clear'));
  if(/barrage|gas|smoke|ems|mine|napalm|laser/.test(n)) out.push(chip(KINDG.area,'Area denial'));
  if(s.c.length>=7) out.push(chip(KINDG.long,'Long code'));
  return out.join('');
}

/* type as a symbol: a small glyph chip in the category colour, the way the game marks stratagem families */
const CATG={
 ORBITAL:'<path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 12h17M12 3.5c-3 3-3 14 0 17M12 3.5c3 3 3 14 0 17" fill="none" stroke="currentColor" stroke-width="1.4"/>',
 EAGLE:'<path d="M12 5 3 12l5 .6L12 19l4-6.4 5-.6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 5v14" stroke="currentColor" stroke-width="1.4"/>',
 'SUPPORT WEAPON':'<path d="M2.6 13.4h10.2l1.6-3H21.4v3.1h-2.3l-1.3 4.4H9.6v-2.5H2.6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
 BACKPACK:'<rect x="6" y="6.5" width="12" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 6.5V4.5h6v2M6 12h12" stroke="currentColor" stroke-width="1.6"/>',
 DEFENSIVE:'<path d="M5 20V9l7-5 7 5v11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 20v-6h6v6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
 MISSION:'<path d="M6 21V4h11l-2.5 4 2.5 4H6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
 VEHICLE:'<path d="M3 15h18l-2-5H8l-5 5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7.5" cy="17.5" r="1.8" fill="currentColor"/><circle cx="16.5" cy="17.5" r="1.8" fill="currentColor"/>'
};
const KINDG={
 turret:'<path d="M4 20h16M7 20v-5h10v5M12 15V8l5-3v3l-5 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
 mine:'<circle cx="12" cy="13" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 4v3M4 13h3M17 13h3M6.5 7.5l2 2M17.5 7.5l-2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
 vehicle:CATG.VEHICLE,
 pack:CATG.BACKPACK,
 expend:'<path d="M4 12h12l4-3v6l-4-3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M4 9v6" stroke="currentColor" stroke-width="1.7"/>',
 at:'<path d="M3 12h9M14 8l6 4-6 4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
 horde:'<circle cx="7" cy="9" r="2" fill="currentColor"/><circle cx="12" cy="9" r="2" fill="currentColor"/><circle cx="17" cy="9" r="2" fill="currentColor"/><circle cx="9.5" cy="15" r="2" fill="currentColor"/><circle cx="14.5" cy="15" r="2" fill="currentColor"/>',
 area:'<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 3"/>',
 kill:'<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" stroke-width="1.7"/>',
 long:'<path d="M4 8h16M4 12h16M4 16h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
 fast:'<path d="M13 3 5 14h6l-1 7 8-11h-6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
 drawn:'<path d="M4 20l4-1 11-11-3-3L5 16Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
};
const chip=(g,label,cls)=>`<span class="tchip ${cls||''}" title="${label}"><svg viewBox="0 0 24 24" aria-hidden="true">${g}</svg><i>${label}</i></span>`;
function catChip(s){ return chip(CATG[s.cat]||CATG.MISSION, s.cat.charAt(0)+s.cat.slice(1).toLowerCase(), 'g-'+s.g); }

function card(s,i){
  const st=window.HD_STATS?window.HD_STATS.stratBlock(s.full||s.n):'';
  return `<button class="card sg g-${s.g}" data-i="${i}">
    <div class="sg-h"><img src="${window.stratIcon(s.ic)}" alt="" loading="lazy">
      <div><h3>${s.n}</h3>${catChip(s)}</div></div>
    ${window.arrowRow(s.c)}
    <div class="sg-f"><span>CD ${s.cd||'·'}</span><span>${s.u||''}</span></div>
    ${st}
    <div class="card-meta sg-kinds" style="margin-top:0">${(window.HD_IMG&&window.HD_IMG.strat&&window.HD_IMG.strat[s.ic])?'':chip(KINDG.drawn,'Drawn icon')}${kindTag(s)}${s.act&&s.act!=='N/A'?chip(KINDG.fast,'Call-in '+s.act):''}</div>
  </button>`;
}
function render(){
  const t=q.trim().toUpperCase();
  const list=S.map((s,i)=>({s,i})).filter(({s})=>{
    if(group!=='all' && s.g!==group) return false;
    if(!t) return true;
    return s.n.toUpperCase().includes(t) || s.full.toUpperCase().includes(t) ||
           s.c.includes(t) || s.cat.includes(t);
  });
  grid.innerHTML=list.map(({s,i})=>card(s,i)).join('');
  none.classList.toggle('hide',!!list.length);
  res.textContent=list.length+' of '+S.length+' shown';
}
$$('.chip[data-g]').forEach(b=>b.addEventListener('click',()=>{
  $$('.chip[data-g]').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); group=b.dataset.g; render();
}));
qEl.addEventListener('input',()=>{q=qEl.value;render();});

/* prefill from ?q= */
const pre=new URLSearchParams(location.search).get('q');
if(pre){ qEl.value=pre; q=pre; }
render();

/* ---------- drill modal ---------- */
const M=$('#drill'), dIcon=$('#dIcon'), dName=$('#dName'), dCat=$('#dCat'),
      dArr=$('#dArrows'), dMsg=$('#dMsg'), dStreak=$('#dStreak'), dBest=$('#dBest'), dReps=$('#dReps'),
      dStats=$('#dStats'), dTitle=$('#dTitle'), dPad=$('#dPad'), dArm=$('#dArm');
let cur=null,pos=0,streak=0,open=false,armed=false,t0=0;
/* per-code record on this device: practices completed and best time from first input to accepted.
   There is no account server, so the record lives in this browser and travels with the profile export. */
const STK='hd_drill_stats';
const readStats=()=>{ try{ return JSON.parse(localStorage.getItem(STK)||'{}'); }catch(e){ return {}; } };
const writeStats=o=>{ try{ localStorage.setItem(STK,JSON.stringify(o)); }catch(e){} };
const fmtMs=ms=>ms?(ms/1000).toFixed(2)+'s':'·';
function paintRecord(){
  const r=readStats()[cur.n]||{n:0,best:0};
  dBest.textContent=fmtMs(r.best); dReps.textContent=r.n;
}
function draw(){
  dArr.innerHTML=cur.c.split('').map((d,i)=>window.arrowSVG(d,i<pos?'hit':'wait')).join('');
}
function load(s){
  cur=s; pos=0; t0=0;
  dIcon.src=window.stratIcon(s.ic);
  dName.textContent=s.n; dCat.textContent=s.cat;
  dTitle.textContent=s.full;
  dStats.innerHTML=[['Category',s.cat],['Cooldown',s.cd||'·'],['Uses',s.u||'·'],['Call-in',s.act||'·'],['Code',s.c]]
    .map(r=>`<div class="srow"><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('');
  draw(); paintRecord();
}
function setArmed(on){
  armed=on; M.classList.toggle('armed',on); dArm.setAttribute('aria-pressed',String(on));
  dArm.textContent=on?'Stratagem out':'Take out stratagem';
  if(on){ dMsg.textContent='Input the code'; window.HDSFX.wake(); }
  else if(pos>0){ pos=0; t0=0; draw(); dMsg.textContent='Released. Hold '+holdLabel()+' and start again'; }
  else dMsg.textContent='Hold '+holdLabel()+', or take out the stratagem';
}
function input(d){
  if(!cur||!open)return;
  if(!armed){ dMsg.textContent='Hold '+holdLabel()+' first, as in the field'; window.HDSFX.bad(); return; }
  if(cur.c[pos]===d){
    if(pos===0) t0=performance.now();
    pos++; draw(); window.HDSFX.dir(d);
    if(pos>=cur.c.length){
      const ms=Math.round(performance.now()-t0);
      streak++; dStreak.textContent=streak;
      const all=readStats(); const r=all[cur.n]||{n:0,best:0};
      r.n++; if(!r.best||ms<r.best) r.best=ms; all[cur.n]=r; writeStats(all); paintRecord();
      window.HDSFX.ok();
      dMsg.textContent='STRATAGEM ACCEPTED · '+fmtMs(ms); dMsg.classList.add('sh-perfect');
      setTimeout(()=>{dMsg.classList.remove('sh-perfect');dMsg.textContent=armed?'Again':'Hold '+holdLabel()+', or take out the stratagem';pos=0;t0=0;draw();},700);
    }
  }else{
    pos=0; t0=0; draw(); streak=0; dStreak.textContent=0; window.HDSFX.bad();
    dMsg.textContent='INPUT REJECTED';
    M.querySelector('.sh-stage').classList.add('shake');
    setTimeout(()=>M.querySelector('.sh-stage').classList.remove('shake'),300);
  }
}
function show(s){ stopPlay(); load(s); streak=0; dStreak.textContent=0; setArmed(false); M.classList.add('on'); open=true; }
function hide(){ M.classList.remove('on'); open=false; hold.release(); setArmed(false); }
grid.addEventListener('click',e=>{
  const b=e.target.closest('.sg'); if(!b)return;
  show(S[+b.dataset.i]);
});
/* hover: the code plays through with the real input beeps */
let hoverTimer=null, hoverCard=null;
function stopPlay(){ clearTimeout(hoverTimer); if(hoverCard){ hoverCard.querySelectorAll('.arw').forEach(a=>a.classList.remove('play')); hoverCard=null; } }
grid.addEventListener('pointerover',e=>{
  const b=e.target.closest('.sg'); if(!b||b===hoverCard||matchMedia('(hover:none)').matches)return;
  stopPlay(); hoverCard=b;
  const arws=[...b.querySelectorAll('.arw')]; let i=0;
  const step=()=>{ if(hoverCard!==b)return;
    if(i>0) arws[i-1].classList.remove('play');
    if(i>=arws.length){ hoverTimer=setTimeout(()=>{ arws.forEach(a=>a.classList.remove('play')); i=0; hoverTimer=setTimeout(step,700); },260); return; }
    arws[i].classList.add('play'); window.HDSFX.dir(arws[i].dataset.d); i++; hoverTimer=setTimeout(step,170); };
  hoverTimer=setTimeout(step,120);
});
grid.addEventListener('pointerout',e=>{ const b=e.target.closest('.sg'); if(b&&b===hoverCard&&!b.contains(e.relatedTarget)) stopPlay(); });
$('#drillX').addEventListener('click',hide);
M.addEventListener('click',e=>{ if(e.target===M) hide(); });
$('#randomBtn').addEventListener('click',()=>show(S[(Math.random()*S.length)|0]));

/* the game's rule: the code only goes in while the stratagem menu is held open (Ctrl on PC).
   Keyboard: hold Ctrl. Touch: the Take out stratagem button holds it open until you put it away. */
const hold=window.HD.hold({when:()=>open,btn:dArm,on:setArmed});
const holdLabel=()=>hold.label();
const KEY={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',w:'U',a:'L',s:'D',d:'R',W:'U',A:'L',S:'D',D:'R'};
addEventListener('keydown',e=>{
  if(e.key==='Escape'){hide();return;}
  if(!open)return;
  const k=KEY[e.key]; if(!k)return;
  if(e.target&&e.target.matches&&e.target.matches('input,select,textarea'))return;
  e.preventDefault(); input(k);
});
dPad.innerHTML=[['u','U'],['l','L'],['r','R'],['d','D']].map(x=>{
  const g=window.arrowSVG(x[1]);
  return `<button class="${x[0]}" data-d="${x[1]}" aria-label="${x[1]}">${g.replace(/^<span[^>]*>/,'').replace(/<\/span>$/,'')}</button>`;
}).join('');
dPad.addEventListener('click',e=>{const b=e.target.closest('button'); if(b)input(b.dataset.d);});

/* deep links: ?q=NAME&drill=1 opens the drill on the first match, ?random=1 opens a random code */
(function deeplink(){
  const sp=new URLSearchParams(location.search);
  let target=null;
  if(sp.get('random')==='1'){ target=S[(Math.random()*S.length)|0]; }
  else if(sp.get('drill')==='1'&&pre){ const t=pre.toUpperCase(); target=S.find(x=>x.n.toUpperCase()===t)||S.find(x=>x.n.toUpperCase().includes(t)||x.full.toUpperCase().includes(t)); }
  if(target) setTimeout(()=>show(target),320);
})();
})();
