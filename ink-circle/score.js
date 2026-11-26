'use strict';
function scoreStroke(points, sheetSize) {
  const clamp = value => Math.max(0, Math.min(1, value));
  const tau = 2 * Math.PI;
  const count = 128;
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i-1], b = points[i];
    distances.push(distances[i-1] + Math.hypot(b.x-a.x, b.y-a.y));
  }
  const length = distances.at(-1);
  const zero = 0;
  if (!length) return zero;

  // Equal arc-length spacing gives the same geometry to fast and slow input devices.
  const samples = [];
  let segment = 1;
  for (let i = 0; i < count; i++) {
    const at = length * i / (count-1);
    while (segment < points.length-1 && distances[segment] <= at) segment++;
    const a = points[segment-1], b = points[segment];
    const f = (at-distances[segment-1]) / (distances[segment]-distances[segment-1] || 1);
    samples.push({x:a.x+(b.x-a.x)*f, y:a.y+(b.y-a.y)*f});
  }

  // Fit the circle to the ink itself so a deliberate gap does not shift its centre.
  const mx = samples.reduce((s,p)=>s+p.x,0)/count, my = samples.reduce((s,p)=>s+p.y,0)/count;
  let xx=0, yy=0, xy=0, xr=0, yr=0;
  for (const p of samples) {
    const x=p.x-mx, y=p.y-my, r2=x*x+y*y;
    xx+=x*x; yy+=y*y; xy+=x*y; xr+=x*r2; yr+=y*r2;
  }
  const det=xx*yy-xy*xy;
  if (det <= (xx+yy)**2 * 1e-6) return zero;
  const cx=mx+(yy*xr-xy*yr)/(2*det), cy=my+(xx*yr-xy*xr)/(2*det);
  const polar=samples.map(p=>({a:Math.atan2(p.y-cy,p.x-cx),r:Math.hypot(p.x-cx,p.y-cy)}));
  const radius=polar.reduce((s,p)=>s+p.r,0)/count;
  const ordered=polar.slice().sort((a,b)=>a.a-b.a);
  let largestGap=0;
  for(let i=0;i<count;i++){
    const next=ordered[(i+1)%count].a+(i===count-1?tau:0);
    largestGap=Math.max(largestGap,next-ordered[i].a);
  }
  const sweep=tau-largestGap;
  const coverage=clamp(sweep/(tau*.75));
  const pts=value=>250*clamp(value)*coverage;
  const diameter=2*radius/sheetSize;
  const margin=Math.min(...samples.map(p=>Math.min(p.x,p.y,sheetSize-p.x,sheetSize-p.y)))/sheetSize;
  const size=pts(clamp(diameter/.56)*clamp((margin+.035)/.065));

  let radialError=0, oppositeError=0, pairs=0, turnSum=0, roughness=0, previousTurn=null;
  for(let i=0;i<count;i++){
    const p=polar[i]; radialError+=((p.r-radius)/radius)**2;
    // Compare only opposite angles where there is ink on both sides.
    let nearest=null, angleError=Infinity;
    for(const other of ordered){
      const error=Math.abs(Math.PI-Math.abs(p.a-other.a));
      if(error<angleError){angleError=error; nearest=other}
    }
    if(angleError<.1){oppositeError+=Math.abs(nearest.r-p.r)/radius;pairs++}
    if(i===0||i===count-1)continue;
    const a=samples[i-1], b=samples[i], c=samples[i+1];
    const u=b.x-a.x,v=b.y-a.y,w=c.x-b.x,h=c.y-b.y;
    const turn=Math.atan2(u*h-v*w,u*w+v*h);
    if(previousTurn!==null)roughness+=Math.abs(turn-previousTurn);
    previousTurn=turn;turnSum+=Math.abs(turn);
  }
  const style=pts(1-roughness/(tau*2)-Math.max(0,turnSum-tau*1.1)/tau);
  const symmetry=pairs?pts(1-2.8*oppositeError/pairs):0;
  const circularity=pts(1-3*Math.sqrt(radialError/count)-Math.max(0,length/(tau*radius)-1.08));
  return Math.round(size+style+symmetry+circularity);
}
