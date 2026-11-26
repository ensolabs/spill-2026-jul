'use strict';
(()=>{
const $=id=>document.getElementById(id);
const flight=new Flight();
const keys=new Set(),pulses=new Set(),touches=new Map();
const controls=new Set(['ShiftLeft','ShiftRight','KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','KeyH','KeyL','KeyC']);
const switches=new Set(['KeyE','KeyH','KeyL','KeyC']);
let mode='standby',last=performance.now(),soundOn=false,best=null,scene,radarOnly=false,missionTime=0;
try{best=JSON.parse(localStorage.getItem('enso.nordlys.best'))}catch{}
function display(id,value){const el=$(id);if(el&&el.textContent!==value)el.textContent=value}
const seconds=value=>{const t=Math.max(0,Math.ceil(value));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
function record(){if(best)display('record','PERSONAL BEST · '+best.quality+'% / '+seconds(best.elapsed))}
record();
try{scene=createFjord($('scene'))}catch(error){console.error('Fjord renderer unavailable',error);radarOnly=true}
function drawScope(canvas,s,large=false){
 if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=canvas.clientWidth||170,h=canvas.clientHeight||95,dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0c2028';ctx.fillRect(0,0,w,h);
 const cx=w/2,scale=Math.min(w/104,h/164),map=(x,z)=>[cx+x*scale,h*.5+(z+10)*scale];
 ctx.strokeStyle='#24434a';ctx.lineWidth=1;
 for(let i=-100;i<=100;i+=20){let [x,y]=map(i,i);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 const {ship,base}=Flight.sites;
 const [sx,sy]=map(ship.x,ship.z),[bx,by]=map(base.x,base.z),[px,py]=map(s.x,s.z);
 ctx.strokeStyle='#72b4ac';ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(bx,by);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle=s.phase==='approach'?'#ffb17e':'#8cb8bc';ctx.fillRect(sx-3,sy-3,6,6);
 ctx.fillStyle=s.phase==='return'?'#ffb17e':'#8cb8bc';ctx.fillRect(bx-4,by-2,8,4);
 ctx.fillStyle='#94ffda';ctx.save();ctx.translate(px,py);ctx.rotate(s.heading);ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(4,4);ctx.lineTo(0,2);ctx.lineTo(-4,4);ctx.fill();ctx.restore();
 if(large){ctx.fillStyle='#d5ecdc';ctx.font='12px monospace';ctx.fillText('STRICKEN VESSEL',sx+8,sy+4);ctx.fillText('SHORE BASE',bx+8,by);ctx.fillText('INSTRUMENT FLIGHT',16,30)}
}
let radioUntil=0;
let chart;
if(radarOnly){chart=document.createElement('canvas');chart.id='scene';$('scene').replaceWith(chart)}
// Rotor pulses and a panned beacon are synthesized locally so audio works offline.
class CockpitAudio{
 start(){
   if(!this.ctx){
     this.ctx=new AudioContext();const c=this.ctx;
     this.out=c.createGain();this.out.gain.value=0;this.out.connect(c.destination);
     const noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate),samples=noise.getChannelData(0);
     for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
     const wind=c.createBufferSource();wind.buffer=noise;wind.loop=true;
     const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=530;
     this.wind=c.createGain();this.wind.gain.value=.08;wind.connect(low).connect(this.wind).connect(this.out);wind.start();
     this.rotor=c.createOscillator();this.rotor.type='triangle';this.rotor.frequency.value=44;
     const rotorLevel=c.createGain();rotorLevel.gain.value=.12;this.rotor.connect(rotorLevel).connect(this.out);
     this.blades=c.createOscillator();this.blades.frequency.value=13;const depth=c.createGain();depth.gain.value=.095;this.blades.connect(depth).connect(rotorLevel.gain);
     this.rotor.start();this.blades.start();this.next=0;
   }
   this.ctx.resume().catch(()=>{});
 }
 gain(on){if(this.ctx)this.out.gain.setTargetAtTime(on?.58:0,this.ctx.currentTime,.09)}
 ping(freq,duration,pan=0){
   if(!soundOn||!this.ctx)return;const c=this.ctx,t=c.currentTime,osc=c.createOscillator(),env=c.createGain();
   osc.frequency.value=freq;env.gain.setValueAtTime(.001,t);env.gain.exponentialRampToValueAtTime(.095,t+.014);env.gain.exponentialRampToValueAtTime(.001,t+duration);
   const position=c.createStereoPanner();position.pan.value=pan;osc.connect(env).connect(position).connect(this.out);
   osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();env.disconnect();position.disconnect()};
 }
 step(s){
   if(!soundOn||!this.ctx||mode!=='playing')return;
   const t=this.ctx.currentTime;this.rotor.frequency.setTargetAtTime(42+Math.abs(s.vy)*1.1+(s.attached?3:0),t,.22);
   this.wind.gain.setTargetAtTime(.065+Math.min(.14,Math.hypot(s.vx,s.vz)*.008),t,.3);
   if(t>=this.next){const d=range(s);this.ping(s.phase==='return'?760:920,.09,Math.max(-1,Math.min(1,((s.target.x-s.x)*Math.cos(s.heading)+(s.target.z-s.z)*Math.sin(s.heading))/16)));this.next=t+.8+Math.min(2,d/45)}
 }
}
const audio=new CockpitAudio();
function crewRadio(){
 audio.ping(1150,.18);
 const synth=window.speechSynthesis;if(!soundOn||!synth)return;
 const voice=synth.getVoices().find(v=>v.localService&&/^(nb|nn|no)(-|$)/i.test(v.lang));
 if(voice){const call=new SpeechSynthesisUtterance('Personen er sikret. Tilbake til basen.');call.voice=voice;call.lang=voice.lang;call.volume=.55;synth.speak(call)}
}
function range(s){return s.distance}
function clearInputs(){keys.clear();touches.clear();pulses.clear();document.querySelectorAll('[data-code].pressed').forEach(b=>b.classList.remove('pressed'))}
function resetClock(){last=performance.now()}
function setMode(next){
 mode=next;clearInputs();$('briefing').hidden=mode==='playing';
 if($('pause'))$('pause').disabled=mode!=='playing';
 audio.gain(soundOn&&mode==='playing');if(mode!=='playing')window.speechSynthesis?.cancel();resetClock();
}
function begin(){if(mode!=='paused'){flight.reset();missionTime=0;radioUntil=0}
 setMode('playing');$('start').blur();}
function pause(){if(mode!=='playing')return;setMode('paused');display('mission-title','Flight paused');display('mission-copy','The crew is standing by. Resume when you’re ready.');display('start','Resume flight');$('start').focus({preventScroll:true})}
function end(s){
 const won=s.phase==='complete';if(won){const run={quality:Math.round(s.quality),elapsed:s.elapsed??(180-s.remaining)};
 if(!best||run.quality>best.quality||run.quality===best.quality&&run.elapsed<best.elapsed){best=run;try{localStorage.setItem('enso.nordlys.best',JSON.stringify(best))}catch{}record()}}
 setMode('debrief');display('mission-title',won?'Survivor ashore':'Mission ended');
 display('mission-copy',won?'Survivor delivered to the shore team. Pickup quality '+Math.round(s.quality)+'%. Mission time '+seconds(s.elapsed??180-s.remaining)+'.':s.guidance||'The rescue window has closed. Launch again for another approach.');
 display('start','Fly again');$('start').focus({preventScroll:true});
}
$('start').addEventListener('click',begin);$('pause')?.addEventListener('click',pause);
$('sound').addEventListener('click',()=>{
 try{if(!soundOn){audio.start();window.speechSynthesis?.getVoices()}else{window.speechSynthesis?.cancel()}soundOn=!soundOn;audio.gain(soundOn&&mode==='playing');$('sound').setAttribute('aria-pressed',String(soundOn));display('sound',soundOn?'Sound on':'Sound off')}catch{display('sound','Audio unavailable')}
});
window.addEventListener('keydown',e=>{
 if(e.code==='Escape'&&mode==='playing'){e.preventDefault();pause();return}
 if(mode!=='playing'||!controls.has(e.code))return;e.preventDefault();if(!e.repeat&&switches.has(e.code))pulses.add(e.code);keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
document.querySelectorAll('[data-code]').forEach(b=>{
 const code=b.dataset.code;b.addEventListener('pointerdown',e=>{if(mode!=='playing')return;e.preventDefault();b.setPointerCapture(e.pointerId);touches.set(e.pointerId,code);if(switches.has(code))pulses.add(code);b.classList.add('pressed')});
 b.addEventListener('lostpointercapture',e=>{touches.delete(e.pointerId);if(![...touches.values()].includes(code))b.classList.remove('pressed')});
});
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
window.addEventListener('resize',()=>scene?.resize?.());
function hud(s){
 display('heading',String(Math.round(s.heading*180/Math.PI)%360).padStart(3,'0')+'°');display('view-mode',s.followCamera?'Chase':'North-up');
 display('phase',mode==='standby'?'Standby':s.phase==='approach'?'Ship pickup':s.phase==='return'?'Return to shore base':s.phase==='complete'?'Survivor ashore':'Mission ended');
 display('time',seconds(s.remaining));display('alt',Math.round(s.y)+' m');display('range',Math.round(range(s))+' m');
 display('winch',s.progress>0?'Contact '+Math.round(s.progress*100)+'%':!s.deployed&&s.rope<=.8?'Stowed':(s.rope??0).toFixed(1)+' m');display('hover',s.hover?'Auto':'Manual');
 display('quality',s.attached||s.phase==='complete'?Math.round(s.quality)+'%':'—');
 display('guidance',mode==='standby'?'Standing by for launch.':missionTime<radioUntil?'Survivor on the line. Fly southeast to the shore base.':s.guidance);drawScope($('radar'),s);
}
let lastHud=-1000;
function frame(now){
 const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;
 if(mode==='playing'){
   const inputs=new Set([...keys,...touches.values(),...pulses]);pulses.clear();const before=flight.state.phase;
   flight.step(dt,inputs);
   missionTime+=dt;const s=flight.state;
   if(s.phase==='complete'||s.phase==='failed')end(s);else if(before!==s.phase){radioUntil=missionTime+4;crewRadio()}
   audio.step(s);
 }
 if(scene)scene.draw(mode==='standby'?{...flight.state,standby:true}:flight.state,mode==='standby'?now/1000:missionTime);else drawScope(chart,flight.state,true);
 if(now-lastHud>=70){hud(flight.state);lastHud=now}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
