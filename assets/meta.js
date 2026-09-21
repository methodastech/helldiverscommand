/* ============ META + LOADOUT BUILDER ============ */
(function(){
'use strict';
const {$,$$}=window.HD;
const W=window.HD_WEAPONS||[], S=window.HD_STRATAGEMS||[], B=window.HD_BOOSTERS||[];
const TORD={S:0,A:1,B:2,C:3}, ROW=['S','A','B','C'];
const SLOTTAG={PRIMARY:'PRI',SECONDARY:'SEC',SUPPORT:'SUP'};
const TCOL={S:'var(--gold)',A:'var(--green)',B:'#5A6473',C:'#2C333E',D:'#171b21'};

/* ---------- tier list ----------
   Tiers come from data/stats.js: points out of 1000 for the overall board, the computed 1-5
   faction rating for the faction boards. The editorial tier in weapons.js is only the fallback. */
let tf='all';
const ROW5=['S','A','B','C','D'];
const ST=()=>window.HD_WSTATS||{};
function statOf(w){ const W_=ST(); const k=Object.keys(W_).find(k=>W_[k].full===(w.full||w.n)||W_[k].n===w.n); return k?W_[k]:null; }
function tierOf(w){
  const st=statOf(w);
  if(tf==='all') return (st&&st.ptier)||w.tier||'C';
  const v=st&&st.fac?st.fac[tf]:w[tf];        // 1-5 rating vs that faction
  return v>=5?'S':v>=4?'A':v>=3?'B':v>=2?'C':'D';
}
/* Score model, mirrored from tools/pipeline/build_stats.py so the breakdown bars
   show each component against its real ceiling. Components are scaled 0..1 across
   the weapons in the SAME slot, then weighted. Tiers cut at 720 / 600 / 470 / 340. */
const SCORE_W={GRENADE:{roster:450,heavy:200,chaff:150,dps:0,pen:50,ammo:100,control:50},
  PRIMARY:{roster:450,heavy:80,chaff:120,dps:150,pen:50,ammo:100,control:50},
  SECONDARY:{roster:450,heavy:100,chaff:120,dps:130,pen:50,ammo:100,control:50},
  SUPPORT:{roster:450,heavy:150,chaff:80,dps:150,pen:50,ammo:70,control:50}};
const SCORE_LBL={roster:'Roster',heavy:'Heavy kills',chaff:'Chaff',dps:'DPS',pen:'Penetration',ammo:'Ammo',control:'Control'};
function scoreBars(st){
  if(!st||!st.parts) return '';
  const W_=SCORE_W[st.slot]||SCORE_W.PRIMARY;
  const rows=Object.keys(SCORE_LBL).filter(k=>W_[k]>0).map(k=>{
    const got=Math.round(st.parts[k]||0), max=W_[k], pc=Math.max(0,Math.min(100,got/max*100));
    return `<div class="sbar"><i>${SCORE_LBL[k]}</i><u><b style="width:${pc}%"></b></u><em>${got}<s>/${max}</s></em></div>`;
  }).join('');
  /* 43 weapons are blended 70/30 with a published community consensus, so the model
     parts sum below the score. Show both numbers rather than leaving them not adding up. */
  const model=Math.round(Object.values(st.parts).reduce((a,c)=>a+c,0));
  const blended=st.pts!=null&&Math.abs(model-st.pts)>2;
  const foot=`<div class="sbar sfoot"><i>Model</i><u></u><em>${model}</em></div>`+
    (blended?`<div class="sbar sfoot on"><i>Blended 70/30</i><u></u><em>${st.pts}</em></div>`:'');
  return '<div class="sbars">'+rows+foot+'</div>';
}
function tiers(){
  const box=$('#tiers'); if(!box)return;
  const groups={S:[],A:[],B:[],C:[],D:[]};
  W.forEach(w=>groups[tierOf(w)].push(w));
  box.innerHTML=ROW5.map(t=>{
    const list=groups[t].slice().sort((a,b)=>{ const sa=statOf(a),sb=statOf(b); return ((sb&&sb.pts)||0)-((sa&&sa.pts)||0)||a.n.localeCompare(b.n); });
    if(!list.length) return '';
    return `<div class="tierrow tier-${t}">
      <div class="tierlab" style="background:${TCOL[t]||'#1b2027'};color:${t==='S'||t==='A'?'#000':'#fff'}">${t}<i>${list.length}</i></div>
      <div class="tieritems">${list.map((w,ri)=>{ const st=statOf(w);
        const IMG=(window.HD_IMG&&window.HD_IMG.weapons&&window.HD_IMG.weapons[w.n])?'assets/img/weapons/'+window.HD_IMG.weapons[w.n]:'';
        const v=st&&st.fac&&tf!=='all'?st.fac[tf]:null;
        const why=(st&&st.why)||w.verdict||'';
        const fac=st&&st.fac?`Bugs ${st.fac.b}/5 &middot; Bots ${st.fac.a}/5 &middot; Squids ${st.fac.i}/5`:'';
        return `<a class="titem" href="arsenal.html?q=${encodeURIComponent(w.n)}">
           <span class="trank">${t}${ri+1}</span>
           <u${IMG?` style="background-image:url(${IMG})"`:''}></u><span><b>${w.n}</b><i>${SLOTTAG[w.slot]||''}${st?` · ${st.pts}`:''}${v?` · ${v}/5`:''}</i></span>
           <div class="ttip"><b>${w.n}<s class="tt-rank">${t}${ri+1}</s></b><em>${w.full||w.slot}</em><p>${why}</p>
             ${scoreBars(st)}
             <span class="ttip-n">${st&&st.pts!=null?st.pts+' / 1000 &middot; '+t+' rank '+(ri+1)+' of '+list.length:'Not ranked'}${fac?' &middot; '+fac:''}</span></div></a>`; }).join('')}</div>
    </div>`;
  }).join('');
}
$$('.chip[data-tf]').forEach(b=>b.addEventListener('click',()=>{
  $$('.chip[data-tf]').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); tf=b.dataset.tf; tiers();
}));
tiers();

/* ---------- loadouts ---------- */
function sIcon(name){
  const s=S.find(x=>x.n.toLowerCase()===name.toLowerCase())
       || S.find(x=>x.n.toLowerCase().includes(name.toLowerCase()))
       || S.find(x=>name.toLowerCase().includes(x.n.toLowerCase()));
  return s||{ic:'reinforce',n:name,c:''};
}
function kitImg(kind,name){
  const R=(window.HD_IMG&&window.HD_IMG[kind])||{}; const n=String(name).toLowerCase();
  const key=R[name]?name:Object.keys(R).find(k=>n.endsWith(k.toLowerCase()))||Object.keys(R).find(k=>n.includes(k.toLowerCase()));
  return key?`<em class="ld-th"><img src="assets/img/${kind}/${R[key]}" alt="" loading="lazy"></em>`:'<em class="ld-th"></em>';
}
function ldCard(l){
  const f=(window.HD_FACTIONS||[]).find(x=>x.k===l.f)||{colour:'#FFE01B',name:''};
  return `<article class="panel ld rv" data-lf="${l.f}">
    <div class="ld-h"><div><h3 style="color:${f.colour}">${l.name}</h3><span class="role">${f.name} &middot; ${l.role}</span></div>
    <span class="pill hot">${l.f.toUpperCase()}</span></div>
    <div class="ld-kit">
      <div><i>Primary</i>${kitImg('weapons',l.primary)}<span>${l.primary}</span></div>
      <div><i>Secondary</i>${kitImg('weapons',l.secondary)}<span>${l.secondary}</span></div>
      <div><i>Grenade</i>${kitImg('grenades',l.grenade)}<span>${l.grenade}</span></div>
      <div><i>Booster</i>${kitImg('boosters',l.booster)}<span>${l.booster}</span></div>
    </div>
    <div class="ld-str">${l.strat.map(n=>{const i=sIcon(n);
      return `<a href="stratagems.html?q=${encodeURIComponent(i.n)}"><img loading="lazy" src="${window.stratIcon(i.ic)}" alt=""><em>${n}</em>
        ${i.c?`<span class="mono" style="margin-left:auto;color:var(--gold);font-size:12px">${i.c}</span>`:''}</a>`;}).join('')}</div>
    <p class="ld-why">${l.why}</p>
  </article>`;
}
const lw=$('#loadouts');
if(lw){
  lw.innerHTML=(window.HD_LOADOUTS||[]).map(ldCard).join('');
  $$('.chip[data-lf]').forEach(b=>b.addEventListener('click',()=>{
    $$('.chip[data-lf]').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    const f=b.dataset.lf;
    $$('.ld',lw).forEach(c=>c.classList.toggle('hide', f!=='all' && c.dataset.lf!==f));
  }));
}

/* ---------- builder ---------- */
const GRENADES=[
 {n:'G-12 High Explosive',tags:['aoe'],b:3,a:3,i:3},
 {n:'G-6 Frag',tags:['aoe'],b:3,a:2,i:3},
 {n:'G-16 Impact',tags:['aoe','burst'],b:4,a:4,i:4},
 {n:'G-10 Incendiary',tags:['aoe','fire'],b:5,a:1,i:4},
 {n:'G-123 Thermite',tags:['at'],b:5,a:5,i:5},
 {n:'G-23 Stun',tags:['cc'],b:4,a:4,i:5},
 {n:'G-4 Gas',tags:['cc','aoe'],b:4,a:2,i:5},
 {n:'G-13 Incendiary Impact',tags:['aoe','fire'],b:5,a:1,i:4},
 {n:'G-3 Smoke',tags:['cc'],b:2,a:4,i:2},
 {n:'K-2 Throwing Knife',tags:['single'],b:2,a:2,i:3}
];
function opt(v,label){return `<option value="${v}">${label}</option>`;}
function fill(id,items,map){
  const s=$(id); if(!s)return;
  s.innerHTML=items.map(map).join('');
}
const prim=W.filter(w=>w.slot==='PRIMARY').sort((a,b)=>a.n.localeCompare(b.n));
const sec =W.filter(w=>w.slot==='SECONDARY').sort((a,b)=>a.n.localeCompare(b.n));
fill('#bPrim',prim,w=>opt(w.n,w.n+'  ['+w.tier+']'));
fill('#bSec',sec,w=>opt(w.n,w.n+'  ['+w.tier+']'));
fill('#bGren',GRENADES,g=>opt(g.n,g.n));
fill('#bBoost',B,b=>opt(b.n,b.n));
const stratSorted=S.slice().sort((a,b)=>a.cat.localeCompare(b.cat)||a.n.localeCompare(b.n));
['#bS1','#bS2','#bS3','#bS4'].forEach((id,i)=>{
  fill(id,stratSorted,s=>opt(s.n,s.cat+' · '+s.n));
  const el=$(id); if(el) el.selectedIndex=Math.min(stratSorted.length-1, i*7+3);
});

/* what a stratagem answers */
function roles(name){
  const n=name.toLowerCase(), r=new Set();
  if(/eagle|orbital|barrage|strike|bomb|laser|railcannon|napalm|hellbomb|500kg|cluster|rocket pods/.test(n)) r.add('offensive');
  if(/railcannon|500kg|recoilless|quasar|spear|expendable anti-tank|leveller|autocannon|commando|meltagun|anti-tank emplacement|w\.a\.s\.p|epoch|110mm/.test(n)) r.add('at');
  if(/machine gun|stalwart|gatling|flamethrower|arc thrower|grenade launcher|sterilizer|guard dog|maxigun|bullet storm|cremator|napalm|incendiary|gas|de-escalator|belt-fed/.test(n)) r.add('horde');
  if(/sentry|emplacement|mines|minefield|tesla|battlement|shield generator relay/.test(n)) r.add('static');
  if(/supply pack|shield generator pack|jump pack|hover pack|ballistic|directional|guard dog|portable hellbomb/.test(n)) r.add('backpack');
  if(/ems|smoke|stun|gas|sterilizer|arc/.test(n)) r.add('cc');
  if(/machine gun$|stalwart|autocannon$|laser cannon|flamethrower|arc thrower|railgun|recoilless|quasar|spear|grenade launcher|anti-materiel|commando|expendable|heavy machine gun|sterilizer|meltagun|maxigun|epoch|w\.a\.s\.p|de-escalator|leveller|speargun|cremator|bullet storm|belt-fed|one true flag|breaching hammer|defoliation/.test(n)) r.add('support');
  return r;
}
function build(){
  const fac=$('#bFac').value;
  const p=prim.find(w=>w.n===$('#bPrim').value)||prim[0];
  const s2=sec.find(w=>w.n===$('#bSec').value)||sec[0];
  const g=GRENADES.find(x=>x.n===$('#bGren').value)||GRENADES[0];
  const picks=['#bS1','#bS2','#bS3','#bS4'].map(id=>S.find(x=>x.n===$(id).value)).filter(Boolean);
  const R=new Set(); picks.forEach(x=>roles(x.n).forEach(v=>R.add(v)));

  let score=0;
  score += (p[fac]||1)*7;        // 7-35
  score += (s2[fac]||1)*4;       // 4-20
  score += (g[fac]||1)*3;        // 3-15
  if(R.has('at')) score+=12;
  if(R.has('horde')) score+=10;
  if(R.has('offensive')) score+=6;
  if(R.has('support')) score+=4;
  if(R.has('cc')||R.has('static')) score+=3;
  const uniqueCats=new Set(picks.map(x=>x.cat)).size;
  score += uniqueCats*1.5;
  score = Math.round(Math.max(0,Math.min(100,score)));

  const notes=[];
  if(!R.has('at')) notes.push(['warn','No anti-tank answer. Chargers, Hulks, Tanks and Harvesters will stall you until your stratagems come back.']);
  if(!R.has('horde')) notes.push(['warn','No sustained horde clear. You will run dry on chaff before the objective is done.']);
  if(!R.has('support')) notes.push(['warn','No support weapon. Your primary alone is not enough past difficulty 7.']);
  if(!R.has('offensive')) notes.push(['warn','No Eagle or Orbital. You are giving up your strongest damage source.']);
  if(picks.length && new Set(picks.map(x=>x.n)).size<picks.length) notes.push(['warn','Duplicate stratagem selected.']);
  if(fac==='a' && (p.traits||'').toLowerCase().includes('light armor')) notes.push(['warn','Light penetration primary against Automatons. Devastator armour will eat your damage.']);
  if(fac==='b' && p.b>=4) notes.push(['','Primary is well matched to Terminid chaff density.']);
  if(fac==='a' && p.a>=4) notes.push(['','Primary handles Automaton armour at range.']);
  if(fac==='i' && p.i>=4) notes.push(['','Primary suits Illuminate crowd fights.']);
  if(R.has('at')&&R.has('horde')) notes.push(['','Anti-tank and horde clear both covered. This kit can hold ground.']);
  if(R.has('backpack')) notes.push(['','Backpack slot in use: check it does not clash with a team-reload weapon.']);
  if(!notes.length) notes.push(['','Balanced kit. Nothing obviously missing.']);

  $('#bScore').textContent=score;
  const grade = score>=82?'Combat ready':score>=64?'Serviceable':score>=45?'Gaps present':'Reconsider';
  const gEl=$('#bGrade');
  gEl.textContent=grade;
  gEl.className='tag'+(score>=64?'':' red');
  $('#bNotes').innerHTML=notes.map(n=>`<p class="${n[0]}">${n[1]}</p>`).join('');
  $('#bCodes').innerHTML=picks.map(x=>
    `<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.03);border:1px solid var(--line);padding:8px 10px">
      <img loading="lazy" src="${window.stratIcon(x.ic)}" alt="" style="width:22px;height:22px">
      <em style="font-style:normal;font-size:12px;flex:1">${x.n}</em>
      ${window.arrowRow(x.c)}</div>`).join('');
  $('#bCodes').querySelectorAll('.arrows').forEach(a=>a.style.setProperty('--as','13px'));

  window.__loadout={fac,p:p.n,s:s2.n,g:g.n,boost:$('#bBoost').value,strat:picks.map(x=>x.n),score,grade};
}
$$('#builder select').forEach(s=>s.addEventListener('change',()=>{build();pushURL();}));
/* loadout in the URL so a build can be linked */
function pushURL(){
  const L=window.__loadout; if(!L)return;
  const q=new URLSearchParams({f:L.fac,p:L.p,s:L.s,g:L.g,b:L.boost,x:L.strat.join('|')});
  history.replaceState(null,'','#builder?'+q.toString());
}
(function fromURL(){
  const h=location.hash; const i=h.indexOf('?'); if(i<0)return;
  const q=new URLSearchParams(h.slice(i+1));
  const set=(id,v)=>{ const el=$(id); if(el&&v!=null){ const o=[...el.options].find(o=>o.value===v); if(o) el.value=v; } };
  set('#bFac',q.get('f')); set('#bPrim',q.get('p')); set('#bSec',q.get('s')); set('#bGren',q.get('g')); set('#bBoost',q.get('b'));
  (q.get('x')||'').split('|').forEach((n,k)=>set(['#bS1','#bS2','#bS3','#bS4'][k],n));
  if(q.get('f')){ setTimeout(()=>document.getElementById('builder').scrollIntoView({behavior:'smooth'}),400); }
})();
build();

/* a PNG of the build, drawn on a canvas so it can be saved or shared anywhere */
async function buildCard(){
  const L=window.__loadout; if(!L)return;
  const FN={b:'Terminids',a:'Automatons',i:'Illuminate'}; const pf=(window.HD.profile&&window.HD.profile.get())||{};
  const W_=1200,H_=720, c=document.createElement('canvas'); c.width=W_; c.height=H_; const x=c.getContext('2d');
  x.fillStyle='#07090C'; x.fillRect(0,0,W_,H_);
  x.fillStyle='#FFE01B'; x.fillRect(0,0,W_,8); for(let i=0;i<W_;i+=36){ x.fillStyle=i%72?'#000':'#FFE01B'; x.fillRect(i,H_-10,36,10); }
  const img=src=>new Promise(r=>{ const im=new Image(); im.onload=()=>r(im); im.onerror=()=>r(null); im.src=src; });
  x.fillStyle='#fff'; x.font='700 44px "Chakra Petch",system-ui'; x.fillText('LOADOUT · '+FN[L.fac].toUpperCase(),48,80);
  x.fillStyle='#9AA3B4'; x.font='500 18px "Barlow Semi Condensed",system-ui'; x.fillText((pf.callsign?pf.callsign+' · ':'')+(pf.ship||'Helldive Command')+' · readiness '+L.score+'/100 · '+L.grade,48,112);
  const rows=[['PRIMARY',L.p,'weapons'],['SIDEARM',L.s,'weapons'],['GRENADE',L.g,'grenades'],['BOOSTER',L.boost,'boosters']];
  let y=160; for(const [lab,name,cat] of rows){ x.fillStyle='#6B7280'; x.font='600 12px "Barlow Semi Condensed",system-ui'; x.fillText(lab,48,y); x.fillStyle='#fff'; x.font='700 24px "Barlow Semi Condensed",system-ui'; x.fillText(name||'—',48,y+30);
    const m=window.HD_IMG&&window.HD_IMG[cat]; const f=m&&(m[name]||m[(name||'').replace(' Booster','')]); if(f){ const im=await img(`assets/img/${cat}/${f}`); if(im){ const h=54, w=h*im.width/im.height; x.drawImage(im,560-w,y-6,w,h); } } y+=78; }
  x.fillStyle='#6B7280'; x.font='600 12px "Barlow Semi Condensed",system-ui'; x.fillText('STRATAGEMS',640,160);
  let yy=190; for(const n of L.strat){ const s=S.find(v=>v.n===n); const im=s?await img(window.stratIcon(s.ic)):null; if(im) x.drawImage(im,640,yy-26,40,40); x.fillStyle='#fff'; x.font='700 22px "Barlow Semi Condensed",system-ui'; x.fillText(n,696,yy);
    if(s){ x.fillStyle='#FFE01B'; x.font='600 16px "Barlow Semi Condensed",system-ui'; x.fillText(s.c.split('').map(d=>({U:'↑',D:'↓',L:'←',R:'→'})[d]).join(' '),696,yy+24); } yy+=76; }
  x.fillStyle='#4B5563'; x.font='500 13px "Barlow Semi Condensed",system-ui'; x.fillText('helldive command · longevity program · '+new Date().toISOString().slice(0,10),48,H_-28);
  const a=document.createElement('a'); a.download='loadout-'+FN[L.fac].toLowerCase()+'.png'; a.href=c.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
}
(function(){ const b=$('#bShare'); if(!b)return; const s=document.createElement('button'); s.className='btn sm ghost'; s.id='bShot'; s.style.cssText='width:100%;justify-content:center;margin-top:8px'; s.textContent='Screenshot the build'; b.after(s); s.addEventListener('click',buildCard); })();
$('#bShare').addEventListener('click',()=>{
  const L=window.__loadout; if(!L)return;
  const FN={b:'Terminids',a:'Automatons',i:'Illuminate'};
  const txt=`HELLDIVE COMMAND: loadout (${FN[L.fac]})\n`+
    `Primary:   ${L.p}\nSidearm:   ${L.s}\nGrenade:   ${L.g}\nBooster:   ${L.boost}\n`+
    `Stratagems:\n`+L.strat.map(n=>{const s=S.find(x=>x.n===n); return '  - '+n+(s?'  ['+s.c+']':'');}).join('\n')+
    `\nReadiness: ${L.score}/100 (${L.grade})`;
  pushURL();
  navigator.clipboard.writeText(txt+'\n'+location.href).then(()=>{
    const b=$('#bShare'); const o=b.textContent; b.textContent='Copied to clipboard';
    setTimeout(()=>b.textContent=o,1600);
  }).catch(()=>{});
});
if(window.HD.observeReveals) window.HD.observeReveals();
})();
