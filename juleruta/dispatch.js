'use strict';
const Dispatch=(()=>{
  const pole={lat:90,lon:0},night=720,capacity=3;
  // A hub represents its whole delivery region; service includes all local flights.
  // Times are game minutes from launch, on the same workshop clock.
  const hubs=[
    {name:'Oceania & Antarctic stations',short:'Oceania',lat:-26,lon:146,open:0,dawn:180,service:64,save:19},
    {name:'East & Southeast Asia',short:'East Asia',lat:29,lon:114,open:20,dawn:242,service:88,save:41},
    {name:'South & Central Asia',short:'South Asia',lat:28,lon:73,open:90,dawn:341,service:90,save:38},
    {name:'Europe & West Asia',short:'Europe',lat:48,lon:22,open:170,dawn:430,service:78,save:29},
    {name:'Africa & Indian Ocean',short:'Africa',lat:2,lon:23,open:190,dawn:457,service:72,save:25},
    {name:'South America',short:'S. America',lat:-18,lon:-54,open:300,dawn:584,service:68,save:20},
    {name:'Central America & Caribbean',short:'Caribbean',lat:16,lon:-83,open:390,dawn:674,service:55,save:15},
    {name:'North America & Arctic',short:'N. America',lat:47,lon:-104,open:420,dawn:720,service:77,save:27}
  ];
  const inherited=[3,7,0,4,1,6,2,5],rad=Math.PI/180;
  function flight(a,b){
    const cosine=Math.sin(a.lat*rad)*Math.sin(b.lat*rad)+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.cos((b.lon-a.lon)*rad);
    return 5+Math.round(20*Math.acos(Math.max(-1,Math.min(1,cosine))));
  }
  function plan(order,packed){
    let time=0,from=pole;
    return order.map(id=>{
      const h=hubs[id],depart=time,arrive=time+flight(from,h),start=Math.max(arrive,h.open);
      time=start+h.service-(packed.has(id)?h.save:0);from=h;
      return {id,depart,arrive,start,end:time,ok:time<=h.dawn&&time<=night}
    })
  }
  const clock=m=>Math.floor(m/60).toString().padStart(2,'0')+':'+(m%60).toString().padStart(2,'0');
  return {pole,night,capacity,hubs,inherited,plan,clock}
})();
