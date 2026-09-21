/* ============================================================
   THE ARCADE — five drills
   Real input beeps via window.HDSFX (core.js). Optional realistic
   hold-to-input: arrows only count while the stratagem key is held.
   ============================================================ */
(function(){
'use strict';
const {$,$$}=window.HD;
const SFX=window.HDSFX;
const S=window.HD_STRATAGEMS||[];
const E=window.HD_ENEMIES||[];
const KEY={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',w:'U',a:'L',s:'D',d:'R',W:'U',A:'L',S:'D',D:'R'};
const rnd=n=>(Math.random()*n)|0;
const pick=a=>a[rnd(a.length)];
const shuffle=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=rnd(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d;}catch(e){return d;}},
             set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const isMac=/Mac|iPhone|iPad/.test(navigator.platform||'');

/* ---------- sound toggle chip ---------- */
const sfxBtn=$('#sfxBtn');
if(sfxBtn){
  const paint=()=>{sfxBtn.textContent='Sound: '+(SFX.on?'on':'off');sfxBtn.setAttribute('aria-pressed',String(SFX.on));sfxBtn.classList.toggle('on',SFX.on);};
  paint(); sfxBtn.addEventListener('click',()=>{SFX.toggle();paint();}); document.addEventListener('hd:sfx',paint);
}

/* ---------- realistic hold mode (shared) ---------- */
const HOLD={on:store.get('hd_hold',true), key:window.HD.binds.get().strat, down:false};
const diveSel=$('#diveKey'); if(diveSel){ diveSel.value=window.HD.binds.get().dive; diveSel.addEventListener('change',()=>window.HD.binds.set('dive',diveSel.value)); }
const holdChk=$('#holdMode'), holdSel=$('#holdKey'), holdNote=$('#holdNote');
function holdLabel(){return window.HD.binds.label(HOLD.key);}
function paintHold(){
  if(holdChk) holdChk.checked=HOLD.on;
  if(holdSel) holdSel.value=HOLD.key;
  $$('.fd-key').forEach(k=>k.textContent='HOLD '+holdLabel().toUpperCase());
  const kn=$('#fdKeyName'); if(kn) kn.textContent=holdLabel();
  const cp=$('#cabHoldPlate'); if(cp) cp.innerHTML=HOLD.on?`Hold <kbd class="kc">${holdLabel()}</kbd> &middot; arrows or W A S D`:'Hold mode off &middot; arrows or W A S D';
  if(holdNote){
    holdNote.textContent = HOLD.on
      ? `Hold mode on, as in the game: hold ${holdLabel()} (L1 / LB on a controller), input while holding, release cancels.`
        + (HOLD.key==='Control'&&!isMac ? ' Windows and Linux browsers reserve Ctrl+W, so use the ARROW KEYS with Ctrl here, or pick Shift if you want WASD.' : ' Arrow keys or WASD.')
      : 'Hold mode off: arrows register at any time, the arcade cabinet behaviour. The field rule is hold to input, so this is for the cabinet only. Controllers work too: D-pad inputs, R2 throws.';
  }
}
if(holdChk) holdChk.addEventListener('change',()=>{HOLD.on=holdChk.checked;store.set('hd_hold',HOLD.on);paintHold();});
if(holdSel) holdSel.addEventListener('change',()=>{HOLD.key=holdSel.value;window.HD.binds.set('strat',HOLD.key);paintHold();});
paintHold();
const holdListeners=new Set();
const isToggle=()=>String(HOLD.key).startsWith('Toggle:');
const setDown=v=>{ if(HOLD.down===v)return; HOLD.down=v; holdListeners.forEach(f=>f(v)); };
addEventListener('keydown',e=>{ if(!window.HD.binds.is(HOLD.key,e)||e.repeat)return; if(isToggle()) setDown(!HOLD.down); else setDown(true); });
addEventListener('keyup',e=>{ if(!isToggle()&&window.HD.binds.is(HOLD.key,e)) setDown(false); });
addEventListener('pointerdown',e=>{ if(!window.HD.binds.is(HOLD.key,e))return; e.preventDefault(); if(isToggle()) setDown(!HOLD.down); else setDown(true); });
addEventListener('pointerup',e=>{ if(!isToggle()&&window.HD.binds.is(HOLD.key,e)) setDown(false); });
addEventListener('contextmenu',e=>{ if(HOLD.down) e.preventDefault(); });
addEventListener('blur',()=>{ if(HOLD.down){HOLD.down=false;holdListeners.forEach(f=>f(false));} });
/* touch HOLD buttons feed the same state */
function bindHoldButton(btn){
  if(!btn)return;
  const dn=e=>{e.preventDefault();btn.classList.add('down');if(!HOLD.down){HOLD.down=true;holdListeners.forEach(f=>f(true));}};
  const up=e=>{e.preventDefault();btn.classList.remove('down');if(HOLD.down){HOLD.down=false;holdListeners.forEach(f=>f(false));}};
  btn.addEventListener('pointerdown',dn); btn.addEventListener('pointerup',up); btn.addEventListener('pointercancel',up); btn.addEventListener('pointerleave',up);
}

/* ---------- controller (Gamepad API): the PlayStation scheme ----------
   L1 (button 4) or LB holds the stratagem menu, D-pad (12-15) inputs the code,
   R2 (7) / R1 (5) throws, X / A (0) confirms. Left stick also inputs. */
window.HDPad=(function(){
  const state={hold:false,btn:{}}; const throwFns=new Set(), okFns=new Set();
  let stickArmed=true;
  function edge(i,pressed,onDown,onUp){ const was=!!state.btn[i]; state.btn[i]=pressed; if(pressed&&!was) onDown&&onDown(); if(!pressed&&was) onUp&&onUp(); }
  function poll(){
    const pads=navigator.getGamepads?navigator.getGamepads():[]; let gp=null;
    for(const p of pads){ if(p&&p.connected){gp=p;break;} }
    if(gp){
      const b=i=>!!(gp.buttons[i]&&(gp.buttons[i].pressed||gp.buttons[i].value>0.5));
      edge(4,b(4),()=>{ if(!HOLD.down){HOLD.down=true;holdListeners.forEach(f=>f(true));} },()=>{ if(HOLD.down){HOLD.down=false;holdListeners.forEach(f=>f(false));} });
      const dirs={12:'U',13:'D',14:'L',15:'R'};
      Object.keys(dirs).forEach(i=>edge(+i,b(+i),()=>{ if(claimant&&!(HOLD.on&&!HOLD.down&&claimant.needsHold!==false)){ SFX.wake(); claimant(dirs[i]); } }));
      const ax=gp.axes[0]||0, ay=gp.axes[1]||0, mag=Math.hypot(ax,ay);
      if(mag>0.75&&stickArmed){ stickArmed=false; const d=Math.abs(ax)>Math.abs(ay)?(ax>0?'R':'L'):(ay>0?'D':'U'); if(claimant&&!(HOLD.on&&!HOLD.down&&claimant.needsHold!==false)){ SFX.wake(); claimant(d); } }
      else if(mag<0.35) stickArmed=true;
      edge(7,b(7),()=>throwFns.forEach(f=>f())); edge(5,b(5),()=>throwFns.forEach(f=>f()));
      edge(0,b(0),()=>okFns.forEach(f=>f()));
      document.body.classList.add('has-pad');
    }
    requestAnimationFrame(poll);
  }
  addEventListener('gamepadconnected',()=>{ document.body.classList.add('has-pad'); const n=$('#holdNote'); if(n) n.textContent+=' Controller detected: L1 hold, D-pad input, R2 throw.'; });
  requestAnimationFrame(poll);
  return { onThrow:f=>throwFns.add(f), onOk:f=>okFns.add(f) };
})();

/* ---------- shared d-pad ---------- */
function padInto(node,fn){
  if(!node)return;
  node.innerHTML=[['u','U'],['l','L'],['r','R'],['d','D']].map(x=>{
    const g=window.arrowSVG(x[1]);
    return `<button class="${x[0]}" data-d="${x[1]}" aria-label="Input ${x[1]}">${g.replace(/^<span[^>]*>/,'').replace(/<\/span>$/,'')}</button>`;
  }).join('');
  node.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(b){e.preventDefault();SFX.wake();fn(b.dataset.d);}});
}
/* key visualiser */
function keyvisInto(parent){
  const v=document.createElement('div'); v.className='keyvis';
  v.innerHTML=['L','U','D','R'].map(d=>`<span data-d="${d}">${window.arrowSVG(d).replace(/^<span[^>]*>/,'').replace(/<\/span>$/,'')}</span>`).join('');
  parent.appendChild(v); return v;
}
function lit(vis,d){ if(!vis)return; const s=vis.querySelector(`[data-d="${d}"]`); if(!s)return; s.classList.add('lit'); setTimeout(()=>s.classList.remove('lit'),140); }
function callout(game,text,red){
  let c=game.querySelector('.callout'); if(!c){c=document.createElement('div');c.className='callout';game.querySelector('.game-body').appendChild(c);}
  c.className='callout'+(red?' red':''); c.innerHTML='<b>'+text+'</b>'; void c.offsetWidth; c.classList.add('on');
}

