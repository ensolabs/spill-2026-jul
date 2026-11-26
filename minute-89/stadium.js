'use strict';
function stadium(canvas){
 const T=THREE,r=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 r.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
 const scene=new T.Scene();scene.background=new T.Color(0x172639);scene.fog=new T.FogExp2(0x536477,.012);
 const camera=new T.PerspectiveCamera(41,1,.1,220),focus=new T.Vector3(),cam=new T.Vector3(),look=new T.Vector3(),unit=new T.BoxGeometry(),sphere=new T.SphereGeometry(1,12,8);
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.82}),bright=c=>new T.MeshBasicMaterial({color:c});
 const white=bright(0xe5e9d6),snow=mat(0xd3dbdf),steel=mat(0x394858),gold=bright(0xffcc68);
 function mesh(geo,m,x,y,z,p=scene){const o=new T.Mesh(geo,m);o.position.set(x,y,z);p.add(o);return o}
 function box(x,y,z,w,h,d,m,p){const o=mesh(unit,m,x,y,z,p);o.scale.set(w,h,d);return o}
 function orb(x,y,z,w,h,d,m,p){const o=mesh(sphere,m,x,y,z,p);o.scale.set(w,h,d);return o}
 function line(points,color,parent=scene){const geom=new T.BufferGeometry().setFromPoints(points.map(v=>new T.Vector3(...v)));const o=new T.Line(geom,new T.LineBasicMaterial({color}));parent.add(o);return o}
 const hemi=new T.HemisphereLight(0xdfefff,0x52755c,2);scene.add(hemi);
 const key=new T.DirectionalLight(0xfff3d4,2.7);key.position.set(-16,28,-15);scene.add(key);
 box(0,-.38,25,108,.6,120,snow);
 for(let i=0;i<14;i++)box(0,-.09,-3+i*5,65,.18,5,mat(i%2?0x357052:0x417c59));
 line([[-32,.025,-.1],[32,.025,-.1],[32,.025,65]],0xf0f5da);
 for(const [w,d] of [[20.16,16.5],[9.15,5.5]])line([[-w,.03,0],[-w,.03,d],[w,.03,d],[w,.03,0]],0xf0f5da);
 const arc=[];for(let j=0;j<=36;j++){const a=.65+(Math.PI-1.3)*j/36;arc.push([Math.cos(a)*9.15,.04,11+Math.sin(a)*9.15])}line(arc,0xf0f5da);
 for(const x of [-3.66,3.66]){box(x,1.22,0,.13,2.44,.13,white);line([[x,2.44,0],[x,2.27,-1.55],[x,.02,-2.1],[x,.02,0]],0xc7d6c9)}
 box(0,2.44,0,7.44,.13,.13,white);
 const net=[];for(let x=-3.66;x<=3.67;x+=.305)net.push([x,2.44,0],[x,2.27,-1.55],[x,2.27,-1.55],[x,0,-2.1]);for(let y=0;y<2.4;y+=.28)net.push([-3.66,y,-2.1+y*.24],[3.66,y,-2.1+y*.24]);
 scene.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(net.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color:0xabc0be,transparent:true,opacity:.68})));
 const grassShadow=new T.MeshBasicMaterial({color:0x183f36,transparent:true,opacity:.38,depthWrite:false});
 const skin=[mat(0xe0a57e),mat(0xb47b5d),mat(0x8c604d)],home=mat(0xffdf12),away=mat(0xce2839),navy=mat(0x1c3445),socks=mat(0xf8e6bf),keeperKit=mat(0x538de8),hair=mat(0x453936);
 const cloth=document.createElement('canvas');cloth.width=64;cloth.height=4;
 const ink=cloth.getContext('2d');ink.fillStyle='#cd2335';ink.fillRect(0,0,64,4);
 ink.fillStyle='#f8bf29';for(let x=0;x<64;x+=16)ink.fillRect(x,0,7,4);
 const stripes=new T.CanvasTexture(cloth);stripes.colorSpace=T.SRGBColorSpace;stripes.wrapS=T.RepeatWrapping;
 const awayShirt=new T.MeshStandardMaterial({map:stripes,roughness:.82});
 let personCount=0;
 function person(kit){
   const root=new T.Group(),body=new T.Group();scene.add(root);root.add(body);const sk=skin[personCount++%3];
   const shadow=orb(0,.014,.08,.43,.015,.28,grassShadow,root);
   orb(0,1.28,0,.28,.38,.16,kit===away?awayShirt:kit,body);box(0,.93,0,.44,.21,.29,kit===home?home:navy,body);
   orb(0,1.83,0,.158,.19,.15,sk,body);orb(0,1.94,.015,.161,.105,.151,hair,body);
   const legs=[],arms=[];for(const s of [-1,1]){const l=new T.Group();l.position.set(s*.13,.94,0);body.add(l);box(0,-.22,0,.17,.4,.18,sk,l);box(0,-.63,0,.14,.43,.15,kit===keeperKit?socks:kit,l);box(0,-.88,-.055,.16,.13,.29,navy,l);legs.push(l);
     const a=new T.Group();a.position.set(s*.245,1.51,0);body.add(a);a.rotation.z=s*.12;box(0,-.12,0,.13,.24,.15,kit,a);box(0,-.33,-.035,.12,.25,.11,sk,a);arms.push(a)}
   return {root,body,shadow,legs,arms};
 }
 const players=[person(home),person(home)],markers=[person(away),person(away)],taker=person(home),keeper=person(keeperKit);
 Match.wall.forEach(([x,z])=>{const w=person(away);w.root.position.set(x,0,z);w.root.rotation.y=Math.PI});
 const ball=orb(0,.14,0,.18,.18,.18,white);for(let i=0;i<5;i++){const a=i*2.4;orb(.78*Math.cos(a),.38*Math.sin(a*2),.78*Math.sin(a),.32,.31,.32,navy,ball)}
 const rand=n=>{const f=Math.sin(147*n+2)*43211;return f-Math.floor(f)};
 // A single instanced crowd fills the far stand; rows follow the stadium rake.
 const seats=new T.InstancedMesh(unit,mat(0xffffff),780),dummy=new T.Object3D(),palette=[0x459e88,0xd9cbab,0x5e7384,0x263945,0xac625e,0xe8c779];
 let idx=0;
 for(let row=0;row<10;row++){
   const z=-8-row*1.05,y=.5+row*.63;
   box(0,y-.48,z,78,.85,1.2,steel);
   for(let j=0;j<78;j++){dummy.position.set(j-39+rand(idx)*.3,y+.18,z);dummy.scale.set(.54,.72+rand(idx+6)*.42,.45);dummy.updateMatrix();seats.setMatrixAt(idx,dummy.matrix);seats.setColorAt(idx,new T.Color(palette[Math.floor(rand(idx+7)*palette.length)]));idx++}
 }scene.add(seats);
 const crowdHeads=new T.InstancedMesh(sphere,mat(0xffffff),idx);
 for(let i=0;i<idx;i++){
   seats.getMatrixAt(i,dummy.matrix);dummy.matrix.decompose(dummy.position,dummy.quaternion,dummy.scale);
   dummy.position.y+=dummy.scale.y*.5+.14;dummy.scale.set(.19,.23,.18);dummy.updateMatrix();
   crowdHeads.setMatrixAt(i,dummy.matrix);crowdHeads.setColorAt(i,new T.Color([0x776053,0xa98871,0xb3aaad,0x505167][i%4]));
 }scene.add(crowdHeads);
 for(const x of [-24,-13,13,24]){
   const z=-17;box(x,6.8,z,.07,3.3,.07,steel);box(x+.7,7.88,z,1.4,.88,.045,mat(0xb95151));
   box(x+.48,7.88,z+.03,.23,.88,.03,white);box(x+.7,7.88,z+.03,1.4,.22,.03,white);
   box(x+.48,7.88,z+.06,.12,.88,.02,navy);box(x+.7,7.88,z+.06,1.4,.11,.02,navy);
 }
 const peaks=[];for(let i=-10;i<=10;i++){const x=i*9;peaks.push(x-15,-2,-66,x,14+rand(i+85)*13,-72,x+15,-2,-66)}
 const ridge=new T.BufferGeometry();ridge.setAttribute('position',new T.Float32BufferAttribute(peaks,3));mesh(ridge,new T.MeshBasicMaterial({color:0x61768a,side:T.DoubleSide}),0,0,0);
 box(0,9.6,-16,85,.35,8,snow);box(0,9.31,-12,85,.32,.32,steel);
 for(let x=-39;x<=40;x+=6){box(x,4.5,-19,.16,9,.16,steel);line([[x,9,-12],[x+3,8.5,-12],[x+6,9,-12]],0x8da0a5)}
 const boardTex=document.createElement('canvas');boardTex.width=1024;boardTex.height=64;const c=boardTex.getContext('2d');c.fillStyle='#15403f';c.fillRect(0,0,1024,64);c.fillStyle='#d0f4df';c.font='bold 39px Arial';c.fillText('enso   /   WINTER ARCADE     ✳     ensō stadium',34,47);
 const signage=new T.MeshBasicMaterial({map:new T.CanvasTexture(boardTex)});for(let x=-32;x<=32;x+=16)mesh(new T.PlaneGeometry(16,1.15),signage,x,.72,-4.8);
 const glow=document.createElement('canvas');glow.width=glow.height=64;const ctx=glow.getContext('2d'),grad=ctx.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'white');grad.addColorStop(.1,'#fffce6');grad.addColorStop(.3,'#ffedba80');grad.addColorStop(1,'transparent');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
 const halo=new T.SpriteMaterial({map:new T.CanvasTexture(glow),blending:T.AdditiveBlending,depthWrite:false});
 for(let x=-36;x<=36;x+=12){box(x,10.7,-13,.15,2,.15,steel);box(x,11.7,-13,3,.52,.42,white);const s=new T.Sprite(halo);s.scale.set(7,5,1);s.position.set(x,11.7,-12.7);scene.add(s)}
 const flakes=new Float32Array(600*3);
 for(let i=0;i<600;i++){flakes[3*i]=rand(i+990)*83-41;flakes[3*i+1]=rand(i+1600)*30;flakes[3*i+2]=rand(i+2400)*72-27}
 const fg=new T.BufferGeometry();fg.setAttribute('position',new T.BufferAttribute(flakes,3));const powder=new T.Points(fg,new T.PointsMaterial({color:0xfafffc,size:.065,transparent:true,opacity:.8}));scene.add(powder);
 const guides=new T.Group();scene.add(guides);const aimRing=mesh(new T.RingGeometry(.73,.82,32),gold,0,.055,7);aimRing.rotation.x=-Math.PI/2;
 function plan(p){
   for(const child of [...guides.children]){child.geometry.dispose();child.material.dispose();guides.remove(child)}
   p.routes.forEach((route,i)=>line(route.map(([x,z])=>[x,.08,z]),i?0xffefa2:0xffdc24,guides));
   const arc=[];for(let i=0;i<=40;i++)arc.push(Match.ball(p,i/40));line(arc,0xf3c474,guides);
   aimRing.position.x=p.target;
 }
 function athlete(a,loc,t,running,angle=0,jump=0){
   a.root.position.set(loc[0],0,loc[1]);a.root.rotation.y=angle;a.body.position.y=jump+(running?.055*Math.abs(Math.sin(t*10)):0);
   a.legs.forEach((l,i)=>l.rotation.x=running?Math.sin(t*10+i*Math.PI)*.68:0);a.arms.forEach((l,i)=>l.rotation.x=running?-Math.sin(t*10+i*Math.PI)*.57:-.13);
 }
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();r.setSize(w,h,false)}}
 new ResizeObserver(resize).observe(canvas);resize();let init=true;
 return {plan,draw(p,result,t,mode,now){
   const live=mode!=='plan',s=Match.sample(p,result,t);guides.visible=aimRing.visible=!live;
   players.forEach((a,i)=>{const n=Match.run(p.routes[i],Math.min(t+.03,Match.meet+.32)),v=s.bodies[i],moving=live&&Match.gap(n,v)>.002;
     athlete(a,v,t+i,moving,moving?Math.atan2(v[0]-n[0],v[1]-n[1]):0,result.shot?.striker===i?s.jump*.45:0)});
   markers.forEach((a,i)=>athlete(a,s.marks[i],t+i,live&&t<Match.meet,.5));
   athlete(taker,[Match.kick[0]-1.4*(1-s.kickRun),Match.kick[1]+1.9*(1-s.kickRun)],t,live&&t<Match.lead,-.55);
   athlete(keeper,[s.keeper,.65],t,false,Math.PI);keeper.body.rotation.z=result.shot&&t>Match.meet?Math.sign(result.shot.keeper-s.keeper)*.72:0;
   ball.position.set(s.ball[0],Math.max(.185,s.ball[1]),s.ball[2]);ball.rotation.y=t*12;
   const zoom=live?Math.min(1,t/2):0,wide=camera.aspect<1.4?5:0;
   cam.set(3-zoom,12.8+wide-zoom*6.4,39+wide-zoom*21);look.set(-3+zoom*(2+s.ball[0]*.38),2.3,9-zoom*6);
   if(init){camera.position.copy(cam);focus.copy(look);init=false}else{camera.position.lerp(cam,.11);focus.lerp(look,.14)}
   camera.lookAt(focus);powder.position.y=-(now*.65%4);powder.position.x=Math.sin(now*.3)*.7;r.render(scene,camera);
 }};
}
