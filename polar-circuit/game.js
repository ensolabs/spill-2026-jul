'use strict';
(()=>{
const $=id=>document.getElementById(id);
let best=Array(levels.length).fill(null);
try{const values=JSON.parse(localStorage.getItem('enso.polar.turns'));if(Array.isArray(values))best=best.map((_,i)=>Number.isInteger(values[i])&&values[i]>0?values[i]:null)}catch{}
let index=0,level,orient,result,turns,view,flat=false,ctx,sound=false;
const palette=['#75ffe1','#ff88bd'];
function tone(f,t=0,volume=.09){
 if(!sound||!ctx)return;const start=ctx.currentTime+t,osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+.24);
 osc.connect(gain).connect(ctx.destination);osc.start(start);osc.stop(start+.25);osc.onended=()=>{osc.disconnect();gain.disconnect()};
}
// Sonify the active path: depth becomes pitch, and each wavelength gets its own register.
let beat=0;
setInterval(()=>{
 if(!sound||document.hidden||!result||result.solved)return;
 for(const [, , ,channel] of level.sources){
   const path=result.segments.filter(segment=>segment[4]===channel);
   if(!path.length)continue;
   const [x,z]=path[beat%path.length],scale=[0,3,5,7,10];
   const pitch=scale[(x+z)%5]+(channel?12:0);
   tone(130.81*Math.pow(2,pitch/12),channel*.045,.025);
 }
 beat++;
},445);
$('sound').onclick=()=>{try{if(!ctx)ctx=new AudioContext();ctx.resume();sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',sound);tone(500)}catch{$('sound').textContent='Audio unavailable'}};
function diagram(){
 const at=n=>32+n*44;
 let svg='<svg viewBox="0 0 284 284" role="group" aria-label="Circuit schematic"><defs><pattern id="cells" width="44" height="44" x="10" y="10" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="42" height="42" rx="4" fill="#282537" stroke="#453a52"/></pattern></defs><rect x="10" y="10" width="264" height="264" fill="url(#cells)"/>';
 for(const [x,z,a,b,c] of result.segments)svg+='<path d="M'+at(x)+' '+at(z)+'L'+at(a)+' '+at(b)+'" stroke="'+palette[c]+'" stroke-width="3"/>';
 for(const [x,z] of level.blocks){const a=at(x),b=at(z);svg+='<rect x="'+(a-14)+'" y="'+(b-14)+'" width="28" height="28" rx="3" fill="#151721" stroke="#666173"/>';for(let j=-1;j<2;j++)svg+='<path d="M'+(a-9)+' '+(b+j*6)+'h18" stroke="#666173" stroke-width="2"/>'}
 for(const [x,z,,c] of level.sources)svg+='<path transform="translate('+at(x)+' '+at(z)+')" d="M-10 -9L12 0 -10 9Z" fill="'+palette[c]+'"/>';
 level.receivers.forEach(([x,z,c],i)=>{svg+='<path transform="translate('+at(x)+' '+at(z)+')" d="M0 -12L12 0 0 12 -12 0Z" fill="'+(result.lit.has(i)?palette[c]:'#272735')+'" stroke="'+palette[c]+'" stroke-width="2"/>'});
 level.mirrors.forEach(([x,z,split],i)=>{svg+='<g data-mirror="'+i+'" transform="translate('+at(x)+' '+at(z)+')"><circle r="17" fill="#3a304a" stroke="'+(split?palette[0]:'#a992ca')+'"/><path d="M-11 '+(orient[i]?-11:11)+' L11 '+(orient[i]?11:-11)+'" stroke="#c7a7ff" stroke-width="3"/>'+(split?'<path d="M-12 0h24" stroke="#72f3dc" stroke-dasharray="2 2"/>':'')+'<text y="-13" x="12" fill="#fff" stroke="#221a33" stroke-width="3" paint-order="stroke" font-family="monospace" font-weight="bold" font-size="12">'+(i+1)+'</text></g>'});
 $('diagram').innerHTML=svg+'</svg>';
}
function update(){
 result=trace(level,orient);view?.signal(result,orient);if(flat)diagram();
 $('online').textContent=result.lit.size+' / '+level.receivers.length;$('moves').textContent=String(turns).padStart(2,'0');
 $('knobs').querySelectorAll('button').forEach((b,i)=>{const angle=orient[i]?'╲':'╱';b.textContent=(i+1)+' '+angle+(level.mirrors[i][2]?'⑂':'');b.disabled=result.solved;b.setAttribute('aria-label','Rotate '+(level.mirrors[i][2]?'splitter ':'mirror ')+(i+1)+', currently '+(orient[i]?'backslash':'slash'))});
 $('next').hidden=!result.solved;
 if(result.solved){
   best[index]=Math.min(best[index]??Infinity,turns);
   try{localStorage.setItem('enso.polar.turns',JSON.stringify(best))}catch{}
   $('feedback').textContent=index===levels.length-1?'All circuits online. Polar mesh synchronized.':'Link established. All receivers online.';
   $('next').textContent=index===levels.length-1?'Replay from circuit 01 ↻':'Next circuit →';
   [523,659,784].forEach((f,i)=>tone(f,i*.1));
 }else $('feedback').textContent=turns?'Signal live · '+result.lit.size+' of '+level.receivers.length+' receivers locked.':'Select a numbered mirror to turn it 90°.';
}
function rotate(i){if(!level||result?.solved||i<0||i>=orient.length)return;orient[i]^=1;turns++;tone(280+35*i);update()}
try{view=createCircuitView($('world'),rotate)}catch{flat=true;$('view').hidden=true}
function setView(){flat=!view||flat;$('world').hidden=flat;$('diagram').hidden=!flat;$('view-name').textContent=flat?'SCHEMATIC':'ISOMETRIC';$('view').textContent=flat?'3D view ⇄':'Schematic ⇄';if(flat)diagram()}
function load(i){
 beat=0;index=i;level=levels[i];orient=[...level.start];turns=0;
 $('levelno').textContent='CIRCUIT '+String(i+1).padStart(2,'0')+' / 05'+(best[i]?' · BEST '+best[i]:'');$('title').textContent=level.name;$('brief').textContent=level.brief;$('rose').hidden=!level.sources.some(s=>s[3]===rose);
 $('knobs').replaceChildren(...level.mirrors.map((_,j)=>{const b=document.createElement('button');b.onclick=()=>rotate(j);return b}));
 view?.load(level,orient);update();setView();
}
$('diagram').onclick=e=>{const m=e.target.closest('[data-mirror]');if(m)rotate(Number(m.dataset.mirror))};
$('retry').onclick=()=>load(index);$('next').onclick=()=>{if(result.solved)load((index+1)%levels.length)};
$('view').onclick=()=>{if(view){flat=!flat;setView()}};
window.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;if(/^[1-9]$/.test(e.key))rotate(Number(e.key)-1);else if(e.code==='KeyV')$('view').click()});
load(0);
})();
