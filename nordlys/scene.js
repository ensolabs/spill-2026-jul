/* Nordlys Dispatch • a procedural Norwegian winter fjord. All coordinates are metres. */
(() => {
  'use strict';
  window.createFjord = function createFjord(canvas) {
    const T = window.THREE;
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    const scene = new T.Scene();
    scene.background = new T.Color(0x253b55);
    scene.fog = new T.FogExp2(0x465f75, .00215);
    const camera = new T.PerspectiveCamera(55, 1, .15, 1450);
    let seed = 197421;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const vector = (x, y, z) => new T.Vector3(x, y, z);
    const material = (color, params={}) => new T.MeshStandardMaterial({ color, roughness: .78, ...params });
    const unlit = (color, params={}) => new T.MeshBasicMaterial({color, ...params});
    const mesh = (geom, mat, x, y, z, parent=scene) => {
      const m = new T.Mesh(geom,mat);
      m.position.set(x,y,z); parent.add(m); return m;
    };
    const boxGeo = new T.BoxGeometry(1,1,1);
    function box(w,h,d,mat,x,y,z,parent) {
      const m=mesh(boxGeo,mat,x,y,z,parent); m.scale.set(w,h,d); return m;
    }
    function cylinder(r1,r2,h,mat,x,y,z,parent,sides=10) {
      return mesh(new T.CylinderGeometry(r1,r2,h,sides),mat,x,y,z,parent);
    }
    function between(a,b,r,mat,parent,rEnd=r){
      const v=b.clone().sub(a), p=a.clone().add(b).multiplyScalar(.5);
      const m=cylinder(rEnd,r,v.length(),mat,p.x,p.y,p.z,parent);
      m.quaternion.setFromUnitVectors(vector(0,1,0),v.normalize());return m;
    }
    const softGlow = document.createElement('canvas');softGlow.width=softGlow.height=64;
    const g=softGlow.getContext('2d'),rad=g.createRadialGradient(32,32,0,32,32,32);
    rad.addColorStop(0,'rgba(255,255,255,1)');rad.addColorStop(.13,'rgba(255,255,255,.85)');
    rad.addColorStop(.35,'rgba(255,255,255,.24)');rad.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=rad;g.fillRect(0,0,64,64);
    const glowTex=new T.CanvasTexture(softGlow);
    function glow(color,scale,x,y,z,parent=scene){
      const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
      s.position.set(x,y,z);s.scale.setScalar(scale);parent.add(s);return s;
    }
    scene.add(new T.HemisphereLight(0xd6e6ff,0x6d8a9f,2.1));
    const moonlight=new T.DirectionalLight(0xffece3,2.35);moonlight.position.set(-110,140,-190);scene.add(moonlight);
    const rim=new T.DirectionalLight(0x68ccc9,.95);rim.position.set(70,30,40);scene.add(rim);

    // The curtains are drawn in angular coordinates, so the aurora and stars remain at infinity.
    const sky=mesh(new T.SphereGeometry(1010,48,26),new T.ShaderMaterial({
      side:T.BackSide,depthWrite:false,uniforms:{clock:{value:0}},
      vertexShader:'varying vec3 ray; void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`
        varying vec3 ray; uniform float clock;
        float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
        void main(){
          vec3 d=normalize(ray); float h=d.y;float a=atan(d.x,-d.z);
          vec3 col=mix(vec3(.52,.53,.6),vec3(.115,.23,.33),smoothstep(-.05,.22,h));
          col=mix(col,vec3(.025,.06,.135),smoothstep(.12,.68,h));
          float sunset=exp(-abs(a+.68)*2.5)*exp(-abs(h-.035)*11.);
          col+=vec3(.25,.11,.065)*sunset;
          vec2 star=vec2(a*170.,asin(d.y)*170.);vec2 cell=floor(star);
          float starLight=smoothstep(.115,.0,length(fract(star)-.5)) * step(.76,hash(cell));
          col+=vec3(.65,.85,.94)*starLight*smoothstep(.06,.25,h);
          for(int i=0;i<3;i++){
            float j=float(i),t=clock*.028;
            float bend=.19+.075*sin(a*2.2+t+j*.2)+.055*sin(a*5.2-t*.4+j*.46)+j*.037;
            float above=h-bend;
            float light=smoothstep(-.012,.018,above)*exp(-max(above,0.)*(13.-j))*smoothstep(.24,.03,above);
            float beam=.52+.3*sin(a*82.+sin(a*8.)*6.+t)+.18*sin(a*194.+t);
            float arc=.6+.4*cos(a*2.1+j);
            col+=mix(vec3(.044,.87,.55),vec3(.13,.27,.52),j*.36)*light*arc*(.54+.55*beam);
          }
          vec3 moon=normalize(vec3(-.47,.275,-1.));float md=distance(d,moon);
          col+=vec3(.72,.76,.64)*smoothstep(.0165,.0155,md)+vec3(.12,.16,.18)*exp(-md*29.);
          gl_FragColor=vec4(col,1.);
        }`
    }),0,0,0);
    sky.renderOrder=-10;

    // Polygonal granite ridges rise from an irregular shore, with exposed steep faces and snowfields.
    function shore(z,side){
      return 83+15*Math.sin(z*.016+side*2.9)+14*Math.cos(z*.031-side)+9*Math.sin(z*.009+side);
    }
    const terrainVerts=[],terrainColors=[];
    function tri(a,b,c,tint){
      const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      const up=Math.abs(normal.y),alt=(a.y+b.y+c.y)/3;
      const snowy=up>.48+.09*Math.sin((a.z+c.x)*.1)-alt*.0009;
      const color=new T.Color(snowy?(alt>95?0xd2e2e7:0xb9ccd9):(up>.3?0x677b8b:0x4e6376));
      color.multiplyScalar(tint*(.93+random()*.12));
      for(const p of [a,b,c]){terrainVerts.push(p.x,p.y,p.z);terrainColors.push(color.r,color.g,color.b)}
    }
    for(const side of [-1,1]){
      const grid=[];
      for(let i=0;i<=89;i++){
        const z=-790+i*12;
        const ridge=42+23*Math.sin(z*.022+side)+20*Math.sin(z*.043+side*.7)+35*Math.abs(Math.sin(z*.011));
        const row=[];
        for(let j=0;j<12;j++){
          const dist=[-4,0,9,21,37,58,84,105,139,168,204,250][j];
          const factor=[0,0,.09,.16,.31,.52,.8,1,.84,.76,1.04,1.17][j];
          row.push(vector(side*(shore(z,side)+dist+(j>1?random()*8:0)),j===0?-4:factor*ridge+(j>1?(random()-.5)*8:0),z+(j>1?random()*8:0)));
        }
        grid.push(row);
      }
      for(let i=0;i<grid.length-1;i++)for(let j=0;j<11;j++){
        const a=grid[i][j],b=grid[i+1][j],c=grid[i][j+1],d=grid[i+1][j+1];
        // Upward winding for both halves of the valley.
        if(side>0){tri(a,b,c,1);tri(b,d,c,1)}else{tri(a,c,b,1);tri(b,c,d,1)}
      }
    }
    // The distant end of the fjord closes the valley with a serrated glacier.
    const peaks=[];
    for(let i=-16;i<=16;i++){
      const x=i*18,crest=32+18*Math.cos(i*.64)+13*Math.sin(i*1.33)+random()*11;
      peaks.push([vector(x,-2,-347+random()*6),vector(x+random()*8,crest*.42,-363-random()*7),vector(x+random()*7,crest,-394-random()*12)]);
    }
    for(let i=1;i<peaks.length;i++)for(let j=1;j<=2;j++){
      const [a,b,c,d]=[peaks[i-1][j-1],peaks[i][j-1],peaks[i-1][j],peaks[i][j]];
      tri(a,b,c,.91);tri(b,d,c,.98);
    }
    const terrainGeometry=new T.BufferGeometry();
    terrainGeometry.setAttribute('position',new T.Float32BufferAttribute(terrainVerts,3));
    terrainGeometry.setAttribute('color',new T.Float32BufferAttribute(terrainColors,3));terrainGeometry.computeVertexNormals();
    mesh(terrainGeometry,material(0xffffff,{vertexColors:true,flatShading:true,side:T.DoubleSide}),0,0,0);
    const pineGeo=new T.ConeGeometry(1,1,6),treeMat=material(0x193f45),snowMat=material(0xc5d5dc);
    const trunks=new T.InstancedMesh(pineGeo,treeMat,1800),caps=new T.InstancedMesh(pineGeo,snowMat,1800),dummy=new T.Object3D();
    for(let i=0;i<900;i++){
      const side=random()<.5?-1:1,z=-353+random()*530,dist=2+random()*15;
      const y=.34*dist, x=side*(shore(z,side)+dist),h=2.5+random()*6;
      for(let j=0;j<2;j++){
        const ht=h*(j?.68:.82),width=h*(j?.16:.21),py=y+h*(j?.68:.43);
        dummy.position.set(x,py,z);dummy.scale.set(width,ht,width);dummy.updateMatrix();trunks.setMatrixAt(i*2+j,dummy.matrix);
        dummy.position.y+=ht*.18;dummy.scale.set(width*.67,ht*.66,width*.67);dummy.updateMatrix();caps.setMatrixAt(i*2+j,dummy.matrix);
      }
    }
    scene.add(trunks,caps);

    const waterUniforms={time:{value:0},lamp:{value:vector(0,0,0)},enabled:{value:1}};
    const water=mesh(new T.PlaneGeometry(1350,1350),new T.ShaderMaterial({
      uniforms:waterUniforms,vertexShader:'varying vec3 p;void main(){p=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',
      fragmentShader:`
      varying vec3 p; uniform float time;uniform vec3 lamp;uniform float enabled;
      void main(){
        vec2 uv=p.xz;float w=sin(uv.y*1.17+2.*sin(uv.x*.24+uv.y*.09)+time*.6)*.5+.5;
        float w2=sin(uv.y*2.38+uv.x*.21+1.7*sin(uv.x*.6-uv.y*.12)-time*.76)*.5+.5;
        vec3 col=mix(vec3(.052,.125,.19),vec3(.085,.235,.30),w*.18+w2*.18);
        float shimmer=pow(w*w2,6.)*(.45+.55*pow(sin(uv.x*.71+uv.y*.4)*.5+.5,2.));
        col+=vec3(.16,.38,.34)*shimmer*(.5+.5*sin(uv.x*.043+uv.y*.009));
        float warm=exp(-abs(uv.x-6.)*.16)*exp(-abs(uv.y+75.)*.03);
        col+=vec3(.69,.37,.08)*shimmer*warm;
        float beam=exp(-pow(length(uv-lamp.xz)/max(2.,lamp.y*.32),2.)*2.);
        col+=vec3(.38,.44,.4)*beam*enabled*(.55+.3*w);
        float haze=1.-exp(-.0023*distance(cameraPosition,p));
        gl_FragColor=vec4(mix(col,vec3(.39,.50,.57),haze*haze),1.);
      }`
    }),0,-.04,-120);water.rotation.x=-Math.PI/2;
    const timber=material(0x8a6652),pile=material(0x454a50),white=material(0xdde8e8),red=material(0xb63c38);
    const dark=material(0x263741),rail=material(0x72919b),amber=unlit(0xffd082),lampWhite=unlit(0xe6fff1);
    const {base:shoreBase,ship:vessel}=Flight.sites;
    const station=new T.Group();station.position.set(shoreBase.x,0,shoreBase.z);scene.add(station);
    // A low snowy headland overlaps the fjord bank and carries the pad and buildings.
    const coast=new T.Shape();
    const outline=[[-13,-6],[-10,-16],[4,-23],[28,-28],[62,-35],[84,-34],[84,30],[51,25],[27,17],[5,14],[-8,9]];
    outline.forEach(([x,z],i)=>i?coast.lineTo(x,-z):coast.moveTo(x,-z));coast.closePath();
    const land=mesh(new T.ExtrudeGeometry(coast,{depth:4.85,bevelEnabled:false}),[white,material(0x626868)],0,-3,0,station);
    land.rotation.x=-Math.PI/2;
    const patch=material(0x798e95);box(7,.045,7,patch,0,2.06,0,station);
    function landingMark(x,z,size,y,parent){
      const m=unlit(0xffdf94);
      const ring=mesh(new T.RingGeometry(size-.12,size,48),m,x,y,z,parent);ring.rotation.x=-Math.PI/2;
      for(const dx of [-.65,.65])box(.24,.04,2.1,m,x+dx,y+.016,z,parent);
      box(1.3,.04,.25,m,x,y+.016,z,parent);
    }
    landingMark(0,0,3.1,2.1,station);
    for(const z of [-7,7])for(const x of [-5.7,5.7]){
      cylinder(.12,.18,.85,dark,x,2.47,z,station);glow(0xffbc63,2.2,x,2.95,z,station);box(.24,.2,.24,amber,x,2.96,z,station);
    }
    function cabin(x,z,w,d,h,parent){
      box(w,h,d,red,x,2+h/2,z,parent);
      for(const dx of [-1,1]){
        const panel=box(w*.59,.29,d+.9,white,x+dx*w*.24,2+h+w*.14,z,parent);panel.rotation.z=-dx*.49;
        for(const dz of [-1,1])box(.17,h+.06,.2,white,x+dx*(w*.5-.05),2+h*.5,z+dz*(d*.5-.05),parent);
      }
      const triangle=new T.Shape();triangle.moveTo(-w/2,0);triangle.lineTo(0,w*.27);triangle.lineTo(w/2,0);triangle.closePath();
      mesh(new T.ExtrudeGeometry(triangle,{depth:d,bevelEnabled:false}),red,x,2+h,z-d*.5,parent);
      for(const dx of [-.29,.27]){
        const wx=x+dx*w,wz=z+d*.5+.05;
        box(1.65,1.4,.1,white,wx,4.1,wz,parent);box(1.45,1.21,.12,amber,wx,4.1,wz+.025,parent);
        box(.09,1.28,.16,dark,wx,4.1,wz+.04,parent);glow(0xffb34d,4,wx,4.1,wz+.22,parent);
      }
      for(let j=-1;j<=1;j++){
        box(.1,1.3,1.5,amber,x-w/2-.05,4.05,z+j*d*.28,parent);
      }
      box(.95,2.5,.2,dark,x,3.25,z+d/2+.08,parent);
      box(.55,1.9,.58,dark,x+w*.28,2+h+w*.31,z-d*.2,parent);
    }
    cabin(28,-6,7.5,9,4.8,station);cabin(39,-12,5,6,3.1,station);
    const mast=vector(34,2,-17);
    for(const d of [[-1,0],[.5,.9],[.5,-.9]])between(vector(mast.x+d[0]*1.6,2,mast.z+d[1]*1.6),vector(34,18,-17),.095,rail,station);
    for(let i=0;i<5;i++)between(vector(33.4,5+i*2.2,-17),vector(34.7,7+i*2.2,-17.5),.05,rail,station);
    box(4,.1,.12,rail,34,15,-17,station);const beacon=glow(0xff5f44,3,34,18,-17,station);
    function person(){
      const p=new T.Group();const coat=material(0xff7a30),pants=material(0x253641);
      box(.58,.72,.35,coat,0,1.04,0,p);
      box(.59,.13,.37,white,0,1.13,0,p);
      for(const s of [-1,1]){box(.2,.61,.23,pants,s*.17,.39,0,p);box(.22,.16,.33,dark,s*.17,.08,.04,p)}
      mesh(new T.SphereGeometry(.19,10,7),material(0xb58a72),0,1.6,0,p);cylinder(.2,.21,.19,coat,0,1.73,0,p);
      between(vector(-.33,1.34,0),vector(-.48,.92,.03),.1,coat,p);
      between(vector(.28,1.27,0),vector(.53,1.7,.02),.1,coat,p);
      return p;
    }
    const survivor=person();scene.add(survivor);

    const ship=new T.Group();ship.position.set(vessel.x,0,vessel.z);scene.add(ship);
    const flare=glow(0xff6622,8,3.8,2.8,3,ship);
    const cast=new T.PointLight(0xff741e,12,19,1.6);cast.position.set(3.8,4,3);ship.add(cast);

    box(14,2.4,28,material(0x333e48),0,.48,0,ship);box(14.2,.38,27.7,white,0,1.76,0,ship);
    box(11.5,.08,13,material(0x688b89),0,1.997,0,ship);landingMark(0,0,4.6,2.05,ship);
    box(9,2.9,4.5,rail,0,3.3,10.6,ship);box(9.5,.26,4.9,white,0,4.92,10.6,ship);
    for(let k=-2;k<=2;k++)box(1.38,.95,.1,amber,k*1.57,4.1,8.29,ship);
    for(const x of [-6.6,6.6])for(const z of [-12,0,12])glow(0x83fff1,2.1,x,2.4,z,ship);

    // The rescue aircraft is assembled from lofted hull sections rather than a scaled sphere.
    const helicopter=new T.Group();scene.add(helicopter);
    const airframe=new T.Group();helicopter.add(airframe);
    const orange=material(0xec5e2c),cream=material(0xe5e8dc),metal=material(0x4e5b63,{metalness:.53,roughness:.38});
    const black=material(0x25303a),glass=material(0x214352,{metalness:.53,roughness:.2}),yellow=material(0xffbd44);
    function hull(sections,mat,parent){
      const positions=[],indices=[],n=12;
      for(const [z,rx,ry,cy] of sections)for(let i=0;i<n;i++){const angle=(i+.5)*2*Math.PI/n;positions.push(Math.cos(angle)*rx,cy+Math.sin(angle)*ry,z)}
      for(let j=1;j<sections.length;j++)for(let i=0;i<n;i++){
        const a=(j-1)*n+i,b=(j-1)*n+(i+1)%n,c=a+n,d=b+n;indices.push(a,b,c,b,d,c);
      }
      const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(positions,3));geom.setIndex(indices);geom.computeVertexNormals();
      return mesh(geom,mat,0,0,0,parent);
    }
    hull([[-3.62,.08,.1,-.15],[-3.32,.76,.62,-.12],[-2.28,1.17,1.06,-.04],[-1.32,1.26,1.17,.02],[1.35,1.26,1.14,.04],[2.48,.86,.85,.16],[3.27,.37,.43,.3]],cream,airframe);
    hull([[-3.19,.76,.05,-.6],[-2.2,1.17,.33,-.75],[-1.1,1.24,.4,-.77],[1.35,1.23,.38,-.73],[2.4,.8,.22,-.48]],orange,airframe);
    hull([[-3.49,.42,.38,.02],[-3.03,.96,.68,.15],[-2.28,1.16,.85,.19],[-1.8,1.22,.84,.19]],glass,airframe);
    function plaque(w,h,text,bg,fg){
      const c=document.createElement('canvas');c.width=512;c.height=128;
      const p=c.getContext('2d');p.fillStyle=bg;p.fillRect(0,0,512,128);p.fillStyle=fg;p.font='bold 83px Arial';p.textAlign='center';p.textBaseline='middle';p.fillText(text,256,70);
      return mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),side:T.DoubleSide}),0,0,0,airframe);
    }
    for(const s of [-1,1]){
      for(const z of [-1.56,-.58,.48]){
        box(.08,.8,.84,black,s*1.21,.34,z,airframe);box(.13,.66,.72,glass,s*1.23,.36,z,airframe);
      }
      box(.1,.12,3.4,orange,s*1.225,-.25,-.3,airframe);
      box(.09,.78,.17,orange,s*1.19,.38,1.08,airframe);
      for(const z of [-1.6,1.1])between(vector(s*.84,-.68,z),vector(s*1.45,-1.62,z+.05),.085,metal,airframe);
      between(vector(s*1.45,-1.62,-2.05),vector(s*1.45,-1.62,1.91),.105,black,airframe);
      between(vector(s*1.45,-1.62,-2.05),vector(s*1.44,-1.38,-2.36),.1,black,airframe);
      const badge=plaque(1.13,.34,'RESCUE','#ececdf','#303e42');badge.position.set(s*1.25,-.46,.25);badge.rotation.y=s*Math.PI/2;
      const pod=mesh(new T.SphereGeometry(1,12,8),orange,s*.52,1.01,.49,airframe);pod.scale.set(.48,.47,1.25);
      const vent=cylinder(.26,.28,.58,metal,s*.56,1.22,1.39,airframe);vent.rotation.x=Math.PI/2.55;
      const exhaust=cylinder(.19,.19,.02,black,s*.56,1.31,1.68,airframe);exhaust.rotation.x=Math.PI/2.55;
    }
    hull([[2.4,.74,.59,.36],[4,.39,.38,.7],[6.1,.24,.25,1.03],[7.95,.15,.19,1.3]],orange,airframe);
    hull([[4.5,.36,.34,.78],[4.88,.342,.318,.84]],cream,airframe);
    hull([[5.06,.33,.312,.87],[5.4,.307,.293,.92]],cream,airframe);
    const tailShape=new T.Shape();tailShape.moveTo(0,0);tailShape.lineTo(1.85,.2);tailShape.lineTo(2.45,2.26);tailShape.lineTo(1.67,2.18);tailShape.closePath();
    const fin=mesh(new T.ExtrudeGeometry(tailShape,{depth:.16,bevelEnabled:false}),orange,.08,1.18,6.05,airframe);fin.rotation.y=-Math.PI/2;
    box(2.85,.095,.68,cream,0,1.25,6.52,airframe);
    cylinder(.18,.22,.85,metal,0,1.57,-.1,airframe);
    const blades=new T.Group();blades.position.set(0,2.02,-.1);airframe.add(blades);
    for(let i=0;i<4;i++){
      const arm=new T.Group();arm.rotation.y=i*Math.PI/2;blades.add(arm);
      box(.21,.05,5.55,black,0,0,2.86,arm);box(.22,.055,.42,yellow,0,0,5.52,arm);
    }
    const diskMat=unlit(0xa7cbd1,{transparent:true,opacity:.09,side:T.DoubleSide,depthWrite:false});
    const disk=mesh(new T.RingGeometry(3.1,5.78,72),diskMat,0,2.02,-.1,airframe);disk.rotation.x=-Math.PI/2;
    const tailRotor=new T.Group();tailRotor.position.set(.28,2.72,7.95);airframe.add(tailRotor);
    for(let i=0;i<3;i++){
      const arm=new T.Group();arm.rotation.x=i*Math.PI*2/3;tailRotor.add(arm);
      box(.06,.91,.12,cream,0,.47,0,arm);box(.075,.23,.14,red,0,.83,0,arm);
    }
    glow(0xff342b,1.5,-1.48,.12,.8,airframe);glow(0x4dffbf,1.5,1.48,.12,.8,airframe);
    const anti=glow(0xff482a,1.6,0,3.27,8.23,airframe);
    const search=new T.SpotLight(0xfff4d2,75,100,.29,.47,1);scene.add(search,search.target);
    const coneRadius=6,coneLength=22;
    const beamMaterial=new T.ShaderMaterial({
      side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{intensity:{value:1}},
      vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 v;uniform float intensity;void main(){float alpha=.076*pow(v.y,1.5)*intensity;gl_FragColor=vec4(.83,.92,.89,alpha);}'
    });
    const beam=mesh(new T.ConeGeometry(coneRadius,coneLength,42,1,true),beamMaterial,0,0,0);
    const cablePositions=new Float32Array(6);
    const cableGeo=new T.BufferGeometry();cableGeo.setAttribute('position',new T.BufferAttribute(cablePositions,3));
    const cable=new T.Line(cableGeo,new T.LineBasicMaterial({color:0xf7e6bc}));cable.frustumCulled=false;scene.add(cable);
    const hookMesh=mesh(new T.TorusGeometry(.17,.058,7,13,Math.PI*1.7),yellow,0,0,0);
    const snowCount=220,snowCoords=new Float32Array(snowCount*3),snowSeeds=Array.from({length:snowCount},()=>[random(),random(),random()]);
    const snowGeo=new T.BufferGeometry();snowGeo.setAttribute('position',new T.BufferAttribute(snowCoords,3));
    const flakes=new T.Points(snowGeo,new T.PointsMaterial({color:0xe8f3f8,size:.068,transparent:true,opacity:.66,depthWrite:false}));
    flakes.frustumCulled=false;scene.add(flakes);
    const powder = Array.from({length:20},(_,i)=>{
      const cloud=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0xc7e5ef,transparent:true,depthWrite:false}));
      scene.add(cloud);
      return {cloud,phase:random(),azimuth:i*Math.PI*2/20};
    });
    let camSet=false,lastTime=0;
    const cameraGoal=new T.Vector3(),focus=new T.Vector3(),aim=new T.Vector3(),source=new T.Vector3(),direction=new T.Vector3();
    const up=vector(0,1,0);
    let viewHeading=0;
    function resize(){
      const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
      camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
    }
    resize();
    function draw(s,t){
      const dt=clamp(t-lastTime,0,.09);lastTime=t;
      const near=clamp(1-s.distance/37,0,1);
      const portrait=camera.aspect<1.25?1:0;
      helicopter.position.set(s.x,s.y,s.z);
      helicopter.rotation.y=-s.heading;
      const lateral=s.vx*Math.cos(s.heading)+s.vz*Math.sin(s.heading);
      const aft=-s.vx*Math.sin(s.heading)+s.vz*Math.cos(s.heading);
      airframe.rotation.set(clamp(-aft*.014,-.15,.15),0,clamp(-lateral*.035,-.3,.3));
      airframe.position.y=.04*Math.sin(t*8.1);blades.rotation.y=t*38;tailRotor.rotation.x=t*54;
      anti.material.opacity=.3+.7*Math.pow(Math.max(0,Math.sin(t*5.8)),9);beacon.material.opacity=.35+.65*Math.max(0,Math.sin(t*3.3));
      flare.scale.setScalar(7+.95*Math.sin(t*9)+.45*Math.sin(t*15));flare.visible=!s.attached&&s.phase!=='complete';
      const hk=s.hook || {x:s.x,y:s.y-2,z:s.z};
      cablePositions.set([s.x,s.y-.7,s.z,hk.x,hk.y,hk.z]);cableGeo.attributes.position.needsUpdate=true;
      hookMesh.position.set(hk.x,hk.y,hk.z);
      const waitingAt=s.phase==='complete'?shoreBase:vessel;
      survivor.position.set(s.attached?hk.x:waitingAt.x,s.attached?hk.y-1.23:waitingAt.y+.1,s.attached?hk.z:waitingAt.z);
      source.set(.69,-.81,-1.76).applyAxisAngle(up,-s.heading).add(helicopter.position);
      direction.set(0,-1,-.28).normalize().applyAxisAngle(up,-s.heading);const beamLen=Math.max(.3,Math.min(28,(source.y+.06)/-direction.y));
      beam.position.copy(source).addScaledVector(direction,beamLen/2);
      beam.quaternion.setFromUnitVectors(vector(0,-1,0),direction);beam.scale.setScalar(beamLen/coneLength);
      beam.visible=!!s.light;search.visible=!!s.light;search.position.copy(source);search.target.position.copy(source).addScaledVector(direction,30);
      const pool=waterUniforms.lamp.value.copy(source).addScaledVector(direction,-source.y/direction.y);pool.y=source.y;waterUniforms.enabled.value=s.light?1:0;waterUniforms.time.value=t;sky.material.uniforms.clock.value=t;
      // Keep the horizon visible en route, then lift the chase camera to frame both hook and deck.
      const delta=(s.followCamera?s.heading:0)-viewHeading;
      viewHeading+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-6*dt));
      cameraGoal.set(s.followCamera?7.9+near*2:0,4.5+near*7.5,15.5+portrait*4.8+near*4)
        .applyAxisAngle(up,-viewHeading).add(helicopter.position);
      aim.set(s.followCamera?-.8:0,2.4-near*(5.2+s.y*.24),-8.5)
        .applyAxisAngle(up,-viewHeading).add(helicopter.position);
      if(s.standby)aim.x-=Math.min(11,camera.aspect*4.5);
      if(!camSet||camera.position.distanceTo(cameraGoal)>70){camera.position.copy(cameraGoal);focus.copy(aim);camSet=true}
      else{const smooth=1-Math.exp(-dt*4.7);camera.position.lerp(cameraGoal,smooth);focus.lerp(aim,smooth)}
      camera.lookAt(focus);sky.position.copy(camera.position);
      const wash=clamp(1-(s.y-3)/14,0,1)*near;
      for(const {cloud,phase,azimuth} of powder){
        cloud.visible=wash>.08;
        if(!cloud.visible)continue;
        const age=(phase+t*.59)%1,theta=azimuth+age*.6,radius=1+10*age;
        cloud.position.set(s.x+Math.cos(theta)*radius,2.3+wash*Math.sin(age*Math.PI)*2.8,s.z+Math.sin(theta)*radius);
        cloud.scale.set(2.5+age*8,1.6+age*4,1);
        cloud.material.opacity=wash*Math.sin(age*Math.PI)*(s.light?.6:.24);
      }
      for(let i=0;i<snowCount;i++){
        const [a,b,c]=snowSeeds[i],k=i*3;
        if(i<80&&wash>.1){
          const age=(b+t*.67)%1,theta=a*6.283+age*.8,dist=1.5+age*age*11;
          snowCoords[k]=s.x+Math.cos(theta)*dist;snowCoords[k+1]=2.3+Math.sin(age*3.14)*wash*(1+c*5);snowCoords[k+2]=s.z+Math.sin(theta)*dist;
        }else{
          snowCoords[k]=s.x+((a*45+t*.6)%45)-22.5;snowCoords[k+1]=s.y+((b*22-t*(.6+c*.45))%22+22)%22-11;snowCoords[k+2]=s.z+c*40-25;
        }
      }
      snowGeo.attributes.position.needsUpdate=true;renderer.render(scene,camera);
    }
    return {draw,resize};
  };
})();
