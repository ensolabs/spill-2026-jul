'use strict';
function fjordView(canvas){
  const D=District,c=canvas.getContext('2d');
  let W,H,scale,cx=0,cy=12,tag=null;
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);W=r.width;H=r.height;c.setTransform(d,0,0,d,0,0);scale=Math.min(6.3,Math.max(3.6,W/125))}
  new ResizeObserver(resize).observe(canvas);resize();
  function p(x,y,z=0){return [W*.5+(x-cx-(y-cy))*.84*scale,H*.52+(x-cx+y-cy)*.47*scale-z*scale]}
  function shape(pts,col){c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
  function line(a,b,col,width=1){c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke()}
  function disc(x,y,z,r,col){const [a,b]=p(x,y,z);c.fillStyle=col;c.beginPath();c.arc(a,b,Math.max(.1,r*scale),0,7);c.fill()}
  function plane(x,y,w,d,z,col){shape([p(x,y,z),p(x+w,y,z),p(x+w,y+d,z),p(x,y+d,z)],col)}
  function cuboid(x,y,w,d,z,h,top,front,side){const a=x-w/2,b=y-d/2,X=a+w,Y=b+d,Z=z+h;
    shape([p(a,Y,z),p(X,Y,z),p(X,Y,Z),p(a,Y,Z)],front);
    shape([p(X,b,z),p(X,Y,z),p(X,Y,Z),p(X,b,Z)],side);plane(a,b,w,d,Z,top)
  }
  function cabin(b){
    cuboid(b.x,b.y,b.w,b.d,0,b.h,'#e3e2e9',b.tint,'#69576b');
    const x=b.x,y=b.y,w=b.w/2+.7,d=b.d/2+.7;
    shape([p(x-w,y+d,5),p(x+w,y+d,5),p(x+w,y,8),p(x-w,y,8)],'#f7e8e7');
    shape([p(x+w,y-d,5),p(x+w,y+d,5),p(x+w,y,8)],'#a9a3bc');
    cuboid(x-2,y-1,1,1,6,3,'#eadcdf','#966c73','#715768');
    for(const off of [-3,1.5])shape([p(x+off,y+d-.6,1.7),p(x+off+1.5,y+d-.6,1.7),p(x+off+1.5,y+d-.6,3.3),p(x+off,y+d-.6,3.3)],'#ffcf93')
  }
  function server(b,s,t){
    const x=b.x,y=b.y,i=b.i,col=s.heat[i]===30?'#74e9cd':'#ff8759';
    cuboid(x,y,b.w,b.d,0,8,'#d8dbe8','#525d76','#353f59');
    for(let n=-8;n<=8;n+=4){cuboid(x+n,y+7.8,2.6,2,0,5.8,'#718196','#29384d','#414b66');line(p(x+n-.8,y+9.05,4.9),p(x+n+.8,y+9.05,4.9),col,2)}
    for(const offset of [-6,1,7]){cuboid(x+offset,y-2,4,5,8,1.2,'#8396a5','#758199','#67778f');disc(x+offset,y-2,9.4,1.35,'#344557');const a=t*.006+offset;line(p(x+offset-Math.cos(a),y-2-Math.sin(a),9.5),p(x+offset+Math.cos(a),y-2+Math.sin(a),9.5),'#c9cad5',2)}
    const port=D.ports[i];disc(port.x,port.y,port.z,2.6,'#263044');disc(port.x,port.y,port.z,2,col);
    for(let n=-1;n<=1;n++)line(p(port.x,port.y,port.z+n*.76).map((v,j)=>v-(j?0:scale)),p(port.x,port.y,port.z+n*.76).map((v,j)=>v+(j?0:scale)),'#553f52',2);
    if(s.heat[i]>30)for(let k=0;k<3;k++){const u=(t*.00055+k/3)%1;disc(port.x+u*1.8,port.y,6+u*7,.8+u,'rgba(255,211,181,'+(.47*(1-u))+')')}
  }
  function car(s){
    const pt=(x,y,z)=>p(s.x+x*Math.cos(s.a)-y*Math.sin(s.a),s.y+x*Math.sin(s.a)+y*Math.cos(s.a),z);
    const face=(pts,col)=>shape(pts.map(v=>pt(...v)),col);
    function body(w,d,z,h,col,front,side,off=0){
      const pts=[[-w,-d+off],[w,-d+off],[w,d+off],[-w,d+off]];
      const sides=pts.map((v,i)=>({v,b:pts[(i+1)%4]})).sort((a,b)=>pt(...a.v,0)[1]+pt(...a.b,0)[1]-pt(...b.v,0)[1]-pt(...b.b,0)[1]);
      for(const edge of sides)face([[...edge.v,z],[...edge.b,z],[...edge.b,h],[...edge.v,h]],edge.v[0]===edge.b[0]?side:front);
      face(pts.map(v=>[...v,h]),col)
    }
    for(const side of [-1,1])face([[side*1.05,-2.8,.1],[side*1.65,-2.8,.1],[side*2.8,-9,.1],[side*.6,-9,.1]],'#fff0bf70');
    body(1.85,3.05,.4,1.5,'#f49b80','#ad5367','#cd6469');body(1.46,1.65,1.5,2.65,'#ed927b','#74869f','#48586f',.1);
    face([[-1.4,-1.57,1.6],[1.4,-1.57,1.6],[1.25,-1.1,2.63],[-1.25,-1.1,2.63]],'#a0b9cb');
    for(const side of [-1,1])for(const ax of [-1.8,1.9]){
      const outward=side*(Math.cos(s.a)+Math.sin(s.a));if(outward<0)continue;
      const [wx,wy]=pt(side*1.86,ax,.55);c.fillStyle='#283142';c.beginPath();c.ellipse(wx,wy,scale*.51,scale*.68,0,0,7);c.fill()
    }
    for(const side of [-1,1]){line(pt(side*1.25,2.99,1.2),pt(side*1.75,2.99,1.2),'#ff7472',3);line(pt(side*1.15,-3.06,1.25),pt(side*1.68,-3.06,1.25),'#fff4c3',3)}
    for(const off of [-.55,.65])line(pt(-1.48,off,2.72),pt(1.48,off,2.72),'#34465a',2);
    if(s.cooldown>.15){line(pt(1,.15,2),pt(2.8,.05,2.7),'#5fbda6',4)}
  }
  const trees=[];for(let i=0;i<88;i++){const x=(i*59%207)-103,y=(i*83%207)-103;
    if(!D.streets.some(n=>Math.abs(x-n)<8||Math.abs(y-n)<8)&&!D.blocks.some(b=>Math.abs(x-b.x)<b.w/2+4&&Math.abs(y-b.y)<b.d/2+4))trees.push({x,y,i})}
  function tree(o){const [x,y]=p(o.x,o.y),h=(4+o.i%4)*scale;
    for(let n=0;n<3;n++){const yy=y-n*h*.22,rad=h*(.39-n*.07);shape([[x,yy-h*.6],[x+rad,yy],[x-rad,yy]],'#395c64');shape([[x,yy-h*.6],[x+rad*.35,yy-h*.3],[x-rad*.75,yy-h*.1]],'#cddce0')}}
  const lamps=[];for(const r of D.streets)for(const n of [-84,-36,28,85])lamps.push({x:n,y:r+8,type:'lamp'});
  function lamp(o){
    const {x,y}=o;line(p(x,y),p(x,y,5.4),'#566076',2.2);
    line(p(x,y,5.4),p(x,y-2,5.4),'#46556a',2.4);disc(x,y-2,5.25,.46,'#fff5cb')
  }
  function map(s){const size=W<550?74:102,x=W-size-11,y=H-size-38,k=size/220;
    c.fillStyle='#172a3cef';c.fillRect(x,y,size,size);c.strokeStyle='#aec3c8';c.strokeRect(x,y,size,size);
    const xy=(a,b)=>[x+(a+110)*k,y+(b+110)*k];for(const n of D.streets){line(xy(n,-100),xy(n,100),'#506378');line(xy(-100,n),xy(100,n),'#506378')}
    D.ports.forEach((o,i)=>{const [a,b]=xy(o.x,o.y);c.fillStyle=s.heat[i]>30?'#ffa274':'#78ddc9';c.fillRect(a-3,b-3,6,6)});
    const [a,b]=xy(s.x,s.y);c.save();c.translate(a,b);c.rotate(s.a);shape([[0,-5],[-3,3],[3,3]],'#fff7e5');c.restore()
  }
  function render(s,t,dt,jump=false){
    const f=jump?1:1-Math.exp(-dt*7);cx+=(s.x+Math.sin(s.a)*s.v*.2-cx)*f;cy+=(s.y-Math.cos(s.a)*s.v*.2-cy)*f;
    c.fillStyle='#6995a7';c.fillRect(0,0,W,H);
    for(let i=0;i<90;i++){const x=(i*149%520)-260,y=(i*73%410)-205;line(p(x,y),p(x+3,y-1),'#98bec4',1)}
    plane(-102,-102,204,204,0,'#cccedd');
    for(let i=0;i<840;i++){
      const x=i*79.17%202-101,y=i*47.23%202-101;
      const start=p(x,y);if(start[0]<-25||start[0]>W||start[1]<-8||start[1]>H)continue;
      line(start,p(x+1+i%3,y-.3),i%3?'#e3e0ea':'#c0c4d6',1)
    }
    for(const n of D.streets){plane(-101,n-8,202,16,0,'#b5b9c6');plane(n-8,-101,16,202,0,'#b5b9c6')}
    for(const n of D.streets){for(const v of [0,1]){
      if(v)plane(-101,n-6.4,202,12.8,.01,'#606a81');else plane(n-6.4,-101,12.8,202,.01,'#606a81')
    }}
    for(const n of D.streets)for(let a=-98;a<98;a+=8){if(D.streets.some(b=>Math.abs(a-b)<8))continue;
      plane(n-.13,a,.26,3,.05,'#d4c8aa');plane(a,n-.13,3,.26,.05,'#d4c8aa')}
    for(const w of s.tracks)for(const side of [-1,1]){const x=w.x+side*1.4*Math.cos(w.a),y=w.y+side*1.4*Math.sin(w.a);line(p(x,y),p(x+Math.sin(w.a)*1.3,y-Math.cos(w.a)*1.3),'#45546775',1.6)}
    for(const a of D.streets)for(const b of D.streets)for(let i=-4;i<=4;i+=2){
      plane(a+i,b+7,1,2,.05,'#bfc4cc');plane(a-9,b+i,2,1,.05,'#bfc4cc')
    }
    for(const o of D.blocks){
      plane(o.x-o.w/2-1,o.y-o.d/2-1,o.w+2,o.d+2,0,'#aeb5c4');
      shape([p(o.x-o.w/2,o.y+o.d/2),p(o.x+o.w/2,o.y+o.d/2),p(o.x+o.w/2,o.y-o.d/2),p(o.x+o.w/2+4,o.y-o.d/2+2),p(o.x+o.w/2+4,o.y+o.d/2+2),p(o.x-o.w/2+4,o.y+o.d/2+2)],'#a5a8c0')
    }
    const items=[...D.blocks,...lamps,...trees,{x:s.x,y:s.y,type:'car'}].sort((a,b)=>a.x+a.y-b.x-b.y);
    for(const o of items){const [x,y]=p(o.x,o.y);if(x< -130||x>W+130||y< -60||y>H+140)continue;
      if(o.type==='car')car(s);else if(o.type==='lamp')lamp(o);else if(o.type){c.save();if(o.x+o.y>s.x+s.y&&Math.abs(x-p(s.x,s.y)[0])<80&&Math.abs(y-p(s.x,s.y)[1])<65)c.globalAlpha=.65;
        if(o.type==='server')server(o,s,t);else cabin(o);c.restore()}else tree(o)}
    tag=null;const id=D.near(s);
    if(id>=0){const o=D.ports[id],[x,y]=p(o.x,o.y,o.z),inRange=D.dist(s,o)<=D.range;
      const tx=D.clamp(x,72,W-72),ty=D.clamp(y-28,70,H-82);
      line([tx,ty],[D.clamp(x,5,W-5),D.clamp(y,46,H-40)],'#fff1ce',1.3);
      const text=D.centres[id].name+' · '+s.heat[id]+'°C · '+(inRange?'THROW':Math.ceil(D.dist(s,o))+'m');
      c.font='bold 12px monospace';const wid=c.measureText(text).width+12;tag={id,x:tx,y:ty,half:wid/2};c.fillStyle='#232840eb';c.fillRect(tx-wid/2,ty-10,wid,19);c.fillStyle=inRange?'#ffc492':'#e1e6dc';c.textAlign='center';c.fillText(text,tx,ty+4)}
    for(const b of s.shots){const v=b.pos;disc(v.x,v.y,.1,.65,'#657287');disc(v.x,v.y,v.z,.83,'#ffffff')}
    for(const v of s.splashes)for(let i=0;i<9;i++){const a=i*2.4,r=v.age*9;disc(v.x+Math.sin(a)*r,v.y+Math.cos(a)*r,v.z+v.age*(3+i%3),.36*(1-v.age/.45),'#f5fcff')}
    for(const v of s.splashes)if(v.melt){
      for(let k=0;k<3;k++)disc(v.x+Math.sin(k*2)*v.age*4,v.y+Math.cos(k*2)*v.age*4,v.z+v.age*(9+k*2),.6+v.age*2,'rgba(222,255,250,'+(.60*(1-v.age/.42))+')')
    }
    map(s)
  }
  function aim(s,e){const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
    if(tag&&Math.abs(x-tag.x)<=tag.half&&Math.abs(y-tag.y)<11)return D.ports[tag.id];
    let id=-1,best=Math.max(16,scale*3.5);
    for(const [i,o] of D.ports.entries()){const [a,b]=p(o.x,o.y,o.z),distance=Math.hypot(x-a,y-b);if(s.heat[i]>30&&distance<best){id=i;best=distance}}
    if(id>=0)return D.ports[id];
    const u=(x-W*.5)/(.84*scale),v=(y-H*.52)/(.47*scale);return {x:cx+(u+v)/2,y:cy+(v-u)/2,z:0}
  }
  return {render,aim}
}
