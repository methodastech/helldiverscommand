/* ============ THROW PRACTICE ============
   Grenades and stratagem beacons with the game's own controls, physics and timing, in 3D.
   Sources: helldivers.wiki.gg item pages (grenade fuses and radii, Servo-Assisted), data/stratagems.js (call-in per
   stratagem), the Steam guide "How to Throw Effectively" (40 m at 45 degrees, 34.6 m at 30 or 60, 20 m at 15 or 75,
   65 m at 45 in Servo-Assisted armour, a dive adds about 5 m, a sprint dive about 15 m), and the wiki on beacons
   (the call-in starts once the beacon anchors). Strike radii come from the wiki's extracted
   explosion table where it publishes one, and are marked as fallbacks where it does not.
   PC defaults: hold Ctrl for the stratagem menu, W A S D or arrows for the code, left mouse throws the beacon,
   G throws the grenade, Shift sprints, Space dives, Q marks a distance. Sounds: the game's menu, input, ready and
   throw samples from assets/sfx; explosions are synthesised. */
import * as THREE from 'three';
export function start(stage){
  const $=s=>stage.querySelector(s), S=window.HD_STRATAGEMS||[], SFX=window.HDSFX||{};
  const sfx=(k,...a)=>{ try{ SFX[k]&&SFX[k](...a); }catch(e){} };
  const secs=v=>{ const m=String(v||'').match(/([\d.]+)/); return m?+m[1]:3; };
  const byName=n=>S.find(x=>x.n===n);
  const GRENADES=[
    {id:'he',n:'G-12 High Explosive',fuse:3.5,inner:2.5,outer:7,note:'3.5 s fuse. Inner 2.5 m, outer 7 m. It has to be sitting in the hole when the fuse runs out.'},
    {id:'frag',n:'G-6 Frag',fuse:2.4,inner:4,outer:10,note:'2.4 s fuse. Inner 4 m, outer 10 m.'},
    {id:'impact',n:'G-16 Impact',fuse:0,inner:2.5,outer:7,note:'Detonates on contact. Inner 2.5 m, outer 7 m. Land it inside.'},
    {id:'inc',n:'G-10 Incendiary',fuse:2.9,inner:1,outer:7,note:'2.9 s fuse. Fire out to 7 m.'},
    {id:'stun',n:'G-23 Stun',fuse:1.8,inner:10,outer:10,note:'1.8 s fuse. Stuns everything within 10 m for 5 s.'},
    {id:'thermite',n:'G-123 Thermite',fuse:2.9,inner:2,outer:2,stick:true,note:'Sticks to what it hits. 2.9 s, then 2 m of 2000 degree fire.'}];
  const MISSION_ALWAYS=['Reinforce','Resupply','SOS Beacon','Hellbomb'].map(byName).filter(Boolean);
  const POOL=S.filter(s=>s.cat!=='MISSION');
  const RADIUS={'Orbital Precision Strike':7,'Eagle 500kg Bomb':12,'Orbital Gas Strike':9,'Orbital Railcannon Strike':4,'Orbital Airburst Strike':12,'Orbital Gatling Barrage':12,'Orbital 120mm HE Barrage':20,'Orbital 380mm HE Barrage':30,'Orbital Walking Barrage':18,'Orbital Napalm Barrage':30,'Orbital Laser':10,'Orbital EMS Strike':10,'Orbital Smoke Strike':10,'Eagle Airstrike':11,'Eagle Cluster Bomb':14,'Eagle Napalm Airstrike':12,'Eagle Strafing Run':8,'Eagle Smoke Strike':10,'Eagle 110mm Rocket Pods':6};
  const AUTO=new Set(['Orbital Railcannon Strike','Orbital Laser','Eagle 110mm Rocket Pods']);
  /* real blast radii from the wiki's extracted explosion table (r2, the band that still kills);
     the hardcoded numbers above are only the fallback for stratagems with no published explosion */
  const SS=()=>window.HD_SSTATS||{};
  const sstat=n=>{const S=SS();const k=Object.keys(S).find(x=>x===n.toUpperCase());return k?S[k]:null;};
  const radiusFor=s=>{
    const st=sstat(s.n);
    if(st&&st.x&&st.x.r2) return Math.round(st.x.r2*10)/10;
    return RADIUS[s.n]||(s.g==='offensive'?8:2.5);
  };
  const kindOf=s=>s.cat==='EAGLE'?'eagle':s.cat==='ORBITAL'?'orbital':'pod';
  const LS=k=>{try{return localStorage.getItem(k);}catch(e){return null;}}, SET=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
  let loadout=(JSON.parse(LS('hd_range_loadout')||'null')||['Orbital Precision Strike','Eagle 500kg Bomb','Orbital Gas Strike','Orbital Railcannon Strike']).map(byName).filter(Boolean);
  while(loadout.length<4) loadout.push(POOL[loadout.length]);
  let grenade=GRENADES.find(g=>g.id===LS('hd_range_gren'))||GRENADES[0], servo=LS('hd_range_servo')==='1', aids=LS('hd_range_aids')==='1';
  const st={throws:0,hits:0,streak:0,best:+(LS('hd_range_best')||0)};
  /* ---------- scene ---------- */
  const W=()=>stage.clientWidth, H=()=>document.fullscreenElement===stage?stage.clientHeight:Math.max(340,Math.round(stage.clientWidth*9/16));
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1)); renderer.setSize(W(),H()); renderer.domElement.className='range-canvas'; stage.insertBefore(renderer.domElement,stage.firstChild);
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();
  /* ---------- procedural noise for the terrain ---------- */
  const hash=(x,y)=>{ const h=Math.sin(x*127.1+y*311.7)*43758.5453; return h-Math.floor(h); };
  const vnoise=(x,y)=>{ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi, u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
    return hash(xi,yi)*(1-u)*(1-v)+hash(xi+1,yi)*u*(1-v)+hash(xi,yi+1)*(1-u)*v+hash(xi+1,yi+1)*u*v; };
  const fbm=(x,y)=>{ let s=0,a=1,f=1,n=0; for(let i=0;i<4;i++){ s+=a*vnoise(x*f,y*f); n+=a; a*=.5; f*=2.13; } return s/n; };
  const sstep=(e0,e1,x)=>{ const t=Math.min(1,Math.max(0,(x-e0)/(e1-e0))); return t*t*(3-2*t); };
  /* the firing lane stays dead flat so the throw physics stay true; the land rises outside it */
  const lane=(x,z)=>Math.min(1-sstep(46,120,Math.abs(x)),1-sstep(100,190,Math.max(0,-z)),1-sstep(16,70,Math.max(0,z)));
  const groundH=(x,z)=>{ const m=lane(x,z); if(m>=1) return 0;
    const big=(fbm(x*0.0052+11,z*0.0052+7)-0.40)*58, mid=(fbm(x*0.021+3,z*0.021+19)-0.5)*7.5;
    return (1-m)*(big+mid); };
  /* ---------- sky ---------- */
  const SKY_HORIZON=0xc9a877;
  { const c=document.createElement('canvas'); c.width=4; c.height=512; const g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,0,512);
    gr.addColorStop(0,'#0f1626'); gr.addColorStop(.34,'#2b3a4a'); gr.addColorStop(.58,'#6b6a63'); gr.addColorStop(.78,'#b2916a'); gr.addColorStop(.92,'#d8b585'); gr.addColorStop(1,'#e2c79b');
    g.fillStyle=gr; g.fillRect(0,0,4,512);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    const dome=new THREE.Mesh(new THREE.SphereGeometry(520,32,20),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,depthWrite:false,fog:false})); scene.add(dome); }
  scene.fog=new THREE.FogExp2(SKY_HORIZON,0.0045);
  const cam=new THREE.PerspectiveCamera(58,W()/H(),0.1,1200); const EYE=1.6; cam.position.set(0,EYE,0);
  /* ---------- light: low sun over the shoulder, shadows on the play area ---------- */
  scene.add(new THREE.HemisphereLight(0xdbe4f0,0x8a7550,1.05));
  const sun=new THREE.DirectionalLight(0xffdcae,2.25); sun.position.set(58,46,72); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.03;
  { const c=sun.shadow.camera; c.left=-70; c.right=70; c.top=40; c.bottom=-110; c.near=1; c.far=260; c.updateProjectionMatrix(); }
  sun.target.position.set(0,0,-55); scene.add(sun.target); scene.add(sun);
  { const fill=new THREE.DirectionalLight(0x8fa6c4,0.4); fill.position.set(-70,30,-40); scene.add(fill); }
  { const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const gr=g.createRadialGradient(64,64,2,64,64,62);
    gr.addColorStop(0,'rgba(255,240,205,.95)'); gr.addColorStop(.35,'rgba(255,214,150,.35)'); gr.addColorStop(1,'rgba(255,200,130,0)');
    g.fillStyle=gr; g.fillRect(0,0,128,128); const t=new THREE.CanvasTexture(c);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false})); glow.scale.set(170,170,1); glow.position.set(230,110,300); scene.add(glow); }
  /* ---------- terrain ---------- */
  const detail=(()=>{ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d');
    g.fillStyle='#b7aa88'; g.fillRect(0,0,256,256);
    for(let i=0;i<26000;i++){ const v=150+Math.random()*80; g.fillStyle=`rgba(${v},${v-12},${v-38},${.06+Math.random()*.5})`; g.fillRect(Math.random()*256,Math.random()*256,1,1+Math.random()*2); }
    for(let i=0;i<300;i++){ g.strokeStyle=`rgba(96,82,58,${.05+Math.random()*.10})`; g.beginPath(); const x=Math.random()*256,y=Math.random()*256; g.moveTo(x,y); g.lineTo(x+(Math.random()-.5)*40,y+(Math.random()-.5)*12); g.stroke(); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(90,90); t.anisotropy=4; t.colorSpace=THREE.SRGBColorSpace; return t; })();
  const terra=new THREE.PlaneGeometry(760,760,150,150); terra.rotateX(-Math.PI/2);
  { const pos=terra.attributes.position, col=[]; const lo=new THREE.Color(0xa08e69), hi=new THREE.Color(0xe8d6ad), dust=new THREE.Color(0xc29a6a);
    for(let k=0;k<pos.count;k++){ const x=pos.getX(k), z=pos.getZ(k), h=groundH(x,z); pos.setY(k,h);
      const t=Math.min(1,Math.max(0,(h+6)/26)), n=fbm(x*0.08+5,z*0.08+2);
      const c=lo.clone().lerp(hi,t*0.85+n*0.25).lerp(dust,Math.min(.45,Math.max(0,-z)/900)); col.push(c.r,c.g,c.b); }
    terra.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); terra.computeVertexNormals(); }
  const ground=new THREE.Mesh(terra,new THREE.MeshStandardMaterial({map:detail,vertexColors:true,roughness:1,metalness:0}));
  ground.receiveShadow=true; scene.add(ground);
  /* range signboards every 20 m: a post and a board that faces the firing line, standing outside the Charger's run */
  const signTex=txt=>{ const c=document.createElement('canvas'); c.width=256; c.height=96; const g=c.getContext('2d');
    g.fillStyle='#14120c'; g.fillRect(0,0,256,96); g.fillStyle='#ffe01b'; g.fillRect(0,0,256,10); for(let x=0;x<256;x+=28){ g.fillStyle='#000'; g.fillRect(x,0,14,10); }
    g.strokeStyle='#8a7a1c'; g.lineWidth=3; g.strokeRect(1.5,1.5,253,93);
    g.fillStyle='#ffe01b'; g.font='700 54px Barlow Semi Condensed, sans-serif'; g.textAlign='center'; g.fillText(txt,128,72);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; };
  const postM=new THREE.MeshStandardMaterial({color:0x5a5142,roughness:.9});
  const sign=(txt,x,z)=>{ const g=new THREE.Group();
    const post=new THREE.Mesh(new THREE.BoxGeometry(0.22,3.2,0.22),postM); post.position.y=1.6; post.castShadow=true; g.add(post);
    const board=new THREE.Mesh(new THREE.PlaneGeometry(4.2,1.6),new THREE.MeshStandardMaterial({map:signTex(txt),roughness:.7,side:THREE.DoubleSide})); board.position.set(0,3.2,0.13); g.add(board);
    const back=new THREE.Mesh(new THREE.PlaneGeometry(4.2,1.6),new THREE.MeshStandardMaterial({color:0x2a2620,roughness:.9,side:THREE.DoubleSide})); back.position.set(0,3.2,0.1); g.add(back);
    g.position.set(x,0,z); g.lookAt(0,3.2,0); scene.add(g); };
  for(let z=20;z<=100;z+=20){ const m=new THREE.Mesh(new THREE.PlaneGeometry(86,z%50?0.16:0.3),new THREE.MeshBasicMaterial({color:z%50?0x6d6a58:0xffe01b,transparent:true,opacity:z%50?.32:.6}));
    m.rotation.x=-Math.PI/2; m.position.set(0,0.02,-z); scene.add(m); sign(z+' m',-40,-z); sign(z+' m',40,-z); }
  /* ---------- bug holes: a raised chitin rim around a dark pit ---------- */
  const HOLES=[[-9,-26],[7,-42],[15,-58]].map(([x,z])=>{ const g=new THREE.Group(); g.position.set(x,0,z);
    const dirt=new THREE.MeshStandardMaterial({color:0x574027,roughness:1,flatShading:true});
    const chit=new THREE.MeshStandardMaterial({color:0x7e6642,roughness:.9,flatShading:true});
    for(let k=0;k<14;k++){ const a=k/14*Math.PI*2+Math.random()*0.2, r=2.3+Math.random()*0.5;
      const clod=new THREE.Mesh(new THREE.DodecahedronGeometry(0.42+Math.random()*0.38,0),dirt);
      clod.position.set(Math.cos(a)*r,0.18+Math.random()*0.2,Math.sin(a)*r); clod.rotation.set(Math.random(),Math.random(),Math.random());
      clod.scale.set(1,0.6+Math.random()*0.3,1); clod.castShadow=true; clod.receiveShadow=true; g.add(clod); }
    const pit=new THREE.Mesh(new THREE.CircleGeometry(2.0,24),new THREE.MeshBasicMaterial({color:0x0a0806})); pit.rotation.x=-Math.PI/2; pit.position.y=0.06; g.add(pit);
    const glow=new THREE.Mesh(new THREE.RingGeometry(1.55,2.0,24),new THREE.MeshBasicMaterial({color:0xd9631a,transparent:true,opacity:.34,depthWrite:false})); glow.rotation.x=-Math.PI/2; glow.position.y=0.07; g.add(glow);
    for(let k=0;k<5;k++){ const a=k/5*Math.PI*2+0.6, sp=new THREE.Mesh(new THREE.ConeGeometry(0.17,0.8+Math.random()*0.7,5),chit);
      sp.position.set(Math.cos(a)*2.0,0.45,Math.sin(a)*2.0); sp.rotation.z=(Math.random()-.5)*0.7; sp.rotation.x=(Math.random()-.5)*0.5; sp.castShadow=true; g.add(sp); }
    scene.add(g); return {kind:'hole',n:'Bug hole',g,x,z,alive:true,glow,dist:Math.hypot(x,z)}; });
  /* ---------- rocks, sitting on the land ---------- */
  const rockMat=[0x5f5a50,0x4e4a42,0x6b675d].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.95,flatShading:true}));
  const KEEPOUT=[[-19,-56],[12,-79],[-9,-26],[7,-42],[15,-58]];
  for(let i=0;i<58;i++){ const far=i>22; const x=(Math.random()-.5)*(far?340:170), z=-10-Math.random()*(far?300:150);
    if(Math.abs(x)<42&&z>-115) continue;                       /* the firing lane and every target lane stay clear */
    if(KEEPOUT.some(([tx,tz])=>Math.hypot(x-tx,z-tz)<26)) continue;
    const near=Math.hypot(x,z)<120;
    const r=new THREE.Mesh(new THREE.DodecahedronGeometry((near?0.5+Math.random()*0.7:0.8+Math.random()*1.9),0),rockMat[i%3]);
    r.position.set(x,groundH(x,z)+0.1,z); r.rotation.set(Math.random(),Math.random(),Math.random());
    r.scale.set(0.7+Math.random()*0.7,0.35+Math.random()*0.45,0.7+Math.random()*0.7); r.castShadow=true; r.receiveShadow=true; scene.add(r); }
  /* ---------- Automaton Annihilator Tank ---------- */
  const tank=(x,z,yaw)=>{ const g=new THREE.Group();
    const steel=new THREE.MeshStandardMaterial({color:0x5b6066,roughness:.62,metalness:.5,flatShading:false});
    const dark=new THREE.MeshStandardMaterial({color:0x1e2124,roughness:.85,metalness:.3});
    const rust=new THREE.MeshStandardMaterial({color:0x6e4126,roughness:.95,metalness:.15});
    const add=(m,px,py,pz,cast=true)=>{ m.position.set(px,py,pz); m.castShadow=cast; m.receiveShadow=true; g.add(m); return m; };
    add(new THREE.Mesh(new THREE.BoxGeometry(5.4,1.35,8.6),steel),0,1.75,0);
    const gl=add(new THREE.Mesh(new THREE.BoxGeometry(5.4,1.25,2.9),steel),0,1.5,-4.9); gl.rotation.x=0.62;
    add(new THREE.Mesh(new THREE.BoxGeometry(5.2,1.0,1.3),rust),0,1.6,4.7);
    add(new THREE.Mesh(new THREE.BoxGeometry(4.6,0.22,7.4),dark),0,2.46,0.2);
    for(const sd of [-1,1]){
      add(new THREE.Mesh(new THREE.BoxGeometry(1.45,1.55,9.1),dark),sd*3.3,1.0,0);
      add(new THREE.Mesh(new THREE.BoxGeometry(1.75,0.3,9.2),steel),sd*3.3,1.95,0);
      for(let k=-3;k<=3;k++){ const w=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,1.5,16),steel); w.rotation.z=Math.PI/2; add(w,sd*3.3,.66,k*1.3);
        const hub=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,1.62,8),dark); hub.rotation.z=Math.PI/2; add(hub,sd*3.3,.66,k*1.3,false); }
      const drive=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,1.5,14),dark); drive.rotation.z=Math.PI/2; add(drive,sd*3.3,1.05,-4.3);
    }
    const tur=add(new THREE.Mesh(new THREE.BoxGeometry(3.9,1.15,4.3),steel),0,3.12,0.4);
    add(new THREE.Mesh(new THREE.BoxGeometry(3.2,0.55,3.4),steel),0,3.86,0.5);
    const mant=add(new THREE.Mesh(new THREE.BoxGeometry(1.9,1.15,1.1),dark),0,3.12,-1.9);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.19,.26,7.2,12),steel); barrel.rotation.x=Math.PI/2; add(barrel,0,3.16,-5.6);
    const muz=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.8,12),dark); muz.rotation.x=Math.PI/2; add(muz,0,3.16,-8.9);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.28,12),dark),-1.0,4.2,1.4);
    add(new THREE.Mesh(new THREE.BoxGeometry(.34,.34,1.5),dark),2.1,3.0,3.3);
    for(const [ex,ey] of [[0.95,3.42],[1.35,3.42]]){ const eye=new THREE.Mesh(new THREE.SphereGeometry(.2,10,10),new THREE.MeshBasicMaterial({color:0xff2a1a})); add(eye,ex,ey,-1.85,false); }
    const el=new THREE.PointLight(0xff2a1a,1.4,11); el.position.set(1.15,3.42,-2.1); g.add(el);
    g.position.set(x,0,z); g.rotation.y=yaw; scene.add(g);
    return {kind:'tank',n:'Annihilator Tank',g,x,z,alive:true,dist:Math.hypot(x,z),steel}; };
  const TRUCKS=[tank(-19,-56,0.55),tank(12,-79,-0.28)];
  /* ---------- the Charger: about 4.5 m long, armoured head plate at the front ---------- */
  const charger=new THREE.Group();
  { const shell=new THREE.MeshStandardMaterial({color:0x6d4526,roughness:.85,flatShading:true});
    const plateM=new THREE.MeshStandardMaterial({color:0xc3ab84,roughness:.6,flatShading:true});
    const soft=new THREE.MeshStandardMaterial({color:0x8a4f31,roughness:.95,flatShading:true});
    const put=(m,x,y,z,rx,ry,rz)=>{ m.position.set(x,y,z); if(rx||ry||rz) m.rotation.set(rx||0,ry||0,rz||0); m.castShadow=true; m.receiveShadow=true; charger.add(m); return m; };
    /* abdomen and thorax */
    const back=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,0),shell); back.scale.set(1.05,0.8,1.25); put(back,0,1.45,1.5);
    const thorax=new THREE.Mesh(new THREE.IcosahedronGeometry(1.0,0),shell); thorax.scale.set(1.0,0.85,1.05); put(thorax,0,1.5,-0.2);
    /* the armoured head: a wide sloped plate, the thing you are told to dodge */
    const headPlate=new THREE.Mesh(new THREE.BoxGeometry(2.3,1.5,0.55),plateM); put(headPlate,0,1.5,-2.05,0.38);
    const crown=new THREE.Mesh(new THREE.BoxGeometry(1.9,0.5,0.9),plateM); put(crown,0,2.15,-1.6,0.22);
    const jaw=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.42,0.8),soft); put(jaw,0,0.85,-2.2);
    for(const sd of [-1,1]){ const mand=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.9,5),plateM); put(mand,sd*0.5,0.85,-2.7,-1.35); }
    for(const sd of [-1,1]){ const eye=new THREE.Mesh(new THREE.SphereGeometry(0.11,8,8),new THREE.MeshStandardMaterial({color:0x1a1208,roughness:.4})); put(eye,sd*0.72,1.82,-2.2); }
    /* four legs, front pair braced forward */
    for(const [lx,lz,fwd] of [[-1.15,-1.0,1],[1.15,-1.0,1],[-1.2,1.1,0],[1.2,1.1,0]]){
      const up=new THREE.Mesh(new THREE.CylinderGeometry(.26,.2,1.25,7),shell); put(up,lx,1.25,lz,fwd?-0.22:0.2,0,lx<0?0.18:-0.18);
      const lo=new THREE.Mesh(new THREE.CylinderGeometry(.16,.1,1.15,7),soft); put(lo,lx*1.16,0.5,lz+(fwd?-0.25:0.2),fwd?0.3:-0.24);
      const foot=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.4,5),plateM); put(foot,lx*1.22,0.12,lz+(fwd?-0.45:0.36),Math.PI); }
    /* spines and a short tail */
    for(let k=0;k<4;k++){ const sp=new THREE.Mesh(new THREE.ConeGeometry(0.13,0.55,5),plateM); put(sp,(k%2?0.45:-0.45),2.15,0.6+k*0.55,-0.25); }
    const tail=new THREE.Mesh(new THREE.ConeGeometry(0.38,1.1,6),shell); put(tail,0,1.5,2.9,Math.PI/2.2); }
  const CH={x:-30,z:-44,dir:1,speed:7.2}; charger.position.set(CH.x,0,CH.z); scene.add(charger);
  const CHT={kind:'charger',n:'Charger',g:charger,get x(){return charger.position.x;},get z(){return charger.position.z;},alive:true,dist:0};
  /* ---------- drifting dust ---------- */
  { const n=260, pos=new Float32Array(n*3); for(let i=0;i<n;i++){ pos[i*3]=(Math.random()-.5)*160; pos[i*3+1]=Math.random()*14; pos[i*3+2]=-Math.random()*150; }
    const gDust=new THREE.BufferGeometry(); gDust.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const dust=new THREE.Points(gDust,new THREE.PointsMaterial({color:0xe4cda4,size:0.16,transparent:true,opacity:.5,depthWrite:false,sizeAttenuation:true}));
    scene.add(dust); window.__dust=dust; }
  /* ---------- clouds: a slow alpha layer on the sky ---------- */
  { const c=document.createElement('canvas'); c.width=1024; c.height=512; const g=c.getContext('2d');
    g.clearRect(0,0,1024,512);
    for(let i=0;i<90;i++){ const x=Math.random()*1024, y=120+Math.random()*250, r=40+Math.random()*140;
      const gr=g.createRadialGradient(x,y,2,x,y,r); const a=.05+Math.random()*.16;
      gr.addColorStop(0,`rgba(255,244,226,${a})`); gr.addColorStop(.55,`rgba(240,226,204,${a*.5})`); gr.addColorStop(1,'rgba(230,215,190,0)');
      g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,r,r*(.32+Math.random()*.2),0,0,Math.PI*2); g.fill(); }
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=THREE.RepeatWrapping;
    const dome=new THREE.Mesh(new THREE.SphereGeometry(470,40,24),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.BackSide,depthWrite:false,fog:false,opacity:.9}));
    scene.add(dome); window.__clouds=dome; }
  /* ---------- horizon haze: a soft band where the land meets the sky ---------- */
  { const c=document.createElement('canvas'); c.width=4; c.height=128; const g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,0,128);
    gr.addColorStop(0,'rgba(201,168,119,0)'); gr.addColorStop(.55,'rgba(206,176,130,.5)'); gr.addColorStop(1,'rgba(214,188,146,.85)');
    g.fillStyle=gr; g.fillRect(0,0,4,128); const t=new THREE.CanvasTexture(c);
    const band=new THREE.Mesh(new THREE.CylinderGeometry(360,360,52,40,1,true),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.BackSide,depthWrite:false,fog:false}));
    band.position.y=18; scene.add(band); }
  /* ---------- contact shadows: a soft blob under anything that sits on the ground ---------- */
  const aoTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
    const gr=g.createRadialGradient(64,64,4,64,64,62); gr.addColorStop(0,'rgba(0,0,0,.62)'); gr.addColorStop(.55,'rgba(0,0,0,.28)'); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr; g.fillRect(0,0,128,128); const t=new THREE.CanvasTexture(c); return t; })();
  const aoMat=new THREE.MeshBasicMaterial({map:aoTex,transparent:true,depthWrite:false});
  function contact(x,z,rx,rz,parent){ const m=new THREE.Mesh(new THREE.PlaneGeometry(rx,rz||rx),aoMat);
    m.rotation.x=-Math.PI/2; m.position.set(x,0.035,z); (parent||scene).add(m); return m; }
  TRUCKS.forEach(t=>contact(t.x,t.z,13,15));
  HOLES.forEach(h=>contact(h.x,h.z,9,9));
  const chargerAO=contact(CH.x,CH.z,6.5,7.5);
  /* ---------- scrub: instanced crossed quads, the cheapest realism on open ground ---------- */
  { const c=document.createElement('canvas'); c.width=64; c.height=64; const g=c.getContext('2d');
    g.clearRect(0,0,64,64);
    for(let i=0;i<16;i++){ const x=8+Math.random()*48, h=18+Math.random()*38, w=1+Math.random()*2.2;
      g.strokeStyle=`rgba(${140+Math.random()*50},${125+Math.random()*45},${70+Math.random()*40},${.5+Math.random()*.45})`;
      g.lineWidth=w; g.beginPath(); g.moveTo(x,64); g.quadraticCurveTo(x+(Math.random()-.5)*18,64-h*.6,x+(Math.random()-.5)*26,64-h); g.stroke(); }
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    const quad=new THREE.PlaneGeometry(1.05,0.8); quad.translate(0,0.4,0);
    const geo=THREE.BufferGeometryUtils?null:null;
    const mat=new THREE.MeshLambertMaterial({map:t,transparent:true,alphaTest:.32,side:THREE.DoubleSide,depthWrite:true});
    const N=900; const inst=new THREE.InstancedMesh(quad,mat,N*2); inst.receiveShadow=true;
    const d=new THREE.Object3D(); let k=0;
    for(let i=0;i<N;i++){ const x=(Math.random()-.5)*220, z=-10-Math.random()*200;
      if(Math.hypot(x,z)<11) continue;   /* nothing looms in the diver's face */
      const y=groundH(x,z), sc=.55+Math.random()*.75, rot=Math.random()*Math.PI;
      d.position.set(x,y,z); d.rotation.set(0,rot,0); d.scale.set(sc,sc,sc); d.updateMatrix(); inst.setMatrixAt(k++,d.matrix);
      d.rotation.y=rot+Math.PI/2; d.updateMatrix(); inst.setMatrixAt(k++,d.matrix); }
    inst.instanceMatrix.needsUpdate=true; scene.add(inst); }
  /* ---------- grime on the tank steel ---------- */
  { const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d');
    g.fillStyle='#8e949b'; g.fillRect(0,0,256,256);
    for(let i=0;i<4200;i++){ const v=90+Math.random()*90; g.fillStyle=`rgba(${v},${v-4},${v-12},${.05+Math.random()*.3})`; g.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*3,1+Math.random()*2); }
    for(let i=0;i<80;i++){ g.fillStyle=`rgba(92,58,34,${.05+Math.random()*.22})`; g.beginPath(); g.ellipse(Math.random()*256,Math.random()*256,4+Math.random()*22,2+Math.random()*9,Math.random()*3,0,Math.PI*2); g.fill(); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,2); t.colorSpace=THREE.SRGBColorSpace;
    TRUCKS.forEach(tk=>{ tk.steel.map=t; tk.steel.roughness=.72; tk.steel.needsUpdate=true; }); }
  /* projectile: the ball, its light, the beacon glow, FX */
  const ball=new THREE.Group(); const ballMesh=new THREE.Mesh(new THREE.SphereGeometry(0.16,14,12),new THREE.MeshStandardMaterial({color:0x8d9096,roughness:.4,metalness:.5})); ball.add(ballMesh);
  const led=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8),new THREE.MeshBasicMaterial({color:0xff3b30})); led.position.set(0,0.16,0); ball.add(led); ball.visible=false; scene.add(ball);
  const beaconLight=new THREE.PointLight(0xff3b30,0,18); scene.add(beaconLight);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,60,8,1,true),new THREE.MeshBasicMaterial({color:0xff3b30,transparent:true,opacity:0,depthWrite:false})); beam.position.y=30; scene.add(beam);
  const arcGeo=new THREE.BufferGeometry(); const arc=new THREE.Line(arcGeo,new THREE.LineDashedMaterial({color:0xffe01b,dashSize:.8,gapSize:.5,transparent:true,opacity:.9})); arc.visible=false; scene.add(arc);
  const blast=new THREE.Mesh(new THREE.RingGeometry(0.2,1,40),new THREE.MeshBasicMaterial({color:0xffb050,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})); blast.rotation.x=-Math.PI/2; blast.position.y=0.08; scene.add(blast);
  const flash=new THREE.PointLight(0xffc070,0,60); scene.add(flash);
  const smokeTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const gr=g.createRadialGradient(32,32,4,32,32,30); gr.addColorStop(0,'rgba(200,190,170,.9)'); gr.addColorStop(1,'rgba(200,190,170,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
  const puffs=[]; for(let i=0;i<14;i++){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,transparent:true,opacity:0,depthWrite:false})); s.visible=false; scene.add(s); puffs.push({s,t:0,v:new THREE.Vector3()}); }
  const orbBeam=new THREE.Mesh(new THREE.CylinderGeometry(1.2,0.4,120,10,1,true),new THREE.MeshBasicMaterial({color:0x9fd0ff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})); orbBeam.position.y=60; scene.add(orbBeam);
  const eagle=new THREE.Group(); { const m=new THREE.MeshStandardMaterial({color:0x3a3f47,roughness:.5,metalness:.5}); const body=new THREE.Mesh(new THREE.CylinderGeometry(.5,.35,7,10),m); body.rotation.x=Math.PI/2; eagle.add(body); const wing=new THREE.Mesh(new THREE.BoxGeometry(9,.14,2.2),m); wing.position.z=.6; eagle.add(wing); const tail=new THREE.Mesh(new THREE.BoxGeometry(.14,1.6,1.4),m); tail.position.set(0,.8,2.8); eagle.add(tail); } eagle.visible=false; scene.add(eagle);
  const pod=new THREE.Mesh(new THREE.CapsuleGeometry(0.7,1.6,4,10),new THREE.MeshStandardMaterial({color:0x8a8f96,roughness:.5,metalness:.6})); pod.visible=false; scene.add(pod);
  /* ---------- state ---------- */
  const G=9.81; let yaw=0,pitch=-3,proj=null,blastT=0,last=performance.now(),menu=false,buf='',ready=null,dive=0,diveSprint=false,sprint=false,prone=0,markT=0,markD=0,fx=null,locked=false,grenades=4,restockT=0,beepT=0;
  const cool=new Map();   /* stratagem name -> time the cooldown ends, from the game's own cooldown per stratagem */
  const cdOf=s=>secs(s.cd);
  const D=s=>document.querySelector(s);   /* score and notes live under the scene, not on it */
  const hud={msg:$('#rgMsg'),stats:D('#rgStats'),note:D('#rgNote'),clock:$('#rgClock'),list:$('#rgList'),aim:$('#rgAim'),hand:$('#rgHand'),mark:$('#rgMark'),slots:$('#rgSlots'),compass:$('#rgCompass'),lock:$('#rgLock')};
  const say=(t,cls)=>{ hud.msg.textContent=t; hud.msg.className='range-msg '+(cls||''); };
  const paintStats=()=>{ hud.stats.innerHTML=`<div><b>${st.hits}</b><span>Hits</span></div><div><b>${st.throws}</b><span>Throws</span></div><div><b>${st.streak}</b><span>Streak</span></div><div><b>${st.best}</b><span>Best</span></div>`; };
  const record=hit=>{ st.throws++; if(hit){ st.hits++; st.streak++; if(st.streak>st.best){ st.best=st.streak; SET('hd_range_best',String(st.best)); } } else st.streak=0; paintStats(); };
  const dirVec=()=>{ const y=THREE.MathUtils.degToRad(yaw), p=THREE.MathUtils.degToRad(pitch); return new THREE.Vector3(Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p)); };
  /* one throw speed, as in the game: 40 m at 45 degrees standing. Servo-Assisted: 65 m. A dive adds about 5 m, a sprint dive about 15 m. Range scales with speed squared. */
  const range45=()=>(servo?65:40)+(dive>0?(diveSprint?15:5):0);
  const speed=()=>Math.sqrt(range45()*G);
  const reachNow=()=>{ const v=speed(), p=THREE.MathUtils.degToRad(Math.max(0.5,pitch)); const vy=v*Math.sin(p), vx=v*Math.cos(p); const t=(vy+Math.sqrt(vy*vy+2*G*(cam.position.y-0.16)))/G; return vx*t; };
  function simulate(v0,pos,steps){ const pts=[]; const p=pos.clone(), v=v0.clone(); for(let i=0;i<steps;i++){ pts.push(p.clone()); v.y-=G*0.05; p.addScaledVector(v,0.05); if(p.y<0){ p.y=0; pts.push(p.clone()); break; } } return pts; }
  const handPos=()=>cam.position.clone().add(new THREE.Vector3(Math.cos(THREE.MathUtils.degToRad(yaw))*0.35,-0.15,Math.sin(THREE.MathUtils.degToRad(yaw))*0.35));
  function launch(kind,item){
    const v0=dirVec().multiplyScalar(speed()); proj={pos:handPos(),vel:v0,t:0,landed:false,stuck:false,done:false,kind,item,callin:kind==='strat'?secs(item.act):0,bounces:0,from:cam.position.clone()};
    ball.visible=true; led.visible=kind==='strat'; arc.visible=false; sfx('throw');
    if(kind==='strat') cool.set(item.n,performance.now()+cdOf(item)*1000); else { grenades=Math.max(0,grenades-1); if(!grenades) restockT=8; }
    paintSlots();
    if(kind==='grenade') say(item.fuse?item.n+' away! Fuse '+item.fuse.toFixed(1)+' s. Count it, Helldiver.':item.n+' away! Detonates on contact.',''); else say(item.n+' beacon away! Call-in '+proj.callin+' s once it anchors.',''), ready=null, paintHand();
  }
  const targets=()=>[...HOLES,...TRUCKS,CHT];
  /* ---- aim practice: real projectile physics from the wiki's extracted data (velocity, drag, gravity) ----
     Steel plates at fixed ranges. A bullet leaves at the weapon's muzzle velocity, loses velocity to drag
     each second and falls under gravity; you see the drop and the flight time on every shot. */
  const PROJ=window.HD_PROJ||{};
  const AIMK=Object.keys(PROJ).filter(k=>PROJ[k].slot!=='GRENADE').sort((a,b)=>PROJ[a].n.localeCompare(PROJ[b].n));
  let aimKey=(()=>{ try{ const k=localStorage.getItem('hd_aim_w'); return PROJ[k]?k:null; }catch(e){ return null; } })();
  const PLATES=[25,50,75,100,150].map((d,i)=>{ const g=new THREE.Group(); const plate=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.1,0.08),new THREE.MeshStandardMaterial({color:0x8d949c,metalness:.7,roughness:.35}));
    plate.position.y=1.25; plate.castShadow=true; g.add(plate);
    const post=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.2,8),new THREE.MeshStandardMaterial({color:0x2a2d31})); post.position.y=0.6; g.add(post);
    const ring=new THREE.Mesh(new THREE.RingGeometry(0.28,0.36,32),new THREE.MeshBasicMaterial({color:0xff3b30,side:THREE.DoubleSide})); ring.position.set(0,1.25,0.05); g.add(ring);
    const x=-6+i*3, z=-d; g.position.set(x,0,z); g.visible=false; scene.add(g);
    return {kind:'plate',x,z,dist:d,g,plate,ring,alive:true,hit:0,shots:0}; });
  const aimOn=()=>!!aimKey;
  setTimeout(()=>showPlates(!!aimKey),0);
  const wimg=k=>{ const I=window.HD_IMG&&window.HD_IMG.weapons; const n=PROJ[k]&&PROJ[k].n; return (I&&n&&I[n])?'assets/img/weapons/'+I[n]:''; };
  function showPlates(on){ PLATES.forEach(p=>p.g.visible=on); }
  const AIMS=(()=>{ try{ return JSON.parse(localStorage.getItem('hd_aim')||'{}'); }catch(e){ return {}; } })();
  function aimRecord(k,hit){ const r=AIMS[k]||{shots:0,hits:0,streak:0,best:0}; r.shots++; if(hit){ r.hits++; r.streak++; r.best=Math.max(r.best,r.streak); } else r.streak=0; AIMS[k]=r; try{ localStorage.setItem('hd_aim',JSON.stringify(AIMS)); }catch(e){} return r; }
  function fireBullet(){
    const w=PROJ[aimKey]; if(!w) return;
    const dir=dirVec(); const v0=dir.clone().multiplyScalar(w.v);
    proj={pos:handPos(),vel:v0,t:0,done:false,kind:'bullet',item:w,from:cam.position.clone(),drag:w.drag||0,grav:(w.g==null?1:w.g)*G,drop:0,y0:null};
    proj.y0=proj.pos.y; ball.visible=true; led.visible=false; arc.visible=false; sfx('tick');
  }
  function resolveBullet(p,hitPlate){
    const w=p.item; const r=aimRecord(aimKey,!!hitPlate);
    const flight=p.t.toFixed(2), drop=Math.max(0,(p.y0-p.pos.y)-(p.from.y-p.pos.y)*0).toFixed(2);
    if(hitPlate){ hitPlate.hit++; hitPlate.ring.material.color.set(0x3ddc84); setTimeout(()=>hitPlate.ring.material.color.set(0xff3b30),500); sfx('perfect');
      say(`${w.n}: hit the ${hitPlate.dist} m plate. ${flight} s in the air, ${w.v} m/s at the muzzle, drag ${w.drag}. Streak ${r.streak}, best ${r.best}.`,'ok'); }
    else { sfx('bad'); const near=PLATES.map(q=>({q,d:Math.hypot(p.pos.x-q.x,p.pos.z-q.z)})).sort((a,b)=>a.d-b.d)[0];
      say(`${w.n}: miss. Landed ${Math.round(Math.hypot(p.pos.x-p.from.x,p.pos.z-p.from.z))} m out, ${near.d.toFixed(1)} m from the ${near.q.dist} m plate. Aim higher for range: this round drops under gravity from ${w.v} m/s.`,'bad'); }
    if(hud.note) hud.note.textContent=`Aim · ${w.n} · ${r.hits} of ${r.shots} on plate · streak ${r.streak} · best ${r.best}`;
  }

  function nearest(pos,filter){ let best=null; for(const t of targets()){ if(!t.alive||(filter&&!filter(t)))continue; const d=Math.hypot(pos.x-t.x,pos.z-t.z); if(!best||d<best.d)best={t,d}; } return best; }
  function kill(t){ t.alive=false; if(t.kind==='hole'){ t.glow.material.color.set(0x333333); t.glow.material.opacity=.2; setTimeout(()=>{t.alive=true;t.glow.material.color.set(0xff7a18);t.glow.material.opacity=.55;},7000); }
    else if(t.kind==='tank'){ t.steel.color.set(0x1d1a17); t.g.rotation.z=0.16; t.g.position.y=-0.35; setTimeout(()=>{t.alive=true;t.steel.color.set(0x585d63);t.g.rotation.z=0;t.g.position.y=0;},7000); }
    else if(t.kind==='charger'){ charger.visible=false; setTimeout(()=>{charger.visible=true;t.alive=true;},5000); } }
  function resolve(p){
    const at=p.pos; const from=p.from;
    if(p.kind==='grenade'){ const m=p.item; const b=nearest(at,t=>t.kind!=='charger'||true); const need=b?(b.t.kind==='hole'?m.inner:m.outer*0.6):0; const ok=!!b&&b.d<=need;
      explode(at,m.outer,ok,'grenade');
      if(ok){ kill(b.t); say((b.t.kind==='hole'?'Bug hole closed! Managed Democracy thanks you.':b.t.n+' at '+Math.round(b.t.dist)+' m destroyed! Sweet Liberty, what an arm.')+' '+b.d.toFixed(1)+' m from centre.','ok'); sfx('perfect'); }
      else { say(b?('Missed the '+b.t.n.toLowerCase()+' by '+b.d.toFixed(1)+' m.'+(m.fuse?' It went off '+(p.stuck?'where it stopped rolling':'in the air')+'.':'')+' The Ministry of Defense has noted it.'):'Nothing there, Helldiver. The dirt is already ours.','bad'); sfx('bad'); }
      record(ok);
    } else { const m=p.item, r=radiusFor(m), auto=AUTO.has(m.n); const b=nearest(at); const ok=!!b&&(auto?b.d<=14:b.d<=r); const hitAt=auto&&b?new THREE.Vector3(b.t.x,0,b.t.z):at;
      strikeFX(kindOf(m),hitAt,r,ok);
      if(ok){ kill(b.t); say(m.n+' on target! '+b.t.n+' at '+Math.round(Math.hypot(b.t.x-from.x,b.t.z-from.z))+' m, '+b.d.toFixed(1)+' m from the beacon after a '+p.callin+' s call-in. Liberty delivered.','ok'); sfx('perfect'); }
      else { const moved=CH.speed*p.callin; say((b?m.n+' landed '+b.d.toFixed(1)+' m from the '+b.t.n.toLowerCase()+'.':m.n+' landed on nothing but soil.')+(b&&b.t.kind==='charger'?' In '+p.callin+' s a Charger covers about '+moved.toFixed(0)+' m. Lead it by that, Helldiver.':' Adjust and throw again.'),'bad'); sfx('bad'); }
      record(ok);
    }
  }
  function explode(at,r,ok,kind){ blast.position.set(at.x,0.08,at.z); blast.scale.set(r,r,1); blast.material.color.set(ok?0xffe01b:0xff4433); blast.material.opacity=.85; blastT=0.9; flash.position.set(at.x,2,at.z); flash.intensity=kind==='pod'?4:30; sfx('boom');
    let n=0; for(const q of puffs){ if(n++>(kind==='pod'?4:10))break; q.s.visible=true; q.s.position.set(at.x+(Math.random()-.5)*r*.6,0.6,at.z+(Math.random()-.5)*r*.6); q.s.scale.set(2,2,1); q.s.material.opacity=.85; q.t=1.6+Math.random(); q.v.set((Math.random()-.5)*2,2+Math.random()*2,(Math.random()-.5)*2); } }
  function strikeFX(kind,at,r,ok){
    if(kind==='orbital'){ orbBeam.position.set(at.x,60,at.z); orbBeam.material.opacity=.7; fx={kind,t:0,at,r,ok}; }
    else if(kind==='eagle'){ eagle.visible=true; eagle.position.set(at.x+40,26,at.z+70); fx={kind,t:0,at,r,ok}; whoosh(); }
    else { pod.visible=true; pod.position.set(at.x,90,at.z); fx={kind,t:0,at,r,ok}; }
  }
  /* ---------- the stratagem menu, as the game draws it ---------- */
  const listed=()=>loadout.filter(Boolean).concat(MISSION_ALWAYS);
  function paintList(){
    if(!menu&&!ready){ hud.list.hidden=true; return; }
    hud.list.hidden=false;
    hud.list.innerHTML=listed().map(s=>{ const on=s.c.startsWith(buf), full=ready===s; return `<div class="rl ${on?'':'dim'} ${full?'ready':''}"><img src="${window.stratIcon(s.ic)}" alt=""><span>${s.n}</span><span class="arrows">${s.c.split('').map((d,i)=>window.arrowSVG(d,(on&&i<buf.length)||full?'hit':'wait')).join('')}</span></div>`; }).join('')+(menu?'':'<div class="rl-tip">Stratagem in hand. Left click throws it. For Super Earth!</div>');
  }
  function paintSlots(){ if(!hud.slots)return; const now=performance.now();
    hud.slots.innerHTML=loadout.map(x=>{ const left=Math.max(0,((cool.get(x.n)||0)-now)/1000); return `<div class="slot ${left?'cd':''} ${ready===x?'ready':''}" title="${x.n}"><i class="ic" style="background-image:url(${window.stratIcon(x.ic)})"></i>${left?`<b>${Math.ceil(left)}</b>`:''}</div>`; }).join('')
      +'<i class="slot-sep"></i>'+MISSION_ALWAYS.map(x=>{ const left=Math.max(0,((cool.get(x.n)||0)-now)/1000); return `<div class="slot sm ${left?'cd':''} ${ready===x?'ready':''}" title="${x.n}"><i class="ic" style="background-image:url(${window.stratIcon(x.ic)})"></i>${left?`<b>${Math.ceil(left)}</b>`:''}</div>`; }).join('')
      +`<div class="slot gren ${grenades?'':'cd'}"><span class="g">G</span><b>${grenades}/4</b></div>`; }
  function paintCompass(){ if(!hud.compass)return; const w=hud.compass.clientWidth||300, ppd=w/70; let h=''; for(let a=-180;a<=180;a+=15){ const d=a-yaw; if(Math.abs(d)>36)continue; const lab={0:'N',90:'E',[-90]:'W',180:'S',[-180]:'S'}[a]; h+=`<i style="left:${w/2+d*ppd}px" class="${lab?'big':''}">${lab||''}</i>`; } hud.compass.innerHTML=h+'<b></b>'; }
  function paintHand(){ hud.hand.textContent=ready?ready.n+' ready':grenade.n; hud.hand.className='range-hand '+(ready?'strat':'gren'); }
  function input(d){ if(!menu)return; buf+=d; const m=listed().filter(s=>s.c.startsWith(buf));
    if(!m.length){ buf=''; sfx('bad'); paintList(); return; }
    sfx('dir',d); const full=m.find(s=>s.c===buf); if(full){ const left=(cool.get(full.n)||0)-performance.now(); if(left>0){ buf=''; sfx('bad'); say(full.n+' is on cooldown, '+Math.ceil(left/1000)+' s. Patience is patriotic.','bad'); } else { ready=full; buf=''; sfx('ok'); paintHand(); say(full.n+' ready! Left click throws the beacon.',''); } }
    paintList(); }
  /* ---------- input: click locks the mouse and you play as in the game, Esc gives it back ---------- */
  const cv=renderer.domElement; cv.tabIndex=0;
  let zoom=false, zoomLock=false; const FOV=58, FOVZ=30;
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('pointerdown',e=>{ if(e.button===2){ e.preventDefault(); zoom=true; } });
  addEventListener('pointerup',e=>{ if(e.button===2&&!zoomLock) zoom=false; });
  /* touch: drag on the scene to look, a short tap throws or fires */
  let tdrag=null;
  cv.addEventListener('pointerdown',e=>{ if(e.pointerType!=='touch')return; tdrag={x:e.clientX,y:e.clientY,yaw,pitch,moved:false,id:e.pointerId}; try{ cv.setPointerCapture(e.pointerId); }catch(err){} },{passive:true});
  cv.addEventListener('pointermove',e=>{ if(!tdrag||e.pointerId!==tdrag.id)return; const dx=e.clientX-tdrag.x, dy=e.clientY-tdrag.y; if(Math.abs(dx)+Math.abs(dy)>6) tdrag.moved=true; const k=zoom?0.12:0.22; yaw=THREE.MathUtils.clamp(tdrag.yaw+dx*k,-80,80); pitch=THREE.MathUtils.clamp(tdrag.pitch-dy*k,-25,80); },{passive:true});
  const tend=e=>{ if(!tdrag||e.pointerId!==tdrag.id)return; const moved=tdrag.moved; tdrag=null; if(moved)return; if(proj&&!proj.done)return; if(ready) launch('strat',ready); else if(aimOn()&&!menu) fireBullet(); else say(menu?'Finish the code first, Helldiver.':'Hold CTRL and input a code, or press G for a grenade.',''); };
  cv.addEventListener('pointerup',tend); cv.addEventListener('pointercancel',e=>{ if(tdrag&&e.pointerId===tdrag.id) tdrag=null; });
  const canLock=!!cv.requestPointerLock&&!matchMedia('(pointer:coarse)').matches;
  if(!canLock&&hud.lock) hud.lock.hidden=true;   /* touch devices never see a mouse-lock prompt */
  const hoverAim=e=>{ const r=cv.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height; yaw=(x-0.5)*70; pitch=THREE.MathUtils.clamp((0.5-y)*80-3,-14,75); };
  let lockTried=false, lockFailed=false;
  const lockState=()=>{ locked=document.pointerLockElement===cv; stage.classList.toggle('locked',locked); if(hud.lock) hud.lock.hidden=locked||lockFailed; if(locked) say('Range is hot, Helldiver. Hold Ctrl for stratagems, G for the grenade. Esc hands the mouse back.',''); else { menu=false; buf=''; paintList(); } };
  document.addEventListener('pointerlockchange',lockState);
  document.addEventListener('pointerlockerror',()=>{ lockFailed=true; if(hud.lock) hud.lock.hidden=true; say('This window will not release the mouse to us, Helldiver. Aim with the pointer instead. Everything else is the same.',''); });
  cv.addEventListener('mousemove',e=>{ if(locked){ const k=zoom?0.05:0.11; yaw=THREE.MathUtils.clamp(yaw+e.movementX*k,-80,80); pitch=THREE.MathUtils.clamp(pitch-e.movementY*k,-25,80); } else if(!canLock||lockFailed||!lockTried) hoverAim(e); });
  cv.addEventListener('pointerdown',e=>{ if(e.button!==0||e.pointerType==='touch')return; e.preventDefault(); cv.focus();
    if(canLock&&!locked&&!lockFailed&&!lockTried){ lockTried=true; try{ const r=cv.requestPointerLock(); if(r&&r.catch) r.catch(()=>{ lockFailed=true; if(hud.lock) hud.lock.hidden=true; }); }catch(err){ lockFailed=true; if(hud.lock) hud.lock.hidden=true; }
      setTimeout(()=>{ if(!locked){ lockFailed=true; if(hud.lock) hud.lock.hidden=true; say('Pointer aim it is, Helldiver. Hold Ctrl for stratagems, G for the grenade, left click throws.',''); } },400); return; }
    if(!locked) hoverAim(e);
    if(proj&&!proj.done)return; if(ready) launch('strat',ready); else if(aimOn()&&!menu) fireBullet(); else say(menu?'Finish the code first, Helldiver.':'Hold Ctrl and input a code, or press G for a grenade.',''); });
  const active=()=>locked||stage.matches(':hover')||document.activeElement===cv||stage.contains(document.activeElement);
  addEventListener('keydown',e=>{ if(!active())return;
    const B=window.HD.binds.get(), tog=String(B.strat).startsWith('Toggle:');
    if(window.HD.binds.is(B.strat,e)){ if(e.repeat){ e.preventDefault(); return; } if(tog&&menu){ menu=false; buf=''; sfx('close'); paintList(); } else if(!menu){ menu=true; buf=''; sfx('open'); paintList(); } e.preventDefault(); return; }
    if(window.HD.binds.is(B.dive,e)&&!e.repeat){ e.preventDefault(); if(dive<=0&&prone<=0){ dive=0.7; diveSprint=sprint; prone=1.4; sfx('tick'); } return; }
    if(e.key==='Shift'){ sprint=true; return; }
    const D={w:'U',s:'D',a:'L',d:'R',ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R'}[e.key.length===1?e.key.toLowerCase():e.key];
    if(D&&menu){ e.preventDefault(); if(!e.repeat) input(D); return; }
    if(e.key.toLowerCase()==='g'&&!e.repeat){ e.preventDefault(); if(proj&&!proj.done)return; if(!grenades){ say('No grenades, Helldiver. Resupply incoming.','bad'); sfx('bad'); return; } launch('grenade',grenade); return; }
    if(e.key.toLowerCase()==='q'&&!e.repeat){ e.preventDefault(); const d=dirVec(); if(d.y<0){ markD=Math.round(cam.position.y/-d.y*Math.hypot(d.x,d.z)); } else markD=0; markT=2; hud.mark.textContent=markD?markD+' m':'—'; sfx('tick'); return; }
    });
  addEventListener('keyup',e=>{ const B=window.HD.binds.get(); if(!String(B.strat).startsWith('Toggle:')&&window.HD.binds.is(B.strat,e)&&menu){ menu=false; buf=''; sfx('close'); paintList(); } if(e.key==='Shift') sprint=false; });
  /* mouse side buttons as stratagem menu or dive */
  addEventListener('pointerdown',e=>{ if(!active())return; const B=window.HD.binds.get();
    if(window.HD.binds.is(B.strat,e)){ e.preventDefault(); const tog=String(B.strat).startsWith('Toggle:'); if(tog&&menu){ menu=false; buf=''; sfx('close'); paintList(); } else if(!menu){ menu=true; buf=''; sfx('open'); paintList(); } }
    else if(window.HD.binds.is(B.dive,e)){ e.preventDefault(); if(dive<=0&&prone<=0){ dive=0.7; diveSprint=sprint; prone=1.4; sfx('tick'); } } });
  addEventListener('pointerup',e=>{ const B=window.HD.binds.get(); if(!String(B.strat).startsWith('Toggle:')&&window.HD.binds.is(B.strat,e)&&menu){ menu=false; buf=''; sfx('close'); paintList(); } });
  /* synthesised sounds for what the sample set lacks: the beacon's beep, the Eagle pass, the pod impact */
  let actx=null; const ac=()=>{ try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); return actx; }catch(e){ return null; } };
  const beaconBeep=()=>{ const c=ac(); if(!c)return; const o=c.createOscillator(), g=c.createGain(); o.type='square'; o.frequency.value=2200; g.gain.value=0.035; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+0.09); o.stop(c.currentTime+0.1); };
  const whoosh=()=>{ const c=ac(); if(!c)return; const n=c.sampleRate*1.4, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++){ const e=Math.sin(Math.PI*i/n); d[i]=(Math.random()*2-1)*e*e; } const src=c.createBufferSource(); src.buffer=b; const f=c.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.2; f.frequency.setValueAtTime(400,c.currentTime); f.frequency.exponentialRampToValueAtTime(2400,c.currentTime+0.7); f.frequency.exponentialRampToValueAtTime(300,c.currentTime+1.4); const g=c.createGain(); g.gain.value=0.5; src.connect(f); f.connect(g); g.connect(c.destination); src.start(); };
  /* on-screen pad for touch and for anyone who prefers buttons: it presses the same keys */
  const pad=document.querySelector('#rgPad');
  if(pad){ const fire=(type,k,code)=>document.dispatchEvent(new KeyboardEvent(type,{key:k,code:code||('Key'+k.toUpperCase()),bubbles:true}));
    pad.addEventListener('pointerdown',e=>{ const b=e.target.closest('button'); if(!b)return; e.preventDefault(); cv.focus(); const k=b.dataset.k;
      if(k==='throw'){ if(proj&&!proj.done)return; if(ready) launch('strat',ready); else if(aimOn()&&!menu) fireBullet(); else say('Nothing in hand, Helldiver. Hold CTRL and input a code, or press G.',''); return; }
      if(k==='zoom'){ zoomLock=!zoomLock; zoom=zoomLock; b.classList.toggle('on',zoomLock); return; }
      b.classList.add('down'); fire('keydown',k,b.dataset.code); });
    const up=e=>{ const b=e.target.closest&&e.target.closest('button'); if(!b||!b.dataset.k||b.dataset.k==='throw'||b.dataset.k==='zoom')return; b.classList.remove('down'); fire('keyup',b.dataset.k,b.dataset.code); };
    pad.addEventListener('pointerup',up); pad.addEventListener('pointercancel',up); pad.addEventListener('pointerleave',e=>{ pad.querySelectorAll('button.down').forEach(b=>{ b.classList.remove('down'); fire('keyup',b.dataset.k,b.dataset.code); }); }); }
  /* ---------- loadout: slot strip like the game's loadout bar, with a full picker ---------- */
  const bar=document.querySelector('#rgModes'); if(!bar||!hud.msg) throw new Error('range markup missing');
  const GIMG={he:'assets/img/wbitems/g-6-frag.webp',frag:'assets/img/wbitems/g-6-frag.webp',impact:'assets/img/wbitems/g-16-impact.webp',inc:'assets/img/wbitems/g-10-incendiary.webp',stun:'assets/img/wbitems/g-23-stun.webp',thermite:'assets/img/wbitems/g-123-thermite-warbond-preview.webp'};
  const CATS=[...new Set(POOL.map(x=>x.cat))]; let loSel=0, loCat=CATS[0];
  const arrows=c=>c.split('').map(d=>window.arrowSVG(d,'hit')).join('');
  function paintBar(){
    bar.innerHTML=`<div class="rg-strip">`+loadout.map((x,i)=>`<button class="rg-tile" data-open="${i}" title="${x.n}"><img src="${window.stratIcon(x.ic)}" alt=""><span>${x.n}</span></button>`).join('')
      +`<i class="rg-sep"></i><button class="rg-tile gren" data-open="g"><img src="${GIMG[grenade.id]}" alt="" onerror="this.remove()"><span>${grenade.n}</span></button>`
      +`<button class="rg-tile arm ${servo?'on':''}" data-open="a"><b>${servo?'SA':'STD'}</b><span>${servo?'Servo-Assisted':'Standard armour'}</span></button>`
      +`<button class="rg-tile lo" data-open="0" title="Open the loadout screen"><img src="assets/img/brand/skull-mark.svg" alt=""><span>Loadout</span></button><label class="chip aids"><input type="checkbox" id="rgAids" ${aids?'checked':''}> Training aids</label></div>`;
  }
  const lo=document.createElement('div'); lo.className='rg-lo'; lo.hidden=true;
  lo.innerHTML=`<div class="rg-lo-in">
    <header><div class="rg-lo-title"><img src="assets/img/brand/crest.webp" alt=""><div><h3>Loadout</h3><span>Helldive Simulator &middot; four stratagems, a grenade, armour, and the weapon you shoulder</span></div></div><button class="btn sm" id="rgLoDeploy">Deploy <span class="ar">&#9654;</span></button></header>
    <div class="rg-lo-body">
      <div class="rg-lo-left">
        <p class="lab">Stratagems &middot; four slots</p><div class="rg-lo-slots" id="rgLoSlots"></div>
        <p class="lab">Kit</p><div class="rg-lo-slots" id="rgLoKit"></div>
        <p class="lab">Always available &middot; no slot</p><div class="rg-lo-fixed">${MISSION_ALWAYS.map(x=>`<div class="rg-lo-slot fixed"><img src="${window.stratIcon(x.ic)}" alt=""><span>${x.n}</span></div>`).join('')}</div>
      </div>
      <div class="rg-lo-right">
        <div class="rg-lo-cats" id="rgLoCats"></div>
        <div class="rg-lo-grid" id="rgLoGrid"></div>
        <div class="rg-lo-info" id="rgLoInfo"></div>
      </div>
    </div></div>`;
  document.body.appendChild(lo);
  const TABS=CATS.concat(['GRENADE','ARMOUR','AIM']);
  const el=id=>lo.querySelector('#'+id);
  function showInfo(kind,x){
    const box=el('rgLoInfo'); if(!x){ box.innerHTML=''; return; }
    if(kind==='strat') box.innerHTML=`<img src="${window.stratIcon(x.ic)}" alt=""><div><b>${x.n}</b><span class="arrows">${arrows(x.c)}</span><em>${x.cat} &middot; call-in ${secs(x.act)} s &middot; cooldown ${x.cd||'?'}</em></div>`;
    else if(kind==='gren') box.innerHTML=`<img src="${GIMG[x.id]}" alt="" onerror="this.remove()"><div><b>${x.n}</b><em>${x.fuse?x.fuse.toFixed(1)+' s fuse':'detonates on contact'} &middot; inner ${x.inner} m &middot; outer ${x.outer} m</em><em class="note">${x.note}</em></div>`;
    else box.innerHTML=`<img src="${x.img}" alt="" onerror="this.remove()"><div><b>${x.n}</b><em>${x.d}</em></div>`;
  }
  const ARMS=[{id:0,n:'Standard armour',d:'About 40 m at 45 degrees, 34.6 at 30 or 60, 20 at 15 or 75.',img:'assets/img/armor/b-0-tactical.webp'},
              {id:1,n:'Servo-Assisted',d:'"Increases throwing range by 30%." About 65 m at 45 degrees.',img:'assets/img/armor/sc-37-legionnaire.webp'}];
  function paintLo(){
    el('rgLoSlots').innerHTML=loadout.map((x,i)=>`<button class="rg-lo-slot ${i===loSel?'sel':''}" data-slot="${i}"><img src="${window.stratIcon(x.ic)}" alt=""><span>${x.n}</span><i>${i+1}</i></button>`).join('');
    el('rgLoKit').innerHTML=`<button class="rg-lo-slot ${loCat==='GRENADE'?'sel':''}" data-tab="GRENADE"><img src="${GIMG[grenade.id]}" alt="" onerror="this.remove()"><span>${grenade.n}</span><i>G</i></button>`
      +`<button class="rg-lo-slot ${loCat==='ARMOUR'?'sel':''}" data-tab="ARMOUR"><img src="${ARMS[servo?1:0].img}" alt="" onerror="this.remove()"><span>${ARMS[servo?1:0].n}</span><i>&#9670;</i></button>`
      +`<button class="rg-lo-slot ${loCat==='AIM'?'sel':''}" data-tab="AIM"><img src="${aimKey?wimg(aimKey):''}" alt="" onerror="this.remove()"><span>${aimKey?PROJ[aimKey].n:'Aim practice'}</span><i>LMB</i></button>`;
    el('rgLoCats').innerHTML=TABS.map(c=>`<button class="${c===loCat?'on':''}" data-cat="${c}">${c}</button>`).join('');
    if(loCat==='GRENADE'){ el('rgLoGrid').innerHTML=GRENADES.map(g=>`<button class="rg-lo-ic ${g===grenade?'taken':''}" data-g="${g.id}" title="${g.n}"><img src="${GIMG[g.id]}" alt="" onerror="this.remove()"><u>${g.n.split(' ')[0]}</u></button>`).join(''); showInfo('gren',grenade); }
    else if(loCat==='AIM'){
      const q=(lo.__aimQ||'').toLowerCase(); const SL=[['PRIMARY','Primary'],['SECONDARY','Sidearm'],['SUPPORT','Support weapon']];
      const row=k=>{ const w=PROJ[k]; return `<button class="rg-aim ${k===aimKey?'taken':''}" data-aim="${k}"><img src="${wimg(k)}" alt="" onerror="this.remove()"><span><b>${w.n}</b><i>${w.v} m/s &middot; ${w.dmg} dmg &middot; AP ${w.ap}</i></span></button>`; };
      el('rgLoGrid').innerHTML=`<div class="rg-aim-top"><input type="search" id="rgAimQ" placeholder="Search a weapon" value="${q.replace(/"/g,'')}" autocomplete="off"><button class="rg-aim-off ${aimKey?'':'taken'}" data-aim="">Put the weapon away</button></div>`
        +SL.map(([sl,lab])=>{ const ks=AIMK.filter(k=>PROJ[k].slot===sl&&(!q||PROJ[k].n.toLowerCase().includes(q))); return ks.length?`<p class="rg-aim-lab">${lab} <em>${ks.length}</em></p><div class="rg-aim-grid">${ks.map(row).join('')}</div>`:''; }).join('');
      const w=aimKey?PROJ[aimKey]:null; el('rgLoInfo').innerHTML=w?`<img class="big" src="${wimg(aimKey)}" alt="" onerror="this.remove()"><div><b>${w.n}</b><div class="rg-aim-stats"><span><b>${w.v}</b>m/s</span><span><b>${w.drag}</b>drag</span><span><b>${w.dmg}</b>damage</span><span><b>${w.ap}</b>AP</span><span><b>${w.mag}</b>per mag</span></div><em>Plates at 25, 50, 75, 100 and 150 m. Left click fires; the round drops and slows on the game's own numbers, and the message line reads the drop after each shot.</em></div>`:`<div><b>Aim practice</b><em>Pick a weapon to shoulder it. Steel plates appear at 25 to 150 m and every shot flies on the game's muzzle velocity, drag and gravity.</em></div>`;
      const qi=el('rgAimQ'); if(qi){ qi.addEventListener('input',()=>{ lo.__aimQ=qi.value; const pos=qi.selectionStart; paintLo(); const q2=el('rgAimQ'); if(q2){ q2.focus(); q2.setSelectionRange(pos,pos); } }); if(lo.__aimFocus){ qi.focus(); } }
    }
    else if(loCat==='ARMOUR'){ el('rgLoGrid').innerHTML=ARMS.map(a=>`<button class="rg-lo-ic wide ${(a.id===1)===servo?'taken':''}" data-a="${a.id}" title="${a.n}"><img src="${a.img}" alt="" onerror="this.remove()"><u>${a.id?'Servo':'Standard'}</u></button>`).join(''); showInfo('arm',ARMS[servo?1:0]); }
    else { el('rgLoGrid').innerHTML=POOL.filter(x=>x.cat===loCat).map(x=>`<button class="rg-lo-ic ${loadout.includes(x)?'taken':''}" data-n="${x.n}" title="${x.n}"><img src="${window.stratIcon(x.ic)}" alt=""></button>`).join(''); showInfo('strat',loadout[loSel]); }
  }
  function openLo(sel){ if(typeof sel==='number'){ loSel=sel; loCat=loadout[loSel].cat; } paintLo(); lo.hidden=false; sfx('open'); }
  function closeLo(){ lo.hidden=true; SET('hd_range_loadout',JSON.stringify(loadout.map(x=>x.n))); SET('hd_range_gren',grenade.id); SET('hd_range_servo',servo?'1':'0'); ready=null; buf=''; for(const f of [paintBar,paintHand,paintList,paintSlots]){ try{ f(); }catch(err){ console.warn('range paint',err); } } hud.note.textContent=grenade.note; sfx('close'); say('Loadout locked, Helldiver. '+loadout.map(x=>x.n).join(', ')+'. '+grenade.n+'. '+(servo?'Servo-Assisted armour.':'Standard armour.'),''); }
  bar.addEventListener('click',e=>{ const b=e.target.closest('[data-open]'); if(!b)return; const v=b.dataset.open;
    if(v==='g'){ loCat='GRENADE'; openLo(); } else if(v==='a'){ loCat='ARMOUR'; openLo(); } else openLo(+v); });
  bar.addEventListener('change',e=>{ if(e.target.id==='rgAids'){ aids=e.target.checked; SET('hd_range_aids',aids?'1':'0'); if(!aids){ arc.visible=false; hud.aim.textContent=''; } } });
  lo.addEventListener('click',e=>{ const t=e.target;
    if(t.closest('#rgLoDeploy')||t===lo){ closeLo(); return; }
    const tab=t.closest('[data-tab]'); if(tab){ loCat=tab.dataset.tab; paintLo(); sfx('tick'); return; }
    const sl=t.closest('[data-slot]'); if(sl){ loSel=+sl.dataset.slot; loCat=loadout[loSel].cat; paintLo(); sfx('tick'); return; }
    const c=t.closest('[data-cat]'); if(c){ loCat=c.dataset.cat; paintLo(); sfx('tick'); return; }
    const am=t.closest('[data-aim]'); if(am){ aimKey=am.dataset.aim||null; try{ localStorage.setItem('hd_aim_w',aimKey||''); }catch(e){} showPlates(!!aimKey); paintLo(); sfx('tick'); return; }
    const ic=t.closest('[data-n]'); if(ic){ const x=byName(ic.dataset.n); if(!x)return; const dup=loadout.indexOf(x); if(dup>=0&&dup!==loSel) loadout[dup]=loadout[loSel]; loadout[loSel]=x; loSel=(loSel+1)%4; paintLo(); sfx('ok'); return; }
    const g=t.closest('[data-g]'); if(g){ grenade=GRENADES.find(x=>x.id===g.dataset.g)||grenade; paintLo(); sfx('ok'); return; }
    const a=t.closest('[data-a]'); if(a){ servo=a.dataset.a==='1'; paintLo(); sfx('ok'); return; } });
  lo.addEventListener('mouseover',e=>{ const ic=e.target.closest('[data-n]'); if(ic) showInfo('strat',byName(ic.dataset.n));
    const g=e.target.closest('[data-g]'); if(g) showInfo('gren',GRENADES.find(x=>x.id===g.dataset.g));
    const a=e.target.closest('[data-a]'); if(a) showInfo('arm',ARMS[+a.dataset.a]); });
  addEventListener('keydown',e=>{ if(e.key==='Escape'&&!lo.hidden){ e.preventDefault(); closeLo(); } });
  paintBar();
  {  /* verification hooks: ?openlo opens the loadout screen, ?flatlo renders it alone so a capture shows its true layout */
    const q=new URLSearchParams(location.search);
    if(q.get('openlo')) setTimeout(()=>{ openLo(0); if(q.get('flatlo')){ lo.style.cssText='position:static;background:#06070a;padding:20px;display:grid;place-items:start center'; [...document.body.children].forEach(n=>{ if(n!==lo) n.style.display='none'; }); document.body.prepend(lo); scrollTo(0,0); } },200);
  }
  hud.note.textContent=grenade.note; paintStats(); paintHand(); paintList(); paintSlots(); paintCompass();
  say('On the line, Helldiver: '+loadout.map(x=>x.n).join(', ')+'. Hold Ctrl for the list, G for the grenade.','');
  addEventListener('resize',()=>{ renderer.setSize(W(),H()); cam.aspect=W()/H(); cam.updateProjectionMatrix(); });
  /* fullscreen: the whole stage, canvas and HUD, as a real screen */
  const fsBtn=$('#rgFull');
  if(fsBtn){ fsBtn.addEventListener('click',()=>{ if(document.fullscreenElement===stage){ document.exitFullscreen&&document.exitFullscreen(); } else if(stage.requestFullscreen){ stage.requestFullscreen().catch(()=>{}); } });
    document.addEventListener('fullscreenchange',()=>{ const on=document.fullscreenElement===stage; stage.classList.toggle('fs',on); fsBtn.textContent=on?'Exit fullscreen':'Fullscreen'; setTimeout(()=>{ renderer.setSize(W(),H()); cam.aspect=W()/H(); cam.updateProjectionMatrix(); },60); }); }
  /* ---------- loop: physics on an interval so a hidden tab still resolves fuses and call-ins, rAF only renders ---------- */
  let clock=0, ledT=0;
  function frame(){
    const now=performance.now(); const dt=Math.min(0.05,(now-last)/1000); last=now; clock+=dt;
    CH.x+=CH.dir*CH.speed*dt; if(CH.x>30){CH.x=30;CH.dir=-1;} if(CH.x<-30){CH.x=-30;CH.dir=1;} charger.position.x=CH.x; if(chargerAO) chargerAO.position.x=CH.x; charger.rotation.y=CH.dir>0?-Math.PI/2:Math.PI/2; /* head plate sits at local -z, so -PI/2 points it along +x */ charger.position.y=Math.abs(Math.sin(clock*9))*0.12;
    /* dive: the body goes forward and down, then lies prone for a moment before standing */
    if(dive>0){ dive-=dt; const k=Math.min(1,(0.7-dive)/0.7); cam.position.y=EYE-1.1*Math.sin(k*Math.PI/2); }
    else if(prone>0){ prone-=dt; cam.position.y=prone<0.4?0.5+(0.4-prone)/0.4*(EYE-0.5):0.5; }
    else { cam.position.y=EYE+(sprint?Math.sin(clock*11)*0.03:0); }
    { const want=zoom?FOVZ:FOV; if(Math.abs(cam.fov-want)>0.05){ cam.fov+=(want-cam.fov)*Math.min(1,dt*12); cam.updateProjectionMatrix(); } }
    cam.lookAt(cam.position.clone().add(dirVec()));
    if(aids&&!(proj&&!proj.done)){ const pts=simulate(dirVec().multiplyScalar(speed()),handPos(),110); arcGeo.setFromPoints(pts); arc.computeLineDistances(); arc.visible=true; hud.aim.textContent='Aim '+Math.round(pitch)+'° · about '+Math.round(reachNow())+' m'+(dive>0?(diveSprint?' (sprint dive)':' (dive)'):sprint?' (sprinting)':''); }
    if(window.__clouds) window.__clouds.rotation.y+=dt*0.0016;
    if(window.__dust){ const p=window.__dust.geometry.attributes.position; for(let i=0;i<p.count;i++){ let x=p.getX(i)+dt*1.6, y=p.getY(i)+dt*0.25; if(x>80)x=-80; if(y>15)y=0; p.setX(i,x); p.setY(i,y);} p.needsUpdate=true; }
    if(markT>0){ markT-=dt; if(markT<=0) hud.mark.textContent=''; }
    if(restockT>0){ restockT-=dt; if(restockT<=0){ grenades=4; say('Grenades restocked. Democracy provides.',''); sfx('ok'); paintSlots(); } }
    if(proj&&!proj.done&&proj.kind==='strat'&&proj.stuck){ beepT-=dt; if(beepT<=0){ beepT=0.45; beaconBeep(); } }
    if(Math.floor(clock*4)!==Math.floor((clock-dt)*4)){ if(cool.size) paintSlots(); paintCompass(); if(menu||ready) paintList(); /* the open list always mirrors the live loadout */ }
    if(proj&&!proj.done){ const p=proj; p.t+=dt;
      if(p.kind==='bullet'){ const k=Math.max(0,1-p.drag*dt); p.vel.multiplyScalar(k); p.vel.y-=p.grav*dt; p.pos.addScaledVector(p.vel,dt); p.t+=dt;
        let hitP=null; for(const q of PLATES){ if(Math.abs(p.pos.z-q.z)<0.6&&Math.abs(p.pos.x-q.x)<0.6&&Math.abs(p.pos.y-1.25)<0.6){ hitP=q; break; } }
        if(hitP||p.pos.y<=0||p.t>6||Math.hypot(p.pos.x-p.from.x,p.pos.z-p.from.z)>400){ p.done=true; ball.visible=false; resolveBullet(p,hitP); }
        ball.position.copy(p.pos); return; }
      if(!p.stuck){ p.vel.y-=G*dt; p.pos.addScaledVector(p.vel,dt);
        if(p.pos.y<=0.16){ p.pos.y=0.16; if(!p.landed){ p.landed=true; }
          if(p.kind==='strat'){ if(p.bounces<1&&Math.abs(p.vel.y)>3){ p.bounces++; p.vel.y=-p.vel.y*0.12; p.vel.x*=0.18; p.vel.z*=0.18; } else { p.stuck=true; p.landAt=p.t; beaconLight.position.copy(p.pos); beaconLight.intensity=3; beam.position.set(p.pos.x,30,p.pos.z); beam.material.opacity=.35; sfx('ok'); say('Beacon anchored at '+Math.round(p.pos.distanceTo(p.from))+' m. Call-in '+p.callin+' s. Stand clear!',''); } }
          else if(p.item.stick){ p.stuck=true; }
          else if(p.item.fuse===0){ p.done=true; resolve(p); }
          else { p.vel.y=-p.vel.y*0.26; p.vel.x*=0.34; p.vel.z*=0.34; if(Math.abs(p.vel.y)<1.2){ p.vel.y=0; p.rolling=true; } } }
      }
      /* dirt drags a grenade down fast: it settles within a couple of metres of where it lands */
      if(p.rolling&&!p.stuck){ const f=Math.max(0,1-7.5*dt/Math.max(0.6,Math.hypot(p.vel.x,p.vel.z))); p.vel.x*=f; p.vel.z*=f; p.pos.y=0.16;
        if(Math.hypot(p.vel.x,p.vel.z)<0.5){ p.vel.set(0,0,0); p.stuck=true; } }
      ball.position.copy(p.pos); ledT+=dt; led.material.color.set(Math.floor(ledT*4)%2?0xff3b30:0x3a0d0b);
      if(p.kind==='grenade'&&p.item.fuse&&p.t>=p.item.fuse){ p.done=true; resolve(p); }
      if(p.kind==='strat'&&p.stuck&&(p.t-p.landAt)>=p.callin){ p.done=true; beaconLight.intensity=0; beam.material.opacity=0; resolve(p); }
      if(p.t>16&&!p.done){ p.done=true; say('Lost it. The Ministry of Science would like it back.','bad'); record(false); }
      if(!p.done) hud.clock.textContent=(p.kind==='grenade'&&p.item.fuse?('fuse '+Math.max(0,p.item.fuse-p.t).toFixed(1)+' s'):p.stuck&&p.kind==='strat'?('call-in '+Math.max(0,p.callin-(p.t-p.landAt)).toFixed(1)+' s'):(Math.round(p.pos.distanceTo(p.from))+' m'));
      if(p.done){ ball.visible=false; }
    }
    if(fx){ fx.t+=dt;
      if(fx.kind==='orbital'){ orbBeam.material.opacity=Math.max(0,.7-fx.t*2); if(fx.t>0.25&&!fx.hit){ fx.hit=true; explode(fx.at,fx.r,fx.ok,'orbital'); } if(fx.t>1.2) fx=null; }
      else if(fx.kind==='eagle'){ eagle.position.x-=60*dt; eagle.position.z-=110*dt; eagle.rotation.y=Math.atan2(60,110); if(fx.t>0.55&&!fx.hit){ fx.hit=true; explode(fx.at,fx.r,fx.ok,'eagle'); } if(fx.t>2){ eagle.visible=false; fx=null; } }
      else { pod.position.y=Math.max(0.9,90-fx.t*fx.t*160); if(pod.position.y<=0.9&&!fx.hit){ fx.hit=true; explode(fx.at,3,fx.ok,'pod'); } if(fx.t>2.4){ pod.visible=false; fx=null; } } }
    if(blastT>0){ blastT-=dt; blast.material.opacity=Math.max(0,blastT); blast.scale.multiplyScalar(1+dt*1.2); flash.intensity*=Math.max(0,1-dt*6); }
    for(const q of puffs){ if(!q.s.visible)continue; q.t-=dt; q.s.position.addScaledVector(q.v,dt); q.v.y*=0.96; q.s.scale.multiplyScalar(1+dt*0.9); q.s.material.opacity=Math.max(0,q.t*0.45); if(q.t<=0) q.s.visible=false; }
  }
  setInterval(frame,33);
  (function render(){ renderer.render(scene,cam); requestAnimationFrame(render); })();
  const api={loadout:()=>loadout,get menu(){return menu;},set menu(v){ menu=!!v; buf=''; paintList(); },list:()=>listed().map(s=>s.n),get ready(){return ready;},input,get pitch(){return pitch;},set pitch(v){pitch=v;},get yaw(){return yaw;},set yaw(v){yaw=v;},speed,reachNow,range45,fire:(k)=>launch(k==='grenade'?'grenade':'strat',k==='grenade'?grenade:(ready||loadout[0])),cool}; window.__range=api; return api;
}
