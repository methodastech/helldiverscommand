/* ============================================================
   FIELD OPS — the in-mission terminal interactions
   Step lists follow the in-game objective steps (wiki step lists).
   ============================================================ */
(function(){
'use strict';
const {$,$$}=window.HD;
const SFX=window.HDSFX;
const S=window.HD_STRATAGEMS||[];
const IMG=window.HD_IMG||{art:{}};
const art=k=>IMG.art&&IMG.art[k]?'assets/img/art/'+IMG.art[k]:'';
const KEY={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',w:'U',a:'L',s:'D',d:'R',W:'U',A:'L',S:'D',D:'R'};
const rnd=n=>(Math.random()*n)|0, pick=a=>a[rnd(a.length)];
const shuffle=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=rnd(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d;}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const code=n=>Array.from({length:n},()=>pick('UDLR')).join('');
/* interval driver: keeps accumulating real time even when a tab is throttled */
let driveGen=0;   /* every reset() retires the step loops that are still running, so an aborted step cannot touch a screen that is gone */
function drive(fn,persist){ let last=performance.now(); const g=driveGen; const iv=setInterval(()=>{ if(!persist&&g!==driveGen){ clearInterval(iv); return; } const t=performance.now(); const dt=Math.min(0.25,(t-last)/1000); last=t; if(fn(t,dt)===false) clearInterval(iv); },30); return ()=>clearInterval(iv); }
const fmt=t=>(t/1000).toFixed(1)+'s';

/* ---------- input bus ---------- */
const held={U:false,D:false,L:false,R:false};
let onKey=null, onHold=null, onOk=null, active=false;
addEventListener('keydown',e=>{
  if(!active||e.repeat)return;
  if(e.target&&e.target.matches&&e.target.matches('input,select,textarea'))return;
  if(e.key==='Enter'||e.key===' '){ e.preventDefault(); onOk&&onOk(); return; }
  if(e.key==='Escape'){ abort(); return; }
  const k=KEY[e.key]; if(!k)return; e.preventDefault(); SFX.wake();
  held[k]=true; onHold&&onHold(k,true); onKey&&onKey(k);
});
addEventListener('keyup',e=>{ const k=KEY[e.key]; if(!k)return; held[k]=false; onHold&&onHold(k,false); });
addEventListener('blur',()=>{ Object.keys(held).forEach(k=>{ if(held[k]){held[k]=false;onHold&&onHold(k,false);} }); });
const pad=$('#tmPad');
pad.innerHTML=[['u','U'],['l','L'],['r','R'],['d','D']].map(x=>`<button class="${x[0]}" data-d="${x[1]}" aria-label="${x[1]}">${window.arrowSVG(x[1]).replace(/^<span[^>]*>/,'').replace(/<\/span>$/,'')}</button>`).join('');
pad.style.display='grid';
pad.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();SFX.wake();const k=b.dataset.d;held[k]=true;onHold&&onHold(k,true);onKey&&onKey(k);});
['pointerup','pointercancel','pointerleave'].forEach(ev=>pad.addEventListener(ev,e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.d;if(held[k]){held[k]=false;onHold&&onHold(k,false);}}));
$('#tmOk').addEventListener('click',()=>onOk&&onOk());
/* controller: D-pad and left stick input, X / A confirms, holds work like held keys */
(function gamepad(){
  const btn={}; let stick=null;
  function edge(i,pressed,dn,up){ const was=!!btn[i]; btn[i]=pressed; if(pressed&&!was)dn&&dn(); if(!pressed&&was)up&&up(); }
  function poll(){
    const pads=navigator.getGamepads?navigator.getGamepads():[]; let gp=null; for(const p of pads){ if(p&&p.connected){gp=p;break;} }
    if(gp&&active){
      const b=i=>!!(gp.buttons[i]&&(gp.buttons[i].pressed||gp.buttons[i].value>0.5));
      const dirs={12:'U',13:'D',14:'L',15:'R'};
      Object.keys(dirs).forEach(i=>edge(+i,b(+i),()=>{const k=dirs[i];SFX.wake();held[k]=true;onHold&&onHold(k,true);onKey&&onKey(k);},()=>{const k=dirs[i];held[k]=false;onHold&&onHold(k,false);}));
      const ax=gp.axes[0]||0, ay=gp.axes[1]||0, mag=Math.hypot(ax,ay);
      const d=mag>0.6?(Math.abs(ax)>Math.abs(ay)?(ax>0?'R':'L'):(ay>0?'D':'U')):null;
      if(d!==stick){ if(stick){held[stick]=false;onHold&&onHold(stick,false);} if(d){held[d]=true;onHold&&onHold(d,true);onKey&&onKey(d);} stick=d; }
      edge(0,b(0),()=>onOk&&onOk());
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);
})();

/* ---------- command voice ---------- */
const C=window.HD_COMMS||{};
const radioEl=$('#tmRadio');
function say(txt){ if(!radioEl||!txt)return; const d=document.createElement('div'); const i=txt.indexOf(':'); d.innerHTML=i>0&&i<22?`<b>${txt.slice(0,i+1)}</b>${txt.slice(i+1)}`:txt; radioEl.appendChild(d); while(radioEl.children.length>3) radioEl.firstChild.remove(); setTimeout(()=>d.remove(),4300); }
const LOADOUT=['Eagle Airstrike','Orbital Precision Strike','Machine Gun Sentry','Reinforce'].map(n=>S.find(x=>x.n===n)).filter(Boolean);

/* ---------- step factories ---------- */
const ui=$('#tmUI'), hint=$('#tmHint');
let PH='';   /* " 2 / 3" phase counter, set by the runner from step.phase */
const DIRS_={U:[-1,0],D:[1,0],L:[0,-1],R:[0,1]};
/* the game's bottom prompt: keycaps plus a verb, then the step-specific instruction */
function setHint(text,verb){
  const enter=/enter|confirm/i.test(text||'');
  hint.innerHTML='<span class="pr"><span class="kc">W</span><span class="kc">A</span><span class="kc">S</span><span class="kc">D</span><b>'+(verb||'Interact')+'</b>'+(enter?'<span class="kc wide">Enter</span><b>Confirm</b>':'')+'</span>'+(text?'<em>'+text+'</em>':'');
}
const ph=(step,n,m)=>{ step.phase=[n,m]; return step; };
/* the objective line the game shows on the right: several sub-steps share one */
const ob=(step,label,grp)=>{ step.obj=label; if(grp) step.grp=grp; return step; };
/* long titles stay on one line, smaller, like the game's "REDIRECT FUEL TO NEW TARGET" */
function fitTitle(){ const t=ui.querySelector('.tu-title'); if(!t)return; const n=(t.childNodes[0]&&t.childNodes[0].textContent||'').trim().length; t.classList.toggle('long',n>22); t.classList.toggle('xlong',n>30); }

function reset(){ driveGen++; onKey=null; onHold=null; onOk=null; ui.innerHTML=''; ui.classList.remove('klaxon'); Object.keys(held).forEach(k=>held[k]=false); }
document.addEventListener('visibilitychange',()=>{ if(document.hidden) Object.keys(held).forEach(k=>held[k]=false); });
const wrong=()=>{ M.err++; $('#tmErr').textContent=M.err; SFX.bad(); ui.classList.add('shake'); setTimeout(()=>ui.classList.remove('shake'),300); };

/* move between stations: hold ↑ to sprint, with footfalls */
function travelStep(where,metres){
  return {label:'Move to '+where, run:()=>new Promise(res=>{
    let d=metres,done=false,lastStep=0;
    ui.innerHTML=`<div><div class="tu-title">Move to ${where}</div><div class="tu-sub">Hold W (↑) to sprint · <span id="tuM">${metres}</span> m</div><div class="arrows tu-arrows">${window.arrowSVG('U','wait')}</div><div class="tu-bar"><i id="tuB"></i></div></div>`;
    setHint('Hold W (↑) · you are exposed while moving');
    drive((t,dt)=>{ if(done)return false; const a=ui.querySelector('.arw'); if(!a)return false;
      if(held.U){ d=Math.max(0,d-7*dt); a.classList.add('hit'); if(t-lastStep>260){SFX.beep(180,0.03);lastStep=t;} } else a.classList.remove('hit');
      $('#tuM').textContent=Math.ceil(d); $('#tuB').style.width=(100-d/metres*100)+'%';
      if(d<=0){done=true;SFX.tick();setTimeout(res,300);return false;} });
  })};
}
/* a patrol finds you: call in one of your stratagems before the timer runs out */
function patrolStep(){
  return {label:'Patrol contact', interrupt:true, run:()=>new Promise(res=>{
    const s=pick(LOADOUT); let pos=0, secs=8, done=false;
    say(pick(C.threats||['Enemy patrol converging on your position'])+'. Call in '+s.n.toUpperCase()+'.');
    ui.innerHTML=`<div><div class="tu-title" style="color:#FF4433">Patrol contact</div><div class="tu-sub">Call in ${s.n} before they close · <span id="tuP">8.0</span> s</div><img src="${window.stratIcon(s.ic)}" alt="" style="width:64px;height:64px;margin:0 auto 10px"><div class="arrows tu-arrows" id="tuA"></div><div class="tu-bar"><i id="tuB" style="width:100%"></i></div></div>`;
    setHint('Enter the stratagem code'); ui.classList.add('klaxon'); SFX.klaxon();
    const draw=()=>{$('#tuA').innerHTML=s.c.split('').map((d,i)=>window.arrowSVG(d,i<pos?'hit':'wait')).join('');}; draw();
    const t0=performance.now();
    drive((t)=>{ if(done)return false; const left=Math.max(0,secs-(t-t0)/1000); $('#tuP').textContent=left.toFixed(1); $('#tuB').style.width=(left/secs*100)+'%';
      if(left<=0){ done=true; ui.classList.remove('klaxon'); M.err++; $('#tmErr').textContent=M.err; M.deaths=(M.deaths||0)+1; SFX.over(); say(pick((C.radio&&C.radio.death)||['HELLDIVER DOWN'])); setTimeout(res,900); return false; } });
    onKey=d=>{ if(done)return; if(s.c[pos]===d){SFX.dir(d);pos++;draw(); if(pos>=s.c.length){ done=true; ui.classList.remove('klaxon'); SFX.ok(); say(pick((C.radio&&(s.n.startsWith('Eagle')?C.radio.eagle_hit:s.n.startsWith('Orbital')?C.radio.orbital_hit:C.radio.pod_hit))||['Delivered'])); setTimeout(res,600);} } else { wrong(); pos=(s.c[0]===d)?1:0; draw(); } };
  })};
}
function codeStep(len,title,fixed,note){
  return {label:title, run:()=>new Promise(res=>{
    const c=fixed||code(len); let pos=0;
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="arrows tu-arrows" id="tuA"></div>${note?`<p class="tu-note">${note}</p>`:''}</div>`;
    setHint('Input the sequence · a wrong direction resets it');
    const draw=()=>{$('#tuA').innerHTML=c.split('').map((d,i)=>window.arrowSVG(d,i<pos?'hit':'wait')).join('');};
    draw();
    onKey=d=>{ if(c[pos]===d){SFX.dir(d);pos++;draw(); if(pos>=c.length){ SFX.ok(); setTimeout(res,380);} } else { wrong(); pos=(c[0]===d)?1:0; draw(); } };
  })};
}
/* waits: the wiki's real duration, played at 6x so nobody stares at a bar for a minute.
   The real figure is on screen, the Democracy Officer talks, and Enter skips. */
const WAIT_RATE=6;
const WAIT_CHAT=[
 'Diagnostics running. Try not to think about the bugs behind you.',
 'The Ministry of Science assures us this wait is character building.',
 'Every second here is a second of Managed Democracy being manufactured.',
 'If the bar stops moving, that is normal. Probably.',
 'Super Earth thanks you for your patience, Helldiver. Your patience has been logged.',
 'A previous operator asked why this takes so long. He is no longer an operator.',
 'The machine is thinking. Do not interrupt it with questions about democracy.',
 'Statistically, standing still is the second most dangerous thing you can do.',
 'Your Democracy Officer is watching the bar with you. He is unimpressed.',
 'Liberty does not load faster if you sigh at it.',
 'This delay has been approved by the Ministry of Truth and did not happen.',
 'Keep an eye on the treeline. The terminal has this part covered.'];
function waitStep(secs,title,lines){
  lines=lines||[];
  return {label:title, run:()=>new Promise(res=>{
    let done=false, chatI=rnd(WAIT_CHAT.length), lastChat=0;
    ui.innerHTML=`<div style="width:100%"><div class="tu-title">${title}${PH}</div>
      <div class="tu-sub">Please stand by &middot; <span id="tuT">${secs}</span> s &middot; <em class="tu-rate">${secs} s in the field, ${WAIT_RATE}&times; here</em></div>
      <div class="tu-bar"><i id="tuB"></i></div>
      <p class="tu-chat" id="tuChat"></p>
      ${lines.length?'<div class="tu-lines" id="tuL"></div>':''}
      <p class="tu-skip">Enter skips the wait</p></div>`;
    setHint('Enter skips the wait');
    const finish=()=>{ if(done)return; done=true; SFX.ok(); setTimeout(res,300); };
    onOk=finish;
    const t0=performance.now(), L=$('#tuL'); let shown=0;
    drive((t)=>{ if(done)return false;
      const p=Math.min(1,(t-t0)*WAIT_RATE/(secs*1000)); $('#tuB').style.width=(p*100)+'%'; $('#tuT').textContent=Math.ceil(secs*(1-p));
      if(t-lastChat>2600){ lastChat=t; const el=$('#tuChat'); if(el){ el.textContent=WAIT_CHAT[chatI%WAIT_CHAT.length]; chatI++; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); } }
      if(L){ const want=Math.floor(p*lines.length); while(shown<want){ L.textContent+=(shown?'\n':'')+lines[shown]; shown++; SFX.tick(); } }
      if(p>=1){ finish(); return false; } });
  })};
}
function signalStep(title){
  return {label:title, run:()=>new Promise(res=>{
    ui.innerHTML=`<div style="width:100%"><div class="tu-title">${title}${PH}</div><div class="tu-sub">Signal strength</div><div class="tu-big" id="tuP">0%</div><div class="tu-sig" id="tuS"><canvas id="tuC"></canvas><b id="tuN"></b></div><div class="tu-bar"><i id="tuB"></i></div></div>`;
    setHint('Hold A or D (← →) to tune · hold at 100% to lock');
    const target=15+Math.random()*70; let x=Math.random()<.5?4:96, lockT=0, done=false, lastBeep=0;
    const cv=$('#tuC'), cx=cv.getContext('2d'), sig=$('#tuS');
    const size=()=>{cv.width=sig.clientWidth*devicePixelRatio;cv.height=sig.clientHeight*devicePixelRatio;}; size();
    drive((t,dt)=>{
      if(done)return false;
      if(held.L) x=Math.max(0,x-18*dt); if(held.R) x=Math.min(100,x+18*dt);
      const strength=Math.max(0,Math.round(100-Math.abs(x-target)*1.5));
      $('#tuP').textContent=strength+'%'; $('#tuP').classList.toggle('lock',strength>=96);
      $('#tuN').style.left=x+'%';
      /* waveform: noise that resolves to a clean sine as strength rises */
      const W=cv.width,H=cv.height,q=strength/100; cx.clearRect(0,0,W,H); cx.strokeStyle='rgba(242,228,138,.9)'; cx.lineWidth=2*devicePixelRatio; cx.beginPath();
      for(let i=0;i<=W;i+=3){ const n=(Math.random()-.5)*(1-q)*H*.9; const s=Math.sin((i/W)*Math.PI*8+t/120)*H*.35*q; const y=H/2+s+n; i?cx.lineTo(i,y):cx.moveTo(i,y); } cx.stroke();
      if(strength>=96){ lockT+=dt; $('#tuB').style.width=Math.min(100,lockT/1.1*100)+'%'; if(t-lastBeep>140){SFX.beep(1200+strength*4,0.05);lastBeep=t;} if(lockT>=1.1){ done=true; SFX.ok(); setTimeout(res,420); return false; } }
      else { lockT=Math.max(0,lockT-dt*2); $('#tuB').style.width=Math.min(100,lockT/1.1*100)+'%'; if(t-lastBeep>Math.max(160,600-strength*4)){SFX.beep(300+strength*9,0.04);lastBeep=t;} }
    });
  })};
}
function dishStep(title){
  return {label:title, run:()=>new Promise(res=>{
    const target=Math.random()*360, W=15; let h=(target+120+Math.random()*120)%360, inT=0, done=false, lastBeep=0;
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="tu-sub">Heading <span id="tuH">000</span>° · target sector marked</div>
      <div class="tu-dish"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke="rgba(242,228,138,.35)" stroke-width="1"/>
      <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(242,228,138,.18)" stroke-width="1" stroke-dasharray="3 5"/>
      <path id="tuSec" fill="rgba(255,224,27,.25)" stroke="var(--gold)" stroke-width="1.5"/>
      <g id="tuArrow"><path d="M100 22 L108 46 L100 40 L92 46 Z" fill="#7BD16A"/><line x1="100" y1="40" x2="100" y2="100" stroke="#7BD16A" stroke-width="2"/></g>
      <circle cx="100" cy="100" r="5" fill="#F2E48A"/>
      ${[0,90,180,270].map(a=>`<text x="${100+80*Math.sin(a*Math.PI/180)}" y="${100-80*Math.cos(a*Math.PI/180)+4}" text-anchor="middle" font-size="10" fill="rgba(242,228,138,.7)" font-family="Barlow Semi Condensed, sans-serif">${['N','E','S','W'][a/90]}</text>`).join('')}
      </svg></div><div class="tu-bar"><i id="tuB"></i></div></div>`;
    setHint('Hold A or D (← →) to steer the dish · it beeps when aligned');
    const arc=(a0,a1)=>{const r=88,p=a=>[100+r*Math.sin(a*Math.PI/180),100-r*Math.cos(a*Math.PI/180)];const [x0,y0]=p(a0),[x1,y1]=p(a1);return `M100 100 L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z`;};
    $('#tuSec').setAttribute('d',arc(target-W,target+W));
    drive((t,dt)=>{
      if(done)return false;
      if(held.L) h=(h-55*dt+360)%360; if(held.R) h=(h+55*dt)%360;
      $('#tuArrow').setAttribute('transform',`rotate(${h} 100 100)`);
      let diff=Math.abs(((h-target)%360+540)%360-180);
      const inside=diff<=W; $('#tuH').style.color=inside?'#7BD16A':''; $('#tuH').textContent=String(Math.round(h)).padStart(3,'0')+(inside?' ALIGNED':'');
      if(inside){ inT+=dt; if(t-lastBeep>300){SFX.beep(1600,0.06);lastBeep=t;} if(inT>=0.9){done=true;SFX.ok();setTimeout(res,400);return false;} }
      else inT=Math.max(0,inT-dt*2);
      $('#tuB').style.width=Math.min(100,inT/0.9*100)+'%';
    });
  })};
}
function fusesStep(n,title,noun){
  return {label:title, run:()=>new Promise(res=>{
    const f=Array.from({length:n},()=>pick('UDLR')); let i=0;
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="tu-sub">${n} ${noun||'fuses'} tripped · reset in order</div><div class="tu-fuses" id="tuF"></div></div>`;
    setHint('Press the direction shown on the active '+(noun?noun.replace(/s$/,''):'fuse'));
    const draw=()=>{$('#tuF').innerHTML=f.map((d,k)=>`<div class="tu-fuse ${k<i?'ok':k===i?'now':''}">${window.arrowSVG(d)}<i>${(noun||'FUSE').replace(/s$/,'').toUpperCase()} ${k+1}</i></div>`).join('');};
    draw();
    onKey=d=>{ if(f[i]===d){SFX.dir(d);i++;draw(); if(i>=n){SFX.ok();setTimeout(res,400);} } else { wrong(); const el=$('#tuF').children[i]; el.classList.add('bad'); setTimeout(()=>el.classList.remove('bad'),300); } };
  })};
}
function holdStep(dir,secs,title,sub){
  return {label:title, run:()=>new Promise(res=>{
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="tu-sub">${sub||'Hold to operate'}</div><div class="arrows tu-arrows">${window.arrowSVG(dir,'wait')}</div><div class="tu-bar"><i id="tuB"></i></div></div>`;
    setHint('Hold the direction · releasing resets');
    let p=0,done=false;
    drive((t,dt)=>{ if(done)return false;
      const a=ui.querySelector('.arw'); if(!a) return false;
      if(held[dir]){ p+=dt; a.classList.add('hit'); } else { p=0; a.classList.remove('hit'); }
      $('#tuB').style.width=Math.min(100,p/secs*100)+'%';
      if(p>=secs){done=true;SFX.ok();setTimeout(res,380);return false;} });
  })};
}
/* valves: hold the direction until the valve glows, then the terminal beeps to confirm (wiki: "hold ... until they glow") */
function valveStep(title,light){
  return {label:title, run:()=>new Promise(res=>{
    const col=light==='yellow'?'#f2d21e':'#7bd16a';
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="tu-sub">Hold D: two turns counterclockwise until the ${light==='yellow'?'yellow':'green'} light</div><div class="tu-valve" id="tuV"><b>&#8634;</b></div><div class="tu-bar"><i id="tuB"></i></div></div>`;
    setHint('At the valve: hold D (right) for two full turns until the light comes on');
    let p=0,done=false; const v=$('#tuV');
    drive((t,dt)=>{ if(done)return false;
      if(held.R){ p+=dt; } else { p=Math.max(0,p-dt*1.5); }
      v.style.transform=`rotate(${-p/1.6*720}deg)`; $('#tuB').style.width=Math.min(100,p/1.6*100)+'%';
      if(p>=1.6){ done=true; v.classList.add('glow'); v.style.boxShadow=`0 0 40px ${col}`; v.style.borderColor=col; SFX.beep(1500,0.18); setTimeout(()=>{SFX.ok();res();},520); return false; } });
  })};
}
function mashStep(dir,count,title){
  return {label:title, run:()=>new Promise(res=>{
    let n=0;
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="tu-sub">Turn the valve · press ${dir==='R'?'D (→)':'A (←)'} until it glows</div><div class="tu-valve" id="tuV"><b>0</b></div></div>`;
    setHint('Press the direction repeatedly');
    onKey=d=>{ if(d!==dir){wrong();return;} n++; SFX.dir(d); const v=$('#tuV'); v.style.transform=`rotate(${n*45}deg)`; v.querySelector('b').textContent=n; if(n>=count){ v.classList.add('glow'); SFX.ok(); onKey=null; setTimeout(res,500);} };
  })};
}
function dialsStep(title){
  return {label:title, run:()=>new Promise(res=>{
    const target=Array.from({length:5},()=>rnd(10)); const cur=[0,0,0,0,0]; let ci=0;
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="tu-sub">Launch code on the objectives list</div><div class="tu-code">${target.join(' ')}</div><div class="tu-dials" id="tuD"></div><p class="tu-sub" style="margin-top:18px">W S (↑ ↓) set digit · A D (← →) move · Enter confirm</p></div>`;
    setHint('Set all five dials, then confirm');
    const draw=()=>{$('#tuD').innerHTML=cur.map((v,k)=>`<div class="tu-dial ${k===ci?'now':''}">${v}</div>`).join('');};
    draw();
    onKey=d=>{ if(d==='U'){cur[ci]=(cur[ci]+1)%10;} else if(d==='D'){cur[ci]=(cur[ci]+9)%10;} else if(d==='R'){ci=(ci+1)%5;} else if(d==='L'){ci=(ci+4)%5;} SFX.dir(d); draw(); };
    onOk=()=>{ if(cur.join('')===target.join('')){ SFX.ok(); onKey=null; onOk=null; setTimeout(res,400);} else wrong(); };
  })};
}
function chooseStep(options,correct,title){
  return {label:title, run:()=>new Promise(res=>{
    let ci=0;
    ui.innerHTML=`<div style="width:100%"><div class="tu-title">${title}${PH}</div><div class="tu-sub">W S (↑ ↓) select · Enter confirm</div><div class="tu-opts" id="tuO"></div></div>`;
    setHint('Select the destination');
    const draw=()=>{$('#tuO').innerHTML=options.map((o,k)=>`<div class="tu-opt ${k===ci?'now':''}">${k===ci?'▸ ':''}${o}</div>`).join('');};
    draw();
    onKey=d=>{ if(d==='U')ci=(ci+options.length-1)%options.length; if(d==='D')ci=(ci+1)%options.length; SFX.dir(d); draw(); };
    onOk=()=>{ if(options[ci]===correct){SFX.ok();onKey=null;onOk=null;setTimeout(res,400);} else wrong(); };
  })};
}
function countdownStep(secs,title,sub,klaxon){
  return {label:title, run:()=>new Promise(res=>{
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="tu-sub">${sub||''}</div><div class="tu-big" id="tuP">${secs}</div></div>`;
    setHint('Stand clear · Enter skips'); if(klaxon) ui.classList.add('klaxon');
    let n=secs; const g=driveGen; const fin=()=>{ clearInterval(iv); onOk=null; ui.classList.remove('klaxon'); res(); };
    const iv=setInterval(()=>{ if(g!==driveGen){clearInterval(iv);return;} n--; if(!$('#tuP')){clearInterval(iv);return;} $('#tuP').textContent=n; SFX.beep(n<=3?1400:900,0.08); if(n<=0) fin(); },1000);
    onOk=fin;
  })};
}
function escapeStep(metres,secs,title){
  /* the game asks you to run; we tell you how far and how long, then move on. No sprint minigame. */
  return {label:title||'Get clear', run:()=>new Promise(res=>{
    ui.innerHTML=`<div style="width:100%"><div class="tu-title">${title||'Get clear'}${PH}</div>
      <div class="tu-run"><b>${metres} m</b><i>get clear</i><b>${secs} s</b><i>before it goes</i></div>
      <div class="tu-sub">Sprint away now. Shift + W in the field. Nothing to input here.</div>
      <p class="tu-note">Press Enter when you are clear</p></div>`;
    setHint('Run. Enter continues'); ui.classList.add('klaxon'); SFX.beep(900,0.08);
    onOk=()=>{ onOk=null; ui.classList.remove('klaxon'); M.extra=`Cleared ${metres} m.`; res(); };
  })};
}
function shellsStep(){
  return {label:'Load five shells', run:()=>new Promise(res=>{
    const TYPES=[['Explosive','#7BD16A'],['High-Yield Explosive','#FFE01B'],['Smoke','#9AA3B4'],['Static Field','#3DA9FF'],['Napalm','#FF7A18'],['Mini-Nuke','#FF4433']];
    const avail=shuffle([...TYPES,...TYPES.slice(0,2)]).slice(0,7); const slots=[]; let ci=0; const used=new Set();
    ui.innerHTML=`<div style="width:100%"><div class="tu-title">Load the cannon</div><div class="tu-sub">Shells fire in the order loaded · first in, first out</div><div class="tu-shells"><div id="tuSh"></div><div><div class="tu-sub" style="margin-bottom:8px">Loaded</div><div class="tu-slots" id="tuSl"></div><p class="tu-sub" style="margin-top:16px;text-transform:none;letter-spacing:.06em">Doctrine: load the Mini-Nuke or High-Yield first so your first call-in is the one that matters.</p></div></div></div>`;
    setHint('W S (↑ ↓) pick a shell · Enter loads it');
    const draw=()=>{ $('#tuSh').innerHTML=avail.map((s,k)=>`<div class="tu-shell ${k===ci?'now':''} ${used.has(k)?'used':''}"><i style="background:${s[1]}"></i>${s[0]}</div>`).join('');
      $('#tuSl').innerHTML=[0,1,2,3,4].map(k=>`<div class="tu-slot ${slots[k]?'f':''}">${slots[k]?slots[k][0].split(' ')[0]:k+1}</div>`).join(''); };
    draw();
    onKey=d=>{ if(d==='U')ci=(ci+avail.length-1)%avail.length; if(d==='D')ci=(ci+1)%avail.length; SFX.dir(d); draw(); };
    onOk=()=>{ if(used.has(ci)){wrong();return;} used.add(ci); slots.push(avail[ci]); SFX.dir('D'); draw(); if(slots.length>=5){ onKey=null;onOk=null; SFX.ok();
      const first=slots[0][0]; M.extra='Firing order: '+slots.map(s=>s[0]).join(' → ')+'. '+(/Nuke|High/.test(first)?'Optimal: the heavy shell fires first.':'The heavy shell is buried: your first call-in will be a '+first+'.'); setTimeout(res,500);} };
  })};
}


/* the in-game confirm screens: one direction press on a lit button */
function pressStep(dir,title,btn,note){
  return {label:title, run:()=>new Promise(res=>{
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="tu-btn armed" id="tuBtn"><span class="arrows">${window.arrowSVG(dir,'wait')}</span><i class="tu-redblock"></i><b>${btn}</b></div><p class="tu-note">${note||''}</p></div>`;
    setHint('Press '+({U:'W',D:'S',L:'A',R:'D'}[dir])+' on the lit control');
    let done=false;
    onKey=d=>{ if(done)return; if(d!==dir){wrong();return;} done=true; $('#tuBtn').classList.add('hit'); SFX.ok(); setTimeout(res,450); };
  })};
}
/* pipe routing (fuel pumps, E-710 flow), as in the game: A D pick a column, W S move that column's pipes up or down
   (the column cycles), locked columns cannot move. Pieces never rotate. Flow shows in red once it connects. */
function pipeStep(title,src,targets,correct,note){
  return {label:title, run:()=>new Promise(res=>{
    const R=3,Cn=4, OPP={N:'S',S:'N',E:'W',W:'E'}, DIRS={N:[-1,0],S:[1,0],E:[0,1],W:[0,-1]};
    const tRow=targets[0]===correct?0:R-1, wrongRow=tRow===0?R-1:0;
    /* solution path from the outflow (row 1, west edge) to the correct exit (east edge) */
    const path=[[1,0]]; { let r=1,c=0; while(!(r===tRow&&c===Cn-1)){ const opts=[]; if(c<Cn-1)opts.push('E'); if(r<tRow)opts.push('S'); if(r>tRow)opts.push('N'); const d=pick(opts); r+=DIRS[d][0]; c+=DIRS[d][1]; path.push([r,c]); } }
    const SHAPES=[['N','S'],['E','W'],['N','E'],['E','S'],['S','W'],['W','N']];
    const cols=Array.from({length:Cn},()=>Array.from({length:R},()=>new Set(pick(SHAPES))));   /* cols[c][r] */
    path.forEach(([r,c],i)=>{ const prev=i?path[i-1]:[1,-1], next=i<path.length-1?path[i+1]:[tRow,Cn];
      const din=prev[0]<r?'N':prev[0]>r?'S':prev[1]<c?'W':'E', dout=next[0]<r?'N':next[0]>r?'S':next[1]<c?'W':'E'; cols[c][r]=new Set([din,dout]); });
    /* two columns are padlocked in the solved position; the rest are shifted off by a random amount, at least one of them */
    const locked=new Set(shuffle([0,1,2,3]).slice(0,2)); const off=[0,0,0,0]; let moved=0;
    for(let c=0;c<Cn;c++){ if(locked.has(c))continue; off[c]=rnd(R); if(off[c])moved++; }
    if(!moved){ const c=[0,1,2,3].find(x=>!locked.has(x)); off[c]=1+rnd(R-1); }
    const tile=(c,r)=>cols[c][((r-off[c])%R+R)%R];
    const free=[0,1,2,3].filter(c=>!locked.has(c)); let ci=0, done=false, lastBad=false;
    /* the game colours every piece by the port it is joined to: red = the target network, white = the wrong storage, grey = joined to neither */
    function flood(r0,c0,need){ const seen=new Set(); if(!tile(c0,r0).has(need)) return seen; const q=[[r0,c0]]; seen.add(r0+','+c0);
      while(q.length){ const [r,c]=q.shift(); for(const d of tile(c,r)){ const nr=r+DIRS[d][0], nc=c+DIRS[d][1]; if(nr<0||nr>=R||nc<0||nc>=Cn)continue; if(!tile(nc,nr).has(OPP[d]))continue; const k=nr+','+nc; if(seen.has(k))continue; seen.add(k); q.push([nr,nc]); } }
      return seen; }
    /* drawing: 46 px tiles on an 880-wide screen, pipe = dark outline, body, light centre line, two flange bars at every open end */
    const T=34, GY=88, INK={red:['#5d1a14','#d63a2c','#f0928a'],white:['#6a6e72','#dcdfe2','#ffffff'],grey:['#35383b','#6d7175','#8f9397']};
    const CW=9.4;   /* label glyph width at 17px, used to centre the whole composition like the game does */
    const leftW=src.length*CW+44+13+12, rightW=Math.max(correct.length,(targets.find(t=>t!==correct)||'').length)*CW+44+13+14;
    const GX=Math.round((880-(leftW+Cn*T+rightW))/2+leftW);
    const edge={N:(x,y)=>`${x+23} ${y}`,S:(x,y)=>`${x+23} ${y+46}`,E:(x,y)=>`${x+46} ${y+23}`,W:(x,y)=>`${x} ${y+23}`};
    const tube=(d,ink)=>{ const [o,m,l]=INK[ink]; return `<path d="${d}" stroke="${o}" stroke-width="13"/><path d="${d}" stroke="${m}" stroke-width="9"/><path d="${d}" stroke="${l}" stroke-width="1.6"/>`; };
    function piece(px,py,dirs,ink){ const x=0,y=0,k=T/46; const [a,b]=[...dirs]; let s=tube(`M${edge[a](x,y)} L${x+23} ${y+23} L${edge[b](x,y)}`,ink); const m=INK[ink][1];
      for(const dd of dirs){
        if(dd==='N') s+=`<rect x="${x+15}" y="${y+3}" width="16" height="2.2" fill="${m}"/><rect x="${x+15}" y="${y+7.5}" width="16" height="2.2" fill="${m}"/>`;
        if(dd==='S') s+=`<rect x="${x+15}" y="${y+40.8}" width="16" height="2.2" fill="${m}"/><rect x="${x+15}" y="${y+36.3}" width="16" height="2.2" fill="${m}"/>`;
        if(dd==='W') s+=`<rect x="${x+3}" y="${y+15}" width="2.2" height="16" fill="${m}"/><rect x="${x+7.5}" y="${y+15}" width="2.2" height="16" fill="${m}"/>`;
        if(dd==='E') s+=`<rect x="${x+40.8}" y="${y+15}" width="2.2" height="16" fill="${m}"/><rect x="${x+36.3}" y="${y+15}" width="2.2" height="16" fill="${m}"/>`; }
      return `<g transform="translate(${px},${py}) scale(${k})">${s}</g>`; }
    const stub=(x,y,ink,len=44)=>{ const m=INK[ink][1]; return tube(`M${x} ${y} H${x+len}`,ink)+`<rect x="${x+len*0.3}" y="${y-8}" width="2.2" height="16" fill="${m}"/><rect x="${x+len*0.3+5}" y="${y-8}" width="2.2" height="16" fill="${m}"/>`; };
    const boxIcon=(x,y,col)=>`<rect x="${x}" y="${y}" width="13" height="13" fill="none" stroke="${col}" stroke-width="2.2"/><rect x="${x+4}" y="${y+4}" width="5" height="5" fill="${col}"/>`;
    const xIcon=(x,y,col)=>`<rect x="${x}" y="${y}" width="13" height="13" fill="none" stroke="${col}" stroke-width="2"/><path d="M${x+2.5} ${y+2.5} L${x+10.5} ${y+10.5} M${x+10.5} ${y+2.5} L${x+2.5} ${y+10.5}" stroke="${col}" stroke-width="2"/>`;
    const lock=(x,y)=>`<g transform="translate(${x},${y}) scale(1.05)"><path d="M4 8V5.5a4 4 0 0 1 8 0V8" fill="none" stroke="#3d72e6" stroke-width="2.4"/><rect x="1" y="8" width="14" height="9.5" rx="1.5" fill="#3d72e6"/></g>`;
    const arrow=(x,y,down)=>`<path d="M8 1 L14.5 8 H11 V16 H5 V8 H1.5 Z" fill="#e0392c" transform="translate(${x},${y}) scale(0.95)${down?' rotate(180 8 8.5)':''}"/>`;
    const label=(x,y,t,anchor)=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="tu-lab">${t.toUpperCase()}</text>`;
    function draw(){
      const red=flood(tRow,Cn-1,'E'), white=flood(wrongRow,Cn-1,'E'), sel=free[ci], srcOpen=tile(0,1).has('W');
      let s='';
      for(let r=0;r<R;r++)for(let c=0;c<Cn;c++){ const k=r+','+c; s+=piece(GX+c*T,GY+r*T,tile(c,r),red.has(k)?'red':white.has(k)?'white':'grey'); }
      for(let c=0;c<Cn;c++){ const x=GX+c*T+T/2-8.4; if(locked.has(c)) s+=lock(x,GY-26)+lock(x,GY+R*T+9); else if(c===sel) s+=arrow(x,GY-25,false)+arrow(x,GY+R*T+9,true); }
      const sy=GY+T+T/2; s+=stub(GX-46,sy,'red')+boxIcon(GX-64,sy-6.5,'#d63a2c')+label(GX-74,sy+6,src,'end');
      for(const [row,name] of [[tRow,correct],[wrongRow,targets.find(t=>t!==correct)]]){ const y=GY+row*T+T/2, isT=row===tRow;
        s+=stub(GX+Cn*T+2,y,isT?'red':'white')+(isT?boxIcon(GX+Cn*T+50,y-6.5,'#d63a2c'):xIcon(GX+Cn*T+50,y-6.5,'#d7dadd'))+label(GX+Cn*T+72,y+6,name,'start'); }
      $('#tuSvg').innerHTML=s;
      return {ok:srcOpen&&red.has('1,0'), bad:srcOpen&&white.has('1,0')};
    }
    ui.innerHTML=`<div style="width:100%"><div class="tu-title">${title}${PH}</div><div class="tu-route"><svg class="tu-pipesvg" viewBox="0 0 880 280" id="tuSvg" fill="none" stroke-linejoin="round" stroke-linecap="butt"></svg></div><p class="tu-note">${note||'Please adjust routing protocol'}</p></div>`;
    setHint('A D pick a column · W S slide its pipes · padlocked columns stay put','Select and adjust pipes');
    lastBad=draw().bad;
    onKey=d=>{ if(done)return;
      if(d==='L'){ci=(ci+free.length-1)%free.length;SFX.tick();} else if(d==='R'){ci=(ci+1)%free.length;SFX.tick();}
      else { const c=free[ci]; off[c]=((off[c]+(d==='U'?-1:1))%R+R)%R; SFX.dir(d); }
      const f=draw();
      if(f.ok){ done=true; SFX.ok(); setTimeout(res,2000); }
      else if(f.bad&&!lastBad){ wrong(); }
      lastBad=f.bad; };
  })};
}
/* sub-system switches (SEAF SAM site): select with A D, set with W S, all five must read active */
function switchesStep(title,labels,offCount,note,verb){
  return {label:title, run:()=>new Promise(res=>{
    const st=labels.map(()=>true); shuffle(labels.map((_,i)=>i)).slice(0,offCount).forEach(i=>st[i]=false);
    let ci=Math.max(0,st.indexOf(false)), done=false;
    ui.innerHTML=`<div style="width:100%"><div class="tu-title">${title}${PH}</div><div class="tu-sw" id="tuSw"></div><p class="tu-note">${note||''}</p></div>`;
    setHint(verb?'A D select · W checks it':'A D select a sub-system · W S change the switch',verb||'Change button and activate');
    const draw=()=>{$('#tuSw').innerHTML=labels.map((l,i)=>`<div class="sw ${st[i]?'on':'off'} ${i===ci?'now':''}"><b><i></i></b><span>${l}</span></div>`).join('');};
    draw();
    onKey=d=>{ if(done)return;
      if(d==='L'){ci=(ci+labels.length-1)%labels.length;SFX.tick();} else if(d==='R'){ci=(ci+1)%labels.length;SFX.tick();} else { st[ci]=(d==='U'); SFX.dir(d); }
      draw(); if(st.every(Boolean)){ done=true; SFX.ok(); setTimeout(res,520); } };
  })};
}
/* security grid (Compromise Automaton Defenses, Cyborg assembly unit), as the guides describe it: symbols in columns on the
   left, the target pattern on the right. A D pick a column, W S shift that column's symbols up or down (they cycle).
   Solved when every red symbol sits in the row the pattern asks for. */
function gridStep(title,n,note){
  return {label:title, run:()=>new Promise(res=>{
    /* machine glyphs, not a human alphabet: the Automaton script is angular and blocky, and
       borrowing Cyrillic letters read as Russian rather than as machine code */
    const Cn=5,R=4, GL='\u25E4\u25E5\u25E3\u25E2\u25A3\u25A4\u25A5\u25A6\u25A7\u25A8\u25E7\u25E8\u25E9\u25EA\u25F0\u25F1\u25F2\u25F3\u2B1F\u2B22'.split('');
    const marks=Array.from({length:Cn},()=>{ const k=n<=2?1:n<=5?1+rnd(2):2; return shuffle([0,1,2,3]).slice(0,k).sort(); });   /* target rows per column */
    const off=marks.map(()=>rnd(R)); if(!off.some(o=>o)) off[rnd(Cn)]=1+rnd(R-1);
    const glyph=Array.from({length:Cn},()=>Array.from({length:R},()=>pick(GL)));
    let ci=0, done=false;
    const at=(c,r)=>((r-off[c])%R+R)%R;      /* which source row shows at display row r */
    function draw(){
      let left=''; for(let c=0;c<Cn;c++){ left+=`<div class="sg-col ${c===ci?'sel':''}">`; for(let r=0;r<R;r++){ const sr=at(c,r); left+=`<i class="${marks[c].includes(sr)?'on':''}">${glyph[c][sr]}</i>`; } left+='</div>'; }
      let right=''; for(let r=0;r<R;r++)for(let c=0;c<Cn;c++){ const t=marks[c].includes(r); right+=`<i class="${t?'t':''} ${t&&off[c]===0?'ok':''}">${t?glyph[c][r]:''}</i>`; }
      $('#tuSym').innerHTML=left; $('#tuG').innerHTML=right;
    }
    ui.innerHTML=`<div style="width:100%"><div class="tu-title">${title}${PH}</div><div class="tu-sec">
      <svg class="tu-circuit" viewBox="0 0 620 210" aria-hidden="true" fill="none" stroke="#cfd3d8" stroke-width="1.4" stroke-opacity=".55">
        <rect x="8" y="62" width="46" height="40" rx="2" stroke-opacity=".35"/><path d="M12 70h10M12 78h16M12 86h10M12 94h16" stroke-opacity=".3"/>
        <path d="M54 70h16l10-9h26M54 94h16l10 9h26" stroke-opacity=".35"/>
        <path d="M300 26h44l16 16h58M300 184h44l16-16h58" />
        <path d="M418 42h26l14 14v34l14 14h40M418 168h26l14-14v-34l14-14h40" />
        <path d="M556 104h50M96 104h28" stroke-opacity=".3"/>
        <g stroke-opacity=".5"><path d="M470 18v8M486 18v8M502 18v8"/><path d="M470 192v-8M486 192v-8M502 192v-8"/></g>
      </svg>
      <div class="tu-sym" id="tuSym"></div><div class="tu-grid" id="tuG"></div></div><p class="tu-note">${note||'Match security grid pattern'}</p></div>`;
    setHint('A D choose a column · W S shift its symbols · match the red symbols to the pattern');
    draw();
    onKey=d=>{ if(done)return;
      if(d==='L'){ci=(ci+Cn-1)%Cn;SFX.tick();} else if(d==='R'){ci=(ci+1)%Cn;SFX.tick();}
      else { off[ci]=((off[ci]+(d==='U'?-1:1))%R+R)%R; SFX.dir(d); }
      draw();
      if(off.every(o=>o===0)){ done=true; SFX.ok(); setTimeout(res,460); } };
  })};
}
/* TA relay: steer the dial onto the marked bearing with A D, then press W on START TRANSFER */
function dialTransferStep(title,note){
  return {label:title, run:()=>new Promise(res=>{
    const target=Math.random()*360, W=14; let h=(target+120+Math.random()*120)%360, inT=0, armed=false, done=false, lastBeep=0;
    ui.innerHTML=`<div style="width:100%"><div class="tu-title">${title}${PH}</div><div class="tu-relay"><div class="tu-dish sm"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/><path id="tuSec" fill="rgba(255,224,27,.25)" stroke="var(--gold)" stroke-width="1.5"/><g id="tuArrow"><line x1="100" y1="100" x2="100" y2="24" stroke="#F2E48A" stroke-width="2.5" stroke-dasharray="6 4"/></g><circle cx="100" cy="100" r="5" fill="#F2E48A"/><text id="tuX" x="100" y="16" text-anchor="middle" font-size="14" fill="#FF4433" font-family="Barlow Semi Condensed, sans-serif">&#10006;</text></svg></div><div class="tu-btn" id="tuBtn"><span class="arrows">${window.arrowSVG('U','wait')}</span><i class="tu-redblock"></i><b>Start transfer</b></div></div><div class="tu-bar"><i id="tuB"></i></div><p class="tu-note">${note||''}</p></div>`;
    setHint('Hold A D to turn the dial · W starts the transfer once aligned');
    const arc=(a0,a1)=>{const r=88,p=a=>[100+r*Math.sin(a*Math.PI/180),100-r*Math.cos(a*Math.PI/180)];const [x0,y0]=p(a0),[x1,y1]=p(a1);return `M100 100 L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z`;};
    $('#tuSec').setAttribute('d',arc(target-W,target+W));
    drive((t,dt)=>{ if(done)return false;
      if(!armed){ if(held.L) h=(h-55*dt+360)%360; if(held.R) h=(h+55*dt)%360; }
      $('#tuArrow').setAttribute('transform',`rotate(${h} 100 100)`); $('#tuX').setAttribute('transform',`rotate(${target} 100 100)`);
      const diff=Math.abs(((h-target)%360+540)%360-180), inside=diff<=W;
      if(!armed){ if(inside){ inT+=dt; if(t-lastBeep>300){SFX.beep(1600,0.06);lastBeep=t;} if(inT>=0.9){ armed=true; $('#tuBtn').classList.add('armed'); $('#tuX').setAttribute('fill','#7BD16A'); SFX.tick(); } } else inT=Math.max(0,inT-dt*2); $('#tuB').style.width=Math.min(100,inT/0.9*100)+'%'; }
    });
    onKey=d=>{ if(done||d!=='U')return; if(!armed){ wrong(); return; } done=true; $('#tuBtn').classList.add('hit'); SFX.ok(); setTimeout(res,500); };
  })};
}
/* an in-mission wait shown in game time, six times faster than real time like the Field Drill */
function etaStep(gameSecs,title,sub,rate){
  return {label:title, run:()=>new Promise(res=>{
    rate=rate||WAIT_RATE; let left=gameSecs, done=false;
    ui.innerHTML=`<div><div class="tu-title">${title}${PH}</div><div class="tu-sub">${sub||''} &middot; <em class="tu-rate">${Math.round(gameSecs)} s in the field, ${rate}&times; here</em></div><div class="tu-big" id="tuP">--:--</div><div class="tu-bar"><i id="tuB" style="width:100%"></i></div><p class="tu-chat" id="tuChat"></p><p class="tu-skip">Enter boards early</p></div>`;
    setHint('Hold the zone. Enter boards early');
    { let ci=rnd(WAIT_CHAT.length), lastC=0; const tick=()=>{ const el=$('#tuChat'); if(!el)return; el.textContent=WAIT_CHAT[ci%WAIT_CHAT.length]; ci++; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }; tick(); const iv=setInterval(()=>{ if(!$('#tuChat')){clearInterval(iv);return;} tick(); },2800); }
    onOk=()=>{ if(done)return; done=true; SFX.ok(); setTimeout(res,300); };
    drive((t,dt)=>{ if(done)return false; left=Math.max(0,left-dt*rate); const m=Math.floor(left/60), sc=Math.floor(left%60);
      $('#tuP').textContent=String(m).padStart(2,'0')+':'+String(sc).padStart(2,'0'); $('#tuB').style.width=(left/gameSecs*100)+'%';
      if(left<=0){ done=true; SFX.tick(); setTimeout(res,300); return false; } });
  })};
}

/* ---------- missions ---------- */
const HB=S.find(s=>s.n==='Hellbomb');
const MISSIONS=[
 {id:'extract',src:"wiki",srcPage:'Extraction',name:'Extraction',art:'cine_bays',
  brief:'Every mission ends here. Activate the extraction terminal, input the code, confirm, then defend the extraction zone for the two minutes Pelican-1 needs.',
  open:'Objectives complete. Get to the extraction zone, activate the terminal and hold the ground until the bird lands.',
  blurb:'Activate the extraction terminal with the arrow code, confirm the call, then defend the zone for two minutes with at least one Helldiver inside 50 metres.',
  steps:[ob(codeStep(8,'Activate extraction terminal',null,'must be under constant supervision once activated.'),'Activate extraction terminal'),
         ob(etaStep(120,'Shuttle incoming. Defend extraction zone','At least one Helldiver within 50 m of the beacon'),'Shuttle incoming. Defend extraction zone')]},
 {id:'icbm',src:"wiki",srcPage:'Launch ICBM',name:'Launch ICBM',art:'cine_lesath',
  brief:'Re-activate a dormant Intercontinental Ballistic Missile silo and launch its nuclear payload against an enemy target of interest. Generator and fuel pumps appear from Hard and Impossible upward.',
  open:'Launch codes first, then the generator, then the fuel, then the silo. Every terminal in order, Helldiver.',
  blurb:'Generator: log in, diagnostics, reset five fuses, calibrate voltage, pull the lever. Fuel: log in, route the pipes, turn the valves, confirm. Silo: log in, five-digit code, four hatch locks, open the hatch, raise, target, fuel, launch.',
  steps:[/* Reactivate Power Generator */
         ob(codeStep(6,'Log in to generator terminal'),'Log in to terminal','Reactivate Power Generator'),
         ob(waitStep(15,'Generator diagnostics'),'Wait for generator diagnostics sequence to complete','Reactivate Power Generator'),
         ob(switchesStep('Reset fuses',['Fuse 1','Fuse 2','Fuse 3','Fuse 4','Fuse 5'],5,'Reset all fuses','Reset fuses'),'Use terminal to reset fuses','Reactivate Power Generator'),
         ob(signalStep('Calibrate generator voltage'),'Use terminal to calibrate generator voltage','Reactivate Power Generator'),
         ob(waitStep(30,'Generator calibrating'),'Wait for generator to calibrate','Reactivate Power Generator'),
         ob(holdStep('U',1.2,'Pull transformer unit lever','Hold W at the lever'),'Pull transformer unit lever','Reactivate Power Generator'),
         /* Start Fuel Pumps */
         ob(codeStep(7,'Log in to fuel terminal'),'Log in to terminal','Start Fuel Pumps'),
         ob(pipeStep('Redirect fuel to new target','Fuel output',['Local storage','New target'],'New target','Please adjust routing protocol'),'Redirect fuel to target','Start Fuel Pumps'),
         ob(valveStep('Turn valve 1A','yellow'),'Turn all valves indicated by the terminal','Start Fuel Pumps'),ob(valveStep('Turn valve 2A','yellow'),'Turn all valves indicated by the terminal','Start Fuel Pumps'),ob(valveStep('Turn valve 2B','yellow'),'Turn all valves indicated by the terminal','Start Fuel Pumps'),
         ob(pressStep('U','Confirm fuel routing','Confirm','Check the confirmation box on the terminal'),'Turn all valves indicated by the terminal','Start Fuel Pumps'),
         /* Launch ICBM */
         ob(codeStep(7,'Log in to Missile Control System'),'Log in to Missile Control System','Launch ICBM'),
         ob(dialsStep('Enter launch code'),'Input launch code','Launch ICBM'),
         ob(holdStep('U',1,'Disengage hatch lock 1','Hold W at the lock'),'Manually disengage all silo hatch locks','Launch ICBM'),ob(holdStep('U',1,'Disengage hatch lock 2','Hold W at the lock'),'Manually disengage all silo hatch locks','Launch ICBM'),ob(holdStep('U',1,'Disengage hatch lock 3','Hold W at the lock'),'Manually disengage all silo hatch locks','Launch ICBM'),ob(holdStep('U',1,'Disengage hatch lock 4','Hold W at the lock'),'Manually disengage all silo hatch locks','Launch ICBM'),
         ob(pressStep('U','Open silo hatch','Open hatch',''),'Use terminal to open silo hatch','Launch ICBM'),
         ob(waitStep(60,'Raising ICBM'),'ICBM raising into launch position','Launch ICBM'),
         ob(codeStep(4,'Lock target coordinates'),'Use terminal to lock the target coordinates','Launch ICBM'),
         ob(waitStep(30,'Fueling ICBM'),'Missile fueling in progress','Launch ICBM'),
         ob(pressStep('U','Initiate launch','Launch',''),'Use terminal to initiate launch','Launch ICBM'),
         ob(countdownStep(10,'Launch in','Clear the silo',true),'Clear the launch site','Launch ICBM')]},
 {id:'e710',src:"wiki",srcPage:'Start Fuel Pumps',name:'Transfer E-710 to Shuttle',art:'cine_effluvia',
  brief:'Crucial E-710 reserves. Navigate the Terminid swarm, reactivate the pumps, and transfer the fuel to the waiting transport shuttles. The mission is Enable E-710 Extraction.',
  open:'Terminid refinery, Helldiver. Log in, route the E-710 to the transfer station, turn the three valves, then bring the pumps up.',
  blurb:'Log in with the seven-direction code, shift the pipe columns until E-710 reaches the transfer station, turn all three valves counterclockwise until the green light, reactivate the pumps, wait ten seconds.',
  steps:[ob(codeStep(7,'Log in to terminal'),'Log in to terminal'),
         ob(pipeStep('Redirect E-710 flow','E-710 outflow',['Local storage','Transfer station'],'Transfer station','Please adjust target storage facility'),'Redirect fuel to target'),
         ob(valveStep('Turn valve 1'),'Turn all valves indicated by the terminal'),ob(valveStep('Turn valve 2'),'Turn all valves indicated by the terminal'),ob(valveStep('Turn valve 3'),'Turn all valves indicated by the terminal'),
         ob(pressStep('U','Reactivate pumps','Reactivate pumps',''),'Reactivate the pumps'),ob(waitStep(10,'Oil pumps activating'),'Reactivate the pumps')]},
 {id:'cyborg',src:"wiki",srcPage:'Halt Cyborg Production',name:'Demolish Cyborg Assembly Unit',art:'cine_cyberstan',
  brief:'An Automaton Cyborg assembly line. Bypass the terminal security, direct hydrogen into the Power Core, tighten the exhaust clamps, unlock the Control Chamber, overload the engine, force-start the unit, and get out before it goes.',
  open:'Control room located. The terminal is locked. Match the security grids and get us in.',
  blurb:'Seven security grids, hydrogen into the Power Core, three exhaust clamps, unlock the Control Chamber, two chamber valves, force-start, then thirty seconds to evacuate.',
  steps:[1,2,3,4,5,6,7].map(n=>ob(gridStep('Access restricted',n,'Match security grid pattern'),'Bypass terminal security')).concat([
         ob(pressStep('U','Direct hydrogen into Power Core','Direct hydrogen',''),'Use terminal to direct hydrogen into Power Core'),
         ob(valveStep('Tighten exhaust pipe clamp'),'Tighten all exhaust pipe clamps'),ob(valveStep('Tighten exhaust pipe clamp'),'Tighten all exhaust pipe clamps'),ob(valveStep('Tighten exhaust pipe clamp'),'Tighten all exhaust pipe clamps'),
         ob(codeStep(5,'Unlock Control Chamber'),'Use terminal to unlock Control Chamber'),
         ob(valveStep('Adjust Control Chamber valve'),'Adjust valves in Control Chamber to overload engine'),ob(valveStep('Adjust Control Chamber valve'),'Adjust valves in Control Chamber to overload engine'),
         ob(pressStep('U','Force-start unit','Force-start',''),'Return to terminal and force-start unit'),
         ob(escapeStep(60,30,'Evacuate the area'),'Rapidly clear the area')])},
 {id:'sam',src:"wiki",srcPage:'SEAF SAM Site',name:'SEAF SAM Site',art:'cine_eaglestorm',
  brief:'An abandoned SEAF firebase with a dormant surface-to-air launcher. Raise it and activate its sub-systems and it shoots dropships, gunships and warp ships for the rest of the mission.',
  open:'SAM battery in the area. Raise it, get every sub-system active, and the sky belongs to us.',
  blurb:'Enter the six-input code that raises the launcher, wait for the full raise, then activate every sub-system individually.',
  steps:[ph(codeStep(6,'Raise surface-to-air launcher'),1,3),ph(waitStep(20,'Raising surface-to-air launcher'),2,3),ph(switchesStep('Activate launcher sub-system',['Sensors','Targeting','Warhead','Radar','Propulsion'],5,'Please clear front of surface-to-air launcher'),3,3)]},
 {id:'rvd',src:"wiki",srcPage:'Retrieve Valuable Data',name:'Retrieve Valuable Data',art:'cine_effluvia',
  brief:'Collect important research and operational data from an overrun colony and re-integrate it with the Super Earth galaxy-wide network.',
  open:'Research terminal located. Log in, back up the database, eject the SSSD, then carry it to the relay and raise the tower.',
  blurb:'Log in, initiate the emergency backup, wait 20 seconds, eject the SSSD, carry it to the relay. Bring the generator back (log in, fuses, voltage, lever), raise the satellite tower, wait 25 seconds, realign the dish, 40 second upload, wipe the data with the eleven-input code.',
  steps:[ob(codeStep(5,'Log in to research database'),'Use terminal to log in to research database','Collect Encrypted Hard Drive'),
         ob(pressStep('U','Initiate emergency data backup','Emergency data backup',''),'Use terminal to initiate emergency data backup','Collect Encrypted Hard Drive'),
         ob(waitStep(20,'Database downloading'),'Database downloading','Collect Encrypted Hard Drive'),
         ob(codeStep(7,'Eject SSSD hard drive'),'Use terminal to eject SSSD Hard Drive','Collect Encrypted Hard Drive'),
         ob(travelStep('the Communications relay with the SSSD',80),'Transport SSSD Hard Drive to Communications relay','Collect Encrypted Hard Drive'),
         /* the wiki lists the generator as part of this mission: same flow as the ICBM generator */
         ob(codeStep(6,'Log in to generator terminal'),'Log in to terminal','Reactivate Power Generator'),
         ob(waitStep(15,'Generator diagnostics'),'Wait for generator diagnostics sequence to complete','Reactivate Power Generator'),
         ob(switchesStep('Reset fuses',['Fuse 1','Fuse 2','Fuse 3','Fuse 4','Fuse 5'],5,'Reset all fuses','Reset fuses'),'Use terminal to reset fuses','Reactivate Power Generator'),
         ob(signalStep('Calibrate generator voltage'),'Use terminal to calibrate generator voltage','Reactivate Power Generator'),
         ob(waitStep(30,'Generator calibrating'),'Wait for generator to calibrate','Reactivate Power Generator'),
         ob(holdStep('U',1.2,'Pull transformer unit lever','Hold W at the lever'),'Pull transformer unit lever','Reactivate Power Generator'),
         ob(codeStep(6,'Raise satellite tower'),'Use terminal to raise satellite tower','Upload Data via Local Relay'),
         ob(waitStep(25,'Raising satellite tower'),'Raising satellite tower','Upload Data via Local Relay'),
         ob(dishStep('Manually realign the satellite tower'),'Manually realign the satellite tower','Upload Data via Local Relay'),
         ob(waitStep(40,'Uploading data to Super Earth Mainframe'),'Uploading data to Super Earth Mainframe','Upload Data via Local Relay'),
         ob(codeStep(11,'Wipe sensitive data'),'Use terminal to wipe sensitive data','Upload Data via Local Relay')]},
 {id:'radar',src:"recon",srcPage:'LiDAR Station',name:'Radar Station',art:'cine_varylia',
  brief:'A SEAF LiDAR station reveals points of interest and hidden objectives to the whole squad once raised and aligned.',
  open:'LiDAR station located. Raise the tower, spin the dish onto the heading the terminal shows, confirm.',
  blurb:'Confirm Raise LiDAR Tower, wait 35 seconds, spin the dish until the heading matches and it beeps, confirm the activation.',
  steps:[pressStep('U','Raise LiDAR Tower?','Raise tower',''),waitStep(35,'Raising LiDAR tower'),dishStep('Align LiDAR tower'),pressStep('U','Confirm activation','Activate','')]},
 {id:'hellbomb',src:"recon",srcPage:'NUX-223 Hellbomb',name:'Arm Hellbomb',art:'cine_nest',
  brief:'A tactical nuclear weapon of exceptional yield. Explosion radius 25 metres, demolition force in the inner 17. Call it in, arm it at its panel, get clear.',
  open:'Hellbomb authorised for this target. Call it down, arm it, and run.',
  blurb:'Call it in with the real code, arm it at the panel with the code shown, then get clear of the 25 metre radius before it goes.',
  steps:[codeStep(8,'Call in Hellbomb',HB?HB.c:'DULDURDU'),codeStep(6,'Arm the Hellbomb'),escapeStep(45,15,'Get clear of the blast')]},
 {id:'seaf',src:"wiki",srcPage:'SEAF Artillery',name:'SEAF Artillery',art:'cine_eaglestorm',
  brief:'A dormant SEAF artillery emplacement. Load five shells by hand and establish communication with the Super Destroyer to gain the SEAF ARTILLERY stratagem. Shells fire in the order loaded.',
  open:'SEAF gun in the area. Load it and link it to us, and you will have artillery on call.',
  blurb:'Activate the artillery terminal, load five of the scattered shells in the order you want them fired, raise the signal to the Super Destroyer to 100 percent, wait for the system to initiate.',
  steps:[ob(pressStep('U','Activate artillery terminal','Activate',''),'Activate Artillery Terminal'),
         ob(shellsStep(),'Find artillery shells and load them into artillery gun'),
         ob(signalStep('Establish communication with Super Destroyer'),'Use terminal to establish communication with Super Destroyer'),
         ob(waitStep(10,'Artillery system initiating'),'Wait for the artillery system to initiate')]},
 {id:'bcast',src:"wiki",srcPage:'Terminate Illegal Broadcast',name:'Terminate Illegal Broadcast',art:'cine_cyberstan',
  brief:'An illegal propaganda broadcast has been traced to this location. Log in at the tower and align the signal to 100 percent to shut it down. Demolition 30 on the tower works too.',
  open:'Broadcast tower confirmed. Get to the terminal at its base and shut the traitors up.',
  blurb:'Login required: input the arrow code. Then raise the signal strength to 100 percent.',
  steps:[ob(codeStep(5,'Login required'),'Login required'),ob(signalStep('Raise signal strength to 100%'),'Raise signal strength to 100%')]},
 {id:'uplink',src:"wiki",srcPage:'Emergency Evacuation',name:'Emergency Evacuation',art:'cine_shete',
  brief:'Evacuate Priority Citizens. Bring the communication tower online with the SSSD, then open the shuttle bay from its own terminal and walk the citizens in.',
  open:'Citizens are waiting, Helldiver. Tower first, shuttle bay second, then escort. Every terminal in order.',
  blurb:'Tower: log in with the five-input code, open the SSSD hatch, deliver the SSSD, align the signal to 100 percent, activate the tower with another five-input code. Shuttle bay: six second activation, seven-input log in, match the evacuation coordinates, open the bay door, escort the citizens in.',
  steps:[ob(codeStep(5,'Log in to terminal'),'Log in to terminal','Activate Communication Tower'),
         ob(pressStep('U','Open SSSD Delivery Hatch','Open hatch','Press W (↑) to open the hatch at the base of the tower'),'Use Terminal to open SSSD Delivery Hatch','Activate Communication Tower'),
         ob(travelStep('the SSSD Delivery Hatch with the SSSD',30),'Call down SSSD and insert into Hatch','Activate Communication Tower'),
         ob(signalStep('Align communication signal'),'Use terminal to align communication signal','Activate Communication Tower'),
         ob(codeStep(5,'Activate Communication Tower'),'Use Terminal to activate Communication Tower','Activate Communication Tower'),
         ob(waitStep(6,'Activating Shuttle Bay terminal'),'Activate Shuttle Bay terminal','Evacuate Priority Citizens'),
         ob(codeStep(7,'Log in to Shuttle Bay Terminal'),'Log in to Shuttle Bay Terminal','Evacuate Priority Citizens'),
         ob(dialTransferStep('Confirm Evacuation Coordinates','Match the target coordinates shown on the right of the screen, then press W (↑) to confirm. The terminal takes three seconds to lock them.'),'Confirm Evacuation Coordinates','Evacuate Priority Citizens'),
         ob(pressStep('U','Open Shuttle Bay Door','Open door',''),'Open Shuttle Bay Door','Evacuate Priority Citizens'),
         ob(travelStep('the Shuttle Bay with the citizens',60),'Escort Citizens safely to Shuttle Bay','Evacuate Priority Citizens')]},
];


/* ---------- board ---------- */
const grid=$('#opsGrid');
function bestKey(id){return 'hd_ops_'+id;}
function paintBoard(){
  grid.innerHTML=MISSIONS.map(m=>{const b=store.get(bestKey(m.id),null);
    return `<button class="card op brk" data-id="${m.id}"><span class="op-img">${art(m.art)?`<img src="${art(m.art)}" alt="" loading="lazy">`:''}<img class="op-ic" src="assets/img/obj/${m.id}.svg" alt="" loading="lazy" onerror="this.remove()"></span>
      <span class="op-in"><h3>${m.name}</h3><p>${m.blurb}</p><span class="op-meta"><span>${m.steps.length} steps</span><span>${b?'Best '+fmt(b.t)+' · '+b.e+' err':'No record'}</span></span></span></button>`;}).join('');
  const done=MISSIONS.filter(m=>store.get(bestKey(m.id),null)).length;
  $('#opsBest').textContent=done+' of '+MISSIONS.length+' objectives on record';
}
paintBoard();
grid.addEventListener('click',e=>{const b=e.target.closest('.op'); if(b) start(MISSIONS.find(m=>m.id===b.dataset.id));});
/* deep link: terminals.html?go=<mission id> opens that objective */
(function(){ const sp=new URLSearchParams(location.search); const go=sp.get('go'); const m=go&&MISSIONS.find(x=>x.id===go); if(m) setTimeout(()=>start(m,Math.max(0,(+sp.get('step')||1)-1)),400); })();

/* ---------- engine ---------- */
const M={err:0,extra:'',deaths:0};
const hostiles=$('#tmHostiles')||{checked:true};
let clockIv=0, current=null, token=0;
function abort(){ if(!active)return; active=false; token++; reset(); $('#term').hidden=true; clearInterval(clockIv); SFX.close(); document.dispatchEvent(new Event('hd:term')); }
$('#tmAbort').addEventListener('click',abort);
/* console view: the screen on a WebGL terminal, seen from the diver's angle; flat on phones or if WebGL fails */
(function view(){
  const cb=$('#tmView'), scr=$('#tmScreen'), stage=$('#tm3d'), body=$('#tmBody'); if(!cb||!scr||!stage)return;
  let mod=null, mounted=null;
  async function paint(){
    const want=cb.checked&&innerWidth>900&&!$('#term').hidden;
    if(want&&!mounted){ try{ mod=mod||await import(new URL(window.CONSOLE3D_SRC||'assets/console3d.js',location.href).href); stage.hidden=false; body.classList.add('is3d'); mounted=mod.mount(stage,scr); }catch(err){ console.warn('console 3D unavailable',err); cb.checked=false; stage.hidden=true; body.classList.remove('is3d'); } }
    else if(!want&&mounted){ mounted.unmount(); mounted=null; stage.hidden=true; body.classList.remove('is3d'); }
  }
  cb.addEventListener('change',paint); addEventListener('resize',paint);
  document.addEventListener('hd:term',paint);
})();
let stepIdx=-1, threatStop=null;
/* live pressure: while you work a terminal, enemies close in. Let the meter fill and a patrol arrives with a ten-second window.
   Fail the window and you are reinforced: a death on the record, the step carries on. Travel legs do not build threat. */
function threatLoop(my){
  let threat=0.15, closing=0, lastStep=stepIdx, lastBeep=0;
  const bar=$('#tmThreatBar'), lab=$('#tmThreatLab'), ov=$('#tmClosing');
  return drive((t,dt)=>{
    if(token!==my||!active){ ov.classList.remove('on'); return false; }
    if(!document.getElementById('tmThreatBar')) return false;
    const step=current.steps[stepIdx]; const travelling=!!(step&&/^Move to/.test(step.label)); const inPatrol=!!(step&&step.interrupt);
    if(stepIdx!==lastStep){ lastStep=stepIdx; threat=0.12; if(closing>0){ closing=0; ov.classList.remove('on'); ui.classList.remove('klaxon'); } }
    if(!hostiles.checked){ threat=0.1; bar.style.width='10%'; lab.textContent='PRESSURE OFF'; return; }
    if(closing>0){
      closing=Math.max(0,closing-dt); ov.querySelector('b').textContent=closing.toFixed(1);
      if(t-lastBeep>500){ SFX.beep(closing<3?1400:800,0.06); lastBeep=t; }
      if(closing<=0){ /* overrun */
        ov.classList.remove('on'); ui.classList.remove('klaxon'); threat=0.1;
        M.err++; M.deaths=(M.deaths||0)+1; $('#tmErr').textContent=M.err; SFX.over(); say(pick((C.radio&&C.radio.death)||['HELLDIVER DOWN']));
        const r=$('#tmReinf'); r.classList.add('on'); setTimeout(()=>{ r.classList.remove('on'); say(pick((C.radio&&C.radio.reinforce_hit)||['Reinforcement delivered.'])); },1800);
      }
    } else if(!travelling&&!inPatrol){
      threat=Math.min(1,threat+dt/26);
      if(threat>=1){ closing=10; ov.classList.add('on'); ui.classList.add('klaxon'); SFX.klaxon(); say(pick(C.threats||['Enemy patrol converging on your position'])+'. Finish the terminal.'); }
    } else { threat=Math.max(0.1,threat-dt/30); }
    bar.style.width=(threat*100)+'%'; bar.classList.toggle('hot',threat>0.7);
    lab.textContent=threat>0.85?'CONTACT IMMINENT':threat>0.55?'PATROL NEARBY':'CLEAR';
  },true);
}
async function start(m,from){ $('#tmScreen').classList.toggle('bot',m.id==='cyborg'); const ic_=$('#tmIcon'); if(ic_) ic_.src='assets/img/obj/'+m.id+'.svg';
  current=m; M.err=0; M.extra=''; M.deaths=0; $('#tmErr').textContent='0'; $('#tmName').textContent=m.name;
  if(!$('#tmThreat')){ const hud=$('#tmHud'), h=$('#tmScreen'); const d=document.createElement('div'); d.className='term-threat'; d.id='tmThreat'; d.innerHTML='<span>Enemy proximity</span><div class="term-threat-bar"><i id="tmThreatBar"></i></div><b id="tmThreatLab">CLEAR</b>'; hud.insertBefore(d,hud.querySelector('.term-radio'));
    const o=document.createElement('div'); o.className='term-closing'; o.id='tmClosing'; o.innerHTML='<span>Patrol closing</span><b>10.0</b><em>Finish the terminal or be reinforced</em>'; h.appendChild(o);
    const r=document.createElement('div'); r.className='term-reinf'; r.id='tmReinf'; r.innerHTML='<b>HELLDIVER DOWN</b><span>Reinforcing &middot; the objective stays where you left it</span>'; h.appendChild(r); }
  $('#tmBrief').textContent=m.brief||'';
  { const idEl=document.querySelector('.term-id');
    if(idEl) idEl.innerHTML='SEAF FIELD TERMINAL &middot; MK.IV'+
      (m.src==='wiki' ? ' <em class="term-src ok">Steps match the wiki: '+m.srcPage+'</em>'
                      : ' <em class="term-src">Reconstruction: the wiki publishes no step list for this one</em>'); } if(radioEl) radioEl.innerHTML=''; say('SUPER DESTROYER: '+(m.open||'Objective marked. Proceed to the terminal.'));
  $('#term').hidden=false; $('#tmDone').hidden=true; active=true; const my=++token; document.dispatchEvent(new Event('hd:term'));
  /* the game lists the objective once, not once per sub-step: group consecutive steps
     that share an objective line and count progress inside the group on the screen */
  const groups=[]; m.steps.forEach((st,k)=>{
    const lab=st.obj||st.label;
    const g=groups[groups.length-1];
    if(g&&g.label===lab) g.to=k; else groups.push({label:lab,from:k,to:k,grp:st.grp||null});
  });
  m._groups=groups;
  /* sub-objectives nest under their heading, as the game's objective panel does */
  const subs=[]; groups.forEach((g,i)=>{ const h=subs[subs.length-1]; if(h&&h.grp===g.grp) h.items.push(i); else subs.push({grp:g.grp,items:[i]}); });
  m._subs=subs;
  $('#tmSteps').innerHTML=subs.map((sb,si)=>
    (sb.grp?`<li class="sub-h" data-sub="${si}"><b>${sb.grp}</b><i>${sb.items.length}</i></li>`:'')+
    sb.items.map(gi=>`<li data-sub="${si}">${groups[gi].label}</li>`).join('')).join('');
  if(!/noscroll=1/.test(location.search)) $('#term').scrollIntoView({behavior:'smooth',block:'start'});
  SFX.wake(); SFX.open();
  const t0=performance.now(); clearInterval(clockIv);
  /* HUD mission clock: 40:00 of game time running six times faster than real time, next to the real elapsed time */
  clockIv=setInterval(()=>{ const el=performance.now()-t0; const g=Math.max(0,2400-el/1000*6); $('#tmClock').textContent=fmt(el); const mc=$('#tmMission'); if(mc) mc.textContent='T: '+String(Math.floor(g/60)).padStart(2,'0')+':'+String(Math.floor(g%60)).padStart(2,'0'); },100);
  if(threatStop) threatStop(); stepIdx=-1; threatStop=threatLoop(my);
  for(let i=(from|0);i<m.steps.length;i++){
    if(token!==my) return; stepIdx=i;
    const gi=(m._groups||[]).findIndex(g=>i>=g.from&&i<=g.to);
    const si=(m._subs||[]).findIndex(sb=>sb.items.includes(gi));
    { let gk=-1; $$('#tmSteps li').forEach(li=>{
        const mine=+li.dataset.sub;
        if(li.classList.contains('sub-h')){ li.classList.toggle('ok',mine<si); li.classList.toggle('now',mine===si); li.classList.toggle('fold',mine!==si); return; }
        gk++; li.classList.toggle('ok',gk<gi); li.classList.toggle('now',gk===gi); li.classList.toggle('fold',mine!==si&&(m._subs||[]).length>1);
      }); }
    const G=(m._groups||[])[gi];
    $('#tmStepNo').textContent='STEP '+(gi+1)+' / '+(m._groups||[]).length;
    $('#tmStepLabel').textContent=G?G.label:m.steps[i].label;
    if(m.steps[i].say) say(m.steps[i].say);
    const gp=(G&&G.to>G.from)?[i-G.from+1,G.to-G.from+1]:null;
    const phv=m.steps[i].phase||gp;
    PH=phv?' <span class="tu-ph">'+phv[0]+' / '+phv[1]+'</span>':''; reset(); const pr_=m.steps[i].run(); fitTitle(); await pr_; PH=''; if(token!==my) return;
    /* between stations, patrols sometimes find you */
    /* patrols only find you between stations, never mid-terminal (phase n of m, or the next phase of the same screen) */
    const cur=m.steps[i], nxt=m.steps[i+1]; const mid=(cur.phase&&cur.phase[0]<cur.phase[1])||(nxt&&nxt.phase&&nxt.phase[0]>1);
    /* patrol pressure now comes from the proximity meter; scripted patrols stay only where the mission lists them */
  }
  $$('#tmSteps li').forEach(li=>{li.classList.add('ok');li.classList.remove('now');});
  clearInterval(clockIv); active=false; reset();
  const t=performance.now()-t0; const prev=store.get(bestKey(m.id),null);
  if(!prev||t<prev.t) store.set(bestKey(m.id),{t:Math.round(t),e:M.err});
  /* the game's banner, on the terminal screen itself */
  const idx=MISSIONS.indexOf(m), next=MISSIONS[(idx+1)%MISSIONS.length];
  $('#tmStepNo').textContent='COMPLETE'; $('#tmStepLabel').textContent=m.name;
  ui.innerHTML=`<div class="term-success"><span class="tag">Objective complete</span><b>Objective complete!</b><div class="term-success-stats"><div><b>${fmt(t)}</b><span>Real time</span></div><div><b>${M.err}</b><span>Mistakes</span></div><div><b>${M.deaths||0}</b><span>Reinforced</span></div><div><b>${(!prev||t<prev.t)?'New':'Kept'}</b><span>Record</span></div></div>${M.extra?`<p class="tu-note">${M.extra}</p>`:''}<p class="term-success-voice">${pick((C.radio&&C.radio.complete)||['Objective complete'])} ${pick(C.officer||[''])}</p><div class="hero-cta" style="justify-content:center;margin-top:14px"><button class="btn sm" id="tsAgain">Run it again <span class="ar">&#9654;</span></button><button class="btn sm ghost" id="tsNext">Next: ${next.name}</button><a class="btn sm ghost" href="#ops">Mission board</a></div></div>`;
  setHint('Objective complete · Enter runs it again');
  $('#tsAgain').addEventListener('click',()=>start(m)); $('#tsNext').addEventListener('click',()=>start(next)); onOk=()=>start(m);
  $('#tmDone').hidden=true; SFX.perfect(); paintBoard();
}
$('#tmAgain').addEventListener('click',()=>current&&start(current));
if(location.hash.length>1){ const m=MISSIONS.find(x=>x.id===location.hash.slice(1)); if(m) setTimeout(()=>start(m),600); }
})();