/* key router: whichever drill is running claims the arrows */
let claimant=null, liveDrill=null;
function claim(handler,live){ claimant=handler; if(live!==undefined) liveDrill=live?handler:null; }
function claimOnView(section,handler){
  new IntersectionObserver(es=>{es.forEach(en=>{ if(en.isIntersecting&&!liveDrill) claimant=handler; });},{threshold:.3}).observe(section);
  if(!claimant) claimant=handler;
}
/* one-line prompt when a direction is pressed without the hold key */
let nudgeEl=null,nudgeT=0;
function holdNudge(){
  if(!nudgeEl){
    nudgeEl=document.createElement('div'); nudgeEl.className='hold-nudge'; nudgeEl.setAttribute('role','status');
    document.body.appendChild(nudgeEl);
  }
  const k=(window.HD&&window.HD.binds&&window.HD.binds.label)?window.HD.binds.label(HOLD.key):'Ctrl';
  nudgeEl.innerHTML='Hold <b>'+k+'</b> while you enter the code'+
    '<button type="button" class="hold-off">Turn hold off</button>';
  nudgeEl.classList.add('on');
  clearTimeout(nudgeT); nudgeT=setTimeout(()=>nudgeEl.classList.remove('on'),3200);
  nudgeEl.querySelector('.hold-off').onclick=()=>{
    const cb=document.getElementById('holdMode');
    if(cb){ cb.checked=false; cb.dispatchEvent(new Event('change',{bubbles:true})); }
    nudgeEl.classList.remove('on');
  };
}
addEventListener('keydown',e=>{
  if(e.target&&e.target.matches&&e.target.matches('input,select,textarea'))return;
  const k=KEY[e.key];
  if(k&&claimant){
    if(HOLD.on&&!HOLD.down&&claimant.needsHold!==false){
      /* Silently swallowing the key made the drills look broken: hold is ON by
         default, so a first press does nothing and says nothing. Tell them. */
      holdNudge(); return;
    }
    e.preventDefault(); SFX.wake(); claimant(k);
  }
});

/* ============================================================
   1. STRATAGEM HERO — the Super Citizen cabinet, rule for rule
   10 s per round · +1 s per correct code (capped) · 5 pts per arrow
   round bonus 75 + 25(r-1) · time bonus = % of time left
   perfect bonus 100 · 6 codes in round 1, +1 per round, cap 16
   ============================================================ */
