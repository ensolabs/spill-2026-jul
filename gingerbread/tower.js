'use strict';
const {Engine,Bodies,Body,Composite,Constraint,Query,Vector}=Matter;
const floorY=380,step=1000/60;
const forms=shapes.map(shape=>shape.split(' ').map(pair=>{const [x,y]=pair.split(',').map(Number);return {x,y}}));
let engine,ground,panels,seams,tray,stock,focus,held,drag,pointer,view,clock,previous,accumulator,frame,quiet,measuring;
let record=0;
try{record=Number(localStorage.getItem('enso.tower.cm'))||0}catch{}
function startTower(){
 cancelAnimationFrame(frame);if(engine)Engine.clear(engine);
 phase='build';engine=Engine.create({positionIterations:10,velocityIterations:8,constraintIterations:5});
 ground=Bodies.rectangle(340,floorY+25,600,50,{isStatic:true,friction:1});
 Composite.add(engine.world,ground);panels=[];seams=[];tray=types.map((_,i)=>cuts.filter(c=>c.type===i).length);
 stock={icing:6,sugar:4};focus=held=drag=pointer=null;view=1;clock=quiet=measuring=accumulator=0;previous=performance.now();
 updateStage(2);$('title').textContent='Stack for height';
 $('hint').textContent='Take a piece from the tray and drag it into place. Hold one piece steady while you move another. Join touching edges, then release the tower to measure it.';
 $('action').textContent='Release & measure →';$('again').hidden=false;$('art').classList.add('tower');
 $('art').innerHTML=defs+'<g id="board"></g><g id="biscuits"></g><g id="marks" pointer-events="none"></g>';
 controls();note(bake+' bake. Choose your first piece from the tray.');paint();frame=requestAnimationFrame(loop);
}
function controls(){
 $('tools').innerHTML='<div class="readout"><strong id="height">0 cm</strong><span>BEST '+record+' cm</span></div><label>BAKED PIECES</label><div class="choices">'+types.map((name,i)=>'<button data-add="'+i+'" '+(!tray[i]?'disabled':'')+'>'+name+'<span class="count">× '+tray[i]+'</span></button>').join('')+'</div><div class="tower-controls"><button data-do="hold">'+(held===focus&&held?'Release hand':held?'Move hand here':'Hold steady')+'</button><button data-do="turn">Rotate 15°</button></div><label>JOIN SELECTED PIECE</label><div class="tower-controls"><button data-do="icing">Icing · '+stock.icing+'</button><button data-do="sugar">Sugar · '+stock.sugar+'</button><button data-do="peel">Peel seam</button></div>';
 $('action').disabled=!panels.length;
}
function spawn(i){
 if(!tray[i])return;
 const lanes=[120,555,225,450,340].map(x=>({x,y:Math.min(floorY-56,...panels.filter(b=>b.bounds.min.x<x+50&&b.bounds.max.x>x-50).map(b=>b.bounds.min.y-50))}));
 const entry=lanes.reduce((best,next)=>next.y>best.y?next:best);
 const body=Bodies.fromVertices(entry.x,entry.y,[forms[i].map(v=>({...v}))],{friction:.85,frictionStatic:2,restitution:.03,frictionAir:.025,density:.0014});
 body.kind=i;tray[i]--;panels.push(body);Composite.add(engine.world,body);focus=body;controls();note(types[i]+' selected. Drag to position it.');
}
function endDrag(){if(drag)Composite.remove(engine.world,drag);drag=null;pointer=null}
function releaseHand(){if(held)Body.setStatic(held,false);held=null}
function point(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform($('art').getScreenCTM().inverse())}
$('art').addEventListener('pointerdown',e=>{
 if(phase!=='build'||pointer!==null)return;const p=point(e),b=Query.point(panels,p).pop();if(!b)return;
 focus=b;controls();if(b===held){note('The hand is holding this piece. Release it to drag it again.');return}
 pointer=e.pointerId;$('art').setPointerCapture(pointer);
 drag=Constraint.create({bodyA:b,pointA:{x:0,y:0},pointB:{x:p.x,y:p.y},length:0,stiffness:.16,damping:.24});
 Composite.add(engine.world,drag);
});
$('art').addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==pointer)return;const p=point(e);drag.pointB={x:Math.max(44,Math.min(636,p.x)),y:Math.min(floorY-5,p.y)};
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('art').addEventListener(event,e=>{if(e.pointerId===pointer)endDrag()});
// Closest points on polygon edges also catch a piece resting just outside the contact tolerance.
function contact(a,b){
 let closest={distance:Infinity};
 for(const [u,v] of [[a,b],[b,a]])for(const p of u.vertices)for(let i=0;i<v.vertices.length;i++){
   const s=v.vertices[i],edge=Vector.sub(v.vertices[(i+1)%v.vertices.length],s);
   const t=Math.max(0,Math.min(1,Vector.dot(Vector.sub(p,s),edge)/Vector.dot(edge,edge)));
   const q=Vector.add(s,Vector.mult(edge,t)),distance=Vector.magnitude(Vector.sub(q,p));
   if(distance<closest.distance)closest={distance,point:Vector.mult(Vector.add(p,q),.5)};
 }
 return closest;
}
function join(kind){
 if(!stock[kind])return note('No '+kind+' portions left.');
 let best;
 for(const b of panels){if(b===focus||seams.some(s=>s.pair.includes(focus)&&s.pair.includes(b)))continue;
   const hit=contact(focus,b);if(hit.distance<7&&(!best||hit.distance<best.distance))best={...hit,b};
 }
 if(!best)return note('Bring two unjoined edges together first.');
 const pair=[focus,best.b],links=[-6,6].map(dx=>{
   const anchor={x:best.point.x+dx,y:best.point.y};
   return Constraint.create({bodyA:focus,bodyB:best.b,pointA:Vector.sub(anchor,focus.position),pointB:Vector.sub(anchor,best.b.position),length:0,stiffness:.008,damping:.12});
 });
 seams.push({kind,pair,links,start:clock});Composite.add(engine.world,links);stock[kind]--;controls();
 note(kind==='icing'?'Icing applied. Hold steady for 3 seconds.':'Sugar applied. Sets permanently in 0.9 seconds.');
}
function removeSeam(s){for(const link of s.links)Composite.remove(engine.world,link);seams.splice(seams.indexOf(s),1)}
$('tools').addEventListener('click',e=>{
 if(phase!=='build')return;const b=e.target.closest('button');if(!b)return;
 if(b.dataset.add!==undefined)return spawn(Number(b.dataset.add));
 if(!focus)return note('Choose a piece on the board first.');
 switch(b.dataset.do){
 case 'hold':{const old=held;endDrag();releaseHand();if(old!==focus){held=focus;Body.setStatic(held,true)}controls();note(held?'One hand is holding this piece. Select or drag another.':'Hand released.');break}
 case 'turn':Body.rotate(focus,Math.PI/12);Body.setAngularVelocity(focus,0);break;
 case 'icing':case 'sugar':join(b.dataset.do);break;
 case 'peel':{const s=seams.slice().reverse().find(s=>s.pair.includes(focus)&&(s.kind==='icing'||clock-s.start<900));if(!s)return note('No removable seam on this piece.');stock[s.kind]++;removeSeam(s);controls();note('Seam lifted. One portion returned.');break}
 }
});
function updateSeams(){
 for(const s of seams.slice()){
   const icing=s.kind==='icing',cure=Math.min(1,(clock-s.start)/(icing?3000:900));
   for(const link of s.links)link.stiffness=.008+cure*(icing?.14:.82);
   if(icing&&s.links.some(link=>Constraint.currentLength(link)>12)){removeSeam(s);note('An icing seam pulled apart under load.')}
 }
}
function grounded(){
 const connected=new Set([ground]),edges=engine.pairs.list.filter(p=>p.isActive).map(p=>[p.bodyA.parent,p.bodyB.parent]);
 // Persistent glue joints can support a cantilever beyond the direct collision surface.
 edges.push(...seams.map(s=>s.pair));
 let changed=true;while(changed){changed=false;for(const [a,b] of edges)if(connected.has(a)!==connected.has(b)){connected.add(a);connected.add(b);changed=true}}
 return panels.filter(b=>connected.has(b));
}
function height(bodies){return Math.max(0,...bodies.map(b=>Math.round((floorY-Math.min(...b.vertices.map(v=>v.y)))/5)))}
let restingPose=new Map();
function measureTower(){
 endDrag();releaseHand();phase='measure';restingPose.clear();quiet=measuring=0;$('action').disabled=true;$('again').hidden=true;
 $('tools').innerHTML='<div class="readout"><strong id="height"></strong> HANDS OFF</div>';note('Checking for 2 seconds of freestanding balance…');
}
function tick(){
 clock+=step;updateSeams();Engine.update(engine,step);
 for(const b of panels.slice())if(b.position.y>floorY+450||Math.abs(b.position.x-340)>760){
   for(const s of seams.slice())if(s.pair.includes(b))removeSeam(s);
   if(b===focus)focus=null;if(b===held)releaseHand();if(drag?.bodyA===b)endDrag();
   panels.splice(panels.indexOf(b),1);Composite.remove(engine.world,b);tray[b.kind]++;
   if(phase==='build'){controls();note('Fallen piece returned to the tray.')}
 }
 if(phase==='measure'){
   measuring+=step;
   // Compare poses over the whole settling window so tiny solver vibrations do not reset it.
   const still=panels.every(b=>{
     const p=restingPose.get(b);
     return p&&Math.hypot(b.position.x-p.x,b.position.y-p.y)<2&&Math.abs(b.angle-p.angle)<.035;
   });
   if(still)quiet+=step;
   else{quiet=0;restingPose=new Map(panels.map(b=>[b,{...b.position,angle:b.angle}]))}
   if(quiet>=2000){const score=height(grounded());record=Math.max(record,score);try{localStorage.setItem('enso.tower.cm',record)}catch{}
     phase='done';$('title').textContent=score+' cm standing';$('hint').textContent='Measured from the board to the highest supported edge after the tower settled.';
     $('tools').innerHTML='<div class="readout"><strong>'+score+' cm</strong><span>BEST '+record+' cm</span></div>';
     $('action').textContent='Start a fresh batch';$('action').disabled=false;$('again').hidden=false;$('art').classList.remove('tower');note(bake+' bake · '+panels.length+' pieces on the board');
   }else if(measuring>15000){phase='build';controls();$('again').hidden=false;note('The tower is still moving. Adjust its balance and measure again.')}
 }
}
function paint(){
 const top=Math.min(floorY-235,...panels.map(b=>b.bounds.min.y));
 const target=Math.max(1,(floorY-top+105)/410);
 view+=(target-view)*.07;const width=680*view,h=450*view,left=340-width/2,topY=floorY+62*view-h;
 $('art').setAttribute('viewBox',[left,topY,width,h].join(' '));
 let grid='';for(let y=floorY;y>topY;y-=50){grid+=lineMark(left,y,left+width,y,'#ffffff18',1)+txt(left+28*view,y-4,Math.round((floorY-y)/5)+' cm',10*view,'#beccba')}
 $('board').innerHTML='<rect x="'+left+'" y="'+topY+'" width="'+width+'" height="'+h+'" fill="#315348"/>'+grid+'<rect x="40" y="'+floorY+'" width="600" height="20" rx="3" fill="#be946c"/>'+lineMark(43,floorY,637,floorY,'#eee0bc',4);
 $('biscuits').innerHTML=panels.map(b=>{const points=b.vertices.map(v=>v.x+','+v.y).join(' '),fill={Golden:'#cf925b',Pale:'#deb681',Dark:'#9f6843'}[bake];
 return '<polygon points="'+points+'" fill="'+fill+'" stroke="'+(b===held?'#a4f6cd':b===focus?'#ffdf94':'#976038')+'" stroke-width="3"/><polygon points="'+points+'" fill="url(#crumb)"/>'+ (held===b?txt(b.position.x,b.position.y+4,'HELD',10,'#3e4b38'):'')}).join('');
 $('marks').innerHTML=seams.map(s=>{const p=Constraint.pointAWorld(s.links[0]);return '<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="'+(s.kind==='icing'?'#fff7df':'#edaf45')+'"/>'}).join('');
 if($('height'))$('height').textContent=height(grounded())+' cm';
}
function lineMark(x,y,a,b,color,w){return '<path d="M'+x+' '+y+' L'+a+' '+b+'" stroke="'+color+'" stroke-width="'+w+'"/>'}
function loop(now){
 accumulator+=Math.min(80,now-previous);previous=now;
 while(accumulator>=step&&phase!=='done'){tick();accumulator-=step}
 paint();if(phase==='build'||phase==='measure')frame=requestAnimationFrame(loop);
}
