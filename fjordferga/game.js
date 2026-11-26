'use strict';
(()=>{
  const $=id=>document.getElementById(id),C=Channel,canvas=$('chart'),draw=fjordChart(canvas);
  const keys=new Set(),names=['FULL ASTERN','SLOW ASTERN','STOP','SLOW AHEAD','FULL AHEAD'],reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const bindings={KeyA:'port',ArrowLeft:'port',KeyD:'starboard',ArrowRight:'starboard',KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',Space:'stop',Escape:'pause'};
  let phase='ready',s=C.vessel(0),elapsed=0,clock=0,last=0,wake=[],wakeTimer=0,deliveredCars=0,deliveredPeople=0,pulse=0,pulseSide=0,approach=null;
  function setText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value}
  function controls(){
    $('action').textContent=({ready:'Load & cast off',loading:'Boarding…',sailing:'Pause crossing',paused:'Resume crossing',unloading:'Ramp down…',alongside:'Board next crossing',done:'Sail another shift'})[phase];
    $('action').disabled=phase==='loading'||phase==='unloading';
    document.querySelectorAll('#driving button').forEach(b=>b.disabled=phase!=='sailing');
    document.querySelectorAll('[data-power]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.power===(phase==='sailing'||phase==='paused'?s.engine:0))));
  }
  function display(){
    const from=C.departure(s.leg),to=C.arrival(s.leg),cargo=C.cargo[s.leg],spd=C.speed(s);
    setText('crossing','Crossing '+(s.leg+1)+' / 3');
    setText('route',from.name+' → '+to.name);
    setText('manifest',phase==='done'?deliveredCars+' cars · '+deliveredPeople+' passengers delivered':cargo.cars+' cars · '+cargo.people+' passengers'+(phase==='ready'?' waiting':' on this crossing'));
    setText('speed',spd.toFixed(1));setText('setting',phase==='sailing'||phase==='paused'?names[s.engine+2]:'STOP');
    const boat=s.boat;
    let radio='';
    if(boat.state==='running'||(boat.state==='waiting'&&boat.departureIn!==null))
      radio=['Northbound launch crossing behind you at the Vestvik buoys.','Southbound launch approaching the Vestvik buoys. Give her room.','Launch northbound, then east along the red marks for Austnes.'][s.leg];
    if(boat.state==='docked')radio='Launch alongside at Austnes. Ferry ramp clear.';
    setText('radio',radio?'VHF · '+radio:'');
    setText('passage',phase==='done'?'Shift complete':'Gates '+s.gate+' / 3');
    let msg='';
    if(phase==='ready')msg='The ramp is down at '+from.name+'. Board the first load and follow the lit gate.';
    if(phase==='loading')msg='Cars are crossing the ramp. Foot passengers are boarding.';
    if(phase==='paused')msg='Crossing paused. Your heading and momentum are held.';
    if(phase==='unloading')msg='Lines fast. Cars and passengers are going ashore at '+to.name+'.';
    if(phase==='alongside'){
      const nextAstern=(s.leg===0)===(Math.cos(s.h)>0);
      msg='Load delivered. Next crossing leaves '+(nextAstern?'stern-first.':'bow-first.');
    }
    if(phase==='done')msg='Last ramp down. Three crossings complete. Everyone is ashore.';
    if(phase==='sailing'){
      if(s.cool>0)msg=s.notice;
      else if(s.gate===3){
        const dist=(Math.hypot(s.x-to.x,s.y-to.y)/23).toFixed(1),coast=(spd*6.2/23).toFixed(1);
        msg='Berth '+dist+' hull lengths away. At this speed you coast about '+coast+' lengths in STOP.';
      }else msg='Through gate '+(s.gate+1)+' of 3. Tap beyond the two lit buoys to set your heading.';
    }
    setText('message',msg);
    draw(s,phase,reduced.matches?0:clock,C.clamp(phase==='unloading'?(elapsed-.65)/1.75:elapsed/2.4,0,1),wake);
  }
  function load(leg){
    s=C.vessel(leg,leg?s.h:0);wake=[];wakeTimer=0;keys.clear();pulse=0;phase='loading';elapsed=0;controls();display();
  }
  function pause(){
    if(phase!=='sailing')return;keys.clear();pulse=0;phase='paused';controls();display();
  }
  $('action').onclick=()=>{
    if(phase==='ready')load(0);
    else if(phase==='done'){deliveredCars=deliveredPeople=0;load(0)}
    else if(phase==='alongside')load(s.leg+1);
    else if(phase==='sailing')pause();
    else if(phase==='paused'){phase='sailing';controls();display()}
  };
  function power(n){if(phase==='sailing'){s.engine=C.clamp(n,-2,2);controls();display()}}
  document.querySelectorAll('[data-power]').forEach(b=>b.onclick=()=>power(Number(b.dataset.power)));
  for(const [id,sign] of [['port',-1],['starboard',1]]){
    const b=$(id);
    b.onpointerdown=e=>{if(phase!=='sailing')return;e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(id);pulse=.25;pulseSide=sign};
    b.onlostpointercapture=b.onpointerup=()=>keys.delete(id);
    b.onclick=e=>{if(e.detail===0){pulse=.40;pulseSide=sign}};
  }
  canvas.onpointerdown=e=>{
    if(phase!=='sailing')return;const rect=canvas.getBoundingClientRect();
    s.aim={x:C.clamp((e.clientX-rect.left-canvas.clientLeft)*384/canvas.clientWidth,0,384),y:C.clamp((e.clientY-rect.top-canvas.clientTop)*212/canvas.clientHeight,0,212)};
    pulse=0;display();
  };
  document.addEventListener('keydown',e=>{
    if(e.composedPath().some(n=>n?.tagName==='ARCADE-NAV')||e.ctrlKey||e.altKey||e.metaKey)return;
    if(phase!=='sailing')return;
    const command=bindings[e.code];
    if(!command)return;
    e.preventDefault();
    if(command==='port'||command==='starboard')keys.add(e.code);
    if(e.repeat)return;
    if(command==='up')power(s.engine+1);if(command==='down')power(s.engine-1);if(command==='stop')power(0);if(command==='pause')pause();
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
  document.addEventListener('click',e=>{const nav=document.querySelector('arcade-nav');if(e.composedPath().includes(nav)&&nav.shadowRoot?.querySelector('button')?.getAttribute('aria-expanded')==='true')pause()});
  function advance(dt){
    if(s.moored&&phase!=='paused')C.moveBoat(s,dt);
    if(phase==='loading'||phase==='unloading'){
      elapsed+=dt;
      if(phase==='unloading'&&approach){
        const d=C.arrival(s.leg),u=C.clamp(elapsed/.65,0,1),f=u*u*(3-2*u);
        s.x=approach.x+(d.x-approach.x)*f;s.y=approach.y+(d.y-approach.y)*f;
        s.h=approach.h+approach.turn*f;
      }
      if(elapsed>=2.4){
        if(phase==='loading'){phase='sailing';s.notice=s.engine<0?'Ramp up. Slow astern. The helm answers in reverse.':'Ramp up. Slow ahead.';s.cool=3}
        else{deliveredCars+=C.cargo[s.leg].cars;deliveredPeople+=C.cargo[s.leg].people;phase=s.leg===2?'done':'alongside'}
        controls();
      }return;
    }
    if(phase!=='sailing')return;
    const port=keys.has('port')||keys.has('KeyA')||keys.has('ArrowLeft');
    const starboard=keys.has('starboard')||keys.has('KeyD')||keys.has('ArrowRight');
    pulse=Math.max(0,pulse-dt);const rudder=Number(starboard)-Number(port)||(pulse>0?pulseSide:0);
    const previousPower=s.engine;
    C.step(s,dt,rudder);
    if(s.engine!==previousPower)controls();
    wake.forEach(w=>w.age+=dt);wake=wake.filter(w=>w.age<1.9);
    wakeTimer+=dt;if(wakeTimer>.16&&C.speed(s)>2){wakeTimer=0;const stern=s.vx*Math.cos(s.h)+s.vy*Math.sin(s.h)>=0?-1:1;
      wake.push({x:s.x+stern*10*Math.cos(s.h),y:s.y+stern*10*Math.sin(s.h),h:s.h,age:0})}
    if(s.moored){
      const parallel=Math.cos(s.h)>=0?0:Math.sign(s.h)*Math.PI;
      approach={x:s.x,y:s.y,h:s.h,turn:parallel-s.h};
      s.aim=null;phase='unloading';elapsed=0;keys.clear();wake=[];controls()
    }
  }
  let lastPaint=-Infinity;
  function tick(now){
    let dt=last&&!document.hidden?Math.min(.12,(now-last)/1000):0;last=now;
    if(phase!=='paused')clock+=dt;
    while(dt>.000001){const slice=Math.min(dt,1/50);advance(slice);dt-=slice}
    if(!document.hidden&&now-lastPaint>=45){lastPaint=now;display()}requestAnimationFrame(tick);
  }
  controls();display();requestAnimationFrame(tick);
})();