(function cabinet(){
  const sec=$('#hero'); if(!sec)return;
  const C=window.HD_COMMS||{cabinet:[]};
  const cab=$('#cab'), views={start:$('#cabStart'),ready:$('#cabReady'),game:$('#cabGame'),over:$('#cabOver'),dead:$('#cabDead')};
  const TIME_TOTAL=10000, TIME_BONUS=1000, T_READY=2000, T_OVER=4000, T_DEAD=3000, WARN=25;
  const HS='hd_cab_hs';
  let screen='start', score=0, round=0, timeLeft=TIME_TOTAL, queue=[], typed='', perfect=true, tick=0, last=0, waitUntil=0;
  let initials=['A','A','A'], initIdx=0, entering=false, pendingRank=-1;
  const hs=()=>store.get(HS,[]);
  function paintHS(el,me){ const L=hs(); const three=el&&el.id==='cabHS2'; const rows=three?L.slice(0,3):L.slice(0,5);
    el.innerHTML=(rows.length?rows:[{n:'No scores yet',s:0}]).map((h,i)=>`<li class="${i===me?'me':''}"><i>${i+1}.</i><span>${h.n}</span><em>|</em><b>${h.s}</b></li>`).join(''); }
  function show(k){ Object.keys(views).forEach(v=>views[v].classList.toggle('hide',v!==k)); screen=k; }
  function pickStrat(){
    /* 1 in 8192 the cabinet deals the retired Orbital Illumination Flare, as the real one does */
    if(rnd(8192)===420) return {n:'Orbital Illumination Flare',c:'RRLR',ic:'orbital_illumination_flare',cat:'ORBITAL'};
    return pick(S);
  }
  function buildRound(){ const n=Math.min(16,5+round); queue=[]; for(let i=0;i<n;i++) queue.push(pickStrat()); typed=''; perfect=true; }
  function drawGame(){
    const s=queue[0]; if(!s)return;
    $('#cabName').textContent=s.n;
    $('#cabStrip').innerHTML=queue.slice(0,4).map(q=>`<img src="${window.stratIcon(q.ic)}" alt="">`).join('');
    $('#cabArrows').innerHTML=s.c.split('').map((d,i)=>window.arrowSVG(d,i<typed.length?'hit':'wait')).join('');
    $('#cabRound').textContent=round; $('#cabScore').textContent=score;
  }
  function startGame(){
    score=0; round=0; show('start'); roundStarting();
  }
  function roundStarting(){
    round++; timeLeft=TIME_TOTAL; buildRound();
    $('#cabReadyRound').textContent=round;
    $('#cabFlavour').textContent = (rnd(10)+1>6 && C.cabinet.length) ? pick(C.cabinet) : '';
    $('#cabTimeWrap').classList.remove('warn'); $('#cabTime').style.width='100%';
    show('ready'); waitUntil=performance.now()+T_READY; SFX.beep(round===1?1046:784,0.12);
    if(round===1) setTimeout(()=>SFX.beep(1318,0.14),140);
  }
  function roundOver(){
    const rb=75+25*(round-1), tb=Math.floor(timeLeft/TIME_TOTAL*100), pb=perfect?100:0;
    $('#cabOverRound').textContent=round;
    $('#cabRB').textContent=rb; $('#cabTB').textContent=tb; $('#cabPB').textContent=pb;
    ['cabRBrow','cabTBrow','cabPBrow','cabTSrow'].forEach(id=>$('#'+id).classList.remove('show'));
    show('over'); waitUntil=performance.now()+T_OVER; SFX.ok();
    score+=rb; setTimeout(()=>{$('#cabRBrow').classList.add('show');SFX.tick();},250);
    score+=tb; setTimeout(()=>{$('#cabTBrow').classList.add('show');SFX.tick();},900);
    score+=pb; setTimeout(()=>{$('#cabPBrow').classList.add('show');SFX.tick();},1550);
    setTimeout(()=>{$('#cabTS').textContent=score;$('#cabTSrow').classList.add('show');SFX.beep(1568,0.12);},2200);
  }
  function gameOver(){
    show('dead'); cab.classList.remove('on'); SFX.over();
    $('#cabFinal').textContent=score;
    const list=hs(); pendingRank=list.filter(h=>h.s>=score).length;
    /* the cabinet keeps three names. A registered callsign goes straight on the board; otherwise initials. */
    const pf=(window.HD.profile&&window.HD.profile.get())||{};
    entering = score>0 && pendingRank<3 && !pf.callsign;
    if(score>0 && pendingRank<3 && pf.callsign){ list.push({n:pf.callsign.slice(0,14),s:score,d:Date.now()}); list.sort((a,b)=>b.s-a.s); store.set(HS,list.slice(0,10)); }
    $('#cabInit').classList.toggle('hide',!entering); $('#cabHSwrap').classList.remove('hide');
    $('#cabRestart').classList.add('hide');
    initials=['A','A','A']; initIdx=0; paintInit();
    paintHS($('#cabHS2'),(score>0&&pendingRank<3&&pf.callsign)?pendingRank:-1);
    waitUntil=performance.now()+T_DEAD;
  }
  function paintInit(){ $$('#cabLetters b').forEach((b,i)=>{b.textContent=initials[i];b.classList.toggle('on',i===initIdx);}); }
  function commitInitials(){
    const list=hs(); list.push({n:initials.join(''),s:score,d:Date.now()}); list.sort((a,b)=>b.s-a.s); store.set(HS,list.slice(0,10));
    entering=false; $('#cabInit').classList.add('hide'); $('#cabHSwrap').classList.remove('hide'); paintHS($('#cabHS2'),pendingRank); paintHS($('#cabHS'),-1);
    SFX.perfect(); waitUntil=performance.now()+800;
  }
  function input(d){
    if(screen==='start'){ startGame(); return; }
    if(screen==='dead'){
      if(entering){
        const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const i=A.indexOf(initials[initIdx]);
        if(d==='U') initials[initIdx]=A[(i+1)%26]; if(d==='D') initials[initIdx]=A[(i+25)%26];
        if(d==='R') initIdx=Math.min(2,initIdx+1); if(d==='L') initIdx=Math.max(0,initIdx-1);
        SFX.dir(d); paintInit(); return;
      }
      if(performance.now()>=waitUntil){ startGame(); } return;
    }
    if(screen!=='game') return;
    const s=queue[0]; if(!s) return;
    typed+=d;
    if(s.c.startsWith(typed)){
      SFX.dir(d); drawGame();
      if(typed===s.c){
        score+=5*s.c.length; timeLeft=Math.min(TIME_TOTAL,timeLeft+TIME_BONUS); queue.shift(); typed='';
        $('#cabScore').textContent=score; SFX.ok();
        if(!queue.length){ roundOver(); } else drawGame();
      }
    }else{
      perfect=false; typed=''; SFX.bad(); cab.classList.add('shake'); setTimeout(()=>cab.classList.remove('shake'),300); drawGame();
    }
  }
  input.needsHold=true;
  addEventListener('keydown',e=>{ if(screen==='dead'&&entering&&(e.key==='Enter'||e.key===' ')){e.preventDefault();commitInitials();} });
  window.HDPad.onOk(()=>{ if(screen==='dead'&&entering) commitInitials(); else if(screen==='start'||(screen==='dead'&&performance.now()>=waitUntil)) startGame(); });
  /* the cabinet loop: 10 ms tick like the original, real elapsed time */
  setInterval(()=>{
    const t=performance.now(); const dt=last?Math.min(250,t-last):0; last=t;
    if(screen==='ready'&&t>=waitUntil){ show('game'); cab.classList.add('on'); drawGame(); }
    else if(screen==='game'){
      timeLeft-=dt; const p=Math.max(0,timeLeft/TIME_TOTAL*100); $('#cabTime').style.width=p+'%'; $('#cabTimeWrap').classList.toggle('warn',p<WARN);
      if(timeLeft<=0) gameOver();
    }
    else if(screen==='over'&&t>=waitUntil){ roundStarting(); }
    else if(screen==='dead'&&!entering&&t>=waitUntil){ $('#cabRestart').classList.remove('hide'); }
  },10);
  paintHS($('#cabHS'),-1);
  padInto($('#cabPad'),input);
  cab.addEventListener('pointerdown',e=>{ if(!e.target.closest('.dpad')&&(screen==='start'||(screen==='dead'&&!entering&&performance.now()>=waitUntil))) { SFX.wake(); startGame(); } });
  claimOnView(sec,input);
  /* the cabinet claims the keyboard whenever it is the drill in view; a start press claims it outright */
  const origStart=startGame; startGame=function(){ claim(input,true); origStart(); };
  const origOver=gameOver; gameOver=function(){ origOver(); claim(input,false); };
})();

/* ============================================================
   2. CODE RUSH
   ============================================================ */
