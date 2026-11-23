const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const worlds = ['development','design','launch'];
const catalogs = [
 ['Studio North','Creative agency','Client website launch',['Design','Development','Launch'],[['Approve layouts'],['Build website','Set up CMS'],['Final QA and release']]],
 ['Apple-inspired studio','Fictional technology company','Mac product family',['Hardware','Software','Release'],[['Prototype enclosure'],['Integrate firmware'],['Validate build']]],
 ['Meridian Events','Event production','Autumn festival',['Programming','Production','Show day'],[['Confirm artists'],['Build stage','Check lighting'],['Open gates']]]
];
function seed(){
 const all=[];
 function add(id,parent,name,kind,effort=1,dep=''){all.push({id,parent,name,kind,effort,dep,owner:'',due:'',status:'Planned'})}
 catalogs.forEach(([name,,project,stages,tasks],i)=>{
 const root='org'+i,p=root+'p';add(root,'',name,'Organization');add(p,root,project,'Project');
 stages.forEach((stage,j)=>{const s=p+j;add(s,p,stage,'Workstream');tasks[j].forEach((name,k)=>add(s+k,s,name,'Task',[4,6,3][j],j?p+(j-1)+'0':''))})});return all;
}
let nodes;try{nodes=JSON.parse(localStorage.getItem('kinetic.atlas.v2'))}catch{}if(!Array.isArray(nodes))nodes=[];
const samples=seed();
for(const root of samples.filter(n=>!n.parent)){
 const branch=nodes.filter(n=>{let t=n;while(t?.parent)t=nodes.find(p=>p.id===t.parent);return t?.id===root.id});
 if(branch.length&&branch.every(n=>samples.some(d=>JSON.stringify(d)===JSON.stringify(n))))nodes=nodes.filter(n=>!branch.includes(n));
 else if(branch.length){const r=branch.find(n=>!n.parent);r.kind='Universe'}
}
const hierarchy={Universe:['Cluster','Galaxy'],Cluster:['Galaxy'],Galaxy:['Stellar system'],'Stellar system':['Planet'],Planet:['Moon'],Moon:[]};
const skins={Cluster:['Blue association','Amber association'],Galaxy:['Blue spiral','Golden spiral','Rose spiral'],'Stellar system':['Golden star','Blue star','Red dwarf'],Planet:['Earth','Mars','Neptune','Jupiter','Venus','Saturn','Uranus','Mercury'],Moon:['Moon','Mercury']};

