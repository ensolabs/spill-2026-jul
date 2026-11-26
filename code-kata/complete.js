'use strict';
(()=>{
  const input=$('code'),list=$('suggestions'),ghost=$('ghost');
  const directions={jump:['forward','back'],move:['left','right']};
  const secrets=['hadooken','hadouken','shoryuken','freezeframe'];
  let choices=[],active=0,start=0,end=0;
  function clear(){choices=[];active=0;list.replaceChildren();ghost.replaceChildren()}
  function refresh(){
    clear();
    if(input.readOnly||input.disabled||document.activeElement!==input||input.selectionStart!==input.selectionEnd)return;
    const value=input.value,caret=input.selectionStart,head=value.slice(0,caret);
    const calls=value.split('.');
    if(calls.length>3)return;
    const left=head.lastIndexOf('.')+1,next=value.indexOf('.',caret);
    const segment=value.slice(left,next<0?value.length:next).replace(/;\s*$/,'');
    start=left+segment.length-segment.trimStart().length;
    end=start+segment.trim().length;
    if(!segment.trim())end=start;
    if(caret<start||caret>end||(!head.trim()))return;
    const prefix=value.slice(start,caret);
    const name=/^[a-z]+/.exec(prefix)?.[0]||'';
    const open=prefix.includes('(');
    let callsToTry=[];
    if(!open){
      for(const fn of [...Object.keys(strikes),...Object.keys(directions),'block',...(name?secrets:[])]){
        if(!fn.startsWith(prefix))continue;
        if(directions[fn])callsToTry.push(...directions[fn].map(arg=>fn+'('+arg+')'));
        else callsToTry.push(fn+'()');
      }
    }else{
      const args=directions[name],strike=Object.hasOwn(strikes,name)&&strikes[name];
      if(Array.isArray(args))callsToTry=args.map(a=>name+'('+a+')');
      else if(strike){
        const targets=strike.aimed?Object.keys(zones):[strike.target];
        callsToTry=[name+'()',...targets.map(a=>name+'('+a+')')];
        if(prefix.includes(','))callsToTry=targets.flatMap(a=>['fast','hard'].map(b=>name+'('+a+', '+b+')'));
      }else if(name==='block'||secrets.includes(name))callsToTry=[name+'()'];
    }
    const compact=s=>s.replace(/\s+/g,'');
    // In an existing call, replace only the token under the caret. Keep later arguments.
    const tail=value.slice(caret,end),wordTail=tail.match(/^[a-z]*/)[0];
    const delimiter=tail.slice(wordTail.length).trimStart()[0];
    if(delimiter&&['(',',',')'].includes(delimiter)){
      end=caret+wordTail.length;
      callsToTry=callsToTry.map(s=>{
        const boundary=delimiter===','?s.indexOf(')'):s.indexOf(delimiter,delimiter==='('?0:prefix.length);
        return boundary<0?s:s.slice(0,boundary)
      });
    }
    choices=[...new Set(callsToTry)].filter(s=>compact(s).startsWith(compact(prefix))&&s!==value.slice(start,end)&&value.length-end+start+s.length<=input.maxLength);
    choices.forEach((choice,i)=>{
      const b=document.createElement('button');b.type='button';b.tabIndex=-1;b.textContent=choice;
      b.onpointerdown=e=>e.preventDefault();b.onclick=()=>accept(i);list.append(b)
    });
    paint()
  }
  function paint(){
    ghost.replaceChildren();
    [...list.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===active)));
    if(!choices.length||input.selectionStart!==input.value.length)return;
    const typed=input.value.slice(start),suggested=choices[active];
    if(!suggested.startsWith(typed))return;
    const spacer=document.createElement('span');spacer.textContent=input.value;
    ghost.append(spacer,document.createTextNode(suggested.slice(typed.length)));ghost.scrollLeft=input.scrollLeft
  }
  function accept(i){
    if(!choices[i])return;
    input.setRangeText(choices[i],start,end,'end');input.focus();clear()
  }
  input.addEventListener('input',e=>{if(e.isComposing)clear();else refresh()});
  input.addEventListener('compositionend',refresh);
  input.addEventListener('click',refresh);
  input.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))refresh()});
  input.addEventListener('blur',clear);
  input.addEventListener('scroll',()=>ghost.scrollLeft=input.scrollLeft);
  $('form').addEventListener('submit',clear);
  input.addEventListener('keydown',e=>{
    if(input.selectionStart!==input.selectionEnd){clear();return}
    if(!choices.length||e.isComposing||e.shiftKey||e.metaKey||e.altKey||e.ctrlKey)return;
    if(e.key==='Tab'){e.preventDefault();accept(active)}
    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;paint()}
    else if(e.key==='Escape'){e.preventDefault();clear()}
  })
})();
