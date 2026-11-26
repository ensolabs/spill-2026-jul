'use strict';
(()=>{
  const $=id=>document.getElementById(id);
  const drawer=$('drawer'),rack=$('slots'),submit=$('return'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  let mittens,slots,returned,firstTry,signatures,drag=null,suppressClick=false;
  const say=text=>{$('message').textContent=text};
  function button(text,action,cls){
    const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.action=action;b.className=cls||'';return b;
  }
  function reset(){
    mittens=Wool.pairs.flatMap((_,pair)=>[0,1].map(hand=>({pair,hand,palm:false,open:false,mistake:false,home:false})));
    for(let i=mittens.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[mittens[i],mittens[j]]=[mittens[j],mittens[i]]}
    mittens.forEach((m,i)=>{m.id=i;m.angle=Math.round(Math.random()*30-15)});
    slots=[null,null];returned=firstTry=0;signatures=[];
    say('Look for the golden pair with the big cream stars.');render();
  }
  function imageButton(m,inspected){
    const b=button('',inspected?'flip':'pick',inspected?'specimen':'item');b.dataset.mitten=m.id;
    const label=Wool.describe(m);b.setAttribute('aria-label',(inspected?'Flip ':'Inspect ')+label);b.title=label;b.style.setProperty('--angle',m.angle+'deg');b.append(Wool.picture(m));return b;
  }
  function render(focus){
    const finished=returned===7;
    const waiting=mittens.filter(m=>!m.home&&!slots.includes(m));
    drawer.replaceChildren(...waiting.map(m=>imageButton(m,false)));
    if(finished){const done=document.createElement('p');done.className='finished';done.textContent='Every hand has found its mitten.';drawer.append(done)}
    $('remaining').textContent=waiting.length+' in drawer';
    $('progress').textContent=returned+' / 7 returned';
    rack.replaceChildren(...slots.map((m,i)=>{
      const slot=document.createElement('div');slot.className='slot';slot.dataset.slot=i;
      if(!m){const blank=document.createElement('div');blank.className='empty';blank.textContent=finished?'Desk cleared':'Lay a mitten here';slot.append(blank);return slot}
      const status=document.createElement('p');status.className='slot-status';status.textContent=(m.hand?'Right':'Left')+' · '+(m.palm?'Palm':'Back');
      const clue=document.createElement('p');clue.className='clue';
      const desc=Wool.describe(m);clue.textContent=desc.split(', ').slice(2).join(' · ');
      const tools=document.createElement('div');tools.className='tools';tools.append(button('Flip','flip'),button(m.open?'Fold cuff':'Open cuff','cuff'));
      slot.append(imageButton(m,true),status,clue,tools,button('Put back','back','putback'));return slot;
    }));
    rack.hidden=finished;
    $('ledger').hidden=!finished;
    if(finished){
      $('tally').textContent=firstTry+' of 7 pairs returned on the first try';
      $('signatures').replaceChildren(...signatures.map(owner=>{const name=document.createElement('li');name.textContent=owner;return name}));
    }
    submit.disabled=!finished&&slots.some(m=>!m);submit.textContent=finished?'Open another shift':'Return this pair';
    if(focus)document.querySelector(focus)?.focus({preventScroll:true});
  }
  function place(m,i){
    if(m.home)return;
    if(i<0){say('Both places are full. Put one mitten back, or drag a new one over its place.');return}
    const old=slots.indexOf(m);if(old===i)return;
    if(old>=0)slots[old]=slots[i];
    slots[i]=m;render('[data-slot="'+i+'"] [data-action="flip"]');
  }
  function animateReturn(){
    if(motion.matches)return;
    const dest=submit.getBoundingClientRect();
    for(const el of rack.querySelectorAll('canvas')){
      const r=el.getBoundingClientRect(),copy=document.createElement('canvas');copy.width=el.width;copy.height=el.height;copy.getContext('2d').drawImage(el,0,0);
      Object.assign(copy.style,{position:'fixed',left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px',objectFit:'contain',pointerEvents:'none',zIndex:20});
      copy.setAttribute('aria-hidden','true');document.body.append(copy);
      const dx=dest.x+dest.width/2-r.x-r.width/2,dy=dest.y-r.y;
      copy.animate([{transform:'none',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) scale(.32) rotate(9deg)',opacity:0}],{duration:470,easing:'ease-in',fill:'forwards'}).onfinish=()=>copy.remove();
    }
  }
  function handOver(){
    if(returned===7){reset();drawer.querySelector('button')?.focus();return}
    const [a,b]=slots;if(!a||!b)return;
    const family=Wool.pairs[a.pair];
    if(a.pair!==b.pair||a.hand===b.hand){
      a.mistake=b.mistake=true;
      say(a.hand===b.hand?'Two '+(a.hand?'right':'left')+' hands. '+family.owner+' says, “'+family.hint+'”':family.owner+' shakes their head. “'+family.hint+'”');return;
    }
    animateReturn();signatures.push(family.owner);a.home=b.home=true;returned++;if(!a.mistake&&!b.mistake)firstTry++;
    slots=[null,null];render();say(family.thanks+(returned===7?' All seven pairs home. '+firstTry+' of 7 on the first try.':''));
    (drawer.querySelector('button')||submit).focus({preventScroll:true});
  }
  submit.onclick=handOver;
  document.querySelector('.worktop').addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    const i=Number(b.closest('[data-slot]')?.dataset.slot);
    if(b.dataset.action==='pick'){place(mittens[Number(b.dataset.mitten)],slots.indexOf(null));return}
    const m=slots[i];if(!m)return;
    if(b.dataset.action==='back'){slots[i]=null;render('[data-mitten="'+m.id+'"]');return}
    if(b.dataset.action==='flip')m.palm=!m.palm;else m.open=!m.open;
    render('[data-slot="'+i+'"] .tools [data-action="'+b.dataset.action+'"]');
    if(!motion.matches)rack.querySelector('[data-slot="'+i+'"] canvas').animate(b.dataset.action==='flip'?[{transform:'scaleX(.15)'},{transform:'scaleX(1)'}]:[{transform:'translateY(3px)'},{transform:'none'}],{duration:170,easing:'ease-out'});
  });
  const tabletop=document.querySelector('.worktop');
  function targetAt(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot],#drawer,#return')}
  function clearDrag(){
    if(!drag)return;
    drag.ghost?.remove();drag.over?.classList.remove('over');drag=null;
  }
  tabletop.addEventListener('pointerdown',e=>{
    const b=e.target.closest('[data-mitten]');if(!b||drag||e.button!==0)return;
    drag={id:e.pointerId,m:mittens[Number(b.dataset.mitten)],x:e.clientX,y:e.clientY,source:b};b.setPointerCapture(e.pointerId);
  });
  tabletop.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    if(!drag.ghost){
      if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
      drag.ghost=Wool.picture(drag.m);drag.ghost.className='dragging';document.body.append(drag.ghost);
    }
    drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
    const over=targetAt(e);if(over!==drag.over){drag.over?.classList.remove('over');over?.classList.add('over');drag.over=over}
  });
  tabletop.addEventListener('pointerup',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const m=drag.m,active=!!drag.ghost,target=targetAt(e);clearDrag();if(!active)return;
    suppressClick=true;setTimeout(()=>suppressClick=false,0);
    if(target?.id==='return'&&slots.includes(m)){handOver();return}
    if(target===drawer&&slots.includes(m)){slots[slots.indexOf(m)]=null;render();return}
    if(target?.hasAttribute('data-slot'))place(m,Number(target.dataset.slot));
  });
  tabletop.addEventListener('lostpointercapture',clearDrag);
  tabletop.addEventListener('pointercancel',clearDrag);
  tabletop.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation()}},true);
  reset();
})();