(function codeRush(){
  const sec=$('#rush'); if(!sec)return;
  const game=$('#crGame'), idle=$('#crIdle'), play=$('#crPlay'), over=$('#crOver'), stage=$('#crStage');
  const icon=$('#crIcon'), name=$('#crName'), cat=$('#crCat'), arr=$('#crArrows'), msg=$('#crMsg');
  const elDepth=$('#crDepth'), elInputs=$('#crInputs'), elBest=$('#crBest');
  const BEST='hd_cr_best'; const vis=keyvisInto(play);
  let cur=null,pos=0,depth=0,inputs=0,running=false,t0=0,queue=[];
  elBest.textContent=store.get(BEST,0);
  /* the game's stratagem list: the code being entered sits lit at the top, the next four wait dim below it */
  const list=$('#crList');
  function paintList(){
    if(!list||!cur)return;
    const row=(s,k)=>`<div class="row ${k}"><img src="${window.stratIcon(s.ic)}" alt=""><div><b>${s.n}</b><span class="arrows">${s.c.split('').map((d,i)=>window.arrowSVG(d,(k==='armed'&&i<pos)?'hit':'wait')).join('')}</span></div></div>`;
    list.innerHTML=row(cur,'armed')+queue.map(s=>row(s,'dim')).join('');
  }
  function load(){ while(queue.length<5) queue.push(pick(S)); cur=queue.shift(); pos=0; icon.src=window.stratIcon(cur.ic); icon.alt=cur.n; name.textContent=cur.n; cat.textContent=cur.cat; draw(); }
  function draw(){ arr.innerHTML=cur.c.split('').map((d,i)=>window.arrowSVG(d,i<pos?'hit':'wait')).join(''); paintList(); }
  function input(d){
    if(!running)return; lit(vis,d);
    inputs++; elInputs.textContent=inputs;
    if(cur.c[pos]===d){
      SFX.dir(d); pos++; draw();
      if(pos>=cur.c.length){ depth++; elDepth.textContent=depth; SFX.ok(); stage.classList.add('flash-ok'); setTimeout(()=>stage.classList.remove('flash-ok'),260); load(); }
    }else{ end(); }
  }
  input.needsHold=true;
  function start(){
    depth=0;inputs=0;running=true;t0=performance.now(); elDepth.textContent='0'; elInputs.textContent='0';
    idle.classList.add('hide'); over.classList.add('hide'); play.classList.remove('hide'); game.classList.add('on');
    msg.textContent='One mistake ends it'; SFX.wake(); claim(input,true); load();
  }
  function end(){
    running=false; claim(input,false); game.classList.remove('on'); SFX.over();
    stage.classList.add('shake'); game.classList.add('fail'); setTimeout(()=>{stage.classList.remove('shake');game.classList.remove('fail');},320);
    play.classList.add('hide'); over.classList.remove('hide');
    const secs=((performance.now()-t0)/1000).toFixed(1), best=store.get(BEST,0);
    if(depth>best){store.set(BEST,depth);elBest.textContent=depth;}
    $('#crSummary').textContent=depth+' codes · '+inputs+' inputs · '+secs+'s'+(depth>best?' · new best':'');
  }
  $('#crStart').addEventListener('click',start); $('#crAgain').addEventListener('click',start);
  padInto($('#crPad'),input); claimOnView(sec,input);
})();

/* ============================================================
   3. ENEMY INTEL DRILL
   ============================================================ */
(function intelDrill(){
  const sec=$('#intel'); if(!sec)return;
  const idle=$('#qzIdle'), play=$('#qzPlay'), over=$('#qzOver');
  const elQ=$('#qzQ'), elKind=$('#qzKind'), elOpts=$('#qzOpts'), elMsg=$('#qzMsg'), elScore=$('#qzScore'), elProg=$('#qzProgress'), elBest=$('#qzBest');
  const BEST='hd_qz_best', N=10; let set=[],i=0,score=0,wrong=[];
  elBest.textContent=store.get(BEST,0);
  const IMG=window.HD_IMG||{};
  function makeQ(){
    const e=pick(E), kind=rnd(3);
    const img=(IMG.enemies&&IMG.enemies[e.n])?'assets/img/enemies/'+IMG.enemies[e.n]:'';
    if(kind===0){
      /* distractors are unique by text: three enemies can share "Head", the list must not */
      const norm=t=>String(t||'').trim().toLowerCase();
      const wrongs=shuffle([...new Set(E.map(x=>String(x.weak||'').trim()).filter(w=>w&&norm(w)!==norm(e.weak)))]).slice(0,3);
      return {kind:'Weak point',q:'Where do you shoot a '+e.n+'?',ans:e.weak,opts:shuffle([e.weak,...wrongs]),note:e.kill,img};
    }
    if(kind===1){
      const facs=['TERMINID','AUTOMATON','ILLUMINATE'];
      return {kind:'Identify',q:'Which unit is this?',ans:e.n,opts:shuffle([e.n,...shuffle(E.filter(x=>x.n!==e.n&&x.f===e.f)).slice(0,3).map(x=>x.n)]),note:e.f+' · '+e.weak,img,hideName:true};
    }
    const pool=shuffle(E.filter(x=>x.n!==e.n&&x.f===e.f)).slice(0,3).map(x=>x.n);
    return {kind:'Counter',q:'“'+e.kill+'” Which unit is this?',ans:e.n,opts:shuffle([e.n,...(pool.length>=3?pool:shuffle(E.filter(x=>x.n!==e.n)).slice(0,3).map(x=>x.n))]),note:'Weak point: '+e.weak};
  }
  function show(){
    const Q=set[i]; elProg.textContent='Question '+(i+1)+' of '+N; elKind.textContent=Q.kind; elQ.textContent=Q.q; elMsg.textContent='';
    let pic=play.querySelector('.qz-img'); if(!pic){pic=document.createElement('div');pic.className='qz-img';play.insertBefore(pic,elQ);}
    pic.innerHTML=Q.img?`<img src="${Q.img}" alt="">`:''; pic.style.display=Q.img?'grid':'none';
    elOpts.innerHTML=Q.opts.map((o,k)=>`<button data-k="${k}"><kbd>${k+1}</kbd><span>${o}</span></button>`).join('');
  }
  let answering=false;
  function answer(b){
    if(!b||b.disabled||answering)return; answering=true;
    const Q=set[i], chosen=Q.opts[+b.dataset.k];
    $$('#qzOpts button').forEach(x=>{x.disabled=true; if(Q.opts[+x.dataset.k]===Q.ans) x.classList.add('ok'); else if(x===b) x.classList.add('no');});
    if(chosen===Q.ans){ score++; elScore.textContent=score; SFX.ok(); elMsg.textContent=Q.note; }
    else { SFX.bad(); wrong.push(Q); elMsg.textContent='Correct: '+Q.ans; }
    setTimeout(()=>{ answering=false; i++; if(i>=N) finish(); else show(); }, chosen===Q.ans?900:1900);
  }
  elOpts.addEventListener('click',e=>answer(e.target.closest('button')));
  addEventListener('keydown',e=>{ if(play.classList.contains('hide'))return; const n=+e.key; if(n>=1&&n<=4){ e.preventDefault(); answer(elOpts.querySelector(`button[data-k="${n-1}"]`)); } });
  function start(){ set=[];for(let k=0;k<N;k++)set.push(makeQ()); i=0;score=0;wrong=[]; elScore.textContent='0';
    idle.classList.add('hide'); over.classList.add('hide'); play.classList.remove('hide'); SFX.wake(); show(); }
  function finish(){
    play.classList.add('hide'); over.classList.remove('hide'); elProg.textContent='Complete';
    const best=store.get(BEST,0); if(score>best){store.set(BEST,score);elBest.textContent=score;}
    $('#qzGrade').textContent= score>=9?'Field commander' : score>=7?'Competent' : score>=5?'Needs the manual' : 'Report for retraining';
    $('#qzSummary').textContent=score+' of '+N+' correct';
    $('#qzReview').innerHTML= wrong.length ? '<p class="mono dim" style="margin-bottom:10px">Review</p>'+wrong.map(w=>`<div class="srow" style="border-bottom:1px solid rgba(255,255,255,.07)"><dt style="max-width:58%">${w.q}</dt><dd>${w.ans}</dd></div>`).join('') : '<p class="mono gold">Clean sweep. No corrections needed.</p>';
  }
  $('#qzStart').addEventListener('click',start); $('#qzAgain').addEventListener('click',start);
})();

/* ============================================================
   4. HELLPOD REFLEX
   ============================================================ */
