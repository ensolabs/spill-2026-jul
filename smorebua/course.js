'use strict';
const Course=(()=>{
 const length=560,crest=245;
 const waxes=[
   {name:'Blue',range:'−8 to −4°C',bite:.70,drag:.022,color:'#497bb4'},
   {name:'Violet',range:'−4 to −1°C',bite:.97,drag:.042,color:'#8c649c'},
   {name:'Red',range:'−1 to +2°C',bite:1.13,drag:.115,color:'#bd5148'}
 ];
 function slope(d){
   if(d<crest)return .072+.036*Math.sin(d/37)+.031*Math.sin(Math.PI*d/crest);
   return -.066-.051*Math.sin(Math.PI*(d-crest)/(length-crest))+.026*Math.sin(d/30);
 }
 const elevation=[0];
 for(let d=1;d<=length;d++)elevation[d]=elevation[d-1]+slope(d-.5);
 function height(d){const m=Math.floor(d);if(m<0)return d*slope(0);if(m>=length)return elevation[length]+(d-length)*slope(length);return elevation[m]+(d-m)*slope(m)}
 const snowReports=[
   {temp:'−3°C',name:'Fresh snow',detail:'Fine, dry crystals'},
   {temp:'−7°C',name:'Overnight frost',detail:'Cold shaded climb · abrasive descent'},
   {temp:'−1°C',name:'Coastal thaw',detail:'Damp climb · glazed tracks downhill'}
 ];
 function simulate(wax,zone,snow=0){
   const w=waxes[wax],times=[0],bite=w.bite*zone/50;
   let v=3.6,slips=0;
   for(let d=0;d<length;d++){
     const grade=slope(d),load=.59+3.6*Math.max(grade,0);
     // Practice weather changes grip on the climb and drag on the descent separately.
     let grip=bite, extraDrag=0;
     if(snow===1){
       grip*= [1.33,1.04,.94][wax];
       extraDrag=[0,.068,.13][wax]*(d<crest?.65:1);
     }else if(snow===2){
       grip*= [.76,.84,1.01][wax];
       extraDrag=[.08,.05,.014][wax]*(d<crest?.75:1.25);
     }
     const loss=Math.max(0,load-grip);
     if(d<crest&&loss>.075)slips++;
     const friction=.145+extraDrag+w.drag*(zone/50)**1.8+.12*(zone/50)**2;
     const push=grade>0?1.83*Math.max(.32,1-loss*2.25):.42;
     const acceleration=push-9.81*grade-friction-.014*v*v;
     const next=Math.max(1.5,Math.sqrt(Math.max(0,v*v+2*acceleration)));
     times.push(times[d]+2/(next+v));v=next;
   }
   return {wax,zone,snow,times,up:times[crest],down:times[length]-times[crest],total:times[length],slips};
 }
 function distance(run,time){
   if(time>=run.total)return length;
   let lo=0,hi=length;while(hi-lo>1){const m=(lo+hi)>>1;if(run.times[m]<=time)lo=m;else hi=m}
   return lo+(time-run.times[lo])/(run.times[lo+1]-run.times[lo]);
 }
 return {length,crest,waxes,snowReports,height,slope,simulate,distance};
})();
