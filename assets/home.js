/* ============ HOME PAGE ============ */
(function(){
'use strict';
const {$,$$,el,fmt,short}=window.HD;
const S=window.HD_STRATAGEMS||[];

{ const ht=document.getElementById('hsTech'); if(ht) ht.textContent=String((window.HD_TECH||[]).length); }
/* ---------- rules: a list, and one big visual for the chosen rule ---------- */
const rw=$('#rules');
const RICON=['eagle_airstrike','resupply','anti-materiel_rifle','orbital_precision_strike','upload_data','reinforce',
             'shield_generator_relay','eagle_500kg_bomb','eagle_rearm','orbital_railcannon_strike','hellbomb','orbital_gatling_barrage'];
/* one Seaborn film per rule, muted, a different minute of each so the panel never repeats */
const RCLIP=[['yxmyJEMgf7M',20],['JvMNuJl5zp8',33],['4FWCYds_9LM',36],['D9RC4vJ09MA',55],['J6_Xndo7jnk',62],['H54VwQUg0Y4',39],
             ['zp2sb03BUSQ',58],['yxmyJEMgf7M',95],['JvMNuJl5zp8',80],['4FWCYds_9LM',90],['D9RC4vJ09MA',120],['J6_Xndo7jnk',30]];
const RTITLE={yxmyJEMgf7M:'No End To Them',JvMNuJl5zp8:'Dead Front','4FWCYds_9LM':'All Men Bow',D9RC4vJ09MA:'No One Is Missed',J6_Xndo7jnk:'Death Awaits',H54VwQUg0Y4:'Across Worlds Unnumbered',zp2sb03BUSQ:'We Are'};
const RART=['cine-eaglestorm','cine-hangar','cine-cyberstan','cine-nest','cine-frostown','cine-hellpod','cine-bays','cine-marfark','cine-shete','cine-lesath','cine-varylia','cine-overships'];
if(rw){
  const R=window.HD_RULES||[]; let cur=0, player=null, ready=false;
  rw.innerHTML=R.map((r,k)=>`<li><button type="button" data-k="${k}"${k===0?' class="on" aria-current="true"':''}><img src="assets/img/strat/${RICON[k]||'reinforce'}.webp" alt="" loading="lazy" onerror="this.src='assets/img/strat/reinforce.webp'"><span><b>${r.t}</b></span>${r.src?'<em title="Sourced from the wiki">wiki</em>':''}</button></li>`).join('');
  const art=$('#docArt'), ic=$('#docIc'), num=$('#docNum'), src=$('#docSrc'), ttl=$('#docTitle'), txt=$('#docText'), credit=$('#docCredit'), view=$('#docView');
  function paint(k){
    cur=(k+R.length)%R.length; const r=R[cur];
    $$('#rules button').forEach(b=>{ const on=+b.dataset.k===cur; b.classList.toggle('on',on); if(on) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current'); });
    view.classList.remove('doc-in'); void view.offsetWidth; view.classList.add('doc-in');
    num.textContent='Rule '+r.n; ttl.textContent=r.t; txt.textContent=r.d;
    src.innerHTML=r.src?`Source: <a href="https://helldivers.wiki.gg/wiki/${encodeURIComponent(r.src)}" target="_blank" rel="noopener">wiki, ${r.src.replace(/_/g,' ')}</a>`:'Field doctrine';
    ic.src=`assets/img/strat/${RICON[cur]||'reinforce'}.webp`;
    art.src=`assets/img/art/${RART[cur%RART.length]}.webp`;
    const [v,sec]=RCLIP[cur%RCLIP.length]; credit.textContent='Clip: '+(RTITLE[v]||'')+' by Seaborn';
    if(ready&&player){ try{ player.loadVideoById({videoId:v,startSeconds:sec}); player.mute(); }catch(e){} }
  }
  rw.addEventListener('click',e=>{ const b=e.target.closest('button[data-k]'); if(b) paint(+b.dataset.k); });
  $('#docNext').addEventListener('click',()=>paint(cur+1)); $('#docPrev').addEventListener('click',()=>paint(cur-1));
  paint(0);
  /* the film: only on wide screens, only once the section is near, never on a metered connection */
  const net=navigator.connection;
  if(innerWidth>=900 && !(net&&(net.saveData||/(^|-)2g$/.test(net.effectiveType||'')))){
    const io=new IntersectionObserver(es=>{ if(!es[0].isIntersecting) return; io.disconnect(); mount(); },{rootMargin:'400px'});
    io.observe(view);
  }
  /* the iframe is 16:9; size it to cover the panel whatever the panel's ratio */
  function fitVid(){ const f=$('#docVid iframe'); if(!f) return; const r=view.getBoundingClientRect(); const w=Math.max(r.width,r.height*16/9), h=w*9/16; f.style.width=w+'px'; f.style.height=h+'px'; }
  addEventListener('resize',fitVid);
  function mount(){
    const wrap=$('#docVid'); const host=document.createElement('div'); wrap.appendChild(host); const [v,sec]=RCLIP[cur];
    const go=()=>{ player=new YT.Player(host,{videoId:v,playerVars:{autoplay:1,mute:1,controls:0,disablekb:1,fs:0,loop:1,playlist:v,modestbranding:1,rel:0,playsinline:1,start:sec,cc_load_policy:0,iv_load_policy:3},
      events:{onReady:e=>{ ready=true; e.target.mute(); e.target.playVideo(); fitVid(); },
              onStateChange:e=>{ if(e.data===YT.PlayerState.PLAYING) view.classList.add('vid-on'); if(e.data===YT.PlayerState.ENDED) e.target.playVideo(); }}}); };
    if(window.YT&&window.YT.Player) go();
    else { const prev=window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady=()=>{ if(prev) prev(); go(); };
      if(!document.querySelector('script[src*="youtube.com/iframe_api"]')){ const t=document.createElement('script'); t.src='https://www.youtube.com/iframe_api'; document.head.appendChild(t); } }
  }
}

/* ---------- difficulty ladder ---------- */
const dl=$('#dladder');
if(dl){
  const DIMG=(window.HD_IMG&&window.HD_IMG.difficulty)||{};
  const D=(window.HD_DIFFICULTY||[]);
  dl.innerHTML=D.map(d=>{
    const f=DIMG[d.name];
    return `<li${d.n===10?' class="cur"':''}><button type="button" data-n="${d.n}" aria-pressed="${d.n===10}">`+
      (f?`<img src="assets/img/difficulty/${f}" alt="" loading="lazy">`:'')+
      `<b>${d.n}</b><span>${d.name}</span></button></li>`;
  }).join('');

  /* the ladder is the section's control, not decoration: picking a level reads out
     what that level actually changes. The note used to hide in a title tooltip. */
  const out=document.createElement('div'); out.className='dl-read'; out.id='dlRead';
  /* one bordered unit: the ladder selects, the panel below reports. Two separate
     boxes read as two sets of choices and muddied the journey. */
  const unit=document.createElement('div'); unit.className='dl-unit';
  dl.parentNode.insertBefore(unit,dl); unit.appendChild(dl); unit.appendChild(out);
  const paint=n=>{
    const d=D.find(x=>x.n===n)||D[D.length-1]; if(!d) return;
    out.innerHTML=`<div class="dl-stats">`+
      `<div><b>${d.missions}</b><span>${d.missions==1?'Mission':'Missions'} per operation</span></div>`+
      `<div><b>${d.medals}</b><span>Medals per mission</span></div>`+
      `<div class="dl-lv"><b>${d.n}</b><span>${d.name}</span></div></div>`+
      `<p class="dl-note">${d.note}</p>`;
    dl.querySelectorAll('li').forEach(li=>{
      const b=li.querySelector('button'); const on=+b.dataset.n===d.n;
      li.classList.toggle('cur',on); b.setAttribute('aria-pressed',String(on));
    });
  };
  dl.addEventListener('click',e=>{ const b=e.target.closest('button[data-n]'); if(b) paint(+b.dataset.n); });
  paint(10);
}

/* ---------- factions ---------- */
const ART=(window.HD_IMG&&window.HD_IMG.art)||{};
const artp=k=>ART[k]?'assets/img/art/'+ART[k]:'';
const FAC_ART={bug:'cine_nest',bot:'cine_cyberstan',squid:'cine_overships'};
const FAC_HERO={bug:'bile-titan',bot:'factory-strider',squid:'harvester'};
const FAC_UNITS={
  bug:[['charger','Charger'],['hunter','Hunter'],['stalker','Stalker']],
  bot:[['hulk','Hulk'],['devastator','Devastator'],['gunship','Gunship']],
  squid:[['overseer','Overseer'],['voteless','Voteless'],['watcher','Watcher']]
};
const FK={bug:'TERMINID',bot:'AUTOMATON',squid:'ILLUMINATE'};
const FSVG={
  units:'<svg viewBox="0 0 24 24"><circle cx="7" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="16" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M2.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5M12 19c0-3 2-5 4.5-5s4.5 2 4.5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  heavy:'<svg viewBox="0 0 24 24"><path d="M12 2.8 20.5 7v6.2c0 4.3-3.6 7.2-8.5 8.6C7.1 20.4 3.5 17.5 3.5 13.2V7L12 2.8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.5 12.2h7M12 8.7v7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  threat:'<svg viewBox="0 0 24 24"><path d="M12 3.2 21.5 20H2.5L12 3.2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 9.5v4.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/></svg>',
  pen:'<svg viewBox="0 0 24 24"><path d="M3 12h11M14 12l-3-3M14 12l-3 3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.5 5.5h4.5v13h-4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'
};
function facStats(k){
  const E=(window.HD_ENEMIES||[]).filter(e=>e.f===FK[k]); if(!E.length) return '';
  /* units whose main body is AV 3 or more, counted from the game-extracted anatomy in data/stats.js
     (tools/pipeline/build_stats.py); stats.js is 300 KB so the three counts are inlined here */
  const AP3={bug:7,bot:8,squid:7};
  const heavy=E.filter(e=>/Large|Titan|Colossal/i.test(e.size)).length;
  const avgT=(E.reduce((a,e)=>a+(e.threat||0),0)/E.length).toFixed(1);
  const armoured=AP3[k]||0;
  const rows=[['units',E.length,'Units'],['heavy',heavy,'Heavies'],['threat',avgT,'Avg threat'],['pen',armoured,'Need AP3+']];
  return `<div class="fac-stats">${rows.map(r=>`<div><i>${FSVG[r[0]]}</i><b>${r[1]}</b><span>${r[2]}</span></div>`).join('')}</div>`;
}
const fw=$('#facs');
if(fw) fw.innerHTML=(window.HD_FACTIONS||[]).map(f=>{
  const bg=artp(FAC_ART[f.k]);
  return `<article class="panel fac rv" style="--acc:${f.colour}">
     <div class="fac-band">
       ${bg?`<img class="fb-bg" src="${bg}" alt="" loading="lazy">`:''}
       <img class="fb-glyph" src="assets/img/brand/glyph-${f.k}.webp" alt="" loading="lazy">
       <img class="fb-unit" src="assets/img/enemies/${FAC_HERO[f.k]}.webp" alt="" loading="lazy">
       <div class="fb-txt">
         <span class="tag" style="color:${f.colour};border-color:${f.colour}55;background:${f.colour}12">${f.tag}</span>
         <h3>${f.name}</h3>
       </div>
     </div>
     <div class="fac-in">
       <p class="lede">${f.line}</p>
       ${facStats(f.k)}
       <div class="fac-units">${FAC_UNITS[f.k].map(u=>
         `<figure><span><img src="assets/img/enemies/${u[0]}.webp" alt="" loading="lazy"></span><figcaption>${u[1]}</figcaption></figure>`).join('')}</div>
       <p>${f.brief}</p>
       <ul>${f.win.slice(0,4).map(w=>`<li><span>${w}</span></li>`).join('')}</ul>
     </div>
   </article>`;}).join('');

/* ---------- loadouts ---------- */
function icon(name){
  const s=S.find(x=>x.n.toLowerCase()===name.toLowerCase())
       || S.find(x=>x.n.toLowerCase().includes(name.toLowerCase()))
       || S.find(x=>name.toLowerCase().includes(x.n.toLowerCase()));
  return s?{ic:s.ic,n:s.n,c:s.c}:{ic:'reinforce',n:name,c:''};
}
function kitImg(kind,name){
  const R=(window.HD_IMG&&window.HD_IMG[kind])||{}; const n=String(name).toLowerCase();
  let key=R[name]?name:Object.keys(R).find(k=>n.endsWith(k.toLowerCase()))||Object.keys(R).find(k=>n.includes(k.toLowerCase()));
  return key?`<em class="ld-th"><img src="assets/img/${kind}/${R[key]}" alt="" loading="lazy"></em>`:'<em class="ld-th"></em>';
}
function ldCard(l){
  const f=(window.HD_FACTIONS||[]).find(x=>x.k===l.f)||{colour:'#FFE01B',name:''};
  return `<article class="panel ld rv">
    <div class="ld-h"><div><h3 style="color:${f.colour}">${l.name}</h3><span class="role">${f.name} &middot; ${l.role}</span></div>
    <span class="pill hot">${l.f.toUpperCase()}</span></div>
    <div class="ld-kit">
      <div><i>Primary</i>${kitImg('weapons',l.primary)}<span>${l.primary}</span></div>
      <div><i>Secondary</i>${kitImg('weapons',l.secondary)}<span>${l.secondary}</span></div>
      <div><i>Grenade</i>${kitImg('grenades',l.grenade)}<span>${l.grenade}</span></div>
      <div><i>Booster</i>${kitImg('boosters',l.booster)}<span>${l.booster}</span></div>
    </div>
    <div class="ld-str">${l.strat.map(s=>{const i=icon(s);
      return `<a href="stratagems.html?q=${encodeURIComponent(i.n)}"><img src="${window.stratIcon(i.ic)}" alt=""><em>${s}</em></a>`;}).join('')}</div>
    <p class="ld-why">${l.why}</p>
  </article>`;
}
const lw=$('#homeLoadouts');
if(lw){
  const picks=['bug','bot','squid'].map(k=>(window.HD_LOADOUTS||[]).find(l=>l.f===k)).filter(Boolean);
  lw.innerHTML=picks.map(ldCard).join('');
}

/* ---------- live war board ---------- */
const OWN=[['Humans','Super Earth','var(--blue)'],['Terminids','Terminids','var(--bug)'],
            ['Automaton','Automatons','var(--bot)'],['Illuminate','Illuminate','var(--squid)']];

document.addEventListener('hd:galaxy',e=>{
  const d=e.detail;
  const hp=$('#hsPlayers'), hpl=$('#hsPlanets');
  if(hp) hp.textContent=d.players?fmt(d.players):'—';
  if(hpl) hpl.textContent=(d.tally.Humans||0)+' / '+d.total;
  const rows=$('#ctrlRows');
  if(rows){
    rows.innerHTML=OWN.map(o=>{
      const n=d.tally[o[0]]||0, pc=d.total?(n/d.total*100):0;
      return `<div class="ctrl-row" style="color:${o[2]}"><i></i><em>${o[1]}</em><b>${n}</b>
        <span class="ctrl-bar"><u style="width:${pc.toFixed(1)}%"></u></span></div>`;
    }).join('');
  }
  const tag=$('#warTag');
  if(tag && !d.live) tag.textContent='Offline star chart · live feed unreachable';
});

/* live contested planets, straight from the war API */
const OWNCOL={Terminids:'var(--bug)',Automaton:'var(--bot)',Illuminate:'var(--squid)',Humans:'var(--blue)'};
async function hotPlanets(){
  const box=$('#hotPlanets'); if(!box)return;
  try{
    const P=await window.HDWar.planets();
    const hot=P.filter(p=>p.currentOwner!=='Humans')
      .sort((a,b)=>((b.statistics&&b.statistics.playerCount)||0)-((a.statistics&&a.statistics.playerCount)||0))
      .slice(0,5);
    if(!hot.length){ box.innerHTML='<div class="empty" style="padding:24px">No contested worlds reported</div>'; return; }
    box.innerHTML=hot.map(p=>{
      const lib=p.maxHealth?(1-p.health/p.maxHealth)*100:0;
      const col=OWNCOL[p.currentOwner]||'var(--gold)';
      const players=(p.statistics&&p.statistics.playerCount)||0;
      return `<a href="enemies.html?f=${p.currentOwner}" style="color:${col}">
        <span><b style="color:#fff">${p.name}</b><em>${p.sector?p.sector+' sector · ':''}${p.currentOwner}</em></span>
        <span class="n">${players.toLocaleString()} divers</span>
        <span class="lb2"><u style="width:${Math.max(1,lib).toFixed(1)}%"></u></span>
      </a>`;
    }).join('');
  }catch(e){
    box.innerHTML='<div class="empty" style="padding:24px">Planet telemetry unreachable</div>';
  }
}
hotPlanets();

async function board(){
  const stamp=$('#warStamp');
  try{
    const [w,a,dp]=await Promise.all([
      window.HDWar.war().catch(()=>null),
      window.HDWar.orders().catch(()=>null),
      window.HDWar.dispatch().catch(()=>null)
    ]);

    if(w&&w.statistics){
      const s=w.statistics;
      const hp=$('#hsPlayers'); if(hp&&(hp.textContent==='…'||hp.textContent==='—')&&s.playerCount) hp.textContent=fmt(s.playerCount);
      const set=(id,v,abbr)=>{const n=$(id); if(!n)return; n.dataset.to=v; if(abbr)n.dataset.abbr='1';
        n.textContent=abbr?short(v):fmt(v);};
      set('#stKills',(s.terminidKills||0)+(s.automatonKills||0)+(s.illuminateKills||0),1);
      set('#stMissions',s.missionsWon||0,1);
      set('#stDeaths',s.deaths||0,1);
      const r=$('#stRate'); if(r) r.textContent=(s.missionSuccessRate||0)+'%';
      if(stamp) stamp.textContent='Live · '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})+' · war '+(w.factions?w.factions.length:4)+' factions';
    }else if(stamp) stamp.textContent='Live feed unavailable · showing static codex';

    const mo=Array.isArray(a)?a[0]:null;
    if(mo){
      const t=$('#moTitle'), b=$('#moBrief'), rw2=$('#moReward');
      if(t) t.textContent=window.HDWar.clean(mo.title||'Major Order');
      const nt=$('#nowMoTitle'), nb=$('#nowMoBrief');
      const ttl=window.HDWar.clean(mo.title||'Major Order'), br=window.HDWar.clean(mo.briefing||mo.description||'');
      const generic=/^major order$/i.test(ttl.trim());
      const cut=(x,n)=>x.length>n?x.slice(0,n-3).replace(/\s+\S*$/,'')+'…':x;
      if(nt){
        nt.textContent=generic&&br ? cut(br,90) : cut(ttl,96);
        const L=nt.textContent.length;
        nt.classList.toggle('long',L>34); nt.classList.toggle('xlong',L>62);
      }
      { const t=(ttl+' '+br).toLowerCase(); const f=/automaton|cyborg|\bbots?\b|jet brigade|incineration|cyberstan/.test(t)?'bot':/terminid|\bbugs?\b|hive|gloom|predator|spore/.test(t)?'bug':/illuminate|squid|overship|warp ship|leviathan/.test(t)?'squid':null;
        const A={bot:['cine-cyberstan','glyph-bot.webp','Automaton front'],bug:['cine-nest','glyph-bug.webp','Terminid front'],squid:['cine-overships','glyph-squid.webp','Illuminate front']}[f];
        const bg=$('#moArt .nc-bg'), gl=$('#moGlyph'), fr=$('#moFront'); if(A){ if(bg) bg.src='assets/img/art/'+A[0]+'.webp'; if(gl) gl.src='assets/img/brand/'+A[1]; if(fr) fr.textContent=A[2]; } }
      if(nb) nb.textContent=generic ? 'Current Major Order. Open the war room for the planets that matter tonight and the builds that clear them.' : (br.length>150?br.slice(0,147).replace(/\s+\S*$/,'')+'…':br);
      if(b) b.textContent=window.HDWar.clean(mo.briefing||mo.description||'');
      if(rw2&&mo.reward) rw2.textContent=mo.reward.amount+' medals';
      const exp=new Date(mo.expiration).getTime();
      const tw=$('#moTimer');
      if(tw&&!isNaN(exp)){
        const tick=()=>{
          let s=Math.max(0,Math.floor((exp-Date.now())/1000));
          const d2=Math.floor(s/86400); s-=d2*86400;
          const h=Math.floor(s/3600); s-=h*3600;
          const m=Math.floor(s/60); s-=m*60;
          tw.innerHTML=[[d2,'Days'],[h,'Hrs'],[m,'Min'],[s,'Sec']]
            .map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
          const tw2=$('#nowMoTimer'); if(tw2) tw2.innerHTML=tw.innerHTML;
        };
        tick(); setInterval(tick,1000);
      }
    }else{
      /* no order running: the card still carries the live dispatches, so label it for
         what it actually shows instead of contradicting its own lead */
      const t=$('#moTitle'); if(t) t.textContent='Between orders';
      const nt=$('#nowMoTitle'); if(nt) nt.textContent='Latest from High Command';
      const nb2=$('#nowMoBrief'); if(nb2) nb2.textContent='No order is running right now. Here is what just happened on the front.';
      const b=$('#moBrief'); if(b) b.textContent='High Command has not issued an order, or the live feed is unreachable. The dispatches below are still current.';
    }

    const fd=$('#feed');
    if(fd&&Array.isArray(dp)&&dp.length){
      fd.innerHTML=dp.slice(0,14).map(x=>{
        const dt=new Date(x.published);
        return `<div class="feed-i"><time>${isNaN(dt)?'':dt.toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time><p>${window.HDWar.clean(x.message)}</p></div>`;
      }).join('');
    }else if(fd){ fd.innerHTML='<div class="empty">Dispatch feed unreachable</div>'; }
  }catch(err){
    if(stamp) stamp.textContent='Live feed unavailable';
  }
  /* no star chart on this device: count Super Earth's planets from the planet list instead */
  if(document.documentElement.classList.contains('no-galaxy')&&window.HDWar.planets){
    window.HDWar.planets().then(P=>{ if(!Array.isArray(P)||!P.length)return; const n=P.filter(p=>p.currentOwner==='Humans').length; const el=$('#hsPlanets'); if(el) el.textContent=n+' / '+P.length; }).catch(()=>{});
  }
  /* whatever is still loading after the fetch settles reads as offline, not as a dash */
  setTimeout(()=>{ ['#hsPlayers'].forEach(id=>{ const n=$(id); if(n&&/^(…|—)$/.test(n.textContent.trim())) n.textContent='offline'; }); },7000);
}
board();

/* ---------- teaser drill ---------- */
(function teaser(){
  const stage=$('#teaser'); if(!stage||!S.length)return;
  const iconEl=$('#tzIcon'),nameEl=$('#tzName'),catEl=$('#tzCat'),arrEl=$('#tzArrows'),
        msgEl=$('#tzMsg'),scoreEl=$('#tzScore'),pad=$('#tzPad');
  let cur=null,pos=0,streak=0;
  const pick=()=>S[(Math.random()*S.length)|0];
  function load(){
    cur=pick(); pos=0;
    iconEl.src=window.stratIcon(cur.ic);
    nameEl.textContent=cur.n; catEl.textContent=cur.cat;
    draw();
  }
  function draw(){
    arrEl.innerHTML=cur.c.split('').map((d,i)=>
      window.arrowSVG(d, i<pos?'hit':'wait')).join('');
  }
  const armBtn=$('#tzArm');
  const hold=window.HD.hold({when:()=>active,btn:armBtn,on:on=>{
    stage.classList.toggle('armed',on);
    if(armBtn){ armBtn.setAttribute('aria-pressed',String(on)); armBtn.textContent=on?'Stratagem out':'Take out stratagem'; }
    if(on){ msgEl.textContent='Input the code'; }
    else { if(pos>0){ pos=0; draw(); } msgEl.textContent='Hold '+hold.label()+' and input the code'; }
  }});
  msgEl.textContent='Hold '+hold.label()+' and input the code';
  document.addEventListener('hd:binds',()=>{ if(!hold.down) msgEl.textContent='Hold '+hold.label()+' and input the code'; });
  function input(d){
    if(!cur)return;
    if(!hold.down){ msgEl.textContent='Hold '+hold.label()+' first, as in the field'; stage.classList.add('shake'); setTimeout(()=>stage.classList.remove('shake'),300); return; }
    if(cur.c[pos]===d){
      pos++; draw();
      if(pos>=cur.c.length){
        streak++; scoreEl.textContent=streak;
        msgEl.textContent='STRATAGEM ACCEPTED'; msgEl.classList.add('sh-perfect');
        stage.classList.add('flash-ok'); setTimeout(()=>stage.classList.remove('flash-ok'),360);
        setTimeout(()=>{msgEl.classList.remove('sh-perfect');msgEl.textContent=hold.down?'Next code':'Hold '+hold.label()+' and input the code';load();},520);
      }
    }else{
      pos=0; draw(); streak=0; scoreEl.textContent=0;
      msgEl.textContent='INPUT REJECTED';
      stage.classList.add('shake'); setTimeout(()=>stage.classList.remove('shake'),300);
    }
  }
  const KEY={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',w:'U',a:'L',s:'D',d:'R',W:'U',A:'L',S:'D',D:'R'};
  let active=false;
  new IntersectionObserver(es=>{active=es[0].isIntersecting;},{threshold:.35}).observe(stage);
  addEventListener('keydown',e=>{
    const k=KEY[e.key]; if(!k||!active)return;
    if(e.target&&e.target.matches&&e.target.matches('input,select,textarea'))return;
    e.preventDefault(); input(k);
  });
  if(pad){
    pad.innerHTML=[['u','U'],['l','L'],['r','R'],['d','D']].map(x=>
      `<button class="${x[0]}" data-d="${x[1]}" aria-label="${x[1]}">${window.arrowSVG(x[1]).replace('<span class="arw " data-d="'+x[1]+'">','').replace('</span>','')}</button>`).join('');
    pad.addEventListener('click',e=>{const b=e.target.closest('button'); if(b)input(b.dataset.d);});
  }
  load();
})();
})();

/* ============ upgrades: ticker · planet panel · art ============ */
(function(){
const {$,$$,fmt}=window.HD;
const IMG=window.HD_IMG||{art:{},misc:{}};
const art=k=>IMG.art[k]?'assets/img/art/'+IMG.art[k]:'';

/* codex tile art */
document.addEventListener('DOMContentLoaded',paintArt); paintArt();
function paintArt(){
  $$('.cx-art').forEach(a=>{
    if(a.querySelector('.cx-bg'))return;
    const src=art(a.dataset.art); if(!src)return;
    const d=document.createElement('div'); d.className='cx-bg'; d.innerHTML=`<img src="${src}" alt="" loading="lazy">`;
    a.prepend(d);
  });
}

/* planet panel */
/* planet panel (only when the star chart is on the page) */
(function planetPanel(){
const PP=$('#planetPanel'); if(!PP)return;
const BIOME_ART=['planet_b1','planet_b2','planet_b3','planet_b4','planet_b5','biome_mesa','biome_swamp','planet_gloom'];
const OWNER={Humans:['Super Earth','var(--blue)','enemies.html'],Terminids:['Terminids','var(--bug)','enemies.html?f=TERMINID'],
             Automaton:['Automatons','var(--bot)','enemies.html?f=AUTOMATON'],Illuminate:['Illuminate','var(--squid)','enemies.html?f=ILLUMINATE']};
document.addEventListener('hd:planet',e=>{
  const p=e.detail;
  const hero=document.querySelector('.hero');
  if(!p){ PP.classList.remove('on'); if(hero) hero.classList.remove('has-pp'); return; }
  if(hero) hero.classList.add('has-pp');
  const o=OWNER[p.owner]||OWNER.Humans;
  const hash=[...p.name].reduce((a,c)=>a+c.charCodeAt(0),0);
  let img='';
  const bn=(p.biome&&p.biome.name||'').toLowerCase();
  if(bn.includes('mesa')||bn.includes('desert')||bn.includes('arid')) img=art('biome_mesa');
  else if(bn.includes('swamp')||bn.includes('jungle')||bn.includes('rain')) img=art('biome_swamp');
  else if(bn.includes('gloom')) img=art('planet_gloom');
  if(!img) img=art(BIOME_ART[hash%5]);
  $('#ppImg').src=img;
  $('#ppName').textContent=p.name; $('#ppName').style.color=o[1];
  $('#ppSub').innerHTML=`${p.sector?p.sector+' sector · ':''}<span style="color:${o[1]}">${o[0]}</span>${p.biome&&p.biome.name?' · '+p.biome.name:''}`;
  $('#ppPlayers').textContent=fmt(p.players);
  $('#ppLib').textContent=p.owner==='Humans'?'Held':p.lib.toFixed(1)+'%';
  $('#ppLibBar').style.width=(p.owner==='Humans'?100:Math.max(1,p.lib))+'%';
  $('#ppRegen').textContent=p.regen?p.regen.toFixed(1):'0';
  $('#ppRate').textContent=(p.stats&&p.stats.missionSuccessRate!=null)?p.stats.missionSuccessRate+'%':'—';
  $('#ppBiome').textContent=(p.biome&&p.biome.description)?p.biome.description.slice(0,260):'';
  const hz=(p.hazards||[]).filter(h=>h.name&&h.name!=='None');
  $('#ppHaz').innerHTML=hz.length?hz.map(h=>`<span class="pill" title="${(h.description||'').replace(/"/g,'')}">${h.name}</span>`).join(''):'<span class="pill">No known hazards</span>';
  $('#ppBestiary').href=o[2];
  $('#ppMeta').href='meta.html#'+({Terminids:'bug',Automaton:'bot',Illuminate:'squid'}[p.owner]||'');
  PP.classList.add('on');
});
$('#ppClose').addEventListener('click',()=>window.HDGalaxy&&window.HDGalaxy.clear());
/* clicking a priority target focuses it on the chart */
document.addEventListener('click',e=>{
  const a=e.target.closest('#hotPlanets a'); if(!a||!window.HDGalaxy)return;
  const name=a.querySelector('b').textContent.trim();
  const p=window.HDGalaxy.planets.find(x=>x.name===name);
  if(p){ e.preventDefault(); window.HDGalaxy.focus(p); scrollTo({top:0,behavior:'smooth'}); }
});

})();
/* ---------- dead time: flash card, enemy of the minute, install ---------- */
(function now(){
  const {$}=window.HD; const S=window.HD_STRATAGEMS||[];
  const bump=k=>{ try{ localStorage.setItem(k,String((+localStorage.getItem(k)||0)+1)); }catch(e){} };
  const sec=$('#now'); if(!sec)return;
  const fl=$('#nowFlash'), nfIcon=$('#nfIcon'), nfName=$('#nfName'), nfArr=$('#nfArrows'), nfHint=$('#nfHint');
  let cur=null, last=null;
  function loadF(){
    if(!S.length)return;
    do{ cur=S[(Math.random()*S.length)|0]; }while(S.length>1&&cur===last); last=cur;
    fl.classList.remove('show');
    nfIcon.src=window.stratIcon(cur.ic); nfName.textContent=cur.n;
    /* the visual: a weapon render when the stratagem hands you one, else the icon large */
    const RW=(window.HD_IMG&&window.HD_IMG.weapons)||{}, nm=cur.n.toLowerCase();
    const wk=RW[cur.n]?cur.n:Object.keys(RW).find(k=>k.toLowerCase()===nm)||Object.keys(RW).find(k=>nm.endsWith(k.toLowerCase()));
    const vis=$('#nfVis'); if(vis){ vis.innerHTML=wk?`<img class="wpn" src="assets/img/weapons/${RW[wk]}" alt="">`:`<img class="big" src="${window.stratIcon(cur.ic)}" alt="">`; vis.classList.remove('in'); void vis.offsetWidth; vis.classList.add('in'); }
    const ART={ORBITAL:'cine-eaglestorm',EAGLE:'cine-eaglestorm','SUPPORT WEAPON':'cine-hangar',BACKPACK:'cine-hangar',DEFENSIVE:'cine-frostown',MISSION:'cine-bays',VEHICLE:'cine-marfark'};
    const bg=$('#nfArt .nc-bg'); if(bg) bg.src='assets/img/art/'+(ART[cur.cat]||'cine-hangar')+'.webp';
    pos=0; draw();
    nfHint.textContent=hold&&hold.down?'Input the code':HOLDMSG();
  }
  /* the card is a live stratagem input: the arrows sit dim until they are entered (or the card is tapped) */
  let pos=0, active=false, hold=null;
  const HOLDMSG=()=>'Hold '+(hold?hold.label():'Ctrl')+' and input the code';
  function draw(){ const rev=fl.classList.contains('show'); nfArr.innerHTML=cur.c.split('').map((d,i)=>window.arrowSVG(d,(rev||i<pos)?'hit':'wait')).join(''); }
  function flip(){
    if(!cur)return;
    if(fl.classList.contains('show')) loadF();
    else { fl.classList.add('show'); draw(); nfHint.textContent=cur.cat+' · '+(cur.cd||'no cooldown')+' · tap for the next one'; if(window.HDSFX&&window.HDSFX.ui) window.HDSFX.ui(); bump('hd_flash_n'); }
  }
  fl.addEventListener('click',flip);
  fl.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); flip(); } });
  new IntersectionObserver(es=>{ active=es[0].isIntersecting; },{threshold:.5}).observe(fl);
  const armBtn=$('#nfArm'), keyEl=$('#nfHoldKey');
  hold=window.HD.hold({when:()=>active,btn:armBtn,on:on=>{
    fl.classList.toggle('armed',on);
    if(armBtn){ armBtn.setAttribute('aria-pressed',String(on)); armBtn.textContent=on?'Stratagem out':'Take out stratagem'; }
    if(on){ nfHint.textContent='Input the code'; }
    else { if(pos>0){ pos=0; draw(); } if(!fl.classList.contains('show')) nfHint.textContent=HOLDMSG(); }
  }});
  const setKey=()=>{ if(keyEl) keyEl.textContent=hold.label(); if(!hold.down&&!fl.classList.contains('show')) nfHint.textContent=HOLDMSG(); };
  setKey(); document.addEventListener('hd:binds',setKey);
  const shake=()=>{ fl.classList.add('shake'); setTimeout(()=>fl.classList.remove('shake'),300); };
  function input(d){
    if(!cur)return;
    if(!hold.down){ nfHint.textContent='Hold '+hold.label()+' first, as in the field'; shake(); return; }
    if(cur.c[pos]===d){
      pos++; draw();
      if(pos>=cur.c.length){
        nfHint.textContent='STRATAGEM ACCEPTED'; fl.classList.add('flash-ok'); bump('hd_flash_ok'); if(window.HDSFX&&window.HDSFX.ok) window.HDSFX.ok();
        setTimeout(()=>{ fl.classList.remove('flash-ok'); loadF(); },520);
      }
    }else{ pos=0; draw(); nfHint.textContent='INPUT REJECTED'; shake(); }
  }
  const KEY={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',w:'U',a:'L',s:'D',d:'R',W:'U',A:'L',S:'D',D:'R'};
  addEventListener('keydown',e=>{
    const k=KEY[e.key]; if(!k||!active)return;
    if(e.target&&e.target.matches&&e.target.matches('input,select,textarea'))return;
    e.preventDefault(); input(k);
  });
  loadF();

  const E=window.HD_ENEMIES||[];
  const COL={TERMINID:'var(--bug)',AUTOMATON:'var(--bot)',ILLUMINATE:'var(--squid)'};
  let lastE=null;
  function loadE(){
    if(!E.length)return;
    let e; do{ e=E[(Math.random()*E.length)|0]; }while(E.length>1&&e===lastE); lastE=e;
    const card=$('#nowEnemy').closest('.now-c'); card.style.setProperty('--acc',COL[e.f]||'var(--gold)');
    const im=window.HD_IMG&&window.HD_IMG.enemies&&window.HD_IMG.enemies[e.n];
    const img=$('#neImg'); img.src=im?'assets/img/enemies/'+im:''; img.alt=e.n; img.classList.remove('in'); void img.offsetWidth; img.classList.add('in');
    /* a render sits as a unit; a wide screenshot becomes the band's picture */
    img.onload=()=>{ img.classList.toggle('wide',img.naturalWidth>img.naturalHeight*1.35); };
    const zm=$('#neZone'); if(zm&&window.HD_STATS&&window.HD_STATS.zoneMap){ const m=window.HD_STATS.zoneMap(e.n,im?'assets/img/enemies/'+im:''); zm.innerHTML=m||''; zm.hidden=!m; }
    const EART={TERMINID:'cine-nest',AUTOMATON:'cine-cyberstan',ILLUMINATE:'cine-overships'}; const bg=$('#neBg'); if(bg) bg.src='assets/img/art/'+(EART[e.f]||'cine-nest')+'.webp';
    $('#neName').textContent=e.n; $('#neSub').textContent=e.f+' · threat '+e.threat+'/5';
    $('#neWeak').textContent=e.weak; $('#neKill').textContent=e.kill;
    $('#neOpen').href='enemies.html?q='+encodeURIComponent(e.n);
  }
  $('#neNext').addEventListener('click',()=>{ loadE(); bump('hd_enemy_n'); if(window.HDSFX&&window.HDSFX.ui) window.HDSFX.ui(); });
  loadE();

  const ip=$('#nowInstall'), ib=$('#installBtn'), note=$('#installNote');
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  if(standalone) return;
  const showPrompt=()=>{ ip.hidden=false; ib.onclick=()=>{ window.HD.install&&window.HD.install().then(ok=>{ if(ok){ note.textContent='Installed. Open it from your home screen next dive.'; ib.hidden=true; } }); }; };
  if(window.HD.installPrompt) showPrompt();
  document.addEventListener('hd:caninstall',showPrompt);
  if(ios){ ip.hidden=false; ib.onclick=()=>{ note.textContent='In Safari: tap Share, then "Add to Home Screen". It opens full screen like an app.'; }; }
})();


})();

