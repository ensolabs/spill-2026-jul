'use strict';
const AdventAccess=(()=>{
  const storageKey='enso.advent.2026.open';
  const oslo=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Oslo',year:'numeric',month:'2-digit',day:'2-digit'});
  const today=()=>oslo.format(new Date());
  const date=day=>'2026-12-'+String(day).padStart(2,'0');
  function unlocked(){try{return localStorage.getItem(storageKey)==='yes'}catch{return false}}
  function open(day){return unlocked()||today()>=date(day)}
  function unlock(code){
    if(code!=='2412')return false;
    localStorage.setItem(storageKey,'yes');
    return true;
  }
  const script=document.currentScript;
  if(script.dataset.day&&!open(Number(script.dataset.day))){
    document.documentElement.hidden=true;
    location.replace(new URL('../index.html',script.src));
  }
  return {today,date,open,unlock,storageKey};
})();
