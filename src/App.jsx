import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const CATEGORIES=["Healthcare","Education","Environment","Economy","Infrastructure","Safety & Security","Corruption","Housing","Food & Water","Employment","Human Rights","Technology","Transportation","Other"];
const CC={"Healthcare":"#ef4444","Education":"#3b82f6","Environment":"#22c55e","Economy":"#f59e0b","Infrastructure":"#a855f7","Safety & Security":"#f97316","Corruption":"#dc2626","Housing":"#14b8a6","Food & Water":"#10b981","Employment":"#8b5cf6","Human Rights":"#ec4899","Technology":"#0ea5e9","Transportation":"#6366f1","Other":"#6b7280"};
const CID={"004":"Afghanistan","008":"Albania","012":"Algeria","024":"Angola","032":"Argentina","036":"Australia","040":"Austria","050":"Bangladesh","056":"Belgium","068":"Bolivia","070":"Bosnia and Herz.","076":"Brazil","100":"Bulgaria","104":"Myanmar","116":"Cambodia","120":"Cameroon","124":"Canada","140":"Central African Rep.","144":"Sri Lanka","152":"Chile","156":"China","170":"Colombia","178":"Congo","180":"Dem. Rep. Congo","188":"Costa Rica","191":"Croatia","192":"Cuba","196":"Cyprus","203":"Czechia","208":"Denmark","214":"Dominican Rep.","218":"Ecuador","818":"Egypt","222":"El Salvador","226":"Eq. Guinea","232":"Eritrea","233":"Estonia","231":"Ethiopia","246":"Finland","250":"France","266":"Gabon","270":"Gambia","276":"Germany","288":"Ghana","300":"Greece","320":"Guatemala","324":"Guinea","328":"Guyana","332":"Haiti","340":"Honduras","348":"Hungary","352":"Iceland","356":"India","360":"Indonesia","364":"Iran","368":"Iraq","372":"Ireland","376":"Israel","380":"Italy","384":"Côte d'Ivoire","388":"Jamaica","392":"Japan","400":"Jordan","398":"Kazakhstan","404":"Kenya","408":"North Korea","410":"South Korea","414":"Kuwait","417":"Kyrgyzstan","418":"Laos","422":"Lebanon","426":"Lesotho","430":"Liberia","434":"Libya","440":"Lithuania","442":"Luxembourg","450":"Madagascar","454":"Malawi","458":"Malaysia","466":"Mali","478":"Mauritania","484":"Mexico","496":"Mongolia","498":"Moldova","504":"Morocco","508":"Mozambique","516":"Namibia","524":"Nepal","528":"Netherlands","540":"New Caledonia","554":"New Zealand","558":"Nicaragua","562":"Niger","566":"Nigeria","578":"Norway","512":"Oman","586":"Pakistan","591":"Panama","598":"Papua New Guinea","600":"Paraguay","604":"Peru","608":"Philippines","616":"Poland","620":"Portugal","630":"Puerto Rico","634":"Qatar","642":"Romania","643":"Russia","646":"Rwanda","682":"Saudi Arabia","686":"Senegal","688":"Serbia","694":"Sierra Leone","702":"Singapore","703":"Slovakia","704":"Vietnam","705":"Slovenia","706":"Somalia","710":"South Africa","716":"Zimbabwe","724":"Spain","728":"South Sudan","729":"Sudan","740":"Suriname","748":"Eswatini","752":"Sweden","756":"Switzerland","760":"Syria","762":"Tajikistan","764":"Thailand","768":"Togo","780":"Trinidad and Tobago","788":"Tunisia","792":"Turkey","795":"Turkmenistan","800":"Uganda","804":"Ukraine","784":"United Arab Emirates","826":"United Kingdom","834":"Tanzania","840":"United States of America","858":"Uruguay","860":"Uzbekistan","862":"Venezuela","887":"Yemen","894":"Zambia"};
const USS={"01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California","08":"Colorado","09":"Connecticut","10":"Delaware","11":"District of Columbia","12":"Florida","13":"Georgia","15":"Hawaii","16":"Idaho","17":"Illinois","18":"Indiana","19":"Iowa","20":"Kansas","21":"Kentucky","22":"Louisiana","23":"Maine","24":"Maryland","25":"Massachusetts","26":"Michigan","27":"Minnesota","28":"Mississippi","29":"Missouri","30":"Montana","31":"Nebraska","32":"Nevada","33":"New Hampshire","34":"New Jersey","35":"New Mexico","36":"New York","37":"North Carolina","38":"North Dakota","39":"Ohio","40":"Oklahoma","41":"Oregon","42":"Pennsylvania","44":"Rhode Island","45":"South Carolina","46":"South Dakota","47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont","51":"Virginia","53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming"};

function decodeTopo(topology,objKey,nameMap){
  function da(t,ai){let x=0,y=0;const a=t.arcs[ai<0?~ai:ai];const p=a.map(c=>{x+=c[0];y+=c[1];return t.transform?[x*t.transform.scale[0]+t.transform.translate[0],y*t.transform.scale[1]+t.transform.translate[1]]:[x,y]});return ai<0?p.reverse():p}
  function dr(t,arcs){const r=[];arcs.forEach(ai=>{const p=da(t,ai);p.forEach((pt,i)=>{if(i>0||r.length===0)r.push(pt)})});return r}
  function dg(t,g){if(g.type==="Polygon")return{type:"Polygon",coordinates:g.arcs.map(r=>dr(t,r))};if(g.type==="MultiPolygon")return{type:"MultiPolygon",coordinates:g.arcs.map(p=>p.map(r=>dr(t,r)))};return{type:g.type,coordinates:[]}}
  const obj=topology.objects[objKey];if(!obj)return null;
  const geoms=obj.type==="GeometryCollection"?obj.geometries:[obj];
  return{type:"FeatureCollection",features:geoms.map(g=>({type:"Feature",id:g.id,properties:{name:(nameMap&&nameMap[g.id])||g.properties?.name||g.properties?.NAME||"Unknown"},geometry:dg(topology,g)}))}
}

