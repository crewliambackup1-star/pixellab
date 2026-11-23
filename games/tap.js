'use strict';

function gameTap(g){
  const b=baseBox();b.innerHTML='<div class="big-number">Tap Frenzy</div><div class="subtext">Tap as fast as you can. Watch for two short 2x surge windows.</div>';
  const info=scoreLine([['Points','0'],['Time','10s'],['Surge','Ready']]);b.appendChild(info);
  let score=0,sec=10,iv=null,started=false,bonusUntil=0,bonusWindows=0;
  function update(){const active=Date.now()<bonusUntil;info.innerHTML='<span>Points: <strong>'+score+'</strong></span><span>Time: <strong>'+sec+'s</strong></span><span>Surge: <strong>'+(active?'2x LIVE':'—')+'</strong></span>';}
  const tap=button('TAP!',function(){if(!started)return;score+=Date.now()<bonusUntil?2:1;update();tap.style.transform='scale(.96)';setTimeout(function(){tap.style.transform='';},60);},true);
  tap.style.fontSize='26px';tap.style.padding='24px 55px';b.appendChild(tap);
  b.appendChild(button('Start 10 seconds',function(){
    if(started)return;clearInterval(iv);score=0;sec=10;bonusUntil=0;bonusWindows=0;started=true;update();
    iv=setInterval(function(){
      sec--;
      if((sec===8||sec===4)&&bonusWindows<2){bonusUntil=Date.now()+1800;bonusWindows++;flash('Tap Frenzy · 2x surge!');}
      update();
      if(sec<=0){clearInterval(iv);started=false;setBest(g,-score);b.insertAdjacentHTML('beforeend','<div class="message">You scored '+score+' points and caught '+bonusWindows+' surge windows. Try for a new personal best.</div>');b.appendChild(button('Again',function(){runGame(g);},true));}
    },1000);
  },true));
  cleanup=function(){clearInterval(iv);};
}
