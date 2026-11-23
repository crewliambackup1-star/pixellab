'use strict';

function gameMemory(g){
  const b=baseBox(),symbols=['🍋','🚀','🍀','🪐','🎸','🍉','🦊','💎'];
  const deck=[...symbols,...symbols].sort(()=>Math.random()-.5);
  let open=[],matched=0,moves=0,locked=false,seconds=60,iv=null,flipTimer=null,combo=0,started=false,ended=false;
  const info=scoreLine([['Moves','0'],['Pairs','0 / 8'],['Time','60s'],['Combo','0']]);b.appendChild(info);
  const grid=document.createElement('div');grid.className='memory-grid';b.appendChild(grid);
  function upd(){info.innerHTML='<span>Moves: <strong>'+moves+'</strong></span><span>Pairs: <strong>'+matched+' / 8</strong></span><span>Time: <strong>'+seconds+'s</strong></span><span>Combo: <strong>'+combo+'x</strong></span>';}
  function finish(won){
    if(ended)return;ended=true;locked=true;clearInterval(iv);clearTimeout(flipTimer);
    grid.querySelectorAll('button').forEach(function(card){card.disabled=true;});
    const message=document.createElement('div');message.className='message';
    message.textContent=won?'Board cleared in '+moves+' moves with a best combo of '+combo+'.':'Time is up · '+matched+' of 8 pairs found.';
    b.appendChild(message);if(won)setBest(g,moves);
    b.appendChild(button('Shuffle & play again',function(){runGame(g);},true));
  }
  function startClock(){if(started||ended)return;started=true;iv=setInterval(function(){seconds=Math.max(0,seconds-1);upd();if(seconds===0)finish(false);},1000);}
  function flip(i,el){
    if(locked||ended||el.classList.contains('matched')||open.includes(i))return;
    startClock();el.textContent=deck[i];el.classList.add('flipped');open.push(i);
    if(open.length!==2)return;
    moves++;locked=true;upd();const first=open[0],second=open[1];
    if(deck[first]===deck[second]){
      [first,second].forEach(function(ix){grid.children[ix].classList.add('matched');grid.children[ix].disabled=true;});
      open=[];matched++;combo++;seconds=Math.min(75,seconds+2);flash('Pair found! +2 seconds · combo '+combo+'x.');locked=false;upd();if(matched===8)finish(true);
    }else{
      combo=0;upd();flipTimer=setTimeout(function(){[first,second].forEach(function(ix){grid.children[ix].textContent='✦';grid.children[ix].classList.remove('flipped');});open=[];locked=false;},650);
    }
  }
  deck.forEach(function(_,i){const el=button('✦',function(){flip(i,el);});el.className='memory-card';grid.appendChild(el);});
  upd();cleanup=function(){clearInterval(iv);clearTimeout(flipTimer);};
}