// n = needs count (pre-seeded)
const SEED=[
  {co:"United States of America",sub:"California",cat:"Housing",desc:"Housing prices have far outpaced wages",v:847,n:420,lat:36.7,lng:-122.4},
  {co:"United States of America",sub:"California",cat:"Environment",desc:"Wildfire risk growing every year",v:680,n:180,lat:37.5,lng:-119.5},
  {co:"United States of America",sub:"California",cat:"Housing",desc:"Homelessness crisis in major cities",v:720,n:580,lat:34.0,lng:-118.2},
  {co:"United States of America",sub:"New York",cat:"Housing",desc:"Rent is consuming most of people's income",v:790,n:390,lat:40.7,lng:-74.0},
  {co:"United States of America",sub:"New York",cat:"Infrastructure",desc:"Aging subway system needs massive investment",v:520,n:110,lat:40.7,lng:-73.9},
  {co:"United States of America",sub:"Texas",cat:"Infrastructure",desc:"Power grid vulnerability to extreme weather",v:740,n:490,lat:30.3,lng:-97.7},
  {co:"United States of America",sub:"Texas",cat:"Healthcare",desc:"Rural hospitals closing at alarming rate",v:560,n:430,lat:31.0,lng:-100.0},
  {co:"United States of America",sub:"Florida",cat:"Environment",desc:"Rising sea levels threatening coastal communities",v:620,n:210,lat:25.8,lng:-80.2},
  {co:"United States of America",sub:"Michigan",cat:"Infrastructure",desc:"Lead in drinking water still affects communities",v:670,n:610,lat:43.0,lng:-83.7},
  {co:"United States of America",sub:"Ohio",cat:"Healthcare",desc:"Opioid crisis continues to claim lives",v:710,n:620,lat:40.0,lng:-82.9},
  {co:"United States of America",sub:"Illinois",cat:"Safety & Security",desc:"Gun violence epidemic in Chicago",v:680,n:540,lat:41.9,lng:-87.6},
  {co:"United States of America",sub:"Oklahoma",cat:"Environment",desc:"Earthquake frequency linked to wastewater injection",v:380,n:90,lat:35.5,lng:-97.5},
  {co:"United States of America",sub:"Oklahoma",cat:"Education",desc:"Teacher pay among lowest in the nation",v:470,n:150,lat:36.1,lng:-96.0},
  {co:"United States of America",sub:"Oklahoma",cat:"Healthcare",desc:"Rural hospital closures leaving gaps in care",v:420,n:350,lat:34.5,lng:-96.0},
  {co:"United States of America",sub:"Oklahoma",cat:"Infrastructure",desc:"Tornado damage recurring annually",v:350,n:280,lat:35.2,lng:-97.9},
  {co:"United States of America",cat:"Education",desc:"Student loan debt crushing a generation",v:589,n:120,lat:38.9,lng:-77.0},
  {co:"United States of America",cat:"Safety & Security",desc:"Gun violence remains a persistent crisis",v:534,n:430,lat:38.9,lng:-77.0},
  {co:"United Kingdom",cat:"Healthcare",desc:"NHS waiting times are dangerously long",v:720,n:580,lat:51.5,lng:-0.1},
  {co:"United Kingdom",cat:"Housing",desc:"Rent prices in cities unsustainable",v:651,n:320,lat:51.5,lng:-0.1},
  {co:"United Kingdom",cat:"Economy",desc:"Cost of living crisis affecting millions",v:590,n:410,lat:53.5,lng:-2.2},
  {co:"India",cat:"Environment",desc:"Air pollution at dangerous levels in cities",v:890,n:750,lat:28.6,lng:77.2},
  {co:"India",cat:"Food & Water",desc:"Clean drinking water unavailable in villages",v:810,n:780,lat:20.6,lng:79.0},
  {co:"India",cat:"Employment",desc:"Youth unemployment alarmingly high",v:670,n:290,lat:19.1,lng:73.0},
  {co:"India",cat:"Education",desc:"Quality education not accessible to all",v:720,n:350,lat:22.6,lng:88.4},
  {co:"Brazil",cat:"Safety & Security",desc:"Crime rates very high in urban areas",v:780,n:620,lat:-22.9,lng:-43.2},
  {co:"Brazil",cat:"Environment",desc:"Deforestation of the Amazon accelerating",v:850,n:380,lat:-3.1,lng:-60.0},
  {co:"Brazil",cat:"Corruption",desc:"Political corruption undermines trust",v:690,n:180,lat:-15.8,lng:-47.9},
  {co:"Nigeria",cat:"Corruption",desc:"Corruption diverts public funds",v:730,n:410,lat:6.5,lng:3.4},
  {co:"Nigeria",cat:"Food & Water",desc:"Food insecurity affecting millions",v:770,n:720,lat:10.5,lng:7.4},
  {co:"Germany",cat:"Housing",desc:"Housing shortage in major cities",v:480,n:190,lat:52.5,lng:13.4},
  {co:"Germany",cat:"Economy",desc:"Energy costs impacting industry",v:420,n:140,lat:50.1,lng:8.7},
  {co:"Japan",cat:"Economy",desc:"Aging population straining systems",v:650,n:310,lat:35.7,lng:139.7},
  {co:"Japan",cat:"Employment",desc:"Work culture causing burnout",v:580,n:220,lat:34.7,lng:135.5},
  {co:"China",cat:"Environment",desc:"Industrial pollution affecting health",v:700,n:510,lat:39.9,lng:116.4},
  {co:"China",cat:"Employment",desc:"Youth unemployment rising sharply",v:620,n:250,lat:23.1,lng:113.3},
  {co:"Australia",cat:"Environment",desc:"Wildfires and drought worsening",v:540,n:320,lat:-33.9,lng:151.2},
  {co:"Australia",cat:"Housing",desc:"Home ownership impossible for youth",v:610,n:280,lat:-37.8,lng:145.0},
  {co:"France",cat:"Economy",desc:"Cost of living protests ongoing",v:480,n:290,lat:48.9,lng:2.3},
  {co:"South Africa",cat:"Employment",desc:"Unemployment at record levels",v:710,n:580,lat:-26.2,lng:28.0},
  {co:"South Africa",cat:"Infrastructure",desc:"Rolling blackouts disrupting life",v:680,n:550,lat:-33.9,lng:18.4},
  {co:"Mexico",cat:"Safety & Security",desc:"Cartel violence affecting communities",v:680,n:560,lat:19.4,lng:-99.1},
  {co:"Ukraine",cat:"Safety & Security",desc:"Ongoing conflict devastating communities",v:900,n:810,lat:50.4,lng:30.5},
  {co:"Russia",cat:"Human Rights",desc:"Civil liberties being restricted",v:650,n:180,lat:55.8,lng:37.6},
  {co:"Argentina",cat:"Economy",desc:"Hyperinflation eroding purchasing power",v:740,n:560,lat:-34.6,lng:-58.4},
  {co:"Spain",cat:"Employment",desc:"Youth unemployment remains very high",v:530,n:210,lat:40.4,lng:-3.7},
  {co:"South Korea",cat:"Employment",desc:"Extreme work pressure and competition",v:520,n:170,lat:37.6,lng:127.0},
  {co:"Kenya",cat:"Food & Water",desc:"Drought causing food shortages",v:640,n:600,lat:-1.3,lng:36.8},
  {co:"Egypt",cat:"Food & Water",desc:"Water scarcity a growing crisis",v:620,n:570,lat:30.0,lng:31.2},
  {co:"Philippines",cat:"Environment",desc:"Typhoons devastating communities",v:590,n:470,lat:14.6,lng:121.0},
  {co:"Indonesia",cat:"Environment",desc:"Deforestation threatening biodiversity",v:530,n:200,lat:-6.2,lng:106.8},
  {co:"Turkey",cat:"Economy",desc:"Currency instability affecting lives",v:560,n:340,lat:41.0,lng:29.0},
  {co:"Ethiopia",cat:"Food & Water",desc:"Millions face food insecurity",v:720,n:690,lat:9.0,lng:38.7},
  {co:"Pakistan",cat:"Education",desc:"Millions of children out of school",v:710,n:480,lat:33.7,lng:73.0},
  {co:"Canada",cat:"Housing",desc:"Housing affordability crisis nationwide",v:580,n:240,lat:43.7,lng:-79.4},
  {co:"Canada",cat:"Healthcare",desc:"Doctor shortages in rural communities",v:450,n:360,lat:56.1,lng:-106.3},
].map((p,i)=>({id:'s'+i,...p}));

