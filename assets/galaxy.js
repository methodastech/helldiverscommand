/* ============================================================
   GALACTIC WAR MAP — live Three.js star chart
   Real planet coordinates from the community war API.
   ============================================================ */
import * as THREE from 'three';

const HOST = document.getElementById('galaxy');
if (HOST) init();

const COL = {
  Humans:     0x3DA9FF,
  Terminids:  0xFF7A18,
  Automaton:  0xFF3B30,
  Illuminate: 0xA97BFF
};

function discTexture(inner, soft){
  const s=128, c=document.createElement('canvas'); c.width=c.height=s;
  const x=c.getContext('2d'), g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(inner,'rgba(255,255,255,'+(soft?0.55:0.9)+')');
  g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,s,s);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

async function fetchWar(){
  /* shared client first: cached, rate-limit aware, with a named-planet mirror fallback */
  if(window.HDWar){ try{ const d=await window.HDWar.planets(); if(Array.isArray(d)&&d.length) return d; }catch(e){} }
  try{
    const r = await fetch('https://api.helldivers2.dev/api/v1/planets',{
      headers:{'X-Super-Client':'helldive-command-fansite','X-Super-Contact':'helldive-command'}});
    if(!r.ok) throw 0;
    const d = await r.json();
    if(Array.isArray(d) && d.length) return d;
    throw 0;
  }catch(e){
    try{
      const [inf,st] = await Promise.all([
        fetch('https://helldiverstrainingmanual.com/api/v1/war/info').then(r=>r.json()),
        fetch('https://helldiverstrainingmanual.com/api/v1/war/status').then(r=>r.json())
      ]);
      const own={1:'Humans',2:'Terminids',3:'Automaton',4:'Illuminate'};
      const byIdx={}; (st.planetStatus||[]).forEach(p=>byIdx[p.index]=p);
      return (inf.planetInfos||[]).map(p=>{
        const s=byIdx[p.index]||{};
        return {index:p.index,name:'PLANET '+p.index,sector:'',position:p.position,
                waypoints:p.waypoints||[],currentOwner:own[s.owner]||'Humans',
                health:s.health||0,maxHealth:p.maxHealth||1000000,
                statistics:{playerCount:s.players||0}};
      });
    }catch(e2){ return null; }
  }
}

function fallbackPlanets(){
  // Deterministic pseudo-galaxy so the hero always has something to render.
  const out=[], R=1, N=240;
  for(let i=0;i<N;i++){
    const a=i*2.399963, r=Math.sqrt(i/N);
    const owner = i===0?'Humans' : (i%23===0?'Terminids': i%31===0?'Automaton': i%37===0?'Illuminate':'Humans');
    out.push({index:i,name:'SECTOR NODE '+i,sector:'',position:{x:Math.cos(a)*r*R,y:Math.sin(a)*r*R},
      waypoints:[],currentOwner:owner,health:1e6,maxHealth:1e6,statistics:{playerCount:0}});
  }
  return out;
}

