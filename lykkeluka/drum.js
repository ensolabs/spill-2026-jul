'use strict';

function raffleDrum(canvas) {
  const c = canvas.getContext('2d');
  const width = 680, height = 370, tau = Math.PI * 2;
  const random = n => { const v = Math.sin(n * 41.23 + 2.83) * 5712.3; return v - Math.floor(v); };
  let scale, offsetX, offsetY, scene;
  function gradient(x,y,toX,toY,stops) {
    const g = c.createLinearGradient(x,y,toX,toY);
    stops.forEach(([at,colour]) => g.addColorStop(at,colour));
    return g;
  }
  function oval(x,y,rx,ry,fill,stroke,line=1) {
    c.beginPath(); c.ellipse(x,y,rx,ry,0,0,tau);
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}
  }
  function shape(points,fill,stroke,line=1) {
    c.beginPath();
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    if(fill){c.closePath();c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}
  }
  function rect(x,y,w,h,fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}
  function star(x,y,size,colour) {
    shape([[x,y-size],[x+size*.22,y-size*.19],[x+size*.72,y],[x+size*.22,y+size*.19],[x,y+size],[x-size*.22,y+size*.19],[x-size*.72,y],[x-size*.22,y-size*.19]],colour);
  }
  function print(x,y,text,font,colour) {c.font=font;c.fillStyle=colour;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y);}
  function background() {
    rect(-800,-400,2200,1100,gradient(0,0,0,285,[[0,'#173a45'],[.58,'#587b80'],[1,'#b1c9bf']]));
    for(let i=0;i<135;i++)oval(random(i)*1100-170,random(i+100)*235,1,1,'#e5e6cb80');
    for(let layer=0;layer<2;layer++){
      const ridge=[];
      for(let x=-200;x<=900;x+=10)ridge.push([x,155+layer*45+13*Math.sin(x*.024+layer)+16*Math.sin(x*.01)+random(x)*5]);
      shape([...ridge,[900,295],[-200,295]],layer?'#769797':'#a1bbb2');
    }
    for(let i=0;i<58;i++){
      const x=i*15-85+random(i)*12,y=240+random(i+60)*16,h=22+random(i+24)*68;
      for(let j=0;j<3;j++){const yy=y-h+j*h*.20,r=h*(.13+.045*j);shape([[x,yy],[x-r,yy+h*.53],[x+r,yy+h*.53]],i%3?'#436b6d':'#527776');}
    }
    rect(-500,249,1680,28,'#d9e4d6');
    for(let i=0;i<8;i++){ // Snow-covered market stalls.
      const x=-72+i*119,y=225+(i%3)*5;
      rect(x,y,70,28,'#6a5449');shape([[x-9,y],[x+25,y-22],[x+63,y-20],[x+80,y]],'#b99c80');
      shape([[x-9,y],[x+25,y-23],[x+63,y-21],[x+80,y]],null,'#e5e7d9',4);
      rect(x+8,y+4,47,14,'#e1ad72');rect(x+30,y+4,3,14,'#6d5247');
    }
    // A sagging cable of warm market bulbs.
    const sag=x=>5+22*Math.sin(x*Math.PI/370+.35);
    for(let x=-150;x<900;x+=8)shape([[x,sag(x)],[x+8,sag(x+8)]],null,'#25474a',1.6);
    for(let x=-95;x<890;x+=44){
      const y=sag(x);rect(x-1.6,y,3.2,6,'#474f45');
      const halo=c.createRadialGradient(x,y+8,1,x,y+8,13);halo.addColorStop(0,'#f8c97975');halo.addColorStop(1,'#f8c97900');
      oval(x,y+8,13,13,halo);oval(x,y+8,2.8,4,'#ffddb0');
    }
    rect(-700,266,2080,400,gradient(0,266,0,370,[[0,'#ce9f70'],[.4,'#b57e55'],[1,'#8c573e']]));
    rect(-700,265,2080,4,'#e2b68a');
    for(let i=0;i<165;i++){
      const x=random(i+300)*1080-170,y=274+random(i+450)*115;
      shape([[x,y],[x+14+random(i)*45,y+.7]],null,'#6a42292b');
    }
    [288,321,360].forEach(y=>rect(-500,y,1500,1.3,'#80523d'));
    oval(341,302,213,18,'#65483370');
  }
  const brass=()=>gradient(0,59,0,256,[[0,'#fff0ad'],[.12,'#c69a52'],[.35,'#8e663b'],[.53,'#f4d68b'],[.78,'#b2854c'],[1,'#755339']]);
  function base() {
    const bottomLeft=[222,320],bottomRight=[496,300];
    shape([[159,273],[428,259],[497,279],[222,299]],'#59857a','#243e3c',2);
    shape([[159,273],[222,299],[222,319],[158,291]],'#245554','#243e3c',2);
    shape([[222,299],[497,279],bottomRight,bottomLeft],'#204b4b','#243e3c',2);
    shape([[222,303],[494,283]],null,'#cfa975',2);
    [206,436].forEach((x,i)=>{
      const y=147-i*11;
      shape([[x-9,y+13],[x-37,y+130],[x+25,y+130],[x+6,y+10]],'#2e5856','#233e3e',3);
      shape([[x-6,y+28],[x-26,y+122],[x-14,y+121]],'#83a299');
      oval(x,y,11,11,'#c6a264','#4f4838',2);
    });
    c.save();
    c.translate((bottomLeft[0]+bottomRight[0])/2,(bottomLeft[1]+bottomRight[1])/2);
    c.rotate(Math.atan2(bottomRight[1]-bottomLeft[1],bottomRight[0]-bottomLeft[0]));
    print(0,-8.5,'e n s ō','bold 15px Georgia','#e9c98a');
    c.restore();
  }
  const left={x:208,y:146}, right={x:431,y:134}, rx=39, ry=82;
  function rimPoint(end,angle){return [end.x+rx*Math.cos(angle),end.y+ry*Math.sin(angle)];}
  function rail(angle,back) {
    const a=rimPoint(left,angle),b=rimPoint(right,angle);
    shape([a,b],null,back?'#8a784f88':'#6b593f',back?1.8:3.7);
    if(!back)shape([[a[0],a[1]-1],[b[0],b[1]-1]],null,'#f0d699',1.25);
  }
  function ball(x,y,r,value){
    const red=value===13;
    const g=c.createRadialGradient(x-r*.34,y-r*.48,1,x+r*.15,y+r*.12,r*1.16);
    g.addColorStop(0,red?'#f49e71':'#fff2c7');g.addColorStop(.59,red?'#bd4938':'#e6c18a');g.addColorStop(1,red?'#78302c':'#92704c');
    oval(x,y,r,r,g,red?'#743a30':'#8f765a',.9);
    oval(x,y,r*.62,r*.62,red?'#973f32':'#f7deb2',red?'#f4a879':'#b79a6f',.9);
    print(x,y+r*.04,String(value),'bold '+Math.round(r*.91)+'px Georgia',red?'#fff1cb':'#344547');
    oval(x-r*.47,y-r*.57,r*.19,r*.07,red?'#ffe5b595':'#fff9d799');
  }
  function paint(s) {
    scene=s;
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);
    c.setTransform(scale,0,0,scale,offsetX,offsetY);
    background();base();
    const rotation=s.spin*tau;
    const body=gradient(0,53,0,224,[[0,'#d9f3e4a8'],[.2,'#c0dbcb66'],[.7,'#699e9473'],[1,'#b2d4c0a8']]);
    shape([[left.x,64],[right.x,52],[right.x,216],[left.x,228]],body);
    oval(right.x,right.y,rx,ry,'#9abcb366',brass(),5);
    const bars=Array.from({length:12},(_,i)=>i*tau/12+rotation);
    bars.filter(a=>Math.cos(a)<0).forEach(a=>rail(a,true));
    // The draw lifts the loose balls off the bottom as the cage rolls forward.
    const motion=Math.sin(s.spin*Math.PI),balls=s.balls;
    balls.forEach((value,i)=>{
      if(value===s.releasing && s.spin>.7)return;
      const row=Math.floor(i/7),col=i%7;
      const x=215+col*30+row*14+(random(value)-.5)*5;
      const y=203-col*1.6-row*26+(random(value+9)-.5)*6;
      const a=rotation+value*1.63;
      ball(x+motion*19*Math.sin(a),y-motion*(40+34*Math.cos(a)),16,value);
    });
    bars.filter(a=>Math.cos(a)>=0).forEach(a=>rail(a,false));
    oval(left.x,left.y,rx,ry,'#62857b35','#6b573e',8);
    oval(left.x,left.y,rx,ry,null,brass(),5);
    for(let i=0;i<6;i++)shape([[left.x,left.y],rimPoint(left,rotation+i*tau/6)],null,'#b3a275',2.4);
    oval(left.x,left.y,9,12,'#95784c','#f0cf89',2);
    oval(right.x,right.y,rx,ry,null,brass(),4.5);
    shape([[right.x,right.y],[490,142]],null,'#654938',8);
    shape([[right.x,right.y-1],[490,141]],null,'#e9c384',3);
    const hx=495+14*Math.cos(rotation+.7),hy=142+37*Math.sin(rotation+.7);
    shape([[489,142],[hx,hy]],null,'#684c38',7);shape([[489,141],[hx,hy-1]],null,'#dbb27c',3);
    shape([[hx,hy],[hx+18,hy+3]],null,'#87382b',9);oval(hx+18,hy+3,4.5,4.5,'#914432');
    // The sloping chute ends in a dish where the most recent draw stays on display.
    shape([[405,221],[427,214],[500,254],[475,261]],'#ceb27f','#755e42',2);
    shape([[405,217],[407,225],[475,265],[475,257]],'#886b49');
    oval(510,284,43,11,'#856644','#644d39',2);oval(510,280,42,10,'#c8aa74','#f1d69c',2);
    if(s.releasing!==null && s.spin>.7){
      const exit=(s.spin-.7)/.3;
      ball(404+106*exit,210+54*exit-16*Math.sin(exit*Math.PI),16+7*exit,s.releasing);
    }else if(s.releasing===null && s.last!==null)ball(510,264,23,s.last);
    if(s.jackpot){for(let i=0;i<5;i++)star(455+i*23,239-20*Math.sin(i*Math.PI/4),5+i%3,'#fff0b4');}
  }
  function resize(){
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    scale=Math.min(canvas.width/width,canvas.height/height);
    offsetX=(canvas.width-width*scale)/2;offsetY=(canvas.height-height*scale)/2;
    if(scene)paint(scene);
  }
  new ResizeObserver(resize).observe(canvas);resize();
  return paint;
}
