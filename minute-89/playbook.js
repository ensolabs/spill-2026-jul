'use strict';
const Match=(()=>{
 const start=[[-2,13],[7,14]],kick=[-9,23],dropZ=7,lead=1.2,flight=1.4,meet=lead+flight;
 const sat=n=>Math.max(0,Math.min(1,n));
 const lerp=(a,b,t)=>a+(b-a)*t;
 const gap=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const wall=[[-7,17],[-6.1,17],[-5.2,17],[-4.3,17]];
 function run(route,t){
   let travel=Math.max(0,t)*4.9;
   for(let i=1;i<route.length;i++){
     const a=route[i-1],b=route[i],d=gap(a,b);
     if(d>travel)return [lerp(a[0],b[0],travel/d),lerp(a[1],b[1],travel/d)];
     travel-=d;
   }
   return route.at(-1);
 }
 function ball(plan,k){
   const t=sat(k);return [lerp(kick[0],plan.target,t)+plan.bend*Math.sin(t*Math.PI),1.57*t+2.25*Math.sin(Math.PI*t),lerp(kick[1],dropZ,t)];
 }
 function defenders(plan,t){
   return plan.routes.map((route,i)=>{
     const runner=run(route,Math.max(0,t-.3)),origin=start[i];
     const follow=sat(gap(origin,runner)/4);
     return [lerp(i?3:-1,runner[0]+(i?1:-1)*1.7,follow),lerp(7,runner[1]-1.7,follow)];
   });
 }
 function analyze(plan){
   let end=meet,shot=null,reason='No one reaches the cross. Draw a shorter run or bring the delivery closer.',kind='MISSED CROSS';
   for(let k=0;k<=100;k++){const t=k/100,[x,h,z]=ball(plan,t);if(h<3&&wall.some(w=>Math.hypot(x-w[0],z-w[1])<.66)){
     return {end:lead+flight*t,kind:'BLOCKED',reason:'The wall gets a touch. Add curl to carry the ball around its outside shoulder.',shot:null};
   }}
   const runners=plan.routes.map(r=>run(r,meet)),landing=[plan.target,dropZ];
   const errors=runners.map(r=>gap(r,landing)),striker=errors[0]<=errors[1]?0:1,other=1-striker;
   if(errors[striker]<1.7){
     const keeper=keeperX(plan,meet),side=keeper>0?-1:1;
     const spareMarker=defenders(plan,meet)[other];
     const crowded=gap(runners[striker],runners[other])<3.2||gap(landing,spareMarker)<3.1;
     const aim=crowded?keeper*.8:side*(3.2-errors[striker]*.19);
     shot={x:aim,y:1.22,keeper,striker};end+=.65;
     const saved=Math.abs(aim-keeper)<2.25;kind=saved?'SAVED':'GOAL';
     reason=saved?'The keeper gathers a crowded header. Send one runner across goal to draw the marking defender away.':(striker===0?'No. 9':'No. 7')+' meets the cross and heads into the open corner. Enso take the lead!';
   }
   return {end,kind,reason,shot};
 }
 function keeperX(p,t){return Math.max(-2,Math.min(2,(run(p.routes[0],t)[0]+run(p.routes[1],t)[0])*.17))}
 function sample(p,r,t){
   const bodies=p.routes.map(path=>run(path,Math.min(t,meet+.32)));
   const marks=defenders(p,Math.min(t,meet+.32));
   const k=sat((t-lead)/flight);let b=ball(p,k),keeper=keeperX(p,Math.min(t,meet));
   if(r.shot&&t>meet){
     const f=sat((t-meet)/.65);b=[lerp(p.target,r.shot.x,f),lerp(1.57,r.shot.y,f)+.42*Math.sin(f*Math.PI),lerp(dropZ,r.kind==='SAVED'?.85:-.35,f)];
     keeper=lerp(r.shot.keeper,r.shot.keeper+Math.sign(r.shot.x-r.shot.keeper)*Math.min(2,Math.abs(r.shot.x-r.shot.keeper)),sat((f-.28)/.72));
   }
   return {bodies,marks,ball:b,keeper,kickRun:sat(t/lead),jump:r.shot?Math.max(0,1-Math.abs(t-meet)*4):0};
 }
 return {start,kick,dropZ,wall,lead,meet,flight,ball,run,analyze,sample,gap};
})();
