'use strict';
function railwayWorld(canvas){
 const T=THREE,r=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 r.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
 const scene=new T.Scene();scene.background=new T.Color(0x122139);scene.fog=new T.FogExp2(0x495d78,.009);
 const cam=new T.PerspectiveCamera(42,1,.08,350),cube=new T.BoxGeometry(),cone=new T.ConeGeometry(1,1,8),orb=new T.SphereGeometry(1,10,8);
 const matte=c=>new T.MeshStandardMaterial({color:c,roughness:.83}),lit=c=>new T.MeshBasicMaterial({color:c});
 const ice=matte(0x93abc4),cap=matte(0xc8d5df),dark=matte(0x283c46),bark=matte(0x705449),pine=matte(0x28534f),rail=matte(0x718389),warm=lit(0xffcb76),red=matte(0x9f4136);
 const fixed=new T.Group();scene.add(fixed);
 function mesh(geometry,mat,x,y,z,parent=fixed){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m}
 function box(x,y,z,w,h,d,mat,parent){const m=mesh(cube,mat,x,y,z,parent);m.scale.set(w,h,d);return m}
 function group(x,y,z,parent=fixed){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
 function seed(n){const v=Math.sin(n*91.71+2)*19334;return v-Math.floor(v)}
 scene.add(new T.HemisphereLight(0xc8dbff,0x556884,.88));
 const moon=new T.DirectionalLight(0xe0eaff,1.19);moon.position.set(-30,48,-15);scene.add(moon);
 box(0,-1,0,230,2,230,ice);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=96;
 const painter=glowCanvas.getContext('2d'),gradient=painter.createRadialGradient(48,48,0,48,48,48);
 gradient.addColorStop(0,'#fff');gradient.addColorStop(.26,'rgba(255,255,255,.67)');gradient.addColorStop(.68,'rgba(255,255,255,.17)');gradient.addColorStop(1,'transparent');painter.fillStyle=gradient;painter.fillRect(0,0,96,96);
 const glowTex=new T.CanvasTexture(glowCanvas),washMat=new T.MeshBasicMaterial({map:glowTex,color:0xffb667,transparent:true,opacity:.48,depthWrite:false,blending:T.AdditiveBlending});
 const washGeo=new T.PlaneGeometry(1,1);
 function lightPool(x,y,z,w,h,p){const o=mesh(washGeo,washMat,x,y,z,p);o.rotation.x=-Math.PI/2;o.scale.set(w,h,1);return o}
 // The elevated stone bed, sleepers and twin rails follow the same distance table as the trains.
 for(let s=0;s<Rail.length;s+=.55){
   const p=Rail.at(s),piece=group(p.x,0,p.z);piece.rotation.y=p.yaw;
   box(0,.07,0,1.32,.16,.66,rail,piece);box(0,.19,0,1.13,.12,.21,bark,piece);
   for(const side of [-1,1])box(side*.38,.28,0,.095,.13,.64,dark,piece);
 }
 function atTrack(x,z){let d=1e3;for(let s=0;s<Rail.length;s+=1.1){const p=Rail.at(s);d=Math.min(d,Math.hypot(x-p.x,z-p.z))}return d}
 function cabin(x,z,angle,scale=1){
   const g=group(x,0,z);g.rotation.y=angle;g.scale.setScalar(scale);
   box(0,1.25,0,3.6,2.5,3.1,red,g);
   for(const k of [-1,1]){
     const roof=box(k*.98,3.02,0,2.34,.25,3.65,cap,g);roof.rotation.z=-k*.5;
     for(const side of [-1,1]){box(k*1.03,1.35,side*1.56,.7,.83,.055,warm,g);box(k*1.03,1.35,side*1.6,.075,.86,.035,dark,g)}
   }box(.9,3.65,-.65,.5,1.05,.5,bark,g);lightPool(0,.025,1.65,7,6,g);
 }
 cabin(14,1,-.16,1.1);cabin(18,-3,.25,.8);cabin(-15,-3,.15,.88);cabin(-21,1,.32,.65);
 // A little enamel maker’s mark faces the train on the approach to the first signal.
 const verge=Rail.at(-10),post=group(verge.x+1.75*Math.cos(verge.yaw),0,verge.z-1.75*Math.sin(verge.yaw));
 post.rotation.y=verge.yaw+Math.PI+.35;
 box(0,.66,0,.09,1.32,.09,bark,post);
 box(0,1.39,0,.86,.64,.10,dark,post);
 const plaque=document.createElement('canvas');plaque.width=160;plaque.height=120;
 const ink=plaque.getContext('2d');ink.fillStyle='#314b47';ink.fillRect(0,0,160,120);
 ink.fillStyle='#e6dfbd';ink.font='82px Georgia, serif';ink.textAlign='center';ink.fillText('ō',80,88);
 const enamel=new T.CanvasTexture(plaque);enamel.colorSpace=T.SRGBColorSpace;
 mesh(washGeo,new T.MeshBasicMaterial({map:enamel}),0,1.39,.052,post).scale.set(.82,.60,1);
 const driftGeo=new T.CircleGeometry(1,14),driftMat=matte(0x839bb2);for(let i=0;i<580;i++){
   const x=(seed(i)-.5)*116,z=(seed(i+1170)-.5)*94;
   if(atTrack(x,z)<2.6||Math.abs(x)<4&&Math.abs(z)<5||Math.abs(z)<5&&Math.abs(x)>11&&Math.abs(x)<23)continue;
   const h=2.1+seed(i+100)*4.6;const drift=mesh(driftGeo,driftMat,x+.4,.01,z+.45);drift.rotation.x=-Math.PI/2;drift.scale.set(h*.37,h*.24,1);box(x,h*.22,z,.23,h*.44,.23,bark);
   for(let k=0;k<3;k++){const radius=h*(.26-.055*k),t=mesh(cone,pine,x,h*(.4+k*.21),z);t.scale.set(radius,h*.48,radius);
     const layer=mesh(cone,cap,x,h*(.47+k*.21),z);layer.scale.set(radius*.84,h*.4,radius*.84)}
 }
 for(let i=0;i<38;i++){const a=i*2.4,R=75+seed(i+400)*30,h=15+seed(i+600)*24;const p=mesh(cone,ice,Math.sin(a)*R,h*.45-3,Math.cos(a)*R);p.scale.set(16+seed(i)*9,h,19)}
 // A timber snow shed frames the window view at the far bend.
 const bend=Rail.at(Rail.length*.75),shed=group(bend.x,0,bend.z);shed.rotation.y=bend.yaw;
 for(const side of [-1,1])for(let z=-2;z<=2;z+=2)box(side*1.65,1.55,z,.22,3.1,.22,bark,shed);
 box(0,3.2,0,3.8,.35,5.5,cap,shed);
 const stars=new Float32Array(550*3);for(let i=0;i<550;i++){const a=seed(i)*6.28,b=seed(i+60)*1.4+.1;stars.set([145*Math.cos(a)*Math.cos(b),145*Math.sin(b),145*Math.sin(a)*Math.cos(b)],3*i)}
 function particles(coords,color,size){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(coords,3));const p=new T.Points(geo,new T.PointsMaterial({color,size,fog:false}));scene.add(p);return p}
 particles(stars,0xffefd8,.18);
 const snow=new Float32Array(480*3);for(let i=0;i<480;i++)snow.set([(seed(i+210)-.5)*90,seed(i+900)*42,(seed(i+140)-.5)*70],i*3);
 const flakes=particles(snow,0xeaf7ff,.052);
 // Bake the miniature scenery into instanced batches.
 fixed.updateMatrixWorld(true);const batches=new Map();
 fixed.traverse(o=>{if(!o.isMesh)return;const key=o.geometry.id+':'+o.material.id;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o)});
 for(const list of batches.values()){const batch=new T.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((o,i)=>batch.setMatrixAt(i,o.matrixWorld));scene.add(batch)}scene.remove(fixed);
 const green=lit(0x76ffc2),stop=lit(0xff6859);const lamps=[];
 for(let k=0;k<2;k++){const p=Rail.at(k*Rail.half-4.8),g=group(p.x,0,p.z,scene);g.rotation.y=p.yaw;
   box(1.2,1.27,0,.12,2.54,.12,dark,g);box(1.2,2.6,0,.52,.82,.37,dark,g);
   const bulb=mesh(orb,green,1.2,2.63,-.21,g);bulb.scale.set(.21,.21,.12);lamps.push(bulb);
   const c=document.createElement('canvas');c.width=c.height=96;const u=c.getContext('2d');u.fillStyle='#182e35';u.fillRect(12,12,72,72);u.fillStyle='#ffefd3';u.font='bold 54px monospace';u.textAlign='center';u.fillText(k?'B':'A',48,66);
   const tag=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true}));tag.scale.setScalar(2.05);tag.position.set(1.2,3.85,0);g.add(tag)
 }
 const paints=[matte(0xbf533d),matte(0x54899b),matte(0x825b3e),matte(0x718a59)],stock=[];
 function car(t,i){
   const g=group(0,0,0,scene),paint=paints[t.id];box(0,.52,0,1.08,.43,2, dark,g);
   box(0,1.12,0,1.18,.88,1.94,paint,g);
   if(t.freight&&i){for(let k=0;k<3;k++){const log=mesh(orb,bark,(k-1)*.33,1.63,0,g);log.scale.set(.23,.22,1.02)}}
   else{box(0,1.66,0,1.27,.18,2.03,cap,g);
     for(const side of [-1,1])for(let j=-1;j<=1;j++)box(side*.595,1.27,j*.54,.028,.39,.38,warm,g);
     box(0,1.25,1,.82,.36,.03,warm,g);
     box(0,1.02,0,1.20,.08,1.97,cap,g);
     if(i===0){
       lightPool(0,.33,3.2,2.8,6.5,g);
       const head=new T.SpotLight(0xffda94,18,12,.43,.7,1.3);head.position.set(0,.85,1);head.target.position.set(0,.35,7);g.add(head,head.target);
       for(const side of [-1,1])box(side*.38,.8,1.01,.19,.16,.03,warm,g)}
   }return g
 }
 let blend=0,last=0;const eye=new T.Vector3(),aim=new T.Vector3(),upEye=new T.Vector3(),upAim=new T.Vector3(),rideEye=new T.Vector3(),rideAim=new T.Vector3();
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;cam.aspect=w/h;cam.updateProjectionMatrix();r.setSize(w,h,false)}new ResizeObserver(resize).observe(canvas);resize();
 return (desk,ride,now)=>{
   const dt=Math.min(.1,Math.max(0,now-last));last=now;
   blend+=(Number(ride)-blend)*(1-Math.exp(-dt*3.3));
   desk.trains.forEach(t=>{if(!stock[t.id])stock[t.id]=Array.from({length:t.cars},(_,i)=>car(t,i));
     stock[t.id].forEach((g,i)=>{const p=Rail.at(t.s-i*Rail.pitch);g.visible=true;g.position.set(p.x,0,p.z);g.rotation.y=p.yaw})});
   for(let i=desk.trains.length;i<stock.length;i++)stock[i].forEach(g=>g.visible=false);
   lamps.forEach((lamp,k)=>lamp.material=(desk.owner?(desk.owner.next%2===k):desk.selected===k)?green:stop);
   const train=desk.trains[0],p=Rail.at(train.s-Rail.pitch),sn=Math.sin(p.yaw),cs=Math.cos(p.yaw);
   rideEye.set(p.x+.63*cs,1.43,p.z-.63*sn);rideAim.set(rideEye.x+sn*6+cs*3,1.3,rideEye.z+cs*6-sn*3);
   const distance=Math.max(47,82/cam.aspect);
   upEye.set(0,distance*.86,distance*.56);upAim.set(0,0,0);
   eye.lerpVectors(upEye,rideEye,blend);aim.lerpVectors(upAim,rideAim,blend);cam.position.copy(eye);cam.lookAt(aim);
   flakes.position.y=-(now*.64%4);r.render(scene,cam);
 };
}
