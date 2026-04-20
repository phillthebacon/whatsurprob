import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { fetchProblems, fetchDots, fetchMyVotes, submitProblem, castVote, castNeed } from "./api.js";
import { getCountries, getStates, getCities, getSubdivisionLabel, snapCoords } from "./geo.js";

// Demo mode toggle — set VITE_USE_SEED_DATA=true in .env.local for local testing with fake data
const USE_SEED = import.meta.env?.VITE_USE_SEED_DATA === 'true';

const CATEGORIES=["Healthcare","Education","Environment","Economy","Infrastructure","Safety & Security","Corruption","Housing","Food & Water","Employment","Human Rights","Technology","Transportation","Other"];
const CC={"Healthcare":"#ef4444","Education":"#3b82f6","Environment":"#22c55e","Economy":"#f59e0b","Infrastructure":"#a855f7","Safety & Security":"#f97316","Corruption":"#dc2626","Housing":"#14b8a6","Food & Water":"#10b981","Employment":"#8b5cf6","Human Rights":"#ec4899","Technology":"#0ea5e9","Transportation":"#6366f1","Other":"#6b7280"};
const CID={"004":"Afghanistan","008":"Albania","012":"Algeria","024":"Angola","032":"Argentina","036":"Australia","040":"Austria","050":"Bangladesh","056":"Belgium","068":"Bolivia","070":"Bosnia and Herz.","076":"Brazil","100":"Bulgaria","104":"Myanmar","116":"Cambodia","120":"Cameroon","124":"Canada","140":"Central African Rep.","144":"Sri Lanka","152":"Chile","156":"China","170":"Colombia","178":"Congo","180":"Dem. Rep. Congo","188":"Costa Rica","191":"Croatia","192":"Cuba","196":"Cyprus","203":"Czechia","208":"Denmark","214":"Dominican Rep.","218":"Ecuador","818":"Egypt","222":"El Salvador","226":"Eq. Guinea","232":"Eritrea","233":"Estonia","231":"Ethiopia","246":"Finland","250":"France","266":"Gabon","270":"Gambia","276":"Germany","288":"Ghana","300":"Greece","320":"Guatemala","324":"Guinea","328":"Guyana","332":"Haiti","340":"Honduras","348":"Hungary","352":"Iceland","356":"India","360":"Indonesia","364":"Iran","368":"Iraq","372":"Ireland","376":"Israel","380":"Italy","384":"Côte d'Ivoire","388":"Jamaica","392":"Japan","400":"Jordan","398":"Kazakhstan","404":"Kenya","408":"North Korea","410":"South Korea","414":"Kuwait","417":"Kyrgyzstan","418":"Laos","422":"Lebanon","426":"Lesotho","430":"Liberia","434":"Libya","440":"Lithuania","442":"Luxembourg","450":"Madagascar","454":"Malawi","458":"Malaysia","466":"Mali","478":"Mauritania","484":"Mexico","496":"Mongolia","498":"Moldova","504":"Morocco","508":"Mozambique","516":"Namibia","524":"Nepal","528":"Netherlands","540":"New Caledonia","554":"New Zealand","558":"Nicaragua","562":"Niger","566":"Nigeria","578":"Norway","512":"Oman","586":"Pakistan","591":"Panama","598":"Papua New Guinea","600":"Paraguay","604":"Peru","608":"Philippines","616":"Poland","620":"Portugal","630":"Puerto Rico","634":"Qatar","642":"Romania","643":"Russia","646":"Rwanda","682":"Saudi Arabia","686":"Senegal","688":"Serbia","694":"Sierra Leone","702":"Singapore","703":"Slovakia","704":"Vietnam","705":"Slovenia","706":"Somalia","710":"South Africa","716":"Zimbabwe","724":"Spain","728":"South Sudan","729":"Sudan","740":"Suriname","748":"Eswatini","752":"Sweden","756":"Switzerland","760":"Syria","762":"Tajikistan","764":"Thailand","768":"Togo","780":"Trinidad and Tobago","788":"Tunisia","792":"Turkey","795":"Turkmenistan","800":"Uganda","804":"Ukraine","784":"United Arab Emirates","826":"United Kingdom","834":"Tanzania","840":"United States of America","858":"Uruguay","860":"Uzbekistan","862":"Venezuela","887":"Yemen","894":"Zambia"};
const USS={"01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California","08":"Colorado","09":"Connecticut","10":"Delaware","11":"District of Columbia","12":"Florida","13":"Georgia","15":"Hawaii","16":"Idaho","17":"Illinois","18":"Indiana","19":"Iowa","20":"Kansas","21":"Kentucky","22":"Louisiana","23":"Maine","24":"Maryland","25":"Massachusetts","26":"Michigan","27":"Minnesota","28":"Mississippi","29":"Missouri","30":"Montana","31":"Nebraska","32":"Nevada","33":"New Hampshire","34":"New Jersey","35":"New Mexico","36":"New York","37":"North Carolina","38":"North Dakota","39":"Ohio","40":"Oklahoma","41":"Oregon","42":"Pennsylvania","44":"Rhode Island","45":"South Carolina","46":"South Dakota","47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont","51":"Virginia","53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming"};

