(()=>{
const WALL_BONUS={gokturk:.04,selcuk:.035,hun:.03};
const LOSS_EXPONENT=1.148;
const CASUALTY_WEIGHT_BLEND=.01;

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
  input.addEventListener("focus",()=>{
    if(input.value==="0") input.value="";
  });
  input.addEventListener("blur",()=>{
    if(input.value.trim()==="") input.value="0";
    else input.value=clamp(input.value);
  });
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

const OCR_UNIT_NAMES=[
  {nation:"gokturk",id:"karabudun",aliases:["karabudun"]},
  {nation:"gokturk",id:"kemankes",aliases:["kemankes","keman kes"]},
  {nation:"gokturk",id:"tapukci",aliases:["tapukci","tapukçi","tapukcı"]},
  {nation:"gokturk",id:"mavi-kurt",aliases:["mavi kurt"]},
  {nation:"gokturk",id:"muhafiz",aliases:["muhafiz","muhafız"]},
  {nation:"gokturk",id:"mavi-atli",aliases:["mavi atli","mavi atlı"]},
  {nation:"gokturk",id:"kursad",aliases:["kursad","kürsad","kürşad","kursat"]},
  {nation:"selcuk",id:"gulam",aliases:["gulam"]},
  {nation:"selcuk",id:"kemankes",aliases:["kemankes","keman kes"]},
  {nation:"selcuk",id:"selcuk",aliases:["selcuk","selçuk"]},
  {nation:"selcuk",id:"alparslan",aliases:["alparslan","alp arslan"]},
  {nation:"selcuk",id:"kargili",aliases:["kargili","kargılı"]},
  {nation:"selcuk",id:"atli-okcu",aliases:["atli okcu","atlı okçu","atli okçu"]},
  {nation:"selcuk",id:"sipahi",aliases:["sipahi"]},
  {nation:"hun",id:"toygun",aliases:["toygun"]},
  {nation:"hun",id:"kemankes",aliases:["kemankes","keman kes"]},
  {nation:"hun",id:"tarik",aliases:["tarik","tarık"]},
  {nation:"hun",id:"barlas",aliases:["barlas"]},
  {nation:"hun",id:"tunga",aliases:["tunga"]},
  {nation:"hun",id:"talakan",aliases:["talakan"]},
  {nation:"hun",id:"tarkan",aliases:["tarkan"]},
  {nation:"common",id:"mancinik",aliases:["mancinik","mancınık"]},
  {nation:"common",id:"topcu",aliases:["topcu","topçu"]},
  {nation:"common",id:"casus",aliases:["casus"]}
];

function normalizeOcr(text){
  return String(text||"")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g,"i").replace(/ş/g,"s").replace(/ç/g,"c")
    .replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o")
    .replace(/[|]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function regexSafe(value){
  const specials="\\^$.*+?()[]{}|";
  let out="";
  for(const ch of value) out+=specials.includes(ch)?"\\"+ch:ch;
  return out;
}

function parseCount(raw){
  const digits=String(raw||"").replace(/\D/g,"");
  if(!digits)return null;
  const value=Number(digits);
  return Number.isFinite(value)?value:null;
}

function detectNation(text){
  const scores={gokturk:0,selcuk:0,hun:0};
  const norm=normalizeOcr(text);
  OCR_UNIT_NAMES.forEach(item=>{
    if(item.nation==="common"||item.id==="kemankes")return;
    if(item.aliases.some(a=>norm.includes(normalizeOcr(a))))scores[item.nation]++;
  });
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  return ranked[0][1]>0?ranked[0][0]:null;
}

function unitOccurrences(source,nation,excludeCasus){
  const candidates=OCR_UNIT_NAMES.filter(x=>
    (x.nation===nation||x.nation==="common") && !(excludeCasus&&x.id==="casus")
  );
  const found=[];
  candidates.forEach(item=>{
    let best=null;
    item.aliases.forEach(aliasRaw=>{
      const alias=normalizeOcr(aliasRaw);
      const pos=source.indexOf(alias);
      if(pos>=0 && (!best||pos<best.pos)) best={id:item.id,pos,end:pos+alias.length};
    });
    if(best)found.push(best);
  });
  return found.sort((a,b)=>a.pos-b.pos);
}

function numericMatches(source){
  const out=[];
  const re=/\b([0-9][0-9., ]{0,14})\b/g;
  let m;
  while((m=re.exec(source))){
    const value=parseCount(m[1]);
    if(value!==null)out.push({pos:m.index,value});
  }
  return out;
}

function parseSpyReport(text,nation){
  const norm=normalizeOcr(text);
  const marker=norm.indexOf("kesfedilen birlikler");
  if(marker<0)return {};
  const source=norm.slice(marker);
  const units=unitOccurrences(source,nation,true);
  const found={};

  // Önce kart içindeki "Mevcut 3,026" gibi doğrudan eşleşmeleri dene.
  units.forEach((u,index)=>{
    const next=units[index+1]?.pos ?? source.length;
    const segment=source.slice(u.end,next);
    const m=segment.match(/mevcut[\s:,-]{0,12}([0-9][0-9., ]{0,14})/i);
    if(m){
      const value=parseCount(m[1]);
      if(value!==null)found[u.id]=value;
    }
  });

  // OCR bazen önce bütün isimleri, sonra bütün "Mevcut" sayılarını okuyor.
  // Bu durumda birimleri ve Mevcut sayılarını ekrandaki sırayla eşleştir.
  if(Object.keys(found).length<units.length){
    const values=[];
    const re=/mevcut[\s:,-]{0,12}([0-9][0-9., ]{0,14})/gi;
    let m;
    while((m=re.exec(source))){
      const value=parseCount(m[1]);
      if(value!==null)values.push(value);
    }
    if(values.length>=units.length){
      units.forEach((u,i)=>found[u.id]=values[i]);
    }
  }

  // Casus raporundaki Casus kartı keşif için gönderilen saldıran casusudur.
  // Savunan orduya hiçbir zaman aktarılmaz.
  delete found.casus;
  return found;
}

function parseCityArmy(text,nation){
  const norm=normalizeOcr(text);
  let source=norm;

  // Şehir ekranında asker çubuğu Haritaya Dön düğmesinden sonra geliyor.
  const mapMarkers=["haritaya don","haritaya dön"];
  let marker=-1;
  mapMarkers.forEach(m=>{const p=norm.indexOf(normalizeOcr(m));if(p>=0&&(marker<0||p<marker))marker=p;});
  if(marker>=0)source=norm.slice(marker);

  // Alt menü sayılarını asker adedi sanmamak için asker çubuğundan sonra kes.
  const navMarkers=[" hediye "," giden "," rapor "," birlik "," canta "," çanta "];
  let cut=source.length;
  navMarkers.forEach(m=>{
    const p=source.indexOf(normalizeOcr(m));
    if(p>0&&p<cut)cut=p;
  });
  source=source.slice(0,cut);

  let units=unitOccurrences(source,nation,false);
  if(!units.length){
    // Haritaya Dön OCR'da kaçtıysa tam metindeki ilk asker adından başla.
    const all=unitOccurrences(norm,nation,false);
    if(all.length){
      const first=all[0].pos;
      source=norm.slice(first);
      let fallbackCut=source.length;
      navMarkers.forEach(m=>{
        const p=source.indexOf(normalizeOcr(m));
        if(p>0&&p<fallbackCut)fallbackCut=p;
      });
      source=source.slice(0,fallbackCut);
      units=unitOccurrences(source,nation,false);
    }
  }

  const found={};

  // Normal OCR akışında isimden sonraki, sonraki asker adına kadar olan ilk sayı adettir.
  units.forEach((u,index)=>{
    const next=units[index+1]?.pos ?? source.length;
    const segment=source.slice(u.end,next);
    const m=segment.match(/\b([0-9][0-9., ]{0,14})\b/);
    if(m){
      const value=parseCount(m[1]);
      if(value!==null)found[u.id]=value;
    }
  });

  // Yatay kart dizilerinde OCR kimi zaman önce bütün isimleri sonra bütün sayıları döndürür.
  // Böyleyse asker kartlarını ekrandaki soldan-sağa sırayla sayılarla eşleştir.
  if(units.length>=2 && Object.keys(found).length<Math.ceil(units.length/2)){
    const nums=numericMatches(source).filter(n=>n.pos>units[0].pos);
    if(nums.length>=units.length){
      units.forEach((u,i)=>found[u.id]=nums[i].value);
    }
  }
  return found;
}

function extractCountsFromText(text,nation){
  const norm=normalizeOcr(text);
  const isSpy=norm.includes("kesfedilen birlikler")||norm.includes("casuslama");
  return {
    mode:isSpy?"spy":"city",
    counts:isSpy?parseSpyReport(text,nation):parseCityArmy(text,nation)
  };
}

function fillRecognized(side,nation,counts){
  const nationSelect=side==="attacker"?atkNation:defNation;
  nationSelect.value=nation;
  renderUnits(side);
  Object.entries(counts).forEach(([id,value])=>{
    const input=document.querySelector('input[data-side="'+side+'"][data-unit="'+id+'"]');
    if(input)input.value=String(value);
  });
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
    const nation=detectNation(text)||(side==="attacker"?atkNation.value:defNation.value);
    const parsed=extractCountsFromText(text,nation);
    const counts=parsed.counts;
    const recognized=Object.keys(counts).length;

    if(!recognized){
      status.textContent="Asker sayısı okunamadı. Daha net/kırpılmış görsel dene.";
      status.classList.add("error");
      return;
    }

    fillRecognized(side,nation,counts);
    status.textContent=parsed.mode==="spy"
      ? recognized+" savunma birliği dolduruldu · Casus atlandı."
      : recognized+" birlik otomatik dolduruldu.";
    status.classList.add("success");
  }catch(err){
    status.textContent="Görsel okunurken hata oluştu.";
    status.classList.add("error");
  }
}

const attackerImage=$("attackerImage");
const defenderImage=$("defenderImage");
if(attackerImage) attackerImage.addEventListener("change",e=>{
  scanArmyImage(e.target.files&&e.target.files[0],"attacker");
  e.target.value="";
});
if(defenderImage) defenderImage.addEventListener("change",e=>{
  scanArmyImage(e.target.files&&e.target.files[0],"defender");
  e.target.value="";
});

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

  // Gerçek savaş raporunda normal birlikler toplam kayıp oranını neredeyse
  // bire bir takip ediyor. Tür/savunma ağırlığını yalnızca küçük bir düzeltme
  // olarak kullanıyoruz; böylece kuşatma/Kemankeş/süvari farkı korunuyor ama
  // kayıp dağılımı yapay biçimde aşırı sapmıyor.
  const enemyCav=cavalryRatio(e);
  const rows=a.units.map(u=>{
    const count=a.counts[u.id]||0;
    const defense=Math.max(1,u.infDef*(1-enemyCav)+u.cavDef*enemyCav);
    return{id:u.id,count,weighted:count*(typeMult(u,side)/defense)}
  });
  const totalWeighted=rows.reduce((sum,x)=>sum+x.weighted,0);
  const totalCount=rows.reduce((sum,x)=>sum+x.count,0);
  if(!totalCount)return out;

  let assigned=0;
  const remainder=[];
  rows.forEach(x=>{
    const uniformShare=x.count/totalCount;
    const weightedShare=totalWeighted?x.weighted/totalWeighted:uniformShare;
    const share=uniformShare*(1-CASUALTY_WEIGHT_BLEND)+weightedShare*CASUALTY_WEIGHT_BLEND;
    const exact=totalLoss*share;
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
    e.className="report-empty";
    e.textContent="Asker girilmedi.";
    host.appendChild(e);
    return
  }

  active.forEach(u=>{
    const sent=a.counts[u.id]||0;
    const dead=losses[u.id]||0;

    const card=document.createElement("article");
    card.className="report-card";

    const art=document.createElement("div");
    art.className="report-art";
    art.setAttribute("role","img");
    art.setAttribute("aria-label",u.name);
    const sprite=spriteStyle(u);
    art.style.backgroundImage=sprite.image;
    art.style.backgroundSize=sprite.size;
    art.style.backgroundPosition=sprite.posX+" "+sprite.posY;
    art.style.aspectRatio=u.sheet==="gokturk"?"2 / 3":"8 / 11";

    const name=document.createElement("div");
    name.className="report-name";
    name.textContent=u.name;

    const sentLine=document.createElement("div");
    sentLine.className="report-line";
    sentLine.append("Giden ");
    const sentStrong=document.createElement("strong");
    sentStrong.textContent=fmt(sent);
    sentLine.appendChild(sentStrong);

    const deadLine=document.createElement("div");
    deadLine.className="report-line dead";
    deadLine.append("Ölen ");
    const deadStrong=document.createElement("strong");
    deadStrong.textContent=fmt(dead);
    deadLine.appendChild(deadStrong);

    card.append(art,name,sentLine,deadLine);
    host.appendChild(card);
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
  const base=(weak**LOSS_EXPONENT)/((weak**LOSS_EXPONENT)+(strong**LOSS_EXPONENT));
  const winnerLossRate=Math.min(.90,Math.max(0,base));
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