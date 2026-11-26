'use strict';
(()=>{
 const canvas=document.getElementById('sheet'),ctx=canvas.getContext('2d'),ink=document.getElementById('ink'),save=document.getElementById('save'),fresh=document.getElementById('fresh'),status=document.getElementById('status');
 const dog=document.getElementById('dog');
 let yellow=false;
 const size=canvas.width,key='enso.dec07.print.v1';
 let seed=71226,snow;
 function freshSurface(value){
   snow?.clear();seed=value;let grain=value;
   snow=snowSurface(ctx,size,()=>((grain=(Math.imul(grain,1664525)+1013904223)>>>0)/4294967296));
 }
 freshSurface(seed);
 let mode='study',pointer=null,points=[],prev,length=0,width=0,raf=0,keyboardStart=0,setting='balanced';
 // Keep the original setting identifiers so previous drawings can be restored in snow.
 const loads={dry:13,balanced:23,full:34};
 function clear(settled=false){snow.clear(yellow,settled)}
 function prepare(){prev=null;length=0;width=5}
 function lay(p,remember=true){
   if(remember)points.push(p);
   if(!prev){snow.carve(p,p,width,width);prev=p;return}
   const d=Math.hypot(p.x-prev.x,p.y-prev.y);if(d<.24)return;
   const speed=Math.min(4,d/Math.max(4,p.t-prev.t));
   const target=loads[setting]*(1-.1*speed)*(.6+p.pressure*.85);
   const next=width+(target-width)*(1-Math.exp(-d/12));
   snow.carve(prev,p,width,next);width=next;length+=d;prev=p;
 }
 function arc(a,study=false){
   const angle=1.14-a*Math.PI*2,r=(study?288:285)+8*Math.sin(angle*3+.7)+4*Math.sin(angle*5);
   return {x:475+Math.cos(angle)*r*.96,y:480+Math.sin(angle)*r,t:a*2200,pressure:.5+.3*Math.sin(angle-1.7)};
 }
 function showStudy(){setting='balanced';clear();prepare();for(let i=0;i<=210;i++)lay(arc(i/224,true),false)}
 function begin(){
   if(mode==='finished'||mode==='drawing')return false;
   mode='drawing';points=[];setting=ink.value;clear();prepare();dog.disabled=ink.disabled=fresh.disabled=true;save.disabled=true;status.textContent='Drawing in the snow.';return true;
 }
 function showScore(){
   const total=scoreStroke(points,size);
   document.getElementById('total').textContent=total+' / 1,000';
   document.getElementById('scorecard').hidden=false;
   status.textContent='';

 }
 function complete(){
   cancelAnimationFrame(raf);pointer=null;
   if(mode!=='drawing')return;
   dog.disabled=false;
   if(length<12){mode='blank';clear();ink.disabled=fresh.disabled=false;status.textContent='Draw across the snow to make a stroke.';return}
   mode='finished';ink.disabled=true;fresh.disabled=false;save.disabled=false;showScore();
   storePrint();
 }
 function storePrint(){try{localStorage.setItem(key,JSON.stringify({setting,points,yellow,seed}))}catch{}}
 dog.onclick=()=>{
   yellow=!yellow;dog.setAttribute('aria-pressed',String(yellow));
   if(mode==='finished'){
     clear();prepare();for(const p of points)lay(p,false);storePrint();
   }else if(mode==='study'||yellow){
     mode='study';showStudy();
   }
 };
 function sample(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*size/r.width,y:(e.clientY-r.top)*size/r.height,t:e.timeStamp,pressure:e.pointerType==='pen'?e.pressure:.52}}
 canvas.onpointerdown=e=>{if(e.button!==0||!begin())return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);lay(sample(e))};
 canvas.onpointermove=e=>{if(pointer!==e.pointerId)return;const batch=e.getCoalescedEvents?.();for(const ev of batch?.length?batch:[e])lay(sample(ev))};
 canvas.onpointerup=e=>{if(pointer===e.pointerId){lay(sample(e));complete()}};
 canvas.onlostpointercapture=e=>{if(pointer===e.pointerId)complete()};
 canvas.onkeydown=e=>{if(e.code!=='Space')return;e.preventDefault();if(e.repeat||!begin())return;keyboardStart=performance.now();lay(arc(0));
   function sweep(now){const f=Math.min(1,(now-keyboardStart)/2400);lay(arc(f));if(f===1)complete();else raf=requestAnimationFrame(sweep)}raf=requestAnimationFrame(sweep)};
 canvas.onkeyup=e=>{if(e.code==='Space'&&pointer===null&&mode==='drawing'){e.preventDefault();complete()}};
 canvas.onblur=()=>{if(pointer===null&&mode==='drawing')complete()};
 fresh.onclick=()=>{document.getElementById('scorecard').hidden=true;mode='blank';points=[];freshSurface(Math.floor(Math.random()*4294967296));clear();ink.disabled=false;save.disabled=true;status.textContent='Fresh snow. Begin wherever you like.';try{localStorage.removeItem(key)}catch{}canvas.focus({preventScroll:true})};
 save.onclick=()=>{canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.download='enso-07-december.png';a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)},'image/png')};
 showStudy();
 try{const s=JSON.parse(localStorage.getItem(key));if(s&&Object.hasOwn(loads,s.setting)&&Array.isArray(s.points)&&s.points.length>1&&s.points.every(p=>p&&[p.x,p.y,p.t,p.pressure].every(Number.isFinite))){
   if(Number.isInteger(s.seed)&&s.seed!==seed)freshSurface(s.seed);
   yellow=s.yellow===true;dog.setAttribute('aria-pressed',String(yellow));
   setting=ink.value=s.setting;points=s.points;clear(true);prepare();for(const p of points)lay(p,false);mode='finished';ink.disabled=true;save.disabled=false;showScore();
 }}catch{}
})();
