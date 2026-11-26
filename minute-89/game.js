'use strict';
(()=>{
 const $=id=>document.getElementById(id),board=$('board'),plan={routes:Match.start.map(p=>[p.slice()]),target:3,bend:0};
 let selected=0,mode='plan',result=Match.analyze(plan),time=0,last=performance.now(),pointer=null,stroke=[],view=null;
 const briefing='It’s 1–1. Send a runner to the landing ring and use the other to pull a defender out of the six-yard box.';
 try{view=stadium($('pitch'))}catch{document.querySelector('.scene').append(board);board.classList.add('large-board');$('pitch').hidden=true}
 function drawBoard(state){
   const path=pts=>pts.map(v=>v.join(',')).join(' ');
   let art='<defs><pattern id="away-kit" patternUnits="userSpaceOnUse" width=".5" height="1"><rect width=".5" height="1" fill="#df3344"/><rect width=".18" height="1" fill="#ffbf22"/></pattern></defs><g fill="none" stroke="#92b6a370" stroke-width=".15"><path d="M-16 0H16V24H-16Z M-14 0V16.5H14V0 M-9 0V5.5H9V0 M-3.66 0V-1.6H3.66V0"/></g>';
   Match.wall.forEach(([x,z])=>art+='<circle cx="'+x+'" cy="'+z+'" r=".53" fill="url(#away-kit)"/>');
   const delivery=[];for(let k=0;k<=32;k++){const [x,,z]=Match.ball(plan,k/32);delivery.push([x,z])}
   art+='<polyline points="'+path(delivery)+'" fill="none" stroke="#ffc56c" stroke-width=".25" stroke-dasharray=".65 .55"/><circle cx="'+plan.target+'" cy="7" r="1.1" stroke="#ffcc68" stroke-width=".25" fill="none"/>';
   const marks=state?.marks??Match.sample(plan,result,0).marks;
   marks.forEach(([x,z])=>art+='<circle cx="'+x+'" cy="'+z+'" r=".62" fill="url(#away-kit)"/>');
   plan.routes.forEach((route,i)=>{const [x,z]=state?.bodies[i]??route[0],c=i?'#ffefa2':'#ffdc24';
     art+='<polyline points="'+path(route)+'" fill="none" stroke="'+c+'" stroke-width=".3"/><circle cx="'+x+'" cy="'+z+'" r="1.18" fill="'+c+'" stroke="'+(i===selected?'#fff4cd':'#2d6157')+'" stroke-width=".23"/><text x="'+x+'" y="'+(z+.48)+'" text-anchor="middle" fill="#153c33" font-family="monospace" font-weight="bold" font-size="1.35">'+(i?'7':'9')+'</text>';
   });
   const ball=state?.ball??Match.ball(plan,0);art+='<circle cx="'+ball[0]+'" cy="'+ball[2]+'" r=".45" fill="white"/><rect x="'+((state?.keeper??0)-.7)+'" y=".45" width="1.4" height=".8" fill="#72a4ff"/>';
   board.innerHTML=art;
 }
 function update(){
   result=Match.analyze(plan);time=0;mode='plan';$('flag').textContent='SET PIECE';$('score').textContent='1 – 1';$('clock').textContent='89:00';$('play').textContent='▶  Run the play';
   $('call').textContent=briefing;$('target-val').textContent=plan.target===0?'Centre':Math.abs(plan.target)+' m '+(plan.target<0?'left':'right');
   $('bend-val').textContent=plan.bend===0?'Straight':Math.abs(plan.bend)+' m '+(plan.bend<0?'left':'right');
   drawBoard();view?.plan(plan);
 }
 function setLocked(on){document.querySelectorAll('aside button, aside input').forEach(b=>b.disabled=on);board.setAttribute('aria-disabled',String(on))}
 function select(i){selected=i;$('nine').setAttribute('aria-pressed',!i);$('seven').setAttribute('aria-pressed',!!i);drawBoard()}
 $('nine').onclick=()=>select(0);$('seven').onclick=()=>select(1);
 for(const key of ['target','bend'])$(key).oninput=e=>{plan[key]=Number(e.target.value);update()};
 document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{const x=Number(b.dataset.route);plan.routes[selected]=[Match.start[selected].slice(),[x,7]];update()});
 function coord(e){const v=new DOMPoint(e.clientX,e.clientY).matrixTransform(board.getScreenCTM().inverse());return [Math.max(-15,Math.min(15,v.x)),Math.max(1,Math.min(24,v.y))]}
 board.onpointerdown=e=>{if(mode==='live'||pointer!==null)return;e.preventDefault();pointer=e.pointerId;board.setPointerCapture(pointer);stroke=[Match.start[selected].slice(),coord(e)];plan.routes[selected]=stroke;update()};
 board.onpointermove=e=>{if(e.pointerId!==pointer)return;const q=coord(e);if(Match.gap(stroke.at(-1),q)>.55){stroke.push(q);update()}};
 board.onlostpointercapture=()=>{pointer=null};
 $('play').onclick=()=>{if(mode==='live')return;pointer=null;time=0;last=performance.now();mode='live';$('score').textContent='1 – 1';$('flag').textContent='LIVE';$('call').textContent='The whistle goes. Watch the two runs.';setLocked(true);$('play').textContent='Ball in play…';
   if(innerWidth<740)document.querySelector('.broadcast').scrollIntoView({block:'start',behavior:'instant'});
 };
 function tick(now){
   const dt=Math.min(.08,(now-last)/1000);last=now;
   if(mode==='live'&&!document.hidden){
     time=Math.min(result.end,time+dt*.76);$('clock').textContent='89:0'+Math.floor(time);
     const state=Match.sample(plan,result,time);drawBoard(state);
     if(time>=result.end){
       mode='end';setLocked(false);$('flag').textContent=result.kind;$('call').textContent=result.reason;$('play').textContent='↻  Replay routine';
       if(result.kind==='GOAL'){
         $('score').textContent='2 – 1';
         const routine=JSON.stringify({routes:plan.routes,target:plan.target,bend:plan.bend,finish:result.shot});
         try{localStorage.setItem('enso.dec09.routine.v1',routine)}catch{}
         $('rematch').href='../return-leg/index.html#'+new URLSearchParams({routine});
         $('rematch').hidden=false;
       }
     }else if(time>Match.meet)$('call').textContent='A header from the edge of the six-yard box!';
     else if(time>Match.lead)$('call').textContent='The delivery is in the air…';
   }
   view?.draw(plan,result,time,mode,now/1000);requestAnimationFrame(tick);
 }
 select(0);update();requestAnimationFrame(tick);
})();
