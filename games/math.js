'use strict';

function gameMath(g){
  const b=baseBox();let score=0,sec=30,iv=null,started=false,answer=0,streak=0,bestStreak=0,correct=0,misses=0;
  const title=document.createElement('div');title.className='big-number';title.textContent='Math Sprint';b.appendChild(title);
  const question=document.createElement('div');question.className='subtext';question.style.fontSize='18px';b.appendChild(question);
  const status=scoreLine([['Points','0'],['Time','30s'],['Streak','0']]);b.appendChild(status);
  const choices=document.createElement('div');choices.style.display='grid';choices.style.gridTemplateColumns='repeat(2,minmax(100px,175px))';choices.style.gap='10px';b.appendChild(choices);
  function update(){status.innerHTML='<span>Points: <strong>'+score+'</strong></span><span>Time: <strong>'+sec+'s</strong></span><span>Streak: <strong>'+streak+'</strong></span>';}
  function next(){
    const level=1+Math.floor(correct/5);let a,bv,op=Math.floor(Math.random()*4);
    if(op===0){a=1+Math.floor(Math.random()*(20+level*8));bv=1+Math.floor(Math.random()*(20+level*8));answer=a+bv;question.textContent=a+' + '+bv+' = ?';}
    else if(op===1){a=5+Math.floor(Math.random()*(25+level*9));bv=1+Math.floor(Math.random()*a);answer=a-bv;question.textContent=a+' − '+bv+' = ?';}
    else if(op===2){a=2+Math.floor(Math.random()*(8+level));bv=2+Math.floor(Math.random()*(8+level));answer=a*bv;question.textContent=a+' × '+bv+' = ?';}
    else{bv=2+Math.floor(Math.random()*(6+level));answer=2+Math.floor(Math.random()*(8+level));a=bv*answer;question.textContent=a+' ÷ '+bv+' = ?';}
    const opts=new Set([answer]);while(opts.size<4)opts.add(Math.max(0,answer+Math.floor(Math.random()*21)-10));
    const arr=[...opts].sort(()=>Math.random()-.5);choices.innerHTML='';
    arr.forEach(v=>choices.appendChild(button(String(v),()=>{
      if(!started)return;
      if(v===answer){correct++;streak++;bestStreak=Math.max(bestStreak,streak);score+=1+Math.floor(streak/4);title.textContent='+'+(1+Math.floor(streak/4));next();}
      else{misses++;streak=0;title.textContent='Keep going';question.textContent='Not quite — streak reset. Try the next one.';next();}
      update();
    })));
  }
  function finish(){clearInterval(iv);started=false;setBest(g,-score);question.textContent='Time! '+correct+' correct, '+misses+' misses, best streak '+bestStreak+'.';choices.innerHTML='';b.appendChild(button('Run it back',()=>runGame(g),true));}
  b.appendChild(button('Start 30 seconds',()=>{if(started)return;clearInterval(iv);started=true;score=0;sec=30;streak=0;bestStreak=0;correct=0;misses=0;next();update();iv=setInterval(()=>{sec--;update();if(sec<=0)finish();},1000);},true));
  cleanup=()=>clearInterval(iv);
}
