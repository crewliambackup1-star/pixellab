'use strict';

function gameTrivia(g){
  const b=baseBox(),qs=[
    ['Which planet is known as the Red Planet?',['Mars','Venus','Jupiter','Mercury'],0],['How many sides does a hexagon have?',['5','6','7','8'],1],['What is the largest ocean on Earth?',['Atlantic','Indian','Pacific','Arctic'],2],['Which instrument has keys, pedals, and strings?',['Flute','Piano','Drum','Trumpet'],1],['What is H₂O commonly called?',['Oxygen','Salt','Water','Hydrogen'],2],['Which animal is the fastest land runner?',['Lion','Horse','Cheetah','Wolf'],2],['How many minutes are in two hours?',['100','110','120','140'],2],['Which shape has three sides?',['Triangle','Square','Trapezoid','Pentagon'],0],['Which gas do plants absorb from the air?',['Oxygen','Carbon dioxide','Helium','Neon'],1],['What is the closest star to Earth?',['Sirius','The Sun','Polaris','Vega'],1],['Which continent is the Sahara Desert in?',['Asia','Africa','Europe','Australia'],1],['What is 9 × 7?',['56','63','72','79'],1],['Which bird is known for mimicking sounds?',['Penguin','Eagle','Parrot','Ostrich'],2],['Which material is attracted to a magnet?',['Iron','Wood','Glass','Paper'],0],['How many colors are traditionally named in a rainbow?',['5','6','7','8'],2]
  ];
  let list=qs.slice().sort(()=>Math.random()-.5).slice(0,10),idx=0,score=0,correct=0,streak=0,bestStreak=0,finished=false;
  const title=document.createElement('div');title.className='big-number';title.style.fontSize='36px';b.appendChild(title);
  const question=document.createElement('div');question.className='subtext';question.style.fontSize='18px';b.appendChild(question);
  const status=scoreLine([['Question','1 / 10'],['Points','0'],['Streak','0']]);b.appendChild(status);
  const options=document.createElement('div');options.style.display='grid';options.style.gridTemplateColumns='repeat(2,minmax(115px,200px))';options.style.gap='9px';b.appendChild(options);
  let lifelineUsed=false;
  const lifeline=button('50/50 lifeline',()=>{if(finished||lifelineUsed||idx>=list.length)return;lifelineUsed=true;const wrong=list[idx][1].map((_,i)=>i).filter(i=>i!==list[idx][2]);for(let n=0;n<2;n++){const pick=Math.floor(Math.random()*wrong.length);options.children[wrong.splice(pick,1)[0]].disabled=true;}lifeline.textContent='50/50 used';lifeline.disabled=true;});b.appendChild(lifeline);
  function render(){
    if(idx>=list.length){
      finished=true;lifeline.disabled=true;title.textContent=score+' points';question.textContent=correct+'/10 correct · Best streak '+bestStreak+'. '+(correct>=8?'Excellent trivia brain!':correct>=5?'Nice run — try to beat your score.':'Run it back and see what you remember.');
      options.innerHTML='';status.innerHTML='<span>Correct: <strong>'+correct+' / 10</strong></span><span>Points: <strong>'+score+'</strong></span>';
      setBest(g,-score);b.appendChild(button('Play again',()=>runGame(g),true));return;
    }
    title.textContent='Question '+(idx+1);question.textContent=list[idx][0];lifeline.disabled=lifelineUsed;
    status.innerHTML='<span>Question: <strong>'+(idx+1)+' / 10</strong></span><span>Points: <strong>'+score+'</strong></span><span>Streak: <strong>'+streak+'</strong></span>';
    options.innerHTML='';
    list[idx][1].forEach((text,i)=>options.appendChild(button(text,()=>{
      if(finished)return;
      if(i===list[idx][2]){correct++;streak++;bestStreak=Math.max(bestStreak,streak);score+=1+Math.floor(streak/3);}
      else streak=0;
      idx++;render();
    })));
  }
  render();
}
