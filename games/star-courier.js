'use strict';

function gameStarCourier(g){
 const {box,c,ctx}=startCanvas(600,360);let player={x:42,y:180},keys={up:false,down:false,left:false,right:false},boost=100,dashUntil=0,invulnUntil=0,delivered=0,carried=false,lives=3,seconds=60,playing=false,raf=0,last=0,over=false;
 const cargoSites=[{x:140,y:70},{x:286,y:292},{x:445,y:76}];let drones=[];
 const status=scoreLine([['Deliveries','0 / 3'],['Time','60s'],['Lives','3'],['Boost','100%']]);box.appendChild(status);
 function reset(){player={x:42,y:180};keys={up:false,down:false,left:false,right:false};boost=100;dashUntil=0;invulnUntil=0;delivered=0;carried=false;lives=3;seconds=60;playing=true;over=false;last=0;drones=[{x:220,y:130,vx:2.0,vy:0,r:13},{x:350,y:245,vx:-1.6,vy:0,r:15},{x:485,y:150,vx:0,vy:1.8,r:12}];updateStatus()}
 function updateStatus(){status.innerHTML='<span>Deliveries: <strong>'+delivered+' / 3</strong></span><span>Time: <strong>'+Math.ceil(seconds)+'s</strong></span><span>Lives: <strong>'+lives+'</strong></span><span>Boost: <strong>'+Math.round(boost)+'%</strong></span>'}
 function draw(){
  drawCanvasBackground(ctx,600,360);ctx.fillStyle='#131b30';ctx.fillRect(0,0,600,360);
  for(let i=0;i<60;i++){const x=(i*83)%600,y=(i*47)%360;ctx.fillStyle='#ffffff26';ctx.fillRect(x,y,2,2)}
  ctx.strokeStyle='#5fe3d044';ctx.lineWidth=2;ctx.beginPath();ctx.arc(555,180,33,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#1f5360';ctx.fillRect(540,164,30,32);ctx.fillStyle='#7deedf';ctx.font='bold 10px system-ui';ctx.fillText('DOCK',538,151);
  if(!carried&&delivered<3){const p=cargoSites[delivered];ctx.fillStyle='#ffc66d';ctx.fillRect(p.x-9,p.y-9,18,18);ctx.fillStyle='#fff0bf';ctx.fillRect(p.x-3,p.y-3,6,6)}
  drones.forEach(d=>{ctx.fillStyle='#ff729f';ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffc1d5';ctx.beginPath();ctx.moveTo(d.x-19,d.y);ctx.lineTo(d.x+19,d.y);ctx.stroke()});
  if(performance.now()>invulnUntil||Math.floor(performance.now()/100)%2===0){ctx.save();ctx.translate(player.x,player.y);ctx.fillStyle='#a58bff';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-11,-9);ctx.lineTo(-7,0);ctx.lineTo(-11,9);ctx.closePath();ctx.fill();ctx.fillStyle='#65f0db';ctx.beginPath();ctx.moveTo(-9,-4);ctx.lineTo(-17,0);ctx.lineTo(-9,4);ctx.fill();if(boost>=35){ctx.strokeStyle='#65f0db44';ctx.beginPath();ctx.arc(0,0,21,0,Math.PI*2);ctx.stroke()}ctx.restore()}
  if(carried){ctx.fillStyle='#ffc66d';ctx.fillRect(player.x-5,player.y-27,11,11)}
  ctx.fillStyle='#e5e7fa';ctx.font='bold 12px system-ui';ctx.fillText('CARGO '+(delivered+(carried?1:0))+' / 3',12,20);
 }
 function end(win){playing=false;over=true;const score=delivered*100+lives*10+Math.floor(seconds/10);setBest(g,-score);box.insertAdjacentHTML('beforeend','<div class="message">'+(win?'All 3 deliveries made! Great piloting.':'Mission failed — '+delivered+' deliveries completed.')+' Score: '+score+'</div>');box.appendChild(button('Fly another route',()=>runGame(g),true))}
 function keyDown(e){if(e.key==='ArrowUp'||e.key.toLowerCase()==='w')keys.up=true;if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')keys.down=true;if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')keys.left=true;if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')keys.right=true;if(e.key===' '&&!e.repeat&&boost>=35){boost-=35;dashUntil=performance.now()+430}}
 function keyUp(e){if(e.key==='ArrowUp'||e.key.toLowerCase()==='w')keys.up=false;if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')keys.down=false;if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')keys.left=false;if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')keys.right=false}
 installKeys(keyDown);window.addEventListener('keyup',keyUp);
 function moveTo(dx,dy){player.x=Math.max(13,Math.min(587,player.x+dx));player.y=Math.max(17,Math.min(343,player.y+dy))}
 function frame(ts){if(!playing)return;const dt=Math.min(34,ts-(last||ts));last=ts;seconds-=dt/1000;boost=Math.min(100,boost+dt*.012);
  const speed=performance.now()<dashUntil?5.7:3.1,dx=(keys.right?1:0)-(keys.left?1:0),dy=(keys.down?1:0)-(keys.up?1:0),len=Math.hypot(dx,dy)||1;moveTo(dx/len*speed,dy/len*speed);
  drones.forEach(d=>{d.x+=d.vx*dt/16.67;d.y+=d.vy*dt/16.67;if(d.x<120||d.x>520)d.vx*=-1;if(d.y<55||d.y>310)d.vy*=-1});
  if(!carried&&delivered<3){const p=cargoSites[delivered];if(Math.hypot(player.x-p.x,player.y-p.y)<22){carried=true;flash('Cargo aboard — return to the dock!')}}
  if(carried&&Math.hypot(player.x-555,player.y-180)<28){delivered++;carried=false;flash('Delivery complete! '+delivered+' / 3');if(delivered>=3){updateStatus();draw();end(true);return}}
  if(performance.now()>invulnUntil){const hit=drones.some(d=>Math.hypot(player.x-d.x,player.y-d.y)<d.r+9);if(hit){lives--;invulnUntil=performance.now()+1300;player.x=42;player.y=180;keys={up:false,down:false,left:false,right:false};carried=false;flash('Drone collision · '+lives+' lives left');if(lives<=0){updateStatus();draw();end(false);return}}}
  if(seconds<=0){seconds=0;updateStatus();draw();end(false);return}updateStatus();draw();raf=requestAnimationFrame(frame)}
 const controls=document.createElement('div');controls.className='mobile-controls';const hold=(label,prop)=>{const el=button(label,()=>{});el.addEventListener('pointerdown',e=>{e.preventDefault();keys[prop]=true});['pointerup','pointerleave','pointercancel'].forEach(type=>el.addEventListener(type,()=>keys[prop]=false));controls.appendChild(el)};hold('↑','up');hold('←','left');hold('↓','down');hold('→','right');controls.appendChild(button('Boost ✦',()=>{if(boost>=35){boost-=35;dashUntil=performance.now()+430}}));box.appendChild(controls);
 draw();box.appendChild(button('Start delivery run',()=>{if(playing)return;reset();raf=requestAnimationFrame(frame)},true));cleanup=()=>{playing=false;cancelAnimationFrame(raf);window.removeEventListener('keyup',keyUp);keys={up:false,down:false,left:false,right:false}};
}