(function reflex(){
  const sec=$('#reflex'); if(!sec)return;
  const game=$('#rxGame'), field=$('#rxField'), msg=$('#rxMsg'), startBtn=$('#rxStart');
  const elScore=$('#rxScore'), elAvg=$('#rxAvg'), elLives=$('#rxLives'), elBest=$('#rxBest');
  const BEST='hd_rx_best'; let running=false,score=0,lives=3,times=[],spawnT=0,cur=null,life=1600,timeoutId=0;
  elBest.textContent=store.get(BEST,0);
  msg.textContent='W A S D or the arrows. Red beacons are jammers: leave them.';
  function place(){
    clearTimeout(timeoutId); field.innerHTML='';
    const bad=Math.random()<0.22, d=pick(['U','D','L','R']);
    const el=document.createElement('div'); el.className='rx-t'+(bad?' bad':'');
    /* keep the whole 66px tile inside the dashed field, with a margin, so a beacon never sits half off the board */
    const M=14, w=field.clientWidth-66-M*2, h=field.clientHeight-66-M*2;
    el.style.left=(M+Math.random()*Math.max(0,w))+'px'; el.style.top=(M+Math.random()*Math.max(0,h))+'px';
    el.innerHTML=window.arrowSVG(d).replace(/^<span[^>]*>/,'').replace(/<\/span>$/,''); field.appendChild(el);
    cur={d,bad}; spawnT=performance.now(); SFX.tick();
    timeoutId=setTimeout(()=>{ if(!running)return; if(cur&&!cur.bad){ hit(false,'Beacon expired'); } else { score+=25; elScore.textContent=score; place(); } },life);
  }
  function hit(good,text){
    if(good){
      const dt=performance.now()-spawnT; times.push(dt); elAvg.textContent=Math.round(times.reduce((a,b)=>a+b,0)/times.length)+'ms';
      const pts=Math.max(20,Math.round(220-dt/8)); score+=pts; elScore.textContent=score; SFX.ok(); msg.textContent='+'+pts; life=Math.max(650,life-22); place();
    }else{
      lives--; elLives.textContent='◆'.repeat(Math.max(0,lives))+'◇'.repeat(3-Math.max(0,lives)); SFX.bad(); msg.textContent=text;
      game.classList.add('fail'); setTimeout(()=>game.classList.remove('fail'),320);
      if(lives<=0){ end(); } else place();
    }
  }
  function input(d){ if(!running||!cur)return; if(cur.bad){ hit(false,'That was a jammer beacon'); return; } if(d===cur.d) hit(true); else hit(false,'Wrong direction'); }
  input.needsHold=false;
  function start(){ running=true;score=0;lives=3;times=[];life=1600; elScore.textContent='0'; elAvg.textContent='·'; elLives.textContent='◆◆◆';
    startBtn.textContent='Restart'; msg.textContent='Beacons inbound. Press the direction shown.'; game.classList.add('on'); SFX.wake(); claim(input,true); place(); }
  function end(){
    running=false; claim(input,false); game.classList.remove('on'); clearTimeout(timeoutId); field.innerHTML=''; SFX.over();
    const best=store.get(BEST,0); if(score>best){store.set(BEST,score);elBest.textContent=score;}
    const avg=times.length?Math.round(times.reduce((a,b)=>a+b,0)/times.length):0;
    msg.textContent='Out of lives · '+score+' points'+(avg?' · '+avg+'ms average':''); startBtn.textContent='Start';
  }
  field.addEventListener('click',e=>{ if(!running||!cur)return; if(e.target.closest('.rx-t.bad')) hit(false,'That was a jammer beacon'); });
  startBtn.addEventListener('click',start); padInto($('#rxPad'),input); claimOnView(sec,input);
})();

/* ============================================================
   5. MISSION SIM — the call-in loop inside a mission HUD
   real codes · real call-in times · real cooldowns on a ×6 clock
   Eagle uses before rearm · threat meter · deaths cost reinforcements
   ============================================================ */
