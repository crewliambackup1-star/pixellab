'use strict';

function gameColor(g){
  const b=baseBox(),names=['CORAL','MINT','VIOLET','GOLD'],colors=['#ff729f','#5fe3d0','#a48bff','#ffc66d'];
  let score=0,sec=25,iv=null,started=false,target=0,streak=0,bestStreak=0,rounds=0;
  const label=document.createElement('div');label.className='big-number';label.style.fontSize='45px';b.appendChild(label);
  const prompt=document.createElement('div');prompt.className='subtext';prompt.textContent='Choose the ink color — not the word. Build a streak for bonus points.';b.appendChild(prompt);
  const status=scoreLine([['Points','0'],['Time','25s'],['Streak','0']]);b.appendChild(status);
  const options=document.createElement('div');options.style.display='grid';options.style.gridTemplateColumns='repeat(2,minmax(115px,160px))';options.style.gap='10px';b.appendChild(options);
  function update(){status.innerHTML='<span>Points: <strong>'+score+'</strong></span><span>Time: <strong>'+sec+'s</strong></span><span>Streak: <strong>'+streak+'</strong></span>';}
  function next(){
    target=Math.floor(Math.random()*4);const word=Math.floor(Math.random()*4);label.textContent=names[word];label.style.color=colors[target];options.innerHTML='';
    names.forEach((name,i)=>{const c=button(name,()=>{
      if(!started)return;rounds++;
      if(i===target){streak++;bestStreak=Math.max(bestStreak,streak);score+=1+Math.floor(streak/4);}
      else{streak=0;score=Math.max(0,score-1);prompt.textContent='Wrong ink color — streak reset. Read the color, not the word.';}
      update();next();
    });c.style.color=colors[i];options.appendChild(c);});
  }
  b.appendChild(button('Start 25 seconds',()=>{
    if(started)return;clearInterval(iv);started=true;score=0;sec=25;streak=0;bestStreak=0;rounds=0;next();update();
    iv=setInterval(()=>{sec--;update();if(sec<=0){clearInterval(iv);started=false;setBest(g,-score);prompt.textContent='Time! '+rounds+' rounds · best streak '+bestStreak+' · '+score+' points.';options.innerHTML='';b.appendChild(button('Play again',()=>runGame(g),true));}},1000);
  },true));
  cleanup=()=>clearInterval(iv);
}
