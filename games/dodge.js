'use strict';

function gameDodge(g){
 const {box,c,ctx}=startCanvas(600,340);
 let px=285,objs=[],pickups=[],score=0,bonusPoints=0,shields=0,iv=null,started=false,elapsed=0,nearMisses=0,pickupChain=0,bestPickupChain=0;
 const status=scoreLine([['Score','0'],['Time','0.0s'],['Near misses','0'],['Shields','0'],['Pickup chain','0']]);box.appendChild(status);
 function draw(){
  drawCanvasBackground(ctx,600,340);
  if(shields>0){ctx.strokeStyle='#65f0db';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px+15,315,25,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;}
  ctx.fillStyle='#a48bff';ctx.beginPath();ctx.moveTo(px+15,303);ctx.lineTo(px,328);ctx.lineTo(px+30,328);ctx.closePath();ctx.fill();
  objs.forEach(o=>{ctx.fillStyle=o.color;ctx.fillRect(o.x,o.y,o.w,o.h);});
  pickups.forEach(p=>{ctx.fillStyle=p.type==='shield'?'#65f0db':'#ffc66d';ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#141520';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(p.type==='shield'?'S':'+',p.x,p.y+4);ctx.textAlign='left';});
 }
 function updateStatus(){score=Math.floor(elapsed*10)+bonusPoints+nearMisses*15;status.innerHTML='<span>Score: <strong>'+score+'</strong></span><span>Time: <strong>'+elapsed.toFixed(1)+'s</strong></span><span>Near misses: <strong>'+nearMisses+'</strong></span><span>Shields: <strong>'+shields+'</strong></span><span>Pickup chain: <strong>'+pickupChain+'x</strong></span>';}
 function tick(){
  elapsed+=.05;
  if(Math.random()<Math.min(.075,.035+elapsed*.0007))objs.push({x:Math.random()*570,y:-25,w:18+Math.random()*27,h:18+Math.random()*25,color:Math.random()<.5?'#ff76b5':'#5fe3d0',v:2+Math.random()*2.8+Math.min(2,elapsed*.025),nearMissed:false});
  if(Math.random()<.022)pickups.push({x:20+Math.random()*560,y:-15,type:Math.random()<.68?'shield':'bonus'});
  objs.forEach(o=>o.y+=o.v);objs=objs.filter(o=>o.y<355);pickups.forEach(p=>p.y+=2.5);
  pickups=pickups.filter(p=>{if(p.y>355)return false;if(Math.abs(p.x-(px+15))<25&&p.y>293&&p.y<340){if(p.type==='shield'){shields=Math.min(2,shields+1);pickupChain=0;}else{pickupChain++;bestPickupChain=Math.max(bestPickupChain,pickupChain);bonusPoints+=50+Math.min(100,(pickupChain-1)*15);flash('Bonus cache chain x'+pickupChain+'!');}return false;}return true;});
  objs.forEach(o=>{
   const vertical=o.y+o.h>288&&o.y<338;
   const dx=Math.abs((px+15)-(o.x+o.w/2));
   if(!o.nearMissed&&vertical&&dx>=o.w/2+15&&dx<=o.w/2+48){o.nearMissed=true;nearMisses++;flash('Close call! +15 near-miss bonus');}
  });
  const hit=objs.find(o=>px+27>o.x&&px<o.x+o.w&&325>o.y&&301<o.y+o.h);
  if(hit){
   if(shields>0){shields--;objs=objs.filter(o=>o!==hit);flash('Shield absorbed a hit!');}
   else{
    updateStatus();clearInterval(iv);started=false;setBest(g,-score);
    box.insertAdjacentHTML('beforeend','<div class="message">Crashed after '+score+' points and '+nearMisses+' near misses. Try again!</div>');
    box.appendChild(button('Retry',()=>runGame(g),true));draw();return;
   }
  }
  updateStatus();draw();
 }
 installKeys(e=>{if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')px=Math.max(0,px-24);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')px=Math.min(570,px+24);});
 c.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||e.buttons){const r=c.getBoundingClientRect();px=Math.max(0,Math.min(570,(e.clientX-r.left)*c.width/r.width-15));}});
 draw();
 box.appendChild(button('Start dodging',()=>{clearInterval(iv);px=285;objs=[];pickups=[];score=0;bonusPoints=0;shields=0;nearMisses=0;pickupChain=0;bestPickupChain=0;elapsed=0;started=true;iv=setInterval(tick,50);},true));
 box.appendChild(button('←',()=>px=Math.max(0,px-28)));box.appendChild(button('→',()=>px=Math.min(570,px+28)));
 cleanup=()=>clearInterval(iv);
}
