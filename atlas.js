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
let list=localStorage.getItem('kinetic.view')==='list',editing=null,capacity=1,scenario=false,art=[],active='';
const get=id=>nodes.find(n=>n.id===id),children=id=>nodes.filter(n=>n.parent===id);
function leaves(n){const kids=children(n.id);return kids.length?kids.flatMap(leaves):[n]}
function path(n){return n.parent?[...path(get(n.parent)),n]:[n]}
function openNode(id){location.hash='explore/'+id}
$('samples').innerHTML=catalogs.map(([name,kind],i)=>`<a class="card" href="#explore/org${i}"><div><small>${kind}</small><strong>${name}</strong></div>↗</a>`).join('');
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
 $('workspace').hidden=!show;$('home').hidden=show;if(!show)return;
 const n=get(id)||get('org0');if(active!==n.id){scenario=false;capacity=1;active=n.id}
 const items=children(n.id),tasks=leaves(n),done=tasks.filter(t=>t.status==='Done').length;
 $('toolbar').innerHTML='<div>'+path(n).map(t=>`<button class="crumb" data-go="${t.id}">${esc(t.name)}</button>`).join(' / ')+'</div><select aria-label="Organization" id="org">'+nodes.filter(t=>!t.parent).map(t=>`<option value="${t.id}" ${t.id===path(n)[0].id?'selected':''}>${esc(t.name)}</option>`).join('')+'</select>';
 $('org').onchange=e=>openNode(e.target.value);
 $('space').innerHTML=`<small class="kicker">${esc(n.kind.toUpperCase())}</small><h2>${esc(n.name)}</h2><div class="actions"><button id="view">${list?'Orbital map':'List view'}</button><button id="parent" ${n.parent?'':'hidden'}>↑ Up one level</button><button id="add">＋ Add item</button></div><div class="${list?'list':'map'}">${(items.length?items:[n]).map((t,i)=>`<button class="${list?'':'object'}" ${items.length?'data-go="'+t.id+'"':'id="leafEdit"'}><strong>${esc(t.name)}</strong><small>${esc(t.kind)} · ${esc(t.status)}</small></button>`).join('')}</div>`;
 $('details').innerHTML=`<small class="kicker">INSPECTOR</small><h2>${esc(n.name)}</h2><p>${done} of ${tasks.length} leaf items complete</p><p>${esc(n.owner||'Unassigned')}${n.due?' · Due '+esc(n.due):''}</p>${n.dep?'<p>Starts after '+esc(get(n.dep)?.name)+'</p>':''}<div class="actions"><button id="edit">Edit details</button><button id="download">Export atlas</button></div><hr><small class="kicker">FINISH FORECAST</small><h2>Day ${schedule(tasks,scenario?capacity:1)}</h2><p>From project start · ${scenario?capacity:1} available worker${scenario&&capacity>1?'s':''}</p>${scenario?`<label>Scenario capacity<select id="cap">${[1,2,3,4].map(v=>`<option ${v===capacity?'selected':''}>${v}</option>`).join('')}</select></label><p>Baseline · day ${schedule(tasks,1)}</p>`:''}<div class="actions"><button id="scenario">${scenario?'Discard scenario':'Compare staffing'}</button></div><a href="simulation.html">Studio North simulation ↗</a>`;
 window.mountSystem?.(n.id);document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>openNode(b.dataset.go));
 $('parent').onclick=()=>openNode(n.parent);$('view').onclick=()=>{list=!list;localStorage.setItem('kinetic.view',list?'list':'orbit');render()};$('add').onclick=()=>edit(n,true);$('edit').onclick=()=>edit(n,false);if($('leafEdit'))$('leafEdit').onclick=()=>edit(n,false);
 $('download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(nodes,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kinetic-atlas.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('scenario').onclick=()=>{scenario=!scenario;capacity=2;render()};if($('cap'))$('cap').onchange=e=>{capacity=Number(e.target.value);render()};
}
function edit(n,create){
 editing={n,create};const f=$('form').elements;const value=create?{name:'',kind:'Task',owner:'',due:'',effort:1,status:'Planned',dep:''}:n;
 for(const key of ['name','kind','owner','due','effort','status'])f[key].value=value[key];
 function dependsOn(t){return t.id===n.id||Boolean(t.dep&&dependsOn(get(t.dep)))}
 const eligible=leaves(path(n)[0]).filter(t=>t.id!==n.id&&(create||!dependsOn(t)));
 f.dep.innerHTML='<option value="">None</option>'+eligible.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');f.dep.value=value.dep;$('formTitle').textContent=create?'Add to '+n.name:'Edit details';$('editor').showModal();f.name.focus();
}
$('form').onsubmit=e=>{e.preventDefault();const {n,create}=editing,values=Object.fromEntries(new FormData(e.target));values.name=values.name.trim();if(!values.name)return;values.effort=Number(values.effort);
 if(create)nodes.push({...values,id:crypto.randomUUID(),parent:n.id});else Object.assign(n,values);
 localStorage.setItem('kinetic.atlas.v2',JSON.stringify(nodes));$('editor').close();render()};
window.addEventListener('hashchange',render);
window.addEventListener('load',render);
