'use strict';
function handballArena(canvas){
  const H=Handball,main=canvas.getContext('2d'),back=document.createElement('canvas');
  let c=main,W,Ht,F,eye,forward,right,up,camera='',last;
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const rand=n=>{const f=Math.sin(n*51.26+72)*16384;return f-Math.floor(f)};
  function projection(p){const v=H.sub(p,eye),z=H.dot(v,forward);return [W*.5+F*H.dot(v,right)/z,Ht*.49-F*H.dot(v,up)/z,z]}
  function gradient(x,y,x1,y1,a,b){const g=c.createLinearGradient(x,y,x1,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g}
  function path(pts,fill,line,w=1){
    if(!pts.length)return;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    if(fill){c.closePath();c.fillStyle=fill;c.fill()}if(line){c.lineWidth=w;c.strokeStyle=line;c.lineJoin='round';c.lineCap='round';c.stroke()}
  }
  function poly(points,col){
    const visible=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],za=H.dot(H.sub(a,eye),forward),zb=H.dot(H.sub(b,eye),forward);
      if(za>.16)visible.push(a);if((za>.16)!==(zb>.16))visible.push(H.blend(a,b,(.16-za)/(zb-za)))}
    path(visible.map(projection),col);
  }
  function line(a,b,col,width=.048){
    let za=H.dot(H.sub(a,eye),forward),zb=H.dot(H.sub(b,eye),forward);
    if(Math.max(za,zb)<.17)return;
    if(za<.17)a=H.blend(a,b,(.17-za)/(zb-za));if(zb<.17)b=H.blend(b,a,(.17-zb)/(Math.max(.17,za)-zb));
    const A=projection(a),B=projection(b);path([A,B],null,col,Math.max(.65,2*F*width/(A[2]+B[2])));
  }
  function oval(x,y,rx,ry,color){if(rx<=0||ry<=0)return;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill()}
  function orb(p,r,col,ry=1){const [x,y,z]=projection(p);if(z>.17)oval(x,y,F*r/z,F*r*ry/z,col)}
  function label(p,text,size,col){const [x,y,z]=projection(p);if(z<.17)return;c.font='bold '+Math.max(4,F*size/z)+'px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.fillText(text,x,y)}
  function cameraAt(name){
    camera=name;const wide=W/Ht;
    const views={Shooter:[[-1.35,2.28,9.55],[0,1.02,.5],2.25],Arena:[[33,25,-4],[0,.4,17],1.21],Goal:[[.22,3.05,-3.85],[0,1.10,7],1.57],Side:[[6.6,3.4,3.8],[0,1,4.1],1.14]};
    let target,f;[eye,target,f]=views[name];forward=H.unit(H.sub(target,eye));right=H.unit(cross([0,1,0],forward));up=cross(forward,right);F=Ht*f*Math.min(1,wide/(name==='Arena'?1.95:1.65));
    backdrop();
  }
  function floor(points,col){poly(points.map(([x,z])=>[x,.005,z]),col)}
  function mark(a,b){line([a[0],.012,a[1]],[b[0],.012,b[1]],'#f2f1dd',.052)}
  function area(radius){
    const a=[];for(let j=0;j<=36;j++){const u=j*Math.PI/72;a.push([-1.5-radius*Math.cos(u),radius*Math.sin(u)])}
    for(let j=0;j<=36;j++){const u=j*Math.PI/72;a.push([1.5+radius*Math.sin(u),radius*Math.cos(u)])}return a;
  }
  function goal(z){
    const dir=z===0?-1:1,ry=2,depth=1.05;
    for(let n=-6;n<=6;n++){const x=n*.25;line([x,0,z+dir*depth],[x,ry,z+dir*.82],'#c4ded68a',.014);line([x,ry,z+dir*.82],[x,ry,z],'#e1eeda88',.012)}
    for(let j=0;j<=8;j++){const y=j*.25;line([-1.5,y,z+dir*(depth-.23*y/2)],[1.5,y,z+dir*(depth-.23*y/2)],'#d0e4dc96',.015)}
    for(const x of [-1.5,1.5]){
      for(let j=0;j<=8;j++){const y=j*.25;line([x,y,z],[x,y,z+dir*(depth-.23*y/2)],'#cfe2d980',.014)}
      line([x,2,z],[x,2,z+dir*.82],'#adc2c1',.041);line([x,2,z+dir*.82],[x,0,z+dir*depth],'#adc2c1',.041);
    }
    for(const x of [-1.5,1.5])for(let j=0;j<8;j++)line([x,j*.25,z],[x,(j+1)*.25,z],j%2?'#fff4dc':'#cf4740',.081);
    for(let j=0;j<12;j++)line([-1.5+j*.25,2,z],[-1.5+(j+1)*.25,2,z],j%2?'#e45747':'#fff7db',.081);
  }
  function ring(a,r,h){const co=Math.cos(a),si=Math.sin(a);return [Math.sign(co)*Math.pow(Math.abs(co),.49)*(12+r),h,20+Math.sign(si)*Math.pow(Math.abs(si),.49)*(22+r)]}
  function backdrop(){
    back.width=W;back.height=Ht;c=back.getContext('2d');
    c.fillStyle=gradient(0,0,0,Ht,'#111a30','#576371');c.fillRect(0,0,W,Ht);
    const sections=64;
    for(let i=0;i<sections;i++){
      const a=i*Math.PI*2/sections,b=(i+1)*Math.PI*2/sections;
      if(camera==='Arena'){
        const r0=ring(a,4.9,4.9),r1=ring(b,4.9,4.9);
        poly([r0,r1,[r1[0],-.4,r1[2]],[r0[0],-.4,r0[2]]],i%2?'#334754':'#384855');
        if(Math.cos(a)>.43&&Math.sin(a)<.60)continue;
      }
      for(let row=0;row<9;row++){
        const h=.52+row*.48,r=row*.54;
        poly([ring(a,r,h),ring(b,r,h),ring(b,r+.51,h+.42),ring(a,r+.51,h+.42)],row%3?'#394153':'#514656');
        const A=ring(a,r+.22,h+.20),B=ring(b,r+.22,h+.20);
        const seats=Math.max(1,Math.round(Math.hypot(A[0]-B[0],A[2]-B[2])/.51));
        for(let j=0;j<seats;j++){
          if(j===0&&i%5===0)continue;
          const idx=i*61+j*11+row*3,p=H.blend(A,B,(j+.5)/seats);
          orb(p,.145,['#d19c86','#719996','#dbb277','#995962','#56657b'][Math.floor(rand(idx)*5)],1.48);
          orb(H.add(p,[0,.20,0]),.078,'#b99f90');
        }
      }
      line(ring(a,4.8,5.32),ring(b,4.8,5.32),'#96a5ab',.09);
      if(i%3===0){line(ring(a,5,5.4),ring(a,2.5,8),'#81909d',.10);line(ring(a,2.5,8),ring(b,2.5,8),'#ffe8b9',.19)}
    }
    if(camera!=='Arena'){
      // A sequence of spanning roof trusses makes the enclosed hall legible from the goal.
      for(let z=-2;z<45;z+=5){
        for(const y of [7.4,8.1])line([-14,y,z],[14,y,z],'#84919c',.095);
        for(let x=-14;x<14;x+=2)line([x,7.4,z],[x+1,8.1,z],'#7d8792',.068);
        for(const x of [-9,-4.5,4.5,9])line([x-.52,7.30,z],[x+.52,7.30,z],'#fff0cd',.14);
      }
      poly([[-2.4,3.0,42.2],[2.4,3.0,42.2],[2.4,5.05,42.2],[-2.4,5.05,42.2]],'#162a39');
      label([0,4.51,42.15],'KATOWICE',.41,'#faaf86');label([0,3.68,42.15],'60:00',.68,'#e5efde');
    }
    floor([[-12,-2],[12,-2],[12,42],[-12,42]],'#ad866d');
    floor([[-10,0],[10,0],[10,40],[-10,40]],'#558d98');
    for(let j=0;j<40;j+=2)floor([[-10,j],[10,j],[10,j+1],[-10,j+1]],'#d3e3d90b');
    for(const end of [0,40]){
      const flip=([x,z])=>[x,end===0?z:40-z],six=area(6).map(flip);
      floor(six,'#246579');for(let i=1;i<six.length;i++)mark(six[i-1],six[i]);
      // Walk a dashed 9 m offset, clipped to the sidelines.
      const pts=area(9).map(flip);let walked=0;
      for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);
        for(let k=0;k<d;){const m=(walked+k)%.30,n=Math.min(d-k,m<.15?.15-m+.00001:.30-m+.00001);
          if(m<.15){const p=H.blend(a,b,k/d),q=H.blend(a,b,(k+n)/d);if(Math.abs(p[0])<=10&&Math.abs(q[0])<=10)mark(p,q)}k+=n}walked+=d}
      mark(flip([-.5,7]),flip([.5,7]));mark(flip([-.075,4]),flip([.075,4]));mark([-10,end],[10,end]);
    }
    for(const x of [-10,10])mark([x,0],[x,40]);mark([-10,20],[10,20]);
    for(let j=0;j<60;j++){const p=i=>[2*Math.cos(i*Math.PI/30),20+2*Math.sin(i*Math.PI/30)];mark(p(j),p(j+1))}
    // Electronic advertising boards and the scorer's table on the touchline.
    for(const x of [-11.15,11.15])for(let z=0;z<40;z+=5){
      poly([[x,0,z],[x,.68,z],[x,.68,z+4.9],[x,0,z+4.9]],z%2?'#21384b':'#543646');
      label([x,.34,z+2.45],z%2?'KATOWICE':'ensō',.23,'#f4e8ca');
    }
    for(let z=14;z<27;z+=2)line([-10.8,.5,z],[-11.75,.5,z],'#dab580',.22);
    goal(40);if(camera!=='Goal')goal(0);
    c=main;
  }
  function shadow(x,z,rx,rz){
    const pts=[];for(let i=0;i<24;i++){const a=i*Math.PI/12;pts.push([x+rx*Math.cos(a),.018,z+rz*Math.sin(a)])}poly(pts,'#152f3b39');
  }
  function tube(a,b,r1,r2,col,edge){
    const A=projection(a),B=projection(b);if(Math.min(A[2],B[2])<.12)return;
    const dx=B[0]-A[0],dy=B[1]-A[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,ra=r1*F/A[2],rb=r2*F/B[2];
    const p=(P,n)=>[P[0]+nx*n,P[1]+ny*n];
    const fill=gradient(A[0]+nx*ra,A[1]+ny*ra,A[0]-nx*ra+.0001,A[1]-ny*ra,col,edge||col);
    path([p(A,ra),p(B,rb),p(B,-rb),p(A,-ra)],fill);oval(A[0],A[1],ra,ra,fill);oval(B[0],B[1],rb,rb,fill);
  }
  function athlete(body,goalie){
    const {hip,chest,head,arms,legs,facing}=body;
    const kit=goalie?'#f6c660':'#e86756',shade=goalie?'#cc8d46':'#af4047',skin=goalie?'#b97e60':'#ce9273',lit=goalie?'#d69f7e':'#e5ae8b',navy='#263446';
    shadow(hip[0],hip[2],.49,.24);
    function leg(i){
      const [a,b,f]=legs[i];tube(a,b,.122,.082,goalie?navy:lit,goalie?'#1e3040':skin);tube(b,f,.081,.046,goalie?navy:skin,goalie?'#182936':lit);
      if(!goalie)tube(H.blend(b,f,.54),f,.063,.05,'#e8ddd1','#c9c8ba');
      const toe=H.add(f,[.135*Math.sin(body.footTurn||0),-.032,.135*facing*Math.cos(body.footTurn||0)]);tube(f,toe,.071,.071,goalie?'#eae7d7':'#202f3c');line(H.add(f,[0,-.067,-.045*facing]),H.add(toe,[0,-.038,.035*facing]),'#edce9a',.035);
    }
    function arm(i){
      const [a,b,w]=arms[i];tube(a,b,.087,.063,goalie?kit:lit,goalie?shade:skin);tube(b,w,.065,.044,goalie?kit:skin,goalie?shade:lit);
      if(!goalie)tube(a,H.blend(a,b,.38),.096,.083,kit,shade);
      const dir=H.unit(H.sub(w,b)),p=H.add(w,H.mul(dir,.066));tube(w,p,.045,.058,lit,skin);
      for(let j=0;j<4;j++){const k=(j-1.5)*.022;const root=H.add(p,[k,0,0]);tube(root,H.add(root,H.mul(dir,.053+.012*Math.sin(j))),.013,.009,lit,skin)}
      tube(w,H.add(p,[i?.065:-.065,.014,0]),.021,.017,skin);
    }
    const far=projection(arms[0][1])[2]>projection(arms[1][1])[2]?0:1;
    leg(0);leg(1);arm(far);
    // Tailored shirt and shorts span the hip and shoulder joints in the athlete's own frame.
    const toward=Math.sign(eye[2]-hip[2]);
    poly([[-.19,.075],[-.196,-.15],[-.042,-.16],[0,-.06],[.04,-.16],[.195,-.15],[.19,.075]].map(([x,y])=>H.add(hip,[x,y,toward*.09])),navy);
    const rings=[[hip,.045,.19,.14],[hip,.16,.181,.148],[chest,-.085,.218,.155],[chest,.042,.213,.133],[chest,.094,.087,.079]];
    const vertex=([o,y,rx,rz],a)=>H.add(o,[rx*Math.cos(a),y,rz*Math.sin(a)]);
    const faces=[];
    for(let j=1;j<rings.length;j++)for(let i=0;i<16;i++){
      const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
      const pts=[vertex(rings[j-1],a),vertex(rings[j-1],b),vertex(rings[j],b),vertex(rings[j],a)];
      const light=.47+.34*Math.cos(a+.7)-.12*Math.sin(a);
      const base=goalie?[203,143,68]:[176,68,70],highlight=goalie?[255,212,112]:[252,133,103];
      const color='rgb('+base.map((v,k)=>Math.round(H.mix(v,highlight[k],light))).join(',')+')';
      faces.push({pts,color,depth:pts.reduce((d,p)=>d+projection(p)[2],0)});
    }
    faces.sort((a,b)=>b.depth-a.depth).forEach(f=>poly(f.pts,f.color));
    const collar=H.add(chest,[0,.10,0]);tube(collar,head,.071,.09,skin,lit);
    const face=H.add(head,[0,0,.047*facing]);orb(head,.133,'#50392f',1.28);orb(face,.121,lit,1.2);
    orb(H.add(head,[0,.096,-.016*facing]),.131,'#493936',.73);
    orb(H.add(head,[0,.07,-.13*facing]),.079,'#4e3b33',1.28);
    if((eye[2]-head[2])*facing<0)orb(H.add(head,[0,.012,-.067*facing]),.12,'#513c32',1.03);
    else for(const s of [-1,1])orb(H.add(face,[s*.047,.018,facing*.097]),.010,'#513c32');
    arm(1-far);
    const nearZ=Math.sign(eye[2]-chest[2]);if(Math.abs(eye[2]-chest[2])>Math.abs(eye[0]-chest[0])*.62)label(H.add(chest,[0,-.11,nearZ*.185]),goalie?'1':'14',.17,goalie?'#263842':'#fff3de');
  }
  function draw(v){
    last=v;if(!W||!Ht)return;if(camera!==v.cam)cameraAt(v.cam);
    c=main;c.drawImage(back,0,0);
    [ [v.shooter,false],[v.keeper,true] ].sort((a,b)=>projection(b[0].hip)[2]-projection(a[0].hip)[2]).forEach(([r,g])=>athlete(r,g));
    const ball=v.ball;shadow(ball[0],ball[2],.10,.07);orb(ball,.096,'#ffd382');orb(H.add(ball,[.032,.022,-.07]),.039,'#9c3941');orb(H.add(ball,[-.057,-.03,-.032]),.024,'#9c3941');
    if(v.aim){
      const [x,y,z]=projection([v.aim.x,v.aim.y,0]),r=Math.max(6,F*.105/z);
      c.strokeStyle='#142c39';c.lineWidth=4;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();
      c.strokeStyle='#fff2a9';c.lineWidth=2;c.stroke();oval(x,y,2,2,'#fff2a9');
    }
    if(v.marker){c.textAlign='center';c.font='bold '+Math.max(13,Ht*.033)+'px monospace';const x=W*.5,y=Ht*.88,w=c.measureText(v.marker).width+24;c.fillStyle='#142a38dd';c.fillRect(x-w/2,y-14,w,27);c.fillStyle='#ffdcac';c.fillText(v.marker,x,y+5)}
  }
  function resize(){const d=Math.min(devicePixelRatio||1,1.6);W=canvas.width=Math.max(1,Math.round(canvas.clientWidth*d));Ht=canvas.height=Math.max(1,Math.round(canvas.clientHeight*d));camera='';if(last)draw(last)}
  new ResizeObserver(resize).observe(canvas);resize();
  draw.goalPoint=(clientX,clientY)=>{
    const rect=canvas.getBoundingClientRect();
    const dx=((clientX-rect.left)*W/rect.width-W*.5)/F;
    const dy=(Ht*.49-(clientY-rect.top)*Ht/rect.height)/F;
    const ray=H.add(forward,H.add(H.mul(right,dx),H.mul(up,dy)));
    if(Math.abs(ray[2])<.001)return null;
    const distance=-eye[2]/ray[2];
    return distance>0?H.add(eye,H.mul(ray,distance)):null;
  };
  return draw;
}
