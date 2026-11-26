'use strict';
const Kitchen=(()=>{
 const foods=[
   {id:'lotus',name:'Lotus root',x:-4,z:-1.15,rx:.66,rz:.66},
   {id:'ribbe',name:'Ribbe · pork belly',x:-1.95,z:-1.12,rx:.96,rz:.49},
   {id:'tofu',name:'Silken tofu',x:-3.95,z:1.12,rx:.54,rz:.54},
   {id:'egg',name:'Quail egg',x:-1.85,z:1.17,rx:.48,rz:.37}
 ];
 const orders=[
   {name:'December special',items:['ribbe','lotus']},
   {name:'Snowfall shoyu',items:['tofu','egg']},
   {name:'The last bowl',items:['ribbe','egg','lotus','tofu']}
 ];
 // Stiffness, damping and maximum grip stretch vary with the food's texture.
 const texture={lotus:[230,19,.72],ribbe:[165,15,.82],tofu:[145,12,.76],egg:[205,16,.64]};
 const bowl={x:2.85,z:0,r:2.12};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 class Service{
   constructor(){this.order=0;this.firm=false;this.angle=0;this.x=-4;this.z=-1.15;this.load()}
   load(){this.items=foods.map(f=>({...f,angle:f.id==='ribbe'?-.13:0,y:0,vx:0,vz:0,vy:0,tilt:0,pitch:0,squash:0,bounce:0,falling:false,placed:false}));this.held=null;this.candidate=null;this.down=false;this.squeeze=0;this.open=1.18;this.gap=this.open;this.served=0;this.ripple=0;this.message='Start with any topping on the ticket.'}
   aim(x,z){this.x=clamp(x,-5.5,5.35);this.z=clamp(z,-2.55,2.55)}
   begin(){
     if(this.down||this.complete)return;this.down=true;this.squeeze=0;
     this.candidate=this.items.find(f=>!f.placed&&!f.falling&&Math.hypot((f.x-this.x)/f.rx,(f.z-this.z)/f.rz)<1.1);
     if(!this.candidate){this.message='Place the tips on a topping, then hold.';return}
     if(!orders[this.order].items.includes(this.candidate.id)){this.candidate=null;this.message='That topping is for another ticket.';return}
     this.message='Closing the tips…';
   }
   tick(dt){
     this.ripple=Math.max(0,this.ripple-dt);
     if(this.down&&!this.held){
       this.squeeze+=dt;this.gap=Math.max(.08,this.open-this.squeeze*2.55);
       const f=this.candidate;
       if(f){
         const off=Math.hypot((this.x-f.x)/f.rx,(this.z-f.z)/f.rz);
         if(off>1.15){this.candidate=null;this.message='The topping slipped past a tip. Try its centre.'}
         else{
           // Project both tips into the topping's own axes and test each contact independently.
           const touches=side=>{
             const dx=this.x+Math.cos(this.angle)*this.gap*side-f.x,dz=this.z+Math.sin(this.angle)*this.gap*side-f.z;
             const u=(dx*Math.cos(f.angle)+dz*Math.sin(f.angle))/f.rx,v=(-dx*Math.sin(f.angle)+dz*Math.cos(f.angle))/f.rz;
             if(f.id==='lotus')return Math.hypot(u,v)<=1&&Math.hypot(u,v)>.21;
             return f.id==='egg'?Math.hypot(u,v)<=1:Math.max(Math.abs(u),Math.abs(v))<=1;
           };
           if(touches(1)&&touches(-1)){
             if(f.id==='tofu'&&this.firm){this.message='The tofu buckled. Release and use a light grip.';this.candidate=null}
             else if((f.id==='ribbe'||f.id==='egg')&&!this.firm){this.message=f.id==='ribbe'?'The ribbe is slipping. Release and try a firm grip.':'The egg rolls free. Try a firm grip across its middle.';this.candidate=null;if(f.id==='egg'){f.angle+=.5;f.x=clamp(f.x+.13,-2.25,-1.5)}}
             else if(f.id==='egg'&&off>.53){this.candidate=null;f.angle+=.7;this.message='The egg twisted out. Grip closer to its middle.'}
             else{this.held=f;this.candidate=null;this.strain=0;f.bounce=f.id==='tofu'?1.8:1;this.dx=f.x-this.x;this.dz=f.z-this.z;this.twist=clamp((this.dx+.12*(f.id==='ribbe'))*.85,-.5,.5);this.liftAngle=f.angle;this.message='Lifted. Carry it over the broth and release.'}
           }else if(this.gap<=.08){this.candidate=null;this.message='Only one tip found purchase. Release and reposition.'}
         }
       }
     }else if(!this.down)this.gap+=(this.open-this.gap)*Math.min(1,dt*15);
     // Short physics steps keep the spring and landing stable on slower displays.
     for(let remaining=dt;remaining>0.000001;remaining-=1/120){
       const h=Math.min(remaining,1/120);
       for(const f of this.items)this.motion(f,h);
     }
   }
   motion(f,h){
     const [spring,damping,limit]=texture[f.id];
     if(f===this.held){
       const ex=this.x+this.dx-f.x,ez=this.z+this.dz-f.z,stretch=Math.hypot(ex,ez);
       const offset=Math.hypot(this.dx/f.rx,this.dz/f.rz);
       const purchase=limit*(1-.24*Math.min(1,offset))*(this.firm&&f.id==='lotus'?1.2:1);
       this.strain=clamp(this.strain+h*(stretch>purchase?(stretch/purchase-1)*9:-3),0,1);
       if(this.strain>=1){
         this.held=null;f.falling=true;f.vy=.25;f.vx=clamp(f.vx,-5,5);f.vz=clamp(f.vz,-5,5);
         this.message='Slipped from the tips!';return
       }
       f.vx+=(ex*spring-f.vx*damping)*h;f.vz+=(ez*spring-f.vz*damping)*h;
       f.x+=f.vx*h;f.z+=f.vz*h;f.y+=(1.35-f.y)*h*9;
       f.tilt=clamp(this.twist*f.y+ex*.48,-.58,.58);f.pitch=clamp(-ez*.52,-.55,.55);
       f.angle=this.liftAngle+this.twist*f.y+ez*.14;
       if(this.strain>.18)this.message='Grip sliding — ease off and let it settle.';
       else if(this.message.startsWith('Grip sliding'))this.message='Grip steady. Carry it over the broth.';
     }else if(f.falling){
       f.vy-=15*h;f.y+=f.vy*h;f.x=clamp(f.x+f.vx*h,-5.5,5.35);f.z=clamp(f.z+f.vz*h,-2.55,2.55);
       f.tilt+=f.vx*h*.3;f.pitch-=f.vz*h*.3;
       const broth=this.overBowl(f);
       if(f.y<=(broth?.72:0)){
         f.falling=false;f.bounce=-2;f.vx=f.vz=f.vy=0;
         if(broth)this.plate(f);
         else{f.y=0;this.home(f);this.message='Slipped! Pick it up again on the tray and carry it more gently.'}
       }
     }else{
       f.y+=((f.placed?.72:0)-f.y)*h*12;f.tilt*=1-h*10;f.pitch*=1-h*10;
     }
     const load=f===this.held?Math.min(.11,Math.hypot(f.pitch,f.tilt)*.22):0;
     f.bounce+=((load-f.squash)*spring-f.bounce*damping*.48)*h;
     f.squash=clamp(f.squash+f.bounce*h,-.18,.18);
   }
   overBowl(f){return Math.hypot(f.x-bowl.x,f.z-bowl.z)<bowl.r-.32}
   home(f){const home=foods.find(v=>v.id===f.id);f.x=home.x;f.z=home.z}
   plate(f){
     const landing=[[.65,-.55],[-.73,.26],[.6,.73],[-.76,-.72]][this.served++];
     f.placed=true;f.x=bowl.x+landing[0];f.z=landing[1];this.ripple=1;
     this.message=this.complete?'Ticket complete. Send the bowl to the counter.':f.name+' plated. Check the ticket for the next topping.';
   }
   release(){
     if(!this.down)return;this.down=false;this.candidate=null;const f=this.held;this.held=null;if(!f)return;
     f.vx=f.vz=0;f.bounce=-1.5;
     if(this.overBowl(f))this.plate(f);
     else{this.home(f);this.message='Back on the tray. Release inside the bowl to plate.'}
   }
   get complete(){return this.served===orders[this.order].items.length}
 }
 return {Service,foods,orders,bowl};
})();
