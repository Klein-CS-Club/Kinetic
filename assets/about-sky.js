const sky=document.querySelector('.aboutSky'),context=sky.getContext('2d');
const stars=Array.from({length:310},()=>[Math.random(),Math.random(),.2+Math.random()]);
const rock=new Image();rock.src='assets/rock.webp';
const quiet=matchMedia('(prefers-reduced-motion: reduce)');
let x=0,y=0,u=0,v=0;
addEventListener('pointermove',e=>{x=e.clientX/innerWidth-.5;y=e.clientY/innerHeight-.5});
function paint(ms){
 requestAnimationFrame(paint);if(document.hidden)return;
 if(sky.width!==innerWidth||sky.height!==innerHeight){sky.width=innerWidth;sky.height=innerHeight}
 const w=sky.width,h=sky.height,t=quiet.matches?0:ms*.00005;
 u+=(x-u)*.045;v+=(y-v)*.045;context.clearRect(0,0,w,h);
 for(const [a,b,d] of stars){context.fillStyle='rgba(210,224,248,'+d*.72+')';context.fillRect(a*w+(quiet.matches?0:u*d*18),b*h+(quiet.matches?0:v*d*18),d*1.5,d*1.5)}
 if(!rock.naturalWidth)return;
 for(let i=0;i<2;i++){
 context.save();context.translate(((t*.15+i*.63+.12)%1)*(w+80)-40,h*(i?.72:.27)+Math.sin(t+i)*24);
 context.rotate(t*(i?-.7:.48));context.scale(i?1.5:1,1);context.beginPath();
 for(let j=0;j<14;j++){const a=j*Math.PI/7,r=12+3*Math.sin(j*4.3);context.lineTo(Math.cos(a)*r,Math.sin(a)*r)}
 context.closePath();context.clip();context.drawImage(rock,0,0,800,800,-17,-17,34,34);
 const shade=context.createLinearGradient(-14,-12,12,12);shade.addColorStop(0,'#ebc09b33');shade.addColorStop(1,'#030309ea');context.fillStyle=shade;context.fillRect(-17,-17,34,34);context.restore()
 }}
requestAnimationFrame(paint);
