'use strict';
const $=id=>document.getElementById(id);
const cutters=[
 {name:'Block',points:'-25,-25 25,-25 25,25 -25,25',tip:'A square footing with four flat sides.'},
 {name:'Beam',points:'-50,-12 50,-12 50,12 -50,12',tip:'Bridge a gap or rotate upright for height.'},
 {name:'Wedge',points:'-44,-27 44,27 -44,27',tip:'Pair the slopes or use one as a ramp.'},
 {name:'Keystone',points:'-20,-30 20,-30 38,30 -38,30',tip:'A broad base with a narrow landing on top.'},
 {name:'Wheel',points:Array.from({length:24},(_,i)=>{
   const angle=i*Math.PI/12;
   return [Math.round(28*Math.cos(angle)),Math.round(28*Math.sin(angle))].join(',');
 }).join(' '),tip:'It rolls. Brace it or catch it between two slopes.'}
];
const cutterScale=1.65;
const types=cutters.map(c=>c.name);
const outlines=cutters.map(c=>c.points.split(' ').map(pair=>pair.split(',').map(n=>Number(n)*cutterScale)));
const shapes=outlines.map(poly=>poly.map(pair=>pair.join(',')).join(' '));
let cursor={x:340,y:210},angle=0,cutPointer=null,sheetArea=0;
let phase='cut',tool=0,cuts=[],started=0,bake='',timer;
const txt=(x,y,s,size=13,color='#fff6df')=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="'+size+'" fill="'+color+'">'+s+'</text>';
const random=n=>{const x=Math.sin(n*43.71)*1327;return x-Math.floor(x)};
const specks=(x,y,w,h,n,color)=>Array.from({length:n},(_,i)=>'<circle cx="'+(x+random(i)*w)+'" cy="'+(y+random(i+200)*h)+'" r="'+(.4+random(i+400)*1.5)+'" fill="'+color+'"/>').join('');
const sheet='M102 92 Q146 74 242 85 Q381 70 513 89 Q583 92 590 137 Q605 234 581 300 Q577 338 513 341 Q355 354 244 341 Q165 354 104 330 Q68 320 80 271 Q62 189 76 131 Q79 102 102 92Z';
const defs='<defs><pattern id="crumb" width="45" height="47" patternUnits="userSpaceOnUse">'+specks(0,0,45,47,32,'#78371848')+specks(0,0,45,47,15,'#ffe2a357')+'</pattern><linearGradient id="dough" x2=".7" y2="1"><stop stop-color="#edb376"/><stop offset=".6" stop-color="#da965e"/><stop offset="1" stop-color="#bf7848"/></linearGradient><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#ffffff0e"/></pattern><filter id="shadow"><feDropShadow dx="1" dy="5" stdDeviation="3" flood-opacity=".28"/></filter></defs>';
function background(){
  return defs+'<rect width="680" height="450" fill="#315348"/><rect width="680" height="450" fill="url(#grid)"/>'+specks(10,26,650,380,550,'#f5e2b85c')+
    '<g transform="translate(535,42) rotate(15)" filter="url(#shadow)"><rect x="-115" y="-6" width="226" height="12" rx="6" fill="#b4764c"/><rect x="-78" y="-17" width="150" height="34" rx="10" fill="#d9a370"/><path d="M-69 -10h131 M-65 7h122" stroke="#eab880" stroke-width="2"/></g>'+
    '<g transform="translate(45,363) rotate(-28)" fill="none" stroke="#b6bcb0" stroke-width="5"><path d="m0 -17 6 10 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2Z"/></g>';
}
const pose=c=>'translate('+c.x+' '+c.y+') rotate('+c.angle+')';
function footprint(type,x,y,deg){
 const rad=deg*Math.PI/180,cs=Math.cos(rad),sn=Math.sin(rad);
 return outlines[type].map(([a,b])=>[x+a*cs-b*sn,y+a*sn+b*cs]);
}
function area(poly){
 return Math.abs(poly.reduce((sum,[x,y],i)=>{const [a,b]=poly[(i+1)%poly.length];return sum+x*b-y*a},0))/2;
}
// All cutters are convex. A shared edge is a valid cut; interiors must be disjoint.
function overlap(a,b){
 for(const poly of [a,b])for(let i=0;i<poly.length;i++){
   const [x,y]=poly[i],[u,v]=poly[(i+1)%poly.length],dx=y-v,dy=u-x;
   const proj=p=>p.map(([px,py])=>px*dx+py*dy),A=proj(a),B=proj(b);
   if(Math.max(...A)<=Math.min(...B)+1e-6||Math.max(...B)<=Math.min(...A)+1e-6)return false;
 }
 return true;
}
function cutScene(){
 return background()+'<mask id="uncut" maskUnits="userSpaceOnUse" x="0" y="0" width="680" height="450"><rect width="680" height="450" fill="white"/><g id="holes"></g></mask>'+
  '<g mask="url(#uncut)"><path id="sheet" d="'+sheet+'" fill="url(#dough)" stroke="#ba784c" stroke-width="3"/><path d="'+sheet+'" fill="url(#crumb)"/></g>'+
  '<g id="rim"></g><g id="cutter" pointer-events="none"><polygon id="ghost" stroke-width="3" stroke-linejoin="round"/><text id="mark" text-anchor="middle" font-size="14" font-family="monospace" font-weight="bold"></text></g>'+txt(340,398,'ROLLED SPICE DOUGH   /   6 mm',12);
}
function fit(poly){
 const dough=$('sheet');
 // Check straight edges too: the rolled edge of the sheet curves inward in places.
 for(let i=0;i<poly.length;i++){
   const [x,y]=poly[i],[a,b]=poly[(i+1)%poly.length],n=Math.ceil(Math.hypot(x-a,y-b)/3);
   for(let j=0;j<n;j++)if(!dough.isPointInFill(new DOMPoint(x+(a-x)*j/n,y+(b-y)*j/n)))return 'Edge';
 }
 return cuts.some(c=>overlap(c.poly,poly))?'Overlap':'';
}
function preview(){
 const poly=footprint(tool,cursor.x,cursor.y,angle),reason=fit(poly),ghost=$('ghost');
 $('cutter').setAttribute('transform',pose({...cursor,angle}));
 ghost.setAttribute('points',shapes[tool]);ghost.setAttribute('fill',reason?'#be422c40':'#f7ffdb55');
 ghost.setAttribute('stroke',reason?'#a13221':'#2d5945');
 $('mark').textContent=reason?'×':'+';$('mark').setAttribute('fill',reason?'#802b20':'#254935');
 $('mark').setAttribute('x',tool===2?-17:0);$('mark').setAttribute('y',tool===2?17:4);
 return {poly,reason};
}
function inventory(){
 const polygon=c=>'<polygon points="'+shapes[c.type]+'" transform="'+pose(c)+'"/>';
 $('holes').innerHTML=cuts.map(polygon).join('');
 $('rim').innerHTML='<g fill="none" stroke="#875830" stroke-width="1.7">'+cuts.map(polygon).join('')+'</g>';
 if(!sheetArea){const path=$('sheet'),length=path.getTotalLength();
   sheetArea=area(Array.from({length:400},(_,i)=>{const p=path.getPointAtLength(length*i/400);return [p.x,p.y]}))}
 const used=Math.round(100*cuts.reduce((sum,c)=>sum+area(c.poly),0)/sheetArea);
 $('yield').textContent=cuts.length+' pieces · '+used+'% of sheet cut';
 $('undo').disabled=$('action').disabled=!cuts.length;
 $('rotation').textContent=angle+'°';preview()
}
function stamp(){
 const {poly,reason}=preview();
 if(reason){note(reason==='Edge'?'Part of the cutter is outside the dough.':'That would overlap a hole. Try turning the cutter.');return}
 cuts.push({...cursor,type:tool,angle,poly});inventory();note(types[tool]+' added to the tray.')
}
function turnCutter(amount){angle=(angle+amount+360)%360;$('rotation').textContent=angle+'°';preview()}
function ovenScene(){
 let art=background()+'<rect x="71" y="70" width="538" height="292" rx="27" fill="#636662" stroke="#aba99b" stroke-width="7"/><rect x="85" y="83" width="510" height="264" rx="18" fill="#e4cfa9"/>';
 const heat=Math.min(1,(Date.now()-started)/18000);
 cuts.forEach(c=>{const color='hsl(27, '+(55+heat*10)+'%, '+(67-heat*34)+'%)';
 art+='<g transform="translate(340 215) scale(.90) translate(-340 -215) '+pose(c)+'"><polygon points="'+shapes[c.type]+'" fill="'+color+'" stroke="#ad754a" stroke-width="2"/><polygon points="'+shapes[c.type]+'" fill="url(#crumb)"/></g>'});
 return art+txt(340,398,'OVEN   /   180°C',13);
}
function note(message){$('status').textContent=message}
function draw(){ $('art').innerHTML=phase==='cut'?cutScene():ovenScene() }
function updateStage(stage){
 document.querySelectorAll('nav b').forEach((b,i)=>b.classList.toggle('on',i===stage));
}
function render(){
 const cutting=phase==='cut';updateStage(cutting?0:1);
 $('art').setAttribute('viewBox','0 0 680 450');
 $('title').textContent=cutting?'Cut the dough':'Mind the oven';
 $('hint').textContent=cutting?'Build the tallest tower that stands on its own. Choose a cutter, then click the dough to cut. On touch, drag to position it and release to stamp. Fit the edges together to get more pieces.':'Pull the tray when the needle reaches the green band for a golden bake.';
 $('tools').innerHTML=cutting?'<div class="choices">'+types.map((name,i)=>'<button data-type="'+i+'" aria-pressed="'+(tool===i)+'" class="'+(tool===i?'selected':'')+'"><svg viewBox="-53 -36 106 74" aria-hidden="true"><polygon points="'+cutters[i].points+'" fill="#d69a63" stroke="#925936" stroke-width="4"/></svg>'+name+'</button>').join('')+'</div><div class="cut-controls"><button data-turn="-15" aria-label="Rotate left">↶ 15°</button><b id="rotation"></b><button data-turn="15" aria-label="Rotate right">↷ 15°</button><button id="undo">Undo last cut</button></div><strong id="yield"></strong><details class="cut-keys"><summary>Keyboard controls</summary>Focus the dough. WASD or arrows move, Shift makes fine adjustments, Q / E rotate, and Space cuts.</details>':'<div class="meter"><i id="needle"></i></div>';
 $('again').hidden=true;$('action').disabled=cutting&&!cuts.length;
 $('action').textContent=cutting?'Bake this batch →':'Take out tray';draw();
 $('art').classList.toggle('cutting',cutting);$('art').setAttribute('tabindex',cutting?'0':'-1');
 if(cutting){inventory();note(cutters[tool].tip)}
}
function pull(){
 clearInterval(timer);const t=(Date.now()-started)/18000;
 bake=t<.4?'Pale':t<=.72?'Golden':'Dark';startTower();
}
const surface=$('art');
function aimCutter(e){
 const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(surface.getScreenCTM().inverse());
 cursor={x:p.x,y:p.y};preview()
}
surface.addEventListener('pointerdown',e=>{
 if(phase!=='cut'||e.button!==0||cutPointer!==null)return;
 e.preventDefault();surface.focus({preventScroll:true});cutPointer=e.pointerId;surface.setPointerCapture(e.pointerId);aimCutter(e)
});
surface.addEventListener('pointermove',e=>{
 if(phase==='cut'&&(e.pointerId===cutPointer||cutPointer===null&&e.pointerType==='mouse'))aimCutter(e)
});
surface.addEventListener('pointerup',e=>{
 if(phase==='cut'&&cutPointer===e.pointerId){aimCutter(e);cutPointer=null;stamp()}
});
surface.addEventListener('lostpointercapture',()=>{cutPointer=null});
surface.addEventListener('keydown',e=>{
 if(phase!=='cut'||e.ctrlKey||e.altKey||e.metaKey)return;
 const dir={ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0],ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1]}[e.code];
 if(dir){e.preventDefault();const n=e.shiftKey?1:6;cursor.x=Math.max(0,Math.min(680,cursor.x+dir[0]*n));cursor.y=Math.max(0,Math.min(450,cursor.y+dir[1]*n));preview()}
 else if(['KeyQ','KeyE','KeyR','Enter','Space'].includes(e.code)){
   e.preventDefault();if(e.repeat)return;if(e.code==='Space'||e.code==='Enter')stamp();else turnCutter(e.code==='KeyQ'?-15:15)
 }
});
$('tools').addEventListener('click',e=>{
 if(phase!=='cut')return;const b=e.target.closest('button');if(!b)return;
 if(b.dataset.type!==undefined){
   tool=Number(b.dataset.type);for(const btn of $('tools').querySelectorAll('[data-type]')){const active=+btn.dataset.type===tool;btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active))}
   note(cutters[tool].tip);preview()
 }else if(b.dataset.turn)turnCutter(+b.dataset.turn);
 else if(b.id==='undo'){cuts.pop();inventory();note('Last cut returned to the dough.')}
});
$('again').onclick=()=>{if(phase==='done'||confirm('Rebuild with the same baked pieces?'))startTower()};
$('action').onclick=()=>{
 if(phase==='cut'){phase='bake';started=Date.now();render();note('The tray is heating. Watch the needle.');timer=setInterval(()=>{let t=(Date.now()-started)/18000;if(t>=1)return pull();$('needle').style.left=t*100+'%';draw()},120)}
 else if(phase==='bake')pull();
 else if(phase==='build')measureTower();
 else if(phase==='done'){phase='cut';tool=angle=0;cursor={x:340,y:210};cuts=[];render()}
};
render();
