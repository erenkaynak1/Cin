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
const fmtNum=n=>new Intl.NumberFormat("tr-TR").format(n);
function pad(n){return String(n).padStart(2,"0")}
function formatDuration(totalSeconds){
  totalSeconds=Math.max(0,Math.round(totalSeconds));
  const h=Math.floor(totalSeconds/3600);
  const m=Math.floor((totalSeconds%3600)/60);
  const s=totalSeconds%60;
  return pad(h)+":"+pad(m)+":"+pad(s);
}
function formatClock(date){
  return pad(date.getHours())+":"+pad(date.getMinutes())+":"+pad(date.getSeconds());
}
function formatDate(date){
  return new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(date);
}
function num(id){
  const raw=$(id).value.trim();
  if(raw==="") return null;
  const value=Number(raw);
  return Number.isFinite(value)?value:null;
}
function calcDistance(x1,y1,x2,y2){
  return Math.ceil(Math.hypot(x2-x1,y2-y1));
}
function calcSeconds(distance,speed,doubleSpeed){
  const effective=speed*(doubleSpeed?2:1);
  return {effective,seconds:Math.ceil((distance/effective)*50)};
}
function populateUnits(nationEl,unitEl){
  unitEl.innerHTML="";
  (NATIONS[nationEl.value]||NATIONS.gokturk).forEach(([id,name,speed])=>{
    const o=document.createElement("option");
    o.value=id;
    o.textContent=name+" · Hız "+speed;
    o.dataset.speed=String(speed);
    unitEl.appendChild(o);
  });
}
function selectedSpeed(unitEl){
  const option=unitEl.options[unitEl.selectedIndex];
  return Number(option?.dataset.speed)||1;
}
function setNowFields(){
  const now=new Date();
  $("lockArrivalDate").value=now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate());
  $("lockArrivalTime").value=formatClock(now);
}
function parseLocalDateTime(dateValue,timeValue){
  if(!dateValue||!timeValue)return null;
  const [y,m,d]=dateValue.split("-").map(Number);
  const [hh,mm,ssRaw]=timeValue.split(":");
  const ss=Number(ssRaw||0);
  const dt=new Date(y,m-1,d,Number(hh),Number(mm),ss,0);
  return Number.isNaN(dt.getTime())?null:dt;
}

const liveClock=$("liveClock");
function tickClock(){liveClock.textContent=formatClock(new Date())}
tickClock();
setInterval(tickClock,1000);

const arrivalTab=$("arrivalTab"),lockTab=$("lockTab");
function setMode(mode){
  const arrival=mode==="arrival";
  $("arrivalPanel").hidden=!arrival;
  $("lockPanel").hidden=arrival;
  arrivalTab.classList.toggle("active",arrival);
  lockTab.classList.toggle("active",!arrival);
  arrivalTab.setAttribute("aria-selected",String(arrival));
  lockTab.setAttribute("aria-selected",String(!arrival));
}
arrivalTab.addEventListener("click",()=>setMode("arrival"));
lockTab.addEventListener("click",()=>setMode("lock"));

const travelNation=$("travelNation"),travelUnit=$("travelUnit");
travelNation.addEventListener("change",()=>populateUnits(travelNation,travelUnit));
populateUnits(travelNation,travelUnit);

$("distanceCalculate").addEventListener("click",()=>{
  const x1=num("fromX"),y1=num("fromY"),x2=num("toX"),y2=num("toY");
  if([x1,y1,x2,y2].some(v=>v===null)){
    $("distanceValidation").textContent="Kaynak ve hedef koordinatlarını eksiksiz gir.";
    return;
  }
  $("distanceValidation").textContent="";
  const distance=calcDistance(x1,y1,x2,y2);
  const {effective,seconds}=calcSeconds(distance,selectedSpeed(travelUnit),$("diamondTravel").checked);
  const now=new Date();
  const arrival=new Date(now.getTime()+seconds*1000);

  $("durationText").textContent=formatDuration(seconds);
  $("distanceText").textContent=fmtNum(distance);
  $("speedText").textContent=String(effective)+($("diamondTravel").checked?" (2×)":"");
  $("departureText").textContent=formatClock(now);
  $("arrivalText").textContent=formatClock(arrival);
});

const lockNation=$("lockNation"),lockUnit=$("lockUnit");
lockNation.addEventListener("change",()=>populateUnits(lockNation,lockUnit));
populateUnits(lockNation,lockUnit);
setNowFields();

$("lockUseNow").addEventListener("click",setNowFields);

$("lockCalculate").addEventListener("click",()=>{
  const x1=num("lockHomeX"),y1=num("lockHomeY"),x2=num("lockTargetX"),y2=num("lockTargetY");
  if([x1,y1,x2,y2].some(v=>v===null)){
    $("lockValidation").textContent="Rakip köyü ve saldırı hedefi koordinatlarını eksiksiz gir.";
    return;
  }
  const hit=parseLocalDateTime($("lockArrivalDate").value,$("lockArrivalTime").value);
  if(!hit){
    $("lockValidation").textContent="Rakibin hedefe varış tarih ve saatini gir.";
    return;
  }
  $("lockValidation").textContent="";

  const distance=calcDistance(x1,y1,x2,y2);
  const {effective,seconds}=calcSeconds(distance,selectedSpeed(lockUnit),false);
  const back=new Date(hit.getTime()+seconds*1000);

  $("lockReturnText").textContent=formatClock(back);
  $("lockReturnDateText").textContent=formatDate(back);
  $("lockDistanceText").textContent=fmtNum(distance);
  $("lockSpeedText").textContent=String(effective);
  $("lockTravelText").textContent=formatDuration(seconds);
  $("lockBackText").textContent=formatDuration(seconds);
  $("lockHitText").textContent=formatDate(hit)+" "+formatClock(hit);
});
})();