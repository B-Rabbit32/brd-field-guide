import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const base=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,base),'utf8');
const context=vm.createContext({});
vm.runInContext(read('dist/data.js')+'\n'+read('dist/dungeon-data.js')+'\n'+read('dist/dungeon-map.js')+`\nthis.guide={STAGES,DUNGEON,EXTRAS,LEDGER,MAP_ROOMS,MAP_EDGES,MAP_PATHS,KEYED_FIRST_ORDER,getDungeonStages,getDungeonProgress,roomStopNumbers,drawDungeonMap};`,context);
const g=context.guide;
const steps=[...g.STAGES,...g.DUNGEON,...g.EXTRAS].flatMap(s=>s.steps);
assert.equal(new Set(steps.map(s=>s.id)).size,steps.length,'Checklist IDs must be unique');
const ids=new Set(steps.map(s=>s.id));
for(const q of g.LEDGER)assert(ids.has(q.step),`Missing ledger target ${q.step}`);
assert.equal(g.LEDGER.length,9);
const rooms=new Set(g.MAP_ROOMS.map(r=>r.id));
for(const s of steps){if(s.room)assert(rooms.has(s.room),`Unknown map room ${s.room}`);for(const link of s.sources||[])assert(new URL(link.url).protocol==='https:');}
const edges=new Set(g.MAP_EDGES.map(([a,b])=>[a,b].sort().join('|')));
for(const paths of Object.values(g.MAP_PATHS))for(const route of Object.values(paths))for(let i=1;i<route.length;i++)assert(edges.has([route[i-1],route[i]].sort().join('|')),`Route jumps between unconnected rooms: ${route[i-1]} / ${route[i]}`);
for(const plan of ['keyless','keyed']){
 const runs=g.getDungeonStages(plan),first=runs[0].steps.map(s=>s.id),last=runs[2].steps.map(s=>s.id);
 assert.equal(new Set(first).size,first.length);
 for(const required of ['windsor-talk','kharan-talk','fineous','vault','shadowforge-key','incendius-kill','baelgar','love-pickup','hurley-loot','ribbly-loot'])assert(first.includes(required),`Missing quest on ${plan} route: ${required}`);
 assert(first.indexOf('fineous')<first.indexOf('shadowforge-key'),'Ironfel must precede key turn-in');
 assert(first.indexOf('incendius-kill')<first.indexOf('lock-one'));
 assert(first.indexOf('baelgar')<first.indexOf('lock-one'));
 assert(last.indexOf('note')<last.indexOf('angerforge-info'));
 assert(last.indexOf('note')<last.indexOf('argelmach-info'));
 assert(last.indexOf('argelmach-info')<last.indexOf('jailbreak'));
 assert(last.indexOf('jailbreak')<last.indexOf('flamelash'));
 assert(last.indexOf('chalice')<last.indexOf('seven'));
 assert(last.indexOf('emperor-kill')<last.indexOf('moira-talk'));
}
const app=read('dist/app.js'),validation=app.slice(app.indexOf('function validateState('),app.indexOf('\ntry{let saved='));
// Map numbers must remain the checklist ordinals, including repeat room visits.
const numbers=(phase,plan,room)=>g.roomStopNumbers(g.getDungeonProgress(phase,plan,{}).steps.filter(s=>s.room===room));
assert.equal(numbers('visit-one','keyless','prison'),'02–04');
assert.equal(numbers('visit-one','keyless','baelgar'),'12–13');
assert.equal(numbers('visit-one','keyed','baelgar'),'05–06');
assert.equal(numbers('visit-two','keyless','prison'),'01, 05–06');
for(const plan of ['keyless','keyed'])for(const stage of g.getDungeonStages(plan)){
 const checked={};
 for(let i=0;i<stage.steps.length;i++){
  const progress=g.getDungeonProgress(stage.id,plan,checked);
  assert.equal(progress.next.id,stage.steps[i].id);
  assert.equal(progress.next.number,i+1);
  const svg=g.drawDungeonMap(stage.id,plan,checked,'prison');
  assert.equal((svg.match(/aria-current="step"/g)||[]).length,progress.next.room?1:0,'Only the next mapped objective is highlighted');
  if(progress.next.room)assert(svg.includes(`NEXT ${String(i+1).padStart(2,'0')}</text>`));
  checked[progress.next.id]=true;
 }
 assert.equal(g.getDungeonProgress(stage.id,plan,checked).next,undefined);
 assert(!g.drawDungeonMap(stage.id,plan,checked,'prison').includes('aria-current="step"'));
 delete checked[stage.steps[0].id];
 assert.equal(g.getDungeonProgress(stage.id,plan,checked).next.id,stage.steps[0].id,'Unchecking an earlier step restores it as next');
}
vm.runInContext(`const ALL_IDS=new Set(${JSON.stringify([...ids])}); const VIEWS=['route','ledger','dungeon','extras','sources'];\n${validation}\nthis.validate=validateState;`,context);
const old=context.validate({version:1,checked:{hurley:true,papers:true,emperor:true,'first-bar':true,unrelated:true},notes:'Keep my notes'});
assert(old.checked.hurley&&old.checked['angerforge-info']&&old.checked['argelmach-info']&&old.checked['moira-talk']&&old.checked['love-pickup']);
assert(!old.checked.unrelated);assert.equal(old.notes,'Keep my notes');assert.equal(old.version,2);
assert.throws(()=>context.validate({version:77,checked:{}}));
for(const file of ['dist/index.html','dist/data.js','dist/app.js','dist/dungeon-data.js','dist/dungeon-map.js','dist/style.css']){
 const text=read(file);assert(!/appgprj_|C:\\Users/i.test(text),`Private deployment identifier or local path in ${file}`);
}
for(const src of [...read('dist/index.html').matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]).filter(x=>!/^https?:|^data:/.test(x)))read('dist/'+src);
console.log(`Validated ${steps.length} unique checks, ${g.MAP_ROOMS.length} map rooms, both route variants, numbered stops, next-objective progression, quest sequencing and v1 progress migration.`);
