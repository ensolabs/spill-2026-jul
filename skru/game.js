'use strict';
(()=>{
  const I=CurlIce,$=id=>document.getElementById(id),canvas=$('ice'),c=canvas.getContext('2d');
  let end=0,phase='setup',stones,trace=[],samples=[],sampleClock=0,sweeping=false,drag=null,last=0,won=false,replayTime=0,shots=0;
  const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
  function sync(){
    $('line').value=(+$('aim').value/100).toFixed(2)+' m';$('power').value=(+$('weight').value/100).toFixed(2)+' m/s';
    $('end').textContent='End '+(end+1)+' / 3';$('title').textContent=I.ends[end].name;$('brief').textContent=I.ends[end].brief;
    $('setup').disabled=phase!=='setup';$('throw').hidden=phase==='flight';$('sweep').hidden=phase!=='flight';
    $('replay').hidden=phase!=='result';$('retry').hidden=phase!=='result'||!won;$('throw').textContent=phase==='setup'?'Deliver stone':!won?'Throw again':end===2?'Play a new match':'Next end';
  }
  function prepare(keepSettings=false){stones=I.rack(end);phase='setup';trace=[];samples=[];sampleClock=0;sweeping=false;drag=null;won=false;
    if(!keepSettings){$('weight').value=end===2?453:422;$('aim').value=-70;$('turn').value='1'}$('status').textContent='Red to play.';sync()}
  function launch(){if(phase!=='setup')return;shots++;phase='flight';I.release(stones[0],+$('aim').value/100,+$('weight').value/100);$('status').textContent='Stone away. Hold to sweep.';sync()}
  function finish(){
    phase='result';replayTime=0;setBroom(false);won=I.win(stones,end);
    const d=I.distance(stones[0]),measure=Number.isFinite(d)?d.toFixed(2)+' m from the button.':'Red went out of play.';
    $('status').textContent=(won?(end===2?'Match complete in '+shots+' deliveries. ':'End won. '):'End missed. ')+measure;sync();
  }
  $('throw').onclick=()=>{if(phase==='setup')return launch();if(!won)return prepare(true);end=(end+1)%3;if(end===0)shots=0;prepare()};
  $('retry').onclick=()=>prepare(true);
  $('replay').onclick=()=>{replayTime=0};
  for(const id of ['aim','weight'])$(id).oninput=sync;
  function setBroom(on){sweeping=on&&phase==='flight';$('sweep').setAttribute('aria-pressed',String(sweeping))}
  const broom=$('sweep');broom.onpointerdown=e=>{e.preventDefault();broom.setPointerCapture(e.pointerId);setBroom(true)};
  broom.onlostpointercapture=broom.onpointerup=()=>setBroom(false);
  document.addEventListener('keydown',e=>{if(phase==='flight'&&e.code==='Space'&&!e.composedPath().some(n=>n.tagName==='ARCADE-NAV')){e.preventDefault();setBroom(true)}});
  document.addEventListener('keyup',e=>{if(e.code==='Space')setBroom(false)});
  window.addEventListener('blur',()=>setBroom(false));
  canvas.onpointerdown=e=>{if(phase!=='setup')return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(!drag)return;const box=canvas.getBoundingClientRect();
    $('aim').value=clamp((drag.x-e.clientX)/box.width*760,-200,200);
    $('weight').value=clamp(380+(e.clientY-drag.y)/box.height*390,380,490);sync()};
  canvas.onpointerup=e=>{if(!drag)return;const pull=e.clientY-drag.y;drag=null;if(pull>5)launch()};
  canvas.onlostpointercapture=()=>{drag=null};

  const poly=(v,color)=>{c.fillStyle=color;c.beginPath();v.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};
  const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,2*Math.PI);c.fill()};
  function line(a,b,col,width=1){c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke()}
  function label(x,y,txt,col='#e7f4ee'){c.fillStyle=col;c.font='bold 15px monospace';c.fillText(txt,x,y)}
  function random(n){const f=Math.sin(n*13.27+4.6)*43758;return f-Math.floor(f)}
  const sky=c.createLinearGradient(0,0,0,560);sky.addColorStop(0,'#172b48');sky.addColorStop(.34,'#738eaa');sky.addColorStop(.35,'#aec5cc');sky.addColorStop(1,'#668597');
  function landscape(){
    c.fillStyle=sky;c.fillRect(0,0,900,560);
    for(let i=0;i<77;i++)ellipse(random(i)*900,random(i+77)*110,1,1,'#cbdcd9');
    ellipse(688,44,14,14,'#fff2c8');
    for(let j=0;j<2;j++){
      const pts=[[0,185]];for(let i=0;i<=60;i++)pts.push([i*15,134+j*14-14*Math.sin(i*.24+j)-21*random(i+j*53)]);
      pts.push([900,185]);poly(pts,j?'#466276':'#798fa1');
    }
    for(let i=0;i<100;i++){const x=i*9,y=165+random(i)*10,h=8+random(i+7)*27;
      poly([[x-h*.23,y],[x,y-h],[x+h*.24,y]],'#294653')}
    for(const x of [91,179,731,780]){const y=166;poly([[x-10,y],[x-10,y-10],[x+8,y-10],[x+8,y]],'#635456');
      poly([[x-14,y-10],[x-3,y-18],[x+12,y-10]],'#e3e7dc');c.fillStyle='#ffd191';c.fillRect(x-6,y-7,3,4)}
  }
  const backdrop=document.createElement('canvas');backdrop.width=900;backdrop.height=560;
  landscape();backdrop.getContext('2d').drawImage(canvas,0,0);
  const rings=[[1.829,'#467eab'],[1.219,'#f6f7ee'],[.610,'#d16e66'],[.152,'#faf8e9']];
  function view(t){
    c.drawImage(backdrop,0,0);
    const own=stones[0],cam=Math.min(own.y-1.8,I.tee-3.4);
    const project=(x,y)=>[450+x*645/(y-cam+2.3),151+1380/(y-cam+2.3)];
    const near=cam+1.04,far=I.length;
    const strip=(x1,x2,col)=>poly([project(x1,near),project(x1,far),project(x2,far),project(x2,near)],col);
    strip(-2.5,2.5,'#597985');strip(-2.375,2.375,'#d6e7e8');
    for(let i=0;i<34;i++){const x=random(i)*4.7-2.35;strip(x,x+.006,'#bed4da')}
    for(let i=0;i<570;i++){const y=random(i+480)*I.length;if(y<near)continue;const p=project(random(i)*4.65-2.325,y);c.fillStyle=i%2?'#edf4ed':'#afc9d2';c.fillRect(...p,1.8,1)}
    for(const y of [I.length-I.tee,I.tee]){
      for(const [r,col] of rings){
        const pts=[];for(let i=0;i<72;i++){const a=i*Math.PI/36,sy=y+r*Math.sin(a);pts.push(project(r*Math.cos(a),Math.max(near-.07,sy)))}
        if(y+r>near)poly(pts,col)
      }
      if(y>near)line(project(-2.375,y),project(2.375,y),'#7c9198');
    }
    for(const y of [I.length-I.tee+6.401,I.tee-6.401,I.tee+1.829]){
      if(y>near)line(project(-2.375,y),project(2.375,y),'#ad6262',y===I.tee+1.829?1:3)}
    line(project(0,near),project(0,far),'#93aab4');
    for(let y=44;y>near;y-=8)for(const side of [-1,1]){
      const p=project(side*2.8,y),scale=645/(y-cam+2.3),h=scale*1.9;
      line(p,[p[0],p[1]-h],'#435965',Math.max(1,scale*.024));
      c.save();c.shadowColor='#fff3ba';c.shadowBlur=11;ellipse(p[0],p[1]-h,Math.max(3,scale*.15),Math.max(2,scale*.035),'#fff0c4');c.restore()
    }
    if(phase==='setup'){c.setLineDash([6,7]);line(project(0,I.hack),project(+$('aim').value/100,I.tee),'#ad6556',2);c.setLineDash([])}
    [...stones].map((s,i)=>({s,i})).sort((a,b)=>b.s.y-a.s.y).forEach(({s,i})=>{
      if(s.out||s.y<near-.1)return;const [x,y]=project(s.x,s.y),r=.145*645/(s.y-cam+2.3);
      ellipse(x+1,y+1,r*1.04,r*.49,'#91abb4');ellipse(x,y-r*.28,r,r*.56,'#526772');ellipse(x,y-r*.52,r*.94,r*.45,'#91a3a9');
      ellipse(x,y-r*.69,r*.73,r*.32,i?'#eeb54d':'#d65b50');line([x-r*.32,y-r*.8],[x+r*.31,y-r*.98],i?'#82592c':'#923e38',Math.max(1,r*.21))
    });
    if(sweeping&&!own.out){const [x,y]=project(own.x,own.y+.38),w=20*Math.sin(t*17);line([x+w,y-2],[x+w+27,y-44],'#526772',3);line([x+w-9,y],[x+w+9,y],'#e9ac52',5)}
  }
  function overhead(){
    c.fillStyle='#203b48';c.fillRect(0,0,900,560);
    const scale=78,point=(x,y)=>[362+x*scale,274-(y-I.tee)*scale];
    c.fillStyle='#d9e7e7';c.fillRect(362-2.375*scale,0,4.75*scale,560);
    for(const [r,col] of rings)ellipse(362,274,r*scale,r*scale,col);
    line([362,0],[362,560],'#768e98');line([178,274],[547,274],'#768e98');
    const overview=(x,y)=>[715+x*19,505-y*9.8];
    c.fillStyle='#c4d9dc';c.fillRect(715-2.375*19,505-I.length*9.8,4.75*19,I.length*9.8);
    ellipse(...overview(0,I.tee),1.829*19,1.829*9.8,'#6291af');
    const frame=samples[Math.min(samples.length-1,Math.floor(replayTime*samples.length/3))];
    const count=frame?.points??trace.length;
    for(let i=1;i<count;i++){
      const a=trace[i-1],b=trace[i],col=b.swept?'#ca871d':'#ae413f';
      for(const map of [point,overview])line(map(a.x,a.y),map(b.x,b.y),col,map===point?3:2)
    }
    (frame?.stones??stones).forEach((s,i)=>{if(!s.out){ellipse(...point(s.x,s.y),11,11,i?'#966e30':'#933e3b');ellipse(...point(s.x,s.y),8,8,i?'#efbc56':'#e87565')}});
    label(22,34,'SHOT REPLAY');label(643,34,'FULL SHEET');label(650,540,'45.72 M');
  }
  function frame(now){
    const uiDt=last?Math.min((now-last)/1000,.05):0;last=now;
    const paused=document.hidden||document.querySelector('arcade-nav').shadowRoot?.querySelector('button')?.getAttribute('aria-expanded')==='true';
    if(phase==='flight'&&!paused){
      let rem=uiDt*2.25;while(rem>.000001){const dt=Math.min(1/120,rem);I.step(stones,dt,+$('turn').value,sweeping);rem-=dt}
      const s=stones[0],prev=trace.at(-1);if(!s.out&&(!prev||Math.hypot(s.x-prev.x,s.y-prev.y)>.035))trace.push({x:s.x,y:s.y,swept:sweeping});
      sampleClock+=uiDt;
      const stopped=stones.every(st=>!st.vx&&!st.vy);
      if(sampleClock>=.045||!samples.length||stopped){
        sampleClock=0;samples.push({points:trace.length,stones:stones.map(({x,y,out})=>({x,y,out}))});
      }
      if(stopped)finish()
    }
    if(phase==='result'){replayTime+=uiDt;overhead()}else view(now/1000);
    $('readout').textContent=phase==='result'?'Overhead replay':phase==='flight'?Math.max(0,I.tee-stones[0].y).toFixed(1)+' m to tee':'45.72 m sheet';
    requestAnimationFrame(frame)
  }
  prepare();requestAnimationFrame(frame);
})();
