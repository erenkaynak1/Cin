(()=>{
const NATIONS={
  gokturk:[
    ["karabudun","Karabudun",120],["kemankes","Kemankeş",140],["tapukci","Tapukçı",100],
    ["mavi-kurt","Mavi Kurt",130],["muhafiz","Muhafız",150],["mavi-atli","Mavi Atlı",200],
    ["kursad","Kürşad",180],["mancinik","Mancınık",50],["topcu","Topçu",60],["casus","Casus",300]
  ],
  selcuk:[
    ["gulam","Gulam",115],["kemankes","Kemankeş",135],["selcuk","Selçuk",105],
    ["alparslan","Alparslan",125],["kargili","Kargılı",160],["atli-okcu","Atlı Okçu",225],
    ["sipahi","Sipahi",175],["mancinik","Mancınık",50],["topcu","Topçu",60],["casus","Casus",300]
  ],
  hun:[
    ["toygun","Toygun",125],["kemankes","Kemankeş",145],["tarik","Tarık",110],
    ["barlas","Barlas",135],["tunga","Tunga",175],["talakan","Talakan",230],
    ["tarkan","Tarkan",195],["mancinik","Mancınık",50],["topcu","Topçu",60],["casus","Casus",300]
  ]
};

const $=id=>document.getElementById(id);
const nation=$("travelNation"),unit=$("travelUnit");
const diamond=$("diamondTravel"),validation=$("distanceValidation");

function renderUnits(){
  unit.innerHTML="";
  (NATIONS[nation.value]||NATIONS.gokturk).forEach(([id,name,speed])=>{
    const o=document.createElement("option");
    o.value=id;
    o.textContent=name+" · Hız "+speed;
    o.dataset.speed=String(speed);
    unit.appendChild(o);
  });
}

function pad(n){return String(n).padStart(2,"0")}
function formatDuration(totalSeconds){
  totalSeconds=Math.max(0,Math.round(totalSeconds));
  const h=Math.floor(totalSeconds/3600);
  const m=Math.floor((totalSeconds%3600)/60);
  const s=totalSeconds%60;
  return pad(h)+":"+pad(m)+":"+pad(s);
}
function formatClock(date){
  return new Intl.DateTimeFormat("tr-TR",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(date);
}
function num(id){
  const value=Number($(id).value);
  return Number.isFinite(value)?value:null;
}

nation.addEventListener("change",renderUnits);
renderUnits();

$("distanceCalculate").addEventListener("click",()=>{
  const x1=num("fromX"),y1=num("fromY"),x2=num("toX"),y2=num("toY");
  if([x1,y1,x2,y2].some(v=>v===null)){
    validation.textContent="Kaynak ve hedef koordinatlarını eksiksiz gir.";
    return;
  }
  validation.textContent="";

  const dx=x2-x1,dy=y2-y1;
  const exactDistance=Math.hypot(dx,dy);
  const mapDistance=Math.ceil(exactDistance);
  const option=unit.options[unit.selectedIndex];
  const baseSpeed=Number(option.dataset.speed)||1;
  const effectiveSpeed=baseSpeed*(diamond.checked?2:1);

  // Gerçek örnek: (25250,30250) -> (26490,30084), Göktürk Kemankeş Hız 140
  // mesafe ceil(sqrt(dx²+dy²)) = 1252, süre ceil(1252 / 140 * 50) = 448 sn = 00:07:28.
  const seconds=Math.ceil((mapDistance/effectiveSpeed)*50);

  const now=new Date();
  const arrival=new Date(now.getTime()+seconds*1000);

  $("durationText").textContent=formatDuration(seconds);
  $("distanceText").textContent=new Intl.NumberFormat("tr-TR").format(mapDistance);
  $("speedText").textContent=String(effectiveSpeed)+(diamond.checked?" (2×)":"");
  $("departureText").textContent=formatClock(now);
  $("arrivalText").textContent=formatClock(arrival);
});
})();