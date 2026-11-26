'use strict';
function keeperScene(canvas, football) {
  const c=canvas.getContext('2d'), bg=document.createElement('canvas');
  bg.width=960; bg.height=400;
  let ink=bg.getContext('2d'),last;
  const rand=n=>{const v=Math.sin(n*65.238+32)*8842;return v-Math.floor(v)};
  function rect(x,y,w,h,color){ink.fillStyle=color;ink.fillRect(x,y,w,h)}
  function path(points,color,stroke,width=1){
    ink.beginPath();points.forEach(([x,y],i)=>i?ink.lineTo(x,y):ink.moveTo(x,y));
    if(color){ink.closePath();ink.fillStyle=color;ink.fill()}if(stroke){ink.strokeStyle=stroke;ink.lineWidth=width;ink.lineCap='round';ink.lineJoin='round';ink.stroke()}
  }
  function oval(x,y,rx,ry,color){ink.beginPath();ink.ellipse(x,y,rx,ry,0,0,Math.PI*2);ink.fillStyle=color;ink.fill()}
  function grad(y,h,a,b){const g=ink.createLinearGradient(0,y,0,h);g.addColorStop(0,a);g.addColorStop(1,b);return g}
  function type(x,y,text,size,color){ink.fillStyle=color;ink.textAlign='center';ink.font='bold '+size+'px system-ui';ink.fillText(text,x,y)}
  // A wide cylindrical lens keeps both posts' shooting lanes within the player's view.
  const horizon=139,lens=287,eyeZ=.045,gloveZ=.46;
  let eyeX=0,eyeY=1.65;
  function project(x,y,z){
    const dx=x-eyeX,dz=Math.max(.012,z-eyeZ);
    // Compress peripheral angles only at arm's length; the distant pitch uses
    // ordinary perspective so straight markings stay straight.
    const near=Math.max(0,Math.min(1,(4-dz)/3));
    const blend=near*near*(3-2*near);
    const horizontal=(1-blend)*dx/dz+blend*Math.atan2(dx,dz);
    const s=lens*((1-blend)/dz+blend/Math.hypot(dx,dz));
    return [480+lens*horizontal,horizon+(eyeY-y)*s,s];
  }
  function fieldLine(coords,col,weight=1.6){
    const points=coords.map(([x,z])=>{
      const depth=Math.max(.25,z-eyeZ);
      return [480+lens*(x-eyeX)/depth,horizon+lens*eyeY/depth];
    });
    path(points,null,col,weight);
  }
  rect(0,0,960,400,grad(0,170,football?'#081b34':'#292135',football?'#a8aaba':'#aa6d70'));
  if(football){
    for(let i=0;i<100;i++)oval(rand(i)*960,rand(i+1)*86,1,1,'#c2d9e5');
    for(let layer=0;layer<2;layer++){
      const ridge=[];
      for(let x=-10;x<980;x+=10){
        const y=43+layer*16+15*Math.sin(x*.014+layer)+8*Math.sin(x*.039)+rand(x+layer)*8;
        ridge.push([x,y]);
      }
      path([...ridge,[980,119],[-10,119]],layer?'#4e6574':'#96a8b7');
      for(let i=1;i<ridge.length-1;i++){
        const [x,y]=ridge[i];if(ridge[i-1][1]>y&&ridge[i+1][1]>y)
          path([[x-10,ridge[i-1][1]],[x,y],[x+10,ridge[i+1][1]],[x+4,y+6],[x+1,y+4],[x-9,y+14]],layer?'#bdd0d6':'#d3dee1');
      }
    }
  }else{
    for(let i=0;i<=10;i++){path([[i*110-120,0],[i*100-27,68],[i*110,0]],null,'#65707b',3)}
  }
  for(let row=0;row<7;row++){
    const y=66+row*9;
    rect(0,y,960,10,football?'#31454d':'#604053');
    for(let i=0;i<152;i++){
      const x=i*6.5+rand(i+row)*3,y0=y+rand(i*3+row)*2;
      if(football&&i%26===0){rect(x-2,y+6,5,1,'#85919a');continue}
      const col=['#b6ae92','#62747b','#b06359','#354956','#b99277','#b3bac1'][Math.floor(rand(i*17+row)*6)];
      oval(x,y0,1.7,2.0,'#bda38f');rect(x-2.2,y0+1,4.5,3.2,col);
      if(football&&rand(i*5+row*101)>.84)path([[x-2.8,y0],[x+2.4,y0-.6]],null,i%2?'#f1be56':'#b15557',1.3);
    }
  }
  if(football){
    const roof=x=>55+10*Math.sin(Math.PI*x/960);
    for(let x=0;x<960;x+=24){
      const y=roof(x), yy=roof(x+24);
      path([[x,y],[x+24,yy],[x+24,yy+4],[x,y+4]],'#202f3e');
      path([[x,y],[x+24,yy]],null,'#d7e5e6',2);
      path([[x,y+5],[x+12,y+11],[x+24,yy+5]],null,'#71828c',1);
      if(x%96===0)rect(x,y+5,2,125-y-5,'#54616b');
    }
    for(const x of [125,289,655,838]){
      rect(x,113,1,14,'#b9beb7');
      path([[x,113],[x+8,111],[x+16,114],[x+22,113],[x+22,120],[x+14,120],[x+7,117],[x,119]],x<500?'#c4a141':'#b85455');
    }
  }
  for(let i=0;i<6;i++){
    const x=40+i*175,y=football?46:39;
    if(football)rect(x-2,y,3,33,'#43545b');
    const g=ink.createRadialGradient(x,y,1,x,y,36);g.addColorStop(0,'#ffeabd99');g.addColorStop(1,'#ffefd000');oval(x,y,36,36,g);
    rect(x-12,y-2,23,8,'#666c70');
    for(let j=-2;j<3;j++)for(let k=0;k<2;k++)rect(x+j*4-1,y+k*3,3,2,'#fff6ce');
  }
  rect(0,128,960,19,football?'#264645':'#5d3042');
  for(let i=0;i<4;i++)type(i*255+105,141,football?'ensō  /  STADIUM':'KATOWICE    ✦    FINALS',10,'#f4ead9');
  rect(0,143,960,257,grad(143,400,football?'#58816e':'#34778e',football?'#204b41':'#16556d'));
  if(football){
    for(let i=0;i<7500;i++){
      const x=rand(i+308)*960,y=149+rand(i+501)*252,depth=(y-149)/251;
      rect(x,y,.6+depth*2.4,.3+depth*.65,i%3?'#b7ce9330':'#163e4040');
    }
    const frost=ink.createRadialGradient(482,309,8,482,309,112);
    frost.addColorStop(0,'#b3a1772c');frost.addColorStop(1,'#b3a17700');oval(482,309,112,26,frost);
    for(let i=0;i<160;i++)rect(rand(i+14)*960,151+rand(i+400)*245,1.4,1,'#e9ead32a');
  }else{
    const arc=[];for(let i=0;i<=60;i++){const a=i*Math.PI/60;arc.push([7*Math.cos(a),6*Math.sin(a)])}
    path([...arc.map(([x,z])=>project(x,0,z)),[960,400],[0,400]],'#5198aa55');
    fieldLine(arc,'#dae6d7',2.6);fieldLine([[-.5,7],[.5,7]],'#fff1d5',3);
    fieldLine([[-.08,4],[.08,4]],'#fff1d5',2);
    for(let i=0;i<32;i++){const a=i*Math.PI/32;fieldLine([[10*Math.cos(a),9*Math.sin(a)],[10*Math.cos(a+.048),9*Math.sin(a+.048)]],'#e4e9d6')}
  }
  // Frame the opposite goal against the advertising boards.
  const goalZ=football?105:40, half=football?3.66:1.5, top=football?2.44:2;
  for(let j=0;j<=10;j++){const gx=-half+j*half/5;path([project(gx,0,goalZ),project(gx,top,goalZ)],null,'#e8eada58',.6)}
  for(let j=0;j<=5;j++){const gy=j*top/5;path([project(-half,gy,goalZ),project(half,gy,goalZ)],null,'#e8eada58',.6)}
  path([project(-half,0,goalZ),project(-half,top,goalZ),project(half,top,goalZ),project(half,0,goalZ)],null,'#f7edd8',2);
  if(!football)for(let j=0;j<6;j++){const gx=-half+j*.50;path([project(gx,top,goalZ),project(gx+.25,top,goalZ)],null,'#dc5a54',2)}
  ink=c;
  function player(x,z,kit,number,pose={}){
    const [px,py,s]=project(x,pose.jump||0,z),lean=pose.lean||0,step=pose.step||0,arm=pose.arm||0;
    const turf=project(x,0,z);oval(turf[0],turf[1],s*.39,s*.061,'#112b3544');
    c.save();c.translate(px,py);c.scale(s,s);
    const skin=number===7?'#b98260':'#cf9976',dark='#162b3a';
    const limb=(p,col,w)=>path(p,null,col,w);
    const shirt=c.createLinearGradient(-.26,0,.26,.07);
    shirt.addColorStop(0,number===9||number===7||number===11?'#bb9523':'#9c3543');
    shirt.addColorStop(.46,kit);shirt.addColorStop(1,kit);
    for(const d of [-1,1]){
      const foot=d*.20+step*d+(d===Math.sign(pose.plant||0)?pose.plant:0);
      limb([[d*.12,-.83],[d*.18,-.48],[foot,-.15]],skin,.14);
      limb([[d*.18,-.42],[foot,-.11]],kit,.14);
      limb([[foot,-.055],[foot+d*.09,-.055]],dark,.11);
    }
    path([[-.26,-.9],[.26,-.9],[.22,-.68],[.03,-.69],[0,-.77],[-.05,-.68],[-.22,-.69]],dark);
    const sx=lean*.20;
    path([[sx-.24,-1.42],[sx-.17,-1.49],[sx+.15,-1.49],[sx+.24,-1.43],[.18,-1.13],[.20,-.88],[-.20,-.88],[-.18,-1.12]],shirt);
    if(football&&kit==='#d74650')for(const stripe of [-.13,0,.13])limb([[sx+stripe,-1.44],[stripe,-.9]],'#f6be45',.037);
    for(const d of [-1,1]){
      const shoulder=[sx+d*.22,-1.44+(d*lean)*.09];
      const elbow=[sx+d*(.34+Math.abs(arm)*.14),-1.16-(d===1?arm*.36:0)+step*d*.7];
      const hand=[sx+d*(.40+(d===1?arm*.10:0))-step,-1.05-(d===1?arm*.73:0)+step*d];
      limb([shoulder,elbow,hand],skin,.105);limb([shoulder,[shoulder[0]+d*.065,shoulder[1]+.10]],kit,.16);
    }
    path([[sx-.09,-1.47],[sx,-1.42],[sx+.09,-1.47]],null,dark,.025);
    oval(sx,-1.65,.143,.183,skin);oval(sx-.02,-1.77,.148,.095,'#453936');
    if(football){
      oval(sx-.12,-1.73,.065,.097,'#423633');
      path([[sx-.068,-1.64],[sx-.038,-1.64]],null,'#58463d',.016);
      path([[sx+.038,-1.64],[sx+.068,-1.64]],null,'#58463d',.016);
    }
    if(!football)oval(sx-.13,-1.69,.075,.13,'#453936');
    c.fillStyle='#193340';c.textAlign='center';c.font='bold .23px sans-serif';c.fillText(String(number),sx,-1.12);
    c.restore();
  }
  function ball(x,y,z){
    const [bx,by,s]=project(x,y,z),r=Math.max(3.2,s*.134);
    const light=c.createRadialGradient(bx-r*.3,by-r*.45,r*.08,bx,by,r);
    light.addColorStop(0,'#fffdf1');light.addColorStop(.73,'#e4e9d9');light.addColorStop(1,'#87979c');
    oval(bx,by,r+.75,r+.75,'#152b3caa');oval(bx,by,r,r,light);
    const roll=x*.5+z*.64;
    for(let i=0;i<3;i++){
      const a=roll+i*2.094,px=bx+r*.51*Math.sin(a),py=by+r*.52*Math.cos(a),patch=[];
      for(let j=0;j<5;j++)patch.push([px+r*.27*Math.cos(a+j*1.257),py+r*.24*Math.sin(a+j*1.257)]);
      path(patch,'#28394b');
    }
  }
  function mitt(g,side){
    const [x,y,scale]=project(...g);
    // Bring the hips across first. Both elbows stay beside the ribs, directed down
    // and back towards the eye, so the forearms are seen foreshortened.
    const elbow=project(eyeX+side*.34,eyeY-.46,eyeZ+.17);
    const dx=elbow[0]-x,dy=elbow[1]-y;
    const angle=Math.max(-.59,Math.min(.59,Math.atan2(-dx,dy))),size=Math.min(1.65,scale*.00245);
    c.save();c.translate(x,y);c.rotate(angle);c.scale(-side*size,size);
    const sleeve=grad(13,103,'#497fa0','#1b364b');
    // The upper arm returns towards the camera and is cropped by the bottom of the frame.
    ink.beginPath();ink.moveTo(-13,13);ink.quadraticCurveTo(-22,37,-24,76);
    ink.quadraticCurveTo(-29,103,-39,172);ink.lineTo(35,172);
    ink.quadraticCurveTo(26,106,23,77);ink.quadraticCurveTo(21,43,13,16);
    ink.closePath();ink.fillStyle=sleeve;ink.fill();
    path([[-20,57],[-12,60],[7,55]],null,'#7da0ae',1.4);
    path([[-22,70],[-6,66],[12,68]],null,'#2c4d61',2.3);
    // Backhand panels and a wrapped wrist strap, thumb pointing inward.
    for(let i=0;i<4;i++){
      const base=-11+i*7.3,tip=base+(i-1.6)*1.8,top=-15-6*Math.sin(.25+i*.83);
      path([[base,2],[tip,top]],null,'#765f38',7.9);
      path([[base,1],[tip,top+1]],null,'#f0c969',6.3);
      path([[base,-5],[tip,-8]],null,'#fbe9a8',3.6);
    }
    path([[-14,-2],[-7,-6],[8,-5],[13,1],[14,12],[9,20],[-10,20],[-15,10]],grad(-4,22,'#ffe29a','#d7a84e'));
    path([[9,9],[16,5],[21,-1]],null,'#ebc169',8);
    path([[-10,5],[-3,0],[8,1],[10,6],[4,6],[-5,11]],'#cf9743');
    path([[-10,13],[-2,9],[7,11]],null,'#fff1b0',1.7);
    path([[-10,10],[-7,7],[-4,8],[-7,12]],'#edbd64');
    path([[6,13],[9,9],[11,10],[9,15]],'#edae50');
    rect(-13,17,27,8,'#213747');rect(-10,19,17,2.5,'#a4bac2');
    c.restore();
  }
  function render(v){
    last=v;const w=canvas.width,h=canvas.height,s=Math.min(w/925,h/360);
    const centreX=(v.gloves[0][0]+v.gloves[1][0])*.5;
    eyeX=centreX*.94;
    eyeY=Math.max(.68,Math.min(2.63,v.gloves[0][1]+.21));
    c.setTransform(s,0,0,s,(w-960*s)/2,(h-400*s)/2);rect(-600,-400,2200,400,'#081b34');rect(-600,399,2200,450,'#204b41');c.drawImage(bg,0,0);
    if(football){
      for(const [width,depth] of [[20.16,16.5],[9.15,5.5]])
        fieldLine([[-width,0],[-width,depth],[width,depth],[width,0]],'#cee1c9',1.5);
      const state=v.state;
      const list=[...Match.wall.map(([x,z],i)=>[-x,z,'#d74650',2+i]),[9,23-state.kickRun*.5,'#ffdc34',11],...state.marks.map(([x,z],i)=>[-x,z,'#d74650',i?6:5,{step:.12*Math.sin(Math.min(v.t,Match.meet)*10+i)}]),...state.bodies.map(([x,z],i)=>{
        const arrival=i===v.striker?Math.max(0,1-Math.abs(v.t-Match.meet)/.32):0;
        const settle=arrival*arrival*(3-2*arrival);
        return [-x+(v.crossX+x)*settle,z+(Match.dropZ-z)*settle,'#ffdc34',i?7:9,{
          step:.14*Math.sin(Math.min(v.t,Match.meet)*11+i)*(1-settle),
          jump:.035*settle,arm:settle*.42
        }];
      })];
      list.sort((a,b)=>b[1]-a[1]).forEach(p=>player(...p));
    }else player(0,7,'#f57968',14,{lean:v.lean,plant:v.plant,arm:v.arm});
    const ground=project(v.ball[0],0,v.ball[2]);
    if(v.ball[2]>eyeZ+.025)oval(ground[0],ground[1],Math.max(2,ground[2]*.16),Math.max(1,ground[2]*.045),'#17392e70');
    if(v.trail?.length)path([...v.trail,v.ball].map(p=>project(...p)),null,'#fff1c888',2.7);
    if(v.target){
      const [tx,ty,ts]=project(...v.target);
      const radius=Math.min(30,Math.max(19,.24*ts));
      c.beginPath();c.arc(tx,ty,radius,0,Math.PI*2);c.strokeStyle='#ffde87';c.lineWidth=3;c.stroke();
      for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
        path([[tx+Math.cos(a)*(radius+5),ty+Math.sin(a)*(radius+5)],[tx+Math.cos(a)*(radius-3),ty+Math.sin(a)*(radius-3)]],null,'#fff3bb',2);
      }
    }
    if(v.ball[2]>eyeZ+.025)ball(...v.ball);
    for(const [i,g] of v.gloves.entries()){
      mitt(g,i?1:-1);
    }
    if(v.marker){rect(265,26,430,30,'#192936dc');type(480,46,v.marker,14,'#fff0b3')}
  }
  function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(canvas.clientWidth*d));canvas.height=Math.max(1,Math.round(canvas.clientHeight*d));if(last)render(last)}
  new ResizeObserver(resize).observe(canvas);resize();
  render.aimPoint=e=>{
    const b=canvas.getBoundingClientRect(),s=Math.min(canvas.width/925,canvas.height/360);
    const x=((e.clientX-b.left)*canvas.width/b.width-canvas.width/2)/s+480;
    const y=((e.clientY-b.top)*canvas.height/b.height-canvas.height/2)/s+200;
    if(last?.target){
      const [tx,ty,ts]=project(...last.target);
      if(Math.hypot(x-tx,y-ty)<=Math.min(30,Math.max(19,.24*ts))+5)return last.target.slice(0,2);
    }
    const yaw=Math.max(-1.48,Math.min(1.48,(x-480)/lens));
    const dx=(gloveZ-eyeZ)*Math.tan(yaw);
    return [eyeX+dx,eyeY-(y-horizon)*Math.hypot(dx,gloveZ-eyeZ)/lens];
  };
  return render;
}
