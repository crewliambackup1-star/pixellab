'use strict';

function gameTTT(g){
 const b=baseBox();let mode=null,board=Array(9).fill(''),over=false,turn='X',aiTimer=null;
 const wins=[[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6]];
 // Include the other rows and columns without relying on board-specific markup.
 wins.push([3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8]);
 const winner=p=>wins.some(line=>line.every(i=>board[i]===p));
 function modeButton(label,description,next,disabled=false){
  const wrap=document.createElement('div');wrap.className='mp-mode-card';
  const btn=button(label,()=>{if(!disabled)startRound(next)});
  btn.className='mp-mode-button';btn.disabled=disabled;wrap.append(btn);
  const note=document.createElement('p');note.className='mp-mode-note';note.textContent=description;wrap.append(note);return wrap;
 }
 function showModePicker(){
  clearTimeout(aiTimer);mode=null;b.innerHTML='';
  const title=document.createElement('div');title.className='big-number mp-title';title.textContent='Choose your game mode';b.append(title);
  const choices=document.createElement('div');choices.className='mp-mode-picker';
  choices.append(modeButton('🤖 Play vs AI','Challenge the computer. You play X.','ai'));
  choices.append(modeButton('👥 2 Players · Same Device','Take turns on this screen. X goes first.','local'));
  choices.append(modeButton('🌐 Online room','Invite someone on another device — coming soon.','online',true));
  b.append(choices);
 }
 function startRound(nextMode=mode){
  clearTimeout(aiTimer);mode=nextMode;board=Array(9).fill('');over=false;turn='X';renderBoard();
 }
 function renderBoard(){
  b.innerHTML='';
  const title=document.createElement('div');title.className='big-number mp-title';b.append(title);
  const grid=document.createElement('div');grid.className='ttt-grid';
  const cells=[];
  function draw(){
   title.textContent=over?title.textContent:mode==='ai'?(turn==='X'?'Your turn — X':'Computer thinking…'):(turn==='X'?'Player 1’s turn — X':'Player 2’s turn — O');
   cells.forEach((c,i)=>{c.textContent=board[i];c.className='ttt-cell'+(board[i]==='O'?' o':'');c.disabled=!!board[i]||over||(mode==='ai'&&turn==='O')});
  }
  function finish(msg){
   over=true;title.textContent=msg;draw();
   if(mode==='ai'){const score=msg.includes('You win')?1:msg.includes('Draw')?2:3;setBest(g,score)}
   const actions=document.createElement('div');actions.className='mp-actions';
   actions.append(button('Play again',()=>startRound(mode),true),button('Change mode',showModePicker));
   b.append(actions);
  }
  function minimax(next,depth){
   if(winner('O'))return 10-depth;
   if(winner('X'))return depth-10;
   if(board.every(Boolean))return 0;
   let best=next==='O'?-Infinity:Infinity;
   for(let i=0;i<9;i++)if(!board[i]){
    board[i]=next;const score=minimax(next==='O'?'X':'O',depth+1);board[i]='';
    best=next==='O'?Math.max(best,score):Math.min(best,score);
   }
   return best;
  }
  function aiMove(){
   if(over||mode!=='ai'||turn!=='O')return;
   let best=-Infinity,move=-1;
   for(let i=0;i<9;i++)if(!board[i]){
    board[i]='O';const score=minimax('X',0);board[i]='';
    if(score>best){best=score;move=i}
   }
   if(move>=0)applyMove(move,'O');
  }
  function applyMove(i,p){
   board[i]=p;draw();
   if(winner(p)){finish(mode==='ai'?(p==='X'?'You win!':'Computer wins!'):(p==='X'?'Player 1 wins!':'Player 2 wins!'));return}
   if(board.every(Boolean)){finish('Draw game');return}
   turn=p==='X'?'O':'X';draw();
   if(mode==='ai'&&turn==='O')aiTimer=setTimeout(aiMove,280);
  }
  for(let i=0;i<9;i++){
   const c=button('',()=>{if(over||board[i]||(mode==='ai'&&turn!=='X'))return;applyMove(i,turn)});
   c.className='ttt-cell';cells.push(c);grid.append(c);
  }
  b.append(grid);
  const actions=document.createElement('div');actions.className='mp-actions';
  actions.append(button('Reset board',()=>startRound(mode)),button('Change mode',showModePicker));b.append(actions);
  draw();
 }
 showModePicker();
 cleanup=()=>clearTimeout(aiTimer);
}
