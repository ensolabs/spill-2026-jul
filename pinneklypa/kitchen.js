'use strict';
function kitchenView(canvas){
 const T=THREE,r=new T.WebGLRenderer({canvas,antialias:true,alpha:false});r.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-6,6,4,-4,.1,90);
 scene.background=new T.Color(0x624936);camera.position.set(0,15,7);camera.lookAt(0,0,0);
 const boxGeo=new T.BoxGeometry(),sphere=new T.SphereGeometry(1,24,16),circle=new T.CircleGeometry(1,80);
 const mat=(color,roughness=.75)=>new T.MeshStandardMaterial({color,roughness});
 const wood=mat(0x795039),lightWood=mat(0xb77949),cream=mat(0xffe1ac),white=mat(0xe8ded0),blue=mat(0x275b64),red=mat(0x9a3527),broth=mat(0x97501e,.18),fat=mat(0xffda97,.43),meat=mat(0xaf674c,.46),crust=mat(0x773317,.34),green=mat(0x4a853c),nori=mat(0x19372e);
 function mesh(geo,m,x,y,z,parent=scene){const o=new T.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o}
 function group(x,y,z,parent=scene){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
 function box(x,y,z,w,h,d,m,parent){const o=mesh(boxGeo,m,x,y,z,parent);o.scale.set(w,h,d);return o}
 function oval(x,y,z,w,h,d,m,parent){const o=mesh(sphere,m,x,y,z,parent);o.scale.set(w,h,d);return o}
 function disk(x,y,z,rad,m,parent){const o=mesh(circle,m,x,y,z,parent);o.rotation.x=-Math.PI/2;o.scale.setScalar(rad);return o}
 function ring(x,y,z,rad,thick,m,parent){const o=mesh(new T.TorusGeometry(rad,thick,8,64),m,x,y,z,parent);o.rotation.x=-Math.PI/2;return o}
 function rod(a,b,thin,wide,m,parent){const d=new T.Vector3().subVectors(b,a),o=mesh(new T.CylinderGeometry(wide,thin,d.length(),12),m,0,0,0,parent);o.position.copy(a).lerp(b,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
 const v=(x,y,z)=>new T.Vector3(x,y,z),rand=n=>{const t=Math.sin(n*91.7+12)*12345;return t-Math.floor(t)};
 scene.add(new T.HemisphereLight(0xffe9cd,0xa88d73,1.7));const key=new T.DirectionalLight(0xffe6bb,2.35);key.position.set(-6,8,-4);scene.add(key);const fill=new T.DirectionalLight(0xc5e5ed,1.25);fill.position.set(4,5,6);scene.add(fill);
 for(let i=-9;i<=9;i++)box(0,-.27,i*1.13,45,.46,1.12,mat(i%3===0?0x925e41:i%3===1?0x966548:0x87593e));
 const grain=[];for(let i=0;i<480;i++){const x=rand(i)*25-12,z=rand(i+300)*16-8;grain.push(x,-.034,z,x+rand(i+19)*2.9,-.034,z+.02)}
 const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(grain,3));scene.add(new T.LineSegments(gg,new T.LineBasicMaterial({color:0x744f3b,transparent:true,opacity:.28})));
 // An indigo serving cloth under the lacquer bowl.
 box(2.95,0,0,5.05,.04,5.25,blue);for(let i=0;i<5;i++)box(5.04+i*.075,.025,0,.025,.015,5.25,white);
 function softShadow(x,y,z,w,d,parent){
   const o=disk(x,y,z,1,new T.MeshBasicMaterial({color:0x432519,transparent:true,opacity:.19,depthWrite:false}),parent);o.scale.set(w,d,1);return o;
 }
 softShadow(-2.85,.015,.1,2.9,2.2);box(-2.9,.12,0,5.05,.22,4.8,lightWood);box(-2.9,.24,0,4.89,.06,4.65,mat(0x493e32));
 box(-2.9,.295,0,4.87,.09,.08,lightWood);box(-2.9,.295,0,.08,.09,4.64,lightWood);
 const bx=Kitchen.bowl.x,bg=group(bx,.02,0);softShadow(.11,.02,.12,2.13,1.99,bg);
 const profile=[[.55,.05],[.76,.07],[.9,.22],[1.42,.46],[1.86,.78],[2.1,1.09],[2.11,1.16],[2.03,1.16],[1.96,1.05],[1.68,.78],[.7,.22]].map(([x,y])=>new T.Vector2(x,y));
 mesh(new T.LatheGeometry(profile,88),red,0,0,0,bg);ring(0,1.15,0,2.075,.043,cream,bg);ring(0,1.03,0,2.065,.025,cream,bg);disk(0,1.015,0,1.965,broth,bg);
 const noodles=mat(0xe7b969,.46);
 for(let i=0;i<14;i++){const pts=[];for(let j=0;j<17;j++){const a=-2.5+j*.31+i*.22,radius=.45+i*.071+.13*Math.sin(a*3+i*.21);pts.push(v(Math.cos(a)*radius+.12*Math.sin(i),1.052+.018*Math.sin(j+i),Math.sin(a)*radius+.11*Math.sin(j*.8+i*.24)))}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),32,.029,5,false),noodles,0,0,0,bg)}
 const garnish=group(0,0,0,bg);for(let i=0;i<22;i++){const a=rand(i+14)*6.28,rad=.9+rand(i+64)*.87;const o=ring(Math.cos(a)*rad,1.055,Math.sin(a)*rad,.055+rand(i)*.043,.024,green,garnish);o.scale.x=.76}
 for(let i=0;i<2;i++){const sea=box(.7+i*.65,1.26,-1.1,.83,.82,.06,nori,bg);sea.rotation.set(-.28,0,i*.22-.18)}
 const rippleMat=new T.MeshBasicMaterial({color:0xffde9e,transparent:true,opacity:0,depthWrite:false}),ripple=ring(0,1.055,0,1,.018,rippleMat,bg);
 function extrude(shape,thickness,m,y,parent,bevel=.03){const o=mesh(new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:16}),m,0,y,0,parent);o.rotation.x=-Math.PI/2;return o}
 function bellyShape(){const s=new T.Shape();s.moveTo(-.88,-.35);s.quadraticCurveTo(-1,-.04,-.85,.40);s.bezierCurveTo(-.25,.47,.38,.32,.9,.42);s.quadraticCurveTo(1,.02,.85,-.40);s.bezierCurveTo(.31,-.34,-.39,-.48,-.88,-.35);return s}
 const items={},shadows={};for(const f of Kitchen.foods){
   const g=group(f.x,.30,f.z);items[f.id]=g;shadows[f.id]=softShadow(f.x,.285,f.z,f.rx*1.08,f.rz*1.1);
   if(f.id==='ribbe'){
     const s=bellyShape();let y=0;
     for(const [h,m] of [[.07,crust],[.13,meat],[.08,fat],[.10,meat],[.06,fat],[.12,meat]]){extrude(s,h,m,y,g,.013);y+=h}
     // Wavy fat seams on the cut face, with crisp scored skin along the outer edge.
     for(const offset of [-.22,.04]){
       const seam=new T.Shape();
       seam.moveTo(-.84,offset);seam.bezierCurveTo(-.48,offset+.20,.24,offset-.14,.88,offset+.07);
       seam.bezierCurveTo(.40,offset+.04,-.28,offset+.23,-.84,offset+.045);
       const stripe=mesh(new T.ShapeGeometry(seam),fat,0,y+.015,0,g);stripe.rotation.x=-Math.PI/2;
     }
     const caramel=mat(0xb75c28,.28);
     for(let i=0;i<8;i++){
       const skin=box(-.77+i*.22,y+.018,-.32,.20,.072,.15,caramel,g);
       skin.rotation.y=.09*Math.sin(i);
       oval(skin.position.x,y+.057,-.32,.084,.024+rand(i)*.017,.06,crust,g);
     }
   }else if(f.id==='lotus'){
     const shape=new T.Shape();shape.absarc(0,0,.66,0,Math.PI*2,false);
     for(let i=-1;i<7;i++){const hole=new T.Path(),a=i*Math.PI*2/7;hole.absellipse(i<0?0:Math.cos(a)*.39,i<0?0:Math.sin(a)*.39,i<0?.105:.15,i<0?.105:.098,0,Math.PI*2,true,a);shape.holes.push(hole)}
     extrude(shape,.15,mat(0xe5c28a),.025,g);
   }else if(f.id==='egg'){const egg=oval(0,.3,0,.48,.33,.37,cream,g);egg.rotation.z=.12;
     for(let i=0;i<16;i++){const x=(rand(i)-.5)*.76,z=(rand(i+18)-.5)*.5;oval(x,.3+.33*Math.sqrt(Math.max(0,1-(x/.48)**2-(z/.37)**2)),z,.023,.009,.017,meat,g)}
   }else{const shape=new T.Shape();shape.moveTo(-.49,-.48);shape.lineTo(.49,-.48);shape.lineTo(.49,.48);shape.lineTo(-.49,.48);shape.closePath();extrude(shape,.56,mat(0xf5e5bd,.67),.03,g,.045);for(let i=0;i<18;i++)oval(rand(i)*.85-.43,.62,rand(i+77)*.81-.4,.023,.008,.015,mat(0xdac8a8),g)}
 }
 const chopsticks=group(0,0,0),stickParts=[];for(let i=0;i<2;i++){
   const handle=group(0,0,0,chopsticks);const end=v(.3,1.65,3.15);rod(v(0,0,0),end,.038,.085,lightWood,handle);
   rod(end.clone().multiplyScalar(.78),end,.084,.096,red,handle);stickParts.push(handle)
 }
 const steamCanvas=document.createElement('canvas');steamCanvas.width=steamCanvas.height=64;
 const st=steamCanvas.getContext('2d'),grad=st.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(255,255,255,.7)');grad.addColorStop(1,'transparent');st.fillStyle=grad;st.fillRect(0,0,64,64);const mist=new T.CanvasTexture(steamCanvas);
 const wisps=Array.from({length:14},()=>{const s=new T.Sprite(new T.SpriteMaterial({map:mist,transparent:true,depthWrite:false}));bg.add(s);return s});
 const ray=new T.Raycaster(),plane=new T.Plane(v(0,1,0),-.58),hit=v(0,0,0);
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const ratio=w/h,span=Math.max(3.05,6.2/ratio);camera.left=-span*ratio;camera.right=span*ratio;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();camera.updateMatrixWorld();r.setSize(w,h,false)}
 new ResizeObserver(resize).observe(canvas);resize();
 return {point(e){const b=canvas.getBoundingClientRect();ray.setFromCamera({x:(e.clientX-b.left)/b.width*2-1,y:1-(e.clientY-b.top)/b.height*2},camera);ray.ray.intersectPlane(plane,hit);return [hit.x,hit.z]},
 draw(s,t){
   bg.position.x=bx+(s.slide||0);
   for(const f of s.items){const o=items[f.id];o.position.set(f.x+(f.placed?(s.slide||0):0),.30+f.y,f.z);o.rotation.set(f.pitch,-f.angle,f.tilt);o.scale.set(1+f.squash,1-f.squash,1+f.squash*.45);shadows[f.id].position.x=f.x;shadows[f.id].position.z=f.z;shadows[f.id].visible=!f.placed;}
   chopsticks.position.set(s.x,.55+(s.held?.y||0),s.z);chopsticks.rotation.y=-s.angle;
   stickParts.forEach((o,i)=>{const sign=i?1:-1;o.position.x=sign*s.gap;o.rotation.y=-sign*(s.gap-.24)*.18});
   ripple.scale.setScalar(.35+(1-s.ripple)*1.53);rippleMat.opacity=s.ripple*.6;garnish.rotation.y=.08*s.served+.026*s.ripple;
   wisps.forEach((o,i)=>{const a=(t*.32+i/14)%1;o.position.set(Math.sin(i*36)*1.15+Math.sin(t+i)*a*.3,1.1+a*1.8,Math.cos(i*18)*1.1);o.scale.set(.35+a*.55,.4+a*.8,1);o.material.opacity=Math.sin(a*Math.PI)*.13});
   r.render(scene,camera)
 }};
}
