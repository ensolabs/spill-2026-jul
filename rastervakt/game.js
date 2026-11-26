'use strict';
(()=>{
  const $=id=>document.getElementById(id),draw=ferryDisplay($('screen')),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,job,frame,selected,trace=null,limit=159,animation=null,won=false;
  function paint(){
    draw(job,frame,limit,trace,selected);
    const row=Number($('row').value);$('line').textContent=String(row).padStart(3,'0');
    $('registers').textContent=Array.from({length:job.slots},(_,s)=>'S'+s+' ['+(frame?.rows[row][s]||'–')+']').join('   ');
  }
  function stop(){if(animation!==null)cancelAnimationFrame(animation);animation=null;limit=159}
  function report(text){$('report').textContent=text}
  function manifest(){
    $('manifest').replaceChildren(...job.targets.map(t=>{
      const b=document.createElement('button');b.type='button';b.dataset.id=t.id;b.setAttribute('aria-pressed',String(t.id===selected));b.className='chip';
      const count=frame?.counts[t.id];if(count===9)b.classList.add('complete');
      const id=document.createElement('strong'),range=document.createElement('span'),status=document.createElement('em');
      id.textContent=t.id;range.textContent=t.kind+' '+t.y+'–'+t.end;status.textContent=count===undefined?'Untested':count+' / 9 rows';
      b.append(id,range,status);return b;
    }));
  }
  function select(id){
    selected=id;$('sprite').value=id;
    const m=$('program').value.split('\n').map(l=>Raster.pattern.exec(l)).find(m=>m&&m[3].toUpperCase()===id);
    $('at').value=m?Number(m[1]):job.targets.find(t=>t.id===id).y;$('slot').value=m&&Number(m[2])<job.slots?Number(m[2]):0;
    manifest();paint();
  }
  function invalidate(){
    stop();won=false;frame=null;trace=null;$('next').hidden=true;$('signal').textContent='Edited';report('Listing changed. RUN to test the frame.');manifest();paint();
  }
  function finish(){
    stop();const broken=job.targets.find(t=>frame.counts[t.id]!==9);won=!broken;
    if(broken){trace=frame.missing[broken.id];$('row').value=trace;select(broken.id);
      report('Sprite '+broken.id+' drops out at row '+trace+'. Inspect the slots on that row.');$('signal').textContent='Signal incomplete'}
    else{trace=null;$('signal').textContent='On air';report(index===2?'All fifteen sprites on air. The midnight ferry has a clear signal.':'Frame locked. Every sprite survived all nine rows.');$('next').hidden=false;$('next').textContent=index===2?'New shift':'Next job'}
    manifest();paint();
  }
  function run(){
    stop();won=false;$('next').hidden=true;
    try{frame=Raster.simulate($('program').value,job)}catch(e){frame=null;trace=null;report(e.message);$('signal').textContent='Listing error';manifest();paint();return}
    $('signal').textContent='Scanning';report('Scanning the frame…');
    if(reduce.matches){finish();return}
    const start=performance.now();function scan(now){limit=Math.min(159,Math.floor((now-start)/6));trace=limit;$('row').value=limit;paint();if(limit===159)finish();else animation=requestAnimationFrame(scan)}
    animation=requestAnimationFrame(scan);
  }
  function load(){
    stop();job=Raster.job(index);won=false;trace=null;
    $('job').textContent='JOB 0'+(index+1)+' / 03 · '+job.slots+' sprite slots';$('title').textContent=job.title;$('brief').textContent=job.brief;$('program').value=job.listing;
    $('sprite').replaceChildren(...job.targets.map(t=>new Option(t.id,t.id)));$('slot').replaceChildren(...Array.from({length:job.slots},(_,i)=>new Option('S'+i,i)));
    $('row').value=0;$('next').hidden=true;$('signal').textContent='Preview';frame=Raster.simulate(job.listing,job);
    select(job.targets.find(t=>frame.counts[t.id]<9).id);report('RUN the listing to locate the first broken row.');
  }
  $('manifest').onclick=e=>{const b=e.target.closest('button');if(b){select(b.dataset.id);$('manifest').querySelector('[aria-pressed=true]').focus()}};
  $('sprite').onchange=e=>select(e.target.value);
  $('patch').onsubmit=e=>{
    e.preventDefault();const lines=$('program').value.split('\n'),i=lines.findIndex(l=>Raster.pattern.exec(l)?.[3].toUpperCase()===selected),out=Raster.line(Number($('at').value),Number($('slot').value),selected);
    if(i<0)lines.push(out);else lines[i]=out;$('program').value=lines.join('\n');invalidate();
  };
  $('program').oninput=invalidate;$('program').onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run()}};
  $('run').onclick=run;$('row').oninput=()=>{const row=Number($('row').value);if(animation!==null)finish();trace=row;$('row').value=row;paint()};
  $('reset').onclick=load;$('next').onclick=()=>{if(!won)return;index=(index+1)%3;load()};
  load();
})();
