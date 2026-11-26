'use strict';
(()=>{
 const $=id=>document.getElementById(id),{jobs,bits,boot,compile,execute,scan,verify}=RackCPU;
 const storage='enso.io-night.v1';
 let drafts=jobs.map(j=>j.draft),records=jobs.map(()=>null),index=0;
 try{
   const s=JSON.parse(localStorage.getItem(storage));
   if(s){drafts=drafts.map((v,i)=>typeof s.drafts?.[i]==='string'?s.drafts[i]:v);
     records=records.map((_,i)=>Number.isInteger(s.records?.[i])&&s.records[i]>0&&s.records[i]<=8?s.records[i]:null);
     if(Number.isInteger(s.index)&&s.index>=0&&s.index<jobs.length)index=s.index}
 }catch{}
 function persist(){try{localStorage.setItem(storage,JSON.stringify({index,drafts,records}))}catch{}}
 let input,prev,previousInput,pc,cpu,history,last,scans,failure;
 function say(text,error=false){$('msg').textContent=text;$('msg').classList.toggle('error',error)}
 function wave(){
   const el=$('trace'),g=el.getContext('2d'),w=el.clientWidth,h=el.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
   el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);g.scale(dpr,dpr);
   const left=27,period=(w-left-5)/16,row=(h-4)/4;
   g.fillStyle='#102723';g.fillRect(0,0,w,h);g.lineWidth=1;
   for(let i=0;i<=16;i++){g.strokeStyle='#29493b';g.beginPath();g.moveTo(left+i*period,0);g.lineTo(left+i*period,h);g.stroke()}
   const visible=history.slice(-16);
   for(let bit=3;bit>=0;bit--){
     const top=4+(3-bit)*row,bottom=top+row*.66;
     g.fillStyle='#a9bf9e';g.font='10px monospace';g.fillText('A'+bit,0,bottom);
     g.strokeStyle='#325742';g.beginPath();g.moveTo(left,bottom);g.lineTo(w,bottom);g.stroke();
     g.strokeStyle=bit%2?'#a2ef99':'#f3cc82';g.lineWidth=1.8;g.beginPath();
     visible.forEach((v,i)=>{const x=left+i*period,y=v&(1<<bit)?top:bottom;if(i===0)g.moveTo(x,y);else g.lineTo(x,y);g.lineTo(x+period,y)});g.stroke();
   }
 }
 function paint(){
   $('pc').textContent='PC 0x'+pc.toString(16).toUpperCase();
   $('word').textContent=bits(input);$('expected').textContent=bits(jobs[index].goal(input,prev));
   $('acc').textContent=bits(cpu.a);$('mem').textContent=bits(cpu.m);$('op').textContent=last||'RESET';
   $('tick').textContent='CLK '+String(scans).padStart(2,'0');
   [...$('switches').children].forEach((b,i)=>{const on=!!(input&(8>>i));b.textContent=Number(on);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
   $('leds').replaceChildren(...bits(cpu.out).split('').map(c=>{const el=document.createElement('span');el.className='led'+(c==='1'?' on':'');el.textContent=c;return el}));
   wave();
 }
 function reset(){failure=null;$('debug').hidden=true;cpu=boot();pc=0;prev=0;previousInput=0;scans=0;history=[0];last='';paint()}
 function menu(){
   $('jobs').replaceChildren(...jobs.map((j,i)=>{const o=document.createElement('option');o.value=i;o.textContent=(records[i]?'✓ ':'')+'Task 0'+(i+1);return o}));$('jobs').value=index;
 }
 function load(i){
   index=i;const job=jobs[i];input=job.sample;$('station').textContent=job.place.toUpperCase();
   $('name').textContent=job.title;$('brief').textContent=job.brief;$('hint').textContent=job.hint;$('src').value=drafts[i];
   $('next').hidden=true;menu();reset();say(records[i]?'Commissioned · personal best '+records[i]+' instructions.':'Edit the ROM, then step through your sample or verify every input.');persist();
 }
 $('jobs').onchange=e=>load(Number(e.target.value));
 for(let i=0;i<4;i++){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Toggle input bit '+(3-i));b.onclick=()=>{
   if(pc){say('Finish this scan or reset the CPU before changing input.',true);return}
   input^=8>>i;prev=previousInput;paint();say('Input set to '+bits(input)+'. Ready for a scan.');
 };$('switches').append(b)}
 function program(){try{return compile($('src').value)}catch(e){say(e.message,true);return null}}
 $('src').oninput=()=>{drafts[index]=$('src').value;$('next').hidden=true;reset();say('ROM edited. CPU reset.');persist()};
 $('reset').onclick=()=>{reset();say('CPU reset. Registers and output cleared.')};
 $('step').onclick=()=>{
   const code=program();if(!code)return;
   if(pc===0){prev=previousInput;cpu.wrote=false}
   const ins=code[pc++];execute(cpu,ins,input);last=ins.text;history.push(cpu.a);history=history.slice(-16);scans++;
   let feedback='Line '+ins.line+' · '+ins.text+' · A = '+bits(cpu.a);
   if(pc===code.length){pc=0;previousInput=input;feedback+=cpu.wrote?' · OUT '+bits(cpu.out)+'. Scan complete.':' · Scan ended without OUT.'}
   say(feedback);paint();
 };
 $('verify').onclick=()=>{
   const code=program();if(!code)return;
   const job=jobs[index],result=verify(job,code);
   // Leave the analyzer on an actual scan, including the first failing vector.
   let trace;
   failure=result.ok?null:result;$('debug').hidden=result.ok;
   if(result.ok){
     const initial=boot();prev=0;
     if(job.history){prev=input^5;scan(initial,code,prev)}
     trace=scan(initial,code,input);records[index]=Math.min(records[index]??Infinity,code.length);menu();persist();
     say(result.passed+' / '+result.passed+' tests passed. '+job.place+' online · '+code.length+' instructions.');
     $('next').hidden=false;$('next').textContent=index===jobs.length-1?'Return to loopback ↻':'Next task →';
   }else{
     input=result.input;prev=result.prev;trace=result.trace;
     say('Test '+(result.passed+1)+' failed. '+(job.history?'Previous IN '+bits(prev)+', ':'')+'IN '+bits(input)+' expected '+bits(result.expected)+'. '+(trace.at(-1).wrote?'Got '+bits(trace.at(-1).out)+'.':'OUT was never written.'),true);
     $('next').hidden=true;
   }
   cpu={...trace.at(-1)};previousInput=input;pc=0;scans=trace.length;last=cpu.ins.text;history=trace.map(t=>t.a);paint();
 };
 $('debug').onclick=()=>{
   if(!failure)return;
   cpu={...failure.initial};input=failure.input;prev=previousInput=failure.prev;
   pc=scans=0;history=[cpu.a];last='REPLAY';paint();say('Failing scan restored. Step the clock to inspect each instruction.');
 };
 $('next').onclick=()=>load((index+1)%jobs.length);
 new ResizeObserver(()=>wave()).observe($('trace'));
 load(index);
})();
