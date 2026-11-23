'use strict';

function gameMerge(g){
 const b=baseBox();let grid=Array(16).fill(0),over=false,score=0,lastBoard=null,lastScore=0,undoUsed=false,combo=0,bestCombo=0;
 const nums=document.createElement('div');nums.className='number-grid';
 const info=scoreLine([['Score','0'],['Best tile','2'],['Undo','Ready']]);b.appendChild(info);const cells=[];
 function spawn(){
  const empty=grid.map((v,i)=>v?-1:i).filter(i=>i>=0);
  if(empty.length)grid[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4;
 }
 function render(){
  cells.forEach((c,i)=>{const n=grid[i];c.textContent=n||'';c.className='tile'+(n?' v'+Math.min(n,2048):'');});
  info.innerHTML='<span>Score: <strong>'+score+'</strong></span><span>Best tile: <strong>'+Math.max(...grid,0)+'</strong></span><span>Merge streak: <strong>'+combo+'x</strong></span><span>Undo: <strong>'+(undoUsed?'Used':'Ready')+'</strong></span>'; 
 }
 for(let i=0;i<16;i++){const c=document.createElement('div');c.className='tile';cells.push(c);nums.appendChild(c);}
 b.appendChild(nums);spawn();spawn();render();
 function titleEnd(){over=true;setBest(g,-score);b.insertAdjacentHTML('beforeend','<div class="message">Board filled. Start a new run to chase a higher tile.</div>');b.appendChild(button('New board',()=>runGame(g),true));}
 function move(dir){
  if(over)return;const before=grid.slice(),scoreBefore=score;let changed=false,mergeCount=0;
  for(let row=0;row<4;row++){
   const ids=Array.from({length:4},(_,j)=>dir==='left'?row*4+j:dir==='right'?row*4+3-j:dir==='up'?j*4+row:(3-j)*4+row);
   const vals=ids.map(i=>grid[i]).filter(Boolean),out=[];
   for(let i=0;i<vals.length;i++){if(vals[i]===vals[i+1]){out.push(vals[i]*2);score+=vals[i]*2;i++;mergeCount++;}else out.push(vals[i]);}
   while(out.length<4)out.push(0);ids.forEach((id,j)=>{if(grid[id]!==out[j])changed=true;grid[id]=out[j];});
  }
  if(changed){if(mergeCount){combo++;bestCombo=Math.max(bestCombo,combo);score+=combo*5+Math.max(0,mergeCount-1)*15;}else combo=0;if(!undoUsed){lastBoard=before;lastScore=scoreBefore;undoButton.disabled=false;}spawn();render();if(!grid.some(v=>!v))titleEnd();}
 }
 installKeys(e=>{const d={'ArrowLeft':'left','ArrowRight':'right','ArrowUp':'up','ArrowDown':'down','a':'left','d':'right','w':'up','s':'down','A':'left','D':'right','W':'up','S':'down'}[e.key];if(d)move(d);});
 const controls=document.createElement('div');controls.className='mobile-controls';[['↑','up'],['←','left'],['↓','down'],['→','right']].forEach(([x,d])=>controls.appendChild(button(x,()=>move(d))));b.appendChild(controls);
 const undoButton=button('Undo last move (once)',function(){if(!lastBoard||undoUsed)return;grid=lastBoard;score=lastScore;lastBoard=null;undoUsed=true;undoButton.disabled=true;over=false;render();});undoButton.disabled=true;b.appendChild(undoButton);
 b.appendChild(button('New board',()=>runGame(g)));cleanup=()=>{};
}
