'use strict';
(()=>{
  const D=Dispatch,$=id=>document.getElementById(id),draw=sleighAtlas($('atlas'));
  let order=[...D.inherited],packed=new Set(),rows,mode='plan',elapsed=0,last=0,frame=0;
  const make=(tag,cls,txt)=>{const node=document.createElement(tag);node.className=cls;if(txt!==undefined)node.textContent=txt;return node};
  function move(id,delta){
    const i=order.indexOf(id),j=i+delta;if(mode!=='plan'||j<0||j>=order.length)return;
    [order[i],order[j]]=[order[j],order[i]];render();
    const row=$('hub'+id);(row.querySelector('button[data-delta="'+delta+'"]:enabled')||row.querySelector('button:enabled')).focus()
  }
  function chart(){
    const horizon=Math.max(D.night,Math.ceil(rows.at(-1).end/60)*60);
    $('rows').replaceChildren();$('crates').textContent=packed.size+' / '+D.capacity+' sacks pre-sorted';
    const scale=make('div','row scale'),axis=make('div','axis');
    scale.append(make('b','','Run order'),axis,make('b','','Workshop prep'));
    for(let m=0;m<=horizon;m+=180){const tick=make('span','',m/60+'h');tick.style.left=m/horizon*100+'%';axis.append(tick)}
    $('rows').append(scale);
    for(const [i,r] of rows.entries()){
      const h=D.hubs[r.id],row=make('div','row'+(r.ok?'':' late'));row.id='hub'+r.id;
      const setting=make('div','setting');
      for(const [delta,icon] of [[-1,'↑'],[1,'↓']]){
        const b=make('button','',icon);b.dataset.delta=delta;b.setAttribute('aria-label','Move '+h.short+(delta<0?' earlier':' later'));
        b.disabled=mode!=='plan'||i+delta<0||i+delta>=rows.length;b.onclick=()=>move(r.id,delta);setting.append(b)
      }
      setting.append(make('b','',(i+1)+'. '+h.name));row.append(setting);
      const graph=make('div','graph'),track=make('div','track');
      function bar(start,end,cls){const b=make('i',cls);b.style.left=start/horizon*100+'%';if(end!==null)b.style.width=(end-start)/horizon*100+'%';track.append(b)}
      bar(h.open,h.dawn,'window');bar(r.depart,r.arrive,'flight');bar(r.arrive,r.start,'waiting');bar(r.start,r.end,'delivery');bar(D.night,null,'night');bar(h.dawn,null,'dawn');
      track.title='Fly '+(r.arrive-r.depart)+' min · wait '+(r.start-r.arrive)+' min · deliver '+(r.end-r.start)+' min';
      const times=make('div','times');times.append(make('span','','Finish '+D.clock(r.end)+' / dawn '+D.clock(h.dawn)),make('b','',r.ok?'On time':(r.end-h.dawn)+'m late'));
      graph.append(track,times);row.append(graph);
      const label=make('label',''),box=document.createElement('input');box.type='checkbox';box.checked=packed.has(r.id);box.disabled=mode!=='plan'||(!box.checked&&packed.size>=D.capacity);
      box.setAttribute('aria-label','Pre-sort '+h.short+' gifts, save '+h.save+' minutes');
      box.onchange=()=>{if(box.checked)packed.add(r.id);else packed.delete(r.id);render();$('hub'+r.id).querySelector('input').focus()};
      label.append(box,document.createTextNode(' Pre-sort · −'+h.save+'m'));row.append(label);$('rows').append(row)
    }
  }
  function paint(){
    const end=rows.at(-1).end,ok=rows.filter(r=>r.ok),miss=rows.find(r=>!r.ok),original=order.every((id,i)=>id===D.inherited[i])&&!packed.size;
    const planning=mode==='plan',running=mode==='flight';
    $('onTime').textContent=(planning?ok.length:ok.filter(r=>r.end<=elapsed).length)+' / 8';
    $('clockLabel').textContent=planning?'Route length':'Elapsed time';$('duration').textContent=D.clock(Math.floor(planning?end:elapsed));
    $('restore').hidden=!planning||original;
    if(planning){
      $('mode').textContent='Christmas Eve manifest';$('launch').textContent='Launch the sleigh';
      $('headline').textContent=original?'This route misses dawn.':miss?'Still chasing daylight.':'Cleared for Christmas.';
      $('dispatch').textContent=original?'The inherited route sends Santa across the ocean and back. Find the first missed dawn below and bring that run forward.':miss?'First missed window: '+D.hubs[miss.id].short+' finishes '+(miss.end-D.hubs[miss.id].dawn)+' minutes after its dawn.':'Every region fits. Launch to deliver the gifts with '+(D.night-end)+' minutes in reserve.';
    }else if(running){
      const r=rows.find(r=>elapsed<r.end)||rows.at(-1),h=D.hubs[r.id];
      $('mode').textContent='Christmas Eve · sleigh airborne';$('headline').textContent=h.name;
      $('dispatch').textContent=elapsed<r.arrive?'Flying to the regional hub.':elapsed<r.start?'The households are still awake. Santa is waiting for the delivery window.':'Santa is working through the local gift list.';
      $('launch').textContent='Finish flight'
    }else{
      $('mode').textContent='Christmas morning';$('launch').textContent='Revise this plan';
      $('headline').textContent=miss?'Some stockings are empty.':'Every stocking is full!';
      $('dispatch').textContent=miss?'Santa reached '+ok.length+' of 8 regions in time. Start with '+D.hubs[miss.id].short+', the first missed dawn on your chart.':'All eight regions report happy households. Santa finished '+(D.night-end)+' minutes before the workshop deadline.';
    }
    draw(rows,planning?null:elapsed)
  }
  function render(){rows=D.plan(order,packed);chart();paint()}
  function finish(){cancelAnimationFrame(frame);elapsed=Math.min(D.night,rows.at(-1).end);mode='result';paint()}
  function tick(now){
    const dt=Math.max(0,Math.min(.12,(now-last)/1000));last=now;
    const menu=document.querySelector('arcade-nav').shadowRoot?.querySelector('button')?.getAttribute('aria-expanded')==='true';
    if(!document.hidden&&!menu)elapsed+=dt*47;
    if(elapsed>=Math.min(D.night,rows.at(-1).end)){finish();return}
    paint();frame=requestAnimationFrame(tick)
  }
  $('launch').onclick=()=>{
    if(mode==='flight')return finish();
    if(mode==='result'){mode='plan';render();return}
    mode='flight';elapsed=0;last=performance.now();chart();paint();frame=requestAnimationFrame(tick)
  };
  $('restore').onclick=()=>{order=[...D.inherited];packed.clear();render()};render()
})();
