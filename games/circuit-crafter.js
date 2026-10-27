'use strict';

function gameCircuitCrafter(g){
 const b=baseBox(),N=5;let tiles=[],moves=0,over=false;const source=10,goal=14;
 const status=scoreLine([['Moves','0'],['Powered tiles','0 / 25'],['Goal','Power the exit']]);b.appendChild(status);
 const hint=document.createElement('div');hint.className='subtext';hint.textContent='Rotate each tile until the current flows from the cyan source to the violet exit.';b.appendChild(hint);
 const grid=document.createElement('div');grid.className='circuit-grid';grid.style.display='grid';grid.style.gridTemplateColumns='repeat(5,minmax(42px,60px))';grid.style.gap='6px';grid.style.padding='10px';grid.style.borderRadius='14px';grid.style.background='#101a26';b.appendChild(grid);
 const cells=[];
 function rotateDir(d){return({N:'E',E:'S',S:'W',W:'N'})[d]}
 function rotatePorts(arr,rot){let a=arr.slice();for(let i=0;i<rot;i++)a=a.map(rotateDir);return a}
 function dirs(t,rot=t.rot){return rotatePorts(t.base,rot)}
 function same(a,b){return a.length===b.length&&a.every(x=>b.includes(x))}
 function kindFor(ports){if(ports.length===1)return'end';if(ports.length===2){return((ports.includes('N')&&ports.includes('S'))||(ports.includes('E')&&ports.includes('W')))?'straight':'elbow'}return ports.length===4?'cross':'tee'}
 function basePorts(kind){return kind==='straight'?['N','S']:kind==='elbow'?['N','E']:kind==='end'?['N']:kind==='tee'?['N','E','W']:['N','E','S','W']}
 function glyph(ports){const key=['N','E','S','W'].filter(d=>ports.includes(d)).join('');return({'NS':'│','EW':'─','NE':'└','ES':'┌','SW':'┐','NW':'┘','N':'╵','E':'╶','S':'╷','W':'╴','NES':'├','ESW':'┬','NSW':'┤','NEW':'┴','NESW':'┼'})[key]||'·'}
 function direction(a,b){const dx=b%N-a%N,dy=Math.floor(b/N)-Math.floor(a/N);return dx===1?'E':dx===-1?'W':dy===1?'S':'N'}
 const path=[10,11,6,7,8,13,18,19,14];
 function idealPorts(index){const pos=path.indexOf(index),out=[];if(pos>0)out.push(direction(index,path[pos-1]));if(pos<path.length-1)out.push(direction(index,path[pos+1]));return out}
 function reset(){
  moves=0;over=false;const onPath=new Set(path);tiles=Array.from({length:25},(_,i)=>{let required=onPath.has(i)?idealPorts(i):null,kind;if(required){kind=kindFor(required)}else kind=Math.random()<.52?'straight':Math.random()<.82?'elbow':'end';const base=basePorts(kind),correct=required?Array.from({length:4},(_,rot)=>rot).find(rot=>same(rotatePorts(base,rot),required)):Math.floor(Math.random()*4);let rot=correct;if(required){const options=[0,1,2,3].filter(r=>!same(rotatePorts(base,r),required));rot=options[Math.floor(Math.random()*options.length)]}else rot=Math.floor(Math.random()*4);return{kind,base,rot}});draw()}
 function powered(){const seen=new Set([source]),queue=[source];for(let qi=0;qi<queue.length;qi++){const i=queue[qi],x=i%N,y=Math.floor(i/N);dirs(tiles[i]).forEach(d=>{const nx=x+(d==='E'?1:d==='W'?-1:0),ny=y+(d==='S'?1:d==='N'?-1:0);if(nx<0||nx>=N||ny<0||ny>=N)return;const j=ny*N+nx,opp=({N:'S',S:'N',E:'W',W:'E'})[d];if(dirs(tiles[j]).includes(opp)&&!seen.has(j)){seen.add(j);queue.push(j)}})}return seen}
 function draw(){const on=powered();cells.forEach((el,i)=>{el.textContent=glyph(dirs(tiles[i]));el.style.background=on.has(i)?'linear-gradient(140deg,#174a49,#182c3a)':i===source?'#164c50':i===goal?'#4a315f':'#24273a';el.style.color=on.has(i)?'#7af3df':'#d1c9f1';el.style.borderColor=on.has(i)?'#5fe3d0':i===source?'#5fe3d0':i===goal?'#a48bff':'#3d4158';el.style.boxShadow=on.has(i)?'0 0 13px #5fe3d01c':'none';el.title=(i===source?'Power source · ':i===goal?'Exit · ':'')+'Click to rotate';el.disabled=over});status.innerHTML='<span>Moves: <strong>'+moves+'</strong></span><span>Powered tiles: <strong>'+on.size+' / 25</strong></span><span>Goal: <strong>'+(on.has(goal)?'Reached!':'Power the exit')+'</strong></span>';if(on.has(goal)&&!over){over=true;hint.textContent='Circuit complete! You powered the exit in '+moves+' rotations.';setBest(g,moves);b.appendChild(button('Build another circuit',()=>runGame(g),true));cells.forEach(el=>el.disabled=true)}}
 function tap(i){if(over)return;tiles[i].rot=(tiles[i].rot+1)%4;moves++;draw()}
 for(let i=0;i<25;i++){const el=button('',()=>tap(i));el.style.aspectRatio='1';el.style.minWidth='0';el.style.padding='0';el.style.fontSize='clamp(21px,4vw,29px)';el.style.fontWeight='900';el.style.borderRadius='10px';el.style.border='1px solid #3d4158';cells.push(el);grid.appendChild(el)}
 b.appendChild(button('Shuffle circuit',reset));reset();
}