async function init(){
  const wrap = HOST;
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(46, wrap.clientWidth/wrap.clientHeight, .1, 400);
  cam.position.set(0, 21, 34);
  cam.lookAt(0,0,0);

  const root = new THREE.Group(); scene.add(root);
  root.rotation.x = -0.30;

  /* --- deep starfield --- */
  const sN=2600, sPos=new Float32Array(sN*3), sSz=new Float32Array(sN);
  for(let i=0;i<sN;i++){
    const r=90+Math.random()*180, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
    sPos[i*3]=r*Math.sin(ph)*Math.cos(th); sPos[i*3+1]=r*Math.cos(ph)*.55; sPos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
    sSz[i]=Math.random()*1.5+.35;
  }
  const sG=new THREE.BufferGeometry();
  sG.setAttribute('position',new THREE.BufferAttribute(sPos,3));
  sG.setAttribute('size',new THREE.BufferAttribute(sSz,1));
  const stars=new THREE.Points(sG,new THREE.PointsMaterial({
    size:.9,map:discTexture(.4,true),transparent:true,opacity:.55,depthWrite:false,
    blending:THREE.AdditiveBlending,color:0x9fb4d0,sizeAttenuation:true}));
  scene.add(stars);

  /* --- galactic haze --- */
  const haze=new THREE.Mesh(
    new THREE.PlaneGeometry(150,150),
    new THREE.MeshBasicMaterial({map:discTexture(.22,true),transparent:true,opacity:.16,
      depthWrite:false,blending:THREE.AdditiveBlending,color:0x2f5f9c}));
  haze.rotation.x=-Math.PI/2; haze.material.opacity=0.24; root.add(haze);

  /* --- data --- */
  let data = await fetchWar();
  const live = !!data;
  if(!data) data = fallbackPlanets();

  /* API coords sit in roughly a unit disc; scale so the chart fills the frame */
  const scale = 30;
  const P = data.map(p=>({
    ...p,
    v:new THREE.Vector3(p.position.x*scale, 0, p.position.y*scale)
  }));

  /* --- supply lines --- */
  const idx={}; P.forEach((p,i)=>idx[p.index]=i);
  const lp=[];
  P.forEach(p=>{ (p.waypoints||[]).forEach(w=>{
    const t=P[idx[w]]; if(!t)return;
    lp.push(p.v.x,p.v.y,p.v.z, t.v.x,t.v.y,t.v.z);
  });});
  if(lp.length){
    const lg=new THREE.BufferGeometry();
    lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(lp),3));
    root.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({
      color:0x3DA9FF,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false})));
  }

  /* --- planets --- */
  const n=P.length, pos=new Float32Array(n*3), col=new Float32Array(n*3), sz=new Float32Array(n);
  const c=new THREE.Color();
  P.forEach((p,i)=>{
    pos[i*3]=p.v.x; pos[i*3+1]=p.v.y; pos[i*3+2]=p.v.z;
    c.setHex(COL[p.currentOwner]||COL.Humans);
    col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    const players=(p.statistics&&p.statistics.playerCount)||0;
    sz[i]= p.index===0 ? 6.4 : 2.1 + Math.min(4.6, Math.sqrt(players)/9);
  });
  const pg=new THREE.BufferGeometry();
  pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  pg.setAttribute('color',new THREE.BufferAttribute(col,3));
  pg.setAttribute('aSize',new THREE.BufferAttribute(sz,1));

  const pm=new THREE.ShaderMaterial({
    uniforms:{uTex:{value:discTexture(.3,false)},uTime:{value:0},uPix:{value:renderer.getPixelRatio()}},
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`
      attribute float aSize; varying vec3 vC; varying float vS;
      uniform float uTime, uPix;
      void main(){
        vC=color; vS=aSize;
        vec4 mv=modelViewMatrix*vec4(position,1.0);
        float pulse=1.0+0.16*sin(uTime*1.7+position.x*3.1+position.z*2.3);
        gl_PointSize=aSize*pulse*uPix*(150.0/-mv.z);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader:`
      uniform sampler2D uTex; varying vec3 vC; varying float vS;
      void main(){
        vec4 t=texture2D(uTex,gl_PointCoord);
        if(t.a<0.02) discard;
        gl_FragColor=vec4(vC*(1.35+vS*0.12), t.a);
      }`,
    vertexColors:true
  });
  const cloud=new THREE.Points(pg,pm); root.add(cloud);

  /* --- halos on the busiest contested worlds --- */
  const hot=P.filter(p=>p.currentOwner!=='Humans' && (p.statistics&&p.statistics.playerCount>400))
             .sort((a,b)=>(b.statistics.playerCount)-(a.statistics.playerCount)).slice(0,8);
  const halos=hot.map(p=>{
    const m=new THREE.Mesh(new THREE.RingGeometry(1.25,1.45,40),
      new THREE.MeshBasicMaterial({color:COL[p.currentOwner]||0xffffff,transparent:true,opacity:.7,
        side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
    m.rotation.x=-Math.PI/2; m.position.copy(p.v); root.add(m); return m;
  });

  /* --- Super Earth ring --- */
  const se=P.find(p=>p.index===0)||P[0];
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.4,2.75,64),
    new THREE.MeshBasicMaterial({color:0xFFE01B,transparent:true,opacity:.85,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.copy(se.v); root.add(ring);
  const ring2=ring.clone(); ring2.material=ring.material.clone(); ring2.material.opacity=.3;
  root.add(ring2);

  /* --- hover --- */
  const ray=new THREE.Raycaster(); ray.params.Points.threshold=1.15;
  const m=new THREE.Vector2(-9,-9);
  const tip=document.getElementById('galaxyTip');
  let hoverIdx=-1;
  wrap.addEventListener('pointermove',e=>{
    const r=wrap.getBoundingClientRect();
    m.x=((e.clientX-r.left)/r.width)*2-1;
    m.y=-((e.clientY-r.top)/r.height)*2+1;
    px=(e.clientX-r.left)/r.width-.5; py=(e.clientY-r.top)/r.height-.5;
    if(tip){tip.style.left=(e.clientX-r.left)+'px'; tip.style.top=(e.clientY-r.top)+'px';}
  },{passive:true});
  wrap.addEventListener('pointerleave',()=>{m.set(-9,-9);px=py=0;});

  /* --- summary out to the page --- */
  const tally={Humans:0,Terminids:0,Automaton:0,Illuminate:0};
  let players=0;
  P.forEach(p=>{tally[p.currentOwner]=(tally[p.currentOwner]||0)+1; players+=(p.statistics&&p.statistics.playerCount)||0;});
  document.dispatchEvent(new CustomEvent('hd:galaxy',{detail:{live,tally,players,total:P.length}}));

  /* --- fit the camera to the actual spread of the chart --- */
  let R=1; P.forEach(p=>{R=Math.max(R,Math.hypot(p.v.x,p.v.z));});
  const vFov=cam.fov*Math.PI/180;
  const need=(R*1.06)/Math.tan(vFov/2);
  const HOME=new THREE.Vector3(0, need*0.52, need*0.82);
  const camTarget=HOME.clone(), look=new THREE.Vector3(0,0,0), lookTarget=new THREE.Vector3(0,0,0);
  /* intro: start far out and swoop in */
  cam.position.copy(HOME).multiplyScalar(2.6); cam.position.y*=1.4;
  cam.lookAt(0,0,0);
  const introStart=performance.now();

  /* --- focus / selection --- */
  let focus=null;            // planet object or null
  const sel=new THREE.Mesh(new THREE.RingGeometry(1.5,1.75,48),
    new THREE.MeshBasicMaterial({color:0xFFE01B,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  sel.rotation.x=-Math.PI/2; root.add(sel);
  const panel=document.getElementById('planetPanel');
  const hint=document.getElementById('galaxyHint');
  function setFocus(p){
    focus=p;
    document.dispatchEvent(new CustomEvent('hd:planet',{detail:p?{
      name:p.name,sector:p.sector,owner:p.currentOwner,biome:p.biome,hazards:p.hazards,
      players:(p.statistics&&p.statistics.playerCount)||0,
      lib:p.maxHealth?(1-p.health/p.maxHealth)*100:0,regen:p.regenPerSecond,
      event:p.event,index:p.index,stats:p.statistics}:null}));
    if(p){ sel.position.copy(p.v); sel.material.opacity=.9; wrap.classList.add('pick'); }
    else { sel.material.opacity=0; wrap.classList.remove('pick'); }
  }
  window.HDGalaxy={ focus:setFocus, clear:()=>setFocus(null), planets:P };

  let downAt=null;
  wrap.addEventListener('pointerdown',e=>{downAt=[e.clientX,e.clientY];});
  wrap.addEventListener('pointerup',e=>{
    if(!downAt) return;
    const moved=Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1]); downAt=null;
    if(moved>6) return;
    const r=wrap.getBoundingClientRect();
    const mm=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1);
    ray.setFromCamera(mm,cam);
    const hits=ray.intersectObject(cloud);
    if(hits.length){ setFocus(P[hits[0].index]); if(window.HDSFX) window.HDSFX.open(); }
    else if(focus){ setFocus(null); if(window.HDSFX) window.HDSFX.close(); }
  });
  addEventListener('keydown',e=>{ if(e.key==='Escape'&&focus) setFocus(null); });
  if(hint) setTimeout(()=>hint.classList.add('on'),2600);

  /* --- loop --- */
  let px=0,py=0,rx=-0.30,ry=0,t0=performance.now(),vis=true;
  /* on wide screens the chart lives in the right half so the headline stays clean */
  const offX=()=>wrap.clientWidth>1050 ? wrap.clientWidth/wrap.clientHeight*6.2 : 0;
  document.addEventListener('visibilitychange',()=>vis=!document.hidden);
  const io=new IntersectionObserver(es=>{vis=es[0].isIntersecting&&!document.hidden;},{threshold:0});
  io.observe(wrap);

  function frame(t){
    requestAnimationFrame(frame);
    if(!vis) return;
    const e=(t-t0)/1000;
    pm.uniforms.uTime.value=e;
    root.rotation.y += focus ? 0.00012 : 0.00075;
    rx += ((-0.30 + py*0.20) - rx)*0.05;
    ry += (px*0.30 - ry)*0.05;
    root.rotation.x = rx;
    root.position.x = offX() - px*3;

    /* camera: intro swoop, then home or focused planet */
    if(focus){
      const wp=focus.v.clone().applyMatrix4(root.matrixWorld);
      lookTarget.copy(wp);
      camTarget.set(wp.x+need*0.10, wp.y+need*0.16, wp.z+need*0.26);
    }else{
      lookTarget.set(0,0,0); camTarget.copy(HOME);
    }
    const introP=Math.min(1,(t-introStart)/2600);
    const k = introP<1 ? 0.028+0.05*introP : (focus?0.06:0.045);
    cam.position.lerp(camTarget,k);
    look.lerp(lookTarget,k);
    cam.lookAt(look);
    sel.rotation.z += 0.01;
    stars.rotation.y = e*0.006;
    const s=1+Math.sin(e*2.2)*0.10; ring.scale.setScalar(s);
    halos.forEach((m,i)=>{ const k=((e*0.42+i*0.17)%1);
      m.scale.setScalar(1+k*2.2); m.material.opacity=.62*(1-k); });
    ring2.scale.setScalar(1+((e*0.55)%1)*1.9);
    ring2.material.opacity=.34*(1-((e*0.55)%1));

    /* hover pick */
    if(tip){
      ray.setFromCamera(m,cam);
      const hits=ray.intersectObject(cloud);
      if(hits.length){
        const i=hits[0].index;
        if(i!==hoverIdx){
          hoverIdx=i; const p=P[i];
          const lib=p.maxHealth?(1-p.health/p.maxHealth)*100:0;
          tip.innerHTML=
            `<b>${p.name}</b>`+
            (p.sector?`<span>${p.sector} sector</span>`:'')+
            `<span class="o o-${(p.currentOwner||'').toLowerCase()}">${p.currentOwner}</span>`+
            ((p.statistics&&p.statistics.playerCount)?`<span>${p.statistics.playerCount.toLocaleString()} helldivers deployed</span>`:'')+
            (p.currentOwner!=='Humans'?`<span>${lib.toFixed(1)}% liberated</span>`:'');
          tip.classList.add('on');
        }
      }else if(hoverIdx!==-1){ hoverIdx=-1; tip.classList.remove('on'); }
    }
    renderer.render(scene,cam);
  }
  requestAnimationFrame(frame);

  addEventListener('resize',()=>{
    const w=wrap.clientWidth,h=wrap.clientHeight;
    cam.aspect=w/h; cam.updateProjectionMatrix(); renderer.setSize(w,h);
  },{passive:true});

  wrap.classList.add('ready');
}
