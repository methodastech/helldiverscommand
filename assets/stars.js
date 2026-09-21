/* ============ subpage header atmosphere: drifting stars + hellpod streaks ============ */
(function(){
'use strict';
const heads=document.querySelectorAll('.phead');
if(!heads.length)return;
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
heads.forEach(head=>{
  const bg=head.querySelector('.phead-bg'); if(!bg)return;
  const c=document.createElement('canvas'); bg.appendChild(c);
  const x=c.getContext('2d');
  let W=0,H=0,dpr=Math.min(devicePixelRatio||1,2),stars=[],streaks=[],vis=true;
  function size(){
    W=head.clientWidth;H=head.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);
    stars=Array.from({length:Math.round(W*H/5200)},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.3+.3,a:Math.random(),s:Math.random()*.12+.03}));
  }
  size(); addEventListener('resize',size,{passive:true});
  new IntersectionObserver(es=>vis=es[0].isIntersecting,{threshold:0}).observe(head);
  let t0=performance.now();
  function frame(t){
    requestAnimationFrame(frame);
    if(!vis||reduce&&t-t0>200)return;
    const e=(t-t0)/1000;
    x.clearRect(0,0,W,H);
    /* faint grid */
    x.strokeStyle='rgba(255,255,255,.035)';x.lineWidth=1;x.beginPath();
    for(let gx=(e*6)%80;gx<W;gx+=80){x.moveTo(gx,0);x.lineTo(gx,H);}
    for(let gy=0;gy<H;gy+=80){x.moveTo(0,gy);x.lineTo(W,gy);}
    x.stroke();
    /* stars */
    for(const s of stars){
      s.x-=s.s; if(s.x<0){s.x=W;s.y=Math.random()*H;}
      const tw=.55+.45*Math.sin(e*2+s.a*9);
      x.fillStyle=`rgba(190,205,230,${(.25+.5*s.a)*tw})`;
      x.beginPath();x.arc(s.x,s.y,s.r,0,6.283);x.fill();
    }
    /* occasional hellpod streak */
    if(Math.random()<.012&&streaks.length<3) streaks.push({x:Math.random()*W*.9+W*.1,y:-20,v:9+Math.random()*7,l:0});
    x.lineCap='round';
    for(let i=streaks.length-1;i>=0;i--){
      const k=streaks[i]; k.y+=k.v; k.x-=k.v*.35; k.l=Math.min(k.l+3,70);
      const g=x.createLinearGradient(k.x,k.y,k.x+k.l*.35,k.y-k.l);
      g.addColorStop(0,'rgba(255,224,27,.9)');g.addColorStop(1,'rgba(255,224,27,0)');
      x.strokeStyle=g;x.lineWidth=2;x.beginPath();x.moveTo(k.x,k.y);x.lineTo(k.x+k.l*.35,k.y-k.l);x.stroke();
      if(k.y>H+40)streaks.splice(i,1);
    }
  }
  requestAnimationFrame(frame);
});
})();
