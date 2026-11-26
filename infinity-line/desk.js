'use strict';
(()=>{
 const $=id=>document.getElementById(id),names=['A','B'];
 let desk=new Rail.Desk(),mode='ready',ride=false,draw,last=performance.now(),uiAt=0,best=0,sound=false,ctx=null,roots=[];
 try{best=Number(localStorage.getItem('enso.infinity.best'))||0}catch{}
 function chart(canvas){
   const g=canvas.getContext('2d');return d=>{
     const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
     const scale=Math.min((w-35)/54,(h-90)/26);g.fillStyle='#203a43';g.fillRect(0,0,w,h);g.save();g.translate(w/2,h/2);g.scale(scale,scale);
     g.strokeStyle='#c7d6cf';g.lineWidth=.4;g.beginPath();for(let s=0;s<=Rail.length+1;s+=.4){const p=Rail.at(s);s?g.lineTo(p.x,p.z):g.moveTo(p.x,p.z)}g.stroke();
     for(const t of d.trains){for(let i=t.cars-1;i>=0;i--){const p=Rail.at(t.s-i*Rail.pitch);g.save();g.translate(p.x,p.z);g.rotate(-p.yaw);g.fillStyle=['#f39375','#8edceb','#c7986b','#a5d39b'][t.id];g.fillRect(-.65,-.9,1.3,1.8);g.restore()}}
     for(let k=0;k<2;k++){const p=Rail.at(k*Rail.half-5);g.fillStyle=(d.owner?d.owner.next%2:d.selected)===k?'#9bf5b9':'#ff9990';g.font='bold 2px monospace';g.fillText(names[k],p.x,p.z-1.1)}
     g.restore()
   }
 }
 try{draw=railwayWorld($('view'))}catch(err){const c=document.createElement('canvas');c.id='view';$('view').replaceWith(c);draw=chart(c);$('camera').hidden=true}
 function tone(f,start=0,len=.18,vol=.1,type='sine'){
   if(!ctx||!sound)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+start;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.016);g.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+len+.01);o.onended=()=>{o.disconnect();g.disconnect()}
 }
 $('audio').onclick=()=>{try{ctx??=new AudioContext();ctx.resume();sound=!sound;$('audio').textContent=sound?'Sound on':'Sound off';$('audio').setAttribute('aria-pressed',sound);tone(660)}catch{$('audio').textContent='Audio unavailable'}};
 const set=(id,v)=>{if($(id).textContent!==v)$(id).textContent=v};
 function refresh(){
   const actual=desk.owner?desk.owner.next%2:desk.selected;
   $('a').classList.toggle('green',actual===0);$('b').classList.toggle('green',actual===1);
   set('lever','Clear '+names[1-desk.selected]+' instead ⇄');
   set('lock',desk.owner?desk.owner.name+' in crossing. '+(actual===desk.selected?'Tail clearing.':'Signal '+names[desk.selected]+' queued.'):'Signal '+names[actual]+' clear. '+names[1-actual]+' holds.');
   set('clock',String((20+Math.floor(desk.time/3600))%24).padStart(2,'0')+':'+String(Math.floor(desk.time/60)%60).padStart(2,'0'));
   set('score',String(desk.score));set('late',desk.late+' / 3');set('message',desk.message);
   desk.trains.forEach((t,i)=>{
     if(!roots[i]){const row=document.createElement('div');row.className='service';row.innerHTML='<b></b><span></span><small></small>';$('services').append(row);roots[i]=row}
     const [name,sig,info]=roots[i].children;
     name.textContent=t.name;sig.textContent='→ '+names[t.next%2];
     const eta=Math.max(0,(t.next*Rail.half-4.8-t.s)/t.speed);
     info.textContent=(desk.owner===t?'In crossing':t.stopped?'Waiting':Math.ceil(eta)+' s to signal')+' · '+(t.freight?'Freight':t.misses?'Late this lap':Math.max(0,8-t.delay).toFixed(1)+' s slack');
   });
 }
 function setMode(m){
   mode=m;$('overlay').hidden=m==='run';$('lever').disabled=$('pause').disabled=m!=='run';
   if(m==='paused'){set('headline','Shift paused');set('summary','Your timetable is paused.');set('start','Resume shift →')}
   if(m==='end'){set('headline','Shift complete');set('summary',desk.score+' on-time passenger laps. Personal best: '+best+'.');set('start','New shift →')}
   last=performance.now();refresh();
 }
 function toggleView(){if($('camera').hidden)return;ride=!ride;document.querySelector('.vista').classList.toggle('riding',ride);set('camera',ride?'Signal map ↗':'Carriage window ↗');$('camera').setAttribute('aria-pressed',ride)}
 $('camera').onclick=toggleView;
 $('start').onclick=()=>{if(mode!=='paused'){desk=new Rail.Desk();roots=[];$('services').replaceChildren()}setMode('run');$('lever').focus({preventScroll:true});tone(440,0,.4,.09,'triangle')};
 $('pause').onclick=()=>setMode('paused');
 function lever(){if(mode!=='run')return;desk.switch();refresh();tone(170,0,.07,.07,'triangle')}
 $('lever').onclick=lever;
 window.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;if(e.code==='KeyV'){toggleView();return}
 if(e.code==='Space'&&mode==='run'&&(!e.target.closest('button')||e.target===$('lever'))){e.preventDefault();lever()}if(e.code==='Escape'&&mode==='run')setMode('paused')});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='run')setMode('paused')});
 function frame(now){
   const dt=Math.min(.1,(now-last)/1000);last=now;
   if(mode==='run'){
     const score=desk.score,n=desk.trains.length,owner=desk.owner,late=desk.late;
     const local=desk.trains[0],shed=Rail.length*.75-6,oldPass=Math.floor((local.s-shed)/Rail.length);
     for(let left=dt;left>0;left-=1/60)desk.step(Math.min(left,1/60));
     if(desk.score>score){tone(660);tone(880,.19,.34)}else if(desk.trains.length>n){tone(510,0,.45,.08,'triangle');tone(640,.07,.38,.045)}
     else if(Math.floor((local.s-shed)/Rail.length)>oldPass)tone(540,0,.55,.09,'triangle');
     else if(late<desk.late)tone(170,0,.32);else if(owner!==desk.owner&&desk.owner)tone(350,0,.1,.04);
     if(desk.score>best){best=desk.score;try{localStorage.setItem('enso.infinity.best',String(best))}catch{}}
     if(desk.late>=3)setMode('end');
   }
   draw(desk,ride,now/1000);if(now-uiAt>140){refresh();uiAt=now}requestAnimationFrame(frame);
 }
 refresh();requestAnimationFrame(frame);
})();
