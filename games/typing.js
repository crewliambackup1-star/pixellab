'use strict';

function gameTyping(g){
  const b=baseBox(),words=['comet','pixel','orbit','puzzle','neon','rocket','arcade','crystal','future','turbo','level','quest','galaxy','matrix','jump','combo','power','dream','bonus','spark','keyboard','adventure'];
  let score=0,correctWords=0,sec=30,iv=null,started=false,streak=0,bestStreak=0,misses=0;
  const label=document.createElement('div');label.className='big-number';label.textContent='Ready?';b.appendChild(label);
  const info=scoreLine([['Points','0'],['Time','30s'],['Accuracy','—']]);b.appendChild(info);
  const input=document.createElement('input');input.className='type-input';input.placeholder='Type the word…';input.autocomplete='off';input.disabled=true;b.appendChild(input);
  const accuracy=function(){return Math.round(correctWords/Math.max(1,correctWords+misses)*100);};
  const update=function(){info.innerHTML='<span>Points: <strong>'+score+'</strong></span><span>Time: <strong>'+sec+'s</strong></span><span>Accuracy: <strong>'+accuracy()+'%</strong></span><span>Streak: <strong>'+streak+'</strong></span>';};
  const next=function(){const minLength=Math.min(4+Math.floor(correctWords/4),7);const pool=words.filter(function(word){return word.length>=minLength;});label.textContent=pool[Math.floor(Math.random()*pool.length)];};
  input.addEventListener('keydown',function(e){
    if(e.key!=='Enter'||!started)return;
    if(input.value.trim().toLowerCase()!==label.textContent){misses++;streak=0;input.value='';update();return;}
    correctWords++;streak++;bestStreak=Math.max(bestStreak,streak);score+=1+Math.floor(streak/5);if(streak%5===0){sec=Math.min(36,sec+2);flash('Five-word streak · +2 seconds!');}input.value='';next();update();
  });
  b.appendChild(button('Start 30 seconds',function(){
    if(started)return;clearInterval(iv);score=0;correctWords=0;streak=0;bestStreak=0;misses=0;sec=30;started=true;input.disabled=false;input.focus();next();update();
    iv=setInterval(function(){
      sec--;update();
      if(sec<=0){clearInterval(iv);started=false;input.disabled=true;setBest(g,-score);b.insertAdjacentHTML('beforeend','<div class="message">You earned '+score+' points, typed '+correctWords+' correct words, and reached a best streak of '+bestStreak+'. Accuracy: '+accuracy()+'%.</div>');b.appendChild(button('Try again',function(){runGame(g);},true));}
    },1000);
  },true));
  cleanup=function(){clearInterval(iv);};
}
