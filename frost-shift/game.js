'use strict';
(()=>{
  const $=id=>document.getElementById(id),canvas=$('scene'),view=fjordView(canvas),D=District;
  const keys=new Set(),touch=new Map(),aliases={KeyW:'ArrowUp',KeyS:'ArrowDown',KeyA:'ArrowLeft',KeyD:'ArrowRight',Space:' '};
  const pad=n=>String(n).padStart(6,'0');
  let s=D.create(),mode='ready',last=0,best=0,audio,sound=false,notice=0;
  try{best=Number(localStorage.frostShiftBest)||0}catch{}
  function tone(freq,duration){
    if(!sound||!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();
    osc.connect(gain);gain.connect(audio.destination);osc.frequency.value=freq;gain.gain.setValueAtTime(.06,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.start();osc.stop(audio.currentTime+duration)
  }
  function announce(text){$('message').textContent=text;notice=2.3}
  function held(key){return keys.has(key)||[...keys].some(k=>aliases[k]===key)||[...touch.values()].includes(key)}
  function hud(){
    $('dist').textContent=s.heat.filter(t=>t===30).length+' / 3';$('clock').textContent=Math.ceil(s.time)+' SEC';$('best').textContent=pad(best);$('points').textContent=pad(s.score)
  }
  function overlay(title,desc,button){$('title').textContent=title;$('desc').textContent=desc;$('start').textContent=button;$('intro').hidden=false;$('pause').hidden=true;$('message').textContent='';keys.clear();touch.clear()}
  function start(){
    if(mode!=='paused'){s=D.create();view.render(s,0,0,true)}
    mode='driving';$('intro').hidden=true;$('pause').hidden=false;$('status').textContent='ON CALL';announce('Find the orange intakes · three hits per site');hud()
  }
  function pause(){if(mode!=='driving')return;mode='paused';$('status').textContent='PAUSED';overlay('PARKED','Your shift clock is paused.','Resume patrol')}
  function finish(won){
    mode='ended';if(won)s.score+=Math.ceil(s.time)*10;
    best=Math.max(s.score,best);try{localStorage.frostShiftBest=best}catch{}
    $('status').textContent='OFF DUTY';overlay(won?'ALL SYSTEMS COOL':'SHIFT OVER',s.heat.filter(t=>t===30).length+' of 3 data centres online · '+s.score+' points','Drive again');hud()
  }
  function fire(point){
    const id=D.near(s);if(id<0)return;
    const target=point||D.ports[id];
    if(!D.throwBall(s,target))return;
    tone(260,.055);
    if(!point&&D.dist(s,target)>D.range)announce('Out of throwing range · drive closer')
  }
  function update(dt){
    D.drive(s,held('ArrowUp'),held('ArrowDown'),Number(held('ArrowRight'))-Number(held('ArrowLeft')),dt);
    if(held(' '))fire();
    D.step(s,dt,id=>{const cooled=s.heat[id]===30;announce(D.centres[id].name+(cooled?' back online!':' intake · '+s.heat[id]+'°C'));tone(cooled?780:520,.13)});
    notice-=dt;if(notice<=0)$('message').textContent='';
    if(s.heat.every(h=>h===30))finish(true);else if(!s.time)finish(false)
  }
  function frame(t){
    let dt=Math.min(.08,Math.max(0,(t-last)/1000));last=t;
    const elapsed=dt;
    while(mode==='driving'&&dt>.000001){const slice=Math.min(.016,dt);update(slice);dt-=slice}
    view.render(s,t,elapsed);hud();requestAnimationFrame(frame)
  }
  $('start').onclick=start;$('pause').onclick=pause;
  $('sound').onclick=()=>{try{if(!audio)audio=new AudioContext();audio.resume();sound=!sound;$('sound').textContent=sound?'◖)) SOUND ON':'◖)) SOUND OFF';$('sound').setAttribute('aria-pressed',String(sound));tone(440,.12)}catch{$('sound').textContent='Sound unavailable'}};
  document.addEventListener('keydown',e=>{
    if(mode!=='driving'||e.altKey||e.ctrlKey||e.metaKey||e.composedPath().some(n=>n.tagName==='ARCADE-NAV'))return;
    if(e.code==='Escape'){pause();return}
    if(!(e.code in aliases)&&!e.code.startsWith('Arrow'))return;
    e.preventDefault();keys.add(e.code);
    if(e.code==='Space'&&!e.repeat)fire()
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  for(const b of document.querySelectorAll('[data-key]')){
    b.onpointerdown=e=>{if(mode!=='driving')return;e.preventDefault();b.setPointerCapture(e.pointerId);touch.set(e.pointerId,b.dataset.key);if(b.dataset.key===' ')fire()};
    b.onlostpointercapture=e=>touch.delete(e.pointerId)
  }
  canvas.onpointerdown=e=>{if(mode==='driving')fire(view.aim(s,e))};
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
  document.addEventListener('click',e=>{const nav=document.querySelector('arcade-nav');if(e.composedPath().includes(nav)&&nav.shadowRoot?.querySelector('button')?.getAttribute('aria-expanded')==='true')pause()});
  hud();view.render(s,0,0,true);requestAnimationFrame(frame)
})();
