'use strict';

function gameConnect4(g){
 const b=baseBox();let mode=null,board=Array.from({length:42},()=>0),over=false,aiTimer=null,thinking=false;
 function modeButton(label,description,next,disabled=false){
  const wrap=document.createElement('div');wrap.className='mp-mode-card';
  const btn=button(label,()=>{if(!disabled)startRound(next)});btn.className='mp-mode-button';btn.disabled=disabled;wrap.append(btn);
  const note=document.createElement('p');note.className='mp-mode-note';note.textContent=description;wrap.append(note);return wrap;
 }
 function showModePicker(){
  clearTimeout(aiTimer);mode=null;b.innerHTML='';
  const title=document.createElement('div');title.className='big-number mp-title';title.textContent='Choose your game mode';b.append(title);
  const choices=document.createElement('div');choices.className='mp-mode-picker';
  choices.append(modeButton('🤖 Play vs AI','Try to connect four before the computer.','ai'));
  choices.append(modeButton('👥 2 Players · Same Device','Red and yellow take turns on this screen.','local'));
  choices.append(modeButton('🌐 Online room','Sign in and invite someone to play Connect Four across devices.','online',false));
  b.append(choices);
 }
 function startRound(nextMode=mode){
  if(nextMode==='online'){if(typeof window.PixelLabMultiplayer?.openOnlineConnectFour==='function')window.PixelLabMultiplayer.openOnlineConnectFour();else if(typeof flash==='function')flash('Online room services are not connected yet.');return;}
  clearTimeout(aiTimer);mode=nextMode;board=Array.from({length:42},()=>0);over=false;thinking=false;renderGame();
 }
 function renderGame(){
  b.innerHTML='';const msg=document.createElement('div');msg.className='big-number mp-title';msg.style.fontSize='28px';b.append(msg);
  const grid=document.createElement('div');grid.style.display='grid';grid.style.gridTemplateColumns='repeat(7,minmax(25px,44px))';grid.style.gap='5px';grid.style.padding='10px';grid.style.background='#202847';grid.style.borderRadius='16px';grid.style.width='max-content';grid.style.maxWidth='100%';grid.style.margin='0 auto';b.append(grid);
  const cols=[];for(let i=0;i<7;i++){const col=button('↓',()=>drop(i,1));col.className='connect-drop';col.style.background='#303450';grid.append(col);cols.push(col)}
  const cells=[];for(let i=0;i<42;i++){const el=document.createElement('div');el.className='connect-cell';el.style.aspectRatio='1';el.style.borderRadius='50%';el.style.background='#101423';el.style.border='2px solid #58607d';cells.push(el);grid.append(el)}
  function at(r,c){return r*7+c}
  function won(p){
   for(let r=0;r<6;r++)for(let c=0;c<7;c++)if(board[at(r,c)]===p){
    for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
     let n=1;for(let k=1;k<4;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=6||cc<0||cc>=7||board[at(rr,cc)]!==p)break;n++}
     for(let k=1;k<4;k++){const rr=r-dr*k,cc=c-dc*k;if(rr<0||rr>=6||cc<0||cc>=7||board[at(rr,cc)]!==p)break;n++}
     if(n>=4)return true;
    }
   }return false;
  }
  function rowFree(c){for(let r=5;r>=0;r--)if(!board[at(r,c)])return r;return -1}
  function draw(){
   cells.forEach((el,i)=>{el.style.background=board[i]===1?'#ff637f':board[i]===2?'#ffd166':'#101423';el.style.boxShadow=board[i]?'inset 0 2px 5px #0005':'';el.style.borderColor=board[i]?'#ffffff2b':'#58607d'});
   cols.forEach((c,i)=>c.disabled=over||rowFree(i)<0||(mode==='ai'&&thinking));
   if(!over)msg.textContent=mode==='ai'?(thinking?'AI thinking…':'Your turn — Red'):board.filter(Boolean).length%2===0?'Player 1’s turn — Red':'Player 2’s turn — Yellow';
  }
  function end(t){
   over=true;msg.textContent=t;if(mode==='ai')setBest(g,t==='You win!'?-3:t==='CPU wins!'?-1:-2);draw();msg.textContent=t;
   const actions=document.createElement('div');actions.className='mp-actions';
   actions.append(button('Play again',()=>startRound(mode),true),button('Change mode',showModePicker));b.append(actions);
  }
  function evaluateCandidate(cc){
   const rr=rowFree(cc);if(rr<0)return -Infinity;board[at(rr,cc)]=2;
   let score=(3-Math.abs(3-cc))*4;
   for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]])for(let offset=0;offset<4;offset++){
    const r0=rr-dr*offset,c0=cc-dc*offset,r3=r0+dr*3,c3=c0+dc*3;
    if(r0<0||r0>=6||c0<0||c0>=7||r3<0||r3>=6||c3<0||c3>=7)continue;
    let cpu=0,human=0;for(let k=0;k<4;k++){const v=board[at(r0+dr*k,c0+dc*k)];if(v===2)cpu++;if(v===1)human++}
    if(!human)score+=cpu===4?12000:cpu===3?65:cpu===2?12:1;
   }
   board[at(rr,cc)]=0;return score;
  }
  function chooseAI(){
   for(let cc=0;cc<7;cc++){const rr=rowFree(cc);if(rr>=0){board[at(rr,cc)]=2;const win=won(2);board[at(rr,cc)]=0;if(win)return cc}}
   for(let cc=0;cc<7;cc++){const rr=rowFree(cc);if(rr>=0){board[at(rr,cc)]=1;const block=won(1);board[at(rr,cc)]=0;if(block)return cc}}
   let best=-Infinity,moves=[];for(let cc=0;cc<7;cc++){const v=evaluateCandidate(cc);if(v>best){best=v;moves=[cc]}else if(v===best)moves.push(cc)}
   return moves.length?moves[Math.floor(Math.random()*moves.length)]:-1;
  }
  function drop(c,p){
   if(over||rowFree(c)<0||(mode==='ai'&&p===1&&thinking))return;
   const r=rowFree(c);board[at(r,c)]=p;draw();
   if(won(p)){end(mode==='ai'?(p===1?'You win!':'CPU wins!'):(p===1?'Player 1 wins!':'Player 2 wins!'));return}
   if(board.every(Boolean)){end('Draw game');return}
   if(mode==='ai'&&p===1){thinking=true;draw();aiTimer=setTimeout(()=>{if(over||!currentGame||mode!=='ai')return;thinking=false;const move=chooseAI();if(move>=0)drop(move,2);else draw()},330)}
  }
  draw();
  const actions=document.createElement('div');actions.className='mp-actions';actions.append(button('Reset game',()=>startRound(mode)),button('Change mode',showModePicker));b.append(actions);
 }
 showModePicker();cleanup=()=>clearTimeout(aiTimer);
}
