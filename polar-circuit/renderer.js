'use strict';
function createCircuitView(canvas,onRotate){
 const T=THREE,renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-8,8,6,-6,.1,140);
 scene.background=new T.Color(0x181426);scene.fog=new T.FogExp2(0x231c38,.027);
 const world=new T.Group(),circuit=new T.Group(),signals=new T.Group();
 scene.add(world,circuit,signals);
 const boxGeo=new T.BoxGeometry(),cylGeo=new T.CylinderGeometry(1,1,1,32);
 const standard=(c,metalness=.42)=>new T.MeshStandardMaterial({color:c,metalness,roughness:.4});
 const light=c=>new T.MeshBasicMaterial({color:c});
 const shell=standard('#454054'),frame=standard('#77728a'),dark=standard('#1b1a28'),tile=standard('#394052'),rack=standard('#333345'),brass=standard('#b8a3be'),glass=standard('#b99ee8',.6);
 const violet=light('#b794ff'),iceMat=light('#75ffed'),roseMat=light('#ff91c9'),white=light('#edfffb');
 const lights=[iceMat,roseMat],colors=[0x68ffdf,0xff71b9];
 const glowTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gradient=g.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'white');gradient.addColorStop(.18,'rgba(255,255,255,.6)');gradient.addColorStop(.6,'rgba(255,255,255,.09)');gradient.addColorStop(1,'transparent');g.fillStyle=gradient;g.fillRect(0,0,64,64);return new T.CanvasTexture(c)})();
 const glowMats=colors.map(color=>new T.SpriteMaterial({map:glowTexture,color,blending:T.AdditiveBlending,transparent:true,depthWrite:false}));
 function mesh(geometry,mat,x,y,z,parent){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m}
 function box(x,y,z,w,h,d,mat,parent=world){const m=mesh(boxGeo,mat,x,y,z,parent);m.scale.set(w,h,d);return m}
 function cyl(x,y,z,r,h,mat,parent){const m=mesh(cylGeo,mat,x,y,z,parent);m.scale.set(r,h,r);return m}
 function halo(x,y,z,size,color,parent){const s=new T.Sprite(glowMats[color]);s.position.set(x,y,z);s.scale.setScalar(size);parent.add(s);return s}
 function group(x,y,z,parent){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
 const pos=n=>(n-2.5)*1.45;
 scene.add(new T.HemisphereLight(0xe3dcff,0x5f4b84,2));
 for(const [x,y,z,color,intensity] of [[-6,9,6,0xb3fff2,3],[4,6,-7,0xc897ff,3]]){const sun=new T.DirectionalLight(color,intensity);sun.position.set(x,y,z);scene.add(sun)}
 const coldFloor=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec3 site;void main(){vec4 q=modelMatrix*vec4(position,1.);site=q.xyz;gl_Position=projectionMatrix*viewMatrix*q;}',fragmentShader:`
 varying vec3 site;uniform float time;
 void main(){vec2 p=site.xz; float f=p.x*.18+p.y*.12+.54*sin(p.y*.22+time*.09);
 float bands=pow(.5+.5*sin(f*2.2),9.);float haze=exp(-abs(length(p)-9.)*.065);
 vec3 color=vec3(.067,.053,.11)+haze*bands*mix(vec3(.012,.13,.13),vec3(.14,.057,.19),.5+.5*cos(p.y*.28));
 gl_FragColor=vec4(color,1.);}`});
 box(0,-3.6,0,160,.2,160,coldFloor);
 const grid=new T.GridHelper(110,60,0x685982,0x383047);grid.position.y=-3.48;world.add(grid);
 // Frosted perimeter racks fall away into the cold room beyond the illuminated board.
 const rand=i=>{const f=Math.sin(919*i+7)*4311;return f-Math.floor(f)};
 for(let i=0;i<76;i++){
   const a=rand(i)*Math.PI*2,r=13+rand(i+100)*34,x=Math.cos(a)*r,z=Math.sin(a)*r,h=1.4+rand(i+211)*4;
   box(x,-3.5+h/2,z,1.4,h,1.2,dark);box(x,h-3.45,z,1.48,.09,1.27,frame);
   if(i%3===0)box(x,h-3.65,z+.61,1.1,.04,.03,violet);
 }
 box(0,-.59,0,9.6,.85,9.6,dark);box(0,-.30,0,9.54,.06,9.54,violet);
 box(0,-.14,0,9.67,.22,9.67,shell);
 const traces=[],pads=[],tileMaterials=[];
 function traceLine(x1,z1,x2,z2){traces.push(x1,.102,z1,x2,.102,z2)}
 for(let x=0;x<6;x++)for(let z=0;z<6;z++){
   const coating=tile.clone();tileMaterials[x*6+z]=coating;
   box(pos(x),.025,pos(z),1.412,.13,1.412,coating);
   const a=pos(x),b=pos(z);
   for(let k=0;k<3;k++){const u=.07*k;
     traceLine(a-.67,b-.37+u,a-.49+u,b-.37+u);traceLine(a-.49+u,b-.37+u,a-.28+u,b-.16+u);
     traceLine(a-.28+u,b-.16+u,a+.03,b-.16+u);pads.push(a+.03,.105,b-.16+u);
     traceLine(a+.35+u,b+.69,a+.35+u,b+.40);traceLine(a+.35+u,b+.40,a+.52+u,b+.23);
   }
   for(const side of [-1,1])box(pos(x)+side*.55,.1,pos(z)+.55,.1,.018,.035,frame);
 }
 const wires=new T.BufferGeometry();wires.setAttribute('position',new T.Float32BufferAttribute(traces,3));world.add(new T.LineSegments(wires,new T.LineBasicMaterial({color:0x62587c})));
 const pins=new T.BufferGeometry();pins.setAttribute('position',new T.Float32BufferAttribute(pads,3));world.add(new T.Points(pins,new T.PointsMaterial({color:0xd2b8c8,size:.045})));
 for(let k=0;k<5;k++)for(const side of [-1,1]){
   box(side*4.83,-.44,-3.3+k*1.65,.035,.065,1.03,side>0?iceMat:violet);
   box(-3.3+k*1.65,.006,side*4.67,1.21,.022,.065,k%2?violet:iceMat);
 }
 for(let i=0;i<40;i++)for(let side of [-1,1])box(-4.32+i*.22,-.6,side*4.82,.07,.28,.11,frame);
 for(let i=0;i<4;i++){let x=i%2?4.55:-4.55,z=i<2?-4.55:4.55;cyl(x,-.02,z,.14,.14,brass,world)}
 const starGeom=new T.BufferGeometry(),flakes=new Float32Array(110*3);
 for(let i=0;i<110;i++){flakes[i*3]=(rand(i+420)-.5)*32;flakes[i*3+1]=rand(i+105)*12;flakes[i*3+2]=(rand(i+12)-.5)*32}
 starGeom.setAttribute('position',new T.BufferAttribute(flakes,3));const frost=new T.Points(starGeom,new T.PointsMaterial({color:0xc4e7ff,size:.035,transparent:true,opacity:.58}));world.add(frost);
 // Draw fixed rack housings, fins and fasteners in material batches on mobile GPUs.
 const batches=new Map();
 for(const part of world.children){
   if(!part.isMesh||(part.geometry!==boxGeo&&part.geometry!==cylGeo))continue;
   const key=part.geometry.id+':'+part.material.id;
   if(!batches.has(key))batches.set(key,[]);
   batches.get(key).push(part);
 }
 for(const parts of batches.values()){
   if(parts.length<3)continue;
   const batch=new T.InstancedMesh(parts[0].geometry,parts[0].material,parts.length);
   parts.forEach((part,i)=>{part.updateMatrix();batch.setMatrixAt(i,part.matrix);world.remove(part)});
   world.add(batch);
 }
 const gemGeo=new T.OctahedronGeometry(.38),ringGeo=new T.TorusGeometry(.45,.029,8,40);
 const labelCache=new Map();
 function tag(value,x,y,z){
   if(!labelCache.has(value)){const c=document.createElement('canvas');c.width=112;c.height=60;const p=c.getContext('2d');p.fillStyle='#20182c';p.fillRect(1,2,109,55);p.strokeStyle='#ac88e8';p.lineWidth=3;p.strokeRect(2,3,107,52);p.font='bold 38px monospace';p.textAlign='center';p.fillStyle='#f3eaff';p.fillText(value,56,42);labelCache.set(value,new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:false,transparent:true}))}
   const m=new T.Sprite(labelCache.get(value));m.scale.set(.59,.316,1);m.position.set(x,y,z);m.renderOrder=4;circuit.add(m);return m;
 }
 let won=false,changeTime=0,mirrors=[],targets=[],hits=[],angles=[],flow=[],dots=[];
 const targetDark=standard('#405161'),beamGeo=new T.CylinderGeometry(1,1,1,8),axis=new T.Vector3(0,1,0);
 const bloom=colors.map(color=>new T.MeshBasicMaterial({color,blending:T.AdditiveBlending,transparent:true,opacity:.11,depthWrite:false}));
 function load(level,orientation){
   circuit.clear();mirrors=[];targets=[];hits=[];angles=[];
   level.blocks.forEach(([x,z])=>{
     const a=pos(x),b=pos(z);box(a,.56,b,1.02,.92,.88,rack,circuit);box(a,1.06,b,1.08,.09,.94,frame,circuit);
     for(let k=0;k<4;k++){box(a,.29+k*.19,b+.453,.83,.10,.045,dark,circuit);box(a-.27,.30+k*.19,b+.483,.09,.035,.023,iceMat,circuit)}
     for(let k=0;k<5;k++)box(a-.35+.17*k,1.12,b,.07,.02,.62,dark,circuit);
   });
   level.sources.forEach(([x,z,d,c])=>{
     const base=group(pos(x),0,pos(z),circuit);base.rotation.y=-d*Math.PI/2;
     box(0,.30,0,1.03,.46,.78,shell,base);box(-.1,.56,0,.77,.08,.83,lights[c],base);
     for(let i=0;i<4;i++)box(-.4+i*.18,.68,0,.08,.22,.71,frame,base);
     const aperture=cyl(.49,.54,0,.23,.14,lights[c],base);aperture.rotation.z=Math.PI/2;halo(.51,.54,0,.9,c,base);
   });
   level.receivers.forEach(([x,z,c])=>{
     const a=pos(x),b=pos(z);cyl(a,.21,b,.53,.22,frame,circuit);cyl(a,.38,b,.42,.17,lights[c],circuit);
     const core=mesh(gemGeo,targetDark,a,.78,b,circuit);core.scale.y=1.28;
     const ring=mesh(ringGeo,lights[c],a,.56,b,circuit);ring.rotation.x=Math.PI/2;
     targets.push({core,c,glow:halo(a,.78,b,1.8,c,circuit)});
   });
   level.mirrors.forEach(([x,z,split],i)=>{
     const a=pos(x),b=pos(z),base=cyl(a,.23,b,.56,.25,dark,circuit);
     cyl(a,.365,b,.51,.04,violet,circuit);cyl(a,.4,b,.47,.05,frame,circuit);
     const g=group(a,.62,b,circuit);box(0,0,0,1.03,.39,.13,glass,g);box(0,.205,0,1.08,.045,.16,split?iceMat:violet,g);
     if(split)box(0,-.08,0,.12,.14,1.04,iceMat,g);
     mirrors.push(g);angles.push(orientation[i]?-Math.PI/4:Math.PI/4);g.rotation.y=angles[i];
     const label=tag(String(i+1).padStart(2,'0')+(split?'⑂':''),a,1.13,b);
     base.userData.index=g.userData.index=label.userData.index=i;hits.push(base,g,label);
   });
 }
 function signal(result,orient){
   won=result.solved;changeTime=performance.now()/1000;tileMaterials.forEach(m=>m.emissive.setHex(0));
   angles=orient.map(n=>n?-Math.PI/4:Math.PI/4);signals.clear();flow=result.segments;dots=[];
   targets.forEach(({core,c,glow},i)=>{const on=result.lit.has(i);core.material=on?lights[c]:targetDark;glow.visible=on});
   for(const [x,z,nx,nz,c] of flow){
     tileMaterials[x*6+z].emissive.setHex(c?0x39152b:0x113d3a);
     const a=new T.Vector3(pos(x),.57,pos(z)),b=new T.Vector3(pos(nx),.57,pos(nz)),dir=b.clone().sub(a),len=dir.length(),mid=a.clone().lerp(b,.5);
     for(const [r,m] of [[.035,lights[c]],[.112,bloom[c]]]){const line=mesh(beamGeo,m,mid.x,mid.y,mid.z,signals);line.scale.set(r,len,r);line.quaternion.setFromUnitVectors(axis,dir.clone().normalize())}
     const dot=halo(0,.57,0,.47,c,signals);dots.push({dot,a,b});
   }
 }
 let angle=.62,targetAngle=angle,pointer=null,dragged=false,down=0,baseAngle=0;
 const ray=new T.Raycaster();
 canvas.onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;canvas.setPointerCapture(pointer);down=e.clientX;baseAngle=targetAngle;dragged=false};
 canvas.onpointermove=e=>{if(e.pointerId!==pointer)return;const dx=e.clientX-down;if(Math.abs(dx)>5)dragged=true;if(dragged)targetAngle=baseAngle-dx*.009};
 canvas.onpointerup=e=>{if(pointer!==e.pointerId)return;pointer=null;if(dragged)return;const r=canvas.getBoundingClientRect();ray.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:1-(e.clientY-r.top)/r.height*2},camera);
   const hit=ray.intersectObjects(hits,true)[0];if(hit){let node=hit.object;while(node&&node.userData.index===undefined)node=node.parent;if(node)onRotate(node.userData.index)}};
 canvas.onlostpointercapture=()=>pointer=null;
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const ratio=w/h,span=Math.max(5.3,7.1/ratio);
   camera.left=-span*ratio;camera.right=span*ratio;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
 new ResizeObserver(resize).observe(canvas);resize();
 function animate(t){requestAnimationFrame(animate);if(canvas.hidden||document.hidden)return;const time=t/1000;
   coldFloor.uniforms.time.value=time;
   const age=Math.max(0,time-changeTime);
   if(age<2.3){for(let i=0;i<36;i++){const radius=Math.hypot(Math.floor(i/6)-2.5,i%6-2.5);tileMaterials[i].emissiveIntensity=1+(won?2.4:.6)*Math.exp(-Math.pow(age*5-radius,2))}}
   angle+=(targetAngle-angle)*.12;camera.position.set(Math.sin(angle)*13,11.7,Math.cos(angle)*13);camera.lookAt(0,.1,0);
   mirrors.forEach((g,i)=>g.rotation.y+=(angles[i]-g.rotation.y)*.23);
   targets.forEach(({core},i)=>{core.rotation.y=time*.7;core.position.y=.8+Math.sin(time*2+i)*.04});
   dots.forEach(({dot,a,b})=>dot.position.lerpVectors(a,b,(time*1.5)%1));
   frost.position.y=1-time*.18%3;renderer.render(scene,camera)}
 requestAnimationFrame(animate);return {load,signal};
}
