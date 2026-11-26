'use strict';
function skiBroadcast(canvas){
 const g=canvas.getContext('2d');let w=0,h=0,dpr=1;
 function resize(){w=canvas.clientWidth;h=canvas.clientHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 new ResizeObserver(resize).observe(canvas);resize();
 const noise=n=>{const r=Math.sin(n*91.78+14)*19341;return r-Math.floor(r)};
 function shape(p,c){g.fillStyle=c;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()}
 function line(p,c,n=1){g.strokeStyle=c;g.lineWidth=n;g.lineCap='round';g.lineJoin='round';g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke()}
 function circle(x,y,r,c){g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,7);g.fill()}
 function rect(x,y,a,b,c){g.fillStyle=c;g.fillRect(x,y,a,b)}
 function tree(x,y,t,c,snow){rect(x-t*.026,y-t*.28,t*.06,t*.28,c);for(let k=0;k<4;k++){
   let top=y-t*(1-k*.17),base=y-t*(.62-k*.17),r=t*(.11+k*.029);
   shape([[x,top],[x+r,base],[x+r*.35,base-2],[x+r*.46,base+2],[x-r,base]],c);
   shape([[x,top],[x+r*.47,top+(base-top)*.5],[x,top+(base-top)*.39],[x-r*.62,top+(base-top)*.66]],snow);
 }}
 function mountains(offset,base,amp,spacing,col,shade,ice,seed){
   let first=Math.floor(offset/spacing)-2;for(let i=first;i<first+Math.ceil(w/spacing)+5;i++){
   const x=i*spacing-offset,y=base-amp*(.4+.6*noise(i+seed));
   shape([[x-spacing,base+5],[x,y],[x+spacing,base+5]],col);
   shape([[x,y],[x+spacing,base+5],[x+spacing*.37,base+5],[x+spacing*.13,y+(base-y)*.47],[x+spacing*.17,y+(base-y)*.48]],shade);
   shape([[x,y],[x+spacing*.35,y+(base-y)*.35],[x+spacing*.18,y+(base-y)*.26],[x+spacing*.22,y+(base-y)*.37],[x+spacing*.03,y+(base-y)*.24],[x-spacing*.14,y+(base-y)*.33],[x-spacing*.12,y+(base-y)*.22],[x-spacing*.43,y+(base-y)*.43]],ice);
 }}
 function skier(x,y,scale,angle,t,tuck,ghost){
   g.save();g.translate(x,y);g.rotate(angle);g.scale(scale,scale);if(ghost)g.globalAlpha=.55;
   const sin=Math.sin(t),body=ghost?'#3d8ca0':'#c34328',dark=ghost?'#366b81':'#233e3e',paper=ghost?'#b7eeee':'#fff2d3';
   const lean=tuck?12:4,hip=[0,-22+(tuck?6:Math.abs(sin)*2)],shoulder=[lean+4,hip[1]-(tuck?9:16)];
   for(let k=0;k<2;k++){const f=k?sin:-sin,foot=[tuck?k*5-3:f*13,0],knee=[foot[0]*.48+(tuck?9:5),-12];
    line([[foot[0]-19,1],[foot[0]+22,1],[foot[0]+26,-1],[foot[0]+28,-3]],k?'#274d46':'#6b7d6a',2);
    line([hip,knee,foot],k?dark:'#56746b',k?5:4);line([[foot[0]-2,0],[foot[0]+5,0]],'#243735',4);
   }
   line([hip,shoulder],body,10);line([[hip[0]+1,hip[1]-3],[shoulder[0]-1,shoulder[1]+5]],paper,8);
   const head=[shoulder[0]+3,shoulder[1]-7];circle(...head,5.4,'#cd966d');circle(head[0]-.5,head[1]-2.7,5,body);line([[head[0]-4,head[1]-1],[head[0]+5,head[1]-1]],dark,2);
   for(let k=0;k<2;k++){const f=k?sin:-sin,hand=[shoulder[0]+(tuck?8:3+f*14),shoulder[1]+(tuck?10:9-f*4)];
    line([shoulder,[shoulder[0]+(tuck?0:f*4),shoulder[1]+10],hand],k?body:dark,3.7);
    const tip=[hand[0]-(tuck?40:12-f*7),tuck?hand[1]+13:1];line([hand,tip],dark,1.3);circle(...hand,2.3,dark);
   }g.restore();
 }
 return function draw(distance,ghostDistance,t,active){
  if(!w||!h)return;
  g.setTransform(dpr,0,0,dpr,0,0);
  const sky=g.createLinearGradient(0,0,0,h*.72);sky.addColorStop(0,'#8fbbb7');sky.addColorStop(.64,'#f0d6b6');sky.addColorStop(1,'#ffe9c7');g.fillStyle=sky;g.fillRect(0,0,w,h);
  const sunX=w*.73-distance*.045;circle(sunX,h*.24,h*.15,'#ffddac');circle(sunX,h*.24,h*.117,'#ffecc9');
  mountains(distance*.16,h*.49,h*.32,86,'#b8c8c4','#98b6b6','#f6eddb',19);
  mountains(distance*.34+76,h*.58,h*.25,108,'#89aaa1','#73958f','#dde1cf',52);
  const hill=x=>h*(.56+.04*Math.sin((x+distance*.7)/155));
  let edge=[];for(let x=-5;x<w+10;x+=8)edge.push([x,hill(x)]);shape([...edge,[w,h],[0,h]],'#b3c9bd');
  for(let layer=0;layer<2;layer++){
   const sep=layer?26:12,scroll=distance*(layer?1.65:.8),first=Math.floor(scroll/sep)-2;
   for(let i=first;i<first+w/sep+5;i++){const x=i*sep-scroll+noise(i)*6;tree(x,hill(x)+18+layer*17,(15+noise(i+layer*81)*27)*(layer?1.4:.8),layer?'#628c7e':'#88a899',layer?'#c8d7c7':'#d5ddca')}
  }
  const u=Math.min(9,w/60),origin=w*.38,baseline=h*.765;
  const px=m=>origin+(m-distance)*u;
  const py=m=>baseline-(Course.height(m)-Course.height(distance))*u*1.48;
  const from=Math.floor(distance-origin/u)-2,to=Math.ceil(distance+(w-origin)/u)+2;
  const path=[];for(let m=from;m<=to;m+=2)path.push([px(m),py(m)]);
  // Two grooves follow the exact elevation used by the race simulation.
  shape([...path.map(([x,y])=>[x,y-9]),[w+35,h],[ -35,h]],'#ecf0de');
  line(path.map(([x,y])=>[x,y+8]),'#c2d5c6',2);line(path.map(([x,y])=>[x,y+13]),'#b7cfc2',2);
  shape([...path.map(([x,y])=>[x,y+32]),[w+35,h],[-35,h]],'#d4e3d6');
  for(let m=Math.floor(from/7)*7;m<to;m+=7){const x=px(m);line([[x,py(m)+41],[x+16,py(m)+40]],'#c3d8cc',1.4)}
  for(let m=Math.floor(from/18)*18;m<to;m+=18){
    const x=px(m),y=py(m)-10;if(m<0||m>Course.length)continue;
    rect(x,y-20,2,20,'#696e56');shape([[x+2,y-20],[x+15,y-17],[x+2,y-13]],m%36?'#c75538':'#477e75');
  }
  function gate(m,word){const x=px(m),y=py(m)-9;if(x< -100||x>w+100)return;
    line([[x-39,y],[x-39,y-72],[x+39,y-72],[x+39,y]],'#986a45',4);
    rect(x-44,y-80,88,20,'#285346');rect(x-44,y-80,88,3,'#f69d62');
    g.textAlign='center';g.fillStyle='#fff0d7';g.font='bold 10px monospace';g.fillText(word,x,y-66);
  }gate(-2,'START');gate(Course.crest,'MELLOMTID');gate(Course.length,'MÅL');
  if(ghostDistance!==null)skier(px(ghostDistance),py(ghostDistance)-7,Math.min(1.27,w/380),-Math.atan(Course.slope(ghostDistance)*1.48),ghostDistance*.64,ghostDistance>=Course.crest,true);
  skier(origin,baseline+2,Math.min(1.45,w/300),-Math.atan(Course.slope(distance)*1.48),distance*.64+(active?0:.12*Math.sin(t)),distance>=Course.crest,false);
  for(let i=0;i<48;i++){const x=(noise(i+32)*w+t*(4+noise(i)*6))%w,y=(noise(i+132)*h+t*(6+noise(i+6)*12))%h;circle(x,y,i%4===0?1.6:.85,'#ffffedbd')}
 };
}