const objectKind=n=>({Project:'Galaxy',Workstream:'Planet',Task:'Moon',Organization:'Universe',Universe:'Universe'}[n.kind]||n.kind);
const persist=()=>localStorage.setItem('kinetic.atlas.v2',JSON.stringify(nodes));
let list=localStorage.getItem('kinetic.view')==='list',editing=null,capacity=1,scenario=false,art=[],active='';
const get=id=>nodes.find(n=>n.id===id),children=id=>nodes.filter(n=>n.parent===id);
function leaves(n){const kids=children(n.id);return kids.length?kids.flatMap(leaves):[n]}
function path(n){return n.parent?[...path(get(n.parent)),n]:[n]}
function openNode(id){location.hash='explore/'+id}
// Supply missing containers for documents saved before nesting rules existed.
for(const n of [...nodes]){
 if(!n.parent)continue;
 const parent=get(n.parent);if(!parent)continue;
 const steps=['Cluster','Galaxy','Stellar system','Planet','Moon'];
 let p=parent;const wanted=objectKind(n);
 if(!steps.includes(wanted)||hierarchy[objectKind(p)]?.includes(wanted))continue;
 const to=steps.indexOf(wanted);
 while(p.parent&&steps.indexOf(objectKind(p))>=to)p=get(p.parent);
 const from=p.parent?steps.indexOf(objectKind(p)):-1;
 for(let i=Math.max(from+1,1);i<to;i++){
  const id=p.id+'-group-'+i;let group=get(id);
  if(!group){group={id,parent:p.id,name:['','Projects','Workstreams','Milestones'][i],kind:steps[i],status:'Planned',effort:1,dep:''};nodes.push(group)}p=group;
 }
 if(hierarchy[objectKind(p)]?.includes(wanted))n.parent=p.id;
}
persist();
const tour=[['Explore your universe','Take a short tour of the map and planning tools.'],['Add your first object','Choose Add object on the tool rail. Start with a galaxy, or group several galaxies in a cluster.'],['Build inside it','Select a galaxy to add stellar systems. Systems contain planets, and planets contain moons.'],['Arrange the work','Zoom in with the wheel, drag empty space to orbit, and drag an object’s label to move it. Priority controls its size.'],['Plan and revise','Open the Inspector to edit its owner, dependencies, and deadline, compare staffing, or remove it.']];
let step=0;
function tutorial(){const [title,body]=tour[step];$('guideTitle').textContent=title;$('guideText').textContent=body;$('next').textContent=step===0?'Start tour':step===tour.length-1?'Finish':'Next';if(!$('guide').open)$('guide').showModal()}
$('skip').onclick=()=>$('guide').close();$('next').onclick=()=>{if(++step<tour.length)tutorial();else $('guide').close()};
let panelOpen=false;
function showChooser(){
 const roots=nodes.filter(n=>!n.parent);
 $('universes').innerHTML=roots.map(n=>`<a href="#explore/${n.id}"><span>${esc(n.name)}</span> ↗</a>`).join('');
}
$('newUniverse').onclick=()=>{$('universeForm').reset();$('universeDialog').showModal()};
$('universeForm').onsubmit=e=>{
 e.preventDefault();const data=new FormData(e.target),name=data.get('name').trim();
 if(!name)return;
 const id=crypto.randomUUID();nodes.push({id,parent:'',name,description:data.get('description').trim(),kind:'Universe',effort:0,status:'Planned',owner:'',due:'',dep:''});
 localStorage.setItem('kinetic.atlas.v2',JSON.stringify(nodes));$('universeDialog').close();openNode(id);step=0;tutorial();
};
function schedule(tasks,slots){
 const jobs=tasks.filter(n=>n.status!=='Done'),finish=new Map(),workers=Array(slots).fill(0);
 while(jobs.length){const options=jobs.filter(n=>!jobs.some(p=>p.id===n.dep));if(!options.length)return null;
 const start=n=>Math.max(Math.min(...workers),finish.get(n.dep)||0);
 const n=options.sort((a,b)=>start(a)-start(b))[0],end=start(n)+Number(n.effort);
 workers[workers.indexOf(Math.min(...workers))]=end;finish.set(n.id,end);jobs.splice(jobs.indexOf(n),1)}
 return Math.max(0,...workers);
}
function render(){
 const [mode,id]=location.hash.slice(1).split('/'),show=mode==='explore';
 const n=get(id),inside=show&&Boolean(n);
 $('workspace').hidden=!inside;$('chooser').hidden=!show||inside;$('home').hidden=show;
 document.body.classList.toggle('working',inside);document.body.classList.toggle('choosing',show&&!inside);
 if(!inside){active='';if(show)showChooser();return}
 if(!active&&!n.parent)list=false;
 if(active!==n.id){scenario=false;capacity=1;active=n.id}
 const items=children(n.id),tasks=leaves(n),done=tasks.filter(t=>t.status==='Done').length;
 const canAdd=Boolean(hierarchy[objectKind(n)]?.length);
 const trail=path(n).map(t=>t===n?esc(t.name):`<button class="crumb" data-go="${t.id}">${esc(t.name)}</button>`).join(' / ');
 $('toolbar').innerHTML=`<div class="trail"><a href="#explore">Universes</a> / ${trail}</div><div class="toolrail" role="toolbar" aria-label="Universe controls">
 <button id="add" ${canAdd?'':'hidden'}><i>＋</i>Add object</button>
 <button id="tools" aria-controls="details" aria-expanded="${panelOpen}"><i>☷</i>Inspector</button>
 <button id="view"><i>${list?'◎':'≡'}</i>${list?'Map':'List'}</button>
 <button id="parent" ${n.parent?'':'hidden'}><i>↶</i>Up a level</button></div>
 <div class="mapzoom" ${list?'hidden':''}><button aria-label="Zoom out" id="zoomOut">−</button><button aria-label="Zoom in" id="zoomIn">＋</button></div>`;
 $('zoomIn').onclick=()=>window.adjustZoom?.(.72);$('zoomOut').onclick=()=>window.adjustZoom?.(1.38);
 $('details').hidden=!panelOpen;
 $('tools').onclick=()=>{panelOpen=!panelOpen;$('details').hidden=!panelOpen;$('tools').setAttribute('aria-expanded',panelOpen)};
 $('space').innerHTML=`<div class="${list?'list':'map'}">${(items.length?items:n.parent?[n]:[]).map((t,i)=>`<button data-id="${t.id}" data-kind="${esc(objectKind(t))}" class="${list?'':'object'}" ${items.length?'data-go="'+t.id+'"':'id="leafEdit"'}><strong>${esc(t.name)}</strong><small>${esc(objectKind(t))} · ${esc(t.status)}</small></button>`).join('')}</div>`;
 $('details').innerHTML=`<header class="inspect-head"><small>${esc(n.parent?objectKind(n):'Universe')}</small><h2>${esc(n.name)}</h2></header>
 ${n.description?`<p>${esc(n.description)}</p>`:''}
 <div class="inspect-section"><h3>Work</h3><dl><dt>Complete</dt><dd>${done} / ${tasks.length}</dd><dt>Owner</dt><dd>${esc(n.owner||'Unassigned')}</dd><dt>People</dt><dd>${Number(n.people??1)}</dd>${n.due?`<dt>Due</dt><dd>${esc(n.due)}</dd>`:''}</dl>
 ${n.dep?`<p>Starts after ${esc(get(n.dep)?.name)}</p>`:''}<button id="edit">Edit details</button></div>
 <div class="inspect-section"><h3>Finish forecast</h3><strong class="forecast-value">Day ${schedule(tasks,scenario?capacity:1)}</strong><p>From start · ${scenario?capacity:1} worker${scenario&&capacity>1?'s':''}</p>
 ${scenario?`<label>Scenario capacity<select id="cap">${[1,2,3,4].map(v=>`<option ${v===capacity?'selected':''}>${v}</option>`).join('')}</select></label><p>Baseline · day ${schedule(tasks,1)}</p>`:''}
 <button id="scenario">${scenario?'Discard scenario':'Compare staffing'}</button></div>
 <details class="inspect-section"><summary>Manage workspace</summary><div class="actions"><button id="download">Export atlas</button><button id="tour">Tutorial</button><button data-audio></button><button id="remove">Remove ${n.parent?'object':'universe'}</button></div></details>`;
 window.syncSoundSettings?.();
 window.mountSystem?.(n.id);document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>openNode(b.dataset.go));
 $('parent').onclick=()=>openNode(n.parent);$('view').onclick=()=>{list=!list;localStorage.setItem('kinetic.view',list?'list':'orbit');render()};$('add').onclick=()=>edit(n,true);$('edit').onclick=()=>edit(n,false);if($('leafEdit'))$('leafEdit').onclick=()=>edit(n,false);
 $('tour').onclick=()=>{step=0;tutorial()};
 $('remove').onclick=()=>{
  const removed=new Set(nodes.filter(t=>path(t).some(p=>p.id===n.id)).map(t=>t.id));
  if(!confirm('Remove '+n.name+(removed.size>1?' and '+(removed.size-1)+' nested objects':'')+'? This cannot be undone.'))return;
  nodes=nodes.filter(t=>!removed.has(t.id));for(const t of nodes)if(removed.has(t.dep))t.dep='';
  persist();location.hash=n.parent?'explore/'+n.parent:'explore';
 };
 $('download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(nodes,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kinetic-atlas.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('scenario').onclick=()=>{scenario=!scenario;capacity=2;render()};if($('cap'))$('cap').onchange=e=>{capacity=Number(e.target.value);render()};
}
function edit(n,create){
 editing={n,create};const f=$('form').elements;const value=create?{name:'',kind:'Planet',owner:'',due:'',effort:1,status:'Planned',dep:''}:n;
 for(const key of ['name','owner','due','effort','status'])f[key].value=value[key];
 f.effort.min=!create&&!n.parent?'0':'1';f.kind.closest('label').hidden=!create&&!n.parent;const allowed=create?hierarchy[objectKind(n)]:(n.parent?hierarchy[objectKind(get(n.parent))].filter(k=>children(n.id).every(c=>hierarchy[k].includes(objectKind(c)))):['Universe']);
 f.kind.innerHTML=allowed.map(k=>`<option>${k}</option>`).join('');f.kind.value=allowed.includes(objectKind(value))?objectKind(value):allowed[0];
 function appearance(){const opts=skins[f.kind.value]||[];f.skin.innerHTML=opts.map(k=>`<option>${k}</option>`).join('');if(opts.includes(value.skin))f.skin.value=value.skin;f.skin.closest('label').hidden=!opts.length}
 appearance();f.kind.onchange=appearance;f.priority.value=value.priority||'Normal';$('form').querySelector('details').open=false;f.description.value=value.description||'';f.people.value=value.people??1;
 function dependsOn(t){return t.id===n.id||Boolean(t.dep&&get(t.dep)&&dependsOn(get(t.dep)))}
 const eligible=leaves(path(n)[0]).filter(t=>t.id!==n.id&&(create||!dependsOn(t)));
 f.dep.innerHTML='<option value="">None</option>'+eligible.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');f.dep.value=value.dep;$('formTitle').textContent=create?'Add to '+n.name:'Edit details';$('editor').showModal();f.name.focus();
}
$('form').onsubmit=e=>{e.preventDefault();const {n,create}=editing,values=Object.fromEntries(new FormData(e.target));values.name=values.name.trim();if(!values.name)return;values.effort=Number(values.effort);values.people=Number(values.people);
 if((create||n.parent)&&!hierarchy[objectKind(create?n:get(n.parent))]?.includes(values.kind))return;
 if(create)nodes.push({...values,id:crypto.randomUUID(),parent:n.id});else Object.assign(n,{...values,kind:n.parent?values.kind:n.kind});
 localStorage.setItem('kinetic.atlas.v2',JSON.stringify(nodes));$('editor').close();render()};
window.addEventListener('hashchange',render);
window.addEventListener('load',render);
