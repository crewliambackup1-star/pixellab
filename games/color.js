'use strict';

function gameColor(g){
 const b=baseBox(),names=['CORAL','MINT','VIOLET','GOLD'],colors=['#ff729f','#5fe3d0','#a48bff','#ffc66d'];let score=0,sec=25,iv=null,started=false,target=0;
 const label=document.createElement('div');label.className='big-number';label.style.fontSize='45px';b.appendChild(label);const prompt=document.createElement('div');prompt.className='subtext';prompt.textContent='Choose the ink color — not the word.';b.appendChild(prompt);const status=scoreLine([['Correct','0'],['Time','25s']]);b.appendChild(status);
 const options=document.createElement('div');options.style.display='grid';options.style.gridTemplateColumns='repeat(2,minmax(115px,160px))';options.style.gap='10px';b.appendChild(options);
 function next(){target=Math.floor(Math.random()*4);const word=Math.floor(Math.random()*4);label.textContent=names[word];label.style.color=colors[target];options.innerHTML='';names.forEach((name,i)=>{const c=button(name,()=>{if(!started)return;if(i===target)score++;else score=Math.max(0,score-1);status.innerHTML='<span>Correct: <strong>'+score+'</strong></span><span>Time: <strong>'+sec+'s</strong></span>';next()});c.style.color=colors[i];options.appendChild(c)})}
 b.appendChild(button('Start 25 seconds',()=>{if(started)return;started=true;score=0;sec=25;next();iv=setInterval(()=>{sec--;status.innerHTML='<span>Correct: <strong>'+score+'</strong></span><span>Time: <strong>'+sec+'s</strong></span>';if(sec<=0){clearInterval(iv);started=false;setBest(g,-score);prompt.textContent='Time! Final score: '+score+'.';options.innerHTML='';b.appendChild(button('Play again',()=>runGame(g),true))}},1000)},true));cleanup=()=>clearInterval(iv);
}
