'use strict';
function ferryDisplay(canvas){
  const bg=document.createElement('canvas');bg.width=320;bg.height=160;
  const b=bg.getContext('2d'),c=canvas.getContext('2d');
  const sky='#202447',night='#292e56',violet='#514774',blue='#486491',ice='#a6c5cf',snow='#dedbc3',sea='#304661',gold='#edc787';
  const noise=n=>{const k=Math.sin(n*73.17+4)*3567;return k-Math.floor(k)};
  function rect(x,y,w,h,col){b.fillStyle=col;b.fillRect(x,y,w,h)}
  function poly(pts,col){b.fillStyle=col;b.beginPath();pts.forEach(([x,y],i)=>i?b.lineTo(x,y):b.moveTo(x,y));b.closePath();b.fill()}
  rect(0,0,320,160,sky);
  // Build the skyline one native pixel at a time to keep its silhouette crisp.
  for(let x=0;x<320;x++){
    const wave=Math.round(23+8*Math.sin(x*.027)+9*Math.sin(x*.009));
    for(let j=0;j<16;j++){
      const y=wave-j+Math.round(2*Math.sin(x*.12));
      if(noise(x*23+j)>.22+j*.039)rect(x,y,1,1,j<5?'#69a49a':'#457880');
    }
    const distant=Math.round(52+9*Math.sin(x*.048)+4*Math.sin(x*.109));
    rect(x,distant,1,92-distant,violet);if(Math.sin(x*.057)>.25)rect(x,distant,1,1+Math.floor(noise(x)*3),'#9f8fa2');
    const ridge=Math.round(67+12*Math.sin(x*.037+.4)+6*Math.sin(x*.081));
    rect(x,ridge,1,96-ridge,blue);if(Math.cos(x*.037+.4)>.11)rect(x,ridge,1,2+Math.floor(noise(x+33)*3),ice);
  }
  for(let i=0;i<77;i++)rect(Math.floor(noise(i+81)*320),Math.floor(noise(i+24)*46),1,1,i%4?ice:snow);
  for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++)if(x*x+y*y<=48&&(x-4)**2+(y+3)**2>45)rect(250+x,24+y,1,1,gold);
  rect(0,94,320,66,sea);
  for(let i=0;i<640;i++){const y=94+Math.floor(noise(i+200)*66);rect(Math.floor(noise(i+20)*320),y,1+Math.floor(noise(i)*((y-90)/10)),1,i%3?night:blue)}
  for(let i=0;i<35;i++){
    const x=i*10-4,y=87+Math.floor(noise(i)*6),h=5+Math.floor(noise(i+17)*7);
    poly([[x-4,y],[x,y-h],[x+4,y]],night);
  }
  for(let i=0;i<12;i++){const x=i*29+2,y=90+Math.floor(noise(i+2)*4);rect(x,y-4,9,5,i%2?'#79505e':'#555570');poly([[x-2,y-4],[x+4,y-9],[x+11,y-4]],snow);rect(x+1,y-3,2,2,gold);rect(x+6,y-3,2,2,gold)}
  rect(0,94,320,1,ice);
  // Passenger ferry, warm cabin windows and broken reflections below the hull.
  for(let i=0;i<90;i++)rect(107+Math.floor(noise(i+90)*68),125+Math.floor(noise(i+73)*23),1+i%5,1,i%4?'#665c68':'#a18476');
  poly([[90,115],[182,115],[193,111],[184,122],[104,123]],'#1d2c44');
  poly([[93,116],[182,116],[189,114],[184,118],[98,119]],'#b46a67');
  poly([[100,114],[107,105],[166,105],[176,109],[186,109],[183,114]],snow);
  rect(119,99,43,6,ice);rect(126,94,6,5,'#ac6865');rect(126,93,6,2,sky);
  rect(153,89,1,11,ice);poly([[154,90],[161,91],[154,93]],'#cf8480');
  for(let x=109;x<168;x+=6){rect(x,107,4,4,night);rect(x,108,3,2,gold)}
  for(let x=122;x<159;x+=6)rect(x,100,4,3,blue);
  const sprites={
    star:['....#....','....#....','...###...','..#####..','#########','..#####..','...###...','....#....','....#....'],
    lamp:['...###...','..#####..','..#ooo#..','..#ooo#..','..#####..','....#....','....#....','....#....','...###...'],
    pine:['....#....','...###...','..#####..','...###...','..#####..','.#######.','#########','....o....','....o....'],
    buoy:['....o....','...ooo...','....#....','...###...','..#####..','..ooooo..','.#######.','#########','..ooooo..']
  };
  return function draw(job,frame,limit,trace,selected){
    c.drawImage(bg,0,0);
    for(const t of job.targets){
      const active=t.id===selected;
      c.fillStyle=active?'#ffdfa6':'#b8aac5';c.font='bold 8px monospace';c.fillText(t.id,t.x+11,t.y+7);
      for(let i=0;i<9;i++){
        const y=t.y+i;
        if(y>limit||!frame?.rows[y].includes(t.id))continue;
        for(let x=0;x<9;x++){const p=sprites[t.kind][i][x];if(p==='.')continue;
          if(p==='#'||p==='o'){c.fillStyle=p==='o'?gold:({star:'#fff0bc',pine:'#94cbb3',buoy:'#e08f79',lamp:snow})[t.kind];c.fillRect(t.x+x,y,1,1)}
        }
      }
      if(active||!frame||frame.counts[t.id]<9){c.fillStyle=active?gold:'#96849d';for(const [dx,dy] of [[-2,-2],[9,-2],[-2,10],[9,10]])c.fillRect(t.x+dx,t.y+dy,2,1)}
    }
    if(trace!==null){c.fillStyle='#c1ffcd99';c.fillRect(0,trace,320,1);c.fillStyle='#efffd3';c.fillRect(0,trace-1,4,3)}
  };
}
