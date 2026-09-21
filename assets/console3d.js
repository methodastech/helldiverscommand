/* ============ CONSOLE 3D ============
   The terminal screen (a live DOM element) placed on a WebGL terminal chassis, seen from the diver's angle.
   WebGL draws the chassis, ground, fog and the gauntlet; CSS3DRenderer draws the actual screen DOM in the same
   camera, so the puzzle stays crisp and keyboard-driven. */
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
let inst=null;
export function mount(stage,screen){
  if(inst) return inst;
  const W=()=>stage.clientWidth, H=()=>stage.clientHeight;
  /* screen DOM keeps a fixed pixel size inside the 3D world */
  const SW=880, SH=470;
  const holder=document.createElement('div'); holder.className='c3d-holder'; holder.style.width=SW+'px'; holder.style.minHeight=SH+'px';
  const home=screen.parentNode, next=screen.nextSibling; holder.appendChild(screen);
  const gl=new THREE.WebGLRenderer({antialias:true,alpha:true}); gl.setPixelRatio(Math.min(1.5,devicePixelRatio||1)); gl.setSize(W(),H()); gl.domElement.className='c3d-gl';
  const css=new CSS3DRenderer(); css.setSize(W(),H()); css.domElement.className='c3d-css';
  stage.appendChild(gl.domElement); stage.appendChild(css.domElement);
  const scene=new THREE.Scene(); scene.fog=new THREE.Fog(0x0b0d10,1400,3200);
  const cssScene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(36,W()/H(),10,6000);
  const CAMP=new THREE.Vector3(-300,470,1330), LOOK=new THREE.Vector3(0,-90,0); cam.position.copy(CAMP); cam.lookAt(LOOK);
  scene.add(new THREE.HemisphereLight(0x9fb0c8,0x24261c,0.85)); const key=new THREE.DirectionalLight(0xffe2a8,1.25); key.position.set(-600,900,700); scene.add(key);
  const rim=new THREE.DirectionalLight(0x6fa8ff,0.5); rim.position.set(700,400,-600); scene.add(rim);
  /* ground and clutter */
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000),new THREE.MeshStandardMaterial({color:0x23261c,roughness:1})); ground.rotation.x=-Math.PI/2; ground.position.y=-330; scene.add(ground);
  for(let i=0;i<10;i++){ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(90+Math.random()*160,0),new THREE.MeshStandardMaterial({color:0x35372f,roughness:1,flatShading:true})); r.position.set((Math.random()-.5)*3200,-300+Math.random()*60,-900-Math.random()*1600); r.rotation.set(Math.random(),Math.random(),Math.random()); scene.add(r); }
  /* the terminal: a panel leaning back on a pedestal, painted SEAF yellow */
  const term=new THREE.Group(); scene.add(term);
  const yellow=new THREE.MeshStandardMaterial({color:0xc9b21c,roughness:.55,metalness:.15}), dark=new THREE.MeshStandardMaterial({color:0x141414,roughness:.7,metalness:.3}), grey=new THREE.MeshStandardMaterial({color:0x555a5c,roughness:.6,metalness:.4});
  const panel=new THREE.Group(); panel.rotation.x=-0.38; panel.position.y=-40; term.add(panel);
  const shell=new THREE.Mesh(new THREE.BoxGeometry(SW+140,SH+130,70),yellow); shell.position.z=-40; panel.add(shell);
  const ring=new THREE.Mesh(new THREE.BoxGeometry(SW+64,SH+64,16),new THREE.MeshStandardMaterial({color:0x3b3f43,roughness:.55,metalness:.5})); ring.position.z=0; panel.add(ring);
  const bezel=new THREE.Mesh(new THREE.BoxGeometry(SW+34,SH+34,18),dark); bezel.position.z=2; panel.add(bezel);
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const b=new THREE.Mesh(new THREE.CylinderGeometry(9,9,6,12),grey); b.rotation.x=Math.PI/2; b.position.set(x*(SW/2+52),y*(SH/2+48),0); panel.add(b); }
  const hinge=new THREE.Mesh(new THREE.CylinderGeometry(22,22,SW+160,16),grey); hinge.rotation.z=Math.PI/2; hinge.position.set(0,-SH/2-60,-30); panel.add(hinge);
  const body=new THREE.Mesh(new THREE.BoxGeometry(SW+120,300,420),yellow); body.position.set(0,-SH/2-190,-150); term.add(body);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(SW+200,40,520),dark); foot.position.set(0,-SH/2-350,-170); term.add(foot);
  for(let i=0;i<4;i++){ const s=new THREE.Mesh(new THREE.BoxGeometry(SW+124,8,4),dark); s.position.set(0,-SH/2-90-i*46,62); term.add(s); }
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(10,12,12),new THREE.MeshBasicMaterial({color:0xfff4c0})); lamp.position.set(SW/2+50,SH/2+20,20); panel.add(lamp);
  const lampLight=new THREE.PointLight(0xfff0b0,1.2,900); lampLight.position.copy(lamp.position); panel.add(lampLight);
  /* the live screen, on the panel face */
  const cssObj=new CSS3DObject(holder); cssObj.position.set(0,0,10); const cssPanel=new THREE.Group(); cssPanel.rotation.x=panel.rotation.x; cssPanel.position.y=panel.position.y; cssPanel.add(cssObj); cssScene.add(cssPanel);
  /* the gauntlet */
  const arm=new THREE.Group(); term.add(arm);
  const armMat=new THREE.MeshStandardMaterial({color:0x1c1e22,roughness:.75}), trim=new THREE.MeshStandardMaterial({color:0xd8b400,roughness:.6});
  const fore=new THREE.Mesh(new THREE.CylinderGeometry(46,58,520,18),armMat); fore.rotation.z=0.42; fore.rotation.x=1.05; fore.position.set(-560,-260,760); arm.add(fore);
  const cuff=new THREE.Mesh(new THREE.CylinderGeometry(62,62,40,18),trim); cuff.rotation.copy(fore.rotation); cuff.position.set(-640,-330,900); arm.add(cuff);
  const hand=new THREE.Group(); hand.position.set(-440,-120,470); hand.rotation.set(-0.7,0.55,0.25); arm.add(hand);
  hand.add(new THREE.Mesh(new THREE.BoxGeometry(110,40,130),armMat));
  for(let i=0;i<3;i++){ const f=new THREE.Mesh(new THREE.BoxGeometry(24,26,110),armMat); f.position.set(-36+i*36,4,110); hand.add(f); }
  const thumb=new THREE.Mesh(new THREE.BoxGeometry(24,24,80),armMat); thumb.position.set(68,0,40); thumb.rotation.y=-0.6; hand.add(thumb);
  let tapT=0; const tap=()=>{tapT=0.14;};
  const onKey=e=>{ if(/^(w|a|s|d|arrow)/i.test(e.key)) tap(); };
  addEventListener('keydown',onKey);
  /* loop */
  let alive=true, t0=performance.now();
  function frame(){ if(!alive)return; const t=(performance.now()-t0)/1000;
    const dz=tapT>0?-38:0; tapT=Math.max(0,tapT-1/60); hand.position.z=470+dz+Math.sin(t*1.6)*4; hand.position.y=-120+Math.sin(t*1.1)*3;
    cam.position.x=CAMP.x+Math.sin(t*0.35)*14; cam.position.y=CAMP.y+Math.sin(t*0.5)*8; cam.lookAt(LOOK);
    gl.render(scene,cam); css.render(cssScene,cam); requestAnimationFrame(frame); }
  frame();
  const onResize=()=>{ gl.setSize(W(),H()); css.setSize(W(),H()); cam.aspect=W()/H(); cam.updateProjectionMatrix(); };
  addEventListener('resize',onResize);
  inst={unmount(){ alive=false; removeEventListener('resize',onResize); removeEventListener('keydown',onKey); if(next&&next.parentNode===home) home.insertBefore(screen,next); else home.appendChild(screen); holder.remove(); gl.dispose(); gl.domElement.remove(); css.domElement.remove(); inst=null; }};
  return inst;
}
