'use strict';
(()=>{
  const games=[
    {day:1,slug:'frost-shift',name:'Frost Shift',genre:'Snowball delivery',line:'Take the wheel in a snowy fjord town and throw snowballs into three overheating data centres.',color:'#ffac8c'},
    {day:2,slug:'code-kata',name:'Code Kata',genre:'Command fighter',line:'Write a combo and spar beneath the snowy dojo gate.',color:'#a1e4cb'},
    {day:3,slug:'gingerbread',name:'Pepperkakeverksted',genre:'Physics sandbox',line:'Cut, bake and balance the tallest gingerbread tower.',color:'#ebc88a'},
    {day:4,slug:'nordlys',name:'Nordlys Dispatch',genre:'Rescue flight',line:'Winch a survivor from a ship and fly them safely ashore.',color:'#89d9cb'},
    {day:5,slug:'polar-circuit',name:'Polar Circuit',genre:'Optics puzzle',line:'Route two wavelengths through an Arctic data center.',color:'#c8a2ff'},
    {day:6,slug:'smorebua',name:'Smørebua',genre:'Ski wax time trial',line:'Trondheim, World Cup weekend. Tune the wax and race your best ghost.',color:'#b7dbad'},
    {day:7,slug:'ink-circle',name:'Ensō',genre:'Snow drawing',line:'Trace one circle in fresh powder and see how it scores.',color:'#b9dbe5'},
    {day:8,slug:'infinity-line',name:'Evighetsekspressen',genre:'Railway dispatch',line:'Work the crossing on a snowy figure eight and keep the night trains on time.',color:'#ebc292'},
    {day:9,slug:'minute-89',name:'The 89th Minute',genre:'Set-piece tactics',line:'Draw the runs and bend the delivery on a snowy European match night.',color:'#f2bd73'},
    {day:10,slug:'io-night',name:'I/O Night Shift',genre:'Four-bit programming',line:'Clock a tiny field computer one instruction at a time and bring the Arctic relay online.',color:'#c2dc9a'},
    {day:11,slug:'pinneklypa',name:'Pinneklypa',genre:'Chopstick counter',line:'Lift a slice of ribbe and plate a steaming bowl at the midnight ramen counter.',color:'#f3ba87'},
    {day:12,slug:'slag-tolv',name:'Slag tolv',genre:'Rhythm & timing',line:'Watch the harbour clock, keep counting when it sticks, and ring the bell on twelve.',color:'#f2ce8d'},
    {day:13,slug:'lykkeluka',name:'Lykkeluka',genre:'Winter raffle',line:'Turn the drum and bank your stars before the unlucky thirteen rolls out.',color:'#eac282'},
    {day:14,slug:'vottelotto',name:'Vottelotto',genre:'Lost-property puzzle',line:'Pair fourteen woollen mittens by lamplight before the ferry desk closes for the night.',color:'#e7c899'},
    {day:15,slug:'rastervakt',name:'Rastervakt',genre:'Raster programming',line:'Reuse sprite slots one scanline at a time to light the midnight ferry display.',color:'#b5ecc4'},
    {day:16,slug:'return-leg',name:'The Return Leg',genre:'Set-piece goalkeeping',line:'Face your own ninth-door routine from the goal line at ensō Stadium.',color:'#ffe077'},
    {day:17,slug:'fjordferga',name:'Fjordferga',genre:'Ferry navigation',line:'Thread the buoy gates and bring three loads of cars and passengers across the winter fjord.',color:'#afdac3'},
    {day:18,slug:'bitshift-18',name:'Bitshift 18',genre:'LED repair puzzle',line:'Shift, rotate and XOR the eighteen columns of a winter bus sign before the bus pulls in.',color:'#ffc363'},
    {day:19,slug:'skru',name:'Skru',genre:'Curling shot challenge',line:'Read the ice, curl around a guard and sweep the last stone onto the button.',color:'#9ddcde'},
    {day:20,slug:'seven-metres',name:'Seven Metres',genre:'Handball shooting',line:'Sell the feint and score from seven metres to force extra time in Katowice.',color:'#ffbc91'},
    {day:21,slug:'lysglott',name:'Lysgløtt',genre:'Solstice photography',line:'Catch the winter sun between two peaks and bring home a three-frame contact sheet.',color:'#f5c89d'},
    {day:22,slug:'kontekstvindu',name:'Kontekstvindu',genre:'Context engineering',line:'Trim a long station handover to 22 tokens without losing the instructions the next shift needs.',color:'#bde1cb'},
    {day:23,slug:'human-rag',name:'Human RAG',genre:'Passage ranking',line:'Work the winter archive by hand. Rank the passages that answer each request, across languages and near misses.',color:'#e6be88'},
    {day:24,slug:'juleruta',name:'Juleruta',genre:'Christmas Eve route planning',line:'Rebuild Santa’s dispatch chart and fit every delivery around the world into one night.',color:'#f0bc86'}
  ];
  const root=new URL('../',document.currentScript.src);
  const url=path=>new URL(path,root).href;
  const day=g=>String(g.day).padStart(2,'0');
  const iso=g=>AdventAccess.date(g.day);
  let today=AdventAccess.today();
  const gameUrl=g=>url(g.slug+'/index.html');
  class ArcadeNav extends HTMLElement{
    connectedCallback(){
      if(this.shadowRoot)return;
      const dom=this.attachShadow({mode:'open'}),slug=this.getAttribute('game');
      dom.innerHTML='<link rel="stylesheet" href="'+url('arcade/nav.css')+'"><div class="bar"><a class="brand" aria-label="ensō Arcade advent calendar" href="'+url('index.html')+'">ensō <b>ARCADE</b></a><div class="menu"><button type="button" aria-expanded="false" aria-controls="games"><span class="grid" aria-hidden="true">▦</span> Game calendar <span class="chev" aria-hidden="true">⌄</span></button><nav id="games" aria-label="Game calendar" hidden><a class="home" href="'+url('index.html')+'" '+(!slug?'aria-current="page"':'')+'>Calendar overview</a><div class="entries"></div><div class="calendar-foot"><button class="door" aria-label="Enter calendar code">🚪</button></div></nav></div></div>';
      const trigger=dom.querySelector('button'),nav=dom.querySelector('nav');
      this.refresh=()=>{
        dom.querySelector('.entries').innerHTML=games.map(g=>{
          const content='<time datetime="'+iso(g)+'">'+day(g)+' DEC</time><b>'+g.name+'</b>';
          return AdventAccess.open(g.day)?'<a class="entry" href="'+gameUrl(g)+'" '+(g.slug===slug?'aria-current="page"':'')+'>'+content+'</a>':'<span class="entry locked" aria-disabled="true">'+content+'</span>';
        }).join('');
      };
      this.refresh();
      dom.querySelector('.door').onclick=()=>{close();askCode(trigger)};
      const close=()=>{nav.hidden=true;trigger.setAttribute('aria-expanded','false')};
      trigger.onclick=()=>{if(!nav.hidden)return close();if(slug==='nordlys'||slug==='infinity-line'){const pause=document.getElementById('pause');if(pause&&!pause.disabled)pause.click()}nav.hidden=false;trigger.setAttribute('aria-expanded','true');trigger.focus()};
      document.addEventListener('pointerdown',e=>{if(!e.composedPath().includes(this))close()},true);
      document.addEventListener('focusin',e=>{if(!e.composedPath().includes(this))close()});
      window.addEventListener('keydown',e=>{
        if(nav.hidden||dialog.open)return;
        const links=[trigger,...nav.querySelectorAll('a,button')],i=links.indexOf(dom.activeElement);
        if(e.key==='Escape'){e.preventDefault();close();trigger.focus()}
        if(['ArrowDown','ArrowUp','KeyS','KeyW'].includes(e.code)){e.preventDefault();links[(i+(['ArrowDown','KeyS'].includes(e.code)?1:-1)+links.length)%links.length].focus()}
        e.stopImmediatePropagation();
      },true);
    }
  }
  const dialog=document.createElement('dialog');
  dialog.className='advent-code';dialog.setAttribute('aria-label','Unlock calendar');
  dialog.innerHTML='<form><label>Calendar code <input required type="password" inputmode="numeric" maxlength="4" autocomplete="off"></label><p role="status"></p><button type="button">Cancel</button> <button>Open all games</button></form>';
  document.body.append(dialog);
  const dialogCSS=document.createElement('link');dialogCSS.rel='stylesheet';dialogCSS.href=url('arcade/access.css');document.head.append(dialogCSS);
  let returnFocus;
  function askCode(button){
    returnFocus=button;dialog.querySelector('form').reset();dialog.querySelector('p').textContent='';
    dialog.showModal();dialog.querySelector('input').focus();
  }
  dialog.addEventListener('keydown',e=>e.stopPropagation());
  dialog.querySelector('[type=button]').onclick=()=>dialog.close();
  dialog.onclose=()=>returnFocus?.focus();
  dialog.querySelector('form').onsubmit=e=>{
    e.preventDefault();const input=dialog.querySelector('input');
    try{
      if(AdventAccess.unlock(input.value)){refresh();dialog.close();return}
      dialog.querySelector('p').textContent='Incorrect code. Try again.';input.select();
    }catch{dialog.querySelector('p').textContent='Enable browser storage to remember the calendar code.'}
  };
  customElements.define('arcade-nav',ArcadeNav);
  const catalog=document.getElementById('catalog');
  function refresh(){
    today=AdventAccess.today();document.querySelector('arcade-nav')?.refresh();
    if(catalog)catalog.innerHTML=games.map(g=>!AdventAccess.open(g.day)?
      '<li class="closed"><div class="card" aria-disabled="true"><time datetime="'+iso(g)+'">'+day(g)+' DEC</time><h2>'+g.name+'</h2></div></li>':'<li style="--accent:'+g.color+'"><a class="card" href="'+gameUrl(g)+'"><div class="cover"><img src="'+url('arcade/covers/'+g.slug+'.jpg')+'" alt=""><time datetime="'+iso(g)+'"><b>'+day(g)+'</b> DEC</time>'+(today===iso(g)?'<span class="today">Today</span>':'')+'</div><div class="caption"><small>'+g.genre+'</small><h2>'+g.name+'</h2><p>'+g.line+'</p><span class="arrow" aria-hidden="true">↗</span></div></a></li>').join('');
  }
  document.querySelector('.calendar-foot .door')?.addEventListener('click',e=>askCode(e.currentTarget));
  refresh();
  const checkDate=()=>{if(today!==AdventAccess.today())refresh()};
  setInterval(checkDate,1000);window.addEventListener('pageshow',refresh);
  window.addEventListener('storage',e=>{if(e.key===AdventAccess.storageKey)refresh()});
})();