const SUBS_COUNTRIES=new Set(["United States of America"]);

export default function App(){
  const[worldGeo,setWorldGeo]=useState(null);
  const[statesGeo,setStatesGeo]=useState(null);
  const[loading,setLoading]=useState(true);
  const[dark,setDark]=useState(()=>{try{return localStorage.getItem('wup-dark')==='true'}catch(e){return false}});
  const toggleDark=()=>{const n=!dark;setDark(n);try{localStorage.setItem('wup-dark',n?'true':'false')}catch(e){}};
  const[userProblems,setUserProblems]=useState([]);
  // votes = {id:true} for problems you +1'd, myNeeds = {id:true} for problems you flagged as need
  const[votes,setVotes]=useState({});
  const[myNeeds,setMyNeeds]=useState({});
  const[locked,setLocked]=useState(null);
  const[visibleProbs,setVisibleProbs]=useState(SEED);
  const[sortBy,setSortBy]=useState("votes");
  const[filterCat,setFilterCat]=useState("All");
  const[submitOpen,setSubmitOpen]=useState(false);
  const[formCat,setFormCat]=useState("");
  const[formDesc,setFormDesc]=useState("");
  const[submitted,setSubmitted]=useState(false);
  const[userLoc,setUserLoc]=useState(null);
  const[locating,setLocating]=useState(false);
  const[userCountry,setUserCountry]=useState("");
  const[tip,setTip]=useState({show:false,x:0,y:0,name:"",count:0});
  const[zoomK,setZoomK]=useState(1);
  const[search,setSearch]=useState("");
  const[showDots,setShowDots]=useState(true);
  const[showWelcome,setShowWelcome]=useState(true);
  const[isMobile,setIsMobile]=useState(false);
  const[sheetOpen,setSheetOpen]=useState(false);

  useEffect(()=>{const c=()=>setIsMobile(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);

  const svgRef=useRef(null);const gRef=useRef(null);const dotsRef=useRef(null);
  const containerRef=useRef(null);const projRef=useRef(null);const zoomBeh=useRef(null);
  const tRef=useRef(d3.zoomIdentity);const mwRef=useRef(0);
  const R=useRef({});R.current={dark,locked,userProblems,votes,showDots};

  useEffect(()=>{
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r=>r.json()).then(topo=>{setWorldGeo(decodeTopo(topo,"countries",CID));setLoading(false)}).catch(()=>setLoading(false));
    fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then(r=>r.json()).then(topo=>{setStatesGeo(decodeTopo(topo,"states",USS))}).catch(()=>{});
  },[]);

  const computeVisible=useCallback(()=>{
    const proj=projRef.current,svg=svgRef.current,t=tRef.current,r=R.current;
    if(!proj||!svg)return;
    const rect=svg.getBoundingClientRect();const W=rect.width,H=rect.height;
    const ap=[...SEED,...r.userProblems];const lk=r.locked;const mw=mwRef.current;
    setVisibleProbs(ap.filter(p=>{
      if(lk){if(lk.level==="country"&&p.co!==lk.name)return false;if(lk.level==="state"&&p.sub!==lk.name)return false}
      if(p.lat==null||p.lng==null)return false;
      const[px,py]=proj([p.lng,p.lat]);const sy=t.applyY(py);
      if(sy<-80||sy>H+80)return false;
      for(const o of(mw?[-mw,0,mw]:[0])){if(t.applyX(px+o)>=-80&&t.applyX(px+o)<=W+80)return true}
      return false;
    }));
  },[]);

  const updateDots=useCallback(()=>{
    const proj=projRef.current;const t=tRef.current;const dotsG=dotsRef.current;
    if(!proj||!dotsG)return;const g=d3.select(dotsG);g.selectAll("*").remove();
    if(!R.current.showDots)return;
    const ap=[...SEED,...R.current.userProblems];const mw=mwRef.current;
    const clusters={};
    ap.forEach(p=>{if(p.lat==null||p.lng==null)return;const rk=Math.round(p.lat*2)/2+','+Math.round(p.lng*2)/2;
      if(!clusters[rk])clusters[rk]={lat:p.lat,lng:p.lng,count:0,topCat:p.cat,maxV:0};clusters[rk].count++;
      if(p.v>clusters[rk].maxV){clusters[rk].maxV=p.v;clusters[rk].topCat=p.cat}});
    const maxC=Math.max(...Object.values(clusters).map(c=>c.count),1);const k=t.k;
    Object.values(clusters).forEach(cl=>{const[px,py]=proj([cl.lng,cl.lat]);const r=Math.max(1.5,(2+cl.count/maxC*4)/k);const color=CC[cl.topCat]||"#888";
      [-mw,0,mw].forEach(ox=>{g.append("circle").attr("cx",px+ox).attr("cy",py).attr("r",r).attr("fill",color).attr("fill-opacity",0.7).attr("stroke",color).attr("stroke-opacity",0.3).attr("stroke-width",r*0.8).style("pointer-events","none")})});
  },[]);

  const[mapSize,setMapSize]=useState({w:0,h:0});

  // Track container size
  useEffect(()=>{
    const el=containerRef.current;if(!el)return;
    const ro=new ResizeObserver(()=>{
      const w=el.clientWidth,h=el.clientHeight;
      if(w>0&&h>0)setMapSize({w,h});
    });
    ro.observe(el);
    return()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    if(!worldGeo||!svgRef.current||!containerRef.current||mapSize.w===0)return;
    const svg=d3.select(svgRef.current);const g=d3.select(gRef.current);
    const W=mapSize.w;const H=mapSize.h;
    svg.attr("viewBox",`0 0 ${W} ${H}`);
    const proj=d3.geoEquirectangular().fitHeight(H,worldGeo).translate([W/2,H/2]);
    projRef.current=proj;const path=d3.geoPath().projection(proj);
    const[xL]=proj([-180,0]);const[xR]=proj([180,0]);const mw=xR-xL;mwRef.current=mw;
    g.selectAll("*").remove();
    function drawCopy(parent,ox){const c=parent.append("g").attr("class","mc").attr("transform",`translate(${ox},0)`);
      c.append("path").datum(d3.geoGraticule10()).attr("class","grat").attr("d",path).attr("fill","none").attr("stroke-width",0.3);
      c.append("g").selectAll("path").data(worldGeo.features).enter().append("path").attr("class","country").attr("d",path).attr("data-name",d=>d.properties.name).attr("stroke-width",0.6).style("cursor","pointer");
      if(statesGeo){c.append("g").selectAll("path").data(statesGeo.features).enter().append("path").attr("class","adm1").attr("d",path).attr("data-name",d=>d.properties.name).attr("stroke-width",0.5).style("cursor","pointer").style("display","none")}}
    [-mw,0,mw].forEach(o=>drawCopy(g,o));
    const dotsG=g.append("g").attr("class","dots-layer").node();dotsRef.current=dotsG;
    const[,yT]=proj([0,85]);const[,yB]=proj([0,-85]);
    const zoom=d3.zoom().scaleExtent([1,25]).filter(ev=>!ev.target.closest||!ev.target.closest('button,input,select,textarea')).on("zoom",ev=>{
      let{x,y,k}=ev.transform;

      // Horizontal wrap
      const smw=mw*k;
      x=((x%smw)+smw)%smw;
      if(x>smw/2)x-=smw;

      // Vertical clamp — gently nudge back in bounds without overriding mouse zoom
      const mapPixelH=(yB-yT)*k;
      if(mapPixelH<=H){
        // Map shorter than viewport — center it
        y=(H-yT*k-yB*k)/2;
      } else {
        // Clamp so top/bottom edges don't go past viewport
        const minY=H-yB*k;  // bottom edge at viewport bottom
        const maxY=-yT*k;    // top edge at viewport top
        if(y>maxY)y=maxY;
        if(y<minY)y=minY;
      }

      const t=d3.zoomIdentity.translate(x,y).scale(k);
      tRef.current=t;
      g.attr("transform",t);
      setZoomK(k);

      g.selectAll(".country").attr("stroke-width",Math.max(0.15,0.6/k));
      g.selectAll(".adm1").attr("stroke-width",Math.max(0.1,0.5/k));
      g.selectAll(".grat").attr("stroke-width",Math.max(0.05,0.3/k));
      const show=k>2.5;
      g.selectAll(".adm1").style("display",show?"block":"none");
      g.selectAll(".country").each(function(){const el=d3.select(this);if(show&&SUBS_COUNTRIES.has(el.attr("data-name"))){el.attr("fill-opacity",0).attr("stroke-opacity",0)}else{el.attr("fill-opacity",1).attr("stroke-opacity",1)}});
      applyColors(k);updateDots();computeVisible()
    });
    zoomBeh.current=zoom;svg.call(zoom);
    svg.on("click.ds",()=>{R.current.locked=null;setLocked(null)});
    const attachMouse=(sel,level)=>{sel.on("mouseenter",function(ev,d){
      const name=d.properties.name;const ap=[...SEED,...R.current.userProblems];
      const count=level==="country"?ap.filter(p=>p.co===name).length:ap.filter(p=>p.sub===name).length;
      const rect=containerRef.current.getBoundingClientRect();
      setTip({show:true,x:ev.clientX-rect.left,y:ev.clientY-rect.top-14,name,count});
      g.selectAll("."+(level==="country"?"country":"adm1")).filter(function(){return d3.select(this).attr("data-name")===name}).classed("hovered",true);applyColors(tRef.current.k);
    }).on("mousemove",function(ev){const rect=containerRef.current.getBoundingClientRect();setTip(prev=>({...prev,x:ev.clientX-rect.left,y:ev.clientY-rect.top-14}))
    }).on("mouseleave",function(ev,d){setTip(prev=>({...prev,show:false}));g.selectAll("."+d3.select(this).attr("class").split(" ")[0]).filter(function(){return d3.select(this).attr("data-name")===d.properties.name}).classed("hovered",false);applyColors(tRef.current.k)
    }).on("click",function(ev,d){ev.stopPropagation();const name=d.properties.name;const prev=R.current.locked;const next=(prev&&prev.name===name&&prev.level===level)?null:{name,level};R.current.locked=next;setLocked(next);setFilterCat("All");setSearch("");applyColors(tRef.current.k);setTimeout(()=>computeVisible(),10)})};
    attachMouse(g.selectAll(".country"),"country");attachMouse(g.selectAll(".adm1"),"state");
    applyColors(1);updateDots();computeVisible();
  },[worldGeo,statesGeo,mapSize,computeVisible,updateDots]);

  function applyColors(k){const r=R.current;const dk=r.dark;const lk=r.locked;const ap=[...SEED,...r.userProblems];const show=k>2.5;
    const coC={};ap.forEach(p=>{coC[p.co]=(coC[p.co]||0)+1});const coM=Math.max(...Object.values(coC),1);
    const subC={};ap.forEach(p=>{if(p.sub)subC[p.sub]=(subC[p.sub]||0)+1});const subM=Math.max(...Object.values(subC),1);
    const g=d3.select(gRef.current);
    g.selectAll(".country").each(function(){const el=d3.select(this);const name=el.attr("data-name");
      if(show&&SUBS_COUNTRIES.has(name)){el.attr("fill-opacity",0).attr("stroke-opacity",0);return}
      el.attr("fill-opacity",1).attr("stroke-opacity",1);const hov=el.classed("hovered");const sel=lk&&lk.level==="country"&&lk.name===name;const c=coC[name]||0;const t=c/coM;
      if(sel){el.attr("fill",dk?"#5b7cfa":"#4a6cf7").attr("stroke",dk?"#7b9aff":"#3451d1");return}
      if(hov){el.attr("fill",dk?"#3e4260":"#b8bdd0").attr("stroke",dk?"#555870":"#8890a8");return}
      if(c>0)el.attr("fill",dk?`rgba(91,124,250,${0.12+t*0.50})`:`rgba(74,108,247,${0.08+t*0.38})`);
      else el.attr("fill",dk?"#282a3c":"#d0d4de");el.attr("stroke",dk?"#404560":"#a0a6b8")});
    g.selectAll(".adm1").each(function(){const el=d3.select(this);const name=el.attr("data-name");const hov=el.classed("hovered");const sel=lk&&lk.level==="state"&&lk.name===name;const c=subC[name]||0;const t=c/subM;
      if(sel){el.attr("fill",dk?"#5b7cfa":"#4a6cf7").attr("stroke",dk?"#7b9aff":"#3451d1");return}
      if(hov){el.attr("fill",dk?"#3e4260":"#b8bdd0").attr("stroke",dk?"#555870":"#8890a8");return}
      if(c>0)el.attr("fill",dk?`rgba(91,124,250,${0.12+t*0.55})`:`rgba(74,108,247,${0.08+t*0.42})`);
      else el.attr("fill",dk?"#252840":"#ccd0dc");el.attr("stroke",dk?"#3c4060":"#9aa0b4")});
    g.selectAll(".grat").attr("stroke",dk?"#242638":"#c8ccd8")}

  useEffect(()=>{if(!gRef.current)return;applyColors(tRef.current.k);updateDots();computeVisible()},[dark,locked,userProblems.length,showDots,computeVisible,updateDots]);

  const findCountry=(lat,lng)=>{if(!worldGeo)return"Unknown";const pt=[lng,lat];for(const f of worldGeo.features){if(d3.geoContains(f,pt))return f.properties.name}return"Unknown"};
  const requestLoc=()=>{if(userLoc)return;setLocating(true);navigator.geolocation?.getCurrentPosition(p=>{const loc={lat:p.coords.latitude,lng:p.coords.longitude};setUserLoc(loc);setUserCountry(findCountry(loc.lat,loc.lng));setLocating(false)},()=>{const loc={lat:36.1,lng:-96.0};setUserLoc(loc);setUserCountry(findCountry(loc.lat,loc.lng));setLocating(false)},{timeout:8000})};

  const getDisplay=()=>{
    const agg={};visibleProbs.forEach(p=>{const k=p.cat+'::'+p.desc;if(!agg[k])agg[k]={...p,count:1};else{agg[k].v+=p.v||1;agg[k].n=(agg[k].n||0)+(p.n||0);agg[k].count++}});
    let arr=Object.values(agg);
    if(filterCat!=='All')arr=arr.filter(p=>p.cat===filterCat);
    if(search.trim()){const s=search.toLowerCase();arr=arr.filter(p=>p.desc.toLowerCase().includes(s)||p.co.toLowerCase().includes(s)||(p.sub||'').toLowerCase().includes(s)||p.cat.toLowerCase().includes(s))}
    // Get total votes and needs for sorting (base + user's vote/need)
    const tv=p=>(p.v||0)+(votes[p.id]?1:0);
    const tn=p=>(p.n||0)+(myNeeds[p.id]?1:0);
    if(sortBy==='votes')arr.sort((a,b)=>(tv(b)+tn(b))-(tv(a)+tn(a)));
    else if(sortBy==='urgent')arr.sort((a,b)=>tn(b)-tn(a));
    else if(sortBy==='newest')arr.sort((a,b)=>b.id>a.id?1:-1);
    else if(sortBy==='rising'){const now=Date.now();arr.sort((a,b)=>{const aA=Math.max(1,(now-(parseInt(a.id.replace(/\D/g,''))||now-864e5))/36e5);const bA=Math.max(1,(now-(parseInt(b.id.replace(/\D/g,''))||now-864e5))/36e5);return tv(b)/bA-tv(a)/aA})}
    return arr};

  const canSubmit=formCat&&formDesc.trim()&&userLoc;
  const handleSubmit=()=>{if(!canSubmit)return;
    const np={id:'u'+Date.now(),co:userCountry||'Unknown',cat:formCat,desc:formDesc.trim(),v:1,n:0,lat:userLoc.lat,lng:userLoc.lng};
    setUserProblems(prev=>[...prev,np]);setVisibleProbs(prev=>[np,...prev]);
    setFormCat('');setFormDesc('');setSubmitted(true);setSubmitOpen(false);
    setTimeout(()=>setSubmitted(false),2500)};

  const dp=getDisplay();
  const THRESHOLD=10;
  const tvFn=p=>(p.v||0)+(votes[p.id]?1:0);
  const tnFn=p=>(p.n||0)+(myNeeds[p.id]?1:0);
  const maxV=dp.length>0?tvFn(dp[0]):1;
  const confirmedCount=dp.filter(p=>tvFn(p)>=THRESHOLD).length;
  const issueCount=dp.filter(p=>tvFn(p)<THRESHOLD).length;
  const aCats=[...new Set(visibleProbs.map(p=>p.cat))];const label=locked?locked.name:"Visible Area";
  const th=dark?{bg:"#0e0f14",sf:"#16171e",bd:"#262938",tx:"#e0e2ea",tm:"#6a6d82",ac:"#5b7cfa",as:"rgba(91,124,250,0.08)",cd:"#191a24",sh:"rgba(0,0,0,0.5)",mb:"#111218"}
    :{bg:"#f3f4f6",sf:"#ffffff",bd:"#e0e2e8",tx:"#181920",tm:"#6a6d80",ac:"#4a6cf7",as:"rgba(74,108,247,0.05)",cd:"#f4f5f8",sh:"rgba(0,0,0,0.04)",mb:"#eaecf0"};

  const sidebarContent=<>
    <div style={{padding:"10px 14px",borderBottom:`1px solid ${th.bd}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {locked&&<button onClick={()=>{setLocked(null);R.current.locked=null;applyColors(tRef.current.k);setTimeout(()=>computeVisible(),10)}} style={{background:"none",border:"none",color:th.tm,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>✕</button>}
          <span style={{fontSize:15,fontWeight:800,letterSpacing:"-0.02em"}}>{label}</span>
          <span style={{fontSize:11,color:th.tm,fontWeight:500}}>{confirmedCount} problem{confirmedCount!==1?'s':''}{issueCount>0?` · ${issueCount} issue${issueCount!==1?'s':''}`:''}</span>
        </div>
        <div style={{display:"flex",gap:3}}>
          {[["votes","Top"],["urgent","Urgent"],["newest","New"],["rising","Rising"]].map(([k,l])=><button key={k} className="sb" onClick={()=>setSortBy(k)} style={{padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:600,border:sortBy===k?`1.5px solid ${k==='urgent'?'#f59e0b':th.ac}`:`1px solid ${th.bd}`,background:sortBy===k?(k==='urgent'?'#f59e0b12':th.as):"transparent",color:sortBy===k?(k==='urgent'?'#f59e0b':th.ac):th.tm,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>)}
        </div>
      </div>
      <div style={{position:"relative"}}>
        <input className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search problems…"
          style={{width:"100%",padding:"7px 10px 7px 28px",borderRadius:8,fontSize:12,fontWeight:500,border:`1px solid ${th.bd}`,background:th.bg,color:th.tx,outline:"none",fontFamily:"inherit",transition:"border-color 0.2s"}}
          onFocus={e=>e.target.style.borderColor=th.ac} onBlur={e=>e.target.style.borderColor=th.bd}/>
        <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:12,color:th.tm,pointerEvents:"none"}}>⌕</span>
      </div>
    </div>
    <div style={{padding:"7px 12px",borderBottom:`1px solid ${th.bd}`,display:"flex",gap:4,flexWrap:"wrap"}}>
      {["All",...aCats].map(c=><button key={c} className="cp" onClick={()=>setFilterCat(c)} style={{padding:"3px 9px",borderRadius:14,fontSize:9,fontWeight:600,border:filterCat===c?`1.5px solid ${th.ac}`:`1px solid ${th.bd}`,background:filterCat===c?th.as:"transparent",color:filterCat===c?th.ac:th.tm,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0}}>{c}</button>)}</div>
    <div style={{flex:1,overflowY:"auto",padding:"6px 10px"}}>
      {dp.length===0?<div style={{textAlign:"center",padding:"40px 16px",color:th.tm,animation:"fadeIn 0.3s ease"}}><div style={{fontSize:32,marginBottom:8,opacity:0.35}}>🌍</div><p style={{fontSize:13,fontWeight:600}}>No problems found</p><p style={{fontSize:11,marginTop:3}}>{search?"Try different search terms":"Zoom out or change filter"}</p></div>
      :dp.map((p,i)=>{const pv=tvFn(p);const pn=tnFn(p);const bw=Math.max(6,(pv/maxV)*100);const cc=CC[p.cat]||"#888";const isIssue=pv<THRESHOLD;
        return <div key={p.id+i} className="pc" style={{padding:"11px 13px",marginBottom:5,borderRadius:9,background:th.cd,border:`1px solid ${isIssue?th.bd:cc+'20'}`,position:"relative",overflow:"hidden",cursor:"default",opacity:isIssue?0.7:1,animation:`fadeIn 0.2s ease ${Math.min(i*0.02,0.25)}s both`}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${bw}%`,background:`linear-gradient(90deg,${cc}0d,transparent)`}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:cc,boxShadow:`0 0 5px ${cc}50`}}/>
                <span style={{fontSize:9,fontWeight:700,color:cc,textTransform:"uppercase",letterSpacing:"0.06em"}}>{p.cat}</span>
                {isIssue&&<span style={{fontSize:8,fontWeight:700,color:th.tm,background:th.bd,padding:"1px 6px",borderRadius:4}}>ISSUE · {THRESHOLD-pv} more</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                {p.sub&&<span style={{fontSize:8.5,color:th.tm,fontWeight:500,background:th.as,padding:"1px 5px",borderRadius:6}}>{p.sub}</span>}
                <span style={{fontSize:8.5,color:th.tm,fontWeight:500,background:th.as,padding:"1px 5px",borderRadius:6}}>{p.co?.length>18?p.co.split(" ").map(w=>w[0]).join(""):p.co}</span>
              </div>
            </div>
            <p style={{margin:"0 0 8px",fontSize:12.5,lineHeight:1.45,fontWeight:500}}>{p.desc}</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11.5,color:th.tm,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                  <span style={{color:th.ac,fontSize:10}}>▲</span>{pv.toLocaleString()}
                </span>
                {pn>0&&<span style={{fontSize:10,color:"#f59e0b",fontWeight:700,display:"flex",alignItems:"center",gap:3}}>
                  <span style={{fontSize:9}}>⚡</span>{pn.toLocaleString()} need{pn!==1?'s':''}
                </span>}
              </div>
              <div style={{display:"flex",gap:4}}>
                <button className="vb" onClick={()=>{
                  setVotes(prev=>{const n={...prev};if(n[p.id]){delete n[p.id];setMyNeeds(pv=>{const nn={...pv};delete nn[p.id];return nn})}else{n[p.id]=true}return n})
                }} style={{background:votes[p.id]?th.as:"transparent",border:`1px solid ${votes[p.id]?th.ac+'40':th.bd}`,color:votes[p.id]?th.ac:th.tm,borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  {votes[p.id]?"✓ Voted":"▲ +1"}
                </button>
                {votes[p.id]&&<button onClick={()=>setMyNeeds(prev=>{const n={...prev};if(n[p.id])delete n[p.id];else n[p.id]=true;return n})}
                  style={{background:myNeeds[p.id]?"#f59e0b18":"transparent",border:`1px solid ${myNeeds[p.id]?"#f59e0b40":th.bd}`,color:myNeeds[p.id]?"#f59e0b":th.tm,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  ⚡ Need
                </button>}
              </div>
            </div>
          </div>
        </div>})}</div>
  </>;

  return(<div style={{width:"100%",height:"100vh",background:th.bg,color:th.tx,fontFamily:"'Outfit',system-ui,sans-serif",display:"flex",flexDirection:"column",overflow:"hidden",transition:"background 0.3s"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${th.bd};border-radius:10px}
      .vb:hover{background:${th.as}!important;border-color:${th.ac}!important;color:${th.ac}!important}
      .cp:hover{border-color:${th.ac}80!important}.pc:hover{border-color:${th.ac}30!important;transform:translateX(2px)}.sb:hover{background:${th.as}!important}
      .pc{transition:border-color 0.15s,transform 0.15s!important}
      .hi::placeholder{color:${th.tm};font-style:italic}
      .hi:focus{border-color:${th.ac}!important;box-shadow:0 0 0 3px ${th.ac}18}
      .search-input::placeholder{color:${th.tm}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes pulse{0%,100%{opacity:0.7}50%{opacity:1}}
      @keyframes popIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
      @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

    <header style={{borderBottom:`1px solid ${th.bd}`,background:th.sf,zIndex:30,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:isMobile?8:12,padding:isMobile?"8px 10px":"8px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?6:10,flexShrink:0}}>
          <div style={{width:isMobile?28:30,height:isMobile?28:30,borderRadius:8,background:`linear-gradient(135deg,${th.ac},#a78bfa)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:isMobile?12:14,fontWeight:800}}>?</div>
          {!isMobile&&<span style={{fontSize:15,fontWeight:800,letterSpacing:"-0.04em"}}>whatsurprob</span>}
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:isMobile?6:8}}>
          <input className="hi" value={formDesc} onChange={e=>setFormDesc(e.target.value)} placeholder="whats your problem?"
            onFocus={()=>{if(!userLoc&&!locating)requestLoc();setSubmitOpen(true)}}
            style={{flex:1,padding:isMobile?"8px 10px":"9px 14px",borderRadius:10,fontSize:isMobile?12:13,fontWeight:500,border:`1.5px solid ${th.bd}`,background:th.bg,color:th.tx,outline:"none",fontFamily:"inherit",transition:"all 0.2s",minWidth:0}}/>
          {submitOpen&&<select value={formCat} onChange={e=>setFormCat(e.target.value)}
            style={{padding:isMobile?"8px 4px":"9px 8px",borderRadius:10,fontSize:isMobile?11:12,fontWeight:500,border:`1.5px solid ${th.bd}`,background:th.bg,color:formCat?th.tx:th.tm,outline:"none",fontFamily:"inherit",minWidth:isMobile?80:100,flexShrink:0,cursor:"pointer"}}>
            <option value="">Category</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>}
          {submitOpen&&<button onClick={handleSubmit} disabled={!canSubmit}
            style={{padding:isMobile?"8px 12px":"9px 18px",borderRadius:10,border:"none",background:!canSubmit?th.bd:th.ac,color:!canSubmit?th.tm:"#fff",fontSize:isMobile?11:12,fontWeight:700,fontFamily:"inherit",cursor:!canSubmit?"not-allowed":"pointer",whiteSpace:"nowrap",flexShrink:0}}>Report</button>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          {!isMobile&&<button onClick={()=>setShowDots(!showDots)} style={{background:showDots?th.as:"transparent",border:`1px solid ${showDots?th.ac+'25':th.bd}`,color:showDots?th.ac:th.tm,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}} title="Toggle dots">●</button>}
          {!isMobile&&<button onClick={()=>{if(zoomBeh.current&&svgRef.current)d3.select(svgRef.current).transition().duration(600).call(zoomBeh.current.transform,d3.zoomIdentity);setLocked(null);R.current.locked=null}} style={{background:"transparent",border:`1px solid ${th.bd}`,color:th.tm,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}} title="Reset">↺</button>}
          <button onClick={toggleDark} style={{background:"transparent",border:`1px solid ${th.bd}`,color:th.tm,width:isMobile?30:32,height:isMobile?30:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?12:13}}>{dark?"☀":"☽"}</button>
        </div>
      </div>
      {submitOpen&&<div style={{padding:isMobile?"0 10px 6px":"0 16px 8px",display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10.5,color:th.tm,fontWeight:500}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:userLoc?"#22c55e":locating?th.ac:"#ef4444",animation:locating?"pulse 1s infinite":"none"}}/>
          {locating?"Detecting location…":userLoc?`Posting from ${userCountry||'Unknown'}`:"Location needed"}
          {!userLoc&&!locating&&<button onClick={requestLoc} style={{background:th.ac,color:"#fff",border:"none",borderRadius:5,padding:"2px 8px",fontSize:9.5,fontWeight:600,cursor:"pointer",marginLeft:4}}>Enable</button>}
        </div>
        {submitted&&<span style={{marginLeft:"auto",color:th.ac,fontWeight:700,fontSize:11,animation:"fadeIn 0.2s ease"}}>✓ Problem reported!</span>}
      </div>}
    </header>

    <div style={{flex:1,display:"flex",flexDirection:isMobile?"column":"row",overflow:"hidden",position:"relative"}}>
      <div ref={containerRef} style={{flex:1,position:"relative",overflow:"hidden",background:th.mb}}>
        {loading?<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
          <div style={{width:36,height:36,border:`3px solid ${th.bd}`,borderTopColor:th.ac,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
          <p style={{color:th.tm,fontSize:13,fontWeight:500}}>Loading map…</p></div>
        :<svg ref={svgRef} style={{width:"100%",height:"100%",display:"block"}}><g ref={gRef}/></svg>}
        {tip.show&&<div style={{position:"absolute",left:tip.x,top:tip.y,transform:"translate(-50%,-100%)",pointerEvents:"none",background:th.sf,border:`1px solid ${th.bd}`,borderRadius:10,padding:"8px 14px",zIndex:50,boxShadow:`0 4px 20px ${th.sh}`,animation:"fadeIn 0.1s ease"}}>
          <p style={{fontSize:13,fontWeight:700}}>{tip.name}</p>
          <p style={{fontSize:11,color:th.tm,fontWeight:500,marginTop:2}}>{tip.count>0?`${tip.count} problems reported`:"No problems reported yet"}</p>
          <p style={{fontSize:10,color:th.ac,fontWeight:600,marginTop:2}}>Click to filter</p></div>}
        {!isMobile&&<div style={{position:"absolute",bottom:12,left:12,background:`${th.sf}e8`,backdropFilter:"blur(8px)",border:`1px solid ${th.bd}`,borderRadius:8,padding:"5px 12px",fontSize:10,color:th.tm,display:"flex",alignItems:"center",gap:8,zIndex:20}}>
          <span style={{fontWeight:600}}>{zoomK.toFixed(1)}x</span>
          <div style={{width:40,height:3,background:th.bd,borderRadius:2}}><div style={{width:`${Math.min(100,(zoomK/25)*100)}%`,height:"100%",background:th.ac,borderRadius:2,transition:"width 0.15s"}}/></div>
          {zoomK>2.5&&<span style={{color:th.ac,fontWeight:600}}>States visible</span>}</div>}
        {isMobile&&<button onClick={()=>setSheetOpen(!sheetOpen)} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",background:th.sf,border:`1px solid ${th.bd}`,borderBottom:"none",borderRadius:"12px 12px 0 0",padding:"8px 24px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",zIndex:20,boxShadow:`0 -2px 10px ${th.sh}`}}>
          <div style={{width:32,height:3,borderRadius:2,background:th.bd}}/><span style={{fontSize:11,fontWeight:700,color:th.tx}}>{dp.length} problem{dp.length!==1?'s':''}</span></button>}
      </div>
      {!isMobile&&<div style={{width:380,background:th.sf,borderLeft:`1px solid ${th.bd}`,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:`-4px 0 20px ${th.sh}`}}>{sidebarContent}</div>}
      {isMobile&&sheetOpen&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:"65vh",background:th.sf,borderTop:`1px solid ${th.bd}`,borderRadius:"16px 16px 0 0",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:`0 -4px 20px ${th.sh}`,zIndex:25,animation:"slideUp 0.25s ease"}}>
        <div onClick={()=>setSheetOpen(false)} style={{padding:"10px 0 6px",display:"flex",justifyContent:"center",cursor:"pointer",flexShrink:0}}><div style={{width:36,height:4,borderRadius:2,background:th.bd}}/></div>
        {sidebarContent}</div>}
    </div>

    {showWelcome&&<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)",animation:"fadeIn 0.3s ease",padding:isMobile?12:0}} onClick={()=>setShowWelcome(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:th.sf,borderRadius:20,padding:isMobile?"28px 20px 22px":"36px 32px 28px",maxWidth:460,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",animation:"popIn 0.35s ease",maxHeight:isMobile?"85vh":"none",overflowY:isMobile?"auto":"visible"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${th.ac},#a78bfa)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,fontWeight:800,flexShrink:0}}>?</div>
          <div><h2 style={{fontSize:isMobile?20:22,fontWeight:800,letterSpacing:"-0.04em",lineHeight:1}}>whatsurprob</h2>
            <p style={{fontSize:10,color:th.tm,letterSpacing:"0.08em",fontWeight:500,marginTop:2}}>THE WORLD'S PROBLEMS, MAPPED</p></div></div>
        <p style={{fontSize:isMobile?13:14,lineHeight:1.6,fontWeight:500,marginBottom:6,color:th.tx}}>The first step to solving any problem is becoming aware it exists.</p>
        <p style={{fontSize:isMobile?12:13,lineHeight:1.6,fontWeight:400,marginBottom:16,color:th.tm}}>This is a place to see what's wrong in the world — and come together around it. Report real problems, vote on what matters, and help the most important issues rise to the top.</p>
        <div style={{background:th.bg,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <p style={{fontSize:12,fontWeight:700,color:th.ac,marginBottom:8,letterSpacing:"0.03em"}}>HOW IT WORKS</p>
          <p style={{fontSize:isMobile?11.5:12.5,lineHeight:1.55,color:th.tx,fontWeight:500}}>
            <span style={{fontWeight:700}}>Explore</span> — pan and zoom the map. Zoomed out you'll see global problems. Zoom into your area to find what matters closest to home — that's a great place to start.
            <br/><span style={{fontWeight:700}}>Report</span> — type your problem in the top bar. It gets tagged to your country, not your exact location.
            <br/><span style={{fontWeight:700}}>Vote</span> — hit +1 on problems you recognize. After 10 votes, an issue becomes a confirmed problem.
            <br/><span style={{fontWeight:700}}>Flag needs</span> — after voting, you can also flag a problem as a basic human need. This helps surface the most critical issues.
          </p></div>
        <div style={{background:dark?"#1a1520":"#faf5ff",borderRadius:12,padding:"14px 16px",marginBottom:22,border:`1px solid ${dark?"#2d2440":"#ede4f7"}`}}>
          <p style={{fontSize:12,fontWeight:700,color:"#a78bfa",marginBottom:6}}>A NOTE ON WHAT YOU POST</p>
          <p style={{fontSize:isMobile?11:12,lineHeight:1.6,color:th.tx,fontWeight:500}}>This is an attempt to help humanity solve real problems. Posting garbage, hate, or jokes here isn't edgy — it's directly getting in the way of people trying to make things better. The good news? The community ignores it, it gets zero votes, and it quietly disappears. No attention. No reward. Just wasted effort.</p>
          <p style={{fontSize:11.5,lineHeight:1.6,color:th.tm,fontWeight:500,marginTop:8,fontStyle:"italic"}}>Use this for good. The world has enough noise.</p></div>
        <button onClick={()=>setShowWelcome(false)} style={{width:"100%",padding:isMobile?"12px":"13px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${th.ac},#a78bfa)`,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Got it — let me explore</button>
      </div>
    </div>}
  </div>);
}
