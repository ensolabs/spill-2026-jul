'use strict';
const RackCPU=(()=>{
  const mask=15,bits=n=>n.toString(2).padStart(4,'0');
  const jobs=[
    {title:'Loopback',place:'Beacon uplink',brief:'The receiver is listening. Copy every input word to the output port.',hint:'IN reads the switches into A. Put OUT on the next line to latch A at the output.',sample:10,draft:'IN\n; send A to the output',goal:n=>n},
    {title:'Active low',place:'Frost alarm',brief:'The alarm lines are wired active-low. Flip all four bits before sending the word.',hint:'NOT flips every bit in A. Keep it between the read and the write.',sample:3,draft:'IN\n; invert the signal\nOUT',goal:n=>(~n)&mask},
    {title:'Channel select',place:'Snow gauge',brief:'Pass the two middle sensor lines through. Force the outer two bits to zero.',hint:'AND keeps only positions where the mask contains a 1. Write the mask as four binary digits.',sample:13,draft:'IN\n; isolate the middle pair\nOUT',goal:n=>n&6},
    {title:'Crossed wires',place:'Antenna drive',brief:'Rotate the word one bit to the left, wrapping the high bit to the low end. Then invert only the lowest bit.',hint:'ROL wraps the bit that falls off the left edge. XOR toggles positions selected by its mask.',sample:9,draft:'IN\n; repair the pin order\nOUT',goal:n=>(((n<<1)|(n>>3))&mask)^1},
    {title:'Edge detector',place:'Aurora recorder',brief:'Output a 1 wherever a sensor changed since the previous reading. Compare the first reading with 0000.',hint:'XOR M compares A with the remembered word. After OUT, read IN again and STO it for the next scan.',sample:10,draft:'IN\n; compare with the last sample\nOUT\n; remember this sample',goal:(n,prev)=>n^prev,history:true}
  ];
  function compile(source){
    const code=[];
    for(const [i,line] of source.split('\n').entries()){
      const text=line.split(';')[0].trim().toUpperCase();if(!text)continue;
      if(!/^(IN|OUT|NOT|ROL|STO|(?:AND|XOR) (?:[01]{4}|M))$/.test(text.replace(/\s+/g,' ')))throw Error('Line '+(i+1)+' · unknown instruction or operand. See instruction set.');
      const [op,arg]=text.split(/\s+/);code.push({op,arg,line:i+1,text});
    }
    if(!code.length)throw Error('Enter at least one instruction.');
    if(code.length>8)throw Error('The board holds eight instructions. Comments take no space.');
    return code;
  }
  const boot=()=>({a:0,m:0,out:0,wrote:false});
  function execute(cpu,ins,input){
    const value=ins.arg==='M'?cpu.m:parseInt(ins.arg,2);
    switch(ins.op){
      case 'IN': cpu.a=input;break;
      case 'OUT':cpu.out=cpu.a;cpu.wrote=true;break;
      case 'NOT':cpu.a^=mask;break;
      case 'AND':cpu.a&=value;break;
      case 'XOR':cpu.a^=value;break;
      case 'ROL':cpu.a=((cpu.a<<1)|(cpu.a>>3))&mask;break;
      case 'STO':cpu.m=cpu.a;break;
    }
  }
  function scan(cpu,code,input){
    cpu.wrote=false;const trace=[];
    for(const ins of code){execute(cpu,ins,input);trace.push({...cpu,ins,input})}
    return trace;
  }
  function verify(job,code){
    // Start each independent test at power-on. The edge detector then runs two
    // more scans, including a repeated input, without clearing its registers.
    let passed=0;
    for(let first=0;first<16;first++)for(let next=0;next<(job.history?16:1);next++){
      const cpu=boot(),sequence=job.history?[first,next,next]:[first];let prev=0;
      for(const input of sequence){const initial={...cpu},trace=scan(cpu,code,input),expected=job.goal(input,prev);
        if(!cpu.wrote||cpu.out!==expected)return {ok:false,input,prev,initial,trace,expected,passed};
        prev=input;
      }passed++;
    }
    return {ok:true,passed};
  }
  return {jobs,bits,boot,compile,execute,scan,verify};
})();
