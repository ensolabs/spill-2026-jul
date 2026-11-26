'use strict';
const $ = id => document.getElementById(id);
const canvas = $('scene'), ctx = canvas.getContext('2d');
const stances = [
  {guard:'high', strike:'sweep'}, {guard:'low', strike:'jab'},
  {guard:'high', strike:'jab'}, {guard:'low', strike:'sweep'}
];
const zones = {
  legs: {guard:'low', height:-10},
  mid: {guard:'low', height:-20},
  body: {guard:'high', height:-31},
  face: {guard:'high', height:-43}
};
const strikes = {
  kick: {target:'legs', power:'fast', aimed:true},
  punch: {target:'body', power:'fast', aimed:true},
  sweep: {target:'legs', power:'fast'},
  uppercut: {target:'face', power:'hard'}
};
let poseTarget='body';
let health, enemy, gap, turn, busy, pose, counter, impact, poseTime, ended;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function reset(){
  health=enemy=100; gap=4; turn=0; busy=ended=false; pose=counter='idle'; impact='';
  $('reset').hidden=true; $('run').disabled=false; $('code').disabled=false; $('code').value='';
  $('log').textContent='Type the opening combo shown above and press Enter.'; update();
}
function update(){
  $('hp').value=health; $('cpu').value=enemy;
  $('turn').textContent='TURN '+String(turn+1).padStart(2,'0');
  const s=stances[turn%4];
  $('state').textContent=ended?'●  ROUND OVER':busy?'●  EXECUTING':'●  AWAITING INPUT';
  $('intent').textContent=ended?(enemy===0?'Round won. The dojo is yours.':'Round lost. Frostbyte takes the match.'):
    'Frostbyte guards '+s.guard+' and readies a '+s.strike+'.  Gap · '+gap+' tiles';
}
function parse(line){
  const parts=line.trim().replace(/;$/,'').split('.');
  if(parts.length>3)throw Error('A turn fits three calls. Split this combo across two turns.');
  return parts.map(part=>{
    const m=/^\s*([a-z]+)\s*\(\s*([^()]*)\s*\)\s*$/.exec(part);
    if(!m)throw Error('Use a function call, such as kick(legs, fast).');
    const name=m[1],args=m[2].trim()?m[2].split(',').map(v=>v.trim()):[];
    const secret=name==='hadouken'?'hadooken':name;
    if(['hadooken','shoryuken','freezeframe'].includes(secret)){
      if(args.length)throw Error(secret+'() takes no arguments.');
      return {name:secret};
    }
    if(name==='block'&&!args.length)return {name};
    if(name==='move'&&args.length===1&&['left','right'].includes(args[0]))return {name,direction:args[0]};
    if(name==='jump'&&args.length===1&&['forward','back'].includes(args[0]))return {name,direction:args[0]};
    if(Object.hasOwn(strikes,name)){
      const strike=strikes[name];
      const [target=strike.target,power=strike.power]=args;
      if(args.length>2 || !['fast','hard'].includes(power))
        throw Error('Use fast or hard as the optional second argument.');
      if(!Object.hasOwn(zones,target) || (!strike.aimed && target!==strike.target))
        throw Error(name+' targets '+(strike.aimed?'legs, mid, body or face':strike.target)+'.');
      return {name,target,power};
    }
    throw Error('Unknown move or arguments. Open Move reference for valid calls.');
  });
}
async function execute(event){
  event.preventDefault(); if(busy||ended)return;
  let moves; try{moves=parse($('code').value)}catch(e){$('log').textContent=e.message;return}
  busy=true; $('run').disabled=true; $('code').readOnly=true; update();
  let airborne=false,braced=false,frozen=false,attacks=0,report=[];const s=stances[turn%4];
  for(const m of moves){
    pose=m.name; poseTarget=m.target; poseTime=performance.now(); impact='';
    if(m.name==='hadooken'||m.name==='shoryuken'){
      const rising=m.name==='shoryuken';
      if(rising){gap=Math.max(1,gap-2);airborne=true}
      await delay(420);
      if(rising&&gap>2){impact='MISS';report.push('Rising uppercut fell short')}
      else{
        const damage=Math.round((rising?36:28)*(attacks++?.5:1));
        enemy=Math.max(0,enemy-damage);$('cpu').value=enemy;
        impact='−'+damage;report.push((rising?'Rising uppercut':'Fireball')+' dealt '+damage);
      }
    }else if(m.name==='freezeframe'){
      frozen=true;impact='FROZEN';report.push('Frostbyte frozen for this turn')
    }else if(m.name==='jump'||m.name==='move'){
      let toward=['right','forward'].includes(m.direction);
      gap=Math.max(1,Math.min(6,gap+(toward?-1:1)*(m.name==='jump'?2:1)));
      if(m.name==='jump')airborne=true;
    }else if(m.name==='block')braced=true;
    else if(gap>2){impact='MISS';report.push('Out of range')}
    else{
      const guarded=s.guard===zones[m.target].guard;
      let damage=m.power==='hard'?18:12;
      if(m.power==='hard'&&s.strike==='jab')damage-=7;
      damage=Math.max(1,Math.round(damage*(guarded?.22:1)*(attacks++?.5:1)));
      enemy=Math.max(0,enemy-damage);impact=guarded?'GUARDED':'−'+damage;
      report.push(m.name+' ('+m.target+') dealt '+damage);$('cpu').value=enemy;
    }
    await delay(340);if(enemy===0)break;
  }
  pose='idle';impact='';
  if(enemy>0&&!frozen){
    counter=s.strike;poseTime=performance.now();
    if(gap>2){gap--;report.push('Frostbyte stepped closer')}
    else if(braced||airborne&&s.strike==='sweep'){impact=braced?'BLOCK':'EVADE';report.push('Counter avoided')}
    else{const damage=s.strike==='jab'?15:20;health=Math.max(0,health-damage);impact='−'+damage;report.push('Counter dealt '+damage);$('hp').value=health}
    await delay(410);
  }
  counter='idle';impact='';busy=false;ended=!health||!enemy;if(!ended)turn++;
  $('code').readOnly=false;$('code').disabled=ended;$('run').disabled=ended;$('reset').hidden=!ended;
  $('log').textContent=report.join(' · ');update();
  if(ended)$('reset').focus();else{$('code').focus();$('code').select()}
}
$('form').onsubmit=execute;$('reset').onclick=()=>{reset();$('code').focus()};
$('help').onclick=()=>$('manual').showModal();$('close').onclick=()=>$('manual').close();
function box(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function shape(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.closePath();ctx.fill()}
function hash(n){const v=Math.sin(n*127.1+3)*43758;return v-Math.floor(v)}
let W;const H=230;
function resize(){W=Math.round(H*canvas.clientWidth/canvas.clientHeight);canvas.width=W;canvas.height=H}
new ResizeObserver(resize).observe(canvas);resize();
function scenery(t){
  let grad=ctx.createLinearGradient(0,0,0,185);grad.addColorStop(0,'#182238');grad.addColorStop(.6,'#536781');grad.addColorStop(1,'#d2a8a5');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  for(let i=0;i<67;i++)box(hash(i)*W,hash(i+100)*119,1,1,'#c2d0cc');
  for(let y=-19;y<=19;y++){const r=Math.sqrt(361-y*y);box(W*.76-r,61+y,2*r,1,'#ffe3ae')}
  for(let layer=0;layer<2;layer++){
    const step=51+layer*17;
    for(let i=-1;i<W/step+1;i++){let x=i*step,peak=x+step*.57,y=78+layer*23+hash(i+layer*40)*33;
      shape([[x-step,177],[peak,y],[x+step*2,177]],layer?'#40566b':'#72849a');
      shape([[peak,y],[peak+step*.53,y+29],[peak+8,y+16],[peak+10,y+22],[peak-3,y+12],[peak-18,y+24]],layer?'#b1c1ca':'#c7cdd1')}
  }
  for(let i=0;i<W/7;i++){let x=i*7,y=170+hash(i)*8,h=15+hash(i+41)*33;
    for(let j=0;j<3;j++){let top=y-h+j*h*.21,r=h*(.12+j*.055);shape([[x,top],[x+r,top+h*.58],[x-r,top+h*.58]],'#273e50');shape([[x,top],[x+r*.5,top+h*.29],[x-2,top+h*.19],[x-r*.7,top+h*.4]],'#8299a8')}}
  // Snow rests on the upturned lintel of the gate.
  const x=W*.5;for(let sign of [-1,1]){box(x+sign*53-4,104,9,72,'#65474b');box(x+sign*53-4,104,3,72,'#aa7269')}
  box(x-67,112,134,5,'#995e58');box(x-3,101,6,13,'#a26d61');
  shape([[x-80,86],[x-61,93],[x+61,93],[x+80,86],[x+74,100],[x+57,104],[x-57,104],[x-74,100]],'#79514f');
  shape([[x-81,84],[x-61,90],[x+61,90],[x+81,84],[x+77,91],[x+62,96],[x-62,96],[x-78,91]],'#dae2df');
  for(let k of [-1,1]){let a=x+k*66;box(a,101,1,9,'#252f3c');box(a-4,110,9,12,'#fbac75');box(a-5,109,11,2,'#453b43');box(a-4,121,9,2,'#453b43');box(a-1,112,2,8,'#ffde95')}
  box(0,174,W,56,'#9dabb4');shape([[0,177],[W,177],[W,207],[0,207]],'#c1caca');
  for(let i=-10;i<11;i++){let a=W/2+i*45;shape([[a,177],[a+1,177],[W/2+i*80+2,208],[W/2+i*80,208]],'#97a7b1')}
  for(let y of [182,191,205])box(0,y,W,y===205?3:1,'#92a2ad');
  box(0,208,W,22,'#4e5b69');box(0,208,W,3,'#d4dbd7');
  for(let i=0;i<W/31;i++)box(i*31,212,1,15,'#344557');
}
function limb(x,y,a,b,width,c){ctx.strokeStyle=c;ctx.lineWidth=width;ctx.lineCap='square';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke()}
function fighter(x,facing,action,t,blue){
  const beat=Math.sin(Math.min(1,Math.max(0,(t-poseTime)/340))*Math.PI)||0;
  const jump=action==='shoryuken'?Math.sin(Math.PI*Math.min(1,(t-poseTime)/760))*37:action==='jump'?beat*22:0;const c=blue?'#8dd8b2':'#ed987e',shade=blue?'#498578':'#a85d60';
  box(x-16,186,32,3,'#8798a2');ctx.save();ctx.translate(Math.round(x),Math.round(185-jump));ctx.scale(facing,1);
  const bob=Math.round(Math.sin(t*.005+(blue?0:2))*1.5);ctx.translate(0,bob);
  limb(-4,-17,-9,-4,8,'#273746');box(-16,-4,12,4,'#182431');
  const kicking=action==='kick'||action==='sweep';
  const footY=action==='sweep'?-5:kicking?zones[poseTarget].height:-3;
  const footX=kicking?27:12, kneeY=kicking?(footY-18)/2:-13;
  limb(3,-18,10,kneeY,8,shade);
  limb(10,kneeY,footX,footY,7,'#334655');box(footX-3,footY-2,10,4,'#202c3a');
  shape([[-9,-35],[1,-38],[10,-31],[7,-18],[-9,-17],[-12,-22]],c);
  shape([[-8,-35],[-2,-35],[6,-24],[3,-21]],'#dae2ce');box(-9,-21,17,4,'#29343f');box(-8,-18,4,6,shade);
  box(-7,-49,15,14,'#363947');box(-4,-46,14,10,'#dcb39d');box(-7,-47,17,4,c);box(6,-42,3,2,'#302d38');box(-11,-46,5,4,c);box(-16,-44,6,3,shade);
  const high=action==='uppercut'||action==='shoryuken',jab=action==='jab'||action==='punch'||action==='hadooken';let ax=high?19:jab?28:action==='block'?10:15,ay=high?-48:action==='punch'?zones[poseTarget].height:jab?-31:-36;
  limb(4,-32,10,-27,6,shade);limb(10,-27,ax,ay,5,c);box(ax-2,ay-4,7,6,'#f4c9a9');
  limb(-8,-32,-12,-25,6,shade);limb(-12,-25,-3,-29,5,c);box(-4,-32,6,5,'#e5bba1');ctx.restore()
}
function draw(t){
  scenery(t);let foe=W*.60,player=foe-(24+gap*Math.min(16,W*.043));
  fighter(player,1,pose,t,true);fighter(foe,-1,counter,t,false);
  const age=Math.max(0,t-poseTime);
  if(pose==='hadooken'){
    const u=Math.min(1,age/420),x=player+24+(foe-player-24)*u;
    if(age<420){
      for(let i=4;i>=0;i--)box(x-i*4,150+i%2,9,7,i>1?'#4a99d7':'#a4faf4');
      box(x+3,151,6,4,'#fff9db');
    }else for(let i=0;i<10;i++){
      const a=i*Math.PI/5,r=(age-420)*.075;
      box(foe+Math.cos(a)*r,153+Math.sin(a)*r,3,3,'#a4faf4')
    }
  }else if(pose==='shoryuken'){
    const rise=Math.sin(Math.PI*Math.min(1,age/760))*37;
    for(let i=0;i<5;i++)box(player+14-i*2,144-rise+i*4,3,4,'#ffcc78')
  }else if(pose==='freezeframe'){
    ctx.fillStyle='#aadffff0';ctx.font='bold 13px monospace';ctx.textAlign='center';
    for(let i=0;i<6;i++){const a=i*Math.PI/3+age*.003;ctx.fillText('❄',foe+Math.cos(a)*24,159+Math.sin(a)*26)}
  }
  if(impact){ctx.fillStyle='#fff2ca';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(impact,counter==='idle'?foe:player,121)}
  for(let i=0;i<45;i++)box((hash(i+50)*W+t*.009)%W,(hash(i+85)*H+t*(.012+i%3*.004))%H,1,2,'#e8efedaa');
  requestAnimationFrame(draw)
}
reset();requestAnimationFrame(draw);
