'use strict';
(()=>{
  const $=id=>document.getElementById(id),canvas=$('scene'),c=canvas.getContext('2d'),W=960,H=460;
  const places=[
    {name:'Birch Inlet',gap:615,width:85,sky:['#608499','#f1b29f','#ffe0af'],bias:1},
    {name:'Copper Sound',gap:295,width:70,sky:['#665d7e','#e79886','#ffd29d'],bias:0},
    {name:'The Blue Pass',gap:710,width:56,sky:['#444f77','#a890af','#e6bed0'],bias:-1}
  ];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const noise=n=>{const v=Math.sin(n*93.14)*43758;return v-Math.floor(v)};
  let index=0,elapsed=0,last=0,phase='ready',total=0,drag=null;
  const keys=new Set();
  const position=()=>places[index].gap-235+elapsed*33;
  function ridge(x){
    const p=places[index],d=(x-p.gap)/p.width;
    return 172+19*Math.sin(x*.015+index)+14*Math.sin(x*.042)+6*Math.cos(x*.097)+101*Math.exp(-d*d);
  }
  function sunlight(){const x=position(),y=222+10*Math.sin(elapsed*.29);return {x,y,clear:clamp((ridge(x)-y+14)/28,0,1)}}
  function poly(points,color){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill()}
  function render(finder=true){
    const p=places[index],pan=Number($('pan').value),sun=sunlight(),sx=sun.x-pan;
    const sky=c.createLinearGradient(0,0,0,310);
    p.sky.forEach((col,i)=>sky.addColorStop(i/2,col));c.fillStyle=sky;c.fillRect(0,0,W,H);
    const glow=c.createRadialGradient(sx,sun.y,5,sx,sun.y,120);
    glow.addColorStop(0,'#fff1baef');glow.addColorStop(1,'#ffe4ae00');c.fillStyle=glow;c.fillRect(0,0,W,320);
    c.fillStyle='#fff4c5';c.beginPath();c.arc(sx,sun.y,14,0,Math.PI*2);c.fill();
    const top=[];for(let x=-5;x<=W+5;x+=5)top.push([x,ridge(x+pan)]);
    poly([...top,[W+5,335],[-5,335]],'#56657a');
    for(let i=1;i<top.length;i++){
      const [x,y]=top[i],a=top[i-1],n=noise(Math.floor((x+pan)/15));
      poly([a,[x,y],[x+7,y+5+n*14],[a[0]+5,a[1]+9]],y<a[1]?'#e8d2c4':'#b9bac0')
    }
    const water=c.createLinearGradient(0,300,0,H);water.addColorStop(0,'#a5a6ad');water.addColorStop(1,'#374f60');c.fillStyle=water;c.fillRect(0,308,W,152);
    for(let i=0;i<490;i++){
      const x=(noise(i)*1500-pan*.6+1500)%1500-250,y=309+noise(i+500)*151;
      c.fillStyle=Math.abs(x-sx)<(y-300)*.53+11&&sun.clear>.1?'#ffdda184':'#d0c5bf52';c.fillRect(x,y,2+noise(i+30)*23,1.3)
    }
    for(let side=0;side<2;side++){
      c.save();if(side){c.translate(W,0);c.scale(-1,1)}
      const edge=(side?280:245)+(side?pan:-pan)*.47;
      poly([[-5,290],[edge*.34,300],[edge*.66,326],[edge,337],[-5,350]],'#465862');
      for(let i=0;i<60;i++){const x=noise(i+side*80)*edge,y=291+46*x/edge,h=4+noise(i+9)*18;
        poly([[x,y-h],[x-h*.24,y+2],[x+h*.24,y+2]],'#374d54')}
      c.restore()
    }
    const ev=+$('ev').value;if(ev){c.fillStyle=ev>0?'#ffefcf32':'#171b3238';c.fillRect(0,0,W,H)}
    if(!finder)return;
    c.strokeStyle='#fff5d997';c.lineWidth=2;c.strokeRect(462,212,36,36);
    c.fillStyle='#172521bd';c.fillRect(15,15,246,31);c.fillRect(W-205,15,190,31);
    c.fillStyle='#fff2cb';c.font='bold 16px monospace';
    const meter=places[index].bias+ev;
    c.fillText('LIGHT METER   '+(meter>0?'+':'')+meter+' EV',26,36);
    c.fillText('DAYLIGHT   '+Math.ceil(15-elapsed)+' s',W-192,36);
  }
  function setup(){
    phase='ready';elapsed=0;keys.clear();$('pan').value=0;$('ev').value=0;
    $('pan').disabled=$('ev').disabled=false;$('location').textContent=places[index].name;
    $('counter').textContent='Frame '+(index+1)+' / 3';$('message').textContent='Set up your camera, then start the 15-second afternoon.';
    $('shutter').textContent='Start afternoon';render()
  }
  function expose(){
    const sun=sunlight(),p=places[index],centering=clamp(1-Math.abs(p.gap-480-Number($('pan').value))/195,0,1);
    const alignment=clamp(1-Math.abs(sun.x-p.gap)/p.width,0,1);
    const score=Math.round(100*sun.clear*(.50*alignment+.32*centering+.18*(1-Math.abs(p.bias+Number($('ev').value))/2)));
    total+=score;phase='print';render(false);
    const print=document.createElement('figure'),img=new Image(),caption=document.createElement('figcaption');
    img.src=canvas.toDataURL('image/jpeg',.87);img.alt=p.name+' solstice photograph';caption.textContent=p.name+' · '+score+'/100';
    print.append(img,caption);$('prints').append(print);$('pan').disabled=$('ev').disabled=true;
    $('message').textContent=(sun.clear<.1?'The ridge hid the sun.':score>=85?'You caught the sun in the saddle.':centering<.65?'The gap sat off-centre.':'Try releasing closer to the middle of the gap.')+' '+score+'/100.'+(index===2?' Contact sheet complete · '+total+'/300.':'');
    $('shutter').textContent=index===2?'Load fresh film':'Next location'
  }
  function action(){
    if(phase==='ready'){phase='live';last=performance.now();$('shutter').textContent='Release shutter';$('message').textContent='Watch the glow travel along the ridge.'}
    else if(phase==='live')expose();
    else if(phase==='print'){index=(index+1)%3;if(index===0){total=0;$('prints').replaceChildren()}setup()}
    else if(phase==='paused'){phase='live';last=performance.now();$('shutter').textContent='Release shutter';$('message').textContent='Watch the ridge.'}
  }
  $('shutter').onclick=action;
  for(const id of ['pan','ev'])$(id).oninput=()=>render();
  canvas.onpointerdown=e=>{if(phase==='print')return;canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,pan:+$('pan').value}};
  canvas.onpointermove=e=>{if(drag&&phase!=='print'){$('pan').value=drag.pan+(drag.x-e.clientX)*W/canvas.clientWidth;render()}};
  canvas.onlostpointercapture=()=>drag=null;
  document.addEventListener('keydown',e=>{
    if(e.composedPath().some(n=>n.tagName==='ARCADE-NAV')||e.target.tagName==='SELECT'||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat)action()}
    if((e.target.tagName!=='INPUT'&&['ArrowLeft','ArrowRight'].includes(e.code)||['KeyA','KeyD'].includes(e.code))){e.preventDefault();keys.add(e.code)}
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  function pause(){keys.clear();if(phase==='live'){phase='paused';$('shutter').textContent='Resume afternoon';$('message').textContent='Camera on standby.'}}
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
  document.addEventListener('click',e=>{const nav=document.querySelector('arcade-nav');if(e.composedPath().includes(nav)&&nav.shadowRoot?.querySelector('button')?.getAttribute('aria-expanded')==='true')pause()});
  function tick(now){
    const dt=clamp((now-last)/1000,0,.1);last=now;
    if(phase==='live'||phase==='ready'){
      const pan=Number((keys.has('ArrowRight')||keys.has('KeyD')))-Number((keys.has('ArrowLeft')||keys.has('KeyA')));
      if(pan)$('pan').value=Number($('pan').value)+pan*dt*245;
      if(phase==='live'){elapsed=Math.min(15,elapsed+dt);if(elapsed>=15)expose();else render()}else if(pan)render()
    }
    requestAnimationFrame(tick)
  }
  setup();requestAnimationFrame(tick);
})();
