'use strict';

function gameScramble(g){
  const b=baseBox(),words=['planet','puzzle','rocket','pixel','galaxy','jungle','castle','winter','comet','orange','thunder','diamond','monster','journey','rainbow','keyboard','mystery','volcano','gravity','lantern','crystal','adventure'];
  let word='',score=0,sec=45,iv=null,started=false,used=[],streak=0,bestStreak=0,hintUsed=false;
  const label=document.createElement('div');label.className='big-number';label.textContent='Unscramble it';b.appendChild(label);
  const status=scoreLine([['Points','0'],['Time','45s'],['Streak','0']]);b.appendChild(status);
  const input=document.createElement('input');input.className='type-input';input.placeholder='Your answer…';input.autocomplete='off';input.disabled=true;b.appendChild(input);
  const hint=document.createElement('div');hint.className='subtext';b.appendChild(hint);
  function update(){status.innerHTML='<span>Points: <strong>'+score+'</strong></span><span>Time: <strong>'+sec+'s</strong></span><span>Streak: <strong>'+streak+'</strong></span>';}
  function next(){
    let remain=words.filter(w=>!used.includes(w));if(!remain.length){used=[];remain=words.slice();}
    word=remain[Math.floor(Math.random()*remain.length)];used.push(word);
    let mixed=word.split('');
    for(let i=mixed.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[mixed[i],mixed[j]]=[mixed[j],mixed[i]];}
    if(mixed.join('')===word&&mixed.length>1){const first=mixed.shift();mixed.push(first);}
    label.textContent=mixed.join('  ').toUpperCase();
    hint.textContent='First letter: '+word[0].toUpperCase()+' · '+word.length+' letters';
    hintUsed=false;hintButton.disabled=false;
  }
  function finish(){
    clearInterval(iv);started=false;input.disabled=true;hintButton.disabled=true;setBest(g,-score);
    hint.textContent='Time! You scored '+score+' points with a best streak of '+bestStreak+'.';
    b.appendChild(button('Play again',()=>runGame(g),true));
  }
  input.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&started){
      if(input.value.trim().toLowerCase()===word){
        correct();
      }else{
        streak=0;hint.textContent='Not quite — try another arrangement. Your streak resets on a miss.';input.value='';update();
      }
    }
  });
  function correct(){
    streak++;bestStreak=Math.max(bestStreak,streak);
    score+=hintUsed?1:1+Math.floor(streak/3);
    input.value='';next();update();input.focus();
  }
  const hintButton=button('Extra letter hint',function(){
    if(!started||hintUsed)return;
    hintUsed=true;hintButton.disabled=true;hint.textContent='Hint: the first two letters are '+word.slice(0,2).toUpperCase()+'. Hint used — this answer earns no streak bonus.';
  });
  b.appendChild(hintButton);hintButton.disabled=true;
  b.appendChild(button('Start 45 seconds',function(){
    if(started)return;clearInterval(iv);score=0;sec=45;streak=0;bestStreak=0;used=[];started=true;
    input.disabled=false;next();input.focus();update();
    iv=setInterval(function(){sec--;update();if(sec<=0)finish();},1000);
  },true));
  cleanup=function(){clearInterval(iv);};
}