// Map country names from Natural Earth dataset -> ISO2 codes (for csc lookup)
const NAME_TO_ISO2 = {
  "Afghanistan":"AF","Albania":"AL","Algeria":"DZ","Angola":"AO","Argentina":"AR","Australia":"AU","Austria":"AT","Bangladesh":"BD","Belgium":"BE","Bolivia":"BO","Bosnia and Herz.":"BA","Brazil":"BR","Bulgaria":"BG","Myanmar":"MM","Cambodia":"KH","Cameroon":"CM","Canada":"CA","Central African Rep.":"CF","Sri Lanka":"LK","Chile":"CL","China":"CN","Colombia":"CO","Congo":"CG","Dem. Rep. Congo":"CD","Costa Rica":"CR","Croatia":"HR","Cuba":"CU","Cyprus":"CY","Czechia":"CZ","Denmark":"DK","Dominican Rep.":"DO","Ecuador":"EC","Egypt":"EG","El Salvador":"SV","Eq. Guinea":"GQ","Eritrea":"ER","Estonia":"EE","Ethiopia":"ET","Finland":"FI","France":"FR","Gabon":"GA","Gambia":"GM","Germany":"DE","Ghana":"GH","Greece":"GR","Guatemala":"GT","Guinea":"GN","Guyana":"GY","Haiti":"HT","Honduras":"HN","Hungary":"HU","Iceland":"IS","India":"IN","Indonesia":"ID","Iran":"IR","Iraq":"IQ","Ireland":"IE","Israel":"IL","Italy":"IT","Côte d'Ivoire":"CI","Jamaica":"JM","Japan":"JP","Jordan":"JO","Kazakhstan":"KZ","Kenya":"KE","North Korea":"KP","South Korea":"KR","Kuwait":"KW","Kyrgyzstan":"KG","Laos":"LA","Lebanon":"LB","Lesotho":"LS","Liberia":"LR","Libya":"LY","Lithuania":"LT","Luxembourg":"LU","Madagascar":"MG","Malawi":"MW","Malaysia":"MY","Mali":"ML","Mauritania":"MR","Mexico":"MX","Mongolia":"MN","Moldova":"MD","Morocco":"MA","Mozambique":"MZ","Namibia":"NA","Nepal":"NP","Netherlands":"NL","New Caledonia":"NC","New Zealand":"NZ","Nicaragua":"NI","Niger":"NE","Nigeria":"NG","Norway":"NO","Oman":"OM","Pakistan":"PK","Panama":"PA","Papua New Guinea":"PG","Paraguay":"PY","Peru":"PE","Philippines":"PH","Poland":"PL","Portugal":"PT","Puerto Rico":"PR","Qatar":"QA","Romania":"RO","Russia":"RU","Rwanda":"RW","Saudi Arabia":"SA","Senegal":"SN","Serbia":"RS","Sierra Leone":"SL","Singapore":"SG","Slovakia":"SK","Vietnam":"VN","Slovenia":"SI","Somalia":"SO","South Africa":"ZA","Zimbabwe":"ZW","Spain":"ES","South Sudan":"SS","Sudan":"SD","Suriname":"SR","Eswatini":"SZ","Sweden":"SE","Switzerland":"CH","Syria":"SY","Tajikistan":"TJ","Thailand":"TH","Togo":"TG","Trinidad and Tobago":"TT","Tunisia":"TN","Turkey":"TR","Turkmenistan":"TM","Uganda":"UG","Ukraine":"UA","United Arab Emirates":"AE","United Kingdom":"GB","Tanzania":"TZ","United States of America":"US","Uruguay":"UY","Uzbekistan":"UZ","Venezuela":"VE","Yemen":"YE","Zambia":"ZM"
};

