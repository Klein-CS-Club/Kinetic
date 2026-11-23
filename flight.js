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
  const materials = ['world0','world1','world2','venus'].map(name => {
    const map = loader.load('assets/'+name+'.jpg'); map.colorSpace=T.SRGBColorSpace;
    return new T.MeshStandardMaterial({map,roughness:1});
  });
  const sphere = new T.SphereGeometry(1,80,52);
  function planet(parent,index,r,x,y,z) {
    const mesh = new T.Mesh(sphere,materials[index%materials.length]);
    mesh.scale.setScalar(r);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  const film=new T.Group(),system=new T.Group();scene.add(film,system);
  const destinations=[
    planet(film,1,1.30,0,.45,-5),
    planet(film,0,1.48,0,-.4,-19),
    planet(film,2,1.12,0,.35,-33)
  ];
  destinations.push(planet(film,3,1.55,-4,.8,-54),planet(film,0,2,5,-1,-76),planet(film,2,1.1,-4,.5,-99));
  const moonMaterial=new T.MeshStandardMaterial({color:0xabbac8,roughness:1,flatShading:true});
  const moons=destinations.map((_,i)=>{const m=new T.Mesh(new T.IcosahedronGeometry(.19+i*.015,2),moonMaterial);film.add(m);return m});
  const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(.19,0),moonMaterial,180);
  const transform=new T.Object3D();
  const debris=Array.from({length:180},(_,i)=>({x:(i%2?1:-1)*(2.8+Math.random()*16),y:(Math.random()-.5)*14,z:8-Math.random()*115,size:.25+Math.random()*.75}));
  film.add(rocks);
  const pointer=new T.Vector2(),drift=new T.Vector2();
  window.addEventListener('pointermove',e=>{
    pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);
  },{passive:true});
  const key=new T.DirectionalLight(0xffe3ce,3.4);key.position.set(-4,3,4);scene.add(key,new T.AmbientLight(0xcde2ff,.67));
  const starData=new Float32Array(5200*3);
  for(let i=0;i<starData.length;i+=3){starData[i]=(Math.random()-.5)*190;starData[i+1]=(Math.random()-.5)*120;starData[i+2]=Math.random()*-155+20}
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
  function cloud(kind){
    const count=kind==='Galaxy'?1600:580,data=new Float32Array(count*3),color=new Float32Array(count*3);
    for(let i=0;i<count;i++){const r=Math.sqrt(Math.random()),a=i%3*2.094+r*5+Math.random()*.65;
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
    mount(map);buttons=[...map.querySelectorAll('.object')];bodies.filter(b=>b.isPoints).forEach(b=>{b.geometry.dispose();b.material.dispose()});system.clear();tracks.forEach(t=>{t.geometry.dispose();t.material.dispose()});tracks=[];
    const spread=Math.max(3,buttons.length*.69);
    const root=!get(id).parent,radius=spread+2;
    boundary.scale.setScalar(radius);boundary.userData.root=root;
    if(nid!==id||root){angle=0;tilt=.30;zoom=zoomTarget=root?radius*2.95/Math.min(1,map.clientWidth/map.clientHeight):spread*2.7;nid=id}
    bodies=buttons.map((button,i)=>{
      const kind=button.dataset.kind,ph=i*2*Math.PI/buttons.length-.45;
      const body=['Cluster','Galaxy'].includes(kind)?cloud(kind):planet(system,i,kind==='Moon'?.32:.64,0,0,0);
      if(kind==='Moon')body.material=moonMaterial;
      if(kind==='Stellar system'){
        const belt=new T.Mesh(new T.RingGeometry(1.35,1.42,72),new T.MeshBasicMaterial({color:0xefc886,side:T.DoubleSide}));belt.rotation.x=1.12;body.add(belt);tracks.push(belt);
      }
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
    canvas.onwheel=e=>{if(!inWork)return;e.preventDefault();zoomTarget=Math.max(3.2,Math.min(40,zoomTarget*Math.exp(e.deltaY*.001)))};
  };
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
      zoom+=(zoomTarget-zoom)*(reduced.matches?1:.19);if(!drag&&!reduced.matches){angle+=momentum;momentum*=.88}const a=angle+(reduced.matches?0:time*.018);
      camera.position.set(Math.sin(a)*Math.cos(tilt)*zoom,Math.sin(tilt)*zoom,Math.cos(a)*Math.cos(tilt)*zoom);camera.lookAt(0,0,0);camera.updateMatrixWorld();
      bodies.forEach((b,i)=>{projection.copy(b.position).project(camera);const btn=buttons[i];btn.style.left=(projection.x*.5+.5)*100+'%';btn.style.top=(.5-projection.y*.5)*100+'%';btn.style.visibility=projection.z>1?'hidden':'visible';b.rotation.y=reduced.matches?0:time*.04});
    }else{
      const progress=scrollY/innerHeight;
      const entered=progress>.75 && !document.body.classList.contains('choosing');
      const target=Math.max(0,progress-.75);
      travel+=(target-travel)*(reduced.matches?1:.2);
      film.visible=!document.body.classList.contains("choosing");
      drift.lerp(pointer,.095);
      const aspect=Math.max(.45,Math.min(2,camera.aspect));
      destinations.forEach((body,i)=>{
        const side=i%2===0?-1:1;
        body.position.x=side*(1.7+2.35*aspect);
        body.rotation.y=reduced.matches?0:time*.028;

        body.position.y=camera.aspect<.9?1.35:(i===1?-.4:.45);
      });
      const sway=entered&&!reduced.matches?.17:0;
      camera.position.set(drift.x*sway,drift.y*sway,32-travel*18);
      camera.rotation.set(0,0,0);
      const clock=reduced.matches?0:time;
      moons.forEach((m,i)=>{m.position.copy(destinations[i].position);m.position.x+=2.1*Math.cos(clock*.13+i);m.position.z+=2.1*Math.sin(clock*.13+i);m.position.y+=.52*Math.sin(clock*.13+i)});
      debris.forEach((r,i)=>{transform.position.set(r.x+Math.sin(clock*.12+i)*.6,r.y,r.z);transform.scale.set(r.size,r.size*.65,r.size*.85);transform.rotation.set(i+clock*.14,i*.3,clock*.1);transform.updateMatrix();rocks.setMatrixAt(i,transform.matrix)});rocks.instanceMatrix.needsUpdate=true;

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
  captions.forEach(section=>{
    const offset=section.getBoundingClientRect().top/height;
    const opacity=Math.max(0,Math.min(1,(1-Math.abs(offset)) * 2.1-.5));
    const card=section.firstElementChild;card.style.opacity=opacity;card.style.visibility=opacity?'visible':'hidden';
  });
}
addEventListener('scroll',checkpointText,{passive:true});addEventListener('resize',checkpointText);checkpointText();
if(window.Lenis&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const glide=new Lenis({lerp:.095,smoothWheel:true,anchors:true,autoRaf:true,prevent:el=>Boolean(el.closest('#workspace,#chooser,dialog'))});
}
