(()=>{
const WALL_BONUS={gokturk:.04,selcuk:.035,hun:.03};

const COMMON={
  mancinik:{id:"mancinik",name:"Mancınık",attack:90,infDef:45,cavDef:130,speed:50,carry:0,type:"siege",sheet:"gokturk",sprite:7},
  topcu:{id:"topcu",name:"Topçu",attack:160,infDef:55,cavDef:150,speed:60,carry:0,type:"siege",sheet:"gokturk",sprite:8},
  casus:{id:"casus",name:"Casus",attack:10,infDef:10,cavDef:10,speed:300,carry:0,type:"scout",sheet:"gokturk",sprite:9}
};

const NATIONS={
  gokturk:[
    {id:"karabudun",name:"Karabudun",attack:20,infDef:30,cavDef:15,speed:120,carry:30,type:"infantry",sheet:"gokturk",sprite:0},
    {id:"kemankes",name:"Kemankeş",attack:25,infDef:100,cavDef:30,speed:140,carry:30,type:"archer",sheet:"gokturk",sprite:1},
    {id:"tapukci",name:"Tapukçı",attack:10,infDef:20,cavDef:150,speed:100,carry:60,type:"infantry",sheet:"gokturk",sprite:2},
    {id:"mavi-kurt",name:"Mavi Kurt",attack:100,infDef:80,cavDef:40,speed:130,carry:60,type:"infantry",sheet:"gokturk",sprite:3},
    {id:"muhafiz",name:"Muhafız",attack:40,infDef:140,cavDef:50,speed:150,carry:40,type:"cavalry",sheet:"gokturk",sprite:4},
    {id:"mavi-atli",name:"Mavi Atlı",attack:110,infDef:50,cavDef:50,speed:200,carry:100,type:"cavalry",sheet:"gokturk",sprite:5},
    {id:"kursad",name:"Kürşad",attack:150,infDef:110,cavDef:110,speed:180,carry:60,type:"cavalry",sheet:"gokturk",sprite:6},
    COMMON.mancinik,COMMON.topcu,COMMON.casus
  ],
  selcuk:[
    {id:"gulam",name:"Gulam",attack:15,infDef:20,cavDef:10,speed:115,carry:30,type:"infantry",sheet:"selcuk",sprite:0},
    {id:"kemankes",name:"Kemankeş",attack:25,infDef:90,cavDef:15,speed:135,carry:30,type:"archer",sheet:"selcuk",sprite:1},
    {id:"selcuk",name:"Selçuk",attack:40,infDef:20,cavDef:90,speed:105,carry:40,type:"infantry",sheet:"selcuk",sprite:2},
    {id:"alparslan",name:"Alparslan",attack:115,infDef:55,cavDef:55,speed:125,carry:50,type:"infantry",sheet:"selcuk",sprite:3},
    {id:"kargili",name:"Kargılı",attack:20,infDef:50,cavDef:140,speed:160,carry:80,type:"cavalry",sheet:"selcuk",sprite:4},
    {id:"atli-okcu",name:"Atlı Okçu",attack:60,infDef:120,cavDef:20,speed:225,carry:80,type:"cavalry",sheet:"selcuk",sprite:5},
    {id:"sipahi",name:"Sipahi",attack:160,infDef:90,cavDef:90,speed:175,carry:90,type:"cavalry",sheet:"selcuk",sprite:6},
    COMMON.mancinik,COMMON.topcu,COMMON.casus
  ],
  hun:[
    {id:"toygun",name:"Toygun",attack:25,infDef:25,cavDef:25,speed:125,carry:60,type:"infantry",sheet:"hun",sprite:0},
    {id:"kemankes",name:"Kemankeş",attack:30,infDef:80,cavDef:15,speed:145,carry:40,type:"archer",sheet:"hun",sprite:1},
    {id:"tarik",name:"Tarık",attack:30,infDef:30,cavDef:90,speed:110,carry:40,type:"infantry",sheet:"hun",sprite:2},
    {id:"barlas",name:"Barlas",attack:130,infDef:50,cavDef:70,speed:135,carry:80,type:"infantry",sheet:"hun",sprite:3},
    {id:"tunga",name:"Tunga",attack:50,infDef:50,cavDef:110,speed:175,carry:40,type:"cavalry",sheet:"hun",sprite:4},
    {id:"talakan",name:"Talakan",attack:120,infDef:110,cavDef:20,speed:230,carry:120,type:"cavalry",sheet:"hun",sprite:5},
    {id:"tarkan",name:"Tarkan",attack:190,infDef:70,cavDef:70,speed:195,carry:100,type:"cavalry",sheet:"hun",sprite:6},
    COMMON.mancinik,COMMON.topcu,COMMON.casus
  ]
};

const $=id=>document.getElementById(id);
const atkHost=$("attackerUnits"),defHost=$("defenderUnits");
const atkNation=$("attackerNation"),defNation=$("defenderNation");
const wallLevel=$("wallLevel");
if(!atkHost||!defHost||!atkNation||!defNation||!wallLevel)return;

document.documentElement.style.setProperty("--sprite-selcuk",'url("assets/selcuk-units.jpg")');
document.documentElement.style.setProperty("--sprite-hun",'url("assets/hun-units.jpg")');
fetch("assets/units.b64.txt")
  .then(r=>{if(!r.ok)throw new Error("asset");return r.text()})
  .then(b64=>document.documentElement.style.setProperty("--sprite-gokturk",'url("data:image/webp;base64,'+b64.trim()+'")'))
  .catch(()=>{});

const clamp=(v,min=0,max=999999999)=>{
  const n=parseInt(String(v).replace(/[^0-9-]/g,""),10);
  return Number.isFinite(n)?Math.min(max,Math.max(min,n)):min
};

const unitsFor=nation=>NATIONS[nation]||NATIONS.gokturk;

function spriteStyle(unit){
  const cols=unit.sheet==="gokturk"?5:4;
  const rows=2;
  const x=unit.sprite%cols;
  const y=Math.floor(unit.sprite/cols);
  return {
    image:"var(--sprite-"+unit.sheet+")",
    size:(cols*100)+"% "+(rows*100)+"%",
    posX:cols===1?"0%":((x/(cols-1))*100)+"%",
    posY:rows===1?"0%":((y/(rows-1))*100)+"%"
  };
}

function card(unit,side){
  const a=document.createElement("article");
  a.className="unit-card";
  const art=document.createElement("div");
  art.className="unit-art";
  art.setAttribute("role","img");
  art.setAttribute("aria-label",unit.name);
  const s=spriteStyle(unit);
  art.style.backgroundImage=s.image;
  art.style.backgroundSize=s.size;
  art.style.backgroundPosition=s.posX+" "+s.posY;
  art.style.aspectRatio=unit.sheet==="gokturk"?"2 / 3":"8 / 11";
  const n=document.createElement("div");
  n.className="unit-name";
  n.textContent=unit.name;
  const input=document.createElement("input");
  input.type="number";
  input.min="0";
  input.step="1";
  input.value="0";
  input.inputMode="numeric";
  input.dataset.side=side;
  input.dataset.unit=unit.id;
  input.setAttribute("aria-label",(side==="attacker"?"Saldıran ":"Savunan ")+unit.name+" adedi");
  input.addEventListener("change",()=>input.value=clamp(input.value));
  a.append(art,n,input);
  return a
}

function renderUnits(side){
  const nation=side==="attacker"?atkNation.value:defNation.value;
  const host=side==="attacker"?atkHost:defHost;
  host.innerHTML="";
  unitsFor(nation).forEach(u=>host.appendChild(card(u,side)));
}

atkNation.addEventListener("change",()=>renderUnits("attacker"));
defNation.addEventListener("change",()=>renderUnits("defender"));

function army(side,nation){
  const counts={};
  let total=0;
  document.querySelectorAll('input[data-side="'+side+'"]').forEach(i=>{
    const v=clamp(i.value);
    i.value=v;
    counts[i.dataset.unit]=v;
    total+=v;
  });
  return{nation,units:unitsFor(nation),counts,total}
}

function cavalryRatio(a){
  if(!a.total)return 0;
  return a.units.reduce((sum,u)=>sum+(u.type==="cavalry"?(a.counts[u.id]||0):0),0)/a.total
}

function attackPower(a){
  let power=a.units.reduce((sum,u)=>sum+(a.counts[u.id]||0)*u.attack,0);
  const kem=a.units.find(u=>u.id==="kemankes");
  if(kem){
    const kemCount=a.counts.kemankes||0;
    const foot=a.units
      .filter(u=>u.type==="infantry")
      .reduce((sum,u)=>sum+(a.counts[u.id]||0),0);
    power+=Math.min(kemCount,foot)*kem.attack;
  }
  return power
}

function defensePower(d,a,wall){
  const r=cavalryRatio(a);
  let power=d.units.reduce((sum,u)=>{
    const effective=u.infDef*(1-r)+u.cavDef*r;
    return sum+(d.counts[u.id]||0)*effective;
  },0);
  let numberBonus=0;
  if(a.total&&d.total>a.total)numberBonus=Math.min(.20,((d.total/a.total)-1)*.10);
  const wallPerLevel=WALL_BONUS[d.nation]??WALL_BONUS.gokturk;
  return power*(1+wallPerLevel*wall)*(1+numberBonus)
}

function typeMult(u,side){
  if(side==="attacker"){
    if(u.type==="siege")return 1.5;
    if(u.id==="kemankes")return 1.15;
    if(u.type==="cavalry")return .85;
    return 1
  }
  if(u.type==="siege")return 1.25;
  if(u.type==="cavalry")return .9;
  return 1
}

function distribute(a,e,totalLoss,side){
  const out={};
  a.units.forEach(u=>out[u.id]=0);
  if(totalLoss<=0||a.total<=0)return out;
  if(totalLoss>=a.total){
    a.units.forEach(u=>out[u.id]=a.counts[u.id]||0);
    return out
  }
  const enemyCav=cavalryRatio(e);
  const rows=a.units.map(u=>{
    const count=a.counts[u.id]||0;
    const defense=Math.max(1,u.infDef*(1-enemyCav)+u.cavDef*enemyCav);
    return{id:u.id,count,weight:count*(typeMult(u,side)/defense)}
  });
  const totalWeight=rows.reduce((sum,x)=>sum+x.weight,0);
  if(!totalWeight)return out;
  let assigned=0;
  const remainder=[];
  rows.forEach(x=>{
    const exact=totalLoss*(x.weight/totalWeight);
    const base=Math.min(x.count,Math.floor(exact));
    out[x.id]=base;
    assigned+=base;
    remainder.push({id:x.id,cap:x.count,r:exact-Math.floor(exact)})
  });
  remainder.sort((a,b)=>b.r-a.r);
  while(assigned<totalLoss){
    let moved=false;
    for(const x of remainder){
      if(assigned>=totalLoss)break;
      if(out[x.id]<x.cap){
        out[x.id]++;
        assigned++;
        moved=true
      }
    }
    if(!moved)break
  }
  return out
}

const fmt=n=>new Intl.NumberFormat("tr-TR").format(n);

function render(id,a,losses){
  const host=$(id);
  host.innerHTML="";
  const active=a.units.filter(u=>(a.counts[u.id]||0)>0);
  if(!active.length){
    const e=document.createElement("div");
    e.className="result-row empty";
    e.textContent="Asker girilmedi.";
    host.appendChild(e);
    return
  }
  const head=document.createElement("div");
  head.className="result-row header";
  ["Birim","Başlangıç","Ölen","Kalan"].forEach(t=>{
    const s=document.createElement("span");s.textContent=t;head.appendChild(s)
  });
  host.appendChild(head);
  active.forEach(u=>{
    const start=a.counts[u.id]||0;
    const dead=losses[u.id]||0;
    const row=document.createElement("div");
    row.className="result-row";
    [u.name,fmt(start),fmt(dead),fmt(start-dead)].forEach(t=>{
      const s=document.createElement("span");s.textContent=t;row.appendChild(s)
    });
    host.appendChild(row)
  })
}

$("simulateButton").addEventListener("click",()=>{
  const a=army("attacker",atkNation.value);
  const d=army("defender",defNation.value);
  const wall=clamp(wallLevel.value,0,10);
  wallLevel.value=String(wall);
  if(!a.total||!d.total){
    $("validationMessage").textContent="İki tarafa da en az bir asker girmen gerekiyor.";
    $("winnerText").textContent="İki tarafa da en az bir asker gir.";
    render("attackerResults",a,{});
    render("defenderResults",d,{});
    return
  }
  $("validationMessage").textContent="";
  const atkPower=attackPower(a);
  const defPower=defensePower(d,a,wall);
  const attackerWon=atkPower>defPower;
  const strong=Math.max(atkPower,defPower);
  const weak=Math.min(atkPower,defPower);
  const base=(weak**1.2)/((weak**1.2)+(strong**1.2));
  const winnerLossRate=Math.min(.90,Math.max(0,base*1.8));
  const attackerLoss=attackerWon?Math.round(a.total*winnerLossRate):a.total;
  const defenderLoss=attackerWon?d.total:Math.round(d.total*winnerLossRate);
  $("winnerText").textContent=attackerWon?"SALDIRAN KAZANDI":"SAVUNAN KAZANDI";
  render("attackerResults",a,distribute(a,d,attackerLoss,"attacker"));
  render("defenderResults",d,distribute(d,a,defenderLoss,"defender"));
  $("results").scrollIntoView({behavior:"smooth",block:"start"})
});

renderUnits("attacker");
renderUnits("defender");
render("attackerResults",{units:unitsFor("gokturk"),counts:{},total:0},{});
render("defenderResults",{units:unitsFor("gokturk"),counts:{},total:0},{});
})();