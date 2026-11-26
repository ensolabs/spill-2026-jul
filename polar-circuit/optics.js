'use strict';
// Cell coordinates run east and south. A splitter both reflects and transmits.
const ice=0,rose=1;
const levels=[
 {name:'Cold start',brief:'Turn the two mirrors to carry the ice beam into the cyan receiver.',sources:[[0,3,0,ice]],receivers:[[5,1,ice]],mirrors:[[2,3],[2,1]],blocks:[[4,3],[0,0],[3,4],[5,5]],start:[1,1]},
 {name:'Switchback',brief:'Route around the compute racks. A beam ends when it reaches a rack or leaves the board.',sources:[[0,4,0,ice]],receivers:[[5,2,ice]],mirrors:[[1,4],[1,1],[4,1],[4,2]],blocks:[[2,4],[5,1],[2,2],[3,3],[0,0]],start:[1,1,0,0]},
 {name:'Fan-out',brief:'The fork on junction 01 marks a splitter. One pulse passes straight through while a second reflects.',sources:[[0,3,0,ice]],receivers:[[5,1,ice],[4,5,ice]],mirrors:[[2,3,true],[2,1],[4,3]],blocks:[[3,4],[5,3],[0,1],[4,0]],start:[1,1,0]},
 {name:'Cross traffic',brief:'Match each wavelength to its receiver. Beams can cross in an empty cell.',sources:[[0,1,0,ice],[0,4,0,rose]],receivers:[[5,5,ice],[5,0,rose]],mirrors:[[2,1],[2,5],[4,4],[4,0]],blocks:[[3,1],[5,4],[1,3],[3,3]],start:[0,0,1,1]},
 {name:'Polar mesh',brief:'Bring all four receivers online together. Each wavelength has its own splitter and two destinations.',sources:[[0,2,0,ice],[0,4,0,rose]],receivers:[[0,0,ice],[5,1,ice],[5,5,rose],[3,3,rose]],mirrors:[[1,2,true],[1,0],[4,2],[4,1],[2,4,true],[2,5],[5,4],[5,3]],blocks:[[3,0],[0,5],[1,3]],start:[1,0,1,1,0,1,1,1]}
];
function trace(level,orient){
 const segments=[],lit=new Set(),visited=new Set(),queue=level.sources.map(s=>s.slice());
 while(queue.length){
   const [x,z,d,color]=queue.pop(),key=[x,z,d,color].join(':');
   if(visited.has(key))continue;visited.add(key);
   const nx=x+[1,0,-1,0][d],nz=z+[0,1,0,-1][d];
   if(nx<0||nz<0||nx>5||nz>5){segments.push([x,z,(x+nx)/2,(z+nz)/2,color]);continue}
   segments.push([x,z,nx,nz,color]);
   const at=([px,pz])=>px===nx&&pz===nz,receiver=level.receivers.findIndex(at);
   if(receiver!==-1){if(level.receivers[receiver][2]===color)lit.add(receiver);continue}
   if(level.blocks.some(at)||level.sources.some(at))continue;
   const i=level.mirrors.findIndex(at);
   if(i===-1||level.mirrors[i][2])queue.push([nx,nz,d,color]);
   if(i!==-1)queue.push([nx,nz,d^(orient[i]?1:3),color]);
 }
 return {segments,lit,solved:lit.size===level.receivers.length};
}
