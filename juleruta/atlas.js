'use strict';
function sleighAtlas(canvas){
  const c=canvas.getContext('2d'),W=800,H=410,D=Dispatch;
  const project=(lon,lat)=>[26+(lon+180)*748/360,35+(90-lat)*305/180];
  const continents=[
    [[-168,65],[-156,72],[-129,70],[-110,74],[-87,74],[-79,61],[-61,65],[-54,50],[-70,44],[-81,26],[-97,19],[-87,19],[-82,8],[-78,8],[-85,12],[-100,17],[-113,30],[-124,40],[-125,51],[-147,61]],
    [[-81,10],[-72,13],[-59,9],[-50,0],[-35,-6],[-40,-20],[-53,-34],[-66,-55],[-74,-48],[-72,-22],[-81,-5]],
    [[-74,81],[-45,84],[-20,79],[-23,66],[-43,59],[-52,68]],
    [[-10,36],[-8,43],[-2,44],[-5,48],[7,54],[10,59],[5,61],[20,71],[31,70],[21,61],[31,61],[43,69],[71,74],[105,77],[132,71],[164,69],[179,65],[171,57],[158,60],[146,48],[136,44],[129,34],[121,40],[120,26],[107,18],[106,10],[100,14],[103,2],[96,11],[93,21],[83,18],[78,8],[72,19],[60,25],[54,23],[48,13],[43,13],[35,29],[27,36],[23,38],[24,35],[15,38],[11,44],[3,42]],
    [[-17,15],[-14,28],[-5,36],[11,37],[31,31],[42,12],[51,12],[44,0],[40,-16],[32,-30],[20,-35],[12,-19],[9,-4],[2,5],[-8,5]],
    [[113,-21],[122,-16],[130,-12],[138,-16],[143,-11],[154,-27],[149,-38],[136,-35],[129,-31],[116,-35]],
    [[-180,-73],[-145,-75],[-104,-72],[-68,-64],[-54,-75],[-18,-72],[15,-70],[62,-66],[98,-66],[151,-70],[180,-77],[180,-90],[-180,-90]],
    [[-9,50],[-7,58],[-3,59],[2,51]],[[130,31],[141,44],[145,44],[138,34]],[[47,-13],[50,-15],[46,-26],[44,-23]],[[166,-46],[175,-37],[178,-37],[172,-44]],[[97,5],[107,-6],[105,-6]],[[109,1],[115,7],[119,0],[114,-4]],[[131,-3],[151,-7],[144,-9]],[[16,79],[22,80],[19,77]]
  ];
  const base=document.createElement('canvas');base.width=W;base.height=H;const g=base.getContext('2d');
  const sky=g.createLinearGradient(0,0,W,H);sky.addColorStop(0,'#122f3e');sky.addColorStop(1,'#1e4549');g.fillStyle=sky;g.fillRect(0,0,W,H);
  for(let lon=-180;lon<=180;lon+=30){const [x]=project(lon,0);g.fillStyle='#6d929226';g.fillRect(x,35,1,305)}
  for(let lat=-90;lat<=90;lat+=30){const [,y]=project(0,lat);g.fillRect(26,y,748,1)}
  for(const outline of continents){g.beginPath();outline.forEach(([lon,lat],i)=>{const [x,y]=project(lon,lat);if(i)g.lineTo(x,y);else g.moveTo(x,y)});g.closePath();g.fillStyle='#537c75';g.fill();g.strokeStyle='#91afa0';g.stroke()}
  g.font='bold 13px monospace';g.fillStyle='#d9dac3';g.fillText('ENSŌ  /  POLAR FLIGHT CONTROL',22,21);
  function dot(x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill()}
  return function draw(rows,time=null){
    c.drawImage(base,0,0);let from=project(0,90),sleigh=from;
    for(const r of rows){
      const hub=D.hubs[r.id],to=project(hub.lon,hub.lat),u=time===null?0:Math.max(0,Math.min(1,(time-r.depart)/(r.arrive-r.depart)));
      const mid=[(from[0]+to[0])/2,Math.min(from[1],to[1])-16];
      c.strokeStyle=time!==null&&time>=r.arrive?'#edbf89':'#ead7a073';c.lineWidth=1.8;c.setLineDash(time===null?[4,4]:[]);c.beginPath();c.moveTo(...from);c.quadraticCurveTo(...mid,...to);c.stroke();c.setLineDash([]);
      if(time!==null&&time>=r.depart)sleigh=from.map((v,i)=>(1-u)**2*v+2*u*(1-u)*mid[i]+u*u*to[i]);
      from=to;
    }
    rows.forEach((r,i)=>{const h=D.hubs[r.id],[x,y]=project(h.lon,h.lat),done=time!==null&&time>=r.end;
      dot(x,y,10,done?(r.ok?'#bce7af':'#e6a38e'):'#eed3a1');c.fillStyle='#1f393c';c.font='bold 13px monospace';c.textAlign='center';c.fillText(String(i+1),x,y+4)
    });
    const [sx,sy]=sleigh;c.save();c.translate(sx,sy-7);c.strokeStyle='#ffe0a4';c.lineWidth=2;c.beginPath();c.moveTo(-9,2);c.lineTo(4,2);c.lineTo(8,-2);c.stroke();c.fillStyle='#f08069';c.fillRect(-8,-5,11,6);dot(-3,-7,3,'#ffe3af');dot(11,-4,2,'#fec684');dot(16,-5,2,'#fec684');c.restore();
    c.textAlign='left';c.fillStyle='#e7d2ae';c.font='bold 16px monospace';c.fillText(time===null?'PLANNED TRACK':'SLEIGH TELEMETRY',23,386);
    c.textAlign='right';c.fillText(time===null?'24 DEC':D.clock(Math.floor(time))+' ELAPSED',776,386)
  }
}
