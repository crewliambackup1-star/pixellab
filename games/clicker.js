'use strict';

function gameClicker(g){
 const b=baseBox();let energy=0,power=1,auto=0,sec=30,iv=null,started=false;
 const title=document.createElement('div');title.className='big-number';title.textContent='0';b.appendChild(title);
 const desc=document.createElement('div');desc.className='subtext';desc.textContent='Tap the cosmic core to collect energy.';b.appendChild(desc);
 const tap=button('🪐 TAP THE CORE',()=>{if(!started)return;energy+=power;update()});tap.style.fontSize='22px';tap.style.padding='23px 30px';tap.style.borderRadius='18px';b.appendChild(tap);
 const status=scoreLine([['Energy','0'],['Power','1 / tap'],['Time','30s']]);b.appendChild(status);
 const shop=document.createElement('div');shop.className='mobile-controls';b.appendChild(shop);
 const powerBtn=button('Upgrade tap · 25',()=>{const cost=25*power;if(started&&energy>=cost){energy-=cost;power++;update()}else flash('Need more energy or start a run')});shop.appendChild(powerBtn);
 const autoBtn=button('Auto miner · 60',()=>{const cost=60*(auto+1);if(started&&energy>=cost){energy-=cost;auto++;update()}else flash('Need more energy or start a run')});shop.appendChild(autoBtn);
 function update(){title.textContent=energy.toLocaleString();status.innerHTML='<span>Energy: <strong>'+energy+'</strong></span><span>Power: <strong>'+power+' / tap</strong></span><span>Time: <strong>'+sec+'s</strong></span>';powerBtn.textContent='Upgrade tap · '+(25*power);autoBtn.textContent='Auto miner · '+(60*(auto+1))}
 b.appendChild(button('Start 30 seconds',()=>{if(started)return;energy=0;power=1;auto=0;sec=30;started=true;desc.textContent='Buy boosts to earn more per second.';update();iv=setInterval(()=>{energy+=auto*2;sec--;update();if(sec<=0){clearInterval(iv);started=false;setBest(g,-energy);desc.textContent='Run complete — you collected '+energy+' energy!';b.appendChild(button('Start a new run',()=>runGame(g),true))}},1000)},true));update();cleanup=()=>clearInterval(iv);
}
