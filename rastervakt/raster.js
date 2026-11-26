'use strict';
const Raster=(()=>{
  const locations=[
    [46,14,'star'],[202,20,'star'],[145,34,'star'],[278,40,'star'],
    [72,51,'lamp'],[209,54,'lamp'],[33,65,'lamp'],
    [86,84,'pine'],[180,85,'pine'],[266,89,'pine'],
    [42,109,'buoy'],[215,111,'buoy'],[281,121,'buoy'],[137,135,'buoy'],[66,145,'buoy']
  ];
  const specs=[
    ['Late lantern','C is loading after its first row. Move its write earlier, after A has finished.',2,[0,1,10],[[0,0],[0,1],[115,0]]],
    ['Double booking','The quay lights overlap. Find the write that steals a slot while another sprite still needs it.',2,[0,1,4,5,10,11],[[0,0],[0,1],[48,0],[50,0],[102,0],[102,1]]],
    ['All fifteen','The whole harbour is on air. Three slots must carry fifteen sprites. Trace the broken rows and repair the listing.',3,locations.map((_,i)=>i),[[0,0],[0,1],[30,0],[43,1],[50,0],[50,1],[62,0],[78,0],[78,1],[80,1],[103,0],[103,1],[123,2],[130,0],[140,1]]]
  ];
  function job(n){
    const [title,brief,slots,ids,writes]=specs[n];
    const targets=ids.map((id,i)=>{const [x,y,kind]=locations[id];return {id:String.fromCharCode(65+i),x,y,kind,end:y+8}});
    return {title,brief,slots,targets,listing:writes.map(([at,slot],i)=>line(at,slot,targets[i].id)).join('\n')};
  }
  const line=(at,slot,id)=>'AT '+String(at).padStart(3,'0')+' : S'+slot+' = '+id;
  const pattern=/^\s*AT\s+(\d+)\s*:\s*S(\d+)\s*=\s*([A-O])\s*$/i;
  function simulate(source,job){
    const writes=[];
    source.split(/\r?\n/).forEach((raw,i)=>{
      if(!raw.trim())return;
      const m=pattern.exec(raw),fail=msg=>{throw new Error('Line '+(i+1)+': '+msg)};
      if(!m)fail('use AT 020 : S0 = A.');
      const row=Number(m[1]),slot=Number(m[2]),id=m[3].toUpperCase();
      if(row>159)fail('choose a row from 0 to 159.');
      if(slot>=job.slots)fail('available slots are S0 through S'+(job.slots-1)+'.');
      if(!job.targets.some(t=>t.id===id))fail('sprite '+id+' is not on this job.');
      writes.push({row,slot,id});
    });
    writes.sort((a,b)=>a.row-b.row);
    const slots=Array(job.slots).fill(null),rows=[],counts={},missing={};
    for(const t of job.targets)counts[t.id]=0;
    let index=0;
    for(let row=0;row<160;row++){
      while(index<writes.length&&writes[index].row===row){const w=writes[index++];slots[w.slot]=w.id}
      rows.push(slots.slice());
      for(const t of job.targets)if(row>=t.y&&row<=t.end){
        if(slots.includes(t.id))counts[t.id]++;else missing[t.id]??=row;
      }
    }
    return {rows,counts,missing};
  }
  return {job,line,pattern,simulate};
})();