(function missionSim(){
  const sec=$('#field'); if(!sec)return;
  const C=window.HD_COMMS||{};
  const IMG=window.HD_IMG||{art:{}};
  const sim=$('#sim'), idle=$('#simIdle'), over=$('#simOver'), hud=$('#hud');
  const list=$('#hudList'), typedEl=$('#hudTyped'), ball=$('#hudBall'), inbound=$('#hudInbound'), slotsEl=$('#hudSlots');
  const radio=$('#hudRadio'), center=$('#hudCenter'), orderTxt=$('#hudOrderTxt'), orderFrom=$('#hudOrderFrom'), stateTxt=$('#hudStateTxt'), keyHint=$('#hudKey');
  const threatBar=$('#hudThreat'), reinfEl=$('#hudReinf'), timeEl=$('#hudTime'), objEl=$('#hudObj');
  const elScore=$('#fdScore'), elAvg=$('#fdAvg'), elErr=$('#fdErr'), elBest=$('#fdBest');
  const BEST='hd_fd_best', ORDERS=8, CLOCK=6;
  const ARTS=['cine_mintoria','cine_varylia','cine_marfark','cine_lesath','cine_effluvia','cine_shete','cine_cyberstan','cine_bekvam'];
  const MISSIONS=['Retrieve Valuable Data','Launch ICBM','Terminate Illegal Broadcast','Emergency Evacuation','Eradicate Automaton Forces','Purge Hatcheries','Sabotage Air Base','Spread Democracy'];
  /* Operation Modifiers, as listed in the game (the three removed ones are not used) */
  const MODS=[
    {n:'Complex Stratagem Plotting',d:'Stratagem call-in time increased by 50%.',callin:1.5},
    {n:'Orbital Fluctuations',d:'Stratagem cooldown increased by 25%.',cd:1.25},
    {n:'Poor Intel',d:'Objective locations are approximate, requiring search on ground.'},
    {n:'Gunship Patrols',d:'Flying Gunships patrol the battlefield.',threat:1.3},
    {n:'Roving Shriekers',d:'Flying Shrieker swarms traverse the battlefield.',threat:1.25},
    {n:'Atmospheric Spores',d:'Map obscured by Bug Spores.',fog:true}
  ];
  let mods=[];
  let load=[],mission=[],orders=[],oi=0,typed='',menu=false,armed=null,phase='idle',running=false;
  let score=0,errs=0,times=[],orderT=0,log=[],reinf=4,threat=0,threatRate=7,cd={},uses={},simT=40*60,lastT=0,loopIv=0,mapT=0,beeps=0;
  let enemies=[],beacon=null;
  const cdSecs=s=>{ const m=String(s.cd||'').match(/(\d+)\s*s/); return m?+m[1]:(String(s.cd||'').match(/(\d+)/)?+String(s.cd).match(/(\d+)/)[1]:60); };
  const actSecs=s=>{ let v=parseFloat(String(s.act).replace(',','.')); if(!isFinite(v)) v=3; v=Math.min(10,Math.max(1.5,v)); mods.forEach(m=>{ if(m.callin) v*=m.callin; }); return v; };
  const cdMul=()=>mods.reduce((a,m)=>a*(m.cd||1),1);
  const threatMul=()=>mods.reduce((a,m)=>a*(m.threat||1),1);
  const isEagle=s=>/^Eagle/.test(s.n)&&s.n!=='Eagle Rearm';
  const groupOf=s=>s.n==='Reinforce'?'reinforce':s.n==='Resupply'?'resupply':s.n==='SOS Beacon'?'sos':isEagle(s)?'eagle':s.g==='offensive'?'offensive':s.g==='defensive'?'defensive':'supply';
  const say=(k)=>{ const a=(C.radio&&C.radio[k])||[]; if(!a.length)return; const d=document.createElement('div'); const t=pick(a); const i=t.indexOf(':'); d.innerHTML=i>0&&i<20?`<b>${t.slice(0,i+1)}</b>${t.slice(i+1)}`:t; radio.appendChild(d); while(radio.children.length>3) radio.firstChild.remove(); setTimeout(()=>d.remove(),4300); };
  const shout=(txt,red)=>{ center.innerHTML=`<b class="${red?'red':''}">${txt}</b>`; const b=center.firstChild; void b.offsetWidth; b.classList.add('on'); };
  const fmtT=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');

  function buildLoadout(){
    const pool=S.filter(s=>s.g!=='mission'&&!/Rearm|Illumination/.test(s.n));
    load=shuffle(pool).slice(0,4);
    mission=['Reinforce','Resupply','SOS Beacon'].map(n=>S.find(s=>s.n===n)).filter(Boolean);
    cd={}; uses={}; load.forEach(s=>{ if(isEagle(s)){ const u=parseInt(s.u); uses[s.n]=isFinite(u)?u:2; } });
    orders=[]; for(let i=0;i<ORDERS;i++) orders.push(Math.random()<0.82?pick(load):mission[Math.random()<0.7?1:0]);
  }
  function available(s){ if(cd[s.n]&&cd[s.n]>simT)return false; if(isEagle(s)&&uses[s.n]<=0)return false; return true; }
  function paintSlots(){
    slotsEl.innerHTML=[...load,...mission].map((s,i)=>{
      const onCd=cd[s.n]&&cd[s.n]>simT; const left=onCd?Math.ceil((cd[s.n]-simT)):0; const total=onCd?(cd[s.n+'_total']||1):1;
      return `<div class="hud-slot ${i>=4?'mission':''} ${armed===s?'armed':''}" title="${s.n}"><img src="${window.stratIcon(s.ic)}" alt="">${onCd?`<div class="cdv" style="--p:${Math.min(100,left/total*100)}%">${left}</div>`:''}${isEagle(s)&&!onCd?`<span class="uses">×${uses[s.n]}</span>`:''}</div>`;
    }).join('');
  }
  function paintList(){
    list.innerHTML='<div class="lab">Stratagems</div>'+load.map(s=>row(s)).join('')+'<div class="lab">Mission</div>'+mission.map(s=>row(s)).join('');
    syncList();
  }
  const row=s=>`<div class="row" data-n="${s.n}"><img src="${window.stratIcon(s.ic)}" alt=""><div><b>${s.n}</b>${window.arrowRow(s.c)}</div></div>`;
  function syncList(){
    const all=[...load,...mission];
    list.querySelectorAll('.row').forEach((r,i)=>{
      const s=all[i]; const m=s.c.startsWith(typed);
      r.classList.toggle('dim',menu&&typed.length>0&&!m); r.classList.toggle('match',menu&&typed.length>0&&m); r.classList.toggle('cd',!available(s));
      r.querySelectorAll('.arw').forEach((a,k)=>{const on=m&&k<typed.length&&menu; a.classList.toggle('hit',on); a.classList.toggle('wait',!on);});
    });
    list.classList.toggle('open',menu);
  }
  function setState(p,txt){ phase=p; stateTxt.textContent=txt||''; keyHint.classList.toggle('down',HOLD.down); }
  function drawTyped(){ typedEl.innerHTML=typed.split('').map(d=>window.arrowSVG(d,'hit')).join(''); }
  function paintObj(){
    objEl.innerHTML=[['Answer Super Destroyer fire missions',oi+' / '+ORDERS,oi>=ORDERS],['Hold the position','',false],['Extract','',false]]
      .map(o=>`<li class="${o[2]?'ok':''}"><span class="ol">${o[0]}${o[1]?' <b>'+o[1]+'</b>':''}</span></li>`).join('');
  }
  function nextOrder(){
    if(oi>=ORDERS){ finish(true); return; }
    let o=orders[oi]; if(!available(o)){ const alt=[...load,...mission].filter(available); o=alt.length?pick(alt):mission[0]; orders[oi]=o; }
    const g=groupOf(o), tpl=pick((C.order&&C.order[g])||['SUPER DESTROYER: {threat}. Call in {name}.']);
    orderFrom.textContent=tpl.split(':')[0];
    orderTxt.innerHTML=tpl.slice(tpl.indexOf(':')+1).trim().replace('{threat}',pick(C.threats||['Enemy contact'])).replace('{name}','<b class="req">'+o.n.toUpperCase()+'</b>')
      +`<span class="req-line">Requested asset: <b>${o.n}</b> ${window.arrowRow(o.c)}</span>`;
    $('#hudOrder').dataset.req=o.n;
    typed=''; armed=null; menu=false; drawTyped(); ball.classList.add('hide'); inbound.classList.add('hide'); syncList(); paintSlots(); paintObj();
    threat=Math.max(0,threat-25); threatRate=7+oi*1.2;
    setState('order','to open the stratagem list'); orderT=performance.now(); SFX.beep(1500,0.05); SFX.klaxon();
  }
  holdListeners.add(down=>{
    if(!running)return; keyHint.classList.toggle('down',down);
    if(down){ if(phase==='order'||phase==='menu'){ menu=true; typed=''; drawTyped(); syncList(); setState('menu','input the code'); SFX.open(); } }
    else if(phase==='menu'){ if(typed.length) log.push('Cancelled mid-code on '+orders[oi].n); menu=false; typed=''; drawTyped(); syncList(); setState('order','to open the stratagem list'); SFX.close(); }
  });
  function input(d){
    if(!running||phase!=='menu'||!menu) return;
    typed+=d; SFX.dir(d); drawTyped();
    const all=[...load,...mission], match=all.filter(s=>s.c.startsWith(typed));
    if(!match.length){ errs++; elErr.textContent=errs; typed=''; drawTyped(); SFX.bad(); sim.classList.add('fail'); setTimeout(()=>sim.classList.remove('fail'),320); syncList(); shout(pick(C.bark.reject),true); return; }
    const full=match.find(s=>s.c===typed);
    if(full){
      if(!available(full)){ SFX.bad(); typed=''; drawTyped(); syncList(); shout('ON COOLDOWN',true); return; }
      armed=full; menu=false; SFX.ok(); $('#hudBallIc').src=window.stratIcon(full.ic); $('#hudBallName').textContent=full.n;
      ball.classList.remove('hide','fly'); typedEl.innerHTML=''; setState('armed','throw it'); syncList(); paintSlots(); shout(pick(C.bark.ready)); beeps=0;
    } else syncList();
  }
  input.needsHold=false;
  function doThrow(){
    if(!running||phase!=='armed'||!armed) return;
    const s=armed, o=orders[oi], reaction=performance.now()-orderT, g=groupOf(s);
    SFX.throw(); shout(pick(C.bark.throw)); ball.classList.add('fly'); setState('inbound','stratagem inbound');
    beacon={x:75+(Math.random()*40-20),y:52+(Math.random()*16-8),t:performance.now()};
    setTimeout(()=>{ ball.classList.add('hide'); $('#simBeam').classList.toggle('red',g==='offensive'||g==='eagle'); $('#simBeam').classList.add('on'); },650);
    const secs=actSecs(s); inbound.classList.remove('hide'); $('#hudInboundName').textContent=s.n;
    say(g==='eagle'?'eagle_inbound':g==='offensive'?'orbital_inbound':g==='reinforce'?'reinforce_inbound':g==='resupply'?'resupply_inbound':'pod_inbound');
    const t0=performance.now();
    const iv=setInterval(()=>{
      const p=Math.min(1,(performance.now()-t0)/(secs*1000)); $('#hudInboundBar').style.width=((1-p)*100)+'%'; $('#hudInboundT').textContent=(secs*(1-p)).toFixed(1)+' s';
      if(Math.floor(p*secs*3)>beeps){ beeps++; SFX.beacon(Math.min(6,beeps)); }
      if(p<1) return; clearInterval(iv); deliver(s,o,reaction,g,secs);
    },50);
  }
  function deliver(s,o,reaction,g,secs){
    $('#simBeam').classList.remove('on'); inbound.classList.add('hide');
    const streak=$('#simStreak'), flash=$('#simFlash');
    streak.className='sim-streak'; void streak.offsetWidth;
    if(g==='eagle'){ streak.classList.add('eagle'); SFX.flyby(); setTimeout(()=>{flash.className='sim-flash';void flash.offsetWidth;flash.classList.add('on');SFX.boom();sim.classList.add('shake');setTimeout(()=>sim.classList.remove('shake'),500);},620); say('eagle_hit'); }
    else if(g==='offensive'){ flash.className='sim-flash'; void flash.offsetWidth; flash.classList.add('on'); SFX.boom(); sim.classList.add('shake'); setTimeout(()=>sim.classList.remove('shake'),500); say('orbital_hit'); }
    else { streak.classList.add('pod'); setTimeout(()=>{SFX.thud();sim.classList.add('shake');setTimeout(()=>sim.classList.remove('shake'),500);},560); say(g==='reinforce'?'reinforce_hit':g==='resupply'?'resupply_hit':g==='sos'?'sos_hit':'pod_hit'); }
    /* cooldown bookkeeping: Eagles spend a use, rearm when empty; everything else takes its listed cooldown */
    if(isEagle(s)){ uses[s.n]=Math.max(0,(uses[s.n]||1)-1); if(uses[s.n]<=0){ cd[s.n]=simT+150; cd[s.n+'_total']=150; setTimeout(()=>{ say('eagle_rearm'); },1200); } }
    else { const c=Math.round((g==='reinforce'?15:cdSecs(s))*cdMul()); cd[s.n]=simT+c; cd[s.n+'_total']=c; }
    if(isEagle(s)&&uses[s.n]<=0){ /* a rearm brings all uses back when it ends */ const nm=s.n; setTimeout(()=>{ if(!running)return; uses[nm]=parseInt(s.u)||2; paintSlots(); },150/CLOCK*1000); }
    const correct=s===o;
    if(correct){ times.push(reaction); const pts=Math.max(80,Math.round(600-reaction/8)); score+=pts; elScore.textContent=score; log.push(o.n+' · '+(reaction/1000).toFixed(2)+'s · +'+pts); threat=Math.max(0,threat-35); shout('DELIVERED'); oi++; }
    else { errs++; elErr.textContent=errs; say('wrong'); log.push('Deployed '+s.n+' instead of '+o.n); threat=Math.min(100,threat+25); shout('WRONG ASSET',true); }
    elAvg.textContent=times.length?(times.reduce((a,b)=>a+b,0)/times.length/1000).toFixed(2)+'s':'·';
    armed=null; paintSlots(); paintObj();
    setTimeout(()=>{ if(running) nextOrder(); },900);
  }
  function die(){
    reinf--; reinfEl.textContent='◆'.repeat(Math.max(0,reinf))+'◇'.repeat(4-Math.max(0,reinf));
    errs++; elErr.textContent=errs; log.push('KIA during '+orders[oi].n+' order');
    const flash=$('#simFlash'); flash.className='sim-flash red'; void flash.offsetWidth; flash.classList.add('on');
    SFX.over(); shout(pick(C.radio.death),true); say('death'); sim.classList.add('dead'); setState('dead','');
    menu=false; typed=''; drawTyped(); armed=null; ball.classList.add('hide'); inbound.classList.add('hide'); syncList(); threat=0;
    setTimeout(()=>{ sim.classList.remove('dead'); if(!running)return;
      if(reinf<=0){ finish(false); return; }
      /* the next order is always to reinforce yourself */
      orders.splice(oi,0,mission[0]); nextOrder(); },1800);
  }
  function loop(){
    if(!running)return;
    const t=performance.now(); const dt=lastT?Math.min(0.25,(t-lastT)/1000):0; lastT=t;
    simT-=dt*CLOCK; timeEl.textContent=fmtT(Math.max(0,simT)); if(simT<=0){ finish(true); return; }
    if(phase==='order'||phase==='menu'||phase==='armed'){ threat=Math.min(100,threat+threatRate*threatMul()*dt); if(threat>=100){ die(); } }
    threatBar.style.width=threat+'%';
    if(Object.keys(cd).some(k=>!k.endsWith('_total')&&cd[k]>simT-dt*CLOCK&&cd[k]<=simT+0.5)) paintSlots();
    if(Math.floor(t/500)!==Math.floor((t-dt*1000)/500)) paintSlots();
    drawMap(t);
  }
  /* minimap: player centre, enemy blips press in as threat rises, beacon after a throw */
  const cv=$('#hudMap'), cx=cv.getContext('2d');
  function seedEnemies(){ enemies=Array.from({length:9},()=>({a:Math.random()*Math.PI*2,r:0.9+Math.random()*0.3,s:0.02+Math.random()*0.03})); }
  function drawMap(t){
    const W=cv.width,H=cv.height,c=W/2; cx.clearRect(0,0,W,H);
    cx.strokeStyle='rgba(255,255,255,.12)'; cx.lineWidth=1; [0.33,0.66].forEach(r=>{cx.beginPath();cx.arc(c,c,c*r,0,6.283);cx.stroke();});
    cx.beginPath(); cx.moveTo(c,0); cx.lineTo(c,H); cx.moveTo(0,c); cx.lineTo(W,c); cx.stroke();
    const press=1-threat/100*0.75;
    enemies.forEach(e=>{ e.a+=e.s*0.02; const r=c*Math.max(0.15,e.r*press); cx.fillStyle='rgba(255,68,51,.9)'; cx.beginPath(); cx.arc(c+Math.cos(e.a)*r,c+Math.sin(e.a)*r,2.6,0,6.283); cx.fill(); });
    if(beacon&&t-beacon.t<9000){ const bx=beacon.x/100*W, by=beacon.y/100*H, k=((t/400)%1); cx.strokeStyle=`rgba(61,169,255,${1-k})`; cx.lineWidth=2; cx.beginPath(); cx.arc(bx,by,4+k*10,0,6.283); cx.stroke(); cx.fillStyle='#3DA9FF'; cx.beginPath(); cx.arc(bx,by,3,0,6.283); cx.fill(); }
    cx.fillStyle='#FFE01B'; cx.beginPath(); cx.moveTo(c,c-7); cx.lineTo(c+5,c+5); cx.lineTo(c,c+2); cx.lineTo(c-5,c+5); cx.closePath(); cx.fill();
    $('#hudCompass').textContent=['N','NE','E','SE','S','SW','W','NW'][Math.floor((t/9000)%8)];
  }
  addEventListener('keydown',e=>{ if(running&&phase==='armed'&&(e.key===' '||e.key==='Enter')){e.preventDefault();doThrow();} });
  sim.addEventListener('pointerdown',e=>{ if(running&&phase==='armed'&&!e.target.closest('button,.dpad,.fd-hold')) doThrow(); });
  $('#fdThrow').addEventListener('pointerdown',e=>{e.preventDefault();doThrow();});
  window.HDPad.onThrow(()=>doThrow());
  bindHoldButton($('#fdHold')); padInto($('#fdPad'),input);
  elBest.textContent=store.get(BEST,0);
  function start(){
    running=true; score=0; errs=0; times=[]; log=[]; oi=0; reinf=4; threat=0; simT=40*60; lastT=0; beacon=null; seedEnemies();
    elScore.textContent='0'; elErr.textContent='0'; elAvg.textContent='·'; reinfEl.textContent='◆◆◆◆';
    $('#hudMission').textContent=pick(MISSIONS).toUpperCase();
    mods=shuffle(MODS).slice(0,rnd(3)); sim.classList.toggle('fog',mods.some(m=>m.fog));
    const mw=$('#hudMods'); if(mw) mw.innerHTML=mods.length?'<span class="lab">Operation modifiers</span>'+mods.map(m=>`<div title="${m.d}"><b>${m.n}</b><span>${m.d}</span></div>`).join(''):'';
    const art=IMG.art&&IMG.art[pick(ARTS)]; if(art) $('#simBg').src='assets/img/art/'+art;
    buildLoadout(); paintList(); paintSlots(); paintObj();
    idle.classList.add('hide'); over.classList.add('hide'); sim.classList.add('on');
    paintHold(); const kn=$('#fdKeyName'); if(kn) kn.textContent=holdLabel(); keyHint.textContent='HOLD '+holdLabel().toUpperCase();
    SFX.wake(); claim(input,true); radio.innerHTML=''; say('extract'); shout('DEPLOYED');
    clearInterval(loopIv); loopIv=setInterval(loop,50); setTimeout(nextOrder,1400);
  }
  function finish(success){
    running=false; clearInterval(loopIv); claim(input,false); sim.classList.remove('on');
    const avg=times.length?times.reduce((a,b)=>a+b,0)/times.length/1000:0;
    const best=store.get(BEST,0); if(score>best){store.set(BEST,score);elBest.textContent=score;}
    const R=C.ranks||['Cadet']; const rank=R[Math.min(R.length-1,Math.floor(score/450))];
    $('#fdTag').textContent=success?'Mission complete':'Mission failed'; $('#fdTag').className='tag'+(success?'':' red');
    $('#fdGrade').textContent=success?pick(C.radio.complete):pick(C.radio.fail);
    $('#fdSummary').textContent=score+' points · rank '+rank+' · '+(avg?avg.toFixed(2)+'s average order-to-throw':'no clean deliveries')+' · '+errs+' errors · '+(4-reinf)+' KIA';
    $('#fdOfficer').textContent='Democracy Officer: '+pick(C.officer||['Ready for another mission, Helldiver?']);
    $('#fdLog').innerHTML=log.map((l,i)=>`<div><i>${i+1}</i><b style="font-family:var(--f-body);font-size:13px;font-weight:500">${l}</b><span></span></div>`).join('');
    over.classList.remove('hide'); success?SFX.perfect():SFX.over();
  }
  $('#fdStart').addEventListener('click',start); $('#fdAgain').addEventListener('click',start);
  claimOnView(sec,input);
})();

