'use strict';
const Wool=(()=>{
  const pairs=[
    {owner:'Liv',tone:'gold',base:['#bd8739','#c28c3d'],yarn:'#fff0ca',motif:'star',note:'cream eight-pointed stars',inside:'a braided cream hem',hint:'My sister knitted a cream star across each mitten.',thanks:'Liv pulls them on. “Warm right to the fingertips.”'},
    {owner:'Kari',tone:'red',base:['#a74847','#a14745'],yarn:'#eccda1',motif:'berry',note:'three little berries on a stem',inside:'a red ribbed hem',hint:'Turn mine palm up. Dad darned both thumbs in orange.',thanks:'Kari rubs the orange darns. “Dad always used whatever yarn was handy.”'},
    {owner:'Åse',tone:'red',base:['#a74746','#a94849'],yarn:'#ecd5ae',motif:'berry',note:'three little berries on a stem',inside:'two ivory stitches',hint:'Mine have two ivory stitches tucked into each cuff.',thanks:'Åse tucks the cuffs into her coat. “Just in time for the walk up the hill.”'},
    {owner:'Ingrid',tone:'blue',base:['#344c66','#596579'],yarn:'#c3d5cd',motif:'fleck',note:'scattered pale flecks',inside:'INGRID',hint:'One faded in the sun. My name is sewn inside both cuffs.',thanks:'Ingrid laughs at the faded one. “That one spent all summer on the windowsill.”'},
    {owner:'Erik',tone:'blue',base:['#526177','#354b65'],yarn:'#c3d5cd',motif:'fleck',note:'scattered pale flecks',inside:'ERIK',hint:'Undo the cuffs. Four letters, stitched by my mum.',thanks:'Erik reads the little labels. “She still puts my name on everything.”'},
    {owner:'Eira',tone:'green',base:['#41685b','#47705e'],yarn:'#e8dfbb',motif:'spruce',note:'a row of cream spruce trees',inside:'a moss-green hem',hint:'Look at the backs. My trees have little trunks.',thanks:'Eira traces the tiny trees. “They look like the ones above our house.”'},
    {owner:'Odd',tone:'green',base:['#406959','#496f5c'],yarn:'#e6d9b7',motif:'ridge',note:'a line of snowy mountain peaks',inside:'a moss-green hem',hint:'Look at the backs for mountain peaks. The palms have an old pale stripe.',thanks:'Odd turns up a palm. “That stripe was white once, believe it or not.”'}
  ];
  const stars=['100010001','010010010','001010100','000111000','111111111','000111000','001010100','010010010','100010001'];
  const berry=['011000110','111101111','011010110','000010000','000111000','001111100','000111000'];
  const tree=['0001000','0011100','0111110','0011100','0111110','1111111','0001000'];
  function motif(f,x,y){
    const row=Math.floor((y-22)/4),col=Math.floor((x-31)/4);
    if(f.palm){if(f.pair===6&&row===14)return col%4!==0;return false}
    const kind=pairs[f.pair].motif;
    if(kind==='star')return stars[row-4]?.[col-3]==='1'||(row===17||row===19);
    if(kind==='berry')return berry[row-6]?.[col-3]==='1'||row===18&&col%2===0;
    if(kind==='spruce')return tree[row-8]?.[((col%8)+8)%8]==='1'||row===16;
    if(kind==='ridge')return row>=8&&row<16&&Math.abs(((col%10)+10)%10-5)===row-8||row===16;
    return (row%4===0&&(col+row/2)%4===0)||row===19;
  }
  const cache=new Map();
  function thumbnail(f){
    const key=[f.pair,f.hand,f.palm,f.open].join('/');
    if(cache.has(key))return cache.get(key);
    const paper=document.createElement('canvas');paper.width=304;paper.height=380;
    const c=paper.getContext('2d'),pair=pairs[f.pair],base=pair.base[f.hand],flip=Boolean(f.hand)!==f.palm;
    c.scale(2,2);c.save();if(flip){c.translate(152,0);c.scale(-1,1)}
    const shell=new Path2D();
    shell.moveTo(37,136);shell.bezierCurveTo(32,120,26,74,30,49);shell.bezierCurveTo(33,22,47,11,64,12);
    shell.bezierCurveTo(86,11,98,27,98,56);shell.lineTo(99,88);
    shell.bezierCurveTo(104,82,111,62,119,62);shell.bezierCurveTo(133,61,135,74,130,88);
    shell.bezierCurveTo(124,106,111,127,93,139);shell.lineTo(91,150);shell.lineTo(41,150);shell.closePath();
    c.fillStyle=base;c.fill(shell);c.strokeStyle='#352f3555';c.lineWidth=2;c.stroke(shell);
    c.save();c.clip(shell);
    // Each coloured stitch belongs to the same knit grid as the base wool.
    for(let row=0;row<39;row++)for(let col=0;col<30;col++){
      const x=23+4*col+.55*Math.sin(row*.12),y=10+row*4;
      const marked=motif(f,x,y),n=Math.sin(row*9.19+col*8.87);
      c.lineCap='round';c.lineWidth=1.42;
      c.strokeStyle=marked?pair.yarn:(n>.45?'#fff7de4a':'#fff7de30');
      c.beginPath();c.moveTo(x-1.35,y-1.45);c.quadraticCurveTo(x-1.25,y+.35,x,y+1.25);c.stroke();
      c.strokeStyle=marked?pair.yarn:'#211c222e';c.beginPath();c.moveTo(x+.22,y+1.1);c.lineTo(x+1.5,y-1.45);c.stroke();
    }
    const shade=c.createLinearGradient(26,0,133,0);shade.addColorStop(0,'#26242f54');shade.addColorStop(.18,'#fff2d221');shade.addColorStop(.61,'#fff2d200');shade.addColorStop(.73,'#33263534');shade.addColorStop(.9,'#fff1d21a');shade.addColorStop(1,'#32273940');c.fillStyle=shade;c.fillRect(22,10,116,150);
    c.beginPath();c.moveTo(98,87);c.quadraticCurveTo(94,104,86,111);c.strokeStyle='#392f364a';c.lineWidth=1.9;c.stroke();
    if(f.palm&&f.pair===1){c.save();c.translate(115,83);c.rotate(.40);c.fillStyle='#c16a39';c.beginPath();c.ellipse(0,0,8,14,0,0,Math.PI*2);c.fill();
      for(let i=-8;i<=8;i+=4){c.strokeStyle='#f1aa68';c.lineWidth=2;c.beginPath();c.moveTo(-6,i);c.lineTo(6,i-2);c.stroke()}c.restore()}
    c.restore();
    const top=f.open?142:131,bottom=f.open?179:163;
    c.fillStyle=base;c.beginPath();c.roundRect(36,top,60,bottom-top,5);c.fill();c.strokeStyle='#3b2e324d';c.stroke();
    for(let x=39;x<95;x+=3.3){c.strokeStyle='#ffeed849';c.lineWidth=1.15;c.beginPath();c.moveTo(x,top+2);c.lineTo(x+.6,bottom-2);c.stroke()}
    if(f.open){c.fillStyle='#342c344d';c.fillRect(38,top+2,56,6);if(f.pair===2){c.fillStyle=pair.yarn;c.fillRect(55,153,3,12);c.fillRect(63,153,3,12)}
      if(f.pair===0){for(let i=40;i<92;i+=5){c.strokeStyle=pair.yarn;c.beginPath();c.moveTo(i,158);c.lineTo(i+4,161);c.stroke()}}}
    c.restore();
    if(f.open&&(f.pair===3||f.pair===4)){const cx=flip?86:66;c.save();c.translate(cx,160);c.rotate(f.hand?.05:-.04);c.fillStyle='#eedeb9';c.fillRect(-22,-7,44,14);c.strokeStyle='#b8a886';c.setLineDash([2,2]);c.strokeRect(-20,-5,40,10);c.fillStyle='#543e36';c.textAlign='center';c.font='bold 9px monospace';c.fillText(pair.inside,0,3);c.restore()}
    cache.set(key,paper);return paper;
  }
  function picture(f){const src=thumbnail(f),c=document.createElement('canvas');c.width=src.width;c.height=src.height;c.getContext('2d').drawImage(src,0,0);c.setAttribute('aria-hidden','true');return c}
  function describe(f){const p=pairs[f.pair];let clue=f.palm?(f.pair===1?'orange darn on thumb':f.pair===6?'faded palm stripe':'plain knitted palm'):p.note;
    if(f.open)clue+=', inside cuff: '+p.inside;
    return (f.hand?'Right':'Left')+' '+p.tone+' mitten, '+(f.palm?'palm':'back')+', '+clue}
  return {pairs,picture,describe};
})();
