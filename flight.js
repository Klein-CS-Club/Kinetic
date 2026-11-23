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
  const materials = [0,1,2].map(i => {
    const map = loader.load('assets/world'+i+'.jpg'); map.colorSpace=T.SRGBColorSpace;
    return new T.MeshStandardMaterial({map,roughness:1});
  });
  const sphere = new T.SphereGeometry(1,80,52);
  function planet(parent,index,r,x,y,z) {
    const mesh = new T.Mesh(sphere,materials[index%3]);
    mesh.scale.setScalar(r);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  const film=new T.Group(),system=new T.Group();scene.add(film,system);
  const destinations=[
    planet(film,1,1.30,0,.45,-5),
    planet(film,0,1.48,0,-.4,-19),
    planet(film,2,1.12,0,.35,-33)
  ];
  const pointer=new T.Vector2(),drift=new T.Vector2();
  window.addEventListener('pointermove',e=>{
    pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);
  },{passive:true});
  const key=new T.DirectionalLight(0xffe3ce,3.4);key.position.set(-4,3,4);scene.add(key,new T.AmbientLight(0xaac7df,.23));
  const starData=new Float32Array(5200*3);
  for(let i=0;i<starData.length;i+=3){starData[i]=(Math.random()-.5)*190;starData[i+1]=(Math.random()-.5)*120;starData[i+2]=Math.random()*-155+20}
  const starsGeom=new T.BufferGeometry();starsGeom.setAttribute('position',new T.BufferAttribute(starData,3));
  const stars=new T.Points(starsGeom,new T.PointsMaterial({color:0xc5d4e3,size:.065,sizeAttenuation:true}));scene.add(stars);
  let pointerStart, momentum=0;
  let holder,buttons=[],bodies=[],tracks=[],inWork=false,angle=0,tilt=.18,zoom=8,zoomTarget=8,drag,travel=0,last=0,time=0,nid;
  const projection=new T.Vector3();
  function mount(el){if(holder!==el){holder=el;el.prepend(canvas)}}
  window.mountSystem=id=>{
    const map=document.querySelector('#space .map');if(!map)return;
    mount(map);buttons=[...map.querySelectorAll('.object')];system.clear();tracks.forEach(t=>{t.geometry.dispose();t.material.dispose()});tracks=[];
    const spread=Math.max(3,buttons.length*.69);
    if(nid!==id){angle=0;tilt=.22;zoom=zoomTarget=spread*2.35;nid=id}
    bodies=buttons.map((_,i)=>planet(system,i,.68+(i%3)*.08,0,0,0));
    if(buttons.length>1){const pts=Array.from({length:151},(_,i)=>new T.Vector3(spread*Math.cos(i/150*Math.PI*2),0,spread*Math.sin(i/150*Math.PI*2)));
    const track=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0x434447}));system.add(track);tracks.push(track)}
    map.dataset.hint='Drag to orbit  ·  Scroll to zoom';map.classList.add('interactive');
    canvas.onpointerdown=e=>{pointerStart=[e.clientX,e.clientY];momentum=0;drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};
    canvas.onpointermove=e=>{if(!drag)return;momentum=-(e.clientX-drag[0])*.007;angle+=momentum;tilt=Math.max(-1.2,Math.min(1.2,tilt+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY]};
    canvas.onpointerup=e=>{drag=null;if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;const rect=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);const hit=ray.intersectObjects(bodies)[0];if(hit)buttons[bodies.indexOf(hit.object)].click()};
    canvas.onpointercancel=()=>drag=null;
    canvas.onwheel=e=>{if(!inWork)return;e.preventDefault();zoomTarget=Math.max(3.2,Math.min(40,zoomTarget*Math.exp(e.deltaY*.001)))};
  };
  let w=0,h=0;
  function draw(now){
    requestAnimationFrame(draw);if(document.hidden||now-last<30)return;
    time+=Math.min(.1,(now-last)/1000);last=now;
    inWork=!document.querySelector('#workspace').hidden;
    if(inWork&&!document.querySelector('.interactive'))return;
    if(!inWork)mount(flight);
    film.visible=!inWork;system.visible=inWork;
    const width=holder.clientWidth,height=holder.clientHeight;if(!width||!height)return;
    if(w!==width||h!==height){w=width;h=height;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
    if(inWork){
      zoom+=(zoomTarget-zoom)*(reduced.matches?1:.19);if(!drag&&!reduced.matches){angle+=momentum;momentum*=.88}const a=angle+(reduced.matches?0:time*.018);
      camera.position.set(Math.sin(a)*Math.cos(tilt)*zoom,Math.sin(tilt)*zoom,Math.cos(a)*Math.cos(tilt)*zoom);camera.lookAt(0,0,0);camera.updateMatrixWorld();
      bodies.forEach((b,i)=>{const ph=i*2*Math.PI/bodies.length-.45,r=bodies.length===1?0:Math.max(3,bodies.length*.69);b.position.set(Math.cos(ph)*r,0,Math.sin(ph)*r);projection.copy(b.position).project(camera);const btn=buttons[i];btn.style.left=(projection.x*.5+.5)*100+'%';btn.style.top=(.5-projection.y*.5)*100+'%';btn.style.visibility=projection.z>1?'hidden':'visible';b.rotation.y=reduced.matches?0:time*.04});
    }else{
      const progress=Math.min(3,scrollY/innerHeight);
      const entered=progress>.75 && !document.body.classList.contains('choosing');
      const target=Math.max(0,progress-.75);
      travel+=(target-travel)*(reduced.matches?1:.2);
      film.visible=entered;
      drift.lerp(pointer,.095);
      const aspect=Math.max(.45,Math.min(2,camera.aspect));
      destinations.forEach((body,i)=>{
        const side=i===0?-1:1;
        body.position.x=side*(1.7+2.35*aspect);
        body.rotation.y=reduced.matches?0:time*.028;
        body.visible=camera.position.z-body.position.z>2.5;
        body.position.y=camera.aspect<.9?1.35:(i===1?-.4:.45);
      });
      const sway=entered&&!reduced.matches?.17:0;
      camera.position.set(drift.x*sway,drift.y*sway,9-travel*14);
      camera.rotation.set(0,0,0);

    }
    stars.rotation.z=reduced.matches?0:Math.sin(time*.018)*.018;
    renderer.render(scene,camera);ready();
  }
  mount(flight);requestAnimationFrame(draw);setTimeout(ready,1400);
}
try{startUniverse()}catch(error){document.body.classList.add('flat');ready()}

function updateChrome(){document.body.classList.toggle("pastTitle",scrollY>innerHeight*.75)}
addEventListener("scroll",updateChrome,{passive:true});updateChrome();
