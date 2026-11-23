const menu = document.querySelector('.menuKey');
const nav = document.querySelector('#navigation');
function toggleMenu(open) {
  nav.hidden = !open;
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}
menu.onclick = () => toggleMenu(nav.hidden);
nav.onclick = () => toggleMenu(false);
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });
function ready() { document.body.classList.add('ready'); }
function startUniverse() {
  const T = THREE, flight = document.querySelector('#flight');
  const renderer = new T.WebGLRenderer({antialias:true, alpha:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  const canvas = renderer.domElement;
  const camera = new T.PerspectiveCamera(48,1,.05,250);
  const scene = new T.Scene();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const loader = new T.TextureLoader();
  const names=['Neptune','Uranus','Saturn','Jupiter','Mars','Earth','Venus','Mercury','Sun','Moon'];
  const colors=[0x668dff,0xa4eeff,0xf3cd99,0xdeb691,0xc77351,0x73a8df,0xe69d53,0xb0a59c,0xffb65e,0xbfc5ce];
  const materials=names.map((name,i)=>i===8?new T.MeshBasicMaterial({color:colors[i]}):new T.MeshStandardMaterial({color:colors[i],roughness:1}));
  function loadSurface(i){
    const mat=materials[i];if(mat.userData.loading)return;mat.userData.loading=true;
    loader.load('assets/surface-'+names[i].toLowerCase()+'.webp',map=>{
      map.colorSpace=T.SRGBColorSpace;mat.map=map;mat.color.set(0xffffff);mat.needsUpdate=true;
    });
  }
  const sphere=new T.SphereGeometry(1,72,48);
  function planet(parent,index,r,x,y,z){
    const mesh=new T.Mesh(sphere,materials[index]);mesh.scale.setScalar(r);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  const film=new T.Group(),system=new T.Group();scene.add(film,system);
  const sizes=[1.55,1.48,1.6,2,1.05,1.3,1.25,.95,2.5];
  const destinations=sizes.map((r,i)=>planet(film,i,r,0,0,-26*i));
  const rings=new T.Mesh(new T.RingGeometry(1.38,2.13,120),new T.MeshBasicMaterial({color:0xe7ceac,side:T.DoubleSide,transparent:true,opacity:.75}));
  rings.rotation.set(1.16,.16,-.27);destinations[2].add(rings);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;
  const ctx=glowCanvas.getContext('2d'),grad=ctx.createRadialGradient(64,64,5,64,64,64);
  grad.addColorStop(0,'#ffcf78');grad.addColorStop(.35,'#ff8e3b99');grad.addColorStop(1,'#ff731100');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  const corona=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));corona.scale.setScalar(4.8);destinations[8].add(corona);
  const moonMaterial=materials[9];
  const moons=destinations.slice(0,6).map((_,i)=>planet(film,9,.13+i*.017,0,0,0));
  const rockMap=loader.load('assets/rock.webp');rockMap.colorSpace=T.SRGBColorSpace;
  const rockGeometry=new T.IcosahedronGeometry(.25,2),vertices=rockGeometry.attributes.position;
  for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),d=1+.17*Math.sin(21*x+13*y)*Math.cos(19*z);vertices.setXYZ(i,x*d,y*d,z*d)}
  rockGeometry.computeVertexNormals();
  const rocks=new T.InstancedMesh(rockGeometry,new T.MeshStandardMaterial({map:rockMap,roughness:1}),180);
  const transform=new T.Object3D();
  const debris=Array.from({length:180},(_,i)=>({x:(i%2?1:-1)*(2.8+Math.random()*16),y:(Math.random()-.5)*14,z:8-Math.random()*233,size:.25+Math.random()*.75}));
  film.add(rocks);
  const pointer=new T.Vector2(),drift=new T.Vector2();
  window.addEventListener('pointermove',e=>{
    pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);
  },{passive:true});
  const key=new T.DirectionalLight(0xffe3ce,3.4);key.position.set(-4,3,4);scene.add(key,new T.AmbientLight(0xcde2ff,.67));
  const starData=new Float32Array(5200*3);
  for(let i=0;i<starData.length;i+=3){starData[i]=(Math.random()-.5)*190;starData[i+1]=(Math.random()-.5)*120;starData[i+2]=Math.random()*-290+40}
  const starsGeom=new T.BufferGeometry();starsGeom.setAttribute('position',new T.BufferAttribute(starData,3));
  const stars=new T.Points(starsGeom,new T.PointsMaterial({color:0xc5d4e3,size:.065,sizeAttenuation:true}));scene.add(stars);
  const stellarColors=new Float32Array(starData.length);
  for(let i=0;i<starData.length;i+=3){const v=.2+Math.random()*.8;stellarColors.set([v,v*(.72+Math.random()*.28),v*(.7+Math.random()*.3)],i)}
  starsGeom.setAttribute('color',new T.BufferAttribute(stellarColors,3));stars.material.vertexColors=true;
  const beacons=new T.BufferGeometry();beacons.setAttribute('position',new T.BufferAttribute(starData.slice(0,690),3));scene.add(new T.Points(beacons,new T.PointsMaterial({color:0xfef0ce,size:.16})));
  const boundary=new T.Mesh(sphere,new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.FrontSide,
    vertexShader:'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 n; varying vec3 v; void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(.38,.65,.95,.016+.64*rim);}'
  }));
  scene.add(boundary);
  function cloud(kind,skin){
    const count=kind==='Galaxy'?1600:580,data=new Float32Array(count*3),color=new Float32Array(count*3);
    for(let i=0;i<count;i++){const r=Math.sqrt(Math.random()),arms=skin.includes("Rose")?2:skin.includes("Golden")?4:3,a=i%arms*2*Math.PI/arms+r*(skin.includes("Golden")?3:5)+Math.random()*.65;
      const spiral=kind==='Galaxy';data.set([Math.cos(a)*r,spiral?(Math.random()-.5)*.14:(Math.random()-.5)*1.3,Math.sin(a)*r],i*3);
      color.set([1-r*.48,.7+r*.12,.55+r*.45],i*3)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(data,3));g.setAttribute('color',new T.BufferAttribute(color,3));
    const points=new T.Points(g,new T.PointsMaterial({size:.043,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending}));
    points.rotation.z=.42;system.add(points);return points;
  }
  let pointerStart, momentum=0;
  let holder,buttons=[],bodies=[],tracks=[],inWork=false,angle=0,tilt=.18,zoom=8,zoomTarget=8,drag,travel=0,last=0,time=0,nid;
  const projection=new T.Vector3();
  function mount(el){if(holder!==el){holder=el;el.prepend(canvas)}}
  window.mountSystem=id=>{
    const map=document.querySelector('#space .map');if(!map)return;
    mount(map);buttons=[...map.querySelectorAll('.object')];bodies.filter(b=>b.isPoints).forEach(b=>{b.geometry.dispose();b.material.dispose()});bodies.filter(b=>b.userData.ownMaterial).forEach(b=>{b.material.dispose();b.children.forEach(c=>c.material.dispose())});system.clear();tracks.forEach(t=>{t.geometry.dispose();t.material.dispose()});tracks=[];
    const spread=Math.max(3,buttons.length*.69);
    const root=!get(id).parent,radius=root?Math.max(14,spread*2):spread+2;
    boundary.scale.setScalar(radius);boundary.userData.root=root;
    if(nid!==id||root){angle=0;tilt=.30;zoom=zoomTarget=root?radius*2.95/Math.min(1,map.clientWidth/map.clientHeight):spread*2.7;nid=id}
    bodies=buttons.map((button,i)=>{
      const kind=button.dataset.kind,ph=i*2*Math.PI/buttons.length-.45;
      const node=get(button.dataset.id),skin=node.skin||'',idx=Math.max(0,names.indexOf(skin||(kind==='Moon'?'Moon':'Earth')));
      const body=['Cluster','Galaxy'].includes(kind)?cloud(kind,skin):planet(system,idx,1,0,0,0);
      const scale=({Cluster:1.4,Galaxy:.86,'Stellar system':.58,Planet:.38,Moon:.18}[kind]||.4)*({Critical:1.85,High:1.4,Normal:1}[node.priority]||1);
      body.scale.setScalar(scale);
      if(body.isPoints)body.material.color.set(skin.includes('Golden')||skin.includes('Amber')?0xffc481:skin.includes('Rose')?0xfd96b9:0x98bfff);
      else if(kind==='Stellar system'){
        const tint=skin==='Blue star'?0x85bfff:skin==='Red dwarf'?0xff7544:0xffca77;
        body.material=new T.MeshBasicMaterial({color:tint});body.userData.ownMaterial=true;
        const halo=corona.clone();halo.material=corona.material.clone();halo.material.color.set(tint);body.add(halo);
      }else loadSurface(idx);
      const saved=get(button.dataset.id).position;
      body.position.fromArray(saved||[Math.cos(ph)*spread*.76,Math.sin(ph*2)*.6,Math.sin(ph)*spread*.76]);
      let start,moved=false;
      button.onpointerdown=e=>{start=[e.clientX,e.clientY];moved=false;button.setPointerCapture(e.pointerId)};
      button.onpointermove=e=>{
        if(!start)return;
        const dx=e.clientX-start[0],dy=e.clientY-start[1];if(!moved&&Math.hypot(dx,dy)<5)return;
        moved=true;const scale=zoom*.84/map.clientHeight;
        body.position.addScaledVector(new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0),dx*scale);
        body.position.addScaledVector(new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1),-dy*scale);
        body.position.clampLength(0,radius-.6);start=[e.clientX,e.clientY];
      };
      button.onpointerup=()=>{start=null;if(moved){get(button.dataset.id).position=body.position.toArray();persist()}};
      button.onpointercancel=()=>start=null;
      button.addEventListener('click',e=>{if(moved){e.stopImmediatePropagation();moved=false}},true);
      return body;
    });
    if(buttons.length>1){const pts=Array.from({length:151},(_,i)=>new T.Vector3(spread*Math.cos(i/150*Math.PI*2),0,spread*Math.sin(i/150*Math.PI*2)));
    const track=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0x434447}));system.add(track);tracks.push(track)}
    map.dataset.hint='Drag a label to move it  ·  Drag space to orbit  ·  Scroll to zoom';map.classList.add('interactive');
    canvas.onpointerdown=e=>{pointerStart=[e.clientX,e.clientY];momentum=0;drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};
    canvas.onpointermove=e=>{if(!drag)return;momentum=-(e.clientX-drag[0])*.007;angle+=momentum;tilt=Math.max(-1.2,Math.min(1.2,tilt+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY]};
    canvas.onpointerup=e=>{drag=null;if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;const rect=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);const hit=ray.intersectObjects(bodies)[0];if(hit)buttons[bodies.indexOf(hit.object)].click()};
    canvas.onpointercancel=()=>drag=null;
    canvas.onwheel=e=>{if(!inWork)return;e.preventDefault();zoomTarget=Math.max(3.2,Math.min(140,zoomTarget*Math.exp(e.deltaY*.001)))};
  };
  travel=-1;
  const flightFog=new T.FogExp2(0x030405,.038);
  let w=0,h=0;
  function draw(now){
    requestAnimationFrame(draw);if(document.hidden)return;
    const dt=Math.min(.05,(now-last)/1000);time+=dt;last=now;
    inWork=!document.querySelector('#workspace').hidden;
    if(inWork&&!document.querySelector('.interactive'))return;
    if(!inWork)mount(flight);
    film.visible=!inWork;system.visible=inWork;boundary.visible=inWork&&boundary.userData.root;
    const width=holder.clientWidth,height=holder.clientHeight;if(!width||!height)return;
    if(w!==width||h!==height){w=width;h=height;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
    if(inWork){
      scene.fog=null;zoom+=(zoomTarget-zoom)*(reduced.matches?1:.19);if(!drag&&!reduced.matches){angle+=momentum;momentum*=.88}const a=angle+(reduced.matches?0:time*.018);
      camera.position.set(Math.sin(a)*Math.cos(tilt)*zoom,Math.sin(tilt)*zoom,Math.cos(a)*Math.cos(tilt)*zoom);camera.lookAt(0,0,0);camera.updateMatrixWorld();
      bodies.forEach((b,i)=>{projection.copy(b.position).project(camera);const btn=buttons[i];btn.style.left=(projection.x*.5+.5)*100+'%';btn.style.top=(.5-projection.y*.5)*100+'%';btn.style.visibility=projection.z>1?'hidden':'visible';b.rotation.y=reduced.matches?0:time*.04});
    }else{
      const first=document.querySelector('.checkpoint'),intro=first.offsetTop;
      const raw=scrollY<intro?scrollY/intro-1:(scrollY-intro)/first.offsetHeight;
      const idx=Math.min(8,Math.max(-1,Math.floor(raw))),u=T.MathUtils.clamp(raw-idx,0,1);
      const eased=T.MathUtils.smootherstep(u,.1,.94);
      const target=idx+eased;
      travel+=(target-travel)*(reduced.matches?1:1-Math.exp(-dt*12));
      const entry=T.MathUtils.clamp(scrollY/intro,0,1);
      const onFlight=!document.body.classList.contains('choosing');
      film.visible=onFlight&&entry>.03;
      flightFog.density=.035+.35*(1-entry)**3;scene.fog=flightFog;
      drift.lerp(pointer,.08);
      const movement=reduced.matches?0:1,aspect=Math.min(1.8,camera.aspect);
      const curve=t=>2.3*Math.sin(t*1.73);
      destinations.forEach((body,i)=>{
        const side=i%2===0?-1:1;
        body.position.set(curve(i)+side*(1.55+aspect*1.35),Math.cos(i*1.8)*1.05+(aspect<.9?.65:0),-26*i);
        body.rotation.y=time*.026*movement;
        if(Math.abs(raw-i)<1.4)loadSurface(i);
      });
      if(entry>.2)loadSurface(9);
      const t=travel,bank=Math.sin(2*Math.PI*t)*movement;
      camera.position.set(curve(t)+drift.x*.12*movement,19*(1-entry)+Math.cos(t*1.8)*1.05+drift.y*.1*movement,9-t*26);
      camera.rotation.set(.035*bank,-.08*bank,.052*bank);
      const clock=reduced.matches?0:time;
      moons.forEach((m,i)=>{m.position.copy(destinations[i].position);m.position.x+=2.1*Math.cos(clock*.13+i);m.position.z+=2.1*Math.sin(clock*.13+i);m.position.y+=.52*Math.sin(clock*.13+i)});
      debris.forEach((r,i)=>{transform.position.set(r.x+Math.sin(clock*.19+i)*1.9,r.y+Math.sin(clock*.11+i)*.8,r.z+Math.cos(clock*.15+i)*2.6);transform.scale.set(r.size,r.size*.65,r.size*.85);transform.rotation.set(i+clock*.14,i*.3,clock*.1);transform.updateMatrix();rocks.setMatrixAt(i,transform.matrix)});rocks.instanceMatrix.needsUpdate=true;

    }
    stars.rotation.z=reduced.matches?0:Math.sin(time*.018)*.018;
    renderer.render(scene,camera);ready();
  }
  mount(flight);requestAnimationFrame(draw);setTimeout(ready,1400);
}
try{startUniverse()}catch(error){document.body.classList.add('flat');ready()}

function updateChrome(){document.body.classList.toggle("pastTitle",scrollY>innerHeight*.75)}
addEventListener("scroll",updateChrome,{passive:true});updateChrome();
const captions=[...document.querySelectorAll('.checkpoint')];
function checkpointText(){
  const height=innerHeight;
  document.querySelector("#road").style.setProperty("--travel",Math.max(0,Math.min(1,(scrollY-height)/(8*captions[0].offsetHeight))));
  captions.forEach(section=>{
    const offset=section.getBoundingClientRect().top/section.offsetHeight;
    const opacity=Math.max(0,Math.min(1,(1-Math.abs(offset)) * 2.1-.5));
    const pin=document.querySelector('#road a[href="#'+section.id+'"]');pin.classList.toggle('current',Math.abs(offset)<.5);
    const card=section.firstElementChild;card.style.opacity=opacity;card.style.visibility=opacity?'visible':'hidden';
  });
}
addEventListener('scroll',checkpointText,{passive:true});addEventListener('resize',checkpointText);checkpointText();
if(window.Lenis&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const glide=new Lenis({lerp:.095,smoothWheel:true,anchors:true,autoRaf:true,prevent:el=>Boolean(el.closest('#workspace,#chooser,dialog'))});
}