/* nav chips highlight the visible drill */
(function chips(){
  const links=$$('.fbar a[href^="#"]'); if(!links.length)return;
  const io=new IntersectionObserver(es=>{es.forEach(e=>{ if(!e.isIntersecting)return; links.forEach(l=>l.classList.toggle('on', l.getAttribute('href')==='#'+e.target.id)); });},{threshold:.35});
  ['hero','rush','intel','reflex','field','range'].forEach(id=>{const n=document.getElementById(id); if(n)io.observe(n);});
})();

/* throw range: loads three.js and the range module on demand */
(function range(){
  const stage=$('#rangeStage'), btn=$('#rgStart'); if(!stage||!btn)return;
  const card=stage.querySelector('.range-start'); if(card) card.addEventListener('click',e=>{ if(!e.target.closest('button')) btn.click(); });   /* the whole card is the button */
  let started=false;
  const go=()=>{ if(started)return; started=true; btn.textContent='Loading the range…'; import(new URL(window.RANGE_SRC||'assets/range.js',location.href).href).then(m=>{ stage.classList.add('on'); m.start(stage); }).catch(err=>{ btn.textContent='Could not load the 3D range'; console.error(err); started=false; }); };
  btn.addEventListener('click',go); window.HDRange={go};
})();
/* the drill tabs: one drill on screen at a time, picked from the strip under the header, like the ship's terminal tabs.
   Other drills stay in the layout at zero height so their canvases keep a real width. */
