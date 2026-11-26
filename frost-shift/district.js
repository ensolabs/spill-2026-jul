'use strict';
const District=(()=>{
  const streets=[-64,0,64],limit=99,range=32;
  const centres=[
    {name:'Quay',x:22,y:-22,side:'south'},
    {name:'Ridge',x:-43,y:-43,side:'east'},
    {name:'Harbour',x:43,y:43,side:'south'}
  ];
  const blocks=centres.map((hub,i)=>({...hub,type:'server',w:23,d:18,h:8,i}));
  const ports=blocks.map(b=>({x:b.x+(b.side==='east'?b.w/2+1:0),y:b.y+(b.side==='south'?b.d/2+1:0),z:3.8}));
  for(const [x,y,tint] of [[-25,25,'#b96364'],[-43,39,'#648293'],[25,22,'#c08769'],[44,-42,'#7f819f'],[-25,-24,'#b78475'],[-84,21,'#ab777c'],[82,-31,'#689798'],[19,85,'#977f99'],[-42,-85,'#678b99']])
    blocks.push({x,y,w:11,d:9,h:5,type:'cabin',tint});
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function create(){return {x:0,y:19,a:0,v:0,heat:[90,90,90],shots:[],splashes:[],tracks:[],trackTime:0,cooldown:0,time:120,score:0}}
  function near(s){let id=-1;for(let i=0;i<ports.length;i++)if(s.heat[i]>30&&(id<0||dist(s,ports[i])<dist(s,ports[id])))id=i;return id}
  function solid(x,y,r){return blocks.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(y-b.y)<b.d/2+r)}
  function drive(s,gas,brake,steer,dt){
    const onRoad=streets.some(n=>Math.abs(s.x-n)<7||Math.abs(s.y-n)<7);
    const target=brake?-11:gas?(onRoad?29:17):0;
    const accel=brake&&s.v>0||gas&&s.v<0?32:gas||brake?17:10;
    s.v+=clamp(target-s.v,-accel*dt,accel*dt);
    s.a+=steer*Math.sign(s.v)*Math.min(1,Math.abs(s.v)/5)*1.65*dt;
    const x=clamp(s.x+Math.sin(s.a)*s.v*dt,-limit,limit),y=clamp(s.y-Math.cos(s.a)*s.v*dt,-limit,limit);
    const oldX=s.x,oldY=s.y;
    if(!solid(x,s.y,2))s.x=x;
    if(!solid(s.x,y,2))s.y=y;
    if(Math.abs(s.v)>2&&Math.hypot(s.x-oldX,s.y-oldY)<Math.abs(s.v)*dt*.25)s.v*=.6;
    s.trackTime-=dt;
    if(s.trackTime<=0&&Math.abs(s.v)>2){s.tracks.push({x:s.x,y:s.y,a:s.a});if(s.tracks.length>120)s.tracks.shift();s.trackTime=.09}
  }
  function throwBall(s,aim){
    if(s.cooldown>0)return false;
    const start={x:s.x+1.15*Math.cos(s.a),y:s.y+1.15*Math.sin(s.a),z:2.3};
    const distance=dist(start,aim),fraction=Math.min(1,range/Math.max(.01,distance));
    s.shots.push({start,end:{x:start.x+(aim.x-start.x)*fraction,y:start.y+(aim.y-start.y)*fraction,z:fraction===1?aim.z:.2},age:0,duration:.20+Math.min(range,distance)/52,pos:{...start}});
    s.cooldown=.38;return true
  }
  function step(s,dt,onHit){
    s.cooldown=Math.max(0,s.cooldown-dt);s.time=Math.max(0,s.time-dt);
    for(const ball of [...s.shots]){
      ball.age+=dt;const u=Math.min(1,ball.age/ball.duration);
      const pos={x:ball.start.x+(ball.end.x-ball.start.x)*u,y:ball.start.y+(ball.end.y-ball.start.y)*u,z:ball.start.z+(ball.end.z-ball.start.z)*u+12*u*(1-u)};ball.pos=pos;
      const hit=ports.findIndex((p,i)=>s.heat[i]>30&&Math.hypot(pos.x-p.x,pos.y-p.y,pos.z-p.z)<2.6);
      const wall=blocks.some(b=>pos.z<b.h&&Math.abs(pos.x-b.x)<b.w/2&&Math.abs(pos.y-b.y)<b.d/2);
      if(hit<0&&!wall&&u<1)continue;
      s.shots.splice(s.shots.indexOf(ball),1);s.splashes.push({...pos,age:0,melt:hit>=0});
      if(hit>=0){s.heat[hit]-=20;s.score+=s.heat[hit]===30?700:200;onHit(hit)}
    }
    s.splashes.forEach(p=>p.age+=dt);s.splashes=s.splashes.filter(p=>p.age<.42)
  }
  return {streets,limit,range,centres,blocks,ports,create,near,dist,drive,throwBall,step,clamp}
})();
