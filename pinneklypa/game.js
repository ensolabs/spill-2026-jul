'use strict';
(()=>{
 const $=id=>document.getElementById(id),s=new Kitchen.Service(),keys=new Set();
 let canvas=$('scene'),view,pointer=null,previous=performance.now(),old='',moving=0,closed=false;
 function tabletop(c){
   const g=c.getContext('2d'),dims=()=>Math.min(c.clientWidth/12.3,c.clientHeight/6);
   return {point(e){const r=c.getBoundingClientRect();return [(e.clientX-r.left-r.width/2)/dims(),(e.clientY-r.top-r.height/2)/dims()]},draw(state,t){
     const w=c.clientWidth,h=c.clientHeight,d=Math.min(devicePixelRatio||1,2);if(c.width!==Math.round(w*d)||c.height!==Math.round(h*d)){c.width=Math.round(w*d);c.height=Math.round(h*d)}
     g.setTransform(d,0,0,d,0,0);g.fillStyle='#875c42';g.fillRect(0,0,w,h);g.translate(w/2,h/2);g.scale(dims(),dims());
     const ellipse=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()};
     g.fillStyle='#443d33';g.fillRect(-5.45,-2.4,5.05,4.8);
     const bx=Kitchen.bowl.x+(state.slide||0);ellipse(bx,0,2.17,2.17,'#923e2d');ellipse(bx,0,2.02,2.02,'#edcc9a');ellipse(bx,0,1.94,1.94,'#aa682e');
     for(let i=0;i<9;i++){g.strokeStyle='#deb070';g.lineWidth=.06;g.beginPath();g.arc(bx,0,.45+i*.13,i,i+3.7);g.stroke()}
     for(const f of state.items){g.save();g.translate(f.x+(f.placed?(state.slide||0):0),f.z-f.y*.08);g.rotate(f.angle+f.tilt*.34);g.scale(1+f.squash,1-f.squash+f.pitch*.12);if(f.id==='ribbe'){
       g.fillStyle='#9c5540';g.fillRect(-.94,-.46,1.88,.92);for(let j=0;j<3;j++){g.fillStyle=j%2?'#b77c52':'#efd29f';g.fillRect(-.94,-.3+j*.21,1.88,.14)}g.fillStyle='#73462a';g.fillRect(-.94,-.46,1.88,.14);
     }else if(f.id==='lotus'){ellipse(0,0,.66,.66,'#dfbd88');for(let j=0;j<7;j++){const a=j*2*Math.PI/7;ellipse(Math.cos(a)*.38,Math.sin(a)*.38,.105,.125,f.placed?'#aa682e':'#493f30')}}
     else if(f.id==='tofu'){g.fillStyle='#eee1bf';g.fillRect(-.53,-.53,1.06,1.06)}else ellipse(0,0,.48,.37,'#edcea0');g.restore()}
     g.save();g.translate(state.x,state.z);g.rotate(state.angle);for(const sign of [-1,1]){g.strokeStyle='#cf9259';g.lineWidth=.11;g.beginPath();g.moveTo(sign*state.gap,0);g.lineTo(sign*.3+.5,3.4);g.stroke()}g.restore();
   }};
 }
 try{view=kitchenView(canvas)}catch{const replacement=canvas.cloneNode();canvas.replaceWith(replacement);canvas=replacement;view=tabletop(canvas)}
 function update(){
   const order=Kitchen.orders[s.order];$('ticket').textContent='ORDER '+String(s.order+1).padStart(2,'0')+' / 03';$('order').textContent=closed?'Counter closed':order.name;
   $('list').replaceChildren(...order.items.map(id=>{const li=document.createElement('li'),f=s.items.find(x=>x.id===id);li.textContent=f.name;li.className=f.placed?'done':'';return li}));
   $('light').setAttribute('aria-pressed',!s.firm);$('firm').setAttribute('aria-pressed',s.firm);
   $('serve').hidden=!s.complete||!!moving;$('serve').textContent=closed?'Open a new service ↻':'Serve bowl →';
   for(const id of ['light','firm','left','right'])$(id).disabled=s.down||s.complete||!!moving;
 }
 function pressure(firm){if(s.down||s.complete)return;s.firm=firm;update()}
 $('light').onclick=()=>pressure(false);$('firm').onclick=()=>pressure(true);
 function rotate(sign){if(!s.down&&!s.complete)s.angle+=sign*Math.PI/12}
 $('left').onclick=()=>rotate(-1);$('right').onclick=()=>rotate(1);
 $('serve').onclick=()=>{
   if(closed){closed=false;s.order=0;s.load();s.slide=0;update();return}
   moving=.85;s.message='Bowl on its way.';update();
 };
 function begin(){if(moving||closed||s.down)return;s.begin();update()}
 function drop(){s.release();update()}
 function aim(e){s.aim(...view.point(e))}
 canvas.onpointerdown=e=>{if(pointer!==null||e.button!==0||s.down)return;e.preventDefault();canvas.focus({preventScroll:true});pointer=e.pointerId;canvas.setPointerCapture(pointer);aim(e);begin()};
 canvas.onpointermove=e=>{if(pointer===null||e.pointerId===pointer)aim(e)};
 canvas.onpointerup=e=>{if(e.pointerId===pointer){aim(e);pointer=null;drop()}};
 canvas.onlostpointercapture=e=>{if(e.pointerId===pointer){pointer=null;drop()}};
 canvas.onkeydown=e=>{if(!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','KeyQ','KeyE','KeyF'].includes(e.code))return;e.preventDefault();keys.add(e.code);if(e.repeat)return;
   if(e.code==='Space')begin();if(e.code==='KeyQ')rotate(-1);if(e.code==='KeyE')rotate(1);if(e.code==='KeyF')pressure(!s.firm)};
 canvas.onkeyup=e=>{keys.delete(e.code);if(e.code==='Space'&&pointer===null){e.preventDefault();drop()}};
 canvas.onblur=()=>{keys.clear();if(s.down)drop()};
 function frame(now){
   const dt=document.hidden?0:Math.min(.07,(now-previous)/1000);previous=now;
   if(moving){moving=Math.max(0,moving-dt);s.slide=(1-moving/.85)**2*10;if(!moving){if(s.order===2){closed=true;s.message='Three bowls served. The last customer heads out into the snow.'}else{s.order++;s.load();s.slide=0}update()}}
   const pace=keys.has('ShiftLeft')||keys.has('ShiftRight')?11:4;
   const plated=s.served;
   s.aim(s.x+(Number((keys.has('ArrowRight')||keys.has('KeyD')))-Number((keys.has('ArrowLeft')||keys.has('KeyA'))))*dt*pace,s.z+(Number((keys.has('ArrowDown')||keys.has('KeyS')))-Number((keys.has('ArrowUp')||keys.has('KeyW'))))*dt*pace);
   s.tick(dt);if(s.served!==plated)update();view.draw(s,now/1000);if(old!==s.message){$('msg').textContent=old=s.message}requestAnimationFrame(frame);
 }
 update();requestAnimationFrame(frame);
})();
