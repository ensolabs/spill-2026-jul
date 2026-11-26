'use strict';
// Measure distance along the rails so wagons keep a constant spacing through the bends.
const Rail=(()=>{
 const path=[],dist=[0],N=800;
 for(let i=0;i<=N;i++){
   const a=i*2*Math.PI/N,p={x:25*Math.sin(a),z:12*Math.sin(2*a)};path.push(p);
   if(i)dist.push(dist[i-1]+Math.hypot(p.x-path[i-1].x,p.z-path[i-1].z));
 }
 const length=dist[N],half=length/2,brake=4.8,pitch=2.1;
 function at(distance){
   const s=((distance%length)+length)%length;let lo=0,hi=N;
   while(hi-lo>1){const m=(lo+hi)>>1;if(dist[m]<=s)lo=m;else hi=m}
   const a=path[lo],b=path[hi],f=(s-dist[lo])/(dist[hi]-dist[lo]);
   return {x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f,yaw:Math.atan2(b.x-a.x,b.z-a.z)};
 }
 class Desk{
   constructor(){this.time=0;this.score=0;this.late=0;this.selected=0;this.owner=null;this.trains=[];this.message='The local is approaching signal A.';this.add(-17)}
   add(s){
     const id=this.trains.length,freight=id===2;
     this.trains.push({id,name:['Fjord local','Night express','Timber freight','Coast sleeper'][id],cars:freight?5:3,freight,s,start:s,next:Math.ceil(s/half),speed:freight?5.25:5.7+id*.09,delay:0,lap:0,stopped:false,misses:0});
   }
   switch(){this.selected=1-this.selected}
   step(dt){
     if(this.late>=3)return;
     this.time+=dt;
     // Introduce each service into a clear stretch of track.
     const n=this.trains.length;
     if(n<4&&this.time>[0,13,35,65][n]){
       const s=[17,32,47].map(offset=>(n%2?half:0)-offset).find(pos=>
         this.trains.every(t=>Math.abs(((t.s-pos+length*100+.5*length)%length)-.5*length)>16));
       if(s!==undefined){
         this.add(s);this.message=this.trains[n].name+' has joined the line.';
       }
     }
     for(const t of this.trains){
       const target=t.next*half,stop=target-brake;
       let travel=t.speed*dt;
       for(const other of this.trains){
         if(other===t)continue;
         const gap=(other.s-t.s+length*100)%length;
         travel=Math.min(travel,Math.max(0,gap-(other.cars-1)*pitch-3));
       }
       if(this.owner!==t&&t.s+travel>=stop-.001){
         if(this.owner===null&&this.selected===(t.next%2)){this.owner=t}
         else travel=Math.min(travel,Math.max(0,stop-t.s));
       }
       t.stopped=travel<.001;
       t.delay+=dt-travel/t.speed;t.s+=travel;
       if(this.owner===t&&t.s>=target+(t.cars-1)*pitch+2){
         this.owner=null;t.next++;this.message=t.name+' clear. Tail past the points.';
       }
       // A held train can miss its booked arrival even while it is still at a signal.
       const allowance=8+t.misses*length/t.speed;
       if(!t.freight&&t.delay>allowance){
         this.late++;t.misses++;this.message=t.name+' missed its booked arrival.';
         if(this.late>=3)return;
       }
       const lap=Math.floor((t.s-t.start)/length);
       if(lap>t.lap){
         t.lap=lap;
         if(!t.freight){
           if(!t.misses){this.score++;this.message=t.name+' on time. +1';}
         }
         t.delay=0;t.misses=0;
       }
     }
   }
 }
 return {at,length,half,pitch,Desk};
})();
