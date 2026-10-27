'use strict';

function gameRiftRunner(g){
 const {box,c,ctx}=startCanvas(620,360);const W=1820,H=360;let player={x:42,y:268,w:18,h:24,vx:0,vy:0,ground:false},phase=0,left=false,right=false,jumpQueued=false,shards=new Set(),lives=3,checkpoint=40,playing=false,raf=0,noticeUntil=0;
 const platforms=[
  {x:0,y:300,w:180,h:60,p:-1},{x:225,y:255,w:100,h:12,p:0},{x:375,y:210,w:100,h:12,p:1},
  {x:530,y:285,w:140,h:75,p:-1},{x:720,y:245,w:105,h:12,p:0},{x:870,y:205,w:110,h:12,p:1},
  {x:1020,y:275,w:150,h:85,p:-1},{x:1200,y:235,w:120,h:12,p:1},{x:1370,y:190,w:120,h:12,p:0},
  {x:1530,y:240,w:110,h:12,p:1},{x:1670,y:280,w:180,h:80,p:-1}
 ];
 const riftShards=[{x:270,y:220,p:0},{x:418,y:175,p:1},{x:766,y:210,p:0},{x:1090,y:243,p:-1},{x:1425,y:155,p:0},{x:1584,y:205,p:1}];
 const status=scoreLine([['Rift shards','0 / 6'],['Phase','CYAN'],['Lives','3']]);box.appendChild(status);
 function reset(){player={x:42,y:268,w:18,h:24,vx:0,vy:0,ground:false};phase=0;left=false;right=false;jumpQueued=false;shards=new Set();lives=3;checkpoint=40;playing=true;noticeUntil=performance.now()+1200}
 function active(p){return p.p===-1||p.p===phase}
 function draw(){
  ctx.fillStyle='#0b1020';ctx.fillRect(0,0,c.width,c.height);for(let i=0;i<620;i+=31){ctx.fillStyle='#ffffff0b';ctx.fillRect(i,0,1,360)}for(let i=15;i<620;i+=90){ctx.fillStyle='#ffffff18';ctx.fillRect(i,38+(i%3)*35,2,2)}
  const camera=Math.max(0,Math.min(W-c.width,player.x-190));
  platforms.forEach(p=>{if(p.x+p.w<camera||p.x>camera+c.width)return;ctx.fillStyle=p.p===-1?'#50536d':p.p===phase?(phase===0?'#48dccc':'#ff86bd'):'#2e354b';ctx.fillRect(p.x-camera,p.y,p.w,p.h);ctx.fillStyle=p.p===0?'#70f6e5':p.p===1?'#ffb6d6':'#888da9';if(p.p===-1||p.p===phase)ctx.fillRect(p.x-camera,p.y,p.w,3)});
  riftShards.forEach((v,i)=>{if(shards.has(i)||v.x<camera-20||v.x>camera+c.width+20)return;ctx.save();ctx.translate(v.x-camera,v.y);ctx.rotate(performance.now()/500);ctx.fillStyle=v.p===0?'#65f0db':v.p===1?'#ff91c8':'#ffd166';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,0);ctx.lineTo(0,8);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();ctx.restore()});
  ctx.fillStyle=shards.size>=5?'#65f0db':'#5b537f';ctx.fillRect(1762-camera,223,22,57);ctx.fillStyle='#f3f5ff';ctx.font='bold 10px system-ui';ctx.fillText(shards.size>=5?'PORTAL OPEN':'5 SHARDS',camera>1300?480:Math.max(5,Math.min(560,1760-camera-10)),214);
  ctx.fillStyle=phase===0?'#65f0db':'#ff86bd';ctx.fillRect(player.x-camera,player.y,player.w,player.h);ctx.fillStyle='#101321';ctx.fillRect(player.x-camera+11,player.y+5,4,4);
  ctx.fillStyle='#dfe4ff';ctx.font='bold 12px system-ui';ctx.fillText('PHASE '+(phase===0?'CYAN':'VIOLET'),12,20);
  status.innerHTML='<span>Rift shards: <strong>'+shards.size+' / 6</strong></span><span>Phase: <strong>'+(phase===0?'CYAN':'VIOLET')+'</strong></span><span>Lives: <strong>'+lives+'</strong></span>';
 }
 function finish(win){playing=false;setBest(g,-(shards.size*100+lives*10));box.insertAdjacentHTML('beforeend','<div class="message">'+(win?'Portal reached! You escaped the rift with '+shards.size+' shards.':'The rift collapsed. Shards collected: '+shards.size+'.')+'</div>');box.appendChild(button('Run the rift again',()=>runGame(g),true))}
 function jump(){if(player.ground){player.vy=-9.3;player.ground=false}}
 function frame(){
  if(!playing)return;const oldY=player.y,oldBottom=player.y+player.h;player.vx=(right?3.4:0)-(left?3.4:0);player.x=Math.max(0,Math.min(W-player.w,player.x+player.vx));player.vy=Math.min(10,player.vy+.43);player.y+=player.vy;player.ground=false;
  platforms.forEach(p=>{if(!active(p))return;if(player.vy>=0&&oldBottom<=p.y+1&&player.y+player.h>=p.y&&player.x+player.w>p.x&&player.x<p.x+p.w){player.y=p.y-player.h;player.vy=0;player.ground=true}});
  if(player.x>1000&&checkpoint<1000)checkpoint=1040;
  riftShards.forEach((v,i)=>{if(!shards.has(i)&&Math.abs(player.x+player.w/2-v.x)<18&&Math.abs(player.y+player.h/2-v.y)<21){shards.add(i);flash('Rift shard collected ✦')}});
  if(player.y>390){lives--;if(lives<=0){finish(false);return}player.x=checkpoint;player.y=checkpoint>1000?247:268;player.vx=0;player.vy=0;phase=0;left=false;right=false;flash('Respawned at checkpoint · '+lives+' lives left')}
  if(player.x>1740&&player.y<305&&shards.size>=5){draw();finish(true);return}
  draw();raf=requestAnimationFrame(frame)
 }
 installKeys(e=>{const k=e.key.toLowerCase();if(k==='arrowleft'||k==='a')left=true;if(k==='arrowright'||k==='d')right=true;if(k==='arrowup'||k===' '||k==='w')jump();if((k==='x'||k==='shift')&&!e.repeat){phase=1-phase;noticeUntil=performance.now()+600;flash(phase===0?'Cyan phase':'Violet phase')}});
 const up=e=>{const k=e.key.toLowerCase();if(k==='arrowleft'||k==='a')left=false;if(k==='arrowright'||k==='d')right=false};
 window.addEventListener('keyup',up);
 const controls=document.createElement('div');controls.className='mobile-controls';
 const hold=(label,down,release)=>{const el=document.createElement('button');el.className='game-button';el.textContent=label;el.addEventListener('pointerdown',e=>{e.preventDefault();down()});el.addEventListener('pointerup',e=>{e.preventDefault();release()});el.addEventListener('pointerleave',release);el.addEventListener('pointercancel',release);controls.appendChild(el)};
 hold('←',()=>left=true,()=>left=false);hold('→',()=>right=true,()=>right=false);hold('Jump',jump,()=>{});controls.appendChild(button('Shift phase',()=>{phase=1-phase;flash(phase===0?'Cyan phase':'Violet phase')}));
 box.appendChild(controls);draw();box.appendChild(button('Start Rift Runner',()=>{if(playing)return;reset();raf=requestAnimationFrame(frame)},true));
 cleanup=()=>{playing=false;cancelAnimationFrame(raf);window.removeEventListener('keyup',up);left=false;right=false}
}
