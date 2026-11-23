'use strict';

function gameWhack(g){
  const b=baseBox();b.innerHTML='<div class="big-number">Whack time</div><div class="subtext">Tap the glowing critter. You have 20 seconds. Every five hits speeds up the next wave.</div>';
  const info=scoreLine([['Hits','0'],['Time','20s'],['Streak','0']]);b.appendChild(info);
  const grid=document.createElement('div');grid.className='whack-grid';const cells=[];
  let hits=0,seconds=20,active=-1,iv=null,timer=null,started=false,streak=0,bestStreak=0,spawnDelay=760;
  function status(){info.innerHTML='<span>Hits: <strong>'+hits+'</strong></span><span>Time: <strong>'+seconds+'s</strong></span><span>Streak: <strong>'+streak+'</strong></span>';}
  function spawn(){cells.forEach(function(c){c.classList.remove('mole');c.textContent='·';});active=Math.floor(Math.random()*9);cells[active].classList.add('mole');cells[active].textContent='🐹';}
  function stop(){clearInterval(iv);clearInterval(timer);started=false;active=-1;setBest(g,-hits);b.insertAdjacentHTML('beforeend','<div class="message">Final score: '+hits+' hits · Best streak: '+bestStreak+'.</div>');b.appendChild(button('Play again',function(){runGame(g);},true));}
  for(let i=0;i<9;i++){
    const cell=button('·',function(){
      if(!started)return;
      if(i===active){
        hits++;streak++;bestStreak=Math.max(bestStreak,streak);active=-1;
        if(hits%5===0){spawnDelay=Math.max(300,spawnDelay-85);clearInterval(iv);iv=setInterval(spawn,spawnDelay);flash('Speed increased! '+spawnDelay+' ms per target.');}
        cell.textContent='✨';cell.classList.remove('mole');status();
      }else{streak=0;cell.textContent='·';status();}
    });
    cell.className='whack-cell';cells.push(cell);grid.appendChild(cell);
  }
  b.appendChild(grid);
  b.appendChild(button('Start round',function(){
    if(started)return;clearInterval(iv);clearInterval(timer);
    hits=0;streak=0;bestStreak=0;seconds=20;spawnDelay=760;started=true;status();spawn();
    iv=setInterval(spawn,spawnDelay);
    timer=setInterval(function(){seconds--;status();if(seconds<=0)stop();},1000);
  },true));
  cleanup=function(){clearInterval(iv);clearInterval(timer);};
}
