'use strict';
const Channel=(()=>{
  const west={x:48,y:133,name:'Vestvik'},east={x:336,y:111,name:'Austnes'};
  const gates=[{x:110,y:110},{x:190,y:77},{x:269,y:91}],half=22;
  const cargo=[{cars:3,people:12},{cars:5,people:18},{cars:4,people:15}];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const bank=(side,y)=>side===0?26+7*Math.sin(y*.043)+6*Math.cos(y*.091):357+6*Math.sin(y*.037)-5*Math.cos(y*.096);
  const departure=n=>n%2?east:west,arrival=n=>n%2?west:east;
  const route=n=>n%2?[...gates].reverse():gates;
  const speed=s=>Math.hypot(s.vx,s.vy);
  const trafficX=gates[0].x+5, pier={x:338,y:86}, launchSpeed=36;
  const north=[trafficX,-12],south=[trafficX,224];
  const trafficRoutes=[
    [south,north], [north,south],
    [south,[trafficX,94],[116,86],[119,81],[126,76],[176,53],[190,48],[202,49],[269,62],[318,77],[329,84],[pier.x,pier.y]]
  ];
  function vessel(n,heading=0){
    const port=departure(n),westbound=n%2===1,point=trafficRoutes[n][0];
    const engine=(westbound?-1:1)*(Math.cos(heading)<0?-1:1);
    return {x:port.x,y:port.y,h:heading,vx:0,vy:0,yaw:0,
      leg:n,gate:0,engine,travelSign:engine,aim:null,cool:0,notice:'',moored:false,
      boat:{state:'waiting',departureIn:null,x:point[0],y:point[1],h:westbound?Math.PI/2:-Math.PI/2,waypoint:1,wash:[],washTime:0,contact:false}};
  }
  function moveBoat(s,dt){
    const b=s.boat,path=trafficRoutes[s.leg];
    if(b.state==='waiting'){
      // Once the skipper calls in at mid-fjord, the boat keeps its own timetable.
      if(s.leg===1&&s.gate>=2){
        if(b.departureIn===null){
          const run=trafficX-s.x,rise=gates[0].y-s.y;
          const ferryETA=Math.hypot(run,rise)/Math.max(8,-s.vx);
          b.departureIn=Math.max(0,ferryETA-(gates[0].y-6-north[1])/launchSpeed);
        }
        b.departureIn-=dt;
      }
      const due=s.leg===0?s.gate>=1:s.leg===1?
        b.departureIn!==null&&b.departureIn<=0:
        s.x>west.x+16;
      if(!due)return;
      b.state='running';
    }
    if(b.wash.length){
      for(const w of b.wash)w.age+=dt;
      b.wash=b.wash.filter(w=>w.age<1.15);
    }
    if(b.state!=='running')return;
    let distance=launchSpeed*dt;
    if(s.leg===2)distance*=clamp(Math.hypot(b.x-pier.x,b.y-pier.y)/26,.14,1);
    while(distance>0&&b.waypoint<path.length){
      const [x,y]=path[b.waypoint],dx=x-b.x,dy=y-b.y,length=Math.hypot(dx,dy);
      b.h=Math.atan2(dy,dx);
      if(distance<length){b.x+=dx*distance/length;b.y+=dy*distance/length;break}
      b.x=x;b.y=y;distance-=length;b.waypoint++;
    }
    if(b.waypoint===path.length)b.state=s.leg===2?'docked':'clear';
    b.washTime+=dt;
    if(b.washTime>=.12){b.washTime=0;b.wash.push({x:b.x-6*Math.cos(b.h),y:b.y-6*Math.sin(b.h),h:b.h,age:0})}
    if(s.moored)return;
    // Measure clearance along the ferry's deck, including when she is running stern-first.
    const dx=b.x-s.x,dy=b.y-s.y,along=dx*Math.cos(s.h)+dy*Math.sin(s.h),across=-dx*Math.sin(s.h)+dy*Math.cos(s.h);
    const clearance=Math.hypot(Math.max(0,Math.abs(along)-6),across);
    if(clearance>15)b.contact=false;
    if(clearance<9&&!b.contact){
      b.contact=true;s.engine=0;s.vx*=.18;s.vy*=.18;s.notice='Boat contact! Engine stopped. Let her clear, then select power.';s.cool=4;
    }
  }
  function warn(s,msg){if(s.cool<=0){s.notice=msg;s.cool=2.5}}
  function step(s,dt,helm){
    if(s.moored)return;
    s.cool=Math.max(0,s.cool-dt);
    const direction=s.leg%2?-1:1,g=route(s.leg)[s.gate],dock=arrival(s.leg);
    const forward=s.vx*Math.cos(s.h)+s.vy*Math.sin(s.h);
    if(Math.abs(forward)>1)s.travelSign=Math.sign(forward);
    else if(s.engine)s.travelSign=Math.sign(s.engine);
    let rudder=helm;
    if(helm)s.aim=null;
    else if(s.aim){
      // Counter sideways drift without turning back towards a mark already abeam.
      const bearing=Math.atan2(s.aim.y-s.y,s.aim.x-s.x);
      const across=s.vy*Math.cos(bearing)-s.vx*Math.sin(bearing);
      const angle=bearing-clamp(across*.10,-.62,.62)+((Math.sign(s.engine)||s.travelSign)<0?Math.PI:0);
      if(Math.hypot(s.aim.x-s.x,s.aim.y-s.y)<15)s.aim=null;
      else rudder=s.travelSign*clamp(2.3*wrap(angle-s.h)-1.25*s.yaw,-1,1);
    }
    const steer=(.33+.49*Math.min(1,speed(s)/15))*rudder*s.travelSign;
    s.yaw+=(steer-s.yaw)*(1-Math.exp(-dt/1.05));s.h=wrap(s.h+s.yaw*dt);
    // Momentum is world-relative: turning the bow does not turn the existing velocity.
    const target=Math.sign(s.engine)*[0,13,23][Math.abs(s.engine)],tau=s.engine===0?6.2:(3.4+cargo[s.leg].cars*.19);
    const f=1-Math.exp(-dt/tau);
    s.vx+=(Math.cos(s.h)*target-s.vx)*f;s.vy+=(Math.sin(s.h)*target-s.vy)*f;
    const oldX=s.x,oldY=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(g&&(oldX-g.x)*direction<=0&&(s.x-g.x)*direction>0){
      const y=oldY+(s.y-oldY)*(g.x-oldX)/(s.x-oldX);
      if(Math.abs(y-g.y)<=half-4){s.gate++;s.notice='Gate '+s.gate+' clear.';s.cool=.95}
      else warn(s,'Missed the lit gate. Circle back and pass between its buoys.');
    }
    for(const gate of gates)for(const dy of [-half,half]){
      const dx=s.x-gate.x,ey=s.y-gate.y-dy,dist=Math.hypot(dx,ey);
      if(dist<6.0){const nx=dist?dx/dist:-direction,ny=dist?ey/dist:0;
        s.x=gate.x+nx*6.05;s.y=gate.y+dy+ny*6.05;
        const inward=Math.min(0,s.vx*nx+s.vy*ny);s.vx-=inward*nx*1.3;s.vy-=inward*ny*1.3;warn(s,'Buoy contact. Ease off and give it room.')}
    }
    const x=clamp(s.x,bank(0,s.y)+9,bank(1,s.y)-9),y=clamp(s.y,11,200);
    if(s.x!==x||s.y!==y){if(s.x!==x)s.vx*=-.23;if(s.y!==y)s.vy*=-.23;s.x=x;s.y=y;warn(s,'Shallow water. Steer back into the fjord.')}
    if(s.gate===gates.length&&Math.hypot(s.x-dock.x,s.y-dock.y)<14){
      if(speed(s)<=7&&s.engine===0){s.moored=true;s.vx=s.vy=0}
      else warn(s,'Berth ahead. Select STOP and coast in below 7 on the speed gauge.');
    }
    moveBoat(s,dt);
  }
  return {west,east,gates,half,pier,cargo,bank,departure,arrival,route,speed,vessel,step,moveBoat,clamp};
})();
