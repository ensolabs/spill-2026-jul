// A winter scene printed on the archive's tabbed index cards.
(()=>{
  const c=document.getElementById('cover').getContext('2d');
  c.fillStyle='#253638';c.fillRect(0,0,600,240);
  function card(x,y,w,h,colour){
    c.fillStyle=colour;c.beginPath();c.moveTo(x,y+12);c.lineTo(x+w*.62,y+12);c.lineTo(x+w*.69,y);c.lineTo(x+w*.94,y);c.lineTo(x+w*.97,y+12);c.lineTo(x+w,y+12);c.lineTo(x+w,y+h);c.lineTo(x,y+h);c.fill()
  }
  card(115,9,448,162,'#749386');card(82,26,454,162,'#c09c74');card(46,45,461,168,'#e5d7b8');
  c.save();c.beginPath();c.rect(61,73,430,123);c.clip();
  c.fillStyle='#9cb5ac';c.fillRect(61,73,430,123);
  c.fillStyle='#f5ce92';c.beginPath();c.arc(356,101,18,0,7);c.fill();
  for(let layer=0;layer<3;layer++){
    c.fillStyle=['#d7ded1','#728d88','#385955'][layer];c.beginPath();c.moveTo(61,207);
    for(let x=60;x<510;x+=3){const y=119+layer*22+13*Math.sin(x*.036+layer*2)+8*Math.cos(x*.072+layer)+3*Math.cos(x*.194);c.lineTo(x,y)}
    c.lineTo(510,207);c.fill()
  }
  for(let i=0;i<54;i++){const x=65+i*8,y=182+11*Math.sin(x*.04),h=9+8*Math.cos(x);
    c.fillStyle='#294944';c.beginPath();c.moveTo(x,y-h);c.lineTo(x+4,y);c.lineTo(x-4,y);c.fill()}
  c.restore();c.fillStyle='#eadfc9';c.fillRect(46,185,461,28);c.font='bold 13px monospace';c.fillStyle='#354d49';c.fillText('ENSŌ   /   WINTER ARCHIVE',62,205);c.fillText('23.XII',445,205)
})();