function decodeTopo(topology,objKey,nameMap){
  function da(t,ai){let x=0,y=0;const a=t.arcs[ai<0?~ai:ai];const p=a.map(c=>{x+=c[0];y+=c[1];return t.transform?[x*t.transform.scale[0]+t.transform.translate[0],y*t.transform.scale[1]+t.transform.translate[1]]:[x,y]});return ai<0?p.reverse():p}
  function dr(t,arcs){const r=[];arcs.forEach(ai=>{const p=da(t,ai);p.forEach((pt,i)=>{if(i>0||r.length===0)r.push(pt)})});return r}
  function dg(t,g){if(g.type==="Polygon")return{type:"Polygon",coordinates:g.arcs.map(r=>dr(t,r))};if(g.type==="MultiPolygon")return{type:"MultiPolygon",coordinates:g.arcs.map(p=>p.map(r=>dr(t,r)))};return{type:g.type,coordinates:[]}}
  const obj=topology.objects[objKey];if(!obj)return null;
  const geoms=obj.type==="GeometryCollection"?obj.geometries:[obj];
  return{type:"FeatureCollection",features:geoms.map(g=>({type:"Feature",id:g.id,properties:{name:(nameMap&&nameMap[g.id])||g.properties?.name||g.properties?.NAME||"Unknown"},geometry:dg(topology,g)}))}
}

// Seed data only used when USE_SEED env flag is set (demo mode)
const SEED_RAW=[
  {co:"United States of America",sub:"California",cat:"Housing",desc:"Housing prices have far outpaced wages",v:847,n:420,lat:36.7,lng:-122.4},
  {co:"United States of America",sub:"Oklahoma",cat:"Environment",desc:"Earthquake frequency linked to wastewater injection",v:380,n:90,lat:35.5,lng:-97.5},
  {co:"United States of America",sub:"Oklahoma",cat:"Education",desc:"Teacher pay among lowest in the nation",v:470,n:150,lat:36.1,lng:-96.0},
  {co:"United Kingdom",cat:"Healthcare",desc:"NHS waiting times are dangerously long",v:720,n:580,lat:51.5,lng:-0.1},
  {co:"India",cat:"Environment",desc:"Air pollution at dangerous levels in cities",v:890,n:750,lat:28.6,lng:77.2},
  {co:"Brazil",cat:"Environment",desc:"Deforestation of the Amazon accelerating",v:850,n:380,lat:-3.1,lng:-60.0},
];
const SEED = USE_SEED ? SEED_RAW.map((p,i)=>({
  id:'s'+i,
  description:p.desc, category:p.cat, country:p.co, subdivision:p.sub||null,
  city:null, granularity:p.sub?'subdivision':'country',
  lat:p.lat, lng:p.lng, votes:p.v, needs:p.n
})) : [];

const SUBS_COUNTRIES=new Set(["United States of America"]);

// Adapter: converts a DB row (description, category, country, subdivision, votes, needs)
// to the shorthand shape the UI renders (desc, cat, co, sub, v, n).
// We keep the UI code using the old shorthand so rendering logic is unchanged.
function rowToUi(r) {
  return {
    id: r.id,
    desc: r.description,
    cat: r.category,
    co: r.country,
    sub: r.subdivision,
    city: r.city,
    gran: r.granularity,
    lat: r.lat,
    lng: r.lng,
    v: r.votes || 0,
    n: r.needs || 0,
  };
}

