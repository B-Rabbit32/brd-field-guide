'use strict';
const STORAGE_KEY='brd-forever-guide-v2';
const ALL_STAGES=[...STAGES,...DUNGEON,...EXTRAS];
const ALL_IDS=new Set(ALL_STAGES.flatMap(s=>s.steps.map(x=>x.id)));
const ROUTE_STEPS=STAGES.flatMap(s=>s.steps);
const VIEWS=['route','ledger','dungeon','extras','sources'];
const freshState=()=>({version:2,checked:{},notes:'',view:'route',hideDone:false,mapPhase:'visit-one',keyPlan:'keyless'});
let state=freshState();
let selectedRoom='prison',mapZoom=100;
let storageAvailable=true;
function validateState(input){
 if(!input||typeof input!=='object'||![1,2].includes(input.version)||!input.checked||typeof input.checked!=='object')throw new Error('Invalid progress file');
 const checked={};for(const id of ALL_IDS)if(input.checked[id]===true)checked[id]=true;
 if(input.version===1){
  const aliases={'first-bar':['love-pickup'],'love-pickup-deep':['love-pickup'],'papers':['angerforge-info','argelmach-info'],'bar-targets':['hurley-loot','ribbly-loot'],'emperor':['emperor-kill','moira-talk']};
  for(const [old,ids] of Object.entries(aliases))if(input.checked[old]===true)for(const id of ids)checked[id]=true;
 }
 return {version:2,checked,notes:typeof input.notes==='string'?input.notes.slice(0,10000):'',view:VIEWS.includes(input.view)?input.view:'route',hideDone:input.hideDone===true,mapPhase:DUNGEON.some(s=>s.id===input.mapPhase)?input.mapPhase:'visit-one',keyPlan:input.keyPlan==='keyed'?'keyed':'keyless'};
}
try{let saved=localStorage.getItem(STORAGE_KEY);if(!saved){const legacy=Object.keys(localStorage).find(k=>k.startsWith('brd-forever-')&&k.endsWith('-guide-v1'));if(legacy)saved=localStorage.getItem(legacy);}if(saved)state=validateState(JSON.parse(saved));}catch{storageAvailable=false;}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}updateSaveStatus();}
function updateSaveStatus(){document.getElementById('save-status').textContent=storageAvailable?'Progress saved on this browser':'Storage unavailable — use Export';document.getElementById('save-light').style.background=storageAvailable?'var(--green)':'var(--ember)';}
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3500);}
function sourcesHTML(list=[]){return list.length?`<div class="step-links">${list.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`).join('')}</div>`:'';}
function stepHTML(step,index){return `<article class="step${state.checked[step.id]?' done':''}" id="step-${step.id}"><input class="step-check" type="checkbox" id="check-${step.id}" data-check="${step.id}" ${state.checked[step.id]?'checked':''}><div class="step-body"><div class="step-title"><label for="check-${step.id}"><span class="step-index">${String(index).padStart(2,'0')}</span>${step.title}</label><span class="badge ${step.type||''}">${step.tag||'Step'}</span></div><p>${step.text}</p>${step.note?`<div class="step-note${step.warn?' warn':''}">${step.note}</div>`:''}${sourcesHTML(step.sources)}</div></article>`;}
function stageHTML(stage,index,offset,open){return `<details class="stage" id="stage-${stage.id}" ${open?'open':''}><summary><span class="stage-number">${index+1}</span><span class="stage-title"><strong>${stage.name}</strong><small>${stage.sub}</small></span><span class="stage-progress" data-stage-count="${stage.id}"></span><span class="chevron" aria-hidden="true"></span></summary><p class="stage-intro">${stage.intro}</p>${stage.steps.map((step,i)=>stepHTML(step,offset+i+1)).join('')}</details>`;}
function stagesHTML(stages){let offset=0;return stages.map((s,i)=>{const html=stageHTML(s,i,offset,i===0);offset+=s.steps.length;return html;}).join('');}
function heading(kicker,title,intro){return `<div class="section-heading"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2></div></div><p class="intro">${intro}</p>`;}
document.getElementById('route-stages').innerHTML=stagesHTML(STAGES);
document.getElementById('stage-nav').innerHTML=STAGES.map((s,i)=>`<button class="stage-link" data-jump="${s.id}"><span class="dot"></span>${i+1}. ${s.short}</button>`).join('');
document.getElementById('route-map').innerHTML=STAGES.map((s,i)=>`<button class="map-stop" data-jump="${s.id}"><span class="map-num">${i+1}</span><strong>${s.short}</strong><small>${['Start here','Field objectives','Hearth + tram','Three NPCs','Unlock Windsor','Enter with nine'][i]}</small></button>`).join('');
document.getElementById('view-ledger').innerHTML=heading('YOUR NINE PRE-ENTRY OBJECTIVES','Quest ledger','“Ready” follows the matching pickup checkbox in your route. It means you recorded accepting the quest, not that the dungeon objective is complete. Levels below are minimum acceptance levels, not recommended combat levels.')+`<div class="ledger-controls"><input class="search" id="quest-search" type="search" aria-label="Search quests, NPCs or objectives" placeholder="Find a quest, NPC or objective…"><button class="secondary" id="missing-only" aria-pressed="false">Show missing only</button></div><div class="quest-grid" id="quest-grid"></div><div class="notes"><label for="personal-notes">Your notes · Party plans, missing quests, next visit</label><textarea id="personal-notes" maxlength="10000" placeholder="Example: Need a group for Pyron. Save the Vault for next run."></textarea><p class="stat-foot">Saved in this browser. Export progress to keep a backup or move devices.</p></div>`;
document.getElementById('view-dungeon').innerHTML=dungeonShell();
function renderDungeonChecklists(){document.getElementById('run-checklists').innerHTML=getDungeonStages(state.keyPlan).map((s,i)=>stageHTML(s,i,0,true)).join('');}
renderDungeonChecklists();
document.getElementById('view-extras').innerHTML=heading('COMPLETE THE PICTURE','Optional & later','All ordinary Alliance / neutral BRD quest lines found in the current sources are covered here or in the route. Profession, breadcrumb, seasonal and later-level entries are separated so they do not send your level 53 paladin on unnecessary trips.')+stagesHTML(EXTRAS)+`<h2 style="margin-top:36px">Later-level & availability checks</h2><p class="intro">These are reference entries, not tasks required for your current nine-quest preparation. Recheck the live offer when you reach the gate.</p><div class="source-list">${LATER.map(q=>`<article class="source"><h3>${q.name}</h3><span class="badge">${q.gate}</span><p>${q.detail}</p>${sourcesHTML(q.sources)}</article>`).join('')}</div><div class="notice"><b>Not for this character</b>Horde-only lines—Commander Gor’shak, KILL ON SIGHT, Operation: Death to Angerforge, The Last Element, Disharmony of Fire, The Rise of the Machines, Lost Thunderbrew Recipe and Fragment of the Firelands—are excluded. No paladin-specific BRD pickup was found in the checked Forever records. Database-only &lt;NYI&gt; entries are not playable objectives.</div>`;
document.getElementById('view-sources').innerHTML=heading('RESEARCHED NOVEMBER 23, 2026','Sources & route decisions','This is a research-backed travel plan for WoW Forever. It has not been live-tested on your character. Linked quest records sit beside the steps they support; older Classic comments displayed on a Forever page are treated as inherited mechanics, not fresh Forever confirmation.')+`<div class="notice info"><b>Why counts differ across guides</b>Some lists count every faction, chain handoff, repeatable, seasonal, duplicate or unfinished database record. This guide uses nine actual pre-entry objectives, then explicitly covers their follow-ups and in-dungeon pickups. It does not claim that all database rows are simultaneously available quests.</div><h3>What the route optimizes</h3><ul class="method"><li><strong>Your known setup:</strong> level 53 human paladin, no BRD quests, Stormwind hearth, and the Ironforge / Stormwind / Thorium Point / Morgan’s Vigil flight paths.</li><li><strong>One city loop does two jobs:</strong> collect Thaurissan’s relic readings before the Solomon–Bolvar messenger leg; after Stormwind, take the tram to Ironforge for Kharan.</li><li><strong>One purposeful Flame Crest stop:</strong> delay its neutral pickups until Maxwell has sent you to Ragged John.</li><li><strong>No unnecessary intercontinental breadcrumbs:</strong> Kharanos and Yuka offer the dungeon objectives directly; the Nethergarde and Tanaris deliveries are separate completionist options.</li><li><strong>Group-dependent sections stay explicit:</strong> the drakes and Pyron may require help. If help is unavailable, defer them and keep their dependent quests unchecked.</li><li><strong>No invented timing:</strong> travel order is inferred from quest dependencies and geography. Flight connections, hearth cooldown, current location and party availability can change the fastest real-time choice.</li></ul><h3>Evidence and conflicts</h3><div class="table-wrap"><table class="compact-table"><thead><tr><th>DETAIL</th><th>HOW IT IS HANDLED</th></tr></thead><tbody><tr><td>Quest IDs & minimum levels</td><td>Cross-checked against the Forever database category and individual quest records. Quest level is not confused with acceptance level.</td></tr><tr><td>NPC coordinates & chain mechanics</td><td>Cross-checked across guides, but some details remain Classic-derived. Coordinates are approximate; NPC and landmark names are the stronger navigation cue.</td></tr><tr><td>Cyrus shortcut</td><td>Records expose alternate prerequisites; old dialogue reports describe the summoned drake. Check the live offer; the long Searing Gorge fallback is included.</td></tr><tr><td>Core attunement</td><td>Conflicting sources: retained level-55 record versus a report of absent live content. Kept out of the required route and labeled unverified.</td></tr><tr><td>Ever After</td><td>Included from Forever’s updated quest record, with the hidden ledge reference and the Forever toy reward.</td></tr><tr><td>Additional quests outside the BRD category</td><td>Profession / raid-linked entries and Pix Xizzix’s level-60 weekly are called out separately. The weekly is not available at 53.</td></tr></tbody></table></div><div class="source-list">${[
 [SOURCES.index,'The current category supplies IDs and acceptance levels; it includes faction-specific and non-playable records.'],
 [SOURCES.wowhead,'Cross-check for changed quests and the new Forever entries. Individual records are linked on each relevant step.'],
 [SOURCES.onyxia,'Ordering of Dragonkin Menace, the six True Masters stages and the Windsor chain.'],
 [SOURCES.tavern,'Quest pickup and objective reference, including the optional Ragnar breadcrumb. The article carries Classic-derived material.'],
 [SOURCES.coords,'Coordinates for the pickup NPCs, cross-checked with individual records; map data can differ slightly.'],
 [SOURCES.secret,'Hidden approach to the Rugged Traveler, plus the distinction between SoD and Forever rewards.'],
 [SOURCES.core,'A current report that Core attunement is absent; treated as a report amid conflicting inherited guides.'],
 [SOURCES.weekly,'Level-60 BRD / Blackrock Spire document quest and its objectives.']
 ].map(([s,desc])=>`<article class="source"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a><p>${desc}</p></article>`).join('')}</div><h3>Keep your progress</h3><p class="method">Checks and notes are stored locally in this browser, not in your WoW account. They persist across reloads at this site address. Private browsing, clearing site data or switching browsers can lose or separate progress. Use Export to save a JSON backup and Import to restore it.</p><div class="mobile-tools"><button data-action="export">Export progress</button><button data-action="import">Import progress</button><button data-action="reset">Reset checklist</button></div>`;
document.getElementById('personal-notes').value=state.notes;
document.getElementById('view-extras').insertAdjacentHTML('afterbegin','<div class="notice info"><b>Love Potion and Mining are now on the dungeon route.</b>The ingredient trip is under “Outside errands”; Gloom’rel and the Chalice are placed before the Seven in visit 2. <button class="secondary" data-view="dungeon">Open dungeon route</button></div>');
document.getElementById('view-sources').insertAdjacentHTML('beforeend',`<h3>Dungeon route & map evidence</h3><div class="source-list">${[
 [SOURCES.navigation,'Cross-checked named room connections for the keyless key loop. Some quest details in the broad guide conflict with individual records; those are not used to override the quest ledger.'],
 [SOURCES.lock,'The lower Highway closes when the upper East–West Garrison crossing is aligned. The map marks that switch.'],
 [SOURCES.prison,'Prison layout, Gerstahn’s key, equipment room and the escort’s return path.'],
 [SOURCES.secretForever,'Forever-specific report of the Traveler ledge and one-way exit above Incendius.'],
 [SOURCES.noteDrop,'The Quarry Slaves option for obtaining the Note before committing to the paper bosses.'],
 [SOURCES.hotfix,'Blizzard’s current hotfix list, including the secret door teleport and Heart loot fixes.']
 ].map(([s,desc])=>`<article class="source"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a><p>${desc}</p></article>`).join('')}</div><h3>Share or host your own copy</h3><p class="method">This is a static site. Each visitor has their own browser-local checklist; sharing the link does not share your progress or notes. Export and import are deliberate ways to transfer a checklist. Changing website addresses creates separate browser storage.</p><div class="share-links"><a class="secondary" href="https://github.com/B-Rabbit32/brd-field-guide" target="_blank" rel="noopener noreferrer">Source on GitHub</a><a class="secondary" href="https://b-rabbit32.github.io/brd-field-guide/" target="_blank" rel="noopener noreferrer">Public guide</a></div><p class="method">To host under an existing website, copy the contents of <code>dist/</code> to a subdirectory such as <code>/brd/</code>. All assets use relative paths. The repository includes deployment instructions for GitHub Pages and ordinary static hosting.</p>`);
let missingOnly=false;
function activeDungeonStage(){return getDungeonStages(state.keyPlan).find(s=>s.id===state.mapPhase);}
function updateDungeon(){
 const stage=activeDungeonStage(),done=stage.steps.filter(s=>state.checked[s.id]).length;
 document.getElementById('key-plan').value=state.keyPlan;
 document.getElementById('key-plan-note').textContent=state.keyPlan==='keyed'?'A party key allows the Highway first, then a climb through Fineous and the Vault to your own key turn-in. This changes visit 1 only.':'No key shortcut is assumed. The first route clears the Arena and explicitly backtracks for your personal key.';
 document.getElementById('run-progress').textContent=`${done} / ${stage.steps.length} checks`;
 const next=stage.steps.find(s=>!state.checked[s.id]);
 document.getElementById('run-next-title').textContent=next?next.title:'All checks on this leg recorded.';
 document.getElementById('run-resume').disabled=!next;
 document.querySelectorAll('[data-phase]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.phase===state.mapPhase)));
 for(const s of DUNGEON){const el=document.getElementById(`stage-${s.id}`);el.hidden=s.id!==state.mapPhase;}
 const outside=state.mapPhase==='between-visits';
 document.getElementById('map-section').hidden=outside;document.getElementById('outside-map').hidden=!outside;
 if(!outside){
  const canvas=document.getElementById('dungeon-map-canvas'),scroller=document.getElementById('map-scroll');
  const scrollLeft=scroller.scrollLeft,scrollTop=scroller.scrollTop;
  canvas.innerHTML=drawDungeonMap(state.mapPhase,state.keyPlan,state.checked,selectedRoom);canvas.style.width=`${mapZoom}%`;
  scroller.scrollLeft=scrollLeft;scroller.scrollTop=scrollTop;
  const room=MAP_ROOMS.find(r=>r.id===selectedRoom),tasks=stage.steps.filter(s=>s.room===selectedRoom);
  document.getElementById('room-objectives').innerHTML=`<div class="room-heading"><span class="eyebrow">SELECTED ROOM</span><h3>${room.label[0]}${room.label[1]?' · '+room.label[1]:''}</h3></div>${tasks.length?tasks.map(s=>`<div class="map-objective"><input type="checkbox" id="map-check-${s.id}" data-check="${s.id}" ${state.checked[s.id]?'checked':''}><label for="map-check-${s.id}">${s.title}</label><button data-step="${s.id}">Directions</button></div>`).join(''):'<p class="empty">No checklist objective here on this leg. It may be a corridor, or a stop on the other visit.</p>'}`;
 }
}
function renderLedger(){
 const query=document.getElementById('quest-search').value.toLowerCase().trim();
 const selected=LEDGER.filter(q=>(!missingOnly||!state.checked[q.step])&&`${q.name} ${q.giver} ${q.target} ${q.unlock}`.toLowerCase().includes(query));
 document.getElementById('quest-grid').innerHTML=selected.length?selected.map(q=>`<article class="quest-card${state.checked[q.step]?' ready':''}"><div class="quest-top"><h3>${q.name}</h3><span class="min-level">Min ${q.min}</span></div><span class="status">${state.checked[q.step]?'✓ Pickup recorded':'Pickup not yet recorded'}</span><dl><dt>Pick up</dt><dd>${q.giver}</dd><dt>Unlock</dt><dd>${q.unlock}</dd><dt>Objective</dt><dd>${q.target}</dd><dt>Turn in</dt><dd>${q.turn}</dd></dl><div class="step-links"><button class="secondary" data-step="${q.step}">Go to pickup step</button><a href="https://www.wowhead.com/forever/quest=${q.id}" target="_blank" rel="noopener noreferrer">Quest #${q.id}</a></div></article>`).join(''):'<p class="empty">No quests match this filter.</p>';
}
function updateProgress(){
 const n=ROUTE_STEPS.filter(s=>state.checked[s.id]).length,pct=Math.round(n/ROUTE_STEPS.length*100);
 document.getElementById('progress-text').textContent=`${n} / ${ROUTE_STEPS.length} steps`;
 document.getElementById('progress-bar').style.width=`${pct}%`;
 document.getElementById('nav-progress').textContent=`${pct}%`;
 document.getElementById('ready-count').innerHTML=`${LEDGER.filter(q=>state.checked[q.step]).length} <small>/ 9 ready</small>`;
 const next=ROUTE_STEPS.find(s=>!state.checked[s.id]);
 document.getElementById('next-title').textContent=next?next.title:'All preparation steps checked. Review your quest log and party plan.';
 document.getElementById('resume').textContent=next?'Continue route':'Review ledger';
 for(const stage of [...STAGES,...getDungeonStages(state.keyPlan),...EXTRAS]){const done=stage.steps.filter(s=>state.checked[s.id]).length;document.querySelector(`[data-stage-count="${stage.id}"]`).textContent=`${done}/${stage.steps.length}`;document.querySelectorAll(`[data-jump="${stage.id}"]`).forEach(el=>{el.classList.toggle('complete',done===stage.steps.length);el.classList.toggle('current',!!next&&stage.steps.some(s=>s.id===next.id));});}
 document.getElementById('view-route').classList.toggle('hidden-done',state.hideDone);
 document.getElementById('hide-done').checked=state.hideDone;
 renderLedger();updateDungeon();updateSaveStatus();
}
function showView(view,scroll=true){if(!VIEWS.includes(view))return;state.view=view;for(const v of VIEWS)document.getElementById(`view-${v}`).hidden=v!==view;document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));save();if(scroll)document.getElementById(`view-${view}`).scrollIntoView({behavior:'smooth',block:'start'});}
function jumpToStage(id){showView('route',false);const el=document.getElementById(`stage-${id}`);if(el){el.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});}}
function jumpToStep(id){const stage=ALL_STAGES.find(s=>s.steps.some(x=>x.id===id));if(!stage)return;const view=STAGES.includes(stage)?'route':DUNGEON.includes(stage)?'dungeon':'extras';if(view==='dungeon'){state.mapPhase=stage.id;const step=stage.steps.find(s=>s.id===id);if(step.only==='keyless'&&state.keyPlan==='keyed'){state.keyPlan='keyless';renderDungeonChecklists();}if(step.room)selectedRoom=step.room;updateDungeon();}if(view==='route'&&state.hideDone&&state.checked[id]){state.hideDone=false;updateProgress();}showView(view,false);document.getElementById(`stage-${stage.id}`).open=true;const el=document.getElementById(`step-${id}`);el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.remove('flash');requestAnimationFrame(()=>el.classList.add('flash'));}
document.addEventListener('click',event=>{
 const view=event.target.closest('[data-view]');if(view)showView(view.dataset.view);
 const stage=event.target.closest('[data-jump]');if(stage)jumpToStage(stage.dataset.jump);
 const step=event.target.closest('[data-step]');if(step)jumpToStep(step.dataset.step);
 const phase=event.target.closest('[data-phase]');if(phase){state.mapPhase=phase.dataset.phase;selectedRoom=state.mapPhase==='visit-one'?'prison':'garrison';save();updateDungeon();}
 const room=event.target.closest('[data-room]');if(room){selectedRoom=room.dataset.room;updateDungeon();}
 const action=event.target.closest('[data-action]');if(action){if(action.dataset.action==='export')exportProgress();if(action.dataset.action==='import')document.getElementById('import').click();if(action.dataset.action==='reset')document.getElementById('reset-dialog').showModal();}
});
document.addEventListener('change',event=>{if(event.target.matches('[data-check]')){const id=event.target.dataset.check,focusId=event.target.id;state.checked[id]=event.target.checked;document.querySelectorAll(`[data-check="${id}"]`).forEach(el=>{el.checked=!!state.checked[id];el.closest('.step')?.classList.toggle('done',el.checked);});save();updateProgress();if(focusId.startsWith('map-check-'))document.getElementById(focusId)?.focus({preventScroll:true});}});
document.addEventListener('keydown',event=>{if(event.target.matches('[data-room]')&&['Enter',' '].includes(event.key)){event.preventDefault();selectedRoom=event.target.dataset.room;updateDungeon();document.querySelector(`[data-room="${selectedRoom}"]`)?.focus({preventScroll:true});}});
document.getElementById('key-plan').addEventListener('change',event=>{state.keyPlan=event.target.value;renderDungeonChecklists();save();updateProgress();});
document.getElementById('run-resume').addEventListener('click',()=>{const next=activeDungeonStage().steps.find(s=>!state.checked[s.id]);if(next)jumpToStep(next.id);});
function setMapZoom(delta){mapZoom=Math.max(75,Math.min(160,mapZoom+delta));document.getElementById('zoom-value').textContent=`${mapZoom}%`;document.getElementById('dungeon-map-canvas').style.width=`${mapZoom}%`;document.getElementById('zoom-out').disabled=mapZoom===75;document.getElementById('zoom-in').disabled=mapZoom===160;}
document.getElementById('zoom-out').addEventListener('click',()=>setMapZoom(-25));
document.getElementById('zoom-in').addEventListener('click',()=>setMapZoom(25));
document.getElementById('share-guide').addEventListener('click',async()=>{const url=new URL(location.href);url.hash='dungeon';try{await navigator.clipboard.writeText(url.href);toast('Guide link copied. Your progress and notes stay private to this browser.');}catch{toast(`Share this address: ${url.href}`);}});
document.getElementById('hide-done').addEventListener('change',event=>{state.hideDone=event.target.checked;save();updateProgress();});
document.getElementById('resume').addEventListener('click',()=>{const next=ROUTE_STEPS.find(s=>!state.checked[s.id]);if(next)jumpToStep(next.id);else showView('ledger');});
document.getElementById('quest-search').addEventListener('input',renderLedger);
document.getElementById('missing-only').addEventListener('click',event=>{missingOnly=!missingOnly;event.target.setAttribute('aria-pressed',String(missingOnly));event.target.textContent=missingOnly?'Show all quests':'Show missing only';renderLedger();});
document.getElementById('personal-notes').addEventListener('input',event=>{state.notes=event.target.value;save();});
function exportProgress(){const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='blackrock-depths-progress.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Progress exported. Keep this file as your backup.');}
document.getElementById('export').addEventListener('click',exportProgress);
document.getElementById('import').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>200000)throw new Error('Too large');const imported=validateState(JSON.parse(await file.text()));state=imported;renderDungeonChecklists();document.querySelectorAll('[data-check]').forEach(el=>{el.checked=!!state.checked[el.dataset.check];el.closest('.step')?.classList.toggle('done',el.checked);});document.getElementById('personal-notes').value=state.notes;save();updateProgress();showView(state.view);toast('Progress imported.');}catch{toast('Could not import. Choose a progress JSON exported by this guide.');}event.target.value='';});
document.getElementById('reset').addEventListener('click',()=>document.getElementById('reset-dialog').showModal());
document.getElementById('cancel-reset').addEventListener('click',()=>document.getElementById('reset-dialog').close());
document.getElementById('confirm-reset').addEventListener('click',()=>{state=freshState();renderDungeonChecklists();document.querySelectorAll('[data-check]').forEach(el=>{el.checked=false;el.closest('.step')?.classList.remove('done');});document.getElementById('personal-notes').value='';save();updateProgress();showView('route');document.getElementById('reset-dialog').close();toast('Checklist reset.');});
if(VIEWS.includes(location.hash.slice(1)))state.view=location.hash.slice(1);
updateProgress();showView(state.view,false);
