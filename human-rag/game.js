'use strict';
(()=>{
  const $=id=>document.getElementById(id);
  const languages={en:'English',nb:'Norwegian',sv:'Swedish',de:'German',fr:'French'};
  const common=new Set('a an the and at by for where do does did i my to can it on from is of in has have which when should them how after there what while as its you with use me this that are'.split(' '));
  function terms(text){return new Set((text.toLowerCase().match(/[\p{L}\d]+/gu)||[]).filter(t=>!common.has(t)))}
  function overlap(query,passage){let count=0;for(const term of terms(passage))if(query.has(term))count++;return count}
  function gain(grades){return grades.reduce((sum,g,i)=>sum+(2**g-1)/Math.log2(i+2),0)}
  function shuffled(n){const ids=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}return ids}
  const element=(tag,text,cl)=>{const node=document.createElement(tag);node.textContent=text;if(cl)node.className=cl;return node};
  let round=0,order=[],rank=[],filed=false,humanTotal=0,keywordTotal=0,perfect=0;
  const task=()=>dossiers[round],letter=id=>String.fromCharCode(65+order.indexOf(id));
  function renderRank(){
    const list=$('ranking');list.replaceChildren();
    for(let pos=0;pos<task().k;pos++){
      const id=rank[pos],row=element('li',id===undefined?'Choose a passage':'['+letter(id)+'] '+task().cards[id][1]);list.append(row);
      if(filed||id===undefined)continue;
      if(pos>0){const up=element('button','↑');up.setAttribute('aria-label','Move passage '+letter(id)+' up');up.onclick=()=>{[rank[pos-1],rank[pos]]=[id,rank[pos-1]];refresh();$('ranking').querySelector('button')?.focus()};row.append(up)}
      const remove=element('button','×');remove.setAttribute('aria-label','Remove passage '+letter(id));remove.onclick=()=>{rank.splice(pos,1);refresh();$('card-'+id).focus()};row.append(remove)
    }
  }
  function refresh(){
    for(const id of order){const b=$('card-'+id),picked=rank.includes(id);b.setAttribute('aria-pressed',String(picked));b.disabled=filed||(!picked&&rank.length===task().k)}
    renderRank();$('submit').disabled=filed||rank.length!==task().k
  }
  function load(){
    const d=task();order=shuffled(d.cards.length);rank=[];filed=false;
    $('stage').textContent='Request '+(round+1)+' / '+dossiers.length+' · '+d.tab;
    $('query').textContent=d.q;$('instruction').textContent=d.k===1?'Select the single passage that best answers the request.':'Select '+d.k+' passages in order, strongest first. Use ↑ to promote a passage or × to replace it.';
    $('gloss').hidden=!d.gloss;$('gloss').open=false;$('gloss').querySelector('p').textContent=d.gloss||'';
    $('cards').replaceChildren();$('result').replaceChildren();$('next').hidden=true;$('submit').hidden=false;$('recap').hidden=true;
    for(const id of order){
      const [,source,lang,text]=d.cards[id],b=element('button','','card');b.id='card-'+id;
      b.append(element('span',letter(id)+' / '+source+' · '+languages[lang],'meta'));
      const quote=element('span',text,'quote');quote.lang=lang;b.append(quote);
      b.onclick=()=>{const pos=rank.indexOf(id);if(pos>=0)rank.splice(pos,1);else if(rank.length<d.k)rank.push(id);refresh()};
      $('cards').append(b)
    }
    refresh()
  }
  function file(){
    if(filed||rank.length!==task().k)return;
    filed=true;const d=task(),query=terms(d.q);
    const lexical=[...order].sort((a,b)=>overlap(query,d.cards[b][3])-overlap(query,d.cards[a][3])).slice(0,d.k);
    const ideal=[...order].sort((a,b)=>d.cards[b][0]-d.cards[a][0]).slice(0,d.k);
    const grades=ids=>ids.map(id=>d.cards[id][0]),max=gain(grades(ideal));
    const score=ids=>Math.round(100*gain(grades(ids))/max);
    const human=score(rank),machine=score(lexical);humanTotal+=human;keywordTotal+=machine;if(human===100)perfect++;
    const letters=ids=>ids.map(letter).join(' → ');
    $('result').append(element('strong','You '+human+'/100 · Keyword search '+machine+'/100'),
      element('p','Archive order: '+letters(ideal)+'. Keyword order: '+letters(lexical)+'.'),
      element('p','Earlier places earn more credit. Keyword search counts shared words, ignores common English words and breaks ties in shelf order.'));
    for(const id of order){
      const [grade,,,,reason,translation]=d.cards[id],note=element('span','','explain');
      if(translation)note.append(element('span','“'+translation+'” '));
      note.append(element('b',['Off target','Partial match','Useful','Best answer'][grade]+'. '),document.createTextNode(reason));
      $('card-'+id).append(note)
    }
    refresh();$('submit').hidden=true;
    if(round===dossiers.length-1){
      $('recap').hidden=false;$('totals').textContent='Your retrieval score: '+humanTotal+'/600. Keyword search: '+keywordTotal+'/600. Perfect rankings: '+perfect+' of 6.';
    }else $('next').hidden=false
  }
  $('submit').onclick=file;$('next').onclick=()=>{round++;load();$('query').focus()};
  $('restart').onclick=()=>{round=humanTotal=keywordTotal=perfect=0;load();$('query').focus()};load()
})();
