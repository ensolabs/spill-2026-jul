'use strict';
function fjordChart(canvas){
  const C=Channel,base=document.createElement('canvas');base.width=384;base.height=212;
  const screen=canvas.getContext('2d');let c=base.getContext('2d');
  const noise=n=>{const f=Math.sin(n*93.17+21)*8932;return f-Math.floor(f)};
  const ink=(x,y,w,h,k)=>{c.fillStyle=k;c.fillRect(Math.round(x),Math.round(y),w,h)};
  function poly(pts,k){c.fillStyle=k;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
  function text(x,y,s,k){c.font='bold 6px monospace';c.textAlign='center';c.fillStyle=k;c.fillText(s,x,y)}
  function car(x,y,k){
    ink(x-2,y-1,6,3,'#22293c');ink(x-3,y-2,7,3,k);ink(x-1,y-2,3,2,'#9bbcc3');ink(x+3,y-2,1,1,'#f4d8a1');
  }
  function person(x,y,k){ink(x,y-2,1,1,'#f0c391');ink(x-1,y-1,2,2,k);ink(x,y+1,1,1,'#20283d')}
  ink(0,0,384,212,'#354c70');
  for(let y=0;y<212;y++){
    const l=Math.round(C.bank(0,y)),r=Math.round(C.bank(1,y));
    for(const [x,w] of [[0,l],[r,384-r]])ink(x,y,w,1,'#c4d5cb');
    ink(l,y,2,1,'#83949a');ink(l+2,y,3,1,'#293e57');ink(r-2,y,2,1,'#84989b');ink(r-5,y,3,1,'#293e57');
    ink(l+5,y,4+Math.round(2*Math.sin(y*.11)),1,'#527085');ink(r-10,y,5,1,'#527085');
  }
  // Small skerries and kelp beds in the shallows along the two banks.
  for(let i=0;i<33;i++){
    const y=Math.floor(noise(i+803)*208),n=i%2,x=Math.round(C.bank(n,y))+(n?-1:1)*(1+i%4);
    if(Math.abs(y-(n?111:133))<13)continue;
    ink(x-2,y+2,5,1,'#98b4b6');ink(x-2,y,4,2,'#626d80');ink(x-1,y-1,3,1,'#e5ded0');
  }
  for(let i=0;i<2600;i++){const x=Math.floor(noise(i)*384),y=Math.floor(noise(i+611)*212);
    if(x>C.bank(0,y)+12&&x<C.bank(1,y)-12){
      const aurora=Math.abs(y-28-9*Math.sin(x*.036))<10;
      ink(x,y,1+i%5,1,aurora&&i%2?'#578785':['#3b5878','#415d79','#30476a'][i%3]);
    }else if(x<C.bank(0,y)-1||x>C.bank(1,y)+1)ink(x,y,2,1,i%4?'#aabebc':'#e5e8d7');
  }
  function pine(x,y,h){poly([[x+1,y-h],[x+5,y],[x-3,y]],'#667f82');ink(x-1,y-3,2,5,'#5d575b');for(let j=0;j<3;j++){const yy=y-h+j*h*.19,w=h*(.12+j*.045);poly([[x,yy],[x-w,yy+h*.58],[x+w,yy+h*.58]],'#33595c');poly([[x,yy],[x-w,yy+h*.55],[x+1,yy+h*.32]],'#d8e2d4')}}
  for(let i=0;i<78;i++){const west=i%2===0,y=3+Math.floor(noise(i+31)*205),x=west?noise(i+48)*(C.bank(0,y)-5):C.bank(1,y)+5+noise(i)*24;
    if(Math.abs(y-(west?133:111))>18)pine(x,y,7+noise(i+55)*10)}
  for(const [n,p] of [C.west,C.east].entries()){
    const d=n?-1:1,y=p.y,terminal=p.x-26*d;
    ink(n?p.x:0,y-3,n?384-p.x:p.x,6,'#8d857b');
    ink(Math.min(p.x-d*16,p.x-d*7),y-6,11,13,'#856956');
    for(let i=0;i<6;i++)ink(p.x-d*(8+i*1.6),y-5,1,12,'#c99f72');
    const x=terminal-6;ink(x,y-15,12,9,'#955f5e');poly([[x-2,y-14],[x+4,y-21],[x+13,y-20],[x+15,y-14]],'#ebe7d2');
    ink(x+2,y-12,3,3,'#ffda8a');ink(x+8,y-12,2,5,'#383b50');
    for(let j=0;j<4;j++)ink(p.x-d*8,y-4+j*3,1,1,'#ffe0a2');
    text(n?355:29,y+18,p.name.toUpperCase(),'#192f40');
  }
  // A short finger pier just north of the Austnes vehicle ramp.
  const pier=C.pier;
  ink(pier.x-2,pier.y-7,24,4,'#775d58');ink(pier.x-2,pier.y-7,24,1,'#dfc19a');
  for(let x=pier.x;x<pier.x+22;x+=5)ink(x,pier.y-5,1,3,'#352f44');
  c=screen;
  const colours=['#db8772','#adc4a6','#d8bc79','#8996bb','#c996a6'];
  function ferry(s,count){
    c.save();c.translate(Math.round(s.x),Math.round(s.y));c.rotate(s.h);
    const hull=[[-11,-4],[-7,-6],[7,-6],[12,-3],[12,3],[7,6],[-7,6],[-11,4]];
    c.save();c.translate(1,2);poly(hull,'#24384e');c.restore();poly(hull,'#bc7267');
    poly([[-10,-3],[-7,-5],[7,-5],[11,-2],[11,2],[7,5],[-7,5],[-10,3]],'#eee1b9');
    ink(-8,-3,16,6,'#766f73');ink(-6,-5,11,3,'#d1e0d4');ink(-5,-5,8,1,'#47647a');
    for(let i=0;i<count;i++){const x=-7+(i%3)*5,y=-1+Math.floor(i/3)*3;ink(x,y,4,2,colours[i]);ink(x+1,y,1,1,'#364457')}
    ink(8,-2,2,4,'#f9d58c');ink(1,4,4,1,'#fff3c1');c.restore();
  }
  function buoy(x,y,lower,lit,t){
    const dy=Math.sin(t*2+y)>.65?1:0,col=lower?'#b3dec0':'#ee9f86';
    ink(x-2,y+2,6,2,'#293d5d');ink(x-3,y+4,6,1,'#607d91');ink(x-2,y-1+dy,5,4,col);
    if(lower)ink(x-1,y-4+dy,3,3,col);else poly([[x,y-5+dy],[x-2,y-1+dy],[x+3,y-1+dy]],col);
    if(lit){ink(x,y-6+dy,1,2,'#fff0a0');if(Math.floor(t*2)%2===0)ink(x-1,y-7+dy,3,1,'#ead198')}
  }
  function ring(x,y,r,k){c.strokeStyle=k;c.lineWidth=1;c.strokeRect(Math.round(x-r)+.5,Math.round(y-r)+.5,2*r,2*r)}
  function launch(b){
    for(const w of b.wash)for(const side of [-1,1]){
      const spread=side*(2+w.age*4);
      ink(w.x-Math.sin(w.h)*spread,w.y+Math.cos(w.h)*spread,2,1,w.age<.4?'#d6ddd0':'#779bae');
    }
    if(b.state!=='running'&&b.state!=='docked')return;
    c.save();c.translate(Math.round(b.x),Math.round(b.y));c.rotate(b.h);
    poly([[-7,-3],[2,-4],[8,-1],[9,0],[3,4],[-7,3]],'#202e48');
    poly([[-6,-3],[2,-3],[8,0],[2,3],[-6,2]],'#eea362');
    ink(-4,-2,6,4,'#f6e8c7');ink(0,-2,2,4,'#52687c');ink(-5,-1,1,2,'#875642');ink(5,0,2,1,'#fff0bc');
    c.restore();
  }
  return function draw(s,phase,t,progress,wake){
    c.drawImage(base,0,0);const gates=C.route(s.leg),dest=C.arrival(s.leg),from=C.departure(s.leg),sign=s.leg%2?-1:1;
    const target=gates[s.gate]||dest;
    if(phase==='sailing'||phase==='ready'){
      c.save();c.strokeStyle='#d4ca9b70';c.setLineDash([1,5]);c.beginPath();c.moveTo(s.x,s.y);c.lineTo(target.x,target.y);c.stroke();c.restore();
    }
    for(const g of gates){
      const lit=g===target;buoy(g.x,g.y-C.half,false,lit,t);buoy(g.x,g.y+C.half,true,lit,t);
      if(lit){text(g.x,g.y-C.half-10,'G'+(s.gate+1),'#ffe1a0');
        for(let j=-2;j<=2;j++)ink(g.x,g.y+j*6,1,2,'#f0d698')}
    }
    // Show where neutral drag will carry the present velocity, in chart coordinates.
    if(phase==='sailing'&&C.speed(s)>2){
      const cx=Math.round(s.x+6.2*s.vx),cy=Math.round(s.y+6.2*s.vy);
      if(cx>3&&cx<381&&cy>3&&cy<209){
        ink(cx-2,cy-2,2,1,'#adbbca');ink(cx+1,cy+2,2,1,'#adbbca');
        ink(cx-2,cy+1,1,2,'#adbbca');ink(cx+2,cy-2,1,2,'#adbbca');
      }
    }
    if(!gates[s.gate])ring(dest.x,dest.y,12,'#eed897');
    if(s.aim){const {x,y}=s.aim;ink(x-3,y,7,1,'#bedfd5');ink(x,y-3,1,7,'#bedfd5')}
    for(const w of wake){const age=w.age;for(const side of [-1,1]){const spread=side*(3+age*3);ink(w.x-Math.sin(w.h)*spread,w.y+Math.cos(w.h)*spread,2,1,age<.8?'#b4cfc8':'#7093a2')}}
    const load=C.cargo[s.leg],onboard=phase==='ready'?0:phase==='loading'?Math.floor(progress*load.cars):phase==='unloading'?load.cars-Math.floor(progress*load.cars):phase==='done'||phase==='alongside'?0:load.cars;
    if(phase==='sailing'){
      const bx=s.x+Math.cos(s.h)*15,by=s.y+Math.sin(s.h)*15;
      ink(bx,by,2,1,'#ffe2a2');
    }
    launch(s.boat);ferry(s,onboard);
    if(s.leg<2){
      const next=C.cargo[s.leg+1];
      for(let i=0;i<next.cars;i++)car(dest.x+sign*(18+Math.floor(i/2)*7),dest.y-4+(i%2)*4,colours[i]);
      for(let i=0;i<next.people;i++)person(dest.x+sign*(22+Math.floor(i/5)*2),dest.y+3+(i%5)*2,i%2?'#976b6d':'#465b74');
    }
    const unload=['unloading','alongside','done'].includes(phase),p=unload?dest:from,d=unload?-sign:sign;
    if(phase!=='sailing'&&phase!=='paused'){
      const fraction=phase==='loading'||phase==='unloading'?progress:phase==='ready'?0:1;
      for(let i=0;i<load.cars;i++){
        const k=C.clamp(fraction*load.cars-i,0,1),u=unload?1-k:k;if(u>=1)continue;
        const lot=p.x-d*(20+Math.floor(i/3)*8),ly=p.y+6+(i%3)*4;
        car(lot+(p.x-lot)*u,ly+(p.y-ly)*u,colours[i]);
      }
      for(let i=0;i<load.people;i++){
        const k=C.clamp(fraction*load.people-i,0,1),u=unload?1-k:k;if(u>=1)continue;
        const lx=p.x-d*(15+Math.floor(i/4)*2),ly=p.y-6-(i%4)*2;person(lx+(p.x-lx)*u,ly+(p.y-ly)*u,i%2?'#ae746c':'#435575');
      }
    }
  };
}