/* ============ hero gameplay reel ============
   Curated 4K Helldivers 2 captures by Seaborn (youtube.com/@SeabornFilms),
   played muted behind the banner and credited on screen. */
(function heroVid(){
  const box=document.getElementById('heroVid'); if(!box) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(innerWidth<900) return;
  const net=navigator.connection;
  if(net&&(net.saveData||/(^|-)2g$/.test(net.effectiveType||''))) return;

  /* v: video id · t: title · s: seconds in, picked around a third of the run */
  const CLIPS=[
    {v:'yxmyJEMgf7M',t:'No End To Them',s:20},
    {v:'JvMNuJl5zp8',t:'Dead Front',s:33},
    {v:'4FWCYds_9LM',t:'All Men Bow',s:36},
    {v:'D9RC4vJ09MA',t:'No One Is Missed',s:55},
    {v:'J6_Xndo7jnk',t:'Death Awaits',s:62},
    {v:'H54VwQUg0Y4',t:'Across Worlds Unnumbered',s:39},
    {v:'zp2sb03BUSQ',t:'We Are',s:58},
    {v:'GS9SdnrYlOc',t:'Into the Machine War',s:26},
    {v:'LMldgVezCz4',t:'Broken Man',s:38},
    {v:'tfJUokmIt60',t:'Shadow Breaks',s:48},
    {v:'jwvuLNYYI2A',t:'Press Unit',s:35},
    {v:'jM-wC04nC9E',t:'The Cape Belongs to None',s:36},
    {v:'Alx0AQAz5nY',t:'Our Bond',s:43},
    {v:'c4MdFGNWKV0',t:"It's Deletion",s:40},
    {v:'_BUcNWZp2lc',t:"A Helldiver's Guided Meditation",s:45},
    {v:'K7F3t68upKE',t:'Do Not Distribute',s:68}
  ];
  const CHAN='https://www.youtube.com/@SeabornFilms';
  const HOLD=23000;               /* seconds on screen per clip */
  const hero=document.querySelector('.hero');
  const credit=document.getElementById('heroCredit');
  let i=0, player=null, timer=null, watch=null, live=false, want=true;

  function say(c){
    if(!credit) return;
    credit.innerHTML='Now playing: <a href="https://www.youtube.com/watch?v='+c.v+'" target="_blank" rel="noopener noreferrer">'+
      c.t.replace(/[<>&]/g,'')+'</a> <span class="by">by Seaborn</span> &middot; '+
      '<a href="'+CHAN+'" target="_blank" rel="noopener noreferrer">youtube.com/@SeabornFilms</a>';
  }
  function play(n){
    const c=CLIPS[((n%CLIPS.length)+CLIPS.length)%CLIPS.length]; i=n;
    try{ player.loadVideoById({videoId:c.v,startSeconds:c.s,suggestedQuality:'hd1080'}); player.mute(); }catch(e){ return; }
    say(c);
  }
  function queue(){ clearTimeout(timer); timer=setTimeout(()=>play(i+1),HOLD); }

  window.onYouTubeIframeAPIReady=function(){
    const mount=document.createElement('div'); mount.id='hvMount'; box.appendChild(mount);
    const c=CLIPS[i];
    /* the film is only ever visible while YouTube reports "playing" (1); any other state
       hides the iframe at once so the player's pause glyph never reaches the banner */
    const hide=()=>{ box.classList.remove('on'); if(hero) hero.classList.remove('vid-on'); };
    player=new YT.Player('hvMount',{
      videoId:c.v,
      playerVars:{autoplay:1,mute:1,controls:0,rel:0,playsinline:1,fs:0,disablekb:1,cc_load_policy:0,
                  modestbranding:1,iv_load_policy:3,start:c.s,origin:location.origin},
      events:{
        onReady:e=>{ try{ e.target.mute(); e.target.playVideo(); }catch(err){} },
        onStateChange:e=>{ if(e.data!==1) hide(); },
        onError:()=>{ hide(); play(i+1); queue(); }
      }
    });
    /* the player's own events arrive unreliably behind a busy main thread,
       so the polled state is what drives the reveal and the rotation */
    let waited=0;
    watch=setInterval(()=>{
      let st; try{ st=player.getPlayerState(); }catch(e){ return; }
      if(st===1){
        waited=0;
        if(want&&!box.classList.contains('on')){ box.classList.add('on'); if(hero) hero.classList.add('vid-on'); }
        if(!live){ live=true; say(CLIPS[i]); queue(); }
      }else if(st===0){ play(i+1); queue(); }
      else if(want){ waited+=0.3; if(waited>8){ waited=0; try{ player.mute(); player.playVideo(); }catch(e){} } }
      if(st!==1&&box.classList.contains('on')) hide();
    },300);
  };

  /* stop burning frames while the banner is off screen or the tab is hidden */
  let onScreen=true, userPaused=false;
  function setActive(){
    if(hero){ const r=hero.getBoundingClientRect(); onScreen=r.bottom>0&&r.top<innerHeight; }
    want=onScreen&&!document.hidden&&!userPaused;
    if(!player) return;
    /* fade the film out before pausing so YouTube's pause glyph never shows; the poll fades it back once it plays */
    if(!want){ box.classList.remove('on'); if(hero) hero.classList.remove('vid-on'); }
    try{ want?player.playVideo():player.pauseVideo(); }catch(e){}
    if(want){ let n=0; const re=setInterval(()=>{ let st; try{ st=player.getPlayerState(); }catch(e){} if(st===1||!want||++n>3) return clearInterval(re); if(n===2){ play(i); } else if(n===1){ try{ player.mute(); player.playVideo(); }catch(e){} } },700); }
    if(want&&live) queue(); else clearTimeout(timer);
  }
  if(hero&&'IntersectionObserver' in window){
    new IntersectionObserver(es=>{ onScreen=es[0].isIntersecting; setActive(); },{threshold:.05}).observe(hero);
  }
  document.addEventListener('visibilitychange',setActive);

  window.__heroVid={clips:CLIPS,state:()=>{try{return player.getPlayerState()}catch(e){return 'no-player'}},
                    now:()=>CLIPS[i],live:()=>live,play:n=>play(n),want:()=>want,os:()=>onScreen,hid:()=>document.hidden,hero:()=>!!hero,pv:()=>{try{player.playVideo();return 'ok'}catch(e){return String(e)}},pause:()=>{try{player.pauseVideo();return 'ok'}catch(e){return String(e)}},on:()=>box.classList.contains('on')};

  const tag=document.createElement('script');
  tag.src='https://www.youtube.com/iframe_api'; tag.async=true;
  document.head.appendChild(tag);
})();

