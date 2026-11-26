'use strict';
(()=>{
  const $=id=>document.getElementById(id),limit=22;
  // Each edit records the operational facts its wording actually preserves.
  // Full, short and cut are distinct editorial choices, including lossy summaries.
  const cases=[
    {time:'20:42',title:'The last bus',job:'Tell tonight’s last-train passengers what is closed, where to board instead, and when boarding ends.',
      scene:'A snowdrift blocks platform 3. The replacement bus is at the west shelter.',
      lines:[
        ['Tonight the last train has been replaced by a bus.','Tonight: last train replaced by bus.',['service']],
        ['The station clock was polished this afternoon.','Clock polished.'],
        ['A snowdrift has closed platform three.','Platform three closed.',['closure']],
        ['Passengers should board at the west shelter.','Use the west shelter.',['stop']],
        ['Boarding closes at 21:05 sharp.','Boarding closes tonight.',['time'],[]],
        ['Lost mittens can be collected from reception tomorrow.','Mittens at reception.']],
      checks:[['service','Which service?','The relief agent needs to know this is tonight’s last train.'],['closure','Closure','People following the old timetable still need to hear that platform three is closed.'],['stop','Boarding point','The passenger needs the west shelter.'],['time','Cutoff','“Tonight” cannot tell a passenger whether they can still board. Keep 21:05.']],
      success:'The last-train passengers leave the blocked platform and board at the west shelter before 21:05.'},
    {time:'21:16',title:'Two Moen trains',job:'Leave the correct boarding instructions for a wheelchair user taking the later Moen train. They need the service, platform and accessible route.',
      scene:'Platform 2 has a blue lift entrance beside the stairs.',
      lines:[
        ['Tonight’s early Moen departure at 21:14 is running on time.','Early Moen train on time.'],
        ['The later train for Moen departs at 21:40.','Moen service at 21:40.',['service']],
        ['Platform two is confirmed for that departure.','Platform two.',['platform']],
        ['The stairs were repainted over the weekend.','Stairs repainted.'],
        ['Use the blue lift beside the ticket office.','Use the lift.',['lift','location'],['lift']],
        ['Keep the paper ticket for inspection on board.','Keep the paper ticket.']],
      checks:[['service','Correct service','Two trains go to Moen. Keep the destination and the 21:40 departure together.'],['platform','Platform','The agent needs platform two.'],['lift','Step-free route','The route must direct the passenger to a lift.'],['location','Which lift?','“Use the lift” drops its colour and location beside the ticket office.']],
      success:'The passenger finds the blue lift by the ticket office and reaches platform two for the 21:40 to Moen.'},
    {time:'22:08',title:'An assignment on hold',job:'Brief the relief agent on the sleeper. Preserve what is uncertain, where passengers should wait, and precisely when they may move.',
      scene:'The sleeper has no platform assignment. Its passengers are waiting under the departure board.',
      lines:[
        ['Platform two appears on a provisional planning sheet from yesterday.','Yesterday’s draft: platform two.'],
        ['Tonight’s sleeper has no confirmed platform assignment.','Sleeper platform unconfirmed.',['state']],
        ['Ask passengers to wait indoors below the departure board.','Wait under the departure board.',['wait']],
        ['The café next to the board closes at half past ten.','Café closes shortly.'],
        ['Move only after control announces the platform over the loudspeaker.','Move after an announcement.',['trigger'],[]],
        ['A crew announcement about empty coaches is expected first.','Crew announcement due first.']],
      checks:[['state','Uncertainty','The draft is provisional. The agent must say the sleeper platform is unconfirmed.'],['wait','Waiting point','Give passengers the departure board as a meeting point.'],['trigger','Release condition','A crew announcement is due first. Keep the instruction to wait specifically for control’s platform announcement.']],
      success:'The passengers stay under the board through the crew call and move only when control announces their platform.'}
  ];
  const count=text=>(text.match(/[\p{L}\d]+(?:[’:][\p{L}\d]+)*/gu)||[]).length;
  let level=0,edits=[],passed=false;
  const task=()=>cases[level],words=(line,mode)=>mode===2?'':line[mode];
  function refresh(){
    const lines=task().lines,brief=lines.map((line,i)=>words(line,edits[i])).filter(Boolean);
    const n=brief.reduce((sum,s)=>sum+count(s),0);
    $('budget').textContent=n+' / 22 tokens';$('budget').classList.toggle('over',n>limit);
    $('note').textContent=n>limit?'Cut '+(n-limit)+' more tokens to send.':n===0?'Keep at least one instruction.':passed?'Handover accepted.':'Fits the context window.';
    $('draft').textContent=brief.join(' ')||'Empty context';
    $('send').disabled=n>limit||!n||passed;$('send').hidden=passed;$('next').hidden=!passed;
    task().lines.forEach((line,i)=>{
      const row=$('line'+i);row.dataset.mode=edits[i];row.querySelector('.edited').textContent=edits[i]===1?line[1]:'';
      for(const b of row.querySelectorAll('button')){b.disabled=passed;b.setAttribute('aria-pressed',String(Number(b.value)===edits[i]))}
    })
  }
  function load(){
    const data=task();edits=data.lines.map(()=>0);passed=false;$('docs').replaceChildren();$('result').replaceChildren();$('time').textContent='Vintervik · '+data.time;$('case').textContent='Handover '+(level+1)+' / 3';
    $('title').textContent=data.title;$('job').textContent=data.job;$('caption').textContent=data.scene;$('next').textContent=level===2?'New shift':'Next handover';
    data.lines.forEach((line,i)=>{
      const row=document.createElement('div');row.className='line';row.id='line'+i;
      const original=document.createElement('p');original.className='original';original.textContent=line[0];
      const edited=document.createElement('p');edited.className='edited';
      const group=document.createElement('div');group.className='toggles';group.setAttribute('role','group');group.setAttribute('aria-label','Edit instruction '+(i+1));
      ['Keep','Shorten','Cut'].forEach((label,mode)=>{
        const b=document.createElement('button');b.value=mode;b.textContent=label+' · '+count(words(line,mode));
        b.onclick=()=>{edits[i]=mode;$('result').replaceChildren();refresh()};group.append(b)
      });
      row.append(original,edited,group);$('docs').append(row)
    });
    drawStation($('station'),level);refresh()
  }
  $('send').onclick=()=>{
    const data=task(),facts=new Set();
    data.lines.forEach((line,i)=>{if(edits[i]!==2)for(const fact of (edits[i]===1?line[3]??line[2]:line[2])||[])facts.add(fact)});
    passed=data.checks.every(([id])=>facts.has(id));const result=$('result');result.replaceChildren();
    const message=document.createElement('strong');message.textContent=passed?data.success:'The relief agent needs a revision.';result.append(message);
    const list=document.createElement('ul');
    for(const [id,label,hint] of data.checks){const li=document.createElement('li');li.textContent=facts.has(id)?'Kept · '+label:'Missing · '+hint;list.append(li)}
    result.append(list);if(passed&&level===2)result.append('Shift complete. All three handovers delivered.');refresh()
  };
  $('next').onclick=()=>{level=(level+1)%cases.length;load();$('title').focus()};load()
})();
