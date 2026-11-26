'use strict';
(()=>{
  const $=id=>document.getElementById(id),width=18,all=(1<<width)-1;
  const glyphs={
    '1':['00100','01100','00100','00100','00100','00100','01110'],
    '8':['01110','10001','10001','01110','10001','10001','01110'],
    '2':['01110','10001','00001','00010','00100','01000','11111'],
    '4':['00010','00110','01010','10010','11111','00010','00010'],
    '7':['11111','00001','00010','00100','01000','01000','01000'],
    '>':['00100','00010','00001','11111','00001','00010','00100']
  };
  const ops=['SHIFT ←','SHIFT →','XOR','ROT ←','ROT →'];
  // Column 17 is the leftmost lamp. All operations act on all seven rows.
  function execute(rows,op,mask){
    return rows.map((r,i)=>{
      switch(op){
        case 0:return (r<<1)&all;
        case 1:return r>>>1;
        case 2:return r^mask[i];
        case 3:return ((r<<1)&all)|(r>>>17);
        case 4:return (r>>>1)|((r&1)<<17);
      }
    });
  }
  const services=[
    {route:'18',steps:[0],budget:2,seed:1},
    {route:'24',steps:[2,3],budget:3,seed:3},
    {route:'72',steps:[4,2,4],budget:4,seed:7},
    {route:'81',steps:[3,2,3,3],budget:5,seed:12}
  ];
  let level=0,rows,goal,mask,history,won;
  function panel(id,rows,color,hero=false){
    const c=$(id).getContext('2d'),{width:w,height:h}=c.canvas;
    const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#0e1718');bg.addColorStop(1,'#080e0f');c.fillStyle=bg;c.fillRect(0,0,w,h);
    const boardH=hero?h-84:h;
    const cell=Math.min((w-10)/18,(boardH-8)/7),x0=(w-cell*18)/2,y0=(boardH-cell*7)/2;
    rows.forEach((r,y)=>{for(let x=0;x<18;x++){
      const lit=r&(1<<(17-x)),cx=x0+(x+.5)*cell,cy=y0+(y+.5)*cell;
      c.fillStyle=lit?color:'#26302c';c.shadowBlur=lit&&hero?cell*.24:0;c.shadowColor=color;
      c.beginPath();c.arc(cx,cy,cell*.32,0,Math.PI*2);c.fill();c.shadowBlur=0;
      if(lit){c.fillStyle='#fff9';c.fillRect(cx-cell*.13,cy-cell*.17,cell*.14,cell*.07)}
    }});
    if(hero)street(c,boardH,w);
    $(id).setAttribute('aria-label',id+' rows in hexadecimal '+rows.map(r=>r.toString(16).padStart(5,'0')).join(', '));
  }
  function street(c,y,w){
    c.save();c.translate(0,y);const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
    const sky=c.createLinearGradient(0,0,0,84);sky.addColorStop(0,'#23363e');sky.addColorStop(1,'#61787d');
    rect(0,0,w,84,sky);
    for(let i=0;i<28;i++){
      const x=i*31-5,h=8+(i*37)%22;
      rect(x,46-h,25,h,'#293f45');rect(x,45-h,25,2,'#a9bdbb');
      for(let j=0;j<3;j++)if((i+j)%3)rect(x+4+j*6,50-h,2,3,'#d7b782');
    }
    rect(0,46,w,3,'#d5e0d9');rect(0,49,w,21,'#41545b');rect(0,70,w,14,'#a6bdc1');
    for(let i=0;i<47;i++)rect((i*241)%w,(i*19)%43,2,2,'#c2d5d4');
    for(let x=65;x<w;x+=155){rect(x,18,2,31,'#21383f');rect(x-8,16,10,3,'#f5d9a2')}
    rect(642,25,90,5,'#cbd9d3');rect(645,30,3,22,'#32464b');rect(725,30,3,22,'#32464b');
    const x=won?625:35+Math.round(575*history.length/services[level].budget);
    rect(x,39,78,22,'#d8d7bc');rect(x,50,78,8,'#c57655');rect(x+3,36,66,3,'#e4e7db');
    for(let j=0;j<6;j++)rect(x+4+j*10,41,8,7,'#335561');
    rect(x+65,40,10,17,won?'#24383d':'#67838a');rect(x+75,52,3,3,'#ffe5a3');
    for(const offset of [15,60]){c.fillStyle='#263238';c.beginPath();c.arc(x+offset,60,5,0,Math.PI*2);c.fill()}
    c.restore();
  }
  function paint(){
    const service=services[level],remaining=service.budget-history.length;
    won=rows.every((v,i)=>v===goal[i]);
    panel('sign',rows,'#ffb23f',true);panel('target',goal,'#ffc76c');panel('mask',mask,'#78d1ab');
    $('trip').textContent='Service '+(level+1)+' / '+services.length;
    $('status').textContent=won?'Route '+service.route+' restored. '+(level===3?'Last bus away. Shift complete.':'Doors opening.') :remaining===0?'Bus at the stop. Undo an instruction or reset to try again.':remaining+' stops to arrival · '+(history.length?history.map(i=>ops[i.op]).join(' / '):'Awaiting instruction');
    for(const b of $('keys').children)b.disabled=won||remaining===0;
    $('undo').disabled=!history.length;$('next').hidden=!won;$('next').textContent=level===3?'New shift':'Next bus';
  }
  function start(){
    const s=services[level];
    goal=Array.from({length:7},(_,y)=>parseInt([...s.route,'>'].map(ch=>glyphs[ch][y]).join('0')+'0',2));
    mask=goal.map((_,i)=>((0b1001<<(s.seed+i*2)%14)|(1<<(i*3+s.seed)%18))&all);
    rows=goal.slice();history=[];
    for(const op of [...s.steps].reverse())rows=execute(rows,[1,0,2,4,3][op],mask);
    paint();
  }
  ops.forEach((name,op)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{history.push({op,rows});rows=execute(rows,op,mask);paint()};$('keys').append(b)});
  $('undo').onclick=()=>{rows=history.pop().rows;paint()};$('restart').onclick=start;
  $('next').onclick=()=>{level=(level+1)%services.length;start()};start();
})();