/* ---------- enlist: the list, and the callsign on the record ---------- */
(function enlist(){
  const {$}=window.HD; const f=$('#enlistForm'); if(!f) return;
  const box=$('#enForm'), fine=$('#enFine'), cnt=$('#enCount');
  const base=1204, seed=(()=>{ try{ return JSON.parse(localStorage.getItem('hd_enlist')||'null'); }catch(e){ return null; } })();
  if(seed){ box.classList.add('ok'); $('#enDoneMsg').textContent=`Welcome back, ${seed.callsign||'Helldiver'}. ${seed.email} is on the list.`; }
  try{ const pf=window.HD.profile&&window.HD.profile.get(); if(pf&&pf.callsign) f.callsign.value=pf.callsign; }catch(e){}
  if(cnt) cnt.textContent=(base+(seed?1:0)).toLocaleString('en-GB');
  f.addEventListener('submit',async e=>{
    e.preventDefault();
    const email=f.email.value.trim(), callsign=f.callsign.value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ f.email.focus(); fine.textContent='That email will not pass the Ministry. Check it and try again.'; fine.style.color='var(--red)'; return; }
    const rec={email,callsign,at:new Date().toISOString(),page:location.pathname};
    try{ localStorage.setItem('hd_enlist',JSON.stringify(rec)); }catch(e){}
    if(callsign&&window.HD.profile){ try{ const pf=window.HD.profile.get(); if(!pf.callsign) window.HD.profile.set({...pf,callsign}); }catch(e){} }
    /* uplink: set window.HD_ENLIST_ENDPOINT (a Formspree, Buttondown or own endpoint) to post the record */
    const ep=window.HD_ENLIST_ENDPOINT; let sent=false;
    if(ep){ try{ const r=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(rec)}); sent=r.ok; }catch(e){} }
    box.classList.add('ok'); if(cnt) cnt.textContent=(base+1).toLocaleString('en-GB');
    $('#enDoneMsg').textContent=(callsign?`Welcome to the Program, ${callsign}.`:'Welcome to the Program.')+(sent?' The list has you.':' Saved on this device; the list uplink is not live yet.');
    if(window.HDSFX&&window.HDSFX.ui) window.HDSFX.ui();
  });
})();


