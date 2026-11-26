'use strict';

function harbourView(canvas) {
  const ctx = canvas.getContext('2d');
  const backdrop = document.createElement('canvas');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const windows = [], reflections = [];
  let w, h = 400, xClock, radius, faceY, ratio, base;
  const random = n => { const v = Math.sin(n * 133.13 + 41) * 43758.545; return v - Math.floor(v); };
  function rect(c,x,y,width,height,colour) { c.fillStyle=colour; c.fillRect(x,y,width,height); }
  function circle(c,x,y,r,colour) { c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=colour; c.fill(); }
  function path(c,points,fill,stroke,size=1) {
    c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    if(fill){c.closePath();c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=size;c.stroke();}
  }
  function gradient(c,top,bottom,stops) {
    const g=c.createLinearGradient(0,top,0,bottom);
    for(const [p,col] of stops) g.addColorStop(p,col);
    return g;
  }
  function landscape(c) {
    rect(c,0,0,w,h,gradient(c,0,304,[[0,'#152539'],[.46,'#506680'],[.79,'#a89baa'],[1,'#e6bda8']]));
    for(let i=0;i<105;i++) circle(c,random(i)*w,random(i+200)*173,.4+random(i+80)*.9,'#f6eac482');
    const mx=.76*w, my=76;
    const glow=c.createRadialGradient(mx,my,14,mx,my,59);glow.addColorStop(0,'#ffdcad45');glow.addColorStop(1,'#ffdcad00');
    circle(c,mx,my,59,glow);circle(c,mx,my,20,'#ffe2b5');
    for(let j=0;j<3;j++){
      const ridge=[],floor=207+j*22;
      for(let x=-20,i=0;x<w+25;x+=13,i++){
        const y=floor-32*Math.sin(x*.012+j)-19*Math.sin(x*.027+j*3)-random(i+j*21)*9;
        ridge.push([x,y]);
      }
      path(c,[...ridge,[w+25,310],[-20,310]],['#83919f','#566c7f','#3e5467'][j]);
      for(let i=1;i<ridge.length-2;i++){
        const [x,y]=ridge[i],next=ridge[i+1];
        if(next[1]>y+1)path(c,[[x-6,y+2],[x,y],[next[0],next[1]],[next[0]+5,next[1]+5],[x+2,y+4],[x-7,y+12]],['#b8bec5','#99a8b1','#718493'][j]);
      }
    }
    rect(c,0,287,w,113,gradient(c,287,400,[[0,'#68818b'],[.3,'#344f63'],[1,'#172d40']]));
    for(let i=0;i<530;i++)rect(c,w*random(i+45),288+random(i+690)*113,2+random(i+712)*18,.6+random(i+3),'#bacecd26');
    // Timber warehouses step down to the quay, leaving open water behind the ferry.
    windows.length=0;reflections.length=0;
    for(let x=-18,i=0;x<w+10;i++){
      const width=26+random(i+33)*33, eave=256+random(i+96)*16, peak=eave-12-random(i)*18;
      const centre=x+width*.43,wall=['#63474b','#384b57','#7a554b','#4a5558','#614a43'][i%5];
      rect(c,x,eave,width,286-eave,wall);
      path(c,[[x,eave],[centre,peak],[x+width*.86,eave]],wall);
      path(c,[[x-2,eave],[centre,peak],[centre+width*.17,peak+1],[x+width+2,eave+1],[x+width*.86,eave]],'#243748');
      path(c,[[x-2,eave],[centre,peak-2],[centre+width*.17,peak],[x+width+2,eave-1]],null,'#c1c8c6',2.8);
      rect(c,x+width*.64,peak-2,4,7,'#465462');
      for(let col=0;col<3;col++){
        const wx=x+width*(.16+col*.29),wy=eave+4;
        const lit=random(i*7+col)>.66;
        rect(c,wx-1,wy-1,5.7,7.2,'#233541');rect(c,wx,wy,3.8,5.4,lit?'#f3c781':'#80959a');
        windows.push([wx,wy,lit]);
        if(lit)reflections.push(wx);
      }
      x+=width+3;
    }
    rect(c,0,286,w,5,'#283746');rect(c,0,285,w,1.7,'#b4b9b4');
    for(let i=0;i<w;i+=37)rect(c,i,289,3,6,'#253745');
    // Dock posts, ice at the waterline and reflected window light.
    for(const x of reflections)for(let k=0;k<6;k++)rect(c,x-2+Math.sin(k*2)*2,296+k*3,3+k,1,'#e7bc7e52');
    for(let i=0;i<28;i++){const x=random(i+91)*w,y=326+random(i+163)*70;path(c,[[x,y],[x+9,y-1],[x+24,y],[x+11,y+1.5]],'#a8bfc55c');}
  }
  function tower(c) {
    const x=xClock,y=faceY,r=radius,half=r*1.24;
    rect(c,x-half,y-r*1.17,half*2,h,'#313e47');
    rect(c,x-half,y-r*1.17,half*.22,h,'#27313c');
    rect(c,x+half*.85,y-r*1.17,half*.15,h,'#1d2d35');
    for(let i=0;i<20;i++){
      const by=y-r+i*12;
      path(c,[[x-half+3,by],[x+half-4,by]],null,'#8b969325');
      for(let bx=x-half+19+(i%2)*18;bx<x+half-4;bx+=40)rect(c,bx,by+1,1,11,'#0f25334a');
    }
    const eave=y-r*1.17,roof=y-r*1.69;
    path(c,[[x-half-13,eave],[x-half*.64,roof+9],[x,roof-18],[x+half*.64,roof+9],[x+half+13,eave]],'#344852');
    path(c,[[x,roof-18],[x+half*.64,roof+9],[x+half+13,eave],[x+half*.48,eave]],'#293946');
    path(c,[[x-half-14,eave],[x-half*.64,roof+7],[x,roof-21],[x+half*.64,roof+7],[x+half+14,eave]],null,'#cbd4d1',4);
    rect(c,x-half-11,eave,half*2+22,6,'#172b38');rect(c,x-half-7,eave+7,half*2+14,2,'#b59770');
    path(c,[[x,roof-20],[x,roof-45]],null,'#313e4b',2);circle(c,x,roof-32,3,'#be9d64');
    circle(c,x,y,r+8,'#182934');circle(c,x,y,r+5,'#988264');circle(c,x,y,r+2,'#273e49');
    const dial=c.createRadialGradient(x-r*.23,y-r*.23,8,x,y,r);
    dial.addColorStop(0,'#f6e4bc');dial.addColorStop(.78,'#dcc99e');dial.addColorStop(1,'#baa47e');
    circle(c,x,y,r-2,dial);
    for(let i=0;i<60;i++){
      const a=i*Math.PI/30,major=i%5===0,outer=r*.94,inner=r*(major?.84:.90);
      path(c,[[x+Math.sin(a)*inner,y-Math.cos(a)*inner],[x+Math.sin(a)*outer,y-Math.cos(a)*outer]],null,'#4b4a43',major?2.4:1);
    }
    c.textAlign='center';c.textBaseline='middle';c.font='bold '+Math.round(r*.138)+'px Georgia';
    const roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    roman.forEach((s,i)=>{const a=i*Math.PI/6;c.fillStyle='#49473d';c.fillText(s,x+Math.sin(a)*r*.74,y-Math.cos(a)*r*.74);});
    for(const side of [-1,1]){rect(c,x+side*r*1.11-2,eave+18,4,h,'#8a806a');}
  }
  function ship(c,flash,time,offset){
    const x=w*.70+offset,y=328+(reduced.matches?0:Math.sin(time*.7)*1.1);
    c.save();c.translate(x,y);const s=w<700?.82:1;c.scale(s,s);
    path(c,[[-59,0],[61,-3],[47,8],[-45,9]],'#182a37');
    path(c,[[-56,1],[58,-2]],null,'#c1846a',2);
    path(c,[[-46,-3],[-43,-12],[31,-12],[48,-4]],'#d1d3c4');rect(c,-28,-19,54,7,'#bdc7c4');
    rect(c,-15,-26,7,8,'#9f5f55');rect(c,-15,-27,7,2,'#293e4b');
    path(c,[[19,-20],[19,-35]],null,'#33434b',1.5);path(c,[[-35,-13],[19,-34],[32,-13]],null,'#5a6971',.9);
    for(let i=0;i<9;i++)rect(c,-37+i*8,-10,4.5,4,'#eec587');
    rect(c,-23,-17,38,3,'#526779');circle(c,41,-6,2,flash?'#fff1bc':'#d7bd84');
    if(flash){
      path(c,[[43,-7],[129,-19],[129,0]],'#ffdf9260');
      for(let i=0;i<4;i++)rect(c,46+i*5,16+i*3,24-i*3,1.4,'#ffe7ac8a');
    }
    c.restore();
  }
  function resize() {
    const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;
    ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=backdrop.width=Math.round(width*ratio);canvas.height=backdrop.height=Math.round(height*ratio);
    w=width/height*h;xClock=w*.205;radius=Math.min(w*.145,103);faceY=207;
    base=backdrop.getContext('2d');base.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
    landscape(base);tower(base);
  }
  new ResizeObserver(resize).observe(canvas);resize();
  return function draw(model,now){
    if(!w)return;
    ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(backdrop,0,0);
    ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
    const t=now/1000,pulse=model.pulse,win=model.reaction==='together',early=model.reaction==='early';
    if(win||early){
      const selected=early?[windows.find(([x,,lit])=>x>w*.52&&!lit)]:windows;
      for(const win of selected)if(win){const [x,y]=win;rect(ctx,x,y,3.8,5.4,'#ffdf99');}
      if(early&&selected[0]){const [x,y]=selected[0];rect(ctx,x-2,y-2,8,9,'#ffce704d');}
      if(win)for(let x=w*.35;x<w;x+=15)rect(ctx,x,303+Math.sin(x)*3,10,1.5,'#f8d79a90');
    }
    // An early bell sends the ferry off immediately. A late bell holds it at the quay.
    const age=now-model.rung,delay=model.reaction==='late'?1350:0;
    const progress=model.reaction?Math.min(1,Math.max(0,(age-delay)/2100)):0;
    const departing=reduced.matches?(progress>0?1:0):progress*progress*(3-2*progress);
    if(early)for(let i=0;i<model.missed;i++){
      const px=w*.67+i*7;
      circle(ctx,px,275,2.1,'#e8c49d');rect(ctx,px-2,277,4,5,i%2?'#ad796a':'#678a97');
      rect(ctx,px-2,282,1.5,3,'#25323e');rect(ctx,px+1,282,1.5,3,'#25323e');
    }
    ship(ctx,win||(model.reaction==='late'&&(reduced.matches||age<2500&&Math.floor(age/450)%2===0)),t,departing*w*.20);
    const x=xClock,y=faceY,r=radius;
    if(pulse>0){ctx.globalAlpha=pulse*.38;circle(ctx,x,y,r*.965,'#fff4bd');ctx.globalAlpha=1;}
    const beat=model.beat || 12,a=beat*Math.PI/6;
    path(ctx,[[x-Math.sin(a)*r*.12,y+Math.cos(a)*r*.12],[x+Math.sin(a-.09)*r*.27,y-Math.cos(a-.09)*r*.27],[x+Math.sin(a)*r*.71,y-Math.cos(a)*r*.71],[x+Math.sin(a+.09)*r*.27,y-Math.cos(a+.09)*r*.27]],'#293c42');
    circle(ctx,x,y,r*.055,'#9b7545');circle(ctx,x,y,r*.023,'#e6d2a4');
    // An exposed brass wheel indexes by one tooth on each visible tick.
    const by=y+r*1.30,gearX=x-r*.75;
    ctx.save();ctx.translate(gearX,by);ctx.rotate((model.beat||0)*Math.PI/8);
    for(let i=0;i<8;i++){rect(ctx,-2,-13,4,7,'#b99b68');ctx.rotate(Math.PI/4);}
    circle(ctx,0,0,10,'#ac9061');circle(ctx,0,0,6,'#31424a');circle(ctx,0,0,2,'#c6ad77');ctx.restore();
    const elapsed=now-model.rung;
    const pull=elapsed<650&&!reduced.matches?Math.sin(elapsed/650*Math.PI)*12:0;
    const ropeX=x+r*1.10;
    path(ctx,[[ropeX,y+r*.48],[ropeX,by+pull]],null,'#d4b991',2);
    ctx.beginPath();ctx.ellipse(ropeX,by+pull+7,4,8,0,0,Math.PI*2);ctx.strokeStyle='#d4b991';ctx.lineWidth=2;ctx.stroke();
    rect(ctx,x-38,by-17,76,32,'#b29c74');rect(ctx,x-36,by-15,72,28,'#182c36');
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffe3a7';ctx.font='bold 20px ui-monospace,monospace';
    ctx.fillText(model.beat?String(model.beat).padStart(2,'0'):'—',x,by);
    for(let i=0;i<62;i++){
      const sx=(random(i+98)*w+(reduced.matches?0:t*(2+random(i)*5)))%w;
      const sy=(random(i+27)*h+(reduced.matches?0:t*(6+random(i+9)*12)))%h;
      circle(ctx,sx,sy,.6+random(i+43),i%3?'#e9f4f079':'#ffffffad');
    }
  };
}
