'use strict';

function gamePong(g){
 const box=baseBox();let mode=null,iv=null,py=125,ay=125,ball={x:300,y:170,vx:4,vy:2},score=0,rightScore=0,started=false;
 function modeCard(label,description,next,disabled=false){
  const wrap=document.createElement('div');wrap.className='mp-mode-card';
  const btn=button(label,()=>{if(!disabled)startMode(next)});btn.className='mp-mode-button';btn.disabled=disabled;wrap.append(btn);
  const note=document.createElement('p');note.className='mp-mode-note';note.textContent=description;wrap.append(note);return wrap;
 }
 function clearInput(){
  clearInterval(iv);iv=null;
  if(keyHandler){window.removeEventListener('keydown',keyHandler);keyHandler=null}
 }
 function showModePicker(){
  clearInput();mode=null;box.innerHTML='';
  const title=document.createElement('div');title.className='big-number mp-title';title.textContent='Choose your game mode';box.append(title);
  const choices=document.createElement('div');choices.className='mp-mode-picker';
  choices.append(modeCard('🤖 Play vs AI','Play against the computer. Use W/S or the arrow keys.','ai'));
  choices.append(modeCard('👥 2 Players · Same Device','Player 1: W/S · Player 2: ↑/↓. First to 5 points wins.','local'));
  choices.append(modeCard('🌐 Online room','Play across devices — coming soon.','online',true));
  box.append(choices);
 }
 function startMode(nextMode){
  clearInput();mode=nextMode;py=ay=125;score=rightScore=0;resetBall(Math.random()<.5?-1:1);started=false;box.innerHTML='';
  const c=document.createElement('canvas');c.width=600;c.height=340;c.style.width='min(100%,600px)';c.style.height='auto';box.append(c);
  const ctx=c.getContext('2d');
  const status=scoreLine([[mode==='ai'?'You':'Player 1',0],[mode==='ai'?'CPU':'Player 2',0]]);box.append(status);
  const message=document.createElement('div');message.className='message';message.textContent=mode==='ai'?'Use W/S or ↑/↓. First to 5 wins.':'Player 1 uses W/S · Player 2 uses ↑/↓. First to 5 wins.';box.append(message);
  const start=button('Start match',()=>{clearInterval(iv);score=rightScore=0;py=ay=125;resetBall(Math.random()<.5?-1:1);started=true;start.disabled=true;message.textContent='Match on!';iv=setInterval(tick,16);draw()},true);box.append(start);
  function draw(){
   drawCanvasBackground(ctx,600,340);
   ctx.setLineDash([6,8]);ctx.strokeStyle='#ffffff30';ctx.beginPath();ctx.moveTo(300,0);ctx.lineTo(300,340);ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle='#a48bff';ctx.fillRect(22,py,11,85);ctx.fillStyle='#5fe3d0';ctx.fillRect(567,ay,11,85);
   ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ball.x,ball.y,8,0,Math.PI*2);ctx.fill();
   ctx.font='bold 28px system-ui';ctx.fillStyle='#fff';ctx.fillText(score,240,38);ctx.fillText(rightScore,335,38);
   status.innerHTML='<span>'+(mode==='ai'?'You':'Player 1')+': <strong>'+score+'</strong></span><span>'+(mode==='ai'?'CPU':'Player 2')+': <strong>'+rightScore+'</strong></span>';
  }
  function finish(){
   clearInterval(iv);iv=null;started=false;
   const leftWon=score>rightScore;
   message.textContent=leftWon?(mode==='ai'?'You win the rally!':'Player 1 wins the rally!'):(mode==='ai'?'Computer takes this round.':'Player 2 wins the rally!');
   if(mode==='ai')setBest(g,-score);
   start.remove();
   const actions=document.createElement('div');actions.className='mp-actions';
   actions.append(button('Play again',()=>startMode(mode),true),button('Change mode',showModePicker));box.append(actions);
  }
  function tick(){
   if(!started)return;
   ball.x+=ball.vx;ball.y+=ball.vy;
   if(ball.y<8||ball.y>332)ball.vy*=-1;
   if(ball.x<40&&ball.y>py&&ball.y<py+85){ball.vx=Math.abs(ball.vx)*1.04;ball.vy+=(ball.y-(py+42))*.06}
   if(ball.x>560&&ball.y>ay&&ball.y<ay+85){ball.vx=-Math.abs(ball.vx)*1.04;ball.vy+=(ball.y-(ay+42))*.06}
   if(mode==='ai'){ay+=Math.sign(ball.y-(ay+42))*Math.min(3.7,Math.abs(ball.y-(ay+42))*.06);ay=Math.max(0,Math.min(255,ay))}
   if(ball.x<0){rightScore++;resetBall(1)}
   if(ball.x>600){score++;resetBall(-1)}
   draw();
   if(score>=5||rightScore>=5)finish();
  }
  installKeys(e=>{
   if(['w','W'].includes(e.key))py=Math.max(0,py-24);
   if(['s','S'].includes(e.key))py=Math.min(255,py+24);
   if(mode==='local'&&e.key==='ArrowUp')ay=Math.max(0,ay-24);
   if(mode==='local'&&e.key==='ArrowDown')ay=Math.min(255,ay+24);
   if(mode==='ai'&&e.key==='ArrowUp')py=Math.max(0,py-24);
   if(mode==='ai'&&e.key==='ArrowDown')py=Math.min(255,py+24);
  });
  c.addEventListener('mousemove',e=>{if(mode!=='ai'||!started)return;const r=c.getBoundingClientRect();py=Math.max(0,Math.min(255,(e.clientY-r.top)*c.height/r.height-42))});
  draw();
  cleanup=clearInput;
 }
 function resetBall(dir=1){ball={x:300,y:170,vx:4*dir,vy:(Math.random()-.5)*4}}
 showModePicker();
 cleanup=clearInput;
}
