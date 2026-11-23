'use strict';

function gameReaction(g){
  const b=baseBox();
  const title=document.createElement('div');title.className='big-number';title.textContent='Ready?';b.appendChild(title);
  const sub=document.createElement('div');sub.className='subtext';sub.textContent='Best of three. Wait for green, then react fast.';b.appendChild(sub);
  const status=scoreLine([['Attempt','0 / 3'],['Average','—'],['False starts','0']]);b.appendChild(status);
  let state='idle',timer=null,start=0,round=0,total=0,best=Infinity,falseStarts=0;
  let btn=null;
  function update(){status.innerHTML='<span>Attempt: <strong>'+round+' / 3</strong></span><span>Average: <strong>'+(round?Math.round(total/round)+' ms':'—')+'</strong></span><span>False starts: <strong>'+falseStarts+'</strong></span>';}
  function startAttempt(){clearTimeout(timer);state='wait';btn.textContent='Wait for green…';btn.classList.remove('hot');title.textContent='Wait…';sub.textContent='Do not click early.';update();timer=setTimeout(function(){state='go';start=performance.now();btn.textContent='CLICK NOW!';btn.classList.add('hot');title.textContent='GO!';sub.textContent='Attempt '+(round+1)+' of 3 — tap as quickly as you can.';},850+Math.random()*2000);}
  function beginSeries(){clearTimeout(timer);round=0;total=0;best=Infinity;falseStarts=0;state='between';title.textContent='Three-attempt challenge';sub.textContent='Your average reaction time is the final score.';update();startAttempt();}
  function press(){
    if(state==='idle'||state==='done'){beginSeries();return;}
    if(state==='between'){startAttempt();return;}
    if(state==='wait'){clearTimeout(timer);falseStarts++;state='between';btn.textContent='Try again';btn.classList.remove('hot');title.textContent='False start';sub.textContent='Wait until the panel turns green. This attempt does not count.';update();return;}
    if(state==='go'){
      const ms=Math.round(performance.now()-start);round++;total+=ms;best=Math.min(best,ms);state='between';btn.classList.remove('hot');update();
      if(round===3){state='done';const average=Math.round(total/3);setBest(g,average);title.textContent=average+' ms average';sub.textContent='Best: '+best+' ms · Three attempts complete. '+(average<260?'Elite reactions!':average<330?'Nice reflexes.':'Run it back and beat your average.');btn.textContent='Play again';}
      else{title.textContent=ms+' ms';sub.textContent='Attempt recorded. '+(3-round)+' more to go.';btn.textContent='Next attempt';}
    }
  }
  btn=button('Start challenge',press,true);b.appendChild(btn);
  cleanup=function(){clearTimeout(timer);};
}
