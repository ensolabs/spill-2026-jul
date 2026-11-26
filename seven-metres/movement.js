'use strict';
const Handball=(()=>{
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
  const add=(a,b)=>a.map((x,i)=>x+b[i]), sub=(a,b)=>a.map((x,i)=>x-b[i]), mul=(v,s)=>v.map(x=>x*s);
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0), len=v=>Math.hypot(...v), unit=v=>mul(v,1/(len(v)||1));
  const blend=(a,b,t)=>add(a,mul(sub(b,a),t));
  function chain(start,goal,pole,a,b){
    const axis=unit(sub(goal,start)),d=clamp(len(sub(goal,start)),Math.abs(a-b)+.001,a+b-.001);
    const along=(a*a-b*b+d*d)/(2*d), across=unit(sub(pole,mul(axis,dot(pole,axis))));
    return [start,add(add(start,mul(axis,along)),mul(across,Math.sqrt(Math.max(0,a*a-along*along)))),add(start,mul(axis,d))];
  }
  function release(p){return p.wait+p.count*p.beat+.91}
  function shooter(t,p){
    const rel=release(p),u=t-rel,phase=(t-p.wait)/p.beat,index=Math.floor(phase);
    const fake=phase>=0&&index<p.count?Math.sin(Math.PI*(phase-index))**2*(index%2?-p.first:p.first):0;
    const set=smooth((u+.88)/.50),swing=smooth((u+.21)/.21),follow=smooth(u/.33);
    const lean=.20*fake+p.side*(.21*set+.09*swing),z=7.50-.12*set-.10*swing;
    const hip=[lean*.46,.87-.07*Math.abs(fake)-.04*set,z];
    const chest=[lean,hip[1]+.50+.07*swing,z-.05*swing],turn=.22*fake+.34*set-.74*swing;
    const head=add(chest,[.025*lean,.27,-.025]),legs=[],arms=[];
    for(const d of [-1,1]){
      const foot=[d*.22+(d===p.side?.09*p.side*set:0),.09,d===-1?7.19:7.65-.10*swing];
      legs.push(chain(add(hip,[d*.135,0,0]),foot,[0,0,-1],.42,.43));
      const shoulder=add(chest,[d*.195,.005,d*turn*.42]);
      let wrist;
      if(d===1){
        const carry=add(shoulder,[.11,.02,-.30]);
        const cock=add(shoulder,[.30,p.high?.42:.08,.14]);
        const reach=add(shoulder,[p.side*.34,p.high?.22:-.29,-.47]);
        wrist=blend(blend(carry,cock,clamp(set+Math.abs(fake)*.70)),reach,swing);
        wrist=add(wrist,[-.19*follow,-.32*follow,0]);
      }else wrist=add(shoulder,[-.23-.12*Math.abs(fake),.04+.13*set-.26*swing,-.20]);
      arms.push(chain(shoulder,wrist,[d,.28,1],.31,.31));
    }
    return {hip,chest,head,legs,arms,facing:-1,footTurn:p.side*(.48*set+.20*swing)+.14*fake,ball:add(arms[1][2],[.016,.04,-.075])};
  }
  function keeper(s,t){
    const age=t-s.block;
    const power=Number.isFinite(age)?smooth(age/.22)*(1-smooth((age-.36)/.32))*s.power:0;
    const dx=s.dir*power,low=s.low;
    const hip=[s.x+dx*.18,.84-.17*low-.04*power,1.35],chest=add(hip,[dx*.18,.48-.05*low,.035]);
    const arms=[],legs=[];
    for(const d of [-1,1]){
      const extended=d===s.dir?power:power*.45;
      arms.push(chain(add(chest,[d*.216,.015,0]),add(chest,[d*(.34+.24*extended),.24-.57*low+extended*(.09-.23*low),.22-.10*extended]),[d,-.7,-.28],.325,.34));
      const foot=[s.feet[d===1?1:0]+d*extended*.19,.082+extended*(d===s.dir?.09:.01)+s.lift[d===1?1:0],1.36+d*.057];
      legs.push(chain(add(hip,[d*.14,0,0]),foot,[0,0,1],.43,.43));
    }
    return {hip,chest,head:add(chest,[.015*dx,.27,.01]),arms,legs,facing:1};
  }
  function flight(t,p){
    const rel=release(p);
    if(t<=rel)return shooter(t,p).ball;
    const f=clamp((t-rel)/.50),start=shooter(rel,p).ball;
    const point=blend(start,[p.x,p.y,0],f);
    point[1]+=.13*Math.sin(f*Math.PI);return point;
  }
  function distance(point,a,b){const axis=sub(b,a);return len(sub(point,add(a,mul(axis,clamp(dot(sub(point,a),axis)/(dot(axis,axis)||1))))))}
  function touches(ball,body){
    for(const limb of [...body.arms,...body.legs])for(let i=1;i<3;i++)if(distance(ball,limb[i-1],limb[i])<.19)return true;
    return distance(ball,body.hip,body.chest)<.28||len(sub(ball,body.head))<.21;
  }
  return {clamp,mix,smooth,blend,add,mul,sub,unit,dot,release,shooter,keeper,flight,touches};
})();
