const target = 15;
const stages = {
  Design: {tasks: [['Approve layouts', 4]], note: 'Approved layouts unlock both development tasks.'},
  Development: {tasks: [['Build the site', 6], ['Set up the CMS', 6]], note: '12 developer-days assigned. Launch waits for both tasks.'},
  Launch: {tasks: [['Final QA and release', 3]], note: 'Starts after the site and CMS are both complete.'}
};
function schedule(staff) {
  const available = Array(staff).fill(0);
  for (const [, effort] of stages.Development.tasks) {
    const worker = available.indexOf(Math.min(...available));
    available[worker] += effort;
  }
  const days = [stages.Design.tasks[0][1], Math.max(...available), stages.Launch.tasks[0][1]];
  const finish = days.reduce((sum, days) => sum + days, 0);
  return {days, finish, slack: target - finish};
}
let selected = 'Development';
let staffing = 1;
const el = id => document.getElementById(id);
function selectStage() {
  el('stage').textContent = selected;
  el('stage-note').textContent = stages[selected].note;
  el('tasks').replaceChildren(...stages[selected].tasks.map(([name, duration]) => {
    const row = document.createElement('div');
    row.className = 'task';
    row.innerHTML = '<span>'+name+'</span><strong>'+duration+' '+(selected === 'Development' ? 'dev-days' : 'days')+'</strong>';
    return row;
  }));
  document.querySelectorAll('[data-stage]').forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.stage === selected));
}
function forecast(id, label, staff) {
  const {days, finish, slack} = schedule(staff);
  const status = Math.abs(slack)+' days '+(slack < 0 ? 'late' : 'early');
  el(id).innerHTML = '<div class="result-label">'+label+' <span> / </span> '+staff+' developer'+(staff > 1 ? 's' : '')+'</div><div class="value"><strong>Day '+finish+'</strong><em class="'+(slack < 0 ? 'late':'early')+'">'+status+'</em></div><div class="timeline" aria-hidden="true">'+days.map((n,i)=>'<i class="seg s'+i+'" style="width:'+n/20*100+'%"></i>').join('')+'<b></b></div><div class="breakdown">Design '+days[0]+'d <span>·</span> Development '+days[1]+'d <span>·</span> Launch '+days[2]+'d</div>';
}
function update(animate = false) {
  document.querySelector('.system').classList.toggle('two', staffing === 2);
  const previousDuration = el('scenario').querySelector('.s1')?.style.width;
  forecast('scenario','Selected scenario',staffing);
  const late = schedule(staffing).slack < 0;
  el('risk').textContent = late ? 'Deadline at risk' : 'On track';
  el('risk').className = late ? 'late':'early';
  document.querySelectorAll('[data-count]').forEach(btn => btn.setAttribute('aria-pressed', Number(btn.dataset.count) === staffing));
  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const segment = el('scenario').querySelector('.s1');
    segment.animate([{width:previousDuration},{width:segment.style.width}], {duration:460,easing:'cubic-bezier(.2,.75,.3,1)'});
    el('scenario').querySelector('.value').animate([{opacity:.45,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:300});
  }
}
document.querySelectorAll('[data-stage]').forEach(btn => btn.onclick = () => {selected = btn.dataset.stage; selectStage();});
document.querySelectorAll('[data-count]').forEach(btn => btn.onclick = () => {staffing = Number(btn.dataset.count); update(true);});
el('reset').onclick = () => {selected = 'Development'; staffing = 1; selectStage(); update(true);};
selectStage(); forecast('baseline','Baseline',1); update();
const starCanvas = el('stars');
function paintStars(){
  const w = starCanvas.width = starCanvas.clientWidth * 2, h = starCanvas.height = starCanvas.clientHeight * 2;
  const ctx = starCanvas.getContext('2d');
  let seed = 8765;
  const random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  // Overlapping low-opacity clouds form a distant, diagonal dust lane.
  for (let i = 0; i < 840; i++) {
    const t = random();
    const x = t * w;
    const y = h * (.89 - .71 * t + .07 * Math.sin(11*t) + (random()+random()-1)*.32);
    const radius = (.008 + random()*.085) * h;
    const color = t < .32 ? '102,147,182' : t > .73 ? '151,130,176' : '204,143,88';
    const gas = ctx.createRadialGradient(x,y,0,x,y,radius);
    gas.addColorStop(0,'rgba('+color+',.053)');
    gas.addColorStop(1,'rgba('+color+',0)');
    ctx.fillStyle = gas;
    ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  for(let i=0;i<430;i++){
    const x=random()*w, y=random()*h, r=.45+random()*1.6;
    ctx.fillStyle='rgba(216,224,239,'+(.15+random()*.68)+')';
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    if(i%79===0){ctx.fillRect(x-4,y-.6,8,1.2);ctx.fillRect(x-.6,y-4,1.2,8);}
  }
}
new ResizeObserver(paintStars).observe(starCanvas);

const scene = document.querySelector('.observatory');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function shiftDepth(x, y) {
  scene.style.setProperty('--sky-x', x * -7 + 'px');
  scene.style.setProperty('--sky-y', y * -5 + 'px');
  scene.style.setProperty('--planet-x', x * 3 + 'px');
  scene.style.setProperty('--planet-y', y * 2 + 'px');
}
scene.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
  shiftDepth(event.clientX / innerWidth * 2 - 1, event.clientY / innerHeight * 2 - 1);
});
scene.addEventListener('pointerleave', () => shiftDepth(0, 0));
reducedMotion.addEventListener('change', () => shiftDepth(0, 0));
