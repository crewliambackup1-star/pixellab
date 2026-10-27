'use strict';

function gameFlappy(g){
 const {box,c,ctx}=startCanvas(520,330);let bird={x:100,y:160,vy:0},pipes=[],score=0,stars=0,raf=0,playing=false,ended=false,last=0;
 const status=scoreLine([['Gates','0'],['Bonus stars','0']]);box.appendChild(status);
 const opening=()=>Math.max(43,55-Math.floor(score/5)*2);
 function makePipe(x){const gap=100+Math.random()*130;return{x,gap,scored:false,orbTaken:false,orbY:gap+(Math.random()-.5)*Math.max(12,opening()*.8)}}
 function reset(){bird={x:100,y:160,vy:0};pipes=[];score=0;stars=0;last=0;playing=true;ended=false;for(let i=0;i<3;i++)pipes.push(makePipe(310+i*210));status.innerHTML='<span>Gates: <strong>0</strong></span><span>Bonus stars: <strong>0</strong></span>'}
 function flap(){if(playing)bird.vy=-5.2}
 function draw(){const gap=opening();ctx.fillStyle='#121a2b';ctx.fillRect(0,0,c.width,c.height);for(let y=0;y<c.height;y+=35){ctx.fillStyle='#ffffff08';ctx.fillRect(0,y,c.width,1)}ctx.fillStyle='#5fe3d0';pipes.forEach(p=>{ctx.fillRect(p.x,0,55,p.gap-gap);ctx.fillRect(p.x,p.gap+gap,55,c.height-p.gap-gap);if(!p.orbTaken){ctx.fillStyle='#ffc66d';ctx.beginPath();ctx.arc(p.x+82,p.orbY,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5fe3d0'}});ctx.fillStyle='#ffc66d';ctx.beginPath();ctx.arc(bird.x,bird.y,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#151726';ctx.beginPath();ctx.arc(bird.x+5,bird.y-4,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e6e7f8';ctx.font='bold 22px system-ui';ctx.fillText(String(score+stars*2),15,28)}
 function finish(){playing=false;ended=true;setBest(g,-(score+stars*2));box.insertAdjacentHTML('beforeend','<div class="message">Run over — '+score+' gates and '+stars+' bonus stars collected.</div>');box.appendChild(button('Fly again',()=>{reset();raf=requestAnimationFrame(loop)},true))}
 function loop(ts){if(!playing)return;if(ts-last>16||!last){last=ts;const speed=2.8+Math.min(1.4,score*.045),gap=opening();bird.vy+=.28;bird.y+=bird.vy;pipes.forEach(p=>{p.x-=speed;if(!p.scored&&p.x+55<bird.x){p.scored=true;score++;}if(!p.orbTaken&&Math.abs(bird.x-(p.x+82))<18&&Math.abs(bird.y-p.orbY)<20){p.orbTaken=true;stars++;} });status.innerHTML='<span>Gates: <strong>'+score+'</strong></span><span>Bonus stars: <strong>'+stars+'</strong></span>';if(pipes.length<3&&(!pipes.length||pipes[pipes.length-1].x<370))pipes.push(makePipe(550+Math.random()*30));pipes=pipes.filter(p=>p.x>-100);if(bird.y<0||bird.y>330||pipes.some(p=>bird.x+10>p.x&&bird.x-10<p.x+55&&(bird.y-10<p.gap-gap||bird.y+10>p.gap+gap))){draw();finish();return}draw()}raf=requestAnimationFrame(loop)}
 c.addEventListener('pointerdown',()=>{if(!playing&&!ended){reset();raf=requestAnimationFrame(loop)}flap()});
 installKeys(e=>{if(e.key===' '||e.key==='ArrowUp'||e.key.toLowerCase()==='w'){if(!playing&&!ended){reset();raf=requestAnimationFrame(loop)}flap()}});
 draw();box.appendChild(button('Start flying',()=>{reset();raf=requestAnimationFrame(loop)},true));box.appendChild(button('Flap ⤴',()=>{if(!playing&&!ended){reset();raf=requestAnimationFrame(loop)}flap()}));cleanup=()=>{playing=false;if(raf)cancelAnimationFrame(raf)};
}
