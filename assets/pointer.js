// Keep the native pointer. Only interactive targets receive a local highlight.
if(matchMedia('(hover:hover) and (pointer:fine)').matches){
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let target=null,frame=0,x=0,y=0;
  function clear(){
    target?.removeAttribute('data-pointer');
    target?.style.removeProperty('--tilt-x');target?.style.removeProperty('--tilt-y');
    target=null;
  }
  function paint(){
    frame=0;if(!target)return;
    const rect=target.getBoundingClientRect();
    const u=Math.max(0,Math.min(1,(x-rect.left)/rect.width)),v=Math.max(0,Math.min(1,(y-rect.top)/rect.height));
    target.style.setProperty('--px',u*100+'%');target.style.setProperty('--py',v*100+'%');
    if(!motion.matches&&target.matches('#universes a')){
      target.style.setProperty('--tilt-x',(0.5-v)*6+'deg');target.style.setProperty('--tilt-y',(u-.5)*8+'deg');
    }
  }
  document.addEventListener('pointermove',e=>{
    const next=e.target.closest('a,button,summary,select');
    if(next!==target){clear();target=next;target?.setAttribute('data-pointer','')}
    x=e.clientX;y=e.clientY;if(target&&!frame)frame=requestAnimationFrame(paint);
  },{passive:true});
  document.addEventListener('pointerleave',clear);window.addEventListener('blur',clear);
}
