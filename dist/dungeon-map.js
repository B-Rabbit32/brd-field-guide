const MAP_ROOMS=[
 {id:'entrance',x:110,y:725,label:['Entrance /','keyed shortcuts']},
 {id:'prison',x:270,y:730,label:['Detention Block','Gerstahn · prisoners']},
 {id:'arena',x:430,y:680,label:['Ring of Law','Arena']},
 {id:'garrison',x:430,y:480,label:['East Garrison','Shadowforge Lock']},
 {id:'gallery',x:650,y:550,label:['Upper arena','walkway']},
 {id:'shrine',x:810,y:475,label:['Shrine','Key turn-in']},
 {id:'domicile',x:970,y:565,label:['Domicile','Ramp down']},
 {id:'crafting',x:1070,y:700,label:['Hall of','Crafting']},
 {id:'vault',x:1190,y:610,label:['Black Vault','Heart']},
 {id:'fineous',x:1065,y:825,label:['Fineous','Ironfel']},
 {id:'incendius',x:865,y:870,label:['Black Anvil','Incendius']},
 {id:'highway',x:585,y:815,label:['Dark Iron','Highway']},
 {id:'baelgar',x:400,y:900,label:['Bael’Gar','Use the Molt']},
 {id:'traveler',x:800,y:670,label:['Rugged Traveler','Ever After'],optional:true},
 {id:'west',x:430,y:310,label:['West Garrison']},
 {id:'angerforge',x:230,y:310,label:['Angerforge','First paper']},
 {id:'factory',x:600,y:310,label:['Manufactory']},
 {id:'argelmach',x:600,y:410,label:['Argelmach','Second paper']},
 {id:'bar',x:800,y:310,label:['Grim Guzzler','Hurley · Ribbly · Nagmara']},
 {id:'flamelash',x:990,y:310,label:['Flamelash']},
 {id:'foundry',x:1160,y:310,label:['Mold Foundry']},
 {id:'seven',x:1160,y:135,label:['Summoners’ Tomb','Chalice · Seven']},
 {id:'lyceum',x:970,y:135,label:['Lyceum','Two braziers']},
 {id:'magmus',x:785,y:135,label:['Iron Hall','Magmus']},
 {id:'emperor',x:600,y:135,label:['Imperial Seat','Emperor · Moira']}
];
const MAP_EDGES=[
 ['entrance','prison'],['prison','arena'],['arena','garrison','stairs'],['garrison','gallery','stairs'],['gallery','shrine'],['gallery','domicile'],['domicile','crafting','stairs'],['crafting','vault'],['crafting','fineous','stairs'],['fineous','incendius','stairs'],['incendius','highway','highway'],['highway','baelgar'],['entrance','highway','key'],['entrance','garrison','key'],['domicile','traveler','optional'],['traveler','incendius','portal'],['garrison','west','lock'],['west','angerforge'],['west','factory'],['factory','argelmach'],['factory','bar'],['bar','flamelash'],['flamelash','foundry'],['foundry','seven'],['seven','lyceum'],['lyceum','magmus'],['magmus','emperor']
];
const MAP_PATHS={
 'visit-one':{
  keyless:['entrance','prison','arena','garrison','gallery','domicile','crafting','vault','crafting','fineous','crafting','domicile','gallery','shrine','gallery','domicile','crafting','fineous','incendius','highway','baelgar','highway','entrance','garrison','west','factory','bar'],
  keyed:['entrance','prison','entrance','highway','baelgar','highway','incendius','fineous','crafting','vault','crafting','domicile','gallery','shrine','gallery','garrison','west','factory','bar']
 },
 'visit-two':{keyless:['entrance','prison','entrance','garrison','west','angerforge','west','factory','argelmach','factory','west','garrison','entrance','prison','entrance','garrison','west','factory','bar','flamelash','foundry','seven','lyceum','magmus','emperor']}
};
function getDungeonStages(plan){return DUNGEON.map((stage,i)=>i!==0?stage:{...stage,intro:plan==='keyed'?stage.intro.replace('Default assumes nobody can open the Shadowforge shortcuts.','A party key opens the shorter Highway-first loop.'):stage.intro,steps:plan==='keyed'?KEYED_FIRST_ORDER.map(id=>({...stage.steps.find(s=>s.id===id),...KEYED_OVERRIDES[id]})):stage.steps});}
function mapEdgeKey(a,b){return [a,b].sort().join('|');}
function drawDungeonMap(phase,plan,checked,selected){
 const route=MAP_PATHS[phase]?.[plan]||MAP_PATHS[phase]?.keyless||[];
 const visits={};for(let i=1;i<route.length;i++){const key=mapEdgeKey(route[i-1],route[i]);visits[key]=(visits[key]||0)+1;}
 const stage=getDungeonStages(plan).find(s=>s.id===phase),steps=stage?.steps||[];
 const rooms=Object.fromEntries(MAP_ROOMS.map(r=>[r.id,r]));
 const edgeHTML=MAP_EDGES.map(([from,to,kind])=>{
  const a=rooms[from],b=rooms[to],n=visits[mapEdgeKey(from,to)]||0;
  let d=`M${a.x},${a.y} L${b.x},${b.y}`;
  if(from==='entrance'&&to==='highway')d=`M110,725 L110,815 L585,815`;
  if(from==='entrance'&&to==='garrison')d=`M110,725 L110,480 L430,480`;
  if(from==='garrison'&&to==='gallery')d=`M430,480 L540,480 L540,550 L650,550`;
  if(from==='traveler'&&to==='incendius')d=`M800,670 C735,745 760,835 865,870`;
  return `<path class="map-corridor ${kind||''}${n?' in-route':''}${n>1?' repeated':''}" d="${d}"/><path class="map-edge-hit" d="${d}" pointer-events="none"/>`;
 }).join('');
 const nodesHTML=MAP_ROOMS.map(room=>{
  const tasks=steps.filter(s=>s.room===room.id),done=tasks.filter(s=>checked[s.id]).length;
  const active=route.includes(room.id)||tasks.length,complete=tasks.length&&done===tasks.length;
  return `<g class="map-room${active?' active':''}${complete?' complete':''}${selected===room.id?' selected':''}${room.optional?' optional':''}" data-room="${room.id}" role="button" tabindex="0" aria-label="${room.label.join(' ')}${tasks.length?`, ${done} of ${tasks.length} checks complete`:''}" aria-pressed="${selected===room.id}"><rect x="${room.x-72}" y="${room.y-26}" width="144" height="66" rx="12"/><circle cx="${room.x-57}" cy="${room.y-13}" r="4"/><text x="${room.x}" y="${room.y+1}" text-anchor="middle">${room.label.map((text,i)=>`<tspan x="${room.x}" dy="${i?19:0}" class="${i?'room-subtitle':''}">${text}</tspan>`).join('')}</text></g>`;
 }).join('');
 return `<svg class="dungeon-svg" viewBox="0 0 1280 990" aria-labelledby="dungeon-map-title dungeon-map-desc" role="group"><title id="dungeon-map-title">Blackrock Depths quest route map</title><desc id="dungeon-map-desc">Original schematic of room connections. Rooms are arranged for readability, not geographic scale. Highlighted corridors are the selected visit. Dotted amber corridors are retraced. Select a room for its objective checklist.</desc><rect width="1280" height="990" fill="#131d1f"/><path class="map-district" d="M170 50H1245V390H920L840 410H670V450H350V390H170Z"/><path class="map-district lower" d="M25 430H330L510 470H900L925 510H1245V965H25Z"/><text class="district-label" x="38" y="61">BLACKROCK DEPTHS</text><text class="district-sub" x="38" y="86">QUEST ROUTE ATLAS</text><text class="district-label" x="40" y="405">PRISON + EASTERN / LOWER CITY</text><text class="district-label" x="35" y="213">UPPER CITY</text><text class="district-sub" x="35" y="237">Continue after the key</text>${edgeHTML}<text class="map-callout" x="120" y="565">KEY SHORTCUT</text><text class="map-callout" x="448" y="402">UPPER CROSSING</text><text class="map-callout" x="590" y="873">CLOSES WHEN LOCK IS USED</text><text class="map-callout optional-label" x="675" y="755">ONE-WAY SECRET EXIT</text>${nodesHTML}<text class="district-sub" x="35" y="968">Schematic, not to scale · Solid: selected route · Dotted amber: retrace · Purple: optional one-way detour · Click a room</text></svg>`;
}
function dungeonShell(){return `<div class="section-heading"><div><p class="eyebrow">A QUEST-COMPLETE PLAN · TWO PLANNED VISITS</p><h2>Through the Depths</h2></div><button class="secondary" id="share-guide">Share guide</button></div><p class="intro">First get the key, lower-city objectives and bar pickups. Batch the outside reports and Nagmara’s ingredients. Return for Windsor’s papers, his escort, and Emperor. This minimizes avoidable repeated objectives; drops and group progress can still require another visit.</p><div class="run-plan"><label for="key-plan">First visit: can your party open Shadowforge shortcuts?</label><select id="key-plan"><option value="keyless">No · use the keyless route</option><option value="keyed">Yes · use the shorter keyed loop</option></select><p id="key-plan-note"></p></div><div class="run-tabs" role="group" aria-label="Dungeon visit"><button data-phase="visit-one">1 · Key & bar</button><button data-phase="between-visits">Outside errands</button><button data-phase="visit-two">2 · Papers & Emperor</button></div><div class="run-dashboard"><div><span class="stat-label">THIS LEG</span><strong id="run-progress"></strong></div><div><span class="stat-label">NEXT OBJECTIVE</span><b id="run-next-title"></b></div><button id="run-resume" class="primary">Go to objective</button></div><div id="map-section"><div class="atlas-heading"><div><h3>Dungeon map</h3><span>Click a room for its objectives. Room placement is schematic; corridors show connectivity.</span></div><div class="map-zoom"><button id="zoom-out" aria-label="Zoom map out">−</button><span id="zoom-value">100%</span><button id="zoom-in" aria-label="Zoom map in">+</button></div></div><div class="map-scroll" id="map-scroll"><div id="dungeon-map-canvas"></div></div><div class="map-legend"><span><i></i>Selected route</span><span><i class="backtrack"></i>Repeated corridor</span><span><i class="secret"></i>Optional secret / one-way exit</span><span><i class="finished"></i>Room objectives checked</span></div><div id="room-objectives" class="room-objectives"></div></div><div id="outside-map" hidden><div class="flow"><div><small>CITY REPORTS</small><b>Magni + Maxwell</b><span>Rescue unlocked; Note enabled</span></div><div><small>FIELD TURN-INS</small><b>Flame Crest + Cyrus</b><span>Batch completed objectives</span></div><div><small>KALIMDOR</small><b>Azshara + Un’Goro</b><span>Love Potion ingredients</span></div><div><small>RETURN TO BRD</small><b>Quarry Note farm</b><span>Start item quest before papers</span></div></div></div><div class="notice"><b>The important route gates</b>Finish Incendius and Bael’Gar before lowering the Shadowforge Lock. Accept A Shred of Hope before the paper bosses. Finish the escort before heading beyond the bar. Speak to Moira before leaving Emperor.</div><div id="run-checklists"></div><details class="source route-assumptions"><summary>Why this route, and what can change it?</summary><p>The default first run assumes no Shadowforge Key, all pickup prerequisites completed, and a party willing to stop at the bar. The keyed option is a shorter loop inferred from documented room connections; it saves the Arena and the keyless Fineous-to-Shrine backtrack.</p><p>The Love Potion starts inside and needs a vial filled outside. Including its pickup on visit 1 avoids planning a separate third bar trip. If you prefer a short prison-only first visit, you can still use this checklist, but defer the lower/key/bar objectives and expect another return for Nagmara.</p><p>Roccor, Grebmar, the Dark Coffer and Panzor are not required for these objectives. Kill them only for your group’s goals or if they obstruct your path. The map is original route cartography based on named connections; it is not a scaled minimap or a claim of a measured fastest time.</p>${sourcesHTML([SOURCES.navigation,SOURCES.regions,SOURCES.lock,SOURCES.secretForever])}</details>`;}
