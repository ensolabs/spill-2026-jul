'use strict';
const CurlIce=(()=>{
  const length=45.72,tee=length/2+17.375,hack=tee-34.75-3.658,r=.145;
  const ends=[
    {name:'The open draw',brief:'Finish in the house, closer to the button than the yellow stone.',rivals:[[1.12,.1]]},
    {name:'Around the guard',brief:'Leave the short guard untouched and draw closer than yellow in the house.',rivals:[[-.49,-4.2],[.72,.15]]},
    {name:'The takeout',brief:'Knock yellow out of the house and keep your red stone in scoring position.',rivals:[[.05,-.05]]}
  ];
  const stone=(x,y)=>({x,y,vx:0,vy:0,out:false});
  function rack(n){return [stone(0,hack),...ends[n].rivals.map(([x,dy])=>stone(x,tee+dy))]}
  function release(s,line,v){const a=Math.atan2(line,tee-hack);s.vx=v*Math.sin(a);s.vy=v*Math.cos(a)}
  function step(stones,dt,turn,sweep){
    stones.forEach((s,i)=>{
      const v=Math.hypot(s.vx,s.vy);if(!v||s.out)return;
      const drag=i===0&&sweep?.198:.24;
      const next=Math.max(0,v-drag*dt);
      // Rotate the velocity vector gradually, with more curl late in the run.
      const bend=i===0?turn*.013*(1-Math.min(v/5,1))*(sweep?.42:1)*dt:0;
      const a=Math.atan2(s.vx,s.vy)+bend;s.vx=next*Math.sin(a);s.vy=next*Math.cos(a);
      s.x+=s.vx*dt;s.y+=s.vy*dt;
      if(Math.abs(s.x)+r>=2.375||s.y-r>tee+1.829){s.out=true;s.vx=s.vy=0}
    });
    for(let i=0;i<stones.length;i++)for(let j=i+1;j<stones.length;j++){
      const a=stones[i],b=stones[j];if(a.out||b.out)continue;
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(!d||d>=2*r)continue;
      const nx=dx/d,ny=dy/d,over=(2*r-d)/2;a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;
      const impulse=.96*((a.vx-b.vx)*nx+(a.vy-b.vy)*ny);
      if(impulse>0){a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny}
    }
  }
  const distance=s=>s.out?Infinity:Math.hypot(s.x,s.y-tee);
  function win(stones,n){const own=distance(stones[0]),other=Math.min(...stones.slice(1).map(distance));
    if(n===1){
      const [x,offset]=ends[1].rivals[0],guard=stones[1];
      if(Math.hypot(guard.x-x,guard.y-tee-offset)>.001)return false;
    }
    return own<=1.829+r&&(n===2?other>1.829+r:own<other)}
  return {length,tee,hack,r,ends,rack,release,step,distance,win};
})();
