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
let nodes;try{nodes=JSON.parse(localStorage.getItem('kinetic.atlas.v2'))}catch{}if(!Array.isArray(nodes)||!nodes.length)nodes=seed();
const objectKind=n=>({Project:'Galaxy',Workstream:'Planet',Task:'Moon',Organization:'Cluster',Universe:'Cluster'}[n.kind]||n.kind);
const persist=()=>localStorage.setItem('kinetic.atlas.v2',JSON.stringify(nodes));
let list=localStorage.getItem('kinetic.view')==='list',editing=null,capacity=1,scenario=false,art=[],active='';
const get=id=>nodes.find(n=>n.id===id),children=id=>nodes.filter(n=>n.parent===id);
function leaves(n){const kids=children(n.id);return kids.length?kids.flatMap(leaves):[n]}
function path(n){return n.parent?[...path(get(n.parent)),n]:[n]}
function openNode(id){location.hash='explore/'+id}
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
 localStorage.setItem('kinetic.atlas.v2',JSON.stringify(nodes));$('universeDialog').close();openNode(id);
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
 $('toolbar').innerHTML=`<button id="tools" aria-expanded="${panelOpen}">☷ &nbsp; Workspace tools</button><div><a href="#explore">Universes</a> / ${path(n).map(t=>t===n?esc(t.name):`<button class="crumb" data-go="${t.id}">${esc(t.name)}</button>`).join(' / ')}</div>`;
 $('details').hidden=!panelOpen;
 $('tools').onclick=()=>{panelOpen=!panelOpen;$('details').hidden=!panelOpen;$('tools').setAttribute('aria-expanded',panelOpen)};
 $('space').innerHTML=`<div class="${list?'list':'map'}">${(items.length?items:n.parent?[n]:[]).map((t,i)=>`<button data-id="${t.id}" data-kind="${esc(objectKind(t))}" class="${list?'':'object'}" ${items.length?'data-go="'+t.id+'"':'id="leafEdit"'}><strong>${esc(t.name)}</strong><small>${esc(objectKind(t))} · ${esc(t.status)}</small></button>`).join('')}</div>`;
 $('details').innerHTML=`<div class="actions"><button id="view">${list?'Orbital map':'List view'}</button><button id="parent" ${n.parent?'':'hidden'}>↑ Up one level</button><button id="add">Add object</button></div><p>${esc(n.description||'')}</p><p>${done} of ${tasks.length} tasks complete</p><p>${esc(n.owner||'Unassigned')} · ${Number(n.people??1)} assigned${n.due?' · Due '+esc(n.due):''}</p>${n.dep?'<p>Starts after '+esc(get(n.dep)?.name)+'</p>':''}<div class="actions"><button id="edit">Edit details</button><button id="download">Export atlas</button></div><hr><small class="kicker">FINISH FORECAST</small><h2>Day ${schedule(tasks,scenario?capacity:1)}</h2><p>From project start · ${scenario?capacity:1} available worker${scenario&&capacity>1?'s':''}</p>${scenario?`<label>Scenario capacity<select id="cap">${[1,2,3,4].map(v=>`<option ${v===capacity?'selected':''}>${v}</option>`).join('')}</select></label><p>Baseline · day ${schedule(tasks,1)}</p>`:''}<div class="actions"><button id="scenario">${scenario?'Discard scenario':'Compare staffing'}</button></div>`;
 window.mountSystem?.(n.id);document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>openNode(b.dataset.go));
 $('parent').onclick=()=>openNode(n.parent);$('view').onclick=()=>{list=!list;localStorage.setItem('kinetic.view',list?'list':'orbit');render()};$('add').onclick=()=>edit(n,true);$('edit').onclick=()=>edit(n,false);if($('leafEdit'))$('leafEdit').onclick=()=>edit(n,false);
 $('download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(nodes,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kinetic-atlas.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('scenario').onclick=()=>{scenario=!scenario;capacity=2;render()};if($('cap'))$('cap').onchange=e=>{capacity=Number(e.target.value);render()};
}
function edit(n,create){
 editing={n,create};const f=$('form').elements;const value=create?{name:'',kind:'Planet',owner:'',due:'',effort:1,status:'Planned',dep:''}:n;
 for(const key of ['name','owner','due','effort','status'])f[key].value=value[key];
 f.kind.closest('label').hidden=!create&&!n.parent;f.kind.value=objectKind(value);f.description.value=value.description||'';f.people.value=value.people??1;
 function dependsOn(t){return t.id===n.id||Boolean(t.dep&&dependsOn(get(t.dep)))}
 const eligible=leaves(path(n)[0]).filter(t=>t.id!==n.id&&(create||!dependsOn(t)));
 f.dep.innerHTML='<option value="">None</option>'+eligible.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');f.dep.value=value.dep;$('formTitle').textContent=create?'Add to '+n.name:'Edit details';$('editor').showModal();f.name.focus();
}
$('form').onsubmit=e=>{e.preventDefault();const {n,create}=editing,values=Object.fromEntries(new FormData(e.target));values.name=values.name.trim();if(!values.name)return;values.effort=Number(values.effort);values.people=Number(values.people);
 if(create)nodes.push({...values,id:crypto.randomUUID(),parent:n.id});else Object.assign(n,{...values,kind:n.parent?values.kind:n.kind});
 localStorage.setItem('kinetic.atlas.v2',JSON.stringify(nodes));$('editor').close();render()};
window.addEventListener('hashchange',render);
window.addEventListener('load',render);
