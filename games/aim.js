'use strict';
function gameAim(g){
 const b=baseBox();b.innerHTML='<div class="big-number">10 targets</div><div class="subtext">Hit ten targets fast. Every third target is a golden bullseye worth triple points.</div>';
 const area=document.createElement('div');area.className='target-area';b.appendChild(area);
 let hits=0,points=0,start=0,t=null,streak=0,bestStreak=0,gold=false,started=false;
 const status=scoreLine([['Hits','0 / 10'],['Points','0'],['Streak','0']]);b.appendChild(status);
 const target=document.createElement('button');target.className='target hidden';target.setAttribute('aria-label','Hit target');area.appendChild(target);
 function update(){status.innerHTML='<span>Hits: <strong>'+hits+' / 10</strong></span><span>Points: <strong>'+points+'</strong></span><span>Streak: <strong>'+streak+'</strong></span>';}
 function spawn(){if(hits>=10)return;gold=hits>0&&hits%3===0;const scale=Math.max(.62,1-hits*.035);target.style.width=(50*scale)+'px';target.style.height=(50*scale)+'px';target.style.left=Math.random()*Math.max(1,area.clientWidth-50)+'px';target.style.top=Math.random()*Math.max(1,area.clientHeight-50)+'px';target.style.background=gold?'#ffc66d':'';target.style.boxShadow=gold?'0 0 26px #ffc66d':'';target.classList.toggle('gold-target',gold);target.setAttribute('aria-label',gold?'Golden bullseye · triple points':'Hit target');target.classList.remove('hidden');}
 function end(){clearInterval(t);started=false;target.classList.add('hidden');const ms=Math.round(performance.now()-start);setBest(g,ms);b.insertAdjacentHTML('beforeend','<div class="message">10 hits in '+(ms/1000).toFixed(2)+' seconds · '+points+' points · Best streak: '+bestStreak+'.</div>');b.appendChild(button('Run it back',()=>runGame(g),true));}
 target.addEventListener('click',()=>{if(!started)return;hits++;streak++;bestStreak=Math.max(bestStreak,streak);points+=gold?3:1;update();if(hits===10)end();else spawn();});
 b.appendChild(button('Start aiming',()=>{if(started)return;hits=0;points=0;streak=0;bestStreak=0;start=performance.now();started=true;b.querySelector('.big-number').textContent='Go!';update();spawn();t=setInterval(update,100);},true));
 cleanup=()=>clearInterval(t);
}