export default function App() {
  const[worldGeo,setWorldGeo]=useState(null);
  const[statesGeo,setStatesGeo]=useState(null);
  const[loading,setLoading]=useState(true);
  const[dark,setDark]=useState(()=>{try{return localStorage.getItem('wup-dark')==='true'}catch(e){return false}});
  const toggleDark=()=>{const n=!dark;setDark(n);try{localStorage.setItem('wup-dark',n?'true':'false')}catch(e){}};

  // DB-backed state (replaces SEED for production)
  const[dbProblems,setDbProblems]=useState(SEED); // for sidebar list
  const[dbDots,setDbDots]=useState(SEED); // for map dots (wider scope)

  // Per-session vote tracking — restored from DB on load so votes persist across browsers w/ same session
  const[votes,setVotes]=useState({});
  const[myNeeds,setMyNeeds]=useState({});

  const[locked,setLocked]=useState(null);
  const[visibleProbs,setVisibleProbs]=useState([]);
  const[sortBy,setSortBy]=useState("votes");
  const[filterCat,setFilterCat]=useState("All");

  // Submit form state
  const[submitOpen,setSubmitOpen]=useState(false);
  const[formCat,setFormCat]=useState("");
  const[formDesc,setFormDesc]=useState("");
  const[formGran,setFormGran]=useState("country"); // 'country' | 'subdivision' | 'city'
  const[formCountryIso,setFormCountryIso]=useState(""); // ISO2
  const[formCountryName,setFormCountryName]=useState("");
  const[formStateCode,setFormStateCode]=useState("");
  const[formStateName,setFormStateName]=useState("");
  const[formCityName,setFormCityName]=useState("");
  const[countriesList,setCountriesList]=useState([]);
  const[statesList,setStatesList]=useState([]);
  const[citiesList,setCitiesList]=useState([]);
  const[submitted,setSubmitted]=useState(false);
  const[submitting,setSubmitting]=useState(false);

  // Auto-detected location — used as default for the granularity picker
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
  const R=useRef({});R.current={dark,locked,dbProblems,dbDots,votes,showDots};

  // Load world map data
  useEffect(()=>{
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r=>r.json()).then(topo=>{setWorldGeo(decodeTopo(topo,"countries",CID));setLoading(false)}).catch(()=>setLoading(false));
    fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then(r=>r.json()).then(topo=>{setStatesGeo(decodeTopo(topo,"states",USS))}).catch(()=>{});
  },[]);

  // Load DB data on mount (skipped in demo mode)
  useEffect(()=>{
    if (USE_SEED) return;
    (async ()=>{
      const [dots, myV] = await Promise.all([fetchDots(), fetchMyVotes()]);
      setDbDots(dots.map(rowToUi));
      setDbProblems(dots.map(rowToUi)); // initial — viewport fetch will replace
      setVotes(myV.votes);
      setMyNeeds(myV.needs);
    })();
  },[]);

  // Load countries list for the form (lazy — only when form opens)
  useEffect(()=>{
    if (!submitOpen || countriesList.length > 0) return;
    getCountries().then(list => setCountriesList(list)).catch(e => console.error('getCountries:', e));
  },[submitOpen, countriesList.length]);

  // Fetch states when country changes
  useEffect(()=>{
    if (!formCountryIso) { setStatesList([]); return; }
    getStates(formCountryIso).then(list => setStatesList(list || [])).catch(()=>setStatesList([]));
    setFormStateCode(""); setFormStateName(""); setFormCityName(""); setCitiesList([]);
  },[formCountryIso]);

  // Fetch cities when state changes
  useEffect(()=>{
    if (!formCountryIso || !formStateCode) { setCitiesList([]); return; }
    getCities(formCountryIso, formStateCode).then(list => setCitiesList(list || [])).catch(()=>setCitiesList([]));
    setFormCityName("");
  },[formCountryIso, formStateCode]);

  // Compute which problems are visible based on viewport (uses dbProblems)
  const computeVisible=useCallback(()=>{
    const proj=projRef.current,svg=svgRef.current,t=tRef.current,r=R.current;
    if(!proj||!svg)return;
    const rect=svg.getBoundingClientRect();const W=rect.width,H=rect.height;
    const ap=r.dbProblems;const lk=r.locked;const mw=mwRef.current;
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
    const ap=R.current.dbDots;const mw=mwRef.current;
    const clusters={};
    ap.forEach(p=>{if(p.lat==null||p.lng==null)return;const rk=Math.round(p.lat*2)/2+','+Math.round(p.lng*2)/2;
      if(!clusters[rk])clusters[rk]={lat:p.lat,lng:p.lng,count:0,topCat:p.cat,maxV:0};clusters[rk].count++;
      if((p.v||0)>clusters[rk].maxV){clusters[rk].maxV=p.v||0;clusters[rk].topCat=p.cat}});
    const maxC=Math.max(...Object.values(clusters).map(c=>c.count),1);const k=t.k;
    Object.values(clusters).forEach(cl=>{const[px,py]=proj([cl.lng,cl.lat]);const r=Math.max(1.5,(2+cl.count/maxC*4)/k);const color=CC[cl.topCat]||"#888";
      [-mw,0,mw].forEach(ox=>{g.append("circle").attr("cx",px+ox).attr("cy",py).attr("r",r).attr("fill",color).attr("fill-opacity",0.7).attr("stroke",color).attr("stroke-opacity",0.3).attr("stroke-width",r*0.8).style("pointer-events","none")})});
  },[]);

  const[mapSize,setMapSize]=useState({w:0,h:0});

  useEffect(()=>{
    const el=containerRef.current;if(!el)return;
    const ro=new ResizeObserver(()=>{
      const w=el.clientWidth,h=el.clientHeight;
      if(w>0&&h>0)setMapSize({w,h});
    });
    ro.observe(el);
    return()=>ro.disconnect();
  },[]);

  // Fetch viewport problems when map moves (debounced)
  const fetchTimer = useRef(null);
  const refreshViewport = useCallback(()=>{
    if (USE_SEED) return;
    const proj=projRef.current, svg=svgRef.current, t=tRef.current;
    if (!proj || !svg) return;
    const rect = svg.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    // Figure out map bounds in lat/lng
    const tl = proj.invert([(0 - t.x) / t.k, (0 - t.y) / t.k]);
    const br = proj.invert([(W - t.x) / t.k, (H - t.y) / t.k]);
    if (!tl || !br) return;
    const bounds = {
      north: Math.min(90, Math.max(tl[1], br[1])),
      south: Math.max(-90, Math.min(tl[1], br[1])),
      west: Math.max(-180, Math.min(tl[0], br[0])),
      east: Math.min(180, Math.max(tl[0], br[0])),
    };
    clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(async ()=>{
      const rows = await fetchProblems(bounds);
      setDbProblems(rows.map(rowToUi));
    }, 300);
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
      const smw=mw*k;
      x=((x%smw)+smw)%smw;
      if(x>smw/2)x-=smw;
      const mapPixelH=(yB-yT)*k;
      if(mapPixelH<=H){
        y=(H-yT*k-yB*k)/2;
      } else {
        const minY=H-yB*k;
        const maxY=-yT*k;
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
      applyColors(k);updateDots();computeVisible();refreshViewport();
    });
    zoomBeh.current=zoom;svg.call(zoom);
    svg.on("click.ds",()=>{R.current.locked=null;setLocked(null)});
    const attachMouse=(sel,level)=>{sel.on("mouseenter",function(ev,d){
      const name=d.properties.name;const ap=R.current.dbProblems;
      const count=level==="country"?ap.filter(p=>p.co===name).length:ap.filter(p=>p.sub===name).length;
      const rect=containerRef.current.getBoundingClientRect();
      setTip({show:true,x:ev.clientX-rect.left,y:ev.clientY-rect.top-14,name,count});
      g.selectAll("."+(level==="country"?"country":"adm1")).filter(function(){return d3.select(this).attr("data-name")===name}).classed("hovered",true);applyColors(tRef.current.k);
    }).on("mousemove",function(ev){const rect=containerRef.current.getBoundingClientRect();setTip(prev=>({...prev,x:ev.clientX-rect.left,y:ev.clientY-rect.top-14}))
    }).on("mouseleave",function(ev,d){setTip(prev=>({...prev,show:false}));g.selectAll("."+d3.select(this).attr("class").split(" ")[0]).filter(function(){return d3.select(this).attr("data-name")===d.properties.name}).classed("hovered",false);applyColors(tRef.current.k)
    }).on("click",function(ev,d){ev.stopPropagation();const name=d.properties.name;const prev=R.current.locked;const next=(prev&&prev.name===name&&prev.level===level)?null:{name,level};R.current.locked=next;setLocked(next);setFilterCat("All");setSearch("");applyColors(tRef.current.k);setTimeout(()=>computeVisible(),10)})};
    attachMouse(g.selectAll(".country"),"country");attachMouse(g.selectAll(".adm1"),"state");
    applyColors(1);updateDots();computeVisible();refreshViewport();
  },[worldGeo,statesGeo,mapSize,computeVisible,updateDots,refreshViewport]);

  function applyColors(k){const r=R.current;const dk=r.dark;const lk=r.locked;const ap=r.dbDots;const show=k>2.5;
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

  useEffect(()=>{if(!gRef.current)return;applyColors(tRef.current.k);updateDots();computeVisible()},[dark,locked,dbProblems.length,dbDots.length,showDots,computeVisible,updateDots]);

  const findCountry=(lat,lng)=>{if(!worldGeo)return"Unknown";const pt=[lng,lat];for(const f of worldGeo.features){if(d3.geoContains(f,pt))return f.properties.name}return"Unknown"};
  const requestLoc=()=>{if(userLoc)return;setLocating(true);navigator.geolocation?.getCurrentPosition(p=>{const loc={lat:p.coords.latitude,lng:p.coords.longitude};setUserLoc(loc);const c=findCountry(loc.lat,loc.lng);setUserCountry(c);const iso=NAME_TO_ISO2[c];if(iso){setFormCountryIso(iso);setFormCountryName(c)}setLocating(false)},()=>{const loc={lat:36.1,lng:-96.0};setUserLoc(loc);const c=findCountry(loc.lat,loc.lng);setUserCountry(c);const iso=NAME_TO_ISO2[c];if(iso){setFormCountryIso(iso);setFormCountryName(c)}setLocating(false)},{timeout:8000})};

  const getDisplay=()=>{
    const agg={};visibleProbs.forEach(p=>{const k=p.cat+'::'+p.desc;if(!agg[k])agg[k]={...p,count:1};else{agg[k].v+=p.v||1;agg[k].n=(agg[k].n||0)+(p.n||0);agg[k].count++}});
    let arr=Object.values(agg);
    if(filterCat!=='All')arr=arr.filter(p=>p.cat===filterCat);
    if(search.trim()){const s=search.toLowerCase();arr=arr.filter(p=>p.desc.toLowerCase().includes(s)||(p.co||'').toLowerCase().includes(s)||(p.sub||'').toLowerCase().includes(s)||(p.city||'').toLowerCase().includes(s)||p.cat.toLowerCase().includes(s))}
    const tv=p=>(p.v||0);
    const tn=p=>(p.n||0);
    if(sortBy==='votes')arr.sort((a,b)=>(tv(b)+tn(b))-(tv(a)+tn(a)));
    else if(sortBy==='urgent')arr.sort((a,b)=>tn(b)-tn(a));
    else if(sortBy==='newest')arr.sort((a,b)=>b.id>a.id?1:-1);
    else if(sortBy==='rising'){arr.sort((a,b)=>tv(b)-tv(a))}
    return arr};

  // canSubmit depends on granularity
  const canSubmit=(()=>{
    if(!formCat || !formDesc.trim() || !formCountryIso) return false;
    if(formGran==='subdivision' && !formStateCode) return false;
    if(formGran==='city' && (!formStateCode || !formCityName)) return false;
    return true;
  })();

  const handleSubmit=async()=>{
    if(!canSubmit || submitting) return;
    setSubmitting(true);

    let lat, lng, subdivision=null, city=null;
    const countryObj = countriesList.find(c=>c.iso2===formCountryIso);
    if (formGran === 'country') {
      lat = parseFloat(countryObj?.latitude ?? 0);
      lng = parseFloat(countryObj?.longitude ?? 0);
    } else if (formGran === 'subdivision') {
      const st = statesList.find(s=>s.iso2===formStateCode || s.state_code===formStateCode);
      lat = parseFloat(st?.latitude ?? countryObj?.latitude ?? 0);
      lng = parseFloat(st?.longitude ?? countryObj?.longitude ?? 0);
      subdivision = formStateName;
    } else { // city
      const ct = citiesList.find(c=>c.name===formCityName);
      const raw = { lat: parseFloat(ct?.latitude ?? 0), lng: parseFloat(ct?.longitude ?? 0) };
      const snapped = snapCoords(raw.lat, raw.lng, 'city');
      lat = snapped.lat; lng = snapped.lng;
      subdivision = formStateName;
      city = formCityName;
    }

    const payload = {
      desc: formDesc.trim(),
      cat: formCat,
      country: formCountryName,
      subdivision, city,
      granularity: formGran,
      lat, lng,
    };

    if (USE_SEED) {
      // Demo mode — just add to local state
      const fake = { id:'u'+Date.now(), description:payload.desc, category:payload.cat,
        country:payload.country, subdivision, city, granularity:formGran,
        lat, lng, votes:1, needs:0 };
      setDbProblems(p=>[rowToUi(fake), ...p]);
      setDbDots(p=>[rowToUi(fake), ...p]);
      setVotes(v=>({...v,[fake.id]:true}));
    } else {
      const row = await submitProblem(payload);
      if (row) {
        const ui = rowToUi(row);
        setDbProblems(p=>[ui, ...p]);
        setDbDots(p=>[ui, ...p]);
        setVotes(v=>({...v,[row.id]:true}));
      }
    }

    setFormCat(''); setFormDesc(''); setFormGran('country');
    setFormStateCode(''); setFormStateName(''); setFormCityName('');
    setSubmitted(true); setSubmitOpen(false); setSubmitting(false);
    setTimeout(()=>setSubmitted(false), 2500);
  };

  // Voting handlers — optimistic UI, syncs with DB
  const handleVote = async (p) => {
    const wasVoted = !!votes[p.id];
    // Optimistic update
    setVotes(prev=>{
      const n={...prev};
      if(n[p.id]){
        delete n[p.id];
        setMyNeeds(pv=>{const nn={...pv};if(nn[p.id]){delete nn[p.id]}return nn});
      } else n[p.id]=true;
      return n;
    });
    setDbProblems(prev => prev.map(x => x.id===p.id ? {...x, v: Math.max(0,(x.v||0)+(wasVoted?-1:1))} : x));
    setDbDots(prev => prev.map(x => x.id===p.id ? {...x, v: Math.max(0,(x.v||0)+(wasVoted?-1:1))} : x));

    if (USE_SEED) return;

    // Sync with DB. If user had a need flag, remove that too.
    const ok = await castVote(p.id, !wasVoted);
    if (!ok) {
      // Server rejected (dupe or error) — re-sync from server
      const myV = await fetchMyVotes();
      setVotes(myV.votes); setMyNeeds(myV.needs);
    }
    if (wasVoted && myNeeds[p.id]) {
      await castNeed(p.id, false);
    }
  };

  const handleNeed = async (p) => {
    const wasSet = !!myNeeds[p.id];
    setMyNeeds(prev=>{const n={...prev};if(n[p.id])delete n[p.id];else n[p.id]=true;return n});
    setDbProblems(prev => prev.map(x => x.id===p.id ? {...x, n: Math.max(0,(x.n||0)+(wasSet?-1:1))} : x));
    setDbDots(prev => prev.map(x => x.id===p.id ? {...x, n: Math.max(0,(x.n||0)+(wasSet?-1:1))} : x));

    if (USE_SEED) return;

    const ok = await castNeed(p.id, !wasSet);
    if (!ok) {
      const myV = await fetchMyVotes();
      setVotes(myV.votes); setMyNeeds(myV.needs);
    }
  };

  const dp=getDisplay();
  const THRESHOLD=10;
  const tvFn=p=>(p.v||0);
  const tnFn=p=>(p.n||0);
  const maxV=dp.length>0?tvFn(dp[0]):1;
  const confirmedCount=dp.filter(p=>tvFn(p)>=THRESHOLD).length;
  const issueCount=dp.filter(p=>tvFn(p)<THRESHOLD).length;
  const aCats=[...new Set(visibleProbs.map(p=>p.cat))];const label=locked?locked.name:"Visible Area";
  const th=dark?{bg:"#0e0f14",sf:"#16171e",bd:"#262938",tx:"#e0e2ea",tm:"#6a6d82",ac:"#5b7cfa",as:"rgba(91,124,250,0.08)",cd:"#191a24",sh:"rgba(0,0,0,0.5)",mb:"#111218"}
    :{bg:"#f3f4f6",sf:"#ffffff",bd:"#e0e2e8",tx:"#181920",tm:"#6a6d80",ac:"#4a6cf7",as:"rgba(74,108,247,0.05)",cd:"#f4f5f8",sh:"rgba(0,0,0,0.04)",mb:"#eaecf0"};

  const subLabel = getSubdivisionLabel(formCountryIso);

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
        const locDisplay = p.city ? `${p.city}, ${p.sub||''}` : (p.sub || '');
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
                {locDisplay&&<span style={{fontSize:8.5,color:th.tm,fontWeight:500,background:th.as,padding:"1px 5px",borderRadius:6}}>{locDisplay}</span>}
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
                <button className="vb" onClick={()=>handleVote(p)} style={{background:votes[p.id]?th.as:"transparent",border:`1px solid ${votes[p.id]?th.ac+'40':th.bd}`,color:votes[p.id]?th.ac:th.tm,borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  {votes[p.id]?"✓ Voted":"▲ +1"}
                </button>
                {votes[p.id]&&<button onClick={()=>handleNeed(p)}
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
          {!isMobile&&<span style={{fontSize:15,fontWeight:800,letterSpacing:"-0.04em"}}>whatsurprob{USE_SEED&&<span style={{fontSize:9,color:"#f59e0b",marginLeft:6,fontWeight:600}}>DEMO</span>}</span>}
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:isMobile?6:8}}>
          <input className="hi" value={formDesc} onChange={e=>setFormDesc(e.target.value)} placeholder="whats your problem?"
            onFocus={()=>{if(!userLoc&&!locating)requestLoc();setSubmitOpen(true)}}
            style={{flex:1,padding:isMobile?"8px 10px":"9px 14px",borderRadius:10,fontSize:isMobile?12:13,fontWeight:500,border:`1.5px solid ${th.bd}`,background:th.bg,color:th.tx,outline:"none",fontFamily:"inherit",transition:"all 0.2s",minWidth:0}}/>
          {submitOpen&&<select value={formCat} onChange={e=>setFormCat(e.target.value)}
            style={{padding:isMobile?"8px 4px":"9px 8px",borderRadius:10,fontSize:isMobile?11:12,fontWeight:500,border:`1.5px solid ${th.bd}`,background:th.bg,color:formCat?th.tx:th.tm,outline:"none",fontFamily:"inherit",minWidth:isMobile?80:100,flexShrink:0,cursor:"pointer"}}>
            <option value="">Category</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>}
          {submitOpen&&<button onClick={handleSubmit} disabled={!canSubmit||submitting}
            style={{padding:isMobile?"8px 12px":"9px 18px",borderRadius:10,border:"none",background:!canSubmit||submitting?th.bd:th.ac,color:!canSubmit||submitting?th.tm:"#fff",fontSize:isMobile?11:12,fontWeight:700,fontFamily:"inherit",cursor:!canSubmit||submitting?"not-allowed":"pointer",whiteSpace:"nowrap",flexShrink:0}}>{submitting?"…":"Report"}</button>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          {!isMobile&&<button onClick={()=>setShowDots(!showDots)} style={{background:showDots?th.as:"transparent",border:`1px solid ${showDots?th.ac+'25':th.bd}`,color:showDots?th.ac:th.tm,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}} title="Toggle dots">●</button>}
          {!isMobile&&<button onClick={()=>{if(zoomBeh.current&&svgRef.current)d3.select(svgRef.current).transition().duration(600).call(zoomBeh.current.transform,d3.zoomIdentity);setLocked(null);R.current.locked=null}} style={{background:"transparent",border:`1px solid ${th.bd}`,color:th.tm,width:32,height:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}} title="Reset">↺</button>}
          <button onClick={toggleDark} style={{background:"transparent",border:`1px solid ${th.bd}`,color:th.tm,width:isMobile?30:32,height:isMobile?30:32,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?12:13}}>{dark?"☀":"☽"}</button>
        </div>
      </div>
      {submitOpen&&<div style={{padding:isMobile?"6px 10px 8px":"6px 16px 10px",display:"flex",flexDirection:"column",gap:6}}>
        {/* Granularity picker */}
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:10.5,color:th.tm,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Scope:</span>
          {[["country","Country"],["subdivision",subLabel],["city","City"]].map(([k,l])=>
            <button key={k} onClick={()=>setFormGran(k)} style={{padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:600,border:formGran===k?`1.5px solid ${th.ac}`:`1px solid ${th.bd}`,background:formGran===k?th.as:"transparent",color:formGran===k?th.ac:th.tm,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
          )}
          <span style={{fontSize:10,color:th.tm,fontStyle:"italic"}}>
            {formGran==='country'?'Posted as country-level (most private)':formGran==='subdivision'?`Posted at ${subLabel.toLowerCase()} level`:'Posted near city (coords rounded for privacy)'}
          </span>
        </div>
        {/* Location selectors */}
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <select value={formCountryIso} onChange={e=>{const iso=e.target.value;setFormCountryIso(iso);const c=countriesList.find(x=>x.iso2===iso);setFormCountryName(c?.name||'')}}
            style={{padding:"6px 8px",borderRadius:8,fontSize:11,fontWeight:500,border:`1px solid ${th.bd}`,background:th.bg,color:formCountryIso?th.tx:th.tm,outline:"none",fontFamily:"inherit",cursor:"pointer",minWidth:140}}>
            <option value="">Select country…</option>
            {countriesList.map(c=><option key={c.iso2} value={c.iso2}>{c.emoji||''} {c.name}</option>)}
          </select>
          {formGran!=='country' && formCountryIso && (
            <select value={formStateCode} onChange={e=>{const code=e.target.value;setFormStateCode(code);const s=statesList.find(x=>(x.iso2||x.state_code)===code);setFormStateName(s?.name||'')}}
              style={{padding:"6px 8px",borderRadius:8,fontSize:11,fontWeight:500,border:`1px solid ${th.bd}`,background:th.bg,color:formStateCode?th.tx:th.tm,outline:"none",fontFamily:"inherit",cursor:"pointer",minWidth:140}}>
              <option value="">Select {subLabel.toLowerCase()}…</option>
              {statesList.map(s=><option key={s.iso2||s.state_code} value={s.iso2||s.state_code}>{s.name}</option>)}
            </select>
          )}
          {formGran==='city' && formStateCode && (
            <select value={formCityName} onChange={e=>setFormCityName(e.target.value)}
              style={{padding:"6px 8px",borderRadius:8,fontSize:11,fontWeight:500,border:`1px solid ${th.bd}`,background:th.bg,color:formCityName?th.tx:th.tm,outline:"none",fontFamily:"inherit",cursor:"pointer",minWidth:140}}>
              <option value="">Select city…</option>
              {citiesList.map(c=><option key={c.id||c.name} value={c.name}>{c.name}</option>)}
            </select>
          )}
          {submitted&&<span style={{marginLeft:"auto",color:th.ac,fontWeight:700,fontSize:11,animation:"fadeIn 0.2s ease"}}>✓ Problem reported!</span>}
        </div>
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
            <span style={{fontWeight:700}}>Explore</span> — pan and zoom the map. Zoomed out you'll see global problems. Zoom in to find what matters closer to home.
            <br/><span style={{fontWeight:700}}>Report</span> — type your problem, pick a scope (country / {subLabel.toLowerCase()} / city). You choose how local it gets — coords are snapped to what you pick for privacy.
            <br/><span style={{fontWeight:700}}>Vote</span> — hit +1 on problems you recognize. One vote per person per problem. After 10 votes, an issue becomes a confirmed problem.
            <br/><span style={{fontWeight:700}}>Flag needs</span> — after voting, flag a problem as a basic human need to help surface the most critical issues.
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
