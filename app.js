(()=>{
const WALL_BONUS={gokturk:.04,selcuk:.035,hun:.03};
const NATION_LABEL={gokturk:"Göktürk",selcuk:"Selçuk",hun:"Hun"};
const COMMON={
  mancinik:{id:"mancinik",name:"Mancınık",attack:90,infDef:45,cavDef:130,type:"siege",sprite:"gokturk",pos:"50% 100%"},
  topcu:{id:"topcu",name:"Topçu",attack:160,infDef:55,cavDef:150,type:"siege",sprite:"gokturk",pos:"75% 100%"},
  casus:{id:"casus",name:"Casus",attack:10,infDef:10,cavDef:10,type:"scout",sprite:"gokturk",pos:"100% 100%"}
};
const NATIONS={
  gokturk:[
    {id:"karabudun",name:"Karabudun",attack:20,infDef:30,cavDef:15,type:"infantry",sprite:"gokturk",pos:"0 0"},
    {id:"kemankes",name:"Kemankeş",attack:25,infDef:100,cavDef:30,type:"archer",sprite:"gokturk",pos:"25% 0"},
    {id:"tapukci",name:"Tapukçı",attack:10,infDef:20,cavDef:150,type:"infantry",sprite:"gokturk",pos:"50% 0"},
    {id:"mavi-kurt",name:"Mavi Kurt",attack:100,infDef:80,cavDef:40,type:"infantry",sprite:"gokturk",pos:"75% 0"},
    {id:"muhafiz",name:"Muhafız",attack:40,infDef:140,cavDef:50,type:"cavalry",sprite:"gokturk",pos:"100% 0"},
    {id:"mavi-atli",name:"Mavi Atlı",attack:110,infDef:50,cavDef:50,type:"cavalry",sprite:"gokturk",pos:"0 100%"},
    {id:"kursad",name:"Kürşad",attack:150,infDef:110,cavDef:110,type:"cavalry",sprite:"gokturk",pos:"25% 100%"},
    COMMON.mancinik,COMMON.topcu,COMMON.casus
  ],
  selcuk:[
    {id:"gulam",name:"Gulam",attack:15,infDef:20,cavDef:10,type:"infantry",sprite:"selcuk",pos:"0 0"},
    {id:"kemankes",name:"Kemankeş",attack:25,infDef:90,cavDef:15,type:"archer",sprite:"selcuk",pos:"33.333% 0"},
    {id:"selcuk",name:"Selçuk",attack:40,infDef:20,cavDef:90,type:"infantry",sprite:"selcuk",pos:"66.666% 0"},
    {id:"alparslan",name:"Alparslan",attack:115,infDef:55,cavDef:55,type:"infantry",sprite:"selcuk",pos:"100% 0"},
    {id:"kargili",name:"Kargılı",attack:20,infDef:50,cavDef:140,type:"cavalry",sprite:"selcuk",pos:"0 100%"},
    {id:"atli-okcu",name:"Atlı Okçu",attack:60,infDef:120,cavDef:20,type:"cavalry",sprite:"selcuk",pos:"33.333% 100%"},
    {id:"sipahi",name:"Sipahi",attack:160,infDef:90,cavDef:90,type:"cavalry",sprite:"selcuk",pos:"66.666% 100%"},
    COMMON.mancinik,COMMON.topcu,COMMON.casus
  ],
  hun:[
    {id:"toygun",name:"Toygun",attack:25,infDef:25,cavDef:25,type:"infantry",sprite:"hun",pos:"0 0"},
    {id:"kemankes",name:"Kemankeş",attack:30,infDef:80,cavDef:15,type:"archer",sprite:"hun",pos:"33.333% 0"},
    {id:"tarik",name:"Tarık",attack:30,infDef:30,cavDef:90,type:"infantry",sprite:"hun",pos:"66.666% 0"},
    {id:"barlas",name:"Barlas",attack:130,infDef:50,cavDef:70,type:"infantry",sprite:"hun",pos:"100% 0"},
    {id:"tunga",name:"Tunga",attack:50,infDef:50,cavDef:110,type:"cavalry",sprite:"hun",pos:"0 100%"},
    {id:"talakan",name:"Talakan",attack:120,infDef:110,cavDef:20,type:"cavalry",sprite:"hun",pos:"33.333% 100%"},
    {id:"tarkan",name:"Tarkan",attack:190,infDef:70,cavDef:70,type:"cavalry",sprite:"hun",pos:"66.666% 100%"},
    COMMON.mancinik,COMMON.topcu,COMMON.casus
  ]
};
const $=id=>document.getElementById(id);
const atkHost=$("attackerUnits"),defHost=$("defenderUnits"),atkNation=$("attackerNation"),defNation=$("defenderNation");
if(!atkHost||!defHost||!atkNation||!defNation)return;

fetch("assets/units.b64.txt")
  .then(r=>{if(!r.ok)throw new Error("asset");return r.text()})
  .then(b64=>document.documentElement.style.setProperty("--gokturk-sprite",'url("data:image/webp;base64,'+b64.trim()+'")'))
  .catch(()=>{});

const clamp=(v,min=0,max=999999999)=>{
  const n=parseInt(String(v).replace(/[^0-9-]/g,""),10);
  return Number.isFinite(n)?Math.min(max,Math.max(min,n)):min;
};
const unitsFor=nation=>NATIONS[nation]||NATIONS.gokturk;

function card(u,side){
  const a=document.createElement("article");a.className="unit-card";
  const art=document.createElement("div");
  art.className="unit-art sprite-"+u.sprite;
  art.style.backgroundPosition=u.pos;
  art.setAttribute("role","img");
  art.setAttribute("aria-label",u.name);
  const n=document.createElement("div");n.className="unit-name";n.textContent=u.name;
  const input=document.createElement("input");
  input.type="number";input.min="0";input.step="1";input.value="0";input.inputMode="numeric";
  input.dataset.side=side;input.dataset.unit=u.id;
  input.setAttribute("aria-label",(side==="attacker"?"Saldıran ":"Savunan ")+u.name+" adedi");
  input.addEventListener("change",()=>input.value=clamp(input.value));
  a.append(art,n,input);return a;
}
function renderUnits(host,nation,side){
  host.innerHTML="";
  unitsFor(nation).forEach(u=>host.appendChild(card(u,side)));
}
function redraw(){
  renderUnits(atkHost,atkNation.value,"attacker");
  renderUnits(defHost,defNation.value,"defender");
  clearResults();
}
atkNation.addEventListener("change",redraw);
defNation.addEventListener("change",redraw);

function army(side,nation){
  const counts={};let total=0;
  document.querySelectorAll('input[data-side="'+side+'"]').forEach(i=>{
    const v=clamp(i.value);i.value=v;counts[i.dataset.unit]=v;total+=v;
  });
  return{nation,units:unitsFor(nation),counts,total};
}
function cavalryRatio(a){
  if(!a.total)return 0;
  let c=0;a.units.forEach(u=>{if(u.type==="cavalry")c+=a.counts[u.id]||0});
  return c/a.total;
}
function attackPower(a){
  let p=0;
  a.units.forEach(u=>p+=(a.counts[u.id]||0)*u.attack);
  const k=a.units.find(u=>u.id==="kemankes");
  if(k){
    const kCount=a.counts.kemankes||0;
    const foot=a.units.filter(u=>u.type==="infantry").reduce((s,u)=>s+(a.counts[u.id]||0),0);
    p+=Math.min(kCount,foot)*k.attack;
  }
  return p;
}
function defensePower(d,a,wall){
  const r=cavalryRatio(a);let p=0;
  d.units.forEach(u=>{
    const effective=u.infDef*(1-r)+u.cavDef*r;
    p+=(d.counts[u.id]||0)*effective;
  });
  let numberBonus=0;
  if(a.total&&d.total>a.total)numberBonus=Math.min(.20,((d.total/a.total)-1)*.10);
  const wallPerLevel=WALL_BONUS[d.nation]??WALL_BONUS.gokturk;
  return p*(1+wallPerLevel*wall)*(1+numberBonus);
}
function typeMult(u,side){
  if(side==="attacker"){
    if(u.type==="siege")return 1.5;
    if(u.id==="kemankes")return 1.15;
    if(u.type==="cavalry")return .85;
    return 1;
  }
  if(u.type==="siege")return 1.25;
  if(u.type==="cavalry")return .9;
  return 1;
}
function distribute(a,e,totalLoss,side){
  const out={};a.units.forEach(u=>out[u.id]=0);
  if(totalLoss<=0||a.total<=0)return out;
  if(totalLoss>=a.total){a.units.forEach(u=>out[u.id]=a.counts[u.id]||0);return out}
  const enemyCav=cavalryRatio(e);
  const rows=a.units.map(u=>{
    const count=a.counts[u.id]||0;
    const defense=Math.max(1,u.infDef*(1-enemyCav)+u.cavDef*enemyCav);
    return{id:u.id,count,weight:count*(typeMult(u,side)/defense)};
  });
  const totalWeight=rows.reduce((s,x)=>s+x.weight,0);
  if(totalWeight<=0)return out;
  let assigned=0;const remainder=[];
  rows.forEach(x=>{
    const exact=totalLoss*(x.weight/totalWeight);
    const base=Math.min(x.count,Math.floor(exact));
    out[x.id]=base;assigned+=base;
    remainder.push({id:x.id,cap:x.count,r:exact-Math.floor(exact)});
  });
  remainder.sort((a,b)=>b.r-a.r);
  while(assigned<totalLoss){
    let moved=false;
    for(const x of remainder){
      if(assigned>=totalLoss)break;
      if(out[x.id]<x.cap){out[x.id]++;assigned++;moved=true}
    }
    if(!moved)break;
  }
  return out;
}
const fmt=n=>new Intl.NumberFormat("tr-TR").format(n);
function render(id,a,losses){
  const h=$(id);h.innerHTML="";
  const active=a.units.filter(u=>(a.counts[u.id]||0)>0);
  if(!active.length){
    const e=document.createElement("div");e.className="result-row empty";e.textContent="Asker girilmedi.";h.appendChild(e);return;
  }
  const hd=document.createElement("div");hd.className="result-row header";
  ["Birim","Başlangıç","Ölen","Kalan"].forEach(t=>{const s=document.createElement("span");s.textContent=t;hd.appendChild(s)});
  h.appendChild(hd);
  active.forEach(u=>{
    const start=a.counts[u.id]||0,dead=losses[u.id]||0,row=document.createElement("div");row.className="result-row";
    [u.name,fmt(start),fmt(dead),fmt(start-dead)].forEach(t=>{const s=document.createElement("span");s.textContent=t;row.appendChild(s)});
    h.appendChild(row);
  });
}
function emptyArmy(nation){return{nation,units:unitsFor(nation),counts:{},total:0}}
function clearResults(){
  $("validationMessage").textContent="";
  $("winnerText").textContent="İki tarafa da en az bir asker gir.";
  render("attackerResults",emptyArmy(atkNation.value),{});
  render("defenderResults",emptyArmy(defNation.value),{});
}
$("simulateButton").addEventListener("click",()=>{
  const a=army("attacker",atkNation.value),d=army("defender",defNation.value);
  const wall=clamp($("wallLevel").value,0,20);$("wallLevel").value=wall;
  if(!a.total||!d.total){
    $("validationMessage").textContent="İki tarafa da en az bir asker girmen gerekiyor.";
    $("winnerText").textContent="İki tarafa da en az bir asker gir.";
    render("attackerResults",a,{});render("defenderResults",d,{});return;
  }
  $("validationMessage").textContent="";
  const ap=attackPower(a),dp=defensePower(d,a,wall),attackerWins=ap>dp;
  const strong=Math.max(ap,dp),weak=Math.min(ap,dp);
  const base=(weak**1.2)/((weak**1.2)+(strong**1.2));
  const winnerLossRate=Math.min(.90,Math.max(0,base*1.8));
  const attackerLoss=attackerWins?Math.round(a.total*winnerLossRate):a.total;
  const defenderLoss=attackerWins?d.total:Math.round(d.total*winnerLossRate);
  $("winnerText").textContent=attackerWins
    ?"SALDIRAN KAZANDI · "+NATION_LABEL[a.nation]
    :"SAVUNAN KAZANDI · "+NATION_LABEL[d.nation];
  render("attackerResults",a,distribute(a,d,attackerLoss,"attacker"));
  render("defenderResults",d,distribute(d,a,defenderLoss,"defender"));
  $("results").scrollIntoView({behavior:"smooth",block:"start"});
});
redraw();
})();