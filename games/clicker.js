'use strict';

function gameClicker(g){
  const b=baseBox();let energy=0,power=1,auto=0,sec=30,iv=null,started=false,surgeUntil=0,surges=[],criticals=0,tapStreak=0,lastTapAt=0;
  const title=document.createElement('div');title.className='big-number';title.textContent='0';b.appendChild(title);
  const desc=document.createElement('div');desc.className='subtext';desc.textContent='Tap the cosmic core to collect energy. Timed surges double your gains.';b.appendChild(desc);
  const status=scoreLine([['Energy','0'],['Power','1 / tap'],['Time','30s'],['Surge','—']]);b.appendChild(status);
  const tap=button('🪐 TAP THE CORE',function(){if(!started)return;const now=Date.now();tapStreak=now-lastTapAt<420?tapStreak+1:1;lastTapAt=now;const critical=Math.random()<Math.min(.22,.05+tapStreak*.004);energy+=power*(now<surgeUntil?2:1)*(critical?4:1);if(critical){criticals++;flash('Critical tap! 4x energy.');}update();},true);
  tap.style.fontSize='22px';tap.style.padding='23px 30px';tap.style.borderRadius='18px';b.appendChild(tap);
  const shop=document.createElement('div');shop.className='mobile-controls';b.appendChild(shop);
  const powerBtn=button('Upgrade tap · 25',function(){const cost=25*power;if(started&&energy>=cost){energy-=cost;power++;update();}else flash('Need more energy or start a run');});shop.appendChild(powerBtn);
  const autoBtn=button('Auto miner · 60',function(){const cost=60*(auto+1);if(started&&energy>=cost){energy-=cost;auto++;update();}else flash('Need more energy or start a run');});shop.appendChild(autoBtn);
  function update(){
    title.textContent=energy.toLocaleString();
    status.innerHTML='<span>Energy: <strong>'+energy+'</strong></span><span>Power: <strong>'+power+' / tap</strong></span><span>Time: <strong>'+sec+'s</strong></span><span>Surge: <strong>'+(Date.now()<surgeUntil?'2x LIVE':'—')+'</strong></span><span>Criticals: <strong>'+criticals+'</strong></span>';
    powerBtn.textContent='Upgrade tap · '+(25*power);autoBtn.textContent='Auto miner · '+(60*(auto+1));
  }
  b.appendChild(button('Start 30 seconds',function(){
    if(started)return;clearInterval(iv);energy=0;power=1;auto=0;sec=30;surgeUntil=0;surges=[];criticals=0;tapStreak=0;lastTapAt=0;started=true;
    desc.textContent='Buy boosts to earn more per second. Watch for 2x cosmic surges at 20 and 10 seconds.';
    update();
    iv=setInterval(function(){
      sec--;
      if((sec===20||sec===10)&&!surges.includes(sec)){surges.push(sec);surgeUntil=Date.now()+2500;flash('Cosmic surge · 2x energy for 2.5 seconds!');}
      energy+=auto*2*(Date.now()<surgeUntil?2:1);update();
      if(sec<=0){clearInterval(iv);started=false;setBest(g,-energy);desc.textContent='Run complete — you collected '+energy+' energy!';b.appendChild(button('Start a new run',()=>runGame(g),true));}
    },1000);
  },true));
  update();cleanup=()=>clearInterval(iv);
}
