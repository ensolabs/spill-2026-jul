'use strict';
(()=>{
 const $=id=>document.getElementById(id),key='enso.smorebua.dec06.v1';
 const fmt=t=>{const cs=Math.round(t*100);return Math.floor(cs/6000)+':'+String(Math.floor(cs/100)%60).padStart(2,'0')+'.'+String(cs%100).padStart(2,'0')};
 const bestOf=runs=>runs.reduce((best,r)=>!best||r.total<best.total?r:best,null);
 const setup=r=>[r.wax,r.zone];
 const valid=v=>Array.isArray(v)&&Number.isInteger(v[0])&&v[0]>=0&&v[0]<3&&Number.isInteger(v[1])&&v[1]>=35&&v[1]<=65;
 let finishLabel='',runs=[],active=null,official=null,practice=false,snow=0,wax=1,zone=50,elapsed=0,last=performance.now(),lastCount='';
 try{
   const saved=JSON.parse(localStorage.getItem(key));
   if(saved&&Array.isArray(saved.runs)&&saved.runs.length<=3&&saved.runs.every(valid)){
     official=valid(saved.official)?Course.simulate(...saved.official):null;practice=!!official&&saved.practice===true;
     if(practice&&[1,2].includes(saved.snow))snow=saved.snow;
     runs=saved.runs.map(v=>Course.simulate(...v,snow));
     if(valid(saved.active)&&runs.length<3){active=Course.simulate(...saved.active,snow)}
     if(active||runs.length){const r=active||runs[runs.length-1];wax=r.wax;zone=r.zone}
   }
 }catch{}
 function save(){try{localStorage.setItem(key,JSON.stringify({runs:runs.map(setup),active:active?setup(active):null,practice,snow,official:official?setup(official):null}))}catch{}}
 const draw=skiBroadcast($('race'));
 const svg=$('profile'),sy=d=>30-Course.height(d)*.98;
 let path='M0 '+sy(0);for(let d=4;d<=560;d+=4)path+='L'+d+' '+sy(d);
 svg.innerHTML='<path d="'+path+' L560 46 H0 Z" fill="#567c63"/><path d="'+path+'" fill="none" stroke="#d3dfaa" stroke-width="1.5"/><path d="M245 0V46" stroke="#dceac0" stroke-dasharray="2 3"/><circle id="shadow" r="4" fill="#92dfeb" visibility="hidden"/><circle id="runner" r="4.3" fill="#ffa16e" stroke="#403f31"/>';
 const runner=$('runner'),shadow=$('shadow');
 function tins(){
   $('tins').replaceChildren(...Course.waxes.map((w,i)=>{const b=document.createElement('button');b.className='tin';b.type='button';b.setAttribute('aria-pressed',i===wax);b.style.setProperty('--wax',w.color);b.innerHTML='<span class="lid" aria-hidden="true">S</span>'+w.name+'<small>'+w.range+'</small>';b.onclick=()=>{wax=i;[...$('tins').children].forEach((el,j)=>el.setAttribute('aria-pressed',j===i))};return b}));
   $('zone').value=zone;$('cm').textContent=zone+' cm';
 }
 $('zone').oninput=e=>{zone=+e.target.value;$('cm').textContent=zone+' cm'};
 function coach(){
   if(!runs.length)return practice?'Practice heat. Your December 6 result is '+fmt(official.total)+'.':'The climb needs grip. The descent rewards a short, fast wax pocket. Pick a baseline for run one.';
   const r=runs.at(-1),prior=bestOf(runs.slice(0,-1)),win=bestOf(runs);
   const tip=r.slips>20?'The skis slipped on the steep pitches. Try a longer grip zone or a softer wax.':'Clean kick on the climb. Try trimming the grip zone to gain speed downhill.';
   if(runs.length===3)return (practice?'Practice':'Race')+' complete. Run '+(runs.indexOf(win)+1)+' was fastest at '+fmt(win.total)+' with '+Course.waxes[win.wax].name.toLowerCase()+' wax over '+win.zone+' cm.';
   if(!prior)return 'Baseline set. '+tip;
   const split=(a,b)=>Math.abs(a-b).toFixed(2)+' s '+(Math.abs(a-b)<.005?'difference':a<b?'faster':'slower');
   return 'Against your best ghost: climb '+split(r.up,prior.up)+', descent '+split(r.down,prior.down)+'. '+tip;
 }
 function sheet(){
   const win=bestOf(runs);$('sheet').replaceChildren(...Array.from({length:3},(_,i)=>{const r=runs[i],row=document.createElement('tr');row.className=r&&r===win?'best':'';row.innerHTML='<td>'+String(i+1).padStart(2,'0')+(r&&r===win?' ★':'')+'</td>'+(r?'<td>'+Course.waxes[r.wax].name+' · '+r.zone+' cm</td><td>'+fmt(r.up)+'</td><td>'+fmt(r.down)+'</td><td>'+fmt(r.total)+'</td>':'<td>—</td><td>—</td><td>—</td><td>—</td>');return row}));
 }
 function panel(){
   if(runs.length){
     const recent=runs.at(-1),prior=bestOf(runs.slice(0,-1));
     finishLabel=prior?'RUN '+runs.length+' · '+(recent.total<=prior.total?'−':'+')+Math.abs(recent.total-prior.total).toFixed(2)+' s VS GHOST':'BASELINE · '+fmt(recent.total);
   }
   const report=Course.snowReports[snow];
   $('temp').textContent=report.temp;$('snow-name').textContent=report.name;$('crystals').textContent=report.detail;
   const done=runs.length===3,n=Math.min(3,runs.length+1);
   $('attempt').textContent=(practice?'PRACTICE ':'RUN ')+n+' / 3';
   $('equipment').disabled=!!active||done;
   $('go').disabled=!!active;$('go').textContent=active?'On course · 5× replay':done?'Practice: '+Course.snowReports[snow===1?2:1].name+' →':'Race run '+n+' →';
   $('skip').hidden=!active;$('share').hidden=!done;$('share').textContent='Copy result';
   $('stage').textContent=active?'ON COURSE':runs.length?'FINISH LINE':'START LINE';
   $('coach').textContent=active?'Watch the skier and the crest split. The replay runs at five times race speed.':coach();
   tins();sheet();
 }
 function finish(){
   if(!active)return;runs.push(active);active=null;if(runs.length===3&&!practice)official=bestOf(runs);save();panel();
 }
 $('go').onclick=()=>{
   if(active)return;
   if(runs.length===3){snow=snow===1?2:1;practice=true;runs=[];elapsed=0;save();panel();return}
   active=Course.simulate(wax,zone,snow);elapsed=-5;last=performance.now();lastCount='';save();panel();
 };
 $('skip').onclick=finish;
 $('share').onclick=async()=>{
   const r=bestOf(runs),text='Smørebua · 6 December · '+(practice?'Practice · '+Course.snowReports[snow].name:'Official')+' '+fmt(r.total)+' · '+Course.waxes[r.wax].name+' / '+r.zone+' cm · Trondheim 560 m';
   try{await navigator.clipboard.writeText(text);$('share').textContent='Result copied ✓'}catch{window.prompt('Copy your result',text)}
 };
 function marker(el,d){el.setAttribute('cx',d);el.setAttribute('cy',sy(d))}
 function frame(now){
   const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;
   if(active&&!document.hidden){elapsed+=dt*5;if(elapsed>=active.total)finish()}
   const done=runs.length>0&&!active,r=active||runs.at(-1);
   const time=active?Math.max(0,elapsed):done?r.total:0,d=active?Course.distance(active,time):done?560:0;
   const ghost=active?bestOf(runs):null,g=ghost?Course.distance(ghost,time):null;
   draw(d,g,now/1000,!!active);marker(runner,d);shadow.setAttribute('visibility',g===null?'hidden':'visible');if(g!==null)marker(shadow,g);
   $('timer').textContent=fmt(time);$('distance').textContent=Math.floor(d)+' / 560 m';$('rival').hidden=!ghost;
   if(ghost){const m=Math.min(Course.length-1,Math.floor(d)),ghostTime=ghost.times[m]+(d-m)*(ghost.times[m+1]-ghost.times[m]);const delta=time-ghostTime;$('rival').textContent='◌ GHOST · '+(Math.abs(delta)<.1?'EVEN':Math.abs(delta).toFixed(1)+' s '+(delta<0?'AHEAD':'BEHIND'))}
   $('scene-label').textContent=active?(elapsed<0?'READY AT THE GATE':d<Course.crest?'01 / THE CLIMB':'02 / THE DESCENT'):(done?finishLabel:'GRANÅSEN · 560 M');
   if(active&&d>=Course.crest&&lastCount!=='split'){lastCount='split';$('coach').textContent='Crest split '+fmt(r.up)+'. The skier is tucked for the descent.'}
   requestAnimationFrame(frame);
 }
 panel();requestAnimationFrame(frame);
})();
