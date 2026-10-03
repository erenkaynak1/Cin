(()=>{
const RULESET={
  id:"targun-2026-10-02",
  wallBonus:{gokturk:.04,selcuk:.035,hun:.03},
  nationDefenseMultiplier:{gokturk:1,selcuk:1,hun:1},
  nationDefenseKnown:false,
  lossAnchors:[[1,.95],[2,.35],[3,.19],[5,.09],[10,.03],[20,.01]],
  raidIncluded:false,
  archerCombo:false,
  numericalSuperiorityBonus:false
};
const WALL_BONUS=RULESET.wallBonus;

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

const NATION_LABEL={gokturk:"Göktürk",selcuk:"Selçuk",hun:"Hun"};
const $=id=>document.getElementById(id);
const atkHost=$("attackerUnits"),defHost=$("defenderUnits");
const atkNation=$("attackerNation"),defNation=$("defenderNation"),defTroopNation=$("defenderTroopNation");
const wallLevel=$("wallLevel");
if(!atkHost||!defHost||!atkNation||!defNation||!defTroopNation||!wallLevel)return;

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
const unitFor=(nation,id)=>unitsFor(nation).find(u=>u.id===id)||null;
const troopKey=(nation,id)=>nation+":"+id;
const countsState={attacker:{},defender:{}};

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

function card(unit,side,nation){
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
  input.inputMode="numeric";
  input.dataset.side=side;
  input.dataset.unit=unit.id;
  input.dataset.nation=nation;
  const key=troopKey(nation,unit.id);
  input.value=String(countsState[side][key]||0);
  input.setAttribute("aria-label",(side==="attacker"?"Saldıran ":"Savunan ")+NATION_LABEL[nation]+" "+unit.name+" adedi");
  input.addEventListener("focus",()=>{if(input.value==="0")input.value=""});
  input.addEventListener("input",()=>{
    const value=clamp(input.value);
    countsState[side][key]=value;
    if(side==="defender")updateMixSummary();
  });
  input.addEventListener("blur",()=>{
    if(input.value.trim()==="")input.value="0";
    else input.value=clamp(input.value);
    countsState[side][key]=clamp(input.value);
    if(side==="defender")updateMixSummary();
  });
  input.addEventListener("change",()=>{
    input.value=clamp(input.value);
    countsState[side][key]=clamp(input.value);
    if(side==="defender")updateMixSummary();
  });
  a.append(art,n,input);
  return a
}

function renderUnits(side){
  const nation=side==="attacker"?atkNation.value:defTroopNation.value;
  const host=side==="attacker"?atkHost:defHost;
  host.innerHTML="";
  unitsFor(nation).forEach(u=>host.appendChild(card(u,side,nation)));
}

function clearAttackerOtherNations(){
  const selected=atkNation.value;
  Object.keys(countsState.attacker).forEach(key=>{
    if(!key.startsWith(selected+":"))delete countsState.attacker[key];
  });
}

function updateMixSummary(){
  const nations=new Set();
  Object.entries(countsState.defender).forEach(([key,count])=>{
    if(count>0)nations.add(key.split(":")[0]);
  });
  const host=$("defenderMixSummary");
  if(!host)return;
  if(nations.size<=1){
    host.textContent="Savunma birlikleri "+(nations.size===1?NATION_LABEL[[...nations][0]]:"tek ulus")+" görünümünde.";
  }else{
    host.textContent="Karma savunma: "+[...nations].map(n=>NATION_LABEL[n]).join(" + ");
  }
}

atkNation.addEventListener("change",()=>{
  clearAttackerOtherNations();
  renderUnits("attacker");
});
defNation.addEventListener("change",()=>updateMixSummary());
defTroopNation.addEventListener("change",()=>renderUnits("defender"));

const OCR_CANONICAL=[
  {id:"karabudun",nations:["gokturk"],aliases:["karabudun"]},
  {id:"tapukci",nations:["gokturk"],aliases:["tapukci","tapukçi","tapukcı"]},
  {id:"mavi-kurt",nations:["gokturk"],aliases:["mavi kurt"]},
  {id:"muhafiz",nations:["gokturk"],aliases:["muhafiz","muhafız"]},
  {id:"mavi-atli",nations:["gokturk"],aliases:["mavi atli","mavi atlı"]},
  {id:"kursad",nations:["gokturk"],aliases:["kursad","kürsad","kürşad","kursat"]},
  {id:"gulam",nations:["selcuk"],aliases:["gulam"]},
  {id:"selcuk",nations:["selcuk"],aliases:["selcuk","selçuk"]},
  {id:"alparslan",nations:["selcuk"],aliases:["alparslan","alp arslan"]},
  {id:"kargili",nations:["selcuk"],aliases:["kargili","kargılı"]},
  {id:"atli-okcu",nations:["selcuk"],aliases:["atli okcu","atlı okçu","atli okçu"]},
  {id:"sipahi",nations:["selcuk"],aliases:["sipahi"]},
  {id:"toygun",nations:["hun"],aliases:["toygun"]},
  {id:"tarik",nations:["hun"],aliases:["tarik","tarık"]},
  {id:"barlas",nations:["hun"],aliases:["barlas"]},
  {id:"tunga",nations:["hun"],aliases:["tunga"]},
  {id:"talakan",nations:["hun"],aliases:["talakan"]},
  {id:"tarkan",nations:["hun"],aliases:["tarkan"]},
  {id:"kemankes",nations:["gokturk","selcuk","hun"],aliases:["kemankes","keman kes"]},
  {id:"mancinik",nations:["gokturk","selcuk","hun"],aliases:["mancinik","mancınık"]},
  {id:"topcu",nations:["gokturk","selcuk","hun"],aliases:["topcu","topçu"]},
  {id:"casus",nations:["gokturk","selcuk","hun"],aliases:["casus"]}
];

function normalizeOcr(text){
  return String(text||"")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g,"i").replace(/ş/g,"s").replace(/ç/g,"c")
    .replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o")
    .replace(/[|]/g," ").replace(/\s+/g," ").trim();
}
function regexSafe(value){
  const specials="\\^$.*+?()[]{}|";
  let out="";
  for(const ch of value)out+=specials.includes(ch)?"\\"+ch:ch;
  return out;
}
function parseCount(raw){
  const digits=String(raw||"").replace(/\D/g,"");
  if(!digits)return null;
  const value=Number(digits);
  return Number.isFinite(value)?value:null;
}
function dominantNationFromText(text,fallback){
  const norm=normalizeOcr(text);
  const score={gokturk:0,selcuk:0,hun:0};
  OCR_CANONICAL.forEach(item=>{
    if(item.nations.length!==1)return;
    if(item.aliases.some(a=>norm.includes(normalizeOcr(a))))score[item.nations[0]]++;
  });
  const ranked=Object.entries(score).sort((a,b)=>b[1]-a[1]);
  return ranked[0][1]>0?ranked[0][0]:fallback;
}
function parseMixedNamedCounts(text,ownerNation,excludeCasus){
  const norm=normalizeOcr(text);
  const marker=norm.indexOf("kesfedilen birlikler");
  const source=marker>=0?norm.slice(marker):norm;
  const dominant=dominantNationFromText(source,ownerNation);
  const entries=[];
  OCR_CANONICAL.forEach(item=>{
    if(excludeCasus&&item.id==="casus")return;
    let best=null;
    for(const aliasRaw of item.aliases){
      const alias=regexSafe(normalizeOcr(aliasRaw));
      const re=new RegExp(alias+"[\\s:,-]{0,20}(?:mevcut[\\s:,-]{0,14})?([0-9][0-9., ]{0,14})","i");
      const m=source.match(re);
      if(m){
        const value=parseCount(m[1]);
        if(value!==null){best=value;break}
      }
    }
    if(best===null)return;
    const nation=item.nations.length===1?item.nations[0]:dominant;
    entries.push({nation,id:item.id,count:best});
  });
  return entries;
}

function parseCityArmy(text,nation){
  const norm=normalizeOcr(text);
  let source=norm;
  const mapMarker=source.indexOf("haritaya don");
  if(mapMarker>=0)source=source.slice(mapMarker);
  const navMarkers=[" hediye "," giden "," rapor "," birlik "," canta "];
  let cut=source.length;
  navMarkers.forEach(m=>{const p=source.indexOf(m);if(p>0&&p<cut)cut=p});
  source=source.slice(0,cut);
  const entries=[];
  unitsFor(nation).forEach(unit=>{
    const aliases=OCR_CANONICAL.find(x=>x.id===unit.id)?.aliases||[unit.name];
    for(const aliasRaw of aliases){
      const alias=regexSafe(normalizeOcr(aliasRaw));
      const re=new RegExp(alias+"[\\s:,-]{0,20}([0-9][0-9., ]{0,14})","i");
      const m=source.match(re);
      if(m){
        const value=parseCount(m[1]);
        if(value!==null){entries.push({nation,id:unit.id,count:value});break}
      }
    }
  });
  return entries;
}

function fillEntries(side,entries,ownerNation){
  if(side==="attacker"){
    const nation=ownerNation||atkNation.value;
    atkNation.value=nation;
    countsState.attacker={};
    entries.filter(e=>e.nation===nation).forEach(e=>countsState.attacker[troopKey(e.nation,e.id)]=e.count);
    renderUnits("attacker");
    return;
  }
  countsState.defender={};
  entries.forEach(e=>{
    if(e.id==="casus")return;
    countsState.defender[troopKey(e.nation,e.id)]=e.count;
  });
  if(ownerNation)defNation.value=ownerNation;
  const nations=[...new Set(entries.filter(e=>e.id!=="casus").map(e=>e.nation))];
  defTroopNation.value=nations[0]||defNation.value;
  renderUnits("defender");
  updateMixSummary();
}

async function scanArmyImage(file,side){
  const status=$(side==="attacker"?"attackerScanStatus":"defenderScanStatus");
  if(!file)return;
  if(!window.Tesseract){
    status.textContent="Görsel okuyucu yüklenemedi.";
    status.classList.add("error");
    return;
  }
  status.classList.remove("error","success");
  status.textContent="Görsel okunuyor… %0";
  try{
    const result=await window.Tesseract.recognize(file,"tur+eng",{
      logger:m=>{
        if(m.status==="recognizing text"&&Number.isFinite(m.progress)){
          status.textContent="Görsel okunuyor… %"+Math.round(m.progress*100);
        }
      }
    });
    const text=result&&result.data?result.data.text||"":"";
    const norm=normalizeOcr(text);
    const isSpy=norm.includes("kesfedilen birlikler")||norm.includes("casuslama");
    const fallback=side==="attacker"?atkNation.value:defNation.value;
    // Casus raporunda görülen birliklerin ulusu şehir sahibinin ulusu değildir:
    // destek birlikleri farklı uluslardan gelebilir. Bu yüzden savunan şehir ulusunu
    // kullanıcının seçimi olarak koruyoruz; yalnızca birlik kartlarının ulusunu OCR'dan çıkarıyoruz.
    const owner=(isSpy&&side==="defender")?defNation.value:dominantNationFromText(text,fallback);
    const entries=isSpy
      ?parseMixedNamedCounts(text,owner,true)
      :parseCityArmy(text,owner);

    if(!entries.length){
      status.textContent="Asker sayısı okunamadı. Daha net/kırpılmış görsel dene.";
      status.classList.add("error");
      return;
    }
    fillEntries(side,entries,owner);
    status.textContent=isSpy
      ?entries.length+" savunma birliği dolduruldu · Casus atlandı."
      :entries.length+" birlik otomatik dolduruldu.";
    status.classList.add("success");
  }catch(err){
    status.textContent="Görsel okunurken hata oluştu.";
    status.classList.add("error");
  }
}

const attackerImage=$("attackerImage");
const defenderImage=$("defenderImage");
if(attackerImage)attackerImage.addEventListener("change",e=>{
  scanArmyImage(e.target.files&&e.target.files[0],"attacker");
  e.target.value="";
});
if(defenderImage)defenderImage.addEventListener("change",e=>{
  scanArmyImage(e.target.files&&e.target.files[0],"defender");
  e.target.value="";
});

function syncVisible(side){
  document.querySelectorAll('input[data-side="'+side+'"]').forEach(i=>{
    const value=clamp(i.value);
    i.value=value;
    countsState[side][troopKey(i.dataset.nation,i.dataset.unit)]=value;
  });
}
function makeTroopsFromState(side,ownerNation){
  syncVisible(side);
  const troops=[];
  Object.entries(countsState[side]).forEach(([key,count])=>{
    if(!count)return;
    const split=key.indexOf(":");
    const nation=key.slice(0,split),id=key.slice(split+1);
    const unit=unitFor(nation,id);
    if(unit)troops.push({key,nation,id,unit,count});
  });
  return {
    ownerNation,
    troops,
    total:troops.reduce((s,t)=>s+t.count,0)
  };
}
function attackerArmy(){
  clearAttackerOtherNations();
  return makeTroopsFromState("attacker",atkNation.value);
}
function defenderArmy(){
  return makeTroopsFromState("defender",defNation.value);
}
function cavalryRatio(a){
  if(!a.total)return 0;
  const cavalry=a.troops.reduce((sum,t)=>sum+(t.unit.type==="cavalry"?t.count:0),0);
  return cavalry/a.total
}
function attackPower(a){
  return a.troops.reduce((sum,t)=>sum+t.count*t.unit.attack,0)
}
function defensePower(d,a,wall){
  const r=cavalryRatio(a);
  const base=d.troops.reduce((sum,t)=>{
    const effective=t.unit.infDef*(1-r)+t.unit.cavDef*r;
    return sum+t.count*effective;
  },0);
  const wallPerLevel=WALL_BONUS[d.ownerNation]??WALL_BONUS.gokturk;
  const nationDefense=RULESET.nationDefenseMultiplier[d.ownerNation]??1;
  return base*(1+wallPerLevel*wall)*nationDefense
}
function winnerLossRate(powerRatio){
  const anchors=RULESET.lossAnchors;
  const r=Math.max(1,Number(powerRatio)||1);
  if(r<=1)return .95;
  for(let i=0;i<anchors.length-1;i++){
    const [r1,l1]=anchors[i], [r2,l2]=anchors[i+1];
    if(r<=r2){
      const t=(Math.log(r)-Math.log(r1))/(Math.log(r2)-Math.log(r1));
      return Math.exp(Math.log(l1)+t*(Math.log(l2)-Math.log(l1)));
    }
  }
  const [r1,l1]=anchors[anchors.length-2], [r2,l2]=anchors[anchors.length-1];
  const slope=(Math.log(l2)-Math.log(l1))/(Math.log(r2)-Math.log(r1));
  return Math.max(0,Math.exp(Math.log(l2)+slope*(Math.log(r)-Math.log(r2))))
}
function distributeByRatio(a,lossRate){
  const out={};
  const rate=Math.max(0,Math.min(1,lossRate));
  a.troops.forEach(t=>out[t.key]=rate>=1?t.count:Math.min(t.count,Math.round(t.count*rate)));
  return out
}

const fmt=n=>new Intl.NumberFormat("tr-TR").format(Math.round(n));
function render(id,a,losses){
  const host=$(id);
  host.innerHTML="";
  if(!a.troops.length){
    const e=document.createElement("div");
    e.className="report-empty";
    e.textContent="Asker girilmedi.";
    host.appendChild(e);
    return;
  }
  a.troops.forEach(t=>{
    const card=document.createElement("article");
    card.className="report-card";
    const art=document.createElement("div");
    art.className="report-art";
    art.setAttribute("role","img");
    art.setAttribute("aria-label",t.unit.name);
    const sprite=spriteStyle(t.unit);
    art.style.backgroundImage=sprite.image;
    art.style.backgroundSize=sprite.size;
    art.style.backgroundPosition=sprite.posX+" "+sprite.posY;
    art.style.aspectRatio=t.unit.sheet==="gokturk"?"2 / 3":"8 / 11";

    const name=document.createElement("div");
    name.className="report-name";
    name.textContent=t.unit.name+(a.troops.some(x=>x.id===t.id&&x.nation!==t.nation)?" · "+NATION_LABEL[t.nation]:"");

    const sent=document.createElement("div");
    sent.className="report-line";
    sent.append("Giden ");
    const s=document.createElement("strong");s.textContent=fmt(t.count);sent.appendChild(s);

    const dead=document.createElement("div");
    dead.className="report-line dead";
    dead.append("Ölen ");
    const d=document.createElement("strong");d.textContent=fmt(losses[t.key]||0);dead.appendChild(d);

    card.append(art,name,sent,dead);
    host.appendChild(card);
  });
}

$("simulateButton").addEventListener("click",()=>{
  const a=attackerArmy();
  const d=defenderArmy();
  const wall=clamp(wallLevel.value,0,10);
  wallLevel.value=String(wall);
  if(!a.total||!d.total){
    $("validationMessage").textContent="İki tarafa da en az bir asker girmen gerekiyor.";
    $("winnerText").textContent="İki tarafa da en az bir asker gir.";
    $("powerSummary").textContent="";
    render("attackerResults",a,{});
    render("defenderResults",d,{});
    return;
  }
  $("validationMessage").textContent="";
  const atkPower=attackPower(a);
  const defPower=defensePower(d,a,wall);
  const attackerWon=atkPower>defPower;
  const strong=Math.max(atkPower,defPower);
  const weak=Math.max(1,Math.min(atkPower,defPower));
  const ratio=strong/weak;
  const winLoss=winnerLossRate(ratio);
  const attackerLossRate=attackerWon?winLoss:1;
  const defenderLossRate=attackerWon?1:winLoss;

  $("winnerText").textContent=attackerWon?"SALDIRAN KAZANDI":"SAVUNAN KAZANDI";
  $("powerSummary").textContent=
    "Baz saldırı "+fmt(atkPower)+" · Baz savunma "+fmt(defPower)+" · Güç oranı "+ratio.toFixed(2)+"×";
  $("confidenceNote").textContent=RULESET.nationDefenseKnown
    ?"Targun "+RULESET.id.replace("targun-","")+" kuralları · yağma dahil değil."
    :"Targun "+RULESET.id.replace("targun-","")+" · yağma dahil değil · ayrı ulus savunma katsayısı kamuya açık olmadığı için 1,00 kabul edildi.";

  render("attackerResults",a,distributeByRatio(a,attackerLossRate));
  render("defenderResults",d,distributeByRatio(d,defenderLossRate));
  $("results").scrollIntoView({behavior:"smooth",block:"start"});
});

renderUnits("attacker");
renderUnits("defender");
updateMixSummary();
render("attackerResults",{troops:[],total:0},{});
render("defenderResults",{troops:[],total:0},{});
})();