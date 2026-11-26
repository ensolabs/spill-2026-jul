'use strict';
// The nearest pass of the tool defines a furrow with a bank of displaced snow on either side.
function snowSurface(ctx,size,random){
 const image=ctx.createImageData(size,size),base=new Uint8ClampedArray(image.data.length);
 const field=new Uint8Array(size*size),relief=new Float32Array(256),shade=new Float32Array(256);
 const deposited=new Float64Array(field.length),tiles=new Map();
 const tileSize=48,columns=Math.ceil(size/tileSize),soakMs=4200;
 let melted=false,timer=0,alreadySettled=false;
 // Keep the crust fixed in sheet coordinates so slow and coalesced pointer events
 // break the same ridges. Positive contact offsets represent tougher patches.
 const crust=new Float32Array(field.length),height=new Float32Array(field.length);
 function noiseLayer(spacing){
   const stride=Math.ceil(size/spacing)+1,grid=Float32Array.from({length:stride*stride},()=>random()*2-1);
   return (x,y)=>{
     const gx=x/spacing,gy=y/spacing,ix=Math.floor(gx),iy=Math.floor(gy);
     let u=gx-ix,v=gy-iy;u*=u*(3-2*u);v*=v*(3-2*v);
     const i=iy*stride+ix;
     return (grid[i]*(1-u)+grid[i+1]*u)*(1-v)+(grid[i+stride]*(1-u)+grid[i+stride+1]*u)*v;
   };
 }
 const hummock=noiseLayer(18),clump=noiseLayer(5),grain=noiseLayer(2);
 function profile(){
 for(let k=0;k<256;k++){
   const u=k/170;
   relief[k]=melted?-12*Math.exp(-2.8*u*u):-8*Math.exp(-3*u*u)+4.6*Math.exp(-((u-.99)**2)/.029);
   shade[k]=15*Math.exp(-4*u*u);
 }
 relief[255]=shade[255]=0;
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=(y*size+x)*4;
   const lump=clump(x,y),fine=grain(x,y);
   crust[y*size+x]=.49*hummock(x,y)+.36*lump+.15*fine;
   const drift=2.5*Math.sin(y*.037+x*.012+2*Math.sin(x*.008))+2*Math.cos(y*.012-x*.016);
   const light=7*(1-(x+y)/(2*size))+drift+lump*4+fine*3+(random()-.5)*11+(random()>.986?14:0);
   base[i]=222+light;base[i+1]=233+light*.85;base[i+2]=240+light*.67;base[i+3]=255;
 }
 function clear(yellow=false,settled=false){clearTimeout(timer);timer=0;tiles.clear();alreadySettled=settled;melted=yellow;profile();field.fill(255);height.fill(0);image.data.set(base);ctx.putImageData(image,0,0)}
 function carve(a,b,oldRadius,radius){
   const vx=b.x-a.x,vy=b.y-a.y,len=vx*vx+vy*vy,reach=Math.max(oldRadius,radius)*1.97+4;
   const x0=Math.max(1,Math.floor(Math.min(a.x,b.x)-reach)),x1=Math.min(size-2,Math.ceil(Math.max(a.x,b.x)+reach));
   const y0=Math.max(1,Math.floor(Math.min(a.y,b.y)-reach)),y1=Math.min(size-2,Math.ceil(Math.max(a.y,b.y)+reach));
   if(x0>x1||y0>y1)return;
   const now=performance.now(),stamp=alreadySettled?now-soakMs:now;
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
     const dx=x-a.x,dy=y-a.y,t=len?Math.min(1,Math.max(0,(dx*vx+dy*vy)/len)):0;
     const width=oldRadius+(radius-oldRadius)*t,i=y*size+x;
     // The tip skims over packed patches and bites into looser snow. Large
     // crumbs distort the rim more than the compressed centre of the groove.
     const hardness=crust[i],distance=Math.hypot(dx-t*vx,dy-t*vy);
     const rim=Math.min(1,distance/width);
     const rough=hardness*(2+width*(melted?.14:.40))*rim+(base[i*4]-228)*.07;
     const k=Math.max(0,Math.round(170*(distance+rough)/width));
     if(k<field[i]){
       field[i]=k;
       // Loose clumps heap up at the lip. Hard flakes stay higher in the
       // floor of a light scratch and yield under a broader, deeper pass.
       const depth=melted?1:Math.min(1.16,.48+width/38);
       const bank=relief[k]>0;
       height[i]=relief[k]*(bank?1.13+hardness*.90:depth*(1-hardness*.38));
       if(melted)deposited[i]=stamp;
     }
   }
   paint(Math.max(1,x0-1),Math.max(1,y0-1),Math.min(size-2,x1+1),Math.min(size-2,y1+1),now);
   if(!melted||alreadySettled)return;
   for(let ty=Math.floor(y0/tileSize);ty<=Math.floor(y1/tileSize);ty++)
     for(let tx=Math.floor(x0/tileSize);tx<=Math.floor(x1/tileSize);tx++)tiles.set(ty*columns+tx,now);
   if(!timer)timer=setTimeout(soak,100);
 }
 function soak(){
   const now=performance.now();
   for(const [id,last] of tiles){
     const x=(id%columns)*tileSize,y=Math.floor(id/columns)*tileSize;
     paint(Math.max(1,x),Math.max(1,y),Math.min(size-2,x+tileSize-1),Math.min(size-2,y+tileSize-1),now);
     if(now-last>=soakMs)tiles.delete(id);
   }
   timer=tiles.size?setTimeout(soak,100):0;
 }
 function paint(x0,y0,x1,y1,now){
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
     const i=y*size+x,k=field[i];
     const slope=(height[i+1]-height[i-1])*.65+(height[i+size]-height[i-size])*.85;
     const value=Math.min(30,Math.max(-52,slope*10))-shade[k];
     image.data[i*4]=base[i*4]+value*1.24;image.data[i*4+1]=base[i*4+1]+value;
     image.data[i*4+2]=base[i*4+2]+value*.68;
     if(melted&&k<235){
       const age=Math.min(1,(now-deposited[i])/soakMs);
       const absorbed=age*(2-age);
       const stain=(1-k/235)**(1.55-.55*absorbed)*(1-.64*absorbed);
       // Absorption darkens the wet grains; the remaining pigment feathers out.
       image.data[i*4]-=8*stain;
       image.data[i*4+1]-=27*stain;
       image.data[i*4+2]-=118*stain;
     }
   }
   ctx.putImageData(image,0,0,x0,y0,x1-x0+1,y1-y0+1);
 }
 return {clear,carve};
}
