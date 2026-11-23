'use strict';

function gameSimon(g){
  const b=baseBox(),colors=[['#ff729f','Coral'],['#60dfcd','Mint'],['#a48bff','Violet'],['#ffc66d','Gold']];
  let seq=[],step=0,playing=false,started=false,best=0,timers=[],mistakes=0,echoUsed=false;
  const label=document.createElement('div');label.className='big-number';label.style.fontSize='38px';label.textContent='Simon says…';b.appendChild(label);
  const sub=document.createElement('div');sub.className='subtext';sub.textContent='Watch, remember, repeat. The pattern speeds up as you advance.';b.appendChild(sub);
  const status=scoreLine([['Round','0'],['Best this run','0'],['Mistakes','0']]);b.appendChild(status);
  const grid=document.createElement('div');grid.className='simon-grid';grid.style.gridTemplateColumns='repeat(2,minmax(110px,155px))';grid.style.gap='12px';b.appendChild(grid);
  const cells=colors.map((c,i)=>{
    const el=button(c[1],()=>tap(i));el.className='simon-pad';el.style.background=c[0];el.style.minHeight='95px';el.style.color='#131421';el.style.fontWeight='900';el.style.fontSize='14px';grid.appendChild(el);return el;
  });
  function later(fn,ms){const t=setTimeout(fn,ms);timers.push(t);return t;}
  function clearTimers(){timers.forEach(clearTimeout);timers=[];}
  function light(i,on){cells[i].style.filter=on?'brightness(1.7)':'brightness(1)';cells[i].style.transform=on?'scale(1.04)':'scale(1)';}
  function update(){status.innerHTML='<span>Round: <strong>'+seq.length+'</strong></span><span>Best this run: <strong>'+best+'</strong></span><span>Mistakes: <strong>'+mistakes+'</strong></span>';}
  function playSequence(){
    playing=true;step=0;label.textContent='Watch closely';
    const delayStart=420,gap=Math.max(260,520-Math.max(0,seq.length-1)*18),flashMs=Math.max(150,gap*.52);
    seq.forEach((v,n)=>{later(()=>light(v,true),delayStart+n*gap);later(()=>light(v,false),delayStart+n*gap+flashMs);});
    later(()=>{playing=false;label.textContent='Your turn!';sub.textContent='Repeat all '+seq.length+' colors in order.';},delayStart+seq.length*gap);
  }
  function start(){clearTimers();seq=[];step=0;best=0;mistakes=0;echoUsed=false;started=true;nextRound();}
  function nextRound(){seq.push(Math.floor(Math.random()*4));update();playSequence();}
  function tap(i){
    if(!started||playing)return;light(i,true);later(()=>light(i,false),140);
    if(seq[step]!==i){
      mistakes++;
      if(seq.length>=5&&!echoUsed){echoUsed=true;step=0;label.textContent='Echo Save!';sub.textContent='One free retry — watch the same sequence again.';update();later(playSequence,700);return;}
      started=false;label.textContent='Sequence broken!';sub.textContent='You reached round '+seq.length+'. Try to beat your best run.';
      update();setBest(g,-best);b.appendChild(button('Play again',start,true));return;
    }
    step++;
    if(step===seq.length){best=seq.length;label.textContent='Perfect!';sub.textContent='Next round adds one more color and speeds up the pattern.';update();later(nextRound,650);}
  }
  b.appendChild(button('Start sequence',start,true));
  cleanup=function(){clearTimers();};
}
