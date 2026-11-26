function drawStation(canvas,level){
  const c=canvas.getContext('2d');
  function box(x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
  function sign(x,y,w,label,bg='#244754',fg='#fff4d9'){
    box(x,y,w,42,bg);c.fillStyle=fg;c.font='bold 25px system-ui';c.textAlign='center';c.fillText(label,x+w/2,y+30)
  }
  function shape(points,col){c.fillStyle=col;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
  const sky=c.createLinearGradient(0,0,0,205);sky.addColorStop(0,'#263850');sky.addColorStop(1,'#a4b8bd');box(0,0,600,250,sky);
  for(let i=0;i<85;i++)box(i*137%600,i*83%175,2,2,'#d7e3df');
  for(let i=0;i<50;i++){const x=i*13,h=27+13*Math.sin(i*2.7);shape([[x-12,165],[x,152-h],[x+13,165]],'#405a60')}
  box(0,163,600,87,'#bbcfd3');box(0,215,600,35,'#748c98');box(0,214,600,4,'#f5ecda');
  if(level===0){
    box(22,87,224,121,'#705d52');box(32,103,204,83,'#d6a879');box(42,109,58,66,'#97afac');box(112,109,54,66,'#97afac');box(38,173,142,8,'#755948');box(18,78,232,10,'#e6ece1');sign(27,44,215,'WEST SHELTER');
    box(432,57,12,133,'#536774');sign(345,22,202,'PLATFORM 3');
    c.beginPath();c.moveTo(268,218);c.bezierCurveTo(316,215,329,181,361,169);c.bezierCurveTo(408,151,420,92,475,101);c.bezierCurveTo(527,99,544,150,600,138);c.lineTo(600,221);c.closePath();c.fillStyle='#f5f5e9';c.fill();
    shape([[280,216],[384,187],[433,153],[484,151],[428,177],[400,197],[507,183],[600,160],[600,220]],'#b8cdd7');
    box(333,177,7,43,'#644f46');box(494,177,7,43,'#644f46');sign(323,161,191,'CLOSED','#9a4937')
  }else if(level===1){
    box(26,42,250,169,'#576e78');box(39,79,222,132,'#317895');box(61,92,145,116,'#9ec5ca');box(132,92,4,116,'#467782');sign(38,32,225,'BLUE LIFT');sign(317,37,227,'PLATFORM 2');box(418,79,9,54,'#506573');
    for(let i=0;i<5;i++){box(300+i*26,194-i*17,300-i*26,22+i*17,'#71848c');box(300+i*26,192-i*17,300-i*26,4,'#e5e8db')}
  }else{
    box(39,38,522,114,'#24383d');box(62,150,9,60,'#486369');box(527,150,9,60,'#486369');
    sign(49,43,502,'DEPARTURES');sign(52,93,496,'SLEEPER   ·   PLATFORM  —','#172d34','#ffc884');
    box(76,186,172,9,'#865d47');box(85,195,7,17,'#4a5050');box(232,195,7,17,'#4a5050')
  }
}