(function tabs(){
  const bar=$('#drillTabs'); const SECS=['hero','rush','intel','reflex','field','range']; if(!bar)return;
  const BTN={rush:'#crStart',intel:'#qzStart',reflex:'#rxStart',field:'#fdStart',range:'#rgStart'};
  function show(id,start){
    SECS.forEach(k=>{ const el=document.getElementById(k); if(el) el.classList.toggle('collapsed',k!==id); });
    bar.querySelectorAll('a.chip').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+id));
    try{ history.replaceState(null,'',location.pathname+location.search.replace(/([?&])go=[^&]*&?/,'$1').replace(/[?&]$/,'')+'#'+id); }catch(e){}
    const sec=document.getElementById(id); if(sec){ const y=sec.getBoundingClientRect().top+scrollY-130; if(scrollY>y+10||scrollY<y-400) scrollTo({top:Math.max(0,y),behavior:'auto'}); }
    dispatchEvent(new Event('resize'));
    if(start){ const b=BTN[id]&&$(BTN[id]); if(b&&!b.disabled) setTimeout(()=>b.click(),320); }
  }
  bar.addEventListener('click',e=>{ const a=e.target.closest('a.chip[href^="#"]'); if(!a)return; e.preventDefault(); show(a.getAttribute('href').slice(1),true); });   /* picking a drill starts it: one click, not two */
  const go=(new URLSearchParams(location.search).get('go')||location.hash.slice(1)||'hero').toLowerCase();
  const id=SECS.includes(go)?go:'hero';
  setTimeout(()=>show(id,!!new URLSearchParams(location.search).get('go')),120);
  window.__arcadeShow=show;
})();
})();