/* ---------- corrections desk ---------- */
(function feedback(){
  const {$}=window.HD; const f=$('#fbForm'); if(!f) return;
  const note=$('#fbNote'), copy=$('#fbCopy'), list=$('#fbRecent');
  const load=()=>{ try{ return JSON.parse(localStorage.getItem('hd_reports')||'[]'); }catch(e){ return []; } };
  const paint=()=>{ const r=load(); if(!r.length) return; list.innerHTML=r.slice(-3).reverse().map(x=>`<li><b>${x.where} · ${new Date(x.at).toLocaleDateString('en-GB')}${x.sent?' · sent':' · saved here'}</b>${x.what.replace(/</g,'&lt;')}</li>`).join(''); };
  paint();
  f.addEventListener('submit',async e=>{
    e.preventDefault(); const what=f.what.value.trim(); if(what.length<8){ f.what.focus(); note.textContent='Say what is wrong in a sentence or two.'; note.style.color='var(--red)'; return; }
    const rec={where:f.where.value,what,src:f.src.value.trim(),email:f.email.value.trim(),page:location.href,at:new Date().toISOString(),ua:navigator.userAgent.slice(0,80)};
    let sent=false; const ep=window.HD_FEEDBACK_ENDPOINT;
    if(ep){ try{ const r=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(rec)}); sent=r.ok; }catch(e){} }
    rec.sent=sent; const all=load(); all.push(rec); try{ localStorage.setItem('hd_reports',JSON.stringify(all.slice(-20))); }catch(e){}
    note.style.color=''; note.textContent=sent?'Filed. The desk has it.':'Saved on this device. The desk uplink is not configured yet, so copy the report and send it by hand.';
    copy.hidden=sent; copy.onclick=()=>{ navigator.clipboard.writeText(`HELLDIVE COMMAND report\nWhere: ${rec.where}\nWhat: ${rec.what}\nSource: ${rec.src||'none'}\nPage: ${rec.page}\nWhen: ${rec.at}`).then(()=>{ copy.textContent='Copied'; setTimeout(()=>copy.textContent='Copy report',1500); }).catch(()=>{}); };
    f.what.value=''; f.src.value=''; paint(); if(window.HDSFX&&window.HDSFX.ui) window.HDSFX.ui();
  });
})();

/* ---------- card 2 never sits empty: the three latest dispatches ---------- */
(function dsp(){
  const {$}=window.HD; const ul=$('#nowDsp'); if(!ul||!window.HDWar) return;
  window.HDWar.dispatch().then(d=>{ if(!Array.isArray(d)||!d.length) return;
    ul.innerHTML=d.slice(0,3).map(x=>{ const dt=new Date(x.published); const m=window.HDWar.clean(x.message); return `<li><b>${isNaN(dt)?'Dispatch':dt.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</b>${m.length>150?m.slice(0,147).replace(/\s+\S*$/,'')+'…':m}</li>`; }).join('');
    ul.hidden=false; }).catch(()=>{});
})();
