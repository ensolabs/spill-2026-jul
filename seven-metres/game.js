'use strict';
(()=>{
  const H=Handball,$=id=>document.getElementById(id),canvas=$('arena'),draw=handballArena(canvas);
  const dt=.01,windup=.27,keys=new Set(),cameras=['Shooter','Side','Arena'];
  let mode,cam,t,aim,keeper,plan,shotAt,fakeAt,commit,contact,outcome,frames,film,pausedFrom;
  let dragging=null,carry=0,last=0,raf=0;

  function info(title,copy){$('title').textContent=title;$('call').textContent=copy}
  function show(){
    const aiming=mode==='aim',review=['replay','scrub','reviewed'].includes(mode);
    $('mode').textContent=({aim:'Final throw',shot:'Ball in play',result:'Final throw result',paused:'Time out',replay:'Replay · ¼ speed',scrub:'Replay · paused',reviewed:'Replay · end'})[mode];
    $('action').textContent=aiming?'Shoot · Space':mode==='paused'?'Resume':mode==='shot'?'Throw in motion':'Take another throw';
    $('action').disabled=mode==='shot';
    for(const id of ['left','right','height','feint'])$(id).disabled=!aiming;
    $('height').textContent=aim.y>=1?'Aim low':'Aim high';
    $('review').hidden=!(mode==='result'||review);
    $('review').textContent=mode==='replay'?'Pause replay':mode==='scrub'?'Resume replay':'Watch replay · ¼ speed';
    $('film').hidden=!review;$('cam').textContent=cam+' view ↻';
  }
  function reset(){
    mode='aim';cam='Shooter';t=0;film=0;shotAt=fakeAt=-Infinity;commit=null;contact=null;outcome='';frames=[];keys.clear();dragging=null;
    aim={x:0,y:1.35};plan={wait:0,count:0,beat:.46,first:1,side:1,high:true};
    keeper={x:(Math.random()-.5)*.4,low:.3,dir:1,block:-Infinity,power:1,feet:[-.21,.21],lift:[0,0]};
    info('Take the shot.','Pick a spot in the goal. Show the keeper a feint, then switch lanes and shoot.');show();paint();run();
  }
  function adjust(x,y){
    if(mode!=='aim')return;
    aim={x:H.clamp(x,-1.72,1.72),y:H.clamp(y,.10,2.17)};show();
  }
  function feint(){
    if(mode!=='aim'||t-fakeAt<.55)return;
    fakeAt=t;plan={...plan,count:1,first:Math.sign(aim.x)||1,side:Math.sign(aim.x)||1,high:aim.y>=1};
    commit={x:H.clamp(aim.x*.84,-1.05,1.05),low:aim.y<1?1:0,until:t+1.08};
    keeper.dir=Math.sign(aim.x)||1;keeper.block=t;
    info('Keeper commits.','Change your aim and throw while her weight is on that foot.');
  }
  function shoot(){
    if(mode!=='aim')return;
    mode='shot';shotAt=t;keys.clear();dragging=null;
    plan={...plan,count:0,side:Math.sign(aim.x)||1,high:aim.y>=1,x:aim.x,y:aim.y};
    info('Shot away.','Watch the ball through to the line.');show();
  }
  function model(){
    const shooting=Number.isFinite(shotAt);
    // Map the input-triggered wind-up onto the articulated throw animation.
    const poseTime=shooting?H.release(plan)-windup+t-shotAt:Math.min(t-fakeAt,.46);
    const clock=shooting||t-fakeAt<.46?poseTime:-1;
    const shooter=H.shooter(clock,plan),body=H.keeper(keeper,t);
    let ball=shooting?H.flight(clock,plan):shooter.ball;
    const age=t-shotAt-windup;
    if(contact){const u=t-contact.time;ball=H.add(contact.ball,[plan.side*u*2,u*1.2-u*u*4,u*4.8])}
    else if(age>.5){const u=H.clamp((age-.5)/.25);ball=H.add(ball,[0,-ball[1]*.22*u,-.64*u])}
    return {shooter,keeper:body,ball,aim:shooting?null:{...aim},marker:'',time:t,goal:outcome==='goal'&&age>=.5};
  }
  function update(){
    if(mode==='replay'){
      film=Math.min(frames.length-1,film+.25);
      if(film>=frames.length-1){mode='reviewed';show()}
      return;
    }
    if(mode!=='aim'&&mode!=='shot')return;
    t+=dt;
    const dx=Number((keys.has('ArrowLeft')||keys.has('KeyA')))-Number((keys.has('ArrowRight')||keys.has('KeyD'))),dy=Number((keys.has('ArrowUp')||keys.has('KeyW')))-Number((keys.has('ArrowDown')||keys.has('KeyS')));
    if(dx||dy)adjust(aim.x+dx*2.8*dt,aim.y+dy*2.2*dt);
    const age=t-shotAt,locked=commit&&t<commit.until;
    if(mode==='shot'&&!locked&&keeper.block<shotAt&&age>.34){keeper.dir=Math.sign(plan.x-keeper.x)||1;keeper.block=t}
    const reaching=mode==='shot'&&age>.34;
    const desired=locked?commit.x:H.clamp(aim.x*(reaching?.94:.57),-1.10,1.10);
    const rate=locked?3.7:reaching?3:1.4;
    const move=H.clamp(desired-keeper.x,-dt*rate,dt*rate);
    keeper.x+=move;
    keeper.low+=H.clamp((locked?commit.low:aim.y<1?.95:.05)-keeper.low,-dt*3,dt*3);
    for(let i=0;i<2;i++){keeper.feet[i]=keeper.x+(i?.22:-.22);keeper.lift[i]=Math.abs(move)*2*Math.max(0,Math.sin(t*19+i*Math.PI))}
    const frame=model();
    if(mode==='shot'&&!contact&&age>=windup&&age<windup+.50&&H.touches(frame.ball,frame.keeper))contact={time:t,ball:frame.ball};
    if(mode==='shot'&&!outcome&&age>=windup+.50){
      outcome=contact?'save':Math.abs(plan.x)>1.40||plan.y>1.90?'miss':'goal';frame.goal=outcome==='goal';
    }
    // Keep the final three seconds of preparation plus the complete throw for replay.
    frames.push(frame);if(mode==='aim'&&frames.length>300)frames.shift();
    if(mode==='shot'&&age>windup+.86){
      mode='result';
      const feedback={goal:['Goal! Extra time.','You beat the keeper. Your equaliser makes it 27 – 27.'],save:['Saved.','The keeper reached your throw. Sell one corner, then finish in the other.'],miss:['Outside the frame.','Bring the sight inside the posts and below the bar.']};
      info(...feedback[outcome]);show();
    }
  }
  function paint(){
    const review=['scrub','replay','reviewed'].includes(mode)||mode==='paused'&&pausedFrom==='replay';
    const frame=review?frames[Math.floor(film)]:frames.at(-1)||model();
    draw({...frame,cam,aim:mode==='aim'?aim:frame.aim});
    $('score').textContent=frame.goal?'27 – 27':'26 – 27';
    $('balance').textContent=mode==='aim'?(t-fakeAt<1.08?'Keeper committed':'At the seven-metre line'):'';
    if(review){$('scrub').value=Math.round(1000*film/Math.max(1,frames.length-1));$('stamp').textContent=(frame.time-frames[0].time).toFixed(2)+' s'}
  }
  function loop(now){
    raf=0;carry+=Math.min(.08,(now-last)/1000);last=now;
    while(carry>=dt){update();carry-=dt}
    paint();if(['aim','shot','replay'].includes(mode))raf=requestAnimationFrame(loop);
  }
  function run(){if(!raf){last=performance.now();carry=0;raf=requestAnimationFrame(loop)}}
  $('action').onclick=()=>{if(mode==='paused'){mode=pausedFrom;show();run()}else if(mode==='aim')shoot();else if(mode!=='shot')reset()};
  $('feint').onclick=feint;$('left').onclick=()=>adjust(aim.x+.32,aim.y);$('right').onclick=()=>adjust(aim.x-.32,aim.y);
  $('height').onclick=()=>adjust(aim.x,aim.y>=1?.42:1.6);
  $('cam').onclick=()=>{cam=cameras[(cameras.indexOf(cam)+1)%cameras.length];show();paint()};
  $('review').onclick=()=>{
    if(mode==='replay')mode='scrub';
    else{if(mode!=='scrub'){film=0;cam='Side'}mode='replay'}
    show();paint();run()
  };
  $('scrub').oninput=()=>{mode='scrub';film=(frames.length-1)*Number($('scrub').value)/1000;show();paint()};
  function point(e){const p=draw.goalPoint(e.clientX,e.clientY);if(p)adjust(p[0],p[1])}
  canvas.onpointerdown=e=>{if(mode!=='aim')return;dragging=e.pointerId;canvas.setPointerCapture(dragging);point(e)};
  canvas.onpointermove=e=>{if(e.pointerId===dragging)point(e)};
  canvas.onlostpointercapture=()=>dragging=null;
  document.addEventListener('keydown',e=>{
    if(mode!=='aim'||e.ctrlKey||e.altKey||e.metaKey||e.composedPath().some(n=>n.tagName==='ARCADE-NAV'))return;
    if(e.code.startsWith('Arrow')||['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();keys.add(e.code)}
    if(e.code==='KeyF'||e.code==='Space'){e.preventDefault();if(!e.repeat){if(e.code==='KeyF')feint();else shoot()}}
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  function pause(){if(['aim','shot','replay'].includes(mode)){pausedFrom=mode;mode='paused';keys.clear();dragging=null;show()}}
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
  document.addEventListener('click',e=>{const nav=document.querySelector('arcade-nav');if(e.composedPath().includes(nav)&&nav.shadowRoot?.querySelector('button')?.getAttribute('aria-expanded')==='true')pause()});
  reset();
})();
