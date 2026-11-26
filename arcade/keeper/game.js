'use strict';
(() => {
  const $=id=>document.getElementById(id), canvas=$('arena'), render=keeperScene(canvas,true);
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const keys=new Set(), guide=$('guide');
  const house=(target,a,b)=>({target,bend:4,routes:[[Match.start[0],[a,7]],[Match.start[1],[b,7]]]});
  const deliveries=[house(3,-4,4),house(-3,-3,3),house(-3,-3,5)];
  function valid(p){
    return p&&Number.isFinite(p.target)&&Math.abs(p.target)<=8&&Number.isFinite(p.bend)&&Math.abs(p.bend)<=6&&
      Array.isArray(p.routes)&&p.routes.length===2&&p.routes.every(route=>Array.isArray(route)&&route.length>0&&route.length<=4096&&
        route.every(pt=>Array.isArray(pt)&&pt.length===2&&pt.every(Number.isFinite)&&Math.abs(pt[0])<=15&&pt[1]>=1&&pt[1]<=24));
  }
  let imported=false;
  const candidates=[new URLSearchParams(location.hash.slice(1)).get('routine')];
  try{candidates.push(localStorage.getItem('enso.dec09.routine.v1'))}catch{}
  for(const raw of candidates){
    try{const p=JSON.parse(raw);if(valid(p)&&Match.analyze(p).kind==='GOAL'){deliveries.unshift(p);imported=true;break}}catch{}
  }
  let index=0,plan,result,end,goalTime,target,poses;
  let state='ready',t=0,x=0,y=1.40,aimX=0,aimY=y,contact=null,history=[],reviewT=0,passedHeader=false;
  let raf=0,prev=0,pointer=null,beforePause='';
  const film=()=>['film','scrub','filmEnd'].includes(state);
  const steering=()=>state==='play'||state==='set';
  const label=(title,body)=>{$('headline').textContent=title;$('call').textContent=body};
  function load(){
    plan=deliveries[index];result=Match.analyze(plan);
    // The header crosses the glove plane before it crosses the goal line.
    goalTime=Match.meet+(result.end-Match.meet)*(Match.dropZ-.46)/(Match.dropZ+.35);
    const [bx,by]=Match.sample(plan,result,goalTime).ball;
    target=[-bx,by+.11,.46];end=result.end+.28;poses=[];
    $('source').textContent=imported&&index===0?'Your scoring routine · 9 December':'ensō Stadium · Delivery '+(index+1-(imported?1:0));
  }
  function ui(){
    const live=steering(),review=film();
    $('start').hidden=state==='play';
    $('start').textContent=state==='set'?'Release header':state==='break'?'Resume play':state==='ready'?'Face the free kick':'Retry delivery';
    $('dives').hidden=!live;$('next').hidden=$('review').hidden=!(state==='end'||review);
    $('review').textContent=state==='film'?'Pause replay':state==='scrub'?'Resume replay':'Slow-motion replay';
    $('film').hidden=!review;guide.disabled=live||state==='break';
    $('mode').textContent={ready:'Keeper cam',play:'Live',set:'Set your gloves',break:'Paused',end:'Full time',film:'Replay · ¼ speed',scrub:'Replay · paused',filmEnd:'Replay · end'}[state];
  }
  function aim(a,b){aimX=clamp(a,-3.65,3.65);aimY=clamp(b,.15,2.42)}
  function move(dt){
    const h=Number((keys.has('ArrowRight')||keys.has('KeyD')))-Number((keys.has('ArrowLeft')||keys.has('KeyA'))),v=Number((keys.has('ArrowUp')||keys.has('KeyW')))-Number((keys.has('ArrowDown')||keys.has('KeyS')));
    if(h||v)aim(x+h*8*dt,y+v*4*dt);
    x+=clamp(aimX-x,-12*dt,12*dt);y+=clamp(aimY-y,-7*dt,7*dt);
  }
  function hands(a,b){return [[a-.185,b,.46],[a+.185,b,.46]]}
  function record(){
    const last=history.at(-1);
    if(last?.t===t){last.x=x;last.y=y}else history.push({t,x,y});
  }
  function sample(time){
    let l=0,r=history.length-1;
    while(l<r){const m=Math.ceil((l+r)/2);if(history[m].t<=time)l=m;else r=m-1}
    const a=history[l],b=history[l+1];if(!b)return a;
    const k=clamp((time-a.t)/(b.t-a.t),0,1);return {x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k};
  }
  function view(){
    const review=film(),clock=review?reviewT:t,pos=review?sample(clock):{x,y};
    const i=Math.round(Math.min(result.end,clock)*120);
    const scene=poses[i]??=Match.sample(plan,result,Math.min(i/120,result.end));
    let ball=[-scene.ball[0],scene.ball[1]+.11,scene.ball[2]];
    if(contact&&clock>=goalTime){
      const u=clock-goalTime;ball=[target[0]+Math.sign(target[0])*9*u,target[1]+4*u, .46+8*u];
    }
    const trail=[];
    if(clock>Match.meet&&clock<goalTime)for(let j=Math.max(Math.ceil(Match.meet*120),i-12);j<i;j+=3){
      const s=poses[j]??=Match.sample(plan,result,j/120);trail.push([-s.ball[0],s.ball[1]+.11,s.ball[2]]);
    }
    render({state:scene,t:clock,trail,ball,crossX:-plan.target,striker:result.shot.striker,gloves:hands(pos.x,pos.y),
      target:guide.checked&&(state==='set'||clock>=Match.meet&&clock<goalTime)?target:null,
      marker:state==='set'?'AIM AT THE RING · SPACE OR TAP TO PLAY':review&&contact&&Math.abs(clock-goalTime)<.08?'GLOVE CONTACT':''});
    $('score').textContent=clock>=result.end&&!contact?'1 – 2':'1 – 1';$('clock').textContent='89:0'+Math.floor(clock);
    if(review){$('scrub').value=Math.round(clock/end*1000);$('stamp').textContent=clock.toFixed(2)+' s'}
  }
  function finish(){
    state='end';keys.clear();
    const p=sample(goalTime),dx=target[0]-p.x,dy=target[1]-p.y;
    const correction=Math.abs(dx)>.5?'Cover more ground to your '+(dx<0?'left.':'right.'):dy>0?'Lift your gloves higher.':'Bring your gloves lower.';
    label(contact?'Saved!':'Goal.',contact?'You turned the header away. Try another delivery or watch the contact in replay.':correction+' Retry this delivery to practise the same header.');ui();
  }
  function update(dt){
    if(state==='film'){reviewT=Math.min(end,reviewT+dt*.25);if(reviewT>=end){state='filmEnd';ui()}return}
    if(!steering())return;
    move(dt);
    if(state==='set'){record();return}
    const old=t;
    const speed=t>=Match.meet&&guide.checked?.48:1;
    t=Math.min(end,t+dt*speed);
    if(!passedHeader&&t>=Match.meet){
      passedHeader=true;
      if(guide.checked){t=Match.meet;state='set';label('Cover the '+(target[0]<0?'left':'right')+' post.','Put your gloves on the gold ring. Tap the pitch or choose Release header when ready.');ui()}
      else label('Header!','Follow the ball all the way to your gloves.');
    }
    record();
    if(old<goalTime&&t>=goalTime){
      const p=sample(goalTime);
      contact=hands(p.x,p.y).some(g=>Math.hypot(g[0]-target[0],g[1]-target[1])<=.40);
    }
    if(t>=end)finish();
  }
  function tick(now){
    raf=0;let dt=Math.min(.10,(now-prev)/1000);prev=now;
    while(dt>.000001){const step=Math.min(.01,dt);update(step);dt-=step}
    view();if(steering()||state==='film')raf=requestAnimationFrame(tick);
  }
  function run(){if(!raf){prev=performance.now();raf=requestAnimationFrame(tick)}}
  function start(){
    state='play';t=0;passedHeader=false;contact=null;x=aimX=0;y=aimY=1.40;history=[];keys.clear();record();
    label('Watch the cross.',guide.checked?'At the header, play pauses for you to aim.':'Move the gloves with the ball. Cover either post with the buttons.');ui();view();run();
  }
  function resumeHeader(){if(state!=='set')return;state='play';label('Play on.','Keep your gloves in the path of the header.');ui();run()}
  $('start').onclick=()=>{
    if(state==='set')resumeHeader();
    else if(state==='break'){state=beforePause;ui();view();run()}
    else start();
  };
  $('next').onclick=()=>{index=(index+1)%deliveries.length;load();start()};
  for(const b of document.querySelectorAll('[data-side]'))b.onclick=()=>{if(steering())aim(Number(b.dataset.side)*2.88,1.43)};
  canvas.onpointerdown=e=>{if(!steering()||pointer!==null)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);aim(...render.aimPoint(e));resumeHeader()};
  canvas.onpointermove=e=>{if(steering()&&(pointer===e.pointerId||e.pointerType==='mouse'&&pointer===null))aim(...render.aimPoint(e))};
  canvas.onlostpointercapture=()=>{pointer=null};
  const directions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down'};
  document.addEventListener('keydown',e=>{
    if(e.composedPath().some(n=>n?.tagName==='ARCADE-NAV')||e.altKey||e.ctrlKey||e.metaKey||e.target===$('scrub'))return;
    if(steering()&&directions[e.code]){e.preventDefault();keys.add(e.code)}
    if(e.code==='Space'&&(state==='set'||state==='ready')&&(!e.target.closest('button,input')||e.target===$('start'))){
      e.preventDefault();if(!e.repeat)$('start').click();
    }
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  $('review').onclick=()=>{
    if(state==='film')state='scrub';
    else{if(state!=='scrub')reviewT=0;state='film';run()}
    label('Replay room',contact?'Watch where the ball meets your gloves.':'Compare your position with the ball as it crosses the line.');ui();view();
  };
  $('scrub').oninput=()=>{state='scrub';reviewT=end*Number($('scrub').value)/1000;ui();view()};
  guide.onchange=()=>{if(state==='ready')label('On the line',guide.checked?'The cross will pause for you to aim.':'The header plays at match speed. Point or drag to cover the shot.')};
  function pause(){keys.clear();if(steering()){beforePause=state;state='break';ui()}else if(state==='film')$('review').click()}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});window.addEventListener('blur',pause);
  document.addEventListener('click',e=>{const nav=document.querySelector('arcade-nav');if(e.composedPath().includes(nav)&&nav.shadowRoot?.querySelector('button')?.getAttribute('aria-expanded')==='true')pause()});
  load();ui();view();
})();
